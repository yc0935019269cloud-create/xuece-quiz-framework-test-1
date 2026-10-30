"""Finish reference-edited panoramas on the original 512x128 / 128-color grid.

Usage: python tools/decor_tod.py
Inputs and exact edit prompts are recorded in docs/decor/tod-generation.json.
Original images are never overwritten. Requires Pillow, NumPy and OpenCV.
"""
import json
import shutil
import sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from decor_scene_assets import TIMES, SIZE, ground_edges

ROOT = Path(__file__).resolve().parent.parent
RECORD = ROOT / 'docs/decor/tod-generation.json'


def trim_padding(image):
    a = np.asarray(image.convert('RGB'))
    # Image generation sometimes letterboxes a 4:1 reference in a 3:1 canvas.
    blank = np.mean(np.min(a, axis=2) > 245, axis=1) > .985
    top, bottom = 0, len(a)
    while top < bottom and blank[top]: top += 1
    while bottom > top and blank[bottom - 1]: bottom -= 1
    return image.crop((0, top, image.width, bottom)), [0, top, image.width, bottom]


def register(original, edited):
    """Register stable architecture/terrain to the original; retain painted light.

    Robust affine alignment rejects moving light sources. A smooth displacement
    field then pins inlier landmarks to their original coordinates. Sky additions
    do not participate in matching and therefore remain hand-painted.
    """
    size = (768, 192)
    src = np.asarray(original.resize(size, Image.Resampling.NEAREST))
    gen = np.asarray(edited.resize(size, Image.Resampling.LANCZOS))
    clahe = cv2.createCLAHE(clipLimit=2, tileGridSize=(8, 4))
    gray = lambda a: clahe.apply(cv2.cvtColor(a, cv2.COLOR_RGB2GRAY))
    sift = cv2.SIFT_create(nfeatures=1800, contrastThreshold=.015)
    ka, da = sift.detectAndCompute(gray(src), None)
    kb, db = sift.detectAndCompute(gray(gen), None)
    stats = {'matches': 0, 'inliers': 0}
    if da is None or db is None: return edited, stats
    matches = [m for m, n in cv2.BFMatcher().knnMatch(da, db, k=2) if m.distance < .78 * n.distance]
    stats['matches'] = len(matches)
    if len(matches) < 6: return edited, stats
    target = np.float32([ka[m.queryIdx].pt for m in matches])
    source = np.float32([kb[m.trainIdx].pt for m in matches])
    affine, inliers = cv2.estimateAffine2D(target, source, method=cv2.RANSAC, ransacReprojThreshold=5)
    if affine is None: return edited, stats
    keep = inliers.ravel().astype(bool)
    stats['inliers'] = int(keep.sum())
    target, source = target[keep], source[keep]
    # Limit correspondence to plausible edits, rather than allowing false matches
    # to stretch an entire panorama. Coordinates below are at half output size.
    if len(target) < 6 or np.max(np.abs(affine[:, :2] - np.eye(2))) > .5:
        return edited, stats
    yy, xx = np.mgrid[0:384, 0:1536].astype(np.float32)
    points = np.column_stack((xx.ravel() / 2, yy.ravel() / 2))
    mapped = points @ affine[:, :2].T + affine[:, 2]
    residual = source - (target @ affine[:, :2].T + affine[:, 2])
    # A smoothed local correction is bounded to 8px at half resolution.
    if len(target) >= 10:
        gy, gx = np.mgrid[0:192:32j, 0:768:128j]
        coarse = np.column_stack((gx.ravel(), gy.ravel()))
        distance = np.sum((coarse[:, None] - target[None]) ** 2, axis=2)
        weights = np.exp(-distance / (2 * 28 ** 2))
        correction = (weights @ residual) / np.maximum(weights.sum(axis=1, keepdims=True), 1)
        correction = cv2.resize(correction.reshape(32, 128, 2).astype('float32'), (1536, 384))
        mapped += np.clip(correction.reshape(-1, 2), -8, 8)
    mapped *= 2
    aligned = cv2.remap(np.asarray(edited), mapped[:, 0].reshape(384, 1536).astype('float32'),
                        mapped[:, 1].reshape(384, 1536).astype('float32'), cv2.INTER_LINEAR,
                        borderMode=cv2.BORDER_REPLICATE)
    stats['affine'] = affine.tolist()
    return Image.fromarray(aligned), stats


