'use client'

export default function LinesTheyDrewVideo() {
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      autoPlay muted loop playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover"
      style={{ filter: 'brightness(0.55) saturate(1.3)' }}
    >
      <source src="/lines-they-drew.mp4" type="video/mp4" />
    </video>
  )
}
