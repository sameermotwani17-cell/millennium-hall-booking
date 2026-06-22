'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Seat } from '@/types'
import { ZONE_LABELS } from '@/lib/hall-config'

const HallMap = dynamic(() => import('@/components/HallMap'), { ssr: false })

const LEGEND = [
  { color: 'bg-[#FCD116]', label: 'Premium' },
  { color: 'bg-[#00C896]', label: 'Available' },
  { color: 'bg-[#FF4D4D]', label: 'Selected' },
  { color: 'bg-[#3A1A1A]', label: 'Taken' },
  { color: 'bg-[#8B5CF6]', label: 'Held' },
]

function SeatsContent() {
  const router = useRouter()
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])

  const handleProceed = () => {
    const ids = selectedSeats.map(s => s.id).join(',')
    router.push(`/reserve?seats=${ids}&event=mh-2026-09-14`)
  }

  return (
    // Single root — flex-col on mobile, flex-row on desktop
    <main className="flex flex-col md:flex-row h-[100dvh] md:h-screen bg-[#0A0A0A] overflow-hidden relative">

      {/* Static background — no video on seats page (better mobile perf) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(252,209,22,0.04) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(200,16,46,0.04) 0%, transparent 50%)',
        }} />
        <div className="absolute top-0 left-0 right-0 h-0.5 flex">
          <div className="flex-1 bg-[#C8102E]" />
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#006B3F]" />
        </div>
      </div>

      {/* ── Hall column (fills all available space) ── */}
      {/* NOTE: no overflow-hidden here — hall-grid needs to scroll horizontally */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10 md:p-4">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 md:px-0 md:pt-0 md:pb-3 border-b border-[#FCD116]/10 md:border-none shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Link href="/" className="text-[#FCD116]/50 hover:text-[#FCD116] text-[10px] md:text-xs font-mono tracking-wider transition-colors">
                ← AFRO WEEK
              </Link>
              <span className="hidden md:inline text-white/20 text-xs">/</span>
              <span className="hidden md:inline text-white/50 text-xs font-mono tracking-wider">SEAT SELECT</span>
            </div>
            <h2 className="font-[family-name:var(--font-bebas)] text-2xl md:text-3xl tracking-wide text-white leading-none">
              Choose Your Seat
              {selectedSeats.length > 0 && (
                <span className="ml-2 bg-[#C8102E] text-white text-xs rounded-full px-2 py-0.5 font-sans align-middle">
                  {selectedSeats.length}
                </span>
              )}
            </h2>
          </div>
          <div className="flex gap-1 md:gap-1.5 items-center">
            <div className="w-2 h-2 rounded-full bg-[#C8102E]" />
            <div className="w-2 h-2 rounded-full bg-[#FCD116]" />
            <div className="w-2 h-2 rounded-full bg-[#006B3F]" />
            <span className="hidden md:inline text-white/20 text-[10px] ml-1 tracking-wider uppercase font-mono">Afro Week 2026</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-3 md:gap-4 px-4 py-1.5 md:px-0 md:py-0 md:mb-3 shrink-0">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs text-white/35 md:text-white/40 font-mono">
              <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>

        {/* Hall map — flex wrapper so HallMap's flex-1 fills remaining height */}
        <div className="flex-1 min-h-0 flex flex-col">
          <HallMap onSelectionChange={setSelectedSeats} />
        </div>

        {/* ── Mobile-only bottom confirm bar (hidden on md+) ── */}
        <div className="md:hidden shrink-0 border-t border-[#FCD116]/15 bg-[#0D0D0D]/95 backdrop-blur-sm">
          <div className="flex gap-0.5 h-0.5">
            <div className="flex-1 bg-[#C8102E]" />
            <div className="flex-1 bg-[#FCD116]" />
            <div className="flex-1 bg-[#006B3F]" />
          </div>
          <div className="px-4 py-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            {selectedSeats.length > 0 ? (
              <div className="flex items-center gap-3 fade-up">
                <div className="flex-1 min-w-0">
                  {selectedSeats.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <span className="font-[family-name:var(--font-bebas)] text-2xl text-[#FCD116] tracking-wider leading-none">
                        {s.id}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider truncate">
                        {ZONE_LABELS[s.zone]}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleProceed}
                  className="flex-shrink-0 bg-[#FCD116] active:bg-[#FFE14D] text-black px-5 py-3.5 rounded-sm text-xs tracking-[0.15em] uppercase font-bold"
                  style={{ boxShadow: '0 8px 24px rgba(252,209,22,0.35)' }}
                >
                  Confirm →
                </button>
              </div>
            ) : (
              <p className="text-xs text-white/25 font-mono text-center py-1">
                Tap a teal seat to select
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop-only sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-[#0D0D0D]/90 backdrop-blur-sm border-l border-[#FCD116]/10 flex-col p-4 gap-4 relative z-10">
        <div className="flex gap-0.5 h-0.5">
          <div className="flex-1 bg-[#C8102E]" />
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#006B3F]" />
        </div>

        <h3 className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-white">
          Your Selection
        </h3>

        {selectedSeats.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <div className="w-10 h-10 rounded-full border border-[#FCD116]/20 flex items-center justify-center mb-3">
              <span className="text-[#FCD116]/40 text-lg">◎</span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed font-mono">
              No seats selected.<br />
              Tap any teal seat to reserve.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 flex-1 overflow-auto">
            {selectedSeats.map((s, i) => (
              <div key={s.id}
                className="bg-white/3 border border-[#FCD116]/15 rounded px-3 py-2.5 fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="font-[family-name:var(--font-bebas)] text-lg text-[#FCD116] tracking-wider leading-none">{s.id}</div>
                <div className="text-[10px] text-white/40 mt-0.5 font-mono uppercase tracking-wider">{ZONE_LABELS[s.zone]}</div>
              </div>
            ))}
            <div className="mt-2 pt-2 border-t border-white/8 text-xs text-white/30 font-mono">
              {selectedSeats.length} of 4 seats selected
            </div>
          </div>
        )}

        <button
          disabled={selectedSeats.length === 0}
          onClick={handleProceed}
          className="w-full bg-[#FCD116] hover:bg-[#FFE14D] disabled:opacity-20 disabled:cursor-not-allowed text-black py-3.5 rounded-sm text-xs tracking-[0.15em] uppercase font-bold transition-all hover:shadow-[0_8px_24px_rgba(252,209,22,0.35)]"
        >
          {selectedSeats.length === 0 ? 'Select Seats' : `Continue with ${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''} →`}
        </button>
      </aside>
    </main>
  )
}

export default function SeatsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FCD116] border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.25em] text-[#FCD116]/40 uppercase font-mono">Loading Hall…</span>
        </div>
      </div>
    }>
      <SeatsContent />
    </Suspense>
  )
}
