"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Preload } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { SpaceAtmosphere } from "@/components/layout/SpaceAtmosphere";

import { buildBlackhole, EMPTY_BLACKHOLE } from "../data/musicData";
import { MusicPlaybackEngine, LocalMusicProvider, RemoteApiMusicProvider } from "../audio/musicPlaybackEngine";

import SolarSystem from "../scene/SolarSystem";
import BlackHoleCore from "../scene/BlackHoleCore";
import ParallaxRig from "../scene/ParallaxRig";

import LifeInstanceCard from "../ui/LifeInstanceCard";
import ClusterLabel from "../ui/ClusterLabel";
import BlackholeHUD from "../ui/BlackholeHUD";
import KeyboardStarList from "../ui/KeyboardStarList";
import CinematicIntro from "../ui/CinematicIntro";

// Restrained bloom — accretion disk glows, nothing washes out
function BloomPass({ enableBloom }: { enableBloom: boolean }) {
  if (!enableBloom) return null;
  return (
    // @ts-ignore
    <EffectComposer disableNormalPass>
      <Bloom
        luminanceThreshold={0.55}
        luminanceSmoothing={0.3}
        mipmapBlur
        intensity={0.65}
        radius={0.3}
      />
    </EffectComposer>
  );
}

// ─── Smooth camera focus toward selected track ──────────────────────
// When a track is selected, the OrbitControls target smoothly moves
// toward its position over ~600ms. The camera doesn't teleport — it
// glides. When deselected, target returns to origin (the black hole).

function CameraFocus({ selectedTrack, controlsRef, frozen }: { selectedTrack: any; controlsRef: React.RefObject<any>; frozen: boolean }) {
  const targetVec = useRef(new THREE.Vector3(0, 0, 0));
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const frozenRef = useRef(frozen);
  useEffect(() => { frozenRef.current = frozen; }, [frozen]);

  useFrame(() => {
    // CARD_FOCUS — freeze camera interpolation at its exact current state.
    if (frozenRef.current) return;
    const controls = controlsRef.current;
    if (!controls) return;

    if (selectedTrack) {
      const pos = selectedTrack._livePos || selectedTrack.position;
      // Don't go all the way to the track — stop 70% of the way so the
      // black hole stays visible in background (spec requirement §21)
      targetVec.current.set(pos.x * 0.35, pos.y * 0.35, pos.z * 0.35);
    } else {
      targetVec.current.set(0, 0, 0);
    }

    // Smooth lerp — ~600ms effective transition
    currentTarget.current.lerp(targetVec.current, 0.04);
    controls.target.copy(currentTarget.current);
  });

  return null;
}

interface MusicBlackholeProps {
  tracks?: any[];
  mediaBaseDir?: string;
  apiEndpoint?: string | null;
  enableBloom?: boolean;
}

