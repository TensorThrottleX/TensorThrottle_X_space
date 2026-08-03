'use client'

import { useMemo, useRef, useEffect, useState } from 'react'
import type { Anime } from '@/features/anime-universe/models/Anime'
import { Prism } from '@/prism-engine/src/prism/components/Prism'
import type { PrismItem } from '@/prism-engine/src/prism/types/Item'
import { useMediaSession } from '@/components/providers/MediaOrchestrator'
import { getAnimeAudioMuted, onAnimeAudioMutedChange } from '@/features/anime-universe/lib/audio-control'
import { assetRegistry } from '@/lib/media/UniversalAssetRegistry'
import { DefaultCardContent } from '@/prism-engine/src/prism/components/PrismCard'
import { ReadingFocus } from '@/components/reading-focus'

// ── Default Universe constants ──
const DEFAULT_ANIME: Anime = {
  id: 'default',
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
  activeIndex: number
  onIndexChange: (index: number) => void
  isReady: boolean
}

export function Stage({ animeList, activeIndex, onIndexChange, isReady }: StageProps) {
  const hasNoAnime = isReady && animeList.length === 0

  // Derive active anime from index — default when -1
  const activeAnime: Anime = useMemo(() => {
    if (activeIndex >= 0 && activeIndex < animeList.length) {
      return animeList[activeIndex]
    }
    return DEFAULT_ANIME
  }, [activeIndex, animeList])

  // ── Prism items: default + all anime ──
  const prismItems: PrismItem[] = useMemo(() => [
    {
      id: 'default',
      title: DEFAULT_ANIME.title,
      subtitle: DEFAULT_ANIME.subtitle,
      thumbnail: DEFAULT_ANIME.coverImage ?? undefined,
      cover: DEFAULT_ANIME.coverImage ?? undefined,
      customData: DEFAULT_ANIME as any,
    },
    ...animeList.map(a => ({
      id: a.id,
      title: a.title,
      subtitle: a.subtitle,
      thumbnail: a.coverImage ?? undefined,
      cover: a.coverImage ?? undefined,
      customData: a as any,
    })),
  ], [animeList])

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

  useEffect(() => onAnimeAudioMutedChange(setIsMuted), [])

  useEffect(() => {
    const src = (activeAnime.audioTracks && activeAnime.audioTracks.length > 0)
      ? activeAnime.audioTracks[0]
      : null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (src) {
      const el = audioRef.current ?? new Audio()
      el.src = src
      el.loop = true
      el.muted = isMuted
      el.volume = 0.35
      el.play().catch(() => {})
      audioRef.current = el
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [activeAnime.id, isMuted])

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

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'transparent',
        overflowX: 'hidden',
      }}
    >


      {/* ═══ Prism Layer ═══ */}
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
        }}
      >
          <div
            style={{
              position: 'relative',
              '--prism-surface': 'var(--adaptive-glass-bg)',
            '--prism-surface-alt': 'var(--adaptive-glass-bg)',
            '--prism-border': 'var(--adaptive-glass-border)',
            '--prism-border-strong': 'var(--adaptive-glass-border)',
            '--prism-border-stronger': 'var(--adaptive-hero-muted)',
            '--prism-text-primary': 'var(--adaptive-hero-color)',
            '--prism-text-secondary': 'var(--adaptive-hero-secondary)',
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
              <DefaultCardContent item={item} />
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
      </div>

      {/* ═══ Content Panel — wrapped in the Reading Focus window ═══ */}
      <ReadingFocus
        active
        style={{
          zIndex: 7,
          width: '100%',
          '--rf-accent': activeAnime.accentColor,
        } as React.CSSProperties}
      >
        <ContentPanel anime={activeAnime} />
      </ReadingFocus>


    </div>
  )
}




// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTENT PANEL — Animated metadata below prism
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ContentPanel({ anime }: { anime: Anime }) {
  const [displayed, setDisplayed] = useState(anime)
  const [opacity, setOpacity] = useState(1)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (anime.id === displayed.id) return

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
  }, [anime, displayed.id])

  const isDefault = displayed.id === 'default'

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 1000,
        margin: '0 auto',
        padding: '40px clamp(24px, 5vw, 80px) 120px',
        opacity,
        transition: `opacity ${FADE_MS}ms ease`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 800 }}>
        {/* Title */}
        <h2
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(28px, 3.5vw, 42px)',
            color: 'var(--adaptive-hero-color)',
            margin: '0 0 10px 0',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {displayed.title}
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: 'clamp(14px, 1.5vw, 18px)',
            color: displayed.accentColor,
            margin: '0 0 24px 0',
            opacity: 0.9,
            letterSpacing: '0.02em',
          }}
        >
          {displayed.subtitle}
        </p>

        {/* Description */}
        {displayed.description && (
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: 'clamp(14px, 1.2vw, 16px)',
              color: 'var(--adaptive-hero-muted)',
              margin: '0 auto 32px auto',
              lineHeight: 1.7,
              maxWidth: 720,
            }}
          >
            {displayed.description}
          </p>
        )}

        {/* Metadata tags */}
        {!isDefault && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 }}>
            {displayed.characters.map((c) => (
              <span
                key={c.name}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--adaptive-hero-secondary)',
                  background: 'var(--adaptive-glass-bg)',
                  border: '1px solid var(--adaptive-glass-border)',
                  borderRadius: 20,
                  padding: '6px 14px',
                  letterSpacing: '0.03em',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {c.name}
                <span style={{ opacity: 0.5, marginLeft: 6 }}>·</span>
                <span style={{ opacity: 0.5, marginLeft: 6 }}>{c.role}</span>
              </span>
            ))}
          </div>
        )}

        {/* Quote */}
        {displayed.quotes.length > 0 && (
          <blockquote
            style={{
              fontFamily: "'Inter', sans-serif",
              fontStyle: 'italic',
              fontSize: 'clamp(14px, 1.5vw, 18px)',
              color: 'var(--adaptive-hero-muted)',
              margin: '20px auto',
              padding: '16px 24px',
              borderLeft: `3px solid ${displayed.accentColor}`,
              borderRight: `3px solid ${displayed.accentColor}`,
              background: `linear-gradient(90deg, ${displayed.accentColor}15 0%, transparent 20%, transparent 80%, ${displayed.accentColor}15 100%)`,
              borderRadius: 8,
              lineHeight: 1.6,
              maxWidth: 600,
            }}
          >
            "{displayed.quotes[0]}"
          </blockquote>
        )}

        {/* Accent underline */}
        <div
          style={{
            marginTop: 40,
            height: 3,
            width: 80,
            borderRadius: 2,
            backgroundColor: displayed.accentColor,
            opacity: 0.8,
            margin: '40px auto 0 auto',
            boxShadow: `0 0 10px ${displayed.accentColor}`,
          }}
        />
      </div>
    </div>
  )
}
