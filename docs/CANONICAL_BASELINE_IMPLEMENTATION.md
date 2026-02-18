# Canonical Baseline Implementation

## Overview
The following changes have been applied to lock the UI to the Canonical Baseline (1920x1080 @ 100% Zoom).

## 1️⃣ Root Scale Lock
- **`globals.css`**: Updated `html` font-size to `16px`. Removed previous transform scaling logic.
- **`RenderScaler.tsx`**: Gutted to be a simple pass-through container (`.app-root`), removing all JavaScript-based scaling.

## 2️⃣ Structural Layer Separation
- **`MediaProvider.tsx`**: Refactored to render `.bg-video` and `.blur-layer` elements *before* the application content.
- **`globals.css`**: Added fixed positioning and z-index rules for `.bg-video` and `.blur-layer` to ensure stability.

## 3️⃣ Layout & Container Logic
- **`globals.css`**:
  - Defined `.app-root` with `max-width: 1600px` and `padding: 0 64px`.
  - Added `.hero-header` constraint (`max-width: 1050px`).
  - Added `.primary-card` specs (`width: 1200px`, `min-height: 540px`, `padding: 64px 80px`, `rounded-26px`).
- **`HomePageLayout.tsx`**: Applied `.viewport-section` and `.hero-header` classes.
- **`CognitiveDashboard.tsx`**: Applied `.primary-card` class to the main card container and adjusted internal padding to match canonical specs.

## 4️⃣ Component positioning
- **`SystemClock.tsx`**: Positioned at `top-8 right-10`.
- **`TrademarkLogo.tsx`**: Positioned at `bottom-8 left-10`.
- **`Detailed Visuals`**: Confirmed `.sidebar` and fixed elements stability.

## Status
- **Dev Server**: Running successfully.
- **Build**: `npm run build` encountered a Turbopack-related error, but development mode is functional for verification.
