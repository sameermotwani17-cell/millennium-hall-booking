import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'

export const revalidate = 60

export default async function LandingPage() {
  const supabase = createServerSupabase()
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', 'mh-2026-09-14')
    .single()

  const { count: availableCount } = await supabase
    .from('seats')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event?.id)
    .eq('status', 'available')

  return (
    <main className="min-h-screen bg-[#0E0904] flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(196,98,45,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[200px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(46,74,46,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }} />

      <div className="flex items-center gap-4 text-[#C4622D] text-xs tracking-[0.3em] uppercase mb-5">
        <span className="w-12 h-px bg-[#C4622D] opacity-60" />
        14 September 2026
        <span className="w-12 h-px bg-[#C4622D] opacity-60" />
      </div>

      <h1 className="font-[family-name:var(--font-cormorant)] text-6xl md:text-8xl font-light leading-none text-[#F0DFC0] mb-3">
        An <em className="text-[#F0B824] font-semibold not-italic">Evening</em><br />
        <span className="text-5xl md:text-7xl">at Millennium</span>
      </h1>

      <p className="text-[#8A7055] text-base max-w-md mt-4 mb-8 leading-relaxed font-light">
        {event?.subtitle ?? 'Music, culture, and elegance in a single unforgettable night. Choose your seat, reserve your place.'}
      </p>

      <div className="flex flex-wrap gap-3 justify-center mb-10">
        {[
          { label: 'Saturday · 7:30 PM', cls: 'border-[#C8A97A]/30 text-[#F0DFC0]' },
          { label: event?.venue ?? 'Millennium Hall', cls: 'border-[#4A7A4A]/40 text-[#4A7A4A]' },
          { label: `${availableCount ?? '—'} seats available`, cls: 'border-[#C4622D]/40 text-[#C4622D]' },
        ].map(pill => (
          <span key={pill.label} className={`px-4 py-2 rounded-full text-xs tracking-wider border ${pill.cls} bg-transparent`}>
            {pill.label}
          </span>
        ))}
      </div>

      <div className="relative inline-block mb-16">
        <div className="absolute inset-0 rounded bg-[#C4622D] blur-xl opacity-30 animate-pulse" />
        <Link href="/seats"
          className="relative z-10 inline-block bg-[#C4622D] hover:bg-[#D4703A] text-white px-12 py-4 rounded text-sm tracking-[0.12em] uppercase font-medium transition-all duration-200 hover:-translate-y-0.5">
          Reserve Your Seat
        </Link>
      </div>

      <div className="flex gap-12 flex-wrap justify-center pt-8 border-t border-[#C8A97A]/10">
        {[
          { num: '730', label: 'Total Seats' },
          { num: 'Free', label: 'No Charge' },
          { num: 'QR', label: 'e-Ticket Entry' },
          { num: 'Live', label: 'Availability' },
        ].map(s => (
          <div key={s.num} className="text-center">
            <div className="font-[family-name:var(--font-cormorant)] text-3xl text-[#C8A97A]">{s.num}</div>
            <div className="text-[10px] tracking-[0.15em] uppercase text-[#8A7055] mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
