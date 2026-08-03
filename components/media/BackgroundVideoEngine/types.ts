import type { PerformanceReport } from '@/lib/media/analysis/reports'
import type { RenderStrategy } from '@/lib/media/strategy/RenderStrategy'

export interface BackgroundVideoConfig {
  src?: string | null
  cinematic?: boolean
  opacity?: number
  preload?: 'none' | 'metadata' | 'auto'
  crossfade?: boolean
  filter?: string
  /** Disable Picture-in-Picture / pop-out / remote playback for decorative background videos */
  disablePip?: boolean
}

export interface BackgroundVideoState {
  currentSrc: string | null
  isPlaying: boolean
  isLoading: boolean
  hasError: boolean
  isSuspended: boolean
}

export interface BackgroundVideoContextValue {
  setSource: (src: string | null) => void
  setConfig: (config: Partial<BackgroundVideoConfig>) => void
  state: BackgroundVideoState
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export interface BackgroundVideoEngineProps extends BackgroundVideoConfig {
  className?: string
  children?: React.ReactNode
  suspended?: boolean
  strategy?: RenderStrategy
  isAnalyzing?: boolean
  onRuntimeMetrics?: (report: PerformanceReport) => void
}
