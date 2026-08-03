'use client'

import React, { useRef } from 'react'
import { useReadingFocus } from './use-reading-focus'
import './reading-focus.css'

export interface ReadingFocusProps {
  /**
   * Opt-in switch. Reading Focus does nothing unless a page enables it.
   * Default: false.
   */
  active?: boolean
  /** Content that floats above the cinematic backdrop. */
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  /** Render the blur window + tint veil. Default true. */
  window?: boolean
  /** Blend text tokens toward reading-optimized contrast. Default true. */
  textBoost?: boolean
  /** Blur radius (px) at full focus. Default 12. */
  maxBlur?: number
  /** Viewport fraction for the 0→1 ramp. Default 0.5. */
  activationFactor?: number
  /** Max veil darkness (0..1). Default 0.38. */
  tintMax?: number
}

/**
 * ReadingFocus — reusable reading window.
 *
 * Wraps any content region and, while `active`, progressively:
 *  • blurs the video/backdrop behind the region (depth-of-field, feathered)
 *  • slightly darkens + desaturates the backdrop inside the region
 *  • boosts text contrast without touching typography
 *
 * Everything above the region (hero, nav, floating controls) is untouched.
 * The background video element is never modified — playback continues
 * seamlessly. Disabled by default; pages opt in via `active`.
 */
export const ReadingFocus = React.forwardRef<HTMLDivElement, ReadingFocusProps>(
  function ReadingFocus(
    {
      active = false,
      children,
      className,
      style,
      window: renderWindow = true,
      textBoost = true,
      maxBlur,
      activationFactor,
      tintMax,
    },
    ref,
  ) {
    const localRef = useRef<HTMLDivElement>(null)

    const mergeRef = (node: HTMLDivElement | null) => {
      localRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    useReadingFocus(localRef, {
      enabled: !!active,
      maxBlur,
      activationFactor,
      tintMax,
    })

    return (
      <div
        ref={mergeRef}
        className={`tx-reading-focus${textBoost ? ' tx-reading-focus-boost' : ''}${className ? ` ${className}` : ''}`}
        style={{ position: 'relative', zIndex: 1, '--rf-p': 0, ...style } as React.CSSProperties}
      >
        {renderWindow && (
          <>
            <div aria-hidden className="tx-reading-focus-window" />
            <div aria-hidden className="tx-reading-focus-tint" />
          </>
        )}
        <div className="tx-reading-focus-content">{children}</div>
      </div>
    )
  },
)

export default ReadingFocus
