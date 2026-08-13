import type { Character } from './Character'
import type { AnimeNarrativeData } from '../components/narrative'

export interface Anime {
  id: string
  index: number
  title: string
  subtitle: string
  description: string
  accentColor: string
  quotes: string[]
  characters: Character[]
  coverImage: string | null
  videoUrl: string | null
  videoUrls?: string[]
  audioTracks: string[]
  updatedAt?: string

  // The new universal template data payload
  narrativeData?: AnimeNarrativeData
}
