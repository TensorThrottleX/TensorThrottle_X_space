# Current Implementation Status

This document represents the live state of the TensorThrottle X Space repository. It is continuously updated to reflect actual implementation.

## Folder Structure
- `app/`: Next.js App Router endpoints and layouts.
- `components/media/`: Centralized Media Rendering Pipeline and Engines.
- `components/providers/`: Contains `MediaOrchestrator.tsx`.
- `prism-engine/`: 3D Universal Prism implementation for interaction.
- `lib/`: Contains `UniversalAssetRegistry.ts` and utilities.

## Implemented Modules
- **UniversalMediaController**: Fully refactored to `MediaOrchestrator`.
- **BackgroundVideoEngine**: Exists and handles crossfading.
- **VideoRenderingPipeline**: Active. Applies cinematic filters and scales down based on `DeviceProfileDetector`.
- **BackgroundAudioEngine**: Fully centralized and crossfading properly.
- **UniversalAssetRegistry**: Eliminates hardcoded media URLs.

## Completed Refactors
- Replaced `MediaProvider` with `MediaOrchestrator` and priority-based `useMediaSession`.
- Renamed `carousel-engine` to `prism-engine`.
- Fixed React syntax errors in `MobileBottomNav`.
- Centralized all audio logic to avoid overlaps.

## Current Runtime Behaviour
- **Global Background**: Bottom navigation holds a Priority 10 session.
- **Anime Page**: Holds a Priority 50 session. Overrides global background smoothly.
- **Exiting**: Restores Priority 10 background instantly without re-mounting video tags.

## Migration Status
- Migration from V2 to Universal Session-Based Media is **Complete**.

## Known Limitations & Technical Debt
- Some legacy CSS animations still use `top`/`left` instead of `transform`.
- `lucide-react` imports require `@ts-ignore` due to missing declarations for direct path imports.
- Tree Animation could be smoother on collapse.
- Need to build Sandbox modules for the Experiments page.

## Recent Architectural Changes
- Transition to Priority-Based Session Stack.
- Universal Asset Registry implementation.

