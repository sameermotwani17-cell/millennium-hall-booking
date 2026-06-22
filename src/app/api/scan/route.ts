import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isDemoMode, getDemoBookings, getDemoSeats } from '@/lib/demo-store'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const EXPECTED_PIN = process.env.USHER_PIN ?? '0000'

const ScanSchema = z.object({
  bookingRef: z.string().trim().min(3).max(32),
  pin: z.string(),
  usherName: z.string().trim().max(80).optional().default('Usher'),
})

export async function POST(req: NextRequest) {
  // Brute-force PIN protection: 20 scan attempts per IP per minute
  const rl = rateLimit(`scan:${clientIp(req)}`, 20, 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  try {
    const body = await req.json()
    const { bookingRef, pin, usherName } = ScanSchema.parse(body)
    const ref = bookingRef.trim().toUpperCase()

    if (pin !== EXPECTED_PIN) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
    }

    if (isDemoMode()) {
      const bookings = getDemoBookings()
      const booking = bookings.get(ref)
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      if (booking.status === 'cancelled') return NextResponse.json({ error: 'Booking cancelled' }, { status: 410 })
      if (booking.status === 'scanned') {
        return NextResponse.json(
          { error: 'Already scanned – admitted by another usher', scanned_by: booking.scanned_by },
          { status: 409 },
        )
      }
      const updated = { ...booking, status: 'scanned' as const, scanned_at: new Date().toISOString(), scanned_by: usherName }
      bookings.set(ref, updated)
      getDemoSeats().forEach((s, id) => {
        if (booking.seat_ids.includes(id)) getDemoSeats().set(id, { ...s, status: 'taken' })
      })
      return NextResponse.json({ valid: true, booking_ref: booking.booking_ref, attendee_name: booking.attendee_name, seats: booking.seat_ids, status: 'scanned' })
    }

    const { createServiceSupabase } = await import('@/lib/supabase/server')
    const supabase = createServiceSupabase()
    const scannedAt = new Date().toISOString()

    // Atomic claim: only transitions confirmed → scanned.
    // If two admins hit this simultaneously, only one UPDATE matches .eq('status','confirmed').
    const { data: claimed } = await supabase
      .from('bookings')
      .update({ status: 'scanned', scanned_at: scannedAt, scanned_by: usherName })
      .eq('booking_ref', ref)
      .eq('status', 'confirmed')
      .select('booking_ref, attendee_name, seat_ids')
      .maybeSingle()

    if (!claimed) {
      // Either already scanned, cancelled, or not found — look up to give a precise error
      const { data: existing } = await supabase
        .from('bookings')
        .select('status, scanned_by')
        .eq('booking_ref', ref)
        .maybeSingle()

      if (!existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      if (existing.status === 'scanned') {
        return NextResponse.json(
          { error: 'Already scanned – admitted by another usher', scanned_by: existing.scanned_by },
          { status: 409 },
        )
      }
      if (existing.status === 'cancelled') return NextResponse.json({ error: 'Booking cancelled' }, { status: 410 })
      return NextResponse.json({ error: 'Booking cannot be admitted' }, { status: 409 })
    }

    await supabase.from('seats').update({ status: 'taken' }).in('id', claimed.seat_ids)
    return NextResponse.json({ valid: true, booking_ref: claimed.booking_ref, attendee_name: claimed.attendee_name, seats: claimed.seat_ids, status: 'scanned' })
  } catch (err: unknown) {
    const e = err as { name?: string }
    if (e.name === 'ZodError') return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
