# BMC Profile Image

This folder contains the profile image for the Buy Me Coffee (BMC) support card.

## 📁 File Structure

```
/public/bmc/
  ├── README.md           ← This documentation file
  └── profile.png or      ← Your profile image (PNG preferred)
      profile.jpg         ← Alternative: JPG format
```

**Note**: The component will automatically check for images in this order:
1. `profile.png` (checked first)
2. `profile.jpg` (checked if PNG not found)

## 🖼️ Image Requirements

- **Filename**: Must be named `profile.png` OR `profile.jpg` (case-sensitive)
- **Format**: PNG (preferred) or JPG/JPEG
- **Priority**: If both exist, PNG will be used
- **Aspect Ratio**: 1:1 (square) recommended
- **Recommended Size**: 256x256px or higher for retina displays
- **Max Size**: Keep under 500KB for optimal loading

## 🔄 How to Update

1. Replace the `profile.png` or `profile.jpg` file in this folder with your new image
2. Keep the same filename: `profile.png` (recommended) or `profile.jpg`
3. No code changes required
4. Clear browser cache if needed to see the update immediately

**Format Preference:**
- Use PNG for images with transparency or logos
- Use JPG for photographs
- PNG will be used if both formats exist

## ✨ Features

- **Automatic Detection**: The component automatically detects if the image exists
- **Graceful Fallback**: If no image is found, a subtle translucent circle placeholder is shown
- **No Errors**: No broken image icons or layout issues
- **Theme Aware**: Adapts to Bright/Dark/Cinematic modes automatically

## 📍 Where It Appears

The profile image appears in the top-right corner of the "Support Development" card on the Message/Contact page.

## 🎨 Visual Specifications

- **Shape**: Perfect circle
- **Size**: 56x56px (mobile), 64x64px (desktop)
- **Position**: Top-right corner with subtle spacing
- **Effects**: 
  - Smooth fade-in animation on load
  - Hover scale effect (1.05x zoom)
  - Theme-aware border and shadow
  - Backdrop blur for premium glass effect

## 🚫 What Happens Without an Image

If you remove or don't add a `profile.png` file:
- A soft translucent circle placeholder will appear
- No broken image icon
- No layout shift
- The card remains visually balanced

## 💡 Tips

- Use a high-quality, square image for best results
- Ensure good contrast with both light and dark backgrounds
- Test in both Bright and Dark modes
- Consider using a logo or avatar that represents your brand

---

**Last Updated**: 2026-02-14
