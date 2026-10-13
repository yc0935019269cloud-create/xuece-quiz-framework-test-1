# 生理光學考前必看檢查

六個單元各有 `exam-cram` 筆記，共 22 個重點；介面固定放在原公式統整前，公式／用途／易錯提醒直接閱讀，不再增加逐條展開步驟。

`python -X utf8 tools/exam-cram-qa/analyze.py` 讀取已選入第一～五單元的 421 題國考選題，以及 `E:\學習\驗光師國考題` 中 106～114 年《視覺光學》《眼鏡光學概要》26 份原卷、1,300 題。原卷使用 PyMuPDF，須保留原資料夾；選項不算第六單元的關鍵字命中。結果寫入 `output/playwright/exam-cram-evidence.json`，只留題號、年份與統計，不複製原卷全文。

第一～五單元依既有考點標籤分組，第六單元依原卷題幹核對薄膜／抗反射與反射率。**相關題數包含觀念題，不是每個公式的直接命題次數**；第一～五單元使用已篩選的題庫，也不是整份國考的全面排名。本次樣本止於 114 年，不能推稱 115 年／未來考試必考。單狹縫／相位公式在這批題幹沒有命中，因此保留在完整統整，沒有標成常考重點。

```powershell
python tools/build.py --strict
node tools/exam-cram-qa/content-check.cjs
node tools/formulas-qa/content-check.cjs
python tools/build.py --check --strict
```

內容檢查驗證 22 項來源題號與統計、短句長度、六單元排序，以及 97 個原單元／原公式筆記／題庫連結完全不變；另驗算 Prentice、兩片鏡成像、頂點距離與稜鏡向量的數值。公式統整原有 58 項數值驗算也可重跑。

UI 使用一次性 Edge context，setup 在載入前備份 localStorage，check 的 finally 還原；IndexedDB 的匯入 fixture 會刪除，不使用使用者 profile。先啟動 `python tools/audio-qa/serve.py`（127.0.0.1:8977）。

```powershell
npx --yes --package @playwright/cli playwright-cli -s=exam-cram-qa open --browser msedge --device 'iPad (gen 7)'
npx --yes --package @playwright/cli playwright-cli -s=exam-cram-qa run-code --filename tools/formulas-qa/setup.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=exam-cram-qa snapshot '#learnBody' --raw
npx --yes --package @playwright/cli playwright-cli -s=exam-cram-qa run-code --filename tools/exam-cram-qa/check.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=exam-cram-qa close
```

桌機換另一 session 名稱並省略 device，完成後停止自己啟動的伺服器。每個 context 26 項，涵蓋排序／數量、六區公式、搜尋、全部展開／收合、390px 無橫向溢出、閱讀不改進度、舊版匯入自動補筆記與明確空陣列、重載、JS 錯誤。摘要與截圖在 `output/playwright/exam-cram-*`。

這是 HTTP 上的桌機／iPad 路徑模擬，沒有實機 iPad、file:// 或真實考生閱讀理解測試。第六單元原有「期中考不考」提示保留；國考相關公式仍可查閱。
