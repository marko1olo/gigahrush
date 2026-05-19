from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

from scripts_generate_assets import (
    FONT_BOLD,
    FONT_MONO,
    FONT_REG,
    PAL,
    card,
    concrete,
    draw_corridor,
    font,
    glow_text,
    scanlines,
    sources,
    vignette,
)
from scripts_generate_overkill_assets import fit_cover


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
VARIANTS = ROOT / "visual_variants"
ANIMATED = ROOT / "animated"
VARIANTS.mkdir(parents=True, exist_ok=True)
ANIMATED.mkdir(parents=True, exist_ok=True)


def _soft_glitch(img: Image.Image, seed: int, accent: tuple[int, int, int]) -> Image.Image:
    rng = random.Random(seed)
    base = img.convert("RGBA")
    w, h = base.size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer, "RGBA")
    for _ in range(12):
        y = rng.randrange(0, h)
        hh = rng.randrange(2, 12)
        dx = rng.randrange(-22, 23)
        strip = base.crop((0, y, w, min(h, y + hh)))
        layer.alpha_composite(strip, (dx, y))
        d.rectangle((0, y, w, min(h, y + hh)), fill=(*accent, rng.randrange(10, 35)))
    return Image.alpha_composite(base, layer)


def cover_variant(path: Path, accent: tuple[int, int, int], title: str, subtitle: str, seed: int, shot_index: int) -> None:
    w, h = 630, 500
    img = concrete(w, h, seed).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    draw_corridor(d, w, h, int(h * 0.31))
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 72))

    shots = sources()
    if shots:
        shot = fit_cover(shots[shot_index % len(shots)], (520, 210)).convert("RGBA")
        shot = _soft_glitch(shot, seed + 100, accent)
        img.alpha_composite(shot, (55, 152))
        d.rectangle((55, 152, 575, 362), outline=(*accent, 190), width=3)
        d.rectangle((55, 152, 575, 190), fill=(8, 9, 10, 180))
        d.text((74, 162), "РЕАЛЬНЫЙ БИЛД", font=font(FONT_MONO, 22), fill=(*accent, 230))

    d.rectangle((0, 0, w, 100), fill=(*accent, 56))
    d.rectangle((0, h - 104, w, h), fill=(8, 9, 10, 208))
    glow_text(img, (w // 2, 63), "GIGAH|RUSH", font(FONT_BOLD, 62), (255, 241, 208, 255), (*accent, 165), anchor="mm")
    glow_text(img, (w // 2, 128), "ГИГАХРУЩ", font(FONT_BOLD, 55), (255, 241, 208, 255), (230, 188, 87, 130), anchor="mm")
    d.text((w // 2, h - 70), title, font=font(FONT_BOLD, 30), fill=(255, 241, 208, 246), anchor="mm")
    d.text((w // 2, h - 37), subtitle, font=font(FONT_MONO, 19), fill=(216, 208, 184, 226), anchor="mm")
    img = scanlines(vignette(img.convert("RGB"), 0.60), 18)
    img.save(path, optimize=True)


def clean_header(path: Path) -> None:
    w, h = 1920, 620
    img = concrete(w, h, 118).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    draw_corridor(d, w, h, int(h * 0.33))
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 90))
    d.rectangle((0, 0, int(w * 0.56), h), fill=(8, 9, 10, 118))
    shots = sources()
    if shots:
        card(img, shots[2 % len(shots)], (1070, 72, 1844, 292), PAL["red"], "ВЫЛАЗКА")
        card(img, shots[0], (1140, 324, 1808, 540), PAL["green"], "ИНВЕНТАРЬ")
    for i, text in enumerate(("СИРЕНА НЕ ВСЕГДА УСПЕВАЕТ", "САМОСБОР ИДЁТ ПО ПОДЪЕЗДУ", "НЕ СПАСАЙ ДОМ. ВЕРНИСЬ ДО ОТБОЯ.")):
        d.text((92, 328 + i * 54), text, font=font(FONT_MONO, 30), fill=(230, 188, 87, 145 if i != 1 else 205))
    d.text((w - 92, h - 80), "Tenevik Games", font=font(FONT_MONO, 34), fill=(154, 142, 118, 180), anchor="ra")
    img = scanlines(vignette(img.convert("RGB"), 0.57), 16)
    img.save(path, optimize=True)


def vertical_poster(path: Path) -> None:
    w, h = 1080, 1620
    img = concrete(w, h, 119).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    draw_corridor(d, w, h, int(h * 0.28))
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 62))
    shots = sources()
    if shots:
        card(img, shots[1 % len(shots)], (104, 610, 976, 1042), PAL["amber"], "ЗАДАНИЕ")
        card(img, shots[2 % len(shots)], (170, 1084, 910, 1384), PAL["red"], "КОРИДОР")
    glow_text(img, (w // 2, 180), "ГИГАХРУЩ", font(FONT_BOLD, 132), (255, 241, 208, 255), (230, 188, 87, 150), anchor="mm")
    d.text((w // 2, 294), "вылазки, патроны, самосбор", font=font(FONT_BOLD, 48), fill=(216, 208, 184, 238), anchor="mm")
    d.text((w // 2, 360), "внутри хрущёвки размером с город", font=font(FONT_REG, 42), fill=(216, 208, 184, 210), anchor="mm")
    d.rectangle((96, 444, 984, 546), fill=(8, 9, 10, 200), outline=(183, 58, 47, 160), width=3)
    d.text((w // 2, 495), "НЕ СПАСАЙ ДОМ. ВЕРНИСЬ ДО ОТБОЯ.", font=font(FONT_BOLD, 39), fill=(230, 188, 87, 240), anchor="mm")
    d.text((w // 2, h - 94), "tenevik.itch.io/gigahrush", font=font(FONT_MONO, 38), fill=(154, 142, 118, 220), anchor="mm")
    img = scanlines(vignette(img.convert("RGB"), 0.60), 16)
    img.save(path, optimize=True)


def contact_sheet(path: Path) -> None:
    w, h = 1600, 900
    img = concrete(w, h, 120).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 112))
    shots = sources()
    boxes = [
        (68, 190, 772, 586, PAL["red"], "БОЙ"),
        (828, 190, 1532, 586, PAL["amber"], "ЗАДАНИЕ"),
        (68, 626, 512, 854, PAL["green"], "ИНВЕНТАРЬ"),
        (548, 626, 992, 854, PAL["paper"], "АКТОВЫЙ ЗАЛ"),
        (1028, 626, 1532, 854, PAL["red"], "САМОСБОР"),
    ]
    for i, box in enumerate(boxes):
        if not shots:
            break
        x0, y0, x1, y1, accent, title = box
        card(img, shots[i % len(shots)], (x0, y0, x1, y1), accent, title)
    glow_text(img, (68, 54), "ГИГАХРУЩ", font(FONT_BOLD, 90), (255, 241, 208, 255), (230, 188, 87, 130))
    d.text((74, 144), "страница должна продавать реальный билд, не обещание", font=font(FONT_REG, 34), fill=(216, 208, 184, 225))
    img = scanlines(vignette(img.convert("RGB"), 0.48), 12)
    img.save(path, optimize=True)


def samosbor_gif(path: Path) -> None:
    shots = sources()
    frames: list[Image.Image] = []
    if not shots:
        shots = [concrete(640, 360, 130)]
    captions = ["СИРЕНА", "ГЕРМОДВЕРИ", "ТУМАН", "ЧУЖИЕ ШАГИ", "НОВЫЙ ПРОХОД", "ОТБОЙ"]
    accents = [PAL["red"], PAL["amber"], PAL["green"], PAL["paper"], PAL["red"], PAL["green"]]
    for i in range(24):
        base = fit_cover(shots[i % len(shots)], (640, 360)).convert("RGBA")
        accent = accents[i % len(accents)]
        base = _soft_glitch(base, 300 + i, accent)
        overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(overlay, "RGBA")
        d.rectangle((0, 0, 640, 64), fill=(8, 9, 10, 195))
        d.rectangle((0, 296, 640, 360), fill=(8, 9, 10, 205))
        d.text((26, 18), f"{captions[i % len(captions)]} // {i + 1:02d}", font=font(FONT_MONO, 26), fill=(*accent, 235))
        d.text((26, 315), "САМОСБОР ИДЁТ ПО ПОДЪЕЗДУ", font=font(FONT_BOLD, 27), fill=(255, 241, 208, 245))
        d.text((614, 316), "GIGAH|RUSH", font=font(FONT_MONO, 22), fill=(230, 188, 87, 220), anchor="ra")
        frame = scanlines(Image.alpha_composite(base, overlay).convert("RGB"), 18)
        frames.append(frame.convert("P", palette=Image.Palette.ADAPTIVE, colors=128))
    frames[0].save(path, save_all=True, append_images=frames[1:], optimize=True, duration=90, loop=0, disposal=2)


def main() -> None:
    cover_variant(VARIANTS / "gigahrush_cover_variant_red_alarm_630x500.png", PAL["red"], "СИРЕНА НЕ ВСЕГДА УСПЕВАЕТ", "SURVIVAL HORROR / ARPG SHOOTER", 121, 2)
    cover_variant(VARIANTS / "gigahrush_cover_variant_green_maronary_630x500.png", PAL["green"], "МАРОНАРИЙ ЛЕЗЕТ В СТЕНЫ", "ПСИ / ФРАКЦИИ / ВЫЛАЗКИ", 122, 0)
    cover_variant(VARIANTS / "gigahrush_cover_variant_white_veretar_630x500.png", PAL["paper"], "БЕЛЫЙ ВЕРЕТАР МОЛЧИТ", "ДОКУМЕНТЫ / ЛИФТЫ / ДОЛГИ", 123, 1)
    clean_header(VARIANTS / "gigahrush_header_clean_no_title_1920x620.png")
    vertical_poster(VARIANTS / "gigahrush_vertical_poster_1080x1620.png")
    contact_sheet(VARIANTS / "gigahrush_contact_sheet_1600x900.png")
    samosbor_gif(ANIMATED / "gigahrush_samosbor_loop_640x360.gif")
    print("Generated v3 assets:")
    for p in sorted([*VARIANTS.glob("*"), *ANIMATED.glob("*")]):
        print(f"  {p.name} ({p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
