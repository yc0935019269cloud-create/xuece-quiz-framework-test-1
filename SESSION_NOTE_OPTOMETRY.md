# 視光學易讀版接手記錄

最新大一下總複習任務已完成9/9，見[獨立接手記錄](SESSION_NOTE_OPTOMETRY_S114_REVIEW.md)。以下大二上27課仍是原已完成任務，不要混用基準與逐課腳本。

更新：2026-10-18，v117。這份獨立於眼解剖生理學的SESSION_NOTE.md。

## 最新任務與狀態

使用者已認可JCC第四版：「很好，就照這個方法這個節奏把這些都改成這樣的形式」，要求逐課做好、持續記錄進度，並明確授權「做好就推上git」。早期「只做試作、等待確認」已失效。

**27/27課已改寫並通過本次驗證。** MSR10課、視野10課、雙眼平衡7課；不含視光學二第01單元、其他學期，也不改眼解剖生理學。教材、交接與驗證均完成，不要再重做教材。使用者授權完成後推Git；發布狀態以最新Git提交及origin/main對應為準，檔案不寫自我引用的提交雜湊。

逐課清單：`tools/learn-redo/optometry-progress.json`。下次若另改一課，只把該課改回待驗證；不能沿用本次通過狀態。

## 使用者喜歡的形式（接手一定先讀）

- **同一個具體對象一路講**：先知道名詞指的是誰、在哪裡，才談動作、原因，最後數字。
- 第三版視覺已認可，第四版補概念銜接才真正認可。拒絕的版本只是把術語壓短，仍突然出現「兩方向、小圓、兩面差」。
- 金色一句重點，短表格、藍／橘兩欄；綠／紫區分結果／限制。不把正文、國考點、示範全擠同頁。
- 不以刪細節換簡單；把前置概念補成能一路讀的順序。所有考點、條件、原題來源仍在。
- 概念可連續多頁，不必每講一點就出題；本次97題檢核未增加數量。
- 不大量貼整張講義。必要的形狀、光路、視野圖才配圖；互動必須光學方向正確。

完整方法：[docs/視光學_易讀版改寫方法.md](docs/視光學_易讀版改寫方法.md)。JCC四次演進、來源／圖片授權、兩互動的方程：[docs/視光學_易讀版試作.md](docs/視光學_易讀版試作.md)。

## 成品與重跑

- 正本：`content/learn/optometry/optom2/optom2-u2-msr.json`、`optom2-u3-vf.json`、`optom2-u4-bb.json`。
- 逐課手寫來源：`tools/learn-redo/msr_l*.py`（l4另用`optom2_jcc_l4.py`）、`vf_l*.py`、`bb_l*.py`。基準固定22cfdff，腳本只改指定課。
- `optometry_common.py`保留原題、範例、實戰、記憶卡與出處，逐卡改寫。每寫一課更新進度。
- **重跑任一課後一定再跑`optometry_corrections.py`**，避免0 dB、微視野學習效應等舊錯誤回到複習卡。逐欄更正在`optometry-corrections.json`。
- 內容修改後`python tools/build.py --strict`，不能手改data；JS／CSS改後增加index快取。v117的表格CSS只套這三單元，播放器有data-pack／data-lesson。

原27課ID、97檢核題幹、172記憶卡正面保留，生成ID仍相同；範例與實戰保留。有誤題解、背面、1個多選選項按來源更正；多選答案仍ACD。不要為了宣稱原文未動，把錯誤改回去。

新增前置頁後，進行中舊存檔的頁序可能對應不同內容，使用者可回課頭重讀。沒有清除存檔，未改資料儲存格式。

## 本次驗證（已完成）

- 嚴格建置exit0；三單元覆蓋225／78／63題，沒有新增標籤／孤兒題警告。
- `readability-audit.py`：27課、630步、406概念卡；97檢核、172記憶卡、每課去重合計360筆考題出處完整。程式核對通過，不代表360道獨立題目。
- **真正逐頁**Edge file://，1000px與390px：**1260渲染、194檢核正確判分、66範例完整展開、44圖片出現、6實戰抽題／6前後頁操作，0問題**。
- JCC互動回歸：62渲染、8判分、6圖片放大關閉、6焦線狀態、6翻片狀態；0問題。
- 已目視MSR入門與稜鏡頁桌機／手機截圖。無空白、圖檔載入錯誤、語法外露、橫向溢出。一次性context備份／還原localStorage；未碰使用者瀏覽器。
- 不宣稱實機iPad、真人零基礎理解測試或完整醫學審稿。MSR講義20/200散光<4.00的原表不一致，已保留並標待老師確認；其餘更正與官方／研究來源在方法文件。

報告：`output/playwright/optometry-readability-audit.json`、`optometry-readability-qa.json`、`jcc-trial-qa.json`。截圖`optometry-first-*`、`optometry-prism-*`與`jcc-bridge-*`。

**舊工具陷阱**：`sweep.cjs`原本只寫localStorage、不reload，LEARN_UI有記憶體快取，舊504／434／322數字不足以證明每頁測到。已修reload＋實際頁碼核對；本次正式證據用`readability.cjs`，每課reload後真正按跳頁色條逐步核對頁碼與類型。舊`optom2-qa/check.cjs`要求每卡exam＋demo屬過時形式，不拿來限制新節奏。

```powershell
python -X utf8 tools/optom2-qa/readability-audit.py
python tools/build.py --check --strict
$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'
node tools/optom2-qa/readability.cjs
node tools/optom2-qa/jcc-trial.cjs
```

## 提交界線

只提交本次三單元、相關樣式與data、指定新圖、逐課腳本、驗證工具與交接文件／指定JSON報告。不要`git add .`；專案有大量既存未追蹤截圖與tmp。**商業錄音assets/music/u_*.mp3不得發布**。此輪不碰音樂；素材新圖的作者／授權已在試作文件。

## 逐課最新進度（自動更新）

27/27已改寫並驗證；沒有尚待補寫的課。詳細分課狀態見JSON；可攜驗證報告在docs/optometry-readability/。
