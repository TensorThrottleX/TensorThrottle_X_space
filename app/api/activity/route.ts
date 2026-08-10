import { NextResponse } from 'next/server'
import activitiesUniverse from '@/features/anime-universe/assets/activities-universe.json'
import { getAllPosts } from '@/lib/notion'
import type { Activity } from '@/types/activity'

// 1. Notion Publisher
async function publishNotionActivity(): Promise<Activity[]> {
  try {
    const posts = await getAllPosts()
    if (!posts || posts.length === 0) return []

    return posts
      .filter(p => p.slug && p.title && p.publishedAt)
      .map(p => {
        const category = (p.category || 'Feed').trim()
        
        let icon = 'Newspaper'
        if (category.toLowerCase() === 'thoughts') icon = 'Lightbulb'
        if (category.toLowerCase() === 'projects') icon = 'FolderKanban'
        if (category.toLowerCase() === 'experiments') icon = 'FlaskConical'
        if (category.toLowerCase() === 'manifold') icon = 'Network'

        return {
          id: `post-${p.slug}`,
          source: category,
          entityType: 'post',
          entityId: p.slug,
          action: 'Published',
          title: p.title,
          description: p.excerpt || '',
          url: `/post/${p.slug}`,
          icon,
          priority: 1,
          visibility: 'public',
          createdAt: p.publishedAt,
          updatedAt: p.publishedAt,
          metadata: { category }
        }
      })
  } catch (err) {
    console.error('Notion Publisher Error:', err)
    return []
  }
}

// 2. Universe Activities (using static pre-compiled data)
async function publishUniverseActivity(): Promise<Activity[]> {
  return activitiesUniverse as Activity[]
}

export const revalidate = 60

export async function GET() {
  const [notionActivities, universeActivities] = await Promise.all([
    publishNotionActivity(),
    publishUniverseActivity()
  ])
  
  const allActivities = [...notionActivities, ...universeActivities]
  
  // Sort descending by updatedAt
  allActivities.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  
  return NextResponse.json(allActivities, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    }
  })
}
