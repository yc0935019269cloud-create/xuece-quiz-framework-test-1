# 交接：眼解剖生理學大二上內容大改（2026-10-29 00:15 更新）

工作方式：Claude 規劃／審查，Codex（gpt-6.1-terra high）或 Sonnet（中等）實作。派工說明與腳本都在 Claude 的 scratchpad：
`C:\Users\USER\AppData\Local\Temp\claude\E--NEWTEST----------TEST-1\275e5086-a79e-49ad-b29a-52bc0e6dbdab\scratchpad\`
- `task-rewrite-common.md`（共用寫法規則）、`lesson-template.md`（每課硬性結束條件）、`addendum-transcript.md`（逐字稿融合＋🧑‍🏫 老師說會考規則）
- `per-lesson.ps1`（一次派一課給 Codex 的迴圈；用法：`-Brief <單元說明> -Tag <名> -ListFile <課清單>`）、`list-*.txt`（各單元課清單）
- `audit_exam.py`（國考題覆蓋稽核）、`exam-missing.json`（稽核結果）
- skill：`.claude/skills/codex-worker/SKILL.md`（工人模式說明與教訓）

使用者已授權：全部完成後**直接 commit 合進 main**（不必再問）。

## 已完成
- 深淵遠征戰鬥中顯示「範圍 已刷 X／共 N 題」（js/battle.js、v158），QA 17/17：`tools/abyss-progress-qa/check.cjs`。
- `docs/PROJECT_MAP.md`（接手索引），CLAUDE.md 已加入口。
- 審查報告 `docs/drafts/eye115-review.md`；修改紀錄 `docs/drafts/eye115-changes.md`；老師考點 `docs/drafts/teacher-exam-points.md`（自主神經 16 條＋血液）；每課筆記 `docs/drafts/lesson-notes/`。
- 房水與睫狀體新單元 `content/learn/eye_ans/aqueous/aqueous-ciliary.json` 第 1～4 課（58 頁、20 題練習）；題本 `content/bank/eye_ans/aqueous/`（20 題）。大綱 `docs/drafts/aqueous-outline.md`（共 7 課）。
- blood-vessels l1 已重寫並通過 Claude 審查（21 頁，範例寫法）。
- MedicalTranscriber：錄音先轉正規化 MP3 再辨識、校稿改 gpt-6.1-terra（已重啟生效）。

## 進行中（00:15 時）
- Sonnet 4 個：自主神經 A（ans-basics/pathways/trigeminal）、自主神經 B（ans-reflex/clinical）、血液（blood-vessels l2-l3、blood-ciliary、blood-retina）、角膜第二輪精修（14 課）。
- Sonnet 2 個：10/17 兩段錄音校稿 → 輸出 `E:\學習\大二上\眼解剖\逐字稿\校訂逐字稿\<資料夾>\Sonnet校訂_時間戳.txt`。
- GPT 額度 10/29 03:27 恢復。

## 還沒做
1. 房水與睫狀體：等 Sonnet 校訂稿 → 融合逐字稿＋🧑‍🏫 標註到第 1～4 課，做第 5～7 課（隅角排出、眼壓青光眼、藥物總複習）。10/17 舊校訂稿品質差，不要用。
2. **國考題漏收**：稽核（關鍵字初篩，會多抓）26 份考卷中約 585 題可能屬大二上範圍，題庫已收約 185 題，候選未收約 400 題（`exam-missing.json`）。生普／生特卷幾乎沒收（每卷 1～6 題）。需要：逐題判定是否屬大二上單元範圍 → 收題（原卷題號、官方答案、自編詳解）→ 掛到單元 banks → 教材補考點。注意 CLAUDE.md 記載 exam115 部分 2xx/3xx 題幹把驗光生普考誤標成驗光師。
3. 各單元完成後：Claude 抽審、`python tools/build.py --strict --index`、瀏覽器逐頁測試（tools/learn-redo/sweep.cjs 或 eye115-qa）、CLAUDE.md 加一節、commit。

## 使用者決定（10/29 00:40）
- 國考題**暫時只收大二上範圍**（自主神經、血液供應、角膜、房水與睫狀體），眼解剖其他部分先不收。
- **大二上每個單元都要有「國考重點總複習」課**：現有 11 個單元都已有（多為最後一課），重寫時要更新成新收國考題後的版本；房水與睫狀體還沒有，要新增（第 8 課，或把第 7 課拆成「藥物」＋「國考重點總複習」）。
- 晚上電腦開著：額度恢復後由排程自動接續（CronCreate 每小時 :37 喚醒這個 session，讀本檔接續；全部完成就刪掉排程）。

## 00:40 狀態（Sonnet 因 API 連線錯誤中斷）
- 自主神經 A（ans-basics、ans-pathways、ans-trigeminal 共 11 課）：**完成**（+19 頁、+47 題、老師說會考 7 條＋老師強調 11 處）。待 Claude 抽審。
- 自主神經 B：ans-reflex l1～l3 完成；**ans-reflex l4、l5、ans-clinical l1～l5 未做**。
- 血液：blood-vessels l1 完成；中斷在 blood-vessels l3 附近，**l2 狀態要看 git diff 與 lesson-notes**，blood-ciliary、blood-retina 未做。
- 角膜精修：中斷在 cornea-layers l1 附近；cornea-general 可能已改，看 lesson-notes/cornea-*.md 判斷做到哪。
- 10/17 第一段（48d3cb30df49）Sonnet 校稿**完成**：767 行、🧑‍🏫 14 句、【待確認】165 處（多為 ASR 糊掉；數字如房水量、折射率、pH、生成速率要以講義為準）。第二段（854a2e4ba722）Sonnet 校稿**完成**：520 行、🧑‍🏫 8 句（00:00 與 01:33 兩句是語氣判斷）、【待確認】156 處；推測成分偏高：02:33 Schwalbe's line→scleral spur、27:20 pupillary block。**① 校稿完成，下一步 ② 學習單元。** 房水單元融合逐字稿時用兩份 `Sonnet校訂_時間戳.txt`。
- 10/17 錄音 Sonnet 校稿：檢查 `Sonnet校訂_時間戳.txt` 是否寫到最後一行（對照原始 時間戳.txt 最後的時間）。

## 10/29 09:20 狀態
- 已完成（有 lesson-notes 自評）：ans-basics、ans-pathways、ans-trigeminal、ans-reflex l1～l5、blood-vessels l1、cornea-general l1～l3、cornea-layers l1～l3。
- 09:20 派出 4 條 Codex 逐課迴圈（per-lesson.ps1，背景）：clin（ans-clinical 5 課）、blood2（blood 8 課）、cornea2（cornea-layers l4～l7＋cornea-supply 4 課）、aq（房水 l1～l4 融合逐字稿＋新增 l5～l8，l8＝國考重點總複習）。輸出 scratchpad 的 out-<tag>-<n>.md。迴圈遇到 GPT 上限會自動停（輸出 QUOTA-HIT），**此時暫停，不要改派 Sonnet**。
- 10/29 09:37 使用者要求**取消排程**（已 CronDelete），之後由使用者叫醒接續。斷網期間 4 條線停在各自第 2 課並自動重連，第 1 課都已完成。
- 10/29 使用者指示：自主神經、血液的一般課用省額度（medium＋精簡筆記）；國考重點總複習課慢慢做（high）並交 Claude 審；角膜、房水好好做（high），重點是逐字稿裡老師說會考（角膜沒有錄音，只能用講義重點）；已完成的前面單元也要檢查老師說會考有沒有漏標。
- 10:00 左右重派（新腳本 per-lesson2.ps1，斷網會等 2 分鐘重試同一課、額度上限才停；清單第 4 欄＝effort）：clin2（ans-clinical l4、l5 總複習）、blood3（ciliary/retina 一般課 medium、三個 l3 總複習 high）、cornea3（layers l7＋supply l1～l4）、aq2（房水 l5～l8）；另 ans-teacher（medium）掃 ans-basics/pathways/trigeminal/reflex 漏標的老師說會考。已完成：ans-clinical l1～l3、blood-vessels l2、cornea-layers l4～l6、aqueous l1～l4（已融合逐字稿）。
- 完成並經 Claude 審（10/29 中午）：ans-clinical l4/l5、blood-ciliary l3（建議補一張易混淆總對照表）、cornea 全部（出處有些只寫「112 年第 25 題」沒寫考別，統一修）、aqueous l1～l8（169 頁、老師說會考 15、強調 10）。ans-teacher 漏標檢查完成：124 句判斷完、新增 8 處。
- **GPT 額度用完（恢復時間 10/29 14:18），依使用者規則暫停。** 剩下第二步：blood-retina l3、blood-vessels l3（兩堂國考重點總複習，high）。接續方式：`per-lesson2.ps1 -Brief task-w4.md -Tag blood4 -ListFile <只含這兩行的清單>`（可從 list-blood3.txt 取最後兩行：retina l3、vessels l3）。之後進第三步收題。
- **10/29 11:20 改用省額度做法**（規則已寫進 `.claude/skills/codex-worker/SKILL.md`「省 GPT 額度」）。已備好：`rules-eye115.md`（濃縮規則）、`task-blood-pack.md`（medium，產出 pack-blood.md）、`task-blood-review.md`（high，先 retina l3，同一對話 resume 做 vessels l3；{FILE}{ID} 自行替換）。第三步收題也先做素材包：每單元一個 medium 工作，從 exam-missing.json＋該單元 teaches/已教考點判定範圍 → 收題；同類單元沿用同一對話。並行最多 2 條。
- **第三步收題後要回補**：aqueous l8 缺「國考題逐步講解」example（因 107 師特 14、113 生普 32、112 師高 7、112 生普 2 尚未收進題庫，標「待收」）；收完題後補 3～5 個 example，並把 l5～l7 中「待收」字樣換成正式出處。
- 接續時：若這些還在跑（`Get-Process codex`），不要重派；停了就看 out-*.md 與 tasks 輸出，從沒做完的課接著派。

## 接續順序（排程喚醒時照做）
**使用者指定（10/29 09:15 更新）：一律派 GPT（Codex）當工人；GPT 達到上限就暫停任務（不要改用 Sonnet），等下次排程喚醒再檢查額度。**
**（舊規則，已被上一行取代）一律優先派 GPT（Codex）當工人，GPT 沒額度才用 Sonnet。順序固定為：① 校稿 → ② 學習單元 → ③ 依學習單元內容判斷國考題是否在範圍內、補收題目。前一步沒完成不要跳到下一步。**
- ① 校稿：10/17 兩段的 `Sonnet校訂_時間戳.txt` 若沒寫到最後一行，派 Codex 從中斷處接著校（同樣規則：最小修改、保留時間戳、🧑‍🏫 標老師說會考、聽不清加【待確認】）。
- ② 學習單元：下面 2、3 步。
- ③ 國考題：下面第 4 步；判定範圍時以「學習單元實際教到的內容」為準，不是只靠關鍵字。


1. 先看額度：`codex exec -m gpt-6.1-terra --sandbox read-only --skip-git-repo-check "只回覆 OK"`。GPT 可用 → 用 `per-lesson.ps1` 派 Codex（優先，省 Claude 額度）；不行 → Sonnet 中等 Agent（一個 Agent 負責一組課，說明檔同上）。
2. 未完成的課逐課做完（清單 list-*.txt，跳過 lesson-notes 已有自評且 JSON 已改的課）。
3. 10/17 校訂稿完成 → 派房水單元：融合逐字稿＋🧑‍🏫，第 5～7 課＋國考重點總複習課。
4. 國考題補收（只收大二上範圍）：用 `exam-missing.json` 候選逐題判定 → 收題（原卷題號、官方答案頁、自編詳解，題幹開頭【年 考試 第 N 題】，題號 n 規則沿用 exam115：師高 <100、師特 1xx、生普 2xx、生特 3xx）→ 放進對應題本並掛單元 banks → 各單元國考重點總複習課更新。一個單元派一個工人。
5. Claude 抽審每單元一課 → `python tools/build.py --strict --index` → 瀏覽器測試（`tools/learn-redo/sweep.cjs`、`tools/eye115-qa/check.cjs`，NODE_PATH 見 CLAUDE.md）→ CLAUDE.md 加一節 → 刪 docs/drafts 以外的暫存（tmp/）→ commit 合進 main（使用者已授權）→ 刪除排程。

## 需要使用者判斷
- 國考題收題範圍：只收「大二上這幾個單元」（自主神經、血液、角膜、房水睫狀體），還是眼解剖整科（含眼瞼、淚器、視網膜分層、眼外肌、胚胎、倫理法規）都收？
- 講義與國考／教科書不一致處（例：血房水屏障描述、失養症沉積物配對、睫狀視網膜動脈出現比例）：目前兩種說法都寫並註明，是否要問老師？

## 2026-10-30 收尾（已完成）

- 血液 retina／vessels l3 總複習重寫、ciliary l3 加對照表、房水 l8 加對照表＋4 個國考例題；國考補收 21 題；房水 l1 與角膜營養 l1 的「?」亂碼已從 Codex 紀錄還原。
- 上面列的待辦都已處理；之後的說明看 CLAUDE.md「眼解剖生理學 大二上」一節。
