import { ROW_CONFIGS, getRowSeatEntries, getSeatZone } from './hall-config'
import type { Booking, Event, Seat } from '@/types'

export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url === 'YOUR_SUPABASE_URL' || url.trim() === ''
}

export const DEMO_EVENT: Event = {
  id: 'demo-event-id',
  slug: 'mh-2026-09-14',
  name: 'An Evening at Millennium',
  subtitle: 'Music, culture, and elegance in a single unforgettable night.',
  date: '2026-06-26',
  doors_open: '19:00',
  venue: 'Millennium Hall',
  address: 'APU',
  is_active: true,
}

function buildSeats(): Map<string, Seat> {
  const map = new Map<string, Seat>()
  for (const rowCfg of ROW_CONFIGS) {
    for (const { id, seatNum, section } of getRowSeatEntries(rowCfg)) {
      map.set(id, {
        id,
        event_id: DEMO_EVENT.id,
        section,
        row_label: rowCfg.row,
        col_num: seatNum,
        zone: getSeatZone(rowCfg.row, seatNum) as Seat['zone'],
        status: 'available',
        locked_at: null,
      })
    }
  }
  return map
}

const g = globalThis as typeof globalThis & {
  __demoSeats?: Map<string, Seat>
  __demoBookings?: Map<string, Booking>
}

export function getDemoSeats(): Map<string, Seat> {
  if (!g.__demoSeats) g.__demoSeats = buildSeats()
  return g.__demoSeats
}

export function getDemoBookings(): Map<string, Booking> {
  if (!g.__demoBookings) g.__demoBookings = new Map()
  return g.__demoBookings
}

function generateDemoRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = 'MH-'
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)]
  return ref
}

export function createDemoBooking(params: {
  name: string
  email: string
  seatIds: string[]
}): { booking: Booking; error: string | null } {
  const seats = getDemoSeats()
  const bookings = getDemoBookings()

  const unavailable = params.seatIds.filter(id => {
    const s = seats.get(id)
    return !s || s.status !== 'available'
  })
  if (unavailable.length > 0) {
    return { booking: null as unknown as Booking, error: `Seats no longer available: ${unavailable.join(', ')}` }
  }

  let ref = generateDemoRef()
  let attempts = 0
  while (bookings.has(ref) && attempts < 5) { ref = generateDemoRef(); attempts++ }

  const qrPayload = JSON.stringify({
    ref, name: params.name, seats: params.seatIds, event: DEMO_EVENT.slug, valid: true, ts: Date.now(),
  })

  const booking: Booking = {
    id: `demo-booking-${Date.now()}`,
    booking_ref: ref,
    event_id: DEMO_EVENT.id,
    attendee_name: params.name,
    attendee_email: params.email,
    seat_ids: params.seatIds,
    qr_payload: qrPayload,
    status: 'confirmed',
    scanned_at: null,
    scanned_by: null,
    created_at: new Date().toISOString(),
  }

  params.seatIds.forEach(id => {
    const s = seats.get(id)
    if (s) seats.set(id, { ...s, status: 'reserved' })
  })
  bookings.set(ref, booking)

  return { booking, error: null }
}
