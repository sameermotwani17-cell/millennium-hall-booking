import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPin } from '@/lib/admin-auth'
import { isDemoMode, getDemoBookings } from '@/lib/demo-store'

export async function GET(req: NextRequest) {
  const pin = req.headers.get('x-admin-pin')
  if (!verifyAdminPin(pin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = (req.nextUrl.searchParams.get('q') ?? '').trim().toLowerCase()
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '100', 10) || 100, 500)

  if (isDemoMode()) {
    let bookings = Array.from(getDemoBookings().values())
    if (q) {
      bookings = bookings.filter(
        b =>
          b.attendee_name.toLowerCase().includes(q) ||
          b.booking_ref.toLowerCase().includes(q) ||
          b.attendee_email.toLowerCase().includes(q),
      )
    }
    bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return NextResponse.json({
      bookings: bookings.slice(0, limit).map(b => ({
        booking_ref: b.booking_ref,
        attendee_name: b.attendee_name,
        attendee_email: b.attendee_email,
        seat_ids: b.seat_ids,
        status: b.status,
        created_at: b.created_at,
        scanned_at: b.scanned_at,
        scanned_by: b.scanned_by,
      })),
    })
  }

  const { createServiceSupabase } = await import('@/lib/supabase/server')
  const supabase = createServiceSupabase()

  let query = supabase
    .from('bookings')
    .select('booking_ref, attendee_name, attendee_email, seat_ids, status, created_at, scanned_at, scanned_by')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (q) {
    query = query.or(`attendee_name.ilike.%${q}%,booking_ref.ilike.%${q}%,attendee_email.ilike.%${q}%`)
  }

  const { data: bookings, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bookings: bookings ?? [] })
}
