from PIL import Image, ImageDraw
import math, os
O=r"E:\NEWTEST\新刷題庫框架 - TEST 1\資源\生理光學\img"
BL=(40,40,40); RED=(200,50,40); ORG=(230,140,20); BLU=(30,90,180); GR=(120,120,120)
def dashed(d,p0,p1,fill,w=2,dash=10):
    x0,y0=p0;x1,y1=p1;L=math.hypot(x1-x0,y1-y0);n=int(L//dash)
    for i in range(0,n,2):
        a=i/n;b=min((i+1)/n,1)
        d.line([(x0+(x1-x0)*a,y0+(y1-y0)*a),(x0+(x1-x0)*b,y0+(y1-y0)*b)],fill=fill,width=w)
def arrowhead(d,p0,p1,fill,t=0.5,L=16):
    x0,y0=p0;x1,y1=p1;a=math.atan2(y1-y0,x1-x0);mx=x0+(x1-x0)*t;my=y0+(y1-y0)*t
    tip=(mx+L/2*math.cos(a),my+L/2*math.sin(a))
    b1=(mx-L/2*math.cos(a)+7*math.sin(a),my-L/2*math.sin(a)-7*math.cos(a))
    b2=(mx-L/2*math.cos(a)-7*math.sin(a),my-L/2*math.sin(a)+7*math.cos(a))
    d.polygon([tip,b1,b2],fill=fill)
def dot(d,p,fill=BL,r=7): d.ellipse([p[0]-r,p[1]-r,p[0]+r,p[1]+r],fill=fill)

# 1 球面折射介面
W,H=1200,520;im=Image.new('RGB',(W,H),'white');d=ImageDraw.Draw(im)
ay=300;A=520;C=820;R=300
d.line([(20,ay),(1180,ay)],fill=GR,width=2)
pts=[(C-math.sqrt(R*R-(y-ay)**2),y) for y in range(ay-230,ay+231,2)]
d.line(pts,fill=BLU,width=5)
d.rectangle([0,0,1,1],fill='white')
Ox,Ix=160,1080;Qy=150;Qx=C-math.sqrt(R*R-(Qy-ay)**2)
d.line([(Ox,ay),(Qx,Qy)],fill=RED,width=4);arrowhead(d,(Ox,ay),(Qx,Qy),RED)
d.line([(Qx,Qy),(Ix,ay)],fill=ORG,width=4);arrowhead(d,(Qx,Qy),(Ix,ay),ORG)
nx,ny=Qx-C,Qy-ay;k=0.55;dashed(d,(C,ay),(Qx+nx*k,Qy+ny*k),GR)
dashed(d,(Qx,Qy),(Qx,ay),BL,2,8)
for p in [(Ox,ay),(A,ay),(C,ay),(Ix,ay),(Qx,Qy)]: dot(d,p)
d.line([(A,370),(C,370)],fill=BL,width=2);d.line([(A,360),(A,380)],fill=BL,width=2);d.line([(C,360),(C,380)],fill=BL,width=2)
d.line([(A,335),(Qx,335)],fill=BL,width=2);d.line([(A,328),(A,342)],fill=BL,width=2);d.line([(Qx,328),(Qx,342)],fill=BL,width=2)
im.save(os.path.join(O,'physopt-u2','dg-surface.png'))
P=lambda x,y:(round(x/W*100,1),round(y/H*100,1))
print('surface',{'O':P(Ox,ay),'A':P(A,ay),'C':P(C,ay),'I':P(Ix,ay),'Q':P(Qx,Qy),'normal':P(Qx+nx*0.4,Qy+ny*0.4),'r':P(670,370),'s':P((A+Qx)/2,335),'y':P(Qx,225),'axis':P(1130,ay)})

# 2 薄透鏡三條主要光線
W,H=1200,520;im=Image.new('RGB',(W,H),'white');d=ImageDraw.Draw(im)
ay=280;Lx=600;f=150;ox=270;oh=120;v=275;ix=Lx+v;ih=-100
d.line([(20,ay),(1180,ay)],fill=GR,width=2)
d.line([(Lx,110),(Lx,450)],fill=BL,width=4);d.polygon([(Lx,100),(Lx-14,125),(Lx+14,125)],fill=BL);d.polygon([(Lx,460),(Lx-14,435),(Lx+14,435)],fill=BL)
d.line([(ox,ay),(ox,ay-oh)],fill=BL,width=5);d.polygon([(ox,ay-oh-12),(ox-10,ay-oh+8),(ox+10,ay-oh+8)],fill=BL)
d.line([(ix,ay),(ix,ay-ih)],fill=BL,width=5);d.polygon([(ix,ay-ih+12),(ix-10,ay-ih-8),(ix+10,ay-ih-8)],fill=BL)
T=(ox,ay-oh);I=(ix,ay-ih)
def ext(p0,p1,x):
    return (x,p0[1]+(p1[1]-p0[1])*(x-p0[0])/(p1[0]-p0[0]))
# ray1 parallel
d.line([T,(Lx,T[1])],fill=RED,width=3);arrowhead(d,T,(Lx,T[1]),RED)
e=ext((Lx,T[1]),I,1100);d.line([(Lx,T[1]),e],fill=RED,width=3);arrowhead(d,(Lx,T[1]),I,RED,0.35)
# ray2 nodal
e=ext(T,(Lx,ay),1100);d.line([T,e],fill=BLU,width=3);arrowhead(d,T,(Lx,ay),BLU,0.6)
# ray3 focal
F1=(Lx-f,ay);F2=(Lx+f,ay);yL=ext(T,F1,Lx)[1]
d.line([T,(Lx,yL)],fill=(20,140,70),width=3);arrowhead(d,T,F1,(20,140,70),0.6)
d.line([(Lx,yL),(1100,yL)],fill=(20,140,70),width=3);arrowhead(d,(Lx,yL),(1100,yL),(20,140,70),0.5)
for p in [F1,F2,(Lx,ay)]: dot(d,p)
im.save(os.path.join(O,'physopt-u3','dg-three-rays.png'))
nod=ext(T,(Lx,ay),720)
print('rays',{'obj':P(ox,ay-oh/2),'img':P(ix,ay-ih/2),'F1':P(*F1),'F2':P(*F2),'center':P(Lx,ay),'par':P(430,T[1]),'nod':P(*nod),'foc':P(700,yL),'axis':P(1130,ay)})

# 3 高斯系統基點
W,H=1200,480;im=Image.new('RGB',(W,H),'white');d=ImageDraw.Draw(im)
ay=260;L1=470;Lb=720;H1=530;H2=620;f1=-250;f2=300;N1=H1+(f1+f2);N2=H2+(f1+f2);F1=H1+f1;F2=H2+f2
d.rectangle([L1,90,Lb,430],fill=(225,238,250),outline=BLU,width=3)
d.line([(20,ay),(1180,ay)],fill=GR,width=2)
for x in (H1,H2): dashed(d,(x,60),(x,450),BL,2,9)
# parallel ray -> H2 -> F2
yy=150;d.line([(60,yy),(H2,yy)],fill=RED,width=3);arrowhead(d,(60,yy),(H1,yy),RED)
e=ext((H2,yy),(F2,ay),1150);d.line([(H2,yy),e],fill=RED,width=3);arrowhead(d,(F2,ay),e,RED,0.5)
# F1 ray -> H1 -> parallel
y2=ext((F1,ay),(H1,ay+70),H1)[1];s0=ext((F1,ay),(H1,y2),80)
d.line([s0,(H1,y2)],fill=(20,140,70),width=3);arrowhead(d,s0,(F1,ay),(20,140,70),0.6)
d.line([(H1,y2),(1150,y2)],fill=(20,140,70),width=3);arrowhead(d,(Lb,y2),(1150,y2),(20,140,70),0.5)
# nodal ray
ang=math.radians(14);s=(N1-380,ay-380*math.tan(ang));d.line([s,(N1,ay)],fill=(120,60,160),width=3);arrowhead(d,s,(N1,ay),(120,60,160),0.5)
e=(N2+380,ay+380*math.tan(ang));d.line([(N2,ay),e],fill=(120,60,160),width=3);arrowhead(d,(N2,ay),e,(120,60,160),0.5)
dashed(d,(N1,ay),(N2,ay),(120,60,160),3,6)
for x in (F1,F2,N1,N2): dot(d,(x,ay))
im.save(os.path.join(O,'physopt-u4','dg-cardinal.png'))
print('cardinal',{'F1':P(F1,ay),'F2':P(F2,ay),'H1':P(H1,390),'H2':P(H2,390),'N1':P(N1,ay),'N2':P(N2,ay),'L1':P(L1,340),'Lb':P(Lb,340)})
