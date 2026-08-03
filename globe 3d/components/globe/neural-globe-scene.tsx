"use client"

import { useRef, useState, useCallback, useEffect, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { GlobeEarth } from "./globe-earth"
import { GlobeContinentDots } from "./globe-continent-dots"
import { GlobeEvolutionNodes } from "./globe-evolution-nodes"
import { GlobeConnections } from "./globe-connections"
import { GlobeStarfield, OrbitRings } from "./globe-starfield"
import {
  defaultEvolutionNodes,
  defaultEdges,
  propagateNetwork,
  type EvolutionNode,
  type GlobeEdge,
} from "@/lib/globe-utils"

interface NeuralGlobeSceneProps {
  nodes: EvolutionNode[]
  edges: GlobeEdge[]
  autoRotate: boolean
  rotationSpeed: number
  enableInteraction: boolean
  showParticles: boolean
  showConnections: boolean
  bloomIntensity: number
  onNodeHover?: (node: EvolutionNode | null) => void
  onNodeClick?: (node: EvolutionNode) => void
  onNodeLeave?: (node: EvolutionNode) => void
}

function CursorFollowingGroup({
  children,
  mouseNDC,
  freeRotationMode,
  isDragging,
  dragDelta,
  idleSeconds,
}: {
  children: React.ReactNode
  mouseNDC: React.MutableRefObject<THREE.Vector2>
  freeRotationMode: boolean
  isDragging: React.MutableRefObject<boolean>
  dragDelta: React.MutableRefObject<THREE.Vector2>
  idleSeconds: React.MutableRefObject<number>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const velocity = useRef({ x: 0, y: 0 })
  const cursorInfluence = useRef({ x: 0, y: 0 })
  const breathScale = useRef(1)

  useFrame((_, delta) => {
    if (!groupRef.current) return

    if (freeRotationMode) {
      if (isDragging.current) {
        velocity.current.x = dragDelta.current.x * 2.0
        velocity.current.y = dragDelta.current.y * 1.0
      }

      groupRef.current.rotation.y += velocity.current.x * delta
      groupRef.current.rotation.x += velocity.current.y * delta

      velocity.current.x *= 0.96
      velocity.current.y *= 0.96

      groupRef.current.rotation.x = THREE.MathUtils.clamp(
        groupRef.current.rotation.x, -0.8, 0.8
      )

      if (!isDragging.current && Math.abs(velocity.current.x) < 0.001) {
        groupRef.current.rotation.y += delta * 0.015
      }
    } else {
      const mx = mouseNDC.current.x
      const my = mouseNDC.current.y

      cursorInfluence.current.x += (mx * 0.25 - cursorInfluence.current.x) * 0.015
      cursorInfluence.current.y += (-my * 0.12 - cursorInfluence.current.y) * 0.015

      groupRef.current.rotation.x = cursorInfluence.current.y
      groupRef.current.rotation.y += delta * 0.04

      const idle = idleSeconds.current
      if (idle > 10) {
        const t = idle - 10
        breathScale.current = 1 + Math.sin(t * 0.25) * 0.004
      } else {
        breathScale.current += (1 - breathScale.current) * 0.03
      }
      groupRef.current.scale.setScalar(breathScale.current)
    }
  })

  return <group ref={groupRef}>{children}</group>
}

function MouseTracker({
  mouseNDC,
}: {
  mouseNDC: React.MutableRefObject<THREE.Vector2>
}) {
  useFrame(({ pointer }) => {
    mouseNDC.current.x = pointer.x
    mouseNDC.current.y = pointer.y
  })
  return null
}

function Scene({
  nodes,
  edges,
  autoRotate,
  rotationSpeed,
  enableInteraction,
  showParticles,
  showConnections,
  bloomIntensity,
  onNodeHover,
  onNodeClick,
  onNodeLeave,
}: NeuralGlobeSceneProps) {
  const mouseNDC = useRef(new THREE.Vector2(0, 0))
  const [freeRotationMode, setFreeRotationMode] = useState(false)
  const isDragging = useRef(false)
  const dragDelta = useRef(new THREE.Vector2(0, 0))
  const lastDragPos = useRef(new THREE.Vector2(0, 0))
  const lastInteractionTime = useRef(999999)
  const idleSeconds = useRef(0)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [activatedNodeIds, setActivatedNodeIds] = useState<Set<string>>(new Set())
  const [propagatedEdges, setPropagatedEdges] = useState<
    { from: string; to: string; delay: number }[]
  >([])
  const [propagationStartTime, setPropagationStartTime] = useState(0)
  const [activationTime, setActivationTime] = useState(0)

  useFrame(({ clock }) => {
    idleSeconds.current = clock.getElapsedTime() - lastInteractionTime.current
  })

  const handleDoubleClick = useCallback(() => {
    setFreeRotationMode((prev) => !prev)
  }, [])

  useEffect(() => {
    if (!enableInteraction) return
    const handler = (e: MouseEvent) => {
      if (e.detail === 2) handleDoubleClick()
    }
    const downHandler = (e: MouseEvent) => {
      if (freeRotationMode) {
        isDragging.current = true
        lastDragPos.current.set(e.clientX, e.clientY)
      }
    }
    const moveHandler = (e: MouseEvent) => {
      if (isDragging.current) {
        dragDelta.current.set(
          (e.clientX - lastDragPos.current.x) / window.innerWidth,
          (e.clientY - lastDragPos.current.y) / window.innerHeight
        )
        lastDragPos.current.set(e.clientX, e.clientY)
      }
    }
    const upHandler = () => {
      isDragging.current = false
      dragDelta.current.set(0, 0)
    }

    window.addEventListener("click", handler)
    window.addEventListener("mousedown", downHandler)
    window.addEventListener("mousemove", moveHandler)
    window.addEventListener("mouseup", upHandler)
    return () => {
      window.removeEventListener("click", handler)
      window.removeEventListener("mousedown", downHandler)
      window.removeEventListener("mousemove", moveHandler)
      window.removeEventListener("mouseup", upHandler)
    }
  }, [enableInteraction, freeRotationMode, handleDoubleClick])

  const handleSelectNode = useCallback(
    (id: string | null) => {
      lastInteractionTime.current = 999999
      setSelectedNodeId(id)

      if (id) {
        const node = nodes.find((n) => n.id === id)
        if (node && onNodeClick) onNodeClick(node)

        const propagated = propagateNetwork(id, nodes, edges, 3)
        setPropagatedEdges(
          propagated.map((p) => ({ from: p.fromId, to: p.nodeId, delay: p.delay }))
        )
        setPropagationStartTime(performance.now() / 1000)
        setActivationTime(performance.now() / 1000)

        const allActivated = new Set<string>([id])
        propagated.forEach((p) => allActivated.add(p.nodeId))
        setActivatedNodeIds(allActivated)
      } else {
        setPropagatedEdges([])
        setActivatedNodeIds(new Set())
      }
    },
    [nodes, edges, onNodeClick]
  )

  const handleHoverNode = useCallback(
    (id: string | null) => {
      setHoveredNodeId(id)
      if (id) {
        const node = nodes.find((n) => n.id === id)
        if (node && onNodeHover) onNodeHover(node)
      } else if (selectedNodeId) {
        const node = nodes.find((n) => n.id === selectedNodeId)
        if (node && onNodeLeave) onNodeLeave(node)
      }
    },
    [nodes, selectedNodeId, onNodeHover, onNodeLeave]
  )

  return (
    <>
      <MouseTracker mouseNDC={mouseNDC} />

      {showParticles && (
        <>
          <GlobeStarfield count={2000} />
          <OrbitRings />
        </>
      )}

      <CursorFollowingGroup
        mouseNDC={mouseNDC}
        freeRotationMode={freeRotationMode}
        isDragging={isDragging}
        dragDelta={dragDelta}
        idleSeconds={idleSeconds}
      >
        <GlobeEarth />
        <GlobeContinentDots />
        <GlobeEvolutionNodes
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          hoveredNodeId={hoveredNodeId}
          onHoverNode={handleHoverNode}
          activatedNodeIds={activatedNodeIds}
          activationTime={activationTime}
        />
        {showConnections && (
          <GlobeConnections
            nodes={nodes}
            edges={edges}
            highlightNodeId={selectedNodeId}
            propagatedEdges={propagatedEdges}
            propagationStartTime={propagationStartTime}
          />
        )}
      </CursorFollowingGroup>
    </>
  )
}

export interface NeuralGlobeInternalProps extends NeuralGlobeSceneProps {}

export function NeuralGlobeInternal(props: NeuralGlobeInternalProps) {
  return <Scene {...props} />
}
