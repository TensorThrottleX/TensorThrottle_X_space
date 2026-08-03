'use client'

import React, { useRef, useEffect, useCallback } from 'react'

export function BackgroundAudioEngine({ audioUrl, isMuted = false }: { audioUrl: string | null, isMuted?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const loadedUrlRef = useRef<string | null>(null)

  const fadeOut = useCallback((el: HTMLAudioElement, onDone: () => void) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
    const step = 0.05
    fadeIntervalRef.current = setInterval(() => {
      if (el.volume > step) {
        el.volume = Math.max(0, el.volume - step)
      } else {
        el.volume = 0
        el.pause()
        clearInterval(fadeIntervalRef.current!)
        fadeIntervalRef.current = null
        onDone()
      }
    }, 40)
  }, [])

  const fadeIn = useCallback((el: HTMLAudioElement) => {
    el.volume = 0
    el.play().catch(() => {})
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
    const step = 0.03
    const target = 0.35
    fadeIntervalRef.current = setInterval(() => {
      if (el.volume < target - step) {
        el.volume = Math.min(target, el.volume + step)
      } else {
        el.volume = target
        clearInterval(fadeIntervalRef.current!)
        fadeIntervalRef.current = null
      }
    }, 40)
  }, [])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    let isCancelled = false

    const tryPlay = () => {
      if (isCancelled) return
      fadeIn(el)
    }

    const loadAndPlay = () => {
      if (isCancelled) return
      if (!audioUrl) return
      
      if (loadedUrlRef.current !== audioUrl) {
        el.src = audioUrl
        loadedUrlRef.current = audioUrl
        el.load()
      }

      if (el.readyState >= 3) {
        tryPlay()
      } else {
        el.oncanplay = () => {
            el.oncanplay = null;
            tryPlay();
        }
        el.onerror = () => {
            el.onerror = null;
            el.oncanplay = null;
            console.warn('Audio load error:', audioUrl)
        }
      }
    }

    if (loadedUrlRef.current && loadedUrlRef.current !== audioUrl && !el.paused) {
      fadeOut(el, loadAndPlay)
    } else {
      loadAndPlay()
    }

    return () => {
      isCancelled = true
      el.oncanplay = null
      el.onerror = null
    }
  }, [audioUrl, fadeIn, fadeOut])

  // Handle external mute state
  useEffect(() => {
    const el = audioRef.current
    if (!el || !el.src) return
    
    if (isMuted) {
      if (!el.paused) {
        fadeOut(el, () => {})
      }
    } else {
      if (el.paused && loadedUrlRef.current) {
        fadeIn(el)
      }
    }
  }, [isMuted, fadeIn, fadeOut])

  useEffect(() => {
    return () => {
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current)
    }
  }, [])

  return <audio ref={audioRef} loop style={{ display: 'none' }} />
}
