'use client'

import React, { forwardRef, useImperativeHandle, useCallback } from 'react'
import { useRenderStrategy } from './hooks/useRenderStrategy'
import { BackgroundVideoEngine } from '@/components/media/BackgroundVideoEngine'
import type { RenderContext } from '@/lib/media/strategy/RenderContext'
import type { PerformanceReport } from '@/lib/media/analysis/reports'

export interface AdaptiveRenderingPipelineProps {
  src?: string | null
  context?: RenderContext | null
  cinematic?: boolean
  filter?: string
  opacity?: number
  crossfade?: boolean
  className?: string
  children?: React.ReactNode
  enableTelemetry?: boolean
  disablePip?: boolean
  loop?: boolean
}

export const AdaptiveRenderingPipeline = forwardRef<
  { reanalyze: () => void },
  AdaptiveRenderingPipelineProps
>(function AdaptiveRenderingPipeline(props, ref) {
  const {
    src,
    context,
    cinematic = false,
    filter: customFilter,
    opacity,
    crossfade = false,
    className,
    children,
    enableTelemetry = false,
    disablePip = false,
    loop = true,
  } = props

  const {
    strategy,
    isAnalyzing,
    reanalyze,
    applyRuntimeMetrics,
  } = useRenderStrategy(src ?? null, {
    cinematic,
    customFilter: customFilter || null,
    enableTelemetry,
    context: context ?? null,
  })

  useImperativeHandle(ref, () => ({ reanalyze }), [reanalyze])

  const handleRuntimeMetrics = useCallback((report: PerformanceReport) => {
    applyRuntimeMetrics(report)
  }, [applyRuntimeMetrics])

  return (
    <BackgroundVideoEngine
      src={src ?? null}
      strategy={strategy}
      isAnalyzing={isAnalyzing}
      crossfade={crossfade}
      opacity={opacity}
      className={className}
      onRuntimeMetrics={handleRuntimeMetrics}
      disablePip={disablePip}
      loop={loop}
    >
      {children}
    </BackgroundVideoEngine>
  )
})

export default AdaptiveRenderingPipeline
