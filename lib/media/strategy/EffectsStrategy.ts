import type { DeviceReport } from '../analysis/reports'
import type { RenderContext } from './RenderContext'
import type { StrategyDecisionLog } from './RenderStrategy'

type GpuTierLabel = 'ultra' | 'high' | 'medium' | 'low' | 'unknown'

export class EffectsStrategy {
  determine(
    device: DeviceReport | null,
    cinematic: boolean,
    customFilter?: string | null,
    context?: RenderContext | null,
  ): {
    filterString: string | null
    opacity: number
    transitionDuration: number
    decisionLog: StrategyDecisionLog[]
  } {
    const log: StrategyDecisionLog[] = []

    if (customFilter) {
      log.push({ step: 'effects', decision: 'custom_filter', reason: 'Using developer-provided filter override', confidence: 1 })
      return { filterString: customFilter, opacity: 1, transitionDuration: this.getDuration(device, context), decisionLog: log }
    }

    if (!cinematic && !this.sceneHasEffects(context)) {
      log.push({ step: 'effects', decision: 'no_filter', reason: this.noEffectReason(context), confidence: 1 })
      return { filterString: null, opacity: this.getOpacity(context), transitionDuration: this.getDuration(device, context), decisionLog: log }
    }

    const gpuTier = this.getGpuTier(device)
    const reducedMotion = context?.accessibility?.reducedMotion ?? device?.prefersReducedMotion ?? false

    const brightness = this.computeBrightness(gpuTier, context)
    const contrast = this.computeContrast(gpuTier, context)
    const saturation = this.computeSaturation(gpuTier, context)

    const parts: string[] = []
    if (brightness !== null) parts.push(`brightness(${brightness})`)
    if (contrast !== null) parts.push(`contrast(${contrast})`)
    if (saturation !== null) parts.push(`saturate(${saturation})`)

    if (parts.length === 0 && this.canAddVignette(context)) {
      if (context?.scene === 'cinematic') parts.push('brightness(0.8) contrast(1.03)')
    }

    const filterString = parts.length > 0 ? parts.join(' ') : null
    const opacity = this.getOpacity(context)
    const transitionDuration = reducedMotion ? 0 : this.getDuration(device, context)

    log.push({
      step: 'effects',
      decision: filterString || 'none',
      reason: `GPU=${device?.gpu.tier || 'unknown'}, scene=${context?.scene || 'none'}, priority=${context?.priority || 'none'}`,
      confidence: gpuTier,
    })

    return { filterString, opacity, transitionDuration, decisionLog: log }
  }

  private sceneHasEffects(context?: RenderContext | null): boolean {
    if (!context) return false
    switch (context.scene) {
      case 'cinematic':
      case 'anime':
      case 'showcase':
      case 'gaming':
        return true
      default:
        return false
    }
  }

  private noEffectReason(context?: RenderContext | null): string {
    if (!context) return 'No cinematic flag and no scene context'
    return `${context.scene} scene: cinematic effects disabled`
  }

  private canAddVignette(context?: RenderContext | null): boolean {
    if (context?.scene === 'cinematic' || context?.scene === 'showcase') return true
    return false
  }

  private getGpuTier(device: DeviceReport | null): number {
    if (!device) return 0.5
    const tiers: Record<string, number> = { unknown: 0.3, low: 0.2, medium: 0.5, high: 0.8, ultra: 1.0 }
    return tiers[device.gpu.tier] || 0.3
  }

  private getGpuTierLabel(device: DeviceReport | null): GpuTierLabel {
    if (!device) return 'medium'
    return device.gpu.tier || 'unknown'
  }

  private computeBrightness(gpuTier: number, context?: RenderContext | null): number | null {
    if (context?.visualStyle === 'monochrome' || context?.scene === 'terminal') return 0.7
    if (context?.visualStyle === 'vibrant' || context?.scene === 'showcase') return 0.75
    if (context?.scene === 'anime') return 0.55
    if (gpuTier < 0.3) return null
    if (gpuTier >= 0.8) return 0.65
    if (gpuTier >= 0.5) return 0.6
    return 0.6
  }

  private computeContrast(gpuTier: number, context?: RenderContext | null): number | null {
    if (gpuTier < 0.3) return null
    if (context?.accessibility?.highContrast) return 1.2
    if (context?.visualStyle === 'monochrome') return 1.1
    if (gpuTier >= 0.8) return 1.08
    if (gpuTier >= 0.5) return 1.05
    return null
  }

  private computeSaturation(gpuTier: number, context?: RenderContext | null): number | null {
    if (gpuTier < 0.4) return null
    if (context?.visualStyle === 'monochrome' || context?.scene === 'terminal') return 0
    if (context?.visualStyle === 'vibrant') return 1.25
    if (gpuTier >= 0.8) return 1.15
    if (gpuTier >= 0.5) return 1.05
    return null
  }

  private getOpacity(context?: RenderContext | null): number {
    if (context?.accessibility?.prefersReducedTransparency) return 1
    if (context?.scene === 'terminal' || context?.scene === 'documentation') return 0.7
    if (context?.scene === 'ambient') return 0.5
    return 1
  }

  private getDuration(device: DeviceReport | null, context?: RenderContext | null): number {
    if (context?.accessibility?.reducedMotion) return 0
    if (device?.prefersReducedMotion) return 0
    if (context?.interaction === 'scrolling') return 200
    if (context?.interaction === 'transition') return 0
    const label = this.getGpuTierLabel(device)
    switch (label) {
      case 'ultra': return 800
      case 'high': return 600
      case 'medium': return 400
      case 'low': return 200
      default: return 600
    }
  }
}

export const effectsStrategy = new EffectsStrategy()
