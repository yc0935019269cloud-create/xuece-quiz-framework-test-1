# 刷題地牢：通用刷題庫遊戲框架

把**任何科目**的題目和教材，變成一款可以離線遊玩的 Roguelike 刷題遊戲：答對＝攻擊、答錯＝被反擊，還有深淵遠征、職業、寵物、營地、番茄鐘、學習模式、錯題本與間隔複習。

- 純 HTML／JS，**雙擊 `index.html` 就能玩**，不需安裝、不需網路。
- 題目和教材放在 `content/`，執行一個 Python 指令就會編進遊戲。
- `docs/prompts/` 有現成的 AI 提示詞：把教材變成學習課程、從教材出題、補詳解、把現成考卷轉成題庫格式。

> 這個框架從「學測地牢」（`E:\NEWTEST\高三刷題庫\刷題遊戲`）抽出來，已移除學測題庫與學習內容。目前附的 `demo_sci`、`demo_eng` 是**示範內容，可以整個刪掉**。

---

## 零、最快的方法：在遊戲裡完成（不用指令）

1. 營地選「**📋 AI 提示詞**」，複製適合的提示詞（素材→課程、出題與詳解、補詳解、題目轉題庫、找圖與標記、互動動畫、審查修正）。
2. 開 AI 對話，先上傳素材，再貼提示詞、改最後的【我的設定】。
3. 把 AI 的輸出（zip 解壓縮、JSON 檔，或整段回覆存成 .md）和圖片放進同一個資料夾。
4. 營地選「**📥 導入素材**」→ 選那個資料夾 → 確認辨識結果（科目、年份、分類可以改）→ 導入。
導入的內容存在這台電腦的瀏覽器裡；導入頁可以「下載」成一個檔案，給學生或別台電腦導入，或放進 `content/` 變成內建內容。

## 一、五分鐘做出自己的題庫（進階：用指令建置）

1. **設定科目**：編輯 `content/project.json`（或用 `docs/prompts/00_使用流程.md` 最下面的提示詞請 AI 寫）。
   - `id` 是存檔代號，**每個題庫專案要不一樣**，存檔才不會互相覆蓋。
   - 每個科目選一個 `theme`（決定地區名、首領、怪物）：`lit` 語文、`lang` 外語、`math` 數學、`calc` 計算應用、`hist` 人文社會、`sci` 自然科學、`mix` 綜合。
2. **放題目**：`content/bank/<科目id>/` 底下，一個 JSON 或 CSV 檔＝一個題本（章節／試卷）。
   - 現成題目 → `docs/prompts/04_題目轉題庫.md`，或自己用 Excel 存成 CSV UTF-8。
   - 沒有題目 → `docs/prompts/02_素材轉出題與詳解.md` 請 AI 從教材出題。
   - 沒有詳解 → `docs/prompts/03_既有題目補詳解.md`。
3. **（選用）放學習課程**：`content/learn/<科目id>/`，用 `docs/prompts/01_素材轉學習模式.md`。
4. **建置**（在這個資料夾開終端機）：
   ```bash
   python tools/build.py
   ```
   有錯誤會列出檔名、第幾題、哪裡錯；照著改或用 `docs/prompts/07_審查修正與連結.md` 請 AI 修。
5. **雙擊 `index.html`**。

需要 Python 3.8 以上（只用標準函式庫，不必另外安裝套件）。

## 二、資料夾

```
index.html              遊戲入口
content/                ← 你的內容都放這裡
  project.json          專案設定：標題、科目、存檔代號
  bank/<科目id>/*.json|*.csv   題目（一檔一題本）
  learn/<科目id>/*.json        學習模式單元
  _index/               （build --index 自動產生）題目索引，給 AI 挑題用
data/bank.js, learn.js  （自動產生，勿手改）
img/bank/<題本id>/      題目圖片
img/learn/<單元id>/     學習卡圖片
docs/格式_題庫.md        題庫格式完整規格
docs/格式_學習模式.md    學習模式格式完整規格
docs/prompts/           給 AI 的提示詞（00～05）
tools/build.py          建置工具
tools/music_norm.py     新增音樂時統一音量（需要 ffmpeg）
assets/                 美術、字型、音樂、白噪音
js/ css/                遊戲程式
```

## 三、支援的題型

| 題型 | 作答方式 |
|---|---|
| 單選 `single`、多選 `multi` | 點選項（文字選項或圖片題皆可），多選部分正確算擦傷 |
| 是非 `tf` | ⭕ 對／❌ 錯 |
| 填答 `fill` | 有標準答案時**自動批改**（忽略空白、全半形、大小寫、上下標；數字與分數比數值），否則揭曉後自評 |
| 非選 `open` | 寫下答案 → 看參考答案 → 自評 |
| 題組 | 多題共用一段文章／圖表，戰鬥中會連續出同組題目 |

