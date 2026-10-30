"""Build the eye-lab midterm review from the local atlases and transcripts."""
import importlib.util
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ATLAS = ROOT / 'content/learn/eye_anat'
EXTERNAL = Path('E:/NEWTEST/eye_work/atlas/names.py')
TRANSCRIPTS = Path('E:/學習/大二上/眼解剖/逐字稿/校訂逐字稿/20261016_眼解剖_Turbo_01')
STAR_FILE = Path('E:/學習/大二上/眼解剖實驗/逐字稿/會考的.html')
OUT = ATLAS / 'midterm-review.json'
REPORT = ROOT / 'tmp/midterm/selfcheck.md'
spec = importlib.util.spec_from_file_location('atlas_names', EXTERNAL)
names = importlib.util.module_from_spec(spec)
spec.loader.exec_module(names)

def norm(s):
    return re.sub(r'[^a-z0-9\u4e00-\u9fff]', '', s.lower())

aliases = defaultdict(set)
reverse = defaultdict(set)
for key, (zh, en) in names.NAMES.items():
    for alias in zh + en:
        n = norm(alias)
        if n:
            aliases[key].add(alias)
            reverse[n].add(key)

def identify(zh, en):
    # English first; only use a Chinese alias if unambiguous.
    for name in (en, zh):
        keys = reverse.get(norm(name), set())
        if len(keys) == 1:
            return next(iter(keys))
    return 'en:' + norm(en) if norm(en) else 'zh:' + norm(zh)

def split(name):
    m = re.match(r'^\s*(Gennari 線)\s+(.*)$', name, re.I)
    if m: return m.group(1), m.group(2)
    m = re.match(r'^\s*(.*?)[\s　]*([A-Za-z][\s\S]*)$', name)
    return (m.group(1).strip(), m.group(2).strip()) if m else (name.strip(), '')

def exclude(zh, en):
    text = zh + ' ' + en
    # 骨孔（頸靜脈孔 jugular foramen）是骨頭構造，不算靜脈
    if re.search(r'孔|foramen', text, re.I) and not re.search(r'sinus', en, re.I):
        pass
    elif re.search(r'靜脈|vein|venous|cavernous sinus|sigmoid sinus|transverse sinus|superior sagittal sinus|inferior sagittal sinus|straight sinus', text, re.I):
        return '靜脈或硬膜靜脈竇'
    if re.search(r'神經核|nucleus|nuclei|神經節細胞|細胞|受器|receptor', text, re.I) and not re.search(r'外側膝狀體|lateral geniculate', text, re.I):
        return '神經核或細胞等無法在跑台大體標本辨識'
    if re.search(r'神經纖維層|photoreceptor layer|神經節細胞層|retinal pigment epithelium|微血管|capillary|自主神經叢|神經叢|plexus|視神經血管環|circle of zinn|內側縱束|medial longitudinal fasciculus|gennari', text, re.I):
        return '細微構造或僅可標大致位置，跑台大體標本無法可靠辨識'
    return ''

packs = {f.stem: json.loads(f.read_text(encoding='utf-8-sig')) for f in sorted(ATLAS.glob('*.json')) if f != OUT}
registry = {}
packkeys = defaultdict(list)
excluded = defaultdict(set)
approximate = defaultdict(set)
for filename, pack in packs.items():
    for lesson in pack['lessons']:
        for step in lesson['steps']:
            if step.get('type') != 'diagram':
                continue
            for pt in step.get('points', []):
                zh, en = split(pt['name'])
                # 「眶上動脈與靜脈」這種動靜脈合標：只留動脈（靜脈不考）
                zh = re.sub(r'與靜脈$', '', zh); en = re.sub(r'\s+and\s+veins?$', '', en, flags=re.I)
                reason = exclude(zh, en)
                if reason:
                    excluded[reason].add(pt['name']); continue
                if not zh or not en:
                    excluded['缺少中英文名稱'].add(pt['name']); continue
                key = identify(zh, en)
                entry = registry.setdefault(key, {'zh': zh, 'en': en, 'views': []})
                is_approx = bool(re.search(r'大致|概略|約略', pt.get('desc', '')))
                if is_approx: approximate[key].add(pt['name'] + ' — ' + step.get('title', '圖解'))
                # 只標大致位置的點也列出，圖說註明「大致位置」（使用者要求視網膜四分支、虹膜大動脈環等加回）
                if all(isinstance(pt.get(k), (int, float)) and 0 <= pt[k] <= 100 for k in ('x', 'y')):
                    view = {'img': step['img'], 'x': pt['x'], 'y': pt['y'], 'title': (step.get('title') or '圖解') + ('（紅圈為大致位置）' if is_approx else ''), 'from': pack['title'] + ' › ' + lesson['title'],
                            # 星號收藏用：指回原圖鑑的那一點（同 learn.js termRef）
                            'p': pack['id'], 'l': lesson['id'], 'name': pt['name']}
                    if not any((v['img'], v['x'], v['y']) == (view['img'], view['x'], view['y']) for v in entry['views']): entry['views'].append(view)
                if key not in packkeys[filename]:
                    packkeys[filename].append(key)

