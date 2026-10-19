# 實驗課總複習互動圖與鮑氏環標記

本次只針對 `eye_anat` 的學習模式：老師講義三單元（`eyelab-vp`、`eyelab-orbit`、`eyelab-blood`）總複習的「總圖｜原課名」卡片，先列出該課原有互動圖，再提供可展開的完整標註圖。總表、題目、課與步驟索引不變。

- `js/learn.js` 在播放上述卡片時，依「總圖｜」後面的完整課名找到來源課，使用同一個 `renderDiagram`。改課名時須同步總圖標題，QA 會檢查來源對應。
- 圖片下拉選單、點標記／名稱、遮住名稱、修正標記、小星星與英文發音共用原功能。星號與 pins 存在**原課原圖**，不另開一份複習紀錄。喇叭由 `GLOSS.speak` 送至瀏覽器語音引擎，沿用念完恢復背景音量。
- 原圖／總表仍保留；原標註圖片先收合，避免整排圖片擠在互動圖前面。
- 目錄保留「實驗課（依老師講義）」與「實驗手冊名詞（考試範圍）」；另外 9 個舊課程／圖鑑單元移到「其他」，ID 不變。課程與筆記樹的三個入口依此順序顯示，題庫分類不改。

鮑氏環標記從 `(22.93%,47.87%)` 移到 `(23.81%,58.43%)`；標本 60 上方為前方、下方為後方，沿同側纖維往後移，與梅氏環 `(19.3%,40.9%)` 分開。同步兩個互動圖、兩張完整標註圖、課內看圖題與兩個跑台題本。新圖使用 `-baum-v2.jpg` 避免快取舊位置，舊圖片保留供舊連結使用。

來源點位正本也已更新 `E:\NEWTEST\eye_work\vp\bases.py`。本次採用既有 `annot2.label/ring` 重新輸出指定四張註記圖，未修改標本底圖；不要重跑整套圖鑑產生器覆蓋現有 content。

核對原則：梅氏環走顳葉、上方視放射纖維經頂葉向後，參考 [視放射 tractography 研究](https://pmc.ncbi.nlm.nih.gov/articles/PMC4099254/) 及老師講義第 11 頁箭頭。照片上的細小纖維標記仍屬教學定位，不是新的標本解剖認證。

```powershell
python -X utf8 tools/eyelab-qa/update_review_atlas.py
python -X utf8 tools/build.py --strict
$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'
node tools/eyelab-qa/review-atlas.cjs
node tools/knowledge-qa/check.cjs
```

Edge file:// 桌機 1100px 與手機 390px，43 張互動圖各切換一次（共 86 次）及 522 項檢查通過：原圖／點位、發音事件、星號來源、原標註圖展開、下一步、三個目錄入口、無橫向溢位、無頁面錯誤、原課／步驟／題目答案完整性、localStorage 還原。星號既有 72 項回歸通過。測試使用獨立 context，沒有讀寫使用者存檔；語音以 dispatch 攔截驗證，未做實機 iPad 或人耳發音品質驗證。

報告與截圖：`output/playwright/review-atlas-*`。
