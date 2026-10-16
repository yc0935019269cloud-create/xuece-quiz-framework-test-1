// 視光學「國考重點複習」與 114 大一下第01～03單元檢查：資料完整性＋瀏覽器實際渲染
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/s114-qa/check.cjs
// 使用一次性的 headless Edge context（不碰使用者的瀏覽器存檔），結果寫到 output/playwright/s114-qa.json
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html';
const NEW = { 's114-optometry-va-sph': 66, 's114-optometry-astigmatism-rx': 58, 's114-optometry-retinoscopy-intro': 14 };
// 每個視光學單元的「國考重點複習」課：pack id → lesson id
const REVIEW = {
  's114-optometry-va-sph': null, 's114-optometry-astigmatism-rx': null, 's114-optometry-retinoscopy-intro': null,   // null＝最後一課
  's114-optometry-pd-lensometry-p2': 'exam-review', 's114-optometry-objective-refraction-p2': 'exam-review', 's114-optometry-keratometry-p2': 'exam-review',
  's114-optometry-pupil-response-p2': 'exam-review', 's114-optometry-stereopsis-p2': 'exam-review', 's114-optometry-near-point-p2': 'exam-review',
  'optom2-u1-intro': 'l5', 'optom2-u2-msr': 'l10', 'optom2-u3-vf': 'l10', 'optom2-u4-bb': 'l7',
};
const out = { checks: [], errors: [] };
const ok = (name, pass, extra) => { out.checks.push({ name, pass: !!pass, extra }); if (!pass) console.log('FAIL', name, extra === undefined ? '' : JSON.stringify(extra).slice(0, 300)); };

