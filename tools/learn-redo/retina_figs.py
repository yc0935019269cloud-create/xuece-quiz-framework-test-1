"""眼解剖生理學重寫：視網膜兩套血供用的三張圖（同一張開放授權視網膜分層圖，統一配色：中央動脈＝橘、脈絡膜＝藍）。
輸出到 img/eye-anat-fig/retina_v2_*.jpg"""
from PIL import Image, ImageDraw, ImageFont
ROOT = 'E:/NEWTEST/新刷題庫框架 - TEST 1/'
SRC = ROOT + 'img/eye-anat-manual/retina_diag_m.jpg'
F = 'C:/Windows/Fonts/msjhbd.ttc'; FR = 'C:/Windows/Fonts/msjh.ttc'; FE = 'C:/Windows/Fonts/arial.ttf'
OR, BL, GR, INK, BG = (230, 120, 20), (25, 120, 215), (120, 120, 120), (35, 30, 45), (255, 255, 255)
X0, X1 = 285, 840          # 只留組織本體（原圖左右是塗掉的標籤區）
base = Image.open(SRC).convert('RGB').crop((X0, 0, X1, 1312))
TW, TH = base.size
def f(sz, bold=True): return ImageFont.truetype(F if bold else FR, sz)
def y(p): return p / 100 * TH   # 原圖百分比 → 像素
def x(p): return p / 100 * 1280 - X0

def canvas(left, right, top=70, bottom=70):
    W, H = left + TW + right, TH + top + bottom
    im = Image.new('RGB', (W, H), BG); im.paste(base, (left, top))
    d = ImageDraw.Draw(im)
    d.text((left + TW / 2, top / 2), '▼ 玻璃體側（光從這裡進來）', font=f(34), fill=INK, anchor='mm')
    d.text((left + TW / 2, top + TH + bottom / 2), '▲ 脈絡膜 → 鞏膜（眼球外側）', font=f(34), fill=INK, anchor='mm')
    return im, d

# ── 1. 十層（左邊編號＋兩種常見名稱；顏色＝誰供應） ──
LAYERS = [  # (編號, 名稱, 別名, y%, 顏色)
    (10, '內界膜', '內限制膜', 2.2, OR), (9, '神經纖維層', '', 5.9, OR), (8, '神經節細胞層', '', 13.5, OR),
    (7, '內叢狀層', '內網狀層', 25, OR), (6, '內核層', '內顆粒層', 37, OR), (5, '外叢狀層', '外網狀層（交界）', 48, GR),
    (4, '外核層', '外顆粒層', 59.5, BL), (3, '外界膜', '外限制膜', 73, BL), (2, '感光細胞層', '桿＋錐', 79.5, BL), (1, '色素上皮層', 'RPE', 88, BL)]
L = 640
im, d = canvas(L, 30)
rows = [(n, a, b, 70 + y(py), c) for n, a, b, py, c in LAYERS] + [(None, '布魯赫氏膜', '', 70 + y(91.4), GR), (None, '脈絡膜', '', 70 + y(97), GR)]
ly = []
for k, r in enumerate(rows):          # 標籤由上往下排，太擠就往下推（引線仍指到真正位置）
    ly.append(max(r[3], (ly[-1] + 66) if ly else 0))
over = ly[-1] - (70 + TH + 20)
if over > 0: ly = [v - over * k / (len(ly) - 1) for k, v in enumerate(ly)]
for (n, a, b, yy, c), t in zip(rows, ly):
    d.line([(L - 110, t), (L - 40, yy), (L + 40, yy)], fill=c, width=4); d.ellipse([L + 34, yy - 7, L + 48, yy + 7], fill=c)
    if n: d.text((14, t), f'{n:>2}', font=f(46), fill=c, anchor='lm')
    d.text((84, t), a, font=f(44 if n else 36), fill=c, anchor='lm')
    if b: d.text((92 + d.textlength(a, font=f(44)), t + 4), b, font=f(30, False), fill=GR, anchor='lm')
im.save(ROOT + 'img/eye-anat-fig/retina_v2_layers.jpg', quality=90)

