# Visual Guide: Experimental Portfolio Interface

## Screen Layout

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  ┌─ BACKGROUND LAYER ─────────────────────────────────────────┐   │
│  │ Full-screen cinematic video (or dark gradient fallback)    │   │
│  │ Muted, looped, subtle atmospheric motion                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌─ OVERLAY LAYER ────────────────────────────────────────────┐   │
│  │ Dark translucent (bg-black/40)                            │   │
│  │ Subtle blur effect (backdrop-blur-sm)                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  ┌─ CONTENT LAYER (Relative Z-10) ───────────────────────────┐   │
│  │                                                            │   │
│  │  ┌────────────────────┐  ┌──────────────────────────────┐ │   │
│  │  │  NAVIGATION PANEL  │  │    CONTENT PANEL            │ │   │
│  │  │  (Left, fixed)     │  │    (Center, scrollable)     │ │   │
│  │  │                    │  │                             │ │   │
│  │  │  ⌂ Home           │  │  ┌──────────────────────────┐│ │   │
│  │  │  ≡ Feed           │  │  │  Title                   ││ │   │
│  │  │  ◆ Projects       │  │  │  Subtitle / Date         ││ │   │
│  │  │  ◈ Experiments    │  │  ├──────────────────────────┤│ │   │
│  │  │                    │  │  │                          ││ │   │
│  │  │  Glass effect      │  │  │  Content (scrolls)      ││ │   │
│  │  │  Backdrop blur     │  │  │                          ││ │   │
│  │  │  Semi-transparent  │  │  │  - Feed items or        ││ │   │
│  │  │                    │  │  │  - Full post or         ││ │   │
│  │  │                    │  │  │  - Static content       ││ │   │
│  │  │                    │  │  │                          ││ │   │
│  │  └────────────────────┘  │  └──────────────────────────┘│ │   │
│  │                                                            │   │
│  │  Glass effect on both panels                             │   │
│  │  Rounded corners (lg, 2xl)                               │   │
│  │  Drop shadows for depth                                  │   │
│  │                                                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

Full viewport: 100vw × 100vh
No page scrolling (overflow: hidden on body)
Only internal panel scrolling (max-height: 90vh)
```

## Navigation Panel Structure

```
┌─────────────────────────┐
│                         │
│  ⌂                      │
│  Home                   │  ← Icon + Label (responsive)
│                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─     │  ← Active indicator (dot)
│                         │
│  ≡                      │
│  Feed                   │  ← Hover: bg-white/10, text brightens
│                         │
│                         │
│  ◆                      │
│  Projects               │
│                         │
│                         │
│  ◈                      │
│  Experiments            │
│                         │
│                         │
│  Glass background       │
│  rounded-2xl            │
│  px-4 py-6              │
│  gap-2                  │
│                         │
└─────────────────────────┘

Each switch:
- 48px width (flex-col items-center)
- Icon: text-xl, opacity-75
- Label: text-xs, opacity-0 (hidden on mobile/hover)
- Hover: bg-white/10, text-white
- Active: bg-white/20, border-l indicator
```

## Content Panel Structure

```
┌──────────────────────────────────────┐
│ ┌─ HEADER (Optional) ──────────────┐ │
│ │                                  │ │
│ │ Title (text-3xl/4xl font-bold)  │ │
│ │ Subtitle (text-base gray-300)   │ │
│ │                                  │ │
│ │ border-b border-white/10         │ │
│ │ px-6 py-6 sm:px-8 sm:py-8       │ │
│ └──────────────────────────────────┘ │
│ ┌─ SCROLLABLE BODY ────────────────┐ │
│ │                                  │ │
│ │ Content area (flex-1, overflow-y)│ │
│ │                                  │ │
│ │ - Feed items with dividers       │ │
│ │ - Full post content              │ │
│ │ - Static sections                │ │
│ │ - Comments section               │ │
│ │                                  │ │
│ │ Custom scrollbar:                │ │
│ │ scrollbar-thin                   │ │
│ │ scrollbar-thumb-white/20         │ │
│ │                                  │ │
│ └──────────────────────────────────┘ │
│                                       │
│ max-w-3xl (48rem)                    │
│ max-h-[90vh] (90vh height)           │
│ rounded-3xl                          │
│ bg-white/5                           │
│ border border-white/10               │
│ shadow-2xl                           │
│ backdrop-blur-2xl                    │
│ backdrop-saturate-200                │
└──────────────────────────────────────┘

Responsive:
- Mobile: w-full (95vw with px-4)
- Desktop: max-w-3xl (48rem)
```

## Feed Timeline Layout

```
┌─ POST 1 ─────────────────────────────┐
│                                       │
│ Title (text-xl/2xl font-bold white)  │
│                                       │
│ Excerpt (line-clamp-2 gray-300)      │
│                                       │
│ Date • 3 comments •  Category         │
│ (text-xs gray-500)                    │
│                                       │
│ Hover: bg-white/5, text lightens      │
├─────────────────────────────────────── ← divide-y divide-white/10
│ POST 2 ─────────────────────────────┐
│                                       │
│ Title                                 │
│ Excerpt                               │
│ Date • Comments • Category            │
│                                       │
├──────────────────────────────────────┤
│ POST 3                                │
│ ...                                   │
└───────────────────────────────────────┘
│                                       │
│ ┌─ LOAD MORE AREA ──────────────────┐ ← Sentinel for IntersectionObserver
│ │                                   │
│ │ Loading spinner OR Load button    │
│ │                                   │
│ │ On scroll near bottom: auto-load  │
│ └───────────────────────────────────┘
│                                       │
│ "No more posts" (end indicator)      │
└───────────────────────────────────────┘

