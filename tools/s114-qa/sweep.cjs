// 逐步渲染掃描：新單元（第01～03單元）每一課的每一步，以及各視光學單元「國考重點複習」課的每一步，確認都能顯示且沒有頁面錯誤
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/s114-qa/sweep.cjs
// 使用一次性的 headless Edge context（不碰使用者的瀏覽器存檔）
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const NEW = ['s114-optometry-va-sph', 's114-optometry-astigmatism-rx', 's114-optometry-retinoscopy-intro'];
const REVIEW = ['s114-optometry-pd-lensometry-p2', 's114-optometry-objective-refraction-p2', 's114-optometry-keratometry-p2', 's114-optometry-pupil-response-p2', 's114-optometry-stereopsis-p2', 's114-optometry-near-point-p2', 'optom2-u1-intro', 'optom2-u2-msr', 'optom2-u3-vf', 'optom2-u4-bb'];
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
    const plan = await page.evaluate((id) => { const p = LEARN_UI.packs.find(x => x.id === id); return p.lessons.map((l, li) => ({ li, lid: l.id, steps: l.steps.length })); }, id);
    for (const L of plan) {
      if (!NEW.includes(id) && L.li !== plan.length - 1) continue;
      for (let si = 0; si < L.steps; si++) {
        await page.evaluate(({ k, id, L, si }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + L.lid] = { i: si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, id, L, si });
        await page.reload();
        await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
        await page.evaluate((id) => App.go('learn', { pack: id }), id);
        try {
          await page.click(`[data-play="${L.li}"]`);
          await page.waitForTimeout(100);
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
