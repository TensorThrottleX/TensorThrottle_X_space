import { NextResponse } from 'next/server'
import { readdirSync, readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
import {
  COVER_EXTENSIONS,
  VIDEO_EXTENSIONS,
  AUDIO_EXTENSIONS,
} from '@/features/anime-universe/assets/manifest'
import { coverPath, videoPath, audioPath } from '@/features/anime-universe/assets/resolver'
import type { Anime } from '@/features/anime-universe/models/Anime'

const PUBLIC_DIR = join(process.cwd(), 'public')
const DATA_DIR = join(PUBLIC_DIR, 'media/universe/anime/data')
const COVER_DIR = join(PUBLIC_DIR, 'media/universe/anime/cover')
const VIDEO_DIR = join(PUBLIC_DIR, 'media/universe/anime/video')
const AUDIO_DIR = join(PUBLIC_DIR, 'media/universe/anime/audio')

function isMatch(id1: string, id2: string): boolean {
  const norm1 = id1.toLowerCase().replace(/[^a-z0-9]/g, '')
  const norm2 = id2.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!norm1 || !norm2) return false
  return norm1 === norm2 || norm1.startsWith(norm2) || norm2.startsWith(norm1)
}

function findAsset(dir: string, id: string, extensions: readonly string[]): { dirName: string, filename: string } | null {
  if (!existsSync(dir)) return null

  try {
    const folders = readdirSync(dir, { withFileTypes: true })
    for (const folder of folders) {
      if (!folder.isDirectory()) continue
      
      if (isMatch(folder.name, id)) {
        const assetDir = join(dir, folder.name)
        const files = readdirSync(assetDir)
        for (const file of files) {
          if (extensions.some(ext => file.toLowerCase().endsWith(ext.toLowerCase()))) {
            return { dirName: folder.name, filename: file }
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
  
  return null
}

function findAssets(dir: string, id: string, extensions: readonly string[]): { dirName: string, filename: string }[] {
  if (!existsSync(dir)) return []

  try {
    const folders = readdirSync(dir, { withFileTypes: true })
    for (const folder of folders) {
      if (!folder.isDirectory()) continue
      
      if (isMatch(folder.name, id)) {
        const assetDir = join(dir, folder.name)
        const files = readdirSync(assetDir)
        const matchedFiles = files.filter(file => extensions.some(ext => file.toLowerCase().endsWith(ext.toLowerCase())))
        
        matchedFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
        
        return matchedFiles.map(filename => ({ dirName: folder.name, filename }))
      }
    }
  } catch (e) {
    // ignore
  }
  
  return []
}

// ── Defensive readers: absent/empty → undefined so sections hide gracefully ──
function asString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function asStringList(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const list = v.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean)
  return list.length ? list : undefined
}

function asStringRecord(v: unknown, keys: readonly string[]): Record<string, string> | null {
  if (!v || typeof v !== 'object') return null
  const rec = v as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const k of keys) {
    const val = rec[k]
    out[k] = typeof val === 'string' ? val.trim() : ''
  }
  return keys.some((k) => out[k]) ? out : null
}



// JSON on disk can change anytime; never let the browser (or any cache)
// keep a stale copy of the list — otherwise edits to the data/*.json files
// appear "not to update" on refresh.
const NO_STORE = { 'Cache-Control': 'no-store' }

export async function GET() {
  if (!existsSync(DATA_DIR)) {
    return NextResponse.json([], { headers: NO_STORE })
  }

  const entries = readdirSync(DATA_DIR, { withFileTypes: true })
  const folders = entries.filter((e) => e.isDirectory())

  const results: Anime[] = []

  for (const folder of folders) {
    const id = folder.name

    const jsonPath = join(DATA_DIR, id, `${id}.json`)
    if (!existsSync(jsonPath)) continue

    let parsed: Record<string, unknown>
    try {
      const raw = readFileSync(jsonPath, 'utf-8')
      parsed = JSON.parse(raw)
    } catch {
      continue
    }

    const coverAsset = findAsset(COVER_DIR, id, COVER_EXTENSIONS)
    const videoAsset = findAsset(VIDEO_DIR, id, VIDEO_EXTENSIONS)
    const audioAssets = findAssets(AUDIO_DIR, id, AUDIO_EXTENSIONS)

    let updatedAt = new Date().toISOString()
    try {
      const stats = statSync(jsonPath)
      updatedAt = stats.mtime.toISOString()
    } catch (e) {
      // fallback
    }

    results.push({
      id,
      index: Number.isFinite(parsed.index) ? Number(parsed.index) : Number.MAX_SAFE_INTEGER,
      title: String(parsed.title ?? id),
      subtitle: asString(parsed.subtitle) ?? '',
      description: asString(parsed.description) ?? '',
      accentColor: asString(parsed.accentColor) ?? '#22d3ee',
      quotes: asStringList(parsed.quotes) ?? [],
      characters: Array.isArray(parsed.characters)
        ? parsed.characters
            .map((c: unknown) => {
              const rec = asStringRecord(c, ['name', 'role'])
              return rec ? { name: rec.name, role: rec.role } : null
            })
            .filter((c): c is { name: string; role: string } => c !== null)
        : [],
      coverImage: coverAsset ? coverPath(coverAsset.dirName, coverAsset.filename) : (asString(parsed.poster) || null),
      videoUrl: videoAsset ? videoPath(videoAsset.dirName, videoAsset.filename) : null,
      audioTracks: audioAssets.map(asset => audioPath(asset.dirName, asset.filename)),
      updatedAt,
      // The new universal template data payload
      narrativeData: parsed as any,
    })
  }

  // Order by the per-title JSON `index` field, so the carousel follows the
  // authored sequence (default = 0 first) instead of filesystem order.
  results.sort((a, b) => a.index - b.index)

  // Default entry always first (safety net in case its index isn't 0)
  const defaultIdx = results.findIndex((a) => a.id === 'default')
  if (defaultIdx > 0) {
    const [def] = results.splice(defaultIdx, 1)
    results.unshift(def)
  }

  return NextResponse.json(results, { headers: NO_STORE })
}
