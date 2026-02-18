# 🔷 COMPLETE WEBSITE ARCHITECTURE — IMPLEMENTATION PLAN

## Status Legend
- ✅ **EXISTS** — Already implemented and functional
- 🔧 **REFINE** — Exists but needs modification to match spec
- 🆕 **BUILD** — Needs to be created from scratch
- ⚠️ **BLOCKED** — Depends on external service/config

---

## 📊 AUDIT SUMMARY

| Area | Total Items | ✅ Exists | 🔧 Refine | 🆕 Build |
|------|-----------|---------|---------|---------|
| Global Rules | 8 | 6 | 2 | 0 |
| Global Elements | 7 | 6 | 1 | 0 |
| Left Sidebar | 7 | 6 | 1 | 0 |
| Right Sidebar | 5 | 5 | 0 | 0 |
| Home Page | 12 | 10 | 2 | 0 |
| Feed Page | 8 | 6 | 1 | 1 |
| Projects Page | 4 | 4 | 0 | 0 |
| Experiment Page | 3 | 2 | 0 | 1 |
| Support Page | 6 | 6 | 0 | 0 |
| Support Backend | 6 | 6 | 0 | 0 |
| Core State Model | 9 | 8 | 1 | 0 |
| Platform Guarantees | 10 | 9 | 1 | 0 |

---

## 🔷 1. GLOBAL RULES

| # | Requirement | Status | File(s) | Notes |
|---|-------------|--------|---------|-------|
| 1 | Canonical 100% zoom baseline | ✅ | `globals.css`, `RenderScaler.tsx` | 1920px design width locked in RenderScaler with transform scaling |
| 2 | Stable 90–110% scaling | ✅ | `RenderScaler.tsx` | Scale computed from `clientWidth / 1920` — handles zoom range |
| 3 | No layout collapse | ✅ | `RenderScaler.tsx` | Fixed 1920px inner width prevents reflow |
| 4 | No sidebar stacking | ✅ | `LabNavigation.tsx`, `RightFloatingBar.tsx` | Both use `position: fixed` |
| 5 | GPU-only animations | 🔧 | Various | Most use Framer Motion (GPU via `transform`/`opacity`), but some CSS transitions use `top`/`left` — needs audit |
| 6 | No full page reload | ✅ | Next.js App Router | Client-side navigation via `useRouter().push()` |
| 7 | Component isolation | ✅ | Provider pattern | `UIProvider` + `MediaEngineProvider` isolate state |
| 8 | Clean state management | 🔧 | `UIProvider.tsx` | Mapping needed: spec uses `activeRoute`, `themeMode`, etc. — current uses `uiMode`, `renderMode`, `mainView` |

---

## 🔷 2. GLOBAL ELEMENTS (ALL PAGES)

### Global Clock ✅
**File:** `components/dashboard/SystemClock.tsx`
| Feature | Status | Notes |
|---------|--------|-------|
| Fixed top-right | ✅ | `fixed top-8 right-10 z-[300]` |
| HH:MM:SS format | ✅ | `formatTime()` with padStart |
| Updates every second | ✅ | `setInterval(() => setTime(new Date()), 1000)` |
| Independent render | ✅ | Own component, own state |
| Glass rectangle style | ✅ | `bg-black/80 backdrop-blur-md` with border |
| No layout shift | ✅ | `pointer-events-none`, fixed position |

### Global Background Engine ✅
**File:** `components/providers/MediaProvider.tsx`
| Feature | Status | Notes |
|---------|--------|-------|
| Absolute layer | ✅ | `.bg-video` and `.blur-layer` are `position: fixed; z-index: -10` |
| Black theme | ✅ | `videoState.index === -1` → black background |
| White theme | ✅ | `videoState.index === -2` → white overlay |
| Default video (autoplay muted loop) | ✅ | `<video autoPlay loop playsInline muted>` |
| Custom video (auto-loaded) | ✅ | `updateVideoSource(idx)` from `/api/media` |
| Smooth fade transitions | ✅ | `transition-opacity duration-1000` on video |
| No reflow | 🔧 | Video layer is fixed, but `blur-layer` could use `will-change: opacity` for GPU |

---

## 🔷 3. LEFT FLOATING SIDEBAR (ALL PAGES)

