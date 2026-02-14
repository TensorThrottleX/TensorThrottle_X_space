import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/notion'

export const dynamic = 'force-dynamic'
export const revalidate = 300

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

    // Fetch all posts
    const allPosts = await getAllPosts()

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

    // Determine if there are more posts
    const hasMore = endIndex < allPosts.length
    const nextCursor = hasMore ? endIndex.toString() : null

    return NextResponse.json({
      posts: paginatedPosts,
      nextCursor,
    })
  } catch (error) {
    console.error('Posts API error:', error)
    // Return structured error response instead of empty array
    return NextResponse.json(
      { posts: [], nextCursor: null },
      { status: 500 }
    )
  }
}
