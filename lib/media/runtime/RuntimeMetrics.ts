export interface RuntimeMetricSample {
  fps: number
  droppedFrames: number
  totalFrames: number
  frameLatency: number | null
  memoryEstimate: number | null
  cpuEstimate: number | null
  longTasks: number
  timestamp: number
}

export interface RuntimeMetricsSummary {
  averageFps: number
  minFps: number
  droppedPercent: number
  jankyFrames: number
  samples: number
  isHealthy: boolean
}

export function summarizeMetrics(samples: RuntimeMetricSample[]): RuntimeMetricsSummary {
  if (samples.length === 0) {
    return { averageFps: 0, minFps: 0, droppedPercent: 0, jankyFrames: 0, samples: 0, isHealthy: true }
  }

  let totalFps = 0, minFps = Infinity, totalJank = 0, totalDropped = 0, totalFrames = 0

  for (const s of samples) {
    totalFps += s.fps
    if (s.fps < minFps) minFps = s.fps
    if (s.fps < 24) totalJank++
    totalDropped += s.droppedFrames
    totalFrames += s.totalFrames
  }

  const avgFps = totalFps / samples.length
  const droppedPercent = totalFrames > 0 ? (totalDropped / totalFrames) * 100 : 0

  return {
    averageFps: Math.round(avgFps),
    minFps: Math.round(minFps),
    droppedPercent: Math.round(droppedPercent * 100) / 100,
    jankyFrames: totalJank,
    samples: samples.length,
    isHealthy: avgFps >= 30 && droppedPercent < 5,
  }
}
