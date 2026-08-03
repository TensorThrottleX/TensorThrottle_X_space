import type { CropRegion } from './AssetReport'

export interface ContentReport {
  primarySubject: CropRegion | null
  motionRegions: CropRegion[]
  brightRegions: CropRegion[]
  darkRegions: CropRegion[]
  emptyRegions: CropRegion[]
  importantComposition: CropRegion[]
  avoidRegions: CropRegion[]
  preferRegions: CropRegion[]
  centerBias: number
  isAnalyzed: boolean
}
