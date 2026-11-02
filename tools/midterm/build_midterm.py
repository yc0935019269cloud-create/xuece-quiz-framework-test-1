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

# 補充圖（各種角度）：tools/midterm/extra_views.json，每張圖列出構造中文名與百分比座標。
# 只加進總複習的 📍 位置，不新增學習單元；名稱必須對到上面的構造，否則停下來報錯。
EXTRA = Path(__file__).with_name('extra_views.json')
for fig in (json.loads(EXTRA.read_text(encoding='utf-8')) if EXTRA.exists() else []):
    for pt in fig['points']:
        key = next((k for k, d in registry.items() if d['zh'] == pt['zh']), None)
        assert key, f"extra_views：{fig['img']} 的「{pt['zh']}」對不到任何構造"
        view = {'img': fig['img'], 'x': pt['x'], 'y': pt['y'], 'title': fig['title'], 'from': '補充圖・' + fig['source']}
        if not any((v['img'], v['x'], v['y']) == (view['img'], view['x'], view['y']) for v in registry[key]['views']):
            registry[key]['views'].append(view)

# ⭐＝實驗課老師在逐字稿裡明說會考／考試考（2026-10-30 使用者：《會考的.html》是自己勾的，不採用）。
# 來源：E:\學習\大二上\眼解剖實驗\逐字稿\校訂逐字稿\20261016_眼解剖實驗_Turbo_01\<檔>\校訂逐字稿.txt 行號
LAB = '眼解剖實驗逐字稿 '
LAB_EXAM = [
    (r'^(額骨|蝶骨|顴骨|上[頜頷]骨|[腭顎]骨|淚骨|篩骨)$', LAB + '252005 5 L407「這七塊骨頭我考…考試都會考」'),
    (r'^(視神經管|眶上裂|眶下裂|眶上孔|眶上切跡|眶下孔|眶下管|眶下溝|篩前孔|篩後孔|鼻淚管)', LAB + '252005 5 L117「孔洞的名稱跟透過的構造…國考」'),
    (r'^(上[頜頷]竇|篩竇)$', LAB + '252005 5 L348「考試問你誰容易骨折：下方、內側」'),
    (r'^頸內動脈$', LAB + '252005 5 L423「頸內動脈…國考都會考」'),
    (r'^視神經(眼內段|眶內段|管內段|顱內段)|^視乳頭', LAB + '252005 8 L57 視神經四段「考試都有考」'),
    (r'^視神經盤$', LAB + '252005 8 L84「考這個白色的構造，不能寫視神經」'),
    (r'^(視交叉|腦下垂體|蝶竇)$', LAB + '54 L131–141「視交叉剛考試有考…真人、模型都會考」'),
    (r'^(舌回|楔葉|楔狀葉)$', LAB + '55 L100「考試問你舌回受損影響上方還是下方視野」'),
    (r'^(初級)?視覺皮質$|^紋狀皮質$', LAB + '55 L81「考試問你哪級腦區，寫紋狀皮質沒分」'),
    (r'^(鼻睫神經|額神經|淚神經|淚腺神經|滑車神經|動眼神經|外旋神經|外展神經|總腱環|肌腱環)', LAB + '56 L48–194「國考有考 肌腱環內外」「裡面的神經都要看得出來…考第幾對」'),
    (r'^(眼神經|上[頜頷]神經)', LAB + '57 L18–29「考的是海綿竇跟神經的關係」（外側壁 III、IV、V1、V2，穿過 VI）'),
]
star_keys = defaultdict(list)
unmatched_stars = []
for pat, src in LAB_EXAM:
    hit = [k for k, d in registry.items() if re.search(pat, d['zh'])]
    for k in hit: star_keys[k].append(src)
    if not hit: unmatched_stars.append(src)

manual_files = ['lab-manual-orbit', 'lab-manual-lid', 'lab-manual-vessel', 'lab-manual-visual', 'lab-manual-brain', 'lab-manual-tear']
lab_files = ['lab-visual-path', 'lab-orbit', 'lab-blood']
manual_keys = set(sum((packkeys[f] for f in manual_files), []))
lab_keys = set(sum((packkeys[f] for f in lab_files), []))
supplement = [identify('鋸齒緣', 'ora serrata'), identify('瞼板腺', 'tarsal gland')]

