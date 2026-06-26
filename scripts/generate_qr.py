#!/usr/bin/env python3
"""
Generate a styled, scannable QR code for the AfroWeek brochure.

- Error correction H (tolerates the centered logo).
- DARK modules on a LIGHT (white) background for maximum contrast/scannability.
- Theming lives in the decorative border (brown #3b2317 / gold #e8a317) and a
  centered AfroWeek logo only -- the code's own quiet zone stays white.
- Exports a high-res PNG (posters) and a vector SVG (large-format print).
- Verifies the PNG decodes back to the exact target URL before finishing.

Usage:
    python scripts/generate_qr.py [URL]

Defaults to the production brochure URL when no URL is given.
"""
import base64
import io
import sys
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw

# ---- Theme -----------------------------------------------------------------
BROWN = (59, 35, 23)        # #3b2317
BROWN_DEEP = (43, 25, 15)   # #2b190f
GOLD = (232, 163, 23)       # #e8a317
MODULE_DARK = (31, 18, 11)  # near-black brown: high contrast on white, on-theme
WHITE = (255, 255, 255)

# ---- Paths -----------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "public" / "brochure.pdf"
OUT = ROOT / "output"
OUT.mkdir(exist_ok=True)
PNG_PATH = OUT / "afroweek_qr.png"
SVG_PATH = OUT / "afroweek_qr.svg"

DEFAULT_URL = "https://millennium-hall.vercel.app/brochure.pdf"


def extract_logo(size: int) -> Image.Image:
    """Pull the circular AfroWeek badge from page 2 of the brochure, mask it to
    a circle, and return an RGBA image of the requested size. Falls back to a
    pre-extracted PNG, then to None-safe gold disc if the PDF is unavailable."""
    raw = None
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(PDF)
        page = doc[1]  # page 2 = logo badge
        imgs = page.get_images(full=True)
        if imgs:
            base = doc.extract_image(imgs[0][0])
            raw = Image.open(io.BytesIO(base["image"])).convert("RGBA")
    except Exception as exc:  # noqa: BLE001
        print(f"  [logo] PDF extract failed ({exc}); trying cached raw PNG")

    if raw is None:
        cached = OUT / "_logo_raw.png"
        if cached.exists():
            raw = Image.open(cached).convert("RGBA")

    if raw is None:
        # Last resort: a plain gold disc so the script still produces output.
        disc = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        d = ImageDraw.Draw(disc)
        d.ellipse((0, 0, size - 1, size - 1), fill=GOLD)
        return disc

    # Square-crop, then circular-mask to trim the dark badge corners.
    w, h = raw.size
    side = min(w, h)
    left, top = (w - side) // 2, (h - side) // 2
    raw = raw.crop((left, top, left + side, top + side)).resize(
        (size, size), Image.LANCZOS
    )
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(raw, (0, 0), mask)
    return out


def rounded_pad(size: int, radius_frac: float = 0.22) -> Image.Image:
    """White rounded-square pad to sit behind the logo."""
    pad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    r = int(size * radius_frac)
    ImageDraw.Draw(pad).rounded_rectangle((0, 0, size - 1, size - 1), radius=r, fill=WHITE)
    return pad


def build_matrix(url: str, box_size: int):
    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_H,
        box_size=box_size,
        border=0,  # we add our own white quiet zone + themed frame
    )
    qr.add_data(url)
    qr.make(fit=True)
    return qr.get_matrix()


