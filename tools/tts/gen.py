"""下載英文發音 mp3 到 assets/tts/<slug>.mp3（js/glossary.js 的 GLOSS.speak 會先找這裡）。
用法：先跑 collect.cjs 產生 terms.json（圖解點名稱的英文＋名詞字典 en），再 python tools/tts/gen.py。
已存在的檔案會跳過；slug 規則必須和 glossary.js 的 ttsSlug 一致。"""
import json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets' / 'tts'
def slug(t):
    t = re.sub(r'\s+', ' ', t.strip().lower())
    return re.sub(r'^-+|-+$', '', re.sub(r'[^a-z0-9]+', '-', t))[:80]
terms = json.loads((Path(__file__).parent / 'terms.json').read_text(encoding='utf-8'))
OUT.mkdir(parents=True, exist_ok=True)
done = fail = 0
for t in terms:
    s = slug(t)
    if not s: continue
    f = OUT / (s + '.mp3')
    if f.exists() and f.stat().st_size > 1000: continue
    q = urllib.parse.quote(re.sub(r'\s+', ' ', t.strip())[:180])
    url = 'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=en-US&q=' + q
    for attempt in range(3):
        try:
            data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=20).read()
            if len(data) < 1000: raise ValueError('too small')
            f.write_bytes(data); done += 1; break
        except Exception as e:
            time.sleep(2 + attempt * 3)
    else:
        fail += 1; print('FAIL', t, file=sys.stderr)
    time.sleep(0.25)
print('downloaded', done, 'failed', fail, 'total files', len(list(OUT.glob('*.mp3'))))
