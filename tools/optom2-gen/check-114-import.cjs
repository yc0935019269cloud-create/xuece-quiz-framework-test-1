// 檢查 2026-10-26 補收的 46 題國考題（114 驗光生《驗光學概要》＋113／114 驗光師《視光學》漏收題）：
// 每題載入、題本路徑、逐題作答渲染與詳解、學習單元抽題池；headless Edge、file://、獨立 context，測後還原 localStorage。
// 用法（PowerShell）：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/optom2-gen/check-114-import.cjs
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), url = require('url');
const ROOT = path.resolve(__dirname, '../..');
const NEW = ["s114-optometry-exam114-u01-sp-rf-1", "s114-optometry-exam114-u01-sp-rf-5", "s114-optometry-exam114-u01-sp-rf-8", "s114-optometry-exam114-u01-sp-rf-9", "s114-optometry-exam114-u01-sp-rf-10", "s114-optometry-exam114-u01-sp-rf-34", "s114-optometry-exam114-u01-sp-rf-35", "s114-optometry-exam114-u01-sp-rf-37", "s114-optometry-exam114-u02-sp-rf-3", "s114-optometry-exam114-u02-sp-rf-29", "s114-optometry-exam114-u03-sp-rf-21", "s114-optometry-exam114-u05-sp-rf-23", "s114-optometry-exam114-u05-sp-rf-24", "s114-optometry-exam114-u05-sp-rf-25", "s114-optometry-exam114-u06-sp-rf-27", "s114-optometry-exam114-u06-sp-rf-30", "s114-optometry-exam114-u07-sp-rf-18", "s114-optometry-exam114-u09-sp-rf-41", "s114-optometry-exam114-u09-sp-rf-42", "s114-optometry-exam114-u09-sp-rf-45", "s114-optometry-exam114-u09-sp-rf-49", "s114-optometry-exam114-u09-sp-rf-50", "optom2-exam-u2-114-sp-2", "optom2-exam-u2-114-sp-6", "optom2-exam-u2-114-sp-31", "optom2-exam-u2-114-sp-33", "optom2-exam-u2-114-sp-36", "optom2-exam-u2-114-sp-38", "optom2-exam-u2-114-sp-40", "optom2-exam-u4-114-sp-32", "optom2-exam-u4-114-sp-39", "s114-optometry-exam113-u01-vh-op-3", "s114-optometry-exam113-u01-vh-op-5", "s114-optometry-exam113-u01-vh-op-20", "s114-optometry-exam114-u01-vh-op-3", "s114-optometry-exam114-u01-vh-op-5", "s114-optometry-exam114-u01-vh-op-7", "s114-optometry-exam114-u02-vh-op-19", "s114-optometry-exam114-u02-vh-op-26", "s114-optometry-exam114-u04-vh-op-42", "s114-optometry-exam114-u07-vh-op-11", "s114-optometry-exam114-u09-vh-op-28", "s114-optometry-exam114-u09-vh-op-29", "optom2-exam-u2-113-vh-18", "optom2-exam-u2-114-vh-24", "optom2-exam-u2-114-vh-25"];
(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true });
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(url.pathToFileURL(path.join(ROOT, 'index.html')).href);
  await page.waitForFunction(() => typeof QV !== 'undefined' && typeof LEARN_UI !== 'undefined');
  const backup = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  const res = await page.evaluate(src => {
    const qs = src.map(id => Store.Q[id]).filter(Boolean);
    const out = { n: qs.length, missing: src.filter(id => !Store.Q[id]), bad: [], sets: {}, paths: {} };
    qs.forEach(q => {
      const ex = Store.EX[q.exam]; out.sets[q.exam] = (out.sets[q.exam] || 0) + 1; out.paths[q.exam] = (ex.path || []).join(' › ');
      const box = document.createElement('div'); document.body.appendChild(box);
      try {
        const ctl = QV.render(box, q, { onAnswer() {} });
        const opts = box.querySelectorAll('.opt');
        if (opts.length !== 4 || !/【.*第 \d+ 題】/.test(box.textContent)) out.bad.push(q.id + ' 選項/出處');
        box.querySelector(`.opt[data-l="${q.key}"]`).click();
        if (!/答對/.test(box.textContent) || !/出處/.test(box.textContent)) out.bad.push(q.id + ' 判分/詳解');
        ctl.destroy();
      } catch (e) { out.bad.push(q.id + ' ' + e.message); }
      box.remove();
    });
    // 學習單元抽題池：第 03 單元複習課實戰、視光學二 MSR／雙眼平衡 banks
    const pk = id => LEARN_UI.packs.find(p => p.id === id);
    const ret = pk('s114-optometry-retinoscopy-intro'), u2 = pk('optom2-u2-msr'), u4 = pk('optom2-u4-bb');
    out.banks = { ret: ret.banks.includes('s114-optometry-exam114-u03'), u2: u2.banks.includes('optom2-exam-u2-114-sp'), u4: u4.banks.includes('optom2-exam-u4-114-sp') };
    const pickIds = ret.lessons.flatMap(l => l.steps).filter(s => s.pick && s.pick.ids).flatMap(s => s.pick.ids);
    out.retPick = pickIds.filter(id => id.startsWith('s114-optometry-exam114-u03')).length;
    out.year114 = Store.filter({ subjects: ['optometry'], years: [114] }).length;
    return out;
  }, NEW);
  await page.evaluate(b => { localStorage.clear(); for (const [k, v] of Object.entries(b)) localStorage.setItem(k, v); }, backup);
  res.errors = errors; res.restored = await page.evaluate(b => localStorage.length === Object.keys(b).length, backup);
  console.log(JSON.stringify(res, null, 1));
  await browser.close();
})();
