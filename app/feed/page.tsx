import { Suspense } from 'react'
import { LabContainer } from '@/components/LabContainer'
import { LabNavigation } from '@/components/LabNavigation'
import { ContentPanel } from '@/components/ContentPanel'
import { LabFeed } from '@/components/LabFeed'
import { getAllPosts } from '@/lib/notion'

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
        <LabContainer videoSrc="/background.mp4">

            <LabNavigation />
            <ContentPanel
                title="Feed"
                subtitle="Exploring ideas, one post at a time."
                latestPublishedAt={latestPost}
            >
                <Suspense fallback={<div className="py-10 text-center text-sm text-[var(--muted-foreground)]">Loading feed...</div>}>
                    <LabFeed initialPosts={initialPosts} />
                </Suspense>
            </ContentPanel>
        </LabContainer>
    )
}
