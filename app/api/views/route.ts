import { NextRequest, NextResponse } from 'next/server'
import { recordDiscussionView } from '@/lib/supabase'
import { getClientIp, createInMemoryRateLimiter, RATE_LIMIT_WINDOW_MS } from '@/lib/rate-limit'

// Event sink for discussion views. POST-only: counts are never read here —
// they flow through the EXISTING pipelines (/api/posts, /api/comments),
// so no parallel data-fetching API is introduced.

export const dynamic = 'force-dynamic'

const MAX_VISITOR_KEY = 128
const MAX_POST_SLUG_LENGTH = 200
const MAX_BODY_SIZE = 1024 // body is only { postSlug, visitorKey } — keep it tiny

// IP throttle — same shared limiter as the comments API. The table has no
// IP column (visitor_key is client-asserted), so there is no persistent
// layer here: the in-memory limiter caps flooding per instance, and the
// daily-unique (post_slug, visitor_key, view_date) index already dedupes
// replay of identical bodies. A DB-backed layer slots in once IPs (or
// authenticated users) are stored.
const viewsLimiter = createInMemoryRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: 30, // generous: 30 genuine discussion opens / 5 min / IP
})

export async function POST(request: NextRequest) {
  // 1. Rate limiting — cheapest check first, before any body parsing
  const ip = getClientIp(request)
  if (!viewsLimiter.allow(ip)) {
    return NextResponse.json(
      { error: 'Too many view requests. Please try again later.' },
      { status: 429 },
    )
  }

  try {
    // 2. Body size validation
    const raw = await request.text()
    if (raw.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Request payload too large' }, { status: 413 })
    }

    // 3. Payload shape
    const body = JSON.parse(raw || '{}')
    const { postSlug, visitorKey } = body

    // 4. Input validation
    if (
      !postSlug ||
      typeof postSlug !== 'string' ||
      postSlug.trim().length === 0 ||
      postSlug.trim().length > MAX_POST_SLUG_LENGTH
    ) {
      return NextResponse.json({ error: 'postSlug is required' }, { status: 400 })
    }
    if (!visitorKey || typeof visitorKey !== 'string' || visitorKey.length > MAX_VISITOR_KEY) {
      return NextResponse.json({ error: 'Invalid visitor key' }, { status: 400 })
    }

    const result = await recordDiscussionView(postSlug.trim(), visitorKey)
    if (!result) {
      // View table unavailable — respond so the UI stays graceful (no error
      // state for the user; the panel keeps its last known count).
      return NextResponse.json({ recorded: false, viewCount: null }, { status: 200 })
    }

    return NextResponse.json({ recorded: result.recorded, viewCount: result.viewCount })
  } catch (error) {
    console.error('Views API POST error:', error)
    return NextResponse.json({ recorded: false, viewCount: null }, { status: 200 })
  }
}
