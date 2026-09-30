/* 營地與各功能頁：冒險地圖、自由遠征、題庫、錯題本、寵物、強化、圖鑑、角色、設定 */
const Screens = (() => {
  const scr = () => U.$('#screen');
  const P = () => Store.profile;
  const MAIN_SUBJ = Object.keys(C.SUBJECTS);
  const syncSubjects = () => { MAIN_SUBJ.length = 0; MAIN_SUBJ.push(...Object.keys(C.SUBJECTS)); };
  const SETS = window.QB.exams;
  /* 題本（章節／試卷）篩選 chips：只列出目前選到的科目 */
  const setChips = (subjects, sel) => chipGroup(SETS.filter(e => !subjects.length || subjects.includes(e.subj)).map(e => [e.id, QV.exLabel(e)]), sel);

  /* ---------- 題本樹：依 set.path 分層（自由遠征、冒險地圖共用） ----------
   * path 裡和科目同名的層級省略；「106 年國考」「114 學年度」這類來源層放到最後，當成題本按鈕的名稱，
   * 所以 114 大一下的「學期 → 年份 → 科目 → 單元」會顯示成「學期 → 單元 → 各年份」。 */
  const SRC_RE = /(年國考|學年度|考古題)$/;
  function setPlace(e) {
    const sn = C.SUBJECTS[e.subj]?.name;
    const p = (e.path || []).map(String).filter(x => x && x !== sn);
    const src = p.filter(x => SRC_RE.test(x)), dirs = p.filter(x => !SRC_RE.test(x));
    const leaf = src.length ? src.join('・') : QV.exLabel(e).replace(/^【[^】]*】\s*/, '');
    return { dirs, leaf };
  }
  function setTree(exams) {
    const mk = (name, key) => ({ name, key, kids: new Map(), sets: [] });
    const root = mk('', '');
    exams.forEach(e => {
      const { dirs, leaf } = setPlace(e); let n = root;
      dirs.forEach(d => { if (!n.kids.has(d)) n.kids.set(d, mk(d, n.key + '/' + d)); n = n.kids.get(d); });
      n.sets.push({ e, leaf });
    });
    // 只有一個子層、本身沒有題本的層級併成「A › B」，少點一層
    const squash = n => { n.kids.forEach(squash); if (n !== root) while (!n.sets.length && n.kids.size === 1) { const k = [...n.kids.values()][0]; n.name += ' › ' + k.name; n.key = k.key; n.kids = k.kids; n.sets = k.sets; } };
    squash(root);
    return root;
  }
  const treeIds = n => [...n.sets.map(s => s.e.id), ...[...n.kids.values()].flatMap(treeIds)];
  /* 題本挑選器（自由遠征、深淵遠征）：依分類樹收合，每層可一鍵全選；state.exams 空陣列＝全部。
   * 回傳重畫函式；科目改變時呼叫它。展開狀態在這次畫面內記住。 */
  function setPicker(box, state, onChange) {
    const open = {};
    const draw = () => {
      state.exams = state.exams.filter(id => Store.EX[id] && state.subjects.includes(Store.EX[id].subj));
      const sel = new Set(state.exams);
      const pick = ids => { const on = ids.filter(id => sel.has(id)).length;
        return `<span class="dim small-t">${on ? `已選 ${on}／` : ''}${ids.length} 本</span><span class="grow"></span><button class="px-btn small" data-pick="${ids.join(',')}">${on === ids.length ? '取消' : '全選'}</button>`; };
      const chips = sets => `<div class="st-sets">${sets.map(({ e, leaf }) => `<span class="chip ${sel.has(e.id) ? 'on' : ''}" data-v="${e.id}" title="${U.esc(QV.exLabel(e))}">${U.esc(leaf)} <small class="dim">${e.count}</small></span>`).join('')}</div>`;
      const node = (n, sj, depth) => { const k = sj + n.key;
        return `<details class="stree" data-key="${U.esc(k)}" ${(open[k] ?? depth === 0) ? 'open' : ''}><summary><span class="st-name">${U.esc(n.name)}</span>${pick(treeIds(n))}</summary>
          <div class="st-body">${[...n.kids.values()].map(c => node(c, sj, depth + 1)).join('')}${n.sets.length ? chips(n.sets) : ''}</div></details>`; };
      const html = state.subjects.map(sj => {
        const ex = SETS.filter(e => e.subj === sj); if (!ex.length) return '';
        const t = setTree(ex); t.name = C.SUBJECTS[sj].name;
        return node(t, sj, state.subjects.length > 1 ? 1 : 0);   // 選多科時各科先收起來
      }).join('');
      box.innerHTML = html ? `<div class="stree-wrap">${html}</div>` : '<span class="dim small-t">（先選科目）</span>';
    };
    box.addEventListener('toggle', e => { if (e.target.dataset && e.target.dataset.key) open[e.target.dataset.key] = e.target.open; }, true);
    box.onclick = ev => {
      const b = ev.target.closest('[data-pick]'), c = ev.target.closest('.chip[data-v]');
      if (b) {
        ev.preventDefault(); ev.stopPropagation();
        const ids = b.dataset.pick.split(','), all = ids.every(id => state.exams.includes(id));
        state.exams = all ? state.exams.filter(id => !ids.includes(id)) : [...new Set(state.exams.concat(ids))];
      } else if (c) {
        const id = c.dataset.v, i = state.exams.indexOf(id);
        i >= 0 ? state.exams.splice(i, 1) : state.exams.push(id);
      } else return;
      SFX.play('click'); draw(); onChange && onChange();
    };
    draw();
    return draw;
  }
  const TYPES = [['single', '單選'], ['multi', '多選'], ['fill', '填答'], ['open', '非選']];
  const STATUS = [['all', '全部'], ['new', '未作答'], ['wrong', '曾答錯'], ['lastwrong', '上次答錯'], ['unmastered', '未答對過'], ['right', '答對過']];

  /* ---------- 開始遠征 ---------- */
  function buildQueue(cfg) {
    let pool = cfg.ids ? Store.filter({ ids: cfg.ids, types: cfg.types }) : Store.filter(cfg);
    if (!(cfg.types || []).includes('open')) pool = pool.filter(q => q.type !== 'open');
    const units = [], seen = {};
    pool.forEach(q => {
      if (q.group) { if (!seen[q.group]) { seen[q.group] = []; units.push(seen[q.group]); } seen[q.group].push(q.id); }
      else units.push([q.id]);
    });
    const order = cfg.ordered ? units : U.shuffle(units);
    const out = [];
    for (const u of order) { for (const id of u) { if (out.length < cfg.count) out.push(id); } if (out.length >= cfg.count) break; }
    return out;
  }
  async function startRun(cfg) {
    let ids = null;
    if (cfg.mode === 'abyss') {
      const n = Store.filter({ subjects: cfg.subjects, exams: cfg.exams, types: cfg.types }).filter(q => cfg.types.includes('open') || q.type !== 'open').length;
      if (!n) { U.toast('沒有符合條件的題目，請放寬篩選'); return; }
    } else {
      ids = buildQueue(cfg);
      if (!ids.length) { U.toast('沒有符合條件的題目，請放寬篩選'); return; }
    }
    if (Store.loadRun()) {
      if (!(await U.confirm('覆蓋遠征', '目前有一場未完成的遠征，開始新遠征會放棄它（不結算）。確定嗎？'))) return;
    }
    const r = Run.create(cfg, ids);
    r.save();
    App.go('run', r);
  }

  function chipGroup(list, selected, multi = true) {
    return list.map(([v, l]) => `<span class="chip ${selected.includes(v) ? 'on' : ''}" data-v="${v}">${l}</span>`).join('');
  }
  function bindChips(root, sel, state, key, multi = true, onChange) {
    U.$$(sel + ' .chip', root).forEach(c => c.onclick = () => {
      const v = isNaN(c.dataset.v) || key === 'status' || key === 'count' || key === 'exams' ? c.dataset.v : Number(c.dataset.v);
      if (multi) {
        const arr = state[key]; const i = arr.indexOf(v);
        i >= 0 ? arr.splice(i, 1) : arr.push(v);
        c.classList.toggle('on');
      } else {
        state[key] = v; U.$$(sel + ' .chip', root).forEach(x => x.classList.toggle('on', x === c));
      }
      SFX.play('click'); onChange && onChange();
    });
  }

  /* ---------- 營地 ---------- */
  let campTimer = null;
  /* 營地地面：程式產生的草地＋泥土紋理（與寵物同像素密度） */
  let groundCache = null;
  function groundURL() {
    if (groundCache) return groundCache;
    const W = 40, H = 20, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    for (let x = 0; x < W; x++) {
      const tuft = rnd();
      if (tuft > 0.72) put(x, 0, '#5fb84f');
      if (tuft > 0.9 && x > 0) put(x, 0, '#7fd06a');
      for (let y = 1; y < 5; y++) put(x, y, rnd() > 0.8 ? '#7fd06a' : rnd() > 0.5 ? '#5fb84f' : '#56a847');
      put(x, 5, rnd() > 0.5 ? '#4a9440' : '#8a6a48');
      for (let y = 6; y < H; y++) { const r = rnd(); put(x, y, r > 0.9 ? '#b08a60' : r > 0.78 ? '#7a5a3c' : '#9a7650'); }
    }
    for (let i = 0; i < 7; i++) { const x = Math.floor(rnd() * (W - 2)), y = 8 + Math.floor(rnd() * (H - 10)); put(x, y, '#c9c2b6'); put(x + 1, y, '#b0a898'); put(x, y + 1, '#8f877a'); }
    return (groundCache = c.toDataURL());
  }
  /* 山丘紋理：深淺草色斑點＋小花小草叢 */
  let hillCache = null;
  function hillURL() {
    if (hillCache) return hillCache;
    const W = 48, H = 24, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); let seed = 31;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const r = rnd(); put(x, y, r > 0.97 ? '#5a9c52' : r > 0.85 ? '#4e8f48' : r > 0.06 ? '#4a8a44' : '#447f3f'); }
    for (let i = 0; i < 10; i++) { const x = 1 + Math.floor(rnd() * (W - 3)), y = 1 + Math.floor(rnd() * (H - 3)); put(x, y + 1, '#40783c'); put(x + 1, y, '#40783c'); put(x + 2, y + 1, '#40783c'); }
    const fl = ['#fff3a0', '#ffc2d6', '#ffffff'];
    for (let i = 0; i < 6; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H); put(x, y, fl[i % 3]); }
    return (hillCache = c.toDataURL());
  }
  function realTimeOfDay() { const h = new Date().getHours(); return h < 5 ? 'night' : h < 10 ? 'morning' : h < 16 ? 'day' : h < 19 ? 'dusk' : 'night'; }
  function timeOfDay() { const t = Store.settings.campTime; return t && t !== 'auto' ? t : realTimeOfDay(); }
  const TOD = [['auto', '🕒 自動'], ['morning', '🌅 早晨'], ['day', '☀ 白天'], ['dusk', '🌇 黃昏'], ['night', '🌙 夜晚']];
  function starterModal() {
    let pick = 'cat';
    const m = U.modal({ title: '選擇你的第一隻夥伴', closable: false, body: `<p class="center dim">牠會陪你一起闖地牢、一起刷題。其他夥伴之後也能在寵物小屋解鎖。</p>
      <div class="grid g3" id="stp">${C.PETS.filter(p => p.starter).map(p => `<div class="panel dark pet-pick ${p.id === pick ? 'sel' : ''}" data-id="${p.id}">
        <div class="pet-stage">${SP.pet(p.id, 124, 'anim-float')}</div><b class="gold-t">${p.kind}</b><p class="small-t">${p.desc(1)}</p></div>`).join('')}</div>
      <div class="row mt" style="justify-content:center">幫牠取名字：<input class="px-in" id="stn" maxlength="8" value="咪咪"></div>`,
      buttons: [{ label: '就決定是你了！', cls: 'gold', onClick: () => {
        const p = P(); const name = (U.$('#stn').value || '').trim() || C.pet(pick).name;
        p.pets[pick] = p.pets[pick] || { lv: 1, xp: 0 }; p.activePet = pick; p.petNames[pick] = name; p.starterPicked = true;
        Store.saveProfile(); SFX.play('level'); U.toast(`${name} 成為你的夥伴了！`); hub();
      } }] });
    U.$$('.pet-pick', m.el).forEach(el => el.onclick = () => {
      pick = el.dataset.id; SFX.play('pet');
      U.$$('.pet-pick', m.el).forEach(x => x.classList.toggle('sel', x === el));
      U.$('#stn').value = C.pet(pick).name;
    });
  }
  function bubble(target, text, ms = 2600) {
    const scene = U.$('#camp'); if (!scene || !target) return;
    U.$$('.bubble', scene).forEach(b => b.remove());
    const a = scene.getBoundingClientRect(), r = target.getBoundingClientRect();
    const b = U.h(`<div class="bubble">${text}</div>`);
    scene.appendChild(b);
    b.style.left = Math.min(a.width - b.offsetWidth - 6, Math.max(6, r.left - a.left + r.width / 2 - b.offsetWidth / 2)) + 'px';
    b.style.top = Math.max(4, r.top - a.top - b.offsetHeight - 6) + 'px';
    setTimeout(() => b.remove(), ms);
  }
  function hearts(target, n = 4, ch = '♥') {
    const scene = U.$('#camp'); if (!scene || !target) return;
    const a = scene.getBoundingClientRect(), r = target.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const h = U.h(`<i class="heart-fx">${ch}</i>`);
      h.style.left = (r.left - a.left + r.width / 2 + U.rnd(-24, 24)) + 'px';
      h.style.top = (r.top - a.top + 10) + 'px';
      h.style.animationDelay = (i * 0.12) + 's';
      scene.appendChild(h); setTimeout(() => h.remove(), 1400);
    }
  }
  function hub() {
    clearInterval(campTimer);
    const p = P(), run = Store.loadRun();
    if (!p.starterPicked) { scr().innerHTML = '<div class="panel center">…</div>'; return starterModal(); }
    const pet = C.pet(p.activePet), pl = p.pets[p.activePet];
    const acc = U.pct(p.stats.correct, p.stats.answered);
    const wrongN = Object.values(Store.wrong).filter(w => !w.done).length;
    const D = Store.daily(), streak = Store.touchStreak();
    const GOAL = 20;
    const tod = timeOfDay();
    const tiles = [
      run && { id: 'continue', icon: 45, t: '繼續遠征', d: run.mode === 'abyss' ? `${run.title}・第 ${run.act} 章・${C.DIFFS[run.diff || 0].name}` : `${run.title}・第 ${run.floor} 層・剩 ${run.queue.length - run.qi} 題`, cls: 'gold' },
      { id: 'abyss', icon: 110, t: '深淵遠征', d: `三章地圖長冒險・各科首領・已解鎖 ${C.DIFFS[p.abyss.maxDiff].name}`, cls: 'purple' },
      { id: 'learn', icon: '📘', t: '學習模式', d: LEARN_UI.tileDesc(), cls: 'blue' },
      { id: 'import', icon: '📥', t: '導入素材', d: IMP.tileDesc(), cls: 'green' },
      { id: 'prompts', icon: '📋', t: 'AI 提示詞', d: '複製提示詞：素材→課程、出題、補詳解、轉格式、找圖標記' },
      { id: 'map', icon: 57, t: '冒險地圖', d: '依科目與題本挑戰各區域地牢' },
      { id: 'free', icon: 105, t: '自由遠征', d: '自選科目、題本、題型、數量與作答狀態' },
      { id: 'pomo', icon: '🍅', t: '番茄鐘', d: `今天 🍅 ${POMO.data.log.filter(l => new Date(l.t).toDateString() === new Date().toDateString()).length} 顆・專注花園 ${POMO.data.garden.length} 株` },
      { id: 'wrongrun', icon: 64, t: '錯題重刷', d: `以錯題本出征（${wrongN} 題未掌握）` },
      { id: 'bank', icon: 63, t: '題庫', d: `瀏覽 ${window.QB.questions.length} 題，直接作答看詳解` },
      { id: 'wrong', icon: 65, t: '錯題本', d: '自動收錄錯題，篩選、重刷、標記掌握' },
      { id: 'classes', icon: C.cls(p.activeClass).tile, t: '職業殿堂', d: `目前：${C.cls(p.activeClass).name} Lv.${(p.classes[p.activeClass] || { lv: 1 }).lv}・切換/解鎖職業` },
      { id: 'pets', icon: 'heart', t: '寵物小屋', d: '培養夥伴、買造型與配件' },
      { id: 'upg', icon: 74, t: '永久強化', d: '用魂晶提升能力' },
      { id: 'relics', icon: 91, t: '遺物圖鑑', d: '解鎖更強的遺物' },
      { id: 'bestiary', icon: 'eye', t: '怪物圖鑑', d: `怪物 ${C.MONSTERS.filter(m => !m.secret).length} 種、首領 ${Object.values(C.BOSS_DEFS).flat().length} 位` },
      { id: 'ach', icon: 32, t: '成就與收藏', d: `成就 ${Object.keys(p.ach || {}).length}/${C.ACH.length}・魚類圖鑑・隱藏配件` },
      { id: 'char', icon: 100, t: '統計', d: '各科命中率與冒險紀錄' },
      { id: 'settings', icon: 7, t: '設定與存檔', d: '匯出/匯入存檔、作答偏好' }
    ].filter(Boolean);
    let stars = '';
    if (tod === 'night') for (let i = 0; i < 24; i++) stars += `<i class="star" style="left:${U.rnd(0, 100)}%;top:${U.rnd(0, 55)}%;animation-delay:-${U.rnd(0, 30) / 10}s"></i>`;
    scr().innerHTML = `<div class="panel camp-wrap">
        <div class="row" style="justify-content:space-between;align-items:baseline"><h2 style="margin:0">冒險者營地</h2><span class="small-t dim">點點看夥伴、勇者、篝火、信箱、花盆和池塘吧！${(Store.settings.campTime || 'auto') === 'auto' ? '（時段：依現在時間）' : ''}</span></div>
        <div class="camp tod-${tod}" id="camp" style="--ground:url(${groundURL()})">
          <div class="sky">${stars}<div class="celestial"></div><div class="cloud c1"></div><div class="cloud c2"></div></div>
          <div class="hill" style="background-image:url(${hillURL()})"></div><div class="ground"></div>
          <div class="camp-obj camp-board" id="cBoard" title="每日任務">${SP.tile(63, 36)}</div>
          <div class="camp-obj camp-fire" id="cFire"><div class="shadow"></div>${PetArt.html('campfire', 70, '', '', null, null, { still: 1 })}<div class="fire-glow"></div></div>
          <div class="camp-obj camp-hero" id="cHero"><div class="shadow"></div>${FX.heroHD(Store.heroTile(), p.activeClass, 94)}</div>
          ${pet ? `<div class="camp-obj camp-pet ${tod === 'night' ? 'sleepy' : ''}" id="cPet" style="left:52%"><div class="shadow"></div>${Store.petHTML(p.activePet, 66)}<div class="zzz">z<sup>z</sup></div></div>` : ''}
        </div>
        <div class="camp-bar" id="campBar"></div>
        <div class="tod-pick">${TOD.map(([k, l]) => `<button class="px-btn small ${(Store.settings.campTime || 'auto') === k ? 'sel' : ''}" data-tod="${k}">${l}</button>`).join('')}</div>
      </div>
      <div class="hub">
      <div class="panel hero-card">
        <div class="row mt" style="justify-content:space-between"><span><b style="color:${C.cls(p.activeClass).color}">${C.cls(p.activeClass).name}</b> Lv.${(p.classes[p.activeClass] || { lv: 1 }).lv}</span><span>帳號 <b class="gold-t">Lv.${p.accLv}</b></span></div>
        <div class="bar xp mt"><i style="width:${U.pct(p.accXp, Store.accNeed(p.accLv))}%"></i><span>${p.accXp}/${Store.accNeed(p.accLv)}</span></div>
        <div class="daily mt" id="daily">
          <div class="row"><b class="gold-t">今日目標</b><span class="grow"></span><span class="small-t">🔥 連續 ${streak} 天</span></div>
          <div class="small-t">今天答題 ${Math.min(D.answered, GOAL)} / ${GOAL}（答對 ${D.correct}）</div>
          <div class="bar" style="height:12px"><i style="width:${U.pct(Math.min(D.answered, GOAL), GOAL)}%;background:var(--gold)"></i></div>
          <div class="row mt" style="justify-content:flex-end">${D.claimed ? '<span class="tag ok">今日獎勵已領取</span>' : `<button class="px-btn small gold" id="claim" ${D.answered >= GOAL ? '' : 'disabled'}>領取 ${10 + Math.min(streak, 7) * 2} 魂晶</button>`}</div>
        </div>
        ${pet ? `<p class="small-t mt">夥伴：<b>${U.esc(Store.petName(p.activePet))}</b>（${pet.kind}）Lv.${pl.lv}<br><span class="dim">${pet.desc(pl.lv)}</span></p>` : ''}
        <hr class="px">
        <div class="stat-line"><span>魂晶</span><b class="purple-t">${p.gems}</b></div>
        <div class="stat-line"><span>總作答 / 命中率</span><b>${p.stats.answered}・${acc}%</b></div>
        <div class="stat-line"><span>遠征 / 通關</span><b>${p.stats.runs} / ${p.stats.wins}</b></div>
        <div class="stat-line"><span>錯題未掌握</span><b class="red-t">${wrongN}</b></div>
      </div>
      <div class="menu-grid">${tiles.map(t => `<button class="px-btn menu-tile ${t.cls || ''}" data-go="${t.id}">${SP.icon(t.icon, 48)}<span><b>${t.t}</b><small>${t.d}</small></span></button>`).join('')}</div>
    </div>`;
    U.$$('[data-go]').forEach(b => b.onclick = () => {
      SFX.play('click');
      const g = b.dataset.go;
      if (g === 'continue') App.go('run', new Run(Store.loadRun()));
      else if (g === 'wrongrun') wrongRunModal();
      else App.go(g);
    });
    U.$$('[data-tod]').forEach(b => b.onclick = () => { Store.settings.campTime = b.dataset.tod; Store.saveSettings(); SFX.play('click'); hub(); });
    const claim = U.$('#claim');
    if (claim) claim.onclick = () => {
      const g = 10 + Math.min(streak, 7) * 2; D.claimed = true; p.gems += g; Store.saveProfile(); SFX.play('win'); U.toast(`完成今日目標！獲得 ${g} 魂晶`); hub();
    };
    // ---- 互動 ----
    const heroEl = U.$('#cHero'), petEl = U.$('#cPet'), fireEl = U.$('#cFire'), board = U.$('#cBoard');
    const greet = { morning: '早安！今天也來刷幾題吧。', day: '午安～記得多喝水喔。', dusk: '傍晚了，來場深淵遠征如何？', night: '夜深了…再一題就去睡吧！' }[tod];
    const heroLines = [greet, `今天已經答了 ${D.answered} 題，${D.answered >= GOAL ? '目標達成，太棒了！' : `再 ${GOAL - D.answered} 題就達成今日目標！`}`,
      '錯題本的題目連續答對兩次就會「畢業」。', '怪物蓄力的時候，這一題一定要答對！', '精英怪會掉遺物，值得挑戰。', '深淵三章全破，就能解鎖更高的試煉等級。',
      '多選題就算只對一部分，也能造成擦傷。', `目前總命中率 ${acc}%，${acc >= 70 ? '很穩喔！' : '慢慢來，一定會進步。'}`, '累了就去篝火旁休息一下吧。'];
    let hi = 0;
    heroEl.onclick = () => { SFX.play('click'); heroEl.classList.remove('hop'); void heroEl.offsetWidth; heroEl.classList.add('hop'); bubble(heroEl, heroLines[hi++ % heroLines.length]); };
    fireEl.onclick = () => {
      SFX.play('fire'); fireEl.classList.remove('flare'); void fireEl.offsetWidth; fireEl.classList.add('flare'); hearts(fireEl, 6, '✦');
      if (U.chance(0.3)) bubble(fireEl, U.pick(['（劈啪劈啪）', '好溫暖～', '火花飄上了夜空…']));
    };
    board.onclick = () => { SFX.play('open'); bubble(board, `今日目標：答題 ${Math.min(D.answered, GOAL)}/${GOAL}｜連續 ${streak} 天`, 3000); U.$('#daily').classList.remove('pulse'); void U.$('#daily').offsetWidth; U.$('#daily').classList.add('pulse'); };
    if (petEl) {
      const name = Store.petName(p.activePet);
      petEl.onclick = () => {
        SFX.play('pet'); petEl.classList.remove('sleepy'); PetArt.act(petEl, U.pick(['love', 'hop', 'wave', 'wiggle', 'spin']));
        hearts(petEl, 5);
        const line = U.chance(0.55) ? U.pick(pet.voice) : U.pick([`${name}開心地蹭蹭你～`, `${name}：今天也一起加油！`, `${name}盯著你的課本看…`, `${name}想要摸摸！`, `${name}翻了個肚子～`]);
        bubble(petEl, line);
        if (D.pets < 3) { D.pets++; if (D.pets === 3) { p.gems += 3; U.toast(`${name}很開心，叼來了 3 顆魂晶！`); SFX.play('coin'); } Store.saveProfile(); App.refreshTop(); }
      };
      // 夥伴在營地裡走來走去
      campTimer = setInterval(() => {
        if (!document.body.contains(petEl)) { clearInterval(campTimer); return; }
        if (petEl.dataset.busy || CampFun.tick()) return;
        if (tod === 'night' && U.chance(0.7)) { petEl.classList.add('sleepy'); return; }
        petEl.classList.remove('sleepy');
        const cur = parseFloat(petEl.style.left) || 52, nx = U.rnd(40, 68);
        petEl.classList.toggle('flip', nx < cur);
        petEl.style.left = nx + '%';
      }, 3200);
    }
    CampFun.init({ scene: U.$('#camp'), petEl, heroEl, fireEl, tod, bubble, hearts, D, bar: U.$('#campBar') });
  }

  /* ---------- 冒險地圖 ---------- */
  function map() {
    const p = P();
    let html = `<div class="row mb"><h2 class="gold-t" style="margin:0;font-weight:normal">冒險地圖</h2><span class="dim">每個節點是一個題本（章節／試卷）。星等依命中率：90% 以上三星、70% 以上二星、完成一星。</span></div>`;
    const groups = [];
    if (!SETS.length) html += `<div class="panel">題庫是空的。把題目放進 <code>content/bank/</code> 後執行 <code>python tools/build.py</code>。</div>`;
    MAIN_SUBJ.forEach(sj => {
      const S = C.SUBJECTS[sj];
      const exams = SETS.filter(e => e.subj === sj);
      if (!exams.length) return;
      html += `<div class="panel region"><div class="region-head">${SP.tile(S.icon, 48)}<div><b>${U.esc(S.name)}</b> <span class="dim small-t">${U.esc(S.region)}・${exams.length} 關</span><div class="dim small-t">${U.esc(S.desc || '')}</div></div><span class="grow"></span>
        <button class="px-btn small purple" data-all="${sj}">綜合試煉</button></div>`;
      const nodes = sets => `<div class="path">${sets.map(({ e, leaf }, i) => {
        const st = Store.examStats(e.id), sg = p.stages[e.id], stars = sg ? sg.stars : 0;
        return `${i ? '<div class="link"></div>' : ''}<div class="node ${stars ? 'done' : ''}" data-exam="${e.id}" title="${U.esc(QV.exLabel(e))}">
          ${SP.tile(i === sets.length - 1 ? 92 : [45, 46, 47, 21, 33][i % 5], 40)}
          <div class="yr">${U.esc(leaf)}</div><div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
          <div class="small-t dim">${st.done}/${st.total} 題${sg ? `・最佳 ${sg.best}%` : ''}</div>
          <div class="progress-mini"><i style="width:${U.pct(st.done, st.total)}%"></i></div></div>`;
      }).join('')}</div>`;
      const group = (n, depth) => {
        const ids = treeIds(n);
        const cleared = ids.filter(id => p.stages[id]).length;
        groups.push({ ids, title: `${S.name}・${n.name}` });
        return `<details class="stree" data-key="${U.esc(sj + n.key)}" ${openMap[sj + n.key] ?? depth === 0 ? 'open' : ''}>
          <summary><span class="st-name">${U.esc(n.name)}</span><span class="dim small-t">${cleared}/${ids.length} 關</span><span class="grow"></span>
          <button class="px-btn small" data-grp="${groups.length - 1}">挑戰這組</button></summary>
          <div class="st-body">${[...n.kids.values()].map(k => group(k, depth + 1)).join('')}${n.sets.length ? nodes(n.sets) : ''}</div></details>`;
      };
      const tree = setTree(exams);
      html += [...tree.kids.values()].map(k => group(k, 0)).join('') + (tree.sets.length ? nodes(tree.sets) : '');
      html += '</div>';
    });
    scr().innerHTML = html;
    U.$$('[data-exam]').forEach(n => n.onclick = () => stageModal({ examId: n.dataset.exam }));
    U.$$('[data-all]').forEach(n => n.onclick = () => stageModal({ subj: n.dataset.all }));
    U.$$('[data-grp]').forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); stageModal(groups[+b.dataset.grp]); });
    U.$$('details.stree').forEach(d => d.ontoggle = () => { openMap[d.dataset.key] = d.open; });
  }
  const openMap = {};   // 冒險地圖各分組的展開狀態（這次開啟期間記住）
  function stageModal({ examId, subj, ids, title: gTitle }) {
    const ex = examId ? Store.EX[examId] : null;
    const title = ex ? `${C.SUBJECTS[ex.subj].region}・${QV.exLabel(ex)}` : ids ? gTitle : `${C.SUBJECTS[subj].region}・綜合試煉`;
    const state = { count: '20', status: 'all', types: ['single', 'multi', 'fill'] };
    const base = ex ? { exams: [examId] } : ids ? { exams: ids.slice() } : { subjects: [subj] };
    if (ids && !subj) subj = Store.EX[ids[0]].subj;
    const m = U.modal({
      title, narrow: true, body: `
      <div class="filters">
        <div class="frow"><label>題數</label><span id="fc">${chipGroup([['10', '10'], ['20', '20'], ['30', '30'], ['9999', '全部']], [state.count], false)}</span></div>
        <div class="frow"><label>狀態</label><span id="fs">${chipGroup(STATUS, [state.status], false)}</span></div>
        <div class="frow"><label>題型</label><span id="ft">${chipGroup(TYPES, state.types)}</span></div>
        <div class="frow"><label>出題</label><span id="fo">${chipGroup([['rand', '隨機'], ['seq', '依題號']], ['rand'], false)}</span></div>
      </div><p class="dim small-t" id="cnt"></p>`,
      buttons: [{ label: '出發！', cls: 'gold', close: false, onClick: () => go() }]
    });
    state.order = 'rand';
    const upd = () => { const n = Store.filter(Object.assign({}, base, { types: state.types, status: state.status })).length; U.$('#cnt', m.el).textContent = `符合條件：${n} 題（將出 ${Math.min(n, Number(state.count))} 題）`; };
    bindChips(m.el, '#fc', state, 'count', false, upd);
    bindChips(m.el, '#fs', state, 'status', false, upd);
    bindChips(m.el, '#ft', state, 'types', true, upd);
    bindChips(m.el, '#fo', state, 'order', false);
    upd();
    function go() {
      m.close();
      startRun(Object.assign({}, base, { mode: 'map', examId: examId || null, title, count: Number(state.count), status: state.status, types: state.types.slice(), ordered: state.order === 'seq', subjects: ex ? [ex.subj] : [subj] }));
    }
  }

  /* ---------- 自由遠征 ---------- */
  function free() {
    const state = { subjects: MAIN_SUBJ.slice(), exams: [], types: ['single', 'multi', 'fill'], status: 'all', count: '20' };
    scr().innerHTML = `<div class="panel" style="max-width:860px;margin:0 auto"><h2>自由遠征</h2>
      <div class="filters">
        <div class="frow"><label>科目</label><span id="fsj">${chipGroup(MAIN_SUBJ.map(s => [s, C.SUBJECTS[s].name]), state.subjects)}</span></div>
        <div class="frow"><label>題本</label><span id="fy"></span></div>
        <div class="frow"><label>題型</label><span id="ft">${chipGroup(TYPES, state.types)}</span></div>
        <div class="frow"><label>狀態</label><span id="fs">${chipGroup(STATUS, [state.status], false)}</span></div>
        <div class="frow"><label>題數</label><span id="fc">${chipGroup([['10', '10'], ['15', '15'], ['20', '20'], ['30', '30'], ['50', '50'], ['9999', '全部']], [state.count], false)}</span>
          <input class="px-in" id="fcn" type="number" min="3" max="500" placeholder="自訂" style="width:90px"></div>
      </div>
      <p id="cnt" class="gold-t"></p>
      <p class="dim small-t">提示：題數越多，樓層越深、首領越強，獎勵也越多。題本不選＝全部。沒有標準答案的填答／非選題採「揭曉後自評」。</p>
      <div class="row"><button class="px-btn gold big" id="go">出發遠征！</button></div></div>`;
    const upd = () => { const n = Store.filter(state).filter(q => state.types.includes('open') || q.type !== 'open').length; U.$('#cnt').textContent = `符合條件：${n} 題（將出 ${Math.min(n, Number(state.count))} 題）`; };
    const drawSets = setPicker(U.$('#fy'), state, upd);
    bindChips(scr(), '#fsj', state, 'subjects', true, () => { drawSets(); upd(); });
    drawSets();
    bindChips(scr(), '#ft', state, 'types', true, upd);
    bindChips(scr(), '#fs', state, 'status', false, upd);
    bindChips(scr(), '#fc', state, 'count', false, () => { U.$('#fcn').value = ''; upd(); });
    U.$('#fcn').oninput = e => { if (e.target.value) { state.count = String(U.clamp(Number(e.target.value), 1, 999)); U.$$('#fc .chip').forEach(c => c.classList.remove('on')); upd(); } };
    upd();
    U.$('#go').onclick = () => {
      if (!state.subjects.length || !state.types.length) { U.toast('科目、題型至少各選一項'); return; }
      startRun(Object.assign({}, state, { mode: 'free', title: '自由遠征', count: Number(state.count), subjects: state.subjects.slice(), exams: state.exams.slice(), types: state.types.slice() }));
    };
  }

  /* ---------- 題目列 ---------- */
  function qrow(q) {
    const ex = Store.EX[q.exam];
    const st = Store.qs[q.id];
    const img = q.imgs[0] || (q.group && window.QB.groups[q.group]?.imgs[0]) || '';
    const txt = !img && (q.stem || (q.group && window.QB.groups[q.group]?.text) || '').replace(/[#*`>|]/g, '').slice(0, 60);
    const stTag = !st ? '<span class="tag">未作答</span>' : st.last ? `<span class="tag ok">✔ ${st.c}/${st.a}</span>` : `<span class="tag ng">✘ ${st.c}/${st.a}</span>`;
    const w = Store.wrong[q.id];
    const row = U.h(`<div class="qrow"><div class="thumb ${img ? '' : 'txt'}">${img ? `<img src="${U.img(img)}" loading="lazy">` : U.esc(txt)}</div>
      <div><span class="tag" style="border-color:${C.SUBJECTS[ex.subj].color}">${U.esc(QV.exLabel(ex))}</span><span class="tag">第 ${U.esc(q.n)} 題</span><span class="tag ${q.type}">${QV.typeName(q)}</span>
      ${q.label ? `<span class="tag">${U.esc(q.label)}</span>` : ''}${st && q.tag ? `<span class="dim small-t">${U.esc(q.tag)}</span>` : ''}
      ${w ? `<span class="small-t ${w.done ? 'green-t' : 'red-t'}">${w.done ? '（錯題已掌握）' : `（錯 ${w.n} 次）`}</span>` : ''}</div>
      <div>${stTag}</div></div>`);
    row.onclick = () => QV.practiceModal(q, () => { const nr = qrow(q); row.replaceWith(nr); });
    return row;
  }

  /* ---------- 題庫 ---------- */
  function bank(init) {
    const state = Object.assign({ subjects: [], exams: [], types: [], status: 'all', search: '', page: 0 }, init || {});
    scr().innerHTML = `<div class="panel"><h2>題庫</h2>
      <div class="filters">
        <div class="frow"><label>科目</label><span id="fsj">${chipGroup(Object.keys(C.SUBJECTS).map(s => [s, C.SUBJECTS[s].name]), state.subjects)}</span></div>
        <div class="frow"><label>題本</label><span id="fy"></span></div>
        <div class="frow"><label>題型</label><span id="ft">${chipGroup(TYPES, state.types)}</span></div>
        <div class="frow"><label>狀態</label><span id="fs">${chipGroup(STATUS, [state.status], false)}</span></div>
        <div class="frow"><label>搜尋</label><input class="px-in" id="fq" placeholder="題目、標籤或詳解的關鍵字" style="width:min(380px,100%)"></div>
      </div>
      <div class="row mt"><span id="cnt" class="gold-t"></span><span class="grow"></span><button class="px-btn small gold" id="runit">用這些題目出征</button></div>
      <div class="qlist mt" id="ql"></div><div class="pager" id="pg"></div></div>`;
    const PER = 30;
    const draw = () => {
      const list = Store.filter(state);
      U.$('#cnt').textContent = `共 ${list.length} 題`;
      const pages = Math.max(1, Math.ceil(list.length / PER));
      state.page = U.clamp(state.page, 0, pages - 1);
      const ql = U.$('#ql'); ql.innerHTML = '';
      list.slice(state.page * PER, state.page * PER + PER).forEach(q => ql.appendChild(qrow(q)));
      const pg = U.$('#pg');
      pg.innerHTML = `<button class="px-btn small" ${state.page ? '' : 'disabled'} data-p="-1">◀</button><span>${state.page + 1} / ${pages}</span><button class="px-btn small" ${state.page < pages - 1 ? '' : 'disabled'} data-p="1">▶</button>`;
      U.$$('[data-p]', pg).forEach(b => b.onclick = () => { state.page += Number(b.dataset.p); draw(); window.scrollTo(0, 0); });
    };
    const upd = () => { state.page = 0; draw(); };
    const drawSets = () => { if (state.subjects.length) state.exams = state.exams.filter(id => state.subjects.includes(Store.EX[id].subj)); U.$('#fy').innerHTML = setChips(state.subjects, state.exams); bindChips(scr(), '#fy', state, 'exams', true, upd); };
    bindChips(scr(), '#fsj', state, 'subjects', true, () => { drawSets(); upd(); });
    drawSets();
    bindChips(scr(), '#ft', state, 'types', true, upd);
    bindChips(scr(), '#fs', state, 'status', false, upd);
    let tmr; U.$('#fq').oninput = e => { clearTimeout(tmr); tmr = setTimeout(() => { state.search = e.target.value; upd(); }, 250); };
    U.$('#runit').onclick = () => {
      const ids = Store.filter(state).filter(q => q.type !== 'open' || state.types.includes('open')).map(q => q.id);
      if (!ids.length) { U.toast('沒有可出征的題目'); return; }
      runCountModal('題庫遠征', ids, state.types.length ? state.types : ['single', 'multi', 'fill']);
    };
    draw();
  }
  function runCountModal(title, ids, types) {
    const state = { count: String(Math.min(20, ids.length)) };
    const opts = [['10', '10'], ['20', '20'], ['30', '30'], ['9999', `全部(${ids.length})`]];
    const m = U.modal({ title, narrow: true, body: `<p>可用題目 ${ids.length} 題，要出幾題？</p><div id="fc">${chipGroup(opts, [state.count], false)}</div>`,
      buttons: [{ label: '出發！', cls: 'gold', onClick: () => startRun({ mode: 'list', title, ids, types: types.concat(['open']), count: Number(state.count) }) }] });
    bindChips(m.el, '#fc', state, 'count', false);
  }

  /* ---------- 錯題本 ---------- */
  function wrongbook() {
    const state = { subjects: [], types: [], mode: 'todo', sort: 'recent' };
    scr().innerHTML = `<div class="panel"><h2>錯題本</h2>
      <p class="dim small-t">答錯的題目會自動收錄；之後連續答對 2 次會自動標記為「已掌握」。</p>
      <div class="filters">
        <div class="frow"><label>科目</label><span id="fsj">${chipGroup(MAIN_SUBJ.map(s => [s, C.SUBJECTS[s].name]), [])}</span></div>
        <div class="frow"><label>題型</label><span id="ft">${chipGroup(TYPES, [])}</span></div>
        <div class="frow"><label>狀態</label><span id="fm">${chipGroup([['todo', '未掌握'], ['done', '已掌握'], ['all', '全部']], ['todo'], false)}</span></div>
        <div class="frow"><label>排序</label><span id="fo">${chipGroup([['recent', '最近答錯'], ['most', '錯最多次'], ['exam', '依題本']], ['recent'], false)}</span></div>
      </div>
      <div class="row mt"><span id="cnt" class="gold-t"></span><span class="grow"></span>
        <button class="px-btn small gold" id="rerun">錯題重刷遠征</button><button class="px-btn small" id="drill">逐題重刷</button><button class="px-btn small red" id="clean">移除已掌握</button></div>
      <div class="qlist mt" id="ql"></div></div>`;
    const list = () => {
      let ids = Object.keys(Store.wrong).filter(id => Store.Q[id]);
      ids = ids.filter(id => state.mode === 'all' || (state.mode === 'done') === !!Store.wrong[id].done);
      let qsList = Store.filter({ ids, subjects: state.subjects, types: state.types });
      const W = Store.wrong;
      if (state.sort === 'recent') qsList.sort((a, b) => W[b.id].t - W[a.id].t);
      else if (state.sort === 'most') qsList.sort((a, b) => W[b.id].n - W[a.id].n);
      return qsList;
    };
    const draw = () => {
      const l = list();
      U.$('#cnt').textContent = `共 ${l.length} 題`;
      const ql = U.$('#ql'); ql.innerHTML = l.length ? '' : '<p class="dim center">這裡空空的。去地牢冒險吧！</p>';
      l.slice(0, 200).forEach(q => {
        const r = qrow(q);
        const b = U.h(`<button class="px-btn small">${Store.wrong[q.id].done ? '移除' : '標記掌握'}</button>`);
        b.onclick = e => {
          e.stopPropagation();
          if (Store.wrong[q.id].done) delete Store.wrong[q.id]; else Store.wrong[q.id].done = true;
          Store.saveWrong(); draw();
        };
        r.lastElementChild.appendChild(b);
        ql.appendChild(r);
      });
    };
    bindChips(scr(), '#fsj', state, 'subjects', true, draw);
    bindChips(scr(), '#ft', state, 'types', true, draw);
    bindChips(scr(), '#fm', state, 'mode', false, draw);
    bindChips(scr(), '#fo', state, 'sort', false, draw);
    U.$('#rerun').onclick = () => {
      const ids = list().filter(q => q.type !== 'open' || state.types.includes('open')).map(q => q.id);
      if (!ids.length) { U.toast('目前沒有符合的錯題'); return; }
      runCountModal('錯題重刷', ids, ['single', 'multi', 'fill', 'open']);
    };
    U.$('#drill').onclick = () => {
      const l = list(); if (!l.length) { U.toast('目前沒有符合的錯題'); return; }
      let i = 0;
      const nextQ = () => { if (i >= l.length) { U.toast('錯題已全部刷完！'); draw(); return; } QV.practiceModal(l[i++], nextQ); };
      nextQ();
    };
    U.$('#clean').onclick = () => { Object.keys(Store.wrong).forEach(id => { if (Store.wrong[id].done) delete Store.wrong[id]; }); Store.saveWrong(); draw(); U.toast('已移除所有已掌握的錯題'); };
    draw();
  }
  function wrongRunModal() {
    const ids = Object.keys(Store.wrong).filter(id => !Store.wrong[id].done && Store.Q[id]);
    if (!ids.length) { U.toast('錯題本目前沒有未掌握的題目'); return; }
    runCountModal('錯題重刷', ids, ['single', 'multi', 'fill', 'open']);
  }

  /* ---------- 寵物小屋 ---------- */
  function pets() {
    const p = P();
    scr().innerHTML = `<div class="panel"><h2>寵物小屋</h2><p class="dim">出戰的夥伴會陪你冒險，戰鬥中每答對一題獲得 1 點經驗；也可以用魂晶餵食。每隻夥伴都能換造型、戴配件、取名字。你的魂晶：<b class="purple-t">${p.gems}</b></p>
      <div class="grid g3" id="pl"></div></div>`;
    const pl = U.$('#pl');
    C.PETS.forEach(pt => {
      const own = p.pets[pt.id], active = p.activePet === pt.id;
      const lv = own ? own.lv : 1;
      const feedCost = 5 + lv * 3;
      const card = U.h(`<div class="panel pet-card ${active ? 'active' : ''} ${own ? '' : 'locked'}">
        <div class="pet-stage">${Store.petHTML(pt.id, 108, own ? 'anim-float' : '')}</div>
        <b class="gold-t">${U.esc(Store.petName(pt.id))}</b> <span class="dim">${pt.kind}</span>
        <div>${own ? `Lv.${lv}${lv >= C.PET_MAX ? '（滿級）' : ''}` : '未解鎖'}</div>
        ${own && lv < C.PET_MAX ? `<div class="bar xp" style="height:12px"><i style="width:${U.pct(own.xp, C.petNeed(lv))}%"></i></div>` : ''}
        <p class="small-t">${pt.desc(lv)}</p>
        <div class="row" style="justify-content:center"></div></div>`);
      const row = card.querySelector('.row');
      const pst = card.querySelector('.pet-stage');
      if (own) pst.onclick = () => { SFX.play('pet'); PetArt.act(pst, U.pick(['love', 'hop', 'wave', 'wiggle', 'spin', 'wink'])); U.toast(`${Store.petName(pt.id)}：${U.pick(pt.voice)}`, 1500); };
      if (!own) {
        const b = U.h(`<button class="px-btn purple" ${p.gems < pt.cost ? 'disabled' : ''}>解鎖（${pt.cost} 魂晶）</button>`);
        b.onclick = () => { p.gems -= pt.cost; p.pets[pt.id] = { lv: 1, xp: 0 }; Store.saveProfile(); SFX.play('level'); U.toast(`${pt.name} 加入了隊伍！`); pets(); };
        row.appendChild(b);
      } else {
        if (!active) { const b = U.h('<button class="px-btn gold small">出戰</button>'); b.onclick = () => { p.activePet = pt.id; Store.saveProfile(); SFX.play('pet'); pets(); }; row.appendChild(b); }
        else row.appendChild(U.h('<span class="tag ok">出戰中</span>'));
        const sk = U.h('<button class="px-btn small blue">造型</button>'); sk.onclick = () => styleModal(pt.id); row.appendChild(sk);
        if (lv < C.PET_MAX) {
          const b = U.h(`<button class="px-btn small purple" ${p.gems < feedCost ? 'disabled' : ''}>餵食 ${feedCost}</button>`);
          b.onclick = () => {
            p.gems -= feedCost; const old = p.activePet; p.activePet = pt.id;
            const ups = Store.petXp(8); p.activePet = old; Store.saveProfile();
            SFX.play(ups ? 'level' : 'pet'); U.toast(ups ? `${Store.petName(pt.id)} 升級了！` : `${Store.petName(pt.id)} 開心地吃掉了（經驗 +8）`); pets();
          };
          row.appendChild(b);
        }
      }
      pl.appendChild(card);
    });
  }
  /* 造型／配件／取名 */
  function styleModal(id) {
    const p = P();
    const m = U.modal({ title: `${Store.petName(id)} 的衣櫃`, body: '<div id="sty"></div>', onClose: () => pets() });
    const box = U.$('#sty', m.el);
    // 試穿狀態：點任何造型/服裝都先試穿，不會直接購買
    let trySkin = p.petSkin[id] || '', tryAcc = p.petAcc[id] || '';
    const skinOwned = sid => !sid || p.ownedSkins.includes(id + ':' + sid);
    const accOwned = aid => !aid || p.ownedAcc.includes(aid);
    const skinName = sid => ([{ id: '', name: '原色' }].concat(C.PET_SKINS[id] || []).find(s => s.id === sid) || {}).name;
    const accInfo = aid => aid ? C.PET_ACCS.find(a => a.id === aid) : { id: '', name: '不戴', cost: 0 };
    const draw = () => {
      const skins = [{ id: '', name: '原色' }].concat(C.PET_SKINS[id] || []);
      const needSkin = !skinOwned(trySkin), needAcc = !accOwned(tryAcc);
      const cost = (needSkin ? C.SKIN_COST : 0) + (needAcc ? accInfo(tryAcc).cost : 0);
      const wearing = trySkin === (p.petSkin[id] || '') && tryAcc === (p.petAcc[id] || '');
      box.innerHTML = `<div class="row" style="align-items:flex-start;gap:18px">
        <div class="col" style="align-items:center">
          <div class="pet-stage big-stage fitting" id="fit">${Store.petHTML(id, 150, 'anim-float', '', trySkin, tryAcc)}</div>
          <div class="small-t dim">點牠看動作</div>
        </div>
        <div class="grow">
          <div class="row">名字：<input class="px-in" id="pnm" maxlength="8" value="${U.esc(Store.petName(id))}"><button class="px-btn small" id="pnb">改名</button></div>
          <div class="try-bar mt">
            <div><b class="gold-t">試穿中</b>：${skinName(trySkin)}${needSkin ? '<span class="tag ng">未擁有</span>' : ''}・${accInfo(tryAcc).name}${needAcc ? '<span class="tag ng">未擁有</span>' : ''}</div>
            <div class="row mt">
              ${wearing ? '<span class="tag ok">目前穿著</span>'
                : cost ? `<button class="px-btn gold small" id="buy" ${p.gems < cost ? 'disabled' : ''}>購買並穿上（${cost} 魂晶）</button>`
                : '<button class="px-btn gold small" id="wear">穿上</button>'}
              ${wearing ? '' : '<button class="px-btn small" id="undo">還原成目前穿著</button>'}
              <span class="small-t dim">魂晶：<b class="purple-t">${p.gems}</b></span>
            </div>
          </div>
          <p class="small-t dim">點任何造型或服裝都能免費試穿；造型每隻 ${C.SKIN_COST} 魂晶，配件與套裝買一次所有夥伴都能穿。</p>
          <h3>造型</h3><div class="row" id="sks"></div>
          <h3 class="mt">配件與整套服裝</h3><div class="row" id="acs"></div>
        </div></div>`;
      const sks = U.$('#sks', box), acs = U.$('#acs', box);
      skins.forEach(s => {
        const owned = skinOwned(s.id), on = trySkin === s.id;
        const b = U.h(`<button class="px-btn small style-opt ${on ? 'sel' : ''}">${Store.petHTML(id, 44, '', '', s.id, tryAcc)}<span>${s.name}${owned ? ((p.petSkin[id] || '') === s.id ? '<br><b class="green-t">穿著中</b>' : '<br><b class="dim">已擁有</b>') : `<br><b class="purple-t">${C.SKIN_COST}</b>`}</span></button>`);
        b.onclick = () => { trySkin = s.id; SFX.play('pet'); draw(); PetArt.act(U.$('#fit', box), 'hop'); };
        sks.appendChild(b);
      });
      [{ id: '', name: '不戴', cost: 0 }].concat(C.PET_ACCS.filter(a => !a.hidden || accOwned(a.id))).forEach(a => {
        const owned = accOwned(a.id), on = tryAcc === a.id;
        const b = U.h(`<button class="px-btn small style-opt ${on ? 'sel' : ''} ${a.set ? 'is-set' : ''}">${Store.petHTML(id, 44, '', '', trySkin, a.id)}<span>${a.name}${owned ? ((p.petAcc[id] || '') === a.id ? '<br><b class="green-t">穿著中</b>' : (a.id ? '<br><b class="dim">已擁有</b>' : '')) : `<br><b class="purple-t">${a.cost}</b>`}</span></button>`);
        b.onclick = () => { tryAcc = a.id; SFX.play('pet'); draw(); PetArt.act(U.$('#fit', box), a.set ? 'wave' : 'hop'); };
        acs.appendChild(b);
      });
      const fit = U.$('#fit', box);
      fit.onclick = () => { SFX.play('pet'); PetArt.act(fit, U.pick(['love', 'hop', 'wave', 'wiggle', 'spin', 'wink'])); };
      const buy = U.$('#buy', box), wear = U.$('#wear', box), undo = U.$('#undo', box);
      const apply = () => { p.petSkin[id] = trySkin; p.petAcc[id] = tryAcc; Store.saveProfile(); SFX.play('level'); draw(); PetArt.act(U.$('#fit', box), 'love'); };
      if (buy) buy.onclick = () => {
        if (p.gems < cost) { U.toast('魂晶不足'); return; }
        p.gems -= cost;
        if (needSkin) p.ownedSkins.push(id + ':' + trySkin);
        if (needAcc) p.ownedAcc.push(tryAcc);
        SFX.play('coin'); U.toast('購買成功，已穿上！'); apply(); App.refreshTop();
      };
      if (wear) wear.onclick = () => { apply(); U.toast('換好了！'); };
      if (undo) undo.onclick = () => { trySkin = p.petSkin[id] || ''; tryAcc = p.petAcc[id] || ''; SFX.play('click'); draw(); };
      U.$('#pnb', box).onclick = () => { const v = U.$('#pnm', box).value.trim(); if (!v) return; p.petNames[id] = v; Store.saveProfile(); U.toast(`改名為「${v}」`); m.el.querySelector('h2').textContent = `${v} 的衣櫃`; };
    };
    draw();
  }

  /* ---------- 永久強化 ---------- */
  function upg() {
    const p = P();
    scr().innerHTML = `<div class="panel"><h2>永久強化</h2><p class="dim">每次遠征結算都會獲得魂晶。你的魂晶：<b class="purple-t">${p.gems}</b></p><div class="grid g2" id="ul"></div></div>`;
    const ul = U.$('#ul');
    C.UPGRADES.forEach(u => {
      const lv = Store.upg(u.id), max = lv >= u.max, cost = u.cost(lv);
      const card = U.h(`<div class="panel dark"><div class="row">${SP.icon(u.icon, 40)}<div class="grow"><b class="gold-t">${u.name}</b><div class="small-t">${u.desc}</div>
        <div class="pips">${Array.from({ length: u.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div></div>
        <button class="px-btn purple mt" ${max || p.gems < cost ? 'disabled' : ''}>${max ? '已滿級' : `強化（${cost} 魂晶）`}</button></div>`);
      card.querySelector('button').onclick = () => { p.gems -= cost; p.upg[u.id] = lv + 1; Store.saveProfile(); SFX.play('level'); upg(); };
      ul.appendChild(card);
    });
  }

  /* ---------- 遺物圖鑑 ---------- */
  function relics() {
    const p = P();
    scr().innerHTML = `<div class="panel"><h2>遺物圖鑑</h2><p class="dim">已解鎖的遺物才會在遠征中出現（天賦抉擇、行商、精英掉落、祭壇）。魂晶：<b class="purple-t">${p.gems}</b></p><div class="grid g2" id="rl"></div></div>`;
    const rl = U.$('#rl');
    C.RELICS.forEach(r => {
      if (r.secret) {
        const seen = (p.relicsSeen || []).includes(r.id);
        rl.appendChild(U.h(`<div class="panel dark choice-card rar-4" style="width:auto;cursor:default"><div class="row">${SP.icon(seen ? r.icon : 'question', 44, '', seen ? '' : 'filter:brightness(0) opacity(.5)')}<div class="grow"><b>${seen ? r.name : '？？？'}</b> <span class="small-t" style="color:var(--pink,#ff9fbf)">隱藏遺物</span><div class="small-t">${seen ? r.desc : '只能在深淵的特殊事件中取得'}</div></div></div></div>`));
        return;
      }
      if (r.boss) {
        rl.appendChild(U.h(`<div class="panel dark choice-card rar-4" style="width:auto;cursor:default"><div class="row">${SP.icon(r.icon, 44)}<div class="grow"><b>${r.name}</b> <span class="small-t" style="color:var(--orange)">首領遺物</span><div class="small-t">${r.desc}</div></div></div><div class="small-t dim mt">深淵遠征擊敗首領後三選一</div></div>`));
        return;
      }
      const un = p.relicsUnlocked.includes(r.id);
      const card = U.h(`<div class="panel dark choice-card rar-${r.rar + 1}" style="width:auto;cursor:default"><div class="row">${SP.icon(r.icon, 44, '', un ? '' : 'filter:brightness(0) opacity(.6)')}
        <div class="grow"><b>${r.name}</b> <span class="small-t dim">${['', '普通', '稀有', '傳說'][r.rar]}</span><div class="small-t">${r.desc}</div></div></div></div>`);
      if (!un) {
        const b = U.h(`<button class="px-btn purple small mt" ${p.gems < r.cost ? 'disabled' : ''}>解鎖（${r.cost} 魂晶）</button>`);
        b.onclick = () => { p.gems -= r.cost; p.relicsUnlocked.push(r.id); Store.saveProfile(); SFX.play('level'); U.toast(`解鎖遺物「${r.name}」`); relics(); };
        card.appendChild(b);
      } else card.appendChild(U.h('<div class="small-t green-t mt">已解鎖</div>'));
      rl.appendChild(card);
    });
  }

  /* ---------- 角色與統計 ---------- */
  function char() {
    const p = P();
    const bySubj = {};
    Object.entries(Store.qs).forEach(([id, s]) => {
      const q = Store.Q[id]; if (!q) return;
      const sj = Store.EX[q.exam].subj; const b = bySubj[sj] || (bySubj[sj] = { a: 0, c: 0, q: 0 });
      b.a += s.a; b.c += s.c; b.q++;
    });
    scr().innerHTML = `<div class="grid g2">
      <div class="panel"><h2>各科命中率</h2>${MAIN_SUBJ.map(sj => {
        const b = bySubj[sj] || { a: 0, c: 0, q: 0 }; const tot = window.QB.questions.filter(q => Store.EX[q.exam].subj === sj && q.type !== 'open').length;
        return `<div class="mb"><div class="row"><b style="color:${C.SUBJECTS[sj].color}">${C.SUBJECTS[sj].name}</b><span class="grow"></span><span class="small-t">已練 ${b.q}/${tot} 題・命中 ${U.pct(b.c, b.a)}%</span></div>
          <div class="bar" style="height:12px"><i style="width:${U.pct(b.c, b.a)}%;background:${C.SUBJECTS[sj].color}"></i></div></div>`;
      }).join('')}
        <hr class="px">
        <div class="stat-line"><span>總作答次數</span><b>${p.stats.answered}</b></div>
        <div class="stat-line"><span>總答對</span><b>${p.stats.correct}</b></div>
        <div class="stat-line"><span>擊敗怪物</span><b>${p.stats.kills}</b></div>
        <div class="stat-line"><span>擊敗首領</span><b>${p.stats.bosses}</b></div>
        <div class="stat-line"><span>倒下次數</span><b>${p.stats.deaths}</b></div>
        <div class="stat-line"><span>累計魂晶</span><b>${p.stats.gemsEarned}</b></div>
      </div></div>`;
  }

  /* ---------- 音量控制（設定頁與頂部彈窗共用） ---------- */
  function volumeControls() {
    const box = U.h(`<div class="vol col">
      ${[['master', '總音量'], ['music', '背景音樂'], ['sfx', '音效']].map(([k, l]) => `<label class="volrow"><span>${l}</span><input type="range" min="0" max="100" step="1" data-k="${k}" value="${Math.round(VOL.get(k) * 100)}"><b>${Math.round(VOL.get(k) * 100)}</b></label>`).join('')}
      <label class="row"><input type="checkbox" data-mute ${VOL.get('muted') ? 'checked' : ''}> 全部靜音</label>
      <div class="row now-playing"><span class="small-t">♪ <span data-track>${BGM.track}</span></span><span class="grow"></span>
        <button class="px-btn small" data-bgm="-1" title="上一首">⏮</button><button class="px-btn small" data-bgm="1" title="下一首">⏭</button><button class="px-btn small" data-bgm="set">🎵 音樂設定</button></div>
      <hr class="px" style="margin:6px 0"><b class="gold-t">白噪音</b>
      <div class="row amb-presets">${AMB.PRESETS.map((pr, i) => `<button class="px-btn small" data-pre="${i}">${pr.name}</button>`).join('')}</div>
      <label class="volrow"><span>白噪音總量</span><input type="range" min="0" max="100" step="1" data-k="amb" value="${Math.round(VOL.get('amb') * 100)}"><b>${Math.round(VOL.get('amb') * 100)}</b></label>
      ${Object.entries(AMB.TYPES).map(([k, t]) => `<label class="volrow amb"><span>${t.icon} ${t.name}</span><input type="range" min="0" max="100" step="1" data-k="amb_${k}" value="${Math.round((VOL.get('amb_' + k) || 0) * 100)}"><b>${Math.round((VOL.get('amb_' + k) || 0) * 100) || '關'}</b></label>`).join('')}
      <div class="small-t dim">可以同時混合多種聲音，拉到 0 即關閉（CC0 實錄環境音）</div>
      <div class="small-t dim">音量控制方式：${U.esc(MIX.info())}${IS_IOS ? '（iPhone 側邊靜音鍵開啟時會沒有聲音）' : ''}</div></div>`);
    U.$$('input[type=range]', box).forEach(r => {
      r.oninput = () => { VOL.set(r.dataset.k, r.value / 100); r.nextElementSibling.textContent = (r.dataset.k.startsWith('amb_') && +r.value === 0) ? '關' : r.value; };
      r.onchange = () => SFX.play('coin');
    });
    box.querySelector('[data-mute]').onchange = e => { VOL.set('muted', e.target.checked); App.refreshTop(); };
    U.$$('[data-bgm]', box).forEach(b => b.onclick = e => {
      e.preventDefault();
      if (b.dataset.bgm === 'set') { App.go('settings'); setTimeout(() => U.$('#musicbox')?.scrollIntoView({ block: 'start' }), 50); return; }
      BGM.next(+b.dataset.bgm); SFX.play('click');
    });
    U.$$('[data-pre]', box).forEach(b => b.onclick = e => {
      e.preventDefault(); AMB.applyPreset(+b.dataset.pre); SFX.play('click');
      U.$$('input[data-k^="amb_"]', box).forEach(r => { r.value = Math.round((VOL.get(r.dataset.k) || 0) * 100); r.nextElementSibling.textContent = +r.value ? r.value : '關'; });
      App.refreshTop();
    });
    return box;
  }

  /* ---------- 深淵遠征：設定 ---------- */
  function abyss() {
    const p = P(), A = p.abyss;
    const last = p.abyssCfg || {};
    const state = { subjects: (last.subjects || MAIN_SUBJ.slice()).filter(x => C.SUBJECTS[x]), exams: (last.exams || []).filter(id => Store.EX[id]), types: last.types || ['single', 'multi', 'fill'], pref: last.pref || 'rand', diff: Math.min(last.diff ?? A.maxDiff, A.maxDiff) };
    // 有選題本時，只有這些題本所屬的科目會登場（首領也只出這些科目）
    const effSubj = () => state.exams.length ? state.subjects.filter(x => state.exams.some(id => Store.EX[id].subj === x)) : state.subjects;
    scr().innerHTML = `<div class="abyss-grid">
      <div class="panel"><h2>深淵遠征</h2>
        <p class="dim small-t">三章分岔地圖的長篇冒險：沿路線選擇戰鬥、精英、事件、篝火、行商與寶箱，每章盡頭有各科首領。擊敗首領可從三件強力「首領遺物」中擇一。三章全破即通關，並解鎖下一個試煉等級。角色升級會解鎖戰鬥技能。</p>
        <div class="filters">
          <div class="frow"><label>科目</label><span id="fsj">${chipGroup(MAIN_SUBJ.map(x => [x, C.SUBJECTS[x].name]), state.subjects)}</span></div>
          <div class="frow"><label>範圍</label><span id="fy"></span></div>
          <div class="frow"><label>題型</label><span id="ft">${chipGroup(TYPES, state.types)}</span></div>
          <div class="frow"><label>出題</label><span id="fp">${chipGroup([['rand', '隨機'], ['new', '未作答優先'], ['wrong', '錯題優先']], [state.pref], false)}</span></div>
        </div>
        <p id="cnt" class="gold-t small-t"></p>
        <h3 class="mt">試煉等級（效果累加）</h3>
        <div class="diffs" id="dl"></div>
        <div class="row mt"><button class="px-btn purple big" id="go">進入深淵！</button></div>
      </div>
      <div class="panel dark"><h3>挑戰紀錄</h3>
        <div class="stat-line"><span>最高解鎖</span><b class="gold-t">${C.DIFFS[A.maxDiff].name}</b></div>
        <div class="stat-line"><span>深淵通關次數</span><b>${A.clears}</b></div>
        <div class="stat-line"><span>挑戰次數</span><b>${A.runs}</b></div>
        <div class="stat-line"><span>擊敗首領</span><b>${A.bossKills}</b></div>
        <h3 class="mt">各科最高通關難度</h3>
        ${MAIN_SUBJ.map(x => `<div class="stat-line"><span style="color:${C.SUBJECTS[x].color}">${C.SUBJECTS[x].name}</span><b>${A.best[x] != null ? C.DIFFS[A.best[x]].name : '—'}</b></div>`).join('')}
        <h3 class="mt">可能遭遇的首領</h3><div id="bl"></div>
        <h3 class="mt">出征職業：${C.cls(p.activeClass).name} Lv.${(p.classes[p.activeClass] || { lv: 1 }).lv} <button class="px-btn small" id="chcls">更換</button></h3>
        <div class="small-t dim mb">${C.cls(p.activeClass).passive}</div>
        ${C.cls(p.activeClass).skills.map(k => `<div class="small-t mb">${SP.icon(k.icon, 18)} <b class="gold-t">Lv.${k.lv} ${k.name}</b>：${k.desc}${k.cd ? `（冷卻 ${k.cd} 題）` : ''}</div>`).join('')}
      </div></div>`;
    const drawDiffs = () => {
      const dl = U.$('#dl'); dl.innerHTML = '';
      C.DIFFS.forEach(d => {
        const lock = d.n > A.maxDiff;
        const el = U.h(`<div class="diff ${state.diff === d.n ? 'sel' : ''} ${lock ? 'locked' : ''}"><b>${lock ? '🔒 ' : ''}${d.name}</b><span class="small-t">${lock ? '通關上一級解鎖' : d.desc}${d.n && !lock ? `（魂晶 +${d.n * 15}%）` : ''}</span></div>`);
        if (!lock) el.onclick = () => { state.diff = d.n; SFX.play('click'); drawDiffs(); };
        dl.appendChild(el);
      });
    };
    const drawBoss = () => {
      U.$('#bl').innerHTML = effSubj().map(x => `<div class="small-t mb"><b style="color:${C.SUBJECTS[x].color}">${C.SUBJECTS[x].name}</b>：${C.themeOf(x) === 'mix' ? '<span class="dim">綜合主題：首領從所有主題隨機登場</span>' : C.BOSS_DEFS[C.themeOf(x)].map((b, i) => `${i + 1}章 ${b.name}<span class="tag ng">${C.MECHS[b.mech].name}</span>`).join(' ')}</div>`).join('') || '<span class="dim">請選擇科目</span>';
    };
    const upd = () => {
      const n = Store.filter({ subjects: state.subjects, exams: state.exams, types: state.types }).filter(q => state.types.includes('open') || q.type !== 'open').length;
      U.$('#cnt').textContent = `題池：${n} 題${state.exams.length ? `（已選 ${state.exams.length} 本題本）` : '（範圍不選＝所選科目全部題本）'}。冒險中會持續抽題、不限題數；首領戰只出該首領科目的題目。`; drawBoss();
    };
    const drawSets = setPicker(U.$('#fy'), state, upd);
    bindChips(scr(), '#fsj', state, 'subjects', true, () => { drawSets(); upd(); });
    bindChips(scr(), '#ft', state, 'types', true, upd);
    bindChips(scr(), '#fp', state, 'pref', false);
    drawDiffs(); upd();
    U.$('#chcls').onclick = () => App.go('classes');
    U.$('#go').onclick = () => {
      if (!state.subjects.length || !state.types.length) { U.toast('科目、題型至少各選一項'); return; }
      const subs = effSubj();
      if (!subs.length) { U.toast('選的題本不在已選的科目裡'); return; }
      p.abyssCfg = { subjects: state.subjects.slice(), exams: state.exams.slice(), types: state.types.slice(), pref: state.pref, diff: state.diff }; Store.saveProfile();
      const names = (state.subjects.length === MAIN_SUBJ.length && MAIN_SUBJ.length > 1 && !state.exams.length ? '全科' : subs.map(x => C.SUBJECTS[x].name).join('・')) + (state.exams.length ? `・${state.exams.length} 本` : '');
      startRun({ mode: 'abyss', title: `深淵遠征（${names}）`, subjects: subs, exams: state.exams.slice(), types: state.types.slice(), pref: state.pref, diff: state.diff });
    };
  }

  /* ---------- 職業殿堂：選擇/解鎖職業，各職業等級分開 ---------- */
  function classes() {
    const p = P();
    scr().innerHTML = `<div class="panel"><h2>職業殿堂</h2>
      <p class="dim small-t">每個職業有不同的基礎能力、被動與技能樹。職業等級分開計算：用哪個職業出征，結算經驗就累積到哪個職業，升級解鎖「職業等級能力」。遠征中角色升級則會解鎖該職業技能。魂晶：<b class="purple-t">${p.gems}</b></p>
      <div class="grid g2" id="cl"></div>
      <h3 class="mt">職業等級能力（每個職業各自累積）</h3>
      <div class="grid g3">${C.CLASS_PERKS.map(k => `<div class="small-t"><b class="gold-t">Lv.${k.lv} ${k.name}</b>：${k.desc}</div>`).join('')}</div></div>`;
    const cl = U.$('#cl');
    C.CLASSES.forEach(K => {
      const own = p.classes[K.id], active = p.activeClass === K.id;
      const lv = own ? own.lv : 1;
      const card = U.h(`<div class="panel dark class-card ${active ? 'active' : ''}" style="border-color:${K.color}">
        <div class="row">
          <div class="pet-stage" style="width:110px;height:110px;flex:none"><div style="${own ? '' : 'filter:brightness(0) opacity(.5)'}">${FX.heroHD(own ? Store.heroTile(K.id) : K.tile, K.id, 88)}</div></div>
          <div class="grow"><b style="color:${K.color};font-size:20px">${K.name}</b> ${own ? `<span class="tag ok">Lv.${lv}</span>` : '<span class="tag">未解鎖</span>'}
            <div class="small-t">${K.desc}</div>
            <div class="small-t dim">生命 ${K.base.hp}・攻擊 ${K.base.atk}・防禦 ${K.base.def}・暴擊 ${Math.round(K.base.crit * 100)}%</div>
            <div class="small-t gold-t">被動｜${K.passive}</div>
            ${own ? `<div class="bar xp mt" style="height:12px"><i style="width:${U.pct(own.xp, C.classNeed(lv))}%"></i><span>${own.xp}/${C.classNeed(lv)}</span></div>` : ''}
          </div></div>
        <div class="skills-list mt">${K.skills.map(k => `<div class="small-t">${SP.icon(k.icon, 16)} <b>Lv.${k.lv} ${k.name}</b>${k.cd ? `（冷卻 ${k.cd}）` : '（被動）'}：${k.desc}</div>`).join('')}</div>
        <div class="row mt"></div></div>`);
      const row = card.querySelector('.row.mt');
      if (!own) {
        const b = U.h(`<button class="px-btn purple" ${p.gems < K.cost ? 'disabled' : ''}>解鎖（${K.cost} 魂晶）</button>`);
        b.onclick = () => { p.gems -= K.cost; p.classes[K.id] = { lv: 1, xp: 0 }; Store.saveProfile(); SFX.play('level'); U.toast(`解鎖職業「${K.name}」！`); classes(); };
        row.appendChild(b);
      } else if (!active) {
        const b = U.h('<button class="px-btn gold">選擇此職業出征</button>');
        b.onclick = () => { p.activeClass = K.id; Store.saveProfile(); SFX.play('pet'); classes(); };
        row.appendChild(b);
      } else row.appendChild(U.h('<span class="tag ok">出征中</span>'));
      if (own) {
        const sb = U.h(`<button class="px-btn pink">👗 造型（${(p.ownedHeroSkins || []).filter(x => x.startsWith(K.id + ':')).length + 1}/${C.HERO_SKINS[K.id].length}）</button>`);
        sb.onclick = () => heroSkinModal(K);
        row.appendChild(sb);
      }
      cl.appendChild(card);
    });
  }
  /* 職業造型衣櫃：點選先試穿，買下後可隨時切換（戰鬥、營地、地圖都會換） */
  function heroSkinModal(K) {
    const p = P(); p.heroSkin = p.heroSkin || {}; p.ownedHeroSkins = p.ownedHeroSkins || [];
    const list = C.HERO_SKINS[K.id];
    let tryId = p.heroSkin[K.id] || '';
    const owned = id => !id || p.ownedHeroSkins.includes(K.id + ':' + id);
    const m = U.modal({ title: `${K.name}的造型`, body: '<div id="hsk"></div>', onClose: () => classes() });
    const box = U.$('#hsk', m.el);
    function draw() {
      const sk = list.find(x => x.id === tryId) || list[0];
      const wearing = (p.heroSkin[K.id] || '') === tryId;
      box.innerHTML = `<div class="row" style="align-items:flex-start;gap:16px;flex-wrap:wrap">
        <div class="pet-stage big-stage" style="width:170px;height:170px;flex:none">${FX.heroHD(C.skinIcon(sk), K.id, 140)}</div>
        <div class="grow"><b class="gold-t" style="font-size:20px">${sk.name}</b>
          <p class="small-t dim">點選下面的造型可以免費試穿。造型只改變外觀（戰鬥、營地、深淵地圖都會換上），不影響能力。魂晶：<b class="purple-t">${p.gems}</b></p>
          <div class="row">${wearing ? '<span class="tag ok">穿著中</span>' : owned(tryId) ? '<button class="px-btn gold" id="hwear">換上這套</button>' : `<button class="px-btn purple" id="hbuy" ${p.gems < sk.cost ? 'disabled' : ''}>購買並換上（${sk.cost} 魂晶）</button>`}</div></div></div>
        <div class="grid g3 mt">${list.map(s => `<button class="px-btn style-opt ${s.id === tryId ? 'sel' : ''}" data-sk="${s.id}">${SP.tile(C.skinIcon(s), 48)}<span>${s.name}<br>${owned(s.id) ? ((p.heroSkin[K.id] || '') === s.id ? '<b class="green-t">穿著中</b>' : '<b class="dim">已擁有</b>') : `<b class="purple-t">${s.cost}</b>`}</span></button>`).join('')}</div>`;
      U.$$('[data-sk]', box).forEach(b => b.onclick = () => { tryId = b.dataset.sk; SFX.play('click'); draw(); });
      const wear = U.$('#hwear', box), buy = U.$('#hbuy', box);
      const apply = () => { p.heroSkin[K.id] = tryId; Store.saveProfile(); SFX.play('level'); U.toast(`${K.name}換上「${sk.name}」！`); draw(); };
      if (wear) wear.onclick = apply;
      if (buy) buy.onclick = () => { if (p.gems < sk.cost) return; p.gems -= sk.cost; p.ownedHeroSkins.push(K.id + ':' + tryId); apply(); };
    }
    draw();
  }

  /* ---------- 怪物圖鑑 ---------- */
  function bestiary() {
    const B = P().bestiary || {};
    const tierName = ['淺層（第 1 章前段）', '中層（第 1–2 章）', '深層（第 2–3 章）', '深淵（第 3 章前段）', '深淵最深處（第 3 章後段）', '？？？（隱藏）'];
    const normal = C.MONSTERS.filter(m => !m.secret);
    const found = normal.filter(m => B[m.id]).length;
    const card = m => {
      const seen = B[m.id], hide = m.secret && !seen;
      const tags = (m.traits || []).map(k => `<span class="tag" title="${C.TRAITS[k].desc}">${C.TRAITS[k].name}</span>`).concat((m.mechs || []).map(k => `<span class="tag ng" title="${C.MECHS[k].desc}">${C.MECHS[k].name}</span>`));
      return `<div class="panel dark"><div class="row">${SP.icon(hide ? 'question' : m.tile, 56, seen ? 'anim-bob' : '', (m.filter ? `filter:${m.filter}` : '') + (seen ? '' : ';filter:brightness(0) opacity(.5)'))}
          <div class="grow"><b class="gold-t">${seen ? m.name : '？？？'}</b> <span class="small-t dim">${seen ? `擊敗 ${seen} 次` : '尚未擊敗'}</span>
          <div class="small-t">${seen ? m.desc : hide ? '傳說在普通戰鬥中偶爾會出現……' : '擊敗後解鎖說明'}</div>
          <div>${hide ? '<span class="tag">？</span>' : tags.length ? tags.join('') : '<span class="tag">普通</span>'}</div>
          ${seen ? `<div class="small-t dim">${(m.traits || []).map(k => `${C.TRAITS[k].name}：${C.TRAITS[k].desc}`).concat((m.mechs || []).map(k => `${C.MECHS[k].name}：${C.MECHS[k].desc}`)).join('；')}</div>` : ''}</div></div></div>`;
    };
    const sb = C.SECRET_BOSS, sk = B['boss:' + sb.name];
    scr().innerHTML = `<div class="panel"><h2>怪物圖鑑</h2>
      <p class="dim small-t">擊敗過的怪物會記錄在這裡（${found}/${normal.length}）。越深的樓層出現越強的種類；精英怪生命 ×1.8、攻擊 ×1.3，並額外帶有 1～2 個詞綴（第 2 章起必為 2 個）。</p>
      ${[0, 1, 2, 3, 4].map(t => `<h3 class="mt">${tierName[t]}</h3><div class="grid g2">${normal.filter(m => m.tier === t).map(card).join('')}</div>`).join('')}
      <h3 class="mt">${tierName[5]}</h3><div class="grid g2">${C.MONSTERS.filter(m => m.secret).map(card).join('')}</div>
      <h3 class="mt">精英詞綴</h3><div class="grid g3">${C.ELITE_AFFIX.map(a => { const d = a.startsWith('m:') ? C.MECHS[a.slice(2)] : C.TRAITS[a]; return `<div class="small-t"><span class="tag ng">${d.name}</span>${d.desc}</div>`; }).join('')}</div>
      <h3 class="mt">各主題首領</h3><p class="dim small-t">每個科目屬於一個區域主題；每一章有兩位候選首領，進入深淵時隨機登場。</p><div class="grid g2">${Object.entries(C.BOSS_DEFS).map(([sj, arr]) => arr.slice().sort((a, b) => a.act - b.act).map(b => {
        const k = B['boss:' + b.name];
        return `<div class="panel dark"><div class="row">${SP.icon(b.tile, 56, k ? 'anim-bob' : '', `filter:${k ? b.filter : 'brightness(0) opacity(.5)'}`)}<div class="grow"><b class="red-t">${b.name}</b> <span class="small-t dim">${C.THEMES[sj].region}・第 ${b.act} 章${k ? `・擊敗 ${k} 次` : ''}</span>
          <div class="small-t"><span class="tag ng">${C.MECHS[b.mech].name}</span>${C.MECHS[b.mech].desc}</div>${k ? `<div class="small-t gold-t">「${U.esc(b.line)}」</div>` : ''}</div></div></div>`;
      }).join('')).join('')}</div>
      <h3 class="mt">隱藏首領</h3><div class="panel dark"><div class="row">${SP.icon(sk ? sb.tile : 'question', 56, sk ? 'anim-bob' : '', sk ? `filter:${sb.filter}` : 'filter:brightness(0) opacity(.5)')}<div class="grow"><b class="red-t">${sk ? sb.name : '？？？'}</b>
        <div class="small-t">${sk ? `${sb.mechs.map(k => `<span class="tag ng">${C.MECHS[k].name}</span>`).join('')}「${U.esc(sb.line)}」・擊敗 ${sk} 次` : '據說只有在深淵中表現極為出色的人，才會看見那道裂縫……'}</div></div></div></div></div>`;
  }

  /* ---------- 背景音樂設定：依場景／全部同一首／歌單循環 ---------- */
  function musicSettings(root) {
    const T = BGM.TRACKS, ids = Object.keys(T);
    const opt = (sel, extra = '') => extra + ids.map(id => `<option value="${id}" ${id === sel ? 'selected' : ''}>${BGM.KIND[T[id].kind]}｜${T[id].name}</option>`).join('');
    const MODES = [['scene', '依場景播放', '每個場景用不同的音樂，切換畫面時換歌'], ['one', '全部同一首', '所有畫面都播同一首，切換畫面時音樂不中斷'], ['list', '歌單循環', '依照你排的順序一首接一首循環，切換畫面時音樂不中斷']];
    function draw() {
      const c = BGM.cfg();
      root.innerHTML = `
        <div class="row mode-pick">${MODES.map(([k, l, d]) => `<button class="px-btn small ${c.mode === k ? 'sel' : ''}" data-mode="${k}" title="${d}">${l}</button>`).join('')}</div>
        <p class="small-t dim">${MODES.find(m => m[0] === c.mode)[2]}。所有歌曲都已調成相同響度。</p>
        <div id="mbody"></div>
        <div class="row mt now-playing"><span class="small-t">正在播放：<b data-track>${BGM.track}</b></span><span class="grow"></span><button class="px-btn small" data-nx="-1">⏮ 上一首</button><button class="px-btn small" data-nx="1">下一首 ⏭</button></div>`;
      const body = U.$('#mbody', root);
      if (c.mode === 'scene') {
        body.innerHTML = `<div class="music-grid">${BGM.SCENES.map(([k, l]) => `<label>${l}</label><select class="px-in" data-scene="${k}">${opt(c.scene[k], `<option value="shuffle" ${c.scene[k] === 'shuffle' ? 'selected' : ''}>🔀 從歌單隨機一首</option>`)}</select><button class="px-btn small" data-try="${k}" title="試聽">▶</button>`).join('')}</div>
          <div class="row mt"><button class="px-btn small" data-scpre="gentle">預設：溫柔混搭</button><button class="px-btn small" data-scpre="guitar">全部吉他（隨機）</button><button class="px-btn small" data-scpre="piano">全部鋼琴（隨機）</button><button class="px-btn small" data-scpre="orig">原本的配樂</button></div>
          <p class="small-t dim">「從歌單隨機」會從下方「歌單循環」模式裡勾選的歌曲中挑一首。</p>${listHTML(c, true)}`;
      } else if (c.mode === 'one') {
        body.innerHTML = `<div class="row"><select class="px-in grow" id="oneSel">${opt(c.one)}</select><button class="px-btn small" id="oneTry">▶ 試聽</button></div>`;
      } else body.innerHTML = listHTML(c, false);
      bind(c);
    }
    function listHTML(c, compact) {
      const on = c.list, off = ids.filter(id => !on.includes(id));
      const row = (id, i) => `<div class="mrow ${i < 0 ? 'off' : ''}"><label class="row grow"><input type="checkbox" data-chk="${id}" ${i >= 0 ? 'checked' : ''}> <span class="tag">${BGM.KIND[T[id].kind]}</span> ${U.esc(T[id].name)}${T[id].mine ? ' <span class="small-t pink-t">★你的歌</span>' : ''}</label>
        ${i >= 0 ? `<button class="px-btn small" data-up="${id}" ${i === 0 ? 'disabled' : ''}>↑</button><button class="px-btn small" data-down="${id}" ${i === on.length - 1 ? 'disabled' : ''}>↓</button>` : ''}<button class="px-btn small" data-play="${id}" title="試聽">▶</button></div>`;
      return `<h3 class="mt" style="font-size:16px">${compact ? '隨機用的歌單' : '歌單（由上到下依序播放）'}</h3>
        <div class="row">${compact ? '' : `<label class="row"><input type="checkbox" id="shuf" ${c.shuffle ? 'checked' : ''}> 隨機順序</label>`}<span class="grow"></span>
          <button class="px-btn small" data-lpre="guitar">只要吉他</button><button class="px-btn small" data-lpre="piano">只要鋼琴</button><button class="px-btn small" data-lpre="mine">只要我的歌</button><button class="px-btn small" data-lpre="all">全部</button></div>
        <div class="mlist">${on.map((id, i) => row(id, i)).join('')}${off.map(id => row(id, -1)).join('')}</div>`;
    }
    function bind(c) {
      const save = patch => { BGM.setCfg(patch); SFX.play('click'); draw(); };
      U.$$('[data-mode]', root).forEach(b => b.onclick = () => save({ mode: b.dataset.mode }));
      U.$$('[data-nx]', root).forEach(b => b.onclick = () => { BGM.next(+b.dataset.nx); SFX.play('click'); });
      U.$$('[data-scene]', root).forEach(s => s.onchange = () => { const sc = Object.assign({}, c.scene, { [s.dataset.scene]: s.value }); BGM.setCfg({ scene: sc }); if (s.value !== 'shuffle') BGM.listen(s.value); SFX.play('click'); });
      U.$$('[data-try]', root).forEach(b => b.onclick = () => { const v = BGM.cfg().scene[b.dataset.try]; BGM.listen(v === 'shuffle' ? U.pick(BGM.cfg().list) : v); });
      const byKind = k => ids.filter(id => T[id].kind === k);
      const SC = {
        gentle: BGM.DEF.scene,
        guitar: Object.fromEntries(BGM.SCENES.map(([k]) => [k, 'shuffle'])),
        piano: Object.fromEntries(BGM.SCENES.map(([k]) => [k, 'shuffle'])),
        orig: { hub: 'title', menu: 'select', map: 'stage2', event: 'stage1', battle: 'level1', elite: 'level3', boss: 'boss', win: 'ending' }
      };
      U.$$('[data-scpre]', root).forEach(b => b.onclick = () => {
        const k = b.dataset.scpre, patch = { scene: SC[k] };
        if (k === 'guitar' || k === 'piano') patch.list = byKind(k);
        save(patch);
      });
      const one = U.$('#oneSel', root); if (one) { one.onchange = () => save({ one: one.value }); U.$('#oneTry', root).onclick = () => BGM.apply(true); }
      const shuf = U.$('#shuf', root); if (shuf) shuf.onchange = () => save({ shuffle: shuf.checked });
      U.$$('[data-chk]', root).forEach(ch => ch.onchange = () => {
        let l = BGM.cfg().list.filter(x => x !== ch.dataset.chk);
        if (ch.checked) l.push(ch.dataset.chk);
        if (!l.length) { U.toast('歌單至少要有一首'); draw(); return; }
        save({ list: l });
      });
      const move = (id, d) => { const l = BGM.cfg().list, i = l.indexOf(id), j = i + d; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; save({ list: l }); };
      U.$$('[data-up]', root).forEach(b => b.onclick = () => move(b.dataset.up, -1));
      U.$$('[data-down]', root).forEach(b => b.onclick = () => move(b.dataset.down, 1));
      U.$$('[data-play]', root).forEach(b => b.onclick = () => BGM.listen(b.dataset.play));
      U.$$('[data-lpre]', root).forEach(b => b.onclick = () => {
        const k = b.dataset.lpre;
        const l = k === 'all' ? ids.slice() : k === 'mine' ? ids.filter(id => T[id].mine) : byKind(k);
        save({ list: l });
      });
    }
    draw();
  }

  /* ---------- 設定 ---------- */
  function settings() {
    const st = Store.settings;
    scr().innerHTML = `<div class="panel" style="max-width:720px;margin:0 auto"><h2>設定與存檔</h2>
      <label class="row"><input type="checkbox" id="s1" ${st.autoExplain ? 'checked' : ''}> 答對後也自動展開詳解</label>
      <label class="row mt"><input type="checkbox" id="s2" ${st.confirmSingle ? 'checked' : ''}> 單選題需按「確認作答」才送出（避免誤觸）</label>
      <hr class="px"><h3>音量</h3><div id="volbox"></div>
      <hr class="px"><h3 id="musicbox">背景音樂</h3><div id="musicset"></div>
      <hr class="px">
      <h3>存檔</h3><p class="dim small-t">進度自動存在這台電腦的瀏覽器中。換電腦或清除瀏覽資料前，請先匯出備份。</p>
      <div class="row"><button class="px-btn blue" id="ex">匯出存檔</button><label class="px-btn">匯入存檔<input type="file" id="im" accept=".json" hidden></label><button class="px-btn red" id="rs">重置全部進度</button></div>
      <hr class="px"><h3>操作說明</h3>
      <p class="small-t">・選擇題可用鍵盤 <span class="kbd">A</span>–<span class="kbd">J</span> 或 <span class="kbd">1</span>–<span class="kbd">5</span> 作答，<span class="kbd">Enter</span> 確認/繼續。<br>・答對＝攻擊怪物，連續答對有連擊加成；答錯＝怪物反擊。多選題部分正確會造成擦傷並承受一半反擊。<br>・每清除 3 層可從天賦或遺物中擇一強化；擊敗怪物後可選擇事件、篝火、行商、寶箱等岔路。<br>・結算獲得魂晶，可在「永久強化」「遺物圖鑑」「寵物小屋」使用。</p>
      <hr class="px"><p class="small-t dim">素材：Kenney Tiny Dungeon（CC0）、俐方體11號 Cubic 11（OFL）、背景音樂含 OpenGameArt 上的 CC0 鋼琴／吉他曲，以及使用者自行提供的歌曲（僅供個人使用，清單見 assets/music/CREDITS.txt）。題庫：${U.esc(APP_TITLE)}（${window.QB.questions.length} 題，建置於 ${window.QB.built || '—'}）。</p></div>`;
    U.$('#s1').onchange = e => { st.autoExplain = e.target.checked; Store.saveSettings(); };
    U.$('#s2').onchange = e => { st.confirmSingle = e.target.checked; Store.saveSettings(); };
    U.$('#volbox').appendChild(volumeControls());
    musicSettings(U.$('#musicset'));
    U.$('#ex').onclick = () => {
      const blob = new Blob([Store.exportAll()], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = `${APP_TITLE}存檔_${new Date().toISOString().slice(0, 10)}.json`; a.click();
    };
    U.$('#im').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { try { Store.importAll(t); U.toast('匯入成功！'); setTimeout(() => location.reload(), 600); } catch (err) { U.toast('匯入失敗：' + err.message); } });
    };
    U.$('#rs').onclick = async () => { if (await U.confirm('重置全部進度', '所有作答紀錄、錯題、角色成長都會被清除，無法復原！')) Store.resetAll(); };
  }

  return { syncSubjects, hub, map, free, abyss, classes, bestiary, bank, wrongbook, pets, upg, relics, char, settings, startRun, qrow, volumeControls, ach: () => CampFun.achScreen() };
})();
