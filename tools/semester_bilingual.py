"""Idempotent Chinese-first terminology pass for the 114 semester resources."""
import json, re, hashlib, shutil, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/'資源/114 大一下'
LEX={}
def add(en,zh):
    zh=re.sub(r'[（(].*?[）)]','',zh).strip()
    if zh and re.search('[\u4e00-\u9fff]',zh): LEX[en.lower()]=zh
for file in (DEST/'.來源').glob('*/_content.json'):
    for obj in json.loads(file.read_text(encoding='utf8')).values():
        if isinstance(obj,dict):
            for en,zh,*_ in obj.get('terms',[]):add(en,zh)
supp=json.loads((DEST/'.來源/_supplements.json').read_text(encoding='utf8'))['rapid']
for en,definition in supp['glossary'].items():
    first=re.split('[；。]',definition)[0]
    chinese=re.search(r'[\u4e00-\u9fff][\u4e00-\u9fff、／與]*',first)
    if chinese:add(en,chinese[0])
# Reviewed names take priority over colloquial mnemonic definitions.
EXTRA='''
RAAS|腎素－血管張力素－醛固酮系統
Ang II|血管張力素 II
Ang I|血管張力素 I
IGF-1|類胰島素生長因子 1
AQP2|水通道蛋白 2
NIS|鈉碘同向運輸蛋白
TPO|甲狀腺過氧化酶
MIT|單碘酪胺酸
DIT|雙碘酪胺酸
RANKL|核因子 κB 受體活化因子配體
C-peptide|C 肽
JAK-STAT|JAK－STAT 訊息傳遞路徑
HR|心率
TPR|總周邊阻力
MAP|平均動脈壓
EPI|腎上腺素
AChE|乙醯膽鹼酯酶
ChAT|膽鹼乙醯轉移酶
MAO|單胺氧化酶
COMT|兒茶酚胺氧位甲基轉移酶
NMJ|神經肌肉接合處
EPSP|興奮性突觸後電位
IPSP|抑制性突觸後電位
IML|中間外側細胞柱
DRG|背根神經節
AP|動作電位
RTK|受體酪胺酸激酶
TSH|甲狀腺刺激素
TRH|促甲狀腺素釋放激素
ACTH|促腎上腺皮質激素
CRH|促腎上腺皮質素釋放激素
GnRH|促性腺激素釋放激素
GHRH|生長激素釋放激素
PTH|副甲狀腺素
FSH|濾泡刺激素
LH|黃體生成素
hCG|人類絨毛膜促性腺激素
DHT|二氫睪固酮
AMH|抗穆勒氏管激素
SRY|Y 染色體性別決定區基因
TDF|睪丸決定因子
EPO|紅血球生成素
ACE|血管張力素轉換酶
PAH|對胺馬尿酸
FF|濾過分率
PCT|近端曲小管
DCT|遠端曲小管
JG cell|腎絲球旁細胞
JG cells|腎絲球旁細胞
QRS|QRS 波群
ST segment|ST 段
AV delay|房室傳導延遲
delta wave|δ 波
Purkinje fiber|浦肯野纖維
Purkinje fibers|浦肯野纖維
Purkinje|浦肯野
His bundle|希氏束
SA node|竇房結
AV node|房室結
Müller cell|穆勒氏細胞
Müller cells|穆勒氏細胞
Müller|穆勒氏
ON bipolar|ON 型雙極細胞
OFF bipolar|OFF 型雙極細胞
bipolar|雙極細胞
ganglion|神經節
rods|桿狀細胞
cones|錐狀細胞
photoreceptors|感光細胞
axon|軸突
axons|軸突
axon terminal|軸突末端
cell body|細胞本體
spinal cord|脊髓
brain|腦
brainstem|腦幹
cortex|皮質
visual cortex|視覺皮質
primary visual cortex|初級視覺皮質
outer retina|外層視網膜
inner retina|內層視網膜
nasal retinal fibers|鼻側視網膜纖維
calcarine cortex|距狀溝周圍皮質
temporal lobe|顳葉
uveal tract|葡萄膜
chiasm|視交叉
tract|神經束
orbicularis oculi muscle|眼輪匝肌
levator palpebrae superioris muscle|提上瞼肌
orbicularis oculi|眼輪匝肌
levator aponeurosis|提上瞼肌腱膜
Müller's muscle|穆勒氏肌
Müller muscle|穆勒氏肌
facial nerve|顏面神經
trigeminal nerve|三叉神經
oculomotor nerve|動眼神經
CN III|第三對腦神經（動眼神經）
CN VII|第七對腦神經（顏面神經）
CN V|第五對腦神經（三叉神經）
E-W|艾丁格－威斯特法核
inferior meatus|下鼻道
internal carotid artery|內頸動脈
facial artery|顏面動脈
medial palpebral artery|內側眼瞼動脈
lateral palpebral artery|外側眼瞼動脈
marginal arcade|眼瞼緣動脈弓
peripheral arcade|周邊動脈弓
mucocutaneous junction|黏膜皮膚交界
meibomian glands|瞼板腺
lipid layer|脂質層
aqueous layer|水液層
aqueous component|水液成分
mucoaqueous phase|水液黏蛋白相
glycocalyx|醣萼
corneal epithelium|角膜上皮
palpebral conjunctiva|瞼結膜
tarsus|瞼板
skin|皮膚
Air|空氣
TBUT|淚膜破裂時間
BUT|淚膜破裂時間
RAPD|相對傳入性瞳孔缺損
NPC|集合近點
NPA|調節近點
MRP|最大正鏡至最佳視力
K reading|角膜曲率讀值
keratometer|角膜曲率儀
phoropter|綜合驗光儀
reticle|分劃板
mire|測標反射像
mires|測標反射像
horopter|雙眼單視界
fusion|融像
far point|遠點
near point|近點
working distance|工作距離
against motion|逆動
with motion|順動
neutral|中和
neutralization|中和
endpoint|終點
double check|再次確認
break|破裂點
recovery|恢復點
target|目標
target cells|標的細胞
zero disparity|零視差
crossed disparity|交叉視差
uncrossed disparity|非交叉視差
seconds of arc|角秒
topography|地形圖
ptosis|眼瞼下垂
dilation lag|散瞳遲滯
Horner syndrome|霍納氏症候群
Horner|霍納氏
Adie|艾迪氏
Purkinje I|第一浦肯野像
Seidel|賽德爾
coma|彗形像差
Zernike|澤尼克
Prentice|普倫蒂斯
Lang|朗氏
Frisby|弗里斯比
TNO|TNO 立體視覺檢查
lens|透鏡
local|局部
global|整體
somatic|體神經
autonomic|自主神經
enteric|腸神經
sensory|感覺
motor|運動
motor neuron|運動神經元
sensory neuron|感覺神經元
receptor|受體
receptors|受體
receptor potential|受器電位
neurotransmitter|神經傳導物質
transmitter|傳導物質
astrocyte|星狀膠質細胞
oligodendrocyte|寡樹突膠質細胞
Schwann cell|許旺氏細胞
ventral horn|腹角
dorsal horn|背角
hypothalamus|下視丘
thoracolumbar|胸腰段
craniosacral|顱薦段
subconscious|下意識
conscious|有意識
reflex|反射
Basal tone|基礎張力
Dual innervation|雙重支配
Antagonistic|拮抗
Mass discharge|集體放電
fight-or-flight|戰或逃反應
fight or flight|戰或逃反應
rest-and-digest|休息與消化反應
preganglionic|節前
postganglionic|節後
cholinergic|膽鹼性
adrenergic|腎上腺素性
nicotinic|菸鹼型
muscarinic|毒蕈鹼型
ion channel|離子通道
sweat gland|汗腺
choline|膽鹼
acetyl-CoA|乙醯輔酶 A
choline acetyltransferase|膽鹼乙醯轉移酶
acetylcholinesterase|乙醯膽鹼酯酶
tyrosine|酪胺酸
DOPA|多巴
dopamine|多巴胺
primary|初級
higher|高級
excitability|可興奮性
excitable tissue|可興奮組織
integration|整合
input|輸入
output|輸出
Arrive|到達
Arrives|到達
Exit|離開
Exits|離開
cholesterol|膽固醇
vesicle|囊泡
intracellular receptor|細胞內受體
membrane receptor|細胞膜受體
gene transcription|基因轉錄
gene expression|基因表現
negative feedback|負回饋
positive feedback|正回饋
insulin|胰島素
proinsulin|前胰島素
estrogen|雌激素
estradiol|雌二醇
testosterone|睪固酮
androgen|雄激素
progesterone|黃體素
inhibin|抑制素
aromatase|芳香環酶
reductase|還原酶
HSD|羥基類固醇脫氫酶
arachidonic acid|花生四烯酸
arachidonic acid|花生四烯酸
Eicosanoids|類二十烷酸
granulosa cell|顆粒細胞
granulosa|顆粒細胞
theca cell|卵泡膜細胞
theca|卵泡膜細胞
Leydig cell|萊迪氏細胞
Leydig|萊迪氏細胞
Sertoli cell|塞爾托利氏細胞
Sertoli|塞爾托利氏細胞
ovulation|排卵
LH surge|黃體生成素高峰
placenta|胎盤
corpus luteum|黃體
spermatogenesis|精子生成
prophase I|第一次減數分裂前期
metaphase II|第二次減數分裂中期
implantation|著床
inulin|菊糖
filtration|濾過
reabsorption|再吸收
secretion|分泌
fenestration|窗孔
vasa recta|直小血管
loop of Henle|亨利氏環
collecting duct|集合管
cortical nephron|皮質腎元
juxtamedullary nephron|近髓質腎元
iodide|碘離子
iodide oxidation|碘離子氧化
organification|有機化
coupling|偶聯
base|基底部
apex|頂端
insulin receptor|胰島素受體
cardiac output|心輸出量
stroke volume|每搏量
grey line|灰線
Riolan's muscle|里奧蘭氏肌
anterior lamella|前板
posterior lamella|後板
lash line|睫毛列
conjunctiva|結膜
bulbar conjunctiva|球結膜
sclera|鞏膜
CN II|第二對腦神經（視神經）
superior tarsal muscle|上瞼板肌
Whitnall|惠特納氏
cavernous sinus|海綿竇
accessory lacrimal glands|副淚腺
lacrimal artery|淚腺動脈
vortex veins|渦靜脈
lacrimal canaliculi|淚小管
anterior ciliary arteries|前睫狀動脈
short posterior ciliary arteries|短後睫狀動脈
long posterior ciliary arteries|長後睫狀動脈
tarsal plate|瞼板
superior cervical ganglion|上頸神經節
pretectal area|頂蓋前區
superior colliculus|上丘
homonymous defect|同向視野缺損
electronegative pattern|電負型反應
visual field|視野
optic radiation|視放射
light adaptation|明適應
dark adaptation|暗適應
opsin|視蛋白
11-cis retinal|11-順式視黃醛
all-trans retinal|全反式視黃醛
Argyll Robertson|阿蓋爾－羅伯遜氏
Argyll|阿蓋爾氏
Marcus Gunn|馬庫斯－岡氏
Hartmann-Shack|哈特曼－夏克
Titmus|提特姆斯
Hirschberg|赫希伯格
PRK|準分子雷射角膜切除術
LASIK|雷射層狀角膜塑形術
slit|狹縫
power meridian|屈光力子午線
power|屈光力
oblique|斜向
topographer|地形圖儀
presbyopia|老花眼
kappa|κ 角
Coddington|柯丁頓
Javal|賈瓦爾氏
microglia|微膠質細胞
axon hillock|軸丘
hillock|軸丘
retrograde transport|逆向運輸
anterograde transport|順向運輸
retrograde|逆向
anterograde|順向
gap junction|間隙接合
tight junction|緊密接合
chromaffin cell|嗜鉻細胞
chromaffin cells|嗜鉻細胞
glial cells|膠質細胞
astrocytes|星狀膠質細胞
cerebrum|大腦
substantia nigra|黑質
limbic system|邊緣系統
pituitary|腦下垂體
baroreceptor|壓力感受器
multipolar|多極
pseudounipolar|偽單極
ganglia|神經節
neural pathway|神經路徑
pathway|路徑
somatic nervous system|體神經系統
autonomic nervous system|自主神經系統
peripheral nervous system|周邊神經系統
central nervous system|中樞神經系統
macula densa|緻密斑
juxtamedullary|近髓質
renal glomerulus|腎絲球
ABP|雄激素結合蛋白
HPG|下視丘－腦下垂體－性腺軸
follicle|濾泡
vitamin D|維生素 D
vitamin A|維生素 A
angiotensin I|血管張力素 I
angiotensin II|血管張力素 II
arterial pressure|動脈壓
resistance|阻力
PR interval|PR 間期
WPW|沃夫－巴金森－懷特症候群
Pre-excitation|預激
anti-reflection|抗反射
AR|抗反射鍍膜
seconds|秒
response|反應
axis|軸向
Javal's rule|賈瓦爾氏法則
Marcus Gunn pupil|馬庫斯－岡氏瞳孔
Argyll Robertson pupil|阿蓋爾－羅伯遜氏瞳孔
correction factor|修正係數
spectacle correction|框架眼鏡矯正
CL correction|隱形眼鏡矯正
CL|隱形眼鏡
cocaine|古柯鹼
test|檢查
horizontal|水平
nasal|鼻側
temporal|顳側
dark|暗處
light|光
drainage|引流
barrier|障壁
layer|層
layers|層
nucleus|核
nuclei|細胞核
head|頭部
trunk|幹
secondary|次級
lesion|病灶
channel|通道
channels|通道
hormone|荷爾蒙
retinal|視網膜的
corneal|角膜的
hyperpolarize|超極化
full-field|全視野
saltatory conduction|跳躍式傳導
motor unit|運動單位
skeletal muscle|骨骼肌
mitochondria|粒線體
threshold potential|閾值電位
resting potential|靜止膜電位
end-plate potential|終板電位
semicircular canals|半規管
utricle|橢圓囊
saccule|球囊
scala media|中階
oval window|卵圓窗
round window|圓窗
glossopharyngeal|舌咽神經
vagus|迷走神經
hippocampus|海馬迴
gray matter|灰質
white matter|白質
Adie's tonic pupil|艾迪氏強直性瞳孔
Lang stereotest|朗氏立體視檢查
Randot|隨機點立體視檢查
sphincter|括約肌
association|聯合
His|希氏束
LBB|左束支
RBB|右束支
NaCl|氯化鈉
''' 
for line in EXTRA.strip().splitlines():add(*line.split('|',1))
PAT=re.compile(r'(?<![A-Za-z0-9_])('+ '|'.join(re.escape(x) for x in sorted(LEX,key=len,reverse=True))+r')(?![A-Za-z0-9_])',re.I)
PAIRS=re.compile('|'.join(re.escape(zh)+r'(?:\s*（'+re.escape(en)+r'）)?' for en,zh in LEX.items() if re.search('[A-Za-z]{2}',zh)),re.I)
def bilingual(text,compact=False):
    # Existing bilingual pairs and mathematical expressions stay intact.
    saved=[]
    def protect(m):saved.append(m[0]);return '\uE000'+str(len(saved)-1)+'\uE001'
    text=PAIRS.sub(protect,text)
    text=re.sub(r'英文：[^\n]*|【英文原文】.*?(?=\n\n\*\*|$)|https?://\S+|[（(][^()（）\n]*[A-Za-z][^()（）\n]*[）)]',protect,text,flags=re.S)
    if 'PHRASES' in globals():
        text=PHRASES.sub(lambda m:TRANSLATIONS[m[0]]+'（'+m[0]+'）',text)
        text=re.sub(r'[（(][^()（）\n]*[A-Za-z][^()（）\n]*[）)]',protect,text)
    seen=set()
    def replace(m):
        en=m[0];zh=LEX[en.lower()]
        before=text[max(0,m.start()-len(zh)-2):m.start()]
        after=text[m.end():m.end()+len(zh)+3]
        if before.rstrip().endswith(zh):return '（'+en+'）'
        if re.match(r'[（(]'+re.escape(zh)+r'[）)]',after):return en
        if compact and en.lower() in seen:return zh
        seen.add(en.lower());return zh+'（'+en+'）'
    text=PAT.sub(replace,text)
    return re.sub(r'\uE000(\d+)\uE001',lambda m:saved[int(m[1])],text)

