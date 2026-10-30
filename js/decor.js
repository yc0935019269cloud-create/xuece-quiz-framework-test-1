/* 背景商店與營地布置（規格：docs/背景商店設計.md）
 * 資料：window.DECOR_DATA（js/decor-data.js 由 assets/decor/manifest.json 產生）；缺少時不會當機，只是沒有物件。
 * 存檔：Store.profile.decor（隨 exportAll／雲端同步）。 */
const DECOR = (() => {
  const P = () => Store.profile;
  const RAR = ['junk', 'N', 'R', 'SR', 'SSR'];
  const RNAME = { junk: '雜物', N: 'N', R: 'R', SR: 'SR', SSR: 'SSR' };
  const RATE = { junk: 12, N: 50, R: 27, SR: 9, SSR: 2 };
  const NEED = { junk: 1, N: 3, R: 3, SR: 2, SSR: 1 };
  const COST1 = 20, COST10 = 180, PITY_AT = 60, JUNK_REFUND = 2, DUP_SCENE_REFUND = 30, MAX_PLACED = 40;
  const BUY_ITEM = { N: 40, R: 90 }, BUY_SERIES = ['cabin', 'forest', 'academy'];
  const SCENE_PRICE = { scene_beach: 300, scene_autumn: 300, scene_sakura: 350, scene_snow: 400 };
  const POOLS = {
    standard: { id: 'standard', name: '冒險者雜貨', desc: '木屋、森林、學院三個系列，外加雜物堆。', series: ['cabin', 'forest', 'academy', 'junk'], scenes: ['scene_library'] },
    seasakura: { id: 'seasakura', name: '海風與櫻', desc: '海濱假日與和風庭園，外加雜物堆。', series: ['seaside', 'sakura', 'junk'], scenes: ['scene_island'] },
    arcane: { id: 'arcane', name: '星辰祕庫', desc: '星辰魔法系列，外加雜物堆。', series: ['arcane', 'junk'], scenes: ['scene_crystal', 'scene_starobs'] }
  };
  const POOL_ORDER = ['standard', 'seasakura', 'arcane'];
  const CLASSIC = { id: 'classic', name: '經典草原', desc: '營地原本的草原風景。', file: '', ground: 0.14, night: 'orig' };
  const OFF = 3; // 物件 y=0 時，離營地底部的百分比
  const SERIES_FALLBACK = { cabin: '木屋小窩', forest: '森林精靈', academy: '學院書房', seaside: '海濱假日', sakura: '和風庭園', arcane: '星辰魔法', junk: '雜物堆' };

  /* ---------- 資料 ---------- */
  let cache = null, cacheSrc = null;
  function data() {
    const d = window.DECOR_DATA || {};
    if (cache && cacheSrc === d) return cache;
    const items = d.items || [], scenes = [CLASSIC].concat((d.scenes || []).filter(s => s.id !== 'classic'));
    const series = (d.series || []).slice();
    Object.keys(SERIES_FALLBACK).forEach(id => { if (!series.some(s => s.id === id)) series.push({ id, name: SERIES_FALLBACK[id], desc: '' }); });
    cacheSrc = d;
    return (cache = { items, scenes, series, byId: Object.fromEntries(items.map(i => [i.id, i])), sceneById: Object.fromEntries(scenes.map(s => [s.id, s])), seriesById: Object.fromEntries(series.map(s => [s.id, s])) });
  }
  const item = id => data().byId[id];
  const scene = id => data().sceneById[id];
  const seriesName = id => (data().seriesById[id] || {}).name || id;

  /* ---------- 存檔 ---------- */
  function ensure() {
    const p = P(); let d = p.decor;
    if (!d || typeof d !== 'object') d = p.decor = {};
    if (!d.ver) d.ver = 1;
    if (!d.shards || typeof d.shards !== 'object') d.shards = {};
    if (!Array.isArray(d.scenes)) d.scenes = [];
    if (!d.scenes.includes('classic')) d.scenes.unshift('classic');
    if (typeof d.scene !== 'string' || !d.scenes.includes(d.scene)) d.scene = 'classic';
    if (!Array.isArray(d.placed)) d.placed = [];
    if (!d.pity || typeof d.pity !== 'object') d.pity = {};
    if (typeof d.draws !== 'number') d.draws = 0;
    if (!Array.isArray(d.log)) d.log = [];
    return d;
  }
  const save = () => Store.saveProfile();
  const rarityOf = id => (item(id) || {}).rarity || 'N';
  const need = id => NEED[rarityOf(id)] || 3;
  const shards = id => ensure().shards[id] || 0;
  const copies = id => Math.floor(shards(id) / need(id));
  const placedCount = id => ensure().placed.filter(o => o.id === id).length;
  const available = id => copies(id) - placedCount(id);
  const ownsScene = id => ensure().scenes.includes(id);
  const gems = () => P().gems | 0;
  const spend = n => { P().gems = gems() - n; };
  const earn = n => { P().gems = gems() + n; };

  /* ---------- 機率 ---------- */
  let rng = () => Math.random();
  function poolItems(poolId) { const pl = POOLS[poolId], d = data(); return d.items.filter(i => pl.series.includes(i.series)); }
  function ssrCandidates(poolId) {
    const pl = POOLS[poolId], d = data();
    return poolItems(poolId).filter(i => i.rarity === 'SSR').map(i => ({ kind: 'item', id: i.id, name: i.name }))
      .concat(pl.scenes.filter(id => d.sceneById[id]).map(id => ({ kind: 'scene', id, name: d.sceneById[id].name })));
  }
  function rates(poolId) {
    const c = ssrCandidates(poolId), each = c.length ? RATE.SSR / c.length : 0;
    return { rarity: Object.assign({}, RATE), ssr: c.map(x => Object.assign({ pct: each }, x)), counts: RAR.reduce((o, r) => (o[r] = poolItems(poolId).filter(i => i.rarity === r).length + (r === 'SSR' ? c.filter(x => x.kind === 'scene').length : 0), o), {}) };
  }
  function pity(poolId) { return ensure().pity[poolId] || 0; }
  const untilSSR = poolId => PITY_AT - pity(poolId);
  function rollRarity(forceSR, pityHit) {
    if (pityHit) return 'SSR';
    if (forceSR) return rng() * 11 < 9 ? 'SR' : 'SSR';
    const r = rng() * 100; let acc = 0;
    for (const k of ['junk', 'N', 'R', 'SR']) { acc += RATE[k]; if (r < acc) return k; }
    return 'SSR';
  }
  function pickFrom(poolId, rarity) {
    let r = RAR.indexOf(rarity);
    while (r >= 0) {
      const rr = RAR[r];
      const cand = rr === 'SSR' ? ssrCandidates(poolId) : poolItems(poolId).filter(i => i.rarity === rr).map(i => ({ kind: 'item', id: i.id, name: i.name }));
      if (cand.length) return { rarity: rr, c: cand[Math.min(cand.length - 1, Math.floor(rng() * cand.length))] };
      r--;
    }
    return null;
  }
  /* 抽卡：n 通常為 1 或 10。魂晶不足或卡池沒有資料時回傳 null（不扣魂晶）。 */
  function draw(poolId, n) {
    const pl = POOLS[poolId]; if (!pl) return null;
    n = n || 1;
    if (!poolItems(poolId).length && !ssrCandidates(poolId).length) return null;
    const cost = n === 10 ? COST10 : n * COST1;
    if (gems() < cost) return null;
    const d = ensure(); spend(cost);
    const out = []; let gotSR = false;
    for (let i = 0; i < n; i++) {
      const pt = d.pity[poolId] || 0;
      const rar = rollRarity(n === 10 && i === 9 && !gotSR, pt >= PITY_AT - 1);
      const pk = pickFrom(poolId, rar); if (!pk) continue;
      const got = pk.rarity;
      if (got === 'SR' || got === 'SSR') gotSR = true;
      d.pity[poolId] = got === 'SSR' ? 0 : pt + 1;
      d.draws++;
      const res = { kind: pk.c.kind, id: pk.c.id, name: pk.c.name, rarity: got, refund: 0 };
      if (pk.c.kind === 'scene') {
        if (d.scenes.includes(pk.c.id)) { res.dup = true; res.refund = DUP_SCENE_REFUND; } else { d.scenes.push(pk.c.id); res.unlocked = true; }
      } else {
        const before = copies(pk.c.id);
        d.shards[pk.c.id] = shards(pk.c.id) + 1;
        res.need = need(pk.c.id); res.shards = shards(pk.c.id); res.copies = copies(pk.c.id);
        res.newCopy = res.copies > before; res.unlocked = before === 0 && res.copies > 0;
        if (got === 'junk') res.refund = JUNK_REFUND;
      }
      if (res.refund) earn(res.refund);
      d.log.push({ t: Date.now(), pool: poolId, id: res.id }); if (d.log.length > 30) d.log.splice(0, d.log.length - 30);
      out.push(res);
    }
    save();
    return out;
  }

  /* ---------- 直購 ---------- */
  function price(id) {
    if (SCENE_PRICE[id]) return SCENE_PRICE[id];
    const it = item(id);
    return it && BUY_SERIES.includes(it.series) && BUY_ITEM[it.rarity] ? BUY_ITEM[it.rarity] : 0;
  }
  function buy(id) {
    const pr = price(id); if (!pr) return { ok: false, reason: '不能直購' };
    const d = ensure(), isScene = !!SCENE_PRICE[id];
    if (isScene && d.scenes.includes(id)) return { ok: false, reason: '已擁有' };
    if (isScene && !scene(id)) return { ok: false, reason: '尚無資料' };
    if (!isScene && !item(id)) return { ok: false, reason: '尚無資料' };
    if (gems() < pr) return { ok: false, reason: '魂晶不足' };
    spend(pr);
    if (isScene) d.scenes.push(id); else d.shards[id] = shards(id) + need(id);
    save();
    return { ok: true, cost: pr };
  }

  /* ---------- 布置 ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const find = k => ensure().placed.find(o => o.k === k);
  function nextKey() { const d = ensure(); let n = d.placed.length + 1; while (d.placed.some(o => o.k === 'p' + n)) n++; return 'p' + n + Math.floor(rng() * 1e4).toString(36); }
  function place(id, x, y, f) {
    const d = ensure();
    if (!item(id) || available(id) <= 0 || d.placed.length >= MAX_PLACED) return null;
    const o = { k: nextKey(), id, x: clamp(+x, 0.03, 0.97), y: clamp(+y, 0, 1), f: f ? 1 : 0 };
    d.placed.push(o); save(); return o;
  }
  function move(k, x, y) { const o = find(k); if (!o) return false; o.x = clamp(+x, 0.03, 0.97); o.y = clamp(+y, 0, 1); save(); return true; }
  function flip(k) { const o = find(k); if (!o) return false; o.f = o.f ? 0 : 1; save(); return true; }
  function remove(k) { const d = ensure(), n = d.placed.length; d.placed = d.placed.filter(o => o.k !== k); save(); return d.placed.length < n; }
  function clearAll() { ensure().placed = []; save(); }
  function setScene(id) { const d = ensure(); if (!d.scenes.includes(id) || !(scene(id))) return false; d.scene = id; save(); return true; }
  /* 目前場景（classic 或資料不存在回傳 null＝用原本的 CSS 營地） */
  function sceneFor(tod) { const d = ensure(); if (d.scene === 'classic') return null; const s = scene(d.scene); return s && s.file ? { ...s, file: s.tod && s.tod[tod] || s.file } : null; }

  /* ---------- 小工具 ---------- */
  const E = s => U.esc(s);
  function imgHTML(it, silhouette) {
    return `<span class="dc-img ${silhouette ? 'sil' : ''}" data-name="${E(it.name)}"><img src="${E(it.file)}" alt="${E(it.name)}" draggable="false"></span>`;
  }
  function fixImgs(root) {
    if (!root) return;
    const bad = im => { const sp = im.closest('.dc-img'); if (sp && !sp.querySelector('.dc-ph')) { im.remove(); sp.insertAdjacentHTML('beforeend', `<span class="dc-ph">${E(sp.dataset.name)}</span>`); } };
    if (!root._dcErr) { root._dcErr = 1; root.addEventListener('error', e => { if (e.target && e.target.tagName === 'IMG') bad(e.target); }, true); }
    root.querySelectorAll('.dc-img img').forEach(im => { if (im.complete && im.naturalWidth === 0) bad(im); });
  }
  const rarTag = r => `<span class="dc-rar r-${r}">${RNAME[r]}</span>`;
  const sceneThumb = s => `<span class="dc-scene-th" style="${s.file ? `background-image:url('${E(s.file)}')` : ''}" data-id="${E(s.id)}">${s.file ? '' : '<i class="dc-classic"></i>'}<em>${E(s.name)}</em></span>`;
  const TOD_LABELS = { morning: '早晨', day: '白天', dusk: '黃昏', night: '夜晚' };
  const sceneStrip = s => s.tod ? `<span class="dc-tod-strip" aria-label="${E(s.name)} 四個時段">${Object.entries(TOD_LABELS).map(([tod, label]) => `<span class="dc-tod-preview" data-scene="${E(s.id)}" data-time="${tod}"><img loading="lazy" src="${E(s.tod[tod])}" alt="${E(s.name)}・${label}" width="1536" height="384"><span>${label}</span></span>`).join('')}</span>` : '';
  const getHow = id => {
    if (id === 'classic') return '預設擁有';
    if (SCENE_PRICE[id]) return `商店直購 ${SCENE_PRICE[id]} 魂晶`;
    const pl = POOL_ORDER.find(k => POOLS[k].scenes.includes(id));
    return pl ? `卡池「${POOLS[pl].name}」SSR` : '';
  };

  /* ---------- 營地 ---------- */
  let M = null; // 營地目前的狀態
  function decorStyle(o, it, sc) {
    const g = sc.ground;
    return `left:${(o.x * 100).toFixed(2)}%;bottom:${(OFF + o.y * g * 100).toFixed(2)}%;width:calc(${it.w}px * var(--ds,1));aspect-ratio:${it.w}/${it.h};z-index:${o.y > 0.5 ? 1 : 2};transform:translateX(-50%)${o.f ? ' scaleX(-1)' : ''}`;
  }
  function renderPlaced() {
    if (!M) return;
    M.scene.querySelectorAll('.decor-obj').forEach(e => e.remove());
    const frag = document.createDocumentFragment();
    ensure().placed.forEach(o => {
      const it = item(o.id); if (!it) return;
      const el = U.h(`<div class="camp-obj decor-obj ${M.sel === o.k ? 'sel' : ''}" data-k="${E(o.k)}" style="${decorStyle(o, it, M.sc)}">${imgHTML(it)}</div>`);
      frag.appendChild(el);
    });
    const anchor = M.scene.querySelector('.camp-hero');
    M.scene.insertBefore(frag, anchor || null);
    fixImgs(M.scene);
  }
  function styleOne(el, o) { const it = item(o.id); if (it) el.style.cssText = decorStyle(o, it, M.sc); }
  function posFromPoint(cx, cy) {
    const r = M.scene.getBoundingClientRect(), g = M.sc.ground;
    return { x: clamp((cx - r.left) / r.width, 0.03, 0.97), y: clamp(((r.bottom - cy) / r.height * 100 - OFF) / (g * 100), 0, 1) };
  }
  function drawer() {
    const dr = U.$('#decorDrawer'); if (!dr) return;
    const d = ensure(), owned = data().items.filter(i => available(i.id) > 0 || placedCount(i.id) > 0);
    const selO = M.sel && find(M.sel), selIt = selO && item(selO.id);
    dr.innerHTML = `<div class="dc-dr-head"><b class="gold-t">🛠 布置營地</b><span class="small-t dim">點下面的物件放進營地；在營地裡拖曳移動。已擺 ${d.placed.length}/${MAX_PLACED}</span><span class="grow"></span>
        <button class="px-btn small" id="dcClear">清空</button><button class="px-btn small gold" id="dcDone">完成</button></div>
      <div class="dc-sel ${selIt ? '' : 'none'}">${selIt ? `<b>${E(selIt.name)}</b><button class="px-btn small" id="dcFlip">↔ 翻轉</button><button class="px-btn small red" id="dcDel">🗑 收回</button>` : '<span class="small-t dim">點營地裡的物件可以翻轉或收回。</span>'}</div>
      <div class="dc-chips">${owned.length ? owned.map(i => { const a = available(i.id); return `<button class="dc-chip r-${i.rarity} ${a <= 0 ? 'used' : ''}" data-id="${E(i.id)}" ${a <= 0 ? 'disabled' : ''} title="${E(i.name)}">${imgHTML(i)}<small>×${Math.max(0, a)}</small></button>`; }).join('') : '<p class="small-t dim">還沒有物件。到商店抽獎或直購吧！</p>'}</div>`;
    fixImgs(dr);
    U.$('#dcDone', dr).onclick = () => setEdit(false);
    U.$('#dcClear', dr).onclick = async () => { if (!ensure().placed.length) return; if (await U.confirm('清空營地', '要把營地裡所有擺放的物件都收回嗎？')) { clearAll(); M.sel = null; renderPlaced(); drawer(); } };
    const fl = U.$('#dcFlip', dr); if (fl) fl.onclick = () => { flip(M.sel); renderPlaced(); drawer(); };
    const del = U.$('#dcDel', dr); if (del) del.onclick = () => { remove(M.sel); M.sel = null; renderPlaced(); drawer(); };
    dr.querySelectorAll('.dc-chip').forEach(ch => {
      let suppress = false;
      ch.addEventListener('click', () => {
        if (suppress) { suppress = false; return; }
        const o = place(ch.dataset.id, 0.3 + rng() * 0.6, 0.1 + rng() * 0.8); if (!o) { U.toast('放不下了（數量用完或已達 ' + MAX_PLACED + ' 件）'); return; }
        SFX.play('click'); M.sel = o.k; renderPlaced(); drawer();
      });
      ch.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'mouse' || e.button !== 0 || ch.disabled) return;
        const sx = e.clientX, sy = e.clientY; let ghost = null;
        const mv = ev => {
          if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) { ghost = U.h(`<div class="dc-ghost">${imgHTML(item(ch.dataset.id))}</div>`); document.body.appendChild(ghost); fixImgs(ghost); }
          if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
        };
        const up = ev => {
          window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
          if (!ghost) return; ghost.remove(); suppress = true; setTimeout(() => { suppress = false; }, 0);
          const r = M.scene.getBoundingClientRect();
          if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom + 20) {
            const pp = posFromPoint(ev.clientX, ev.clientY), o = place(ch.dataset.id, pp.x, pp.y);
            if (o) { SFX.play('click'); M.sel = o.k; renderPlaced(); drawer(); }
          }
        };
        window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
      });
    });
  }
  function setEdit(on) {
    if (!M) return;
    M.edit = !!on; M.sc && 0;
    M.scene.classList.toggle('editing', M.edit);
    const dr = U.$('#decorDrawer'); if (dr) dr.hidden = !M.edit;
    const b = U.$('#decorEdit'); if (b) b.classList.toggle('sel', M.edit);
    M.sel = null; renderPlaced();
    if (M.edit) { drawer(); SFX.play('open'); } else if (dr) dr.innerHTML = '';
  }
  function sceneModal() {
    const d = ensure(), list = data().scenes;
    const m = U.modal({ title: '🖼 營地場景', body: `<div class="dc-scene-grid">${list.map(s => {
      const own = d.scenes.includes(s.id);
      return `<button class="dc-scene-card ${d.scene === s.id ? 'cur' : ''} ${own ? '' : 'lock'}" data-id="${E(s.id)}" ${own ? '' : 'disabled'}>${sceneThumb(s)}<span class="small-t">${d.scene === s.id ? '使用中' : own ? '點一下套用' : '未取得：' + getHow(s.id)}</span></button>`;
    }).join('')}</div><p class="small-t dim mt">更多場景請到「背景商店」。</p>`, buttons: [{ label: '前往商店', onClick: () => App.go('decor') }, { label: '關閉' }] });
    m.el.querySelectorAll('.dc-scene-card:not([disabled])').forEach(b => b.onclick = () => { if (setScene(b.dataset.id)) { SFX.play('win'); m.close(); Screens.hub(); } });
  }
  /* 由 Screens.hub() 在營地畫好、CampFun.init 之前呼叫 */
  function mount(sceneEl, ctx) {
    ctx = ctx || {};
    const sc = sceneFor() || CLASSIC;
    M = { scene: sceneEl, sc, sel: null, edit: false, bubble: ctx.bubble };
    ensure();
    renderPlaced();
    // 布置中：擋掉營地原本的點擊互動（勇者、夥伴、篝火、點地面跑過去）
    sceneEl.addEventListener('click', e => { if (M && M.edit) { e.stopImmediatePropagation(); e.stopPropagation(); if (!e.target.closest('.decor-obj')) { M.sel = null; renderPlaced(); drawer(); } } }, true);
    // 拖曳
    sceneEl.addEventListener('pointerdown', e => {
      const el = e.target.closest('.decor-obj'); if (!M.edit || !el) return;
      e.preventDefault();
      const o = find(el.dataset.k); if (!o) return;
      const r = sceneEl.getBoundingClientRect(), g = M.sc.ground;
      const fx = r.left + o.x * r.width, fy = r.bottom - (OFF + o.y * g * 100) / 100 * r.height;
      const dx = e.clientX - fx, dy = e.clientY - fy;
      const wasSel = M.sel === o.k; let moved = false;
      if (!wasSel) { M.sel = o.k; sceneEl.querySelectorAll('.decor-obj').forEach(x => x.classList.toggle('sel', x === el)); drawer(); }
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      const mv = ev => {
        if (!moved && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 3) return;
        moved = true;
        const pp = posFromPoint(ev.clientX - dx, ev.clientY - dy); o.x = pp.x; o.y = pp.y; styleOne(el, o); el.classList.add('sel', 'drag');
      };
      const up = () => {
        el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        el.classList.remove('drag');
        if (moved) { move(o.k, o.x, o.y); renderPlaced(); }
      };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
    // 一般模式：點物件看名字
    sceneEl.addEventListener('click', e => {
      const el = e.target.closest('.decor-obj'); if (!el || M.edit) return;
      e.stopPropagation();
      const o = find(el.dataset.k), it = o && item(o.id); if (!it) return;
      SFX.play('click'); M.bubble && M.bubble(el, `<b>${E(it.name)}</b><br><span class="small-t">${E(it.desc || '')}</span>`, 3200);
    });
    const eb = U.$('#decorEdit'), sb = U.$('#decorScene'), shb = U.$('#decorShop');
    if (eb) eb.onclick = () => {
      SFX.play('click');
      if (Store.settings.campFolded) { const f = U.$('#campFold'); f && f.click(); }
      setEdit(!M.edit);
    };
    if (sb) sb.onclick = () => { SFX.play('click'); sceneModal(); };
    if (shb) shb.onclick = () => { SFX.play('click'); App.go('decor'); };
  }

  /* ---------- 商店畫面 ---------- */
  const S = { tab: 'gacha', pool: 'standard', fSeries: '', fRar: '' };
  const TABS = [['gacha', '🎰 抽獎'], ['buy', '🛒 直購'], ['bag', '🎒 背包'], ['scenes', '🖼 場景']];
  function screen(tab) {
    if (tab && TABS.some(t => t[0] === tab)) S.tab = tab;
    ensure();
    const root = U.$('#screen');
    root.innerHTML = `<div class="decor-shop panel">
      <div class="row"><h2 class="gold-t" style="margin:0;font-weight:normal">🛍 背景商店</h2><span class="grow"></span><span class="dc-gems">魂晶 <b class="purple-t" id="dcGems">${gems()}</b></span></div>
      <p class="small-t dim">用魂晶購買或抽取營地的布置物件與場景，再到營地的「🛠 布置營地」擺放。<button class="px-btn small" id="dcCamp" style="margin-left:8px">回營地</button></p>
      <div class="dc-tabs">${TABS.map(([k, l]) => `<button class="px-btn small ${S.tab === k ? 'sel' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <div class="dc-body" id="dcBody"></div></div>`;
    U.$('#dcCamp').onclick = () => App.go('hub');
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { SFX.play('click'); S.tab = b.dataset.tab; screen(); });
    const body = U.$('#dcBody');
    ({ gacha: tabGacha, buy: tabBuy, bag: tabBag, scenes: tabScenes })[S.tab](body);
    fixImgs(root);
  }
  const refreshGems = () => { const g = U.$('#dcGems'); if (g) g.textContent = gems(); };
  function tabGacha(body) {
    const pl = POOLS[S.pool], rt = rates(S.pool), d = ensure(), have = poolItems(S.pool).length > 0 || rt.ssr.length > 0;
    const left = untilSSR(S.pool);
    body.innerHTML = `<div class="dc-pools">${POOL_ORDER.map(k => { const q = POOLS[k], ss = ssrCandidates(k); return `<button class="dc-pool ${S.pool === k ? 'sel' : ''}" data-pool="${k}"><b class="gold-t">${E(q.name)}</b><small>${E(q.desc)}</small>
        <span class="dc-showcase">${ss.slice(0, 4).map(x => x.kind === 'item' ? imgHTML(item(x.id)) : sceneThumb(scene(x.id))).join('')}</span></button>`; }).join('')}</div>
      <div class="dc-pull">
        <div class="small-t">本池系列：${pl.series.filter(s => s !== 'junk').map(seriesName).map(E).join('、')}　場景：${pl.scenes.map(id => (scene(id) || { name: id }).name).map(E).join('、')}</div>
        <div class="dc-pity" id="dcPity">再 <b class="gold-t">${left}</b> 抽必得 SSR<small>（已連續 ${pity(S.pool)} 抽沒有 SSR）</small></div>
        <div class="row dc-pull-btns"><button class="px-btn gold" id="dcP1" ${have && gems() >= COST1 ? '' : 'disabled'}>單抽 ${COST1} 魂晶</button><button class="px-btn purple" id="dcP10" ${have && gems() >= COST10 ? '' : 'disabled'}>十連 ${COST10} 魂晶</button></div>
        <div class="small-t dim">${have ? (gems() < COST1 ? '魂晶不足，先去刷題賺魂晶吧。' : '十連保證至少一件 SR 以上。') : '這個卡池的素材還沒準備好。'}</div>
      </div>
      <details class="dc-rates" open><summary>機率</summary><table class="dc-table"><tr><th>稀有度</th><th>機率</th><th>本池數量</th></tr>
        ${RAR.slice().reverse().map(r => `<tr><td>${rarTag(r)}</td><td>${rt.rarity[r]}%</td><td>${rt.counts[r]}</td></tr>`).join('')}</table>
        <p class="small-t dim">SSR 的 ${RATE.SSR}% 由本池 SSR 物件與場景平分：${rt.ssr.map(x => `${E(x.name)}${x.kind === 'scene' ? '（場景）' : ''} ${x.pct.toFixed(2)}%`).join('、') || '—'}。
        每 ${PITY_AT} 抽保底 SSR；碎片：N／R 需 3 片、SR 需 2 片、SSR 與雜物 1 片即可擺放；抽到雜物退 ${JUNK_REFUND} 魂晶，重複抽到場景退 ${DUP_SCENE_REFUND} 魂晶。</p></details>
      ${d.log.length ? `<details class="dc-log"><summary>最近抽到</summary><div class="small-t">${d.log.slice(-10).reverse().map(l => E((item(l.id) || scene(l.id) || { name: l.id }).name)).join('、')}</div></details>` : ''}`;
    body.querySelectorAll('[data-pool]').forEach(b => b.onclick = () => { SFX.play('click'); S.pool = b.dataset.pool; screen(); });
    const go = n => () => { const r = draw(S.pool, n); if (!r) { U.toast('魂晶不足'); return; } refreshGems(); reveal(r, n); };
    U.$('#dcP1', body).onclick = go(1); U.$('#dcP10', body).onclick = go(10);
  }
  function resultNote(r) {
    if (r.kind === 'scene') return r.dup ? `已擁有・退還 ${r.refund} 魂晶` : '新場景解鎖！';
    const parts = [];
    if (r.unlocked) parts.push('解鎖！'); else if (r.newCopy) parts.push('多一件可擺放！');
    parts.push(`+1 碎片 (${r.shards % r.need === 0 && r.shards > 0 ? r.need : r.shards % r.need}/${r.need})`);
    if (r.refund) parts.push(`+${r.refund} 魂晶`);
    return parts.join('　');
  }
  function reveal(results, n) {
    SFX.play('open');
    const best = results.reduce((a, r) => Math.max(a, RAR.indexOf(r.rarity)), 0);
    const cards = results.map((r, i) => {
      const it = r.kind === 'scene' ? scene(r.id) : item(r.id);
      return `<div class="dc-card r-${r.rarity}" style="animation-delay:${i * 0.12}s"><div class="dc-card-img">${r.kind === 'scene' ? sceneThumb(it || { id: r.id, name: r.name, file: '' }) : imgHTML(it || { name: r.name, file: '' })}</div>
        <b>${E(r.name)}</b>${rarTag(r.rarity)}<small>${E(resultNote(r))}</small></div>`;
    }).join('');
    const m = U.modal({ title: n === 10 ? '十連抽結果' : '抽獎結果', body: `<div class="dc-reveal ${n === 10 ? 'ten' : ''} best-${RAR[best]}">${cards}</div><div class="center mt"><button class="px-btn small" id="dcSkip">略過動畫</button></div>`,
      buttons: [{ label: '確定', cls: 'gold', onClick: () => screen() }], onClose: () => screen() });
    SFX.play(best >= 4 ? 'win' : best >= 3 ? 'coin' : 'click');
    const sk = m.el.querySelector('#dcSkip'); if (sk) sk.onclick = () => { m.el.querySelector('.dc-reveal').classList.add('instant'); sk.remove(); };
    fixImgs(m.el);
  }
  function buyCard(it, isScene) {
    const id = it.id, pr = price(id), own = isScene ? ownsScene(id) : copies(id);
    return `<div class="dc-buy r-${isScene ? 'SSR' : it.rarity}">${isScene ? sceneThumb(it) : `<div class="dc-card-img">${imgHTML(it)}</div>`}<b>${E(it.name)}</b>${isScene ? '' : rarTag(it.rarity)}<small>${E(it.desc || '')}</small>
      <small class="dim">${isScene ? (own ? '已擁有' : '場景') : `已有 ${own} 件`}</small>
      <button class="px-btn small gold" data-buy="${E(id)}" ${isScene && own ? 'disabled' : gems() < pr ? 'disabled' : ''}>${isScene && own ? '已擁有' : pr + ' 魂晶'}</button></div>`;
  }
  function tabBuy(body) {
    const d = data(), its = d.items.filter(i => price(i.id)), scs = d.scenes.filter(s => SCENE_PRICE[s.id]);
    body.innerHTML = `<p class="small-t dim">木屋、森林、學院三個系列的 N 與 R 物件可以直接購買（N ${BUY_ITEM.N}、R ${BUY_ITEM.R} 魂晶，買一次多一件）；SR／SSR 與其他系列只能抽獎。</p>
      <h3 class="gold-t">場景</h3><div class="dc-grid">${scs.map(s => buyCard(s, true)).join('') || '<p class="dim small-t">尚無場景資料。</p>'}</div>
      <h3 class="gold-t">物件</h3><div class="dc-grid">${its.map(i => buyCard(i, false)).join('') || '<p class="dim small-t">尚無物件資料。</p>'}</div>`;
    body.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const r = buy(b.dataset.buy);
      if (!r.ok) { U.toast(r.reason); return; }
      SFX.play('coin'); const nm = (item(b.dataset.buy) || scene(b.dataset.buy) || {}).name; U.toast(`購買「${nm}」成功！`);
      const y = window.scrollY; screen(); window.scrollTo(0, y);
    });
  }
  function tabBag(body) {
    const d = data();
    const sers = d.series.filter(s => d.items.some(i => i.series === s.id));
    body.innerHTML = `<div class="dc-filters"><label>系列 <select class="px-in" id="dcFS"><option value="">全部</option>${sers.map(s => `<option value="${E(s.id)}" ${S.fSeries === s.id ? 'selected' : ''}>${E(s.name)}</option>`).join('')}</select></label>
      <label>稀有度 <select class="px-in" id="dcFR"><option value="">全部</option>${RAR.map(r => `<option value="${r}" ${S.fRar === r ? 'selected' : ''}>${RNAME[r]}</option>`).join('')}</select></label>
      <span class="small-t dim">已擁有 ${d.items.filter(i => copies(i.id) > 0).length}/${d.items.length} 種</span></div>
      ${sers.filter(s => !S.fSeries || s.id === S.fSeries).map(s => {
        const list = d.items.filter(i => i.series === s.id && (!S.fRar || i.rarity === S.fRar)); if (!list.length) return '';
        return `<h3 class="gold-t">${E(s.name)} <small class="dim">${list.filter(i => copies(i.id) > 0).length}/${list.length}</small></h3><div class="dc-grid">${list.map(i => {
          const c = copies(i.id), sh = shards(i.id), nd = need(i.id), pc = placedCount(i.id), part = c > 0 ? sh - c * nd : sh;
          return `<div class="dc-bag r-${i.rarity} ${c > 0 ? '' : 'locked'}"><div class="dc-card-img">${imgHTML(i, c <= 0)}</div><b>${c > 0 ? E(i.name) : '？？？'}</b>${rarTag(i.rarity)}
            <div class="dc-prog" title="碎片"><i style="width:${Math.min(100, part / nd * 100)}%"></i><span>${c > 0 ? `擁有 ${c}・已擺 ${pc}` : `碎片 ${sh}/${nd}`}</span></div>${c > 0 ? `<small class="dim">下一件 ${part}/${nd}</small>` : ''}</div>`;
        }).join('')}</div>`;
      }).join('') || '<p class="dim">尚無物件資料。</p>'}`;
    U.$('#dcFS', body).onchange = e => { S.fSeries = e.target.value; screen(); };
    U.$('#dcFR', body).onchange = e => { S.fRar = e.target.value; screen(); };
  }
  function tabScenes(body) {
    const d = ensure(), list = data().scenes;
    body.innerHTML = `<div class="dc-scene-grid big">${list.map(s => {
      const own = d.scenes.includes(s.id), pr = SCENE_PRICE[s.id];
      return `<div class="dc-scene-card ${d.scene === s.id ? 'cur' : ''} ${own ? '' : 'lock'}">${sceneThumb(s)}${sceneStrip(s)}<span class="small-t">${E(s.desc || '')}</span>
        ${own ? `<button class="px-btn small ${d.scene === s.id ? '' : 'gold'}" data-apply="${E(s.id)}" ${d.scene === s.id ? 'disabled' : ''}>${d.scene === s.id ? '使用中' : '套用'}</button>`
          : `<span class="small-t">取得方式：${E(getHow(s.id))}</span>${pr ? `<button class="px-btn small gold" data-buy="${E(s.id)}" ${gems() < pr ? 'disabled' : ''}>購買 ${pr}</button>` : ''}`}</div>`;
    }).join('')}</div>`;
    body.querySelectorAll('[data-apply]').forEach(b => b.onclick = () => { if (setScene(b.dataset.apply)) { SFX.play('win'); U.toast('已套用場景，回營地看看吧！'); screen(); } });
    body.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const r = buy(b.dataset.buy); if (!r.ok) { U.toast(r.reason); return; } SFX.play('coin'); U.toast('購買成功！'); screen(); });
  }

  return {
    screen, mount, sceneFor, ensure, data, sceneModal, setEdit: on => setEdit(on),
    POOLS, RATE, NEED, COST1, COST10, PITY_AT, MAX_PLACED,
    draw, buy, price, rates, pity, untilSSR, copies, shards, available, placedCount, ownsScene,
    place, move, flip, remove, clearAll, setScene,
    set _rng(fn) { rng = fn || (() => Math.random()); }, get _rng() { return rng; }
  };
})();
