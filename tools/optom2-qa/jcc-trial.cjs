// 單課試作檢查：file://、桌機與 390px、四題判分、圖片與收合／放大。
// NODE_PATH=E:/NEWTEST/skull-atlas-3d/node_modules node tools/optom2-qa/jcc-trial.cjs
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const assert = require('assert').strict;
const ROOT = path.resolve(__dirname, '../..');
const REL = 'content/learn/optometry/optom2/optom2-u2-msr.json';
const original = JSON.parse(execFileSync('git', ['show', '22cfdff:' + REL], { cwd: ROOT, encoding: 'utf8' }));
const edited = JSON.parse(fs.readFileSync(path.join(ROOT, REL), 'utf8'));
const old = original.lessons.find(l => l.id === 'l4'), lesson = edited.lessons.find(l => l.id === 'l4');
const select = l => l.steps.filter(s => ['check', 'example', 'practice'].includes(s.type));
const flashes = l => l.steps.flatMap(s => Array.isArray(s.flash) ? s.flash : s.flash ? [s.flash] : []);
assert.deepEqual(select(old), select(lesson));
const oldFlashes = flashes(old);
for (const f of oldFlashes) if (f.front === '±0.25 JCC 兩面比較，散光間距差多少？')
  f.back = '本課例子：剩餘散光1.00 D、方向對準、COLC在網膜，翻±0.25 JCC得到0.50與1.50 D，相差1.00 D。不是所有條件都固定差1.00 D。';
