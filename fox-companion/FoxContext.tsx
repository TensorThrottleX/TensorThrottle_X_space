'use client'

import { createContext } from 'react'
import type { FoxContextType, FoxAnimationState } from './types'

const DEFAULT_STATE: FoxAnimationState = {
  currentState: 'idle',
  previousState: 'idle',
  position: { x: 60, y: 60 },
  targetPosition: { x: 60, y: 60 },
  currentPath: null,
  pathProgress: 0,
  motionPhase: 'pausing',
  motionTimer: 0,
  rotation: 0,
  bobPhase: 0,
  tailPhase: 0,
  blinkPhase: 0,
  earPhase: 0,
  breathPhase: 0,
  glowIntensity: 0.6,
  scale: 1,
  opacity: 1,
}

export const FoxContext = createContext<FoxContextType | null>(null)
export { DEFAULT_STATE }
