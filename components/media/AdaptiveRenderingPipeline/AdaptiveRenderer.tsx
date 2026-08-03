'use client'

import React, { useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useRenderStrategy } from './hooks/useRenderStrategy'
import { TelemetryPanel } from '../telemetry/TelemetryPanel'
import type { RenderStrategy } from '@/lib/media/strategy/RenderStrategy'
import type { RenderContext } from '@/lib/media/strategy/RenderContext'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AdaptiveRenderer — Layer 4 Rendering
//
// The highest-level integration component.
// Wires together all four layers:
//   Layer 1: Analysis (via useRenderStrategy hook)
//   Layer 2: Strategy (via RenderStrategyBuilder + RenderContext)
//   Layer 3: Runtime (via PerformanceMonitor + StrategyScheduler)
//   Layer 4: Rendering (this component)
//
// Pages provide a RenderContext describing their intended experience.
// AdaptiveRenderer handles everything else.
//
// AdaptiveRenderer is a pure executor of RenderStrategy.
// It does NOT analyze, decide, or monitor.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type AdaptiveRenderMode = 'background' | 'inline' | 'hero'
export type RenderEngine = 'background-video-engine' | 'native-video'

export interface AdaptiveRendererProps {
  /** Video source URL */
  src?: string | null
  /** Display mode */
  mode?: AdaptiveRenderMode
  /** Enable cinematic color grading */
  cinematic?: boolean
  /** Custom CSS filter override */
  filter?: string
  /** Custom opacity (0-1) */
  opacity?: number
  /** Autoplay */
  autoPlay?: boolean
  /** Loop */
  loop?: boolean
  /** Muted */
  muted?: boolean
  /** Plays inline on mobile */
  playsInline?: boolean
  /** Preload strategy */
  preload?: 'none' | 'metadata' | 'auto'
  /** Additional className */
  className?: string
  /** Additional video className */
  videoClassName?: string
  /** Additional inline styles */
  style?: React.CSSProperties
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean
  /** Show telemetry panel in development */
  showTelemetry?: boolean
  /** Children rendered inside the container */
  children?: React.ReactNode
  /** Fallback when no src */
  fallback?: React.ReactNode
  /** Render prop for custom rendering with strategy */
  render?: (strategy: RenderStrategy, videoStyle: React.CSSProperties) => React.ReactNode
  /** RenderContext describing the intended experience */
  context?: RenderContext | null
}

export interface AdaptiveRendererHandle {
  reanalyze: () => void
  currentStrategy: RenderStrategy
}

