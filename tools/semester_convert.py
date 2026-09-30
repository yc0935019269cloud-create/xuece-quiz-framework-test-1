"""Convert the original four banks and six sites to xd-bank/learn resources.

Original files remain intact. Stable IDs are based on source IDs, not row order.
"""
from pathlib import Path
from collections import defaultdict, Counter
import json, re, shutil, hashlib, html, copy
from semester_visuals import numeric, process, PROCESSES, retina_diagram, heart_diagram, nephron_diagram, layered_diagram

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'資源'/'114 大一下'
SRC=DEST/'_來源'
if not SRC.exists(): SRC=DEST/'.來源'
LEGACY=Path('E:/學習/大一下/眼解剖/期末/遊戲')
YEAR='114 學年度'
SUBJECTS=[
 {'id':'eye_ans','name':'眼解剖生理學','theme':'sci','words':['視網','神經','淚膜','血管','瞳孔','感光']},
 {'id':'physio','name':'生理學','theme':'sci','words':['心肌','腎元','內分泌','突觸','受器','激素']},
 {'id':'optometry','name':'視光學','theme':'sci','words':['瞳距','焦度','檢影','角膜','調節','稜鏡']},
 {'id':'basic_optics','name':'基礎光學','theme':'calc','words':['透鏡','焦點','主平','像差','反射','折射']},
]
SN={s['id']:s['name'] for s in SUBJECTS}
SETS=[];PACKS=[];COVER=[];ORIGINAL_MAP=[];BANK_BY_UNIT=defaultdict(list);COUNTS=Counter();NOTES=[];UNIT_LABELS={};RESOURCE_FILES={}

def load(p): return json.loads(p.read_text(encoding='utf-8'))
def dump(p,obj):
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def safe(s): return re.sub(r'[<>:"/\\|?*\x00-\x1f]','-',s).rstrip('. ')[:95]
def slug(s): return re.sub('[^a-z0-9-]+','-',str(s).lower()).strip('-') or hashlib.sha256(str(s).encode()).hexdigest()[:10]
def write_content(kind,sj,obj,folder):
 identity=obj['set']['id'] if kind=='bank' else obj['id']
 resource=folder/(('題庫_' if kind=='bank' else '學習_')+identity+'.json')
 dump(resource,obj)
 if kind=='learn':RESOURCE_FILES[identity]=resource.resolve()
 dump(ROOT/'content'/kind/sj/'semester114'/(identity+'.json'),obj)
 (SETS if kind=='bank' else PACKS).append(obj)

# Unicode formulas: recursive brace-aware fraction conversion, never MathJax.
SYMBOLS={'prime':'′','theta':'θ','alpha':'α','beta':'β','Delta':'Δ','delta':'δ','lambda':'λ','pi':'π','mu':'μ','infty':'∞','approx':'≈','times':'×','cdot':'·','rightarrow':'→','Rightarrow':'⇒','leftarrow':'←','leftrightarrow':'↔','pm':'±','leq':'≤','geq':'≥','neq':'≠','sin':'sin','cos':'cos','tan':'tan','sqrt':'√','sum':'Σ','degree':'°','parallel':'∥','perp':'⊥','cdots':'⋯','omega':'ω','sigma':'σ'}
UNHANDLED=set()
def brace(s,i):
 if i>=len(s): return '',i
 if s[i]!='{': return s[i],i+1
 depth=1;j=i+1
 while j<len(s) and depth:
  depth += (s[j]=='{')-(s[j]=='}');j+=1
 return s[i+1:j-1],j
def unicode_math(s):
 s=str(s or '').replace('\\(','').replace('\\)','').replace('\\[','').replace('\\]','')
 for command in ['frac','dfrac','tfrac']:
  token='\\'+command
  while token in s:
   i=s.index(token);pos=i+len(token)
   a,pos=brace(s,pos);b,pos=brace(s,pos)
   s=s[:i]+'('+unicode_math(a)+')/('+unicode_math(b)+')'+s[pos:]
 for cmd in ['mathrm','text','operatorname','overline','mathbf','mathit']:
  token='\\'+cmd
  while token in s:
   i=s.index(token);a,pos=brace(s,i+len(token));s=s[:i]+a+s[pos:]
 s=re.sub(r'\\(?:left|right|big|Big|displaystyle|quad|qquad)\b',' ',s)
 def symbol(m):
  if m[1] in SYMBOLS:return SYMBOLS[m[1]]
  UNHANDLED.add(m[1]);return m[1]
 s=re.sub(r'\\([A-Za-z]+)',symbol,s)
 s=s.replace('\\,',' ').replace('\\!','').replace('\\;',' ').replace('\\%','%').replace('\\{','{').replace('\\}','}')
 s=re.sub(r'_\{([^{}]+)\}',r'_\1',s)
 s=re.sub(r'\^\{([^{}]+)\}',r'^(\1)',s)
 s=s.replace('^2','²').replace('^3','³').replace('^{2}','²').replace('^{3}','³')
 return s.replace('{','(').replace('}',')').replace('单界面','單界面').strip()