for key, views in approximate.items():
    excluded['僅標示概略位置的圖位（照列，圖說註明大致位置）'].update(views)
    registry[key]['views'].sort(key=lambda v: '大致位置' in v['title'])
    if not registry[key]['views']:
        excluded['所有來源都僅標示概略位置，未列構造'].add(registry[key]['zh'] + ' / ' + registry[key]['en'])
        for keys in packkeys.values():
            if key in keys: keys.remove(key)
        del registry[key]

raw = STAR_FILE.read_text(encoding='utf-8')
stars = json.loads(re.search(r'<script id="termData" type="application/json">(.*?)</script>', raw, re.S).group(1))['terms']
star_keys = defaultdict(list)
unmatched_stars = []
for term in stars:
    key = identify(term['zh'], term['en'])
    if key in registry:
        star_keys[key].append(term['zh'] + ' / ' + term['en'])
    else:
        unmatched_stars.append(term['zh'] + ' / ' + term['en'])

manual_files = ['lab-manual-orbit', 'lab-manual-lid', 'lab-manual-vessel', 'lab-manual-visual', 'lab-manual-brain', 'lab-manual-tear']
lab_files = ['lab-visual-path', 'lab-orbit', 'lab-blood']
manual_keys = set(sum((packkeys[f] for f in manual_files), []))
lab_keys = set(sum((packkeys[f] for f in lab_files), []))
supplement = [identify('鋸齒緣', 'ora serrata'), identify('瞼板腺', 'tarsal gland')]

def item(key, tag='', count=None, star=False):
    d = dict(registry[key])
    if star: d['star'] = True
    if tag: d['tag'] = tag
    if count is not None: d['count'] = count
    return d

def atlas_groups(files, other, tag):
    groups = []
    for f in files:
        items = [item(k, tag if k in other else '', star=k in star_keys) for k in packkeys[f]]
        groups.append({'name': packs[f]['title'], 'items': items})
    return groups

groups1 = atlas_groups(manual_files, lab_keys, '實驗課也有')
groups2 = atlas_groups(lab_files, manual_keys, '手冊也有')
assert all(k in registry for k in supplement), supplement
groups2.append({'name': '補充', 'items': [item(k, '手冊也有' if k in manual_keys else '', star=k in star_keys) for k in supplement]})

# Include all named anatomy candidates, even when no atlas image exists.
for key, (zh, en) in names.NAMES.items():
    if key not in registry and key not in approximate and zh and en and not exclude(zh[0], en[0]):
        registry[key] = {'zh': zh[0], 'en': en[0], 'views': []}

texts = {}
for code in ('090701', '090702', '091401', '091402', '100501', '101201', '101202'):
    texts[code] = (TRANSCRIPTS / (code + '.m4a.校訂') / '校訂逐字稿.txt').read_text(encoding='utf-8-sig')

def variants(key, d):
    vals = set(aliases.get(key, ())) | {d['zh'], d['en']}
    # Very short or generic abbreviations give false positives in prose.
    return sorted((v for v in vals if len(norm(v)) >= (2 if re.search('[\u4e00-\u9fff]', v) else 5)), key=len, reverse=True)

def count_mentions(text, values):
    # Count one mention once even when aliases overlap (e.g. 脈絡膜 and 脈絡膜動脈).
    pat = '|'.join(re.escape(v) for v in values)
    return len(list(re.finditer(pat, text, re.I))) if pat else 0

def gross(key, d):
    text = d['zh'] + ' ' + d['en']
    if exclude(d['zh'], d['en']): return False
    if re.search(r'動脈|神經節|神經|肌|骨|孔|裂|腦|皮質|丘|眼球|眼瞼|虹膜|瞳孔|視網膜|脈絡膜|睫狀體|角膜|鞏膜|視交叉|視束|視放射|視神經盤|腺|晶體|黃斑|枕葉|額葉|頂葉|顳葉|artery|nerve|ganglion|muscle|brain|cortex|optic|retina|choroid|iris|cornea|sclera|foramen|canal|fissure|gland|geniculate|circle of willis', text, re.I): return True
    return False

