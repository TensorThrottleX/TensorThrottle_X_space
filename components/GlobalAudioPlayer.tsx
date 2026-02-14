'use client'

import React, { useState, useEffect, useRef } from 'react'

export function GlobalAudioPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)

    useEffect(() => {
        // Listen for custom toggle events from any component
        const handleToggle = (e: any) => {
            const forceState = e.detail?.force
            const nextState = forceState !== undefined ? forceState : !isPlaying
            setIsPlaying(nextState)
            localStorage.setItem('bgmState', String(nextState))
        }

        const checkState = () => {
            const saved = localStorage.getItem('bgmState') === 'true'
            if (saved !== isPlaying) setIsPlaying(saved)
        }

        window.addEventListener('toggle-bgm', handleToggle)
        window.addEventListener('storage', checkState)

        // Initial check
        checkState()

        return () => {
            window.removeEventListener('toggle-bgm', handleToggle)
            window.removeEventListener('storage', checkState)
        }
    }, [isPlaying])

    useEffect(() => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.play().catch(() => {
                console.log("Audio autoplay waiting for interaction...")
            })
            audioRef.current.volume = 0.35
        } else {
            audioRef.current.pause()
        }
    }, [isPlaying])

    const handleTimeUpdate = () => {
        if (!audioRef.current) return
        // Loop the first 15 seconds
        if (audioRef.current.currentTime >= 15) {
            audioRef.current.currentTime = 0
        }
    }

    return (
        <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            preload="auto"
        >
            <source src="/assets/audio/bgm.mp3" type="audio/mpeg" />
        </audio>
    )
}
