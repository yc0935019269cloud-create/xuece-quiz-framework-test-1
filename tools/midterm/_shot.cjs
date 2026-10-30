const { chromium } = require('playwright'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'); const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  for (const vp of [{ width: 1100, height: 1000 }, { width: 390, height: 900 }]) {
    const ctx = await b.newContext({ viewport: vp }); const page = await ctx.newPage();
    await page.goto(URL); await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} App.go('learn', { pack: 'eyelab-midterm' }); });
    await page.click('[data-play="1"]'); await page.waitForTimeout(400);
    await page.click('#lpNext'); await page.waitForTimeout(500);
    const inp = await page.$('#lpBody input'); await inp.fill('頸內動脈'); await page.waitForTimeout(300);
    const btn = await page.$$('#lpBody button:has-text("位置")'); for (const x of btn) { if (await x.isVisible()) { await x.click(); break; } }
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ROOT, 'output/playwright', `midterm-open-${vp.width}.png`), fullPage: true });
    await ctx.close();
  }
  await b.close(); console.log('ok');
})();
