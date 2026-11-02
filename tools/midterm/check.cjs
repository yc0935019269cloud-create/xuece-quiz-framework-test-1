const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../..');
const pack = JSON.parse(fs.readFileSync(path.join(root, 'content/learn/eye_anat/midterm-review.json'), 'utf8'));
const failures = [], checks = [];
function ok(label, pass, detail) { checks.push({ label, pass: !!pass }); if (!pass) failures.push({ label, detail }); }
const expectedGroups = [
  ['骨質眼窩','眼瞼與淚器','眼外肌與眼眶','眼球與眼底','動脈','腦神經與神經節','視覺路徑','腦與腦幹'],
  ['骨質眼窩','眼球與眼底','視覺路徑','腦與腦幹','腦膜與其他'],
  ['骨質眼窩','眼瞼與淚器','眼外肌與眼眶','眼球與眼底','動脈','腦神經與神經節','視覺路徑','腦與腦幹'],
  ['模擬考範圍']
];
ok('lesson ids', JSON.stringify(pack.lessons.map(l => l.id)) === JSON.stringify(['manual','lab','lecture','mock-exam','slices','brainstem']));
const brainstem = pack.lessons.find(l => l.id === 'brainstem');
ok('brainstem structure and pins', !!brainstem && brainstem.steps[0].groups.flatMap(g => g.items).length === 10 && brainstem.steps[1].points.length === 11);
const mockNine = pack.lessons[3].steps[1].groups[0].items[8];
ok('mock item 9 short posterior ciliary arteries', mockNine.zh.includes('後短睫狀動脈') && mockNine.en === 'Short posterior ciliary arteries（SPCA）' && mockNine.views.length > 0);
ok('groups', pack.lessons.slice(0, 4).every((l, i) => JSON.stringify(l.steps[1].groups.map(g => g.name)) === JSON.stringify(expectedGroups[i])));
ok('row counts', JSON.stringify(pack.lessons.slice(0, 4).map(l => l.steps[1].groups.reduce((n, g) => n + g.items.length, 0))) === JSON.stringify([138,56,82,19]));
ok('no exam stars', !JSON.stringify(pack).includes('⭐') && !JSON.stringify(pack).includes('老師說會考') && pack.lessons.slice(0, 4).every(l => l.steps[1].groups.every(g => g.items.every(x => !x.star))));
ok('mock numbering and missing image', pack.lessons[3].steps[1].groups[0].items.every((x, i) => x.zh.startsWith(`${i + 1}. `)) && !pack.lessons[3].steps[1].groups[0].items[7].views.length);
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
      for (const [li, lesson] of pack.lessons.slice(0, 4).entries()) {
        await page.evaluate(({ id }) => { const d = LEARN_UI.exportData(); d.cfg.battle = false; d.les['eyelab-midterm/' + id] = { i: 1, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(SKEY('learn'), JSON.stringify(d)); }, lesson);
        await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined');
        await page.evaluate(() => App.go('learn', { pack: 'eyelab-midterm' }));
        await page.locator(`[data-play="${li}"]`).click();
        const prefix = `${width} ${lesson.id}`;
        const expected = lesson.steps[1].groups.flatMap(g => g.items);
        ok(prefix + ' all rows', await page.locator('.term-item').count() === expected.length);
        ok(prefix + ' group titles', JSON.stringify(await page.locator('.term-group h4').allTextContents()) === JSON.stringify(expectedGroups[li]));
        ok(prefix + ' no exam marks', !(await page.locator('#lpBody').innerText()).includes('⭐') && !(await page.locator('#lpBody').innerText()).includes('老師說會考'));
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
        if (expected.some(x => x.zh.includes('外側膝狀體'))) {
          const lgn = page.locator('.term-item').filter({ hasText: '外側膝狀體' }).first();
          ok(prefix + ' LGN displayed', (await lgn.innerText()).includes('（LGN）'));
          await page.locator('.term-search').fill('LGN');
          ok(prefix + ' LGN search', await lgn.isVisible());
        }
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

      const sliceLesson = pack.lessons.find(l => l.id === 'slices');
      const sliceData = JSON.parse(fs.readFileSync(path.join(root, 'tools/midterm/slice_points.json'), 'utf8'));
      for (let si = 0; si < 5; si++) {
        await page.evaluate(i => { const d = LEARN_UI.exportData(); d.cfg.battle = false; d.les['eyelab-midterm/slices'] = { i, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(SKEY('learn'), JSON.stringify(d)); }, si);
        await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined');
        await page.evaluate(() => App.go('learn', { pack: 'eyelab-midterm' }));
        await page.locator('[data-play="4"]').click();
        if (!si) {
          const rows = sliceLesson.steps[0].groups.flatMap(g => g.items);
          ok(width + ' slice rows', await page.locator('.term-item').count() === rows.length && rows.every(r => r.views.length));
          await page.locator('.term-search').fill(rows[0].zh);
          ok(width + ' slice search', await page.locator('.term-item:visible').count() >= 1);
          await page.locator('.term-search').fill('');
          await page.locator('.term-open').click();
          const loaded = await page.locator('.term-views img').evaluateAll(ims => Promise.all(ims.map(im => im.decode().then(() => im.naturalWidth > 0).catch(() => false))));
          ok(width + ' slice views load', loaded.length === rows.reduce((n, r) => n + r.views.length, 0) && loaded.every(Boolean));
          ok(width + ' slice row stars', await page.locator('.term-item .knowledge-star').count() === rows.length);
        } else {
          const fig = sliceData[si - 1];
          ok(width + ' ' + fig.slice + ' pins', await page.locator('.dg-pin').count() === fig.points.length);
          ok(width + ' ' + fig.slice + ' image loads', await page.locator('.dg-wrap img').evaluate(im => im.decode().then(() => im.naturalWidth > 0).catch(() => false)));
          await page.locator('.dg-pin').first().click({ force: true });
          ok(width + ' ' + fig.slice + ' pin name', (await page.locator('#dgInfo').innerText()).includes(fig.points[0].zh));
          const star = page.locator('#dgInfo .knowledge-star'); const before = await star.getAttribute('aria-pressed'); await star.click();
          ok(width + ' ' + fig.slice + ' pin star', await star.getAttribute('aria-pressed') !== before);
          if (fig.points.some(p => p.approx)) {
            const idx = fig.points.findIndex(p => p.approx); await page.locator('.dg-list li').nth(idx).click();
            ok(width + ' ' + fig.slice + ' approximate note', (await page.locator('#dgInfo').innerText()).includes('大致位置'));
          }
        }
        ok(width + ' slice page ' + si + ' no overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
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
