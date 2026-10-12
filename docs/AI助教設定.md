# AI 助教設定

AI 助教是遊戲裡的聊天視窗（營地「AI 助教」、頂部 ☰ 選單、題目詳解旁的「💬 問 AI」）。它會先在本機的題庫與學習教材裡找相關段落，連同問題送給 AI，回答附 [1][2] 出處；🔎 查證會查維基百科與 PubMed。

## 安全設計

```
網頁（GitHub Page，公開）          Supabase（你的專案）                  AI 服務
───────────────────────          ───────────────────────────          ─────────
登入憑證 ＋ 問題  ──────────▶  ai-chat 轉送程式                    Google Gemini
（沒有任何 AI 金鑰）              1. ai_status：已登入？在白名單？      → Groq
                                     今天還有次數？                    → OpenRouter
                                  2. 用 Secrets 裡的金鑰依序呼叫  ───▶ → NVIDIA
                ◀──────────────  3. 成功才 ai_take 扣一次
```

- **金鑰只放在 Supabase 的 Secrets**，不在 repo、不在網頁原始碼、也不會傳到瀏覽器。
- **白名單**：只有 `ai_allow` 表裡的信箱能用。任何人都能用信箱登入，但不在名單上的人一律被擋。名單只能在 Supabase 後台改，網頁讀不到。
- **每人每日上限**（預設 30 次，台灣時間 0 點重置）。失敗的請求不扣次數。
- **只用固定的免費模型**：模型清單寫在轉送程式裡，網頁無法指定或改成付費模型。
- 單次回答長度、對話長度、附帶資料長度都有上限。
- 隨時可以停用：把某人從 `ai_allow` 刪掉，或刪除 `ai-chat` 函式。

## 第一次設定（只做一次）

需要先完成雲端同步的設定（`docs/雲端同步設定.md`），AI 助教用同一個 Supabase 專案與同一套信箱登入。

### 1. 建立白名單與用量表

Supabase 後台 → **SQL Editor** → New query → 貼上 `supabase/ai-setup.sql` 的全部內容 → **Run**。重複執行沒關係。

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

### 4. 加入可以使用的人

後台 → **Table Editor** → `ai_allow` → Insert row：`email` 填對方登入用的信箱，`daily_limit` 填每天次數。或在 SQL Editor 執行：

```sql
insert into public.ai_allow (email, daily_limit, note) values
  ('someone@gmail.com', 30, '朋友')
on conflict (email) do update set daily_limit = excluded.daily_limit;
```

對方打開網頁 → ☰ → 雲端同步／登入（信箱驗證碼）→ 就能使用 AI 助教。

## 日常管理

- **調整次數**：改 `ai_allow.daily_limit`。
- **看用量**：Table Editor → `ai_usage`（每人每天一列）。
- **停用某人**：刪掉他在 `ai_allow` 的那一列。
- **換服務順序或模型**：改 `supabase/functions/ai-chat/index.ts` 最上面的 `CHAIN`，重新部署。目前順序：Google（gemini-3.5-flash → gemini-2.5-flash → gemini-3.5-flash-lite）→ Groq（qwen3.8-27b → gpt-oss-120b）→ OpenRouter（nemotron-3-ultra → gemma-4-31b → openrouter/free）→ NVIDIA（glm-5.3-flash → nemotron-3-super）。
- **免費模型會變動**：某個模型下架時，回答會自動改用下一個；想換掉就改 `CHAIN`。

## 常見問題

- **「雲端專案還沒有建立 AI 助教」**：第 1 步的 SQL 還沒執行。
- **「還沒有開通 AI 助教」**：登入的信箱不在 `ai_allow`（大小寫不影響）。
- **「所有 AI 服務都暫時無法回答」**：每家都忙或額度用完；這次不扣次數。點訊息裡的「詳細」可以看到每家的錯誤原因。
- **瀏覽器顯示 CORS 錯誤**：第 2 步的 JWT 驗證沒有關掉，或函式名稱不是 `ai-chat`。
- **金鑰外流的疑慮**：到各服務網站重新產生金鑰，再更新 Secrets 即可；網頁與 repo 不用改。

## 測試

- 轉送程式可以在 Node 24 直接載入（`handle(request, env)`，只用標準 fetch），用假的資料庫函式搭配真的 AI 服務測試。
- 本機開發時，`localStorage.ai_endpoint` 可以把網頁指到別的轉送程式網址。
