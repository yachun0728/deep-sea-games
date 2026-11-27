#!/usr/bin/env python3
"""Rebuild games/fishing/art from design/source (green-screen 4x2 sheets).
Run with a Python that has Pillow, numpy and scipy. Prints the anchor table used by game.js."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

def label(mask):
    """4-connected labelling by flood fill (mask is already downscaled)."""
    H, W = mask.shape; lab = np.zeros((H, W), np.int32); n = 0
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]: continue
        n += 1; lab[y0, x0] = n; stack = [(y0, x0)]
        while stack:
            y, x = stack.pop()
            for v, u in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= v < H and 0 <= u < W and mask[v, u] and not lab[v, u]:
                    lab[v, u] = n; stack.append((v, u))
    return lab, n

ROOT = Path(__file__).resolve().parents[1]
SRC, ART = ROOT / 'design/source', ROOT / 'art'

def keyed(name):
    a = np.array(Image.open(SRC / f'{name}-v1.png').convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    d = g - np.maximum(r, b)
    alpha = np.clip((150 - d) / 110, 0, 1)
    g2 = np.where(d > 0, np.maximum(r, b), g)  # despill
    return np.dstack([r, g2, b, alpha * 255]).astype(np.uint8)

def frames(name):
    """Split by connected shapes so limbs that cross a grid line stay with their own frame."""
    img = keyed(name); H, W = img.shape[:2]
    S = 3
    solid = img[..., 3] > 40
    h2, w2 = H // S, W // S
    small = solid[:h2 * S, :w2 * S].reshape(h2, S, w2, S).any(axis=(1, 3))
    lab, n = label(small)
    owner = np.full(n + 1, -1)
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        owner[i] = min(3, int(xs.mean() * S / (W / 4))) + 4 * min(1, int(ys.mean() * S / (H / 2)))
    own = np.full((H, W), -1)
    own[:h2 * S, :w2 * S] = np.repeat(np.repeat(owner[lab], S, 0), S, 1)
    out = []
    for k in range(8):
        m = (own == k) & (img[..., 3] > 0)
        ys, xs = np.nonzero(m)
        crop = img[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy()
        crop[~m[ys.min():ys.max() + 1, xs.min():xs.max() + 1]] = 0
        out.append((crop, xs.min() - (k % 4) * W / 4, ys.min() - (k // 4) * H / 2))
    return out

def pack(name, kind, scale):
    items = []
    fr = frames(name)
    for k, (c, ox, oy) in enumerate(fr):
        a = c[..., 3] > 128; h, w = a.shape
        ys, xs = np.nonzero(a)
        if kind == 'man':
            if name == 'result' and k >= 4:      # falling: feet leave the deck, keep the drawn grid position
                ax = anchor_cell_x - ox; ay = max(f[2] + f[0].shape[0] for f in fr[4:]) - oy
            else:                                 # planted front foot
                band = np.nonzero(a[h - 14:, :])[1]; ax = band.max() - 30; ay = h
                if k == 0: anchor_cell_x = ax + ox
            i = np.argmax(xs * 1.0); px, py = xs[i], ys[i]          # rod tip = right-most pixel
        else:
            ax, ay = xs.mean(), ys.mean()                           # body centre
            upper = ys < h * .8
            i = np.argmin(np.where(upper, xs, 10 ** 6)); px, py = xs[i] + 6, ys[i]  # mouth = left-most pixel
        items.append((c, float(ax), float(ay), float(px), float(py)))
    left = max(i[1] for i in items); right = max(i[0].shape[1] - i[1] for i in items)
    top = max(i[2] for i in items); bottom = max(i[0].shape[0] - i[2] for i in items)
    cw, ch = int((left + right) * scale) + 4, int((top + bottom) * scale) + 4
    gx, gy = left * scale + 2, top * scale + 2
    sheet = Image.new('RGBA', (cw * 4, ch * 2))
    points = []
    for k, (c, ax, ay, px, py) in enumerate(items):
        im = Image.fromarray(c, 'RGBA').resize((max(1, round(c.shape[1] * scale)), max(1, round(c.shape[0] * scale))), Image.LANCZOS)
        sheet.alpha_composite(im, (k % 4 * cw + round(gx - ax * scale), k // 4 * ch + round(gy - ay * scale)))
        points.append([round((px - ax) * scale), round((py - ay) * scale)])
    if name == 'thrash': points[0] = [-96, -64]  # frame 1: left-most pixel is a fin, not the mouth
    sheet.save(ART / f'{name}.webp', quality=86, method=6)
    return {'w': cw, 'h': ch, 'x': round(gx), 'y': round(gy), 'p': points}

meta = {}
for n, s in (('reel', .86), ('release', .90), ('fight', .90), ('result', .88)):
    meta[n] = pack(n, 'man', s)
for n, s in (('swim', .78), ('thrash', .78), ('moods', .78)):
    meta[n] = pack(n, 'fish', s)
for t in ('dawn', 'morning', 'noon', 'dusk', 'night'):
    Image.open(SRC / f'bg-{t}-v1.png').convert('RGB').resize((780, 1690), Image.LANCZOS).save(ART / f'bg-{t}.webp', quality=80, method=6)
boat = Image.fromarray(keyed('boat'), 'RGBA'); boat = boat.crop(boat.getbbox()); boat = boat.resize((720, round(boat.height * 720 / boat.width)), Image.LANCZOS)
boat.save(ART / 'boat.webp', quality=86, method=6)
print(json.dumps(meta, separators=(',', ':'))); print('boat', boat.size)
