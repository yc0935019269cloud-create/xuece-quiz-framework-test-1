// Offline file:// scope QA; isolated storage and a fake Unity frame.
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../..'), report = { at: new Date().toISOString(), checks: [], issues: [] };
function check(name, pass, details) { report.checks.push({ name, pass: !!pass, details }); if (!pass) report.issues.push(name); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}`); }
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }), page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await ctx.route(/^https?:/, r => r.abort());
  await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
  await page.waitForFunction(() => typeof PEGLIN !== 'undefined' && typeof LEARN_UI !== 'undefined');
  const backup = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  try {
    const initial = await page.evaluate(() => {
      U.clearModals(); Store.settings.confirmSingle = false;
      Object.defineProperty(CLOUD, 'signedIn', { configurable: true, get: () => true });
      const h = U.h; U.h = html => { const el = h(html), f = el.querySelector?.('#pgwFrame'); if (f) { f.removeAttribute('src'); f.srcdoc = '<!doctype html><title>offline</title>'; } return el; };
      CLOUD.peglinGet = async () => null; CLOUD.peglinPut = async () => ({});
      const subject = Object.keys(C.SUBJECTS).find(s => Store.filter({ subjects: [s], types: ['single'], status: 'all' }).some(q => !Store.qs[q.id]?.a && /^[A-E]$/.test(q.ans) && !q.group));
      const cfg = { subjects: [subject], types: ['single'], status: 'all', per: 1, shots: 1, onWrong: 'count', test: false };
      const list = Store.filter(cfg).filter(q => q.type !== 'open');
      const q = list.find(q => !Store.qs[q.id]?.a && /^[A-E]$/.test(q.ans) && !q.group);
      window.scopeFixture = { list, answer: q.ans };
      PEGLIN.web.open(PEGLIN.web.quizSession(cfg, [q.id]));
      return { expected: Screens.scopeStats(list), actual: document.querySelector('#pgwScope summary').textContent, session: PEGLIN.web.state.S.scope.length };
    });
    const line = s => `範圍：已刷 ${s.done} 題・未刷 ${s.todo} 題（共 ${s.total}）`;
    check('full selected scope matches setup statistics, not queue', initial.actual === line(initial.expected) && initial.session === initial.expected.total && initial.session > 1, initial);
    await page.click('#pgwScope summary');
    check('question types expand', await page.evaluate(() => { const s = Screens.scopeStats(scopeFixture.list); return document.querySelector('#pgwScope div').textContent.includes(`${s.tDone}／${s.types}`); }));
    await page.click('#pgwScope summary');
    check('390px one line and no horizontal overflow', await page.evaluate(() => { const p = document.querySelector('#pgwPanel'), s = document.querySelector('#pgwScope summary'), cs = getComputedStyle(s); return p.scrollWidth <= p.clientWidth && document.documentElement.scrollWidth <= innerWidth && cs.whiteSpace === 'nowrap' && s.getBoundingClientRect().height <= parseFloat(cs.lineHeight) + 1; }));
    await page.click(`#pgwQ .opt[data-l="${await page.evaluate(() => scopeFixture.answer)}"]`);
    const after = await page.evaluate(() => ({ stats: Screens.scopeStats(scopeFixture.list), text: document.querySelector('#pgwScope summary').textContent }));
    check('answer updates done and todo immediately', after.stats.done === initial.expected.done + 1 && after.stats.todo === initial.expected.todo - 1 && after.text === line(after.stats), after);
    await page.setViewportSize({ width: 1180, height: 820 });
    check('landscape question remains visible', await page.evaluate(() => document.querySelector('#pgwQ').getBoundingClientRect().top < innerHeight / 2));
    await page.evaluate(() => { PEGLIN.web.close(true); const p = LEARN_UI.packs.find(p => p.lessons.length); const cfg = { subject: p.subject, sel: [p.id + '/' + p.lessons[0].id], per: 1, shots: 1, onWrong: 'count', test: false }; PEGLIN.web.open(PEGLIN.web.learnSession(cfg, PEGLIN.web.selectedLessons(cfg))); });
    check('learn mode has no scope line', await page.locator('#pgwScope').count() === 0);
    check('no page errors', errors.length === 0, errors);
  } catch (e) { check('test completed', false, String(e)); }
  finally { await page.evaluate(b => { localStorage.clear(); Object.entries(b).forEach(([k, v]) => localStorage.setItem(k, v)); }, backup); await browser.close(); }
  fs.mkdirSync(path.join(root, 'docs/peglin-web'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/peglin-web/scope-qa.json'), JSON.stringify(report, null, 2));
  console.log(`${report.checks.length - report.issues.length}/${report.checks.length} passed`); process.exit(report.issues.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
