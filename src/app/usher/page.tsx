'use client'

import { useState } from 'react'

type ScanResult =
  | { valid: true; booking_ref: string; attendee_name: string; seats: string[] }
  | { valid: false; error: string }

export default function UsherPage() {
  const [manualRef, setManualRef] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [usherName, setUsherName] = useState('Usher')

  const scanRef = async (ref: string) => {
    if (!ref.trim()) return
    setLoading(true); setResult(null)
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingRef: ref.trim().toUpperCase(), usherName }),
    })
    const data = await res.json()
    setResult(res.ok ? { valid: true, ...data } : { valid: false, error: data.error })
    setLoading(false)
    setManualRef('')
  }

  return (
    <main className="min-h-screen bg-[#0E0904] flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-[family-name:var(--font-cormorant)] text-3xl text-[#F0DFC0]">Usher Panel</div>
          <p className="text-xs text-[#8A7055] mt-1">Scan a QR code or enter booking ref manually</p>
        </div>

        <div className="bg-[#140C04] border border-[#C8A97A]/12 rounded-xl p-6 mb-4">
          <label className="text-[10px] tracking-widest uppercase text-[#8A7055] block mb-3">Your Name</label>
          <input
            type="text"
            value={usherName}
            onChange={e => setUsherName(e.target.value)}
            className="w-full bg-white/4 border border-[#C8A97A]/15 rounded px-3 py-2 text-sm text-[#F0DFC0] focus:outline-none focus:border-[#C8A97A]/40"
            placeholder="Usher name"
          />
        </div>

        <div className="bg-[#140C04] border border-[#C8A97A]/12 rounded-xl p-6 mb-4">
          <label className="text-[10px] tracking-widest uppercase text-[#8A7055] block mb-3">Booking Reference</label>
          <div className="flex gap-2">
            <input
              type="text" value={manualRef}
              onChange={e => setManualRef(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && scanRef(manualRef)}
              placeholder="MH-XXXXXX"
              className="flex-1 bg-white/4 border border-[#C8A97A]/15 rounded px-3 py-2.5 text-base text-[#F0DFC0] font-mono focus:outline-none focus:border-[#C8A97A]/40 uppercase tracking-wider placeholder-[#C8A97A]/20"
            />
            <button onClick={() => scanRef(manualRef)} disabled={loading}
              className="bg-[#C4622D] hover:bg-[#D4703A] text-white px-4 py-2.5 rounded text-sm disabled:opacity-50 transition-colors">
              {loading ? '…' : 'Verify'}
            </button>
          </div>
        </div>

        {result && (
          <div className={`rounded-xl p-5 border ${result.valid ? 'bg-[#2E4A2E]/20 border-[#4A7A4A]/40' : 'bg-[#C4622D]/15 border-[#C4622D]/40'}`}>
            {result.valid ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-semibold text-[#4A7A4A]">VALID — Admit</div>
                    <div className="text-xs text-[#8A7055]">Booking confirmed and marked as scanned</div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div><span className="text-[#8A7055]">Name: </span><span className="text-[#F0DFC0] font-medium">{result.attendee_name}</span></div>
                  <div><span className="text-[#8A7055]">Ref: </span><span className="text-[#C9930A] font-mono">{result.booking_ref}</span></div>
                  <div><span className="text-[#8A7055]">Seats: </span><span className="text-[#F0DFC0]">{result.seats.join(', ')}</span></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl">❌</span>
                <div>
                  <div className="font-semibold text-[#C4622D]">INVALID</div>
                  <div className="text-sm text-[#F0DFC0] mt-0.5">{result.error}</div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
