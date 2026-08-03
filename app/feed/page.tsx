import { Suspense } from 'react'
import { LabContainer } from '@/components/layout/LabContainer'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { LabFeed } from '@/components/content/LabFeed'
import { getAllPosts } from '@/lib/notion'
import { enrichPostsWithCounts } from '@/lib/enrich-posts'
import { POSTS_PER_PAGE } from '@/lib/pagination'
import { ResponsiveContentWrapper } from '@/components/layout/ResponsiveContentWrapper'
import { PageHeader } from '@/components/layout/PageHeader'
import { FileText, Clock } from 'lucide-react'

// ISR: Revalidate every 1 minute
export const revalidate = 60

export const metadata = {
    description: 'Exploring ideas, one post at a time.',
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function FeedPage() {
    const posts = await getAllPosts()
    const postsWithCounts = await enrichPostsWithCounts(posts)

    const initialPosts = postsWithCounts.slice(0, POSTS_PER_PAGE)
    const latestPost = posts.length > 0 ? posts[0].publishedAt : undefined

    return (
        <ResponsiveContentWrapper
            pageTitle="Feed"
            articleCount={posts.length}
            latestPublishedAt={latestPost}
        >
            <PageHeader
                title="Feed"
                description="Exploring ideas, one post at a time."
                accent="rgb(251,146,60)"
                metrics={[
                    { icon: <FileText size={12} strokeWidth={2} />, label: 'Posts', value: posts.length },
                    ...(latestPost ? [{ icon: <Clock size={12} strokeWidth={2} />, label: 'Updated', value: formatDate(latestPost) }] : []),
                ]}
                status={posts.length > 0
                    ? { label: 'Active', state: 'active', color: 'rgb(34,197,94)' }
                    : { label: 'Quiet', state: 'quiet', color: 'rgb(107,114,128)' }
                }
            />
            <LabContainer videoSrc="/media/videos/default-background.mp4">
                <ContentPanel>
                    <Suspense fallback={<div className="py-10 text-center text-sm text-[var(--muted-foreground)]">Loading feed...</div>}>
                        <LabFeed initialPosts={initialPosts} />
                    </Suspense>
                </ContentPanel>
            </LabContainer>
        </ResponsiveContentWrapper>
    )
}

