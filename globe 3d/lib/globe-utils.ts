import * as THREE from "three"

export const GLOBE_RADIUS = 2

export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return new THREE.Vector3(x, y, z)
}

export function greatCircleDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * Math.asin(Math.sqrt(a))
}

export interface EvolutionNode {
  id: string
  lat: number
  lon: number
  label: string
  era: string
  description: string
}

export interface GlobeEdge {
  from: string
  to: string
}

export const defaultEvolutionNodes: EvolutionNode[] = [
  {
    id: "primitive",
    lat: 2, lon: 22,
    label: "Primitive Neural Activity",
    era: "~540 Mya",
    description: "First nerve nets emerge in early organisms",
  },
  {
    id: "memory",
    lat: 33, lon: 44,
    label: "Memory Formation",
    era: "~300 Mya",
    description: "Hippocampal circuits enable persistent storage",
  },
  {
    id: "pattern",
    lat: 48, lon: 8,
    label: "Pattern Recognition",
    era: "~2 Mya",
    description: "Visual cortex decodes environmental signals",
  },
  {
    id: "symbolic",
    lat: 22, lon: 78,
    label: "Symbolic Reasoning",
    era: "~70,000 ya",
    description: "Abstract thought enables language and logic",
  },
  {
    id: "language",
    lat: 35, lon: 118,
    label: "Language",
    era: "~50,000 ya",
    description: "Complex communication binds social cognition",
  },
  {
    id: "mathematics",
    lat: 38, lon: 24,
    label: "Mathematics",
    era: "~3,000 ya",
    description: "Formal systems model the structure of reality",
  },
  {
    id: "computing",
    lat: 52, lon: -1,
    label: "Computing",
    era: "1936",
    description: "Turing machines formalise computation",
  },
  {
    id: "machine-learning",
    lat: 41, lon: -74,
    label: "Machine Learning",
    era: "1959",
    description: "Samuel writes the first learning program",
  },
  {
    id: "deep-learning",
    lat: 37, lon: -122,
    label: "Deep Learning",
    era: "2012",
    description: "Neural networks surpass human-level vision",
  },
  {
    id: "reasoning",
    lat: 36, lon: 138,
    label: "Reasoning Models",
    era: "2023",
    description: "Chain-of-thought enables multi-step inference",
  },
  {
    id: "agentic",
    lat: 1, lon: 104,
    label: "Agentic Systems",
    era: "2024",
    description: "Autonomous agents orchestrate tool use and planning",
  },
  {
    id: "autonomous",
    lat: -34, lon: 151,
    label: "Autonomous Intelligence",
    era: "Future",
    description: "Self-directed systems pursue open-ended goals",
  },
]

export const defaultEdges: GlobeEdge[] = [
  { from: "primitive", to: "memory" },
  { from: "memory", to: "pattern" },
  { from: "pattern", to: "symbolic" },
  { from: "symbolic", to: "language" },
  { from: "language", to: "mathematics" },
  { from: "mathematics", to: "computing" },
  { from: "computing", to: "machine-learning" },
  { from: "machine-learning", to: "deep-learning" },
  { from: "deep-learning", to: "reasoning" },
  { from: "reasoning", to: "agentic" },
  { from: "agentic", to: "autonomous" },
  { from: "pattern", to: "mathematics" },
  { from: "language", to: "computing" },
  { from: "memory", to: "symbolic" },
  { from: "computing", to: "deep-learning" },
  { from: "mathematics", to: "machine-learning" },
  { from: "reasoning", to: "autonomous" },
  { from: "agentic", to: "reasoning" },
  { from: "deep-learning", to: "agentic" },
  { from: "machine-learning", to: "reasoning" },
]

export function findConnectedNodes(
  sourceId: string,
  edges: GlobeEdge[]
): string[] {
  const connected = new Set<string>()
  for (const edge of edges) {
    if (edge.from === sourceId) connected.add(edge.to)
    if (edge.to === sourceId) connected.add(edge.from)
  }
  return Array.from(connected)
}

export function propagateNetwork(
  sourceId: string,
  nodes: EvolutionNode[],
  edges: GlobeEdge[],
  maxDepth: number = 3
): { nodeId: string; delay: number; depth: number; fromId: string }[] {
  const result: { nodeId: string; delay: number; depth: number; fromId: string }[] = []
  const visited = new Set<string>([sourceId])
  let currentLayer = [sourceId]
  let depth = 0

  while (currentLayer.length > 0 && depth < maxDepth) {
    const nextLayer: string[] = []
    const layerDelay = 0.4 + depth * 0.9

    for (const nodeId of currentLayer) {
      const connected = findConnectedNodes(nodeId, edges)
      const src = nodes.find((n) => n.id === nodeId)
      const sorted = connected
        .filter((id) => !visited.has(id))
        .sort((a, b) => {
          const nodeA = nodes.find((n) => n.id === a)
          const nodeB = nodes.find((n) => n.id === b)
          if (!nodeA || !nodeB || !src) return 0
          return greatCircleDistance(src.lat, src.lon, nodeA.lat, nodeA.lon) -
            greatCircleDistance(src.lat, src.lon, nodeB.lat, nodeB.lon)
        })

      sorted.forEach((connId, i) => {
        visited.add(connId)
        result.push({
          nodeId: connId,
          delay: layerDelay + i * 0.2,
          depth,
          fromId: nodeId,
        })
        nextLayer.push(connId)
      })
    }

    currentLayer = nextLayer
    depth++
  }

  return result
}
