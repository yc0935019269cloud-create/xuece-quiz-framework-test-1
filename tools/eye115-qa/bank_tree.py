"""Align the 115 picker with learn packs; only set.path and set.order change."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEARN = ROOT / 'content/learn/eye_ans'
BANK = ROOT / 'content/bank/eye_ans'
OVERRIDE = {'ans-trigeminal': '三叉神經與眼眶通道', 'ans-reflex': '瞳孔與調節反射',
            'ans-clinical': '腦幹神經核與臨床表現'}
GROUPS = ['眼球自主神經系統', '角膜', '眼球血液供應', '房水與睫狀體', '老師隨堂考', '答案疑義（要自己勾選才會出題）']
mapping = {}
for f in LEARN.rglob('*.json'):
    d = json.loads(f.read_text(encoding='utf-8-sig'))
    p = d.get('path', [])
    if len(p) < 3 or p[0] != '115 大二上' or p[1] not in GROUPS:
        continue
    for bank in d.get('banks', []):
        if bank in mapping:
            raise ValueError('題本重複連結: ' + bank)
        mapping[bank] = (p[1], OVERRIDE.get(d['id'], p[2]), d.get('order', 999))

changed = total = questions = 0
for f in sorted(BANK.rglob('*.json')):
    raw = f.read_text(encoding='utf-8')
    d = json.loads(raw); s = d['set']; old = s.get('path', [])
    if not old or old[0] != '115 大二上':
        continue
    total += 1; questions += len(d.get('questions', []))
    # Existing self-made sets stay directly in their group. The year is retained
    # in its original position so both setPlace and yearOf continue to work.
    if len(old) == 2 and old[1] in GROUPS:
        group = old[1]; unit_order = 0
        path = old
    elif s['id'] in mapping:
        group, unit, unit_order = mapping[s['id']]
        source = [x for x in old[1:] if re.fullmatch(r'\d{2,3}\s*年國考', x)]
        path = ['115 大二上'] + source + ['眼解剖生理學', group]
        if group != '房水與睫狀體':
            path.append(unit)
    else:
        raise ValueError(f'未分類題本 {f}: {s["id"]}')
    # Learn order determines group and unit insertion order in setTree.
    order = GROUPS.index(group) * 10000 + unit_order * 100 + (int(re.search(r'(\d{2,3})\s*年國考', ' '.join(old)).group(1)) if any(re.fullmatch(r'\d{2,3}\s*年國考', x) for x in old) else int(s.get('order', 0)) % 100)
    if s.get('path') == path and s.get('order') == order:
        continue
    # Replace only the two metadata values; preserve every other byte/layout.
    match = re.search(r'("path"\s*:\s*)\[[^\]]*\]', raw)
    if not match:
        raise ValueError(f'缺少 path: {f}')
    previous = match.group(0); indent = re.search(r'\n([ \t]*)"path"', raw).group(1)
    if '\n' in previous:
        val = '[\n' + ',\n'.join(indent + '  ' + json.dumps(x, ensure_ascii=False) for x in path) + '\n' + indent + ']'
    else:
        val = json.dumps(path, ensure_ascii=False)
    raw = raw[:match.start()] + match.group(1) + val + raw[match.end():]
    order_match = re.search(r'("order"\s*:\s*)-?\d+', raw[:raw.index('"questions"')])
    if order_match:
        raw = raw[:order_match.start()] + order_match.group(1) + str(order) + raw[order_match.end():]
    else:
        pos = raw.index('"path"'); raw = raw[:pos] + '"order": ' + str(order) + ',\n' + indent + raw[pos:]
    f.write_bytes(raw.encode('utf-8')); changed += 1
print(f'updated={changed} sets={total} questions={questions}')
