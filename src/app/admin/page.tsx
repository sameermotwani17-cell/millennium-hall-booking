'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const PAGE_SIZE = 50

type ScanResult =
  | { valid: true; booking_ref: string; attendee_name: string; seats: string[]; status: string }
  | { valid: false; error: string }

type BookingRow = {
  id: string
  booking_ref: string
  attendee_name: string
  attendee_email: string
  seat_ids: string[]
  status: string
  created_at: string
  scanned_at: string | null
  scanned_by: string | null
}

function statusStyle(s: string) {
  if (s === 'scanned')   return 'bg-[#00C896]/15 text-[#00C896] border-[#00C896]/30'
  if (s === 'confirmed') return 'bg-[#FCD116]/10 text-[#FCD116] border-[#FCD116]/30'
  if (s === 'cancelled') return 'bg-[#C8102E]/10 text-[#C8102E] border-[#C8102E]/30'
  return 'bg-white/5 text-white/40 border-white/10'
}

export default function AdminPage() {
  const [pin, setPin]               = useState('')
  const [pinVerified, setPinVerified] = useState(false)
  const [pinError, setPinError]     = useState('')
  const [verifying, setVerifying]   = useState(false)
  const [adminName, setAdminName]   = useState('Admin')

  const [manualRef, setManualRef]   = useState('')
  const [result, setResult]         = useState<ScanResult | null>(null)
  const [loading, setLoading]       = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError]   = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found'>('idle')
  const [stats, setStats]           = useState<{ total: number; scanned: number; confirmed: number } | null>(null)

  // Guest list
  const [bookings, setBookings]           = useState<BookingRow[]>([])
  const [bookingsTotal, setBookingsTotal] = useState(0)
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingOffset, setBookingOffset] = useState(0)

  const videoRef        = useRef<HTMLVideoElement>(null)
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const streamRef       = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastScannedRef  = useRef<string | null>(null)
  const debounceRef     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listAbortRef    = useRef<AbortController | null>(null)
  // Stable refs so callbacks don't stale-close over search/offset
  const searchRef = useRef(bookingSearch)
  const offsetRef = useRef(bookingOffset)
  searchRef.current = bookingSearch
  offsetRef.current = bookingOffset

  // ── Stats ────────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-pin': pin } })
      if (res.ok) setStats(await res.json())
    } catch {}
  }, [pin])

  useEffect(() => {
    if (!pinVerified) return
    loadStats()
    const id = setInterval(loadStats, 10_000)
    return () => clearInterval(id)
  }, [pinVerified, loadStats])

  // ── Guest list ───────────────────────────────────────────────────────────
  const loadBookings = useCallback(async (search: string, offset: number) => {
    listAbortRef.current?.abort()
    const ctrl = new AbortController()
    listAbortRef.current = ctrl
    setBookingsLoading(true)
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) })
      if (search) params.set('search', search)
      const res = await fetch(`/api/admin/bookings?${params}`, {
        headers: { 'x-admin-pin': pin },
        signal: ctrl.signal,
      })
      if (!res.ok) return
      const data = await res.json()
      setBookings(data.bookings ?? [])
      setBookingsTotal(data.total ?? 0)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setBookings([])
    } finally {
      setBookingsLoading(false)
    }
  }, [pin])

  // Debounce search
  useEffect(() => {
    if (!pinVerified) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setBookingOffset(0); loadBookings(bookingSearch, 0) }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [bookingSearch, pinVerified, loadBookings])

  // Reload on page change
  useEffect(() => {
    if (!pinVerified) return
    loadBookings(searchRef.current, bookingOffset)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingOffset, pinVerified])

  // ── PIN gate (server-verified) ────────────────────────────────────────────
  const verifyPin = async () => {
    if (pin.length < 4) { setPinError('Enter a 4-digit PIN'); return }
    setVerifying(true); setPinError('')
    try {
      const res = await fetch('/api/admin/stats', { headers: { 'x-admin-pin': pin } })
      if (res.ok) { setStats(await res.json()); setPinVerified(true) }
      else setPinError('Incorrect PIN – try again')
    } catch { setPinError('Connection error – try again') }
    finally { setVerifying(false) }
  }

  // ── Scan ─────────────────────────────────────────────────────────────────
  const scanRef = useCallback(async (ref: string) => {
    if (!ref.trim() || loading) return
    setLoading(true); setResult(null); setScanStatus('found')
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef: ref.trim().toUpperCase(), pin, usherName: adminName }),
      })
      const data = await res.json()
      setResult(res.ok ? { valid: true, ...data } : { valid: false, error: data.error })
      loadStats()
      loadBookings(searchRef.current, offsetRef.current)
    } catch {
      setResult({ valid: false, error: 'Network error – try again' })
    } finally {
      setLoading(false); setManualRef('')
      setTimeout(() => { setScanStatus('idle'); lastScannedRef.current = null }, 3000)
    }
  }, [loading, pin, adminName, loadStats, loadBookings])

  // ── Camera ────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      setCameraActive(true); setScanStatus('scanning')
      const jsQR = (await import('jsqr')).default
      scanIntervalRef.current = setInterval(() => {
        const video = videoRef.current; const canvas = canvasRef.current
        if (!video || !canvas || video.readyState !== 4) return
        const ctx = canvas.getContext('2d'); if (!ctx) return
        canvas.width = video.videoWidth; canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)
        const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)
        if (code?.data) {
          let r = code.data
          try { r = (JSON.parse(code.data) as { ref?: string }).ref ?? code.data } catch {}
          if (r && r !== lastScannedRef.current) { lastScannedRef.current = r; scanRef(r) }
        }
      }, 400)
    } catch (err) { setCameraError(`Camera unavailable: ${(err as Error).message}`) }
  }, [scanRef])

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false); setScanStatus('idle'); lastScannedRef.current = null
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  // ── PIN GATE ──────────────────────────────────────────────────────────────
  if (!pinVerified) {
    return (
      <main className="min-h-screen bg-[#080808] flex items-center justify-center px-6">
        <div className="w-full max-w-xs">
          <div className="flex gap-1 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#C8102E]" />
            <div className="w-2 h-2 rounded-full bg-[#FCD116]" />
            <div className="w-2 h-2 rounded-full bg-[#006B3F]" />
          </div>
          <h1 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white mb-1">Admin Panel</h1>
          <p className="text-xs text-white/30 mb-8 font-mono">Afro Week 2026 · Ticket Scanner</p>
          <div className="bg-[#111] border border-white/8 rounded-xl p-6 space-y-4">
            <div>
              <label className="text-[10px] tracking-widest uppercase text-white/40 block mb-2 font-mono">Your Name</label>
              <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)}
                className="admin-input w-full" placeholder="Admin / Usher name" />
            </div>
            <div>
              <label className="text-[10px] tracking-widest uppercase text-white/40 block mb-2 font-mono">PIN</label>
              <input type="password" value={pin}
                onChange={e => { setPin(e.target.value); setPinError('') }}
                onKeyDown={e => e.key === 'Enter' && verifyPin()}
                className="admin-input w-full" placeholder="0000" />
            </div>
            {pinError && <p className="text-xs text-[#FF6B6B] font-mono">{pinError}</p>}
            <button onClick={verifyPin} disabled={verifying}
              className="w-full bg-[#FCD116] hover:bg-[#FFE14D] disabled:opacity-50 text-black font-bold py-3 rounded text-xs tracking-[0.15em] uppercase transition-all">
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : 'Enter Admin Panel'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ── ADMIN DASHBOARD ───────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="border-b border-white/8 bg-[#0D0D0D]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C8102E]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#FCD116]" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#006B3F]" />
              </div>
              <span className="font-[family-name:var(--font-bebas)] text-xl tracking-wider">Admin Panel</span>
            </div>
            <p className="text-[10px] text-white/30 font-mono">Afro Week 2026 · {adminName}</p>
          </div>
          <button onClick={() => { stopCamera(); setPinVerified(false); setPin(''); setBookings([]) }}
            className="text-xs text-white/30 hover:text-white border border-white/10 rounded px-3 py-1.5 font-mono transition-colors">
            Lock
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Stats – auto-refreshes every 10 s */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',     value: stats.total,     color: 'text-white' },
              { label: 'Confirmed', value: stats.confirmed, color: 'text-[#FCD116]' },
              { label: 'Scanned',   value: stats.scanned,   color: 'text-[#00C896]' },
            ].map(s => (
              <div key={s.label} className="bg-[#111] border border-white/8 rounded-lg p-4 text-center">
                <div className={`font-[family-name:var(--font-bebas)] text-3xl tracking-wide ${s.color}`}>{s.value}</div>
                <div className="text-[9px] tracking-[0.15em] uppercase text-white/30 mt-0.5 font-mono">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Camera scanner */}
        <div className="bg-[#111] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-wide">Camera Scanner</h2>
              <p className="text-[10px] text-white/30 font-mono mt-0.5">Point at attendee QR ticket</p>
            </div>
            <button onClick={cameraActive ? stopCamera : startCamera}
              className={`px-4 py-2 rounded text-xs font-bold tracking-[0.12em] uppercase transition-all ${
                cameraActive
                  ? 'bg-[#C8102E]/20 border border-[#C8102E]/50 text-[#C8102E] hover:bg-[#C8102E]/30'
                  : 'bg-[#FCD116] text-black hover:bg-[#FFE14D]'
              }`}>
              {cameraActive ? 'Stop' : 'Start Camera'}
            </button>
          </div>
          <div className="relative bg-black aspect-video max-h-64">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
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
                <div className="absolute inset-8 border border-[#FCD116]/30 rounded">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#FCD116]" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#FCD116]" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#FCD116]" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#FCD116]" />
                  <div className="absolute left-0 right-0 h-0.5 bg-[#FCD116]/60"
                    style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }} />
                </div>
                <span className="absolute bottom-3 left-0 right-0 text-center text-[9px] text-[#FCD116]/60 font-mono tracking-[0.2em] uppercase">
                  Scanning…
                </span>
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center px-6">
                  <p className="text-[#C8102E] text-2xl mb-2">⚠</p>
                  <p className="text-xs text-white/60 font-mono">{cameraError}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual entry */}
        <div className="bg-[#111] border border-white/8 rounded-xl p-5">
          <h2 className="text-sm font-semibold tracking-wide mb-1">Manual Entry</h2>
          <p className="text-[10px] text-white/30 font-mono mb-4">Type or paste a booking reference</p>
          <div className="flex gap-2">
            <input type="text" value={manualRef}
              onChange={e => setManualRef(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && scanRef(manualRef)}
              placeholder="MH-XXXXXX"
              className="admin-input flex-1 font-mono uppercase tracking-wider" />
            <button onClick={() => scanRef(manualRef)}
              disabled={loading || !manualRef.trim()}
              className="bg-[#FCD116] hover:bg-[#FFE14D] disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold px-5 py-2.5 rounded text-xs tracking-wide uppercase transition-all">
              {loading ? '…' : 'Verify'}
            </button>
          </div>
        </div>

        {/* Scan result */}
        {result && (
          <div className={`rounded-xl p-5 border transition-all ${
            result.valid ? 'bg-[#006B3F]/15 border-[#006B3F]/40' : 'bg-[#C8102E]/12 border-[#C8102E]/40'
          }`}>
            {result.valid ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#006B3F]/30 border border-[#006B3F]/50 flex items-center justify-center text-xl">✅</div>
                  <div>
                    <div className="font-bold text-[#00C896] tracking-wide">VALID · ADMIT</div>
                    <div className="text-[10px] text-white/40 font-mono">Marked as scanned</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Name',  val: result.attendee_name,      cls: 'text-white font-semibold' },
                    { label: 'Ref',   val: result.booking_ref,         cls: 'text-[#FCD116] font-mono font-bold' },
                    { label: 'Seats', val: result.seats.join(' · '),   cls: 'text-white font-mono' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between">
                      <span className="text-white/40 font-mono text-xs">{r.label}</span>
                      <span className={r.cls}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#C8102E]/25 border border-[#C8102E]/50 flex items-center justify-center text-xl flex-shrink-0">❌</div>
                <div>
                  <div className="font-bold text-[#C8102E] tracking-wide">INVALID</div>
                  <div className="text-sm text-white/70 mt-1">{result.error}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GUEST LIST ──────────────────────────────────────────────────── */}
        <div className="bg-[#111] border border-white/8 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold tracking-wide">Guest List</h2>
              <p className="text-[10px] text-white/30 font-mono mt-0.5">
                {bookingsLoading ? 'Loading…' : `${bookingsTotal} booking${bookingsTotal !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="w-full sm:w-64">
              <input type="search" value={bookingSearch}
                onChange={e => setBookingSearch(e.target.value)}
                placeholder="Search name, ref, or email…"
                className="admin-input w-full text-xs" />
            </div>
          </div>

          <div className="overflow-x-auto">
            {bookings.length === 0 && !bookingsLoading ? (
              <p className="px-5 py-10 text-center text-white/25 text-xs font-mono">
                {bookingSearch ? 'No results.' : 'No bookings yet.'}
              </p>
            ) : (
              <table className="w-full text-xs min-w-[520px]">
                <thead>
                  <tr className="border-b border-white/8">
                    {['Name', 'Ref', 'Seats', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-white/30 font-mono tracking-[0.1em] uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id ?? b.booking_ref} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{b.attendee_name}</td>
                      <td className="px-4 py-3 text-[#FCD116] font-mono whitespace-nowrap">{b.booking_ref}</td>
                      <td className="px-4 py-3 text-white/50 font-mono whitespace-nowrap">{b.seat_ids?.join(', ') ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border font-mono uppercase ${statusStyle(b.status)}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {b.status === 'confirmed' && (
                          <button onClick={() => scanRef(b.booking_ref)}
                            className="text-[10px] bg-[#FCD116]/10 hover:bg-[#FCD116]/20 border border-[#FCD116]/30 text-[#FCD116] px-2.5 py-1 rounded font-mono uppercase tracking-wide transition-colors">
                            Admit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {bookingsTotal > PAGE_SIZE && (
            <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
              <button onClick={() => setBookingOffset(o => Math.max(0, o - PAGE_SIZE))}
                disabled={bookingOffset === 0}
                className="text-xs text-white/40 hover:text-white disabled:opacity-20 font-mono transition-colors">
                ← Prev
              </button>
              <span className="text-[10px] text-white/25 font-mono">
                {bookingOffset + 1}–{Math.min(bookingOffset + PAGE_SIZE, bookingsTotal)} of {bookingsTotal}
              </span>
              <button onClick={() => setBookingOffset(o => o + PAGE_SIZE)}
                disabled={bookingOffset + PAGE_SIZE >= bookingsTotal}
                className="text-xs text-white/40 hover:text-white disabled:opacity-20 font-mono transition-colors">
                Next →
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
