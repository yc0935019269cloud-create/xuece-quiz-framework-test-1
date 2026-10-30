// Offline file:// QA. Isolated Edge context; the Unity iframe is replaced before attachment.
// PowerShell: $env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/peglin-web-qa/learn-nav.cjs
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../..'), report = { at: new Date().toISOString(), game: 'Offline iframe fixture; real Unity game not loaded', checks: [], issues: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: !!pass, ...(details ? { details } : {}) }); if (!pass) report.issues.push(name); console.log((pass ? 'PASS ' : 'FAIL ') + name); };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage(), pageErrors = [];
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => pageErrors.push(e.message));
  await ctx.route(/^https?:/, r => r.abort());
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction(() => typeof PEGLIN !== 'undefined' && typeof LEARN_UI !== 'undefined');
  const backup = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  try {
    await page.evaluate(() => {
      U.clearModals();
      Object.defineProperty(CLOUD, 'signedIn', { configurable: true, get: () => true });
      // Do not load the remote game or contact real cloud storage in this isolated UI test.
      const h = U.h;
      U.h = html => {
        const el = h(html), frame = el.querySelector?.('#pgwFrame');
        if (frame) { frame.removeAttribute('src'); frame.srcdoc = '<!doctype html><title>offline fixture</title>'; }
        return el;
      };
      CLOUD.peglinGet = async () => null; CLOUD.peglinPut = async () => ({});
      const p = LEARN_UI.packs.find(p => p.lessons.length > 1 && p.lessons[0].steps.slice(0, 2).every(s => !['check', 'practice'].includes(s.type)));
      window.navFixture = { p: p.id, l: p.lessons[0].id };
      const sel = [p.id + '/' + p.lessons[0].id], cfg = { subject: p.subject, sel, per: 1, shots: 1, onWrong: 'count', test: false };
      localStorage.setItem(SKEY('peglin-learn'), JSON.stringify(cfg));
      PEGLIN.screen('learn');
      window.prepBefore = document.querySelector('.pg-picker').innerHTML;
      window.cfgBefore = localStorage.getItem(SKEY('peglin-learn'));
      PEGLIN.web.open(PEGLIN.web.learnSession(cfg, PEGLIN.web.selectedLessons(cfg)));
    });
    check('prep page course count preserved', await page.evaluate(() => /已選 1 課/.test(document.querySelector('#pgPool').textContent)));
    check('first-page previous hidden and future pips disabled', await page.evaluate(() => !document.querySelector('[data-prev]') && [...document.querySelectorAll('.pgw-pip')].slice(1).every(b => b.disabled)));
    await page.click('#pgwHead [data-knowledge-star]');
    const star = await page.evaluate(() => ({ data: JSON.parse(localStorage.getItem(SKEY('learn')) || '{}').starred, ref: navFixture }));
    check('page star saved to learning storage', Object.values(star.data || {}).some(x => x.kind === 'page' && x.p === star.ref.p && x.l === star.ref.l && x.i === 0), star);
    await page.click('#pgwQ .pgw-go button');
    check('read marks original item done', await page.evaluate(() => PEGLIN.web.state.S.items[0].done === true));
    const before = await page.evaluate(() => ({ credits: PEGLIN.web.state.credits, reads: PEGLIN.web.state.reads, learn: localStorage.getItem(SKEY('learn')), qs: JSON.stringify(Store.qs) }));
    await page.click('[data-prev]');
    check('previous page and review label', await page.evaluate(() => PEGLIN.web.state.item.back && document.querySelector('#pgwHead').textContent.includes('回顧中・作答不計分')));
    await page.click('#pgwQ .pgw-go button');
    const after = await page.evaluate(() => ({ credits: PEGLIN.web.state.credits, reads: PEGLIN.web.state.reads, learn: localStorage.getItem(SKEY('learn')), qs: JSON.stringify(Store.qs), back: !!PEGLIN.web.state.item.back }));
    const { back, ...unchanged } = after;
    check('revisit does not reward or record, returns to undone frontier', JSON.stringify(before) === JSON.stringify(unchanged) && !back, {before, after});
    await page.click('.pgw-pip[data-page="0"]');
    check('visited pip jumps back', await page.evaluate(() => PEGLIN.web.state.item.back && PEGLIN.web.state.S.cur() === 0));
    await page.click('#pgwQ .pgw-go button');
    for (let n = 0; n < 20 && await page.evaluate(() => PEGLIN.web.state.item.kind === 'read'); n++) await page.click('#pgwQ .pgw-go button');
    const firstCheck = await page.evaluate(() => { const it = PEGLIN.web.state.item; return it.kind === 'check' && ['single', 'tf'].includes(it.c.kind) ? { index: PEGLIN.web.state.S.cur(), answer: it.c.kind === 'tf' ? (it.c.answer ? 0 : 1) : it.c.answer } : null; });
    if (firstCheck) {
      await page.click(`#pgwQ .lc-opt[data-i="${firstCheck.answer}"]`);
      check('grading marks original check done', await page.evaluate(k => PEGLIN.web.state.S.items[k].done === true, firstCheck.index));
      await page.click('#pgwQ .pgw-go button');
      const gradedBefore = await page.evaluate(() => ({ credits: PEGLIN.web.state.credits, graded: PEGLIN.web.state.graded, learn: localStorage.getItem(SKEY('learn')), qs: JSON.stringify(Store.qs) }));
      await page.click(`.pgw-pip[data-page="${firstCheck.index}"]`);
      await page.click(`#pgwQ .lc-opt[data-i="${firstCheck.answer}"]`);
      const gradedAfter = await page.evaluate(() => ({ credits: PEGLIN.web.state.credits, graded: PEGLIN.web.state.graded, learn: localStorage.getItem(SKEY('learn')), qs: JSON.stringify(Store.qs) }));
      check('revisited check does not grade, reward, or record', JSON.stringify(gradedBefore) === JSON.stringify(gradedAfter));
    } else check('revisited check does not grade, reward, or record', false, { firstCheck });
    await page.click('#pgwSwitch');
    const picker = page.locator('.pgw-picker');
    check('picker preselects current lesson', await picker.locator('.pg-lesson.on').count() > 0);
    await picker.locator('[data-picker="plClear"]').click();
    await picker.locator('[data-subj]:not(.on)').first().click();
    await page.click('[data-cancel]');
    check('cancel preserves session, saved selection, and prep tree', await page.evaluate(() => PEGLIN.web.state.S.lcfg.sel.length === 1 && localStorage.getItem(SKEY('peglin-learn')) === cfgBefore && document.querySelector('.pg-picker').innerHTML === prepBefore));
    await page.click('#pgwSwitch');
    const currentUnit = await picker.locator('.pg-unit.sel [data-unit]').getAttribute('data-unit');
    await picker.locator('[data-picker="plClear"]').click();
    // Choose a different unit explicitly, then a single lesson from it.
    const unitButtons = picker.locator('[data-unit]');
    for (let i = 0; i < await unitButtons.count(); i++) {
      if (await unitButtons.nth(i).getAttribute('data-unit') !== currentUnit) { await unitButtons.nth(i).click(); break; }
    }
    const lesson = picker.locator('.pg-unit.open .pg-lesson').first(), newKey = await lesson.getAttribute('data-k');
    await lesson.click();
    check('390px picker has no horizontal overflow', await picker.evaluate(el => el.scrollWidth <= el.clientWidth && el.closest('.modal-scroll').scrollWidth <= el.closest('.modal-scroll').clientWidth));
    const stats = await page.evaluate(() => {
      const g = PEGLIN.web.state; g.fired = 3; g.pts = 1;
      return { credits: g.credits, pts: g.pts, fired: g.fired, graded: g.graded, right: g.right, reads: g.reads, lessons: g.lessons, wrong: g.wrong.length };
    });
    await page.click('[data-start]');
    const switched = await page.evaluate(() => {
      const g = PEGLIN.web.state;
      return { stats: { credits: g.credits, pts: g.pts, fired: g.fired, graded: g.graded, right: g.right, reads: g.reads, lessons: g.lessons, wrong: g.wrong.length }, key: g.item.les.p.id + '/' + g.item.les.l.id, saved: JSON.parse(localStorage.getItem(SKEY('peglin-learn'))).sel, labelMatches: document.querySelector('.pgw-title small').textContent === g.S.label };
    });
    check('switch unit and lesson starts new course, preserving marbles and stats', switched.key === newKey && JSON.stringify(switched.stats) === JSON.stringify(stats) && switched.saved.join() === newKey && switched.labelMatches, switched);
    check('modal and prep selectors are independent', await page.evaluate(() => document.querySelector('.pg-picker').innerHTML === prepBefore));
    check('390px no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('#pgwPanel').scrollWidth <= document.querySelector('#pgwPanel').clientWidth));
    await page.evaluate(() => { PEGLIN.web.close(true); App.go('learn'); });
    // Verify the same page reference is rendered in the knowledge-star view.
    await page.click('[data-tab="notes"]');
    const starUi = await page.evaluate(() => [...document.querySelectorAll('.knowledge-collection .knowledge-page [data-open-page]')].some(x => { const r = JSON.parse(x.dataset.openPage); return r[0] === navFixture.p && r[1] === navFixture.l && r[2] === 0; }));
    check('star remains available to knowledge notes', starUi);

    // Exercise frontier/copy rules independently of rendering or rewards.
    const rules = await page.evaluate(() => {
      const p = LEARN_UI.packs.find(x => x.id === navFixture.p), l = p.lessons.find(x => x.id === navFixture.l);
      const s = PEGLIN.web.learnSession({}, [{ p, l }]), a = s.next();
      const invalid = !s.goto(-1) && !s.goto(1) && !s.goto(0.5) && !s.goto(NaN);
      s.goto(0); const fresh = s.current() === a; a.done = true;
      const b = s.next(); s.goto(0); const copy = s.current(); copy.done = false;
      const isolated = copy !== a && copy.back && copy.review && !copy.lessonEnd && a.done;
      const undone = s.next() === b && !b.back;
      b.done = true; s.goto(0); const doneCopy = s.next(); const c = s.next();
      const doneSkipped = doneCopy.back && c === s.items[2] && !c.back;
      let x; while ((x = s.next()) && !x.review) x.done = true;
      return { invalid, fresh, isolated, undone, doneSkipped, reviewContinues: !!x?.review && !x.back };
    });
    check('frontier, copy isolation, done-skip, and normal review rules', Object.values(rules).every(Boolean), rules);

    // Practice-derived bank questions retain their lesson step for starring and navigation.
    const bank = await page.evaluate(() => {
      for (const p of LEARN_UI.packs) for (const l of p.lessons) {
        if (!l.steps.some(x => x.type === 'practice')) continue;
        const s = PEGLIN.web.learnSession({ per: 1, shots: 1 }, [{ p, l }]);
        const k = s.items.findIndex(x => x.kind === 'bank' && x.q.type === 'single');
        if (k < 0) continue;
        for (let i = 0; i < k; i++) s.next().done = true;
        PEGLIN.web.open(s);
        return { k, answer: s.items[k].q.key[0], step: l.steps[s.items[k].si].type };
      }
      return null;
    });
    check('practice bank item retains practice step index', !!bank && bank.step === 'practice');
    if (bank) {
      await page.click(`#pgwQ .opt[data-l="${bank.answer}"]`);
      if (await page.locator('#pgwQ .confirm').isVisible()) await page.click('#pgwQ .confirm');
      const saved = await page.evaluate(() => ({ credits: PEGLIN.web.state.credits, graded: PEGLIN.web.state.graded, records: { qs: Store.qs, wrong: Store.wrong, profile: Store.profile, learn: LEARN_UI.exportData() } }));
      await page.click(`.pgw-pip[data-page="${bank.k}"]`);
      await page.click(`#pgwQ .opt[data-l="${bank.answer}"]`);
      if (await page.locator('#pgwQ .confirm').isVisible()) await page.click('#pgwQ .confirm');
      const replay = await page.evaluate(() => ({ credits: PEGLIN.web.state.credits, graded: PEGLIN.web.state.graded, records: { qs: Store.qs, wrong: Store.wrong, profile: Store.profile, learn: LEARN_UI.exportData() } }));
      check('revisited bank answer does not reward or record', JSON.stringify(saved) === JSON.stringify(replay));

      const testItem = await page.evaluate(() => {
        const original = PEGLIN.web.state.item, { p, l } = original.les;
        const s = PEGLIN.web.learnSession({ test: true, per: 1, shots: 1 }, [{ p, l }]);
        // Reuse the known question: a smart pick can exclude it after the first answer.
        // A one-item session exercises completion without changing the real lesson content.
        s.items.splice(0, s.items.length, { kind: 'bank', q: original.q, si: original.si, les: { p, l, n: 0, ok: 0 }, lessonEnd: true });
        PEGLIN.web.open(s);
        return { answer: s.items[0].q.key[0], records: JSON.stringify({ qs: Store.qs, profile: Store.profile, learn: LEARN_UI.exportData() }) };
      });
      await page.click(`#pgwQ .opt[data-l="${testItem.answer}"]`);
      if (await page.locator('#pgwQ .confirm').isVisible()) await page.click('#pgwQ .confirm');
      check('test session rewards and completes without saving progress', await page.evaluate(saved => {
        const g = PEGLIN.web.state;
        return g.credits === 1 && g.lessons === 1 && saved === JSON.stringify({ qs: Store.qs, profile: Store.profile, learn: LEARN_UI.exportData() });
      }, testItem.records));
      await page.click('.pgw-pip[data-page="0"]');
      await page.click(`#pgwQ .opt[data-l="${testItem.answer}"]`);
      if (await page.locator('#pgwQ .confirm').isVisible()) await page.click('#pgwQ .confirm');
      check('revisiting final page cannot finish lesson twice', await page.evaluate(() => PEGLIN.web.state.lessons === 1 && PEGLIN.web.state.graded === 1 && PEGLIN.web.state.credits === 1));
    }
  } catch (e) { report.issues.push("exception: " + (e.stack || e)); }
  finally {
    await page.evaluate(b => { PEGLIN.web.close(true); U.clearModals(); localStorage.clear(); Object.entries(b).forEach(([k,v]) => localStorage.setItem(k,v)); }, backup);
    report.restored = await page.evaluate(b => localStorage.length === Object.keys(b).length && Object.entries(b).every(([k,v]) => localStorage.getItem(k) === v), backup);
    check('zero page errors', pageErrors.length === 0, pageErrors);
    check('localStorage restored exactly', report.restored);
    report.pass = report.checks.filter(c => c.pass).length; report.total = report.checks.length;
    await ctx.close(); await browser.close();
    fs.mkdirSync(path.join(root, 'docs/peglin-web'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs/peglin-web/learn-nav-qa.json'), JSON.stringify(report, null, 2));
    if (report.issues.length) { console.error(report.issues.join('\n')); process.exitCode = 1; }
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
