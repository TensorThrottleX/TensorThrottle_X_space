import { NextRequest, NextResponse } from 'next/server'
import { getComments, createComment } from '@/lib/supabase'
import { moderateComment } from '@/lib/moderation'

export const dynamic = 'force-dynamic'

/**
 * Rate limiting: 1 comment per IP per 5 minutes
 * NOTE: This is best-effort in-memory limiting. In serverless, requests may hit different
 * instances. For production, consider storing rate limit state in Supabase.
 */
const rateLimitMap = new Map<string, number>()
const CLEANUP_INTERVAL = 10 * 60 * 1000 // 10 minutes

// Periodic cleanup of stale entries
if (typeof globalThis !== 'undefined') {
  // @ts-ignore - Global state in serverless is best-effort
  if (!globalThis._rateLimitCleanupScheduled) {
    // @ts-ignore
    globalThis._rateLimitCleanupScheduled = true
    setInterval(() => {
      const now = Date.now()
      const maxAge = 10 * 60 * 1000 // Keep entries for 10 minutes

      for (const [ip, timestamp] of rateLimitMap.entries()) {
        if (now - timestamp > maxAge) {
          rateLimitMap.delete(ip)
        }
      }
    }, CLEANUP_INTERVAL)
  }
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const lastRequest = rateLimitMap.get(ip)

  if (!lastRequest) {
    rateLimitMap.set(ip, now)
    return false
  }

  const timeSinceLastRequest = now - lastRequest
  const fiveMinutes = 5 * 60 * 1000

  if (timeSinceLastRequest < fiveMinutes) {
    return true
  }

  rateLimitMap.set(ip, now)
  return false
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')

    if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    const comments = await getComments(slug.trim())

    // Always return structured response
    return NextResponse.json({
      comments: comments || [],
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

    // 1. Rate limiting (IP based)
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many comments. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { postSlug, name, message, fingerprint, metrics } = body

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

    // Save to DB
    const comment = await createComment(
      postSlug,
      name,
      message,
      {
        fingerprint: fingerprint || 'unknown',
        riskScore: moderation.riskScore,
        isShadowBanned: isShadowBanned,
        metadata: {
          ...moderation.metadata,
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
      status: isShadowBanned ? 'shadow_banned' : 'active'
    }, { status: 201 })

  } catch (error) {
    console.error('Comments API POST error:', error)
    return NextResponse.json(
      { error: 'Comments temporarily unavailable.' },
      { status: 500 }
    )
  }
}
