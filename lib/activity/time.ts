// Timestamp helpers for the Activity Stream.
//
// Real sources (feed posts) publish real timestamps. Static sources
// (anime series, universe cards) have no date metadata, so they get a
// STABLE derived timestamp — deterministic per entity (same FNV-hash
// technique the app uses elsewhere), landing within the last few days so
// the Today / Yesterday grouping reads naturally without ever flickering.

const DERIVE_WINDOW_MS = 5 * 24 * 60 * 60 * 1000 // last 5 days

export function deriveActivityTimestamp(seed: string): string {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const offsetMs = (h >>> 0) % DERIVE_WINDOW_MS
  return new Date(Date.now() - offsetMs).toISOString()
}
