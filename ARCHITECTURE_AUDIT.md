# TensorThrottle X — Architectural Reconciliation & Final Audit Report

This document serves as the formal engineering audit and reconciliation report for the TensorThrottle X platform. It details the unified architecture that synchronizes the Feed, Discussion System, Activity Engine (Pulse), and Anime Universe into a single, cohesive operating ecosystem.

---

## 1. Current Architecture (Pre-Reconciliation)
Historically, subsystems operated independently:
*   **DiscussionPanel:** Tightly coupled to the `LabPostCard`. It only opened in the context of a single post (`postSlug`) and lacked global awareness.
*   **DiscussionEntry:** Acted merely as a static routing button (`/feed/discussions`) in the header, unaware of live comment counts or active conversations.
*   **Pulse Activity:** Handled platform-wide events but visually blurred the lines between a "platform update" and a "user discussion reply".
*   **Anime Universe:** Featured a strong scrolling environment, but risked fragmenting into bespoke rendering paths for different anime content.

## 2. Final Architecture (Unified Ecosystem)
The final architecture establishes strict boundaries and a single source of truth:
*   **Centralized Discussion Store:** Replaces localized states. A global `DiscussionStore` tracks active threads, the currently focused post, and global optimistic counts.
*   **Dual-Entry Discussion Panel:** The `DiscussionPanel` is now a singleton. It supports two modes:
    *   *Thread Mode:* Opened via a Feed Card, displaying a specific conversation.
    *   *Global Mode:* Opened via the Header Discussion Entry, displaying recent active conversations. Selecting one switches to Thread Mode and auto-scrolls the Feed to the target post.
*   **Data-Driven Anime Pipeline:** The Anime Universe uses a single, reusable `Story Template`. All sections (Hero, Perspective, Insights, Journey, Quotes, Moments, Continuation) are conditionally rendered purely from normalized JSON data. No hardcoded React pages exist for specific anime.
*   **Strict Activity Separation:** The Activity Engine (Pulse) exclusively handles platform-level events (e.g., "New Post", "Universe Expanded"). Discussion replies and moderation events are routed strictly through the Discussion system.

---

## 3. Component Hierarchy
The component tree reflects the single-source-of-truth philosophy, sharing instances rather than duplicating them:

```text
AppStartupGate (Hydration Safety)
 └── HomePageLayout
      ├── Header (Global Navigation)
      │    ├── DiscussionEntry (Subscribes to global discussion counts & badges)
      │    └── PulseBell (Subscribes to Activity Engine read-state)
      │
      ├── Feed (Primary Interaction Surface)
      │    ├── LabFeed (Cursor-based infinite scroll)
      │    │    └── LabPostCard (Subscribes to optimistic 💬 count)
      │    └── Navigation Utilities
      │
      └── Global Portals
           └── DiscussionPanel (Singleton via DiscussionStore)
                ├── Global View (Recent Discussions Feed)
                └── Thread View (ThreadedDiscussion.tsx)
```

## 4. State Ownership
To prevent layout thrashing and duplicate network requests, state ownership is strictly defined:

*   **Server State (Supabase / API):** The ultimate source of truth for comment counts, views, moderation statuses, and activity events. Cached via ISR (60s TTL).
*   **Discussion Store (Zustand):** Owns `panelOpen`, `viewMode`, `selectedPostSlug`, `unreadDiscussions`, and `optimisticCounts`.
*   **Activity Store (Local / IndexedDB):** Owns the `read-state` for Pulse platform notifications.
*   **Feed State (React):** Owns UI pagination cursors and IntersectionObserver logic.
*   **Anime Renderer:** Owns scroll-driven progress values (`useScrollProgress`) and visual filtering.

---

## 5. Data Flow
Interactions originate on the client, validate on the server, and cascade state down to all subscribers without full page reloads:

1.  **Action:** User submits a reply in the `DiscussionPanel`.
2.  **API Validation:** `/api/comments` enforces rate limiting, executes risk scoring (moderation), and upserts to Supabase.
3.  **State Mutation:** The `DiscussionStore` increments the `optimisticCounts[postSlug]` and appends the comment to the live thread.
4.  **Re-render Cascade:** 
    *   `DiscussionPanel` animates the new reply.
    *   `LabPostCard` instantly updates its `💬` count.
    *   `DiscussionEntry` in the header increments the active discussion badge.

