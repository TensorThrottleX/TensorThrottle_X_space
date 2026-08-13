'use client'

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
} from 'react'
import { VideoCache } from './VideoCache'
import { getTransitionContainerStyle, DEFAULT_FADE_MS } from './TransitionManager'
import type {
  BackgroundVideoState,
  BackgroundVideoContextValue,
  BackgroundVideoEngineProps,
} from './types'
import { createDefaultStrategy } from '@/lib/media/strategy/RenderStrategy'
import type { RenderStrategy } from '@/lib/media/strategy/RenderStrategy'
import type { PerformanceReport } from '@/lib/media/analysis/reports'

const EMPTY_STATE: BackgroundVideoState = {
  currentSrc: null,
  isPlaying: false,
  isLoading: false,
  hasError: false,
  isSuspended: false,
}

const BackgroundVideoCtx = createContext<BackgroundVideoContextValue | null>(null)

export function useBackgroundVideoEngine(): BackgroundVideoContextValue {
  const ctx = useContext(BackgroundVideoCtx)
  if (!ctx) {
    throw new Error('useBackgroundVideoEngine must be used within <BackgroundVideoEngine>')
  }
  return ctx
}

function useVideoStyle(strategy: RenderStrategy, propOpacity?: number): React.CSSProperties {
  return useMemo((): React.CSSProperties => {
    const style: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      minWidth: '100%',
      minHeight: '100%',
      objectFit: strategy.objectFit,
      objectPosition: strategy.objectPosition,
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
    }

    if (strategy.rotation === 180) {
      style.transform = 'rotate(180deg)'
    } else if (strategy.rotation === 90 || strategy.rotation === 270) {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1080
      const vh = typeof window !== 'undefined' ? window.innerHeight : 1920
      style.position = 'absolute'
      style.top = '50%'
      style.left = '50%'
      style.width = vh
      style.height = vw
      style.transform = `translate(-50%, -50%) rotate(${strategy.rotation}deg)`
      style.flexShrink = 0
    }

    if (strategy.scale !== 1) {
      if (style.transform) {
        style.transform += ` scale(${strategy.scale})`
      } else {
        style.transform = `scale(${strategy.scale})`
      }
    }

    if (strategy.filterString) {
      style.filter = strategy.filterString
    }

    style.opacity = propOpacity !== undefined ? propOpacity : strategy.opacity

    return style
  }, [strategy, propOpacity])
}

function useRuntimeMetrics(
  src: string | null | undefined,
  activeRef: React.RefObject<HTMLVideoElement | null>,
  onRuntimeMetrics?: (report: PerformanceReport) => void,
): void {
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!onRuntimeMetrics || !src || !activeRef.current) return

    const el = activeRef.current
    frameCountRef.current = 0
    lastTimeRef.current = performance.now()

    const tick = () => {
      frameCountRef.current++
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    const interval = setInterval(() => {
      const now = performance.now()
      const elapsed = (now - lastTimeRef.current) / 1000
      const fps = elapsed > 0 ? Math.round(frameCountRef.current / elapsed) : 0

      const vq = el.getVideoPlaybackQuality?.()
      const dropped = vq?.droppedVideoFrames ?? 0
      const total = vq?.totalVideoFrames ?? 0

      const report: PerformanceReport = {
        fps,
        droppedFrames: dropped,
        totalFrames: total,
        frameLatency: elapsed > 0 ? Math.round(1000 / fps) : null,
        memoryEstimate: null,
        cpuEstimate: null,
        longTasks: 0,
        jankScore: fps > 0 && fps < 20 ? 0.8 : fps < 30 ? 0.4 : 0,
        isDegraded: fps < 24,
        timestamp: now,
      }

      onRuntimeMetrics(report)
      frameCountRef.current = 0
      lastTimeRef.current = now
    }, 2000)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      clearInterval(interval)
    }
  }, [src, activeRef, onRuntimeMetrics])
}

