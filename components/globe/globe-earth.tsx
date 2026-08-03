"use client"

import * as THREE from "three"
import { GLOBE_RADIUS } from "@/lib/globe-utils"

const earthVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`

const earthFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldPos;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  void main() {
    float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);

    float n = noise(vWorldPos * 8.0) * 0.3 + noise(vWorldPos * 16.0) * 0.15;

    vec3 baseColor = vec3(0.04, 0.04, 0.05) + n * vec3(0.02, 0.02, 0.025);
    vec3 rimColor = vec3(0.2, 0.22, 0.28);

    float rim = pow(fresnel, 3.5) * 0.7;
    float edge = pow(fresnel, 1.5) * 0.15;

    vec3 finalColor = baseColor + rimColor * rim + vec3(0.04, 0.04, 0.06) * edge;

    float metallic = pow(fresnel, 2.0) * 0.12;
    finalColor += vec3(metallic);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

interface GlobeEarthProps {
  onPointerEnter?: () => void
  onPointerLeave?: () => void
  onClick?: () => void
}

export function GlobeEarth({ onPointerEnter, onPointerLeave, onClick }: GlobeEarthProps) {
  return (
    <mesh
      renderOrder={0}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <shaderMaterial
        vertexShader={earthVertexShader}
        fragmentShader={earthFragmentShader}
      />
    </mesh>
  )
}
