import fitz,re,json,sys
from pathlib import Path
MK={'\ue18c':'A','\ue18d':'B','\ue18e':'C','\ue18f':'D'}
def parse(path):
    d=fitz.open(path)
    n=len(d)
    last=d[n-1]
    # answers from words on the last page
    words=last.get_text('words')
    labels=[(w,int(re.match(r'第(\d+)題',w[4]).group(1))) for w in words if re.match(r'^第\d+題$',w[4])]
    letters=[w for w in words if re.fullmatch(r'[A-D]',w[4])]
    ans={}
    for w,k in labels:
        cand=[l for l in letters if l[0]>=w[0]-6 and l[2]<=w[2]+6 and 8<l[1]-w[1]<30]
        if cand: ans[k]=min(cand,key=lambda l:l[1]-w[1])[4]
    # fallback if table is column-ordered: if few matched, sequence mapping
    note=''
    t=last.get_text()
    m=re.search(r'備\s*註：\s*([\s\S]*)$',t)
    if m: note=m.group(1).strip()
    # questions
    txt=''
    for p in d:
        if p.number==n-1: break
        for b in p.get_text('blocks'):
            txt+=b[4]
    txt=txt.replace('\u3000',' ')
    for k,v in MK.items(): txt=txt.replace(k,'\n§'+v+'§')
    lines=txt.split('\n')
    qs=[];cur=None;expect=1
    for ln in lines:
        s=ln.strip()
        if re.fullmatch(r'\d{1,3}',s) and int(s)==expect:
            cur={'n':expect,'stem':[],'opt':{}, 'o':None};qs.append(cur);expect+=1;continue
        if cur is None: continue
        mm=re.match(r'^§([A-D])§(.*)$',s)
        if mm:
            cur['o']=mm.group(1);cur['opt'][cur['o']]=mm.group(2).strip();continue
        if re.match(r'^(代號|頁次)：',s): continue
        if cur['o']: cur['opt'][cur['o']]+=(' '+s if s else '')
        else: cur['stem'].append(s)
    out=[]
    for q in qs:
        out.append({'n':q['n'],'stem':' '.join(x for x in q['stem'] if x).strip(),'choices':[q['opt'].get(c,'').strip() for c in 'ABCD'],'answer':ans.get(q['n'])})
    return out,note
if __name__=='__main__':
    root=Path(r'E:\學習\驗光師國考題')
    res={}
    for sub,subj in [('驗光師','視光學'),('驗光生','驗光學概要'),('驗光師','低視力學'),('驗光師','隱形眼鏡學與配鏡學')]:
        for f in sorted((root/sub/subj).glob('*.pdf')):
            qs,note=parse(f)
            miss=[q['n'] for q in qs if not q['answer'] or any(not c for c in q['choices'])]
            print(f.name,len(qs),'noans/nochoice:',miss[:10],'note:',note[:60].replace('\n',' '))
            res[f"{sub}|{subj}|{f.stem}"]={'questions':qs,'note':note}
    Path('exams.json').write_text(json.dumps(res,ensure_ascii=False,indent=1),encoding='utf-8')
