import type { CropRegion } from '../analysis/reports'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LAYER 2: STRATEGY — Immutable RenderStrategy
// Produced by RenderStrategyBuilder from analysis reports.
// Consumed by Rendering Layer.
// Contains every rendering decision. No analysis. No DOM. No React.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface StrategyDecisionLog {
  step: string
  decision: string
  reason: string
  confidence: number
}

export interface RenderStrategy {
  // ── Fit & Position ──
  objectFit: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none'
  objectPosition: string

  // ── Rotation ──
  rotation: 0 | 90 | 180 | 270

  // ── Scaling ──
  scale: number
  zoom: number

  // ── Crop ──
  cropRegion: CropRegion | null
  needsOverlay: boolean
  overlayType: 'crop' | 'letterbox' | 'pillarbox' | 'none'

  // ── Visual Effects ──
  filterString: string | null
  opacity: number
  transitionDuration: number

  // ── Playback ──
  playbackRate: number
  preloadStrategy: 'none' | 'metadata' | 'auto'

  // ── Quality Profile ──
  qualityProfile: 'ultra' | 'high' | 'medium' | 'low' | 'minimal'
  renderCost: number
  decodePreference: 'hardware' | 'software' | 'auto'

  // ── Metadata ──
  confidence: number
  strategyName: string
  decisionLog: StrategyDecisionLog[]
}

export function createDefaultStrategy(): RenderStrategy {
  return {
    objectFit: 'cover',
    objectPosition: 'center center',
    rotation: 0,
    scale: 1,
    zoom: 1,
    cropRegion: null,
    needsOverlay: false,
    overlayType: 'none',
    filterString: null,
    opacity: 1,
    transitionDuration: 600,
    playbackRate: 1,
    preloadStrategy: 'metadata',
    qualityProfile: 'high',
    renderCost: 0.5,
    decodePreference: 'auto',
    confidence: 0,
    strategyName: 'default',
    decisionLog: [],
  }
}
