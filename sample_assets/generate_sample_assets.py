import io
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = Path(__file__).resolve().parent

def create_cyber_shield():
    size = (512, 512)
    img = Image.new("RGBA", size, (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)
    cx, cy = 256, 256
    
    # Shield shape points
    shield_pts = [
        (cx, 80),
        (380, 140),
        (360, 320),
        (cx, 440),
        (152, 320),
        (132, 140),
    ]
    draw.polygon(shield_pts, fill=(30, 58, 138, 255), outline=(96, 165, 250, 255), width=6)
    
    # Inner emblem
    inner_pts = [
        (cx, 130),
        (340, 180),
        (320, 300),
        (cx, 390),
        (192, 300),
        (172, 180),
    ]
    draw.polygon(inner_pts, fill=(59, 130, 246, 255), outline=(191, 219, 254, 255), width=4)
    
    # Core star
    draw.ellipse([cx - 50, cy - 50, cx + 50, cy + 50], fill=(245, 158, 11, 255), outline=(254, 240, 138, 255), width=4)
    draw.line([cx, cy - 70, cx, cy + 70], fill=(255, 255, 255, 255), width=6)
    draw.line([cx - 70, cy, cx + 70, cy], fill=(255, 255, 255, 255), width=6)
    
    img = img.convert("RGB")
    out_path = OUTPUT_DIR / "sample_01_cyber_shield.png"
    img.save(out_path, "PNG")
    print(f"Generated {out_path.name}")

def create_innovation_vortex():
    size = (512, 512)
    img = Image.new("RGB", size, (10, 10, 20))
    draw = ImageDraw.Draw(img)
    cx, cy = 256, 256
    
    colors = [
        (139, 92, 246),
        (168, 85, 247),
        (236, 72, 153),
        (244, 63, 94),
        (59, 130, 246),
        (14, 165, 233),
    ]
    
    for ring in range(12, 0, -1):
        radius = ring * 18
        color = colors[ring % len(colors)]
        draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=color, width=5)
        # Petal segments
        for i in range(8):
            angle = i * (math.pi / 4) + (ring * 0.2)
            px = cx + math.cos(angle) * radius
            py = cy + math.sin(angle) * radius
            draw.line([cx, cy, px, py], fill=color, width=2)
            
    draw.ellipse([cx - 25, cy - 25, cx + 25, cy + 25], fill=(255, 255, 255))
    out_path = OUTPUT_DIR / "sample_02_innovation_vortex.png"
    img.save(out_path, "PNG")
    print(f"Generated {out_path.name}")

def create_quantum_cube_art():
    size = (512, 512)
    img = Image.new("RGB", size, (17, 24, 39))
    draw = ImageDraw.Draw(img)
    
    # Concentric isometric diamond patterns
    cx, cy = 256, 256
    for i in range(6, 0, -1):
        w = i * 36
        pts = [
            (cx, cy - w * 1.4),
            (cx + w * 1.4, cy),
            (cx, cy + w * 1.4),
            (cx - w * 1.4, cy)
        ]
        fill_val = (16 + i * 25, 185 - i * 15, 129 + i * 10)
        draw.polygon(pts, fill=fill_val, outline=(5, 150, 105), width=3)
        
    out_path = OUTPUT_DIR / "sample_03_quantum_geometry.png"
    img.save(out_path, "PNG")
    print(f"Generated {out_path.name}")

if __name__ == "__main__":
    create_cyber_shield()
    create_innovation_vortex()
    create_quantum_cube_art()
