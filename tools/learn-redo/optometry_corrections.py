"""完成逐課改寫後同步修正舊題解、複習卡、筆記的已確認錯誤。
保留題幹與卡片正面以維持進度；唯一選項文字更正另有逐欄紀錄。
重跑逐課產生器後，必須再跑本檔。
"""
from optometry_common import ROOT
import json

REPLACE = {
 '最大亮度（10,000 asb）也看不到＝絕對暗點（全盲）。':
 '0 dB表示最大刺激亮度10,000 asb；連此刺激也看不到才稱該測點的絕對暗點，不代表整眼全盲。',
 '絕對暗點（全盲）。':
 '最大刺激亮度10,000 asb；若此刺激也看不到，才是該點的絕對暗點。',
 '- 0 dB＝最亮都看不到＝絕對暗點；40 dB＝最敏感。':
 '- 0 dB是最亮刺激；若仍看不到，才是該測點的絕對暗點。40 dB表示可察覺很暗的刺激，不是所有位置正常值都40。',
 '看**數字型圖示／灰階圖**：大致知道哪裡敏感度低（記得 0 dB＝絕對暗點）。':
 '看**數字型圖示／灰階圖**：大致找低敏感度位置。0 dB是最大刺激；連最大刺激都看不到才表示該點絕對暗點。',
 'asb＝絕對單位；dB＝相對於儀器最大亮度的減弱，每 10 dB＝1 log。0 dB＝10,000 asb＝絕對暗點；40 dB＝最敏感。':
 'asb是絕對亮度；dB是相對最大亮度的減弱，每10 dB為十倍。Humphrey白光0 dB＝10,000 asb；連它也看不到才是該點絕對暗點；40 dB是高敏感度示例。',
 '0 dB＝10,000 asb＝最亮都看不到（絕對暗點），不是最敏感。':
 '0 dB＝最大刺激10,000 asb，不等於自動證明失明；最大刺激仍無反應才是該測點絕對暗點。',
 'TD 比同年齡；PD 扣掉整體高度後比自己其他點。':
 'TD比同齡同位置常模；PD依較保留點估計整體偏移後校正，再與常模比，凸顯局部缺損。',
 '有注視追蹤（IR tracking），而且沒有學習效應。':
 'IR眼底追蹤有助刺激對準網膜位置；一致性依儀器與病況，仍可能有學習效應，首次需練習與重測。',
 '與 SAP 一樣有明顯的學習效應':
 '有眼底追蹤就保證所有人完全沒有學習效應',
 'A、C、D 正確。B 錯：點比 SAP **少**，但花的時間**較長**；E 錯：微視野計**沒有**學習效應，這是它比 SAP 一致的原因之一。':
 'A、C、D正確。B的因果與通則不成立，點數與時間依程式，課堂比較為點較少但較耗時。E錯：有追蹤也不能保證無學習效應；研究可見第一次到第二次改善（Wu等，2013，PMID 24135753）。',
 '微視野：功能＋網膜影像、IR 追蹤、測完拍眼底；局部敏感度與注視穩定度；比 SAP 早偵測、無學習效應；AMD、DME、中末期青光眼。':
 '微視野：功能疊網膜影像，IR追蹤，測局部敏感度與注視穩定度；部分研究能較早察覺特定損傷，但仍可有學習效應。可用於AMD、DME及中晚期青光眼等情境。',
 'FDT ≤ 6.00 D 不受影響（> 6 D 戴平常眼鏡）；輸入年齡比常模；缺損＝2 相鄰區域、測 2 次。':
 'FDT低空間頻率較耐屈光模糊；課堂以≤6.00 D作參考，>6 D按要求矯正。輸入年齡比常模；課堂缺損判準為2相鄰區域且重測2次。',
 'VR 頭戴式：人體工學、可攜、省空間、成本效益；缺點是重量（頭頸受傷者不宜）；可信度與 SAP 相當或更好。':
 'VR：可攜、省空間、可能較舒適且有成本效益；重量限制頭頸受傷者。部分研究與SAP相當或更好，不能推及所有產品。',
 '視野檢查一律單眼；試片要全口徑，柱鏡 < 1.00 DC 用等效球鏡度，> 30 歲加 ADD；瞳孔不能太小、眼瞼不能擋。':
 '本課單眼診斷視野遮另一眼；SAP試片全口徑，課堂|C|<1.00 D可用SE，較大保留柱鏡。>30歲考慮近用需求，ADD依個人與儀器；瞳孔和眼瞼不可干擾。',
 '法定視障：我國兩眼視野各 20° 以內；WHO 盲：視野 10° 以內或優眼 0.05 以下。':
 '課堂門檻比較：台灣兩眼各20°內是常見視野條件之一；WHO相關盲分類視野約10°、較好眼視力低於0.05。歷年題邊界與矯正條件需看原題，完整鑑定另依有效基準。',
 '沒有融像、視力要相等、要 Risley prism；不適合遠視、紅綠無反應者、眼球震顫。':
 '缺乏融像、最佳視力需接近、要Risley稜鏡；課堂對遠視及眼球震顫慎用。紅綠無反應是紅綠版本限制，不是普通兩行模糊比較的必要條件。',
 '上一課的垂直稜鏡分離要求兩眼視力相等、而且最不準。這課看另外三種：':
 '上一課用同時兩行比較，需要兩眼最佳視力接近；缺乏融像可能增加變異。這課改看其他分離與比較方式：',
 '1.00 D（例：1.00 D 散光 → 0.50 vs 1.50 D）。':
 '本課例子：剩餘散光1.00 D、方向對準、COLC在網膜，翻±0.25 JCC得到0.50與1.50 D，相差1.00 D。不是所有條件都固定差1.00 D。',
}

changes=[]
def walk(value, path, unit):
    if isinstance(value,str):
        if value in REPLACE:
            after=REPLACE[value]
            changes.append(dict(unit=unit,path=path,before=value,after=after))
            return after
        return value
    if isinstance(value,list): return [walk(v,path+[i],unit) for i,v in enumerate(value)]
    if isinstance(value,dict): return {k:walk(v,path+[k],unit) for k,v in value.items()}
    return value

for unit in ('optom2-u2-msr','optom2-u3-vf','optom2-u4-bb'):
    file=ROOT/f'content/learn/optometry/optom2/{unit}.json'
    pack=json.loads(file.read_text(encoding='utf-8'))
    pack=walk(pack,[],unit)
    file.write_text(json.dumps(pack,ensure_ascii=False,indent=1)+'\n',encoding='utf-8')
manifest=ROOT/'tools/learn-redo/optometry-corrections.json'
if changes:
    # 可重跑；保留之前已修過且本次未重寫的欄位紀錄。
    previous=json.loads(manifest.read_text(encoding='utf-8')) if manifest.exists() else []
    merged={(c['unit'],json.dumps(c['path'])):c for c in previous+changes}
    manifest.write_text(json.dumps(list(merged.values()),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Confirmed corrections:',len(changes))
