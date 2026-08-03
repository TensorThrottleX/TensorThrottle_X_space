Major Folders:
- `app/`: Next.js App Router (pages, APIs, layout).
- `components/`:
  - `layout/`: Skeletons, Sidebars, Scalers (RenderScaler).
  - `dashboard/`: Home widgets, Bento grid, System Clock.
  - `content/`: Notion feeds, Post cards, Comment system.
  - `visuals/`: D3 Tree (`HorizontalTree`), Terminal (`InteractiveHome`).
  - `providers/`: React Contexts (UI, Media).
  - `forms/`: Support messaging.
  - `ui/`: Radix primitives.
- `lib/`: Business logic & Clients.
  - `scale-engine/`: Viewport scaling math.
  - `notion.ts`, `supabase.ts`: DB clients.
  - `moderation.ts`, `scrutiny.ts`: Content validation.
- `docs/`: Manual project documentation.

Relationships & Dependency Direction:
- `app/` -> `components/` -> `lib/` -> External APIs (Notion, Supabase, Resend).
- UI relies on `components/providers/` for global state (Theme, Media, Scale).

Diagram (3-Layer Architecture):
Layer 1 (Background) -> MediaProvider (Video/Gradient)
Layer 2 (Overlay) -> LabContainer (Dimming)
Layer 3 (Content) -> LabNavigation (Left), ContentPanel (Center), RightFloatingBar (Right)
