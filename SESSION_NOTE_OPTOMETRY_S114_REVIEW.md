# 視光學大一下總複習：接手記錄

後續59堂正課也已完成，見[獨立正課記錄](SESSION_NOTE_OPTOMETRY_S114_COURSES.md)；本檔九堂總複習內容與驗證範圍仍維持原任務。

更新：2026-10-18，v124。**9/9課已完成改寫與驗證**；使用者授權「做好就推上git」。發布狀態請用最新Git提交與origin/main核對，不把已完成標成待試作。

## 最新範圍

只改114大一下視光學01～09單元最後一堂「國考重點複習」；前3單元為l8、l7、l5，後6單元在p2的exam-review。其他正課、99名詞、已完成的大二上27課不動。

逐課進度與精確ID：`tools/learn-redo/s114-review-progress.json`。完整方法與內容更正、核對來源：`docs/視光學大一下_總複習改寫.md`。

## 使用者認可的形式

- 具體畫面→命名（中文／英文／縮寫）→原因與操作→數字；先說是誰、量什麼，不能突然丟「兩方向、小圓、兩面差」。
- 金色一句重點、短表格；藍／橘比較對象，綠／紫區分結果與限制。概念、原國考提醒、原示範可分頁，保留細節而不塞滿同頁。
- 概念可連續數頁，不強制每個知識後面一題；保留原題的深度。必要圖才放，不大量貼講義。
- 本次散光用已認可JCC光斑互動，依前／中／後辨認直線／圓／橫線；屈光度中點不是距離算術中點，也不是已清晰。

## 完整性與已修正項目

九課235步、157概念卡，原32題檢核與33記憶卡保留。原課ID、題幹、卡正面、來源保留；其他課與pack其他欄位完全一致。原引用按每課去重加總304筆，不當成304題不同試題。

13處更正有before／after／path：`tools/learn-redo/s114-review-corrections.json`。包括logMAR五字計分條件、AA遠點正負號、NPC診斷界限、1.3375假設指數、針孔與皮質性失明條件。不要為了宣稱一字未動，把錯誤改回去。最後演練只抽本單元國考題，避免p2舊設定跨單元。

## 正本與重跑

- `content/learn/optometry/semester114/`的九個目標JSON。
- `tools/learn-redo/s114_review_01.py`～`09.py`：逐課手寫，固定基準`a72883ca00ed1ba3ecb958c5ab5d89f4f120d5dd`；共用`s114_review_common.py`保留題／卡／出處與原縮排。
- 重跑任一課後執行`s114_review_corrections.py`→`python tools/build.py --strict`→`s114_review_audit.py`→`node tools/s114-review-qa/check.cjs`。Playwright使用`NODE_PATH=E:\NEWTEST\skull-atlas-3d\node_modules`與msedge。
- `s114_review_style.py`僅擴充九堂表格CSS；目前v124。data由build產生，未改播放器JS、存檔格式或清除紀錄。新增頁面使原進行中頁序可能不同，可回課頭重讀。
- 產生器重跑會把該課重新標成待驗證，也會重寫本接手頁為暫存進度；完成後須重新更新交接和可攜報告，不得保留失效通過狀態。

## 驗證與界限

嚴格建置通過，內容範圍／原題／卡／出處比對通過，18項數值核對。Edge file:// 1000／390px實際470頁、64判分、36次範例展開、6個互動狀態、18個抽題池和18次前後導航，0問題。

互動iframe剛載入時過早自動捲動點擊會點入frame；測試等待load、捲動與兩個繪製幀，再實際點上一頁，並核對計數，不用直接onclick假裝通過。播放器邏輯未為此修改。

報告：`docs/s114-review-readability/{audit,qa}.json`；測試腳本：`tools/s114-review-qa/`。抽樣目視看過logMAR計分、RAPD、AA的桌機／手機表格。測試獨立context備份／還原localStorage；沒有實機iPad、真人初學者理解驗證或完整專業審稿。

沒有尚未完成的教材課。若有新回饋，只針對該課修改並重跑相關驗證；不要擴到其他學期。
