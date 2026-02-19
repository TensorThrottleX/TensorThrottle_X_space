'use client'

import React, { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, List, Folder, FlaskConical, SlidersHorizontal, Monitor, Sun, Volume2, Layers, X, Zap } from 'lucide-react'
import { useTransition } from 'react'
import { useUI, RenderMode } from '@/components/providers/UIProvider'
import { useMedia } from '@/components/providers/MediaProvider'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

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
    { label: 'System', href: '#system', icon: SlidersHorizontal, isAction: true },
]

export function MobileBottomNav() {
    const pathname = usePathname()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const { renderMode, setRenderMode, setMainView, setUiMode, setIsPrecision, isPrecision } = useUI()
    const {
        theme, setTheme,
        soundState, setSoundIndex,
        videoState, setVideoIndex,
        config
    } = useMedia()

    // Local state for the controls sheet
    const [showControls, setShowControls] = useState(false)
    const isBright = renderMode === 'bright'

    const isActive = (href: string): boolean => {
        if (href === '/') return pathname === '/'
        return pathname.startsWith(href)
    }

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, item: MobileNavItem): void => {
        e.preventDefault()

        // Handle System Action
        if (item.isAction) {
            setShowControls(!showControls)
            return
        }

        // Close controls if navigating elsewhere
        setShowControls(false)

        setMainView('dashboard')
        setUiMode('default')
        setIsPrecision(false)

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

    // --- Control Handlers (Mirrors LabNavigation) ---

    const handleModeToggle = (mode: RenderMode) => {
        setRenderMode(mode)
        if (mode !== 'custom') {
            setTheme(mode as any)
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
    const activeVideoName = videoState.index >= 0 ? config.videos[videoState.index]?.name : (videoState.index === -1 ? 'BLACK' : 'WHITE')

    return (
        <nav
            className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-[200] backdrop-blur-xl border-t transition-colors duration-300 overflow-hidden"
            style={{
                backgroundColor: isBright ? 'rgba(255,255,255,0.95)' : 'rgba(10,10,10,0.95)',
                borderColor: isBright ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' // h-16 + safe area
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
                        className="absolute inset-0 flex items-stretch justify-around px-2 h-16"
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
                                    className="relative flex flex-col items-center justify-center gap-1 flex-1 transition-colors duration-200 active:scale-95"
                                    style={{
                                        color: active ? (isBright ? '#111' : '#22d3ee') : 'var(--muted-foreground)',
                                    }}
                                >
                                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                                    <span className={cn(
                                        "text-[10px] font-semibold tracking-wide uppercase",
                                        active ? 'opacity-100' : 'opacity-60'
                                    )}>
                                        {item.label}
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
                    /* SYSTEM CONTROL TRAY */
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
                            }}
                            className="flex flex-col items-center justify-center gap-1 flex-1 active:scale-95"
                            style={{ color: 'var(--muted-foreground)' }}
                        >
                            <X size={20} strokeWidth={1.8} />
                            <span className="text-[10px] font-semibold tracking-wide uppercase opacity-60">Back</span>
                        </button>

                        <div className="w-px h-8 bg-white/10 self-center mx-1" />

                        {/* 2. Theme Cycle */}
                        <button
                            onClick={() => {
                                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
                                const modes: RenderMode[] = ['normal', 'bright', 'custom']
                                const next = modes[(modes.indexOf(renderMode as any) + 1) % modes.length]
                                handleModeToggle(next as RenderMode)
                            }}
                            className="flex flex-col items-center justify-center gap-1 flex-1 active:scale-95"
                            style={{ color: isBright ? '#111' : '#22d3ee' }}
                        >
                            {renderMode === 'normal' ? <Monitor size={20} /> : (renderMode === 'bright' ? <Sun size={20} /> : <Layers size={20} />)}
                            <span className="text-[10px] font-semibold tracking-wide uppercase opacity-100">{renderMode}</span>
                        </button>

                        {/* 3. Removed Precision Toggle */}

                        {/* 4/5. Custom Controls (Conditional) */}
                        {renderMode === 'custom' && (
                            <>
                                <button
                                    onClick={() => {
                                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
                                        handleNextBackground()
                                    }}
                                    className="flex flex-col items-center justify-center gap-1 flex-1 active:scale-95"
                                    style={{ color: 'var(--foreground)' }}
                                >
                                    <span className="text-[8px] font-mono opacity-50 truncate max-w-[60px]">{activeVideoName}</span>
                                    <FlaskConical size={20} />
                                    <span className="text-[10px] font-semibold tracking-wide uppercase opacity-80">BG</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10)
                                        handleNextSound()
                                    }}
                                    className="flex flex-col items-center justify-center gap-1 flex-1 active:scale-95"
                                    style={{ color: soundState.soundIndex !== -1 ? '#22c55e' : 'var(--muted-foreground)' }}
                                >
                                    <span className="text-[8px] font-mono opacity-50 truncate max-w-[60px]">{activeSoundName}</span>
                                    <Volume2 size={20} />
                                    <span className="text-[10px] font-semibold tracking-wide uppercase opacity-80">Tune</span>
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}




