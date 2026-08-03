# Frontend Design Conventions & Guidelines

Adhere to these rules to generate production-grade, distinctive UI interfaces and avoid generic AI design patterns.

## 1. Visual Identity & Aesthetic Risk
- **Single Aesthetic Risk**: Choose exactly **one bold visual choice** per feature (e.g., card-shuffling physics, D3 hierarchy tree, live-updating telemetry streams) and execute it with high precision. Keep surrounding layout elements minimal, clean, and disciplined.
- **Experimental Lab Aesthetic**: Maintain the core theme of the project: dark theme emphasis, glassmorphism/blur overlays, and high-contrast neon accents (like cyan and purple).
- **Aesthetic Refinement**: Before completing any implementation, review and remove one redundant visual accent (divider, shadow, or hover effect) to keep the layout crisp.

## 2. Typography
- **Display Typography**: Use `Playfair Display` (serif) for primary hero titles and section headers, paired with intentional stroke weights and tracking/kerning.
- **Body & Captions**: Use a clean, sans-serif face (`Inter` or system-fallback) set to strict type scaling, weights, and lines.
- **Utility & Data**: Use monospace typeface for telemetry data, logs, system clocks, and console/terminal elements.

## 3. Structure & Layout
- **No Decorative Markers**: Do not use numbered lists, bullets, or decorative dividers (e.g., `01 / 02 / 03`) unless they encode chronological order or sequential process steps.
- **Bento Grid Alignment**: Rely on structured grid layouts (like the 12-column Bento layout) for complex information dashboards, aligning content-heavy elements to the left and live systems monitoring/telemetry to the right.

## 4. Motion & Interactivity
- **Orchestrated Animations**: Focus on single, high-impact page load reveals and scroll-triggered drawing animations (like S-curves) rather than scattered hover effects.
- **Physics**: Use spring physics (`stiffness: 200-300`, `damping: 25-30`) for interactive elements like the deck cards and sliding capsule indicators.
- **Reduced Motion**: Always respect user motion preferences by bypassing transition/view-transition animators if `prefers-reduced-motion` is active.

## 5. Copywriting
- **User-Centric Language**: Name controls by what the user understands and controls (e.g., "Notification Preferences" rather than "Webhook Configs").
- **Action-Oriented Verbs**: Use active verbs for buttons and actions ("Save Changes" instead of "Submit").
- **Actionable Errors**: Treat failure and empty states as invites to take action. Explain what went wrong and how to fix it cleanly.
