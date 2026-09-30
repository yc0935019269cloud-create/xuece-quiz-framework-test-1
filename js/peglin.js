/* Peglin 原版整合：彈珠刷題／彈珠學習
 * 網頁（本機資料夾、localhost、或自己的 GitHub Page）→ 本機啟動器 Start-PeglinQuiz.exe（127.0.0.1:18769）
 * → PeglinQuiz 裡的遊戲本體；作答紀錄回流到錯題本、學習模式與統計，並備份到題庫框架資料夾的 peglin/紀錄/。
 * 題本內容一律取自「目前這個網頁」載入的題庫與課程（在 GitHub Page 開就用 GitHub Page 的題庫）。
 * 別台電腦沒有啟動器，所以兩個彈珠模式只會顯示說明、不能啟動。 */
const PEGLIN = (() => {
  const base = 'http://127.0.0.1:18769';
  let polling = false, busy = false, bridge = null, probing = null, lastBackup = 0, dirty = false;
  const selfServed = () => location.origin === base;
  // 在 GitHub Page 上不主動探測本機（避免別人的瀏覽器跳出「存取本機網路」詢問）；進入彈珠頁面才探測
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
  const NO_BRIDGE = '找不到本機彈珠服務。彈珠刷題／彈珠學習只能在安裝了 PeglinQuiz 的電腦上使用：請先雙擊 E:\\PeglinQuiz\\Start-PeglinQuiz.exe（右下角系統匣可設定開機自動啟動），再重新整理這一頁。';
  async function api(path, data) {
    if (!(await detect())) throw new Error(NO_BRIDGE);
    let r;
    try { r = await fetch(base + '/api/' + path, data === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
    catch { bridge = null; throw new Error(NO_BRIDGE); }
    const d = await r.json(); if (!r.ok) throw new Error(d.error || '本機服務連線失敗'); return d;
  }

  /* ---------- 作答紀錄同步 ---------- */
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
      if (st) st.textContent = `已同步 ${done.size} 筆彈珠紀錄・答錯題進錯題本、學習檢核錯題進複習盒`;
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
  /* 目前套用的題本在遊戲裡的戰況 */
  function report(rows) {
    const box = document.querySelector('#pgReport'); if (!box) return;
    let cur = null; try { cur = JSON.parse(localStorage.getItem(SKEY('peglin-session')) || 'null'); } catch {}
    if (!cur) { box.innerHTML = ''; return; }
    const mine = rows.filter(r => r.session === cur.id && r.kind !== 'lesson');
    const title = cur.mode === 'learn' ? '本次學習' : '本輪戰報';
    if (!mine.length) { box.innerHTML = `<h3>${title}</h3><p>「${U.esc(cur.label)}」已套用（${cur.count} ${cur.mode === 'learn' ? '步' : '題'}），還沒開始。</p>`; return; }
    const ok = mine.filter(r => r.ok).length;
    let run = 0, best = 0; for (const r of mine) { run = r.ok ? run + 1 : 0; best = Math.max(best, run); }
    const lastWrong = new Map(); for (const r of mine) { if (r.ok) lastWrong.delete(r.qid); else lastWrong.set(r.qid, true); }
    const wrong = [...lastWrong.keys()].filter(id => Store.Q[id]).slice(-5).reverse();
    const doneLessons = rows.filter(r => r.session === cur.id && r.kind === 'lesson').length;
    const stem = q => U.esc(String(q.stem || q.ans || q.id).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[*_`#>|]/g, '').slice(0, 42));
    box.innerHTML = `<h3>${title}</h3><p>「${U.esc(cur.label)}」：已答 <b>${mine.length}</b> 次・答對 <b>${Math.round(ok * 100 / mine.length)}%</b>・最長連對 <b>${best}</b>${cur.mode === 'learn' ? `・完成 <b>${doneLessons}</b> 課` : ''}</p>`
      + (wrong.length ? `<p class="dim">還沒扳回來的題：</p><ul>${wrong.map(id => `<li>${stem(Store.Q[id])}</li>`).join('')}</ul>` : '');
  }
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

  /* ---------- 題本（彈珠刷題） ---------- */
  function pool(cfg) { return Store.filter(cfg); }
  function queue(cfg) {
    const units = [], seen = new Map();
    for (const q of pool(cfg)) {
      if (q.group) { if (!seen.has(q.group)) { const a = []; units.push(a); seen.set(q.group, a); } seen.get(q.group).push(q); }
      else units.push([q]);
    }
    const chosen = [];
    for (const unit of (cfg.ordered ? units : U.shuffle(units))) { if (chosen.length >= cfg.count) break; chosen.push(...unit); }
    return chosen;
  }
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
  async function exportSession(cfg, status) {
    const chosen = queue(cfg); if (!chosen.length) throw new Error('沒有符合條件的題目，請放寬篩選。');
    const paths = new Set(), questions = chosen.map(q => bankItem(q, paths));
    const names = cfg.subjects.map(s => C.SUBJECTS[s]?.name).filter(Boolean);
    return { version: 1, mode: 'quiz', id: newId(), label: names.join('・') || '全部科目', source: location.href.split('#')[0], wrongPenalty: cfg.wrongPenalty, reward: cfg.reward, retryWrong: cfg.retryWrong, ordered: !!cfg.ordered, questions, ...(await embedImages(paths, status)), created: new Date().toISOString() };
  }

  /* ---------- 課程（彈珠學習）：把學習模式的一課攤平成「閱讀卡＋檢核題」 ---------- */
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
  function pickBank(pick, n, subj) {
    const words = (pick.match || []).map(w => w.toLowerCase());
    const list = Store.filter({ subjects: pick.subjects || (subj ? [subj] : []), types: pick.types || ['single', 'multi', 'fill'] })
      .filter(q => q.type !== 'open' && words.some(w => (q.tag || '').toLowerCase().includes(w) || (pick.inEx !== false && (q.ex || '').toLowerCase().includes(w))));
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
        const bank = (s.qids || []).map(id => Store.Q[id]).filter(Boolean).concat(s.pick ? pickBank(s.pick, s.pick.n || 2, p.subject) : []);
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
    const label = list.length === 1 ? `${list[0].p.title}｜${list[0].l.title}` : `${list[0].l.title} 等 ${list.length} 課`;
    return { version: 1, mode: 'learn', id: newId(), label, lessonCount: list.length, source: location.href.split('#')[0], wrongPenalty: lcfg.wrongPenalty, reward: lcfg.reward, retryWrong: false, ordered: true, questions, ...(await embedImages(paths, status)), created: new Date().toISOString() };
  }

  /* ---------- 畫面 ---------- */
  const readCfg = (k, d) => { try { return Object.assign(d, JSON.parse(localStorage.getItem(SKEY(k)) || '{}')); } catch { return d; } };
  function screen(mode) {
    startSync();
    mode = mode === 'learn' ? 'learn' : (mode || readCfg('peglin-mode', { m: 'quiz' }).m);
    localStorage.setItem(SKEY('peglin-mode'), JSON.stringify({ m: mode }));
    U.$('#topTitle').textContent = mode === 'learn' ? '彈珠學習' : '彈珠刷題';
    const root = U.$('#screen'), learn = mode === 'learn';
    root.innerHTML = `<div class="peglin-page">
      <section class="peglin-hero panel"><div><span class="peglin-eyebrow">PEGLIN × ${learn ? '你的課程' : '你的題庫'}</span>
        <div class="peglin-modes" role="tablist"><button class="px-btn ${!learn ? 'gold' : ''}" data-mode="quiz" role="tab" aria-selected="${!learn}">⚪ 彈珠刷題</button><button class="px-btn ${learn ? 'gold' : ''}" data-mode="learn" role="tab" aria-selected="${learn}">📘 彈珠學習</button></div>
        <h1>${learn ? '讀一張卡，<br>打一顆球。' : '先想清楚，<br>再打出漂亮的一球。'}</h1>
        <p>${learn ? '把學習模式的一課帶進真正的 Peglin：每次瞄準前讀下一張概念卡或做一題檢核，答錯先給提示再試一次。整課讀完會記成完成，檢核錯題進複習盒。' : '在真正的 Peglin 戰鬥裡刷題。作答後閱讀詳解，再回到彈珠盤瞄準；暴擊、刷新、炸彈、敵人與遺物都沿用原版玩法。'}</p>
        <div class="peglin-steps">${(learn ? ['① 選課程', '② 遊戲內閱讀與檢核', '③ 回營地看進度'] : ['① 選題本', '② 遊戲內作答', '③ 瞄準發射']).map(x => `<span>${x}</span>`).join('')}</div></div>
        <div class="peglin-orbit" aria-hidden="true"><i class="peglin-orb"></i>${Array.from({ length: 18 }, (_, i) => `<b style="--x:${12 + (i % 5) * 18}%;--y:${25 + Math.floor(i / 5) * 18}%" class="${i === 7 ? 'critical' : i === 13 ? 'refresh' : ''}"></b>`).join('')}<span>${learn ? '一卡・一球' : '一題・一球'}</span></div></section>
      <div id="pgGate" class="panel peglin-gate" hidden></div>
      <div class="peglin-layout"><section class="panel peglin-setup" id="pgSetup"></section>
      <aside class="panel peglin-side"><h2>你的學習營地</h2><p>作答保留原題 ID：答錯進錯題本、學習檢核錯題進複習盒；紀錄與錯題本會備份到題庫資料夾的 <code>peglin/紀錄/</code>。</p><p id="peglinSync" class="peglin-sync" role="status">正在尋找本機彈珠服務…</p><div id="pgReport" class="peglin-report"></div>
        <div class="col">${[['learn', '📘 學習模式'], ['wrong', '📕 錯題本'], ['settings', '💾 設定與存檔'], ['hub', '🏕 回到營地']].map(([go, t]) => `<button class="px-btn" data-pggo="${go}">${t}</button>`).join('')}<button class="px-btn" id="pgBackup">立即備份到題庫資料夾</button><button class="px-btn" id="pgRestore">從題庫資料夾讀回進度</button></div>
        <p class="dim small-t" id="pgWhere"></p></aside></div></div>`;
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
    (learn ? learnSetup : quizSetup)(U.$('#pgSetup'), ctx);
    gate();
  }
  /* 沒有本機服務時：說明並停用啟動按鈕（別台電腦、或還沒開啟動器） */
  async function gate() {
    const b = await detect(true), g = U.$('#pgGate'); if (!g) return;
    const btns = U.$$('#pgLaunch, #pgApply, #pgBackup, #pgRestore');
    if (b) {
      g.hidden = true; btns.forEach(x => x.disabled = false);
      const w = U.$('#pgWhere'); if (w) w.textContent = `遊戲本體：${b.root}Peglin・紀錄：${b.dataDir}・題庫取自目前這個網頁（${location.host || '本機檔案'}）。`;
      sync();
    } else {
      g.hidden = false; btns.forEach(x => x.disabled = true);
      g.innerHTML = `<h3>這台電腦沒有連上本機彈珠服務</h3><p>${NO_BRIDGE}</p><p class="dim small-t">其他模式（學習、遠征、錯題本…）都能照常使用。若是在 GitHub Page 開啟，瀏覽器可能會詢問是否允許「存取本機網路裝置」，請選允許。</p><button class="px-btn" id="pgRetry">重新偵測</button>`;
      U.$('#pgRetry').onclick = gate;
      const st = U.$('#peglinSync'); if (st) st.textContent = '未連線：作答紀錄會在連上後自動同步。';
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
      st.textContent = (launch ? `已套用「${s.label}」${s.questions.length} ${unit}，Peglin 啟動中；選「新的遊戲／繼續」，戰鬥時就會出現。` : `已套用「${s.label}」${s.questions.length} ${unit}，下次瞄準時換成這份。`) + (r.imagesFromDisk ? `（${r.imagesFromDisk} 張圖由本機題庫資料夾補上）` : '');
    } catch (e) { st.textContent = e.message; } finally { buttons.forEach(b => b.disabled = false); if (!bridge) gate(); }
  }
  const actionHtml = (label, note) => `<div class="peglin-action"><b id="pgPool"></b><span id="pgStatusText" role="status"></span><div class="row"><button class="px-btn gold big" id="pgLaunch">${label} ▶</button><button class="px-btn" id="pgApply">只套用</button></div><p class="dim small-t">${note}</p></div>`;
  const penaltyHtml = `<label>答錯扣血<select class="px-in" id="pgPenalty"><option value="0">不扣血・專心練習</option><option value="3">3 HP・輕鬆</option><option value="5">5 HP・標準</option><option value="10">10 HP・挑戰</option></select></label>
      <label>答對獎勵<select class="px-in" id="pgReward"><option value="normal">標準・答對傷害 ×1.2 起，連對加成</option><option value="strong">強力・答對傷害 ×1.3 起，連對加成</option><option value="off">關閉・純原版手感</option></select></label>`;

  /* ---------- 分類整理：單元編號、名稱清理 ---------- */
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
  const cleanSet = s => String(s || '').replace(/^【[^】]*】\s*/, '').replace(/（(自編)?練習）$/, '').replace(/^眼解剖實驗：/, '').trim();
  const yearOf = s => { const m = String(s || '').match(/(\d{2,3})\s*(年國考|學年度)/); return m ? { n: +m[1], short: m[1] + (m[2] === '學年度' ? ' 學年' : ' 年'), label: m[1] + (m[2] === '學年度' ? ' 學年度' : ' 年國考') } : null; };
  const byNo = (a, b) => a.no - b.no || a.name.localeCompare(b.name, 'zh-Hant');

  /* 題庫：科目 → 來源（學期／課程）→ 單元 → 題本（國考年份） */
  function examTree(subj) {
    const secs = new Map();
    Object.values(Store.EX).filter(e => e.subj === subj && e.count).forEach(e => {
      const p = e.path || [];
      const sec = p.length ? p[0] : '其他題本';
      const year = p.length >= 4 ? yearOf(p[1]) : null;
      const unitRaw = p.length >= 4 ? p[3] : p.length >= 2 ? p[p.length - 1] : e.name;
      const u = unitInfo(p.length >= 2 ? unitRaw : cleanSet(e.name));
      if (!secs.has(sec)) secs.set(sec, new Map());
      const units = secs.get(sec), key = u.tag + u.name;
      if (!units.has(key)) units.set(key, { ...u, key: sec + '|' + key, sets: [] });
      units.get(key).sets.push({ e, year, label: year ? year.short : unitInfo(cleanSet(e.name)).tag || cleanSet(e.name) });
    });
    return [...secs.entries()].map(([name, units]) => ({ name, units: [...units.values()].sort(byNo).map(u => ({ ...u, sets: u.sets.sort((a, b) => (a.year?.n || 0) - (b.year?.n || 0) || (a.e.order || 0) - (b.e.order || 0)) })) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
  }
  const setChip = (s, sel) => `<button type="button" class="pg-chip ${sel.has(s.e.id) ? 'on' : ''}" data-ex="${U.esc(s.e.id)}" title="${U.esc(QV.exLabel(s.e))}">${U.esc(s.label)}<small>${s.e.count}</small></button>`;
  function quizTree(box, cfg, onChange) {
    const open = new Set();
    let view = cfg.view || 'unit';
    function draw() {
      const sel = new Set(cfg.exams);
      const subjects = cfg.subjects.length === 1 ? cfg.subjects : Object.keys(C.SUBJECTS);
      const all = ids => ids.length && ids.every(id => sel.has(id));
      const some = ids => ids.some(id => sel.has(id));
      const qn = ids => ids.reduce((a, id) => a + (Store.EX[id]?.count || 0), 0);
      let hasYears = false;
      const body = subjects.map(sj => {
        const tree = examTree(sj); if (!tree.length) return '';
        const secHtml = tree.map(sec => {
          const units = sec.units, ids = units.flatMap(u => u.sets.map(s => s.e.id));
          const yearMode = view === 'year' && units.some(u => u.sets.some(s => s.year));
          if (units.some(u => u.sets.some(s => s.year))) hasYears = true;
          let rows;
          if (yearMode) {
            const years = new Map();
            units.forEach(u => u.sets.forEach(s => { const k = s.year ? s.year.label : '其他'; if (!years.has(k)) years.set(k, { n: s.year?.n || 999, list: [] }); years.get(k).list.push({ ...s, label: (u.tag || u.name.slice(0, 6)) }); }));
            rows = [...years.entries()].sort((a, b) => a[1].n - b[1].n).map(([label, y]) => {
              const yids = y.list.map(s => s.e.id);
              return `<div class="pg-row ${some(yids) ? 'has' : ''}"><button type="button" class="pg-row-head" data-pickall="${yids.join(',')}"><i class="pg-check ${all(yids) ? 'on' : some(yids) ? 'part' : ''}"></i><b>${U.esc(label)}</b><small>${y.list.length} 單元・${qn(yids)} 題</small></button><div class="pg-chips">${y.list.map(s => setChip(s, sel)).join('')}</div></div>`;
            }).join('');
          } else {
            rows = units.map(u => {
              const uids = u.sets.map(s => s.e.id), single = u.sets.length === 1;
              return `<div class="pg-row ${some(uids) ? 'has' : ''}"><button type="button" class="pg-row-head" data-pickall="${uids.join(',')}"><i class="pg-check ${all(uids) ? 'on' : some(uids) ? 'part' : ''}"></i>${u.tag ? `<span class="pg-tag">${U.esc(u.tag)}</span>` : ''}<b>${U.esc(u.name)}</b><small>${single ? '' : u.sets.length + ' 本・'}${qn(uids)} 題</small></button>${single ? '' : `<div class="pg-chips">${u.sets.map(s => setChip(s, sel)).join('')}</div>`}</div>`;
            }).join('');
          }
          const k = sj + '|' + sec.name, isOpen = open.has(k) || some(ids) || (tree.length === 1 && subjects.length === 1);
          return `<details class="pg-sec" data-k="${U.esc(k)}" ${isOpen ? 'open' : ''}><summary><b>${U.esc(sec.name)}</b><small>${sec.units.length} 單元・${qn(ids)} 題${some(ids) ? `・<em>已選 ${ids.filter(id => sel.has(id)).length} 本</em>` : ''}</small><button type="button" class="px-btn small" data-pickall="${ids.join(',')}">${all(ids) ? '全部取消' : '全選'}</button></summary><div class="pg-rows">${rows}</div></details>`;
        }).join('');
        return subjects.length > 1 ? `<h3 class="pg-subj-h">${U.esc(C.SUBJECTS[sj].name)}</h3>${secHtml}` : secHtml;
      }).join('');
      const n = cfg.exams.length;
      box.innerHTML = `<div class="pg-tree-bar"><span>${n ? `已選 <b>${n}</b> 本題本・${qn(cfg.exams)} 題` : '未勾選＝使用這個科目的全部題本'}</span><span class="grow"></span>
        ${hasYears ? `<div class="pg-seg" role="group" aria-label="分類方式"><button type="button" class="${view === 'unit' ? 'on' : ''}" data-view="unit">依單元</button><button type="button" class="${view === 'year' ? 'on' : ''}" data-view="year">依年份</button></div>` : ''}
        ${n ? '<button type="button" class="px-btn small" data-clear>清除</button>' : ''}</div>${body || '<p class="dim">這個科目沒有題本。</p>'}`;
    }
    box.addEventListener('toggle', e => { const k = e.target.dataset?.k; if (k) e.target.open ? open.add(k) : open.delete(k); }, true);
    box.onclick = ev => {
      const v = ev.target.closest('[data-view]'), pa = ev.target.closest('[data-pickall]'), ch = ev.target.closest('[data-ex]');
      if (v) { view = cfg.view = v.dataset.view; }
      else if (ev.target.closest('[data-clear]')) cfg.exams = [];
      else if (pa) { ev.preventDefault(); const ids = pa.dataset.pickall.split(','), every = ids.every(id => cfg.exams.includes(id)); cfg.exams = every ? cfg.exams.filter(id => !ids.includes(id)) : [...new Set(cfg.exams.concat(ids))]; }
      else if (ch) { const id = ch.dataset.ex, i = cfg.exams.indexOf(id); i >= 0 ? cfg.exams.splice(i, 1) : cfg.exams.push(id); }
      else return;
      if (window.SFX) SFX.play('click'); draw(); onChange && onChange();
    };
    draw();
    return draw;
  }
  const subjectChips = (list, cur, allowAll, count) => `<div class="pg-subjects" role="group" aria-label="科目">${list.map(s => `<button type="button" class="pg-subj ${cur === s ? 'on' : ''}" data-subj="${U.esc(s)}"><b>${U.esc(C.SUBJECTS[s].name)}</b><small>${count(s)}</small></button>`).join('')}${allowAll ? `<button type="button" class="pg-subj ${cur === '*' ? 'on' : ''}" data-subj="*"><b>全部科目</b><small>混合出題</small></button>` : ''}</div>`;

  function quizSetup(box, ctx) {
    const ids = Object.keys(C.SUBJECTS);
    const cfg = readCfg('peglin-config', { subjects: [ids[0]], exams: [], types: ['single', 'multi', 'fill', 'open'], status: 'all', count: 20, ordered: false, wrongPenalty: 5, reward: 'normal', retryWrong: true, view: 'unit' });
    cfg.subjects = cfg.subjects.filter(s => ids.includes(s)); if (!cfg.subjects.length) cfg.subjects = [ids[0]];
    const qCount = s => `${Store.filter({ subjects: [s] }).length.toLocaleString()} 題`;
    box.innerHTML = `<h2>準備這次的題本</h2>
      <div class="pg-step"><span class="pg-step-no">1</span><div><h3>科目</h3>${subjectChips(ids, cfg.subjects.length === 1 ? cfg.subjects[0] : '*', true, qCount)}</div></div>
      <div class="pg-step"><span class="pg-step-no">2</span><div><h3>範圍 <small>勾整個單元，或只點某幾年的題本</small></h3><div id="pgSets" class="pg-tree"></div></div></div>
      <div class="pg-step"><span class="pg-step-no">3</span><div><h3>出題方式</h3><div class="peglin-fields">
        <label>練習範圍<select class="px-in" id="pgStatus"><option value="all">全部題目</option><option value="new">尚未作答</option><option value="wrongbook">錯題本重練</option><option value="lastwrong">上次答錯</option><option value="unmastered">還沒答對過</option></select></label>
        <label>每輪題數<select class="px-in" id="pgCount">${[10, 20, 30, 50, 100].map(n => `<option value="${n}">${n} 題</option>`).join('')}</select></label>
        ${penaltyHtml}</div>
        <div class="peglin-types">${[['single', '單選／是非'], ['multi', '多選'], ['fill', '填答'], ['open', '非選自評']].map(([t, n]) => `<label><input type="checkbox" value="${t}" ${cfg.types.includes(t) ? 'checked' : ''}> ${n}</label>`).join('')}<label><input type="checkbox" id="pgOrdered" ${cfg.ordered ? 'checked' : ''}> 按題本順序</label><label><input type="checkbox" id="pgRetry" ${cfg.retryWrong ? 'checked' : ''}> 答錯的題稍後再出一次</label></div></div></div>
      ${actionHtml('套用題本並啟動 Peglin', '每次瞄準前出一題：答對→這一球傷害加成（連對越高，每 5 連對回血）；答錯→扣血但不致死。題目用完會打散再來一輪；關掉遊戲再開會接著上次進度。遊戲內可用 1–9／A–I 作答、Enter 繼續。')}
      <button class="px-btn mt" id="pgPreview">先試答一題（不計紀錄）</button>`;
    U.$('#pgStatus').value = cfg.status; U.$('#pgCount').value = cfg.count; U.$('#pgPenalty').value = cfg.wrongPenalty; U.$('#pgReward').value = cfg.reward;
    const update = () => { const list = pool(cfg), n = list.length; U.$('#pgPool').textContent = `${n.toLocaleString()} 題可用 · 這輪 ${Math.min(n, cfg.count)} 題${list.some(q => q.group) ? '（題組一併保留）' : ''}`; localStorage.setItem(SKEY('peglin-config'), JSON.stringify(cfg)); };
    const drawTree = quizTree(U.$('#pgSets'), cfg, update);
    U.$$('[data-subj]', box).forEach(b => b.onclick = () => {
      cfg.subjects = b.dataset.subj === '*' ? ids.slice() : [b.dataset.subj]; cfg.exams = [];
      U.$$('[data-subj]', box).forEach(x => x.classList.toggle('on', x === b)); drawTree(); update();
    });
    for (const [id, key] of [['pgStatus', 'status'], ['pgCount', 'count'], ['pgPenalty', 'wrongPenalty'], ['pgReward', 'reward']]) U.$('#' + id).onchange = e => { cfg[key] = key === 'status' || key === 'reward' ? e.target.value : Number(e.target.value); update(); };
    U.$$('.peglin-types input[value]', box).forEach(x => x.onchange = () => { cfg.types = U.$$('.peglin-types input[value]:checked', box).map(x => x.value); update(); });
    U.$('#pgOrdered').onchange = e => { cfg.ordered = e.target.checked; update(); };
    U.$('#pgRetry').onchange = e => { cfg.retryWrong = e.target.checked; update(); };
    U.$('#pgLaunch').onclick = () => launchWith(st => exportSession(cfg, st), ctx, true);
    U.$('#pgApply').onclick = () => launchWith(st => exportSession(cfg, st), ctx, false);
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
    const lcfg = readCfg('peglin-learn', { subject: subs[0], sel: [], wrongPenalty: 0, reward: 'normal' });
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
      <div class="pg-step"><span class="pg-step-no">3</span><div><h3>這次的課表 <small>依課程順序</small><button type="button" class="px-btn small" id="plClear">清除</button></h3><div id="plPreview" class="peglin-lesson-preview"></div>
        <div class="peglin-fields mt">${penaltyHtml}</div></div></div>
      ${actionHtml('帶這些課進 Peglin', '每次瞄準前：讀一張卡（導入、概念、範例、回顧）或做一題檢核。檢核答錯先給提示再試一次；每課讀完會記成「完成」並給星等。課上完後會接著複習這幾課的題目。圖解與互動模擬仍請在「📘 學習模式」操作。')}`;
    U.$('#pgPenalty').value = lcfg.wrongPenalty; U.$('#pgReward').value = lcfg.reward;
    const save = () => localStorage.setItem(SKEY('peglin-learn'), JSON.stringify(lcfg));
    const toggle = k => { const i = lcfg.sel.indexOf(k); i >= 0 ? lcfg.sel.splice(i, 1) : lcfg.sel.push(k); };
    function drawSubjects() {
      U.$('#plSubjects').innerHTML = subjectChips(subs, lcfg.subject, false, lessonCount);
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
      U.$('#pgPool').textContent = `已選 ${list.length} 課・約 ${count.r} 張閱讀卡＋${count.q} 題檢核（約 ${count.r + count.q} 球）`;
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
    U.$('#pgPenalty').onchange = e => { lcfg.wrongPenalty = Number(e.target.value); save(); };
    U.$('#pgReward').onchange = e => { lcfg.reward = e.target.value; save(); };
    U.$('#pgLaunch').onclick = () => launchWith(st => exportLearn(lcfg, st), ctx, true);
    U.$('#pgApply').onclick = () => launchWith(st => exportLearn(lcfg, st), ctx, false);
    drawAll();
  }

  document.addEventListener('DOMContentLoaded', () => { if (autoProbe()) startSync(); });
  return { screen, sync, detect, exportSession, exportLearn, lessonItems, queue, exportData, importData, backup };
})();
