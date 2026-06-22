import Link from 'next/link'
import type { Metadata } from 'next'
import LineFormation from '@/components/LineFormation'
import TheWalk from '@/components/TheWalk'

export const metadata: Metadata = {
  title: 'The Line They Drew — Afro Week 2026',
  description:
    'A theatrical journey through Africa’s past. The official Afro Week 2026 poster, formed in slow motion. Friday, June 26 2026 · 6:00 PM · Millennium Hall.',
}

export default function TheLinePage() {
  return (
    <main className="bg-black text-[#F5F0E8]">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-40">
        <div className="h-1.5 flex">
          <div className="flex-1 bg-[#C8102E]" />
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#006B3F]" />
        </div>
        <Link
          href="/"
          className="absolute top-5 left-6 text-white/50 hover:text-[#FCD116] transition-colors text-xs tracking-[0.2em] uppercase"
        >
          ← Afro Week
        </Link>
      </div>

      {/* ── TOP STAGE: the poster forms in slow motion (16:9, scroll-scrubbed) ── */}
      <LineFormation />

      {/* ── THE WALK: grandfather & grandson, an endless journey ────────────── */}
      <section className="relative w-full overflow-hidden bg-black">
        {/* Game-style sprite — they walk into the portal and begin again */}
        <TheWalk />

        {/* Story caption */}
        <div className="relative z-20 px-6 py-14 text-center bg-[#0A0A0A]" data-reveal>
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-10 bg-[#FCD116]/50" />
            <span className="text-[#FCD116] text-[9px] tracking-[0.45em] uppercase font-medium">A Theatrical Journey</span>
            <div className="h-px w-10 bg-[#FCD116]/50" />
          </div>
          <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(34px,6vw,72px)] leading-none text-white mb-4 tracking-[0.04em]">
            EVERY ENDING, A NEW BEGINNING
          </h2>
          <p className="text-[#F5F0E8]/70 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            A grandfather and his grandson walk the line of history — through the rise of great empires,
            the borders of colonisation, and the long road to liberation. Each time they reach the end,
            the story begins again.
          </p>
        </div>
      </section>

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
