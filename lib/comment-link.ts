/**
 * Deep link to a specific comment on the article page.
 * The post page renders CommentSection under #comments; a #comment-<id>
 * hash scrolls the section into view (and highlights the row).
 */

export function commentPermalink(postSlug: string, commentId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/post/${encodeURIComponent(postSlug)}#comment-${commentId}`
}
