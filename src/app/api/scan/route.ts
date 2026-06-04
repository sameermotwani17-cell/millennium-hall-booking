import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceSupabase } from '@/lib/supabase/server'

const ScanSchema = z.object({
  bookingRef: z.string(),
  pin: z.string(),
  usherName: z.string().optional().default('Usher'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bookingRef, pin, usherName } = ScanSchema.parse(body)

    if (pin !== process.env.USHER_PIN) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    const supabase = createServiceSupabase()
    const { data: booking } = await supabase
      .from('bookings').select('*').eq('booking_ref', bookingRef).single()

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    if (booking.status === 'scanned') {
      return NextResponse.json({
        error: 'Already scanned',
        scanned_at: booking.scanned_at,
        scanned_by: booking.scanned_by,
      }, { status: 409 })
    }
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Booking cancelled' }, { status: 410 })
    }

    await supabase.from('bookings')
      .update({ status: 'scanned', scanned_at: new Date().toISOString(), scanned_by: usherName })
      .eq('id', booking.id)

    await supabase.from('seats').update({ status: 'taken' }).in('id', booking.seat_ids)

    return NextResponse.json({
      valid: true,
      booking_ref: booking.booking_ref,
      attendee_name: booking.attendee_name,
      seats: booking.seat_ids,
      status: 'scanned',
    })
  } catch (err: unknown) {
    const e = err as { name?: string }
    if (e.name === 'ZodError') return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
