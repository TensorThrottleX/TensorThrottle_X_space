// Shared rate-limiting utilities for API route handlers.
//
// Two styles, one module:
//   * createMemoryRateLimiter()     — original keyed limiter (PATCH/DELETE
//     like/report routes): one call per key per window; returns true = limited.
//   * createInMemoryRateLimiter()   — sliding-window counter limiter (comments
//     POST, views POST): at most N calls per IP per window; `.allow()`.
//
// Memory layers are per serverless instance (reset on cold start) — they are
// the fast first line of defense. Routes with a persistent signal (e.g. an IP
// stored in a table) add a DB-backed layer on top (see /api/comments POST).

import type { NextRequest } from 'next/server'

export const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

/** Best-effort client IP — consistent across all rate-limited routes. */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

/**
 * Keyed limiter — the original abstraction. Returns a check function;
 * calling it with a composite key (e.g. `${ip}:edit`) returns TRUE when the
 * key is already inside the window (i.e. the request is rate-limited).
 * One request per key per window.
 */
export function createMemoryRateLimiter(windowMs: number = RATE_LIMIT_WINDOW_MS) {
  const lastHit = new Map<string, number>()

  return (key: string): boolean => {
    const now = Date.now()
    const last = lastHit.get(key)
    if (last !== undefined && now - last < windowMs) return true

    // Lazy cleanup: drop stale entries once the map grows large
    if (lastHit.size > 1000) {
      for (const [k, ts] of lastHit.entries()) {
        if (now - ts > windowMs * 2) lastHit.delete(k)
      }
    }

    lastHit.set(key, now)
    return false
  }
}

export interface InMemoryRateLimiter {
  /** True when the request is allowed; false when the limit is exceeded. */
  allow(ip: string): boolean
}

/**
 * Sliding-window counter limiter: at most `maxRequests` calls per IP per
 * window. `maxRequests: 1` reproduces the keyed limiter's "one request per
 * window per IP" behavior (comments POST).
 */
export function createInMemoryRateLimiter(options: {
  windowMs?: number
  maxRequests: number
  maxEntries?: number
}): InMemoryRateLimiter {
  const windowMs = options.windowMs ?? RATE_LIMIT_WINDOW_MS
  const maxRequests = options.maxRequests
  const maxEntries = options.maxEntries ?? 10_000
  const hits = new Map<string, number[]>()

  const prune = (now: number) => {
    const cutoff = now - windowMs
    for (const [ip, times] of hits) {
      const recent = times.filter((t) => t > cutoff)
      if (recent.length === 0) hits.delete(ip)
      else if (recent.length !== times.length) hits.set(ip, recent)
    }
    // Size guard: drop the oldest entries once the map grows too large.
    while (hits.size > maxEntries) {
      let oldestIp: string | null = null
      let oldestTs = Infinity
      for (const [ip, times] of hits) {
        const last = times[times.length - 1]
        if (last < oldestTs) {
          oldestTs = last
          oldestIp = ip
        }
      }
      if (oldestIp === null) break
      hits.delete(oldestIp)
    }
  }

  return {
    allow(ip: string): boolean {
      const now = Date.now()
      if (hits.size >= maxEntries) prune(now)
      const times = hits.get(ip)
      const recent = times ? times.filter((t) => t > now - windowMs) : []
      if (recent.length >= maxRequests) {
        if (times && recent.length !== times.length) hits.set(ip, recent)
        return false
      }
      recent.push(now)
      hits.set(ip, recent)
      return true
    },
  }
}
