from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from scripts_generate_assets import FONT_BOLD, FONT_MONO, FONT_REG, PAL, concrete, font, glow_text, scanlines, sources, vignette


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
ENH = ROOT / "enhanced_screenshots"
CAPS = ROOT / "capsules"
ENH.mkdir(parents=True, exist_ok=True)
CAPS.mkdir(parents=True, exist_ok=True)


def fit_cover(src: Image.Image, size: tuple[int, int]) -> Image.Image:
    w, h = size
    sw, sh = src.size
    target = w / h
    current = sw / sh
    if current > target:
        nw = int(sh * target)
        left = (sw - nw) // 2
        src = src.crop((left, 0, left + nw, sh))
    else:
        nh = int(sw / target)
        top = (sh - nh) // 2
        src = src.crop((0, top, sw, top + nh))
    return src.resize(size, Image.Resampling.LANCZOS)


def captioned_screenshot(src: Image.Image, title: str, subtitle: str, out: Path, accent=(183, 58, 47), index="01") -> None:
    w, h = 1280, 720
    shot = fit_cover(src, (w, h)).convert("RGBA")
    shot = shot.filter(ImageFilter.UnsharpMask(radius=1.1, percent=135, threshold=3))
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay, "RGBA")

    d.rectangle((0, 0, w, h), outline=(*accent, 200), width=4)
    d.rectangle((0, 0, w, 106), fill=(8, 9, 10, 178))
    d.rectangle((0, h - 92, w, h), fill=(8, 9, 10, 188))
    d.line((0, 106, w, 106), fill=(*accent, 130), width=2)
    d.line((0, h - 92, w, h - 92), fill=(*accent, 130), width=2)

    d.text((28, 22), f"#{index}", font=font(FONT_MONO, 25), fill=(*accent, 230))
    d.text((104, 17), title, font=font(FONT_BOLD, 42), fill=(255, 241, 208, 250))
    d.text((104, 62), subtitle, font=font(FONT_REG, 23), fill=(216, 208, 184, 225))
    d.text((28, h - 61), "ГИГАХРУЩ // HTML5 WEBGL // Tenevik Games", font=font(FONT_MONO, 24), fill=(230, 188, 87, 220))
    d.text((w - 28, h - 61), "не спасай дом. вернись до отбоя.", font=font(FONT_MONO, 24), fill=(154, 142, 118, 210), anchor="ra")

    img = Image.alpha_composite(shot, overlay).convert("RGB")
    img = scanlines(img, 10)
    img.save(out, optimize=True)


def wide_capsule(out: Path) -> None:
    w, h = 960, 300
    img = concrete(w, h, 81).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    shots = sources()
    if shots:
        left = fit_cover(shots[2], (450, 250)).convert("RGBA")
        right = fit_cover(shots[1], (360, 190)).convert("RGBA")
        img.alpha_composite(left, (492, 25))
        d.rectangle((492, 25, 942, 275), outline=(183, 58, 47, 170), width=3)
        img.alpha_composite(right, (560, 88))
        d.rectangle((560, 88, 920, 278), outline=(230, 188, 87, 160), width=2)
    d.rectangle((0, 0, 590, h), fill=(8, 9, 10, 198))
    glow_text(img, (34, 44), "ГИГАХРУЩ", font(FONT_BOLD, 78), (255, 241, 208, 255), (230, 188, 87, 150))
    d.text((40, 132), "вылазки, патроны, самосбор", font=font(FONT_BOLD, 34), fill=(216, 208, 184, 238))
    d.text((40, 184), "HTML5 // WEBGL // PROCEDURAL", font=font(FONT_MONO, 25), fill=(230, 188, 87, 220))
    d.text((40, 228), "не спасай дом. вернись до отбоя.", font=font(FONT_MONO, 23), fill=(183, 58, 47, 230))
    img = scanlines(vignette(img.convert("RGB"), 0.55), 16)
    img.save(out, optimize=True)


