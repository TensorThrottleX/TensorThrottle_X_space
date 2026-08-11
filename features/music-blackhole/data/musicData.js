// ═══════════════════════════════════════════════════════════════════════
// MUSIC BLACKHOLE — Data Model, Clustering & Position Engine
// ───────────────────────────────────────────────────────────────────────
// Pure data layer. Knows nothing about Three.js, React, or audio.
// Adding a song is a data-only change — nothing in here (or in the
// renderer) needs to change when a new track, cluster, or metadata field
// shows up. One malformed track is caught and skipped; it can never take
// the rest of the blackhole down with it.
//
// TRACK SCHEMA (normalized shape produced by buildBlackhole):
// {
//   id, title, artist, album, genre, mood[], year,
//   source: "local" | "api",
//   audioUrl,          // local path under the configured media dir
//   apiRef,             // { provider, trackId } — opaque, adapter reads it
//   coverUrl, memory, meaning,
//   cluster,             // optional curated label, e.g. "Nocturnal"
//   clusterKey,           // derived slug used for grouping/position/color
//   clusterColor,          // hex, derived from clusterKey
//   clusterLabel,            // display label for this track's cluster
//   position: { x, y, z },
//   connections: string[],    // related track ids, capped
// }
// ═══════════════════════════════════════════════════════════════════════

// A small, calm palette. "Echoes" (the unsorted fallback) always gets the
// muted grey so it reads as the deliberate catch-all, not a random color.
// Restrained warm palette — no bright neons, befitting a black-hole universe.
// Rock: muted red-orange, Ambient: muted violet, Classical: warm white/gold,
// Anime: deep crimson/amber, Electronic: cold blue-gray
const PALETTE = ["#c47a3a", "#7a8ea0", "#d4a95a", "#a35040", "#8b7560"];
const UNSORTED_COLOR = "#6b6358";
const UNSORTED_KEY = "unsorted";
const UNSORTED_CENTER = [18, -2, -20]; // fixed & distinct — a quiet outer orbit

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// ─── deterministic hashing (no Math.random anywhere in this file) ───────

function hash01(str, salt = 0) {
  let h = 2166136261 ^ salt;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 13;
  h = Math.imul(h, 0x5bd1e995);
  h ^= h >>> 15;
  return ((h >>> 0) % 1_000_000) / 1_000_000;
}

function slugify(str) {
  const s = String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return s || UNSORTED_KEY;
}

function titleCase(str) {
  return String(str).replace(/(^|[\s-])\S/g, (c) => c.toUpperCase());
}

// ─── cluster key / label / color / center ────────────────────────────────
// Grouping preference: explicit cluster → genre → mood → artist → era →
// unsorted. Nothing here is a hard-coded coordinate — every cluster's
// position and color is *derived* from its key, so an arbitrary real
// library clusters itself without anyone registering genres up front.

function deriveClusterKey(raw) {
  if (raw?.cluster) return slugify(raw.cluster);
  if (raw?.genre) return slugify(raw.genre);
  if (raw?.mood?.[0]) return slugify(raw.mood[0]);
  if (raw?.artist) return slugify(raw.artist);
  if (raw?.year) return `${Math.floor(raw.year / 10) * 10}s`;
  return UNSORTED_KEY;
}

function deriveClusterLabel(raw) {
  if (raw?.cluster) return titleCase(raw.cluster);
  if (raw?.genre) return raw.genre;
  if (raw?.mood?.[0]) return titleCase(raw.mood[0]);
  if (raw?.artist) return raw.artist;
  if (raw?.year) return `${Math.floor(raw.year / 10) * 10}s`;
  return "Echoes";
}

function clusterCenter(key) {
  if (key === UNSORTED_KEY) return UNSORTED_CENTER;
  // Clusters orbit the black hole at varying radii and inclinations.
  // Disc-shaped distribution — flattened on Y to match accretion disk plane.
  // Different clusters sit at different orbital radii so they don't overlap.
  const azimuth = hash01(key, 11) * Math.PI * 2;
  const tilt = (hash01(key, 23) - 0.5) * 0.4;
  const radius = 14 + hash01(key, 37) * 16;
  return [
    Math.cos(azimuth) * radius,
    Math.sin(tilt) * radius * 0.2,
    Math.sin(azimuth) * radius,
  ];
}

function clusterColor(key) {
  if (key === UNSORTED_KEY) return UNSORTED_COLOR;
  const idx = Math.floor(hash01(key, 51) * PALETTE.length) % PALETTE.length;
  return PALETTE[idx];
}

// ─── per-track position within its cluster ───────────────────────────────
// Golden-angle spiral fill: evenly distributes members of a cluster
// through a soft, slightly flattened blob without ever looking like a
// grid or a perfect geometric shell. Fully deterministic given a stable,
// sorted member order (sorted by id — independent of input array order,
// so reordering the source data doesn't reshuffle the constellation).