def item(key, tag='', count=None, star=False):
    d = dict(registry[key])
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
    groups3.append({'name': title, 'items': [item(k, count=n, star=False) for k, n, valid in found if valid for d in [registry[k]]]})

# Preserve each source row, except lab rows matching the manual by either name.
def identity(row):
    return norm(row['zh']), norm(row['en'])
manual_names = [set(), set()]
for g in groups1:
    for row in g['items']:
        for i, value in enumerate(identity(row)):
            if value: manual_names[i].add(value)
removed = [row for g in groups2 for row in g['items'] if any(value and value in manual_names[i] for i, value in enumerate(identity(row)))]
groups2 = [{'name': g['name'], 'items': [row for row in g['items'] if not any(value and value in manual_names[i] for i, value in enumerate(identity(row)))]} for g in groups2]

# Explicit anatomical ordering keeps similar names and paths adjacent while retaining duplicates.
ORDER = {
 '骨質眼窩': '鼻骨 淚骨 額骨 篩骨 蝶骨 蝶骨體 蝶骨小翼 蝶骨大翼 顴骨 顴骨顳突 顳骨 顳骨顴突 上頜骨 上頷骨腭突 腭骨 腭骨水平板 枕骨 頂骨 下頷骨 犁骨 篩骨垂直板 雞冠 中鼻甲 下鼻甲 蝶鞍 眉弓 滑車窩 淚腺窩 淚窩 外側結節 眶上孔 眶下孔 眶上裂 眶下裂 視神經管 前篩孔 後篩孔 篩板 嗅孔 圓孔 卵圓孔 棘孔 破裂孔 頸動脈管 頸靜脈孔 內耳道 舌下神經管 枕骨大孔 門齒孔 莖乳孔 頂孔 下頷孔 頦孔 上頷竇 篩竇 額竇 蝶竇 莖突 乳突 枕髁 鱗狀縫 矢狀縫 人字縫 冠狀縫 枕外隆凸 下頷窩 外耳道',
 '眼瞼與淚器': '眼瞼 前瞼 後瞼 眼輪匝肌 瞼板 瞼板腺 穆勒氏肌 外側瞼韌帶 內側瞼韌帶 淚腺 淚點 淚小管 淚囊 鼻淚管',
 '眼外肌與眼眶': '提上眼瞼肌 上直肌 下直肌 內直肌 外直肌 上斜肌 下斜肌 滑車 辛氏環',
 '眼球與眼底': '眼球 角膜 鞏膜 虹膜 睫狀體 睫狀肌 水晶體 脈絡膜 視網膜 顳側視網膜 鼻側視網膜 鋸齒緣 黃斑部 中央小凹 視神經盤',
 '動脈': '頸內動脈 眼動脈 視網膜中央動脈 睫狀視網膜動脈 顳上動脈 顳下動脈 鼻上動脈 鼻下動脈 睫狀動脈 睫狀後動脈 睫狀後長動脈 睫狀後短動脈 睫狀前動脈 虹膜大動脈環 淚動脈 眶上動脈 滑車上動脈 滑車下動脈 前篩動脈 後篩動脈 內瞼動脈 外瞼動脈 上瞼動脈弓 下瞼動脈弓 肌動脈 鼻背動脈 前脈絡叢動脈 大腦前動脈 前交通動脈 大腦中動脈 後交通動脈 大腦後動脈 威利氏環 基底動脈 椎動脈 頸外動脈 上頷動脈 中腦膜動脈 眶下動脈 顏面動脈 眼角動脈 淺顳動脈',
 '腦神經與神經節': '動眼神經 滑車神經 三叉神經 眼神經 淚腺神經 額神經 鼻睫神經 睫狀長神經 睫狀短神經 前篩神經 後篩神經 滑車上神經 滑車下神經 外旋神經 外展神經 顏面神經 睫狀神經節 翼顎神經節 上頸神經節',
 '視覺路徑': '視神經 篩板前區 篩板後區 視神經眶內段 視神經管內段 視神經顱內段 視交叉 視束 外側膝狀體 視放射 梅氏環 鮑氏環 距狀溝 視覺皮質 初級視覺皮質',
 '腦與腦幹': '大腦半球 額葉 頂葉 顳葉 枕葉 頂枕溝 中央溝 大腦縱裂 楔葉 舌回 側腦室 丘腦 中腦 上丘 上丘臂 下丘 頂蓋 橋腦 延腦 小腦 腦下垂體',
 '腦膜與其他': '硬腦膜'
}
ORDER = {k: v.split() for k, v in ORDER.items()}
def regroup(groups):
    buckets = {name: [] for name in ORDER}
    for row in (row for g in groups for row in g['items']):
        category = next((name for name, order in ORDER.items() if row['zh'] in order), '腦膜與其他')
        buckets[category].append(row)
    return [{'name': name, 'items': sorted(rows, key=lambda row: ORDER[name].index(row['zh']) if row['zh'] in ORDER[name] else len(ORDER[name]))} for name, rows in buckets.items() if rows]