# ── 2. 兩套血供（右邊括號） ──
R = 600
im, d = canvas(30, R)
bx = 30 + TW + 24
def bracket(y0, y1, c, lines):
    d.line([(bx, y0), (bx + 22, y0), (bx + 22, y1), (bx, y1)], fill=c, width=7)
    ym = (y0 + y1) / 2; d.line([(bx + 22, ym), (bx + 44, ym)], fill=c, width=7)
    tot = sum(s for _, s, _ in lines) + 10 * (len(lines) - 1); yy = ym - tot / 2
    for t, s, bold in lines:
        d.text((bx + 56, yy), t, font=f(s, bold), fill=c if bold else INK, anchor='lt'); yy += s + 10
bracket(70 + y(1), 70 + y(45.5), OR, [('視網膜中央動脈', 52, True), ('供應內 2/3', 46, True), ('神經纖維層～內核層', 36, False), ('5 種細胞：神經節、', 36, False), ('雙極、水平、無軸突、', 36, False), ('穆勒氏', 36, False)])
bracket(70 + y(51), 70 + y(90), BL, [('脈絡膜微血管', 52, True), ('供應外 1/3', 46, True), ('外核層～RPE', 36, False), ('2 種細胞：感光細胞、', 36, False), ('色素上皮細胞', 36, False), ('（中心小凹全靠它）', 36, False)])
ym = 70 + y(48); d.line([(30, ym), (30 + TW, ym)], fill=GR, width=3)
d.text((bx + 56, ym), '外叢狀層＝交界', font=f(36), fill=GR, anchor='lm')
# 脈絡膜往上擴散的箭頭
ax = 30 + TW - 70
for k in range(3):
    xx = 30 + 120 + k * 170
    d.line([(xx, 70 + y(97)), (xx, 70 + y(84))], fill=BL, width=8); d.polygon([(xx - 16, 70 + y(85)), (xx + 16, 70 + y(85)), (xx, 70 + y(81.5))], fill=BL)
im.save(ROOT + 'img/eye-anat-fig/retina_v2_supply.jpg', quality=90)

# ── 3. 七種細胞（橘＝中央動脈、藍＝脈絡膜） ──
CELLS = [('神經節細胞', 63, 12, OR), ('無軸突細胞', 33.5, 28, OR), ('雙極細胞', 63, 35, OR), ('穆勒氏細胞', 55.5, 45.3, OR), ('水平細胞', 50, 47, OR),
         ('感光細胞（桿＋錐）', [(48, 64), (63, 66)], None, BL), ('色素上皮細胞', 41, 88, BL)]
R = 470
im, d = canvas(30, R)
tx = 30 + TW + 30
slots = [70 + y(p) for p in (8, 21, 33, 44, 55, 72, 88)]
for (n, px, py, c), sy in zip(CELLS, slots):
    for cx, cy in ([(30 + x(a), 70 + y(b)) for a, b in px] if isinstance(px, list) else [(30 + x(px), 70 + y(py))]):
        d.line([(cx, cy), (tx - 6, sy)], fill=c, width=4); d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=c, outline=BG, width=3)
    w = d.textlength(n, font=f(40)); d.rounded_rectangle([tx - 6, sy - 32, tx + w + 14, sy + 32], 8, fill=c); d.text((tx + 4, sy), n, font=f(40), fill=BG, anchor='lm')
im.save(ROOT + 'img/eye-anat-fig/retina_v2_cells.jpg', quality=90)
print('ok')

# ── 4. 眼底（右眼）：視神經盤、四大分支、中心小凹無血管區 ──
fu = Image.open(ROOT + 'img/eye-anat-manual/fundus_od.jpg').convert('RGB')
d = ImageDraw.Draw(fu)
WH = (255, 255, 255)
def tag(xy, txt, c, anchor='lm', sz=34):
    tx, ty = xy; w = d.textlength(txt, font=f(sz)); h = sz + 14
    x0 = tx if anchor == 'lm' else tx - w - 20
    d.rounded_rectangle([x0, ty - h / 2, x0 + w + 20, ty + h / 2], 8, fill=c); d.text((x0 + 10, ty), txt, font=f(sz), fill=WH, anchor='lm')
    return x0, x0 + w + 20
def pin(p, to, c):
    d.line([p, to], fill=c, width=4); d.ellipse([p[0] - 9, p[1] - 9, p[0] + 9, p[1] + 9], fill=c, outline=WH, width=3)
