import type { AssetReport, ContentCategory, CropRegion } from '../reports'
import {
  walkBoxes, findTimescale, detectCodecFromBuffer,
  readMatrixRotation, readTrackDimensions, readMovieDuration,
} from '../../shared/BoxParser'
import {
  drawFrameToCanvas, computeEdgeEnergy, computeBrightnessDistribution,
  estimateBlockiness, detectLetterboxing, findDominantBlock,
} from '../../shared/CanvasUtils'

export class AssetAnalyzer {
  private cache = new Map<string, AssetReport>()

  async analyze(src: string): Promise<AssetReport> {
    const cached = this.cache.get(src)
    if (cached?.isAnalyzed) return cached

    const report: AssetReport = {
      src, resolution: { width: 0, height: 0 }, aspectRatio: 1,
      orientation: 'landscape', frameRate: null, codec: null,
      duration: null, colorSpace: null, isHDR: null, hasAlpha: null,
      rotationMetadata: 0, contentCategory: 'unknown',
      visualEntropy: null, motionIntensity: null,
      brightnessDistribution: null, contrast: null,
      hasLetterboxing: null, hasPillarboxing: null,
      compressionArtifacts: null, safeCropRegion: null,
      dominantSubjectArea: null, isAnalyzed: false, analysisError: null,
    }

    try {
      const buffer = await this.fetchRange(src, 0, 131072)
      if (buffer) {
        const dv = new DataView(buffer)
        const boxes = walkBoxes(dv, 0, buffer.byteLength)
        const moov = boxes.find(b => b.type === 'moov')
        const ftyp = boxes.find(b => b.type === 'ftyp')

        if (moov) {
          const duration = readMovieDuration(dv, moov)
          if (duration !== null) report.duration = duration

          const inner = walkBoxes(dv, moov.start + 8, moov.size - 8)
          const trak = inner.find(b => b.type === 'trak')
          if (trak) {
            const trakInner = walkBoxes(dv, trak.start + 8, trak.size - 8)
            const tkhd = trakInner.find(b => b.type === 'tkhd')
            if (tkhd) {
              report.rotationMetadata = readMatrixRotation(dv, tkhd.start, tkhd.size)
            }

            const dims = readTrackDimensions(dv, trak)
            if (dims && dims.width > 0 && dims.height > 0) {
              report.resolution = dims
              report.aspectRatio = dims.width / dims.height

              const ar = dims.width / dims.height
              if (ar > 1.8) report.orientation = 'ultrawide'
              else if (ar > 1.1) report.orientation = 'landscape'
              else if (ar < 0.9) report.orientation = 'portrait'
              else report.orientation = 'square'
            }
          }
        }

        report.codec = detectCodecFromBuffer(dv)
        report.frameRate = await this.extractFrameRateFromBuffer(src, dv)

        if (ftyp && ftyp.size >= 12) {
          const brand = String.fromCharCode(
            dv.getUint8(ftyp.start + 8), dv.getUint8(ftyp.start + 9),
            dv.getUint8(ftyp.start + 10), dv.getUint8(ftyp.start + 11),
          )
          if (brand === 'qt  ') report.hasAlpha = true
        }
      }

      report.contentCategory = this.classifyContent(report)
      report.isHDR = await this.detectHDR()

      if (report.resolution.width > 0 && report.resolution.height > 0) {
        report.safeCropRegion = this.computeSafeCropRegion(
          report.resolution.width, report.resolution.height, report.orientation,
        )
      }

      if (report.resolution.width > 0 && report.resolution.height > 0) {
        report.isAnalyzed = true
        this.cache.set(src, report)
      }
    } catch (err) {
      report.analysisError = err instanceof Error ? err.message : 'Unknown error'
    }

    return report
  }

