import type { AssetReport, DeviceReport, ViewportReport, PerformanceReport } from '../analysis/reports'
import type { RenderContext } from './RenderContext'
import type { StrategyDecisionLog } from './RenderStrategy'

export class QualityStrategy {
  determine(
    asset: AssetReport | null,
    device: DeviceReport | null,
    viewport: ViewportReport | null,
    performance: PerformanceReport | null,
    context?: RenderContext | null,
  ): {
    qualityProfile: 'ultra' | 'high' | 'medium' | 'low' | 'minimal'
    renderCost: number
    decodePreference: 'hardware' | 'software' | 'auto'
    preloadStrategy: 'none' | 'metadata' | 'auto'
    confidence: number
    decisionLog: StrategyDecisionLog[]
  } {
    const log: StrategyDecisionLog[] = []

    const gpuScore = this.scoreGPU(device)
    log.push({ step: 'quality', decision: `gpu=${gpuScore.toFixed(2)}`, reason: this.gpuReason(device), confidence: gpuScore })

    const cpuScore = this.scoreCPU(device)
    log.push({ step: 'quality', decision: `cpu=${cpuScore.toFixed(2)}`, reason: `${device?.cpu.cores || 4} cores`, confidence: cpuScore })

    const memScore = this.scoreMemory(device)
    log.push({ step: 'quality', decision: `memory=${memScore.toFixed(2)}`, reason: `${device?.memory.deviceMemory || 4}GB`, confidence: memScore })

    const bwScore = this.scoreBandwidth(device)
    log.push({ step: 'quality', decision: `bandwidth=${bwScore.toFixed(2)}`, reason: this.bandwidthReason(device), confidence: bwScore })

    const resScore = this.scoreResolution(asset)
    log.push({ step: 'quality', decision: `resolution=${resScore.toFixed(2)}`, reason: this.resolutionReason(asset), confidence: resScore })

    const batScore = this.scoreBattery(device)
    log.push({ step: 'quality', decision: `battery=${batScore.toFixed(2)}`, reason: this.batteryReason(device), confidence: batScore })

    const perfScore = performance ? this.scorePerformance(performance) : 1
    if (performance) {
      log.push({ step: 'quality', decision: `perf=${perfScore.toFixed(2)}`, reason: this.performanceReason(performance), confidence: perfScore })
    }

    const rmScore = context?.accessibility?.reducedMotion ?? device?.prefersReducedMotion ? 0.2 : 1.0
    log.push({ step: 'quality', decision: `reducedMotion=${rmScore.toFixed(2)}`, reason: context?.accessibility?.reducedMotion ? 'Accessibility: reduced motion' : 'Animations enabled', confidence: rmScore })

    const contextScore = this.scoreContextPriority(context)
    log.push({ step: 'quality', decision: `context=${contextScore.toFixed(2)}`, reason: this.contextReason(context), confidence: contextScore })

    const overall = this.computeOverall([
      { aspect: 'gpu', score: gpuScore, weight: 0.18 },
      { aspect: 'cpu', score: cpuScore, weight: 0.08 },
      { aspect: 'memory', score: memScore, weight: 0.08 },
      { aspect: 'bandwidth', score: bwScore, weight: 0.08 },
      { aspect: 'resolution', score: resScore, weight: 0.12 },
      { aspect: 'battery', score: batScore, weight: 0.08 },
      { aspect: 'performance', score: perfScore, weight: 0.13 },
      { aspect: 'reducedMotion', score: rmScore, weight: 0.10 },
      { aspect: 'context', score: contextScore, weight: 0.15 },
    ])

    const qualityProfile = this.profileFromScore(overall, context)
    const renderCost = this.computeRenderCost(overall, gpuScore, resScore, context)
    const decodePreference = this.determineDecodePreference(device, qualityProfile, context)
    const preloadStrategy = this.determinePreloadStrategy(qualityProfile, bwScore, context)

    log.push({
      step: 'quality',
      decision: `profile=${qualityProfile}, cost=${renderCost.toFixed(2)}`,
      reason: `Overall: ${overall.toFixed(3)}, scene=${context?.scene || 'none'}, priority=${context?.priority || 'none'}`,
      confidence: overall,
    })

    return { qualityProfile, renderCost, decodePreference, preloadStrategy, confidence: overall, decisionLog: log }
  }

  private scoreContextPriority(context?: RenderContext | null): number {
    if (!context) return 0.5
    switch (context.priority) {
      case 'quality': return 0.9
      case 'immersion': return 0.85
      case 'balanced': return 0.5
      case 'readability': return 0.3
      case 'performance': return 0.2
    }
  }

  private contextReason(context?: RenderContext | null): string {
    if (!context) return 'No context'
    return `scene=${context.scene}, priority=${context.priority}`
  }

  private profileFromScore(score: number, context?: RenderContext | null): 'ultra' | 'high' | 'medium' | 'low' | 'minimal' {
    const sceneBoost = this.getSceneBoost(context)
    const adjusted = score * sceneBoost
    if (adjusted >= 0.85) return 'ultra'
    if (adjusted >= 0.65) return 'high'
    if (adjusted >= 0.4) return 'medium'
    if (adjusted >= 0.2) return 'low'
    return 'minimal'
  }

