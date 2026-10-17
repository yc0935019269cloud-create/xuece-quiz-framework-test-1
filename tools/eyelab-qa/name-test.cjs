// 看圖寫名稱題（kind: name）互動測試：答對、答錯→提示→看答案、Enter 跳格
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  const out = [];
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1100, height: 900 } : { width: 390, height: 844 } });
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', e => errs.push(String(e)));
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    const key = await page.evaluate(() => SKEY('learn'));
    await page.evaluate(({ k }) => { const D = { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les['eyelab-vp/l2'] = { i: 3, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key });
    await page.reload(); await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => App.go('learn', { pack: 'eyelab-vp' }));
    await page.click('[data-play="1"]'); await page.waitForTimeout(500);
    const cur = await page.evaluate(({ k }) => { const D = JSON.parse(localStorage.getItem(k)); const pk = D.les['eyelab-vp/l2'].run.pk[3]; const s = LEARN_UI.packs.find(p => p.id === 'eyelab-vp').lessons[1].steps[3]; const c = s.checks[pk.items[0].c]; return { zh: c.zh, en: c.en }; }, { k: key });
    // 1) 答對（英文大小寫、撇號不同也要算對）
    await page.fill('[data-k="zh"]', cur.zh[0]);
    await page.fill('[data-k="en"]', cur.en[0].toUpperCase().replace("'", '’'));
    await page.click('.lc-send'); await page.waitForTimeout(200);
    out.push([mode, '答對判定', await page.evaluate(() => /答對/.test(document.querySelector('.lc-fb').innerText))]);
    await page.screenshot({ path: path.join(ROOT, 'output', 'playwright', `eyelab-vp-name-ok-${mode}.png`) });
    // 2) 下一題：答錯 → 提示 → 看答案
    await page.click('#lpNext').catch(() => {}); await page.keyboard.press('Enter').catch(() => {});
    await page.waitForTimeout(500);
    const has = await page.$('[data-k="zh"]');
    if (has) {
      await page.fill('[data-k="zh"]', '亂寫'); await page.fill('[data-k="en"]', 'xxx'); await page.click('.lc-send'); await page.waitForTimeout(200);
      out.push([mode, '答錯先給提示', await page.evaluate(() => /提示/.test(document.querySelector('.lc-fb').innerText))]);
      await page.click('.lc-giveup'); await page.waitForTimeout(200);
      out.push([mode, '看答案顯示中英文', await page.evaluate(() => !!document.querySelector('.lc-key') && /[A-Za-z]/.test(document.querySelector('.lc-key').innerText))]);
      await page.screenshot({ path: path.join(ROOT, 'output', 'playwright', `eyelab-vp-name-reveal-${mode}.png`) });
    } else out.push([mode, '下一題', false]);
    out.push([mode, '無頁面錯誤', errs.length === 0]);
    await ctx.close();
  }
  console.log(out.map(x => x.join(' ')).join('\n'));
  await b.close();
  process.exit(out.every(x => x[2]) ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
