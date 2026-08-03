# Session Summary — Neural Globe Experience Refinement

**Date**: July 25, 2026
**Objective**: Transform the 3D Neural Globe from a floating sphere into a living planetary intelligence layer with cinematic reveal, neural propagation, premium rotation, and real dotted continents.

---

## 1. Cinematic Globe Reveal (`GlobeSection.tsx`, `HomePageLayout.tsx`)

### What changed
- `GlobeSection` now accepts `onRevealProgress?: (progress: number) => void` callbac
- On first intersection, a 2s cubic-eased animation drives `entryProgress` 0→1
- `globeScale` maps: `1 + entryProgress * 0.22` (22% size increase)
- `glowIntensity`: from 0.06 → 0.14 cyan radial glow with tighter falloff
- `dotStrength`: `1 + entryProgress * 0.5` (50% brighter continent dots during reveal)
- `showConnections` only activates after section has entered

### HomePageLayout integration
- New `globeReveal` state (0→1) passed from `GlobeSection`
- Hero section gets `filter: blur(globeReveal * 4px)` and `opacity: 1 - globeReveal * 0.5`
- Cinematic overlay added at `z-[5]`: radial gradient from transparent to `rgba(0,0,0,0.9)` at opacity `globeReveal * 0.55`
- Dynamic import type for GlobeSection updated to include `onRevealProgress`

### Files touched
- `components/globe/GlobeSection.tsx` (full rewrite)
- `components/layout/HomePageLayout.tsx` (scroll reveal + blur/darkening)

---

## 2. Neural Network Propagation (`neural-globe-scene.tsx`, `globe-connections.tsx`, `globe-evolution-nodes.tsx`)

### Hover‑triggered propagation
- `handleHoverNode` in `Scene` now calls `computePropagation(id)` (BFS depth 6 via `propagateNetwork`)
- Separate state: `hoverPropagatedEdges`, `hoverPropagationStartTime`, `hoverActivatedIds`
- On unhover: 2s `setTimeout` before clearing propagation; `clearTimeout` on re‑hover
- Click propagation remains independent (`propagatedEdges`, `activatedNodeIds`)

### `computePropagation(sourceId)` utility
- Calls `propagateNetwork(id, nodes, edges, 6)` 
- Converts output to `PropagationEdge[]` with `{ from, to, delay }`
- Each edge gets `delay + index * 0.05` for sequential staggering

### Animated Arc drawing (`globe-connections.tsx`)
Complete rewrite:
- Uses `THREE.Line` with `BufferGeometry.setDrawRange()` for allocation‑free animated drawing
- Phase machine: `idle → drawing → travelling → holding → fading → dead`
- **Drawing** (0.4s): `setDrawRange` goes from 2 → numPoints, opacity ramps
- **Travelling** (0.5s): packet sphere animates along curve via `curve.getPointAt(t)`
- **Holding** (1.5s): packet fades, line stays visible
- **Fading** (0.8s): line opacity decays to 0, arc removed
- Deduplication: edges from click + hover merged by sorted key, duplicate prevention via `edgeSet`

### Node activation pulse (`globe-evolution-nodes.tsx`)
- New `pulseRef` mesh (2× node size, blue `#aaddff`, additive blending)
- `activationPulse` spring: triggers 1→0 on hover-activation, drives scale `1 + ps * 3` and opacity `ps * 0.5`
- Combined `activatedNodeIds + hoverActivatedIds` for glow state
- `isHoverActivated` separate prop for brighter glow on hover‑propagated nodes

### PropagationEdge type exported from `globe-connections.tsx`
```typescript
export interface PropagationEdge {
  from: string
  to: string
  delay: number
}
```

### Files touched
- `components/globe/neural-globe-scene.tsx` (hover propagation + raycast)
- `components/globe/globe-connections.tsx` (full rewrite)
- `components/globe/globe-evolution-nodes.tsx` (pulse + hover activation)

---

## 3. Premium Rotation System (`neural-globe-scene.tsx`)

### Raycast‑based cursor following
- `CursorFollowingGroup` now uses `THREE.Raycaster` with a virtual sphere at `GLOBE_RADIUS × 2.0`
- On each frame: `raycaster.setFromCamera(pointer, camera)` → `ray.intersectSphere(virtualSphere)`
- Intersection point mapped to pitch/yaw via `asin(-y)` and `atan2(x, z)`, scaled by `RAY_INFLUENCE = 0.4`
- Spring‑smoothed with `RAY_SPRING = 0.025`
- In idle mode: auto‑rotation + cursor yaw offset blend via `IDLE_SPRING`
- In exploration mode: ray yaw/pitch spring back to 0

