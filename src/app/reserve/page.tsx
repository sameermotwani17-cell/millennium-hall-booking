'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ReserveContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const seatIds = (searchParams.get('seats') ?? '').split(',').filter(Boolean)
  const eventSlug = searchParams.get('event') ?? 'mh-2026-09-14'

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      setError('Please fill in all fields.'); return
    }
    if (!form.email.includes('@')) { setError('Please enter a valid email.'); return }
    if (seatIds.length === 0) { router.push('/seats'); return }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug,
          name: `${form.firstName} ${form.lastName}`,
          email: form.email,
          seatIds,
        }),
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
    <main className="min-h-screen bg-[#0E0904] flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md bg-[#140C04]/80 border border-[#C8A97A]/12 rounded-xl p-8 backdrop-blur-xl">
        <h2 className="font-[family-name:var(--font-cormorant)] text-3xl font-light text-[#F0DFC0] mb-1">
          Reserve Your Place
        </h2>
        <p className="text-sm text-[#8A7055] mb-6 leading-relaxed">
          Just your name and email — your QR ticket arrives instantly.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {seatIds.map(id => (
            <span key={id} className="px-2.5 py-1 rounded-full text-xs bg-[#4A7A4A]/15 border border-[#4A7A4A]/35 text-[#4A7A4A]">
              {id}
            </span>
          ))}
        </div>

        <div className="bg-[#2E4A2E]/12 border border-[#2E4A2E]/25 rounded-lg p-3 mb-5 text-sm text-[#4A7A4A] flex gap-2">
          <span>📩</span>
          <span>Your unique QR ticket will be sent to your email immediately. Show it at the door — our ushers will scan and guide you to your seat.</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { key: 'firstName', label: 'First Name', placeholder: 'Hiroshi', autoComplete: 'given-name' },
            { key: 'lastName',  label: 'Last Name',  placeholder: 'Tanaka',  autoComplete: 'family-name' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] tracking-[0.12em] uppercase text-[#8A7055] block mb-1.5">{f.label}</label>
              <input
                type="text" placeholder={f.placeholder} autoComplete={f.autoComplete}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-white/4 border border-[#C8A97A]/15 rounded px-3 py-2.5 text-sm text-[#F0DFC0] placeholder-[#C8A97A]/20 focus:outline-none focus:border-[#C8A97A]/40 transition-colors"
              />
            </div>
          ))}
        </div>
        <div className="mb-5">
          <label className="text-[10px] tracking-[0.12em] uppercase text-[#8A7055] block mb-1.5">Email Address</label>
          <input
            type="email" placeholder="hiroshi@example.com" autoComplete="email"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full bg-white/4 border border-[#C8A97A]/15 rounded px-3 py-2.5 text-sm text-[#F0DFC0] placeholder-[#C8A97A]/20 focus:outline-none focus:border-[#C8A97A]/40 transition-colors"
          />
        </div>

        {error && (
          <div className="mb-4 text-xs text-[#C4622D] bg-[#C4622D]/10 border border-[#C4622D]/25 rounded px-3 py-2">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit} disabled={loading}
          className="w-full bg-[#2E4A2E] hover:bg-[#4A7A4A] disabled:opacity-50 text-[#F0DFC0] py-3.5 rounded text-sm tracking-[0.1em] uppercase font-medium transition-all">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[#F0DFC0] border-t-transparent rounded-full animate-spin" />
              Confirming…
            </span>
          ) : 'Confirm Reservation'}
        </button>
      </div>
    </main>
  )
}

export default function ReservePage() {
  return <Suspense fallback={null}><ReserveContent /></Suspense>
}
