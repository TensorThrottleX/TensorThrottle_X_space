/**
 * Optional service interfaces for future bot detection and AI features.
 *
 * These are extension points ONLY — nothing here is wired into the request
 * path. Every interface has a no-op default provider, so the discussion
 * system behaves identically with or without an implementation registered.
 */

// ─── Bot detection foundation ────────────────────────────────────────────

export interface BotSignals {
  /** Comments posted within a sliding window (count + span). */
  postingFrequency?: { count: number; windowSeconds: number }
  /** Client-reported typing cadence metrics. */
  typingCadence?: {
    typingTimeMs: number
    charCount: number
    backspaceCount: number
    pasteCount: number
  }
  /** Optional embedding of the message for similarity analysis. */
  embedding?: number[]
  /** Device trust level (0..1) from fingerprinting. */
  deviceTrust?: number
  /** Network trust level (0..1), e.g. proxy/VPN/probability scores. */
  networkTrust?: number
  /** Browser fingerprint hash. */
  fingerprint?: string
}

export interface BotDetectionService {
  /**
   * Scores a comment for bot-like behavior. Returns 0..1 (1 = almost
   * certainly a bot). Implementations must never throw — return 0 on error.
   */
  scoreSignals(signals: BotSignals): Promise<{ score: number; reasons: string[] }>
}

export const noopBotDetection: BotDetectionService = {
  async scoreSignals() {
    return { score: 0, reasons: [] }
  },
}

// ─── AI feature foundation ───────────────────────────────────────────────

export interface AIProvider {
  readonly id: string
  readonly enabled: boolean
}

export interface DiscussionAIService {
  /** Periodic/on-demand summary of a thread (returns null when unavailable). */
  summarizeThread(input: {
    postSlug: string
    title: string
    comments: Array<{ name: string; message: string }>
  }): Promise<{ summary: string } | null>

  /** Detects near-duplicate comments (returns [] when unavailable). */
  findDuplicates(input: {
    postSlug: string
    message: string
  }): Promise<Array<{ commentId: string; similarity: number }>>

  /** Semantic search over a post's comments. */
  semanticSearch(input: {
    postSlug: string
    query: string
    limit?: number
  }): Promise<Array<{ commentId: string; score: number }>>

  /** Translate a comment (returns null when unavailable). */
  translate(input: { text: string; targetLanguage: string }): Promise<{ text: string } | null>

  /** Re-rank comments for a thread display order (returns null when unavailable). */
  rankThread(input: {
    postSlug: string
    commentIds: string[]
  }): Promise<{ rankedIds: string[] } | null>

  /** Automated moderation pass over a comment (returns null when unavailable). */
  autoModerate(input: {
    message: string
    language?: string
  }): Promise<{ toxicityScore: number; spamScore: number; reasons: string[] } | null>
}

export const noopAIService: DiscussionAIService = {
  async summarizeThread() {
    return null
  },
  async findDuplicates() {
    return []
  },
  async semanticSearch() {
    return []
  },
  async translate() {
    return null
  },
  async rankThread() {
    return null
  },
  async autoModerate() {
    return null
  },
}

// ─── Provider registry (simple, replaceable) ─────────────────────────────

export interface DiscussionServiceRegistry {
  botDetection: BotDetectionService
  ai: DiscussionAIService
}

export const defaultServiceRegistry: DiscussionServiceRegistry = {
  botDetection: noopBotDetection,
  ai: noopAIService,
}

/** App-wide registry — swap in real providers here in the future. */
let registry: DiscussionServiceRegistry = defaultServiceRegistry

export function setDiscussionServices(next: Partial<DiscussionServiceRegistry>): void {
  registry = { ...defaultServiceRegistry, ...next }
}

export function getDiscussionServices(): DiscussionServiceRegistry {
  return registry
}
