import { useRef, useCallback, useEffect } from 'react'
import type { FoxSound, FoxAudioManager } from './types'

const FOX_SOUND_DIR = '/media/audio/sfx'

export function useFoxAudio(): FoxAudioManager {
  const hasInteractedRef = useRef(false)
  const mutedRef = useRef(false)
  const clickCountRef = useRef(0)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const initInteraction = useCallback(() => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true
    }
  }, [])

  useEffect(() => {
    const handler = () => initInteraction()
    window.addEventListener('pointerdown', handler, { once: true })
    window.addEventListener('keydown', handler, { once: true })
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [initInteraction])

  const play = useCallback((sound: FoxSound) => {
    if (mutedRef.current) return
    if (!hasInteractedRef.current) return

    if (sound === 'click') {
      clickCountRef.current += 1
      const n = ((clickCountRef.current - 1) % 5) + 1
      const path = `${FOX_SOUND_DIR}/${n}.m4a`

      const audio = new Audio(path)
      audio.volume = 0.2
      audio.play().catch(() => {
        clickCountRef.current = 0
      })
      currentAudioRef.current = audio
    }
  }, [])

  const setVolume = useCallback((vol: number) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.volume = Math.max(0, Math.min(1, vol))
    }
  }, [])

  const mute = useCallback(() => { mutedRef.current = true }, [])
  const unmute = useCallback(() => { mutedRef.current = false }, [])

  return {
    play,
    setVolume,
    mute,
    unmute,
    get isMuted() { return mutedRef.current },
    get hasInteracted() { return hasInteractedRef.current },
  } as FoxAudioManager & { hasInteracted: boolean }
}
