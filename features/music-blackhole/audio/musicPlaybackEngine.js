// ═══════════════════════════════════════════════════════════════════════
// MUSIC PLAYBACK ENGINE — provider-agnostic audio layer
// ───────────────────────────────────────────────────────────────────────
// The Blackhole UI never touches <audio>, fetch(), or a provider SDK
// directly — it only ever calls engine.play() / .stop() / .toggle() and
// subscribes to state changes. Swapping or adding a provider (Spotify,
// YouTube Music, a self-hosted library...) is an adapter-level change
// here, never a change to any component under /scene or /ui.
//
// SOURCE PRIORITY: local file → configured API provider → unavailable.
// Providers are tried in the order they're passed to the engine.
// ═══════════════════════════════════════════════════════════════════════

const FADE_MS = 380;
const SUPPORTED_EXTENSIONS = ["mp3", "ogg", "wav", "m4a", "flac"];

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Resolves tracks that reference a file under the app's public media
 * directory. Deliberately narrow: it will only ever hand back a URL that
 * starts with the configured base dir, so track data can never be used
 * to reach an arbitrary filesystem path.
 */
export class LocalMusicProvider {
  constructor({ baseDir = "/media/music/" } = {}) {
    this.baseDir = baseDir.replace(/^\/+|\/+$/g, "") + "/";
  }

  async getPlayableSource(track) {
    if (!track?.audioUrl) return null;
    const clean = String(track.audioUrl).replace(/^\/+/, "");
    if (!clean.startsWith(this.baseDir)) return null;
    const ext = clean.split(".").pop()?.toLowerCase();
    if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) return null;
    return `/${clean}`;
  }
}

/**
 * Adapter interface any external provider implements. The engine only
 * ever depends on this shape. Real credentials belong on your server,
 * behind whatever `endpoint` you pass in — this class never sees a
 * secret key, and none of these methods should ever be called with one
 * baked into the client bundle.
 */
export class MusicProviderAdapter {
  async search(_query) { throw new Error("search() not implemented"); }
  async getTrack(_id) { throw new Error("getTrack() not implemented"); }
  async getPlayableSource(_track) { throw new Error("getPlayableSource() not implemented"); }
}

/**
 * Reference adapter for a server-side-keyed API. `endpoint` should point
 * at your own backend route, which holds the actual provider secret and
 * returns a short-lived playable/stream URL — never the secret itself.
 */
export class RemoteApiMusicProvider extends MusicProviderAdapter {
  constructor({ endpoint = "/api/music" } = {}) {
    super();
    this.endpoint = endpoint.replace(/\/+$/, "");
  }