export default function MusicBlackhole({ 
  tracks: rawTracks = [], 
  mediaBaseDir = "/media/music/", 
  apiEndpoint = null,
  enableBloom = true 
}: MusicBlackholeProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Unified Interaction State
  const [isCursorOverCard, setIsCursorOverCard] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const interactionActive = useMemo(() => {
    return !!hoveredId || !!selectedId || isCursorOverCard || isDragging;
  }, [hoveredId, selectedId, isCursorOverCard, isDragging]);
  const [playback, setPlayback] = useState<{ track: any; status: string }>({ track: null, status: "idle" });
  const [reduceMotion, setReduceMotion] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const controlsRef = useRef<any>(null);

  // Global interaction state machine:
  //   WORLD_ACTIVE — full orbital simulation running
  //   CARD_FOCUS   — a Life Instance Card is open; entire orbital world frozen
  const interactionMode = selectedId ? "CARD_FOCUS" : "WORLD_ACTIVE";
  const cardFocus = interactionMode === "CARD_FOCUS";

  const { tracks, clusters } = useMemo(() => {
    return rawTracks.length > 0 ? buildBlackhole(rawTracks) : EMPTY_BLACKHOLE;
  }, [rawTracks]);

  const engineRef = useRef<MusicPlaybackEngine | null>(null);

  useEffect(() => {
    const providers: any[] = [new LocalMusicProvider({ baseDir: mediaBaseDir })];
    if (apiEndpoint) {
      providers.push(new RemoteApiMusicProvider({ endpoint: apiEndpoint }));
    }
    const engine = new MusicPlaybackEngine({ providers });
    engineRef.current = engine;
    const unsubscribe = engine.subscribe((state: any) => {
      setPlayback(state);
      if (state.status === "error") {
        setAnnouncement("Audio unavailable for this track.");
      } else if (state.status === "playing" && state.track) {
        setAnnouncement(`Playing ${state.track.title} by ${state.track.artist}`);
      }
    });
    return () => {
      unsubscribe();
      engine.dispose();
      engineRef.current = null;
    };
  }, [mediaBaseDir, apiEndpoint]);

  useEffect(() => { setReduceMotion(false); }, []);

  const handleHover = useCallback((track: any) => {
    setHoveredId(track ? track.id : null);
  }, []);

  const handleSelect = useCallback((track: any) => {
    if (!track || !track.lifeInstance) {
      setSelectedId(null);
      return;
    }
    setSelectedId(track.id);
    const firstSong = track.songs?.[0];
    if (firstSong) {
      setAnnouncement(`Selected ${firstSong.title} by ${firstSong.artist}`);
    }
  }, []);



  const handleStop = useCallback(() => { engineRef.current?.stop(); }, []);

  const hoveredTrack = tracks.find((t: any) => t.id === hoveredId) || null;
  const selectedTrack = tracks.find((t: any) => t.id === selectedId) || null;
  const activeClusterLabel = selectedTrack ? selectedTrack.clusterLabel : null;

  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.id = "music-blackhole-portal";
    el.style.cssText = "position:fixed;inset:0;z-index:12;";
    document.body.appendChild(el);
    setPortalContainer(el);
    return () => { el.remove(); };
  }, []);

  const portalContent = portalContainer ? createPortal(
    <>
      <SpaceAtmosphere spaceProgress={1} hideNebula={true} />
      {/* ═══ Full-viewport 3D Canvas — TRANSPARENT VOID ═══ */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Canvas
          onPointerMissed={(e) => {
            // Only trigger if click wasn't on DOM elements layered on top
            if (e.target instanceof HTMLCanvasElement) {
              setSelectedId(null);
              setHoveredId(null);
              // Do NOT stop audio on outside click. Let it persist globally.
            }
          }}
          camera={{ position: [0, 15, 120], fov: 42, near: 0.1, far: 1500 }}
          gl={{ antialias: false, alpha: true }}
          dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1}
          style={{ width: "100%", height: "100%", zIndex: 1 }}
          resize={{ scroll: false }}
        >

          <ParallaxRig reducedMotion={reduceMotion} frozen={cardFocus}>
            <group rotation={[0.4, 0, 0.4]}>
              <BlackHoleCore reducedMotion={reduceMotion} interactionActive={interactionActive} cardFocus={cardFocus} />
                <SolarSystem
                  tracks={tracks}
                  hoveredId={hoveredId}
                  selectedId={selectedId}
                  reducedMotion={reduceMotion}
                  interactionActive={interactionActive}
                  cardFocus={cardFocus}
                  onHover={handleHover}
                  onSelect={(track: any) => { handleSelect(track); }}
                  onDoubleClick={(track: any) => { 
                    handleSelect(track);
                    if (track?.songs?.[0] && engineRef.current) {
                      engineRef.current.play(track.songs[0]);
                    }
                  }}
                />
            </group>
            {(selectedTrack || hoveredTrack) && (
              <LifeInstanceCard 
                track={hoveredTrack && hoveredTrack.id !== selectedId ? hoveredTrack : selectedTrack} 
                engine={engineRef.current}
                onPointerEnter={() => setIsCursorOverCard(true)}
                onPointerLeave={() => setIsCursorOverCard(false)}
              />
            )}
          </ParallaxRig>

          {/* Camera focus follows selected track — frozen while a card is open */}
          <CameraFocus selectedTrack={selectedTrack} controlsRef={controlsRef} frozen={cardFocus} />

          <OrbitControls 
            ref={controlsRef}
            enablePan={false}
            enableZoom={!cardFocus}
            enableRotate={!cardFocus}
            autoRotate={false}
            minDistance={8}
            maxDistance={300}
            zoomSpeed={0.5}
            rotateSpeed={0.3}
            dampingFactor={0.06}
            enableDamping={true}
            onStart={() => setIsDragging(true)}
            onEnd={() => setIsDragging(false)}
          />
          <BloomPass enableBloom={enableBloom} />
          <Preload all />
        </Canvas>
      </div>

      {/* ═══ UI overlay ═══ */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <BlackholeHUD 
            starCount={tracks.length}
            activeClusterLabel={activeClusterLabel}
            playback={playback}
            onStop={handleStop}
            showHint={!selectedId}
            empty={tracks.length === 0}
            announcement={announcement}
            engine={engineRef.current}
            tracks={tracks}
          />
        </div>
        <KeyboardStarList tracks={tracks} selectedId={selectedId} onFocusTrack={cardFocus ? () => {} : handleSelect} />
        
        {/* Cinematic First-Visit Intro */}
        <CinematicIntro onComplete={() => {}} />
      </div>
    </>,
    portalContainer
  ) : null;

  return <>{portalContent}</>;
}
