'use client'

import { useEffect, useRef, useState } from 'react'

export default function SiteAudio() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [shown, setShown] = useState(false)
  const triedRef = useRef(false)
  const userPausedRef = useRef(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || triedRef.current) return
    triedRef.current = true

    audio.volume = 0.35
    audio.loop = true

    const startAudio = async () => {
      try {
        await audio.play()
        userPausedRef.current = false
        setPlaying(true)
        setShown(true)
      } catch {
        setPlaying(false)
        setShown(true)
      }
    }

    const unlock = () => {
      startAudio()
      removeUnlockListeners()
    }

    const removeUnlockListeners = () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('touchend', unlock)
      document.removeEventListener('keydown', unlock)
    }

    startAudio().catch(() => {})

    if (audio.paused) {
      document.addEventListener('click', unlock)
      document.addEventListener('touchstart', unlock, { passive: true })
      document.addEventListener('touchend', unlock, { passive: true })
      document.addEventListener('keydown', unlock)
    }

    const onPause = () => {
      setPlaying(false)
      if (!audio.ended && !userPausedRef.current) {
        audio.play().then(() => setPlaying(true)).catch(() => setShown(true))
      }
    }

    const onPlay = () => setPlaying(true)
    const onError = () => {
      setPlaying(false)
      setShown(false)
    }

    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('error', onError)

    return () => {
      removeUnlockListeners()
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('error', onError)
    }
  }, [])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      userPausedRef.current = true
      audio.pause()
      setPlaying(false)
      return
    }

    userPausedRef.current = false
    audio.play().then(() => setPlaying(true)).catch(() => setShown(true))
  }

  return (
    <>
      <audio ref={audioRef} src="/unavailable.mp4" preload="metadata" playsInline />

      {shown && (
        <button
          onClick={toggle}
          aria-label={playing ? 'Mute music' : 'Play music'}
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
              <span className="opacity-50">pause</span>
            </>
          ) : (
            <>
              <span>Play</span>
              <span>UNAVAILABLE</span>
            </>
          )}
        </button>
      )}
    </>
  )
}
