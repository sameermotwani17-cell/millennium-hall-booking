import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isDemoMode, createDemoBooking, DEMO_EVENT } from '@/lib/demo-store'
import { sendTicketEmail } from '@/lib/email'

const BookSchema = z.object({
  eventSlug: z.string().default('mh-2026-09-14'),
  name: z.string().trim().min(2).max(100).transform(v => v.replace(/\s+/g, ' ')),
  email: z.string().trim().email().transform(v => v.toLowerCase()),
  seatIds: z.array(z.string()).min(1).max(1),
})

export async function POST(req: NextRequest) {


  try {
    const body = await req.json()
    const { eventSlug, name, email, seatIds } = BookSchema.parse(body)

    if (isDemoMode()) {
      const { booking, error } = createDemoBooking({ name, email, seatIds })
      if (error) return NextResponse.json({ error }, { status: 409 })
      sendTicketEmail(booking, DEMO_EVENT.name).catch(err =>
        console.error(`[email] failed for demo booking ${booking.booking_ref}:`, err),
      )
      return NextResponse.json({ booking }, { status: 201 })
    }

    const { createServiceSupabase } = await import('@/lib/supabase/server')
    const { createBooking } = await import('@/lib/booking')

    const supabase = createServiceSupabase()
    const { data: event } = await supabase
      .from('events').select('*').eq('slug', eventSlug).single()
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    const { booking, error } = await createBooking({
      eventId: event.id, eventSlug, name, email, seatIds,
    })
    if (error) return NextResponse.json({ error }, { status: 409 })

    sendTicketEmail(booking, event.name).catch(err =>
      console.error(`[email] failed for ${booking.booking_ref}:`, err),
    )
    return NextResponse.json({ booking }, { status: 201 })
  } catch (err: unknown) {
    console.error('Book error:', err)
    const e = err as { name?: string; errors?: unknown }
    if (e.name === 'ZodError') return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
