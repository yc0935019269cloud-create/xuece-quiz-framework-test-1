/* 遠征（單局）狀態與規則；state 為純資料，可直接存檔/讀檔
 * mode：一般遠征（固定題數 queue）或 abyss 深淵遠征（三章分岔地圖、無限抽題、試煉等級） */
class Run {
  constructor(state) {
    this.s = state; this._pool = null;
    state.cd = state.cd || {}; state.used = state.used || []; state.mode = state.mode || 'short';
    state.stats.bosses = state.stats.bosses || 0; state.cls = state.cls || 'knight';
  }
  get p() { return this.s.p; }
  get abyss() { return this.s.mode === 'abyss'; }
  D(n) { return this.abyss && (this.s.diff || 0) >= n; }

  static create(cfg, qids) {
    const P = Store.profile, up = Store.upg;
    const abyss = cfg.mode === 'abyss';
    const diff = abyss ? (cfg.diff || 0) : 0;
    const K = C.cls(cfg.cls || P.activeClass);
    const clv = (P.classes[K.id] || { lv: 1 }).lv;
    const hp0 = K.base.hp + up('hp') * 8 - (abyss && diff >= 3 ? 15 : 0);
    const p = {
      hp: hp0, maxHp: hp0, atk: K.base.atk + up('atk'), def: K.base.def + up('def'),
      crit: K.base.crit + up('crit') * 0.02, critDmg: 1.6, gold: 20 + up('gold') * 15,
      xp: 0, lv: 1, atkMul: 1, hurtMul: 1, goldMul: 1, xpMul: 1, regen: 0,
      comboCap: 5 - (abyss && diff >= 9 ? 2 : 0), killHeal: 0, dodge: 0,
      revive: up('will')
    };
    const s = {
      v: 2, id: Date.now(), cfg, mode: abyss ? 'abyss' : 'short', diff, title: cfg.title || '自由遠征',
      queue: qids || [], qi: 0, total: qids ? qids.length : 0, floor: 0, phase: abyss ? 'map' : 'start',
      p, relics: [], talents: {}, items: {}, mon: null, combo: 0, shield: 0, bf: {}, cd: {},
      stats: { answered: 0, correct: 0, kills: 0, elites: 0, gold: 0, xp: 0, boss: false, bosses: 0, wrongIds: [], rightIds: [], floorsCleared: 0 },
      nextChoice: 3, pendingElite: false, curQ: null, doors: null, shop: null, event: null, choice: null,
      pet: P.activePet, started: Date.now(), used: [], act: 1, map: null, cls: K.id, clsLv: clv
    };
    const r = new Run(s);
    K.apply && K.apply(p);
    C.CLASS_PERKS.filter(k => clv >= k.lv).forEach(k => { k.apply && k.apply(p); k.item && r.addItem(k.item); });
    if (!(abyss && diff >= 3)) {
      r.addItem('potion_s', 1 + up('bag'));
    } else if (up('bag')) r.addItem('potion_s', up('bag'));
    if (up('legacy')) { const rel = r.randomRelic(); if (rel) r.addRelic(rel.id); }
    if (abyss) r.newAct(1);
    return r;
  }

  save() { Store.saveRun(this.s); }
  has(id) { return this.s.relics.includes(id); }
  get remaining() { return this.abyss ? Infinity : this.s.queue.length - this.s.qi; }
  petLv() { const pp = Store.profile.pets[this.s.pet]; return pp ? pp.lv : 0; }
  petIs(id) { return this.s.pet === id && Store.profile.pets[id]; }

  heal(n) { const p = this.p; const before = p.hp; p.hp = Math.min(p.maxHp, p.hp + Math.round(n)); return p.hp - before; }
  damage(n, raw) { const p = this.p; p.hp = Math.max(0, p.hp - Math.round(n)); if (raw && p.hp <= 0) p.hp = 1; return n; }
  gainGold(n, fromEvent) {
    let m = this.p.goldMul;
    if (this.petIs('luckycat')) m += (10 + this.petLv() * 5) / 100;
    if (this.petIs('rat')) m += (5 + this.petLv() * 2) / 100;
    if (fromEvent && this.has('mimicTooth')) m *= 2;
    const g = Math.round(n * m); this.p.gold += g; this.s.stats.gold += g; return g;
  }
  priceMul() { return (this.has('badge') ? 0.8 : 1) * (this.has('compass') ? 0.7 : 1) * (this.D(6) ? 1.3 : 1); }
  xpNeed() { return 40 + 30 * (this.p.lv - 1); }
  gainXp(n) {
    const g = Math.round(n * this.p.xpMul); this.p.xp += g; this.s.stats.xp += g;
    let ups = 0;
    while (this.p.xp >= this.xpNeed()) {
      this.p.xp -= this.xpNeed(); this.p.lv++; ups++;
      this.p.maxHp += 8; this.p.atk += 2 + (this.has('anvil') ? 2 : 0);
      this.heal(this.p.maxHp * 0.25);
    }
    if (ups) this.checkBless();
    return ups;
  }
  addItem(id, n = 1) { this.s.items[id] = (this.s.items[id] || 0) + n; }
  hasItem(id) { return (this.s.items[id] || 0) > 0; }
  useItemRaw(id) { if (!this.hasItem(id)) return false; this.s.items[id]--; if (!this.s.items[id]) delete this.s.items[id]; return true; }
  addRelic(id) {
    if (this.has(id)) return;
    this.s.relics.push(id);
    const r = C.relic(id); r && r.gain && r.gain(this.p);
    if (r && r.secret) { const P = Store.profile; P.relicsSeen = P.relicsSeen || []; if (!P.relicsSeen.includes(id)) { P.relicsSeen.push(id); Store.saveProfile(); } }
  }
  addTalent(id) {
    this.s.talents[id] = (this.s.talents[id] || 0) + 1;
    const t = C.talent(id); t && t.gain && t.gain(this.p);
  }
  randomRelic(rar) {
    const pool = C.RELICS.filter(r => !r.boss && Store.profile.relicsUnlocked.includes(r.id) && !this.has(r.id) && (!rar || r.rar >= rar));
    return pool.length ? U.pick(pool) : null;
  }
  /* 寶箱：從已解鎖、尚未擁有的遺物中挑 n 件（不重複） */
  relicChoices(n) {
    const pool = C.RELICS.filter(r => !r.boss && !r.secret && Store.profile.relicsUnlocked.includes(r.id) && !this.has(r.id));
    return U.pickN(pool, n).map(r => r.id);
  }
  bossRelicChoices() {
    const pool = C.RELICS.filter(r => r.boss && !this.has(r.id));
    return U.pickN(pool, 3).map(r => r.id);
  }
  petXp(n) {
    const before = Store.profile.pets[this.s.pet]?.lv;
    const ups = Store.petXp(n);
    if (ups) U.toast(`寵物 ${C.pet(this.s.pet).name} 升到 Lv.${before + ups}！`);
  }

