import type { Anime } from '@/features/anime-universe/models/Anime'

const API_URL = '/api/universe/anime'

export async function fetchAnimeList(): Promise<Anime[]> {
  const res = await fetch(`${API_URL}?t=${Date.now()}`, { cache: 'no-store' })

  if (!res.ok) {
    throw new Error(`Failed to load anime list: ${res.status}`)
  }

  return res.json() as Promise<Anime[]>
}
