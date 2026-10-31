// 連載小說朗讀 QA：每頁有朗讀列與對應音檔、按下會播放、速度設定、念完自動翻頁、最後一頁接下一章、
// 離開課程會停、390px 無橫向捲動、無頁面錯誤。一次性 context，不碰使用者存檔。
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/novel-qa/audio.cjs
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const results = [];
const ok = (c, msg) => { results.push({ ok: !!c, msg }); console.log((c ? 'PASS ' : 'FAIL ') + msg); };
(async () => {
  const b = await chromium.launch({ channel: 'msedge', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1100, height: 900 } : { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 300)));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
    const pk = await page.evaluate(() => { const p = LEARN_UI.packs.find(x => x.style === 'novel'); return { id: p.id, n: p.lessons.map(l => l.steps.length), lids: p.lessons.map(l => l.id) }; });
    const manifest = await page.evaluate(() => window.NOVEL_AUDIO || {});
    // 每一頁都有音檔且檔案存在
    let missing = [];
    pk.lids.forEach((lid, li) => { for (let si = 0; si < pk.n[li]; si++) { const it = manifest[`${pk.id}/${lid}/${si}`]; if (!it || !fs.existsSync(path.join(ROOT, it.f))) missing.push(`${lid}#${si}`); } });
    ok(missing.length === 0, `${mode} 每一頁都有朗讀音檔（缺 ${missing.join(',') || '0'}）`);

    await page.evaluate(id => App.go('learn', { pack: id }), pk.id);
    await page.click('[data-play="0"]');
    await page.waitForSelector('#nvAudio');
    const k0 = await page.evaluate(() => NOVEL_AUDIO_UI.key);
    ok(k0 === `${pk.id}/${pk.lids[0]}/0`, `${mode} 第一頁朗讀列對應正確的音檔 (${k0})`);
    await page.click('#nvAudio [data-nv="play"]');
    await page.waitForFunction(() => NOVEL_AUDIO_UI.audio.currentTime > 0.3, null, { timeout: 15000 }).catch(() => {});
    ok(await page.evaluate(() => NOVEL_AUDIO_UI.audio.currentTime > 0.3), `${mode} 按「朗讀本頁」會播放`);
    ok(await page.evaluate(() => /暫停/.test(document.querySelector('#nvAudio [data-nv="play"]').textContent)), `${mode} 播放中按鈕顯示暫停`);
    await page.selectOption('#nvAudio .nv-rate', '1.4');
    ok(await page.evaluate(() => NOVEL_AUDIO_UI.audio.playbackRate === 1.4 && JSON.parse(localStorage.getItem('novelAudio')).rate === 1.4), `${mode} 速度 1.4× 生效並記住`);
    // 念完自動翻頁
    await page.evaluate(() => { const a = NOVEL_AUDIO_UI.audio; a.currentTime = a.duration - 0.2; });
    await page.waitForFunction(k => LEARN_UI.curPage() && LEARN_UI.curPage().i === 1, null, { timeout: 10000 }).catch(() => {});
    ok(await page.evaluate(() => LEARN_UI.curPage().i === 1), `${mode} 念完自動翻到下一頁`);
    await page.waitForFunction(() => NOVEL_AUDIO_UI.audio.currentTime > 0.3 && /\/1$/.test(NOVEL_AUDIO_UI.key), null, { timeout: 15000 }).catch(() => {});
    ok(await page.evaluate(() => /\/1$/.test(NOVEL_AUDIO_UI.key) && !NOVEL_AUDIO_UI.audio.paused), `${mode} 下一頁接著念`);
    ok(await page.evaluate(() => NOVEL_AUDIO_UI.audio.playbackRate === 1.4), `${mode} 換頁後速度不變`);
    // 跳到本章最後一頁，念完接下一章
    for (let si = 1; si < pk.n[0] - 1; si++) { await page.click('#lpNext'); await page.waitForTimeout(150); }
    await page.waitForFunction(n => LEARN_UI.curPage().i === n - 1, pk.n[0]);
    await page.waitForFunction(() => NOVEL_AUDIO_UI.audio.duration > 1 && !NOVEL_AUDIO_UI.audio.paused, null, { timeout: 15000 }).catch(() => {});
    await page.evaluate(() => { const a = NOVEL_AUDIO_UI.audio; a.currentTime = a.duration - 0.2; });
    await page.waitForFunction(l => LEARN_UI.curPage() && LEARN_UI.curPage().l === l, pk.lids[1], { timeout: 15000 }).catch(() => {});
    ok(await page.evaluate(l => LEARN_UI.curPage() && LEARN_UI.curPage().l === l && LEARN_UI.curPage().i === 0, pk.lids[1]), `${mode} 一章念完自動接下一章`);
    await page.waitForFunction(() => !NOVEL_AUDIO_UI.audio.paused && NOVEL_AUDIO_UI.audio.currentTime > 0.3, null, { timeout: 15000 }).catch(() => {});
    ok(await page.evaluate(l => NOVEL_AUDIO_UI.key.endsWith(`/${l}/0`) && !NOVEL_AUDIO_UI.audio.paused, pk.lids[1]), `${mode} 下一章第一頁接著念`);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${mode} 沒有橫向捲動`);
    if (mode === 'mobile') await page.screenshot({ path: path.join(ROOT, 'output/playwright/novel-audio-mobile.png') });
    else await page.screenshot({ path: path.join(ROOT, 'output/playwright/novel-audio-desktop.png') });
    // 暫停、關掉自動翻頁
    await page.click('#nvAudio [data-nv="play"]');
    ok(await page.evaluate(() => NOVEL_AUDIO_UI.audio.paused), `${mode} 按暫停會停`);
    await page.click('#nvAudio .nv-auto input');
    await page.click('#nvAudio [data-nv="play"]');
    await page.evaluate(() => { const a = NOVEL_AUDIO_UI.audio; a.currentTime = a.duration - 0.2; });
    await page.waitForTimeout(1500);
    ok(await page.evaluate(() => LEARN_UI.curPage().i === 0), `${mode} 關掉自動翻頁就不翻頁`);
    // 離開課程會停
    await page.click('#nvAudio [data-nv="play"]');
    await page.click('#lpExit');
    await page.waitForTimeout(300);
    ok(await page.evaluate(() => NOVEL_AUDIO_UI.audio.paused), `${mode} 離開課程朗讀停止`);
    // 其他單元沒有朗讀列
    const other = await page.evaluate(() => LEARN_UI.packs.find(x => x.style !== 'novel' && x.subject === 'eye_ans').id);
    await page.evaluate(id => App.go('learn', { pack: id }), other);
    await page.click('[data-play="0"]'); await page.waitForSelector('#lpBody'); await page.waitForTimeout(200);
    ok(await page.evaluate(() => !document.getElementById('nvAudio')), `${mode} 一般單元沒有朗讀列`);
    ok(errs.length === 0, `${mode} 沒有頁面錯誤 ${errs.join(' | ')}`);
    await ctx.close();
  }
  await b.close();
  const pass = results.filter(r => r.ok).length;
  fs.mkdirSync(path.join(ROOT, 'docs/novel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs/novel/audio-qa.json'), JSON.stringify({ date: new Date().toISOString(), pass, total: results.length, results }, null, 1));
  console.log(`${pass}/${results.length} passed`);
})();
