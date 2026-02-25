import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/notion'
import { getAllCommentCounts } from '@/lib/supabase'

// ISR: revalidate every 60 seconds (matches Notion cache TTL)
// Removed conflicting `dynamic = 'force-dynamic'` which disabled caching entirely
export const revalidate = 60

interface PostsResponse {
  posts: any[]
  nextCursor: string | null
}

export async function GET(request: NextRequest): Promise<NextResponse<PostsResponse | any[]>> {
  try {
    const searchParams = request.nextUrl.searchParams

    // Support both page-based and cursor-based pagination
    const cursor = searchParams.get('cursor')
    const limit = Math.min(parseInt(searchParams.get('limit') || '6', 10), 50) // Cap at 50

    // Fallback to page-based for backward compatibility
    const page = parseInt(searchParams.get('page') || '1', 10)

    // Fetch posts and comment counts in parallel (both are cached internally)
    const [allPosts, commentCounts] = await Promise.all([
      getAllPosts(),
      getAllCommentCounts()
    ])

    if (allPosts.length === 0) {
      return NextResponse.json({ posts: [], nextCursor: null })
    }

    let startIndex = 0

    // Cursor-based pagination: cursor is the offset index
    if (cursor) {
      const cursorIndex = parseInt(cursor, 10)
      if (!Number.isNaN(cursorIndex) && cursorIndex >= 0) {
        startIndex = cursorIndex
      }
    } else {
      // Page-based pagination for backward compatibility
      startIndex = (page - 1) * limit
    }

    const endIndex = startIndex + limit
    const paginatedPosts = allPosts.slice(startIndex, endIndex)

    // Attach comment counts
    const postsWithCounts = paginatedPosts.map(post => ({
      ...post,
      commentCount: commentCounts[post.slug] || 0
    }))

    // Determine if there are more posts
    const hasMore = endIndex < allPosts.length
    const nextCursor = hasMore ? endIndex.toString() : null

    return NextResponse.json(
      { posts: postsWithCounts, nextCursor },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        }
      }
    )
  } catch (error) {
    console.error('Posts API error:', error)
    return NextResponse.json(
      { posts: [], nextCursor: null },
      { status: 500 }
    )
  }
}
