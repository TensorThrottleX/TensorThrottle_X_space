# Background Media Setup Guide (v3 Hardened)

## Quick Setup

The experimental portfolio interface uses a centralized **Media Engine** that automatically discovers and manages atmospheric backgrounds and ambient sounds from dedicated folders.

## Folder Structure (The Media Engine)

All deterministic external media must be placed within the `/public/media/` directory:

-   **/public/media/videos/** — Background video loops (.mp4, .webm)
-   **/public/media/music/** — Ambient background sounds (.mp3, .wav)
-   **/public/media/brand/** — Logos, favicons, and profile images

## Video Asset Requirements

### File Specifications
-   **Format**: MP4 (H.264), WebM (VP9)
-   **Primary Location**: `/public/media/videos/default-background.mp4`
-   **Dimensions**: 1920×1080 (16:9 aspect ratio)
-   **Duration**: 5-15 seconds (seamless loops)
-   **File Size**: Keep under 10MB for fast loading.

### Installation Steps
1.  **Drop your video** into `/public/media/videos/`.
2.  The system automatically detects it and adds it to the **Custom Mode Cycle**.
3.  Filename formatting rule: `my-cool-video.mp4` becomes `MY COOL VIDEO` in the UI tooltip.

## Ambient Audio Requirements

### File Specifications
-   **Format**: MP3, WAV
-   **Location**: `/public/media/music/`
-   **Behavior**: Start muted by default; user-activated via the Custom Mode toggle.

## Brand Asset Management

To ensure central control and zero-failure updates, avoid hardcoding image paths. Use the dedicated brand folder:

-   **Logo**: `/media/brand/logo.png`
-   **Favicon**: `/media/brand/favicon.ico`
-   **Profile**: `/media/brand/profile.jpg`
-   **CTA Assets**: `/media/brand/bmc-logo.svg`

## Failure Containment

If the folders are empty or missing:
1.  **Videos**: Falls back to a cinematic Dark Gradient or Black Background.
2.  **Audio**: Silently remains muted.
3.  **UI**: No runtime crashes; components gracefully degrade to base styles.

## Performance Optimization (FFmpeg)

Compress videos before deployment to ensure GPU stability:

```bash
# Optimized for web playback
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 28 -an media/videos/background.mp4
```

*Note: The -an flag removes audio from the video track if you intend to use the Ambient Audio Engine instead.*
