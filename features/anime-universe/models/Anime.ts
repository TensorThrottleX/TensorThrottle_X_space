import type { Character } from './Character'

export interface Anime {
  id: string
  title: string
  subtitle: string
  description: string
  accentColor: string
  quotes: string[]
  characters: Character[]
  coverImage: string | null
  videoUrl: string | null
  audioTracks: string[]
  updatedAt?: string
}