EXCLUDED={'id','subject','schema','type','kind','img','image','src','path','unit','qids','pick','source','sources','source_detail','source_optionReviews','source_id','source_subject','source_year','source_number'}
def html_bilingual(doc):
    def script(m):
        code=m[1]
        # Process stages are JSON data; localize values, never executable identifiers.
        sm=re.search(r'const stages=(\[.*?\]);',code,re.S)
        if sm:
            stages=json.loads(sm[1]); stages=walk(stages)
            code=code[:sm.start(1)]+json.dumps(stages,ensure_ascii=False)+code[sm.end(1):]
        return '<script>'+code+'</script>'
    scripts=[]
    def hold(m):scripts.append(script(m));return '\uE002'+str(len(scripts)-1)+'\uE003'
    doc=re.sub(r'<script>(.*?)</script>',hold,doc,flags=re.S)
    doc=re.sub(r'(?<=>)([^<>]+)(?=<)',lambda m:bilingual(m[1]) if not m[1].lstrip().startswith(('body{','@media')) else m[1],doc)
    return re.sub(r'\uE002(\d+)\uE003',lambda m:scripts[int(m[1])],doc)
TRANSLATIONS={}
def collect_drills(v):
    if isinstance(v,dict):
        if isinstance(v.get('question'),str) and isinstance(v.get('zh'),dict):
            z=v['zh'];TRANSLATIONS[v['question']]=z.get('question',v['question'])
            for en,zh in zip(v.get('choices',[]),z.get('choices',[])):TRANSLATIONS[en]=zh
            if v.get('explain') and z.get('explain'):TRANSLATIONS[v['explain']]=z['explain']
        for x in v.values():collect_drills(x)
    elif isinstance(v,list):
        for x in v:collect_drills(x)
