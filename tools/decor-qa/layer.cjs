// Layer order and flip in camp decorate mode (shop items and base objects).
// Disposable Edge context, file://, 1100px and 390px. Run: NODE_PATH=E:\NEWTEST\skull-atlas-3d\node_modules node tools/decor-qa/layer.cjs
const { chromium } = require('playwright');
const path = require('path'), url = require('url'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const results = [], errors = [];
const ok = (name, pass, info) => { results.push({ name, pass: !!pass, info }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass || !info ? '' : ' ' + JSON.stringify(info))); };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  for (const width of [1100, 390]) {
    const tag = `[${width}]`;
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(tag + ' ' + String(e)));
    const goto = async () => {
      await page.goto(url.pathToFileURL(path.join(ROOT, 'index.html')).href);
      await page.waitForFunction(() => typeof App !== 'undefined' && typeof DECOR !== 'undefined' && typeof Store !== 'undefined');
      await page.evaluate(() => { U.clearModals(); App.go('hub'); U.clearModals(); });
    };
    await goto();
    const backup = await page.evaluate(() => JSON.stringify(Object.assign({}, localStorage)));
    await page.evaluate(() => {
      const p = Store.profile; p.starterPicked = true; p.pets.luckycat = p.pets.luckycat || { lv: 1, xp: 0 }; p.activePet = 'luckycat';
      p.newsSeen = (typeof Screens !== 'undefined' && Screens.NEWS ? Screens.NEWS.map(n => n.id) : p.newsSeen) || p.newsSeen;
      const d = DECOR.ensure(); d.placed = []; d.base = {}; d.scene = 'classic';
      const it = DECOR.data().items[0]; d.shards[it.id] = 99;
      Store.saveProfile();
    });
    await goto();
    const order = () => page.evaluate(() => [...document.querySelectorAll('#camp .decor-obj, #camp .camp-obj[data-base]')].map(e => e.dataset.base || 'item:' + e.dataset.k));
    const def = await order();
    ok(`${tag} default order: pond first, hero and pet last`, def[0] === 'pond' && ['hero', 'pet'].includes(def[def.length - 1]) && ['hero', 'pet'].includes(def[def.length - 2]), def);
    ok(`${tag} all objects stay at z-index <= 3 (below camp effects)`, await page.evaluate(() => [...document.querySelectorAll('#camp .decor-obj, #camp .camp-obj[data-base]')].every(e => +getComputedStyle(e).zIndex <= 3)));

    await page.click('#decorEdit');
    // place one shop item behind the hero
    const k = await page.evaluate(() => { const o = DECOR.place(DECOR.data().items[0].id, 0.3, 0.2); return o && o.k; });
    await page.evaluate(() => { document.querySelector('#decorEdit').click(); document.querySelector('#decorEdit').click(); });
    const select = sel => page.evaluate(sel => {
      const el = document.querySelector(sel), b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
      const o = { bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1, clientX: x, clientY: y };
      el.dispatchEvent(new PointerEvent('pointerdown', o)); el.dispatchEvent(new PointerEvent('pointerup', o));
    }, sel);
    const btn = name => page.evaluate(name => { const b = document.querySelector(`#decorDrawer [data-layer="${name}"]`) || (name === 'flip' && document.querySelector('#dcFlip')); if (!b) return false; b.click(); return true; }, name);

    await select(`.decor-obj[data-k="${k}"]`);
    const itemBtns = await page.evaluate(() => ({ layer: document.querySelectorAll('#decorDrawer [data-layer]').length, flip: !!document.querySelector('#dcFlip'), del: !!document.querySelector('#dcDel') }));
    ok(`${tag} shop item selected: flip, 4 layer buttons and remove`, itemBtns.layer === 4 && itemBtns.flip && itemBtns.del, itemBtns);
    await btn('top');
    let o1 = await order();
    ok(`${tag} item 最前 puts it last in stacking order`, o1[o1.length - 1] === 'item:' + k, o1);
    await btn('bottom');
    o1 = await order();
    ok(`${tag} item 最後 puts it first in stacking order`, o1[0] === 'item:' + k, o1);
    await btn('up');
    o1 = await order();
    ok(`${tag} item 往前一層 moves it up`, o1.indexOf('item:' + k) > 0, o1);
    const before = o1.indexOf('item:' + k);
    await btn('down');
    o1 = await order();
    ok(`${tag} item 往後一層 moves it down`, o1.indexOf('item:' + k) < before, o1);
    await btn('flip');
    ok(`${tag} item flip saved as o.f`, await page.evaluate(k => DECOR.ensure().placed.find(o => o.k === k).f === 1, k));

    await select('#cFire');
    const baseBtns = await page.evaluate(() => ({ layer: document.querySelectorAll('#decorDrawer [data-layer]').length, flip: !!document.querySelector('#dcFlip'), del: !!document.querySelector('#dcDel') }));
    ok(`${tag} base object selected: flip and 4 layer buttons, no remove`, baseBtns.layer === 4 && baseBtns.flip && !baseBtns.del, baseBtns);
    await btn('flip');
    ok(`${tag} campfire flip uses scale and saves base.fire.f`, await page.evaluate(() => document.querySelector('#cFire').style.scale === '-1 1' && DECOR.ensure().base.fire.f === 1));
    await btn('top');
    o1 = await order();
    ok(`${tag} campfire 最前 goes above hero and pet`, o1[o1.length - 1] === 'fire', o1);
    // drag keeps z and f (the old pointerup replaced the whole entry)
    await page.evaluate(() => {
      const el = document.querySelector('#cFire'), b = el.getBoundingClientRect(), x = b.left + b.width / 2, y = b.top + b.height / 2;
      const ev = (t, dx) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, button: 0, pointerType: 'mouse', pointerId: 1, clientX: x + dx, clientY: y }));
      ev('pointerdown', 0); ev('pointermove', 10); ev('pointermove', 30); ev('pointerup', 30);
    });
    const fireSave = await page.evaluate(() => DECOR.ensure().base.fire);
    ok(`${tag} dragging after flip/layer keeps z and f`, fireSave && fireSave.f === 1 && Number.isFinite(fireSave.z) && Number.isFinite(fireSave.x), fireSave);

    if (await page.evaluate(() => !!document.querySelector('#cPet'))) {
      await select('#cPet');
      await btn('flip');
      ok(`${tag} pet flip is a data flag (walk flip still works)`, await page.evaluate(() => document.querySelector('#cPet').dataset.f === '1' && !document.querySelector('#cPet').style.scale && DECOR.ensure().base.pet.f === 1));
      ok(`${tag} selected pet is not lowered in edit mode`, await page.evaluate(() => getComputedStyle(document.querySelector('#cPet')).zIndex === '2'));
    }
    await select('#cHero');
    await btn('bottom');
    o1 = await order();
    ok(`${tag} hero 最後 goes to the back`, o1[0] === 'hero', o1);
    const saved = await page.evaluate(() => JSON.stringify(DECOR.ensure().base));
    const ordSaved = await order();
    await page.screenshot({ path: path.join(ROOT, 'output', 'playwright', `decor-${width}-layer.png`) });

    await goto();
    const o2 = await order();
    ok(`${tag} order and flips survive reload`, JSON.stringify(o2) === JSON.stringify(ordSaved) && await page.evaluate(s => JSON.stringify(DECOR.ensure().base) === s && document.querySelector('#cFire').style.scale === '-1 1', saved), { o2, ordSaved });
    ok(`${tag} hero stays at the back outside edit mode (z-index 2, first in DOM)`, o2[0] === 'hero' && await page.evaluate(() => getComputedStyle(document.querySelector('#cHero')).zIndex === '2'));

    await page.click('#decorEdit');
    await page.click('#dcResetBase'); await page.click('.modal .px-btn.gold');
    const o3 = await order();
    ok(`${tag} reset clears base and item layer keys, default order back`, await page.evaluate(() => Object.keys(DECOR.ensure().base).length === 0 && DECOR.ensure().placed.every(o => o.z === undefined) && !document.querySelector('#cFire').style.scale) && o3[0] === 'pond' && ['hero', 'pet'].includes(o3[o3.length - 1]), o3);
    ok(`${tag} reset keeps item flip and position`, await page.evaluate(k => { const o = DECOR.ensure().placed.find(o => o.k === k); return o && o.f === 1 && o.x === 0.3; }, k));

    await page.evaluate(b => { localStorage.clear(); const o = JSON.parse(b); for (const k in o) localStorage.setItem(k, o[k]); }, backup);
    await ctx.close();
  }
  ok('no page errors', errors.length === 0, errors);
  await browser.close();
  const pass = results.filter(r => r.pass).length;
  fs.writeFileSync(path.join(ROOT, 'docs', 'decor', 'layer-qa.json'), JSON.stringify({ date: new Date().toISOString(), pass, total: results.length, results }, null, 1));
  console.log(`\n${pass}/${results.length} passed`);
})();
