- Core UI & Scaling:
  Purpose: Global layout stability and navigation.
  Main files: `RenderScaler.tsx`, `LabNavigation.tsx`, `LabContainer.tsx`, `ScaleEngine.tsx`.
- Feed/Blog (Notion):
  Purpose: Display notes/experiments.
  Main files: `app/feed/page.tsx`, `app/post/[slug]/page.tsx`, `components/content/LabFeed.tsx`, `NotionBlockRenderer.tsx`.
  Dependencies: `lib/notion.ts`.
- Comments System:
  Purpose: Reader interaction.
  Main files: `CommentSection.tsx`, `app/api/comments/route.ts`.
  Dependencies: `lib/supabase.ts`, `lib/moderation.ts`.
- Interactive Dashboard:
  Purpose: Home page visual showcase.
  Main files: `CognitiveDashboard.tsx`, `InteractiveHome.tsx` (Terminal), `HorizontalTree.tsx` (D3 Tree).
- Message/Support:
  Purpose: Contact form with email relay.
  Main files: `MsgView.tsx`, `app/api/contact/route.ts`.
  Dependencies: `lib/scrutiny.ts`, Resend, SendGrid.
