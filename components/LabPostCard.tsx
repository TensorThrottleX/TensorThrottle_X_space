'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import type { Post, Comment } from '@/types/post'
import { MessageSquare, Loader2, X } from 'lucide-react'
import { CommentSection } from './CommentSection'
import { NotionBlockRenderer } from './NotionBlockRenderer'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LabPostCardProps {
  post: Post
  commentCount?: number
}

/**
 * LabPostCard: Minimal, clean timeline-style post card
 * - Teaser in the list
 * - Popup Modal for full content (Premium transition)
 * - Backdrop blur and click-out to close
 */
export function LabPostCard({ post, commentCount = 0 }: LabPostCardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // State for content expansion (Modal)
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState<any[]>(post.content || [])
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  // State for comments
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [hasLoadedComments, setHasLoadedComments] = useState(false)

  // Ref for scrolling
  const commentsRef = useRef<HTMLDivElement>(null)

  // Check if we should auto-expand based on URL
  useEffect(() => {
    const postSlugParam = searchParams.get('post')
    if (postSlugParam === post.slug && !isExpanded) {
      expandPost()
    }
  }, [searchParams, post.slug, isExpanded])

  // Helper to actually expand and fetch content
  const expandPost = async () => {
    setIsExpanded(true)

    // Fetch content if we don't have it yet
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

    // Load comments pre-emptively for the modal
    if (!hasLoadedComments) {
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
  }

  const toggleContent = async (e: React.MouseEvent, focus?: 'comments') => {
    e.preventDefault()

    // Check Navigation Context
    const categorySlug = post.category.toLowerCase().trim()
    const targetPath = `/category/${categorySlug}`
    const focusParam = focus ? `&focus=${focus}` : ''

    // If we represent a category but are NOT on that category page, navigate there
    if (!pathname.startsWith(targetPath)) {
      router.push(`${targetPath}?post=${post.slug}${focusParam}`)
      return
    }

    if (isExpanded && !focus) {
      setIsExpanded(false)
      return
    }

    await expandPost()

    if (focus === 'comments') {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  const onCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleContent(e, 'comments')
  }

  // Auto-scroll when modal opens from URL param
  useEffect(() => {
    if (isExpanded && searchParams.get('focus') === 'comments') {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 500)
    }
  }, [isExpanded, searchParams])

  return (
    <>
      <article
        id={`post-${post.id}`}
        onClick={toggleContent}
        className="group relative rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--sidebar-bg)] transition-all duration-300 cursor-pointer block px-6 py-6"
      >
        <div className="flex flex-col gap-3">
          {/* Header: Date & Category */}
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-tight" style={{ color: 'var(--muted-foreground)' }}>
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            <span className="rounded-full px-2 py-0.5 transition-colors"
              style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary-foreground)' }}
            >
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold tracking-tighter transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-base leading-relaxed opacity-80 line-clamp-2" style={{ color: 'var(--foreground)' }}>
            {post.excerpt}
          </p>

          {/* Comment Indicator */}
          <div
            className="flex items-center gap-1.5 mt-1 opacity-40 hover:opacity-100 transition-opacity cursor-pointer group/comm"
            onClick={onCommentClick}
          >
            <MessageSquare size={14} className="group-hover/comm:text-cyan-500 transition-colors" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {commentCount > 0 ? `${commentCount}` : '0'}
            </span>
          </div>
        </div>
      </article>

      <AnimatePresence>
        {isExpanded && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-8 pointer-events-auto"
          >
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 w-full max-w-md bg-[var(--card-bg)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[92vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-10 py-10 border-b shrink-0 flex justify-between items-start" style={{ borderColor: 'var(--border)' }}>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-tight" style={{ color: 'var(--muted-foreground)' }}>
                    <time>{formatDate(post.publishedAt)}</time>
                    <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: 'var(--secondary)', color: 'var(--primary-foreground)' }}>{post.category}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter leading-tight" style={{ color: 'var(--heading-primary)' }}>
                    {post.title}
                  </h2>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-60 hover:opacity-100"
                  style={{ color: 'var(--foreground)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto px-10 py-10 premium-scrollbar">
                {isLoadingContent ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--primary)' }} />
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:tracking-tighter prose-headings:mt-8 prose-headings:mb-4">
                    {content.length > 0 ? (
                      content.map(block => <NotionBlockRenderer key={block.id} block={block} />)
                    ) : (
                      <p className="italic opacity-50">No additional content found.</p>
                    )}
                  </div>
                )}

                {/* Comments Section */}
                <div ref={commentsRef} className="mt-16 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-8">
                    <MessageSquare size={16} className="text-cyan-500" />
                    <h4 className="text-sm font-bold uppercase tracking-tighter">Transmission Discussion</h4>
                  </div>

                  {isLoadingComments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin opacity-40" />
                    </div>
                  ) : (
                    <CommentSection postSlug={post.slug} initialComments={comments} />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
