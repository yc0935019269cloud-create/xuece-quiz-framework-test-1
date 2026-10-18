// 學習卡配圖 QA：眼球血液供應 3 單元＋眼眶骨／視覺路徑 2 課程的講解卡，每張配圖卡渲染後檢查
//   圖檔存在並載入、張數正確、有「看圖」說明（或新版排版的「一句話」提示框 .co-big）、有圖片來源、桌機與 390px 沒有橫向捲動；另存內頸動脈四分支卡的截圖。
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/figs-qa/check.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const UNITS = ['blood-vessels', 'blood-ciliary', 'blood-retina', 'eye-anat-orbit-course', 'eye-anat-visual-path-course', 'ans-clinical', 'ans-pathways', 'ans-reflex', 'ans-trigeminal', 'cornea-general', 'cornea-layers', 'cornea-supply'];
const problems = []; let checked = 0;
(async () => {
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, executablePath: process.env.PW_EXE || undefined });
  const errs = [];
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1000, height: 900 } : { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e)));
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
    const key = await page.evaluate(() => SKEY('learn'));
    for (const id of UNITS) {
      const cards = await page.evaluate((id) => {
        const p = LEARN_UI.packs.find(x => x.id === id); const out = [];
        if (!p) return null;
        p.lessons.forEach((l, li) => l.steps.forEach((s, si) => { if (s.type === 'card' && s.img && String([].concat(s.img)[0]).startsWith('img/eye-anat-fig/')) out.push({ li, lid: l.id, si, title: s.title, n: [].concat(s.img).length, src: !!s.img_source }); }));
        return out;
      }, id);
      if (!cards || !cards.length) { problems.push('找不到單元或沒有配圖卡 ' + id); continue; }
      for (const c of cards) {
        await page.evaluate(({ k, id, c }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + c.lid] = { i: c.si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, id, c });
        await page.reload();
        await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
        await page.evaluate((id) => App.go('learn', { pack: id }), id);
        const tag = `${mode} ${id}/${c.lid}#${c.si} ${c.title}`;
        try {
          await page.click(`[data-play="${c.li}"]`);
          await page.waitForSelector('#lpBody .lp-img', { timeout: 4000 });
          await page.waitForTimeout(250);
          const info = await page.evaluate(() => {
            const imgs = [...document.querySelectorAll('#lpBody .lp-img')];
            return { n: imgs.length, loaded: imgs.every(i => i.complete && i.naturalWidth > 0), cap: !!document.querySelector('#lpBody blockquote, #lpBody .co-big'), src: !!document.querySelector('#lpBody .lp-src'), sw: document.querySelector('#lpBody pre') ? 0 : document.documentElement.scrollWidth, iw: window.innerWidth, minW: Math.min(...imgs.map(i => i.getBoundingClientRect().width)) };
          });
          checked++;
          if (info.n !== c.n) problems.push(`${tag} 圖張數 ${info.n}/${c.n}`);
          if (!info.loaded) problems.push(`${tag} 圖片沒載入`);
          if (!info.cap) problems.push(`${tag} 缺看圖說明`);
          if (!info.src) problems.push(`${tag} 缺圖片來源`);
          if (info.sw > info.iw + 1) problems.push(`${tag} 橫向捲動 ${info.sw}>${info.iw}`);
          if (id === 'blood-vessels' && c.lid === 'l1' && c.si === 1) await page.screenshot({ path: path.join(ROOT, 'output', 'playwright', `figs-ica-${mode}.png`), fullPage: true });
        } catch (e) { problems.push(`${tag} ${String(e).slice(0, 80)}`); }
      }
    }
    await ctx.close();
  }
  if (errs.length) problems.push('頁面錯誤 ' + errs.slice(0, 3).join(' | '));
  console.log(JSON.stringify({ checked, problems: problems.length }), problems);
  await b.close();
  process.exit(problems.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