題幹、選項、詳解都支援簡易 Markdown（粗體、清單、表格、引用、程式碼區塊）與圖片。數學式用 Unicode（x²、√2、H₂O），不支援 LaTeX。

## 四、遊戲內容（給玩家）

- **深淵遠征**：三章分岔地圖、各主題首領、試煉等級 0～10。**冒險地圖**：每科一個區域、每個題本一關。**自由遠征**：自選科目、題本、題型、題數。
- **📘 學習模式**：固定節奏「導入 → (概念卡 → 即時檢核) × N → 範例 → 實戰 → 回顧」，答錯先給提示，間隔複習、知識筆記。課程依年級／學期／章節等多層分類；有「🔍 圖解」（點標記看說明＋點出構造的辨識測驗，標記位置可自己調整）與「🎮 互動」（模擬動畫）。
- **學習戰鬥**：每段一隻怪物，讀概念卡累積能量、第一次答對造成傷害、答錯被反擊；實戰有精英怪、課末有魔王總複習。可切換平靜模式。
- **📥 導入素材**、**📋 AI 提示詞**：見上方「零」。
- **題庫**、**錯題本**（連續答對 2 次畢業）、**統計**。
- 職業 5 種、寵物 9 隻、營地互動、成就、番茄鐘與專注花園、背景音樂與白噪音。
- **番茄鐘循環**：標準循環（專注／短休息／長休息長度、每幾輪長休息、總輪數或無限）或自訂順序（任意排列專注與休息段落、重複幾次或無限）；可分別設定「專注後自動休息」「短休息後自動繼續」「長休息後自動繼續」，沒自動的地方會停在「下一段」讓你開始、跳過或結束循環。
- 鍵盤：A–J／1–5 作答，Enter 確認／繼續。
- 存檔在瀏覽器裡；「設定與存檔」可匯出／匯入備份。

## 五、分享給別人前注意

- `assets/music/u_*.mp3` 是原作者**自備的商業錄音，僅限個人使用，不可散布**。要把框架給別人或上傳網路前，請先刪掉這些檔案，並把 `js/audio.js` 裡 `BGM.TRACKS` 對應的行移除（其他音樂是 CC0，見 `assets/music/CREDITS.txt`）。
- 題目與教材的著作權屬於原作者；請只放你有權使用的內容。

## 彈珠刷題（Peglin 原版整合，選用）

營地多了「⚪ 彈珠刷題」與「📘 彈珠學習」：在真正的 Peglin 戰鬥裡一題一球、一卡一球。遊戲本體在 `E:\PeglinQuiz`，由本機啟動器 `Start-PeglinQuiz.exe` 連到這個資料夾的題庫；作答紀錄與錯題本存在 `peglin/紀錄/`（不上傳）。沒有啟動器的電腦（包括別人開 GitHub Page）只會看到說明，其他功能不受影響。詳見 `peglin/README.md`。

---

# 開發交接（給接手的 AI／開發者）

## 技術原則
- 純 HTML／CSS／JS，無建置、無框架、無 CDN；必須能用 `file://` 開（不用 ES modules、不用 fetch；資料以 `data/*.js` 的全域變數提供）。
- 改 JS／CSS 後把 `index.html` 所有 `?v=N` 加一（避免快取）。
- 腳本順序：`data/bank.js → data/learn.js → data/prompts.js → util → sprites → pets → audio → content → content2 → store → secrets → question → run → fx → battle → screens → camp → pomo → learn → importer → prompts_ui → main`。`main.js` 的 `init` 會先 `await IMP.load()` 再畫營地。

## 與學測版的差異（框架化改了什麼）
| 項目 | 做法 |
|---|---|
| 科目 | `C.SUBJECTS` 由 `QB.subjects`（`content/project.json`）動態產生；缺的欄位用主題預設補上 |
| 主題 | `C.THEMES`（lit/lang/math/calc/hist/sci/mix）。首領 `C.BOSS_DEFS[主題]`、怪物名前綴 `C.PREFIX[主題]` 或科目自訂 `words`；`C.bossTheme(科目)`（mix 隨機）、`C.monPrefix(科目)`。深淵首領狀態存 `{subj, th, idx}` |
| 題本 | 沿用內部名稱 `QB.exams`／`q.exam`（＝題本），`year` 選填；顯示用 `QV.exLabel(ex)` |
| 題目 | 新增 `stem`（Markdown 題幹）、`choices`（文字選項）、`accept`（填答自動批改）、`tf`（是非，編譯成兩選項單選）、題組 `text`。原本的圖片題（`imgs`＋`opts`）仍支援 |
| 篩選 | 「年度」改成「題本」（`Store.filter({exams})`） |
| 存檔鍵 | `SKEY(k)` ＝ `qg_<project.id>_<k>`（util.js），不同題庫互不干擾 |
| 標題 | `APP_TITLE`（project.title） |
| 建置 | `tools/build.py` 同時處理題庫（JSON／CSV）與學習模式 |

