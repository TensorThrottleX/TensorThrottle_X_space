# Scale Engine — Standalone Viewport Scaling System

A drop-in replacement for `RenderScaler` with added features:
- **Min/Max zoom clamping** — prevents unreadable or oversized UI
- **Device type detection** — mobile/tablet/desktop/ultrawide
- **Desktop lock mode** — optional 1:1 scaling on large screens
- **Context API** — access scale state from any component

---

## Quick Integration

### Step 1: Replace the Import

**Before** (`app/layout.tsx`):
```tsx
import { RenderScaler } from "@/components/layout/RenderScaler"
```

**After**:
```tsx
import { ScaleEngine } from "@/lib/scale-engine"
```

### Step 2: Replace the Component

**Before**:
```tsx
<RenderScaler>
  {children}
</RenderScaler>
```

**After** (with defaults):
```tsx
<ScaleEngine>
  {children}
</ScaleEngine>
```

**After** (with custom config):
```tsx
<ScaleEngine config={{ minScale: 0.4, maxScale: 1.2 }}>
  {children}
</ScaleEngine>
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `designWidth` | number | 1920 | Reference width your UI was designed for |
| `minScale` | number | 0.35 | Minimum zoom (0.35 = 35%) |
| `maxScale` | number | 1.25 | Maximum zoom (1.25 = 125%) |
| `enabled` | boolean | true | Master on/off switch |
| `lockOnDesktop` | boolean | false | Lock to 1.0 scale on desktop |
| `desktopLockThreshold` | number | 1920 | Width for desktop lock |
| `breakpoints.mobile` | number | 480 | Mobile threshold |
| `breakpoints.tablet` | number | 768 | Tablet threshold |
| `breakpoints.ultrawide` | number | 2560 | Ultrawide threshold |

---

## Using Scale Context

Access scale state from any component:

```tsx
import { useScaleContext } from "@/lib/scale-engine"

function MyComponent() {
  const { scale, deviceType, isClamped } = useScaleContext();
  
  return (
    <div>
      Current scale: {scale}
      Device: {deviceType}
      {isClamped && <span>Scale is being limited</span>}
    </div>
  );
}
```

---

## Preset Configurations

```tsx
import { 
  STRICT_SCALE_CONFIG,     // 50%-100% range
  MOBILE_FIRST_CONFIG,     // 1280px design, wider range
  DESKTOP_LOCKED_CONFIG,   // No scaling on desktop
} from "@/lib/scale-engine/config"

<ScaleEngine config={STRICT_SCALE_CONFIG}>
  {children}
</ScaleEngine>
```

---

## What This Module Does NOT Touch

- ❌ Fonts (uses whatever CSS/Tailwind defines)
- ❌ Colors (uses whatever theme system defines)
- ❌ Layout structure (just wraps children)
- ❌ CSS variables (reads `designWidth` from config, not CSS)
- ❌ Tailwind classes (component is class-agnostic)

---

## CSS Data Attributes

The engine exposes data attributes for CSS hooks:

```css
/* Style based on device type */
[data-device="mobile"] .my-element {
  padding: 8px;
}

[data-device="desktop"] .my-element {
  padding: 24px;
}

/* Style based on scale (3 decimal precision) */
[data-scale^="0.3"] .my-element {
  /* When scale is ~0.3xx */
}
```

---

## Testing Externally

To develop this module outside the project:

1. Copy the entire `lib/scale-engine/` folder
2. Create a minimal Next.js app
3. Import and use `ScaleEngine`
4. When ready, copy back and update the import in `layout.tsx`

---

## Rollback

To revert to the original system:

```tsx
// In app/layout.tsx
import { RenderScaler } from "@/components/layout/RenderScaler"

// Replace <ScaleEngine> with <RenderScaler>
```

The original `RenderScaler.tsx` remains untouched.
