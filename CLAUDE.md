# 接手本專案前請先讀

這是「刷題地牢」通用刷題庫遊戲框架（從學測地牢抽出）。**開始工作前先讀 `README.md`**（後半是開發交接）。

- 使用者用繁體中文溝通。
- 內容（題目、學習單元、科目設定）都在 `content/`；改完執行 `python tools/build.py`。`data/*.js` 是自動產生的，不要手改。
- 格式規格：`docs/格式_題庫.md`、`docs/格式_學習模式.md`；給 AI 的提示詞：`docs/prompts/`。
- 純 HTML/JS、必須能用 file:// 開；改 JS/CSS 後把 index.html 的 `?v=N` 加一。
- 在預覽測試前先備份 localStorage、測完還原。
- `assets/music/u_*.mp3` 是使用者自備商業錄音，僅限個人使用，不可發布。


## 114 大一下資源（2026-09-30）

- 本次資源：`資源/114 大一下/`；分類為 `114 大一下 → 原國考年份或114學年度 → 科目 → 單元`，JSON 的 path 與資料夾一致。原遊戲的四科 1,445 題完整保留，轉為 167 題本；六個來源網站合併轉成 78 學習單元、364 課，另含 15 個離線互動與 6 個教學圖解。
- 同步內建內容在 `content/bank/<科目>/semester114/` 與 `content/learn/<科目>/semester114/`；沿用眼解剖生理學 `eye_ans`，新增 `physio`、`optometry`、`basic_optics`。既有 `eye_anat`、`physopt` 內容及使用者原先的未提交改動保留。
- 原題 ID、原編號與原始詳解欄位保留；跨單元題只存一次並保留其他單元標籤。不要改 s114 題本 ID，以免進度失去對應。
- `資源/114 大一下/預覽.html` 可直接離線開啟；`.來源` 為網站與舊資料快照、`.校驗` 為覆蓋對照、ID 對照與驗證，導入器會跳過點號目錄。
- 工具：`semester_sources.py → semester_extract.cjs → semester_convert.py → semester_preview.py → semester_validate.cjs`，之後 `python tools/build.py --strict --index`。來源已下載時不必重抓。轉換工具只歸檔本次不再使用的 s114 學習檔，保存在 `.校驗/歷次生成/`，不可清除其他使用者檔案。
- 嚴格建置與實際 importer.scan 均通過；來源逐題完整性、課程節奏、圖檔存在及互動 JS／數值邊界已檢查。不是完整醫學審題認證；需確認事項見資源內 `01_需要確認與修正.md`。

## 彈珠刷題（Peglin 整合）

- 營地的「彈珠刷題／彈珠學習」：`js/peglin.js`、`css/peglin.css`、`js/learn.js` 的 `applyPeglin`；外掛與啟動器原始碼正本在 `peglin/mod-src/`，說明見 `peglin/README.md`。
- 遊戲本體在 `E:\PeglinQuiz`（不要搬進來）；`E:\PeglinQuiz\peglin-link.json` 讓啟動器用本資料夾當網頁與題庫根目錄，紀錄寫到 `peglin/紀錄/`（已 .gitignore）。
- 沒有本機啟動器時兩個彈珠模式只顯示說明，不影響其他功能。測試用題本請加 `"test": true`，作答不會同步進使用者紀錄。

## 角色與動畫（2026-10-04）

