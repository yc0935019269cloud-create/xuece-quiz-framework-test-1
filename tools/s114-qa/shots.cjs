// 截圖：新單元概念卡與國考重點複習課（桌機與 390px 手機），輸出到 output/playwright/s114-*.png
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/s114-qa/shots.cjs
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const OUT = path.join(ROOT, 'output', 'playwright');
const SHOTS = [
  { id: 's114-optometry-va-sph', lid: 'l2', kind: 'card', nth: 1, name: 's114-u01-l2-card' },
  { id: 's114-optometry-astigmatism-rx', lid: 'l5', kind: 'example', nth: 0, name: 's114-u02-l5-example' },
  { id: 's114-optometry-pd-lensometry-p2', lid: 'exam-review', kind: 'card', nth: 1, name: 's114-u04-review-card' },
  { id: 's114-optometry-near-point-p2', lid: 'exam-review', kind: 'example', nth: 0, name: 's114-u09-review-example' },
];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, executablePath: process.env.PW_EXE || undefined });
  for (const vp of [{ w: 1000, h: 900, tag: 'desktop' }, { w: 390, h: 860, tag: 'mobile' }]) {
    const ctx = await b.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
    const key = await page.evaluate(() => SKEY('learn'));
    for (const s of SHOTS) {
      const info = await page.evaluate(({ id, lid, kind, nth }) => {
        const p = LEARN_UI.packs.find(x => x.id === id); const li = p.lessons.findIndex(x => x.id === lid); const l = p.lessons[li];
        let c = -1, idx = -1; l.steps.forEach((st, i) => { if (st.type === kind) { c++; if (c === nth) idx = i; } });
        return { li, idx };
      }, s);
      await page.evaluate(({ k, s, info }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[s.id + '/' + s.lid] = { i: info.idx, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, s, info });
      await page.reload();
      await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
      await page.evaluate((id) => App.go('learn', { pack: id }), s.id);
      await page.click(`[data-play="${info.li}"]`);
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, `${s.name}-${vp.tag}.png`) });
    }
    await ctx.close();
  }
  await b.close();
  console.log('ok');
})().catch(e => { console.error(e); process.exit(2); });