lecture_tables = []
groups3 = []
# Longest matching alias wins so, for example, 視網膜中央動脈 is not also
# counted as a separate mention of 視網膜. Ambiguous aliases are omitted.
all_candidates = dict(registry)
for key, (zh, en) in names.NAMES.items():
    if zh and en and key not in all_candidates:
        all_candidates[key] = {'zh': zh[0], 'en': en[0], 'views': []}
alias_keys = defaultdict(set)
for key, d in all_candidates.items():
    for v in variants(key, d): alias_keys[v.lower()].add(key)
alias_keys = {v: next(iter(ks)) for v, ks in alias_keys.items() if len(ks) == 1}
# 上課常只說「顳上、鼻下」：四分支的簡稱也算（後面接「靜脈」的在計數前先遮掉）
for short, full in (('顳上', '顳上動脈'), ('顳下', '顳下動脈'), ('鼻上', '鼻上動脈'), ('鼻下', '鼻下動脈')):
    k = next((k for k, d in all_candidates.items() if d['zh'] == full), None)
    if k: alias_keys[short] = k
patterns = [((r'(?<![a-z])' + re.escape(v) + r'(?![a-z])') if v.isascii() else re.escape(v)) for v in sorted(alias_keys, key=len, reverse=True)]
matcher = re.compile('|'.join(patterns), re.I)
for title, codes in [('眼球血液供應', ('100501', '101201', '101202')), ('眼球自主神經系統', ('090701', '090702', '091401', '091402'))]:
    text = '\n'.join(texts[c] for c in codes)
    text = re.sub(r'(顳上|顳下|鼻上|鼻下)靜脈', '〔靜脈〕', text)
    counts = defaultdict(int)
    for m in matcher.finditer(text): counts[alias_keys[m.group().lower()]] += 1
    found = []
    for key, d in all_candidates.items():
        n = counts[key]
        if n >= 3:
            found.append((key, n, key in registry and gross(key, d)))
    found.sort(key=lambda x: (-x[1], all_candidates[x[0]]['zh']))
    lecture_tables.append((title, found))
    exam_terms = {'眼球血液供應': {'睫狀視網膜動脈', '視網膜中央動脈'}, '眼球自主神經系統': {'鼻睫神經', '中腦', '內直肌', '睫狀肌'}}
    groups3.append({'name': title, 'items': [item(k, count=n, star=(d['zh'] in exam_terms[title])) for k, n, valid in found if valid for d in [registry[k]]]})

# Existing marked fill questions; round-robin groups and deduplicate qids.
questions = []
for f in sorted((ROOT / 'content/bank/eye_anat/lab').rglob('*.json')):
    data = json.loads(f.read_text(encoding='utf-8-sig'))
    for q in data['questions']:
        if q.get('type') != 'fill' or not isinstance(q.get('answer'), str) or '/' not in q['answer'] or not q.get('img'): continue
        zh, en = map(str.strip, q['answer'].split('/', 1))
        if not exclude(zh, en): questions.append((identify(zh, en), data['set']['id'] + '-' + str(q['n'])))

def qids(groups):
    queues = []
    for g in groups:
        keys = {identify(x['zh'], x['en']) for x in g['items']}
        queues.append([qid for key, qid in questions if key in keys])
    out = []
    while len(out) < 40 and any(queues):
        for queue in queues:
            while queue and queue[0] in out: queue.pop(0)
            if queue and len(out) < 40: out.append(queue.pop(0))
    return out

lessons = []
for lid, title, groups, intro in [
    ('manual', '實驗手冊總複習', groups1, '手冊第 1、2、4、5、8、10 頁，約 70 分。'),
    ('lab', '實驗課複習', groups2, '視覺路徑、骨質眼窩、血液供應，另含鋸齒緣與瞼板腺。'),
    ('lecture', '眼解剖生理學正課提及總複習', groups3, '眼球血液供應與自主神經逐字稿常提的構造，約 30 分。')]:
    ids = qids(groups)
    assert ids, lid
    lessons.append({'id': lid, 'title': title, 'steps': [
        {'type': 'intro', 'title': title, 'body': intro + '\n\n清單可搜尋、聽英文與展開各圖位置，再用紅圈題練習。'},
        {'type': 'termlist', 'title': '構造總清單', 'body': '⭐＝老師說會考｜名稱旁的 ☆ 點了收進知識筆記的星號收藏（連原圖）｜📍 位置看各張圖。', 'groups': groups},
        {'type': 'practice', 'title': '跑台模擬', 'qids': ids},
        {'type': 'recap', 'points': ['先辨認圖的方向，再找相鄰構造。', '練習同時寫出中文與英文。', '換不同切面與模型再確認一次。']}
    ]})

