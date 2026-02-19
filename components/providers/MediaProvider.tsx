
'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { VideoState, SoundState, MediaConfig, BaseTheme } from '@/types/media'

interface MediaContextType {
    theme: BaseTheme
    setTheme: (t: BaseTheme) => void
    videoState: VideoState
    setVideoIndex: (idx: number) => void
    setVideoAudio: (enabled: boolean) => void
    soundState: SoundState
    setSoundIndex: (idx: number) => void
    config: MediaConfig
    isLoading: boolean
}

const MediaContext = createContext<MediaContextType | undefined>(undefined)

const DEFAULT_VIDEO_STATE: VideoState = {
    index: 0,
    hasAudioTrack: false,
    videoAudioEnabled: false
}

const DEFAULT_SOUND_STATE: SoundState = {
    soundIndex: -1
}

export function MediaEngineProvider({ children }: { children: React.ReactNode }) {
    // Layer 1: BaseTheme
    const [theme, setThemeState] = useState<BaseTheme>('normal')

    // States
    const [videoState, setVideoState] = useState<VideoState>(DEFAULT_VIDEO_STATE)
    const [soundState, setSoundState] = useState<SoundState>(DEFAULT_SOUND_STATE)
    const [config, setConfig] = useState<MediaConfig>({ videos: [], sounds: [] })
    const [isLoading, setIsLoading] = useState(true)

    // Refs for persistent elements
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Video Switching Protocol
    const updateVideoSource = useCallback(async (index: number) => {
        const video = videoRef.current
        if (!video) return

        try {
            video.pause()
            video.muted = true

            if (index === -1) {
                video.src = '' // Black
            } else if (index === -2) {
                video.src = '' // White handled in CSS
            } else if (config.videos[index]) {
                const videoPath = config.videos[index].path
                // Use encoded path if not already
                video.src = videoPath
                video.playbackRate = 1.0 // Reset to normal speed
                video.load()
                await video.play().catch((e) => {
                    // Failure Containment
                    console.warn('Video playback blocked or failed:', e)
                })
            }

            setVideoState(prev => ({
                ...prev,
                index,
                videoAudioEnabled: false // Reset audio on switch
            }))
        } catch (err) {
            console.error('Video switch error:', err)
            video.src = ''
        }
    }, [config.videos])

    // Initialization & Asset Discovery
    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch('/api/media')
                if (!res.ok) {
                    throw new Error(`Media API error: ${res.status} ${res.statusText}`)
                }
                const data = await res.json()
                setConfig(data)

                // Persistence Recovery
                const saved = localStorage.getItem('media_engine_v3')
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved)
                        if (typeof parsed.theme === 'string') setThemeState(parsed.theme)
                        if (typeof parsed.videoIndex === 'number') {
                            // Validate index exists in new config
                            if (parsed.videoIndex < data.videos.length) {
                                setVideoState(prev => ({ ...prev, index: parsed.videoIndex }))
                            }
                        }
                        if (typeof parsed.soundIndex === 'number') {
                            if (parsed.soundIndex < data.sounds.length) {
                                setSoundState({ soundIndex: parsed.soundIndex })
                            }
                        }
                    } catch (e) {
                        console.warn('Corruption detected in media storage, resetting.')
                        localStorage.removeItem('media_engine_v3')
                    }
                }
            } catch (error) {
                console.error('Media discovery failed:', error)
                // Fallback to empty config to prevent crashes
                setConfig({ videos: [], sounds: [] })
            } finally {
                setIsLoading(false)
            }
        }
        init()
    }, [])

    // Persistence Sync
    useEffect(() => {
        if (isLoading) return
        const state = {
            theme,
            videoIndex: videoState.index,
            soundIndex: soundState.soundIndex
        }
        localStorage.setItem('media_engine_v3', JSON.stringify(state))
    }, [theme, videoState.index, soundState.soundIndex, isLoading])

    // Video Source Initialization (Fix)
    // Ensures the video element actually gets a src when config loads, if missed during init
    useEffect(() => {
        if (!isLoading && config.videos.length > 0 && videoState.index >= 0) {
            const video = videoRef.current
            // If video has no src but we have a valid index, force update
            if (video && !video.getAttribute('src')) {
                updateVideoSource(videoState.index)
            }
        }
    }, [isLoading, config, videoState.index, updateVideoSource])



    // Audio Conflict Resolution
    useEffect(() => {
        const video = videoRef.current
        const audio = audioRef.current
        if (!video || !audio) return

        if (videoState.videoAudioEnabled) {
            // If video audio enabled, mute background sounds
            audio.pause()
            video.muted = false
        } else {
            // If video muted, allow background sound if chosen
            video.muted = true
            if (soundState.soundIndex !== -1 && config.sounds[soundState.soundIndex]) {
                const soundPath = config.sounds[soundState.soundIndex].path
                if (audio.src !== soundPath && audio.src !== window.location.origin + soundPath) {
                    audio.src = soundPath
                    audio.load()
                }
                audio.playbackRate = 1.0 // Reset to normal speed
                audio.play().catch((e) => {
                    console.warn("Audio autoplay blocked or failed:", e)
                })
            } else {
                audio.pause()
            }
        }
    }, [videoState.videoAudioEnabled, soundState.soundIndex, config.sounds])

    const setVideoIndex = (idx: number) => updateVideoSource(idx)
    const setVideoAudio = (enabled: boolean) => setVideoState(prev => ({ ...prev, videoAudioEnabled: enabled }))
    const setSoundIndex = (idx: number) => setSoundState({ soundIndex: idx })
    const setTheme = (t: BaseTheme) => setThemeState(t)

    return (
        <MediaContext.Provider value={{
            theme, setTheme,
            videoState, setVideoIndex, setVideoAudio,
            soundState, setSoundIndex,
            config, isLoading
        }}>
            {/* 2️⃣ STRUCTURAL LAYER SEPARATION: Background Layers BEFORE Content */}
            <video
                ref={videoRef}
                autoPlay
                loop
                playsInline
                muted
                preload="auto"
                onLoadedMetadata={(e) => {
                    const v = e.currentTarget
                    v.playbackRate = 1.0 // Force normal speed
                    v.defaultPlaybackRate = 1.0
                    try {
                        const hasAudio = (v as any).audioTracks?.length > 0 ||
                            (v as any).mozHasAudio ||
                            Boolean((v as any).webkitAudioDecodedByteCount)
                        setVideoState(prev => ({ ...prev, hasAudioTrack: hasAudio }))
                    } catch (e) {
                        setVideoState(prev => ({ ...prev, hasAudioTrack: false }))
                    }
                }}
                onPlay={(e) => {
                    e.currentTarget.playbackRate = 1.0 // Ensure speed is normal on play
                }}
                onError={(e) => {
                    console.warn('Video playback error:', e)
                }}
                className={`bg-video transition-opacity duration-1000 
          ${videoState.index === -2 ? 'opacity-0' : 'opacity-100'}
          ${videoState.index === -1 ? 'bg-black' : ''}
          ${theme === 'bright' ? 'opacity-10' : ''}
        `}
                style={{
                    backgroundColor: videoState.index === -1 ? 'black' : 'transparent',
                    visibility: videoState.index === -2 ? 'hidden' : 'visible'
                }}
            />

            <audio
                ref={audioRef}
                loop
                preload="auto"
                className="hidden"
                onLoadedMetadata={(e) => {
                    e.currentTarget.playbackRate = 1.0
                    e.currentTarget.defaultPlaybackRate = 1.0
                }}
                onPlay={(e) => {
                    e.currentTarget.playbackRate = 1.0
                }}
                onError={(e) => {
                    console.warn('Audio playback error:', e)
                }}
            />

            {/* Layer 1 Theme Overlay (Pure CSS) -> .blur-layer */}
            <div className={`blur-layer transition-colors duration-1000
        ${theme === 'bright' ? 'bg-white/80' : ''}
        ${theme === 'dark' ? 'bg-black/40 backdrop-blur-sm' : ''}
        ${videoState.index === -2 ? 'bg-white z-[-5]' : ''}
      `} />

            {/* 4️⃣ GLOBAL CONTENT CONTAINER (Injected via children) */}
            {children}

        </MediaContext.Provider>
    )
}

export function useMedia() {
    const context = useContext(MediaContext)
    if (!context) throw new Error('useMedia must be used within MediaEngineProvider')
    return context
}