  /* ---------------- 技能 ---------------- */
  get klass() { return C.cls(this.s.cls); }
  skills() { return this.klass.skills; }
  skillOK(k) { return !!k && this.p.lv + (this.p.skillBonus || 0) >= k.lv; }
  passive(kind) { const k = this.skills().find(x => x.kind === kind && !x.cd); return this.skillOK(k) ? k : null; }
  skillReady(id) { return !(this.s.cd[id] > 0); }
  useSkill(id) {
    const k = C.skill(id); if (!k || !this.skillOK(k) || !this.skillReady(id) || !k.cd) return false;
    this.s.cd[id] = k.cd;
    const bf = this.s.bf, p = this.p;
    switch (k.kind) {
      case 'smite': bf.smite = k.val; break;
      case 'freeze': bf.freeze = true; break;
      case 'heal': this.heal(p.maxHp * k.val); break;
      case 'shield': this.s.shield += Math.round(p.maxHp * k.val); break;
      case 'double': bf.double = true; break;
      case 'dodge': bf.dodgeNext = true; break;
      case 'rage': bf.rage = (bf.rage || 0) + k.val; break;
      case 'leech': bf.leech = k.val; bf.smite = k.mult || 1.8; break;
      case 'half': bf.half = true; break;
    }
    this.save();
    return true;
  }
  newSkillNames(before) { return this.skills().filter(k => k.lv > before && this.skillOK(k)).map(k => k.name); }
  checkBless() {
    if (!this.s.blessed && this.passive('bless')) { this.s.blessed = true; this.p.revive++; }
  }
  tickCooldowns() { Object.keys(this.s.cd).forEach(k => { if (this.s.cd[k] > 0) this.s.cd[k]--; }); }

  /* ---------------- 出題 ---------------- */
  pool() {
    if (this._pool) return this._pool;
    const cfg = this.s.cfg;
    let list = Store.filter({ subjects: cfg.subjects, exams: cfg.mode === 'abyss' ? cfg.exams : undefined, types: cfg.types });
    if (!(cfg.types || []).includes('open')) list = list.filter(q => q.type !== 'open');
    this._pool = list;
    return list;
  }
  subjOf(qid) { const q = Store.Q[qid]; return q ? Store.EX[q.exam].subj : null; }
  drawQuestion(subj) {
    const s = this.s, pool = this.pool();
    const used = new Set(s.used);
    // 題組延續：上一題若是題組，且同題組還有沒出的題，就接著出
    const last = Store.Q[s.used[s.used.length - 1]];
    if (last && last.group) {
      const nxt = pool.find(q => q.group === last.group && !used.has(q.id) && q.n > last.n);
      if (nxt && (!subj || this.subjOf(nxt.id) === subj) && U.chance(0.85)) return nxt.id;
    }
    let base = subj ? pool.filter(q => Store.EX[q.exam].subj === subj) : pool;
    if (!base.length) base = pool;
    let cands = base.filter(q => !used.has(q.id));
    if (!cands.length) {
      const ids = new Set(base.map(q => q.id));
      s.used = s.used.filter(id => !ids.has(id));
      cands = base;
    }
    const pref = s.cfg.pref || 'rand';
    if (pref === 'new') { const c2 = cands.filter(q => !Store.qs[q.id]?.a); if (c2.length && U.chance(0.8)) cands = c2; }
    if (pref === 'wrong') { const c2 = cands.filter(q => Store.wrong[q.id] && !Store.wrong[q.id].done || (Store.qs[q.id]?.a && !Store.qs[q.id].last)); if (c2.length && U.chance(0.7)) cands = c2; }
    // 題組盡量從第一題開始
    let q = U.pick(cands);
    if (q.group) { const first = cands.filter(x => x.group === q.group).sort((a, b) => a.n - b.n)[0]; if (first) q = first; }
    return q.id;
  }
  currentQ() {
    const s = this.s;
    if (!s.curQ) {
      s.curQ = this.abyss ? this.drawQuestion(s.mon && s.mon.subj) : s.queue[s.qi];
      this.save();
    }
    return s.curQ;
  }
  skipQuestion() {
    const s = this.s;
    if (this.abyss) s.used.push(s.curQ); else s.qi++;
    s.curQ = null;
  }
  nextQid() { return this.s.queue[this.s.qi]; }
  subjOfNext() { const q = Store.Q[this.nextQid()]; return q ? Store.EX[q.exam].subj : Object.keys(C.SUBJECTS)[0]; }
  timeLimit(q) {
    if (!(q.type === 'single' || q.type === 'multi')) return 0;
    const m = this.s.mon;
    const on = this.D(8) || (m && m.mechs && m.mechs.includes('haste'));
    if (!on) return 0;
    const subj = Store.EX[q.exam].subj;
    const S = C.SUBJECTS[subj] || {};
    let t = S.time || (['math', 'calc', 'sci'].includes(S.theme) ? 150 : 75);
    if (m && m.mechs && m.mechs.includes('haste') && !this.D(8)) t = Math.round(t * 1.2);
    if (this.has('hourcrown')) t = Math.round(t * 1.5);
    return t;
  }

