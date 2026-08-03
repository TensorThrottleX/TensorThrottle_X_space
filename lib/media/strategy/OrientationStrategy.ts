import type { AssetReport } from '../analysis/reports'
import type { StrategyDecisionLog } from './RenderStrategy'

export class OrientationStrategy {
  determine(asset: AssetReport | null): {
    rotation: 0 | 90 | 180 | 270
    confidence: number
    decisionLog: StrategyDecisionLog[]
  } {
    const log: StrategyDecisionLog[] = []

    if (!asset || !asset.isAnalyzed) {
      log.push({ step: 'orientation', decision: 'default', reason: 'No asset report available', confidence: 0 })
      return { rotation: 0, confidence: 0, decisionLog: log }
    }

    const fileRotation = asset.rotationMetadata
    const w = asset.resolution.width
    const h = asset.resolution.height
    const isLandscape = w > h

    if (fileRotation !== 0) {
      const rotated = fileRotation === 90 || fileRotation === 270
      const rotatedLandscape = rotated ? h > w : isLandscape

      if (isLandscape === rotatedLandscape) {
        log.push({
          step: 'orientation',
          decision: `${fileRotation}° (file metadata)`,
          reason: `File rotation ${fileRotation}° from tkhd matrix, browser did not normalize`,
          confidence: 0.95,
        })
        return { rotation: fileRotation, confidence: 0.95, decisionLog: log }
      }

      log.push({
        step: 'orientation',
        decision: '0° (browser normalized)',
        reason: `File rotation ${fileRotation}° but browser already normalized dimensions`,
        confidence: 0.9,
      })
      return { rotation: 0, confidence: 0.9, decisionLog: log }
    }

    if (!isLandscape) {
      log.push({
        step: 'orientation',
        decision: '0° (portrait)',
        reason: 'Asset is portrait orientation, no rotation needed',
        confidence: 0.85,
      })
      return { rotation: 0, confidence: 0.85, decisionLog: log }
    }

    log.push({
      step: 'orientation',
      decision: '0° (landscape, no rotation metadata)',
      reason: 'Asset is landscape with no rotation metadata',
      confidence: 0.7,
    })
    return { rotation: 0, confidence: 0.7, decisionLog: log }
  }

  composeVideoStyle(rotation: 0 | 90 | 180 | 270, viewportW: number, viewportH: number, flexContainer?: boolean): Record<string, any> {
    const rotated = rotation === 90 || rotation === 270
    const style: Record<string, any> = {}

    if (rotation === 0) {
      style.objectFit = 'cover'
      return style
    }

    if (rotation === 180) {
      style.transform = 'rotate(180deg)'
      return style
    }

    style.flexShrink = 0

    if (flexContainer) {
      style.width = viewportH
      style.height = viewportW
      style.transform = `rotate(${rotation}deg)`
    } else {
      style.position = 'absolute'
      style.top = '50%'
      style.left = '50%'
      style.width = viewportH
      style.height = viewportW
      style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`
    }

    return style
  }
}

export const orientationStrategy = new OrientationStrategy()
