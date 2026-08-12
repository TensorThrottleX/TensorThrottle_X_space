import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export function CinematicIntro({ onComplete }: { onComplete?: () => void }) {
  const [stage, setStage] = useState(0);
  const [visible, setVisible] = useState(false); // Initially false to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Run only on client
    // const hasSeen = localStorage.getItem("anime-universe-intro-seen");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setVisible(false);
      onComplete?.();
    } else {
      setVisible(true);
    }
    setMounted(true);
  }, [onComplete]);

  useEffect(() => {
    if (!mounted || !visible) return;

    const t1 = setTimeout(() => setStage(1), 400);   // "ANIME UNIVERSE"
    const t2 = setTimeout(() => setStage(2), 1200);  // "Worlds we never lived in."
    const t3 = setTimeout(() => setStage(3), 2000);  // "Characters we never met."
    const t4 = setTimeout(() => setStage(4), 2800);  // "Yet somehow, they changed us."
    const t5 = setTimeout(() => setStage(5), 3700);  // "And stayed with us."
    const t6 = setTimeout(() => setStage(6), 5000);  // "ENTER THE UNIVERSE"
    
    // 6.5s - Overlay begins fading away
    const t7 = setTimeout(() => setStage(7), 6500);
    
    // 7.5s - Anime Universe returns completely
    const t8 = setTimeout(() => {
      setVisible(false);
      if (typeof window !== 'undefined') {
        // localStorage.setItem("anime-universe-intro-seen", "true");
      }
      onComplete?.();
    }, 7500);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      clearTimeout(t5); clearTimeout(t6); clearTimeout(t7); clearTimeout(t8);
    };
  }, [mounted, visible, onComplete]);

  if (!mounted || !visible) return null;

  const isFadingOut = stage === 7;

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      pointerEvents: isFadingOut ? "none" : "auto",
      background: "rgba(0, 0, 0, 0.65)",
      backdropFilter: isFadingOut ? "blur(0px)" : "blur(14px)",
      WebkitBackdropFilter: isFadingOut ? "blur(0px)" : "blur(14px)",
      opacity: isFadingOut ? 0 : 1,
      transition: "opacity 1s cubic-bezier(0.25, 0.1, 0.25, 1), backdrop-filter 1s cubic-bezier(0.25, 0.1, 0.25, 1), -webkit-backdrop-filter 1s cubic-bezier(0.25, 0.1, 0.25, 1)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      textAlign: "center",
      color: "#ffffff",
      padding: "0 24px"
    }}>
      <div style={{
        opacity: stage >= 1 ? 0.6 : 0,
        transform: stage >= 1 ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 1.2s ease, transform 1.2s ease",
        fontSize: "12px",
        letterSpacing: "0.25em",
        fontWeight: 500,
        textTransform: "uppercase",
        marginBottom: "40px"
      }}>
        ANIME UNIVERSE
      </div>

      <div style={{
        fontSize: "min(24px, 6vw)",
        fontWeight: 400,
        letterSpacing: "0.01em",
        lineHeight: 1.6,
        marginBottom: "64px",
        color: "#f5f5f5",
        maxWidth: "600px",
        display: "flex",
        flexDirection: "column",
        gap: "4px"
      }}>
        <div style={{
          opacity: stage >= 2 ? 1 : 0,
          transform: stage >= 2 ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 1.2s ease, transform 1.2s ease"
        }}>
          Worlds we never lived in.
        </div>
        <div style={{
          opacity: stage >= 3 ? 1 : 0,
          transform: stage >= 3 ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 1.2s ease, transform 1.2s ease"
        }}>
          Characters we never met.
        </div>
        <div style={{
          opacity: stage >= 4 ? 1 : 0,
          transform: stage >= 4 ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 1.2s ease, transform 1.2s ease"
        }}>
          Yet somehow, they changed us.
        </div>
        <div style={{
          opacity: stage >= 5 ? 1 : 0,
          transform: stage >= 5 ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 1.2s ease, transform 1.2s ease"
        }}>
          And stayed with us.
        </div>
      </div>

      <div style={{
        opacity: stage >= 6 ? 0.4 : 0,
        transform: stage >= 6 ? "translateY(0)" : "translateY(4px)",
        transition: "opacity 1.5s ease, transform 1.5s ease",
        fontSize: "10px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        fontWeight: 500
      }}>
        ENTER THE UNIVERSE
      </div>
    </div>,
    document.body
  );
}
