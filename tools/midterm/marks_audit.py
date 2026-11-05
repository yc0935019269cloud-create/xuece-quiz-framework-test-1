"""Create 400px review sheets of every unique image/point in the review."""
import json, re
from pathlib import Path
from collections import defaultdict
from PIL import Image, ImageDraw, ImageFont
R = Path(__file__).resolve().parents[2]
pack = json.loads((R/'content/learn/eye_anat/midterm-review.json').read_text(encoding='utf8'))
images = defaultdict(dict)
for lesson in pack['lessons']:
    for step in lesson['steps']:
        if step['type'] != 'termlist': continue
        for group in step['groups']:
            for row in group['items']:
                zh = re.sub(r'^\d+\.\s*', '', row['zh'])
                for v in row['views']: images[v['img']][(zh,v['x'],v['y'])] = v
out=R/'tmp/midterm/mark-audit'; out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc', 13)
for i,(src,points) in enumerate(sorted(images.items())):
    try: im=Image.open(R/src).convert('RGB')
    except OSError: continue
    im.thumbnail((400,500))
    canvas=Image.new('RGB',(700,max(im.height+35,40+len(points)*20)),'white'); canvas.paste(im,(0,35)); d=ImageDraw.Draw(canvas)
    d.text((2,3),src,font=font,fill='black')
    for n,((zh,x,y),v) in enumerate(points.items(),1):
        px=x*im.width/100; py=35+y*im.height/100
        d.ellipse((px-12,py-12,px+12,py+12),outline='red',width=3)
        d.text((px+8,py-16),str(n),font=font,fill='red',stroke_width=1,stroke_fill='white')
        d.text((405,35+(n-1)*20),f'{n}. {zh}',font=font,fill='black')
    canvas.save(out/f'{i:03}.jpg',quality=85)
print(len(images), 'images;', sum(map(len,images.values())), 'unique image/point/name combinations; sheets:',out)
