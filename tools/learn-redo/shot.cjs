// 截圖某單元某課的每一步（桌機＋手機），給改寫教材時看排版。
// node tools/learn-redo/shot.cjs <unitId> <lessonId> [outPrefix]
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const [UNIT, LID, PRE = 'redo'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  const errs = [];
  for (const mode of (process.env.MODES || 'desktop,mobile').split(',')) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1000, height: 900 } : { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    const key = await page.evaluate(() => SKEY('learn'));
    const L = await page.evaluate(({ id, lid }) => { const p = LEARN_UI.packs.find(x => x.id === id); const li = p.lessons.findIndex(l => l.id === lid); return { li, n: p.lessons[li].steps.length, t: p.lessons[li].steps.map(s => s.type) }; }, { id: UNIT, lid: LID });
    const only = process.env.STEPS ? process.env.STEPS.split(',').map(Number) : null;
    for (let si = 0; si < L.n; si++) {
      if (only && !only.includes(si)) continue;
      await page.evaluate(({ k, id, lid, si }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.cfg.battle = false; D.les[id + '/' + lid] = { i: si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, id: UNIT, lid: LID, si });
      await page.reload();
      await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
      await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
      await page.evaluate((id) => App.go('learn', { pack: id }), UNIT);
      await page.click(`[data-play="${L.li}"]`);
      await page.waitForTimeout(600);
      const el = await page.$('#lpBody');
      const sw = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (sw > 1) errs.push(`${mode} #${si} 橫向捲動 ${sw}px`);
      await el.screenshot({ path: path.join(ROOT, 'output/playwright', `${PRE}-${mode}-${String(si).padStart(2, '0')}-${L.t[si]}.png`) });
    }
    await ctx.close();
  }
  console.log(errs.length ? errs.join('\n') : 'ok');
  await b.close();
})();
