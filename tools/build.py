"""刷題庫框架：資料建置工具

  content/project.json                 專案設定（標題、科目清單、存檔代號）
  content/bank/<科目id>/*.json | *.csv  題目（一個檔案 = 一個題本／章節）
  content/learn/<科目id>/*.json         學習模式單元
        │  python tools/build.py
        ▼
  data/bank.js（window.QB）、data/learn.js（window.LEARN）   ← 自動產生，請勿手改

用法（在框架根目錄執行）：
  python tools/build.py            檢查並輸出
  python tools/build.py --check    只檢查不輸出
  python tools/build.py --strict   學習單元有「節奏警告」也視為失敗
  python tools/build.py --index    另外輸出 content/_index/<科目>.tsv（題目索引，給 AI 挑題連結用）

格式規格：docs/格式_題庫.md、docs/格式_學習模式.md
"""
import csv
import glob
import hashlib
import json
import os
import re
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, 'content')
THEMES = ['lit', 'lang', 'math', 'calc', 'hist', 'sci', 'mix']
QTYPES = ['single', 'multi', 'tf', 'fill', 'open']
STEP_TYPES = ['intro', 'card', 'check', 'example', 'practice', 'recap', 'diagram', 'interactive']
CHECK_KINDS = ['single', 'multi', 'tf', 'fill', 'order', 'self']
MD_FIELDS = ['body', 'q', 'hint', 'explain', 'problem', 'tip', 'front', 'back', 'desc', 'stem', 'text', 'task', 'html']
ID_RE = r'[A-Za-z0-9][A-Za-z0-9_-]*'


class Report:
    def __init__(self):
        self.errors, self.warns = [], []

    def err(self, where, msg):
        self.errors.append(f'{where}: {msg}')

    def warn(self, where, msg):
        self.warns.append(f'{where}: {msg}')

    def show(self, label):
        mark = '✘' if self.errors else ('⚠' if self.warns else '✔')
        print(f'{mark} {label}')
        for e in self.errors:
            print('    錯誤：' + e)
        for w in self.warns:
            print('    警告：' + w)


def is_str(v):
    return isinstance(v, str) and v.strip() != ''


def join_md(v):
    if isinstance(v, list) and all(isinstance(x, str) for x in v):
        return '\n'.join(v)
    return v


def norm_md(obj):
    if isinstance(obj, dict):
        for k in list(obj):
            if k in MD_FIELDS:
                obj[k] = join_md(obj[k])
            norm_md(obj[k])
    elif isinstance(obj, list):
        for x in obj:
            norm_md(x)


def hid(*parts):
    return hashlib.sha1('|'.join(str(p) for p in parts).encode('utf-8')).hexdigest()[:8]


def rel(p):
    return os.path.relpath(p, ROOT).replace('\\', '/')


# ------------------------------------------------------------------ 專案設定
def load_project():
    p = os.path.join(CONTENT, 'project.json')
    if not os.path.exists(p):
        print('✘ 找不到 content/project.json（專案設定）')
        sys.exit(1)
    pj = json.load(open(p, encoding='utf-8'))
    R = Report()
    for k in ('id', 'title'):
        if not is_str(pj.get(k)):
            R.err('project', f'缺少 {k}')
    if pj.get('id') and not re.fullmatch(r'[a-z0-9][a-z0-9_-]*', pj['id']):
        R.err('project.id', '只能用小寫英數、_、-（它也是存檔代號，換了就等於新存檔）')
    subs = pj.get('subjects') or []
    if not subs:
        R.err('project', 'subjects 至少要有一個科目')
    seen = set()
    for i, s in enumerate(subs):
        W = f'subjects[{i}]'
        if not is_str(s.get('id')) or not re.fullmatch(r'[a-z0-9][a-z0-9_]*', s.get('id', '')):
            R.err(W, 'id 必填，小寫英數與 _（例：bio、eng_vocab）')
        elif s['id'] in seen:
            R.err(W, f'科目 id 重複：{s["id"]}')
        seen.add(s.get('id'))
        if not is_str(s.get('name')):
            R.err(W, '缺少 name')
        if s.get('theme', 'mix') not in THEMES:
            R.err(W, f'theme 必須是 {THEMES} 之一')
        if s.get('color') and not re.fullmatch(r'#[0-9a-fA-F]{6}', s['color']):
            R.err(W, 'color 要是 #RRGGBB')
        if s.get('words') is not None and (not isinstance(s['words'], list) or not all(is_str(w) for w in s['words'])):
            R.err(W, 'words 要是字串陣列（怪物名字前綴，如「細胞」「酵素」）')
    R.show('content/project.json')
    if R.errors:
        sys.exit(1)
    return pj


