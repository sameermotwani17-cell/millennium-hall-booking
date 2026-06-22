export type Zone = 'premium' | 'standard' | 'balcony' | 'side'
export type SeatStatus = 'available' | 'reserved' | 'taken' | 'blocked'
export type BookingStatus = 'confirmed' | 'scanned' | 'cancelled'

export interface Event {
  id: string
  slug: string
  name: string
  subtitle: string | null
  date: string
  doors_open: string
  venue: string
  address: string
  is_active: boolean
}

export interface Seat {
  id: string
  event_id: string
  section: string
  row_label: string
  col_num: number
  zone: Zone
  status: SeatStatus
  locked_at: string | null
}

export interface Booking {
  id: string
  booking_ref: string
  event_id: string
  attendee_name: string
  attendee_email: string
  seat_ids: string[]
  qr_payload: string
  status: BookingStatus
  scanned_at: string | null
  scanned_by: string | null
  created_at: string
}

export interface QRPayload {
  ref: string
  name: string
  seats: string[]
  event: string
  valid: boolean
  ts: number
}

export interface SectionConfig {
  id: string
  label: string
  zone: Zone
  rows: number
  cols: number
  premiumRows?: number
}
