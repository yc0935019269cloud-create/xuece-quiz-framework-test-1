// 背景商店＋營地布置 QA：headless Edge、file://、獨立 context。
// 用法（PowerShell）：$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'; node tools/decor-qa/check.cjs
// 真正的 js/decor-data.js 存在就用它；否則注入依設計文件表格產生的假資料（圖檔 404，會顯示佔位框）。
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), url = require('url');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../..'), OUT = path.join(ROOT, 'output/playwright');
const originalDecor = execFileSync('git', ['show', '14652e0:js/decor.js'], { cwd: ROOT, encoding: 'utf8' });
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(path.join(ROOT, 'docs/decor'), { recursive: true });
const results = []; const ok = (name, cond, extra) => { results.push({ name, pass: !!cond, extra: cond ? undefined : extra }); console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : ' ' + JSON.stringify(extra))); };
const SER = [['cabin', '木屋小窩'], ['forest', '森林精靈'], ['academy', '學院書房'], ['seaside', '海濱假日'], ['sakura', '和風庭園'], ['arcane', '星辰魔法'], ['junk', '雜物堆']];
const T = [
  'cabin|cabin_stool 木頭小板凳 N 32,cabin_barrel 橡木桶 N 40,cabin_crate 補給木箱 N 40,cabin_lantern 立式提燈 N 28,cabin_chair 搖搖椅 R 52,cabin_table 圓木桌 R 60,cabin_petbed 寵物軟墊窩 R 54,cabin_shelf 小書架 SR 64,cabin_stove 鑄鐵暖爐 SR 60,cabin_hut 小木屋 SSR 130',
  'forest|forest_mush 紅點蘑菇 N 30,forest_fern 蕨類叢 N 40,forest_stump 樹墩 N 40,forest_rock 青苔石 N 40,forest_flowers 野花叢 R 48,forest_birdhouse 鳥屋 R 44,forest_logbench 原木長椅 R 70,forest_fairylamp 精靈燈籠柱 SR 46,forest_bigmush 蘑菇小屋 SR 90,forest_spirittree 精靈古樹 SSR 140',
  'academy|acad_books 書堆 N 34,acad_ink 羽毛筆與墨水 N 26,acad_scroll 卷軸架 N 44,acad_hourglass 沙漏 N 28,acad_desk 讀書桌 R 70,acad_globe 地球儀 R 44,acad_board 小黑板 R 60,acad_telescope 黃銅望遠鏡 SR 60,acad_trophy 金榜獎盃 SR 44,acad_tower 白塔模型 SSR 90',
  'seaside|sea_shell 大海螺 N 28,sea_star 海星 N 26,sea_bucket 沙桶與小鏟 N 32,sea_ring 救生圈 N 40,sea_umbrella 條紋陽傘 R 80,sea_chair 海灘躺椅 R 70,sea_castle 沙堡 R 56,sea_petbed 貝殼寵物床 SR 60,sea_palm 椰子樹 SR 100,sea_lighthouse 小燈塔 SSR 110',
  'sakura|jp_cushion 坐墊 N 34,jp_teaset 茶具組 N 34,jp_paperlamp 紙燈籠 N 30,jp_bamboo 竹籬笆 N 60,jp_bonsai 松樹盆栽 R 46,jp_koibowl 錦鯉石缸 R 52,jp_chime 風鈴架 R 40,jp_stonelamp 石燈籠 SR 50,jp_torii 小鳥居 SR 90,jp_sakura 櫻花樹 SSR 130',
  'arcane|arc_crystal 水晶簇 N 34,arc_rune 符文石 N 36,arc_candle 浮空蠟燭 N 24,arc_potion 藥水架 N 44,arc_cauldron 魔法大釜 R 56,arc_orb 占星水晶球 R 44,arc_lectern 魔法書台 R 50,arc_moon 新月雕像 SR 60,arc_cloudbed 雲朵寵物窩 SR 60,arc_portal 星門 SSR 110',
  'junk|junk_boot 舊靴子 junk 28,junk_can 生鏽空罐 junk 22,junk_twig 枯樹枝 junk 36,junk_bucket 破水桶 junk 32,junk_paper 揉爛的考卷 junk 26,junk_rock 普通石頭 junk 30'];
const fixture = { version: 1, series: SER.map(([id, name]) => ({ id, name, desc: '' })), items: [], scenes: [] };
T.forEach(l => { const [s, rest] = l.split('|'); rest.split(',').forEach(x => { const [id, name, rarity, w] = x.split(' '); fixture.items.push({ id, name, desc: name + '的說明', series: s, rarity, file: `assets/decor/items/${id}.png`, w: +w, h: Math.round(+w * .9), px: [16, 14] }); }); });
[['scene_beach', '海邊沙灘', 'dim'], ['scene_autumn', '秋楓山丘', 'dim'], ['scene_sakura', '櫻花庭院', 'dim'], ['scene_snow', '雪原小鎮', 'dim'], ['scene_library', '魔法圖書館', 'self'], ['scene_island', '浮空島', 'dim'], ['scene_crystal', '水晶洞窟', 'self'], ['scene_starobs', '星空天文台', 'self']]
  .forEach(([id, name, night]) => fixture.scenes.push({ id, name, desc: name, file: `assets/decor/scenes/${id}.png`, ground: 0.28, night }));
let lastSuppl = null;
const realData = fs.existsSync(path.join(ROOT, 'js/decor-data.js'));