(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, executablePath: process.env.PW_EXE || undefined });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => out.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') out.errors.push(m.text()); });
  await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
  const boot = async () => {
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
  };
  await boot();

  // 1. 資料：新單元、每張概念卡有國考重點＋示範；筆記；抽題池
  const data = await page.evaluate((NEW) => Object.keys(NEW).map(id => {
    const p = LEARN_UI.packs.find(x => x.id === id);
    if (!p) return { id, missing: true };
    const cards = [];
    p.lessons.forEach(l => l.steps.forEach(s => { if (s.type === 'card') cards.push({ lesson: l.id, title: s.title, exam: (s.exam || []).length, demo: !!s.demo }); }));
    const practice = p.lessons.flatMap(l => l.steps.filter(s => s.type === 'practice'));
    const pooled = practice.filter(s => (s.qids || []).length || (s.pick && (s.pick.ids || []).length)).length;
    return { id, lessons: p.lessons.length, cards, notes: (p.notes || []).map(n => n.kind), practice: practice.length, pooled, banks: (p.banks || []).length, path: p.path };
  }), NEW);
  for (const d of data) {
    ok(`${d.id} 存在`, !d.missing);
    if (d.missing) continue;
    ok(`${d.id}：路徑為 114 大一下 → 114 學年度 → 視光學 → 單元`, d.path && d.path[0] === '114 大一下' && d.path[2] === '視光學', d.path);
    ok(`${d.id}：每張概念卡有國考重點與示範（${d.cards.length} 張）`, d.cards.every(c => c.exam > 0 && c.demo), d.cards.filter(c => !c.exam || !c.demo).map(c => c.lesson + ':' + c.title));
    ok(`${d.id}：知識筆記 exam-cram + formula-summary`, d.notes.includes('exam-cram') && d.notes.includes('formula-summary'), d.notes);
    ok(`${d.id}：所有 practice 都有題目來源`, d.pooled === d.practice, { practice: d.practice, pooled: d.pooled });
  }

  // 2. 題庫：新國考題 138 題、年份路徑
  const bank = await page.evaluate(() => {
    const qs = Object.values(Store.Q).filter(q => /^s114-optometry-exam\d+-u0[123]-/.test(q.id));
    const sets = (QB.exams || []).filter(s => /^s114-optometry-exam\d+-u0[123]$/.test(s.id));
    const o2 = (QB.exams || []).filter(s => /^optom2-exam-/.test(s.id));
    return { n: qs.length, noEx: qs.filter(q => !q.ex || q.ex.length < 20).length, sets: sets.length,
      badPath: sets.filter(s => !(s.path[0] === '114 大一下' && /^\d+ 年國考$/.test(s.path[1]) && s.path[2] === '視光學')).map(s => s.id),
      o2n: o2.length, o2bad: o2.filter(s => !(s.path[0] === '115 大二上' && /^\d+ 年國考$/.test(s.path[1]) && s.path[2] === '視光學二')).map(s => s.id) };
  });
  ok('第01～03單元國考題 138 題載入', bank.n === 138, bank);
  ok('新國考題每題都有詳解', bank.noEx === 0, bank);
  ok('新國考題本路徑為「114 大一下 → ○○ 年國考 → 視光學 → 單元」', bank.badPath.length === 0 && bank.sets === 23, bank);
  ok('視光學二國考題本路徑改為「115 大二上 → ○○ 年國考 → 視光學二 → 單元」（61 本）', bank.o2n === 61 && bank.o2bad.length === 0, bank);

  // 3. 各單元的「國考重點複習」課
  const rev = await page.evaluate((REVIEW) => Object.keys(REVIEW).map(id => {
    const p = LEARN_UI.packs.find(x => x.id === id);
    if (!p) return { id, missing: true };
    const l = REVIEW[id] ? p.lessons.find(x => x.id === REVIEW[id]) : p.lessons[p.lessons.length - 1];
    if (!l) return { id, nolesson: true };
    const cards = l.steps.filter(s => s.type === 'card');
    const unresolved = [];
    l.steps.filter(s => s.type === 'practice').forEach(s => (s.qids || []).forEach(q => { if (!Store.Q[q]) unresolved.push(q); }));
    return { id, title: l.title, steps: l.steps.length, cards: cards.length, examples: l.steps.filter(s => s.type === 'example').length,
      cardsOk: cards.every(c => (c.exam || []).length && c.demo), unresolved };
  }), REVIEW);
  for (const r of rev) {
    ok(`${r.id}：有「國考重點複習」課`, !r.missing && !r.nolesson && /國考重點複習/.test(r.title || ''), r);
    if (r.missing || r.nolesson) continue;
    ok(`${r.id}：複習課有考點卡與例題講解`, r.examples >= 1 && (r.cards >= 1) && r.cardsOk, r);
    ok(`${r.id}：複習課實戰題目都存在`, r.unresolved.length === 0, r.unresolved);
  }

  // 4. 實際渲染：在每一課的複習課打開第一張概念卡與第一個例題，確認顯示
  const keyLearn = await page.evaluate(() => SKEY('learn'));
  for (const id of Object.keys(REVIEW)) {
    const info = await page.evaluate(({ id, lid }) => {
      const p = LEARN_UI.packs.find(x => x.id === id);
      const li = lid ? p.lessons.findIndex(x => x.id === lid) : p.lessons.length - 1;
      const l = p.lessons[li];
      return { li, lid: l.id, ci: l.steps.findIndex(s => s.type === 'card'), ei: l.steps.findIndex(s => s.type === 'example') };
    }, { id, lid: REVIEW[id] });
    for (const [kind, idx] of [['card', info.ci], ['example', info.ei]]) {
      await page.evaluate(({ k, id, info, idx }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + info.lid] = { i: idx, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: keyLearn, id, info, idx });
      await page.reload();
      await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
      await page.evaluate((id) => App.go('learn', { pack: id }), id);
      let good = false, detail = '';
      try {
        await page.click(`[data-play="${info.li}"]`);
        if (kind === 'card') { await page.waitForSelector('.lp-exam', { timeout: 4000 }); good = await page.evaluate(() => document.querySelectorAll('.lp-exam li').length > 0 && !!document.querySelector('.lp-demo')); }
        else { await page.waitForSelector('#lpBody', { timeout: 4000 }); good = await page.evaluate(() => /答案|解答|一步|步驟|題/.test(document.querySelector('#lpBody').innerText) && document.querySelector('#lpBody').innerText.length > 80); }
      } catch (e) { detail = String(e).slice(0, 100); }
      ok(`${id}：複習課的${kind === 'card' ? '概念卡（國考重點＋示範）' : '例題講解'}可渲染`, good, detail);
    }
  }

  // 5. 實戰：新單元最後一課的國考題抽題池實際出題
  for (const id of Object.keys(NEW)) {
    const info = await page.evaluate((id) => { const p = LEARN_UI.packs.find(x => x.id === id); const li = p.lessons.length - 1; const l = p.lessons[li]; const si = l.steps.findIndex(s => s.type === 'practice'); return { li, lid: l.id, si, pool: (l.steps[si].pick.ids || []).length }; }, id);
    await page.evaluate(({ k, id, info }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + info.lid] = { i: info.si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: keyLearn, id, info });
    await page.reload();
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate((id) => App.go('learn', { pack: id }), id);
    await page.click(`[data-play="${info.li}"]`);
    let shown = false;
    try { await page.waitForSelector('#lpBody .qtext', { timeout: 5000 }); shown = true; } catch (e) {}
    ok(`${id}：國考總演練實際出題（抽題池 ${info.pool} 題）`, shown && info.pool >= 5, info);
  }

  // 6. 知識筆記頁：新單元的考前必看／公式統整、相關題視窗
  await page.evaluate(() => App.go('learn', { tab: 'notes' }));
  await page.waitForTimeout(600);
  await page.click('#nOpenAll');
  for (const id of Object.keys(NEW)) {
    const cram = page.locator(`[data-cram-pack="${id}"]`);
    ok(`${id}：筆記頁有「考前必看」`, await cram.count() === 1);
    if (await cram.count() === 1) {
      if (!(await cram.evaluate(d => d.open))) await cram.locator(':scope > summary').click();
      const related = cram.locator('.note-related');
      ok(`${id}：考前必看有相關題連結`, await related.count() >= 3, await related.count());
      await related.first().locator(':scope > summary').click();
      const link = related.first().locator('[data-related-q]').first();
      await link.waitFor({ timeout: 3000 }).catch(() => {});
      const qid = await link.getAttribute('data-related-q');
      await link.click();
      const modal = page.locator('.qpreview-modal');
      const shown = await modal.count() === 1 && await modal.evaluate((el, qid) => { const q = Store.Q[qid]; const clean = s => String(s).replace(/[\s*]/g, ''); return clean(el.textContent).includes(clean(q.stem).slice(0, 10)) && el.querySelectorAll('.qpreview-choice').length >= 2; }, qid);
      ok(`${id}：相關題可開啟唯讀題目視窗`, shown, qid);
      await page.keyboard.press('Escape');
    }
    ok(`${id}：筆記頁有「公式統整」`, await page.locator(`[data-formula-pack="${id}"]`).count() === 1);
  }

  // 7. 手機寬度：新單元第一張概念卡不會橫向捲動
  await page.setViewportSize({ width: 390, height: 800 });
  await page.evaluate(({ k }) => { const D = JSON.parse(localStorage.getItem(k) || 'null'); if (D) { delete D.les['s114-optometry-va-sph/l2']; localStorage.setItem(k, JSON.stringify(D)); } }, { k: keyLearn });
  await page.evaluate(() => App.go('learn', { pack: 's114-optometry-va-sph' }));
  await page.click('[data-play="1"]');
  await page.waitForTimeout(500);
  const mobile = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  ok('手機寬度（390px）沒有橫向捲動', mobile.sw <= mobile.iw + 2, mobile);

  out.errorsCount = out.errors.length;
  ok('沒有頁面錯誤', out.errors.length === 0, out.errors.slice(0, 5));
  fs.mkdirSync(path.join(ROOT, 'output', 'playwright'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'output', 'playwright', 's114-qa.json'), JSON.stringify(out, null, 1));
  const failed = out.checks.filter(c => !c.pass).length;
  console.log(`${out.checks.length - failed}/${out.checks.length} 通過`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
