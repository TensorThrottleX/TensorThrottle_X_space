import { useState, useEffect } from "react";

export function CinematicIntro({ onComplete }: { onComplete?: () => void }) {
  const [stage, setStage] = useState(0);
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (localStorage.getItem("anime-universe-intro-seen")) return false;
    return true;
  });

  useEffect(() => {
    if (!visible) {
      onComplete?.();
      return;
    }

    // Animation timeline
    // 0.0s - Overlay fades in (handled by CSS initial state)
    // 0.5s - "ANIME UNIVERSE"
    const t1 = setTimeout(() => setStage(1), 500);
    // 1.5s - Main statement
    const t2 = setTimeout(() => setStage(2), 1500);
    // 4.5s - ENTER THE UNIVERSE
    const t4 = setTimeout(() => setStage(4), 4500);
    // 5.8s - Fade out
    const t5 = setTimeout(() => setStage(5), 5800);
    
    // 6.6s - Complete
    const t6 = setTimeout(() => {
      setVisible(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem("anime-universe-intro-seen", "true");
      }
      onComplete?.();
    }, 6600); // Wait for the fade out transition (600-900ms)

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
    };
  }, [onComplete, visible]);

  if (!visible) return null;

  const isFadingOut = stage === 5;

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 100,
      pointerEvents: isFadingOut ? "none" : "auto",
      background: "rgba(0, 0, 0, 0.65)",
      backdropFilter: isFadingOut ? "blur(0px) brightness(1) contrast(1)" : "blur(10px) brightness(0.4) contrast(0.8)",
      WebkitBackdropFilter: isFadingOut ? "blur(0px) brightness(1) contrast(1)" : "blur(10px) brightness(0.4) contrast(0.8)",
      opacity: isFadingOut ? 0 : 1,
      transition: "opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), backdrop-filter 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), -webkit-backdrop-filter 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      textAlign: "center",
      color: "#ffffff"
    }}>
      <div style={{
        opacity: stage >= 1 ? 1 : 0,
        transform: stage >= 1 ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 1s ease, transform 1s ease",
        fontSize: 12, letterSpacing: "0.25em",
        color: "rgba(255,255,255,0.4)",
        textTransform: "uppercase",
        marginBottom: 32
      }}>
        ANIME UNIVERSE
      </div>

      <div style={{
        opacity: stage >= 2 ? 1 : 0,
        transform: stage >= 2 ? "translateY(0)" : "translateY(15px)",
        transition: "opacity 1.2s cubic-bezier(0.25, 0.1, 0.25, 1), transform 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)",
        fontSize: 32, fontWeight: 300,
        letterSpacing: "0.02em",
        lineHeight: 1.3,
        marginBottom: 64
      }}>
        Some stories are watched.<br/>
        Others become a part of you.
      </div>

      <div style={{
        opacity: stage >= 4 ? 1 : 0,
        transition: "opacity 1.5s ease",
        fontSize: 10, letterSpacing: "0.2em",
        color: "rgba(255,255,255,0.3)",
        textTransform: "uppercase"
      }}>
        ENTER THE UNIVERSE
      </div>
    </div>
  );
}
