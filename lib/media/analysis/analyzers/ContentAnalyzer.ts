import type { ContentReport, CropRegion } from '../reports'
import { drawFrameToCanvas } from '../../shared/CanvasUtils'

export class ContentAnalyzer {
  private lastReport: ContentReport | null = null

  analyze(video: HTMLVideoElement): ContentReport {
    if (!video || video.readyState < 2) return this.empty()

    const w = video.videoWidth, h = video.videoHeight
    if (!w || !h) return this.empty()

    const frame = drawFrameToCanvas(video, 160)
    if (!frame) return this.empty()

    const d = frame.data, size = 160
    const report = this.analyzeRegions(d, size)
    this.lastReport = report
    return report
  }

  private analyzeRegions(d: Uint8ClampedArray, size: number): ContentReport {
    const blockSize = 16
    const cols = Math.floor(size / blockSize)
    const rows = Math.floor(size / blockSize)
    const blocks: { energy: number; brightness: number }[][] = []
    let maxEnergy = 0

    for (let by = 0; by < rows; by++) {
      blocks[by] = []
      for (let bx = 0; bx < cols; bx++) {
        let energy = 0, brightness = 0, count = 0
        for (let py = 0; py < blockSize; py++) {
          for (let px = 0; px < blockSize; px++) {
            const i = ((by * blockSize + py) * size + (bx * blockSize + px)) * 4
            if (i + 3 < d.length) {
              const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255
              brightness += lum; count++
              if (px < blockSize - 1 && i + 7 < d.length) {
                energy += Math.abs(d[i] - d[i + 4]) + Math.abs(d[i + 1] - d[i + 5]) + Math.abs(d[i + 2] - d[i + 6])
              }
            }
          }
        }
        const avgE = energy / (blockSize * blockSize)
        blocks[by][bx] = { energy: avgE, brightness: brightness / count }
        maxEnergy = Math.max(maxEnergy, avgE)
      }
    }

    const threshold = maxEnergy * 0.5
    const cx = cols / 2, cy = rows / 2

    const motionRegions: CropRegion[] = []
    const brightRegions: CropRegion[] = []
    const darkRegions: CropRegion[] = []
    const emptyRegions: CropRegion[] = []
    const important: CropRegion[] = []
    let primarySubject: CropRegion | null = null
    let maxScore = 0

    for (let by = 0; by < rows; by++) {
      for (let bx = 0; bx < cols; bx++) {
        const b = blocks[by][bx]
        const region: CropRegion = {
          x: (bx * blockSize) / size, y: (by * blockSize) / size,
          width: blockSize / size, height: blockSize / size,
        }
        const dist = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2)
        const centerBias = 1 - dist / Math.sqrt(cx * cx + cy * cy)

        if (b.energy > threshold) {
          const score = b.energy * (0.5 + centerBias * 0.5)
          if (score > maxScore) { maxScore = score; primarySubject = region }
          important.push(region)
          if (centerBias > 0.3) motionRegions.push(region)
        }
        if (b.brightness < 0.15) {
          darkRegions.push(region)
          if (centerBias < 0.3) emptyRegions.push(region)
        }
        if (b.brightness > 0.85) {
          brightRegions.push(region)
          if (centerBias < 0.3) emptyRegions.push(region)
        }
      }
    }

    const centerBias = this.computeCenterBias(blocks, rows, cols, cx, cy)

    return {
      primarySubject: this.clampRegion(primarySubject),
      motionRegions: this.mergeRegions(motionRegions),
      brightRegions: this.mergeRegions(brightRegions),
      darkRegions: this.mergeRegions(darkRegions),
      emptyRegions: this.mergeRegions(emptyRegions),
      importantComposition: this.mergeRegions(important),
      avoidRegions: this.mergeRegions(emptyRegions.length > darkRegions.length ? emptyRegions : darkRegions.concat(brightRegions)),
      preferRegions: important.length > 0 ? this.mergeRegions(important) : [{ x: 0.3, y: 0.3, width: 0.4, height: 0.4 }],
      centerBias,
      isAnalyzed: true,
    }
  }

  private computeCenterBias(
    blocks: { energy: number; brightness: number }[][],
    rows: number, cols: number, cx: number, cy: number,
  ): number {
    let weighted = 0, totalWeight = 0
    for (let by = 0; by < rows; by++) {
      for (let bx = 0; bx < cols; bx++) {
        const dist = Math.sqrt((bx - cx) ** 2 + (by - cy) ** 2)
        weighted += dist * blocks[by][bx].energy
        totalWeight += blocks[by][bx].energy
      }
    }
    const maxDist = Math.sqrt(cx * cx + cy * cy)
    const avgDist = totalWeight > 0 ? weighted / totalWeight : maxDist / 2
    return 1 - Math.min(1, avgDist / maxDist)
  }

  private mergeRegions(regions: CropRegion[]): CropRegion[] {
    if (regions.length === 0) return []
    const merged: CropRegion[] = []
    const used = new Set<number>()
    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue
      let r = { ...regions[i] }
      used.add(i)
      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue
        if (this.overlap(r, regions[j])) {
          r = this.union(r, regions[j]); used.add(j)
        }
      }
      if (r.width * r.height > 0.001) merged.push(r)
    }
    return merged
  }

  private overlap(a: CropRegion, b: CropRegion): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  }

  private union(a: CropRegion, b: CropRegion): CropRegion {
    return {
      x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
      width: Math.max(a.x + a.width, b.x + b.width) - Math.min(a.x, b.x),
      height: Math.max(a.y + a.height, b.y + b.height) - Math.min(a.y, b.y),
    }
  }

  private clampRegion(r: CropRegion | null): CropRegion | null {
    if (!r) return null
    return {
      x: Math.max(0, Math.min(1, r.x)), y: Math.max(0, Math.min(1, r.y)),
      width: Math.max(0, Math.min(1 - r.x, r.width)),
      height: Math.max(0, Math.min(1 - r.y, r.height)),
    }
  }

  private empty(): ContentReport {
    return {
      primarySubject: null, motionRegions: [], brightRegions: [],
      darkRegions: [], emptyRegions: [], importantComposition: [],
      avoidRegions: [], preferRegions: [],
      centerBias: 0, isAnalyzed: false,
    }
  }

  getLastReport(): ContentReport | null {
    return this.lastReport
  }
}

export const contentAnalyzer = new ContentAnalyzer()
