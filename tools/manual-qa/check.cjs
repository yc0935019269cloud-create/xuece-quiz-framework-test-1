// 實驗手冊圖鑑 QA：資料完整性（圖檔、標記範圍、答案可接受）＋ 7 個單元每一步渲染 ＋ 每張圖解的標記點重疊／載入檢查（桌機與 390px）
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/manual-qa/check.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const UNITS = ['manual-orbit-bones', 'manual-vessel', 'manual-visual-path', 'manual-brain-nerve', 'manual-lid-eom', 'manual-eye', 'manual-cranial-vent'];
const out = { checks: [], problems: [] };
const ok = (name, cond, extra) => { out.checks.push({ name, ok: !!cond }); if (!cond) out.problems.push(name + (extra ? ' ' + extra : '')); };
(async () => {
  const b = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, executablePath: process.env.PW_EXE || undefined });
  const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
  await page.goto(URL);
  await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
  await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });

  // 1. 資料完整性
  const data = await page.evaluate((UNITS) => {
    const res = { units: {}, sets: [] };
    for (const id of UNITS) {
      const p = LEARN_UI.packs.find(x => x.id === id);
      if (!p) { res.units[id] = null; continue; }
      res.units[id] = { title: p.title, path: p.path, lessons: p.lessons.length, steps: p.lessons.reduce((a, l) => a + l.steps.length, 0),
        diagrams: p.lessons.flatMap((l, li) => l.steps.map((s, si) => ({ li, si, s })).filter(x => x.s.type === 'diagram').map(x => ({ li: x.li, si: x.si, lid: p.lessons[x.li].id, img: x.s.img, mode: x.s.mode, title: x.s.title, pts: x.s.points.map(q => [q.x, q.y]), n: x.s.points.length }))),
        cardsNoExam: p.lessons.flatMap(l => l.steps.filter(s => s.type === 'card' && (!s.exam || !s.demo)).map(s => l.id + ':' + s.title)) };
    }
    const qs = Object.values(Store.Q).filter(q => /^eyelab-manual-/.test(q.id || ''));
    res.qn = qs.length;
    res.qs = qs.map(q => ({ id: q.id, img: q.imgs || q.img, marks: q.marks, ans: q.ans, accept: q.accept, set: q.exam }));
    return res;
  }, UNITS);
  for (const id of UNITS) ok('單元存在 ' + id, data.units[id], '');
  ok('題本題目載入', data.qn > 250, String(data.qn));
  const missingImg = new Set(); let badMark = 0, badAcc = 0;
  for (const q of data.qs) {
    for (const im of [].concat(q.img || [])) { const fp = path.join(ROOT, String(im).replace(/^\.?\//, '')); if (!fs.existsSync(fp)) missingImg.add(im); }
    for (const m of q.marks || []) if (!(m.x >= 0 && m.x <= 100 && m.y >= 0 && m.y <= 100)) badMark++;
    const acc = [].concat(q.accept || []);
    if (!acc.length || !acc.some(a => String(a).replace(/\s*\/\s*/g, ' / ') === String(q.ans).replace(/\s*\/\s*/g, ' / '))) badAcc++;
  }
  ok('題目圖檔都存在', missingImg.size === 0, [...missingImg].join(','));
  ok('標記點都在 0–100%', badMark === 0, String(badMark));
  ok('每題 accept 含標準答案', badAcc === 0, String(badAcc));
  let diagN = 0;
  for (const id of UNITS) {
    const u = data.units[id]; if (!u) continue;
    ok(id + ' 每張概念卡有國考重點與示範', u.cardsNoExam.length === 0, u.cardsNoExam.slice(0, 3).join(';'));
    for (const d of u.diagrams) {
      diagN++;
      const fp = path.join(ROOT, d.img);
      ok(`圖解圖檔 ${d.img}`, fs.existsSync(fp));
      ok(`圖解標記點範圍 ${id}/${d.lid} ${d.title}`, d.pts.every(p => p[0] >= 0 && p[0] <= 100 && p[1] >= 0 && p[1] <= 100));
    }
  }

  // 2. 每一步渲染＋圖解標記點重疊（桌機、390px）
  const key = await page.evaluate(() => SKEY('learn'));
  let steps = 0; const empty = [], overlap = [], notLoaded = [];
  for (const mode of ['desktop', 'mobile']) {
    await page.setViewportSize(mode === 'desktop' ? { width: 1000, height: 900 } : { width: 390, height: 844 });
    for (const id of UNITS) {
      const u = data.units[id]; if (!u) continue;
      const plan = await page.evaluate((id) => LEARN_UI.packs.find(x => x.id === id).lessons.map((l, li) => ({ li, lid: l.id, steps: l.steps.map(s => s.type) })), id);
      for (const L of plan) {
        for (let si = 0; si < L.steps.length; si++) {
          if (mode === 'mobile' && L.steps[si] !== 'diagram') continue;
          await page.evaluate(({ k, id, L, si }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + L.lid] = { i: si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: key, id, L, si });
          await page.reload();
          await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
          await page.evaluate((id) => App.go('learn', { pack: id }), id);
          try {
            await page.click(`[data-play="${L.li}"]`);
            await page.waitForTimeout(120);
            const info = await page.evaluate(() => {
              const body = document.querySelector('#lpBody'); const len = body ? body.innerText.length : 0;
              const wrap = document.querySelector('#lpBody .dg-wrap');
              if (!wrap) return { len };
              const img = wrap.querySelector('img');
              const pins = [...wrap.querySelectorAll('.dg-pin')].map(p => { const r = p.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
              let minD = 1e9; for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) minD = Math.min(minD, Math.hypot(pins[i][0] - pins[j][0], pins[i][1] - pins[j][1]));
              return { len, loaded: img && img.complete && img.naturalWidth > 0, n: pins.length, minD, w: wrap.getBoundingClientRect().width };
            });
            if (info.len < 5) empty.push(`${mode} ${id}/${L.lid}#${si}`);
            if (info.n != null) {
              if (!info.loaded) notLoaded.push(`${mode} ${id}/${L.lid}#${si}`);
              if (info.minD < 14) overlap.push(`${mode} ${id}/${L.lid}#${si} pins=${info.n} minD=${info.minD.toFixed(1)}px w=${Math.round(info.w)}`);
            }
          } catch (e) { empty.push(`${mode} ${id}/${L.lid}#${si} ${String(e).slice(0, 60)}`); }
          steps++;
        }
      }
    }
  }
  ok('每一步渲染有內容', empty.length === 0, empty.slice(0, 5).join(' | '));
  ok('圖解圖片載入', notLoaded.length === 0, notLoaded.slice(0, 5).join(' | '));
  out.overlapWarn = overlap;
  ok('頁面沒有錯誤', errs.length === 0, errs.slice(0, 3).join(' | '));
  out.summary = { units: UNITS.length, steps, diagrams: diagN, questions: data.qn, checks: out.checks.length, problems: out.problems.length };
  console.log(JSON.stringify(out.summary), '\n問題：', out.problems, '\n標記點靠太近（<14px，供參考）：', overlap.length, overlap.slice(0, 30));
  await b.close();
  process.exit(out.problems.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
