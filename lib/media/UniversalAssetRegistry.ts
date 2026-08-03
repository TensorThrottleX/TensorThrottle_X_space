export interface AssetPackage {
  id: string
  dimension: string
  videoUrl: string | null
  audioUrl: string | null
  coverUrl: string | null
  theme?: 'dark' | 'bright' | 'dynamic'
  metadataUrl: string | null
}

export class UniversalAssetRegistry {
  private static instance: UniversalAssetRegistry

  private constructor() {}

  public static getInstance(): UniversalAssetRegistry {
    if (!UniversalAssetRegistry.instance) {
      UniversalAssetRegistry.instance = new UniversalAssetRegistry()
    }
    return UniversalAssetRegistry.instance
  }

  public resolve(dimension: string, id: string): AssetPackage {
    // Determine the base path based on the dimension
    const basePath = `/media/universe/${dimension}`

    // Standard resolution flow based on strict convention
    // E.g., dimension = 'anime', id = 'Dragon Ball'
    return {
      id,
      dimension,
      videoUrl: encodeURI(`${basePath}/video/${id}/${id}.mp4`),
      audioUrl: encodeURI(`${basePath}/audio/${id}/${id}.mp3`),
      coverUrl: encodeURI(`${basePath}/cover/${id}/${id}.jpg`),
      theme: 'dynamic', // Or parsed dynamically from metadata later
      metadataUrl: encodeURI(`${basePath}/data/${id}/${id}.json`)
    }
  }

  // Pre-load or fetch metadata ahead of time if needed
  public async fetchMetadata(dimension: string, id: string): Promise<any> {
    const pkg = this.resolve(dimension, id)
    if (!pkg.metadataUrl) return null
    try {
      const res = await fetch(pkg.metadataUrl)
      if (res.ok) {
        return await res.json()
      }
    } catch (e) {
      console.warn(`[UniversalAssetRegistry] Failed to fetch metadata for ${dimension}/${id}`)
    }
    return null
  }

  private backgroundCache: { videos: { name: string, path: string }[], sounds: { name: string, path: string }[] } | null = null

  public async fetchBackgroundAssets(): Promise<{ videos: { name: string, path: string }[], sounds: { name: string, path: string }[] }> {
    if (this.backgroundCache) {
      return this.backgroundCache
    }
    try {
      const res = await fetch('/api/media')
      if (res.ok) {
        const data = await res.json()
        this.backgroundCache = data
        return data
      }
    } catch (e) {
      console.warn(`[UniversalAssetRegistry] Failed to fetch background assets`, e)
    }
    return { videos: [], sounds: [] }
  }
}

export const assetRegistry = UniversalAssetRegistry.getInstance()
