"""讓眼解剖實驗題本的分類（set.path／order）對照學習模式的目錄：
實驗課（依老師講義）→ 實驗手冊名詞（考試範圍）→ 其他。只改 path 與 order，題本 id／題目不動（進度不受影響）。
可重跑：python -X utf8 tools/eyelab-qa/bank_tree.py && python tools/build.py --strict"""
import json, glob, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
L = lambda *p: os.path.join(ROOT, *p)
units = {}
for f in glob.glob(L('content', 'learn', 'eye_anat', '*.json')):
    d = json.load(open(f, encoding='utf-8'))
    units[d['id']] = d
LAB = {'vp': 'eyelab-vp', 'orbit': 'eyelab-orbit', 'blood': 'eyelab-blood', 'm-brain': 'eyelab-m-brain', 'm-lid': 'eyelab-m-lid',
       'm-orbit': 'eyelab-m-orbit', 'm-tear': 'eyelab-m-tear', 'm-vessel': 'eyelab-m-vessel', 'm-visual': 'eyelab-m-visual'}
GROUP = {'實驗課（依老師講義）': 1, '實驗手冊名詞（考試範圍）': 2, '其他': 3}
def write(f, d):
    raw = open(f, encoding='utf-8').read()
    ind = 1 if '\n "' in raw[:200] else 2
    open(f, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=ind) + ('\n' if raw.endswith('\n') else ''))
n = 0
for f in sorted(glob.glob(L('content', 'bank', 'eye_anat', '**', '*.json'), recursive=True)):
    d = json.load(open(f, encoding='utf-8')); s = d['set']; rel = os.path.relpath(f, L('content', 'bank', 'eye_anat')).replace('\\', '/')
    old = list(s.get('path') or [])
    if rel.startswith('lab/'):
        u = units[LAB[rel.split('/')[1]]]
        lessons = [l['title'] for l in u['lessons']]
        lesson = old[-1]
        m = re.search(r'-l(\d+)-(\d+)\.json$', rel)
        path = list(u['path']) + [lesson]
        order = GROUP[u['path'][1]] * 1000 + u.get('order', 0) * 20 + (lessons.index(lesson) if lesson in lessons else 19)
    elif rel.startswith('manual/'):
        path = ['眼解剖實驗', '其他', '實驗手冊圖鑑'] + old[2:]
        order = 3200 + int(s.get('order', 0) or 0) % 1000
    elif rel.startswith('exam/'):
        path = ['眼解剖實驗', '其他'] + old[1:]
        order = 3500
    elif rel == 'eye-anat-orbit.json':
        path = list(units['eye-anat-orbit-course']['path']); order = 3001
    elif rel == 'eye-anat-visual-path.json':
        path = list(units['eye-anat-visual-path-course']['path']); order = 3002
    else:
        print('未分類', rel); continue
    if s.get('path') != path or s.get('order') != order:
        s['path'] = path; s['order'] = order; write(f, d); n += 1
print('updated', n)
