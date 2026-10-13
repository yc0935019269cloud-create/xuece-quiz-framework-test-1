# 生理光學公式統整檢查

`node tools/formulas-qa/content-check.cjs` 比對當前建置與 Git HEAD 的既有課程內容、題庫連結及進度 ID（排除新增 notes），並獨立驗算 58 項幾何／波動光學數值。摘要：`output/playwright/formulas-content-qa.json`。執行 `python tools/build.py --strict` 產生資料，再用 `--check --strict` 檢查而不寫檔。

UI 測試使用一次性 Edge context，setup 先備份 localStorage，check 在 finally 還原；舊導入檔測試在該 context 的 IndexedDB 加入並刪除測試資料，不使用使用者 profile。localhost 伺服器使用既有 `python tools/audio-qa/serve.py`。

```powershell
npx --yes --package @playwright/cli playwright-cli -s=formulas-qa open --browser msedge --device 'iPad (gen 7)'
npx --yes --package @playwright/cli playwright-cli -s=formulas-qa run-code --filename tools/formulas-qa/setup.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=formulas-qa snapshot '#learnBody' --raw
npx --yes --package @playwright/cli playwright-cli -s=formulas-qa run-code --filename tools/formulas-qa/check.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=formulas-qa close
```

桌機以另一 session 名稱執行並省略 `--device`。最後停止自己啟動的本機伺服器。

每個 context 檢查 40 項：六單元置頂／零進度可查、62 組公式與講解覆蓋、生活比喻／簡單練習／進階推導分層、跳轉／收合、搜尋、原筆記與其他科目、進度隔離、導入相容與舊檔保留、重載、390px 長矩陣換行、原課程入口與 JS 錯誤。結果及截圖：`output/playwright/formulas-*`。

這些是 Edge 桌機與 iPad 路徑模擬、HTTP 測試，沒有實機 iPad／file:// 測試，也沒有招募國中學生驗證閱讀理解。內容依既有課程整理，另外對照 OpenStax 與 KrakenOS 官方教材／文件的公式和慣例；各單元筆記底部有核對連結。第六單元保留「期中考不考」，課程原本步驟及複習卡未改。
