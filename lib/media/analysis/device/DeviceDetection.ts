export type DeviceTier = 'low' | 'medium' | 'high' | 'ultra'
export type DevicePlatform = 'mobile' | 'tablet' | 'desktop' | 'foldable'

export interface DeviceInfo {
  tier: DeviceTier
  platform: DevicePlatform
  dpr: number
  cores: number
  memoryGB: number
  screenWidth: number
  screenHeight: number
  connectionType?: string
  effectiveBandwidth?: number
  supportsWebGL: boolean
  isTouchDevice: boolean
}

let cached: DeviceInfo | null = null

function detectPlatform(width: number): DevicePlatform {
  if (width < 768) {
    // Check for foldable by looking at screen size vs viewport
    if (typeof window !== 'undefined') {
      const screenW = window.screen.width
      const screenRatio = screenW / width
      // Foldables typically have ~2:1 screen-to-viewport ratio when folded
      if (screenRatio > 1.8 && screenW > 600) return 'foldable'
    }
    return 'mobile'
  }
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export function getDeviceInfo(): DeviceInfo {
  if (cached) return cached
  if (typeof window === 'undefined') {
    cached = {
      tier: 'high', platform: 'desktop', dpr: 1, cores: 4, memoryGB: 4,
      screenWidth: 1920, screenHeight: 1080, supportsWebGL: false, isTouchDevice: false,
    }
    return cached
  }
  const dpr = window.devicePixelRatio || 1
  const screenW = window.screen.width * dpr
  const screenH = window.screen.height * dpr
  const cores = navigator.hardwareConcurrency || 4
  const memoryGB = (navigator as any).deviceMemory || 4
  const width = window.innerWidth
  const platform = detectPlatform(width)

  const connection = (navigator as any).connection
  const connectionType = connection?.effectiveType
  const effectiveBandwidth = connection?.downlink

  const canvas = document.createElement('canvas')
  const supportsWebGL = !!canvas.getContext('webgl') || !!canvas.getContext('webgl2')
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  let tier: DeviceTier = 'high'
  if ((platform === 'mobile' || platform === 'foldable') && (cores <= 2 || memoryGB <= 2)) tier = 'low'
  else if (platform === 'mobile' || platform === 'foldable') tier = 'medium'
  else if (platform === 'tablet') tier = 'medium'
  else if (screenW > 3840 || dpr >= 2.5) tier = 'ultra'
  else if (dpr >= 2 || cores >= 8) tier = 'ultra'

  cached = {
    tier, platform, dpr, cores, memoryGB,
    screenWidth: screenW, screenHeight: screenH,
    connectionType, effectiveBandwidth,
    supportsWebGL, isTouchDevice,
  }
  return cached
}

export function invalidateCache(): void {
  cached = null
}

export function isMobileDevice(): boolean {
  const info = getDeviceInfo()
  return info.platform === 'mobile'
}

export function isTabletDevice(): boolean {
  const info = getDeviceInfo()
  return info.platform === 'tablet'
}

export function isDesktopDevice(): boolean {
  const info = getDeviceInfo()
  return info.platform === 'desktop'
}

export function isFoldableDevice(): boolean {
  const info = getDeviceInfo()
  return info.platform === 'foldable'
}