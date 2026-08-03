// Feed posts provider — Thoughts, Projects, Experiments, Manifold.
// Reads the EXISTING /api/posts endpoint; no API changes. Real publishedAt
// timestamps and existing post routes are preserved.

import type { Activity, ActivityProvider } from '@/types/activity'
import type { Post } from '@/types/post'

const CATEGORY_MODULE: Record<string, string> = {
  thoughts: 'thoughts',
  projects: 'projects',
  experiments: 'experiments',
  manifold: 'manifold',
}

interface PostsResponse {
  posts?: Post[]
}

export const postsActivityProvider: ActivityProvider = {
  id: 'posts',
  async load(signal) {
    try {
      const res = await fetch('/api/posts?limit=50', { signal })
      if (!res.ok) return []
      const data: PostsResponse = await res.json()
      const posts = Array.isArray(data.posts) ? data.posts : []
      return posts
        .filter((p) => p && p.slug && p.title && p.publishedAt)
        .map((p) => {
          const category = (p.category || '').toLowerCase().trim()
          const moduleId = CATEGORY_MODULE[category] ?? 'feed'
          return {
            id: `post-${p.slug}`,
            module: moduleId,
            entityType: 'post',
            entityId: p.slug,
            title: p.title,
            action: 'published',
            timestamp: p.publishedAt,
            url: `/post/${p.slug}`,
            metadata: { category: p.category },
          } satisfies Activity
        })
    } catch {
      return [] // provider unavailable — degrade gracefully
    }
  },
}
