import { useState, useEffect, useRef } from "react";

const srOnly = {
  position: "absolute", width: 1, height: 1, overflow: "hidden",
  clip: "rect(0 0 0 0)", clipPath: "inset(50%)", whiteSpace: "nowrap",
};

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MiniPlayer({ engine, tracks }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [totalSongs, setTotalSongs] = useState(0);
  const [parentTrack, setParentTrack] = useState(null);
  const progressLineRef = useRef(null);

  useEffect(() => {
    if (!engine) return;

    // Check initial state
    if (engine.currentTrack) {
      setCurrentSong(engine.currentTrack);
      setIsPlaying(engine.audio && !engine.audio.paused);
      
      // Find parent track to know total songs
      const parent = tracks.find(t => t.songs?.some(s => s.id === engine.currentTrack.id));
      if (parent && parent.songs) {
        setParentTrack(parent);
        setTotalSongs(parent.songs.length);
        setCurrentIdx(parent.songs.findIndex(s => s.id === engine.currentTrack.id));
      }
    }

    const unsub = engine.subscribe((state) => {
      if (state.track) {
        setCurrentSong(state.track);
        const parent = tracks.find(t => t.songs?.some(s => s.id === state.track.id));
        if (parent && parent.songs) {
          setParentTrack(parent);
          setTotalSongs(parent.songs.length);
          setCurrentIdx(parent.songs.findIndex(s => s.id === state.track.id));
        }
      }
      setIsPlaying(state.status === "playing");
    });

    return unsub;
  }, [engine, tracks]);

  useEffect(() => {
    if (!engine || !engine.audio) return;
    let raf;
    const updateProgress = () => {
      if (engine.audio && engine.currentTrack?.id === currentSong?.id) {
        const ct = engine.audio.currentTime;
        const dur = engine.audio.duration || 0;
        setCurrentTime(ct);
        setDuration(dur);
        if (dur > 0) setProgress(ct / dur);
      }
      raf = requestAnimationFrame(updateProgress);
    };
    raf = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(raf);
  }, [engine, currentSong]);

  const [isDragging, setIsDragging] = useState(false);

  if (!currentSong) return null;

  const handleTogglePlay = () => {
    if (!engine) return;
    engine.togglePlay(currentSong);
  };

  const handlePrev = () => {
    if (!parentTrack || !engine) return;
    if (currentIdx > 0) {
      engine.stop();
      setTimeout(() => {
        engine.play(parentTrack.songs[currentIdx - 1], !isPlaying);
      }, 50);
    }
  };

  const handleNext = () => {
    if (!parentTrack || !engine) return;
    if (currentIdx < parentTrack.songs.length - 1) {
      engine.stop();
      setTimeout(() => {
        engine.play(parentTrack.songs[currentIdx + 1], !isPlaying);
      }, 50);
    }
  };


  const updateSeek = (e) => {
    if (!progressLineRef.current || !engine?.audio) return;
    const rect = progressLineRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    if (duration > 0) {
      engine.seek(percentage * duration);
      setProgress(percentage);
      setCurrentTime(percentage * duration);
    }
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    updateSeek(e);
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    updateSeek(e);
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    if (e.target.hasPointerCapture(e.pointerId)) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  const currentCountStr = String(currentIdx + 1).padStart(2, '0');
  const totalCountStr = String(totalSongs).padStart(2, '0');

  return (
    <div style={{
      position: "absolute", top: 220, left: 24,
      width: 200, padding: "16px",
      background: "rgba(10, 10, 10, 0.4)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      borderRadius: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      backdropFilter: "blur(10px)",
      display: "flex", flexDirection: "column",
      userSelect: "none",
      pointerEvents: "auto",
      color: "#fff",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>NOW PLAYING</div>
        <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)" }}>{currentCountStr}/{totalCountStr}</div>
      </div>
      
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4, textTransform: "uppercase" }}>
        {currentSong.title}
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 20 }}>
        {currentSong.artist}
      </div>
      
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <button onClick={handlePrev} disabled={currentIdx === 0} style={{ 
          background: "none", border: "none", color: currentIdx === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", 
          cursor: currentIdx === 0 ? "not-allowed" : "pointer", padding: 8, minWidth: 40, minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 20L9 12l10-8v16zM5 19h2V5H5v14z" />
          </svg>
        </button>
        <button onClick={handleTogglePlay} style={{ 
          background: "none", border: "none", color: "#fff", cursor: "pointer", 
          padding: 8, minWidth: 40, minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button onClick={handleNext} disabled={currentIdx === totalSongs - 1} style={{ 
          background: "none", border: "none", color: currentIdx === totalSongs - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", 
          cursor: currentIdx === totalSongs - 1 ? "not-allowed" : "pointer", padding: 8, minWidth: 40, minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4l10 8-10 8V4zm14 15h-2V5h2v14z" />
          </svg>
        </button>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 9, color: "rgba(255,255,255,0.5)", fontVariantNumeric: "tabular-nums" }}>
        <span>{formatTime(currentTime)}</span>
        <div 
          ref={progressLineRef} 
          onPointerDown={handlePointerDown} 
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ flex: 1, height: 24, display: "flex", alignItems: "center", cursor: "pointer", touchAction: "none" }}
        >
          <div style={{ width: "100%", height: 2, background: "rgba(255,255,255,0.1)", position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, background: "#fff", width: `${progress * 100}%`, pointerEvents: "none" }} />
            <div style={{ position: "absolute", left: `${progress * 100}%`, top: "50%", transform: "translate(-50%, -50%)", width: 4, height: 4, borderRadius: "50%", background: "#fff", pointerEvents: "none" }} />
          </div>
        </div>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

export default function BlackholeHUD({ starCount, activeClusterLabel, playback, onStop, showHint, empty, announcement, engine, tracks }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* Inject keyframe for the pulse dot animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes musicBlackholePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      ` }} />
      {/* Title — extremely restrained */}
      <div style={{
        position: "absolute", top: 22, left: 26,
        fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase",
        color: "rgba(120,110,90,0.35)",
      }}>
        Music Universe
      </div>

      {/* Planet Interaction Guide */}
      <div style={{
        position: "absolute", top: 80, left: 24,
        width: 200, padding: "14px 16px",
        background: "rgba(10, 10, 10, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        backdropFilter: "blur(10px)",
        display: "flex", flexDirection: "column", gap: 12,
        userSelect: "none",
        opacity: showHint ? 1 : 0.35,
        transition: "opacity 0.6s ease"
      }}>
        <div style={{
          fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)", fontWeight: 600
        }}>
          Planet Interaction
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 500, letterSpacing: "0.05em" }}>HOVER</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Preview</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 500, letterSpacing: "0.05em" }}>CLICK</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Open</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 500, letterSpacing: "0.05em" }}>DOUBLE</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Play</span>
          </div>
        </div>
      </div>

      {/* Star count */}
      <div style={{
        position: "absolute", top: 22, right: 26,
        fontSize: 9, color: "rgba(100,90,75,0.3)",
        textAlign: "right", letterSpacing: "0.06em",
      }}>
        {empty ? "no stars yet" : `${starCount} star${starCount === 1 ? "" : "s"}${activeClusterLabel ? ` · ${activeClusterLabel}` : ""}`}
      </div>

      {/* Empty state */}
      {empty && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: 24,
        }}>
          <div style={{
            fontSize: 12, color: "rgba(140,130,110,0.35)",
            letterSpacing: "0.05em",
          }}>
            Your universe is waiting for its first memory.
          </div>
        </div>
      )}

      {/* Navigation hint */}
      {showHint && !empty && (
        <div style={{
          position: "absolute", bottom: 64, left: "50%",
          transform: "translateX(-50%)",
          fontSize: 10, color: "rgba(100,90,75,0.25)",
          whiteSpace: "nowrap", letterSpacing: "0.04em",
        }}>
          drag to orbit · scroll to zoom · hover a star
        </div>
      )}

      {/* Mini Player replacing old playback indicator */}
      <MiniPlayer engine={engine} tracks={tracks} />

      {/* Screen reader announcements */}
      <div aria-live="polite" style={srOnly}>
        {announcement}
      </div>
    </div>
  );
}
