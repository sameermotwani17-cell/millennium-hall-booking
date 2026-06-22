'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type ScanResult =
  | { valid: true; booking_ref: string; attendee_name: string; seats: string[]; status: string }
  | { valid: false; error: string }

type BookingRow = {
  booking_ref: string
  attendee_name: string
  attendee_email: string
  seat_ids: string[]
  status: string
  created_at: string
  scanned_at: string | null
  scanned_by: string | null
}

export default function AdminPage() {
  const [adminName, setAdminName] = useState('Admin')
  const [manualRef, setManualRef] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found'>('idle')
  const [stats, setStats] = useState<{ total: number; scanned: number; confirmed: number } | null>(null)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [bookingsLoading, setBookingsLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastScannedRef = useRef<string | null>(null)

  // Fetch stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) setStats(await res.json())
    } catch {}
  }, [])

  const loadBookings = useCallback(async (query = '') => {
    setBookingsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      const res = await fetch(`/api/admin/bookings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings ?? [])
      }
    } catch {}
    finally { setBookingsLoading(false) }
  }, [])

  useEffect(() => {
    loadStats()
    loadBookings()
  }, [loadStats, loadBookings])

  useEffect(() => {
    const timer = setTimeout(() => loadBookings(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, loadBookings])

  const scanRef = useCallback(async (ref: string) => {
    if (!ref.trim() || loading) return
    setLoading(true)
    setResult(null)
    setScanStatus('found')
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef: ref.trim().toUpperCase(), usherName: adminName }),
      })
      const data = await res.json()
      setResult(res.ok ? { valid: true, ...data } : { valid: false, error: data.error })
      loadStats()
      loadBookings(searchQuery)
    } catch {
      setResult({ valid: false, error: 'Network error – try again' })
    } finally {
      setLoading(false)
      setManualRef('')
      setTimeout(() => { setScanStatus('idle'); lastScannedRef.current = null }, 3000)
    }
  }, [loading, adminName, loadStats, loadBookings, searchQuery])

  // Camera QR scanning
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
      setScanStatus('scanning')

      // Dynamic import jsqr to avoid SSR issues
      const jsQR = (await import('jsqr')).default
      scanIntervalRef.current = setInterval(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState !== 4) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        canvas.width  = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code?.data) {
          // Parse QR payload (JSON string)
          try {
            const payload = JSON.parse(code.data) as { ref?: string }
            const ref = payload.ref ?? code.data
            if (ref && ref !== lastScannedRef.current) {
              lastScannedRef.current = ref
              scanRef(ref)
            }
          } catch {
            // Raw string QR
            const ref = code.data
            if (ref && ref !== lastScannedRef.current) {
              lastScannedRef.current = ref
              scanRef(ref)
            }
          }
        }
      }, 400)
    } catch (err) {
      setCameraError(`Camera unavailable: ${(err as Error).message}`)
    }
  }, [scanRef])

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
    setScanStatus('idle')
    lastScannedRef.current = null
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // ── ADMIN PANEL ──────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* Header */}
      <div className="border-b border-white/8 bg-[#0D0D0D]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C8102E]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#006B3F]" />
              </div>
              <span className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-white">Admin Panel</span>
            </div>
            <p className="text-[10px] text-white/30 font-mono">Afro Week 2026 · {adminName}</p>
          </div>
          <input
            type="text"
            value={adminName}
            onChange={e => setAdminName(e.target.value)}
            className="input-dark max-w-40 rounded"
            placeholder="Admin name"
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Bookings', value: stats.total,     color: 'text-white' },
              { label: 'Confirmed',      value: stats.confirmed, color: 'text-[#FCD116]' },
              { label: 'Scanned In',     value: stats.scanned,   color: 'text-[#00C896]' },
            ].map(s => (
              <div key={s.label} className="bg-[#111] border border-white/8 rounded-lg p-4 text-center">
                <div className={`font-[family-name:var(--font-bebas)] text-3xl tracking-wide ${s.color}`}>{s.value}</div>
                <div className="text-[9px] tracking-[0.15em] uppercase text-white/30 mt-0.5 font-mono">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Camera QR Scanner */}
        <div className="bg-[#111] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Camera Scanner</h2>
              <p className="text-[10px] text-white/30 font-mono mt-0.5">Point camera at attendee QR ticket</p>
            </div>
            <button
              onClick={cameraActive ? stopCamera : startCamera}
              className={`px-4 py-2 rounded text-xs font-bold tracking-[0.12em] uppercase transition-all ${
                cameraActive
                  ? 'bg-[#C8102E]/20 border border-[#C8102E]/50 text-[#C8102E] hover:bg-[#C8102E]/30'
                  : 'bg-[#FCD116] text-black hover:bg-[#FFE14D]'
              }`}
            >
              {cameraActive ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>

          {/* Camera view */}
          <div className="relative bg-black aspect-video max-h-64">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20">
                    <path d="M3 9V6a3 3 0 013-3h3M15 3h3a3 3 0 013 3v3M3 15v3a3 3 0 003 3h3M15 21h3a3 3 0 003-3v-3" />
                    <rect x="8" y="8" width="8" height="8" rx="1" />
                  </svg>
                </div>
                <span className="text-[10px] text-white/25 font-mono">Camera off</span>
              </div>
            )}

            {cameraActive && scanStatus === 'scanning' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Scan overlay */}
                <div className="absolute inset-8 border border-[#FCD116]/30 rounded">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#FCD116]" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#FCD116]" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#FCD116]" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#FCD116]" />
                  {/* Animated scan line */}
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-[#FCD116]/60"
                    style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }}
                  />
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-[9px] text-[#FCD116]/60 font-mono tracking-[0.2em] uppercase">
                    Scanning for QR code…
                  </span>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center px-6">
                  <div className="text-[#C8102E] text-2xl mb-2">⚠</div>
                  <p className="text-xs text-white/60 font-mono">{cameraError}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry */}
        <div className="bg-[#111] border border-white/8 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white tracking-wide mb-1">Manual Entry</h2>
          <p className="text-[10px] text-white/30 font-mono mb-4">Enter booking reference directly</p>
          <div className="flex gap-2">
            <input
              type="text" value={manualRef}
              onChange={e => setManualRef(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && scanRef(manualRef)}
              placeholder="MH-XXXXXX"
              className="input-dark flex-1 rounded font-mono uppercase tracking-wider"
            />
            <button
              onClick={() => scanRef(manualRef)}
              disabled={loading || !manualRef.trim()}
              className="bg-[#FCD116] hover:bg-[#FFE14D] disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold px-5 py-2.5 rounded text-xs tracking-wide uppercase transition-all"
            >
              {loading ? '…' : 'Verify'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-xl p-5 border transition-all ${
            result.valid
              ? 'bg-[#006B3F]/15 border-[#006B3F]/40'
              : 'bg-[#C8102E]/12 border-[#C8102E]/40'
          }`}>
            {result.valid ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#006B3F]/30 border border-[#006B3F]/50 flex items-center justify-center text-xl">
                    ✅
                  </div>
                  <div>
                    <div className="font-bold text-[#00C896] tracking-wide">VALID · ADMIT</div>
                    <div className="text-[10px] text-white/40 font-mono">Booking confirmed and marked as scanned</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/40 font-mono text-xs">Name</span>
                    <span className="text-white font-semibold">{result.attendee_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 font-mono text-xs">Ref</span>
                    <span className="text-[#FCD116] font-mono font-bold">{result.booking_ref}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40 font-mono text-xs">Seats</span>
                    <span className="text-white font-mono">{result.seats.join(' · ')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C8102E]/25 border border-[#C8102E]/50 flex items-center justify-center text-xl flex-shrink-0">
                  ❌
                </div>
                <div>
                  <div className="font-bold text-[#C8102E] tracking-wide">INVALID</div>
                  <div className="text-sm text-white/70 mt-1">{result.error}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bookings list */}
        <div className="bg-[#111] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="text-sm font-semibold text-white tracking-wide">All Bookings</h2>
            <p className="text-[10px] text-white/30 font-mono mt-0.5">Search by name or ticket reference</p>
            <div className="mt-3">
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name or MH-XXXXXX…"
                className="input-dark rounded"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {bookingsLoading ? (
              <div className="py-10 text-center text-xs text-white/30 font-mono">Loading bookings…</div>
            ) : bookings.length === 0 ? (
              <div className="py-10 text-center text-xs text-white/30 font-mono">
                {searchQuery ? 'No bookings match your search' : 'No bookings yet'}
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#0D0D0D] text-[9px] tracking-[0.12em] uppercase text-white/30 font-mono">
                  <tr>
                    <th className="px-4 py-2.5 font-normal">Name</th>
                    <th className="px-4 py-2.5 font-normal">Reference</th>
                    <th className="px-4 py-2.5 font-normal">Seat</th>
                    <th className="px-4 py-2.5 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr
                      key={b.booking_ref}
                      className="border-t border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                      onClick={() => setManualRef(b.booking_ref)}
                    >
                      <td className="px-4 py-3 text-white">{b.attendee_name}</td>
                      <td className="px-4 py-3 text-[#FCD116] font-mono font-bold">{b.booking_ref}</td>
                      <td className="px-4 py-3 text-white/70 font-mono">{b.seat_ids.join(', ')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] tracking-wider uppercase font-mono ${
                          b.status === 'scanned'
                            ? 'bg-[#006B3F]/20 text-[#00C896] border border-[#006B3F]/40'
                            : b.status === 'confirmed'
                              ? 'bg-[#FCD116]/10 text-[#FCD116] border border-[#FCD116]/30'
                              : 'bg-white/5 text-white/40 border border-white/10'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!bookingsLoading && bookings.length > 0 && (
            <div className="px-5 py-2 border-t border-white/8 text-[9px] text-white/25 font-mono">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''} shown · tap a row to fill reference
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0%   { transform: translateY(-100px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0; }
        }
      `}</style>
    </main>
  )
}
