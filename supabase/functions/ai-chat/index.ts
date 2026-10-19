/* AI 助教轉送程式（Supabase Edge Function，名稱 ai-chat）。說明：docs/AI助教設定.md
 *
 * - 金鑰只放在 Supabase → Edge Functions → Secrets：GEMINI_API_KEY、GROQ_API_KEY、OPENROUTER_API_KEY、NVIDIA_API_KEY。
 *   網頁、repo 都沒有金鑰；網頁只送「登入憑證＋問題」過來。
 * - 每次請求：資料庫函式 ai_status 確認「已登入、沒被停用、（有設上限的話）今天還有次數」→ 依序嘗試 Google → Groq → OpenRouter → NVIDIA
 *   （同一家內也依序換模型）→ 成功才呼叫 ai_take 記一次 → 回傳答案與實際使用的服務／模型。
 *   預設不限次數；只有在 ai_limits 表裡設了 daily_limit 的人才有上限。
 * - 只會用下方 CHAIN 裡的模型（都是免費額度可用的），網頁無法指定模型或關掉限制。
 * - 只用標準 fetch，沒有其他套件；Supabase 後台的網頁編輯器可以直接貼上部署。 */

type Part = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
type Msg = { role: 'system' | 'user' | 'assistant'; content: string | Part[] };
type Provider = { name: string; url: string; key: string; models: string[]; visionModels?: string[]; extra?: Record<string, unknown>; headers?: Record<string, string> };

// 依序嘗試；同一家內也依序換模型（額度用完、太忙、逾時、空白回答都會換下一個）
const CHAIN: Provider[] = [
  { name: 'Google', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', key: 'GEMINI_API_KEY',
    models: ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite'], visionModels: ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite'], extra: { reasoning_effort: 'low' } },
  { name: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', key: 'GROQ_API_KEY',
    models: ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b'] },
  { name: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', key: 'OPENROUTER_API_KEY',
    models: ['nvidia/nemotron-3-ultra-550b-a55b:free', 'google/gemma-4-31b-it:free', 'openrouter/free'],
    visionModels: ['google/gemma-4-31b-it:free'],
    headers: { 'X-Title': 'Quiz Dungeon' } },
  { name: 'NVIDIA', url: 'https://integrate.api.nvidia.com/v1/chat/completions', key: 'NVIDIA_API_KEY',
    models: ['z-ai/glm-5.3-flash', 'nvidia/nemotron-3-super-120b-a12b'] },
];

const LIMITS = {
  maxMessages: 16,      // 對話最多帶幾則
  maxChars: 40000,      // 全部文字（含教材段落）上限
  maxImages: 8,
  perImageChars: 2200000,
  totalImageChars: 8000000,
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
  let chars = 0, imageChars = 0, images = 0;
  if (typeof body.system === 'string' && body.system.trim()) msgs.push({ role: 'system', content: body.system.slice(0, 6000) });
  for (const m of body.messages.slice(-LIMITS.maxMessages)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return null;
    if (typeof m.content === 'string' && m.content.trim()) {
      chars += m.content.length;
      msgs.push({ role: m.role, content: m.content });
    } else if (m.role === 'user' && Array.isArray(m.content) && m.content.length && m.content.length <= LIMITS.maxImages * 2 + 1) {
      const parts: Part[] = [];
      let hasText = false;
      for (const part of m.content) {
        if (part?.type === 'text' && typeof part.text === 'string' && part.text.trim()) {
          chars += part.text.length; hasText = true; parts.push({ type: 'text', text: part.text });
        } else if (part?.type === 'image_url' && typeof part.image_url?.url === 'string') {
          const url = part.image_url.url;
          if (url.length > LIMITS.perImageChars || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(url)) return null;
          const [header, b64] = url.split(',');
          if (b64.length % 4) return null;
          let sig: string; try { sig = atob(b64.slice(0, 32)); } catch { return null; }
          if (!(header.includes('/jpeg') ? sig.startsWith('\xff\xd8\xff') : header.includes('/png') ? sig.startsWith('\x89PNG\r\n\x1a\n') : sig.startsWith('RIFF') && sig.slice(8, 12) === 'WEBP')) return null;
          images++; imageChars += url.length;
          if (images > LIMITS.maxImages || imageChars > LIMITS.totalImageChars) return null;
          parts.push({ type: 'image_url', image_url: { url } });
        } else return null;
      }
      if (!hasText) return null;
      msgs.push({ role: m.role, content: parts });
    } else return null;
  }
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return null;
  chars += typeof msgs[0].content === 'string' && msgs[0].role === 'system' ? msgs[0].content.length : 0;
  return chars > LIMITS.maxChars ? null : msgs;
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
  try {
    const raw = await req.text();
    if (raw.length > LIMITS.totalImageChars + LIMITS.maxChars + 12000) return json(400, { error: 'bad_request' });
    body = JSON.parse(raw);
  } catch { return json(400, { error: 'bad_request' }); }
  const msgs = clean(body);
  if (!msgs) return json(400, { error: 'bad_request' });
  const images = msgs.reduce((n, m) => n + (Array.isArray(m.content) ? m.content.filter(x => x.type === 'image_url').length : 0), 0);

  // 1. 登入、是否停用、今日次數（沒設上限＝不限）
  const st = await rpc(env, req, 'ai_status');
  if (st.status === 401 || st.status === 403) return json(401, { error: 'login' });
  if (!st.ok || !st.data) return json(500, { error: 'db', detail: st.data && (st.data.message || st.data.hint) });
  const s = st.data;
  if (!s.allowed) return json(s.reason === 'login' ? 401 : 403, { error: s.reason || 'blocked', email: s.email });
  if (s.limit != null && s.remaining <= 0) return json(429, { error: 'quota', limit: s.limit });

  // 2. 依序嘗試各家模型
  const deadline = Date.now() + LIMITS.total;
  const tried: string[] = [];
  for (const p of CHAIN) {
    const models = images ? p.visionModels || [] : p.models;
    if (!models.length) continue;
    const key = env[p.key];
    if (!key) { tried.push(`${p.name}：未設定金鑰`); continue; }
    for (const model of models) {
      if (deadline - Date.now() < 4000) break;
      try {
        const out = await callOne(p, model, key, msgs, deadline);
        // 3. 成功才記一次
        const tk = await rpc(env, req, 'ai_take');
        const t = tk.ok && tk.data ? tk.data : {};
        return json(200, { text: out.text, provider: p.name, model: out.model, truncated: out.truncated, images,
          used: t.used ?? null, limit: s.limit ?? null, remaining: s.limit == null ? null : (t.remaining ?? Math.max(s.remaining - 1, 0)), tried });
      } catch (e) {
        tried.push(`${p.name} ${model}：${(e as Error).message}`);
        if ((e as any).badKey) break;
      }
    }
  }
  return json(502, { error: images ? 'vision_unavailable' : 'all_failed', tried });
}

const D = (globalThis as any).Deno;
if (D && typeof D.serve === 'function') D.serve((req: Request) => handle(req, D.env.toObject()));
