"""Render source coordinates at the requested 450-pixel study width."""
import json
from collections import defaultdict
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/midterm-views'
font = ImageFont.truetype('C:/Windows/Fonts/msjh.ttc', 14)
pack = json.loads((ROOT/'tmp/orbit2-before.json').read_text(encoding='utf8'))
rows = pack['lessons'][0]['steps'][1]['groups'][0]['items']
images = defaultdict(list)
for row in rows:
    for v in row['views']:
        if not any(p[0] == row['zh'] and p[1:] == (v['x'], v['y']) for p in images[v['img']]):
            images[v['img']].append((row['zh'],v['x'],v['y']))
manifest=[]
for i,(src,pts) in enumerate(images.items(),1):
    im=Image.open(ROOT/src).convert('RGB'); im=im.resize((450,round(im.height*450/im.width)))
    canvas=Image.new('RGB',(700,max(im.height+35,len(pts)*23+35)),'white')
    canvas.paste(im,(0,35)); d=ImageDraw.Draw(canvas)
    d.text((3,5),src,font=font,fill='black')
    for n,(zh,x,y) in enumerate(pts,1):
        x,y=x*4.5,35+y*im.height/100
        d.ellipse((x-6,y-6,x+6,y+6),outline='red',width=2)
        d.text((x+6,y-16),str(n),font=font,fill='red',stroke_width=1,stroke_fill='white')
        d.text((455,35+(n-1)*23),f'{n}. {zh}',font=font,fill='black')
    name=f'orbit2-old-{i:02}.png'; canvas.save(OUT/name)
    manifest.append({'overlay':name,'img':src,'points':pts})
(OUT/'orbit2-old-audit.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(f'{len(images)} source overlays; {sum(len(x) for x in images.values())} marked views')
