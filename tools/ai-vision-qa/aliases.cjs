const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const out = { checks: [], problems: [] };
const ok = (name, pass) => { out.checks.push({ name, ok: !!pass }); if (!pass) out.problems.push(name); };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } }), page = await ctx.newPage();
  await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ body: '{"ok":false}' }));
  await page.goto(require('url').pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => typeof LEARN_UI !== 'undefined');
  const backup = await page.evaluate(() => ({ ...localStorage }));
  await page.evaluate(() => App.go('learn', { pack: 'eyelab-blood' }));
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  try {
    for (const [type, names, en] of [
      ['short', ['睫狀後短動脈', '後短睫狀動脈', '短後睫狀動脈'], 'short posterior ciliary artery'],
      ['long', ['睫狀後長動脈', '後長睫狀動脈', '長後睫狀動脈'], 'long posterior ciliary artery']
    ]) {
      for (const name of names) {
        await page.evaluate(en => {
          const p = LEARN_UI.packs.find(p => p.id === 'eyelab-blood');
          const c = p.lessons.flatMap(l => l.steps.flatMap(s => s.type === 'check' ? [s] : s.checks || [])).find(c => c.kind === 'name' && c.en.includes(en));
          document.querySelector('#screen').innerHTML = '<div class="panel learn"><div class="lp-body" id="fixture"></div></div>';
          LEARN_UI.renderCheck(document.querySelector('#fixture'), c);
        }, en);
        await page.locator('[data-k="zh"]').fill(name); await page.locator('[data-k="en"]').fill(en); await page.locator('.lc-send').click();
        ok(type + ' learning accepts ' + name, await page.locator('.lc-fb .green-t').count() === 1);
        if (name === '短後睫狀動脈') await page.screenshot({ path: path.join(ROOT, 'output/playwright/ciliary-alias-correct.png'), fullPage: true });
        await page.evaluate(en => {
          const q = Object.values(Store.Q).find(q => q.type === 'fill' && q.ans === (en.startsWith('short') ? '睫狀後短動脈' : '睫狀後長動脈') + ' / ' + en);
          QV.render(document.querySelector('#fixture'), q);
        }, en);
        await page.locator('.fill-in').fill(name + ' / ' + en); await page.locator('.answers button').click();
        ok(type + ' bank accepts ' + name, await page.locator('.result-box .verdict.green-t').count() === 1);
      }
    }
    for (const [zh, en] of [['長後睫狀動脈', 'short posterior ciliary artery'], ['短後睫狀動脈', 'long posterior ciliary artery'], ['短後睫狀動脈', ''], ['', 'short posterior ciliary artery']]) {
      await page.evaluate(() => {
        const p = LEARN_UI.packs.find(p => p.id === 'eyelab-blood');
        const c = p.lessons.flatMap(l => l.steps.flatMap(s => s.checks || [])).find(c => c.kind === 'name' && c.en.includes('short posterior ciliary artery'));
        LEARN_UI.renderCheck(document.querySelector('#fixture'), c);
      });
      await page.locator('[data-k="zh"]').fill(zh); await page.locator('[data-k="en"]').fill(en); await page.locator('.lc-send').click();
      ok('reject incomplete or mismatched pair ' + zh + ' / ' + en, await page.locator('.lc-fb .green-t').count() === 0);
    }
    ok('no page errors', !errors.length);
  } finally {
    await page.evaluate(backup => { localStorage.clear(); Object.entries(backup).forEach(([k, v]) => localStorage.setItem(k, v)); }, backup);
    ok('storage restored', JSON.stringify(backup) === await page.evaluate(() => JSON.stringify({ ...localStorage })));
    await browser.close();
  }
  fs.writeFileSync(path.join(ROOT, 'output/playwright/ciliary-alias-qa.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ checks: out.checks.length, problems: out.problems })); process.exitCode = out.problems.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(2); });
