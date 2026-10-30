// 期中總複習清單的星號：加星號、知識筆記出現原圖、取消、別處已加星號時同步顯示。
// NODE_PATH=…skull-atlas-3d/node_modules node tools/midterm/star-check.cjs
const { chromium } = require('playwright'); const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..'); const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
(async () => {
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true }); const R = [];
  const ok = (name, cond, info) => R.push({ name, pass: !!cond, info });
  for (const vp of [{ width: 1100, height: 1000 }, { width: 390, height: 900 }]) {
    const ctx = await b.newContext({ viewport: vp }); const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.goto(URL); await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    const backup = await page.evaluate(() => JSON.stringify(localStorage));
    const open = async () => {
      await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} App.go('learn', { pack: 'eyelab-midterm' }); });
      await page.click('[data-play="0"]'); await page.waitForTimeout(400);
      if (!(await page.$('#lpBody .term-item'))) { await page.click('#lpNext'); await page.waitForTimeout(400); }
    };
    await open();
    const nStars = await page.$$eval('#lpBody .term-item .knowledge-star', x => x.length);
    const nItems = await page.$$eval('#lpBody .term-item', x => x.length);
    ok(`${vp.width} 每列都有星號`, nStars === nItems, `${nStars}/${nItems}`);
    const row = page.locator('#lpBody .term-item').first();
    await row.locator('.knowledge-star').click(); await page.waitForTimeout(200);
    const after = await row.locator('.knowledge-star').getAttribute('aria-pressed');
    const key = await page.evaluate(() => { const k = SKEY('learn'); const D = JSON.parse(localStorage.getItem(k)); return Object.keys(D.starred || {}); });
    ok(`${vp.width} 點了變 ★ 並存檔`, after === 'true' && key.length === 1, key);
    // 知識筆記的星號收藏出現原圖卡
    await page.evaluate(() => App.go('learn', { tab: 'notes' })); await page.waitForTimeout(600);
    const card = await page.evaluate(() => { const c = document.querySelector('.knowledge-collection .knowledge-card'); return c ? { txt: c.textContent.slice(0, 80), img: !!c.querySelector('img') } : null; });
    ok(`${vp.width} 知識筆記出現原圖卡`, card && card.img && card.txt.includes('鼻骨'), card);
    // 回清單取消
    await open();
    await page.locator('#lpBody .term-item').first().locator('.knowledge-star').click(); await page.waitForTimeout(200);
    const left = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem(SKEY('learn'))).starred || {}).length);
    ok(`${vp.width} 再按取消`, left === 0, left);
    // 在原圖鑑加星號 → 清單同步顯示 ★（用第 2 張圖的參照，測「別張圖已收藏」）
    const multi = await page.evaluate(() => {
      const it = [...document.querySelectorAll('#lpBody .term-item')].find(r => { const d = r.querySelector('.knowledge-star'); return d; });
      const pack = LEARN_UI.packs.find(p => p.id === 'eyelab-midterm'); const t = pack.lessons[0].steps.find(s => s.type === 'termlist');
      const x = t.groups.flatMap(g => g.items).find(x => x.views.filter(v => v.p).length >= 2); const v = x.views[1];
      const k = SKEY('learn'); const D = JSON.parse(localStorage.getItem(k)); D.starred = D.starred || {};
      D.starred[JSON.stringify(['term', v.p, v.l, v.img, v.name])] = { kind: 'term', p: v.p, l: v.l, img: v.img, name: v.name, at: Date.now() };
      localStorage.setItem(k, JSON.stringify(D)); return x.zh;
    });
    await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await open();
    const shown = await page.evaluate(zh => { const r = [...document.querySelectorAll('#lpBody .term-item')].find(r => r.querySelector('.term-row span').textContent.includes(zh)); return r.querySelector('.knowledge-star').getAttribute('aria-pressed'); }, multi);
    ok(`${vp.width} 別張圖已加星號 → 清單顯示 ★（${multi}）`, shown === 'true', shown);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(`${vp.width} 無橫向捲動`, sw <= 1, sw);
    ok(`${vp.width} 無頁面錯誤`, !errs.length, errs);
    await page.evaluate(s => { localStorage.clear(); const o = JSON.parse(s); for (const k in o) localStorage.setItem(k, o[k]); }, backup);
    await ctx.close();
  }
  await b.close();
  R.forEach(r => console.log(r.pass ? 'PASS' : 'FAIL', r.name, r.pass ? '' : JSON.stringify(r.info)));
  console.log(`${R.filter(r => r.pass).length}/${R.length}`);
})();
