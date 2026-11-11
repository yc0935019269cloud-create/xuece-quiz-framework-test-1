"""從唯讀字詞正本與字母牆產生固定試煉題庫；所有驗算成功才寫入。"""
import collections
import copy
import json
import pathlib
import random

ROOT = pathlib.Path(__file__).resolve().parents[2]
PACK = ROOT / 'content/learn/korean/hangul-letters.json'
WORDS = pathlib.Path(__file__).with_name('trial_words.json')
CHO = list('ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ')
JUNG = list('ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ')
JONG = [''] + list('ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ')
DOUBLE = set('ㄳㄵㄶㄺㄻㄼㄽㄾㄿㅀㅄ')
CONF = [list(x) for x in ('ㄱㅋㄲ', 'ㄷㅌㄸ', 'ㅂㅍㅃ', 'ㅅㅆ', 'ㅈㅊㅉ', 'ㄴㄹ', 'ㅁㅂ', 'ㅇㅎ',
                               'ㅓㅗ', 'ㅕㅛ', 'ㅜㅡ', 'ㅗㅜ', 'ㅐㅔ', 'ㅒㅖ', 'ㅙㅚㅞ', 'ㅘㅝ', 'ㅟㅢ')]
VREP = {c: g[0] for g in ('ㅐㅔ', 'ㅒㅖ', 'ㅙㅚㅞ') for c in g}
TREP = {c: g[0] for g in ('ㄱㄲㅋㄳㄺ', 'ㄴㄵㄶ', 'ㄷㅅㅆㅈㅊㅌㅎ', 'ㄹㄼㄽㄾㅀ', 'ㅁㄻ', 'ㅂㅍㄿㅄ', 'ㅇ') for c in g}


