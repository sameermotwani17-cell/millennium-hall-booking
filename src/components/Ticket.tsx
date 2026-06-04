'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import type { Booking } from '@/types'

interface Props {
  booking: Booking & { events?: { name: string; date: string; venue: string; address: string } }
}

export default function Ticket({ booking }: Props) {
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(booking.qr_payload, {
      errorCorrectionLevel: 'M', margin: 1, width: 120,
      color: { dark: '#2E1A08', light: '#FFFEF8' }
    }).then(setQrUrl)
  }, [booking.qr_payload])

  const eventName = booking.events?.name ?? 'An Evening at Millennium'

  return (
    <div className="bg-[#F8F3E8] rounded-xl overflow-hidden shadow-2xl w-full max-w-[580px] mx-auto" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="h-[3px] bg-gradient-to-r from-[#2E4A2E] via-[#C4622D] to-[#C9930A]" />

      <div className="bg-gradient-to-br from-[#2E1A08] to-[#1A0F04] px-7 py-6 flex justify-between items-start">
        <div>
          <div className="text-xl font-bold text-[#F0DFC0] tracking-wide">{eventName}</div>
          <div className="text-xs text-[#C8A97A] mt-1 tracking-wider">Millennium Hall · Saturday 14 September 2026 · 7:30 PM</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] tracking-[0.15em] uppercase text-[#8A7055] mb-1">Booking Ref</div>
          <div className="text-[#F0B824] font-bold text-sm">{booking.booking_ref}</div>
        </div>
      </div>

      <div className="px-7 py-5 grid grid-cols-[1fr_auto] gap-5 items-start">
        <div className="space-y-4">
          <div>
            <div className="text-[9px] tracking-[0.18em] uppercase text-[#8A7055] mb-0.5">Attendee</div>
            <div className="text-lg italic text-[#2E1A08]">{booking.attendee_name}</div>
          </div>
          <div className="flex gap-6">
            <div>
              <div className="text-[9px] tracking-[0.18em] uppercase text-[#8A7055] mb-0.5">Seat(s)</div>
              <div className="text-xl font-bold text-[#2E1A08]">{booking.seat_ids.join(', ')}</div>
            </div>
            <div>
              <div className="text-[9px] tracking-[0.18em] uppercase text-[#8A7055] mb-0.5">Date</div>
              <div className="text-sm text-[#2E1A08]">14 Sep 2026</div>
            </div>
            <div>
              <div className="text-[9px] tracking-[0.18em] uppercase text-[#8A7055] mb-0.5">Doors</div>
              <div className="text-sm text-[#2E1A08]">7:00 PM</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          {qrUrl ? (
            <div className="p-2 bg-white rounded border border-[#8A7055]/15">
              <img src={qrUrl} alt="QR Code" width={110} height={110} />
            </div>
          ) : (
            <div className="w-[110px] h-[110px] bg-[#F0E8D5] rounded flex items-center justify-center text-xs text-[#8A7055]">Loading…</div>
          )}
          <span className="text-[9px] text-[#8A7055] tracking-wider">Scan at entry</span>
        </div>
      </div>

      <div className="border-t-2 border-dashed border-[#8A7055]/25 mx-0 px-7 py-3 bg-[#F0E8D5] flex justify-between items-center">
        <div className="italic text-[#5C3D1E] text-sm">Admit — {booking.seat_ids.length} Guest(s)</div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#8A7055]">
          <div className="w-2 h-2 rounded-full bg-[#2E4A2E]" />
          Valid for single entry
        </div>
      </div>
      <div className="bg-[#E8DFC8] px-7 py-2 flex justify-between">
        <div className="text-[10px] text-[#8A7055]">{booking.booking_ref} · millennium-hall.com</div>
        <div className="text-[10px] text-[#5C3D1E] font-medium">Free Admission</div>
      </div>
    </div>
  )
}
