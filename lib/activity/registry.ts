// Activity provider registry.
//
// The Activity Center only knows this registry: modules publish by calling
// registerActivityProvider (once, at module load), the center aggregates by
// asking every registered provider. Adding a module = registering a provider;
// the center itself never changes. Providers that fail degrade gracefully —
// loadAllActivities uses allSettled so one unavailable provider never
// silences the others.

import type { Activity, ActivityProvider } from '@/types/activity'

const providers = new Map<string, ActivityProvider>()

export function registerActivityProvider(provider: ActivityProvider): void {
  providers.set(provider.id, provider)
}

export function unregisterActivityProvider(id: string): void {
  providers.delete(id)
}

export function getActivityProviders(): ActivityProvider[] {
  return [...providers.values()]
}

/** Aggregate every registered provider. Never throws. */
export async function loadAllActivities(signal?: AbortSignal): Promise<Activity[]> {
  const results = await Promise.allSettled(
    [...providers.values()].map((p) => p.load(signal)),
  )
  const activities: Activity[] = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      activities.push(...(Array.isArray(r.value) ? r.value : []))
    } else {
      console.warn(`[Pulse] Activity provider "${[...providers.keys()][i]}" unavailable — skipping.`)
    }
  })
  return activities
}
