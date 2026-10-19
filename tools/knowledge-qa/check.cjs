// Isolated Edge contexts; backs up/restores localStorage. Run with the repo's Playwright NODE_PATH.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const out = { checks: [], problems: [] };
const ok = (name, condition, detail) => { out.checks.push({ name, ok: !!condition }); if (!condition) out.problems.push({ name, detail }); };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const mobile of [false, true]) {
    const label = mobile ? 'mobile' : 'desktop';
    const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1100, height: 900 }, hasTouch: mobile, isMobile: mobile });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined');
    const backup = await page.evaluate(() => ({ ...localStorage }));
    try {
      const plan = await page.evaluate(() => {
        const p = LEARN_UI.packs.find(p => p.id === 'eyelab-vp');
        const diagram = p.lessons.flatMap((l, li) => l.steps.map((s, si) => ({ p: p.id, l: l.id, li, si, s })).filter(x => x.s.type === 'diagram'))[0];
        const checks = p.lessons.flatMap((l, li) => l.steps.map((s, si) => ({ p: p.id, l: l.id, li, si, s })).filter(x => x.s.type === 'practice' && x.s.checks?.some(c => c.kind === 'name')))[0];
        const other = LEARN_UI.packs.filter(x => x.id !== p.id && x.style === 'atlas').flatMap(p => p.lessons.flatMap((l, li) => l.steps.map((s, si) => ({ p: p.id, l: l.id, li, si, s })).filter(x => x.s.type === 'diagram')))[0];
        const bank = LEARN_UI.packs.filter(p => p.subject === 'eye_ans').flatMap(p => p.lessons.flatMap((l, li) => l.steps.map((s, si) => ({ p: p.id, l: l.id, li, si, s })).filter(x => x.s.type === 'practice' && (x.s.qids?.length || x.s.pick?.ids?.length))))[0];
        bank.qid = (bank.s.qids?.length ? bank.s.qids : bank.s.pick.ids)[0];
        const second = p.lessons.flatMap((l, li) => l.steps.map((s, si) => ({ p: p.id, l: l.id, li, si, s })).filter(x => x.s.type === 'diagram'))[1];
        return { diagram, second, checks, other, bank };
      });
      const openStep = async spec => {
        await page.evaluate(spec => {
          const d = LEARN_UI.exportData();
          d.cfg.battle = false;
          d.les[spec.p + '/' + spec.l] = { i: spec.si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: spec.qid ? { [spec.si]: { items: [{ q: spec.qid }] } } : {}, t0: Date.now() } };
          localStorage.setItem(SKEY('learn'), JSON.stringify(d));
        }, spec);
        await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined');
        await page.evaluate(id => App.go('learn', { pack: id }), spec.p);
        await page.locator(`[data-play="${spec.li}"]`).click();
      };
      const notes = async () => page.evaluate(() => App.go('learn', { tab: 'notes' }));
      const saved = () => page.evaluate(() => Object.values(LEARN_UI.exportData().starred || {}));
      await notes();
      ok(label + ' empty collection visible', await page.locator('.knowledge-collection').count() === 1);
      await openStep(plan.diagram);
      ok(label + ' names list stays uncluttered', await page.locator('.dg-list .knowledge-star').count() === 0 && await page.locator('#dgInfo .knowledge-star').count() === 0);
      await page.locator('.dg-list li').first().click();
      ok(label + ' opening term reveals one small star', await page.locator('#dgInfo .knowledge-star-icon').count() === 1);
      const stateBefore = await page.evaluate(() => JSON.stringify([LEARN_UI.exportData().stat, Store.qs, Store.wrong, Store.profile.gems, LEARN_UI.exportData().rev]));
      await page.locator('#dgInfo .knowledge-star').click();
      ok(label + ' term saved', (await saved()).length === 1);
      ok(label + ' term click updates state', await page.locator('#dgInfo .knowledge-star').getAttribute('aria-pressed') === 'true');
      await page.locator('#dgInfo .knowledge-star').focus();
      await page.keyboard.press('Enter');
      ok(label + ' keyboard toggle stays on page', await page.locator('#dgWrap').count() === 1 && (await saved()).length === 0);
      await page.keyboard.press('Enter');
      ok(label + ' star does not change grades rewards or review', stateBefore === await page.evaluate(() => JSON.stringify([LEARN_UI.exportData().stat, Store.qs, Store.wrong, Store.profile.gems, LEARN_UI.exportData().rev])));
      await page.locator('#dgInfo .gl').first().click();
      ok(label + ' glossary popup also has small star', await page.locator('.gl-pop .knowledge-star-icon').count() === 1);
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(ROOT, 'output/playwright/knowledge-term-star-' + label + '.png') });
      await page.locator('.gl-pop .knowledge-star-icon').click();
      ok(label + ' popup toggle updates term star', await page.locator('#dgInfo .knowledge-star').getAttribute('aria-pressed') === 'false');
      await page.locator('.gl-pop .knowledge-star-icon').click();
      await page.evaluate(() => GLOSS.close());
      await page.locator('#dgHide').click();
      ok(label + ' hidden names keep stars', await page.locator('.dg-name.hid').count() > 0 && (await saved()).length === 1);
      await openStep(plan.second);
      await page.locator('.dg-list li').first().click();
      await page.locator('#dgInfo .gl').first().click();
      ok(label + ' same term uses currently opened figure', JSON.parse(await page.locator('.gl-pop .knowledge-star-icon').getAttribute('data-knowledge-star')).img === plan.second.s.img);
      await page.evaluate(() => GLOSS.close());
      await openStep(plan.other);
      await page.locator('.dg-list li').first().click();
      await page.locator('#dgInfo .knowledge-star').click();
      await notes();
      ok(label + ' stars visible before lesson completion', await page.locator('.knowledge-card').count() === 2);
      await page.selectOption('#knowledgeUnit', plan.diagram.p);
      ok(label + ' unit filter', await page.locator('.knowledge-card').count() === 1);
      const img = await page.locator('.knowledge-image img').getAttribute('src');
      ok(label + ' matching original image', img.endsWith(plan.diagram.s.img));
      ok(label + ' original point position', await page.locator('.knowledge-pin').evaluate((el, pt) => el.style.left === pt.x + '%' && el.style.top === pt.y + '%', plan.diagram.s.points[0]));
      await page.selectOption('#knowledgeUnit', '');
      await page.fill('#nSearch', plan.diagram.s.points[0].name);
      await page.waitForTimeout(400);
      ok(label + ' search starred name', await page.locator('.knowledge-card').count() >= 1);
      await page.fill('#nSearch', ''); await page.waitForTimeout(400);
      await openStep(plan.checks);
      ok(label + ' answer not starred before reveal', await page.locator('.knowledge-answer-action').count() === 0);
      await page.locator('.lc-giveup').click();
      await page.locator('.knowledge-answer-action .knowledge-star').click();
      const checkRef = (await saved()).find(x => x.kind === 'check');
      ok(label + ' revealed answer saved', !!checkRef);
      await notes();
      await page.selectOption('#knowledgeType', 'answer');
      ok(label + ' answer filter and complete bilingual answer', await page.locator('.knowledge-card').count() === 1 && await page.locator('.knowledge-answer').innerText().then(t => /[A-Za-z]/.test(t) && /正確答案/.test(t)));
      ok(label + ' answer keeps question image', await page.locator('.knowledge-card img').count() > 0);
      await openStep(plan.bank);
      const q = await page.evaluate(id => Store.Q[id], plan.bank.qid);
      if (q.type === 'single' || q.type === 'multi') {
        await page.locator('.opt').first().click();
        if (await page.locator('.confirm').count()) await page.locator('.confirm').click();
      } else if (await page.locator('.fill-in').count()) {
        await page.locator('.fill-in').fill(q.ans);
        await page.locator('.answers button').click();
      } else {
        await page.locator('.answers button').click();
      }
      await page.locator('.knowledge-answer-action .knowledge-star').click();
      ok(label + ' bank practice saved', (await saved()).some(x => x.kind === 'question'));
      await notes();
      await page.selectOption('#knowledgeUnit', ''); await page.selectOption('#knowledgeType', 'all');
      ok(label + ' mixed collection', await page.locator('.knowledge-card').count() === 4);
      await page.locator('.knowledge-card img').evaluateAll(ims => ims.forEach(im => im.loading = 'eager'));
      await page.waitForFunction(() => [...document.querySelectorAll('.knowledge-card img')].every(im => im.complete && im.naturalWidth));
      ok(label + ' no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: path.join(ROOT, 'output/playwright/knowledge-stars-' + label + '.png'), fullPage: true });
      await page.locator('[data-nf="eye_anat"]').click();
      ok(label + ' subject filter lab', await page.locator('.knowledge-card').count() === 3);
      await page.locator('[data-nf="eye_ans"]').click();
      ok(label + ' subject filter theory', await page.locator('.knowledge-card').count() === 1);
      await page.locator('[data-nf="all"]').click();
      const exportData = await page.evaluate(() => JSON.parse(Store.exportAll()));
      ok(label + ' backup includes stars', Object.keys(exportData.learn.starred).length === 4);
      await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined'); await notes();
      ok(label + ' reload persists collection', await page.locator('.knowledge-card').count() === 4);
      await page.locator('.knowledge-collection .knowledge-star').first().click();
      ok(label + ' remove one star updates collection', await page.locator('.knowledge-card').count() === 3);
      // New backup round trip uses the real import function; reload is required by the app's import contract.
      await page.evaluate(data => Store.importAll(JSON.stringify(data)), exportData);
      await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined'); await notes();
      ok(label + ' backup import restores stars', await page.locator('.knowledge-card').count() === 4);
      await page.evaluate(spec => { const d = LEARN_UI.exportData(); d.pins = d.pins || {}; d.pins[`${spec.p}/${spec.l}/${spec.si}`] = { 0: [44, 55] }; App.go('learn', { tab: 'notes' }); }, plan.diagram);
      await page.selectOption('#knowledgeUnit', plan.diagram.p); await page.selectOption('#knowledgeType', 'term');
      ok(label + ' collection respects adjusted pins', await page.locator('.knowledge-pin').evaluate(el => el.style.left === '44%' && el.style.top === '55%'));
      await page.selectOption('#knowledgeUnit', ''); await page.selectOption('#knowledgeType', 'all');
      // Orphan references are retained but ignored until the matching imported content is available.
      await page.evaluate(() => { const d = LEARN_UI.exportData(); d.starred.orphan = { kind: 'term', p: 'missing', l: 'missing', img: 'missing', name: 'missing' }; App.go('learn', { tab: 'notes' }); });
      ok(label + ' unavailable imported source is safe', await page.locator('.knowledge-card').count() === 4);
      await page.evaluate(() => {
        const d = LEARN_UI.exportData();
        for (const p of LEARN_UI.packs.filter(p => p.subject === 'eye_anat')) for (const l of p.lessons) for (const s of l.steps.filter(s => s.type === 'diagram')) for (const pt of s.points) {
          if (Object.keys(d.starred).length >= 25) break;
          const r = { kind: 'term', p: p.id, l: l.id, img: s.img, name: pt.name, at: Date.now() };
          d.starred[JSON.stringify([r.kind, r.p, r.l, r.img, r.name])] = r;
        }
        App.go('learn', { tab: 'notes' });
      });
      const count = (await saved()).length - 1;
      ok(label + ' large collection paginated', await page.locator('.knowledge-card').count() === 20);
      await page.locator('#knowledgeNext').click();
      ok(label + ' second page complete', await page.locator('.knowledge-card').count() === count - 20);
      await page.locator('#knowledgePrev').click();
      ok(label + ' previous page', await page.locator('.knowledge-card').count() === 20);
      ok(label + ' no page errors', errors.length === 0, errors);
    } finally {
      await page.evaluate(backup => { localStorage.clear(); Object.entries(backup).forEach(([k, v]) => localStorage.setItem(k, v)); }, backup);
      ok(label + ' storage restored', JSON.stringify(backup) === await page.evaluate(() => JSON.stringify({ ...localStorage })));
      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(ROOT, 'output/playwright/knowledge-stars-qa.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ checks: out.checks.length, problems: out.problems }, null, 2));
  process.exitCode = out.problems.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(2); });
