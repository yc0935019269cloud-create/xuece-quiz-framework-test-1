// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/learn-qa/jump.cjs
const { chromium } = require('playwright');
const { pathToFileURL } = require('url');
const path = require('path'), fs = require('fs');
const root = path.resolve(__dirname, '../..');
const results = [];
function check(width, name, value) { results.push({ width, name, pass: !!value }); console.log(`${value ? 'PASS' : 'FAIL'} ${width} ${name}`); }
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [1100, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    try {
      await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
      await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
      const ids = await page.evaluate(() => {
        try { VOL.set('muted', true); } catch (_) {}
        const p = LEARN_UI.packs.find(p => p.style !== 'novel' && p.lessons.length);
        p.calm = true;
        p.lessons = [{ id: 'jump-qa', title: '跳頁測試', steps: [
          { type: 'intro', title: '開始', body: '測試' },
          { type: 'card', title: '中間', body: '測試' },
          { type: 'check', id: 'jump-qa-check', kind: 'single', q: '測試題', choices: ['正確', '錯誤'], answer: 0 }
        ] }];
        return { pack: p.id, novel: LEARN_UI.packs.find(p => p.style === 'novel').id };
      });
      const open = async id => { await page.evaluate(id => App.go('learn', { pack: id }), id); await page.locator('[data-play="0"]').click(); };
      const pip = async i => page.locator(`#lpPips i[data-i="${i}"]`).click();
      const current = () => page.evaluate(() => LEARN_UI.curPage().i);
      const snapshot = () => page.evaluate(() => {
        const d = JSON.parse(localStorage.getItem(SKEY('learn')));
        return { run: d.les[LEARN_UI.curPage().p + '/jump-qa'].run, rev: d.rev, gems: Store.profile.gems, stat: d.stat };
      });
      await open(ids.pack);
      await pip(2);
      check(width, '未完成不可跳至未到頁', await current() === 0);
      await page.click('#lpNext'); await page.click('#lpNext');
      await page.locator('.lc-opt').first().click(); await page.click('#lpNext');
      check(width, '從頭作答並完成課程', await page.locator('.lp-done').count() === 1);
      await page.click('#dBack'); await page.locator('[data-play="0"]').click();
      check(width, '完成課程的未到頁顯示可點樣式', await page.locator('#lpPips i[data-i="2"].seen').count() === 1);
      await pip(2);
      check(width, '已完成課程可跳至最後一頁並顯示回顧', await current() === 2 && await page.locator('.lp-rv').count() === 1);
      const before = await snapshot();
      await page.locator('.lc-opt').nth(1).click();
      const after = await snapshot();
      check(width, '回顧答錯不改分數、魂晶、複習盒或戰鬥', JSON.stringify(before) === JSON.stringify(after));
      await page.click('#lpPrev');
      check(width, '上一頁仍可回顧', await current() === 1 && await page.locator('.lp-rv').count() === 1);
      await page.click('#lpNext');
      check(width, '繼續後仍是回顧', await current() === 2 && await page.locator('.lp-rv').count() === 1);
      await page.click('#lpNext');
      check(width, '最後一頁仍可完成', await page.locator('.lp-done').count() === 1);
      await open(ids.novel);
      const count = await page.locator('#lpPips i').count();
      for (let i = 0; i < count; i++) await page.click('#lpNext');
      await page.click('#dBack'); await page.locator('[data-play="0"]').click();
      await pip(count - 1);
      check(width, '已完成小說章節可跳至最後一頁', await current() === count - 1 && await page.locator('.lp-rv').count() === 1);
    } catch (e) { check(width, '測試流程未中斷：' + String(e), false); }
    check(width, '無頁面錯誤' + (errors.length ? ': ' + errors.join('; ') : ''), errors.length === 0);
    await ctx.close();
  }
  await browser.close();
  const report = { passed: results.filter(x => x.pass).length, total: results.length, results };
  fs.writeFileSync(path.join(root, 'docs/learn-jump-qa.json'), JSON.stringify(report, null, 2) + '\n');
  if (report.passed !== report.total) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
