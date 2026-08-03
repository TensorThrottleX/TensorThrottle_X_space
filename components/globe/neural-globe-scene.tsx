"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { GlobeEarth } from "./globe-earth"
import { GlobeContinentDots } from "./globe-continent-dots"
import { GlobeEvolutionNodes } from "./globe-evolution-nodes"
import { GlobeConnections } from "./globe-connections"
import { GlobeStarfield, OrbitRings } from "./globe-starfield"
import {
  propagateNetwork,
  GLOBE_RADIUS,
  type EvolutionNode,
  type GlobeEdge,
} from "@/lib/globe-utils"
import type { PropagationEdge } from "./globe-connections"

/* ───── Tuning ───── */

const AUTO_ROTATION_SPEED = 0.04
const IDLE_DRIFT_SPEED = 0.015
const DRAG_SENSITIVITY_X = 3.0
const DRAG_SENSITIVITY_Y = 1.5
const DRAG_FRICTION = 0.96
const PITCH_LIMIT = 0.8
const BREATH_ONSET = 10
const BREATH_AMPLITUDE = 0.004
const FLOAT_AMPLITUDE = 0.015
const FLOAT_SPEED = 0.5

const CHASE_RADIUS = GLOBE_RADIUS * 2.0
const CHASE_INFLUENCE = 0.45
const CHASE_ACCEL = 0.035
const CHASE_DAMPING = 0.93
const CHASE_MAX_VEL = 0.035
const CHASE_MIN_VEL = 0.0002

const EXIT_DAMPING = 0.96
const EXIT_BLEND_THRESHOLD = 0.003

const IDLE_SPRING = 0.02

const FOCUS_SPRING = 0.03
const FOCUS_FREEZE_THRESHOLD = 0.3

/* ───── Quaternion Helpers ───── */

const _euler = new THREE.Euler()
const _quat = new THREE.Quaternion()
const _axis = new THREE.Vector3()
const _camDir = new THREE.Vector3(0, 1.2, 5.5).normalize()
const _sphereCenter = new THREE.Vector3(0, 0, 0)
const _hitPoint = new THREE.Vector3()
const _localDir = new THREE.Vector3()

/* ───── CursorFollowingGroup ───── */

interface CursorFollowingGroupProps {
  children: React.ReactNode
  isGlobeHovered: React.MutableRefObject<boolean>
  explorationMode: boolean
  isDragging: React.MutableRefObject<boolean>
  dragDelta: React.MutableRefObject<THREE.Vector2>
  idleSeconds: React.MutableRefObject<number>
  isNodeHovered: React.MutableRefObject<boolean>
  isNodeSelected: React.MutableRefObject<boolean>
}

