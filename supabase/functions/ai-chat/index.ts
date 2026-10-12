/* AI 助教轉送程式（Supabase Edge Function，名稱 ai-chat）。說明：docs/AI助教設定.md
 *
 * - 金鑰只放在 Supabase → Edge Functions → Secrets：GEMINI_API_KEY、GROQ_API_KEY、OPENROUTER_API_KEY、NVIDIA_API_KEY。
 *   網頁、repo 都沒有金鑰；網頁只送「登入憑證＋問題」過來。
 * - 每次請求：資料庫函式 ai_status 確認「已登入、在白名單、今天還有次數」→ 依序嘗試 Google → Groq → OpenRouter → NVIDIA
 *   （同一家內也依序換模型）→ 成功才呼叫 ai_take 扣一次 → 回傳答案與實際使用的服務／模型。
 * - 只會用下方 CHAIN 裡的模型（都是免費額度可用的），網頁無法指定模型或關掉限制。
 * - 只用標準 fetch，沒有其他套件；Supabase 後台的網頁編輯器可以直接貼上部署。 */

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };
type Provider = { name: string; url: string; key: string; models: string[]; extra?: Record<string, unknown>; headers?: Record<string, string> };

// 依序嘗試；同一家內也依序換模型（額度用完、太忙、逾時、空白回答都會換下一個）
const CHAIN: Provider[] = [
  { name: 'Google', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', key: 'GEMINI_API_KEY',
    models: ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite'], extra: { reasoning_effort: 'low' } },
  { name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', key: 'GROQ_API_KEY',
    models: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b'] },
  { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', key: 'OPENROUTER_API_KEY',
    models: ['nvidia/nemotron-3-ultra-550b-a55b:free', 'google/gemma-4-31b-it:free', 'openrouter/free'],
    headers: { 'X-Title': 'Quiz Dungeon' } },
  { name: 'NVIDIA', url: 'https://integrate.api.nvidia.com/v1/chat/completions', key: 'NVIDIA_API_KEY',
    models: ['z-ai/glm-5.3-flash', 'nvidia/nemotron-3-super-120b-a12b'] },
];

const LIMITS = {
  maxMessages: 16,      // 對話最多帶幾則
  maxChars: 40000,      // 全部文字（含教材段落）上限
  maxTokens: 2000,      // 每次回答長度上限
  perTry: 35000,        // 單一模型等多久（毫秒）
  total: 110000,        // 整個請求最多花多久
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};
const json = (status: number, obj: unknown) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });

/* 用使用者自己的登入憑證呼叫資料庫函式（RLS 與 auth.uid() 都以使用者身分計算） */
async function rpc(env: Record<string, string>, req: Request, name: string) {
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const r = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: req.headers.get('apikey') || env.SUPABASE_ANON_KEY || '',
      Authorization: req.headers.get('authorization') || '',
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  const t = await r.text();
  let data: any = null; try { data = JSON.parse(t); } catch { /* 非 JSON */ }
  return { ok: r.ok, status: r.status, data };
}

/* 檢查並整理網頁送來的內容 */
function clean(body: any): Msg[] | null {
  if (!body || !Array.isArray(body.messages)) return null;
  const msgs: Msg[] = [];
  if (typeof body.system === 'string' && body.system.trim()) msgs.push({ role: 'system', content: body.system.slice(0, 6000) });
  for (const m of body.messages.slice(-LIMITS.maxMessages)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string' || !m.content.trim()) return null;
    msgs.push({ role: m.role, content: m.content });
  }
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return null;
  const total = msgs.reduce((a, m) => a + m.content.length, 0);
  return total > LIMITS.maxChars ? null : msgs;
}

async function callOne(p: Provider, model: string, key: string, msgs: Msg[], deadline: number) {
  const ms = Math.min(LIMITS.perTry, deadline - Date.now());
  if (ms < 4000) throw new Error('時間不夠，略過');
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(p.url, {
      method: 'POST',
      signal: ac.signal,
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', ...(p.headers || {}) },
      body: JSON.stringify({ model, messages: msgs, max_tokens: LIMITS.maxTokens, ...(p.extra || {}) }),
    });
    const j: any = await r.json().catch(() => null);
    const jj = Array.isArray(j) ? j[0] : j;
    if (!r.ok) {
      const m = jj && (jj.error?.message || jj.message || jj.detail || jj.title);
      // 金鑰錯誤：同一家的其他模型也不用試了
      throw Object.assign(new Error(`HTTP ${r.status}${m ? ' ' + String(m).slice(0, 160) : ''}`), { badKey: r.status === 401 || r.status === 403 || /api key/i.test(String(m || '')) });
    }
    const ch = jj?.choices?.[0];
    let text: any = ch?.message?.content;
    if (Array.isArray(text)) text = text.map((x: any) => x?.text || '').join('');
    text = String(text || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    if (!text) throw new Error('空白回答');
    return { text, model: String(jj.model || model), truncated: ch.finish_reason === 'length' };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('逾時');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export async function handle(req: Request, env: Record<string, string>): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method' });
  if (!/^Bearer\s+\S+/i.test(req.headers.get('authorization') || '')) return json(401, { error: 'login' });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: 'bad_request' }); }
  const msgs = clean(body);
  if (!msgs) return json(400, { error: 'bad_request' });

  // 1. 登入、白名單、今日次數
  const st = await rpc(env, req, 'ai_status');
  if (st.status === 401 || st.status === 403) return json(401, { error: 'login' });
  if (!st.ok || !st.data) return json(500, { error: 'db', detail: st.data && (st.data.message || st.data.hint) });
  const s = st.data;
  if (!s.allowed) return json(s.reason === 'login' ? 401 : 403, { error: s.reason || 'not_allowed', email: s.email });
  if (s.remaining <= 0) return json(429, { error: 'quota', limit: s.limit });

  // 2. 依序嘗試各家模型
  const deadline = Date.now() + LIMITS.total;
  const tried: string[] = [];
  for (const p of CHAIN) {
    const key = env[p.key];
    if (!key) { tried.push(`${p.name}：未設定金鑰`); continue; }
    for (const model of p.models) {
      if (deadline - Date.now() < 4000) break;
      try {
        const out = await callOne(p, model, key, msgs, deadline);
        // 3. 成功才扣次數
        const tk = await rpc(env, req, 'ai_take');
        const left = tk.ok && tk.data && typeof tk.data.remaining === 'number' ? tk.data.remaining : Math.max(s.remaining - 1, 0);
        return json(200, { text: out.text, provider: p.name, model: out.model, truncated: out.truncated, remaining: left, limit: s.limit, tried });
      } catch (e) {
        tried.push(`${p.name} ${model}：${(e as Error).message}`);
        if ((e as any).badKey) break;
      }
    }
  }
  return json(502, { error: 'all_failed', tried });
}

const D = (globalThis as any).Deno;
if (D && typeof D.serve === 'function') D.serve((req: Request) => handle(req, D.env.toObject()));
