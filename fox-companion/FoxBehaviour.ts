import type { FoxState, RouteContext, FoxPosition, BezierPath, IdleAction } from './types'

const IDLE_ACTIONS: IdleAction[] = [
  { type: 'lookAround', duration: 2500 },
  { type: 'blink', duration: 200 },
  { type: 'wagTail', duration: 2000 },
  { type: 'stretch', duration: 2500 },
  { type: 'yawn', duration: 2000 },
  { type: 'roll', duration: 1500 },
  { type: 'spin', duration: 2000 },
  { type: 'emitParticles', duration: 2000 },
  { type: 'sleep', duration: 6000 },
  { type: 'chaseLight', duration: 3000 },
]

export function pickIdleAction(): IdleAction {
  return IDLE_ACTIONS[Math.floor(Math.random() * IDLE_ACTIONS.length)]
}

const VALID_TRANSITIONS: Record<FoxState, FoxState[]> = {
  idle: ['hover', 'fly', 'sleep', 'curious', 'observe', 'click', 'hide'],
  hover: ['idle', 'click', 'happy', 'fly'],
  fly: ['idle', 'hover'],
  sleep: ['wake'],
  wake: ['idle'],
  curious: ['idle', 'hover'],
  happy: ['idle', 'hover'],
  click: ['happy', 'idle'],
  observe: ['idle', 'hover', 'fly'],
  hide: ['idle'],
}

export function canTransition(from: FoxState, to: FoxState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getRouteContext(pathname: string): RouteContext {
  if (pathname === '/' || pathname === '') return 'home'
  if (pathname.startsWith('/projects')) return 'projects'
  if (pathname.startsWith('/research')) return 'research'
  if (pathname.startsWith('/timeline')) return 'timeline'
  if (pathname.startsWith('/globe') || pathname.startsWith('/test-globe')) return 'globe'
  if (pathname.startsWith('/contact')) return 'contact'
  return 'unknown'
}

export const FOX_WIDTH = 80
export const FOX_HEIGHT = 60

const MARGIN_TOP = 80
const MARGIN_BOTTOM = 80
const MARGIN_LEFT = 20
const MARGIN_RIGHT = 20
const AVOID_CENTER_RADIUS = 150

export function getSafePosition(
  route: RouteContext,
  foxWidth: number,
  foxHeight: number,
): FoxPosition {
  const ww = window.innerWidth
  const wh = window.innerHeight

  let marginL = MARGIN_LEFT
  let marginR = MARGIN_RIGHT
  let marginT = MARGIN_TOP
  let marginB = MARGIN_BOTTOM

  if (route === 'globe') {
    marginL = 100
    marginR = 100
    marginT = 100
    marginB = 100
  }

  const x = marginL + Math.random() * (ww - foxWidth - marginL - marginR)
  const y = marginT + Math.random() * (wh - foxHeight - marginT - marginB)

  return { x, y }
}

export function getOffScreenDestination(
  foxWidth: number,
  foxHeight: number,
): { exit: FoxPosition; entry: FoxPosition; entryEdge: 'top' | 'right' | 'bottom' | 'left' } {
  const ww = window.innerWidth
  const wh = window.innerHeight

  const edge = ['top', 'right', 'bottom', 'left'][Math.floor(Math.random() * 4)] as 'top' | 'right' | 'bottom' | 'left'

  let exit: FoxPosition
  switch (edge) {
    case 'top':
      exit = { x: Math.random() * ww, y: -foxHeight - 40 }
      break
    case 'right':
      exit = { x: ww + 40, y: Math.random() * wh }
      break
    case 'bottom':
      exit = { x: Math.random() * ww, y: wh + foxHeight + 40 }
      break
    case 'left':
      exit = { x: -foxWidth - 40, y: Math.random() * wh }
      break
  }

  const oppEdge = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[edge] as 'top' | 'right' | 'bottom' | 'left'
  let entry: FoxPosition
  switch (oppEdge) {
    case 'top':
      entry = { x: 100 + Math.random() * (ww - 200), y: -foxHeight - 20 }
      break
    case 'right':
      entry = { x: ww + 20, y: 100 + Math.random() * (wh - 200) }
      break
    case 'bottom':
      entry = { x: 100 + Math.random() * (ww - 200), y: wh + foxHeight + 20 }
      break
    case 'left':
      entry = { x: -foxWidth - 20, y: 100 + Math.random() * (wh - 200) }
      break
  }

  return { exit, entry, entryEdge: oppEdge }
}

export function generateBezierPath(start: FoxPosition, end: FoxPosition): BezierPath {
  const mx = (start.x + end.x) / 2
  const my = (start.y + end.y) / 2
  const dx = end.x - start.x
  const dy = end.y - start.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const perpScale = 0.3 + Math.random() * 0.5
  const nx = -dy / (dist || 1) * dist * perpScale
  const ny = dx / (dist || 1) * dist * perpScale
  return {
    start,
    cp: { x: mx + nx * (0.3 + Math.random() * 0.4), y: my + ny * (0.3 + Math.random() * 0.4) },
    end,
  }
}

export function bezierPoint(t: number, path: BezierPath): FoxPosition {
  const t1 = 1 - t
  return {
    x: t1 * t1 * path.start.x + 2 * t1 * t * path.cp.x + t * t * path.end.x,
    y: t1 * t1 * path.start.y + 2 * t1 * t * path.cp.y + t * t * path.end.y,
  }
}

export function shouldAvoidCenter(x: number, y: number, ww: number, wh: number): boolean {
  const cx = ww / 2
  const cy = wh / 2
  const dx = x + FOX_WIDTH / 2 - cx
  const dy = y + FOX_HEIGHT / 2 - cy
  return dx * dx + dy * dy < AVOID_CENTER_RADIUS * AVOID_CENTER_RADIUS
}
