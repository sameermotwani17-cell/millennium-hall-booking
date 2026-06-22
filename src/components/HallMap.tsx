'use client'

import { useEffect, useState, useCallback, useRef, memo } from 'react'
import { ROW_CONFIGS, ZONE_LABELS, MAX_SEATS_PER_BOOKING, getRowSeatEntries } from '@/lib/hall-config'
import type { Seat } from '@/types'

interface Props {
  onSelectionChange: (seats: Seat[]) => void
}

const SeatBtn = memo(function SeatBtn({
  seat, isSelected, onToggle,
}: { seat: Seat; isSelected: boolean; onToggle: (id: string) => void }) {
  const unavailable = seat.status === 'reserved' || seat.status === 'taken'
  let cls = 'seat '
  if (seat.status === 'reserved')   cls += 'seat-reserved'
  else if (seat.status === 'taken') cls += 'seat-taken'
  else if (isSelected)              cls += 'seat-selected'
  else if (seat.zone === 'premium') cls += 'seat-premium seat-available'
  else                              cls += 'seat-available'

  return (
    <div
      className={cls}
      title={`Row ${seat.row_label} · Seat ${seat.col_num} · ${ZONE_LABELS[seat.zone] ?? seat.zone}`}
      onClick={() => { if (!unavailable) onToggle(seat.id) }}
    />
  )
})

// Invisible placeholder keeps a row's outer block the same width as full rows
function Phantom({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-[18px] h-[18px] flex-shrink-0" />
      ))}
    </>
  )
}

const MAX_OUTER = 4  // seats 1-4 or 41-44 per side

