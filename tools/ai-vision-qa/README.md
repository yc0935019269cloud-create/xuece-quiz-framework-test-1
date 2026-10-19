# 當頁圖文與名稱別名 QA

```powershell
node tools/ai-vision-qa/backend.mjs
# 另一個終端機啟動網站，保持它執行：
python -m http.server 18778 --bind 127.0.0.1
# 測試終端機：
$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'
node tools/ai-vision-qa/browser.cjs
node tools/ai-vision-qa/aliases.cjs
```

- 後端 21 項：圖文格式、像素完整傳遞、僅視覺模型備援、失敗不扣次數、登入／封鎖／用量上限、圖片數量／文字長度限制、不合法圖片及本機／遠端路徑拒絕、文字服務回歸。
- 瀏覽器 40 項：桌機／390px 手機 HTTP、桌機 file://；一般提問自動附圖文、編號位置、續問、一鍵講解、知識筆記、清楚的讀圖失敗、非學習頁文字模式、存檔還原。file:// 公開圖片備援由攔截器提供同一份本機圖檔並加 CORS。
- 名稱別名 18 項：短／長後睫狀動脈三種合法中文寫法在看圖寫名稱與題庫皆接受；不接受長短混淆、錯誤英文或只填一個語言。
- 原有星號功能 `node tools/knowledge-qa/check.cjs` 72 項回歸通過。

瀏覽器用 Edge 獨立 context，備份／還原 localStorage；雲端／模型回應皆為 fixture，沒有呼叫真實學生帳號、沒有驗證模型的醫學辨圖品質。正式 Supabase 只驗證部署 ACTIVE、CORS 預檢與未登入拒絕。結果、示意傳送圖與截圖在 `output/playwright/ai-vision-*`、`ciliary-alias-*`。

別名正本在 `content/learn/eye_anat/lab-{blood,manual-vessel}.json`、相關題庫與 `content/glossary/eye-lab.json`。`tools/eyelab-qa/add_ciliary_aliases.py` 可重跑（冪等），不改題號、英文或主要答案。專案外產生器 `E:\NEWTEST\eye_work\atlas\names.py` 也已補相同別名；不必重跑整個圖鑑產生器。
