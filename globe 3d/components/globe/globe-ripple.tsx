"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface RippleRingProps {
  position: THREE.Vector3
  startTime: number
}

const ringVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ringFragmentShader = `
  uniform float uTime;
  uniform float uStartTime;
  varying vec2 vUv;

  void main() {
    float elapsed = uTime - uStartTime;
    if (elapsed < 0.0 || elapsed > 2.5) {
      gl_FragColor = vec4(0.0);
      return;
    }
    float progress = clamp(elapsed * 0.45, 0.0, 1.0);

    vec2 center = vUv - vec2(0.5);
    float dist = length(center) * 2.0;

    float ring = smoothstep(progress - 0.05, progress, dist) *
                 smoothstep(progress + 0.05, progress, dist);

    float glow = exp(-pow(dist - progress, 2.0) * 50.0);

    float fade = (1.0 - progress) * smoothstep(0.0, 0.2, elapsed) * smoothstep(2.5, 1.5, elapsed);

    float alpha = (ring * 0.9 + glow * 0.5) * fade;

    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`

export function RippleRing({ position, startTime }: RippleRingProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const normal = useMemo(() => position.clone().normalize(), [position])
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
    return q
  }, [normal])

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <mesh position={position} quaternion={quaternion} renderOrder={15}>
      <planeGeometry args={[0.7, 0.7]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ringVertexShader}
        fragmentShader={ringFragmentShader}
        uniforms={{
          uTime: { value: 0 },
          uStartTime: { value: startTime },
        }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
