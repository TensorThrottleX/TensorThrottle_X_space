import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════════════
// BLACK HOLE CORE — Continuous Swirling Vortex & Blue Plasma Jets
// ═══════════════════════════════════════════════════════════════════════════

// ─── Singularity: The deep black center ──────────────────────────────────

const singularityVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const singularityFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float rim = 1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    float edgeGlow = pow(rim, 5.0) * 0.05;
    vec3 color = vec3(0.0, 0.0, 0.0) + vec3(edgeGlow * 0.5, edgeGlow * 0.2, edgeGlow * 0.1);
    float alpha = 1.0 - pow(rim, 6.0) * 0.1;
    gl_FragColor = vec4(color, alpha);
  }
`;

function Singularity() {
  return (
    <mesh renderOrder={6}>
      <sphereGeometry args={[6.0, 64, 64]} />
      <shaderMaterial
        vertexShader={singularityVertex}
        fragmentShader={singularityFragment}
        depthWrite={true}
      />
    </mesh>
  );
}

// ─── Accretion Vortex (Continuous Overlapping Spiral Streams) ───────────

const accretionVertex = /* glsl */ `
  attribute float aAngle;
  attribute float aLifeOffset;
  attribute float aOrbitalSpeed;
  attribute float aSize;
  attribute float aLayer; // 0=outer dust, 1=middle streams, 2=inner hot matter
  
  uniform float uTime;
  varying float vDistNorm;
  varying float vLayer;
  varying float vLife;

  void main() {
    vLayer = aLayer;
    
    // Continuous inward radial velocity. Fract ensures continuous stream.
    float lifeSpeed = (aLayer == 2.0) ? 0.025 : (aLayer == 1.0) ? 0.012 : 0.006;
    float life = fract(aLifeOffset + uTime * lifeSpeed);
    vLife = life;

    float maxR = 90.0;
    float minR = 6.0; // Event horizon
    
    // Inward fall accelerates exponentially toward the center
    float r = mix(maxR, minR, pow(life, 2.2));
    vDistNorm = (r - minR) / (maxR - minR);

    // Tangential orbital velocity (Keplerian)
    float orbitalVelocity = 30.0 / pow(r, 1.25);
    float currentAngle = aAngle + uTime * aOrbitalSpeed * orbitalVelocity;

    // Overlapping spiral structure (Turbulence)
    // This physically deforms the circular orbit into fluid, irregular spiral arms
    float streamTurbulence = sin(r * 0.8 - currentAngle * 2.0 + uTime * 0.5) * 0.6 
                           + cos(r * 2.5 + currentAngle * 4.0 - uTime * 1.2) * 0.2;
    
    // Apply turbulence more strongly to outer/middle layers
    r += streamTurbulence * (r / 15.0); 

    // Gravitational Warp near the singularity
    float warpForce = smoothstep(18.0, 6.0, r);
    float warpDir = sin(currentAngle * 3.0 + uTime * 2.0) > 0.0 ? 1.0 : -1.0;
    
    // Vertical displacement (thickness of the disk)
    float yScatter = (fract(aAngle * 43.123 + aLifeOffset * 17.5) - 0.5) * 2.0;
    float thicknessFade = smoothstep(minR, 30.0, r); // Thicker on outside, razor thin at center
    float y = yScatter * thicknessFade * (aLayer == 0.0 ? 2.5 : 1.0) + (warpForce * warpDir * 1.8);

    vec3 pos = vec3(cos(currentAngle) * r, y, sin(currentAngle) * r);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mvPosition.z;
    
    gl_PointSize = aSize * (150.0 / max(dist, 1.0));
    gl_PointSize = clamp(gl_PointSize, 0.5, 14.0);

    gl_Position = projectionMatrix * mvPosition;
  }