# ------------------------------------------------------------------ 題庫
def letters_to_idx(ans, n):
    """'B' / 'ACD' / 2 / [0,2] / 'A,C' → 排序好的 index 陣列；錯誤回傳 None"""
    if isinstance(ans, bool):
        return None
    if isinstance(ans, int):
        out = [ans]
    elif isinstance(ans, list) and all(isinstance(a, int) and not isinstance(a, bool) for a in ans):
        out = ans
    elif isinstance(ans, str):
        s = re.sub(r'[\s,，、()（）]', '', ans).upper()
        if re.fullmatch(r'[A-J]+', s):
            out = [ord(c) - 65 for c in s]
        elif re.fullmatch(r'[1-9]+', s):
            out = [int(c) - 1 for c in s]
        else:
            return None
    else:
        return None
    if not out or len(set(out)) != len(out) or not all(0 <= a < n for a in out):
        return None
    return sorted(out)


def csv_to_set(path, subj):
    """CSV（UTF-8，第一列是欄名）→ 題本 dict。欄名見 docs/格式_題庫.md。"""
    name = os.path.splitext(os.path.basename(path))[0]
    rows = list(csv.DictReader(open(path, encoding='utf-8-sig', newline='')))
    alias = {'題號': 'n', '編號': 'n', '題型': 'type', '題目': 'stem', '題幹': 'stem', '答案': 'answer', '正解': 'answer',
             '可接受答案': 'accept', '其他答案': 'accept', '詳解': 'explain', '解析': 'explain', '標籤': 'tags', '考點': 'tags',
             '圖片': 'img', '難度': 'level', 'question': 'stem', 'explanation': 'explain'}
    tmap = [('單選', 'single'), ('選擇', 'single'), ('多選', 'multi'), ('複選', 'multi'), ('是非', 'tf'), ('對錯', 'tf'),
            ('填', 'fill'), ('簡答', 'fill'), ('非選', 'open'), ('申論', 'open'), ('問答', 'open')]
    qs = []
    for r in rows:
        r = {(k or '').strip().lower(): (v or '').strip() for k, v in r.items()}
        for k in list(r):
            m = re.match(r'^(?:選項|option|choice)\s*([a-j1-9])$', k, re.I)
            if m:
                c = m.group(1).lower()
                r[c if c.isalpha() else 'abcdefghij'[int(c) - 1]] = r.pop(k)
            elif k in alias and alias[k] not in r:
                r[alias[k]] = r.pop(k)
        t = r.get('type', '')
        for zh, en in tmap:
            if t.startswith(zh):
                r['type'] = en
        if not any(r.values()):
            continue
        choices = [r[k] for k in 'abcdefghij' if r.get(k)]
        q = {'type': r.get('type') or ('single' if choices else 'open'), 'stem': r.get('stem', '').replace('\\n', '\n'),
             'answer': r.get('answer', ''), 'explain': r.get('explain', '').replace('\\n', '\n')}
        if r.get('n'):
            q['n'] = int(r['n']) if r['n'].isdigit() else r['n']
        if choices:
            q['choices'] = choices
        if r.get('accept'):
            q['accept'] = [a.strip() for a in r['accept'].split('|') if a.strip()]
        if r.get('tags'):
            q['tags'] = [t.strip() for t in re.split(r'[|、,，]', r['tags']) if t.strip()]
        if r.get('img'):
            q['img'] = [x.strip() for x in r['img'].split('|') if x.strip()]
        if r.get('level'):
            q['level'] = int(r['level']) if r['level'].isdigit() else r['level']
        if q['type'] == 'tf':
            q['answer'] = q['answer'].strip().lower() in ('true', 't', 'o', '○', '⭕', '對', '是', '正確', '1', 'yes')
        qs.append(q)
    sid = re.sub(r'[^A-Za-z0-9_-]+', '-', name).strip('-')
    if not sid or not re.search(r'[A-Za-z0-9]', sid) or len(sid) < len(name) / 2:
        sid = f'{subj}-{hid(name)}'  # 中文檔名：用雜湊產生穩定代號（改檔名＝新題本）
    return {'schema': 'xd-bank/1', 'set': {'id': sid, 'subject': subj, 'name': name}, 'questions': qs}