export const BackgroundVideoEngine = forwardRef<{ reanalyze: () => void }, BackgroundVideoEngineProps>(
  function BackgroundVideoEngine(props, ref) {
    const {
      src,
      opacity: propOpacity,
      crossfade = false,
      suspended = false,
      className,
      children,
      strategy: strategyProp,
      isAnalyzing: _isAnalyzing,
      onRuntimeMetrics,
      disablePip = false,
      loop = true,
    } = props

    const strategy = strategyProp ?? createDefaultStrategy()

    const [state, setState] = useState<BackgroundVideoState>(EMPTY_STATE)
    const [overrideSrc, setOverrideSrc] = useState<string | null | undefined>(undefined)
    const activeSrc = overrideSrc !== undefined ? overrideSrc : src

    const videoARef = useRef<HTMLVideoElement>(null)
    const videoBRef = useRef<HTMLVideoElement>(null)

    const videoStyle = useVideoStyle(strategy, propOpacity)

    const prevSrcRef = useRef<string | null | undefined>(undefined)
    const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A')
    const slotRef = useRef<'A' | 'B'>('A')
    const pendingTransitionRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => { slotRef.current = activeSlot }, [activeSlot])

    // Crossfade logic
    useEffect(() => {
      if (!crossfade || !activeSrc) return
      if (prevSrcRef.current === activeSrc) return

      const prevSrc = prevSrcRef.current
      prevSrcRef.current = activeSrc

      if (!prevSrc) {
        setActiveSlot('A')
        return
      }

      const nextSlot = slotRef.current === 'A' ? 'B' : 'A'
      const incoming = nextSlot === 'A' ? videoARef.current : videoBRef.current
      if (!incoming) return

      if (pendingTransitionRef.current) {
        clearTimeout(pendingTransitionRef.current)
        pendingTransitionRef.current = null
      }

      incoming.src = activeSrc
      incoming.load()

      let cancelled = false

      const onReady = () => {
        if (cancelled) return
        incoming.removeEventListener('canplay', onReady)
        incoming.removeEventListener('error', onError)
        incoming.play().catch(() => {})
        setActiveSlot(nextSlot)
      }

      const onError = () => {
        if (cancelled) return
        incoming.removeEventListener('canplay', onReady)
        incoming.removeEventListener('error', onError)
        setActiveSlot(nextSlot)
      }

      if (incoming.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        onReady()
      } else {
        incoming.addEventListener('canplay', onReady)
        incoming.addEventListener('error', onError)
      }

      pendingTransitionRef.current = setTimeout(onReady, 5000)

      return () => {
        cancelled = true
        incoming.removeEventListener('canplay', onReady)
        incoming.removeEventListener('error', onError)
        if (pendingTransitionRef.current) {
          clearTimeout(pendingTransitionRef.current)
          pendingTransitionRef.current = null
        }
      }
    }, [activeSrc, crossfade])

    // Reset on src change
    useEffect(() => {
      if (activeSrc) {
        setState(prev => ({ ...prev, currentSrc: activeSrc, hasError: false }))
      } else {
        setState(EMPTY_STATE)
      }
    }, [activeSrc])

    const isVisible = !suspended && Boolean(activeSrc)

    const handleLoadedMetadata = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
      const v = e.currentTarget
      v.playbackRate = 1.0
      ;(v as any).preservesPitch = true

      const w = v.videoWidth
      const h = v.videoHeight

      if (activeSrc) {
        try {
          const hasAudio = (v as any).audioTracks?.length > 0 ||
            (v as any).mozHasAudio ||
            Boolean((v as any).webkitAudioDecodedByteCount)
          VideoCache.set(activeSrc, { width: w, height: h, hasAudio })
        } catch { /* silent */ }
      }

      if (!suspended) {
        v.play().catch(() => {})
      }
    }, [suspended, activeSrc])

    const handlePlaying = useCallback(() => {
      setState(prev => ({ ...prev, isPlaying: true, isLoading: false }))
    }, [])

    const handleWaiting = useCallback(() => {
      setState(prev => ({ ...prev, isLoading: true }))
    }, [])

    const handleError = useCallback(() => {
      setState(prev => ({ ...prev, hasError: true, isLoading: false }))
    }, [])

    const handleCanPlay = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
      setState(prev => ({ ...prev, isLoading: false }))
      if (!suspended) {
        e.currentTarget.play().catch(() => {})
      }
    }, [suspended])

    const handlePlayEvent = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
      e.currentTarget.playbackRate = 1.0
    }, [])

    const handleRateChange = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (e.currentTarget.playbackRate !== 1.0) {
        e.currentTarget.playbackRate = 1.0
      }
    }, [])

    const setSource = useCallback((newSrc: string | null) => {
      setOverrideSrc(newSrc)
    }, [])

    const setConfig = useCallback((_cfg: Partial<BackgroundVideoEngineProps>) => {
      // Config changes handled via re-render with new props
    }, [])

    const activeRef = useMemo(() => {
      if (crossfade) return activeSlot === 'A' ? videoARef : videoBRef
      return videoARef
    }, [crossfade, activeSlot])

    const contextValue = useMemo((): BackgroundVideoContextValue => ({
      setSource,
      setConfig,
      state,
      videoRef: activeRef as React.RefObject<HTMLVideoElement | null>,
    }), [setSource, setConfig, state, activeRef])

    const transitionDuration = strategy.transitionDuration

    useRuntimeMetrics(activeSrc, activeRef, onRuntimeMetrics)

    // ── Render ──
    if (crossfade) {
      return (
        <BackgroundVideoCtx.Provider value={contextValue}>
          <div
            className={className}
            style={{
              ...getTransitionContainerStyle(),
              ...(!isVisible ? { display: 'none' } : {}),
            }}
          >
            <video
              ref={videoARef}
              src={activeSrc ?? undefined}
              autoPlay
              loop={loop}
              muted
              playsInline
              preload={strategy.preloadStrategy}
              className="bg-video"
              style={{
                ...videoStyle,
                transition: `opacity ${transitionDuration}ms ease`,
                opacity: activeSlot === 'A' ? (propOpacity ?? strategy.opacity) : 0,
                pointerEvents: activeSlot === 'A' ? 'auto' : 'none',
              }}
              onLoadedMetadata={handleLoadedMetadata}
              onPlaying={handlePlaying}
              onWaiting={handleWaiting}
              onError={handleError}
              onCanPlay={handleCanPlay}
              onPlay={handlePlayEvent}
              onRateChange={handleRateChange}
              x-webkit-airplay={disablePip ? 'deny' : 'allow'}
              disablePictureInPicture={disablePip}
              disableRemotePlayback={disablePip}
              controlsList={disablePip ? 'noplaybackrate nodownload noremoteplayback' : undefined}
            />
            <video
              ref={videoBRef}
              src={activeSrc ?? undefined}
              autoPlay
              loop={loop}
              muted
              playsInline
              preload={strategy.preloadStrategy}
              className="bg-video"
              style={{
                ...videoStyle,
                transition: `opacity ${transitionDuration}ms ease`,
                opacity: activeSlot === 'B' ? (propOpacity ?? strategy.opacity) : 0,
                pointerEvents: activeSlot === 'B' ? 'auto' : 'none',
              }}
              onLoadedMetadata={handleLoadedMetadata}
              onPlaying={handlePlaying}
              onWaiting={handleWaiting}
              onError={handleError}
              onCanPlay={handleCanPlay}
              onPlay={handlePlayEvent}
              onRateChange={handleRateChange}
              x-webkit-airplay={disablePip ? 'deny' : 'allow'}
              disablePictureInPicture={disablePip}
              disableRemotePlayback={disablePip}
              controlsList={disablePip ? 'noplaybackrate nodownload noremoteplayback' : undefined}
            />
          </div>
          {children}
        </BackgroundVideoCtx.Provider>
      )
    }

    return (
      <BackgroundVideoCtx.Provider value={contextValue}>
        <div
          className={className}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            ...(!isVisible ? { display: 'none' } : {}),
          }}
        >
          <video
            ref={videoARef}
            src={activeSrc ?? undefined}
            autoPlay
            loop={loop}
            muted
            playsInline
            preload={strategy.preloadStrategy}
            className="bg-video"
            style={videoStyle}
            onLoadedMetadata={handleLoadedMetadata}
            onPlaying={handlePlaying}
            onWaiting={handleWaiting}
            onError={handleError}
            onCanPlay={handleCanPlay}
            onPlay={handlePlayEvent}
            onRateChange={handleRateChange}
            x-webkit-airplay={disablePip ? 'deny' : 'allow'}
            disablePictureInPicture={disablePip}
            disableRemotePlayback={disablePip}
            controlsList={disablePip ? 'noplaybackrate nodownload noremoteplayback' : undefined}
          />
        </div>
        {children}
      </BackgroundVideoCtx.Provider>
    )
  },
)

BackgroundVideoEngine.displayName = 'BackgroundVideoEngine'

export default BackgroundVideoEngine
