const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const url = require('url').pathToFileURL(path.resolve(__dirname, '../../index.html')).href;
const out = { checks: [], errors: [] };
function ok(name, v) { out.checks.push({ name, ok: !!v }); }
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [1100, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(url); await page.waitForFunction(() => typeof LEARN_UI !== 'undefined' && typeof App !== 'undefined');
      const backup = await page.evaluate(() => ({ ...localStorage }));
      const plan = await page.evaluate(() => { const ps = LEARN_UI.packs.filter(p => C.SUBJECTS[p.subject] && p.lessons.length); const a = ps[0], b = ps.find(p => p.subject !== a.subject) || ps[1]; return { a: { p: a.id, l: a.lessons[0].id }, b: { p: b.id, l: b.lessons.at(-1).id, subj: b.subject } }; });
      await page.evaluate(p => { App.go('learn', { pack: p }); }, plan.a.p);
      await page.locator('[data-play="0"]').click();
      await page.evaluate(() => {
        Object.defineProperty(CLOUD, 'signedIn', { configurable: true, get: () => true });
        Object.defineProperty(CLOUD, 'email', { configurable: true, get: () => 'qa' });
        CLOUD.cfg = () => ({ url: 'https://test.invalid', key: 'test' }); CLOUD.token = async () => 'test';
        window.fetch = async url => new Response(JSON.stringify(String(url).includes('ai_status') ? { allowed: true } : { text: '角膜（Cornea）、鞏膜與瞳孔。 [1]\n\n`角膜`', provider: 'fixture' }), { status: 200, headers: { 'content-type': 'application/json' } });
        AI.open();
      });
      await page.locator('#aiPanel textarea').fill('角膜是什麼'); await page.locator('#aiPanel [data-act=send]').click();
      await page.locator('#aiPanel [data-act=star]').waitFor();
      ok(width + ' glossary terms', await page.locator('.ai-msg.bot .gl').count() >= 1);
      ok(width + ' code excluded', await page.locator('.ai-msg.bot code .gl').count() === 0);
      await page.locator('.ai-msg.bot .gl').first().click();
      ok(width + ' popup and speech button', await page.locator('.gl-pop .gl-play').count() === 1);
      ok(width + ' popup above AI', await page.evaluate(() => { const e=document.querySelector('.gl-pop'), r=e.getBoundingClientRect(); return +getComputedStyle(e).zIndex > +getComputedStyle(document.querySelector('#aiPanel')).zIndex && document.elementFromPoint(r.left+10,r.top+10).closest('.gl-pop') === e; }));
      await page.evaluate(() => GLOSS.close());
      const cite = page.locator('.ai-msg.bot a.ai-cite').first();
      ok(width + ' citation exists', await cite.count() === 1);
      if (await cite.count()) { await page.evaluate(() => { window.__refOpened = false; App.go = () => { window.__refOpened = true; }; QV.practiceModal = () => { window.__refOpened = true; }; }); await cite.click(); ok(width + ' citation opens source', await page.evaluate(() => window.__refOpened)); await page.reload(); await page.waitForFunction(() => typeof LEARN_UI !== 'undefined' && typeof App !== 'undefined'); await page.evaluate(p => App.go('learn', {pack:p}), plan.a.p); await page.locator('[data-play="0"]').click(); await page.evaluate(() => { Object.defineProperty(CLOUD, 'signedIn', { configurable:true, get:()=>true }); CLOUD.cfg=()=>({url:'https://test.invalid',key:'test'}); CLOUD.token=async()=> 'test'; window.fetch=async url=>new Response(JSON.stringify(String(url).includes('ai_status') ? {allowed:true} : {text:'角膜（Cornea）、鞏膜與瞳孔。 [1]\n\n`角膜`'}),{status:200}); AI.open(); }); await page.locator('#aiPanel textarea').fill('角膜是什麼'); await page.locator('#aiPanel [data-act=send]').click(); await page.locator('#aiPanel [data-act=star]').waitFor(); }
      await page.locator('#aiPanel [data-act=star]').click();
      ok(width + ' current lesson default', await page.locator('[data-field=pack]').inputValue() === plan.a.p && await page.locator('[data-field=lesson]').inputValue() === plan.a.l);
      await page.locator('[data-field=subject]').selectOption(plan.b.subj); await page.locator('[data-field=pack]').selectOption(plan.b.p); await page.locator('[data-field=lesson]').selectOption(plan.b.l);
      await page.locator('.modal-bg').getByRole('button', { name: '收藏', exact: true }).click();
      ok(width + ' selected lesson saved', await page.evaluate(b => Object.values(LEARN_UI.exportData().starred || {}).some(r => r.kind === 'ai' && r.p === b.p && r.l === b.l), plan.b));
      ok(width + ' button saved state', (await page.locator('#aiPanel [data-act=star]').innerText()).includes('已收藏'));
      await page.locator('#aiPanel [data-act=star]').click();
      ok(width + ' removal asks confirmation', await page.locator('.modal-bg').getByRole('button', {name:'確定'}).count() === 1);
      await page.locator('.modal-bg').getByRole('button', {name:'確定'}).click();
      ok(width + ' removal from AI', (await page.locator('#aiPanel [data-act=star]').innerText()).includes('☆'));
      await page.locator('#aiPanel [data-act=star]').click();
      await page.locator('[data-field=subject]').selectOption(plan.b.subj); await page.locator('[data-field=pack]').selectOption(plan.b.p); await page.locator('[data-field=lesson]').selectOption(plan.b.l);
      await page.locator('.modal-bg').getByRole('button', { name: '收藏', exact: true }).click();
      const exp = await page.evaluate(() => Store.exportAll());
      await page.evaluate(() => { const [key] = LEARN_UI.aiFind('角膜是什麼', '角膜（Cornea）、鞏膜與瞳孔。 [1]\n\n`角膜`'); LEARN_UI.aiUnstar(key); });
      await page.evaluate(x => Store.importAll(x), exp);
      await page.reload(); await page.waitForFunction(() => typeof LEARN_UI !== 'undefined' && typeof App !== 'undefined');
      ok(width + ' export import', await page.evaluate(b => Object.values(LEARN_UI.exportData().starred || {}).some(r => r.kind === 'ai' && r.p === b.p && r.l === b.l), plan.b));
      await page.evaluate(() => { App.go('learn', {tab:'notes'}); });
      await page.selectOption('#knowledgeType', 'ai');
      ok(width + ' notes AI card', await page.locator('.knowledge-ai').count() === 1 && (await page.locator('.knowledge-ai').innerText()).includes('角膜是什麼'));
      await page.locator(`[data-nf="${plan.b.subj}"]`).click(); await page.selectOption('#knowledgeUnit', plan.b.p);
      ok(width + ' subject unit filters', await page.locator('.knowledge-ai').count() === 1);
      await page.locator('#nSearch').fill('瞳孔'); await page.waitForTimeout(500);
      ok(width + ' answer search', await page.locator('.knowledge-ai').count() === 1);
      await page.locator('#nSearch').fill('不存在的測試關鍵字'); await page.waitForTimeout(500);
      ok(width + ' search excludes', await page.locator('.knowledge-ai').count() === 0);
      await page.locator('#nSearch').fill(''); await page.waitForTimeout(500);
      await page.locator('.knowledge-ai [data-knowledge-star]').click();
      ok(width + ' remove in notes', await page.locator('.knowledge-ai').count() === 0);
      await page.evaluate(b => { localStorage.clear(); for (const [k,v] of Object.entries(b)) localStorage.setItem(k,v); }, backup);
    } catch(e) { errors.push(e.stack || String(e)); }
    ok(width + ' no page errors', errors.length === 0); out.errors.push(...errors.map(e => ({ width, error:e })));
    await ctx.close();
  }
  await browser.close();
  out.passed = out.checks.filter(c => c.ok).length; out.total = out.checks.length;
  fs.writeFileSync(path.resolve(__dirname, '../../docs/ai-star-qa.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2)); if (out.passed !== out.total || out.errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
