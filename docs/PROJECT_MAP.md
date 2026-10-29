# 專案導覽（接手索引）

本頁行號為約略位置；變更前用 `rg -n '函式名' js` 確認。先讀根目錄 README.md 與 CLAUDE.md 對應交接；純 HTML/JS，須維持 file:// 可用。

## 一頁架構

`index.html` 載入 `data/bank.js、learn.js、prompts.js`，接著依序載入 util、sprites/pets/audio、content/content2/monsters/world、hero-atlas/heroes、store/favorites/secrets、question/run/fx/battle/screens、camp/pomo/calc/learn/glossary/importer/prompts_ui/peglin/cloud-config/cloud/pad/ai/toolmenu/main。完整順序以 index.html 第 31–65 行為準；相依物件不可任意調換。題庫與教材正本在 `content/`，`tools/build.py` 驗證並生成 `data/*.js`；本任務等並行內容工作應只跑 `--check`。

| 全域物件 | 位置與用途 |
|---|---|
| QB | data/bank.js、data/learn.js：產生的題庫、教材、題型資料 |
| C | js/content.js、content2.js、monsters.js、world.js：職業、怪物、遺物、地圖等靜態定義 |
| Store | js/store.js:2：索引、篩選、作答紀錄、存檔與備份 |
| App | js/main.js:2：畫面路由、頂欄 |
| Screens | js/screens.js:1：營地、出征設定、題庫等畫面 |
| Run / RunUI | js/run.js:3、js/battle.js:2：遠征狀態規則與畫面 |
| LEARN_UI | js/learn.js:2：學習模式、知識筆記、圖解與星號 |
| QV | js/question.js:2：題目呈現、判分與閱讀視窗 |
| FX / SFX / HAPTIC | js/fx.js:2、js/audio.js:222、21：動畫、音效、觸覺 |
| U / SP | js/util.js:1、js/sprites.js:1：共用 DOM、modal、文字與素材 |
| CLOUD / Peglin | js/cloud.js、js/peglin.js：同步與彈珠整合；實際公開物件以檔案為準 |

## 我要改什麼

| 需求 | 先讀檔案／函式（約略行號） |
|---|---|
| 出征篩選視窗 | js/screens.js:542 `free`、:977 `abyss` |
| 深淵抽題範圍 | js/run.js:137 `pool`、:146 `drawQuestion`；js/store.js:160 `filter` |
| 遠征出題順序 | js/screens.js:111 `prefOrder`、:134 `buildQueue`；js/run.js:146 `drawQuestion` |
| 題組連續出題 | js/run.js:146 `drawQuestion`、js/screens.js:134 `buildQueue` |
| 遠征範圍統計 | js/screens.js:200 `scopeStats`、`scopeLine` |
| 深淵範圍進度 | js/battle.js `battle`、`updateAbyssProgress`、`onAnswer`；js/run.js `pool` |
| 遠征戰鬥畫面 | js/battle.js:199 `battle`、`updateHud`、`renderQuestion` |
| 答題戰鬥結算 | js/run.js:435 `resolve`；js/battle.js `onAnswer` |
| 深淵路線與節點 | js/run.js `genMap`、`enterNode`；js/battle.js:159 `mapScreen` |
| 冒險地圖入口 | js/screens.js:473 `map`、:512 `stageModal`；js/world.js |
| 答題判分 | js/question.js:59 `render`；js/util.js `sameAns` |
| 題目閱讀視窗 | js/question.js:255 `previewModal`；js/util.js:142 `containModal` |
| 題庫閱讀與篩選 | js/screens.js:595 `bank`；js/question.js `previewHTML`；js/store.js:160 `filter` |
| 錯題本 | js/screens.js:707 `wrongbook`；js/store.js:107 `record`、:146 `setWrongbook` |
| 題目收藏與資料夾 | js/favorites.js:12 `buttons`、:57 `open`；js/store.js:68 `isFavorite`、:88 `createFavoriteFolder` |
| 星號與相關題 | js/learn.js:82 `starredQids`、`starButton`；js/store.js:160 `filter` |
| 同類題／未刷題型 | js/store.js `typeKey`、:157 `typesAnswered`、`typeFactor`；content/patterns/ |
| 學習首頁與播放器 | js/learn.js:477 `screen`；搜尋 `steps` 與各頁型 render |
| 學習檢核題 | js/learn.js:336 `renderCheck` |
| 學習戰鬥 | js/learn.js:776 `drawBattle`；js/fx.js `attack`、`monStrike` |
| 知識筆記 | js/learn.js:1752 `notes`、:1683 `formulaNote` |
| 公式相關題 | js/learn.js `formulaNote`、`relatedQuestions`；js/question.js `previewModal` |
| 教學圖解 | js/learn.js:1261 `renderDiagram`；docs/格式_學習模式.md |
| 離線互動 | js/learn.js:1376 `renderInteractive`；教材 JSON 的 interactive |
| 學習彈珠記錄 | js/learn.js:1866 `applyPeglin`；js/peglin.js `graded` |
| 名詞彈窗與發音 | js/glossary.js:9 `index`、:89 `speak`、:130 `open` |
| AI 助教 | js/ai.js:58 `buildKB`、:82 `search`、:401 `toggle`、:410 `askAbout` |
| 雲端同步 | js/cloud.js:83 `snap`、:119 `apply`、:203 `render`；js/store.js:253 `exportAll`、:256 `importAll` |
| 備份與匯入 | js/store.js `exportAll`、`importAll`；js/importer.js:102 `merge`、:594 `screen` |
| 匯入教材的題本連結 | js/importer.js:77 `linkPacks`；tools/build.py 的 coverage 邏輯 |
| 彈珠題池／Web | js/peglin.js:117 `pool`、:276 `webOpen`、:322 `onMsg`；peglin/README.md |
| 彈珠介面 | js/peglin.js:648 `screen`、:764 `quizSetup`、:867 `learnSetup`；css/peglin.css |
| 角色造型／動畫 | js/heroes.js:28 `scaleFor`、:43 `html`、:85 `render`；js/screens.js:1090 `heroSkinModal` |
| 新造型禮物 | js/screens.js `GIFTS`、:1122 `voucherModal` |
| 怪物與特性 | js/monsters.js；js/run.js `makeMonster`、`resolve` |
| 遺物／天賦 | js/content.js `RELICS`、`TALENTS`；js/run.js `addRelic`、`addTalent` |
| 職業技能 | js/content2.js；js/run.js:110 `passive`、:112 `useSkill`；js/battle.js `renderSkills` |
| 寵物與營地互動 | js/pets.js `html`；js/camp.js:55 `camp`、:385 `init` |
| 計算機 | js/calc.js:41 `tokenize`、:64 `evaluate`、:207 `build` |
| 計算紙 | js/pad.js:61 `redraw`、:74 `onDown`、:133 `build` |
| 番茄鐘 | js/pomo.js:186 `start`、:293 `tick`、:355 `screen` |
| 音效／音樂 | js/audio.js:222 `SFX`、:453 `play`；搜尋 BGM、AMB、AUDIO_ENGINE |
| 震動 | js/audio.js:21 `HAPTIC`、:35 `buzz`、:61 `armTap` |
| 動畫與場景 | js/fx.js:126 `impact`、:192 `pickAttack`、:248 `stageBG` |
| 共用視窗與觸控 | js/util.js:123 `lockPageScroll`、:142 `containModal`、:160 `modal` |
| 設定畫面 | js/screens.js:1260 `settings`、:1190 `musicSettings` |
| 頂欄／路由 | js/main.js:5 `refreshTop`、:12 `go`；js/toolmenu.js `mount` |
| AI 提示詞 | js/prompts_ui.js:51 `combine`、:71 `screen`；docs/prompts/ |
| 角色圖集 | tools/hero_atlas.py；js/hero-atlas.js 自動產生，js/heroes.js `render` |

