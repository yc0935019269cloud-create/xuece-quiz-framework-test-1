# 彈珠刷題／彈珠學習：Peglin 整合

兩種玩法，營地「⚪ 彈珠（Peglin）」進入後預設用網頁版：

| | 網頁版（預設） | 本機版 PeglinQuiz |
|---|---|---|
| 遊戲 | peglinnnnnnn 部署在 GitHub Pages 的 Unity WebGL 建置（**不修改那個 repo**） | E:\PeglinQuiz 的桌面版＋BepInEx 外掛 |
| 哪裡能玩 | 任何裝置開這個網站（GitHub Page 或本機資料夾）都能玩，需要網路與 WebGL 2 | 只有裝了啟動器的這台電腦 |
| 題目在哪 | 遊戲外層的面板（刷題地牢自己的題目／學習卡元件） | 遊戲裡的面板 |
| 獎懲 | 答題換彈珠：每答（完成）N 題可以發射 M 顆；答錯算不算可選 | 答對傷害加成、答錯扣血 |

## 網頁版：答題換彈珠

```
js/peglin.js（題目面板、彈珠數、紀錄）
   │  <iframe src="peglin/web.html">，postMessage 溝通
   ▼
peglin/web.html（外框頁）── 載入 https://yc0935019269cloud-create.github.io/peglinnnnnnn/ 的 Build/ 與 StreamingAssets/
   ├─ 設定（檔名）讀對方 index.html；也載入它的 ipad-display.js（iPad Chrome 相容模式）
   ├─ 發射偵測：攔 decodeAudioData／AudioBufferSourceNode.start，發射音效 UI_Tock_02 一播放＝發射一顆 → {type:'shot'}
   └─ 鎖輸入：彈珠用完時擋掉遊戲內的鍵盤／點擊，按了就通知父頁出下一題 → {type:'blocked'}
```

- **為什麼這樣做**：WebGL 版遊戲是「純 Peglin」，沒有任何出題介面、URL 參數、JS 橋接或 postMessage（只有一個讀瀏覽器語言的 jslib）。不改那個 repo，就只能從外面包一層：題目放在外層，靠音效判斷發射。
- **發射偵測**：所有彈珠共用的發射音效是 `UI_Tock_02`（331 個彈珠預製物引用同一段；原始 3224 樣本 73 ms）。WebGL 版是 AAC，解碼後補到 4096 樣本≈0.0929 秒、雙聲道；全遊戲 295 段音效沒有其他落在這個長度（最接近的游標音效解碼後 0.0697 秒）。外框頁先比對壓縮資料指紋（`1602:4f96324f`），再用長度區間 0.082～0.098 秒當備援，所以對方重建後指紋變了也抓得到。多重彈珠 1.2 秒內算同一顆。
- **實測行為**（2026-10-25，對方 main `1cf98a4`、Pages 建置 `625a722`）：戰鬥中每次發射算一顆；戰鬥後「把彈珠打進路口選下一關」也是真的發射，算一顆；開新冒險點第一關時，遊戲有時會自動發射一顆選路線（兩次實測一次有、一次沒有），有的話也會算到。換下一顆彈珠、菜單、教學翻頁、標題畫面的展示彈珠都不會算。
- **載入兩段**：`createUnityInstance` 完成後，遊戲還要自己預載資源、載入標題場景（畫面先後出現「Loading N%」與綠色進度條；SwiftShader 上要幾十秒），這段時間點遊戲沒有反應。
- **彈珠用完**：遊戲上蓋一層遮罩（包括地圖、商店、獎勵畫面），點一下出下一題；遊戲裡按鍵也會被外框頁擋下並出題。可以隨時按「📖 答題」先答題存彈珠。
- **刷題地牢的音量**：上方 ♪ 打開刷題地牢自己的總音量、背景音樂、音效、全部靜音（和頂部「♪ 音樂與音量」同一組設定）。遊戲本身的音樂音效請用遊戲裡的「選項」調。
- **遊戲存檔跨裝置同步**：登入雲端同步後，哥布林彈珠的冒險進度會存到同一個帳號（另外一筆，不影響刷題進度同步）。打開遊戲時載入別台的新進度，玩的時候每 2 分鐘、切走分頁或按「結束」時上傳。新裝置第一次套用時遊戲會自動重開一次。兩台不要同時玩，同時玩時以較晚存的為準，另一份留備份在本機。
- **連續作答**：答完一題按「下一題 ▶」（或 Enter）就接著寫，彈珠一路存著；想打的時候按「🎯 去發射」。
- **工作列其他工具**：🍅 番茄鐘（開始／暫停／跳過／結束）、💬 AI 助教、🧮 計算機、📝 計算紙。題目面板右上 ✕ 可暫時關閉題目看盤面，按「📖 回到題目」或點遊戲畫面回到同一題。
- **選題介面**：題數下面顯示這個範圍已刷／未刷幾題、題型已刷／未刷幾種（和自由遠征同一套）。
- **紀錄**：直接寫進這個網頁的進度——刷題 `Store.record`（錯題本、統計，答對 +8 經驗、+1 魂晶，答錯 +2 經驗，與本機版同步規則相同）；學習檢核 `LEARN_UI.applyPeglin({type:'check', ok: 第一次就對})`，整課走完 `applyPeglin({type:'lesson'})`。之後照常雲端同步。`test: true` 的場次不寫紀錄。
- **範圍**：彈珠刷題的條件和自由遠征相同（科目、`Screens.setPicker` 題本樹與年份、題型、星號、出題順序、同類題、狀態、題數），排序規則與 `screens.js` 的 `prefOrder` 一致；彈珠學習沿用原本的選課樹。
- **網址**：預設 `https://yc0935019269cloud-create.github.io/peglinnnnnnn/`，可在彈珠頁「⚙ 網頁版遊戲網址」改；只接受自己的 github.io 或 localhost（外框頁也檢查，避免網址參數被拿來載入別人的程式）。
- **限制**：遊戲本身不知道有題目，所以沒有答對傷害加成、答錯扣血；遊戲音效若被遊戲內設定完全關掉可能偵測不到（未實測）；第一次載入約 30 MB；Peglin 的冒險存檔由遊戲自己存在瀏覽器（與 peglinnnnnnn 網頁本身的存檔分開）。可以點的圖解、互動模擬、字母發音只在學習模式。
- **測試**：`tools/peglin-web-qa/check.cjs`（headless Edge＋SwiftShader，file:// 開 index.html，實際載入遊戲、等標題畫面出現、開新冒險、打進第一關發射，備份／還原 localStorage）28／28 通過；結果 `docs/peglin-web/qa.json`、截圖 `output/playwright/peglin-web-*.png`。需要網路，整趟約 8 分鐘。沒有實機 iPad／手機實玩測試。

## 本機版架構：題庫在這裡，遊戲本體在 E:\PeglinQuiz

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
- **別台電腦用不了本機版**：要呼叫本機 `127.0.0.1:18769`，別人的電腦沒有這個服務（請用網頁版）；啟動器也只接受 `peglin-link.json` 的 `allowOrigins`（你的 GitHub Page）、localhost 與本機檔案的呼叫，其他網站一律 403。
- GitHub Page 是 https、啟動器是本機 http：Chrome／Edge 第一次可能詢問「允許存取本機網路裝置」，請按允許。GitHub Page 上不會主動探測本機（連進入彈珠頁面也不會），要用本機版時在側欄「🖥 本機版 PeglinQuiz」按「偵測本機啟動器」；file:// 與 localhost 開啟時照舊自動偵測。網頁版和本機版都連不到時，才顯示原本的說明。

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
