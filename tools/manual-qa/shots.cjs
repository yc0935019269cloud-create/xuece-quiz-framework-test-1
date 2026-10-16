// 截圖：手冊圖鑑幾個代表性圖解步驟（桌機與 390px），存到 output/playwright/manual-*.png
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const PICK = [['manual-brain-nerve', 'diagram', 0, 'midbrain'], ['manual-visual-path', 'diagram', 'brain-lat', 'lateral'], ['manual-orbit-bones', 'diagram', 'mcf', 'foramina'], ['manual-vessel', 'diagram', 'lid', 'lid-vessels']];
(async () => {
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, executablePath: process.env.PW_EXE || undefined });
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1100, height: 900 } : { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
    const key = await page.evaluate(() => SKEY('learn'));
    for (const [id, , sel, name] of PICK) {
      const loc = await page.evaluate(({ id, sel }) => {
        const p = LEARN_UI.packs.find(x => x.id === id); const out = [];
        p.lessons.forEach((l, li) => l.steps.forEach((s, si) => { if (s.type === 'diagram') out.push({ li, lid: l.id, si, img: s.img, title: s.title }); }));
        const pat = { 0: null, 'brain-lat': 'beal_lat', mcf: 'mcf_B_m', lid: 'gray515' }[sel];
        return pat ? out.find(x => x.img.includes(pat)) : out.find(x => x.img.includes('sobo651'));
      }, { id, sel });
      if (!loc) { console.log('找不到', id, sel); continue; }
      await page.evaluate(({ k, id, loc }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + loc.lid] = { i: loc.si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, id, loc });
      await page.reload();
      await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
      await page.evaluate((id) => App.go('learn', { pack: id }), id);
      await page.click(`[data-play="${loc.li}"]`);
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(ROOT, 'output', 'playwright', `manual-${name}-${mode}.png`) });
      console.log('ok', mode, name);
    }
    await ctx.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(2); });
