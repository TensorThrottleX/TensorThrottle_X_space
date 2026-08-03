import { NextRequest, NextResponse } from 'next/server'
import { createCommentReport } from '@/lib/supabase'
import { createMemoryRateLimiter, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const rateLimited = createMemoryRateLimiter()

/**
 * File a moderation report against a comment (anonymous, fingerprint-keyed).
 * Reports land in `comment_reports` for the future admin/review queue.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ip = getClientIp(request)

  if (rateLimited(`${ip}:report`)) {
    return NextResponse.json({ error: 'Too many reports. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json().catch(() => null)
    const fingerprint = typeof body?.fingerprint === 'string' ? body.fingerprint : ''
    const reason = typeof body?.reason === 'string' ? body.reason.trim() : ''

    if (!fingerprint) {
      return NextResponse.json({ error: 'Fingerprint required' }, { status: 400 })
    }
    if (!reason || reason.length > 200) {
      return NextResponse.json({ error: 'A report reason (max 200 chars) is required' }, { status: 400 })
    }

    const report = await createCommentReport(id, fingerprint, reason)

    if (!report) {
      return NextResponse.json({ error: 'Unable to file report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: report.id }, { status: 201 })
  } catch (error) {
    console.error('Report API error:', error)
    return NextResponse.json({ error: 'Report temporarily unavailable.' }, { status: 500 })
  }
}
