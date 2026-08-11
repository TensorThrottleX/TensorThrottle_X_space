'use client'
import React from 'react';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'

export type ScaleMode = 'cover' | 'contain' | 'centered-crop'
export type VideoOrientation = 'landscape' | 'portrait' | 'square' | 'ultrawide'
export type Confidence = 'high' | 'medium' | 'low'

export interface OrientationResult {
  rotation: 0 | 90 | 180 | 270
  displayW: number
  displayH: number
  aspectRatio: number
  orientation: VideoOrientation
  scaleMode: ScaleMode
  confidence: Confidence
  isAnalyzed: boolean
}

// ── Tier 0: File-level MP4/MOV rotation metadata parser ────────────────────
// Fetches the video file's initial bytes and parses the QuickTime atom tree
// to extract the display matrix from tkhd (or mvhd). This detects rotation
// metadata embedded in the file that the browser may or may not have applied
// to videoWidth/videoHeight.

async function parseFileRotation(src: string): Promise<{
  rotation: 0 | 90 | 180 | 270
  confidence: 'high' | 'low'
}> {
  try {
    const resp = await fetch(src, { headers: { Range: 'bytes=0-131072' } })
    if (!resp.ok) return { rotation: 0, confidence: 'low' }
    const buf = await resp.arrayBuffer()
    if (buf.byteLength < 16) return { rotation: 0, confidence: 'low' }
    const dv = new DataView(buf)

    // Find all container boxes: walk flat list
    const boxes: { type: string; start: number; size: number }[] = []
    let pos = 0
    while (pos + 8 <= buf.byteLength) {
      const size = dv.getUint32(pos)
      if (size < 8 || pos + size > buf.byteLength) break
      const type = String.fromCharCode(dv.getUint8(pos + 4), dv.getUint8(pos + 5), dv.getUint8(pos + 6), dv.getUint8(pos + 7))
      boxes.push({ type, start: pos, size })
      pos += size
    }

    // Look inside moov → trak → tkhd for the matrix
    const moov = boxes.find(b => b.type === 'moov')
    if (!moov) return { rotation: 0, confidence: 'low' }

    // Search inside moov for trak boxes, then inside each trak for tkhd
    const innerEnd = moov.start + moov.size
    let innerPos = moov.start + 8
    while (innerPos + 8 <= innerEnd && innerPos + 8 <= buf.byteLength) {
      const iSize = dv.getUint32(innerPos)
      if (iSize < 8 || innerPos + iSize > innerEnd || innerPos + iSize > buf.byteLength) break
      const iType = String.fromCharCode(dv.getUint8(innerPos + 4), dv.getUint8(innerPos + 5), dv.getUint8(innerPos + 6), dv.getUint8(innerPos + 7))
      if (iType === 'trak') {
        // Search inside trak for tkhd
        const trakEnd = innerPos + iSize
        let tPos = innerPos + 8
        while (tPos + 8 <= trakEnd && tPos + 8 <= buf.byteLength) {
          const tSize = dv.getUint32(tPos)
          if (tSize < 8 || tPos + tSize > trakEnd || tPos + tSize > buf.byteLength) break
          const tType = String.fromCharCode(dv.getUint8(tPos + 4), dv.getUint8(tPos + 5), dv.getUint8(tPos + 6), dv.getUint8(tPos + 7))
          if (tType === 'tkhd') {
            const rotation = readMatrixFromTkhd(dv, tPos, tSize)
            if (rotation !== 0) return { rotation, confidence: 'high' }
          }
          tPos += tSize
        }
      }
      innerPos += iSize
    }

    return { rotation: 0, confidence: 'low' }
  } catch {
    return { rotation: 0, confidence: 'low' }
  }
}

function readMatrixFromTkhd(dv: DataView, boxStart: number, boxSize: number): 0 | 90 | 180 | 270 {
  const version = dv.getUint8(boxStart + 8)

  // Matrix field offset within tkhd data:
  // Version 0: header = 4(ver/flags) + 4(ctime) + 4(mtime) + 4(id) + 4(rsv) + 4(duration) + 4(rsv) + 4(rsv) + 2(layer) + 2(agrp) + 2(vol) + 2(rsv) = 40
  // Version 1: header = 4 + 8 + 8 + 4 + 4 + 8 + 4 + 4 + 2 + 2 + 2 + 2 + 4 + 4 + 4 + 4 = 68
  const matrixOff = version === 1 ? 68 : 40
  const matrixStart = boxStart + 8 + matrixOff

  if (matrixStart + 36 > boxStart + boxSize) return 0

  // Matrix is 9 × 4-byte fixed-point numbers: [a, b, u, c, d, v, x, y, w]
  // a,d = 16.16, b,c = 16.16, u,v = 2.30, x,y = 16.16, w = 2.30
  // For rotation: a,b,c,d form a 2D rotation matrix
  // Identity: a=1, b=0, c=0, d=1
  //  90°:     a=0, b=1, c=-1, d=0
  // 180°:     a=-1, b=0, c=0, d=-1
  // 270°:     a=0, b=-1, c=1, d=0
  const b = dv.getInt32(matrixStart + 4)  // b
  const c = dv.getInt32(matrixStart + 12) // c

  // In 16.16 fixed-point: 1 = 0x00010000, -1 = 0xFFFF0000, 0 = 0x00000000
  const ONE = 0x00010000
  const MINUS_ONE = 0xFFFF0000

  if (b === ONE && c === MINUS_ONE) return 90
  if (b === MINUS_ONE && c === ONE) return 270

  // Check for 180°
  const a = dv.getInt32(matrixStart)      // a
  const d = dv.getInt32(matrixStart + 16) // d
  if (a === MINUS_ONE && b === 0 && c === 0 && d === MINUS_ONE) return 180

  return 0
}