assert.deepEqual(oldFlashes, flashes(lesson));
assert.deepEqual({ ...original, lessons: null }, { ...edited, lessons: null });
const examRefs = l => new Set((JSON.stringify(l).match(/\d{3} (?:生普|生特|師高|師特) \d+/g) || []));
for (const ref of examRefs(old)) assert(examRefs(lesson).has(ref), 'Missing exam reference: ' + ref);
const report = { intact: 'Sample checks/example/practice and flash fronts unchanged; one flash back qualified with the example conditions. Other lessons audited separately.', renders: 0, graded: 0, zoom: 0, issues: [] };
report.examReferences = examRefs(old).size;
report.focusStates = 0;
report.flipStates = 0;
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const LEAK = /\[\[img\]\]|^\s*:::|\{[obgrpy]:|\[!(big|tip|warn|why|key|note|exam)\]/m;

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [1000, 390]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await ctx.newPage();
      page.on('pageerror', e => report.issues.push(`${width}: ${e}`));
      await page.goto(URL);
      await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
      const backup = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
      try {
        const key = await page.evaluate(() => SKEY('learn'));
        for (let si = 0; si < lesson.steps.length; si++) {
          const step = lesson.steps[si];
          await page.evaluate(({ key, si }) => {
            const D = { les: {}, rev: {}, cfg: { battle: false, open: {} }, stat: {} };
            D.les['optom2-u2-msr/l4'] = { i: si, done: 0, best: 0, run: { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() } };
            localStorage.setItem(key, JSON.stringify(D));
          }, { key, si });
          await page.reload();
          await page.waitForFunction(() => typeof App !== 'undefined' && document.querySelector('#screen .panel'));
          await page.evaluate(() => { VOL.set('muted', true); App.go('learn', { pack: 'optom2-u2-msr' }); });
          await page.click('[data-play="3"]');
          await page.locator('#lpBody').waitFor();
          await page.waitForFunction(() => [...document.querySelectorAll('#lpBody img')].every(i => i.complete));
          const r = await page.evaluate(() => ({
            text: document.querySelector('#lpBody').innerText,
            overflow: document.documentElement.scrollWidth - innerWidth,
            broken: [...document.querySelectorAll('#lpBody img')].filter(i => !i.naturalWidth).map(i => i.getAttribute('src')),
            cols: [...document.querySelectorAll('#lpBody .md-cols')].map(e => e.getBoundingClientRect().width),
          }));
          report.renders++;
          if (r.text.trim().length < 10 || LEAK.test(r.text) || r.overflow > 1 || r.broken.length)
            report.issues.push({ width, si, r });
          if (step.title === 'JCC 字母視標：照這五步選') {
            const labels = await page.locator('#lpBody table td:first-child strong').evaluateAll(es => es.map(e => {
              const range = document.createRange(); range.selectNodeContents(e);
              return { text: e.textContent, lines: new Set([...range.getClientRects()].map(r => Math.round(r.top))).size };
            }));
            if (labels.length !== 5 || labels.some(l => l.lines !== 1)) report.issues.push({ width, si, verticalLabels: labels });
          }
          if (step.type === 'check') {
            if (step.kind === 'fill') {
              await page.locator('#lpBody .lc-in').fill(step.answer[0]);
              await page.locator('#lpBody .lc-ans button').click();
            } else {
              const index = step.answer.charCodeAt(0) - 65;
              await page.locator(`#lpBody .lc-opt[data-i="${index}"]`).click();
            }
            const verdict = await page.locator('#lpBody .verdict').innerText();
            if (!verdict.includes('答對')) report.issues.push({ width, si, verdict });
            report.graded++;
          }
          if (step.type === 'interactive' && step.html.includes('data-jcc-state')) {
            const frame = page.frameLocator('#lpBody iframe');
            const expected = [['original', 30, '1.00'], ['cancel', 15, '0.50'], ['reinforce', 45, '1.50']];
            for (const [state, expectedRadius, expectedGap] of expected) {
              await frame.locator(`[data-jcc-state="${state}"]`).click();
              const r = await frame.locator('body').evaluate(e => ({
                radius: +e.querySelector('#blurCircle').getAttribute('r'),
                equation: e.querySelector('#equation').textContent,
                selected: e.querySelectorAll('button[aria-pressed=true]').length,
                overflowX: document.documentElement.scrollWidth - innerWidth,
                overflowY: document.documentElement.scrollHeight - innerHeight,
              }));
              if (Math.abs(r.radius - expectedRadius) > .01 || !r.equation.endsWith(expectedGap + ' D') || r.selected !== 1 || r.overflowX > 1 || r.overflowY > 1)
                report.issues.push({ width, state, flip: r });
              report.flipStates++;
              if (state === 'cancel') await page.locator('#lpBody').screenshot({ path: path.join(ROOT, `output/playwright/jcc-bridge-flip-${width}.png`) });
            }
          } else if (step.type === 'interactive') {
            const frame = page.frameLocator('#lpBody iframe');
            for (let position = 0; position < 3; position++) {
              await frame.locator(`button[data-position="${position}"]`).click();
              const r = await frame.locator('body').evaluate(e => {
                const spot = e.querySelector('#spot');
                return {
                  rx: +spot.getAttribute('rx'), ry: +spot.getAttribute('ry'),
                  heading: e.querySelector('#heading').textContent,
                  selected: e.querySelectorAll('button[aria-pressed=true]').length,
                  overflowX: document.documentElement.scrollWidth - innerWidth,
                  overflowY: document.documentElement.scrollHeight - innerHeight,
                };
              });
              const shapeOK = position === 0 ? r.rx < r.ry / 10 : position === 1 ? Math.abs(r.rx - r.ry) < 0.01 : r.ry < r.rx / 10;
              if (!shapeOK || r.selected !== 1 || r.overflowX > 1 || r.overflowY > 1) report.issues.push({ width, position, focus: r });
              report.focusStates++;
              if (position === 1) await page.locator('#lpBody').screenshot({ path: path.join(ROOT, `output/playwright/jcc-zero-interactive-${width}-middle.png`) });
            }
          }
          if (step.img) {
            await page.locator('#lpBody img.lp-img').click();
            await page.locator('.img-zoom').waitFor();
            await page.keyboard.press('Escape');
            await page.locator('.img-zoom').waitFor({ state: 'detached' });
            report.zoom++;
          }
        }
      } finally {
        await page.evaluate(backup => { localStorage.clear(); for (const [k, v] of Object.entries(backup)) localStorage.setItem(k, v); }, backup);
        await ctx.close();
      }
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(ROOT, 'output/playwright/jcc-trial-qa.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (report.issues.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