- 已實裝 5 個職業各 4 男／4 女，共 40 款新造型（**要用魂晶購買**，比經典造型貴）；職業本身仍沿用原有解鎖規則。入口：職業殿堂 → 造型，可篩選男生／女生、新造型／經典，並試播攻擊與爆擊。
- 圖片模型生成的正本：`assets/heroes/*.png`，每人 8 個獨立姿勢（待機、眨眼、4 種攻擊、爆擊蓄力、爆擊重擊），共 320 個姿勢。動畫由這些姿勢加上播放節奏、位移與職業特效組成，不是逐幀影片。
- `js/heroes.js`：造型註冊、Canvas 姿勢播放器、呼吸／眨眼、攻擊／爆擊；`js/hero-atlas.js`：自動產生的來源範圍、腳底 pivot、共同比例與鄰格遮罩資訊。PNG 正本不經程式改繪。
- 4 種攻擊使用洗牌袋隨機播放（每袋各出現一次）；`js/fx.js` 中遊俠補疾風雙射、聖女補星環祝禱、狂戰士補裂地橫掃；爆擊各有職業特效。營地、職業殿堂、地圖、戰鬥、結算及學習模式共用角色播放器。
- 價格：新造型依款式 1／2／3／4 為 160／180／200／240 魂晶（經典造型 60～120、預設款免費），定價在 `js/heroes.js` 的 `NEW_SKIN_COST`。新角色預設穿經典預設款；存檔裡穿著「未購買的付費造型」時 `Store.heroTile` 自動退回預設外觀。舊造型 ID 與已購造型保留在「經典造型」。
- 動畫展示頁：`docs/hero-art/preview.html`（可 file://）；提示詞與造型清單：`docs/hero-art/manifest.json`；來源／修正紀錄：`docs/hero-art/generation-log.json`。
- 重新分析素材：`python tools/hero_atlas.py`（需要 Pillow、NumPy，只寫 metadata，不修改 PNG）；校驗：`docs/hero-art/atlas-check.json`。
- QA 已通過 40 款購買扣款、換裝與保存、320 姿勢非空／差異、160 次普通動畫與 40 次爆擊動畫、5 職業實際答題攻擊、4 招隨機覆蓋、390px 手機版及 file:// 載入。結果：`docs/hero-art/qa-report.json`；截圖：`docs/hero-art/screenshots/`。
- QA 在獨立且用完丟棄的 Edge headless context 內執行，備份／還原該 context 的 localStorage，沒有使用使用者的瀏覽器存檔。測試工具：`tools/check_hero_animations.cjs`、`tools/check_hero_motion.cjs`（Playwright + Edge）；本機可設定 `$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'` 後執行。
- 改 JS／CSS 後需更新 index.html 與展示頁的快取版本；腳本順序為 content2 → monsters → hero-atlas → heroes → store。不要手改自動產生的 hero-atlas.js，也不要改已用於存檔的 px_<職業>_<m/f><1..4> ID。

## 怪物擴充（2026-10-04）

- `js/monsters.js`：23 種新怪（手繪 12×12 像素圖、半邊鏡射寫法）、4 個新特性（shock 麻痺／expose 破綻／ambush 先制／harden 硬化，邏輯在 `js/run.js`）、怪物攻擊演出 `m.fx`（orb／fire／ink／frost／spore／needle／swarm／zap／slam → `FX.monStrike`）。目前共 70 種怪物。

## 學習單元 ⇄ 題庫的嚴格連結（2026-10-04）

- 起因：實戰 `pick.match` 原本用關鍵字撈整個科目題庫，第二單元會抽到第四單元的 Pe／Pv 題，第 1 課也會抽到第 2 課才教的題。
- 現在：單元宣告 `banks`（負責的題本）／`prior`（可複習的前面題本），每課宣告 `teaches`（教了哪些題庫標籤）；`tools/build.py` 為每個 practice.pick 算出 `pick.ids`（到這一課為止「標籤都已教過」的題），遊戲只從這份名單抽題。導入素材的單元由 `js/importer.js` 的 `linkPacks` 用同一套規則處理（已與 build 結果交叉比對：60 個實戰步驟完全一致）。
- 檢查：`python tools/build.py --coverage` 列出「教材沒提到的標籤」「孤兒題」「抽題池太小」「題目用到教材沒出現的符號」；`--strict` 把這些警告視為失敗。規格見 `docs/格式_學習模式.md` §9。
- 已套用：`physopt`（4 單元）、`optometry/optom2`（3 單元）、`eye_ans`（5 個自主神經單元＋3 個角膜單元）；114 大一下與眼解剖實驗**尚未**宣告 banks，行為不變。補教材：ans-basics（神經束／神經叢、蕈毒鹼阻斷）、ans-clinical（三叉神經三個感覺核、LR₆SO₄）、ans-pathways（交感路徑受損 → Horner）。
- 內容正本是 `content/`；`資源/*/_src/*.py` 產生器是當初的來源，**不要重跑它們覆蓋 content**（會丟掉 banks／teaches 與補強）。
- 提示詞（`docs/prompts/`）已加入 banks／teaches／深度對齊規則與新的 07-C（嚴謹連結）、07-E（覆蓋審計）；AI 提示詞畫面可勾選多段、一次複製（`js/prompts_ui.js`，2-C 會自動帶上 2-A）。

