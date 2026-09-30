# 彈珠刷題／彈珠學習：Peglin 原版整合

在**真正的 Peglin** 戰鬥裡刷題或上課：每次瞄準前先答一題（彈珠刷題）或讀一張卡／做一題檢核（彈珠學習），再自己瞄準發射。

## 架構：題庫在這裡，遊戲本體在 E:\PeglinQuiz

```
這個資料夾（或 GitHub Page）的營地頁 js/peglin.js
   │  fetch http://127.0.0.1:18769/api/*（只有自己電腦有這個服務）
   ▼
E:\PeglinQuiz\Start-PeglinQuiz.exe（本機啟動器，讀 E:\PeglinQuiz\peglin-link.json）
   ├─ 網頁與題庫：webRoot = 這個資料夾（直接開 http://127.0.0.1:18769 也是這份營地）
   ├─ 作答紀錄／錯題本／學習備份：dataDir = 這個資料夾的 peglin/紀錄/（已 .gitignore，不會上傳）
   └─ 啟動遊戲本體：E:\PeglinQuiz\Peglin\Peglin.exe（BepInEx 外掛 QuizPlugin.dll）
```

- **遊戲本體不會進到這個資料夾**；這裡只放原始碼（`mod-src/`）與建置腳本。
- **題本取自「你目前開的那個網頁」**：在本機資料夾開就用本機題庫，在 GitHub Page 開就用 GitHub Page 上的題庫與課程。題本和圖片由網頁打包後交給啟動器（`file://` 開啟時圖片改由啟動器從 webRoot 讀）。
- **別人無法使用**：兩個彈珠模式要呼叫本機 `127.0.0.1:18769`，別人的電腦沒有這個服務，只會看到說明、按鈕停用；啟動器也只接受 `peglin-link.json` 的 `allowOrigins`（你的 GitHub Page）、localhost 與本機檔案的呼叫，其他網站一律 403。
- GitHub Page 是 https、啟動器是本機 http：Chrome／Edge 第一次可能詢問「允許存取本機網路裝置」，請按允許。GitHub Page 上不會在載入時主動探測本機，只有進入彈珠頁面才會連（避免別人的瀏覽器跳出詢問）。

## 使用
1. 雙擊 `E:\PeglinQuiz\Start-PeglinQuiz.exe`（右下角系統匣圖示；右鍵可勾「開機時自動啟動（背景）」、開啟紀錄資料夾）。
2. 開營地（本機資料夾、`http://127.0.0.1:18769`、或 GitHub Page 都可以）→「⚪ 彈珠刷題」或「📘 彈珠學習」。
3. 彈珠刷題：選科目 → 依單元（或依年份）勾題本 → 套用並啟動。彈珠學習：選科目 → 點選要上的課（點一下加入、再點一下取消，可跨單元多選，依課程順序上）→ 帶進 Peglin。
4. 遊戲裡：1–9／A–I 作答、Enter 送出／繼續。
   - 刷題：答對這一球傷害加成（連對越高，每 5 連對回血），答錯扣血但不致死、稍後再出一次。
   - 學習：閱讀卡讀完就繼續；檢核答錯先給提示再試一次；最後一步讀完＝完成本課（戰鬥上方會提示）。之後接著複習這幾課的題目。
5. 回營地自動同步：刷題錯題進錯題本；學習檢核錯題進「🔁 複習」、完成的課程標記完成與星等。每次同步後會把學習存檔與 `錯題本-<題庫id>.md` 備份到 `peglin/紀錄/`；換瀏覽器或換網址（例如改用 GitHub Page）時，按「從題庫資料夾讀回進度」即可接續。

## 開發
| 檔案 | 說明 |
|---|---|
| `../js/peglin.js`、`../css/peglin.css` | 營地頁：偵測本機服務、兩種模式、題本／課程打包、同步與備份 |
| `../js/learn.js` 的 `LEARN_UI.applyPeglin` | 彈珠學習回流：完成本課、檢核錯題進複習盒 |
| `mod-src/QuizPlugin.cs` | 外掛：出題時機、批改（學習題先提示再試）、進度、獎懲、快捷鍵、Harmony 掛勾 |
| `mod-src/QuizCanvas.cs` | 遊戲內面板（TextMeshPro，借用 Peglin 自己的中文字型；排版比照營地學習模式：類型色條、重點框、例題步驟、回饋框）、戰鬥徽章、`QuizDriver` 每幀更新 |
| `mod-src/QuizIsolation.cs` | Preloader：Peglin 存檔與 PlayerPrefs 導向 `E:\PeglinQuiz\saves\peglin`，不動 Steam 原版存檔 |
| `mod-src/QuizBridge.cs` | 啟動器：本機 HTTP、CORS／本機網路預檢、`/api/status|session|launch|results|backup|wrongbook`、系統匣 |
| `build-mod.ps1` | `.\build-mod.ps1 [-Runtime E:\PeglinQuiz] [-PluginOnly]`；先關 Peglin，編譯啟動器時要先從系統匣結束營地服務 |

- 這裡的 `mod-src/` 是正本；編譯後也複製一份到 `E:\PeglinQuiz\mod-src\` 備查。
- 作答紀錄每行一筆 JSON：刷題 `{qid, ok, …}`；學習另有 `mode:"learn", pack, lesson`，檢核 `kind:"check", checkId, first`，完成本課 `kind:"lesson", n, ok`。`test:true` 的列不會同步。
- 外掛以 .NET Framework 內建 csc（**C# 5**）編譯：不能用字串插值、`?.`、`out var`。
- 踩坑紀錄見 `E:\PeglinQuiz\README.md` 最後一節（Peglin 會銷毀外掛物件、GameBlockingWindow 擋快捷鍵、Unity 中文換行等）。
