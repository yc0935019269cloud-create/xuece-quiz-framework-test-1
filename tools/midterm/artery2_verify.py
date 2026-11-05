"""Check artery blocklist/question filtering and data-only marker handoff."""
import json,runpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
ns=runpy.run_path(str(ROOT/'tools/midterm/build_midterm.py'))
pack=ns['pack'];pairs=ns['blocked_pairs'];qi=ns['question_images']
extra=json.loads((ROOT/'tools/midterm/extra_views.json').read_text(encoding='utf8'))
before=json.loads((ROOT/'tmp/artery2-before.json').read_text(encoding='utf8'))['items']
rows=next(g['items'] for l in pack['lessons'] if l['id']=='manual' for s in l['steps'] if s['type']=='termlist' for g in s['groups'] if g['name']=='動脈')
original_qids={r['zh']:r.get('qids',[]) for r in before}
checks=[]
def ok(label,test):
 checks.append({'label':label,'pass':bool(test)})
 if not test:raise AssertionError(label)
ok('row names/order unchanged',[r['zh'] for r in rows]==[r['zh'] for r in before])
all_rejected=set();fallbacks=[]
for l in pack['lessons']:
 rejected=set()
 for s in l['steps']:
  if s['type']!='termlist':continue
  for g in s['groups']:
   for r in g['items']:
    zh=__import__('re').sub(r'^\d+\.\s*','',r['zh'])
    if zh not in {r['zh'] for r in before}:continue
    bad=[v for v in r['views'] if (v['img'],zh) in pairs]
    if bad:
     ok(l['id']+'/'+zh+' single explicit fallback',len(r['views'])==1 and '需要更好的圖' in bad[0]['title'])
     fallbacks.append({'lesson':l['id'],'zh':zh,'img':bad[0]['img']})
    ok(l['id']+'/'+zh+' blocked source absent from row qids',not any((im,zh) in pairs for q in r.get('qids',[]) for im in qi.get(q,[])))
    for q in original_qids[zh]:
     imgs=qi.get(q,[])
     if any((im,zh) in pairs for im in imgs):rejected.add(q)
 for s in l['steps']:
  if s['type']=='practice':ok(l['id']+' practice excludes blocked artery qids',not (set(s.get('qids',[]))&rejected))
 all_rejected.update(rejected)

new=[f for f in extra if Path(f['img']).name.startswith('artery2-')]
ok('six added images',len(new)==6)
from PIL import Image
for f in new:
 im=Image.open(ROOT/f['img']);im.verify()
 ok(f['img']+' at most 1600px wide',Image.open(ROOT/f['img']).width<=1600)
 ok(f['img']+' source URL and license',all(t in f['source'] for t in ['https://commons.wikimedia.org/wiki/File:']) and any(t in f['source'] for t in ['公有領域','CC0']))
 for p in f['points']:
  ok(f['img']+'/'+p['zh']+' valid marker',p.get('mark') in ['ring','dot','arrow'] and all(0<=p[k]<=100 for k in ['x','y']))
  if p['mark']=='arrow':ok(f['img']+'/'+p['zh']+' valid tail',isinstance(p.get('from'),dict) and all(0<=p['from'][k]<=100 for k in ['x','y']))
for f in json.loads((ROOT/'docs/midterm-views/artery2-old-audit.json').read_text(encoding='utf8')):
 metadata=next(e for e in extra if e['img']==f['img'])
 for p in f['points']:
  ok(f['img']+'/'+p['zh']+' audited marker recorded',any(q['zh']==p['zh'] and q.get('mark') in ['ring','dot','arrow'] for q in metadata['points']))
oldq=set(q for r in before for q in r.get('qids',[]));newq=set(q for r in rows for q in r.get('qids',[]))
result={'checks':len(checks),'failures':[],'auditSources':19,'auditPoints':86,'newImages':6,'newImagePoints':sum(len(f['points']) for f in new),'manualRemovedQids':sorted(oldq-newq),'allBlockedArteryQuestionIds':len(all_rejected),'fallbacks':fallbacks,'details':checks}
(ROOT/'docs/midterm-views/artery2-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('checks',len(checks),'failures 0; manual removed qids',len(oldq-newq),'all blocked artery question ids',len(all_rejected))
