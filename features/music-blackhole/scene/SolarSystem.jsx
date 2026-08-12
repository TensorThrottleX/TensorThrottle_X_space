import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════════════
// SOLAR SYSTEM PLANETS — 9 Unmissable Cinematic Planets
// ═══════════════════════════════════════════════════════════════════════════

function PlanetRing({ radius, color }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 1.5, radius * 2.2, 64]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.6} 
        side={THREE.DoubleSide} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function OrbitLine({ radius }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);
  
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line geometry={geometry} renderOrder={1}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
    </line>
  );
}

function CinematicPlanet({ 
  data, 
  hoveredId, 
  selectedId, 
  onHover, 
  onSelect,
  onDoubleClick,
  reducedMotion,
  cardFocus,
  orbitTimeRef,
  timeScaleRef
}) {
  const meshRef = useRef();
  const groupRef = useRef();
  const initialAngle = useMemo(() => Math.random() * Math.PI * 2, []);
  
  const isHovered = hoveredId === data.id;
  const isSelected = selectedId === data.id;
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  
  useFrame((state, delta) => {
    // CARD_FOCUS — full simulation freeze: no orbital phase, no self-rotation.
    if (reducedMotion || cardFocus) return;
    const currentDelta = delta * (timeScaleRef?.current ?? 1);
    
    // Self rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += currentDelta * 0.5;
    }
    
    // Orbital revolution
    if (groupRef.current) {
      const t = orbitTimeRef?.current ?? state.clock.elapsedTime;
      const angle = initialAngle + t * data.planet.orbitalSpeed;
      
      const x = Math.cos(angle) * data.planet.orbitalRadius;
      const z = Math.sin(angle) * data.planet.orbitalRadius;
      
      groupRef.current.position.set(x, 0, z);
      groupRef.current.getWorldPosition(worldPos);
      
      // Keep _livePos updated for SongCard picking and strings
      data._livePos = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
    }
  });
  
  // Cinematic appearance
  const materialProps = useMemo(() => {
    return {
      color: data.planet.color,
      emissive: data.planet.emissive,
      emissiveIntensity: isHovered || isSelected ? 0.8 : 0.2,
      roughness: 0.7,
      metalness: 0.1,
    };
  }, [data.planet, isHovered, isSelected]);

  return (
    <group rotation={[data.planet.inclination || 0, 0, (data.planet.inclination || 0) * 0.7]}>
      <OrbitLine radius={data.planet.orbitalRadius} />
      
      <group 
        ref={groupRef}
        {...(cardFocus ? {
          // CARD_FOCUS — raycasting disabled: no hover, no select, no double-click
          raycast: () => null,
        } : {
          onPointerOver: (e) => { e.stopPropagation(); onHover(data); document.body.style.cursor = 'pointer'; },
          onPointerOut: (e) => { onHover(null); document.body.style.cursor = 'auto'; },
          onPointerUp: (e) => { e.stopPropagation(); onSelect(data); },
          onDoubleClick: (e) => { e.stopPropagation(); if (onDoubleClick) onDoubleClick(data); },
        })}
      >
        <mesh ref={meshRef} renderOrder={10}>
          <sphereGeometry args={[data.planet.size, 64, 64]} />
          <meshStandardMaterial {...materialProps} />
        </mesh>
        
        {/* Saturn Rings */}
        {data.planet.hasRings && <PlanetRing radius={data.planet.size} color={data.planet.color} />}
        
        {/* Glow/Atmosphere on hover */}
        {(isHovered || isSelected) && (
          <mesh renderOrder={11}>
            <sphereGeometry args={[data.planet.size * 1.15, 32, 32]} />
            <meshBasicMaterial 
              color={data.planet.color} 
              transparent 
              opacity={0.3} 
              blending={THREE.AdditiveBlending} 
              depthWrite={false} 
            />
          </mesh>
        )}
      </group>
    </group>
  );
}

// ─── CENTRAL IDENTITY & MUSICAL STRINGS ──────────────────────────────────────

function MusicalStrings({ tracks, active, frozen }) {
  const lineRef = useRef();
  const matRef = useRef();

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(tracks.length * 2 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [tracks]);

  const frozenRef = useRef(frozen);
  useEffect(() => { frozenRef.current = frozen; }, [frozen]);

  useFrame((state, delta) => {
    if (!lineRef.current || !matRef.current) return;
    
    // CARD_FOCUS — freeze the string resonance at its current state.
    if (frozenRef.current) return;
    
    // Smooth opacity transition (300-700ms)
    const targetOpacity = active ? 0.35 : 0;
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOpacity, delta * 3);

    // Only update geometry if strings are somewhat visible
    if (matRef.current.opacity > 0.01) {
      const positions = lineRef.current.geometry.attributes.position.array;
      tracks.forEach((track, i) => {
        const offset = i * 6;
        // Center of black hole
        positions[offset] = 0;
        positions[offset + 1] = 0;
        positions[offset + 2] = 0;
        
        // Planet position
        if (track._livePos) {
          // Subtle vibration/resonance
          const t = state.clock.elapsedTime;
          const vibration = Math.sin(t * 8 + i) * 0.15;
          
          // Convert world _livePos back to local space for the line geometry
          const vec = new THREE.Vector3(track._livePos.x, track._livePos.y, track._livePos.z);
          lineRef.current.worldToLocal(vec);
          
          positions[offset + 3] = vec.x;
          positions[offset + 4] = vec.y + vibration;
          positions[offset + 5] = vec.z;
        }
      });
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry} renderOrder={5}>
      <lineBasicMaterial 
        ref={matRef}
        color="#88ccff" 
        transparent 
        opacity={0} 
        blending={THREE.AdditiveBlending}
        depthWrite={false} 
      />
    </lineSegments>
  );
}

