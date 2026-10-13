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

## 雲端同步（信箱登入，2026-10-09）

- `js/cloud.js`＋`js/cloud-config.js`（index.html 在 peglin.js 之後、main.js 之前載入）。後端是使用者自己的 Supabase 專案，直接 fetch REST（不用 SDK，file:// 可用）；設定步驟與建表 SQL 在 `docs/雲端同步設定.md`。沒有設定或沒登入時不影響任何功能。
- 登入：信箱 6 位數驗證碼（`/auth/v1/otp` → `/auth/v1/verify`），信件範本要含 `{{ .Token }}`。URL／anon key 寫進 `cloud-config.js` 或在設定頁貼上（存在 `qg_cloudcfg`）；不可放 service_role／secret key。
- 同步內容＝`Store.exportAll()`，資料表 `saves`（主鍵 user_id＋project＝QB.meta.id），RLS 只允許本人。每次寫入 `rev`+1，PATCH 帶 `rev=eq.<上次看到的>` 做樂觀鎖。導入素材（IndexedDB）、音量、計算機不同步。
- 時機：開遊戲自動下載較新進度；每 30 秒偵測本機改動就上傳；切到別的分頁時上傳；離開超過 1 分鐘再回來會檢查雲端，未改動時詢問是否載入。兩邊都改過→以較晚修改的為準，另一份存本機 `SKEY('cloud-bak')`（最多 3 份，可還原）；第一次在已有進度的裝置登入時讓使用者選。
- 頂部 ☁ 按鈕（計算機右邊）顯示狀態並開啟面板；設定頁也有同一個面板。同步中繼資料在 `SKEY('cloud')`，不進匯出檔。
- 已用本機模擬 Supabase＋兩個獨立 headless Edge context 測過：首次上傳、新裝置載入、切回分頁詢問載入、離線衝突（雲端較新／本機較新）、重開自動載入、token 過期自動 refresh、登出、390px 手機版。尚未接真的 Supabase 專案實測。

## 世界觀、遺物故事、怪物擴充、寶箱改版（2026-10-09）

- 世界觀只在遊戲中暗示、不明說；設定與撰寫規則在 `docs/世界觀.md`（白塔、燈守、第七屆大考、那一晚的黑潮、最後一題、空白）。新增遺物／怪物／首領時要附 1～2 句介紹並遵守該文件的規則。
- `js/world.js`（index.html 在 monsters.js 之後、hero-atlas/store 之前）：新怪物 30 種（25 張手繪 12×12 像素圖，半邊鏡射）→ 共 101 種（含黃金史萊姆）；新遺物 27 件（23 一般＋4 首領）→ 共 63 件；`RELIC_LORE`／`MON_LORE`／`BOSS_LORE` 給每件遺物 `story`、每隻怪物 `lore`、每位首領 `lore`。圖鑑、遺物圖鑑、抉擇卡、首領寶藏、寶箱卡片都會顯示（`.relic-story`、`.mon-lore`）。
- 新遺物效果寫在 `js/run.js`（搜尋遺物 id）與 `js/battle.js`（毯子＝篝火、答案卷＝刪選項）。新遺物帶 `since: 2`；`store.js` 的 `migrateRelics` 會把免費的新遺物補進舊存檔（含匯入／雲端下載）的已解鎖清單，判斷依據是「原始存檔」沒有 `relicsVer`。
- 寶箱節點：打開後從已解鎖、未擁有的遺物中 3 選 1（鏽蝕的鑰匙 4 選 1），可以都不拿；遺物拿光時改給道具。狀態存在 `s.treasureOpts`（中途離開可續）。事件「上鎖的寶箱」也改成給遺物。
- 營地：`.camp-hero, .camp-pet { z-index: 3 }`，人物與寵物在信箱、花盆前面。

## 計算紙與多功能選單（2026-10-09）

