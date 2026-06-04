import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Millennium Hall — Reserve Your Seat',
  description: 'An Evening at Millennium Hall. Reserve your seat for an unforgettable night.',
  openGraph: {
    title: 'Millennium Hall — Reserve Your Seat',
    description: 'An Evening at Millennium Hall. Reserve your seat for an unforgettable night.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="bg-[#1C1007] text-[#F0DFC0] antialiased">{children}</body>
    </html>
  )
}