def expand_bundles():
    """content/ 底下的 xd-bundle/1 檔（導入素材的「下載」或 AI 整包輸出）→ 拆成題本與單元，內嵌圖片寫到框架根目錄"""
    import base64
    sets, packs, subs = [], [], []
    for f in sorted(glob.glob(os.path.join(CONTENT, '**', '*.json'), recursive=True)):
        if os.path.basename(f).startswith('_') or '_index' in f:
            continue
        try:
            d = json.load(open(f, encoding='utf-8'))
        except Exception:
            continue
        if not isinstance(d, dict) or d.get('schema') != 'xd-bundle/1':
            continue
        for k, v in (d.get('images') or {}).items():
            m = re.match(r'data:image/[\w+.-]+;base64,(.*)', v or '', re.S)
            if m and not re.match(r'^(https?:|data:|/)', k) and '..' not in k:
                out = os.path.join(ROOT, k)
                if not os.path.exists(out):
                    os.makedirs(os.path.dirname(out), exist_ok=True)
                    open(out, 'wb').write(base64.b64decode(m.group(1)))
        sets += [(f, x) for x in d.get('sets') or []]
        packs += [(f, x) for x in d.get('packs') or []]
        subs += d.get('subjects') or []
    return sets, packs, subs


def build_bank(pj, args):
    subj_ids = [s['id'] for s in pj['subjects']]
    files = sorted(f for f in glob.glob(os.path.join(CONTENT, 'bank', '**', '*.*'), recursive=True)
                   if f.lower().endswith(('.json', '.csv')) and not os.path.basename(f).startswith('_'))
    files += [('bundle', f, x) for f, x in BUNDLE[0]]
    exams, groups, questions, qids, set_ids = [], {}, [], set(), {}
    bad = 0
    for f in files:
        R = Report()
        if isinstance(f, tuple):
            f, data = f[1], json.loads(json.dumps(f[2]))
            folder = ''
            if data.get('schema') == 'xd-bundle/1' or 'questions' not in data:
                continue
        else:
            folder = os.path.basename(os.path.dirname(f))
            try:
                data = csv_to_set(f, folder) if f.lower().endswith('.csv') else json.load(open(f, encoding='utf-8'))
            except (json.JSONDecodeError, ValueError, KeyError) as e:
                print(f'✘ {rel(f)}\n    格式錯誤：{e}')
                bad += 1
                continue
            if isinstance(data, dict) and data.get('schema') == 'xd-bundle/1':
                continue
        norm_md(data)
        st = data.get('set') or {}
        if not is_str(st.get('subject')):
            st['subject'] = folder
        if not is_str(st.get('id')):
            st['id'] = re.sub(r'[^A-Za-z0-9_-]+', '-', os.path.splitext(os.path.basename(f))[0]).strip('-')
        if not re.fullmatch(ID_RE, st['id']):
            R.err('set.id', '只能用英數、_、-（檔名是中文時請在 set.id 另外指定）')
        if st['subject'] not in subj_ids:
            R.err('set.subject', f'「{st["subject"]}」不在 project.json 的科目清單 {subj_ids} 裡')
        if st.get('id') in set_ids:
            R.err('set.id', f'和 {set_ids[st["id"]]} 重複')
        if not is_str(st.get('name')):
            st['name'] = st['id']
        sid = st['id']
        # 題組
        gmap = {}
        for gi, g in enumerate(data.get('groups') or []):
            if not is_str(g.get('id')):
                R.err(f'groups[{gi}]', '缺少 id')
                continue
            if not is_str(g.get('text')) and not g.get('img'):
                R.err(f'groups[{gi}]', '題組要有 text（文章）或 img（圖片）')
            gmap[g['id']] = {'text': g.get('text') or '', 'imgs': g.get('img') or [], 'title': g.get('title') or '', 'marks': g.get('marks'), 'qs': []}
        qs = data.get('questions') or []
        if not qs:
            R.err('questions', '沒有題目')
        out = []
        for qi, q in enumerate(qs):
            W = f'questions[{qi}]'
            t = q.get('type')
            if t not in QTYPES:
                R.err(W, f'type 必須是 {QTYPES} 之一（目前：{t!r}）')
                continue
            n = q.get('n', qi + 1)
            imgs = q.get('img') or []
            if isinstance(imgs, str):
                imgs = [imgs]
            for im in imgs:
                if not os.path.exists(os.path.join(ROOT, im)):
                    R.warn(W, f'找不到圖片 {im}（路徑以框架根目錄為準，建議放 img/bank/…）')
            if not is_str(q.get('stem')) and not imgs:
                R.err(W, '要有 stem（題幹）或 img（題目圖片）')
            ch = q.get('choices')
            rec = {'id': f'{sid}-{n}', 'exam': sid, 'n': n, 'type': t, 'stem': q.get('stem') or '', 'imgs': imgs,
                   'ex': q.get('explain') or '', 'tag': '、'.join(q.get('tags') or []), 'group': None, 'labels': 'alpha'}
            if q.get('level') in (1, 2, 3):
                rec['lv'] = q['level']
            if isinstance(q.get('marks'), list):
                rec['marks'] = q['marks']
            if t in ('single', 'multi'):
                if ch is not None:
                    if not isinstance(ch, list) or len(ch) < 2 or not all(isinstance(c, str) for c in ch):
                        R.err(W, 'choices 要是至少 2 個字串')
                        continue
                    rec['choices'] = ch
                    nopt = len(ch)
                else:
                    nopt = q.get('opts')
                    if not isinstance(nopt, int) or not 2 <= nopt <= 10:
                        R.err(W, '沒有 choices 時（選項在圖片裡）要給 opts（選項數量 2~10）')
                        continue
                idx = letters_to_idx(q.get('answer'), nopt)
                if idx is None:
                    R.err(W, f'answer 格式不對：{q.get("answer")!r}（單選寫 "B"，多選寫 "ACD"，或 0 起算的數字）')
                    continue
                if t == 'single' and len(idx) != 1:
                    R.err(W, '單選題只能有一個答案（多個答案請把 type 改成 multi）')
                    continue
                if t == 'multi' and len(idx) == 1:
                    R.warn(W, '多選題只有一個正確選項（確定嗎？）')
                rec['opts'] = nopt
                rec['key'] = ''.join(chr(65 + i) for i in idx)
                rec['ans'] = rec['key']
            elif t == 'tf':
                a = q.get('answer')
                if not isinstance(a, bool):
                    R.err(W, 'tf（是非題）的 answer 要是 true 或 false')
                    continue
                rec.update(type='single', tf=True, choices=['⭕ 對', '❌ 錯'], opts=2, key='A' if a else 'B', ans='⭕ 對' if a else '❌ 錯')
            elif t == 'fill':
                a = q.get('answer')
                acc = q.get('accept')
                if isinstance(a, list):
                    acc = acc or a
                    a = a[0] if a else ''
                if not is_str(str(a)) :
                    R.err(W, 'fill 需要 answer（標準答案）')
                    continue
                rec['ans'] = str(a)
                if acc is not False:
                    acc = acc if isinstance(acc, list) else [str(a)]
                    rec['accept'] = [str(x) for x in acc]
            else:  # open
                if not is_str(q.get('answer')) and not is_str(q.get('explain')):
                    R.warn(W, '非選題沒有 answer（參考答案）也沒有 explain')
                rec['ans'] = join_md(q.get('answer')) or '（見詳解）'
            if not is_str(rec['ex']):
                R.warn(W, '沒有 explain（詳解）；可用 docs/prompts/03_既有題目補詳解.md 補上')
            elif '答案存疑' in rec['ex']:
                R.warn(W, 'AI 標記「答案存疑」，請人工確認答案後刪掉詳解裡的 ⚠ 那一行')
            if q.get('group'):
                if q['group'] not in gmap:
                    R.err(W, f'group「{q["group"]}」沒有在 groups 裡定義')
                else:
                    gk = f'{sid}:{q["group"]}'
                    rec['group'] = gk
                    gmap[q['group']]['qs'].append(n)
            if rec['id'] in qids:
                R.err(W, f'題號重複：{rec["id"]}（同一題本內 n 不能重複）')
                continue
            qids.add(rec['id'])
            out.append(rec)
        types = {}
        for q in out:
            types[q['type']] = types.get(q['type'], 0) + 1
        R.show(f'{rel(f)}  〔{st.get("name")}〕{len(out)} 題 ' + ' '.join(f'{k}×{v}' for k, v in types.items()))
        if R.errors:
            bad += 1
            for q in out:
                qids.discard(q['id'])
            continue
        set_ids[sid] = rel(f)
        exams.append({'id': sid, 'subj': st['subject'], 'name': st['name'], 'title': st.get('title') or st['name'],
                      'year': st.get('year'), 'pdf': st.get('source_url') or st.get('pdf'), 'source': st.get('source') or '',
                      'order': st.get('order', 999), 'count': len(out), 'path': st.get('path') or []})
        for gid, g in gmap.items():
            ns = [x for x in g['qs'] if isinstance(x, int)]
            groups[f'{sid}:{gid}'] = {'text': g['text'], 'imgs': g['imgs'] if isinstance(g['imgs'], list) else [g['imgs']], 'title': g['title'], 'marks': g.get('marks'), 'range': [min(ns), max(ns)] if ns else [0, 0]}
        questions.extend(out)
    exams.sort(key=lambda e: (subj_ids.index(e['subj']), e['order'], str(e.get('year') or ''), e['id']))
    order = {e['id']: i for i, e in enumerate(exams)}
    questions.sort(key=lambda q: (order[q['exam']], q['n'] if isinstance(q['n'], int) else 10 ** 6))
    print(f'\n題庫：{len(files)} 個檔案、{len(exams)} 個題本、{len(questions)} 題；失敗 {bad} 個檔案\n')
    meta = {k: pj.get(k) for k in ('id', 'title', 'subtitle', 'disclaimer', 'hub_greeting') if pj.get(k) is not None}
    subs = [{k: s[k] for k in ('id', 'name', 'region', 'theme', 'color', 'icon', 'desc', 'words') if k in s} for s in pj['subjects']]
    return {'v': 2, 'built': datetime.now().strftime('%Y-%m-%d %H:%M'), 'meta': meta, 'subjects': subs,
            'exams': exams, 'groups': groups, 'questions': questions}, bad


