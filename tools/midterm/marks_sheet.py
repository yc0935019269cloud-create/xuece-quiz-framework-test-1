"""Document selected markers against their existing image coordinates."""
import json,re,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
R=Path(__file__).resolve().parents[2]
pack=json.loads((R/'content/learn/eye_anat/midterm-review.json').read_text(encoding='utf8'))
overrides=json.loads((R/'tools/midterm/mark_overrides.json').read_text(encoding='utf8'))
views={}
for l in pack['lessons']:
    for s in l['steps']:
        if s['type']!='termlist': continue
        for g in s['groups']:
            for row in g['items']:
                zh=re.sub(r'^\d+\.\s*','',row['zh'])
                for v in row['views']: views[(v['img'],zh,v['x'],v['y'])]=v
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',15)
out=R/'docs/midterm-views'; out.mkdir(exist_ok=True,parents=True)
cards=[]; lines=['# 標記調整','', '位置沿用原圖座標；箭線尾端只表示指向，不代表構造延伸方向。','']
entries = [(o, v) for o in overrides for (img, zh, x, y), v in views.items() if (img, zh) == (o['img'], o['zh'])]
for o, v in entries:
    im=Image.open(R/o['img']).convert('RGB'); im.thumbnail((400,380))
    c=Image.new('RGB',(420,440),'white'); c.paste(im,((420-im.width)//2,45)); d=ImageDraw.Draw(c)
    x=(420-im.width)//2+v['x']*im.width/100; y=45+v['y']*im.height/100
    if o['mark']=='arrow':
        fx=(420-im.width)//2+v['fx']*im.width/100; fy=45+v['fy']*im.height/100
        d.line((fx,fy,x,y),fill='white',width=5); d.line((fx,fy,x,y),fill='red',width=3); d.ellipse((x-3,y-3,x+3,y+3),fill='red',outline='white')
    else: d.ellipse((x-4,y-4,x+4,y+4),fill='red',outline='white',width=1)
    d.text((4,4),o['zh']+' / '+o['mark'],font=font,fill='black')
    d.text((4,24),Path(o['img']).name,font=font,fill='black')
    why='細小或鄰近構造密集，以短線指向減少遮擋' if o['mark']=='arrow' else '構造細小或位置密集，以小點減少遮擋'
    lines.append(f"- {o['zh']}｜`{o['img']}`（{v['x']}%, {v['y']}%）｜{o['mark']}｜{why}。")
    cards.append(c)
for start in range(0,len(cards),6):
    subset=cards[start:start+6]; sheet=Image.new('RGB',(420*3,440*math.ceil(len(subset)/3)),'white')
    for i,c in enumerate(subset): sheet.paste(c,((i%3)*420,(i//3)*440))
    sheet.save(out/f'marks-{start//6+1:02}.png')
(out/'marks.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