groups1, groups2, groups3 = map(regroup, (groups1, groups2, groups3))

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
        {'type': 'termlist', 'title': '構造總清單', 'body': '名稱旁的 ☆ 點了收進知識筆記的星號收藏（連原圖）｜📍 位置看各張圖。', 'groups': groups},
        {'type': 'practice', 'title': '跑台模擬', 'qids': ids},
        {'type': 'recap', 'points': ['先辨認圖的方向，再找相鄰構造。', '練習同時寫出中文與英文。', '換不同切面與模型再確認一次。']}
    ]})

mock_specs = [
 ('距狀溝（禽距溝）', 'Calcarine sulcus', 'cal', ''),
 ('腦下垂體', 'Pituitary gland (hypophysis)', 'pit', ''),
 ('提上眼瞼肌', 'Levator palpebrae superioris', 'lps', ''),
 ('鼻淚管', 'Nasolacrimal duct', 'nld', ''),
 ('外側膝狀體', 'Lateral geniculate nucleus/body', 'lgn', ''),
 ('梅氏環', "Meyer's loop", 'meyer', ''),
 ('眶上裂', 'Superior orbital fissure', 'sof', ''),
 ('淚腺的眼眶部', 'Orbital part of lacrimal gland', None, ''),
 ('後短睫狀動脈', 'Short posterior ciliary arteries', 'spca', ''),
 ('硬腦膜', 'Dura mater', 'dura', ''),
 ('前睫狀動脈', 'Anterior ciliary arteries', 'aca-cil', ''),
 ('瞼板腺', 'Tarsal (meibomian) glands', 'meibomian', ''),
 ('眼角動脈', 'Angular artery', 'angular-a', ''),
 ('滑車神經', 'Trochlear nerve (CN IV)', 'cn4', ''),
 ('睫狀神經節', 'Ciliary ganglion', 'cil-gang', ''),
 ('顴骨的上頜突', 'Maxillary process of zygomatic bone', 'zygomatic', '顴骨圖位僅供大致參考，非上頜突精確標點'),
 ('中大腦動脈', 'Middle cerebral artery (MCA)', 'mca', ''),
 ('視網膜顳上小動脈', 'Superior temporal retinal arteriole', 'sta-ret', ''),
 ('外展神經', 'Abducens nerve', 'cn6', ''),
]
mock_rows = []
mock_keys = set()
for number, (zh, en, key, note) in enumerate(mock_specs, 1):
    views = [dict(v) for v in registry.get(key, {}).get('views', [])]
    if key == 'zygomatic':
        for view in views: view['title'] += '（顴骨位置，非上頜突精確標點）'
    row = {'zh': f'{number}. {zh}', 'en': en, 'views': views}
    if not views: note = (note + '；' if note else '') + '目前沒有圖'
    if note: row['tag'] = note
    mock_rows.append(row)
    if key and key != 'zygomatic': mock_keys.add(key)