### Tuning constants
```
AUTO_ROTATION_SPEED = 0.04    // base idle rotation
IDLE_SPRING = 0.02            // spring for cursor + auto
RAY_SPRING = 0.025            // spring for raycast following
FOCUS_SPRING = 0.03           // spring for node focus blend
CURSOR_INFLUENCE = 0.4        // raycast pitch/yaw scaling
DRAG_SENSITIVITY = 3.0 / 1.5 // x/y drag multiplier
DRAG_FRICTION = 0.96          // inertia decay per frame
PITCH_LIMIT = 0.8             // max pitch in exploration
```

### Exploration mode
- Double‑click toggles `explorationMode`
- On entry: syncs `autoRotationAngle` + `cursorPitch` from current quaternion to prevent snap
- Drag applies angular velocity → quaternion premultiplication via axis‑angle
- Friction decays velocity; idle drift kicks in when velocity < 0.001
- On exit: syncs back to idle state

### Files touched
- `components/globe/neural-globe-scene.tsx` (CursorFollowingGroup rewrite)

---

## 4. Real Dotted Earth (`continent-data.ts`, `globe-continent-dots.tsx`)

### Critical bug fix — `isPointInPolygon`
**Before (broken)**: Compared `polygon[i].lat > testLon` — comparing latitude vs longitude, wrong axes:
```typescript
const [yi, xi] = polygon[i]  // yi = lat, xi = lon
if (yi > lon !== yj > lon && ...)  // BUG: lat > testLon
```

**After (correct)**: Proper ray‑casting algorithm with lat/lon axis alignment:
```typescript
const [lat_i, lon_i] = polygon[i]
if ((lat_i > lat) !== (lat_j > lat) &&
    lon < ((lon_j - lon_i) * (lat - lat_i)) / (lat_j - lat_i) + lon_i) ...
```

This was the root cause of unrecognizable continents — dots were landing in wrong locations.

### Stratified dot sampling
Replaced Fibonacci sphere with latitude‑band stratified sampling + jitter:
- `numLatBands = max(80, ceil(sqrt(targetCount × 2)))`
- For each band: `numLon = max(3, round(expectedPerBand × cos(lat)))`
- Each dot jittered: `±60%` of cell dimensions
- Target: 8000 dots (was 5500)
- Brightness: `0.8 + random × 0.15`

### Shader improvements
- Point size increased: `0.05` (was 0.04)
- Edge fade exponent: 1.4 (was 1.2) — cleaner continent edge falloff
- New `uStrength` uniform for cinematic reveal control
- Fragment: removed separate edge/core blend, simplified to `core × brightness × edgeFade`

### Files touched
- `lib/continent-data.ts` (isPointInPolygon fix + stratified sampling)
- `components/globe/globe-continent-dots.tsx` (strength uniform + sizing)

---

## Files Modified (all)

| File | Change |
|---|---|
| `lib/continent-data.ts` | Fix isPointInPolygon (critical), new stratified dot generator, 8k dots |
| `components/globe/globe-continent-dots.tsx` | Added `strength` uniform, larger dots, cleaner shader |
| `components/globe/globe-connections.tsx` | Full rewrite — `primitive`‑based LINE, phased drawing/travelling/hold/fade, deduplicated dual‑source (click + hover) |
| `components/globe/globe-evolution-nodes.tsx` | Added pulse ring mesh, `hoverActivatedIds` prop, combined activation glow |
| `components/globe/neural-globe-scene.tsx` | Raycast cursor following, hover propagation system (BFS depth 6), `dotStrength` prop, refined spring constants |
| `components/globe/neural-globe.tsx` | Pass through `dotStrength` prop |
| `components/globe/GlobeSection.tsx` | Cinematic reveal (scale +22%, glow +133%, dot strength +50%), `onRevealProgress` callback |
| `components/layout/HomePageLayout.tsx` | `globeReveal` state, blur/darken hero section, cinematic overlay `z-[5]` |

---

---

## 5. Cursor & Rotation Experience (`neural-globe-scene.tsx`, `globe-earth.tsx`, `GlobeSection.tsx`)

