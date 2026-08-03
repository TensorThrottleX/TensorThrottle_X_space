import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Comment, CommentReport } from '@/types/post'

// [STORAGE_SYSTEM] – Safe Supabase Client Initializer
// Prevents app-wide crashes if environment variables are desynced in Vercel
function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    console.warn('[SUPABASE_CONFIG_WARNING] Missing or invalid URL/Anon Key. Database features will be disabled.');
    return null;
  }

  try {
    return createSupabaseClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('[SUPABASE_INIT_ERROR]', err);
    return null;
  }
}

// Global instance to ensure singleton pattern
export const supabase = createClient();

// ═══════════════════════════════════════════════════════════════
// COMMENT COUNTS CACHE — avoids redundant Supabase calls
// TTL: 30s (comments change more frequently than posts)
// ═══════════════════════════════════════════════════════════════
let commentCountsCache: { data: Record<string, number>; timestamp: number } | null = null
const COMMENT_CACHE_TTL = 30_000 // 30 seconds

/**
 * Fetch active comments for a post (not expired)
 * Sorted by newest first
 */
export async function getComments(postSlug: string): Promise<Comment[]> {
  if (!supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_slug', postSlug)
      .eq('is_shadow_banned', false) // Filter out shadow banned comments by default
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch comments:', error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching comments:', error)
    return []
  }
}
/**
 * Fetch comment counts for all posts (used in feed)
 * Optimized: 30s in-memory cache + only selects post_slug (minimal payload)
 */
export async function getAllCommentCounts(): Promise<Record<string, number>> {
  if (!supabase) {
    return {}
  }

  // Return cached data if valid
  if (commentCountsCache && Date.now() - commentCountsCache.timestamp < COMMENT_CACHE_TTL) {
    return commentCountsCache.data
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('post_slug')
      .eq('is_shadow_banned', false)
      .gt('expires_at', new Date().toISOString())

    if (error) {
      if (error.message?.includes('fetch')) {
        console.warn('[Supabase] Comment counts fetch unavailable (likely network or invalid URL)')
      } else {
        console.error('Failed to fetch comment counts:', error.message)
      }
      return commentCountsCache?.data ?? {}
    }

    const counts: Record<string, number> = {}
    if (data) {
      for (const c of data) {
        counts[c.post_slug] = (counts[c.post_slug] || 0) + 1
      }
    }

    // Cache the result
    commentCountsCache = { data: counts, timestamp: Date.now() }
    return counts
  } catch (error) {
    console.error('Error fetching comment counts:', error)
    return commentCountsCache?.data ?? {}
  }
}

/**
 * Create a new comment with enhanced metadata
 * Server-side only for safety
 */
export async function createComment(
  postSlug: string,
  name: string,
  message: string,
  extra: {
    fingerprint?: string
    riskScore?: number
    isShadowBanned?: boolean
    metadata?: any
    parentId?: string | null
    editToken?: string
  } = {}
): Promise<Comment | null> {
  if (!supabase) {
    return null
  }

  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const payload = {
      post_slug: postSlug,
      name: name.trim(),
      message: message.trim(),
      expires_at: expiresAt.toISOString(),
      // Enhanced fields (ensure these columns exist in Supabase or it will error/ignore)
      fingerprint: extra.fingerprint || 'unknown',
      risk_score: extra.riskScore || 0,
      is_shadow_banned: extra.isShadowBanned || false,
      metadata: extra.metadata || {},
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      parent_id: extra.parentId || null,
      edit_token: extra.editToken || null
    }

    const { data, error } = await supabase
      .from('comments')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Failed to create comment:', error.message)
      // Fallback: Try inserting without new columns if it failed (migration safety)
      // This allows the code to work with partial DB schema
      if (error.message.includes('column')) {
        console.warn("Attempting fallback insert (schema might be outdated)")
        const { data: fallbackData } = await supabase
          .from('comments')
          .insert({
            post_slug: postSlug,
            name: name.trim(),
            message: message.trim(),
            expires_at: expiresAt.toISOString(),
          })
          .select()
          .single()
        return fallbackData
      }
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating comment:', error)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════
// THREADED ADDITIONS — edit / delete / likes / reports
// All fail-soft (return null/false) when Supabase is unavailable.
// ═══════════════════════════════════════════════════════════════

/**
 * Edit a comment — only succeeds when `editToken` matches the stored
 * one-time capability token issued at creation. Sets `edited_at`.
 */
export async function updateComment(
  id: string,
  message: string,
  editToken: string,
  extra: { isShadowBanned?: boolean } = {},
): Promise<Comment | null> {
  if (!supabase) return null
  try {
    const updates: Record<string, unknown> = {
      message: message.trim(),
      edited_at: new Date().toISOString(),
    }
    if (extra.isShadowBanned) {
      updates.is_shadow_banned = true
    }
    const { data, error } = await supabase
      .from('comments')
      .update(updates)
      .eq('id', id)
      .eq('edit_token', editToken)
      .select()
      .single()

    if (error) {
      if (error.message.includes('column')) {
        console.warn('[Supabase] edit_token column missing — edit rejected.')
      } else {
        console.error('Failed to update comment:', error.message)
      }
      return null
    }
    return data
  } catch (error) {
    console.error('Error updating comment:', error)
    return null
  }
}

/**
 * Soft-delete a comment (token-gated). The row stays so the thread shape
 * survives; GET still returns it with `deleted_at` set for placeholder UI.
 */
export async function softDeleteComment(id: string, editToken: string): Promise<Comment | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('edit_token', editToken)
      .select()
      .single()

    if (error) {
      if (error.message.includes('column')) {
        console.warn('[Supabase] edit_token column missing — delete rejected.')
      } else {
        console.error('Failed to delete comment:', error.message)
      }
      return null
    }
    return data
  } catch (error) {
    console.error('Error deleting comment:', error)
    return null
  }
}

