from PIL import Image, ImageDraw, ImageFont
im=Image.open('img/eye-anat-manual/gray193.jpg').convert('RGB')
box=(290,100,415,295)
im=im.crop(box).resize((625,975))
d=ImageDraw.Draw(im)
f=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
for x in range(300,416,10):
    p=(x-box[0])*5; d.line((p,0,p,975),fill=(255,100,100),width=1); d.text((p+1,2),str(x),fill='red',font=f)
for y in range(110,296,10):
    p=(y-box[1])*5; d.line((0,p,625,p),fill=(255,100,100),width=1); d.text((1,p+1),str(y),fill='red',font=f)
im.save('tmp/orbit2-ethmoid-grid.png')
