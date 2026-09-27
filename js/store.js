/* 存檔：localStorage 自動儲存（角色成長、作答紀錄、錯題、遠征進度） */
const Store = (() => {
  const K = { profile: SKEY('profile'), qs: SKEY('qstats'), wrong: SKEY('wrong'), run: SKEY('run'), set: SKEY('settings') };
  function load(k, def) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('save failed', e); }
  }
  const defProfile = () => ({
    gems: 0, accXp: 0, accLv: 1, hero: 97, upg: {},
    relicsUnlocked: C.RELICS.filter(r => !r.locked && !r.boss && !r.secret).map(r => r.id),
    classes: { knight: { lv: 1, xp: 0 } }, activeClass: 'knight', bestiary: {},
    abyss: { maxDiff: 0, clears: 0, runs: 0, bestAct: 0, bossKills: 0, best: {} },
    pets: {}, activePet: null, starterPicked: false, petNames: {}, petSkin: {}, petAcc: {}, ownedSkins: [], ownedAcc: [], daily: {}, streak: { last: '', n: 0 }, migratedPets: true,
    stats: { runs: 0, wins: 0, answered: 0, correct: 0, bestFloor: 0, kills: 0, bosses: 0, gemsEarned: 0, deaths: 0 },
    stages: {}, created: Date.now()
  });
  let profile = Object.assign(defProfile(), load(K.profile, {}));
  profile.abyss = Object.assign(defProfile().abyss, profile.abyss || {});
  profile.classes = profile.classes || { knight: { lv: 1, xp: 0 } }; profile.activeClass = profile.activeClass || 'knight'; profile.bestiary = profile.bestiary || {};
  ['petNames', 'petSkin', 'petAcc', 'daily'].forEach(k => { profile[k] = profile[k] || {}; });
  ['ownedSkins', 'ownedAcc'].forEach(k => { profile[k] = profile[k] || []; });
  profile.streak = profile.streak || { last: '', n: 0 };
  if (!profile.migratedPets) { // 舊版的 cat 是招財貓
    if (profile.pets.cat) { profile.pets.luckycat = profile.pets.cat; delete profile.pets.cat; if (profile.activePet === 'cat') profile.activePet = 'luckycat'; }
    profile.migratedPets = true;
  }
  let qs = load(K.qs, {});
  let wrong = load(K.wrong, {});
  let settings = Object.assign({ autoExplain: true, confirmSingle: false }, load(K.set, {}));

  const Q = {}; // id -> question
  const EX = {}; // id -> exam
  if (!window.QB) window.QB = { meta: {}, subjects: [], exams: [], groups: {}, questions: [] };
  function reindex() {
    (window.QB?.questions || []).forEach(q => { Q[q.id] = q; });
    (window.QB?.exams || []).forEach(e => { EX[e.id] = e; });
  }
  reindex();

  function saveProfile() { save(K.profile, profile); UI_refreshTop && UI_refreshTop(); }
  function saveQs() { save(K.qs, qs); }
  function saveWrong() { save(K.wrong, wrong); }

  /* 作答紀錄 */
  function record(qid, ok) {
    const s = qs[qid] || (qs[qid] = { a: 0, c: 0, w: 0, last: 0, t: 0 });
    s.a++; ok ? s.c++ : s.w++; s.last = ok ? 1 : 0; s.t = Date.now();
    profile.stats.answered++; if (ok) profile.stats.correct++;
    const dd = daily(); dd.answered++; if (ok) dd.correct++;
    if (!ok) {
      const w = wrong[qid] || (wrong[qid] = { t: Date.now(), n: 0, streak: 0, done: false });
      w.n++; w.streak = 0; w.done = false; w.t = Date.now();
    } else if (wrong[qid] && !wrong[qid].done) {
      wrong[qid].streak++;
      if (wrong[qid].streak >= 2) { wrong[qid].done = true; }
    }
    saveQs(); saveWrong(); save(K.profile, profile);
  }
  function status(qid) {
    const s = qs[qid];
    if (!s || !s.a) return 'new';
    return s.last ? 'right' : 'wrong';
  }

  /* 題目篩選 */
  function filter(opt) {
    // opt: {subjects:[], years:[], exams:[], types:[], status:'all'|'new'|'wrong'|'right'|'unmastered'|'wrongbook', search, ids}
    let list = window.QB.questions;
    if (opt.ids) { const set = new Set(opt.ids); list = list.filter(q => set.has(q.id)); }
    if (opt.exams && opt.exams.length) { const s = new Set(opt.exams); list = list.filter(q => s.has(q.exam)); }
    if (opt.subjects && opt.subjects.length) { const s = new Set(opt.subjects); list = list.filter(q => s.has(EX[q.exam].subj)); }
    if (opt.years && opt.years.length) { const s = new Set(opt.years.map(Number)); list = list.filter(q => s.has(EX[q.exam].year)); }
    if (opt.types && opt.types.length) { const s = new Set(opt.types); list = list.filter(q => s.has(q.type)); }
    const st = opt.status || 'all';
    if (st === 'new') list = list.filter(q => !qs[q.id]?.a);
    else if (st === 'wrong') list = list.filter(q => qs[q.id]?.w > 0);
    else if (st === 'lastwrong') list = list.filter(q => qs[q.id]?.a && !qs[q.id].last);
    else if (st === 'right') list = list.filter(q => qs[q.id]?.c > 0);
    else if (st === 'unmastered') list = list.filter(q => !qs[q.id]?.c);
    else if (st === 'wrongbook') list = list.filter(q => wrong[q.id] && !wrong[q.id].done);
    if (opt.search) {
      const k = opt.search.trim().toLowerCase();
      if (k) list = list.filter(q => (q.tag || '').toLowerCase().includes(k) || (q.ex || '').toLowerCase().includes(k) || q.id.includes(k));
    }
    return list;
  }

  function examStats(eid) {
    const list = window.QB.questions.filter(q => q.exam === eid && q.type !== 'open');
    let done = 0, right = 0;
    list.forEach(q => { if (qs[q.id]?.a) { done++; if (qs[q.id].c) right++; } });
    return { total: list.length, done, right };
  }

  function addGems(n) { profile.gems += n; saveProfile(); }
  function accNeed(lv) { return Math.round(120 * Math.pow(lv, 1.35)); }
  function addAccXp(n) {
    profile.accXp += n; let ups = 0;
    while (profile.accXp >= accNeed(profile.accLv)) { profile.accXp -= accNeed(profile.accLv); profile.accLv++; ups++; }
    saveProfile(); return ups;
  }
  function upg(id) { return profile.upg[id] || 0; }
  function addClassXp(id, n) {
    const c = profile.classes[id] || (profile.classes[id] = { lv: 1, xp: 0 });
    c.xp += n; let ups = 0;
    while (c.xp >= C.classNeed(c.lv)) { c.xp -= C.classNeed(c.lv); c.lv++; ups++; }
    saveProfile(); return ups;
  }
  function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function daily() {
    if (profile.daily.date !== today()) profile.daily = { date: today(), answered: 0, correct: 0, claimed: false, pets: 0 };
    return profile.daily;
  }
  function touchStreak() {
    const t = today(), s = profile.streak;
    if (s.last !== t) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const ys = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
      s.n = s.last === ys ? s.n + 1 : 1; s.last = t; save(K.profile, profile);
    }
    return s.n;
  }
  function petName(id) { return (profile.petNames && profile.petNames[id]) || (C.pet(id) || {}).name || ''; }
  function petHTML(id, size = 48, cls = '', style = '', skinId, accId) {
    const sid = skinId === undefined ? profile.petSkin[id] : skinId;
    const sk = sid && (C.PET_SKINS[id] || []).find(x => x.id === sid);
    const acc = accId === undefined ? profile.petAcc[id] : accId;
    return SP.pet(id, size, cls, style, sk ? sk.pal : null, acc || null);
  }
  function heroTile(id) {
    const c = id || profile.activeClass, sid = (profile.heroSkin || {})[c];
    const sk = sid && (C.HERO_SKINS[c] || []).find(x => x.id === sid);
    return sk ? C.skinIcon(sk) : C.cls(c).tile;
  }

  function petXp(n) {
    const id = profile.activePet; const p = profile.pets[id]; if (!p) return 0;
    n = Math.round(n * (1 + 0.25 * upg('petxp')));
    p.xp += n; let ups = 0;
    while (p.lv < C.PET_MAX && p.xp >= C.petNeed(p.lv)) { p.xp -= C.petNeed(p.lv); p.lv++; ups++; }
    if (p.lv >= C.PET_MAX) p.xp = 0;
    saveProfile(); return ups;
  }

  /* 遠征存檔 */
  function saveRun(r) { if (r) save(K.run, r); else localStorage.removeItem(K.run); }
  function loadRun() { return load(K.run, null); }

  function exportAll() {
    return JSON.stringify({ v: 1, project: (window.QB.meta || {}).id, profile, qs, wrong, settings, run: loadRun(), pomo: window.POMO ? POMO.exportData() : null, learn: window.LEARN_UI ? LEARN_UI.exportData() : null, at: new Date().toISOString() });
  }
  function importAll(txt) {
    const d = JSON.parse(txt);
    if (!d.profile) throw new Error('格式不符');
    profile = Object.assign(defProfile(), d.profile); qs = d.qs || {}; wrong = d.wrong || {}; settings = Object.assign(settings, d.settings || {});
    save(K.profile, profile); saveQs(); saveWrong(); save(K.set, settings); saveRun(d.run || null); if (d.pomo) save(SKEY('pomo'), d.pomo); if (d.learn) save(SKEY('learn'), d.learn);
  }
  function resetAll() { Object.values(K).concat([SKEY('pomo'), SKEY('learn')]).forEach(k => localStorage.removeItem(k)); location.reload(); }
  function saveSettings() { save(K.set, settings); }

  let UI_refreshTop = null;
  return {
    get profile() { return profile; }, get qs() { return qs; }, get wrong() { return wrong; }, get settings() { return settings; },
    Q, EX, reindex, addClassXp, heroTile, daily, touchStreak, petName, petHTML, record, status, filter, examStats, addGems, addAccXp, accNeed, upg, petXp, saveProfile, saveWrong, saveRun, loadRun,
    exportAll, importAll, resetAll, saveSettings,
    onTop(fn) { UI_refreshTop = fn; }
  };
})();
