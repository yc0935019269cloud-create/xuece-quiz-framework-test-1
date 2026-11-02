const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');
const assert = require('assert');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(pathToFileURL(path.resolve(__dirname, '../../index.html')).href);
  await page.waitForFunction(() => typeof LEARN_UI !== 'undefined');
  const backup = await page.evaluate(() => ({ ...localStorage }));
  try {
    await page.evaluate(() => {
      const d = LEARN_UI.exportData(); d.cfg.battle = true;
      d.les['eyelab-midterm/manual'] = { i: 1, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } };
      localStorage.setItem(SKEY('learn'), JSON.stringify(d));
    });
    await page.reload();
    await page.evaluate(() => App.go('learn', { pack: 'eyelab-midterm' }));
    await page.locator('[data-play="0"]').click();
    await page.locator('#lpNext').click();
    await page.locator('[data-count="10"]').click();
    await page.locator('.midterm-start').click();
    const ids = await page.evaluate(() => LEARN_UI.exportData().les['eyelab-midterm/manual'].run.pk[2].items.map(x => x.q));
    const before = await page.evaluate(ids => ids.map(id => JSON.stringify(Store.qs[id] || null)), ids);
    assert.equal(ids.length, 10);
    await page.locator('[data-give-up]').click();
    assert(await page.locator('.explain').innerText());
    assert((await page.locator('.explain').innerText()).includes('正確答案'));
    assert(await page.evaluate(id => Store.inWrongbook(id) && Store.status(id) === 'wrong', ids[0]));
    assert.equal(await page.locator('[data-give-up]').count(), 0);
    assert.equal(await page.locator('[data-end-practice]').count(), 1);
    await page.locator('#lpNext').click();
    await page.locator('[data-give-up]').click();
    const run = await page.evaluate(() => LEARN_UI.exportData().les['eyelab-midterm/manual'].run);
    assert.equal(run.n, 2); assert.equal(run.ok, 0); assert.equal(run.bt.segWrong, 2);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('[data-end-practice]').click();
    assert((await page.locator('.modal-bg').innerText()).includes('已答的會保留'));
    await page.locator('.modal-bg button').filter({ hasText: '確定' }).click();
    assert.equal(await page.evaluate(() => LEARN_UI.exportData().les['eyelab-midterm/manual'].i), 3);
    const after = await page.evaluate(ids => ids.map(id => JSON.stringify(Store.qs[id] || null)), ids);
    assert.notEqual(after[0], before[0]); assert.notEqual(after[1], before[1]);
    assert.deepEqual(after.slice(2), before.slice(2));
    await page.locator('#lpPrev').click();
    assert(await page.locator('.midterm-setup').isVisible());
    assert.deepEqual(errors, []);
    console.log('giveup-check passed: reveal, wrong book, battle, early exit, records, setup, 390px, page errors');
  } finally {
    await page.evaluate(saved => { localStorage.clear(); Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v)); }, backup);
    await ctx.close(); await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
