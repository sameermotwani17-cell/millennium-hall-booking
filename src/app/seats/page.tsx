'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Seat } from '@/types'
import { ZONE_LABELS } from '@/lib/hall-config'

const HallMap = dynamic(() => import('@/components/HallMap'), { ssr: false })

function SeatsContent() {
  const router = useRouter()
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [eventIdState, setEventIdState] = useState<string>('')

  useEffect(() => {
    fetch('/api/seats?event=mh-2026-09-14')
      .then(r => r.json())
      .then(d => { if (d.eventId) setEventIdState(d.eventId) })
  }, [])

  const handleProceed = () => {
    const ids = selectedSeats.map(s => s.id).join(',')
    router.push(`/reserve?seats=${ids}&event=mh-2026-09-14`)
  }

  return (
    <main className="flex h-screen bg-[#0E0904]">
      {/* Hall area */}
      <div className="flex-1 flex flex-col p-4 min-w-0 overflow-hidden">
        <div className="mb-3">
          <h2 className="font-[family-name:var(--font-cormorant)] text-2xl font-light text-[#F0DFC0]">
            Choose Your Seat
            {selectedSeats.length > 0 && (
              <span className="ml-3 bg-[#C4622D] text-white text-xs rounded-full px-2.5 py-0.5">
                {selectedSeats.length}
              </span>
            )}
          </h2>
          <p className="text-xs text-[#8A7055] mt-1">Click to select · Max 4 seats · Hover for details</p>
        </div>
        <div className="flex gap-4 mb-3 flex-wrap">
          {[
            { color: 'bg-[#A07A20]', label: 'Premium' },
            { color: 'bg-green-600', label: 'Available' },
            { color: 'bg-[#C9930A]', label: 'Selected' },
            { color: 'bg-orange-700', label: 'Taken' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-[#8A7055]">
              <div className={`w-2.5 h-2.5 rounded ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>
        {eventIdState && (
          <HallMap eventId={eventIdState} onSelectionChange={setSelectedSeats} />
        )}
        {!eventIdState && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C4622D] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-[#0A0603] border-l border-[#C8A97A]/8 flex flex-col p-4 gap-4">
        <h3 className="font-[family-name:var(--font-cormorant)] text-base text-[#F0DFC0]">Your Selection</h3>

        {selectedSeats.length === 0 ? (
          <p className="text-xs text-[#8A7055] text-center py-6 leading-relaxed">
            No seats selected.<br />Click any green seat to reserve.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedSeats.map(s => (
              <div key={s.id} className="bg-[#C8A97A]/5 border border-[#C8A97A]/10 rounded px-2.5 py-2">
                <div className="text-sm text-[#F0DFC0] font-medium">{s.id}</div>
                <div className="text-xs text-[#8A7055]">{ZONE_LABELS[s.zone]}</div>
              </div>
            ))}
            <div className="h-px bg-[#C8A97A]/10 my-1" />
            <div className="text-xs text-[#8A7055]">
              {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
            </div>
          </div>
        )}

        <button
          disabled={selectedSeats.length === 0}
          onClick={handleProceed}
          className="mt-auto w-full bg-[#2E4A2E] hover:bg-[#4A7A4A] disabled:opacity-30 disabled:cursor-not-allowed text-[#F0DFC0] py-3 rounded text-xs tracking-[0.1em] uppercase font-medium transition-colors">
          Continue →
        </button>
      </aside>
    </main>
  )
}

export default function SeatsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center text-[#8A7055]">
        Loading hall…
      </div>
    }>
      <SeatsContent />
    </Suspense>
  )
}
