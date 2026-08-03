'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useUI, RenderMode } from '@/components/providers/UIProvider'
import { useMediaOrchestrator } from '@/components/providers/MediaOrchestrator'
import {
  ChevronLeft, Mail, Github, MessageSquare, Coffee,
  Terminal, VolumeX, Monitor
} from 'lucide-react'
import { cn } from '@/lib/utils'

const VINYL_SVG_DATA_URL = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDgiIGZpbGw9IiMxMjEyMTIiIC8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDgiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MiIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzOCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzNCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzMCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIyNiIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxOCIgZmlsbD0iI0VFRUVFRSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxOCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iMC4xIiAvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjIiIGZpbGw9IiMwMDAiIC8+PHBhdGggZD0iTSA1MCAxMCBBIDQwIDQwIDAgMCAxIDkwIDUwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgb3BhY2l0eT0iMC4zIiAvPjwvc3ZnPg==`

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function MobileNavbar() {
  const pathname = usePathname()
  const isAnimeUniverse = pathname.startsWith('/universe/anime')
  const { renderMode, toggleRenderMode, setIsTerminalOpen, setMainView, setUiMode, isBooting, navUtilityExpanded, setNavUtilityExpanded } = useUI()
  const {
    activeSession,
    updateSession,
    sessions,
    isVideoDisabled,
    toggleVideoDisable,
    isAudioMuted,
    toggleAudioMute
  } = useMediaOrchestrator()
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setNavUtilityExpanded(false)
    }
    handler(mql)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [setNavUtilityExpanded])

  useEffect(() => {
    if (!navUtilityExpanded) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setNavUtilityExpanded(false)
      }
    }
    document.addEventListener('pointerdown', handler, { passive: true })
    return () => document.removeEventListener('pointerdown', handler)
  }, [navUtilityExpanded, setNavUtilityExpanded])

  if (!mounted || isBooting) return null
  const isBright = renderMode === 'bright'

  const handleModeToggle = (e: React.MouseEvent) => {
    const nextMode: RenderMode = renderMode === 'bright' ? 'dark' : 'bright'
    toggleRenderMode(e, nextMode)
  }

  const handleNextBackground = () => {
    if (activeSession?.id) {
      const current = activeSession.videoEnabled !== false
      updateSession(activeSession.id, { videoEnabled: !current })
    }
  }

  const handleNextSound = () => {
    if (activeSession?.id) {
      const current = activeSession.audioEnabled !== false
      updateSession(activeSession.id, { audioEnabled: !current })
    }
  }

  return (
    <div ref={containerRef} className="fixed top-1 left-1/2 -translate-x-1/2 z-[150] pointer-events-auto">
      <nav
        className="relative h-10 flex items-center gap-4 px-5 rounded-full border backdrop-blur-[32px] transition-all duration-500 overflow-hidden w-fit"
        style={{
          backgroundColor: isBright ? 'rgba(255,255,255,0.55)' : 'rgba(8,8,12,0.55)',
          borderColor: isBright ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
          boxShadow: isBright
            ? '0 8px 32px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7)'
            : `0 8px 32px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04),
               0 0 60px rgba(34,211,238,0.03)`,
        }}
      >
        <div
          onClick={() => {
            setMainView('dashboard')
            setUiMode('default')
            window.location.href = '/'
          }}
          className="flex items-center gap-2.5 cursor-pointer group relative z-10 shrink-0"
        >
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center font-black text-[9px] transition-transform duration-300 group-hover:scale-105",
            isBright
              ? "bg-[#E5E2DD] text-black border border-black/15"
              : "bg-black text-white border border-white/15"
          )}>
            TX
          </div>
        </div>

        <div className="flex items-center gap-1.5 relative z-10 shrink-0">
          <button
            onClick={() => setIsTerminalOpen(true)}
            className="px-3 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              color: isBright ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
              border: isBright ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/70 animate-pulse" />
            CONSOLE
          </button>

          <button
            onClick={() => setNavUtilityExpanded(prev => !prev)}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90"
            style={{
              backgroundColor: isBright ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
              color: isBright ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
            }}
            aria-label={navUtilityExpanded ? 'Collapse utilities' : 'Expand utilities'}
          >
            <motion.div
              animate={{ rotate: navUtilityExpanded ? 0 : 180 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <ChevronLeft size={14} />
            </motion.div>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {navUtilityExpanded && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-12 left-0 right-0 rounded-2xl border backdrop-blur-[28px] shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--glass-bg)',
              borderColor: 'var(--glass-border)',
              boxShadow: isBright
                ? '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.7)'
                : '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="flex items-center gap-1 px-2.5 py-2.5 overflow-x-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {[
                {
                  key: 'x',
                  node: (
                    <a href="https://x.com/TensorThrottleX" target="_blank" rel="noopener noreferrer"
                      onClick={() => setNavUtilityExpanded(false)}
                      className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-90 hover:bg-white/5 transition-all duration-200 shrink-0"
                      style={{ color: isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}
                      aria-label="X (Twitter)">
                      <XIcon className="h-[18px] w-[18px]" />
                    </a>
                  )
                },
                {
                  key: 'email',
                  node: (
                    <a href="mailto:tensorthrottleX@proton.me"
                      onClick={() => setNavUtilityExpanded(false)}
                      className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-90 hover:bg-white/5 transition-all duration-200 shrink-0"
                      style={{ color: isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}
                      aria-label="Email">
                      <Mail size={18} strokeWidth={2} />
                    </a>
                  )
                },
                {
                  key: 'github',
                  node: (
                    <a href="https://github.com/TensorThrottleX" target="_blank" rel="noopener noreferrer"
                      onClick={() => setNavUtilityExpanded(false)}
                      className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-90 hover:bg-white/5 transition-all duration-200 shrink-0"
                      style={{ color: isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}
                      aria-label="GitHub">
                      <Github size={18} strokeWidth={2} />
                    </a>
                  )
                },
                {
                  key: 'msg',
                  node: (
                    <button
                      onClick={() => { setNavUtilityExpanded(false); setMainView('msg'); setUiMode('default') }}
                      className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-90 hover:bg-white/5 transition-all duration-200 shrink-0"
                      style={{ color: isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}
                      aria-label="Message">
                      <MessageSquare size={18} strokeWidth={2} />
                    </button>
                  )
                },
                {
                  key: 'support',
                  node: (
                    <a href="https://buymeacoffee.com/TensorThrottleX" target="_blank" rel="noopener noreferrer"
                      onClick={() => setNavUtilityExpanded(false)}
                      className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-90 hover:bg-white/5 transition-all duration-200 shrink-0"
                      style={{ color: isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}
                      aria-label="Support">
                      <Coffee size={18} strokeWidth={2} />
                    </a>
                  )
                },
                {
                  key: 'divider',
                  node: (
                    <div className="w-px h-8 shrink-0 mx-0.5"
                      style={{ backgroundColor: isBright ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />
                  )
                },
                {
                  key: 'console',
                  node: (
                    <button
                      onClick={() => { setNavUtilityExpanded(false); setIsTerminalOpen(prev => !prev) }}
                      className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-90 hover:bg-white/5 transition-all duration-200 shrink-0"
                      style={{ color: isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}
                      aria-label="Console">
                      <Terminal size={18} strokeWidth={2} />
                    </button>
                  )
                },
                {
                  key: 'audio',
                  node: (
                    <button onClick={handleNextSound}
                      className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-90 hover:bg-white/5 transition-all duration-200 shrink-0 overflow-hidden"
                      style={{ color: isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}
                      aria-label="Cycle Sound">
                      {activeSession?.audioEnabled === false ? (
                        <VolumeX size={18} strokeWidth={2} className="opacity-55" />
                      ) : (
                        <motion.div className="relative flex items-center justify-center rounded-full overflow-hidden"
                          style={{ width: 22, height: 22 }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                          <img src={VINYL_SVG_DATA_URL} alt="Audio disk" className="w-full h-full object-contain"
                            style={{ filter: isBright ? 'brightness(0.3) contrast(1.2)' : 'brightness(1.5) contrast(1.1) drop-shadow(0 0 4px rgba(34,211,238,0.4))' }} />
                        </motion.div>
                      )}
                    </button>
                  )
                },
                {
                  key: 'bg',
                  node: (
                    <button onClick={handleNextBackground}
                      className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-90 hover:bg-white/5 transition-all duration-200 shrink-0"
                      style={{ color: isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)' }}
                      aria-label="Cycle Background">
                      <Monitor size={18} strokeWidth={2} />
                    </button>
                  )
                },
                {
                  key: 'theme',
                  node: (
                    <button onClick={handleModeToggle}
                      className="w-11 h-11 flex items-center justify-center rounded-xl active:scale-90 hover:bg-white/5 transition-all duration-200 shrink-0"
                      aria-label="Toggle Theme Mode">
                      <div className="w-[18px] h-[18px] rounded-full border transition-all duration-500"
                        style={{
                          backgroundColor: renderMode === 'bright' ? '#fff' : '#000',
                          borderColor: renderMode === 'bright' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
                        }} />
                    </button>
                  )
                },
              ].filter(item => !isAnimeUniverse || (item.key !== 'audio' && item.key !== 'bg')).map((item, i) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: 24, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: 24, filter: 'blur(4px)' }}
                  transition={{ duration: 0.25, delay: i * 0.025, ease: [0.22, 1, 0.36, 1] }}
                >
                  {item.node}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
