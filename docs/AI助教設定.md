# AI 助教設定

AI 助教是遊戲裡的聊天視窗（營地「AI 助教」、頂部 ☰ 選單、題目詳解旁的「💬 問 AI」）。它會先在本機的題庫與學習教材裡找相關段落，連同問題送給 AI，回答附 [1][2] 出處；🔎 查證會查維基百科與 PubMed。

在學習模式的課程或知識筆記裡，一般提問就會自動附上當頁文字與圖片；視窗會顯示本頁的附圖張數。「✨ 把這頁講得更好懂」也使用相同圖文。圖解／題圖會保留畫面上的編號及位置，AI 可對照圖片與名稱說明。還沒作答的題目，AI 只講觀念和思考方向、不直接給答案。

圖片先在瀏覽器轉為 JPEG，最長邊不超過 2048px，每次最多 8 張；不傳本機檔案路徑。`file://` 若受畫布存取限制，改讀 `js/cloud-config.js` 的 `assets` 公開網站副本；新導入而尚未發布的本機圖片可能無法讀取，此時會明確顯示錯誤，不會假裝已看圖。HTTP(S) 使用當前網站的圖片。互動 iframe／動畫僅提供其文字，不包含即時動畫截圖。

含圖時只嘗試 Google Gemini 與 OpenRouter 的 `google/gemma-4-31b-it:free` 視覺模型，保留原圖文後再備援；不可把圖片丟掉後降成純文字服務。視覺服務都失敗時回覆明確錯誤，不扣次數。文字提問仍沿用原有完整服務鏈。標準格式依 [Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai) 與 [Gemma 4 31B 模型說明](https://openrouter.ai/google/gemma-4-31b-it:free)。

## 安全設計

```
網頁（GitHub Page，公開）          Supabase（你的專案）                  AI 服務
───────────────────────          ───────────────────────────          ─────────
登入憑證 ＋ 問題  ──────────▶  ai-chat 轉送程式                    Google Gemini
（沒有任何 AI 金鑰）              1. ai_status：已登入？被停用？        → Groq
                                     （有設上限才檢查次數）            → OpenRouter
                                  2. 用 Secrets 裡的金鑰依序呼叫  ───▶ → NVIDIA
                ◀──────────────  3. 成功才 ai_take 記一次
```

- **金鑰只放在 Supabase 的 Secrets**，不在 repo、不在網頁原始碼、也不會傳到瀏覽器。
- **需要登入**（信箱驗證碼）才能用；轉送程式不會對沒登入的請求呼叫 AI。
- **預設不限次數、不需要白名單**：登入的人都能用。萬一有人濫用，在 `ai_limits` 表對那個信箱設 `daily_limit`（每天上限，台灣時間 0 點重置）或 `blocked = true`（停用），不用改程式。這張表只能在 Supabase 後台改，網頁讀不到。
- 失敗的請求不記次數。所有用量記在 `ai_usage`，方便查看。
- **只用固定的免費模型**：模型清單寫在轉送程式裡，網頁無法指定或改成付費模型。
- 單次回答長度、對話長度、附帶資料長度都有上限。
- 隨時可以停用：對某人設 `blocked`，或刪除 `ai-chat` 函式（全部停用）。
- **注意**：因為不限次數，免費額度是所有使用者共用的；Google 金鑰所在的 Cloud 專案**不要綁定付款**（只用免費方案），否則被大量使用時可能產生費用。

## 第一次設定（只做一次）

需要先完成雲端同步的設定（`docs/雲端同步設定.md`），AI 助教用同一個 Supabase 專案與同一套信箱登入。

### 1. 建立個別設定與用量表

Supabase 後台 → **SQL Editor** → New query → 貼上 `supabase/ai-setup.sql` 的全部內容 → **Run**。重複執行沒關係。
（建立 `ai_limits` 個別設定表、`ai_usage` 用量表與兩個資料庫函式。）

### 2. 部署轉送程式

**做法 A：後台網頁（不用安裝任何東西）**

1. 後台 → **Edge Functions** → **Deploy a new function** → **Via Editor**。
2. 函式名稱填 `ai-chat`（一定要這個名字）。
3. 把 `supabase/functions/ai-chat/index.ts` 的全部內容貼上，取代預設程式 → **Deploy function**。
4. 進入 `ai-chat` → **Details**（或 Settings）→ 關閉 **Verify JWT with legacy secret**／**Enforce JWT verification** → Save。
   （登入檢查由程式自己透過資料庫函式做；關掉這個選項是為了讓瀏覽器的預檢請求能通過。）

**做法 B：Supabase CLI**

```bash
npx supabase login
```

```bash
npx supabase functions deploy ai-chat --project-ref <你的 project ref> --no-verify-jwt
```

### 3. 放入金鑰

後台 → **Edge Functions** → **Secrets**（或 Project Settings → Edge Functions）→ 新增：

| 名稱 | 來源 | 免費額度（2026-10 實測／官方說明） |
|---|---|---|
| `GEMINI_API_KEY` | Google AI Studio | 有免費方案；次數依模型而定，以 AI Studio 顯示為準 |
| `GROQ_API_KEY` | console.groq.com | 免費；gpt-oss-120b 每天約 1,000 次、每分鐘約 8,000 tokens |
| `OPENROUTER_API_KEY` | openrouter.ai | 免費模型每分鐘 20 次；每天 50 次（累計儲值滿 10 美元後 1,000 次） |
| `NVIDIA_API_KEY` | build.nvidia.com | 依 NVIDIA 帳號的額度 |

沒填的服務會自動略過。CLI 也可以用 `npx supabase secrets set --project-ref <ref> --env-file <檔案>`（檔案不要放在 repo 裡）。

### 4. 開始使用

不用加白名單：對方打開網頁 → ☰ → 雲端同步／登入（信箱驗證碼）→ 就能使用 AI 助教。

## 日常管理

- **看用量**：Table Editor → `ai_usage`（每人每天一列；`user_id` 對應 Authentication → Users）。
- **限制某人**：Table Editor → `ai_limits` → Insert row：`email` 填他的信箱、`daily_limit` 填每天次數。或在 SQL Editor：
  ```sql
  insert into public.ai_limits (email, daily_limit, note) values ('someone@gmail.com', 20, '限制')
  on conflict (email) do update set daily_limit = excluded.daily_limit;
  ```
- **停用某人**：同一列把 `blocked` 設為 true；刪掉那一列就恢復不限次數。
- **換服務順序或模型**：改 `supabase/functions/ai-chat/index.ts` 最上面的 `CHAIN`，重新部署。目前順序：Google（gemini-3.5-flash → gemini-2.5-flash → gemini-3.5-flash-lite）→ Groq（qwen3.8-27b → gpt-oss-120b）→ OpenRouter（nemotron-3-ultra → gemma-4-31b → openrouter/free）→ NVIDIA（glm-5.3-flash → nemotron-3-super）。
- **免費模型會變動**：某個模型下架時，回答會自動改用下一個；想換掉就改 `CHAIN`。

## 常見問題

- **「雲端專案還沒有建立 AI 助教」**：第 1 步的 SQL 還沒執行。
- **「AI 助教已被停用」**：那個信箱在 `ai_limits` 被設為 blocked（信箱大小寫不影響）。
- **「所有 AI 服務都暫時無法回答」**：每家都忙或額度用完；這次不扣次數。點訊息裡的「詳細」可以看到每家的錯誤原因。
- **瀏覽器顯示 CORS 錯誤**：第 2 步的 JWT 驗證沒有關掉，或函式名稱不是 `ai-chat`。
- **金鑰外流的疑慮**：到各服務網站重新產生金鑰，再更新 Secrets 即可；網頁與 repo 不用改。

## 測試

- 2026-10-19：後端多模態／登入／上限／備援／用量 21 項、桌機與手機 HTTP＋桌機 file:// 圖文傳送 40 項通過。影像像素與編號已檢視；瀏覽器測試使用模擬雲端與模型回應，未驗證真實模型對解剖圖的解讀品質。
- Supabase `ai-chat` 已部署為 version 3、ACTIVE；正式端點 OPTIONS 204／未登入 POST 401 已驗證。未使用真實學生帳號做圖文對話。
- 工具與界限：`tools/ai-vision-qa/README.md`。

- 轉送程式可以在 Node 24 直接載入（`handle(request, env)`，只用標準 fetch），用假的資料庫函式搭配真的 AI 服務測試。
- 本機開發時，`localStorage.ai_endpoint` 可以把網頁指到別的轉送程式網址。
