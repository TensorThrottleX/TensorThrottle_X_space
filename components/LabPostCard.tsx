
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import type { Post, Comment } from '@/types/post'
import { MessageSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { CommentSection } from './CommentSection'
import { NotionBlockRenderer } from './NotionBlockRenderer'

interface LabPostCardProps {
  post: Post
  commentCount?: number
}

/**
 * LabPostCard: Minimal, clean timeline-style post card
 * - Inline expandable full content (replaces separate post page)
 * - Inline expandable comments
 */
export function LabPostCard({ post, commentCount = 0 }: LabPostCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // State for content expansion
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState<any[]>(post.content || [])
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  // State for comments
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [hasLoadedComments, setHasLoadedComments] = useState(false)

  // Check if we should auto-expand based on URL
  useEffect(() => {
    const postSlugParam = searchParams.get('post')
    if (postSlugParam === post.slug && !isExpanded) {
      // Auto-expand this post
      expandPost()
      // Scroll into view
      setTimeout(() => {
        const element = document.getElementById(`post-${post.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 500) // Small delay to ensure render
    }
  }, [searchParams, post.slug, post.id, isExpanded])

  // Helper to actually expand and fetch content
  const expandPost = async () => {
    setIsExpanded(true)

    // Fetch content if we don't have it yet (blocks)
    if (content.length === 0) {
      setIsLoadingContent(true)
      try {
        const res = await fetch(`/api/post?slug=${post.slug}`)
        if (res.ok) {
          const data = await res.json()
          setContent(data.content || [])
        }
      } catch (error) {
        console.error('Failed to load post content', error)
      } finally {
        setIsLoadingContent(false)
      }
    }
  }

  // Toggle Full Content
  const toggleContent = async (e: React.MouseEvent) => {
    e.preventDefault()

    // Check Navigation Context
    const categorySlug = post.category.toLowerCase()
    const targetPath = `/category/${categorySlug}`

    // If we represent a category but are NOT on that category page, navigate there
    if (!pathname.startsWith(targetPath)) {
      router.push(`${targetPath}?post=${post.slug}`)
      return
    }

    // If we're closing, just toggle state
    if (isExpanded) {
      setIsExpanded(false)
      setShowComments(false)
      return
    }

    await expandPost()
  }

  // Toggle Comments
  const toggleComments = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // If opening comments, ensure post is also expanded? 
    // Or allow comments on collapsed card? 
    // Usually comments appear at bottom of post. Let's allow standalone comment view for now.

    if (!showComments && !hasLoadedComments) {
      setIsLoadingComments(true)
      try {
        const res = await fetch(`/api/comments?slug=${post.slug}`)
        if (res.ok) {
          const data = await res.json()
          setComments(data.comments || [])
          setHasLoadedComments(true)
        }
      } catch (error) {
        console.error('Failed to load comments', error)
      } finally {
        setIsLoadingComments(false)
      }
    }

    setShowComments(!showComments)
  }

  return (
    <article
      id={`post-${post.id}`}
      className={`group relative rounded-xl border transition-[ring,border-color,background-color] duration-300 ${isExpanded
        ? 'ring-1'
        : 'hover:border-opacity-100'
        } hover:bg-[var(--sidebar-bg)] hover:border-[var(--border)]`}
      style={{
        backgroundColor: isExpanded ? 'var(--sidebar-bg)' : 'transparent',
        borderColor: isExpanded ? 'var(--active-border, var(--border))' : 'transparent',
      }}
    >

      {/* Clickable Area for Content Expansion */}
      <div
        onClick={toggleContent}
        className="block px-8 py-6 cursor-pointer"
      >
        <div className="flex flex-col gap-3">

          {/* Header: Date & Category */}
          <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            {/* Category Tag */}
            <span className="rounded-full px-2.5 py-1 transition-colors"
              style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary-foreground)' }}
            >
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            {post.title}
          </h3>

          {/* Content / Excerpt Area */}
          <div className="text-base leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {isExpanded ? (
              <div className="mt-6 space-y-4 animate-in fade-in duration-500">
                {/* Full Content Rendering */}
                {isLoadingContent ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : (
                  <div className="prose max-w-none" style={{ color: 'var(--foreground)' }}>
                    {/* 
                        Note: The internal NotionBlockRenderer might need updates too, 
                        but usually prose handles standard tags if configured. 
                        We might need a global 'prose-invert' toggle or custom prose class 
                     */}
                    {content.length > 0 ? (
                      content.map(block => (
                        <NotionBlockRenderer key={block.id} block={block} />
                      ))
                    ) : (
                      <p className="italic" style={{ color: 'var(--muted-foreground)' }}>No additional content found.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Collapsed: Show Excerpt */
              <p className="line-clamp-2 opacity-80">{post.excerpt}</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer / Actions Bar */}
      <div className={`border-t px-8 py-4 flex justify-between items-center transition-opacity duration-300 ${!isExpanded ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Comment Trigger */}
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: showComments ? 'var(--secondary)' : 'transparent',
            color: showComments ? 'var(--secondary-foreground)' : 'var(--muted-foreground)'
          }}
        >
          <MessageSquare className="h-4 w-4" />
          <span>
            {commentCount > 0 ? `${commentCount} Comments` : 'Comments'}
          </span>
          {showComments ? (
            <ChevronUp className="h-3 w-3 ml-1" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-1" />
          )}
        </button>

        {/* Expansion Indicator (Optional visual cue) */}
        <button
          onClick={toggleContent}
          className="transition-colors p-1 hover:opacity-100 opacity-60"
          style={{ color: 'var(--muted-foreground)' }}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <span className="text-xs font-medium uppercase tracking-wider">Read {isExpanded ? 'Less' : 'More'}</span>
          )}
        </button>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="border-t p-6 rounded-b-xl animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
        >
          {isLoadingComments ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--muted-foreground)' }} />
            </div>
          ) : (
            <div className="relative">
              <CommentSection postSlug={post.slug} initialComments={comments} />
            </div>
          )}
        </div>
      )}
    </article>
  )
}
