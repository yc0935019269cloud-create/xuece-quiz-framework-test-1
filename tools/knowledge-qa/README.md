# 星號收藏與知識比較 QA

```powershell
$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'
node tools/knowledge-qa/check.cjs
```

使用 Edge 的獨立 context，以 `file://` 測試桌機 1100px 與手機 390px；每個 context 先備份 localStorage，結束還原，不接觸使用者瀏覽器存檔。攔截未啟動的 Peglin localhost 探測。

64 項檢查涵蓋：圖解逐點加星號、鍵盤操作不換頁、不影響成績／獎勵／複習、遮住名稱、未完成課程的收藏、單元／科目／類型／搜尋篩選、原圖與原位置、自訂 pin 位置、看圖寫中英文揭曉後收藏、真實題庫實戰收藏、混合卡片、圖片載入、手機橫向溢位、重載、取消、Store 備份匯出／匯入、缺少導入來源、20 筆分頁、無頁面錯誤、存檔還原。

結果與截圖：`output/playwright/knowledge-stars-qa.json`、`knowledge-stars-desktop.png`、`knowledge-stars-mobile.png`。未測實機 iPad 或真實帳號雲端往返；嚴格內容檢查仍可能列出既有縮寫覆蓋提醒。
