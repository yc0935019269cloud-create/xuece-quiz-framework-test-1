# 大一下視光學九堂總複習QA

只測`tools/learn-redo/s114-review-progress.json`列的九堂複習。

```powershell
python tools/learn-redo/s114_review_audit.py
$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'
node tools/s114-review-qa/check.cjs
```

需要Playwright與Edge；HTML走file://，每個寬度獨立context，備份／還原localStorage。

- 先寫測試進度再reload，按實際色條逐頁，核對頁碼與類型，不把同一頁重畫算成不同頁。
- 檢查空白、圖片失敗、格式標記外洩、水平溢出；原檢核實際答題判分，範例展開到最後。
- 散光互動按前／中／後，核對光斑直線／圓／橫線。
- 總演練實際顯示題目，並核對抽題池均屬該單元。前後導航用實體點擊；iframe須等待載入與捲動穩定。
- 內容audit比對固定基準、非目標課、原題與卡片，僅允許列入corrections的更正及單元抽題限制。

輸出`output/playwright/s114-review-{qa,audit}.json`及畫面截圖。通過版本的可攜報告保存在`docs/s114-review-readability/`。未測實機iPad或真人理解度。
