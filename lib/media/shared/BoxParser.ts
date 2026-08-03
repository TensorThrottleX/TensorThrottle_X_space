export interface Box {
  type: string
  start: number
  size: number
}

export function walkBoxes(dv: DataView, start: number, length: number): Box[] {
  const boxes: Box[] = []
  let pos = start
  const end = Math.min(start + length, dv.byteLength)
  while (pos + 8 <= end) {
    const size = dv.getUint32(pos)
    if (size < 8 || pos + size > end) break
    const type = String.fromCharCode(
      dv.getUint8(pos + 4), dv.getUint8(pos + 5),
      dv.getUint8(pos + 6), dv.getUint8(pos + 7),
    )
    boxes.push({ type, start: pos, size })
    pos += size
  }
  return boxes
}

export function findBox(dv: DataView, start: number, length: number, targetType: string): Box | undefined {
  return walkBoxes(dv, start, length).find(b => b.type === targetType)
}

export function readFixedPoint1616(dv: DataView, offset: number): number {
  return dv.getInt32(offset) / 0x00010000
}

export function readMatrixRotation(dv: DataView, boxStart: number, boxSize: number): 0 | 90 | 180 | 270 {
  const version = dv.getUint8(boxStart + 8)
  const matrixOff = version === 1 ? 68 : 40
  const matrixStart = boxStart + 8 + matrixOff

  if (matrixStart + 36 > boxStart + boxSize) return 0

  const b = dv.getInt32(matrixStart + 4)
  const c = dv.getInt32(matrixStart + 12)

  const ONE = 0x00010000
  const MINUS_ONE = 0xFFFF0000

  if (b === ONE && c === MINUS_ONE) return 90
  if (b === MINUS_ONE && c === ONE) return 270

  const a = dv.getInt32(matrixStart)
  const d = dv.getInt32(matrixStart + 16)
  if (a === MINUS_ONE && b === 0 && c === 0 && d === MINUS_ONE) return 180

  return 0
}

export function readTrackDimensions(dv: DataView, trak: Box): { width: number; height: number } | null {
  const inner = walkBoxes(dv, trak.start + 8, trak.size - 8)
  const tkhd = inner.find(b => b.type === 'tkhd')
  if (!tkhd) return null
  const version = dv.getUint8(tkhd.start + 8)
  const widthOff = version === 1 ? 88 : 76
  const heightOff = version === 1 ? 92 : 80
  if (tkhd.start + 8 + Math.max(widthOff, heightOff) + 4 > tkhd.start + tkhd.size) return null
  return {
    width: Math.round(readFixedPoint1616(dv, tkhd.start + 8 + widthOff)),
    height: Math.round(readFixedPoint1616(dv, tkhd.start + 8 + heightOff)),
  }
}

export function readMovieDuration(dv: DataView, moov: Box): number | null {
  const inner = walkBoxes(dv, moov.start + 8, moov.size - 8)
  const mvhd = inner.find(b => b.type === 'mvhd')
  if (!mvhd) return null
  const version = dv.getUint8(mvhd.start + 8)
  const timescale = version === 1
    ? dv.getUint32(mvhd.start + 28)
    : dv.getUint32(mvhd.start + 20)
  const durationRaw = version === 1
    ? dv.getUint32(mvhd.start + 36)
    : dv.getUint32(mvhd.start + 24)
  return timescale > 0 ? durationRaw / timescale : null
}

export function findTimescale(dv: DataView, moov: Box): number | null {
  const inner = walkBoxes(dv, moov.start + 8, moov.size - 8)
  const mvhd = inner.find(b => b.type === 'mvhd')
  if (!mvhd) return null
  const version = dv.getUint8(mvhd.start + 8)
  return version === 1 ? dv.getUint32(mvhd.start + 28) : dv.getUint32(mvhd.start + 20)
}

export function detectCodecFromBuffer(dv: DataView): string | null {
  const boxes = walkBoxes(dv, 0, dv.byteLength)
  const moov = boxes.find(b => b.type === 'moov')
  if (!moov) return null

  const moovInner = walkBoxes(dv, moov.start + 8, moov.size - 8)
  const trak = moovInner.find(b => b.type === 'trak')
  if (!trak) return null

  const trakInner = walkBoxes(dv, trak.start + 8, trak.size - 8)
  const mdia = trakInner.find(b => b.type === 'mdia')
  if (!mdia) return null

  const mdiaInner = walkBoxes(dv, mdia.start + 8, mdia.size - 8)
  const minf = mdiaInner.find(b => b.type === 'minf')
  if (!minf) return null

  const stblInner = walkBoxes(dv, minf.start + 8, minf.size - 8)
  const stsd = stblInner.find(b => b.type === 'stsd')
  if (!stsd) return null

  const entryCount = dv.getUint32(stsd.start + 12)
  if (entryCount === 0 || stsd.start + 16 > dv.byteLength - 4) return null

  return String.fromCharCode(
    dv.getUint8(stsd.start + 16), dv.getUint8(stsd.start + 17),
    dv.getUint8(stsd.start + 18), dv.getUint8(stsd.start + 19),
  )
}
