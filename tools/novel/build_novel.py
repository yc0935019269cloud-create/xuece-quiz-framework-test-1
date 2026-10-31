"""《觀瞳記》連載小說：把 docs/novel/正文/第N卷/chNN.md 轉成學習單元 JSON。

每卷一個單元（content/learn/eye_ans/novel/guantong-vN.json），每章一課，每場（以單獨一行 --- 分隔）一張 card。
用法：python tools/novel/build_novel.py  → 之後 python tools/build.py --strict
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / 'docs' / 'novel' / '正文'
OUT = ROOT / 'content' / 'learn' / 'eye_ans' / 'novel'
CN = '零一二三四五六七八九十'

VOLUMES = {
    1: ('掖庭香', '採女入宮的葉半夏，被一隻偷香囊的黑貓捲進後宮毒案。瞳孔大小、眼皮高低、眼底一點櫻桃紅，都是線索。'),
    2: ('琉璃與碎雪', '縫光燈照見角膜的五層：琉璃瞳片、深藏的舊疤、清晨的劇痛、錘打的銅、石灰與藥圃，還有半夏自己眼裡的一把碎雪。'),
    3: ('南嶺行', '出京南下闖江湖：渡口名廚的半邊臉、毒門暗器、白隼與歪頭劍客、海綿竇與眼眶裡的通道，一路走到南嶺溫家——和半夏眼裡同一種碎雪。'),
    4: ('百草谷', '藥谷裡的房水、隅角、睫狀體與葡萄膜；師父終於說出火夜，半夏知道了自己是誰。'),
    5: ('歸京', '回到京城：動眼神經的壓迫、光的四段路、光近分離、老花與近反射、辛氏環；縫光燈下的產鉗直紋與牛眼橫紋，火夜真相大白。全書完。'),
}


def cn_num(n):
    if n <= 10: return CN[n]
    if n < 20: return '十' + (CN[n - 10] if n > 10 else '')
    return CN[n // 10] + '十' + (CN[n % 10] if n % 10 else '')


def chapter(path):
    text = path.read_text(encoding='utf-8').replace('\r\n', '\n').strip()
    m = re.match(r'#\s*(.+)\n', text)
    if not m: sys.exit(f'{path}: 第一行要是「# 第X章　標題」')
    title = m.group(1).strip()
    scenes = [s.strip() for s in re.split(r'\n\s*-{3,}\s*\n', text[m.end():]) if s.strip()]
    short = re.sub(r'^第.+?章\s*', '', title)
    steps = [{'type': 'card', 'title': f'{short}・{cn_num(i + 1)}', 'body': s} for i, s in enumerate(scenes)]
    return title, steps, sum(len(re.findall(r'[\u4e00-\u9fff]', s)) for s in scenes)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for vol, (name, desc) in VOLUMES.items():
        d = SRC / f'第{cn_num(vol)}卷'
        files = sorted(d.glob('ch*.md')) if d.exists() else []
        if not files: continue
        lessons, total = [], 0
        for f in files:
            title, steps, n = chapter(f)
            total += n
            lessons.append({'id': f.stem.replace('ch', 'c'), 'title': title, 'pace': 'free', 'steps': steps})
        pack = {
            'schema': 'xd-learn/1', 'id': f'novel-guantong-v{vol}', 'subject': 'eye_ans',
            'path': ['115 大二上', '連載小說：觀瞳記'],
            'unit': f'第{cn_num(vol)}卷　{name}', 'title': f'觀瞳記・第{cn_num(vol)}卷　{name}',
            'desc': desc, 'style': 'novel', 'calm': True, 'level': 1,
            'minutes': max(10, round(total / 500)), 'order': 40 + vol,
            'source': '原創連載小說。融入 emomo 說會考、自主神經與血液供應國考重點；考點名詞有淡底線，點了看說明。考點對照：docs/novel/考點總清單.md。',
            'tags': ['連載小說', '眼解剖生理學'],
            'lessons': lessons,
        }
        out = OUT / f'guantong-v{vol}.json'
        out.write_text(json.dumps(pack, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'{out.relative_to(ROOT)}：{len(lessons)} 章，約 {total} 字')


if __name__ == '__main__':
    main()
