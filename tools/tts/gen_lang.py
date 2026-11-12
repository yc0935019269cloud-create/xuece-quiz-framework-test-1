"""錄製 letters、flashcards 與 trial 步驟要念的外語發音到 assets/tts/<lang>/。

韓文用微軟神經語音 ko-KR-SunHiNeural（首爾標準語女聲，edge-tts，免費）。
檔名＝每個字的 Unicode 十六進位用 - 連接（和 js/glossary.js 的 hexSlug 一致）。
assets/tts/<lang>/_voice.json 記錄每個檔是用哪個語音錄的；語音不同或沒紀錄的檔會重錄，
所以換 VOICES 之後重跑一次就會全部換新。
用法：python tools/tts/gen_lang.py
"""
import asyncio, glob, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VOICES = {'ko': 'ko-KR-SunHiNeural'}


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
                if not s.get('lang') or s['lang'].startswith('en'):
                    continue
                if s.get('type') == 'trial':
                    out.update((s['lang'], q['audio']) for q in s.get('bank', []) if q.get('audio'))
                if s.get('type') == 'flashcards':
                    out.update((s['lang'], c['say']['t']) for c in s.get('cards', []) if (c.get('say') or {}).get('t'))
                if s.get('type') != 'letters':
                    continue
                for g in s.get('groups') or []:
                    for x in g.get('items') or []:
                        for v in x.get('say') or []:
                            out.add((s['lang'], v['t']))
                        if x.get('ex'):
                            out.add((s['lang'], x['ex']['w']))
                        if (x.get('init') or {}).get('ex'):
                            out.add((s['lang'], x['init']['ex']['w']))
    return sorted(out)


async def record(text, voice, path):
    import edge_tts
    tmp = path + '.part'
    await edge_tts.Communicate(text, voice).save(tmp)
    if os.path.getsize(tmp) < 500:
        os.remove(tmp)
        raise ValueError('too small')
    os.replace(tmp, path)


async def main():
    got = miss = 0
    manifests = {}
    for lang, t in texts():
        voice = VOICES.get(lang)
        if not voice:
            print('沒有設定語音', lang, t); miss += 1; continue
        folder = os.path.join(ROOT, 'assets', 'tts', lang)
        os.makedirs(folder, exist_ok=True)
        if lang not in manifests:
            try:
                manifests[lang] = json.load(open(os.path.join(folder, '_voice.json'), encoding='utf8'))
            except Exception:
                manifests[lang] = {}
        man, name = manifests[lang], slug(t) + '.mp3'
        path = os.path.join(folder, name)
        if os.path.exists(path) and man.get(name) == voice:
            continue
        for tries in range(3):
            try:
                await record(t, voice, path)
                man[name] = voice; got += 1
                break
            except Exception as e:
                if tries == 2:
                    print('失敗', lang, t, e); miss += 1
                else:
                    await asyncio.sleep(2)
    for lang, man in manifests.items():
        with open(os.path.join(ROOT, 'assets', 'tts', lang, '_voice.json'), 'w', encoding='utf8') as f:
            json.dump(dict(sorted(man.items())), f, ensure_ascii=False, indent=1)
            f.write('\n')
    print(f'錄製 {got} 個，失敗 {miss} 個')


if __name__ == '__main__':
    asyncio.run(main())
