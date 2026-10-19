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
## 學習模式戰鬥回饋（2026-10-09）

- 使用者要求「格式不變，但要有趣、回饋感好」。只改 `js/learn.js` 的學習戰鬥段落（課程流程、題目、進度保存都沒動），平靜模式照舊。
- 特效：`js/fx.js` 的 `stage()`／`ent()` 在沒有 `#stage` 時改找學習戰鬥條（`#lbStage`、`#lbHeroBody`、`#lbMonBody`、`#lbPet`），所以答對直接播放和遠征相同的職業招式（`FX.attack`／`FX.critical`），答錯播放怪物的 `m.fx` 攻擊（`FX.monStrike`）。勇者只建一次，出招動畫不會被重畫打斷。
- 連擊：第一次就答對 +1，傷害 ×(1＋0.15×(連擊−1))，最多 ×2.2；暴擊率隨連擊上升；音高隨連擊上升（`SFX.combo(n)`，在 `js/audio.js`）；每 4 連擊夥伴追擊 6、每 5 連擊 +⚡；答錯歸零並顯示「N 連擊中斷」。
- 必殺技：⚡ 不再自動消耗，集滿 3 點出現發光的「⚡ 必殺技」按鈕，由玩家決定何時放（各職業效果見 `ULT`）。必殺技與暴擊會打碎硬殼、打斷蓄力。
- 怪物特性與意圖（頭上顯示）：蓄力（每 2 題蓄力，蓄力時答錯扣 2❤、答對破防 ×1.5）、硬殼（普通攻擊 6 成傷害）、寶藏怪（12%，幾題後逃走，打倒得 3 魂晶）。精英必有蓄力或硬殼。
- 怪物提早被打倒而本段還有題目時出現增援（血量＝剩餘題數×10）；整段零失誤清場掉寶箱（點開 1～2 魂晶，換段自動收下）；超殺 +1 魂晶。魔王血量＝題數×12，半血後暴怒（之後每題都在蓄力）。
- 課末戰鬥評等 S／A／B／C（S：第一次答對 ≥90%、沒倒下、魔王討伐成功、最高連擊 ≥ min(5, 題數)；倒下最高 B），S +3、A +1 魂晶；最佳評等存在 `D.les[key].rank` 並顯示在課程列表。
- 舊的進行中存檔（`st.run.bt`）會用預設值補齊新欄位，可以直接接著玩。

## 生理光學國考題（期中考範圍）與題庫三分類（2026-10-09）

- 期中考範圍＝第一～五單元（**第六單元不考**，U6 單元與題本名稱已標「期中考不考」）。
- 來源：`E:\學習\驗光師國考題` 的驗光師《視覺光學》13 份＋驗光生《眼鏡光學概要》13 份（106～114 年，高考／普考為第二次專技考試，特考 109 年為第一次）。PDF 用 PyMuPDF 解析，答案取自每份 PDF 最後一頁的標準答案（含備註更正）；含 ①～⑨ 或圖的題目都對照過渲染圖，圖改寫成文字描述。
- 共 1,300 題中挑出 421 題，分 120 個題本：`content/bank/physopt/exam/physopt-exam-u<單元>-<年>-<vh|vt|sp|st>.json`，題號＝原卷題號，path「生理光學 → 國考題（期中考範圍） → 第N單元 → N 年」，題本名稱「【國考・第N單元】…」（樹狀檢視會去掉【】前綴）。每題詳解為自編，結尾附出處。
- 排除：散光／柱鏡、曲面鏡、眼模型／屈光不正／調節、像差、色散與阿貝數、反射率與鍍膜（第六單元）、偏光、放大鏡、眼鏡放大率、隱形眼鏡淚液鏡、鏡架與材料。Prentice 稜鏡效應、頂點距離換算歸在第四／五單元。
- 題庫三分類：模擬題（自編）／老師課堂題（講義原題）／國考題（期中考範圍）。舊的 physopt-u1～u3-q 原本混有 15 題老師原題（n = 1～5），已移除（其他題號不變），這些題都在老師課堂題題本裡。
- 有官方答案瑕疵的題目在詳解中註明（例：109 普考第 13 題像高應為 2.5 mm；112 普考第 6 題一律給分）。

