from PIL import Image, ImageDraw
from pathlib import Path
src=Image.open('docs/decor/camp-base-source.png').convert('RGBA')
out=Path('assets/camp'); out.mkdir(exist_ok=True)
# Snap each isolated cutout to a 1px logical grid, quantize, binary alpha, upscale x4.
def sprite(box,size):
 im=src.crop(box).resize(size,Image.Resampling.LANCZOS)
 a=im.getchannel('A').point(lambda x:255 if x>=128 else 0)
 rgb=im.convert('RGB').quantize(colors=48,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE).convert('RGBA'); rgb.putalpha(a)
 # Keep the largest connected silhouette; remove detached generation specks.
 pix=rgb.load(); seen=set(); groups=[]
 for y in range(rgb.height):
  for x in range(rgb.width):
   if pix[x,y][3] and (x,y) not in seen:
    todo=[(x,y)]; seen.add((x,y)); group=[]
    while todo:
     q=todo.pop(); group.append(q)
     for xx,yy in ((q[0]-1,q[1]),(q[0]+1,q[1]),(q[0],q[1]-1),(q[0],q[1]+1)):
      if 0<=xx<rgb.width and 0<=yy<rgb.height and (xx,yy) not in seen and pix[xx,yy][3]: seen.add((xx,yy)); todo.append((xx,yy))
    groups.append(group)
 if groups:
  for group in groups:
   if group is not max(groups,key=len):
    for x,y in group: pix[x,y]=(0,0,0,0)
 return rgb
fire=sprite((40,175,385,570),(48,48)); board=sprite((405,195,810,562),(36,36)); mail=sprite((850,198,1130,570),(40,40)); plant=sprite((1160,210,1495,570),(48,48)); pond=sprite((1495,280,2010,570),(96,28))
def save(im,name): im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST).save(out/name)
def strip(frames,name):
 im=Image.new('RGBA',(frames[0].width*len(frames),frames[0].height))
 for i,f in enumerate(frames): im.paste(f,(i*f.width,0))
 save(im,name)
save(board,'board.png')
# Animate only flame region, retaining the stone and log base.
frames=[]
for dx,dy in [(0,0),(1,-1),(-1,0),(0,1)]:
 f=fire.copy(); patch=fire.crop((8,1,40,29)); f.paste((0,0,0,0),(8,1,40,29)); f.alpha_composite(patch,(8+dx,1+dy)); frames.append(f)
strip(frames,'fire.png')
# Lower the flag by replacing its raised segment with a short horizontal flag.
down=mail.copy(); d=ImageDraw.Draw(down); d.rectangle((28,0,39,17),fill=(0,0,0,0)); d.rectangle((29,14,37,17),fill=(57,29,41,255)); d.rectangle((30,14,37,15),fill=(193,53,50,255))
strip([mail,down],'mail.png')
# Keep the generated pot body and add successive plant growth, keeping every frame registered.
frames=[]
for stage in range(5):
 if stage==4: frames.append(plant.copy()); continue
 f=Image.new('RGBA',(48,48)); f.alpha_composite(plant.crop((8,32,40,48)),(8,32)); d=ImageDraw.Draw(f)
 d.ellipse((12,26,36,31),fill=(69,37,32,255)); d.ellipse((14,27,34,30),fill=(105,66,44,255))
 if stage>=1:
  d.line([(24,28),(24,23 if stage==1 else 17)],fill=(47,78,38,255),width=2)
  d.polygon([(24,25),(19,21),(16,22),(19,25)],fill=(75,120,48,255))
 if stage>=2:
  d.polygon([(24,23),(29,17),(34,18),(30,22)],fill=(89,135,50,255)); d.polygon([(24,20),(20,15),(16,16),(19,20)],fill=(63,108,41,255))
 if stage>=3:
  d.ellipse((20,10,28,18),fill=(93,44,51,255)); d.ellipse((21,10,27,16),fill=(220,115,141,255))
 frames.append(f)
strip(frames,'pot.png')
# Shift small water highlights across otherwise identical pond frames.
frames=[]
for shift in [0,2,4,2]:
 f=pond.copy(); d=ImageDraw.Draw(f); d.line((34+shift,13,39+shift,13),fill=(151,205,217,255),width=1); frames.append(f)
strip(frames,'pond.png')
# Review backgrounds: a classic grass approximation and two real scene variants.
from PIL import ImageFont
sheet=Image.new('RGB',(1200,780),(38,43,44)); draw=ImageDraw.Draw(sheet)
bgs=[('classic day',None),('classic night',None),('beach day','assets/decor/scenes/scene_beach_day.png'),('beach night','assets/decor/scenes/scene_beach_night.png'),('sakura day','assets/decor/scenes/scene_sakura_day.png'),('sakura night','assets/decor/scenes/scene_sakura_night.png')]
variants=[('board', [board]),('fire', [fire]+frames[:0]),('mail',[mail,down]),('pot',[]),('pond',[])]
for row,(label,path) in enumerate(bgs):
 y=row*130; bg=Image.open(path).convert('RGB').resize((1200,300)).crop((0,160,1200,290)) if path else Image.new('RGB',(1200,130),(83,139,76) if row==0 else (32,62,50)); sheet.paste(bg,(0,y)); draw.text((5,y+3),label,fill='white')
 for idx,(name,count) in enumerate([('board',1),('fire',4),('mail',2),('pot',5),('pond',4)]):
  raw=Image.open(out/(name+'.png')); fw=raw.width//count
  for n in range(count):
   im=raw.crop((n*fw,0,(n+1)*fw,raw.height)); im.thumbnail((55 if name!='pond' else 70,80),Image.Resampling.NEAREST)
   x=125+idx*210+n*(37 if name=='pot' else 42); sheet.paste(im,(x,y+115-im.height),im)
  draw.text((125+idx*210,y+5),name,fill='white')
sheet.save('docs/decor/contact-camp-base.png')
