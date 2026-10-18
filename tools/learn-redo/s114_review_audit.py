"""九堂複習的範圍隔離、原題、卡片、出處與數值驗算。"""
from s114_review_common import *
import ast
import math
import re
tree=ast.parse((ROOT/'tools/learn-redo/s114_review_corrections.py').read_text(encoding='utf-8'))
replace=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='REPLACE' for t in n.targets))
def fixed(x):
    if isinstance(x,str):return replace.get(x,x)
    if isinstance(x,list):return [fixed(v) for v in x]
    if isinstance(x,dict):return {k:fixed(v) for k,v in x.items()}
    return x
def refs(x):
    # 舊導入器在各課intro一律放108師高視覺30作「出處格式」示例，不算該單元實際引用。
    x={**x,'steps':[s for s in x['steps'] if s['type']!='intro']}
    return set(re.findall(r'\d{3}\s+(?:師高|師特|生普|生特|低高|低特)[\u4e00-\u9fff]*\s+\d+',json.dumps(x,ensure_ascii=False)))
def flashes(l):return [f for s in l['steps'] for f in (s.get('flash',[]) if isinstance(s.get('flash',[]),list) else [s['flash']])]
def preserved(l):
    a=copy.deepcopy([s for s in l['steps'] if s['type'] in ('check','example','practice')])
    for s in a:
        if s['type']=='practice':s.get('pick',{}).pop('exams',None)
    return a

def reminders(l,key):
    return [text for s in l['steps'] if s['type']=='card' for text in s.get(key,[])]
report=dict(baseline=BASE,lessons=[],issues=[],numeric=[])
def check(ok,msg):
    if not ok:report['issues'].append(msg)
for n,slug in SCOPE:
    name='s114-optometry-'+slug;old=baseline(name);new=json.loads((ROOT/FOLDER/(name+'.json')).read_text(encoding='utf-8'))
    check(old['lessons'][:-1]==new['lessons'][:-1],name+' 其他正課變動')
    check({k:v for k,v in old.items() if k!='lessons'}=={k:v for k,v in new.items() if k!='lessons'},name+' 非課程欄位變動')
    a,b=old['lessons'][-1],new['lessons'][-1]
    check(a['id']==b['id'],name+' 課ID改變')
    check(fixed(preserved(a))==preserved(b),name+' 原題／範例／實戰遺漏或未列明更正')
    check(fixed(flashes(a))==flashes(b),name+' 記憶卡遺漏')
    for key in ('exam','demo'):
        check(all(text in reminders(b,key) for text in fixed(reminders(a,key))),name+' 原國考提醒／示範遺漏 '+key)
    check(refs(a)<=refs(b),name+' 出處遺漏 '+str(refs(a)-refs(b)))
    bank_ids=next(s['pick']['exams'] for s in b['steps'] if s['type']=='practice')
    check(all(re.fullmatch(r's114-optometry-exam\d+-u'+n,x) for x in bank_ids),name+' 總演練越界')
    report['lessons'].append(dict(number=n,unit=name,lesson=b['id'],steps=len(b['steps']),cards=sum(s['type']=='card' for s in b['steps']),checks=sum(s['type']=='check' for s in b['steps']),flashcards=len(flashes(b)),examReferences=len(refs(a)),examSets=bank_ids))
# 非目標檔（含terms與全部p1）同基準逐檔一致。
targets={'s114-optometry-'+slug for _,slug in SCOPE}
for file in (ROOT/FOLDER).glob('*.json'):
    if file.stem not in targets:check(json.loads(file.read_text(encoding='utf-8'))==baseline(file.stem),file.stem+' 非目標單元改變')
def num(name,actual,expected,tol=1e-6):
    ok=abs(actual-expected)<=tol;report['numeric'].append(dict(name=name,actual=actual,expected=expected,pass_=ok));check(ok,'數值 '+name)
num('logMAR每字',.5-2*.02,.46)
num('視標4m0.4約值',5.82/.4,14.55)
num('視標6m1.0',6000*math.tan(math.radians(5/60)),8.73,.01)
num('距離折算',.1*3/6,.05)
num('簡化眼正視mm',1.333/60*1000,22.22,.01)
num('簡化眼軸性-3mm',1.333/57*1000,23.39,.01)
num('Prentice8mm3D',.8*3,2.4)
num('近PD',65*400/427,61,.2)
num('工作距離80cm',1/.8,1.25)
num('換工作距離毛值',-6-1.5+2,-5.5)
num('K7.5mm',337.5/7.5,45)
num('殘餘同軸',-4.75-(-3),-1.75)
num('遠點眼前5mAA',1/.25-1/5,3.8)
num('遠點眼後50cmAA',1/.2+1/.5,7)
num('近視近點cm',100/(6-(-2)),12.5)
num('遠視近點cm',100/(4-3),100)
num('半幅ADD',1/.4-1.5/2,1.75)
num('Hofstetter50最小',15-.25*50,2.5)
report['totals']={k:sum(e[k] for e in report['lessons']) for k in ('steps','cards','checks','flashcards','examReferences')}
(ROOT/'output/playwright/s114-review-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(dict(lessons=len(report['lessons']),**report['totals'],numeric=len(report['numeric']),issues=report['issues']),ensure_ascii=False))
raise SystemExit(bool(report['issues']))
