import { useRef, useState, useCallback, useEffect } from 'react'

export const DEFAULT_FADE_MS = 600

export type SlotId = 'A' | 'B'

export interface TransitionState {
  activeSlot: SlotId
  isTransitioning: boolean
}

export function useTransitionManager(fadeMs: number = DEFAULT_FADE_MS) {
  const [activeSlot, setActiveSlot] = useState<SlotId>('A')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const slotRef = useRef<SlotId>('A')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    slotRef.current = activeSlot
  }, [activeSlot])

  const transitionTo = useCallback((targetSlot: SlotId) => {
    if (targetSlot === slotRef.current && !isTransitioning) return
    setIsTransitioning(true)
    setActiveSlot(targetSlot)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false)
      timeoutRef.current = null
    }, fadeMs + 50)
  }, [fadeMs, isTransitioning])

  const getInactiveSlot = useCallback((): SlotId => {
    return slotRef.current === 'A' ? 'B' : 'A'
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    activeSlot,
    isTransitioning,
    transitionTo,
    getInactiveSlot,
    fadeMs,
  }
}

export function getTransitionContainerStyle(): React.CSSProperties {
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    zIndex: 5,
  }
}