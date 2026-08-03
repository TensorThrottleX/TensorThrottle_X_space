// Pure aggregation logic for the Activity Center.
// Isolated from React and storage so it is independently testable:
// merge+sort, day grouping, and unread computation.

import { startOfDay, differenceInCalendarDays, format } from 'date-fns'
import type { Activity } from '@/types/activity'

export type ActivityGroupId = 'today' | 'yesterday' | 'earlier'

export interface ActivityGroup {
  id: ActivityGroupId
  label: string
  items: Activity[]
}

/** Dedupe by id and sort newest-first. Stable for identical timestamps. */
export function mergeAndSort(activities: Activity[]): Activity[] {
  const byId = new Map<string, Activity>()
  for (const a of activities) {
    if (!byId.has(a.id)) byId.set(a.id, a)
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function groupActivities(activities: Activity[], now = new Date()): ActivityGroup[] {
  const today = startOfDay(now)
  const groups: ActivityGroup[] = [
    { id: 'today', label: 'Today', items: [] },
    { id: 'yesterday', label: 'Yesterday', items: [] },
    { id: 'earlier', label: 'Earlier', items: [] },
  ]
  for (const a of activities) {
    const ts = new Date(a.timestamp)
    const days = differenceInCalendarDays(today, ts)
    if (days <= 0) groups[0].items.push(a)
    else if (days === 1) groups[1].items.push(a)
    else groups[2].items.push(a)
  }
  return groups.filter((g) => g.items.length > 0)
}

/** Flattened rows (group headers interleaved with items) for paginated rendering. */
export type GroupRow =
  | { kind: 'header'; id: string; label: string; group: ActivityGroupId }
  | { kind: 'item'; activity: Activity; unread: boolean }

export function buildGroupRows(
  activities: Activity[],
  readIds: Set<string>,
  now = new Date(),
): GroupRow[] {
  const rows: GroupRow[] = []
  for (const group of groupActivities(activities, now)) {
    rows.push({ kind: 'header', id: `header-${group.id}`, label: group.label, group: group.id })
    for (const activity of group.items) {
      rows.push({ kind: 'item', activity, unread: !readIds.has(activity.id) })
    }
  }
  return rows
}

export function computeUnreadCount(activities: Activity[], readIds: Set<string>): number {
  let count = 0
  for (const a of activities) {
    if (!readIds.has(a.id)) count++
  }
  return count
}

/** Compact header for the bell tooltip / panel subtitle. */
export function formatDayLabel(date: Date): string {
  return format(date, 'MMM d')
}
