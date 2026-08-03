'use client'

import { useCallback, useRef, useState } from 'react'

interface ParallaxState {
  rotateX: number
  rotateY: number
  scale: number
}

const ROTATE_FACTOR = 6
const SCALE_ACTIVE = 1.035
const SCALE_IDLE = 1

export function useCardParallax() {
  const ref = useRef<HTMLDivElement>(null)
  const [parallax, setParallax] = useState<ParallaxState>({
    rotateX: 0,
    rotateY: 0,
    scale: SCALE_IDLE,
  })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setParallax({
      rotateX: (y - 0.5) * ROTATE_FACTOR,
      rotateY: (0.5 - x) * ROTATE_FACTOR,
      scale: SCALE_ACTIVE,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setParallax({ rotateX: 0, rotateY: 0, scale: SCALE_IDLE })
  }, [])

  const style = {
    transform: `perspective(800px) rotateX(${parallax.rotateX}deg) rotateY(${parallax.rotateY}deg) scale(${parallax.scale})`,
    transition: 'transform 0.15s ease-out',
  } as React.CSSProperties

  return { ref, style, handleMouseMove, handleMouseLeave }
}
