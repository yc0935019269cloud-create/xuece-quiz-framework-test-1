"""Reviewed artery additions; leaves other workers' entries and source images intact."""
import json, shutil, math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/midterm-views'; EXTRA=ROOT/'tools/midterm/extra_views.json'
data=json.loads(EXTRA.read_text(encoding='utf8'))
data=[f for f in data if not Path(f['img']).name.startswith('artery2-')]
audit=json.loads((OUT/'artery2-old-audit.json').read_text(encoding='utf8'))
blockpath=ROOT/'tools/midterm/view_blocklist.json'; blocks=json.loads(blockpath.read_text(encoding='utf8'))
rejected={
 'beal_base.jpg':{'前脈絡叢動脈':'細小起始分支在450px圖中無法與鄰近血管分開辨認','威利氏環':'舊圈落在視交叉白色組織，未指向血管環'},
 'oc_blood_m.jpg':{'滑車下動脈':'未標示此分支，不能將無名細線推定為滑車下動脈','外瞼動脈':'去字示意圖中為無名線尾，缺乏可辨識的眼瞼與動脈弓關係'},
 'gray514.jpg':{'滑車下動脈':'Gray 514 未標示滑車下動脈，舊圈在不明顯細線附近','內瞼動脈':'舊圈在標籤引線旁的空白處，沒有圈中血管','眶上動脈':'舊圈落在兩條末梢分支之間的空白，改用校訂近景','鼻背動脈':'舊圈偏離紅色鼻背分支，改用校訂近景','肌動脈':'舊點在黃色神經旁，未準確指向 Muscular 引線所指細分支'},
 'j007a-blank.jpg':{k:'切片全圖450px時血管僅數像素且與多條引線重疊，無法辨識' for k in ['頸內動脈','基底動脈','淺顳動脈']},
 'sg3-blank.jpg':{'基底動脈':'全身矢狀切片的圈處太小且與引線重疊，未見可辨認的動脈管腔'},
 'fundus_od.jpg':{'視網膜中央動脈':'舊圈遠離視神經盤，不能標為中央動脈在盤內的位置',**{k:'舊點落在血管旁視網膜或交叉處；400px圓圈不能可靠區別動脈與靜脈，改用左右眼校訂標記' for k in ['顳上動脈','顳下動脈','鼻上動脈','鼻下動脈']}},
 'gray877_horizontal_vessels.jpg':{'虹膜大動脈環':'舊圈落在睫狀突網絡，未對準圖例2的動脈環切面交點'},
 'gray873.jpg':{'虹膜大動脈環':'放大核對舊點在睫狀肌灰色帶內，並非清楚的動脈環血管'},
 'gray515.jpg':{'顏面動脈':'舊圈在圖下端空白處，偏離血管','眼角動脈':'舊圈在角靜脈旁，不能可靠指認較內側的眼角動脈'},
}
decisions=[]
for fig in audit:
 for p in fig['points']:
  reason=rejected.get(Path(fig['img']).name,{}).get(p['zh'])
  decisions.append({'img':fig['img'],**p,'status':'block' if reason else 'keep','reason':reason or '450px可見血管走向及鄰接關係；標籤圖僅作探索辨識','overlay':fig['overlay']})
  if reason and not any(b['img']==fig['img'] and b['zh']==p['zh'] for b in blocks):
   blocks.append({'img':fig['img'],'zh':p['zh'],'reason':reason,**({'fallback':True} if p['zh'] in ['滑車下動脈','前脈絡叢動脈'] else {})})
# The earlier partial run already hid the schematic infratrochlear view.
pair=('img/eye-anat-manual/oc_blood_m.jpg','滑車下動脈')
if not any((b['img'],b['zh'])==pair for b in blocks):blocks.append({'img':pair[0],'zh':pair[1],'reason':rejected['oc_blood_m.jpg'][pair[1]]})
for b in blocks:
 if b['zh']=='滑車下動脈' and b['img'].endswith('/gray514.jpg'):b['fallback']=True
