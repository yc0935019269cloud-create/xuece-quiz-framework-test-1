# SESSION NOTE（交接給下一位接手者／Codex）

更新：2026-10-18。先讀 `CLAUDE.md` 最後一節「眼解剖實驗：圖鑑式學習單元＋跑台題庫」——那是使用者要求的固定形式與完整說明。

## 本輪狀態：已完成並推上 GitHub
- 9 個圖鑑式單元：`content/learn/eye_anat/lab-*.json`（視覺路徑、骨質眼窩、血液供應＋手冊第 1、2、4、5、8、10 頁）。
- 跑台題庫：`content/bank/eye_anat/lab/`，92 個題本（每張圖一個）、447 題（每個點位一題，紅圈圖上印中英文題目）。
- 新功能：`kind: "name"`（看圖寫中英文）、檢核題附圖、名詞字源小視窗（`js/glossary.js`）。index.html v102。
- 產生器在專案外 `E:\NEWTEST\eye_work\atlas\`（說明見 CLAUDE.md）。

## 使用者可能接著要的
- 檢查點位位置（自動／人工定位，無專業審稿；楔葉、舌回、穆勒氏肌、前脈絡叢動脈、眼底四大分支為大致位置）。
- 部分 Gray 圖本身有英文標籤（眼動脈分支、睫狀動脈、渦靜脈、眼眶神經、翼顎神經節圖），看圖題會被提示；可改用無標籤圖或塗掉標籤（參考 `bases_all.py` 的 `mask()`）。
- 老師講義／圖譜／上課照片在 `img/eye-lab-private/`：使用者同意上傳到公開 repo，已推上去，網址版也看得到。

## 執行
```
python -X utf8 E:/NEWTEST/eye_work/atlas/build_all.py      # 重建 9 個單元＋題庫＋字源
python tools/build.py --strict --index
$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'
node tools/eyelab-qa/check.cjs eyelab-orbit                # 其他：eyelab-vp / eyelab-blood / eyelab-m-orbit …
node tools/eyelab-qa/bank-test.cjs
```