## 教材深度補強（2026-10-04）

- 原則（使用者明確要求）：**題目保持深度、不降級；教材要追上題目**。題目比教材深時補教材，不刪題、不簡化。審計流程見提示詞 07-E。
- 新增 8 堂進階課（課 id 標「進階：」，都已宣告 `teaches`），並各自新增 L3 難度題目（共 42 題，答案字母已平均分散）：
  - ans-clinical l3 病灶定位（Horner 三階神經元、CN III 瞳孔受累／迴避、睫狀神經節）；ans-reflex l4 瞳孔檢查判讀（傳入／傳出四格表、RAPD、光–近分離）；ans-basics l3 眼科用藥與自主神經（受器、藥物試驗、去神經超敏感）；cornea-layers l6 五層總整理與由症狀反推受損層。
  - physopt-u2 l5 簡化眼（遠點、軸性屈光不正、調節）；physopt-u4 l7 頂點距離與有效屈光力（眼鏡↔隱形眼鏡換算，含散光處方）。
  - optom2-u2 l8 處方轉換、主子午線與散光分類；optom2-u3 l8 Humphrey 可靠度、整體指標與追蹤。
- 這些進階內容是依標準教科書補充（**不是老師講義原文**），數值屬「常用參考值」；判讀門檻（可靠度、進展速度）已在教材中標明依儀器／老師講義為準。尚未經醫學審稿，新課的來源欄與內文有標「補充說明」。
- 新內容直接寫進 `content/` 的 JSON（保留原檔縮排與換行，eye_ans 縮排 2、其餘縮排 1）；加題時單選題答案字母要平均分散，若用程式重排選項、同步改詳解字母，**不要動到詳解裡的屈光度單位「D」**（曾因此改壞過一次）。

## 新造型兌換券與贈禮機制（2026-10-05）

- 不是每日發放：只贈送過一次。`js/screens.js` 的 `GIFTS` 清單每筆有唯一 `id` 與 `vouchers` 張數；每個存檔每個 id 只能領一次（記在 `profile.giftsClaimed`）。**之後要再送，就在 `GIFTS` 加一筆新 id**（舊 id 不要改／刪，否則已領過的人會再領一次），並把 index.html `?v=N` 加一。
- 營地左側卡片「🎁 禮物」只在有可領的禮物或手上有兌換券時出現（`profile.skinVouchers` 張數，不過期、可累積）。
- 兌換視窗 `voucherModal`：可切職業／性別、先試穿預覽，任選 40 款新造型之一；寫入 `ownedHeroSkins`，職業已解鎖就直接換上，未解鎖則解鎖後再穿。已擁有的款式不能重複兌換。

## 角色大小統一與腳底陰影（2026-10-05）

- 角色大小：`js/heroes.js` 的 `scaleFor` 依「待機姿勢的身高指標（外框高與像素面積開根號各半）」把 40 款縮放到同一待機身高（`TARGET_H`＝128 畫布像素，營地約為寵物的 1.7 倍；40 款差距約 8%）。不再被最寬的出招姿勢限制，改成擴大畫布：內部 224×224（左右各 +32、上方 +64），CSS 以 `left:-20%; top:-40%; width/height:140%` 疊在原格子上，腳底 pivot 仍在原格 (80,157)，出招武器不會被裁掉（`pointer-events:none`，不擋點擊）。要調整整體大小只改 `TARGET_H`。
- 懸空：原因是 `.camp-obj`／`.stage .ent` 繼承 24px 行高，外框比角色多出 8～12px，陰影貼外框底部所以離腳太遠。現在 `.camp-hero, .camp-pet, .stage .ent { line-height: 0 }`，營地與戰鬥的陰影中心都落在腳底（誤差約 1px）。
- 驗證：40 款營地待機高度 92～100px、陰影與腳左右偏差 ≤1.2px、8 個姿勢腳底不跳動、沒有任何姿勢碰到畫布邊緣；桌機／平板／手機寬度結果一致。`tools/check_hero_animations.cjs`、`check_hero_motion.cjs` 可用 `PW_EXE=<chromium 路徑>` 指定瀏覽器（預設 msedge）。