  /* ---------------- 深淵地圖 ---------------- */
  newAct(act) {
    const s = this.s;
    s.act = act;
    const ROWS = 8, COLS = 5;
    const nodes = this.genMap(ROWS, COLS);
    const subjects = s.cfg.subjects && s.cfg.subjects.length ? s.cfg.subjects : Object.keys(C.SUBJECTS);
    const bsubj = U.pick(subjects), th = C.bossTheme(bsubj);
    // 每章有兩位候選首領，隨機登場（首領池依科目的主題）
    const arr = C.BOSS_DEFS[th], cands = arr.filter(b => (b.act || 1) === act);
    const def = cands.length ? U.pick(cands) : arr[act - 1];
    const mechs = [def.mech];
    if (this.D(10)) mechs.push(U.pick(Object.keys(C.MECHS).filter(m => m !== def.mech)));
    nodes.boss = { id: 'boss', r: ROWS, c: 2, type: 'boss', next: [], done: false, boss: { subj: bsubj, th, idx: arr.indexOf(def), mechs } };
    s.map = { nodes, cur: null, rows: ROWS, cols: COLS };
    s.phase = 'map';
  }
  /* 地圖生成原則（類似 Slay the Spire）：
   * 路線：6 條由下往上的路徑，起點至少 3 個；每步只能往左上/正上/右上，且路線不交叉；路徑會分岔與匯流。
   * 固定層：第 1 層全是戰鬥、第 2 層只有戰鬥/事件、正中間一層全是寶箱、首領前一層全是篝火。
   * 限制：精英第 4 層起、行商第 3 層起、中途篝火只在第 4 層到首領前兩層；
   *       精英/行商/篝火/寶箱不會連續兩格相同；同一岔路的選項盡量不同；不會連續 3 場普通戰鬥。
   * 數量：每章精英 1–3、行商 1–3、中途篝火最多 2（保證至少各有 1 個精英與行商）。 */
  genMap(ROWS, COLS) {
    const key = (r, c) => r + '-' + c;
    let nodes;
    for (let attempt = 0; attempt < 30; attempt++) {
      nodes = {};
      const edges = {}; // edges[r] = Set("c>nc")
      const starts = U.shuffle([...Array(COLS).keys()]);
      for (let k = 0; k < 6; k++) {
        let c = k < 3 ? starts[k] : U.rnd(0, COLS - 1);
        for (let r = 0; r < ROWS; r++) {
          const id = key(r, c);
          nodes[id] = nodes[id] || { id, r, c, type: null, next: [], done: false, jx: U.rnd(-30, 30) / 10, jy: U.rnd(-10, 10) };
          if (r === ROWS - 1) { if (!nodes[id].next.includes('boss')) nodes[id].next.push('boss'); break; }
          const E = edges[r] || (edges[r] = new Set());
          const opts = U.shuffle([-1, 0, 1]).map(d => c + d).filter(nc => nc >= 0 && nc < COLS)
            .filter(nc => !(nc === c + 1 && E.has(`${c + 1}>${c}`)) && !(nc === c - 1 && E.has(`${c - 1}>${c}`)));
          const nc = opts.length ? opts[0] : c;
          E.add(`${c}>${nc}`);
          const nid = key(r + 1, nc);
          if (!nodes[id].next.includes(nid)) nodes[id].next.push(nid);
          c = nc;
        }
      }
      // 每層至少 2 個節點，才有選擇的感覺
      let ok = true;
      for (let r = 0; r < ROWS; r++) if (Object.values(nodes).filter(n => n.r === r).length < 2) ok = false;
      if (ok) break;
    }
    const list = Object.values(nodes).sort((a, b) => a.r - b.r || a.c - b.c);
    const parents = id => list.filter(n => n.next.includes(id));
    const MID = Math.floor(ROWS / 2);
    const cap = { elite: 3, shop: 3, camp: 2 };
    const count = { elite: 0, shop: 0, camp: 0 };
    const SPECIAL = ['elite', 'shop', 'camp', 'treasure'];
    const allowed = (n, t) => {
      const ps = parents(n.id);
      if (t === 'elite' && n.r < 3) return false;
      if (t === 'shop' && n.r < 2) return false;
      if (t === 'camp' && (n.r < 3 || n.r > ROWS - 3)) return false;
      if (t === 'event' && n.r < 1) return false;
      if (cap[t] !== undefined && count[t] >= cap[t]) return false;
      if (SPECIAL.includes(t) && ps.some(p => p.type === t)) return false;
      if (SPECIAL.includes(t) && n.next.some(id => nodes[id] && nodes[id].type === t)) return false;
      // 同一岔路的兄弟節點不重複特殊房間
      if (t !== 'battle' && ps.some(p => p.next.some(id => id !== n.id && nodes[id] && nodes[id].type === t))) return false;
      // 不連續 3 場普通戰鬥
      if (t === 'battle' && ps.length && ps.every(p => p.type === 'battle' && parents(p.id).length && parents(p.id).every(g => g.type === 'battle'))) return false;
      return true;
    };
    list.forEach(n => {
      if (n.r === 0) { n.type = 'battle'; return; }
      if (n.r === ROWS - 1) { n.type = 'camp'; return; }
      if (n.r === MID) { n.type = 'treasure'; return; }
      const w = n.r === 1 ? [['battle', 70], ['event', 30]]
        : [['battle', 42], ['event', 26], ['elite', 13], ['shop', 10], ['camp', 9]];
      let pool = w.filter(([t]) => allowed(n, t));
      if (!pool.length) pool = [['event', 1]];
      let x = Math.random() * pool.reduce((a, b) => a + b[1], 0);
      for (const [t, v] of pool) { if ((x -= v) < 0) { n.type = t; break; } }
      n.type = n.type || pool[0][0];
      if (count[n.type] !== undefined) count[n.type]++;
    });
    // 保證至少 1 個精英、1 個行商
    for (const t of ['elite', 'shop']) {
      if (count[t]) continue;
      const cand = U.shuffle(list.filter(n => (n.type === 'battle' || n.type === 'event') && n.r > 0 && n.r !== MID && n.r < ROWS - 1))
        .find(n => { const old = n.type; n.type = null; const ok = allowed(n, t); n.type = old; return ok; });
      if (cand) { cand.type = t; count[t]++; }
    }
    return nodes;
  }
  availableNodes() {
    const m = this.s.map; if (!m) return [];
    if (!m.cur) return Object.values(m.nodes).filter(n => n.r === 0);
    return (m.nodes[m.cur].next || []).map(id => m.nodes[id]).filter(Boolean);
  }
  enterNode(id) {
    const s = this.s, n = s.map.nodes[id];
    s.map.cur = id; n.done = true;
    s.node = n.type;
    if (n.type === 'battle' || n.type === 'elite' || n.type === 'boss') { s.pendingElite = n.type === 'elite'; s.phase = 'start'; }
    else if (n.type === 'event') this.startEvent();
    else if (n.type === 'camp') { s.phase = 'camp'; s.campDone = false; }
    else if (n.type === 'shop') { s.phase = 'shop'; s.shop = this.makeShop(); }
    else if (n.type === 'treasure') { s.phase = 'treasure'; s.treasure = null; }
    this.save();
  }
  afterNodePhase() { return this.abyss ? (this.s.pendingMimic || this.s.pendingFight ? 'start' : 'map') : 'start'; }
  /* 隨機事件：同一局不重複；有條件的事件要符合 when；稀有事件權重 0.2 */
  pickEvent() {
    const s = this.s; s.seenEv = s.seenEv || [];
    let evs = C.EVENTS.filter(e => !s.seenEv.includes(e.id) && (!e.when || e.when(this)));
    if (!evs.length) { s.seenEv = [s.lastEvent]; evs = C.EVENTS.filter(e => e.id !== s.lastEvent && (!e.when || e.when(this))); }
    let x = Math.random() * evs.reduce((a, e) => a + (e.rare ? 0.2 : 1), 0);
    for (const e of evs) { if ((x -= e.rare ? 0.2 : 1) < 0) return e; }
    return evs[0];
  }
  startEvent() {
    const s = this.s, e = this.pickEvent();
    s.lastEvent = e.id; s.seenEv.push(e.id); s.event = { id: e.id, msg: null }; s.phase = 'event';
  }

