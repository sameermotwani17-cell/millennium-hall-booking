'use client'

/**
 * The Walk — a game-style sprite scene.
 *
 * The grandfather and grandson are a two-frame walk-cycle sprite (walk-a /
 * walk-b, cut out to transparent PNGs) that translates across a golden-hour
 * savanna and vanishes into a glowing portal on the right — then reappears at
 * the back (far left) and walks again, forever. Pure CSS animation, no video.
 */
export default function TheWalk() {
  return (
    <div className="walk-scene relative w-full h-[82vh] min-h-[480px] overflow-hidden bg-black">

      {/* Sky — golden hour */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #160b1c 0%, #311a22 28%, #6e3519 58%, #b9651d 80%, #e2933a 100%)',
        }}
      />

      {/* Low sun glow near the horizon */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          bottom: '20%',
          width: '46vw',
          height: '46vw',
          background: 'radial-gradient(circle, rgba(255,205,110,0.55) 0%, rgba(255,150,60,0.15) 45%, transparent 65%)',
          filter: 'blur(18px)',
        }}
      />

      {/* Distant acacia tree silhouettes */}
      <svg className="absolute left-0 w-full pointer-events-none" style={{ bottom: '19%' }} viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
        <g fill="#160a05">
          <g transform="translate(120,30)"><rect x="14" y="40" width="5" height="90" /><ellipse cx="16" cy="40" rx="46" ry="16" /></g>
          <g transform="translate(420,55) scale(0.7)"><rect x="14" y="40" width="5" height="90" /><ellipse cx="16" cy="40" rx="46" ry="16" /></g>
          <g transform="translate(980,20) scale(1.15)"><rect x="14" y="40" width="6" height="100" /><ellipse cx="17" cy="40" rx="54" ry="18" /></g>
          <g transform="translate(720,60) scale(0.6)"><rect x="14" y="40" width="5" height="90" /><ellipse cx="16" cy="40" rx="46" ry="16" /></g>
        </g>
      </svg>

      {/* Ground band */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: '22%', background: 'linear-gradient(to bottom, #2c1409 0%, #150a04 100%)' }}
      />
      {/* Path highlight running to the portal */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0, left: '8%', right: '8%', height: '22%',
          background: 'radial-gradient(ellipse at 86% 0%, rgba(255,170,80,0.18), transparent 60%)',
        }}
      />

      {/* The portal */}
      <div className="walk-portal" />

      {/* The walker — game sprite */}
      <div className="walker">
        <div className="walker-bob">
          <div className="walk-shadow" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/walk-a.png" alt="A grandfather and his grandson walking" className="walk-frame a" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/walk-b.png" alt="" aria-hidden="true" className="walk-frame b" />
        </div>
      </div>

      {/* Pan-African hairline top */}
      <div className="absolute top-0 left-0 right-0 z-20 h-0.5 flex">
        <div className="flex-1 bg-[#C8102E]" />
        <div className="flex-1 bg-[#FCD116]" />
        <div className="flex-1 bg-[#006B3F]" />
      </div>
    </div>
  )
}
