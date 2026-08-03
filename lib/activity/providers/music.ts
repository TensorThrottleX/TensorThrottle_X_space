// Music Nebula provider.
//
// The Music Nebula module has no published data yet (page is a placeholder).
// This provider polls a conventional data location
// (public/media/universe/music/albums.json) and degrades to an empty stream
// until the module publishes albums there — at which point Pulse surfaces
// them with zero changes to the Activity Center.

import type { Activity, ActivityProvider } from '@/types/activity'

interface Album {
  id: string
  title: string
  [key: string]: unknown
}

export const musicActivityProvider: ActivityProvider = {
  id: 'music-nebula',
  async load(signal) {
    try {
      const res = await fetch('/media/universe/music/albums.json', { signal })
      if (!res.ok) return []
      const albums = await res.json()
      if (!Array.isArray(albums)) return []
      return albums
        .filter((a: Album) => a && a.id && a.title)
        .map((a: Album) => ({
          id: `music-${a.id}`,
          module: 'music-nebula',
          entityType: 'album',
          entityId: a.id,
          title: a.title,
          action: 'added',
          timestamp: new Date().toISOString(),
          url: '/universe/music',
        } satisfies Activity))
    } catch {
      return [] // data not published yet — degrade gracefully
    }
  },
}
