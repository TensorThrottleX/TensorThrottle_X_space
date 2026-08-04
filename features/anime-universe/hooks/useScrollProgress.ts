'use client'

import { useEffect, useRef, useCallback } from 'react'

/**
 * useScrollProgress — Single global scroll progress source of truth.
 *
 * Returns a normalized 0→1 value representing how far the user has scrolled
 * from the top of the page to one full viewport height.
 *
 * Performance contract:
 *  - One passive scroll listener
 *  - rAF-gated writes (no redundant frames)
 *  - Zero React re-renders while scrolling (ref-based)
 *  - Respects prefers-reduced-motion (quantizes to discrete steps)
 *
 * Consumers read progressRef.current for frame-accurate values,
 * or subscribe via the onChange callback for imperative updates.
 */
export function useScrollProgress(onChange?: (progress: number) => void) {
  const progressRef = useRef(0)
  const frameRef = useRef(0)
  const reducedMotionRef = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const computeProgress = useCallback(() => {
    const raw = Math.max(0, Math.min(window.scrollY / window.innerHeight, 1))
    // Smoothstep for natural perceptual easing
    return raw * raw * (3 - 2 * raw)
  }, [])

  useEffect(() => {
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const applyFrame = () => {
      frameRef.current = 0
      let p = computeProgress()

      // Reduced motion: collapse into 4 discrete steps
      if (reducedMotionRef.current) {
        p = Math.round(p * 3) / 3
      }

      // Only notify when value actually changed
      if (Math.abs(p - progressRef.current) < 0.001) return
      progressRef.current = p
      onChangeRef.current?.(p)
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
  }, [computeProgress])

  return progressRef
}
