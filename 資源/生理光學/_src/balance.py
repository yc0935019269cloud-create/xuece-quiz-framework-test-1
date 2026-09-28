import json,glob,re,sys,collections
sys.stdout.reconfigure(encoding='utf-8')
BASE=r"E:\NEWTEST\新刷題庫框架 - TEST 1\資源\生理光學\content\learn\physopt"
TOK=re.compile(r'(?<![0-9A-Za-z.\-−+ ])([A-D])(?![A-Za-z0-9₀-₉])')
L='ABCD'
def has_letters(c):
    txt=c['q']+' '.join(c['choices'])
    return bool(re.search(r'(?<![A-Za-z])[A-D](?![A-Za-z])',txt.replace(' D','').replace('D ','')))
items=[]
files={}
for f in sorted(glob.glob(BASE+r'\*.json')):
    d=json.load(open(f,encoding='utf-8'));files[f]=d
    for Ls in d['lessons']:
        for s in Ls['steps']:
            if s['type']=='check' and s['kind']=='single': items.append(s)
            if s['type']=='practice':
                for c in s.get('checks',[]):
                    if c['kind']=='single': items.append(c)
cnt=collections.Counter(c['answer'] for c in items if len(c['choices'])>=4)
print('before',dict(cnt))
target=sum(cnt.values())/4
for c in items:
    a=c['answer']
    if len(c['choices'])<4 or cnt[a]<=target+1 or has_letters(c): continue
    b=min('ACD'.replace(a,'') if a!='B' else 'ACD',key=lambda x:cnt[x]) if a=='B' else None
    if not b or cnt[b]>=target: continue
    i,j=L.index(a),L.index(b)
    ch=c['choices'];ch[i],ch[j]=ch[j],ch[i]
    old=c['explain']
    def sw(m):
        x=m.group(1);return b if x==a else a if x==b else x
    for k in ('explain','hint'):
        if isinstance(c.get(k),str): c[k]=TOK.sub(sw,c[k])
    c['answer']=b;cnt[a]-=1;cnt[b]+=1
    print('----',c['q'][:40],a,'->',b);print('  ',c['explain'][:160].replace('\n',' '))
print('after',dict(cnt))
for f,d in files.items(): json.dump(d,open(f,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