# ------------------------------------------------------------------ 學習模式
def check_check(c, where, R):
    kind = c.get('kind')
    if kind not in CHECK_KINDS:
        R.err(where, f'kind 必須是 {CHECK_KINDS} 之一（目前：{kind!r}）')
        return
    if not is_str(c.get('q')):
        R.err(where, '缺少題目 q')
    ans, ch = c.get('answer'), c.get('choices')
    if kind in ('single', 'multi'):
        if not isinstance(ch, list) or len(ch) < 2 or not all(is_str(x) for x in ch):
            R.err(where, 'single/multi 需要 choices（至少 2 個字串）')
            return
        if isinstance(ans, str) or (isinstance(ans, list) and any(isinstance(a, str) for a in ans)):
            idx = letters_to_idx(''.join(ans) if isinstance(ans, list) else ans, len(ch))
            if idx is not None:
                ans = c['answer'] = idx[0] if kind == 'single' and len(idx) == 1 else idx
                if kind == 'single' and isinstance(ans, list):
                    c['kind'] = kind = 'multi'
        elif kind == 'multi' and isinstance(ans, int) and not isinstance(ans, bool):
            ans = c['answer'] = [ans]
        if kind == 'single':
            if not isinstance(ans, int) or isinstance(ans, bool) or not 0 <= ans < len(ch):
                R.err(where, f'single 的 answer 要是選項字母（如 "B"）或 0～{len(ch) - 1} 的整數')
        elif not isinstance(ans, list) or not ans or len(set(ans)) != len(ans) or not all(isinstance(a, int) and not isinstance(a, bool) and 0 <= a < len(ch) for a in ans):
            R.err(where, 'multi 的 answer 要是不重複的整數陣列，例如 [0, 2]（0 = 第一個選項）')
    elif kind == 'tf':
        if not isinstance(ans, bool):
            R.err(where, 'tf 的 answer 要是 true 或 false')
    elif kind == 'fill':
        if isinstance(ans, str):
            c['answer'] = [ans]
        elif not isinstance(ans, list) or not ans or not all(is_str(a) for a in ans):
            R.err(where, 'fill 的 answer 要是字串或字串陣列（所有可接受的寫法）')
    elif kind == 'order':
        it = c.get('items')
        if not isinstance(it, list) or len(it) < 3 or not all(is_str(x) for x in it) or len(set(it)) != len(it):
            R.err(where, 'order 需要 items（依正確順序、至少 3 項、不重複）')
    elif kind == 'self':
        ans = c['answer'] = join_md(ans)
        if not is_str(ans):
            R.err(where, 'self 的 answer 要是參考答案文字')
    if not is_str(c.get('explain')) and kind != 'self':
        R.warn(where, '沒有 explain（答完後的解說），建議補上')


