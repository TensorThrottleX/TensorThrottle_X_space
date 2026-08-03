'use client'

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { useUI } from '@/components/providers/UIProvider'

const TAGS = ['AI', 'Research', 'Experiments', 'Universe', 'Anime', 'Music']
const N = TAGS.length
const PERIOD = 20000
const ANGULAR_VEL = (2 * Math.PI) / PERIOD
const A = 420
const B = 110
const HOVER_SPEED = 0.2

const PARTICLE_COUNT = 10

function makeParticles() {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    x: (Math.random() - 0.5) * 800,
    y: (Math.random() - 0.5) * 180,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.1,
    size: 1 + Math.random() * 1.5,
    opacity: 0.12 + Math.random() * 0.18,
    phase: Math.random() * 2 * Math.PI,
  }))
}

export function OrbitalCapsules() {
  const { renderMode } = useUI()
  const isBright = renderMode === 'bright'
  const [paused, setPaused] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [orbitHovered, setOrbitHovered] = useState(false)
  const [frame, setFrame] = useState({ angle: 0, time: 0 })

  const accumulatedRef = useRef(0)
  const lastTimeRef = useRef(0)
  const animRef = useRef<number>(0)

  const floatOffsets = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        phase: Math.random() * 2 * Math.PI,
        amp: 1 + Math.random() * 2,
        breath: 0.008 + Math.random() * 0.012,
      })),
    []
  )

  const particles = useMemo(() => makeParticles(), [])

  const tick = useCallback(
    (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now
      const dt = now - lastTimeRef.current
      lastTimeRef.current = now
      accumulatedRef.current += dt

      const speed = orbitHovered ? HOVER_SPEED : 1
      const angle = (accumulatedRef.current * ANGULAR_VEL * speed) % (2 * Math.PI)

      setFrame({ angle, time: accumulatedRef.current })
      animRef.current = requestAnimationFrame(tick)
    },
    [orbitHovered]
  )

  useEffect(() => {
    if (paused) {
      cancelAnimationFrame(animRef.current)
      return
    }
    lastTimeRef.current = 0
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [paused, tick])

  const handleClick = () => {
    setPaused((p) => !p)
  }

  const handleCapsuleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleClick()
  }

  const capsules = useMemo(() => {
    const capsuleStates = TAGS.map((_, i) => {
      const theta = frame.angle + (i * 2 * Math.PI) / N
      const x = A * Math.cos(theta)
      const y = B * Math.sin(theta)
      const depth = Math.sin(theta)
      const scale = 1 + depth * 0.055
      const opacity = 0.68 + depth * 0.32
      const zIndex = depth > 0 ? 10 : 1
      const fo = floatOffsets[i]
      const driftY = Math.sin(frame.time * 0.0006 + fo.phase) * fo.amp
      const breath = 1 + Math.sin(frame.time * 0.0008 + fo.phase * 1.3) * fo.breath
      return { x, y: y + driftY, scale: scale * breath, opacity, zIndex }
    })
    return capsuleStates
  }, [frame, floatOffsets])

  return (
    <div
      className="relative w-full h-[240px] flex items-center justify-center select-none overflow-visible"
      onMouseEnter={() => setOrbitHovered(true)}
      onMouseLeave={() => {
        setOrbitHovered(false)
        setHoveredIndex(null)
      }}
    >
      {/* Ambient center glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 120,
          height: 120,
          background: isBright
            ? 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(34,211,238,0.025) 0%, transparent 70%)',
        }}
      />

      {/* Particles */}
      {particles.map((p, i) => {
        const px = p.x + Math.sin(frame.time * 0.0003 + p.phase) * 60
        const py = p.y + Math.cos(frame.time * 0.0004 + p.phase) * 40
        return (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: isBright ? 'rgba(6,182,212,0.2)' : 'rgba(34,211,238,0.15)',
              transform: `translate3d(${px}px, ${py}px, 0)`,
              opacity: p.opacity * (0.5 + 0.5 * Math.sin(frame.time * 0.0005 + p.phase)),
              willChange: 'transform, opacity',
            }}
          />
        )
      })}

      <div className="relative w-0 h-0" onClick={handleClick}>
        {TAGS.map((tag, i) => {
          const c = capsules[i]
          const isHovered = hoveredIndex === i
          const hs = isHovered ? c.scale * 1.15 : c.scale
          return (
            <div
              key={tag}
              onClick={handleCapsuleClick}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="absolute cursor-pointer"
              style={{
                transform: `translate3d(${c.x}px, ${c.y}px, 0) scale(${hs})`,
                opacity: isHovered ? 1 : c.opacity,
                zIndex: isHovered ? 20 : c.zIndex,
                willChange: 'transform',
              }}
            >
              <span
                className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300 whitespace-nowrap"
                style={{
                  backgroundColor: isHovered
                    ? isBright ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.1)'
                    : isBright ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)',
                  border: isHovered
                    ? `1px solid rgba(34,211,238,${isBright ? '0.5' : '0.3'})`
                    : isBright ? '1px solid rgba(0,0,0,0.15)' : '1px solid rgba(255,255,255,0.06)',
                  color: isHovered
                    ? isBright ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)'
                    : isBright ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)',
                  boxShadow: isHovered
                    ? isBright ? '0 0 14px rgba(6,182,212,0.15)' : '0 0 14px rgba(34,211,238,0.18)'
                    : isBright ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                  backdropFilter: isHovered ? 'blur(12px)' : 'blur(6px)',
                }}
              >
                {tag}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
