import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode, getDemoBookings } from '@/lib/demo-store'

const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  const rawSearch = req.nextUrl.searchParams.get('search')?.trim().slice(0, 100) ?? ''
  const limit     = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit')  ?? '50'), 1), 100)
  const offset    = Math.max(parseInt(req.nextUrl.searchParams.get('offset') ?? '0'), 0)
  const q         = rawSearch.toLowerCase()

  if (isDemoMode()) {
    const all = Array.from(getDemoBookings().values())
    const filtered = q
      ? all.filter(b =>
          b.attendee_name.toLowerCase().includes(q) ||
          b.booking_ref.toLowerCase().includes(q) ||
          b.attendee_email.toLowerCase().includes(q),
        )
      : all
    filtered.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return NextResponse.json({
      bookings: filtered.slice(offset, offset + limit),
      total: filtered.length,
    }, { headers: NO_STORE })
  }

  const { createServiceSupabase } = await import('@/lib/supabase/server')
  const supabase = createServiceSupabase()

  // Escape ilike special chars to prevent wildcard injection
  const escaped = rawSearch.replace(/([%_\\])/g, '\\$1')

  let query = supabase
    .from('bookings')
    .select('id, booking_ref, attendee_name, attendee_email, seat_ids, status, created_at, scanned_at, scanned_by', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (escaped) {
    query = query.or(
      `attendee_name.ilike.%${escaped}%,booking_ref.ilike.%${escaped}%,attendee_email.ilike.%${escaped}%`,
    )
  }

  const { data: bookings, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bookings: bookings ?? [], total: count ?? 0 }, { headers: NO_STORE })
}