## 6. Synchronization Flow
Synchronization ensures no stale state exists across the platform:
*   **Deletion/Moderation:** If a comment is soft-deleted or shadow-banned, the global store updates immediately. The `LabPostCard` count drops, the Panel shows a placeholder, and the Header badge adjusts.
*   **Feed-to-Panel:** Clicking a Feed card's comment icon passes the `slug` to the `DiscussionStore`, opening the panel focused on that post.
*   **Panel-to-Feed:** Clicking a recent discussion from the Header's Global Mode triggers a smooth scroll event on the Feed background, aligning the spatial context before switching the Panel to Thread Mode.

## 7. Activity Flow (Pulse)
Pulse is the engine for systemic updates.
*   **Normalization:** The Activity Engine polls multiple publishers (Notion API for posts, Filesystem parsing for Universe updates) and normalizes them into a standard `Activity` schema.
*   **Auto-discovery:** Adding a new folder (e.g., `public/media/universe/music/data`) automatically produces a Pulse event without touching UI code.
*   **Presentation:** Rendered via the `ActivityPanel` and the `PulseBell`. Read state is persisted anonymously via `localStorage`.

## 8. Discussion Flow
Discussion is the engine for user conversations.
*   **Isolation:** The Discussion system does not pollute Pulse. 
*   **Threading:** Managed by `buildCommentTree`. Massive threads use a virtualized slice threshold (`VIRTUAL_THRESHOLD = 80`) to ensure 60fps scrolling within the panel.

## 9. Anime Rendering Pipeline
The Anime Universe demonstrates robust data-driven design:
*   **Single Template:** `AnimeManuscript.tsx` and `Stage.tsx` act as universal containers.
*   **Conditional Rendering:** Every section checks for data presence. If `anime.definingMoments` is absent, the section gracefully collapses without leaving awkward DOM gaps.
*   **Progressive Atmosphere:** Scroll progress (`useScrollProgress`) dictates the environment blur, vignette, and carousel scaling, ensuring a cinematic transition from "Discovery" (Carousel) to "Reading" (Manuscript).

---

## 10. Performance Audit
*   **Network:** Zero duplicate fetches. `DiscussionPanel` only queries `/api/comments` upon genuine focus. Feed ISR eliminates database load for anonymous readers.
*   **DOM:** Virtualized discussion rendering prevents layout thrashing. The Anime environment uses CSS custom properties (`--env-blur`, `--reading-opacity`) to bypass React re-renders for 60fps animations.
*   **Code Splitting:** Heavy moderation and database libraries are kept out of client bundles. 

## 11. Accessibility Audit
*   **Focus Management:** The `DiscussionPanel` enforces a focus trap. Closing via `Esc` restores focus to the original Feed card or Header button.
*   **Screen Readers:** Live counts (`💬 24`) use `aria-live="polite"`. Status badges use visually hidden text (`aria-label="12 active discussions"`).
*   **Reduced Motion:** Framer Motion respects `useReducedMotion()`, swapping spring physics for simple opacity fades where required.

## 12. Regression Audit
*   *Risk:* Multiple panel instances conflicting. *Resolved:* Singleton Zustand store.
*   *Risk:* Pulse and Discussion competing. *Resolved:* Strict domain separation.
*   *Risk:* Layout thrashing on massive threads. *Resolved:* Virtualization limits.
*   *Risk:* Stale Feed counts. *Resolved:* Global `optimisticCounts` map overrides server cache during active sessions.

## 13. Architectural Risks
*   **Supabase Dependency:** The system employs a "fail-soft" design. If DB environment variables are missing, `lib/supabase.ts` degrades gracefully rather than crashing the Next.js runtime. Counts default to 0.
*   **In-Memory Rate Limiting:** Sufficient for single-instance Vercel deployments, but if scaled horizontally to multiple edge regions, a Redis-backed rate limiter (e.g., Upstash) will be necessary.

## 14. Future Scalability
*   **Realtime Integration:** The `DiscussionStore` is designed to support WebSockets. Supabase Realtime subscriptions can be injected directly into the store to power live typing indicators and cross-client updates without rewriting any UI components.
*   **New Universes:** Extending the platform (e.g., `Secret Lab`) requires zero new architecture. New sections simply dispatch `Activity` events and `DiscussionStore.openPanel(slug)` calls.

## 15. Remaining Improvements
While the architecture is robust and production-ready, the following minor enhancements are recommended for subsequent milestones:
1.  **Image Attachment Support:** Implement the layout adjustments in `AnimeManuscript.tsx` to support optional inline images beside high-value reflections.
2.  **Telemetry:** Add anonymous analytics tracking for "Time Spent Reading" on specific Anime Universe JSON documents to evaluate content engagement.
3.  **Redis Rate Limiting:** As mentioned in Section 13, upgrade the in-memory limiter for horizontal scaling resilience. 

---
*End of Report.*
