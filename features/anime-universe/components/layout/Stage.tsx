'use client'

import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import type { Anime } from '@/features/anime-universe/models/Anime'
import { Prism } from '@/prism-engine/src/prism/components/Prism'
import type { PrismItem } from '@/prism-engine/src/prism/types/Item'
import { useMediaSession } from '@/components/providers/MediaOrchestrator'
import { getAnimeAudioMuted, onAnimeAudioMutedChange } from '@/features/anime-universe/lib/audio-control'
import { assetRegistry } from '@/lib/media/UniversalAssetRegistry'
import { DefaultCardContent } from '@/prism-engine/src/prism/components/PrismCard'
import { ReadingFocus } from '@/components/reading-focus'
import { AnimeNarrativeTemplate } from '@/features/anime-universe/components/narrative'
import { useScrollProgress } from '@/features/anime-universe/hooks/useScrollProgress'
import { useEnvironmentTransition } from '@/features/anime-universe/hooks/useEnvironmentTransition'
import './stage.css'

// ── Default Universe constants ──
// Fallback when the API has no 'default' entry (unlikely — local dev always ships it).
const FALLBACK_DEFAULT_ANIME: Anime = {
  id: 'default',
  index: 0,
  title: 'Anime Universe',
  subtitle: 'Stories that shaped my mindset',
  description: 'Anime is more than entertainment. It is a lens through which I have learned resilience, empathy, discipline, and the courage to question everything.',
  accentColor: '#22d3ee',
  quotes: [
    'The stories we love become part of who we are.',
    'Every protagonist begins as an outcast.',
    'Growth happens when you refuse to give up.',
  ],
  characters: [],
  coverImage: assetRegistry.resolve('anime', 'default').coverUrl,
  videoUrl: '/media/universe/anime/video/default/default.mp4',
  audioTracks: [],
}

// ── Transition durations (ms) ──
const FADE_MS = 600
const CONTENT_DELAY_MS = 150

interface StageProps {
  animeList: Anime[]
  defaultUniverse?: Anime | null
  activeIndex: number
  onIndexChange: (index: number) => void
  isReady: boolean
}

