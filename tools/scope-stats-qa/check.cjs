// 遠征選題介面的範圍統計（已刷／未刷題數、題型數）檢查：headless Edge、file://、獨立 context，測前備份測後還原 localStorage。
// 用法（PowerShell）：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/scope-stats-qa/check.cjs
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '../..'), OUT = path.join(ROOT, 'output/playwright');
fs.mkdirSync(OUT, { recursive: true });
const results = []; const ok = (name, cond, extra) => { results.push({ name, pass: !!cond, extra }); console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : ' ' + JSON.stringify(extra))); };
(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true });
  const errors = [];
  for (const width of [1100, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } }), page = await ctx.newPage();
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(url.pathToFileURL(path.join(ROOT, 'index.html')).href);
    await page.waitForFunction(() => typeof Screens !== 'undefined' && typeof App !== 'undefined');
    const backup = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
    try {
      // 找一個有同類題分組的題本，只選它，方便核對數字
      const pick = await page.evaluate(() => {
        const P = QB.patterns || {}, by = {};
        for (const id in P) { const q = Store.Q[id]; if (q) (by[q.exam] = by[q.exam] || []).push(id); }
        const exam = Object.keys(by).sort((a, b) => by[b].length - by[a].length)[0];
        return { exam, subj: Store.EX[exam].subj };
      });
      await page.evaluate(() => App.go('free'));
      await page.waitForSelector('#cnt');
      const before = await page.textContent('#cnt');
      ok(`[${width}] 自由遠征一打開就顯示已刷／未刷與題型`, /已刷 \d+ 題・未刷 \d+ 題｜題型 \d+ 種：已刷 \d+・未刷 \d+/.test(before), before);
      // 只勾這一本題本
      await page.evaluate(p => { const c = document.querySelector(`#fy .chip[data-v="${p.exam}"]`); if (c) c.click(); else { const d = document.querySelector(`#fy details`); d.open = true; } }, pick);
      await page.evaluate(p => { const st = document.querySelector(`#fy .chip[data-v="${p.exam}"]`); if (st && !st.classList.contains('on')) st.click(); }, pick);
      const expect = await page.evaluate(p => {
        const types = ['single', 'multi', 'fill'];
        const list = Store.filter({ subjects: Object.keys(C.SUBJECTS), exams: [p.exam], types });
        const seen = Store.typesAnswered(), ks = new Set(list.map(q => Store.typeKey(q)));
        return { n: list.length, done: list.filter(q => Store.qs[q.id]?.a).length, types: ks.size, tDone: [...ks].filter(k => seen.has(k)).length, ids: list.map(q => q.id) };
      }, pick);
      const t1 = await page.textContent('#cnt');
      ok(`[${width}] 只選一本題本：題數、已刷、題型數與 Store 計算一致`, t1.includes(`符合條件：${expect.n} 題`) && t1.includes(`已刷 ${expect.done} 題・未刷 ${expect.n - expect.done} 題`) && t1.includes(`題型 ${expect.types} 種：已刷 ${expect.tDone}・未刷 ${expect.types - expect.tDone}`), { t1, expect });
      // 作答同一組裡的一題：已刷題數 +1，該組（整個題型）算刷過
      const grp = await page.evaluate(ids => {
        const P = QB.patterns || {}, by = {};
        ids.forEach(id => { if (P[id]) (by[P[id]] = by[P[id]] || []).push(id); });
        const g = Object.values(by).find(a => a.length >= 2 && a.every(id => !Store.qs[id]?.a));
        if (!g) return null;
        Store.record(g[0], true); return { g: g.length };
      }, expect.ids);
      await page.evaluate(() => document.querySelector('#ft .chip[data-v="multi"]').click());
      await page.evaluate(() => document.querySelector('#ft .chip[data-v="multi"]').click());   // 觸發重算（點兩次＝回原狀）
      const t2 = await page.textContent('#cnt');
      ok(`[${width}] 作答同類題組的一題：已刷 +1 題、題型已刷 +1 種（同組其他題不重複算）`, grp && t2.includes(`已刷 ${expect.done + 1} 題`) && t2.includes(`已刷 ${expect.tDone + 1}・未刷 ${expect.types - expect.tDone - 1}`), { t2, grp });
      // 沒有分組的範圍：註明每題各算一型
      const noGroup = await page.evaluate(() => { const P = QB.patterns || {}; const e = QB.exams.find(e => e.count && !QB.questions.some(q => q.exam === e.id && P[q.id])); return e && e.id; });
      if (noGroup) {
        await page.evaluate(() => { const c = document.querySelector('#fy [data-clear]'); if (c) c.click(); });
        await page.evaluate(id => { const c = document.querySelector(`#fy .chip[data-v="${id}"]`); c && c.click(); }, noGroup);
        const t3 = await page.textContent('#cnt');
        ok(`[${width}] 沒有同類題分組的題本：註明每題各算一型`, /每題各算一型/.test(t3) || /符合條件：0 題/.test(t3), t3);
      }
      await page.screenshot({ path: path.join(OUT, `scope-stats-free-${width}.png`) });
      // 深淵遠征與冒險地圖出發視窗
      await page.evaluate(() => App.go('abyss'));
      await page.waitForSelector('#cnt');
      ok(`[${width}] 深淵遠征題池也顯示已刷／未刷與題型`, /題池：\d+ 題[\s\S]*已刷 \d+ 題・未刷 \d+ 題｜題型 \d+ 種/.test(await page.textContent('#cnt')));
      await page.screenshot({ path: path.join(OUT, `scope-stats-abyss-${width}.png`) });
      await page.evaluate(() => App.go('map'));
      await page.evaluate(() => { const b = document.querySelector('[data-exam], .zone, .map-node, .map-zone, [data-zone]'); b && b.click(); });
      const mapTxt = await page.waitForSelector('.modal-bg #cnt', { timeout: 4000 }).then(el => el.textContent()).catch(() => null);
      ok(`[${width}] 冒險地圖出發視窗也顯示（找得到視窗時）`, mapTxt === null || /已刷 \d+ 題・未刷 \d+ 題/.test(mapTxt) || /符合條件：0 題/.test(mapTxt), mapTxt);
      ok(`[${width}] 沒有橫向捲動`, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
    } finally {
      await page.evaluate(b => { localStorage.clear(); for (const [k, v] of Object.entries(b)) localStorage.setItem(k, v); }, backup);
      ok(`[${width}] localStorage 已還原`, await page.evaluate(b => localStorage.length === Object.keys(b).length && Object.keys(b).every(k => localStorage.getItem(k) === b[k]), backup));
      await ctx.close();
    }
  }
  ok('沒有頁面錯誤', !errors.length, errors);
  await browser.close();
  const pass = results.filter(r => r.pass).length;
  fs.mkdirSync(path.join(ROOT, 'docs/scope-stats'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs/scope-stats/qa.json'), JSON.stringify({ at: new Date().toISOString(), pass, total: results.length, results }, null, 1));
  console.log(`\n${pass}/${results.length} passed`);
})();