/** Like counts for a set of comment ids — additive read, empty on failure. */
export async function getCommentLikeCounts(commentIds: string[]): Promise<Record<string, number>> {
  if (!supabase || commentIds.length === 0) return {}
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .in('comment_id', commentIds)

    if (error) {
      console.warn('[Supabase] like counts unavailable:', error.message)
      return {}
    }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      counts[row.comment_id] = (counts[row.comment_id] || 0) + 1
    }
    return counts
  } catch (error) {
    console.error('Error fetching like counts:', error)
    return {}
  }
}

/** Ids the given fingerprint has liked — additive read, empty on failure. */
export async function getMyLikedCommentIds(
  commentIds: string[],
  fingerprint: string,
): Promise<Set<string>> {
  if (!supabase || commentIds.length === 0 || !fingerprint) return new Set()
  try {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('fingerprint', fingerprint)
      .in('comment_id', commentIds)

    if (error) {
      console.warn('[Supabase] liked ids unavailable:', error.message)
      return new Set()
    }
    return new Set((data || []).map((row) => row.comment_id))
  } catch (error) {
    console.error('Error fetching liked ids:', error)
    return new Set()
  }
}

/**
 * Toggle a like for a fingerprint. Returns the new state + total count,
 * or null on failure (caller keeps prior UI state).
 */
export async function toggleCommentLike(
  commentId: string,
  fingerprint: string,
): Promise<{ liked: boolean; like_count: number } | null> {
  if (!supabase) return null
  try {
    // 1. Is it currently liked?
    const { data: existing, error: selErr } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('comment_id', commentId)
      .eq('fingerprint', fingerprint)
      .maybeSingle()

    if (selErr) {
      console.warn('[Supabase] like lookup failed:', selErr.message)
      return null
    }

    // 2. Toggle
    if (existing) {
      const { error: delErr } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('fingerprint', fingerprint)
      if (delErr) {
        console.error('Failed to remove like:', delErr.message)
        return null
      }
    } else {
      const { error: insErr } = await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, fingerprint })
      if (insErr) {
        console.error('Failed to add like:', insErr.message)
        return null
      }
    }

    // 3. Fresh count
    const { data: countData, error: countErr } = await supabase
      .from('comment_likes')
      .select('comment_id', { count: 'exact' })
      .eq('comment_id', commentId)
    if (countErr) {
      console.warn('[Supabase] like recount failed:', countErr.message)
    }

    return { liked: !existing, like_count: countData?.length ?? 0 }
  } catch (error) {
    console.error('Error toggling like:', error)
    return null
  }
}

/** File a moderation report against a comment. Returns the row or null. */
export async function createCommentReport(
  commentId: string,
  fingerprint: string,
  reason: string,
): Promise<CommentReport | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('comment_reports')
      .insert({ comment_id: commentId, fingerprint: fingerprint || 'unknown', reason })
      .select()
      .single()

    if (error) {
      console.error('Failed to file report:', error.message)
      return null
    }
    return data
  } catch (error) {
    console.error('Error filing report:', error)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════
// DISCUSSION VIEWS — real engagement metric (discussion_views table)
// One row per (post_slug, visitor_key, view_date). Counts are daily-unique
// per visitor; weekly/monthly windows are date-range queries on the same
// table, so no redesign is needed for time-based uniqueness.
// All fail-soft: if the table is missing, counts are 0 and recording no-ops.
// ═══════════════════════════════════════════════════════════════

/**
 * Total recorded views per post slug. Empty on failure.
 */
export async function getViewCounts(postSlugs: string[]): Promise<Record<string, number>> {
  if (!supabase || postSlugs.length === 0) return {}
  try {
    const { data, error } = await supabase
      .from('discussion_views')
      .select('post_slug')
      .in('post_slug', postSlugs)

    if (error) {
      console.warn('[Supabase] view counts unavailable:', error.message)
      return {}
    }

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      counts[row.post_slug] = (counts[row.post_slug] || 0) + 1
    }
    return counts
  } catch (error) {
    console.error('Error fetching view counts:', error)
    return {}
  }
}

/**
 * Record a discussion view for (post, visitor) — at most once per day.
 * `visitor_key` is the browser fingerprint today; an authenticated user_id
 * swaps in later with no schema change. Returns the fresh total count, or
 * null when the table is unavailable (caller keeps its current display).
 */
export async function recordDiscussionView(
  postSlug: string,
  visitorKey: string,
): Promise<{ recorded: boolean; viewCount: number } | null> {
  if (!supabase) return null
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  try {
    const { error } = await supabase
      .from('discussion_views')
      .upsert(
        { post_slug: postSlug, visitor_key: visitorKey, view_date: today },
        { onConflict: 'post_slug,visitor_key,view_date', ignoreDuplicates: true },
      )
    if (error) {
      console.warn('[Supabase] view recording unavailable:', error.message)
      return null
    }

    const { data, error: countError } = await supabase
      .from('discussion_views')
      .select('post_slug', { count: 'exact', head: true })
      .eq('post_slug', postSlug)
    if (countError) {
      console.warn('[Supabase] view recount failed:', countError.message)
      return null
    }

    return { recorded: true, viewCount: data?.length ?? 0 }
  } catch (error) {
    console.error('Error recording discussion view:', error)
    return null
  }
}
