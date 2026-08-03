import type { AssetReport, DeviceReport, ViewportReport, BrowserReport, PerformanceReport, ContentReport } from '../analysis/reports'
import type { RenderContext } from './RenderContext'
import { createDefaultStrategy } from './RenderStrategy'
import type { RenderStrategy } from './RenderStrategy'
import { orientationStrategy } from './OrientationStrategy'
import { qualityStrategy } from './QualityStrategy'
import { cropStrategy } from './CropStrategy'
import { effectsStrategy } from './EffectsStrategy'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RenderStrategyBuilder
//
// Orchestrates all individual strategies.
// Receives all reports from Analysis Layer + RenderContext from the page.
// Produces ONE immutable RenderStrategy.
//
// The builder itself has no side effects.
// It does not render, touch DOM, or use React.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class RenderStrategyBuilder {
  build(params: {
    asset: AssetReport | null
    device: DeviceReport | null
    viewport: ViewportReport | null
    browser: BrowserReport | null
    performance: PerformanceReport | null
    content: ContentReport | null
    cinematic?: boolean
    customFilter?: string | null
    context?: RenderContext | null
  }): RenderStrategy {
    const { asset, device, viewport, browser, performance, content, cinematic, customFilter, context } = params

    // 1. Orientation (not affected by context)
    const orientation = orientationStrategy.determine(asset)

    // 2. Quality (affected by context priority, scene)
    const quality = qualityStrategy.determine(asset, device, viewport, performance, context)

    // 3. Crop / Fit (source-derived: asset, viewport, content, scene)
    const crop = cropStrategy.determine(asset, viewport, content, context)

    // 4. Effects (source-derived: device GPU tier, scene, visual style, accessibility)
    const effects = effectsStrategy.determine(device, !!cinematic, customFilter, context)

    // 5. Compose
    const strategy = createDefaultStrategy()

    strategy.objectFit = crop.objectFit
    strategy.objectPosition = crop.objectPosition
    strategy.rotation = orientation.rotation
    strategy.scale = crop.scale
    strategy.zoom = crop.zoom
    strategy.cropRegion = crop.cropRegion
    strategy.needsOverlay = crop.needsOverlay
    strategy.overlayType = crop.overlayType
    strategy.filterString = effects.filterString
    strategy.opacity = effects.opacity
    strategy.transitionDuration = effects.transitionDuration
    strategy.qualityProfile = quality.qualityProfile
    strategy.renderCost = quality.renderCost
    strategy.decodePreference = quality.decodePreference
    strategy.preloadStrategy = quality.preloadStrategy
    strategy.confidence = quality.confidence * 0.4 + crop.confidence * 0.25 + orientation.confidence * 0.15 + 0.2

    strategy.decisionLog = [
      { step: 'context', decision: `${context?.scene || 'none'} / ${context?.priority || 'none'}`, reason: context?.description || 'No context', confidence: context ? 0.8 : 0 },
      ...orientation.decisionLog,
      ...quality.decisionLog,
      ...crop.decisionLog,
      ...effects.decisionLog,
    ]

    strategy.strategyName = crop.strategyName

    return strategy
  }
}

export const renderStrategyBuilder = new RenderStrategyBuilder()
