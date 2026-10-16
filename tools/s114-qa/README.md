# 視光學「國考重點複習」與 114 大一下第01～03單元檢查

- `check.cjs`：101 項（資料完整性、題本年份路徑、抽題池、渲染、知識筆記相關題視窗、390px）。
- `sweep.cjs`：第01～03單元每一步＋各視光學單元「國考重點複習」課每一步（共 312 步）逐步渲染，確認沒有空白與頁面錯誤。
- `shots.cjs`：桌機與 390px 截圖，輸出到 `output/playwright/s114-*.png`。

執行（PowerShell）：

```
$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'
node tools/s114-qa/check.cjs
node tools/s114-qa/sweep.cjs
```

使用一次性的 headless Edge context（不碰使用者的瀏覽器存檔）；可用 `PW_EXE`／`PW_CHANNEL` 指定瀏覽器。