## 題庫直接閱讀（2026-10-13，v74）

- `js/screens.js` 的 `bank()` 改為完整題目卡片：題幹、文字選項與完整圖片直接顯示；點題目／選項或按鈕在原卡片展開／收合詳解，每頁 30 題，分頁後保留展開狀態。
- `QV.previewHTML(q)` 在 `js/question.js`，共用原本的題幹／圖片／題組呈現，選項為靜態文字；閱覽不記作答。「練習此題」沿用 `QV.practiceModal`，關閉後重畫篩選結果以更新紀錄與數量。錯題本沿用 `qrow()`；樣式在 `css/style.css` 的 lists 段。
- Playwright CLI＋Edge 獨立 context 的 file:// 驗證通過：2,629 題預覽、46 項互動檢查及 390px 手機版，測試存檔已還原；摘要和截圖在 `output/playwright/`。只改介面時不用重建 `data/`。

## iPad 音訊播放修正（2026-10-13，v75）

- `js/audio.js` 的 `AUDIO_ENGINE` 共用一個 AudioContext，使用裝置預設 sampleRate、播放 session、手勢重試與中斷／停滯恢復；SFX 與 MIX 都從它取 context。iOS 的 BGM 重用單一媒體播放器，不調速補償音高；桌機 BGM 沿用兩個播放器淡入淡出。
- iOS http(s) 的 AMB 用按需解碼的短環境音 buffer，首尾預先交疊 2.4 秒，再由 AudioBufferSourceNode.loop 循環。不要用 JS 計時器反覆 play／seek 取代它，也不要把長 BGM 解碼成 AudioBuffer。解碼失敗降回單一媒體循環播放器；桌機 AMB 只有下一段 play 成功後才換 cur／淡出，靜音時取消過期計時器。
- Edge 真實 Web Audio 的 iPad／iPhone 路徑模擬各 19 項、桌機 8 項、解碼失敗 fallback 4 項通過。工具／重跑說明：`tools/audio-qa/`；摘要：`output/playwright/audio-qa.json`。Windows WebKit 沒有 AudioContext，**未做實機 iPad 音訊或音高驗證**；勿把路徑模擬說成已確認 iPadOS／Chrome 的實際輸出。網址版需部署才生效。

- 發布合併版本為 **v88**：以 `origin/main` 的 v87（`cafa319`）為基底，保留 HAPTIC、低頻打擊音效與新版學習返回／跳頁功能。合併後 iPad 音訊 19 項、題庫／原生觸覺開關 9 項及全 JS／內容驗證通過。相容性工具為 `tools/audio-qa/check-bank.cjs`，摘要為 `output/playwright/merge-qa.json`。

## 題目收藏與資料夾（2026-10-13，v89）

