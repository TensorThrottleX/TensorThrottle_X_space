
'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, List, Brain, Folder, FlaskConical, Layers } from 'lucide-react'
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
  const { renderMode, setRenderMode, setIsPrecision, setMainView, setUiMode } = useUI()
  const {
    theme, setTheme,
    videoState, setVideoIndex, setVideoAudio,
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
    setIsPrecision(false)

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

  const handleModeToggle = () => {
    const modes: RenderMode[] = ['normal', 'bright', 'dark', 'custom']
    const nextIdx = (modes.indexOf(renderMode as any) + 1) % modes.length
    const nextMode = modes[nextIdx]
    setRenderMode(nextMode as any)

    // Sync with MediaEngine theme if it's one of the base themes
    if (nextMode !== 'custom') {
      setTheme(nextMode as any)
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

  const activeVideoName = videoState.index >= 0 ? config.videos[videoState.index]?.name : (videoState.index === -1 ? 'BLACK' : 'WHITE')
  const activeSoundName = soundState.soundIndex >= 0 ? config.sounds[soundState.soundIndex]?.name : 'MUTED'

  return (
    <div className="sidebar fixed left-0 top-0 h-full flex items-center px-4 z-[60] pointer-events-none transition-[opacity,transform] duration-500 ease-in-out">
      {/* Navigation Panel: Floating glass capsule */}
      <div
        className="flex flex-col gap-3 rounded-full px-3 py-6 backdrop-blur-lg backdrop-saturate-150 border shadow-xl transition-colors duration-300 pointer-events-auto"
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderColor: 'var(--sidebar-border)',
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
                    backgroundColor: renderMode === 'bright' ? '#111' : '#22d3ee',
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
            ${renderMode === 'normal' ? 'bg-black/40 border-cyan-500/30 text-cyan-400' :
              renderMode === 'bright' ? 'bg-[#ffffff] border-black/10 text-black' :
                renderMode === 'custom' ? 'bg-indigo-900 border-indigo-400/50 text-indigo-100' :
                  'bg-[#111111] border-white/10 text-white'}
          `}
          title={`Mode: ${renderMode.toUpperCase()}`}
        >
          <div className={`w-4 h-4 rounded-full transition-all duration-500 relative flex items-center justify-center
                ${renderMode === 'normal' ? 'bg-cyan-500/20 shadow-[0_0_10px_#22d3ee]' :
              renderMode === 'bright' ? 'border-[1.5px] border-black/80' :
                renderMode === 'custom' ? 'bg-white shadow-[0_0_15px_#fff]' :
                  'bg-black border border-white/20'}
          `}>
            {renderMode === 'normal' && <div className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />}
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
              <FlaskConical size={18} />
              <span className="absolute left-14 hidden rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-tighter backdrop-blur-sm group-hover:block whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
              >
                BG: {activeVideoName}
              </span>
            </button>

            <button
              onClick={handleNextSound}
              className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-full border transition-all 
                ${soundState.soundIndex !== -1 ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-white/5 border-white/10 text-white/40'}
              `}
            >
              <Layers size={18} />
              <span className="absolute left-14 hidden rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-tighter backdrop-blur-sm group-hover:block whitespace-nowrap z-50 animate-in fade-in slide-in-from-left-2 duration-200"
                style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)' }}
              >
                AUDIO: {activeSoundName}
              </span>
            </button>

            {videoState.hasAudioTrack && videoState.index >= 0 && (
              <button
                onClick={() => setVideoAudio(!videoState.videoAudioEnabled)}
                className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-full border transition-all 
                  ${videoState.videoAudioEnabled ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : 'bg-white/5 border-white/10 text-white/40'}
                `}
              >
                <div className="text-[10px] font-bold">V-AUD</div>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
