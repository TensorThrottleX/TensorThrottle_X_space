import { useRef, useEffect, useCallback } from 'react'

export function usePointerTracker() {
  const cursorRef = useRef({ x: 0, y: 0 })
  const elementRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('pointermove', handler, { passive: true })
    return () => window.removeEventListener('pointermove', handler)
  }, [])

  const getDistanceToCursor = useCallback(() => {
    if (!elementRef.current) return Infinity
    const rect = elementRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = cursorRef.current.x - cx
    const dy = cursorRef.current.y - cy
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const getDirectionToCursor = useCallback(() => {
    if (!elementRef.current) return 0
    const rect = elementRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    return Math.atan2(cursorRef.current.y - cy, cursorRef.current.x - cx)
  }, [])

  return {
    cursorRef,
    elementRef,
    getDistanceToCursor,
    getDirectionToCursor,
  }
}