  private getSceneBoost(context?: RenderContext | null): number {
    if (!context) return 1.0
    switch (context.scene) {
      case 'showcase': return 1.15
      case 'cinematic': return 1.1
      case 'anime': return 1.05
      case 'gaming': return 1.05
      case 'ambient': return 0.9
      case 'terminal': return 0.7
      case 'documentation': return 0.8
      default: return 1.0
    }
  }

  private computeRenderCost(overall: number, gpuScore: number, resScore: number, context?: RenderContext | null): number {
    const priorityFloor = context?.priority === 'quality' ? 0.1 : 0
    return Math.max(priorityFloor, 1 - (overall * 0.5 + gpuScore * 0.3 + resScore * 0.2) * 0.5)
  }

  private determineDecodePreference(device: DeviceReport | null, profile: string, context?: RenderContext | null): 'hardware' | 'software' | 'auto' {
    if (context?.priority === 'performance' && !device?.mediaCapabilities.hardwareAccelerated) return 'software'
    if (device?.mediaCapabilities.hardwareAccelerated) return 'hardware'
    if (profile === 'low' || profile === 'minimal') return 'software'
    return 'auto'
  }

  private determinePreloadStrategy(profile: string, bwScore: number, context?: RenderContext | null): 'none' | 'metadata' | 'auto' {
    if (context?.priority === 'performance' || context?.accessibility?.reducedData) return 'none'
    if (profile === 'minimal' || bwScore < 0.3) return 'none'
    if (profile === 'low' || bwScore < 0.5) return 'metadata'
    return 'auto'
  }

  private scoreGPU(device: DeviceReport | null): number {
    if (!device) return 0.5
    const scores = { ultra: 1.0, high: 0.8, medium: 0.5, low: 0.2, unknown: 0.4 }
    return scores[device.gpu.tier] || 0.4
  }

  private gpuReason(device: DeviceReport | null): string {
    return device?.gpu.renderer ? `${device.gpu.renderer} (${device.gpu.tier})` : 'No GPU info'
  }

  private scoreCPU(device: DeviceReport | null): number {
    if (!device) return 0.5
    const c = device.cpu.cores
    if (c >= 12 && device.cpu.tier === 'ultra') return 1.0
    if (c >= 8) return 0.85
    if (c >= 6) return 0.7
    if (c >= 4) return 0.5
    return 0.3
  }

  private scoreMemory(device: DeviceReport | null): number {
    if (!device) return 0.5
    const gb = device.memory.deviceMemory
    if (gb >= 16) return 1.0
    if (gb >= 8) return 0.8
    if (gb >= 4) return 0.5
    return 0.25
  }

  private scoreBandwidth(device: DeviceReport | null): number {
    if (!device) return 0.5
    const bw = device.network.effectiveBandwidth
    if (bw === null) return 0.5
    if (bw >= 25) return 1.0
    if (bw >= 10) return 0.8
    if (bw >= 5) return 0.6
    if (bw >= 2) return 0.4
    return 0.2
  }

  private bandwidthReason(device: DeviceReport | null): string {
    const bw = device?.network.effectiveBandwidth
    return bw !== null ? `${bw}Mbps (${device?.network.connectionType || 'unknown'})` : 'Unknown'
  }

  private scoreResolution(asset: AssetReport | null): number {
    if (!asset) return 0.5
    const mp = (asset.resolution.width * asset.resolution.height) / 1000000
    if (mp > 8) return 0.3
    if (mp > 2) return 0.6
    return 1.0
  }

  private resolutionReason(asset: AssetReport | null): string {
    return asset ? `${asset.resolution.width}x${asset.resolution.height}` : 'Unknown'
  }

  private scoreBattery(device: DeviceReport | null): number {
    if (!device) return 0.5
    if (device.power.batteryCharging) return 1.0
    if (device.power.batteryLevel === null) return 0.6
    if (device.power.batteryLevel > 0.5) return 0.8
    if (device.power.batteryLevel > 0.2) return 0.5
    return 0.2
  }

  private batteryReason(device: DeviceReport | null): string {
    if (!device) return 'Unknown'
    const lvl = device.power.batteryLevel !== null ? `${Math.round(device.power.batteryLevel * 100)}%` : 'Unknown'
    return `${lvl}${device.power.batteryCharging ? ' (charging)' : ''}`
  }

  private scorePerformance(perf: PerformanceReport): number {
    if (perf.jankScore > 0.3) return 0.3
    if (perf.jankScore > 0.15) return 0.5
    if (perf.fps < 24) return 0.3
    if (perf.fps < 30) return 0.6
    if (perf.isDegraded) return 0.4
    return 1.0
  }

  private performanceReason(perf: PerformanceReport): string {
    return `FPS=${perf.fps}, jank=${perf.jankScore.toFixed(2)}, dropped=${perf.droppedFrames}/${perf.totalFrames}`
  }

  private computeOverall(scores: { aspect: string; score: number; weight: number }[]): number {
    let total = 0, weightSum = 0
    for (const s of scores) { total += s.score * s.weight; weightSum += s.weight }
    return weightSum > 0 ? total / weightSum : 0.5
  }
}

export const qualityStrategy = new QualityStrategy()