## 戰鬥畫面放大與學習模式場景（2026-10-05）

- 正式戰鬥：勇者格子 140→168、怪物各放大約 10%、寵物 70→76、`.stage` 高度 230→262（手機 190→206、收合時角色 zoom .66）。
- 學習模式戰鬥條（`js/learn.js` 的 `drawBattle`）改用和正式戰鬥相同的場景 `FX.stageBG(run, theme, withName)`（可直接傳主題，不需要 run）：依課次輪流書庫／苔蘚洞窟／冰晶洞窟／石磚地牢，課末魔王用熔岩／虛空。場景放在 `.lb-scene`、只在換主題時重畫（粒子不會因出招重置），前景在 `.lb-fg`；勇者 150、怪物 96／112／136，並有腳底陰影。條高 212（手機 168）。
## 生理光學第五、六單元＋老師課堂題（2026-10-08）

- 來源：使用者的 Google 雲端資料夾（第五單元、第六單元簡報＋9/30、10/7 逐字稿）。雲端上第 1–4 單元檔案與已匯入版本大小相同，未重做。
- 新單元 `content/learn/physopt/physopt-u5-matrix.json`（7 課：光學矩陣、光闌、望遠鏡、稜鏡）與 `physopt-u6-wave.json`（4 課：簡諧波、干涉、薄膜）；題本 `physopt-u5-q`（37 題）、`physopt-u6-q`（29 題），都已宣告 banks／teaches，`--coverage` 無警告。各有互動模擬（矩陣光線追跡、兩波疊加、薄膜顏色）。
- 和第一、四單元重疊的觀念（c = λf、Pe／Pv／Pf）只做回顧與矩陣推導，不重講；劉老師的 Pn＝第四單元的 Pf。
- **老師課堂題**：使用者要求把老師簡報習題演練與講義例題原題「單獨抽出來、標記老師給的題、附詳解」→ `content/bank/physopt/teacher/` 6 個題本共 74 題，path「生理光學 → 老師課堂題（講義原題）」，題幹開頭【老師課堂題｜出處】，tag「老師課堂題」。不掛在任何單元的 banks。一般題本 u5-q、u6-q 不放老師原題。回家作業依使用者指示不做成題目。
- 第六單元投影片 43 的單狹縫條件與標準教科書不同，課程依標準寫法並標註；其他待確認事項記在 `資源/生理光學/01_需要確認與補充.md`。
- 這兩個單元直接寫在 `content/`，沒有 `_src/` 產生器。

## 科學計算機（2026-10-09）

- 頂部番茄鐘按鈕右邊的 🧮：`js/calc.js`（index.html 載入順序在 pomo.js 之後）、樣式在 `css/style.css` 最後一段。浮動視窗、不擋作答，可拖曳標題列、Esc 關閉；視窗內按鍵不會觸發作答快捷鍵。
- 支援 sin／cos／tan、倒數三角函數 csc／sec／cot、2nd 反三角（cot⁻¹ 值域 0～180°）、DEG／RAD、x²、xʸ、1/x、√、ln、log、n!、%、π、e、EXP、Ans、隱含乘法（2π、2sin(30)）與自動補右括號。自寫解析器，不用 eval。
- 角度模式下 90° 倍數是精確值（sin180°＝0、tan90°／csc0° 顯示「無定義」）；結果取 12 位有效數字。DEG/RAD 與最近 20 筆紀錄存在 localStorage `calc`（不進存檔）。
