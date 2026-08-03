'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { AdaptiveRenderingPipeline } from '@/components/media/AdaptiveRenderingPipeline/AdaptiveRenderingPipeline'
import { BackgroundAudioEngine } from '@/components/media/BackgroundAudioEngine'
import { AssetPackage } from '@/lib/media/UniversalAssetRegistry'
import type { RenderContext } from '@/lib/media/strategy/RenderContext'

export type MediaMode = 'GLOBAL_BACKGROUND' | 'SCOPED_BACKGROUND' | 'FULLSCREEN_EXPERIENCE' | 'OVERLAY' | 'DISABLED'

export interface MediaSessionCapabilities {
  supportsBackgroundSwitch?: boolean
  supportsAudioToggle?: boolean
  supportsThemeSwitch?: boolean
  supportsPlaybackControls?: boolean
}

export interface MediaSession {
  id: string
  scope: string
  priority: number
  mode: MediaMode
  assetPackage: AssetPackage
  videoEnabled?: boolean
  audioEnabled?: boolean
  /** Prevent the background video from being detached into Picture-in-Picture / a floating player */
  disablePip?: boolean
  capabilities?: MediaSessionCapabilities
}

interface MediaOrchestratorContextType {
  createSession: (session: MediaSession) => void
  updateSession: (id: string, session: Partial<MediaSession>) => void
  destroySession: (id: string) => void
  activeSession: MediaSession | null
  sessions: Map<string, MediaSession>
  isAudioMuted: boolean
  toggleAudioMute: () => void
  isVideoDisabled: boolean
  toggleVideoDisable: () => void
}

const MediaOrchestratorContext = createContext<MediaOrchestratorContextType | null>(null)

export function MediaOrchestrator({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Map<string, MediaSession>>(new Map())
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoDisabled, setIsVideoDisabled] = useState(false)

  const toggleAudioMute = useCallback(() => setIsAudioMuted(prev => !prev), [])
  const toggleVideoDisable = useCallback(() => setIsVideoDisabled(prev => !prev), [])

  // Determine active session based on priority — pure media routing, no theme writes
  const activeSession = useMemo(() => {
    if (sessions.size === 0) return null
    let active: MediaSession | null = null
    for (const session of Array.from(sessions.values())) {
      if (!active || session.priority > active.priority) {
        active = session
      }
    }
    return active
  }, [sessions])

  const createSession = useCallback((session: MediaSession) => {
    setSessions(prev => {
      const next = new Map(prev)
      next.set(session.id, session)
      return next
    })
  }, [])

  const updateSession = useCallback((id: string, updates: Partial<MediaSession>) => {
    setSessions(prev => {
      const existing = prev.get(id)
      if (!existing) return prev
      const next = new Map(prev)
      next.set(id, { ...existing, ...updates })
      return next
    })
  }, [])

  const destroySession = useCallback((id: string) => {
    setSessions(prev => {
      if (!prev.has(id)) return prev
      const next = new Map(prev)
      next.delete(id)
      return next
    })
  }, [])

  // Derive RenderContext from active session mode
  const renderContext = useMemo((): RenderContext | null => {
    if (!activeSession) return null
    switch (activeSession.mode) {
      case 'FULLSCREEN_EXPERIENCE':
        return { scene: 'cinematic', priority: 'immersion', visualStyle: 'cinematic', description: 'Fullscreen media experience' }
      case 'GLOBAL_BACKGROUND':
      case 'SCOPED_BACKGROUND':
        return { scene: 'ambient', priority: 'balanced', description: `${activeSession.scope} background` }
      default:
        return { scene: 'ambient', priority: 'balanced', description: 'Default background' }
    }
  }, [activeSession])

  return (
    <MediaOrchestratorContext.Provider value={{
      createSession,
      updateSession,
      destroySession,
      activeSession,
      sessions,
      isAudioMuted,
      toggleAudioMute,
      isVideoDisabled,
      toggleVideoDisable
    }}>
      {/* Universal Background Video — adaptive pipeline */}
      {activeSession?.mode !== 'DISABLED' && activeSession?.mode !== 'OVERLAY' && (
        <AdaptiveRenderingPipeline
          src={activeSession?.videoEnabled !== false ? (activeSession?.assetPackage.videoUrl ?? null) : null}
          context={renderContext}
          crossfade={true}
          opacity={(!isVideoDisabled && activeSession?.videoEnabled !== false) ? 1 : 0}
          className="z-[-1]"
          disablePip={activeSession?.disablePip === true}
        />
      )}

      {/* Universal Background Audio Engine */}
      {activeSession?.mode !== 'DISABLED' && activeSession?.mode !== 'OVERLAY' && (
        <BackgroundAudioEngine
          audioUrl={activeSession?.audioEnabled !== false ? (activeSession?.assetPackage.audioUrl ?? null) : null}
          isMuted={isAudioMuted || activeSession?.audioEnabled === false}
        />
      )}

      {children}
    </MediaOrchestratorContext.Provider>
  )
}

export function useMediaOrchestrator() {
  const context = useContext(MediaOrchestratorContext)
  if (!context) {
    throw new Error('useMediaOrchestrator must be used within MediaOrchestrator')
  }
  return context
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// useMediaSession Hook (Convenience hook for consumers to manage their session)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useEffect } from 'react'

export function useMediaSession(initialSession: Omit<MediaSession, 'id'>) {
  const { createSession, updateSession, destroySession } = useMediaOrchestrator()
  // Generate a unique ID per mount — stable across re-renders
  const sessionId = useMemo(() => `session_${Math.random().toString(36).substr(2, 9)}`, [])

  // Register session on mount; destroy on unmount
  useEffect(() => {
    createSession({ id: sessionId, ...initialSession })
    return () => {
      destroySession(sessionId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — session created once at mount

  // Return a stable update function scoped to this session's ID
  const update = useCallback((updates: Partial<MediaSession>) => {
    updateSession(sessionId, updates)
  }, [sessionId, updateSession])

  return { sessionId, updateSession: update }
}
