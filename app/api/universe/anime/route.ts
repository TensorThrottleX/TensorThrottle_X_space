import { NextResponse } from 'next/server'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

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

    results.push({
      id,
      title: String(parsed.title ?? id),
      subtitle: String(parsed.subtitle ?? ''),
      description: String(parsed.description ?? ''),
      accentColor: String(parsed.accentColor ?? '#22d3ee'),
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes.map(String) : [],
      characters: Array.isArray(parsed.characters)
        ? parsed.characters.map((c: unknown) => {
            const ch = c as Record<string, unknown>
            return { name: String(ch.name ?? ''), role: String(ch.role ?? '') }
          })
        : [],
      coverImage: coverFilename ? coverPath(id, coverFilename) : null,
      videoUrl: videoFilename ? videoPath(id, videoFilename) : null,
      audioTracks: audioFilename ? [audioPath(id, audioFilename)] : [],
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
