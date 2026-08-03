// Client-side session deduplication for discussion views.
//
// A view is recorded ONLY when the Discussion Workspace genuinely opens,
// and only once per browser session per post: this module is the "has the
// user already been counted recently?" gate that guards the server call.
// The server adds its own daily dedup (unique post_slug + visitor_key +
// view_date) so cleared storage, reloads, or multi-tab cannot inflate counts.

const SESSION_KEY = 'ttx:view-session'
const STORE_KEY = 'ttx:view-session-store'

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      window.sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

function readStore(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    /* corrupted store — start clean */
  }
  return []
}

function writeStore(slugs: string[]) {
  try {
    window.sessionStorage.setItem(STORE_KEY, JSON.stringify(slugs))
  } catch {
    /* storage blocked — dedup degrades to server-side only */
  }
}

/**
 * Marks this session as having genuinely opened the post's workspace.
 * Returns true only the FIRST time per session — callers use that signal
 * to POST a view to the server. Re-opens are silent no-ops.
 */
export function recordSessionView(postSlug: string): boolean {
  const sessionId = getSessionId()
  if (!sessionId) return false
  const seen = readStore()
  if (seen.includes(postSlug)) return false
  writeStore([...seen, postSlug])
  return true
}

/** True when this session has already counted a view for the post. */
export function hasViewedThisSession(postSlug: string): boolean {
  return readStore().includes(postSlug)
}
