'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import type { Anime } from '@/features/anime-universe/models/Anime'

export function useAnimeBackgroundSequencer(activeAnime: Anime) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

  // Normalize sources (Rule 17)
  const videoSources = useMemo(() => {
    if (activeAnime.videoUrls && activeAnime.videoUrls.length > 0) {
      // Sort them naturally/numerically (Rule 3)
      return [...activeAnime.videoUrls].sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      })
    }
    if (activeAnime.videoUrl) {
      return [activeAnime.videoUrl]
    }
    return []
  }, [activeAnime.id, activeAnime.videoUrl, activeAnime.videoUrls])

  // Reset on anime change (Rule 11)
  useEffect(() => {
    setCurrentVideoIndex(0)
  }, [activeAnime.id])

  const currentVideoUrl = videoSources[currentVideoIndex] ?? null

  const stateRef = useRef({
    sourcesCount: videoSources.length,
    activeAnimeId: activeAnime.id,
    currentVideoIndex
  })

  useEffect(() => {
    stateRef.current.sourcesCount = videoSources.length
    stateRef.current.activeAnimeId = activeAnime.id
    stateRef.current.currentVideoIndex = currentVideoIndex
  }, [videoSources.length, activeAnime.id, currentVideoIndex])

  // Transition state refs to manage temporary video lifecycle
  const transitionRef = useRef<{
    tempVideo: HTMLVideoElement | null
    cancelled: boolean
  }>({ tempVideo: null, cancelled: false })

  // Clean up any stale transitions when anime changes (Rule 10)
  useEffect(() => {
    transitionRef.current.cancelled = true
    if (transitionRef.current.tempVideo) {
      const v = transitionRef.current.tempVideo
      v.pause()
      v.removeAttribute('src')
      v.load()
      v.remove()
      transitionRef.current.tempVideo = null
    }
    transitionRef.current.cancelled = false
  }, [activeAnime.id])

  useEffect(() => {
    const isSingleVideo = videoSources.length <= 1

    const handleVideoPlay = (e: Event) => {
      const target = e.target as HTMLVideoElement
      if (target?.tagName === 'VIDEO' && target.classList.contains('bg-video')) {
        target.loop = isSingleVideo
      }
    }

    const handleEnded = (e: Event) => {
      const target = e.target as HTMLVideoElement
      if (target?.tagName === 'VIDEO' && target.classList.contains('bg-video')) {
        if (!isSingleVideo) {
          console.log('[Sequencer] ended event fired. isSingleVideo:', isSingleVideo)
          // Prevent race conditions / double transitions
          if (transitionRef.current.tempVideo) {
            console.log('[Sequencer] already transitioning, ignoring.')
            return
          }

          const currentIdx = stateRef.current.currentVideoIndex
          const nextIdx = currentIdx + 1 < stateRef.current.sourcesCount ? currentIdx + 1 : 0
          const nextUrl = videoSources[nextIdx]

          console.log('[Sequencer] nextIdx:', nextIdx, 'nextUrl:', nextUrl)
          if (!nextUrl) return

          // Create lightweight temporary video for cinematic crossfade (Rule 2, 4, 11)
          const tempVideo = document.createElement('video')
          transitionRef.current.tempVideo = tempVideo
          transitionRef.current.cancelled = false

          tempVideo.src = nextUrl
          tempVideo.className = 'bg-video-transition'
          tempVideo.muted = true
          tempVideo.playsInline = true
          
          // Inherit precise visual state (Rule 8)
          const computed = window.getComputedStyle(target)
          tempVideo.style.position = 'absolute'
          tempVideo.style.top = '0'
          tempVideo.style.left = '0'
          tempVideo.style.width = '100%'
          tempVideo.style.height = '100%'
          tempVideo.style.objectFit = computed.objectFit || 'cover'
          tempVideo.style.objectPosition = computed.objectPosition || 'center'
          tempVideo.style.transform = computed.transform
          tempVideo.style.filter = computed.filter
          tempVideo.style.pointerEvents = 'none'
          
          // Setup cinematic fade layer (Rule 2, 3)
          tempVideo.style.opacity = '0'
          tempVideo.style.transition = 'opacity 400ms ease-in-out'
          // Place slightly above existing video so fade hides the frozen frame
          const zBase = parseInt(computed.zIndex || '0')
          tempVideo.style.zIndex = (Number.isNaN(zBase) ? 1 : zBase + 1).toString()

          const cleanup = () => {
            console.log('[Sequencer] cleanup called')
            if (transitionRef.current.tempVideo === tempVideo) {
              transitionRef.current.tempVideo = null
            }
            tempVideo.pause()
            tempVideo.removeAttribute('src')
            tempVideo.load()
            tempVideo.remove()
          }

          const onCanPlay = () => {
            console.log('[Sequencer] temp video canplay')
            if (transitionRef.current.cancelled) return cleanup()
            tempVideo.removeEventListener('canplay', onCanPlay)

            target.parentElement?.appendChild(tempVideo)

            tempVideo.play().then(() => {
              console.log('[Sequencer] temp video playing, fading in')
              if (transitionRef.current.cancelled) return cleanup()

              // Trigger fade-in (Rule 2)
              requestAnimationFrame(() => {
                tempVideo.style.opacity = computed.opacity || '1'

                setTimeout(() => {
                  console.log('[Sequencer] fade complete, updating main index to:', nextIdx)
                  if (transitionRef.current.cancelled) return cleanup()

                  // Update main sequence index only after transition is fully complete (Rule 5)
                  setCurrentVideoIndex(nextIdx)

                  // Keep temp video covering until main React video starts playing new src
                  const onMainPlay = () => {
                    console.log('[Sequencer] main video started playing, cleaning up temp')
                    target.removeEventListener('playing', onMainPlay)
                    cleanup()
                  }
                  target.addEventListener('playing', onMainPlay)

                  // Safety fallback to clean up
                  setTimeout(() => {
                    target.removeEventListener('playing', onMainPlay)
                    cleanup()
                  }, 2000)

                }, 400) // Match fade duration
              })
            }).catch((err) => {
              console.error('[Sequencer] temp video play failed', err)
              cleanup()
              setCurrentVideoIndex(nextIdx) // Fallback to immediate swap
            })
          }

          console.log('[Sequencer] Loading temp video:', tempVideo.src)
          tempVideo.addEventListener('canplay', onCanPlay)
          tempVideo.addEventListener('error', (e) => {
            console.error('[Sequencer] temp video error', e)
            cleanup()
            setCurrentVideoIndex(nextIdx)
          })

          // Begin loading next sequence (Rule 5)
          tempVideo.load()
        }
      }
    }

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement
      if (target?.tagName === 'VIDEO' && target.classList.contains('bg-video')) {
        if (!isSingleVideo) {
          // Skip the failed video and continue (Rule 14)
          setCurrentVideoIndex(prev => {
            const nextIdx = prev + 1
            if (nextIdx < stateRef.current.sourcesCount) return nextIdx
            return 0
          })
        }
      }
    }

    // Attach document-level capture listeners
    document.addEventListener('play', handleVideoPlay, true)
    document.addEventListener('loadeddata', handleVideoPlay, true) 
    document.addEventListener('ended', handleEnded, true)
    document.addEventListener('error', handleError, true)

    // Ensure currently mounted videos have correct loop state immediately
    const videos = document.querySelectorAll('video.bg-video') as NodeListOf<HTMLVideoElement>
    videos.forEach(v => { v.loop = isSingleVideo })

    return () => {
      document.removeEventListener('play', handleVideoPlay, true)
      document.removeEventListener('loadeddata', handleVideoPlay, true)
      document.removeEventListener('ended', handleEnded, true)
      document.removeEventListener('error', handleError, true)
    }
  }, [activeAnime.id, videoSources.length])

  return {
    currentVideoUrl,
    isSingleVideo: videoSources.length <= 1
  }
}
