// 截圖：易讀版兩頁一組（白話概念頁、數字與考點頁）→ output/playwright/read-*.png
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
(async () => {
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, executablePath: process.env.PW_EXE || undefined });
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1000, height: 900 } : { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
    const key = await page.evaluate(() => SKEY('learn'));
    for (const [si, tag] of [[1, 'a'], [2, 'b']]) {
      await page.evaluate(({ k, si }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les['s114-optometry-va-sph/l1'] = { i: si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, si });
      await page.reload();
      await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
      await page.evaluate(() => App.go('learn', { pack: 's114-optometry-va-sph' }));
      await page.click('[data-play="0"]');
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(ROOT, 'output', 'playwright', `read-${mode}-${tag}.png`) });
    }
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(2); });
