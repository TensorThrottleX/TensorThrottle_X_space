import { Html } from "@react-three/drei";
import { useRef, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════════════
// LIFE INSTANCE CARD — Black/White Premium Redesign
// ═══════════════════════════════════════════════════════════════════════════

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function LifeInstanceCard({ track, engine, onPointerEnter, onPointerLeave }) {
  const groupRef = useRef();
  const cardRef = useRef();
  const progressLineRef = useRef();
  const { camera } = useThree();
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const songs = track?.songs || [];
  const currentSong = songs[currentIndex];
  const nextSong = songs[currentIndex + 1];
  const prevSong = songs[currentIndex - 1];
  
  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Quote expansion state
  const [quoteExpanded, setQuoteExpanded] = useState(false);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);

  // Initial mount - NO AUTOPLAY
  useEffect(() => {
    setMounted(true);
    let startIdx = 0;
    // Check if the engine is currently playing a song from this category
    if (engine && engine.currentTrack && songs) {
      const playingIdx = songs.findIndex(s => s.id === engine.currentTrack.id);
      if (playingIdx !== -1) {
        startIdx = playingIdx;
      }
    }
    setCurrentIndex(startIdx);
    setQuoteExpanded(false);
  }, [track, songs, engine]);

  // Handle cleanup when unmounting (outside click)
  useEffect(() => {
    return () => {
      // Audio stops immediately on unmount via MusicBlackhole calling engine.stop() in onPointerMissed.
      // We don't stop here because LifeInstanceCard is unmounted on hover-out if not selected.
      // Wait, if hovered, it's just a preview.
    };
  }, []);

  // Subscribe to engine state
  useEffect(() => {
    if (!engine) return;
    
    // Set initial active state based on engine's current state immediately
    if (typeof engine.getState === 'function') {
      const state = engine.getState();
      setIsPlaying(state.track?.id === currentSong?.id && state.status === "playing");
    } else if (engine.currentTrack?.id === currentSong?.id && engine.audio && !engine.audio.paused) {
      setIsPlaying(true);
    }
    
    const unsub = engine.subscribe((state) => {
      const active = state.track?.id === currentSong?.id && state.status === "playing";
      setIsPlaying(active);
      
      // Sync currentIndex if engine plays a different track from our list (e.g. via external double-click)
      if (state.track && state.track.id !== currentSong?.id && state.status === "playing") {
        const foundIdx = songs.findIndex(s => s.id === state.track.id);
        if (foundIdx !== -1 && foundIdx !== currentIndex) {
          setCurrentIndex(foundIdx);
        }
      }
      
      // Auto-advance only if it was playing and reached the end
      if (state.track?.id === currentSong?.id && state.status === "idle" && currentTime > 0 && currentTime >= duration - 0.5) {
        if (currentIndex < songs.length - 1) {
          handleNext(true); // pass true to indicate auto-advance plays the next
        }
      }
    });
    return unsub;
  }, [engine, currentSong, currentIndex, songs, currentTime, duration]);

  // Sync progress
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

  useFrame(() => {
    if (groupRef.current && track && track._livePos) {
      groupRef.current.position.set(track._livePos.x, track._livePos.y, track._livePos.z);
      
      if (cardRef.current) {
        const screenPos = new THREE.Vector3(track._livePos.x, track._livePos.y, track._livePos.z).project(camera);
        const isRightHalf = screenPos.x > 0.1;
        const targetTransform = isRightHalf 
          ? "translate(calc(-100% - 40px), -50%)" 
          : "translate(40px, -50%)";
          
        cardRef.current.style.transform = targetTransform;
      }
    }
  });

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

  if (!track || !currentSong) return null;
  const pos = track._livePos || track.position;

  const handleNext = (autoAdvance = false) => {
    if (currentIndex < songs.length - 1) {
      setIsTransitioning(true);
      const wasPlaying = isPlaying || autoAdvance === true;
      if (engine) engine.stop();
      
      setTimeout(() => {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setProgress(0);
        setCurrentTime(0);
        if (engine && songs[nextIdx].hasAudio) {
          engine.play(songs[nextIdx], !wasPlaying);
        }
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsTransitioning(true);
      const wasPlaying = isPlaying;
      if (engine) engine.stop();
      
      setTimeout(() => {
        const prevIdx = currentIndex - 1;
        setCurrentIndex(prevIdx);
        setProgress(0);
        setCurrentTime(0);
        if (engine && songs[prevIdx].hasAudio) {
          engine.play(songs[prevIdx], !wasPlaying);
        }
        setIsTransitioning(false);
      }, 300);
    } else {
      if (engine && engine.audio) engine.audio.currentTime = 0;
    }
  };
  
  const handleTogglePlay = () => {
    if (!currentSong.hasAudio) return;
    if (engine) engine.togglePlay(currentSong);
  };

  const currentCountStr = String(currentIndex + 1).padStart(2, '0');
  const totalCountStr = String(songs.length).padStart(2, '0');
  
  // Format category name: deep-obsession -> DEEP OBSESSION
  const formattedCategory = (track.lifeInstance || '').replace(/-/g, ' ').toUpperCase();

  return (
    <group ref={groupRef} position={[pos.x, pos.y, pos.z]}>
      <Html center zIndexRange={[100, 0]} style={{ pointerEvents: "none" }}>
        <style>{`
          .life-instance-card {
            width: 540px;
            background: linear-gradient(180deg, #111111, #0a0a0a);
            border: 1px solid #222222;
            border-radius: 4px;
            box-shadow: 0 40px 80px rgba(0,0,0,0.95);
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            user-select: none;
            cursor: default;
            pointer-events: auto;
            opacity: 0;
            transition: opacity 0.4s ease-out, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
            color: #ffffff;
            display: flex;
            flex-direction: column;
            max-height: 70vh;
            max-width: calc(100vw - 32px);
          }
          .life-instance-card.mounted {
            opacity: 1;
          }
          
          .card-inner-scroll {
            padding: 48px 48px 0 48px;
            overflow-y: auto;
            flex: 1;
            scrollbar-width: thin;
            scrollbar-color: #333333 transparent;
          }
          .card-inner-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .card-inner-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .card-inner-scroll::-webkit-scrollbar-thumb {
            background-color: #333333;
            border-radius: 4px;
          }
          .card-inner-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #555555;
          }

          .content-fade {
            transition: opacity 0.25s ease-in-out;
            opacity: 1;
            padding-bottom: 48px;
          }
          .content-fade.fading {
            opacity: 0;
          }
          
          /* Header */
          .label-small {
            font-size: 11px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #888888;
            font-weight: 500;
            margin-bottom: 8px;
          }
          .category-title {
            font-size: 18px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #cccccc;
            margin-bottom: 32px;
          }

          /* Identity */
          .song-identity {
            margin-bottom: 40px;
          }
          .song-title {
            font-size: 32px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.01em;
            margin-bottom: 6px;
            line-height: 1.1;
            text-transform: uppercase;
          }
          .song-artist {
            font-size: 15px;
            color: #888888;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .divider {
            width: 100%;
            height: 1px;
            background: #222222;
            margin-bottom: 40px;
          }

          /* Quote */
          .quote-text {
            font-size: 20px;
            color: #ffffff;
            font-style: italic;
            font-family: 'Georgia', serif;
            line-height: 1.4;
            font-weight: 400;
            white-space: pre-wrap;
          }
          .quote-text:not(.expanded) {
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .read-more-btn {
            background: none;
            border: none;
            color: #666666;
            font-size: 11px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            cursor: pointer;
            padding: 8px 0;
            margin-bottom: 32px;
          }
          .read-more-btn:hover {
            color: #ffffff;
          }

          /* Memory */
          .section-label {
            font-size: 11px;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            color: #666666;
            margin-bottom: 12px;
            font-weight: 600;
          }
          .memory-text {
            font-size: 15px;
            color: #bbbbbb;
            line-height: 1.6;
            margin-bottom: 40px;
            font-weight: 400;
          }

          /* Compact Player */
          .player-section {
            padding: 24px 32px;
            background: #0a0a0a;
            border-top: 1px solid #222222;
            flex-shrink: 0;
          }
          
          .player-top-row {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            position: relative;
          }
          
          .track-counter {
            position: absolute;
            left: 0;
            font-size: 11px;
            color: #666666;
            letter-spacing: 0.1em;
          }

          .player-controls {
            display: flex;
            align-items: center;
            gap: 24px;
          }
          .ctrl-btn {
            background: none;
            border: none;
            color: #666666;
            cursor: pointer;
            padding: 12px;
            min-width: 44px;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
          }
          .ctrl-btn:hover:not(:disabled) {
            color: #ffffff;
          }
          .ctrl-btn:disabled {
            opacity: 0.2;
            cursor: not-allowed;
          }

          .progress-bar-container {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
            font-size: 10px;
            color: #666666;
            letter-spacing: 0.05em;
            font-variant-numeric: tabular-nums;
          }
          
          .progress-track-hitbox {
            flex: 1;
            height: 20px;
            display: flex;
            align-items: center;
            cursor: pointer;
          }
          
          .progress-track {
            width: 100%;
            height: 2px;
            background: #222222;
            position: relative;
          }
          
          .progress-fill {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            background: #ffffff;
            pointer-events: none;
          }
          
          .progress-thumb {
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 6px;
            height: 6px;
            background: #ffffff;
            border-radius: 50%;
            pointer-events: none;
          }

          .audio-warning {
            display: inline-block;
            margin-top: 16px;
            padding: 4px 8px;
            border: 1px solid #333333;
            font-size: 10px;
            letter-spacing: 0.1em;
            color: #888888;
            text-transform: uppercase;
          }
        `}</style>
        
        {/* Stop propagation on pointer events to prevent outside click from closing the card */}
        <div 
          className={`life-instance-card ${mounted ? 'mounted' : ''}`}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          <div className="card-inner-scroll">
            {/* Header */}
            <div className="label-small">LIFE INSTANCE</div>
            <div className="category-title">{formattedCategory}</div>

            <div className={`content-fade ${isTransitioning ? 'fading' : ''}`}>
              {/* Identity */}
              <div className="song-identity">
                <div className="song-title">{currentSong.title || <span style={{color: '#444'}}>UNTITLED</span>}</div>
                <div className="song-artist">{currentSong.artist || <span style={{color: '#444'}}>UNKNOWN ARTIST</span>}</div>
                {!currentSong.hasAudio && (
                  <div className="audio-warning">Audio Unavailable</div>
                )}
              </div>
              
              <div className="divider" />

              {/* Hard-hitting line */}
              {currentSong.hardHittingLine && (
                <div>
                  <div className={`quote-text ${quoteExpanded ? 'expanded' : ''}`}>
                    “{currentSong.hardHittingLine}”
                  </div>
                  {currentSong.hardHittingLine.length > 120 && (
                    <button className="read-more-btn" onClick={() => setQuoteExpanded(!quoteExpanded)}>
                      {quoteExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                  {(!currentSong.hardHittingLine || currentSong.hardHittingLine.length <= 120) && (
                    <div style={{ marginBottom: 40 }} />
                  )}
                </div>
              )}

              {/* Memory */}
              {currentSong.memory && (
                <div>
                  <div className="section-label">THE MOMENT</div>
                  <div className="memory-text">
                    {currentSong.memory}
                  </div>
                </div>
              )}
              
              {currentSong.whyThisLine && (
                <div>
                  <div className="section-label">WHY THIS LINE</div>
                  <div className="memory-text">
                    {currentSong.whyThisLine}
                  </div>
                </div>
              )}
              
              <div style={{ height: 24 }} />
            </div>
          </div>

          {/* Compact Player Section */}
          <div className="player-section">
            
            <div className="player-top-row">
              <div className="track-counter">{currentCountStr} / {totalCountStr}</div>
              
              <div className="player-controls">
                <button className="ctrl-btn" onClick={handlePrev} disabled={!prevSong}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 20L9 12l10-8v16zM5 19h2V5H5v14z" />
                  </svg>
                </button>
                <button className="ctrl-btn" onClick={togglePlay} disabled={!currentSong.hasAudio} style={{ color: isPlaying ? '#ffffff' : '#666666' }}>
                  {isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <button className="ctrl-btn" onClick={handleNext} disabled={!nextSong}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 4l10 8-10 8V4zm14 15h-2V5h2v14z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="progress-bar-container" style={{ marginBottom: 0 }}>
              <span>{formatTime(currentTime)}</span>
              <div 
                className="progress-track-hitbox" 
                ref={progressLineRef} 
                onPointerDown={handlePointerDown} 
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{ touchAction: "none" }}
              >
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
                  <div className="progress-thumb" style={{ left: `${progress * 100}%` }} />
                </div>
              </div>
              <span>{formatTime(duration)}</span>
            </div>
            
          </div>
        </div>
      </Html>
    </group>
  );
}
