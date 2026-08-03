export function drawFrameToCanvas(
  video: HTMLVideoElement,
  size: number = 128,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; data: Uint8ClampedArray } | null {
  try {
    const c = document.createElement('canvas')
    c.width = size
    c.height = size
    const ctx = c.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, size, size)
    const imageData = ctx.getImageData(0, 0, size, size)
    return { canvas: c, ctx, data: imageData.data }
  } catch {
    return null
  }
}

export function computeEdgeEnergy(
  d: Uint8ClampedArray,
  size: number,
): { horizontal: number; vertical: number; total: number } {
  let hE = 0, vE = 0
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      if (x < size - 1) {
        const j = i + 4
        hE += Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2])
      }
      if (y < size - 1) {
        const j = i + size * 4
        vE += Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2])
      }
    }
  }
  return { horizontal: hE, vertical: vE, total: hE + vE }
}

export function computeBrightnessDistribution(
  d: Uint8ClampedArray,
  size: number,
): { average: number; dark: number; bright: number; contrast: number } {
  let total = 0, dark = 0, bright = 0
  const count = size * size
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255
    total += lum
    if (lum < 0.2) dark++
    if (lum > 0.8) bright++
  }
  const avg = total / count
  return {
    average: avg,
    dark: dark / count,
    bright: bright / count,
    contrast: Math.abs(bright / count - dark / count),
  }
}

export function estimateBlockiness(d: Uint8ClampedArray, size: number): number {
  let blockDiff = 0, count = 0
  for (let y = 0; y < size - 8; y += 8) {
    for (let x = 0; x < size - 8; x += 8) {
      const edge = (y * size + x) * 4
      const across = (y * size + x + 8) * 4
      if (edge + 3 < d.length && across + 3 < d.length) {
        blockDiff += Math.abs(d[edge] - d[across]) +
          Math.abs(d[edge + 1] - d[across + 1]) +
          Math.abs(d[edge + 2] - d[across + 2])
        count++
      }
    }
  }
  return count > 0 ? blockDiff / count / 255 : 0
}

export function detectLetterboxing(
  d: Uint8ClampedArray,
  size: number,
): { hasBars: boolean; barType: 'letterbox' | 'pillarbox' | 'none'; barSize: number } {
  const isBar = (idx: number): boolean => {
    const r = d[idx * 4], g = d[idx * 4 + 1], b = d[idx * 4 + 2]
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255 < 0.08
  }

  let topCount = 0, bottomCount = 0, leftCount = 0, rightCount = 0
  for (let x = 0; x < size; x++) {
    topCount += isBar(x) ? 1 : 0
    bottomCount += isBar((size - 1) * size + x) ? 1 : 0
  }
  for (let y = 0; y < size; y++) {
    leftCount += isBar(y * size) ? 1 : 0
    rightCount += isBar(y * size + (size - 1)) ? 1 : 0
  }
  topCount /= size; bottomCount /= size; leftCount /= size; rightCount /= size

  const tbRatio = (topCount + bottomCount) / 2
  const lrRatio = (leftCount + rightCount) / 2

  if (tbRatio > 0.6 && tbRatio > lrRatio) return { hasBars: true, barType: 'letterbox', barSize: tbRatio }
  if (lrRatio > 0.6) return { hasBars: true, barType: 'pillarbox', barSize: lrRatio }
  return { hasBars: false, barType: 'none', barSize: 0 }
}

export function findDominantBlock(
  d: Uint8ClampedArray,
  size: number,
  blockSize: number = 16,
): { x: number; y: number; width: number; height: number } | null {
  const cols = Math.floor(size / blockSize)
  const rows = Math.floor(size / blockSize)
  let maxEnergy = 0
  let bestCol = Math.floor(cols / 2), bestRow = Math.floor(rows / 2)

  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < cols; bx++) {
      let energy = 0
      for (let py = 0; py < blockSize; py++) {
        for (let px = 0; px < blockSize; px++) {
          const i = ((by * blockSize + py) * size + (bx * blockSize + px)) * 4
          if (i + 3 < d.length) {
            energy += Math.abs(d[i] - d[i + 4]) +
              Math.abs(d[i + 1] - d[i + 5]) +
              Math.abs(d[i + 2] - d[i + 6])
          }
        }
      }
      if (energy > maxEnergy) {
        maxEnergy = energy
        bestCol = bx; bestRow = by
      }
    }
  }

  const cx = Math.floor(cols / 2), cy = Math.floor(rows / 2)
  const dist = Math.sqrt((bestCol - cx) ** 2 + (bestRow - cy) ** 2)
  const maxDist = Math.sqrt(cx * cx + cy * cy)

  if (dist / maxDist > 0.6 && maxEnergy / (blockSize * blockSize * 3 * 255) < 0.05) {
    return null
  }

  return {
    x: (bestCol * blockSize) / size,
    y: (bestRow * blockSize) / size,
    width: (blockSize * 2) / size,
    height: (blockSize * 2) / size,
  }
}
