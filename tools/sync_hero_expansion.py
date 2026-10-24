"""Merge the authored expansion registries. PNG originals are never modified."""
import json
import re
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'docs/hero-art'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allow-missing', action='store_true', help='Prepare the registry while image workers are still running; not a completion check.')
    args = parser.parse_args()
    manifest = json.loads((ART / 'manifest.json').read_text(encoding='utf-8'))
    extras = []
    for name, expected in [('old', 40), ('new', 48)]:
        items = json.loads((ART / f'expansion-{name}-actors.json').read_text(encoding='utf-8-sig'))
        if isinstance(items, dict):
            items = items['actors']
        assert len(items) == expected, (name, len(items))
        extras.extend(items)
    by_id = {a['id']: a for a in manifest['actors']}
    for actor in extras:
        actor = dict(actor)
        actor['file'] = actor.get('src') or actor.get('file')
        actor['src'] = actor['file']
        assert args.allow_missing or (ROOT / actor['file']).is_file(), f"Missing original: {actor['file']}"
        assert re.fullmatch(r'px_(knight|mage|ranger|cleric|berserker|assassin|monk|bard)_[mf][1-8]', actor['id']), actor['id']
        by_id[actor['id']] = actor
    classes = ['knight', 'mage', 'ranger', 'cleric', 'berserker', 'assassin', 'monk', 'bard']
    actors = sorted(by_id.values(), key=lambda a: (classes.index(a['cls']), a['gender'] != 'male', int(a['id'][-1])))
    assert len(actors) == 128, len(actors)
    for cls in classes:
        for gender in ['male', 'female']:
            assert len([a for a in actors if a['cls'] == cls and a['gender'] == gender]) == 8, (cls, gender)
    manifest['actors'] = actors
    manifest['expansionDate'] = '2026-10-24'
    manifest['expansionMode'] = 'built-in image_gen; 88 new original atlases, 8 poses each'
    (ART / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    registry = [{k: a[k] for k in ['id', 'cls', 'gender', 'name', 'accent']} | {'src': a['file']} for a in actors]
    path = ROOT / 'js/heroes.js'
    source = path.read_text(encoding='utf-8')
    source, count = re.subn(r'  const ACTORS = .*?;\n  const byId', lambda _: '  const ACTORS = ' + json.dumps(registry, ensure_ascii=False, separators=(',', ':')) + ';\n  const byId', source, count=1, flags=re.S)
    assert count == 1
    path.write_text(source, encoding='utf-8')
    missing = [a['id'] for a in actors if not (ROOT / a['file']).is_file()]
    print(json.dumps({'actors': len(actors), 'new': len(extras), 'poses': len(actors) * 8, 'missing': len(missing)}))


if __name__ == '__main__':
    main()
