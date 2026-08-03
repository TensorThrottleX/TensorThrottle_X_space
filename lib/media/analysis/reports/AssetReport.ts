export type ContentCategory =
  | 'cinematic' | 'anime' | 'motion_graphics' | 'abstract'
  | 'loop' | 'live_action' | 'minimal' | 'high_motion' | 'low_motion' | 'unknown'

export interface CropRegion {
  x: number; y: number; width: number; height: number
}

export interface AssetReport {
  src: string
  resolution: { width: number; height: number }
  aspectRatio: number
  orientation: 'portrait' | 'landscape' | 'square' | 'ultrawide'
  frameRate: number | null
  codec: string | null
  duration: number | null
  colorSpace: string | null
  isHDR: boolean | null
  hasAlpha: boolean | null
  rotationMetadata: 0 | 90 | 180 | 270
  contentCategory: ContentCategory
  visualEntropy: number | null
  motionIntensity: 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | null
  brightnessDistribution: { average: number; dark: number; bright: number } | null
  contrast: number | null
  hasLetterboxing: boolean | null
  hasPillarboxing: boolean | null
  compressionArtifacts: 'none' | 'low' | 'medium' | 'high' | null
  safeCropRegion: CropRegion | null
  dominantSubjectArea: CropRegion | null
  isAnalyzed: boolean
  analysisError: string | null
}
