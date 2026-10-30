// Gem balance QA (offline file://, isolated Edge context, Unity iframe replaced, cloud login mocked).
// PowerShell: $env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/peglin-web-qa/gems.cjs
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../..'), report = { at: new Date().toISOString(), checks: [], issues: [] };
const check = (name, pass, details) => { report.checks.push({ name, pass: !!pass, ...(details ? { details } : {}) }); if (!pass) report.issues.push(name); console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass || !details ? '' : ' ' + JSON.stringify(details))); };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage(), pageErrors = [];
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => pageErrors.push(e.message));
  await ctx.route(/^https?:/, r => r.abort());
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction(() => typeof PEGLIN !== 'undefined' && typeof LEARN_UI !== 'undefined');
  const backup = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const gems = () => page.evaluate(() => Store.profile.gems);
  const ans = id => page.evaluate(id => Store.Q[id].ans, id);
  try {
    const t = await page.evaluate(() => ({ step: C.GEMS.trialStep, m10: 1 + C.GEMS.trialStep * 10, m1: 1 + C.GEMS.trialStep, p: C.GEMS.peglin }));
    check('abyss trial multiplier lowered but still increasing (X: 2.5 -> 1.6)', Math.abs(t.m10 - 1.6) < 1e-9 && t.m1 > 1 && t.m10 > t.m1, t);
    const ids = await page.evaluate(() => {
      U.clearModals(); Store.settings.confirmSingle = false; delete Store.profile.peglinGem;
      Object.defineProperty(CLOUD, 'signedIn', { configurable: true, get: () => true });
      const h = U.h;
      U.h = html => { const el = h(html), f = el.querySelector?.('#pgwFrame'); if (f) { f.removeAttribute('src'); f.srcdoc = '<!doctype html><title>offline</title>'; } return el; };
      CLOUD.peglinGet = async () => null; CLOUD.peglinPut = async () => ({});
      const qs = Object.values(Store.Q).filter(q => q.type === 'single' && /^[A-E]$/.test(q.ans) && !q.group).slice(0, 3);
      return qs.map(q => q.id);
    });
    const [A, B, Cq] = ids;
    const open = (list, test) => page.evaluate(([list, test]) => PEGLIN.web.open(PEGLIN.web.quizSession({ subjects: [], per: 1, shots: 1, onWrong: 'count', test }, list)), [list, test]);
    const pick = async L => { await page.click(`#pgwQ .opt[data-l="${L}"]`); };
    const nextQ = () => page.click('#pgwQ .next-btn');
    let g0 = await gems();
    await open([A, A, B], false);
    await pick(await ans(A));
    check('quiz: first-try correct gives quizRight', (await gems()) - g0 === t.p.quizRight, { got: (await gems()) - g0 });
    check('quiz: HUD shows earned gems', await page.evaluate(n => document.querySelector('#pgwStat').textContent.includes('魂晶 +' + n), t.p.quizRight));
    await nextQ(); g0 = await gems(); await pick(await ans(A));
    check('quiz: same question again in session gives 0', (await gems()) === g0);
    await nextQ(); g0 = await gems();
    const wrongL = (await ans(B)) === 'A' ? 'B' : 'A'; await pick(wrongL);
    check('quiz: wrong answer gives 0', (await gems()) === g0);
    await nextQ();
    check('quiz: end screen shows session total', await page.evaluate(n => document.querySelector('.pgw-end').textContent.includes('獲得魂晶 +' + n), t.p.quizRight));
    await page.evaluate(() => PEGLIN.web.close(true));
    g0 = await gems(); await open([A], false); await pick(await ans(A));
    check('quiz: question rewarded within cooldown gives 0 in a new session', (await gems()) === g0);
    await page.evaluate(() => PEGLIN.web.close(true));
    g0 = await gems(); await open([Cq], true); await pick(await ans(Cq));
    check('quiz: test session gives 0', (await gems()) === g0);
    await page.evaluate(() => PEGLIN.web.close(true));
    // Learn: first single/tf check on a lesson
    const fx = await page.evaluate(() => {
      for (const p of LEARN_UI.packs) for (const l of p.lessons) { const i = l.steps.findIndex(s => s.type === 'check' && ['single', 'tf'].includes(s.kind)); if (i >= 0 && i < 6) return { p: p.id, l: l.id, subject: p.subject }; }
    });
    await page.evaluate(fx => { const cfg = { subject: fx.subject, sel: [fx.p + '/' + fx.l], per: 1, shots: 1, onWrong: 'count', test: false }; PEGLIN.web.open(PEGLIN.web.learnSession(cfg, PEGLIN.web.selectedLessons(cfg))); }, fx);
    for (let n = 0; n < 20 && await page.evaluate(() => PEGLIN.web.state.item.kind === 'read'); n++) await page.click('#pgwQ .pgw-go button');
    const c = await page.evaluate(() => { const it = PEGLIN.web.state.item; return { index: PEGLIN.web.state.S.cur(), answer: it.c.kind === 'tf' ? (it.c.answer ? 0 : 1) : it.c.answer }; });
    check('learn: reading pages gives 0', (await gems()) === g0, { g0, now: await gems() });
    await page.click(`#pgwQ .lc-opt[data-i="${c.answer}"]`);
    check('learn: first-try correct check gives learnRight', (await gems()) - g0 === t.p.learnRight, { got: (await gems()) - g0 });
    await page.click('#pgwQ .pgw-go button');
    g0 = await gems();
    await page.click(`.pgw-pip[data-page="${c.index}"]`); await page.click(`#pgwQ .lc-opt[data-i="${c.answer}"]`);
    check('learn: revisited page gives 0', (await gems()) === g0);
    await page.evaluate(() => PEGLIN.web.close(true));
    check('no page errors', !pageErrors.length, pageErrors);
  } finally {
    await page.evaluate(b => { localStorage.clear(); Object.entries(b).forEach(([k, v]) => localStorage.setItem(k, v)); }, backup);
    await browser.close();
  }
  fs.mkdirSync(path.join(root, 'docs/peglin-web'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/peglin-web/gems-qa.json'), JSON.stringify(report, null, 2));
  console.log(`${report.checks.length - report.issues.length}/${report.checks.length} passed`);
  process.exit(report.issues.length ? 1 : 0);
})();
