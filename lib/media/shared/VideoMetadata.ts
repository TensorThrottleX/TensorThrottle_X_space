export interface VideoMetadata {
  width: number
  height: number
  hasAudio: boolean
  src?: string
}

export function createVideoMetadata(video: HTMLVideoElement, src?: string): VideoMetadata {
  return {
    width: video.videoWidth,
    height: video.videoHeight,
    hasAudio: hasAudioTracks(video),
    src,
  }
}

function hasAudioTracks(video: HTMLVideoElement): boolean {
  try {
    return ((video as any).audioTracks?.length ?? 0) > 0 ||
      !!(video as any).mozHasAudio ||
      Boolean((video as any).webkitAudioDecodedByteCount)
  } catch {
    return false
  }
}
