// 哥布林彈珠存檔的雲端同步（peglin/web.html ＋ js/peglin.js ＋ js/cloud.js）快速檢查：
// 不載入真的遊戲（擋掉 peglinnnnnnn 的建置檔），用假的 /idbfs 存檔＋攔截 Supabase 請求的記憶體模擬雲端，
// 三個獨立 context 當三台裝置。所有對真實 Supabase 網址的請求都被攔下，不會碰到正式資料。
// 用法：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/peglin-web-qa/cloud-save.cjs
const { chromium } = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const report = { at: new Date().toISOString(), checks: [], issues: [] };
const ok = (name, cond, extra) => { report.checks.push({ name, pass: !!cond, ...(extra ? { extra } : {}) }); if (!cond) report.issues.push(name); console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond || !extra ? '' : ' ' + JSON.stringify(extra))); };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.statusCode = 404; return res.end(); }
  res.setHeader('Content-Type', MIME[path.extname(p)] || 'application/octet-stream'); fs.createReadStream(p).pipe(res);
});
// 記憶體雲端：saves 表，主鍵 user_id＋project
const rows = new Map(); let calls = [];
async function mockSupabase(route) {
  const req = route.request(), u = new URL(req.url()), m = req.method();
  let bp = ''; try { bp = (JSON.parse(req.postData() || '{}').project) || ''; } catch {}
  calls.push(m + ' ' + u.pathname + ' ' + (u.searchParams.get('project') || bp));
  const json = (code, body) => route.fulfill({ status: code, contentType: 'application/json', body: JSON.stringify(body) });
  if (!u.pathname.startsWith('/rest/v1/saves')) return json(200, {});
  const uid = (u.searchParams.get('user_id') || '').replace('eq.', ''), proj = (u.searchParams.get('project') || '').replace('eq.', ''), key = uid + '|' + proj;
  if (m === 'GET') return json(200, rows.has(key) ? [rows.get(key)] : []);
  const body = JSON.parse(req.postData() || '{}');
  if (m === 'POST') { const k = body.user_id + '|' + body.project; if (rows.has(k)) return json(409, { message: 'duplicate' }); rows.set(k, body); return json(201, [body]); }
  if (m === 'PATCH') { if (!rows.has(key)) return json(200, []); const r = Object.assign(rows.get(key), body); return json(200, [r]); }
  return json(400, {});
}
const DIR_A = '/idbfs/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', DIR_B = '/idbfs/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const seed = (page, dir, bytes, ts) => page.evaluate(([dir, bytes, ts]) => new Promise(res => {
  const r = indexedDB.open('/idbfs', 21);
  r.onupgradeneeded = () => { const s = r.result.createObjectStore('FILE_DATA'); s.createIndex('timestamp', 'timestamp', { unique: false }); };
  r.onsuccess = () => { const db = r.result, tx = db.transaction('FILE_DATA', 'readwrite'), st = tx.objectStore('FILE_DATA');
    st.put({ timestamp: new Date(ts), mode: 16877 }, dir); st.put({ timestamp: new Date(ts), mode: 33206, contents: new Int8Array(bytes) }, dir + '/Save_0.data');
    st.put({ timestamp: new Date(ts), mode: 33206, contents: new Int8Array([9]) }, dir + '/Unity/analytics'); tx.oncomplete = () => { db.close(); res(); }; };
}), [dir, bytes, ts]);
const readSave = page => page.evaluate(() => new Promise(res => { const r = indexedDB.open('/idbfs'); r.onsuccess = () => { const db = r.result; if (!db.objectStoreNames.contains('FILE_DATA')) { db.close(); return res(null); } const out = {}; const st = db.transaction('FILE_DATA').objectStore('FILE_DATA'); st.openCursor().onsuccess = e => { const c = e.target.result; if (!c) { db.close(); return res(out); } if (/Save_0\.data$/.test(c.key)) out[c.key] = Array.from(c.value.contents); c.continue(); }; }; }));

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const BASE = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true });
  const device = async name => {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 800 } });
    await ctx.route(/supabase\.co\//, mockSupabase);
    await ctx.route(/yc0935019269cloud-create\.github\.io\/peglinnnnnnn\//, r => r.abort());   // 不載入真的遊戲
    const page = await ctx.newPage(); page.on('pageerror', e => report.issues.push(name + ' pageerror: ' + e));
    await page.goto(BASE + '/index.html'); await page.waitForFunction(() => typeof PEGLIN !== 'undefined' && typeof CLOUD !== 'undefined');
    await page.evaluate(() => { localStorage.setItem(SKEY('cloud'), JSON.stringify({ sess: { at: 'tok', rt: 'r', exp: 4e9, uid: 'u1', email: 'qa@example.com' }, rev: null })); VOL.set('muted', true); });
    await page.reload(); await page.waitForTimeout(3000);   // 刷題進度的雲端同步可能套用雲端存檔而重新整理一次
    await page.waitForLoadState(); await page.waitForFunction(() => typeof PEGLIN !== 'undefined' && CLOUD.signedIn); await page.waitForTimeout(1500);
    return { ctx, page };
  };
  const open = page => page.evaluate(() => { U.clearModals && U.clearModals(); const cfg = { subjects: Object.keys(C.SUBJECTS), exams: [], years: [], types: ['single'], status: 'all', pref: 'rand', count: '5', per: 1, shots: 1, onWrong: 'count', retryWrong: false }; PEGLIN.web.open(PEGLIN.web.quizSession(cfg, PEGLIN.web.quizIds(cfg, 5))); });
  const ready = page => page.waitForFunction(() => PEGLIN.web.state && PEGLIN.web.state.cloudReady, null, { timeout: 20000 });
  const close = async page => { await page.evaluate(() => PEGLIN.web.close(true)); await page.waitForFunction(() => !document.querySelector('#pgwClosing'), null, { timeout: 8000 }); await page.waitForTimeout(500); };
  const cloud = () => { const r = rows.get('u1|' + [...rows.keys()].map(k => k.split('|')[1]).find(p => /:peglin$/.test(p))); return r; };
  try {
    // 裝置 A：本機有存檔 → 開遊戲（雲端沒有）→ 結束時上傳
    const A = await device('A');
    await seed(A.page, DIR_A, [1, 2, 3], Date.now() - 1000);
    await open(A.page); await ready(A.page);
    calls = []; await close(A.page);
    const c1 = cloud();
    ok('A：結束時把本機遊戲存檔上傳成另一筆 <題庫>:peglin（只有 Save_0.data 等頂層檔案，不含 Unity 子資料夾）', c1 && c1.data.files['Save_0.data'] && c1.data.files['Save_0.data'].b64 === 'AQID' && !Object.keys(c1.data.files).some(k => k.includes('/')), { c1: c1 && Object.keys(c1.data.files), calls });
    const mainRowUntouched = calls.every(c => !/PATCH|POST/.test(c) || /:peglin/.test(c));
    ok('A：結束時只寫彈珠那一筆，沒有連帶上傳刷題進度', mainRowUntouched, calls);
    // 再開一次、沒玩（存檔沒變）→ 結束時不重複上傳
    await open(A.page); await ready(A.page); calls = []; await close(A.page);
    ok('A：存檔沒變動時不重複上傳', !calls.some(c => /PATCH|POST/.test(c) && /:peglin/.test(c)), calls);

    // 裝置 B：本機有較舊的存檔 → 開遊戲時套用雲端那份，舊的留備份
    const B = await device('B');
    await seed(B.page, DIR_B, [7, 7], Date.parse('2024-01-01'));
    await open(B.page); await ready(B.page); await B.page.waitForTimeout(800);
    const bSave = await readSave(B.page), bBak = await B.page.evaluate(() => JSON.parse(localStorage.getItem(SKEY('peglin-cloud-bak')) || 'null'));
    ok('B：開遊戲前套用雲端存檔（寫進這台自己的存檔資料夾），這台舊的那份備份在本機', JSON.stringify(bSave[DIR_B + '/Save_0.data']) === '[1,2,3]' && bBak && bBak.from === '這台裝置', { bSave, bBak: bBak && bBak.from });
    await close(B.page);

    // 裝置 B 玩過（存檔變新）→ 上傳；A 下次開遊戲拿到 B 的版本
    await seed(B.page, DIR_B, [4, 5, 6, 7], Date.now() + 5000);
    await open(B.page); await ready(B.page); await close(B.page);
    ok('B：玩過後結束時上傳新存檔', cloud().data.files['Save_0.data'].b64 === 'BAUGBw==', cloud().data.files['Save_0.data']);
    await open(A.page); await ready(A.page); await A.page.waitForTimeout(800);
    ok('A：下次開遊戲自動拿到 B 的新存檔（A 沒改過，不留備份）', JSON.stringify((await readSave(A.page))[DIR_A + '/Save_0.data']) === '[4,5,6,7]');
    await close(A.page);

    // 兩邊都改過、這台比較新 → 用這台的，雲端那份備份（先讓 B 再上傳一版，A 也在本機玩過）
    await seed(B.page, DIR_B, [5, 5], Date.now() + 10000);
    await open(B.page); await ready(B.page); await close(B.page);
    await seed(A.page, DIR_A, [8, 8, 8], Date.now() + 60000);
    await open(A.page); await ready(A.page); await A.page.waitForTimeout(500);
    const aSave = await readSave(A.page), aBak = await A.page.evaluate(() => JSON.parse(localStorage.getItem(SKEY('peglin-cloud-bak')) || 'null'));
    ok('A：兩邊都改過且這台較新 → 不套用雲端、雲端那份備份在本機', JSON.stringify(aSave[DIR_A + '/Save_0.data']) === '[8,8,8]' && aBak && aBak.from === '雲端');
    await close(A.page);
    ok('A：結束後把較新的這份上傳', cloud().data.files['Save_0.data'].b64 === 'CAgI');

    // 新裝置 C：還沒有遊戲存檔資料夾 → 等遊戲第一次建好資料夾後寫入雲端存檔並自動重載一次
    const C = await device('C');
    await open(C.page); await ready(C.page);
    const frame = () => C.page.frames().find(f => /peglin\/web\.html/.test(f.url()));
    await frame().evaluate(dir => new Promise(res => { const r = indexedDB.open('/idbfs', 21); r.onupgradeneeded = () => r.result.createObjectStore('FILE_DATA'); r.onsuccess = () => { const db = r.result, tx = db.transaction('FILE_DATA', 'readwrite'); tx.objectStore('FILE_DATA').put({ timestamp: new Date(), mode: 33206, contents: new Int8Array([0]) }, dir + '/Save_0.data'); tx.oncomplete = () => { db.close(); res(); }; }; }), '/idbfs/cccccccccccccccccccccccccccccccc');   // 模擬遊戲第一次啟動建好預設存檔
    await C.page.waitForFunction(() => /彈珠存檔/.test(document.body.textContent) && JSON.parse(localStorage.getItem(SKEY('peglin-cloud')) || '{}').localAt, null, { timeout: 15000 }).catch(() => {});
    await C.page.waitForTimeout(3000);
    const cSave = await readSave(C.page);
    ok('C（新裝置、沒有存檔資料夾）：遊戲建好資料夾後寫入雲端存檔並自動重載一次', JSON.stringify(cSave['/idbfs/cccccccccccccccccccccccccccccccc/Save_0.data']) === '[8,8,8]', cSave);
    // 沒登入：不讀不寫雲端
    await C.page.evaluate(() => { PEGLIN.web.close(true); });
    await C.page.waitForTimeout(3000);
    await C.page.evaluate(() => { const m = JSON.parse(localStorage.getItem(SKEY('cloud'))); m.sess = null; localStorage.setItem(SKEY('cloud'), JSON.stringify(m)); });
    await C.page.reload(); await C.page.waitForFunction(() => typeof PEGLIN !== 'undefined');
    calls = []; await open(C.page); await ready(C.page); await close(C.page);
    ok('沒登入雲端同步：開關遊戲都不呼叫雲端', !calls.some(c => /:peglin/.test(c)), calls);
  } catch (e) { report.issues.push('exception: ' + (e && e.stack || e)); console.log('EXCEPTION', e); }
  finally {
    report.pass = report.checks.filter(c => c.pass).length; report.total = report.checks.length;
    fs.mkdirSync(path.join(ROOT, 'docs/peglin-web'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'docs/peglin-web/cloud-save-qa.json'), JSON.stringify(report, null, 1));
    console.log(`\n${report.pass}/${report.total} passed, issues: ${report.issues.length}`);
    await browser.close(); server.close();
  }
})();
