'use client'

import React, { createContext, useContext, useState, ReactNode, useLayoutEffect } from 'react'

type UIMode = 'default' | 'tree'
export type RenderMode = 'bright' | 'dark'
type MainView = 'dashboard' | 'msg'

const BOOT_ENTERED_KEY = 'tensor-space-entered'

interface UIContextType {
    uiMode: UIMode
    setUiMode: React.Dispatch<React.SetStateAction<UIMode>>
    renderMode: RenderMode
    setRenderMode: React.Dispatch<React.SetStateAction<RenderMode>>
    toggleRenderMode: (e?: React.MouseEvent | { clientX: number, clientY: number } | null, mode?: RenderMode) => void
    isTerminalOpen: boolean
    setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>
    mainView: MainView
    setMainView: React.Dispatch<React.SetStateAction<MainView>>
    isBooting: boolean
    setIsBooting: React.Dispatch<React.SetStateAction<boolean>>
    enterSpace: () => void
    navUtilityExpanded: boolean
    setNavUtilityExpanded: React.Dispatch<React.SetStateAction<boolean>>
    themeResolved: boolean
}

const DEFAULT_CONTEXT: UIContextType = {
    uiMode: 'default',
    setUiMode: () => { },
    renderMode: 'bright',
    setRenderMode: () => { },
    toggleRenderMode: () => { },
    isTerminalOpen: false,
    setIsTerminalOpen: () => { },
    mainView: 'dashboard',
    setMainView: () => { },
    isBooting: false,
    setIsBooting: () => { },
    enterSpace: () => { },
    navUtilityExpanded: false,
    setNavUtilityExpanded: () => { },
    themeResolved: false
}

const UIContext = createContext<UIContextType>(DEFAULT_CONTEXT)