**File:** `components/layout/LabNavigation.tsx`

| Feature | Status | Notes |
|---------|--------|-------|
| Fixed vertical floating | ✅ | Fixed position in component |
| Constant width | ✅ | Fixed pixel width |
| Active route highlight | ✅ | `isActive(href)` with `pathname.startsWith()` |
| Smooth transitions | ✅ | CSS transitions on hover/active |
| Navigation items | ✅ | Home, Feed, Thoughts, Projects, Experiments, Manifold |
| Theme Switch (Cycle Logic) | ✅ | `handleModeToggle()` cycles through `normal → bright → dark → custom` |
| Custom video button | 🔧 | `handleNextBackground()` exists but spec wants a separate button with tooltip — currently integrated into cycling |

### Navigation Mapping
| Spec Route | Current Route | Status |
|------------|--------------|--------|
| Home | `/` | ✅ |
| Feed | `/feed` | ✅ |
| Projects | `/category/projects` | ✅ |
| Experiment | `/category/experiments` | ✅ |

---

## 🔷 4. RIGHT FLOATING SIDEBAR (ALL PAGES)

**File:** `components/layout/RightFloatingBar.tsx`

| Feature | Status | Notes |
|---------|--------|-------|
| X (Twitter) | ✅ | Custom `XIcon` SVG component |
| GitHub | ✅ | External link |
| Support/Message | ✅ | Internal routing → `MsgView` |
| Buy Me a Coffee | ✅ | External link to BMC |
| Hover glow + scale | ✅ | CSS transition + hover effects |
| Open new tab (external) | ✅ | `target="_blank" rel="noopener noreferrer"` |
| Support routes internally | ✅ | `isInternal: true, view: 'msg'` → `setMainView('msg')` |

---

## 🔷 5. HOME PAGE

**Files:** `HomePageLayout.tsx`, `CognitiveDashboard.tsx`, `InteractiveHome.tsx`, `InteractiveTree.tsx`, `HorizontalTree.tsx`

### Hero ✅
| Feature | Status | Notes |
|---------|--------|-------|
| Bold system heading | ✅ | "TENSOR THROTTLE X" — `text-h1 font-black` |
| Large centered title | ✅ | `.hero-header` with `text-align: center` |

### Dynamic Island ✅
| Feature | Status | Notes |
|---------|--------|-------|
| Three-toggle pill | ✅ | PURPOSE / ABOUT / QUOTE — spring animated slider |
| Smooth slider | ✅ | `motion.div` with `type: "spring", stiffness: 300, damping: 30` |
| No layout shift | ✅ | Fixed width buttons (110px each), absolute positioned slider |

### Section 1 & 2 (Purpose / About) ✅
| Feature | Status | Notes |
|---------|--------|-------|
| Card stack layout | ✅ | `CognitiveDashboard.tsx` with sub-cards and cover card |
| Cover card on top | ✅ | Main card with sub-cards underneath |
| Under cards for depth | ✅ | Layered card system with offsets |
| Tree Button | ✅ | Bottom-right button triggers tree mode |
| Tree blur + scale | ✅ | `uiMode === 'tree'` triggers blur + pointer-events-none |
| Animated Tree | ✅ | D3.js via `HorizontalTree.tsx` — center root, left-right branching |

### Tree Animation Details
| Feature | Status | Notes |
|---------|--------|-------|
| Center root node | ✅ | D3 tree layout centered |
| Left-right branching | ✅ | Horizontal tree orientation |
| Sequential node fade | ✅ | `lib/tree-animations.ts` |
| Edge draw animation | ✅ | D3 path transitions |
| Click node expands children | 🔧 | Basic expand exists, could be smoother |
| Smooth retract close | ✅ | Collapse animation on close |
| No grid mutation | ✅ | Tree renders in overlay, doesn't affect layout |

### Section 3 (Statements / Quotes) ✅
| Feature | Status | Notes |
|---------|--------|-------|
| Single large card | ✅ | Quote card in `CognitiveDashboard.tsx` |
| 10+ looping statements | ✅ | `SYSTEM_QUOTES[]` with 10+ entries including Uchiha, Seneca, Marcus Aurelius quotes |
| Timed fade-up animation | 🔧 | Exists but timing could be tuned for auto-cycling |
| Fixed card size | ✅ | Card uses `primary-card` sizing |
| No layout shift | ✅ | AnimatePresence with `mode="wait"` |

