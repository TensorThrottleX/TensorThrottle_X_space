// Activity Stream model — the standardized event every module publishes.
//
// Modules never talk to the Activity Center directly. They expose a provider
// (see ActivityProvider) that emits standardized Activity events; the center
// only consumes this interface. New modules can register a provider without
// touching the center, the types below, or any existing page.

export type ActivityAction = 'Created' | 'Updated' | 'Published' | 'Archived' | 'Deleted' | 'Restored' | 'Hidden' | 'Pinned' | 'Featured' | 'Expanded' | string

export interface Activity {
  id: string
  source: string
  entityType: string
  entityId: string
  action: ActivityAction
  title: string
  description: string
  url: string
  icon: string
  priority: number
  visibility: 'public' | 'private' | 'unlisted'
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
}

export interface ActivityPublisher {
  id: string
  publish(): Promise<Activity[]>
}