def check_flash(f, where, R):
    if not isinstance(f, dict) or not is_str(f.get('front')) or not is_str(f.get('back')):
        R.err(where, 'flash 要有 front 與 back')


def validate_pack(pack, Q, subj_ids):
    R = Report()
    for k in ('id', 'subject', 'unit', 'title'):
        if not is_str(pack.get(k)):
            R.err('pack', f'缺少 {k}')
    if pack.get('id') and not re.fullmatch(r'[a-z0-9][a-z0-9-]*', pack['id']):
        R.err('pack.id', '只能用小寫英數與 -')
    if pack.get('subject') not in subj_ids:
        R.err('pack.subject', f'必須是 project.json 裡的科目 {subj_ids} 之一')
    if isinstance(pack.get('path'), str):
        pack['path'] = [x.strip() for x in re.split(r'[/›>｜|]', pack['path']) if x.strip()]
    if pack.get('path') is not None and not (isinstance(pack['path'], list) and all(is_str(x) for x in pack['path'])):
        R.err('pack.path', 'path 要是字串陣列，例如 ["高一", "上學期", "第3章 細胞"]')
    lessons = pack.get('lessons')
    if not isinstance(lessons, list) or not lessons:
        R.err('pack', '缺少 lessons')
        return R
    lids = set()
    for li, L in enumerate(lessons):
        W = f'lessons[{li}]'
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', str(L.get('id', ''))):
            R.err(W, 'lesson.id 必填，只能用小寫英數與 -（例：l1）')
        elif L['id'] in lids:
            R.err(W, f'lesson.id 重複：{L["id"]}')
        lids.add(L.get('id'))
        if not is_str(L.get('title')):
            R.err(W, '缺少 title')
        steps = L.get('steps')
        if not isinstance(steps, list) or not steps:
            R.err(W, '缺少 steps')
            continue
        types = []
        for si, s in enumerate(steps):
            SW = f'{W}.steps[{si}]'
            t = s.get('type')
            types.append(t)
            if t not in STEP_TYPES:
                R.err(SW, f'type 必須是 {STEP_TYPES} 之一（目前：{t!r}）')
                continue
            if t in ('intro', 'card'):
                if not is_str(s.get('body')) and not s.get('img'):
                    R.err(SW, f'{t} 需要 body')
                if t == 'card' and not is_str(s.get('title')):
                    R.err(SW, 'card 需要 title')
                if t == 'card' and len(s.get('body') or '') > 900:
                    R.warn(SW, '概念卡超過 900 字，建議拆成兩張卡（中間插一題檢核）')
                if s.get('flash') is not None:
                    check_flash(s['flash'], SW + '.flash', R)
                for im in (s['img'] if isinstance(s.get('img'), list) else [s['img']] if s.get('img') else []):
                    if not re.match(r'^(https?:|data:)', im) and not os.path.exists(os.path.join(ROOT, im)):
                        R.warn(SW, f'找不到圖片 {im}')
            elif t == 'check':
                check_check(s, SW, R)
            elif t == 'example':
                if not is_str(s.get('problem')):
                    R.err(SW, 'example 需要 problem')
                if s.get('answer') is not None:
                    s['answer'] = join_md(s['answer'])
                st = s.get('steps')
                if not isinstance(st, list) or not st:
                    R.err(SW, 'example 需要 steps（逐步揭露的解題步驟陣列）')
                else:
                    s['steps'] = [join_md(x) for x in st]
            elif t == 'practice':
                for q in s.get('qids') or []:
                    if q not in Q:
                        R.err(SW, f'題庫沒有這題：{q}')
                pick = s.get('pick')
                if pick:
                    if not isinstance(pick.get('match'), list) or not pick['match']:
                        R.err(SW + '.pick', 'pick.match 要是關鍵字陣列')
                    for sj in pick.get('subjects') or []:
                        if sj not in subj_ids:
                            R.err(SW + '.pick', f'未知科目 {sj}')
                for ci, c in enumerate(s.get('checks') or []):
                    check_check(c, f'{SW}.checks[{ci}]', R)
                if not s.get('qids') and not pick and not s.get('checks'):
                    R.err(SW, 'practice 至少要有 qids、pick、checks 其中一種')
            elif t == 'diagram':
                if not is_str(s.get('img')):
                    R.err(SW, 'diagram 需要 img')
                elif not re.match(r'^(https?:|data:)', s['img']) and not os.path.exists(os.path.join(ROOT, s['img'])):
                    R.warn(SW, f'找不到圖片 {s["img"]}')
                pts = s.get('points')
                if not isinstance(pts, list) or not pts or not all(isinstance(x, dict) and is_str(x.get('name')) for x in pts):
                    R.err(SW, 'diagram 需要 points（每個至少有 name）')
                else:
                    for x in pts:
                        x['name'] = str(x['name']); x['desc'] = join_md(x.get('desc') or '')
                        ok = all(isinstance(x.get(k), (int, float)) and 0 <= x[k] <= 100 for k in ('x', 'y'))
                        if not ok:
                            x['x'] = x['y'] = None
                    miss = sum(1 for x in pts if x['x'] is None)
                    if miss:
                        R.warn(SW, f'{miss} 個標記沒有座標（第一次開啟時會請使用者在圖上點出位置）')
            elif t == 'interactive':
                if not is_str(s.get('html')):
                    R.err(SW, 'interactive 需要 html')
                elif re.search(r'<script[^>]+src=|<link[^>]+href=["\']https?:', s['html'], re.I):
                    R.warn(SW, '互動內容引用了外部檔案，離線時會失效（請改成全部內嵌）')
            elif t == 'recap':
                if not isinstance(s.get('points'), list) or not s['points']:
                    R.err(SW, 'recap 需要 points（重點陣列）')
                for fi, f in enumerate(s.get('flash') or []):
                    check_flash(f, f'{SW}.flash[{fi}]', R)
        if types[0] != 'intro':
            R.warn(W, '節奏：第一步建議是 intro（導入）')
        if types[-1] != 'recap':
            R.warn(W, '節奏：最後一步建議是 recap（回顧）')
        for i, t in enumerate(types):
            if t == 'card' and (i + 1 >= len(types) or types[i + 1] != 'check'):
                R.warn(f'{W}.steps[{i}]', '節奏：每張 card 後面應緊接至少一題 check')
        if 'example' not in types:
            R.warn(W, '節奏：建議至少一個 example（範例拆解）')
        if 'practice' not in types:
            R.warn(W, '節奏：建議至少一個 practice（實戰）')
        if types.count('card') > 5:
            R.warn(W, f'一課有 {types.count("card")} 張概念卡，建議 2～4 張')
        if not 6 <= len(types) <= 22:
            R.warn(W, f'一課有 {len(types)} 步，建議 8～18 步')
    return R