- `js/pad.js`：計算紙浮動視窗。筆（滑鼠／手指／觸控筆，觸控筆依壓力改變粗細）、橡皮擦、Aa 打字（點紙上任一處輸入，點別處或換工具寫上去）、4 色、3 種粗細、復原（Ctrl+Z）、清空、可拖曳與調整大小。防手掌誤觸（✋，預設開）：用過觸控筆後手指不畫線。筆跡以向量存 localStorage `SKEY('pad')`，不進存檔、不同步。視窗內按鍵不觸發作答快捷鍵；Esc 關閉。
- `js/toolmenu.js`：頂部 ☰「多功能」按鈕，把 ☁ 雲端同步、🧮 計算機、📝 計算紙、♪ 音樂與音量收進選單（原按鈕節點直接搬進去，ID 不變）。番茄鐘按鈕仍在頂部。☰ 右邊的 🔊／🔇（#muteBtn）一鍵切換 `VOL.muted`（背景音樂、音效、環境音全部），與音量面板的「全部靜音」同步。選單本身掛在 sticky 的 `#topbar` 裡（`position:absolute; top:100%`，`place()` 只算相對頂部列右緣的距離），捲動或 iPhone 網址列收合時不會跑掉；電腦版從選單開啟的面板仍用 `anchor()` 對齊 ☰ 下方（手機版不套用）。載入順序：cloud.js → pad.js → toolmenu.js → main.js。
- 驗證（獨立 headless Edge）：內容完整性（每隻怪物／首領有介紹、每件遺物有故事、像素圖 12×12、特性與攻擊演出都存在）、舊存檔移轉、帶 19 件新遺物模擬 40 題、寶箱 3 選 1、選單、計算紙（滑鼠＋觸控筆壓力＋手指防誤觸、打字、復原）、手機營地圖層，皆通過且無頁面錯誤。

## 老師隨堂考：眼部血液供應（2026-10-11）

- `content/bank/eye_ans/quiz/eye-quiz-blood-supply.json`：29 題，path「115 大二上 → 老師隨堂考」，題幹開頭【老師隨堂考｜出處】，tag「老師隨堂考」，不掛在任何單元的 banks。來源是使用者拍的隨堂考卷照片（重複題只收一次）。
- 24 題已對照 `E:\學習\驗光師國考題` 原卷（PyMuPDF 解析）取得原文與官方答案；5 題（脈絡膜、前缺血性視神經病變、角膜緣、視神經、眼皮血管）本機國考卷沒有，依照片轉錄，出處標「隨堂考卷標註」。國考原題保留原選項順序，不重排答案字母；詳解為自編。

## 生理光學「慢慢學版」改寫（2026-10-11）

- 使用者覺得生理光學學習模式太難懂，要求「用更好懂的方法慢慢教、從第五單元往回做」，改好自己推上去。
- 做法：每課只講一件事（大單元拆成更多小課），每張卡「先一句話／生活比喻 → 再一步一步算 → 最後點出易錯」；檢核題先從判斷正負、看懂意思的簡單題開始，再算數字；範例每一步只做一件事。題庫題目一律不動（深度不降），teaches／practice 重新分配，`--coverage` 無新警告、37 題全部抽得到。
- 舊課 id（l1…l7）保留給同主題的第一課，新拆出的課用 l1m、l2b、l3b… 之類的新 id；原有檢核題文字盡量不改，複習盒紀錄可沿用。
- 第五單元：7 課 → 14 課，新增 4 個互動（光線兩個數字、矩陣乘法慢動作、找孔徑光闌、稜鏡偏向），原望遠鏡互動保留。
- 第四單元：7 課 → 14 課（l1b、l2b…l7b 為新拆出的課），新增 3 個互動（逐面追跡一步一步、高斯成像作圖、頂點距離換算），原「三個力量」互動用在 Pv／Pf 與主平面兩課。
- 第三單元：6 課 → 12 課，新增「波前聚散度加法」互動（看見透鏡怎麼改變波前彎曲），原光學桌互動保留。
- 第二單元：5 課 → 11 課，新增「小角度近似」與「簡化眼眼軸長」兩個互動；同時補上教材缺的 sag、n₁θ₂ 寫法說明，原本的符號覆蓋警告消失。
- 第一單元：4 課 → 8 課，新增「波前與光線」互動（點光源／會聚／平行，看光線垂直波前、箭頭決定會聚發散）。
- 五個單元合計 59 課、14 個新互動；用自動作答把 59 課從頭走到尾（含題庫題、圖解測驗、課末魔王）都沒有錯誤。過程中修了 `js/learn.js` 兩個原本就有的小競態：精英怪台詞延遲 0.3 秒時怪物已被打倒會讀到 null；排序題 150 ms 評分延遲內按「重排」會重複評分。產生腳本不在 repo 裡；之後直接改 `content/learn/physopt/*.json`。

## AI 助教（2026-10-12）

