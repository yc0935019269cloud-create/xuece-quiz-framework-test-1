// 逐步渲染掃描：血液供應三單元的每一步，以及眼解剖 8 個既有單元「國考重點複習」課的每一步
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/eye115-qa/sweep.cjs
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const NEW = ['blood-vessels', 'blood-ciliary', 'blood-retina'];
const REVIEW = ['ans-basics', 'ans-pathways', 'ans-trigeminal', 'ans-reflex', 'ans-clinical', 'cornea-general', 'cornea-layers', 'cornea-supply'];
(async () => {
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, executablePath: process.env.PW_EXE || undefined });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
  await page.goto(URL);
  await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
  await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
  const key = await page.evaluate(() => SKEY('learn'));
  let n = 0; const bad = [];
  for (const id of NEW.concat(REVIEW)) {
    const plan = await page.evaluate((id) => { const p = LEARN_UI.packs.find(x => x.id === id); return p.lessons.map((l, li) => ({ li, lid: l.id, title: l.title, steps: l.steps.length })); }, id);
    for (const L of plan) {
      if (!NEW.includes(id) && !/^國考重點複習/.test(L.title)) continue;
      for (let si = 0; si < L.steps; si++) {
        await page.evaluate(({ k, id, L, si }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + L.lid] = { i: si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, id, L, si });
        await page.reload();
        await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
        await page.evaluate((id) => App.go('learn', { pack: id }), id);
        try {
          await page.click(`[data-play="${L.li}"]`);
          await page.waitForTimeout(80);
          const len = await page.evaluate(() => { const el = document.querySelector('#lpBody'); return el ? el.innerText.length : 0; });
          if (len < 5) bad.push(`${id}/${L.lid}#${si} empty`);
        } catch (e) { bad.push(`${id}/${L.lid}#${si} ${String(e).slice(0, 60)}`); }
        n++;
      }
    }
  }
  console.log('渲染步驟數：', n, '空白／失敗：', bad.length, bad.slice(0, 8), '頁面錯誤：', errs.length, errs.slice(0, 5));
  await b.close();
  process.exit(bad.length || errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
