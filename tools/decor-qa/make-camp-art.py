"""Build the camp base-object sprite sheets in assets/camp/ from docs/decor/camp-base-source.png.

Each object is cropped from its real bounding box (with margin), scaled to fit its logical
canvas without changing the aspect ratio, anchored bottom-center, and snapped to a pixel grid
(binary alpha, small palette), then upscaled x4. Run: python tools/decor-qa/make-camp-art.py
"""
from PIL import Image, ImageDraw
from pathlib import Path
import numpy as np

SRC = Image.open('docs/decor/camp-base-source.png').convert('RGBA')
OUT = Path('assets/camp'); OUT.mkdir(exist_ok=True)
A = np.array(SRC.getchannel('A'))

# x ranges of the five objects on the source sheet (left to right)
REGIONS = {'fire': (0, 425), 'board': (425, 880), 'mail': (880, 1215), 'pot': (1215, 1575), 'pond': (1575, SRC.width)}

def bbox(x0, x1, thr=40):
    ys, xs = np.nonzero(A[:, x0:x1] >= thr)
    return x0 + xs.min(), ys.min(), x0 + xs.max() + 1, ys.max() + 1

def clean(im):
    """Binary alpha, quantize, drop isolated specks of 1-2 px."""
    a = im.getchannel('A').point(lambda v: 255 if v >= 110 else 0)
    rgb = im.convert('RGB').quantize(colors=56, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGBA')
    rgb.putalpha(a)
    px = rgb.load(); W, H = rgb.size; seen = set()
    for y in range(H):
        for x in range(W):
            if px[x, y][3] and (x, y) not in seen:
                todo = [(x, y)]; seen.add((x, y)); grp = []
                while todo:
                    q = todo.pop(); grp.append(q)
                    for xx, yy in ((q[0]-1, q[1]), (q[0]+1, q[1]), (q[0], q[1]-1), (q[0], q[1]+1)):
                        if 0 <= xx < W and 0 <= yy < H and (xx, yy) not in seen and px[xx, yy][3]:
                            seen.add((xx, yy)); todo.append((xx, yy))
                if len(grp) <= 2:
                    for p in grp: px[p] = (0, 0, 0, 0)
    return rgb

def fit(box, size, margin=6):
    """Crop source box (+margin), scale to fit size keeping aspect, paste bottom-center."""
    x0, y0, x1, y1 = box
    crop = SRC.crop((x0 - margin, y0 - margin, x1 + margin, y1 + margin))
    W, H = size
    k = min((W - 2) / crop.width, (H - 1) / crop.height)
    w, h = max(1, round(crop.width * k)), max(1, round(crop.height * k))
    small = crop.resize((w, h), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', size)
    canvas.alpha_composite(small, ((W - w) // 2, H - h))
    return clean(canvas)

def save(im, name):
    im.resize((im.width * 4, im.height * 4), Image.Resampling.NEAREST).save(OUT / name)

def strip(frames, name):
    im = Image.new('RGBA', (frames[0].width * len(frames), frames[0].height))
    for i, f in enumerate(frames): im.paste(f, (i * f.width, 0))
    save(im, name)

boxes = {k: bbox(*v) for k, v in REGIONS.items()}

# ---- board (36x36)
board = fit(boxes['board'], (36, 36)); save(board, 'board.png')

# ---- fire (48x48): flicker by stretching the flame part above the log/stone base
fire = fit(boxes['fire'], (48, 48))
split = 30  # rows above this are flame; base (logs + stones) stays fixed
frames = []
for s in (1.0, 1.08, 0.94, 1.04):
    f = fire.copy()
    top = fire.crop((0, 0, 48, split))
    nh = max(1, round(split * s))
    top2 = top.resize((48, nh), Image.Resampling.NEAREST)
    f.paste((0, 0, 0, 0), (0, 0, 48, split))
    y = split - nh
    if y < 0: top2 = top2.crop((0, -y, 48, nh)); y = 0
    f.alpha_composite(top2, (0, y))
    # re-lay the base so stretched flame never hides the logs' outline
    f.alpha_composite(fire.crop((0, split, 48, 48)), (0, split))
    frames.append(f)
strip(frames, 'fire.png')

# ---- mail (40x40): frame 0 flag up (has mail), frame 1 flag lowered (read)
mail = fit(boxes['mail'], (40, 40))
arr = np.array(mail)
red = (arr[..., 0] > 150) & (arr[..., 1] < 75) & (arr[..., 2] < 75) & (arr[..., 3] > 0)
red[20:] = False  # the raised flag is in the top half
ry, rx = np.nonzero(red)
down = mail.copy()
if len(rx):
    fx0, fx1, fy0, fy1 = rx.min(), rx.max(), ry.min(), ry.max()
    d = ImageDraw.Draw(down)
    col = np.nonzero(arr[:, max(0, fx0 - 4), 3] > 0)[0]
    boxtop = int(col.min()) if len(col) else fy1 + 1               # top of the box just left of the flag
    d.rectangle((fx0 - 1, 0, 39, boxtop - 1), fill=(0, 0, 0, 0))   # remove raised flag above the box
    for y, x in zip(*np.nonzero(red)): down.putpixel((int(x), int(y)), (0, 0, 0, 0))
    mid = boxtop + 6
    d.rectangle((fx0 - 1, mid - 1, min(39, fx0 + 7), mid + 2), fill=(43, 22, 30, 255))  # outline
    d.rectangle((fx0, mid, min(38, fx0 + 6), mid + 1), fill=(193, 53, 50, 255))
strip([mail, down], 'mail.png')

# ---- pot (48x48): stage 4 = full flowering plant; 0-3 = same pot body with growing sprout
plant = fit(boxes['pot'], (48, 48))
parr = np.array(plant)
terra = (parr[..., 0] > 140) & (parr[..., 1] > 60) & (parr[..., 1] < 130) & (parr[..., 2] < 90) & (parr[..., 3] > 0)
rows = np.nonzero(terra.sum(1) >= 8)[0]
rim = int(rows.min()) if len(rows) else 32
xs = np.nonzero(terra.any(0))[0]; cx = int((xs.min() + xs.max()) // 2) if len(xs) else 24
body = Image.new('RGBA', (48, 48)); body.alpha_composite(plant.crop((0, rim, 48, 48)), (0, rim))
def largest(im):
    from scipy import ndimage
    a = np.array(im); lab, n = ndimage.label(a[..., 3] > 0)
    if n > 1:
        keep = np.argmax(ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))) + 1
        a[lab != keep] = 0
    return Image.fromarray(a)
body = largest(body)
frames = []
for stage in range(5):
    if stage == 4: frames.append(plant.copy()); continue
    f = body.copy(); d = ImageDraw.Draw(f)
    d.ellipse((cx - 11, rim - 2, cx + 11, rim + 3), fill=(69, 37, 32, 255)); d.ellipse((cx - 9, rim - 1, cx + 9, rim + 2), fill=(105, 66, 44, 255))
    if stage >= 1:
        top = rim - (5 if stage == 1 else 11)
        d.line([(cx, rim), (cx, top)], fill=(47, 78, 38, 255), width=2)
        d.polygon([(cx, rim - 3), (cx - 5, rim - 7), (cx - 8, rim - 6), (cx - 5, rim - 3)], fill=(75, 120, 48, 255))
    if stage >= 2:
        d.polygon([(cx, rim - 5), (cx + 5, rim - 11), (cx + 10, rim - 10), (cx + 6, rim - 6)], fill=(89, 135, 50, 255))
        d.polygon([(cx, rim - 8), (cx - 4, rim - 13), (cx - 8, rim - 12), (cx - 5, rim - 8)], fill=(63, 108, 41, 255))
    if stage >= 3:
        d.ellipse((cx - 4, rim - 18, cx + 4, rim - 10), fill=(93, 44, 51, 255)); d.ellipse((cx - 3, rim - 18, cx + 3, rim - 12), fill=(220, 115, 141, 255))
    frames.append(f)
strip(frames, 'pot.png')

# ---- pond: keep true aspect (logical width 64); moving water glints inside the blue area
px0, py0, px1, py1 = boxes['pond']
PW = 64; PH = round(PW * (py1 - py0 + 12) / (px1 - px0 + 12)) + 1
pond = fit(boxes['pond'], (PW, PH))
qa = np.array(pond)
blue = (qa[..., 2] > 150) & (qa[..., 0] < 110) & (qa[..., 3] > 0)
by, bx = np.nonzero(blue)
frames = []
for shift in (0, 2, 4, 2):
    f = pond.copy(); d = ImageDraw.Draw(f)
    if len(bx):
        cy = int(by.mean()); x0 = int(bx.min() + (bx.max() - bx.min()) * 0.3)
        d.line((x0 + shift, cy - 2, x0 + shift + 4, cy - 2), fill=(170, 220, 232, 255))
        d.line((x0 + 10 - shift, cy + 2, x0 + 13 - shift, cy + 2), fill=(151, 205, 217, 255))
    frames.append(f)
strip(frames, 'pond.png')
print('pond logical size', PW, PH)
