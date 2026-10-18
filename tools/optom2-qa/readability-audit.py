"""三單元來源完整性與進度鍵核對；不是醫學審題認證。"""
import ast
import copy
import hashlib
import json
import re
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
tree=ast.parse((ROOT/'tools/learn-redo/optometry_corrections.py').read_text(encoding='utf-8'))
mapping=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='REPLACE' for t in n.targets))
def fixed(v):
    if isinstance(v,str): return mapping.get(v,v)
    if isinstance(v,list): return [fixed(x) for x in v]
    if isinstance(v,dict): return {k:fixed(x) for k,x in v.items()}
    return v
def flashes(l):
    return [f for s in l['steps'] for f in (s.get('flash',[]) if isinstance(s.get('flash',[]),list) else [s['flash']])]
def questions(l):
    return [s for s in l['steps'] if s['type'] in ('check','example','practice')]
def refs(v):
    return set(re.findall(r'\d{3}\s+(?:生普|生特|師高|師特|低高|低特)\s+\d+',json.dumps(v,ensure_ascii=False)))
report={'baseline':'22cfdff','lessons':[],'issues':[]}
def require(ok,tag):
    if not ok: report['issues'].append(tag)
for unit in ('optom2-u2-msr','optom2-u3-vf','optom2-u4-bb'):
    rel=f'content/learn/optometry/optom2/{unit}.json'
    original=json.loads(subprocess.check_output(['git','show',f'22cfdff:{rel}'],cwd=ROOT))
    edited=json.loads((ROOT/rel).read_text(encoding='utf-8'))
    a,b=copy.deepcopy(original),copy.deepcopy(edited)
    a.pop('lessons');b.pop('lessons')
    require(fixed(a)==b,unit+' 非課程欄位只容許已記錄的錯誤更正')
    require([l['id'] for l in original['lessons']]==[l['id'] for l in edited['lessons']],unit+' 課程ID')
    for old,new in zip(original['lessons'],edited['lessons']):
        key=unit+'/'+old['id']
        require(fixed(questions(old))==questions(new),key+' 題目／範例／實戰完整（含明列更正）')
        require(fixed(flashes(old))==flashes(new),key+' 記憶卡完整（含明列更正）')
        require(refs(old)<=refs(new),key+' 考題出處遺漏 '+str(refs(old)-refs(new)))
        require(old.get('teaches')==new.get('teaches'),key+' teaches改變')
        # check/flash 的自動ID只依 pack/lesson 及題幹/正面，不依頁數。
        for x,y in zip(questions(old),questions(new)):
            if x['type']=='check': require(x['q']==y['q'],key+' 檢核題進度鍵')
        require([f['front'] for f in flashes(old)]==[f['front'] for f in flashes(new)],key+' 記憶卡進度鍵')
        report['lessons'].append(dict(unit=unit,lesson=old['id'],steps=len(new['steps']),cards=sum(s['type']=='card' for s in new['steps']),checks=sum(s['type']=='check' for s in new['steps']),flashcards=len(flashes(new)),examReferences=len(refs(old))))
report['totals']={k:sum(l[k] for l in report['lessons']) for k in ('steps','cards','checks','flashcards','examReferences')}
out=ROOT/'output/playwright/optometry-readability-audit.json'
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'lessons':len(report['lessons']),**report['totals'],'issues':report['issues']},ensure_ascii=False))
raise SystemExit(bool(report['issues']))
