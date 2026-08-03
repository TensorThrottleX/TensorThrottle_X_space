// Activity Stream model — the standardized event every module publishes.
//
// Modules never talk to the Activity Center directly. They expose a provider
// (see ActivityProvider) that emits standardized Activity events; the center
// only consumes this interface. New modules can register a provider without
// touching the center, the types below, or any existing page.

export type ActivityAction = 'published' | 'updated' | 'added' | 'expanded'

/** Known modules (union is a convenience index; `module` itself is a string
 *  so brand-new modules register without any type edits). */
export const KNOWN_MODULES = [
  'feed',
  'thoughts',
  'projects',
  'experiments',
  'manifold',
  'anime-universe',
  'music-nebula',
  'universe',
] as const

export interface Activity {
  /** Stable unique id — dedupes and drives read-state. */
  id: string
  /** Registering module id (e.g. 'anime-universe', 'thoughts'). */
  module: string
  /** Entity kind inside the module (e.g. 'post', 'series', 'album'). */
  entityType: string
  /** Entity identifier inside the module (e.g. slug, series id). */
  entityId: string
  title: string
  action: ActivityAction
  /** ISO timestamp — the moment this event happened. */
  timestamp: string
  /** Existing route to open when the activity is clicked. */
  url: string
  /** Optional module-specific payload (counts, subtitles, tags...). */
  metadata?: Record<string, unknown>
}

/**
 * Provider contract — one per module. `load` must never throw: the center
 * degrades gracefully when a provider is unavailable (it treats a rejected
 * or thrown load as "no activity").
 */
export interface ActivityProvider {
  id: string
  load(signal?: AbortSignal): Promise<Activity[]>
}
