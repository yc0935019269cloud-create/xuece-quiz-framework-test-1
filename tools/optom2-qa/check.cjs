// 視光學二（第 2～4 單元）內容檢查：資料完整性＋瀏覽器實際渲染
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/optom2-qa/check.cjs
// 使用一次性的 headless Edge context（不碰使用者的瀏覽器存檔），結果寫到 output/playwright/optom2-qa.json
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = 'file:///' + ROOT.replace(/\\/g, '/') + '/index.html';
const PACKS = ['optom2-u2-msr', 'optom2-u3-vf', 'optom2-u4-bb'];
const out = { checks: [], errors: [] };
const ok = (name, pass, extra) => { out.checks.push({ name, pass: !!pass, extra }); if (!pass) console.log('FAIL', name, extra || ''); };

(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, executablePath: process.env.PW_EXE || undefined });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => out.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') out.errors.push(m.text()); });
  await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
  const boot = async (init) => {
    if (init) await page.addInitScript(init);
    await page.goto(URL);
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });
  };
  await boot();

  // 1. 資料完整性：每張概念卡都有國考重點與示範
  const data = await page.evaluate((PACKS) => PACKS.map(id => {
    const p = LEARN_UI.packs.find(x => x.id === id);
    if (!p) return { id, missing: true };
    const cards = [];
    p.lessons.forEach(l => l.steps.forEach((s, i) => { if (s.type === 'card') { const nx = l.steps[i + 1]; const own = (s.exam || []).length > 0 && !!s.demo; const nextOk = !!nx && nx.type === 'card' && (nx.exam || []).length > 0 && !!nx.demo; cards.push({ lesson: l.id, title: s.title, exam: own || nextOk ? 1 : 0, demo: own || nextOk, own }); } }));
    const practice = p.lessons.flatMap(l => l.steps.filter(s => s.type === 'practice'));
    const pooled = practice.filter(s => s.pick && (s.pick.ids || []).length > 0).length;
    return { id, lessons: p.lessons.length, cards, notes: (p.notes || []).map(n => n.kind), practice: practice.length, pooled, banks: (p.banks || []).length };
  }), PACKS);
  for (const d of data) {
    ok(`${d.id} 存在`, !d.missing);
    if (d.missing) continue;
    const noExam = d.cards.filter(c => !c.exam), noDemo = d.cards.filter(c => !c.demo);
    ok(`${d.id}：每張概念卡都有國考重點（${d.cards.length} 張）`, noExam.length === 0, noExam.map(c => c.lesson + ':' + c.title));
    ok(`${d.id}：每張概念卡都有示範`, noDemo.length === 0, noDemo.map(c => c.lesson + ':' + c.title));
    ok(`${d.id}：知識筆記 exam-cram + formula-summary`, d.notes.includes('exam-cram') && d.notes.includes('formula-summary'), d.notes);
    ok(`${d.id}：所有 practice 抽題池非空`, d.pooled === d.practice, { practice: d.practice, pooled: d.pooled });
  }

  // 2. 題庫：國考題載入、含詳解
  const bank = await page.evaluate(() => {
    const qs = Object.values(Store.Q).filter(q => /^optom2-exam-/.test(q.id));
    return { n: qs.length, noEx: qs.filter(q => !q.ex || q.ex.length < 30).length, sets: new Set(qs.map(q => q.exam)).size };
  });
  ok('國考題 227 題載入', bank.n === 227, bank);
  ok('國考題每題都有詳解', bank.noEx === 0, bank);

  // 3. 實際渲染：在一次性 context 中設定進度，直接打開某一步
  const keyLearn = await page.evaluate(() => SKEY('learn'));
  const targets = [];
  data.forEach(d => { if (d.missing) return; d.cards.filter(c => c.own).forEach((c, i) => { if (i % 6 === 0) targets.push({ pack: d.id, lesson: c.lesson, title: c.title }); }); });
  let rendered = 0, renderFail = [];
  for (const t of targets) {
    const idx = await page.evaluate(({ pack, lesson, title }) => {
      const p = LEARN_UI.packs.find(x => x.id === pack), l = p.lessons.find(x => x.id === lesson);
      return l.steps.findIndex(s => s.type === 'card' && s.title === title);
    }, t);
    const seed = { [t.pack + '/' + t.lesson]: { i: idx, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } } };
    await page.evaluate(({ keyLearn, seed }) => { const D = JSON.parse(localStorage.getItem(keyLearn) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les = Object.assign({}, D.les, seed); localStorage.setItem(keyLearn, JSON.stringify(D)); }, { keyLearn, seed });
    await page.reload();
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate((pack) => App.go('learn', { pack }), t.pack);
    const lessonIdx = await page.evaluate(({ pack, lesson }) => LEARN_UI.packs.find(x => x.id === pack).lessons.findIndex(l => l.id === lesson), t);
    try {
      await page.click(`[data-play="${lessonIdx}"]`);
      await page.waitForSelector('.lp-exam', { timeout: 4000 });
      const r = await page.evaluate(() => ({ exam: document.querySelectorAll('.lp-exam li').length, demo: !!document.querySelector('.lp-demo'), title: (document.querySelector('#learnBody h3') || {}).textContent }));
      if (r.exam > 0 && r.demo) rendered++; else renderFail.push({ t, r });
      if (rendered === 1) await page.screenshot({ path: path.join(ROOT, 'output', 'playwright', 'optom2-qa-card.png'), fullPage: false });
    } catch (e) { renderFail.push({ t, err: String(e).slice(0, 120) }); }
  }
  ok(`抽樣 ${targets.length} 張概念卡實際渲染出「🎯 國考重點」與「✏️ 示範」`, rendered === targets.length, renderFail.slice(0, 3));

  // 3b. 國考總演練（最後一課的 practice）：實際抽出國考題
  for (const id of PACKS) {
    const info = await page.evaluate((id) => { const p = LEARN_UI.packs.find(x => x.id === id); const li = p.lessons.length - 1; const l = p.lessons[li]; return { li, lid: l.id, si: l.steps.findIndex(s => s.type === 'practice'), pool: (l.steps.find(s => s.type === 'practice').pick.ids || []).length }; }, id);
    const keyLearn2 = await page.evaluate(() => SKEY('learn'));
    await page.evaluate(({ k, id, info }) => { const D = JSON.parse(localStorage.getItem(k) || 'null') || { les: {}, rev: {}, cfg: { battle: false, open: {} }, last: null, stat: {} }; D.les[id + '/' + info.lid] = { i: info.si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } }; localStorage.setItem(k, JSON.stringify(D)); }, { k: keyLearn2, id, info });
    await page.reload();
    await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
    await page.evaluate((id) => App.go('learn', { pack: id }), id);
    await page.click(`[data-play="${info.li}"]`);
    let shown = false;
    try { await page.waitForSelector('#lpBody .qtext', { timeout: 5000 }); shown = true; } catch (e) {}
    const text = shown ? await page.evaluate(() => document.querySelector('#lpBody .qtext').textContent.slice(0, 60)) : '';
    ok(`${id}：國考總演練實際出題（抽題池 ${info.pool} 題）`, shown && info.pool >= 20, text);
  }

  // 4. 知識筆記頁
  await page.evaluate(() => App.go('learn', { tab: 'notes' }));
  await page.waitForTimeout(600);
  const notes = await page.evaluate(() => ({ summaries: document.querySelectorAll('.lnote-summary').length, text: document.body.innerText.includes('考前必看') }));
  ok('知識筆記頁可開啟', notes.text, notes);

  // 4b. 每個單元的「考前必看」與「公式統整」：展開、點相關題、開啟唯讀題目視窗
  await page.click('#nOpenAll');
  for (const id of PACKS) {
    const cram = page.locator(`[data-cram-pack="${id}"]`);
    ok(`${id}：筆記頁有「考前必看」`, await cram.count() === 1);
    if (await cram.count() !== 1) continue;
    if (!(await cram.evaluate(d => d.open))) await cram.locator(':scope > summary').click();
    const items = await cram.locator('.cram-item').count();
    const related = cram.locator('.note-related');
    ok(`${id}：考前必看至少 8 個重點且多數附相關題`, items >= 8 && await related.count() >= 7, { items, related: await related.count() });
    await related.first().locator(':scope > summary').click();
    await related.first().locator('[data-related-q]').first().waitFor({ timeout: 3000 }).catch(() => {});
    const link = related.first().locator('[data-related-q]').first();
    const qid = await link.getAttribute('data-related-q');
    await link.click();
    const modal = page.locator('.qpreview-modal');
    const shown = await modal.count() === 1 && await modal.evaluate((el, qid) => { const q = Store.Q[qid]; const clean = s => String(s).replace(/[\s*]/g, ''); return clean(el.textContent).includes(clean(q.stem).slice(0, 12)) && el.querySelectorAll('.qpreview-choice').length >= 2; }, qid);
    ok(`${id}：考前必看的相關題可開啟唯讀題目視窗`, shown, qid);
    await page.keyboard.press('Escape');
    const fs_ = page.locator(`[data-formula-pack="${id}"]`);
    ok(`${id}：筆記頁有「公式統整」`, await fs_.count() === 1);
  }

  out.errorsCount = out.errors.length;
  ok('沒有頁面錯誤', out.errors.length === 0, out.errors.slice(0, 5));
  fs.mkdirSync(path.join(ROOT, 'output', 'playwright'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'output', 'playwright', 'optom2-qa.json'), JSON.stringify(out, null, 1));
  const failed = out.checks.filter(c => !c.pass).length;
  console.log(`${out.checks.length - failed}/${out.checks.length} 通過`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });

