"""把幾張圖拼成一張看（檢查用）。python tools/learn-redo/montage.py out.png a b c ...（檔名不含 img/eye-anat-fig/ 與 .jpg）"""
import sys
from PIL import Image, ImageDraw
out, names = sys.argv[1], sys.argv[2:]
ims = [Image.open(f'img/eye-anat-fig/{n}.jpg').convert('RGB') for n in names]
ims = [i.resize((560, int(i.height * 560 / i.width))) for i in ims]
cols = 3; rows = [ims[k:k + cols] for k in range(0, len(ims), cols)]
H = sum(max(i.height for i in r) + 24 for r in rows)
c = Image.new('RGB', (560 * cols, H), 'white'); d = ImageDraw.Draw(c); y = 0; k = 0
for r in rows:
    for j, i in enumerate(r):
        c.paste(i, (560 * j, y + 24)); d.text((560 * j + 4, y + 4), names[k], fill='black'); k += 1
    y += max(i.height for i in r) + 24
c.save(out)