### Terminal ✅
**File:** `InteractiveHome.tsx`
| Feature | Status | Notes |
|---------|--------|-------|
| Mac-style collapsed block | ✅ | Terminal bar above footer |
| Hover border glow | ✅ | Glow effect on hover (prev. conversation) |
| Click → expand smoothly | ✅ | `isTerminalOpen` state toggle |
| Background dim overlay | ✅ | `LabContainer` dims to `opacity-40` |
| Command: help | ✅ | Lists available commands |
| Command: route navigation | ✅ | `handleNavigation()` → router.push |
| Command: theme switch | ✅ | Theme commands in `executeCommand()` |
| Command: clear | ✅ | Clears terminal history |
| Click outside → collapse | ✅ | `handleClickOutside()` listener |

---

## 🔷 6. FEED PAGE

**Files:** `app/feed/page.tsx`, `ContentPanel.tsx`, `LabFeed.tsx`, `Feed.tsx`, `PostCard.tsx`

| Feature | Status | Notes |
|---------|--------|-------|
| Center rectangular container | ✅ | `ContentPanel` — `max-w-2xl rounded-2xl` with glass effect |
| Independent vertical scroll | ✅ | `overflow-y-auto` on content area, `h-[85vh]` container |
| Page does not scroll | ✅ | Only internal panel scrolls |
| Notion API data source | ✅ | `getAllPosts()` from `lib/notion.ts` |
| Sorted by latest | ✅ | `timestamp: 'created_time'` sort in Notion query |
| Post card (title, timestamp, preview) | ✅ | `PostCard.tsx` renders all fields |
| Comment toggle | 🔧 | Comments exist on post detail, not as toggle on card |
| Hover lift | ✅ | `hover:scale-[1.02]` on cards |
| Click → `/post/[slug]` | ✅ | Links to post detail page |

### Post Detail Page ✅
**File:** `app/post/[slug]/page.tsx`
| Feature | Status | Notes |
|---------|--------|-------|
| Full Notion content render | ✅ | `renderNotionBlock()` handles all block types |
| Clean formatting | ✅ | Styled headings, code, quotes, lists |
| Comment section below | ✅ | `CommentSection` component |

### Comment System ✅
**File:** `components/content/CommentSection.tsx`
| Feature | Status | Notes |
|---------|--------|-------|
| No likes | ✅ | Comment-only interaction model |
| Flat comment list | ✅ | Simple list, no threading |
| Name required | ✅ | Validated in form |
| Message required | ✅ | Validated in form |
| Word limit | ✅ | `MAX_MESSAGE_LENGTH = 500` |
| Live counter | 🆕 | Character count exists but live word counter could be more visible |

### Moderation ✅
**Files:** `lib/moderation.ts`, `lib/scrutiny.ts`, `CommentSection.tsx`
| Feature | Status | Notes |
|---------|--------|-------|
| Level 1: Clean | ✅ | `severity_1_moderate` patterns |
| Level 2: Flagged | ✅ | `severity_2_high` patterns |
| Level 3: Blocked | ✅ | `severity_3_extreme` patterns + spam detection |
| Bot detection | ✅ | `ClientMetrics` — typing time, KPM, paste/focus events, device hash |
| Server-side authority | ✅ | `moderateComment()` runs server-side |

---

## 🔷 7. PROJECTS PAGE ✅

**File:** `app/category/[slug]/page.tsx` (slug = "projects")

| Feature | Status | Notes |
|---------|--------|-------|
| Card grid layout | ✅ | `CategoryPostCard` rendered in stack |
| Hover lift | ✅ | Hover effects on cards |
| Detail route | ✅ | Links to `/post/[slug]` |
| No layout mutation | ✅ | Consistent layout via `LabContainer` |

---

## 🔷 8. EXPERIMENT PAGE

**File:** `app/category/[slug]/page.tsx` (slug = "experiments")