`;

const accretionFragment = /* glsl */ `
  varying float vDistNorm;
  varying float vLayer;
  varying float vLife;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;

    float core = smoothstep(0.4, 0.0, d);
    float halo = smoothstep(1.0, 0.2, d) * 0.5;
    float intensity = core + halo;

    // Fade in at spawn, plunge into event horizon at death
    float lifeFade = smoothstep(0.0, 0.08, vLife) * smoothstep(1.0, 0.96, vLife);

    vec3 color;
    float alpha = intensity * lifeFade;

    if (vLayer > 1.5) {
      // Inner layer: extremely bright yellow/white/gold
      vec3 inner = vec3(1.0, 0.95, 0.85);
      vec3 mid = vec3(1.0, 0.7, 0.1);
      color = mix(inner, mid, smoothstep(0.0, 0.15, vDistNorm));
      alpha *= 0.95;
    } else if (vLayer > 0.5) {
      // Middle layer: dense amber/orange spiral streams
      vec3 inner = vec3(0.9, 0.4, 0.05);
      vec3 mid = vec3(0.6, 0.15, 0.02);
      color = mix(inner, mid, smoothstep(0.1, 0.5, vDistNorm));
      alpha *= 0.6;
    } else {
      // Outer layer: dark turbulent dust
      vec3 inner = vec3(0.3, 0.08, 0.01);
      vec3 mid = vec3(0.05, 0.02, 0.01);
      color = mix(inner, mid, smoothstep(0.3, 0.9, vDistNorm));
      alpha *= 0.15;
    }

    // Force extreme brightness exactly at the event horizon
    float singularityProximity = smoothstep(0.08, 0.0, vDistNorm);
    color = mix(color, vec3(1.0, 0.98, 0.9), singularityProximity);
    alpha = mix(alpha, intensity, singularityProximity);

    gl_FragColor = vec4(color, alpha);
  }
`;

function AccretionParticleField({ globalTimeRef }) {
  const count = 250000;
  const pointsRef = useRef();

  const attributes = useMemo(() => {
    const aAngle = new Float32Array(count);
    const aLifeOffset = new Float32Array(count);
    const aOrbitalSpeed = new Float32Array(count);
    const aSize = new Float32Array(count);
    const aLayer = new Float32Array(count);

    // Group particles into several broad spiral streams initially
    const numStreams = 9;

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let layer = 0;
      if (rand > 0.85) layer = 2; // 15% Inner hot matter
      else if (rand > 0.4) layer = 1; // 45% Middle dense streams
      
      aLayer[i] = layer;

      const streamIdx = Math.floor(Math.random() * numStreams);
      const streamBaseAngle = (streamIdx / numStreams) * Math.PI * 2;
      
      // Broad scatter to create fluid overlapping streams, not thin rings
      const angleScatter = (Math.random() - 0.5) * 3.5;
      aAngle[i] = streamBaseAngle + angleScatter;
      
      // Completely continuous unquantized life offset for smooth inward flow
      aLifeOffset[i] = Math.random();
      
      aOrbitalSpeed[i] = 0.8 + Math.random() * 0.4;
      
      aSize[i] = layer === 2 ? 1.0 + Math.random() * 2.5 : layer === 1 ? 1.5 + Math.random() * 3.5 : 2.5 + Math.random() * 5.0;
    }
    return { aAngle, aLifeOffset, aOrbitalSpeed, aSize, aLayer };
  }, []);

  const materialRef = useRef();
  useFrame(() => { 
    if (materialRef.current && globalTimeRef) {
      materialRef.current.uniforms.uTime.value = globalTimeRef.current;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false} renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(count * 3), 3]} />
        <bufferAttribute attach="attributes-aAngle" args={[attributes.aAngle, 1]} />
        <bufferAttribute attach="attributes-aLifeOffset" args={[attributes.aLifeOffset, 1]} />
        <bufferAttribute attach="attributes-aOrbitalSpeed" args={[attributes.aOrbitalSpeed, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[attributes.aSize, 1]} />
        <bufferAttribute attach="attributes-aLayer" args={[attributes.aLayer, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={accretionVertex}
        fragmentShader={accretionFragment}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Orbiting Planets (Background celestial bodies) ─────────────────────

const planetVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aRadius;
  attribute float aSpeed;
  attribute float aAngle;
  attribute float aInclination;
  attribute float aSize;

  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vColor;
  varying vec3 vWorldPos;

  void main() {
    vColor = aColor;
    
    float orbitalVelocity = 15.0 / pow(aRadius, 1.25);
    float currentAngle = aAngle + uTime * aSpeed * orbitalVelocity;
    
    vec3 pos = vec3(cos(currentAngle) * aRadius, 0.0, sin(currentAngle) * aRadius);
    
    float tilt = aInclination;
    float y = pos.z * sin(tilt);
    float z = pos.z * cos(tilt);
    pos.y = y;
    pos.z = z;

    vec3 finalPos = (position * aSize) + pos;
    vWorldPos = (modelMatrix * vec4(finalPos, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(cameraPosition - vWorldPos);
    gl_Position = projectionMatrix * viewMatrix * vec4(vWorldPos, 1.0);
  }
`;

