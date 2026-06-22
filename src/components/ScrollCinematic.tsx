'use client'

import { useEffect } from 'react'

export default function ScrollCinematic() {
  useEffect(() => {
    // ── Scroll progress bar ─────────────────────────────
    const bar = document.getElementById('sc-progress-bar')

    // ── Parallax: video containers with data-parallax ──
    // Videos must be slightly oversized (height 110%, top -5%) so edges
    // don't become visible as they translate.
    const parallaxTargets = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))

    // ── Reveal: any element with data-reveal ────────────
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            ;(entry.target as HTMLElement).classList.add('revealed')
            revealObs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => revealObs.observe(el))

    // ── Scroll handler ───────────────────────────────────
    const onScroll = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight

      // Progress bar
      if (bar) bar.style.width = `${(scrolled / total) * 100}%`

      // Parallax
      parallaxTargets().forEach((section) => {
        const speed = parseFloat(section.dataset.parallax ?? '0.25')
        const rect = section.getBoundingClientRect()
        const centerDiff = rect.top + rect.height / 2 - window.innerHeight / 2
        const vid = section.querySelector<HTMLVideoElement>('video')
        if (vid) {
          vid.style.transform = `translateY(${centerDiff * speed}px) translateZ(0)`
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      revealObs.disconnect()
    }
  }, [])

  return (
    // Pan-African scroll progress bar — fixed to top, above everything
    <div
      id="sc-progress-bar"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        height: '3px',
        width: '0%',
        background: 'linear-gradient(90deg, #C8102E 0%, #FCD116 50%, #006B3F 100%)',
        transition: 'width 60ms linear',
        pointerEvents: 'none',
      }}
    />
  )
}
