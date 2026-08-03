import { useRef, useEffect, useCallback } from 'react'

export function useIdleTimer(
  onIdle: () => void,
  idleThreshold: number = 180000
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onIdleRef.current()
    }, idleThreshold)
  }, [idleThreshold])

  useEffect(() => {
    reset()
    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'scroll'] as const
    for (const e of events) {
      window.addEventListener(e, reset, { passive: true })
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const e of events) {
        window.removeEventListener(e, reset)
      }
    }
  }, [reset])

  return reset
}
