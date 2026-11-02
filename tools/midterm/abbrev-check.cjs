const { chromium } = require('playwright');
const path = require('path');
const { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../..');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  let failures = [];
  try {
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof QV !== 'undefined' && typeof LEARN_UI !== 'undefined');
    const backup = await page.evaluate(() => ({...localStorage}));
    await page.evaluate(() => App.go('learn'));
    try {
      const source = require('../../content/learn/eye_anat/lab-visual-path.json');
      const found = []; const walk = x => { if (!x || typeof x !== 'object') return; if (x.kind === 'name') found.push(x); Object.values(x).forEach(walk); }; walk(source);
      const sample = found.find(x => x.en.includes('LGN'));
      const ids = await page.evaluate(check => {
        const qs = Object.values(Store.Q);
        const lgn = qs.find(q => q.accept?.includes('外側膝狀體 / LGN'));
        const cn = qs.find(q => q.accept?.some(a => /^(外展神經|外旋神經) \/ CN VI$/.test(a)));
        return { lgn: lgn?.id, cn: cn?.id, cnZh: cn?.accept.find(a => a.endsWith(' / CN VI')).split(' / ')[0], check };
      }, sample);
      if (!ids.lgn || !ids.cn || !ids.check) throw Error('Required fixtures not found: ' + JSON.stringify(ids));
      for (const [id, zh, en, expected] of [[ids.lgn,'外側膝狀體','LGN',true],[ids.lgn,'外側膝狀體','MCA',false],[ids.cn,ids.cnZh,'CN VI',true],[ids.cn,ids.cnZh,'CN6',true],[ids.cn,ids.cnZh,'CN 6',true],[ids.cn,ids.cnZh,'CNVI',true]]) {
        const result = await page.evaluate(({id,zh,en}) => {
          const box = document.createElement('div'); document.body.appendChild(box); let result;
          QV.render(box, Store.Q[id], {onAnswer: r => result = r.ok});
          box.querySelector('[data-part=zh]').value = zh; box.querySelector('[data-part=en]').value = en;
          box.querySelector('.answers button').click(); box.remove(); return result;
        },{id,zh,en});
        if (result !== expected) failures.push(`${zh}/${en}: ${result}`);
      }
      const result = await page.evaluate(c => {
        const box = document.createElement('div'); document.body.appendChild(box); let result;
        LEARN_UI.renderCheck(box, c, {onDone: (first, ok) => result = ok});
        box.querySelector('[data-k=zh]').value = '外側膝狀體'; box.querySelector('[data-k=en]').value = 'LGN';
        box.querySelector('.lc-send').click(); box.remove(); return result;
      }, ids.check);
      if (result !== true) failures.push('lab learn LGN: ' + result);
    } finally { await page.evaluate(saved => { localStorage.clear(); Object.entries(saved).forEach(([k,v]) => localStorage.setItem(k,v)); }, backup); }
  } finally { await ctx.close(); await browser.close(); }
  console.log(`7 grading checks; ${failures.length} failures`); if (failures.length) { console.error(failures); process.exitCode = 1; }
})().catch(e => { console.error(e); process.exitCode = 1; });