export const AdaptiveRenderer = forwardRef<AdaptiveRendererHandle, AdaptiveRendererProps>(
  function AdaptiveRenderer(props, ref) {
    const {
      src,
      mode = 'background',
      cinematic = false,
      filter: customFilter,
      opacity: propOpacity,
      autoPlay = true,
      loop = true,
      muted = true,
      playsInline = true,
      preload = 'metadata',
      className,
      videoClassName,
      style,
      enablePerformanceMonitoring = true,
      showTelemetry = false,
      children,
      fallback,
      render,
      context,
    } = props

    const videoRef = useRef<HTMLVideoElement>(null)

    const {
      strategy,
      isAnalyzing,
      reanalyze,
      applyRuntimeMetrics,
      telemetrySnapshot,
    } = useRenderStrategy(src, {
      cinematic,
      customFilter: customFilter || null,
      enableTelemetry: showTelemetry,
      context,
    })

    // Provide runtime metrics from the video element back to the strategy
    const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const frameCountRef = useRef(0)
    const lastTimeRef = useRef(performance.now())
    const rafRef = useRef<number | null>(null)
    React.useEffect(() => {
      if (!enablePerformanceMonitoring || !videoRef.current) return
      const el = videoRef.current
      frameCountRef.current = 0
      lastTimeRef.current = performance.now()

      const tick = () => {
        frameCountRef.current++
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)

      const sendMetrics = () => {
        const now = performance.now()
        const elapsed = (now - lastTimeRef.current) / 1000
        const fps = elapsed > 0 ? Math.round(frameCountRef.current / elapsed) : 0
        const vq = el.getVideoPlaybackQuality?.()
        applyRuntimeMetrics({
          fps,
          droppedFrames: vq?.droppedVideoFrames ?? 0,
          totalFrames: vq?.totalVideoFrames ?? 0,
          frameLatency: elapsed > 0 ? Math.round(1000 / fps) : null,
          memoryEstimate: null,
          cpuEstimate: null,
          longTasks: 0,
          jankScore: fps > 0 && fps < 20 ? 0.8 : fps < 30 ? 0.4 : 0,
          isDegraded: fps < 24,
          timestamp: now,
        })
        frameCountRef.current = 0
        lastTimeRef.current = now
      }
      metricsIntervalRef.current = setInterval(sendMetrics, 2000)
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current)
      }
    }, [enablePerformanceMonitoring, videoRef, applyRuntimeMetrics])

    useImperativeHandle(ref, () => ({
      reanalyze,
      currentStrategy: strategy,
    }), [reanalyze, strategy])

    // Compose video style from strategy
    const videoStyle = useMemo((): React.CSSProperties => {
      const style: React.CSSProperties = {
        objectFit: strategy.objectFit,
        objectPosition: strategy.objectPosition,
        opacity: propOpacity ?? strategy.opacity,
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
      }

      if (strategy.rotation === 180) {
        style.transform = 'rotate(180deg)'
      } else if (strategy.rotation === 90 || strategy.rotation === 270) {
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1080
        const vh = typeof window !== 'undefined' ? window.innerHeight : 1920
        style.position = 'absolute'
        style.top = '50%'
        style.left = '50%'
        style.width = vh
        style.height = vw
        style.transform = `translate(-50%, -50%) rotate(${strategy.rotation}deg)`
        style.flexShrink = 0
      }

      if (strategy.scale !== 1) {
        if (style.transform) {
          style.transform += ` scale(${strategy.scale})`
        } else {
          style.transform = `scale(${strategy.scale})`
        }
      }

      if (strategy.filterString) {
        style.filter = strategy.filterString
      }

      if (strategy.transitionDuration > 0) {
        style.transition = `opacity ${strategy.transitionDuration}ms ease, filter ${strategy.transitionDuration}ms ease`
      }

      if (propOpacity !== undefined) {
        style.opacity = propOpacity
      }

      return style
    }, [strategy, propOpacity])

    // Container style per mode
    const containerStyle = useMemo((): React.CSSProperties => {
      const base: React.CSSProperties = {
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }

      switch (mode) {
        case 'background':
          return { ...base, position: 'fixed', inset: 0, zIndex: 0, ...style }
        case 'hero':
          return { ...base, position: 'relative', width: '100%', height: '100%', ...style }
        case 'inline':
          return { ...base, position: 'relative', width: '100%', height: '100%', ...style }
        default:
          return { ...base, ...style }
      }
    }, [mode, style])

    // Support render prop for custom rendering
    if (render) {
      return <>{render(strategy, videoStyle)}</>
    }

    if (!src && fallback) {
      return <div className={className} style={containerStyle}>{fallback}</div>
    }

    if (!src && !children) {
      return null
    }

    return (
      <div className={className} style={containerStyle}>
        <video
          ref={videoRef}
          src={src ?? undefined}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload={isAnalyzing ? 'metadata' : preload}
          className={videoClassName}
          style={videoStyle}
          x-webkit-airplay="allow"
        >
          {children}
        </video>

        {showTelemetry && telemetrySnapshot && (
          <TelemetryPanel snapshot={telemetrySnapshot} />
        )}
      </div>
    )
  },
)

AdaptiveRenderer.displayName = 'AdaptiveRenderer'

export default AdaptiveRenderer
