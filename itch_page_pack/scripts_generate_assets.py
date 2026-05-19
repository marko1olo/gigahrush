from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "assets"
OUT.mkdir(parents=True, exist_ok=True)
SRC = ROOT / "source_screenshots"

FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
FONT_REG = Path("C:/Windows/Fonts/arial.ttf")
FONT_MONO = Path("C:/Windows/Fonts/consolab.ttf")

PAL = {
    "void": (8, 9, 10),
    "floor": (14, 14, 12),
    "concrete": (45, 43, 38),
    "paper": (216, 208, 184),
    "muted": (154, 142, 118),
    "red": (183, 58, 47),
    "amber": (230, 188, 87),
    "green": (104, 200, 120),
    "white": (232, 229, 208),
}


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def concrete(w: int, h: int, seed: int = 8) -> Image.Image:
    rng = random.Random(seed)
    base = Image.new("RGB", (w, h), PAL["floor"])
    noise = Image.effect_noise((w, h), 74).convert("L")
    noise = ImageChops.multiply(noise, Image.new("L", (w, h), 168))
    tint = Image.merge(
        "RGB",
        (
            noise.point(lambda p: int(p * 0.23) + 14),
            noise.point(lambda p: int(p * 0.21) + 13),
            noise.point(lambda p: int(p * 0.17) + 12),
        ),
    )
    base = Image.blend(base, tint, 0.76)
    d = ImageDraw.Draw(base, "RGBA")

    tile = max(72, w // 18)
    for x in range(-tile, w + tile, tile):
        jitter = rng.randint(-16, 16)
        d.line((x + jitter, 0, x + jitter + rng.randint(-30, 30), h), fill=(96, 82, 62, 38), width=2)
    for y in range(0, h, tile // 2):
        d.line((0, y + rng.randint(-8, 8), w, y + rng.randint(-8, 8)), fill=(96, 82, 62, 28), width=1)

    for _ in range(w * h // 42000):
        x = rng.randint(0, w)
        y = rng.randint(0, h)
        rw = rng.randint(30, 180)
        rh = rng.randint(1, 3)
        d.rectangle((x, y, min(w, x + rw), min(h, y + rh)), fill=(230, 188, 87, rng.randint(10, 26)))

    return base.filter(ImageFilter.GaussianBlur(0.25))


def vignette(img: Image.Image, strength: float = 0.85) -> Image.Image:
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    pix = mask.load()
    cx, cy = w / 2, h / 2
    maxd = math.sqrt(cx * cx + cy * cy)
    for y in range(h):
        for x in range(w):
            dx = (x - cx) / cx
            dy = (y - cy) / cy
            d = min(1.0, math.sqrt(dx * dx + dy * dy) / 1.05)
            pix[x, y] = int(255 * (d ** 1.8) * strength)
    dark = Image.new("RGB", (w, h), PAL["void"])
    return Image.composite(dark, img, mask)


def scanlines(img: Image.Image, alpha: int = 24) -> Image.Image:
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay, "RGBA")
    for y in range(0, h, 4):
        d.line((0, y, w, y), fill=(0, 0, 0, alpha), width=1)
    for x in range(0, w, 17):
        d.line((x, 0, x, h), fill=(255, 241, 208, 5), width=1)
    return Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")


def draw_corridor(d: ImageDraw.ImageDraw, w: int, h: int, horizon: int) -> None:
    # Cheap perspective corridor. No 3D, just believable stairwell geometry.
    cx = int(w * 0.50)
    floor_y = h - 1
    left_wall = int(w * 0.08)
    right_wall = int(w * 0.92)
    d.polygon([(left_wall, h), (cx - 120, horizon), (cx + 120, horizon), (right_wall, h)], fill=(20, 19, 17, 210))
    d.polygon([(0, 0), (cx - 120, horizon), (left_wall, h), (0, h)], fill=(21, 20, 18, 198))
    d.polygon([(w, 0), (cx + 120, horizon), (right_wall, h), (w, h)], fill=(18, 18, 16, 215))
    d.polygon([(0, 0), (w, 0), (cx + 120, horizon), (cx - 120, horizon)], fill=(24, 22, 19, 190))

    for i in range(12):
        t = i / 11
        y = int(horizon + (floor_y - horizon) * (t ** 1.75))
        xoff = int((w * 0.5 - 120) * (t ** 1.2))
        d.line((cx - 120 - xoff, y, cx + 120 + xoff, y), fill=(111, 88, 62, max(32, 100 - i * 5)), width=2)
    for side in (-1, 1):
        for i in range(7):
            t = i / 6
            sx = cx + side * int(120 + (w * 0.42) * (t ** 1.1))
            d.line((cx + side * 120, horizon, sx, h), fill=(112, 89, 64, 55), width=2)

    # Doors, lamps and screens.
    for side in (-1, 1):
        for i in range(4):
            y0 = int(horizon + 35 + i * 92)
            scale = 1 + i * 0.34
            x0 = int(cx + side * (185 + i * 94))
            ww = int(55 * scale)
            hh = int(92 * scale)
            if side < 0:
                rect = (x0 - ww, y0, x0, y0 + hh)
            else:
                rect = (x0, y0, x0 + ww, y0 + hh)
            d.rectangle(rect, outline=(162, 121, 68, 72), fill=(10, 10, 9, 115), width=2)
            if i == 1 and side > 0:
                d.rectangle((rect[0] + 8, rect[1] + 12, rect[2] - 8, rect[1] + 34), fill=(43, 96, 50, 180))
                d.text((rect[0] + 12, rect[1] + 13), "НЕТ", font=font(FONT_MONO, max(12, int(14 * scale))), fill=(150, 255, 154, 210))

    for i, x in enumerate((int(w * 0.31), int(w * 0.50), int(w * 0.69))):
        d.ellipse((x - 20, horizon - 95, x + 20, horizon - 55), fill=(230, 188, 87, 35 + i * 18))
        d.line((x, horizon - 55, x, horizon - 8), fill=(230, 188, 87, 72), width=3)


def glow_text(layer: Image.Image, xy: tuple[int, int], text: str, fnt: ImageFont.FreeTypeFont, fill, glow, anchor=None) -> None:
    temp = Image.new("RGBA", layer.size, (0, 0, 0, 0))
    td = ImageDraw.Draw(temp, "RGBA")
    for dx, dy, col in [(-5, 0, (183, 58, 47, 120)), (4, 0, (104, 200, 120, 95)), (0, 0, glow)]:
        td.text((xy[0] + dx, xy[1] + dy), text, font=fnt, fill=col, anchor=anchor)
    blurred = temp.filter(ImageFilter.GaussianBlur(7))
    layer.alpha_composite(blurred)
    d = ImageDraw.Draw(layer, "RGBA")
    d.text(xy, text, font=fnt, fill=fill, anchor=anchor)


def label(d: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, color) -> None:
    f = font(FONT_MONO, 26)
    bbox = d.textbbox(xy, text, font=f)
    pad = 10
    d.rectangle((bbox[0] - pad, bbox[1] - 6, bbox[2] + pad, bbox[3] + 8), fill=(8, 9, 10, 190), outline=(*color, 120), width=2)
    d.text(xy, text, font=f, fill=(*color, 230))


def sources() -> list[Image.Image]:
    imgs: list[Image.Image] = []
    if SRC.exists():
        for p in sorted(SRC.glob("source_*.png")):
            try:
                imgs.append(Image.open(p).convert("RGB"))
            except OSError:
                pass
    return imgs


def card(img: Image.Image, src: Image.Image, box: tuple[int, int, int, int], accent, title: str) -> None:
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    crop = src.copy()
    sw, sh = crop.size
    target = w / h
    current = sw / sh
    if current > target:
        nw = int(sh * target)
        left = (sw - nw) // 2
        crop = crop.crop((left, 0, left + nw, sh))
    else:
        nh = int(sw / target)
        top = (sh - nh) // 2
        crop = crop.crop((0, top, sw, top + nh))
    crop = crop.resize((w, h), Image.Resampling.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.1, percent=150, threshold=3))
    overlay = Image.new("RGBA", (w, h), (8, 9, 10, 0))
    od = ImageDraw.Draw(overlay, "RGBA")
    od.rectangle((0, 0, w, h), outline=(*accent, 210), width=3)
    od.rectangle((0, 0, w, 36), fill=(8, 9, 10, 188))
    od.text((14, 7), title, font=font(FONT_MONO, 20), fill=(*accent, 235))
    od.rectangle((0, h - 32, w, h), fill=(8, 9, 10, 160))
    od.line((0, h - 32, w, h - 32), fill=(*accent, 120), width=1)
    img.alpha_composite(crop.convert("RGBA"), (x0, y0))
    img.alpha_composite(overlay, (x0, y0))


def make_banner(path: Path, size=(1920, 620)) -> None:
    w, h = size
    img = concrete(w, h, 11).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    draw_corridor(d, w, h, int(h * 0.34))
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 30))
    d.rectangle((0, int(h * 0.74), w, h), fill=(8, 9, 10, 150))

    # Samosbor fog bands.
    for i in range(9):
        y = int(h * (0.18 + i * 0.075))
        d.polygon([(0, y), (w, y + random.Random(20 + i).randint(-20, 28)), (w, y + 35), (0, y + 20)], fill=(104, 200, 120, 14 if i % 2 else 9))
    for i in range(7):
        x = int(w * (0.1 + i * 0.13))
        d.rectangle((x, 0, x + 2, h), fill=(232, 229, 208, 13))

    shots = sources()
    if shots:
        card(img, shots[2 % len(shots)], (1040, 68, 1830, 282), PAL["red"], "ВЫЛАЗКА")
        card(img, shots[1 % len(shots)], (1110, 316, 1788, 528), PAL["amber"], "ЗАДАНИЕ")
        d.rectangle((1008, 42, 1852, 548), outline=(230, 188, 87, 45), width=2)

    d.rectangle((0, 0, 1035, h), fill=(8, 9, 10, 76))
    glow_text(img, (78, 82), "ГИГАХРУЩ", font(FONT_BOLD, 136), (255, 241, 208, 255), (230, 188, 87, 160))
    d.text((88, 232), "вылазки, патроны и самосбор внутри хрущёвки", font=font(FONT_REG, 34), fill=(216, 208, 184, 238))
    d.text((88, 274), "размером с город", font=font(FONT_REG, 34), fill=(216, 208, 184, 214))
    label(d, (92, 336), "СИРЕНА НЕ ВСЕГДА УСПЕВАЕТ", PAL["red"])
    label(d, (92, 393), "1024x1024 TORUS // HTML5 // WEBGL", PAL["amber"])
    label(d, (92, 450), "ИСТОТИТ / МАРОНАРИЙ / ВЕРЕТАР", PAL["green"])
    label(d, (92, 507), "НЕ СПАСАЙ ДОМ. ВЕРНИСЬ ДО ОТБОЯ.", PAL["paper"])

    d.text((w - 92, h - 88), "Tenevik Games", font=font(FONT_MONO, 34), fill=(154, 142, 118, 200), anchor="ra")
    img = scanlines(vignette(img.convert("RGB"), 0.56), 18)
    img.save(path, optimize=True)


