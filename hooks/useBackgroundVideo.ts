'use client'

import { useEffect } from 'react'
import { useBackgroundVideoEngine } from '@/components/media/BackgroundVideoEngine/Engine'
import type { BackgroundVideoConfig } from '@/components/media/BackgroundVideoEngine/types'

export function useBackgroundVideo(
  src?: string | null,
  config?: Partial<BackgroundVideoConfig>,
) {
  const { setSource, setConfig, state, videoRef } = useBackgroundVideoEngine()

  useEffect(() => {
    if (src !== undefined) {
      setSource(src)
    }
    return () => {
      // Clear override when consumer unmounts
      setSource(null)
    }
  }, [src, setSource])

  useEffect(() => {
    if (config) {
      setConfig(config)
    }
  }, [config, setConfig])

  return {
    setSource,
    setConfig,
    state,
    videoRef,
  }
}