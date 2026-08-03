import type { DeviceReport } from '../reports'
import { getDeviceInfo } from '../device/DeviceDetection'

export class DeviceAnalyzer {
  private profile: DeviceReport | null = null

  async analyze(refresh?: boolean): Promise<DeviceReport> {
    if (this.profile && !refresh) return this.profile

    const existing = getDeviceInfo()
    const gpu = this.detectGPU()
    const browser = this.detectBrowser()
    const os = this.detectOS()

    const report: DeviceReport = {
      cpu: { cores: existing.cores ?? 4, tier: existing.tier as DeviceReport['cpu']['tier'] },
      gpu,
      memory: {
        deviceMemory: existing.memoryGB ?? 4,
        jsHeapSize: this.getJSHeap('jsHeapSize'),
        jsHeapLimit: this.getJSHeap('jsHeapSizeLimit'),
      },
      display: {
        screenWidth: existing.screenWidth,
        screenHeight: existing.screenHeight,
        viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1920,
        viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 1080,
        dpr: existing.dpr,
        refreshRate: null,
        colorDepth: typeof window !== 'undefined' ? window.screen.colorDepth || null : null,
      },
      power: await this.detectPower(),
      network: {
        connectionType: existing.connectionType || null,
        effectiveBandwidth: existing.effectiveBandwidth || null,
        rtt: this.getRTT(),
        isSlowConnection: this.isSlowConnection(existing),
      },
      input: {
        hasTouch: existing.isTouchDevice,
        hasMouse: this.hasMouse(),
        maxTouchPoints: navigator.maxTouchPoints || 0,
      },
      form: this.detectFormFactor(existing),
      browser,
      os,
      mediaCapabilities: await this.detectMediaCapabilities(),
      supportsWebGPU: await this.detectWebGPU(),
      prefersReducedMotion: this.prefersReducedMotion(),
      prefersReducedData: this.prefersReducedData(),
      colorGamut: this.detectColorGamut(),
      supportsHDR: this.detectHDR(),
      deviceTier: existing.tier,
      platform: existing.platform,
    }

    this.profile = report
    return report
  }

