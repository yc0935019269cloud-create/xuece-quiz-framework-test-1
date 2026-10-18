// 易讀版改寫的整體檢查：115 大二上眼解剖生理學 11 個單元，每一步在桌機與 390px 各渲染一次。
// 檢查：頁面錯誤、空白、排版語法外露（[[img]]、:::、{o: 等）、圖片沒載入、手機橫向捲動。
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/learn-redo/sweep.cjs [unitId ...]
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const UNITS = process.argv.slice(2).length ? process.argv.slice(2) : ['blood-vessels', 'blood-ciliary', 'blood-retina', 'ans-basics', 'ans-pathways', 'ans-trigeminal', 'ans-reflex', 'ans-clinical', 'cornea-general', 'cornea-layers', 'cornea-supply'];
const LEAK = /\[\[img\]\]|^\s*:::|\{[obgrpy]:|\[!(big|tip|warn|why|key|note|exam)\]|==[^=\s]/m;
(async () => {
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true });
  const problems = []; let n = 0; const errs = [];
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1000, height: 900 } : { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(`${mode} ${String(e)}`));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    const key = await page.evaluate(() => SKEY('learn'));
    for (const unit of UNITS) {
      const plan = await page.evaluate(id => { const p = LEARN_UI.packs.find(x => x.id === id); return p && p.lessons.map((l, li) => ({ li, lid: l.id, n: l.steps.length, t: l.steps.map(s => s.type) })); }, unit);
      if (!plan) { problems.push('找不到單元 ' + unit); continue; }
      for (const L of plan) for (let si = 0; si < L.n; si++) {
        await page.evaluate(({ k, id, lid, si }) => { const D = { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + lid] = { i: si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, id: unit, lid: L.lid, si });
        await page.evaluate(id => App.go('learn', { pack: id }), unit);
        await page.click(`[data-play="${L.li}"]`);
        await page.waitForTimeout(L.t[si] === 'card' ? 250 : 80);
        const r = await page.evaluate(() => {
          const body = document.querySelector('#lpBody'); const imgs = [...document.querySelectorAll('#lpBody img.lp-img')];
          return { txt: body ? body.innerText : '', bad: imgs.filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src')), sw: document.querySelector('#lpBody pre') ? 0 : document.documentElement.scrollWidth - innerWidth };
        });
        n++;
        const tag = `${mode} ${unit}/${L.lid}#${si}(${L.t[si]})`;
        if (r.txt.trim().length < 5) problems.push(tag + ' 空白');
        const m = r.txt.match(LEAK); if (m) problems.push(`${tag} 語法外露：${m[0]}`);
        if (r.bad.length) problems.push(`${tag} 圖沒載入 ${r.bad.join(',')}`);
        if (r.sw > 1) problems.push(`${tag} 橫向捲動 ${r.sw}px`);
      }
    }
    await ctx.close();
  }
  console.log(JSON.stringify({ steps: n, problems: problems.length, errors: errs.length }));
  if (problems.length) console.log(problems.slice(0, 40).join('\n'));
  if (errs.length) console.log(errs.slice(0, 10).join('\n'));
  await b.close();
})();