  /* ---------------- 產生怪物 ---------------- */
  spawn() {
    const s = this.s; s.floor++;
    let mon;
    if (this.abyss) mon = this.spawnAbyss();
    else {
      const f = s.floor;
      const bossCut = Math.max(3, Math.round(s.total * 0.25));
      const isBoss = this.remaining <= bossCut;
      const elite = !isBoss && s.pendingElite;
      s.pendingElite = false;
      const subj = this.subjOfNext();
      if (isBoss) {
        const b = U.pick(C.BOSSES);
        const est = this.p.atk * this.p.atkMul * 1.15;
        const hp = Math.max(Math.round(est * 2.2), Math.round(est * this.remaining * 0.55));
        mon = { name: b.name, tile: b.tile, filter: b.filter, hp, maxHp: hp, atk: Math.round((8 + 1.6 * f) * 1.2), boss: true };
      } else mon = this.makeMonster(f, elite, subj);
    }
    if (s.pendingMimic) {
      const f = this.depth();
      mon = { name: '寶箱怪', tile: 92, filter: '', hp: Math.round((14 + 5.5 * f) * 1.2), atk: Math.round((7 + 1.5 * f) * 1.2), mimic: true, subj: mon.subj };
      mon.maxHp = mon.hp; s.pendingMimic = false;
    }
    s.pendingFight = false;
    s.mon = mon; s.combo = 0; s.shield = 0; s.bf = {};
    if (this.petIs('slime')) s.shield += 3 + this.petLv() * 2;
    if (this.has('dragonheart')) s.shield += 12;
    if (this.p.startShield) s.shield += this.p.startShield;
    if (this.has('lantern')) this.heal(5);
    if (this.has('lampheart')) this.heal(3);
    if (this.has('towerbell')) s.shield += Math.round(this.p.maxHp * 0.15);
    s.phase = 'battle'; s.curQ = null;
    this.save();
    return mon;
  }
  depth() { return this.abyss ? (this.s.act - 1) * 8 + ((this.s.map && this.s.map.nodes[this.s.map.cur]?.r) || 0) + 1 : this.s.floor; }
  makeMonster(f, elite, subj) {
    const tierMax = Math.min(4, Math.floor((f - 1) / (this.abyss ? 5 : 2.5)));
    let pool = C.MONSTERS.filter(m => !m.secret && m.tier <= tierMax && m.tier >= tierMax - 1);
    if (elite) pool = C.MONSTERS.filter(m => !m.secret && m.tier >= Math.max(0, tierMax - 1) && m.tier <= Math.min(4, tierMax + 1));
    // 隱藏：黃金史萊姆（普通戰鬥 3%）
    const m = !elite && !this.s.pendingMimic && U.chance(0.03) ? C.MONSTERS.find(x => x.id === 'goldslime') : U.pick(pool);
    const actMul = this.abyss ? 1 + 0.12 * (this.s.act - 1) : 1;
    let hp = Math.round((14 + 5.5 * f) * m.hp * actMul * (0.9 + Math.random() * 0.2));
    let atk = Math.round((7 + 1.5 * f) * m.atk * actMul);
    if (this.D(1)) atk = Math.round(atk * 1.15);
    const traits = m.traits.slice(), mechs = (m.mechs || []).slice(), affix = [];
    if (elite) {
      hp = Math.round(hp * 1.8 * (this.D(7) ? 1.3 : 1)); atk = Math.round(atk * 1.3 * (this.D(7) ? 1.15 : 1));
      const n = (this.abyss ? this.s.act >= 2 : f >= 6) ? 2 : 1;
      for (const a of U.shuffle(C.ELITE_AFFIX.filter(x => !traits.includes(x))).slice(0, n)) {
        if (a.startsWith('m:')) { const k = a.slice(2); mechs.push(k); affix.push(C.MECHS[k].name); }
        else { traits.push(a); affix.push(C.TRAITS[a].name); }
      }
    } else if (this.D(2)) hp = Math.round(hp * 1.2);
    const pre = m.secret ? '' : U.pick(C.monPrefix(subj));
    return { name: (elite ? `【${affix.join('・')}】` : '') + pre + m.name, secret: !!m.secret, sp: m.id, desc: m.desc, fx: m.fx, tile: m.tile, filter: m.filter || U.pick(C.VARIANT), hp, maxHp: hp, atk, elite, subj, traits, mechs };
  }
  hasTrait(k) { const m = this.s.mon; return !!(m && m.traits && m.traits.includes(k)); }
  spawnAbyss() {
    const s = this.s, node = s.map.nodes[s.map.cur];
    const f = this.depth();
    if (node && node.type === 'boss' && node.boss.secret) {
      const d = C.SECRET_BOSS; let hp = d.hp, atk = d.atk;
      if (this.D(5)) { hp *= 1.25; atk *= 1.15; }
      hp = Math.round(hp); atk = Math.round(atk);
      return { name: d.name, tile: d.tile, filter: d.filter, hp, maxHp: hp, atk, boss: true, secretBoss: true, subj: U.pick(s.cfg.subjects && s.cfg.subjects.length ? s.cfg.subjects : Object.keys(C.SUBJECTS)), mechs: d.mechs.slice(), line: d.line };
    }
    if (node && node.type === 'boss') {
      const b = node.boss, def = C.BOSS_DEFS[b.th || C.themeOf(b.subj)][b.idx];
      let hp = [0, 110, 240, 400][s.act], atk = [0, 14, 24, 36][s.act];
      if (this.D(1)) atk *= 1.15;
      if (this.D(5)) { hp *= 1.25; atk *= 1.15; }
      hp = Math.round(hp); atk = Math.round(atk);
      return { name: def.name, tile: def.tile, filter: def.filter, hp, maxHp: hp, atk, boss: true, subj: b.subj, mechs: b.mechs.slice(), line: def.line };
    }
    const subjects = s.cfg.subjects && s.cfg.subjects.length ? s.cfg.subjects : ['chi'];
    const elite = s.pendingElite; s.pendingElite = false;
    return this.makeMonster(f, elite, U.pick(subjects));
  }