# Targeted corrections; complete raw snapshots stay available for comparison.
FIXES=[
 ('ILM 與 ELM 都不是完整的真正膜','ILM 是基底膜，ELM 是細胞連接帶'),
 ('ILM 靠 vitreous；ELM 靠 photoreceptor，兩者主要是細胞結構與連接形成的邊界。','ILM 是鄰接 Müller 細胞內足的基底膜；ELM 是 Müller 與感光細胞的 adherens junction 帶。兩者組成不同。'),
 ('正常時只有 SA node 會自發放電，其他成員只負責傳；其他地方若也自己放電，就是病理性的異位節律點（心臟亂跳）。','正常由 SA node 主導節律；AV junction 與 His–Purkinje 系統亦有潛在自律性，通常受較快竇房結節律抑制。竇房結失效時可出現保護性的逸搏，不能把所有非竇房結自發節律都視為病理。'),
 ('厚度會讓光在玻璃裡多繞一小段路，整體聚光的力道會被打個折。','厚度造成的修正項是 −(t/n)F₁F₂；它增加或減少等效屈光力，取決於 F₁F₂ 的符號，不能一概說厚度只會抵消。'),
 ('中間那一項是「減」的，所以 Fe 通常會比 F1+F2 稍微小一點。','修正項是 −(t/n)F₁F₂：兩面度數同號時降低代數總和，異號時提高代數總和。'),
 ('心室收縮壓力讓心尖先再極化，向量再翻一次','再極化次序與去極化不同，加上再極化的電性相反；膜電位時程的區域差異是重要原因'),
 ('厚度項為負。','厚度修正寫作 −(t/n)F₁F₂；實際代數正負取決於 F₁F₂。'),
 ('光在玻璃裡走得慢，等效路程會變短。','簡併厚度是近軸光學轉移計算中的 t/n，不是光程；光程為 nt。'),
]
def txt(s):
 s=unicode_math(s)
 for a,b in FIXES: s=s.replace(a,b)
 s=s.replace('K⁺ channel 較多','Ca²⁺ 依賴的上升支較慢').replace('鉀通道多','Ca²⁺ 依賴的上升支較慢').replace('心尖先再極化','部分心外膜細胞較早再極化')
 return s
def lines(value):
 if isinstance(value,list): return '\n'.join('- '+txt(x) for x in value)
 if isinstance(value,dict): return '\n'.join(str(k)+'：'+lines(v) for k,v in value.items())
 return txt(value)

def year_bucket(q):
 # Some legacy non-selected questions still retain an exam year in source.
 y=re.search(r'(?<!\d)(10[6-9]|11[0-4])(?!\d)',str(q.get('year','')))
 if not y: y=re.search(r'(?<!\d)(10[6-9]|11[0-4])(?!\d)',q.get('source',''))
 return (y[1]+' 年國考',int(y[1])) if y else (YEAR,114)

def legacy_explain(q):
 d=q.get('detail') or {}; blocks=[]
 for label,k in [('觀念','title'),('白話理解','simple'),('口訣','memory'),('考點與解題步驟','examFocus')]:
  if d.get(k): blocks.append('**'+label+'**\n'+lines(d[k]))
 for key,v in (q.get('optionReviews') or {}).items():
  blocks.append('**選項 '+key+'：'+txt(v.get('title',''))+'**\n'+lines(v.get('rule','')))
  for k in ['memory','examFocus']:
   if v.get(k): blocks.append(lines(v[k]))
 if q.get('zh'): blocks.append('**原題中文對照**\n'+lines(q['zh']))
 blocks.append('**原始出處**\n'+txt(q.get('source',''))+'；原題編號 '+str(q.get('number',''))+'；舊 ID '+q['id'])
 return '\n\n'.join(blocks)