(async () => {
  const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'msedge', headless: true });
  const errors = [];
  for (const width of [1100, 390]) {
    const tag = `[${width}]`;
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    if (!realData) await ctx.addInitScript(f => { window.DECOR_DATA = f; }, fixture);
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(tag + ' ' + String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(tag + ' console: ' + m.text()); });
    const goto = async () => { await page.goto(url.pathToFileURL(path.join(ROOT, 'index.html')).href); await page.waitForFunction(() => typeof Screens !== 'undefined' && typeof App !== 'undefined' && typeof DECOR !== 'undefined');
      // 真實資料還沒產完（例如場景圖）時，用假資料補齊缺的場景／物件，讓流程仍可完整測試
      suppl = await page.evaluate(f => { const d = window.DECOR_DATA || {}, n = { scenes: 0, items: 0 }; const nd = { version: 1, series: (d.series || []).slice(), items: (d.items || []).slice(), scenes: (d.scenes || []).slice() };
        f.scenes.forEach(x => { if (!nd.scenes.some(y => y.id === x.id)) { nd.scenes.push(x); n.scenes++; } }); f.items.forEach(x => { if (!nd.items.some(y => y.id === x.id)) { nd.items.push(x); n.items++; } }); f.series.forEach(x => { if (!nd.series.some(y => y.id === x.id)) nd.series.push(x); });
        window.DECOR_DATA = nd; return n; }, fixture); lastSuppl = suppl; };
    let suppl = null; lastSuppl = null;
    await goto();
    const backup = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
    try {
      await page.evaluate(() => { Store.profile.gems = 5000; Store.profile.starterPicked = true; Store.saveProfile(); });
      await page.evaluate(() => App.go('hub'));
      await page.waitForSelector('#camp');
      ok(`${tag} 載入 DECOR，資料 ${realData ? '真實' : '假資料'}，補假場景 ${suppl && suppl.scenes}、補假物件 ${suppl && suppl.items}`, await page.evaluate(() => DECOR.data().items.length > 0 && DECOR.data().scenes.length > 1));
      ok(`${tag} 新檔預設：擁有 classic、沒擺東西`, await page.evaluate(() => { const d = DECOR.ensure(); return d.scene === 'classic' && d.scenes.join() === 'classic' && d.placed.length === 0; }));
      ok(`${tag} 營地有三個按鈕與選單磚`, await page.evaluate(() => !!document.querySelector('#decorEdit') && !!document.querySelector('#decorScene') && !!document.querySelector('[data-go="decor"]')));
      await page.screenshot({ path: path.join(OUT, `decor-${width}-camp-classic.png`) });

      // Base art is file-loadable and animated in discrete frames.
      const art = await page.evaluate(async () => {
        const names = ['board', 'fire', 'mail', 'pot', 'pond'];
        const loaded = await Promise.all(names.map(name => new Promise(resolve => { const im = new Image(); im.onload = () => resolve(im.naturalWidth > 0); im.onerror = () => resolve(false); im.src = `assets/camp/${name}.png`; })));
        const anim = ['fire', 'pond'].map(name => getComputedStyle(document.querySelector(`.${name}-art`)).animationTimingFunction.includes('steps(4)'));
        const mail = document.querySelector('#cMail'), img = mail.querySelector('.mail-art'); mail.classList.remove('read'); const up = getComputedStyle(img).backgroundPosition; mail.classList.add('read'); const down = getComputedStyle(img).backgroundPosition; mail.classList.remove('read');
        return { loaded, anim, mailStates: up !== down, sprites: names.every(name => getComputedStyle(document.querySelector(`.${name}-art`)).backgroundImage.includes(`/camp/${name}.png`)) };
      });
      ok(`${tag} base images and stepped animations`, art.loaded.every(Boolean) && art.anim.every(Boolean) && art.mailStates && art.sprites, art);
      if (width === 1100) {
        for (const scene of ['classic', 'scene_beach']) for (const time of ['morning', 'day', 'dusk', 'night']) {
          await page.evaluate(({scene, time}) => { const d = DECOR.ensure(); if (!d.scenes.includes('scene_beach')) d.scenes.push('scene_beach'); d.scene = scene; Store.settings.campTime = time; Store.saveSettings(); Store.saveProfile(); App.go('hub'); }, {scene, time});
          await page.screenshot({ path: path.join(OUT, `decor-base-art-${scene}-${time}.png`) });
        }
        await page.evaluate(() => { const d = DECOR.ensure(); d.scene = 'classic'; d.scenes = ['classic']; Store.settings.campTime = 'auto'; Store.saveSettings(); Store.saveProfile(); App.go('hub'); });
      }


      // 直購
      const r1 = await page.evaluate(() => { const g = Store.profile.gems; const a = DECOR.buy('cabin_stool'), b = DECOR.buy('scene_beach'), c = DECOR.buy('cabin_hut'), d2 = DECOR.buy('scene_beach'); return { dg: g - Store.profile.gems, a, b, c, d2, copies: DECOR.copies('cabin_stool'), own: DECOR.ownsScene('scene_beach') }; });
      ok(`${tag} 直購物件＋場景：扣 340 魂晶、擁有；SSR 不能買、場景不能重買`, r1.dg === 340 && r1.a.ok && r1.b.ok && !r1.c.ok && !r1.d2.ok && r1.copies === 1 && r1.own, r1);
      ok(`${tag} 魂晶不足不能買／不能抽，且不扣`, await page.evaluate(() => { const g = Store.profile.gems; Store.profile.gems = 10; const x = DECOR.buy('cabin_chair'), y = DECOR.draw('standard', 1), z = DECOR.draw('standard', 10); const same = Store.profile.gems === 10; Store.profile.gems = g; return !x.ok && y === null && z === null && same; }));

      // 抽獎扣款
      const r2 = await page.evaluate(() => { const g0 = Store.profile.gems; const a = DECOR.draw('standard', 1); const g1 = Store.profile.gems; const b = DECOR.draw('standard', 10); const g2 = Store.profile.gems; const refA = a.reduce((s, x) => s + x.refund, 0), refB = b.reduce((s, x) => s + x.refund, 0); return { single: g0 - g1 + refA, ten: g1 - g2 + refB, na: a.length, nb: b.length }; });
      ok(`${tag} 單抽 20、十連 180（扣款已含退款還原）`, r2.single === 20 && r2.ten === 180 && r2.na === 1 && r2.nb === 10, r2);

      // 機率（關掉保底量原始機率）
      const rates = await page.evaluate(() => {
        const cnt = { junk: 0, N: 0, R: 0, SR: 0, SSR: 0 }, N = 20000, ssrKinds = {};
        for (let i = 0; i < N; i++) {
          Store.profile.gems = 1000; DECOR.ensure().pity.standard = 0;
          const r = DECOR.draw('standard', 1)[0]; cnt[r.rarity]++; if (r.rarity === 'SSR') ssrKinds[r.id] = (ssrKinds[r.id] || 0) + 1;
        }
        const out = {}; for (const k in cnt) out[k] = cnt[k] / N * 100; return { out, ssrKinds };
      });
      const exp = { junk: 12, N: 50, R: 27, SR: 9, SSR: 2 }, tol = { junk: 1, N: 1.5, R: 1.5, SR: 1, SSR: 0.5 };
      ok(`${tag} 20000 抽機率落在容許範圍`, Object.keys(exp).every(k => Math.abs(rates.out[k] - exp[k]) <= tol[k]), rates);
      const ks = Object.values(rates.ssrKinds);
      ok(`${tag} SSR 由 3 個物件＋1 場景平分（都出現、比例接近）`, Object.keys(rates.ssrKinds).length === 4 && Math.max(...ks) / Math.min(...ks) < 1.8, rates.ssrKinds);
      const ten = await page.evaluate(() => { let bad = 0; for (let i = 0; i < 400; i++) { Store.profile.gems = 1000; const r = DECOR.draw(['standard', 'seasakura', 'arcane'][i % 3], 10); if (!r.some(x => x.rarity === 'SR' || x.rarity === 'SSR')) bad++; } return bad; });
      ok(`${tag} 400 次十連都至少一件 SR 以上`, ten === 0, ten);
      const pity = await page.evaluate(() => {
        const old = DECOR._rng; DECOR._rng = () => 0.5; const d = DECOR.ensure(); d.pity.arcane = 0; const seq = [];
        for (let i = 0; i < 60; i++) { Store.profile.gems = 1000; seq.push(DECOR.draw('arcane', 1)[0].rarity); }
        const info = { first59: seq.slice(0, 59).every(x => x !== 'SSR'), last: seq[59], reset: DECOR.pity('arcane'), left: DECOR.untilSSR('arcane') };
        Store.profile.gems = 1000; for (let i = 0; i < 5; i++) DECOR.draw('arcane', 1); info.left5 = DECOR.untilSSR('arcane'); DECOR._rng = old; return info;
      });
      ok(`${tag} 保底：前 59 抽無 SSR（rng 固定），第 60 抽必 SSR、計數歸零`, pity.first59 && pity.last === 'SSR' && pity.reset === 0 && pity.left === 60 && pity.left5 === 55, pity);
      const sh = await page.evaluate(() => {
        const q = vals => { const a = vals.slice(); DECOR._rng = () => a.length ? a.shift() : 0.5; };
        const d = DECOR.ensure(); d.shards = {}; d.scenes = ['classic']; d.pity = {}; const out = {};
        const pull = () => { Store.profile.gems = 1000; return DECOR.draw('standard', 1)[0]; };
        const c = []; for (let i = 0; i < 3; i++) { q([0.3, 0]); const r = pull(); c.push([DECOR.copies('cabin_stool'), !!r.unlocked, r.need]); } out.N = c;
        const r2 = []; for (let i = 0; i < 2; i++) { q([0.93, 0]); pull(); r2.push(DECOR.copies('cabin_shelf')); } out.SR = r2;
        q([0.995, 0]); const s = pull(); out.SSR = [s.id, DECOR.copies('cabin_hut'), !!s.unlocked];
        q([0.05, 0]); Store.profile.gems = 1000; const g = Store.profile.gems; const j = DECOR.draw('standard', 1)[0]; out.junk = [j.id, g - Store.profile.gems, DECOR.copies('junk_boot')];
        q([0.995, 0.99]); const s1 = pull(); q([0.995, 0.99]); Store.profile.gems = 1000; const g2 = Store.profile.gems; const s2 = DECOR.draw('standard', 1)[0];
        out.scene = [s1.id, !!s1.unlocked, !!s2.dup, g2 - Store.profile.gems];
        for (let i = 0; i < 3; i++) { q([0.3, 0]); pull(); } out.N6 = DECOR.copies('cabin_stool');
        DECOR._rng = null; return out;
      });
      ok(`${tag} 碎片門檻 N 3 片解鎖、SR 2、SSR 1、雜物 1，6 片＝2 件`, JSON.stringify(sh.N) === '[[0,false,3],[0,false,3],[1,true,3]]' && sh.SR.join() === '0,1' && sh.SSR[0] === 'cabin_hut' && sh.SSR[1] === 1 && sh.SSR[2] && sh.junk[0] === 'junk_boot' && sh.junk[2] === 1 && sh.N6 === 2, sh);
      ok(`${tag} 雜物退 2 魂晶（淨 -18）；重複場景退 30（淨 +10），新場景解鎖`, sh.junk[1] === 18 && sh.scene[0] === 'scene_library' && sh.scene[1] === true && sh.scene[2] === true && sh.scene[3] === -10, sh);

      // 商店畫面
      await page.evaluate(() => { Store.profile.gems = 3000; Store.saveProfile(); App.go('decor'); });
      await page.waitForSelector('.decor-shop');
      const noScroll = async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      for (const [tab, label] of [['gacha', '抽獎'], ['buy', '直購'], ['bag', '背包'], ['scenes', '場景']]) {
        await page.click(`[data-tab="${tab}"]`);
        ok(`${tag} 商店分頁「${label}」可顯示且無橫向捲動`, (await page.$('#dcBody') !== null) && await noScroll() && (await page.textContent('#dcBody')).length > 20, await page.evaluate(() => document.documentElement.scrollWidth));
        if (tab === 'scenes') {
          const previews = await page.evaluate(async () => {
            const cards = [...document.querySelectorAll('#dcBody .dc-scene-card')];
            const scenes = DECOR.data().scenes.filter(s => s.id !== 'classic');
            const labels = { morning: '早晨', day: '白天', dusk: '黃昏', night: '夜晚' };
            const checks = await Promise.all(scenes.map(async s => {
              const card = cards.find(c => c.querySelector(`.dc-scene-th[data-id="${s.id}"]`));
              if (!card || card.querySelectorAll('.dc-tod-preview').length !== 4) return false;
              for (const [time, label] of Object.entries(labels)) {
                const preview = card.querySelector(`.dc-tod-preview[data-time="${time}"]`);
                const img = preview && preview.querySelector('img');
                if (!img || img.getAttribute('src') !== s.tod[time] || !preview.textContent.includes(label)) return false;
                img.loading = 'eager';
                try { await img.decode(); } catch (_) { return false; }
                if (img.naturalWidth !== 1536 || img.naturalHeight !== 384) return false;
              }
              return true;
            }));
            return { scenes: scenes.length, checks };
          });
          ok(`${tag} shop shows four labelled, loadable time variants for all eight scenes`, previews.scenes === 8 && previews.checks.every(Boolean) && await noScroll(), previews);
        }
        await page.screenshot({ path: path.join(OUT, `decor-${width}-shop-${tab}.png`), fullPage: true });
      }
      await page.click('[data-tab="gacha"]');
      ok(`${tag} 抽獎頁顯示保底與機率表`, /再 \d+ 抽必得 SSR/.test(await page.textContent('#dcPity')) && (await page.textContent('#dcBody')).includes('2%'));
      const g0 = await page.evaluate(() => Store.profile.gems);
      await page.click('#dcP10');
      await page.waitForSelector('.dc-reveal');
      ok(`${tag} 十連結果視窗顯示 10 張卡`, (await page.$$('.dc-reveal .dc-card')).length === 10 && await noScroll());
      await page.screenshot({ path: path.join(OUT, `decor-${width}-reveal.png`) });
      await page.click('#dcSkip'); ok(`${tag} 可略過動畫`, await page.evaluate(() => document.querySelector('.dc-reveal').classList.contains('instant')));
      await page.click('.modal .px-btn.gold');
      ok(`${tag} 十連後魂晶減少且畫面更新`, (await page.evaluate(() => Store.profile.gems)) < g0 && +(await page.textContent('#dcGems')) === await page.evaluate(() => Store.profile.gems));
      await page.click('#dcP1'); await page.waitForSelector('.dc-reveal'); await page.click('.modal .px-btn.gold');
      await page.click('[data-tab="buy"]'); const gb = await page.evaluate(() => Store.profile.gems);
      await page.click('[data-buy="cabin_barrel"]');
      ok(`${tag} 直購頁按鈕購買 N 物件 -40`, (await page.evaluate(() => Store.profile.gems)) === gb - 40 && await page.evaluate(() => DECOR.copies('cabin_barrel') >= 1));

      // 營地布置
      await page.evaluate(() => { const d = DECOR.ensure(); d.placed = []; d.shards.cabin_stool = 3; d.shards.cabin_barrel = 3; d.shards.cabin_hut = 1; Store.saveProfile(); App.go('hub'); });
      await page.waitForSelector('#camp');
      await page.click('#decorEdit'); await page.waitForSelector('#decorDrawer:not([hidden]) .dc-chip');
      ok(`${tag} 布置模式出現抽屜與可用物件`, (await page.$$('#decorDrawer .dc-chip')).length >= 3);
      await page.click('.dc-chip[data-id="cabin_stool"]');
      await page.waitForSelector('.decor-obj');
      ok(`${tag} 點物件放進營地，庫存 -1`, await page.evaluate(() => DECOR.placedCount('cabin_stool') === 1 && DECOR.available('cabin_stool') === 0));
      ok(`${tag} 用完的物件在抽屜變灰不能再放`, await page.evaluate(() => document.querySelector('.dc-chip[data-id="cabin_stool"]').disabled));
      await page.click('.dc-chip[data-id="cabin_hut"]');
      await page.screenshot({ path: path.join(OUT, `decor-${width}-edit.png`) });
      const first = await page.evaluate(() => DECOR.ensure().placed[0].k);
      await page.evaluate(k => { const o = DECOR.ensure().placed.find(x => x.k === k); DECOR.move(k, 0.3, 0.3); DECOR.ensure().placed.filter(x => x.k !== k).forEach(x => DECOR.move(x.k, 0.85, 0.8)); }, first);
      await page.evaluate(() => App.go('hub')); await page.waitForSelector('#camp');
      await page.click('#decorEdit'); await page.waitForSelector('.decor-obj');
      const bef = await page.evaluate(k => { const o = DECOR.ensure().placed.find(x => x.k === k); return { x: o.x, y: o.y, k }; }, first);
      const box = await (await page.$(`.decor-obj[data-k="${bef.k}"]`)).boundingBox();
      const sx = box.x + box.width / 2, sy = box.y + box.height / 2;
      const campBox = await (await page.$('#camp')).boundingBox();
      const dxp = Math.min(campBox.width * 0.25, 160);
      if (width === 390) {
        const cdp = await ctx.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] });
        for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx + dxp * i / 6, y: sy - 8 * i / 6 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await page.mouse.move(sx, sy); await page.mouse.down();
        for (let i = 1; i <= 8; i++) await page.mouse.move(sx + dxp * i / 8, sy - 10 * i / 8);
        await page.mouse.up();
      }
      await page.waitForTimeout(150);
      const aft = await page.evaluate(k => { const o = DECOR.ensure().placed.find(x => x.k === k); return { x: o.x, y: o.y }; }, bef.k);
      const expectDx = dxp / campBox.width;
      ok(`${tag} ${width === 390 ? '觸控' : '滑鼠'}拖曳移動物件（x 變化約 ${expectDx.toFixed(2)}）`, Math.abs((aft.x - bef.x) - expectDx) < 0.05 && aft.y >= 0 && aft.y <= 1, { bef, aft, expectDx });
      // 拖出界會夾住
      const b2 = await (await page.$(`.decor-obj[data-k="${bef.k}"]`)).boundingBox();
      await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2); await page.mouse.down();
      await page.mouse.move(campBox.x + campBox.width + 200, campBox.y - 300, { steps: 4 }); await page.mouse.up();
      const clamped = await page.evaluate(k => { const o = DECOR.ensure().placed.find(x => x.k === k); return { x: o.x, y: o.y }; }, bef.k);
      ok(`${tag} 拖到營地外會夾在地面帶內 (0.03≤x≤0.97, 0≤y≤1)`, clamped.x <= 0.97 && clamped.x >= 0.03 && clamped.y <= 1 && clamped.y >= 0, clamped);
      // 選取、翻轉、收回（選取靠真的點擊）；先放回中間，角落可能被池塘蓋住
      await page.evaluate(k => { DECOR.move(k, .5, .3); DECOR.setEdit(true); }, bef.k);
      const b3 = await (await page.$(`.decor-obj[data-k="${bef.k}"]`)).boundingBox();
      await page.mouse.click(b3.x + b3.width / 2, b3.y + b3.height / 2);
      await page.waitForSelector('#dcFlip');
      await page.click('#dcFlip');
      ok(`${tag} 翻轉：↔ 翻轉 寫入 f`, await page.evaluate(() => DECOR.ensure().placed.filter(o => o.f === 1).length === 1));
      await page.click('#dcDel');
      ok(`${tag} 收回：物件回到庫存`, await page.evaluate(() => DECOR.ensure().placed.length === 1 && DECOR.available('cabin_stool') + DECOR.available('cabin_barrel') >= 1));
      const cap = await page.evaluate(() => { const d = DECOR.ensure(); d.shards.junk_rock = 1000; Store.saveProfile(); let n = 0; for (let i = 0; i < 60; i++) if (DECOR.place('junk_rock', .5, .5)) n++; const t = d.placed.length; d.placed = d.placed.filter(o => o.id !== 'junk_rock'); Store.saveProfile(); return { n, t }; });
      ok(`${tag} 最多擺 40 件`, cap.t === 40, cap);
      await page.click('#decorEdit');
      ok(`${tag} 離開布置模式`, await page.evaluate(() => !document.querySelector('#camp').classList.contains('editing') && document.querySelector('#decorDrawer').hidden));
      const keep = await page.evaluate(() => JSON.stringify(DECOR.ensure().placed));
      await goto(); await page.evaluate(() => App.go('hub')); await page.waitForSelector('#camp');
      const n1 = (await page.$$('.decor-obj')).length;
      ok(`${tag} 重新載入後物件位置保留`, (await page.evaluate(() => JSON.stringify(DECOR.ensure().placed))) === keep && n1 === JSON.parse(keep).length && n1 > 0, { n1 });
      const left = await page.evaluate(() => { const e = document.querySelector('.decor-obj'), o = DECOR.ensure().placed[0], c = document.querySelector('#camp').getBoundingClientRect(); const r = e.getBoundingClientRect(); return { px: r.left + r.width / 2, expect: c.left + c.width * 0 + document.querySelector('#camp').clientLeft + o.x * document.querySelector('#camp').clientWidth }; });
      ok(`${tag} 物件水平位置＝x 比例`, Math.abs(left.px - left.expect) < 3, left);
      await page.click('.decor-obj');
      await page.waitForSelector('#camp .bubble', { timeout: 2000 }).then(() => ok(`${tag} 一般模式點物件顯示名稱泡泡`, true)).catch(() => ok(`${tag} 一般模式點物件顯示名稱泡泡`, false));
      await page.screenshot({ path: path.join(OUT, `decor-${width}-camp-placed.png`) });

      // Base objects: compare old-save defaults to the committed pre-change code,
      // then drag each object using actual mouse or touch pointer input.
      // Make sure a pet is in the camp so pet dragging is covered.
      await page.evaluate(() => { const p = Store.profile; if (!p.activePet) { p.pets.luckycat = p.pets.luckycat || { lv: 1, xp: 0 }; p.activePet = 'luckycat'; p.starterPicked = true; Store.saveProfile(); } App.go('hub'); });
      const oldDecorState = await page.evaluate(() => {
        const d = DECOR.ensure(), saved = { scenes: d.scenes.slice(), placed: d.placed.slice() };
        d.placed = []; if (!d.scenes.includes('scene_beach')) d.scenes.push('scene_beach'); delete d.base;
        Store.saveProfile(); return saved;
      });
      const ref = await ctx.newPage();
      let oldDecorServed = false;
      ref.on('pageerror', e => errors.push(tag + ' reference ' + String(e)));
      await ref.route('**/js/decor.js?*', route => { oldDecorServed = true; return route.fulfill({ status: 200, contentType: 'text/javascript', body: originalDecor }); });
      // The hero stands still, so its box is compared like the base objects; the pet wanders, so it is checked by saved position.
      const baseKeys = ['board', 'fire', 'mail', 'pot', 'pond', 'hero'];
      const hasPet = await page.evaluate(() => !!document.querySelector('#cPet'));
      const dragKeys = hasPet ? [...baseKeys, 'pet'] : baseKeys;
      const boxes = async p => p.evaluate(() => {
        const c = document.querySelector('#camp').getBoundingClientRect();
        return Object.fromEntries([...document.querySelectorAll('#camp .camp-obj[data-base], #cHero')].map(e => {
          const r = e.getBoundingClientRect(); return [e.dataset.base || 'hero', { left: r.left - c.left, bottom: c.bottom - r.bottom, width: r.width, height: r.height }];
        }));
      });
      const sameBoxes = (a, b) => baseKeys.every(k => a[k] && b[k] && ['left', 'bottom', 'width', 'height'].every(v => Math.abs(a[k][v] - b[k][v]) < 1));
      const pointer = async (selector, dx = 0, dy = 0) => {
        // Some default objects are partly covered by the hero in normal mode.
        // Find a genuinely hit-testable point on the requested object.
        const { x, y } = await page.evaluate(selector => {
          const el = document.querySelector(selector), b = el.getBoundingClientRect();
          for (const rx of [.5, .9, .1, .75, .25, .97, .03]) for (const ry of [.5, .2, .8]) {
            const x = b.left + b.width * rx, y = b.top + b.height * ry, hit = document.elementFromPoint(x, y);
            if (hit && (hit === el || el.contains(hit))) return { x, y };
          }
          throw new Error('No visible pointer target for ' + selector);
        }, selector);
        if (width === 390) {
          const cd = await ctx.newCDPSession(page);
          await cd.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
          if (dx || dy) for (let i = 1; i <= 6; i++) await cd.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 6, y: y + dy * i / 6 }] });
          await cd.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await cd.detach();
        } else {
          await page.mouse.move(x, y); await page.mouse.down();
          if (dx || dy) await page.mouse.move(x + dx, y + dy, { steps: 6 });
          await page.mouse.up();
        }
      };
      for (const sceneId of ['classic', 'scene_beach']) {
        await page.evaluate(id => { const d = DECOR.ensure(); d.scene = id; delete d.base; Store.saveProfile(); App.go('hub'); }, sceneId);
        await ref.goto(url.pathToFileURL(path.join(ROOT, 'index.html')).href);
        await ref.waitForFunction(() => typeof Screens !== 'undefined' && typeof App !== 'undefined');
        await ref.evaluate(() => App.go('hub'));
        const defaults = await boxes(page), previous = await boxes(ref);
        ok(`${tag} ${sceneId} old save uses unchanged pre-feature object positions`, oldDecorServed && sameBoxes(defaults, previous) && await page.evaluate(() => Object.keys(DECOR.ensure().base).length === 0), { oldDecorServed, defaults, previous });
        if (sceneId === 'classic') {
          await pointer('#cFire');
          ok(`${tag} campfire still flares outside edit mode`, await page.evaluate(() => document.querySelector('#cFire').classList.contains('flare')));
          await pointer('#cBoard');
          ok(`${tag} board still opens the daily bubble outside edit mode`, await page.evaluate(() => document.querySelector('#daily').classList.contains('pulse') && !!document.querySelector('#camp .bubble')));
          await pointer('#cPond');
          ok(`${tag} pond still starts fishing outside edit mode`, await page.evaluate(() => !!document.querySelector('#cPond .bobber')));
          // At 390px the default layout (unchanged from before this feature) puts the hero over the mailbox;
          // then click it the way the page would after the player drags it free: dispatch on the element.
          const mailCovered = await pointer('#cMail').then(() => false, () => true);
          if (mailCovered) await page.evaluate(() => document.querySelector('#cMail').click());
          ok(`${tag} mailbox still opens its letter outside edit mode${mailCovered ? ' (hero covers it at this width; clicked directly)' : ''}`, await page.evaluate(() => !!document.querySelector('.modal .letter')));
          if (await page.$('.modal .letter')) await page.click('.modal .px-btn.gold');
          await pointer('#cPot');
          ok(`${tag} flower pot still waters outside edit mode`, await page.evaluate(() => !!document.querySelector('#cPot .water-fx')));
          await page.evaluate(() => document.querySelectorAll('#camp .bubble').forEach(b => b.remove()));
          await pointer('#cHero');
          ok(`${tag} hero still talks outside edit mode`, await page.evaluate(() => document.querySelector('#cHero').classList.contains('hop') && !!document.querySelector('#camp .bubble')));
          await page.evaluate(() => App.go('hub'));
        }
        await page.click('#decorEdit');
        if (sceneId === 'classic') {
          await page.evaluate(() => { document.querySelector('#daily').classList.remove('pulse'); document.querySelector('#cFire').classList.remove('flare'); });
          await page.evaluate(() => { document.querySelectorAll('#camp .bubble').forEach(b => b.remove()); document.querySelector('#cHero').classList.remove('hop'); });
          for (const id of ['cFire', 'cBoard', 'cPond', 'cMail', 'cPot', 'cHero', ...(hasPet ? ['cPet'] : [])]) await pointer('#' + id);
          ok(`${tag} clicking base objects in edit mode suppresses camp interactions`, await page.evaluate(() => !document.querySelector('#cHero').classList.contains('hop') && !document.querySelector('#cFire').classList.contains('flare') && !document.querySelector('#daily').classList.contains('pulse') && !document.querySelector('#cPond .bobber') && !document.querySelector('#cPot .water-fx') && !document.querySelector('#camp .bubble') && !document.querySelector('.modal')));
          ok(`${tag} hero and pet are draggable in edit mode`, await page.evaluate(() => document.querySelector('#cHero').dataset.base === 'hero' && (!document.querySelector('#cPet') || document.querySelector('#cPet').dataset.base === 'pet') && getComputedStyle(document.querySelector('#cHero')).pointerEvents !== 'none'), { hasPet });
        }
        for (const key of dragKeys) {
          const before = (await boxes(page))[key], dx = key === 'pond' ? -18 : 18;
          await pointer(`.camp-obj[data-base="${key}"]`, dx, -7);
          const after = (await boxes(page))[key];
          const state = await page.evaluate(key => {
            const el = document.querySelector(`.camp-obj[data-base="${key}"]`), c = document.querySelector('#camp').getBoundingClientRect(), r = el.getBoundingClientRect();
            return { pos: DECOR.ensure().base[key], centerX: (r.left + r.width / 2 - c.left) / c.width, shadow: !!el.querySelector(':scope > .shadow'), remove: !!document.querySelector('#dcDel'), flip: !!document.querySelector('#dcFlip') };
          }, key);
          // The pet may be mid-walk before the drag, so check that it lands where it was saved instead of a fixed pixel shift.
          const moved = key === 'pet' ? state.pos && Math.abs(state.centerX - state.pos.x) < .02 : Math.abs(after.left - before.left - dx) < 3;
          const shadowOk = !['hero', 'pet'].includes(key) || state.shadow;
          ok(`${tag} ${sceneId} ${key} responds to ${width === 390 ? 'touch' : 'mouse'} drag without a remove button`, !!state.pos && state.pos.x >= .03 && state.pos.x <= .97 && state.pos.y >= 0 && state.pos.y <= 1 && !state.remove && !state.flip && moved && shadowOk, { before, after, state });
        }
        const savedBase = await page.evaluate(() => JSON.stringify(DECOR.ensure().base)), movedBoxes = await boxes(page);
        await page.screenshot({ path: path.join(OUT, `decor-${width}-base-${sceneId}.png`) });
        await goto(); await page.evaluate(() => App.go('hub'));
        ok(`${tag} ${sceneId} all base positions survive reload`, await page.evaluate(() => JSON.stringify(DECOR.ensure().base)) === savedBase && sameBoxes(movedBoxes, await boxes(page)) && (!hasPet || await page.evaluate(() => !!document.querySelector('#cPet').style.translate)));
        await page.click('#decorEdit'); await page.click('#dcResetBase');
        await page.click('.modal .px-btn.gold');
        const reset = await boxes(page);
        ok(`${tag} ${sceneId} confirmed reset clears saved positions and restores original pixels`, sameBoxes(defaults, reset) && await page.evaluate(() => Object.keys(DECOR.ensure().base).length === 0 && !(document.querySelector('#cPet') || {}).style?.translate), { defaults, reset });
        await goto(); await page.evaluate(() => App.go('hub'));
        ok(`${tag} ${sceneId} reset survives reload`, sameBoxes(defaults, await boxes(page)) && await page.evaluate(() => Object.keys(DECOR.ensure().base).length === 0));
      }
      await ref.close();
      await page.evaluate(saved => { const d = DECOR.ensure(); d.scenes = saved.scenes; d.placed = saved.placed; d.scene = 'classic'; d.base = {}; Store.saveProfile(); App.go('hub'); }, oldDecorState);

      // 場景
      ok(`${tag} 預設為 classic 的 CSS 營地`, await page.evaluate(() => !document.querySelector('.scene-bg') && getComputedStyle(document.querySelector('.camp .ground')).display !== 'none'));
      await page.evaluate(() => { const d = DECOR.ensure(); ['scene_beach', 'scene_library'].forEach(id => { if (!d.scenes.includes(id)) d.scenes.push(id); }); DECOR.setScene('scene_beach'); App.go('hub'); }); await page.waitForSelector('.scene-bg');
      const sc = await page.evaluate(() => ({ bg: getComputedStyle(document.querySelector('.scene-bg')).backgroundImage, ground: getComputedStyle(document.querySelector('.camp .ground')).display, sky: getComputedStyle(document.querySelector('.camp .sky')).display, size: getComputedStyle(document.querySelector('.scene-bg')).backgroundSize }));
      ok(`${tag} 套用圖片場景：背景圖層出現、隱藏 sky/ground`, /scene_beach/.test(sc.bg) && sc.ground === 'none' && sc.sky === 'none' && sc.size === 'cover', sc);
      await page.evaluate(() => { Store.settings.campTime = 'night'; Store.saveSettings(); App.go('hub'); }); await page.waitForSelector('.scene-bg');
      ok(`${tag} time variants bypass night dimming`, (await page.evaluate(() => getComputedStyle(document.querySelector('.scene-bg')).filter)) === 'none');
      await page.evaluate(() => { DECOR.ensure().scenes.push('scene_library'); DECOR.setScene('scene_library'); App.go('hub'); }); await page.waitForSelector('.scene-bg');
      ok(`${tag} self 場景夜晚不再調暗`, (await page.evaluate(() => getComputedStyle(document.querySelector('.scene-bg')).filter)) === 'none');
      const sceneOwnershipBefore = await page.evaluate(() => DECOR.ensure().scenes.slice());
      const imageScenes = await page.evaluate(() => DECOR.data().scenes.filter(s => s.file).map(s => s.id));
      ok(`${tag} all eight scenes have four time paths in generated data`, imageScenes.length === 8 && await page.evaluate(() => DECOR.data().scenes.filter(s => s.file).every(s => ['morning', 'day', 'dusk', 'night'].every(t => s.tod && s.tod[t]))));
      for (const id of imageScenes) {
        await page.evaluate(id => { const d = DECOR.ensure(); if (!d.scenes.includes(id)) d.scenes.push(id); DECOR.setScene(id); App.go('hub'); }, id);
        for (const time of ['morning', 'day', 'dusk', 'night']) {
          await page.click(`.tod-pick [data-tod="${time}"]`);
          const actual = await page.evaluate(async ({ id, time }) => {
            const camp = document.querySelector('#camp'), bg = camp.querySelector('.scene-bg');
            const style = getComputedStyle(bg), file = `assets/decor/scenes/${id}_${time}.png`;
            const im = new Image(); im.src = file;
            try { await im.decode(); } catch (_) { return { loaded: false }; }
            return { file: style.backgroundImage, filter: style.filter, loaded: im.naturalWidth === 1536 && im.naturalHeight === 384,
              matches: style.backgroundImage.includes(file), time: camp.classList.contains(`tod-${time}`), saved: Store.settings.campTime === time };
          }, { id, time });
          ok(`${tag} ${id} ${time} button selects its image without a CSS filter`, actual.loaded && actual.matches && actual.time && actual.saved && actual.filter === 'none', actual);
        }
      }
      await page.click('.tod-pick [data-tod="auto"]');
      ok(`${tag} automatic scene time matches the camp time class`, await page.evaluate(() => {
        const camp = document.querySelector('#camp'); const time = [...camp.classList].find(c => c.startsWith('tod-')).slice(4);
        return getComputedStyle(camp.querySelector('.scene-bg')).backgroundImage.includes(`_${time}.png`);
      }));
      await page.evaluate(scenes => { DECOR.ensure().scenes = scenes; Store.saveProfile(); }, sceneOwnershipBefore);
      await page.evaluate(() => { Store.settings.campTime = 'day'; Store.saveSettings(); DECOR.setScene('scene_beach'); App.go('hub'); }); await page.waitForSelector('.scene-bg');
      await page.screenshot({ path: path.join(OUT, `decor-${width}-camp-beach.png`) });
      await page.click('#decorScene'); await page.waitForSelector('.dc-scene-card');
      ok(`${tag} 場景視窗列出所有場景，未擁有者不可點`, (await page.$$('.dc-scene-card')).length === 9 && (await page.$$('.dc-scene-card[disabled]')).length >= 5, (await page.$$('.dc-scene-card')).length);
      await page.click('.dc-scene-card[data-id="classic"]'); await page.waitForTimeout(250);
      ok(`${tag} 場景視窗可切回經典草原`, await page.evaluate(() => DECOR.ensure().scene === 'classic' && !document.querySelector('.scene-bg')));
      await page.evaluate(() => { DECOR.setScene('scene_beach'); });
      await goto();
      ok(`${tag} 重新載入後場景保留`, await page.evaluate(() => DECOR.ensure().scene === 'scene_beach'));
      await page.evaluate(() => App.go('hub')); await page.waitForSelector('.scene-bg');
      ok(`${tag} 重新載入後營地顯示場景圖層`, await page.evaluate(() => !!document.querySelector('.scene-bg')));
      ok(`${tag} 圖檔缺失時顯示佔位框、不當機`, realData || (await page.evaluate(() => new Promise(r => setTimeout(() => r(!!document.querySelector('.decor-obj .dc-ph')), 600)))));
      const rt = await page.evaluate(() => {
        const before = JSON.stringify(DECOR.ensure()); const txt = Store.exportAll();
        DECOR.ensure().placed = []; DECOR.ensure().shards = {}; DECOR.ensure().scene = 'classic'; Store.saveProfile();
        Store.importAll(txt); return { same: JSON.stringify(DECOR.ensure()) === before, hasKey: JSON.parse(txt).profile.decor !== undefined };
      });
      ok(`${tag} exportAll／importAll 來回保留 decor`, rt.same && rt.hasKey, rt);
      const old = await page.evaluate(() => {
        const d = JSON.parse(Store.exportAll()); delete d.profile.decor; Store.importAll(JSON.stringify(d));
        const e = DECOR.ensure(); return { scene: e.scene, scenes: e.scenes, placed: e.placed.length };
      });
      ok(`${tag} 沒有 decor 的舊備份可匯入並補預設`, old.scene === 'classic' && old.scenes.join() === 'classic' && old.placed === 0, old);
      await page.evaluate(() => { delete Store.profile.decor; Store.saveProfile(); }); await goto();
      await page.evaluate(() => App.go('hub')); await page.waitForSelector('#camp');
      ok(`${tag} 舊存檔（無 decor）開營地與商店正常`, await page.evaluate(() => { App.go('decor'); return !!document.querySelector('.decor-shop') && DECOR.ensure().scene === 'classic'; }));
      for (const mode of ['peglin', 'peglinLearn']) {
        const g = await page.evaluate(m => { App.go(m); return { gate: !!document.querySelector('#pgLogin'), btn: !!document.querySelector('#pgLoginBtn'), setup: !!document.querySelector('#pgSetup'), frame: !!document.querySelector('iframe'), signed: CLOUD.signedIn }; }, mode);
        ok(`${tag} ${mode} 沒登入時只顯示「請先登入」`, !g.signed && g.gate && g.btn && !g.setup && !g.frame, g);
      }
      ok(`${tag} 登入按鈕開出雲端同步視窗`, await page.evaluate(() => { document.querySelector('#pgLoginBtn').click(); return !!document.querySelector('.modal'); }));
      await page.evaluate(() => U.clearModals());
      await page.evaluate(() => App.go('hub'));
      ok(`${tag} 沒有頁面錯誤`, errors.filter(e => e.startsWith(tag)).length === 0, errors);
    } catch (e) { ok(`${tag} 測試流程例外`, false, String(e && e.stack || e)); await page.screenshot({ path: path.join(OUT, `decor-${width}-fail.png`) }).catch(() => {}); }
    finally {
      await page.evaluate(b => { localStorage.clear(); for (const k in b) localStorage.setItem(k, b[k]); }, backup).catch(() => {});
      await ctx.close();
    }
  }
  await browser.close();
  const pass = results.filter(r => r.pass).length;
  fs.writeFileSync(path.join(ROOT, 'docs/decor/qa.json'), JSON.stringify({ at: new Date().toISOString(), realData, supplementedFromFixture: lastSuppl, pass, total: results.length, errors, results }, null, 1));
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
