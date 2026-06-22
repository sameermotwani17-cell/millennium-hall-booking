import { createServiceSupabase } from '@/lib/supabase/server'
import type { Booking, QRPayload } from '@/types'

export function generateRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = 'MH-'
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

export async function createBooking(params: {
  eventId: string
  eventSlug: string
  name: string
  email: string
  seatIds: string[]
}): Promise<{ booking: Booking; error: string | null }> {
  const supabase = createServiceSupabase()

  // Atomic claim: UPDATE only rows where status='available' and return claimed ids.
  // If any seat was already taken by a concurrent request, the returned count will
  // be less than requested and we abort — no double-booking possible.
  const { data: claimed, error: claimError } = await supabase
    .from('seats')
    .update({ status: 'reserved' })
    .in('id', params.seatIds)
    .eq('event_id', params.eventId)
    .eq('status', 'available')   // only claim still-available seats
    .select('id')

  if (claimError) return { booking: null as unknown as Booking, error: claimError.message }

  if (!claimed || claimed.length < params.seatIds.length) {
    // Release any partially claimed seats
    if (claimed && claimed.length > 0) {
      await supabase
        .from('seats')
        .update({ status: 'available' })
        .in('id', claimed.map(s => s.id))
    }
    return { booking: null as unknown as Booking, error: 'Seat no longer available — someone just grabbed it. Please choose another.' }
  }

  // Generate a unique booking ref
  let ref = generateRef()
  for (let attempts = 0; attempts < 5; attempts++) {
    const { data: existing } = await supabase
      .from('bookings').select('id').eq('booking_ref', ref).maybeSingle()
    if (!existing) break
    ref = generateRef()
  }

  const qrPayload: QRPayload = {
    ref,
    name: params.name,
    seats: params.seatIds,
    event: params.eventSlug,
    valid: true,
    ts: Date.now(),
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      booking_ref: ref,
      event_id: params.eventId,
      attendee_name: params.name,
      attendee_email: params.email,
      seat_ids: params.seatIds,
      qr_payload: JSON.stringify(qrPayload),
      status: 'confirmed',
    })
    .select()
    .single()

  if (bookingError) {
    // Roll back seat claim on booking insert failure
    await supabase.from('seats').update({ status: 'available' }).in('id', params.seatIds)
    return { booking: null as unknown as Booking, error: bookingError.message }
  }

  return { booking: booking as Booking, error: null }
}
