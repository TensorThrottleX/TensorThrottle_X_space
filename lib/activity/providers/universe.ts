// Universe provider — surfaces the universe map itself as one aggregate
// activity ("new cards" = enabled sectors online). Reads the existing
// src/data/universe.ts; clicking opens the first enabled sector route.

import type { Activity, ActivityProvider } from '@/types/activity'
import { universeItems } from '@/src/data/universe'
import { deriveActivityTimestamp } from '../time'

export const universeActivityProvider: ActivityProvider = {
  id: 'universe',
  async load() {
    const enabled = universeItems.filter((item) => item.enabled)
    if (enabled.length === 0) return []
    const firstRoute = enabled[0].route ?? '/universe/anime'
    return [
      {
        id: 'universe-cards',
        module: 'universe',
        entityType: 'sector',
        entityId: 'universe-cards',
        title: 'Universe received new cards',
        action: 'expanded',
        timestamp: deriveActivityTimestamp('universe-cards'),
        url: firstRoute,
        metadata: { sectors: enabled.length, total: universeItems.length },
      } satisfies Activity,
    ]
  },
}
