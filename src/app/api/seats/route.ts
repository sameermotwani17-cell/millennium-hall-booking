import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const eventSlug = req.nextUrl.searchParams.get('event') ?? 'mh-2026-09-14'
  const supabase = createServiceSupabase()

  const { data: event } = await supabase
    .from('events').select('id').eq('slug', eventSlug).single()

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const { data: seats, error } = await supabase
    .from('seats')
    .select('id, section, row_label, col_num, zone, status')
    .eq('event_id', event.id)
    .order('section').order('row_label').order('col_num')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ seats, eventId: event.id })
}
