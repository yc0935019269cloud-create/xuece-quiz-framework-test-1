/* 存檔：localStorage 自動儲存（角色成長、作答紀錄、錯題、遠征進度） */
const Store = (() => {
  const K = { profile: SKEY('profile'), qs: SKEY('qstats'), wrong: SKEY('wrong'), run: SKEY('run'), set: SKEY('settings'), favorites: SKEY('favorites') };
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
    pets: {}, activePet: null, starterPicked: false, petNames: {}, petSkin: {}, petAcc: {}, ownedSkins: [], ownedAcc: [], skinVouchers: 0, giftsClaimed: [], daily: {}, streak: { last: '', n: 0 }, migratedPets: true,
    stats: { runs: 0, wins: 0, answered: 0, correct: 0, bestFloor: 0, kills: 0, bosses: 0, gemsEarned: 0, deaths: 0 },
    stages: {}, relicsVer: 2, created: Date.now()
  });
  const rawProfile = load(K.profile, {});
  let profile = Object.assign(defProfile(), rawProfile);
  profile.abyss = Object.assign(defProfile().abyss, profile.abyss || {});
  profile.classes = profile.classes || { knight: { lv: 1, xp: 0 } }; profile.activeClass = profile.activeClass || 'knight'; profile.bestiary = profile.bestiary || {};
  ['petNames', 'petSkin', 'petAcc', 'daily'].forEach(k => { profile[k] = profile[k] || {}; });
  ['ownedSkins', 'ownedAcc', 'giftsClaimed'].forEach(k => { profile[k] = profile[k] || []; });
  profile.streak = profile.streak || { last: '', n: 0 };
  // 新版加入的免費遺物（since 2）：舊存檔（含匯入、雲端下載的舊存檔）補進已解鎖清單
  function migrateRelics(raw, prof) {
    if (!raw.relicsUnlocked || (raw.relicsVer || 1) >= 2) return;
    C.RELICS.filter(r => r.since === 2 && !r.locked && !r.boss && !r.secret && !prof.relicsUnlocked.includes(r.id)).forEach(r => prof.relicsUnlocked.push(r.id));
    prof.relicsVer = 2;
  }
  migrateRelics(rawProfile, profile);
  if (!profile.migratedPets) { // 舊版的 cat 是招財貓
    if (profile.pets.cat) { profile.pets.luckycat = profile.pets.cat; delete profile.pets.cat; if (profile.activePet === 'cat') profile.activePet = 'luckycat'; }
    profile.migratedPets = true;
  }
  let qs = load(K.qs, {});
  let wrong = load(K.wrong, {});
  let settings = Object.assign({ autoExplain: true, confirmSingle: false }, load(K.set, {}));
  // 保留尚未載入的導入題目 ID；收藏不改動作答與錯題紀錄。
  function normalizeFavorites(raw) {
    const folders = [], items = Object.create(null), ids = new Set();
    (Array.isArray(raw?.folders) ? raw.folders : []).forEach(f => {
      if (!f || typeof f.id !== 'string' || !f.id || ids.has(f.id) || typeof f.name !== 'string' || !f.name.trim()) return;
      ids.add(f.id); folders.push({ id: f.id, name: f.name.trim().slice(0, 50) });
    });
    if (raw?.items && typeof raw.items === 'object' && !Array.isArray(raw.items)) Object.entries(raw.items).forEach(([id, item]) => {
      if (!id || !item || typeof item !== 'object') return;
      items[id] = { folders: [...new Set((Array.isArray(item.folders) ? item.folders : []).filter(fid => ids.has(fid)))], at: Number.isFinite(item.at) ? item.at : 0 };
    });
    return { folders, items };
  }
  let favorites = normalizeFavorites(load(K.favorites, null));

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
  function saveFavorites() { save(K.favorites, favorites); document.dispatchEvent(new Event('favoriteschange')); }
  function isFavorite(id) { return Object.hasOwn(favorites.items, id); }
  function setFavorite(id, on) {
    if (!Q[id]) return;
    if (on) { if (!isFavorite(id)) favorites.items[id] = { folders: [], at: Date.now() }; }
    else delete favorites.items[id];
    saveFavorites();
  }
  function setFavoriteFolders(id, folders) {
    if (!Q[id]) return;
    const valid = new Set(favorites.folders.map(f => f.id));
    favorites.items[id] = { folders: [...new Set(folders.filter(fid => valid.has(fid)))], at: favorites.items[id]?.at || Date.now() };
    saveFavorites();
  }
  function folderName(name, except) {
    name = String(name || '').trim();
    if (!name) throw new Error('請輸入資料夾名稱');
    if (name.length > 50) throw new Error('資料夾名稱最多 50 個字');
    if (favorites.folders.some(f => f.id !== except && f.name === name)) throw new Error('已有同名資料夾');
    return name;
  }
  function createFavoriteFolder(name) {
    name = folderName(name);
    const id = 'f_' + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + '_' + Math.random().toString(36).slice(2));
    favorites.folders.push({ id, name }); saveFavorites(); return id;
  }
  function renameFavoriteFolder(id, name) {
    const f = favorites.folders.find(f => f.id === id); if (!f) return;
    f.name = folderName(name, id); saveFavorites();
  }
  function deleteFavoriteFolder(id) {
    favorites.folders = favorites.folders.filter(f => f.id !== id);
    Object.values(favorites.items).forEach(item => { item.folders = item.folders.filter(fid => fid !== id); });
    saveFavorites();
  }
  function favoriteCount(folder) {
    return Object.entries(favorites.items).filter(([id, item]) => Q[id] && (folder === undefined || (folder === null ? !item.folders.length : item.folders.includes(folder)))).length;
  }

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
    document.dispatchEvent(new CustomEvent('wrongbookchange', { detail: { id: qid } }));   // 題目旁的「錯題本」按鈕跟著更新
  }
  function status(qid) {
    const s = qs[qid];
    if (!s || !s.a) return 'new';
    return s.last ? 'right' : 'wrong';
  }

  /* 題目篩選 */
  const examYear = e => { if (e.year != null && e.year !== '') return Number(e.year); for (const x of e.path || []) { const m = /^\s*(\d{2,3})\s*年(國考)?\s*$/.exec(String(x)); if (m) return Number(m[1]); } return null; };
  /* 「部位」：看圖寫名稱的填答題（答案寫成「中文 / English」）以中文名稱為同一部位，
     同一部位可能出現在好幾張圖、好幾個題本；其他題目各自算一個。出題權重用：答過的部位權重下降。 */
  const partNorm = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[\s\-‐–—'’·・.,，、()（）]/g, '');
  function partKey(q) {
    if (q && q.type === 'fill' && typeof q.ans === 'string' && q.ans.includes('/')) { const k = partNorm(q.ans.split('/')[0]); if (k) return 'p:' + k; }
    return 'q:' + (q ? q.id : '');
  }
  function partsAnswered() { const s = new Set(); Object.keys(qs).forEach(id => { if (qs[id]?.a && Q[id]) s.add(partKey(Q[id])); }); return s; }
  /* 「未作答＋錯題優先」的單題權重：錯題 3；沒作答過的題 1，但它的部位已經在別題答過就降成 0.3；寫對過的 0（排在最後） */
  function smartWeight(id, seen) {
    if ((wrong[id] && !wrong[id].done) || (qs[id]?.a && !qs[id].last)) return 3;
    if (!qs[id]?.a) return seen && seen.has(partKey(Q[id])) ? 0.3 : 1;
    return 0;
  }
  /* 手動加入／移出錯題本（題目旁的「＋ 錯題本」按鈕）。手動加入的 n＝0，之後答對 2 次一樣會畢業。 */
  const inWrongbook = id => !!(wrong[id] && !wrong[id].done);
  function setWrongbook(id, on) {
    if (!Q[id]) return;
    if (on) { const w = wrong[id] || (wrong[id] = { t: Date.now(), n: 0, streak: 0, done: false }); w.done = false; w.streak = 0; w.t = Date.now(); if (!w.n) w.manual = true; }
    else delete wrong[id];
    saveWrong();
    document.dispatchEvent(new CustomEvent('wrongbookchange', { detail: { id } }));
  }
  /* 「題型」：content/patterns 的同題型分組（歷年國考只換數字或小改選項的題）；沒分組的題目各自一型。
     遠征勾「未刷過題型優先」時，題型已經刷過（同組任何一題作答過）的題目權重降成 0.15；
     目前還是錯題的不降（錯題本來就要再練）。 */
  const typeKey = q => { const p = window.QB.patterns && window.QB.patterns[q.id]; return p ? 't:' + p : 'q:' + q.id; };
  function typesAnswered() { const s = new Set(); Object.keys(qs).forEach(id => { if (qs[id]?.a && Q[id]) s.add(typeKey(Q[id])); }); return s; }
  const isWrongNow = id => (wrong[id] && !wrong[id].done) || (qs[id]?.a && !qs[id].last);
  function typeFactor(id, seen) { return Q[id] && !isWrongNow(id) && seen && seen.has(typeKey(Q[id])) ? 0.15 : 1; }
  function filter(opt) {
    // opt: {subjects:[], years:[], exams:[], types:[], status:'all'|'new'|'wrong'|'right'|'unmastered'|'wrongbook', search, ids}
    let list = window.QB.questions;
    if (opt.ids) { const set = new Set(opt.ids); list = list.filter(q => set.has(q.id)); }
    if (opt.exams && opt.exams.length) { const s = new Set(opt.exams); list = list.filter(q => s.has(q.exam)); }
    else if (!opt.ids) list = list.filter(q => !EX[q.exam].optIn);   // optIn 題本（例：答案疑義）只有明確勾選才出題，沒選題本＝全部時不含
    if (opt.subjects && opt.subjects.length) { const s = new Set(opt.subjects); list = list.filter(q => s.has(EX[q.exam].subj)); }
    if (opt.years && opt.years.length) { const s = new Set(opt.years.map(Number)); list = list.filter(q => s.has(examYear(EX[q.exam]))); }
    if (opt.types && opt.types.length) { const s = new Set(opt.types); list = list.filter(q => s.has(q.type)); }
    if (opt.starOnly && typeof LEARN_UI !== 'undefined') { const s = LEARN_UI.starredQids(opt.starOnly === 'exact' ? 'exact' : 'related'); list = list.filter(q => s.has(q.id)); }   // 只出學習模式加星號的部位／題目
    if (opt.favorites === 'saved' || opt.favorites === 'unfiled' || opt.favoriteFolder) list = list.filter(q => {
      const item = favorites.items[q.id];
      return item && (!opt.favoriteFolder || item.folders.includes(opt.favoriteFolder)) && (opt.favorites !== 'unfiled' || !item.folders.length);
    });
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
  // 沒有設定過造型時：騎士預設穿「薔薇近衛」（免費）；明確選過經典預設款（空字串）則照舊
  const DEFAULT_SKIN = { knight: 'px_knight_m2', assassin: 'px_assassin_m1', monk: 'px_monk_m1', bard: 'px_bard_m1' };
  function heroSkinId(c) { const v = (profile.heroSkin || {})[c]; return v === undefined ? (DEFAULT_SKIN[c] || '') : v; }
  function heroTile(id) {
    const c = id || profile.activeClass, sid = heroSkinId(c);
    const sk = sid && (C.HERO_SKINS[c] || []).find(x => x.id === sid);
    // 沒買過的付費造型（例如舊存檔殘留）退回預設外觀
    if (sk && sk.cost && !(profile.ownedHeroSkins || []).includes(c + ':' + sid)) return C.cls(c).tile;
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
    return JSON.stringify({ v: 1, project: (window.QB.meta || {}).id, profile, qs, wrong, settings, favorites, run: loadRun(), pomo: typeof POMO !== 'undefined' ? POMO.exportData() : null, learn: typeof LEARN_UI !== 'undefined' ? LEARN_UI.exportData() : null, peglin: typeof PEGLIN !== 'undefined' ? PEGLIN.exportData() : null, at: new Date().toISOString() });
  }
  function importAll(txt) {
    const d = JSON.parse(txt);
    if (!d.profile) throw new Error('格式不符');
    profile = Object.assign(defProfile(), d.profile); migrateRelics(d.profile, profile); qs = d.qs || {}; wrong = d.wrong || {}; settings = Object.assign(settings, d.settings || {});
    // 舊備份沒有收藏欄位時保留本機收藏；新版備份（包括空收藏）則完整還原。
    if (Object.hasOwn(d, 'favorites')) { favorites = normalizeFavorites(d.favorites); saveFavorites(); }
    save(K.profile, profile); saveQs(); saveWrong(); save(K.set, settings); saveRun(d.run || null); if (d.pomo) save(SKEY('pomo'), d.pomo); if (d.learn) save(SKEY('learn'), d.learn);
    if (d.peglin && typeof PEGLIN !== 'undefined') PEGLIN.importData(d.peglin);
  }
  function resetAll() { Object.values(K).concat([SKEY('pomo'), SKEY('learn')]).forEach(k => localStorage.removeItem(k)); location.reload(); }
  function saveSettings() { save(K.set, settings); }

  let UI_refreshTop = null;
  return {
    get profile() { return profile; }, get qs() { return qs; }, get wrong() { return wrong; }, get settings() { return settings; }, get favorites() { return favorites; },
    isFavorite, setFavorite, setFavoriteFolders, createFavoriteFolder, renameFavoriteFolder, deleteFavoriteFolder, favoriteCount,
    Q, EX, partKey, partsAnswered, smartWeight, typeKey, typesAnswered, typeFactor, inWrongbook, setWrongbook, reindex, addClassXp, heroTile, heroSkinId, daily, touchStreak, petName, petHTML, record, status, filter, examStats, addGems, addAccXp, accNeed, upg, petXp, saveProfile, saveWrong, saveRun, loadRun,
    exportAll, importAll, resetAll, saveSettings,
    onTop(fn) { UI_refreshTop = fn; }
  };
})();
