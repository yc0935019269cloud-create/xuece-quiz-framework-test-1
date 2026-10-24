"""Verify generated originals as they arrive; no PNG files are edited."""
import hashlib
import json
from pathlib import Path
from PIL import Image
from hero_atlas import analyze

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'docs/hero-art'
actors = []
for group in ['old', 'new']:
    actors.extend(json.loads((ART / f'expansion-{group}-actors.json').read_text(encoding='utf-8-sig')))
report = {'expected': 88, 'ready': [], 'missing': [], 'errors': []}
seen = {}
for actor in actors:
    path = ROOT / actor['src']
    if not path.exists():
        report['missing'].append(actor['id'])
        continue
    try:
        atlas = analyze(path)
        im = Image.open(path).convert('RGBA')
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        assert digest not in seen, f"Duplicated original of {seen.get(digest)}"
        seen[digest] = actor['id']
        hashes = []
        for frame in atlas['frames']:
            x, y, w, h = (frame[k] for k in ['x', 'y', 'w', 'h'])
            hashes.append(hashlib.sha256(im.crop((x, y, x + w, y + h)).tobytes()).hexdigest())
        assert len(set(hashes)) >= 7, 'Duplicate poses'
        report['ready'].append({'id': actor['id'], 'poses': len(hashes), 'transparentFraction': atlas['transparentFraction'], 'sha256': digest})
    except Exception as exc:
        report['errors'].append({'id': actor['id'], 'error': str(exc)})
report['ok'] = len(report['ready']) == 88 and not report['errors']
(ART / 'expansion-assets-qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'ready': len(report['ready']), 'missing': len(report['missing']), 'errors': report['errors'], 'ok': report['ok']}))
