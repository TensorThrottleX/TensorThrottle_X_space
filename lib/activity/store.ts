// Client-side activity store — lazy loading + caching for the bell.
//
// Nothing is requested until the panel is opened (lazy). Loads are memoized
// in memory (60s TTL) and a compact id/timestamp snapshot is persisted to
// localStorage so the unread indicator survives reloads without fetching.
// Failures fall back to the last good snapshot — graceful degradation.

import type { Activity } from '@/types/activity'
import { loadAllActivities } from './registry'
import { mergeAndSort } from './aggregate'

const TTL_MS = 60_000
const CACHE_KEY = 'ttx:pulse:cache'
const MAX_CACHE_ITEMS = 40

interface MiniActivity {
  id: string
  timestamp: string
}

let memoryCache: { activities: Activity[]; at: number } | null = null

export async function getActivities(force = false): Promise<Activity[]> {
  if (!force && memoryCache && Date.now() - memoryCache.at < TTL_MS) {
    return memoryCache.activities
  }
  try {
    const fresh = mergeAndSort(await loadAllActivities())
    memoryCache = { activities: fresh, at: Date.now() }
    persistMiniCache(fresh)
    return fresh
  } catch {
    return memoryCache?.activities ?? []
  }
}

function persistMiniCache(activities: Activity[]) {
  try {
    const mini: MiniActivity[] = activities
      .slice(0, MAX_CACHE_ITEMS)
      .map((a) => ({ id: a.id, timestamp: a.timestamp }))
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(mini))
  } catch {
    /* storage blocked — indicator degrades silently */
  }
}

function readMiniCache(): MiniActivity[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((x) => x && typeof x.id === 'string')
  } catch {
    /* corrupted cache — start clean */
  }
  return []
}

/** Ids of the most recently seen activities — drives the unread indicator
 *  without triggering a fetch (the dot is as fresh as the last check). */
export function getCachedActivityIds(): string[] {
  return readMiniCache().map((x) => x.id)
}

/** True when any previously-seen activity has not been read yet. */
export function hasUnseenActivity(readIds: Set<string>): boolean {
  return readMiniCache().some((x) => !readIds.has(x.id))
}
