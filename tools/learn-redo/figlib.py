"""易讀版配圖：在真實圖片兩側加大字彩色標籤（引線指到點位，標籤自動排開不重疊）。
用法：
    from figlib import side_labels, OR, BL, ...
    side_labels('img/eye-anat-manual/gray515.jpg', 'img/eye-anat-fig/v2_xxx.jpg',
                [('眼角動脈', (82, 51), PU), ('淚動脈', (34, 40), OR, 'L')],
                crop=(0, 0, 100, 100), width=1100, title='…', legend=[('橘＝內頸動脈系統', OR)])
點位是原圖的百分比座標（0～100）；第四個值 'L'／'R' 指定標籤放哪一邊（省略則依 x 自動）。"""
from PIL import Image, ImageDraw, ImageFont
ROOT = 'E:/NEWTEST/新刷題庫框架 - TEST 1/'
F, FR = 'C:/Windows/Fonts/msjhbd.ttc', 'C:/Windows/Fonts/msjh.ttc'
OR, BL, GR, RD, GN, PU, YE = (230, 120, 20), (25, 120, 215), (120, 120, 120), (210, 50, 50), (40, 150, 70), (140, 80, 200), (200, 150, 0)
INK, WH = (35, 30, 45), (255, 255, 255)


def font(sz, bold=True):
    return ImageFont.truetype(F if bold else FR, sz)


def side_labels(src, out, items, crop=None, width=1100, fs=40, margin=None, title=None, legend=None, gap=14, dot=11):
    im = Image.open(ROOT + src).convert('RGB')
    W0, H0 = im.size
    c = crop or (0, 0, 100, 100)
    box = (int(W0 * c[0] / 100), int(H0 * c[1] / 100), int(W0 * c[2] / 100), int(H0 * c[3] / 100))
    im = im.crop(box)
    s = width / im.width
    im = im.resize((width, int(im.height * s)), Image.LANCZOS)
    W, H = im.size
    tmp = ImageDraw.Draw(Image.new('RGB', (1, 1)))
    need = {'L': 0, 'R': 0}
    norm = []
    for it in items:
        txt, (px, py), col = it[0], it[1], it[2]
        x = ((px / 100 * W0) - box[0]) * s
        y = ((py / 100 * H0) - box[1]) * s
        side = it[3] if len(it) > 3 else ('L' if x < W / 2 else 'R')
        need[side] = max(need[side], tmp.textlength(txt, font=font(fs)) + 60)
        norm.append([txt, x, y, col, side])
    ML = int(margin if margin is not None and need['L'] else need['L'])
    MR = int(margin if margin is not None and need['R'] else need['R'])
    top = (70 if title else 20) + (len(legend) * (fs + 4) + 10 if legend else 0)
    bot = 20
    cv = Image.new('RGB', (ML + W + MR, top + H + bot), WH)
    cv.paste(im, (ML, top))
    d = ImageDraw.Draw(cv)
    if title:
        d.text((cv.width / 2, 35), title, font=font(fs - 4), fill=INK, anchor='mm')
    if legend:   # 圖例放在上方（放下面會和標籤擠在一起）
        yy = (70 if title else 20) + (fs - 6) / 2
        for t, col in legend:
            d.text((cv.width / 2, yy), t, font=font(fs - 6), fill=col, anchor='mm'); yy += fs + 4
    h = fs + 2 * 10
    for side in 'LR':
        rows = sorted([r for r in norm if r[4] == side], key=lambda r: r[2])
        ys = []
        for r in rows:
            want = top + r[2]
            ys.append(max(want, (ys[-1] + h + gap) if ys else top + h / 2))
        over = (ys[-1] + h / 2) - (top + H + bot - 4) if ys else 0
        if over > 0:
            ys = [v - over for v in ys]
            for k in range(1, len(ys)):
                ys[k] = max(ys[k], ys[k - 1] + h + gap)
            ys = [max(v, top + h / 2) for v in ys]
        for r, ly in zip(rows, ys):
            txt, x, y, col, _ = r
            px, py = ML + x, top + y
            w = d.textlength(txt, font=font(fs))
            if side == 'L':
                x1 = ML - 16; x0 = x1 - w - 24
                d.line([(px, py), (x1 + 10, ly), (x1, ly)], fill=col, width=5)
            else:
                x0 = ML + W + 16; x1 = x0 + w + 24
                d.line([(px, py), (x0 - 10, ly), (x0, ly)], fill=col, width=5)
            d.ellipse([px - dot, py - dot, px + dot, py + dot], fill=col, outline=WH, width=3)
            d.rounded_rectangle([x0, ly - h / 2, x1, ly + h / 2], 9, fill=col)
            d.text(((x0 + x1) / 2, ly), txt, font=font(fs), fill=WH, anchor='mm')
    cv.save(ROOT + out, quality=90)
    return cv.size
