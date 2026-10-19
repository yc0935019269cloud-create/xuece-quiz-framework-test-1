"""Scoped source update: posterior Baum marker, three review viewers, and Other grouping.

Regenerates only the four affected annotations with the existing atlas renderer.
Does not run the full atlas generator or change lesson/question IDs or step indices.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORK = Path('E:/NEWTEST/eye_work')
NEW = (round(190 / 798 * 100, 2), round(520 / 890 * 100, 2))
MAIN = {'實驗課（依老師講義）', '實驗手冊名詞（考試範圍）'}


def write(path, data, original):
    indent = len(re.search(r'\n( +)"', original).group(1))
    path.write_text(json.dumps(data, ensure_ascii=False, indent=indent) + '\n', encoding='utf-8')


def main():
    # Keep the shared point source consistent without re-running its broad prepare/build side effects.
    source = WORK / 'vp/bases.py'
    text = source.read_text(encoding='utf-8')
    text = re.sub(r"'鮑氏環': \(\d+, \d+\)", "'鮑氏環': (190, 520)", text)
    source.write_text(text, encoding='utf-8')

    changed = []
    figures = {}
    for path in (ROOT / 'content/learn/eye_anat').rglob('*.json'):
        raw = path.read_text(encoding='utf-8-sig')
        data = json.loads(raw)
        before = json.dumps(data, ensure_ascii=False)
        pth = data.get('path') or ['眼解剖實驗', data.get('unit') or data['title']]
        relative = pth[1:] if pth[0] == '眼解剖實驗' else pth
        if relative[0] not in MAIN and relative[0] != '其他':
            data['path'] = ['眼解剖實驗', '其他', *relative]
        for lesson in data['lessons']:
            for step in lesson['steps']:
                if step['type'] == 'diagram' and step['img'].endswith('/horiz60.jpg'):
                    for point in step['points']:
                        if 'Baum' in point['name']:
                            point.update(x=NEW[0], y=NEW[1])
                            figures[data['id']] = step
            if lesson['id'] == 'review' and '實驗課（依老師講義）' in pth:
                lesson['steps'][0]['body'] = ['每組總圖先用互動圖複習：選圖片、點數字或名稱看位置，按喇叭聽英文；原本的完整標註總圖可展開查看。再看總表，最後跑台模擬：看紅圈寫中文＋英文。']
        if before != json.dumps(data, ensure_ascii=False):
            write(path, data, raw)
            changed.append(str(path.relative_to(ROOT)))

    sys.path.insert(0, str(WORK / 'vp'))
    from annot2 import label, ring
    # New asset names invalidate image caches and keep old links working.
    manifest = {
        'eyelab-vp': [('img/eye-lab-private/vp/f049.jpg', 'label'), ('img/eye-lab-private/vp/q020.jpg', 'ring')],
        'eyelab-m-visual': [('img/eye-lab-private/m-visual/f029.jpg', 'label'), ('img/eye-lab-private/m-visual/q017.jpg', 'ring')],
    }
    replacements = {}
    for pid, files in manifest.items():
        diagram = figures[pid]
        for old, kind in files:
            new = old.replace('.jpg', '-baum-v2.jpg')
            replacements[old] = new
            if kind == 'label':
                items = [(pt['name'], pt['x'], pt['y']) for pt in diagram['points'][5:]]
                label(str(ROOT / diagram['img']), str(ROOT / new), items, big=1100)
            else:
                ring(str(ROOT / diagram['img']), str(ROOT / new), [NEW])

    for folder in ['content/learn/eye_anat', 'content/bank/eye_anat']:
        for path in (ROOT / folder).rglob('*.json'):
            raw = path.read_text(encoding='utf-8-sig')
            updated = raw
            for old, new in replacements.items():
                updated = updated.replace('"' + old + '"', '"' + new + '"')
            if raw != updated:
                path.write_text(updated, encoding='utf-8')
                if str(path.relative_to(ROOT)) not in changed:
                    changed.append(str(path.relative_to(ROOT)))
    print(json.dumps({'baum': NEW, 'changed': changed, 'assets': list(replacements.values())}, ensure_ascii=False))


if __name__ == '__main__':
    main()