mock_ids = list(dict.fromkeys(qid for key, qid in questions if key in mock_keys))
mock_steps = [
 {'type': 'intro', 'title': '模擬考', 'body': '老師給的模擬考範圍，共 19 個構造；原第 5 與第 7 項合併為梅氏環。'},
 {'type': 'termlist', 'title': '模擬考構造清單', 'body': '名稱旁的 ☆ 可收藏原圖位置；📍 位置可展開各張圖。', 'groups': [{'name': '模擬考範圍', 'items': mock_rows}]},
]
if mock_ids: mock_steps.append({'type': 'practice', 'title': '跑台模擬', 'qids': mock_ids})
mock_steps.append({'type': 'recap', 'points': ['依序辨認 19 個構造，練習中英文名稱與圖上位置。']})
lessons.append({'id': 'mock-exam', 'title': '模擬考', 'steps': mock_steps})

# Reviewed slice coordinates are maintained separately from the source atlas points.
slices = json.loads(Path(__file__).with_name('slice_points.json').read_text(encoding='utf-8'))
slice_rows = {}
for fig in slices:
    for pt in fig['points']:
        name = pt['zh'] + ' ' + pt['en']
        view = {'img': fig['image'], 'x': pt['x'], 'y': pt['y'],
                'title': fig['slice'] + ('（紅圈為大致位置）' if pt['approx'] else ''),
                'from': 'KMU, Anatomy', 'p': 'eyelab-midterm', 'l': 'slices', 'name': name}
        row = slice_rows.setdefault(pt['zh'], {'zh': pt['zh'], 'en': pt['en'], 'views': []})
        row['views'].append(view)
# Reuse those same views in existing review rows with the same Chinese name.
for lesson in lessons:
    for step in lesson['steps']:
        if step['type'] != 'termlist': continue
        for group in step['groups']:
            for row in group['items']:
                zh = re.sub(r'^\d+\.\s*', '', row['zh'])
                if zh in slice_rows: row['views'].extend(dict(v) for v in slice_rows[zh]['views'])
slice_steps = [{'type': 'termlist', 'title': '切片上的構造',
    'body': '下一頁起將逐張放大切片。標示「大致位置」的點僅供概略辨認。',
    'groups': regroup([{'items': list(slice_rows.values())}])}]
for fig in slices:
    points = []
    for pt in fig['points']:
        desc = pt.get('note', '') + ('（大致位置）' if pt['approx'] else '')
        points.append({'name': pt['zh'] + ' ' + pt['en'], 'x': pt['x'], 'y': pt['y'], 'desc': desc})
    slice_steps.append({'type': 'diagram', 'title': fig['slice'], 'img': fig['image'],
                        'mode': 'explore', 'source': fig['slice'] + '｜KMU, Anatomy', 'points': points})
slice_steps.append({'type': 'recap', 'points': ['先確認切片方向，再依相鄰構造辨認；大致位置僅供概略參考。']})
lessons.append({'id': 'slices', 'title': '切片', 'steps': slice_steps})

# Only exact review structures (including established Chinese synonyms) are selected.
brain = json.loads(Path(__file__).with_name('slice_points').joinpath('brainstem.json').read_text(encoding='utf-8-sig'))
brain_aliases = {'腦橋': '橋腦', '面神經': '顏面神經', '垂體': '腦下垂體'}
review_rows = {}
for lesson in lessons:
    for step in lesson['steps']:
        if step['type'] == 'termlist':
            for group in step['groups']:
                for row in group['items']:
                    review_rows.setdefault(re.sub(r'^\d+\.\s*', '', row['zh']), row)
brain_rows = {}
brain_points = []
for pt in brain['points']:
    zh = brain_aliases.get(pt['zh'], pt['zh'])
    if zh not in review_rows: continue
    source_row = review_rows[zh]
    name = zh + ' ' + source_row['en']
    view = {'img': brain['image'], 'x': pt['x'], 'y': pt['y'],
            'title': '腦幹' + ('背面觀' if pt['panel'] == 'dorsal' else '腹面觀'),
            'from': '教科書腦幹背面觀／腹面觀（使用者提供，原圖浮水印：康复小部落）',
            'p': 'eyelab-midterm', 'l': 'brainstem', 'name': name}
    row = brain_rows.setdefault(zh, {'zh': zh, 'en': source_row['en'], 'views': []})
    row['views'].append(view)
    brain_points.append({'name': name, 'x': pt['x'], 'y': pt['y'], 'desc': view['title']})
