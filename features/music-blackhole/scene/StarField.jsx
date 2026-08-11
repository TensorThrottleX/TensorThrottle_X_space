import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { hash01 } from "../data/musicData";

// ═══════════════════════════════════════════════════════════════════════════
// STAR FIELD — GPU-instanced music celestial objects
// ═══════════════════════════════════════════════════════════════════════════
// Three visual types determined by hash of track id:
//   - Luminous points (majority): small twinkling stars
//   - Glowing spheres (meaningful songs): slightly larger, colored
//   - Small planets (favorites): solid core with directional shading
//
// All objects orbit the central singularity using Keplerian mechanics.
// Live positions are stored on each track as _livePos for picking/UI.

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aBrightness;
  attribute vec3 aColor;
  attribute float aType; // 0 = point, 1 = sphere, 2 = planet
  varying vec3 vColor;
  varying float vBrightness;
  varying float vDepth;
  varying float vType;
  uniform float uPixelRatio;

  void main() {
    vColor = aColor;
    vBrightness = aBrightness;
    vType = aType;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float dist = -mvPosition.z;

    // Perspective scaling — nearby objects larger, distant smaller
    gl_PointSize = aSize * uPixelRatio * (180.0 / max(dist, 1.0));
    gl_PointSize = clamp(gl_PointSize, 1.0, 56.0);

    vDepth = clamp(dist / 60.0, 0.0, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vBrightness;
  varying float vDepth;
  varying float vType;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;

    float alpha = 1.0;
    vec3 col = vColor;

    if (vType > 1.5) {
      // PLANET: solid core, directional light from accretion disk
      float core = smoothstep(0.95, 0.75, d);
      // Light comes from the center (accretion disk glow)
      float light = smoothstep(-0.5, 0.8, -uv.x + uv.y * 0.3) * 0.7 + 0.3;
      // Subtle atmospheric rim
      float rim = pow(smoothstep(0.5, 1.0, d), 2.0) * 0.4;
      col = vColor * light + vec3(rim * 0.15, rim * 0.1, rim * 0.06);
      alpha = core * vBrightness;
    } else if (vType > 0.5) {
      // GLOWING SPHERE: soft luminous body
      float core = smoothstep(0.5, 0.0, d);
      float glow = smoothstep(1.0, 0.1, d) * 0.4;
      float intensity = core + glow;
      float depthFade = 1.0 - vDepth * 0.4;
      alpha = clamp(intensity * vBrightness * depthFade, 0.0, 1.0);
      col = mix(vColor, vec3(1.0), core * 0.5);
    } else {
      // LUMINOUS POINT: sharp core + soft halo
      float core = smoothstep(0.18, 0.0, d);
      float mid = smoothstep(0.55, 0.05, d) * 0.35;
      float halo = smoothstep(1.0, 0.2, d) * 0.15;
      float intensity = core + mid + halo;
      float depthFade = 1.0 - vDepth * 0.5;
      alpha = clamp(intensity * vBrightness * depthFade, 0.0, 1.0);
      col = mix(vColor, vec3(1.0), core * 0.8);
    }

    gl_FragColor = vec4(col, alpha);
  }
`;

// ─── active-star halo (soft additive glow) ───────────────────────────

let haloTextureCache = null;
function getHaloTexture() {
  if (haloTextureCache) return haloTextureCache;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.15, "rgba(255,255,255,0.5)");
  g.addColorStop(0.4, "rgba(255,255,255,0.15)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  haloTextureCache = new THREE.CanvasTexture(canvas);
  return haloTextureCache;
}

function ActiveStarHalo({ track, reducedMotion }) {
  const spriteRef = useRef();
  const texture = useMemo(() => getHaloTexture(), []);

  useFrame((state) => {
    if (!spriteRef.current || !track) return;
    const pulse = reducedMotion ? 1 : 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.18;
    const pos = track._livePos || track.position;
    spriteRef.current.position.set(pos.x, pos.y, pos.z);
    spriteRef.current.scale.setScalar(2.0 * pulse);
  });

  if (!track) return null;
  return (
    <sprite ref={spriteRef} scale={2.0} renderOrder={2}>
      <spriteMaterial
        map={texture}
        color={track.clusterColor || "#ffffff"}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.65}
      />
    </sprite>
  );
}

// ─── constellation connections ───────────────────────────────────────

function ConnectionLines({ tracks, focusId }) {
  const linesRef = useRef();

  const geometry = useMemo(() => {
    if (!focusId) return null;
    const focus = tracks.find((t) => t.id === focusId);
    if (!focus?.connections?.length) return null;
    const positions = new Float32Array(focus.connections.length * 6);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, focus.connections.length * 2);
    return geo;
  }, [tracks, focusId]);

  useFrame(() => {
    if (!linesRef.current || !geometry || !focusId) return;
    const focus = tracks.find((t) => t.id === focusId);
    if (!focus?.connections?.length) return;
    const posAttr = geometry.attributes.position;
    let offset = 0;
    const fp = focus._livePos || focus.position;
    for (const id of focus.connections) {
      const other = tracks.find((t) => t.id === id);
      if (!other) continue;
      const op = other._livePos || other.position;
      posAttr.array[offset++] = fp.x;
      posAttr.array[offset++] = fp.y;
      posAttr.array[offset++] = fp.z;
      posAttr.array[offset++] = op.x;
      posAttr.array[offset++] = op.y;
      posAttr.array[offset++] = op.z;
    }
    posAttr.needsUpdate = true;
  });

  useEffect(() => () => geometry?.dispose(), [geometry]);

  if (!geometry) return null;
  return (
    <lineSegments ref={linesRef} geometry={geometry} frustumCulled={false} renderOrder={1}>
      <lineBasicMaterial color="#c9b6ff" transparent opacity={0.22} depthWrite={false} />
    </lineSegments>
  );
}

// ─── screen-space picking ──────────────────────────────────────────────

function useStarPicking({ tracks, onHover, onSelect, onActivate }) {
  const { camera, gl, size } = useThree();
  const isDraggingRef = useRef(false);
  const downRef = useRef(null);
  const lastClickRef = useRef({ id: null, time: 0 });
  const vec = useMemo(() => new THREE.Vector3(), []);

  const project = useCallback(
    (track) => {
      const pos = track._livePos || track.position;
      vec.set(pos.x, pos.y, pos.z);
      vec.project(camera);
      if (vec.z > 1 || vec.z < -1) return null;
      return {
        x: (vec.x * 0.5 + 0.5) * size.width,
        y: (-vec.y * 0.5 + 0.5) * size.height,
        depth: vec.z,
      };
    },
    [camera, size, vec]
  );

  const hitTest = useCallback(
    (clientX, clientY) => {
      const rect = gl.domElement.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      let best = null;
      let bestDist = 26;
      for (const track of tracks) {
        const p = project(track);
        if (!p) continue;
        const nearness = THREE.MathUtils.clamp(1 - (p.depth + 1) / 2, 0.15, 1);
        const radius = 13 + nearness * 15;
        const d = Math.hypot(px - p.x, py - p.y);
        if (d < radius && d < bestDist) {
          best = track;
          bestDist = d;
        }
      }
      return best;
    },
    [tracks, project, gl]
  );

  useEffect(() => {
    const el = gl.domElement;
    const handlePointerDown = (e) => {
      downRef.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;
    };
    const handlePointerMove = (e) => {
      if (downRef.current) {
        const dx = e.clientX - downRef.current.x;
        const dy = e.clientY - downRef.current.y;
        if (Math.hypot(dx, dy) > 6) isDraggingRef.current = true;
      }
      if (isDraggingRef.current) { onHover(null); return; }
      onHover(hitTest(e.clientX, e.clientY));
    };
    const handlePointerUp = (e) => {
      const wasDrag = isDraggingRef.current;
      downRef.current = null;
      isDraggingRef.current = false;
      if (wasDrag) return;
      const hit = hitTest(e.clientX, e.clientY);
      if (!hit) { onSelect(null); return; }
      const now = performance.now();
      const last = lastClickRef.current;
      const isDouble = last.id === hit.id && now - last.time < 360;
      lastClickRef.current = { id: hit.id, time: now };
      if (isDouble) onActivate(hit);
      else onSelect(hit);
    };
    const handlePointerLeave = () => onHover(null);

    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerup", handlePointerUp);
    el.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerup", handlePointerUp);
      el.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [gl, hitTest, onHover, onSelect, onActivate]);
}

// ─── the star field ────────────────────────────────────────────────────

export default function StarField({
  tracks, hoveredId, selectedId, playingId, reducedMotion,
  onHover, onSelect, onActivate,
}) {
  const pointsRef = useRef();

  // Base positions from cluster layout
  const basePositions = useMemo(() => {
    const arr = new Float32Array(tracks.length * 3);
    tracks.forEach((t, i) => {
      arr[i * 3] = t.position.x;
      arr[i * 3 + 1] = t.position.y;
      arr[i * 3 + 2] = t.position.z;
    });
    return arr;
  }, [tracks]);

  const positions = useMemo(() => Float32Array.from(basePositions), [basePositions]);

  const colors = useMemo(() => {
    const arr = new Float32Array(tracks.length * 3);
    const tmp = new THREE.Color();
    tracks.forEach((t, i) => {
      tmp.set(t.clusterColor || "#ffffff");
      arr[i * 3] = tmp.r;
      arr[i * 3 + 1] = tmp.g;
      arr[i * 3 + 2] = tmp.b;
    });
    return arr;
  }, [tracks]);

  // Object type: 2=planet (all tracks are now planets/clusters)
  const types = useMemo(() => {
    const arr = new Float32Array(tracks.length);
    tracks.forEach((t, i) => {
      arr[i] = 2;
    });
    return arr;
  }, [tracks]);

  // Sizes vary by data importance (e.g. if memory is present, it's larger)
  const baseSizes = useMemo(() => {
    const arr = new Float32Array(tracks.length);
    tracks.forEach((t, i) => {
      const importance = t.memory ? 1.5 : 1.0;
      arr[i] = (15 + hash01(t.id, 99) * 10) * importance;
    });
    return arr;
  }, [tracks]);

  const liveSizes = useMemo(() => Float32Array.from(baseSizes), [baseSizes]);

  const brightness = useMemo(() => {
    const arr = new Float32Array(tracks.length);
    tracks.forEach((t, i) => {
      arr[i] = 0.4 + hash01(t.id, 77) * 0.3;
    });
    return arr;
  }, [tracks]);

  const uniforms = useRef({
    uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1 },
  });

  useEffect(() => {
    const attr = pointsRef.current?.geometry?.attributes?.position;
    if (attr) attr.setUsage(THREE.DynamicDrawUsage);
  }, []);

  // Keplerian orbits + twinkle — all GPU-buffer mutations, no React state
  useFrame((state) => {
    if (reducedMotion) return;
    const geo = pointsRef.current?.geometry;
    const posAttr = geo?.attributes?.position;
    const brAttr = geo?.attributes?.aBrightness;
    if (!posAttr) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < tracks.length; i++) {
      const bx = basePositions[i * 3];
      const by = basePositions[i * 3 + 1];
      const bz = basePositions[i * 3 + 2];

      // Keplerian orbit: angular speed ~ 1/r^1.5
      const radius = Math.sqrt(bx * bx + bz * bz);
      const initialAngle = Math.atan2(bz, bx);
      const angularSpeed = 10.0 / Math.pow(radius + 2.0, 1.5);
      const currentAngle = initialAngle + t * angularSpeed;

      // Organic wiggle
      const wigX = Math.sin(t * 0.04 + bx * 0.3) * 0.12;
      const wigY = Math.cos(t * 0.035 + by * 0.4) * 0.1;
      const wigZ = Math.sin(t * 0.03 + bz * 0.25) * 0.1;

      const nx = Math.cos(currentAngle) * radius + wigX;
      const nz = Math.sin(currentAngle) * radius + wigZ;
      const ny = by + wigY;

      posAttr.array[i * 3] = nx;
      posAttr.array[i * 3 + 1] = ny;
      posAttr.array[i * 3 + 2] = nz;

      tracks[i]._livePos = { x: nx, y: ny, z: nz };
    }
    posAttr.needsUpdate = true;

    // Subtle twinkle when nothing is focused
    if (brAttr && !selectedId && !hoveredId) {
      for (let i = 0; i < tracks.length; i++) {
        const base = 0.4 + hash01(tracks[i].id, 77) * 0.3;
        const twinkle = Math.sin(t * (1.2 + hash01(tracks[i].id, 33) * 1.8) + hash01(tracks[i].id, 44) * 6.28) * 0.06;
        brAttr.array[i] = base + twinkle;
      }
      brAttr.needsUpdate = true;
    }
  });

  // Hover / selection / playback → brightness + size mutations
  useEffect(() => {
    const geo = pointsRef.current?.geometry;
    const b = geo?.attributes?.aBrightness;
    const s = geo?.attributes?.aSize;
    if (!b || !s) return;

    const selectedTrack = selectedId ? tracks.find((t) => t.id === selectedId) : null;

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      let br = 0.4 + hash01(track.id, 77) * 0.3;
      let sizeMul = 1;

      if (selectedTrack) {
        if (track.id === selectedTrack.id) {
          // Selected: bright, larger — spec §21
          br = 1.5;
          sizeMul = 1.8;
        } else if (track.clusterKey === selectedTrack.clusterKey) {
          // Same cluster: slightly visible — spec §21
          br = 0.55;
          sizeMul = 1.05;
        } else {
          // Unrelated: dim significantly — spec §21
          br = 0.12;
          sizeMul = 0.7;
        }
      }
      if (track.id === hoveredId && track.id !== selectedId) {
        // Hovered: 10-25% larger, brighter — spec §18
        br = Math.max(br, 1.15);
        sizeMul = Math.max(sizeMul, 1.2);
      }
      if (track.id === playingId) {
        // Playing: energized — spec §22
        br = Math.max(br, 1.6);
        sizeMul = Math.max(sizeMul, 1.6);
      }

      b.array[i] = br;
      s.array[i] = baseSizes[i] * sizeMul;
    }
    b.needsUpdate = true;
    s.needsUpdate = true;
  }, [hoveredId, selectedId, playingId, tracks, baseSizes]);

  useStarPicking({ tracks, onHover, onSelect, onActivate });

  const playingTrack = useMemo(
    () => (playingId ? tracks.find((t) => t.id === playingId) || null : null),
    [tracks, playingId]
  );

  // Hovered track also gets a subtle halo — spec §18
  const hoveredTrack = useMemo(
    () => (hoveredId && hoveredId !== playingId ? tracks.find((t) => t.id === hoveredId) || null : null),
    [tracks, hoveredId, playingId]
  );

  if (!tracks.length) return null;

  return (
    <group>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[liveSizes, 1]} />
          <bufferAttribute attach="attributes-aBrightness" args={[brightness, 1]} />
          <bufferAttribute attach="attributes-aType" args={[types, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms.current}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <ActiveStarHalo track={playingTrack} reducedMotion={reducedMotion} />
      {hoveredTrack && <ActiveStarHalo track={hoveredTrack} reducedMotion={reducedMotion} />}
      <ConnectionLines tracks={tracks} focusId={selectedId || hoveredId} />
    </group>
  );
}