  async analyzeCanvas(
    src: string, video: HTMLVideoElement,
  ): Promise<Partial<AssetReport> | null> {
    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null

    try {
      const w = video.videoWidth, h = video.videoHeight
      const frame = drawFrameToCanvas(video, 128)
      if (!frame) return null

      const edge = computeEdgeEnergy(frame.data, 128)
      const brightness = computeBrightnessDistribution(frame.data, 128)
      const blockiness = estimateBlockiness(frame.data, 128)
      const letterbox = detectLetterboxing(frame.data, 128)

      const visualEntropy = Math.min(1, edge.total / (128 * 128 * 3 * 255 * 4))
      const motionIntensity = visualEntropy < 0.1 ? 'very_low'
        : visualEntropy < 0.25 ? 'low'
        : visualEntropy > 0.8 ? 'very_high'
        : visualEntropy > 0.6 ? 'high'
        : 'medium'

      const compressionArtifacts = blockiness > 0.3 ? 'high'
        : blockiness > 0.15 ? 'medium'
        : blockiness > 0.05 ? 'low'
        : 'none'

      const dominant = findDominantBlock(frame.data, 128)

      const colorSpace = (video as any).colorGamut || null

      const update: Partial<AssetReport> = {
        visualEntropy, motionIntensity,
        brightnessDistribution: brightness,
        contrast: brightness.contrast,
        hasLetterboxing: letterbox.hasBars && letterbox.barType === 'letterbox',
        hasPillarboxing: letterbox.hasBars && letterbox.barType === 'pillarbox',
        compressionArtifacts, dominantSubjectArea: dominant,
        colorSpace,
      }

      const cached = this.cache.get(src)
      if (cached) Object.assign(cached, update)

      return update
    } catch {
      return null
    }
  }

  private async fetchRange(src: string, start: number, end: number): Promise<ArrayBuffer | null> {
    try {
      const resp = await fetch(src, { headers: { Range: `bytes=${start}-${end}` } })
      return resp.ok ? await resp.arrayBuffer() : null
    } catch { return null }
  }

  private async extractFrameRateFromBuffer(src: string, dv: DataView): Promise<number | null> {
    const boxes = walkBoxes(dv, 0, dv.byteLength)
    const moov = boxes.find(b => b.type === 'moov')
    if (!moov) return null
    const timescale = findTimescale(dv, moov)
    if (!timescale) return null

    const inner = walkBoxes(dv, moov.start + 8, moov.size - 8)
    const trak = inner.find(b => b.type === 'trak')
    if (!trak) return null

    const trakInner = walkBoxes(dv, trak.start + 8, trak.size - 8)
    const mdia = trakInner.find(b => b.type === 'mdia')
    if (!mdia) return null

    const mdiaInner = walkBoxes(dv, mdia.start + 8, mdia.size - 8)
    const stbl = mdiaInner.find(b => b.type === 'minf' || b.type === 'stbl')
    if (!stbl) return null

    const stblBoxes = walkBoxes(dv, stbl.start + 8, stbl.size - 8)
    const stts = stblBoxes.find(b => b.type === 'stts')
    if (!stts) return null

    const entryCount = dv.getUint32(stts.start + 12)
    if (entryCount === 0) return null

    let totalSamples = 0, totalDuration = 0
    for (let i = 0; i < Math.min(entryCount, 100); i++) {
      const sc = dv.getUint32(stts.start + 16 + i * 8)
      const sd = dv.getUint32(stts.start + 20 + i * 8)
      totalSamples += sc; totalDuration += sc * sd
    }
    if (totalDuration === 0) return null
    return Math.round((totalSamples * timescale) / totalDuration)
  }

  private classifyContent(profile: Pick<AssetReport, 'resolution' | 'aspectRatio' | 'frameRate' | 'visualEntropy'>): ContentCategory {
    if (profile.frameRate !== null) {
      if (profile.frameRate >= 50) return 'high_motion'
      if (profile.frameRate <= 18) return 'low_motion'
    }
    if (profile.resolution.width >= 3840 || profile.resolution.height >= 3840) return 'cinematic'
    if (profile.aspectRatio > 2.0) return 'cinematic'
    return 'unknown'
  }

  private async detectHDR(): Promise<boolean | null> {
    if (typeof window === 'undefined') return null
    try { return window.matchMedia('(color-gamut: p3)').matches || null }
    catch { return null }
  }

  private computeSafeCropRegion(w: number, h: number, orientation: string): CropRegion {
    const ar = w / h
    if (ar > 1.8) {
      const cw = h * 16 / 9
      return { x: ((w - cw) / 2) / w, y: 0, width: cw / w, height: 1 }
    }
    if (orientation === 'portrait') {
      const ch = w * 16 / 9
      return { x: 0, y: ((h - ch) / 2) / h, width: 1, height: ch / h }
    }
    return { x: 0, y: 0, width: 1, height: 1 }
  }

  getCached(src: string): AssetReport | undefined {
    return this.cache.get(src)
  }

  invalidate(src: string): void {
    this.cache.delete(src)
  }

  clearCache(): void {
    this.cache.clear()
  }
}

export const assetAnalyzer = new AssetAnalyzer()
