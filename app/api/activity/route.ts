import { NextResponse } from 'next/server'
import { readdirSync, readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'
import { getAllPosts } from '@/lib/notion'
import type { Activity } from '@/types/activity'

// Helper to safely get mtime
function getMTime(path: string): string {
  try {
    const stats = statSync(path)
    return stats.mtime.toISOString()
  } catch {
    return new Date().toISOString()
  }
}

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

// 2. Universe Auto-Discovery Publisher
async function publishUniverseActivity(): Promise<Activity[]> {
  const activities: Activity[] = []
  const UNIVERSE_DIR = join(process.cwd(), 'public/media/universe')
  
  if (!existsSync(UNIVERSE_DIR)) return activities
  
  try {
    const sections = readdirSync(UNIVERSE_DIR, { withFileTypes: true }).filter(e => e.isDirectory())
    
    for (const section of sections) {
      const sectionName = section.name // e.g., 'anime', 'music', 'fox-den'
      const dataDir = join(UNIVERSE_DIR, sectionName, 'data')
      
      if (!existsSync(dataDir)) continue
      
      const entities = readdirSync(dataDir, { withFileTypes: true }).filter(e => e.isDirectory())
      
      for (const entity of entities) {
        const entityId = entity.name
        const jsonPath = join(dataDir, entityId, `${entityId}.json`)
        
        if (!existsSync(jsonPath)) continue
        
        try {
          const raw = readFileSync(jsonPath, 'utf-8')
          const parsed = JSON.parse(raw)
          const updatedAt = getMTime(jsonPath)
          
          let icon = 'Globe'
          if (sectionName.toLowerCase() === 'anime') icon = 'Clapperboard'
          if (sectionName.toLowerCase() === 'music') icon = 'Music'

          activities.push({
            id: `universe-${sectionName}-${entityId}`,
            source: `Universe: ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`,
            entityType: 'card',
            entityId,
            action: 'Updated',
            title: String(parsed.title ?? entityId),
            description: String(parsed.subtitle ?? parsed.description ?? ''),
            url: `/universe/${sectionName}`,
            icon,
            priority: 2,
            visibility: 'public',
            createdAt: updatedAt,
            updatedAt,
            metadata: { section: sectionName }
          })
        } catch (err) {
          // Skip invalid entities
        }
      }
    }
  } catch (err) {
    console.error('Universe Publisher Error:', err)
  }
  
  return activities
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
