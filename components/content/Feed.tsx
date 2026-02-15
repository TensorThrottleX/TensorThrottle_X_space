'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { PostCard } from './PostCard'
import type { Post } from '@/types/post'

interface FeedProps {
  initialPosts: Post[]
}

interface PostsApiResponse {
  posts: Post[]
  nextCursor: string | null
}

const POSTS_PER_PAGE = 6

export function Feed({ initialPosts }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [isLoading, setIsLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialPosts.length >= POSTS_PER_PAGE ? '6' : null
  )
  const [error, setError] = useState<string | null>(null)

  // Ref for IntersectionObserver sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)

  /**
   * Load more posts using cursor-based pagination
   * Prevents duplicate fetches with proper state management
   */
  const loadMore = useCallback(async () => {
    // Guard: don't fetch if already loading, no more data, or fetch failed
    if (isLoading || !nextCursor) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/posts?cursor=${encodeURIComponent(nextCursor)}&limit=${POSTS_PER_PAGE}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }

      const data: PostsApiResponse = await response.json()
      const { posts: newPosts, nextCursor: newCursor } = data

      // Only append if we received valid posts
      if (newPosts && newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts])
        setNextCursor(newCursor)
      } else {
        // No more posts to load
        setNextCursor(null)
      }
    } catch (err) {
      console.error('Error loading more posts:', err)
      setError('Failed to load more posts')
      // Don't clear nextCursor on error—allow retry
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, nextCursor])

  /**
   * IntersectionObserver for automatic infinite scroll
   * Triggers loadMore when user scrolls near bottom
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // When sentinel becomes visible, load more
        if (entries[0]?.isIntersecting && !isLoading && nextCursor) {
          loadMore()
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before reaching the bottom
      }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [isLoading, nextCursor, loadMore])

  return (
    <div className="flex flex-col gap-6">
      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid gap-6 md:gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-gray-600">No posts yet.</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg bg-red-50 p-4 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Infinite Scroll Sentinel */}
      {nextCursor && !error && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              <span className="text-sm text-gray-600">Loading more posts...</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Load more
            </button>
          )}
        </div>
      )}

      {/* End of Feed Indicator */}
      {!nextCursor && posts.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No more posts to load</p>
        </div>
      )}
    </div>
  )
}