export default function HallMap({ onSelectionChange }: Props) {
  const [seats, setSeats]       = useState<Map<string, Seat>>(new Map())
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const onSelectionRef = useRef(onSelectionChange)
  onSelectionRef.current = onSelectionChange
  const seatsRef = useRef(seats)
  seatsRef.current = seats
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/seats?event=mh-2026-09-14')
      .then(r => r.json())
      .then(d => {
        if (d.seats) {
          const map = new Map<string, Seat>()
          d.seats.forEach((s: Seat) => map.set(s.id, s))
          setSeats(map)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // ── Center scroll horizontally on mobile after hall loads ─────────────────────
  useEffect(() => {
    if (loading) return
    const el = scrollRef.current
    if (!el) return
    const excess = el.scrollWidth - el.clientWidth
    if (excess > 0) el.scrollLeft = excess / 2
  }, [loading])

  // ── Supabase Realtime — live seat updates (StrictMode-safe) ──────────────────
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelRef: { current: any } = { current: null }
    let active = true

    async function subscribe() {
      const { createBrowserClient } = await import('@supabase/ssr')
      if (!active) return  // effect was cleaned up before async import finished
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const ch = supabase
        .channel('seats-live')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'seats' }, payload => {
          const updated = payload.new as Seat
          setSeats(prev => {
            const next = new Map(prev)
            const existing = next.get(updated.id)
            if (existing) next.set(updated.id, { ...existing, status: updated.status })
            return next
          })
          setSelected(prev => (prev === updated.id && updated.status !== 'available') ? null : prev)
        })
        .subscribe()
      if (active) channelRef.current = ch
      else ch.unsubscribe()  // cleaned up while we were awaiting
    }

    subscribe().catch(console.error)
    return () => {
      active = false
      channelRef.current?.unsubscribe()
      channelRef.current = null
    }
  }, [])

  // ── Single-seat toggle: clicking a new seat replaces previous selection ───────
  const toggleSeat = useCallback((seatId: string) => {
    const seat = seatsRef.current.get(seatId)
    if (!seat || seat.status !== 'available') return
    setSelected(prev => {
      const next = prev === seatId ? null : seatId
      setTimeout(() => {
        const s = next ? seatsRef.current.get(next) : undefined
        onSelectionRef.current(s ? [s] : [])
      }, 0)
      return next
    })
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[#FCD116] border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] tracking-[0.2em] text-[#FCD116]/40 uppercase font-mono animate-pulse">
          Loading Hall Map…
        </span>
      </div>
    )
  }

  // ── Row renderer — 5-block layout matching the physical seating chart ─────────
  //
  //  [phantom][outerLeft 1-4][wing aisle][innerLeft 5-16][rowLabel]
  //  [center aisle][center 17-28][center aisle]
  //  [rowLabel][innerRight 29-40][wing aisle][outerRight 41-44][phantom]
  //
  // Phantom cells fill in where outer wing seats don't exist so every row is the
  // same total width — this creates the stepped fan shape from the photo.

  function renderSeat(id: string) {
    const seat = seats.get(id)
    if (!seat) return <div key={id} className="seat seat-taken opacity-20" />
    return <SeatBtn key={id} seat={seat} isSelected={selected === id} onToggle={toggleSeat} />
  }

  function renderRow(rowCfg: typeof ROW_CONFIGS[0]) {
    const entries         = getRowSeatEntries(rowCfg)
    const outerLeftSeats  = entries.filter(e => e.section === 'OL')
    const innerLeftSeats  = entries.filter(e => e.section === 'L')
    const centerSeats     = entries.filter(e => e.section === 'C')
    const innerRightSeats = entries.filter(e => e.section === 'R')
    const outerRightSeats = entries.filter(e => e.section === 'OR')

    const outerLeftPad  = MAX_OUTER - outerLeftSeats.length
    const outerRightPad = MAX_OUTER - outerRightSeats.length

    const rowColor = rowCfg.isBalcony ? 'text-[#9B8EC4]/50' : 'text-[#FCD116]/30'

    return (
      <div key={rowCfg.row} className="flex items-center justify-center">

        {/* ── Outer-left wing: phantom spacers + real seats (staggered) ── */}
        <div className="flex gap-[3px]">
          <Phantom count={outerLeftPad} />
          {outerLeftSeats.map(({ id }) => renderSeat(id))}
        </div>

        {/* Wing aisle — always present to keep columns aligned */}
        <div className="w-[5px] flex-shrink-0" />

        {/* ── Inner-left block (seats 5-16) ── */}
        <div className="flex gap-[3px]">
          {innerLeftSeats.map(({ id }) => renderSeat(id))}
        </div>

        {/* Row label left */}
        <span className={`text-[7px] font-mono select-none w-[18px] text-center flex-shrink-0 ${rowColor}`}>
          {rowCfg.row}
        </span>

        {/* ── Center aisle ── */}
        <div className="w-2 flex-shrink-0" />

        {/* ── Center block (seats 17-28) ── */}
        <div className="flex gap-[3px]">
          {centerSeats.map(({ id }) => renderSeat(id))}
          {rowCfg.isWheelchair && (
            <span
              className="flex items-center justify-center w-[18px] h-[18px] text-[10px] flex-shrink-0"
              title="Wheelchair Accessible"
            >
              ♿
            </span>
          )}
        </div>

        {/* ── Center aisle ── */}
        <div className="w-2 flex-shrink-0" />

        {/* Row label right */}
        <span className={`text-[7px] font-mono select-none w-[18px] text-center flex-shrink-0 ${rowColor}`}>
          {rowCfg.row}
        </span>

        {/* ── Inner-right block (seats 29-40) ── */}
        <div className="flex gap-[3px]">
          {innerRightSeats.map(({ id }) => renderSeat(id))}
        </div>

        {/* Wing aisle */}
        <div className="w-[5px] flex-shrink-0" />

        {/* ── Outer-right wing: real seats + phantom spacers (staggered) ── */}
        <div className="flex gap-[3px]">
          {outerRightSeats.map(({ id }) => renderSeat(id))}
          <Phantom count={outerRightPad} />
        </div>

      </div>
    )
  }

  const mainFloor = ROW_CONFIGS.filter(r => !r.isBalcony)
  const balcony   = ROW_CONFIGS.filter(r =>  r.isBalcony)

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-auto rounded-lg bg-[#090909] hall-grid relative border border-[#FCD116]/10"
      style={{ boxShadow: 'inset 0 0 80px rgba(252,209,22,0.04)', touchAction: 'pan-x pan-y' }}
    >
      <div className="scan-line" />

      {/* Corner accents */}
      {['top-2 left-2 border-t border-l','top-2 right-2 border-t border-r','bottom-2 left-2 border-b border-l','bottom-2 right-2 border-b border-r'].map((cls, i) => (
        <div key={i} className={`absolute w-4 h-4 border-[#FCD116]/20 ${cls}`} />
      ))}

      {/* 3-D perspective wrapper */}
      <div
        style={{
          perspective: '900px',
          perspectiveOrigin: '50% -10%',
          padding: '1.5rem 0.75rem 2rem',
          minWidth: 1020,
        }}
      >
        <div
          style={{
            transform: 'rotateX(16deg) scale(0.97)',
            transformOrigin: '50% 0',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* STAGE */}
          <div className="text-center mb-4">
            <div
              className="inline-block w-[52%] py-3 rounded-t text-[10px] tracking-[0.35em] uppercase font-mono select-none"
              style={{
                background: 'linear-gradient(135deg,rgba(200,16,46,0.55),rgba(252,209,22,0.3),rgba(0,107,63,0.55))',
                border: '1px solid rgba(252,209,22,0.22)',
                color: 'rgba(252,209,22,0.85)',
                boxShadow: '0 0 40px rgba(252,209,22,0.14), 0 8px 32px rgba(0,0,0,0.7)',
                textShadow: '0 0 14px rgba(252,209,22,0.5)',
              }}
            >
              ▲ &nbsp; S T A G E &nbsp; ▲
            </div>
            <div
              className="h-4 w-[58%] mx-auto rounded-b-[60%]"
              style={{ background: 'linear-gradient(to bottom, rgba(252,209,22,0.07), transparent)' }}
            />
          </div>

          {/* MAIN FLOOR (A-J) */}
          <div className="flex flex-col gap-[4px] items-center mb-1">
            {mainFloor.map(row => renderRow(row))}
          </div>

          {/* BALCONY DIVIDER */}
          <div className="flex items-center gap-3 my-3 px-4">
            <div className="flex-1 h-px bg-[#9B8EC4]/20" />
            <span className="text-[7px] tracking-[0.3em] uppercase text-[#9B8EC4]/40 font-mono select-none whitespace-nowrap">
              ── BALCONY ──
            </span>
            <div className="flex-1 h-px bg-[#9B8EC4]/20" />
          </div>

          {/* BALCONY (K-R) */}
          <div
            className="flex flex-col gap-[4px] items-center px-2 py-3 rounded"
            style={{
              background: 'rgba(155,142,196,0.04)',
              border: '1px solid rgba(155,142,196,0.1)',
              boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            {balcony.map(row => renderRow(row))}
          </div>

          {/* ENTRANCE */}
          <div className="flex flex-col items-center gap-2 mt-4">
            <div className="flex gap-8 items-center justify-center">
              <div
                className="w-16 h-7 rounded-sm"
                style={{ border: '1px solid rgba(138,112,85,0.2)', background: 'rgba(138,112,85,0.06)' }}
              />
              <div
                className="px-4 py-1.5 rounded-sm text-[8px] tracking-[0.2em] text-[#8A7055]/70 font-mono select-none"
                style={{ border: '1px solid rgba(138,112,85,0.25)', background: 'rgba(138,112,85,0.07)' }}
              >
                Family Room
              </div>
              <div
                className="w-16 h-7 rounded-sm"
                style={{ border: '1px solid rgba(138,112,85,0.2)', background: 'rgba(138,112,85,0.06)' }}
              />
            </div>
            <div className="flex gap-8 items-center justify-center">
              {['▲','▲','▲','▲'].map((t, i) => (
                <span key={i} className="text-[#FCD116]/20 text-xs">{t}</span>
              ))}
            </div>
            <span className="text-[7px] tracking-[0.25em] text-[#FCD116]/20 font-mono uppercase select-none">
              You Are Here · Entrance
            </span>
          </div>

          {/* Hint text */}
          <p className="text-center text-[9px] tracking-[0.2em] text-white/20 font-mono mt-4 select-none uppercase">
            {MAX_SEATS_PER_BOOKING === 1
              ? 'Click a seat to select · Click again to deselect'
              : `Select up to ${MAX_SEATS_PER_BOOKING} seats`}
          </p>
        </div>
      </div>

      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#FCD116]/15 to-transparent" />
    </div>
  )
}
