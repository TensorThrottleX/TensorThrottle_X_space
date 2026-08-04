import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAllPosts } from '@/lib/notion'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ recent: [] })
  }

  try {
    // Fetch the 15 most recent active comments across all posts
    const { data, error } = await supabase
      .from('comments')
      .select('id, post_slug, name, created_at')
      .eq('is_shadow_banned', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(15)

    if (error) {
      console.error('Failed to fetch recent comments:', error.message)
      return NextResponse.json({ recent: [] })
    }

    const allPosts = await getAllPosts()
    const slugToTitle = new Map(allPosts.map(p => [p.slug, p.title]))

    const enriched = (data || []).map(comment => ({
      ...comment,
      post_title: slugToTitle.get(comment.post_slug) || comment.post_slug
    }))

    // We only send lightweight metadata for the Message Center
    return NextResponse.json({ recent: enriched })
  } catch (error) {
    console.error('Recent comments API error:', error)
    return NextResponse.json({ recent: [] }, { status: 500 })
  }
}