| Feature | Status | Notes |
|---------|--------|-------|
| Current implementation | ✅ | Same as category page — shows Notion posts |
| Sandbox modules | 🆕 | Spec wants interactive demos — not yet built |
| Layout isolated | ✅ | Uses `LabContainer` isolation |
| No global interference | ✅ | Component-scoped |

**NOTE:** The "Sandbox modules / Interactive demos" would be a new feature addition. Currently the Experiments page just shows Notion-sourced posts like other categories.

---

## 🔷 9. SUPPORT PAGE ✅

**File:** `components/forms/MsgView.tsx`

| Feature | Status | Notes |
|---------|--------|-------|
| Centered card layout | ✅ | Centered form within card |
| Display regulations | ✅ | Protocol agreement shown |
| Agreement checkbox | ✅ | `protocol` boolean required |
| Conditional form reveal | ✅ | Form appears after agreement |
| Name (required) | ✅ | `identity` field validated |
| Email (optional) | ✅ | Optional email field |
| Message (required) | ✅ | Required with word limit |
| Character limit | ✅ | Enforced in `handleMessageChange` |
| 3-level moderation | ✅ | `analyzeMessage()` from `lib/scrutiny.ts` |
| Block abusive content | ✅ | Profanity patterns block submission |
| Glow send button when valid | ✅ | Conditional styling on send button |
| Smooth success feedback | ✅ | AnimatePresence success state |

---

## 🔷 10. SUPPORT BACKEND PIPELINE ✅

**File:** `app/api/contact/route.ts`

| Feature | Status | Notes |
|---------|--------|-------|
| Serverless route: `/api/contact` | ✅ | POST handler in Next.js API route |
| Server validation | ✅ | `validateInput()` — Layer A |
| Security checks | ✅ | `securityCheck()` — honeypot, rate limit, link density, profanity |
| Resend email API (primary) | ✅ | `sendViaResend()` |
| SendGrid fallback | ✅ | `sendViaSendGrid()` — multi-relay strategy |
| Delivered to Proton | ✅ | `EMAIL_RECIPIENT = tensorthrottleX@proton.me` |
| Domain-independent | ✅ | Uses relay services, no custom domain required |
| Environment variables secured | ✅ | `.env.local` + `.gitignore` |

---

## 🔷 11. CORE STATE MODEL

**File:** `components/providers/UIProvider.tsx`

| Spec Variable | Current Variable | Status | Notes |
|---------------|-----------------|--------|-------|
| `activeRoute` | (derived from `pathname`) | ✅ | `usePathname()` in LabNavigation |
| `themeMode` | `renderMode` | ✅ | `'normal' \| 'bright' \| 'dark' \| 'custom'` |
| `customThemeActive` | (derived) | ✅ | `renderMode === 'custom'` |
| `dynamicIslandActive` | (derived) | ✅ | Visible when `mainView === 'dashboard' && uiMode === 'default'` |
| `treeModeActive` | `uiMode === 'tree'` | ✅ | `type UIMode = 'default' \| 'tree'` |
| `statementIndex` | (local state in Dashboard) | ✅ | Quote cycling index |
| `terminalExpanded` | `isTerminalOpen` | ✅ | Boolean state |
| `moderationLevel` | (computed at API level) | ✅ | Not persisted — computed per request |
| Persist only theme settings | 🔧 | `MediaProvider` persists via `localStorage('media_engine_v3')` — persists theme + video/sound index |

---

## 🔷 12. PLATFORM GUARANTEES

| Guarantee | Status | Notes |
|-----------|--------|-------|
| Floating dual sidebars | ✅ | `LabNavigation` + `RightFloatingBar` |
| Global clock everywhere | ✅ | In root `layout.tsx` |
| Dynamic home logic | ✅ | Purpose/About/Quote toggle |
| Animated horizontal knowledge tree | ✅ | D3.js `HorizontalTree.tsx` |
| Notion-powered feed | ✅ | `lib/notion.ts` → Notion SDK |
| Comment-only interaction | ✅ | No likes, comments only |
| Moderated support system | ✅ | 3-level moderation |
| Domain-safe email pipeline | ✅ | Resend + SendGrid relay |
| Stable zoom system | ✅ | `RenderScaler.tsx` transform-based |
| Scalable modular architecture | 🔧 | Good structure with `components/{layout,dashboard,content,visuals,forms,providers}` — some components (CognitiveDashboard at 734 lines) could be further modularized

