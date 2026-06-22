import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode, getDemoBookings, DEMO_EVENT } from '@/lib/demo-store'

export async function GET(req: NextRequest, { params }: { params: { ref: string } }) {
  const ref = params.ref.toUpperCase()

  if (isDemoMode()) {
    const booking = getDemoBookings().get(ref)
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      booking: {
        ...booking,
        events: {
          name: DEMO_EVENT.name,
          date: DEMO_EVENT.date,
          doors_open: DEMO_EVENT.doors_open,
          venue: DEMO_EVENT.venue,
          address: DEMO_EVENT.address,
        },
      },
    })
  }

  const { createServiceSupabase } = await import('@/lib/supabase/server')
  const supabase = createServiceSupabase()
  const { data: booking } = await supabase
    .from('bookings')
    .select(`*, events(name, date, doors_open, venue, address)`)
    .eq('booking_ref', ref)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ booking })
}
