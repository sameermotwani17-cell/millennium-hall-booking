import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode, getDemoBookings } from '@/lib/demo-store'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const EXPECTED_PIN = process.env.USHER_PIN ?? '0000'
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET(req: NextRequest) {
  // Limit stats polling to 60 req/min per IP (generous for multi-admin refresh)
  const rl = rateLimit(`stats:${clientIp(req)}`, 60, 60 * 1000)
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  if (req.headers.get('x-admin-pin') !== EXPECTED_PIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const demo = isDemoMode()

  if (demo) {
    const bookings = Array.from(getDemoBookings().values())
    return NextResponse.json({
      total:     bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      scanned:   bookings.filter(b => b.status === 'scanned').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      isDemo:    true,
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
    isDemo:    false,
  }, { headers: NO_STORE })
}
