/**
 * Moderation metadata foundation — typed, future-compatible fields attached to
 * every comment via the existing `metadata` JSONB column. All fields default
 * safely so nothing downstream fails when a signal is unavailable.
 *
 * This layer does NOT change any behavior: it only names the fields the
 * moderation pipeline will populate over time (toxicity/spam/bot scoring,
 * language detection, review queues) so storage and consumers stay stable.
 */

export type CommentStatus = 'active' | 'pending_review' | 'shadow_banned' | 'reviewed'

export type ReviewState = 'none' | 'queued' | 'approved' | 'rejected' | 'escalated'

export type ModerationFlag =
  | 'spam'
  | 'toxicity'
  | 'link_spam'
  | 'aggressive_punctuation'
  | 'uppercase_ratio'
  | 'low_entropy'
  | 'typing_anomaly'
  | 'reported'

export interface ModerationMetadata {
  /** 0..1 — ML toxicity probability (unavailable -> 0). */
  toxicity_score: number
  /** 0..1 — heuristic/ML spam likelihood (unavailable -> 0). */
  spam_score: number
  /** 0..1 — bot-behavior likelihood (unavailable -> 0). */
  bot_score: number
  /** ISO 639-1 best guess ('unknown' when undetected). */
  language: string
  /** Lifecycle state of the comment. */
  status: CommentStatus
  /** Flag names that triggered during moderation. */
  flags: ModerationFlag[]
  /** Review-queue state (admin workflows; 'none' by default). */
  review_state: ReviewState
}

export function emptyModerationMetadata(): ModerationMetadata {
  return {
    toxicity_score: 0,
    spam_score: 0,
    bot_score: 0,
    language: 'unknown',
    status: 'active',
    flags: [],
    review_state: 'none',
  }
}

/**
 * Builds moderation metadata from the signals the current pipeline already
 * produces. Safe defaults for everything else. Never throws.
 */
export function createModerationMetadata(input: {
  riskScore?: number
  toxicityScore?: number
  isShadowBanned?: boolean
  heuristics?: {
    linkCount?: number
    profanityCount?: number
    entropy?: number
    uppercaseRatio?: number
  }
} = {}): ModerationMetadata {
  const meta = emptyModerationMetadata()
  const flags: ModerationFlag[] = []

  if (typeof input.toxicityScore === 'number' && Number.isFinite(input.toxicityScore)) {
    meta.toxicity_score = Math.max(0, Math.min(1, input.toxicityScore))
  }
  if (typeof input.riskScore === 'number' && Number.isFinite(input.riskScore)) {
    // riskScore is a 0..~50 heuristic sum; map into 0..1 as a conservative proxy
    meta.spam_score = Math.max(0, Math.min(1, input.riskScore / 50))
  }

  if (input.isShadowBanned) {
    meta.status = 'shadow_banned'
  }

  if (input.heuristics) {
    const { linkCount, profanityCount, entropy, uppercaseRatio } = input.heuristics
    if (typeof linkCount === 'number' && linkCount > 0) flags.push('link_spam')
    if (typeof profanityCount === 'number' && profanityCount > 0) flags.push('toxicity')
    if (typeof entropy === 'number' && entropy < 1.5) flags.push('low_entropy')
    if (typeof uppercaseRatio === 'number' && uppercaseRatio > 0.6) flags.push('uppercase_ratio')
  }

  meta.flags = flags
  return meta
}
