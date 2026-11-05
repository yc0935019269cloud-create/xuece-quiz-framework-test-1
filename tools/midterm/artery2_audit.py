"""Render every artery source at 450px, plus individual 400px marker previews."""
import json, math
from pathlib import Path
from collections import defaultdict
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/midterm-views'
FONT=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',13)
rows=json.loads((ROOT/'tmp/artery2-before.json').read_text(encoding='utf8'))['items']
images=defaultdict(list)
for row in rows:
    for v in row['views']:
        p={'zh':row['zh'],'x':v['x'],'y':v['y']}
        if p not in images[v['img']]:images[v['img']].append(p)
manifest=[]
for i,(src,pts) in enumerate(images.items(),1):
    im=Image.open(ROOT/src).convert('RGB');im=im.resize((450,round(im.height*450/im.width)))
    canvas=Image.new('RGB',(700,max(im.height+35,len(pts)*22+35)),'white');canvas.paste(im,(0,35));d=ImageDraw.Draw(canvas)
    d.text((3,4),src.split('/')[-1],font=FONT,fill='black')
    for n,p in enumerate(pts,1):
        x,y=p['x']*4.5,35+p['y']*im.height/100
        d.ellipse((x-6,y-6,x+6,y+6),outline='red',width=2)
        d.text((x+6,y-16),str(n),font=FONT,fill='red',stroke_width=1,stroke_fill='white')
        d.text((455,35+(n-1)*22),f"{n}. {p['zh']}",font=FONT,fill='black')
    dest=f'artery2-old-{i:02}.png';canvas.save(OUT/dest)
    manifest.append({'overlay':dest,'img':src,'points':pts})
(OUT/'artery2-old-audit.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
for i in range(0,len(manifest),3):
    ims=[Image.open(OUT/x['overlay']) for x in manifest[i:i+3]]
    sheet=Image.new('RGB',(1400,max(sum(im.height for im in ims[:2]),ims[-1].height)),'#dddddd')
    y=0
    for n,im in enumerate(ims):
        sheet.paste(im, (0,y) if n<2 else (700,0))
        if n<2:y+=im.height
    sheet.save(OUT/f'artery2-audit-sheet-{i//3+1}.png')
print(len(manifest),'sources;',sum(len(x['points']) for x in manifest),'unique image/point views')
