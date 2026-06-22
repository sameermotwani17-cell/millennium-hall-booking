import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isDemoMode, getDemoBookings, DEMO_EVENT } from '@/lib/demo-store'
import { sendTicketEmail } from '@/lib/email'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const EXPECTED_PIN = process.env.USHER_PIN ?? '0000'

const ResendSchema = z.object({
  bookingRef: z.string().trim().min(3).max(32),
})

export async function POST(req: NextRequest) {
  // 10 resends per admin IP per minute — generous for event-day use
  const rl = rateLimit(`resend:${clientIp(req)}`, 10, 60 * 1000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  if (req.headers.get('x-admin-pin') !== EXPECTED_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { bookingRef } = ResendSchema.parse(await req.json())
    const ref = bookingRef.toUpperCase()

    if (isDemoMode()) {
      const booking = getDemoBookings().get(ref)
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      await sendTicketEmail(booking, DEMO_EVENT.name)
      return NextResponse.json({ ok: true })
    }

    const { createServiceSupabase } = await import('@/lib/supabase/server')
    const supabase = createServiceSupabase()
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_ref', ref)
      .single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status === 'cancelled') return NextResponse.json({ error: 'Booking is cancelled' }, { status: 409 })

    const { data: event } = await supabase
      .from('events')
      .select('name')
      .eq('id', booking.event_id)
      .single()

    await sendTicketEmail(booking, event?.name ?? 'Afro Week 2026')
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string }
    if (e.name === 'ZodError') return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    console.error('[resend] error:', e.message)
    return NextResponse.json({ error: 'Failed to send email. Check Resend configuration.' }, { status: 500 })
  }
}
