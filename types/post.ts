// Post type definition for Notion-based content
export type Post = {
  id: string
  title: string
  slug: string
  category: string
  excerpt: string
  coverImage?: string
  publishedAt: string
  content: any // Notion blocks
  commentCount?: number
  /** Real discussion-view count (discussion_views table) — attached by the
   *  shared enrichment pipeline (lib/enrich-posts.ts); 0 until views exist. */
  viewCount?: number
  /** Display author — absent on older posts; UI falls back to the brand name. */
  author?: string
}

export type Comment = {
  id: string
  post_slug: string
  name: string
  message: string
  created_at: string
  expires_at: string
  parent_id: string | null
  /** Set when the comment was last edited (PATCH). Absent for untouched comments. */
  edited_at?: string | null
  /** Soft-delete marker — the row stays for thread shape, UI shows a placeholder. */
  deleted_at?: string | null
  /** Stored moderation metadata (toxicity/spam/bot scores, status, flags, review_state). */
  metadata?: Record<string, unknown> | null
  /** Additive read fields — merged into GET responses; absent when unavailable. */
  like_count?: number
  liked_by_me?: boolean
  /** One-time capability token returned only in the POST response (never in GET). */
  edit_token?: string
}

export type CommentLike = {
  comment_id: string
  fingerprint: string
  created_at: string
}

export type CommentReport = {
  id: string
  comment_id: string
  fingerprint: string
  reason: string
  created_at: string
}
