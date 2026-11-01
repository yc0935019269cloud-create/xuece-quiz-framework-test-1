const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const url = require('url').pathToFileURL(path.resolve(__dirname, '../../index.html')).href;
const out = { checks: [], errors: [] }, ok = (name, value) => out.checks.push({ name, ok: !!value });
const answer = '**副交感路徑**\n::: flow\n視網膜\n視神經\n睫狀神經節（換元）\n瞳孔括約肌\n:::\n\n**交感路徑**\n::: flow\n下視丘 → 上頸神經節（換元） → 瞳孔擴大肌\n:::\n\n考點提醒：\n- 注意換元 [1]。';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [1100, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 }), page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(url); await page.waitForFunction(() => typeof LEARN_UI !== 'undefined' && typeof App !== 'undefined');
      const backup = await page.evaluate(() => ({ ...localStorage }));
      const pack = await page.evaluate(() => LEARN_UI.packs.find(p => C.SUBJECTS[p.subject] && p.lessons.length).id);
      await page.evaluate(p => App.go('learn', { pack: p }), pack); await page.locator('[data-play="0"]').click();
      await page.evaluate(answer => {
        Object.defineProperty(CLOUD, 'signedIn', { configurable: true, get: () => true });
        Object.defineProperty(CLOUD, 'email', { configurable: true, get: () => 'qa' });
        CLOUD.cfg = () => ({ url: 'https://test.invalid', key: 'test' }); CLOUD.token = async () => 'test';
        window.__requests = []; window.__clipboard = '';
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async t => { window.__clipboard = t; } } });
        window.fetch = async (url, opt) => { if (!String(url).includes('ai_status')) window.__requests.push(JSON.parse(opt.body)); return new Response(JSON.stringify(String(url).includes('ai_status') ? { allowed: true } : { text: answer, provider: 'fixture' }), { status: 200 }); };
        AI.open();
      }, answer);
      await page.locator('[data-act=flow]').click(); await page.locator('.ai-flow-form [name=topic]').fill('瞳孔光反射'); await page.locator('.ai-flow-form [name=start]').fill('視網膜');
      await page.locator('.ai-flow-form button[type=submit]').click(); await page.locator('.ai-msg.bot [data-act=star]').first().waitFor();
      ok(width + ' form instruction', await page.evaluate(() => JSON.stringify(__requests[0]).includes('【本次流程圖格式】') && JSON.stringify(__requests[0]).includes('視網膜')));
      const flows = page.locator('.ai-msg.bot').first().locator('.md-flow');
      ok(width + ' flow stations and inline split', await flows.count() === 2 && await flows.nth(0).locator('.md-fstep').count() === 4 && await flows.nth(1).locator('.md-fstep').count() === 3);
      ok(width + ' glossary', await flows.locator('.gl').count() > 0);
      await flows.locator('.gl').first().click();
      ok(width + ' glossary popup actions', await page.locator('.gl-pop .gl-play').count() === 1 && await page.locator('.gl-pop .gl-picture').count() === 1);
      await page.keyboard.press('Escape');
      ok(width + ' read-light colors', await page.evaluate(() => { document.documentElement.classList.add('read-light'); const step = document.querySelector('.ai-msg.bot .md-fstep'); const css = getComputedStyle(step); const valid = css.color !== css.backgroundColor && css.backgroundColor !== 'rgba(0, 0, 0, 0)'; document.documentElement.classList.remove('read-light'); return valid; }));
      ok(width + ' no overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('.aip-list').scrollWidth <= document.querySelector('.aip-list').clientWidth));
      await page.locator('[data-act=copy-flow]').first().click();
      ok(width + ' copied labels and stations', await page.evaluate(() => __clipboard === '副交感路徑：視網膜 → 視神經 → 睫狀神經節（換元） → 瞳孔括約肌\n交感路徑：下視丘 → 上頸神經節（換元） → 瞳孔擴大肌'));
      ok(width + ' unterminated', await page.evaluate(() => { const e = document.createElement('div'); e.innerHTML = U.md('::: flow\n甲 → 乙', { scrollTables: true }); return e.querySelectorAll('.md-fstep').length === 2; }));
      await page.locator('[data-act=star]').first().click(); await page.locator('.modal-bg').getByRole('button', { name: '收藏', exact: true }).click();
      await page.locator('#aiPanel textarea').fill('房水的流出途徑'); await page.locator('#aiPanel [data-act=send]').click(); await page.waitForFunction(() => __requests.length === 2);
      ok(width + ' free text', await page.evaluate(() => JSON.stringify(__requests[1]).includes('【本次流程圖格式】')));
      await page.waitForFunction(() => document.querySelectorAll('.ai-msg.bot [data-act=star]').length === 2);
      await page.locator('#aiPanel textarea').fill('用表格比較兩條路徑'); await page.locator('#aiPanel [data-act=send]').click(); await page.waitForFunction(() => __requests.length === 3);
      ok(width + ' table priority', await page.evaluate(() => { const c = __requests[2].messages.at(-1).content; const t = typeof c === 'string' ? c : c[0].text; return t.includes('【本次表格格式】') && !t.includes('【本次流程圖格式】'); }));
      await page.waitForFunction(() => document.querySelectorAll('.ai-msg.bot [data-act=star]').length === 3);
      await page.evaluate(() => { AI.toggle(false); App.go('learn', { tab: 'notes' }); }); await page.selectOption('#knowledgeType', 'ai');
      ok(width + ' bookmarked flow', await page.locator('.knowledge-ai .md-flow').count() === 2);
      ok(width + ' bookmark glossary and no overflow', await page.locator('.knowledge-ai .md-flow .gl').count() > 0 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      ok(width + ' bookmark read-light colors', await page.evaluate(() => { document.documentElement.classList.add('read-light'); const css = getComputedStyle(document.querySelector('.knowledge-ai .md-fstep')); const valid = css.color !== css.backgroundColor && css.backgroundColor !== 'rgba(0, 0, 0, 0)'; document.documentElement.classList.remove('read-light'); return valid; }));
      await page.evaluate(b => { localStorage.clear(); for (const [k,v] of Object.entries(b)) localStorage.setItem(k,v); }, backup);
    } catch (e) { errors.push(e.stack || String(e)); }
    ok(width + ' no page errors', errors.length === 0); out.errors.push(...errors.map(error => ({ width, error }))); await ctx.close();
  }
  await browser.close(); out.passed = out.checks.filter(c => c.ok).length; out.total = out.checks.length;
  fs.writeFileSync(path.resolve(__dirname, '../../docs/ai-flow-qa.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2)); if (out.passed !== out.total || out.errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