export function UIProvider({ children }: { children: ReactNode }) {
    const [uiMode, setUiMode] = useState<UIMode>('default')
    const [renderMode, setRenderMode] = useState<RenderMode>(() => {
        if (typeof window !== 'undefined') {
            const theme = (window as any).__TX_THEME__
            if (theme === 'bright' || theme === 'dark') return theme
        }
        return 'bright'
    })
    const [isTerminalOpen, setIsTerminalOpen] = useState(false)
    const [mainView, setMainView] = useState<MainView>('dashboard')

    // Boot state stays `true` until one of two things happens:
    //  - a returning user has already entered the space (persisted flag → resolved pre-paint below)
    //  - the user explicitly clicks "Enter the Space" (enterSpace())
    // It is never reset by navigation, remounts, or page effects.
    const [isBooting, setIsBooting] = useState<boolean>(true)
    const [navUtilityExpanded, setNavUtilityExpanded] = useState(false)
    const [themeResolved, setThemeResolved] = useState(false)

    // Resolve persisted entry state before first paint so returning users
    // land directly in the application — no BootLoader flash.
    useLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                if (localStorage.getItem(BOOT_ENTERED_KEY) === 'true') {
                    setIsBooting(false)
                }
            } catch { }
        }
    }, [])

    const enterSpace = () => {
        try {
            localStorage.setItem(BOOT_ENTERED_KEY, 'true')
        } catch { }
        setIsBooting(false)
    }

    // Initialize from localStorage before paint — matches inline script in layout.tsx
    useLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMode = localStorage.getItem('renderMode')
            if (savedMode === 'bright' || savedMode === 'dark') {
                setRenderMode(savedMode)
            }
            const savedNav = localStorage.getItem('navUtilityExpanded')
            if (savedNav === 'true') {
                setNavUtilityExpanded(true)
            }
            setThemeResolved(true)
        }
    }, [])

    // Handle Body Class and Persistence — useLayoutEffect so body class updates before paint
    useLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            document.body.classList.remove('mode-bright', 'mode-dark')
            document.body.classList.add(`mode-${renderMode}`)
            localStorage.setItem('renderMode', renderMode)
        }
    }, [renderMode])

    useLayoutEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('navUtilityExpanded', navUtilityExpanded ? 'true' : 'false')
        }
    }, [navUtilityExpanded])

    const toggleRenderMode = (e?: React.MouseEvent | { clientX: number, clientY: number } | null, newMode?: RenderMode) => {
        const nextMode = newMode || (renderMode === 'dark' ? 'bright' : 'dark')
        if (renderMode === nextMode) return

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        if (prefersReduced) {
            setRenderMode(nextMode)
            return
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // PORTAL EXPANSION ENGINE — Origin from click position
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const x = e?.clientX ?? window.innerWidth / 2
        const y = e?.clientY ?? window.innerHeight
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        )

        const DURATION = 850
        const EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'

        // ── Portal Glow Ring Overlay ──
        // A luminous ring that follows the expanding portal edge
        const createGlowRing = () => {
            const existing = document.querySelector('[data-portal-glow]')
            if (existing) existing.remove()

            const glow = document.createElement('div')
            glow.setAttribute('data-portal-glow', '')
            const glowColor = nextMode === 'dark'
                ? 'rgba(34, 211, 238, 0.35)'   // cyan for entering dark
                : 'rgba(255, 220, 140, 0.4)'    // warm gold for entering bright
            const glowColorFaint = nextMode === 'dark'
                ? 'rgba(34, 211, 238, 0.08)'
                : 'rgba(255, 220, 140, 0.1)'

            glow.style.cssText = `
                position: fixed;
                inset: 0;
                z-index: 10000;
                pointer-events: none;
                will-change: opacity;
                background: radial-gradient(
                    circle at ${x}px ${y}px,
                    transparent 0%,
                    ${glowColor} 0%,
                    ${glowColorFaint} 0%,
                    transparent 0%
                );
                opacity: 1;
            `
            document.body.appendChild(glow)

            // Animate the glow ring expanding in sync with the portal
            let start: number | null = null
            const animate = (ts: number) => {
                if (!start) start = ts
                const elapsed = ts - start
                const t = Math.min(elapsed / DURATION, 1)
                // Ease out expo approximation
                const easedT = 1 - Math.pow(1 - t, 3)
                const currentRadius = easedT * endRadius
                const ringWidth = Math.max(30, 80 * (1 - easedT))
                const innerR = Math.max(0, currentRadius - ringWidth)
                const outerR = currentRadius + ringWidth * 0.3

                // Fade the glow as it expands (strongest early, fades in last 40%)
                const glowOpacity = t < 0.6 ? 1 : Math.max(0, 1 - ((t - 0.6) / 0.4))

                glow.style.opacity = String(glowOpacity)
                glow.style.background = `radial-gradient(
                    circle at ${x}px ${y}px,
                    transparent ${innerR}px,
                    ${glowColor} ${currentRadius * 0.85}px,
                    ${glowColorFaint} ${currentRadius}px,
                    transparent ${outerR}px
                )`

                if (t < 1) {
                    requestAnimationFrame(animate)
                } else {
                    glow.style.transition = 'opacity 200ms ease-out'
                    glow.style.opacity = '0'
                    setTimeout(() => glow.remove(), 250)
                }
            }
            requestAnimationFrame(animate)
        }

        // ── View Transitions API Path (Chrome, Edge, Safari 18+) ──
        if (document.startViewTransition) {
            // Suppress CSS transitions so the browser captures clean final state
            const style = document.createElement('style')
            style.textContent = `* { transition: none !important; }`
            document.head.appendChild(style)

            const transition = document.startViewTransition(() => {
                setRenderMode(nextMode)
            })

            transition.ready.then(() => {
                const clipFrom = `circle(0px at ${x}px ${y}px)`
                const clipTo = `circle(${endRadius}px at ${x}px ${y}px)`

                // New theme expands outward from click point
                document.documentElement.animate(
                    { clipPath: [clipFrom, clipTo] },
                    {
                        duration: DURATION,
                        easing: EASING,
                        pseudoElement: '::view-transition-new(root)',
                    }
                )

                // Old theme stays perfectly still — visible outside the portal
                document.documentElement.animate(
                    { opacity: [1, 1] },
                    {
                        duration: DURATION,
                        easing: EASING,
                        pseudoElement: '::view-transition-old(root)',
                        fill: 'forwards',
                    }
                )

                // Fire the glow ring
                createGlowRing()
            })

            transition.finished.finally(() => {
                style.remove()
            })

            return
        }

        // ── Fallback for browsers without View Transitions API ──
        const existing = document.querySelector('[data-theme-overlay]')
        if (existing) existing.remove()

        const overlay = document.createElement('div')
        overlay.setAttribute('data-theme-overlay', '')
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            pointer-events: none;
            background: ${nextMode === 'dark' ? '#050505' : '#F5F5F4'};
            clip-path: circle(0px at ${x}px ${y}px);
            will-change: clip-path;
        `
        document.body.appendChild(overlay)

        const clipFrom = `circle(0px at ${x}px ${y}px)`
        const clipTo = `circle(${endRadius}px at ${x}px ${y}px)`

        const animation = overlay.animate(
            { clipPath: [clipFrom, clipTo] },
            { duration: DURATION, easing: EASING, fill: 'forwards' }
        )

        // Fire the glow ring
        createGlowRing()

        animation.onfinish = () => {
            const style = document.createElement('style')
            style.textContent = `* { transition: none !important; }`
            document.head.appendChild(style)

            setRenderMode(nextMode)

            setTimeout(() => {
                overlay.style.transition = 'opacity 300ms ease-out'
                overlay.style.opacity = '0'

                setTimeout(() => {
                    overlay.remove()
                    style.remove()
                }, 350)
            }, 80)
        }
    }

    return (
        <UIContext.Provider value={{
            uiMode, setUiMode,
            renderMode, setRenderMode,
            toggleRenderMode,
            isTerminalOpen, setIsTerminalOpen,
            mainView, setMainView,
            isBooting, setIsBooting,
            enterSpace,
            navUtilityExpanded, setNavUtilityExpanded,
            themeResolved
        }}>
            {children}
        </UIContext.Provider>
    )
}

export function useUI() {
    const context = useContext(UIContext)
    return context
}