- `js/ai.js`：浮動聊天視窗（營地「AI 助教」、☰ 選單、題目詳解的「💬 問 AI」→ `data-askai`）。本機 BM25（中文雙字詞）從題庫＋學習卡找參考資料，回答附 [n] 出處（點了開題目或課程）；🔎 查證查維基百科（中／英，先找同名條目）與 PubMed，可再請 AI 對照。對話只存在記憶體。載入順序：pad.js → ai.js → toolmenu.js。
- 後端：`supabase/ai-setup.sql`（`ai_limits` 個別設定（預設空＝登入就能用、不限次數；可對信箱設 daily_limit 或 blocked）、`ai_usage` 每日用量、`ai_status`／`ai_take`，RLS 無 policy）＋ `supabase/functions/ai-chat/index.ts`（Edge Function，只用 fetch；依序 Google → Groq → OpenRouter → NVIDIA，成功才扣次數）。設定與管理：`docs/AI助教設定.md`。
- **金鑰只能放 Supabase Secrets**（GEMINI／GROQ／OPENROUTER／NVIDIA_API_KEY），絕對不要寫進 repo 或網頁；模型清單在函式的 `CHAIN`。OpenAI 金鑰沒有額度，未使用。
- 學習模式：課程裡打開 AI 視窗會出現「✨ 把這頁講得更好懂」（使用者要求只做這一顆按鈕）。內容來自 `js/learn.js` 的 `LEARN_UI.pageCtx()`（目前這一步的文字、檢核題含答案、題目頁再附前面最近的概念卡；圖片與互動動畫只附文字），換頁或作答時發 `learnpage` 事件更新按鈕。還沒作答的題目會標「學生還沒作答」，系統提示要求 AI 不直接給答案。追問時歷史訊息帶著那一頁的內容。
- 已測：函式（Node 載入＋真實 AI 服務、模擬資料庫）的未登入／停用／個別上限／不限次數／備援／全部失敗不扣次數；SQL（PGlite）的權限與重複執行；網頁端（模擬 Supabase）登入、附題提問、追問、查證、對照、手機版。尚未在真的 Supabase 專案部署測試。

## 計算紙手寫手感與小工具視窗縮放（2026-10-12）

- `js/pad.js`：書寫時只補畫新線段（requestAnimationFrame），不再每次整張重畫；畫布用 `desynchronized` 低延遲模式；觸控筆壓力做平滑。整個計算紙禁止選取文字（CSS user-select＋攔 selectstart／dblclick／contextmenu），快速連寫不會反白；觸控筆橡皮擦端（button 5）直接擦除。逐段畫與整張重畫的結果已逐像素比對一致。寫字時（落筆到收筆後 0.7 秒）`<html>` 加 `pad-ink`：整頁禁止選取並清掉既有反白，canvas 的 touchstart 對觸控筆 preventDefault（iPad Safari 的雙擊選字、長按由 touch 事件觸發，否則會反白紙外的「繼續」按鈕）。
- `U.grip(panel, {key, minW, minH, apply, reset})`（`js/util.js`）：計算機、計算紙、AI 助教右下角的調整大小把手；放大碰到螢幕邊緣時視窗會往左上挪；大小記在 localStorage `winsize`（不進存檔），雙擊把手恢復；手機寬度不顯示。計算機用 CSS 變數 `--k` 等比例縮放（按鍵、字一起變）。

## 檢核題不可寫「承上題」（2026-10-12）

- 學習模式的檢核題會被複習盒、課末魔王單獨抽出來，題目必須自己看得懂：用到的數據寫進題目，不要寫「承上例／上題」。已改 `physopt-u4` l6b（頂點物距成像）與 `physopt-u2` l4b 實戰（角膜面 f₂）兩題，答案與選項不變。
- `tools/build.py` 對 q 含「承上／上題／上例／前例／前一題」的檢核題發警告（`--strict` 失敗）。`js/learn.js` 的 `ctxDep`：這類題目與「完成剛才的任務後…」（114 大一下互動後的自評題）只在課程原位置出現，不進複習盒、不給課末魔王抽。題庫的承上題原本就不進學習模式（`followUp`）。

## 行內矩陣顯示（2026-10-13）

- `U.md` 的 `inline()` 會把 `[a b ; c d]`（列用分號，元素用空白或逗號，2～4 欄、各列欄數相同）畫成方括號矩陣（`.mtx`，CSS grid）。程式碼區塊內不轉換，`[1]` 這類引用不受影響。教材與題目照舊用這個寫法即可。