- `js/favorites.js`（Store 之後、question 之前載入）提供共用收藏按鈕、資料夾視窗與管理入口；`QV.metaHTML` 讓遠征／題庫練習／真實題庫的學習實戰可收藏，題庫卡片也有相同控制。資料夾名稱需轉義；一題可以放多個資料夾，未分類可直接收藏，刪除資料夾保留題目與其他分類。
- `Store.favorites` 存在 `SKEY('favorites')`，形狀 `{folders:[{id,name}],items:{qid:{folders:[folderId],at}}}`。收藏不改作答／錯題紀錄；保留尚未載入的導入題目 ID。`Store.filter` 支援 `favorites: all/saved/unfiled` 與 `favoriteFolder`，題庫篩選可和原科目／題本／狀態共同使用，出征沿用同一結果。
- 收藏加入 `exportAll/importAll/resetAll`，既有雲端／備份流程會一起攜帶；舊備份缺少 favorites 時保留本機收藏，含 favorites 的新版備份完整取代（含空收藏）。跨裝置請使用新版網站，沒有另改雲端 SQL 或同步衝突規則。
- 限時遠征的計時扣除 `FAV_UI.pausedTime()`；資料夾視窗接收焦點，避免 Enter 重複啟動底下按鈕，QV 原本的 modal 快捷鍵防護仍有效。所有按鈕事件相容上游 iOS `.hap-sw` 子 input，勿改成只認 e.target 等於 button。
- 測試：Edge iPad 路徑 39 項、桌機 38 項（含 390px）通過，全 JS 解析與 `build.py --check --strict` exit 0；原有符號覆蓋提醒仍在。工具／界限：`tools/favorites-qa/README.md`，摘要／截圖：`output/playwright/favorites-*`。測試 context 的 localStorage 已還原；此輪用 HTTP，沒有實機 iPad、file:// 或使用者帳號雲端往返測試。
## 生理光學公式統整（2026-10-13，v90）

- 六個 `content/learn/physopt/` 單元各有 `notes` → `formula-summary`，顯示在知識筆記該單元最上方，不用先完成課程。共 62 組公式（139 行公式），先列公式清單，可點選跳到講解；每組含生活畫面、符號、簡單數字分步練習、正式例子、記法、易錯處，進階推導另行收合。第六單元仍標期中考不考。
- `js/learn.js` 的 `formulaNote()` 和 notes() 渲染與搜尋（包含 warmup／derivation），不新增 lesson／step／複習卡，不改 earned-card gating；既有課程、pick.ids 與進度 ID 經比對 97 個單元完全相同。欄位規格見 `docs/格式_學習模式.md` §3-A，生成的 data/learn.js 勿手改；notes 不視為 teaches 覆蓋。
- `tools/build.py` 檢查 notes 格式與 ID，`js/importer.js` 保留完整筆記；舊導入單元沒 notes 時保留內建新筆記，明確 notes: [] 可清空。修正原掃描把學習單元的 banks（題本 ID）誤認為 bundle 的情況；仍使用原導入、備份與雲端進度流程。
- 內容沿用課程左負右正、Pe/Pv/Pf/Pn 與向量 [q,h]，另對照 OpenStax／KrakenOS。特別釐清臨界角邊界、約化距離 d/n 與光程 nd、像面 C=0 與無焦 B=0、單縫整數暗紋、膜反射相位與振幅匹配；沒有更動原課程字句。核對來源在各統整底部。
- QA：58 項數值驗算、Edge iPad 路徑 40 項、桌機 40 項通過（含 390px）；嚴格建置 exit 0，原有符號覆蓋提醒仍在。工具 `tools/formulas-qa/`，摘要與截圖 `output/playwright/formulas-*`。獨立 context 已還原 localStorage 並移除導入 fixture；此輪使用 HTTP，沒有實機 iPad／file://／真實國中生閱讀理解測試。
## 生理光學考前必看（2026-10-13，v91）

