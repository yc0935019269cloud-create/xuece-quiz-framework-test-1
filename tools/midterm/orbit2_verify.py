"""Verify blocklist/pool exclusion and the ten explicitly requested view rows."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def load(p):return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
pack=load('content/learn/eye_anat/midterm-review.json')
before=load('tmp/orbit2-before.json')
blocks={(b['img'],b['zh']) for b in load('tools/midterm/view_blocklist.json')}
qs={}
figures={}
for p in (ROOT/'content/learn/eye_anat').glob('*.json'):
    if p.name=='midterm-review.json':continue
    a=json.loads(p.read_text(encoding='utf-8-sig'))
    for lesson in a['lessons']:
        for i,st in enumerate((s for s in lesson['steps'] if s.get('type')=='diagram'),1):
            figures[f"{a['id']}-q-{lesson['id']}-{i}"]=st
for p in (ROOT/'content/bank/eye_anat/lab').rglob('*.json'):
    a=json.loads(p.read_text(encoding='utf-8-sig'))
    for q in a['questions']:
        imgs=q.get('img',[]);imgs=[imgs] if isinstance(imgs,str) else imgs
        figure=figures.get(a['set']['id'])
        if figure:imgs=[*imgs,figure['img']]
        qs[a['set']['id']+'-'+str(q['n'])]=(imgs,q)
errors=[];excluded=set();rows=[]
for lesson in pack['lessons']:
    for step in lesson['steps']:
        if step['type']!='termlist':continue
        for g in step['groups']:
            for r in g['items']:
                zh=re.sub(r'^\d+\.\s*','',r['zh'])
                for v in r['views']:
                    if (v['img'],zh) in blocks:errors.append(('blocked view retained',lesson['id'],zh,v['img']))
                for qid in r.get('qids',[]):
                    if any((im,zh) in blocks for im in qs[qid][0]):errors.append(('blocked row qid',lesson['id'],zh,qid))
                if lesson['id']=='manual' and g['name']=='骨質眼窩':
                    if not r['views']:errors.append(('no replacement',zh))
                    rows.append(r)
    # All removed question/image pairs must also leave each lesson's aggregate pool.
    old=next((l for l in before['lessons'] if l['id']==lesson['id']),None)
    if not old:continue
    removed=set()
    for st in old['steps']:
        if st['type']!='termlist':continue
        for g in st['groups']:
            for r in g['items']:
                zh=re.sub(r'^\d+\.\s*','',r['zh'])
                for qid in r.get('qids',[]):
                    if any((im,zh) in blocks for im in qs.get(qid,([],{}))[0]):removed.add(qid)
    excluded.update(removed)
    for st in lesson['steps']:
        if st['type']=='practice':
            for qid in set(st.get('qids',[]))&removed:errors.append(('blocked aggregate qid',lesson['id'],qid))
targets=['滑車窩','淚腺窩','淚窩','外側結節','前篩孔','後篩孔','視神經管','眶上孔','眶下孔','蝶鞍']
summary=[]
for name in targets:
    r=next(r for r in rows if r['zh']==name)
    summary.append(dict(zh=name,views=len(r['views']),best=r['views'][0]['img'],status='概略定位，隆起未確證' if name=='外側結節' else '450px 疊圖已人工核對',qids=len(r['qids'])))
    if '/orbit2-' not in r['views'][0]['img']:errors.append(('primary view absent',name))
    if name=='外側結節' and '大致位置' not in r['views'][0]['title']:errors.append(('approx not disclosed',name))
out=dict(errors=errors,targets=summary,excludedQuestionCount=len(excluded),excludedQuestionIds=sorted(excluded),blocklistedOrbitPairs=len(load('docs/midterm-views/orbit2-blocked.json')))
(ROOT/'docs/midterm-views/orbit2-verification.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'{len(errors)} semantic failures; {len(excluded)} excluded questions; {len(rows)} group rows; 9 clear targets + 1 disclosed approximate fallback.')
if errors:raise SystemExit(errors)
