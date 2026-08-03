'use client'

import React, { useState, useEffect } from 'react'
import { Mail, Github, MessageSquare, Coffee, Terminal, VolumeX, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useUI, RenderMode } from '@/components/providers/UIProvider'
import { useMediaOrchestrator, useMediaSession } from '@/components/providers/MediaOrchestrator'
import { assetRegistry } from '@/lib/media/UniversalAssetRegistry'
import { getAnimeAudioMuted, toggleAnimeAudioMuted, onAnimeAudioMutedChange } from '@/features/anime-universe/lib/audio-control'
import { cn } from '@/lib/utils'


const VINYL_SVG_DATA_URL = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI5MCIgcj0iNDgiIGZpbGw9IiMxMjEyMTIiIC8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDgiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MiIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzOCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzNCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzMCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIyNiIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxOCIgZmlsbD0iI0VFRUVFRSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxOCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iMC4xIiAvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjIiIGZpbGw9IiMwMDAiIC8+PHBhdGggZD0iTSA1MCAxMCBBIDQwIDQwIDAgMCAxIDkwIDUwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgb3BhY2l0eT0iMC4zIiAvPjwvc3ZnPg==`

function RotatingVinyl({ size = 20, isActive = false, isBright = false }: { size?: number; isActive?: boolean; isBright?: boolean }) {
  return (
    <motion.div
      className="relative flex items-center justify-center rounded-full overflow-hidden"
      style={{ width: size, height: size }}
      animate={isActive ? { rotate: 360 } : { rotate: 0 }}
      transition={isActive ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
    >
      <img
        src={VINYL_SVG_DATA_URL}
        alt="Audio disk"
        className="w-full h-full object-contain"
        style={{
          filter: isBright
            ? 'brightness(0.3) contrast(1.2)'
            : 'brightness(1.5) contrast(1.1) drop-shadow(0 0 4px rgba(34, 211, 238, 0.4))',
        }}
      />
    </motion.div>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

interface SocialItem {
  label: string
  href?: string
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  isExternal?: boolean
  isMail?: boolean
  isInternal?: boolean
  view?: 'dashboard' | 'msg'
}

const socialItems: SocialItem[] = [
  { label: 'X (Twitter)', href: 'https://x.com/TensorThrottleX', icon: XIcon, isExternal: true },
  { label: 'Email', href: 'mailto:tensorthrottleX@proton.me', icon: Mail, isMail: true },
  { label: 'GitHub', href: 'https://github.com/TensorThrottleX', icon: Github, isExternal: true },
  { label: 'Message', icon: MessageSquare, isInternal: true, view: 'msg' },
  { label: 'Support', href: 'https://buymeacoffee.com/TensorThrottleX', icon: Coffee, isExternal: true },
]

function DockTooltip({ label }: { label: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none flex flex-col items-center justify-center text-center"
      style={{
        minWidth: 'max-content'
      }}
    >
      {label}
    </motion.div>
  )
}

export function BottomFloatingBar() {
  const { renderMode, toggleRenderMode, isTerminalOpen, setIsTerminalOpen, mainView, setMainView, setUiMode, isBooting } = useUI()
  const pathname = usePathname()
  const isAnimeUniverse = pathname.startsWith('/universe/anime')
  
  // ── Session Architecture: Bottom Nav owns the persistent GLOBAL_BACKGROUND session (Priority 10) ──
  const { sessionId, updateSession } = useMediaSession({
    scope: 'navigation',
    priority: 10,
    mode: 'GLOBAL_BACKGROUND',
    assetPackage: assetRegistry.resolve('default', 'default'),
    videoEnabled: false,
    audioEnabled: false,
  })

  const { activeSession, sessions, isAudioMuted, isVideoDisabled } = useMediaOrchestrator()

  // Read toggle state from the nav's own session (not activeSession, which may be a page session)
  const ownSession = sessions.get(sessionId)
  const ownVideoEnabled = ownSession?.videoEnabled === true
  const ownAudioEnabled = ownSession?.audioEnabled === true

  const [mounted, setMounted] = useState(false)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [videoIndex, setVideoIndex] = useState(0)
  const [audioIndex, setAudioIndex] = useState(0)
  const [animeMuted, setAnimeMuted] = useState(false)

  useEffect(() => {
    setAnimeMuted(getAnimeAudioMuted())
    return onAnimeAudioMutedChange(setAnimeMuted)
  }, [])
  
  const [bgAssets, setBgAssets] = useState<{ videos: { name: string, path: string }[], sounds: { name: string, path: string }[] }>({ videos: [], sounds: [] })

  useEffect(() => {
    setMounted(true)
    assetRegistry.fetchBackgroundAssets().then(setBgAssets)
  }, [])

  if (!mounted || isBooting) return null

  const isBright = renderMode === 'bright'
  
  const capabilities = activeSession?.capabilities ?? {
    supportsBackgroundSwitch: true,
    supportsAudioToggle: true,
    supportsThemeSwitch: true,
  }

  const supportsVideo = capabilities.supportsBackgroundSwitch !== false && !isAnimeUniverse
  const supportsAudio = capabilities.supportsAudioToggle !== false && !isAnimeUniverse
  const supportsTheme = capabilities.supportsThemeSwitch !== false

  const handleTerminalToggle = () => {
    setIsTerminalOpen(prev => !prev)
  }

  const handleModeToggle = (e: React.MouseEvent) => {
    const nextMode: RenderMode = renderMode === 'bright' ? 'dark' : 'bright'
    toggleRenderMode(e, nextMode)
    const updatedPkg = ownSession?.assetPackage || assetRegistry.resolve('default', 'default')
    updatedPkg.theme = nextMode as 'dark' | 'bright' | 'dynamic'
    updateSession({ assetPackage: updatedPkg })
  }

  const handleToggleVideo = () => {
    if (bgAssets.videos.length === 0) return
    const currentPkg = ownSession?.assetPackage ?? assetRegistry.resolve('default', 'default')

    if (!ownVideoEnabled) {
      // Resume playback from start
      setVideoIndex(0)
      updateSession({
        videoEnabled: true,
        assetPackage: { ...currentPkg, videoUrl: bgAssets.videos[0].path },
      })
    } else {
      // Advance or turn off
      if (videoIndex < bgAssets.videos.length - 1) {
        const nextIndex = videoIndex + 1
        setVideoIndex(nextIndex)
        updateSession({
          videoEnabled: true,
          assetPackage: { ...currentPkg, videoUrl: bgAssets.videos[nextIndex].path },
        })
      } else {
        updateSession({ videoEnabled: false })
      }
    }
  }

  const handleCycleVideo = (direction: 1 | -1) => {
    if (bgAssets.videos.length === 0) return
    const nextIndex = Math.max(0, Math.min(videoIndex + direction, bgAssets.videos.length - 1))
    if (nextIndex === videoIndex) return
    setVideoIndex(nextIndex)
    const currentPkg = ownSession?.assetPackage ?? assetRegistry.resolve('default', 'default')
    updateSession({
      videoEnabled: ownVideoEnabled,
      assetPackage: { ...currentPkg, videoUrl: bgAssets.videos[nextIndex].path },
    })
  }

  const handleToggleAudio = () => {
    if (bgAssets.sounds.length === 0) return
    const currentPkg = ownSession?.assetPackage ?? assetRegistry.resolve('default', 'default')

    if (!ownAudioEnabled) {
      // Resume playback from start
      setAudioIndex(0)
      updateSession({
        audioEnabled: true,
        assetPackage: { ...currentPkg, audioUrl: bgAssets.sounds[0].path },
      })
    } else {
      // Advance or turn off
      if (audioIndex < bgAssets.sounds.length - 1) {
        const nextIndex = audioIndex + 1
        setAudioIndex(nextIndex)
        updateSession({
          audioEnabled: true,
          assetPackage: { ...currentPkg, audioUrl: bgAssets.sounds[nextIndex].path },
        })
      } else {
        updateSession({ audioEnabled: false })
      }
    }
  }

  const handleCycleAudio = (direction: 1 | -1) => {
    if (bgAssets.sounds.length === 0) return
    const nextIndex = Math.max(0, Math.min(audioIndex + direction, bgAssets.sounds.length - 1))
    if (nextIndex === audioIndex) return
    setAudioIndex(nextIndex)
    const currentPkg = ownSession?.assetPackage ?? assetRegistry.resolve('default', 'default')
    updateSession({
      audioEnabled: ownAudioEnabled,
      assetPackage: { ...currentPkg, audioUrl: bgAssets.sounds[nextIndex].path },
    })
  }

  const getScale = (key: string, hovered: string | null, keys: string[]): number => {
    if (!hovered) return 1
    const hi = keys.indexOf(hovered)
    const ci = keys.indexOf(key)
    if (hi === -1 || ci === -1) return 1
    const dist = Math.abs(ci - hi)
    const MAX = 1.45
    const SIGMA = 1.4
    return 1 + (MAX - 1) * Math.exp(-(dist * dist) / (2 * SIGMA * SIGMA))
  }

  const tooltipLabels: Record<string, React.ReactNode> = {
    'X (Twitter)': <span className="uppercase font-bold tracking-widest text-[11px] opacity-80">X</span>,
    'Email': <span className="uppercase font-bold tracking-widest text-[11px] opacity-80">Email</span>,
    'GitHub': <span className="uppercase font-bold tracking-widest text-[11px] opacity-80">GitHub</span>,
    'Message': <span className="uppercase font-bold tracking-widest text-[11px] opacity-80">Message</span>,
    'Support': <span className="uppercase font-bold tracking-widest text-[11px] opacity-80">Support</span>,
    'console': <span className="uppercase font-bold tracking-widest text-[11px] opacity-80">Console</span>,
    'anime-mute': (
      <span className={`uppercase font-bold tracking-widest text-[11px] opacity-80 ${isBright ? 'text-black' : 'text-white'}`}>
        Anime Audio: {animeMuted ? 'Muted' : 'Playing'}
      </span>
    ),
    'audio': ownAudioEnabled && bgAssets.sounds.length > 0 ? (
      <div className={`flex flex-col items-center tracking-widest ${isBright ? 'text-black' : 'text-white'}`}>
        <span className="font-bold text-[11px] uppercase opacity-90">{bgAssets.sounds[audioIndex].name}</span>
        <span className="text-[10px] opacity-60 mt-1">{audioIndex + 1}</span>
      </div>
    ) : (
      <span className={`uppercase font-bold tracking-widest text-[11px] opacity-80 ${isBright ? 'text-black' : 'text-white'}`}>Audio: Disabled</span>
    ),
    'bg': ownVideoEnabled && bgAssets.videos.length > 0 ? (
      <div className={`flex flex-col items-center tracking-widest ${isBright ? 'text-black' : 'text-white'}`}>
        <span className="font-bold text-[11px] uppercase opacity-90">{bgAssets.videos[videoIndex].name}</span>
        <span className="text-[10px] opacity-60 mt-1">{videoIndex + 1}</span>
      </div>
    ) : (
      <span className={`uppercase font-bold tracking-widest text-[11px] opacity-80 ${isBright ? 'text-black' : 'text-white'}`}>Video: Disabled</span>
    ),
    'theme': <span className="uppercase font-bold tracking-widest text-[11px] opacity-80">Theme: {renderMode.toUpperCase()}</span>,
    'anime-badge': <span className="uppercase font-bold tracking-widest text-[11px] opacity-80">Active Session: Anime</span>,
  }

  const hoverKeys: string[] = []

  interface RenderedItem {
    key: string
    isActive: boolean
    node: React.ReactNode
  }

  const renderedItems: RenderedItem[] = []

  socialItems.forEach((item) => {
    const Icon = item.icon
    const isActive = item.isInternal ? mainView === item.view : false
    hoverKeys.push(item.label)

    renderedItems.push({
      key: item.label,
      isActive,
      node: item.isInternal ? (
        <button
          onClick={() => {
            if (item.view) {
              setMainView(item.view)
              setUiMode('default')
            }
          }}
          aria-label={item.label}
          className="w-full h-full flex items-center justify-center rounded-full"
        >
          <Icon size={16} strokeWidth={2} />
        </button>
      ) : (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className="w-full h-full flex items-center justify-center rounded-full"
        >
          {item.label.includes('X') ? (
            <Icon className="h-4 w-4" />
          ) : (
            <Icon size={16} strokeWidth={2} />
          )}
        </a>
      ),
    })
  })

  renderedItems.push({
    key: 'divider',
    isActive: false,
    node: (
      <div
        className="w-px h-6 self-center mx-0.5 transition-colors duration-500"
        style={{ backgroundColor: isBright ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' }}
      />
    ),
  })

  hoverKeys.push('console')
  renderedItems.push({
    key: 'console',
    isActive: isTerminalOpen,
    node: (
      <button
        onClick={handleTerminalToggle}
        aria-label="Toggle Console"
        className="w-full h-full flex items-center justify-center rounded-full"
      >
        <Terminal size={16} strokeWidth={2} />
      </button>
    ),
  })

  if (isAnimeUniverse) {
    hoverKeys.push('anime-mute')
    renderedItems.push({
      key: 'anime-mute',
      isActive: !animeMuted,
      node: (
        <button
          onClick={toggleAnimeAudioMuted}
          aria-label={animeMuted ? 'Unmute anime audio' : 'Mute anime audio'}
          className="w-full h-full flex items-center justify-center rounded-full"
        >
          {animeMuted ? (
            <VolumeX size={16} strokeWidth={2} className="opacity-55" />
          ) : (
            <RotatingVinyl size={24} isActive={true} isBright={isBright} />
          )}
        </button>
      ),
    })
  }

  if (supportsAudio) {
    hoverKeys.push('audio')
    renderedItems.push({
      key: 'audio',
      isActive: ownAudioEnabled,
      node: (
        <button
          onClick={handleToggleAudio}
          onContextMenu={(e) => { e.preventDefault(); handleCycleAudio(1) }}
          onWheel={(e) => { e.preventDefault(); handleCycleAudio(e.deltaY > 0 ? 1 : -1) }}
          aria-label="Toggle Sound"
          className="w-full h-full flex items-center justify-center rounded-full overflow-hidden transition-opacity duration-500"
        >
          {(!ownAudioEnabled || (ownAudioEnabled && audioIndex === bgAssets.sounds.length - 1)) ? (
            <VolumeX size={16} strokeWidth={2} className="opacity-55" />
          ) : (
            <RotatingVinyl size={24} isActive={true} isBright={isBright} />
          )}
        </button>
      ),
    })
  }

  if (supportsVideo) {
    hoverKeys.push('bg')
    renderedItems.push({
      key: 'bg',
      isActive: ownVideoEnabled,
      node: (
        <button
          onClick={handleToggleVideo}
          onContextMenu={(e) => { e.preventDefault(); handleCycleVideo(1) }}
          onWheel={(e) => { e.preventDefault(); handleCycleVideo(e.deltaY > 0 ? 1 : -1) }}
          aria-label="Toggle Background Video"
          className={`relative w-full h-full flex items-center justify-center rounded-full transition-opacity duration-500 ${(!ownVideoEnabled || (ownVideoEnabled && videoIndex === bgAssets.videos.length - 1)) ? 'opacity-55' : ''}`}
        >
          <Monitor size={16} strokeWidth={2} />
          {ownVideoEnabled && videoIndex !== bgAssets.videos.length - 1 && (
            <span className="absolute bottom-1 right-1 text-[8px] font-bold leading-none" style={{ color: isBright ? '#000' : '#fff' }}>
              {videoIndex + 1}
            </span>
          )}
        </button>
      ),
    })
  }

  if (supportsTheme) {
    hoverKeys.push('theme')
    renderedItems.push({
      key: 'theme',
      isActive: false,
      node: (
        <button
          onClick={handleModeToggle}
          aria-label="Toggle Theme Mode"
          className="w-full h-full flex items-center justify-center rounded-full"
        >
          <div
            className="w-3.5 h-3.5 rounded-full border transition-all duration-500 relative flex items-center justify-center shadow-inner"
            style={{
              backgroundColor: renderMode === 'bright' ? '#fff' : '#000',
              borderColor: renderMode === 'bright' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
            }}
          />
        </button>
      ),
    })
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto select-none">
      <div
        className="flex items-center gap-1 rounded-2xl py-2 px-2.5 backdrop-blur-2xl border transition-colors duration-500"
        style={{
          backgroundColor: 'var(--glass-bg)',
          borderColor: 'var(--glass-border)',
          boxShadow: 'var(--adaptive-glass-shadow)',
        }}
        onMouseLeave={() => setHoveredKey(null)}
      >
        {renderedItems.map((item) => {
          if (item.key === 'divider') {
            return <div key="divider">{item.node}</div>
          }

          const scale = getScale(item.key, hoveredKey, hoverKeys)
          const tooltip = tooltipLabels[item.key]

          return (
            <motion.div
              key={item.key}
              className="relative flex items-center justify-center"
              animate={{
                scale,
                y: hoveredKey === item.key ? -2 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 25,
                mass: 0.5,
              }}
              onMouseEnter={() => setHoveredKey(item.key)}
              whileTap={{ scale: scale * 0.92, transition: { duration: 0.08 } }}
            >
              <div
                className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200",
                  isBright
                    ? item.isActive
                      ? "bg-black/8 text-cyan-600"
                      : "text-gray-700 hover:bg-black/5"
                    : item.isActive
                      ? "bg-white/10 text-cyan-400"
                      : "text-white/70 hover:bg-white/8"
                )}
                style={
                  item.isActive
                    ? isBright
                      ? { backgroundColor: 'rgba(0,0,0,0.06)' }
                      : { backgroundColor: 'rgba(255,255,255,0.1)' }
                    : undefined
                }
              >
                {item.node}
              </div>

              <AnimatePresence>
                {hoveredKey === item.key && (
                  <DockTooltip label={tooltip} />
                )}
              </AnimatePresence>

              {item.isActive && (
                <motion.div
                  layoutId="dock-active-dot"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div
                    className={cn(
                      "w-1 h-1 rounded-full",
                      isBright ? "bg-cyan-600" : "bg-cyan-400"
                    )}
                    style={isBright ? undefined : { boxShadow: '0 0 6px rgba(34,211,238,0.6)' }}
                  />
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
