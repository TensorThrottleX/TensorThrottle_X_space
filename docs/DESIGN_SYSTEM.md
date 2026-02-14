# Experimental Portfolio Design System

## 🎯 Design Philosophy

This portfolio is not a traditional blog layout. It's a **personal experimental lab** with floating content panels over a cinematic motion background. The interface prioritizes clarity, intentionality, and minimalism over decorative elements.

## 🧱 Three-Layer Architecture

### Layer 1: Cinematic Background
- **Full-screen video** fills the entire viewport
- **Muted, looped, subtle** motion that feels environmental, not hero-like
- Creates atmospheric depth without competing with content

### Layer 2: Dark Overlay
- **Darkens the background** for text readability
- **Subtle blur effect** enhances depth and focus
- Creates visual hierarchy that directs attention to content

### Layer 3: Floating Application
- **Navigation panel** on the left (fixed, vertical)
- **Content panel** in the center (scrollable internally)
- Both float above the background with glass effects

## 🧭 Navigation Pattern

### LabNavigation Component
- **Location**: Left side, vertically centered
- **Style**: Glass effect with backdrop blur and saturate
- **Controls**: 4 switches (Home, Feed, Projects, Experiments)
- **Visual**: Icons with labels, active indicator, hover states
- **Responsive**: Icons visible on mobile, labels appear on hover or lg screens

### Navigation Switches
```
⌂  Home          → /
≡  Feed          → /?view=feed
◆  Projects      → /category/projects
◈  Experiments   → /category/experiments
```

Each switch is a control—minimalist, intentional, engineered.

## 🪟 Content Panel

### LabContainer Component
- **Full viewport** background with video and overlay
- **Relative positioning** for layers
- **Flexbox layout** for navigation and content alignment

### ContentPanel Component
- **Centered layout** using flexbox
- **Max-width: 3xl** (48rem) for readability
- **Max-height: 90vh** with internal overflow scroll
- **Glass effect**: 
  - `bg-white/5` (translucent white)
  - `backdrop-blur-2xl` (strong blur)
  - `backdrop-saturate-200` (enhance colors)
  - `border border-white/10` (subtle border)
  - `shadow-2xl` (depth)
  - `rounded-3xl` (prominent rounded corners)

### Content Areas
- **Header section**: Title and subtitle with border separator
- **Scrollable body**: Internal scrolling only, never page scroll
- **Custom scrollbar**: Thin, semi-transparent white

## 📰 Feed Components

### LabFeed Component
- **Timeline-style layout** with vertical post stacking
- **Dividers**: `divide-y divide-white/10`
- **Infinite scroll**: IntersectionObserver + manual load button
- **Load state**: Animated spinner during auto-load
- **Error handling**: Retry button with clear messaging
- **End indicator**: "No more posts" when complete

### LabPostCard Component
- **Minimal information**:
  - Post title
  - Excerpt (2 lines max)
  - Publication date
  - Comment count (if > 0)
  - Category tag (right-aligned)
- **Interactions**:
  - Hover background: `hover:bg-white/5`
  - Hover text: slight brightening
  - Smooth transitions: `duration-200`
- **No likes, no clutter**

## 🎨 Color Palette

### Semantic Colors
- **Background**: Pure black (`#000000`)
- **Overlay**: Black with opacity (`bg-black/40`)
- **Text Primary**: White (`#FFFFFF`)
- **Text Secondary**: `text-gray-300` (lighter gray)
- **Text Tertiary**: `text-gray-400` (medium gray)
- **Text Muted**: `text-gray-500` (dimmer gray)
- **Borders**: `border-white/10` (subtle, semi-transparent)
- **Interactive**: `bg-white/20` hover `bg-white/30`
- **Accents**: `bg-white/5` for subtle backgrounds

### Dark Theme Consistency
All components use white-based opacity values on dark backgrounds:
- Interactive elements: `white/20` → `white/30`
- Card backgrounds: `white/5` → `white/10`
- Borders: `white/10`
- Text on dark: Gray scale from 300 (light) to 500 (muted)

