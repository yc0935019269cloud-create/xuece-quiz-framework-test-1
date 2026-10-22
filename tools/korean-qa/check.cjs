// 韓文字母單元 QA：6 課逐步渲染、calm 不顯示戰鬥條、字母卡牆 40 個字母逐一開啟（發音檔請求、示意圖載入）、上一個／下一個、
// 桌機與 390px 無橫向捲動、學習首頁／自由遠征頁不因新科目報錯。用一次性 context，不碰使用者存檔。
// 執行：PW_EXE=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) node tools/korean-qa/check.cjs [截圖資料夾]
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const SHOT = process.argv[2];
const PACK = 'korean-hangul-letters';
const problems = []; let checks = 0;
const ok = (c, msg) => { checks++; if (!c) problems.push(msg); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_EXE || undefined, channel: process.env.PW_EXE ? undefined : 'msedge', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1100, height: 900 } : { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = [], tts = [];
    page.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 400)));
    page.on('request', r => { if (/assets\/tts\/ko\//.test(r.url()) || /translate_tts/.test(r.url())) tts.push(r.url()); });
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
    await page.evaluate(() => App.go('learn'));
    await page.waitForTimeout(300);
    ok(await page.evaluate(() => document.querySelector('#screen').textContent.includes('韓文')), `${mode} 學習首頁沒有韓文`);
    const pk = await page.evaluate(id => { const p = LEARN_UI.packs.find(x => x.id === id); return p && p.lessons.map(l => l.steps.length); }, PACK);
    ok(pk && pk.length === 6, `${mode} 找不到單元或課數不對`);
    for (let li = 0; li < pk.length; li++) {
      await page.evaluate(id => App.go('learn', { pack: id }), PACK);
      await page.click(`[data-play="${li}"]`);
      await page.waitForSelector('#lpBody');
      ok(await page.evaluate(() => { const s = document.querySelector('#lbStage'); return !s || s.offsetParent === null; }), `${mode} l${li + 1} 顯示了戰鬥條`);
      ok(await page.evaluate(() => document.querySelector('#lpBattle').hidden), `${mode} l${li + 1} 戰鬥按鈕沒隱藏`);
      for (let si = 0; si < pk[li]; si++) {
        await page.waitForTimeout(150);
        const tiles = await page.$$('#lpBody .kl-t');
        const imgs = await page.evaluate(() => [...document.querySelectorAll('#lpBody img')].map(i => i.complete && i.naturalWidth > 0));
        ok(imgs.every(Boolean), `${mode} l${li + 1}#${si} 圖片沒載入`);
        ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${mode} l${li + 1}#${si} 橫向捲動`);
        if (tiles.length) {
          if (li === 1 && SHOT) await page.screenshot({ path: path.join(SHOT, `korean-${mode}-grid.png`), fullPage: true });
          const n = tiles.length;
          tts.length = 0;
          await tiles[0].click();
          await page.waitForSelector('.kl-modal');
          for (let k = 0; k < n; k++) {
            await page.waitForTimeout(120);
            const d = await page.evaluate(() => {
              const m = document.querySelector('.kl-modal');
              const im = m.querySelector('.kl-img');
              return { big: m.querySelector('.kl-big').textContent, say: m.querySelectorAll('[data-say]').length, desc: m.querySelector('.kl-desc').textContent.length, img: !im || (im.complete && im.naturalWidth > 0), ov: m.scrollWidth <= m.clientWidth + 1 };
            });
            ok(d.say >= 1 && d.desc > 20 && d.img && d.ov, `${mode} l${li + 1} 字母 ${d.big} 內容/圖/版面問題 ${JSON.stringify(d)}`);
            if (li === 1 && k === 0 && SHOT) await page.screenshot({ path: path.join(SHOT, `korean-${mode}-g.png`) });
            if (li === 3 && k === 2 && SHOT) await page.screenshot({ path: path.join(SHOT, `korean-${mode}-a.png`) });
            if (k < n - 1) { if (k % 2) await page.keyboard.press('ArrowRight'); else await page.click('.kl-modal [data-nav="1"]'); }
          }
          ok(tts.length >= n, `${mode} l${li + 1} 發音請求 ${tts.length} < ${n}`);
          ok(tts.every(u => /assets\/tts\/ko\//.test(u)), `${mode} l${li + 1} 有字母沒用到本機音檔：${tts.filter(u => !/assets\/tts\/ko\//.test(u)).slice(0, 3)}`);
          await page.click('.kl-modal .close');
          ok(!(await page.$('.kl-modal')), `${mode} 視窗沒關`);
          if (li === 5) ok(n === 40, `${mode} 一覽不是 40 個字母（${n}）`);
        }
        const nb = await page.$('#lpNext');
        if (nb && si < pk[li] - 1) await nb.click();
      }
    }
    await page.evaluate(() => App.go('free'));
    await page.waitForTimeout(300);
    await page.evaluate(() => App.go('camp'));
    await page.waitForTimeout(200);
    ok(!errs.length, `${mode} 頁面錯誤：${errs.slice(0, 3).join(' | ')}`);
    await ctx.close();
  }
  await b.close();
  console.log(JSON.stringify({ checks, problems }, null, 1));
  process.exit(problems.length ? 1 : 0);
})();
