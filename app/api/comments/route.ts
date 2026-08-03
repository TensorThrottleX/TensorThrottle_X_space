import { NextRequest, NextResponse } from 'next/server'
import { getComments, createComment, getCommentLikeCounts, getMyLikedCommentIds, getViewCounts } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { moderateComment } from '@/lib/moderation'
import { createModerationMetadata } from '@/lib/moderation/metadata'
import { getClientIp, createInMemoryRateLimiter, RATE_LIMIT_WINDOW_MS } from '@/lib/rate-limit'
import { randomBytes } from 'node:crypto'

export const dynamic = 'force-dynamic'

const MAX_BODY_SIZE = 50_000;

// ─── HYBRID RATE LIMITING ─────────────────────────────────────────
// Layer 1: In-memory limiter (shared helper — fast, catches rapid repeats
// within same instance; resets on cold start)
// Layer 2: Supabase query (persistent, catches repeats across serverless cold starts)

// Layer 1: one comment per window per IP (shared sliding-window limiter)
const commentsMemoryLimiter = createInMemoryRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: 1,
})

/**
 * Layer 2: Persistent Supabase check.
 * Queries the comments table for recent entries from the same IP.
 * The IP is stored in the `metadata` JSONB column.
 */
async function isDbRateLimited(ip: string): Promise<boolean> {
  if (ip === 'unknown') return false // Can't rate-limit unknown IPs via DB

  try {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

    if (!supabase) return false

    const { data, error } = await supabase
      .from('comments')
      .select('id')
      .gte('created_at', windowStart)
      .contains('metadata', { ip })
      .limit(1)

    if (error) {
      console.warn('[RateLimit] Supabase check failed, allowing request:', error.message)
      return false // Fail open — don't block users if DB check fails
    }

    return (data && data.length > 0)
  } catch (err) {
    console.warn('[RateLimit] Supabase check errored, allowing request:', err)
    return false // Fail open
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')
    const fingerprint = searchParams.get('fingerprint') || ''

    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    const [comments, viewCounts] = await Promise.all([
      getComments(slug.trim()),
      getViewCounts([slug.trim()]),
    ])

    // Additive enrichment: like counts + the requester's own likes
    let commentsWithLikes: any[] = comments
    if (comments.length > 0) {
      const ids = comments.map((c) => c.id)
      const [likeCounts, myLikes] = await Promise.all([
        getCommentLikeCounts(ids),
        getMyLikedCommentIds(ids, fingerprint),
      ])
      commentsWithLikes = comments.map((c) => {
        const { metadata, edit_token, fingerprint: fp, ...safeComment } = c as any;
        return {
          ...safeComment,
          like_count: likeCounts[c.id] || 0,
          liked_by_me: myLikes.has(c.id),
        };
      })
    }

    // Always return structured response (viewCount is additive/backward-compatible)
    return NextResponse.json({
      comments: commentsWithLikes || [],
      viewCount: viewCounts[slug.trim()] || 0,
      success: true,
    })
  } catch (error) {
    console.error('Comments API GET error:', error)
    // Return empty comments list on error (graceful degradation)
    return NextResponse.json(
      { comments: [], success: false, error: 'Unable to load comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 1. Rate limiting — Hybrid (memory + DB)
    // Layer 1: Fast in-memory check (same instance)
    if (!commentsMemoryLimiter.allow(ip)) {
      return NextResponse.json(
        { error: 'Too many comments. Please try again later.' },
        { status: 429 }
      )
    }

    // Layer 2: Persistent DB check (cross-instance)
    if (await isDbRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many comments. Please try again later.' },
        { status: 429 }
      )
    }

    const raw = await request.text()
    if (raw.length > MAX_BODY_SIZE) {
      return NextResponse.json({ error: 'Request payload too large' }, { status: 413 })
    }
    const body = JSON.parse(raw)
    const { postSlug, name, message, fingerprint, metrics, parentId } = body

    // 2. Input Validation
    if (!postSlug || !name || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (name.length > 50 || message.length > 500) {
      return NextResponse.json({ error: 'Content too long' }, { status: 400 })
    }

    // 3. Risk Analysis & Moderation
    const moderation = await moderateComment(
      message,
      name,
      metrics || { typingTime: 0, charCount: 0, mouseEvents: 0 },
      { ip, userAgent }
    )

    // 4. Action based on Risk
    if (!moderation.approved) {
      // Hard block
      console.warn(`[BLOCKED] Comment from ${ip} rejected. Reason: ${moderation.reason.join(', ')}`)
      // Return 200 to confuse bots? Or 400? User plan said "Silent rejection mechanisms".
      // Usually silent reject means return 200 but don't save.
      // But if it's a "Hard Block" (e.g. invalid token), maybe 400. 
      // User plan: "Risk Score >= 12 -> Hard block". "Risk Score >= 7 -> Soft reject".

      // If hard blocked, we might want to let them know they are blocked or just fail silently.
      // Let's fail silently for bots (return 200 but don't save).
      return NextResponse.json({
        success: true,
        status: 'discarded', // Internal status, client sees success
        message: 'Comment posted.'
      })
    }

    // 5. Create Comment (or Shadow Ban)
    const isShadowBanned = moderation.shadowBan // Risk score >= 7
    const editToken = randomBytes(24).toString('hex')

    // Additive: typed moderation metadata merged into the existing JSONB
    const modMetadata = createModerationMetadata({
      riskScore: moderation.riskScore,
      isShadowBanned,
      heuristics: {
        linkCount: moderation.metadata.linkCount,
        profanityCount: moderation.metadata.profanityCount,
        entropy: moderation.metadata.entropy,
        uppercaseRatio: moderation.metadata.uppercaseRatio,
      },
    })

    // Save to DB
    const comment = await createComment(
      postSlug,
      name,
      message,
      {
        fingerprint: fingerprint || 'unknown',
        riskScore: moderation.riskScore,
        isShadowBanned: isShadowBanned,
        parentId: parentId || null,
        editToken,
        metadata: {
          ...moderation.metadata,
          ...modMetadata,
          userAgent,
          ip, // Store hash of IP in production usually, but storing IP for admin ban matching
          reasons: moderation.reason
        }
      }
    )

    if (!comment) {
      // Fallback if DB insert failed
      return NextResponse.json({ error: 'Failed to save comment' }, { status: 500 })
    }

    // Return the comment
    // If shadow banned, we return the comment to the user so they see it, but it won't be fetched by others (GET filters it out)
    return NextResponse.json({
      ...comment,
      status: isShadowBanned ? 'shadow_banned' : 'active',
      // Additive client fields
      like_count: 0,
      liked_by_me: false,
      edited_at: comment.edited_at ?? null,
      edit_token: editToken, // One-time capability token for edit/delete (never re-issued by GET)
    }, { status: 201 })

  } catch (error) {
    console.error('Comments API POST error:', error)
    return NextResponse.json(
      { error: 'Comments temporarily unavailable.' },
      { status: 500 }
    )
  }
}
