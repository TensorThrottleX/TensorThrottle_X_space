import { NeuralGlobe } from "@/components/globe/neural-globe"

export default function Home() {
  return (
    <main className="relative h-screen w-full overflow-hidden" style={{ background: "#000000" }}>
      <NeuralGlobe
        width="100%"
        height="100%"
        autoRotate
        enableInteraction
        showParticles
        showConnections
        transparent={false}
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-6 left-6">
          <div
            className="text-xs font-mono tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Neural Intelligence Globe
          </div>
          <h1
            className="text-xl font-bold tracking-tight font-sans mt-1"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Evolution of Intelligence
          </h1>
        </div>

        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-1">
          <p
            className="text-xs font-mono"
            style={{ color: "rgba(255,255,255,0.18)" }}
          >
            Click nodes to activate neural pathways · Double-click to explore · Scroll to zoom
          </p>
        </div>
      </div>
    </main>
  )
}
