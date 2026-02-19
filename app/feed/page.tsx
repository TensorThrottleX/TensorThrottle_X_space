import { Suspense } from 'react'
import { LabContainer } from '@/components/layout/LabContainer'
import { LabNavigation } from '@/components/layout/LabNavigation'
import { ContentPanel } from '@/components/layout/ContentPanel'
import { LabFeed } from '@/components/content/LabFeed'
import { getAllPosts } from '@/lib/notion'
import { ResponsiveContentWrapper } from '@/components/layout/ResponsiveContentWrapper'

// ISR: Revalidate every 5 minutes
export const revalidate = 300

export const metadata = {
    title: 'Feed',
    description: 'Exploring ideas, one post at a time.',
}

export default async function FeedPage() {
    const posts = await getAllPosts()
    const initialPosts = posts.slice(0, 6)
    const latestPost = posts.length > 0 ? posts[0].publishedAt : undefined

    return (
        <ResponsiveContentWrapper pageTitle="Feed" articleCount={posts.length}>
            <LabContainer videoSrc="/media/videos/default-background.mp4">

                <LabNavigation />
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

