# 公式統整相關題檢查

範圍是「學習模式 → 知識筆記 → 第一～第五單元 → 公式統整」。50 組公式各有預設收合的相關題，632 次連結、495 題不重複題目，其中 67 題為老師講義原題；31 組公式有老師講義題。第六單元完全不改，也不連入其題本。

內容正本在五個 content/learn/physopt JSON 的公式 `relatedQuestions`，不手改 data/learn.js。`link.py` 保存逐組核對後的老師題號／單元練習題號／國考考點條件，依老師講義、國考、單元練習排序；部分題目可以對應多組公式。沒有老師原題可對應的公式使用現有單元練習；第一單元週期以頻率計算作延伸，清楚註明原題沒有直接問週期。

```powershell
python -X utf8 tools/formula-related-qa/link.py
python tools/build.py --strict
node tools/formula-related-qa/content-check.cjs
node tools/formulas-qa/content-check.cjs
python tools/build.py --check --strict
```

link.py 只重寫五單元的相關題欄位。後續若人工改了連結，先同步選題規則再重跑，避免覆蓋人工選題。內容校驗排除新增 relatedQuestions／relatedHint 後，以 SHA-256 比對 97 個原單元、公式講解與進度 id 完全相同；第六單元完整比對、全部題庫（排除建置時間）完全相同。另可重跑原 58 項公式數值校驗。

先啟動 `python tools/audio-qa/serve.py`（127.0.0.1:8977），再執行：

```powershell
npx --yes --package @playwright/cli playwright-cli -s=formula-related-ipad open --browser msedge --device 'iPad (gen 7)'
npx --yes --package @playwright/cli playwright-cli -s=formula-related-ipad run-code --filename tools/formulas-qa/setup.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=formula-related-ipad snapshot '#learnBody' --raw
npx --yes --package @playwright/cli playwright-cli -s=formula-related-ipad run-code --filename tools/formula-related-qa/check.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=formula-related-ipad close
```

桌機換另一 session 名稱並省略 device，完成後停止自己啟動的伺服器。每個 context 192 項，逐一展開 50 組列表、確認數量與老師來源、開啟閱讀視窗並捲到詳解底部、確認固定關閉鍵；另驗證預設收合、全部展開、搜尋、390px、原考前必看清單、紀錄隔離、匯入與舊檔補連結／明確空陣列。QA 使用一次性 Edge context，載入前備份 localStorage，finally 還原並移除 IndexedDB fixture；不使用使用者 profile。

結果／截圖：output/playwright/formula-related-*。本輪是 HTTP／Edge 桌機與 iPad 路徑模擬，沒有實機 iPadOS、file:// 或雲端帳號往返測試。
