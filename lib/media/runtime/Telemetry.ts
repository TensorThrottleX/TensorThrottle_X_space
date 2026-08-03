import type { AssetReport, DeviceReport, ViewportReport, BrowserReport, PerformanceReport, ContentReport } from '../analysis/reports'
import type { RenderStrategy } from '../strategy/RenderStrategy'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Telemetry — Layer 3 Runtime
//
// Collects all reports + current strategy into a unified snapshot.
// No UI. Pure data aggregation.
// Consumed by TelemetryPanel for developer diagnostics.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TelemetrySnapshot {
  timestamp: number
  src: string
  assetReport: AssetReport | null
  deviceReport: DeviceReport | null
  viewportReport: ViewportReport | null
  browserReport: BrowserReport | null
  performanceReport: PerformanceReport | null
  contentReport: ContentReport | null
  currentStrategy: RenderStrategy | null
  strategyHistory: RenderStrategy[]
  sessionDuration: number
  recomputeCount: number
  totalFramesRendered: number
  totalDroppedFrames: number
  averageFps: number
  isLive: boolean
}

export type TelemetryListener = (snapshot: TelemetrySnapshot) => void

export class Telemetry {
  private sessionStart: number = Date.now()
  private recomputeCount: number = 0
  private strategyHistory: RenderStrategy[] = []
  private totalFrames: number = 0
  private totalDropped: number = 0
  private fpsSamples: number[] = []
  private listeners: TelemetryListener[] = []

  // Current state
  private _src: string = ''
  private _asset: AssetReport | null = null
  private _device: DeviceReport | null = null
  private _viewport: ViewportReport | null = null
  private _browser: BrowserReport | null = null
  private _performance: PerformanceReport | null = null
  private _content: ContentReport | null = null
  private _strategy: RenderStrategy | null = null

  recordSrc(src: string): void {
    this._src = src
  }

  recordAsset(report: AssetReport): void {
    this._asset = report
  }

  recordDevice(report: DeviceReport): void {
    this._device = report
  }

  recordViewport(report: ViewportReport): void {
    this._viewport = report
  }

  recordBrowser(report: BrowserReport): void {
    this._browser = report
  }

  recordPerformance(report: PerformanceReport): void {
    this._performance = report
    this.totalFrames += report.totalFrames
    this.totalDropped += report.droppedFrames
    this.fpsSamples.push(report.fps)
    if (this.fpsSamples.length > 100) this.fpsSamples.shift()
  }

  recordContent(report: ContentReport): void {
    this._content = report
  }

  recordStrategy(strategy: RenderStrategy): void {
    this._strategy = strategy
    this.strategyHistory.push(strategy)
    if (this.strategyHistory.length > 50) this.strategyHistory.shift()
    this.recomputeCount++
  }

  getSnapshot(): TelemetrySnapshot {
    const avgFps = this.fpsSamples.length > 0
      ? this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length
      : 0

    return {
      timestamp: Date.now(),
      src: this._src,
      assetReport: this._asset,
      deviceReport: this._device,
      viewportReport: this._viewport,
      browserReport: this._browser,
      performanceReport: this._performance,
      contentReport: this._content,
      currentStrategy: this._strategy,
      strategyHistory: [...this.strategyHistory],
      sessionDuration: Date.now() - this.sessionStart,
      recomputeCount: this.recomputeCount,
      totalFramesRendered: this.totalFrames,
      totalDroppedFrames: this.totalDropped,
      averageFps: Math.round(avgFps * 10) / 10,
      isLive: true,
    }
  }

  onSnapshot(listener: TelemetryListener): () => void {
    this.listeners.push(listener)
    return () => { this.listeners = this.listeners.filter(l => l !== listener) }
  }

  emit(): void {
    const snapshot = this.getSnapshot()
    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }

  reset(src: string): void {
    this._src = src
    this._asset = null
    this._content = null
    this._strategy = null
    this.strategyHistory = []
    this.recomputeCount = 0
    this.totalFrames = 0
    this.totalDropped = 0
    this.fpsSamples = []
  }

  clearHistory(): void {
    this.strategyHistory = []
    this.recomputeCount = 0
  }
}

export const telemetry = new Telemetry()
