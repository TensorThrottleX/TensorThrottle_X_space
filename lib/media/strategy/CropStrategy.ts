import type { AssetReport, ViewportReport, ContentReport, CropRegion } from '../analysis/reports'
import type { RenderContext } from './RenderContext'
import type { StrategyDecisionLog } from './RenderStrategy'

export class CropStrategy {
  determine(
    asset: AssetReport | null,
    viewport: ViewportReport | null,
    content: ContentReport | null,
    context?: RenderContext | null,
  ): {
    objectFit: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none'
    objectPosition: string
    cropRegion: CropRegion | null
    scale: number
    zoom: number
    needsOverlay: boolean
    overlayType: 'crop' | 'letterbox' | 'pillarbox' | 'none'
    strategyName: string
    confidence: number
    decisionLog: StrategyDecisionLog[]
  } {
    const log: StrategyDecisionLog[] = []

    if (!asset || !viewport) {
      log.push({ step: 'crop', decision: 'default_cover', reason: 'Missing asset or viewport', confidence: 0 })
      console.log(`[CropStrategy] MISSING asset=${!!asset} viewport=${!!viewport} → default_cover`)
      return this.defaultCover(log)
    }

    const va = asset.aspectRatio
    const sa = viewport.aspectRatio
    const diff = Math.abs(va - sa) / Math.max(va, sa)

    log.push({ step: 'crop', decision: `diff=${diff.toFixed(3)}`, reason: `Video ${va.toFixed(2)} vs viewport ${sa.toFixed(2)}`, confidence: 1 - diff })

    // Scene bias informs objectPosition for background video
    const bias = this.sceneBias(context)
    log.push({ step: 'crop', decision: `scene=${context?.scene || 'unknown'}`, reason: `Bias: ${bias}`, confidence: 0.6 })
    const position = this.resolvePosition(bias)

    if (diff < 0.08) {
      log.push({ step: 'crop', decision: 'match_cover', reason: `Near-perfect aspect match (${diff.toFixed(3)})`, confidence: 0.95 })
      console.log(`[CropStrategy] match_cover: va=${va.toFixed(3)} sa=${sa.toFixed(3)} diff=${diff.toFixed(3)}`)
      return { ...this.defaultCover(log), objectPosition: position, strategyName: 'match_cover', confidence: 0.95 }
    }

    if (content?.primarySubject && diff > 0.15) {
      const subject = content.primarySubject
      const vpCenter = 0.5
      const subCenter = subject.x + subject.width / 2
      const offset = (subCenter - vpCenter) * 100
      const clamped = Math.max(-50, Math.min(50, offset))

      if (va > sa) {
        const pos = `calc(50% + ${clamped}%) center`
        log.push({
          step: 'crop', decision: 'subject_aware_horizontal',
          reason: `Subject at ${(subCenter * 100).toFixed(0)}%, offset ${clamped.toFixed(0)}%`,
          confidence: 0.85,
        })
        console.log(`[CropStrategy] subject_aware_horizontal: pos=${pos}`)
        return {
          objectFit: 'cover', objectPosition: pos,
          cropRegion: subject, scale: 1, zoom: 1,
          needsOverlay: false, overlayType: 'none',
          strategyName: 'subject_aware_crop', confidence: 0.85, decisionLog: log,
        }
      }

      const vertOffset = Math.max(0, Math.min(100, 50 + offset))
      const pos = `center ${vertOffset}%`
      log.push({
        step: 'crop', decision: 'subject_aware_vertical',
        reason: `Vertical subject at ${(subCenter * 100).toFixed(0)}%`,
        confidence: 0.8,
      })
      console.log(`[CropStrategy] subject_aware_vertical: pos=${pos}`)
      return {
        objectFit: 'cover', objectPosition: pos,
        cropRegion: subject, scale: 1, zoom: 1,
        needsOverlay: false, overlayType: 'none',
        strategyName: 'subject_aware_crop', confidence: 0.8, decisionLog: log,
      }
    }

    if (diff > 0.5) {
      if (va > sa * 1.5) {
        log.push({ step: 'crop', decision: 'ultrawide_cover', reason: 'Ultrawide video on narrower viewport — cover applied', confidence: 0.75 })
        console.log(`[CropStrategy] ultrawide_cover: va=${va.toFixed(3)} sa=${sa.toFixed(3)} va>sa*1.5=${va > sa * 1.5}`)
        return {
          objectFit: 'cover', objectPosition: position,
          cropRegion: null, scale: 1, zoom: 1,
          needsOverlay: false, overlayType: 'none',
          strategyName: 'ultrawide_cover', confidence: 0.75, decisionLog: log,
        }
      }
      if (sa > va * 1.5) {
        log.push({ step: 'crop', decision: 'portrait_cover', reason: 'Portrait video on wider viewport — cover applied', confidence: 0.75 })
        console.log(`[CropStrategy] portrait_cover: va=${va.toFixed(3)} sa=${sa.toFixed(3)} sa>va*1.5=${sa > va * 1.5}`)
        return {
          objectFit: 'cover', objectPosition: position,
          cropRegion: null, scale: 1, zoom: 1,
          needsOverlay: false, overlayType: 'none',
          strategyName: 'portrait_cover', confidence: 0.75, decisionLog: log,
        }
      }
    }

    if (asset.safeCropRegion && diff > 0.3) {
      log.push({ step: 'crop', decision: 'safe_crop', reason: 'Using computed safe crop region', confidence: 0.7 })
      console.log(`[CropStrategy] safe_crop: region=${JSON.stringify(asset.safeCropRegion)}`)
      return {
        objectFit: 'cover', objectPosition: position,
        cropRegion: asset.safeCropRegion, scale: 1, zoom: 1,
        needsOverlay: false, overlayType: 'none',
        strategyName: 'safe_crop', confidence: 0.7, decisionLog: log,
      }
    }

    console.log(`[CropStrategy] default_cover: va=${va.toFixed(3)} sa=${sa.toFixed(3)} diff=${diff.toFixed(3)} bias=${bias}`)
    log.push({ step: 'crop', decision: 'default_cover', reason: `Standard cover (diff=${diff.toFixed(2)})`, confidence: 0.6 })
    return { ...this.defaultCover(log), objectPosition: position, strategyName: 'mismatch_cover', confidence: 0.6 }
  }

  private sceneBias(context?: RenderContext | null): string {
    if (!context) return 'center'
    switch (context.scene) {
      case 'showcase':
      case 'documentation':
      case 'terminal':
      case 'minimal':
      case 'anime':
      case 'cinematic':
      case 'ambient':
        return 'center'
      default:
        return 'center'
    }
  }

  private resolvePosition(bias: string): string {
    switch (bias) {
      case 'top':
        return 'center top'
      case 'bottom':
        return 'center bottom'
      case 'left':
        return 'left center'
      case 'right':
        return 'right center'
      case 'center':
      default:
        return 'center center'
    }
  }

  private defaultCover(log?: StrategyDecisionLog[]) {
    return {
      objectFit: 'cover' as const,
      objectPosition: 'center center',
      cropRegion: null,
      scale: 1,
      zoom: 1,
      needsOverlay: false,
      overlayType: 'none' as const,
      strategyName: 'default_cover',
      confidence: 0.5,
      decisionLog: log || [],
    }
  }
}

export const cropStrategy = new CropStrategy()
