import { NextRequest, NextResponse } from 'next/server'
import { moderateComment } from '@/lib/moderation'
import type { ClientMetrics } from '@/lib/moderation'
import { updateComment, softDeleteComment } from '@/lib/supabase'
import { createMemoryRateLimiter, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_MESSAGE_LENGTH = 500
const rateLimited = createMemoryRateLimiter()

/**
 * Edit a comment — capability-gated by the one-time `edit_token` issued
 * when the comment was created. Edits re-run the full moderation pipeline
 * (identical semantics to POST: hard block discards, shadow ban persists
 * the edit but hides it from other readers).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'

  if (rateLimited(`${ip}:edit`)) {
    return NextResponse.json({ error: 'Too many edits. Please try again later.' }, { status: 429 })
  }

  try {
    const raw = await request.text()
    if (raw.length > 50_000) {
      return NextResponse.json({ error: 'Request payload too large' }, { status: 413 })
    }
    const body = JSON.parse(raw)
    const { message, editToken } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Content too long' }, { status: 400 })
    }
    if (!editToken || typeof editToken !== 'string') {
      return NextResponse.json({ error: 'Edit token required' }, { status: 400 })
    }

    // Re-moderate the edited text — same pipeline as POST
    const metrics: ClientMetrics = {
      typingTime: 0,
      charCount: message.length,
      backspaceCount: 0,
      pasteCount: 0,
      mouseEvents: 0,
      focusEvents: 0,
      kpm: 0,
      deviceHash: '',
    }
    const moderation = await moderateComment(message, 'Anonymous', metrics, { ip, userAgent })

    if (!moderation.approved) {
      return NextResponse.json({
        success: true,
        status: 'discarded',
        message: 'Comment updated.',
      })
    }

    const comment = await updateComment(id, message, editToken, {
      isShadowBanned: moderation.shadowBan,
    })

    if (!comment) {
      return NextResponse.json({ error: 'Edit failed — invalid token or missing column.' }, { status: 404 })
    }

    const { metadata, edit_token, fingerprint: fp, ...safeComment } = comment as any;
    return NextResponse.json({
      ...safeComment,
      status: moderation.shadowBan ? 'shadow_banned' : 'active',
    })
  } catch (error) {
    console.error('Comments PATCH error:', error)
    return NextResponse.json({ error: 'Edit temporarily unavailable.' }, { status: 500 })
  }
}

/**
 * Soft-delete a comment (capability-gated by `edit_token`). The row stays
 * so the thread shape survives; GET returns it with `deleted_at` set and
 * the UI renders a placeholder.
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ip = getClientIp(request)

  if (rateLimited(`${ip}:delete`)) {
    return NextResponse.json({ error: 'Too many deletes. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json().catch(() => null)
    const editToken = body?.editToken

    if (!editToken || typeof editToken !== 'string') {
      return NextResponse.json({ error: 'Edit token required' }, { status: 400 })
    }

    const comment = await softDeleteComment(id, editToken)

    if (!comment) {
      return NextResponse.json({ error: 'Delete failed — invalid token.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id, deleted_at: comment.deleted_at })
  } catch (error) {
    console.error('Comments DELETE error:', error)
    return NextResponse.json({ error: 'Delete temporarily unavailable.' }, { status: 500 })
  }
}
