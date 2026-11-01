const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const url = require('url').pathToFileURL(path.resolve(__dirname, '../../index.html')).href;
const out = { checks: [], errors: [] };
const ok = (name, value) => out.checks.push({ name, ok: !!value });
const answer = '| 面向 | 交感 | 副交感 |\n|---|---|---|\n| 瞳孔 | 擴大 [1] | 縮小 |\n| 心率 | 增加 | 降低 |\n| 腺體 | 汗腺分泌 |\n| 神經 | 長節後 | 短節後 |\n| 功能 | 備戰 | 休息 |\n\n- 易混淆提醒：依器官而異。';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [1100, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(url); await page.waitForFunction(() => typeof LEARN_UI !== 'undefined' && typeof App !== 'undefined');
      const backup = await page.evaluate(() => ({ ...localStorage }));
      const pack = await page.evaluate(() => LEARN_UI.packs.find(p => C.SUBJECTS[p.subject] && p.lessons.length).id);
      await page.evaluate(p => App.go('learn', { pack: p }), pack);
      await page.locator('[data-play="0"]').click();
      await page.evaluate(answer => {
        Object.defineProperty(CLOUD, 'signedIn', { configurable: true, get: () => true });
        Object.defineProperty(CLOUD, 'email', { configurable: true, get: () => 'qa' });
        CLOUD.cfg = () => ({ url: 'https://test.invalid', key: 'test' }); CLOUD.token = async () => 'test';
        window.__requests = []; window.__clipboard = '';
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async t => { window.__clipboard = t; } } });
        window.fetch = async (url, opt) => { if (!String(url).includes('ai_status')) window.__requests.push(JSON.parse(opt.body)); return new Response(JSON.stringify(String(url).includes('ai_status') ? { allowed: true } : { text: answer, provider: 'fixture' }), { status: 200 }); };
        AI.open();
      }, answer);
      await page.locator('[data-act=table]').click();
      for (let i = 0; i < 4; i++) await page.locator('[data-act=table-add]').click();
      ok(width + ' six item limit', await page.locator('.ai-table-items input').count() === 6 && await page.locator('[data-act=table-add]').isDisabled());
      await page.locator('.ai-table-items input').nth(0).fill('交感'); await page.locator('.ai-table-items input').nth(1).fill('副交感');
      await page.locator('[name=aspects]').fill('功能'); await page.locator('.ai-table-form button[type=submit]').click();
      await page.locator('.ai-msg.bot [data-act=star]').first().waitFor();
      ok(width + ' form instruction', await page.evaluate(() => { const c = __requests[0].messages.at(-1).content; const s = typeof c === 'string' ? c : c[0].text; return s.includes('交感、副交感') && s.includes('【本次表格格式】') && s.includes('功能'); }));
      const table = page.locator('.ai-msg.bot .md-table-scroll').first();
      ok(width + ' scroll container', await table.locator('table').count() === 1);
      ok(width + ' no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('.aip-list').scrollWidth <= document.querySelector('.aip-list').clientWidth));
      ok(width + ' sticky first column', await table.locator('tr').nth(1).locator('td').first().evaluate(e => getComputedStyle(e).position === 'sticky'));
      ok(width + ' sticky while scrolling', await table.evaluate(e => { const cell = e.querySelector('td'), before = cell.getBoundingClientRect().left; e.scrollLeft = e.scrollWidth; return e.scrollWidth <= e.clientWidth || (e.scrollLeft > 0 && Math.abs(cell.getBoundingClientRect().left - before) < 2); }));
      ok(width + ' glossary in cell', await table.locator('td .gl').count() > 0);
      ok(width + ' ragged row padded', await table.locator('tr').nth(3).locator('td').count() === 3 && await table.locator('tr').nth(3).locator('td').nth(2).innerText() === '');
      await page.locator('[data-act=copy-table]').first().click();
      ok(width + ' TSV copied', await page.evaluate(() => __clipboard.includes('面向\t交感\t副交感') && __clipboard.includes('腺體\t汗腺分泌\t') && __clipboard.split('\n').length === 6));
      await page.locator('[data-act=star]').first().click(); await page.locator('.modal-bg').getByRole('button', { name: '收藏', exact: true }).click();
      await page.locator('#aiPanel textarea').fill('幫我做表格比較 A 和 B'); await page.locator('#aiPanel [data-act=send]').click();
      await page.waitForFunction(() => window.__requests.length === 2);
      ok(width + ' free text instruction', await page.evaluate(() => { const c = __requests[1].messages.at(-1).content; return (typeof c === 'string' ? c : c[0].text).includes('【本次表格格式】'); }));
      await page.waitForFunction(() => document.querySelectorAll('.ai-msg.bot [data-act=star]').length === 2);
      await page.evaluate(() => { AI.toggle(false); App.go('learn', { tab: 'notes' }); }); await page.selectOption('#knowledgeType', 'ai');
      ok(width + ' bookmarked table', await page.locator('.knowledge-ai .md-table-scroll table').count() === 1);
      ok(width + ' bookmark glossary', await page.locator('.knowledge-ai td .gl').count() > 0);
      ok(width + ' bookmark no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.evaluate(b => { localStorage.clear(); for (const [k,v] of Object.entries(b)) localStorage.setItem(k,v); }, backup);
    } catch (e) { errors.push(e.stack || String(e)); }
    ok(width + ' no page errors', errors.length === 0); out.errors.push(...errors.map(error => ({ width, error })));
    await ctx.close();
  }
  await browser.close(); out.passed = out.checks.filter(c => c.ok).length; out.total = out.checks.length;
  fs.writeFileSync(path.resolve(__dirname, '../../docs/ai-table-qa.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2)); if (out.passed !== out.total || out.errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