FOV = (600, 600)
d.ellipse([FOV[0] - 70, FOV[1] - 70, FOV[0] + 70, FOV[1] + 70], outline=WH, width=5)
for k in range(0, 360, 24):  # 虛線圈
    pass
tag((FOV[0] - 80, FOV[1] + 120), '中心小凹：沒有血管', BL, 'lm')
DISC = (1060, 650)
pin(DISC, (DISC[0] - 10, DISC[1] + 150), OR); tag((DISC[0] - 10, DISC[1] + 150), '視神經盤', OR, 'rm')
BR = [('顳上分支', (830, 330), (560, 230), 'rm'), ('顳下分支', (880, 880), (620, 1000), 'rm'), ('鼻上分支', (1165, 478), (1160, 330), 'rm'), ('鼻下分支', (1165, 760), (1160, 930), 'rm')]
for name, p, t, an in BR:
    pin(p, t, OR); tag(t, name, OR, an, 30)
fu.save(ROOT + 'img/eye-anat-fig/retina_v2_fundus.jpg', quality=90)
print('fundus ok')

# ── 5. 中心小凹放大（從原圖重畫，只標小凹與視神經盤） ──
fv = Image.open(ROOT + 'img/eye-anat-manual/fundus_od.jpg').convert('RGB').crop((250, 380, 1150, 900))
d = ImageDraw.Draw(fv); cx, cy = 600 - 250, 600 - 380
d.ellipse([cx - 70, cy - 70, cx + 70, cy + 70], outline=WH, width=5)
w = d.textlength('中心小凹：沒有血管', font=f(40)); d.rounded_rectangle([cx - w / 2 - 12, cy + 90, cx + w / 2 + 12, cy + 150], 8, fill=BL)
d.text((cx, cy + 120), '中心小凹：沒有血管', font=f(40), fill=WH, anchor='mm')
dx, dy = 1060 - 250, 650 - 380
d.ellipse([dx - 9, dy - 9, dx + 9, dy + 9], fill=OR, outline=WH, width=3); d.line([(dx, dy), (dx - 40, dy + 150)], fill=OR, width=4)
w = d.textlength('視神經盤', font=f(40)); d.rounded_rectangle([dx - 40 - w - 24, dy + 120, dx - 40, dy + 180], 8, fill=OR); d.text((dx - 52, dy + 150), '視神經盤', font=f(40), fill=WH, anchor='rm')
fv.save(ROOT + 'img/eye-anat-fig/retina_v2_fovea.jpg', quality=90)
print('fovea ok')

# ════ blood-retina l2 ════
# ── 6. 葡萄膜＝虹膜＋睫狀體＋脈絡膜（Gray877 放大＋中文標籤） ──
g = Image.open(ROOT + 'img/eye-anat-manual/gray877.jpg').convert('RGB')
S = 2.6; g = g.resize((int(g.width * S), int(g.height * S)), Image.LANCZOS)
GW, GH = g.size
im = Image.new('RGB', (GW, GH + 150), BG); im.paste(g, (0, 0)); d = ImageDraw.Draw(im)
def gp(px, py): return (px / 100 * GW, py / 100 * GH)
def gtag(p, to, txt, c, sz=40):
    d.line([p, to], fill=c, width=5); d.ellipse([p[0] - 10, p[1] - 10, p[0] + 10, p[1] + 10], fill=c, outline=BG, width=3)
    w = d.textlength(txt, font=f(sz)); d.rounded_rectangle([to[0] - w / 2 - 12, to[1] - sz / 2 - 10, to[0] + w / 2 + 12, to[1] + sz / 2 + 10], 8, fill=c)
    d.text(to, txt, font=f(sz), fill=BG, anchor='mm')