Each post:
- px-4 py-6 hover:bg-white/5
- Space between dividers: 6px border
- Smooth transitions on hover
```

## Color Hierarchy

```
TEXT COLORS:
┌─────────────────────────────────────┐
│ Primary:      text-white            │  Headings, important
│ Secondary:    text-gray-300         │  Body text
│ Tertiary:     text-gray-400         │  Metadata, subtle
│ Muted:        text-gray-500         │  Disabled, very subtle
│                                      │
│ Accent:       text-red-400          │  Errors
│ Success:      text-green-400        │  Positive
└─────────────────────────────────────┘

BACKGROUND COLORS:
┌─────────────────────────────────────┐
│ Primary:      bg-black              │  Main background
│ Panel:        bg-white/5            │  Content containers
│ Card:         bg-white/10           │  Hover states
│ Interactive:  bg-white/20           │  Buttons, active
│ Hover:        bg-white/30           │  Button hover
│                                      │
│ Border:       border-white/10       │  Subtle divisions
│ Focus:        border-white/40       │  Input focus
└─────────────────────────────────────┘

GLASS EFFECTS:
┌─────────────────────────────────────┐
│ Light:        backdrop-blur-lg      │  Subtle
│ Medium:       backdrop-blur-xl      │  Normal
│ Heavy:        backdrop-blur-2xl     │  Strong
│                                      │
│ Saturation:   backdrop-saturate-150 │  Enhance colors
│ All elements: white-based opacity   │  Consistency
└─────────────────────────────────────┘
```

## Mobile Responsive Breakdowns

### Mobile (< 768px)
```
┌─ Full Screen ─────────────────────┐
│                                    │
│ ┌─ BACKGROUND ──────────────────┐ │
│ │ Video or gradient              │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌─ OVERLAY ───────────────────────┐ │
│ │ Black/40 + blur                │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌─ CONTENT ───────────────────────┐ │
│ │                                │ │
│ │  Navigation at top?  Or hidden? │ │
│ │  (Depends on implementation)   │ │
│ │                                │ │
│ │ ┌──────────────────────────┐   │ │
│ │ │ Content Panel            │   │ │
│ │ │ Full width (95vw)        │   │ │
│ │ │                          │   │ │
│ │ │ Title (text-2xl/3xl)    │   │ │
│ │ │ Subtitle                │   │ │
│ │ │ ───────────────────    │   │ │
│ │ │ Content (scrolls)      │   │ │
│ │ │                        │   │ │
│ │ └──────────────────────────┘   │ │
│ │                                │ │
│ │ Navigation panel still visible  │ │
│ │ Icons only, labels hidden      │ │
│ │                                │ │
│ └────────────────────────────────┘ │
│                                    │
└────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
Similar to mobile, but:
- Slightly more padding
- Labels appear on nav hover
- text-3xl for main titles
```

### Desktop (1024px+)
```
┌──────────────────────────────────────────────┐
│                                              │
│ ┌─ NAV (Icons+Labels) ┐ ┌─ CONTENT (wide) ┐ │
│ │ ⌂ Home              │ │ Title (text-4xl) │ │
│ │ ≡ Feed              │ │ Subtitle         │ │
│ │ ◆ Projects          │ │ ───────────────  │ │
│ │ ◈ Experiments       │ │ Content scrolls  │ │
│ │                     │ │                  │ │
│ └─────────────────────┘ └──────────────────┘ │
│                                              │
└──────────────────────────────────────────────┘

Full experience:
- Navigation labels always visible
- Content panel at max-width
- Larger hover effects
- Full glass effect visibility
```

## Interaction States

### Button States
```
DEFAULT:        bg-white/20 text-white
HOVER:          bg-white/30 text-white
ACTIVE:         bg-white/40
DISABLED:       opacity-50 cursor-not-allowed

INPUTS (text/textarea):
DEFAULT:        bg-white/5 border-white/20 text-white
FOCUS:          border-white/40 ring (implicit)
DISABLED:       opacity-50

LINKS:
DEFAULT:        text-gray-400
HOVER:          text-white transition-colors
ACTIVE:         text-white (from pathname)
```

### Navigation States
```
INACTIVE:       text-gray-300 bg-transparent
HOVER:          text-white bg-white/10
ACTIVE:         text-white bg-white/20 (indicator dot)

INDICATOR:      Small white dot on left edge
                Only shows when active
                Smooth transition
```

### Loading States
```
SPINNER:        h-4 w-4 rounded-full
                border-2 border-gray-500 border-t-white
                animate-spin

TEXT:           "Loading..." or "Posting..."
                text-gray-400
                Opacity 75%
```

## Spacing Reference

```
Core Padding:   px-4 py-6 (mobile)
                px-6 py-6 (tablet)
                px-8 py-8 (desktop)

Panel Gap:      gap-6 (primary sections)
                gap-4 (secondary)
                gap-2 (tight)

Line Heights:   leading-relaxed (1.625) for body
                Default for headings (1.2)

Component Spacing:
- Between posts: divide-y divide-white/10
- Between sections: space-y-6
- Within sections: space-y-3
```

## Typography Scale

```
h1: text-3xl sm:text-4xl font-bold white
h2: text-2xl font-semibold white
h3: text-xl font-semibold white/gray-100
h4: text-lg font-semibold gray-100

Body: text-base gray-300
Small: text-sm gray-400
Tiny: text-xs gray-500

All with -webkit-font-smoothing: antialiased
```

---

This visual guide shows the exact layout, colors, and responsive behavior of the experimental portfolio interface. Every element is intentionally placed and themed for the dark, focused lab aesthetic.
