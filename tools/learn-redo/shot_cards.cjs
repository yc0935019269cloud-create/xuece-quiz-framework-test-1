// 只截「概念頁」（card），桌機寬度，整個單元一次：node tools/learn-redo/shot_cards.cjs <unitId> [lessonId...]
// 輸出 output/playwright/rv-<unit>-<lesson>-<step>.png
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const [UNIT, ...ONLY] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await (await b.newContext({ viewport: { width: process.env.W ? +process.env.W : 900, height: 900 } })).newPage();
  await page.goto(URL);
  await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
  const key = await page.evaluate(() => SKEY('learn'));
  const plan = await page.evaluate(id => LEARN_UI.packs.find(x => x.id === id).lessons.map((l, li) => ({ li, lid: l.id, t: l.steps.map(s => s.type) })), UNIT);
  for (const L of plan) {
    if (ONLY.length && !ONLY.includes(L.lid)) continue;
    for (let si = 0; si < L.t.length; si++) {
      if (!['card', 'intro'].includes(L.t[si])) continue;
      await page.evaluate(({ k, id, lid, si }) => { const D = { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + lid] = { i: si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, id: UNIT, lid: L.lid, si });
      await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
      await page.evaluate(id => App.go('learn', { pack: id }), UNIT);
      await page.click(`[data-play="${L.li}"]`);
      await page.waitForTimeout(400);
      await (await page.$('#lpBody')).screenshot({ path: path.join(ROOT, 'output/playwright', `rv-${UNIT}-${L.lid}-${String(si).padStart(2, '0')}.png`) });
    }
  }
  await b.close(); console.log('ok');
})();
