/* 營地與各功能頁：冒險地圖、自由遠征、題庫、錯題本、寵物、強化、圖鑑、角色、設定 */
const Screens = (() => {
  const scr = () => U.$('#screen');
  const P = () => Store.profile;
  const MAIN_SUBJ = Object.keys(C.SUBJECTS);
  const syncSubjects = () => { MAIN_SUBJ.length = 0; MAIN_SUBJ.push(...Object.keys(C.SUBJECTS)); };
  const SETS = window.QB.exams;

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
    // 同層的「第一單元／第06單元／106 年」依數字排，避免照讀檔順序變成一、三、二、五、四（有任何一個沒有數字就維持原順序）
    const sortN = (arr, name) => { const ks = arr.map(x => ordNum(name(x))); if (ks.every(k => k != null)) return arr.map((x, i) => [x, ks[i], i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(a => a[0]); return arr; };
    const sortTree = n => { n.kids = new Map(sortN([...n.kids.entries()], ([k]) => k)); n.sets = sortN(n.sets, s => s.leaf); n.kids.forEach(sortTree); };
    sortTree(root);
    // 只有一個子層、本身沒有題本的層級併成「A › B」，少點一層
    const squash = n => { n.kids.forEach(squash); if (n !== root) while (!n.sets.length && n.kids.size === 1) { const k = [...n.kids.values()][0]; n.name += ' › ' + k.name; n.key = k.key; n.kids = k.kids; n.sets = k.sets; } };
    squash(root);
    return root;
  }
  const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const cnNum = t => { if (/^\d+$/.test(t)) return Number(t); const i = t.indexOf('十'); if (i < 0) return CN[t] ?? null; return (i ? CN[t[i - 1]] : 1) * 10 + (CN[t[i + 1]] || 0); };
  function ordNum(name) {
    const m = /第\s*([0-9]+|[一二三四五六七八九十]+)(?:\s*[-–~～]\s*[0-9一二三四五六七八九十]+)?\s*(單元|章|節|課|回|次)/.exec(name) || /^\s*(\d+)/.exec(name);
    return m ? cnNum(m[1]) : null;
  }
  /* 國考年份：path 裡的「106 年國考」「106 年」（不含「114 學年度」這類課程資料） */
  const yearOf = e => { for (const x of e.path || []) { const m = /^\s*(\d{2,3})\s*年(國考)?\s*$/.exec(String(x)); if (m) return Number(m[1]); } return null; };
  const allIds = n => [...n.sets.map(s => s.e.id), ...[...n.kids.values()].flatMap(allIds)];
  // 上層「全選」不含 optIn 題本（答案疑義）；只有 optIn 題本的那一層，全選才會選到它們
  const treeIds = n => { const ids = allIds(n), plain = ids.filter(id => !(Store.EX[id] || {}).optIn); return plain.length ? plain : ids; };
  /* 題本挑選器（自由遠征、深淵遠征）：依分類樹收合，每層可一鍵全選；state.exams 空陣列＝全部。
   * 回傳重畫函式；科目改變時呼叫它。展開狀態在這次畫面內記住。 */
  function setPicker(box, state, onChange, opts = {}) {
    const open = {};
    if (!state.years) state.years = [];   // 年份是篩選條件：和科目取交集，再在範圍內挑題本
    // opts.allIfNone：科目沒選＝全部科目（題庫頁），各科先收起來
    const subjs = () => state.subjects.length || !opts.allIfNone ? state.subjects : MAIN_SUBJ.filter(sj => SETS.some(e => e.subj === sj));
    const draw = () => {
      const sjs = subjs();
      const yset = new Set(state.years);
      const inYear = e => !yset.size || yset.has(yearOf(e));
      state.exams = state.exams.filter(id => Store.EX[id] && sjs.includes(Store.EX[id].subj) && inYear(Store.EX[id]));
      const sel = new Set(state.exams);
      const pick = ids => { const on = ids.filter(id => sel.has(id)).length;
        return `<span class="dim small-t">${on ? `已選 ${on}／` : ''}${ids.length} 本</span><span class="grow"></span><button class="px-btn small" data-pick="${ids.join(',')}">${on === ids.length ? '取消' : '全選'}</button>`; };
      const chips = sets => `<div class="st-sets">${sets.map(({ e, leaf }) => `<span class="chip ${sel.has(e.id) ? 'on' : ''}" data-v="${e.id}" title="${U.esc(QV.exLabel(e))}">${U.esc(leaf)} <small class="dim">${e.count}</small></span>`).join('')}</div>`;
      // 依年份一次選：點「106 年」＝勾選這個範圍內所有 106 年國考的題本（全部已選時再點＝取消）
      const yearRow = (ex, label) => {
        const by = new Map(); ex.forEach(e => { const y = yearOf(e); if (y != null) (by.get(y) || by.set(y, []).get(y)).push(e.id); });
        if (!by.size) return '';
        return `<div class="st-years st-years-top"><div class="st-ylab">📅 年份 <span class="dim small-t">${label}</span></div><div class="st-ychips">${[...by.keys()].sort((a, b) => a - b).map(y => `<span class="chip ${yset.has(y) ? 'on' : ''}" data-year="${y}" title="${by.get(y).length} 本題本">${y} 年</span>`).join('')}${yset.size ? '<span class="chip" data-year="clear">清除年份</span>' : ''}</div></div>`;
      };
      const node = (n, sj, depth, top) => { const k = sj + n.key;
        return `<details class="stree" data-key="${U.esc(k)}" ${(open[k] ?? depth === 0) ? 'open' : ''}><summary><span class="st-name">${U.esc(n.name)}</span>${pick(treeIds(n))}</summary>
          <div class="st-body">${[...n.kids.values()].map(c => node(c, sj, depth + 1)).join('')}${n.sets.length ? chips(n.sets) : ''}</div></details>`; };
      const html = sjs.map(sj => {
        const ex = SETS.filter(e => e.subj === sj && inYear(e)); if (!ex.length) return '';
        const t = setTree(ex); t.name = C.SUBJECTS[sj].name;
        return node(t, sj, sjs.length > 1 ? 1 : 0, true);   // 選多科時各科先收起來
      }).join('');
      const allYears = yearRow(SETS.filter(e => sjs.includes(e.subj)), '可複選；只留這些年，沒選＝全部');
      const clr = state.exams.length ? `<div class="st-years"><span class="chip" data-clear="1">取消全部已選題本（${state.exams.length}）</span></div>` : '';
      box.innerHTML = html ? `<div class="stree-wrap">${allYears}${clr}${html}</div>` : '<span class="dim small-t">（先選科目）</span>';
    };
    box.addEventListener('toggle', e => { if (e.target.dataset && e.target.dataset.key) open[e.target.dataset.key] = e.target.open; }, true);
    box.onclick = ev => {
      const b = ev.target.closest('[data-pick]'), c = ev.target.closest('.chip[data-v]'), yr = ev.target.closest('[data-year]'), cl = ev.target.closest('[data-clear]');
      if (yr) {
        const v = yr.dataset.year;
        // 已經整組（全選）的資料夾，改年份後自動連同新年份的題本一起選，不用重按全選
        const groups = ys => { const ye = new Set(ys), out = new Map(), walk = (n, sj) => { out.set(sj + n.key, treeIds(n)); n.kids.forEach(k => walk(k, sj)); };
          subjs().forEach(sj => { const ex = SETS.filter(e => e.subj === sj && (!ye.size || ye.has(yearOf(e)))); if (ex.length) walk(setTree(ex), sj); }); return out; };
        const before = groups(state.years), full = [...before].filter(([, ids]) => ids.length && ids.every(id => state.exams.includes(id))).map(([k]) => k);
        if (v === 'clear') state.years = []; else { const y = Number(v), i = state.years.indexOf(y); i >= 0 ? state.years.splice(i, 1) : state.years.push(y); }
        if (full.length) { const add = new Set(state.exams), after = groups(state.years); full.forEach(k => (after.get(k) || []).forEach(id => add.add(id))); state.exams = [...add]; }
      } else if (cl) state.exams = [];
      else if (b) {
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
  /* 出題順序（自由遠征）：smart＝先出「沒作答過＋錯題」並隨機穿插（錯題權重 3 倍），寫對過的排在後面；
     new／wrong＝未作答／錯題排前面；其他＝完全隨機。用加權隨機排序（-ln(u)/w），題組以第一題判斷。 */
  function prefOrder(units, pref, patFirst) {
    if ((!pref || pref === 'rand') && !patFirst) return U.shuffle(units);
    const isWrong = id => (Store.wrong[id] && !Store.wrong[id].done) || (Store.qs[id]?.a && !Store.qs[id].last);
    const isNew = id => !Store.qs[id]?.a;
    // smart：權重見 Store.smartWeight（錯題 3、沒答過 1、部位已在別題答過 0.3、寫對過 0＝排最後）；
    // 同一部位在這一場裡也只讓第一題保持原權重，其餘同部位的題往後排，避免同一個構造連續出現
    // patFirst（未刷過題型優先）：題型已刷過的 ×0.15（Store.typeFactor），同一場裡同題型也只讓第一題排前面
    const seen = pref === 'smart' ? Store.partsAnswered() : null, seenT = patFirst ? Store.typesAnswered() : null;
    const keyed = units.map(u => {
      const id = u[0], w = isWrong(id), n = isNew(id), q = Store.Q[id];
      const sw = (pref === 'smart' ? Store.smartWeight(id, seen) : 1) * (seenT ? Store.typeFactor(id, seenT) : 1);
      const tier = pref === 'smart' ? (sw > 0 ? 0 : 1) : pref === 'new' ? (n ? 0 : 1) : pref === 'wrong' ? (w ? 0 : 1) : 0;
      return [u, tier, -Math.log(Math.random() || 1e-9) / (sw || 1), pref === 'smart' ? Store.partKey(q) : null, patFirst ? Store.typeKey(q) : null];
    }).sort((a, b) => a[1] - b[1] || a[2] - b[2]);
    if (pref !== 'smart' && !patFirst) return keyed.map(x => x[0]);
    const first = [], later = [], used = new Set();
    keyed.forEach(x => {
      const ks = [x[3], x[4]].filter(Boolean);
      if (x[1] === 0 && ks.some(k => used.has(k))) later.push(x); else { ks.forEach(k => used.add(k)); first.push(x); }
    });
    const rest = first.filter(x => x[1] === 1);
    return first.filter(x => x[1] === 0).concat(later, rest).map(x => x[0]);
  }
  function buildQueue(cfg) {
    let pool = cfg.ids ? Store.filter({ ids: cfg.ids, types: cfg.types }) : Store.filter(cfg);
    if (!(cfg.types || []).includes('open')) pool = pool.filter(q => q.type !== 'open');
    const units = [], seen = {};
    pool.forEach(q => {
      if (q.group) { if (!seen[q.group]) { seen[q.group] = []; units.push(seen[q.group]); } seen[q.group].push(q.id); }
      else units.push([q.id]);
    });
    const order = cfg.ordered ? units : prefOrder(units, cfg.pref, cfg.patFirst);
    const out = [];
    for (const u of order) { for (const id of u) { if (out.length < cfg.count) out.push(id); } if (out.length >= cfg.count) break; }
    return out;
  }
  async function startRun(cfg) {
    let ids = null;
    if (cfg.mode === 'abyss') {
      const n = Store.filter({ subjects: cfg.subjects, exams: cfg.exams, types: cfg.types, starOnly: cfg.starOnly }).filter(q => cfg.types.includes('open') || q.type !== 'open').length;
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
  /* 「★ 只出星號部位的題目」開關（自由遠征、深淵遠征） */
  /* 未刷過題型優先：歷年國考只換數字的同類題（content/patterns 分組）刷過一題後，其他同類題往後排 */
  function patSubjects() { const P = window.QB.patterns || {}, s = new Set(); for (const id in P) { const q = Store.Q[id]; if (q) s.add(Store.EX[q.exam].subj); } return [...s].map(x => (C.SUBJECTS[x] || {}).name || x); }
  function patChip(state) {
    const subs = patSubjects();
    return `<span id="fpat"><span class="chip ${state.patFirst ? 'on' : ''}" data-pat role="switch" aria-checked="${!!state.patFirst}">🧩 未刷過題型優先</span></span>
      <span class="small-t dim">${subs.length ? `同一題型（歷年國考只換數字或小改選項）刷過一題，其他同型題往後排；目前已分類：${U.esc(subs.join('、'))}` : '目前還沒有分類好的題型'}</span>`;
  }
  function bindPat(state) {
    const c = U.$('#fpat [data-pat]'); if (!c) return;
    c.onclick = () => { state.patFirst = !state.patFirst; c.classList.toggle('on', state.patFirst); c.setAttribute('aria-checked', String(state.patFirst)); SFX.play('click'); };
  }
  function bindStar(state, upd) {
    if (state.starOnly === true) state.starOnly = 'related';   // 舊設定（只有一個開關時）＝相關題
    U.$$('#fstar .chip').forEach(c => c.onclick = () => {
      state.starOnly = state.starOnly === c.dataset.v ? false : c.dataset.v;   // 兩個互斥，再按一次關掉
      U.$$('#fstar .chip').forEach(x => x.classList.toggle('on', x.dataset.v === state.starOnly)); SFX.play('click'); upd();
      if (state.starOnly && !(typeof LEARN_UI !== 'undefined' && LEARN_UI.starredQids().size)) U.toast('還沒有加星號的部位：到學習模式的圖解點名稱旁的 ☆ 加星號', 4000);
    });
  }
  /* 題池是 0、但選的題本其實有別的題型（例如眼解剖實驗跑台題都是填答）：在題數說明後面提示，並給一顆「一鍵勾選」 */
  function typeHint(cntEl, base, state, chipSel, upd) {
    const all = Store.filter(Object.assign({}, base, { types: TYPES.map(t => t[0]) }));
    const miss = TYPES.filter(([t]) => !state.types.includes(t) && all.some(q => q.type === t));
    if (!miss.length) return;
    const names = miss.map(([, n]) => `「${n}」`).join('、');
    const b = U.h(`<button class="px-btn small gold" style="margin-left:6px">勾選${names}</button>`);
    cntEl.appendChild(U.h(`<span class="small-t" style="display:block;color:var(--text)">這些題本的題目是${names}題，題型要勾選才會出題。</span>`));
    b.onclick = () => { miss.forEach(([t]) => { state.types.push(t); const c = U.$(`${chipSel} .chip[data-v="${t}"]`); if (c) c.classList.add('on'); }); SFX.play('click'); upd(); };
    cntEl.lastChild.appendChild(b);
  }
  /* 範圍統計（遠征選題）：刷過＝作答過至少一次；題型＝content/patterns 的同類題分組（沒分組的題目各自一型），
     同組任何一題作答過就算這個題型刷過（與「未刷過題型優先」用同一個 Store.typeKey） */
  function scopeStats(list) {
    const seenT = Store.typesAnswered(), types = new Map(); let done = 0, loose = 0;
    const P = window.QB.patterns || {};
    list.forEach(q => { if (Store.qs[q.id]?.a) done++; if (!P[q.id]) loose++; const k = Store.typeKey(q); if (!types.has(k)) types.set(k, seenT.has(k)); });
    const tDone = [...types.values()].filter(Boolean).length;
    return { total: list.length, done, todo: list.length - done, types: types.size, tDone, tTodo: types.size - tDone, loose };
  }
  const scopeLine = list => {
    if (!list.length) return '';
    const s = scopeStats(list);
    const note = s.loose === s.total ? '（這個範圍還沒有同類題分組，每題各算一型）' : s.loose ? `（其中 ${s.loose} 題還沒有同類題分組，各算一型）` : '';
    return `<span class="small-t scope-stats" style="display:block;color:var(--text)">已刷 ${s.done} 題・未刷 ${s.todo} 題｜題型 ${s.types} 種：已刷 ${s.tDone}・未刷 ${s.tTodo}${note}</span>`;
  };
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
  /* 贈送禮物清單：每個 id 每個存檔只能領一次；之後要再送，就在這裡加一筆（id 不可重複） */
  const GIFTS = [
    { id: 'skin-voucher-2026-10-05', vouchers: 1, title: '限時贈禮：新造型兌換券 ×1，可任選一款新造型！' }
  ];
  function hub() {
    clearInterval(campTimer);
    const p = P(), run = Store.loadRun();
    if (!p.starterPicked) {
      // 第一次進入：選夥伴視窗後面先顯示營地（調暗），不要一片黑
      scr().innerHTML = `<div class="panel camp-wrap starter-bg" aria-hidden="true"><div class="camp tod-${timeOfDay()}" style="--ground:url(${groundURL()})">
        <div class="sky"><div class="celestial"></div><div class="cloud c1"></div><div class="cloud c2"></div></div>
        <div class="hill" style="background-image:url(${hillURL()})"></div><div class="ground"></div>
        <div class="camp-obj camp-fire"><div class="shadow"></div>${PetArt.html('campfire', 70, '', '', null, null, { still: 1 })}<div class="fire-glow"></div></div>
        <div class="camp-obj camp-hero"><div class="shadow"></div>${FX.heroHD(Store.heroTile(), p.activeClass, 124)}</div></div></div>`;
      return starterModal();
    }
    const pet = C.pet(p.activePet), pl = p.pets[p.activePet];
    const acc = U.pct(p.stats.correct, p.stats.answered);
    const wrongN = Object.values(Store.wrong).filter(w => !w.done).length;
    const D = Store.daily(), streak = Store.touchStreak();
    const GOAL = 20;
    const pending = GIFTS.filter(g => !(p.giftsClaimed || []).includes(g.id)), vouchers = p.skinVouchers || 0;
    const giftsHTML = (pending.length || vouchers) ? `<div class="daily mt" id="voucherBox">
          <div class="row"><b class="gold-t">🎁 禮物</b><span class="grow"></span><span class="small-t">新造型兌換券 <b class="purple-t">${vouchers}</b> 張</span></div>
          ${pending.map(g => `<div class="small-t">${g.title}</div><div class="row mt" style="justify-content:flex-end"><button class="px-btn small gold" data-gift="${g.id}">領取 ×${g.vouchers}</button></div>`).join('')}
          ${vouchers ? '<div class="small-t dim">兌換券可任選一款新造型（價值 160～260 魂晶）。</div><div class="row mt" style="justify-content:flex-end"><button class="px-btn small purple" id="voucherUse">選新造型兌換</button></div>' : ''}
        </div>` : '';
    const tod = timeOfDay();
    const dsc = DECOR.sceneFor(tod);
    // 營地選單依功能分區（每區一個標題，按鈕照常排列）
    const MENU_GROUPS = [['study', '📚 讀書與刷題'], ['adv', '⚔️ 冒險'], ['peg', '⚪ 彈珠（Peglin）'], ['col', '🧙 角色與收藏'], ['tool', '🛠 工具與設定']];
    const tiles = [
      run && { id: 'continue', g: 'adv', icon: 45, t: '繼續遠征', d: run.mode === 'abyss' ? `${run.title}・第 ${run.act} 章・${C.DIFFS[run.diff || 0].name}` : `${run.title}・第 ${run.floor} 層・剩 ${run.queue.length - run.qi} 題`, cls: 'gold' },
      { id: 'abyss', g: 'adv', icon: 110, t: '深淵遠征', d: `三章長冒險・已解鎖 ${C.DIFFS[p.abyss.maxDiff].name}`, cls: 'purple' },
      { id: 'learn', g: 'study', icon: 66, t: '學習模式', d: LEARN_UI.tileDesc(), cls: 'blue' },
      { id: 'import', g: 'tool', icon: 89, t: '導入素材', d: IMP.tileDesc(), cls: 'green' },
      { id: 'prompts', g: 'tool', icon: 'question', t: 'AI 提示詞', d: '素材轉課程、出題、補詳解' },
      { id: 'map', g: 'adv', icon: 57, t: '冒險地圖', d: '依科目與題本挑戰各區域地牢' },
      { id: 'free', g: 'adv', icon: 105, t: '自由遠征', d: '自選科目、題本與題數' },
      { id: 'peglin', g: 'peg', icon: 'coin', t: '彈珠刷題', d: '答題換彈珠・網頁版直接玩' },
      { id: 'peglinLearn', g: 'peg', icon: 66, t: '彈珠學習', d: '讀卡換彈珠・網頁版直接玩' },
      { id: 'bank', g: 'study', icon: 63, t: '題庫', d: `${window.QB.questions.length} 題・錯題本 ${wrongN} 題未掌握` },
      { id: 'ai', g: 'study', icon: 84, t: 'AI 助教', d: '問觀念、問題目，附出處' },
      { id: 'pomo', g: 'study', icon: 115, t: '番茄鐘', d: `今天 🍅 ${POMO.data.log.filter(l => new Date(l.t).toDateString() === new Date().toDateString()).length} 顆・專注花園 ${POMO.data.garden.length} 株` },
      { id: 'ext-brain3d', g: 'study', icon: 'eye', t: '腦與視覺路徑 3D', d: '3D 解剖圖譜・開新分頁 ↗', url: 'https://yc0935019269cloud-create.github.io/anatomy-3d-atlas/brain-visual-atlas-3d/%E8%85%A6%E8%88%87%E8%A6%96%E8%A6%BA%E8%B7%AF%E5%BE%913D.html' },
      { id: 'ext-refraction', g: 'study', icon: 102, t: '視光室', d: '第一人稱驗光練習・開新分頁 ↗', url: 'https://yc0935019269cloud-create.github.io/Mvmpa5555/' },
      { id: 'classes', g: 'col', icon: C.cls(p.activeClass).tile, t: '職業殿堂', d: `目前：${C.cls(p.activeClass).name} Lv.${(p.classes[p.activeClass] || { lv: 1 }).lv}・切換/解鎖職業` },
      { id: 'decor', g: 'col', icon: 89, t: '背景商店', d: '買／抽營地布置與場景，自己布置營地' },
      { id: 'pets', g: 'col', icon: 'heart', t: '寵物小屋', d: '培養夥伴、買造型與配件' },
      { id: 'upg', g: 'col', icon: 74, t: '永久強化', d: '用魂晶提升能力' },
      { id: 'relics', g: 'col', icon: 91, t: '遺物圖鑑', d: '解鎖更強的遺物' },
      { id: 'bestiary', g: 'col', icon: 'eye', t: '怪物圖鑑', d: `怪物 ${C.MONSTERS.filter(m => !m.secret).length} 種、首領 ${Object.values(C.BOSS_DEFS).flat().length} 位` },
      { id: 'ach', g: 'col', icon: 32, t: '成就與收藏', d: `成就 ${Object.keys(p.ach || {}).length}/${C.ACH.length}・魚類圖鑑・隱藏配件` },
      { id: 'char', g: 'tool', icon: 100, t: '統計', d: '各科命中率與冒險紀錄' },
      { id: 'settings', g: 'tool', icon: 7, t: '設定與存檔', d: '匯出/匯入存檔、作答偏好' }
    ].filter(Boolean);
    let stars = '';
    if (tod === 'night') for (let i = 0; i < 24; i++) stars += `<i class="star" style="left:${U.rnd(0, 100)}%;top:${U.rnd(0, 55)}%;animation-delay:-${U.rnd(0, 30) / 10}s"></i>`;
    const lastL = LEARN_UI.lastInfo && LEARN_UI.lastInfo();
    const folded = !!Store.settings.campFolded;
    const quick = `<div class="quick-row">
        ${lastL ? `<button class="px-btn gold qr-main" data-quick="resume"><span>▶</span><span><b>繼續上次的課</b><small>${U.esc(lastL.pack)}・${U.esc(lastL.lesson)}</small></span></button>`
          : `<button class="px-btn blue qr-main" data-quick="learn"><span>▶</span><span><b>開始學習</b><small>${U.esc(LEARN_UI.tileDesc())}</small></span></button>`}
        ${run ? '<button class="px-btn" data-quick="continue">⚔ 繼續遠征</button>' : ''}
        <button class="px-btn" data-quick="bank">📚 題庫</button>
      </div>`;
    scr().innerHTML = `${quick}<div class="panel camp-wrap ${folded ? 'folded' : ''}">
        <div class="camp-head"><h2 style="margin:0">冒險者營地</h2><span class="small-t dim camp-hint">點點看夥伴、勇者、篝火、信箱、花盆和池塘吧！${(Store.settings.campTime || 'auto') === 'auto' ? '（時段：依現在時間）' : ''}</span><span class="grow"></span><button class="px-btn small" id="decorEdit">🛠 布置營地</button><button class="px-btn small" id="decorScene">🖼 場景</button><button class="px-btn small" id="decorShop">🛍 商店</button><button class="px-btn small" id="campFold" aria-expanded="${!folded}">${folded ? '▸ 展開營地' : '▾ 收起營地'}</button></div>
        <div class="camp tod-${tod}${dsc ? ' scene-img' : ''}" id="camp" data-night="${dsc ? (dsc.tod ? 'tod' : dsc.night) : 'orig'}" style="--ground:url(${groundURL()})">
          ${dsc ? `<div class="scene-bg" style="background-image:url('${U.esc(dsc.file)}')"></div>` : ''}
          <div class="sky">${stars}<div class="celestial"></div><div class="cloud c1"></div><div class="cloud c2"></div></div>
          <div class="hill" style="background-image:url(${hillURL()})"></div><div class="ground"></div>
          <div class="camp-obj camp-board" id="cBoard" title="每日任務">${SP.tile(63, 36)}</div>
          <div class="camp-obj camp-fire" id="cFire"><div class="shadow"></div>${PetArt.html('campfire', 70, '', '', null, null, { still: 1 })}<div class="fire-glow"></div></div>
          <div class="camp-obj camp-hero" id="cHero"><div class="shadow"></div>${FX.heroHD(Store.heroTile(), p.activeClass, 124)}</div>
          ${pet ? `<div class="camp-obj camp-pet ${tod === 'night' ? 'sleepy' : ''}" id="cPet" style="left:52%"><div class="shadow"></div>${Store.petHTML(p.activePet, 66)}<div class="zzz">z<sup>z</sup></div></div>` : ''}
        </div>
        <div class="decor-drawer" id="decorDrawer" hidden></div>
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
        ${giftsHTML}
        ${pet ? `<p class="small-t mt">夥伴：<b>${U.esc(Store.petName(p.activePet))}</b>（${pet.kind}）Lv.${pl.lv}<br><span class="dim">${pet.desc(pl.lv)}</span></p>` : ''}
        <hr class="px">
        <div class="stat-line"><span>魂晶</span><b class="purple-t">${p.gems}</b></div>
        <div class="stat-line"><span>總作答 / 命中率</span><b>${p.stats.answered}・${acc}%</b></div>
        <div class="stat-line"><span>遠征 / 通關</span><b>${p.stats.runs} / ${p.stats.wins}</b></div>
        <div class="stat-line"><span>錯題未掌握</span><b class="red-t">${wrongN}</b></div>
      </div>
      <div class="menu-groups">${MENU_GROUPS.map(([g, name]) => { const ts = tiles.filter(t => t.g === g); return ts.length ? `<section class="menu-sec"><h3 class="menu-sec-h">${name}</h3>
        <div class="menu-grid">${ts.map(t => `<button class="px-btn menu-tile ${t.cls || ''}" data-go="${t.id}"${t.url ? ` data-url="${U.esc(t.url)}"` : ''}>${SP.icon(t.icon, 48)}<span><b>${t.t}</b><small>${t.d}</small></span></button>`).join('')}</div></section>` : ''; }).join('')}</div>
    </div>`;
    U.$$('[data-go]').forEach(b => b.onclick = () => {
      SFX.play('click');
      const url = b.dataset.url;
      if (url) { window.open(url, '_blank', 'noopener'); return; }
      const g = b.dataset.go;
      if (g === 'continue') App.go('run', new Run(Store.loadRun()));
      else if (g === 'ai') AI.open();
      else App.go(g);
    });
    U.$$('[data-tod]').forEach(b => b.onclick = () => { Store.settings.campTime = b.dataset.tod; Store.saveSettings(); SFX.play('click'); hub(); });
    U.$$('[data-quick]').forEach(b => b.onclick = () => {
      SFX.play('click');
      const g = b.dataset.quick;
      if (g === 'resume') App.go('learn', { resume: true });
      else if (g === 'continue') App.go('run', new Run(Store.loadRun()));
      else App.go(g);
    });
    U.$('#campFold').onclick = () => {
      Store.settings.campFolded = !Store.settings.campFolded; Store.saveSettings(); SFX.play('click');
      const w = U.$('.camp-wrap'), f = !!Store.settings.campFolded;
      w.classList.toggle('folded', f); const b = U.$('#campFold'); b.textContent = f ? '▸ 展開營地' : '▾ 收起營地'; b.setAttribute('aria-expanded', String(!f));
    };
    const claim = U.$('#claim');
    if (claim) claim.onclick = () => {
      const g = 10 + Math.min(streak, 7) * 2; D.claimed = true; p.gems += g; Store.saveProfile(); SFX.play('win'); U.toast(`完成今日目標！獲得 ${g} 魂晶`); hub();
    };
    U.$$('[data-gift]').forEach(b => b.onclick = () => {
      const g = GIFTS.find(x => x.id === b.dataset.gift);
      if (!g || (p.giftsClaimed || []).includes(g.id)) return;
      p.giftsClaimed = (p.giftsClaimed || []).concat(g.id); p.skinVouchers = (p.skinVouchers || 0) + g.vouchers; Store.saveProfile();
      SFX.play('win'); U.toast(`獲得「新造型兌換券」×${g.vouchers}！快選一款喜歡的造型吧`);
      voucherModal();
    });
    const vUse = U.$('#voucherUse');
    if (vUse) vUse.onclick = () => { SFX.play('click'); voucherModal(); };
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
        if (timeOfDay() !== tod) { hub(); return; }
        if (petEl.dataset.busy || CampFun.tick()) return;
        if (tod === 'night' && U.chance(0.7)) { petEl.classList.add('sleepy'); return; }
        petEl.classList.remove('sleepy');
        const cur = parseFloat(petEl.style.left) || 52, nx = U.rnd(40, 68);
        petEl.classList.toggle('flip', nx < cur);
        petEl.style.left = nx + '%';
      }, 3200);
    }
    DECOR.mount(U.$('#camp'), { bubble });
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
    const upd = () => { const list = Store.filter(Object.assign({}, base, { types: state.types, status: state.status })), n = list.length; U.$('#cnt', m.el).innerHTML = `符合條件：${n} 題（將出 ${Math.min(n, Number(state.count))} 題）${scopeLine(list)}`; };
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
    const state = { subjects: MAIN_SUBJ.slice(), exams: [], types: ['single', 'multi', 'fill'], status: 'all', count: '20', pref: 'smart' };
    scr().innerHTML = `<div class="panel" style="max-width:860px;margin:0 auto"><h2>自由遠征</h2>
      <div class="filters">
        <div class="frow"><label>科目</label><span id="fsj">${chipGroup(MAIN_SUBJ.map(s => [s, C.SUBJECTS[s].name]), state.subjects)}</span></div>
        <div class="frow"><label>題本</label><span id="fy"></span></div>
        <div class="frow"><label>題型</label><span id="ft">${chipGroup(TYPES, state.types)}</span></div>
        <div class="frow"><label>星號</label><span id="fstar"><span class="chip ${state.starOnly === 'exact' ? 'on' : ''}" data-v="exact">★ 只刷星號部位本身</span><span class="chip ${state.starOnly && state.starOnly !== 'exact' ? 'on' : ''}" data-v="related">★ 星號部位＋相關題</span></span><span class="small-t dim" style="margin-left:6px">學習模式已加星號 ${typeof LEARN_UI !== 'undefined' ? LEARN_UI.starredTermCount() : 0} 個部位</span></div>
        <div class="frow"><label>出題</label><span id="fp">${chipGroup([['smart', '未作答＋錯題優先'], ['rand', '隨機'], ['new', '未作答優先'], ['wrong', '錯題優先']], [state.pref], false)}</span></div>
        <div class="frow"><label>同類題</label>${patChip(state)}</div>
        <div class="frow"><label>狀態</label><span id="fs">${chipGroup(STATUS, [state.status], false)}</span></div>
        <div class="frow"><label>題數</label><span id="fc">${chipGroup([['10', '10'], ['15', '15'], ['20', '20'], ['30', '30'], ['50', '50'], ['9999', '全部']], [state.count], false)}</span>
          <input class="px-in" id="fcn" type="number" min="3" max="500" placeholder="自訂" style="width:90px"></div>
      </div>
      <p id="cnt" class="gold-t"></p>
      <p class="dim small-t">提示：題數越多，樓層越深、首領越強，獎勵也越多。題本不選＝全部。沒有標準答案的填答／非選題採「揭曉後自評」。</p>
      <div class="row"><button class="px-btn gold big" id="go">出發遠征！</button></div></div>`;
    const upd = () => { const list = Store.filter(state).filter(q => state.types.includes('open') || q.type !== 'open'), n = list.length; U.$('#cnt').innerHTML = `符合條件：${n} 題（將出 ${Math.min(n, Number(state.count))} 題）${scopeLine(list)}`; if (!n) typeHint(U.$('#cnt'), state, state, '#ft', upd); };
    const drawSets = setPicker(U.$('#fy'), state, upd);
    bindChips(scr(), '#fsj', state, 'subjects', true, () => { drawSets(); upd(); });
    drawSets();
    bindChips(scr(), '#ft', state, 'types', true, upd);
    bindStar(state, upd);
    bindChips(scr(), '#fs', state, 'status', false, upd);
    bindChips(scr(), '#fp', state, 'pref', false);
    bindPat(state);
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
      ${w ? `<span class="small-t ${w.done ? 'green-t' : 'red-t'}">${w.done ? '（錯題已掌握）' : w.n ? `（錯 ${w.n} 次）` : '（手動加入）'}</span>` : ''}</div>
      <div>${stTag}</div></div>`);
    row.onclick = () => QV.practiceModal(q, () => { const nr = qrow(q); row.replaceWith(nr); });
    return row;
  }

  /* ---------- 題庫 ---------- */
  function bank(init) {
    const state = Object.assign({ subjects: [], exams: [], types: [], status: 'all', search: '', page: 0, favorites: 'all', favoriteFolder: '' }, init || {});
    const expanded = new Set();
    let fOpen = true; try { fOpen = localStorage.getItem('bankFilters') !== '0'; } catch (e) {}
    scr().innerHTML = `<div class="panel">${bankTabs('bank')}<h2>題庫</h2>
      <div class="bank-bar"><button class="px-btn small" id="fToggle" aria-expanded="${fOpen}" aria-controls="bankFilters">${fOpen ? '▾ 收起篩選' : '▸ 篩選'}</button><span class="bank-sum" id="fsum"></span><span id="cnt" class="gold-t"></span><button class="px-btn small gold" id="runit">用這些題目出征</button></div>
      <div class="filters mt${fOpen ? '' : ' folded'}" id="bankFilters">
        <div class="frow"><label>科目</label><span id="fsj">${chipGroup(Object.keys(C.SUBJECTS).map(s => [s, C.SUBJECTS[s].name]), state.subjects)}</span></div>
        <div class="frow"><label>題本</label><span id="fy"></span></div>
        <div class="frow"><label>題型</label><span id="ft">${chipGroup(TYPES, state.types)}</span></div>
        <div class="frow"><label>狀態</label><span id="fs">${chipGroup(STATUS, [state.status], false)}</span></div>
        <div class="frow"><label for="ff">收藏</label><select class="px-in fav-filter" id="ff" aria-label="收藏篩選"></select><button class="px-btn small" data-fav-manage>管理資料夾</button></div>
        <div class="frow"><label>搜尋</label><input class="px-in" id="fq" placeholder="題目、標籤或詳解的關鍵字" style="width:min(380px,100%)"></div>
      </div>
      <p class="dim small-t mt">點題目或選項可展開／收合詳解；想作答時按「練習此題」。</p>
      <div class="qlist bank-list mt" id="ql"></div><div class="pager" id="pg"></div></div>`;
    const PER = 30;
    function card(q) {
      const ex = Store.EX[q.exam], st = Store.qs[q.id], w = Store.wrong[q.id];
      const stTag = !st ? '<span class="tag">未作答</span>' : st.last ? `<span class="tag ok">✔ ${st.c}/${st.a}</span>` : `<span class="tag ng">✘ ${st.c}/${st.a}</span>`;
      const row = U.h(`<article class="bank-card" data-qid="${U.esc(q.id)}">
        <div class="bank-head"><div class="qmeta"><span class="tag" style="border-color:${(C.SUBJECTS[ex.subj] || {}).color || '#888'}">${U.esc(QV.exLabel(ex))}</span>
          <span class="tag">第 ${U.esc(q.n)} 題</span><span class="tag ${q.type}">${QV.typeName(q)}</span>${q.label ? `<span class="tag">${U.esc(q.label)}</span>` : ''}
          ${w ? `<span class="small-t ${w.done ? 'green-t' : 'red-t'}">${w.done ? '（錯題已掌握）' : w.n ? `（錯 ${w.n} 次）` : '（手動加入）'}</span>` : ''}</div><div class="bank-status">${stTag}</div></div>
        <div class="bank-preview">${QV.previewHTML(q)}</div>
        <div class="bank-actions"><button class="px-btn small bank-toggle" aria-expanded="false" aria-controls="bank-ex-${U.esc(q.id)}">▸ 展開詳解</button>${FAV_UI.controls(q)}<span class="grow"></span><button class="px-btn small bank-practice">練習此題</button></div>
        <div class="bank-explanation" id="bank-ex-${U.esc(q.id)}" hidden></div></article>`);
      const toggle = row.querySelector('.bank-toggle'), explanation = row.querySelector('.bank-explanation');
      function reveal(open) {
        if (open && !explanation.hasChildNodes()) explanation.innerHTML = QV.explainHTML(q);
        explanation.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? '▾ 收合詳解' : '▸ 展開詳解';
        row.classList.toggle('is-open', open);
        if (open) expanded.add(q.id); else expanded.delete(q.id);
      }
      toggle.onclick = () => reveal(explanation.hidden);
      row.querySelector('.bank-practice').onclick = () => QV.practiceModal(q, draw);
      row.onclick = e => {
        if (e.target.closest('button, a, input, textarea, select, summary, label, [contenteditable], .bank-explanation') || window.getSelection()?.toString()) return;
        reveal(explanation.hidden);
      };
      if (expanded.has(q.id)) reveal(true);
      return row;
    }
    const draw = () => {
      const list = Store.filter(state);
      U.$('#cnt').textContent = `共 ${list.length} 題`;
      const sum = [state.subjects.length ? state.subjects.map(k => (C.SUBJECTS[k] || {}).name || k).join('、') : '全部科目'];
      if ((state.years || []).length) sum.push(state.years.join('、') + ' 年');
      if (state.exams.length) sum.push(`${state.exams.length} 本題本`);
      if (state.types.length) sum.push(state.types.map(t => (TYPES.find(x => x[0] === t) || [, t])[1]).join('、'));
      if (state.status !== 'all') sum.push((STATUS.find(x => x[0] === state.status) || [, state.status])[1]);
      if (state.favorites !== 'all') sum.push('收藏');
      if (state.search) sum.push(`「${state.search}」`);
      U.$('#fsum').textContent = sum.join('・');
      const pages = Math.max(1, Math.ceil(list.length / PER));
      state.page = U.clamp(state.page, 0, pages - 1);
      const ql = U.$('#ql'); ql.innerHTML = list.length ? '' : '<p class="dim center">沒有符合篩選條件的題目。</p>';
      list.slice(state.page * PER, state.page * PER + PER).forEach(q => ql.appendChild(card(q)));
      const pg = U.$('#pg');
      pg.innerHTML = `<button class="px-btn small" ${state.page ? '' : 'disabled'} data-p="-1">◀</button><span>${state.page + 1} / ${pages}</span><button class="px-btn small" ${state.page < pages - 1 ? '' : 'disabled'} data-p="1">▶</button>`;
      U.$$('[data-p]', pg).forEach(b => b.onclick = () => { state.page += Number(b.dataset.p); draw(); window.scrollTo(0, 0); });
    };
    const upd = () => { state.page = 0; draw(); };
    bindBankTabs();
    U.$('#fToggle').onclick = () => {
      const f = U.$('#bankFilters'), open = f.classList.toggle('folded') === false, b = U.$('#fToggle');
      b.textContent = open ? '▾ 收起篩選' : '▸ 篩選'; b.setAttribute('aria-expanded', String(open));
      try { localStorage.setItem('bankFilters', open ? '1' : '0'); } catch (e) {}
      if (open) { const y = f.getBoundingClientRect().top + scrollY - (U.$('#topbar').offsetHeight + U.$('.bank-bar').offsetHeight + 8); if (y < scrollY) window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); }
    };
    const favoritesPicker = U.$('#ff');
    function drawFavorites() {
      if (state.favoriteFolder && !Store.favorites.folders.some(f => f.id === state.favoriteFolder)) { state.favoriteFolder = ''; state.favorites = 'saved'; }
      favoritesPicker.innerHTML = `<option value="all">全部題目</option><option value="saved">★ 全部收藏（${Store.favoriteCount()}）</option><option value="unfiled">未分類（${Store.favoriteCount(null)}）</option>` + Store.favorites.folders.map(f => `<option value="folder:${U.esc(f.id)}">${U.esc(f.name)}（${Store.favoriteCount(f.id)}）</option>`).join('');
      favoritesPicker.value = state.favoriteFolder ? 'folder:' + state.favoriteFolder : state.favorites;
    }
    favoritesPicker.onchange = () => {
      const val = favoritesPicker.value;
      state.favoriteFolder = val.startsWith('folder:') ? val.slice(7) : '';
      state.favorites = state.favoriteFolder ? 'saved' : val; upd();
    };
    FAV_UI.watch(favoritesPicker, () => { drawFavorites(); draw(); });
    drawFavorites();
    const drawSets = setPicker(U.$('#fy'), state, upd, { allIfNone: true });
    bindChips(scr(), '#fsj', state, 'subjects', true, () => { drawSets(); upd(); });
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
  /* 題庫底下的兩個分頁：全部題目／錯題本（錯題本不再是營地上獨立的入口） */
  function bankTabs(cur) {
    const n = Object.values(Store.wrong).filter(w => !w.done).length;
    return `<div class="row tabs bank-tabs">${[['bank', '📚 全部題目'], ['wrong', `📕 錯題本${n ? `（${n}）` : ''}`]].map(([k, t]) => `<button class="px-btn ${cur === k ? 'sel gold' : ''}" data-bank-tab="${k}" ${cur === k ? 'aria-current="page"' : ''}>${t}</button>`).join('')}</div>`;
  }
  function bindBankTabs() { U.$$('[data-bank-tab]').forEach(b => b.onclick = () => { if (b.getAttribute('aria-current')) return; SFX.play('click'); App.go(b.dataset.bankTab); }); }
  function wrongbook() {
    const state = { subjects: [], types: [], mode: 'todo', sort: 'recent' };
    scr().innerHTML = `<div class="panel">${bankTabs('wrong')}<h2>錯題本</h2>
      <p class="dim small-t">答錯的題目會自動收錄，也可以在題目旁按「＋ 加入錯題本」自己加；之後連續答對 2 次會自動標記為「已掌握」。想重刷就按「錯題重刷遠征」。</p>
      <div class="filters">
        <div class="frow"><label>科目</label><span id="fsj">${chipGroup(MAIN_SUBJ.map(s => [s, C.SUBJECTS[s].name]), [])}</span></div>
        <div class="frow"><label>題型</label><span id="ft">${chipGroup(TYPES, [])}</span></div>
        <div class="frow"><label>狀態</label><span id="fm">${chipGroup([['todo', '未掌握'], ['done', '已掌握'], ['all', '全部']], ['todo'], false)}</span></div>
        <div class="frow"><label>排序</label><span id="fo">${chipGroup([['recent', '最近答錯'], ['most', '錯最多次'], ['exam', '依題本']], ['recent'], false)}</span></div>
      </div>
      <div class="row mt"><span id="cnt" class="gold-t"></span><span class="grow"></span>
        <button class="px-btn small gold" id="rerun">錯題重刷遠征</button><button class="px-btn small" id="drill">逐題重刷</button><button class="px-btn small red" id="clean">移除已掌握</button></div>
      <div class="qlist mt" id="ql"></div></div>`;
    bindBankTabs();
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
        rl.appendChild(U.h(`<div class="panel dark choice-card rar-4" style="width:auto;cursor:default"><div class="row">${SP.icon(seen ? r.icon : 'question', 44, '', seen ? '' : 'filter:brightness(0) opacity(.5)')}<div class="grow"><b>${seen ? r.name : '？？？'}</b> <span class="small-t" style="color:var(--pink,#ff9fbf)">隱藏遺物</span><div class="small-t">${seen ? r.desc : '只能在深淵的特殊事件中取得'}</div>${seen && r.story ? `<div class="relic-story">${r.story}</div>` : ''}</div></div></div>`));
        return;
      }
      if (r.boss) {
        rl.appendChild(U.h(`<div class="panel dark choice-card rar-4" style="width:auto;cursor:default"><div class="row">${SP.icon(r.icon, 44)}<div class="grow"><b>${r.name}</b> <span class="small-t" style="color:var(--orange)">首領遺物</span><div class="small-t">${r.desc}</div>${true && r.story ? `<div class="relic-story">${r.story}</div>` : ''}</div></div><div class="small-t dim mt">深淵遠征擊敗首領後三選一</div></div>`));
        return;
      }
      const un = p.relicsUnlocked.includes(r.id);
      const card = U.h(`<div class="panel dark choice-card rar-${r.rar + 1}" style="width:auto;cursor:default"><div class="row">${SP.icon(r.icon, 44, '', un ? '' : 'filter:brightness(0) opacity(.6)')}
        <div class="grow"><b>${r.name}</b> <span class="small-t dim">${['', '普通', '稀有', '傳說'][r.rar]}</span><div class="small-t">${r.desc}</div>${true && r.story ? `<div class="relic-story">${r.story}</div>` : ''}</div></div></div>`);
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
      ${HAPTIC.supported ? `<div class="row"><label class="row"><input type="checkbox" data-haptic ${HAPTIC.on ? 'checked' : ''}> 戰鬥震動</label><button class="px-btn small" data-hapt-test>測試震動</button></div>
      ${HAPTIC.iosVer != null ? '<label class="row small-t" style="gap:8px">測試 2：直接用手指撥這個開關 <input type="checkbox" switch style="width:46px;height:28px"></label>' : ''}
      ${HAPTIC.iosVer != null && HAPTIC.iosVer > 0 && HAPTIC.iosVer < 18 ? `<p class="dim small-t">你的 iOS 是 ${HAPTIC.iosVer} 版，網頁震動需要 iOS 18 以上。</p>` : HAPTIC.iosVer != null ? '<p class="dim small-t">iPhone 需要 iOS 18 以上，並開啟「設定 → 聲音與觸覺 → 系統觸覺回饋」；iPad 沒有震動馬達。</p>' : ''}` : '<p class="dim small-t">這個瀏覽器不支援震動。</p>'}
      <div class="row now-playing"><span class="small-t">♪ <span data-track>${BGM.track}</span></span><span class="grow"></span>
        <button class="px-btn small" data-bgm="-1" title="上一首">⏮</button><button class="px-btn small" data-bgm="1" title="下一首">⏭</button><button class="px-btn small" data-bgm="set">🎵 音樂設定</button></div>
      <hr class="px" style="margin:6px 0"><b class="gold-t">白噪音</b>
      <div class="row amb-presets">${AMB.PRESETS.map((pr, i) => `<button class="px-btn small" data-pre="${i}">${pr.name}</button>`).join('')}</div>
      <label class="volrow"><span>白噪音總量</span><input type="range" min="0" max="100" step="1" data-k="amb" value="${Math.round(VOL.get('amb') * 100)}"><b>${Math.round(VOL.get('amb') * 100)}</b></label>
      ${Object.entries(AMB.TYPES).map(([k, t]) => `<label class="volrow amb"><span>${t.icon} ${t.name}</span><input type="range" min="0" max="100" step="1" data-k="amb_${k}" value="${Math.round((VOL.get('amb_' + k) || 0) * 100)}"><b>${Math.round((VOL.get('amb_' + k) || 0) * 100) || '關'}</b></label>`).join('')}
      <div class="small-t dim">可以同時混合多種聲音，拉到 0 即關閉（CC0 實錄環境音）</div>
      <div class="small-t dim">音量控制方式：${U.esc(MIX.info())}${IS_IOS && !navigator.audioSession ? '（iPhone 側邊靜音鍵開啟時會沒有聲音）' : ''}</div></div>`);
    U.$$('input[type=range]', box).forEach(r => {
      r.oninput = () => { VOL.set(r.dataset.k, r.value / 100); r.nextElementSibling.textContent = (r.dataset.k.startsWith('amb_') && +r.value === 0) ? '關' : r.value; };
      r.onchange = () => SFX.play('coin');
    });
    box.querySelector('[data-mute]').onchange = e => { VOL.set('muted', e.target.checked); App.refreshTop(); };
    const hp = box.querySelector('[data-haptic]'); if (hp) hp.onchange = e => HAPTIC.set(e.target.checked);
    const ht = box.querySelector('[data-hapt-test]'); if (ht) ht.onclick = () => HAPTIC.test();
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
    const state = { subjects: (last.subjects || MAIN_SUBJ.slice()).filter(x => C.SUBJECTS[x]), exams: (last.exams || []).filter(id => Store.EX[id]), types: last.types || ['single', 'multi', 'fill'], pref: last.pref2 ? last.pref : 'smart', patFirst: !!last.patFirst, starOnly: last.starOnly === true ? 'related' : (last.starOnly || false), diff: Math.min(last.diff ?? A.maxDiff, A.maxDiff) };
    // 有選題本時，只有這些題本所屬的科目會登場（首領也只出這些科目）
    const effSubj = () => state.exams.length ? state.subjects.filter(x => state.exams.some(id => Store.EX[id].subj === x)) : state.subjects;
    scr().innerHTML = `<div class="abyss-grid">
      <div class="panel"><h2>深淵遠征</h2>
        <p class="dim small-t">三章分岔地圖的長篇冒險：沿路線選擇戰鬥、精英、事件、篝火、行商與寶箱，每章盡頭有各科首領。擊敗首領可從三件強力「首領遺物」中擇一。三章全破即通關，並解鎖下一個試煉等級。角色升級會解鎖戰鬥技能。</p>
        <div class="filters">
          <div class="frow"><label>科目</label><span id="fsj">${chipGroup(MAIN_SUBJ.map(x => [x, C.SUBJECTS[x].name]), state.subjects)}</span></div>
          <div class="frow"><label>範圍</label><span id="fy"></span></div>
          <div class="frow"><label>題型</label><span id="ft">${chipGroup(TYPES, state.types)}</span></div>
          <div class="frow"><label>星號</label><span id="fstar"><span class="chip ${state.starOnly === 'exact' ? 'on' : ''}" data-v="exact">★ 只刷星號部位本身</span><span class="chip ${state.starOnly && state.starOnly !== 'exact' ? 'on' : ''}" data-v="related">★ 星號部位＋相關題</span></span><span class="small-t dim" style="margin-left:6px">學習模式已加星號 ${typeof LEARN_UI !== 'undefined' ? LEARN_UI.starredTermCount() : 0} 個部位</span></div>
          <div class="frow"><label>出題</label><span id="fp">${chipGroup([['smart', '未作答＋錯題優先'], ['rand', '隨機'], ['new', '未作答優先'], ['wrong', '錯題優先']], [state.pref], false)}</span></div>
          <div class="frow"><label>同類題</label>${patChip(state)}</div>
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
        const el = U.h(`<div class="diff ${state.diff === d.n ? 'sel' : ''} ${lock ? 'locked' : ''}"><b>${lock ? '🔒 ' : ''}${d.name}</b><span class="small-t">${lock ? '通關上一級解鎖' : d.desc}${d.n && !lock ? `（魂晶 +${Math.round(d.n * C.GEMS.trialStep * 100)}%）` : ''}</span></div>`);
        if (!lock) el.onclick = () => { state.diff = d.n; SFX.play('click'); drawDiffs(); };
        dl.appendChild(el);
      });
    };
    const drawBoss = () => {
      U.$('#bl').innerHTML = effSubj().map(x => `<div class="small-t mb"><b style="color:${C.SUBJECTS[x].color}">${C.SUBJECTS[x].name}</b>：${C.themeOf(x) === 'mix' ? '<span class="dim">綜合主題：首領從所有主題隨機登場</span>' : C.BOSS_DEFS[C.themeOf(x)].map((b, i) => `${i + 1}章 ${b.name}<span class="tag ng">${C.MECHS[b.mech].name}</span>`).join(' ')}</div>`).join('') || '<span class="dim">請選擇科目</span>';
    };
    const upd = () => {
      const list = Store.filter({ subjects: state.subjects, exams: state.exams, years: state.years, types: state.types, starOnly: state.starOnly }).filter(q => state.types.includes('open') || q.type !== 'open'), n = list.length;
      U.$('#cnt').innerHTML = `題池：${n} 題${state.exams.length ? `（已選 ${state.exams.length} 本題本）` : '（範圍不選＝所選科目全部題本）'}。冒險中會持續抽題、不限題數；首領戰只出該首領科目的題目。${scopeLine(list)}`; drawBoss();
      if (!n) typeHint(U.$('#cnt'), { subjects: state.subjects, exams: state.exams, years: state.years, starOnly: state.starOnly }, state, '#ft', upd);
    };
    const drawSets = setPicker(U.$('#fy'), state, upd);
    bindChips(scr(), '#fsj', state, 'subjects', true, () => { drawSets(); upd(); });
    bindChips(scr(), '#ft', state, 'types', true, upd);
    bindStar(state, upd);
    bindChips(scr(), '#fp', state, 'pref', false);
    bindPat(state);
    drawDiffs(); upd();
    U.$('#chcls').onclick = () => App.go('classes');
    U.$('#go').onclick = () => {
      if (!state.subjects.length || !state.types.length) { U.toast('科目、題型至少各選一項'); return; }
      const subs = effSubj();
      if (!subs.length) { U.toast('選的題本不在已選的科目裡'); return; }
      p.abyssCfg = { subjects: state.subjects.slice(), exams: state.exams.slice(), types: state.types.slice(), pref: state.pref, pref2: true, patFirst: !!state.patFirst, diff: state.diff, starOnly: state.starOnly || false }; Store.saveProfile();
      const names = (state.subjects.length === MAIN_SUBJ.length && MAIN_SUBJ.length > 1 && !state.exams.length ? '全科' : subs.map(x => C.SUBJECTS[x].name).join('・')) + (state.exams.length ? `・${state.exams.length} 本` : '');
      startRun({ mode: 'abyss', title: `深淵遠征（${names}）`, subjects: subs, exams: state.exams.slice(), years: (state.years || []).slice(), types: state.types.slice(), pref: state.pref, patFirst: !!state.patFirst, diff: state.diff, starOnly: state.starOnly || false });
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
        const skins = C.HERO_SKINS[K.id] || [];
        const count = skins.filter(s => !s.cost || (p.ownedHeroSkins || []).includes(K.id + ':' + s.id)).length;
        const sb = U.h(`<button class="px-btn pink">👗 造型（${count}/${skins.length}）</button>`);
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
    const currentId = () => Store.heroSkinId(K.id) || '';
    let tryId = currentId(), group = list.find(x=>x.id===tryId)?.actor ? 'all' : 'classic';
    const owned = id => !id || !(list.find(x => x.id === id) || {}).cost || p.ownedHeroSkins.includes(K.id + ':' + id);
    const m = U.modal({ title: `${K.name}的造型`, body: '<div id="hsk"></div>', onClose: () => classes() });
    const box = U.$('#hsk', m.el);
    function draw() {
      const sk = list.find(x => x.id === tryId) || list[0];
      const wearing = currentId() === tryId;
      const visible = list.filter(s=>group==='classic' ? !s.actor : s.actor && (group==='all'||s.gender===group));
      box.innerHTML = `<div class="row" style="align-items:flex-start;gap:16px;flex-wrap:wrap">
        <div class="pet-stage big-stage" style="width:170px;height:170px;flex:none">${FX.heroHD(C.skinIcon(sk), K.id, 140)}</div>
        <div class="grow"><b class="gold-t" style="font-size:20px">${sk.name}</b>
          <p class="small-t dim">點選下面的造型可以免費試穿。造型只改變外觀（戰鬥、營地、深淵地圖都會換上），不影響能力。魂晶：<b class="purple-t">${p.gems}</b></p>
          <div class="row">${wearing ? '<span class="tag ok">穿著中</span>' : owned(tryId) ? '<button class="px-btn gold" id="hwear">換上這套</button>' : `<button class="px-btn purple" id="hbuy" ${p.gems < sk.cost ? 'disabled' : ''}>購買並換上（${sk.cost} 魂晶）</button>`}</div>
          ${sk.actor ? '<div class="hero-preview-actions mt"><span class="small-t dim">動畫試看</span><div class="row"><button class="px-btn small" data-hmove="0">攻擊 1</button><button class="px-btn small" data-hmove="1">攻擊 2</button><button class="px-btn small" data-hmove="2">攻擊 3</button><button class="px-btn small" data-hmove="3">攻擊 4</button><button class="px-btn small gold" data-hmove="crit">爆擊</button></div></div>' : ''}</div></div>
        <div class="row hero-skin-filters mt">${[['all',`全部新造型（${list.filter(s=>s.actor).length}）`],['male',`男生（${list.filter(s=>s.actor&&s.gender==='male').length}）`],['female',`女生（${list.filter(s=>s.actor&&s.gender==='female').length}）`],...(list.some(s=>!s.actor)?[['classic','經典造型']]:[])].map(([id,label])=>`<button class="px-btn small ${id===group?'gold':''}" data-hgroup="${id}">${label}</button>`).join('')}</div>
        <div class="grid hero-skin-grid mt">${visible.map(s => `<button class="px-btn style-opt ${s.id === tryId ? 'sel' : ''}" data-sk="${s.id}">${SP.tile(C.skinIcon(s), s.actor?72:48)}<span>${s.name}<br>${owned(s.id) ? (currentId() === s.id ? '<b class="green-t">穿著中</b>' : '<b class="dim">已擁有</b>') : `<b class="purple-t">${s.cost}</b>`}</span></button>`).join('')}</div>`;
      box.querySelectorAll('[data-hgroup]').forEach(b=>b.onclick=()=>{group=b.dataset.hgroup;draw();});
      box.querySelectorAll('[data-hmove]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await HeroAnim.play(box.querySelector('.big-stage'),b.dataset.hmove==='crit'?'critical':'attack',Number(b.dataset.hmove)||0);}finally{b.disabled=false;}});
      U.$$('[data-sk]', box).forEach(b => b.onclick = () => { tryId = b.dataset.sk; SFX.play('click'); draw(); });
      const wear = U.$('#hwear', box), buy = U.$('#hbuy', box);
      const apply = () => { p.heroSkin[K.id] = tryId; Store.saveProfile(); SFX.play('level'); U.toast(`${K.name}換上「${sk.name}」！`); draw(); };
      if (wear) wear.onclick = apply;
      if (buy) buy.onclick = () => { if (p.gems < sk.cost) return; p.gems -= sk.cost; p.ownedHeroSkins.push(K.id + ':' + tryId); apply(); };
    }
    draw();
  }

  /* 新造型兌換券：任選一款尚未擁有的新造型（職業未解鎖也能先兌換，解鎖後再穿） */
  function voucherModal() {
    const p = P(); p.heroSkin = p.heroSkin || {}; p.ownedHeroSkins = p.ownedHeroSkins || [];
    const own = (cid, sid) => p.ownedHeroSkins.includes(cid + ':' + sid);
    let cls = p.classes[p.activeClass] ? p.activeClass : C.CLASSES[0].id, gender = 'all', tryId = '';
    const m = U.modal({ title: '🎟️ 新造型兌換券', body: '<div id="vch"></div>', onClose: () => hub() });
    const box = U.$('#vch', m.el);
    function draw() {
      const K = C.cls(cls), left = p.skinVouchers || 0;
      const all = C.HERO_SKINS[cls].filter(s => s.actor && s.cost > 0);
      const visible = all.filter(s => gender === 'all' || s.gender === gender);
      const sk = all.find(s => s.id === tryId) || null;
      if (!left) { box.innerHTML = '<p class="center">兌換券已用完，之後收到新的贈禮時還能再兌換。</p><div class="row" style="justify-content:center"><button class="px-btn gold" id="vdone">好的</button></div>'; U.$('#vdone', box).onclick = () => m.close(); return; }
      box.innerHTML = `<p class="small-t dim">剩餘兌換券：<b class="purple-t">${left}</b> 張。先點造型免費試穿預覽，確定後再兌換；兌換後可在「職業殿堂 → 造型」隨時更換。</p>
        <div class="row hero-skin-filters">${C.CLASSES.map(k => `<button class="px-btn small ${k.id === cls ? 'gold' : ''}" data-vc="${k.id}">${k.name}${p.classes[k.id] ? '' : '🔒'}</button>`).join('')}</div>
        <div class="row hero-skin-filters mt">${[['all', '全部'], ['male', '男生'], ['female', '女生']].map(([id, label]) => `<button class="px-btn small ${id === gender ? 'gold' : ''}" data-vg="${id}">${label}</button>`).join('')}</div>
        <div class="row mt" style="align-items:flex-start;gap:16px;flex-wrap:wrap">
          <div class="pet-stage big-stage" style="width:170px;height:170px;flex:none">${FX.heroHD(sk ? C.skinIcon(sk) : K.tile, cls, 140)}</div>
          <div class="grow"><b class="gold-t" style="font-size:20px">${sk ? sk.name : '請選一款造型'}</b>
            <div class="small-t dim">${K.name}${p.classes[cls] ? '' : '（職業尚未解鎖，兌換後解鎖職業即可穿上）'}</div>
            <div class="row mt">${!sk ? '' : own(cls, sk.id) ? '<span class="tag ok">已擁有</span>' : '<button class="px-btn purple" id="vredeem">用 1 張兌換券兌換' + (p.classes[cls] ? '並換上' : '') + '</button>'}</div>
          </div></div>
        <div class="grid hero-skin-grid mt">${visible.map(s => `<button class="px-btn style-opt ${s.id === tryId ? 'sel' : ''}" data-vs="${s.id}">${SP.tile(C.skinIcon(s), 72)}<span>${s.name}<br>${own(cls, s.id) ? '<b class="dim">已擁有</b>' : '<b class="purple-t">可兌換</b>'}</span></button>`).join('')}</div>`;
      box.querySelectorAll('[data-vc]').forEach(b => b.onclick = () => { cls = b.dataset.vc; tryId = ''; SFX.play('click'); draw(); });
      box.querySelectorAll('[data-vg]').forEach(b => b.onclick = () => { gender = b.dataset.vg; SFX.play('click'); draw(); });
      box.querySelectorAll('[data-vs]').forEach(b => b.onclick = () => { tryId = b.dataset.vs; SFX.play('click'); draw(); });
      const redeem = U.$('#vredeem', box);
      if (redeem) redeem.onclick = () => {
        if ((p.skinVouchers || 0) < 1 || own(cls, sk.id)) return;
        p.skinVouchers--; p.ownedHeroSkins.push(cls + ':' + sk.id);
        if (p.classes[cls]) p.heroSkin[cls] = sk.id;
        Store.saveProfile(); SFX.play('level'); U.toast(`兌換成功！獲得「${sk.name}」`); tryId = ''; draw();
      };
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
          ${seen && m.lore ? `<div class="mon-lore">${m.lore}</div>` : ''}
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
          <div class="small-t"><span class="tag ng">${C.MECHS[b.mech].name}</span>${C.MECHS[b.mech].desc}</div>${k ? `<div class="small-t gold-t">「${U.esc(b.line)}」</div>${b.lore ? `<div class="mon-lore">${b.lore}</div>` : ''}` : ''}</div></div></div>`;
      }).join('')).join('')}</div>
      <h3 class="mt">隱藏首領</h3><div class="panel dark"><div class="row">${SP.icon(sk ? sb.tile : 'question', 56, sk ? 'anim-bob' : '', sk ? `filter:${sb.filter}` : 'filter:brightness(0) opacity(.5)')}<div class="grow"><b class="red-t">${sk ? sb.name : '？？？'}</b>
        <div class="small-t">${sk ? `${sb.mechs.map(k => `<span class="tag ng">${C.MECHS[k].name}</span>`).join('')}「${U.esc(sb.line)}」・擊敗 ${sk} 次${sb.lore ? `<div class="mon-lore">${sb.lore}</div>` : ''}` : '據說只有在深淵中表現極為出色的人，才會看見那道裂縫……'}</div></div></div></div></div>`;
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
      <div class="row mt" style="align-items:center;gap:10px;flex-wrap:wrap">學習圖解的標記圓圈大小
        <input type="range" id="sPin" min="8" max="26" step="1" value="${st.pinSize || 18}" style="flex:1;min-width:140px">
        <span class="dg-pin-demo" id="sPinDemo" style="--pin:${st.pinSize || 18}px">3</span><button class="px-btn small" id="sPinReset">預設</button></div>
      <p class="dim small-t" style="margin-top:2px">圓圈太大擋到構造就調小；手機上會再自動小一點。點擊範圍不受影響。</p>
      <hr class="px"><h3>音量</h3><div id="volbox"></div>
      <hr class="px"><h3 id="musicbox">背景音樂</h3><div id="musicset"></div>
      <hr class="px">
      <h3>存檔</h3><p class="dim small-t">進度自動存在這台電腦的瀏覽器中。換電腦或清除瀏覽資料前，請先匯出備份，或登入下方的雲端同步。</p>
      <div class="row"><button class="px-btn blue" id="ex">匯出存檔</button><label class="px-btn">匯入存檔<input type="file" id="im" accept=".json" hidden></label><button class="px-btn red" id="rs">重置全部進度</button></div>
      <hr class="px"><h3>☁ 雲端同步</h3><div id="cloudBox"></div>
      <hr class="px"><h3>操作說明</h3>
      <p class="small-t">・選擇題可用鍵盤 <span class="kbd">A</span>–<span class="kbd">J</span> 或 <span class="kbd">1</span>–<span class="kbd">5</span> 作答，<span class="kbd">Enter</span> 確認/繼續。<br>・答對＝攻擊怪物，連續答對有連擊加成；答錯＝怪物反擊。多選題部分正確會造成擦傷並承受一半反擊。<br>・每清除 3 層可從天賦或遺物中擇一強化；擊敗怪物後可選擇事件、篝火、行商、寶箱等岔路。<br>・結算獲得魂晶，可在「永久強化」「遺物圖鑑」「寵物小屋」使用。</p>
      <hr class="px"><p class="small-t dim">素材：Kenney Tiny Dungeon（CC0）、俐方體11號 Cubic 11（OFL）、背景音樂含 OpenGameArt 上的 CC0 鋼琴／吉他曲，以及使用者自行提供的歌曲（僅供個人使用，清單見 assets/music/CREDITS.txt）。題庫：${U.esc(APP_TITLE)}（${window.QB.questions.length} 題，建置於 ${window.QB.built || '—'}）。</p></div>`;
    U.$('#s1').onchange = e => { st.autoExplain = e.target.checked; Store.saveSettings(); };
    U.$('#s2').onchange = e => { st.confirmSingle = e.target.checked; Store.saveSettings(); };
    const pinIn = U.$('#sPin'), pinDemo = U.$('#sPinDemo');
    const setPin = v => { st.pinSize = v; pinIn.value = v; pinDemo.style.setProperty('--pin', v + 'px'); document.documentElement.style.setProperty('--pin-base', v + 'px'); Store.saveSettings(); };
    pinIn.oninput = e => setPin(+e.target.value);
    U.$('#sPinReset').onclick = () => { setPin(18); SFX.play('click'); };
    U.$('#volbox').appendChild(volumeControls());
    musicSettings(U.$('#musicset'));
    if (typeof CLOUD !== 'undefined') CLOUD.panel(U.$('#cloudBox'));
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

  return { setPicker, scopeStats, scopeLine, syncSubjects, hub, map, free, abyss, classes, bestiary, bank, wrongbook, pets, upg, relics, char, settings, startRun, qrow, volumeControls, ach: () => CampFun.achScreen() };
})();