for lesson in lessons:
    for step in lesson['steps']:
        if step['type'] != 'termlist': continue
        for group in step['groups']:
            for row in group['items']:
                zh = re.sub(r'^\d+\.\s*', '', row['zh'])
                key = {'外旋神經': '外展神經'}.get(zh, zh)
                if key in brain_rows: row['views'] = row['views'] + [dict(v) for v in brain_rows[key]['views']]
lessons.append({'id': 'brainstem', 'title': '腦幹圖', 'steps': [
    {'type': 'termlist', 'title': '腦幹圖上的構造', 'body': '先辨認背面觀與腹面觀。', 'groups': regroup([{'items': list(brain_rows.values())}])},
    {'type': 'diagram', 'title': '腦幹背面觀／腹面觀', 'img': brain['image'], 'mode': 'explore',
     'source': '教科書腦幹背面觀／腹面觀（使用者提供，原圖浮水印：康复小部落）', 'points': brain_points},
    {'type': 'recap', 'points': ['辨認背面觀與腹面觀，並以相鄰構造確認位置。']}
]})

# Decorate only after all rows and diagram references have been assembled.
abbrevs = json.loads(Path(__file__).with_name('abbrev.json').read_text(encoding='utf-8'))
def display_abbrev(zh, en):
    zh = re.sub(r'^\d+\.\s*', '', zh)
    vals = abbrevs.get(zh, [])
    if vals and not any(re.search(r'(?<![A-Za-z0-9])' + re.escape(v) + r'(?![A-Za-z0-9])', en, re.I) for v in vals):
        return en + '\uFF08' + vals[0] + '\uFF09'
    return en
for lesson in lessons:
    for step in lesson['steps']:
        if step['type'] == 'termlist':
            for group in step['groups']:
                for row in group['items']:
                    zh = re.sub(r'^\d+\.\s*', '', row['zh'])
                    if zh in abbrevs:
                        row['en'] = display_abbrev(zh, row['en'])
                        row['abbreviations'] = abbrevs[zh]
        elif lesson['id'] in ('slices', 'brainstem') and step['type'] == 'diagram':
            for point in step['points']:
                zh, _, en = point['name'].partition(' ')
                point['name'] = zh + ' ' + display_abbrev(zh, en)

pack = {'schema': 'xd-learn/1', 'id': 'eyelab-midterm', 'subject': 'eye_anat', 'path': ['眼解剖實驗', '期中總複習', '期中總複習'], 'order': 0, 'style': 'atlas', 'title': '期中總複習（跑台）', 'unit': '期中總複習', 'desc': '實驗手冊約 70 分、正課提及約 30 分；跑台用人體切片與模型，靜脈與看不到的構造不考。', 'level': 2, 'minutes': 60, 'lessons': lessons}
OUT.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
lines = ['# 期中總複習自評', '', '計數以完整校訂逐字稿的字面別名出現次數計算；同一位置取最長名稱，歧義別名不計，校訂稿未逐段回聽，同音誤字與代稱不會自動補計。', '']
for lesson in lessons:
    groups = next(s['groups'] for s in lesson['steps'] if s['type'] == 'termlist'); items = [x for g in groups for x in g['items']]
    images = sum(len(x['views']) for x in items)
    lines.append(f"- {lesson['title']}：{len(groups)} 組、{len(items)} 列；有圖 {sum(bool(x['views']) for x in items)}、無圖 {sum(not x['views'] for x in items)}；平均 {images/len(items):.2f} 圖／列；跑台 {len(next((s['qids'] for s in lesson['steps'] if s['type'] == 'practice'), []))} 題。")
lines += ['', '## 實驗課移除重複列'] + ['- ' + row['zh'] + ' / ' + row['en'] for row in removed]
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
