import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

assets_dir = r"C:\Users\Puzzz\.gemini\antigravity\scratch\dope-demonic-portfolio\assets"

def draw_spiky_branch(draw, x1, y1, x2, y2, depth=4, width=6, color=(160, 160, 175)):
    """Draws organic demonic thorn / root branches expanding outward."""
    if depth <= 0:
        return
    draw.line([(x1, y1), (x2, y2)], fill=color, width=max(1, int(width)))
    
    # Sub-branches / thorns
    dx = x2 - x1
    dy = y2 - y1
    dist = math.sqrt(dx*dx + dy*dy)
    if dist < 5:
        return
    
    angle = math.atan2(dy, dx)
    
    # Left thorn
    t_len = dist * 0.65
    t_angle1 = angle + 0.45 + (0.1 * math.sin(depth))
    tx1 = x2 + t_len * math.cos(t_angle1)
    ty1 = y2 + t_len * math.sin(t_angle1)
    draw_spiky_branch(draw, x2, y2, tx1, ty1, depth-1, width*0.65, color)
    
    # Right thorn
    t_angle2 = angle - 0.45 - (0.1 * math.cos(depth))
    tx2 = x2 + t_len * math.cos(t_angle2)
    ty2 = y2 + t_len * math.sin(t_angle2)
    draw_spiky_branch(draw, x2, y2, tx2, ty2, depth-1, width*0.65, color)

def create_spirit_identity_title(out_path):
    """
    Creates Script Kittens Spirit-style title:
    Top line: SCRIPT KITTENS / DOPE (crimson gothic spikes)
    Main line: IDENTITY (massive metallic silver chrome with expanding tree roots / thorn tendrils)
    """
    w, h = 1400, 480
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    # Try system gothic/serif fonts or standard fonts
    font_main = None
    font_top = None
    for f_path in [
        r"C:\Windows\Fonts\CinzelDecorative-Bold.ttf",
        r"C:\Windows\Fonts\GOTHICB.TTF",
        r"C:\Windows\Fonts\playfair.ttf",
        r"C:\Windows\Fonts\georgiab.ttf",
        r"C:\Windows\Fonts\timesbd.ttf"
    ]:
        if os.path.exists(f_path):
            try:
                font_main = ImageFont.truetype(f_path, 110)
                font_top = ImageFont.truetype(f_path, 42)
                break
            except:
                pass
    if not font_main:
        font_main = ImageFont.load_default()
        font_top = ImageFont.load_default()

    cx, cy = w // 2, h // 2 + 20

    # 1. Draw expanding demonic tree roots underneath and branching sideways
    # Center roots
    draw_spiky_branch(draw, cx, cy + 80, cx, cy + 180, depth=4, width=8, color=(140, 30, 45, 230))
    draw_spiky_branch(draw, cx - 120, cy + 70, cx - 320, cy + 190, depth=4, width=6, color=(120, 125, 140, 220))
    draw_spiky_branch(draw, cx + 120, cy + 70, cx + 320, cy + 190, depth=4, width=6, color=(120, 125, 140, 220))
    
    # Left expanding horns / roots
    draw_spiky_branch(draw, cx - 360, cy, cx - 580, cy - 60, depth=4, width=7, color=(180, 185, 200, 240))
    draw_spiky_branch(draw, cx - 360, cy + 40, cx - 600, cy + 100, depth=4, width=7, color=(140, 30, 45, 230))
    
    # Right expanding horns / roots
    draw_spiky_branch(draw, cx + 360, cy, cx + 580, cy - 60, depth=4, width=7, color=(180, 185, 200, 240))
    draw_spiky_branch(draw, cx + 360, cy + 40, cx + 600, cy + 100, depth=4, width=7, color=(140, 30, 45, 230))

    # 2. Render Text: Top Line "SOVEREIGN DOPE" in Crimson Death Metal
    top_text = "SOVEREIGN DOPE"
    bbox_top = draw.textbbox((0, 0), top_text, font=font_top)
    tw_top = bbox_top[2] - bbox_top[0]
    tx_top = cx - tw_top // 2
    ty_top = cy - 130

    # Shadow & bevel for top text
    for off in range(4, 0, -1):
        draw.text((tx_top + off, ty_top + off), top_text, fill=(40, 0, 5, 180), font=font_top)
    draw.text((tx_top, ty_top), top_text, fill=(210, 25, 50, 255), font=font_top)
    draw.text((tx_top, ty_top), top_text, fill=(255, 90, 110, 150), font=font_top)

    # 3. Render Main Line "IDENTITY" in Brutal Chrome Steel
    main_text = "IDENTITY"
    bbox_main = draw.textbbox((0, 0), main_text, font=font_main)
    tw_main = bbox_main[2] - bbox_main[0]
    tx_main = cx - tw_main // 2
    ty_main = cy - 45

    # 3D Extrusion
    for off in range(8, 0, -1):
        draw.text((tx_main + off, ty_main + off), main_text, fill=(20, 20, 25, 220), font=font_main)
    
    # Chrome body
    draw.text((tx_main, ty_main), main_text, fill=(185, 190, 205, 255), font=font_main)
    # Highlights
    draw.text((tx_main, ty_main - 2), main_text, fill=(245, 250, 255, 190), font=font_main)

    # Add sharp spike accents to text edges
    for i in range(len(main_text)):
        char_x = tx_main + int(i * (tw_main / len(main_text))) + 30
        draw.line([(char_x, ty_main - 10), (char_x, ty_main - 35)], fill=(220, 225, 240, 255), width=2)
        draw.line([(char_x, ty_main + 95), (char_x, ty_main + 125)], fill=(160, 30, 45, 240), width=2)

    # Tight crop
    bbox = im.getbbox()
    if bbox:
        px = 15
        c_box = (max(0, bbox[0]-px), max(0, bbox[1]-px), min(w, bbox[2]+px), min(h, bbox[3]+px))
        im = im.crop(c_box)

    im.save(out_path, "PNG")
    print("Saved Identity Spirit Title:", out_path)

