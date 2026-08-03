export const ANIME_BASE = '/media/universe/anime'

export const DIRS = {
  data: `${ANIME_BASE}/data`,
  cover: `${ANIME_BASE}/cover`,
  video: `${ANIME_BASE}/video`,
  audio: `${ANIME_BASE}/audio`,
} as const

export const COVER_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png', '.avif'] as const

export const VIDEO_EXTENSIONS = ['.mp4', '.webm'] as const

export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'] as const