def migrate_banks():
 for filename,sj in [('_data.js.json','eye_ans'),('_data-physiology.js.json','physio'),('_data-optometry.js.json','optometry'),('_data-basic-optics.js.json','basic_optics')]:
  b=next(iter(load(SRC/filename).values())); units={u['code']:u for u in b['units']}; groups=defaultdict(list)
  for u in units.values():UNIT_LABELS[sj,u['code']]=safe('第'+u['code']+'單元 '+re.sub(r'^Unit [\d-]+｜','',u['title']))
  for q in b['questions']:
   bucket,year=year_bucket(q);code=q['unitCodes'][0];groups[bucket,year,code].append(q)
  for (bucket,year,code),qs in groups.items():
   unit=units[code];uname=safe('第'+code+'單元 '+re.sub(r'^Unit [\d-]+｜','',unit['title']))
   folder=DEST/bucket/SN[sj]/uname
   sid='s114-'+sj.replace('_','-')+'-'+('exam'+str(year) if '國考' in bucket else 'course114')+'-u'+code
   questions=[]
   for q in qs:
    n=q['id']; choices=[txt(c['text']) for c in q['choices']]
    answer=q['answer'];typ='multi' if isinstance(answer,list) or len(str(answer).strip())>1 else 'single'
    rec={'n':n,'type':typ,'stem':txt(q['stem']),'choices':choices,'answer':answer,'explain':legacy_explain(q),'tags':[unit['title']]+[units[c]['title'] for c in q['unitCodes'][1:]]+[str(q.get('subject','')),q.get('difficultyLabel','')],'source_id':q['id'],'source_number':q['number'],'source_year':q['year'],'source_subject':q['subject'],'source_detail':q['detail'],'source_optionReviews':q.get('optionReviews',{})}
    rec['tags']=[x for x in rec['tags'] if x]
    if q.get('difficultyLabel') in ['基礎','進階','挑戰']: rec['level']={'基礎':1,'進階':2,'挑戰':3}[q['difficultyLabel']]
    if q.get('image'):
     im=LEGACY/q['image'].removeprefix('./');imrel='img/s114-optometry/'+safe(im.name)
     for base in [ROOT,DEST]:
      dst=base/imrel;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(im,dst)
     rec['img']=[imrel]
    questions.append(rec);COUNTS[sj]+=1
    new_id=sid+'-'+n
    for c in q['unitCodes']: BANK_BY_UNIT[sj,c].append((new_id,q))
    ORIGINAL_MAP.append({'subject':sj,'old_id':q['id'],'new_id':new_id,'path':['114 大一下',bucket,SN[sj],uname],'unit_codes':q['unitCodes']})
   st={'id':sid,'subject':sj,'name':unit['title']+'｜'+bucket,'year':year,'path':['114 大一下',bucket,SN[sj],uname],'order':int(code.split('-')[0]),'source':'114 大一下個人學習題庫；保留原始考卷年度與原題編號；'+b['course']}
   write_content('bank',sj,{'schema':'xd-bank/1','set':st,'questions':questions},folder)

def check(drill,p=None):
 p=p or {}; q=drill.get('question') or drill.get('q');choices=drill.get('choices')
 if not q:
  return {'type':'check','kind':'self','q':'用自己的話說明「'+txt(p['title'])+'」，並說出一個判斷依據。','answer':txt(p.get('text') or p.get('summary') or p.get('simple')),'hint':'先說它是什麼，再說作用、條件或因果方向。','explain':txt(p.get('text') or p.get('summary') or p.get('simple'))}
 a=drill.get('answer');ex=txt(drill.get('explain') or p.get('text') or p.get('summary') or '')
 kind='single' if choices else 'self'
 out={'type':'check','kind':kind,'q':txt(q),'answer':a if choices else txt(a),'hint':'先辨認題目要比較的構造、機制或物理量；確認方向、條件與單位。','explain':ex}
 if choices:
  out['choices']=[txt(c) for c in choices]
  if isinstance(a,str) and len(a)==1: out['answer']=ord(a.upper())-65
  correct=out['choices'][out['answer']]
  out['explain']+='\n\n正確選項：'+correct+'。\n'+txt(p.get('text') or p.get('summary') or '')
 if drill.get('zh'): out['explain']+='\n\n中文對照：'+lines(drill['zh'])
 return out

def card_parts(p):
 fields=[('一句話／白話','simple'),('連到前一觀念','bridge'),('觀念','text'),('為什麼','mechanism'),('重點','bullets'),('考試角度','exam'),('英文考句','examEN'),('考試角度','examFocus'),('定義與例子','summary'),('公式','formula'),('判斷依據','keyPoints'),('老師說明','teacher'),('易錯與比較','trap'),('口訣','memory')]
 parts=[]
 for title,k in fields:
  if p.get(k): parts.append('**'+title+'**\n'+lines(p[k]))
 body='\n\n'.join(parts)
 # Split on paragraph / sentence boundaries; all source text survives.
 if len(body)>750:
  atoms=re.split(r'(?<=[。；])|\n\n',body); chunks=[];current=''
  for atom in atoms:
   if len(current)+len(atom)>650 and current: chunks.append(current.strip());current=''
   while len(atom)>650: chunks.append(atom[:650]);atom=atom[650:]
   current+=atom+'\n'
  if current.strip(): chunks.append(current.strip())
 else: chunks=[body]
 focus=p.get('examFocus') or p.get('exam') or p.get('keyPoints') or p.get('bullets') or [p.get('simple') or p.get('summary') or p.get('title')]
 return [{'type':'card','title':txt(p['title'])+(f'（{i+1}/{len(chunks)}）' if len(chunks)>1 else ''),'body':c,'keys':[txt(x) for x in focus[:4]],'tip':('口訣：'+txt(p['memory'])) if p.get('memory') else txt(p.get('trap',''))} for i,c in enumerate(chunks)]

