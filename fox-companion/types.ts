export type FoxState =
  | 'idle'
  | 'hover'
  | 'fly'
  | 'sleep'
  | 'wake'
  | 'curious'
  | 'happy'
  | 'click'
  | 'observe'
  | 'hide'

export interface FoxPosition {
  x: number
  y: number
}

export interface BezierPath {
  start: FoxPosition
  cp: FoxPosition
  end: FoxPosition
}

export type MotionPhase = 'moving' | 'pausing' | 'offScreen'

export interface FoxAnimationState {
  currentState: FoxState
  previousState: FoxState
  position: FoxPosition
  targetPosition: FoxPosition
  currentPath: BezierPath | null
  pathProgress: number
  motionPhase: MotionPhase
  motionTimer: number
  rotation: number
  bobPhase: number
  tailPhase: number
  blinkPhase: number
  earPhase: number
  breathPhase: number
  glowIntensity: number
  scale: number
  opacity: number
}

export interface FoxContextType {
  state: FoxAnimationState
  playAnimation: (animation: FoxState) => void
  moveTo: (x: number, y: number) => void
  sleep: () => void
  wake: () => void
  speak: (text: string) => void
  hide: () => void
  show: () => void
  speechBubble: string | null
  dismissSpeech: () => void
}

export type FoxSound = 'chirp' | 'wake' | 'click'

export interface FoxAudioManager {
  play: (sound: FoxSound) => void
  setVolume: (vol: number) => void
  mute: () => void
  unmute: () => void
  isMuted: boolean
  hasInteracted: boolean
}

export interface IdleAction {
  type: 'lookAround' | 'blink' | 'wagTail' | 'stretch' | 'yawn' | 'roll' | 'spin' | 'emitParticles' | 'sleep' | 'chaseLight'
  duration: number
}

export interface FoxParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  hue: number
  type: 'trail' | 'burst' | 'zzz'
}

export type RouteContext = 'home' | 'projects' | 'research' | 'timeline' | 'globe' | 'contact' | 'unknown'