  /* 對怪物造成傷害（先扣首領結界） */
  hitMon(d) {
    const s = this.s;
    if (this.hasTrait('armor')) d = Math.max(1, d - 3);
    if (this.hasTrait('harden')) { d = Math.max(1, d - (s.bf.hard || 0)); s.bf.hard = Math.min(3, (s.bf.hard || 0) + 1); }
    if (this.hasTrait('stoneskin') && (s.bf.stone || 0) < 2) { s.bf.stone = (s.bf.stone || 0) + 1; d = Math.ceil(d / 2); }
    if (s.bf.bshield > 0) { const a = Math.min(s.bf.bshield, d); s.bf.bshield -= a; d -= a; }
    s.mon.hp = Math.max(0, s.mon.hp - d);
    return d;
  }
  monAtk() {
    const m = this.s.mon;
    let a = m.atk;
    if (this.s.bf.enrage) a *= 1 + 0.08 * this.s.bf.enrage;
    if (this.hasTrait('frenzy') && m.hp < m.maxHp * 0.5) a *= 1.4;
    if (this.s.bf.bloat) a *= 1 + 0.1 * this.s.bf.bloat;
    if (this.s.bf.phase2) a *= 1.25;
    return a;
  }
  hasMech(k) { const m = this.s.mon; return m && m.mechs && m.mechs.includes(k); }