### Custom Interaction Cursor
- `GlobeEarth` now accepts `onPointerEnter`/`onPointerLeave` callbacks
- `Scene` sets `document.body.style.cursor = "crosshair"` when pointer enters globe mesh, restores `"auto"` on leave
- Node hover sets `"pointer"`, restores to `"crosshair"` or `"auto"` depending on whether still over globe
- `GlobeSection.tsx` renders a fixed-position `<div>` reticle (32px ring + 4px center dot, cyan glow) that follows mouse within the globe container — visually communicates "this can be explored"

### Mass‑Chase Physics Model
Replaced spring‑based cursor smoothing with a velocity‑driven mass‑chase system:

**Constants** (`neural-globe-scene.tsx`):
```
CHASE_INFLUENCE = 0.45   // raycast → pitch/yaw scaling (40-60% lag zone)
CHASE_ACCEL     = 0.035  // how fast globe accelerates toward target
CHASE_DAMPING   = 0.93   // velocity friction per frame
CHASE_MAX_VEL   = 0.035  // max angular velocity cap
CHASE_MIN_VEL   = 0.0002 // min velocity before blending to idle
```

**How it works**:
1. Raycast against `CHASE_RADIUS` (= 2 × GLOBE_RADIUS) virtual sphere
2. Intersection point → pitch/yaw target via `asin(-y)` / `atan2(x, z)`, scaled by 0.45
3. Error between current chase target and raycast target drives velocity:
   ```
   desire = error × CHASE_ACCEL
   velocity += (desire - velocity) × CHASE_ACCEL
   velocity = clamp(velocity, ±CHASE_MAX_VEL)
   velocity *= CHASE_DAMPING
   chase += velocity × dt × 60
   ```
4. Small mouse movements → small error → gentle velocity → subtle response
5. Large movements → capped at MAX_VEL → smooth controlled chase
6. Globe **chases** the cursor, never matches exactly — always 40-60% behind

### Exit Momentum
- When pointer leaves globe (`isGlobeHovered = false`):
  - `isExiting` flag set to prevent re‑initialization
  - `EXIT_DAMPING = 0.96` applied to velocity each frame (slower decay than chase damping)
  - Globe continues rotating with existing momentum
  - When velocity drops below `CHASE_MIN_VEL`, blend target back toward 0 (idle)
  - Never abrupt stop

### Node Hover Freeze
- When `hoveredNodePosition` is set AND `focusBlend > FOCUS_FREEZE_THRESHOLD (0.3)`:
  - Raycast target update **paused** (cursor chase freezes at current position)
  - Auto‑rotation also paused during node focus
  - Node focus quaternion SLERP overrides via existing `focusBlend` mechanism
  - On unhover: `focusBlend` decays → cursor chase resumes from frozen position → seamless return
- Auto‑rotation only advances when NOT in node focus (`!inNodeFocus`)

### Design Principles
- Globe has weight, mass, inertia — chases cursor like a suspended celestial object
- Never snap, never instantly align, never oscillate (over‑damped velocity system)
- Exit momentum prevents any feeling of "sticky" or abrupt behavior
- Node focus temporarily overrides chase without creating a jarring snap‑back

### Files touched
- `components/globe/globe-earth.tsx` (added pointer event props)
- `components/globe/neural-globe-scene.tsx` (mass‑chase physics, exit momentum, node freeze, cursor management)
- `components/globe/GlobeSection.tsx` (custom reticle div, mouse tracking)

---

## Next Steps / Future Work

1. **Continent polygon refinement** — Current polygons are hand‑traced approximations. Replace with compressed Natural Earth GeoJSON for accurate coastlines and island chains.
2. **Evolution Node placement** — Nodes should sit naturally on continent surfaces, validated against `isOnLand()`. Currently positioned by lat/lon without continent validation.
3. **GlobeSection errors** — The module‑level `let GlobeComponent: React.ComponentType<any> | null = null` caching pattern causes TS errors (TS2604, TS2786, TS2345). Fix by using React.lazy or a proper state pattern.
4. **Connection performance** — With 12 nodes fully propagated, up to 66 unique edges could animate simultaneously. If perf issues arise, cap simultaneously animated arcs or pool them.
5. **Mobile interaction** — Glob rotation / node hover needs touch equivalents (raycast from touch position, long‑press for hover).
6. **Scroll‑driven propagation** — Consider triggering propagation automatically as user scrolls past certain node regions.
