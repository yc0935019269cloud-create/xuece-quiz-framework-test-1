"""大一下：只重寫各單元最後一堂國考重點複習，其他課與題庫不動。"""
import copy
import json
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BASE='a72883ca00ed1ba3ecb958c5ab5d89f4f120d5dd'
FOLDER=Path('content/learn/optometry/semester114')
LEDGER=ROOT/'tools/learn-redo/s114-review-progress.json'
SCOPE=[('01','va-sph'),('02','astigmatism-rx'),('03','retinoscopy-intro'),('04','pd-lensometry-p2'),('05','objective-refraction-p2'),('06','keratometry-p2'),('07','pupil-response-p2'),('08','stereopsis-p2'),('09','near-point-p2')]
def page(title,text,**kw): return dict(type='card',title=title,body=text.strip().splitlines(),**kw)
def baseline(name):
    return json.loads(subprocess.check_output(['git','show',f'{BASE}:{(FOLDER/(name+".json")).as_posix()}'],cwd=ROOT))

def write_pack(path,pack):
    # Imported p2 packs use two spaces; the earlier three packs use one.
    raw=subprocess.check_output(['git','show',f'{BASE}:{path.relative_to(ROOT).as_posix()}'],cwd=ROOT).decode('utf-8')
    indent=len(raw.splitlines()[1])-len(raw.splitlines()[1].lstrip())
    path.write_text(json.dumps(pack,ensure_ascii=False,indent=indent)+'\n',encoding='utf-8')
def ledger():
    if LEDGER.exists(): return json.loads(LEDGER.read_text(encoding='utf-8'))
    entries=[]
    for n,slug in SCOPE:
        name='s114-optometry-'+slug;p=baseline(name);l=p['lessons'][-1]
        assert '國考重點複習' in l['title']
        entries.append(dict(number=n,unit=name,lesson=l['id'],title=l['title'],status='待改寫'))
    d=dict(baseline=BASE,scope='114大一下視光學01～09各一堂總複習；不含其他正課／99名詞',lessons=entries)
    LEDGER.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return d
class Review:
    def __init__(self,slug):
        self.name='s114-optometry-'+slug
        self.path=ROOT/FOLDER/(self.name+'.json')
        self.original=baseline(self.name)
        self.pack=json.loads(self.path.read_text(encoding='utf-8'))
        self.old=self.original['lessons'][-1]
        self.cards=[s for s in self.old['steps'] if s['type']=='card']
        self.parts={};self.before=[];self.intro=None
        ledger()
    def set(self,i,title,text,*,extra=()):
        assert i not in self.parts
        old=self.cards[i];p=page(title,text)
        if old.get('flash'):p['flash']=copy.deepcopy(old['flash'])
        arr=[p,*extra]
        # 原考點來源／陷阱與原例題保留；從概念頁移開，避免文字堆在同頁。
        for start in range(0,len(old.get('exam',[])),2):
            arr.append(page('考點對照：'+title,'> [!big] 先用前面的概念判斷，再核對原題提醒。',exam=copy.deepcopy(old['exam'][start:start+2])))
        if old.get('demo'):arr.append(page('例題對照：'+title,'> [!big] 認條件 →代入 →確認單位與方向。',demo=copy.deepcopy(old['demo'])))
        self.parts[i]=arr
    def save(self):
        assert len(self.parts)==len(self.cards)
        new=copy.deepcopy(self.old);new['pace']='free'
        steps=[];i=0
        for s in self.old['steps']:
            if s['type']=='intro' and self.intro: steps.append(copy.deepcopy(self.intro))
            elif s['type']=='card':
                if i==0:steps.extend(self.before)
                steps.extend(self.parts[i]);i+=1
            else:steps.append(copy.deepcopy(s))
        new['steps']=steps
        # 產生器先完整保留原題；必要的已確認錯誤由獨立corrections腳本同步更正。
        take=lambda l:[s for s in l['steps'] if s['type'] in ('check','example','practice')]
        assert take(new)==take(self.old)
        # 總演練限本單元國考題，p2舊包未宣告banks時也不能撈到別單元。
        number=next(n for n,slug in SCOPE if self.name=='s114-optometry-'+slug)
        bank_files=sorted((ROOT/'content/bank/optometry/semester114').rglob(f's114-optometry-exam*-u{number}.json'))
        bank_ids=[json.loads(p.read_text(encoding='utf-8'))['set']['id'] for p in bank_files]
        assert bank_ids, self.name+' 找不到對應題本'
        for s in steps:
            if s['type']=='practice' and s.get('pick'):s['pick']['exams']=bank_ids
        for j,l in enumerate(self.pack['lessons']):
            if l['id']==new['id']:self.pack['lessons'][j]=new
        write_pack(self.path,self.pack)
        d=ledger()
        for e in d['lessons']:
            if e['unit']==self.name:e.update(status='已改寫，待建置與畫面驗證',steps=len(steps))
        LEDGER.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        completed=sum(e['status']!='待改寫' for e in d['lessons'])
        note=ROOT/'SESSION_NOTE_OPTOMETRY_S114_REVIEW.md'
        header='''# 視光學大一下總複習逐課改寫

使用者最新要求：照已認可JCC的標準，改114大一下第01～09單元的總複習課；逐課做好，不求快。其他正課、99名詞及已完成大二上27課不在本次範圍。

方法：具體對象→中文與英文／縮寫→原理與動作→數字；短表格、固定配色、分開概念與考題提醒；保留原題、記憶卡與考題來源。來源錯誤需留更正紀錄，不硬保留錯誤結論。

基準a72883c；腳本s114_review_01.py～09.py只改指定總複習。逐課JSON：tools/learn-redo/s114-review-progress.json。先改寫，再建置、驗證頁碼的真實逐頁瀏覽，通過後才標完成。不要把已改寫當成已驗證。

'''
        note.write_text(header+f'目前已改寫 **{completed}/9**；最新 `{self.name}/{new["id"]}`，{len(steps)}步。驗證狀態以JSON為準。\n',encoding='utf-8')
        print(self.name,new['id'],len(steps),'steps;',completed,'/9 written')
