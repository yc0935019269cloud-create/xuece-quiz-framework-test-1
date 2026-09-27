"""背景音樂音量平衡：用 ffmpeg 兩階段 loudnorm 把每首歌統一到同樣的響度（-18 LUFS，峰值 -1.5 dBTP），
並去掉開頭的靜音，輸出 mp3 到 assets/music/。
用法：python tools/music_norm.py 來源檔 輸出檔名.mp3 [來源檔 輸出檔名.mp3 ...]
新增歌曲後，記得在 js/audio.js 的 BGM.TRACKS 加一行。
"""
import json, re, subprocess, sys, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, 'assets', 'music')
TARGET = 'I=-18:TP=-1.5:LRA=11'
TRIM = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1'


def dur(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def norm(src, name):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-i', src, '-af', f'{TRIM},loudnorm={TARGET}:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    m = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr)[-1])
    af = (f'{TRIM},loudnorm={TARGET}:measured_I={m["input_i"]}:measured_TP={m["input_tp"]}:measured_LRA={m["input_lra"]}'
          f':measured_thresh={m["input_thresh"]}:offset={m["target_offset"]}:linear=true')
    br = '96k' if dur(src) > 1200 else '128k'
    out = os.path.join(OUT, name)
    tmp = out + '.tmp.mp3'
    subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', '-loglevel', 'error', '-i', src, '-af', af, '-ar', '44100', '-ac', '2',
                    '-c:a', 'libmp3lame', '-b:a', br, '-map_metadata', '-1', tmp], check=True)
    os.replace(tmp, out)
    print(f'{name}: 原始 {m["input_i"]} LUFS → -18 LUFS（{br}）', flush=True)


if __name__ == '__main__':
    a = sys.argv[1:]
    for i in range(0, len(a), 2):
        norm(a[i], a[i + 1])
