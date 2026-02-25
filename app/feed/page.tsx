import { Suspense } from 'react'
import { LabContainer } from '@/components/layout/LabContainer'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { LabFeed } from '@/components/content/LabFeed'
import { getAllPosts } from '@/lib/notion'
import { getAllCommentCounts } from '@/lib/supabase'
import { ResponsiveContentWrapper } from '@/components/layout/ResponsiveContentWrapper'

// ISR: Revalidate every 1 minute
export const revalidate = 60

export const metadata = {
    title: 'Feed',
    description: 'Exploring ideas, one post at a time.',
}

export default async function FeedPage() {
    const [posts, commentCounts] = await Promise.all([
        getAllPosts(),
        getAllCommentCounts()
    ])

    const postsWithCounts = posts.map(post => ({
        ...post,
        commentCount: commentCounts[post.slug] || 0
    }))

    const initialPosts = postsWithCounts.slice(0, 6)
    const latestPost = posts.length > 0 ? posts[0].publishedAt : undefined

    return (
        <ResponsiveContentWrapper
            pageTitle="Feed"
            articleCount={posts.length}
            latestPublishedAt={latestPost}
        >
            <LabContainer videoSrc="/media/videos/default-background.mp4">


                <ContentPanel
                    title="Feed"
                    subtitle="Exploring ideas, one post at a time."
                    latestPublishedAt={latestPost}
                    hideTitleOnMobile={true}
                >
                    <Suspense fallback={<div className="py-10 text-center text-sm text-[var(--muted-foreground)]">Loading feed...</div>}>
                        <LabFeed initialPosts={initialPosts} />
                    </Suspense>
                </ContentPanel>
            </LabContainer>
        </ResponsiveContentWrapper>
    )
}

