import Link from 'next/link'
import Image from 'next/image'
import LinesTheyDrewVideo from '@/components/LinesTheyDrewVideo'
import { isDemoMode, getDemoSeats, DEMO_EVENT } from '@/lib/demo-store'
import { TOTAL_SEATS } from '@/lib/hall-config'

export const revalidate = 60

async function getEventData() {
  if (isDemoMode()) {
    const seats = getDemoSeats()
    const available = Array.from(seats.values()).filter(s => s.status === 'available').length
    return { event: DEMO_EVENT, availableCount: available }
  }
  const { createServerSupabase } = await import('@/lib/supabase/server')
  const supabase = createServerSupabase()
  const { data: event } = await supabase.from('events').select('*').eq('slug', 'mh-2026-09-14').single()
  const { count: availableCount } = await supabase.from('seats')
    .select('*', { count: 'exact', head: true }).eq('event_id', event?.id).eq('status', 'available')
  return { event, availableCount }
}

export default async function LandingPage() {
  const { event, availableCount } = await getEventData()

  return (
    <main className="min-h-screen bg-[#0A0A0A]">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">

        {/* Background — cinematic intro video */}
        <div className="absolute inset-0 z-0" data-parallax="0.22">
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.45) saturate(1.3)' }}
          >
            <source src="/afrifest-intro.mp4" type="video/mp4" />
          </video>
          <Image
            src="/afrifest-crew3.jpg"
            alt="Afro Week crew"
            fill priority
            className="object-cover object-center -z-10"
            style={{ filter: 'brightness(0.35) saturate(1.2)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
          <div className="absolute top-0 left-0 right-0 h-1.5 flex">
            <div className="flex-1 bg-[#C8102E]" />
            <div className="flex-1 bg-[#FCD116]" />
            <div className="flex-1 bg-[#006B3F]" />
          </div>
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-[#C8102E]" />
              <div className="w-2 h-2 rounded-full bg-[#FCD116]" />
              <div className="w-2 h-2 rounded-full bg-[#006B3F]" />
            </div>
            <span className="font-[family-name:var(--font-bebas)] text-xl tracking-[0.15em] text-white/90 ml-1">AFRO WEEK</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/afroweekapu?igsh=MWpsb3JhcGVmN3U5ZA=="
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/50 hover:text-[#FCD116] transition-colors"
              aria-label="Follow on Instagram"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-xs tracking-[0.15em] uppercase">@afroweekapu</span>
            </a>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-xs tracking-[0.2em] text-white/40 uppercase">26 Jun 2026</span>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 pb-24" data-reveal>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px w-12 bg-[#FCD116]" />
            <span className="text-[#FCD116] text-xs tracking-[0.35em] uppercase font-medium">Millennium Hall · APU</span>
            <div className="h-px w-12 bg-[#FCD116]" />
          </div>

          <h1 className="font-[family-name:var(--font-bebas)] leading-none mb-2 flicker w-full">
            <span className="block text-[clamp(60px,13vw,180px)] text-white tracking-[0.04em] drop-shadow-[0_4px_40px_rgba(252,209,22,0.25)]">
              AFRO WEEK
            </span>
            <span className="block text-[clamp(40px,8vw,100px)] text-[#FCD116] tracking-[0.12em] -mt-2 drop-shadow-[0_4px_40px_rgba(200,16,46,0.4)]">
              2026
            </span>
          </h1>

          <p className="text-[#F5F0E8]/70 text-base md:text-lg max-w-lg mt-4 mb-10 leading-relaxed">
            {event?.subtitle ?? 'One night. One stage. One continent. Music, culture, and elegance — choose your seat.'}
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <span className="px-4 py-2 rounded-full border border-white/15 text-white/70 text-xs tracking-wider">
              6th Period
            </span>
            <span className="px-4 py-2 rounded-full border border-[#006B3F]/60 text-[#00C878] text-xs tracking-wider">
              {event?.venue ?? 'Millennium Hall'} · APU
            </span>
            <span className="px-4 py-2 rounded-full border border-[#C8102E]/50 text-[#FF6B6B] text-xs tracking-wider">
              {availableCount ?? '—'} seats left
            </span>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-sm bg-gradient-to-r from-[#C8102E] via-[#FCD116] to-[#006B3F] opacity-60 blur-lg animate-pulse" />
            <Link
              href="/seats"
              className="relative z-10 inline-block bg-[#FCD116] hover:bg-[#FFE14D] text-black font-semibold px-14 py-4 rounded-sm text-sm tracking-[0.15em] uppercase transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(252,209,22,0.4)]"
            >
              Reserve Your Seat
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-white/8 bg-black/60 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto flex justify-around py-5 px-6">
            {[
              { num: String(TOTAL_SEATS), label: 'Total Seats' },
              { num: 'FREE', label: 'Admission' },
              { num: 'QR', label: 'e-Ticket Entry' },
              { num: 'LIVE', label: 'Availability' },
            ].map(s => (
              <div key={s.num} className="text-center">
                <div className="font-[family-name:var(--font-bebas)] text-2xl md:text-3xl text-[#FCD116] tracking-wider">{s.num}</div>
                <div className="text-[9px] tracking-[0.18em] uppercase text-white/35 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE LINES THEY DREW — theatrical story section ─── */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#070707]">
        {/* Cinematic video background — Higgsfield generated */}
        <div className="absolute inset-0 z-0" data-parallax="0.18">
          <LinesTheyDrewVideo />
          {/* Deep atmospheric overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-black/90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
          {/* Subtle grain texture */}
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.4\'/%3E%3C/svg%3E")', backgroundSize: '200px' }} />
        </div>

        {/* Pan-African stripe top */}
        <div className="absolute top-0 left-0 right-0 h-0.5 flex z-10">
          <div className="flex-1 bg-[#C8102E]" />
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#006B3F]" />
        </div>

        <div className="relative z-10 text-center px-6 py-24 max-w-3xl mx-auto" data-reveal>
          {/* Tag line */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-10 bg-[#FCD116]/50" />
            <span className="text-[#FCD116] text-[9px] tracking-[0.45em] uppercase font-medium">A Theatrical Journey</span>
            <div className="h-px w-10 bg-[#FCD116]/50" />
          </div>

          {/* Main title */}
          <h2 className="font-[family-name:var(--font-bebas)] leading-none mb-3">
            <span
              className="block text-[clamp(52px,11vw,130px)] text-white tracking-[0.06em]"
              style={{ textShadow: '0 4px 40px rgba(200,16,46,0.3), 0 0 80px rgba(0,0,0,0.9)' }}
            >
              THE LINES
            </span>
            <span
              className="block text-[clamp(52px,11vw,130px)] tracking-[0.06em]"
              style={{
                background: 'linear-gradient(90deg, #C8102E 0%, #FCD116 50%, #006B3F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: 'none',
              }}
            >
              THEY DREW
            </span>
          </h2>

          {/* Sub-title */}
          <p className="text-white/50 text-xs tracking-[0.25em] uppercase mb-8 font-mono">
            Drama · Music · Dance · Choir · Traditional Fashion
          </p>

          {/* Description */}
          <p className="text-[#F5F0E8]/70 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            A powerful theatrical journey through Africa&rsquo;s past — told through the conversations of a grandfather
            and grandchild. Exploring the rise of Africa&rsquo;s great empires, the impact of colonisation, the struggle
            for liberation, and the enduring strength of African identity.
          </p>

          {/* Theme pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {['Great Empires','Colonisation','Liberation','Memory & Hope','African Identity'].map(theme => (
              <span
                key={theme}
                className="px-3 py-1.5 rounded-full text-[10px] tracking-wider text-white/50 font-mono"
                style={{ border: '1px solid rgba(252,209,22,0.2)', background: 'rgba(252,209,22,0.04)' }}
              >
                {theme}
              </span>
            ))}
          </div>

          {/* Quote */}
          <blockquote className="border-l-2 border-[#FCD116]/40 pl-4 text-left max-w-md mx-auto mb-10">
            <p className="text-white/50 text-sm italic leading-relaxed">
              &ldquo;Through stories of loss, resistance, memory, and hope — celebrating the cultures,
              histories, and people who refused to be forgotten.&rdquo;
            </p>
          </blockquote>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/the-line"
              className="inline-block bg-[#FCD116] hover:bg-[#FFE14D] text-black px-10 py-3.5 text-sm tracking-[0.2em] uppercase font-bold transition-all duration-200 hover:-translate-y-0.5"
            >
              Watch It Form →
            </Link>
            <Link
              href="/seats"
              className="inline-block border-2 border-[#FCD116] text-[#FCD116] hover:bg-[#FCD116] hover:text-black px-10 py-3.5 text-sm tracking-[0.2em] uppercase font-bold transition-all duration-200"
            >
              Claim Your Seat →
            </Link>
          </div>
        </div>

        {/* Pan-African stripe bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 flex z-10">
          <div className="flex-1 bg-[#006B3F]" />
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#C8102E]" />
        </div>
      </section>

      {/* ── FULL CREW GALLERY ─────────────────────────────── */}
      <section className="relative bg-[#0A0A0A] py-8">
        {/* Full-width photo — stairs */}
        <div className="relative w-full mt-2" style={{ height: '90vh' }}>
          <Image
            src="/afrifest-crew3.jpg"
            alt="Afro Week crew on stairs"
            fill
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center" data-reveal>
              <div className="font-[family-name:var(--font-bebas)] text-[clamp(48px,10vw,120px)] leading-none text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
                REPRESENT
              </div>
              <div className="font-[family-name:var(--font-bebas)] text-[clamp(36px,7vw,90px)] leading-none text-[#FCD116] drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
                YOUR CULTURE
              </div>
            </div>
          </div>
        </div>

        {/* CTA — full width */}
        <div className="bg-[#0D0D0D] flex flex-col items-center justify-center p-16 text-center border-t border-[#FCD116]/10" data-reveal>
          <div className="flex gap-0.5 h-1 w-24 mb-8">
            <div className="flex-1 bg-[#C8102E]" />
            <div className="flex-1 bg-[#FCD116]" />
            <div className="flex-1 bg-[#006B3F]" />
          </div>
          <p className="text-[#FCD116] text-xs tracking-[0.3em] uppercase mb-4">Afro Week 2026</p>
          <h3 className="font-[family-name:var(--font-bebas)] text-5xl md:text-7xl text-white leading-none mb-4">
            CLAIM<br />YOUR<br />SEAT
          </h3>
          <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-sm">
            Free admission. Just your name and email. Your QR ticket arrives instantly.
          </p>
          <Link
            href="/seats"
            className="bg-[#FCD116] hover:bg-[#FFE14D] text-black font-bold px-14 py-5 text-sm tracking-[0.2em] uppercase transition-all hover:shadow-[0_8px_30px_rgba(252,209,22,0.4)]"
          >
            Reserve Free →
          </Link>
          <a
            href="https://www.instagram.com/afroweekapu?igsh=MWpsb3JhcGVmN3U5ZA=="
            target="_blank" rel="noopener noreferrer"
            className="mt-6 flex items-center gap-2 text-white/30 hover:text-[#FCD116] transition-colors text-xs tracking-wider"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @afroweekapu
          </a>
        </div>
      </section>

    </main>
  )
}
