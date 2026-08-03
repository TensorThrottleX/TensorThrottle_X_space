"use client"

import { Suspense, useCallback } from "react"
import { Canvas } from "@react-three/fiber"
import { NeuralGlobeInternal, type NeuralGlobeInternalProps } from "./neural-globe-scene"
import {
  defaultEvolutionNodes,
  defaultEdges,
  type EvolutionNode,
  type GlobeEdge,
} from "@/lib/globe-utils"

export interface NeuralGlobeProps {
  width?: number | string
  height?: number | string
  autoRotate?: boolean
  rotationSpeed?: number
  enableInteraction?: boolean
  showParticles?: boolean
  showConnections?: boolean
  transparent?: boolean
  backgroundEnabled?: boolean
  bloomIntensity?: number
  nodeData?: EvolutionNode[]
  edgeData?: GlobeEdge[]
  className?: string
  theme?: "light" | "dark"
  cameraDistance?: number
  particleCount?: number
  starfieldIntensity?: number
  onNodeHover?: (node: EvolutionNode | null) => void
  onNodeClick?: (node: EvolutionNode) => void
  onNodeLeave?: (node: EvolutionNode) => void
  dotStrength?: number
}

export function NeuralGlobe({
  width = "100%",
  height = "100%",
  autoRotate = true,
  rotationSpeed = 0.04,
  enableInteraction = true,
  showParticles = true,
  showConnections = true,
  transparent = true,
  backgroundEnabled = false,
  bloomIntensity = 0.4,
  nodeData,
  edgeData,
  className = "",
  theme = "dark",
  cameraDistance = 5.5,
  particleCount = 2000,
  onNodeHover,
  onNodeClick,
  onNodeLeave,
  dotStrength = 1,
  starfieldIntensity,
}: NeuralGlobeProps) {
  const nodes = nodeData ?? defaultEvolutionNodes
  const edges = edgeData ?? defaultEdges

  const handlePointerMissed = useCallback(() => {
    if (onNodeLeave) {
      nodes.forEach((n) => onNodeLeave(n))
    }
  }, [nodes, onNodeLeave])

  return (
    <div
      className={className}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{
          position: [0, 1.2, cameraDistance],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: transparent,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
        dpr={[1, 1.5]}
        onPointerMissed={handlePointerMissed}
        style={{ background: transparent ? "transparent" : "#000000" }}
      >
        <ambientLight intensity={0.25} />
        <hemisphereLight
          args={["#ffffff", "#111122", 0.3]}
        />
        <directionalLight
          position={[5, 8, 5]}
          intensity={0.4}
        />
        <pointLight
          position={[-5, 3, -5]}
          intensity={0.15}
          color="#aabbff"
        />

        {!transparent && (
          <color attach="background" args={[backgroundEnabled ? "#000000" : "#000000"]} />
        )}

        <fog attach="fog" args={["#000000", 15, 40]} />

        <Suspense fallback={null}>
          <NeuralGlobeInternal
            nodes={nodes}
            edges={edges}
            autoRotate={autoRotate}
            rotationSpeed={rotationSpeed}
            enableInteraction={enableInteraction}
            showParticles={showParticles}
            showConnections={showConnections}
            bloomIntensity={bloomIntensity}
            starfieldIntensity={starfieldIntensity}
            onNodeHover={onNodeHover}
            onNodeClick={onNodeClick}
            onNodeLeave={onNodeLeave}
            dotStrength={dotStrength}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
