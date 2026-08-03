// Shared post enrichment — the ONE place that attaches engagement counts
// (comments + real discussion views) to posts. Used by the feed page, the
// category page, and the /api/posts route so every card reads the same
// source of truth (Supabase tables) instead of duplicated logic.

import { getAllCommentCounts, getViewCounts } from './supabase'

export async function enrichPostsWithCounts<T extends { slug: string }>(posts: T[]) {
  if (posts.length === 0) return posts
  const [commentCounts, viewCounts] = await Promise.all([
    getAllCommentCounts(),
    getViewCounts(posts.map((p) => p.slug)),
  ])
  return posts.map((post) => ({
    ...post,
    commentCount: commentCounts[post.slug] || 0,
    viewCount: viewCounts[post.slug] || 0,
  }))
}