  /* 答題結算：回傳事件清單給畫面播放動畫 */
  resolve(q, res) {
    const s = this.s, p = this.p, mon = s.mon, ev = [];
    s.stats.answered++;
    Store.record(q.id, !!res.ok);
    if (this.abyss) s.used.push(q.id);
    this.tickCooldowns();
    s.bf.turn = (s.bf.turn || 0) + 1;
    if (res.ok) {
      s.stats.correct++; s.stats.rightIds.push(q.id);
      let base = Math.max(1, p.atk - (s.bf.curse || 0)) * p.atkMul * (s.bf.elixir ? 1.5 : 1) * (1 + (s.bf.rage || 0));
      if (p.fury) base *= 1 + p.fury * Math.floor((1 - p.hp / p.maxHp) * 10);
      if (p.arcane && q.type !== 'single') base *= 1 + p.arcane;
      if (this.has('lastlamp') && p.hp < p.maxHp * 0.5) base *= 1.35;
      let mult = 1 + Math.min(s.combo, p.comboCap) * 0.1 * (this.has('bracer') ? 2 : 1);
      if (this.has('quill') && q.type !== 'single') mult *= 1.6;
      if (s.bf.calm) { mult *= 2; s.bf.calm = false; }
      if (s.bf.smite) { mult *= s.bf.smite; s.bf.smite = 0; ev.push({ t: 'skill', name: '強力一擊' }); }
      if (this.has('match') && !s.bf.match) { s.bf.match = true; mult *= 1.5; }
      if (this.has('bell') && s.bf.charged) mult *= 1.8;
      if (this.has('lens') && (mon.elite || mon.boss)) mult *= 1.2;
      s.bf.okN = (s.bf.okN || 0) + 1;
      const hunter = this.passive('hunter');
      const critRate = p.crit - (this.hasTrait('hex') ? 0.1 : 0) + (this.has('medal7') ? 0.05 * Math.min(s.combo, p.comboCap) : 0);
      let crit = Math.random() < critRate || !!(hunter && mon.hp < mon.maxHp * hunter.val) || (this.has('pendulum') && s.bf.okN % 4 === 0);
      if (s.bf.numb) { s.bf.numb = false; if (crit) { crit = false; ev.push({ t: 'status', text: '⚡ 麻痺：暴擊失效' }); } }
      s.bf.exposed = false;
      if (crit) mult *= p.critDmg;
      let dmg = Math.max(1, Math.round(base * mult * (0.9 + Math.random() * 0.2)));
      if (crit && this.hasTrait('fragile')) dmg = Math.round(dmg * 1.5);
      if (s.bf.chill) { dmg = Math.max(1, Math.round(dmg * 0.7)); s.bf.chill = false; }
      if (this.hasMech('fortify') && s.combo < 3) dmg = Math.max(1, Math.round(dmg * 0.7));
      if (s.bf.minion > 0) { dmg = Math.max(1, Math.round(dmg * 0.5)); s.bf.minion--; ev.push({ t: 'mstatus', text: '僕從擋下一半！' }); }
      s.combo++;
      if (this.has('sliderule') && q.type !== 'single') s.combo++;
      let dealt = 0;
      if (this.hasTrait('dodge') && Math.random() < 0.25) ev.push({ t: 'mdodge' });
      else if (s.bf.guardUp) { s.bf.guardUp = false; ev.push({ t: 'mstatus', text: '格擋！傷害無效' }); }
      else { dealt = this.hitMon(dmg); ev.push({ t: 'hit', dmg: dealt, crit, blocked: dmg - dealt }); }
      if (dealt > 0 && crit && (this.hasTrait('mirror') || this.hasMech('reflect'))) {
        const r = Math.max(1, Math.round(dealt * (this.hasTrait('mirror') ? 0.3 : 0.25))); p.hp = Math.max(1, p.hp - r); ev.push({ t: 'reflect', dmg: r });
      }
      if (dealt > 0 && this.hasTrait('thorny')) { const r = 1 + Math.floor(this.depth() / 8); p.hp = Math.max(1, p.hp - r); ev.push({ t: 'thorny', dmg: r }); }
      let totalDealt = dealt;
      if (s.bf.double && mon.hp > 0) { const d2 = this.hitMon(dmg); totalDealt += d2; ev.push({ t: 'extra', dmg: d2, why: '連射' }); }
      s.bf.double = false;
      const burn = this.passive('burn');
      if (burn && crit && mon.hp > 0) { const d3 = this.hitMon(Math.round(base * burn.val)); ev.push({ t: 'extra', dmg: d3, why: '灼燒' }); }
      if (s.bf.leech) { const v = this.heal(totalDealt * s.bf.leech); if (v) ev.push({ t: 'heal', v }); s.bf.leech = 0; }
      if (this.has('mjolnir') && mon.hp > 0 && Math.random() < 0.3) {
        const d2 = this.hitMon(Math.max(1, Math.round(base * 0.6))); ev.push({ t: 'extra', dmg: d2, why: '雷神之鎚' });
      }
      if (this.has('inkfeather') && mon.hp > 0 && Math.random() < 0.15) {
        const d2 = this.hitMon(Math.max(1, Math.round(base * 0.8))); ev.push({ t: 'extra', dmg: d2, why: '墨染羽毛' });
      }
      if (this.has('redpen') && mon.hp > 0) { s.bf.atk0 = s.bf.atk0 || mon.atk; if (mon.atk > Math.ceil(s.bf.atk0 / 2)) mon.atk--; }
      if (this.petIs('dog') && mon.hp > 0 && Math.random() < (15 + this.petLv() * 3) / 100) {
        const bd = this.hitMon(Math.max(1, Math.round(base * 0.4))); ev.push({ t: 'pet', kind: 'bite', dmg: bd });
      }
      if (this.petIs('dragon') && mon.hp > 0) {
        const fd = this.hitMon(2 + this.petLv()); ev.push({ t: 'pet', kind: 'fire', dmg: fd });
      }
      const ex = this.passive('execute');
      if (ex && mon.hp > 0 && mon.hp <= mon.maxHp * (mon.boss ? ex.val * 0.6 : ex.val)) {
        mon.hp = 0; ev.push({ t: 'execute' });
      }
      let h = p.regen + (this.has('fang') ? 2 : 0) + (this.has('lastlamp') ? 3 : 0);
      if (this.has('cloak')) h += Math.round(dealt * 0.15);
      if (this.petIs('fairy')) h += 1 + Math.floor(this.petLv() / 2);
      if (h) { const v = this.heal(h); if (v) ev.push({ t: 'heal', v }); }
      const before = p.lv + (p.skillBonus || 0);
      const ups = this.gainXp(8 + Math.floor(this.depth() / 2));
      if (ups) ev.push({ t: 'level', lv: p.lv, skills: this.newSkillNames(before) });
      this.petXp(1);
      s.bf.freeze = false;
    } else {
      s.stats.wrongIds.push(q.id);
      s.combo = 0;
      s.bf.smite = 0; s.bf.double = false; s.bf.leech = 0;
      if (this.has('calm')) s.bf.calm = true;
      if (this.has('oldnotes')) s.shield += 4;
      let dmg = Math.round(this.monAtk() * (0.85 + Math.random() * 0.3) * p.hurtMul);
      if (s.bf.charged && mon.hp > 0) { dmg *= 2; ev.push({ t: 'chargehit' }); }
      if (this.hasTrait('ambush') && s.bf.turn === 1) { dmg = Math.round(dmg * 1.6); ev.push({ t: 'mstatus', text: '先制攻擊！' }); }
      if (s.bf.exposed) dmg = Math.round(dmg * 1.3);
      if (res.partial && !this.D(9)) { dmg = Math.round(dmg * 0.5); const pd = this.hitMon(Math.max(1, Math.round(p.atk * p.atkMul * 0.5))); ev.push({ t: 'hit', dmg: pd, crit: false, partial: true }); }
      dmg = Math.max(1, dmg - Math.max(0, p.def - (s.bf.rot || 0)));
      if (s.bf.half) { dmg = Math.max(1, Math.round(dmg * 0.5)); s.bf.half = false; }
      if (mon.hp > 0 && this.hasMech('regen')) { const r = Math.round(mon.maxHp * 0.08); mon.hp = Math.min(mon.maxHp, mon.hp + r); ev.push({ t: 'mheal', v: r }); }
      if (mon.hp > 0 && this.hasMech('curse')) { s.bf.curse = (s.bf.curse || 0) + 2; ev.push({ t: 'curse' }); }
      let hits = this.hasMech('double') ? [0.65, 0.65] : [1];
      if (this.hasTrait('swarm')) hits = hits.length > 1 ? [0.5, 0.5, 0.5] : [0.6, 0.6];
      const dodge = p.dodge + (this.petIs('fox') ? (8 + this.petLv() * 2.5) / 100 : 0);
      let totalTaken = 0;
      for (const k of hits) {
        if (mon.hp <= 0) break;
        const d = Math.max(1, Math.round(dmg * k));
        if (s.bf.freeze) { ev.push({ t: 'block', why: '時間凍結' }); continue; }
        if (this.has('hourglass') && !s.bf.hourglass) { s.bf.hourglass = true; ev.push({ t: 'block', why: '時之沙漏' }); continue; }
        if (this.has('shell') && Math.random() < 0.2) { ev.push({ t: 'block', why: '墨潮貝殼' }); continue; }
        if (s.bf.dodgeNext || Math.random() < dodge) { ev.push({ t: 'dodge' }); continue; }
        if (this.petIs('cat') && Math.random() < (10 + this.petLv() * 3) / 100) { ev.push({ t: 'block', why: Store.petName('cat') + '撒嬌', pet: true }); continue; }
        let taken = d;
        if (this.has('omamori') && p.hp < p.maxHp * 0.3) taken = Math.max(1, Math.round(taken * 0.7));
        if (s.shield > 0) { const a = Math.min(s.shield, taken); s.shield -= a; taken -= a; }
        p.hp = Math.max(0, p.hp - taken); totalTaken += taken;
        ev.push({ t: 'hurt', dmg: taken, raw: d });
        if (this.has('thorns')) { const r = this.hitMon(Math.round(d * 0.6)); ev.push({ t: 'thorns', dmg: r }); }
        if (p.hp <= 0) break;
      }
      s.bf.freeze = false; s.bf.dodgeNext = false;
      if (mon.hp > 0) {
        if (this.hasTrait('drain') && totalTaken) { const v = Math.round(totalTaken * 0.5); mon.hp = Math.min(mon.maxHp, mon.hp + v); ev.push({ t: 'mheal', v, why: '吸血' }); }
        if (this.hasTrait('thief') && p.gold > 0) { const g = Math.min(p.gold, 5 + Math.floor(this.depth() / 2)); p.gold -= g; ev.push({ t: 'steal', v: g }); }
        if (this.hasTrait('poison')) { s.bf.poison = 3; ev.push({ t: 'status', text: '中毒！' }); }
        if (this.hasTrait('silence')) { this.skills().forEach(k => { if (k.cd && this.skillOK(k)) s.cd[k.id] = (s.cd[k.id] || 0) + 1; }); ev.push({ t: 'status', text: '技能封印 +1' }); }
        if (this.hasTrait('weaken')) { s.bf.curse = (s.bf.curse || 0) + 1; ev.push({ t: 'status', text: '凝視：攻擊 -1' }); }
        if (this.hasTrait('shock')) { s.bf.numb = true; ev.push({ t: 'status', text: '⚡ 麻痺：下次無法暴擊' }); }
        if (this.hasTrait('expose')) { s.bf.exposed = true; ev.push({ t: 'status', text: '🎯 露出破綻：受傷 +30%' }); }
        if (this.hasTrait('chill')) { s.bf.chill = true; ev.push({ t: 'status', text: '❄ 凍傷：下一擊 -30%' }); }
        if (this.hasTrait('scorch')) { s.bf.burnP = 2; ev.push({ t: 'status', text: '🔥 著火了！' }); }
        if (this.hasTrait('rot')) { s.bf.rot = (s.bf.rot || 0) + 1; ev.push({ t: 'status', text: '腐蝕：防禦 -1' }); }
        if (this.hasTrait('siphon')) { mon.atk += 1; s.bf.curse = (s.bf.curse || 0) + 1; ev.push({ t: 'status', text: '汲取：攻擊 -1' }); }
        if (this.hasMech('seal')) { this.skills().forEach(k => { if (k.cd && this.skillOK(k)) s.cd[k.id] = (s.cd[k.id] || 0) + 2; }); ev.push({ t: 'status', text: '封咒：技能冷卻 +2' }); }
      }
    }
    // 怪物特性（每題）
    if (mon.hp > 0) {
      if (s.bf.poison > 0 && p.hp > 0) { const pd = Math.max(1, Math.round((2 + Math.floor(this.depth() / 5)) * (this.has('cork') ? 0.5 : 1))); p.hp = Math.max(0, p.hp - pd); s.bf.poison--; ev.push({ t: 'poison', dmg: pd }); }
      if (this.hasTrait('heal') && s.bf.turn % 3 === 0) { const v = Math.round(mon.maxHp * 0.1); mon.hp = Math.min(mon.maxHp, mon.hp + v); ev.push({ t: 'mheal', v, why: '再生' }); }
      if (this.hasTrait('charge')) { if (s.bf.charged) s.bf.charged = false; else if (s.bf.turn % 3 === 2) { s.bf.charged = true; ev.push({ t: 'charging' }); } }
      if (s.bf.burnP > 0 && p.hp > 0) { const bd = Math.max(1, Math.round((2 + Math.floor(this.depth() / 4)) * (this.has('cork') ? 0.5 : 1))); p.hp = Math.max(0, p.hp - bd); s.bf.burnP--; ev.push({ t: 'burn', dmg: bd }); }
      if (this.hasTrait('bloat') && s.bf.turn % 2 === 0) { s.bf.bloat = (s.bf.bloat || 0) + 1; ev.push({ t: 'mstatus', text: '膨脹！攻擊 +10%' }); }
      if (this.hasTrait('guard') && s.bf.turn % 3 === 0) { s.bf.guardUp = true; ev.push({ t: 'mstatus', text: '🛡 舉起了盾' }); }
      if (this.hasTrait('split') && !s.bf.split && mon.hp < mon.maxHp * 0.5) { s.bf.split = true; const v = Math.round(mon.maxHp * 0.2); mon.hp = Math.min(mon.maxHp, mon.hp + v); ev.push({ t: 'mheal', v, why: '分裂' }); }
      if (this.hasTrait('explode') && mon.hp < mon.maxHp * 0.25) {
        if (!s.bf.fuse) { s.bf.fuse = true; ev.push({ t: 'fuse' }); }
        else {
          let d = Math.round(this.monAtk() * 1.5 * p.hurtMul);
          if (s.shield > 0) { const a = Math.min(s.shield, d); s.shield -= a; d -= a; }
          p.hp = Math.max(1, p.hp - d); mon.hp = 0; ev.push({ t: 'explode', dmg: d });
        }
      }
    }
    // 首領機制（每題）
    if (mon.hp > 0 && (mon.boss || mon.elite)) {
      if (this.hasMech('enrage')) { s.bf.enrage = (s.bf.enrage || 0) + 1; }
      if (this.hasMech('shield') && s.bf.turn % 3 === 0) { const g = Math.round(mon.maxHp * 0.12); s.bf.bshield = (s.bf.bshield || 0) + g; ev.push({ t: 'bshield', v: g }); }
      if (this.hasMech('summon') && s.bf.turn % 4 === 0) { s.bf.minion = 2; ev.push({ t: 'mstatus', text: '召喚了僕從！' }); }
      if (this.hasMech('phase') && !s.bf.phase2 && mon.hp < mon.maxHp * 0.5) { s.bf.phase2 = true; const v = Math.round(mon.maxHp * 0.15); mon.hp = Math.min(mon.maxHp, mon.hp + v); ev.push({ t: 'phase2', v }); }
      if (this.hasMech('miasma') && p.hp > 0) { const d = 1 + (s.act || 1) + Math.floor(this.depth() / 10); p.hp = Math.max(0, p.hp - d); ev.push({ t: 'miasma', dmg: d }); }
      if (this.hasMech('countdown') && s.bf.turn % 6 === 0 && p.hp > 0) {
        let d = Math.round(p.maxHp * 0.2);
        if (s.shield > 0) { const a = Math.min(s.shield, d); s.shield -= a; d -= a; }
        p.hp = Math.max(0, p.hp - d); ev.push({ t: 'judge', dmg: d });
      } else if (this.hasMech('countdown') && s.bf.turn % 6 === 5) ev.push({ t: 'mstatus', text: '⚖ 審判即將降臨！' });
    }
    if (this.has('inkheart') && p.hp > 1) p.hp--;
    // 逃跑：第 5 題結束仍存活
    if (mon.hp > 0 && p.hp > 0 && this.hasTrait('flee') && s.bf.turn >= 5) { s.bf.fled = true; s.phase = this.remaining <= 1 ? 'out' : 'after'; ev.push({ t: 'flee' }); }
    if (!this.abyss) s.qi++;
    s.curQ = null;
    if (mon.hp <= 0 && this.hasTrait('undying') && !s.bf.undied) { s.bf.undied = true; mon.hp = Math.round(mon.maxHp * 0.3); ev.push({ t: 'undying' }); }
    if (mon.hp <= 0) ev.push(...this.onKill());
    else if (s.bf.fled) { /* 逃走了，沒有獎勵 */ }
    else if (p.hp <= 0) {
      if (p.revive > 0) { p.revive--; p.hp = this.has('phoenixheart') ? p.maxHp : Math.round(p.maxHp * 0.5); ev.push({ t: 'revive', why: '復活' }); }
      else if (this.useItemRaw('feather')) { p.hp = Math.round(p.maxHp * 0.4); ev.push({ t: 'revive', why: '復活羽毛' }); }
      else { s.phase = 'dead'; ev.push({ t: 'dead' }); }
    }
    if (s.phase === 'battle' && mon.hp > 0 && this.remaining <= 0) { s.phase = 'out'; ev.push({ t: 'out' }); }
    this.save();
    return ev;
  }

