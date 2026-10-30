const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../..');
const pack = JSON.parse(fs.readFileSync(path.join(root, 'content/learn/eye_anat/midterm-review.json'), 'utf8'));
const failures = [], checks = [];
function ok(label, pass, detail) { checks.push({ label, pass: !!pass }); if (!pass) failures.push({ label, detail }); }
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [1100, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && typeof LEARN_UI !== 'undefined');
    const backup = await page.evaluate(() => ({ ...localStorage }));
    try {
      for (const [li, lesson] of pack.lessons.entries()) {
        await page.evaluate(({ id }) => { const d = LEARN_UI.exportData(); d.cfg.battle = false; d.les['eyelab-midterm/' + id] = { i: 1, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(SKEY('learn'), JSON.stringify(d)); }, lesson);
        await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined');
        await page.evaluate(() => App.go('learn', { pack: 'eyelab-midterm' }));
        await page.locator(`[data-play="${li}"]`).click();
        const prefix = `${width} ${lesson.id}`;
        const expected = lesson.steps[1].groups.flatMap(g => g.items);
        ok(prefix + ' all rows', await page.locator('.term-item').count() === expected.length);
        ok(prefix + ' initially no images', await page.locator('.term-views img').count() === 0);
        ok(prefix + ' all closed', await page.locator('.term-toggle[aria-expanded="true"]').count() === 0);
        const row = page.locator('.term-item').first();
        await row.locator('.term-toggle').click();
        ok(prefix + ' expand', await row.locator('.term-views').isVisible());
        ok(prefix + ' image count', await row.locator('img').count() === expected[0].views.length);
        await row.locator('.term-toggle').click();
        ok(prefix + ' close', await row.locator('.term-views').isHidden());
        await page.evaluate(() => { window.__spoken = []; GLOSS.speak = x => window.__spoken.push(x); });
        await row.locator('.term-speak').click();
        ok(prefix + ' speech', await page.evaluate(en => window.__spoken[0] === en, expected[0].en));
        await page.locator('.term-search').fill(expected[0].en);
        ok(prefix + ' search', await page.locator('.term-item:visible').count() >= 1 && await page.locator('.term-item:visible').count() < expected.length);
        await page.locator('.term-search').fill(expected[0].zh);
        ok(prefix + ' Chinese search', await page.locator('.term-item:visible').count() >= 1 && await page.locator('.term-item:visible').count() < expected.length);
        await page.locator('.term-search').fill('');
        await page.locator('.term-open').click();
        const expectedViews = expected.reduce((n, x) => n + x.views.length, 0);
        ok(prefix + ' expand all', await page.locator('.term-toggle[aria-expanded="true"]').count() === expected.length);
        ok(prefix + ' all images and markers', await page.locator('.term-views img').count() === expectedViews && await page.locator('.term-pin').count() === expectedViews);
        const imageResults = await page.locator('.term-views img').evaluateAll(ims => Promise.all(ims.map(im => im.decode().then(() => im.naturalWidth > 0).catch(() => false))));
        ok(prefix + ' images decode', imageResults.every(Boolean), imageResults.filter(x => !x).length);
        const positions = await page.locator('.term-pin').evaluateAll(pins => pins.every(p => { const r = p.getBoundingClientRect(), parent = p.parentElement.getBoundingClientRect(); const x = parseFloat(p.style.left), y = parseFloat(p.style.top); return r.width > 0 && r.height > 0 && getComputedStyle(p).borderTopColor === 'rgb(255, 0, 0)' && Math.abs((r.left + r.width / 2 - parent.left) / parent.width * 100 - x) < 2 && Math.abs((r.top + r.height / 2 - parent.top) / parent.height * 100 - y) < 2; }));
        ok(prefix + ' visible red circles', positions);
        ok(prefix + ' no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.locator('.term-close').click();
        ok(prefix + ' close all', await page.locator('.term-toggle[aria-expanded="true"]').count() === 0);
        await page.screenshot({ path: path.join(root, `output/playwright/midterm-${lesson.id}-${width}.png`) });
        ok(prefix + ' AI context', await page.evaluate(() => LEARN_UI.pageCtx().text.includes('構造清單')));
        await page.locator('#lpBody .knowledge-star').first().click();
        await page.evaluate(() => App.go('learn', { tab: 'notes' }));
        const savedPage = page.locator('.knowledge-page').filter({ hasText: lesson.title });
        ok(prefix + ' saved page rendered', await savedPage.locator('.term-item').count() === expected.length);
        await page.evaluate(() => App.go('learn', { pack: 'eyelab-midterm' }));
        await page.locator(`[data-play="${li}"]`).click();
        await page.locator('#lpNext').click();
        const qid = lesson.steps[2].qids[0];
        const answer = await page.evaluate(id => Store.Q[id].accept[0].split('/').map(s => s.trim()), qid);
        await page.locator('.fill-in[data-part="zh"]').fill(answer[0]);
        await page.locator('.fill-in[data-part="en"]').fill(answer[1]);
        await page.locator('.fill-in[data-part="en"]').press('Enter');
        await page.waitForTimeout(300);
        ok(prefix + ' practice submits', await page.locator('.fill-in[data-part="zh"]').isDisabled());
      }
      ok(width + ' no page errors', errors.length === 0, errors);
    } finally {
      await page.evaluate(saved => { localStorage.clear(); Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v)); }, backup);
      ok(width + ' storage restored', await page.evaluate(saved => JSON.stringify({ ...localStorage }) === JSON.stringify(saved), backup));
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(root, 'output/playwright/midterm-qa.json'), JSON.stringify({ checks, failures }, null, 2));
  console.log(`${checks.length} checks; ${failures.length} failures`);
  if (failures.length) { console.log(JSON.stringify(failures, null, 2)); process.exitCode = 1; }
})().catch(e => { console.error(e); process.exitCode = 1; });
