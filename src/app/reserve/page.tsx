'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ReserveContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const seatIds = (searchParams.get('seats') ?? '').split(',').filter(Boolean)
  const eventSlug = searchParams.get('event') ?? 'mh-2026-09-14'

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (loading) return
    if (!form.firstName || !form.lastName || !form.email) { setError('Please fill in all fields.'); return }
    if (!form.email.includes('@')) { setError('Please enter a valid email.'); return }
    if (seatIds.length === 0) { router.push('/seats'); return }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventSlug, name: `${form.firstName} ${form.lastName}`, email: form.email, seatIds }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); setLoading(false); return }
      router.push(`/ticket?ref=${data.booking.booking_ref}`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(252,209,22,0.05) 0%, transparent 65%)' }} />

      <div className="w-full max-w-md relative">
        {/* Top accent bar */}
        <div className="flex gap-0 h-1 mb-8 rounded-t-sm overflow-hidden">
          <div className="flex-1 bg-[#C8102E]" />
          <div className="flex-1 bg-[#FCD116]" />
          <div className="flex-1 bg-[#006B3F]" />
        </div>

        {/* Back nav */}
        <Link href="/seats" className="text-[#FCD116]/40 hover:text-[#FCD116] text-xs font-mono tracking-wider transition-colors block mb-6">
          ← Change Seats
        </Link>

        {/* Title */}
        <h2 className="font-[family-name:var(--font-bebas)] text-5xl tracking-wide text-white mb-1 leading-none">
          CONFIRM<br />
          <span className="text-[#FCD116]">RESERVATION</span>
        </h2>
        <p className="text-sm text-white/40 mb-7 leading-relaxed">
          Name + email only — your QR ticket arrives instantly.
        </p>

        {/* Selected seats */}
        <div className="flex flex-wrap gap-2 mb-6">
          {seatIds.map(id => (
            <span key={id} className="px-2.5 py-1 rounded-sm text-xs bg-[#006B3F]/20 border border-[#006B3F]/50 text-[#00C878] font-mono tracking-wider">
              {id}
            </span>
          ))}
        </div>

        {/* Notice */}
        <div className="border border-[#FCD116]/20 bg-[#FCD116]/5 rounded px-3.5 py-3 mb-6 text-sm text-[#FCD116]/70 flex gap-2.5">
          <span>📩</span>
          <span className="leading-relaxed">Your unique QR ticket is sent to your email immediately. Show it at the door.</span>
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { key: 'firstName', label: 'First Name', placeholder: 'Amara', autoComplete: 'given-name' },
            { key: 'lastName', label: 'Last Name', placeholder: 'Diallo', autoComplete: 'family-name' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] tracking-[0.15em] uppercase text-white/35 block mb-1.5 font-mono">{f.label}</label>
              <input
                type="text" placeholder={f.placeholder} autoComplete={f.autoComplete}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="input-dark"
              />
            </div>
          ))}
        </div>
        <div className="mb-5">
          <label className="text-[10px] tracking-[0.15em] uppercase text-white/35 block mb-1.5 font-mono">Email Address</label>
          <input
            type="email" placeholder="you@example.com" autoComplete="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="input-dark"
          />
        </div>

        {error && (
          <div className="mb-4 text-xs text-[#FF6B6B] bg-[#C8102E]/10 border border-[#C8102E]/30 rounded px-3 py-2">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full bg-[#FCD116] hover:bg-[#FFE14D] disabled:opacity-40 text-black py-4 rounded-sm text-sm tracking-[0.15em] uppercase font-bold transition-all hover:shadow-[0_8px_30px_rgba(252,209,22,0.4)]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Confirming…
            </span>
          ) : 'Confirm & Get Ticket'}
        </button>
      </div>
    </main>
  )
}

export default function ReservePage() {
  return <Suspense fallback={null}><ReserveContent /></Suspense>
}
