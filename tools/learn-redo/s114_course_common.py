"""114大一下正課逐課補前置橋梁；完整保留原正文與考點並拆排。"""
import copy,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BASE='a183a4605d7d17398dbbb4cc7ac51d4c165b562e'
FOLDER=Path('content/learn/optometry/semester114')
LEDGER=ROOT/'tools/learn-redo/s114-course-progress.json'
NOTE=ROOT/'SESSION_NOTE_OPTOMETRY_S114_COURSES.md'
SCOPE=[('01','va-sph'),('02','astigmatism-rx'),('03','retinoscopy-intro'),('04','pd-lensometry'),('05','objective-refraction'),('06','keratometry'),('07','pupil-response'),('08','stereopsis'),('09','near-point')]
def raw(name):return subprocess.check_output(['git','show',f'{BASE}:{(FOLDER/(name+".json")).as_posix()}'],cwd=ROOT).decode('utf-8')
def baseline(name):return json.loads(raw(name))
def plan():
 if LEDGER.exists():return json.loads(LEDGER.read_text(encoding='utf-8'))
 d=dict(baseline=BASE,scope='01～09正課含串連／整合驗收；不含九堂總複習及99名詞',lessons=[])
 for number,slug in SCOPE:
  for f in sorted((ROOT/FOLDER).glob('s114-optometry-'+slug+'*.json')):
   p=baseline(f.stem)
   for l in p['lessons']:
    if '國考重點複習' not in l['title']:d['lessons'].append(dict(number=number,unit=p['id'],lesson=l['id'],title=l['title'],status='待改寫'))
 LEDGER.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');return d
def note(d):
 done=sum(x['status']!='待改寫' for x in d['lessons']);verified=sum(x['status']=='已驗證' for x in d['lessons'])
 lines=['# 視光學大一下正課：逐課接手記錄','','使用者：逐課慢慢改、所有細節考點保留、難詞先白話講清楚、進度隨時記錄、全部完成再推Git。',
 '',f'目前 **{done}/{len(d["lessons"])} 已改寫，{verified}/{len(d["lessons"])} 已驗證**。基準a183a46。',
 '', '範圍：01～09的41主要教學＋18串連／驗收；九堂總複習與99名詞不動。',
 '', '方法：同一具體例子→中文／英文名詞→原因／操作→數字；短表格、金色重點、藍橘比較。先補白話橋梁，再分頁看原課完整細節、原國考提醒與示範；不為縮短而刪考點。不新增檢核題。',
 '', '正本content/learn/optometry/semester114；本次腳本s114_course_*.py；逐課JSON tools/learn-redo/s114-course-progress.json。只更新指定課，維持課ID、原題、卡片與出處。重跑會將該課改回待驗證。',
 '', '未全部驗證前不推Git。不重跑以前的匯入器；不改眼解剖或已完成的大二上27課。', '', '| 單元／課 | 狀態 |','|---|---|']
 lines += [f'| {e["number"]} / {e["lesson"]} {e["title"]} | {e["status"]} |' for e in d['lessons']]
 NOTE.write_text('\n'.join(lines)+'\n',encoding='utf-8')
def card(title,text):return dict(type='card',title=title,body=text.strip().splitlines())
def blocks(body):
 text='\n'.join(body) if isinstance(body,list) else (body or '')
 # Preserve tables as units; group short paragraphs to limit dense mobile pages.
 parts=re.split(r'\n\s*\n',text.strip());out=[];buf=''
 for p in parts:
  if len(buf)+len(p)>330 and buf:out.append(buf);buf=''
  buf+='\n\n'+p if buf else p
 if buf:out.append(buf)
 return out
class Lesson:
 def __init__(self,slug,lid):
  self.name='s114-optometry-'+slug;self.path=ROOT/FOLDER/(self.name+'.json')
  self.pack=json.loads(self.path.read_text(encoding='utf-8'));self.old=next(l for l in baseline(self.name)['lessons'] if l['id']==lid)
  self.guides={};self.extras={};self.lid=lid
 def bridge(self,index,title,text):
  assert index not in self.guides;self.guides[index]=card(title,text)
 def save(self):
  steps=[];ci=0
  for source in self.old['steps']:
   s=copy.deepcopy(source)
   if s['type']=='intro':
    steps.append(s);continue
   if s['type']!='card':steps.append(s);continue
   if ci in self.guides:steps.append(self.guides[ci])
   steps.extend(copy.deepcopy(self.extras.get(ci,[])))
   bodies=blocks(s.get('body',[])) or ['']
   # All original teaching text remains readable in the course, not an external archive.
   for j,b in enumerate(bodies):
    page=copy.deepcopy(s) if j==0 else dict(type='card',title=s['title']+'：接著看')
    for k in ('exam','demo','keys','tip'):page.pop(k,None)
    page['body']=b.splitlines();steps.append(page)
   if s.get('keys') or s.get('tip'):
    p=card('重點核對：'+s['title'],'> [!big] '+s['keys'][0] if s.get('keys') else s['tip'])
    if len(s.get('keys',[]))>1:p['keys']=s['keys'][1:]
    if s.get('keys') and s.get('tip'):p['tip']=s['tip']
    steps.append(p)
   for i in range(0,len(s.get('exam',[])),2):
    steps.append(card('考點對照：'+s['title'],'\n\n'.join(s['exam'][i:i+2])))
   if s.get('demo'):
    for b in blocks('\n\n'.join(s['demo'])):steps.append(card('例題：'+s['title'],b))
   ci+=1
  assert self.guides and all(i<ci for i in self.guides)
  new=copy.deepcopy(self.old);new.update(steps=steps,pace='free')
  self.pack['lessons']=[new if l['id']==self.lid else l for l in self.pack['lessons']]
  indent=len(raw(self.name).splitlines()[1])-len(raw(self.name).splitlines()[1].lstrip())
  self.path.write_text(json.dumps(self.pack,ensure_ascii=False,indent=indent)+'\n',encoding='utf-8')
  d=plan()
  for e in d['lessons']:
   if e['unit']==self.name and e['lesson']==self.lid:e.update(status='已改寫，待驗證',steps=len(steps),bridges=len(self.guides),qaWidths=[])
  LEDGER.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');note(d)
  print(self.name,self.lid,len(steps),'steps')
def teach(slug,lid,specs,extras=None):
 r=Lesson(slug,lid)
 r.extras=extras or {}
 for index,title,conclusion,rows,tail in specs:
  text='> [!big] '+conclusion+'\n\n| 先認這個名字 | 白話意思／做法 |\n|---|---|\n'
  text+='\n'.join('| '+a+' | '+b+' |' for a,b in rows)
  if tail:text+='\n\n'+tail
  r.bridge(index,title,text)
 r.save()
if __name__=='__main__':note(plan())
