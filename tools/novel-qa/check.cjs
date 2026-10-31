// 連載小說《觀瞳記》QA：每章逐頁按「繼續」讀到完成畫面；calm 無戰鬥條、段首縮排、考點名詞每頁只標一次、
// 小說專用名詞（only: novel）在其他單元不標、桌機與 390px 無橫向捲動、無頁面錯誤。一次性 context，不碰使用者存檔。
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/novel-qa/check.cjs [截圖資料夾]
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const SHOT = process.argv[2];
const problems = []; let checks = 0;
const ok = (c, msg) => { checks++; if (!c) problems.push(msg); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_EXE || undefined, channel: process.env.PW_EXE ? undefined : 'msedge', args: ['--allow-file-access-from-files'] });
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1100, height: 900 } : { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 400)));
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} U.sleep = () => Promise.resolve(); });
    const packs = await page.evaluate(() => LEARN_UI.packs.filter(p => p.style === 'novel').map(p => ({ id: p.id, n: p.lessons.map(l => l.steps.length) })));
    ok(packs.length >= 1, `${mode} 找不到小說單元`);
    for (const pk of packs) {
      for (let li = 0; li < pk.n.length; li++) {
        await page.evaluate(id => App.go('learn', { pack: id }), pk.id);
        await page.click(`[data-play="${li}"]`);
        await page.waitForSelector('#lpBody');
        ok(await page.evaluate(() => document.querySelector('.lp').dataset.style === 'novel'), `${mode} ${pk.id} c${li + 1} 沒有 data-style`);
        ok(await page.evaluate(() => { const s = document.querySelector('#lbStage'); return !s || s.offsetParent === null; }), `${mode} ${pk.id} c${li + 1} 顯示了戰鬥條`);
        for (let si = 0; si < pk.n[li]; si++) {
          await page.waitForTimeout(120);
          const d = await page.evaluate(() => {
            const body = document.querySelector('#lpBody');
            const ids = [...body.querySelectorAll('.gl')].map(x => x.dataset.g);
            const p = body.querySelector('p');
            return { len: body.textContent.length, dup: ids.length - new Set(ids).size, gl: ids.length, indent: p ? getComputedStyle(p).textIndent : '', ov: document.documentElement.scrollWidth <= innerWidth + 1 };
          });
          ok(d.len > 500, `${mode} ${pk.id} c${li + 1}#${si} 內容太短 ${d.len}`);
          ok(d.dup === 0, `${mode} ${pk.id} c${li + 1}#${si} 名詞重複標 ${d.dup}`);
          ok(d.indent && d.indent !== '0px', `${mode} ${pk.id} c${li + 1}#${si} 沒有段首縮排`);
          ok(d.ov, `${mode} ${pk.id} c${li + 1}#${si} 橫向捲動`);
          if (SHOT && li === 0 && si === 0) await page.screenshot({ path: path.join(SHOT, `novel-${mode}-c1.png`) });
          await page.click('#lpNext');
        }
        await page.waitForTimeout(200);
        ok(await page.evaluate(() => !!document.querySelector('.lp-done') && document.querySelector('.lp-done').textContent.includes('讀完本章')), `${mode} ${pk.id} c${li + 1} 沒有完成畫面`);
      }
    }
    // 小說專用名詞不應在其他單元標底線
    await page.evaluate(() => App.go('learn', { pack: 'ans-basics' }));
    await page.click('[data-play="0"]'); await page.waitForSelector('#lpBody'); await page.waitForTimeout(300);
    const leak = await page.evaluate(() => [...document.querySelectorAll('#lpBody .gl')].map(x => x.dataset.g).filter(g => g.startsWith('nv-')));
    ok(!leak.length, `${mode} 小說名詞出現在 ans-basics：${leak}`);
    ok(!errs.length, `${mode} 頁面錯誤：${errs.join(' | ')}`);
    await ctx.close();
  }
  await b.close();
  console.log(`檢查 ${checks} 項，問題 ${problems.length} 個`);
  problems.forEach(p => console.log(' ✘ ' + p));
  process.exit(problems.length ? 1 : 0);
})();
