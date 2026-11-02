const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');
const assert = require('assert');
const root = path.resolve(__dirname, '../..');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let checks = 0;
  const check = (v, message) => { assert.ok(v, message); checks++; };
  for (const width of [1100, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof LEARN_UI !== 'undefined');
    const backup = await page.evaluate(() => ({ ...localStorage }));
    const enter = async () => { await page.waitForFunction(() => typeof App !== 'undefined'); await page.evaluate(() => App.go('learn', { pack: 'eyelab-midterm' })); await page.locator('[data-play="0"]').click({ timeout: 5000 }).catch(async e => { console.error((await page.locator('body').innerText()).slice(0, 1800)); throw e; }); };
    const prepare = async () => { await page.evaluate(() => { const d = LEARN_UI.exportData(); d.cfg.battle = false; d.les['eyelab-midterm/manual'] = { i: 1, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(SKEY('learn'), JSON.stringify(d)); }); await page.reload(); await enter(); };
    const practice = async () => { await page.locator('#lpNext').click(); await page.locator('.midterm-setup').waitFor(); };
    const selected = () => page.evaluate(() => LEARN_UI.exportData().les['eyelab-midterm/manual'].run.pk[2].items.map(x => ({ id: x.q, part: Store.partKey(Store.Q[x.q]) })));
    try {
      await prepare();
      const indices = await page.evaluate(() => { const rows = [...document.querySelectorAll('.term-item')]; return rows.map((r, i) => ({ i, n: [...Object.values(Store.Q)].filter(q => q.exam?.startsWith('eyelab-') && Store.partKey(q) === 'p:' + r.querySelector('span').textContent.replace(/☆|★/g, '').trim().normalize('NFKC').toLowerCase().replace(/[\s\-‐–—'’·・.,，、()（）]/g, '')).length })).sort((a,b) => b.n-a.n).slice(0,3).map(x => x.i); });
      for (const i of indices) await page.locator('.term-item').nth(i).locator('input').check();
      const keys = await page.evaluate(() => [...LEARN_UI.exportData().cfg.termPick['eyelab-midterm'].manual]);
      check(keys.length === 3, 'three checked');
      await page.reload(); await enter();
      check(await page.locator('.term-item input:checked').count() === 3, 'persist on reload');
      const saved = await page.evaluate(() => Store.exportAll());
      await page.locator('[data-pick="none"]').click();
      await page.evaluate(s => Store.importAll(s), saved); await page.reload(); await enter();
      check(await page.locator('.term-item input:checked').count() === 3, 'export/import');
      await page.locator('.midterm-mode').selectOption('checked'); await practice();
      const poolText = await page.locator('.midterm-setup').innerText();
      const total = Number((poolText.match(/共 (\d+) 題/) || [])[1]);
      if (total >= 10) await page.locator('[data-count="10"]').click();
      await page.locator('.midterm-start').click();
      const picked = await selected();
      check(picked.length === Math.min(10, total), 'selected count');
      check(picked.every(q => keys.includes(q.part.slice(2))), 'checked structures only');
      await page.locator('#lpPrev').click(); await page.locator('.midterm-mode').selectOption('unchecked'); await practice();
      await page.locator('[data-count="10"]').click(); await page.locator('.midterm-start').click();
      const excluded = await selected(); check(excluded.length === 10 && excluded.every(q => !keys.includes(q.part.slice(2))), 'unchecked excludes chosen');
      await page.locator('#lpPrev').click(); await page.locator('[data-pick="none"]').click();
      check(await page.locator('.term-item input:checked').count() === 0, 'clear');
      await page.locator('.midterm-mode').selectOption('checked'); await practice();
      check((await page.locator('.midterm-setup').innerText()).includes('這個範圍沒有可出的跑台題'), 'empty');
      await page.locator('.midterm-back').click(); await page.locator('[data-pick="all"]').click();
      check(await page.locator('.term-item input:checked').count() === await page.locator('.term-item').count(), 'select all');
      await page.locator('[data-pick="none"]').click(); await page.locator('.term-search').fill('視神經');
      const visible = await page.locator('.term-item:visible').count(); await page.locator('[data-pick="visible"]').click();
      check(visible > 0 && await page.locator('.term-item input:checked').count() === visible, 'select visible');
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow');
      for (const count of [20, 30]) {
        await page.locator('.midterm-mode').selectOption('all'); await practice();
        await page.locator(`[data-count="${count}"]`).click(); await page.locator('.midterm-start').click();
        check((await selected()).length === count, `${count} question limit`);
        await page.locator('#lpPrev').click(); await page.locator('.midterm-mode').selectOption('checked');
      }
      check(errors.length === 0, 'page errors: ' + errors.join(', '));
    } finally {
      await page.evaluate(saved => { localStorage.clear(); Object.entries(saved).forEach(([k,v]) => localStorage.setItem(k,v)); }, backup);
      await ctx.close();
    }
  }
  await browser.close(); console.log(`${checks} checks passed`);
})().catch(e => { console.error(e); process.exitCode = 1; });