blockpath.write_text(json.dumps(blocks,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

def point(zh,x,y,tail=None,**kw):
 return {'zh':zh,'x':x,'y':y,'mark':'arrow' if tail else 'ring',**({'from':{'x':tail[0],'y':tail[1]}} if tail else {}),**kw}
def add(src,title,source,points):
 f=next((f for f in data if f['img']==src),None)
 if f is None:f={'img':src,'title':title,'source':source,'points':[]};data.append(f)
 elif f['source'].startswith('原圖鑑／既有補充圖') and not source.startswith('原圖鑑／既有補充圖'):
  f['source']=source;f['title']=title
 for p in points:
  prior=next((q for q in f['points'] if q['zh']==p['zh'] and q['x']==p['x'] and q['y']==p['y']),None)
  if prior is None:f['points'].append(p)
  else:prior.update({k:v for k,v in p.items() if k not in ['zh','x','y']})
 return f

# Marker choices for ALL audited points, including rejected archival points.
# Stored only in extra_views; runtime marker rendering is a separate task.
for fig in audit:
 pts=[]
 for p in fig['points']:
  broad=p['zh'] in ['頸內動脈','頸外動脈','基底動脈','椎動脈','威利氏環']
  tail=None if broad else (max(2,p['x']-9),max(2,p['y']-7))
  pts.append(point(p['zh'],p['x'],p['y'],tail))
 add(fig['img'],'既有動脈圖（標記樣式審計，圖上可能有原標籤）','原圖鑑／既有補充圖；授權沿用原來源，未另下載',pts)

# Explicitly authorized correction: move from Frontal label to its vessel.
f=next(f for f in data if f['img']=='img/eye-anat-manual/gray514.jpg')
f['points']=[p for p in f['points'] if p['zh']!='滑車上動脈']
f['points'].append(point('滑車上動脈',46.8,14.8,(54,5),replace=True))
for d in decisions:
 if d['img'].endswith('/gray514.jpg') and d['zh']=='滑車上動脈':d.update(status='correct',reason='依使用者要求由 Frontal 文字旁移到血管本身：(46.8,14.8)')

GRAY="Henry Vandyke Carter / Henry Gray，Gray's Anatomy 1918，公有領域；"
new=[]
def asset(filename,raw,title,source,pts,crop=None):
 dest='img/eye-lab/extra/'+filename
 im=Image.open(ROOT/raw).convert('RGB')
 if crop:im=im.crop(crop)
 im.save(ROOT/dest,quality=95)
 f=add(dest,title,source,pts);new.append(f)

asset('artery2-fundus-left.jpg','tmp/artery2-Fundus photograph of normal left eye.jpg','正常左眼眼底實照（OS；圖左為鼻側）',
 'Mikael Häggström，2012，CC0 1.0；https://commons.wikimedia.org/wiki/File:Fundus_photograph_of_normal_left_eye.jpg',[
 point('顳上動脈',40,31.9,(40,39)),point('顳下動脈',35,72.7,(40,79)),
 point('鼻上動脈',10.63,33.31,(3,29)),point('鼻下動脈',6.38,52.66,(2,49)),
 point('視網膜中央動脈',14.3,48.6,(23,52),approx=True),
 point('視神經盤',16,46),point('黃斑部',49,49),point('視網膜',65,46)])
asset('artery2-fundus-right.jpg','tmp/artery2-Fundus photograph of normal right eye.jpg','正常右眼眼底實照（OD；圖右為鼻側）',
 'Mikael Häggström，2012，CC0 1.0；https://commons.wikimedia.org/wiki/File:Fundus_photograph_of_normal_right_eye.jpg',[
 point('顳上動脈',53.86,26.86,(54,34)),point('顳下動脈',62,83.75,(62,89)),
 point('鼻上動脈',92.27,36.85,(97,33)),point('鼻下動脈',90.22,60.24,(97,65)),
 point('視網膜中央動脈',82.9,50.8,(75,54),approx=True),
 point('視神經盤',83,49),point('黃斑部',49,49),point('視網膜',36,46)])
asset('artery2-gray513-neck.jpg','tmp/orbit2-Gray513.png','頸內、頸外與椎動脈（Gray 513；右側面；圖上有原文標籤）',GRAY+'https://commons.wikimedia.org/wiki/File:Gray513.png',[
 point('頸內動脈',49.3,35),point('頸外動脈',55.8,49),point('椎動脈',41.4,61),point('顏面動脈',79.7,44,(90,49))])
asset('artery2-gray519-circle.jpg','tmp/orbit2-Gray519.png','腦底動脈展開示意（Gray 519；非新增標本角度；圖上有原文標籤）',GRAY+'https://commons.wikimedia.org/wiki/File:Gray519.png',[
 point('頸內動脈',23.2,19.4),point('大腦前動脈',31,11.8,(26,7)),point('前交通動脈',42.4,9.9,(48,5)),
 point('大腦中動脈',72,15.5,(82,6)),point('後交通動脈',60.5,30.5,(80,30)),point('大腦後動脈',58,40.4,(72,35)),
 point('威利氏環',42,25,approx=True),point('基底動脈',42,52),point('椎動脈',26,81)])

# Crop the existing plate margins, without painting, redrawing or inventing detail.
# Coordinates below refer to the cropped image (100,40)-(450,545).
def cropped(p):
 q=dict(p);q['x']=round((p['x']*6-100)/350*100,2);q['y']=round((p['y']*5.45-40)/505*100,2)
 if 'from' in p:q['from']={'x':round((p['from']['x']*6-100)/350*100,2),'y':round((p['from']['y']*5.45-40)/505*100,2)}
 return q
asset('artery2-gray514-orbit.jpg','tmp/orbit2-Gray514.png','眼動脈分支上面觀近景（Gray 514；同圖放大，不算另一角度；圖上有原文標籤）',GRAY+'https://commons.wikimedia.org/wiki/File:Gray514.png；僅裁切外圍空白',list(map(cropped,[
 point('頸內動脈',39,94),point('眼動脈',50.3,77,(68,83)),point('淚動脈',57.6,63,(74,68)),
 point('眶上動脈',61.3,11.7,(69,8)),point('滑車上動脈',46.8,14.8,(53,8)),point('鼻背動脈',39.7,14.6,(26,10)),
 point('內瞼動脈',45.8,23.2,(63,27)),point('前篩動脈',32.1,40,(21,35)),point('後篩動脈',32.3,56.6,(21,61)),
 point('肌動脈',45.1,64.7,(32,75)),point('視網膜中央動脈',55.6,59.2,(71,53)),
 point('睫狀動脈',51.7,52.4,(67,46)),
 point('視神經',49,61),point('淚腺',63.2,38)
 ])),crop=(100,40,450,545))

# Existing figure can additionally show clearly labelled muscular/ciliary branches.
add('img/eye-lab/extra/gray510_maxillary_artery.jpg','上頷動脈分支（Gray 510；圖上有原文標籤）',GRAY+'https://commons.wikimedia.org/wiki/File:Gray510.png',[
 point('中腦膜動脈',36,34,(27,26))])
add('img/eye-anat-manual/gray873.jpg','睫狀動脈（Gray 873；圖上有原文標籤）',GRAY+'https://commons.wikimedia.org/wiki/File:Gray873.png',[
 point('睫狀動脈',58,43.5,(50,35))])
add('img/eye-lab/extra/gray877_horizontal_vessels.jpg','眼球血管水平切面（Gray 877；圖上有原文標籤）','Leber 據 Stöhr，Gray 1918，公有領域；https://commons.wikimedia.org/wiki/File:Gray877_rotated.jpg',[
 point('睫狀後長動脈',48,77.8,(48,65)),point('睫狀後短動脈',83,9,(69,8))])
add('img/eye-anat-manual/gray515.jpg','眼瞼與眶周血管（Gray 515；圖上有原文標籤）',GRAY+'https://commons.wikimedia.org/wiki/File:Gray515.png',[
 point('內瞼動脈',73.6,53.6,(67,46)),point('外瞼動脈',33,47.2,(27,42))])
asset('artery2-gray877-section.jpg','tmp/artery2-Gray877 rotated.jpg','眼球血管水平切面近景（Gray 877；非另一角度；圖上有原文標籤）',
 'Leber 據 Stöhr，Gray’s Anatomy 1918，公有領域；https://commons.wikimedia.org/wiki/File:Gray877_rotated.jpg；僅裁切外圍空白',[
 point('視網膜中央動脈',88,37.9,(90,28)),point('睫狀後長動脈',48,77.8,(48,64)),
 point('睫狀後短動脈',83,9,(69,8)),point('睫狀前動脈',24.5,85.3,(16,91)),
 point('虹膜大動脈環',16.1,45.1,(8,38),approx=True),
 point('虹膜',16.4,29.6),point('水晶體',23,28),point('角膜',5.3,30),point('睫狀體',20,43),
 point('視網膜',49,70.7),point('脈絡膜',49,74.2),point('鞏膜',52,82),point('視神經',91,30)
 ])

EXTRA.write_text(json.dumps(data,ensure_ascii=False,indent=1)+'\n',encoding='utf8')
(OUT/'artery2-decisions.json').write_text(json.dumps(decisions,ensure_ascii=False,indent=2)+'\n',encoding='utf8')

# Markers at 400px, legends outside the anatomical image. Individual files are
# the acceptance evidence; the group overlay is only a navigation/contact sheet.
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',13)
def draw_marker(d,p,w,h,yoff=32):
 x,y=p['x']*w/100,yoff+p['y']*h/100
 if p['mark']=='ring':d.ellipse((x-5,y-5,x+5,y+5),outline='red',width=2)
 elif p['mark']=='dot':d.ellipse((x-2,y-2,x+2,y+2),fill='red')
 else:
  tx,ty=p['from']['x']*w/100,yoff+p['from']['y']*h/100
  d.line((tx,ty,x,y),fill='red',width=2);a=math.atan2(y-ty,x-tx)
  d.polygon([(x,y),(x-6*math.cos(a-.5),y-6*math.sin(a-.5)),(x-6*math.cos(a+.5),y-6*math.sin(a+.5))],fill='red')
 return x,y
for i,f in enumerate(new,1):
 im=Image.open(ROOT/f['img']).convert('RGB');im=im.resize((400,round(im.height*400/im.width)))
 c=Image.new('RGB',(690,max(im.height+32,len(f['points'])*23+32)),'white');c.paste(im,(0,32));d=ImageDraw.Draw(c);d.text((2,5),Path(f['img']).name,font=font,fill='black')
 for n,p in enumerate(f['points'],1):
  x,y=draw_marker(d,p,400,im.height);d.text((x+5,y-15),str(n),font=font,fill='red',stroke_width=1,stroke_fill='white');d.text((405,32+(n-1)*23),f"{n}. {p['zh']}",font=font,fill='black')
  one=Image.new('RGB',(400,im.height+55),'white');one.paste(im,(0,32));od=ImageDraw.Draw(one);od.text((3,4),p['zh'],font=font,fill='black');draw_marker(od,p,400,im.height);one.save(OUT/f'artery2-new-{i:02}-point-{n:02}.png')
 c.save(OUT/f'artery2-new-{i:02}.png')
print('new images',len(new),'points',sum(len(f['points']) for f in new),'audited',len(decisions),'blocked',sum(d['status']=='block' for d in decisions))
