'use client'

import { useRef, useCallback, useEffect } from 'react'

/**
 * Atmosphere values derived from scroll progress.
 * Every visual transition on the page reads from this structure.
 */
export interface AtmosphereValues {
  // Background video environment
  blur: number           // 0 → 14 px
  brightness: number     // 100 → 45 %
  saturation: number     // 100 → 70 %
  contrast: number       // 100 → 92 %
  overlayOpacity: number // 0 → 0.55
  vignetteOpacity: number // 0 → 0.6

  // Carousel state
  carouselScale: number    // 1 → 0.9
  carouselOpacity: number  // 1 → 0.70
  carouselInteractive: boolean // true when exploration phase
  carouselGlowOpacity: number  // 1 → 0.3
  indicatorOpacity: number // 1 → 0 (quick fade out)

  // Reading panel state (Phase 2)
  readingOpacity: number     // 0 → 1
  readingTranslateY: number  // 80 → 0
  readingActive: boolean     // true when scroll > 0.4

  // Raw progress for consumers
  progress: number
}

/**
 * useEnvironmentTransition — Derives all atmosphere values from scroll progress.
 *
 * This is the single controller that every visual element in the Anime Universe
 * reads from. No animation logic is scattered in components — everything is
 * centralized here.
 *
 * Performance contract:
 *  - Writes to a single ref (zero React re-renders)
 *  - Applies values to a target DOM element via CSS custom properties
 *  - One rAF write per scroll frame
 *  - GPU-friendly: only transform, opacity, filter, backdrop-filter
 */
export function useEnvironmentTransition(
  targetRef: React.RefObject<HTMLElement | null>,
) {
  const valuesRef = useRef<AtmosphereValues>(computeAtmosphere(0))

  /**
   * Called on every scroll frame with the global progress (0→1).
   * Computes atmosphere values and writes CSS custom properties directly
   * to the target element — bypassing React's render cycle entirely.
   */
  const applyProgress = useCallback((progress: number) => {
    const values = computeAtmosphere(progress)
    valuesRef.current = values

    const el = targetRef.current
    if (!el) return

    const s = el.style

    // Environment layer
    s.setProperty('--env-blur', `${values.blur}px`)
    s.setProperty('--env-brightness', `${values.brightness}%`)
    s.setProperty('--env-saturation', `${values.saturation}%`)
    s.setProperty('--env-contrast', `${values.contrast}%`)
    s.setProperty('--env-overlay', `${values.overlayOpacity}`)
    s.setProperty('--env-vignette', `${values.vignetteOpacity}`)

    // Carousel
    s.setProperty('--carousel-scale', `${values.carouselScale}`)
    s.setProperty('--carousel-opacity', `${values.carouselOpacity}`)
    s.setProperty('--carousel-glow', `${values.carouselGlowOpacity}`)
    s.setProperty('--indicator-opacity', `${values.indicatorOpacity}`)

    // Reading panel
    s.setProperty('--reading-opacity', `${values.readingOpacity}`)
    s.setProperty('--reading-ty', `${values.readingTranslateY}px`)
  }, [targetRef])

  // Initialize on mount
  useEffect(() => {
    applyProgress(0)
  }, [applyProgress])

  return { valuesRef, applyProgress }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pure computation — no side effects, easily testable
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function computeAtmosphere(progress: number): AtmosphereValues {
  const p = Math.max(0, Math.min(progress, 1))

  // ── Background environment (Phase 1) ──
  // These ramp across the full 0→1 range
  const blur = lerp(0, 14, p)
  const brightness = lerp(100, 45, p)
  const saturation = lerp(100, 70, p)
  const contrast = lerp(100, 92, p)
  const overlayOpacity = lerp(0, 0.55, p)
  const vignetteOpacity = lerp(0, 0.6, p)

  // ── Carousel (Phase 1) ──
  // Carousel transitions happen in the first 70% of scroll
  const carouselP = Math.min(p / 0.7, 1)
  const carouselScale = lerp(1, 0.9, carouselP)
  const carouselOpacity = lerp(1, 0.70, carouselP)
  const carouselGlowOpacity = lerp(1, 0.3, carouselP)
  const carouselInteractive = p < 0.6
  
  // Indicator fades out quickly (in the first 25% of scroll)
  const indicatorP = Math.min(p / 0.25, 1)
  const indicatorOpacity = lerp(1, 0, indicatorP)

  // ── Reading panel (Phase 2) ──
  // Reading reveal begins at 15% scroll, fully revealed by 75%
  const readingP = Math.max(0, Math.min((p - 0.15) / 0.60, 1))
  // Smoothstep for the reading reveal
  const readingEased = readingP * readingP * (3 - 2 * readingP)
  const readingOpacity = readingEased
  const readingTranslateY = lerp(80, 0, readingEased)
  const readingActive = p > 0.4

  return {
    blur,
    brightness,
    saturation,
    contrast,
    overlayOpacity,
    vignetteOpacity,
    carouselScale,
    carouselOpacity,
    carouselInteractive,
    carouselGlowOpacity,
    indicatorOpacity,
    readingOpacity,
    readingTranslateY,
    readingActive,
    progress: p,
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