  onKill() {
    const s = this.s, mon = s.mon, ev = [];
    s.stats.kills++; s.stats.floorsCleared++;
    if (mon.elite) s.stats.elites++;
    const f = this.depth();
    let g = 6 + f * 2 + (mon.elite ? 20 : 0) + (mon.mimic ? 45 : 0) + (mon.boss ? 60 + s.act * 20 : 0);
    if (this.hasTrait('greed')) g *= mon.secret ? 4 : 2;
    const gold = this.gainGold(g);
    if (mon.secret) { Store.addGems(15); ev.push({ t: 'status', text: '魂晶 +15！' }); setTimeout(() => Ach.unlock('goldslime'), 0); }
    const before = this.p.lv + (this.p.skillBonus || 0);
    const ups = this.gainXp(15 + f * 4 + (mon.boss ? 60 + s.act * 30 : 0) + (mon.elite ? 25 : 0));
    ev.push({ t: 'kill', gold });
    const B = Store.profile.bestiary, bk = mon.boss ? 'boss:' + mon.name : mon.sp;
    if (bk) { B[bk] = (B[bk] || 0) + 1; Store.saveProfile(); }
    if (this.hasTrait('spite')) { this.damage(6, true); ev.push({ t: 'status', text: '怨念 -6' }); }
    if (ups) ev.push({ t: 'level', lv: this.p.lv, skills: this.newSkillNames(before) });
    let h = this.p.killHeal * this.p.maxHp;
    if (this.petIs('fairy')) h += this.petLv() * 2;
    if (this.has('wick')) h += 6;
    if (h) this.heal(h);
    if (this.has('blankpage')) this.tickCooldowns();
    if (this.has('letter') && s.stats.kills % 3 === 0) { this.addItem('potion_s'); ev.push({ t: 'status', text: '未寄出的信：小回復藥 +1' }); }
    if (this.petIs('rat') && !mon.boss && Math.random() < (12 + this.petLv() * 3) / 100) {
      const it = U.pick(['potion_s', 'potion_s', 'shield', 'elim', 'bomb', 'elixir']); this.addItem(it); ev.push({ t: 'petfind', item: it });
    }
    if (mon.elite) { const r = this.randomRelic(); if (r) { this.addRelic(r.id); ev.push({ t: 'relic', id: r.id }); } }
    if (mon.secretBoss) {
      s.stats.bosses++; s.stats.secret = true; s.stats.boss = true; s.phase = 'win';
      setTimeout(() => { Ach.unlock('secret_boss'); C.unlockAcc('laurel'); }, 0);
    }
    else if (mon.boss) {
      s.stats.bosses++;
      if (this.abyss) { s.phase = 'bossreward'; s.bossChoice = this.bossRelicChoices(); }
      else { s.stats.boss = true; s.phase = 'win'; }
    }
    else if (this.remaining <= 0) s.phase = 'out';
    else s.phase = 'after';
    return ev;
  }
  /* 首領遺物選完之後：進下一章或通關 */
  finishBossReward() {
    const s = this.s;
    s.bossChoice = null;
    const acc = s.stats.answered ? s.stats.correct / s.stats.answered : 0;
    if (s.act >= 3 && !s.secretDone && s.stats.answered >= 10 && acc >= 0.8) s.phase = 'rift';
    else if (s.act >= 3) { s.stats.boss = true; s.phase = 'win'; }
    else {
      const miss = this.p.maxHp - this.p.hp;
      this.heal(miss * 0.5);
      this.newAct(s.act + 1);
      s.actIntro = true;
    }
    this.save();
  }

