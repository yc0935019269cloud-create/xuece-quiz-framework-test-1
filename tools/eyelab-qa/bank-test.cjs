// 跑台題庫：題目載入、圖檔存在、寫法判定（中文＋英文一起寫、只寫一種、別名）
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..'); const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
(async () => {
  const b = await chromium.launch({ channel: 'msedge', headless: true }); const page = await (await b.newContext()).newPage();
  await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
  await page.goto(URL); await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
  const r = await page.evaluate(() => {
    const qs = Object.values(Store.Q).filter(q => /^eyelab-(vp|orbit|blood|m-)/.test(q.exam || ''));
    const sets = [...new Set(qs.map(q => q.exam))];
    const ok = (a, ans) => U.sameAns(a, ans);
    return { n: qs.length, sets: sets.length, imgs: qs.map(q => [].concat(q.img || q.imgs || [])[0]),
      t1: ok('視神經 optic nerve', '視神經 / optic nerve'), t2: ok('視神經／optic nerve', '視神經 / optic nerve'), t3: ok('optic nerve 視神經', '視神經 / optic nerve'), t4: ok('視神經', '視神經 / optic nerve') };
  });
  const miss = r.imgs.filter(f => !f || !fs.existsSync(path.join(ROOT, f)));
  console.log(JSON.stringify({ questions: r.n, sets: r.sets, missingImg: miss.length, '中英一起寫': r.t1, '全形斜線': r.t2, '英文在前': r.t3, '只寫中文': r.t4 }));
  await b.close();
})();
