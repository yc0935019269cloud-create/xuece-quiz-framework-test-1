# 收藏與資料夾回歸檢查

使用 Playwright CLI 的獨立 Edge context，setup 在進入頁面前備份 localStorage，check 的 finally 還原原始內容；不使用使用者瀏覽器設定檔。

在專案根目錄啟動共用的安靜本機伺服器：

```powershell
python tools/audio-qa/serve.py
```

另開終端機測試 iPad 的程式路徑和原生觸覺開關覆蓋層：

```powershell
npx --yes --package @playwright/cli playwright-cli -s=favorites-qa open --browser msedge --device 'iPad (gen 7)'
npx --yes --package @playwright/cli playwright-cli -s=favorites-qa run-code --filename tools/favorites-qa/setup.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=favorites-qa snapshot '#screen' --raw
npx --yes --package @playwright/cli playwright-cli -s=favorites-qa run-code --filename tools/favorites-qa/check.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=favorites-qa close
```

桌機使用另一個 session 名稱並省略 `--device`，其餘步驟相同。結束後停止自己啟動的伺服器。

檢查收藏／取消、手動多資料夾分類、改名／刪除與未分類、題庫組合篩選、收藏遠征、限時暫停／恢復、鍵盤隔離、正常作答、存檔重載、新舊備份相容、導入題目 ID 保留、390px 排版與 JS 錯誤。摘要：`output/playwright/favorites-qa.json`。

此測試透過 localhost HTTP 執行，沒有用這個 CLI 驗證 file://；iPad 為 Edge 模擬程式路徑，沒有實機測試。雲端僅確認既有同步使用的 Store.exportAll payload 含收藏資料，沒有登入使用者帳號執行同步。
