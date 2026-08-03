"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const starVertexShader = `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  varying float vAlpha;

  void main() {
    vAlpha = 0.3 + sin(uTime * 0.3 + aPhase) * 0.15;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d) * vAlpha * uOpacity;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`

export function GlobeStarfield({ count = 2000, intensity = 1 }: { count?: number; intensity?: number }) {
  const ref = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const targetIntensity = useRef(intensity)

  targetIntensity.current = intensity

  const { positions, sizes, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    const ph = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = 18 + Math.random() * 55
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      sz[i] = 0.015 + Math.random() * 0.045
      ph[i] = Math.random() * Math.PI * 2
    }
    return { positions: pos, sizes: sz, phases: ph }
  }, [count])

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y += 0.00015
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      const cur = materialRef.current.uniforms.uOpacity.value
      materialRef.current.uniforms.uOpacity.value = cur + (targetIntensity.current - cur) * 0.04
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function OrbitRings() {
  const groupRef = useRef<THREE.Group>(null)

  const rings = useMemo(() => {
    return [
      { radius: 2.8, tilt: 0.12, opacity: 0.035 },
      { radius: 3.3, tilt: -0.08, opacity: 0.025 },
      { radius: 2.5, tilt: 0.25, opacity: 0.02 },
    ]
  }, [])

  const ringLines = useMemo(() => {
    return rings.map((ring) => {
      const points: THREE.Vector3[] = []
      const segments = 128
      for (let j = 0; j <= segments; j++) {
        const angle = (j / segments) * Math.PI * 2
        points.push(
          new THREE.Vector3(
            Math.cos(angle) * ring.radius,
            Math.sin(angle) * ring.radius * Math.sin(ring.tilt),
            Math.sin(angle) * ring.radius
          )
        )
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const material = new THREE.LineBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: ring.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      return new THREE.Line(geometry, material)
    })
  }, [rings])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.002
    }
  })

  return (
    <group ref={groupRef}>
      {ringLines.map((line, i) => (
        <primitive key={`orbit-${i}`} object={line} />
      ))}
    </group>
  )
}
