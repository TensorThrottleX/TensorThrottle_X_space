import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

// Wraps the star/blackhole content in a group that tilts a few degrees
// toward the cursor — an ambient cue that the scene is genuinely 3D,
// separate from (and much smaller than) the explicit drag-to-orbit
// control. Disabled entirely under prefers-reduced-motion.

export default function ParallaxRig({ reducedMotion, frozen, children }) {
  const groupRef = useRef();
  const target = useRef({ x: 0, y: 0 });
  const { gl } = useThree();
  const frozenRef = useRef(frozen);
  useEffect(() => { frozenRef.current = frozen; }, [frozen]);

  useEffect(() => {
    if (reducedMotion) return;
    const el = gl.domElement;
    const handleMove = (e) => {
      // CARD_FOCUS — ignore pointer input entirely; the tilt stays frozen.
      if (frozenRef.current) return;
      const rect = el.getBoundingClientRect();
      target.current.x = (e.clientX - rect.left) / rect.width - 0.5;
      target.current.y = (e.clientY - rect.top) / rect.height - 0.5;
    };
    el.addEventListener("pointermove", handleMove);
    return () => el.removeEventListener("pointermove", handleMove);
  }, [reducedMotion, gl]);

  useFrame(() => {
    if (!groupRef.current || reducedMotion || frozenRef.current) return;
    const g = groupRef.current;
    g.rotation.y += (target.current.x * 0.06 - g.rotation.y) * 0.03;
    g.rotation.x += (-target.current.y * 0.04 - g.rotation.x) * 0.03;
  });

  return <group ref={groupRef}>{children}</group>;
}
