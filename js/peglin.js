/* Peglin 整合：彈珠刷題／彈珠學習，兩種玩法
 * 1. 網頁版（預設，任何裝置都能玩）：peglin/web.html 外框頁載入 peglinnnnnnn 已部署在 GitHub Pages 的 Unity WebGL 建置（不修改那個 repo）。
 *    遊戲本身沒有出題介面，題目顯示在遊戲外層：答題換彈珠，外框頁偵測發射音效（每發射一顆扣一顆），用完就蓋住遊戲、點一下出下一題。
 *    作答直接寫進這個網頁的進度（錯題本、學習模式、統計），照常雲端同步。
 * 2. 本機版：網頁 → 本機啟動器 Start-PeglinQuiz.exe（127.0.0.1:18769）→ PeglinQuiz 裡的遊戲本體（BepInEx 外掛在戰鬥裡出題）；
 *    作答紀錄回流到錯題本、學習模式與統計，並備份到題庫框架資料夾的 peglin/紀錄/。別台電腦沒有啟動器。
 * 題目與課程一律取自「目前這個網頁」載入的題庫（在 GitHub Page 開就用 GitHub Page 的題庫）。 */
const PEGLIN = (() => {
  const base = 'http://127.0.0.1:18769';
  let polling = false, busy = false, bridge = null, probing = null, lastBackup = 0, dirty = false;
  const selfServed = () => location.origin === base;
  // 在 GitHub Page 上不主動探測本機（避免別人的瀏覽器跳出「存取本機網路」詢問）；要用本機版時按「偵測本機啟動器」
  const autoProbe = () => selfServed() || location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  /* ---------- 本機啟動器 ---------- */
  async function detect(force) {
    if (bridge && !force) return bridge;
    if (probing) return probing;
    probing = (async () => {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 2500);
      try { const r = await fetch(base + '/api/status', { signal: ctl.signal, cache: 'no-store' }); const d = await r.json(); bridge = r.ok && d.ok ? d : null; }
      catch { bridge = null; }
      finally { clearTimeout(t); probing = null; }
      return bridge;
    })();
    return probing;
  }
  const NO_BRIDGE = '找不到本機彈珠服務。本機版只能在安裝了 PeglinQuiz 的電腦上使用：請先雙擊 E:\\PeglinQuiz\\Start-PeglinQuiz.exe（右下角系統匣可設定開機自動啟動），再重新整理這一頁。';
  async function api(path, data) {
    if (!(await detect())) throw new Error(NO_BRIDGE);
    let r;
    try { r = await fetch(base + '/api/' + path, data === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
    catch { bridge = null; throw new Error(NO_BRIDGE); }
    const d = await r.json(); if (!r.ok) throw new Error(d.error || '本機服務連線失敗'); return d;
  }

  /* ---------- 作答紀錄同步（本機版） ---------- */
  const doneKey = () => SKEY('peglin-events');
  async function sync() {
    if (busy || !bridge) return; busy = true;
    try {
      const rows = await api('results');
      const done = new Set(JSON.parse(localStorage.getItem(doneKey()) || '[]'));
      let n = 0, lessons = 0;
      for (const row of rows) {
        if (row.test || !row.eventId || done.has(row.eventId)) continue;
        if (row.kind === 'lesson') { if (typeof LEARN_UI !== 'undefined' && LEARN_UI.applyPeglin && LEARN_UI.applyPeglin({ type: 'lesson', pack: row.pack, lesson: row.lesson, n: row.n, ok: row.ok })) lessons++; }
        else if (row.kind === 'check') { if (typeof LEARN_UI !== 'undefined' && LEARN_UI.applyPeglin) LEARN_UI.applyPeglin({ type: 'check', id: row.checkId, ok: !!row.ok, first: !!row.first }); if (row.ok) Store.addAccXp(4); }
        else if (Store.Q[row.qid]) { Store.record(row.qid, !!row.ok); Store.addAccXp(row.ok ? 8 : 2); if (row.ok) Store.addGems(1); }
        else continue;
        done.add(row.eventId); n++;
      }
      if (n) { localStorage.setItem(doneKey(), JSON.stringify([...done])); App.refreshTop(); dirty = true; if (lessons) U.toast(`彈珠學習：完成 ${lessons} 課，已記進學習模式`); }
      const st = document.querySelector('#peglinSync');
      if (st) st.textContent = `本機版已同步 ${done.size} 筆彈珠紀錄・答錯題進錯題本、學習檢核錯題進複習盒`;
      report(rows);
      if (dirty && Date.now() - lastBackup > 60000) backup().catch(() => {});
    } catch (e) { const st = document.querySelector('#peglinSync'); if (st) st.textContent = e.message; }
    finally { busy = false; }
  }
  /* 把學習存檔與人看得懂的錯題本寫到題庫框架資料夾（peglin/紀錄/） */
  function wrongbookMd() {
    const rows = Object.entries(Store.wrong).filter(([id, w]) => !w.done && Store.Q[id]).sort((a, b) => b[1].t - a[1].t);
    const clean = s => String(s || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '［圖］').replace(/\n+/g, ' ').trim();
    const lines = [`# 錯題本（${APP_TITLE}）`, '', `更新：${new Date().toLocaleString('zh-TW')}・未掌握 ${rows.length} 題（連續答對 2 次畢業）`, ''];
    rows.forEach(([id, w], i) => {
      const q = Store.Q[id], ex = Store.EX[q.exam];
      lines.push(`## ${i + 1}. ${clean(q.stem || q.ans).slice(0, 80)}`, '', `- 題本：${ex ? QV.exLabel(ex) : q.exam}（${id}）`, `- 答錯 ${w.n} 次・最後一次 ${new Date(w.t).toLocaleDateString('zh-TW')}`);
      if (q.choices) lines.push(...q.choices.map((c, k) => `  - ${String.fromCharCode(65 + k)}. ${clean(c)}`));
      lines.push(`- 正確答案：${clean(q.ans)}`, '', clean(q.ex).slice(0, 400), '');
    });
    return lines.join('\n');
  }
  async function backup() {
    const d = await api('backup', JSON.parse(Store.exportAll()));
    await api('wrongbook', { project: (QB.meta || {}).id, markdown: wrongbookMd() });
    lastBackup = Date.now(); dirty = false; return d;
  }
  /* 目前套用的題本在遊戲裡的戰況（本機版） */
  function report(rows) {
    const box = document.querySelector('#pgReport'); if (!box) return;
    let cur = null; try { cur = JSON.parse(localStorage.getItem(SKEY('peglin-session')) || 'null'); } catch {}
    if (!cur) { box.innerHTML = ''; return; }
    const mine = rows.filter(r => r.session === cur.id && r.kind !== 'lesson');
    const title = cur.mode === 'learn' ? '本機版・本次學習' : '本機版・本輪戰報';
    if (!mine.length) { box.innerHTML = `<h3>${title}</h3><p>「${U.esc(cur.label)}」已套用（${cur.count} ${cur.mode === 'learn' ? '步' : '題'}），還沒開始。</p>`; return; }
    const ok = mine.filter(r => r.ok).length;
    let run = 0, best = 0; for (const r of mine) { run = r.ok ? run + 1 : 0; best = Math.max(best, run); }
    const lastWrong = new Map(); for (const r of mine) { if (r.ok) lastWrong.delete(r.qid); else lastWrong.set(r.qid, true); }
    const wrong = [...lastWrong.keys()].filter(id => Store.Q[id]).slice(-5).reverse();
    const doneLessons = rows.filter(r => r.session === cur.id && r.kind === 'lesson').length;
    box.innerHTML = `<h3>${title}</h3><p>「${U.esc(cur.label)}」：已答 <b>${mine.length}</b> 次・答對 <b>${Math.round(ok * 100 / mine.length)}%</b>・最長連對 <b>${best}</b>${cur.mode === 'learn' ? `・完成 <b>${doneLessons}</b> 課` : ''}</p>`
      + (wrong.length ? `<p class="dim">還沒扳回來的題：</p><ul>${wrong.map(id => `<li>${stemText(Store.Q[id])}</li>`).join('')}</ul>` : '');
  }
  const stemText = q => U.esc(String(q.stem || q.ans || q.id).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[*_`#>|]/g, '').slice(0, 42));
  function startSync() {
    if (polling) return; polling = true;
    const tick = async () => { if (await detect()) sync(); };
    tick(); setInterval(tick, 3000);
    window.addEventListener('focus', tick);
  }
  function exportData() {
    const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(SKEY(key)) || 'null') ?? fallback; } catch { return fallback; } };
    return { events: read('peglin-events', []), config: read('peglin-config', {}), learn: read('peglin-learn', {}), session: read('peglin-session', null) };
  }
  function importData(data) {
    if (!data || !Array.isArray(data.events)) return;
    localStorage.setItem(SKEY('peglin-events'), JSON.stringify(data.events.filter(x => typeof x === 'string')));
    for (const key of ['config', 'learn', 'session']) if (key in data) localStorage.setItem(SKEY('peglin-' + key), JSON.stringify(data[key]));
  }

  /* ---------- 題目範圍：與自由遠征相同（科目、題本樹、年份、題型、星號、狀態、出題順序、同類題） ---------- */
  const TYPES = [['single', '單選'], ['multi', '多選'], ['fill', '填答'], ['open', '非選']];
  const STATUS = [['all', '全部'], ['new', '未作答'], ['wrong', '曾答錯'], ['lastwrong', '上次答錯'], ['unmastered', '未答對過'], ['right', '答對過']];
  const PREF = [['smart', '未作答＋錯題優先'], ['rand', '隨機'], ['new', '未作答優先'], ['wrong', '錯題優先']];
  const COUNTS = [['10', '10'], ['15', '15'], ['20', '20'], ['30', '30'], ['50', '50'], ['9999', '全部']];
  function pool(cfg) {
    const list = Store.filter({ subjects: cfg.subjects, exams: cfg.exams, years: cfg.years, types: cfg.types, starOnly: cfg.starOnly, status: cfg.status });
    return list.filter(q => (cfg.types || []).includes('open') || q.type !== 'open');
  }
  /* 出題順序與自由遠征（screens.js 的 prefOrder）相同：smart＝沒作答過＋錯題先出（錯題權重 3），同部位／同題型往後排 */
  function orderUnits(units, pref, patFirst) {
    if ((!pref || pref === 'rand') && !patFirst) return U.shuffle(units);
    const isWrong = id => (Store.wrong[id] && !Store.wrong[id].done) || (Store.qs[id]?.a && !Store.qs[id].last);
    const isNew = id => !Store.qs[id]?.a;
    const seen = pref === 'smart' ? Store.partsAnswered() : null, seenT = patFirst ? Store.typesAnswered() : null;
    const keyed = units.map(u => {
      const id = u[0], q = Store.Q[id];
      const sw = (pref === 'smart' ? Store.smartWeight(id, seen) : 1) * (seenT ? Store.typeFactor(id, seenT) : 1);
      const tier = pref === 'smart' ? (sw > 0 ? 0 : 1) : pref === 'new' ? (isNew(id) ? 0 : 1) : pref === 'wrong' ? (isWrong(id) ? 0 : 1) : 0;
      return [u, tier, -Math.log(Math.random() || 1e-9) / (sw || 1), pref === 'smart' ? Store.partKey(q) : null, patFirst ? Store.typeKey(q) : null];
    }).sort((a, b) => a[1] - b[1] || a[2] - b[2]);
    if (pref !== 'smart' && !patFirst) return keyed.map(x => x[0]);
    const first = [], later = [], used = new Set();
    keyed.forEach(x => {
      const ks = [x[3], x[4]].filter(Boolean);
      if (x[1] === 0 && ks.some(k => used.has(k))) later.push(x); else { ks.forEach(k => used.add(k)); first.push(x); }
    });
    return first.filter(x => x[1] === 0).concat(later, first.filter(x => x[1] === 1)).map(x => x[0]);
  }
  function quizIds(cfg, n) {
    const units = [], seen = {};
    pool(cfg).forEach(q => { if (q.group) { if (!seen[q.group]) units.push(seen[q.group] = []); seen[q.group].push(q.id); } else units.push([q.id]); });
    const out = [];
    for (const u of orderUnits(units, cfg.pref, cfg.patFirst)) { for (const id of u) if (out.length < n) out.push(id); if (out.length >= n) break; }
    return out;
  }
  const roundSize = cfg => Number(cfg.count) || 20;
  const queue = cfg => quizIds(cfg, roundSize(cfg)).map(id => Store.Q[id]);

  /* ---------- 題本打包（本機版） ---------- */
  async function imageData(path) {
    const im = new Image(); im.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => { im.onload = resolve; im.onerror = () => reject(new Error('無法匯出圖片：' + path)); im.src = U.img(path); });
    const scale = Math.min(1, 1400 / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * scale)); c.height = Math.max(1, Math.round(im.naturalHeight * scale));
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return c.toDataURL('image/png'); // file:// 開啟時會因安全限制失敗，改由啟動器從題庫資料夾讀圖
  }
  const addText = (paths, text) => { for (const m of String(text || '').matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) paths.add(m[1]); };
  function bankItem(q, paths) {
    const ex = Store.EX[q.exam], group = q.group && QB.groups[q.group];
    (q.imgs || []).forEach(x => paths.add(x));
    if (group) { (group.imgs || []).forEach(x => paths.add(x)); addText(paths, group.text); }
    addText(paths, q.stem); addText(paths, q.ex); (q.choices || []).forEach(t => addText(paths, t));
    return { ...q, examLabel: ex ? QV.exLabel(ex) : '', groupData: group || null };
  }
  async function embedImages(paths, status) {
    const images = {}, missing = []; let i = 0;
    for (const path of paths) {
      if (status) status.textContent = `正在準備圖片 ${++i} / ${paths.size}…`;
      try { images[path] = await imageData(path); } catch { missing.push(path); }
    }
    return { images, missingImages: missing };
  }
  const newId = () => crypto.randomUUID ? crypto.randomUUID() : 'pg-' + Date.now();
  const subjLabel = subs => subs.length >= Object.keys(C.SUBJECTS).length ? '全部科目' : subs.map(s => C.SUBJECTS[s]?.name).filter(Boolean).join('・') || '全部科目';
  async function exportSession(cfg, status) {
    const chosen = queue(cfg); if (!chosen.length) throw new Error('沒有符合條件的題目，請放寬篩選。');
    const paths = new Set(), questions = chosen.map(q => bankItem(q, paths));
    return { version: 1, mode: 'quiz', id: newId(), label: subjLabel(cfg.subjects), source: location.href.split('#')[0], wrongPenalty: cfg.wrongPenalty, reward: cfg.reward, retryWrong: cfg.retryWrong, ordered: false, questions, ...(await embedImages(paths, status)), created: new Date().toISOString() };
  }

  /* ---------- 課程（本機版）：把學習模式的一課攤平成「閱讀卡＋檢核題」 ---------- */
  const joinMd = v => Array.isArray(v) ? v.map(joinMd).join('\n') : String(v ?? '');
  const L = i => String.fromCharCode(65 + i);
  function checkItem(c, paths) {
    addText(paths, c.q); addText(paths, c.explain);
    const base = { id: 'learn:' + c.id, checkId: c.id, stem: joinMd(c.q), ex: joinMd(c.explain), hint: joinMd(c.hint), labels: 'alpha' };
    const ch = (c.choices || []).map(joinMd);
    switch (c.kind) {
      case 'single': return { ...base, type: 'single', choices: ch, opts: ch.length, key: L(c.answer), ans: `${L(c.answer)}. ${ch[c.answer] || ''}` };
      case 'multi': { const ks = [...c.answer].sort((a, b) => a - b); return { ...base, type: 'multi', choices: ch, opts: ch.length, key: ks.map(L).join(''), ans: ks.map(k => `${L(k)}. ${ch[k]}`).join('、') }; }
      case 'tf': return { ...base, type: 'single', choices: ['⭕ 對', '❌ 錯'], opts: 2, key: c.answer ? 'A' : 'B', ans: c.answer ? '對' : '錯' };
      case 'fill': { const acc = [].concat(c.answer).map(String); return { ...base, type: 'fill', accept: acc, ans: acc[0] }; }
      case 'order': { const items = (c.items || []).map(joinMd); return { ...base, type: 'open', hint: '', stem: base.stem + '\n\n請排出正確順序：\n' + U.shuffle(items.slice()).map(x => '- ' + x).join('\n'), ans: items.join(' → ') }; }
      default: return { ...base, type: 'open', hint: '', ans: joinMd(c.answer) }; // self 自評
    }
  }
  // 「承上題」單獨抽出來看不懂，學習時不出（與 learn.js 相同規則）
  const FOLLOW_RE = /^\s*(【[^】]*】\s*)?(承上|承前|續上|接上|同上|延續上)/;
  // 檢核題寫「承上例／完成剛才的任務後…」的只在課程原位置出，不進複習（與 learn.js 的 ctxDep 相同）
  const CTX_RE = /承上|上題|上例|前例|前一題|完成剛才的任務/;
  function pickBank(pick, n, subj) {
    const words = (pick.match || []).map(w => w.toLowerCase());
    const list = Store.filter({ subjects: pick.subjects || (subj ? [subj] : []), exams: pick.exams, ids: pick.ids, types: pick.types || ['single', 'multi', 'fill'] })
      .filter(q => q.type !== 'open' && !FOLLOW_RE.test(q.stem || '') && words.some(w => (q.tag || '').toLowerCase().includes(w) || (pick.inEx !== false && (q.ex || '').toLowerCase().includes(w))));
    const fresh = list.filter(q => !Store.qs[q.id]?.a), old = list.filter(q => Store.qs[q.id]?.a);
    return U.shuffle(fresh).concat(U.shuffle(old)).slice(0, n);
  }
  function lessonItems(p, l, paths) {
    const out = [], read = (badge, title, body, extra = {}) => { addText(paths, body); if (extra.img) paths.add(extra.img); out.push({ id: `read:${p.id}/${l.id}/${out.length}`, type: 'read', badge, title: title || '', body, ...extra }); };
    for (const s of l.steps) {
      if (s.type === 'intro') read('導入', s.title || l.title, joinMd(s.body), { goals: (l.goals || []).map(joinMd) });
      else if (s.type === 'card') read('概念', s.title, joinMd(s.body), { keys: (s.keys || []).map(joinMd), tip: joinMd(s.tip || ''), img: s.img || '' });
      else if (s.type === 'check') out.push(checkItem(s, paths));
      else if (s.type === 'example') read('範例', s.title || '範例', joinMd(s.problem), { exSteps: (s.steps || []).map(joinMd), exAnswer: joinMd(s.answer || '') });
      else if (s.type === 'practice') {
        const bank = (s.qids || []).map(id => Store.Q[id]).filter(q => q && !FOLLOW_RE.test(q.stem || '')).concat(s.pick ? pickBank(s.pick, s.pick.n || 2, p.subject) : []);
        bank.forEach(q => out.push(bankItem(q, paths)));
        (s.checks || []).forEach(c => out.push(checkItem(c, paths)));
      }
      else if (s.type === 'recap') read('回顧', '本課重點', '', { keys: (s.points || []).map(joinMd), flash: (s.flash || []).map(f => ({ front: joinMd(f.front), back: joinMd(f.back) })), next: s.next ? joinMd(s.next).replace(/^下一課[：:]\s*/, '') : '' });
      else if (s.type === 'diagram') read('圖解', s.title || '看圖認構造', joinMd(s.body) + '\n\n' + (s.points || []).map(x => `- **${x.name}**：${joinMd(x.desc)}`).join('\n'), { img: s.img || '' });
      else if (s.type === 'interactive') read('互動', s.title || '互動模擬', joinMd(s.body) + '\n\n（互動模擬請在營地的「📘 學習模式」操作）');
    }
    const label = `${p.title}｜${l.title}`;
    out.forEach((x, i) => Object.assign(x, { pack: p.id, lesson: l.id, lessonTitle: label, step: i + 1, steps: out.length, lessonEnd: i === out.length - 1 }));
    return out;
  }
  /* 選到的課（"單元id/課id"）依課程順序排好 */
  function selectedLessons(lcfg) {
    const packs = (typeof LEARN_UI !== 'undefined' && LEARN_UI.packs) || [], want = new Set(lcfg.sel || []), out = [];
    Object.keys(C.SUBJECTS).forEach(sj => packTree(packs, sj).forEach(sec => sec.units.forEach(u => u.packs.forEach(p => p.lessons.forEach(l => { if (want.has(p.id + '/' + l.id)) out.push({ p, l }); })))));
    return out;
  }
  async function exportLearn(lcfg, status) {
    const list = selectedLessons(lcfg); if (!list.length) throw new Error('請先點選要上的課（可以多選）。');
    const paths = new Set(), questions = list.flatMap(({ p, l }) => lessonItems(p, l, paths));
    if (!questions.length) throw new Error('選到的課沒有可以帶進遊戲的內容。');
    return { version: 1, mode: 'learn', id: newId(), label: lessonLabel(list), lessonCount: list.length, source: location.href.split('#')[0], wrongPenalty: lcfg.wrongPenalty, reward: lcfg.reward, retryWrong: false, ordered: true, questions, ...(await embedImages(paths, status)), created: new Date().toISOString() };
  }
  const lessonLabel = list => list.length === 1 ? `${list[0].p.title}｜${list[0].l.title}` : `${list[0].l.title} 等 ${list.length} 課`;

  /* ======================================================================
   * 網頁版：peglin/web.html 載入 GitHub Pages 上的 WebGL 建置，題目在遊戲外層
   * ====================================================================== */
  const WEB_DEFAULT = 'https://yc0935019269cloud-create.github.io/peglinnnnnnn/';
  const WEB_ALLOW = /^(https:\/\/yc0935019269cloud-create\.github\.io\/|https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/)/;   // 與 peglin/web.html 相同
  function webBase() { let b = String(readCfg('peglin-web', {}).base || '').trim(); if (b && !b.endsWith('/')) b += '/'; return b && WEB_ALLOW.test(b) ? b : WEB_DEFAULT; }
  // 外框頁跟著 index.html 的快取版本（js/peglin.js?v=N）
  const hostVer = () => ((document.querySelector('script[src*="js/peglin.js"]') || {}).src || '').match(/[?&]v=(\d+)/)?.[1] || '1';
  const hostUrl = () => `peglin/web.html?v=${hostVer()}` + (webBase() !== WEB_DEFAULT ? '&base=' + encodeURIComponent(webBase()) : '') + (readCfg('peglin-web', {}).debug ? '&debug=1' : '');   // debug：QA 讀外框頁狀態
  let webProbe = null;
  function probeWeb(force) {
    if (webProbe && !force) return webProbe;
    return webProbe = (async () => {
      let gl = null; try { gl = document.createElement('canvas').getContext('webgl2'); } catch {}
      if (!gl) return { ok: false, msg: '這個瀏覽器不支援 WebGL 2，沒辦法開網頁版彈珠（請改用新版 Chrome、Edge 或 Safari）。' };
      try { gl.getExtension('WEBGL_lose_context')?.loseContext(); } catch {}
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
      try {
        const r = await fetch(webBase() + 'index.html', { cache: 'no-store', signal: ctl.signal });
        if (r.ok && /createUnityInstance/.test(await r.text())) return { ok: true };
        return { ok: false, msg: `網頁版遊戲（${webBase()}）沒有回應正確的內容。` };
      } catch { return { ok: false, msg: `連不到網頁版遊戲（${webBase()}）：需要網路連線。` }; }
      finally { clearTimeout(t); }
    })();
  }

  /* ---------- 一場網頁版彈珠：答題換彈珠 ----------
   * G：目前這一場。S（session）提供 next()（下一個題目／卡片，null＝這一輪結束）與 again()（再來一輪）。
   * 每答（或每完成）per 個，可以發射 shots 顆；onWrong='none' 時答錯不算數。外框頁每偵測到一次發射扣一顆。 */
  let G = null;
  const STEP_NAME = { intro: '📖 導入', card: '💡 概念', example: '✏️ 範例', recap: '🔁 回顧', diagram: '🖼 圖解', interactive: '🎛 互動', letters: '🔤 字母', check: '✅ 檢核', bank: '⚔ 題目' };
  function webOpen(S) {
    if (G) webClose(true);
    G = { S, mode: S.mode, per: Math.max(1, S.per || 1), shots: Math.max(1, S.shots || 1), onWrong: S.onWrong || 'count', test: !!S.test,
      credits: 0, pts: 0, fired: 0, graded: 0, right: 0, reads: 0, lessons: 0, wrong: [], panel: false, loaded: 0, ready: false, armed: false, error: '', ctl: null, keyBox: null, goBtn: null, item: null };
    const learn = S.mode === 'learn';
    const el = U.h(`<div class="pgw" id="pgw" role="dialog" aria-modal="true" aria-label="${learn ? '彈珠學習' : '彈珠刷題'}">
      <div class="pgw-bar">
        <span class="pgw-title">${learn ? '📘 彈珠學習' : '⚪ 彈珠刷題'}<small>${U.esc(S.label)}</small></span>
        <span class="pgw-ammo" id="pgwAmmo" role="status"></span>
        <span class="pgw-stat" id="pgwStat"></span>
        <span class="grow"></span>
        <button class="px-btn small" id="pgwAsk" title="先答題，把彈珠存起來">📖 ${learn ? '下一步' : '答題'}</button>
        ${typeof POMO !== 'undefined' ? '<button class="px-btn small" id="pgwPomoBtn" title="番茄鐘" aria-label="番茄鐘" aria-expanded="false">🍅</button>' : ''}
        <button class="px-btn small" id="pgwVolBtn" title="刷題地牢的音樂與音效" aria-label="刷題地牢的音樂與音效" aria-expanded="false">♪</button>
        ${typeof AI !== 'undefined' ? '<button class="px-btn small" id="pgwAi" title="AI 助教" aria-label="AI 助教">💬</button>' : ''}
        ${typeof Calc !== 'undefined' ? '<button class="px-btn small" id="pgwCalc" title="計算機" aria-label="計算機">🧮</button>' : ''}
        ${typeof PAD !== 'undefined' ? '<button class="px-btn small" id="pgwPad" title="計算紙" aria-label="計算紙">📝</button>' : ''}
        <button class="px-btn small" id="pgwExit">✕ 結束</button>
        <div class="pgw-vol panel" id="pgwVol" role="dialog" aria-label="刷題地牢的音樂與音效" hidden></div>
        <div class="pgw-vol panel" id="pgwPomo" role="dialog" aria-label="番茄鐘" hidden></div>
      </div>
      <div class="pgw-stage">
        <iframe id="pgwFrame" title="哥布林彈珠" allow="autoplay; fullscreen; gamepad" src="${U.esc(hostUrl())}"></iframe>
        <div class="pgw-shield" id="pgwShield"><button type="button" class="pgw-shield-btn" id="pgwShieldBtn"></button></div>
        <section class="pgw-panel" id="pgwPanel" tabindex="-1" hidden><button type="button" class="pgw-hide" id="pgwHide" title="暫時關閉題目（點📖或彈珠用完時會回到這一題）" aria-label="暫時關閉題目">✕</button><div class="pgw-head" id="pgwHead"></div><div id="pgwQ"></div></section>
      </div></div>`);
    document.body.appendChild(el);
    document.documentElement.classList.add('pgw-open');
    U.$('#pgwExit').onclick = async () => {
      if (G.graded + G.reads && !(await U.confirm('結束彈珠', '會關閉遊戲畫面。這次的作答都已經記進進度了，確定結束嗎？'))) return;
      webClose();
    };
    U.$('#pgwAsk').onclick = () => ask();
    U.$('#pgwHide').onclick = () => hidePanel();
    U.$('#pgwVolBtn').onclick = () => togglePop('vol');
    if (U.$('#pgwPomoBtn')) { U.$('#pgwPomoBtn').onclick = () => togglePop('pomo'); G.pomoTimer = setInterval(pomoTick, 1000); pomoTick(); }
    if (U.$('#pgwAi')) U.$('#pgwAi').onclick = () => AI.toggle();
    if (U.$('#pgwCalc')) U.$('#pgwCalc').onclick = () => Calc.toggle();
    if (U.$('#pgwPad')) U.$('#pgwPad').onclick = () => PAD.toggle();
    U.$('#pgwShield').onclick = () => ask();   // 彈珠用完時點遊戲畫面任何地方都出題（暫時關閉的題目會回來）
    U.$('#pgwFrame').addEventListener('load', () => lock(G && G.credits <= 0));
    window.addEventListener('message', onMsg);
    document.addEventListener('keydown', onKey, true);
    G.cloudTimer = setInterval(() => cloudTick(), 120000); document.addEventListener('visibilitychange', cloudVis);
    next();   // 遊戲載入時先答第一題
  }
  function onMsg(e) {
    const f = U.$('#pgwFrame'), d = e.data;
    if (d && d.pgw === 1 && d.type === 'export') { const w = expWait[d.id]; if (w) { delete expWait[d.id]; w(d.snap); } return; }   // 結束後（舊框已改名）也要收得到
    if (!f || e.source !== f.contentWindow || !d || d.pgw !== 1) return;
    if (!G) return;
    if (d.type === 'hello') { cloudHello(d.snap); return; }
    if (d.type === 'imported') { const m = PGC(); m.localAt = Date.now(); savePGC(m); if (d.first) U.toast('已套用雲端的彈珠存檔（這台第一次載入，遊戲重新開啟一次）', 5000); return; }
    if (d.type === 'progress') G.loaded = d.value;
    else if (d.type === 'ready') { G.ready = true; G.armed = G.armed || !!d.armed; lock(G.credits <= 0); }
    else if (d.type === 'armed') G.armed = true;
    else if (d.type === 'error') G.error = d.message || '遊戲載入失敗';
    else if (d.type === 'shot') {
      G.fired++;
      if (G.credits > 0) G.credits--;
      if (G.credits <= 0 && !G.panel) lock(true);
    } else if (d.type === 'blocked') ask();
    hud();
  }
  /* 工作列的小視窗：♪ 刷題地牢自己的音樂與音效（和頂部「♪ 音樂與音量」同一組 Screens.volumeControls，不是遊戲本身的音量）、🍅 番茄鐘 */
  const POPS = { vol: ['#pgwVol', '#pgwVolBtn'], pomo: ['#pgwPomo', '#pgwPomoBtn'] };
  let popOpen = null;
  function popOutside(e) { if (!popOpen) return; const [p, b] = POPS[popOpen]; if (!U.$(p).contains(e.target) && !U.$(b).contains(e.target)) togglePop(popOpen, false); }
  const popBlur = () => { if (popOpen) togglePop(popOpen, false); };   // 點進遊戲（iframe）時父頁收不到 pointerdown，只會 blur
  function togglePop(name, on) {
    const v = U.$(POPS[name][0]), b = U.$(POPS[name][1]); if (!v || !b) return;
    on = on === undefined ? v.hidden : on;
    if (on && popOpen && popOpen !== name) togglePop(popOpen, false);
    if (on) {
      if (name === 'vol') { v.innerHTML = '<h3>刷題地牢的音樂與音效</h3><p class="dim small-t">遊戲本身的音量請用遊戲裡的「選項」。</p>'; v.appendChild(Screens.volumeControls()); v.onchange = () => hud(); }
      else fillPomo(v);
      if (!popOpen) { document.addEventListener('pointerdown', popOutside, true); window.addEventListener('blur', popBlur); }
      popOpen = name;
    } else if (popOpen === name) { document.removeEventListener('pointerdown', popOutside, true); window.removeEventListener('blur', popBlur); popOpen = null; }
    v.hidden = !on; b.setAttribute('aria-expanded', String(on)); hud();
  }
  /* 番茄鐘：顯示頂部迷你計時器的內容，按鈕呼叫 POMO 的計時控制（時間長度、花園在營地的番茄鐘頁設定） */
  const pomoSt = () => { try { return POMO.data.st || {}; } catch { return {}; } };
  const pomoNow = () => (U.$('#pomoMini') || {}).innerHTML || '🍅';
  function pomoTick() { const b = U.$('#pgwPomoBtn'); if (!b) return; b.innerHTML = pomoNow(); const n = U.$('#pgwPomo .pgw-pomo-now'); if (n) n.innerHTML = pomoNow(); }
  function fillPomo(v) {
    const st = pomoSt(), running = ['focus', 'short', 'long'].includes(st.phase), btn = (a, t, gold) => `<button class="px-btn ${gold ? 'gold' : ''}" data-pp="${a}">${t}</button>`;
    v.innerHTML = `<h3>🍅 番茄鐘</h3><p class="pgw-pomo-now">${pomoNow()}</p><div class="col">`
      + (running ? btn(st.paused ? 'resume' : 'pause', st.paused ? '▶ 繼續' : '⏸ 暫停', true) + btn('skip', '⏭ 跳過這段') + btn('end', '⏹ 結束循環')
        : st.phase === 'ready' && st.nextStep ? btn('next', '▶ 開始下一段', true) + btn('skip', '⏭ 跳過') + btn('end', '⏹ 結束循環')
        : btn('cycle', '▶ 開始番茄鐘', true))
      + '</div><p class="dim small-t">每段多長、花園與紀錄請到營地的「番茄鐘」。</p>';
    U.$$('[data-pp]', v).forEach(b => b.onclick = () => {
      const a = b.dataset.pp;
      if (a === 'pause') POMO.pause(); else if (a === 'resume') POMO.resume(); else if (a === 'skip') POMO.skipStep(); else if (a === 'end') POMO.endCycle(); else if (a === 'cycle') POMO.startCycle();
      else if (a === 'next') { const s = pomoSt(), n = s.nextStep; s.nextStep = null; POMO.start(n.t, n.m); }
      fillPomo(v); pomoTick();
    });
  }
  function onKey(e) {
    if (!G || document.querySelector('.modal-bg')) return;
    if (e.key === 'Escape' && popOpen) { e.preventDefault(); togglePop(popOpen, false); return; }
    if (e.key === 'Escape') { if (G.panel) { e.preventDefault(); hidePanel(); } return; }
    // 題目暫時關閉時，不讓數字鍵／Enter 在看不到的題目上作答（計算機、AI 助教等自己的輸入不受影響）
    if (!G.panel && G.parked && (e.target === document.body || (e.target.closest && e.target.closest('#pgw'))) && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { e.stopImmediatePropagation(); return; }
    if (!G.panel || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (G.keyBox && G.keyBox._key && G.keyBox._key(e)) { e.preventDefault(); e.stopPropagation(); return; }
    if (e.key === 'Enter' && G.goBtn && document.body.contains(G.goBtn)) { e.preventDefault(); e.stopPropagation(); G.goBtn.click(); }
  }
  const unitWord = () => G.mode === 'learn' ? '步' : '題';
  function hud() {
    if (!G) return;
    const need = G.per - G.pts;
    U.$('#pgwAmmo').innerHTML = `⚪ × <b>${G.credits}</b>${G.per > 1 ? `<small>再${G.mode === 'learn' ? '完成' : '答'} ${need} ${unitWord()}可再發射 ${G.shots} 顆</small>` : ''}`;
    const load = G.error ? `⚠ ${U.esc(G.error)}` : !G.ready ? `遊戲載入中 ${Math.round(G.loaded * 100)}%` : !G.armed ? '發射偵測準備中…' : '';
    U.$('#pgwStat').innerHTML = `${G.mode === 'learn' ? `已完成 ${G.reads + G.graded} 步` : `已答 ${G.graded} 題`}${G.graded ? `・一次答對 ${G.right}/${G.graded}` : ''}・已發射 ${G.fired} 顆${load ? `<em>${load}</em>` : ''}`;
    U.$('#pgwShieldBtn').innerHTML = `⚪ 彈珠用完了<small>點這裡${G.mode === 'learn' ? '繼續上課' : '答下一題'}，${G.per > 1 ? `每${G.mode === 'learn' ? '完成' : '答'} ${G.per} ${unitWord()}` : '答完'}可以再發射 ${G.shots} 顆</small>`;
    U.$('#pgwAsk').hidden = G.panel;
    U.$('#pgwAsk').textContent = G.parked ? '📖 回到題目' : `📖 ${G.mode === 'learn' ? '下一步' : '答題'}`;
    U.$('#pgwVolBtn').textContent = typeof VOL !== 'undefined' && VOL.get('muted') ? '🔇' : '♪';
  }
  function post(msg, frame) { const f = frame || U.$('#pgwFrame'); try { f && f.contentWindow && f.contentWindow.postMessage(Object.assign({ pgw: 1 }, msg), '*'); } catch {} }
  function lock(on) {
    if (!G) return;
    U.$('#pgwShield').hidden = !on && !G.panel;
    post({ type: 'lock', on: !!on || G.panel });
    if (!on && !G.panel) { const f = U.$('#pgwFrame'); try { f.focus(); } catch {} }
  }
  function openPanel() {
    G.panel = true; U.$('#pgw').classList.add('panel-open');
    const p = U.$('#pgwPanel'); p.hidden = false; lock(true); p.scrollTop = 0; p.focus({ preventScroll: true });
  }
  function closePanel() {
    clearItem(); G.panel = false; G.parked = false; U.$('#pgw').classList.remove('panel-open'); U.$('#pgwPanel').hidden = true;
    lock(G.credits <= 0); hud();
  }
  /* ✕ 暫時關閉：題目留著（G.parked），按📖、點遮罩或遊戲裡按鍵時回到同一題；已答完又有彈珠就等於「去發射」 */
  const answered = () => !!((G.goBtn && document.body.contains(G.goBtn)) || U.$('#pgwQ .next-btn'));
  function hidePanel() {
    if (!G || !G.panel) return;
    if (G.item && answered() && G.credits > 0) return proceed(G.item, true);
    G.panel = false; G.parked = true; U.$('#pgw').classList.remove('panel-open'); U.$('#pgwPanel').hidden = true;
    lock(G.credits <= 0); hud();
  }
  function ask() {
    if (!G || G.panel) return;
    if (G.parked) { G.parked = false; openPanel(); hud(); } else next();
  }
  function clearItem() { if (G.ctl) { try { G.ctl.destroy(); } catch {} } G.ctl = null; G.keyBox = null; G.goBtn = null; G.item = null; }
  /* 答完／讀完：累積到 per 個就換 shots 顆彈珠 */
  function earn(counted) { if (counted) { G.pts++; while (G.pts >= G.per) { G.pts -= G.per; G.credits += G.shots; } } hud(); }
  /* 答完一題：預設接著寫下一題（彈珠一路存著，Enter 也是下一題）；要打彈珠時按「🎯 去發射」 */
  function proceed(it, shoot) {
    if (it && it.lessonEnd && !it.review) finishLesson(it.les);
    if (shoot && G.credits > 0) closePanel(); else next();
  }
  const nextLabel = () => G.mode === 'learn' ? '下一步 ▶' : '下一題 ▶';
  const shootBtn = (before) => {
    const b = U.h(`<button class="px-btn big pgw-shoot">🎯 去發射（⚪×${G.credits}）</button>`);
    b.onclick = () => { SFX.play('click'); before && before(); proceed(G.item, true); };
    return b;
  };
  function goButton(box, it, label, before) {
    const row = U.h(`<div class="row mt pgw-go"><button class="px-btn gold big">${label || nextLabel()}</button></div>`);
    box.appendChild(row); G.goBtn = row.firstElementChild; G.goBtn.onclick = () => { SFX.play('click'); before && before(); proceed(it, false); };
    if (G.credits > 0 || (before && G.pts + 1 >= G.per)) row.appendChild(shootBtn(before));
    return G.goBtn;
  }
  function next() {
    if (!G) return;
    clearItem(); G.parked = false;
    const it = G.S.next(); openPanel();
    const body = U.$('#pgwQ'); body.innerHTML = '';
    if (!it) { renderEnd(body); hud(); return; }
    G.item = it;
    const kind = it.kind === 'read' ? it.s.type : it.kind;
    const pos = G.S.pos ? G.S.pos() : '';
    U.$('#pgwHead').innerHTML = `<span class="pgw-kind">${STEP_NAME[kind] || '📖 閱讀'}${it.review ? '・複習' : ''}</span>${it.les ? `<span class="pgw-where">${U.esc(it.les.l.title)}</span>` : ''}<span class="grow"></span><span class="dim small-t">${pos}</span>`;
    if (it.kind === 'bank') renderBank(body, it); else if (it.kind === 'check') renderCheckItem(body, it); else renderRead(body, it);
    hud();
  }
  function graded(it, firstOk, ok) {
    G.graded++; if (firstOk) G.right++; if (!ok) G.wrong.push(it);
    if (!G.test) {
      if (it.kind === 'bank') { Store.record(it.q.id, ok); Store.addAccXp(ok ? 8 : 2); if (ok) Store.addGems(1); }
      else if (typeof LEARN_UI !== 'undefined') { LEARN_UI.applyPeglin({ type: 'check', id: it.c.id, ok: firstOk, first: firstOk }); if (firstOk) Store.addAccXp(4); }
      App.refreshTop();
    }
    if (it.les && !it.review) { it.les.n++; if (firstOk) it.les.ok++; }
    if (G.S.graded) G.S.graded(it, ok);
    earn(G.onWrong === 'count' || ok);
  }
  function renderBank(body, it) {
    const wrap = U.h('<div class="qwrap"></div>'); body.appendChild(wrap);
    G.ctl = QV.render(wrap, it.q, {
      mode: 'practice', nextLabel: '繼續 ▶', onNext: () => proceed(it, false),
      onAnswer: res => {
        SFX.play(res.ok ? 'correct' : 'wrong'); graded(it, !!res.ok, !!res.ok);
        const nb = wrap.querySelector('.next-btn'); if (!nb) return;
        nb.textContent = nextLabel(); if (G.credits > 0) nb.after(shootBtn());
      }
    });
  }
  function renderCheckItem(body, it) {
    const box = U.h('<div class="lc"></div>'), wrap = U.h('<div class="lp-body pgw-lp t-check"></div>');
    wrap.appendChild(box); body.appendChild(wrap); G.keyBox = box;
    LEARN_UI.renderCheck(box, it.c, { onDone: (firstOk, ok) => { G.keyBox = null; graded(it, firstOk, ok); goButton(wrap, it); } });
  }
  const arr = v => v == null || v === '' ? [] : Array.isArray(v) ? v : [v];
  const md = v => U.md(joinMd(v));
  const inl = v => U.md(joinMd(v)).replace(/^<div class="md"><p>([\s\S]*)<\/p><\/div>$/, '$1');
  const imgs = (v, src) => arr(v).map(x => `<img class="lp-img" src="${U.esc(U.img(x))}" alt="" title="點圖放大">`).join('') + (src ? `<div class="lp-src">圖片來源：${inl(src)}</div>` : '');
  const list = (cls, title, v) => arr(v).length ? `<div class="${cls}"><b>${title}</b><ul>${arr(v).map(k => `<li>${inl(k)}</li>`).join('')}</ul></div>` : '';
  /* 閱讀卡：沿用學習模式的版面元件（lp-keys、lp-exam…）；圖解與互動模擬只放圖和文字，完整互動請到學習模式 */
  function readHTML(s, l) {
    const h = t => `<h3>${U.esc(t || '')}</h3>`, note = t => `<p class="dim small-t">${t}</p>`;
    switch (s.type) {
      case 'intro': return h(s.title || l.title) + md(s.body) + list('lp-goals', '🎯 這課學完你會：', l.goals);
      case 'card': {
        const parts = joinMd(s.body).split(/^[ \t]*\[\[img\]\][ \t]*$/m), pics = imgs(s.img, s.img_source || s.source);
        return h(s.title) + (parts.length > 1 ? md(parts[0]) + pics + md(parts.slice(1).join('\n')) : pics + md(s.body)) + list('lp-keys', '📌 重點', s.keys)
          + list('lp-exam', '🎯 國考重點', s.exam) + (s.demo ? `<div class="lp-demo"><b>✏️ 示範</b>${md(s.demo)}</div>` : '') + (s.tip ? `<div class="lp-tip">🐾 ${inl(s.tip)}</div>` : '');
      }
      case 'example': return h(s.title || '範例') + `<div class="lp-prob">${md(s.problem)}</div><details class="pgw-sol"><summary>💡 看解法（${arr(s.steps).length} 步）</summary><div class="lp-steps">${arr(s.steps).map((x, i) => `<div class="lp-step"><b>${i + 1}</b><div>${md(x)}</div></div>`).join('')}${s.answer ? `<div class="lp-exans">✅ ${md(s.answer)}</div>` : ''}</div></details>`;
      case 'recap': return h('本課重點') + list('lp-keys', '📌 重點', s.points) + (arr(s.flash).length ? `<div class="pgw-flash"><b>🃏 記憶卡（點開看答案）</b>${arr(s.flash).map(f => `<details><summary>${inl(f.front)}</summary>${md(f.back)}</details>`).join('')}</div>` : '') + (s.next ? note('下一課：' + U.esc(joinMd(s.next).replace(/^下一課[：:]\s*/, ''))) : '');
      case 'diagram': return h(s.title || '看圖認構造') + md(s.body) + imgs(s.img, s.img_source || s.source) + (arr(s.points).length ? `<ol class="pgw-points">${arr(s.points).map(x => `<li><b>${U.esc(x.name || x.zh || '')}</b>${x.en ? ` <span class="dim">${U.esc(x.en)}</span>` : ''}${x.desc ? `：${inl(x.desc)}` : ''}</li>`).join('')}</ol>` : '') + note('可以點的互動圖解請到「📘 學習模式」操作。');
      case 'letters': return h(s.title || '字母') + md(s.body) + arr(s.groups).map(g => `<div class="pgw-letters"><b>${U.esc(g.name || '')}</b><div>${arr(g.items).map(x => `<span><big>${U.esc(x.ch)}</big><small>${U.esc(x.roman || '')}</small></span>`).join('')}</div></div>`).join('') + note('點字母聽發音請到「📘 學習模式」。');
      case 'interactive': return h(s.title || '互動模擬') + md(s.body) + note('互動模擬請在「📘 學習模式」操作。');
      default: return h(s.title) + md(s.body || s.problem);
    }
  }
  function renderRead(body, it) {
    const wrap = U.h(`<div class="lp-body pgw-lp t-${U.esc(it.s.type)}">${readHTML(it.s, it.les.l)}</div>`); body.appendChild(wrap);
    if (typeof GLOSS !== 'undefined' && GLOSS.scan) { try { GLOSS.scan(wrap); } catch {} }
    goButton(wrap, it, '讀完了，下一步 ▶', () => { G.reads++; earn(true); });
  }
  function renderEnd(body) {
    U.$('#pgwHead').innerHTML = '<span class="pgw-kind">🏁 這一輪完成</span>';
    body.innerHTML = `<div class="pgw-end"><h3>${G.mode === 'learn' ? '這次選的課都完成了' : '這一輪的題目答完了'}</h3>
      <p>${G.mode === 'learn' ? `完成 ${G.lessons} 課、讀了 ${G.reads} 張卡、` : ''}答了 ${G.graded} 題（一次答對 ${G.right}）・已發射 ${G.fired} 顆彈珠</p>
      <div class="row">${G.S.again ? '<button class="px-btn gold" data-end="again">再來一輪 ▶</button>' : ''}${G.credits > 0 ? `<button class="px-btn" data-end="shoot">先把剩下的 ⚪×${G.credits} 打完</button>` : ''}<button class="px-btn" data-end="exit">結束</button></div></div>`;
    U.$$('[data-end]', body).forEach(b => b.onclick = () => {
      const a = b.dataset.end;
      if (a === 'again') { if (G.S.again()) next(); else U.toast('沒有符合條件的題目了，請放寬篩選'); }
      else if (a === 'shoot') closePanel();
      else webClose();
    });
  }
  function finishLesson(les) {
    if (!les || les.done) return; les.done = true; G.lessons++;
    if (!G.test && typeof LEARN_UI !== 'undefined') { LEARN_UI.applyPeglin({ type: 'lesson', pack: les.p.id, lesson: les.l.id, n: les.n, ok: les.ok }); App.refreshTop(); }
    U.toast(`彈珠學習：完成「${les.l.title}」${les.n ? `（檢核 ${les.ok}/${les.n}）` : ''}`);
  }
  function webClose(silent) {
    if (!G) return;
    const g = G, upload = cloudOn() && g.cloudReady; clearItem(); G = null;
    document.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', popOutside, true); window.removeEventListener('blur', popBlur); popOpen = null;
    clearInterval(g.pomoTimer); clearInterval(g.cloudTimer); document.removeEventListener('visibilitychange', cloudVis);
    const el = U.$('#pgw'), f = U.$('#pgwFrame');
    if (el) { el.style.display = 'none'; el.id = 'pgwClosing'; } if (f) f.id = 'pgwFrameClosing';   // 改名：馬上再開一場時不會撞到 ID
    document.documentElement.classList.remove('pgw-open');
    // 先把最新的遊戲存檔讀出來（最多等 2.5 秒）再關掉遊戲，然後在背景上傳
    (upload && f ? requestExport(2500, f) : Promise.resolve(null)).then(snap => {
      try { f.contentWindow.postMessage({ pgw: 1, type: 'quit' }, '*'); } catch {}
      if (!U.$('#pgw')) window.removeEventListener('message', onMsg); if (el) el.remove();
      if (snap) cloudUpload(snap, g.cloudRev).catch(e => U.toast('彈珠存檔上傳失敗：' + e.message, 4000));
    });
    if (silent) return;
    if (g.graded + g.reads) {
      const wrongs = g.wrong.filter(it => it.kind === 'bank').slice(-5).reverse();
      U.modal({ title: g.mode === 'learn' ? '這次的彈珠學習' : '這次的彈珠刷題', body: `<p>${g.mode === 'learn' ? `完成 <b>${g.lessons}</b> 課・讀了 <b>${g.reads}</b> 張卡・` : ''}答了 <b>${g.graded}</b> 題・一次答對 <b>${g.right}</b>・發射 <b>${g.fired}</b> 顆彈珠</p>`
        + (g.test ? '<p class="dim small-t">（測試場次：沒有寫進紀錄）</p>' : `<p class="dim small-t">${g.mode === 'learn' ? '檢核答錯的已放進「🔁 複習」，' : ''}答錯的題目已進錯題本。</p>`)
        + (wrongs.length ? `<p class="dim">還要再練的題：</p><ul>${wrongs.map(it => `<li>${stemText(it.q)}</li>`).join('')}</ul>` : '') });
    }
    if (U.$('.peglin-page')) screen(g.mode);
  }
  /* ---------- 哥布林彈珠存檔的雲端同步（有登入雲端同步時；CLOUD.peglinGet／peglinPut，資料表另一筆 <題庫>:peglin） ----------
     本機 SKEY('peglin-cloud')＝{ at: 這台上次同步到的雲端版本時間, localAt: 當時本機存檔最新時間, rev }。
     開遊戲：雲端有別台的新版、這台沒改過 → 套用雲端；兩邊都改過 → 較晚的為準，輸的那份留一份在本機（peglin-cloud-bak）。
     上傳：玩的時候每 2 分鐘、切走分頁、按結束時，存檔有變動才上傳（存檔約數十 KB）。 */
  const PGC = () => readCfg('peglin-cloud', {});
  const savePGC = m => { try { localStorage.setItem(SKEY('peglin-cloud'), JSON.stringify(m)); } catch {} };
  const cloudOn = () => !!G && !G.test && typeof CLOUD !== 'undefined' && CLOUD.signedIn;
  const within = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('逾時')), ms))]);
  function pgBak(from, data, at) { try { localStorage.setItem(SKEY('peglin-cloud-bak'), JSON.stringify({ from, at, saved: new Date().toISOString(), data })); } catch {} }
  async function cloudHello(snap) {
    let imp = null;
    try {
      if (cloudOn()) {
        const row = await within(CLOUD.peglinGet(), 7000), m = PGC(), files = row && row.data && row.data.files;
        if (G) G.cloudRev = row ? row.rev : null;
        if (files && row.updated_at !== m.at) {
          const localChanged = !!(snap && snap.n && snap.newest > (m.localAt || 0));
          if (localChanged && snap.newest > Date.parse(row.updated_at)) { pgBak('雲端', row.data, row.updated_at); U.toast('彈珠存檔：這台比雲端新，先用這台的（雲端那份已備份在這台）', 5000); }
          else {
            if (localChanged) pgBak('這台裝置', { files: snap.files }, new Date(snap.newest).toISOString());
            imp = { files }; savePGC({ at: row.updated_at, localAt: Date.now(), rev: row.rev });
            U.toast(`已載入雲端的彈珠存檔（${row.device || '其他裝置'}）`, 4000);
          }
        }
      }
    } catch (e) { U.toast('彈珠存檔：讀取雲端失敗（' + e.message + '），先用這台的', 4000); }
    if (G) G.cloudReady = true;
    post({ type: 'start', import: imp });
  }
  let expSeq = 0; const expWait = {};
  function requestExport(ms = 4000, frame) {
    return new Promise(res => { const id = ++expSeq; expWait[id] = res; post({ type: 'export', id }, frame); setTimeout(() => { if (expWait[id]) { delete expWait[id]; res(null); } }, ms); });
  }
  async function cloudUpload(snap, rev, keepalive) {
    if (!snap || !snap.n || typeof CLOUD === 'undefined' || !CLOUD.signedIn) return;
    const m = PGC(); if (snap.newest <= (m.localAt || 0)) return;   // 存檔沒變動
    const row = await CLOUD.peglinPut({ files: snap.files, savedAt: new Date(snap.newest).toISOString() }, rev != null ? rev : m.rev, keepalive);
    if (row) { savePGC({ at: row.updated_at, localAt: snap.newest, rev: row.rev }); if (G) G.cloudRev = row.rev; }
  }
  async function cloudTick(keepalive) {
    if (!cloudOn() || !G.cloudReady || G.uploading) return;
    const g = G; g.uploading = true;
    try { await cloudUpload(await requestExport(), g.cloudRev, keepalive); } catch (e) { /* 下次再試 */ } finally { g.uploading = false; }
  }
  const cloudVis = () => { if (document.hidden) cloudTick(true); };

  /* 彈珠刷題：照自由遠征的條件排一輪題目；答錯可以稍後再出一次 */
  function quizSession(cfg, ids) {
    let q = ids.slice(), i = 0; const retried = new Set();
    return {
      mode: 'quiz', label: subjLabel(cfg.subjects), per: cfg.per, shots: cfg.shots, onWrong: cfg.onWrong, test: !!cfg.test,
      pos: () => `第 ${Math.min(i, q.length)} / ${q.length} 題`,
      next() { while (i < q.length) { const x = Store.Q[q[i++]]; if (x) return { kind: 'bank', q: x }; } return null; },
      graded(it, ok) { if (!ok && cfg.retryWrong && !retried.has(it.q.id)) { retried.add(it.q.id); q.splice(Math.min(q.length, i + 3), 0, it.q.id); } },
      again() { q = quizIds(cfg, roundSize(cfg)); i = 0; retried.clear(); return q.length > 0; }
    };
  }
  /* 彈珠學習：依課程順序走每一步（閱讀卡、檢核、題庫實戰），上完再輪流複習這幾課的題目 */
  function learnItems(list) {
    const out = [];
    list.forEach(({ p, l }) => {
      const les = { p, l, n: 0, ok: 0 }, start = out.length, add = it => out.push(Object.assign(it, { les }));
      l.steps.forEach(s => {
        if (s.type === 'check') add({ kind: 'check', c: s });
        else if (s.type === 'practice') {
          const qs = (s.qids || []).map(id => Store.Q[id]).filter(q => q && !FOLLOW_RE.test(q.stem || ''));
          if (s.pick) pickBank(s.pick, s.pick.n || 2, p.subject).forEach(q => { if (!qs.includes(q)) qs.push(q); });
          qs.forEach(q => add({ kind: 'bank', q }));
          (s.checks || []).forEach(c => add({ kind: 'check', c }));
        } else add({ kind: 'read', s });
      });
      if (out.length > start) out[out.length - 1].lessonEnd = true;
    });
    return out;
  }
  function learnSession(lcfg, list) {
    const items = learnItems(list); let i = 0, rev = null, ri = 0;
    return {
      mode: 'learn', label: lessonLabel(list), per: lcfg.per, shots: lcfg.shots, onWrong: lcfg.onWrong, test: !!lcfg.test,
      pos: () => rev ? '複習' : `第 ${Math.min(i, items.length)} / ${items.length} 步`,
      next() {
        if (i < items.length) return items[i++];
        if (!rev) {
          rev = items.filter(x => x.kind === 'bank' || (x.kind === 'check' && !CTX_RE.test(joinMd(x.c.q)))); ri = 0;
          if (rev.length) U.toast('選的課都上完了，接著複習這幾課的題目');
        }
        if (!rev.length) return null;
        if (ri >= rev.length) { rev = U.shuffle(rev); ri = 0; }
        return Object.assign({}, rev[ri++], { review: true, lessonEnd: false });
      }
    };
  }

  /* ---------- 畫面 ---------- */
  const readCfg = (k, d) => { try { return Object.assign(d, JSON.parse(localStorage.getItem(SKEY(k)) || '{}')); } catch { return d; } };
  /* 彈珠刷題／彈珠學習都要先登入雲端同步（遊戲存檔與作答紀錄要跟著帳號走） */
  function loginGate(mode) {
    U.$('#topTitle').textContent = mode === 'learn' ? '彈珠學習' : '彈珠刷題';
    const root = U.$('#screen');
    root.innerHTML = `<div class="peglin-page"><section class="panel peglin-gate peglin-login" id="pgLogin">
      <h3>🔒 請先登入</h3>
      <p>彈珠刷題與彈珠學習要先用信箱登入雲端同步，才能使用。登入後遊戲存檔與作答紀錄會跟著帳號走，換手機、平板也能接著玩。</p>
      <div class="row mt" style="flex-wrap:wrap;gap:10px"><button class="px-btn gold" id="pgLoginBtn">☁ 登入雲端同步</button><button class="px-btn" data-pggo="hub">🏕 回到營地</button></div>
      <p class="dim small-t">${typeof CLOUD !== 'undefined' && CLOUD.cfg() ? '' : '這個網址還沒設定雲端專案，請先在登入視窗貼上設定（見 docs/雲端同步設定.md）。'}</p></section></div>`;
    U.$$('[data-pggo]', root).forEach(b => b.onclick = () => App.go(b.dataset.pggo));
    U.$('#pgLoginBtn').onclick = () => { SFX.play('click'); if (typeof CLOUD !== 'undefined') CLOUD.open(); };
    const t = setInterval(() => {
      if (!document.body.contains(U.$('#pgLogin'))) { clearInterval(t); return; }
      if (typeof CLOUD !== 'undefined' && CLOUD.signedIn) { clearInterval(t); U.clearModals(); screen(mode); }
    }, 700);
  }
  function screen(mode) {
    mode = mode === 'learn' ? 'learn' : (mode || readCfg('peglin-mode', { m: 'quiz' }).m);
    if (!(typeof CLOUD !== 'undefined' && CLOUD.signedIn)) return loginGate(mode);
    if (autoProbe() || bridge) startSync();
    localStorage.setItem(SKEY('peglin-mode'), JSON.stringify({ m: mode }));
    U.$('#topTitle').textContent = mode === 'learn' ? '彈珠學習' : '彈珠刷題';
    const root = U.$('#screen'), learn = mode === 'learn';
    root.innerHTML = `<div class="peglin-page">
      <section class="peglin-hero panel"><div><span class="peglin-eyebrow">PEGLIN × ${learn ? '你的課程' : '你的題庫'}</span>
        <div class="peglin-modes" role="tablist"><button class="px-btn ${!learn ? 'gold' : ''}" data-mode="quiz" role="tab" aria-selected="${!learn}">⚪ 彈珠刷題</button><button class="px-btn ${learn ? 'gold' : ''}" data-mode="learn" role="tab" aria-selected="${learn}">📘 彈珠學習</button></div>
        <h1>${learn ? '讀一張卡，<br>打一顆球。' : '先想清楚，<br>再打出漂亮的一球。'}</h1>
        <p>${learn ? '在這個頁面直接開哥布林打彈珠（網頁版，手機、平板、電腦都能玩）：每讀完一張概念卡或做完一題檢核，就換到彈珠可以發射。整課讀完會記成完成，檢核錯題進複習盒。' : '在這個頁面直接開哥布林打彈珠（網頁版，手機、平板、電腦都能玩）：答題換彈珠，彈珠用完遊戲會先暫停，答下一題再繼續。題目範圍和自由遠征一樣挑。'}</p>
        <div class="peglin-steps">${(learn ? ['① 選課程與彈珠數', '② 讀卡／檢核換彈珠', '③ 瞄準發射'] : ['① 選範圍與彈珠數', '② 答題換彈珠', '③ 瞄準發射']).map(x => `<span>${x}</span>`).join('')}</div></div>
        <div class="peglin-orbit" aria-hidden="true"><i class="peglin-orb"></i>${Array.from({ length: 18 }, (_, i) => `<b style="--x:${12 + (i % 5) * 18}%;--y:${25 + Math.floor(i / 5) * 18}%" class="${i === 7 ? 'critical' : i === 13 ? 'refresh' : ''}"></b>`).join('')}<span>${learn ? '一卡・一球' : '一題・一球'}</span></div></section>
      <div id="pgGate" class="panel peglin-gate" hidden></div>
      <div class="peglin-layout"><section class="panel peglin-setup" id="pgSetup"></section>
      <aside class="panel peglin-side"><h2>你的學習營地</h2><p>作答直接記進這個網頁的進度：答錯進錯題本、學習檢核錯題進複習盒；開了雲端同步的話，其他裝置也看得到。</p>
        <p id="pgWebState" class="peglin-sync" role="status">🌐 正在檢查網頁版遊戲…</p><div id="pgReport" class="peglin-report"></div>
        <div class="col">${[['learn', '📘 學習模式'], ['bank', '📚 題庫・錯題本'], ['settings', '💾 設定與存檔'], ['hub', '🏕 回到營地']].map(([go, t]) => `<button class="px-btn" data-pggo="${go}">${t}</button>`).join('')}</div>
        <details class="peglin-local" id="pgLocal"><summary>🖥 本機版 PeglinQuiz（需要啟動器）</summary>
          <p id="peglinSync" class="peglin-sync" role="status">${autoProbe() ? '正在尋找本機彈珠服務…' : '在這個網址不會自動偵測本機啟動器（避免瀏覽器詢問「存取本機網路」）。'}</p>
          <div class="col"><button class="px-btn" id="pgDetect">偵測本機啟動器</button><button class="px-btn" id="pgBackup" hidden>立即備份到題庫資料夾</button><button class="px-btn" id="pgRestore" hidden>從題庫資料夾讀回進度</button></div>
          <p class="dim small-t" id="pgWhere"></p></details>
        <details class="peglin-local"><summary>⚙ 網頁版遊戲網址</summary><p class="dim small-t">預設是 peglinnnnnnn 的 GitHub Pages。只接受自己的 github.io 或本機測試伺服器。</p>
          <input class="px-in" id="pgWebBase" value="${U.esc(webBase())}" spellcheck="false" autocomplete="off"><div class="row mt"><button class="px-btn small" id="pgWebSave">儲存並重新檢查</button><button class="px-btn small" id="pgWebReset">恢復預設</button></div></details></aside></div></div>`;
    U.$$('[data-mode]', root).forEach(b => b.onclick = () => screen(b.dataset.mode));
    U.$$('[data-pggo]', root).forEach(b => b.onclick = () => App.go(b.dataset.pggo));
    const ctx = { setStatus: t => { const el = U.$('#pgStatusText'); if (el) el.textContent = t; } };
    U.$('#pgBackup').onclick = async () => { try { const d = await backup(); ctx.setStatus('已備份：' + d.path); } catch (e) { ctx.setStatus(e.message); } };
    U.$('#pgRestore').onclick = async () => {
      try {
        const d = await api('backup?project=' + encodeURIComponent((QB.meta || {}).id));
        if (!d.profile) { ctx.setStatus('題庫資料夾裡還沒有這個題庫的備份。'); return; }
        if (!(await U.confirm('從題庫資料夾讀回進度', `會用 ${new Date(d.at).toLocaleString('zh-TW')} 的備份取代這個網頁目前的進度（錯題本、學習進度、統計）。確定嗎？`))) return;
        Store.importAll(JSON.stringify(d)); location.reload();
      } catch (e) { ctx.setStatus(e.message); }
    };
    U.$('#pgDetect').onclick = () => { startSync(); gate(true); };
    const saveBase = v => { const c = readCfg('peglin-web', {}); c.base = v; localStorage.setItem(SKEY('peglin-web'), JSON.stringify(c)); webProbe = null; };
    U.$('#pgWebSave').onclick = () => {
      let v = U.$('#pgWebBase').value.trim(); if (v && !v.endsWith('/')) v += '/';
      if (v && !WEB_ALLOW.test(v)) { U.toast('只接受 https://yc0935019269cloud-create.github.io/… 或本機 localhost'); return; }
      saveBase(v === WEB_DEFAULT ? '' : v); U.$('#pgWebBase').value = webBase(); gate();
    };
    U.$('#pgWebReset').onclick = () => { saveBase(''); U.$('#pgWebBase').value = webBase(); gate(); };
    (learn ? learnSetup : quizSetup)(U.$('#pgSetup'), ctx);
    gate();
  }
  /* 網頁版可不可以用、本機版有沒有連上；兩個都沒有才顯示原本的說明 */
  async function gate(probeLocal) {
    const [web, b] = await Promise.all([probeWeb(), probeLocal || autoProbe() ? detect(true) : Promise.resolve(bridge)]);
    const g = U.$('#pgGate'); if (!g) return;
    const ws = U.$('#pgWebState');
    ws.textContent = web.ok ? '🌐 網頁版可用：直接在這個頁面開遊戲，手機、平板、電腦都能玩（需要網路）。' : '🌐 網頁版目前不能用：' + web.msg;
    ws.classList.toggle('bad', !web.ok);
    U.$$('#pgWeb').forEach(x => x.disabled = !web.ok);
    U.$$('#pgLocalRow').forEach(x => x.hidden = !b);
    U.$$('#pgBackup, #pgRestore').forEach(x => x.hidden = !b);
    U.$$('#pgLaunch, #pgApply, #pgBackup, #pgRestore').forEach(x => x.disabled = !b);
    if (b) {
      const w = U.$('#pgWhere'); if (w) w.textContent = `遊戲本體：${b.root}Peglin・紀錄：${b.dataDir}・題庫取自目前這個網頁（${location.host || '本機檔案'}）。`;
      sync();
    } else if (probeLocal || autoProbe()) { const st = U.$('#peglinSync'); if (st) st.textContent = '本機版未連線（不影響網頁版）：' + NO_BRIDGE; }
    g.hidden = web.ok || !!b;
    if (!g.hidden) {
      g.innerHTML = `<h3>這台電腦目前沒辦法開彈珠</h3><p>${U.esc(web.msg)}</p><p>${NO_BRIDGE}</p><p class="dim small-t">其他模式（學習、遠征、題庫…）都能照常使用。若是在 GitHub Page 開啟本機版，瀏覽器可能會詢問是否允許「存取本機網路裝置」，請選允許。</p><button class="px-btn" id="pgRetry">重新偵測</button>`;
      U.$('#pgRetry').onclick = () => { webProbe = null; gate(true); };
    }
  }
  async function launchWith(make, ctx, launch) {
    const buttons = U.$$('#pgLaunch, #pgApply'); buttons.forEach(b => b.disabled = true);
    const st = U.$('#pgStatusText');
    try {
      st.textContent = '正在準備…'; const s = await make(st); const r = await api('session', s);
      localStorage.setItem(SKEY('peglin-session'), JSON.stringify({ id: s.id, mode: s.mode, label: s.label, count: s.questions.length, at: s.created }));
      if (launch) await api('launch', {});
      const unit = s.mode === 'learn' ? '步' : '題';
      st.textContent = (launch ? `已套用「${s.label}」${s.questions.length} ${unit}，本機 Peglin 啟動中；選「新的遊戲／繼續」，戰鬥時就會出現。` : `已套用「${s.label}」${s.questions.length} ${unit}，本機版下次瞄準時換成這份。`) + (r.imagesFromDisk ? `（${r.imagesFromDisk} 張圖由本機題庫資料夾補上）` : '');
    } catch (e) { st.textContent = e.message; } finally { buttons.forEach(b => b.disabled = false); if (!bridge) gate(); }
  }
  const actionHtml = (label, note) => `<div class="peglin-action"><b id="pgPool"></b><span id="pgStatusText" role="status"></span>
    <div class="row"><button class="px-btn gold big" id="pgWeb" disabled>${label} ▶</button></div><p class="dim small-t">${note}</p>
    <div id="pgLocalRow" class="peglin-local-row" hidden><b>🖥 本機版 PeglinQuiz</b><div class="peglin-fields">${penaltyHtml}</div>
      <div class="row"><button class="px-btn" id="pgLaunch">用本機 Peglin 啟動</button><button class="px-btn" id="pgApply">只套用到本機版</button></div></div></div>`;
  const penaltyHtml = `<label>答錯扣血<select class="px-in" id="pgPenalty"><option value="0">不扣血・專心練習</option><option value="3">3 HP・輕鬆</option><option value="5">5 HP・標準</option><option value="10">10 HP・挑戰</option></select></label>
      <label>答對獎勵<select class="px-in" id="pgReward"><option value="normal">標準・答對傷害 ×1.2 起，連對加成</option><option value="strong">強力・答對傷害 ×1.3 起，連對加成</option><option value="off">關閉・純原版手感</option></select></label>`;
  /* 一次可以發射幾顆：每答（完成）per 個，可以發射 shots 顆 */
  const shotsHtml = (c, learn) => {
    const opt = (list, cur, unit) => list.map(n => `<option value="${n}" ${Number(cur) === n ? 'selected' : ''}>${n} ${unit}</option>`).join('');
    return `<div class="pg-shots"><span>每${learn ? '完成' : '答'}</span><select class="px-in" id="pgPer" aria-label="${learn ? '每完成幾步' : '每答幾題'}">${opt([1, 2, 3, 5], c.per, learn ? '步' : '題')}</select>
      <span>可以發射</span><select class="px-in" id="pgShots" aria-label="可以發射幾顆彈珠">${opt([1, 2, 3, 4, 5, 10], c.shots, '顆')}</select>
      <select class="px-in" id="pgOnWrong" aria-label="答錯時"><option value="count" ${c.onWrong !== 'none' ? 'selected' : ''}>答錯也算數</option><option value="none" ${c.onWrong === 'none' ? 'selected' : ''}>答對才算數</option></select></div>
      <p class="dim small-t">${learn ? '讀完一張卡或做完一題檢核都算一步。' : ''}彈珠用完時遊戲會被蓋住（包括地圖、商店畫面），點一下就出下一${learn ? '步' : '題'}；也可以隨時按「📖」先答題存彈珠。</p>`;
  };
  function bindShots(c, save) {
    U.$('#pgPer').onchange = e => { c.per = Number(e.target.value); save(); };
    U.$('#pgShots').onchange = e => { c.shots = Number(e.target.value); save(); };
    U.$('#pgOnWrong').onchange = e => { c.onWrong = e.target.value; save(); };
  }

  /* ---------- 分類整理（彈珠學習的課程樹）：單元編號、名稱清理 ---------- */
  const CN = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  const cnNum = s => s.length === 1 ? CN[s] : s.length === 2 && s[0] === '十' ? 10 + CN[s[1]] : s.length === 2 && s[1] === '十' ? CN[s[0]] * 10 : CN[s[0]] * 10 + CN[s[2]];
  /* 「第10單元 眼角膜分層構造」→ { no: 10, tag: 'U10', name: '眼角膜分層構造' }；第99單元（中英名詞）排最後 */
  function unitInfo(raw) {
    const s = String(raw || '').trim();
    let m = s.match(/^第\s*(\d+)(?:\s*[-–]\s*(\d+))?\s*單元\s*/);
    if (m) return { no: +m[1], tag: 'U' + m[1].replace(/^0+/, '') + (m[2] ? '–' + m[2].replace(/^0+/, '') : ''), name: s.slice(m[0].length) || s };
    m = s.match(/^第([一二三四五六七八九十]+)單元\s*/);
    if (m) return { no: cnNum(m[1]) || 50, tag: 'U' + (cnNum(m[1]) || ''), name: s.slice(m[0].length) || s };
    m = s.match(/^【[^】]*】\s*U(\d+)(?:-(\d+))?\s*/i) || s.match(/^U(\d+)(?:-(\d+))?\s*/i);
    if (m) return { no: +m[1] + (m[2] ? m[2] / 10 : 0), tag: 'U' + m[1] + (m[2] ? '-' + m[2] : ''), name: s.slice(m[0].length) || s };
    return { no: 500, tag: '', name: s };
  }
  const subjectChips = (list, cur, count) => `<div class="pg-subjects" role="group" aria-label="科目">${list.map(s => `<button type="button" class="pg-subj ${cur === s ? 'on' : ''}" data-subj="${U.esc(s)}"><b>${U.esc(C.SUBJECTS[s].name)}</b><small>${count(s)}</small></button>`).join('')}</div>`;

  /* 彈珠刷題：範圍選擇與自由遠征相同（Screens.setPicker 的題本樹＋同一組條件），再加彈珠設定 */
  function quizSetup(box, ctx) {
    const ids = Object.keys(C.SUBJECTS);
    const cfg = readCfg('peglin-config', { subjects: ids.slice(), exams: [], years: [], types: ['single', 'multi', 'fill'], starOnly: false, status: 'all', pref: 'smart', patFirst: false, count: '20', per: 1, shots: 1, onWrong: 'count', retryWrong: true, wrongPenalty: 5, reward: 'normal' });
    cfg.subjects = (cfg.subjects || []).filter(s => ids.includes(s)); if (!cfg.subjects.length) cfg.subjects = ids.slice();
    cfg.exams = (cfg.exams || []).filter(id => Store.EX[id]); cfg.years = cfg.years || [];
    cfg.count = String(cfg.count || 20); if (!STATUS.some(([v]) => v === cfg.status)) cfg.status = 'all';
    if (!PREF.some(([v]) => v === cfg.pref)) cfg.pref = 'smart';
    if (cfg.starOnly === true) cfg.starOnly = 'related';
    const chips = (list, sel) => list.map(([v, l]) => `<span class="chip ${sel.includes(v) ? 'on' : ''}" data-v="${v}">${l}</span>`).join('');
    const patSubs = (() => { const P = window.QB.patterns || {}, s = new Set(); for (const id in P) { const q = Store.Q[id]; if (q) s.add(Store.EX[q.exam].subj); } return [...s].map(x => (C.SUBJECTS[x] || {}).name || x); })();
    const starN = typeof LEARN_UI !== 'undefined' && LEARN_UI.starredTermCount ? LEARN_UI.starredTermCount() : 0;
    box.innerHTML = `<h2>準備這次的題目</h2>
      <p class="dim small-t">範圍的挑法和「自由遠征」一樣。</p>
      <div class="filters peglin-filters">
        <div class="frow"><label>科目</label><span id="pgSj">${chips(ids.map(s => [s, C.SUBJECTS[s].name]), cfg.subjects)}</span></div>
        <div class="frow"><label>題本</label><span id="pgSets"></span></div>
        <div class="frow"><label>題型</label><span id="pgTypes">${chips(TYPES, cfg.types)}</span></div>
        <div class="frow"><label>星號</label><span id="pgStar">${chips([['exact', '★ 只刷星號部位本身'], ['related', '★ 星號部位＋相關題']], [cfg.starOnly])}</span><span class="small-t dim" style="margin-left:6px">學習模式已加星號 ${starN} 個部位</span></div>
        <div class="frow"><label>出題</label><span id="pgPref">${chips(PREF, [cfg.pref])}</span></div>
        <div class="frow"><label>同類題</label><span id="pgPat"><span class="chip ${cfg.patFirst ? 'on' : ''}" role="switch" aria-checked="${!!cfg.patFirst}">🧩 未刷過題型優先</span></span><span class="small-t dim">${patSubs.length ? `同一題型刷過一題，其他同型題往後排；目前已分類：${U.esc(patSubs.join('、'))}` : '目前還沒有分類好的題型'}</span></div>
        <div class="frow"><label>狀態</label><span id="pgStatus">${chips(STATUS, [cfg.status])}</span></div>
        <div class="frow"><label>題數</label><span id="pgCount">${chips(COUNTS, [cfg.count])}</span><input class="px-in" id="pgCountN" type="number" min="1" max="999" placeholder="自訂" style="width:90px" value="${COUNTS.some(([v]) => v === cfg.count) ? '' : U.esc(cfg.count)}"></div>
      </div>
      <p id="pgCnt" class="gold-t"></p>
      <div class="pg-step-box"><h3>⚪ 彈珠</h3>${shotsHtml(cfg, false)}
        <label class="pg-check-l"><input type="checkbox" id="pgRetryWrong" ${cfg.retryWrong ? 'checked' : ''}> 答錯的題稍後再出一次</label></div>
      ${actionHtml('開始彈珠刷題', '會在這個頁面打開哥布林打彈珠（第一次載入約 30 MB，之後瀏覽器會快取）。一題答完就能發射；彈珠用完、遊戲會先暫停等你答題。一輪題目答完可以再來一輪。')}
      <button class="px-btn mt" id="pgPreview">先試答一題（不計紀錄）</button>`;
    U.$('#pgPenalty').value = cfg.wrongPenalty; U.$('#pgReward').value = cfg.reward;
    const save = () => localStorage.setItem(SKEY('peglin-config'), JSON.stringify(cfg));
    const update = () => {
      const list = pool(cfg), n = list.length, cnt = U.$('#pgCnt');
      // 和自由遠征同一行：已刷／未刷題數、題型已刷／未刷（Screens.scopeLine）
      cnt.innerHTML = `符合條件：${n.toLocaleString()} 題（每輪出 ${Math.min(n, roundSize(cfg))} 題）${Screens.scopeLine ? Screens.scopeLine(list) : ''}`;
      U.$('#pgPool').textContent = `${n.toLocaleString()} 題可用・每輪 ${Math.min(n, roundSize(cfg))} 題`;
      // 題池是 0、但選的題本其實有別的題型：提示並一鍵勾選（和自由遠征一樣）
      if (!n) {
        const all = Store.filter({ subjects: cfg.subjects, exams: cfg.exams, years: cfg.years, starOnly: cfg.starOnly, status: cfg.status });
        const miss = TYPES.filter(([t]) => !cfg.types.includes(t) && all.some(q => q.type === t));
        if (miss.length) {
          const names = miss.map(([, x]) => `「${x}」`).join('、'), b = U.h(`<button class="px-btn small gold" style="margin-left:6px">勾選${names}</button>`);
          cnt.appendChild(U.h(`<span class="small-t" style="display:block;color:var(--text)">這些題本的題目是${names}題，題型要勾選才會出題。</span>`)); cnt.lastChild.appendChild(b);
          b.onclick = () => { miss.forEach(([t]) => { cfg.types.push(t); const c = U.$(`#pgTypes .chip[data-v="${t}"]`); if (c) c.classList.add('on'); }); SFX.play('click'); update(); };
        }
      }
      save();
    };
    const drawSets = Screens.setPicker(U.$('#pgSets'), cfg, update);
    const bind = (sel, key, multi, after) => U.$$(sel + ' .chip', box).forEach(c => c.onclick = () => {
      const v = c.dataset.v;
      if (multi) { const a = cfg[key], i = a.indexOf(v); i >= 0 ? a.splice(i, 1) : a.push(v); c.classList.toggle('on'); }
      else { cfg[key] = v; U.$$(sel + ' .chip', box).forEach(x => x.classList.toggle('on', x === c)); }
      SFX.play('click'); after && after(); update();
    });
    bind('#pgSj', 'subjects', true, () => drawSets());
    bind('#pgTypes', 'types', true);
    bind('#pgPref', 'pref', false);
    bind('#pgStatus', 'status', false);
    bind('#pgCount', 'count', false, () => { U.$('#pgCountN').value = ''; });
    U.$$('#pgStar .chip', box).forEach(c => c.onclick = () => {
      cfg.starOnly = cfg.starOnly === c.dataset.v ? false : c.dataset.v;   // 兩個互斥，再按一次關掉
      U.$$('#pgStar .chip', box).forEach(x => x.classList.toggle('on', x.dataset.v === cfg.starOnly)); SFX.play('click'); update();
      if (cfg.starOnly && !(typeof LEARN_UI !== 'undefined' && LEARN_UI.starredQids().size)) U.toast('還沒有加星號的部位：到學習模式的圖解點名稱旁的 ☆ 加星號', 4000);
    });
    const pat = U.$('#pgPat .chip'); pat.onclick = () => { cfg.patFirst = !cfg.patFirst; pat.classList.toggle('on', cfg.patFirst); pat.setAttribute('aria-checked', String(cfg.patFirst)); SFX.play('click'); save(); };
    U.$('#pgCountN').oninput = e => { if (e.target.value) { cfg.count = String(U.clamp(Number(e.target.value), 1, 999)); U.$$('#pgCount .chip', box).forEach(c => c.classList.remove('on')); update(); } };
    bindShots(cfg, save);
    U.$('#pgRetryWrong').onchange = e => { cfg.retryWrong = e.target.checked; save(); };
    U.$('#pgPenalty').onchange = e => { cfg.wrongPenalty = Number(e.target.value); save(); };
    U.$('#pgReward').onchange = e => { cfg.reward = e.target.value; save(); };
    const check = () => { if (!cfg.subjects.length || !cfg.types.length) { U.toast('科目、題型至少各選一項'); return false; } return true; };
    U.$('#pgWeb').onclick = () => {
      if (!check()) return;
      const list = quizIds(cfg, roundSize(cfg)); if (!list.length) { U.toast('沒有符合條件的題目，請放寬篩選'); return; }
      webOpen(quizSession(cfg, list));
    };
    U.$('#pgLaunch').onclick = () => check() && launchWith(st => exportSession(cfg, st), ctx, true);
    U.$('#pgApply').onclick = () => check() && launchWith(st => exportSession(cfg, st), ctx, false);
    U.$('#pgPreview').onclick = () => {
      const q = queue(cfg)[0]; if (!q) { U.toast('目前沒有可用的題目'); return; }
      const m = U.modal({ title: '試答（不計入紀錄）', body: document.createElement('div') });
      QV.render(m.body, q, { onNext: () => m.close(), nextLabel: '回到準備頁' });
    };
    update();
  }

  /* 課程：科目 → 學期／課程 → 單元（可能有多個課程包）→ 課 */
  function packTree(packs, subj) {
    const secs = new Map();
    packs.filter(p => p.subject === subj).forEach(p => {
      const path = p.path || [], sec = path.length >= 2 ? path[0] : '課程';
      const u = unitInfo(path.length >= 3 ? path[path.length - 1] : p.unit || p.title);
      // 中間層（例如「眼球自主神經系統」「角膜」）當小標；「114 學年度」與科目名稱這類重複資訊略過
      const group = path.slice(1, -1).filter(x => !/學年度|年國考/.test(x) && x !== (C.SUBJECTS[subj] || {}).name).join('・');
      if (!secs.has(sec)) secs.set(sec, new Map());
      const units = secs.get(sec), key = group + '|' + u.tag + u.name;
      if (!units.has(key)) units.set(key, { ...u, group, ord: p.order ?? 99, key: sec + '|' + key, packs: [] });
      const unit = units.get(key); unit.packs.push(p); unit.ord = Math.min(unit.ord, p.order ?? 99);
    });
    const unitSort = (a, b) => a.group.localeCompare(b.group, 'zh-Hant') || a.no - b.no || a.ord - b.ord || a.name.localeCompare(b.name, 'zh-Hant');
    return [...secs.entries()].map(([name, units]) => ({ name, units: [...units.values()].sort(unitSort).map(u => ({ ...u, packs: u.packs.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title, 'zh-Hant', { numeric: true })) })) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
  }
  function learnSetup(box, ctx) {
    const packs = (typeof LEARN_UI !== 'undefined' && LEARN_UI.packs) || [];
    if (!packs.length) { box.innerHTML = '<h2>選課帶進遊戲</h2><p>目前沒有學習單元。先到「📥 導入素材」或在 content/learn/ 放入課程。</p>'; return; }
    const subs = Object.keys(C.SUBJECTS).filter(s => packs.some(p => p.subject === s));
    const lcfg = readCfg('peglin-learn', { subject: subs[0], sel: [], per: 1, shots: 1, onWrong: 'count', wrongPenalty: 0, reward: 'normal' });
    if (!subs.includes(lcfg.subject)) lcfg.subject = subs[0];
    if (!Array.isArray(lcfg.sel)) lcfg.sel = lcfg.pack && lcfg.lesson ? [lcfg.pack + '/' + lcfg.lesson] : [];
    const valid = new Set(packs.flatMap(p => p.lessons.map(l => p.id + '/' + l.id)));
    lcfg.sel = lcfg.sel.filter(k => valid.has(k));
    const les = () => { try { return JSON.parse(localStorage.getItem(SKEY('learn')) || '{}').les || {}; } catch { return {}; } };
    const key = (p, l) => p.id + '/' + l.id;
    const isDone = (L, p, l) => !!(L[key(p, l)] || {}).done;
    const stars = (L, p, l) => (L[key(p, l)] || {}).best || 0;
    const subjOfSel = s => packs.filter(p => p.subject === s).reduce((a, p) => a + p.lessons.filter(l => lcfg.sel.includes(key(p, l))).length, 0);
    const lessonCount = s => { const L = les(); let d = 0, t = 0; packs.filter(p => p.subject === s).forEach(p => p.lessons.forEach(l => { t++; if (isDone(L, p, l)) d++; })); const n = subjOfSel(s); return `${d} / ${t} 課${n ? `・已選 ${n}` : ''}`; };
    let openUnit = '';
    box.innerHTML = `<h2>選課帶進遊戲</h2>
      <div class="pg-step"><span class="pg-step-no">1</span><div><h3>科目</h3><div id="plSubjects"></div></div></div>
      <div class="pg-step"><span class="pg-step-no">2</span><div><h3>點選要上的課 <small>點一下加入、再點一下取消；可以跨單元多選，會依課程順序上</small><button type="button" class="px-btn small" id="plNext">＋ 加入下一課</button></h3><div id="plTree" class="pg-tree"></div></div></div>
      <div class="pg-step"><span class="pg-step-no">3</span><div><h3>這次的課表 <small>依課程順序</small><button type="button" class="px-btn small" id="plClear">清除</button></h3><div id="plPreview" class="peglin-lesson-preview"></div></div></div>
      <div class="pg-step"><span class="pg-step-no">4</span><div><h3>⚪ 彈珠</h3>${shotsHtml(lcfg, true)}</div></div>
      ${actionHtml('開始彈珠學習', '會在這個頁面打開哥布林打彈珠：讀一張卡（導入、概念、範例、回顧）或做一題檢核就能發射。檢核答錯先給提示再試一次；每課讀完會記成「完成」並給星等，選的課上完後接著複習這幾課的題目。可以點的圖解與互動模擬仍請在「📘 學習模式」操作。')}`;
    U.$('#pgPenalty').value = lcfg.wrongPenalty; U.$('#pgReward').value = lcfg.reward;
    const save = () => localStorage.setItem(SKEY('peglin-learn'), JSON.stringify(lcfg));
    const toggle = k => { const i = lcfg.sel.indexOf(k); i >= 0 ? lcfg.sel.splice(i, 1) : lcfg.sel.push(k); };
    function drawSubjects() {
      U.$('#plSubjects').innerHTML = subjectChips(subs, lcfg.subject, lessonCount);
      U.$$('#plSubjects [data-subj]').forEach(b => b.onclick = () => { lcfg.subject = b.dataset.subj; openUnit = ''; drawAll(); });
    }
    function drawTree() {
      const tree = packTree(packs, lcfg.subject), L = les(), sel = new Set(lcfg.sel);
      if (!openUnit) { const u = tree.flatMap(s => s.units).find(u => u.packs.some(p => p.lessons.some(l => sel.has(key(p, l))))); if (u) openUnit = u.key; }
      U.$('#plTree').innerHTML = tree.map(sec => `<div class="pg-sec-static"><div class="pg-sec-title"><b>${U.esc(sec.name)}</b><small>${sec.units.length} 單元</small></div>
        ${sec.units.map((u, ui) => {
          const sub = u.group && u.group !== (sec.units[ui - 1] || {}).group ? `<div class="pg-subgroup">${U.esc(u.group)}</div>` : '';
          const all = u.packs.flatMap(p => p.lessons.map(l => ({ p, l, k: key(p, l) })));
          const d = all.filter(x => isDone(L, x.p, x.l)).length, pct = all.length ? Math.round(d * 100 / all.length) : 0;
          const picked = all.filter(x => sel.has(x.k)).length, everyOn = picked === all.length;
          const isOpen = openUnit === u.key;
          return `${sub}<div class="pg-unit ${isOpen ? 'open' : ''} ${picked ? 'sel' : ''}"><button type="button" class="pg-unit-head" data-unit="${U.esc(u.key)}" aria-expanded="${isOpen}">${u.tag ? `<span class="pg-tag">${U.esc(u.tag)}</span>` : ''}<b>${U.esc(u.name)}</b>${picked ? `<em class="pg-picked">已選 ${picked}</em>` : ''}<span class="pg-prog" title="完成 ${d} / ${all.length} 課"><i style="width:${pct}%"></i></span><small>${d} / ${all.length} 課</small><span class="pg-caret">${isOpen ? '▾' : '▸'}</span></button>
            ${isOpen ? `<div class="pg-lessons"><div class="pg-unit-tools"><button type="button" class="px-btn small" data-unitall="${all.map(x => x.k).join(',')}">${everyOn ? '取消整個單元' : '全選本單元'}</button>${d < all.length ? `<button type="button" class="px-btn small" data-unitall="${all.filter(x => !isDone(L, x.p, x.l)).map(x => x.k).join(',')}" data-only>只選還沒上的</button>` : ''}</div>
              ${u.packs.map(p => `${u.packs.length > 1 ? `<div class="pg-pack-title">${U.esc(p.title)}</div>` : ''}${p.lessons.map((l, i) => {
                const k = key(p, l), on = sel.has(k), ok = isDone(L, p, l), st = stars(L, p, l);
                return `<button type="button" class="pg-lesson ${on ? 'on' : ''} ${ok ? 'done' : ''}" data-k="${U.esc(k)}" aria-pressed="${on}"><i class="pg-check ${on ? 'on' : ''}"></i><span class="pg-lno">${ok ? '✓' : i + 1}</span><span class="pg-ltitle">${U.esc(l.title)}</span><small>${st ? '★'.repeat(st) : `${l.steps.length} 步`}</small></button>`;
              }).join('')}`).join('')}</div>` : ''}</div>`;
        }).join('')}</div>`).join('');
      U.$$('#plTree [data-unit]').forEach(b => b.onclick = () => { openUnit = openUnit === b.dataset.unit ? '' : b.dataset.unit; drawTree(); });
      U.$$('#plTree [data-k]').forEach(b => b.onclick = () => { toggle(b.dataset.k); if (window.SFX) SFX.play('click'); drawAll(); });
      U.$$('#plTree [data-unitall]').forEach(b => b.onclick = () => {
        const ks = b.dataset.unitall.split(',').filter(Boolean), unitKeys = (b.parentElement.querySelector('[data-unitall]:not([data-only])') || b).dataset.unitall.split(',');
        if (b.hasAttribute('data-only')) lcfg.sel = lcfg.sel.filter(k => !unitKeys.includes(k)).concat(ks);
        else if (ks.every(k => lcfg.sel.includes(k))) lcfg.sel = lcfg.sel.filter(k => !ks.includes(k));
        else lcfg.sel = [...new Set(lcfg.sel.concat(ks))];
        if (window.SFX) SFX.play('click'); drawAll();
      });
    }
    function preview() {
      save();
      const list = selectedLessons(lcfg), L = les();
      if (!list.length) { U.$('#pgPool').textContent = '還沒選課：在上面點一下課程就會加入'; U.$('#plPreview').innerHTML = '<p class="dim small-t">（尚未選課）</p>'; U.$('#plClear').hidden = true; return; }
      U.$('#plClear').hidden = false;
      const count = list.reduce((a, { l }) => { l.steps.forEach(s => { if (s.type === 'check') a.q++; else if (s.type === 'practice') a.q += (s.qids || []).length + (s.pick ? (s.pick.n || 2) : 0) + (s.checks || []).length; else a.r++; }); return a; }, { r: 0, q: 0 });
      const steps = count.r + count.q, per = Math.max(1, lcfg.per || 1), balls = Math.floor(steps / per) * Math.max(1, lcfg.shots || 1);
      U.$('#pgPool').textContent = `已選 ${list.length} 課・約 ${count.r} 張閱讀卡＋${count.q} 題檢核（約可發射 ${balls} 顆）`;
      U.$('#plPreview').innerHTML = list.map(({ p, l }, i) => `<div class="pg-plan"><span class="pg-lno">${i + 1}</span><div><b>${isDone(L, p, l) ? '✓ ' : ''}${U.esc(l.title)}</b><small>${U.esc(p.title)}</small></div><button type="button" class="pg-x" data-rm="${U.esc(key(p, l))}" title="取消這一課" aria-label="取消這一課">✕</button></div>`).join('');
      U.$$('#plPreview [data-rm]').forEach(b => b.onclick = () => { toggle(b.dataset.rm); drawAll(); });
    }
    function drawAll() { save(); drawSubjects(); drawTree(); preview(); }
    U.$('#plClear').onclick = () => { lcfg.sel = []; drawAll(); };
    U.$('#plNext').onclick = () => {
      const L = les();
      for (const sec of packTree(packs, lcfg.subject)) for (const u of sec.units) for (const p of u.packs) for (const l of p.lessons)
        if (!isDone(L, p, l) && !lcfg.sel.includes(key(p, l))) { lcfg.sel.push(key(p, l)); openUnit = u.key; drawAll(); const el = U.$(`#plTree [data-k="${CSS.escape(key(p, l))}"]`); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
      U.toast('這個科目的課都上完或都選了');
    };
    bindShots(lcfg, () => { save(); preview(); });
    U.$('#pgPenalty').onchange = e => { lcfg.wrongPenalty = Number(e.target.value); save(); };
    U.$('#pgReward').onchange = e => { lcfg.reward = e.target.value; save(); };
    U.$('#pgWeb').onclick = () => {
      const list = selectedLessons(lcfg); if (!list.length) { U.toast('請先點選要上的課（可以多選）'); return; }
      webOpen(learnSession(lcfg, list));
    };
    U.$('#pgLaunch').onclick = () => launchWith(st => exportLearn(lcfg, st), ctx, true);
    U.$('#pgApply').onclick = () => launchWith(st => exportLearn(lcfg, st), ctx, false);
    drawAll();
  }

  document.addEventListener('DOMContentLoaded', () => { if (autoProbe()) startSync(); });
  return { screen, sync, detect, exportSession, exportLearn, lessonItems, queue, exportData, importData, backup,
    web: { open: webOpen, close: webClose, probe: probeWeb, quizIds, quizSession, learnSession, selectedLessons, get state() { return G; } } };
})();