## 內容製作

`content/project.json` 為科目設定；`content/bank/<科目>/` 為題庫，`content/learn/<科目>/` 為教材。現有科目目錄包含 eye_anat、eye_ans、physopt、physio、optometry、basic_optics，以及 demo；learn 另有 korean。`content/patterns/` 是同類題，`content/glossary/` 是名詞。規格見 `docs/格式_題庫.md`、`docs/格式_學習模式.md` 和 `docs/prompts/`。圖片在 img/bank、img/learn。一般修改正本後執行 `python tools/build.py`，再視需要 `--strict --index`；並行修改時先協調，使用 `--check` 不重寫生成物。

114 大一下來源、轉換工具及稽核在 `資源/114 大一下/` 與 tools 的 semester_*；視光易讀改寫腳本在 `tools/learn-redo/`，眼解剖等來源在 `資源/*/_src/`。外部原始資料如 `E:\學習\驗光師國考題` 與 Peglin 本體 `E:\PeglinQuiz` 不屬本專案。不要重跑 `資源/*/_src/*.py` 覆寫 content：會丟失 banks、teaches 和補強；learn-redo 的指定課重跑流程與 corrections 見各 SESSION_NOTE。不要改既有題本／題目／課程／造型 ID。

## 測試工具

PowerShell 先設定 `$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'`。各目錄先讀 README 與腳本用法；除下列例外外，瀏覽器 QA 以 `node tools/<目錄>/check.cjs` 執行；`ai-vision-qa` 使用 `node tools/ai-vision-qa/browser.cjs`，`audio-qa` 分別執行 `check-ios.cjs`、`check-desktop.cjs`、`check-fallback.cjs`、`check-bank.cjs`，依各資料夾的設定及 README 指示啟動伺服器。建置檢查：`python tools/build.py --check`；需要覆蓋時 `--coverage`。

| 目錄 | 範圍 |
|---|---|
| abyss-progress-qa / scope-stats-qa | 深淵戰鬥進度／出發範圍統計 |
| audio-qa / favorites-qa | 音訊與題目收藏 |
| exam-cram-qa / exam-related-qa / formula-related-qa / formulas-qa | 考前筆記、相關題、公式連結與計算 |
| knowledge-qa / figs-qa / modal-viewport-qa | 知識收藏、圖解、視窗視口 |
| learn-battle-pin-qa / optom2-qa | 學習戰鬥固定與視光教材 |
| s114-qa / s114-course-qa / s114-review-qa | 大一下內容、課程與總複習 |
| eye115-qa / eyelab-qa / korean-qa | 眼科國考、眼解剖實驗、韓文 |
| ai-vision-qa / peglin-web-qa / manual-qa | AI 圖像、彈珠網頁及手動檢查 |

## 雷區

- `data/*.js`、`js/hero-atlas.js` 是生成物，不手改；`content/` 才是內容正本。
- 不改既有存檔對應 ID 或擅自清除存檔；不要覆寫其他人的未提交變更。
- JS/CSS 改動後更新 index.html 所有 `?v=N`；有獨立展示頁時也檢查其版本。
- iOS 觸控開關可能在按鈕內插入 `.hap-sw` 子 input，事件判斷用 `contains`／`closest`，不要只比較 target。
- 預覽前備份 localStorage，測後還原；獨立 context 也要還原並註明 file://、HTTP、模擬或實機範圍。
- `assets/music/u_*.mp3` 為私人商業錄音，不可發布。醫學內容需核對來源，不把自動化檢查當醫學審稿。
