"""Record narration for the serialized novel (learn units with style "novel").

One mp3 per page (card step): assets/novel-audio/<unit>/<lesson>-<step>.mp3, Microsoft neural
voice via edge-tts, re-encoded to 32 kbps mono. Only pages whose text changed are re-recorded;
audio for removed pages is deleted. Writes js/novel-audio-data.js (page -> file, seconds, and each
sentence's start/end time so the player can highlight the sentence being read).

Run after a chapter changes:  python tools/novel_tts.py   (needs edge-tts and ffmpeg)
"""
import asyncio, glob, hashlib, json, os, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets' / 'novel-audio'
MANIFEST = OUT / 'manifest.json'
VOICE = 'zh-TW-HsiaoChenNeural'
RATE = '+0%'


def speak_text(lesson, si, step):
    body = step.get('body') or ''
    body = re.sub(r'\[\[([^\]|]*\|)?([^\]]*)\]\]', r'\2', body)       # [[target|text]] -> text
    body = re.sub(r'\{[a-z]:([^}]*)\}', r'\1', body)                  # {o:text} colour marks
    body = re.sub(r'[*_`#>]+', '', body)
    body = re.sub(r'\n{2,}', '\n', body).strip()
    head = f"{lesson['title']}。\n" if si == 0 else ''
    return head + body


async def record(text, dst):
    """Synthesize text to dst; return (seconds, sentences) where sentences = [[start, end, text], ...] in seconds."""
    import edge_tts
    with tempfile.TemporaryDirectory() as td:
        raw = Path(td) / 'raw.mp3'
        for attempt in range(4):
            try:
                sents = []
                with open(raw, 'wb') as fh:
                    async for ch in edge_tts.Communicate(text, VOICE, rate=RATE, boundary='SentenceBoundary').stream():
                        if ch['type'] == 'audio': fh.write(ch['data'])
                        elif ch['type'] == 'SentenceBoundary':
                            sents.append([round(ch['offset'] / 1e7, 2), round((ch['offset'] + ch['duration']) / 1e7, 2), ch['text']])
                break
            except Exception as e:
                if attempt == 3: raise
                print('  retry:', e); await asyncio.sleep(3 * (attempt + 1))
        dst.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(raw), '-ac', '1', '-ar', '24000', '-b:a', '32k', str(dst)], check=True)
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(dst)], capture_output=True, text=True)
    return round(float(out.stdout.strip() or 0), 1), sents


async def main():
    man = json.loads(MANIFEST.read_text('utf8')) if MANIFEST.exists() else {}
    want = {}
    for f in sorted(glob.glob(str(ROOT / 'content' / 'learn' / '**' / '*.json'), recursive=True)):
        try: unit = json.loads(Path(f).read_text('utf8'))
        except Exception: continue
        if not isinstance(unit, dict) or unit.get('style') != 'novel': continue
        for lesson in unit.get('lessons', []):
            for si, step in enumerate(lesson.get('steps', [])):
                if step.get('type') != 'card': continue
                text = speak_text(lesson, si, step)
                h = hashlib.sha1(f'{VOICE}|{RATE}|{text}'.encode('utf8')).hexdigest()[:12]
                want[f"{unit['id']}/{lesson['id']}/{si}"] = (text, h, f"assets/novel-audio/{unit['id']}/{lesson['id']}-{si}.mp3")
    todo = [k for k, (t, h, rel) in want.items() if not (man.get(k, {}).get('h') == h and man[k].get('s') and (ROOT / rel).exists())]
    print(f'{len(want)} pages, {len(todo)} to record')
    for i, k in enumerate(todo, 1):
        text, h, rel = want[k]
        print(f'[{i}/{len(todo)}] {k} ({len(text)} chars)')
        d, sents = await record(text, ROOT / rel)
        man[k] = {'f': rel, 'h': h, 'd': d, 's': sents}
        MANIFEST.write_text(json.dumps(dict(sorted(man.items())), ensure_ascii=False, indent=1), 'utf8')   # 中途中斷也保留已錄好的
    for k in [k for k in man if k not in want]:
        p = ROOT / man.pop(k)['f']
        if p.exists() and p.resolve() not in {(ROOT / v[2]).resolve() for v in want.values()}: p.unlink()
    OUT.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(dict(sorted(man.items())), ensure_ascii=False, indent=1), 'utf8')
    data = {k: {'f': v['f'], 'd': v['d'], 's': v.get('s') or []} for k, v in sorted(man.items())}
    (ROOT / 'js' / 'novel-audio-data.js').write_text(
        '// 自動產生（tools/novel_tts.py），不要手改：連載小說每一頁的朗讀音檔、秒數與每句起訖秒數（s：[開始, 結束, 句子]）\n'
        'window.NOVEL_AUDIO = ' + json.dumps(data, ensure_ascii=False) + ';\n', 'utf8')
    total = sum(v['d'] for v in man.values())
    print(f'done: {len(man)} pages, {total / 60:.0f} min of audio')


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