function CursorFollowingGroup({
  children,
  isGlobeHovered,
  explorationMode,
  isDragging,
  dragDelta,
  idleSeconds,
  isNodeHovered,
  isNodeSelected,
}: CursorFollowingGroupProps) {
  const groupRef = useRef<THREE.Group>(null)
  const raycaster = useRef(new THREE.Raycaster())
  const chaseSphere = useRef(new THREE.Sphere(_sphereCenter, CHASE_RADIUS))

  const currentQuat = useRef(new THREE.Quaternion())
  const baseQuat = useRef(new THREE.Quaternion())

  const angularVelocity = useRef({ x: 0, y: 0 })
  const cursorPitch = useRef(0)
  const cursorYawOffset = useRef(0)
  const autoRotationAngle = useRef(0)
  const floatPhase = useRef(Math.random() * Math.PI * 2)
  const wasExploration = useRef(false)

  /* mass‑chase physics state */
  const pitchVel = useRef(0)
  const yawVel = useRef(0)
  const chasePitch = useRef(0)
  const chaseYaw = useRef(0)
  const targetPitch = useRef(0)
  const targetYaw = useRef(0)
  const isExiting = useRef(false)

  useFrame(({ camera, pointer }, delta) => {
    if (!groupRef.current) return
    const dt = Math.min(delta, 0.05)

    const isNodeActive = isNodeHovered.current || isNodeSelected.current

    /* ─── FLOATING (always) ─── */
    floatPhase.current += dt * FLOAT_SPEED
    groupRef.current.position.y = Math.sin(floatPhase.current) * FLOAT_AMPLITUDE

    /* ─── BREATHING (always) ─── */
    const idle = idleSeconds.current
    if (idle > BREATH_ONSET) {
      const t = idle - BREATH_ONSET
      groupRef.current.scale.setScalar(1 + Math.sin(t * 0.25) * BREATH_AMPLITUDE)
    } else {
      const s = groupRef.current.scale.x
      groupRef.current.scale.setScalar(s + (1 - s) * 0.03)
    }

    /* ─── NODE INTERACTION → freeze rotation, keep current orientation ─── */
    if (isNodeActive) return

    /* ─── EXPLORATION MODE ─── */
    if (explorationMode) {
      if (wasExploration.current === false) {
        wasExploration.current = true
        _euler.setFromQuaternion(currentQuat.current, "YXZ")
        autoRotationAngle.current = _euler.y
        cursorPitch.current = _euler.x
        cursorYawOffset.current = 0
      }

      if (isDragging.current) {
        angularVelocity.current.x = dragDelta.current.x * DRAG_SENSITIVITY_X
        angularVelocity.current.y = dragDelta.current.y * DRAG_SENSITIVITY_Y
        // Clear delta so it doesn't stick if the mouse stops moving
        dragDelta.current.set(0, 0)
      }

      // Add momentum to angles directly (OrbitControls style)
      autoRotationAngle.current += angularVelocity.current.x * dt
      cursorPitch.current += angularVelocity.current.y * dt

      // Apply friction
      angularVelocity.current.x *= DRAG_FRICTION
      angularVelocity.current.y *= DRAG_FRICTION

      // Clamp pitch to prevent flipping
      cursorPitch.current = THREE.MathUtils.clamp(cursorPitch.current, -PITCH_LIMIT, PITCH_LIMIT)

      // Idle drift when momentum dies down and we're not dragging
      if (!isDragging.current && Math.abs(angularVelocity.current.x) < 0.001) {
        autoRotationAngle.current += IDLE_DRIFT_SPEED * dt
      }

      // Reconstruct quaternion from clean Euler angles (NO ROLL)
      _euler.set(cursorPitch.current, autoRotationAngle.current, 0, "YXZ")
      currentQuat.current.setFromEuler(_euler)

      groupRef.current.quaternion.copy(currentQuat.current)
      return
    }

    /* ─── IDLE / CHASE MODE ─── */
    if (wasExploration.current) {
      wasExploration.current = false
      _euler.setFromQuaternion(currentQuat.current, "YXZ")
      autoRotationAngle.current = _euler.y
      cursorPitch.current = _euler.x
      cursorYawOffset.current = 0
      pitchVel.current = 0
      yawVel.current = 0
      chasePitch.current = 0
      chaseYaw.current = 0
      targetPitch.current = 0
      targetYaw.current = 0
      isExiting.current = false
    }

    /* ─── RAYCAST TARGET ─── */
    if (isGlobeHovered.current) {
      raycaster.current.setFromCamera(pointer, camera)
      _hitPoint.set(0, 0, 0)
      if (raycaster.current.ray.intersectSphere(chaseSphere.current, _hitPoint)) {
        _localDir.copy(_hitPoint).sub(_sphereCenter).normalize()
        targetPitch.current = Math.asin(-_localDir.y) * CHASE_INFLUENCE
        targetYaw.current = Math.atan2(_localDir.x, _localDir.z) * CHASE_INFLUENCE
      }
      isExiting.current = false

      const errP = targetPitch.current - chasePitch.current
      const errY = targetYaw.current - chaseYaw.current
      const desireP = errP * CHASE_ACCEL
      const desireY = errY * CHASE_ACCEL
      pitchVel.current += (desireP - pitchVel.current) * CHASE_ACCEL
      yawVel.current += (desireY - yawVel.current) * CHASE_ACCEL
      pitchVel.current = THREE.MathUtils.clamp(pitchVel.current, -CHASE_MAX_VEL, CHASE_MAX_VEL)
      yawVel.current = THREE.MathUtils.clamp(yawVel.current, -CHASE_MAX_VEL, CHASE_MAX_VEL)
      pitchVel.current *= CHASE_DAMPING
      yawVel.current *= CHASE_DAMPING
      chasePitch.current += pitchVel.current * dt * 60
      chaseYaw.current += yawVel.current * dt * 60
    } else {
      if (!isExiting.current) isExiting.current = true
      pitchVel.current *= EXIT_DAMPING
      yawVel.current *= EXIT_DAMPING
      chasePitch.current += pitchVel.current * dt * 60
      chaseYaw.current += yawVel.current * dt * 60
      if (Math.abs(pitchVel.current) < CHASE_MIN_VEL && Math.abs(yawVel.current) < CHASE_MIN_VEL) {
        chasePitch.current += (0 - chasePitch.current) * 0.01
        chaseYaw.current += (0 - chaseYaw.current) * 0.01
      }
    }

    cursorPitch.current += (chasePitch.current - cursorPitch.current) * IDLE_SPRING
    cursorYawOffset.current += (chaseYaw.current - cursorYawOffset.current) * IDLE_SPRING

    autoRotationAngle.current += AUTO_ROTATION_SPEED * dt

    _euler.set(cursorPitch.current, autoRotationAngle.current + cursorYawOffset.current, 0, "YXZ")
    baseQuat.current.setFromEuler(_euler)
    currentQuat.current.copy(baseQuat.current)

    _euler.setFromQuaternion(currentQuat.current, "YXZ")
    autoRotationAngle.current = _euler.y

    groupRef.current.quaternion.copy(currentQuat.current)
  })

  return <group ref={groupRef}>{children}</group>
}