export function Stage({ animeList, defaultUniverse, activeIndex, onIndexChange, isReady }: StageProps) {
  const hasNoAnime = isReady && animeList.length === 0
  const stageRef = useRef<HTMLDivElement>(null)

  // The 'default' universe is the ambient environment card — its narrative
  // backs the manuscript until the user rotates to an actual anime.
  const defaultAnime: Anime = useMemo(() => {
    if (defaultUniverse) return defaultUniverse
    return FALLBACK_DEFAULT_ANIME
  }, [defaultUniverse])

  // Derive active anime from index — default when -1
  const activeAnime: Anime = useMemo(() => {
    if (activeIndex >= 0 && activeIndex < animeList.length) {
      return animeList[activeIndex]
    }
    return defaultAnime
  }, [activeIndex, animeList, defaultAnime])

  // ── Prism items: default + all anime ──
  const prismItems: PrismItem[] = useMemo(() => [
    {
      id: 'default',
      title: defaultAnime.title,
      subtitle: defaultAnime.subtitle,
      thumbnail: defaultAnime.coverImage ?? undefined,
      cover: defaultAnime.coverImage ?? undefined,
      customData: defaultAnime as any,
    },
    ...animeList.map(a => ({
      id: a.id,
      title: a.title,
      subtitle: a.subtitle,
      thumbnail: a.coverImage ?? undefined,
      cover: a.coverImage ?? undefined,
      customData: a as any,
    })),
  ], [animeList, defaultAnime])

  // ── Scoped Media Session (takes priority over Global Nav Session) ──
  const initialAssetPackage = useMemo(() => {
    return assetRegistry.resolve('anime', activeAnime.id)
  }, [])

  const { updateSession } = useMediaSession({
    scope: 'anime-universe',
    priority: 50,
    mode: 'SCOPED_BACKGROUND',
    assetPackage: initialAssetPackage,
    audioEnabled: false,
    disablePip: true,
    capabilities: {
      supportsBackgroundSwitch: false,
      supportsAudioToggle: false,
      supportsThemeSwitch: true,
    }
  })

  // ── Local Audio Playback (bypasses global BackgroundAudioEngine) ──
  const [isMuted, setIsMuted] = useState(getAnimeAudioMuted())
  const audioRef = useRef<HTMLAudioElement | null>(null)

  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio()
    audioRef.current.muted = getAnimeAudioMuted()
  }

  useEffect(() => onAnimeAudioMutedChange(setIsMuted), [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted])

  useEffect(() => {
    const tracks = activeAnime.audioTracks || []
    if (!audioRef.current) return;
    const el = audioRef.current;

    if (tracks.length === 0) {
      el.pause()
      el.src = ''
      return
    }
    
    let currentTrackIndex = 0;
    
    const playTrack = (index: number) => {
      if (index >= tracks.length) {
        index = 0;
      }
      currentTrackIndex = index;
      el.src = tracks[currentTrackIndex]
      el.loop = tracks.length === 1;
      el.volume = 0.35
      el.play().catch(() => {})
    }

    const handleEnded = () => {
      if (tracks.length > 1) {
        playTrack(currentTrackIndex + 1)
      }
    }

    el.addEventListener('ended', handleEnded)
    playTrack(0)
    
    return () => {
      el.removeEventListener('ended', handleEnded)
      el.pause()
      el.src = ''
    }
  }, [activeAnime.id])

  // ════════════════════════════════════════════════════════════════════
  // SCROLL TRANSITION ENGINE — Single source of truth
  // ════════════════════════════════════════════════════════════════════

  // Track carousel interactivity as state (CSS custom props can't drive pointerEvents)
  const [carouselActive, setCarouselActive] = useState(true)
  // Reading phase (p > 0.4) — gates hover/cursor on the carousel via data-prism-phase
  const [readingStarted, setReadingStarted] = useState(false)

  // Environment controller writes CSS custom properties directly to stageRef
  const { applyProgress } = useEnvironmentTransition(stageRef)

  // Single global scroll progress — drives everything.
  // Future phases (timeline, reflections, progress indicator, manuscript
  // sections) subscribe to the same source instead of adding observers.
  const progressRef = useScrollProgress((p) => {
    applyProgress(p)
    // Update carousel interactivity based on progress threshold
    setCarouselActive(p < 0.6)
    setReadingStarted(p > 0.4)
  })



  // Synchronize active anime video (not audio) with MediaOrchestrator
  useEffect(() => {
    const videoUrl = activeAnime.videoUrl
    const coverUrl = activeAnime.coverImage

    updateSession({
      assetPackage: {
        id: activeAnime.id,
        dimension: 'anime',
        videoUrl,
        audioUrl: null,
        coverUrl,
        theme: 'dark',
        metadataUrl: null
      }
    })
  }, [activeAnime, updateSession])

  // ── "Continue Exploring" navigation: carousel is the navigator ──
  const handleExplore = useCallback((animeId: string) => {
    const idx = animeList.findIndex((a) => a.id === animeId)
    if (idx < 0) return
    onIndexChange(idx)
    // Return the reader to the reading position: one viewport down,
    // where the environment is fully in reading mode.
    requestAnimationFrame(() => {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })
    })
  }, [animeList, onIndexChange])

  return (
    <div
      ref={stageRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '200vh', // Enough scroll distance for full transition
        backgroundColor: 'transparent',
        overflowX: 'hidden',
        // Initialize CSS custom properties (overwritten by useEnvironmentTransition)
        '--env-blur': '0px',
        '--env-brightness': '100%',
        '--env-saturation': '100%',
        '--env-contrast': '100%',
        '--env-overlay': '0',
        '--env-vignette': '0',
        '--carousel-scale': '1',
        '--carousel-opacity': '1',
        '--carousel-glow': '1',
        '--reading-opacity': '0',
        '--reading-ty': '80px',
      } as React.CSSProperties}
    >

      {/* ═══ Phase 1: Environmental Transition Layer ═══ */}
      {/* Fixed overlay that filters the background video beneath */}
      <div
        aria-hidden
        className="anime-stage-env"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          backgroundColor: `rgba(0, 0, 0, var(--env-overlay))`,
          backdropFilter: `blur(var(--env-blur)) brightness(var(--env-brightness)) saturate(var(--env-saturation)) contrast(var(--env-contrast))`,
          WebkitBackdropFilter: `blur(var(--env-blur)) brightness(var(--env-brightness)) saturate(var(--env-saturation)) contrast(var(--env-contrast))`,
          willChange: 'backdrop-filter, background-color',
        }}
      />

      {/* ═══ Phase 1: Vignette Layer ═══ */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
          opacity: `var(--env-vignette)`,
          willChange: 'opacity',
        }}
      />

      {/* ═══ Phase 1: Carousel (Prism) Layer ═══ */}
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          paddingBottom: '40px',
          zIndex: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          transform: `scale(var(--carousel-scale))`,
          opacity: `var(--carousel-opacity)`,
          pointerEvents: carouselActive ? 'auto' : 'none',
          willChange: 'transform, opacity',
        }}
        data-prism-phase={readingStarted ? 'read' : 'explore'}
      >
          <div
            className="anime-prism"
            style={{
              position: 'relative',
              '--prism-surface': 'linear-gradient(to bottom, rgba(12,12,12,0.55) 0%, rgba(18,18,18,0.72) 55%, rgba(10,10,10,0.92) 100%)',
              '--prism-surface-alt': 'rgba(14,14,14,0.9)',
              '--prism-border': 'rgba(255,255,255,0.045)',
              '--prism-border-strong': 'rgba(255,255,255,0.07)',
              '--prism-border-stronger': 'rgba(226,220,210,0.30)',
              '--prism-text-primary': 'rgba(250,248,243,0.97)',
              '--prism-text-secondary': 'rgba(228,222,212,0.66)',
              // Ambient weight, driven by scroll — soft black presence, no glow
              filter: 'drop-shadow(0 18px 55px rgba(0,0,0,calc(0.55 * var(--carousel-glow)))) drop-shadow(0 0 46px rgba(124,112,98,calc(0.05 * var(--carousel-glow))))',
            } as React.CSSProperties}
          >
            <Prism
              items={prismItems}
              activeIndex={activeIndex + 1}
              onChange={(idx) => onIndexChange(idx - 1)}
              config={{
                cardWidth: 180,
                cardHeight: 280,
                radius: Math.max(320, Math.round((prismItems.length * 220) / (2 * Math.PI))),
                perspective: 1100,
              }}
              showNavigation={false}
              showIndicators={true}
              renderCard={(item) => (
                <AnimeCardContent item={item} />
              )}
            />

        </div>

        {hasNoAnime && (
          <div style={{
            marginTop: 24,
            color: 'var(--adaptive-hero-muted)',
            fontFamily: 'sans-serif',
            fontSize: 14,
          }}>
            No anime installed.
          </div>
        )}

        {/* Scroll Indicator to prompt user to scroll down for the manuscript */}
        {!hasNoAnime && (
          <div 
            className="anime-scroll-indicator-wrapper" 
            aria-hidden
            style={{ 
              position: 'absolute',
              bottom: '18%', 
              left: '50%',
              transform: 'translateX(-50%)',
              opacity: 'var(--indicator-opacity)',
              pointerEvents: 'none',
              animation: 'fadeInUp 2s 1s ease-out both',
            }}
          >
            <div className="anime-scroll-indicator">
              <div className="scroll-dot-line"></div>
              <span>read more</span>
              <div className="scroll-dot-line with-arrow"></div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Phase 2: Reading Stage ═══ */}
      {/* The manuscript container — revealed as the environment quiets */}
      <div
        style={{
          position: 'relative',
          zIndex: 8,
          opacity: `var(--reading-opacity)`,
          transform: `translateY(var(--reading-ty))`,
          willChange: 'transform, opacity',
        }}
      >
        <ReadingFocus
          active
          style={{
            width: '100%',
            '--rf-accent': activeAnime.accentColor,
          } as React.CSSProperties}
        >
          <ManuscriptPanel anime={activeAnime} onExplore={handleExplore} />
        </ReadingFocus>
      </div>

    </div>
  )
}




