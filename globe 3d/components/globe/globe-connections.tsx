"use client"

import { useRef, useMemo, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Line } from "@react-three/drei"
import * as THREE from "three"
import {
  latLonToVector3,
  GLOBE_RADIUS,
  type EvolutionNode,
  type GlobeEdge,
} from "@/lib/globe-utils"

interface AnimatedArcProps {
  from: THREE.Vector3
  to: THREE.Vector3
  highlighted: boolean
  activated: boolean
  activationDelay: number
  activationStartTime: number
}

function AnimatedArc({
  from,
  to,
  highlighted,
  activated,
  activationDelay,
  activationStartTime,
}: AnimatedArcProps) {
  const packetRef = useRef<THREE.Mesh>(null)
  const [visible, setVisible] = useState(false)
  const [opacity, setOpacity] = useState(0)
  const startTimeRef = useRef(0)

  const { curve, points } = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5)
    const dist = from.distanceTo(to)
    mid.normalize().multiplyScalar(GLOBE_RADIUS + dist * 0.32)
    const c = new THREE.QuadraticBezierCurve3(from, mid, to)
    return { curve: c, points: c.getPoints(48) }
  }, [from, to])

  useFrame(({ clock }, delta) => {
    const now = clock.getElapsedTime()

    if (activated && !visible) {
      const elapsed = now - activationStartTime
      if (elapsed >= activationDelay) {
        setVisible(true)
        startTimeRef.current = now
      }
    }

    if (visible) {
      const age = now - startTimeRef.current
      const fadeIn = Math.min(age / 0.5, 1)
      const fadeOut = age > 3.0 ? Math.max(0, 1 - (age - 3.0) / 1.5) : 1
      const targetOpacity = (highlighted ? 0.45 : 0.2) * fadeIn * fadeOut
      setOpacity((prev) => prev + (targetOpacity - prev) * 0.08)
    }

    if (packetRef.current && visible) {
      const age = now - startTimeRef.current
      const speed = 0.12
      const t = (age * speed) % 1.0
      const pt = curve.getPointAt(t)
      packetRef.current.position.copy(pt)
      const packetOpacity = Math.sin(t * Math.PI) * 0.8 * Math.min(age / 0.3, 1)
      const mat = packetRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = packetOpacity
    }
  })

  const lineColor = highlighted ? "#ffffff" : "#aaaacc"

  return (
    <group>
      {opacity > 0.005 && (
        <Line
          points={points}
          color={lineColor}
          lineWidth={highlighted ? 1.5 : 0.8}
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      )}
      <mesh ref={packetRef} renderOrder={12}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

interface GlobeConnectionsProps {
  nodes: EvolutionNode[]
  edges: GlobeEdge[]
  highlightNodeId?: string | null
  propagatedEdges?: { from: string; to: string; delay: number }[]
  propagationStartTime?: number
}

export function GlobeConnections({
  nodes,
  edges,
  highlightNodeId,
  propagatedEdges = [],
  propagationStartTime = 0,
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
      from: string
      to: string
      fromPos: THREE.Vector3
      toPos: THREE.Vector3
      highlighted: boolean
      activated: boolean
      delay: number
    }[] = []

    for (const edge of edges) {
      const fromPos = nodeMap.get(edge.from)
      const toPos = nodeMap.get(edge.to)
      if (!fromPos || !toPos) continue

      const key = [edge.from, edge.to].sort().join("-")
      edgeSet.add(key)

      const hl = highlightNodeId
        ? edge.from === highlightNodeId || edge.to === highlightNodeId
        : false

      const propEdge = propagatedEdges.find(
        (pe) =>
          (pe.from === edge.from && pe.to === edge.to) ||
          (pe.from === edge.to && pe.to === edge.from)
      )

      result.push({
        from: edge.from,
        to: edge.to,
        fromPos,
        toPos,
        highlighted: hl,
        activated: hl || !!propEdge,
        delay: propEdge?.delay ?? 0,
      })
    }

    for (const pe of propagatedEdges) {
      const key = [pe.from, pe.to].sort().join("-")
      if (edgeSet.has(key)) continue
      const fromPos = nodeMap.get(pe.from)
      const toPos = nodeMap.get(pe.to)
      if (!fromPos || !toPos) continue
      edgeSet.add(key)
      result.push({
        from: pe.from,
        to: pe.to,
        fromPos,
        toPos,
        highlighted: false,
        activated: true,
        delay: pe.delay,
      })
    }

    return result
  }, [nodes, edges, highlightNodeId, propagatedEdges, nodeMap])

  return (
    <group>
      {allEdges.map((edge, i) => (
        <AnimatedArc
          key={`${edge.from}-${edge.to}-${i}`}
          from={edge.fromPos}
          to={edge.toPos}
          highlighted={edge.highlighted}
          activated={edge.activated}
          activationDelay={edge.delay}
          activationStartTime={propagationStartTime}
        />
      ))}
    </group>
  )
}