## 檔案地圖（主要）
| 檔案 | 負責 |
|---|---|
| `tools/build.py` | 驗證並編譯 `content/` → `data/bank.js`、`data/learn.js`；`--index` 輸出題目索引、`--check`、`--strict` |
| `js/util.js` | `U` 工具（DOM、Markdown、toast、modal、`U.sameAns` 填答比對）、`SKEY`、`APP_TITLE`、懸停提示 |
| `js/question.js` | `QV`：題目呈現與作答（文字／圖片題、題組、單選多選是非、填答自動批改、自評） |
| `js/content.js`／`content2.js` | 主題、科目、怪物、特性、首領、遺物、天賦、道具、職業、寵物、事件、成就 |
| `js/monsters.js` | 怪物擴充包（23 種新怪、手繪 12×12 像素圖、特性 shock/expose/ambush/harden、怪物攻擊演出 `m.fx` → `FX.monStrike`）；新增怪物照此檔格式加 `ART`＋`C.MONSTERS.push` |
| `js/store.js` | 存檔、題目篩選、作答紀錄、錯題本 |
| `js/run.js`／`battle.js`／`fx.js` | 遠征規則、戰鬥畫面、攻擊動畫 |
| `js/screens.js` | 營地、冒險地圖、自由遠征、深淵設定、題庫、錯題本、寵物、圖鑑、統計、設定 |
| `js/learn.js` | 學習模式（課程樹、播放器、檢核題、圖解 `renderDiagram`、互動 `renderInteractive`、學習戰鬥、課末魔王、間隔複習、筆記） |
| `js/importer.js` | `IMP`：導入素材（掃描資料夾、寬鬆解析 JSON／CSV／md、科目與年份判斷 `resolveSubject`／`guessYear`、圖片配對、預覽確認、IndexedDB 儲存 `qg_<id>_import`、啟動時 `IMP.load()` 併入 QB／LEARN、管理與下載） |
| `js/prompts_ui.js` | `PROMPTS_UI`：AI 提示詞面板（資料來自 `data/prompts.js`，由 build 從 `docs/prompts/*.md` 產生；````text 區塊＝可複製的提示詞） |
| `js/camp.js`、`secrets.js`、`pomo.js`、`audio.js`、`pets.js`、`sprites.js` | 營地互動、成就、番茄鐘、音樂音效、寵物與像素圖 |

## 存檔（localStorage，鍵名前綴 `qg_<專案id>_`）
`profile`（魂晶、等級、職業、寵物、深淵紀錄、營地、成就…）、`qstats`（每題作答）、`wrong`（錯題本）、`run`（進行中的遠征）、`settings`、`audio`、`pomo`、`learn`（學習進度、複習盒、`cfg.battle`、課程樹展開狀態、`pins` 圖解自訂標記、`last` 上次學習）。
導入的內容與圖片存在 IndexedDB `qg_<專案id>_import`（stores：`items`、`imgs`），不在匯出存檔裡；用導入頁的「下載」備份。

## 測試
- 預覽：`E:\.claude\launch.json` 的 `framework`（port 8768）。
- 自動化：`U.sleep = () => Promise.resolve()` 跳過動畫；依 `Store.Q[CUR.s.curQ].key`（填答用 `accept[0]`）點正解跑完整場深淵。
- 2026-09-27 建立時已測：六種題型作答與批改、題組、冒險地圖、完整三章深淵（含隱藏首領）無錯誤、學習模式一整課、CSV 匯入（含中文檔名）、存檔前綴。

## 已知問題與待辦
- 番茄鐘循環（pomo.js）：狀態 `st.cyc = {i 目前段落, list 一圈的段落快照, laps 圈數 0＝無限, focusDone}`，`st.phase==='ready'` 時 `st.nextStep` 是等待開始的段落；循環開始時會把段落清單快照下來，循環中改設定要下次開始才生效。
- 導入內容只存在該瀏覽器；清除瀏覽資料會消失（請用導入頁「下載」備份）。
- 自動複製提示詞需要真的用滑鼠點按鈕（瀏覽器限制）；失敗時會提示用 Ctrl+A、Ctrl+C。
- 互動內容由 AI 產生，已放在沙盒 iframe 執行，但正確性仍需人工確認。
- 題本很多（>30）時，自由遠征／題庫的題本 chips 會很長，之後可改成下拉選單或依科目收合。
- `mix` 主題的區域名固定為「科目名＋迷宮」。
- 圖片題（無 `choices`）只顯示字母按鈕，和學測版相同。
- 首領、事件的台詞仍帶有少量學科梗（例如英文首領講英文），選錯主題時會有點違和。
- 學習模式沒有課程解鎖順序（可任意順序上）。


