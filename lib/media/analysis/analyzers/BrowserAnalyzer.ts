import type { BrowserReport, DeviceReport } from '../reports'

export class BrowserAnalyzer {
  analyze(device: DeviceReport | null): BrowserReport {
    const name = device?.browser.name || 'unknown'
    const engine = device?.browser.engine || 'unknown'
    const hasVFC = this.checkVideoFrameCallback()
    const hasIO = typeof IntersectionObserver !== 'undefined'
    const hasRO = typeof ResizeObserver !== 'undefined'
    const hasPV = typeof document !== 'undefined' && 'visibilityState' in document
    const hasMC = !!(navigator as any).mediaCapabilities
    const hasWC = !!(navigator as any).webCodecs
    const hasWG = !!device?.supportsWebGPU
    const hasHW = device?.mediaCapabilities.hardwareAccelerated || false

    const renderPath = this.selectRenderPath(name, engine, hasVFC, hasHW)

    return {
      name, engine,
      supportsVideoFrameCallback: hasVFC,
      supportsIntersectionObserver: hasIO,
      supportsResizeObserver: hasRO,
      supportsPageVisibility: hasPV,
      supportsMediaCapabilities: hasMC,
      supportsWebCodecs: hasWC,
      supportsWebGPU: hasWG,
      supportsHardwareDecoding: hasHW,
      optimizedRenderPath: renderPath,
      renderPathHints: this.getRenderPathHints(renderPath),
    }
  }

  private checkVideoFrameCallback(): boolean {
    try {
      return typeof HTMLVideoElement !== 'undefined'
        && 'requestVideoFrameCallback' in HTMLVideoElement.prototype
    } catch { return false }
  }

  private selectRenderPath(
    browser: string, engine: string,
    hasVFC: boolean, hasHW: boolean,
  ): string {
    const engineMap: Record<string, string> = {
      blink: 'blink_optimized', webkit: 'webkit_optimized', gecko: 'gecko_optimized',
    }
    const base = engineMap[engine] || 'standard'
    if (hasVFC && hasHW) return `${base}_hw`
    if (hasVFC) return `${base}_vfc`
    return base
  }

  private getRenderPathHints(path: string): BrowserReport['renderPathHints'] {
    if (path.includes('blink')) {
      return {
        useVideoFrameCallback: true, useHardwareDecode: true,
        preferFilters: true, preferTransforms: true,
        useWillChange: true, throttleRaf: false,
      }
    }
    if (path.includes('webkit')) {
      return {
        useVideoFrameCallback: true, useHardwareDecode: true,
        preferFilters: false, preferTransforms: true,
        useWillChange: true, throttleRaf: false,
      }
    }
    if (path.includes('gecko')) {
      return {
        useVideoFrameCallback: false, useHardwareDecode: true,
        preferFilters: true, preferTransforms: true,
        useWillChange: true, throttleRaf: false,
      }
    }
    return {
      useVideoFrameCallback: false, useHardwareDecode: false,
      preferFilters: true, preferTransforms: true,
      useWillChange: true, throttleRaf: true,
    }
  }
}

export const browserAnalyzer = new BrowserAnalyzer()