  async search(query) {
    const res = await fetch(`${this.endpoint}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  }

  async getTrack(id) {
    const res = await fetch(`${this.endpoint}/track/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    return res.json();
  }

  async getPlayableSource(track) {
    const ref = track?.apiRef?.trackId || track?.id;
    if (!ref) return null;
    const res = await fetch(`${this.endpoint}/stream-url/${encodeURIComponent(ref)}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.url || null;
  }
}

/**
 * MusicPlaybackEngine
 * Emits state via subscribe() — nothing here ever drives a React render
 * loop or gets polled. Handles crossfade, source-priority fallback, and
 * race conditions from rapid double-clicking between stars.
 */
export class MusicPlaybackEngine {
  constructor({ providers } = {}) {
    this.providers = providers?.length ? providers : [new LocalMusicProvider()];
    this.audio = null;
    this.currentTrack = null;
    this.status = "idle"; // idle | loading | playing | paused | error
    this._listeners = new Set();
    this._fadeRaf = null;
    this._playToken = 0; // invalidates in-flight play() calls superseded by a newer one
  }

  subscribe(fn) {
    this._listeners.add(fn);
    fn({ track: this.currentTrack, status: this.status });
    return () => this._listeners.delete(fn);
  }

  _emit() {
    const snapshot = { track: this.currentTrack, status: this.status };
    this._listeners.forEach((fn) => fn(snapshot));
  }

  async _resolveSource(track) {
    for (const provider of this.providers) {
      try {
        const url = await provider.getPlayableSource(track);
        if (url) return url;
      } catch (err) {
        console.warn("[MusicPlaybackEngine] provider failed:", provider.constructor.name, err);
      }
    }
    return null;
  }

  _fade(audio, from, to, onDone) {
    if (this._fadeRaf) cancelAnimationFrame(this._fadeRaf);
    const start = performance.now();
    audio.volume = from;
    const step = (now) => {
      const p = clamp01((now - start) / FADE_MS);
      audio.volume = from + (to - from) * p;
      if (p < 1) {
        this._fadeRaf = requestAnimationFrame(step);
      } else {
        onDone?.();
      }
    };
    this._fadeRaf = requestAnimationFrame(step);
  }

  /** Play a track. If something else is playing, it's faded out first. */
  async play(track, startPaused = false) {
    if (!track) return;
    const token = ++this._playToken;
    const outgoing = this.audio;
    if (outgoing) {
      this._fade(outgoing, outgoing.volume, 0, () => {
        outgoing.pause();
        outgoing.src = "";
      });
    }

    this.currentTrack = track;
    this.status = "loading";
    this._emit();

    const url = await this._resolveSource(track);
    if (token !== this._playToken) return; // superseded

    if (!url) {
      this.status = "error";
      this.audio = null;
      this._emit();
      return;
    }

    const audio = new Audio(url);
    audio.preload = "auto";
    audio.volume = 0;
    audio.onended = () => {
      if (this.currentTrack?.id === track.id) {
        this.currentTrack = null;
        this.status = "idle";
        this._emit();
      }
    };
    audio.onerror = () => {
      if (token === this._playToken) {
        this.status = "error";
        this._emit();
      }
    };

    try {
      if (!startPaused) {
        await audio.play();
      }
    } catch {
      if (token === this._playToken) {
        this.status = "error";
        this._emit();
      }
      return;
    }

    if (token !== this._playToken) {
      if (!startPaused) audio.pause();
      return;
    }

    this.audio = audio;
    this.status = startPaused ? "paused" : "playing";
    this._emit();
    if (!startPaused) {
      this._fade(audio, 0, 1);
    } else {
      audio.volume = 1; // if it's paused, just set it to 1 so when it resumes it's ready, wait, resume fades from 0 to 1 anyway, but let's leave it at 0, or 1. Actually resume fades from 0 to 1, so 0 is fine.
    }
  }

  stop() {
    this._playToken++; // invalidate any in-flight play()
    if (this.audio) {
      const audio = this.audio;
      this._fade(audio, audio.volume, 0, () => {
        audio.pause();
        audio.src = "";
      });
    }
    this.audio = null;
    this.currentTrack = null;
    this.status = "idle";
    this._emit();
  }

  pause() {
    if (this.audio && this.status === "playing") {
      this._fade(this.audio, this.audio.volume, 0, () => {
        if (this.audio) this.audio.pause();
        this.status = "paused";
        this._emit();
      });
    }
  }

  resume() {
    if (this.audio && this.status === "paused") {
      this.audio.play().then(() => {
        this.status = "playing";
        this._emit();
        this._fade(this.audio, 0, 1);
      }).catch(() => {
        this.status = "error";
        this._emit();
      });
    }
  }

  /** Double-click semantics: same track → toggle pause/resume; different/none → play. */
  togglePlay(track) {
    if (!track) return;
    if (this.currentTrack?.id === track.id) {
      if (this.status === "playing") {
        this.pause();
      } else if (this.status === "paused") {
        this.resume();
      } else {
        this.play(track);
      }
    } else {
      this.play(track);
    }
  }

  seek(time) {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  dispose() {
    if (this._fadeRaf) cancelAnimationFrame(this._fadeRaf);
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
    }
    this._listeners.clear();
  }
}
