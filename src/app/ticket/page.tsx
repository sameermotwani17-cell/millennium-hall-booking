'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Booking } from '@/types'

const TicketComponent = dynamic(() => import('@/components/Ticket'), { ssr: false })

function TicketContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const [booking, setBooking] = useState<(Booking & { events?: { name: string; date: string; venue: string; address: string } }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ref) { setError('No booking reference found.'); setLoading(false); return }
    fetch(`/api/ticket/${ref}`)
      .then(r => r.json())
      .then(d => { if (d.booking) setBooking(d.booking); else setError('Booking not found.') })
      .catch(() => setError('Failed to load ticket.'))
      .finally(() => setLoading(false))
  }, [ref])

  if (loading) return (
    <div className="min-h-screen bg-[#0E0904] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C4622D] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#0E0904] flex items-center justify-center px-6">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠</div>
        <div className="text-[#C4622D] text-lg mb-2">{error}</div>
        <a href="/seats" className="text-sm text-[#8A7055] underline">Back to seat selection</a>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0A0604] to-[#0C1108] flex flex-col items-center px-4 py-20">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 fade-up">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2E4A2E]/20 border border-[#4A7A4A]/30 mb-4 relative">
            <span className="text-xl">✓</span>
            <div className="absolute inset-0 rounded-full border border-[#4A7A4A]/20 pulse-ring" />
          </div>
          <h2 className="font-[family-name:var(--font-cormorant)] text-3xl font-light text-[#F0DFC0]">
            Reservation Confirmed
          </h2>
          <p className="text-sm text-[#8A7055] mt-2">
            A copy has been sent to {booking?.attendee_email}
          </p>
        </div>

        <div className="fade-up" style={{ animationDelay: '0.1s' }}>
          {booking && <TicketComponent booking={booking} />}
        </div>

        <div className="flex gap-3 mt-6 justify-center flex-wrap fade-up" style={{ animationDelay: '0.2s' }}>
          <button onClick={() => window.print()}
            className="bg-[#2E4A2E] hover:bg-[#4A7A4A] text-[#F0DFC0] px-6 py-2.5 rounded text-xs tracking-[0.1em] uppercase font-medium transition-colors">
            ⬇ Save / Print Ticket
          </button>
          <a href="/"
            className="border border-[#C8A97A]/25 hover:bg-[#C8A97A]/6 text-[#C8A97A] px-6 py-2.5 rounded text-xs tracking-[0.1em] uppercase font-medium transition-colors">
            Back to Event
          </a>
        </div>

        <div className="mt-6 bg-[#2E4A2E]/12 border border-[#2E4A2E]/25 rounded-lg p-4 text-sm text-[#4A7A4A] text-center fade-up" style={{ animationDelay: '0.3s' }}>
          ✓ Show this QR code to the usher at the entrance — they will verify and escort you to your seat.
        </div>
      </div>

      <style>{`@media print { body { background: white !important; } main { padding: 0 !important; } button, a { display: none !important; } }`}</style>
    </main>
  )
}

export default function TicketPage() {
  return <Suspense fallback={null}><TicketContent /></Suspense>
}
