export interface BrowserReport {
  name: string
  engine: string
  supportsVideoFrameCallback: boolean
  supportsIntersectionObserver: boolean
  supportsResizeObserver: boolean
  supportsPageVisibility: boolean
  supportsMediaCapabilities: boolean
  supportsWebCodecs: boolean
  supportsWebGPU: boolean
  supportsHardwareDecoding: boolean
  optimizedRenderPath: string
  renderPathHints: {
    useVideoFrameCallback: boolean
    useHardwareDecode: boolean
    preferFilters: boolean
    preferTransforms: boolean
    useWillChange: boolean
    throttleRaf: boolean
  }
}
