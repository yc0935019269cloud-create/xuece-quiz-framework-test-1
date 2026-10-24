/* Actual UI routes in disposable Edge contexts. Needs completed hero assets/registry.
 * NODE_PATH=E:/NEWTEST/skull-atlas-3d/node_modules node tools/check_hero_expansion_routes.cjs
 * Each context's localStorage snapshot lives in Node and is restored in finally after reloads.
 */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const url = process.env.HERO_TEST_URL || pathToFileURL(path.join(root, 'index.html')).href;
const out = path.join(root, 'docs/hero-art/expansion-routes-qa.json');
const shots = path.join(root, 'output/playwright');
fs.mkdirSync(shots, { recursive: true });
const report = { url, widths: [], checks: [], pageErrors: [], storageRestored: [], pixelReadUnavailable: [],
  limits: 'Disposable desktop Edge contexts at 1000/390px, file:// by default; not physical iPad or live cloud sync.' };
const newClasses = ['assassin', 'monk', 'bard'];
const allClasses = ['knight', 'mage', 'ranger', 'cleric', 'berserker', ...newClasses];
function ok(condition, label) { assert.ok(condition, label); report.checks.push(label); }
async function boot(page) {
  await page.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' && typeof HeroAnim !== 'undefined' && document.querySelector('#cHero, .modal-bg'));
  await page.evaluate(() => { SFX.play = () => {}; BGM.play = () => {}; });
}
async function avatar(page, selector, id, label) {
  const loc = page.locator(selector).first();
  await loc.scrollIntoViewIfNeeded();
  await page.waitForFunction(({ selector, id }) => document.querySelector(selector)?.dataset.heroActor === id, { selector, id });
  const state = await loc.evaluate(async el => {
    const actor = HeroAnim.get(el.dataset.heroActor), loaded = await HeroAnim.load(actor).ready;
    if (loaded.status !== 'ready') return { loaded: loaded.status };
    await HeroAnim.frame(el, 0);
    const cv = el.querySelector('canvas');
    const state = { loaded: loaded.status, pose: cv.dataset.pose, actor: el.dataset.heroActor,
      naturalWidth: loaded.image.naturalWidth, naturalHeight: loaded.image.naturalHeight };
    try {
      const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let alpha = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) alpha++;
      return { ...state, alpha };
    } catch (e) {
      if (location.protocol !== 'file:' || e.name !== 'SecurityError') throw e;
      return { ...state, pixelReadUnavailable: 'file:// canvas origin restriction' };
    }
  });
  if (state.pixelReadUnavailable) {
    report.pixelReadUnavailable.push({ label, reason: state.pixelReadUnavailable });
    await loc.screenshot({ path: path.join(shots, 'hero-expansion-route-' + label.replace(/[^a-zA-Z0-9_-]+/g, '-') + '.png'), animations: 'disabled' });
  }
  ok(state.loaded === 'ready' && state.pose === '0' && state.actor === id && state.naturalWidth > 0 && state.naturalHeight > 0 &&
    (state.pixelReadUnavailable || state.alpha > 300), label + ' actual default pose renders');
}
async function closeModal(page) { await page.locator('#modalRoot .modal-bg').last().locator('button.close').click(); }
async function wardrobe(page, cls) {
  await page.evaluate(() => App.go('classes'));
  await page.locator('.class-card').nth(allClasses.indexOf(cls)).locator('button.pink').click();
}
async function injectLesson(page, cls) {
  return page.evaluate(cls => {
    const id = '__hero_routes_' + cls;
    LEARN_UI.packs.push({ id, title: 'QA角色路線驗證 ' + cls, subject: Object.keys(C.SUBJECTS)[0], level: 1, unit: 'QA',
      lessons: [{ id: 'route', title: '角色戰鬥驗證', goals: ['驗證角色外觀與實際檢核攻擊'], steps: [
        ...[1, 2, 3].map(i => ({ type: 'card', title: '角色暖身 ' + i, body: '閱讀後按繼續。' })),
        ...[1, 2, 3, 4].map(i => ({ type: 'check', id: id + '_q' + i, kind: 'single', q: '哪一項等於一加一？', choices: ['二', '三'], answer: 0, explain: '一加一等於二。' })),
        { type: 'recap', title: '驗證完成', body: '測試課程，不寫入正式教材。', flash: [] }
      ] }] });
    LEARN_UI.reindex(); App.go('learn', { pack: id }); return id;
  }, cls);
}
async function runWidth(browser, width) {
  const context = await browser.newContext({ viewport: { width, height: 920 } });
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', e => report.pageErrors.push({ width, message: e.message }));
  let backup = null;
  try {
    await page.goto(url); await boot(page);
    backup = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
    await page.evaluate(() => {
      VOL.set('muted', true); Store.profile.starterPicked = true; Store.profile.gems = 5000;
      Store.profile.classes = { knight: { lv: 1, xp: 0 } }; Store.profile.activeClass = 'knight';
      Store.profile.heroSkin = {}; Store.profile.ownedHeroSkins = []; Store.profile.skinVouchers = 5;
      Store.profile.abyssCfg = { subjects: Object.keys(C.SUBJECTS), exams: [], types: ['single'], pref: 'rand', pref2: true, diff: 0 };
      Store.profile.giftsClaimed = (Store.profile.giftsClaimed || []).concat(['__hero_routes_fixture']);
      Store.settings.campFolded = false; Store.saveProfile(); Store.saveSettings(); App.go('classes');
    });
    ok(await page.locator('.class-card').count() === 8, `${width}: all eight class cards render`);
    for (const cls of newClasses) {
      const prefix = `${width}/${cls}`;
      await page.evaluate(() => App.go('classes'));
      const cost = await page.evaluate(cls => C.cls(cls).cost, cls), before = await page.evaluate(() => Store.profile.gems);
      await page.locator('.class-card').nth(allClasses.indexOf(cls)).getByRole('button', { name: `解鎖（${cost} 魂晶）`, exact: true }).click();
      const unlocked = await page.evaluate(cls => ({ gems: Store.profile.gems, data: Store.profile.classes[cls] }), cls);
      ok(unlocked.gems === before - cost && unlocked.data.lv === 1 && unlocked.data.xp === 0, prefix + ' unlock deducts exact cost and creates class');
      await page.locator('.class-card').nth(allClasses.indexOf(cls)).getByRole('button', { name: '選擇此職業出征', exact: true }).click();
      ok(await page.evaluate(cls => Store.profile.activeClass === cls && Store.heroTile() === 'ha:px_' + cls + '_m1', cls), prefix + ' selection uses male default');
      await page.reload(); await boot(page);
      ok(await page.evaluate(cls => Store.profile.activeClass === cls && Store.profile.classes[cls].lv === 1, cls), prefix + ' unlocked class and selection persist reload');
      await avatar(page, '#cHero [data-hero-actor]', `px_${cls}_m1`, prefix + ' hub male');
      await wardrobe(page, cls);
      await page.locator('[data-hgroup="male"]').click(); ok(await page.locator('[data-sk]').count() === 8, prefix + ' male filter has eight');
      await page.locator('[data-hgroup="female"]').click(); ok(await page.locator('[data-sk]').count() === 8, prefix + ' female filter has eight');
      await page.locator('[data-hgroup="all"]').click(); ok(await page.locator('[data-sk]').count() === 16, prefix + ' all filter has sixteen');
      const freeBefore = await page.evaluate(() => Store.profile.gems);
      await page.locator(`[data-sk="px_${cls}_f1"]`).click();
      await avatar(page, '#hsk .big-stage [data-hero-actor]', `px_${cls}_f1`, prefix + ' female preview');
      ok(await page.locator('#hbuy').count() === 0, prefix + ' female default never offers paid purchase');
      await page.locator('#hwear').click();
      ok(await page.evaluate(({ cls, freeBefore }) => Store.profile.gems === freeBefore && Store.heroTile() === 'ha:px_' + cls + '_f1', { cls, freeBefore }), prefix + ' free female wear costs no gems');
      await closeModal(page); await page.evaluate(() => App.go('hub'));
      await avatar(page, '#cHero [data-hero-actor]', `px_${cls}_f1`, prefix + ' hub female');
      // Start a real abyss route through the visible setup action, preserving chosen class/skin.
      await page.evaluate(() => App.go('abyss'));
      const replacingRun = await page.evaluate(() => !!Store.loadRun());
      await page.locator('#go').click();
      if (replacingRun) await page.locator('#modalRoot').getByRole('button', { name: '確定', exact: true }).click();
      await page.locator('.mnode.avail').first().waitFor();
      ok(await page.locator('.mnode.avail').count() > 0, prefix + ' abyss start exposes real available nodes');
      await page.locator('.mnode.avail').first().click();
      if (await page.locator('#modalRoot .modal-bg').count()) await page.getByRole('button', { name: '迎戰！', exact: true }).click();
      await avatar(page, '#eHero [data-hero-actor]', `px_${cls}_f1`, prefix + ' abyss first battle');
      const answer = await page.evaluate(() => {
        // One-hit fixture keeps this navigation test bounded; the visible answer still resolves combat.
        CUR.p.atk = 1000000; CUR.p.crit = 0;
        return Store.Q[CUR.s.curQ].key[0];
      });
      await page.locator(`.opt[data-l="${answer}"]`).click();
      await page.waitForFunction(() => CUR.s.mon.hp <= 0 && document.querySelector('.next-btn')?.textContent.includes('怪物被擊敗'));
      await page.locator('.next-btn').click();
      await avatar(page, '.mnode.cur .me [data-hero-actor]', `px_${cls}_f1`, prefix + ' abyss map');
      ok(await page.evaluate(cls => CUR.s.cls === cls && Store.loadRun().cls === cls, cls), prefix + ' map run class is persisted');
      const fixture = await injectLesson(page, cls);
      await page.locator('[data-play="0"]').click();
      await avatar(page, '#lbHeroBody [data-hero-actor]', `px_${cls}_f1`, prefix + ' learning battle');
      await page.locator('#lpNext').click(); await page.locator('#lpNext').click(); await page.locator('#lpNext').click();
      await page.locator('.lc-opt[data-i="0"]').click();
      await page.waitForFunction(id => LEARN_UI.exportData().les[id + '/route']?.run?.ok === 1, fixture);
      const learned = await page.evaluate(id => LEARN_UI.exportData().les[id + '/route'].run, fixture);
      ok(learned.bt.combo === 1 && learned.bt.mon.hp < learned.bt.mon.max, prefix + ' actual learning answer records combo and damage');
      await page.waitForFunction(() => !document.querySelector('#lbUlt').disabled);
      await page.locator('#lbUlt').click();
      ok(await page.evaluate(id => LEARN_UI.exportData().les[id + '/route'].run.bt.ults === 1, fixture), prefix + ' real learning ultimate is cast');
      await page.screenshot({ path: path.join(shots, `hero-expansion-learning-${cls}-${width}.png`), fullPage: false, animations: 'disabled' });
      await page.evaluate(() => App.go('hub'));
      await page.locator('#voucherUse').click(); await page.locator(`[data-vc="${cls}"]`).click();
      ok(await page.locator(`[data-vs="px_${cls}_m1"], [data-vs="px_${cls}_f1"]`).count() === 0, prefix + ' vouchers exclude both free defaults');
      const voucherBefore = await page.evaluate(() => ({ gems: Store.profile.gems, n: Store.profile.skinVouchers }));
      await page.locator(`[data-vs="px_${cls}_f8"]`).click();
      await avatar(page, '#vch .big-stage [data-hero-actor]', `px_${cls}_f8`, prefix + ' voucher premium preview');
      await page.locator('#vredeem').click();
      ok(await page.evaluate(({ cls, voucherBefore }) => Store.profile.gems === voucherBefore.gems && Store.profile.skinVouchers === voucherBefore.n - 1 && Store.profile.ownedHeroSkins.includes(cls + ':px_' + cls + '_f8') && Store.heroTile() === 'ha:px_' + cls + '_f8', { cls, voucherBefore }), prefix + ' premium voucher wears and consumes only one ticket');
      await page.locator(`[data-vs="px_${cls}_f8"]`).click();
      ok(await page.locator('#vredeem').count() === 0, prefix + ' owned premium cannot redeem twice');
      await closeModal(page);
      await page.evaluate(() => App.go('hub'));
      await avatar(page, '#cHero [data-hero-actor]', `px_${cls}_f8`, prefix + ' premium hub');
    }
    // Existing no-cost actor also must not consume a voucher.
    await page.locator('#voucherUse').click(); await page.locator('[data-vc="knight"]').click();
    ok(await page.locator('[data-vs="px_knight_m2"]').count() === 0, `${width}: vouchers exclude existing free knight actor`);
    await closeModal(page);
    const expected = await page.evaluate(() => {
      const q = Object.values(Store.Q).find(q => q.type === 'single'); Store.record(q.id, true);
      const exported = Store.exportAll(), d = JSON.parse(exported);
      window.__routeExport = exported;
      return { q: q.id, qs: d.qs[q.id], heroSkin: d.profile.heroSkin, classes: d.profile.classes, owned: d.profile.ownedHeroSkins, gems: d.profile.gems, vouchers: d.profile.skinVouchers, learn: d.learn.les, run: d.run.cls };
    });
    await page.evaluate(() => { Store.profile.heroSkin = {}; Store.profile.ownedHeroSkins = []; Store.profile.skinVouchers = 0; Store.saveProfile(); Store.importAll(window.__routeExport); });
    await page.reload(); await boot(page);
    const actual = await page.evaluate(q => {
      const d = JSON.parse(Store.exportAll());
      return { q, qs: d.qs[q], heroSkin: d.profile.heroSkin, classes: d.profile.classes, owned: d.profile.ownedHeroSkins, gems: d.profile.gems, vouchers: d.profile.skinVouchers, learn: d.learn.les, run: d.run.cls };
    }, expected.q);
    assert.deepEqual(actual, expected); report.checks.push(`${width}: export/import and reload preserve classes, skins, tickets, question record, learning progress and run class`);
    ok(await page.evaluate(() => LEARN_UI.packs.every(p => !p.id.startsWith('__hero_routes_'))), `${width}: runtime lesson fixtures disappear on reload`);
    await avatar(page, '#cHero [data-hero-actor]', 'px_bard_f8', `${width}: restored premium skin`);
    await wardrobe(page, 'bard'); await page.locator('[data-hgroup="female"]').click();
    const wardrobePoses = await page.evaluate(async () => {
      const hosts = [...document.querySelectorAll('#hsk [data-hero-actor]')];
      return Promise.all(hosts.map(async host => {
        const loaded = await HeroAnim.load(HeroAnim.get(host.dataset.heroActor)).ready;
        await HeroAnim.frame(host, 0);
        return { id: host.dataset.heroActor, status: loaded.status, width: loaded.image.naturalWidth,
          height: loaded.image.naturalHeight, pose: host.querySelector('canvas')?.dataset.pose };
      }));
    });
    ok(wardrobePoses.length === 9 && wardrobePoses.every(p => p.status === 'ready' && p.width > 0 && p.height > 0 && p.pose === '0'), `${width}: female wardrobe preview and all eight cards finish rendering`);
    ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${width}: wardrobe fits viewport`);
    await page.screenshot({ path: path.join(shots, `hero-expansion-wardrobe-routes-${width}.png`), fullPage: false, animations: 'disabled' });
    ok(!report.pageErrors.some(e => e.width === width), `${width}: no browser page errors`);
    report.widths.push(width);
  } finally {
    if (backup !== null) {
      await page.evaluate(snapshot => {
        if (typeof LEARN_UI !== 'undefined') { LEARN_UI.leave(); for (let i = LEARN_UI.packs.length - 1; i >= 0; i--) if (LEARN_UI.packs[i].id.startsWith('__hero_routes_')) LEARN_UI.packs.splice(i, 1); }
        localStorage.clear(); Object.entries(snapshot).forEach(([k, v]) => localStorage.setItem(k, v));
      }, backup);
      const restored = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
      assert.deepEqual(restored, backup); report.storageRestored.push(width);
    }
    await context.close();
  }
}
(async () => {
  const browser = await chromium.launch(process.env.PW_EXE ? { executablePath: process.env.PW_EXE, headless: true } : { channel: 'msedge', headless: true });
  try { for (const width of [1000, 390]) await runWidth(browser, width); report.ok = true; }
  finally { await browser.close(); }
})().catch(e => { report.ok = false; report.failure = e.stack; process.exitCode = 1; }).finally(() => {
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ok: report.ok, checks: report.checks.length, storageRestored: report.storageRestored, failure: report.failure, report: out }));
});
