import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import type { Post } from '@/types/post'

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/post/${post.slug}`}>
      <article className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gray-300">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-4 aspect-video overflow-hidden rounded-md bg-gray-100">
            <img
              src={post.coverImage || "/placeholder.svg"}
              alt={post.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}

        {/* Category Tag */}
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-xl font-semibold text-gray-900 transition-colors group-hover:text-gray-700">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="mb-4 line-clamp-2 text-sm text-gray-600">
          {post.excerpt}
        </p>

        {/* Date */}
        <time className="text-xs text-gray-500">
          {formatDate(post.publishedAt)}
        </time>
      </article>
    </Link>
  )
}
