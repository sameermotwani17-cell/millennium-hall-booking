import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { ref: string } }) {
  const supabase = createServiceSupabase()
  const { data: booking } = await supabase
    .from('bookings')
    .select(`*, events(name, date, doors_open, venue, address)`)
    .eq('booking_ref', params.ref.toUpperCase())
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ booking })
}
