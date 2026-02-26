// --- MobileBottomNav.tsx Updated ---

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, List, Folder, FlaskConical, Sun, Volume2, Layers, X, ToggleLeft, ToggleRight, Monitor, VolumeX } from 'lucide-react'
import { useTransition } from 'react'
import { useUI, RenderMode } from '@/components/providers/UIProvider'
import { useMedia } from '@/components/providers/MediaProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// SVG Data URL for the Vinyl Icon
const VINYL_SVG_DATA_URL = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDgiIGZpbGw9IiMxMjEyMTIiIC8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDgiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MiIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzOCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzNCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzMCIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIyNiIgc3Ryb2tlPSIjMUExQTFBIiBzdHJva2Utd2lkdGg9IjAuNSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxOCIgZmlsbD0iI0VFRUVFRSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIxOCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utb3BhY2l0eT0iMC4xIiAvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjIiIGZpbGw9IiMwMDAiIC8+PHBhdGggZD0iTSA1MCAxMCBBIDQwIDQwIDAgMCAxIDkwIDUwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgb3BhY2l0eT0iMC4zIiAvPjwvc3ZnPg==`;

// Animated rotating vinyl disk for mobile
function RotatingVinyl({ size = 20, isActive = false, isBright = false }: { size?: number; isActive?: boolean; isBright?: boolean }) {
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

interface MobileNavItem {
    label: string
    href: string
    icon: React.ElementType
    isAction?: boolean
}

const mobileNavItems: MobileNavItem[] = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Feed', href: '/feed', icon: List },
    { label: 'Projects', href: '/category/projects', icon: Folder },
    { label: 'Experiments', href: '/category/experiments', icon: FlaskConical },
    { label: 'Manifold', href: '/category/manifold', icon: Layers },
    { label: 'B/W', href: '#bw', icon: ToggleLeft, isAction: true },
]

export function MobileBottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const { renderMode, setRenderMode, setMainView, setUiMode } = useUI()
    const {
        theme, setTheme,
        soundState, setSoundIndex,
        videoState, setVideoIndex,
        config
    } = useMedia()

    const [showControls, setShowControls] = useState(false)
    const [clickCount, setClickCount] = useState(0)
    const isBright = renderMode === 'bright'

    const isActive = (href: string): boolean => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, item: MobileNavItem): void => {
        e.preventDefault()

        if (item.isAction && item.label === 'B/W') {
            const newCount = clickCount + 1
            setClickCount(newCount)

            // Cycle: Bright -> Dark -> Custom (with video) -> Bright
            const modes: RenderMode[] = ['bright', 'dark', 'custom']
            const nextMode = modes[(modes.indexOf(renderMode as any) + 1) % modes.length]

            handleModeToggle(nextMode as RenderMode)

            // 3rd Click Reveal
            if (newCount % 3 === 0) {
                setShowControls(true)
            }
            return
        }

        // Close controls if navigating elsewhere
        setShowControls(false)
        setClickCount(0) // Reset count on navigation?

        setMainView('dashboard')
        setUiMode('default')

        if (!(document as any).startViewTransition) {
            router.push(item.href)
            return
        }

        (document as any).startViewTransition(() => {
            startTransition(() => {
                router.push(item.href)
            })
        })
    }

    // --- Control Handlers ---

    const handleModeToggle = (mode: RenderMode) => {
        setRenderMode(mode)
        // Ensure theme matches for overlay logic
        if (mode === 'custom') {
            setTheme('custom')
        } else if (mode === 'dark') {
            setTheme('dark')
        } else {
            setTheme('bright')
        }
    }

    const handleNextSound = () => {
        const totalSounds = config.sounds.length
        let nextIndex = soundState.soundIndex + 1
        if (nextIndex >= totalSounds) nextIndex = -1
        setSoundIndex(nextIndex)
    }

    const handleNextBackground = () => {
        const totalVideos = config.videos.length
        let nextIndex = videoState.index + 1
        if (nextIndex >= totalVideos) nextIndex = -2
        setVideoIndex(nextIndex)
    }

    const activeSoundName = soundState.soundIndex >= 0 ? config.sounds[soundState.soundIndex]?.name : 'MUTED'
    const activeVideoName = videoState.index >= 0 ? config.videos[videoState.index]?.name : (videoState.index === -1 ? 'BLACK' : 'OFF')

    return (
        <nav
            className="mobile-bottom-nav fixed bottom-8 left-4 right-4 z-[200] backdrop-blur-3xl border rounded-full transition-colors duration-300 overflow-hidden shadow-[var(--shadow-premium)] mx-auto max-w-[400px]"
            style={{
                backgroundColor: isBright ? 'rgba(255,255,255,0.85)' : 'rgba(15,15,15,0.85)',
                borderColor: isBright ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                height: '4.5rem'
            }}
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {!showControls ? (
                    /* NAVIGATION TRAY */
                    <motion.div
                        key="nav"
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute inset-0 flex items-center overflow-x-auto no-scrollbar px-2"
                    >
                        {mobileNavItems.map((item) => {
                            const Icon = item.icon
                            const active = !item.isAction && isActive(item.href)

                            return (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    onClick={(e) => {
                                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                                            navigator.vibrate(10)
                                        }
                                        handleNavigation(e, item)
                                    }}
                                    className="relative flex flex-col items-center justify-center gap-1 flex-shrink-0 w-[20%] min-w-[20%] h-full transition-colors duration-200 active:scale-95"
                                    style={{
                                        color: active ? (isBright ? '#111' : '#22d3ee') : 'var(--muted-foreground)',
                                    }}
                                >
                                    {item.label === 'B/W' ? (
                                        <motion.div
                                            key={isBright ? 'bright' : 'dark'}
                                            initial={{ rotate: -180, scale: 0.8, opacity: 0 }}
                                            animate={{ rotate: 0, scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            {isBright ? <ToggleRight size={24} strokeWidth={2} /> : <ToggleLeft size={24} strokeWidth={2} />}
                                        </motion.div>
                                    ) : (
                                        <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                                    )}

                                    <span className={cn(
                                        "text-[10px] font-semibold tracking-wide uppercase",
                                        active ? 'opacity-100' : 'opacity-60'
                                    )}>
                                        {item.label === 'B/W' ? (isBright ? 'Bright' : 'Dark') : item.label}
                                    </span>

                                    {active && (
                                        <motion.div
                                            layoutId="mobile-nav-indicator"
                                            className="absolute top-0 w-8 h-0.5 rounded-full"
                                            style={{
                                                backgroundColor: isBright ? '#111' : '#22d3ee',
                                                boxShadow: isBright ? 'none' : '0 0 8px rgba(34,211,238,0.6)',
                                            }}
                                        />
                                    )}
                                </a>
                            )
                        })}
                    </motion.div>
                ) : (
                    /* SYSTEM CONTROL TRAY (Revealed on 3rd Click) */
                    <motion.div
                        key="system"
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="absolute inset-0 flex items-stretch justify-around px-2 h-16"
                    >
                        {/* 1. Back Button */}
                        <button
                            onClick={() => {
                                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
                                setShowControls(false)
                                setClickCount(0) // Reset count on close
                            }}
                            className="flex flex-col items-center justify-center gap-1 flex-1 active:scale-95"
                            style={{ color: 'var(--muted-foreground)' }}
                        >
                            <X size={20} strokeWidth={1.8} />
                            <span className="text-[10px] font-semibold tracking-wide uppercase opacity-60">Back</span>
                        </button>

                        <div className="w-px h-8 bg-white/10 self-center mx-1" />

                        {/* 2. Background Control */}
                        <button
                            onClick={() => {
                                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
                                handleNextBackground()
                            }}
                            className="flex flex-col items-center justify-center gap-1 flex-1 active:scale-95"
                            style={{ color: 'var(--foreground)' }}
                        >
                            <span className="text-[8px] font-mono opacity-50 truncate max-w-[60px]">{activeVideoName}</span>
                            <Monitor size={20} />
                            <span className="text-[10px] font-semibold tracking-wide uppercase opacity-80">BG</span>
                        </button>

                        {/* 3. Audio Control */}
                        <button
                            onClick={() => {
                                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
                                handleNextSound()
                            }}
                            className="flex flex-col items-center justify-center gap-1 flex-1 active:scale-95"
                            style={{ color: soundState.soundIndex !== -1 ? '#22c55e' : 'var(--muted-foreground)' }}
                        >
                            <span className="text-[8px] font-mono opacity-50 truncate max-w-[60px]">{activeSoundName}</span>
                            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {soundState.soundIndex === -1 ? (
                                        <motion.div
                                            key="muted-mobile"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                        >
                                            <VolumeX size={24} />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="playing-mobile"
                                            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                        >
                                            <RotatingVinyl size={38} isActive={true} isBright={isBright} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <span className="text-[10px] font-semibold tracking-wide uppercase opacity-80">Tune</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}




