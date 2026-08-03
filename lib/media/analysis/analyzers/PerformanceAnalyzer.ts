import type { PerformanceReport } from '../reports'

export class PerformanceAnalyzer {
  analyze(params: {
    fps: number
    droppedFrames: number
    totalFrames: number
    frameLatency: number | null
    longTasks: number
  }): PerformanceReport {
    const jankScore = params.totalFrames > 0
      ? params.droppedFrames / (params.totalFrames + params.droppedFrames)
      : 0

    return {
      fps: Math.round(params.fps * 10) / 10,
      droppedFrames: params.droppedFrames,
      totalFrames: params.totalFrames,
      frameLatency: params.frameLatency,
      memoryEstimate: this.estimateMemory(),
      cpuEstimate: this.estimateCPU(params.fps),
      longTasks: params.longTasks,
      jankScore,
      isDegraded: jankScore > 0.1 || params.fps < 24,
      timestamp: Date.now(),
    }
  }

  private estimateMemory(): number | null {
    try {
      const mem = (performance as any).memory
      return mem ? mem.usedJSHeapSize / (1024 * 1024) : null
    } catch { return null }
  }

  private estimateCPU(fps: number): number | null {
    if (fps < 20) return 0.9
    if (fps < 30) return 0.7
    if (fps < 50) return 0.5
    return 0.2
  }
}

export const performanceAnalyzer = new PerformanceAnalyzer()
