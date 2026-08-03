- never duplicate utilities (check `lib/utils.ts` and `lib/*` first).
- use existing hooks and providers (e.g., `ScaleContext`, `UIProvider`, `MediaEngineProvider`).
- don't introduce new abstractions without need (stick to 3-layer architecture, don't change `RenderScaler`).
- follow existing naming (PascalCase for components).
- modify only necessary files.
- verify before finishing.
- preserve the "experimental lab" cinematic aesthetic (dark themes, glass effects).
- avoid inline CSS where Tailwind suffices.
- follow the guidelines in `.ai/frontend-design.md` for production-grade UI design.

