'use client'

import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import type { FoxState, FoxAnimationState, BezierPath } from './types'
import {
  canTransition, pickIdleAction, getSafePosition, generateBezierPath,
  bezierPoint, getOffScreenDestination, FOX_WIDTH, FOX_HEIGHT,
} from './FoxBehaviour'
import { FoxParticles } from './FoxParticles'
import { useIdleTimer } from './hooks/useIdleTimer'
import { usePointerTracker } from './hooks/usePointerTracker'
import { useRouteWatcher } from './hooks/useRouteWatcher'
import { useFoxAudio } from './FoxAudio'

const GLOW_COLOR = '#22d3ee'
const GLOW_RGB = '255,215,225'
const IDLE_TIMEOUT = 150000
const PAUSE_MIN = 2000
const PAUSE_MAX = 5000
const MOVE_DURATION_MIN = 8000
const MOVE_DURATION_MAX = 20000

interface FoxProps {
  onStateChange?: (state: FoxState) => void
  onSpeech?: (text: string | null) => void
}

export function Fox({ onStateChange, onSpeech }: FoxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const aRef = useRef<FoxAnimationState>({
    currentState: 'idle', previousState: 'idle',
    position: { x: 60, y: 60 }, targetPosition: { x: 60, y: 60 },
    currentPath: null, pathProgress: 0, motionPhase: 'pausing', motionTimer: 0,
    rotation: 0, bobPhase: 0, tailPhase: 0, blinkPhase: 0, earPhase: 0, breathPhase: 0,
    glowIntensity: 0.6, scale: 1, opacity: 1,
  })
  const stateRef = useRef<FoxState>('idle')
  const motionPhaseRef = useRef<'moving' | 'pausing' | 'offScreen'>('pausing')
  const pathRef = useRef<BezierPath | null>(null)
  const pathProgressRef = useRef(0)
  const moveDurationRef = useRef(10000)
  const pauseTimerRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const lastTimeRef = useRef(0)
  const [renderState, setRenderState] = useState<FoxAnimationState>(aRef.current)
  const [speechBubble, setSpeechBubble] = useState<string | null>(null)
  const [hovered, setHovered] = useState(false)
  const velocityRef = useRef({ x: 0, y: 0 })
  const blinkTimerRef = useRef(3000 + Math.random() * 2000)
  const blinkStateRef = useRef<'open' | 'closing' | 'closed'>('open')
  const audio = useFoxAudio()
  const route = useRouteWatcher()
  const { elementRef, cursorRef } = usePointerTracker()
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clickCooldownRef = useRef(0)
  const hasIdledOnceRef = useRef(false)

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const setState = useCallback((newState: FoxState) => {
    const prev = stateRef.current
    if (newState === prev || !canTransition(prev, newState)) return
    stateRef.current = newState
    aRef.current.previousState = prev
    aRef.current.currentState = newState
    onStateChange?.(newState)
  }, [onStateChange])

  const speak = useCallback((text: string) => {
    setSpeechBubble(text)
    onSpeech?.(text)
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current)
    speechTimerRef.current = setTimeout(() => {
      setSpeechBubble(null)
      onSpeech?.(null)
    }, 3000)
  }, [onSpeech])

  const pickDestination = useCallback(() => {
    const pos = getSafePosition(route, FOX_WIDTH, FOX_HEIGHT)
    aRef.current.targetPosition = pos
    const path = generateBezierPath(aRef.current.position, pos)
    pathRef.current = path
    pathProgressRef.current = 0
    moveDurationRef.current = MOVE_DURATION_MIN + Math.random() * (MOVE_DURATION_MAX - MOVE_DURATION_MIN)
    motionPhaseRef.current = 'moving'
    aRef.current.motionPhase = 'moving'
    if (stateRef.current === 'idle') setState('fly')
  }, [route, setState])

  const startOffScreen = useCallback(() => {
    const { exit, entry } = getOffScreenDestination(FOX_WIDTH, FOX_HEIGHT)
    const exitPath = generateBezierPath(aRef.current.position, exit)
    pathRef.current = exitPath
    pathProgressRef.current = 0
    moveDurationRef.current = 4000 + Math.random() * 3000
    motionPhaseRef.current = 'moving'
    aRef.current.motionPhase = 'moving'
    aRef.current.targetPosition = exit
    setTimeout(() => {
      const entryPath = generateBezierPath(exit, entry)
      pathRef.current = entryPath
      pathProgressRef.current = 0
      moveDurationRef.current = 4000 + Math.random() * 4000
      motionPhaseRef.current = 'moving'
      aRef.current.targetPosition = entry
    }, 2000)
  }, [])

  const goToSleep = useCallback(() => {
    setState('sleep')
    audio.play('wake')
    if (hasIdledOnceRef.current) speak('Zzz...')
    hasIdledOnceRef.current = true
  }, [setState, audio, speak])

  const wakeUp = useCallback(() => {
    if (stateRef.current !== 'sleep') return
    setState('wake')
    audio.play('wake')
    speak('!')
    setTimeout(() => {
      if (stateRef.current === 'wake') {
        setState('idle')
        pickDestination()
      }
    }, 1200)
  }, [setState, audio, speak, pickDestination])

  const handleIdle = useCallback(() => {
    if (stateRef.current !== 'idle') return
    if (Math.random() < 0.3) {
      goToSleep()
    } else {
      const action = pickIdleAction()
      switch (action.type) {
        case 'sleep': goToSleep(); break
        case 'emitParticles': break
        case 'lookAround':
          aRef.current.rotation = 0.2
          setTimeout(() => { aRef.current.rotation = -0.15 }, 800)
          setTimeout(() => { aRef.current.rotation = 0 }, 1600)
          break
        case 'wagTail':
          aRef.current.tailPhase = Math.PI * 6
          break
        case 'stretch':
          aRef.current.scale = 1.4
          setTimeout(() => { aRef.current.scale = 1 }, 800)
          break
        case 'spin':
          aRef.current.rotation = Math.PI * 2
          setTimeout(() => { aRef.current.rotation = 0 }, 2000)
          break
        default: break
      }
    }
  }, [stateRef, goToSleep])

  useIdleTimer(handleIdle, IDLE_TIMEOUT)

  const handleClick = useCallback(() => {
    const now = Date.now()
    if (now - clickCooldownRef.current < 500) return
    clickCooldownRef.current = now

    if (stateRef.current === 'sleep') {
      wakeUp()
      return
    }

    motionPhaseRef.current = 'pausing'
    pauseTimerRef.current = 30000
    pathRef.current = null

    audio.play('click')
    setState('click')
    aRef.current.scale = 1.3
    const msgs = ['Hello!', 'Hi!', '*chirp*', '^_^']
    speak(msgs[Math.floor(Math.random() * msgs.length)])
    setTimeout(() => {
      setState('happy')
      setTimeout(() => {
        if (stateRef.current === 'happy') {
          setState('idle')
        }
      }, 1800)
    }, 300)
  }, [audio, setState, speak, wakeUp])

  const handleMouseEnter = useCallback(() => {
    setHovered(true)
    if (stateRef.current === 'idle') setState('hover')
  }, [setState])

  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    if (stateRef.current === 'hover') setState('idle')
  }, [setState])

  useEffect(() => {
    if (route === 'globe' && (stateRef.current === 'idle' || stateRef.current === 'fly')) {
      setState('observe')
      const pos = getSafePosition('globe', FOX_WIDTH, FOX_HEIGHT)
      aRef.current.targetPosition = pos
      const path = generateBezierPath(aRef.current.position, pos)
      pathRef.current = path
      pathProgressRef.current = 0
      moveDurationRef.current = 6000
      motionPhaseRef.current = 'moving'
      aRef.current.motionPhase = 'moving'
    } else if (route !== 'globe' && stateRef.current === 'observe') {
      setState('idle')
    }
  }, [route, setState])

  useEffect(() => {
    const onInteraction = () => {
      if (stateRef.current === 'sleep') {
        wakeUp()
      }
    }
    const events = ['mousemove', 'mousedown', 'touchstart', 'keydown', 'scroll'] as const
    for (const e of events) {
      window.addEventListener(e, onInteraction, { passive: true })
    }
    return () => {
      for (const e of events) window.removeEventListener(e, onInteraction)
    }
  }, [wakeUp])

  const tick = useCallback((now: number) => {
    const dt = Math.min(now - lastTimeRef.current, 50)
    lastTimeRef.current = now
    const a = aRef.current
    const seconds = dt / 1000

    if (a.currentState === 'sleep') {
      a.glowIntensity = 0.15 + Math.sin(now * 0.0008) * 0.08
      a.scale = 0.65 + Math.sin(now * 0.001) * 0.02
      a.breathPhase += seconds * 0.5
      aRef.current.bobPhase += seconds * 0.3
      aRef.current.tailPhase += seconds * 0.5
      setRenderState({ ...aRef.current })
      animFrameRef.current = requestAnimationFrame(tick)
      return
    }

    if (a.currentState === 'wake') {
      a.scale += (1.0 - a.scale) * 0.08
      a.glowIntensity += (0.6 - a.glowIntensity) * 0.06
      aRef.current.bobPhase += seconds * 1.5
      aRef.current.tailPhase += seconds * 3
      setRenderState({ ...aRef.current })
      animFrameRef.current = requestAnimationFrame(tick)
      return
    }

    /* ─── motion ─── */
    if (motionPhaseRef.current === 'pausing') {
      pauseTimerRef.current -= dt
      if (pauseTimerRef.current <= 0) {
        if (Math.random() < 0.08) {
          startOffScreen()
        } else {
          pickDestination()
        }
      }
    }

    if (motionPhaseRef.current === 'moving' && pathRef.current) {
      const speed = 1 / moveDurationRef.current
      pathProgressRef.current += dt * speed

      if (pathProgressRef.current >= 1) {
        pathProgressRef.current = 1
        const end = pathRef.current.end
        aRef.current.position = { ...end }
        aRef.current.targetPosition = { ...end }
        pathRef.current = null
        motionPhaseRef.current = 'pausing'
        aRef.current.motionPhase = 'pausing'
        pauseTimerRef.current = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN)
        if (stateRef.current === 'fly') setState('idle')
      } else {
        const eased = 1 - Math.pow(1 - pathProgressRef.current, 1.5)
        const pt = bezierPoint(eased, pathRef.current)
        velocityRef.current = {
          x: pt.x - aRef.current.position.x,
          y: pt.y - aRef.current.position.y,
        }
        aRef.current.position = pt
        aRef.current.rotation = Math.atan2(velocityRef.current.y, velocityRef.current.x) * 0.25
        aRef.current.glowIntensity = 0.85 + Math.sin(now * 0.003) * 0.1
      }
    }

    if (motionPhaseRef.current === 'pausing') {
      velocityRef.current = { x: 0, y: 0 }
      aRef.current.rotation *= 0.95
      aRef.current.glowIntensity += (0.55 - aRef.current.glowIntensity) * 0.03
    }

    aRef.current.bobPhase += seconds * 1.2
    aRef.current.tailPhase += seconds * 2.5
    aRef.current.earPhase += seconds * 0.8
    aRef.current.breathPhase += seconds * 1.8

    if (a.currentState === 'hover') {
      a.scale += (1.12 - a.scale) * 0.08
      a.glowIntensity += (0.95 - a.glowIntensity) * 0.05
    } else if (a.currentState !== 'click' && a.currentState !== 'happy') {
      a.scale += (1 - a.scale) * 0.05
    }

    if (a.currentState === 'click') {
      a.glowIntensity = 0.9 + Math.sin(now * 0.006) * 0.1
    }

    blinkTimerRef.current -= dt
    if (blinkTimerRef.current <= 0) {
      if (blinkStateRef.current === 'open') {
        blinkStateRef.current = 'closing'
        blinkTimerRef.current = 80
      } else if (blinkStateRef.current === 'closing') {
        blinkStateRef.current = 'closed'
        blinkTimerRef.current = 100
      } else {
        blinkStateRef.current = 'open'
        blinkTimerRef.current = 3000 + Math.random() * 3000
      }
    }

    setRenderState({ ...aRef.current })
    animFrameRef.current = requestAnimationFrame(tick)
  }, [pickDestination, startOffScreen, setState])

  useEffect(() => {
    lastTimeRef.current = performance.now()
    tickRef.current = tick
    pickDestination()
    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [tick, pickDestination])

  const tickRef = useRef<(now: number) => void>(undefined)

  useEffect(() => {
    tickRef.current = tick
  }, [tick])

  useEffect(() => {
    function onVis() {
      if (document.hidden) {
        cancelAnimationFrame(animFrameRef.current)
      } else if (tickRef.current) {
        lastTimeRef.current = performance.now()
        animFrameRef.current = requestAnimationFrame((now) => tickRef.current!(now))
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const bobY = Math.sin(renderState.bobPhase) * 3
  const floatX = Math.sin(renderState.bobPhase * 0.6) * 2
  const breathScale = 1 + Math.sin(renderState.breathPhase) * 0.015
  const isSleeping = renderState.currentState === 'sleep'
  const blinkScaleY = blinkStateRef.current === 'closed' ? 0.1 : 1

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: renderState.position.x + floatX,
    top: renderState.position.y + bobY,
    width: FOX_WIDTH,
    height: FOX_HEIGHT,
    pointerEvents: 'auto',
    cursor: 'pointer',
    zIndex: 9998,
    opacity: renderState.opacity,
    transform: `rotate(${renderState.rotation}rad) scale(${renderState.scale * breathScale})`,
    transition: prefersReducedMotion ? 'none' : undefined,
    userSelect: 'none',
    touchAction: 'none',
    filter: isSleeping ? 'brightness(0.4) saturate(0.3)' : undefined,
  }

  return (
    <div
      ref={(el) => {
        containerRef.current = el
        elementRef.current = el
      }}
      style={containerStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
      role="img"
      data-fox-state={renderState.currentState}
    >
      <FoxParticles
        position={renderState.position}
        velocity={velocityRef.current}
        state={renderState.currentState}
        motionPhase={renderState.motionPhase}
        blinking={blinkStateRef.current !== 'open'}
      />

      {/* holographic shimmer overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none',
          background: `linear-gradient(${45 + Math.sin(renderState.bobPhase * 0.5) * 20}deg,
            rgba(255,182,193,0.03) 0%, transparent 40%, rgba(255,182,193,0.04) 60%, transparent 100%)`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* BODY */}
      <div
        style={{
          position: 'absolute', left: '50%', top: '50%',
          width: FOX_WIDTH * 0.52, height: FOX_HEIGHT * 0.48,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background: isSleeping
            ? `radial-gradient(ellipse at 40% 30%, rgba(${GLOW_RGB},0.3), rgba(${GLOW_RGB},0.05))`
            : `radial-gradient(ellipse at 40% 30%, rgba(${GLOW_RGB},0.85), rgba(${GLOW_RGB},0.15))`,
          boxShadow: isSleeping
            ? `0 0 8px rgba(${GLOW_RGB},0.15)`
            : `0 0 ${16 + 8 * renderState.glowIntensity}px rgba(${GLOW_RGB},${0.3 * renderState.glowIntensity}),
               0 0 ${50 + 20 * renderState.glowIntensity}px rgba(${GLOW_RGB},${0.1 * renderState.glowIntensity})`,
          transition: 'box-shadow 0.3s',
        }}
      />

      {/* HEAD */}
      <div
        style={{
          position: 'absolute', left: '50%', top: isSleeping ? '34%' : '30%',
          width: FOX_WIDTH * 0.3, height: FOX_HEIGHT * 0.3,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          background: isSleeping
            ? `radial-gradient(circle at 40% 35%, rgba(${GLOW_RGB},0.35), rgba(${GLOW_RGB},0.08))`
            : `radial-gradient(circle at 40% 35%, rgba(${GLOW_RGB},0.9), rgba(${GLOW_RGB},0.25))`,
          boxShadow: isSleeping ? 'none'
            : `0 0 10px rgba(${GLOW_RGB},${0.25 * renderState.glowIntensity})`,
        }}
      >
        {/* EYES */}
        <div style={{
          position: 'absolute', right: '24%', top: '32%',
          width: 3.5, height: 3.5 * blinkScaleY,
          borderRadius: '50%',
          background: '#fff',
          transition: 'height 0.08s',
          boxShadow: '0 0 5px #ffb6c1, 0 0 10px #ffb6c1',
        }}>
          <div style={{
            position: 'absolute', left: '40%', top: '30%',
            width: 1.2, height: 1.2, borderRadius: '50%',
            background: 'rgba(255,182,193,0.8)',
          }} />
        </div>
        <div style={{
          position: 'absolute', left: '24%', top: '32%',
          width: 3.5, height: 3.5 * blinkScaleY,
          borderRadius: '50%',
          background: '#fff',
          transition: 'height 0.08s',
          boxShadow: '0 0 5px #ffb6c1, 0 0 10px #ffb6c1',
        }}>
          <div style={{
            position: 'absolute', left: '40%', top: '30%',
            width: 1.2, height: 1.2, borderRadius: '50%',
            background: 'rgba(255,182,193,0.8)',
          }} />
        </div>

        {/* EARS */}
        <div style={{
          position: 'absolute', right: '-10%', top: '-45%',
          width: 0, height: 0,
          borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
          borderBottom: `11px solid rgba(${GLOW_RGB},${isSleeping ? 0.3 : 0.65})`,
          filter: `drop-shadow(0 0 3px rgba(255,182,193,${isSleeping ? 0.1 : 0.3}))`,
          transform: `rotate(${Math.sin(renderState.earPhase) * 8}deg)`,
          transformOrigin: 'bottom center',
        }} />
        <div style={{
          position: 'absolute', left: '-10%', top: '-45%',
          width: 0, height: 0,
          borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
          borderBottom: `11px solid rgba(${GLOW_RGB},${isSleeping ? 0.3 : 0.65})`,
          filter: `drop-shadow(0 0 3px rgba(255,182,193,${isSleeping ? 0.1 : 0.3}))`,
          transform: `rotate(${Math.sin(renderState.earPhase + 0.5) * -8}deg)`,
          transformOrigin: 'bottom center',
        }} />
      </div>

      {/* TAILS */}
      {[0, 1, 2].map((i) => {
        const phase = renderState.tailPhase + i * 1.8
        const sway = Math.sin(phase) * 14
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: isSleeping ? '28%' : '12%',
              left: `${42 + i * 10}%`,
              width: isSleeping ? 3 : 5,
              height: isSleeping ? 18 : Math.max(18, 30 - i * 3),
              borderRadius: '0 0 50% 50%',
              background: `linear-gradient(to bottom,
                rgba(${GLOW_RGB},${0.65 - i * 0.12}),
                rgba(${GLOW_RGB},0.05))`,
              transform: `rotate(${sway}deg)`,
              transformOrigin: 'top center',
              boxShadow: `0 0 5px rgba(${GLOW_RGB},${0.25 * renderState.glowIntensity})`,
              opacity: 0.5 + renderState.glowIntensity * 0.4,
              transition: 'height 0.4s, width 0.4s',
            }}
          />
        )
      })}

      {/* SPEECH BUBBLE */}
      {speechBubble && (
        <div
          style={{
            position: 'absolute', bottom: '100%', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(5,5,15,0.92)',
            border: '1px solid rgba(255,182,193,0.2)',
            borderRadius: 10,
            padding: '4px 10px',
            color: '#e0f0ff',
            fontSize: 11,
            fontFamily: 'system-ui, sans-serif',
            whiteSpace: 'nowrap',
            marginBottom: 8,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        >
          {speechBubble}
        </div>
      )}
    </div>
  )
}
