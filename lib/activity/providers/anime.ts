// Anime Universe provider — reads the EXISTING /api/universe/anime endpoint
// (returns an array of series). Series have no date metadata, so each gets a
// stable derived timestamp (see lib/activity/time.ts). Clicking opens the
// existing /universe/anime route.

import type { Activity, ActivityProvider } from '@/types/activity'
import { deriveActivityTimestamp } from '../time'

interface AnimeSeries {
  id: string
  title: string
  subtitle?: string
  accentColor?: string
  [key: string]: unknown
}

export const animeActivityProvider: ActivityProvider = {
  id: 'anime-universe',
  async load(signal) {
    try {
      const res = await fetch('/api/universe/anime', { signal })
      if (!res.ok) return []
      const seriesList = await res.json()
      if (!Array.isArray(seriesList)) return []
      return seriesList
        .filter((s: AnimeSeries) => s && s.id && s.title)
        .map((s: AnimeSeries) => ({
          id: `anime-${s.id}`,
          module: 'anime-universe',
          entityType: 'series',
          entityId: s.id,
          title: s.title,
          action: 'updated',
          timestamp: deriveActivityTimestamp(`anime-${s.id}`),
          url: '/universe/anime',
          metadata: { subtitle: s.subtitle ?? null },
        } satisfies Activity))
    } catch {
      return [] // provider unavailable — degrade gracefully
    }
  },
}
