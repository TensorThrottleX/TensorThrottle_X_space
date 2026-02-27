import React from "react"
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LabContainer } from '@/components/layout/LabContainer'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { CommentSection } from '@/components/content/CommentSection'
import { getPostBySlug } from '@/lib/notion'
import { getComments } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import { ResponsiveContentWrapper } from '@/components/layout/ResponsiveContentWrapper'

// ISR: Revalidate every 1 minute
export const revalidate = 60

interface PostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    description: post.excerpt,
  }
}

async function renderNotionBlock(block: any): Promise<React.ReactNode> {
  const type = block.type

  switch (type) {
    case 'paragraph':
      return (
        <p key={block.id} className="text-body mb-4 transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
          {block.paragraph?.rich_text?.map((text: any) => text.plain_text).join('')}
        </p>
      )

    case 'heading_1':
      return (
        <h2 key={block.id} className="mt-10 mb-6 text-h1 font-bold transition-colors duration-500" style={{ color: 'var(--heading-primary)' }}>
          {block.heading_1?.rich_text?.map((text: any) => text.plain_text).join('')}
        </h2>
      )

    case 'heading_2':
      return (
        <h3 key={block.id} className="mt-8 mb-4 text-h2 font-semibold transition-colors duration-500" style={{ color: 'var(--heading-primary)' }}>
          {block.heading_2?.rich_text?.map((text: any) => text.plain_text).join('')}
        </h3>
      )

    case 'heading_3':
      return (
        <h4 key={block.id} className="mt-6 mb-3 text-h3 font-semibold transition-colors duration-500" style={{ color: 'var(--foreground)' }}>
          {block.heading_3?.rich_text?.map((text: any) => text.plain_text).join('')}
        </h4>
      )

    case 'bulleted_list_item':
      return (
        <li key={block.id} className="ml-6 list-disc mb-2 transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
          {block.bulleted_list_item?.rich_text?.map((text: any) => text.plain_text).join('')}
        </li>
      )

    case 'numbered_list_item':
      return (
        <li key={block.id} className="ml-6 list-decimal mb-2 transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>
          {block.numbered_list_item?.rich_text?.map((text: any) => text.plain_text).join('')}
        </li>
      )

    case 'image':
      const imageUrl = block.image?.external?.url || block.image?.file?.url
      return (
        imageUrl && (
          <img
            key={block.id}
            src={imageUrl || "/placeholder.svg"}
            alt="Content image"
            className="my-8 rounded-xl border transition-all duration-500"
            style={{ borderColor: 'var(--border)' }}
          />
        )
      )

    case 'code':
      return (
        <pre key={block.id} className="overflow-x-auto rounded-xl p-6 my-6 text-sm border transition-all duration-500"
          style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}>
          <code style={{ color: 'var(--foreground)' }}>
            {block.code?.rich_text?.map((text: any) => text.plain_text).join('')}
          </code>
        </pre>
      )

    case 'quote':
      return (
        <blockquote
          key={block.id}
          className="border-l-4 pl-6 py-2 my-6 italic transition-all duration-500"
          style={{ borderColor: 'var(--primary)', color: 'var(--text-secondary)', backgroundColor: 'var(--secondary)', borderTopRightRadius: '8px', borderBottomRightRadius: '8px' }}
        >
          {block.quote?.rich_text?.map((text: any) => text.plain_text).join('')}
        </blockquote>
      )

    case 'divider':
      return <hr key={block.id} className="my-8 transition-colors duration-500" style={{ borderColor: 'var(--border)' }} />

    default:
      return null
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const [post, comments] = await Promise.all([
    getPostBySlug(slug),
    getComments(slug),
  ])

  if (!post) {
    notFound()
  }

  return (
    <ResponsiveContentWrapper>
      <LabContainer videoSrc="/media/videos/default-background.mp4">
        {/* Left: Floating navigation panel (Now in Root Layout) */}

        {/* Right: Content panel */}
        <ContentPanel title={post.title} subtitle={post.category}>
          <article className="space-y-6">
            {/* Post metadata */}
            <div className="border-b border-white/10 pb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <time className="text-sm text-gray-400">
                  {formatDate(post.publishedAt)}
                </time>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">
                  {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                </span>
                <span className="text-gray-600">•</span>
                <Link href={`/category/${post.category.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-gray-300 hover:bg-white/20 transition-colors">
                    {post.category}
                  </span>
                </Link>
              </div>
            </div>

            {/* Cover Image */}
            {post.coverImage && (
              <img
                src={post.coverImage || "/placeholder.svg"}
                alt={post.title}
                className="w-full rounded-lg border border-white/10"
              />
            )}

            {/* Content */}
            <div className="space-y-4">
              {post.content && post.content.length > 0 ? (
                <>
                  {await Promise.all(post.content.map((block: any) => renderNotionBlock(block)))}
                </>
              ) : (
                <p className="leading-relaxed transition-colors duration-500" style={{ color: 'var(--text-secondary)' }}>{post.excerpt}</p>
              )}
            </div>

            {/* Comments Section */}
            <div className="border-t border-white/10 pt-6">
              <CommentSection postSlug={slug} initialComments={comments} />
            </div>
          </article>
        </ContentPanel>
      </LabContainer>
    </ResponsiveContentWrapper>
  )
}