def make_header_bg(path: Path, size=(1920, 620)) -> None:
    w, h = size
    img = concrete(w, h, 16).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    draw_corridor(d, w, h, int(h * 0.34))
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 72))
    d.rectangle((0, 0, int(w * 0.58), h), fill=(8, 9, 10, 160))
    shots = sources()
    if shots:
        card(img, shots[2 % len(shots)], (1040, 68, 1830, 282), PAL["red"], "ВЫЛАЗКА")
        card(img, shots[1 % len(shots)], (1110, 316, 1788, 528), PAL["amber"], "ЗАДАНИЕ")
        d.rectangle((1008, 42, 1852, 548), outline=(230, 188, 87, 45), width=2)
    label(d, (92, 338), "СИРЕНА НЕ ВСЕГДА УСПЕВАЕТ", PAL["red"])
    label(d, (92, 395), "1024x1024 TORUS // HTML5 // WEBGL", PAL["amber"])
    label(d, (92, 452), "ИСТОТИТ / МАРОНАРИЙ / ВЕРЕТАР", PAL["green"])
    d.text((w - 92, h - 88), "Tenevik Games", font=font(FONT_MONO, 34), fill=(154, 142, 118, 200), anchor="ra")
    img = scanlines(vignette(img.convert("RGB"), 0.58), 18)
    img.save(path, optimize=True)


