'use client'

import { useEffect } from 'react'

export default function ScrollCinematic() {
  useEffect(() => {
    // ── Scroll progress bar ─────────────────────────────
    const bar = document.getElementById('sc-progress-bar')

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── Reveal helpers ──────────────────────────────────
    // Content defaults to opacity:0 in CSS, so it MUST be revealed by JS.
    // We never rely on a single mechanism: IntersectionObserver is the
    // primary path, but a scroll-driven check + a load-time safety net
    // guarantee content appears even when IO is throttled or never fires
    // (in-app browsers like Instagram/TikTok, iOS Low Power Mode, etc.).
    const reveal = (el: Element) => el.classList.add('revealed')

    const revealEls = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))

    // Reveal anything already within (or near) the viewport.
    const revealInView = () => {
      const trigger = window.innerHeight * 0.92
      revealEls().forEach((el) => {
        if (el.classList.contains('revealed')) return
        if (el.getBoundingClientRect().top < trigger) reveal(el)
      })
    }

    // Reduced motion: skip all animation, just show everything.
    if (reduceMotion) {
      revealEls().forEach(reveal)
      if (bar) bar.style.width = '0%'
      return
    }

    // ── Reveal: IntersectionObserver (primary) ───────────
    let revealObs: IntersectionObserver | null = null
    if ('IntersectionObserver' in window) {
      revealObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              reveal(entry.target)
              revealObs?.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
      )
      revealEls().forEach((el) => revealObs?.observe(el))
    }

    // ── Parallax: video containers with data-parallax ──
    // Videos must be slightly oversized (height 110%, top -5%) so edges
    // don't become visible as they translate.
    const parallaxTargets = () =>
      Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'))

    // ── Scroll handler ───────────────────────────────────
    const onScroll = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight

      // Progress bar
      if (bar) bar.style.width = `${total > 0 ? (scrolled / total) * 100 : 0}%`

      // Reveal fallback — works even when IntersectionObserver doesn't fire.
      revealInView()

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
    window.addEventListener('resize', revealInView, { passive: true })
    onScroll()

    // Safety net: ensure above-the-fold content reveals shortly after load
    // even if IO never fires and the user hasn't scrolled yet.
    const t1 = window.setTimeout(revealInView, 200)
    const t2 = window.setTimeout(revealInView, 1200)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', revealInView)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      revealObs?.disconnect()
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
