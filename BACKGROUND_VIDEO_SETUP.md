# Background Video Setup Guide

## Quick Setup

The experimental portfolio interface uses a full-screen background video as the first visual layer. The video should feel **atmospheric, not distracting**—environmental motion that enhances mood without competing with content.

## Video Requirements

### File Specifications
- **Format**: MP4 (H.264 codec)
- **Location**: `/public/background-video.mp4`
- **Dimensions**: 1920×1080 (16:9 aspect ratio minimum)
- **Duration**: 5-15 seconds (loops continuously)
- **File Size**: Keep under 10-15MB for fast loading
- **Properties**: Muted audio (or no audio)

### Video Characteristics
- **Motion**: Subtle, slow, continuous—not jolting or flashy
- **Color**: Dark tones (grays, blacks, deep blues) to maintain contrast with white text
- **Opacity**: Will be darkened by overlay (bg-black/40), so consider brightness
- **Subject**: Abstract, motion graphics, or cinematic footage work well

## Creating a Background Video

### Option 1: Using Existing Footage
1. Download or create a video clip that fits the aesthetic
2. Ensure it's dark-toned to work with the overlay
3. Loop-friendly (seamless loop if possible)

### Option 2: Generate a Simple Gradient Animation
Using FFmpeg to create a subtle moving gradient:

```bash
# Create a 10-second looping gradient animation
ffmpeg -f lavfi -i color=c='#0a0a0a':s=1920x1080:d=10 -pix_fmt yuv420p -c:v libx264 -preset medium -crf 23 background-video.mp4
```

### Option 3: Use a Video Service
- **Pexels Videos**: Free, high-quality stock videos
- **Pixabay**: Free video clips
- **Motion Array**: Paid motion graphics library
- **Envato Elements**: Subscription-based stock footage

Search for: "abstract dark motion", "cinematic background", "minimalist motion", or "looping animation"

## Installation Steps

1. **Prepare your video file** (named `background-video.mp4`)

2. **Place in public directory**:
   ```
   /vercel/share/v0-project/public/background-video.mp4
   ```

3. **No code changes required**—the video is automatically loaded by `LabContainer` component

4. **Test locally**:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` and verify the video appears

## Video Best Practices

### DO ✅
- Keep motion **subtle and smooth**
- Use **dark color palettes** (grays, blacks, deep colors)
- Maintain **consistent playback** (seamless looping)
- Choose **atmospheric mood** (calm, contemplative, experimental)
- Optimize for **fast loading** (compress well)

### DON'T ❌
- Don't use **bright, flashy content** (competes with text)
- Don't include **audio or dialogue** (set to muted always)
- Don't use **jarring transitions** (should be meditative)
- Don't pick **busy patterns** (should feel spacious)
- Don't ignore **file size** (slows down page load)

## Fallback Behavior

If the video fails to load or you don't provide one, the system automatically displays a **dark gradient**:

```css
background: linear-gradient(to bottom right, #111111, #000000, #1a1a1a)
```

This ensures the site remains usable even without video.

## Performance Optimization

### Video Compression
Using FFmpeg to compress while maintaining quality:

```bash
# High quality, smaller file
ffmpeg -i input-video.mp4 -c:v libx264 -preset slow -crf 28 -c:a aac -b:a 128k background-video.mp4

# Fast loading, good quality
ffmpeg -i input-video.mp4 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k background-video.mp4
```

**CRF Scale** (0-51, lower = better quality):
- 18-28: Recommended range
- 23: Balanced quality/file size (default)
- 28: Smaller file, acceptable quality

### Loading Strategy
- Video loads with page
- `preload="metadata"` could be added if needed
- Muted attribute allows autoplay without user interaction
- Looping is seamless

## Testing the Video

1. **Open DevTools** (F12)
2. **Go to Elements** and find the `<video>` tag
3. **Check console** for any loading errors
4. **Test on different devices**:
   - Desktop (Chrome, Firefox, Safari)
   - Mobile (iOS Safari, Android Chrome)
   - Different network speeds (throttle in DevTools)

## Common Issues

### Video Not Playing
- Ensure file exists at `/public/background-video.mp4`
- Check file format (must be MP4)
- Verify file isn't corrupted
- Test video locally with media player

### Jerky/Stuttering Playback
- File may be too large—compress further
- Check system resources
- Try a shorter duration (5 seconds)
- Ensure smooth looping (no keyframes at edges)

### Text Not Readable
- Video may be too bright
- Check overlay darkness (currently `bg-black/40`)
- Consider lightening text colors
- Increase blur effect if needed

### Slow Page Load
- Video file too large (optimize below 10MB)
- Serve from CDN instead of local
- Use video format with better compression
- Consider lazy loading if video is below fold

## Advanced: Custom Video URL

To use a video from an external URL instead of local file:

```tsx
// In LabContainer usage:
<LabContainer videoSrc="https://example.com/videos/background.mp4">
  {/* content */}
</LabContainer>
```

This works with:
- Vercel Blob storage
- Cloudinary
- AWS S3
- Any CDN with CORS headers

## Recommended Resources

### Free Stock Videos
- **Pexels**: https://www.pexels.com/search/video/
- **Pixabay**: https://pixabay.com/videos/
- **Coverr**: https://coverr.co/
- **Mixkit**: https://mixkit.co/free-stock-video/

### Search Terms
- "abstract motion background"
- "dark cinematic loop"
- "minimalist motion graphics"
- "subtle particle effect"
- "moving gradient"

### Tools
- **FFmpeg**: Video compression and conversion
- **HandBrake**: GUI video converter
- **DaVinci Resolve**: Free video editor
- **Blender**: 3D motion graphics

## Next Steps

1. Obtain or create your background video
2. Place it at `/public/background-video.mp4`
3. Test on `http://localhost:3000`
4. Deploy to production
5. Monitor performance and adjust if needed

That's it! The experimental portfolio will now display with a cinematic background, creating the atmosphere of a focused content lab floating in space.
