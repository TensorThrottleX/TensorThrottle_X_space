'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type UIMode = 'default' | 'tree'
export type RenderMode = 'normal' | 'bright' | 'dark' | 'custom'
type MainView = 'dashboard' | 'msg'

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
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
    const [uiMode, setUiMode] = useState<UIMode>('default')
    const [renderMode, setRenderMode] = useState<RenderMode>('bright') // Default to 'bright' for consistency
    const [isTerminalOpen, setIsTerminalOpen] = useState(false)
    const [mainView, setMainView] = useState<MainView>('dashboard')
    const [isBooting, setIsBooting] = useState<boolean>(true)

    // Initialize from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedMode = localStorage.getItem('renderMode') as RenderMode
            if (savedMode && ['normal', 'bright', 'dark', 'custom'].includes(savedMode)) {
                setRenderMode(savedMode)
            }
        }
    }, [])

    // Handle Body Class and Persistence
    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.body.classList.remove('mode-normal', 'mode-bright', 'mode-dark', 'mode-custom')
            document.body.classList.add(`mode-${renderMode}`)
            localStorage.setItem('renderMode', renderMode)
        }
    }, [renderMode])

    const toggleRenderMode = (e?: React.MouseEvent | { clientX: number, clientY: number } | null, newMode?: RenderMode) => {
        const nextMode = newMode || (renderMode === 'dark' ? 'bright' : 'dark')
        if (renderMode === nextMode) return

        if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setRenderMode(nextMode)
            return
        }

        const x = e ? e.clientX : window.innerWidth / 2
        const y = e ? e.clientY : window.innerHeight / 2
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        )

        const transition = document.startViewTransition(() => {
            setRenderMode(nextMode)
        })

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
            ]

            // Only animate the new view, while the old view stays in place
            document.documentElement.animate(
                { clipPath: clipPath },
                {
                    duration: 600,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    pseudoElement: '::view-transition-new(root)',
                }
            )
        })
    }

    return (
        <UIContext.Provider value={{
            uiMode, setUiMode,
            renderMode, setRenderMode,
            toggleRenderMode,
            isTerminalOpen, setIsTerminalOpen,
            mainView, setMainView,
            isBooting, setIsBooting
        }}>
            {children}
        </UIContext.Provider>
    )
}

export function useUI() {
    const context = useContext(UIContext)
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider')
    }
    return context
}
