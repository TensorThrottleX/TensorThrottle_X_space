'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import type { FoxParticle, FoxPosition } from './types'

let nextId = 0

interface FoxParticlesProps {
  position: FoxPosition
  velocity: FoxPosition
  state: string
  motionPhase: string
  blinking: boolean
}

const TRAIL_RATE = 40
const BURST_COUNT = 12

export function FoxParticles({ position, velocity, state, motionPhase, blinking }: FoxParticlesProps) {
  const particlesRef = useRef<FoxParticle[]>([])
  const rafRef = useRef<number>(0)
  const [particles, setParticles] = useState<FoxParticle[]>([])
  const trailAccum = useRef(0)

  const spawn = useCallback((count: number, cx: number, cy: number, type: FoxParticle['type']) => {
    const now = performance.now()
    const newP: FoxParticle[] = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = type === 'zzz' ? 0.05 + Math.random() * 0.1
        : type === 'burst' ? 0.8 + Math.random() * 1.5
        : 0.2 + Math.random() * 0.6
      newP.push({
        id: nextId++,
        x: cx + (Math.random() - 0.5) * 8,
        y: cy + (Math.random() - 0.5) * 8,
        vx: type === 'zzz' ? (Math.random() - 0.5) * 0.1 : Math.cos(angle) * speed,
        vy: type === 'zzz' ? -speed : Math.sin(angle) * speed - 0.2,
        life: 0,
        maxLife: type === 'zzz' ? 2000 + Math.random() * 1000 : type === 'burst' ? 400 + Math.random() * 300 : 600 + Math.random() * 400,
        size: type === 'zzz' ? 2 + Math.random() * 2 : type === 'burst' ? 2 + Math.random() * 3 : 1.5 + Math.random() * 2,
        hue: type === 'zzz' ? 200 : 180 + Math.random() * 30,
        type,
      })
    }
    particlesRef.current = [...particlesRef.current, ...newP]
  }, [])

  useEffect(() => {
    let lastSpawn = 0
    let zzzTimer = 0

    function tick(now: number) {
      const dt = Math.min(now - lastSpawn || 16, 50)
      lastSpawn = now

      trailAccum.current += dt

      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)

      if (state === 'sleep') {
        zzzTimer += dt
        if (zzzTimer > 800) {
          zzzTimer = 0
          spawn(1, position.x + (Math.random() - 0.5) * 10, position.y - 10, 'zzz')
        }
      } else if (motionPhase === 'moving' && speed > 0.1) {
        if (trailAccum.current > TRAIL_RATE) {
          trailAccum.current = 0
          spawn(1, position.x, position.y, 'trail')
        }
      } else {
        zzzTimer = 0
      }

      const alive: FoxParticle[] = []
      for (const p of particlesRef.current) {
        p.life += dt
        if (p.life >= p.maxLife) continue
        if (p.type === 'zzz') {
          p.x += p.vx
          p.y += p.vy
          p.vx += (Math.random() - 0.5) * 0.02
        } else if (p.type === 'burst') {
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.03
          p.vx *= 0.97
        } else {
          p.x += p.vx
          p.y += p.vy
          p.vy += 0.005
          p.vx *= 0.98
          p.vy *= 0.98
        }
        alive.push(p)
      }
      particlesRef.current = alive
      if (alive.length !== particles.length) {
        setParticles(alive)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [state, motionPhase, velocity, position, spawn, particles.length])

  if (particles.length === 0) return null

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {particles.map((p) => {
        const lifeRatio = p.life / p.maxLife
        const opacity = p.type === 'zzz'
          ? (1 - lifeRatio) * 0.4
          : (1 - lifeRatio) * 0.7
        const size = p.type === 'zzz' ? p.size * (0.5 + lifeRatio * 0.5) : p.size
        return (
          <div
            key={p.id}
            style={{
              position: 'fixed',
              left: p.x,
              top: p.y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(${p.hue < 190 ? '34,211,238' : '180,220,255'}, ${opacity}), transparent)`,
              opacity,
              transform: 'translate(-50%, -50%)',
              boxShadow: p.type === 'zzz'
                ? 'none'
                : `0 0 ${size * 2}px rgba(34,211,238, ${opacity * 0.5})`,
            }}
          >
            {p.type === 'zzz' && (
              <span style={{
                fontSize: 8,
                color: 'rgba(180,220,255,0.5)',
                fontFamily: 'serif',
                fontStyle: 'italic',
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}>z</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
