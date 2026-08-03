'use client'

import React, { useState, useCallback, useRef } from 'react'
import { FoxContext, DEFAULT_STATE } from './FoxContext'
import { Fox } from './Fox'
import type { FoxState, FoxContextType } from './types'

interface FoxProviderProps {
  children: React.ReactNode
}

export function FoxProvider({ children }: FoxProviderProps) {
  const [speechBubble, setSpeechBubble] = useState<string | null>(null)
  const foxRef = useRef<{
    moveTo: (x: number, y: number) => void
    speak: (text: string) => void
    goToSleep: () => void
    wakeUp: () => void
    setState: (s: FoxState) => void
    toggleVisible: () => void
  }>(null)

  const playAnimation = useCallback((animation: FoxState) => {
    foxRef.current?.setState(animation)
  }, [])

  const moveTo = useCallback((x: number, y: number) => {
    foxRef.current?.moveTo(x, y)
  }, [])

  const sleep = useCallback(() => {
    foxRef.current?.goToSleep()
  }, [])

  const wake = useCallback(() => {
    foxRef.current?.wakeUp()
  }, [])

  const speak = useCallback((text: string) => {
    foxRef.current?.speak(text)
  }, [])

  const hide = useCallback(() => {
    foxRef.current?.toggleVisible()
  }, [])

  const show = useCallback(() => {
    foxRef.current?.toggleVisible()
  }, [])

  const dismissSpeech = useCallback(() => {
    setSpeechBubble(null)
  }, [])

  const contextValue: FoxContextType = {
    state: DEFAULT_STATE,
    playAnimation,
    moveTo,
    sleep,
    wake,
    speak,
    hide,
    show,
    speechBubble,
    dismissSpeech,
  }

  return (
    <FoxContext.Provider value={contextValue}>
      {children}
      <Fox
        onStateChange={() => {}}
        onSpeech={setSpeechBubble}
      />
    </FoxContext.Provider>
  )
}
