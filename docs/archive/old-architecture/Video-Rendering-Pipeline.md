# Video Rendering Pipeline

The Video Rendering Pipeline (formerly SmartVideo) is a resilient wrapper around the HTML5 `<video>` element. It handles:
- Resolution Guard (downscaling via CSS transforms on low-tier hardware)
- Orientation detection (via `useVideoOrientation` and MP4 atoms)
- Cinematic Filtering (CSS `filter` injection)
