import { createClient } from '@supabase/supabase-js'
import type { Comment } from '@/types/post'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing')
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
  if (!supabaseUrl || !supabaseAnonKey) {
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
  } = {}
): Promise<Comment | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration missing')
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
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
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
