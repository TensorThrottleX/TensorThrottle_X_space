export interface PerformanceReport {
  fps: number
  droppedFrames: number
  totalFrames: number
  frameLatency: number | null
  memoryEstimate: number | null
  cpuEstimate: number | null
  longTasks: number
  jankScore: number
  isDegraded: boolean
  timestamp: number
}
