// Layer 1: Analysis
export {
  assetAnalyzer, deviceAnalyzer, viewportAnalyzer,
  browserAnalyzer, contentAnalyzer, performanceAnalyzer,
} from './analysis'
export type {
  AssetReport, DeviceReport, ViewportReport, BrowserReport,
  ContentReport, PerformanceReport, ContentCategory, CropRegion,
} from './analysis'

// Layer 2: Strategy
export { renderStrategyBuilder, orientationStrategy, qualityStrategy, cropStrategy, effectsStrategy, createDefaultStrategy } from './strategy'
export type { RenderStrategy, StrategyDecisionLog, RenderContext, SceneType, ExperiencePriority, VisualStyle, InteractionState, AccessibilityOverrides } from './strategy'
export {
  DEFAULT_RENDER_CONTEXT, ANIME_RENDER_CONTEXT, CINEMATIC_RENDER_CONTEXT,
  MINIMAL_RENDER_CONTEXT, TERMINAL_RENDER_CONTEXT, SHOWCASE_RENDER_CONTEXT,
} from './strategy'

// Layer 3: Runtime
export { performanceMonitor, strategyScheduler, telemetry } from './runtime'
export type { TelemetrySnapshot } from './runtime'

// Shared utilities
export { walkBoxes, findBox, readMatrixRotation, detectCodecFromBuffer, createVideoMetadata, clamp, lerp, debounce, throttle } from './shared'
export { drawFrameToCanvas, computeEdgeEnergy, computeBrightnessDistribution, estimateBlockiness, detectLetterboxing } from './shared'
