'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, List, Folder, FlaskConical, Globe, Maximize, Target, Crosshair, Brain, Layers, Monitor, VolumeX } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// SVG Data URL for the Vinyl Icon (Ensures visibility despite local server asset loading issues)
const VINYL_SVG_DATA_URL = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDgiIGZpbGw9IiMxMjEyMTIiIC8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDgiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MiIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzOCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzNCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzMCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIyNiIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxOCIgZmlsbD0iI0VFRUVFRSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxOCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iMC4xIiAvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjIiIGZpbGw9IiMwMDAiIC8+PHBhdGggZD0iTSA1MCAxMCBBIDQwIDQwIDAgMCAxIDkwIDUwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgb3BhY2l0eT0iMC4zIiAvPjwvc3ZnPg==`;

// Animated rotating vinyl disk
function RotatingVinyl({ size = 18, isActive = false, isBright = false }: { size?: number; isActive?: boolean; isBright?: boolean }) {
  return (
    <motion.div
      className="relative flex items-center justify-center p-1"
      style={{ width: size, height: size }}
      animate={isActive ? { rotate: 360 } : { rotate: 0 }}
      transition={isActive ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
    >
      <img
        src={VINYL_SVG_DATA_URL}
        alt="Audio"
        className="w-full h-full object-contain"
        style={{
          filter: isBright
            ? 'brightness(0.3) contrast(1.2)'
            : 'brightness(1.5) contrast(1.1) drop-shadow(0 0 8px rgba(34, 211, 238, 0.4))',
        }}
      />
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full bg-cyan-400/10"
          animate={{
            boxShadow: isBright ? "0 0 15px rgba(0,0,0,0.1)" : "0 0 20px rgba(34, 211, 238, 0.3)"
          }}
        />
      )}
    </motion.div>
  )
}
import { useTransition } from 'react'
import { useUI, RenderMode } from '@/components/providers/UIProvider'
import { useMedia } from '@/components/providers/MediaProvider'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Feed', href: '/feed', icon: List },
  { label: 'Thoughts', href: '/category/thoughts', icon: Brain },
  { label: 'Projects', href: '/category/projects', icon: Folder },
  { label: 'Experiments', href: '/category/experiments', icon: FlaskConical },
  { label: 'Manifold', href: '/category/manifold', icon: Layers },
]

export function LabNavigation({ activeHref }: { activeHref?: string }): React.ReactNode {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { renderMode, toggleRenderMode, isTerminalOpen, setIsTerminalOpen, setMainView, setUiMode } = useUI()
  const {
    theme, setTheme,
    videoState, setVideoIndex,
    soundState, setSoundIndex,
    config
  } = useMedia()

  const isActive = (href: string): boolean => {
    if (activeHref) return activeHref === href
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string): void => {
    e.preventDefault()

    // [CRITICAL_SYNC] – Reset all sectional and immersive states before navigation
    setMainView('dashboard')
    setUiMode('default')

    // Check for native View Transitions support
    if (!(document as any).startViewTransition) {
      router.push(href)
      return
    }

    (document as any).startViewTransition(() => {
      startTransition(() => {
        router.push(href)
      })
    })
  }

  const handleModeToggle = (e: React.MouseEvent) => {
    const modes: RenderMode[] = ['bright', 'dark', 'custom']
    const nextIdx = (modes.indexOf(renderMode as any) + 1) % modes.length
    const nextMode = modes[nextIdx]
    toggleRenderMode(e, nextMode as any)

    // Sync with MediaEngine theme if it's one of the base themes
    // Sync with MediaEngine theme
    if (nextMode === 'bright' || nextMode === 'dark') {
      setTheme(nextMode)
    } else if (nextMode === 'custom') {
      setTheme('custom')
    }
  }

  const handleNextBackground = () => {
    const totalVideos = config.videos.length
    let nextIndex = videoState.index + 1

    // Cycle: -2 (white) -> -1 (black) -> 0...n (videos)
    if (nextIndex >= totalVideos) {
      nextIndex = -2
    }
    setVideoIndex(nextIndex)
  }

  const handleNextSound = () => {
    const totalSounds = config.sounds.length
    let nextIndex = soundState.soundIndex + 1

    // Cycle: -1 (muted) -> 0...n (sounds)
    if (nextIndex >= totalSounds) {
      nextIndex = -1
    }
    setSoundIndex(nextIndex)
  }

  const activeVideoName = videoState.index >= 0 ? config.videos[videoState.index]?.name : (videoState.index === -1 ? 'BLACK' : 'OFF')
  const activeSoundName = soundState.soundIndex >= 0 ? config.sounds[soundState.soundIndex]?.name : 'MUTED'

  return (
    <div className="sidebar hidden md:flex fixed left-0 top-0 h-full items-center px-4 z-[60] pointer-events-none transition-[opacity,transform] duration-500 ease-in-out">
      {/* Navigation Panel: Floating glass capsule */}
      <div
        className="flex flex-col gap-3 rounded-full px-3 py-6 backdrop-blur-lg backdrop-saturate-150 border transition-colors duration-300 pointer-events-auto"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
          boxShadow: 'var(--shadow-premium)'
        }}
      >
        {navItems.map((item) => {
          const ActiveIcon = item.icon
          const active = isActive(item.href)

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavigation(e, item.href)}
              className={`group relative flex flex-col items-center justify-center gap-1 rounded-full w-12 h-12 transition-[transform,background-color,color,box-shadow] duration-300 ${active
                ? 'scale-105 shadow-md'
                : 'hover:scale-110'
                }`}
              style={{
                backgroundColor: active ? 'var(--card-bg)' : 'transparent',
                color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                boxShadow: active ? 'var(--shadow-soft)' : 'none'
              }}
              title={item.label}
            >
              <span className="text-lg transition-transform group-hover:-translate-y-0.5" style={{ color: active ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                <ActiveIcon size={20} strokeWidth={2} />
              </span>

              <span className="absolute left-14 hidden rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-tighter backdrop-blur-sm group-hover:block whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
              >
                {item.label}
              </span>

              {active && (
                <div
                  className="absolute -left-1 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: renderMode === 'bright' ? '#000000' : '#22d3ee',
                    boxShadow: renderMode === 'bright' ? 'none' : '0 0 8px rgba(34,211,238,0.8)'
                  }}
                />
              )}
            </a>
          )
        })}

        <div className="h-px w-6 bg-white/10 my-1 self-center" />

        <button
          onClick={handleModeToggle}
          className={`group relative flex flex-col items-center justify-center gap-1 rounded-full w-12 h-12 transition-[background-color,border-color,color,box-shadow,transform] duration-300 border
            ${renderMode === 'bright' ? 'bg-[#ffffff] border-black/10 text-black shadow-lg shadow-black/5' :
              renderMode === 'dark' ? 'bg-[#111111] border-white/10 text-white' :
                renderMode === 'custom' ? 'bg-indigo-900 border-indigo-400/50 text-indigo-100 shadow-xl shadow-indigo-500/20' :
                  'bg-black/40 border-cyan-500/30 text-cyan-400'}
          `}
          title={`Mode: ${renderMode.toUpperCase()}`}
        >
          <div className={`w-4 h-4 rounded-full transition-all duration-500 relative flex items-center justify-center
                ${renderMode === 'bright' ? 'border-[1.5px] border-black/80' :
              renderMode === 'dark' ? 'bg-black border border-white/20' :
                renderMode === 'custom' ? 'bg-white shadow-[0_0_15px_#fff]' :
                  'bg-cyan-500/20 shadow-[0_0_10px_#22d3ee]'}
          `}>
            {renderMode === 'custom' && <div className="absolute w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />}
          </div>
          <span className="absolute left-14 hidden rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-tighter backdrop-blur-sm group-hover:block whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200"
            style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
          >
            {renderMode} MODE
          </span>
        </button>

        {renderMode === 'custom' && (
          <>
            <div className="h-px w-6 bg-white/10 my-1 self-center" />



            <button
              onClick={handleNextBackground}
              className="group relative flex flex-col items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              <Monitor size={18} />
              <span className="absolute left-14 hidden rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-tighter backdrop-blur-sm group-hover:block whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
              >
                BG: {activeVideoName}
              </span>
            </button>

            <div className="group relative">
              <button
                onClick={handleNextSound}
                className={`flex flex-col items-center justify-center w-12 h-12 rounded-full border transition-all duration-500 overflow-hidden
                  ${soundState.soundIndex !== -1 ? 'border-green-500/30' : 'bg-white/5 border-white/10 text-white/40'}
                `}
              >
                <AnimatePresence mode="wait">
                  {soundState.soundIndex === -1 ? (
                    <motion.div
                      key="muted"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <VolumeX size={20} strokeWidth={1.5} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="playing"
                      initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                      animate={{ opacity: 1, rotate: 0, scale: 1 }}
                      exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      <RotatingVinyl size={44} isActive={true} isBright={false} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              <span className="absolute left-14 hidden rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-tighter backdrop-blur-sm group-hover:block whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
              >
                AUDIO: {activeSoundName}
              </span>
            </div>


          </>
        )}
      </div>
    </div>
  )
}
