import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode, getDemoBookings } from '@/lib/demo-store'

const EXPECTED_PIN = process.env.USHER_PIN ?? '0000'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-pin') !== EXPECTED_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (isDemoMode()) {
    const bookings = Array.from(getDemoBookings().values())
    return NextResponse.json({
      total:     bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      scanned:   bookings.filter(b => b.status === 'scanned').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    }, { headers: NO_STORE })
  }

  const { createServiceSupabase } = await import('@/lib/supabase/server')
  const supabase = createServiceSupabase()
  const { data: bookings, error } = await supabase.from('bookings').select('status')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    total:     bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    scanned:   bookings.filter(b => b.status === 'scanned').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }, { headers: NO_STORE })
}
