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
    isPrecision: boolean
    setIsPrecision: React.Dispatch<React.SetStateAction<boolean>>
    isTerminalOpen: boolean
    setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>
    mainView: MainView
    setMainView: React.Dispatch<React.SetStateAction<MainView>>
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: ReactNode }) {
    const [uiMode, setUiMode] = useState<UIMode>('default')
    const [renderMode, setRenderMode] = useState<RenderMode>('bright')
    const [isPrecision, setIsPrecision] = useState(false)
    const [isTerminalOpen, setIsTerminalOpen] = useState(false)
    const [mainView, setMainView] = useState<MainView>('dashboard')

    // Handle Body Class for Render Mode
    useEffect(() => {
        document.body.classList.remove('mode-normal', 'mode-bright', 'mode-dark', 'mode-custom')
        document.body.classList.add(`mode-${renderMode}`)
    }, [renderMode])

    // Handle Body Class for Precision Mode
    useEffect(() => {
        if (isPrecision) {
            document.body.classList.add('mode-precision')
        } else {
            document.body.classList.remove('mode-precision')
        }
    }, [isPrecision])


    return (
        <UIContext.Provider value={{
            uiMode, setUiMode,
            renderMode, setRenderMode,
            isPrecision, setIsPrecision,
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
