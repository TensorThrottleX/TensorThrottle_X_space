import { DIRS } from './manifest'

export function coverPath(animeId: string, filename: string): string {
  return encodeURI(`${DIRS.cover}/${animeId}/${filename}`)
}

export function videoPath(animeId: string, filename: string): string {
  return encodeURI(`${DIRS.video}/${animeId}/${filename}`)
}

export function audioPath(animeId: string, filename: string): string {
  return encodeURI(`${DIRS.audio}/${animeId}/${filename}`)
}
