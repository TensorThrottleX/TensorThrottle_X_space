from PIL import Image

def maximize_logo(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    
    # 1. Get current alpha channel to find bbox
    bbox = img.getbbox()
    if bbox:
        # Crop tight
        img = img.crop(bbox)
        
    width, height = img.size
    
    # 2. Add padding to make it perfectly square if needed, 
    # but ensure content fills as much as possible.
    max_dim = max(width, height)
    
    # Create final canvas
    canvas_size = 512
    # Use 95% of canvas (minimal padding)
    target_size = int(canvas_size * 0.95)
    
    # Resize content
    ratio = target_size / max_dim
    new_w = int(width * ratio)
    new_h = int(height * ratio)
    
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Create new high-contrast version for small icons
    # Make text purely white if it isn't already, for dark theme visibility
    data = img.getdata()
    new_data = []
    for item in data:
        # If it has alpha > 0, make it pure white
        if item[3] > 0:
             # Check if it's already white-ish, if so boost to full white
             if item[0] > 100 or item[1] > 100 or item[2] > 100:
                 new_data.append((255, 255, 255, 255))
             else:
                 new_data.append(item)
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    # Paste centered
    final_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    x_offset = (canvas_size - new_w) // 2
    y_offset = (canvas_size - new_h) // 2
    
    final_img.paste(img, (x_offset, y_offset), img)
    
    final_img.save(output_path, "PNG")
    print(f"Maximized logo saved to {output_path}")

if __name__ == "__main__":
    maximize_logo("public/android-chrome-512x512.png", "public/android-chrome-512x512.png")
