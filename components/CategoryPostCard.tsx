
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import type { Post } from '@/types/post'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { NotionBlockRenderer } from './NotionBlockRenderer'

interface CategoryPostCardProps {
    post: Post
}

/**
 * CategoryPostCard:
 * - Specific card layout for Category Archives
 * - Bounded, collapsible
 * - Cover Image (16:9)
 * - Auto-expands if query param matches
 */
export function CategoryPostCard({ post }: CategoryPostCardProps): React.ReactNode {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [isExpanded, setIsExpanded] = useState(false)
    const [content, setContent] = useState<any[]>(post.content || [])
    const [isLoadingContent, setIsLoadingContent] = useState(false)

    // Auto-expand logic based on URL
    useEffect(() => {
        const postSlugParam = searchParams.get('post')
        if (postSlugParam === post.slug && !isExpanded) {
            expandPost()
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
        // Scroll into view logic handled by parent or existing mechanism? 
        // The prompt suggested auto-scroll. We can do it here.
        setTimeout(() => {
            const el = document.getElementById(`cat-post-${post.id}`)
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }, 100)
    }

    const toggleExpansion = async (e: React.MouseEvent) => {
        e.preventDefault()
        if (isExpanded) {
            setIsExpanded(false)
        } else {
            await expandPost()
        }
    }

    return (
        <article
            id={`cat-post-${post.id}`}
            className={`group relative overflow-hidden rounded-xl border transition-all duration-500`}
            style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
            }}
        >
            <div onClick={toggleExpansion} className="cursor-pointer">
                {/* Cover Image */}
                {post.coverImage && (
                    <div className={`relative w-full overflow-hidden border-b transition-all duration-500 ease-in-out ${isExpanded ? 'aspect-video' : 'h-48'}`}
                        style={{ borderColor: 'var(--border)' }}>
                        <img
                            src={post.coverImage || "/placeholder.svg"}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>
                )}

                {/* Card Body */}
                <div className="p-8">
                    <div className="flex flex-col gap-4">
                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                            <span className="rounded-full px-3 py-1 transition-colors"
                                style={{ backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)' }}
                            >
                                {post.category}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold transition-colors" style={{ color: 'var(--foreground)' }}>
                            {post.title}
                        </h3>

                        {/* Content */}
                        <div className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {isExpanded ? (
                                <div className="mt-6 space-y-6 animate-in fade-in duration-500 cursor-text" onClick={(e) => e.stopPropagation()}>
                                    {isLoadingContent ? (
                                        <div className="flex justify-center py-10">
                                            <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--primary)' }} />
                                        </div>
                                    ) : (
                                        <div className="prose max-w-none" style={{ color: 'var(--foreground)' }}>
                                            {content.length > 0 ? (
                                                content.map(block => <NotionBlockRenderer key={block.id} block={block} />)
                                            ) : (
                                                <p className="italic" style={{ color: 'var(--muted-foreground)' }}>No content found.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="line-clamp-3 opacity-90">{post.excerpt}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Expand Button */}
            <div className="border-t px-8 py-4 flex justify-center transition-colors duration-500"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--sidebar-bg)' }}
            >
                <button
                    onClick={toggleExpansion}
                    className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold transition-transform hover:scale-105"
                    style={{ color: 'var(--muted-foreground)' }}
                >
                    {isExpanded ? (
                        <>Collapse <ChevronUp className="h-4 w-4" /></>
                    ) : (
                        <>Expand <ChevronDown className="h-4 w-4" /></>
                    )}
                </button>
            </div>
        </article>
    )
}