def split(ch):
    n = ord(ch) - 0xAC00
    assert 0 <= n < 11172, f'不是合法韓文字塊：{ch}'
    return CHO[n // 588], JUNG[(n % 588) // 28], JONG[n % 28]


def compose(parts):
    a, b, *tail = parts
    return chr(0xAC00 + CHO.index(a) * 588 + JUNG.index(b) * 28 + JONG.index(tail[0] if tail else ''))


def normal(word):
    out = []
    for ch in word:
        a, b, c = split(ch)
        if a != 'ㅇ':
            b = {'ㅖ': 'ㅔ', 'ㅢ': 'ㅣ'}.get(b, b)
        out.append((a, VREP.get(b, b), TREP.get(c, c)))
    return tuple(out)


def near(ch, pool):
    preferred = [c for g in CONF if ch in g for c in g if c != ch and c in pool]
    return list(dict.fromkeys(preferred + [c for c in pool if c != ch]))


def mutations(word, pick):
    parts = split(word[pick])
    preferred, other = [], []
    for i, pool in enumerate((CHO, JUNG, JONG)):
        if i == 2 and pick != len(word) - 1:
            continue
        if i == 0 and pick > 0 and split(word[pick - 1])[2]:
            continue
        for c in near(parts[i], pool):
            if i == 0 and {c, parts[i]} == {'ㅇ', 'ㅎ'}:
                continue
            p = list(parts); p[i] = c
            s = compose(p)
            candidate = word[:pick] + s + word[pick + 1:]
            close = any(c in g and parts[i] in g for g in CONF) or i == 2
            (preferred if close else other).append(candidate)
    return list(dict.fromkeys(preferred + other))


def four(answer, candidates, rng, norm=lambda x: x):
    result, seen = [answer], {norm(answer)}
    for x in candidates:
        if norm(x) not in seen:
            result.append(x); seen.add(norm(x))
        if len(result) == 4:
            break
    assert len(result) == 4, f'不足四個不同選項：{answer}'
    rng.shuffle(result)
    return result


def generate(pack, words):
    rng = random.Random(201)
    groups = pack['lessons'][5]['steps'][0]['groups']
    letters = [x for g in groups[:4] for x in g['items']]
    by_ch = {x['ch']: x for x in letters}
    tails = {x['ch']: x['roman'] for g in groups[4:] for x in g['items']}

    def zy(word):
        # 逐字塊的注音近似提示，不宣稱涵蓋整句連音或緊音化。
        out = []
        for ch in word:
            a, b, c = split(ch)
            onset = '' if a == 'ㅇ' else by_ch[a]['roman'].replace(' 緊', '（緊）')
            vowel = by_ch[b]['roman']
            if a != 'ㅇ':
                vowel = by_ch[{'ㅖ': 'ㅔ', 'ㅢ': 'ㅣ'}.get(b, b)]['roman']
            out.append(onset + vowel + (('・收' + tails.get(c, tails.get(TREP.get(c), ''))) if c else ''))
        return ' ／ '.join(out)

    bank = []
    for x in letters:
        pool = CHO if x['ch'] in CHO else JUNG
        bank.append(dict(id='L1-' + x['ch'], kind='L1', dbl=False, audio=x['say'][0]['t'],
                         answer=x['ch'], options=four(x['ch'], near(x['ch'], pool), rng, lambda c: VREP.get(c, c)),
                         zy=x['roman'], zh='子音' if pool is CHO else '母音'))
    for word in words:
        w = word['w']; pick = word.get('pick', len(w) - 1)
        assert isinstance(pick, int) and 0 <= pick < len(w)
        parts = split(w[pick]); answer = [c for c in parts if c]
        common = dict(dbl=parts[2] in DOUBLE, audio=w, word=w, pick=pick, syllable=w[pick],
                      zh=word['zh'], zy=zy(w))
        if 'src' in word:
            common['src'] = word['src']
        candidates = mutations(w, pick)
        if word.get('listen') is not False:
            bank.append(dict(common, id='L2-' + w, kind='L2', answer=w,
                             options=four(w, candidates, rng, normal)))
        tiles = answer.copy()
        extras = []
        if parts[2] in DOUBLE:
            extras.extend({'ㄳ':'ㄱㅅ','ㄵ':'ㄴㅈ','ㄶ':'ㄴㅎ','ㄺ':'ㄹㄱ','ㄻ':'ㄹㅁ','ㄼ':'ㄹㅂ',
                           'ㄽ':'ㄹㅅ','ㄾ':'ㄹㅌ','ㄿ':'ㄹㅍ','ㅀ':'ㄹㅎ','ㅄ':'ㅂㅅ'}[parts[2]])
        for c, pool in zip(parts, (CHO, JUNG, JONG)):
            extras.extend(near(c, pool))
        for c in extras:
            if c and c not in tiles:
                tiles.append(c)
            if len(tiles) == 8:
                break
        rng.shuffle(tiles)
        bank.append(dict(common, id='B1-' + w, kind='B1', answer=answer, tiles=tiles))
        bank.append(dict(common, id='B2-' + w, kind='B2', answer=w[pick], parts=answer,
                         options=four(w[pick], [v[pick] for v in candidates], rng)))
    return bank


def validate(bank, words):
    assert len({q['id'] for q in bank}) == len(bank), '題目id重複'
    for q in bank:
        if q['kind'] in ('B1', 'B2'):
            parts = q['answer'] if q['kind'] == 'B1' else q['parts']
            assert compose(parts) == q['syllable']
        if q['kind'] == 'B1':
            assert 6 <= len(q['tiles']) <= 8
            assert not (collections.Counter(q['answer']) - collections.Counter(q['tiles']))
        else:
            assert len(q['options']) == len(set(q['options'])) == 4 and q['answer'] in q['options']
            if q['kind'] in ('L1', 'L2'):
                norm = normal if q['kind'] == 'L2' else lambda c: VREP.get(c, c)
                assert len({norm(x) for x in q['options']}) == 4, q['id']
        if q['kind'] in ('L2', 'B2'):
            w, pick = q['word'], q['pick']
            for opt in q['options']:
                if q['kind'] == 'B2':
                    opt = w[:pick] + opt + w[pick + 1:]
                assert len(opt) == len(w) and all(a == b for i, (a, b) in enumerate(zip(w, opt)) if i != pick)
                if opt == w:
                    continue
                a, b = split(w[pick]), split(opt[pick])
                assert sum(x != y for x, y in zip(a, b)) == 1
                if pick != len(w) - 1:
                    assert a[2] == b[2]
                if pick and split(w[pick - 1])[2]:
                    assert a[0] == b[0]
                assert {a[0], b[0]} != {'ㅇ', 'ㅎ'}
    ids = {q['id'] for q in bank}
    for w in words:
        assert 'B1-' + w['w'] in ids and 'B2-' + w['w'] in ids
        assert ('L2-' + w['w'] in ids) == (w.get('listen') is not False)
    counts = collections.Counter(q['kind'] for q in bank)
    assert counts['L1'] == 40 and counts['B1'] == counts['B2'] == len(words)
    assert counts['L2'] == sum(w.get('listen') is not False for w in words)
    print(json.dumps(dict(total=len(bank), kinds=dict(counts), dbl=sum(q['dbl'] for q in bank),
                         dbl_by_kind={k:sum(q['dbl'] for q in bank if q['kind']==k) for k in counts},
                         textbook=sum(w.get('src') == '課本' for w in words), validation='全部通過'), ensure_ascii=False))


def main():
    pack = json.loads(PACK.read_text(encoding='utf-8'))
    words = json.loads(WORDS.read_text(encoding='utf-8'))['words']
    bank = generate(pack, words)
    validate(bank, words)
    assert bank == generate(copy.deepcopy(pack), copy.deepcopy(words)), '產生結果不穩定'
    lesson = next(l for l in pack['lessons'] if l['id'] == 'l6')
    step = dict(type='trial', lang='ko', title='試煉關：聽力與拆字',
                body='選擇練習種類與題數，聽聲音、認字母，再試著把韓文字塊拆開或組起來。', bank=bank)
    lesson['steps'] = lesson['steps'][:2] + [step]
    PACK.write_text(json.dumps(pack, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
