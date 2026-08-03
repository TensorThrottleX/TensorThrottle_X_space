# Cylindrical Carousel — Headless Engine + Templates

The exact cylindrical math, damping, and interaction model from the original
demo is preserved untouched. What changed is organization: the engine no
longer knows about "Anime" or "Movies" — pages plug in a dataset and four
asset folders, and the engine just rotates whatever it's handed.

```
src/
├── carousel/              ← the reusable engine (framework: React, logic: framework-agnostic)
│   ├── core/               Geometry, Animator, Renderer, State, Controller, EventEmitter
│   ├── input/               Keyboard, Mouse (wheel), Touch (swipe)
│   ├── components/          <Carousel>, CarouselCard, Navigation, Indicators
│   ├── hooks/                useCarousel, useCarouselInput
│   ├── styles/               carousel.css (generic, theme via CSS vars)
│   ├── types/                Item.ts, Events.ts, Carousel.ts (config)
│   └── utils/                math.ts, easing.ts, interpolation.ts
│
├── media/                 ← resolves + applies per-card assets, scoped to one page
│   ├── AssetResolver.ts     slug -> file paths in covers/videos/audio/metadata
│   ├── PageMediaContext.tsx page-scoped "global" background state
│   └── types.ts
│
├── templates/              ← one folder per page, ONLY data + assets + a thin page file
│   ├── anime/
│   │   ├── data/index.ts     the dataset (id, slug, title, ...)
│   │   ├── covers/           {slug}.jpg, {slug}.thumb.jpg, {slug}.poster.jpg
│   │   ├── videos/           {slug}.mp4
│   │   ├── audio/            {slug}.mp3
│   │   ├── metadata/         {slug}.json (optional, richer per-item data)
│   │   └── AnimePage.tsx      ~20 lines: Carousel + AssetResolver + PageMediaProvider
│   ├── movies/    (same shape)
│   ├── games/     (same shape)
│   ├── music/     (same shape)
│   ├── quotes/    (same shape, no videos/ — quotes have no background video)
│   └── projects/  (same shape, no audio/ — projects have no background audio)
│
└── demo/
    └── App.tsx             mounts one template page for a sanity check
```

## How "front card overwrites the page" actually works

1. `<Carousel>` fires `onActiveChange(item)` whenever a new card settles at
   the front — this is the same event a page always had access to, just
   formalized.
2. The page's `AssetResolver` turns that item's `slug` into concrete file
   paths using a fixed naming convention (`covers/{slug}.jpg`,
   `videos/{slug}.mp4`, `audio/{slug}.mp3`). An item can also set
   `cover` / `backgroundVideo` / `backgroundAudio` directly to bypass the
   convention entirely for that one card.
3. The resolved paths are handed to `applyMedia()` from `PageMediaContext`.
   That function does the "overwrite" — but only inside that page's own
   `<PageMediaProvider>`. It sets `videoRef.current.src`, plays it, swaps the
   audio, and updates the on-screen cover — all through refs that belong to
   *that page's own* `<video>`/`<audio>` elements.

Because the media state lives in ordinary React context (not `window`,
not a module-level singleton), two carousels on two different pages never
interfere with each other, even though they're built from the identical
`<Carousel>` component and identical `AssetResolver` class.

## Adding a new page

1. Copy the `templates/anime/` folder shape.
2. Fill `data/index.ts` with real items (`id` is the only required field).
3. Drop matching files into `covers/`, `videos/`, `audio/`, `metadata/`
   named after each item's `slug`.
4. In the page file, point a new `AssetResolver` at that folder and pass
   `onActiveChange` into `<Carousel events={{ onActiveChange }} />`.

No changes to `carousel/` are ever required to add a page.

## What never changed

- Radius (260), damping (0.095), scale curve (`0.58 + depth*0.44`), opacity
  curve, wheel cooldown (650ms), swipe threshold (38px) — all preserved as
  defaults in `types/Carousel.ts` / `utils/interpolation.ts`, and all
  overridable via the `config` prop without touching engine code.
- The carousel still never plays media, fetches data, or knows what a
  "card" represents — that boundary is enforced by the `media/` layer
  living outside `carousel/` entirely.
