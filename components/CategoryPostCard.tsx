'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { MessageSquare, Loader2, X } from 'lucide-react'
import { CommentSection } from './CommentSection'
import { NotionBlockRenderer } from './NotionBlockRenderer'
import { motion, AnimatePresence } from 'framer-motion'
import type { Post, Comment } from '@/types/post'

interface CategoryPostCardProps {
    post: Post
    commentCount?: number
}

/**
 * CategoryPostCard:
 * - teaser in category archives with cover image
 * - popup modal for full content
 * - removes cover image in expanded view as per user request
 */
export function CategoryPostCard({ post, commentCount = 0 }: CategoryPostCardProps): React.ReactNode {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [isExpanded, setIsExpanded] = useState(false)
    const [content, setContent] = useState<any[]>(post.content || [])
    const [isLoadingContent, setIsLoadingContent] = useState(false)

    // State for comments
    const [comments, setComments] = useState<Comment[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [hasLoadedComments, setHasLoadedComments] = useState(false)

    // Ref for scrolling
    const commentsRef = useRef<HTMLDivElement>(null)

    // Auto-expand logic based on URL
    useEffect(() => {
        const postSlugParam = searchParams.get('post')
        const shouldFocusComments = searchParams.get('focus') === 'comments'

        if (postSlugParam === post.slug && !isExpanded) {
            expandPost().then(() => {
                if (shouldFocusComments) {
                    setTimeout(() => {
                        commentsRef.current?.scrollIntoView({ behavior: 'smooth' })
                    }, 500)
                }
            })
        }
    }, [searchParams, post.slug, isExpanded])

    const expandPost = async () => {
        setIsExpanded(true)
        // Fetch content if needed
        if (content.length === 0) {
            setIsLoadingContent(true)
            try {
                const res = await fetch(`/api/post?slug=${post.slug}`)
                if (res.ok) {
                    const data = await res.json()
                    setContent(data.content || [])
                }
            } catch (error) {
                console.error('Failed to load content', error)
            } finally {
                setIsLoadingContent(false)
            }
        }

        // Load comments
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

    const toggleExpansion = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (isExpanded) {
            setIsExpanded(false)
        } else {
            await expandPost()
        }
    }

    const onCommentClick = async (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        await expandPost()
        setTimeout(() => {
            commentsRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    return (
        <>
            <article
                id={`cat-post-${post.id}`}
                className="group relative overflow-hidden rounded-xl border border-[var(--border)] transition-all duration-500 cursor-pointer bg-[var(--card-bg)]"
                onClick={toggleExpansion}
            >
                {/* Teaser Cover Image */}
                {post.coverImage && (
                    <div className="relative w-full overflow-hidden border-b h-48" style={{ borderColor: 'var(--border)' }}>
                        <img
                            src={post.coverImage || "/placeholder.svg"}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>
                )}

                {/* Card Body teaser */}
                <div className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tight" style={{ color: 'var(--muted-foreground)' }}>
                            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                            <span className="rounded-full px-2 py-0.5"
                                style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}
                            >
                                {post.category}
                            </span>
                        </div>

                        <h3 className="text-2xl font-bold tracking-tighter" style={{ color: 'var(--foreground)' }}>
                            {post.title}
                        </h3>

                        <p className="text-base leading-relaxed opacity-80 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                            {post.excerpt}
                        </p>


                    </div>
                </div>
            </article>

            <AnimatePresence>
                {isExpanded && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 md:p-8 pointer-events-auto">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsExpanded(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative z-10 w-full max-w-md h-[92vh] bg-[var(--card-bg)] border border-[var(--border)] rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header (No cover image here as per user request) */}
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

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto px-10 py-10 premium-scrollbar">
                                {isLoadingContent ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--primary)' }} />
                                    </div>
                                ) : (
                                    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:font-bold prose-headings:tracking-tighter prose-headings:mt-8 prose-headings:mb-4">
                                        {content.length > 0 ? (
                                            content.map((block: any) => <NotionBlockRenderer key={block.id} block={block} />)
                                        ) : (
                                            <p className="italic opacity-50">No additional content found.</p>
                                        )}
                                    </div>
                                )}

                                {/* Discussion Section */}
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

                                {/* Discussion context indicator */}
                                <div className="mt-16 pt-8 border-t flex items-center gap-2 opacity-40 select-none pb-12" style={{ borderColor: 'var(--border)' }}>
                                    <MessageSquare size={14} />
                                    <span className="text-[10px] uppercase font-black tracking-widest">End of Transmission</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
