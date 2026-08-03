// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RenderContext
//
// A lightweight, page-agnostic description of the intended user experience.
// Pages expose a RenderContext instead of rendering logic.
// The adaptive pipeline uses RenderContext to influence every rendering decision.
//
// Scene Type:    What kind of content is being presented
// Priority:      What matters most for this experience
// Visual Style:  Preferred aesthetic (optional, auto-detected if omitted)
// Accessibility: Explicit user preference overrides
// Interaction:   Current interaction mode
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type SceneType =
  | 'anime'
  | 'cinematic'
  | 'minimal'
  | 'showcase'
  | 'terminal'
  | 'documentation'
  | 'ambient'
  | 'gaming'
  | 'social'
  | 'unknown'

export type ExperiencePriority =
  | 'quality'
  | 'performance'
  | 'readability'
  | 'immersion'
  | 'balanced'

export type VisualStyle =
  | 'cinematic'
  | 'vibrant'
  | 'monochrome'
  | 'minimal'
  | 'dynamic'
  | 'natural'

export type InteractionState =
  | 'idle'
  | 'active'
  | 'scrolling'
  | 'focus'
  | 'transition'

export interface AccessibilityOverrides {
  reducedMotion?: boolean
  reducedData?: boolean
  highContrast?: boolean
  prefersDarkMode?: boolean
  prefersReducedTransparency?: boolean
}

export interface RenderContext {
  /** What kind of scene is being rendered */
  scene: SceneType
  /** What matters most for this experience */
  priority: ExperiencePriority
  /** Optional: preferred visual aesthetic */
  visualStyle?: VisualStyle
  /** Accessibility preferences */
  accessibility?: AccessibilityOverrides
  /** Session priority (passed to MediaOrchestrator) */
  sessionPriority?: number
  /** Current interaction state */
  interaction?: InteractionState
  /** Human-readable description for debugging/telemetry */
  description?: string
}

// ── Default contexts for common patterns ────────────────────────────────────

export const DEFAULT_RENDER_CONTEXT: RenderContext = {
  scene: 'unknown',
  priority: 'balanced',
  visualStyle: 'natural',
  interaction: 'idle',
  description: 'Default context',
}

export const ANIME_RENDER_CONTEXT: RenderContext = {
  scene: 'anime',
  priority: 'immersion',
  visualStyle: 'cinematic',
  interaction: 'idle',
  description: 'Anime universe background',
  sessionPriority: 50,
}

export const CINEMATIC_RENDER_CONTEXT: RenderContext = {
  scene: 'cinematic',
  priority: 'quality',
  visualStyle: 'cinematic',
  interaction: 'idle',
  description: 'Cinematic background experience',
}

export const MINIMAL_RENDER_CONTEXT: RenderContext = {
  scene: 'minimal',
  priority: 'readability',
  visualStyle: 'minimal',
  interaction: 'idle',
  description: 'Minimal, readable presentation',
}

export const TERMINAL_RENDER_CONTEXT: RenderContext = {
  scene: 'terminal',
  priority: 'performance',
  visualStyle: 'monochrome',
  interaction: 'focus',
  description: 'Terminal / code-focused experience',
}

export const SHOWCASE_RENDER_CONTEXT: RenderContext = {
  scene: 'showcase',
  priority: 'quality',
  visualStyle: 'vibrant',
  interaction: 'active',
  description: 'Showcase / hero presentation',
}