// ── Tier 1: Synchronous – trust videoWidth/videoHeight as display dims ─────
function tier1Dimensions(v: HTMLVideoElement): {
  rotation: 0
  displayW: number
  displayH: number
} | null {
  const w = v.videoWidth
  const h = v.videoHeight
  if (!w || !h) return null
  return { rotation: 0, displayW: w, displayH: h }
}

// ── Tier 3: Canvas edge-energy fallback ────────────────────────────────────
function tier3CanvasEdge(v: HTMLVideoElement): 0 | 90 {
  const rawW = v.videoWidth
  const rawH = v.videoHeight
  if (!rawW || !rawH) return 0

  try {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 64
    const ctx = c.getContext('2d')
    if (!ctx) return 0

    ctx.drawImage(v, 0, 0, 64, 64)
    const d = ctx.getImageData(0, 0, 64, 64).data

    let hE = 0
    let vE = 0
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 63; x++) {
        const i = (y * 64 + x) * 4
        hE += Math.abs(d[i] - d[i + 4]) + Math.abs(d[i + 1] - d[i + 5]) + Math.abs(d[i + 2] - d[i + 6])
      }
    }
    for (let y = 0; y < 63; y++) {
      for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4
        vE += Math.abs(d[i] - d[(y + 1) * 64 * 4 + x * 4]) +
          Math.abs(d[i + 1] - d[(y + 1) * 64 * 4 + x * 4 + 1]) +
          Math.abs(d[i + 2] - d[(y + 1) * 64 * 4 + x * 4 + 2])
      }
    }

    // Require a significantly higher confidence before rotating (Priority 3)
    // The heuristic should only override metadata when the confidence is overwhelming.
    const confidenceThreshold = 1.5
    
    let contentLandscape = false
    const rawLandscape = rawW > rawH
    
    if (rawLandscape) {
      // If file says landscape, require overwhelming vertical edge energy (portrait content) to flip
      contentLandscape = !(vE > hE * confidenceThreshold)
    } else {
      // If file says portrait, require overwhelming horizontal edge energy (landscape content) to flip
      contentLandscape = hE > vE * confidenceThreshold
    }
    
    return contentLandscape !== rawLandscape ? 90 : 0
  } catch {
    return 0
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function classifyOrientation(w: number, h: number): VideoOrientation {
  const r = w / h
  if (r > 1.8) return 'ultrawide'
  if (r > 1.1) return 'landscape'
  if (r < 0.9) return 'portrait'
  return 'square'
}

function pickScaleMode(vw: number, vh: number, sw: number, sh: number): ScaleMode {
  const vr = vw / vh
  const sr = sw / sh
  const diff = Math.abs(vr - sr) / sr
  if (diff < 0.08) return 'cover'
  if (vr > sr * 1.25) return 'contain'
  if (sr > vr * 1.25) return 'centered-crop'
  return 'cover'
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useVideoOrientation(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  opts?: { flexContainer?: boolean },
) {
  const [result, setResult] = useState<OrientationResult>({
    rotation: 0, displayW: 0, displayH: 0,
    aspectRatio: 1, orientation: 'landscape', scaleMode: 'cover',
    confidence: 'low', isAnalyzed: false,
  })
  const [vp, setVp] = useState({ w: 0, h: 0 })
  const fileRotationRef = useRef<0 | 90 | 180 | 270>(0)

  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const build = useCallback((
    rotation: 0 | 90 | 180 | 270,
    displayW: number,
    displayH: number,
    confidence: Confidence,
  ): OrientationResult => {
    const rotated = rotation === 90 || rotation === 270
    const effW = rotated ? displayH : displayW
    const effH = rotated ? displayW : displayH
    const ar = effW / effH
    return {
      rotation, displayW, displayH, aspectRatio: ar,
      orientation: classifyOrientation(effW, effH),
      scaleMode: 'cover', // calculated dynamically in videoStyle
      confidence, isAnalyzed: true,
    }
  }, [])

  const runPipeline = useCallback(async (v: HTMLVideoElement, videoSrc: string) => {
    // Tier 0: file-level rotation metadata (runs in parallel)
    const fileRotPromise = parseFileRotation(videoSrc).then(res => {
      if (res.confidence === 'high') {
        fileRotationRef.current = res.rotation
      }
    }).catch(() => {})

    // Tier 1: immediate – trust videoWidth/videoHeight
    const t1 = tier1Dimensions(v)
    if (!t1) return

    let rotation: 0 | 90 | 180 | 270 = 0
    let confidence: Confidence = 'medium'
    let displayW = t1.displayW
    let displayH = t1.displayH

    // Wait for file parsing to complete
    await fileRotPromise

    const fileRotation = fileRotationRef.current
    if (fileRotation !== 0) {
      // The file says there's rotation metadata.
      // videoWidth/videoHeight are the display dimensions the browser reports.
      // If videoWidth/videoHeight already account for the rotation (e.g., a 90°
      // rotated file reports portrait dimensions), then no CSS rotation needed.
      // If they DON'T (raw dimensions), we need to apply CSS rotation.
      //
      // Compare: if videoWidth/videoHeight aspect ratio SWAPPED relative to the
      // file rotation, the browser already normalized. Otherwise, apply rotation.
      const rotated = fileRotation === 90 || fileRotation === 270
      const browserW = t1.displayW
      const browserH = t1.displayH
      const browserLandscape = browserW > browserH
      const rotatedLandscape = rotated ? browserH > browserW : browserLandscape
      // ^^ If the file is 90° rotated and browser reports landscape, the browser
      //    did NOT normalize → apply CSS rotation. If browser reports portrait,
      //    the browser already normalized → no CSS rotation needed.

      if (browserLandscape === rotatedLandscape) {
        // Browser did NOT normalize – apply file rotation
        rotation = fileRotation
        displayW = browserW
        displayH = browserH
        confidence = 'high'
      }
      // else: browser normalized, keep rotation=0 from Tier 1
    }

    let decisionSource = fileRotation !== 0 ? 'Metadata (File)' : 'Metadata (Browser)'
    let finalRotation = rotation
    let finalW = displayW
    let finalH = displayH
    let heuristicStatus = 'skipped'

    // Priority 1: Use reliable metadata. If videoHeight > videoWidth, the asset is portrait.
    // Do not execute heuristic rotation.
    if (rotation === 0 && displayH > displayW) {
      decisionSource = 'Metadata (Portrait)'
    } else if (rotation === 0) {
      // Priority 3: Only if orientation remains genuinely ambiguous, execute tier3CanvasEdge.
      try {
        // Wait a brief tick to ensure a frame is painted
        await new Promise(r => requestAnimationFrame(r))
        const t3r = tier3CanvasEdge(v)
        heuristicStatus = 'executed'
        if (t3r !== 0) {
          finalRotation = t3r
          finalW = v.videoHeight
          finalH = v.videoWidth
          confidence = 'medium'
          decisionSource = 'Canvas Heuristic'
          setResult(build(finalRotation, finalW, finalH, confidence))
        } else {
          heuristicStatus = 'executed (no rotation)'
        }
      } catch {
        heuristicStatus = 'failed'
      }
    }

    // Apply the final derived configuration
    setResult(build(finalRotation, finalW, finalH, confidence))


  }, [build])

  const reanalyze = useCallback(() => {
    fileRotationRef.current = 0
    setResult(prev => ({ ...prev, isAnalyzed: false }))
    const v = videoRef.current
    if (!v || !v.src) return

    const src = v.src
    const handler = () => {
      runPipeline(v, src)
      v.removeEventListener('loadedmetadata', handler)
    }

    if (v.readyState >= HTMLMediaElement.HAVE_METADATA) {
      handler()
    } else {
      v.addEventListener('loadedmetadata', handler, { once: true })
    }
  }, [videoRef, runPipeline])

  const videoStyle = useMemo((): Record<string, any> => {
    if (!result.isAnalyzed || !result.displayW || !result.displayH) {
      return { width: '100%', height: '100%', objectFit: 'cover', opacity: 0 }
    }

    const r = result.rotation
    const rotated = r === 90 || r === 270
    const fc = opts?.flexContainer
    
    const effW = rotated ? result.displayH : result.displayW
    const effH = rotated ? result.displayW : result.displayH
    const dynamicScaleMode = vp.w && vp.h ? pickScaleMode(effW, effH, vp.w, vp.h) : 'cover'

    const base: Record<string, any> = {
      opacity: 1,
      willChange: 'transform',
    }

    // Map custom scale modes to valid CSS objectFit values
    const validObjectFit = dynamicScaleMode === 'centered-crop' ? 'contain' : dynamicScaleMode
    base.objectFit = validObjectFit

    if (!rotated) {
      base.width = '100%'
      base.height = '100%'
      if (r === 180) base.transform = 'rotate(180deg)'
      return base
    }

    base.flexShrink = 0

    if (fc) {
      base.width = vp.h
      base.height = vp.w
      base.transform = `rotate(${r}deg)`
    } else {
      base.position = 'absolute'
      base.top = '50%'
      base.left = '50%'
      base.width = vp.h
      base.height = vp.w
      base.transform = `translate(-50%, -50%) rotate(${r}deg)`
    }

    return base
  }, [result, vp, opts?.flexContainer])

  return {
    orientation: result,
    videoStyle,
    reanalyze,
    isAnalyzed: result.isAnalyzed
  }
}
