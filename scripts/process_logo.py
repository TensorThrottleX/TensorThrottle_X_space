from PIL import Image

def process_logo(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    
    # 1. Clean background (ensure white/near-white is transparent)
    # Even if already processed, doing this again doesn't hurt, or we can rely on existing transparency
    data = img.getdata()
    new_data = []
    for item in data:
        # If pixel is transparent, keep it. 
        # If pixel is white-ish (and not transparent), make it transparent.
        if item[3] > 0 and item[0] > 200 and item[1] > 200 and item[2] > 200:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)

    # 2. Trim whitespace (Crop to content)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        print(f"Cropped to {bbox}")
    
    # 3. Fit to square (maxsize)
    # Determine the larger dimension to maximize size
    width, height = img.size
    max_dim = max(width, height)
    
    # Create new square canvas
    # 512x512 is standard, let's use that
    canvas_size = 512
    # Add a small padding so text isn't touching edge (e.g. 5% padding)
    target_content_size = int(canvas_size * 0.90) 
    
    # Calculate resize ratio
    ratio = target_content_size / max_dim
    new_w = int(width * ratio)
    new_h = int(height * ratio)
    
    # Resize content
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create blank canvas
    final_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    
    # Paste centered
    x_offset = (canvas_size - new_w) // 2
    y_offset = (canvas_size - new_h) // 2
    
    final_img.paste(img, (x_offset, y_offset), img)
    
    final_img.save(output_path, "PNG")
    print(f"Saved processed logo to {output_path}")

if __name__ == "__main__":
    # Process the image in-place
    process_logo("public/android-chrome-512x512.png", "public/android-chrome-512x512.png")