- 六個生理光學單元新增 `notes` → `exam-cram`，知識筆記固定排在公式統整前，共 22 個重點；每項簡列公式、用途、易錯提醒。閱讀不須先上課，不改原有課程、複習與進度。完整 62 組公式統整仍保留。
- 第一～五單元依已收錄 421 題的考點標籤篩選；第六單元另核對 106～114 年《視覺光學》《眼鏡光學概要》26 份原卷（1,300 題）的題幹，以反射率／抗反射膜為重點。相關題包含觀念題，不是該算式的直接命題次數；樣本止於 114 年，勿改寫成最新考題排名或必考。單狹縫／相位保留在完整統整，第六單元仍標期中考不考。
- 內容正本仍在 `content/learn/physopt/`，勿手改 `data/learn.js`。`js/learn.js` 支援兩類筆記的排序、展開與搜尋；build／importer 檢查新欄位。非空舊匯入 notes 補上缺少的內建筆記 id，同 id 自訂内容保留，明確 notes: [] 可清空。格式見 `docs/格式_學習模式.md` §3-A。
- QA：六單元 22 項來源統計核對、97 個原單元與原公式筆記完整性、原 58 項數值驗算、Edge iPad 路徑 26 項與桌機 26 項（含 390px）通過。工具 `tools/exam-cram-qa/`，摘要／證據／截圖 `output/playwright/exam-cram-*`。一次性 context 還原 localStorage、移除匯入 fixture；本次使用 HTTP，沒有實機 iPad／file://／真實考生閱讀測試。快取版本 v91。

## 知識筆記相關題懸浮視窗（2026-10-13，v92）

- 使用者指定學習模式的知識筆記，且第六單元先不做。第一～第五單元「考前必看」20 組公式新增預設收合的相關題連結，共 378 次連結（343 題不重複題目），使用既有 evidence.questionIds 與 Store.Q；第六單元不新增連結，不改題庫或生成資料。
- `js/learn.js` 的 `.cram-related` 是獨立 details，展開才載入列表，不跟筆記全部展開／搜尋自動展開，重載回到收合。點連結呼叫 `QV.previewModal`（js/question.js），完整顯示題幹、文字選項、圖片／題組與答案詳解，不呼叫 render 或 Store.record。Esc／關閉回到連結，Tab 留在視窗內，事件相容 iOS hap-sw 子 input。
- QA：Edge iPad 路徑 73 項、桌機 93 項（含 390px）、全部 JS 語法與嚴格內容檢查通過；全部來源連結有效，逐組實測開關與詳解，閱讀不改作答／錯題／學習紀錄／獎勵。一次性 context 備份還原 localStorage；HTTP 測試，未做實機 iPad 或本輪 file:// 測試。工具與重跑方式：tools/exam-related-qa/；摘要與截圖：output/playwright/exam-related-*。

## 平板知識筆記題目視窗捲動修正（2026-10-13，v93）

- 依使用者 iPad 截圖修正相關題閱讀視窗；同題 physopt-exam-u5-107-sp-49 在舊版外層捲動後標題 top −65px、關閉鍵 −73px，可重現標題被裁掉。QV.previewModal 改用 U.modal 的 contained 選項，只讓內容區捲動、標題與關閉鍵固定，VisualViewport 同步可見高度／偏移，背景固定並保存原捲動位置。
- 關閉還原 body／html 原 inline styles 與清單位置；巢狀鎖定計數、重複關閉保護、observer 外部移除清理。App.go 用 U.clearModals 清掉閱讀視窗後再切頁，避免離開後頁面仍鎖定。一般視窗維持原佈局，題庫和第六單元內容未改；index.html 所有快取版本 v93。
- QA：Edge iPad 路徑與桌機各 25 項（同題長詳解、橫直轉向、390px、可見視窗收縮／偏移 fixture、關閉／Esc／巢狀／切頁／外部移除）、原相關題 iPad 路徑 73 項回歸通過；全 JS 語法與嚴格建置檢查通過。獨立 context 還原 localStorage，HTTP 模擬，未做實機 iPadOS／Safari 或本輪 file:// 驗證。工具 tools/modal-viewport-qa/，結果與截圖 output/playwright/modal-viewport-*。

## 公式統整相關題（2026-10-13，v94）