const planetFragment = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vColor;
  varying vec3 vWorldPos;

  void main() {
    vec3 n = normalize(vNormal);
    vec3 v = normalize(vViewDir);
    vec3 lightDir = normalize(-vWorldPos);
    
    float diff = max(dot(n, lightDir), 0.0);
    float ambient = 0.03;
    float rim = smoothstep(0.65, 1.0, 1.0 - max(dot(n, v), 0.0));
    
    vec3 color = vColor * (diff * 1.8 + ambient);
    color += vColor * rim * 1.5;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const planetColors = [
  "#1a5b82", "#00d2ff", "#7e22ce", "#ef4444", 
  "#f97316", "#14b8a6", "#3f6212", "#4c1d95"
];

function OrbitingPlanets() {
  const count = 35;
  const meshRef = useRef();

  const attributes = useMemo(() => {
    const aColor = new Float32Array(count * 3);
    const aRadius = new Float32Array(count);
    const aSpeed = new Float32Array(count);
    const aAngle = new Float32Array(count);
    const aInclination = new Float32Array(count);
    const aSize = new Float32Array(count);
    const tmpColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      tmpColor.set(planetColors[Math.floor(Math.random() * planetColors.length)]);
      aColor[i * 3] = tmpColor.r; aColor[i * 3 + 1] = tmpColor.g; aColor[i * 3 + 2] = tmpColor.b;
      aRadius[i] = 12.0 + Math.random() * 85.0;
      aSpeed[i] = (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5);
      aAngle[i] = Math.random() * Math.PI * 2;
      aInclination[i] = (Math.random() - 0.5) * 0.6;
      aSize[i] = 0.5 + Math.random() * 1.5;
    }
    return { aColor, aRadius, aSpeed, aAngle, aInclination, aSize };
  }, []);

  const materialRef = useRef();
  useFrame((state) => { 
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null, null, count]} renderOrder={5}>
        <sphereGeometry args={[1, 32, 32]}>
          <instancedBufferAttribute attach="attributes-aColor" args={[attributes.aColor, 3]} />
          <instancedBufferAttribute attach="attributes-aRadius" args={[attributes.aRadius, 1]} />
          <instancedBufferAttribute attach="attributes-aSpeed" args={[attributes.aSpeed, 1]} />
          <instancedBufferAttribute attach="attributes-aAngle" args={[attributes.aAngle, 1]} />
          <instancedBufferAttribute attach="attributes-aInclination" args={[attributes.aInclination, 1]} />
          <instancedBufferAttribute attach="attributes-aSize" args={[attributes.aSize, 1]} />
        </sphereGeometry>
        <shaderMaterial 
          ref={materialRef}
          vertexShader={planetVertex} 
          fragmentShader={planetFragment} 
          uniforms={{ uTime: { value: 0 } }} 
        />
      </instancedMesh>
      
      {/* Subtle orbital trails/rings for the planets */}
      {Array.from({ length: count }).map((_, i) => (
        <mesh 
          key={i} 
          rotation-x={Math.PI / 2 + attributes.aInclination[i]} 
          renderOrder={1}
        >
          <ringGeometry args={[attributes.aRadius[i] - 0.05, attributes.aRadius[i] + 0.05, 64]} />
          <meshBasicMaterial 
            color={new THREE.Color(attributes.aColor[i * 3], attributes.aColor[i * 3 + 1], attributes.aColor[i * 3 + 2])} 
            transparent 
            opacity={0.03} 
            depthWrite={false} 
            side={THREE.DoubleSide} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Blue/Cyan Plasma Jet ────────────────────────────────────────────────

const jetVertex = /* glsl */ `
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aLayer;
  
  varying float vLife;
  varying float vDist;
  varying float vLayer;
  uniform float uTime;

  void main() {
    vLayer = aLayer;
    float life = fract(uTime * aSpeed + aOffset);
    vec3 pos = vec3(0.0);
    
    // Non-linear spread: tight core, wide outer envelope
    float spread = (aLayer == 0.0) ? pow(life, 1.2) * 1.5 : pow(life, 2.5) * 4.0;
    
    // Strong twisting undulation
    float twist = uTime * 2.5 + aOffset * 8.0;
    float twist2 = uTime * 1.2 - aOffset * 4.0;
    
    pos.x += sin(twist) * spread * 0.6 + cos(twist2) * spread * 0.4;
    pos.z += cos(twist * 1.1) * spread * 0.6 + sin(twist2 * 1.3) * spread * 0.4;
    
    float maxDist = (aLayer == 0.0) ? 60.0 : 45.0;
    float dist = life * maxDist * sign(position.y);
    pos.y = dist;

    vLife = life;
    vDist = abs(dist);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (150.0 / max(-mvPosition.z, 1.0));
    gl_PointSize = clamp(gl_PointSize, 0.5, (aLayer == 0.0) ? 8.0 : 30.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const jetFragment = /* glsl */ `
  varying float vLife;
  varying float vDist;
  varying float vLayer;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;

    float core = smoothstep(0.2, 0.0, d);
    float halo = smoothstep(1.0, 0.1, d) * 0.5;
    float intensity = core + halo;

    float distFade = 1.0 - smoothstep(0.0, 1.0, vDist / 60.0);
    float lifeFade = smoothstep(0.0, 0.05, vLife) * smoothstep(1.0, 0.6, vLife);

    float alpha = intensity * distFade * lifeFade;

    // Deep blue -> bright cyan -> white core
    vec3 white = vec3(0.9, 0.95, 1.0);
    vec3 cyan = vec3(0.1, 0.7, 1.0);
    vec3 deepBlue = vec3(0.02, 0.1, 0.6);
    vec3 purple = vec3(0.1, 0.02, 0.3);

    vec3 color;
    float distNorm = vDist / 60.0;
    
    if (distNorm < 0.1) color = mix(white, cyan, distNorm / 0.1);
    else if (distNorm < 0.4) color = mix(cyan, deepBlue, (distNorm - 0.1) / 0.3);
    else color = mix(deepBlue, purple, (distNorm - 0.4) / 0.6);

    if (vLayer == 0.0) { // Core layer burns bright white/cyan
      color = mix(color, white, core * 0.9);
      alpha *= 0.9;
    } else { // Outer volumetric plasma is softer blue
      alpha *= 0.3; 
    }

    gl_FragColor = vec4(color, alpha);
  }
`;

function EnergyJet({ direction, globalTimeRef }) {
  const pointsRef = useRef();
  const count = 2500;
  const sign = direction === "up" ? 1 : -1;

  const attributes = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const off = new Float32Array(count);
    const spd = new Float32Array(count);
    const sz = new Float32Array(count);
    const lyr = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0; pos[i * 3 + 1] = sign; pos[i * 3 + 2] = 0;
      off[i] = Math.random();
      
      const isCore = Math.random() > 0.6; // 40% core, 60% volumetric halo
      lyr[i] = isCore ? 0.0 : 1.0;
      
      spd[i] = (isCore ? 0.4 : 0.25) + Math.random() * 0.4;
      sz[i] = isCore ? 1.0 + Math.random() * 4.0 : 5.0 + Math.random() * 12.0;
    }
    return { positions: pos, offsets: off, speeds: spd, sizes: sz, layers: lyr };
  }, [sign]);

  const materialRef = useRef();
  useFrame(() => { 
    if (materialRef.current && globalTimeRef) {
      materialRef.current.uniforms.uTime.value = globalTimeRef.current;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false} renderOrder={4}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attributes.positions, 3]} />
        <bufferAttribute attach="attributes-aOffset" args={[attributes.offsets, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[attributes.speeds, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[attributes.sizes, 1]} />
        <bufferAttribute attach="attributes-aLayer" args={[attributes.layers, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={jetVertex}
        fragmentShader={jetFragment}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Background Stars (Dense, multi-layer depth) ────────────────────────

const bgStarVertex = /* glsl */ `
  attribute float aBrightness;
  attribute float aStarSize;
  attribute float aPhase;
  attribute vec3 aColor;
  
  uniform float uTime;
  varying float vBrightness;
  varying vec3 vColor;

  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = -mvPosition.z;
    
    gl_PointSize = aStarSize * (200.0 / max(dist, 1.0));
    gl_PointSize = clamp(gl_PointSize, 0.1, 3.5);

    float twinkle = 1.0 + sin(uTime * (0.3 + aPhase * 1.0) + aPhase * 6.28) * 0.15;
    vBrightness = aBrightness * twinkle;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const bgStarFragment = /* glsl */ `
  varying float vBrightness;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;
    float core = smoothstep(0.2, 0.0, d);
    float glow = smoothstep(1.0, 0.2, d) * 0.15;
    float alpha = (core + glow) * vBrightness;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function BackgroundStars() {
  const count = 8000;
  
  const attributes = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const br = new Float32Array(count);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 150 + Math.random() * 450;

      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      pos[i * 3 + 2] = Math.cos(phi) * r;

      const h = Math.random();
      if (h > 0.99) { br[i] = 0.6 + Math.random() * 0.4; sz[i] = 1.5 + Math.random() * 1.5; } 
      else if (h > 0.9) { br[i] = 0.2 + Math.random() * 0.2; sz[i] = 0.8 + Math.random() * 0.5; } 
      else { br[i] = 0.05 + Math.random() * 0.1; sz[i] = 0.2 + Math.random() * 0.4; }
      
      ph[i] = Math.random();
      
      const cType = Math.random();
      if (cType > 0.9) { col[i*3]=0.7; col[i*3+1]=0.85; col[i*3+2]=1.0; } 
      else if (cType > 0.7) { col[i*3]=1.0; col[i*3+1]=0.9; col[i*3+2]=0.8; } 
      else { col[i*3]=0.9; col[i*3+1]=0.9; col[i*3+2]=0.9; }
    }
    return { pos, br, sz, ph, col };
  }, []);

  const materialRef = useRef();
  useFrame((state) => { 
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points frustumCulled={false} renderOrder={-20}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attributes.pos, 3]} />
        <bufferAttribute attach="attributes-aBrightness" args={[attributes.br, 1]} />
        <bufferAttribute attach="attributes-aStarSize" args={[attributes.sz, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[attributes.ph, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[attributes.col, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={bgStarVertex}
        fragmentShader={bgStarFragment}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Gravitational Glow ──────────────────────────────────────────────────

function GravitationalGlow() {
  return (
    <>
      <pointLight position={[0, 0.5, 0]} intensity={1.5} color="#ffad5c" distance={45} decay={2.5} />
      <pointLight position={[0, -0.5, 0]} intensity={1.5} color="#ffad5c" distance={45} decay={2.5} />
      <pointLight position={[0, 2, 0]} intensity={0.4} color="#33aaff" distance={80} decay={2} />
      <pointLight position={[0, -2, 0]} intensity={0.4} color="#33aaff" distance={80} decay={2} />
      <ambientLight intensity={0.01} color="#050508" />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default function BlackHoleCore({ reducedMotion, interactionActive }) {
  const globalTimeRef = useRef(0);
  const timeScaleRef = useRef(1);
  const targetTimeScaleRef = useRef(1);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (interactionActive) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      targetTimeScaleRef.current = 0;
      timeScaleRef.current = 0; // immediate snap
    } else {
      debounceRef.current = setTimeout(() => {
        targetTimeScaleRef.current = 1;
      }, 200);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [interactionActive]);

  useFrame((state, delta) => {
    if (timeScaleRef.current !== targetTimeScaleRef.current) {
      timeScaleRef.current = THREE.MathUtils.lerp(timeScaleRef.current, targetTimeScaleRef.current, delta * 2.5);
      if (Math.abs(timeScaleRef.current - targetTimeScaleRef.current) < 0.01) {
        timeScaleRef.current = targetTimeScaleRef.current;
      }
    }
    globalTimeRef.current += delta * timeScaleRef.current;
  });

  if (reducedMotion) return null;

  return (
    <group rotation={[0.05, 0, 0]}>
      <Singularity />
      <AccretionParticleField globalTimeRef={globalTimeRef} />
      <EnergyJet direction="up" globalTimeRef={globalTimeRef} />
      <EnergyJet direction="down" globalTimeRef={globalTimeRef} />
      <GravitationalGlow />
    </group>
  );
}
