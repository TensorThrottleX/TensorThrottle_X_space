from PIL import Image
import os

def create_favicon(png_path, ico_output_path):
    if not os.path.exists(png_path):
        print(f"Error: {png_path} not found.")
        return

    img = Image.open(png_path)
    # Resize to standard favicon sizes
    # Usually 16x16, 32x32, 48x48 are good to embed in one ico
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    
    img.save(ico_output_path, sizes=icon_sizes)
    print(f"Created favicon at {ico_output_path}")

if __name__ == "__main__":
    create_favicon("public/android-chrome-512x512.png", "public/favicon.ico")
