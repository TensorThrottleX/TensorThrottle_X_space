Major Modules:
- UI Providers (`UIProvider`, `MediaProvider`) <- Depended on by most components.
- `lib/notion.ts` <- Depended on by `app/feed/`, `app/post/`, `app/category/`.
- `lib/supabase.ts` <- Depended on by `app/api/comments/`.
- `lib/moderation.ts` & `scrutiny.ts` <- Depended on by contact/comment APIs.

Circular Dependencies: None likely due to strict layer separation.

High-Risk Modules:
- `RenderScaler.tsx` & `lib/scale-engine/`: Modifying affects global layout zoom math.
- `lib/notion.ts`: Modifying affects all content rendering and fetching logic.
