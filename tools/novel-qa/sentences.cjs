// 連載小說逐句朗讀 QA：每頁句子對位率、念到的句子亮起、點句子選取／再點取消、選取後從那句念、
// 念的時候點句子直接跳、底線名詞點一下開說明、同句其他文字可選取、亮起的句子跟著捲進畫面、一般單元名詞照舊點開。
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/novel-qa/sentences.cjs [override.json]
// override.json（測試用）：{ "單元/課/頁": { f, d, s } } 會蓋過 js/novel-audio-data.js 的同名頁。
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const OVR = process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8')) : null;
const results = [];
const ok = (c, msg) => { results.push({ ok: !!c, msg }); console.log((c ? 'PASS ' : 'FAIL ') + msg); };
(async () => {
  const b = await chromium.launch({ channel: 'msedge', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1100, height: 900 } : { width: 390, height: 844 }, hasTouch: mode === 'mobile' });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
    await page.goto(URL);
    await page.addStyleTag({ content: '* { scroll-behavior: auto !important; }' });
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(o => { try { VOL.set('muted', true); } catch (e) {} if (o) Object.assign(window.NOVEL_AUDIO, o); }, OVR);
    const packs = await page.evaluate(() => LEARN_UI.packs.filter(x => x.style === 'novel').map(p => ({ id: p.id, lids: p.lessons.map(l => l.id), n: p.lessons.map(l => l.steps.length) })));

    // 1. 每一頁的句子都對得到頁面文字（有時間資料的頁面）
    let pages = 0, low = [];
    for (const pk of packs) for (let li = 0; li < pk.lids.length; li++) {
      const has = await page.evaluate(k => (window.NOVEL_AUDIO[k] || {}).s && window.NOVEL_AUDIO[k].s.length, `${pk.id}/${pk.lids[li]}/0`);
      if (!has) continue;
      await page.evaluate(id => App.go('learn', { pack: id }), pk.id);
      await page.click(`[data-play="${li}"]`);
      for (let si = 0; si < pk.n[li]; si++) {
        await page.waitForSelector('#nvAudio');
        const m = await page.evaluate(() => [NOVEL_AUDIO_UI.mapped, NOVEL_AUDIO_UI.total, NOVEL_AUDIO_UI.key]);
        if (m[1]) { pages++; if (m[0] < m[1] - 1) low.push(`${m[2]} ${m[0]}/${m[1]}`); }
        if (si < pk.n[li] - 1) { await page.click('#lpNext'); await page.waitForFunction(i => LEARN_UI.curPage().i === i, si + 1); }
      }
      await page.click('#lpExit');
      if (mode === 'mobile') break;   // 手機只抽第一章
    }
    ok(pages > 0 && low.length === 0, `${mode} 句子對位：${pages} 頁、每頁最多一句對不到（章名）${low.length ? '；偏低：' + low.join('，') : ''}`);

    const pk = packs[0];
    await page.evaluate(id => App.go('learn', { pack: id }), pk.id);
    await page.click('[data-play="0"]');
    await page.waitForSelector('#lpPips i');
    if (await page.evaluate(() => LEARN_UI.curPage().i !== 0)) { await page.click('#lpPips i[data-i="0"]'); await page.waitForFunction(() => LEARN_UI.curPage().i === 0); }
    await page.waitForSelector('#nvAudio');
    const clickSent = async i => {
      const pt = await page.evaluate(i => {
        const r = NOVEL_AUDIO_UI.rangeOf(i); if (!r) return null;
        r.startContainer.parentElement.scrollIntoView({ block: 'center' });
        const b = r.getClientRects()[0]; return b ? [b.left + Math.min(b.width / 2, 12), b.top + b.height / 2] : null;
      }, i);
      if (!pt) return false;
      await page.mouse.click(pt[0], pt[1]);
      return true;
    };
    const st = () => page.evaluate(() => ({ now: NOVEL_AUDIO_UI.now, sel: NOVEL_AUDIO_UI.sel, t: NOVEL_AUDIO_UI.audio.currentTime, paused: NOVEL_AUDIO_UI.audio.paused, hNow: CSS.highlights.has('nv-now'), hSel: CSS.highlights.has('nv-sel'), btn: document.querySelector('#nvAudio [data-nv="play"]').textContent, pop: !!document.querySelector('.gl-pop') }));

    // 2. 播放時念到的句子亮起
    await page.click('#nvAudio [data-nv="play"]');
    await page.waitForFunction(() => NOVEL_AUDIO_UI.now >= 1 && !NOVEL_AUDIO_UI.audio.paused, null, { timeout: 15000 }).catch(() => {});
    let s = await st();
    ok(s.now >= 1 && s.hNow, `${mode} 播放時念到的句子亮起（第 ${s.now} 句）`);
    const sents = await page.evaluate(() => NOVEL_AUDIO[NOVEL_AUDIO_UI.key].s);
    await page.evaluate(t => { NOVEL_AUDIO_UI.audio.currentTime = t; }, sents[10][0] + 0.2);
    await page.waitForFunction(() => NOVEL_AUDIO_UI.now === 10, null, { timeout: 5000 }).catch(() => {});
    ok((await st()).now === 10, `${mode} 進度跳到第 10 句時亮起第 10 句`);
    const hlText = await page.evaluate(() => { const h = CSS.highlights.get('nv-now'); const r = h && [...h][0]; return r ? r.toString() : ''; });
    const norm = x => x.replace(/[^\p{L}\p{N}]/gu, '');
    ok(norm(hlText).includes(norm(sents[10][2])), `${mode} 亮起的文字就是正在念的那一句`);
    // 3. 念的時候點句子直接跳過去
    await clickSent(20);
    await page.waitForTimeout(300);
    s = await st();
    ok(s.now === 20 && Math.abs(s.t - sents[20][0]) < 1.5 && !s.paused, `${mode} 念的時候點第 20 句會跳過去念 (now ${s.now}, t ${s.t.toFixed(1)})`);
    // 4. 暫停後點句子是選取，再點一次取消
    await page.click('#nvAudio [data-nv="play"]');
    await clickSent(25);
    s = await st();
    ok(s.sel === 25 && s.hSel && /選取/.test(s.btn), `${mode} 暫停時點句子＝選取（按鈕變「從選取的句子念」）`);
    await clickSent(25);
    s = await st();
    ok(s.sel === -1 && !s.hSel, `${mode} 再點一次同一句＝取消選取`);
    // 5. 選取後按播放從那句開始念
    await clickSent(30);
    await page.click('#nvAudio [data-nv="play"]');
    await page.waitForTimeout(400);
    s = await st();
    ok(!s.paused && s.now === 30 && Math.abs(s.t - sents[30][0]) < 1.5 && s.sel === -1, `${mode} 選取後按播放從那句開始念 (now ${s.now})`);
    // 6. 亮起的句子跟著捲進畫面
    await page.evaluate(() => scrollTo(0, 0));
    const lastI = sents.length - 2;
    await page.evaluate(t => { NOVEL_AUDIO_UI.audio.currentTime = t; }, sents[lastI][0] + 0.1);
    await page.waitForTimeout(1200);
    const vis = await page.evaluate(() => { const h = CSS.highlights.get('nv-now'); const r = h && [...h][0]; if (!r) return false; const b = r.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight; });
    ok(vis, `${mode} 念到後面時自動捲到亮起的句子`);
    await page.click('#nvAudio [data-nv="play"]');
    // 7. 底線名詞優先開說明；同一句的普通文字仍可選取
    const sentence = await page.evaluate(() => {
      for (const g of document.querySelectorAll('#lpBody .gl')) for (let i = 0; i < NOVEL_AUDIO_UI.total; i++) {
        const r = NOVEL_AUDIO_UI.rangeOf(i);
        if (r && r.intersectsNode(g)) { g.dataset.qaTerm = 'yes'; return i; }
      }
      return -1;
    });
    const gl = page.locator('[data-qa-term=yes]');
    if (await gl.count()) {
      await gl.click();
      s = await st();
      ok(s.pop && s.sel === -1, `${mode} 點底線名詞開說明，且不選取句子`);
      await page.keyboard.press('Escape');
      const pt = await page.evaluate(i => {
        const r = NOVEL_AUDIO_UI.rangeOf(i); if (!r) return null;
        const walker = document.createTreeWalker(document.querySelector('#lpBody'), NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const n = walker.currentNode;
          if (n.parentElement.closest('.gl, #nvAudio') || !r.intersectsNode(n)) continue;
          for (let j = 0; j < n.length; j++) {
            const c = document.createRange(); c.setStart(n, j); c.setEnd(n, j + 1);
            if (c.compareBoundaryPoints(Range.START_TO_START, r) < 0 || c.compareBoundaryPoints(Range.END_TO_END, r) > 0 || !/[^\s]/.test(n.data[j])) continue;
            n.parentElement.scrollIntoView({ block: 'center' });
            const b = c.getBoundingClientRect(); if (b.width && b.height) return [b.left + b.width / 2, b.top + b.height / 2];
          }
        }
        return null;
      }, sentence);
      if (pt) await page.mouse.click(...pt);
      s = await st();
      ok(sentence >= 0 && pt && s.sel === sentence && s.hSel && !s.pop, `${mode} 點同句普通文字選取句子 (sentence ${sentence}, pt ${pt}, sel ${s.sel}, pop ${s.pop})`);
    } else ok(false, `${mode} 第一頁找不到底線名詞`);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${mode} 沒有橫向捲動`);
    await page.screenshot({ path: path.join(ROOT, `output/playwright/novel-sentences-${mode}.png`) });
    // 8. 一般單元：點名詞照舊開說明
    await page.click('#lpExit');
    const other = await page.evaluate(() => { const p = LEARN_UI.packs.find(x => x.style !== 'novel' && x.subject === 'eye_ans' && x.id.startsWith('blood')); return p ? p.id : LEARN_UI.packs.find(x => x.style !== 'novel' && x.subject === 'eye_ans').id; });
    await page.evaluate(id => App.go('learn', { pack: id }), other);
    await page.click('[data-play="0"]'); await page.waitForSelector('#lpBody');
    let found = false;
    for (let k = 0; k < 8 && !found; k++) {
      const g2 = page.locator('#lpBody .gl').first();
      if (await g2.count()) { found = true; await g2.scrollIntoViewIfNeeded(); await page.waitForTimeout(600); await g2.click(); await page.waitForTimeout(200); ok(await page.evaluate(() => !!document.querySelector('.gl-pop')), `${mode} 一般單元點名詞照舊開說明`); }
      else { const nb = await page.$('#lpNext:not([disabled])'); if (!nb) break; await nb.click(); await page.waitForTimeout(150); }
    }
    if (!found) console.log(`(skip) ${mode} 一般單元前幾頁沒有底線名詞`);
    ok(errs.length === 0, `${mode} 沒有頁面錯誤 ${errs.join(' | ')}`);
    await ctx.close();
  }
  await b.close();
  const pass = results.filter(r => r.ok).length;
  console.log(`${pass}/${results.length} passed`);
})();