def assign_ids(pack):
    for L in pack['lessons']:
        base = f'{pack["id"]}/{L["id"]}'
        for s in L['steps']:
            t = s['type']
            if t == 'check':
                s.setdefault('id', 'c' + hid(base, s['q']))
            elif t == 'practice':
                for c in s.get('checks') or []:
                    c.setdefault('id', 'c' + hid(base, c['q']))
            if t == 'card' and s.get('flash'):
                s['flash'].setdefault('id', 'f' + hid(base, s['flash']['front']))
            if t == 'recap':
                for f in s.get('flash') or []:
                    f.setdefault('id', 'f' + hid(base, f['front']))


def build_learn(pj, QB, args):
    subj_ids = [s['id'] for s in pj['subjects']]
    Q = {q['id'] for q in QB['questions']}
    files = sorted(f for f in glob.glob(os.path.join(CONTENT, 'learn', '**', '*.json'), recursive=True)
                   if not os.path.basename(f).startswith('_'))
    files += [('bundle', f, x) for f, x in BUNDLE[1]]
    packs, ids, bad = [], {}, 0
    for f in files:
        if isinstance(f, tuple):
            f, pack = f[1], json.loads(json.dumps(f[2]))
        else:
            try:
                pack = json.load(open(f, encoding='utf-8'))
            except json.JSONDecodeError as e:
                print(f'✘ {rel(f)}\n    JSON 格式錯誤：第 {e.lineno} 行第 {e.colno} 欄：{e.msg}')
                bad += 1
                continue
            if isinstance(pack, dict) and pack.get('schema') == 'xd-bundle/1':
                continue
        norm_md(pack)
        R = validate_pack(pack, Q, subj_ids)
        if pack.get('id') in ids:
            R.err('pack.id', f'和 {ids[pack["id"]]} 重複')
        nl = len(pack.get('lessons') or [])
        ns = sum(len(L.get('steps') or []) for L in pack.get('lessons') or [])
        R.show(f'{rel(f)}  〔{pack.get("title", "?")}〕{nl} 課 {ns} 步')
        if R.errors or ('--strict' in args and R.warns):
            bad += 1
            continue
        ids[pack['id']] = rel(f)
        assign_ids(pack)
        packs.append(pack)
    packs.sort(key=lambda p: (subj_ids.index(p['subject']), p.get('order', 999), p['id']))
    print(f'\n學習模式：{len(files)} 個檔案、可用 {len(packs)} 個單元；失敗 {bad}\n')
    return {'v': 1, 'built': datetime.now().strftime('%Y-%m-%d %H:%M'), 'packs': packs}, bad


