"""只修九堂總複習中的舊題解／示範／複習卡；其他正課完全不動。"""
from s114_review_common import ROOT,FOLDER,SCOPE,write_pack
import json
REPLACE={
 '**例子 2**：0.5 全對、0.4 行對 3 個 → 0.5 − 0.06 = **0.44**。':
 '**例子2**：標準五字logMAR表，logMAR 0.50行全對，0.40行再對3字 →0.50−3×0.02＝**0.44 logMAR**。這不是小數視力0.5。',
 '**換算題**：0.1→logMAR 1.0；6/60→1.0；0.5→0.3；6/30→0.2、5、0.7（106 師特 39；106 生特 7；112 師高 33；108 生普 8）。':
 '**換算題**：小數0.1→logMAR1.0；Snellen6/60→logMAR1.0；小數0.5→logMAR約0.3；Snellen6/30→小數0.2、MAR5′、logMAR約0.7（106 師特 39；106 生特 7；112 師高 33；108 生普 8）。',
 '0.50 − 0.04 = **0.46**（B）。':
 '題目0.50與0.40是logMAR行值；標準五字表每字0.02，0.50−2×0.02＝**0.46 logMAR**（B），不是小數視力0.46。',
 '針孔用來分辨**屈光問題 vs 病理問題**（B）。孔太小會繞射；照度降低；景深增加。':
 'B是選項中最合適：針孔提供屈光因素與其他原因的區分線索，並非單靠有無改善就確診。孔太小會繞射、照度降低，容忍失焦範圍增加。',
 '**例子**：大腦枕葉皮質受損 → 看不見，但瞳孔光反射仍然正常。':
 '**例子**：雙側廣泛枕葉視覺皮質受損可致皮質性失明；若光反射通道完好，光反射仍可保留。單側受損不等於兩眼全盲。',
 '近點 5.00 D − 遠點 (−2.00 D) = **7.00 D**（C）。':
 '用本課一致定義R：眼後50 cm虛遠點→R＝＋2.00 D遠視；近點眼前20 cm需求5.00 D，所以AA＝5＋2＝**7.00 D**（C）。',
 '眼後 50 cm 的遠點 → 虛遠點，相當於 **+2.00 D 遠視**（遠點屈光力 −2.00 D）。':
 '眼後50 cm虛遠點，對應本課R＝**＋2.00 D遠視**。不要把另一套「看近需求」符號混進R。',
 '眼前 20 cm 的近點 → 需要 **5.00 D**。':
 '眼前20 cm相對正視的看近需求為1/0.20＝**5.00 D**；此遠視眼還要先補R＋2.00 D。',
 'AA = 近點度數 − 遠點度數 = 5.00 − (−2.00) = **7.00 D**。':
 'AA＝1/NPA＋R＝5.00＋2.00＝**7.00 D**；等於看遠先用2 D，再加5 D看近。',
 'AA = 近點度數 − 遠點度數（遠點在眼後要加）；近視 −D 近點 1/(AA + D)、遠視 +D 近點 1/(AA − D)。':
 '統一R近視負、遠視正：AA＝1/NPA（m）＋R；NPA＝1/(AA−R)。近視−D→1/(AA＋D)，遠視＋D→1/(AA−D)，以眼前實近點且分母正為條件。',
 'NPC：恢復點比破裂點遠、15 cm 複視＝內聚不足；push-up 受主觀影響；測 AA 要戴遠距離矯正。':
 'NPC記break／recovery，恢復通常較遠。15 cm破裂是集合不足線索，需配其他檢查。Push-up受主觀與視標變大影響；測AA戴遠用最佳矯正。',
 '破裂點太遠（15 cm 就複視）→ **內聚力不足（convergence insufficiency）**（A）。':
 '在這組選項A最合適：15 cm已破裂，支持集合能力不足的線索；正式診斷仍須結合症狀、眼位、近距離正融像聚散等，不能只靠NPC單項確診。',
 'K = 337.5 ÷ 7.50 = **45.00 D**（C）。':
 'K＝337.5/7.50＝**45.00 D**（C）。題目的1.3375指K換算假設指數，不是真實角膜材料折射率。',
}
changes=[]
def walk(v,p,unit):
    if isinstance(v,str) and v in REPLACE:
        changes.append(dict(unit=unit,path=p,before=v,after=REPLACE[v]));return REPLACE[v]
    if isinstance(v,list):return [walk(x,p+[i],unit) for i,x in enumerate(v)]
    if isinstance(v,dict):return {k:walk(x,p+[k],unit) for k,x in v.items()}
    return v
for number,slug in SCOPE:
    name='s114-optometry-'+slug;file=ROOT/FOLDER/(name+'.json');pack=json.loads(file.read_text(encoding='utf-8'))
    pack['lessons'][-1]=walk(pack['lessons'][-1],['lessons',len(pack['lessons'])-1],name)
    write_pack(file,pack)
manifest=ROOT/'tools/learn-redo/s114-review-corrections.json'
if changes:
    previous=json.loads(manifest.read_text(encoding='utf-8')) if manifest.exists() else []
    merged={(c['unit'],json.dumps(c['path'])):c for c in previous+changes}
    manifest.write_text(json.dumps(list(merged.values()),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Corrections applied',len(changes))
