"""Reproduce the targeted crops, coordinates and 450px review overlays.

Original atlases, bank questions and other workers' supplemental entries stay intact.
Coordinates below are measured in source pixels; crops never redraw anatomy.
Only white background labels are masked. Text crossing bone remains disclosed.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/midterm-views'
EXTRA=ROOT/'tools/midterm/extra_views.json'
FONT=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',14)
def read(p): return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
def save(p,data): (ROOT/p).write_text(json.dumps(data,ensure_ascii=False,indent=1 if p=='tools/midterm/extra_views.json' else 2)+'\n',encoding='utf8')
def gray(n):
    return f"Henry Vandyke Carter，Gray's Anatomy 1918 Fig. {n}，公有領域（PD），Wikimedia Commons：https://commons.wikimedia.org/wiki/File:Gray{n}.png；裁切，僅遮去骨外白底文字，骨面原文保留。"

SPECS=[
 dict(name='gray193-base',src='img/eye-anat-manual/gray193.jpg',box=(278,0,719,1057),title='顱底上面觀全圖（Gray 193；骨外文字已裁去；圖上有原文標籤）',source=gray(193),points=[
  ('前篩孔',326,180),('後篩孔',350,281),('雞冠',315,123,True),('篩板',320,211,True),('嗅孔',316,207,True),('視神經管',365,343),('蝶鞍',321,406),('圓孔',404,398,True),('卵圓孔',444,465,True),('棘孔',481,493,True),('破裂孔',380,495,True),('內耳道',450,584,True),('頸靜脈孔',412,614,True),('舌下神經管',441,631,True),('枕骨大孔',345,695,True),('蝶骨小翼',431,309),('蝶骨大翼',529,397)]),
 dict(name='gray193-superior',src='img/eye-anat-manual/gray193.jpg',box=(292,105,455,305),title='顱底上面觀：前／後篩孔近圖（Gray 193；圖上有原文標籤）',source=gray(193),points=[
  ('前篩孔',326,180,True),('後篩孔',350,281,True),('雞冠',315,123),('篩板',320,211),('嗅孔',316,207)]),
 dict(name='gray192-medial',src='tmp/orbit2-Gray192.png',box=(124,88,510,264),title='左眼眶內側壁近圖（Gray 192；圖上有原文標籤）',source=gray(192),points=[
  ('淚窩',225,205,True),('淚骨',247,202),('篩骨',324,194),('前篩孔',306,163),('後篩孔',372,179),('視神經管',423,175,True),('腭骨',390,220),('蝶鞍',477,204,True)]),
 dict(name='gray135-orbital',src='tmp/orbit2-Gray135.png',box=(20,220,540,465),title='額骨眶面下方觀：淚腺窩（Gray 135；圖上有原文標籤）',source=gray(135),masks=[(407,421,550,447)],points=[
  ('淚腺窩',465,352),('額骨',385,315),('前篩孔',229,356),('後篩孔',231,281),('額竇',310,419)]),
 dict(name='gray135-lacrimal-fossa',src='tmp/orbit2-Gray135.png',box=(300,265,535,425),title='額骨眶面下方觀：淚腺窩特寫（Gray 135；圖上有原文標籤）',source=gray(135),points=[
  ('淚腺窩',465,352,True),('額骨',385,315)]),
 dict(name='gerrish210-trochlear',src="tmp/orbit2-Gerrish's Text-book of Anatomy (1902) - Fig. 210.png",box=(570,85,1115,570),title='額骨下方觀：滑車窩近圖（Gerrish 210；圖上有原文標籤）',source="Frederick Henry Gerrish (1845–1920)，Text-book of Anatomy (1902) Fig. 210，公有領域（PD），Wikimedia Commons：https://commons.wikimedia.org/wiki/File:Gerrish%27s_Text-book_of_Anatomy_(1902)_-_Fig._210.png；裁切，骨外文字已遮，骨面原文保留。",masks=[(580,0,1384,85),(1110,95,1384,150)],points=[
  ('滑車窩',675,201,True),('額骨',830,380)]),
 dict(name='gray163-lacrimal',src='tmp/orbit2-Gray163.png',box=(23,20,150,212),title='淚骨眶面：淚溝近圖（構成淚窩的一部分；Gray 163；圖上有原文標籤）',source=gray(163),points=[
  ('淚窩',61,100),('淚骨',112,111)]),
 dict(name='gray190-anterior',src='img/eye-anat-manual/gray190.jpg',box=(185,205,365,383),title='眼眶前面近圖：眶上孔與眶下孔（Gray 190；圖上有原文標籤）',source=gray(190),points=[
  ('眶上孔',270,238,True),('眶下孔',286,358,True),('顴骨',330,344),('上頜骨',263,374)]),
 # The allowed specimen fallback is deliberately approximate: the orbital rim
 # and lateral wall are visible, but this photograph cannot prove the tubercle.
 dict(name='lateral-specimen',src='img/eye-lab/extra/orbit_apex_specimen.jpg',box=(350,500,1000,1190),title='眼眶外側壁標本近圖：外側結節定位參考（隆起未能確證）',source='MAKY.OREL，CC BY-SA 4.0，Wikimedia Commons：https://commons.wikimedia.org/wiki/File:Cranium_-_orbita_(canalis_opticus,_anterior_detail).jpg；由既有照片裁切，https://creativecommons.org/licenses/by-sa/4.0/；僅示意預期區域，非可確證的外側結節。',points=[
  ('外側結節',555,935,True,True),('顴骨',605,1065)]),
]

def overlay(img,points,path,title):
    im=Image.open(ROOT/img).convert('RGB'); im=im.resize((450,round(im.height*450/im.width)))
    canvas=Image.new('RGB',(740,max(im.height+60,len(points)*25+60)),'white');canvas.paste(im,(0,60)); d=ImageDraw.Draw(canvas)
    d.text((3,3),title[:47],font=FONT,fill='black');d.text((3,24),img,font=FONT,fill='black')
    for n,p in enumerate(points,1):
        x,y=p['x']*4.5,60+p['y']*im.height/100
        d.ellipse((x-6,y-6,x+6,y+6),outline='red',width=2)
        d.text((x+7,y-17),str(n),font=FONT,fill='red',stroke_width=1,stroke_fill='white')
        d.text((455,60+(n-1)*25),f"{n}. {p['zh']}"+('（概略，未確證）' if p.get('approx') else ''),font=FONT,fill='black')
    canvas.save(ROOT/path)

figures=[]
for s in SPECS:
    im=Image.open(ROOT/s['src']).convert('RGB');d=ImageDraw.Draw(im)
    for rect in s.get('masks',[]): d.rectangle(rect,fill='white')
    im=im.crop(s['box']);dest=f"img/eye-lab/extra/orbit2-{s['name']}.png";im.save(ROOT/dest)
    l,t,r,b=s['box'];pts=[]
    for zh,x,y,*flags in s['points']:
        pt=dict(zh=zh,x=round((x-l)/(r-l)*100,3),y=round((y-t)/(b-t)*100,3))
        if flags and flags[0]:pt['primary']=True
        if len(flags)>1 and flags[1]:pt['approx']=True
        pts.append(pt)
    fig=dict(img=dest,title=s['title'],source=s['source'],points=pts)
    figures.append(fig);overlay(dest,pts,f"docs/midterm-views/orbit2-{s['name']}.png",s['title'])

# Reuse the existing intact 193 plate; add only points absent from its old entry.
im=Image.open(ROOT/'img/eye-anat-manual/gray193.jpg')
pts=[dict(zh=zh,x=round(x/im.width*100,3),y=round(y/im.height*100,3)) for zh,x,y in [
 ('前篩孔',326,180),('後篩孔',350,281),('視神經管',365,343),('蝶鞍',321,406),('圓孔',404,398),('卵圓孔',444,465),('蝶骨小翼',431,309),('蝶骨大翼',529,397)]]
figures.append(dict(img='img/eye-anat-manual/gray193.jpg',title='顱底上面觀（Gray 193；圖上有原文標籤）',source=gray(193),points=pts))
overlay('img/eye-anat-manual/gray193.jpg',pts,'docs/midterm-views/orbit2-gray193-legacy-additions.png','Gray 193 既有原圖：只補缺少點位')
pts=[dict(zh=zh,x=round(x/650*100,3),y=round(y/466*100,3)) for zh,x,y in [('淚骨',247,202),('上頜骨',230,352),('腭骨',390,220),('蝶鞍',477,204)]]
figures.append(dict(img='img/eye-lab/extra/gray192_orbit_medial_wall.jpg',title='左眼眶內側壁完整圖（Gray 192；圖上有原文標籤）',source=gray(192),points=pts))
overlay(figures[-1]['img'],pts,'docs/midterm-views/orbit2-gray192-full.png',figures[-1]['title'])
old=read('tools/midterm/extra_views.json')
owned={f['img'] for f in figures if '/orbit2-' in f['img']}
# Do not remove the earlier Gray193 entry or any other worker's additions.
new_keys={(f['img'],f['title']) for f in figures}
old=[f for f in old if f['img'] not in owned and (f['img'],f['title']) not in new_keys]
save('tools/midterm/extra_views.json',old+figures)
save('docs/midterm-views/orbit2-sources.json',[dict(img=f['img'],source=f['source']) for f in figures])
print(f'{len(SPECS)} new crops, 2 reused full plates; overlays rendered at 450px.')
