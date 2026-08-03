import type { PerformanceReport } from '../analysis/reports'
import { performanceAnalyzer } from '../analysis/analyzers/PerformanceAnalyzer'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PerformanceMonitor — Layer 3 Runtime
//
// Observes the running video element.
// Tracks FPS, dropped frames, frame timing.
// Emits PerformanceReport on each sample interval.
// Never makes rendering decisions.
// Never touches React.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type PerformanceListener = (report: PerformanceReport) => void

export class PerformanceMonitor {
  private videoElement: HTMLVideoElement | null = null
  private frameTimestamps: number[] = []
  private frameCount = 0
  private droppedFrames = 0
  private lastFrameTime = 0
  private lastSampleTime = 0
  private isRunning = false
  private rafId: number | null = null
  private vfcId: number | null = null
  private longTaskCount = 0
  private useVFC: boolean = false
  private supportsVFC: boolean = false
  private listeners: PerformanceListener[] = []
  private sampleInterval: number = 1000

  constructor() {
    if (typeof HTMLVideoElement !== 'undefined') {
      this.supportsVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype
    }
  }

  attach(video: HTMLVideoElement): void {
    this.videoElement = video
  }

  detach(): void {
    this.stop()
    this.videoElement = null
  }

  setUseVideoFrameCallback(use: boolean): void {
    this.useVFC = use && this.supportsVFC
  }

  setSampleInterval(ms: number): void {
    this.sampleInterval = ms
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.frameCount = 0
    this.droppedFrames = 0
    this.lastFrameTime = performance.now()
    this.lastSampleTime = performance.now()
    this.longTaskCount = 0
    this.setupLongTaskObserver()
    this.schedule()
  }

  stop(): void {
    this.isRunning = false
    this.cancelScheduled()
    this.disconnectLongTaskObserver()
  }

  onReport(listener: PerformanceListener): () => void {
    this.listeners.push(listener)
    return () => { this.listeners = this.listeners.filter(l => l !== listener) }
  }

  private schedule(): void {
    if (!this.isRunning) return
    if (this.useVFC && this.videoElement) {
      this.vfcId = this.videoElement.requestVideoFrameCallback((_now: number, metadata: any) => {
        this.processFrame(metadata.expectedDisplayTime || performance.now())
        this.schedule()
      })
    } else {
      this.rafId = requestAnimationFrame((time: number) => {
        this.processFrame(time)
        this.schedule()
      })
    }
  }

  private cancelScheduled(): void {
    if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null }
    if (this.vfcId !== null && this.videoElement) {
      try { this.videoElement.cancelVideoFrameCallback(this.vfcId) } catch { /* ignore */ }
      this.vfcId = null
    }
  }

  private processFrame(time: number): void {
    const now = performance.now()
    if (this.lastFrameTime > 0) {
      const delta = now - this.lastFrameTime
      const target = 1000 / 60
      if (delta > target * 1.5) {
        this.droppedFrames += Math.round(delta / target) - 1
      }
    }
    this.lastFrameTime = now
    this.frameCount++

    if (now - this.lastSampleTime >= this.sampleInterval) {
      this.emit()
      this.lastSampleTime = now
      this.frameCount = 0
      this.droppedFrames = 0
      this.longTaskCount = 0
    }
  }

  private setupLongTaskObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) this.longTaskCount++
        }
      })
      observer.observe({ entryTypes: ['longtask'] });
      (this as any).__longTaskObserver = observer
    } catch { /* not supported */ }
  }

  private disconnectLongTaskObserver(): void {
    try { (this as any).__longTaskObserver?.disconnect() } catch { /* ignore */ }
  }

  private emit(): void {
    if (this.frameCount === 0) return
    const elapsed = performance.now() - this.lastSampleTime

    const report = performanceAnalyzer.analyze({
      fps: this.frameCount / (elapsed / 1000),
      droppedFrames: this.droppedFrames,
      totalFrames: this.frameCount,
      frameLatency: elapsed / this.frameCount,
      longTasks: this.longTaskCount,
    })

    for (const listener of this.listeners) {
      listener(report)
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