- 使用者指定「學習模式 → 知識筆記 → 公式統整」，先做第一～五單元。50 組公式新增 relatedQuestions，632 次連結、495 題不重複題目，其中 67 題為老師講義原題；31 組公式有老師講義題。排序以老師講義優先，再國考、單元練習，列表標明來源。第六單元完整內容與相關題狀態未改。
- js/learn.js 共用 note-related 收合／延後建立列表，保留考前必看的 cram-related 與新增 formula-related，各自預設收合，不隨全部展開。沿用 v93 的固定標題與關閉鍵閱讀視窗。原公式講解與課程流程不變，內容正本在五個 content/learn/physopt JSON，data/learn.js 由 build 生成。
- 依現有題目逐組核對，規則在 tools/formula-related-qa/link.py；沒有老師原題可配的公式用單元練習。第一單元週期搭配頻率換算作延伸，relatedHint 明確說明題目本身沒有問週期。build 檢查 relatedQuestions 的不重複／存在性，importer 保留連結，舊筆記缺少欄位依相同公式 id 補入內建連結，明確 [] 可清空。
- QA：97 個單元（排除新增連結欄位）與原公式講解／進度 id 不變，整個第六單元與題庫完整性一致；原 58 項數值驗算、Edge iPad 路徑 192 項與桌機 192 項、全 JS 語法與嚴格建置檢查通過。獨立 context 還原 localStorage、移除匯入 fixture；HTTP／Edge 模擬，沒有實機 iPadOS 或本輪 file://／雲端往返驗證。工具 tools/formula-related-qa/，報告／截圖 output/playwright/formula-related-*。

## 視光學二易讀版（2026-10-18，v117）

- 範圍限MSR／視野／雙眼平衡共27課，已依使用者認可的JCC第四版逐課改寫。先具體畫面→命名→原因／操作→數字；短表格、固定配色、一頁一個重點；概念可連續多頁，不強制每卡接題。勿用舊的每卡exam＋demo規則回退版型。
- 接手先讀 `SESSION_NOTE_OPTOMETRY.md`、`docs/視光學_易讀版改寫方法.md`、`tools/learn-redo/optometry-progress.json`；歷史試作在 `docs/視光學_易讀版試作.md`。本次27課均完成並驗證，不再等待試作核准。
- 正本仍為content的三個optom2-u2/u3/u4 JSON；逐課手寫腳本在tools/learn-redo的msr_l*（l4另用optom2_jcc_l4.py）、vf_l*、bb_l*，基準22cfdff。重跑指定課後需跑optometry_corrections.py，防止已修正的0 dB、微視野學習效應等舊文字回流，再build。
- 原課ID、97題檢核題幹、172張卡片正面與原範例／實戰／出處保留；必要的題解、卡背和1個多選選項更正有逐欄紀錄，答案仍ACD。MD／PD、±0.37取位、紅綠版本限制等區分見方法文件。原講義20/200散光<4.00的疑點保留待確認。
- 表格CSS僅套三單元；js/learn.js播放器外框用data-pack／data-lesson定位，快取v117。data由build產生，不手改。進行中的舊頁序可能變，建議回課頭重讀；未清除存檔。
- 正式QA：27課來源／出處／進度鍵核對；Edge file:// 1000／390px實際逐頁1260次、194判分、66例題展開、44圖、6抽題／6導航，0問題；JCC另有62渲染與互動狀態驗算。測試context備份還原localStorage，非實機iPad或醫學審稿。可攜JSON報告在docs/optometry-readability/。
- 舊sweep.cjs只改localStorage而未reload，不能用舊計數當逐頁證據；本次已加reload＋頁碼核對。新readability.cjs每課reload後實際按跳頁色條，驗證每頁類型、頁碼和判分。原optom2-qa/check.cjs的每卡exam＋demo約束已過時。

## 視光學大一下：九堂總複習（2026-10-18，v124）

