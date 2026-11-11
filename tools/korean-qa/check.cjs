// 韓文字母單元 QA：6 課逐步渲染、calm 不顯示戰鬥條、字母卡牆 40 個字母逐一開啟（發音檔請求、示意圖載入）、上一個／下一個、
// 桌機與 390px 無橫向捲動、學習首頁／自由遠征頁不因新科目報錯。用一次性 context，不碰使用者存檔。
// 執行：PW_EXE=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) node tools/korean-qa/check.cjs [截圖資料夾]
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const SHOT = process.argv[2];
const fs = require('fs');
if (SHOT) fs.mkdirSync(SHOT, { recursive: true });
const PACK = 'korean-hangul-letters';
const problems = []; let checks = 0;
const ok = (c, msg) => { checks++; if (!c) problems.push(msg); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_EXE || undefined, channel: process.env.PW_EXE ? undefined : 'msedge', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  for (const mode of ['desktop', 'mobile']) {
    const ctx = await b.newContext({ viewport: mode === 'desktop' ? { width: 1100, height: 900 } : { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      const NativeAudio = window.Audio; window.__koreanQAAudio = [];
      window.Audio = function (...args) { const a = new NativeAudio(...args); window.__koreanQAAudio.push(a); return a; };
      window.Audio.prototype = NativeAudio.prototype;
    });
    const errs = [], tts = [];
    page.on('pageerror', e => errs.push(String(e.stack || e).slice(0, 400)));
    page.on('request', r => { if (/assets\/tts\/ko\//.test(r.url()) || /translate_tts/.test(r.url())) tts.push(r.url()); });
    await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    const storage = await page.evaluate(() => ({ ...localStorage }));
    try {
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
          if (li === 5 && si === 0) {
            ok((await page.locator('.kl-modal .kl-nav').innerText()).includes('58 / 58') && await page.locator('.kl-modal .kl-big').textContent() === 'ㅄ', `${mode} 導覽抵達第58格`);
            await page.click('.kl-modal [data-nav="-1"]');
            ok((await page.locator('.kl-modal .kl-nav').innerText()).includes('57 / 58'), `${mode} 上一格導覽`);
          }
          ok(tts.every(u => /assets\/tts\/ko\//.test(u)), `${mode} l${li + 1} 有字母沒用到本機音檔：${tts.filter(u => !/assets\/tts\/ko\//.test(u)).slice(0, 3)}`);
          await page.click('.kl-modal .close');
          ok(!(await page.$('.kl-modal')), `${mode} 視窗沒關`);
          if (li === 5 && si === 0) {
            const groups = await page.locator('#lpBody .kl-g').allTextContents();
            ok(n === 58 && groups.length === 6 && groups[4].includes('七個代表音') && groups[5].includes('雙收尾音'), `${mode} 一覽應有六組58格`);
            if (SHOT) await page.screenshot({ path: path.join(SHOT, `all-letters-${mode}.png`), fullPage: true });
          }
        }
        if (li === 5 && si === 1) await flashcardsQA(page, mode);
        if (li === 5 && si === 2) await trialQA(page, mode, tts);
        const nb = await page.$('#lpNext');
        if (nb && si < pk[li] - 1) await nb.click();
      }
    }
    await page.evaluate(() => App.go('free'));
    await page.waitForTimeout(300);
    await page.evaluate(() => App.go('camp'));
    await page.waitForTimeout(200);
    ok(!errs.length, `${mode} 頁面錯誤：${errs.slice(0, 3).join(' | ')}`);
    } finally {
      await page.evaluate(saved => { localStorage.clear(); Object.entries(saved).forEach(([k, v]) => localStorage.setItem(k, v)); }, storage);
      ok(await page.evaluate(saved => JSON.stringify(Object.entries({ ...localStorage }).sort()) === JSON.stringify(Object.entries(saved).sort()), storage), `${mode} localStorage 還原`);
      await ctx.close();
    }
  }
  await b.close();
  console.log(JSON.stringify({ checks, problems }, null, 1));
  if (SHOT) fs.writeFileSync(path.join(SHOT, 'qa.json'), JSON.stringify({ checks, problems }, null, 2));
  process.exit(problems.length ? 1 : 0);
})();

async function flashcardsQA(page, mode) {
  const sel = s => page.locator('.kfc-root ' + s);
  const click = async s => { await sel(s).click(); await page.waitForTimeout(280); };
  const enter = async () => {
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.waitForTimeout(500);
    await page.evaluate(id => App.go('learn', { pack: id }), PACK);
    await page.click('[data-play="5"]');
    if (!await page.$('.kfc-root')) await page.click('#lpNext');
    await page.waitForSelector('.kfc-root');
  };
  const counter = async (s, n) => ok(Number(await sel(s).textContent()) === n, `${mode} ${s} = ${n}`);
  await click('[data-kfc-reset]');
  ok((await sel('.kfc-progress').textContent()).includes('/ 58'), `${mode} 58張卡`);
  ok(await sel('.kfc-front .kfc-tag').textContent() === '子音' && !/[ㄅ-ㄩ]/.test(await sel('.kfc-front').innerText()), `${mode} 正面標籤無注音`);
  if (SHOT) await page.screenshot({ path: path.join(SHOT, `front-${mode}.png`), fullPage: true });
  await sel('.kfc-card').click();
  await page.waitForTimeout(500);
  ok(await sel('.kfc-card').evaluate(el => el.classList.contains('kfc-flipped')), `${mode} 點擊翻面`);
  ok(await sel('.kfc-back p').textContent() === '像注音ㄍ但更輕，字首介於ㄍ和ㄎ之間；收尾只擋住不放開。' && (await sel('.kfc-zy').textContent()) === 'ㄍ', `${mode} 背面念法與注音`);
  if (SHOT) await page.screenshot({ path: path.join(SHOT, `back-${mode}.png`), fullPage: true });
  await page.keyboard.press('Space');
  ok(!await sel('.kfc-card').evaluate(el => el.classList.contains('kfc-flipped')), `${mode} 空白鍵翻面`);
  await page.waitForTimeout(500);
  const drag = async dir => {
    const b = await sel('.kfc-card').boundingBox(), x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + dir * b.width * .4, y + 8, { steps: 10 });
    ok(await sel(dir < 0 ? '.kfc-yes' : '.kfc-no').evaluate(el => +getComputedStyle(el).opacity > .9), `${mode} 拖動提示`);
    if (SHOT && dir < 0) await page.screenshot({ path: path.join(SHOT, `drag-${mode}.png`), fullPage: true });
    await page.mouse.up(); await page.waitForTimeout(300);
  };
  await drag(-1); await counter('[data-kfc-yes]', 1);
  await drag(1); await counter('[data-kfc-no]', 1);
  await click('[data-kfc-undo]'); await counter('[data-kfc-no]', 0);
  await click('[data-kfc-grade="no"]'); await counter('[data-kfc-no]', 1);
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(300); await counter('[data-kfc-yes]', 2);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300); await counter('[data-kfc-no]', 2);
  await page.reload(); await enter();
  ok((await sel('.kfc-progress').textContent()).includes('/ 56'), `${mode} 重整記住兩張會念卡`);
  await click('[data-kfc-filter="收尾音"]');
  ok((await sel('.kfc-progress').textContent()).includes('/ 18'), `${mode} 收尾音18張`);
  ok(await sel('.kfc-tag').textContent() === '收尾音', `${mode} 收尾音標籤`);
  await click('[data-kfc-shuffle]');
  ok(await sel('[data-kfc-shuffle]').getAttribute('aria-pressed') === 'true', `${mode} 打亂開關`);
  await click('[data-kfc-grade="no"]');
  for (let i = 1; i < 18; i++) await click('[data-kfc-grade="yes"]');
  ok(await sel('.kfc-summary').count() === 1 && (await sel('[data-kfc-retry]').textContent()).includes('1'), `${mode} 結算與只練一張`);
  await click('[data-kfc-retry]');
  ok((await sel('.kfc-progress').textContent()).includes('/ 1'), `${mode} 只練不會的卡`);
  await click('[data-kfc-grade="yes"]');
  ok((await sel('.kfc-summary').textContent()).includes('完成'), `${mode} 全會完成`);
  await click('[data-kfc-reset]');
  ok((await sel('.kfc-progress').textContent()).includes('/ 18'), `${mode} 重來清除紀錄`);
  ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${mode} 單字卡無橫向捲動`);
}

async function trialQA(page, mode, tts) {
  const root = page.locator('.ktr-root');
  const bank = await page.evaluate(id => LEARN_UI.packs.find(p => p.id === id).lessons[5].steps[2].bank, PACK);
  const byId = new Map(bank.map(q => [q.id, q]));
  const click = s => root.locator(s).click();
  const shot = async name => { if (SHOT) await page.screenshot({ path: path.join(SHOT, `trial-${name}-${mode}.png`), fullPage: true }); };
  const ids = async () => JSON.parse(await root.getAttribute('data-ids'));
  const config = async (listen, build, noDouble) => {
    await root.locator('[data-ktr-config="listen"]').setChecked(listen);
    await root.locator('[data-ktr-config="build"]').setChecked(build);
    await root.locator('[data-ktr-config="noDouble"]').setChecked(noDouble);
    await root.locator('[data-ktr-count]').selectOption('10');
  };
  ok(await root.count() === 1, `${mode} 第三頁試煉關存在`);
  ok(await root.locator('[data-ktr-config]').count() === 3 && await root.locator('[data-ktr-count] option').count() === 4, `${mode} 設定種類／雙收尾音／題數`);
  await shot('settings');
  await config(false, false, false);
  ok(await root.locator('[data-ktr-start]').isDisabled(), `${mode} 至少選一種類`);
  await config(true, false, true); await click('[data-ktr-start]');
  let chosen = await ids();
  ok(chosen.length === 10 && chosen.every(id => byId.get(id).kind[0] === 'L' && !byId.get(id).dbl), `${mode} 只聽力、排除雙收尾音、10題`);
  await click('[data-ktr-exit]');
  await config(false, true, true); await click('[data-ktr-start]'); chosen = await ids();
  ok(chosen.length === 10 && chosen.every(id => byId.get(id).kind[0] === 'B' && !byId.get(id).dbl), `${mode} 只拆字、排除雙收尾音、10題`);
  await click('[data-ktr-exit]'); await config(true, true, false);
  // 找到每型至少兩題的固定種子，仍走實際U.shuffle與開始按鈕；只在抽題同步區間置換亂數。
  const seed = await page.evaluate(id => {
    const bank = LEARN_UI.packs.find(p => p.id === id).lessons[5].steps[2].bank, old = Math.random;
    const rng = seed => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    try {
      for (let seed = 1; seed < 10000; seed++) {
        Math.random = rng(seed); const sample = U.shuffle(bank.slice()).slice(0, 10);
        if (['L1','L2','B1','B2'].every(k => sample.filter(q => q.kind === k).length >= 2)) return seed;
      }
      throw Error('找不到測試種子');
    } finally { Math.random = old; }
  }, PACK);
  tts.length = 0;
  await page.evaluate(seed => {
    const old = Math.random;
    Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    try { document.querySelector('[data-ktr-start]').click(); } finally { Math.random = old; }
  }, seed);
  const original = await ids(), wrongIds = [], seen = new Set(), rightKinds = new Set(), wrongKinds = new Set();
  let attempts = 0;
  while (await root.getAttribute('data-phase') === 'question' && attempts < 30) {
    const q = byId.get(await root.getAttribute('data-qid'));
    const retry = attempts >= 10, wrong = !retry && !seen.has(q.kind);
    if (retry) ok(wrongIds.includes(q.id), `${mode} 最後僅重出錯題 ${q.id}`);
    else { seen.add(q.kind); if (wrong) wrongIds.push(q.id); }
    await page.waitForTimeout(120);
    if (!retry && wrong) await shot(q.kind);
    if (q.kind[0] === 'L') {
      await click('[data-ktr-slow]'); await page.waitForTimeout(160);
      ok(await page.evaluate(() => Math.abs(window.__koreanQAAudio.find(a => a.src.includes('/tts/ko/'))?.playbackRate - .7) < .001), `${mode} 慢速實際0.7倍`);
      await click('[data-ktr-audio]'); await page.waitForTimeout(60);
      ok(await page.evaluate(() => window.__koreanQAAudio.find(a => a.src.includes('/tts/ko/'))?.playbackRate === 1), `${mode} 正常播放恢復1倍`);
    }
    if (q.kind === 'B1') {
      const used = new Set();
      const answerIndices = q.answer.map(t => { const i = q.tiles.findIndex((x, j) => x === t && !used.has(j)); used.add(i); return i; });
      let indices = answerIndices;
      if (wrong) { const bad = q.tiles.findIndex(t => t !== q.answer[0]); indices = [bad, ...q.tiles.map((_, i) => i).filter(i => i !== bad)].slice(0, q.answer.length); }
      await click(`[data-ktr-tile="${indices[0]}"]`);
      ok(await root.locator('[data-ktr-slot="0"] b').textContent() === q.tiles[indices[0]], `${mode} B1填第一格`);
      if (wrong) await shot('B1-half');
      await click('[data-ktr-slot="0"]');
      ok(await root.locator('[data-ktr-slot="0"] b').textContent() === '？', `${mode} B1退回`);
      for (const i of indices) await click(`[data-ktr-tile="${i}"]`);
    } else {
      const index = q.options.findIndex(x => wrong ? x !== q.answer : x === q.answer);
      await root.focus(); await page.keyboard.press(String(index + 1));
      ok(await root.locator(`[data-ktr-option="${index}"]`).getAttribute('aria-pressed') === 'true', `${mode} ${q.kind} 鍵盤選項`);
    }
    await root.focus(); await page.keyboard.press('Enter');
    ok(await root.locator(wrong ? '.ktr-wrong' : '.ktr-correct').count() === 1, `${mode} ${q.kind} ${wrong ? '答錯' : '答對'}判定`);
    (wrong ? wrongKinds : rightKinds).add(q.kind);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${mode} ${q.kind} 無橫向捲動`);
    if (wrong || attempts < 10) await shot(wrong ? 'wrong' : 'correct');
    if (!wrong && !await root.locator('.ktr-correct').count()) throw Error('答對驗證失敗');
    await page.keyboard.press('Enter'); attempts++;
  }
  ok(['L1','L2','B1','B2'].every(k => rightKinds.has(k) && wrongKinds.has(k)), `${mode} 四型各實際答對與答錯`);
  ok(attempts === 14 && original.length === 10, `${mode} 10題加4題重出、共14次`);
  ok(await root.getAttribute('data-phase') === 'summary', `${mode} 結算畫面`);
  ok(await root.locator('.ktr-score').getAttribute('data-correct') === '6' && await root.locator('.ktr-score').getAttribute('data-total') === '10', `${mode} 首答6/10即60%`);
  ok(await root.locator('[data-ktr-missed]').count() === 4, `${mode} 錯題清單四題`);
  await shot('summary');
  await click('[data-ktr-errors]');
  ok((await ids()).length === 4 && (await ids()).every(id => wrongIds.includes(id)), `${mode} 只練錯的僅四題`);
  await click('[data-ktr-exit]');
  await root.locator('[data-ktr-count]').selectOption('all'); await click('[data-ktr-start]');
  ok((await ids()).length === bank.length, `${mode} 全部題數`);
  await click('[data-ktr-exit]');
  ok(tts.length > 0 && tts.every(u => /assets\/tts\/ko\//.test(u)), `${mode} 試煉發音皆本機音檔`);
  ok(tts.every(u => { const f = require('url').fileURLToPath(u.split('?')[0]); return fs.existsSync(f) && fs.statSync(f).size >= 500; }), `${mode} 音檔存在且非空`);
}
