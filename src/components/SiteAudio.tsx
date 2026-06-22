'use client'

import { useEffect, useRef, useState } from 'react'

export default function SiteAudio() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [shown, setShown] = useState(false)
  const triedRef = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || triedRef.current) return
    triedRef.current = true

    audio.volume = 0.35
    audio.loop = true

    const startAudio = () =>
      audio.play().then(() => {
        setPlaying(true)
        setShown(true)
      }).catch(() => {})

    // Try autoplay immediately (works on desktop / some mobile)
    audio.play().then(() => {
      setPlaying(true)
      setShown(true)
    }).catch(() => {
      // Autoplay blocked — show button and start on first user gesture
      setShown(true)
      const unlock = () => {
        startAudio()
        document.removeEventListener('click', unlock)
        document.removeEventListener('touchstart', unlock)
        document.removeEventListener('touchend', unlock)
        document.removeEventListener('keydown', unlock)
      }
      document.addEventListener('click', unlock)
      document.addEventListener('touchstart', unlock, { passive: true })
      document.addEventListener('touchend', unlock, { passive: true })
      document.addEventListener('keydown', unlock)
    })

    // Resume if browser pauses it (e.g. after navigation on iOS)
    const onPause = () => {
      if (!audio.ended) {
        audio.play().catch(() => {})
      }
    }
    audio.addEventListener('pause', onPause)
    return () => audio.removeEventListener('pause', onPause)
  }, [])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      // Detach the auto-resume so manual pause sticks
      audio.onpause = null
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  return (
    <>
      <audio ref={audioRef} src="/unavailable.mp4" preload="auto" />

      {shown && (
        <button
          onClick={toggle}
          aria-label={playing ? 'Mute music' : 'Play music'}
          // bottom-24 on mobile: sits above the ~65px confirm bar on /seats
          // md:bottom-5 on desktop: standard corner position
          className="fixed right-4 bottom-24 md:bottom-5 z-[9998] flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-mono tracking-wider transition-all select-none"
          style={{
            background: 'rgba(10,10,10,0.85)',
            border: '1px solid rgba(252,209,22,0.25)',
            color: playing ? 'rgba(252,209,22,0.9)' : 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(8px)',
            boxShadow: playing ? '0 0 18px rgba(252,209,22,0.15)' : 'none',
          }}
        >
          {playing ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FCD116] opacity-50" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FCD116]" />
              </span>
              <span>UNAVAILABLE</span>
              <span className="opacity-50">· pause</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span>UNAVAILABLE</span>
            </>
          )}
        </button>
      )}
    </>
  )
}