  /* 隱藏首領：接受或放棄裂縫的挑戰 */
  startSecret(accept) {
    const s = this.s; s.secretDone = true;
    if (!accept) { s.stats.boss = true; s.phase = 'win'; this.save(); return; }
    this.heal((this.p.maxHp - this.p.hp) * 0.5);
    s.map.nodes.secret = { id: 'secret', r: s.map.rows + 1, c: 2, type: 'boss', next: [], done: true, boss: { secret: true } };
    s.map.cur = 'secret'; s.phase = 'start';
    this.save();
  }

  /* 擊敗怪物後：一般遠征→岔路；深淵→回地圖。兩者每 3 場戰鬥都有天賦/遺物抉擇 */
  makeDoors() {
    const s = this.s;
    if (s.stats.floorsCleared >= s.nextChoice) { s.nextChoice += 3; s.phase = 'choice'; s.choice = this.makeChoice(); this.save(); return; }
    if (this.abyss) { s.phase = 'map'; this.save(); return; }
    const opts = ['event', 'camp', 'shop', 'treasure', 'event', 'onward'];
    if (s.floor >= 3 && this.remaining > Math.max(3, Math.round(s.total * 0.25)) + 2) opts.push('elite');
    let doors = [];
    const pool = U.shuffle(opts);
    for (const d of pool) { if (!doors.includes(d)) doors.push(d); if (doors.length === (U.chance(0.4) ? 3 : 2)) break; }
    s.doors = doors; s.phase = 'doors'; this.save();
  }
  makeChoice() {
    const talents = U.pickN(C.TALENTS, 3).map(t => ({ kind: 'talent', id: t.id }));
    const rel = [this.randomRelic(), this.randomRelic()].filter(Boolean);
    const out = talents.slice(0, rel.length ? 2 : 3);
    if (rel.length) out.push({ kind: 'relic', id: rel[0].id });
    return U.shuffle(out);
  }
  makeShop() {
    const disc = this.priceMul();
    const ids = U.pickN(Object.keys(C.ITEMS), 5);
    const items = ids.map(id => ({ kind: 'item', id, price: Math.round(C.ITEMS[id].price * disc * (0.9 + Math.random() * 0.25)), sold: false }));
    const r = this.randomRelic();
    if (r) items.push({ kind: 'relic', id: r.id, price: Math.round((90 + r.rar * 30) * disc), sold: false });
    items.push({ kind: 'stat', id: 'maxhp', price: Math.round(55 * disc), sold: false });
    items.push({ kind: 'stat', id: 'atk', price: Math.round(65 * disc), sold: false });
    return items;
  }
}