def build_lessons(sj,uid,section,code,source):
 points=section.get('points') or [section];pairs=[]
 for pi,p in enumerate(points):
  cards=card_parts(p)
  for ci,card in enumerate(cards):
   drill=p.get('drill') if ci==len(cards)-1 else None
   pairs.append((card,check(drill or {},p),p,pi))
  COVER.append({'source':source,'unit':uid,'section':section.get('id'),'point':p['title'],'cards':len(cards),'status':'完整納入'})
 lessons=[]
 for offset in range(0,len(pairs),3):
  group=pairs[offset:offset+3];lid=slug(section['id'])+'-'+str(offset//3+1);steps=[]
  intro={'type':'intro','title':txt(section['title']),'body':(txt(section.get('summary',''))+'\n\n'+lines(section.get('studyPath') or section.get('thread') or [])).strip() or '這課從「'+txt(section['title'])+'」開始。先理解定義與作用，接著用檢核、範例與實戰確認是否能說明判斷理由。'}
  steps.append(intro)
  for card,c,_,_ in group:steps.extend([card,c])
  representative=group[-1][1];answer=representative.get('answer')
  if representative.get('choices'): answer=representative['choices'][answer]
  relevant=BANK_BY_UNIT.get((sj,code),[])
  # Select by actual unit association; choose a worked original source drill.
  ex=representative.get('explain','')
  steps.append({'type':'example','title':'範例拆解：'+txt(group[-1][2]['title']),'problem':representative['q']+('\n\n'+ '\n'.join(chr(65+i)+'. '+x for i,x in enumerate(representative.get('choices',[]))) if representative.get('choices') else ''),'steps':['先確認題目問的主題：'+txt(group[-1][2]['title']),txt(group[-1][2].get('text') or group[-1][2].get('summary') or ''),'把判斷依據連回題目：'+ex],'answer':str(answer or '')})
  pcs=[{k:v for k,v in c.items() if k!='type'} for _,c,_,_ in group[-2:]]
  steps.append({'type':'practice','title':'實戰：'+txt(section['title']),'qids':[x[0] for x in relevant[offset:offset+2]],'checks':pcs})
  recap=[];flash=[]
  for card,_,p,_ in group:
   recap.extend(card['keys'][:2]);flash.append({'front':txt(p['title']),'back':txt(p.get('simple') or p.get('text') or p.get('summary') or '')})
  if section.get('wrapUp'):recap.append(txt(section['wrapUp']))
  while len(recap)<5:recap.append(group[len(recap)%len(group)][0]['title']+'：'+group[len(recap)%len(group)][0]['keys'][0])
  steps.append({'type':'recap','points':list(dict.fromkeys(recap))[:10],'flash':flash})
  lessons.append({'id':lid,'title':txt(section['title'])+(f'（{offset//3+1}）' if len(pairs)>3 else ''),'goals':['解釋'+txt(p['title']) for _,_,p,_ in group][:3],'steps':steps})
 return lessons

def publish_packs(sj,uid,title,code,lessons,source):
 normalized_code=code.zfill(2) if code.isdigit() else code
 unitname=UNIT_LABELS.get((sj,normalized_code)) or safe('第'+code+'單元 '+title)
 folder=DEST/YEAR/SN[sj]/unitname
 for lesson in lessons:
  # A short source lesson still has an application card, not just six steps.
  if len(lesson['steps'])<8 or sum(s['type']=='card' for s in lesson['steps'])<2:
   ex=next(s for s in lesson['steps'] if s['type']=='example')
   body='**情境**\n'+ex['problem']+'\n\n**判斷步驟**\n'+lines(ex['steps'])+'\n\n**結論與依據**\n'+ex['answer']
   chunks=[body[i:i+700] for i in range(0,len(body),700)]
   at=lesson['steps'].index(ex)
   for bodypart in chunks:
    lesson['steps'][at:at]=[{'type':'card','title':'應用：由條件走到結論','body':bodypart,'keys':[ex['answer']]},{'type':'check','kind':'self','q':'解釋這個結論所用的條件或判斷依據。','answer':ex['answer'],'hint':'把條件、機制或計算步驟依序串起來。','explain':lines(ex['steps'])}];at+=2
  rec=lesson['steps'][-1]
  questions=[s for s in lesson['steps'] if s['type']=='check']
  while len(rec['flash'])<4:
   c=questions[len(rec['flash'])%len(questions)]
   rec['flash'].append({'front':c['q'],'back':c['explain']})
  while len(rec['points'])<5:
   c=questions[len(rec['points'])%len(questions)]
   rec['points'].append(c['explain'])
 divisions=(len(lessons)+5)//6
 size=(len(lessons)+divisions-1)//divisions
 for start in range(0,len(lessons),size):
  part=start//size+1;pid='s114-'+sj.replace('_','-')+'-'+slug(uid)+(f'-p{part}' if len(lessons)>6 else '')
  pack={'schema':'xd-learn/1','id':pid,'subject':sj,'unit':unitname,'path':['114 大一下',YEAR,SN[sj],unitname],'title':title+(f'（{part}）' if len(lessons)>6 else ''),'desc':'完整教材拆成概念、即時檢核與實戰；來源：'+source,'level':2,'minutes':len(lessons[start:start+size])*15,'order':int(re.search(r'\d+',code)[0]) if re.search(r'\d+',code) else 99,'source':source,'tags':[title],'lessons':lessons[start:start+size]}
  write_content('learn',sj,pack,folder)
 return folder

def add_visual(lessons,step):
 # After a check, before the worked example, so strict rhythm remains valid.
 lesson=lessons[0];i=next(i for i,s in enumerate(lesson['steps']) if s['type']=='example')
 reference=step.get('reference') or step.get('body','')
 if step['type']=='diagram':reference='\n'.join(p['name']+'：'+p['desc'] for p in step['points'])
 follow={'type':'check','kind':'self','q':'完成剛才的任務後，說明你觀察到的改變或構造關係。','answer':reference,'hint':'逐步比較相鄰階段或改變前後，並區分方向與因果。','explain':reference}
 lesson['steps'][i:i]=[step,follow]

def add_diagram(lessons,pid,kind):
 svg,pts=({'retina':retina_diagram,'heart':heart_diagram,'nephron':nephron_diagram}[kind]() if kind in ['retina','heart','nephron'] else layered_diagram(kind))
 imrel='img/'+pid+'/'+kind+'.svg'
 for base in [ROOT,DEST]:
  p=base/imrel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(svg,encoding='utf8')
 add_visual(lessons,{'type':'diagram','title':{'retina':'視網膜十層剖面','heart':'心臟房室與血管連接','nephron':'腎元管路與皮質髓質','tear':'眼表與淚膜分層','eyelid':'眼瞼前後構造關係','visual-path':'中樞視覺路徑順序圖'}[kind],'body':'先點標記看中英文與功能，再切到測驗；圖為作者依基本構造繪製的教學示意，不代表實測比例。','img':imrel,'mode':'both','source':'本次自製 SVG 教學示意，依教材基本構造重繪；非來源網站截圖。','points':pts})

def site_courses():
 hosts=[('harmonious-rugelach-6d5134','eye_ans'),('frabjous-druid-ff547a','optometry'),('lustrous-malasada-6d28a9','physio'),('enchanting-mandazi-e371e7','basic_optics')]
 supplement=load(SRC/'_supplements.json')
 for host,sj in hosts:
  b=next(iter(load(SRC/host/'_content.json').values()));url='https://'+host+'.netlify.app/'
  for u in b.get('units',b.get('chapters',[])):
   uid=u['id'];code=re.sub(r'[^\d-]','',str(u.get('code',u.get('number','')))) or '99';lessons=[]
   for section in u['sections']:lessons+=build_lessons(sj,uid,section,code,url)
   extras=[]
   for label,key in [('單元路線','roadmap'),('必記與易錯','review')]:
    if u.get(key): extras.append({'title':label,'text':lines(u[key]),'simple':'把本單元的關係串起來，確認易錯条件與方向。'})
   if sj=='basic_optics':
    for f in b.get('formulas',[]):
     if f.get('chapterId')!=uid:continue
     text='**公式**\n'+txt(f['latex'])+'\n\n**符號與單位**\n'+'\n'.join(txt(x['symbol'])+'：'+txt(x['meaning'])+'（'+x['unit']+'）' for x in f['symbols'])
     for k in ['note','use','intuition','analogy','pitfalls']:
      if f.get(k):text+='\n\n'+lines(f[k])
     extras.append({'title':'公式卡：'+f['name'],'text':text,'simple':txt(f['use'])})
    if uid=='ch10':extras.extend({'title':x['title'],'text':x['body']} for x in b.get('examCards',[]))
   if sj=='physio':
    for j,x in enumerate(supplement['highyield'].get(uid,[])):
     baby=supplement['rapid']['babySprint'].get(uid,[])
     extra={'title':'急速重點：'+x[1],'simple':baby[j][1] if j<len(baby) else x[2],'text':x[2],'trap':x[3],'memory':baby[j][2] if j<len(baby) else ''}
     extras.append(extra)
   if extras:lessons+=build_lessons(sj,uid,{'id':'review-extra','title':'串連、公式與易錯整合','summary':'完整保留單元路線、必考重點與符號條件。','points':extras},code,url)
   if uid=='tear-film':
    lessons+=build_lessons(sj,uid,{'id':'tear-model-update','title':'三層教學與現代淚膜模型','summary':'用傳統三層辨認分泌來源，也理解現代雙相觀點。','points':[{'title':'傳統三層與現代雙相模型','simple':'三層模型有助考試辨認来源，實際水與黏蛋白呈漸變混合。','text':'傳統教學依序分脂質層、水液層、黏液層；現代 TFOS 模型強調表面脂質層與下方水液黏蛋白相，眼表另有膜結合黏蛋白醣萼。兩種是描述尺度不同，不代表考試分泌來源失效。','drill':{'question':'現代模型中，水液與可溶黏蛋白的關係為何？','choices':['完全互不接觸','呈漸變混合相','都由瞼板腺分泌','都只由杯狀細胞分泌'],'answer':1,'explain':'水液與可溶黏蛋白形成水液黏蛋白相；瞼板腺主要供脂質，杯狀細胞供黏蛋白，淚腺主要供水液。'}}]},code,'https://tfosdewsreport.org/public/images/TFOS_DEWS_II_Tear_film.pdf')
   # Unit final quiz: formal questions are retained in learning practice.
   if u.get('quiz'):
    for start in range(0,len(u['quiz']),3):
     group=u['quiz'][start:start+3];cs=[check(d,{'title':u['title']}) for d in group];ref=cs[0]
     quiz_steps=[]
     for c in cs:
      quiz_steps.extend([{'type':'card','title':'判斷依據：'+u['title'],'body':c['explain'],'keys':[c['explain']]},c])
     lessons.append({'id':'quiz-'+str(start//3+1),'title':'整合驗收 '+str(start//3+1),'goals':['以單元總測驗檢查觀念是否能串連。'],'steps':[{'type':'intro','title':'課末挑戰','body':'先整理判斷依據，再用另一輪實戰確認能否獨立作答。'},*quiz_steps,{'type':'example','title':'回看第一題的判斷','problem':ref['q'],'steps':['確認題目問的構造、條件或量。',ref['explain'],'將判斷依據連到正確選項。'],'answer':ref['choices'][ref['answer']] if ref.get('choices') else str(ref['answer'])},{'type':'practice','title':'正式驗收','checks':[{k:v for k,v in c.items() if k!='type'} for c in cs]},{'type':'recap','points':[c['explain'] for c in cs],'flash':[{'front':c['q'],'back':c['explain']} for c in cs]}]})
   # User asked specifically for chapter 10; linked predecessor chapters are
   # included to make every referenced formula intelligible.
   if uid in PROCESSES:add_visual(lessons,process(*PROCESSES[uid]))
   sim={'ch6':'thick','ch7':'vertex','ch8':'mirror','ch9':'reflectance','pd-lensometry':'prism','keratometry':'k','near-point':'accommodation'}.get(uid)
   if sim:add_visual(lessons,numeric(sim))
   if uid=='retina-layers':add_diagram(lessons,'s114-eye-retina','retina')
   if uid=='tear-film':add_diagram(lessons,'s114-eye-tear','tear')
   if uid=='adnexa':add_diagram(lessons,'s114-eye-eyelid','eyelid')
   if uid=='central-visual-pathway':add_diagram(lessons,'s114-eye-pathway','visual-path')
   if uid=='cardiovascular':
    add_diagram(lessons,'s114-physio-heart','heart');add_visual(lessons[1:],numeric('co'))
   if uid=='urinary':
    add_diagram(lessons,'s114-physio-nephron','nephron');add_visual(lessons[1:],numeric('clearance'))
   publish_packs(sj,uid,u['title'],code,lessons,url+('chapters/10.html' if uid=='ch10' else ''))
  terms=b.get('terms',[])
  if sj=='physio':terms=[[k,k,v] for k,v in supplement['rapid']['glossary'].items()]+[[k,k,v] for k,v in supplement['rapid']['babyWords']]
  if terms:
   sections=[]
   for start in range(0,len(terms),6):
    group=terms[start:start+6];ps=[]
    for off in range(0,len(group),2):
     ts=group[off:off+2];ps.append({'title':'／'.join(t[0] for t in ts),'text':'\n\n'.join('**'+t[0]+'｜'+t[1]+'**\n'+t[2] for t in ts),'simple':'把中英文名詞和功能連在一起，避免只會背拼字。'})
    sections.append({'id':'terms-'+str(start//6+1),'title':'中英文核心名詞 '+str(start//6+1),'points':ps})
   ls=[]
   for sec in sections:ls+=build_lessons(sj,'terms',sec,'99',url)
   publish_packs(sj,'terms','中英文核心名詞','99',ls,url)
  if sj=='basic_optics':
   for chapter in b['chapters']:
    practice=[x for x in b.get('practice',[]) if x.get('chapterId')==chapter['id']]
    if not practice:continue
    lessons=[]
    for i,p in enumerate(practice):
     pid='worked-'+str(i+1)
     section={'id':pid,'title':'教材例題 '+str(i+1),'points':[{'title':p['question'],'simple':'先讀情境、確定符號與單位，再逐步解題。','text':p['answer']}]}
     ls=build_lessons(sj,chapter['id']+'-worked',section,chapter['number'],url)
     for l in ls:
      e=next(s for s in l['steps'] if s['type']=='example');e.update(problem=txt(p['question']),steps=[txt(x) for x in re.split(r'(?<=[。；])',p['answer']) if x.strip()],answer=txt(p['answer']))
     lessons+=ls
    publish_packs(sj,chapter['id']+'-worked',chapter['title']+'例題詳解',chapter['number'],lessons,url)
 # Rescue site: all fifteen numerical worked examples, not just a link.
 grouped=defaultdict(list)
 for i,p in enumerate(supplement['rescue']['REPS']):
  sec={'id':'rescue-'+str(i+1),'title':p['type'],'summary':p['hook'],'points':[{'title':p['type'],'simple':p['simple'],'text':lines(p['steps']),'formula':p['formula'],'trap':p['trap'],'drill':{'question':p['stem'],'choices':p['opts'],'answer':p['ans'],'explain':lines(p['why'])}}]}
  ls=build_lessons('basic_optics','rescue',sec,str(p['ch']),'https://gleeful-paletas-d56a9b.netlify.app/')
  ex=next(s for s in ls[0]['steps'] if s['type']=='example');ex.update(problem=txt(p['stem']),steps=[txt(s) for s in p['steps']],answer=p['opts'][p['ans']])
  grouped[p['ch']]+=ls
 for ch,ls in grouped.items():publish_packs('basic_optics','rescue-ch'+str(ch),'一步一步帶你解：'+supplement['rescue']['CH'][str(ch)],str(ch),ls,'https://gleeful-paletas-d56a9b.netlify.app/')

def reports():
 dump(DEST/'00_科目設定.json',{'schema':'xd-bundle/1','subjects':SUBJECTS,'sets':[],'packs':[]})
 # Source IDs and audit records use hidden folder, so recursive import does not
 # mistake audit rows or extracted website objects for additional questions.
 hidden=DEST/'.校驗';hidden.mkdir(exist_ok=True)
 dump(hidden/'題目ID對照.json',ORIGINAL_MAP);dump(hidden/'素材覆蓋對照.json',COVER)
 inventory=[]
 for obj in SETS: inventory.append({'類型':'題庫','id':obj['set']['id'],'path':obj['set']['path'],'題數':len(obj['questions'])})
 for obj in PACKS:inventory.append({'類型':'學習','id':obj['id'],'path':obj['path'],'課數':len(obj['lessons'])})
 dump(hidden/'分類索引.json',inventory)
 text=['# 114 大一下：分類與導入','', '所有本次新增資源的第一層都是「114 大一下」。下一層區分原國考年份（106～114 年國考）與「114 學年度」教材，再分科目與單元。學年度不是試題出題年度。','', '營地 → 📥 導入素材 → 選整個本資料夾，或直接使用已建置的學習模式與題庫。JSON 裡的 path 與實體資料夾一致。','.來源、.校驗是原始快照與稽核記錄，遊戲導入會略過點號開頭的目錄；img 中圖片一起導入。','', '| 科目 | 原題數 |','|---|---:|']
 text += ['| '+SN[sj]+' | '+str(COUNTS[sj])+' |' for sj in COUNTS]
 total_lessons=sum(len(p['lessons']) for p in PACKS)
 diagrams=sum(s['type']=='diagram' for p in PACKS for l in p['lessons'] for s in l['steps'])
 sims=sum(s['type']=='interactive' for p in PACKS for l in p['lessons'] for s in l['steps'])
 text += ['',f'合計 {sum(COUNTS.values())} 題、{len(SETS)} 題本、{len(PACKS)} 學習單元檔、{total_lessons} 課、{diagrams} 圖解與 {sims} 互動。','', '原遊戲與原題庫留在原位置。跨單元題不複製，次要單元寫入 tags 與 ID 對照，相關學習實戰可連回同一題。題目 ID 以原 ID 組成；原編號、原年份、原科目與詳解結構完整保留。','', '兩個生理學網站完整教材相同，合併一份；急速版額外保留 60 個必考重點、120 個 glossary 條目及 84 個白話翻譯。基礎光學指定第十章的內容与前置第六～九章、公式、網站例題、急救版 15 例題全部納入。','', '校驗：.校驗/素材覆蓋對照.json 可逐點追查。學習模式中的自評题有參考答案，須由使用者誠實評分。','', '需要確認與修正紀錄見「01_需要確認與修正.md」。']
 (DEST/'README.md').write_text('\n'.join(text).replace('与','與').replace('题','題')+'\n',encoding='utf8')
 fixes=['# 需要確認、內容校訂與圖片來源','', '本次驗證範圍：四份題庫完整轉換、JSON 格式、來源內容覆蓋、來源年度、圖片存在、學習節奏、互動的離線規則與數值邊界；不等同每一題均已另由教師重新審題。','', '原题中部分選項解析原本就是通用句，已完整保留，未冒稱補成逐題全新詳解。','', '已修正：','', '- ILM 是基底膜；ELM 為 Müller／感光細胞連接帶，不能把两者一概說成不是真正膜。https://pmc.ncbi.nlm.nih.gov/articles/PMC8087649/','- SA node 主導正常節律，AV junction 與 His–Purkinje 有潛在自律性；逸搏可以是保護反應。https://www.ncbi.nlm.nih.gov/books/NBK557664/','- 厚透鏡 Fe 的厚度修正是 −(t/n)F₁F₂，其代數影響取決於兩面正負號；不能一概說厚度降低 Fe。','- 簡併厚度 t/n 與光程 nt 不同，不用光走得慢來定義 t/n。','- T 波通常同向需同時看再極化順序與電性，不能單用收縮壓力使心尖先恢復解釋。https://pmc.ncbi.nlm.nih.gov/articles/PMC1952680/','', '圖解：3 張自製 SVG 構造示意（視網膜十層、心臟房室與血管、腎元），所有標記都落在所繪構造上，非來源圖的估猜座標；不代表實測形態、比例或手術解剖。3 張原題圖保留於 img/s114-optometry/。','', '待老師確認：原來源對 AV delay 的「鉀通道多」及部分 ECG 機制是授課表述，實際需包含 Ca²⁺ 依賴去極化、細胞大小與連接差異；原題的臨床判斷與參考值仍以課本與授課規範為準。']
 for i,entry in enumerate(fixes):
  if entry.startswith('圖解：'):fixes[i]='圖解：6 張自製 SVG 教學示意（視網膜十層、心臟房室與血管、腎元、眼表淚膜、眼瞼前後關係、中樞視覺路徑順序）。標記落在所繪構造上；不代表實測形態、比例或手術解剖。3 張原題圖保留於 img/s114-optometry/。'
  if entry.startswith('待老師確認：'):fixes[i]='待老師確認：原題的臨床判斷、部分通用選項解析與參考值仍以課本及授課規範為準。'
 fixes += ['', '補充校訂：學習文字將 AV delay 的「鉀通道多」改為 Ca²⁺ 依賴的慢上升支，搭配細胞大小與連接差異；原始授課表述保留在 .來源。https://cvphysiology.com/arrhythmias/a003', '淚膜新增傳統三層與現代水液黏蛋白相的比較。https://tfosdewsreport.org/public/images/TFOS_DEWS_II_Tear_film.pdf']
 if UNHANDLED:fixes.append('數學轉碼保留的指令名稱（已去除 LaTeX 語法，請核對易讀性）：'+', '.join(sorted(UNHANDLED)))
 (DEST/'01_需要確認與修正.md').write_text('\n'.join(fixes).replace('题','題').replace('两','兩')+'\n',encoding='utf8')
 (DEST/'02_來源與素材覆蓋.md').write_text('# 來源與素材覆蓋\n\n'+'\n'.join('- '+x for x in ['https://glittering-pony-c07f88.netlify.app/','https://lustrous-malasada-6d28a9.netlify.app/','https://enchanting-mandazi-e371e7.netlify.app/chapters/10.html','https://gleeful-paletas-d56a9b.netlify.app/','https://harmonious-rugelach-6d5134.netlify.app/','https://frabjous-druid-ff547a.netlify.app/'])+f'\n\n概念／補充／名詞素材共有 {len(COVER)} 條映射，完整紀錄在 .校驗/素材覆蓋對照.json；題目 ID 共 {len(ORIGINAL_MAP)} 條，在 .校驗/題目ID對照.json。網站頁面與 content.js 原始快照保存於 .來源，保留原文供教師追查；本機自用轉換，未執行對外發布。\n',encoding='utf8')

def run():
 migrate_banks();site_courses()
 active={p['id'] for p in PACKS}
 for base,pattern in [(DEST,'學習_s114-*.json'),(ROOT/'content/learn','s114-*.json')]:
  for old in list(base.rglob(pattern)):
   if any(x.startswith('.') for x in old.relative_to(base).parts):continue
   identity=load(old)['id']
   if identity in active and (base!=DEST or old.resolve()==RESOURCE_FILES[identity]):continue
   old=old.resolve();assert old.is_relative_to(ROOT.resolve())
   target=(DEST/'.校驗/歷次生成'/old.relative_to(ROOT)).with_suffix('.json.bak').resolve()
   assert target.is_relative_to((DEST/'.校驗').resolve())
   target.parent.mkdir(parents=True,exist_ok=True);shutil.move(str(old),str(target))
   parent=old.parent.resolve()
   if parent.is_relative_to(DEST.resolve()) and parent.name.startswith('第') and not any(parent.iterdir()):parent.rmdir()
 reports()
 config=load(ROOT/'content/project.json');current={s['id'] for s in config['subjects']}
 for s in SUBJECTS:
  if s['id'] not in current:config['subjects'].append(s)
 dump(ROOT/'content/project.json',config)
 if (DEST/'_來源').exists():shutil.move(str(DEST/'_來源'),str(DEST/'.來源'))
 print(json.dumps({'questions':dict(COUNTS),'sets':len(SETS),'packs':len(PACKS),'lessons':sum(len(p['lessons']) for p in PACKS),'coverage':len(COVER),'unhandled_math':sorted(UNHANDLED)},ensure_ascii=False))
if __name__=='__main__':run()
