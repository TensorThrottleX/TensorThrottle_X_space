# Migration Plan

1. Replace `MediaEngineProvider` with `UniversalMediaController`.
2. Wrap Bottom Navigation in `useMediaSession` (Priority 10).
3. Refactor Anime Universe to use `useMediaSession` (Priority 50).
4. Delete duplicate local Audio/Video engines.
