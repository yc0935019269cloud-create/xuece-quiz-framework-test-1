# 接手本專案前請先讀

先讀 [docs/PROJECT_MAP.md](docs/PROJECT_MAP.md) 找到要修改的區域。

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
- 網頁版與本機啟動器都不能用時，兩個彈珠模式只顯示說明，不影響其他功能。本機版測試用題本請加 `"test": true`，作答不會同步進使用者紀錄。

### 網頁版彈珠（2026-10-26，v153）——推上 GitHub 後任何裝置開 Page 就能玩

- 預設玩法改成網頁版：`peglin/web.html` 外框頁載入 peglinnnnnnn 已部署在 GitHub Pages 的 Unity WebGL 建置（`https://yc0935019269cloud-create.github.io/peglinnnnnnn/` 的 Build／StreamingAssets，檔名從對方 index.html 讀，也載入它的 ipad-display.js）。**不修改 peglinnnnnnn repo**（它是純 Peglin，沒有出題介面、URL 參數或 JS 橋接）；GitHub Pages 有 `Access-Control-Allow-Origin: *`，file:// 也能載入。本機啟動器流程完整保留（側欄「🖥 本機版」、準備頁下方本機版按鈕）。
- 題目放在遊戲外層（`js/peglin.js` 的 `webOpen`／`quizSession`／`learnSession`，`css/peglin.css` 的 `.pgw*`，z-index 45、在 modal 之下）：**答題換彈珠**——每答（學習＝每完成）`per` 題可發射 `shots` 顆，`onWrong` 選答錯算不算；彈珠用完時遊戲被遮罩蓋住（含地圖、商店、獎勵畫面），點遊戲任何地方或在遊戲裡按鍵（外框頁擋下並 postMessage `blocked`）就出下一題；「📖」可先答題存彈珠。HUD 有計算機／計算紙，以及 ♪（v155）：在遊戲層裡打開刷題地牢自己的總音量／背景音樂／音效／全部靜音／戰鬥震動（`Screens.volumeControls`，和頂部「♪ 音樂與音量」同一組 VOL 設定；靜音時按鈕變 🔇；Esc、點外面或點進遊戲就關）。遊戲本身的音量仍用遊戲裡的「選項」，外框頁不控制。v156：工作列加 🍅 番茄鐘（按鈕顯示頂部迷你計時器內容，小視窗可開始／暫停／跳過／結束，呼叫 POMO 的控制函式）與 💬 AI 助教（`AI.toggle`）；題目面板右上 ✕ 暫時關閉（`hidePanel`，`G.parked`）：題目留著，按「📖 回到題目」、點遮罩或在遊戲裡按鍵時回到同一題，收起時按鍵不會在看不到的題目上作答，已答完又有彈珠則等於去發射；Esc 同 ✕。準備頁的題數下面也顯示和遠征同一行的範圍統計（`Screens.scopeLine`，已匯出）。**連續作答**：答完一題主按鈕是「下一題 ▶」（Enter 也是），彈珠一路累積；旁邊「🎯 去發射（⚪×N）」才收起面板去打（`proceed(it, shoot)`）。
- 發射偵測：外框頁攔 `decodeAudioData`（先記壓縮資料指紋）與 `AudioBufferSourceNode.start`；所有彈珠共用的發射音效 `UI_Tock_02`（指紋 `1602:4f96324f`；AAC 解碼後 4096 樣本≈0.0929 s 雙聲道，備援區間 0.082–0.098 s，全遊戲沒有其他音效落在此區間）播放＝一顆，1.2 秒內算同一顆（Unity 每次 start 會呼叫兩次、多重彈珠會連響）。實測：戰鬥每發一顆、戰鬥後把彈珠打進路口選下一關也算一顆、開局偶爾會自動選路一顆；換彈珠、菜單、教學翻頁、標題畫面展示彈珠不算。
- 紀錄：刷題 `Store.record`（錯題本、統計；答對 +8 經驗 +1 魂晶、答錯 +2 經驗，與本機版同步規則相同）；學習檢核 `LEARN_UI.applyPeglin({type:'check', ok: 第一次就對})`（答錯進複習盒），一課走完 `applyPeglin({type:'lesson'})`；選的課上完後輪流複習這幾課的題目（`CTX_RE` 承上題不進複習）。場次 `test: true` 不寫紀錄。答錯可「稍後再出一次」。
- 彈珠刷題範圍和自由遠征一致：科目、`Screens.setPicker` 題本樹＋年份、題型、星號、出題順序（smart／rand／new／wrong，`orderUnits` 照 screens.js 的 `prefOrder`）、同類題、狀態、題數；本機版打包也改用同一套。彈珠學習沿用原選課樹，另加彈珠設定。設定存 `peglin-config`／`peglin-learn`（多了 per／shots／onWrong）。
- GitHub Pages 上不再自動探測本機啟動器（避免別台裝置跳「存取本機網路」詢問），要用本機版按側欄「偵測本機啟動器」；file:// 與 localhost 照舊自動偵測。網頁版與本機版都不能用時才顯示原本的說明。遊戲網址可在彈珠頁「⚙ 網頁版遊戲網址」改，外框頁與 peglin.js 都只接受 `yc0935019269cloud-create.github.io` 或 localhost（避免網址參數載入別人的程式）；`peglin-web.debug` 只給 QA 讀外框頁狀態。
- 限制：遊戲不知道有題目，沒有答對傷害加成／答錯扣血；遊戲內音效關到 0 時能否偵測未實測；createUnityInstance 完成後遊戲還要自己預載資源與載入標題（SwiftShader 上幾十秒，實機較快）；首次載入約 30 MB；Peglin 存檔存在瀏覽器、與 peglinnnnnnn 網頁本身分開；可以點的圖解、互動、字母發音只在學習模式。沒有實機 iPad／手機實玩測試。
- **彈珠學習的換課、回上一頁、收藏此頁（2026-10-30，v164）**：題目面板上方「📚 換課」開啟和準備頁同一套選課樹（`lessonPicker(box, lcfg, onChange)`，只在自己的容器裡找元素，準備頁與換課視窗共用），按「開始這些課 ▶」換成新的 `learnSession`，彈珠與統計不歸零，選課存回 `peglin-learn`。面板下方「◀ 上一頁」與本課色條（`.pgw-pip`，只能點已走到的步）：回到看過的頁＝回顧（`it.back`，顯示「🔁 回顧中・作答不計分」），不計分、不換彈珠、不寫紀錄、不進複習盒、不重複完成一課；回到最遠那一步若還沒做完就照常作答。session 介面：`cur()`／`frontier()`／`goto(k)`／`current()`，每個 item 帶 `si`（課內步驟索引）與 `done`。「☆ 收藏此頁」用 `LEARN_UI.pageStar(pack, lesson, si)`（同一般學習模式的 `starButton` kind page、存 `D.starred`），收進知識筆記星號收藏。`webClose` 會把關閉中外框裡的所有 id 改名，馬上再開一場不會畫到舊面板。QA：`tools/peglin-web-qa/learn-nav.cjs`（不載入真遊戲、模擬已登入）23／23，結果 `docs/peglin-web/learn-nav-qa.json`。
- **遊戲存檔雲端同步（v157）**：有登入雲端同步時，哥布林彈珠的存檔（IndexedDB `/idbfs/<雜湊>/` 的 Save_0.data、Save_0r.data、Stats_0.data、PlayerPrefs 等頂層檔，不含 Unity 子資料夾）存成 saves 表的另一筆 `project＝<題庫 id>:peglin`（`CLOUD.peglinGet／peglinPut`），不跟著每 30 秒的進度同步。外框頁啟動遊戲前先回報本機存檔（`hello`），父頁讀雲端決定是否套用（`start`，最多等 10 秒）；新裝置還沒有存檔資料夾時，等遊戲第一次建好資料夾再寫入並自動重載一次（存檔資料夾雜湊沒去研究怎麼算，使用者同意）。上傳：遊玩中每 2 分鐘、切走分頁、按結束時（先讀出存檔再關遊戲），存檔有變動才傳。本機 `SKEY('peglin-cloud')` 記上次同步的雲端時間與本機存檔時間；兩邊都改過時較晚的為準，輸的那份存在 `SKEY('peglin-cloud-bak')`（一份，目前沒有還原介面）。兩台不能同時玩同一份。測試：`tools/peglin-web-qa/cloud-save.cjs`（假存檔＋攔截 Supabase 的記憶體模擬、三個 context 當三台裝置、不載入真的遊戲）10／10，結果 `docs/peglin-web/cloud-save-qa.json`；**沒有用真的遊戲與真的 Supabase 跑過，要使用者兩台裝置實測**。
- 對方 repo 改版時：先確認發射音效仍是 UI_Tock_02（長度備援通常就夠），新指紋可加在 web.html 的 `LAUNCH_FP` 或用網址參數 `fp=`。
- QA：`tools/peglin-web-qa/check.cjs`（headless Edge＋SwiftShader、file://、實際載入遊戲開新冒險打進第一關發射；備份還原 localStorage）**28／28 通過**、無頁面錯誤：準備頁與自由遠征同一套條件與題數、答對寫紀錄＋給彈珠、戰鬥中實際發射逐顆偵測（點了沒發射的不算）、用完遮罩＋外框鎖鍵盤、按鍵／點遊戲叫出下一題、答錯進錯題本並稍後再出、結束移除 iframe、test 場次不寫紀錄、彈珠學習一課走完記完成＋檢核錯題進複習盒＋每 2 步換 1 顆、網頁版連不到顯示原說明、♪ 刷題地牢音量面板（桌機與 390px）、390px 手機版。另用常駐 driver 打完一整場戰鬥＋選路線＋第二關驗證偵測（每發一顆、不多算）。結果 `docs/peglin-web/qa.json`、截圖 `output/playwright/peglin-web-*.png`。詳細介接見 `peglin/README.md`。

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

## 平板知識筆記題目視窗捲動修正（2026-10-13，v93）

- 依使用者 iPad 截圖修正相關題閱讀視窗；同題 physopt-exam-u5-107-sp-49 在舊版外層捲動後標題 top −65px、關閉鍵 −73px，可重現標題被裁掉。QV.previewModal 改用 U.modal 的 contained 選項，只讓內容區捲動、標題與關閉鍵固定，VisualViewport 同步可見高度／偏移，背景固定並保存原捲動位置。
- 關閉還原 body／html 原 inline styles 與清單位置；巢狀鎖定計數、重複關閉保護、observer 外部移除清理。App.go 用 U.clearModals 清掉閱讀視窗後再切頁，避免離開後頁面仍鎖定。一般視窗維持原佈局，題庫和第六單元內容未改；index.html 所有快取版本 v93。
- QA：Edge iPad 路徑與桌機各 25 項（同題長詳解、橫直轉向、390px、可見視窗收縮／偏移 fixture、關閉／Esc／巢狀／切頁／外部移除）、原相關題 iPad 路徑 73 項回歸通過；全 JS 語法與嚴格建置檢查通過。獨立 context 還原 localStorage，HTTP 模擬，未做實機 iPadOS／Safari 或本輪 file:// 驗證。工具 tools/modal-viewport-qa/，結果與截圖 output/playwright/modal-viewport-*。

