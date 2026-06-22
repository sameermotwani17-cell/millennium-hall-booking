import type { Metadata } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import './globals.css'
import ScrollCinematic from '@/components/ScrollCinematic'
import VideoAutoplay from '@/components/VideoAutoplay'
import SiteAudio from '@/components/SiteAudio'

const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AFRO WEEK 2026 — Reserve Your Seat',
  description: 'The biggest African cultural celebration of the year. Reserve your seat for an unforgettable night at Millennium Hall.',
  openGraph: {
    title: 'AFRO WEEK 2026 — Reserve Your Seat',
    description: 'The biggest African cultural celebration of the year.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebas.variable} ${inter.variable}`}>
      <body className="bg-[#0A0A0A] text-[#F5F0E8] antialiased">
        <ScrollCinematic />
        <VideoAutoplay />
        <SiteAudio />
        {children}
      </body>
    </html>
  )
}
