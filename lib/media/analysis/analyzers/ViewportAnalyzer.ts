import type { ViewportReport } from '../reports'

export class ViewportAnalyzer {
  private lastReport: ViewportReport | null = null

  analyze(): ViewportReport {
    if (typeof window === 'undefined') {
      return this.defaultReport()
    }

    const vw = window.innerWidth
    const vh = window.innerHeight
    const safeArea = this.getSafeAreaInsets()

    const report: ViewportReport = {
      visibleWidth: vw,
      visibleHeight: vh,
      aspectRatio: vw / vh,
      orientation: vw > vh ? 'landscape' : 'portrait',
      safeArea,
      effectiveWidth: vw - safeArea.left - safeArea.right,
      effectiveHeight: vh - safeArea.top - safeArea.bottom,
      isFullscreen: this.isFullscreen(),
      isSplitScreen: this.isSplitScreen(vw),
      isFoldable: this.isFoldable(),
      foldState: this.detectFoldState(),
      scrollPosition: { x: window.scrollX, y: window.scrollY },
      documentSize: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      },
    }

    this.lastReport = report
    return report
  }

  private getSafeAreaInsets(): ViewportReport['safeArea'] {
    const insets = { top: 0, bottom: 0, left: 0, right: 0 }

    if (typeof CSS !== 'undefined' && CSS.supports('top', 'env(safe-area-inset-top)')) {
      const test = document.createElement('div')
      test.style.cssText = 'position:fixed;top:env(safe-area-inset-top);left:env(safe-area-inset-left);right:env(safe-area-inset-right);bottom:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none'
      document.body.appendChild(test)
      const cs = getComputedStyle(test)
      insets.top = parseFloat(cs.top) || 0
      insets.right = parseFloat(cs.right) || 0
      insets.bottom = parseFloat(cs.bottom) || 0
      insets.left = parseFloat(cs.left) || 0
      document.body.removeChild(test)
    }

    return insets
  }

  private isFullscreen(): boolean {
    return !!(document as any).fullscreenElement || !!(document as any).webkitFullscreenElement
  }

  private isSplitScreen(vw: number): boolean {
    if (typeof window === 'undefined') return false
    return vw < window.screen.width * 0.6 && vw < window.screen.width - 200
  }

  private isFoldable(): boolean {
    if (typeof window === 'undefined') return false
    const ratio = window.screen.width / window.innerWidth
    return ratio > 1.5 && window.screen.width > 600
  }

  private detectFoldState(): 'folded' | 'unfolded' | 'unknown' | null {
    if (!this.isFoldable()) return null
    try {
      const ratio = window.screen.width / window.innerWidth
      if (ratio > 1.8) return 'folded'
      if (ratio > 1.2) return 'unfolded'
    } catch { /* silent */ }
    return 'unknown'
  }

  computeEffectiveDimensions(report: ViewportReport): { width: number; height: number } {
    return {
      width: report.effectiveWidth,
      height: report.effectiveHeight,
    }
  }

  computeAspectDifference(videoAspect: number, viewportAspect: number): number {
    return Math.abs(videoAspect - viewportAspect) / Math.max(videoAspect, viewportAspect)
  }

  private defaultReport(): ViewportReport {
    return {
      visibleWidth: 1920, visibleHeight: 1080, aspectRatio: 16 / 9,
      orientation: 'landscape',
      safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
      effectiveWidth: 1920, effectiveHeight: 1080,
      isFullscreen: false, isSplitScreen: false, isFoldable: false,
      foldState: null, scrollPosition: { x: 0, y: 0 },
      documentSize: { width: 1920, height: 1080 },
    }
  }

  getLastReport(): ViewportReport | null {
    return this.lastReport
  }
}

export const viewportAnalyzer = new ViewportAnalyzer()