pack = {'schema': 'xd-learn/1', 'id': 'eyelab-midterm', 'subject': 'eye_anat', 'path': ['眼解剖實驗', '期中總複習', '期中總複習'], 'order': 0, 'style': 'atlas', 'title': '期中總複習（跑台）', 'unit': '期中總複習', 'desc': '實驗手冊約 70 分、正課提及約 30 分；跑台用人體切片與模型，靜脈與看不到的構造不考。', 'level': 2, 'minutes': 60, 'lessons': lessons}
OUT.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines = ['# 期中總複習自評', '', '計數以完整校訂逐字稿的字面別名出現次數計算；同一位置取最長名稱，歧義別名不計，校訂稿未逐段回聽，同音誤字與代稱不會自動補計。', '']
for lesson in lessons:
    groups = lesson['steps'][1]['groups']; items = [x for g in groups for x in g['items']]
    images = sum(len(x['views']) for x in items)
    lines.append(f"- {lesson['title']}：{len(groups)} 組、{len(items)} 列；有圖 {sum(bool(x['views']) for x in items)}、無圖 {sum(not x['views'] for x in items)}；平均 {images/len(items):.2f} 圖／列；跑台 {len(lesson['steps'][2]['qids'])} 題。")
lines += ['', '## 排除清單']
for reason, vals in excluded.items(): lines += ['', '### ' + reason] + ['- ' + x for x in sorted(vals)]
lines += ['', '## 實驗課星號配對']
for k, vals in star_keys.items(): lines.append('- ' + '、'.join(vals) + ' → ' + registry[k]['zh'] + ' / ' + registry[k]['en'])
lines += ['', '### 未對到圖鑑（含排除項）'] + ['- ' + x for x in unmatched_stars]
lines += ['', '## 正課會考對應', '- 鼻睫神經：091401.m4a 00:52:03.190，老師說考試考過好多次。', '- 中腦：090702.m4a 00:06:59–00:07:27，講腦幹中腦並提國考會考。', '- 內直肌、睫狀肌：091402.m4a 00:03:28–00:03:45，動眼神經分支支配構造及考試；逐字稿有一處肌名不清，未推定該處名稱。', '- 睫狀視網膜動脈：101201.m4a 00:10:01–00:11:05，提視光考試；比例逐字稿有疑義。', '- 視網膜中央動脈：101201.m4a 00:24:48–00:24:55，提之前考試的中央動脈與眼組織血供。', '- 上述為正課考試敘述或過往考題，並非本次跑台保證。滑車神經：091401.m4a 00:49:26–00:49:35 談國考模型錯誤，未明確指名本次跑台，未標星。', '', '## 正課提及次數']
for title, rows in lecture_tables:
    lines += ['', '### ' + title, '', '| 名稱 | 次數 | 狀態 |', '|---|---:|---|']
    for k, n, valid in rows:
        d = all_candidates[k]; reason = exclude(d['zh'], d['en']) or ('圖位僅為概略位置' if k in approximate and k not in registry else '非可確認大體構造')
        lines.append(f"| {d['zh']} / {d['en']} | {n} | {'收錄' if valid else reason} |")
lines += ['', '### 其他高頻排除詞', '', '以下為字面次數，屬功能、受器或化學物質，無法作跑台大體構造：']
for title, codes in [('眼球血液供應', ('100501', '101201', '101202')), ('眼球自主神經系統', ('090701', '090702', '091401', '091402'))]:
    text = '\n'.join(texts[c] for c in codes)
    for term in ('交感神經', '副交感神經', '受器', '乙醯膽鹼', '正腎上腺素', '血流', '血壓', '神經傳導物質'):
        n = text.count(term)
        if n >= 3: lines.append(f'- {title}：{term} {n} 次，功能系統、受器或物質。')
REPORT.parent.mkdir(parents=True, exist_ok=True)
REPORT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('wrote', OUT, REPORT)
