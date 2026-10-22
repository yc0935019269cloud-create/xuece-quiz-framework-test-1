"""下載學習單元裡 letters 步驟要念的外語發音（Google 翻譯語音）到 assets/tts/<lang>/。

檔名＝每個字的 Unicode 十六進位用 - 連接（和 js/glossary.js 的 hexSlug 一致），只下載缺的檔。
用法：python tools/tts/gen_lang.py
"""
import glob, json, os, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def slug(t):
    return '-'.join(format(ord(c), 'x') for c in t.strip())[:120]


def texts():
    out = set()
    for f in glob.glob(os.path.join(ROOT, 'content', 'learn', '**', '*.json'), recursive=True):
        try:
            pack = json.load(open(f, encoding='utf8'))
        except Exception:
            continue
        for les in pack.get('lessons') or []:
            for s in les.get('steps') or []:
                if s.get('type') != 'letters' or not s.get('lang') or s['lang'].startswith('en'):
                    continue
                for g in s.get('groups') or []:
                    for x in g.get('items') or []:
                        for v in x.get('say') or []:
                            out.add((s['lang'], v['t']))
                        if x.get('ex'):
                            out.add((s['lang'], x['ex']['w']))
    return sorted(out)


def main():
    got = miss = 0
    for lang, t in texts():
        path = os.path.join(ROOT, 'assets', 'tts', lang, slug(t) + '.mp3')
        if os.path.exists(path):
            continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        url = 'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=%s&q=%s' % (lang, urllib.parse.quote(t))
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            data = urllib.request.urlopen(req, timeout=20).read()
            if len(data) < 500:
                raise ValueError('too small')
            open(path, 'wb').write(data)
            got += 1
            time.sleep(0.3)
        except Exception as e:
            print('失敗', lang, t, e)
            miss += 1
    print(f'下載 {got} 個，失敗 {miss} 個')


if __name__ == '__main__':
    main()
