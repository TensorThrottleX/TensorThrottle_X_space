# Media Orchestrator Architecture

The Media Orchestrator is the central React Context layer that governs the entire media platform. It maintains a priority-based Map of all active `MediaSession` objects, computes the highest priority session in real-time, and feeds the resulting `AssetPackage` to the underlying hardware engines.

## Responsibilities
- Session lifecycle (registration, updating, destruction)
- Priority stack resolution
- Theme state injection to the HTML root

## Internal Flow
1. Component mounts -> `useMediaSession({ priority: 50 })`
2. Orchestrator adds to internal Map.
3. `useMemo` triggers, sees 50 > 10.
4. Orchestrator passes new URLs to `BackgroundVideoEngine` and `BackgroundAudioEngine`.
