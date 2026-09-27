"""產生職業造型（換色）圖：戰鬥用原尺寸 16×16 與營地用 hd 32×32 兩種。
用法：python tools/hero_skins.py   （會覆蓋 assets/skins/）
換色規則：外框與皮膚色保留、很亮的灰白（鬍子、高光）保留，其餘顏色換成目標色相。
新增造型時在 VARIANTS 加色調、在 SKINS 加（圖塊, 色調），並同步 js/content2.js 的 C.HERO_SKINS。
"""
import colorsys, os
from PIL import Image

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, 'assets', 'kenney')
OUT = os.path.join(BASE, 'assets', 'skins')

KEEP = {(63, 38, 49), (82, 56, 68), (110, 78, 88), (38, 43, 68),       # 外框
        (247, 194, 130), (225, 154, 101), (189, 108, 74)}              # 皮膚
# 色調：h 目標色相(0–1)，s 飽和度（下限／倍率），v 亮度倍率
VARIANTS = {
    'crimson': dict(h=0.99, s=0.62, v=1.0),
    'azure':   dict(h=0.58, s=0.55, v=1.05),
    'jade':    dict(h=0.40, s=0.50, v=1.0),
    'gold':    dict(h=0.12, s=0.62, v=1.08),
    'shadow':  dict(h=0.74, s=0.30, v=0.62),
    'sakura':  dict(h=0.93, s=0.38, v=1.12),
}
SKINS = [(97, 'crimson'), (97, 'gold'), (97, 'shadow'),
         (84, 'azure'), (84, 'jade'), (84, 'sakura'), (84, 'shadow'),
         (112, 'crimson'), (112, 'azure'), (112, 'shadow'),
         (99, 'sakura'), (99, 'azure'), (99, 'jade'),
         (87, 'crimson'), (87, 'azure'), (87, 'shadow')]


def recolor(rgb, var):
    if rgb in KEEP:
        return rgb
    r, g, b = [c / 255 for c in rgb]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    if s < 0.16 and v > 0.84:          # 白色、亮灰高光保留
        return rgb
    s2 = min(1, max(var['s'], s * 0.9 + var['s'] * 0.3)) if var['s'] >= 0.35 else var['s']
    v2 = min(1, v * var['v'])
    r2, g2, b2 = colorsys.hsv_to_rgb(var['h'], s2, v2)
    return (round(r2 * 255), round(g2 * 255), round(b2 * 255))


def make(tile, vname, sub):
    src = os.path.join(SRC, 'tiles' if sub == '' else 'hd', f'tile_{tile:04d}.png')
    im = Image.open(src).convert('RGBA')
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = recolor((r, g, b), VARIANTS[vname]) + (a,)
    d = os.path.join(OUT, sub)
    os.makedirs(d, exist_ok=True)
    im.save(os.path.join(d, f'tile_{tile}_{vname}.png'))


for t, v in SKINS:
    make(t, v, '')
    make(t, v, 'hd')
print('ok', len(SKINS))
