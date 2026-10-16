// 眼解剖（115 大二上）國考題與學習單元檢查：資料完整性＋瀏覽器實際渲染
// 執行：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/eye115-qa/check.cjs
// 使用一次性 headless Edge context（不碰使用者的瀏覽器存檔），結果寫到 output/playwright/eye115-qa.json
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const OLD = ['ans-basics', 'ans-pathways', 'ans-trigeminal', 'ans-reflex', 'ans-clinical', 'cornea-general', 'cornea-layers', 'cornea-supply'];
const BLOOD = ['blood-vessels', 'blood-ciliary', 'blood-retina'];
const out = { checks: [], errors: [] };
const ok = (name, pass, extra) => { out.checks.push({ name, pass: !!pass, extra }); if (!pass) console.log('FAIL', name, extra || ''); };
(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true, executablePath: process.env.PW_EXE || undefined });
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => out.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') out.errors.push(m.text()); });
  await page.route('http://127.0.0.1:18769/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
  await page.goto(URL);
  await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
  await page.evaluate(() => { try { VOL.set('muted', true); } catch (e) {} });

  // 1. 題庫
  const bank = await page.evaluate(() => {
    const e = Object.values(Store.Q).filter(q => /^eye115-exam-/.test(q.id)), l = Object.values(Store.Q).filter(q => /^eyelab-exam-/.test(q.id));
    const quiz = Object.values(Store.Q).filter(q => /^eye-quiz-blood-supply-/.test(q.id));
    return { e: e.length, l: l.length, quiz: quiz.length, noEx: e.concat(l).filter(q => !q.ex || q.ex.length < 25).length, noAns: e.concat(l).filter(q => q.a == null && q.ans == null).length };
  });
  ok('眼解剖國考題載入（eye115 共 230）', bank.e === 230, bank);
  ok('實驗用國考補充題載入（eyelab 共 52）', bank.l === 52, bank);
  ok('國考題每題都有詳解', bank.noEx === 0, bank);
  ok('老師隨堂考 29 題仍在', bank.quiz === 29, bank);

  // 2. 單元資料
  const data = await page.evaluate((ids) => ids.map(id => {
    const p = LEARN_UI.packs.find(x => x.id === id); if (!p) return { id, missing: true };
    const rev = p.lessons.filter(l => /^國考重點複習/.test(l.title));
    const cards = []; rev.forEach(l => l.steps.forEach(s => { if (s.type === 'card') cards.push({ l: l.id, t: s.title, exam: (s.exam || []).length, demo: !!s.demo }); }));
    const allCards = []; p.lessons.forEach(l => l.steps.forEach(s => { if (s.type === 'card') allCards.push({ l: l.id, t: s.title, exam: (s.exam || []).length }); }));
    const pr = rev.flatMap(l => l.steps.filter(s => s.type === 'practice'));
    return { id, lessons: p.lessons.length, rev: rev.length, cards, allCards, cram: ((p.notes || []).find(n => n.kind === 'exam-cram') || {}).items ? (p.notes.find(n => n.kind === 'exam-cram').items.length) : 0, pooled: pr.filter(s => (s.pick.ids || []).length > 0).length, pr: pr.length };
  }), OLD.concat(BLOOD));
  for (const d of data) {
    ok(`${d.id} 存在`, !d.missing); if (d.missing) continue;
    ok(`${d.id}：有「國考重點複習」課`, d.rev >= 1, d.rev);
    ok(`${d.id}：複習課每張概念卡都有 🎯 與 ✏️`, d.cards.every(c => c.exam && c.demo), d.cards.filter(c => !(c.exam && c.demo)).map(c => c.l + ':' + c.t));
    ok(`${d.id}：全部概念卡都有國考重點`, d.allCards.every(c => c.exam), d.allCards.filter(c => !c.exam).map(c => c.l + ':' + c.t));
    ok(`${d.id}：考前必看 ≥ 2 個重點`, d.cram >= 2, d.cram);
    ok(`${d.id}：複習課實戰抽題池非空`, d.pooled === d.pr, { pr: d.pr, pooled: d.pooled });
  }
  // 3. 筆記頁
  await page.evaluate(() => App.go('learn', { tab: 'notes' }));
  await page.waitForTimeout(600);
  await page.click('#nOpenAll');
  for (const id of ['cornea-layers', 'blood-ciliary', 'ans-reflex']) {
    const cram = page.locator(`[data-cram-pack="${id}"]`);
    ok(`${id}：筆記頁有考前必看`, await cram.count() === 1); if (await cram.count() !== 1) continue;
    if (!(await cram.evaluate(d => d.open))) await cram.locator(':scope > summary').click();
    const related = cram.locator('.note-related');
    ok(`${id}：考前必看附相關題`, await related.count() >= 2, await related.count());
    await related.first().locator(':scope > summary').click();
    const link = related.first().locator('[data-related-q]').first();
    await link.waitFor({ timeout: 3000 }).catch(() => {});
    const qid = await link.getAttribute('data-related-q');
    await link.click();
    const modal = page.locator('.qpreview-modal');
    ok(`${id}：相關題可開啟唯讀題目視窗`, await modal.count() === 1, qid);
    await page.keyboard.press('Escape');
  }
  out.errorsCount = out.errors.length;
  ok('沒有頁面錯誤', out.errors.length === 0, out.errors.slice(0, 5));
  fs.mkdirSync(path.join(ROOT, 'output', 'playwright'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'output', 'playwright', 'eye115-qa.json'), JSON.stringify(out, null, 1));
  const failed = out.checks.filter(c => !c.pass).length;
  console.log(`${out.checks.length - failed}/${out.checks.length} 通過`);
  await browser.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
