"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { GLOBE_RADIUS, latLonToVector3 } from "@/lib/globe-utils"
import { generateContinentDots } from "@/lib/continent-data"

const dotVertexShader = `
  attribute float aBrightness;
  attribute float aPhase;
  uniform float uTime;
  varying float vBrightness;
  varying float vEdgeFade;

  void main() {
    vBrightness = aBrightness;

    float breath = 1.0 + sin(uTime * 0.4 + aPhase) * 0.04;
    vec3 pos = position * breath;

    vec3 worldNormal = normalize(position);
    vec3 viewDir = normalize(cameraPosition - pos);
    vEdgeFade = pow(max(dot(worldNormal, viewDir), 0.0), 1.2);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 0.04 * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const dotFragmentShader = `
  varying float vBrightness;
  varying float vEdgeFade;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.1, d);
    float edge = smoothstep(0.5, 0.3, d);
    float alpha = core * vBrightness * vEdgeFade * 0.92;

    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`

export function GlobeContinentDots() {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const { positions, brightnesses, phases, count } = useMemo(() => {
    const dots = generateContinentDots(5500)
    const pos = new Float32Array(dots.length * 3)
    const bright = new Float32Array(dots.length)
    const ph = new Float32Array(dots.length)

    dots.forEach((dot, i) => {
      const v = latLonToVector3(dot.lat, dot.lon, GLOBE_RADIUS * 1.005)
      pos[i * 3] = v.x
      pos[i * 3 + 1] = v.y
      pos[i * 3 + 2] = v.z
      bright[i] = dot.brightness
      ph[i] = Math.random() * Math.PI * 2
    })

    return { positions: pos, brightnesses: bright, phases: ph, count: dots.length }
  }, [])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <points renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aBrightness"
          args={[brightnesses, 1]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={dotVertexShader}
        fragmentShader={dotFragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
