# 知識筆記相關題連結檢查

範圍是「學習模式 → 知識筆記 → 第一～第五單元 → 考前必看」。20 組公式使用既有 `evidence.questionIds`，共有 378 次連結、343 題不重複題目；不新增或更動題庫內容。第六單元依使用者指示先不做相關題連結。

相關題用獨立的原生 details 預設收合，展開才建立連結；知識筆記的「全部展開」、搜尋、重載也不會自動打開相關題。只連結 `Store.Q` 目前有載入的題目，不把原卷檔案字串誤當作題庫 id。匯入檔若保留原 evidence，就沿用同一套連結規則。

`QV.previewModal` 共用既有題幹、選項、圖片、題組、答案與詳解呈現，純閱讀不呼叫作答控制器或寫入紀錄。支援右上角關閉、Esc、Tab 焦點限制與回到原連結；視窗內原有收藏／問 AI 控制照常。原 iOS `.hap-sw` 點擊用 closest 找到題目連結。

先啟動 `python tools/audio-qa/serve.py`（127.0.0.1:8977），再執行：

```powershell
npx --yes --package @playwright/cli playwright-cli -s=exam-related-ipad open --browser msedge --device 'iPad (gen 7)'
npx --yes --package @playwright/cli playwright-cli -s=exam-related-ipad run-code --filename tools/formulas-qa/setup.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=exam-related-ipad snapshot '#learnBody' --raw
npx --yes --package @playwright/cli playwright-cli -s=exam-related-ipad run-code --filename tools/exam-related-qa/check.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=exam-related-ipad close
```

桌機換另一 session 名稱並省略 device，完成後停止自己啟動的伺服器。測試在一次性 Edge context，setup 載入前備份 localStorage，check finally 還原，不使用使用者 profile。

QA：iPad 路徑 73 項、桌機 93 項；驗證全部 378 個來源連結都有題幹／選項／詳解，每組實際開關一題，另測 Prentice 最後一題、搜尋、全部展開、重載、Esc／關閉、桌機焦點回復與 390px 排版。閱讀前後作答、錯題、學習進度與獎勵一致。報告與截圖在 `output/playwright/exam-related-*`。

這是 HTTP 與 Edge 路徑模擬，沒有實機 iPad 或本輪 file:// 測試。全部 JS 語法、嚴格內容檢查通過；此輪沒有改 content／生成資料，也沒有另外重做第六單元題目。
