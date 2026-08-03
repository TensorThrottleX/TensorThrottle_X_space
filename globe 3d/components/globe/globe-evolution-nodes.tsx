"use client"

import { useRef, useMemo, useState, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import { Html } from "@react-three/drei"
import * as THREE from "three"
import {
  latLonToVector3,
  GLOBE_RADIUS,
  type EvolutionNode,
} from "@/lib/globe-utils"
import { RippleRing } from "./globe-ripple"

const NODE_SIZE = 0.055

interface EvolutionNodesProps {
  nodes: EvolutionNode[]
  selectedNodeId: string | null
  onSelectNode: (id: string | null) => void
  hoveredNodeId: string | null
  onHoverNode: (id: string | null) => void
  activatedNodeIds: Set<string>
  activationTime: number
}

function EvolutionNodePoint({
  node,
  isSelected,
  isHovered,
  isActivated,
  onSelect,
  onHover,
  activationTime,
}: {
  node: EvolutionNode
  isSelected: boolean
  isHovered: boolean
  isActivated: boolean
  onSelect: (id: string | null) => void
  onHover: (id: string | null) => void
  activationTime: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const currentScale = useRef(1)
  const targetScale = useRef(1)

  const position = useMemo(
    () => latLonToVector3(node.lat, node.lon, GLOBE_RADIUS * 1.01),
    [node.lat, node.lon]
  )

  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.getElapsedTime()

    if (isSelected) {
      targetScale.current = 1.8 + Math.sin(t * 2 + phaseOffset) * 0.15
    } else if (isHovered) {
      targetScale.current = 1.5
    } else if (isActivated) {
      targetScale.current = 1.3 + Math.sin(t * 1.5 + phaseOffset) * 0.1
    } else {
      targetScale.current = 1.0 + Math.sin(t * 0.8 + phaseOffset) * 0.08
    }

    currentScale.current += (targetScale.current - currentScale.current) * 0.07
    meshRef.current.scale.setScalar(currentScale.current)

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      const targetOpacity = isSelected ? 0.8 : isHovered ? 0.6 : isActivated ? 0.35 : 0.15
      mat.opacity += (targetOpacity - mat.opacity) * 0.06
      const glowScale = isSelected ? 5.0 : isHovered ? 4.0 : isActivated ? 3.5 : 2.5
      glowRef.current.scale.setScalar(glowScale)
    }
  })

  const handlePointerOver = useCallback(() => {
    onHover(node.id)
    document.body.style.cursor = "pointer"
  }, [node.id, onHover])

  const handlePointerOut = useCallback(() => {
    onHover(null)
    document.body.style.cursor = "auto"
  }, [onHover])

  const handleClick = useCallback(() => {
    onSelect(isSelected ? null : node.id)
  }, [isSelected, node.id, onSelect])

  return (
    <group position={position}>
      <mesh ref={glowRef} renderOrder={9}>
        <sphereGeometry args={[NODE_SIZE, 12, 12]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        renderOrder={10}
      >
        <sphereGeometry args={[NODE_SIZE, 12, 12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {isSelected && (
        <RippleRing position={new THREE.Vector3(0, 0, 0)} startTime={activationTime} />
      )}

      {isHovered && !isSelected && (
        <Html
          distanceFactor={8}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
          zIndexRange={[50, 0]}
        >
          <div
            style={{
              background: "rgba(5, 5, 10, 0.92)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "10px",
              padding: "10px 16px",
              color: "#ffffff",
              fontSize: "11px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: "1.5",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: "12px" }}>{node.label}</div>
            <div style={{ color: "#555", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 2 }}>
              {node.era}
            </div>
          </div>
        </Html>
      )}

      {isSelected && (
        <Html
          distanceFactor={6}
          style={{ pointerEvents: "auto", whiteSpace: "nowrap" }}
          zIndexRange={[100, 0]}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(5, 5, 10, 0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px",
              padding: "18px 22px",
              color: "#ffffff",
              fontSize: "12px",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: "1.6",
              minWidth: "240px",
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: 4 }}>
              {node.label}
            </div>
            <div style={{ color: "#444", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              {node.era}
            </div>
            <div style={{ color: "#999", marginBottom: 10, fontSize: "11px" }}>
              {node.description}
            </div>
            <button
              onClick={() => onSelect(null)}
              style={{
                padding: "5px 14px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px",
                color: "#666",
                fontSize: "10px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Close
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}

export function GlobeEvolutionNodes({
  nodes,
  selectedNodeId,
  onSelectNode,
  hoveredNodeId,
  onHoverNode,
  activatedNodeIds,
  activationTime,
}: EvolutionNodesProps) {
  return (
    <group>
      {nodes.map((node) => (
        <EvolutionNodePoint
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          isHovered={hoveredNodeId === node.id}
          isActivated={activatedNodeIds.has(node.id)}
          onSelect={onSelectNode}
          onHover={onHoverNode}
          activationTime={activationTime}
        />
      ))}
    </group>
  )
}
