"""Pair-level decisions after opening all 25 pre-existing 450px overlays."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
aud=json.loads((ROOT/'docs/midterm-views/orbit2-old-audit.json').read_text(encoding='utf8'))
path=ROOT/'tools/midterm/view_blocklist.json'
blocks=json.loads(path.read_text(encoding='utf-8-sig'))
decisions={
 1:('淚骨 篩骨','前面觀的內側壁過小，骨縫與完整骨片無法分辨'),
 2:('腭骨 滑車窩 淚腺窩 淚窩 外側結節 眶上孔 眶下孔 眶上裂 眶下裂 視神經管 前篩孔 後篩孔 篩竇','450px 時結構過小或只是色塊／引線，未畫出可辨識的孔口、窩或結節'),
 3:('淚骨 篩骨 眶上孔 眶上裂','對照 Gray 190 原圖引線，舊圈偏離目標或落在過小的眶壁；改用校正近圖'),
 7:('淚骨 篩骨','側面觀中眶內側壁被眶緣遮住且過小，無法辨識骨片範圍'),
 10:('淚窩 前篩孔 後篩孔 視神經管','對照 Gray 192 原圖引線，舊圈偏離淚溝／孔口；改用校正近圖'),
 12:('蝶骨大翼 額骨 篩骨 蝶竇','軸切全圖縮至450px後只見狹小片段，骨界或竇腔不清且多條引線干擾'),
 15:('蝶鞍','切片內軟組織與骨交界太小，圈處無法辨識骨性蝶鞍'),
 17:('蝶鞍','海綿竇示意圖只示範垂體周圍關係，圈處未呈現可辨識的蝶鞍骨面'),
 19:('視神經管 眶上裂','神經與肌肉覆蓋眶尖，無法看清骨性開口'),
 24:('額竇','全身矢狀切片中額竇僅數像素且與引線重疊'),
 25:('額竇 蝶竇','全身矢狀切片縮至450px後竇腔太小且與引線重疊'),
}
owned=[]
for n,(names,reason) in decisions.items():
    img=aud[n-1]['img']
    for zh in names.split():
        entry=dict(img=img,zh=zh,reason=reason)
        if not any(b['img']==img and b['zh']==zh for b in blocks):blocks.append(entry)
        owned.append(entry)
for zh in ['頸靜脈孔','舌下神經管']:
    entry=dict(img='img/eye-anat-manual/gray193.jpg',zh=zh,reason='對照 Gray 193 引線，舊點落入相鄰孔或髁管；改用新顱底上面觀全圖的校訂標記')
    if not any(b['img']==entry['img'] and b['zh']==zh for b in blocks):blocks.append(entry)
    owned.append(entry)
path.write_text(json.dumps(blocks,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
(ROOT/'docs/midterm-views/orbit2-blocked.json').write_text(json.dumps(owned,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'{len(owned)} orbit pairs blocked; {len(blocks)} total pairs (other workers preserved).')
