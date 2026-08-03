'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { assetAnalyzer } from '@/lib/media/analysis/analyzers/AssetAnalyzer'
import { deviceAnalyzer } from '@/lib/media/analysis/analyzers/DeviceAnalyzer'
import { viewportAnalyzer } from '@/lib/media/analysis/analyzers/ViewportAnalyzer'
import { browserAnalyzer } from '@/lib/media/analysis/analyzers/BrowserAnalyzer'
import { renderStrategyBuilder } from '@/lib/media/strategy/RenderStrategyBuilder'
import { strategyScheduler } from '@/lib/media/runtime/StrategyScheduler'
import { telemetry } from '@/lib/media/runtime/Telemetry'
import type { RenderStrategy } from '@/lib/media/strategy/RenderStrategy'
import type { RenderContext } from '@/lib/media/strategy/RenderContext'
import type { ScheduleReason } from '@/lib/media/runtime/StrategyScheduler'
import type { PerformanceReport } from '@/lib/media/analysis/reports'

const STRATEGY_VERSION = 2

export interface UseRenderStrategyOptions {
  cinematic?: boolean
  customFilter?: string | null
  enableTelemetry?: boolean
  context?: RenderContext | null
}

export interface UseRenderStrategyResult {
  strategy: RenderStrategy
  isAnalyzing: boolean
  reanalyze: () => void
  applyRuntimeMetrics: (report: PerformanceReport) => void
  telemetrySnapshot: ReturnType<typeof telemetry.getSnapshot> | null
}

type PresentationCache = Pick<RenderStrategy,
  | 'rotation'
  | 'objectFit'
  | 'objectPosition'
  | 'cropRegion'
  | 'scale'
  | 'zoom'
  | 'needsOverlay'
  | 'overlayType'
  | 'filterString'
  | 'opacity'
  | 'transitionDuration'
  | 'playbackRate'
  | 'strategyName'
> & {
  _strategyVersion: number
}

function pickPresentation(s: RenderStrategy): PresentationCache {
  return {
    rotation: s.rotation,
    objectFit: s.objectFit,
    objectPosition: s.objectPosition,
    cropRegion: s.cropRegion,
    scale: s.scale,
    zoom: s.zoom,
    needsOverlay: s.needsOverlay,
    overlayType: s.overlayType,
    filterString: s.filterString,
    opacity: s.opacity,
    transitionDuration: s.transitionDuration,
    playbackRate: s.playbackRate,
    strategyName: s.strategyName,
    _strategyVersion: STRATEGY_VERSION,
  }
}

function applyPresentation(s: RenderStrategy, cached: PresentationCache): void {
  s.rotation = cached.rotation
  s.objectFit = cached.objectFit
  s.objectPosition = cached.objectPosition
  s.cropRegion = cached.cropRegion
  s.scale = cached.scale
  s.zoom = cached.zoom
  s.needsOverlay = cached.needsOverlay
  s.overlayType = cached.overlayType
  s.filterString = cached.filterString
  s.opacity = cached.opacity
  s.transitionDuration = cached.transitionDuration
  s.playbackRate = cached.playbackRate
  s.strategyName = cached.strategyName
}

export function useRenderStrategy(
  src: string | null | undefined,
  options: UseRenderStrategyOptions = {},
): UseRenderStrategyResult {
  const {
    cinematic = false,
    customFilter = null,
    enableTelemetry = false,
    context = null,
  } = options

  const [strategy, setStrategy] = useState<RenderStrategy>(() => {
    const s = renderStrategyBuilder.build({
      asset: null, device: null, viewport: null,
      browser: null, performance: null, content: null,
      cinematic, customFilter, context,
    })
    return s
  })

  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [telemetrySnapshot, setTelemetrySnapshot] = useState<ReturnType<typeof telemetry.getSnapshot> | null>(null)
  const lastSrcRef = useRef<string | null>(null)
  const analyzingRef = useRef(false)
  const contextRef = useRef(context)
  contextRef.current = context
  const performanceRef = useRef<PerformanceReport | null>(null)
  const presentationCache = useRef(new Map<string, PresentationCache>())

  const recompute = useCallback(async (reason?: ScheduleReason) => {
    const currentSrc = src ?? undefined
    if (!currentSrc) return
    if (analyzingRef.current) return
    analyzingRef.current = true
    setIsAnalyzing(true)

    try {
      const [asset, device, viewport] = await Promise.all([
        assetAnalyzer.analyze(currentSrc),
        deviceAnalyzer.analyze(),
        Promise.resolve(viewportAnalyzer.analyze()),
      ])

      const browser = browserAnalyzer.analyze(device)
      const performanceReport = performanceRef.current

      const newStrategy = renderStrategyBuilder.build({
        asset, device, viewport, browser,
        performance: performanceReport, content: null,
        cinematic, customFilter, context: contextRef.current,
      })

      const cached = presentationCache.current.get(currentSrc)

      if (cached && cached._strategyVersion === STRATEGY_VERSION) {
        applyPresentation(newStrategy, cached)
      } else {
        if (cached) {
          console.log(`[useRenderStrategy] Discarding stale cache for ${currentSrc}: version ${cached._strategyVersion} !== ${STRATEGY_VERSION}`)
          presentationCache.current.delete(currentSrc)
        }
        if (asset?.isAnalyzed && asset.resolution.width > 0) {
          presentationCache.current.set(currentSrc, pickPresentation(newStrategy))
        }
      }

      setStrategy(newStrategy)

      if (enableTelemetry) {
        telemetry.recordSrc(currentSrc)
        telemetry.recordAsset(asset)
        telemetry.recordDevice(device)
        telemetry.recordViewport(viewport)
        telemetry.recordBrowser(browser)
        telemetry.recordStrategy(newStrategy)
        setTelemetrySnapshot(telemetry.getSnapshot())
      }
    } catch (err) {
      console.warn('[useRenderStrategy] Analysis failed:', err)
    } finally {
      setIsAnalyzing(false)
      analyzingRef.current = false
    }
  }, [src, cinematic, customFilter, enableTelemetry])

  useEffect(() => {
    if (src && src !== lastSrcRef.current) {
      lastSrcRef.current = src
      if (enableTelemetry) telemetry.reset(src)
      recompute('src_changed')
    }
  }, [src, recompute, enableTelemetry])

  useEffect(() => {
    strategyScheduler.start()
    const unsub = strategyScheduler.onRecompute((reason: ScheduleReason) => {
      recompute(reason)
    })

    return () => {
      unsub()
      strategyScheduler.stop()
    }
  }, [recompute])

  useEffect(() => {
    if (!enableTelemetry) return
    const interval = setInterval(() => {
      telemetry.emit()
      setTelemetrySnapshot(telemetry.getSnapshot())
    }, 2000)
    return () => clearInterval(interval)
  }, [enableTelemetry])

  const applyRuntimeMetrics = useCallback((report: PerformanceReport) => {
    performanceRef.current = report
    if (enableTelemetry) {
      telemetry.recordPerformance(report)
      setTelemetrySnapshot(telemetry.getSnapshot())
    }
    recompute('performance_degraded')
  }, [recompute, enableTelemetry])

  const reanalyze = useCallback(() => {
    presentationCache.current.delete(src ?? '')
    recompute('manual')
  }, [src, recompute])

  return { strategy, isAnalyzing, reanalyze, applyRuntimeMetrics, telemetrySnapshot }
}
