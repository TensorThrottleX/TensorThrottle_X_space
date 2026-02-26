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
    isTerminalOpen: boolean
    setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>
    mainView: MainView
    setMainView: React.Dispatch<React.SetStateAction<MainView>>
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
    const [uiMode, setUiMode] = useState<UIMode>('default')
    const [renderMode, setRenderMode] = useState<RenderMode>('dark') // Default to 'dark' for consistency
    const [isTerminalOpen, setIsTerminalOpen] = useState(false)
    const [mainView, setMainView] = useState<MainView>('dashboard')

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


    return (
        <UIContext.Provider value={{
            uiMode, setUiMode,
            renderMode, setRenderMode,
            isTerminalOpen, setIsTerminalOpen,
            mainView, setMainView
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
