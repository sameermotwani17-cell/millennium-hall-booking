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

  const { data: seats, error: seatsError } = await supabase
    .from('seats')
    .select('id, status')
    .in('id', params.seatIds)
    .eq('event_id', params.eventId)

  if (seatsError) return { booking: null as unknown as Booking, error: seatsError.message }

  const unavailable = seats?.filter(s => s.status !== 'available') ?? []
  if (unavailable.length > 0) {
    return {
      booking: null as unknown as Booking,
      error: `Seats no longer available: ${unavailable.map(s => s.id).join(', ')}`
    }
  }

  let ref = generateRef()
  let attempts = 0
  while (attempts < 5) {
    const { data: existing } = await supabase
      .from('bookings').select('id').eq('booking_ref', ref).single()
    if (!existing) break
    ref = generateRef()
    attempts++
  }

  const qrPayload: QRPayload = {
    ref,
    name: params.name,
    seats: params.seatIds,
    event: params.eventSlug,
    valid: true,
    ts: Date.now(),
  }

  const { error: updateError } = await supabase
    .from('seats')
    .update({ status: 'reserved' })
    .in('id', params.seatIds)
    .eq('event_id', params.eventId)

  if (updateError) return { booking: null as unknown as Booking, error: updateError.message }

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
    await supabase.from('seats').update({ status: 'available' }).in('id', params.seatIds)
    return { booking: null as unknown as Booking, error: bookingError.message }
  }

  return { booking: booking as Booking, error: null }
}