def make_cover(path: Path, size=(630, 500)) -> None:
    w, h = size
    img = concrete(w, h, 22).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    draw_corridor(d, w, h, int(h * 0.30))
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 52))
    shots = sources()
    if shots:
        card(img, shots[3 % len(shots)], (36, 118, 594, 356), PAL["green"], "АКТОВЫЙ ЗАЛ")
        d.rectangle((36, 118, 594, 356), outline=(230, 188, 87, 90), width=1)
    d.rectangle((0, 0, w, int(h * 0.18)), fill=(183, 58, 47, 78))
    d.rectangle((0, int(h * 0.82), w, h), fill=(8, 9, 10, 178))
    glow_text(img, (w // 2, 68), "GIGAH|RUSH", font(FONT_BOLD, 62), (255, 241, 208, 255), (183, 58, 47, 150), anchor="mm")
    glow_text(img, (w // 2, 142), "ГИГАХРУЩ", font(FONT_BOLD, 58), (255, 241, 208, 255), (104, 200, 120, 120), anchor="mm")
    d.text((w // 2, h - 76), "САМОСБОР ИДЁТ ПО ПОДЪЕЗДУ", font=font(FONT_BOLD, 27), fill=(230, 188, 87, 245), anchor="mm")
    d.text((w // 2, h - 42), "SURVIVAL HORROR / ARPG SHOOTER", font=font(FONT_MONO, 21), fill=(216, 208, 184, 215), anchor="mm")
    img = scanlines(vignette(img.convert("RGB"), 0.58), 20)
    img.save(path, optimize=True)


def make_social(path: Path, size=(1200, 630)) -> None:
    w, h = size
    img = concrete(w, h, 31).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    draw_corridor(d, w, h, int(h * 0.35))
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 48))
    shots = sources()
    if shots:
        card(img, shots[0], (660, 78, 1138, 290), PAL["green"], "ИНВЕНТАРЬ")
        card(img, shots[2 % len(shots)], (625, 326, 1110, 548), PAL["red"], "КОРИДОР")
    d.rectangle((0, 0, int(w * 0.60), h), fill=(8, 9, 10, 150))
    glow_text(img, (64, 90), "ГИГАХРУЩ", font(FONT_BOLD, 105), (255, 241, 208, 255), (230, 188, 87, 140))
    d.text((70, 220), "Вы не спасаете дом.", font=font(FONT_BOLD, 44), fill=(216, 208, 184, 240))
    d.text((70, 278), "Вы пытаетесь вернуться до отбоя.", font=font(FONT_BOLD, 44), fill=(216, 208, 184, 240))
    label(d, (74, 370), "HTML5 // WEBGL // PROCEDURAL", PAL["amber"])
    label(d, (74, 427), "САМОСБОР // ФРАКЦИИ // ВЫЛАЗКИ", PAL["red"])
    d.text((70, h - 64), "tenevik.itch.io/gigahrush", font=font(FONT_MONO, 32), fill=(154, 142, 118, 220))
    img = scanlines(vignette(img.convert("RGB"), 0.58), 18)
    img.save(path, optimize=True)


def make_background(path: Path, size=(1920, 1080)) -> None:
    w, h = size
    img = concrete(w, h, 44).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    # Low-contrast stairwell wallpaper for itch background.
    for i in range(24):
        x = int((i * 173) % w)
        y = int((i * 97) % h)
        d.rectangle((x, y, x + 160, y + 80), outline=(230, 188, 87, 18), width=2)
    for i in range(8):
        x = int(w * (0.05 + i * 0.13))
        d.line((x, 0, x + 180, h), fill=(183, 58, 47, 18), width=3)
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 132))
    d.text((60, h - 80), "САМОСБОР", font=font(FONT_BOLD, 56), fill=(183, 58, 47, 70))
    d.text((w - 60, 80), "НЕТ-СФЕРА", font=font(FONT_MONO, 42), fill=(104, 200, 120, 55), anchor="ra")
    img = scanlines(vignette(img.convert("RGB"), 0.92), 16)
    img.save(path, optimize=True)


def main() -> None:
    make_banner(OUT / "gigahrush_banner_1920x620.png")
    make_header_bg(OUT / "gigahrush_header_bg_1920x620.png")
    make_cover(OUT / "gigahrush_cover_630x500.png")
    make_social(OUT / "gigahrush_social_1200x630.png")
    make_background(OUT / "gigahrush_background_1920x1080.png")
    print("Generated:")
    for p in sorted(OUT.glob("*.png")):
        print(f"  {p} ({p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