- 本次只改114大一下第01～09單元各一堂最後的「國考重點複習」，共9課，均已改寫與驗證；其他正課、99名詞和已完成的大二上27課不動。沿用JCC認可版的具體對象→名詞→原因／操作→數字，短表格、固定配色、自由概念頁節奏。
- 接手讀`SESSION_NOTE_OPTOMETRY_S114_REVIEW.md`、`docs/視光學大一下_總複習改寫.md`、`tools/learn-redo/s114-review-progress.json`。逐課腳本`s114_review_01.py`～`09.py`的基準為a72883c；重跑後先執行`s114_review_corrections.py`，再build和QA，避免13處舊文錯誤回流。
- 保留原32檢核題幹、33記憶卡正面與考題來源；其他正課逐欄比對不變。更正logMAR計分條件、遠點符號／AA、NPC非單項確診與角膜假設指數等，逐欄前後文在`s114-review-corrections.json`。總演練限本單元國考題本。
- 表格CSS只擴至上述九堂複習，快取v124，未改播放器JS或存檔格式；舊進行中頁序可能不同，可回課頭重讀。
- 驗證：18項數值；Edge file:// 1000／390px實際逐頁470次、64判分、36範例展開、6互動狀態、18抽題池／18導航，0問題；strict build通過。一次性context備份還原localStorage；非實機iPad、真人理解測試或完整專業審稿。可攜報告在`docs/s114-review-readability/`。

## 學習戰鬥畫面捲動縮小（2026-10-18，v125）

- `js/learn.js`的`pinBattle()`讓課程戰鬥條捲動後縮小固定於topbar下方；同一角色Canvas與場景繼續出招，不複製或重建動畫。回頂恢復原尺寸，平靜模式連佔位一起收起。
- `.lp-battle-pin`使用sticky，`lpBattleSpacer`補縮小差額，避免教材跳動；rAF節流、ResizeObserver追蹤工具列高度，離課／切頁清理監聽。桌機212→136px、手機168→114px；只改學習播放器，正式遠征不動。
- Edge file://桌機／390px共30項通過，含2次真實答題觸發攻擊、捲動前後教材位移0、旋轉寬度、平靜切換、離課重進與同Canvas保存。工具`tools/learn-battle-pin-qa/check.cjs`，報告`docs/learn-battle-pin/qa.json`；一次性context備份還原localStorage，未做實機iPad測試。

## 視光學大一下59堂正課易讀版（2026-10-18，v126）

- 範圍：01～09的41主要教學＋18串連／整合驗收，共59課。逐課補138頁手寫白話橋梁，先具體對象→命名→原因／操作→數字，短表格與金色重點，再分頁閱讀原完整正文、考點和示範；不新增一堆檢核。
- 保留原167檢核題幹、250記憶卡及進度ID，其他正課欄位、九堂總複習、99名詞與其他科目不動。106處必要更正有before／after／path，PH、COLC、AA、MRP、工作鏡與瞳孔機制等同步改正文、題解與卡背，勿把舊錯誤加回。
- 接手先讀SESSION_NOTE_OPTOMETRY_S114_COURSES.md、docs/視光學大一下_正課易讀版.md及tools/learn-redo/s114-course-progress.json。腳本s114_course_01.py～09.py與s114_course_integrations.py，基準a183a46；重跑後須再跑s114_course_corrections.py、build與QA，不重跑舊匯入器。每課更新Session Note；未驗證不能標完成。
- CSS僅擴到大一下01～09；概念可連續多頁，pace free。散光首課加已驗證的光斑互動，其餘4個原互動保留。v125學習戰鬥固定縮小功能保留；舊進行中頁序可能變，可回課頭重讀，未清除存檔。
- QA：嚴格建置、17數值、原正文／考點／題／卡／編譯ID與其他pack比對通過；Edge file:// 1000／390px實際2276頁、288單選判分、46自評流程、118範例／118實戰／118導航、28互動狀態，0問題。戰鬥固定縮小30項回歸通過。報告docs/s114-course-readability/；獨立context備份還原localStorage，未做實機iPad、真人理解測試或完整專業審稿。

## 星號收藏與知識比較（2026-10-19，v127）

