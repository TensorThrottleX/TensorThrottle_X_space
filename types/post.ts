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
}

export type Comment = {
  id: string
  post_slug: string
  name: string
  message: string
  created_at: string
  expires_at: string
}
