"""Write the handoff from the checked row/pool/source manifests."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def load(p):return json.loads((ROOT/p).read_text(encoding='utf-8-sig'))
pack=load('content/learn/eye_anat/midterm-review.json')
before=load('tmp/orbit2-before.json')
qa=load('docs/midterm-views/orbit2-verification.json')
browser=load('tmp/midterm-pick-regression/midterm-qa.json')
rows=pack['lessons'][0]['steps'][1]['groups'][0]['items']
oldrows=before['lessons'][0]['steps'][1]['groups'][0]['items']
preferred={
 '鼻骨':'atlas_p01.jpg','淚骨':'orbit2-gray163-lacrimal.png','額骨':'atlas_p06.jpg',
 '篩骨':'orbit2-gray192-medial.png','蝶骨':'orbit-unlabeled.png','蝶骨小翼':'atlas_p08.jpg',
 '蝶骨大翼':'atlas_p08.jpg','顴骨':'orbit_medial_specimen.jpg','上頜骨':'atlas_p01.jpg',
 '腭骨':'orbit2-gray192-medial.png','眉弓':'gray190.jpg','眶上裂':'mcf_B_m.jpg',
 '眶下裂':'orbit_apex_specimen.jpg','上頷竇':'ct_omc.jpg','篩竇':'ct_omc.jpg',
 '額竇':'gray192_orbit_medial_wall.jpg','蝶竇':'gray194_skull_sagittal.jpg',
}
notes={
 '外側結節':'**未完成清楚隆起辨識**：依使用者允許的 CC 標本備案標 approx；只見眶緣與外側壁，不能確證 Whitnall 結節，不當成已解決。',
 '滑車窩':'Gerrish 210：引線末端的黑色小窩，450px 時可見窩本身。',
 '淚腺窩':'Gray 135：眶面外側凹陷特寫；原文印在骨面，保留並在標題揭露。',
 '淚窩':'Gray 192：前、後淚嵴間的深溝；Gray 163 另見構成淚窩的淚骨淚溝。',
 '前篩孔':'首圖 Gray 193 上面觀近圖；原座標 (326,180)，對照使用者箭頭／方框。',
 '後篩孔':'首圖 Gray 193 上面觀近圖；沿完整引線追到 (350,281)，不是標籤文字下方任一小孔。',
 '視神經管':'Gray 192 原圖 Optic foramen 引線末端的淺色橢圓管口；避開其下方蝶腭孔。',
 '眶上孔':'Gray 190 原座標 (270,238)，眶上緣真實孔口；舊圈偏在更外側，已封鎖。',
 '眶下孔':'Gray 190 原座標 (286,358)，眶下緣下方的孔口。',
 '蝶鞍':'Gray 192 後方的鞍狀凹口，另保留顱底標本及 Gray 193。',
 '蝶骨':'現存模型僅示眶內蝶骨部分；本輪未新增完整離體蝶骨，勿把局部眶壁當整塊骨。',
 '蝶骨小翼':'離體蝶骨模型可見成對小翼。','蝶骨大翼':'離體蝶骨模型可見成對大翼。',
 '眉弓':'Gray 190 前面觀的眶上方弓形區域；不以原小型示意圖當最佳辨識圖。',
}
lines=['# 骨質眼窩：第二輪目標補圖與封鎖紀錄（2026-11-03）','',
 '指定 10 列中，9 列已有在約 450px 顯示寬度可核對的視圖；**外側結節仍只有允許的概略定位備案，隆起本身未確證，不能宣稱 10 列全部完成。** 原圖鑑及題庫保留，本輪只調整總複習的 views／qids 與生成支援。','',
 '## 驗證與限制','',
 f"- `tools/build.py --strict`：exit 0；完整輸出在 `tmp/orbit2-final-build.log`。",
 f"- `node tools/midterm/check.cjs`：{len(browser['checks'])} checks、{len(browser['failures'])} failures；獨立 Edge context，file://，1100／390px；localStorage 備份還原通過。",
 f"- `orbit2_verify.py`：{len(qa['errors'])} semantic failures；{qa['excludedQuestionCount']} 題從對應 row.qids 與課程 practice.qids 排除，題目本體不刪。明細：`orbit2-verification.json`。",
 '- 第一份現存 QA 報告已是 0 failures；先重新建置同步 content 與 data，沒有放寬或刪除 check.cjs 的圖片計數斷言。',
 '- 追查題庫紅圈 JPG 發現它們不是原圖路徑：產生器現在依 `<pack>-q-<lesson>-<figure>` 來源與名稱核對原圖，再封鎖對應題目。沒有可用切片視圖時，構造列改放已存在且未封鎖的替代圖；原切片 explore 點位不修改。',
 '- 人工逐張開啟 25 張 `orbit2-old-*.png` 與本輪全部 `orbit2-*.png` 新疊圖，圖面一律 450px 寬。非醫學專業審稿，亦未做實機 iPad 驗證。','',
 '## 指定十列','', '| 構造 | 狀態 | 最佳視圖 |','|---|---|---|']
for t in qa['targets']:
    lines.append(f"| {t['zh']} | {'概略定位，仍未確證隆起' if t['zh']=='外側結節' else '清楚；450px 疊圖已核對'} | `{t['best']}` |")
lines+=['','## 全組各列：之前 → 之後與最佳視圖','','| 構造 | 圖數之前 → 之後 | 最佳視圖 | 判讀與限制 |','|---|---|---|---|']
for i,r in enumerate(rows):
    v=next((v for v in r['views'] if v['img'].endswith(preferred.get(r['zh'],'-never-'))),r['views'][0])
    lines.append(f"| {r['zh']} | {len(oldrows[i]['views'])} → {len(r['views'])} | {v['title']}<br>`{v['img']}` | {notes.get(r['zh'],'已核對圖中所見部分；骨片範圍以實際可見骨縫／切面為限。')} |")
lines+=['','`蝶竇` 在原清單本來就有兩列，本輪保留兩列與進度鍵。圖數不等於辨識品質；新首圖才是上述十列的優先辨識圖。','',
 '## 本輪圖片、來源與授權','',
 '新增 9 個裁切檔：Gray 193 全圖與上面觀特寫、Gray 192 內側壁近圖、Gray 135 眶面全景與淚腺窩特寫、Gerrish 210 滑車窩、Gray 163 淚骨、Gray 190 眶孔近圖、MAKY.OREL 外側壁標本近圖。另重用原 Gray 193／192 兩個完整圖檔補點。上次兩張標本照片保留。','',
 '所有新圖均由原圖直接裁切，骨面沒有重畫或生成；骨外可安全處理的字樣已裁去／白底遮去，骨面上的印字或無法完整移除的文字均保留並在 title 加「圖上有原文標籤」。切圖規格與來源像素座標在 `tools/midterm/orbit2_assets.py`。','']
for f in load('docs/midterm-views/orbit2-sources.json'):
    lines.append(f"- `{f['img']}`：{f['source']}")
lines+=['','Commons API metadata 原始回應：`tmp/orbit2-commons*.json`、`tmp/orbit2-candidates*.json`；重抓工具：`tools/midterm/fetch_orbit2.cjs`。所有使用中的新裁切圖寬 ≤650px。','',
 '### 查核後未採用的指定圖號','',
 '- Gray 191 是鼻腔／眼眶水平切面；內側壁應用 Gray 192，沒有把 191 誤稱內側壁。',
 '- Gray 136 是額骨前面觀；Gray 135 才有眶板。135 的滑車窩細節不夠明確，改用標出 Trochlear fossa 的 Gerrish 210。',
 '- Gray 162 是上頜骨發育圖，淚骨應用 Gray 163。',
 '- Gray 165 為顴骨外面、166 為內面，沒有可確證的 Whitnall 結節。Dixon 107、Morris 187、Sobotta 103 亦未採作 Whitnall 圖；Morris 下緣的 malar tubercle 不能混同眶內結節。',
 '- `tmp/orbit2-tubercle-reference.png` 來自有版權的網站，僅作辨識參考，未放入教學素材。','',
 '## 封鎖明細','',f"本輪新增／審定 {len(load('docs/midterm-views/orbit2-blocked.json'))} 組圖片＋構造配對；保留其他工作者的 9 組既有條目。",'',
 '| 原圖 | 構造 | 理由 |','|---|---|---|']
for b in load('docs/midterm-views/orbit2-blocked.json'):
    lines.append(f"| `{b['img']}` | {b['zh']} | {b['reason']} |")
lines+=['','## 重跑與交接','',
 '1. 如需重新下載，先用 fetch_orbit2.cjs 取得 Gray 135／163／192 與 Gerrish 210；Gray 190／193／MAKY.OREL 來源沿用專案原圖。',
 '2. `orbit2_assets.py` → `orbit2_blocklist.py` → `build_midterm.py` → `tools/build.py --strict` → `orbit2_verify.py` → `check.cjs` → `orbit2_report.py`。',
 '3. 新增 primary 與 approx 支援；沒有改 index.html 或 js/**，沒有 commit／push／reset／stash。',
 '4. 待補：外側結節需要可確證隆起的公開授權近照或解剖板；目前不得算作已完成清楚辨識。',
 '5. AI-Brain 目前在允許寫入目錄外，未寫入 vault；待同步摘要：骨質眼窩新增 9 裁切視圖、封鎖清單與紅圈題來源映射，9/10 目標清楚、Whitnall 結節仍待補。','']
(ROOT/'docs/midterm-views/骨質眼窩.md').write_text('\n'.join(lines),encoding='utf8')
print('updated docs/midterm-views/骨質眼窩.md')