for p in (DEST/'.來源').glob('*/_content.json'):collect_drills(json.loads(p.read_text(encoding='utf8')))
PHRASES=re.compile('|'.join(re.escape(k) for k in sorted(TRANSLATIONS,key=len,reverse=True) if len(k.split())>4))
def walk(value,key=''):
    if key in EXCLUDED or key.startswith('source_'):return value
    if isinstance(value,dict):return {k:walk(v,k) for k,v in value.items()}
    if isinstance(value,list):return [walk(v,key) for v in value]
    if isinstance(value,str):
        if key=='html':return html_bilingual(value)
        if value in TRANSLATIONS:
            return bilingual(TRANSLATIONS[value])+'\n英文：'+value
        if key=='explain':
            for en,zh in TRANSLATIONS.items():
                if len(en.split())>5 and value.startswith(en+'\n'):
                    return bilingual(zh)+'\n英文：'+en+'\n'+bilingual(value[len(en)+1:])
        # Full English exam sentences have Chinese exam points immediately above.
        if '**英文考句**' in value:
            head,tail=value.split('**英文考句**',1)
            match=re.search(r'\*\*考試角度\*\*\s*(.*)',head,re.S)
            chinese=match[1].strip() if match else ''
            rest=tail.split('\n\n**',1)
            value=bilingual(head,True)+'**中文重點＋英文考句**\n'+bilingual(chinese,True)+'\n\n【英文原文】'+rest[0]
            if len(rest)>1:value+='\n\n**'+bilingual(rest[1],True)
            return value
        return bilingual(value,key=='body')
    return value