- 學習圖解的每個名稱、知識筆記中已讀圖解的每個名稱都可個別加星號；以單元／課／原圖／名稱識別，保留原圖、來源及該點編號，沿用使用者調整過的 pins。原始內容與點位不改。
- 學習檢核、自編練習、魔王題與複習題在答案揭曉後可「加入知識比較」；題庫實戰也支援，保留題圖、選項、正解與詳解。自評題揭曉後即可加星號，無須先自評。
- 學習模式 → 知識筆記 →「★ 星號收藏・知識比較」可依科目、單元、名稱／答案與搜尋篩選。桌機雙欄、手機單欄，每頁20筆。收藏立即可查，不受課程完成門檻限制；一般概念卡收錄規則照舊。
- `js/learn.js` 的 `D.starred` 儲存內容參照與時間，隨既有 `Store.exportAll/importAll` 的 learn 欄位保存；不與普通題庫的 `Store.favorites` 混用，不改作答、獎勵或複習排程。缺少導入來源時暫不顯示，但保留參照。`js/question.js` 新增可選 onReveal 回呼供學習自評題使用。
- Edge file:// 桌機1100px／手機390px共64項通過，含保存／備份往返、原圖與調整點位、篩選／搜尋、分頁、鍵盤及零頁面錯誤；獨立context的localStorage已還原。JS語法、git diff --check及 `python tools/build.py --check --strict` 通過；既有5個縮寫覆蓋提醒保留。未做實機iPad或真實雲端往返。
- QA與重跑方式：`tools/knowledge-qa/README.md`；結果／截圖：`output/playwright/knowledge-stars-*`。
## AI 助教當頁圖文＋睫狀動脈別名（2026-10-19，v128）

- `LEARN_UI.pageCtx()` 附當頁可見文字與圖片描述；課程與知識筆記的一般提問自動帶入，不必只按一鍵講解。`js/ai.js` 在瀏覽器把圖轉成像素（JPEG，最大2048px）並疊上畫面中的編號位置；每次至多8張，失敗明說，不靜默漏圖。互動iframe沒有即時截圖。
- 本機file://受畫布限制時，從`CLOUD_CFG.assets`的已發布網站取同路徑圖片，HTTP(S)仍用當前網站圖片；未發布的本機導入圖可能無法讀取。圖片只存在請求內，對話記憶不累存base64；文字歷史過長時先移除最舊的完整問答。
- 後端`supabase/functions/ai-chat/index.ts`接受驗證過的JPEG/PNG/WebP data URL與文字，分開限制圖／文字大小。含圖只走明確支援視覺的Google Gemini與OpenRouter Gemma 4免費模型；禁止靜默丟圖轉純文字，全部失敗不扣次數。原文字鏈、登入與用量檢查保留。
- Supabase `ai-chat`已部署version 3（ACTIVE，沿用原verify_jwt=false及函式內登入檢查）；正式端點OPTIONS 204、未登入POST 401。沒有以真實學生帳號驗證模型辨圖品質。
- 名稱判分補「短後睫狀動脈／後短睫狀動脈／睫狀後短動脈」與長血管對應三種寫法；課內name.zh、跑台accept、字源match及專案外`E:\NEWTEST\eye_work\atlas\names.py`同步。維持中英文都要正確，不做任意字序模糊比對。正本content已build，題號／主要答案／英文不變。
- 後端21項、瀏覽器40項（桌機／手機HTTP＋桌機file://）、別名18項及原星號72項回歸通過；fixture沒有真實模型醫學品質或實機iPad驗證。工具與界限：`tools/ai-vision-qa/README.md`，結果／截圖：`output/playwright/ai-vision-*`與`ciliary-alias-*`。
- 星號依使用者追加要求改為：清單不放收藏按鈕，點名稱／編號打開說明後才出現小☆；點字源名詞視窗也有小星星（js/glossary.js），優先收藏目前圖解的該點，保留對應原圖。收藏區以小★取消收藏。
