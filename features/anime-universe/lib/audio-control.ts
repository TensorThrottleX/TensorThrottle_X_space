type Listener = (muted: boolean) => void

let _muted = false
const listeners = new Set<Listener>()

export function setAnimeAudioMuted(muted: boolean): void {
  _muted = muted
  listeners.forEach(fn => fn(_muted))
}

export function getAnimeAudioMuted(): boolean {
  return _muted
}

export function toggleAnimeAudioMuted(): void {
  setAnimeAudioMuted(!_muted)
}

export function onAnimeAudioMutedChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}
