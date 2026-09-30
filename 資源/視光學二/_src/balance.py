"""重新分散單選題正確答案的字母（課程檢核題、實戰自編題、題庫）。u*.py、b*.py 之後執行。
交換選項時，詳解與提示中獨立出現的 A～D 也會一起交換。題幹或選項本身含獨立 A～D 字母的題目不動。"""
import json, glob, re, sys, os, collections, random
sys.stdout.reconfigure(encoding='utf-8')
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOK = re.compile(r'(?<![0-9A-Za-z.\-−+ /])([A-D])(?![A-Za-z0-9₀-₉/])')
LET = 'ABCD'
random.seed(115)


def txt(v):
    return '\n'.join(v) if isinstance(v, list) else (v or '')


def has_letters(c):
    t = txt(c.get('q') or c.get('stem')) + ' ' + ' '.join(c['choices'])
    return bool(re.search(r'(?<![A-Za-z0-9])[A-D](?![A-Za-z0-9])', t.replace(' D ', ' ').replace(' D，', '，')))


def swap_text(v, a, b):
    f = lambda m: b if m.group(1) == a else a if m.group(1) == b else m.group(1)
    if isinstance(v, list): return [TOK.sub(f, x) for x in v]
    return TOK.sub(f, v)


def run(items, label):
    items = [c for c in items if len(c['choices']) == 4 and c['answer'] in LET]
    cnt = collections.Counter(c['answer'] for c in items)
    print(label, 'before', dict(sorted(cnt.items())))
    target = len(items) / 4
    random.shuffle(items)
    for c in items:
        a = c['answer']
        if cnt[a] <= target + 0.5 or has_letters(c): continue
        b = min((x for x in LET if x != a), key=lambda x: cnt[x])
        if cnt[b] >= target - 0.5: continue
        i, j = LET.index(a), LET.index(b)
        c['choices'][i], c['choices'][j] = c['choices'][j], c['choices'][i]
        for k in ('explain', 'hint'):
            if c.get(k): c[k] = swap_text(c[k], a, b)
        c['answer'] = b; cnt[a] -= 1; cnt[b] += 1
    print(label, 'after ', dict(sorted(cnt.items())))


# 課程
files = {}
items = []
for f in sorted(glob.glob(os.path.join(BASE, 'content', 'learn', 'optometry', 'optom2', '*.json'))):
    d = json.load(open(f, encoding='utf-8')); files[f] = d
    for L in d['lessons']:
        for s in L['steps']:
            if s['type'] == 'check' and s['kind'] == 'single': items.append(s)
            if s['type'] == 'practice':
                items += [c for c in s.get('checks', []) if c['kind'] == 'single']
run(items, '課程')
# 題庫（每個題本分別平衡）
for f in sorted(glob.glob(os.path.join(BASE, 'content', 'bank', 'optometry', 'optom2', '*.json'))):
    d = json.load(open(f, encoding='utf-8')); files[f] = d
    run([x for x in d['questions'] if x['type'] == 'single'], os.path.basename(f))
for f, d in files.items():
    json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
