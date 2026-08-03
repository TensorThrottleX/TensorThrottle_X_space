interface VideoMeta {
  width: number
  height: number
  hasAudio: boolean
}

const cache = new Map<string, VideoMeta>()

export const VideoCache = {
  has(key: string): boolean {
    return cache.has(key)
  },

  get(key: string): VideoMeta | undefined {
    return cache.get(key)
  },

  set(key: string, meta: VideoMeta): void {
    cache.set(key, meta)
  },

  remove(key: string): void {
    cache.delete(key)
  },

  clear(): void {
    cache.clear()
  },

  get size(): number {
    return cache.size
  },
}