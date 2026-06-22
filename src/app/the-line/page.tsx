import Link from 'next/link'
import type { Metadata } from 'next'
import LineFormation from '@/components/LineFormation'

export const metadata: Metadata = {
  title: 'The Line They Drew — Afro Week 2026',
  description:
    'A theatrical journey through Africa’s past. The official Afro Week 2026 poster, formed in slow motion. Friday, June 26 2026 · 6:00 PM · Millennium Hall.',
}

export default function TheLinePage() {
  return (
    <main className="bg-black text-[#F5F0E8]">

      {/* ── INTRO ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Pan-African stripe top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex">
          <div className="flex-1 bg-[#C8102E]" />
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#006B3F]" />
        </div>

        <Link
          href="/"
          className="absolute top-6 left-6 text-white/40 hover:text-[#FCD116] transition-colors text-xs tracking-[0.2em] uppercase"
        >
          ← Afro Week
        </Link>

        <div data-reveal>
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="h-px w-10 bg-[#FCD116]/50" />
            <span className="text-[#FCD116] text-[9px] tracking-[0.45em] uppercase font-medium">Afroweek presents</span>
            <div className="h-px w-10 bg-[#FCD116]/50" />
          </div>

          <h1 className="font-[family-name:var(--font-bebas)] leading-none mb-5">
            <span className="block text-[clamp(56px,12vw,150px)] text-white tracking-[0.05em]">THE LINE</span>
            <span
              className="block text-[clamp(56px,12vw,150px)] tracking-[0.05em] -mt-2"
              style={{
                background: 'linear-gradient(90deg, #C8102E 0%, #FCD116 50%, #006B3F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              THEY DREW
            </span>
          </h1>

          <p className="text-white/50 text-xs tracking-[0.25em] uppercase mb-8 font-mono">
            Drama · Music · Dance · Choir · Traditional Fashion
          </p>

          <p className="text-[#F5F0E8]/65 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            A powerful theatrical journey through Africa&rsquo;s past — the rise of great empires, the lines drawn
            by colonisation, the struggle for liberation, and the enduring strength of African identity.
          </p>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse">
          <span className="text-[9px] tracking-[0.35em] uppercase text-white/35 font-mono">Scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(252,209,22,0.6)" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>

      {/* ── THE POSTER, FORMING ────────────────────────────── */}
      <LineFormation />

      {/* ── OUTRO / CTA ────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 bg-[#0A0A0A]">
        <div className="flex gap-0.5 h-1 w-24 mb-8">
          <div className="flex-1 bg-[#C8102E]" />
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#006B3F]" />
        </div>

        <p className="text-[#FCD116] text-xs tracking-[0.3em] uppercase mb-4">Friday · June 26 2026 · 6:00 PM</p>
        <h2 className="font-[family-name:var(--font-bebas)] text-5xl md:text-7xl text-white leading-none mb-4">
          MILLENNIUM HALL
        </h2>
        <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-sm">
          Free admission. Reserve your seat and your QR ticket arrives instantly.
        </p>

        <Link
          href="/seats"
          className="bg-[#FCD116] hover:bg-[#FFE14D] text-black font-bold px-14 py-5 text-sm tracking-[0.2em] uppercase transition-all hover:shadow-[0_8px_30px_rgba(252,209,22,0.4)]"
        >
          Reserve Your Seat →
        </Link>
      </section>
    </main>
  )
}