def write_index(QB):
    d = os.path.join(CONTENT, '_index')
    os.makedirs(d, exist_ok=True)
    ex = {e['id']: e for e in QB['exams']}
    by = {}
    for q in QB['questions']:
        by.setdefault(ex[q['exam']]['subj'], []).append(q)
    for sj, qs in by.items():
        lines = ['id\t題型\t標籤\t題幹開頭\t詳解開頭']
        for q in qs:
            clean = lambda s: re.sub(r'[\s*#`|]+', ' ', s or '').strip()[:60]
            lines.append(f'{q["id"]}\t{q["type"]}\t{q.get("tag") or ""}\t{clean(q.get("stem"))}\t{clean(q.get("ex"))}')
        open(os.path.join(d, f'{sj}.tsv'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print(f'題目索引已輸出到 content/_index/（{len(by)} 科）')


def write_js(path, var, data):
    with open(path, 'w', encoding='utf-8') as fp:
        fp.write('/* 由 tools/build.py 自動產生，請勿手改；原始檔在 content/ */\n')
        fp.write(f'window.{var}=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'已輸出 {rel(path)}（{os.path.getsize(path) // 1024} KB）')


BUNDLE = ([], [], [])


def build_prompts():
    """docs/prompts/*.md → data/prompts.js（遊戲內「📋 AI 提示詞」一鍵複製用）"""
    files = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'docs', 'prompts', '*.md'))):
        md = open(f, encoding='utf-8').read().replace('\r\n', '\n')
        title = (re.search(r'^#\s+(.+)$', md, re.M) or [None, os.path.basename(f)])[1].strip()
        intro = '\n'.join(l[1:].strip() for l in md.split('\n') if l.startswith('>'))[:600]
        blocks, heading = [], ''
        lines, i = md.split('\n'), 0
        while i < len(lines):
            L = lines[i]
            h = re.match(r'^#{2,3}\s+(.+)$', L)
            if h:
                heading = h.group(1).strip()
            m = re.match(r'^(`{3,})(\w*)\s*$', L)
            if m and m.group(2) in ('text', 'prompt', ''):
                fence, j, buf = m.group(1), i + 1, []
                while j < len(lines) and not re.match('^' + fence + r'\s*$', lines[j]):
                    buf.append(lines[j]); j += 1
                text = '\n'.join(buf).strip('\n')
                if m.group(2) in ('text', 'prompt') and len(text) > 40:
                    blocks.append({'label': heading or title, 'text': text})
                i = j + 1
                continue
            i += 1
        files.append({'file': os.path.basename(f), 'title': title, 'intro': intro, 'md': md, 'blocks': blocks})
    write_js(os.path.join(ROOT, 'data', 'prompts.js'), 'PROMPTS', {'v': 1, 'files': files})


def main():
    global BUNDLE
    args = set(sys.argv[1:])
    pj = load_project()
    BUNDLE = expand_bundles()
    for sj in BUNDLE[2]:
        if isinstance(sj, dict) and sj.get('id') and not any(x['id'] == sj['id'] for x in pj['subjects']):
            pj['subjects'].append({k: sj[k] for k in ('id', 'name', 'theme', 'desc', 'color', 'region', 'words') if sj.get(k)})
    print()
    QB, b1 = build_bank(pj, args)
    LEARN, b2 = build_learn(pj, QB, args)
    if '--index' in args:
        write_index(QB)
    if '--check' not in args:
        os.makedirs(os.path.join(ROOT, 'data'), exist_ok=True)
        write_js(os.path.join(ROOT, 'data', 'bank.js'), 'QB', QB)
        write_js(os.path.join(ROOT, 'data', 'learn.js'), 'LEARN', LEARN)
        build_prompts()
    return 1 if (b1 or b2) else 0


if __name__ == '__main__':
    sys.exit(main())