def render_png(url: str, logo_frac: float, target_px: int = 1200) -> Image.Image:
    """Compose: themed brown canvas -> gold frame -> WHITE quiet zone -> QR ->
    centered logo on a white pad. Returns the finished poster image."""
    box = 28
    matrix = build_matrix(url, box)
    n = len(matrix)
    qr_px = n * box

    quiet = 4 * box                 # mandatory white quiet zone (>=4 modules)
    gold_frame = max(box, qr_px // 40)
    brown_frame = max(box, qr_px // 26)
    canvas_px = qr_px + 2 * (quiet + gold_frame + brown_frame)

    canvas = Image.new("RGB", (canvas_px, canvas_px), BROWN)
    draw = ImageDraw.Draw(canvas)

    # gold frame (inside the brown outer band)
    g0 = brown_frame
    g1 = canvas_px - brown_frame
    draw.rounded_rectangle((g0, g0, g1 - 1, g1 - 1), radius=brown_frame, fill=GOLD)

    # white quiet-zone block that holds the QR
    w0 = brown_frame + gold_frame
    w1 = canvas_px - (brown_frame + gold_frame)
    draw.rounded_rectangle((w0, w0, w1 - 1, w1 - 1), radius=gold_frame, fill=WHITE)

    # draw QR modules (dark on white)
    origin = brown_frame + gold_frame + quiet
    for r in range(n):
        for c in range(n):
            if matrix[r][c]:
                x0 = origin + c * box
                y0 = origin + r * box
                draw.rectangle((x0, y0, x0 + box - 1, y0 + box - 1), fill=MODULE_DARK)

    # centered logo on a white rounded pad
    logo_px = int(qr_px * logo_frac)
    pad_px = int(logo_px * 1.22)
    logo = extract_logo(logo_px)
    pad = rounded_pad(pad_px)
    cx = cy = canvas_px // 2
    canvas.paste(pad, (cx - pad_px // 2, cy - pad_px // 2), pad)
    canvas.paste(logo, (cx - logo_px // 2, cy - logo_px // 2), logo)

    return canvas.resize((target_px, target_px), Image.LANCZOS)


def render_svg(url: str, logo_frac: float) -> str:
    """Vector twin of the PNG from the same matrix, with embedded logo PNG."""
    box = 10
    matrix = build_matrix(url, box)
    n = len(matrix)
    qr_px = n * box
    quiet = 4 * box
    gold_frame = max(box, qr_px // 40)
    brown_frame = max(box, qr_px // 26)
    size = qr_px + 2 * (quiet + gold_frame + brown_frame)

    def hexc(rgb):
        return "#%02x%02x%02x" % rgb

    rects = []
    origin = brown_frame + gold_frame + quiet
    for r in range(n):
        row = matrix[r]
        c = 0
        while c < n:
            if row[c]:
                start = c
                while c < n and row[c]:
                    c += 1
                x = origin + start * box
                y = origin + r * box
                rects.append(
                    f'<rect x="{x}" y="{y}" width="{(c - start) * box}" '
                    f'height="{box}" fill="{hexc(MODULE_DARK)}"/>'
                )
            else:
                c += 1

    logo_px = int(qr_px * logo_frac)
    pad_px = int(logo_px * 1.22)
    logo = extract_logo(logo_px * 4)  # hi-res for crisp embed
    buf = io.BytesIO()
    logo.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    cx = size // 2
    pad_r = int(pad_px * 0.22)

    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <rect width="{size}" height="{size}" fill="{hexc(BROWN)}"/>
  <rect x="{brown_frame}" y="{brown_frame}" width="{size - 2*brown_frame}"
        height="{size - 2*brown_frame}" rx="{brown_frame}" fill="{hexc(GOLD)}"/>
  <rect x="{brown_frame+gold_frame}" y="{brown_frame+gold_frame}"
        width="{size - 2*(brown_frame+gold_frame)}"
        height="{size - 2*(brown_frame+gold_frame)}" rx="{gold_frame}" fill="#ffffff"/>
  {''.join(rects)}
  <rect x="{cx - pad_px//2}" y="{cx - pad_px//2}" width="{pad_px}" height="{pad_px}"
        rx="{pad_r}" fill="#ffffff"/>
  <image x="{cx - logo_px//2}" y="{cx - logo_px//2}" width="{logo_px}" height="{logo_px}"
         xlink:href="data:image/png;base64,{b64}"/>
</svg>
'''


def decode(img: Image.Image) -> str | None:
    """Decode a QR from a PIL image using pyzbar, then OpenCV as a backup."""
    import numpy as np
    arr = np.array(img.convert("RGB"))
    try:
        from pyzbar.pyzbar import decode as zbar_decode
        res = zbar_decode(img.convert("RGB"))
        if res:
            return res[0].data.decode("utf-8")
    except Exception:  # noqa: BLE001
        pass
    try:
        import cv2
        bgr = cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)
        data, _, _ = cv2.QRCodeDetector().detectAndDecode(bgr)
        return data or None
    except Exception:  # noqa: BLE001
        return None


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL
    print(f"Target URL : {url}")

    # Generate, then verify; shrink the logo and retry if it won't decode.
    for logo_frac in (0.20, 0.17, 0.14, 0.11):
        png = render_png(url, logo_frac)
        decoded = decode(png)
        if decoded == url:
            png.save(PNG_PATH)
            Path(SVG_PATH).write_text(render_svg(url, logo_frac))
            print(f"Decoded URL: {decoded}")
            print(f"Decode test: PASS (logo at {int(logo_frac*100)}% of QR width)")
            print(f"PNG        : {PNG_PATH}  ({png.size[0]}x{png.size[1]})")
            print(f"SVG        : {SVG_PATH}")
            return 0
        print(f"  decode mismatch at logo {int(logo_frac*100)}% "
              f"(got {decoded!r}); shrinking logo and retrying")

    print("ERROR: QR failed to decode at all logo sizes.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
