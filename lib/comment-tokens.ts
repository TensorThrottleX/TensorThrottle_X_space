/**
 * One-time capability tokens for anonymous edit/delete.
 * The server issues a token in the POST response; we keep it locally so the
 * author can edit/delete their own comment later. Not an auth system — the
 * app stays anonymous; the token is just a bearer capability.
 */

const STORAGE_KEY = 'ttx:comment-tokens'

function readAll(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function storeCommentToken(commentId: string, token: string): void {
  if (typeof window === 'undefined') return
  try {
    const all = readAll()
    all[commentId] = token
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // storage unavailable — edit/delete simply won't be offered
  }
}

export function getCommentToken(commentId: string): string | null {
  return readAll()[commentId] || null
}

export function clearCommentToken(commentId: string): void {
  if (typeof window === 'undefined') return
  try {
    const all = readAll()
    delete all[commentId]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }
}
