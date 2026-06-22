'use client'

import { useEffect } from 'react'

/**
 * Mobile browsers — especially in-app webviews (Instagram, TikTok, Messenger)
 * and iOS in Low Power Mode — frequently refuse muted-video autoplay until the
 * user interacts, leaving background videos frozen on a single frame ("static").
 * Desktop autoplays fine, which is why it only breaks on phones.
 *
 * This keeps every <video> playing: it forces muted/inline, retries play() after
 * load, on the first user gesture, on scroll, and when the tab becomes visible.
 */
export default function VideoAutoplay() {
  useEffect(() => {
    const videos = () => Array.from(document.querySelectorAll<HTMLVideoElement>('video'))

    const kick = () => {
      videos().forEach((v) => {
        // Defensive: these are the attributes mobile autoplay requires.
        v.muted = true
        v.defaultMuted = true
        v.setAttribute('muted', '')
        v.playsInline = true
        v.setAttribute('playsinline', '')
        if (v.paused) {
          const p = v.play()
          if (p && typeof p.catch === 'function') p.catch(() => {})
        }
      })
    }

    // Load timing varies on mobile — try a few times after mount.
    kick()
    const t1 = window.setTimeout(kick, 300)
    const t2 = window.setTimeout(kick, 1200)

    // A real user gesture unblocks playback in webviews / Low Power Mode.
    const opts: AddEventListenerOptions = { passive: true }
    window.addEventListener('touchstart', kick, opts)
    window.addEventListener('pointerdown', kick, opts)
    window.addEventListener('click', kick, opts)
    window.addEventListener('scroll', kick, opts)

    // Resume after the tab/app is brought back to the foreground.
    const onVisible = () => { if (!document.hidden) kick() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('touchstart', kick)
      window.removeEventListener('pointerdown', kick)
      window.removeEventListener('click', kick)
      window.removeEventListener('scroll', kick)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return null
}
