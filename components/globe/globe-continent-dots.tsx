"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { GLOBE_RADIUS, latLonToVector3 } from "@/lib/globe-utils"
import { generateContinentDots } from "@/lib/continent-data"

const dotVertexShader = `
  attribute float aBrightness;
  attribute float aPhase;
  attribute float aCoastal;
  uniform float uTime;
  uniform float uStrength;
  varying float vBrightness;
  varying float vCoastal;
  varying float vEdgeFade;

  void main() {
    float breath = 1.0 + sin(uTime * 0.4 + aPhase) * 0.04;
    vec3 pos = position * breath;

    vec3 worldNormal = normalize(position);
    vec3 viewDir = normalize(cameraPosition - pos);
    vEdgeFade = pow(max(dot(worldNormal, viewDir), 0.0), 1.4);

    vBrightness = aBrightness * uStrength;
    vCoastal = aCoastal;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = 0.1 * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const dotFragmentShader = `
  varying float vBrightness;
  varying float vCoastal;
  varying float vEdgeFade;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.05, d);

    vec3 coastalColor = vec3(0.2, 0.88, 0.98);
    vec3 inlandColor = vec3(0.05, 0.3, 0.85);
    vec3 baseColor = mix(inlandColor, coastalColor, vCoastal);

    vec3 highlight = vec3(0.85, 0.92, 1.0);
    float hlMix = smoothstep(0.75, 0.95, vBrightness);
    vec3 finalColor = mix(baseColor, highlight, hlMix);

    float rim = pow(vEdgeFade, 2.5) * 0.35;
    finalColor += vec3(0.15, 0.4, 0.6) * rim;

    float bloom = exp(-d * d * 25.0) * 0.12 * vBrightness;
    vec3 bloomColor = vec3(0.1, 0.25, 0.45) * bloom;
    finalColor += bloomColor;

    float alpha = core * (0.55 + 0.45 * vBrightness) * (0.6 + 0.4 * vEdgeFade);

    gl_FragColor = vec4(finalColor, alpha);
  }
`

export function GlobeContinentDots({ strength = 1 }: { strength?: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const { positions, brightnesses, phases, coastals, count } = useMemo(() => {
    const dots = generateContinentDots(35000)
    const pos = new Float32Array(dots.length * 3)
    const bright = new Float32Array(dots.length)
    const ph = new Float32Array(dots.length)
    const coast = new Float32Array(dots.length)

    dots.forEach((dot, i) => {
      const v = latLonToVector3(dot.lat, dot.lon, GLOBE_RADIUS * 1.015) // Slightly increased to prevent Z-fighting
      pos[i * 3] = v.x
      pos[i * 3 + 1] = v.y
      pos[i * 3 + 2] = v.z
      bright[i] = dot.brightness
      ph[i] = Math.random() * Math.PI * 2
      coast[i] = dot.coastal ? 1.0 : 0.0
    })

    return { positions: pos, brightnesses: bright, phases: ph, coastals: coast, count: dots.length }
  }, [])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
      materialRef.current.uniforms.uStrength.value = strength
    }
  })

  return (
    <points renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aBrightness"
          args={[brightnesses, 1]}
          array={brightnesses}
          count={count}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          args={[phases, 1]}
          array={phases}
          count={count}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aCoastal"
          args={[coastals, 1]}
          array={coastals}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={dotVertexShader}
        fragmentShader={dotFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uStrength: { value: 1 },
        }}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
