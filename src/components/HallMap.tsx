'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SECTION_CONFIG, ZONE_LABELS, MAX_SEATS_PER_BOOKING } from '@/lib/hall-config'
import type { Seat } from '@/types'

interface Props {
  eventId: string
  onSelectionChange: (seats: Seat[]) => void
}

export default function HallMap({ eventId, onSelectionChange }: Props) {
  const [seats, setSeats] = useState<Map<string, Seat>>(new Map())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)
  const supabaseRef = createClient()

  useEffect(() => {
    const supabase = supabaseRef
    const fetchSeats = async () => {
      const { data } = await supabase
        .from('seats')
        .select('*')
        .eq('event_id', eventId)
      if (data) {
        const map = new Map<string, Seat>()
        data.forEach(s => map.set(s.id, s as Seat))
        setSeats(map)
      }
      setLoading(false)
    }
    fetchSeats()

    const channel = supabase.channel('seats-realtime')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'seats',
        filter: `event_id=eq.${eventId}`
      }, payload => {
        setSeats(prev => {
          const next = new Map(prev)
          next.set(payload.new.id, payload.new as Seat)
          return next
        })
      }).subscribe()

    return () => { supabase.removeChannel(channel) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const toggleSeat = useCallback((seatId: string) => {
    const seat = seats.get(seatId)
    if (!seat || seat.status !== 'available') return

    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(seatId)) {
        next.delete(seatId)
      } else {
        if (next.size >= MAX_SEATS_PER_BOOKING) return prev
        next.add(seatId)
      }
      const selectedSeats = Array.from(next).map(id => seats.get(id)!).filter(Boolean)
      onSelectionChange(selectedSeats)
      return next
    })
  }, [seats, onSelectionChange])

  const getSeatClass = (seat: Seat): string => {
    const base = 'seat w-[13px] h-[13px] rounded-t-sm rounded-b flex-shrink-0 relative'
    if (selected.has(seat.id)) return `${base} seat-selected`
    if (seat.status === 'reserved' || seat.status === 'taken') return `${base} seat-taken`
    if (seat.zone === 'premium') return `${base} seat seat-premium seat-available`
    return `${base} seat seat-available`
  }

  function renderBlock(sectionId: string) {
    const config = SECTION_CONFIG.find(s => s.id === sectionId)
    if (!config) return null

    return (
      <div key={sectionId} className="flex flex-col gap-[2px] items-start">
        {Array.from({ length: config.rows }, (_, ri) => {
          const rowLabel = String.fromCharCode(65 + ri)
          return (
            <div key={rowLabel} className="flex items-center gap-[2px]">
              <span className="text-[8px] text-[#C8A97A]/20 w-3 text-right flex-shrink-0 mr-1 font-mono">{rowLabel}</span>
              {Array.from({ length: config.cols }, (_, ci) => {
                const seatId = `${sectionId}${rowLabel}${String(ci + 1).padStart(2, '0')}`
                const seat = seats.get(seatId)
                if (!seat) {
                  return <div key={seatId} className="w-[13px] h-[13px] rounded flex-shrink-0 bg-[#C8A97A]/5" />
                }
                return (
                  <div
                    key={seatId}
                    className={getSeatClass(seat)}
                    onClick={() => toggleSeat(seatId)}
                    onMouseEnter={e => setTooltip({
                      x: e.clientX, y: e.clientY,
                      text: `${seatId} · ${ZONE_LABELS[seat.zone]} · Row ${rowLabel}, Seat ${ci + 1}`,
                    })}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  function renderSection(label: string, children: React.ReactNode[]) {
    return (
      <div key={label} className="flex flex-col items-center gap-0.5 w-full">
        <div className="flex items-center gap-2 w-full mb-0.5">
          <div className="flex-1 h-px bg-[#C8A97A]/8" />
          <span className="text-[8px] tracking-[0.18em] uppercase text-[#C8A97A]/20 whitespace-nowrap">{label}</span>
          <div className="flex-1 h-px bg-[#C8A97A]/8" />
        </div>
        <div className="flex items-start justify-center gap-0">{children}</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C4622D] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto border border-[#C8A97A]/10 rounded-lg bg-[#0E0904] relative"
      onMouseLeave={() => setTooltip(null)}>
      {tooltip && (
        <div className="fixed z-50 bg-[#1A0F04] border border-[#C8A97A]/20 rounded px-2 py-1 text-xs text-[#F0DFC0] pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}>
          {tooltip.text}
        </div>
      )}

      <div style={{ perspective: '900px', padding: '1rem 1rem 2.5rem' }}>
        <div style={{ transform: 'rotateX(22deg)', transformOrigin: '50% 0%', transformStyle: 'preserve-3d' }}>
          {/* Stage */}
          <div className="text-center mb-2">
            <div className="inline-block w-[55%] bg-gradient-to-b from-[rgba(100,65,25,0.9)] to-[rgba(60,35,10,0.7)] border border-[#C8A97A]/25 rounded-t py-2.5 text-[10px] tracking-[0.25em] uppercase text-[#C8A97A]/70"
              style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.5)' }}>
              ▲  S T A G E  ▲
            </div>
            <div className="h-3 w-[65%] mx-auto bg-gradient-to-b from-[rgba(60,35,10,0.5)] to-transparent rounded-b-[50%]" />
          </div>

          {/* Hall body */}
          <div className="flex flex-col items-center gap-2" style={{ minWidth: 680 }}>
            {renderSection('Ground Floor — Stalls', [
              renderBlock('L'),
              <div key="a1" className="w-5 flex-shrink-0" />,
              renderBlock('C'),
              <div key="a2" className="w-5 flex-shrink-0" />,
              renderBlock('R'),
            ])}

            {renderSection('Front Corner Blocks', [
              renderBlock('FL'),
              <div key="cs" className="w-[160px] flex-shrink-0" />,
              renderBlock('FR'),
            ])}

            <div className="flex items-center gap-3 w-full my-2">
              <div className="flex-1 h-px bg-[#C8A97A]/12" />
              <div className="text-[9px] tracking-[0.2em] uppercase text-[#C8A97A]/25 whitespace-nowrap">BALCONY</div>
              <div className="flex-1 h-px bg-[#C8A97A]/12" />
            </div>

            {renderSection('Balcony', [
              renderBlock('BL'),
              <div key="ba1" className="w-5 flex-shrink-0" />,
              renderBlock('BC'),
              <div key="ba2" className="w-5 flex-shrink-0" />,
              renderBlock('BR'),
            ])}

            {renderSection('Rear Balcony', [
              renderBlock('RL'),
              <div key="ra" className="w-5 flex-shrink-0" />,
              renderBlock('RR'),
            ])}
          </div>
        </div>
      </div>
    </div>
  )
}
