// Disposable Edge file:// test. Baseline captured before rewriting: 111 sets, 483 questions.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../..');
const out = { baseline: { sets: 111, questions: 483 }, checks: [], errors: [] };
function check(name, pass, actual) { out.checks.push({ name, pass: !!pass, actual }); }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  page.on('pageerror', e => out.errors.push(String(e)));
  try {
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => typeof Screens !== 'undefined' && typeof Store !== 'undefined' && Store.profile);
    const backup = await page.evaluate(() => ({ ...localStorage }));
    const screensSource = fs.readFileSync(path.join(root, 'js/screens.js'), 'utf8');
    const newsBlock = screensSource.match(/const NEWS = \[([\s\S]*?)\n  \];/);
    if (!newsBlock) throw new Error('NEWS list not found');
    const newsIds = [...newsBlock[1].matchAll(/\{\s*id:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
    if (!newsIds.length) throw new Error('NEWS ids not found');
    await page.evaluate(ids => { Store.profile.starterPicked = true; Store.profile.newsSeen = ids; Store.saveProfile(); }, newsIds);
    await page.reload();
    await page.waitForFunction(() => typeof Screens !== 'undefined' && typeof Store !== 'undefined' && Store.profile);
    await page.evaluate(() => U.clearModals());
    await page.evaluate(() => { Store.profile.abyssCfg = { subjects: ['eye_ans'], exams: [] }; Screens.abyss(); });
    await page.evaluate(() => U.clearModals());
    const rootNode = page.locator('#fy details[data-key="eye_ans/115 大二上"]');
    await rootNode.locator(':scope > summary').click();
    const names = node => node.locator(':scope > .st-body > details > summary > .st-name').allTextContents();
    const main = ['眼球自主神經系統', '角膜', '眼球血液供應', '房水與睫狀體', '老師隨堂考', '答案疑義（要自己勾選才會出題）'];
    check('大單元及順序', eq(await names(rootNode), main), await names(rootNode));
    const groups = [
      ['眼球自主神經系統', ['自主神經總論', '眼部自主神經路徑', '三叉神經與眼眶通道', '瞳孔與調節反射', '腦幹神經核與臨床表現'], 6],
      ['角膜', ['角膜總論', '角膜五層構造', '角膜的營養、神經與臨床應用'], 4],
      ['眼球血液供應', ['眼部動脈與靜脈', '睫狀動脈系統與視神經血供', '視網膜與脈絡膜血液供應'], 0]
    ];
    for (const [name, expected, own] of groups) {
      const node = page.locator(`#fy details[data-key="eye_ans/115 大二上/${name}"]`);
      check(`${name} 子單元`, eq(await names(node), expected), await names(node));
      check(`${name} 直屬題本`, await node.locator(':scope > .st-body > .st-sets > .chip').count() === own, await node.locator(':scope > .st-body > .st-sets > .chip').count());
    }
    const totals = await page.evaluate(() => { const a = QB.exams.filter(e => e.subj === 'eye_ans' && e.path.includes('115 大二上')); return { sets: a.length, questions: a.reduce((n, e) => n + e.count, 0) }; });
    check('改動前後題本及題數', eq(totals, out.baseline), totals);
    const parentIds = await rootNode.locator(':scope > summary [data-pick]').getAttribute('data-pick');
    const disputed = await page.evaluate(() => QB.exams.find(e => e.id === 'eye115-disputed'));
    check('上層全選排除答案疑義', !!disputed && disputed.optIn && !parentIds.split(',').includes(disputed.id));
    const cornea = page.locator('#fy details[data-key="eye_ans/115 大二上/角膜"]');
    const expectedIds = (await cornea.locator(':scope > summary [data-pick]').getAttribute('data-pick')).split(',').sort();
    await cornea.locator(':scope > summary [data-pick]').click();
    const picked = (await page.locator('#fy .chip.on[data-v]').evaluateAll(es => es.map(e => e.dataset.v))).sort();
    const actualCornea = await page.evaluate(() => QB.exams.filter(e => e.subj === 'eye_ans' && e.path.includes('115 大二上') && e.path.includes('角膜')).map(e => e.id).sort());
    check('角膜全選只選且選完角膜題本', eq(picked, actualCornea) && eq(expectedIds, actualCornea), { selected: picked.length, expected: actualCornea.length });
    await page.locator('#fy [data-year="108"]').click();
    const filtered = await page.locator('#fy .chip[data-v]').evaluateAll(es => es.map(e => e.dataset.v));
    const yearCheck = await page.evaluate(ids => ids.length > 0 && ids.every(id => Store.EX[id].path.some(x => /^108\s*年(國考)?$/.test(x))), filtered);
    check('108 年篩選', yearCheck, { visible: filtered.length });
    check('年份篩選維持角膜選取', await page.locator('#fy .chip.on[data-v]').count() > 0);
    check('沒有頁面錯誤', out.errors.length === 0, out.errors);
    await page.evaluate(saved => { localStorage.clear(); for (const [k, v] of Object.entries(saved)) localStorage.setItem(k, v); }, backup);
  } catch (e) { out.errors.push(String(e.stack || e)); check('測試順利執行', false, String(e)); }
  await ctx.close(); await browser.close();
  out.passed = out.checks.filter(x => x.pass).length; out.total = out.checks.length;
  fs.writeFileSync(path.join(root, 'docs/eye115-bank-tree-qa.json'), JSON.stringify(out, null, 2) + '\n');
  console.log(`${out.passed}/${out.total}`, JSON.stringify(out.checks.filter(x => !x.pass)));
  if (out.passed !== out.total || out.errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
