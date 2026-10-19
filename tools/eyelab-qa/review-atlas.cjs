// Isolated Edge contexts: all teacher-review figures, speech events, stable progress IDs, and course grouping.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..');
const out = { checks: [], problems: [], figures: 0 };
const ok = (name, pass, detail) => { out.checks.push({ name, ok: !!pass }); if (!pass) out.problems.push({ name, detail }); };
const old = file => JSON.parse(execFileSync('git', ['show', 'HEAD:' + file.replaceAll('\\', '/')], { cwd: ROOT, encoding: 'utf8', maxBuffer: 10e6 }));
for (const file of fs.readdirSync(path.join(ROOT, 'content/learn/eye_anat')).filter(f => f.endsWith('.json'))) {
  const rel = 'content/learn/eye_anat/' + file, before = old(rel), after = JSON.parse(fs.readFileSync(path.join(ROOT, rel)));
  ok(file + ' keeps all lesson IDs and step indices', JSON.stringify(before.lessons.map(l => [l.id, l.steps.map(s => s.type)])) === JSON.stringify(after.lessons.map(l => [l.id, l.steps.map(s => s.type)])));
  ok(file + ' keeps check and answer definitions', JSON.stringify(before.lessons.map(l => l.steps.map(s => [s.id, s.kind, s.zh, s.en, s.answer, s.checks?.map(c => [c.id, c.kind, c.zh, c.en, c.answer])]))) === JSON.stringify(after.lessons.map(l => l.steps.map(s => [s.id, s.kind, s.zh, s.en, s.answer, s.checks?.map(c => [c.id, c.kind, c.zh, c.en, c.answer])]))));
}
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const mobile of [false, true]) {
    const name = mobile ? 'mobile' : 'desktop', errors = [];
    const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1100, height: 900 }, hasTouch: mobile, isMobile: mobile });
    const page = await ctx.newPage(); page.on('pageerror', e => errors.push(String(e)));
    await page.addInitScript(() => { window.__spoken = []; speechSynthesis.speak = u => { window.__spoken.push(u.text); u.onend?.(); }; speechSynthesis.cancel = () => {}; });
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ body: '{"ok":false}' }));
    await page.goto(require('url').pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    const backup = await page.evaluate(() => ({ ...localStorage }));
    try {
      const plans = await page.evaluate(() => LEARN_UI.packs.filter(p => (p.path || []).includes('實驗課（依老師講義）')).map(p => {
        const review = p.lessons.find(l => l.id === 'review');
        return { id: p.id, li: p.lessons.indexOf(review), cards: review.steps.flatMap((s, si) => {
          if (s.type !== 'card' || !s.title.startsWith('總圖｜')) return [];
          const l = p.lessons.find(l => l.id !== 'review' && l.title === s.title.slice(3));
          return [{ si, title: s.title, images: [].concat(s.img), source: l.id, figures: l.steps.flatMap((s, sourceSi) => s.type === 'diagram' ? [{ img: s.img, title: s.title, points: s.points, sourceSi }] : []) }];
        }) };
      }));
      ok(name + ' three teacher units', plans.length === 3);
      for (const plan of plans) for (const card of plan.cards) {
        await page.evaluate(({ plan, card }) => {
          const d = LEARN_UI.exportData(); d.cfg.battle = false;
          d.les[plan.id + '/review'] = { i: card.si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } };
          localStorage.setItem(SKEY('learn'), JSON.stringify(d));
        }, { plan, card });
        await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined');
        await page.evaluate(id => App.go('learn', { pack: id }), plan.id); await page.locator(`[data-play="${plan.li}"]`).click();
        const tag = name + ' ' + plan.id + ' ' + card.title;
        ok(tag + ' interactive viewer and original summary preserved', await page.locator('#atlasReviewSelect option').count() === card.figures.length && await page.locator('.atlas-review-static img').count() === card.images.length);
        ok(tag + ' static summaries start collapsed', !await page.locator('.atlas-review-static').evaluate(el => el.open));
        const aiImages = await page.evaluate(() => LEARN_UI.pageCtx().images);
        ok(tag + ' AI receives visible interactive image only', aiImages.length === 1, aiImages.map(im => im.src));
        for (let fi = 0; fi < card.figures.length; fi++) {
          const figure = card.figures[fi];
          await page.selectOption('#atlasReviewSelect', String(fi));
          await page.locator('#dgWrap img').evaluate(im => im.decode());
          out.figures++;
          ok(tag + ' figure ' + fi + ' correct image and all points', (await page.locator('#dgWrap img').getAttribute('src')).endsWith(figure.img) && await page.locator('.dg-list li').count() === figure.points.length);
          await page.locator('.dg-list li').first().click();
          const english = figure.points[0].name.match(/[A-Za-z].*$/)?.[0];
          if (english) {
            await page.locator('.dg-pronounce').click();
            ok(tag + ' figure ' + fi + ' pronunciation dispatch', await page.evaluate(en => window.__spoken.at(-1) === en, english));
          }
          const ref = JSON.parse(await page.locator('#dgInfo .knowledge-star').getAttribute('data-knowledge-star'));
          ok(tag + ' figure ' + fi + ' star maps to original lesson', ref.p === plan.id && ref.l === card.source && ref.img === figure.img);
          if (plan.id === 'eyelab-vp' && figure.title.includes('標本 60')) {
            const baum = figure.points.findIndex(pt => /Baum/.test(pt.name)), meyer = figure.points.findIndex(pt => /Meyer/.test(pt.name));
            const geometry = await page.locator('#dgWrap').evaluate((el, { baum, meyer }) => {
              const pins = el.querySelectorAll('.dg-pin'), a = pins[baum].getBoundingClientRect(), b = pins[meyer].getBoundingClientRect();
              return { gap: Math.hypot(a.x - b.x, a.y - b.y), y: a.y - b.y };
            }, { baum, meyer });
            ok(name + ' Baum is posterior and visibly separated', geometry.gap > (mobile ? 35 : 60) && geometry.y > 0, geometry);
            await page.locator('.dg-list li').nth(baum).click();
            await page.screenshot({ path: path.join(ROOT, `output/playwright/review-atlas-baum-${name}.png`), fullPage: true });
          }
          ok(tag + ' figure ' + fi + ' no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        }
        if (plan.id === 'eyelab-orbit' && card === plan.cards[0]) await page.screenshot({ path: path.join(ROOT, `output/playwright/review-atlas-orbit-${name}.png`), fullPage: true });
        await page.locator('.atlas-review-static > summary').click();
        ok(tag + ' original annotated figures expand', await page.locator('.atlas-review-static').evaluate(el => el.open));
        ok(tag + ' next page remains available', !await page.locator('#lpNext').isDisabled());
      }
      await page.evaluate(() => App.go('learn', { tab: 'courses' }));
      await page.locator('[data-sf="eye_anat"]').click();
      const roots = await page.locator('#learnBody > details.ltree > summary .ltree-n').allTextContents();
      ok(name + ' only three top-level categories in requested order', JSON.stringify(roots) === JSON.stringify(['實驗課（依老師講義）', '實驗手冊名詞（考試範圍）', '其他']), roots);
      await page.evaluate(() => {
        const p = LEARN_UI.packs.find(p => p.id === 'manual-eye'); window.__oldLabPath = p.path; p.path = ['眼解剖實驗', '舊匯入分類']; App.go('learn', { tab: 'courses' });
      });
      ok(name + ' legacy imported paths also stay under Other', !await page.locator('#learnBody > details.ltree > summary').allTextContents().then(xs => xs.some(s => s.includes('舊匯入分類'))));
      await page.evaluate(() => { LEARN_UI.packs.find(p => p.id === 'manual-eye').path = window.__oldLabPath; App.go('learn', { tab: 'courses' }); });
      await page.screenshot({ path: path.join(ROOT, `output/playwright/review-atlas-categories-${name}.png`) });
      ok(name + ' no page errors', errors.length === 0, errors);
    } finally {
      await page.evaluate(backup => { localStorage.clear(); Object.entries(backup).forEach(([k, v]) => localStorage.setItem(k, v)); }, backup);
      ok(name + ' storage restored', JSON.stringify(backup) === await page.evaluate(() => JSON.stringify({ ...localStorage })));
      await ctx.close();
    }
  }
  await browser.close(); fs.writeFileSync(path.join(ROOT, 'output/playwright/review-atlas-qa.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ checks: out.checks.length, figures: out.figures, problems: out.problems }, null, 2)); process.exitCode = out.problems.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(2); });
