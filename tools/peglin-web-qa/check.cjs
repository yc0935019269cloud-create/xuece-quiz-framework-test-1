// 網頁版彈珠（peglin/web.html ＋ js/peglin.js）端到端檢查：headless Edge、獨立 context、測前備份測後還原 localStorage。
// 用法（PowerShell）：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/peglin-web-qa/check.cjs
// 需要網路（遊戲建置從 peglinnnnnnn 的 GitHub Pages 載入）。Unity 在 SwiftShader 上載入約 40～90 秒。
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), url = require('url'), assert = require('assert').strict;
const ROOT = path.resolve(__dirname, '../..'), OUT = path.join(ROOT, 'output/playwright');
fs.mkdirSync(OUT, { recursive: true });
const report = { at: new Date().toISOString(), checks: [], issues: [], shots: [] };
const ok = (name, cond, extra) => { report.checks.push({ name, pass: !!cond, ...(extra ? { extra } : {}) }); if (!cond) report.issues.push(name + (extra ? ' ' + JSON.stringify(extra) : '')); console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra && !cond ? ' ' + JSON.stringify(extra) : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => report.issues.push('pageerror: ' + e));
  const shot = async name => { const p = path.join(OUT, `peglin-web-${name}.png`); await page.screenshot({ path: p }); report.shots.push(path.relative(ROOT, p)); };
  await page.goto(url.pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => typeof PEGLIN !== 'undefined' && typeof App !== 'undefined' && typeof LEARN_UI !== 'undefined');
  const backup = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const G = () => page.evaluate(() => { const g = PEGLIN.web.state; return g && { credits: g.credits, pts: g.pts, fired: g.fired, graded: g.graded, right: g.right, reads: g.reads, lessons: g.lessons, panel: g.panel, ready: g.ready, armed: g.armed, error: g.error, item: g.item && (g.item.kind === 'bank' ? { kind: 'bank', id: g.item.q.id, key: g.item.q.key, type: g.item.q.type } : g.item.kind === 'check' ? { kind: 'check', id: g.item.c.id, ckind: g.item.c.kind, answer: g.item.c.answer } : { kind: 'read', type: g.item.s.type }) }; });
  const frame = () => page.frames().find(f => /peglin\/web\.html/.test(f.url()));
  try {
    await page.evaluate(() => { VOL.set('muted', true); localStorage.setItem(SKEY('peglin-web'), JSON.stringify({ debug: true })); });

    /* ---------- 1. 準備頁：範圍選擇與自由遠征一致 ---------- */
    await page.evaluate(() => App.go('peglin'));
    await page.waitForSelector('#pgSets .stree, #pgSets .dim');
    const form = await page.evaluate(() => ({
      subj: document.querySelectorAll('#pgSj .chip').length, subjects: Object.keys(C.SUBJECTS).length,
      tree: !!document.querySelector('#pgSets .stree'), years: !!document.querySelector('#pgSets .st-years-top'),
      types: [...document.querySelectorAll('#pgTypes .chip')].map(c => c.dataset.v), star: document.querySelectorAll('#pgStar .chip').length,
      pref: [...document.querySelectorAll('#pgPref .chip')].map(c => c.dataset.v), pat: !!document.querySelector('#pgPat .chip'),
      status: document.querySelectorAll('#pgStatus .chip').length, count: document.querySelectorAll('#pgCount .chip').length, shots: !!document.querySelector('#pgShots')
    }));
    ok('準備頁：科目／題本樹（含年份）／題型／星號／出題方式／同類題／狀態／題數／彈珠數都在', form.subj === form.subjects && form.tree && form.types.join() === 'single,multi,fill,open' && form.star === 2 && form.pref.join() === 'smart,rand,new,wrong' && form.pat && form.status === 6 && form.count === 6 && form.shots, form);
    // 題數和自由遠征的計算方式一致：同一組條件下 Store.filter 的結果
    await page.evaluate(() => { const c = document.querySelector('#pgTypes .chip[data-v="multi"]'); if (c.classList.contains('on')) c.click(); const f = document.querySelector('#pgTypes .chip[data-v="fill"]'); if (f.classList.contains('on')) f.click(); });
    const pick = await page.evaluate(() => {
      // 勾第一科的第一個題本資料夾（題本樹的「全選」）
      const b = document.querySelector('#pgSets [data-pick]'); b.click();
      const cfg = JSON.parse(localStorage.getItem(SKEY('peglin-config')));
      const expect = Store.filter({ subjects: cfg.subjects, exams: cfg.exams, years: cfg.years, types: cfg.types, starOnly: cfg.starOnly, status: cfg.status }).filter(q => cfg.types.includes('open') || q.type !== 'open').length;
      return { exams: cfg.exams.length, types: cfg.types, expect, text: document.querySelector('#pgCnt').textContent };
    });
    ok('題本樹勾選後寫進設定、題數與自由遠征同一套 Store.filter 計算', pick.exams > 0 && pick.text.includes(pick.expect.toLocaleString()), pick);
    await page.evaluate(() => { const sel = document.querySelector('#pgShots'); sel.value = '2'; sel.dispatchEvent(new Event('change')); const pref = document.querySelector('#pgPref .chip[data-v="rand"]'); pref.click(); });
    await page.waitForFunction(() => !document.querySelector('#pgWeb').disabled, null, { timeout: 20000 });
    ok('網頁版偵測到可用（GitHub Pages 有回應），按鈕可按、沒有顯示「不能用」說明', await page.evaluate(() => !document.querySelector('#pgWeb').disabled && document.querySelector('#pgGate').hidden && /網頁版可用/.test(document.querySelector('#pgWebState').textContent)));
    ok('GitHub Pages 以外不自動探測本機啟動器的說明存在（file:// 會自動探測）', await page.evaluate(() => !!document.querySelector('#pgLocal')));
    await shot('setup-desktop');

    /* ---------- 2. 開始：第一題先出，答對換 2 顆 ---------- */
    await page.click('#pgWeb');
    await page.waitForSelector('#pgw #pgwPanel:not([hidden]) .qwrap .opt');
    // 讓遊戲區剛好 1280×720（和探測時一樣，方便用相對座標點遊戲）
    const barH = await page.evaluate(() => document.querySelector('.pgw-bar').getBoundingClientRect().height);
    await page.setViewportSize({ width: 1280, height: Math.round(720 + barH) });
    let g = await G();
    ok('開啟後覆蓋整個畫面、iframe 載入外框頁、第一題立刻出現、遊戲被鎖住', g && g.panel && g.item.kind === 'bank' && g.credits === 0 && await page.evaluate(() => !!document.querySelector('#pgwFrame') && !document.querySelector('#pgwShield').hidden), g);
    const q1 = g.item, before1 = await page.evaluate(id => JSON.stringify(Store.qs[id] || null), q1.id);
    await page.click(`#pgwQ .opt[data-l="${q1.key[0]}"]`);
    await page.waitForSelector('#pgwQ .next-btn');
    g = await G();
    const rec1 = await page.evaluate(id => Store.qs[id], q1.id);
    ok('答對：Store.record 寫進作答紀錄、彈珠 +2、按鈕變「去發射」', g.credits === 2 && rec1 && rec1.a >= 1 && JSON.stringify(rec1) !== before1 && /去發射/.test(await page.textContent('#pgwQ .next-btn')), { g, rec1 });
    await shot('answered');
    await page.click('#pgwQ .next-btn');
    g = await G();
    ok('去發射：面板收起、遮罩拿掉（還有彈珠）', !g.panel && await page.evaluate(() => document.querySelector('#pgwShield').hidden));

    /* ---------- 3. 真的玩：等 Unity 載入，進第一關，發射到彈珠用完 ---------- */
    await page.waitForFunction(() => PEGLIN.web.state && PEGLIN.web.state.ready, null, { timeout: 300000 });
    await page.waitForFunction(() => PEGLIN.web.state.armed, null, { timeout: 60000 }).catch(() => {});
    g = await G();
    ok('遊戲在 iframe 內載入完成、發射偵測就緒（發射音效已解碼）', g.ready && g.armed && !g.error, g);
    const box = await page.evaluate(() => document.querySelector('#pgwFrame').getBoundingClientRect().toJSON());
    const at = (x, y) => [box.x + x * box.width / 1280, box.y + y * box.height / 720];
    const clickGame = async (x, y, wait) => { const [px, py] = at(x, y); await page.mouse.move(px, py); await sleep(300); await page.mouse.down(); await sleep(80); await page.mouse.up(); await sleep(wait); };
    // createUnityInstance 完成後遊戲還要自己預載資源、載入標題場景（SwiftShader 上要幾十秒）：
    // 截圖判斷「Peglin」Logo 區的白色像素比例，標題真的出現才開始點
    const whiteRatio = async (x, y, w, h) => {
      const [px, py] = at(x, y), b = await page.screenshot({ clip: { x: px, y: py, width: w * box.width / 1280, height: h * box.height / 720 } });
      return page.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 225 && d[i + 1] > 225 && d[i + 2] > 225) n++; return n / (d.length / 4); }, b.toString('base64'));
    };
    let title = 0; for (let i = 0; i < 80 && title < 0.12; i++) { title = await whiteRatio(200, 60, 480, 150); if (title < 0.12) await sleep(3000); }
    ok('遊戲自己的載入完成、標題畫面出現（Logo 白色像素比例）', title >= 0.12, { title });
    await sleep(3000);
    await shot('game-title');
    await clickGame(360, 330, 8000);       // 新的遊戲
    await clickGame(1065, 677, 12000);     // 開始遊戲
    await clickGame(1138, 644, 10000);     // 跳過遺物
    await shot('game-map');
    await clickGame(640, 380, 18000);      // 第一個戰鬥節點
    const firedAtStart = (await G()).fired;   // 有時遊戲會在開戰時自動把彈珠打進路口（算一顆），不一定每次都有
    report.firedAtStart = firedAtStart;
    await clickGame(806, 468, 3000);       // 教學提示下一頁（沒有教學時這一下會直接發射，下面照實際偵測計算）
    await clickGame(438, 206, 4000);       // 關閉教學
    await shot('game-battle');
    // 持續發射：球還在跑或敵方回合時點了不會發射，所以每次看偵測數有沒有增加
    const firedLog = [];
    for (let i = 0; i < 12; i++) {
      g = await G(); if (g.credits <= 0) break;
      const before = g.fired; await clickGame(560 + (i % 3) * 40, 480, 3000);
      g = await G(); firedLog.push(g.fired - before);
      if (g.fired > before && g.credits > 0) await sleep(11000); else if (g.fired === before) await sleep(5000);
    }
    g = await G();
    const locked = await frame().evaluate(() => window.__pgw && window.__pgw.locked);
    ok('戰鬥中實際發射：每次發射偵測一顆、給的 2 顆用完、遊戲被蓋住並鎖住輸入', g.fired >= 2 && g.credits === 0 && !g.panel && locked === true && firedLog.every(n => n <= 1) && await page.evaluate(() => !document.querySelector('#pgwShield').hidden), { g, locked, firedLog, firedAtStart });
    await sleep(9000);
    await shot('out-of-balls');

    /* ---------- 4. 沒彈珠時在遊戲裡按鍵 → 外框頁擋下並叫出下一題；答錯也照樣給（預設） ---------- */
    await page.evaluate(() => document.querySelector('#pgwFrame').focus());
    await frame().evaluate(() => document.getElementById('unity-canvas').focus());
    await page.keyboard.press('Space');
    await page.waitForFunction(() => PEGLIN.web.state.panel, null, { timeout: 5000 }).catch(() => {});
    g = await G();
    ok('鎖住時在遊戲裡按空白鍵：被擋下並打開下一題', g.panel && g.item && g.item.kind === 'bank', g);
    if (g.item && g.item.kind === 'bank' && g.item.type === 'single') {
      const total = () => page.evaluate(() => Number((PEGLIN.web.state.S.pos().match(/\/ (\d+)/) || [])[1]));
      const t0 = await total();
      const wrongL = await page.evaluate(key => [...document.querySelectorAll('#pgwQ .opt')].map(b => b.dataset.l).find(l => !key.includes(l)), g.item.key);
      await page.click(`#pgwQ .opt[data-l="${wrongL}"]`); await page.waitForSelector('#pgwQ .next-btn:visible');
      const wb = await page.evaluate(id => !!(Store.wrong[id] && !Store.wrong[id].done), g.item.id), g2 = await G();
      ok('答錯：進錯題本、預設「答錯也算數」仍給 2 顆、這題排到後面再出一次', wb && g2.credits === 2 && await total() === t0 + 1, { wb, g2, t0 });
    }
    await shot('wrong-answer');
    await page.click('#pgwQ .next-btn:visible');
    // 彈珠用完時遊戲被遮罩蓋住：點遊戲畫面只會叫出題目，點擊不會傳進遊戲（模擬兩次發射把彈珠用完）
    await frame().evaluate(() => { parent.postMessage({ pgw: 1, type: 'shot' }, '*'); setTimeout(() => parent.postMessage({ pgw: 1, type: 'shot' }, '*'), 1500); });
    await page.waitForFunction(() => PEGLIN.web.state.credits === 0 && !document.querySelector('#pgwShield').hidden, null, { timeout: 8000 }).catch(() => {});
    const startsBefore = await frame().evaluate(() => window.__pgw.starts.length), firedBefore = (await G()).fired;
    await clickGame(600, 480, 1500);
    g = await G();
    ok('彈珠用完：點遊戲畫面被遮罩接住、出下一題，遊戲沒有收到這一下', g.panel && g.item && g.fired === firedBefore && await page.evaluate(() => document.elementFromPoint(600, 480).closest('#pgwPanel, #pgwShield') !== null), { g, startsBefore });

    /* ---------- 5. 結束：摘要、移除遊戲 ---------- */
    await page.click('#pgwExit');
    await page.click('.modal-bg .px-btn.gold, .modal-bg .modal-ok, .modal-bg button:has-text("確定")').catch(() => {});
    await page.waitForFunction(() => !document.querySelector('#pgw'), null, { timeout: 8000 });
    ok('結束：覆蓋層與遊戲 iframe 移除、跳出這次的摘要', await page.evaluate(() => !document.querySelector('#pgw') && !document.querySelector('#pgwFrame') && /這次的彈珠刷題/.test(document.body.textContent)));
    await shot('summary');
    await page.evaluate(() => U.clearModals ? U.clearModals() : document.querySelectorAll('.modal-bg').forEach(m => m.remove()));

    /* ---------- 6. 測試場次（test: true）不寫紀錄 ---------- */
    const tq = await page.evaluate(() => {
      const cfg = Object.assign(JSON.parse(localStorage.getItem(SKEY('peglin-config'))), { test: true });
      const ids = PEGLIN.web.quizIds(cfg, 3); const snap = JSON.stringify(ids.map(id => Store.qs[id] || null));
      PEGLIN.web.open(PEGLIN.web.quizSession(cfg, ids)); return { ids, snap };
    });
    await page.waitForSelector('#pgwQ .opt');
    g = await G(); await page.click(`#pgwQ .opt[data-l="${g.item.key[0]}"]`); await page.waitForSelector('#pgwQ .next-btn');
    const after = await page.evaluate(ids => JSON.stringify(ids.map(id => Store.qs[id] || null)), tq.ids);
    ok('測試場次（test: true）：作答不寫進紀錄，但彈珠照算', after === tq.snap && (await G()).credits >= 1);
    await page.evaluate(() => PEGLIN.web.close(true));

    /* ---------- 7. 彈珠學習：一課走完，記成完成；檢核用 applyPeglin 規則 ---------- */
    const lesson = await page.evaluate(() => {
      // 可自動走完：閱讀類步驟＋單選／是非／多選檢核；實戰只收固定題號的單選／多選題庫題（不含隨機抽題）
      const READ = ['intro', 'card', 'recap', 'example', 'diagram', 'interactive', 'letters'], CK = ['single', 'tf', 'multi'];
      const okCheck = c => CK.includes(c.kind);
      for (const p of LEARN_UI.packs) for (const l of p.lessons) {
        if (l.steps.length > 16 || !l.steps.some(s => s.type === 'check' && s.kind === 'single')) continue;
        const fine = l.steps.every(s => READ.includes(s.type) || (s.type === 'check' && okCheck(s))
          || (s.type === 'practice' && !s.pick && (s.qids || []).every(id => !Store.Q[id] || ['single', 'multi'].includes(Store.Q[id].type)) && (s.checks || []).every(okCheck)));
        if (fine) return { p: p.id, l: l.id, title: l.title, n: l.steps.length };
      }
      return null;
    });
    ok('找到可自動走完的課（閱讀卡＋單選／是非／多選檢核＋固定題號題庫題）', !!lesson, lesson);
    if (lesson) {
      await page.evaluate(L => { localStorage.setItem(SKEY('peglin-learn'), JSON.stringify({ subject: LEARN_UI.packs.find(p => p.id === L.p).subject, sel: [L.p + '/' + L.l], per: 2, shots: 1, onWrong: 'count' })); App.go('peglinLearn'); }, lesson);
      await page.waitForFunction(() => !document.querySelector('#pgWeb').disabled, null, { timeout: 20000 });
      ok('學習準備頁：選好的課、彈珠設定（每完成 2 步 1 顆）', await page.evaluate(() => /已選 1 課/.test(document.querySelector('#pgPool').textContent) && document.querySelector('#pgPer').value === '2'));
      await page.click('#pgWeb');
      let steps = 0, firstWrongDone = false;
      for (; steps < 40; steps++) {
        await page.waitForFunction(() => PEGLIN.web.state && PEGLIN.web.state.panel && (document.querySelector('#pgwQ .pgw-go button, #pgwQ .lc-opt, #pgwQ .opt, #pgwQ .pgw-end')), null, { timeout: 10000 });
        g = await G();
        if (!g.item) break;
        if (g.item.kind === 'read') await page.click('#pgwQ .pgw-go button');
        else if (g.item.kind === 'check' && g.item.ckind === 'multi') {
          for (const i of g.item.answer) await page.click(`#pgwQ .lc-opt[data-i="${i}"]`);
          await page.click('#pgwQ .lc-confirm');
          await page.waitForSelector('#pgwQ .pgw-go button'); await page.click('#pgwQ .pgw-go button');
        } else if (g.item.kind === 'check') {
          const right = g.item.ckind === 'tf' ? (g.item.answer ? 0 : 1) : g.item.answer;
          // 第一題單選／是非檢核故意先答錯一次（會有提示或揭曉），驗證錯題進複習盒
          if (!firstWrongDone) { firstWrongDone = true; const n = await page.$$eval('#pgwQ .lc-opt', b => b.length); await page.click(`#pgwQ .lc-opt[data-i="${(right + 1) % n}"]`); await sleep(200); }
          if (await page.$('#pgwQ .lc-opt:not([disabled])[data-i="' + right + '"]')) await page.click(`#pgwQ .lc-opt[data-i="${right}"]`);
          await page.waitForSelector('#pgwQ .pgw-go button'); await page.click('#pgwQ .pgw-go button');
        } else if (g.item.kind === 'bank') {
          for (const L of (g.item.type === 'multi' ? g.item.key.split('') : [g.item.key[0]])) await page.click(`#pgwQ .opt[data-l="${L}"]`);
          if (g.item.type === 'multi') await page.click('#pgwQ .confirm');
          await page.waitForSelector('#pgwQ .next-btn:visible'); await page.click('#pgwQ .next-btn:visible');
        } else break;
        await sleep(150);
        // 彈珠夠了面板會收起：按「📖 下一步」先繼續上課（存彈珠）
        if (!(await G()).panel) await page.click('#pgwAsk');
        const st = await G(); if (st.lessons >= 1) break;
      }
      g = await G();
      const learnD = await page.evaluate(L => { const d = JSON.parse(localStorage.getItem(SKEY('learn')) || '{}'); return { les: (d.les || {})[L.p + '/' + L.l], rev: Object.keys(d.rev || {}).length }; }, lesson);
      ok('一課走完：applyPeglin 記成完成（done、星等）、檢核答錯進複習盒、每 2 步換 1 顆', g.lessons === 1 && learnD.les && learnD.les.done >= 1 && learnD.les.best >= 1 && learnD.rev >= 1 && g.credits + g.fired >= Math.floor((g.reads + g.graded) / 2) - 1, { g, learnD, steps });
      await shot('learn');
      await page.evaluate(() => PEGLIN.web.close(true));
    }

    /* ---------- 8. 沒有網頁版可用：顯示原本的說明、按鈕停用 ---------- */
    // 直接改設定時要清掉上一次的可用性結果（畫面上「儲存並重新檢查」會自己清）
    await page.evaluate(() => { localStorage.setItem(SKEY('peglin-web'), JSON.stringify({ base: 'http://127.0.0.1:9/' })); PEGLIN.web.probe(true); App.go('peglin'); });
    await page.waitForFunction(() => !document.querySelector('#pgGate').hidden, null, { timeout: 20000 });
    ok('網頁版連不到（也沒有本機啟動器）：顯示原本的說明、開始按鈕停用', await page.evaluate(() => document.querySelector('#pgWeb').disabled && /PeglinQuiz/.test(document.querySelector('#pgGate').textContent) && /連不到網頁版遊戲/.test(document.querySelector('#pgGate').textContent)));
    await shot('no-web');

    /* ---------- 9. 手機寬度：題目面板在下方、沒有橫向捲動 ---------- */
    await page.evaluate(() => { localStorage.setItem(SKEY('peglin-web'), JSON.stringify({})); PEGLIN.web.probe(true); });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => App.go('peglin'));
    await page.waitForFunction(() => !document.querySelector('#pgWeb').disabled, null, { timeout: 20000 });
    ok('手機寬度準備頁沒有橫向捲動', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth <= 1));
    await shot('setup-mobile');
    await page.evaluate(() => { const cfg = Object.assign(JSON.parse(localStorage.getItem(SKEY('peglin-config'))), { test: true }); PEGLIN.web.open(PEGLIN.web.quizSession(cfg, PEGLIN.web.quizIds(cfg, 3))); });
    await page.waitForSelector('#pgwQ .opt');
    const mob = await page.evaluate(() => { const p = document.querySelector('#pgwPanel').getBoundingClientRect(), b = document.querySelector('.pgw-bar').getBoundingClientRect(); return { left: p.left, right: p.right, bottom: p.bottom, h: p.height, bar: b.height, vw: innerWidth, vh: innerHeight, overflow: document.documentElement.scrollWidth - innerWidth }; });
    ok('手機：題目面板滿版貼底、高度不超過 8 成、狀態列不擠爆', mob.left === 0 && Math.abs(mob.right - mob.vw) <= 1 && Math.abs(mob.bottom - mob.vh) <= 1 && mob.h <= mob.vh * 0.8 && mob.bar < 140 && mob.overflow <= 1, mob);
    await shot('mobile-panel');
    await page.evaluate(() => PEGLIN.web.close(true));
  } catch (e) {
    report.issues.push('exception: ' + (e && e.stack || e)); console.log('EXCEPTION', e);
    try { await shot('exception'); } catch {}
  } finally {
    await page.evaluate(b => { localStorage.clear(); for (const [k, v] of Object.entries(b)) localStorage.setItem(k, v); }, backup).catch(() => {});
    report.restored = await page.evaluate(b => Object.keys(b).every(k => localStorage.getItem(k) === b[k]) && localStorage.length === Object.keys(b).length, backup).catch(() => false);
    report.pass = report.checks.filter(c => c.pass).length; report.total = report.checks.length;
    fs.mkdirSync(path.join(ROOT, 'docs/peglin-web'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'docs/peglin-web/qa.json'), JSON.stringify(report, null, 1));
    console.log(`\n${report.pass}/${report.total} passed, issues: ${report.issues.length}, localStorage restored: ${report.restored}`);
    await browser.close();
  }
})();
