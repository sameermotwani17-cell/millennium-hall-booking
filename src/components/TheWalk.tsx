'use client'

/**
 * The Walk — a game-style sprite scene.
 *
 * The grandfather and grandson are a two-frame walk-cycle sprite (walk-a /
 * walk-b, cut out to transparent PNGs) that translates across a golden-hour
 * savanna and vanishes into a glowing portal on the right — then reappears at
 * the back (far left) and walks again, forever. Pure CSS animation, no video.
 * The contact shadow stays planted on the ground so they read as walking,
 * not floating.
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

      {/* Low sun glow near the horizon, behind the portal */}
      <div
        className="absolute pointer-events-none"
        style={{
          right: '6%',
          bottom: '14%',
          width: '34vw',
          height: '34vw',
          transform: 'translateX(20%)',
          background: 'radial-gradient(circle, rgba(255,210,120,0.5) 0%, rgba(255,150,60,0.12) 45%, transparent 62%)',
          filter: 'blur(14px)',
        }}
      />

      {/* Distant hills rooted on the horizon (the top of the ground band) */}
      <svg
        className="absolute left-0 w-full pointer-events-none"
        style={{ bottom: '22%', height: '14%' }}
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0,120 L0,70 Q150,30 320,58 Q520,92 720,46 Q900,8 1060,52 Q1140,74 1200,60 L1200,120 Z" fill="#1d0f08" opacity="0.85" />
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
          bottom: 0, left: '6%', right: '6%', height: '22%',
          background: 'radial-gradient(ellipse at 88% 0%, rgba(255,170,80,0.16), transparent 58%)',
        }}
      />

      {/* The portal — standing on the ground */}
      <div className="walk-portal" />

      {/* The walker — game sprite. Shadow stays on the ground; bodies bob. */}
      <div className="walker">
        <div className="walk-shadow" />
        <div className="walker-bob">
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