## 公式統整相關題（2026-10-13，v94）

- 使用者指定「學習模式 → 知識筆記 → 公式統整」，先做第一～五單元。50 組公式新增 relatedQuestions，632 次連結、495 題不重複題目，其中 67 題為老師講義原題；31 組公式有老師講義題。排序以老師講義優先，再國考、單元練習，列表標明來源。第六單元完整內容與相關題狀態未改。
- js/learn.js 共用 note-related 收合／延後建立列表，保留考前必看的 cram-related 與新增 formula-related，各自預設收合，不隨全部展開。沿用 v93 的固定標題與關閉鍵閱讀視窗。原公式講解與課程流程不變，內容正本在五個 content/learn/physopt JSON，data/learn.js 由 build 生成。
- 依現有題目逐組核對，規則在 tools/formula-related-qa/link.py；沒有老師原題可配的公式用單元練習。第一單元週期搭配頻率換算作延伸，relatedHint 明確說明題目本身沒有問週期。build 檢查 relatedQuestions 的不重複／存在性，importer 保留連結，舊筆記缺少欄位依相同公式 id 補入內建連結，明確 [] 可清空。
- QA：97 個單元（排除新增連結欄位）與原公式講解／進度 id 不變，整個第六單元與題庫完整性一致；原 58 項數值驗算、Edge iPad 路徑 192 項與桌機 192 項、全 JS 語法與嚴格建置檢查通過。獨立 context 還原 localStorage、移除匯入 fixture；HTTP／Edge 模擬，沒有實機 iPadOS 或本輪 file://／雲端往返驗證。工具 tools/formula-related-qa/，報告／截圖 output/playwright/formula-related-*。

## 視光學二：雙眼平衡、國考題與國考重點（2026-10-14，v95）

- 來源：使用者的 `E:\學習\大二上\視光學`（講義 PDF＋上課錄音：`3-binocular+balance_f26.pdf`、`vf lab lecture`、10/14 三段錄音）。錄音用 Turbo 轉錄再做前後文校訂（校訂逐字稿在該資料夾的 `逐字稿\校訂逐字稿`，含「待確認片段」；原始音檔已搬到 `已處理音檔`）。老師簡報與國考標準答案有出入時（例如第二次 MPMVA 要不要用紅綠），卡片的國考重點會註明，考試以題目為準。
- 新單元 `content/learn/optometry/optom2/optom2-u4-bb.json`（雙眼平衡，7 課）與自編題本 `optom2-u4-q`（26 題）；第 2、3 單元補上課（u2 l9 鐘面圖／針孔／裂孔板／散光分類／檢查距離、l10 國考總演練；u3 l9 檢查前準備／Amsler／法定視障、l10 國考總演練）。
- **國考題**：`content/bank/optometry/optom2/exam/`，61 個題本、227 題（u2 164、u3 26、u4 37；題號 id 形如 `optom2-exam-u<單元>-<年>-<vh|vt|sp|st|lh|lt>-<題號>`），來源為 `E:\學習\驗光師國考題` 的驗光師《視光學》《低視力學》與驗光生《驗光學概要》（106～114 年；114 年驗光生普考 PDF 只有答案頁，未納入）。答案取自每份 PDF 的標準答案頁；詳解為自編。三個單元的 `banks` 都掛了對應國考題本，所以 build 的覆蓋檢查會要求教材追上國考題（目前只剩既有的 `LV` 符號提醒）。
- **概念卡新欄位**：`exam`（🎯 國考重點，字串陣列）與 `demo`（✏️ 示範），`js/learn.js` 的 `examDemoHTML`、`css/style.css` 的 `.lp-exam/.lp-demo`、`tools/build.py` 檢查；規格見 `docs/格式_學習模式.md`。u2～u4 每張概念卡都有，QA 會驗證。
- **知識筆記**：u2～u4 各有 `exam-cram`（考前必看，附 evidence 連結題目）與 `formula-summary`（公式／規則統整，附 relatedQuestions）；題數是「相關題數」，不是必考保證。
- 老師講義內容不重複做：u1～u3 原本就涵蓋 MSR 與視野的簡報（含 FDT、VR、微視野），錄音裡重複的內容沒有再做一次；錄音新增的內容（Risley 稜鏡、垂直稜鏡分離細節、bracketing、雙眼驗光等）都在 u4。
- 檢查工具：`tools/optom2-qa/check.cjs`（Playwright＋Edge 一次性 headless context：資料完整性、國考題載入與詳解、抽樣渲染、知識筆記頁；先設 `$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'`）；PDF 解析器 `tools/optom2-gen/parse_exam.py`（要加新年份國考題時用；**內容正本在 content/，不要重跑舊生成流程覆蓋詳解**）。
- 測試狀態：嚴格建置 exit 0、QA 35/35（file:// 開 index.html，含知識筆記相關題視窗）；沒有實機 iPad 驗證、沒有醫學審稿；國考題詳解與卡片重點依標準教科書與課堂簡報自編，數值（如紅綠焦點差 0.44～0.50 D）屬常用參考值。

## 114 大一下視光學第01～03單元與各單元「國考重點複習」（2026-10-16，v96）

- 來源：使用者的三份期中講義（視力與球面屈光不正、散光與處方書寫、視網膜檢影）。新單元 `content/learn/optometry/semester114/s114-optometry-{va-sph,astigmatism-rx,retinoscopy-intro}.json`（path `['114 大一下','114 學年度','視光學','第0N單元 …']`、order 1～3；8／7／5 課）；每張概念卡有 `exam`／`demo`，各有知識筆記（考前必看＋公式統整，相關題連結）。第03單元只是檢影入門，更完整的檢影與綜合驗光儀在既有第05單元（它的 95 題國考題已在既有題庫，所以第03單元只收 14 題不重複的）。
- 新國考題本：`content/bank/optometry/semester114/exam-u01-u03/`（23 本、138 題；id `s114-optometry-exam<年>-u0N-<kind>-<科目碼>-<題號>`，kind＝vh／vt／sp／st，科目碼＝op 視光學／vo 視覺光學／rf 驗光學概要／sg 眼鏡光學概要）。從 106～114 年全部國考卷挑選，詳解自編；與既有 s114／基礎光學題庫重複的、官方答案與換算不一致的（109 生特 7 的 6/60）都已捨棄。單元 `banks` 已宣告，`--coverage`／`--strict` 無警告。
- **「年份對應」**：樹狀路徑改成年份在前，和 s114 既有國考題一致——`['114 大一下','<年> 年國考','視光學',單元]`；視光學二的 61 個國考題本也改成 `['115 大二上','<年> 年國考','視光學二',單元]`（id 不變、進度不受影響）。這是對使用者「沒有對應年分」的解讀，若要改回單元在前只要改各題本 `set.path`。
- **「國考重點複習」課**：每個視光學單元的最後一課——第01～03單元（l8／l7／l5）、s114 第04～09單元（加在各自 `-p2.json`，lesson id `exam-review`）、視光學二第1單元（新增 l5）、第2～4單元（把原「國考總演練」改名並補例題）。內容＝本單元國考最常考的 3～4 個考點（每張卡 🎯 國考重點＋✏️ 示範）＋ 2～3 題真正的國考題逐步講解＋ 實戰＋ 回顧。第04～09單元的例題與考點依該單元 445 題歷年國考題整理，例題答案都獨立驗算過；有幾題既有詳解推導不清楚（例如 K 值的 Javal 預測、放錯工作鏡片），複習課改用自己推導的版本。第99單元（中英文名詞）沒有做。
- 題目出處標籤：第01～03單元用『106 師特 39』；s114 第04～09單元用『108 師高視覺 30』（師高／師特／生普／生特＋科目簡稱：視光、視覺、驗概、眼鏡、隱形、眼球），複習課導讀有說明。
- 老師講義與國考標準答案有出入時兩者都寫並註明（例如檢影反射光接近中和：講義寫 thinner、國考標準答案寫「愈寬」）。
- 生成腳本在 `E:\NEWTEST\y1_work\`（不在 repo）：`gen_banks.py`（題本）、`u1.py～u3.py`＋`notes.py`／`notes2.py`＋`build_units.py`（新單元）、`rev_s114.py`＋`apply_rev.py`（第04～09單元複習課，append 到 p2）、`rev_optom2.py`（視光學二）。內容正本是 `content/`，之後直接改 JSON；重跑腳本會覆寫同名課。
- 檢查：`tools/s114-qa/check.cjs`（101 項：新單元與複習課資料、題本路徑、抽題池、渲染、知識筆記相關題視窗、390px）、`sweep.cjs`（新單元與各複習課共 312 步逐步渲染）、`shots.cjs`（截圖到 `output/playwright/s114-*.png`）；`tools/optom2-qa/check.cjs` 35／35 仍通過。先設 `$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'`。嚴格建置 exit 0。
- 限制：沒有醫學審稿，也沒有實機 iPad 或 file:// 以外環境的測試；程式碼區塊（```）在 390px 手機寬度會橫向捲動（沿用原有樣式）；數值（頂點距離換算、Hofstetter、近用 PD 估算的 27 mm 等）屬常用參考值，以老師講義／題目指定為準。

## 眼解剖國考題、血液供應與實驗手冊圖鑑（2026-10-16，v97）

