// Per-user read state for the Activity Center.
//
// Anonymous visitors: localStorage-backed (persists across sessions on the
// device). Authenticated users: swap in a database-backed implementation of
// the same ReadStateStore interface — no changes anywhere else (no new
// tables are created until authentication exists).

export interface ReadStateStore {
  getReadIds(): Set<string>
  markRead(id: string): void
  markAllRead(ids: string[]): void
}

const READ_KEY = 'ttx:pulse:read'
const MAX_READ_IDS = 400

function readFromStorage(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(READ_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed.slice(-MAX_READ_IDS))
  } catch {
    /* corrupted read state — start clean */
  }
  return new Set()
}

function writeToStorage(ids: Set<string>) {
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-MAX_READ_IDS)))
  } catch {
    /* storage blocked — read state degrades silently */
  }
}

/** localStorage implementation — the current (anonymous) store. */
export const localStorageReadStore: ReadStateStore = {
  getReadIds: readFromStorage,
  markRead(id) {
    const ids = readFromStorage()
    ids.add(id)
    writeToStorage(ids)
  },
  markAllRead(ids) {
    const current = readFromStorage()
    for (const id of ids) current.add(id)
    writeToStorage(current)
  },
}