## 手機直式調整視窗大小、戰鬥震動（2026-10-13）

- `U.grip` 的 `mobileH`：手機直式（寬 ≤ 640）時計算紙、AI 助教是滿版寬，把手只調高度（CSS 變數 `--mh`）；AI 助教貼底，把手在上緣中間、往上拉變高。計算機在手機上也能等比例縮放。手機與電腦的大小分開記（`winsize` 的 key 與 key_m），轉向時自動換用。
- `HAPTIC`（`js/audio.js`）：`SFX.play` 的戰鬥音效對應不同震動（hit 輕、fire、crit、hurt、kill、boss 最重），`FX` 的 shake／shake(true) 與職業爆擊另有更強的節奏。Android 用 `navigator.vibrate`（長短＝強弱）；iOS Safari 沒有 vibrate，用 iOS 18 的 `<input type=checkbox switch>` 觸覺，一段一下、強的多下（無法調強弱、iOS 18 以前不會震）。音量面板「戰鬥震動」開關，存 localStorage `haptic`。學習模式戰鬥在作答當下（點擊同一刻）由 `onRightHit`／`onWrongHit`／`ult` 直接呼叫 `HAPTIC.buzz`：普通 < 連擊 < 破防／打倒 < 暴擊 < 必殺技；被打：格擋最輕、蓄力一擊與倒下最重（iOS 觸覺必須在點擊當下觸發）。`buzz` 不讓較弱的震動打斷還在播的較強震動。音量面板有「測試震動」按鈕，並依 UA 判斷 iOS 版本（iPhone 上的 Chrome 也是 WebKit、同樣沒有 vibrate）顯示提示；iPad 沒有震動馬達。

## iPhone 觸覺改用透明原生開關（2026-10-13）

- 使用者 iPhone（iOS 27）實測：程式切換開關（`HAPTIC.buzz` 的 label.click 方式）不會震，手指直接撥 `<input type=checkbox switch>` 會震。所以在 iOS 上 `HAPTIC.armTap` 用 MutationObserver 把透明原生開關（`.hap-sw`，opacity .011、蓋滿按鈕）放進**所有 `<button>`**（含計算機、計算紙、選單；按鈕文字被換掉時 observer 會補回；靜態定位的按鈕才改成 relative；點完開關會 blur）。因為按鈕裡多了 input，判斷「點的是不是這顆按鈕」要用 `btn.contains(e.target)` 而不是 `e.target === btn`（toolmenu 已改）。Android 則是任何按鈕點擊輕震 8ms；click 冒泡到按鈕，作答照常。iOS 只能在點擊當下震一下、無法依招式分強弱；Android 仍用 `navigator.vibrate` 分強弱。關閉戰鬥震動時 `<html>.hap-off` 隱藏開關。
- 多功能選單：手機（≤ 640）貼齊畫面右邊（right 8px），電腦對齊 ☰ 右緣。
- 作答衝擊 `FX.impact(kind)`（`js/fx.js`；kind：hit／combo／kill／crit／ult／hurt／heavy）：iPhone 只能在點擊當下震一下，所以把打擊感集中在作答瞬間——場景定格（`.impact-stop`，暫停場景內非 `.fx` 動畫）、閃光、晃動、低頻音效（`SFX` 新增 thump／boom／oof，hit、crit 也加了低頻層）、較重的衝擊在整個畫面邊緣閃光暈（`.impact-vig`，戰鬥條被捲出畫面時也看得到）。學習模式在 `onRightHit`／`onWrongHit`／`ult`、遠征在 `battle.js` 的 `onAnswer`（`R.resolve` 之後、播放招式之前）呼叫；招式動畫照舊隨後播放。
- AI 助教視窗：拖曳標題列可自由移動（手機也可以）。手機拖過之後加 `.free`，不再貼底（寬 100vw−16px、高沿用 `--mh`），雙擊標題列回到原位。

## 學習模式回上一頁／跳頁（2026-10-13）

- 課程播放器底部「◀ 上一頁」，上方色條（`#lpPips`）看過的格子可以點、直接跳頁（只能跳到做過的最遠一步 `R.far` 以內）。回到看過的頁面是「回顧」（顯示「🔁 回顧中・作答不計分」）：可以重看、重答，但不 tally、不打怪、不進複習盒、不換戰鬥段落，「繼續」隨時可按。回到最遠那一步時，實戰會接著原本做到的那一題（`R.farSub`）。課末魔王開始後不能回頁。

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
