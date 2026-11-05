from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',14)
for filename,box in [('Gray192.png',(110,80,490,280)),('Gray135.png',(0,220,550,518)),('Gray163.png',(0,0,173,242))]:
    im=Image.open('tmp/orbit2-'+filename).convert('RGB')
    if filename=='Gray163.png': box=(0,0,*im.size)
    im=im.crop(box).resize(((box[2]-box[0])*2,(box[3]-box[1])*2))
    d=ImageDraw.Draw(im)
    for x in range((box[0]//25+1)*25,box[2],25):
        p=(x-box[0])*2;d.line((p,0,p,im.height),fill='salmon');d.text((p,0),str(x),fill='red',font=font)
    for y in range((box[1]//25+1)*25,box[3],25):
        p=(y-box[1])*2;d.line((0,p,im.width,p),fill='salmon');d.text((0,p),str(y),fill='red',font=font)
    im.save('tmp/orbit2-grid-'+filename)
