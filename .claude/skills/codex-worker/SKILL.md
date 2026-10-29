---
name: codex-worker
description: 「Claude 當大腦、Codex 當工人」。使用者要改這個 repo 的程式／內容時使用（或說「派給 codex」「用工人模式」）：Claude 只讀必要片段、寫工作說明，交給 Codex CLI（扣 ChatGPT 訂閱額度）實作，Claude 再驗收。目的是省 Claude token。
---

# Codex 工人模式

## 省 token 原則（最重要）
- **不要自己讀整個檔案或大範圍探索**。只用 Grep 找到位置、讀幾十行足以寫說明即可；探索交給 Codex。
- 不要把 Codex 的完整輸出讀進來：用 `-o` 只拿最後回報，回報要求 ≤15 行。
- 驗收先看 `git diff --stat`，只抽看關鍵 hunk；測試交給 Codex 自己寫自己跑，Claude 只跑最後確認指令並看結尾幾行。
- 修正不要自己改：把問題寫成短說明再派一次（`codex exec resume --last "<修正>"` 可沿用上下文）。小到一兩行的才自己 Edit。

## 分工派子代理時：省額度與留存記憶（通用原則）
子代理（Codex 或任何代理）每次新開都沒有記憶，會重讀所有資料；而且每呼叫一次工具就重送整段上下文，所以「讀得多 × 步驟多」會讓成本倍增。原則是：**讓昂貴的閱讀只發生一次，並把結果留成檔案或留在同一個對話裡。**

**一、把記憶外置成檔案（跨工人共享）**
1. **素材包**：同一批工作共用的原始資料（逐字稿、題目、文件、程式片段），先派一個便宜的一次性工作讀一次，濃縮成 `pack-<主題>.md`（≤30 KB，只留要點與出處）。之後所有工人只讀素材包，說明裡明寫「不要再自己搜尋原始資料」。
2. **規則卡**：專案規範不要叫工人讀整份大文件（如 100 KB 的 CLAUDE.md），由 Claude 濃縮成 `rules-<主題>.md`（≤3 KB）。
3. **進度帳本**：每完成一份工作就在交接筆記（SESSION_NOTE）或 `notes/<工作>.md` 留一行「做了什麼、在哪、還缺什麼」。中斷或換工人時只讀帳本，不重新盤點。
4. **盤點與執行分開**：需要大量讀取的「找／盤點」是一個便宜工作（只輸出素材包或清單），「寫／改」是另一個工作；執行工作不做盤點。

**二、把記憶留在對話裡（同一條工作線）**
5. **同一主題沿用同一個對話**：第一件用 `codex exec`，接下來的用 `codex exec resume <session id>`（平行時不要用 `--last`）；換主題才開新對話。
6. **失敗用 resume 接續**：斷網、逾時、做一半，都接續原對話，不要從頭重派。
7. **退回修正也用 resume**：把審查意見寫短，接在原對話後面，不另開新工人。

**三、控制單次成本**
8. **工作切小**：一次一個可驗收的單位（一課、一個功能、一批題目）。大任務容易做一半就交差，等於白花一輪。
9. **推理強度分級**：搜尋、整理、機械性修改用 `medium`；需要深度整合或判斷的才用 `high`。
10. **說明短、回報短**：說明只寫目標、要讀的檔、不能動的東西、完成標準；回報限 ≤10 行。Claude 只讀 `-o` 的最後回報，抽看 diff，不讀完整日誌。
11. **並行有上限**：同時最多 2 條，避免額度瞬間見底；到上限就暫停，不自動改用更貴的代理（除非使用者同意）。

實測依據（2026-10-29）：40 次「每課冷啟動」派工共約 547 萬 token、平均每次 14 萬，主因是重讀大檔與重試從頭來。

