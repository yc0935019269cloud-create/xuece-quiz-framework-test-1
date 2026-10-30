"""Validate decor assets and write a machine-readable report (requires Pillow)."""
import json, re, sys
from collections import deque
from pathlib import Path
from PIL import Image
from decor_scene_assets import validate_scene

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs/decor/asset-check.json'

def components(alpha):
    w, h = alpha.size
    pixels = alpha.load()
    seen = set()
    sizes = []
    for y in range(h):
        for x in range(w):
            if not pixels[x, y] or (x, y) in seen:
                continue
            todo = deque([(x, y)])
            seen.add((x, y)); n = 0
            while todo:
                px, py = todo.popleft(); n += 1
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        xx, yy = px + dx, py + dy
                        if 0 <= xx < w and 0 <= yy < h and pixels[xx, yy] and (xx, yy) not in seen:
                            seen.add((xx, yy)); todo.append((xx, yy))
            sizes.append(n)
    return sorted(sizes, reverse=True)

def check():
    errors, warnings, results = [], [], []
    spec = (ROOT / 'docs/背景商店設計.md').read_text(encoding='utf-8')
    required_items = set(re.findall(r'^\|\s*(?:[^|]*)\|\s*((?:cabin|forest|acad|sea|jp|arc|junk)_[a-z]+)\s*\|', spec, re.M))
    required_scenes = set(re.findall(r'^\|\s*(scene_[a-z]+)\s*\|', spec, re.M))
    try:
        manifest = json.loads((ROOT / 'assets/decor/manifest.json').read_text(encoding='utf-8-sig'))
    except (OSError, ValueError) as exc:
        errors.append(f'manifest: {exc}')
        manifest = {'items': [], 'scenes': [], 'series': []}
    for key, expected in [('items', required_items), ('scenes', required_scenes)]:
        entries = manifest.get(key, [])
        ids = [e.get('id') for e in entries]
        if len(ids) != len(set(ids)): errors.append(f'{key}: duplicated ids')
        missing, extra = expected - set(ids), set(ids) - expected
        if missing: errors.append(f'{key}: missing ids: {sorted(missing)}')
        if extra: errors.append(f'{key}: unexpected ids: {sorted(extra)}')
        for entry in entries:
            ident = entry.get('id', '?'); problems = []; notices = []; alignment = None
            try:
                path = (ROOT / entry['file']).resolve()
                if not path.is_relative_to(ROOT): raise ValueError('path outside project')
                with Image.open(path) as opened:
                    im = opened.copy()
                if key == 'items':
                    if im.mode != 'RGBA': problems.append('not RGBA')
                    rgba = im.convert('RGBA'); alpha = rgba.getchannel('A'); w, h = im.size
                    if im.size != tuple(v * 4 for v in entry['px']): problems.append('size differs from px × 4')
                    if set(alpha.getdata()) - {0, 255}: problems.append('non-binary alpha')
                    if w < 17 or h < 17 or any(alpha.getpixel((x,y)) for y in range(h) for x in range(w) if x < 8 or y < 8 or x >= w-8 or y >= h-8): problems.append('outer 2 logical pixels not transparent')
                    regions = components(alpha)
                    if not regions: problems.append('empty image')
                    elif any(n < regions[0]*0.01 for n in regions[1:]): notices.append('small disconnected components: ' + str([n for n in regions[1:] if n < regions[0]*0.01]))
                    colors = {p[:3] for p in rgba.getdata() if p[3]};
                    if len(colors) > 24: problems.append(f'{len(colors)} opaque colors (max 24)')
                    if w % 4 == 0 and h % 4 == 0:
                        small = rgba.resize((w//4,h//4), Image.Resampling.NEAREST)
                        if small.resize((w,h), Image.Resampling.NEAREST).tobytes() != rgba.tobytes(): problems.append('pixels are not exact 4× blocks')
                    # Any repeated opaque background cannot be conclusively distinguished from artwork.
                    # Flag a dense, alternating two-color corner pattern for visual review.
                    corner = rgba.crop((0,0,min(w,32),min(h,32)))
                    if len({p for p in corner.getdata() if p[3]}) == 2 and sum(p[3]>0 for p in corner.getdata()) > corner.width*corner.height//2: notices.append('possible checkerboard; inspect visually')
                else:
                    if im.size != (1536,384): problems.append('scene size is not 1536×384')
                    if im.convert('RGBA').getchannel('A').getextrema() != (255,255): problems.append('scene is not opaque')
                    scene_errors, alignment = validate_scene(ROOT, entry)
                    problems.extend(scene_errors)
            except (OSError, ValueError, KeyError, TypeError) as exc:
                problems.append(str(exc))
            result = {'id': ident, 'type': key, 'errors': problems, 'warnings': notices}
            if alignment is not None: result['alignment'] = alignment
            results.append(result)
            errors.extend(f'{ident}: {x}' for x in problems)
            warnings.extend(f'{ident}: {x}' for x in notices)
    if len(manifest.get('series', [])) != 7: errors.append('series: expected 7 entries')
    report = {'ok': not errors, 'counts': {'items': len(manifest.get('items', [])), 'scenes': len(manifest.get('scenes', []))}, 'errors': errors, 'warnings': warnings, 'assets': results}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"{'PASS' if report['ok'] else 'FAIL'}: {len(errors)} errors, {len(warnings)} warnings; {OUT}")
    return 0 if report['ok'] else 1

if __name__ == '__main__': sys.exit(check())
