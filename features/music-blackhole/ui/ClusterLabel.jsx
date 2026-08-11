import { Html } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

// Cluster labels should be barely visible — their identity emerges from
// spatial grouping, not from bright labels. Only shown when a track in
// the cluster is selected.
export default function ClusterLabel({ cluster, active, nearby }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current || !cluster) return;
    const [bx, by, bz] = cluster.center;
    // Calculate Keplerian orbit for the cluster center itself
    const radius = Math.sqrt(bx * bx + bz * bz);
    if (radius < 0.1) return; // avoid origin divide
    const initialAngle = Math.atan2(bz, bx);
    const angularSpeed = 10.0 / Math.pow(radius + 2.0, 1.5);
    const currentAngle = initialAngle + state.clock.elapsedTime * angularSpeed;
    
    groupRef.current.position.set(
      Math.cos(currentAngle) * radius,
      by,
      Math.sin(currentAngle) * radius
    );
  });

  if (!active && !nearby) return null;
  return (
    <group ref={groupRef} position={cluster.center}>
      <Html center distanceFactor={20} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            fontSize: 9,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            color: cluster.color,
            opacity: active ? 0.55 : 0.2,
            transition: "opacity 0.5s ease",
          }}
        >
          {cluster.label}
        </div>
      </Html>
    </group>
  );
}