  private detectGPU(): DeviceReport['gpu'] {
    const info: DeviceReport['gpu'] = {
      vendor: null, renderer: null, tier: 'unknown',
      supportsWebGL2: false, maxTextureSize: null,
    }
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (!gl) return info
      info.supportsWebGL2 = !!canvas.getContext('webgl2')
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        info.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        info.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      }
      info.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
      const r = (info.renderer || '').toLowerCase()
      if (r.includes('geforce rtx') || r.includes('radeon rx')) info.tier = 'ultra'
      else if (r.includes('geforce') || r.includes('radeon') || r.includes('arc')) info.tier = 'high'
      else if (r.includes('intel') || r.includes('mali') || r.includes('adreno')) info.tier = 'medium'
      else info.tier = 'low'
    } catch { /* silent */ }
    return info
  }

  private async detectPower(): Promise<DeviceReport['power']> {
    const info: DeviceReport['power'] = {
      batteryLevel: null, batteryCharging: null,
      powerSaveMode: false, thermalState: null,
    }
    try {
      const battery = await (navigator as any).getBattery?.()
      if (battery) {
        info.batteryLevel = battery.level
        info.batteryCharging = battery.charging
      }
    } catch { /* silent */ }
    try { info.thermalState = (navigator as any).thermal?.thermalState || null } catch {}
    if (typeof window !== 'undefined') {
      info.powerSaveMode = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
    return info
  }

  private detectBrowser(): DeviceReport['browser'] {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    let name = 'unknown', engine: DeviceReport['browser']['engine'] = 'unknown'
    if (ua.includes('Edg/') || ua.includes('Edge/')) { name = 'edge'; engine = 'blink' }
    else if (ua.includes('Chrome/') && !ua.includes('Edg/')) { name = 'chrome'; engine = 'blink' }
    else if (ua.includes('Firefox/')) { name = 'firefox'; engine = 'gecko' }
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) { name = 'safari'; engine = 'webkit' }
    const patterns: Record<string, RegExp> = {
      chrome: /Chrome\/([\d.]+)/, edge: /Edg\/([\d.]+)/,
      firefox: /Firefox\/([\d.]+)/, safari: /Version\/([\d.]+)/,
    }
    const match = ua.match(patterns[name] || /[\w]+\/([\d.]+)/)
    return { name, version: match?.[1] || 'unknown', engine }
  }

  private detectOS(): DeviceReport['os'] {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const p = typeof navigator !== 'undefined' ? (navigator as any).platform || '' : ''
    if (/android/i.test(ua)) return { name: 'Android', platform: 'android' }
    if (/iphone|ipad|ipod/i.test(ua)) return { name: 'iOS', platform: 'ios' }
    if (/macintosh|mac os/i.test(ua)) return { name: 'macOS', platform: 'macos' }
    if (/win/i.test(ua)) return { name: 'Windows', platform: 'windows' }
    if (/linux/i.test(p) || /linux/i.test(ua)) return { name: 'Linux', platform: 'linux' }
    return { name: 'unknown', platform: 'unknown' }
  }

  private detectFormFactor(existing: any): DeviceReport['form'] {
    if (existing.platform === 'foldable') return 'foldable'
    if (existing.platform === 'mobile') return 'mobile'
    if (existing.platform === 'tablet') return 'tablet'
    return 'desktop'
  }

  private async detectMediaCapabilities(): Promise<DeviceReport['mediaCapabilities']> {
    const info: DeviceReport['mediaCapabilities'] = {
      supportedCodecs: [], hardwareAccelerated: null, supportsDecode: null,
    }
    try {
      const mc = (navigator as any).mediaCapabilities
      if (mc) {
        const configs = [
          { type: 'file', video: { contentType: 'video/mp4;codecs=avc1.64001e', width: 1920, height: 1080, bitrate: 5000000, framerate: 30 } },
          { type: 'file', video: { contentType: 'video/webm;codecs=vp9', width: 1920, height: 1080, bitrate: 5000000, framerate: 30 } },
          { type: 'file', video: { contentType: 'video/mp4;codecs=hev1.1.6.L150.B0', width: 1920, height: 1080, bitrate: 5000000, framerate: 30 } },
          { type: 'file', video: { contentType: 'video/webm;codecs=av01.0.05M.08', width: 1920, height: 1080, bitrate: 5000000, framerate: 30 } },
        ]
        for (const cfg of configs) {
          try {
            const result = await mc.decodingInfo(cfg)
            if (result.supported) {
              info.supportedCodecs.push(cfg.video.contentType)
              if (result.powerEfficient) info.hardwareAccelerated = true
            }
          } catch { /* silent */ }
        }
        info.supportsDecode = info.supportedCodecs.length > 0
      }
    } catch { /* silent */ }
    return info
  }

  private async detectWebGPU(): Promise<boolean> {
    try { return !!(navigator as any).gpu } catch { return false }
  }

  private getJSHeap(key: string): number | null {
    try { return ((performance as any).memory)?.[key] || null } catch { return null }
  }

  private getRTT(): number | null {
    try { return (navigator as any).connection?.rtt || null } catch { return null }
  }

  private isSlowConnection(existing: any): boolean {
    return ['2g', 'slow-2g'].includes(existing.connectionType || '')
  }

  private hasMouse(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  private prefersReducedData(): boolean {
    try { return window.matchMedia('(prefers-reduced-data: reduce)').matches } catch { return false }
  }

  private detectColorGamut(): DeviceReport['colorGamut'] {
    try {
      if (window.matchMedia('(color-gamut: rec2020)').matches) return 'rec2020'
      if (window.matchMedia('(color-gamut: p3)').matches) return 'p3'
      if (window.matchMedia('(color-gamut: srgb)').matches) return 'srgb'
    } catch { /* silent */ }
    return null
  }

  private detectHDR(): boolean | null {
    try { return window.matchMedia('(dynamic-range: high)').matches || null } catch { return null }
  }

  getProfile(): DeviceReport | null {
    return this.profile
  }

  invalidate(): void {
    this.profile = null
  }
}

export const deviceAnalyzer = new DeviceAnalyzer()
