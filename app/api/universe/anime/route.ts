import { NextResponse } from 'next/server'
import { readdirSync, readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

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

function findAsset(dir: string, id: string, extensions: readonly string[]): string | null {
  for (const ext of extensions) {
    const filePath = join(dir, id, `${id}${ext}`)
    if (existsSync(filePath)) {
      return `${id}${ext}`
    }
  }
  return null
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



export async function GET() {
  if (!existsSync(DATA_DIR)) {
    return NextResponse.json([])
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

    const coverFilename = findAsset(COVER_DIR, id, COVER_EXTENSIONS)
    const videoFilename = findAsset(VIDEO_DIR, id, VIDEO_EXTENSIONS)
    const audioFilename = findAsset(AUDIO_DIR, id, AUDIO_EXTENSIONS)

    let updatedAt = new Date().toISOString()
    try {
      const stats = statSync(jsonPath)
      updatedAt = stats.mtime.toISOString()
    } catch (e) {
      // fallback
    }

    results.push({
      id,
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
      coverImage: coverFilename ? coverPath(id, coverFilename) : null,
      videoUrl: videoFilename ? videoPath(id, videoFilename) : null,
      audioTracks: audioFilename ? [audioPath(id, audioFilename)] : [],
      updatedAt,
      // The new universal template data payload
      narrativeData: parsed as any,
    })
  }

  // Default entry always first
  const defaultIdx = results.findIndex((a) => a.id === 'default')
  if (defaultIdx > 0) {
    const [def] = results.splice(defaultIdx, 1)
    results.unshift(def)
  }

  return NextResponse.json(results)
}
