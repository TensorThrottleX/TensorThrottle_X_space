"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { GLOBE_RADIUS } from "@/lib/globe-utils"

const earthVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-worldPos.xyz);
    gl_Position = projectionMatrix * worldPos;
  }
`

const earthFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
    fresnel = pow(fresnel, 3.0);

    vec3 baseColor = vec3(0.02, 0.02, 0.02);
    vec3 rimColor = vec3(0.15, 0.15, 0.18);
    float rimIntensity = fresnel * 0.6;

    vec3 finalColor = baseColor + rimColor * rimIntensity;

    float depth = 1.0 - pow(max(dot(vNormal, vViewDir), 0.0), 1.5);
    finalColor += vec3(0.03, 0.03, 0.04) * depth;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

export function Earth() {
  return (
    <mesh renderOrder={0}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        vertexShader={earthVertexShader}
        fragmentShader={earthFragmentShader}
      />
    </mesh>
  )
}

const atmosphereVertexShader = `
  varying float vIntensity;
  varying float vFresnel;
  void main() {
    vec3 vNormal = normalize(normalMatrix * normal);
    vec3 vView = normalize(vec3(modelViewMatrix * vec4(position, 1.0)));
    vIntensity = pow(0.65 - dot(vNormal, vView), 2.5);
    vFresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 2.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const atmosphereFragmentShader = `
  varying float vIntensity;
  varying float vFresnel;
  uniform float uTime;

  void main() {
    float i = clamp(vIntensity, 0.0, 1.0);
    float pulse = 1.0 + sin(uTime * 0.3) * 0.08;
    float glow = i * 0.18 * pulse;

    float edgeGlow = vFresnel * 0.06;
    float alpha = glow + edgeGlow;

    vec3 color = vec3(0.6, 0.65, 0.8) * alpha;

    gl_FragColor = vec4(color, alpha);
  }
`

export function Atmosphere() {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime()
    }
  })

  return (
    <group>
      <mesh scale={1.15} renderOrder={1}>
        <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={{
            uTime: { value: 0 },
          }}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.08} renderOrder={1}>
        <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
        <shaderMaterial
          vertexShader={`
            varying float vIntensity;
            void main() {
              vec3 vNormal = normalize(normalMatrix * normal);
              vec3 vView = normalize(vec3(modelViewMatrix * vec4(position, 1.0)));
              vIntensity = pow(0.7 - dot(vNormal, vView), 4.0);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying float vIntensity;
            void main() {
              float i = clamp(vIntensity, 0.0, 1.0);
              gl_FragColor = vec4(vec3(0.7, 0.75, 0.9), i * 0.06);
            }
          `}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
