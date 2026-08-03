"use client"

import { useRef, useMemo, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import {
  latLonToVector3,
  GLOBE_RADIUS,
  type EvolutionNode,
  type GlobeEdge,
} from "@/lib/globe-utils"

/* ───── Tuning ───── */

const DRAW_DURATION = 0.4
const PACKET_DURATION = 0.5
const HOLD_DURATION = 1.5
const FADE_DURATION = 0.8

/* ───── Animated Arc ───── */

interface AnimatedArcProps {
  from: THREE.Vector3
  to: THREE.Vector3
  highlighted: boolean
  activationDelay: number
  activationStartTime: number
  activated: boolean
  onActivated?: () => void
}

function AnimatedArc({
  from,
  to,
  highlighted,
  activationDelay,
  activationStartTime,
  activated,
  onActivated,
}: AnimatedArcProps) {
  const packetRef = useRef<THREE.Mesh>(null)
  const lineRef = useRef<THREE.Line>(null)
  const lineColor = highlighted ? "#ffffff" : "#aaaacc"

  const [phase, setPhase] = useState<
    "idle" | "drawing" | "travelling" | "holding" | "fading" | "dead"
  >("idle")
  const phaseStartRef = useRef(0)
  const drawProgress = useRef(0)

  const { curve, numPoints } = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5)
    const dist = from.distanceTo(to)
    mid.normalize().multiplyScalar(GLOBE_RADIUS + dist * 0.32)
    const c = new THREE.QuadraticBezierCurve3(from, mid, to)
    return { curve: c, numPoints: 48 }
  }, [from, to])

  const line = useMemo(() => {
    const pts = curve.getPoints(numPoints)
    const positions = new Float32Array(pts.length * 3)
    pts.forEach((p, i) => {
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geo.setDrawRange(0, 2)

    const mat = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    return new THREE.Line(geo, mat)
  }, [curve, numPoints, lineColor])

  useFrame(({ clock }, delta) => {
    const now = clock.getElapsedTime()
    const dt = Math.min(delta, 0.05)

    if (activated && phase === "idle") {
      const elapsed = now - activationStartTime
      if (elapsed >= activationDelay) {
        setPhase("drawing")
        phaseStartRef.current = now
        drawProgress.current = 0
      }
      return
    }

    if (phase === "idle" || phase === "dead") return

    const age = now - phaseStartRef.current
    const geo = line.geometry
    const mat = line.material as THREE.LineBasicMaterial

    switch (phase) {
      case "drawing": {
        drawProgress.current = Math.min(age / DRAW_DURATION, 1)
        const count = Math.max(
          2,
          Math.floor(drawProgress.current * (numPoints - 1)) + 1
        )
        geo.setDrawRange(0, count)
        mat.opacity = Math.min(age / 0.08, 1) * (highlighted ? 0.5 : 0.25)
        if (drawProgress.current >= 1) {
          setPhase("travelling")
          phaseStartRef.current = now
          onActivated?.()
        }
        break
      }
      case "travelling": {
        const speed = 1 / PACKET_DURATION
        const t = (age * speed) % 1.0
        if (packetRef.current) {
          const pt = curve.getPointAt(t)
          packetRef.current.position.copy(pt)
          const pmat = packetRef.current.material as THREE.MeshBasicMaterial
          pmat.opacity = Math.sin(t * Math.PI) * 0.85 * Math.min(age / 0.15, 1)
        }
        if (age >= PACKET_DURATION) {
          setPhase("holding")
          phaseStartRef.current = now
        }
        break
      }
      case "holding": {
        if (packetRef.current) {
          const pmat = packetRef.current.material as THREE.MeshBasicMaterial
          pmat.opacity = Math.max(0, pmat.opacity - dt * 2)
        }
        if (age >= HOLD_DURATION) {
          setPhase("fading")
          phaseStartRef.current = now
        }
        break
      }
      case "fading": {
        const fade = 1 - Math.min(age / FADE_DURATION, 1)
        mat.opacity = fade * (highlighted ? 0.35 : 0.15)
        if (packetRef.current) {
          const pmat = packetRef.current.material as THREE.MeshBasicMaterial
          pmat.opacity = 0
        }
        if (fade <= 0) {
          geo.setDrawRange(0, 0)
          setPhase("dead")
        }
        break
      }
    }
  })

  if (phase === "dead") return null

  const showPacket = phase === "travelling" || phase === "holding"
  const showLine =
    phase === "drawing" || phase === "travelling" || phase === "holding" || phase === "fading"

  return (
    <group>
      {showLine && <primitive object={line} />}
      {showPacket && (
        <mesh ref={packetRef} renderOrder={12}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  )
}

/* ───── GlobeConnections ───── */

export interface PropagationEdge {
  from: string
  to: string
  delay: number
}

interface GlobeConnectionsProps {
  nodes: EvolutionNode[]
  edges: GlobeEdge[]
  highlightNodeId?: string | null
  propagatedEdges?: PropagationEdge[]
  propagationStartTime?: number
  hoverPropagatedEdges?: PropagationEdge[]
  hoverPropagationStartTime?: number
}

export function GlobeConnections({
  nodes,
  edges,
  highlightNodeId,
  propagatedEdges = [],
  propagationStartTime = 0,
  hoverPropagatedEdges = [],
  hoverPropagationStartTime = 0,
}: GlobeConnectionsProps) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, THREE.Vector3>()
    nodes.forEach((n) => {
      map.set(n.id, latLonToVector3(n.lat, n.lon, GLOBE_RADIUS * 1.01))
    })
    return map
  }, [nodes])

  const allEdges = useMemo(() => {
    const edgeSet = new Set<string>()
    const result: {
      key: string
      fromPos: THREE.Vector3
      toPos: THREE.Vector3
      highlighted: boolean
      activationDelay: number
      activationStartTime: number
    }[] = []

    const addEdge = (
      from: string,
      to: string,
      delay: number,
      startTime: number,
      hl: boolean
    ) => {
      const key = [from, to].sort().join("-")
      if (edgeSet.has(key)) return
      edgeSet.add(key)
      const fromPos = nodeMap.get(from)
      const toPos = nodeMap.get(to)
      if (!fromPos || !toPos) return
      result.push({
        key,
        fromPos,
        toPos,
        highlighted: hl,
        activationDelay: delay,
        activationStartTime: startTime,
      })
    }

    for (const edge of edges) {
      const hl = highlightNodeId
        ? edge.from === highlightNodeId || edge.to === highlightNodeId
        : false
      const propEdge = propagatedEdges.find(
        (pe) =>
          (pe.from === edge.from && pe.to === edge.to) ||
          (pe.from === edge.to && pe.to === edge.from)
      )
      if (propEdge) {
        addEdge(edge.from, edge.to, propEdge.delay, propagationStartTime, hl)
      } else if (hl) {
        addEdge(edge.from, edge.to, 0, 0, hl)
      }
    }

    for (const pe of propagatedEdges) {
      addEdge(pe.from, pe.to, pe.delay, propagationStartTime, false)
    }

    for (const pe of hoverPropagatedEdges) {
      addEdge(pe.from, pe.to, pe.delay, hoverPropagationStartTime, false)
    }

    return result
  }, [
    edges,
    nodes,
    highlightNodeId,
    propagatedEdges,
    propagationStartTime,
    hoverPropagatedEdges,
    hoverPropagationStartTime,
    nodeMap,
  ])

  return (
    <group>
      {allEdges.map((edge) => (
        <AnimatedArc
          key={edge.key}
          from={edge.fromPos}
          to={edge.toPos}
          highlighted={edge.highlighted}
          activated={true}
          activationDelay={edge.activationDelay}
          activationStartTime={edge.activationStartTime}
        />
      ))}
    </group>
  )
}
