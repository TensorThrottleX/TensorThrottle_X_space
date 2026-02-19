
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

    const [isMobileFallback, setIsMobileFallback] = useState(false)

    // Reset fallback on video change
    useEffect(() => {
        setIsMobileFallback(false)
    }, [videoState.index])

    // Video Source Logic
    const activeVideoSrc = React.useMemo(() => {
        if (videoState.index === -1 || videoState.index === -2) return ''

        // [MOBILE FALLBACK]: If current video crashed/unsafe, use Default (Index 0)
        if (isMobileFallback && config.videos.length > 0) {
            return config.videos[0].path
        }

        if (config.videos[videoState.index]) {
            return config.videos[videoState.index].path
        }
        return ''
    }, [videoState.index, config.videos, isMobileFallback])

    // Video Switching Protocol ( simplified )
    const updateVideoSource = useCallback(async (index: number) => {
        // Just update state, React handles the src prop change
        setVideoState(prev => ({
            ...prev,
            index,
            videoAudioEnabled: false
        }))
        setIsMobileFallback(false) // Reset safety flag
    }, [])

    // Initialization & Asset Discovery
    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch('/api/media')
                if (!res.ok) throw new Error('Media API error')
                const data = await res.json()
                setConfig(data)

                const saved = localStorage.getItem('media_engine_v3')
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved)
                        if (parsed.theme) setThemeState(parsed.theme)
                        if (typeof parsed.videoIndex === 'number' && parsed.videoIndex < data.videos.length) {
                            setVideoState(prev => ({ ...prev, index: parsed.videoIndex }))
                        }
                        if (typeof parsed.soundIndex === 'number' && parsed.soundIndex < data.sounds.length) {
                            setSoundState({ soundIndex: parsed.soundIndex })
                        }
                    } catch (e) {
                        console.warn('Corruption detected in media storage')
                    }
                }
            } catch (error) {
                console.error('Media discovery failed', error)
                setConfig({ videos: [], sounds: [] })
            }
            // Note: We leave isLoading true until the video actually loads data
            // BUT if there is no video to load (index -1/-2 or no config), we must clear it.
        }
        init()
    }, [])

    // Force clear loading if no video selected or available
    useEffect(() => {
        if (config.videos.length === 0 || videoState.index < 0) {
            setIsLoading(false)
        }
    }, [config.videos, videoState.index])

    // Persistence Sync
    useEffect(() => {
        // ... existing logic ...
        const state = {
            theme,
            videoIndex: videoState.index,
            soundIndex: soundState.soundIndex
        }
        localStorage.setItem('media_engine_v3', JSON.stringify(state))
    }, [theme, videoState.index, soundState.soundIndex])


    // Audio Conflict Resolution
    useEffect(() => {
        const video = videoRef.current
        const audio = audioRef.current
        if (!video || !audio) return

        if (videoState.videoAudioEnabled) {
            audio.pause()
            video.muted = false
        } else {
            video.muted = true
            if (soundState.soundIndex !== -1 && config.sounds[soundState.soundIndex]) {
                const soundPath = config.sounds[soundState.soundIndex].path
                // Only change src if different to avoid reload
                if (!audio.src.endsWith(soundPath)) {
                    audio.src = soundPath
                    audio.load()
                    audio.play().catch(e => console.warn("Audio autoplay blocked", e))
                } else if (audio.paused) {
                    audio.play().catch(e => console.warn("Audio autoplay blocked", e))
                }
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
                src={activeVideoSrc}
                autoPlay
                loop
                playsInline
                muted
                preload="metadata" // Changed from auto to reduce initial memory spike for large/8K videos
                x-webkit-airplay="allow"
                onLoadedData={() => setIsLoading(false)}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => setIsLoading(false)}
                onSuspend={() => setIsLoading(false)} // Assume loaded if suspended (cached)
                onLoadedMetadata={(e) => {
                    const v = e.currentTarget
                    v.playbackRate = 1.0

                    // [MOBILE SAFEGUARD]: 
                    // Detect high-res videos (4K/8K) that might crash mobile browsers.
                    // Threshold: > 2560px (1440p) width or height.
                    const isMobile = window.innerWidth < 1024;
                    if (isMobile && (v.videoWidth > 2560 || v.videoHeight > 2560)) {
                        console.warn(`[Auto-Safe] Video ${v.videoWidth}x${v.videoHeight} is too heavy for mobile. Preventing playback check.`);
                        // We do NOT pause immediately if it plays fine, but we monitor.
                        // Actually, 8K will crash. Let's be safe.
                        // Better strategy: If it's > 4K, definitely stop.
                        if (v.videoWidth > 3840 || v.videoHeight > 3840) {
                            console.warn('[Auto-Safe] 8K/4K+ detected on mobile. Switching to optimized fallback.');
                            // Do NOT pause. Just switch source.
                            setIsMobileFallback(true);
                            return;
                        }
                    }

                    try {
                        // Check for audio tracks
                        const hasAudio = (v as any).audioTracks?.length > 0 ||
                            (v as any).mozHasAudio ||
                            Boolean((v as any).webkitAudioDecodedByteCount)
                        setVideoState(prev => ({ ...prev, hasAudioTrack: hasAudio }))
                    } catch (e) {
                        setVideoState(prev => ({ ...prev, hasAudioTrack: false }))
                    }
                }}
                onError={(e) => {
                    console.warn('Video playback error:', e)
                    setIsLoading(false) // Don't hang app on video error
                }}
                className={`bg-video transition-opacity duration-1000 
          ${(videoState.index === -2 || (isLoading && videoState.index >= 0)) ? 'opacity-0' : 'opacity-100'}
          ${videoState.index === -1 ? 'bg-black' : ''}
          ${(theme === 'bright' || theme === 'dark') ? 'opacity-20' : ''}
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
