from PIL import Image, ImageDraw, ImageFont
import os

def generate_logo_v2(output_png, output_ico):
    size = (512, 512)
    # Background must be transparent
    img = Image.new('RGBA', size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Try finding Arial Black first as it's the thicc-est standard font
    font_path = "C:\\Windows\\Fonts\\ariblk.ttf" 
    if not os.path.exists(font_path):
        font_path = "C:\\Windows\\Fonts\\arialbd.ttf"
    
    if not os.path.exists(font_path):
        print("Warning: Standard fonts not found. Using default.")
        font = ImageFont.load_default()
        # Default font is tiny, need scalable
        # If no ttf found, we can't scale default significantly.
        # Let's hope for Arial.
    else:
        # We want the text "TX" to fill the square completely.
        # Start large and shrink if needed, or grow.
        font_size = 400
        # Use a loop to find max font size that fits 512x512
        for s in range(300, 600, 10):
            try:
                font = ImageFont.truetype(font_path, s)
                bbox = draw.textbbox((0, 0), "TX", font=font)
                w = bbox[2] - bbox[0]
                h = bbox[3] - bbox[1]
                if w > 500 or h > 500:
                    font_size = s - 10
                    break
                font_size = s
            except:
                break
        
        font = ImageFont.truetype(font_path, font_size)

    # Orange color
    color = (255, 120, 0, 255) # Bright Orange
    
    # Calculate centering
    bbox = draw.textbbox((0, 0), "TX", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    x = (size[0] - text_w) / 2 - bbox[0]
    y = (size[1] - text_h) / 2 - bbox[1] 
    
    # Draw text
    draw.text((x, y), "TX", font=font, fill=color)
    
    # Save PNG
    img.save(output_png)
    print(f"Saved PNG to {output_png}")
    
    # Save ICO
    # Crucial step: Resize down cleanly for favicon sizes
    # If we just save 512 to ico, browsers might handle resizing poorly.
    # Pillow handles multi-size ICO saving well if passed a list of sized images?
    # Actually Image.save(..., sizes=[...]) does resize internally for ICO format in recent Pillow versions.
    # But explicit resizing is safer for quality control.
    
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(output_ico, sizes=icon_sizes)
    print(f"Saved ICO to {output_ico}")

if __name__ == "__main__":
    generate_logo_v2("public/android-chrome-512x512.png", "public/favicon.ico")