function computePosition(track, clusterEntry) {
  const members = clusterEntry.memberIds;
  const n = members.length;
  const idx = members.indexOf(track.id);
  const [cx, cy, cz] = clusterEntry.center;

  if (n <= 1) {
    return { x: cx, y: cy, z: cz };
  }

  const spread = 1.7 + Math.min(n, 48) * 0.085;
  const yNorm = 1 - (idx / (n - 1)) * 2; // -1..1, even spacing
  const ringRadius = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
  const swirl = GOLDEN_ANGLE * idx + ringRadius * spread * 0.05; // gentle spiral-arm twist
  const jitter = 0.55 + hash01(track.id, 61) * 0.55; // organic irregularity, not a perfect shell
  const r = spread * jitter;

  return {
    x: cx + Math.cos(swirl) * ringRadius * r,
    y: cy + yNorm * spread * 0.55, // flattened — reads as a disc, not a sphere
    z: cz + Math.sin(swirl) * ringRadius * r,
  };
}

// ─── normalization ────────────────────────────────────────────────────────

function safeNormalizeOne(raw, index) {
  try {
    if (!raw || typeof raw !== "object") return null;
    const id = raw.id != null ? String(raw.id) : `track-${index}`;
    return {
      id,
      title: raw.title || "Untitled",
      artist: raw.artist || "Unknown artist",
      album: raw.album || null,
      genre: raw.genre || null,
      mood: Array.isArray(raw.mood) ? raw.mood.filter(Boolean) : [],
      year: Number.isFinite(raw.year) ? raw.year : null,
      source: raw.source === "api" ? "api" : "local",
      audioUrl: raw.audioUrl || null,
      apiRef: raw.apiRef || null,
      coverUrl: raw.coverUrl || null,
      memory: raw.memory || null,
      meaning: raw.meaning || null,
      hardHittingLine: raw.hardHittingLine || null,
      whyThisLine: raw.whyThisLine || null,
      cluster: raw.cluster || null,
      clusterKey: deriveClusterKey(raw),
      clusterLabel: deriveClusterLabel(raw),
      // Solar System specifics
      planet: raw.planet || null,
      planetName: raw.planetName || null,
      lifeMoment: raw.lifeMoment || null,
      lifeInstance: raw.lifeInstance || null,
      songs: raw.songs || [],
      // Explicit personal relationships win; auto-derived later if absent.
      connections: Array.isArray(raw.connections) && raw.connections.length
        ? [...new Set(raw.connections.map(String))].slice(0, 4)
        : null,
    };
  } catch (err) {
    console.warn("[MusicBlackhole] Skipped a malformed track at index", index, err);
    return null;
  }
}

function buildClusterIndex(tracks) {
  const map = new Map();
  for (const t of tracks) {
    if (!map.has(t.clusterKey)) {
      map.set(t.clusterKey, {
        key: t.clusterKey,
        label: t.clusterLabel,
        color: clusterColor(t.clusterKey),
        center: clusterCenter(t.clusterKey),
        memberIds: [],
      });
    }
    map.get(t.clusterKey).memberIds.push(t.id);
  }
  for (const entry of map.values()) entry.memberIds.sort(); // stable order
  return map;
}

// Related-song lines: same artist first (strongest signal), then shared
// mood. Capped hard so the constellation never turns into a hairball.
function deriveConnections(tracks, { maxPerTrack = 2, maxCandidates = 5 } = {}) {
  const byArtist = new Map();
  const byMood = new Map();
  for (const t of tracks) {
    if (t.artist) {
      if (!byArtist.has(t.artist)) byArtist.set(t.artist, []);
      byArtist.get(t.artist).push(t.id);
    }
    for (const m of t.mood) {
      if (!byMood.has(m)) byMood.set(m, []);
      byMood.get(m).push(t.id);
    }
  }
  return tracks.map((t) => {
    if (t.connections) return t; // already explicit
    const candidates = [];
    for (const id of byArtist.get(t.artist) || []) if (id !== t.id) candidates.push(id);
    for (const m of t.mood) for (const id of byMood.get(m) || []) if (id !== t.id) candidates.push(id);
    const unique = [...new Set(candidates)].sort().slice(0, maxCandidates);
    return { ...t, connections: unique.slice(0, maxPerTrack) };
  });
}

/**
 * Build a fully positioned, clustered, connected blackhole from raw track
 * data. Safe to call with `undefined`, `[]`, or a partially malformed
 * array — it always returns a valid (possibly empty) blackhole.
 */
export function buildBlackhole(rawTracks) {
  const safeRaw = Array.isArray(rawTracks) ? rawTracks : [];
  const base = safeRaw.map(safeNormalizeOne).filter(Boolean);
  const clusterIndex = buildClusterIndex(base);

  const positioned = base.map((t) => {
    const entry = clusterIndex.get(t.clusterKey);
    return {
      ...t,
      clusterColor: entry.color,
      clusterLabel: entry.label,
      position: computePosition(t, entry),
    };
  });

  return {
    tracks: deriveConnections(positioned),
    clusters: clusterIndex,
  };
}

export const EMPTY_BLACKHOLE = { tracks: [], clusters: new Map() };
export { hash01 };
