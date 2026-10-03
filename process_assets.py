import os
import math
from PIL import Image, ImageFilter

brain_dir = r"C:\Users\Puzzz\.gemini\antigravity\brain\890e3ba2-6fd7-4a6a-acbd-051d4b47be3a"
assets_dir = r"C:\Users\Puzzz\.gemini\antigravity\scratch\dope-demonic-portfolio\assets"

def make_transparent_white(img_path, out_path, white_thresh=220, low_thresh=180):
    """
    Converts pure white background into true alpha transparency.
    """
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            min_val = min(r, min(g, b))
            
            if min_val >= white_thresh:
                pixels[x, y] = (r, g, b, 0)
            elif min_val <= low_thresh:
                pixels[x, y] = (r, g, b, 255)
            else:
                # Ramp down alpha near white
                ratio = (white_thresh - min_val) / (white_thresh - low_thresh)
                alpha = int(255 * (ratio ** 1.5))
                pixels[x, y] = (r, g, b, alpha)

    bbox = img.getbbox()
    if bbox:
        px = 20
        c_box = (
            max(0, bbox[0] - px),
            max(0, bbox[1] - px),
            min(width, bbox[2] + px),
            min(height, bbox[3] + px)
        )
        img = img.crop(c_box)

    img.save(out_path, "PNG")
    print(f"Saved (white key): {out_path} (size: {img.size})")

def make_transparent_dark_refined(img_path, out_path, black_thresh=18, high_thresh=70):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Max intensity
            lum = max(r, max(g, b))
            
            if lum <= black_thresh:
                pixels[x, y] = (0, 0, 0, 0)
            elif lum >= high_thresh:
                pixels[x, y] = (r, g, b, 255)
            else:
                ratio = (lum - black_thresh) / (high_thresh - black_thresh)
                alpha = int(255 * (ratio ** 1.6))
                pixels[x, y] = (r, g, b, alpha)

    bbox = img.getbbox()
    if bbox:
        px = 15
        c_box = (
            max(0, bbox[0] - px),
            max(0, bbox[1] - px),
            min(width, bbox[2] + px),
            min(height, bbox[3] + px)
        )
        img = img.crop(c_box)

    img.save(out_path, "PNG")
    print(f"Saved (dark key): {out_path} (size: {img.size})")

# 1. Crimson deathmetal hero (from white bg)
make_transparent_white(
    os.path.join(brain_dir, "dope_crimson_deathmetal_3_1790097219148.jpg"),
    os.path.join(assets_dir, "dope-deathmetal-hero.png"),
    white_thresh=235, low_thresh=180
)

# 2. Crown logo
make_transparent_dark_refined(
    os.path.join(brain_dir, "dope_crown_logo_1790096645786.jpg"),
    os.path.join(assets_dir, "dope-crown-logo.png"),
    black_thresh=22, high_thresh=75
)

# 3. Sovereign Architect
make_transparent_dark_refined(
    os.path.join(brain_dir, "title_sovereign_architect_1790096768570.jpg"),
    os.path.join(assets_dir, "title-sovereign-architect.png"),
    black_thresh=20, high_thresh=70
)

# 4. Demonic Arsenal
make_transparent_dark_refined(
    os.path.join(brain_dir, "title_demonic_arsenal_1790096914726.jpg"),
    os.path.join(assets_dir, "title-demonic-arsenal.png"),
    black_thresh=20, high_thresh=70
)

# 5. Vubix Engine
make_transparent_dark_refined(
    os.path.join(brain_dir, "title_vubix_engine_1790096840024.jpg"),
    os.path.join(assets_dir, "title-vubix-engine.png"),
    black_thresh=16, high_thresh=60
)

# 6. Chronicles
make_transparent_dark_refined(
    os.path.join(brain_dir, "title_tactical_chronicles_1790098418008.jpg"),
    os.path.join(assets_dir, "title-chronicles.png"),
    black_thresh=20, high_thresh=70
)