- 眼解剖（115 大二上）：國考題 `content/bank/eye_ans/exam115/`（81 本）、`content/bank/eye_anat/exam/`（16 本，id `eye115-exam-<單元>-<年>-<題型*100+題號>`）；新單元 `content/learn/eye_ans/blood/`（眼球血液供應 3 單元）；8 個既有單元新增「國考重點複習」課與卡片 `exam` 欄，隨堂考題本 `eye-quiz-blood-supply`。學習內容原則同前：題目不降級，教材追上題目。
- **實驗手冊圖鑑**：`content/learn/eye_anat/manual-*.json`（7 單元）＋`content/bank/eye_anat/manual/`（7 題本、319 題看圖填寫，題幹只顯示紅圈編號）＋圖檔 `img/eye-anat-manual/`。**使用者明確要求：不要用自繪示意圖，要真實圖片**（考試用真實標本／切片圖）。現用圖：Beal 博士（LSU）人腦標本照片（外側面、內側面、腦底血管）、Sobotta 腦幹 Weigert 染色切片（已塗去文字標籤）、真實顱骨照片（Crane4、中顱窩近拍）、Gray／Sobotta 解剖圖、眼底與視網膜組織照片等；來源與授權在每個圖解步驟的「圖片來源」。仍有幾張是專業插畫（Servier、OpenStax、Gray 示意），若使用者要求再換。
- **期中範圍**（使用者 2026-10-16 說明）＝手冊第 1 頁骨質眼窩、第 4 頁血管系統、第 5 頁視覺路徑、第 8 頁腦幹與神經。路徑分兩層：`眼解剖實驗 → 實驗手冊圖鑑 → ★ 期中範圍…`（4 單元）與 `…→ 選讀（非期中範圍）`（眼瞼眼外肌淚器、眼球組織切片、顱神經與腦室）。期中範圍名詞已全部有圖（滑車下動脈、睫狀前靜脈在 Gray 動脈圖上只標伴行方向的大致位置、探索用）；選讀仍缺：晶體切面（晶體課已移除）、葡萄膜肌肉、瞼韌帶等。使用者說專業插畫或模型圖也可以。圖與名詞對照：`docs/實驗手冊圖鑑對照.md`。
- `js/learn.js` 的 `renderDiagram`：標記點太近時縮小圓點並把重疊的點最多推開 14px（只改畫面，不改資料）；CSS 變數 `--pin`。
- 圖片與標記點產生流程在專案外 `E:\NEWTEST\eye_work\`（`figs_m*.py` 定義圖與標記點、`mask2.py` 塗標籤、`build_manual.py` 產生題本與單元、`overlay.py` 疊圖檢查）；內容正本是 `content/`，重跑 build_manual 會覆寫 manual-* 檔。
- QA：`tools/eye115-qa/`（血液供應與複習課渲染）、`tools/manual-qa/check.cjs`（7 單元 265 步渲染、41 張圖解、319 題資料與圖檔、桌機與 390px，結果 0 問題）、`shots.cjs`（截圖到 output/playwright/manual-*.png）。需 `NODE_PATH=E:\NEWTEST\skull-atlas-3d\node_modules`。**沒有醫學審稿，標記點為依標本與原圖標籤人工定位（標本照片上細小構造如前脈絡叢動脈、E-W 核只標大致方向並設為不出題）；未做實機 iPad 測試。**

## 視光學第 01～03 單元易讀版（2026-10-16，v98）

- 使用者覺得字太密、希望國中生也能完全理解，並提議「學兩頁再進一次題目」。`s114-optometry-va-sph`／`astigmatism-rx`／`retinoscopy-intro` 共 58 張概念卡都拆成兩頁一組：A＝白話概念（生活比喻、短句、`keys`），B＝數字／表格＋🎯國考重點＋✏️示範；課程 intro 也縮短。題目、檢核題、practice、筆記、`teaches` 都沒動，覆蓋檢查仍全過。
- `tools/build.py` 節奏規則改為：一或兩張連續 card 後接 check 即可，連續 3 張以上才警告；「一課 N 組概念卡」以組計算。`tools/s114-qa/check.cjs` 改成「卡片自己或下一頁有 exam＋demo」即通過（101/101、sweep 370 步 0 錯誤）。手機版課程標題列改成標題獨占一行（`.lp-head`，v98）。
- **視光學二（115 大二上）4 個單元也已改成兩頁一組**（`optom2-u1-intro`～`u4-bb`，共 110 張概念卡；u1 原本沒有 exam／demo 的卡片，第二頁只放細節）。大一下 s114 第 01～03 單元維持第一次改的版本。規格檔在專案外 `eye_work/read_*.py`；覆蓋檢查仍全過，`tools/optom2-qa/check.cjs` 35/35、`tools/optom2-qa/sweep.cjs` 483 步 0 錯誤。
- **s114 視光學第 04～09 單元（p1／p2）、中英文名詞單元與 114 眼解剖生理（`eye_ans/semester114` 共 16 單元）也已改成兩頁一組**，但這批是**模板化內容的自動重排**（`eye_work/apply_auto.py`），不是逐張改寫：「一句話／白話」＋「觀念」→ 第一頁（引言＋逐句分行、編號列點），「口訣／公式」＋「考試角度」→ 第二頁（🎯 國考重點）；機器重複的「應用：由條件走到結論」只留情境與結論、名詞卡去掉罐頭句、有 exam＋demo 的考點卡拆成「內容」與「考試怎麼出」兩頁；修正字詞替換錯誤（「same direction 近用加入度」→「相加」）。覆蓋檢查不變、嚴格建置通過，`tools/s114-qa/sweep-all.cjs` 1,920 步 0 錯誤。內容本身仍是原本措辭，若要「用國中生講法重寫」要像視光學二那樣逐卡手寫（`read_*.py` 規格）。
- 之後新單元請照這個寫法；physio、basic_optics 與眼解剖實驗以外的 114 單元尚未改成兩頁版。
- **第二輪白話手寫（2026-10-17）**：上面自動重排的 s114 視光學 p1／p2（keratometry、near-point、objective-refraction、pd-lensometry、pupil-response、stereopsis）與 114 眼解剖生理（adnexa、central-visual-pathway、ocular-blood-supply、retina-layers、retinal-electrophysiology、retinal-transmission、tear-film、visual-reflexes）的主要概念卡已逐卡改寫成國中生也懂的講法（生活比喻、少英文、先一句話再細節；規格在專案外 `eye_work/rw_*.py`、`apply_rw.py`）。機器模板的「單元路線」「應用：由條件走到結論」「判斷依據」小卡改成 3～4 步白話學習路線、「試著用自己的話說一遍」與一兩句理由（`small_data.py`／`apply_small.py`）。修正翻譯錯誤：眼神經 V1 曾被譯成「初級視覺皮質」。名詞單元（terms）與 physio、basic_optics 未動。嚴格建置與覆蓋檢查通過；無醫學審稿、無實機 iPad 測試。

## 學習卡配圖：講到構造就附真實圖（2026-10-17，v99）

- 起因：使用者問「眼解剖學習有沒有在講到結構時附圖例？例如內頸動脈四條分支」。查出手冊圖鑑 `manual-*` 7 單元本來就有圖解，但**眼球血液供應 3 單元、自主神經／腦神經 4 單元（ans-clinical／pathways／reflex／trigeminal）、角膜 3 單元、舊的眼眶骨與視覺路徑兩個課程的講解卡沒有圖**。已補 125 張講解卡（blood-vessels／ciliary／retina、eye-anat-orbit-course、visual-path-course、ans-*、cornea-*）。ans-basics（神經系統總論、藥物表）、cornea 的疾病／組成表等抽象卡與 114 大一下單元**沒有補圖**。
- 做法：卡片用既有的 `img`（字串或陣列）＋`img_source`，本批圖放 `img/eye-anat-fig/<key>.jpg`，是把圖鑑現有的真實圖片（腦標本、顱骨、Gray 解剖圖、切片、眼底照等；新增 Gray188／190／193 顱骨圖與 Häggström 副鼻竇冠狀 CT）**燒上中文名稱＋紅色編號**的版本；卡片內文最前面加一行「🖼️ 看圖：…」說明。原圖（無標籤）仍給圖鑑題本用，不受影響。
- `css/style.css` 的 `.lp-src` 加 `overflow-wrap:anywhere`（長網址來源在手機會撐出橫向捲動）；index.html 快取版本 v99。
- 產生流程在專案外 `E:\NEWTEST\eye_work\`：`annot.py`（標標籤）、`fig_specs.py`／`fig_specs2.py`／`fig_specs3.py`（每張圖標哪些名稱、哪張卡配哪些圖；新圖的標記點用原圖像素座標）、`render_figs.py`（產圖）、`apply_figs.py`（寫入卡片，可重跑）。圖上標記位置沿用圖鑑人工標點（前脈絡叢動脈等細小構造標「大致位置」）；新增的 Gray193 顱底孔洞、Gray188／190、CT 的位置是對照原圖手動定位，已做一輪逐張檢視的自我審稿（2026-10-17：Gray188 顱骨側面的顴弓、外耳道、乳突、莖突位置依放大格線校正；Gray193 孔洞、Gray190 前面觀、CT 與其餘沿用圖鑑標點的圖未發現重大錯位），仍非專業審稿。
- QA：`tools/figs-qa/check.cjs`（125 張配圖卡×桌機／390px 共 250 次渲染：圖載入、張數、說明、來源、無橫向捲動；結果 0 問題，截圖 `output/playwright/figs-ica-*.png`）、`tools/manual-qa/check.cjs` 103 項、`tools/eye115-qa/check.cjs` 80/80、`sweep.cjs` 173 步 0 錯誤；嚴格建置通過。沒有實機 iPad 測試。

## 眼解剖實驗：圖鑑式學習單元＋跑台題庫（2026-10-18，v102）——**以後眼解剖實驗課做學習單元一律照這個形式**

- **使用者要的形式**（跑台考：看標本認位置、寫中英文）：
  - 每課＝幾張「可點的圖」（`diagram` 的 `mode: "explore"`：點數字或名稱看中英文與一句話位置，可「遮住名稱」自我測驗）＋「看圖寫名稱」題（`check` 的 `kind: "name"`：紅圈圖、中文英文兩格）。文字極簡：intro 一兩句、不要長篇解說、不要選擇題、不要每張卡都出題。
  - **每個單元最後一課＝總複習**：所有圖的完整標註總圖（每張最多 5 個標籤、點太多就拆成幾張，必須涵蓋全部點位）、總表（依課分組：中文、English、一句話位置）、每個點位一題。
  - **不考的點不要放**（使用者說過：漏斗（垂體柄）、乳頭體、蛛網膜、軟腦膜不考）。點位範圍依老師講義、《新實驗手冊-01.pdf》與逐字稿《會考的.html》。
  - 名詞可點開看字源（`js/glossary.js`；字典 `content/glossary/eye-anatomy.json`、`eye-lab.json`）。
  - **題庫**：每個點位一張紅圈圖（圖上方印「紅圈是什麼？請寫出中文與英文名稱 / What is circled? Name it in Chinese and English.」），`fill` 題、答案「中文 / English」（accept 列出所有別名組合；中英文都要寫才算對），**每張圖一個題本**，路徑 `眼解剖實驗 → 跑台看圖題（每個點位一題） → <單元> → <課>`，讓使用者勾選範圍。
- 單元（`content/learn/eye_anat/lab-*.json`，`style: "atlas"`，build 對 atlas 單元不做節奏／卡片長度警告）：
  - 實驗課（依老師講義）：`lab-visual-path`（講義《2.視覺路徑》10–13 頁）、`lab-orbit`（《1.骨質眼窩+圖譜》1–8 頁，點位由 PDF 引線末端自動換算）、`lab-blood`（血液供應講義，附講義原圖對照卡）。
  - 實驗手冊名詞（考試範圍）：`lab-manual-{orbit,lid,vessel,visual,brain,tear}`（手冊第 1、2、4、5、8、10 頁）。
  - 題庫 `content/bank/eye_anat/lab/<slug>/`：92 個題本、447 題。
- **圖片**：老師講義、圖譜、上課照片放 `img/eye-lab-private/`，開放授權圖放 `img/eye-lab/`。使用者 2026-10-18 同意兩者都上傳到公開 repo（資料夾名稱沿用，已不在 .gitignore）。
- **產生器**（專案外 `E:\NEWTEST\eye_work\atlas\`，重跑會整個覆寫上述單元、題庫與圖）：`names.py`（名稱表：中文／英文可接受寫法＋字源）、`bases_all.py`（底圖與點位）、`core.py`（`build(spec)`：課、總複習、題庫）、`build_all.py`（各單元 spec；最後輸出 `content/glossary/eye-lab.json`）。新單元：在 `bases_all.py` 登錄底圖點位、`names.py` 加名稱、`build_all.py` 加一個 spec，執行 `python -X utf8 E:/NEWTEST/eye_work/atlas/build_all.py` → `python tools/build.py --strict --index`。圖譜 PDF 的引線點位用 `E:\NEWTEST\eye_work\orb\extract.py` 取得。
- 新題型與功能：`js/learn.js` 的 `kind: "name"`、檢核題可附 `img`；`js/glossary.js`；規格 `docs/格式_學習模式.md` §8.9、§8.10。
- QA：`tools/eyelab-qa/check.cjs <unitId>`（每步渲染、圖載入、題目圖、名詞小視窗、桌機＋390px；9 個單元皆 0 問題）、`name-test.cjs`（寫名稱題互動）、`bank-test.cjs`（題庫載入、圖檔、判分）。
- 限制：點位為人工／自動定位，無專業審稿；部分 Gray 解剖圖本身印有英文標籤（例如眼動脈分支、睫狀動脈圖），看圖題在這些圖上英文會被原圖提示；楔葉、舌回、穆勒氏肌、前脈絡叢動脈、眼底四大分支為大致位置；沒有實機 iPad 測試。

## 眼解剖生理學學習模式重寫：易讀排版（2026-10-18，v110）

- 使用者要求：字太密、排版不好、重點不突出 → 要簡明扼要又好懂，**考點一個都不能刪**；不必每個觀念後都接練習，概念頁可以多。**115 大二上 11 個單元、41 課已全部改完**（腳本 `tools/learn-redo/*.py`，方法 `docs/眼解剖生理學_易讀版改寫方法.md`，進度 `SESSION_NOTE.md`）。之後的指示：不用每課截圖、圖片沿用現有的，有必要才重做。
- 新排版元件與 `pace: "free"` 規格見 `docs/格式_學習模式.md` §8.11。一頁＝`[!big]` 一句話 → 圖 → 短句／flow／cols → 最多一個提示框 → 🎯 exam（附出處）→ ✏️ demo；`keys` 不重複其他區塊。整課固定配色（l1：中央動脈＝橘 `{o:}`、脈絡膜＝藍 `{b:}`），自製圖也同配色。
- 圖：`img/eye-anat-fig/retina_v2_*.jpg`（由開放授權的視網膜分層圖、眼底照片重新標註；產生腳本 `tools/learn-redo/retina_figs.py`）。桿／錐顏色在原圖無法確認，所以合標「感光細胞（桿＋錐）」；眼底四大分支位置依血管走向目視標示。
- 課程內容腳本 `tools/learn-redo/blood_retina_l1.py`（舊版檢核題、記憶卡、範例、實戰從 git `7a517e7` 取，可重跑）；之後直接改 JSON 也可以。檢核題文字沒改，複習盒紀錄保留。
- 其他改動：概念卡「📌 重點」「🎯 國考重點」框改成實線左邊框（全站）；名詞字源底線變淡；圖片在桌機最高 72vh；`tools/figs-qa/check.cjs` 接受 `.co-big` 當看圖說明；截圖工具 `tools/learn-redo/shot.cjs <unit> <lesson> [prefix]`；整體檢查 `tools/learn-redo/sweep.cjs`；教材圖片可點擊放大（`.img-zoom`，手機可左右拖、雙指縮放）；`::: cols o b` 可指定欄色。
- 發現：`content/bank/eye_ans/exam115` 等國考題本的題號 2xx／3xx 題幹多標成「驗光師」，但至少 113-211、113-216 實際出自 113 驗光生普考（PDF 已核對）；尚未全面修正。

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

## 實驗課總複習互動圖／其他分類／鮑氏環（2026-10-20，v129）

- 老師講義三單元的總複習「總圖｜原課名」改為先看互動圖：下拉切圖、點標記／名稱、喇叭念英文、小星星、遮住名稱與調整標記；完整標註圖可展開、原總表保留。`js/learn.js` 依總圖標題匹配來源課，共用renderDiagram，GLOSS.speak對外供喇叭使用；星號及pins仍對應原課原圖。
- 只改現有卡片的呈現，課程ID／步驟索引／問題與答案不變，不會重排既有學習進度。改課名須同步總圖標題。互動圖共43張，三單元皆有。
- 眼解剖實驗學習目錄保留「實驗課（依老師講義）」「實驗手冊名詞（考試範圍）」，其餘9個單元收進「其他」。content.path同步，課程／知識筆記入口順序一致；題庫分類未改。
- 標本60的鮑氏環往後移至(23.81%,58.43%)，與梅氏環(19.3%,40.9%)拉開；兩個圖解、總圖、課內題、跑台題同步，4張註記圖加-baum-v2檔名避快取。底圖不改，來源座標E:\NEWTEST\eye_work\vp\bases.py已更新。
- Edge file://桌機與390px手機86次切圖、522項通過；原星號72項回歸通過，strict build與JS語法通過。獨立context已還原localStorage；發音只驗證speechSynthesis事件，未實機iPad或人耳評估。
- 接手與重跑方式：tools/eyelab-qa/REVIEW_ATLAS.md；小範圍更新腳本update_review_atlas.py（不要重跑整套圖鑑產生器覆寫content）；報告與截圖output/playwright/review-atlas-*。
## 圖解標記大小可調（2026-10-20，v132）

- 學習圖解（`renderDiagram` 的 `.dg-pin`）預設改小：電腦 18px、手機（圖寬 < 420）自動 ×0.83。設定頁「學習圖解的標記圓圈大小」滑桿 8～26px，存 `Store.settings.pinSize`（跟著存檔／雲端），旁邊有即時預覽與「預設」。`.dg-pin::before` 把點擊範圍補到約 26px，圓圈再小也好點。
- ☰ 多功能選單最後一項「⚙ 設定與存檔」（`js/toolmenu.js` 的 `setMini`）：和 ⌂ 一樣先保存進行中的遠征再切到設定頁（v133）。

## 英文發音按鈕修正（2026-10-20，v134）

- `js/glossary.js` 的 `GLOSS.speak`（圖解 🔊、字源視窗 🔊 共用）：iPhone／iPad 先用 `<audio>` 播線上語音（媒體音量，不受靜音開關影響；speechSynthesis 在 iOS 會被靜音開關消音，cancel 後立即 speak 也常被吞），依序 Google 翻譯語音（translate.googleapis.com，client=gtx）→ 有道 dictvoice → speechSynthesis。其他裝置先用 speechSynthesis（指定英文語音），1.5 秒沒開始或出錯改播線上語音。被下一次點擊打斷的舊請求不會再改播備援；按鈕不再因瀏覽器沒有 speechSynthesis 而隱藏。線上語音需要網路，兩個來源都是非官方端點，可能失效。
- 圖解標記大小同步到知識筆記（v135）：`main.js` 開機與設定滑桿把 `Store.settings.pinSize` 寫到 `:root` 的 `--pin-base`；`.dg-pin` 沒有 `--pin`（未經 renderDiagram 的 spread）時用 `--pin-base × --pin-k`（手機 .83），所以知識筆記、收藏區等的標記也跟設定一樣大。`.knowledge-pin` 外圈紅框 3→2px。
- 發音再修正（v136）：iPhone 上線上語音偶爾失敗會退回 speechSynthesis（被靜音開關消音）而沒聲音。現在 `GLOSS.speak` 先播專案內的 `assets/tts/<slug>.mp3`（499 個、約 8 MB，涵蓋所有圖解點英文名與名詞字典 en；離線也能播），再 Google → 有道 → speechSynthesis；全程重用同一個 `<audio>`（iOS 第一次在點擊中播放後，換來源也能播）。新增名詞後：`PW_EXE=… node tools/tts/collect.cjs` → `python tools/tts/gen.py`（只下載缺的；slug 規則與 glossary.js 的 `ttsSlug` 一致）。

## 眼解剖實驗題本分類對照學習模式（2026-10-20）

- 遠征／題庫／冒險地圖的題本樹由 `set.path` 與 `set.order` 決定。眼解剖實驗 117 本已改成和學習模式目錄同一套：`實驗課（依老師講義）→ 視覺路徑／骨質眼窩／血液供應 → 各課`、`實驗手冊名詞（考試範圍）→ 第 N 頁… → 各課`、`其他 →（舊課程題本、實驗手冊圖鑑、國考題）`。只改 path／order，題本 id 與題目不動，進度不受影響。
- 腳本 `tools/eyelab-qa/bank_tree.py`（依 `content/learn/eye_anat/*.json` 的 path、order、課名對應）。**重跑專案外圖鑑產生器（`E:\NEWTEST\eye_work\atlas\build_all.py`）會把跑台題本 path 改回舊的「跑台看圖題」，之後要再跑一次 bank_tree.py**，再 `python tools/build.py --strict`。
- 題池 0 題的題型提示（v137）：眼解剖實驗跑台題都是「填答」，題型只勾單選時題池會是 0。`js/screens.js` 的 `typeHint`：深淵遠征與自由遠征在題池為 0、但所選題本有未勾的題型時，顯示「這些題本的題目是「填答」題…」與一鍵「勾選「填答」」按鈕。
- 遠征「★ 只出星號部位的題目」（v138）：自由遠征與深淵遠征的「星號」開關。`LEARN_UI.starredQids()` 把學習模式加星號的圖解名稱，對到同一科目題庫裡答案／可接受答案（中文或英文，`/` 分開）或標籤剛好是該名稱的題目，再加上直接加星號的題目；`Store.filter({starOnly:true})` 以這份清單篩選，可和題本範圍、題型同時使用（交集）。深淵在冒險中每次抽題也套用（`run.js` 傳 `starOnly`），設定記在 `profile.abyssCfg.starOnly`；首領戰仍用原本的首領題池。
- 深淵遠征「出題」預設改成「未作答＋錯題優先」（`pref: 'smart'`，v139）：`run.js` 的 `drawQuestion` 先從沒作答過＋錯題（錯題本未畢業或上次答錯）裡隨機抽，單題來看錯題機率約為未作答的 3 倍；兩種都抽完才出寫對過的題。「隨機」仍是另一個選項。舊存檔的 `abyssCfg` 沒有 `pref2` 時一律改用新預設（使用者要求），之後選過就記住。
- 自由遠征也加「出題」（v140）：預設「未作答＋錯題優先」，另有隨機／未作答優先／錯題優先。`screens.js` 的 `prefOrder` 在 `buildQueue` 排題：加權隨機排序（錯題權重 3），寫對過的排在最後；題組以第一題判斷。冒險地圖（`ordered` 或沒有 pref）維持原本行為。
- 同部位降權（v141）：`Store.partKey(q)`＝看圖寫名稱填答題（答案「中文 / English」）以中文名當部位，其他題各自一個；`Store.smartWeight`：錯題 3、沒作答 1、沒作答但同部位已在別題答過 0.3、寫對過 0。深淵 `drawQuestion` 依此權重抽（每抽一次重算，所以這一場剛答過的部位也會馬上降權）；自由遠征 `prefOrder` 依此加權排序，並把同一場裡重複的部位排在所有「第一次出現的部位」之後，寫對過的最後。
- 看圖寫名稱題分兩格（v142）：`js/question.js` 的填答題，若每個 accept 都是「中文 / English」，就顯示「中文名稱」「English name」兩格（中文格 Enter 跳英文格、英文格 Enter 送出），兩格都要對才算對（任一組 accept 的中文與英文都用 `U.sameAns` 比對）；遠征、題庫練習、學習實戰共用。其他填答題維持一格。
- 星號篩選分兩種（v143）：「★ 只刷星號部位本身」（`starOnly:'exact'`，只收答案就是該部位的題，例如各張圖上問頸內動脈的看圖題）與「★ 星號部位＋相關題」（`'related'`，再加標籤相同的題；舊設定 `true` 視為 related）。兩個 chip 互斥、再按一次關閉。`LEARN_UI.starredQids(mode)`。

## 韓文：字母單元（2026-10-22，v145）

- 新科目 `korean`（韓文，theme lang，`content/project.json`）與單元 `content/learn/korean/hangul-letters.json`：6 課（字形原理 4 張卡、基本子音 14、雙子音 5、基本母音 10、複合母音 11、全部 40 個一覽）。使用者要求「像眼解剖實驗那樣點開、聽發音、看字形由來，不要練習題、不被學習框架鎖住」。
- 新步驟類型 `letters`（`js/learn.js` 的 `renderLetters`、`tools/build.py` 檢查、`css/style.css` 的 `.kl-*`）：`{type:'letters', lang:'ko', title, body, groups:[{name, desc, items:[{ch, name, roman, say:[{label,t,roman}], desc, img?, ex:{w,roman,zh}}]}]}`。點字母開視窗並自動念第一個 say，可聽名稱／收尾／例字，◀ ▶ 或方向鍵換字，不計分、不進複習盒。
- **讀音用注音標近似音，不用羅馬拼音**（使用者要求）：`roman` 欄位實際放注音（字母格子、🔊 按鈕、例字），`(ㄍ)(ㄉ)(ㄅ)` 括號＝收尾嘴型做到但不放開，「緊」＝緊音；說明文字也不用英文字母比喻。第 1 課開頭有讀法說明。
- 單元層級 `calm: true`：這個單元不顯示戰鬥條與戰鬥切換（`play()` 內的 `BON()`），不改使用者的全域戰鬥設定。
- 發音：`GLOSS.speak(text, {lang:'ko'})` 先播 `assets/tts/ko/<每個字 Unicode 十六進位用 - 連接>.mp3`（109 個，約 900 KB，Google 翻譯語音合成），沒有檔案才連 Google 線上語音，最後 speechSynthesis。新增字詞後執行 `python tools/tts/gen_lang.py`（只下載缺的）。
- 示意圖 `img/korean/*.svg`（側面發音器官：ㄱ 舌根擋喉、ㄴ 舌尖貼齦、ㅁ 口、ㅅ 齒、ㅇ 喉；天地人母音）是自繪示意圖，依《訓民正音》解例本制字原理；發音說明以現代首爾標準語、羅馬拼音用 2000 年國語羅馬字表記法。
- QA：`tools/korean-qa/check.cjs`（桌機＋390px，6 課逐步、40 字母逐一開啟、發音請求都走本機音檔、圖載入、無橫向捲動、calm 無戰鬥條、無頁面錯誤；262 項通過）。沒有實機 iPhone 播放測試。

## 手機按著按鈕滑動不再誤點（2026-10-22，v146）

- 使用者回報：手機上手指從按鈕上開始往上／下滑，常滑不動、還會點進那顆按鈕。原因主要是 iOS 疊在所有按鈕上的透明原生開關（`.hap-sw`）會吃掉手勢。
- `js/audio.js`（HAPTIC 內）：任何裝置一次觸控移動超過 10px，放開後的 click 在 400ms 內一律擋掉（window capture；下一次 touchstart 會清除）。從 `.hap-sw` 開始的滑動，先看瀏覽器有沒有自己捲；沒有的話由程式跟著手指捲最近的可捲動區塊，放開後有慣性。瀏覽器自己會捲時不插手。
- 測試（Chromium 模擬 iPhone 13／Pixel 7 觸控）：從按鈕開始滑會捲動、不會點進去；原地輕點照常點進去；把開關設成 `touch-action:none` 模擬 Safari 擋捲動時，程式捲動也正常。**沒有 iPhone 實機測試**。

## 介面流暢度與美感優化（2026-10-22，v147）

- 課程正文、檢核題、題庫題目／選項、詳解改用標楷體（`--kai` 字型堆疊：DFKai-SB／BiauKai／標楷體…，沒有系統楷體的裝置如 iPad 用 Google Fonts「LXGW WenKai TC」補；離線時退回 serif）。標題、按鈕、標籤、提示框標題維持像素字 Cubic11。規則在 `css/style.css` 最後一段。
- 課程播放器：底部「上一頁／繼續」固定在畫面下方（`.lp-foot` sticky）；桌機顯示「Enter ↵ 繼續」提示；手機在正文左滑＝繼續、右滑＝上一頁（圖、互動、表格、輸入框、可橫向捲動區不觸發）。作答後改用 `focusNext()`（`js/learn.js`）：焦點移到繼續但不讓瀏覽器自動捲，只在詳解超出畫面時捲動，題目開頭不會被戰鬥條蓋住。全站加 `[hidden]{display:none !important}`（原本 `.lp-prev` 的 display 蓋掉 hidden，第一頁也出現上一頁）。
- 閱讀模式：課程標題列「📖 閱讀模式」切換 `<html>.read-light`，正文改米色紙張底（只覆寫 `.lp-body` 內的 CSS 變數與 hl-*／co-* 顏色），存在 localStorage `readLight`（不進存檔）。
- 營地：最上方快捷列（繼續上次的課／開始學習、繼續遠征、題庫、錯題重刷）；`LEARN_UI.lastInfo()` 與 `App.go('learn', { resume: true })` 直接接著上次的課。營地場景可收起（`Store.settings.campFolded`）。修正 hub HTML 少關一層造成統計擠到右欄、選單跑到格線外；860px 以下選單排在統計前面。功能磚 emoji 圖示換成像素圖（學習模式＝羊皮紙 66、AI＝賢者 84、番茄鐘＝紅藥水 115、提示詞＝question、導入＝寶箱 89、3D 圖譜＝eye、視光室＝102），說明文字縮短；深淵遠征／導入素材不再另外上色。第一次選夥伴時背景顯示調暗的營地。
- 題庫：篩選區可收起，上方固定摘要列（目前條件、題數、出征按鈕），收合狀態存 localStorage `bankFilters`；固定位置用 `--topbar-h`（main.js 以 ResizeObserver 更新）。
- 視覺：課程圖片加深色外框與陰影、底色改米白；題卡紙張 `--paper` 調暗為 #f1ead9；學習目錄左邊條變細、單元卡片撐滿寬度。手機（≤480px）頂部標題可省略、等級徽章收起。
- 沒做：延後載入 `data/learn.js`（6.7 MB，gzip 約 1.2 MB，之後有快取）；學習模組、匯入器、AI、字典、營地都在啟動時讀它，改動風險高，暫不處理。
- QA：獨立 headless Edge（HTTP，1100px 與 390px 觸控）35 項通過（含 Enter 與左滑換頁、作答後題目可見、閱讀模式、題庫摘要列、營地收起、無頁面錯誤）；`tools/learn-battle-pin-qa/check.cjs` 30 項回歸通過。沒有實機 iPad 測試；標楷體在 iPad 上是用 LXGW WenKai 替代，需連網。

## 小工具縮放更流暢（2026-10-22，v148）

- `U.grip`（`js/util.js`）：pointermove 只記最新位置，每個畫面更新（requestAnimationFrame）套用一次；拖曳中面板加 `.win-resizing`（關掉動畫與選字、iframe 不吃事件），並發出 `winresizestart`／`winresizeend` 事件。只有計算機（minH 0、等比例縮放）才在拖曳中量實際高度。
- 計算紙（`js/pad.js`）：拖曳時畫布固定在原尺寸（CSS 變數 `--cvw`／`--cvh`），不再每格重配畫布、重畫全部筆跡；放開後重畫一次。觸控時把手可按範圍加大（`.win-grip::after`）。
- QA（headless Edge 1200px）：計算機、計算紙、AI 助教拖曳時每格 p95 17 ms（60 fps），尺寸正確保存、計算紙筆跡保留，無頁面錯誤。手機直式只調高度的路徑邏輯沒改，未另做實機測試。


## 新職業與第二批造型（2026-10-24，v149）

- 新增影刃 `assassin`、武僧 `monk`、吟遊詩人 `bard`，各男／女 8 款；原五職業各追加男／女 4 款（`m5..m8`／`f5..f8`）。合計 **128 款圖集造型，1,024 個原繪姿勢**，其中 88 款本次新增。每款待機／眨眼／四招／爆擊蓄力與重擊，由共用播放器組成動畫；PNG 正本未程式改繪。
- 新職業解鎖費 140／150／160 魂晶；各職業 `m1`／`f1` 造型免費，預設穿 `m1`。`js/store.js` 管預設，`js/heroes.js` 管售價：原款價格不變，5～8 款為 200／220／240／260。保留舊造型 ID、已購造型與騎士免費薔薇近衛；不重設存檔、不另送禮物。兌換券排除所有免費款，衣櫃計數依實際清單。
- 能力／15 技能在 `js/content.js`、`js/run.js`：影刃滿血先手與閃避，武僧連擊護盾，吟遊詩人第四次答對增傷與治療。`js/fx.js` 各四招與爆擊；`js/learn.js` 沿用既有課程流程，補新職業被動與各自的能量必殺技。
- 圖片快取保留最近 24 張，另保護畫面內／出招中的角色，避免瀏覽衣櫃後一直持有 128 張已解碼圖集。`HeroAnim.cacheSize/cacheLimit` 可唯讀檢查；靜態姿勢與播放共用 2px 畫布邊界。
- 產製與接手：[SESSION_NOTE_HERO_EXPANSION.md](SESSION_NOTE_HERO_EXPANSION.md)。設計／每款完整提示詞：`docs/hero-art/expansion-old-actors.json`、`expansion-new-actors.json`；生成與修正原路徑在同目錄的 expansion generation logs／`generation-old/`／`generation-root/`。原先 40 張 PNG 的 Git blob 比對完全相同。
- 圖集正本仍在 `assets/heroes/`。`python tools/sync_hero_expansion.py` 合併 128 款 registry／manifest，之後 `python tools/hero_atlas.py` 生成 metadata；不要手改 hero-atlas.js。`--allow-missing` 只供產製中準備 registry，不能當完成檢查。舊版固定 40 款的 QA 工具不適用本版，改用 `check_hero_expansion*.cjs`。
- 展示頁 `docs/hero-art/preview.html` 可 file://，按職業切換 16 款並試播；快取 v149。驗證與界限見交接文件及 `docs/hero-art/expansion-*-qa.json`。Edge 的 file:// 畫布受來源規則限制，像素讀取在 HTTP 驗證，離線流程另測；沒有實機 iPad 或真實帳號雲端往返驗證。

- 本版正式 QA：88 新圖集／128 atlas、1,024 姿勢、128 購買換裝、8 職業實際答題、640 次動畫、154 項 1000／390px 路線／存檔、32 支 JS 與 strict check 全通過。摘要 `docs/hero-art/expansion-qa-summary.json`；獨立 context 的 localStorage 已還原。

## 加入錯題本按鈕、視光學國考同題型分組、未刷過題型優先（2026-10-25，v150）

- 題目上方「☆ 收藏／收藏資料夾」旁新增「＋ 加入錯題本／✓ 已在錯題本」（`js/favorites.js` 的 `buttons()`，所以遠征、題庫練習、學習模式的題庫實戰、題庫卡片都有）。`Store.setWrongbook(id, on)`／`Store.inWrongbook(id)`；手動加入的紀錄 `n: 0, manual: true`，之後連續答對 2 次一樣會畢業，錯題本列表顯示「（手動加入）」。`Store.record` 會發 `wrongbookchange` 事件，答錯後按鈕自動變成「已在錯題本」（避免誤按移出）。
- 同題型分組正本：`content/patterns/optometry.json`（格式 `xd-patterns/1`，說明在 `docs/格式_題庫.md` 最後一節）；人工檢查清單 `docs/視光學_題型分類.md`。範圍＝視光學科目全部歷年國考題 810 題（114 大一下 01～09 單元、115 大二上視光學二），逐題人工判讀：141 組、429 題；其餘 381 題各自獨立。原則：解法與算法完全相同、只換數字或小改選項（含同一題重考）才同組；換未知數、多一個步驟、換寫法都分開。`tools/build.py` 的 `build_patterns` 檢查並輸出 `QB.patterns`／`QB.patternNames`。
- 自由遠征與深淵遠征新增「同類題：🧩 未刷過題型優先」（預設關，深淵記在 `profile.abyssCfg.patFirst`）。`Store.typeKey`／`typesAnswered`／`typeFactor`：同組有任何一題作答過，其他題權重 ×0.15（目前仍是錯題的不降）；自由遠征 `prefOrder` 另把同一場裡重複的題型排到後面；深淵 `drawQuestion` 每次抽題重算。其他科目還沒分組時這個選項不影響出題。
- QA（headless Edge HTTP，獨立 context）15 項通過：分組資料完整、遠征／題庫／學習實戰都有按鈕且可切換、答錯後自動顯示、勾選後已刷題型的同類題在自由遠征出現比例 16.5%→2.9%、深淵 400 次抽題 87→9 次、同一場前 120 題沒有重複題型、無頁面錯誤。分組沒有經過老師審核；沒有實機 iPad 測試。

## 收藏整頁、錯題本併入題庫、複習頁改成「弱點知識點」（2026-10-25，v152）

- **收藏此頁**：課程每一頁標題列右邊「☆ 收藏此頁」（`js/learn.js` 的 `pageRef`／`starButton` kind `page`），存在 `D.starred`（key＝`["page", 單元, 課, 第幾頁]`，另存頁面標題 `t`，教材改版頁序變動時用標題找回）。知識筆記「★ 星號收藏」多了「收藏的頁面」篩選，`pageCard()` 照原頁內容顯示：概念卡、回顧照筆記樣式，範例步驟全部展開，檢核題附答案，實戰頁列出題庫題（點開閱讀視窗），圖解用 `renderDiagram` explore 模式、互動頁用 `renderInteractive`、字母卡用 `renderLetters` 在畫面放好後接上（`data-page-live`）。「到這一頁 ▶」用 `openPage` 讓 `play()` 開課後跳到那頁（只能跳到讀過的範圍；已上完的課可直接跳）。為了讓一個畫面能同時放好幾個圖解／互動，`renderDiagram`、`renderInteractive` 內的 `U.$('#id')` 改成只在自己的容器裡找。
- **營地與題庫**：營地移除「錯題本」「錯題重刷」兩個磚與快捷列的錯題重刷（`wrongRunModal` 刪除）；題庫頁上方有「📚 全部題目／📕 錯題本（N）」分頁（`bankTabs`／`bindBankTabs`，`js/screens.js`），錯題本頁仍有「錯題重刷遠征」。題庫磚說明顯示錯題本未掌握數。
- **複習頁**：最上面改成「🎯 弱點知識點」（`weakPoints`／`weakSection`／`bindWeak`）：學習模式答錯的檢核題（`D.rev[id].w`）對回題目前面最近的概念卡（實戰裡的自編題對回整課）；圖解辨識測驗第一次點錯記在 `D.miss`（`noteTermMiss`），對回該構造；題庫錯題本未畢業的題目用標籤對到 `teaches` 有教它的課（同科目）。每點可「看重點」（概念卡＋你答錯的題與答案／構造原圖與說明／有教這個考點的課與相關概念卡＋錯題本題目）、「再練」（`reviewRun` 只出這幾題）、「練題庫題」（list 遠征）、「回到這一頁／回圖解再認一次」、「我懂了」（`D.cfg.known[key]`＝當時答錯次數，之後再錯才重新出現）。原本的間隔複習移到下方「🗓 記憶卡複習」，說明改成白話（1、2、4、7、15、30 天後再考）。資料都在學習存檔 D 內，跟著備份與雲端同步。
- QA（headless Edge HTTP，桌機 1100px＋手機 390px 觸控）：收藏此頁 22 項（各頁型在筆記的呈現、跳頁、取消、存檔）＋營地／題庫分頁／弱點知識點 30 項（實際在圖解測驗點錯會進弱點、看重點三種內容、我懂了、再練、練題庫題、回到這一頁）全部通過、無頁面錯誤。沒有實機 iPad 測試。

## 遠征選題的範圍統計（2026-10-26，v153）

- 自由遠征、深淵遠征、冒險地圖的出發視窗，在「符合條件／題池」下面多一行：已刷 N 題・未刷 N 題｜題型 N 種：已刷 N・未刷 N（`js/screens.js` 的 `scopeStats`／`scopeLine`）。刷過＝作答過至少一次；題型＝`content/patterns` 的同類題分組（`Store.typeKey`，沒分組的題目各算一型，畫面會註明有幾題沒分組），同組任何一題作答過就算這個題型刷過，和「未刷過題型優先」同一套定義。
- QA：`tools/scope-stats-qa/check.cjs`（headless Edge file://，1100／390px，17 項：數字與 Store 計算一致、作答同類題組一題只讓題型 +1、三個入口都有、無橫向捲動、localStorage 還原），結果 `docs/scope-stats/qa.json`。
- 視光學國考題各年份題數差異（2026-10-26 查證，不是轉換錯誤）：114 大一下視光學 04～09 單元的國考題 1:1 來自原遊戲題庫 `資源/114 大一下/.來源/_data-optometry.js.json`（與 content 完全相同）。110 年起減半是因為 106～109 年每年有特考＋高普考兩次（每年 18 份卷），110 年起只剩高普考（9 份）。113、114 年師高「視光學」沒收的題，經逐題人工複查，大多是雙眼視覺、斜視、AC/A、固視偏差、弱視、色覺、調節反應檢查（Nott／MEM／FCC）等**目前沒有任何單元教**的內容，不是漏收。
- **114 年驗光生普考《驗光學概要》已補上（v154）**：原本 `E:\學習\驗光師國考題\驗光生\驗光學概要\114年驗光生普考.pdf` 只有答案頁；已從考選部官方下載試題（`wwwq.moex.gov.tw/exam/wHandExamQandA_File.ashx?t=Q&code=114100&c=110&s=0907&q=1`，檔名 114100_2110.pdf，代號 2110）與標準答案（`t=S`，和原本那頁逐位元組相同、無更正備註），合併成 5 頁放回原檔名（格式同其他年份）；原檔備份在同資料夾 `_原檔備份\`。
- 補收 46 題（題幹、選項、答案取自官方 PDF，詳解自編）：114 驗光學概要 31 題（第 01 單元 8、02 單元 2、03 單元 1〔新題本 `s114-optometry-exam114-u03`〕、05 單元 3、06 單元 2、07 單元 1、09 單元 5、視光學二 MSR 7〔新題本 `optom2-exam-u2-114-sp`〕、雙眼平衡 2〔新題本 `optom2-exam-u4-114-sp`〕）＋ 113／114 師高視光學人工複查補收 15 題（第 01 單元 6、02 單元 2、04、07 單元各 1、09 單元 2、視光學二 MSR 3）。不收：3 題與老師講義原題相同（114 生普 19、22、26），16 題超出現有教材（不等像測試、對比敏感度、色覺、Worth 四點判讀、Hirschberg、Park 三步驟、隱形眼鏡選擇、NRA/PRA、Nott／MEM／FCC、C 字視力表）。題號 n＝`sp-rf-<題號>`／`vh-op-<題號>`（視光學二題本直接用題號）。三個新題本已加進對應單元 `banks`（第 03 單元另加進國考複習課的 `pick.exams`），`--strict` 覆蓋檢查全過。官方答案與課堂說法有出入的題（114 生普 33 MPMVA 終點、45 加鏡後的調節幅度、40 焦線名稱）在詳解中兩種說法都寫。產生腳本在專案外（scratchpad），內容正本是 content/，之後直接改 JSON。檢查：`tools/optom2-gen/check-114-import.cjs`（46 題逐題渲染、作答、詳解、banks 與抽題池）。

## 深淵戰鬥範圍進度（2026-10-28）

- 戰鬥題目上方顯示範圍已刷／總題數，可展開題型已刷／總數；js/battle.js 的 updateAbyssProgress 使用 Run.pool 與 Screens.scopeStats，作答後即更新，不增加存檔欄位。快取版本 v158。
- 檢查：tools/abyss-progress-qa/check.cjs（獨立 Edge context、file://）；結果 docs/abyss-progress/qa.json。

## 眼解剖生理學 大二上：房水單元、逐字稿融合、國考補收（2026-10-30）

- 新單元 `content/learn/eye_ans/aqueous/aqueous-ciliary.json`（房水與睫狀體，8 課，最後一課國考重點總複習）＋題本 `content/bank/eye_ans/aqueous/`（19 本、33 題國考題）。來源：`E:\學習\大二上\眼解剖` 講義與 10/17 兩段錄音（MP3＋音量校正後重新轉錄，Sonnet 校稿：`逐字稿\校訂逐字稿\*\Sonnet校訂_時間戳.txt`）。
- 既有 11 個大二上單元（自主神經 5、血液供應 3、角膜 3）重寫或補強，融合老師上課逐字稿；老師說會考的地方標「🧑‍🏫 老師說會考：…（出處：檔名 時間戳）」，只是強調的標「🧑‍🏫 老師強調：」。每個單元最後一課都是國考重點總複習（易混淆總對照表＋國考題逐步講解＋實戰）。國考出處寫法統一為「<年> 師高／師特／生普／生特 <題號>」。對照筆記在 `docs/drafts/`（未提交，`teacher-exam-points.md`、`lesson-notes/`）。
- 國考補收（只收大二上範圍）：以 `E:\學習\驗光師國考題` 106～114 年眼球解剖生理兩科全卷逐題比對，已在題庫的不重收；新增 21 題（房水 13、角膜 4、三叉神經 4），題號 n 規則照既有 exam115（師高 <100、師特 1xx、生普 2xx、生特 3xx），詳解自編。其餘關鍵字候選經判斷為超出單元教學範圍，未收。
- **注意（Windows 工具）**：用 PowerShell here-string 管線（`@'…'@ | python/node`）送中文腳本時，PowerShell 5.1 會把中文換成「?」寫進檔案。這次房水 l1、角膜營養 l1 就是這樣壞掉，已從 Codex 執行紀錄還原。產生內容請用檔案腳本或 Bash 管線，寫完 `grep -rn '???' content/` 檢查。
- QA：`python tools/build.py --strict --index` 通過（只剩既有符號提醒）；`tools/learn-redo/sweep.cjs` 12 個單元 2,258 頁 0 問題；`tools/eye115-qa/check.cjs` 80/80（已改成易讀版規則：複習課只要求有 🎯，不再要求每張卡都有 ✏️）。沒有醫學審稿、沒有實機 iPad 測試。
- **角膜 9-21 錄音（2026-10-30 補做）**：`E:\學習\大二上\眼解剖\上課錄音\9-21-2.mp4`（前半）＋`9-21.m4a`（後半）用 MedicalTranscriber `worker.py` large-v3 轉錄（config 要有 `cancel_file`、glossary ≤180 tokens、run_name 不可重複）；Codex 初校（未逐句回聽）存 `逐字稿\校訂逐字稿\20261030_眼解剖_角膜_9-21\`（含素材包、待確認片段）。角膜三單元已融入：老師說會考 8 條（五層方向、Bowman 不再生、失養症三型、產傷／Haab 紋方向、內皮密度、Descemet 與內皮無神經）、老師上課補充與比喻；可疑辨識只標「錄音待重聽」或不採用。
- 同日題庫：大二上 123 題國考題過短詳解補成「考點／逐選項／記法／出處」格式（題幹、選項、答案逐題比對未變）；8 題標「⚠️ 答案疑義」（ans-clinical-106 #28、ans-pathways-113 #223、ans-reflex-109 #318、ans-trigeminal-108 #31、-113 #206、blood-ciliary-110 #215、blood-retina-112 #211、cornea-layers-109 #8），官方答案未改。另修 5 張卡片「本題／此題」字樣與角膜營養 l1 重複句、改寫雜湊頁。
- **12 個國考總複習課審閱（2026-10-30）**：大二上 12 個單元的最後一課（自主神經 5、血液 3、角膜 3、房水 1）依同一標準改寫：intro＝考點地圖（編號列出全部考點＋代表出處）→ 一個考點一張卡（`[!big]` 結論＋短表／flow＋exam 2～4 條含出處）→ 原有 check 原文保留、缺題考點補國考型 check → 易混淆總對照表 → 3～4 個國考題逐選項例題 → practice 連結本單元國考題（ans-basics 本單元只有 3 題，借用其他自主神經題本補到 8 題；房水連結全部 20 題避免孤兒題）→ recap。老師說會考標記全部保留。工作說明與檢查器在 `tmp/review/`（task-common.md、verify.py：check 原文、老師標記、亂碼、qid 存在且為國考題）。嚴格建置、eye115 80/80、12 單元逐頁 2,342 頁 0 問題。無醫學審稿。
- **emomo說會考：角膜・房水與睫狀體（2026-10-30）**：`content/learn/eye_ans/emomo/emomo-cornea-aqueous.json`（order 31，path `115 大二上 → emomo說會考`，一課）。依 9/21 角膜兩段、10/17 房水兩段逐字稿全文（另含 10/05、10/12 提到角膜無血管的考題段）整理老師強調的 46 條，依原話分級：⭐⭐⭐ 明說會考 15（`[!key]` 框）、⭐⭐ 說要記 20（`[!tip]`）、⭐ 只說重要 11（`[!note]`）；考點地圖依級距分組，卡片標題前標星號，出處寫「角膜上 9/21 00:10:28」這種格式。老師口誤（540 nm、β blocker 抑制鈉鉀幫浦、內皮每年流失 20 幾 %）在卡上以 ⚠️ 標正確說法。清單與未收理由在 `tmp/emomo/inventory.md`（未提交）。20 個國考出處已對題本核對；嚴格建置通過、逐頁 94 步 0 問題。無醫學審稿、未逐句重聽錄音。

## 眼解剖實驗期中總複習（跑台，2026-10-30，v160）

- `content/learn/eye_anat/midterm-review.json`（id `eyelab-midterm`，path `眼解剖實驗 → 期中總複習`，order 0）三課：實驗手冊總複習（約 70 分；手冊第 1、2、4、5、8、10 頁，132 列）、實驗課複習（老師講義三單元＋鋸齒緣、瞼板腺，150 列）、眼解剖生理學正課提及總複習（約 30 分；血液供應與自主神經 7 份逐字稿提及 ≥3 次的可見大體構造，依次數排序，77 列）。每課＝一頁長清單＋40 題跑台模擬（既有跑台題庫）＋回顧。
- 新步驟類型 `termlist`（`js/learn.js`、`css/style.css` 的 `.term-*`、build／importer 已認得）：分組列「中文｜English｜🔊｜📍 位置」，📍 預設收起、展開才載入該構造在所有圖鑑圖上的紅圈位置；搜尋、全部展開／收起。⭐＝老師在逐字稿裡明說會考（實驗課兩課依眼解剖實驗逐字稿，表在產生器 `LAB_EXAM`，附檔名與行號；正課課依眼解剖生理學逐字稿）。《會考的.html》是使用者自己勾的清單，**不可當成老師說會考**。
- 跑台用人體切片與模型：**靜脈、靜脈竇不列；神經核、細胞、細微構造（Zinn–Haller、微血管、神經叢）不列**。視網膜四分支小動脈、虹膜大動脈環依使用者要求列入；只標大致位置的點照列，圖說註明「紅圈為大致位置」；正課計數把「顳上／鼻下」等簡稱算進四分支（「…靜脈」除外）；頸靜脈孔是骨孔照列；動靜脈合標只留動脈。排除清單與提及次數在 `tmp/midterm/selfcheck.md`。
- **補充圖（各種角度）**：`tools/midterm/extra_views.json`（21 張公有領域 Gray 圖，存 `img/eye-lab/extra/`；另含舊圖 gray188／190／193 補上的點位），產生器把它們加進各構造的 📍 views（名稱對不到會報錯）。點位依格線放大定位、紅圈疊圖核對（工具 `tmp/views/grid.py`，未提交）；非專業審稿。只有一張圖的構造 105 → 46；剩下多為小分支（眼瞼動脈弓、篩動脈／神經、睫狀動脈、四分支）、視神經分段、梅氏／鮑氏環，需要專門圖再補。
- 每列名稱旁 ☆ 可單獨收藏：指向該構造第一張原圖的那一點（views 帶 p／l／name，同 `termRef`），收進知識筆記星號收藏；同構造在別張圖已收藏時顯示 ★。測試 `tools/midterm/star-check.cjs`（14 項）。
- 產生器 `tools/midterm/build_midterm.py`（可重跑，掃 eye_anat 圖鑑 diagram 點位）、檢查 `tools/midterm/check.cjs`（112 項通過）、截圖 `tools/midterm/_shot.cjs`。補圖之後重跑產生器即可。
- 課程地圖跳頁：課文寫 `[[卡片標題|顯示文字]]` 會變成跳到該卡的連結（emomo 考點地圖使用）。

## 答案疑義題本（2026-10-30，v162）

- 題本 `set.optIn: true`＝只有明確勾選才出題：`Store.filter` 沒指定題本（全部）時排除，`Screens.setPicker` 上層「全選」也不含（只有 optIn 的那一層全選才會選到）。
- `content/bank/eye_ans/disputed/eye115-disputed.json`：8 題選項措辭有歧義的國考題（path `115 大二上 → 答案疑義（要自己勾選才會出題）`），已從原題本、學習單元的實戰／例題 qids、知識筆記 evidence 移出（題目 id 改成 `eye115-disputed-<n>`，舊作答紀錄不沿用）。已核對考選部標準答案與更正答案：9 題（含 108 生特 6 角膜與鞏膜題）都無更正；報告 `tmp/official/report.md`。教材文字裡的出處（如「110 生普 15」）保留。

## 背景商店與營地布置、彈珠模式要登入（2026-10-30，v163）

- **彈珠刷題／彈珠學習要先登入雲端同步**：`js/peglin.js` 的 `loginGate`，沒登入（`CLOUD.signedIn` 為假）只顯示「🔒 請先登入」與「☁ 登入雲端同步」按鈕（開 `CLOUD.open()`），登入完成後自動進入原畫面。舊的 `tools/peglin-web-qa/check.cjs` 要先模擬登入才能測遊戲流程。
- **背景商店**（營地選單「角色與收藏」→ 🛍 背景商店，`App.go('decor')`；營地標題列也有「🛠 布置營地」「🖼 場景」「商店」）：`js/decor.js`（`DECOR`）＋`css/decor.css`。規格正本 `docs/背景商店設計.md`（物件清單、卡池、機率、保底、碎片、價格、存檔格式）。
  - 素材：66 件物件（6 系列各 10 件：木屋小窩、森林精靈、學院書房、海濱假日、和風庭園、星辰魔法，N／R／SR／SSR；另有 6 件雜物）＋ 8 張場景（1536×384）在 `assets/decor/`，由 Codex 用 image_gen 生成後轉成真像素格、二值透明。清單 `assets/decor/manifest.json` → `python tools/decor_data.py` 產生 `js/decor-data.js`（勿手改）。**中文名稱與介紹的正本在 `tools/decor_text.py`**（曾被 PowerShell 管線弄成「?」），改完依序跑 `decor_text.py`、`decor_data.py`；素材檢查 `python tools/check_decor_assets.py`（結果 `docs/decor/asset-check.json`），審圖總覽 `docs/decor/contact-*.png`。
  - 經濟：單抽 20／十連 180（保證 SR 以上）；雜物 12%、N 50%、R 27%、SR 9%、SSR 2%（場景和 SSR 物件平分）；每池 60 抽保底 SSR。碎片：N／R 3 片、SR 2 片、SSR／雜物 1 片解鎖一件，之後每湊滿一份多一件可擺；雜物退 2 魂晶、重複場景退 30。直購：木屋／森林／學院的 N 40、R 90；場景海邊 300、秋楓 300、櫻花 350、雪原 400。卡池：冒險者雜貨（木屋＋森林＋學院、魔法圖書館）、海風與櫻（海濱＋和風、浮空島）、星辰祕庫（星辰魔法、水晶洞窟、星空天文台）。
  - 存檔 `Store.profile.decor`（shards／scenes／scene／placed〔x、y 為比例〕／pity／log），隨 exportAll 與雲端同步；舊存檔自動補預設（經典草原、未擺放）。經典草原沿用原本 CSS 營地；圖片場景 `night: dim` 依時段調暗、`self`（圖書館、水晶洞窟、天文台）不調暗。布置模式可拖曳（滑鼠／觸控）、翻轉、收回，最多 40 件；抽屜物件在觸控裝置是點一下放入再拖曳。
- **場景四個時段（v167）**：8 張圖片場景各有早晨／白天／黃昏／夜晚四張重畫的圖 `assets/decor/scenes/<id>_<morning|day|dusk|night>.png`（Codex 以原圖為參考逐張編修，地面線對齊、檢查器比對四張的地面位置，誤差 0px；原 `<id>.png` 保留）。manifest 每個場景有 `tod`，營地依 `timeOfDay()`（自動或營地時段按鈕）換圖，有 `tod` 的場景不再用 CSS 調暗；商店場景卡顯示四個時段小圖。審圖 `docs/decor/contact-scenes-tod.png`，產生紀錄 `docs/decor/tod-generation.json`、`tools/decor_tod.py`。
- **基本物件也能拖曳（v168）**：布置營地時，告示板、篝火、信箱、花盆、池塘也能拖曳（基本物件不能收回）。位置存 `Store.profile.decor.base[key] = {x, y}`（比例座標），舊存檔沒有 `base`＝原本位置不變；抽屜「↺ 基本物件回原位」清除。布置模式外原本的點擊功能（篝火、每日任務、信箱、澆花、釣魚）照常，布置中不觸發。390px 預設版面勇者會蓋住信箱（原本就如此），可把信箱拖開。
- **基本物件重畫（v171）**：篝火、池塘、信箱、花盆、告示板改用和背景商店同一套像素風格的新圖（`assets/camp/`：`fire.png` 4 格火焰動畫、`pond.png` 4 格水波、`mail.png` 有信／已讀兩格、`pot.png` 0～4 階段、`board.png`），用 CSS `steps()` 播放（`css/style.css` 的 `.camp-art`／`.fire-art` 等）；外框尺寸維持原本（拖曳座標不變），夜晚／黃昏的濾鏡和背景商店物件一樣，篝火不調暗。產生腳本 `tools/decor-qa/make-camp-art.py`（可重跑）。v172 修正切邊破圖：舊腳本的裁切框比原圖小（火焰、石圈、池塘右邊與下緣被切掉）且池塘被壓扁，現在依原圖實際範圍＋邊距裁切、等比例縮放貼底置中；篝火改成拉伸火焰部分做跳動；池塘改成 64×38 原比例（`.camp-pond` 寬 min(128px,17%)，手機 21%）。舊的 SP／PetArt 圖仍保留給其他畫面。decor QA 230/230。
- **勇者與夥伴也能拖曳（v169）**：布置營地時勇者（`data-base="hero"`）、夥伴（`"pet"`）跟基本物件一樣拖曳，存在 `profile.decor.base.hero／pet`，「↺ 基本物件回原位」一起清除，舊存檔不動。夥伴原本靠 `left%` 走來走去：有存位置時 `styleBase` 先把 left 歸回 52% 再算 translate，所以整個走動範圍跟著移動；布置中暫停走動。布置中勇者與夥伴 z-index 降到 1，避免它們很大的外框擋住後面的信箱與物件（還是拖得到沒被擋住的部分）。腳下陰影、待機動畫、布置模式外的點擊（勇者說話、摸夥伴）照常。decor QA 228/228（含夥伴拖曳）。
- QA：`tools/decor-qa/check.cjs`（Playwright＋Edge 一次性 context、file://、1100／390px，98 項：購買、單抽／十連、20,000 抽機率、十連保證、保底、碎片門檻、實際拖曳與重載、場景切換與夜間濾鏡、匯出匯入、舊存檔、彈珠未登入被擋、無頁面錯誤），結果 `docs/decor/qa.json`、截圖 `output/playwright/decor-*.png`。沒有實機 iPad／手機測試。

## 魂晶平衡（2026-10-30，v165→v166）

- 數值集中在 `js/content.js` 的 `C.GEMS`（`trialStep`、`free`、`abyss`、`learn`、`peglin`），要調整只改這裡。
- 盤點基準（約略，一題 30～45 秒）：深淵一場約 60～80 題、45～50 分鐘，基礎約 400（答對 2、擊殺 3、精英 5、樓層、首領 25、每章 15、通關 25＋40、密室 80），試煉加成後約 7～9／分鐘。支出：背景商店單抽 20／十連 180、造型 160～260、職業解鎖 140～160。
- 對照表（前→後）：

| 項目 | 調整前 | 調整後 |
|---|---|---|
| 深淵每級試煉加成 | +15%（X 級 ×2.5） | +6%（X 級 ×1.6）；基礎量不動 |
| 自由遠征答對／通關／題目用盡 | 2／25／8 | 3／40／20（20 題約 95→130，約 8／分鐘） |
| 學習模式每題第一次答對 | 0 | 4（完成一課時結算） |
| 學習模式第一次完成一課 | 3＋星數×2 | 10＋星數×5（之後只補星數差額，每星 5） |
| 學習戰鬥評等 S／A | 3／1 | 10／4 |
| 學習模式一課合計（15 分鐘、12 題） | 約 20～25 | 約 80～90（約 6／分鐘） |
| 重上已完成的課 | 評等照給 | 答對與評等 ×0.25、完成獎勵只補差額 |
| 彈珠刷題第一次答對 | +1 | +3 |
| 彈珠學習檢核／實戰第一次答對 | 0 | +3（一課完成獎勵同學習模式） |

- 理由：使用者覺得學習模式與自由遠征比深淵少太多，所以把兩者拉到和調降後的深淵同一個級距；學習模式的戰鬥擊殺／寶箱魂晶（1～3）沒改。彈珠比同類模式略低（還要花時間發射）。
- 防刷：學習模式回顧頁不 tally、不計分；複習盒不變（每 5 張 1）。彈珠：答錯、閱讀頁、回顧頁、課後複習輪、`test: true` 都不給；同場同題一次；12 小時內已在彈珠拿過的題目（`profile.peglinGem`）不再給。彈珠 HUD「💎 魂晶 +N」、結束畫面、完成一課提示會顯示。本機啟動器舊流程仍答對 +1。
- QA：`tools/peglin-web-qa/gems.cjs`（離線、模擬登入、不載入真遊戲）13／13，結果 `docs/peglin-web/gems-qa.json`；`learn-nav.cjs`、`learn-battle-pin-qa/check.cjs` 回歸通過。每分鐘收益是估算，沒有用真玩家實測。

## AI-Brain 知識庫指引
- 改程式或內容前，先讀 E:\AI-Brain\02-Projects\刷題庫框架\index.md，依「需求 → 去哪裡」只讀需要的檔案片段；細節查同資料夾的 auto-* 索引。
- 完成修改後：
  1. 執行 `python E:\AI-Brain\_scripts\gen_quiz_index.py` 重跑索引產生器（約 1 秒）。
  2. 有實質更新時，更新 E:\AI-Brain\02-Projects\刷題庫框架\status.md（必要時 decisions.md、index.md），並在 E:\AI-Brain\99-Changelog.md 加一行「- 日期 專案：一句話」。

## 更新公告彈窗（2026-10-31，v170）

- `js/screens.js` 的 `NEWS` 清單＋`newsModal()`：進營地時若有沒看過的公告就彈出一次（記在 `profile.newsSeen`，跟著存檔／雲端同步，換裝置不會再跳）；已有其他視窗開著時不彈。第一則是背景商店開張（位置、卡池、碎片、四時段場景、布置與拖曳），附「去背景商店」按鈕。之後要公告就加一筆新 id（舊 id 不要改）。
