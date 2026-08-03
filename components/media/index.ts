export { BackgroundVideoEngine, useBackgroundVideoEngine } from './BackgroundVideoEngine/Engine'
export { VideoCache } from './BackgroundVideoEngine/VideoCache'
export { useTransitionManager, DEFAULT_FADE_MS } from './BackgroundVideoEngine/TransitionManager'
export type {
  BackgroundVideoConfig,
  BackgroundVideoState,
  BackgroundVideoContextValue,
  BackgroundVideoEngineProps,
} from './BackgroundVideoEngine/types'

export { AdaptiveRenderingPipeline, AdaptiveRenderer, useRenderStrategy } from './AdaptiveRenderingPipeline'
export type { AdaptiveRenderingPipelineProps, AdaptiveRendererProps, AdaptiveRendererHandle, AdaptiveRenderMode, RenderEngine, UseRenderStrategyOptions, UseRenderStrategyResult } from './AdaptiveRenderingPipeline'
