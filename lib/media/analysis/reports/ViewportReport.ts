export interface ViewportReport {
  visibleWidth: number
  visibleHeight: number
  aspectRatio: number
  orientation: 'portrait' | 'landscape' | 'square'
  safeArea: { top: number; bottom: number; left: number; right: number }
  effectiveWidth: number
  effectiveHeight: number
  isFullscreen: boolean
  isSplitScreen: boolean
  isFoldable: boolean
  foldState: 'folded' | 'unfolded' | 'unknown' | null
  scrollPosition: { x: number; y: number }
  documentSize: { width: number; height: number }
}