/* ───── Scene ───── */

interface NeuralGlobeSceneProps {
  nodes: EvolutionNode[]
  edges: GlobeEdge[]
  autoRotate: boolean
  rotationSpeed: number
  enableInteraction: boolean
  showParticles: boolean
  showConnections: boolean
  bloomIntensity: number
  dotStrength?: number
  starfieldIntensity?: number
  onNodeHover?: (node: EvolutionNode | null) => void
  onNodeClick?: (node: EvolutionNode) => void
  onNodeLeave?: (node: EvolutionNode) => void
}

const DRAG_THRESHOLD_PX = 5

function Scene({
  nodes,
  edges,
  enableInteraction,
  showParticles,
  showConnections,
  starfieldIntensity,
  dotStrength = 1,
  onNodeHover,
  onNodeClick,
  onNodeLeave,
}: NeuralGlobeSceneProps) {
  const [explorationMode, setExplorationMode] = useState(false)
  const isDragging = useRef(false)
  const dragDelta = useRef(new THREE.Vector2(0, 0))
  const lastDragPos = useRef(new THREE.Vector2(0, 0))
  const pointerStartPos = useRef({ x: 0, y: 0 })
  const lastInteractionTime = useRef(999999)
  const idleSeconds = useRef(0)
  const isGlobeHovered = useRef(false)
  const isNodeHovered = useRef(false)
  const isNodeSelected = useRef(false)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [activatedNodeIds, setActivatedNodeIds] = useState<Set<string>>(new Set())
  const [propagatedEdges, setPropagatedEdges] = useState<PropagationEdge[]>([])
  const [propagationStartTime, setPropagationStartTime] = useState(0)
  const [activationTime, setActivationTime] = useState(0)

  const [hoverPropagatedEdges, setHoverPropagatedEdges] = useState<PropagationEdge[]>([])
  const [hoverPropagationStartTime, setHoverPropagationStartTime] = useState(0)
  const [hoverActivatedIds, setHoverActivatedIds] = useState<Set<string>>(new Set())
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    isNodeSelected.current = selectedNodeId !== null
  }, [selectedNodeId])

  useEffect(() => {
    isNodeHovered.current = hoveredNodeId !== null
  }, [hoveredNodeId])

  useFrame(({ clock }) => {
    idleSeconds.current = clock.getElapsedTime() - lastInteractionTime.current
  })

  const handleGlobeEnter = useCallback(() => {
    isGlobeHovered.current = true
    document.body.style.cursor = "crosshair"
  }, [])

  const handleGlobeLeave = useCallback(() => {
    isGlobeHovered.current = false
    if (!hoveredNodeId) {
      document.body.style.cursor = "auto"
    }
  }, [hoveredNodeId])

  const handleDoubleClick = useCallback(() => {
    setExplorationMode((prev) => !prev)
  }, [])

  useEffect(() => {
    if (!enableInteraction) return
    const clickHandler = (e: MouseEvent) => {
      if (e.detail === 2) handleDoubleClick()
    }
    const downHandler = (e: MouseEvent) => {
      if (explorationMode && !isNodeSelected.current) {
        pointerStartPos.current = { x: e.clientX, y: e.clientY }
        lastDragPos.current.set(e.clientX, e.clientY)
        isDragging.current = false
      }
    }
    const moveHandler = (e: MouseEvent) => {
      if (!explorationMode || isNodeSelected.current) return
      if (!isDragging.current) {
        const dx = e.clientX - pointerStartPos.current.x
        const dy = e.clientY - pointerStartPos.current.y
        if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return
        lastDragPos.current.set(pointerStartPos.current.x, pointerStartPos.current.y)
        isDragging.current = true
      }
      dragDelta.current.set(
        (e.clientX - lastDragPos.current.x) / window.innerWidth,
        (e.clientY - lastDragPos.current.y) / window.innerHeight
      )
      lastDragPos.current.set(e.clientX, e.clientY)
    }
    const upHandler = () => {
      isDragging.current = false
      dragDelta.current.set(0, 0)
    }

    const touchStartHandler = (e: TouchEvent) => {
      if (explorationMode && !isNodeSelected.current) {
        pointerStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        lastDragPos.current.set(e.touches[0].clientX, e.touches[0].clientY)
        isDragging.current = false
      }
    }
    const touchMoveHandler = (e: TouchEvent) => {
      if (!explorationMode || isNodeSelected.current) {
        if (isDragging.current) {
          isDragging.current = false
          dragDelta.current.set(0, 0)
        }
        return
      }
      if (!isDragging.current) {
        const dx = e.touches[0].clientX - pointerStartPos.current.x
        const dy = e.touches[0].clientY - pointerStartPos.current.y
        if (dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          e.preventDefault()
          return
        }
        lastDragPos.current.set(pointerStartPos.current.x, pointerStartPos.current.y)
        isDragging.current = true
      }
      e.preventDefault()
      const t = e.touches[0]
      dragDelta.current.set(
        (t.clientX - lastDragPos.current.x) / window.innerWidth,
        (t.clientY - lastDragPos.current.y) / window.innerHeight
      )
      lastDragPos.current.set(t.clientX, t.clientY)
    }
    const touchEndHandler = () => {
      isDragging.current = false
      dragDelta.current.set(0, 0)
    }

    window.addEventListener("click", clickHandler)
    window.addEventListener("mousedown", downHandler)
    window.addEventListener("mousemove", moveHandler)
    window.addEventListener("mouseup", upHandler)
    window.addEventListener("touchstart", touchStartHandler, { passive: true })
    window.addEventListener("touchmove", touchMoveHandler, { passive: false })
    window.addEventListener("touchend", touchEndHandler)
    return () => {
      window.removeEventListener("click", clickHandler)
      window.removeEventListener("mousedown", downHandler)
      window.removeEventListener("mousemove", moveHandler)
      window.removeEventListener("mouseup", upHandler)
      window.removeEventListener("touchstart", touchStartHandler)
      window.removeEventListener("touchmove", touchMoveHandler)
      window.removeEventListener("touchend", touchEndHandler)
    }
  }, [enableInteraction, explorationMode, handleDoubleClick])

  const computePropagation = useCallback(
    (sourceId: string) => {
      const propagated = propagateNetwork(sourceId, nodes, edges, 6)
      const allActivated = new Set<string>([sourceId])
      const edgeList: PropagationEdge[] = []

      let index = 0
      for (const p of propagated) {
        allActivated.add(p.nodeId)
        edgeList.push({
          from: p.fromId,
          to: p.nodeId,
          delay: p.delay + index * 0.05,
        })
        index++
      }

      return { edges: edgeList, activatedNodeIds: allActivated }
    },
    [nodes, edges]
  )

  const handleSelectNode = useCallback(
    (id: string | null) => {
      lastInteractionTime.current = 999999
      setSelectedNodeId(id)

      if (id) {
        const node = nodes.find((n) => n.id === id)
        if (node && onNodeClick) onNodeClick(node)

        const { edges: propEdges, activatedNodeIds: activated } =
          computePropagation(id)
        setPropagatedEdges(propEdges)
        setPropagationStartTime(performance.now() / 1000)
        setActivationTime(performance.now() / 1000)
        setActivatedNodeIds(activated)
      } else {
        setPropagatedEdges([])
        setActivatedNodeIds(new Set())
      }
    },
    [nodes, onNodeClick, computePropagation]
  )

  const handleHoverNode = useCallback(
    (id: string | null) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }

      setHoveredNodeId(id)

      if (id) {
        document.body.style.cursor = "pointer"

        const node = nodes.find((n) => n.id === id)
        if (node) {
          if (onNodeHover) onNodeHover(node)
        }

        const { edges: propEdges, activatedNodeIds: activated } =
          computePropagation(id)
        setHoverPropagatedEdges(propEdges)
        setHoverPropagationStartTime(performance.now() / 1000)
        setHoverActivatedIds(activated)
      } else {
        if (isGlobeHovered.current) {
          document.body.style.cursor = "crosshair"
        } else {
          document.body.style.cursor = "auto"
        }

        hoverTimeoutRef.current = setTimeout(() => {
          setHoverPropagatedEdges([])
          setHoverActivatedIds(new Set())
          hoverTimeoutRef.current = null
        }, 2000)

        if (selectedNodeId) {
          const node = nodes.find((n) => n.id === selectedNodeId)
          if (node && onNodeLeave) onNodeLeave(node)
        }
      }
    },
    [nodes, selectedNodeId, onNodeHover, onNodeLeave, computePropagation]
  )

  return (
    <>
      {showParticles && (
        <>
          <GlobeStarfield count={2000} intensity={starfieldIntensity ?? 1} />
          <OrbitRings />
        </>
      )}

      <CursorFollowingGroup
        isGlobeHovered={isGlobeHovered}
        explorationMode={explorationMode}
        isDragging={isDragging}
        dragDelta={dragDelta}
        idleSeconds={idleSeconds}
        isNodeHovered={isNodeHovered}
        isNodeSelected={isNodeSelected}
      >
        <GlobeEarth
          onPointerEnter={handleGlobeEnter}
          onPointerLeave={handleGlobeLeave}
          onClick={() => handleSelectNode(null)}
        />
        <GlobeContinentDots strength={dotStrength} />
        <GlobeEvolutionNodes
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          hoveredNodeId={hoveredNodeId}
          onHoverNode={handleHoverNode}
          activatedNodeIds={activatedNodeIds}
          activationTime={activationTime}
          hoverActivatedIds={hoverActivatedIds}
          isNodeHoveredRef={isNodeHovered}
        />
        {showConnections && (
          <GlobeConnections
            nodes={nodes}
            edges={edges}
            highlightNodeId={selectedNodeId}
            propagatedEdges={propagatedEdges}
            propagationStartTime={propagationStartTime}
            hoverPropagatedEdges={hoverPropagatedEdges}
            hoverPropagationStartTime={hoverPropagationStartTime}
          />
        )}
      </CursorFollowingGroup>
    </>
  )
}

/* ───── Entry Point ───── */

export interface NeuralGlobeInternalProps extends NeuralGlobeSceneProps {}

export function NeuralGlobeInternal(props: NeuralGlobeInternalProps) {
  return <Scene {...props} />
}
