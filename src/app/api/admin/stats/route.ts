import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPin } from '@/lib/admin-auth'
import { isDemoMode, getDemoBookings } from '@/lib/demo-store'

export async function GET(req: NextRequest) {
  const pin = req.headers.get('x-admin-pin')
  if (!verifyAdminPin(pin)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isDemoMode()) {
    const bookings = Array.from(getDemoBookings().values())
    return NextResponse.json({
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      scanned: bookings.filter(b => b.status === 'scanned').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    })
  }

  const { createServiceSupabase } = await import('@/lib/supabase/server')
  const supabase = createServiceSupabase()

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('status')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total     = bookings.length
  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  const scanned   = bookings.filter(b => b.status === 'scanned').length
  const cancelled = bookings.filter(b => b.status === 'cancelled').length

  return NextResponse.json({ total, confirmed, scanned, cancelled })
}
