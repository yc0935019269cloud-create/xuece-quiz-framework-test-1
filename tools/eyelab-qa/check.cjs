// 眼解剖實驗重做版（視覺路徑 eyelab-vp）QA：每一步渲染、圖片載入、圖解標記點、桌機與 390px 無橫向捲動；截圖幾個代表頁。
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/eyelab-qa/check.cjs [unitId]
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const UNIT = process.argv[2] || 'eyelab-vp';
const problems = []; let steps = 0;
(async () => {
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, executablePath: process.env.PW_EXE || undefined });
  const errs = [];
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1100, height: 900 } : { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e)));
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
    const key = await page.evaluate(() => SKEY('learn'));
    const plan = await page.evaluate((id) => { const p = LEARN_UI.packs.find(x => x.id === id); return p && p.lessons.map((l, li) => ({ li, lid: l.id, steps: l.steps.map(s => ({ t: s.type, n: s.img ? [].concat(s.img).length : 0 })) })); }, UNIT);
    if (!plan) { problems.push('找不到單元 ' + UNIT); break; }
    for (const L of plan) {
      for (let si = 0; si < L.steps.length; si++) {
        const st = L.steps[si];
        await page.evaluate(({ k, id, L, si }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + L.lid] = { i: si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, id: UNIT, L, si });
        await page.reload();
        await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
        await page.evaluate((id) => App.go('learn', { pack: id }), UNIT);
        const tag = `${mode} ${L.lid}#${si}(${st.t})`;
        try {
          await page.click(`[data-play="${L.li}"]`);
          await page.waitForTimeout(st.n || st.t === 'diagram' ? 500 : 120);
          const info = await page.evaluate(() => {
            const body = document.querySelector('#lpBody');
            const imgs = [...document.querySelectorAll('#lpBody img')];
            return { len: body ? body.innerText.length : 0, n: imgs.filter(i => i.classList.contains('lp-img')).length, bad: imgs.filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute('src')),
              pins: document.querySelectorAll('#lpBody .dg-pin').length, sw: document.querySelector('#lpBody pre') ? 0 : document.documentElement.scrollWidth, iw: innerWidth };
          });
          steps++;
          if (info.len < 5) problems.push(tag + ' 空白');
          if (st.t === 'card' && info.n !== st.n) problems.push(`${tag} 卡片圖 ${info.n}/${st.n}`);
          if (info.bad.length) problems.push(`${tag} 圖片沒載入 ${info.bad.join(',')}`);
          if (st.t === 'diagram' && !info.pins) problems.push(`${tag} 圖解沒有標記點`);
          if (info.sw > info.iw + 1) problems.push(`${tag} 橫向捲動 ${info.sw}>${info.iw}`);
          if (st.t === 'check' && st.n) {
            const qi = await page.evaluate(() => [...document.querySelectorAll('#lpBody .lc-img img')].every(i => i.complete && i.naturalWidth > 0) && !!document.querySelector('#lpBody .lc-img img'));
            if (!qi) problems.push(`${tag} 題目圖沒顯示`);
          }
          if (st.t === 'card') {
            // 名詞字源：卡片上要有可點的名詞；點了出現小視窗，點別處消失；按鈕裡不可以有 .gl
            const g = await page.evaluate(() => ({ n: document.querySelectorAll('#lpBody .gl').length, inBtn: document.querySelectorAll('#lpBody button .gl').length }));
            if (!g.n && st.n === 0) problems.push(`${tag} 沒有可點的名詞`);
            if (g.inBtn) problems.push(`${tag} 按鈕裡出現可點名詞`);
            if (g.n && L.lid === 'review' && si === 2) {
              await page.click('#lpBody .gl');
              await page.waitForTimeout(150);
              const open = await page.evaluate(() => { const p = document.querySelector('.gl-pop'); if (!p) return null; const r = p.getBoundingClientRect(); return { txt: p.innerText.slice(0, 80), inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight }; });
              if (!open) problems.push(`${tag} 點名詞沒有跳出小視窗`);
              else {
                if (!open.inView) problems.push(`${tag} 小視窗超出畫面`);
                await page.screenshot({ path: path.join(ROOT, 'output', 'playwright', `eyelab-vp-gloss-${mode}.png`) });
                await page.mouse.click(5, 300);
                await page.waitForTimeout(100);
                if (await page.$('.gl-pop')) problems.push(`${tag} 點別處小視窗沒消失`);
              }
            }
          }
          const shot = { 'l2#2': 'horiz', 'l2#3': 'qname', 'review#1': 'allfig', 'review#2': 'table' }[`${L.lid}#${si}`];
          if (shot) await page.screenshot({ path: path.join(ROOT, 'output', 'playwright', `eyelab-vp-${shot}-${mode}.png`), fullPage: true });
        } catch (e) { problems.push(`${tag} ${String(e).slice(0, 90)}`); }
      }
    }
    await ctx.close();
  }
  if (errs.length) problems.push('頁面錯誤 ' + errs.slice(0, 3).join(' | '));
  console.log(JSON.stringify({ unit: UNIT, steps, problems: problems.length }), problems.slice(0, 30));
  await b.close();
  process.exit(problems.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
