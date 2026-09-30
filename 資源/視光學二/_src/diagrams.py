"""自繪無標籤圖解底圖（可自由使用）。執行後會印出各標記點的百分比座標，貼進 u*.py 的 diagram。"""
from PIL import Image, ImageDraw
import math, os
O = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'img')
BL = (40, 40, 40); RED = (205, 45, 40); ORG = (230, 140, 20); BLU = (30, 90, 180); GR = (140, 140, 140); GRN = (40, 150, 70)
S = 2  # 超取樣


def new(W, H):
    im = Image.new('RGB', (W * S, H * S), 'white'); return im, ImageDraw.Draw(im)


def done(im, W, H, path):
    im.resize((W, H), Image.LANCZOS).save(path, optimize=True)


def P(x, y, W, H):
    return (round(x / W * 100, 1), round(y / H * 100, 1))


def line(d, a, b, fill=BL, w=3):
    d.line([(a[0] * S, a[1] * S), (b[0] * S, b[1] * S)], fill=fill, width=w * S)


def dashed(d, a, b, fill=GR, w=2, dash=10):
    L = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(int(L // dash), 1)
    for i in range(0, n, 2):
        t0, t1 = i / n, min((i + 1) / n, 1)
        line(d, (a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0), (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1), fill, w)


def circ(d, c, r, outline=BL, fill=None, w=3):
    d.ellipse([(c[0] - r) * S, (c[1] - r) * S, (c[0] + r) * S, (c[1] + r) * S], outline=outline, fill=fill, width=w * S)


def poly(d, pts, fill=None, outline=None, w=3):
    d.polygon([(x * S, y * S) for x, y in pts], fill=fill, outline=outline, width=w * S if outline else 1)


out = {}

# 1 散光光束：兩條焦線與最小錯亂圓 ------------------------------------------------
W, H = 1200, 520; im, d = new(W, H); ay = 270
line(d, (30, ay), (1170, ay), GR, 2)
d.ellipse([130 * S, 90 * S, 190 * S, 450 * S], outline=BLU, width=5 * S)  # 光學系統（透鏡）
x1, xm, x2 = 620, 760, 900
# 垂直子午線（上下緣）光線：較強，先聚成水平焦線於 x1
for yy in (110, 430):
    line(d, (160, yy), (x1, ay), RED, 3); dashed(d, (x1, ay), (x1 + (x1 - 160) * 0.62, ay + (ay - yy) * 0.62), RED, 2)
# 水平子午線（前後）以透視斜線表示：聚到 x2
for yy in (175, 365):
    line(d, (160, yy), (x2, ay), BLU, 3)
line(d, (x1 - 45, ay + 30), (x1 + 45, ay - 30), BL, 6)          # 第一焦線（水平，透視畫成斜線）
circ(d, (xm, ay), 26, BL, None, 4)                               # 最小錯亂圓
line(d, (x2, ay - 70), (x2, ay + 70), BL, 6)                     # 第二焦線（垂直）
line(d, (x1, 480), (x2, 480), BL, 2); line(d, (x1, 468), (x1, 492), BL, 2); line(d, (x2, 468), (x2, 492), BL, 2)
line(d, (1060, 120), (1060, 420), GRN, 5)                        # 視網膜（示意）
done(im, W, H, os.path.join(O, 'optom2-u2', 'dg-sturm.png'))
out['sturm'] = {'lens': P(160, 150, W, H), 'line1': P(x1 + 30, ay - 20, W, H), 'colc': P(xm, ay - 26, W, H), 'line2': P(x2, ay - 50, W, H),
                'interval': P((x1 + x2) / 2, 480, W, H), 'axis': P(1120, ay, W, H), 'retina': P(1060, 160, W, H)}

# 2 綜合驗光儀上的 JCC 鏡片（跨軸位置） ---------------------------------------------
W, H = 900, 760; im, d = new(W, H); c = (450, 380); Rr, Ri = 300, 205
circ(d, c, Rr, BL, (245, 245, 245), 5); circ(d, c, Ri, BL, (225, 235, 245), 5)
for a in range(0, 360, 5):  # 刻度（只畫上半圈，綜合驗光儀軸度 0~180）
    if a > 180: continue
    r0 = Rr - (26 if a % 15 == 0 else 14); t = math.radians(a)
    line(d, (c[0] + r0 * math.cos(t), c[1] - r0 * math.sin(t)), (c[0] + (Rr - 4) * math.cos(t), c[1] - (Rr - 4) * math.sin(t)), BL, 2)
ax = 30  # 綜合驗光儀柱鏡軸
for a in (ax, ax + 180):
    t = math.radians(a); tip = (c[0] + (Rr + 8) * math.cos(t), c[1] - (Rr + 8) * math.sin(t))
    n = (math.cos(t), -math.sin(t)); p_ = (-n[1], n[0])
    poly(d, [tip, (tip[0] + n[0] * 40 + p_[0] * 20, tip[1] + n[1] * 40 + p_[1] * 20), (tip[0] + n[0] * 40 - p_[0] * 20, tip[1] + n[1] * 40 - p_[1] * 20)], fill=BLU)
dots = {}
for a, col, k in ((ax + 45, RED, 'red'), (ax + 45 + 180, RED, 'red2'), (ax - 45, (255, 255, 255), 'white'), (ax - 45 + 180, (255, 255, 255), 'white2')):
    t = math.radians(a); p = (c[0] + 150 * math.cos(t), c[1] - 150 * math.sin(t)); dots[k] = p
    circ(d, p, 17, BL, col, 3)
# 翻轉旋鈕（兩側的把手）
for sx in (-1, 1):
    d.rounded_rectangle([(c[0] + sx * (Rr + 5) - 22) * S, (c[1] - 60) * S, (c[0] + sx * (Rr + 5) + 22) * S, (c[1] + 60) * S], radius=10 * S, fill=(90, 90, 90))
done(im, W, H, os.path.join(O, 'optom2-u2', 'dg-jcc.png'))
t = math.radians(ax)
out['jcc'] = {'red': P(*dots['red'], W, H), 'white': P(*dots['white'], W, H), 'knob': P(c[0] + Rr + 5, c[1], W, H),
              'axis': P(c[0] + (Rr + 30) * math.cos(t), c[1] - (Rr + 30) * math.sin(t), W, H), 'scale': P(c[0], c[1] - Rr + 14, W, H), 'lens': P(c[0], c[1], W, H)}

# 3 右眼（OD）視野圖：以病人自己的角度看，顳側在右 -------------------------------------
W, H = 1000, 640; im, d = new(W, H); c = (330, 270); k = 3.6   # 每度 3.6 px
lim = {0: 100, 90: 60, 180: 60, 270: 75}   # 顳側（右）100–110、上 60、鼻側（左）60、下 75
def rlim(a):
    a %= 360; t = math.radians(a)
    rx = lim[0] if math.cos(t) >= 0 else lim[180]; ry = lim[90] if math.sin(t) >= 0 else lim[270]
    return 1 / math.sqrt((math.cos(t) / rx) ** 2 + (math.sin(t) / ry) ** 2)
pts = [(c[0] + rlim(a) * k * math.cos(math.radians(a)), c[1] - rlim(a) * k * math.sin(math.radians(a))) for a in range(0, 360, 2)]
poly(d, pts, fill=(253, 240, 205), outline=ORG, w=4)
line(d, (c[0] - 60 * k - 20, c[1]), (c[0] + 100 * k + 20, c[1]), ORG, 3)
line(d, (c[0], c[1] - 60 * k - 20), (c[0], c[1] + 75 * k + 20), ORG, 3)
for r in (10, 20, 30):
    circ(d, c, r * k, (230, 190, 120), None, 1)
bs = (c[0] + 15 * k, c[1] + 1.5 * k)
d.ellipse([(bs[0] - 11) * S, (bs[1] - 16) * S, (bs[0] + 11) * S, (bs[1] + 16) * S], fill=BL)
circ(d, c, 6, BL, BL, 1)
done(im, W, H, os.path.join(O, 'optom2-u3', 'dg-vf-od.png'))
out['vf'] = {'fix': P(*c, W, H), 'bs': P(*bs, W, H), 'vert': P(c[0], c[1] - 40 * k, W, H), 'horiz': P(c[0] - 35 * k, c[1], W, H),
             'sup': P(c[0], c[1] - 60 * k, W, H), 'inf': P(c[0], c[1] + 75 * k, W, H), 'nas': P(c[0] - 60 * k, c[1], W, H), 'temp': P(c[0] + 100 * k, c[1], W, H),
             'tsq': P(c[0] + 45 * k, c[1] - 35 * k, W, H), 'niq': P(c[0] - 30 * k, c[1] + 40 * k, W, H)}

# 4 視覺路徑（由上往下看，頭的前方在上） --------------------------------------------
W, H = 1000, 1000; im, d = new(W, H)
eL, eR = (330, 150), (670, 150)
circ(d, eL, 80, BL, (240, 245, 250), 4); circ(d, eR, 80, BL, (240, 245, 250), 4)
# 視網膜：顳側（外）與鼻側（內）半
chi = (500, 380); tL, tR = (390, 520), (610, 520); lgnL, lgnR = (360, 600), (640, 600)
cortex = (500, 900)
def fiber(a, b, col, w=5): line(d, a, b, col, w)
# 左眼纖維：顳側（藍，不交叉）→ 左；鼻側（紅，交叉）→ 右
fiber((eL[0] - 55, eL[1] + 58), (chi[0] - 22, chi[1]), BLU); fiber((eL[0] + 30, eL[1] + 75), (chi[0] - 8, chi[1] - 10), RED)
fiber((eR[0] + 55, eR[1] + 58), (chi[0] + 22, chi[1]), RED); fiber((eR[0] - 30, eR[1] + 75), (chi[0] + 8, chi[1] - 10), BLU)
d.ellipse([(chi[0] - 70) * S, (chi[1] - 26) * S, (chi[0] + 70) * S, (chi[1] + 26) * S], fill=(200, 200, 200), outline=BL, width=3 * S)
fiber((chi[0] - 22, chi[1] + 10), tL, BLU); fiber((chi[0] - 6, chi[1] + 16), (tL[0] + 14, tL[1]), BLU)
fiber((chi[0] + 22, chi[1] + 10), tR, RED); fiber((chi[0] + 6, chi[1] + 16), (tR[0] - 14, tR[1]), RED)
fiber(tL, lgnL, BLU); fiber(tR, lgnR, RED)
for g in (lgnL, lgnR):
    d.ellipse([(g[0] - 34) * S, (g[1] - 22) * S, (g[0] + 34) * S, (g[1] + 22) * S], fill=(170, 150, 120), outline=BL, width=3 * S)
# 左側視放射：下方纖維繞經顳葉（Meyer's loop，往前外側）；上方纖維經頂葉直行
meyerL = [(lgnL[0] - 20, lgnL[1] + 10), (230, 560), (170, 640), (190, 760), (cortex[0] - 30, cortex[1] - 10)]
for i in range(len(meyerL) - 1): fiber(meyerL[i], meyerL[i + 1], BLU, 5)
parL = [(lgnL[0] + 5, lgnL[1] + 20), (330, 720), (cortex[0] - 20, cortex[1] - 25)]
for i in range(len(parL) - 1): fiber(parL[i], parL[i + 1], BLU, 5)
meyerR = [(lgnR[0] + 20, lgnR[1] + 10), (770, 560), (830, 640), (810, 760), (cortex[0] + 30, cortex[1] - 10)]
for i in range(len(meyerR) - 1): fiber(meyerR[i], meyerR[i + 1], RED, 5)
parR = [(lgnR[0] - 5, lgnR[1] + 20), (670, 720), (cortex[0] + 20, cortex[1] - 25)]
for i in range(len(parR) - 1): fiber(parR[i], parR[i + 1], RED, 5)
d.pieslice([(cortex[0] - 90) * S, (cortex[1] - 60) * S, (cortex[0] + 90) * S, (cortex[1] + 60) * S], 0, 180, fill=(235, 200, 200), outline=BL, width=3 * S)
line(d, (cortex[0], cortex[1] - 5), (cortex[0], cortex[1] + 60), BL, 2)
done(im, W, H, os.path.join(O, 'optom2-u3', 'dg-pathway.png'))
out['path'] = {'on': P((eL[0] + chi[0]) / 2 - 20, (eL[1] + chi[1]) / 2 + 30, W, H), 'chi': P(*chi, W, H), 'tract': P((chi[0] - 22 + tL[0]) / 2 - 10, (chi[1] + tL[1]) / 2 + 10, W, H),
               'lgn': P(*lgnL, W, H), 'meyer': P(170, 640, W, H), 'par': P(330, 720, W, H), 'v1': P(cortex[0] - 45, cortex[1] + 25, W, H),
               'nasal': P(eL[0] + 30, eL[1] + 75, W, H), 'temporal': P(eL[0] - 55, eL[1] + 58, W, H)}

for k_, v in out.items(): print(k_, v)