## 📱 Responsive Behavior

### Layout Changes
- **Mobile (< md)**: Full-width content panel, navigation icons only
- **Tablet (md - lg)**: Same layout, labels appear on hover
- **Desktop (lg+)**: Labels always visible, navigation feels like control panel

### Panel Sizing
- **Mobile**: 95vw with padding
- **Desktop**: 48rem max-width (3xl)
- **Height**: Always 90vh max with internal scroll

## ✨ Typography

### Font Families
- **Primary**: System stack (`-apple-system, BlinkMacSystemFont, ...`)
- **Smooth rendering**: `-webkit-font-smoothing: antialiased`

### Font Sizes
- **H1 (Titles)**: `text-3xl sm:text-4xl` font-bold
- **H2 (Sections)**: `text-2xl` font-semibold
- **H3 (Subsections)**: `text-xl` font-semibold
- **H4 (Small headers)**: `text-lg` font-semibold
- **Body**: `text-base` (default)
- **Small**: `text-sm` for metadata
- **Tiny**: `text-xs` for timestamps

### Line Heights
- **Headings**: Default (1.2)
- **Body**: `leading-relaxed` (1.625)

## 🎥 Background Video

### Setup
- Store video as `/public/background-video.mp4`
- Properties:
  - `autoPlay` (required for mute on browsers)
  - `muted` (required for autoplay)
  - `loop` (seamless replay)
  - `playsInline` (mobile support)
  - `object-cover` (fills viewport)

### Fallback
If no video provided, uses gradient:
```
bg-gradient-to-br from-gray-950 via-black to-gray-900
```

## 🔍 Page Patterns

### All Pages Structure
```tsx
<LabContainer videoSrc="/background-video.mp4">
  <LabNavigation />
  <ContentPanel title="..." subtitle="...">
    {/* Page-specific content */}
  </ContentPanel>
</LabContainer>
```

### Pages Implemented
- **Home** (`/`): Feed view of all posts
- **Category** (`/category/[slug]`): Filtered feed by category
- **Post Detail** (`/post/[slug]`): Full post with comments
- **About** (`/about`): Static about page

## 🎭 Visual Effects

### Glass Effect
- Combines backdrop blur and semi-transparent colors
- Creates "floating" sensation
- Used on navigation and content panel

### Transitions
- Smooth hover states: `transition-colors duration-200`
- Opacity changes: `hover:opacity-90`
- No heavy animations—minimal and intentional

### Depth
- Shadows: `shadow-2xl` on main panel
- Layering: Background → Overlay → Content
- Borders create subtle boundaries

## 📋 Component Tree

```
LabContainer
├── Background video or gradient
├── Dark overlay with blur
└── Content Layer (relative z-10)
    ├── LabNavigation
    │   └── Navigation panel with 4 switches
    └── ContentPanel
        ├── Header (title + subtitle)
        └── Scrollable body
            ├── LabFeed (on feed pages)
            │   └── LabPostCard (repeated)
            ├── Post content (on detail pages)
            │   └── CommentSection
            └── Static content (on about page)
```

## 🚀 Production Considerations

### Performance
- ISR caching: 300 seconds (5 min)
- Infinite scroll: Cursor-based pagination
- Images: Lazy loading by default
- Video: Lightweight format (mp4)

### Accessibility
- Semantic HTML everywhere
- Alt text on images
- Sufficient color contrast (white on dark)
- Keyboard navigation support
- Screen reader friendly

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox
- Backdrop filters (with graceful degradation)
- Video autoplay on muted

## 🎯 Design Tone

The interface should feel:
- ✅ **Experimental** — Not traditional, not templated
- ✅ **Clean** — No clutter, no decorative noise
- ✅ **Intentional** — Every element has purpose
- ✅ **Minimal** — Essential only
- ✅ **Engineered** — Precision and clarity
- ❌ **Not** corporate, not blog-like, not decorative

Let the content breathe. Let the design disappear. Let the ideas shine.
