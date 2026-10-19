import { handle } from '../../supabase/functions/ai-chat/index.ts';
import fs from 'node:fs';
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aO1sAAAAASUVORK5CYII=';
const payload = (url = image) => ({ system: 'Tutor', messages: [{ role: 'user', content: [{ type: 'text', text: '圖上的 1 在哪裡？' }, { type: 'image_url', image_url: { url } }] }] });
const result = { checks: [], problems: [] };
const check = (name, pass) => { result.checks.push({ name, ok: !!pass }); if (!pass) result.problems.push(name); };
const originalFetch = globalThis.fetch;
let calls, state;
function mock(options = {}) {
  calls = []; state = { allowed: true, limit: null, ...options };
  globalThis.fetch = async (url, opt) => {
    const body = JSON.parse(opt.body); calls.push({ url, body });
    if (url.endsWith('/ai_status')) return Response.json(state);
    if (url.endsWith('/ai_take')) return Response.json({ used: 1 });
    if (state.fail || (state.googleFail && url.includes('googleapis'))) return Response.json({ error: { message: 'busy' } }, { status: 429 });
    return Response.json({ model: body.model, choices: [{ message: { content: '圖文已接收' }, finish_reason: 'stop' }] });
  };
}
const env = { SUPABASE_URL: 'https://database.test', GEMINI_API_KEY: 'fixture', GROQ_API_KEY: 'fixture', OPENROUTER_API_KEY: 'fixture', NVIDIA_API_KEY: 'fixture' };
async function send(body, auth = true, overrides = {}) {
  const res = await handle(new Request('https://function.test', { method: 'POST', headers: { ...(auth ? { authorization: 'Bearer fixture' } : {}), apikey: 'fixture' }, body: JSON.stringify(body) }), { ...env, ...overrides });
  return { status: res.status, body: await res.json() };
}
try {
  mock(); let r = await send(payload(), false);
  check('unauthenticated rejected without upstream calls', r.status === 401 && !calls.length);
  mock(); r = await send(payload());
  check('multimodal request accepted', r.status === 200 && r.body.images === 1);
  check('pixel bytes reach provider unchanged', calls.find(x => x.url.includes('googleapis')).body.messages.at(-1).content[1].image_url.url === image);
  check('usage charged exactly once after success', calls.filter(x => x.url.endsWith('/ai_take')).length === 1);
  mock({ googleFail: true }); r = await send(payload());
  check('vision fallback succeeds', r.status === 200 && r.body.model === 'google/gemma-4-31b-it:free');
  check('vision never sent to text-only providers', calls.every(x => !/groq|nvidia\.com/.test(x.url)));
  check('router receives original images', calls.find(x => x.url.includes('openrouter')).body.messages.at(-1).content[1].image_url.url === image);
  mock(); r = await send(payload(), true, { GEMINI_API_KEY: '', OPENROUTER_API_KEY: '' });
  check('no vision service returns explicit failure', r.status === 502 && r.body.error === 'vision_unavailable');
  check('no vision service does not charge', !calls.some(x => x.url.endsWith('/ai_take')));
  mock({ fail: true }); r = await send(payload());
  check('all vision failures preserve images and do not charge', r.status === 502 && !calls.some(x => x.url.endsWith('/ai_take')));
  mock({ blocked: true, allowed: false, reason: 'blocked' }); r = await send(payload());
  check('blocked account cannot call vision', r.status === 403 && calls.length === 1);
  mock({ limit: 5, remaining: 0 }); r = await send(payload());
  check('quota applies to vision', r.status === 429 && calls.length === 1);
  for (const [name, bad] of [['local path', 'file:///secret.png'], ['remote URL', 'https://example.com/image.png'], ['SVG', 'data:image/svg+xml;base64,PHN2Zz4='], ['fake image', 'data:image/png;base64,YWJjZA==']]) {
    mock(); r = await send(payload(bad)); check('reject ' + name + ' before upstream', r.status === 400 && calls.length === 0);
  }
  mock(); const many = payload(); many.messages[0].content.push(...Array.from({ length: 8 }, () => ({ type: 'image_url', image_url: { url: image } })));
  r = await send(many); check('image count bound enforced', r.status === 400 && !calls.length);
  mock(); const long = payload(); long.messages[0].content[0].text = 'x'.repeat(40001); r = await send(long);
  check('text budget enforced independently of images', r.status === 400 && !calls.length);
  mock(); r = await send({ messages: [{ role: 'user', content: '純文字問題' }] }, true, { GEMINI_API_KEY: '' });
  check('original text fallback unchanged', r.status === 200 && r.body.provider === 'Groq' && r.body.images === 0);
  mock(); const assistantImage = payload(); assistantImage.messages[0].role = 'assistant'; r = await send(assistantImage);
  check('assistant image injection rejected', r.status === 400 && !calls.length);
  mock(); const jpeg = payload('data:image/jpeg;base64,' + Buffer.from([255,216,255,224,0,16,74,70,73,70,0,1]).toString('base64')); r = await send(jpeg);
  check('browser JPEG encoding accepted', r.status === 200);
} finally { globalThis.fetch = originalFetch; }
fs.writeFileSync(new URL('../../output/playwright/ai-vision-backend.json', import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ checks: result.checks.length, problems: result.problems }));
process.exitCode = result.problems.length ? 1 : 0;