def pin_floor(original, edited):
    """Keep the original floor edge/texture; sample its newly painted palette.

    Furniture needs stable terrain. Map the edited floor back to the original
    boundary, then use a source-anchored palette for that band. This is geometric
    cleanup of a reference edit, not a substitute for generating the variants.
    """
    ref, anchor = ground_edges(original)
    current, _ = ground_edges(edited, anchor)
    base = np.asarray(original).astype(float)
    painted = np.asarray(edited).astype(float)
    # Pin at the robust median floor row. Texture and irregular snow/grass edges
    # come from the original, so the whole silhouette stays fixed.
    floor = int(np.median(ref))
    old = int(np.median(current))
    yy = np.interp(np.arange(384), [0, max(1, floor - 42), floor, 383],
                   [0, max(1, floor - 42), old, 383]).astype(np.float32)
    xx = np.tile(np.arange(1536, dtype=np.float32), (384, 1))
    painted = cv2.remap(painted.astype(np.uint8), xx, np.tile(yy[:, None], (1, 1536)), cv2.INTER_LINEAR).astype(float)
    # Estimate a relit palette per original colour, using corresponding edited
    # samples. Preserve luminance contrast to keep the measured floor edge stable.
    start = max(0, floor - 9)
    source_band = base[start:]
    colors, inverse = np.unique(source_band.reshape(-1, 3), axis=0, return_inverse=True)
    samples = painted[start:].reshape(-1, 3)
    mapped = np.array([np.median(samples[inverse == i], axis=0) for i in range(len(colors))])
    # Preserve the original fine texture and edge contrast, while transferring
    # the generated time-specific colour and broad lighting of the floor.
    old_mean = source_band.mean(axis=(0, 1))
    new_mean = painted[max(floor + 6, start):].mean(axis=(0, 1))
    scale = np.clip(np.mean(new_mean) / max(1, np.mean(old_mean)), .45, 1.5)
    stable = (colors - old_mean) * scale + new_mean
    mapped = stable * .85 + mapped * .15
    pinned = np.clip(mapped[inverse].reshape(source_band.shape), 0, 255)
    # Feather the transition ABOVE the floor, so a palette change cannot make
    # an artificial horizontal seam stronger than the actual terrain edge.
    fade_start = max(0, start - 30)
    t = np.linspace(0, 1, start - fade_start, endpoint=False)[:, None, None]
    t = t * t * (3 - 2 * t)
    tint = np.clip((base[fade_start:start] - old_mean) * scale + new_mean, 0, 255)
    painted[fade_start:start] = painted[fade_start:start] * (1 - t) + tint * t
    painted[start:] = pinned
    return Image.fromarray(painted.astype('uint8')), {'originalFloorRow': floor, 'generatedFloorRow': old,
                                                     'correctionPx': floor - old, 'sourceAnchoredFloorFromRow': start}


def main():
    record = json.loads(RECORD.read_text(encoding='utf-8'))
    manifest_path = ROOT / 'assets/decor/manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    jobs = {(j['id'], j['time']): j for j in record['edits']}
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for scene in manifest['scenes']:
        ident = scene['id']
        existing = 'night' if ident in ('scene_library', 'scene_crystal', 'scene_starobs') else 'day'
        original_path = ROOT / f'assets/decor/scenes/{ident}.png'
        original = Image.open(original_path).convert('RGB')
        scene['tod'] = {t: f'assets/decor/scenes/{ident}_{t}.png' for t in TIMES}
        for time in TIMES:
            if only and f'{ident}:{time}' != only: continue
            output = ROOT / scene['tod'][time]
            if time == existing:
                shutil.copyfile(original_path, output)
                continue
            job = jobs[ident, time]
            edited, crop = trim_padding(Image.open(job['source']).convert('RGB'))
            edited = edited.resize(SIZE, Image.Resampling.LANCZOS)
            edited, registration = register(original, edited)
            edited, floor = pin_floor(original, edited)
            small = edited.resize((512, 128), Image.Resampling.NEAREST)
            small = small.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
            small.resize(SIZE, Image.Resampling.NEAREST).save(output, optimize=True)
            job['processing'] = {'crop': crop, 'registration': registration, 'floor': floor,
                                 'grid': [512, 128], 'palette': 128, 'nearestScale': 3}
        scene['file'] = scene['tod']['night' if ident == 'scene_starobs' else 'day']
        scene['night'] = 'self'
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    RECORD.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    contact(manifest['scenes'])
    print('Saved 32 named time variants and labelled contact sheet; original paths preserved.')


def contact(scenes):
    width, height = 384, 128
    sheet = Image.new('RGB', (width * 4, height * 8), '#171b2b')
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
    for row, scene in enumerate(scenes):
        for col, time in enumerate(TIMES):
            x, y = col * width, row * height
            draw.text((x + 7, y + 5), f"{scene['id']} / {time}", fill='white', font=font)
            image = Image.open(ROOT / scene['tod'][time]).convert('RGB')
            sheet.paste(image.resize((384, 96), Image.Resampling.NEAREST), (x, y + 30))
    sheet.save(ROOT / 'docs/decor/contact-scenes-tod.png')


if __name__ == '__main__':
    main()
