"""Analyze generated PNG alpha and write frame rectangles only. Never modifies images."""
from pathlib import Path
import json, sys
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=json.loads((ROOT/'docs/hero-art/manifest.json').read_text(encoding='utf-8'))
def components(mask):
    parents=[]; runs=[]; previous=[]
    def find(i):
        while parents[i]!=i:
            parents[i]=parents[parents[i]];i=parents[i]
        return i
    for y,row in enumerate(mask):
        marks=np.diff(np.r_[False,row,False].astype(np.int8))
        starts=np.flatnonzero(marks==1); ends=np.flatnonzero(marks==-1)-1
        current=[]; j=0
        for x0,x1 in zip(starts,ends):
            idx=len(parents);parents.append(idx);x0=int(x0);x1=int(x1)
            while j<len(previous) and previous[j][1]<x0-1:j+=1
            k=j
            while k<len(previous) and previous[k][0]<=x1+1:
                other=find(previous[k][2]);mine=find(idx)
                if other!=mine:parents[other]=mine
                k+=1
            current.append((x0,x1,idx));runs.append((y,x0,x1,idx))
        previous=current
    groups={}
    for y,x0,x1,idx in runs:
        root=find(idx);g=groups.setdefault(root,{'id':root,'area':0,'x0':x0,'x1':x1,'y0':y,'y1':y,'runs':[]})
        g['area']+=x1-x0+1;g['x0']=min(g['x0'],x0);g['x1']=max(g['x1'],x1)
        g['y0']=min(g['y0'],y);g['y1']=max(g['y1'],y);g['runs'].append((y,x0,x1))
    return sorted(groups.values(),key=lambda g:g['area'],reverse=True)

def analyze(path):
    im=Image.open(path).convert('RGBA');array=np.array(im);alpha=array[:,:,3];height,width=alpha.shape
    transparent=float((alpha<8).mean())
    if transparent<.12:raise ValueError('Insufficient transparent background: '+str(transparent))
    groups=components(alpha>48)
    mains=[g for g in groups if g['area']>900][:8]
    if len(mains)!=8:raise ValueError('Expected 8 character components; found '+str(len(mains)))
    mains=sorted(mains,key=lambda g:(g['y0']+g['y1'])/2)
    mains=sorted(mains[:4],key=lambda g:g['x0'])+sorted(mains[4:],key=lambda g:g['x0'])
    typical_area=float(np.median([g['area'] for g in mains]))
    if any(g['area']<typical_area*.28 or g['x1']-g['x0']>width*.43 for g in mains):
        raise ValueError('Merged poses or detached effect mistaken for a character')
    # Significant parts of the same sprite can be disconnected (staff, shield, sparks).
    boxes=[[g['x0'],g['y0'],g['x1'],g['y1']] for g in mains]
    main_ids={g['id'] for g in mains}
    owners={g['id']:i for i,g in enumerate(mains)}
    for g in groups:
        if g['id'] in main_ids or g['area']<8:continue
        gx=(g['x0']+g['x1'])/2;gy=(g['y0']+g['y1'])/2
        def distance(m):
            dx=max(m['x0']-gx,0,gx-m['x1']);dy=max(m['y0']-gy,0,gy-m['y1'])
            center=abs(gx-(m['x0']+m['x1'])/2)+abs(gy-(m['y0']+m['y1'])/2)
            return dx*dx+dy*dy+center*.12
        idx=min(range(8),key=lambda i:distance(mains[i]))
        if distance(mains[idx])>(width*.12)**2:continue
        owners[g['id']]=idx
        box=boxes[idx];box[0]=min(box[0],g['x0']);box[1]=min(box[1],g['y0']);box[2]=max(box[2],g['x1']);box[3]=max(box[3],g['y1'])
    frames=[]
    for g,b in zip(mains,boxes):
        foot_runs=[r for r in g['runs'] if r[0]>=g['y1']-max(5,int((g['y1']-g['y0'])*.07))]
        weight=sum(r[2]-r[1]+1 for r in foot_runs)
        pivot=sum(((r[1]+r[2])/2)*(r[2]-r[1]+1) for r in foot_runs)/max(1,weight)
        x=max(0,b[0]-3);y=max(0,b[1]-3);x1=min(width,b[2]+4);y1=min(height,b[3]+4)
        frame_index=len(frames)
        cut=[]
        for other in groups:
            if owners.get(other['id']) in (None,frame_index):continue
            if other['x1']<x or other['x0']>=x1 or other['y1']<y or other['y0']>=y1:continue
            for ry,rx0,rx1 in other['runs']:
                if y<=ry<y1 and rx1>=x and rx0<x1:
                    left=max(x,rx0);right=min(x1,rx1+1)
                    cut.append([left-x,ry-y,right-left])
        frames.append({'x':x,'y':y,'w':x1-x,'h':y1-y,'pivotX':round(pivot-x,2),'pivotY':g['y1']+1-y,'area':g['area'],'cut':cut})
    scale_h=max(f['h'] for f in frames)
    scale_w=max(2*max(f['pivotX'],f['w']-f['pivotX']) for f in frames)
    for f in frames:f['scaleH']=scale_h;f['scaleW']=round(scale_w,2)
    # Sheet layout checks catch missing rows, duplicate grids, and major cross-sprite merges.
    centers=[(g['x0']+g['x1'])/2 for g in mains]
    if any(centers[i+1]-centers[i]<width*.09 for i in [0,1,2,4,5,6]):raise ValueError('Pose centers too close')
    return {'width':width,'height':height,'transparentFraction':round(transparent,4),'frames':frames}

atlas={};errors=[]
for actor in MANIFEST['actors']:
    path=ROOT/actor['file']
    if not path.exists():errors.append({'id':actor['id'],'error':'Missing PNG'});continue
    try:atlas[actor['id']]=analyze(path)
    except Exception as exc:errors.append({'id':actor['id'],'error':str(exc)})
(ROOT/'docs/hero-art/atlas-check.json').write_text(json.dumps({'ok':len(atlas),'expected':40,'errors':errors,'atlas':atlas},ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'js/hero-atlas.js').write_text('/* Generated source rectangles; PNGs remain untouched. */\nwindow.HERO_ATLAS='+json.dumps(atlas,separators=(',',':'))+';\n',encoding='utf-8')
print(json.dumps({'ok':len(atlas),'expected':40,'errors':errors},ensure_ascii=False))
if errors:sys.exit(1)