## 流程
1. 釐清需求（不清楚就問使用者一次）。
2. 寫工作說明到 scratchpad 的 `task.md`（範本見下）。
3. 派工（長工作 `run_in_background: true`，完成會通知，不要輪詢）：
   ```powershell
   Get-Content task.md -Raw | codex exec -m gpt-6.1-terra -c model_reasoning_effort="high" --sandbox workspace-write -C "E:\NEWTEST\新刷題庫框架 - TEST 1" -o "<scratchpad>\codex-out.md" -
   ```
   （模型名稱若被拒，改用使用者選定的模型；見本檔最下「已驗證設定」。）
4. 驗收：讀 `codex-out.md` → `git diff --stat` → 抽看 diff → `python tools/build.py --check --strict`（有改內容時）→ Codex 回報的測試指令自己再跑一次看結尾。
5. 不通過 → `codex exec resume --last` 派修正，最多 3 輪，仍不行再自己處理或問使用者。
6. 回報使用者：改了什麼、驗證了什麼、沒驗證什麼。**commit／push 一律等使用者同意。**

## 工作說明範本（給 Codex，繁中或英文皆可）
```
# 任務
<一句話目標>
# 背景
專案：純 HTML/JS 刷題遊戲，須能 file:// 開。先讀 CLAUDE.md 相關段落（不必讀全部）。
相關位置：<檔案:行號、函式名>
# 做法
<步驟或要求>
# 不能動
- data/*.js（由 python tools/build.py 產生，不要手改）
- assets/music/u_*.mp3、使用者未提交的其他改動
- 不要 git commit / push / reset / stash
# 規則
- 改 JS/CSS 後把 index.html 所有 ?v=N 加一
- 改 content/ 後跑 python tools/build.py --strict
- 瀏覽器測試：headless Edge（Playwright，$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'），獨立 context，測前備份 localStorage、測完還原
- 若是重要功能，在 CLAUDE.md 加一小節說明（繁中，比照既有格式）
# 完成標準
<可驗證的條件>
# 回報（最後訊息，≤15 行）
改了哪些檔、跑了哪些檢查與結果、未完成或不確定之處、給 Claude 驗收用的一條測試指令
```

## 已驗證設定
- 2026-10-28：codex-cli 0.165.0、ChatGPT 帳號登入；`gpt-6.1-terra` + `model_reasoning_effort="high"` 可用（0.125.0 會 model_not_found，要升級）。
- `-o/--output-last-message <FILE>` 只存最後回報；`exec resume --last` 接續；`-s workspace-write` 可寫 repo。
- stderr 會有「Exceeded skills context budget」警告，可忽略。
- 也可派到別的資料夾（`-C <路徑> --skip-git-repo-check`）。非 git 專案：派工前先把原始碼備份到 scratchpad，驗收用 `git diff --no-index --stat <備份> <檔>` 比對。
- Codex 的 workspace-write 沙箱**沒有網路**：要連網的驗證（登入、呼叫 API、模型可用性）Codex 測不到，由 Claude 自己補測。
- 派工時加 `*> log.txt` 把過程導到檔案，只讀 `-o` 的回報，省 token。
- **大任務會提早收工**：一次派「改 3 個單元」，Codex 只做局部修訂就交差（實測 3 單元只淨增 2～3 頁）。內容重寫一律「一次一課」：用 scratchpad 的 `per-lesson.ps1` 模式（共用說明＋本課範圍＋最低數量要求＋自評檔），一課一個 `codex exec`，迴圈跑在背景，偵測 quota 字樣就停。
- 平行派工：不同工人改不同檔案即可並行；`build.py` 會互相覆寫 data/*.js，最後由 Claude 統一重建。接續用 `codex exec resume <session id>`（log 裡 `session id:`），平行時不要用 `--last`。
- **`exec resume` 不接受 `--add-dir`／`-C`／`--sandbox`**：接續的對話只能寫 repo。要它寫的中間檔放 repo 內 `tmp/`（commit 前刪），scratchpad 只當唯讀素材。
- **PowerShell 管線會把中文說明變亂碼**（`Get-Content | codex` 用 ANSI）：改用 Bash `codex exec ... - < task.md`，位元組原樣送入。
- 試跑紀錄：2026-10-28 MedicalTranscriber（MP3＋loudnorm、校稿改 terra），一輪通過，65 測試 OK。
