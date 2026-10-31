// Drawn pet skins: frames load, buy/wear in the fitting room, camp/battle/learn rendering, animation frames, old saves.
// Disposable Edge context, file://, 1100px and 390px. Run: NODE_PATH=E:\NEWTEST\skull-atlas-3d\node_modules node tools/pet-skins-qa/check.cjs
const { chromium } = require('playwright');
const path = require('path'), url = require('url'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'pets', 'manifest.json'), 'utf8'));
const results = [], errors = [];
const ok = (name, pass, info) => { results.push({ name, pass: !!pass, info }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass || !info ? '' : ' ' + JSON.stringify(info).slice(0, 400))); };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  for (const width of [1100, 390]) {
    const tag = `[${width}]`;
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(tag + ' ' + String(e)));
    const goto = async (where = 'hub') => {
      await page.goto(url.pathToFileURL(path.join(ROOT, 'index.html')).href);
      await page.waitForFunction(() => typeof App !== 'undefined' && typeof Store !== 'undefined' && typeof PetArt !== 'undefined');
      await page.evaluate(w => { U.clearModals(); App.go(w); setTimeout(() => U.clearModals(), 50); }, where);
      await page.waitForTimeout(150);
    };
    await goto();
    const backup = await page.evaluate(() => JSON.stringify(Object.assign({}, localStorage)));

    if (width === 1100) {
      // every frame of every drawn skin loads from file://
      const bad = await page.evaluate(async m => {
        const miss = [];
        for (const pet of Object.keys(m.pets)) for (const s of m.pets[pet]) for (const pose of m.poses) {
          const src = s.img + pose + '.png';
          const okk = await new Promise(r => { const i = new Image(); i.onload = () => r(i.naturalWidth > 0); i.onerror = () => r(false); i.src = src; });
          if (!okk) miss.push(src);
        }
        return miss;
      }, manifest);
      const n = Object.values(manifest.pets).reduce((a, l) => a + l.length, 0);
      ok(`${tag} all ${n} drawn skins x ${manifest.poses.length} frames load`, bad.length === 0, bad);
      ok(`${tag} skins registered in C.PET_SKINS with price and image folder`, await page.evaluate(m => Object.keys(m.pets).every(p => m.pets[p].every(s => (C.PET_SKINS[p] || []).some(x => x.id === s.id && x.img === s.img && x.cost === s.cost))), manifest));
      ok(`${tag} classic palette skins are untouched`, await page.evaluate(() => C.PET_SKINS.cat.some(s => s.id === 'black' && s.pal) && C.SKIN_COST === 40));
    }

    // old save: classic skin renders the procedural canvas
    await page.evaluate(() => {
      const p = Store.profile; p.starterPicked = true; p.pets = { cat: { lv: 1, xp: 0 } }; p.activePet = 'cat';
      p.ownedSkins = ['cat:black']; p.petSkin = { cat: 'black' }; p.petAcc = {}; p.gems = 1000; Store.saveProfile();
    });
    await goto();
    ok(`${tag} old save with a classic skin still uses the procedural sprite`, await page.evaluate(() => /^data:image/.test(document.querySelector('#cPet img').src)));

    // fitting room: buy a drawn skin
    const art = manifest.pets.cat[manifest.pets.cat.length - 1];
    await page.evaluate(() => App.go('pets'));
    await page.waitForTimeout(100);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '造型').click());
    await page.waitForSelector('#sksArt');
    const room = await page.evaluate(() => ({ art: document.querySelectorAll('#sksArt .style-opt').length, classic: document.querySelectorAll('#sks .style-opt').length, hs: document.documentElement.scrollWidth > innerWidth + 1, mhs: [...document.querySelectorAll('.modal')].some(m => m.scrollWidth > m.clientWidth + 1) }));
    ok(`${tag} fitting room lists classic and drawn skins separately`, room.art === manifest.pets.cat.length && room.classic >= 2, room);
    ok(`${tag} fitting room has no horizontal scroll`, !room.hs && !room.mhs, room);
    await page.evaluate(name => [...document.querySelectorAll('#sksArt .style-opt')].find(b => b.textContent.includes(name)).click(), art.name);
    const trying = await page.evaluate(() => ({ fit: document.querySelector('#fit img').getAttribute('src'), note: !!document.querySelector('#artNoAcc'), acs: !!document.querySelector('#acs'), buy: (document.querySelector('#buy') || {}).textContent || '' }));
    ok(`${tag} trying a drawn skin shows its frames, hides accessories, shows the price`, trying.fit.startsWith(art.img) && trying.note && !trying.acs && trying.buy.includes(String(art.cost)), trying);
    const gems0 = await page.evaluate(() => Store.profile.gems);
    await page.click('#buy');
    const after = await page.evaluate(() => ({ gems: Store.profile.gems, owned: Store.profile.ownedSkins, wear: Store.profile.petSkin.cat }));
    ok(`${tag} buying deducts ${art.cost} and records ownership`, gems0 - after.gems === art.cost && after.owned.includes('cat:' + art.id) && after.wear === art.id, after);

    // wearing: camp, battle, learn bar; reload keeps it
    await goto();
    const camp = await page.evaluate(() => document.querySelector('#cPet img').getAttribute('src'));
    ok(`${tag} camp pet shows the drawn skin after reload`, camp.startsWith(art.img), camp);
    ok(`${tag} battle and learn markup use the drawn skin`, await page.evaluate(img => [Store.petHTML('cat', 76, 'anim-float'), Store.petHTML('cat', 54)].every(h => h.includes(img)) && !Store.petHTML('cat', 54).includes('data:image'), art.img));
    const frames = await page.evaluate(async () => {
      const el = document.querySelector('#cPet [data-panim]'), seen = new Set();
      for (const a of ['love', 'surprise', 'doze']) { PetArt.act(el, a); await new Promise(r => setTimeout(r, 300)); seen.add(el.firstElementChild.getAttribute('src').split('/').pop()); }
      const t0 = Date.now(); while (Date.now() - t0 < 3500) { await new Promise(r => setTimeout(r, 100)); seen.add(el.firstElementChild.getAttribute('src').split('/').pop()); }
      return [...seen];
    });
    ok(`${tag} animation swaps frames (happy, surprise, sleep, breathing)`, ['happy.png', 'surprise.png', 'sleep.png'].every(f => frames.includes(f)) && (frames.includes('idle0.png') || frames.includes('idle1.png')), frames);
    ok(`${tag} drawn skin ignores a worn accessory`, await page.evaluate(() => { Store.profile.petAcc.cat = 'crown'; Store.profile.ownedAcc.push('crown'); return !Store.petHTML('cat', 48).includes('data:image'); }));
    await page.evaluate(() => { Store.profile.petSkin.cat = 'black'; });
    ok(`${tag} switching back to a classic skin restores accessories`, await page.evaluate(() => Store.petHTML('cat', 48).includes('data:image')));
    await page.screenshot({ path: path.join(ROOT, 'output', 'playwright', `pet-skins-${width}-camp.png`) });

    await page.evaluate(b => { localStorage.clear(); const o = JSON.parse(b); for (const k in o) localStorage.setItem(k, o[k]); }, backup);
    await ctx.close();
  }
  ok('no page errors', errors.length === 0, errors);
  await browser.close();
  const pass = results.filter(r => r.pass).length;
  fs.mkdirSync(path.join(ROOT, 'docs', 'pet-skins'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'docs', 'pet-skins', 'qa.json'), JSON.stringify({ date: new Date().toISOString(), pass, total: results.length, results }, null, 1));
  console.log(`\n${pass}/${results.length} passed`);
})();