// ── Charcoal glass card content — DefaultCardContent + artwork scrim.
//    The scrim darkens the cover's lower edge into the glass panel below
//    without ever tinting the artwork itself.
function AnimeCardContent({ item }: { item: PrismItem }) {
  return (
    <>
      <DefaultCardContent item={item} />
      <div className="anime-card-scrim" aria-hidden />
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MANUSCRIPT PANEL — full content experience below the prism
// Fades out → swaps the active anime's manuscript → fades in.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ManuscriptPanel({
  anime,
  onExplore,
}: {
  anime: Anime
  onExplore?: (animeId: string) => void
}) {
  const [displayed, setDisplayed] = useState(anime)
  const [opacity, setOpacity] = useState(1)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Swap when the selection OR its narrative payload changes — the default
    // universe keeps id 'default' but gains its narrative after the API fetch.
    if (anime.id === displayed.id && anime.narrativeData === displayed.narrativeData) return

    // Fade out, swap content, fade in
    setOpacity(0)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setDisplayed(anime)
      setOpacity(1)
    }, CONTENT_DELAY_MS + 200)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [anime, displayed.id, displayed.narrativeData])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        margin: '0 auto',
        opacity,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      {displayed.narrativeData ? (
        <AnimeNarrativeTemplate data={displayed.narrativeData} />
      ) : (
        <div style={{ padding: '100px', textAlign: 'center', color: 'var(--paper-60)' }}>
          No narrative data available for this anime.
        </div>
      )}
    </div>
  )
}
