from s114_course_common import *
from s114_course_corrections import fixed
import math
d=plan();report=dict(baseline=BASE,lessons=[],issues=[],numeric=[])
def check(ok,message):
 if not ok:report['issues'].append(message)
def norm(s):return re.sub(r'\s+','',s)
def text(s):return '\n'.join(s) if isinstance(s,list) else (s or '')
def flashes(l):return [f for s in l['steps'] for f in (s.get('flash',[]) if isinstance(s.get('flash',[]),list) else [s['flash']])]
def questions(l):return [s for s in l['steps'] if s['type'] in ('check','example','practice')]
for e in d['lessons']:
 old=next(l for l in baseline(e['unit'])['lessons'] if l['id']==e['lesson'])
 p=json.loads((ROOT/FOLDER/(e['unit']+'.json')).read_text(encoding='utf-8'));new=next(l for l in p['lessons'] if l['id']==e['lesson'])
 tag=e['unit']+'/'+e['lesson'];cards=[s for s in new['steps'] if s['type']=='card']
 allbody=norm('\n'.join(text(s.get('body')) for s in cards))
 for i,s in enumerate(s for s in old['steps'] if s['type']=='card'):
  check(norm(text(fixed(s.get('body')))) in allbody,tag+f' 原正文遺漏#{i}')
  for field in ('exam','demo','keys'):
   values=[v for c in cards for v in c.get(field,[])]
   check(all(v in values or norm(v) in allbody for v in fixed(s.get(field,[]))),tag+f' {field}遺漏#{i}')
  if s.get('tip'):check(fixed(s['tip']) in [c.get('tip') for c in cards] or norm(fixed(s['tip'])) in allbody,tag+' tip遺漏')
 check(fixed(questions(old))==questions(new),tag+' 原題／範例／實戰變更超出更正規則')
 check(fixed(flashes(old))==flashes(new),tag+' 記憶卡遺漏')
 check(fixed([s for s in old['steps'] if s['type']=='intro'])==[s for s in new['steps'] if s['type']=='intro'],tag+' 導入遺漏')
 check(fixed({k:v for k,v in old.items() if k not in ('steps','pace')})=={k:v for k,v in new.items() if k not in ('steps','pace')},tag+' 課ID／目標／出處變動')
 report['lessons'].append(dict(unit=e['unit'],lesson=e['lesson'],steps=len(new['steps']),cards=len(cards),checks=sum(s['type']=='check' for s in old['steps']),flashcards=len(flashes(old)),bridges=e['bridges']))
for f in (ROOT/FOLDER).glob('*.json'):
 old=baseline(f.stem);new=json.loads(f.read_text(encoding='utf-8'));lids={e['lesson'] for e in d['lessons'] if e['unit']==f.stem}
 check({k:v for k,v in old.items() if k!='lessons'}=={k:v for k,v in new.items() if k!='lessons'},f.stem+' pack欄位變動')
 check([l for l in old['lessons'] if l['id'] not in lids]==[l for l in new['lessons'] if l['id'] not in lids],f.stem+' 非目標課變動（含總複習／名詞）')
def num(name,actual,expected,tol=1e-6):
 ok=abs(actual-expected)<tol;report['numeric'].append(dict(name=name,actual=actual,expected=expected,pass_=ok));check(ok,name)
for n,a,b in [('小數轉MAR',1/.2,5),('40cm1M',.4/1,.4),('條紋cpd',60/2,30),('logMAR兩字',.9-.02*2,.86),('處方兩方向',3.5-2.25,1.25),('SE',-4-2.5/2,-5.25),('WD50cm',1/.5,2),('毛淨值',-3-2,-5),('負散C',-1.75-.5,-2.25),('Prentice',.8*3,2.4),('角膜K',337.5/7.5,45),('Javal逆規',1.25*2+.5,3),('AA負鏡',2.5+2,4.5),('AA50歲最小',15-.25*50,2.5),('Hofstetter45最大',25-.4*45,7),('遠視AA',1/.2+2,7),('角秒',60*60,3600)]:num(n,a,b)
report['totals']={k:sum(l[k] for l in report['lessons']) for k in ('steps','cards','checks','flashcards','bridges')}
def compiled(name,key,old=False):
 s=subprocess.check_output(['git','show',f'{BASE}:data/{name}.js']).decode('utf-8') if old else (ROOT/f'data/{name}.js').read_text(encoding='utf-8')
 v=json.loads(s.split('window.'+key+'=',1)[1].strip().rstrip(';'));v.pop('built',None);return v
a,b=compiled('learn','LEARN',True),compiled('learn','LEARN')
ap={p['id']:p for p in a.pop('packs')};bp={p['id']:p for p in b.pop('packs')};names={e['unit'] for e in d['lessons']}
check(a==b,'編譯metadata改變')
check(all(ap[k]==bp[k] for k in ap if k not in names),'其他編譯單元改變')
ids=lambda pack:[(l['id'],s.get('id')) for l in pack['lessons'] for s in l['steps'] if s['type']=='check']
flashids=lambda pack:[(l['id'],f.get('id')) for l in pack['lessons'] for s in l['steps'] for f in (s.get('flash',[]) if isinstance(s.get('flash',[]),list) else [s['flash']])]
check(all(ids(ap[k])==ids(bp[k]) and flashids(ap[k])==flashids(bp[k]) for k in names),'編譯檢核／卡片ID變動')
check(compiled('bank','QB',True)==compiled('bank','QB'),'題庫內容變動')
report['compiled']='Other packs, metadata, question bank and all check/flash IDs unchanged (ignoring build timestamp)'
out=ROOT/'output/playwright';out.mkdir(parents=True,exist_ok=True)
(out/'s114-course-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(lessons=len(report['lessons']),**report['totals'],numeric=len(report['numeric']),issues=report['issues']),ensure_ascii=False))
raise SystemExit(bool(report['issues']))