def preserve_ids(pack):
    for lesson in pack['lessons']:
        base=pack['id']+'/'+lesson['id']
        def ident(x,prefix,field):x.setdefault('id',prefix+hashlib.sha1((base+'|'+x[field]).encode()).hexdigest()[:8])
        for step in lesson['steps']:
            if step['type']=='check':ident(step,'c','q')
            for check in step.get('checks',[]):ident(check,'c','q')
            flash=step.get('flash',[])
            for f in ([flash] if isinstance(flash,dict) else flash):ident(f,'f','front')
def run():
    backup=DEST/'.校驗/中英對照修改前';count=0;lessons=0;long=[]
    for path in (ROOT/'content/learn').glob('*/semester114/*.json'):
        # Reapply from our own pre-edit snapshot; do not progressively nest annotations.
        input_path=backup/path.name if '--restore-snapshot' in sys.argv and (backup/path.name).exists() else path
        original=json.loads(input_path.read_text(encoding='utf8'));preserve_ids(original)
        modified=walk(original)
        for l in modified['lessons']:
            for s in l['steps']:
                if s['type']=='card' and len(s.get('body',''))>900:
                    # Move the preserved exam quotation to its existing tip; no extra steps or IDs.
                    body=s['body'];mark='**中文重點＋英文考句**'
                    if mark in body:
                        head,tail=body.split(mark,1)
                        exam,sep,rest=tail.partition('\n\n**易錯與比較**')
                        s['body']=head.rstrip()+(sep+rest if sep else '')
                        s['tip']=(s.get('tip','')+'\n\n'+mark+exam).strip()
                    if len(s['body'])>900:long.append((path.name,l['id'],len(s['body'])))
        if not (backup/path.name).exists():
            backup.mkdir(parents=True,exist_ok=True);shutil.copy2(path,backup/path.name)
        text=json.dumps(modified,ensure_ascii=False,indent=2)+'\n';path.write_text(text,encoding='utf8')
        copies=[p for p in DEST.rglob('學習_'+original['id']+'.json') if not any(x.startswith('.') for x in p.relative_to(DEST).parts)]
        assert len(copies)==1,(original['id'],copies)
        copies[0].write_text(text,encoding='utf8');count+=1;lessons+=len(original['lessons'])
    lexfile=DEST/'.校驗/中英術語對照.json';lexfile.write_text(json.dumps(LEX,ensure_ascii=False,indent=2),encoding='utf8')
    for path in (DEST/'img').rglob('*.svg'):
        stored=backup/'img'/path.relative_to(DEST/'img')
        if not stored.exists():stored.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,stored)
        source=stored if '--restore-snapshot' in sys.argv else path
        svg=html_bilingual(source.read_text(encoding='utf8'))
        path.write_text(svg,encoding='utf8')
        (ROOT/path.relative_to(DEST)).write_text(svg,encoding='utf8')
    print(json.dumps({'packs':count,'lessons':lessons,'terms':len(LEX),'long_cards':long},ensure_ascii=False))
if __name__=='__main__':run()
