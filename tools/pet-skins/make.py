# -*- coding: utf-8 -*-
"""Turn the image_gen draft sheets into game frames for the drawn pet skins.

Input : docs/pet-skins/draft-sheets/<pet>-<theme>.png  (one row of 6 poses, transparent background)
Output: assets/pets/<pet>/<theme>/<pose>.png  (60x60 logical pixels, x4 nearest = 240x240, binary alpha)
        assets/pets/manifest.json, js/pet-skins-data.js, docs/pet-skins/contact.png
Run   : python tools/pet-skins/make.py        (only sheets that exist are processed)
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SHEETS = os.path.join(ROOT, 'docs', 'pet-skins', 'draft-sheets')
OUT = os.path.join(ROOT, 'assets', 'pets')
POSES = ['idle0', 'idle1', 'blink', 'happy', 'sleep', 'surprise']
L = 60          # logical canvas
BODY_H = 50     # logical height of the idle pose
BOTTOM = 2      # empty logical rows under the feet (old procedural pets leave about 2/30)
SCALE = 4
COLORS = 40

PETS = ['cat', 'dog', 'rat', 'slime', 'luckycat', 'dragon', 'owl', 'fairy', 'fox']
KIND = {'cat': '小貓', 'dog': '小狗', 'rat': '花枝鼠', 'slime': '史萊姆', 'luckycat': '招財貓', 'dragon': '幼龍',
        'owl': '貓頭鷹', 'fairy': '精靈', 'fox': '小狐'}
# theme: (name prefix, price, description); cheapest first, cutest/most elaborate last
THEMES = [
    ('strawberry', '草莓', 80, '戴著草莓帽，身上有一點甜甜的香味。'),
    ('bee', '蜜蜂', 90, '黃黑條紋的小蜜蜂裝，嗡嗡地陪你讀書。'),
    ('sailor', '小水手', 100, '水手帽和領巾，準備好一起出航了。'),
    ('cloud', '雲朵', 110, '軟綿綿的雲朵毛，抱起來像棉花糖。'),
    ('moon', '月夜', 120, '帶著月亮和星星，晚上會偷偷發亮。'),
]


def segments(mask):
    """Six pose cells. The poses are laid out evenly but may touch, so cut at the emptiest column
    near each expected boundary instead of relying on clean gaps."""
    cols = mask.sum(axis=0).astype(float)
    xs = np.where(cols > 0)[0]
    left, right = xs[0], xs[-1] + 1
    step = (right - left) / 6
    cuts = [left]
    for k in range(1, 6):
        c = left + step * k
        lo, hi = int(c - step * .3), int(c + step * .3)
        win = cols[lo:hi]
        best = np.where(win == win.min())[0]
        cuts.append(lo + int(best[len(best) // 2]))
    cuts.append(right)
    return [[cuts[i], cuts[i + 1]] for i in range(6)]


def crop(rgba, x0, x1):
    """Bounding box of the pose, ignoring thin slivers of a neighbouring pose at the cell edges."""
    a = rgba[:, x0:x1, 3] > 128
    colc = a.sum(axis=0); rowc = a.sum(axis=1)
    xs = np.where(colc > max(2, colc.max() * .04))[0]
    ys = np.where(rowc > 1)[0]
    out = rgba[ys[0]:ys[-1] + 1, x0 + xs[0]:x0 + xs[-1] + 1].copy()
    return out


def keep_main(arr):
    """Keep the main figure: drop connected pieces smaller than 6% of the largest one
    (slivers of a neighbouring pose, stray marks), then crop to what is left."""
    a = arr[:, :, 3] > 0
    lab = np.zeros(a.shape, int); sizes = [0]
    for y0, x0 in zip(*np.where(a)):
        if lab[y0, x0]: continue
        n = len(sizes); stack = [(y0, x0)]; lab[y0, x0] = n; c = 0
        while stack:
            y, x = stack.pop(); c += 1
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1), (y + 1, x + 1), (y - 1, x - 1), (y + 1, x - 1), (y - 1, x + 1)):
                if 0 <= yy < a.shape[0] and 0 <= xx < a.shape[1] and a[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; stack.append((yy, xx))
        sizes.append(c)
    big = max(sizes)
    keep = np.isin(lab, [i for i, c in enumerate(sizes) if i and c >= big * .06])
    arr[~keep] = 0
    ys = np.where(keep.any(axis=1))[0]; xs = np.where(keep.any(axis=0))[0]
    return arr[ys[0]:ys[-1] + 1, xs[0]:xs[-1] + 1]


def process(pet, theme):
    src = os.path.join(SHEETS, f'{pet}-{theme}.png')
    im = np.array(Image.open(src).convert('RGBA'))
    segs = segments(im[:, :, 3] > 128)
    if len(segs) != 6: raise SystemExit(f'{pet}-{theme}: found {len(segs)} cells, expected 6')
    cells = [crop(im, a, b) for a, b in segs]
    s = BODY_H / cells[0].shape[0]
    tallest = max(c.shape[0] for c in cells) * s
    widest = max(c.shape[1] for c in cells) * s
    s *= min(1, (L - BOTTOM - 1) / tallest, (L - 2) / widest)
    small = []
    for c in cells:
        w, h = max(1, round(c.shape[1] * s)), max(1, round(c.shape[0] * s))
        r = Image.fromarray(c).resize((w, h), Image.LANCZOS)
        small.append(np.array(r))
    # one palette per skin so all poses share colours
    opaque = np.concatenate([x[x[:, :, 3] > 128][:, :3] for x in small])
    pal_img = Image.fromarray(opaque.reshape(1, -1, 3).astype(np.uint8)).quantize(colors=COLORS, method=Image.MEDIANCUT)
    frames = []
    for x in small:
        rgb = Image.fromarray(x[:, :, :3]).quantize(palette=pal_img, dither=Image.NONE).convert('RGB')
        out = np.zeros((x.shape[0], x.shape[1], 4), np.uint8)
        out[:, :, :3] = np.array(rgb); out[:, :, 3] = np.where(x[:, :, 3] > 128, 255, 0)
        out[out[:, :, 3] == 0] = 0
        out = keep_main(out)
        canvas = np.zeros((L, L, 4), np.uint8)
        h, w = out.shape[:2]
        top = L - BOTTOM - h; left = (L - w) // 2
        canvas[top:top + h, left:left + w] = out
        frames.append(canvas)
    d = os.path.join(OUT, pet, theme); os.makedirs(d, exist_ok=True)
    for pose, f in zip(POSES, frames):
        Image.fromarray(f).resize((L * SCALE, L * SCALE), Image.NEAREST).save(os.path.join(d, pose + '.png'), optimize=True)
    return frames


def main():
    done, manifest = [], {'size': L * SCALE, 'logical': L, 'poses': POSES, 'pets': {}}
    for pet in PETS:
        for theme, pre, cost, desc in THEMES:
            if not os.path.exists(os.path.join(SHEETS, f'{pet}-{theme}.png')): continue
            frames = process(pet, theme)
            done.append((pet, theme, frames))
            manifest['pets'].setdefault(pet, []).append({
                'id': 'art_' + theme, 'name': pre + KIND[pet], 'img': f'assets/pets/{pet}/{theme}/', 'cost': cost, 'desc': desc})
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    js = ['/* 自動產生：python tools/pet-skins/make.py（勿手改）。手繪寵物造型，加在 C.PET_SKINS 原有換色造型後面。 */',
          '(function () {', '  const ADD = ' + json.dumps(manifest['pets'], ensure_ascii=False) + ';',
          '  Object.keys(ADD).forEach(p => { const a = C.PET_SKINS[p] = C.PET_SKINS[p] || []; ADD[p].forEach(s => { if (!a.some(x => x.id === s.id)) a.push(s); }); });',
          '})();', '']
    with open(os.path.join(ROOT, 'js', 'pet-skins-data.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(js))
    contact(done)
    print(f'{len(done)} skins, {len(done) * len(POSES)} frames')


def contact(done):
    if not done: return
    cell, pad = 120, 6
    W = 160 + len(POSES) * (cell + pad); H = 30 + len(done) * (cell + pad)
    sheet = Image.new('RGB', (W, H), (46, 36, 62)); dr = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype('C:/Windows/Fonts/msjh.ttc', 14)
    except Exception: font = ImageFont.load_default()
    for i, pose in enumerate(POSES): dr.text((160 + i * (cell + pad), 6), pose, fill=(230, 220, 240), font=font)
    for r, (pet, theme, frames) in enumerate(done):
        y = 30 + r * (cell + pad)
        dr.text((6, y + cell // 2 - 8), f'{pet} / {theme}', fill=(230, 220, 240), font=font)
        for i, f in enumerate(frames):
            x = 160 + i * (cell + pad)
            dr.rectangle([x, y, x + cell - 1, y + cell - 1], fill=(120, 170, 90) if r % 2 else (90, 140, 70))
            sheet.paste(Image.fromarray(f).resize((cell, cell), Image.NEAREST), (x, y), Image.fromarray(f).resize((cell, cell), Image.NEAREST))
    sheet.save(os.path.join(ROOT, 'docs', 'pet-skins', 'contact.png'))


if __name__ == '__main__':
    main()
