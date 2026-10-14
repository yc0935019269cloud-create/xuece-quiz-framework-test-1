# 視光學二內容檢查

`check.cjs`：資料完整性（u2～u4 每張概念卡都有 `exam` 與 `demo`、知識筆記齊全、practice 抽題池非空）＋ 227 題國考題載入與詳解＋抽樣概念卡實際渲染出「🎯 國考重點」「✏️ 示範」＋知識筆記頁。

```powershell
$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'
node tools/optom2-qa/check.cjs
```

使用一次性 headless Edge context（file:// 開 index.html），不碰使用者瀏覽器存檔；結果寫到 `output/playwright/optom2-qa.json` 與 `optom2-qa-card.png`。
