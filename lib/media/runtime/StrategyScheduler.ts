import type { PerformanceReport } from '../analysis/reports'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// StrategyScheduler — Layer 3 Runtime
//
// Observes the running system.
// Detects significant changes.
// Schedules RenderStrategy recomputation.
// Never performs rendering directly.
// ---------------------------------------------------------------------------
// Triggers:
//   • Viewport resize (debounced)
//   • Device orientation change
//   • Performance degradation
//   • src change
//   • Fullscreen toggle
//   • Reduced motion preference change
//   • Visibility change (page hidden/visible)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ScheduleReason =
  | 'viewport_change'
  | 'orientation_change'
  | 'performance_degraded'
  | 'performance_recovered'
  | 'src_changed'
  | 'fullscreen_change'
  | 'reduced_motion_change'
  | 'visibility_change'
  | 'manual'
  | 'initial'

export type RecomputeListener = (reason: ScheduleReason) => void

export class StrategyScheduler {
  private recomputeListeners: RecomputeListener[] = []
  private performanceListeners: Array<(report: PerformanceReport) => void> = []
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private lastPerformanceReport: PerformanceReport | null = null
  private isVisible: boolean = true

  // ── Viewport ──

  private handleResize = () => {
    this.debounce('resize', () => this.notify('viewport_change'), 150)
  }

  private handleOrientationChange = () => {
    setTimeout(() => this.notify('orientation_change'), 200)
  }

  // ── Fullscreen ──

  private handleFullscreenChange = () => {
    this.notify('fullscreen_change')
  }

  // ── Visibility ──

  private handleVisibilityChange = () => {
    const nowVisible = document.visibilityState === 'visible'
    if (nowVisible !== this.isVisible) {
      this.isVisible = nowVisible
      this.notify('visibility_change')
    }
  }

  // ── Reduced Motion ──

  private reducedMotionMql: MediaQueryList | null = null
  private handleReducedMotionChange = () => {
    this.notify('reduced_motion_change')
  }

  // ── Performance ──

  onPerformanceReport = (report: PerformanceReport) => {
    this.lastPerformanceReport = report
    if (report.isDegraded) {
      this.notify('performance_degraded')
    } else if (this.lastPerformanceReport?.isDegraded && !report.isDegraded) {
      this.notify('performance_recovered')
    }
    for (const listener of this.performanceListeners) {
      listener(report)
    }
  }

  // ── Lifecycle ──

  start(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('resize', this.handleResize)
    window.addEventListener('orientationchange', this.handleOrientationChange)
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)

    this.reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)')
    this.reducedMotionMql.addEventListener('change', this.handleReducedMotionChange)

    this.isVisible = document.visibilityState === 'visible'
  }

  stop(): void {
    if (typeof window === 'undefined') return

    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('orientationchange', this.handleOrientationChange)
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)

    this.reducedMotionMql?.removeEventListener('change', this.handleReducedMotionChange)

    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()
  }

  // ── Change Notification ──

  notify(reason: ScheduleReason): void {
    for (const listener of this.recomputeListeners) {
      listener(reason)
    }
  }

  onRecompute(listener: RecomputeListener): () => void {
    this.recomputeListeners.push(listener)
    return () => { this.recomputeListeners = this.recomputeListeners.filter(l => l !== listener) }
  }

  onPerformanceReportExternal(listener: (report: PerformanceReport) => void): () => void {
    this.performanceListeners.push(listener)
    return () => { this.performanceListeners = this.performanceListeners.filter(l => l !== listener) }
  }

  // ── Debounce ──

  private debounce(key: string, fn: () => void, ms: number): void {
    const existing = this.debounceTimers.get(key)
    if (existing) clearTimeout(existing)
    this.debounceTimers.set(key, setTimeout(() => {
      this.debounceTimers.delete(key)
      fn()
    }, ms))
  }

  onSrcChange(): void {
    this.notify('src_changed')
  }
}

export const strategyScheduler = new StrategyScheduler()