def create_solo_leveling_projects_title(out_path):
    """
    Creates Solo Leveling Shadow Monarch style title:
    Dark violet/blue shadow aura, lightning tendrils, metallic steel "FEATURED PROJECTS"
    """
    w, h = 1400, 480
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    font_main = None
    font_top = None
    for f_path in [
        r"C:\Windows\Fonts\CinzelDecorative-Bold.ttf",
        r"C:\Windows\Fonts\GOTHICB.TTF",
        r"C:\Windows\Fonts\georgiab.ttf",
        r"C:\Windows\Fonts\timesbd.ttf"
    ]:
        if os.path.exists(f_path):
            try:
                font_main = ImageFont.truetype(f_path, 95)
                font_top = ImageFont.truetype(f_path, 38)
                break
            except:
                pass
    if not font_main:
        font_main = ImageFont.load_default()
        font_top = ImageFont.load_default()

    cx, cy = w // 2, h // 2 + 15

    # 1. Shadow Monarch wings / lightning tendrils
    draw_spiky_branch(draw, cx - 350, cy, cx - 590, cy - 80, depth=4, width=6, color=(100, 60, 220, 240))
    draw_spiky_branch(draw, cx - 350, cy + 30, cx - 580, cy + 90, depth=4, width=6, color=(60, 120, 240, 220))
    draw_spiky_branch(draw, cx + 350, cy, cx + 590, cy - 80, depth=4, width=6, color=(100, 60, 220, 240))
    draw_spiky_branch(draw, cx + 350, cy + 30, cx + 580, cy + 90, depth=4, width=6, color=(60, 120, 240, 220))
    draw_spiky_branch(draw, cx, cy + 70, cx, cy + 160, depth=4, width=7, color=(120, 70, 255, 230))

    # 2. Top Line: "SHADOW ARSENAL" in Shadow Violet
    top_text = "SHADOW ARSENAL"
    bbox_top = draw.textbbox((0, 0), top_text, font=font_top)
    tw_top = bbox_top[2] - bbox_top[0]
    tx_top = cx - tw_top // 2
    ty_top = cy - 120

    for off in range(4, 0, -1):
        draw.text((tx_top + off, ty_top + off), top_text, fill=(10, 5, 30, 200), font=font_top)
    draw.text((tx_top, ty_top), top_text, fill=(138, 75, 255, 255), font=font_top)
    draw.text((tx_top, ty_top), top_text, fill=(190, 150, 255, 180), font=font_top)

    # 3. Main Line: "FEATURED PROJECTS"
    main_text = "FEATURED PROJECTS"
    bbox_main = draw.textbbox((0, 0), main_text, font=font_main)
    tw_main = bbox_main[2] - bbox_main[0]
    tx_main = cx - tw_main // 2
    ty_main = cy - 40

    for off in range(8, 0, -1):
        draw.text((tx_main + off, ty_main + off), main_text, fill=(10, 15, 35, 240), font=font_main)
    draw.text((tx_main, ty_main), main_text, fill=(195, 205, 230, 255), font=font_main)
    draw.text((tx_main, ty_main - 2), main_text, fill=(240, 245, 255, 190), font=font_main)

    # Shadow lightning accents
    for x_spot in [tx_main + 50, tx_main + tw_main // 2, tx_main + tw_main - 50]:
        draw.line([(x_spot, ty_main - 8), (x_spot - 15, ty_main - 28), (x_spot + 5, ty_main - 48)], fill=(150, 180, 255, 255), width=2)
        draw.line([(x_spot, ty_main + 85), (x_spot + 15, ty_main + 115), (x_spot - 5, ty_main + 140)], fill=(120, 60, 240, 240), width=2)

    bbox = im.getbbox()
    if bbox:
        px = 15
        c_box = (max(0, bbox[0]-px), max(0, bbox[1]-px), min(w, bbox[2]+px), min(h, bbox[3]+px))
        im = im.crop(c_box)

    im.save(out_path, "PNG")
    print("Saved Solo Leveling Projects Title:", out_path)

def create_transmission_nexus_title(out_path):
    """
    Creates Demonic Transmission Nexus title:
    Top line: SUMMON & TRANSMIT (blood crimson)
    Main line: TRANSMISSION NEXUS (sharp silver runic metal)
    """
    w, h = 1400, 480
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)

    font_main = None
    font_top = None
    for f_path in [
        r"C:\Windows\Fonts\CinzelDecorative-Bold.ttf",
        r"C:\Windows\Fonts\GOTHICB.TTF",
        r"C:\Windows\Fonts\georgiab.ttf",
        r"C:\Windows\Fonts\timesbd.ttf"
    ]:
        if os.path.exists(f_path):
            try:
                font_main = ImageFont.truetype(f_path, 95)
                font_top = ImageFont.truetype(f_path, 38)
                break
            except:
                pass
    if not font_main:
        font_main = ImageFont.load_default()
        font_top = ImageFont.load_default()

    cx, cy = w // 2, h // 2 + 15

    # Lateral demonic wings
    draw_spiky_branch(draw, cx - 340, cy, cx - 580, cy - 60, depth=4, width=6, color=(160, 30, 50, 240))
    draw_spiky_branch(draw, cx + 340, cy, cx + 580, cy - 60, depth=4, width=6, color=(160, 30, 50, 240))
    draw_spiky_branch(draw, cx, cy + 70, cx, cy + 160, depth=4, width=7, color=(180, 185, 200, 230))

    top_text = "DIRECT SUMMONS"
    bbox_top = draw.textbbox((0, 0), top_text, font=font_top)
    tw_top = bbox_top[2] - bbox_top[0]
    tx_top = cx - tw_top // 2
    ty_top = cy - 120

    for off in range(4, 0, -1):
        draw.text((tx_top + off, ty_top + off), top_text, fill=(30, 0, 5, 200), font=font_top)
    draw.text((tx_top, ty_top), top_text, fill=(220, 30, 55, 255), font=font_top)

    main_text = "TRANSMISSION NEXUS"
    bbox_main = draw.textbbox((0, 0), main_text, font=font_main)
    tw_main = bbox_main[2] - bbox_main[0]
    tx_main = cx - tw_main // 2
    ty_main = cy - 40

    for off in range(8, 0, -1):
        draw.text((tx_main + off, ty_main + off), main_text, fill=(25, 20, 25, 240), font=font_main)
    draw.text((tx_main, ty_main), main_text, fill=(205, 210, 225, 255), font=font_main)
    draw.text((tx_main, ty_main - 2), main_text, fill=(250, 250, 255, 190), font=font_main)

    bbox = im.getbbox()
    if bbox:
        px = 15
        c_box = (max(0, bbox[0]-px), max(0, bbox[1]-px), min(w, bbox[2]+px), min(h, bbox[3]+px))
        im = im.crop(c_box)

    im.save(out_path, "PNG")
    print("Saved Transmission Nexus Title:", out_path)

create_spirit_identity_title(os.path.join(assets_dir, "title-identity.png"))
create_solo_leveling_projects_title(os.path.join(assets_dir, "title-projects.png"))
create_transmission_nexus_title(os.path.join(assets_dir, "title-nexus.png"))
