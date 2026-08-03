'use client'

import { useCallback, useEffect, useRef } from 'react'

export interface ReadingFocusOptions {
  /** Master switch — reading focus is disabled by default. */
  enabled: boolean
  /** Blur radius (px) at full focus. Default 12. */
  maxBlur?: number
  /**
   * Fraction of viewport height over which progress ramps 0 → 1.
   * 0.5 means fully engaged once the reading region's top reaches
   * 50% of the viewport height. Default 0.5.
   */
  activationFactor?: number
  /** Max veil darkness (0..1) at full focus. Default 0.38. */
  tintMax?: number
}

const EPSILON = 0.004

/**
 * useReadingFocus — tracks how far the reading region has entered the
 * viewport and writes the result as `--rf-p` (0..1) directly on the target
 * element via requestAnimationFrame.
 *
 * Performance contract:
 *  - passive scroll/resize listeners that only *schedule* a frame
 *  - one layout read (getBoundingClientRect) per frame at most
 *  - one CSS custom-property write per frame when the value changed
 *  - zero React re-renders while scrolling (no state updates)
 *  - `prefers-reduced-motion` quantizes progress into discrete steps
 *
 * The visual math (blur, tint, text boost) lives in CSS so every frame only
 * re-evaluates compositor styles, never JavaScript logic.
 */
export function useReadingFocus(
  targetRef: React.RefObject<HTMLElement | null>,
  options: ReadingFocusOptions,
) {
  const { enabled, activationFactor = 0.5 } = options
  const optsRef = useRef(options)
  optsRef.current = options

  const progressRef = useRef(0)
  const frameRef = useRef(0)
  const reducedMotionRef = useRef(false)

  const setProgress = useCallback(
    (p: number) => {
      if (Math.abs(p - progressRef.current) < EPSILON) return
      progressRef.current = p
      targetRef.current?.style.setProperty('--rf-p', p.toFixed(4))
    },
    [targetRef],
  )

  useEffect(() => {
    if (!enabled) return

    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const applyFrame = () => {
      frameRef.current = 0
      const el = targetRef.current
      if (!el) return

      const vh = window.innerHeight
      const top = el.getBoundingClientRect().top
      const factor = optsRef.current.activationFactor ?? 0.5

      let raw = (vh - top) / (vh * factor)
      if (raw < 0) raw = 0
      else if (raw > 1) raw = 1

      // Smoothstep — natural ease into focus instead of a linear ramp
      let p = raw * raw * (3 - 2 * raw)

      // Reduced motion: collapse into 4 discrete steps (fewer filter changes)
      if (reducedMotionRef.current) p = Math.round(p * 3) / 3

      setProgress(p)
    }

    const scheduleFrame = () => {
      if (frameRef.current) return
      frameRef.current = requestAnimationFrame(applyFrame)
    }

    const readPrefs = () => {
      reducedMotionRef.current = motionMq.matches
      scheduleFrame()
    }

    readPrefs()
    motionMq.addEventListener('change', readPrefs)
    window.addEventListener('scroll', scheduleFrame, { passive: true })
    window.addEventListener('resize', scheduleFrame, { passive: true })

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      motionMq.removeEventListener('change', readPrefs)
      window.removeEventListener('scroll', scheduleFrame)
      window.removeEventListener('resize', scheduleFrame)
    }
  }, [enabled, setProgress, targetRef])

  // When disabled, reset the progress variable so the page is untouched.
  useEffect(() => {
    if (enabled) return
    setProgress(0)
  }, [enabled, setProgress])

  return progressRef
}
