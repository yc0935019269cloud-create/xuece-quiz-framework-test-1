import json,glob,sys
sys.stdout.reconfigure(encoding='utf-8')
for f in glob.glob('content/learn/optometry/optom2/*.json'):
    d=json.load(open(f,encoding='utf-8'))
    for l in d['lessons']:
        ty=[s['type'] for s in l['steps']]
        if ty.count('card')>5: print(d['id'],l['id'],'cards',ty.count('card'))
        for i,s in enumerate(l['steps']):
            if s['type'] in('card','intro'):
                n=len('\n'.join(s['body']) if isinstance(s['body'],list) else s['body'])
                if n>900: print(d['id'],l['id'],i,s['type'],s.get('title'),n)
            if s['type']=='card' and (i+1>=len(ty) or ty[i+1]!='check'): print(d['id'],l['id'],i,'card not followed by check')
