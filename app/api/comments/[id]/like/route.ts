import { NextRequest, NextResponse } from 'next/server'
import { toggleCommentLike } from '@/lib/supabase'
import { createMemoryRateLimiter, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const rateLimited = createMemoryRateLimiter()

/**
 * Toggle a like on a comment, keyed by the anonymous browser fingerprint.
 * Returns the new liked state + fresh count so the client can reconcile.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ip = getClientIp(request)

  if (rateLimited(`${ip}:like`)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json().catch(() => null)
    const fingerprint = typeof body?.fingerprint === 'string' ? body.fingerprint : ''

    if (!fingerprint) {
      return NextResponse.json({ error: 'Fingerprint required' }, { status: 400 })
    }

    const result = await toggleCommentLike(id, fingerprint)

    if (!result) {
      return NextResponse.json({ error: 'Unable to update like' }, { status: 500 })
    }

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Like API error:', error)
    return NextResponse.json({ error: 'Like temporarily unavailable.' }, { status: 500 })
  }
}