function CentralIdentity({ tracks, frozen }) {
  const [active, setActive] = useState(false);
  const glowRef = useRef();
  const uiRef = useRef();
  const frozenRef = useRef(frozen);
  useEffect(() => { frozenRef.current = frozen; }, [frozen]);

  useFrame((state, delta) => {
    // CARD_FOCUS — freeze glow/idle animations at their exact current state.
    if (frozenRef.current) return;
    if (glowRef.current) {
      const targetOpacity = active ? 0.6 : 0;
      glowRef.current.opacity = THREE.MathUtils.lerp(glowRef.current.opacity, targetOpacity, delta * 3);
    }
    if (uiRef.current) {
      const targetOpacity = active ? 1 : 0;
      uiRef.current.style.opacity = THREE.MathUtils.lerp(parseFloat(uiRef.current.style.opacity || "0"), targetOpacity, delta * 4);
      uiRef.current.style.transform = `translate(30px, -40px) translateY(${active ? 0 : 10}px)`;
    }
  });

  return (
    <group>
      {/* Invisible interaction zone in the center (radius 7.0, matches new black hole size 6.0) */}
      <mesh 
        visible={false} 
        args={[new THREE.SphereGeometry(7.0, 16, 16)]} 
        onPointerOver={frozen ? undefined : (e) => { e.stopPropagation(); setActive(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={frozen ? undefined : () => { setActive(false); document.body.style.cursor = 'auto'; }}
      />

      {/* Central Glow (subtly brightens on hover) */}
      <mesh renderOrder={4}>
        <sphereGeometry args={[8.0, 32, 32]} />
        <meshBasicMaterial 
          ref={glowRef}
          color="#33aaff"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Musical Strings connecting to Life Moments */}
      <MusicalStrings tracks={tracks} active={active} frozen={frozen} />

      {/* Central Card using SongCard visual language */}
      <Html center zIndexRange={[60, 0]} style={{ pointerEvents: "none" }}>
        <div
          ref={uiRef}
          style={{
            opacity: 0,
            pointerEvents: active ? "auto" : "none",
            width: 240,
            background: "rgba(3,3,5,0.88)",
            border: "1px solid rgba(80,75,65,0.2)",
            borderLeft: `2px solid #33aaff88`,
            borderRadius: 6,
            padding: "16px 20px",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.02)",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            userSelect: "none",
            cursor: "default",
            transition: "transform 0s" // Handled by useFrame for smoothness
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(140,130,110,0.45)",
              marginBottom: 12,
            }}
          >
            ME / MY LIFE
          </div>
          
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "#e0dcd4",
              lineHeight: 1.4,
              marginBottom: 8,
            }}
          >
            It's my life
          </div>
          
          <div
            style={{
              fontSize: 12,
              color: "rgba(180,170,150,0.8)",
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            represented through<br />
            musical strings<br />
            echoing through<br />
            the universe.
          </div>
        </div>
      </Html>
    </group>
  );
}

export default function SolarSystem({ 
  tracks, 
  hoveredId, 
  selectedId, 
  onHover, 
  onSelect,
  onDoubleClick,
  reducedMotion,
  interactionActive,
  cardFocus
}) {
  const { camera } = useThree();
  
  const orbitTimeRef = useRef(0);
  const timeScaleRef = useRef(1);
  const targetTimeScaleRef = useRef(1);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (interactionActive) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      targetTimeScaleRef.current = 0;
      timeScaleRef.current = 0; // Snap to 0 immediately to prevent any drift
    } else {
      debounceRef.current = setTimeout(() => {
        targetTimeScaleRef.current = 1;
      }, 200); // 200ms debounce before easing back
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [interactionActive]);

  useFrame((state, delta) => {
    if (timeScaleRef.current !== targetTimeScaleRef.current) {
      // Ease back to normal over ~600-800ms
      timeScaleRef.current = THREE.MathUtils.lerp(timeScaleRef.current, targetTimeScaleRef.current, delta * 2.5);
      if (Math.abs(timeScaleRef.current - targetTimeScaleRef.current) < 0.01) {
        timeScaleRef.current = targetTimeScaleRef.current;
      }
    }
    orbitTimeRef.current += delta * timeScaleRef.current;
  });

  useEffect(() => {
    if (!tracks || tracks.length === 0) return;
  }, [tracks]);

  if (!tracks || tracks.length === 0) return null;

  return (
    <group>
      <directionalLight position={[10, 5, 10]} intensity={2.0} color="#ffffff" />
      <directionalLight position={[-10, -5, -10]} intensity={0.5} color="#445566" />
      
      {tracks.map((track) => (
        <CinematicPlanet 
          key={track.id} 
          data={track} 
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={onHover}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
          reducedMotion={reducedMotion}
          cardFocus={cardFocus}
          orbitTimeRef={orbitTimeRef}
          timeScaleRef={timeScaleRef}
        />
      ))}

      <CentralIdentity tracks={tracks} frozen={cardFocus} />
    </group>
  );
}