---

## 🎯 GAPS TO ADDRESS (PRIORITY ORDER)

### Priority 1 — Minor Refinements (No new features)
1. **GPU Animation Audit** — Ensure all CSS transitions use `transform`/`opacity` only, add `will-change` hints where needed
2. **Right Sidebar on All Pages** — Currently only rendered on Home page (`HomePageLayout`), needs to be in root layout or all page layouts
3. **Comment Count on Feed Cards** — Add visible comment count indicator with toggle
4. **Quote Auto-Cycling** — Ensure timed rotation in Statements section

### Priority 2 — Structural Alignment
5. **State Model Naming** — Consider aligning state variable names to spec (`renderMode` → `themeMode`, etc.) — cosmetic but improves documentation alignment

### Priority 3 — New Features (If desired)
6. **Experiment Sandbox** — Build interactive demo modules for `/category/experiments`
7. **Live Word Counter** — More prominent word count display in comment form

---

## 📁 FILE MAP

```
app/
├── layout.tsx              — Root layout (UIProvider, MediaProvider, RenderScaler, SystemClock)
├── page.tsx                — Home (renders HomePageLayout)
├── globals.css             — Design system (themes, cards, scrollbars, moderation UI)
├── feed/page.tsx           — Feed page (Notion posts)
├── post/[slug]/page.tsx    — Post detail (Notion blocks + comments)
├── category/[slug]/page.tsx — Category archive (Projects, Experiments, Thoughts, Manifold)
├── about/page.tsx          — About page
└── api/
    ├── contact/route.ts    — Email pipeline (Resend + SendGrid)
    ├── comments/route.ts   — Comment API (Supabase)
    ├── posts/route.ts      — Paginated posts API
    ├── post/route.ts       — Single post API
    ├── media/route.ts      — Media asset discovery
    └── email-health/route.ts — Email system health check

components/
├── layout/
│   ├── HomePageLayout.tsx  — Home page controller
│   ├── LabContainer.tsx    — Three-layer container
│   ├── LabNavigation.tsx   — Left floating sidebar
│   ├── RightFloatingBar.tsx — Right floating sidebar
│   ├── ContentPanel.tsx    — Scrollable content panel
│   ├── RenderScaler.tsx    — 1920px zoom scaler
│   ├── GlobalFooter.tsx    — Footer
│   └── Navbar.tsx          — (Legacy/unused)
├── dashboard/
│   ├── CognitiveDashboard.tsx — Main dashboard (cards, tree, quotes)
│   ├── HomeBento.tsx       — Bento grid component
│   ├── SystemClock.tsx     — Global clock
│   └── TrademarkLogo.tsx   — Logo
├── content/
│   ├── Feed.tsx            — Feed component
│   ├── LabFeed.tsx         — Lab-styled feed
│   ├── PostCard.tsx        — Feed post card
│   ├── LabPostCard.tsx     — Lab post card (modal)
│   ├── CategoryPostCard.tsx — Category post card
│   ├── CommentSection.tsx  — Comment form + list
│   └── NotionBlockRenderer.tsx — Notion blocks renderer
├── visuals/
│   ├── InteractiveHome.tsx — Terminal component
│   ├── InteractiveTree.tsx — Tree container/controller
│   ├── HorizontalTree.tsx  — D3 horizontal tree visualization
│   └── HeroTitle.tsx       — Hero title component
├── forms/
│   └── MsgView.tsx         — Support/message form
├── providers/
│   ├── UIProvider.tsx      — UI state context
│   ├── MediaProvider.tsx   — Media engine (video, audio, themes)
│   └── theme-provider.tsx  — Next-themes wrapper
└── ui/                     — Radix UI primitives (51 components)

lib/
├── notion.ts               — Notion SDK integration
├── supabase.ts             — Supabase client + comments
├── moderation.ts           — 3-level moderation engine
├── scrutiny.ts             — Client-side content analysis
├── fingerprint.ts          — Browser fingerprinting
├── tree-animations.ts      — D3 tree animation helpers
├── utils.ts                — Utility functions
└── email/                  — Email pipeline utilities
```
