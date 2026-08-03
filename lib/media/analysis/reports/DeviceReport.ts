export interface DeviceReport {
  cpu: { cores: number; tier: 'low' | 'medium' | 'high' | 'ultra' }
  gpu: {
    vendor: string | null; renderer: string | null
    tier: 'low' | 'medium' | 'high' | 'ultra' | 'unknown'
    supportsWebGL2: boolean; maxTextureSize: number | null
  }
  memory: { deviceMemory: number; jsHeapSize: number | null; jsHeapLimit: number | null }
  display: {
    screenWidth: number; screenHeight: number
    viewportWidth: number; viewportHeight: number
    dpr: number; refreshRate: number | null
    colorDepth: number | null
  }
  power: {
    batteryLevel: number | null; batteryCharging: boolean | null
    powerSaveMode: boolean; thermalState: 'nominal' | 'fair' | 'serious' | 'critical' | null
  }
  network: {
    connectionType: string | null; effectiveBandwidth: number | null
    rtt: number | null; isSlowConnection: boolean
  }
  input: { hasTouch: boolean; hasMouse: boolean; maxTouchPoints: number }
  form: 'mobile' | 'tablet' | 'desktop' | 'laptop' | 'foldable' | 'unknown'
  browser: { name: string; version: string; engine: 'blink' | 'webkit' | 'gecko' | 'unknown' }
  os: { name: string; platform: string }
  mediaCapabilities: {
    supportedCodecs: string[]; hardwareAccelerated: boolean | null
    supportsDecode: boolean | null
  }
  supportsWebGPU: boolean
  prefersReducedMotion: boolean
  prefersReducedData: boolean
  colorGamut: 'srgb' | 'p3' | 'rec2020' | null
  supportsHDR: boolean | null
  deviceTier: 'low' | 'medium' | 'high' | 'ultra'
  platform: 'mobile' | 'tablet' | 'desktop' | 'foldable'
}