gtag(gp(17, 28), (gp(17, 28)[0] + 210, 60), '虹膜', BL)
gtag(gp(20.5, 42), (gp(20.5, 42)[0] + 380, gp(20.5, 42)[1] - 40), '睫狀體', BL)
gtag(gp(51, 67), (gp(51, 67)[0] + 60, GH + 60), '脈絡膜', BL)
gtag(gp(43, 69), (gp(43, 69)[0] - 260, GH + 60), '視網膜（最內）', GR)
gtag(gp(65, 57), (gp(65, 57)[0] + 330, GH + 10), '鞏膜（最外）', GR)
gtag(gp(34.5, 67.5), (gp(34.5, 67.5)[0] - 330, gp(34.5, 67.5)[1] - 120), '鋸齒緣', GR, 34)
d.text((GW - 20, GH + 110), '藍色三個＝葡萄膜（連成一層）', font=f(36), fill=BL, anchor='rm')
im.save(ROOT + 'img/eye-anat-fig/retina_v2_uvea.jpg', quality=90)

# ── 7. 血液視網膜屏障：內 BRB（橘）＋外 BRB（藍） ──
R = 620
im, d = canvas(30, R)
bx = 30 + TW + 24
bracket(70 + y(3), 70 + y(42), OR, [('內 BRB', 52, True), ('視網膜血管內皮', 38, True), ('（緊密連接）', 34, False), ('＋周細胞、星狀細胞、', 34, False), ('穆勒氏細胞的終足', 34, False), ('血管走在這幾層', 30, False)])
# RPE 外框
d.rectangle([30, 70 + y(85.3), 30 + TW, 70 + y(90.6)], outline=BL, width=8)
ry = 70 + y(88)
d.line([(30 + TW + 4, ry), (bx + 40, ry)], fill=BL, width=6)
for k, (t, sz, bold) in enumerate([('外 BRB', 52, True), ('RPE 細胞之間的', 38, True), ('緊密連接', 38, True)]):
    d.text((bx + 56, ry - 150 + k * 58), t, font=f(sz, bold), fill=BL, anchor='lm')
cy_ = 70 + y(97)
d.text((bx + 56, cy_ + 10), '脈絡膜微血管：有窗孔、會漏', font=f(30), fill=GR, anchor='lm')
d.line([(30 + TW + 4, cy_), (bx + 40, cy_ + 10)], fill=GR, width=4)
mx, my = 30 + x(55.5), 70 + y(45.3)
d.ellipse([mx - 11, my - 11, mx + 11, my + 11], fill=OR, outline=BG, width=3)
d.line([(mx, my), (bx + 40, 70 + y(52))], fill=OR, width=4)
d.text((bx + 56, 70 + y(52)), '穆勒氏細胞（貫穿整層）', font=f(32), fill=OR, anchor='lm')
im.save(ROOT + 'img/eye-anat-fig/retina_v2_brb.jpg', quality=90)
print('l2 figs ok')

# ── 8. 眼底：黃斑（外層病的位置） ──
fm = Image.open(ROOT + 'img/eye-anat-manual/fundus_od.jpg').convert('RGB'); d = ImageDraw.Draw(fm)
cx, cy = 612, 628
d.ellipse([cx - 190, cy - 190, cx + 190, cy + 190], outline=BL, width=8)
d.ellipse([cx - 22, cy - 22, cx + 22, cy + 22], outline=WH, width=5)
for txt, yy, sz in (('黃斑', cy + 240, 48), ('外層病（AMD、CSR）', cy + 300, 38)):
    w = d.textlength(txt, font=f(sz)); d.rounded_rectangle([cx - w / 2 - 14, yy - sz / 2 - 10, cx + w / 2 + 14, yy + sz / 2 + 10], 8, fill=BL)
    d.text((cx, yy), txt, font=f(sz), fill=WH, anchor='mm')
d.text((cx, cy - 230), '中心小凹', font=f(36), fill=WH, anchor='mm'); d.line([(cx, cy - 205), (cx, cy - 26)], fill=WH, width=3)
dx, dy = 1060, 650
d.ellipse([dx - 10, dy - 10, dx + 10, dy + 10], fill=OR, outline=WH, width=3); d.line([(dx, dy), (dx - 30, dy + 200)], fill=OR, width=4)
w = d.textlength('視神經盤', font=f(40)); d.rounded_rectangle([dx - 30 - w / 2 - 12, dy + 170, dx - 30 + w / 2 + 12, dy + 230], 8, fill=OR); d.text((dx - 30, dy + 200), '視神經盤', font=f(40), fill=WH, anchor='mm')
fm.save(ROOT + 'img/eye-anat-fig/retina_v2_macula.jpg', quality=90)
print('macula ok')
