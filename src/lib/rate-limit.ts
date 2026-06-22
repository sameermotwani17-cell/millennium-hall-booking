// Simple per-instance sliding-window rate limiter.
// Each Vercel function instance has its own counter, which is sufficient to
// stop bursts from a single client without requiring a shared store (Redis).
// Under multi-instance load the effective limit is limit × N instances, which
// is still a meaningful throttle for abuse prevention.

type Bucket = { count: number; resetAt: number }
const store = new Map<string, Bucket>()

// Prune expired entries every 500 calls to keep memory bounded.
let calls = 0
function prune() {
  if (++calls % 500 !== 0) return
  const now = Date.now()
  store.forEach((v, k) => { if (now > v.resetAt) store.delete(k) })
}

/** Returns { ok: true } when within limit, { ok: false, retryAfter } when exceeded. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  prune()
  const now = Date.now()
  const bucket = store.get(key)
  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  bucket.count++
  return { ok: true, retryAfter: 0 }
}

/** Extract the real client IP from Vercel / standard proxy headers. */
export function clientIp(req: { headers: { get(k: string): string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}