def mini_capsule(out: Path) -> None:
    w, h = 315, 250
    img = concrete(w, h, 82).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    shots = sources()
    if shots:
        shot = fit_cover(shots[3], (279, 116)).convert("RGBA")
        img.alpha_composite(shot, (18, 78))
        d.rectangle((18, 78, 297, 194), outline=(104, 200, 120, 145), width=2)
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 80))
    d.rectangle((0, 0, w, 62), fill=(183, 58, 47, 75))
    glow_text(img, (w // 2, 37), "ГИГАХРУЩ", font(FONT_BOLD, 39), (255, 241, 208, 255), (104, 200, 120, 130), anchor="mm")
    d.rectangle((0, 196, w, h), fill=(8, 9, 10, 205))
    d.text((w // 2, 213), "САМОСБОР", font=font(FONT_BOLD, 23), fill=(230, 188, 87, 235), anchor="mm")
    d.text((w // 2, 238), "ИДЁТ ПО ПОДЪЕЗДУ", font=font(FONT_MONO, 18), fill=(216, 208, 184, 225), anchor="mm")
    img = scanlines(vignette(img.convert("RGB"), 0.62), 18)
    img.save(out, optimize=True)


def media_wall(out: Path) -> None:
    w, h = 1920, 1080
    img = concrete(w, h, 83).convert("RGBA")
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle((0, 0, w, h), fill=(8, 9, 10, 108))
    shots = sources()
    boxes = [
        (72, 180, 888, 638, PAL["red"], "БОЙ"),
        (998, 140, 1848, 618, PAL["amber"], "ЗАДАНИЕ"),
        (166, 708, 910, 1030, PAL["green"], "ИНВЕНТАРЬ"),
        (1048, 700, 1786, 1020, PAL["paper"], "АКТОВЫЙ ЗАЛ"),
    ]
    for i, box in enumerate(boxes):
        if not shots:
            continue
        x0, y0, x1, y1, accent, title = box
        shot = fit_cover(shots[i % len(shots)], (x1 - x0, y1 - y0)).convert("RGBA")
        img.alpha_composite(shot, (x0, y0))
        d.rectangle((x0, y0, x1, y1), outline=(*accent, 180), width=3)
        d.rectangle((x0, y0, x1, y0 + 44), fill=(8, 9, 10, 185))
        d.text((x0 + 18, y0 + 10), title, font=font(FONT_MONO, 26), fill=(*accent, 230))
    glow_text(img, (82, 52), "ГИГАХРУЩ", font(FONT_BOLD, 92), (255, 241, 208, 255), (230, 188, 87, 140))
    d.text((88, 139), "реальный билд: вылазки, фракции, самосбор, документы, смерть от плохого решения", font=font(FONT_REG, 34), fill=(216, 208, 184, 228))
    img = scanlines(vignette(img.convert("RGB"), 0.52), 12)
    img.save(out, optimize=True)


def main() -> None:
    shots = sources()
    captions = [
        ("combat", "БОЙ В КОРИДОРЕ", "патроны кончаются быстрее, чем уверенность", PAL["red"]),
        ("contract", "ЗАДАНИЕ НЕ ПРО КУРЬЕРА", "контракт ведёт в место, где дом уже начал спорить", PAL["amber"]),
        ("inventory", "ИНВЕНТАРЬ ЖИЛЬЦА", "еда, вода, ПСИ и один шанс сделать глупость позже", PAL["green"]),
        ("act_hall", "АКТОВЫЙ ЗАЛ", "стартовая безопасность: временная, шумная, чужая", PAL["paper"]),
    ]
    for i, (slug, title, subtitle, accent) in enumerate(captions, start=1):
        if shots:
            src = shots[(i + 1) % len(shots)] if i == 1 else shots[(i - 1) % len(shots)]
        else:
            src = concrete(1280, 720, 90 + i)
        captioned_screenshot(src, title, subtitle, ENH / f"gigahrush_screen_{i:02d}_{slug}.png", accent, f"{i:02d}")
    wide_capsule(CAPS / "gigahrush_capsule_wide_960x300.png")
    mini_capsule(CAPS / "gigahrush_capsule_315x250.png")
    media_wall(ASSETS / "gigahrush_media_wall_1920x1080.png")
    print("Generated overkill media:")
    for p in sorted([*ENH.glob("*.png"), *CAPS.glob("*.png"), ASSETS / "gigahrush_media_wall_1920x1080.png"]):
        print(f"  {p.name} ({p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