## 114 大一下資源（2026-09-30）

- 本次資源：`資源/114 大一下/`；分類為 `114 大一下 → 原國考年份或114學年度 → 科目 → 單元`，JSON 的 path 與資料夾一致。原遊戲的四科 1,445 題完整保留，轉為 167 題本；六個來源網站合併轉成 78 學習單元、364 課，另含 15 個離線互動與 6 個教學圖解。
- 同步內建內容在 `content/bank/<科目>/semester114/` 與 `content/learn/<科目>/semester114/`；沿用眼解剖生理學 `eye_ans`，新增 `physio`、`optometry`、`basic_optics`。既有 `eye_anat`、`physopt` 內容及使用者原先的未提交改動保留。
- 原題 ID、原編號與原始詳解欄位保留；跨單元題只存一次並保留其他單元標籤。不要改 s114 題本 ID，以免進度失去對應。
- `資源/114 大一下/預覽.html` 可直接離線開啟；`.來源` 為網站與舊資料快照、`.校驗` 為覆蓋對照、ID 對照與驗證，導入器會跳過點號目錄。
- 工具：`semester_sources.py → semester_extract.cjs → semester_convert.py → semester_bilingual.py → semester_preview.py → semester_validate.cjs`，之後 `python tools/build.py --strict --index`。來源已下載時不必重抓。轉換工具只歸檔本次不再使用的 s114 學習檔，保存在 `.校驗/歷次生成/`，不可清除其他使用者檔案。
- 嚴格建置與實際 importer.scan 均通過；來源逐題完整性、課程節奏、圖檔存在及互動 JS／數值邊界已檢查。不是完整醫學審題認證；需確認事項見資源內 `01_需要確認與修正.md`。

## 角色與動畫（2026-10-04）

- 已實裝 5 個職業各 4 男／4 女，共 40 款內建免費造型；職業本身仍沿用原有解鎖規則。入口：職業殿堂 → 造型，可篩選男生／女生、新造型／經典，並試播攻擊與爆擊。
- 圖片模型生成的正本：`assets/heroes/*.png`，每人 8 個獨立姿勢（待機、眨眼、4 種攻擊、爆擊蓄力、爆擊重擊），共 320 個姿勢。動畫由這些姿勢加上播放節奏、位移與職業特效組成，不是逐幀影片。
- `js/heroes.js`：造型註冊、Canvas 姿勢播放器、呼吸／眨眼、攻擊／爆擊；`js/hero-atlas.js`：自動產生的來源範圍、腳底 pivot、共同比例與鄰格遮罩資訊。PNG 正本不經程式改繪。
- 4 種攻擊使用洗牌袋隨機播放（每袋各出現一次）；`js/fx.js` 中遊俠補疾風雙射、聖女補星環祝禱、狂戰士補裂地橫掃；爆擊各有職業特效。營地、職業殿堂、地圖、戰鬥、結算及學習模式共用角色播放器。
- 舊造型 ID 與已購造型保留在「經典造型」。沒有已存選擇時顯示各職業第一款新男造型；已有明確選擇時沿用。新造型 cost=0，切換不扣魂晶。
- 動畫展示頁：`docs/hero-art/preview.html`（可 file://）；提示詞與造型清單：`docs/hero-art/manifest.json`；來源／修正紀錄：`docs/hero-art/generation-log.json`。
- 重新分析素材：`python tools/hero_atlas.py`（需要 Pillow、NumPy，只寫 metadata，不修改 PNG）；校驗：`docs/hero-art/atlas-check.json`。
- QA 已通過 40 款換装與保存、320 姿勢非空／差異、160 次普通動畫與 40 次爆擊動畫、5 職業實際答題攻擊、4 招隨機覆盖、390px 手機版及 file:// 載入。結果：`docs/hero-art/qa-report.json`；截圖：`docs/hero-art/screenshots/`。
- QA 在獨立且用完丟棄的 Edge headless context 內執行，備份／還原該 context 的 localStorage，沒有使用使用者的瀏覽器存檔。測試工具：`tools/check_hero_animations.cjs`、`tools/check_hero_motion.cjs`（Playwright + Edge）；本機可設定 `$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'` 後執行。
- 本次入口快取版本 v31；腳本順序為 content2 → hero-atlas → heroes → store。不要手改自動產生的 hero-atlas.js，也不要改已用於存檔的 px_<職業>_<m/f><1..4> ID。
