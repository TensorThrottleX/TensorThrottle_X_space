'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { LabPostCard } from './LabPostCard'
import type { Post } from '@/types/post'

interface LabFeedProps {
  initialPosts: Post[]
}

interface PostsApiResponse {
  posts: Post[]
  nextCursor: string | null
}

const POSTS_PER_PAGE = 6

/**
 * LabFeed: Clean timeline-style infinite scroll feed
 * - Minimal, experimental aesthetic
 * - Smooth automatic loading via IntersectionObserver
 * - Manual load button as fallback
 */
export function LabFeed({ initialPosts }: LabFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [isLoading, setIsLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialPosts.length >= POSTS_PER_PAGE ? '6' : null
  )
  const [error, setError] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
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

      if (newPosts && newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts])
        setNextCursor(newCursor)
      } else {
        setNextCursor(null)
      }
    } catch (err) {
      console.error('Error loading more posts:', err)
      setError('Failed to load more posts')
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, nextCursor])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading && nextCursor) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [isLoading, nextCursor, loadMore])

  return (
    <div className="flex flex-col gap-0 w-full mx-auto">
      {/* Posts Timeline */}
      {posts.length > 0 ? (
        <div className="transition-colors duration-500"
          style={{ borderColor: 'var(--border)' }}
        >
          {posts.map((post) => (
            <LabPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="h-12 w-12 rounded-full border border-dashed flex items-center justify-center animate-[spin_3s_linear_infinite] opacity-30"
            style={{ borderColor: 'var(--muted-foreground)' }}
          >
            <div className="h-2 w-2 rounded-full bg-current" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          <p className="text-sm font-medium tracking-tight opacity-60" style={{ color: 'var(--muted-foreground)' }}>
            No posts found in this frequency.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="border-t px-4 py-6 text-center transition-colors duration-500"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {nextCursor && !error && (
        <div
          ref={sentinelRef}
          className="border-t flex justify-center py-8 transition-colors duration-500"
          style={{ borderColor: 'var(--border)' }}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: 'var(--muted-foreground)', borderTopColor: 'var(--foreground)' }}
              />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Loading more posts...</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Load more
            </button>
          )}
        </div>
      )}

      {/* End of feed indicator */}
      {!nextCursor && posts.length > 0 && (
        <div className="border-t text-center py-8 transition-colors duration-500"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No more posts</p>
        </div>
      )}
    </div>
  )
}
