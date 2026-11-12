"""Strip near-white fringe/halo from hanging shirt PNGs."""
from __future__ import annotations

import glob
import os
from PIL import Image

ROOT = os.path.join(
    os.path.dirname(__file__), "..", "public", "products", "hanging", "shirts"
)


def clean(path: str) -> int:
    im = Image.open(path).convert("RGBA")
    px = im.load()
    w, h = im.size
    changed = 0
    neighbors = ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1))

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            near_white = r > 232 and g > 232 and b > 232
            if not near_white:
                continue
            touches_empty = False
            for dx, dy in neighbors:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] < 40:
                    touches_empty = True
                    break
            if touches_empty or a < 200:
                px[x, y] = (r, g, b, 0)
                changed += 1

    if changed:
        im.save(path, optimize=True)
    return changed


def main() -> None:
    patterns = (
        "*front.png",
        "*back.png",
        "*side.png",
        "*-c*-front.png",
        "*-c*-back.png",
    )
    files: set[str] = set()
    for pat in patterns:
        files.update(glob.glob(os.path.join(ROOT, pat)))

    total = 0
    touched = 0
    for path in sorted(files):
        c = clean(path)
        if c:
            touched += 1
            total += c
            print(f"{os.path.basename(path)}: {c}")
    print(f"DONE files={touched} pixels={total}")


if __name__ == "__main__":
    main()
