'use client'

import { useEffect, useRef } from 'react'

/**
 * Scroll-driven poster formation.
 *
 * A tall outer <section> (≈320vh) pins a 100vh stage. As the user scrolls
 * through the section, the cinematic video is scrubbed from its first frame
 * (particles in the void) to its last frame (the exact "The Line They Drew"
 * poster) — so the poster literally forms in slow motion as you scroll down.
 *
 * The exact poster PNG is used as the <video> poster + a static fallback,
 * so if the video can't load the page still shows the real artwork.
 */
export default function LineFormation() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const video = videoRef.current
    if (!section || !video) return

    // Respect reduced-motion: leave the finished poster on screen, no scrubbing.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    video.pause()

    let target = 0 // where the playhead should be (seconds)
    let current = 0 // smoothed playhead
    let raf = 0
    let inView = false

    const compute = () => {
      const total = section.offsetHeight - window.innerHeight
      const top = section.getBoundingClientRect().top
      const scrolled = Math.min(Math.max(-top, 0), Math.max(total, 1))
      const progress = total > 0 ? scrolled / total : 0
      const dur = video.duration || 8
      // Stop a hair before the end so the final poster frame stays pinned.
      target = Math.max(0, Math.min(progress * dur, dur - 0.04))
      // Fade the title overlay out as the poster forms.
      if (overlayRef.current) {
        overlayRef.current.style.opacity = String(Math.max(0, 1 - progress * 2))
      }
    }

    const loop = () => {
      current += (target - current) * 0.12 // lerp → buttery scrub
      if (Math.abs(target - current) < 0.001) current = target
      if (video.readyState >= 2) {
        try { video.currentTime = current } catch { /* seek not ready */ }
      }
      if (inView) raf = requestAnimationFrame(loop)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        cancelAnimationFrame(raf)
        if (inView) {
          compute()
          raf = requestAnimationFrame(loop)
        }
      },
      { threshold: 0 },
    )
    io.observe(section)

    const onScroll = () => { if (inView) compute() }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', compute)
    compute()

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', compute)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative" style={{ height: '320vh' }}>
      {/* Pinned cinematic stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-black flex items-center justify-center">

        {/* The formation video — full-bleed 16:9, scrubbed by scroll.
            object-cover fills the stage so there are no letterbox boundaries;
            the dark surround + vignette melt the edges into the page. */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          src="/the-line-forming.mp4"
          poster="/the-line-poster-16x9.png"
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 z-10 w-full h-full object-cover"
        />

        {/* Title overlay over the opening void — fades out as the poster forms,
            so the top of the page is never blank. */}
        <div
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6"
          style={{ opacity: 1 }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-10 bg-[#FCD116]/50" />
            <span className="text-[#FCD116] text-[9px] tracking-[0.45em] uppercase font-medium">Afroweek presents</span>
            <div className="h-px w-10 bg-[#FCD116]/50" />
          </div>
          <h1 className="font-[family-name:var(--font-bebas)] leading-none">
            <span className="block text-[clamp(52px,11vw,140px)] text-white tracking-[0.05em]">THE LINE</span>
            <span
              className="block text-[clamp(52px,11vw,140px)] tracking-[0.05em] -mt-2"
              style={{
                background: 'linear-gradient(90deg, #C8102E 0%, #FCD116 50%, #006B3F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              THEY DREW
            </span>
          </h1>
          <p className="text-white/45 text-[10px] md:text-xs tracking-[0.25em] uppercase mt-6 font-mono">
            Drama · Music · Dance · Choir · Traditional Fashion
          </p>
        </div>

        {/* Seamless blend — fade the frame edges to pure black so the video
            dissolves into the background with no visible boundary, while the
            centered poster keeps full colour contrast. */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.5)_72%,#000_100%)]" />

        {/* Subtle grain */}
        <div
          className="pointer-events-none absolute inset-0 z-20 opacity-[0.1]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
            backgroundSize: '180px',
          }}
        />

        {/* Scroll hint — fades as you go */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 animate-pulse">
          <span className="text-[9px] tracking-[0.35em] uppercase text-white/40 font-mono">Scroll to reveal</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(252,209,22,0.6)" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </section>
  )
}
