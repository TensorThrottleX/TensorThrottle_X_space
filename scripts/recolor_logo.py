from PIL import Image

def recolor_logo_orange(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    
    data = img.getdata()
    new_data = []
    
    # Orange Color (Red-Orange-ish to be visible)
    # RGB: 255, 165, 0 (Standard Orange) or maybe 249, 115, 22 (Tailwind Orange-500)
    # Let's use Tailwind Orange-500: #F97316 -> (249, 115, 22)
    # High contrast orange: 255, 90, 0
    orange = (255, 80, 0, 255)
    
    for item in data:
        # If it has alpha > 0 (it's part of the text), make it orange
        # We assume the input image has already been cleaned/cropped by previous steps to be white text on transparent
        if item[3] > 0:
             # Maintain original alpha for antialiasing smoothness if we want, or just hard set it
             # Let's keep original alpha if it's not fully opaque, but set color channels
             new_data.append((255, 100, 0, item[3]))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Recolored logo saved to {output_path}")

if __name__ == "__main__":
    recolor_logo_orange("public/android-chrome-512x512.png", "public/android-chrome-512x512.png")
