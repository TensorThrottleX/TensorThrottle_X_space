'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

type UIMode = 'default' | 'tree'
type RenderMode = 'normal' | 'bright' | 'dark'
type MainView = 'dashboard' | 'msg'

interface UIContextType {
    uiMode: UIMode
    setUiMode: (mode: UIMode) => void
    renderMode: RenderMode
    setRenderMode: (mode: RenderMode) => void
    isTerminalOpen: boolean
    setIsTerminalOpen: (isOpen: boolean) => void
    mainView: MainView
    setMainView: (view: MainView) => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
    const [uiMode, setUiMode] = useState<UIMode>('default')
    const [renderMode, setRenderMode] = useState<RenderMode>('normal')
    const [isTerminalOpen, setIsTerminalOpen] = useState(false)
    const [mainView, setMainView] = useState<MainView>('dashboard')

    // Handle Body Class for Render Mode
    useEffect(() => {
        document.body.classList.remove('mode-normal', 'mode-bright', 'mode-dark', 'mode-default', 'mode-precision')
        document.body.classList.add(`mode-${renderMode}`)
    }, [renderMode])


    return (
        <UIContext.Provider value={{ uiMode, setUiMode, renderMode, setRenderMode, isTerminalOpen, setIsTerminalOpen, mainView, setMainView }}>
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
