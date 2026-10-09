/* 學習模式：知識卡 × 即時檢核 × 題庫實戰 交錯進行（資料：data/learn.js 的 window.LEARN，原始檔 content/learn/） */
const LEARN_UI = (() => {
  const KEY = SKEY('learn');
  const STEP = {
    intro: { ic: '🚪', name: '導入' }, card: { ic: '📘', name: '概念' }, check: { ic: '❓', name: '檢核' },
    example: { ic: '🧩', name: '範例' }, practice: { ic: '⚔', name: '實戰' }, recap: { ic: '⭐', name: '回顧' },
    diagram: { ic: '🔍', name: '圖解' }, interactive: { ic: '🎮', name: '互動' }
  };
  const LEVEL = ['', '基礎', '標準', '進階'];
  const BOX_DAYS = [0, 1, 2, 4, 7, 15, 30]; // 複習盒：答對升一盒，答錯回第 1 盒
  const DAY = 864e5;
  const packs = (window.LEARN && window.LEARN.packs) || [];
  const PK = {};

  /* ---------- 存檔 xd_learn ---------- */
  const blank = () => ({ les: {}, rev: {}, cfg: { battle: true, open: {} }, last: null, stat: { lessons: 0, checks: 0, right: 0, reviews: 0, kills: 0, bosses: 0 } });
  let D = load();
  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY) || '{}'); const b = blank(); return Object.assign(b, d, { stat: Object.assign(b.stat, d.stat || {}), cfg: Object.assign(b.cfg, d.cfg || {}) }); } catch (e) { return blank(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { console.warn('learn save failed', e); } }
  const lkey = (p, l) => p.id + '/' + l.id;

  /* ---------- 複習項目索引：check 與 flash 的 id → 內容 ---------- */
  const ITEMS = {};
  /* 建立索引（啟動時與「導入素材」合併後都會呼叫） */
  function reindex() {
    packs.forEach(p => { PK[p.id] = p; });
    packs.forEach(p => p.lessons.forEach(l => l.steps.forEach(s => {
      const where = { p: p.id, l: l.id };
      if (s.type === 'check') ITEMS[s.id] = Object.assign({ k: 'check', c: s }, where);
      if (s.type === 'practice') (s.checks || []).forEach(c => { ITEMS[c.id] = Object.assign({ k: 'check', c }, where); });
      if (s.type === 'card' && s.flash) ITEMS[s.flash.id] = Object.assign({ k: 'flash', c: s.flash }, where);
      if (s.type === 'recap') (s.flash || []).forEach(f => { ITEMS[f.id] = Object.assign({ k: 'flash', c: f }, where); });
    })));
  }
  reindex();
  function addRev(id, dueNow) {
    if (!ITEMS[id]) return;
    const r = D.rev[id];
    if (r && !dueNow) return;
    D.rev[id] = { box: 1, due: dueNow ? Date.now() : Date.now() + DAY, n: r ? r.n : 0, w: (r ? r.w : 0) + (dueNow ? 1 : 0) };
  }
  function dueList() { const t = Date.now(); return Object.keys(D.rev).filter(id => ITEMS[id] && D.rev[id].due <= t); }
  function gradeRev(id, ok) {
    const r = D.rev[id]; if (!r) return;
    r.n++; if (!ok) r.w++;
    r.box = ok ? Math.min(r.box + 1, BOX_DAYS.length - 1) : 1;
    r.due = Date.now() + BOX_DAYS[r.box] * DAY;
  }

  /* ---------- 小工具 ---------- */
  const scr = () => U.$('#screen');
  const md = s => U.md(s || '');
  const sameAns = U.sameAns;
  const inl = s => U.md(s || '').replace(/^<div class="md"><p>([\s\S]*)<\/p><\/div>$/, '$1'); // 單行文字不要段落間距
  function packProgress(p) {
    let done = 0; p.lessons.forEach(l => { if ((D.les[lkey(p, l)] || {}).done) done++; });
    return { done, total: p.lessons.length };
  }
  function stars(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
  function petBox() {
    const id = Store.profile.activePet;
    return id ? `<div class="lp-pet">${Store.petHTML(id, 48)}<div class="lp-say" id="lpSay"></div></div>` : '<div class="lp-pet"><div class="lp-say" id="lpSay"></div></div>';
  }
  function say(t) { const b = U.$('#lpSay'); if (!b) return; b.textContent = t; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  const LINES = {
    intro: ['新的一課開始囉！', '先看看這課要學什麼～'], card: ['慢慢讀，重點框起來了！', '看懂了再往下喔。', '這張很重要！'],
    check: ['換你試試看！', '剛剛學的，馬上用用看。'], example: ['先自己想一下，再看下一步。', '一步一步拆開來看～'],
    practice: ['上戰場！這是題庫裡的題目。', '實戰時間到！'], recap: ['快完成了，最後整理一下重點！'],
    ok: ['答對了！好厲害！', '完全正確✨', '就是這樣！'], ng: ['沒關係，看提示再試一次。', '差一點點！'], reveal: ['這題放進複習盒了，之後再挑戰。'],
    diagram: ['先點點看每個標記，認識一下～', '看圖認位置，最後要考喔！'], interactive: ['動手玩玩看，觀察會發生什麼！', '拉拉看、按按看～']
  };
  const imgList = v => (Array.isArray(v) ? v : v ? [v] : []);
  const imgsHTML = (v, src) => imgList(v).map(x => `<img class="lp-img" src="${U.esc(U.img(x))}" alt="">`).join('') + (src ? `<div class="lp-src">圖片來源：${inl(src)}</div>` : '');

  /* ---------- 通用檢核題（課程、實戰自編題、複習共用） ----------
   * opts: { onDone(firstOk), allowHint=true }
   */
  function renderCheck(box, c, opts = {}) {
    const allowHint = opts.allowHint !== false;
    let tries = 0, locked = false;
    box.innerHTML = `<div class="lc-q">${md(c.q)}</div><div class="lc-ans"></div><div class="lc-fb"></div>`;
    const ans = box.querySelector('.lc-ans'), fb = box.querySelector('.lc-fb');
    const kindName = { single: '單選', multi: '多選（可選多個）', tf: '是非', fill: '填答', order: '排序', self: '自評' }[c.kind];
    box.insertAdjacentHTML('afterbegin', `<div class="lc-kind">${kindName}</div>`);

    function wrong(show) {
      tries++;
      SFX.play('wrong');
      opts.onWrong && opts.onWrong();
      if (tries === 1 && c.hint && allowHint && c.kind !== 'self') {
        fb.innerHTML = `<div class="lc-hint">💡 提示：${inl(c.hint)}</div>`;
        say(U.pick(LINES.ng));
        reset && reset();
        return;
      }
      finish(false, show);
    }
    function finish(ok, show) {
      locked = true;
      show && show();
      const firstOk = ok && tries === 0;
      if (ok) SFX.play('correct');
      say(ok ? U.pick(LINES.ok) : U.pick(LINES.reveal));
      fb.innerHTML = `<div class="verdict ${ok ? 'green-t' : 'red-t'}">${ok ? (tries ? '✔ 這次答對了' : '✔ 答對了！') : '✘ 答案揭曉'}</div>` +
        (c.explain ? `<div class="lc-ex">${md(c.explain)}</div>` : '');
      opts.onDone && opts.onDone(firstOk, ok);
    }
    let reset = null;

    if (c.kind === 'single' || c.kind === 'multi' || c.kind === 'tf') {
      const choices = c.kind === 'tf' ? ['⭕ 對', '❌ 錯'] : c.choices;
      const key = c.kind === 'tf' ? [c.answer ? 0 : 1] : c.kind === 'single' ? [c.answer] : c.answer.slice().sort();
      const picked = new Set();
      ans.innerHTML = choices.map((t, i) => `<button class="px-btn lc-opt ${c.kind === 'tf' ? 'tf' : ''}" data-i="${i}">${c.kind === 'tf' ? '' : `<b>${String.fromCharCode(65 + i)}</b>`}<span>${inl(t)}</span></button>`).join('') +
        (c.kind === 'multi' ? '<button class="px-btn gold lc-confirm">確認作答 ⏎</button>' : '');
      const btns = U.$$('.lc-opt', ans);
      const show = () => btns.forEach((b, i) => { b.disabled = true; if (key.includes(i)) b.classList.add('correct'); else if (picked.has(i)) b.classList.add('wrong'); });
      const grade = () => {
        const p = [...picked].sort((a, b) => a - b);
        if (p.length === key.length && p.every((x, i) => x === key[i])) finish(true, show);
        else wrong(show);
      };
      reset = () => { btns.forEach((b, i) => { b.classList.remove('picked'); if (picked.has(i)) b.classList.add('tried'); }); picked.clear(); };
      btns.forEach((b, i) => b.onclick = () => {
        if (locked) return;
        SFX.play('click');
        if (c.kind === 'multi') { picked.has(i) ? picked.delete(i) : picked.add(i); b.classList.toggle('picked'); return; }
        picked.clear(); picked.add(i); grade();
      });
      const cf = ans.querySelector('.lc-confirm');
      if (cf) cf.onclick = () => { if (locked) return; if (!picked.size) { U.toast('請先選擇選項'); return; } grade(); };
      box._key = e => {
        if (locked) return false;
        const k = e.key.toUpperCase();
        let i = /^[1-9]$/.test(k) ? Number(k) - 1 : /^[A-H]$/.test(k) && c.kind !== 'tf' ? k.charCodeAt(0) - 65 : -1;
        if (c.kind === 'tf' && (k === 'O' || k === 'T')) i = 0;
        if (c.kind === 'tf' && (k === 'X' || k === 'F')) i = 1;
        if (i >= 0 && btns[i]) { btns[i].click(); return true; }
        if (e.key === 'Enter' && cf) { cf.click(); return true; }
        return false;
      };
    } else if (c.kind === 'fill') {
      ans.innerHTML = `<div class="row" style="justify-content:center"><input class="px-in lc-in" placeholder="在這裡輸入答案" autocomplete="off"><button class="px-btn gold">送出 ⏎</button></div>`;
      const inp = ans.querySelector('input'), btn = ans.querySelector('button');
      const show = () => { inp.disabled = true; btn.disabled = true; fb.insertAdjacentHTML('afterbegin', `<div class="lc-key">正確答案：<b class="gold-t">${U.esc(c.answer[0])}</b></div>`); };
      const go = () => {
        if (locked) return;
        const v = inp.value;
        if (!v.trim()) { U.toast('請先輸入答案'); return; }
        if (c.answer.some(a => sameAns(v, a))) { inp.classList.add('ok'); finish(true, () => { inp.disabled = true; btn.disabled = true; }); }
        else { inp.classList.add('ng'); setTimeout(() => inp.classList.remove('ng'), 400); wrong(show); }
      };
      reset = () => { inp.select(); };
      btn.onclick = go;
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); go(); } };
      setTimeout(() => inp.focus(), 50);
    } else if (c.kind === 'order') {
      const order = [];
      let mix = U.shuffle(c.items.map((t, i) => i));
      if (mix.every((x, i) => x === i)) mix = mix.reverse();
      ans.innerHTML = `<div class="lc-seq"></div><div class="lc-pool">${mix.map(i => `<button class="px-btn lc-item" data-i="${i}">${inl(c.items[i])}</button>`).join('')}</div>
        <div class="row" style="justify-content:center"><button class="px-btn small lc-undo">↶ 重排</button></div>`;
      const seq = ans.querySelector('.lc-seq');
      const draw = () => { seq.innerHTML = order.length ? order.map((i, n) => `<div class="lc-seqi"><b>${n + 1}</b>${inl(c.items[i])}</div>`).join('') : '<div class="dim small-t">依序點選下面的項目</div>'; };
      const items = U.$$('.lc-item', ans);
      const show = () => { seq.innerHTML = c.items.map((t, n) => `<div class="lc-seqi ${order[n] === n ? 'good' : 'bad'}"><b>${n + 1}</b>${inl(t)}</div>`).join(''); ans.querySelector('.lc-pool').remove(); ans.querySelector('.lc-undo').remove(); };
      reset = () => { order.length = 0; items.forEach(b => { b.disabled = false; }); draw(); };
      items.forEach(b => b.onclick = () => {
        if (locked) return; SFX.play('click');
        order.push(Number(b.dataset.i)); b.disabled = true; draw();
        if (order.length === c.items.length) setTimeout(() => { order.every((x, i) => x === i) ? finish(true, () => { seq.querySelectorAll('.lc-seqi').forEach(x => x.classList.add('good')); ans.querySelector('.lc-pool').remove(); ans.querySelector('.lc-undo').remove(); }) : wrong(show); }, 150);
      });
      ans.querySelector('.lc-undo').onclick = () => { if (!locked) reset(); };
      draw();
    } else { // self
      ans.innerHTML = `<div class="col" style="align-items:center"><textarea class="px-in lc-ta" rows="3" placeholder="（選填）先寫下你的想法"></textarea><button class="px-btn gold">揭曉參考答案</button></div>`;
      ans.querySelector('button').onclick = () => {
        const mine = ans.querySelector('textarea').value.trim();
        ans.innerHTML = `<div class="lc-ex"><b class="gold-t">參考答案</b>${md(c.answer)}${mine ? `<p class="dim small-t">你的答案：${U.esc(mine)}</p>` : ''}</div>
          <div class="row" style="justify-content:center"><button class="px-btn green">我答對了</button><button class="px-btn red">我沒答好</button></div>`;
        const [y, n] = ans.querySelectorAll('.row button');
        y.onclick = () => { ans.querySelector('.row').remove(); finish(true); };
        n.onclick = () => { ans.querySelector('.row').remove(); tries = 1; finish(false); };
      };
    }
  }
  /* ---------- 主畫面 ---------- */
  let tab = 'courses', subjF = 'all';
  function screen(arg) {
    if (arg && arg.pack && PK[arg.pack]) return packView(PK[arg.pack]);
    if (arg && arg.tab) tab = arg.tab;
    const due = dueList().length;
    scr().innerHTML = `<div class="panel learn">
      <div class="row tabs">${[['courses', '📚 課程'], ['review', `🔁 複習${due ? `（${due}）` : ''}`], ['notes', '📒 知識筆記'], ['guide', '🧭 學習節奏']].map(([k, l]) => `<button class="px-btn small ${tab === k ? 'sel' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <div id="learnBody" class="mt"></div></div>`;
    U.$$('[data-tab]').forEach(b => b.onclick = () => { SFX.play('click'); tab = b.dataset.tab; screen(); });
    ({ courses, review: reviewHome, notes, guide })[tab]();
  }

  const pathOf = p => (p.path && p.path.length ? p.path : [p.unit || '其他']);
  let searchQ = '';
  function courses() {
    const body = U.$('#learnBody');
    if (!packs.length) {
      body.innerHTML = `<p>目前還沒有學習單元。</p><p class="small-t">到營地的「📋 AI 提示詞」複製「素材 → 學習模式」提示詞，把講義交給 AI；再用「📥 導入素材」選資料夾就能加進來。</p>`;
      return;
    }
    const subs = [...new Set(packs.map(p => p.subject))].filter(x => C.SUBJECTS[x]);
    if (subjF !== 'all' && !subs.includes(subjF)) subjF = 'all';
    const kw = searchQ.trim().toLowerCase();
    const list = packs.filter(p => C.SUBJECTS[p.subject] && (subjF === 'all' || p.subject === subjF) &&
      (!kw || [p.title, p.desc, p.unit, ...pathOf(p), ...p.lessons.map(l => l.title)].join(' ').toLowerCase().includes(kw)));
    // 建立樹：科目 → path 各層 → 單元
    const tree = [];
    list.forEach(p => {
      let sNode = tree.find(n => n.s === p.subject); if (!sNode) tree.push(sNode = { s: p.subject, kids: [], packs: [] });
      const pth = pathOf(p), nm = C.SUBJECTS[p.subject].name;
      let node = sNode; (pth[0] === nm || pth[0] === p.subject ? pth.slice(1) : pth).forEach(name => { let k = node.kids.find(x => x.name === name); if (!k) node.kids.push(k = { name, kids: [], packs: [] }); node = k; });
      node.packs.push(p);
    });
    const stat = node => { let d = 0, t = 0; const walk = n => { n.packs.forEach(p => { const pr = packProgress(p); d += pr.done; t += pr.total; }); n.kids.forEach(walk); }; walk(node); return { d, t }; };
    const packCard = p => {
      const pr = packProgress(p), best = p.lessons.reduce((a, l) => a + ((D.les[lkey(p, l)] || {}).best || 0), 0);
      return `<button class="px-btn lpack" data-pack="${p.id}" style="--sc:${C.SUBJECTS[p.subject].color}">
        <b>${U.esc(p.title)}</b><small>${U.esc(p.desc || '')}</small>
        <span class="row small-t"><span class="tag">${LEVEL[p.level || 2]}</span><span class="tag">${p.lessons.length} 課・約 ${p.minutes || p.lessons.length * 12} 分</span>${p.imported ? '<span class="tag">導入</span>' : ''}<span class="grow"></span><span class="gold-t">★ ${best}/${p.lessons.length * 3}</span></span>
        <div class="bar" style="height:10px"><i style="width:${U.pct(pr.done, pr.total)}%;background:var(--green)"></i></div></button>`;
    };
    const renderNode = (n, key, depth) => {
      const st = stat(n), k = key + '/' + n.name, open = kw || (D.cfg.open[k] ?? depth < 1);
      return `<details class="ltree d${depth}" data-k="${U.esc(k)}" ${open ? 'open' : ''}><summary><span class="ltree-n">${U.esc(n.name)}</span><span class="grow"></span><span class="dim small-t">${st.d}/${st.t} 課</span><span class="ltree-bar"><i style="width:${U.pct(st.d, st.t)}%"></i></span></summary>
        <div class="ltree-in">${n.kids.map(c => renderNode(c, k, depth + 1)).join('')}${n.packs.length ? `<div class="grid g2">${n.packs.map(packCard).join('')}</div>` : ''}</div></details>`;
    };
    const last = D.last && PK[D.last.p] && PK[D.last.p].lessons.find(l => l.id === D.last.l);
    body.innerHTML = `${last ? `<div class="lcont row"><span>上次學到：<b>${U.esc(PK[D.last.p].title)}</b>・${U.esc(last.title)}</span><span class="grow"></span><button class="px-btn gold" id="lCont">繼續學習 ▶</button></div>` : ''}
      <div class="row mt">${[['all', '全部']].concat(subs.map(x => [x, C.SUBJECTS[x].name])).map(([v, l]) => `<span class="chip ${subjF === v ? 'on' : ''}" data-sf="${v}">${l}</span>`).join('')}
        <span class="grow"></span><input class="px-in" id="lSearch" placeholder="搜尋單元／課名" value="${U.esc(searchQ)}" style="width:180px"></div>
      <div class="dim small-t">${packs.length} 個單元・${packs.reduce((a, p) => a + p.lessons.length, 0)} 課</div>
      ${tree.map(sn => { const S = C.SUBJECTS[sn.s], st = stat(sn); return `<h3 class="mt ltree-subj" style="color:${S.color}">${U.esc(S.name)} <span class="dim small-t">${st.d}/${st.t} 課</span></h3>
        ${sn.kids.map(c => renderNode(c, sn.s, 0)).join('')}${sn.packs.length ? `<div class="grid g2">${sn.packs.map(packCard).join('')}</div>` : ''}`; }).join('') || '<p class="dim">找不到符合的單元。</p>'}`;
    U.$$('[data-sf]', body).forEach(c => c.onclick = () => { subjF = c.dataset.sf; SFX.play('click'); courses(); });
    U.$$('[data-pack]', body).forEach(b => b.onclick = () => { SFX.play('click'); packView(PK[b.dataset.pack]); });
    U.$$('details.ltree', body).forEach(d => d.addEventListener('toggle', e => { if (e.target !== d) return; D.cfg.open[d.dataset.k] = d.open; save(); }));
    let tmr; U.$('#lSearch').oninput = e => { clearTimeout(tmr); tmr = setTimeout(() => { searchQ = e.target.value; courses(); const i = U.$('#lSearch'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); };
    const lc = U.$('#lCont'); if (lc) lc.onclick = () => play(PK[D.last.p], last);
  }

  function packQids(p) {
    const ids = new Set();
    p.lessons.forEach(l => l.steps.forEach(s => { if (s.type === 'practice') { (s.qids || []).forEach(q => Store.Q[q] && ids.add(q)); if (s.pick) pickQ(s.pick, 99, p.subject).forEach(q => ids.add(q)); } }));
    return [...ids];
  }
  function packView(p) {
    const S = C.SUBJECTS[p.subject];
    const qids = packQids(p);
    scr().innerHTML = `<div class="panel learn">
      <div class="row"><button class="px-btn small" id="lBack">← 課程列表</button><span class="grow"></span><span class="tag" style="border-color:${S.color}">${U.esc(S.name)}・${pathOf(p).map(U.esc).join(' › ')}</span><span class="tag">${LEVEL[p.level || 2]}</span></div>
      <h2 class="mt">${U.esc(p.title)}</h2>
      ${p.desc ? `<p>${U.esc(p.desc)}</p>` : ''}
      ${p.source ? `<p class="dim small-t">資料來源：${U.esc(p.source)}</p>` : ''}
      <div class="col mt">${p.lessons.map((l, i) => {
        const st = D.les[lkey(p, l)] || {};
        const inProg = st.i > 0 && st.i < l.steps.length;
        const state = inProg ? `<span class="tag">進行中 ${st.i}/${l.steps.length}</span>` : st.done ? `<span class="gold-t">${st.rank ? `<i class="lrank r-${st.rank}">${st.rank}</i>` : ''}${stars(st.best || 0)}</span>` : '<span class="tag">未開始</span>';
        return `<div class="lles ${st.done ? 'done' : ''}">
          <div class="lles-n">${i + 1}</div>
          <div class="grow"><b>${U.esc(l.title)}</b>
            <div class="lpips small">${l.steps.map(s => `<i class="t-${s.type}" title="${STEP[s.type].name}"></i>`).join('')}</div>
            ${(l.goals || []).length ? `<div class="dim small-t">🎯 ${l.goals.map(U.esc).join('；')}</div>` : ''}</div>
          <div class="col" style="align-items:flex-end;gap:6px">${state}
            <div class="row">${inProg ? `<button class="px-btn small" data-restart="${i}">從頭</button>` : ''}<button class="px-btn ${st.done ? '' : 'gold'}" data-play="${i}">${inProg ? '繼續 ▶' : st.done ? '重溫' : '開始 ▶'}</button></div></div></div>`;
      }).join('')}</div>
      ${qids.length ? `<hr class="px"><div class="row"><span>⚔ 這個單元連結了 <b class="gold-t">${qids.length}</b> 題題庫題目</span><span class="grow"></span><button class="px-btn purple" id="lRun">帶著這些題目去遠征</button></div>` : ''}
    </div>`;
    U.$('#lBack').onclick = () => { SFX.play('click'); tab = 'courses'; screen(); };
    U.$$('[data-play]').forEach(b => b.onclick = () => { SFX.play('click'); play(p, p.lessons[+b.dataset.play]); });
    U.$$('[data-restart]').forEach(b => b.onclick = () => { SFX.play('click'); play(p, p.lessons[+b.dataset.restart], true); });
    const rb = U.$('#lRun');
    if (rb) rb.onclick = () => Screens.startRun({ mode: 'list', title: `學以致用：${p.title}`, ids: qids, types: ['single', 'multi', 'fill', 'open'], count: qids.length });
  }

  /* 依關鍵字從題庫抽題：比對考點 tag 與詳解，優先沒做過的 */
  function pickQ(pick, n, subj) {
    const words = (pick.match || []).map(w => w.toLowerCase());
    let pool = Store.filter({ subjects: pick.subjects || (subj ? [subj] : []), exams: pick.exams, ids: pick.ids, types: pick.types || ['single', 'multi', 'fill'] })
      .filter(q => q.type !== 'open' && words.some(w => (q.tag || '').toLowerCase().includes(w) || (pick.inEx !== false && (q.ex || '').toLowerCase().includes(w))));
    const fresh = pool.filter(q => !Store.qs[q.id]?.a), old = pool.filter(q => Store.qs[q.id]?.a);
    return U.shuffle(fresh).concat(U.shuffle(old)).slice(0, n).map(q => q.id);
  }

  /* ---------- 課程播放器 ---------- */
  let ctl = null, keyH = null;
  function cleanupQ() { if (ctl) { ctl.destroy(); ctl = null; } } // 只拆題目（QV 的鍵盤監聽）
  function cleanup() {
    cleanupQ();
    if (keyH) { document.removeEventListener('keydown', keyH); keyH = null; }
  }
  function play(p, l, restart) {
    cleanup();
    const key = lkey(p, l);
    const st = D.les[key] || (D.les[key] = { i: 0, done: 0, best: 0 });
    if (restart || !st.run || st.i >= l.steps.length) { st.i = 0; st.run = { ok: 0, n: 0, sub: 0, pk: {}, t0: Date.now() }; }
    D.last = { p: p.id, l: l.id };
    save();
    const S = C.SUBJECTS[p.subject];
    scr().innerHTML = `<div class="panel learn lp" style="--sc:${S.color}">
      <div class="row lp-head"><button class="px-btn small" id="lpExit" title="進度會自動保存">✕ 離開</button>
        <div class="grow lp-title"><small>${U.esc(p.title)}</small><b>${U.esc(l.title)}</b></div>
        <button class="px-btn small" id="lpBattle" title="戰鬥模式：答對攻擊、答錯被反擊（不影響學習進度）">${D.cfg.battle ? '⚔ 戰鬥中' : '🕊 平靜模式'}</button><span class="lp-cnt" id="lpCnt"></span></div>
      <div class="lb" id="lbStage" style="--sc:${S.color}"></div>
      <div class="lpips" id="lpPips">${l.steps.map((s, i) => `<i class="t-${s.type}" data-tip="${i + 1}. ${STEP[s.type].name}"></i>`).join('')}</div>
      <div class="lp-body" id="lpBody"></div>
      <div class="lp-foot">${petBox()}<span class="grow"></span><button class="px-btn gold big" id="lpNext" disabled>繼續 ▶</button></div></div>`;
    U.$('#lpExit').onclick = () => { SFX.play('click'); cleanup(); save(); packView(p); };
    const next = U.$('#lpNext');
    keyH = e => {
      if (document.querySelector('.modal-bg') || !document.body.contains(next)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const body = U.$('#lpBody');
      if (body && body._key && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && body._key(e)) { e.preventDefault(); return; }
      if ((e.key === 'Enter' || e.key === ' ') && !next.disabled && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); next.click(); }
    };
    document.addEventListener('keydown', keyH);
    const R = st.run;
    const ready = (label) => { next.disabled = false; if (label) next.textContent = label; };
    const tally = (firstOk) => { R.n++; if (firstOk) R.ok++; D.stat.checks++; if (firstOk) D.stat.right++; battleItem(firstOk); save(); };

    /* ===== 學習戰鬥：每段（概念卡＋它的檢核題）一隻怪物；課末魔王 =====
     * 回饋設計：答對用和遠征相同的職業招式特效；第一次就答對累積連擊（傷害加成、音高上升、每 4 連擊夥伴追擊、每 5 連擊 +⚡）；
     * 讀概念卡／玩互動累積 ⚡，集滿 3 點由玩家決定何時放「必殺技」；怪物有特性與意圖（蓄力／硬殼／寶藏怪會逃跑）；
     * 連擊打得快會提早打倒怪物 → 本段還有題目就出現增援，整段零失誤清場掉寶箱；魔王半血進入第二階段；課末給 S／A／B／C 評等。
     * 倒下不影響學習進度（夥伴扶起、連擊歸零、評等最高 B）。 */
    const BOUND = ['intro', 'card', 'example', 'interactive', 'practice', 'recap'];
    const segOf = [], segItems = [];
    l.steps.forEach((x, i) => {
      if (i === 0 || BOUND.includes(x.type)) segItems.push(0);
      segOf[i] = segItems.length - 1;
      const k = segItems.length - 1;
      if (x.type === 'check') segItems[k] += 1;
      if (x.type === 'diagram' && x.mode !== 'explore') segItems[k] += Math.min(5, (x.points || []).length);
      if (x.type === 'practice') segItems[k] += (x.qids || []).length + (x.checks || []).length + (x.pick ? (x.pick.n || 2) : 0);
    });
    R.bt = Object.assign({ hp: 5, max: 5, en: 0, seg: -1, mon: null, kills: 0, falls: 0, gems: 0, seen: [], combo: 0, maxCombo: 0, segUsed: 0, segWrong: 0, chests: 0, ults: 0, shield: 0 }, R.bt || {});
    const B = R.bt;
    const lb = U.$('#lbStage');
    const lvIdx = p.lessons.indexOf(l);
    const clsId = Store.profile.activeClass || 'knight';
    const ULT = {
      knight: { name: '聖劍・守護', dmg: () => 35, desc: '造成 35 傷害，並擋下下一次反擊' },
      mage: { name: '隕星術', dmg: () => 45, desc: '造成 45 傷害' },
      ranger: { name: '流星三連', dmg: () => 36, desc: '造成 36 傷害，連擊 +2' },
      cleric: { name: '聖光審判', dmg: () => 30, desc: '造成 30 傷害，回復 2 ❤' },
      berserker: { name: '血怒斬', dmg: () => 25 + (B.max - B.hp) * 8, desc: '造成 25＋每失去 1 ❤ 再 +8 的傷害' }
    }[clsId] || { name: '必殺技', dmg: () => 35, desc: '造成 35 傷害' };
    const TRAIT = {
      charge: { name: '蓄力', desc: '每答 2 題蓄力一次：蓄力時答錯受 2 點傷害；答對則「破防」傷害 ×1.5' },
      shell: { name: '硬殼', desc: '硬殼在時普通攻擊只有 6 成傷害；暴擊或必殺技可以打碎硬殼' },
      treasure: { name: '寶藏怪', desc: '幾題後就會逃走！趕快打倒牠拿 3 魂晶' }
    };
    const monAt = () => { const m = B.boss || B.mon; return m && m.hp > 0 ? m : null; };

    function newMon(elite, items) {
      const tier = U.clamp((p.level || 2) - 1 + Math.floor(lvIdx / 2) + (elite ? 1 : 0), 0, 4);
      const pool = C.MONSTERS.filter(m => !m.secret && m.tier <= tier && m.tier >= tier - 1);
      const m = U.pick(pool.length ? pool : C.MONSTERS.filter(x => !x.secret));
      const hp = Math.max(10, items * 10);
      const treasure = !elite && items >= 2 && Math.random() < 0.12;
      const trait = treasure ? 'treasure' : elite ? U.pick(['charge', 'shell']) : U.pick([null, null, 'charge', 'shell']);
      return {
        id: m.id, name: treasure ? '✨寶藏' + m.name : (elite ? '【精英】' : '') + U.pick(C.monPrefix(p.subject)) + m.name,
        tile: m.tile, filter: treasure ? 'sepia(1) saturate(4) hue-rotate(5deg) brightness(1.15)' : (m.filter || U.pick(C.VARIANT)), fx: m.fx,
        hp, max: hp, elite: !!elite, trait, shell: trait === 'shell', charged: false, cnt: 0, left: treasure ? Math.max(2, Math.min(4, items)) : 0
      };
    }

    /* ---------- 畫面：場景只在換主題時重畫；勇者只建一次（出招動畫才不會被打斷）；怪物區與 HUD 分開更新 ---------- */
    function drawBattle() {
      lb.style.display = D.cfg.battle ? '' : 'none';
      U.$('#lpBattle').textContent = D.cfg.battle ? '⚔ 戰鬥中' : '🕊 平靜模式';
      if (!D.cfg.battle) return;
      const th = B.boss ? FX.THEMES[lvIdx % 2 ? 5 : 4] : FX.THEMES[[2, 1, 3, 0][Math.max(0, lvIdx) % 4]];
      let sc = lb.querySelector('.lb-scene');
      if (!sc || sc.dataset.th !== th.id) {
        if (sc) sc.remove();
        sc = U.h(`<div class="lb-scene theme-${th.id}" data-th="${th.id}">${FX.stageBG(null, th, false)}</div>`);
        lb.insertBefore(sc, lb.firstChild);
      }
      if (!lb.querySelector('.lb-fg')) {
        const pet = Store.profile.activePet;
        lb.appendChild(U.h(`<div class="lb-fg">
          <div class="lb-hud"><span class="lb-hp" id="lbHp"></span><span class="lb-en" id="lbEn" title="知識能量：讀概念卡、玩互動、每 5 連擊各 +1；集滿 3 點可以放必殺技"></span></div>
          <button class="lb-ult" id="lbUlt" title="${U.esc(ULT.name)}：${U.esc(ULT.desc)}">⚡ 必殺技</button>
          <div class="lb-combo" id="lbCombo"></div>
          <div class="lb-hero" id="lbHero"><span class="lb-hbody" id="lbHeroBody"><i class="shadow"></i>${SP.tile(Store.heroTile(), 150, 'anim-bob')}</span>${pet ? `<span class="lb-pet" id="lbPet">${Store.petHTML(pet, 54)}</span>` : ''}</div>
          <div id="lbMonWrap"></div></div>`));
        U.$('#lbUlt').onclick = ult;
      }
      hud(); drawMon();
    }
    function hud() {
      const hp = U.$('#lbHp'); if (!hp) return;
      hp.innerHTML = `${'❤'.repeat(Math.max(0, B.hp))}<i>${'❤'.repeat(Math.max(0, B.max - B.hp))}</i>${B.shield ? ' 🛡' : ''}`;
      U.$('#lbEn').innerHTML = `${'⚡'.repeat(B.en)}<i>${'⚡'.repeat(3 - B.en)}</i>`;
      const u = U.$('#lbUlt'); u.classList.toggle('ready', B.en >= 3 && !!monAt()); u.disabled = !(B.en >= 3 && monAt());
      const cb = U.$('#lbCombo');
      [['on', B.combo >= 2], ['t1', B.combo >= 3 && B.combo < 6], ['t2', B.combo >= 6 && B.combo < 10], ['t3', B.combo >= 10]].forEach(([c, v]) => cb.classList.toggle(c, v));
      cb.innerHTML = B.combo >= 2 ? `<b>${B.combo}</b><small>連擊</small><em>×${(1 + 0.15 * Math.min(B.combo - 1, 8)).toFixed(2)}</em>` : '';
    }
    function intentOf(m) {
      if (B.boss && m.enraged) return '<span class="lb-int red">🔥 暴怒：每題都在蓄力</span>';
      if (m.charged) return '<span class="lb-int red">⚡ 蓄力中！答對可破防</span>';
      if (m.trait === 'shell' && m.shell) return '<span class="lb-int">🛡 硬殼</span>';
      if (m.trait === 'treasure') return `<span class="lb-int gold">💰 ${m.left} 題後逃走</span>`;
      if (m.trait === 'charge') return `<span class="lb-int">⏳ 再 ${2 - (m.cnt % 2)} 題蓄力</span>`;
      return '';
    }
    function drawMon() {
      const w = U.$('#lbMonWrap'); if (!w) return;
      const m = monAt();
      if (m) {
        const key = m.name + '|' + m.max;
        if (w.dataset.k !== key || !U.$('#lbMon')) {
          w.dataset.k = key;
          w.innerHTML = `<div class="lb-mon ${B.boss ? 'boss' : ''} ${m.trait ? 'tr-' + m.trait : ''}" id="lbMon" ${m.trait ? `title="${U.esc(TRAIT[m.trait].name)}：${U.esc(TRAIT[m.trait].desc)}"` : ''}>
            <div class="lb-intent" id="lbInt"></div><div class="lb-mname">${U.esc(m.name)}</div><div class="bar lb-mbar"><i id="lbMbar"></i></div>
            <span class="lb-mbody" id="lbMonBody"><i class="shadow"></i>${SP.icon(m.tile, B.boss ? 136 : m.elite ? 112 : 96, 'anim-bob', `filter:${m.filter};transform:scaleX(-1)`)}</span></div>`;
          const el = U.$('#lbMon'); el.classList.add('anim-pop');
        }
        U.$('#lbMbar').style.width = U.pct(m.hp, m.max) + '%';
        U.$('#lbInt').innerHTML = intentOf(m);
        U.$('#lbMon').classList.toggle('charged', !!(m.charged || m.enraged));
      } else if (B.chest) {
        if (w.dataset.k !== 'chest') {
          w.dataset.k = 'chest';
          w.innerHTML = `<button class="lb-chest" id="lbChest" title="完美清場的寶箱，點開它！"><span class="lb-mname gold-t">完美清場！</span>${SP.icon(C.NODES.treasure.icon, 64, 'anim-bob')}</button>`;
          U.$('#lbChest').onclick = openChest;
        }
      } else {
        w.dataset.k = 'empty';
        w.innerHTML = `<div class="lb-mon empty small-t dim">${B.kills ? `已擊敗 ${B.kills} 隻` : '四周很安靜…'}</div>`;
      }
      hud();
    }
    function fxText(where, text, cls) {
      const el = U.$(where === 'mon' ? '#lbMonBody' : where === 'pet' ? '#lbPet' : '#lbHeroBody'); if (!el) return;
      const a = lb.getBoundingClientRect(), b = el.getBoundingClientRect();
      const d = U.h(`<div class="dmg ${cls || ''}" style="left:${b.left - a.left + b.width / 2 - 24}px;top:${Math.max(4, b.top - a.top + 4)}px">${text}</div>`);
      lb.appendChild(d); setTimeout(() => d.remove(), 1000);
    }
    function banner(text, cls) {
      const d = U.h(`<div class="lb-banner ${cls || ''}">${text}</div>`);
      lb.appendChild(d); setTimeout(() => d.remove(), 1300);
    }
    const anim = (sel, c) => { const el = U.$(sel); if (el) { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); } };
    function gemFly(n) {
      const from = U.$('#lbMonBody') || U.$('#lbChest'); if (!from) return;
      const a = lb.getBoundingClientRect(), b = from.getBoundingClientRect();
      const x = b.left - a.left + b.width / 2, y = b.top - a.top + b.height / 2;   // 從怪物身上噴出，飛向左上角的 HUD
      for (let i = 0; i < Math.min(n, 6); i++) {
        const g = U.h(`<i class="lb-gem" style="left:${x}px;top:${y}px;--dx:${U.rnd(-40, 40)}px;--tx:${30 - x}px;--ty:${14 - y}px;animation-delay:${i * 90}ms"></i>`);
        lb.appendChild(g); setTimeout(() => g.remove(), 1100 + i * 90);
      }
      setTimeout(() => SFX.play('coin'), 350);
    }

    function enterSeg() {
      if (!D.cfg.battle) return;
      const k = segOf[st.i];
      if (B.seg === k) return drawBattle();
      if (B.chest) collectChest(true);
      const m = B.mon;
      if (m && m.hp > 0) say(m.trait === 'treasure' ? `${m.name} 帶著寶藏溜走了…` : `${m.name} 趁機溜走了…`);
      B.seg = k; B.mon = null; B.segUsed = 0; B.segWrong = 0;
      const t = l.steps[st.i].type;
      if (segItems[k] > 0 && t !== 'practice') {
        B.mon = newMon(false, segItems[k]);
        const mm = B.mon;
        setTimeout(() => say(mm.trait === 'treasure' ? `是寶藏怪 ${mm.name}！${mm.left} 題內打倒牠！` : mm.trait ? `前方出現了 ${mm.name}（${TRAIT[mm.trait].name}）！` : `前方出現了 ${mm.name}！讀懂觀念再迎戰！`), 400);
      }
      save(); drawBattle();
    }
    function addEnergy(n, why) {
      if (B.en >= 3) return;
      B.en = Math.min(3, B.en + n); anim('#lbHeroBody', 'anim-cast'); fxText('hero', `⚡+${n}${why ? ' ' + why : ''}`, 'heal');
      if (B.en >= 3) { SFX.play('skill'); setTimeout(() => say(`⚡ 能量滿了！可以放「${ULT.name}」！`), 300); }
      hud();
    }
    function gainEnergy() {
      if (!D.cfg.battle || B.seen.includes(st.i)) return;
      B.seen.push(st.i); addEnergy(1); save();
    }
    /* 每一題結束（第一次作答的結果確定後）：記錄本段用掉的題數，怪物意圖前進一格 */
    function battleItem(firstOk) {
      if (!D.cfg.battle) return;
      B.segUsed++; if (!firstOk) B.segWrong++;
      setTimeout(tickMon, 0);   // 等這一題的攻擊／反擊結算完再前進
    }
    function tickMon() {
      const m = monAt(); if (!m) return;
      if (B.boss) { if (m.enraged && !m.charged) { m.charged = true; } drawMon(); return save(); }
      m.cnt++;
      if (m.trait === 'charge' && !m.charged && m.cnt % 2 === 0) { m.charged = true; setTimeout(() => { SFX.play('skill'); fxText('mon', '⚡蓄力', 'crit'); }, 900); }
      if (m.trait === 'treasure' && --m.left <= 0) {
        setTimeout(() => { if (m.hp <= 0 || B.mon !== m) return; anim('#lbMon', 'anim-flee'); say(`${m.name} 帶著寶藏逃走了！下次要打快一點！`); SFX.play('miss'); m.hp = 0; m.fled = true; save(); setTimeout(() => afterKill(m), 600); }, 900);
      }
      setTimeout(drawMon, 950); save();
    }

    /* ---------- 攻擊 ---------- */
    function onRightHit(firstOk) {
      const m = monAt(); if (!D.cfg.battle || !m) return;
      if (firstOk) { B.combo++; B.maxCombo = Math.max(B.maxCombo, B.combo); }
      const mult = firstOk ? 1 + 0.15 * Math.min(B.combo - 1, 8) : 1;
      const crit = firstOk && Math.random() < 0.08 + 0.03 * Math.min(B.combo, 8) + (clsId === 'ranger' ? 0.1 : 0);
      let dmg = (firstOk ? 10 : 5) * mult * (crit ? 1.6 : 1), tags = [];
      if (m.charged && firstOk) { dmg *= 1.5; m.charged = false; tags.push('破防！'); }
      if (m.shell) { if (crit) { m.shell = false; tags.push('殼碎了！'); } else dmg *= 0.6; }
      dmg = Math.max(1, Math.round(dmg));
      const before = m.hp;
      m.hp = Math.max(0, m.hp - dmg);
      const afterMain = m.hp;
      const petHit = firstOk && B.combo >= 4 && B.combo % 4 === 0 && m.hp > 0 && !!U.$('#lbPet');
      if (petHit) m.hp = Math.max(0, m.hp - 6);
      const rage = enrage(m);
      const killed = m.hp <= 0, overkill = killed && (crit || dmg - before >= 8);
      if (firstOk && B.combo % 5 === 0) setTimeout(() => addEnergy(1, `${B.combo}連擊`), 700);
      save();
      // 演出（狀態已經算好，下面只負責畫面）
      hud();
      if (firstOk && B.combo >= 2) { SFX.combo(B.combo); anim('#lbCombo', 'pop'); }
      (async () => {
        await FX.attack(clsId, { crit: false });
        if (crit) { lb.classList.add('hitstop'); await FX.critical(clsId); lb.classList.remove('hitstop'); }
        anim('#lbMonBody', 'anim-hurt'); anim('#lbMon', 'flash-w');
        fxText('mon', (crit ? '暴擊 ' : '') + '-' + dmg, crit ? 'crit' : '');
        tags.forEach((t, i) => setTimeout(() => banner(t, 'gold'), i * 250));
        if (U.$('#lbMbar')) U.$('#lbMbar').style.width = U.pct(afterMain, m.max) + '%';
        if (petHit) {
          await U.sleep(260); anim('#lbPet', 'anim-lunge'); SFX.play('pet');
          await U.sleep(180); anim('#lbMonBody', 'anim-hurt'); fxText('mon', '夥伴追擊 -6', 'heal');
        }
        if (rage) rageFx();
        if (killed) kill(m, overkill); else drawMon();
      })();
    }
    function onWrongHit() {
      const m = monAt(); if (!D.cfg.battle || !m) return;
      const lost = B.combo;
      B.combo = 0;
      let dmg = m.charged ? 2 : 1; const wasCharged = m.charged; m.charged = false;
      const blocked = B.shield > 0; if (blocked) { B.shield = 0; dmg = 0; }
      B.hp -= dmg; if (dmg) B.hurt = (B.hurt || 0) + 1;
      let fell = false;
      if (B.hp <= 0) { B.falls++; B.hp = B.max; fell = true; }
      save();
      hud();
      if (lost >= 3) banner(`${lost} 連擊中斷`, 'dim');
      (async () => {
        await FX.monStrike(m.fx);
        if (blocked) { fxText('hero', '🛡 格擋！', 'miss'); SFX.play('miss'); return drawMon(); }
        anim('#lbHeroBody', 'anim-hurt'); lb.classList.remove('shake', 'hurtflash'); void lb.offsetWidth; lb.classList.add('shake', 'hurtflash');
        SFX.play('hurt'); fxText('hero', `-${dmg}❤` + (wasCharged ? ' 蓄力一擊！' : ''), '');
        if (fell) setTimeout(() => { say('你倒下了……夥伴把你扶起來：「沒關係，再來一次！」'); SFX.play('heal'); }, 450);
        drawMon();
      })();
    }
    function ult() {
      const m = monAt(); if (!m || B.en < 3) return;
      B.en = 0; B.ults++;
      let dmg = ULT.dmg();
      const tags = [];
      if (m.shell) { m.shell = false; tags.push('殼碎了！'); }
      if (m.charged) { m.charged = false; tags.push('打斷蓄力！'); }
      const before = m.hp; m.hp = Math.max(0, m.hp - dmg);
      if (clsId === 'knight') B.shield = 1;
      if (clsId === 'cleric') B.hp = Math.min(B.max, B.hp + 2);
      if (clsId === 'ranger') { B.combo += 2; B.maxCombo = Math.max(B.maxCombo, B.combo); }
      const killed = m.hp <= 0, rage = enrage(m);
      save(); hud();
      banner(`⚡ ${ULT.name}`, 'ult'); say(`「${ULT.name}」！`);
      (async () => {
        lb.classList.add('hitstop'); await FX.critical(clsId); lb.classList.remove('hitstop');
        anim('#lbMonBody', 'anim-hurt'); fxText('mon', '必殺 -' + dmg, 'crit');
        tags.forEach((t, i) => setTimeout(() => banner(t, 'gold'), 300 + i * 250));
        if (clsId === 'cleric') fxText('hero', '+2❤', 'heal');
        if (clsId === 'knight') fxText('hero', '🛡 守護', 'heal');
        if (rage) rageFx();
        if (killed) kill(m, dmg - before >= 8); else drawMon();
      })();
    }
    /* 魔王半血以下進入第二階段：之後每題都在蓄力 */
    function enrage(m) {
      if (!B.boss || m.enraged || m.hp <= 0 || m.hp > m.max / 2) return false;
      m.enraged = true; m.charged = true; save(); return true;
    }
    function rageFx() { banner('👑 魔王暴怒！第二階段', 'red'); SFX.play('boss'); say('魔王暴怒了！之後答錯會受 2 點傷害，答對可以破防！'); lb.classList.add('rage'); }
    function kill(m, overkill) {
      if (m.dead) return; m.dead = true;
      anim('#lbMon', 'anim-die'); SFX.play('kill');
      if (B.boss) return setTimeout(drawMon, 700);   // 魔王的獎勵在 endBoss 結算
      let g = m.trait === 'treasure' ? 3 : m.elite ? 2 : 1;
      if (overkill) { g++; setTimeout(() => banner('OVERKILL！ 魂晶 +1', 'gold'), 200); }
      B.gems += g; B.kills++; D.stat.kills++;
      const bs = Store.profile.bestiary; bs[m.id] = (bs[m.id] || 0) + 1; Store.saveProfile();
      gemFly(g);
      say(`擊敗了 ${m.name}！（魂晶 +${g}）`);
      save();
      setTimeout(() => afterKill(m), 750);
    }
    /* 怪物倒下或逃走後：本段還有題目 → 增援；整段零失誤清場 → 寶箱 */
    function afterKill(m) {
      if (B.boss || !D.cfg.battle || B.mon !== m) return drawMon();   // 已經換段（玩家先按了繼續）就不再補怪
      const k = B.seg, left = (segItems[k] || 0) - B.segUsed;
      if (left > 0) {
        B.mon = newMon(l.steps[st.i] && l.steps[st.i].type === 'practice', left);
        if (B.mon.trait === 'treasure') B.mon.left = Math.max(2, Math.min(left, 3));
        banner('增援出現！', 'red'); say(`${B.mon.name} 衝了過來！`);
      } else if (!B.segWrong && B.segUsed > 0 && !m.fled) {
        B.chest = true; B.mon = null; SFX.play('open');
      }
      save(); drawMon();
    }
    function openChest() {
      if (!B.chest) return;
      const g = 1 + (Math.random() < 0.35 ? 1 : 0);
      gemFly(g); B.gems += g; B.chests++; B.chest = false;
      anim('#lbChest', 'anim-pop'); SFX.play('open'); banner(`寶箱：魂晶 +${g}`, 'gold');
      save(); setTimeout(drawMon, 500);
    }
    function collectChest(silent) { if (!B.chest) return; B.gems += 1; B.chests++; B.chest = false; if (!silent) drawMon(); else U.toast('自動收下寶箱：魂晶 +1'); }
    U.$('#lpBattle').onclick = () => { D.cfg.battle = !D.cfg.battle; save(); SFX.play('click'); if (D.cfg.battle) { B.seg = -1; enterSeg(); } else drawBattle(); };

    function step() {
      cleanupQ();
      const s = l.steps[st.i];
      U.$('#lpCnt').textContent = `${st.i + 1} / ${l.steps.length}`;
      U.$$('#lpPips i').forEach((x, i) => { x.classList.toggle('on', i < st.i); x.classList.toggle('cur', i === st.i); });
      const body = U.$('#lpBody');
      body._key = null;
      body.className = 'lp-body t-' + s.type;
      next.disabled = true; next.textContent = st.i === l.steps.length - 1 ? '完成本課 ✔' : '繼續 ▶';
      next.onclick = () => { SFX.play('click'); st.i++; R.sub = 0; save(); if (st.i >= l.steps.length) bossOrFinish(); else step(); };
      if (s.type !== 'practice') say(U.pick(LINES[s.type]));
      const head = `<div class="lp-type">${STEP[s.type].ic} ${STEP[s.type].name}</div>`;
      window.scrollTo(0, 0);
      enterSeg();
      if (s.type === 'card' || s.type === 'interactive') gainEnergy();

      if (s.type === 'intro') {
        body.innerHTML = head + `<h3>${U.esc(s.title || l.title)}</h3>${md(s.body)}` +
          ((l.goals || []).length ? `<div class="lp-goals"><b>🎯 這課學完你會：</b><ul>${l.goals.map(g => `<li>${inl(g)}</li>`).join('')}</ul></div>` : '');
        ready('開始 ▶');
      } else if (s.type === 'card') {
        body.innerHTML = head + `<h3>${U.esc(s.title)}</h3>${imgsHTML(s.img, s.img_source || s.source)}${md(s.body)}` +
          ((s.keys || []).length ? `<div class="lp-keys"><b>📌 重點</b><ul>${s.keys.map(k => `<li>${inl(k)}</li>`).join('')}</ul></div>` : '') +
          (s.tip ? `<div class="lp-tip">🐾 ${inl(s.tip)}</div>` : '');
        ready();
      } else if (s.type === 'check') {
        body.innerHTML = head + '<div class="lc"></div>';
        const box = body.querySelector('.lc');
        renderCheck(box, s, { onWrong: onWrongHit, onDone: (firstOk, ok) => { tally(firstOk); if (ok) onRightHit(firstOk); if (!firstOk) addRev(s.id, true); save(); ready(); next.focus(); } });
        body._key = e => box._key ? box._key(e) : false;
      } else if (s.type === 'diagram') {
        renderDiagram(body, head, s, `${p.id}/${l.id}/${st.i}`, {
          onItem: (firstOk, ok) => { tally(firstOk); if (ok) onRightHit(firstOk); },
          onWrong: onWrongHit, onDone: () => { save(); ready(); next.focus(); }
        });
      } else if (s.type === 'interactive') {
        renderInteractive(body, head, s);
        ready();
      } else if (s.type === 'example') {
        let shown = 0;
        body.innerHTML = head + `<h3>${U.esc(s.title || '範例')}</h3><div class="lp-prob">${md(s.problem)}</div><div class="lp-steps"></div>
          <div class="row" style="justify-content:center"><button class="px-btn blue" id="exNext">💡 看第 1 步</button><button class="px-btn small" id="exAll">全部展開</button></div>`;
        const box = body.querySelector('.lp-steps'), nb = U.$('#exNext'), ab = U.$('#exAll');
        const reveal = () => {
          if (shown < s.steps.length) { box.insertAdjacentHTML('beforeend', `<div class="lp-step"><b>${shown + 1}</b><div>${md(s.steps[shown])}</div></div>`); shown++; SFX.play('click'); }
          if (shown < s.steps.length) nb.textContent = `💡 看第 ${shown + 1} 步`;
          else { nb.parentElement.remove(); if (s.answer) box.insertAdjacentHTML('beforeend', `<div class="lp-exans">✅ ${md(s.answer)}</div>`); ready(); next.focus(); }
        };
        nb.onclick = reveal; ab.onclick = () => { while (shown < s.steps.length) reveal(); };
        body._key = e => { if (e.key === 'Enter' && document.body.contains(nb)) { reveal(); return true; } return false; };
      } else if (s.type === 'practice') {
        const pk = R.pk[st.i] || (R.pk[st.i] = { items: [] });
        if (!pk.items.length) {
          (s.qids || []).filter(q => Store.Q[q]).forEach(q => pk.items.push({ q }));
          if (s.pick) pickQ(s.pick, s.pick.n || 2, p.subject).filter(q => !pk.items.some(x => x.q === q)).forEach(q => pk.items.push({ q }));
          (s.checks || []).forEach((c, i) => pk.items.push({ c: i }));
          save();
        }
        if (!pk.items.length) { body.innerHTML = head + '<p class="dim">（這個實戰找不到可用的題目，先跳過）</p>'; ready(); return; }
        if (D.cfg.battle && !B.mon && !pk.fought) { B.mon = newMon(true, pk.items.length); pk.fought = true; save(); drawBattle(); setTimeout(() => say(`精英怪 ${B.mon.name} 擋住了去路！`), 300); }
        sub();
        function sub() {
          cleanupQ();
          const it = pk.items[R.sub], last = R.sub >= pk.items.length - 1;
          body.innerHTML = head + `<div class="row"><b>${U.esc(s.title || '實戰')}</b><span class="grow"></span><span class="tag">第 ${R.sub + 1} / ${pk.items.length} 題</span>${it.q ? '<span class="tag gold-t">題庫題</span>' : ''}</div><div class="lp-q mt"></div>`;
          const box = body.querySelector('.lp-q');
          say(it.q ? U.pick(LINES.practice) : '這題是自編的練習題！');
          next.disabled = true;
          next.textContent = last ? (st.i === l.steps.length - 1 ? '完成本課 ✔' : '繼續 ▶') : '下一題 ▶';
          next.onclick = () => { SFX.play('click'); if (!last) { R.sub++; save(); sub(); } else { st.i++; R.sub = 0; save(); if (st.i >= l.steps.length) bossOrFinish(); else step(); } };
          if (it.q) {
            const q = Store.Q[it.q];
            ctl = QV.render(box, q, { mode: 'learn', onAnswer: res => { Store.record(q.id, res.ok); SFX.play(res.ok ? 'correct' : 'wrong'); say(res.ok ? U.pick(LINES.ok) : '這題已經收進錯題本，之後可以重刷。'); tally(res.ok); if (res.ok) onRightHit(true); else onWrongHit(); ready(); } });
            body._key = null;
          } else {
            const c = s.checks[it.c];
            renderCheck(box, c, { onWrong: onWrongHit, onDone: (firstOk, ok) => { tally(firstOk); if (ok) onRightHit(firstOk); if (!firstOk) addRev(c.id, true); save(); ready(); next.focus(); } });
            body._key = e => box._key ? box._key(e) : false;
          }
        }
      } else if (s.type === 'recap') {
        body.innerHTML = head + `<h3>本課重點</h3><ol class="lp-recap">${s.points.map(x => `<li>${inl(x)}</li>`).join('')}</ol>` +
          ((s.flash || []).length ? `<div class="lp-flashes">${s.flash.map(f => `<div class="flash" tabindex="0"><div class="f-front">${inl(f.front)}</div><div class="f-back">${inl(f.back)}</div></div>`).join('')}</div><p class="dim small-t center">點卡片翻面。本課的記憶卡會放進「複習」，明天開始提醒你。</p>` : '') +
          (s.next ? `<p class="lp-next">➡ ${inl(s.next)}</p>` : '');
        U.$$('.flash', body).forEach(f => f.onclick = () => { f.classList.toggle('flip'); SFX.play('click'); });
        ready('完成本課 ✔');
      }
    }

    /* 課末魔王：從本課的檢核題抽 3～5 題，不給提示 */
    function bossOrFinish() {
      const pool = [];
      l.steps.forEach(x => { if (x.type === 'check') pool.push(x); if (x.type === 'practice') (x.checks || []).forEach(c => pool.push(c)); });
      if (!D.cfg.battle || pool.length < 2 || B.bossDone) return finish();
      const qs = U.shuffle(pool).slice(0, Math.min(5, Math.max(3, Math.ceil(pool.length / 2))));
      const th = C.bossTheme(p.subject), bd = U.pick(C.BOSS_DEFS[th]);
      if (B.chest) collectChest(true);
      B.mon = null; B.boss = { name: bd.name, tile: bd.tile, filter: bd.filter, fx: bd.fx, hp: qs.length * 12, max: qs.length * 12, line: bd.line };
      drawBattle(); SFX.play('boss'); banner(`👑 課末魔王 ${U.esc(bd.name)}`, 'red');
      U.$$('#lpPips i').forEach(x => x.classList.add('on'));
      const body = U.$('#lpBody'); let k = 0, right = 0;
      body.className = 'lp-body t-boss';
      const one = () => {
        if (k >= qs.length || B.boss.hp <= 0) return endBoss();
        cleanupQ();
        U.$('#lpCnt').textContent = `魔王戰 ${k + 1} / ${qs.length}`;
        body.innerHTML = `<div class="lp-type">👑 課末魔王</div>${k === 0 ? `<p class="lb-line">「${U.esc(B.boss.line)}」</p>` : ''}<div class="dim small-t">總複習：不給提示，答對就攻擊魔王！</div><div class="lc mt"></div>`;
        const box = body.querySelector('.lc'), c = qs[k];
        next.disabled = true; next.textContent = '下一擊 ▶';
        next.onclick = () => { SFX.play('click'); k++; one(); };
        renderCheck(box, c, { allowHint: false, onWrong: onWrongHit, onDone: (firstOk, ok) => { if (ok) { right++; onRightHit(firstOk); } else addRev(c.id, true); setTimeout(tickMon, 0); save(); ready(k >= qs.length - 1 || B.boss.hp <= 0 ? '結算 ▶' : '下一擊 ▶'); next.focus(); } });
        body._key = e => box._key ? box._key(e) : false;
      };
      const endBoss = () => {
        cleanupQ();
        const win = B.boss.hp <= 0; B.bossDone = true; B.bossWin = win; lb.classList.remove('rage');
        if (win) { B.gems += 4; D.stat.bosses++; const bs = Store.profile.bestiary; bs['boss:' + B.boss.name] = (bs['boss:' + B.boss.name] || 0) + 1; Store.saveProfile(); }
        save();
        body.innerHTML = `<div class="center"><h3>${win ? `👑 擊敗魔王「${U.esc(B.boss.name)}」！` : `魔王「${U.esc(B.boss.name)}」撤退了…`}</h3><p>${win ? '這課的觀念你已經掌握了！魂晶 +4' : '答錯的題目已放進複習盒，下次再來挑戰。'}</p></div>`;
        say(win ? '太帥了！魔王被打倒了！' : '差一點！下次一定可以！');
        if (win) { SFX.play('win'); banner('👑 討伐成功！', 'gold'); }
        next.disabled = false; next.textContent = '完成本課 ✔'; next.onclick = () => { SFX.play('click'); finish(); };
      };
      say(`課末魔王「${bd.name}」出現了！`);
      one();
    }

    function finish() {
      cleanup();
      const acc = R.n ? R.ok / R.n : 1;
      const star = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
      const first = !st.done;
      const bt = R.bt || {};
      // 戰鬥評等：S＝90% 以上第一次答對＋沒倒下＋（有魔王就要討伐成功）＋連擊夠長；倒下最高 B
      const RK = ['C', 'B', 'A', 'S'];
      const rank = bt.seg === undefined || !D.cfg.battle ? '' :
        acc >= 0.9 && !bt.falls && (!bt.bossDone || bt.bossWin) && (bt.maxCombo || 0) >= Math.min(5, R.n) ? 'S' :
        acc >= 0.75 && !bt.falls ? 'A' : acc >= 0.5 ? 'B' : 'C';
      const rankGem = rank === 'S' ? 3 : rank === 'A' ? 1 : 0;
      const newBestRank = rank && RK.indexOf(rank) > RK.indexOf(st.rank || '');
      if (newBestRank) st.rank = rank;
      const gain = (first ? 3 + star * 2 : (star > (st.best || 0) ? (star - (st.best || 0)) * 2 : 0)) + (bt.gems || 0) + rankGem;
      st.done = (st.done || 0) + 1; st.best = Math.max(st.best || 0, star); st.last = Date.now(); st.run = null; st.i = 0;
      D.stat.lessons++;
      l.steps.forEach(s => { if (s.type === 'card' && s.flash) addRev(s.flash.id); if (s.type === 'recap') (s.flash || []).forEach(f => addRev(f.id)); });
      save();
      if (gain) Store.addGems(gain);
      const ups = Store.addAccXp(first ? 25 : 8);
      Store.petXp && Store.petXp(first ? 12 : 4);
      SFX.play('win');
      const idx = p.lessons.indexOf(l), nl = p.lessons[idx + 1];
      const mins = Math.max(1, Math.round((Date.now() - (R.t0 || Date.now())) / 60000));
      scr().innerHTML = `<div class="panel learn lp-done center">
        <h2>🎉 完成「${U.esc(l.title)}」</h2>
        ${rank ? `<div class="lp-rank r-${rank}"><b>${rank}</b><small>${newBestRank ? '新紀錄！' : '戰鬥評等'}</small></div>` : ''}
        <div class="lp-stars">${stars(star).split('').map((c, i) => `<span style="animation-delay:${i * .25}s" class="${c === '★' ? 'on' : ''}">${c}</span>`).join('')}</div>
        <p>第一次就答對 <b class="gold-t">${R.ok}</b> / ${R.n} 題（${U.pct(R.ok, R.n)}%）・用時約 ${mins} 分鐘</p>
        ${bt.seg !== undefined && (bt.kills || bt.bossDone) ? `<p>⚔ 擊敗怪物 ${bt.kills || 0} 隻${bt.maxCombo >= 2 ? `・最高 <b class="gold-t">${bt.maxCombo}</b> 連擊` : ''}${bt.chests ? `・寶箱 ${bt.chests} 個` : ''}${bt.bossDone ? `・課末魔王 ${bt.bossWin ? '<b class="gold-t">討伐成功</b>' : '撤退'}` : ''}${bt.falls ? `・倒下 ${bt.falls} 次` : bt.hurt ? `・受傷 ${bt.hurt} 次` : '・<b class="green-t">無傷通關</b>'}</p>` : ''}
        <p>${gain ? `獲得 <b class="purple-t">${gain}</b> 魂晶${rankGem ? `（評等 ${rank} 加成 +${rankGem}）` : ''}・` : ''}帳號經驗 +${first ? 25 : 8}${ups ? '・<b class="gold-t">帳號升級！</b>' : ''}</p>
        <p class="dim small-t">答錯的檢核題與本課記憶卡已放進「🔁 複習」。</p>
        <div class="row mt" style="justify-content:center">
          <button class="px-btn" id="dBack">回單元</button>
          ${nl ? `<button class="px-btn gold big" id="dNext">下一課：${U.esc(nl.title)} ▶</button>` : `<button class="px-btn gold" id="dRev">去複習</button>`}
        </div></div>`;
      U.$('#dBack').onclick = () => packView(p);
      if (nl) U.$('#dNext').onclick = () => play(p, nl);
      else U.$('#dRev').onclick = () => { tab = 'review'; screen(); };
    }
    drawBattle();
    step();
  }

  /* ---------- 圖解：標記點探索＋點選辨識測驗 ----------
   * step: { img, points:[{x,y,name,desc}], mode:'both'|'explore'|'quiz', body, source }  x/y 為圖片寬高的百分比 */
  function renderDiagram(body, head, s, pinKey, cb) {
    D.pins = D.pins || {};
    const ov = D.pins[pinKey] || {};
    const pts = s.points.map((pt, i) => Object.assign({}, pt, ov[i] ? { x: ov[i][0], y: ov[i][1] } : {}));
    const mode = s.mode || 'both';
    const unplaced = pts.map((pt, i) => (pt.x == null || pt.y == null || isNaN(pt.x) || isNaN(pt.y)) ? i : -1).filter(i => i >= 0);
    body.innerHTML = head + `<h3>${U.esc(s.title || '看圖認識')}</h3>${s.body ? md(s.body) : ''}
      <div class="dg"><div class="dg-wrap" id="dgWrap"><img src="${U.esc(U.img(s.img))}" alt="">${pts.map((pt, i) => `<button class="dg-pin" data-i="${i}" style="left:${pt.x}%;top:${pt.y}%">${i + 1}</button>`).join('')}</div>
      <div class="dg-side" id="dgSide"></div></div>${s.source ? `<div class="lp-src">圖片來源：${inl(s.source)}</div>` : ''}`;
    const side = U.$('#dgSide'), pins = U.$$('.dg-pin', body), wrap = U.$('#dgWrap');
    const place = () => pins.forEach((b, i) => { const ok = pts[i].x != null && !isNaN(pts[i].x); b.style.display = ok ? '' : 'none'; if (ok) { b.style.left = pts[i].x + '%'; b.style.top = pts[i].y + '%'; } });
    place();
    /* 標記位置設定：AI 沒給座標、或位置不準時，依序點圖上的正確位置（存在這台電腦） */
    const setup = (list, then) => {
      let k = 0;
      const askPin = () => {
        if (k >= list.length) { wrap.onclick = null; wrap.classList.remove('setting'); D.pins[pinKey] = Object.fromEntries(pts.map((pt, i) => [i, [pt.x, pt.y]]).filter(([, v]) => v[0] != null)); save(); SFX.play('correct'); then(); return; }
        const i = list[k];
        side.innerHTML = `<div class="dg-info"><b class="gold-t">📍 設定標記位置（${k + 1}/${list.length}）</b><p>請在圖上點出「<b>${U.esc(pts[i].name)}</b>」的位置${pts[i].x != null ? '（目前位置已標示，點新的位置修正）' : ''}。</p>
          <div class="row"><button class="px-btn small" id="dgSkip">${pts[i].x != null ? '位置正確，下一個' : '跳過'}</button><button class="px-btn small" id="dgStop">完成</button></div><p class="dim small-t">設定只存在這台電腦的瀏覽器。</p></div>`;
        pins.forEach((b, j) => b.classList.toggle('on', j === i));
        U.$('#dgSkip').onclick = e => { e.stopPropagation(); k++; askPin(); };
        U.$('#dgStop').onclick = e => { e.stopPropagation(); k = list.length; askPin(); };
      };
      wrap.classList.add('setting');
      wrap.onclick = e => {
        if (k >= list.length) return;
        const r = wrap.querySelector('img').getBoundingClientRect();
        const i = list[k]; pts[i].x = Math.round((e.clientX - r.left) / r.width * 1000) / 10; pts[i].y = Math.round((e.clientY - r.top) / r.height * 1000) / 10;
        place(); SFX.play('click'); k++; askPin();
      };
      askPin();
    };
    let hide = false;
    const explore = () => {
      side.innerHTML = `<div class="dg-info" id="dgInfo"><span class="dim">點圖上的數字（或下面的名稱）看說明</span></div>
        <ol class="dg-list">${pts.map((pt, i) => `<li data-i="${i}"><span class="dg-name ${hide ? 'hid' : ''}">${U.esc(pt.name)}</span></li>`).join('')}</ol>
        <div class="row"><button class="px-btn small" id="dgHide">${hide ? '顯示名稱' : '遮住名稱（自我測驗）'}</button><button class="px-btn small" id="dgFix" title="標記位置不準時，可以自己修正">📍 調整標記</button>${mode !== 'explore' ? '<button class="px-btn gold" id="dgQuiz">🎯 開始辨識測驗</button>' : ''}</div>`;
      const show = i => { pins.forEach((b, j) => b.classList.toggle('on', j === i)); U.$$('.dg-list li', side).forEach((li, j) => li.classList.toggle('on', j === i)); U.$('#dgInfo').innerHTML = `<b class="gold-t">${i + 1}. ${U.esc(pts[i].name)}</b>${pts[i].desc ? md(pts[i].desc) : ''}`; SFX.play('click'); };
      pins.forEach(b => b.onclick = () => show(+b.dataset.i));
      U.$$('.dg-list li', side).forEach(li => li.onclick = () => show(+li.dataset.i));
      U.$('#dgHide').onclick = () => { hide = !hide; explore(); };
      U.$('#dgFix').onclick = () => setup(pts.map((pt, i) => i), explore);
      const qb = U.$('#dgQuiz'); if (qb) qb.onclick = quiz;
      if (mode === 'explore') cb.onDone();
    };
    const quiz = () => {
      const qs = U.shuffle(pts.map((pt, i) => i).filter(i => pts[i].x != null && !isNaN(pts[i].x))).slice(0, Math.min(5, pts.length));
      let k = 0, tries = 0;
      pins.forEach(b => b.classList.remove('on', 'good', 'bad'));
      const ask = () => {
        if (k >= qs.length) { side.innerHTML = `<div class="dg-info"><b class="green-t">辨識測驗完成！</b><p class="small-t">可以再點圖上的數字複習。</p></div>`; pins.forEach(b => { b.onclick = () => { const i = +b.dataset.i; side.innerHTML = `<div class="dg-info"><b class="gold-t">${i + 1}. ${U.esc(pts[i].name)}</b>${pts[i].desc ? md(pts[i].desc) : ''}</div>`; }; }); cb.onDone(); return; }
        tries = 0;
        side.innerHTML = `<div class="dg-info"><span class="dim small-t">第 ${k + 1} / ${qs.length} 題</span><p class="dg-ask">哪一個是「<b class="gold-t">${U.esc(pts[qs[k]].name)}</b>」？</p><div id="dgFb" class="small-t"></div></div>`;
        pins.forEach(b => b.onclick = () => {
          const i = +b.dataset.i, want = qs[k];
          if (i === want) {
            b.classList.add('good'); SFX.play('correct'); cb.onItem(tries === 0, true);
            U.$('#dgFb').innerHTML = `<b class="green-t">✔ 正確！</b>${pts[want].desc ? md(pts[want].desc) : ''}`;
            pins.forEach(x => x.onclick = null); k++; setTimeout(() => { pins.forEach(x => x.classList.remove('good', 'bad')); ask(); }, 1300);
          } else {
            tries++; b.classList.add('bad'); SFX.play('wrong'); cb.onWrong();
            setTimeout(() => b.classList.remove('bad'), 500);
            U.$('#dgFb').innerHTML = `<span class="red-t">那是「${U.esc(pts[i].name)}」。</span>${tries >= 2 ? '' : '再找找看！'}`;
            if (tries >= 2) {
              pins[want].classList.add('good'); cb.onItem(false, false); addRevDiagram();
              pins.forEach(x => x.onclick = null); k++; setTimeout(() => { pins.forEach(x => x.classList.remove('good', 'bad')); ask(); }, 1800);
            }
          }
        });
      };
      ask();
    };
    const addRevDiagram = () => {};
    const start = () => (mode === 'quiz' ? quiz() : explore());
    if (unplaced.length) { side.innerHTML = ''; setup(unplaced, start); } else start();
  }

  /* ---------- 互動／動畫內容：AI 產生的獨立 HTML，放在沙盒 iframe 裡執行 ---------- */
  function renderInteractive(body, head, s) {
    body.innerHTML = head + `<h3>${U.esc(s.title || '動手玩')}</h3>${s.body ? md(s.body) : ''}${s.task ? `<div class="lp-keys"><b>🎯 任務</b>${md(s.task)}</div>` : ''}
      <div class="lp-iwrap"><iframe class="lp-iframe" sandbox="allow-scripts" style="height:${U.clamp(Number(s.height) || 440, 200, 900)}px" title="互動內容"></iframe></div>
      <div class="row" style="justify-content:flex-end"><button class="px-btn small" id="iBig">⛶ 放大</button><button class="px-btn small" id="iReset">↻ 重新開始</button></div>`;
    const fr = body.querySelector('iframe');
    const doc = /<html[\s>]/i.test(s.html) ? s.html : `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:system-ui,'Microsoft JhengHei',sans-serif;background:#fbf7ec;color:#2e2116}</style></head><body>${s.html}</body></html>`;
    fr.srcdoc = doc;
    U.$('#iReset').onclick = () => { fr.srcdoc = ''; setTimeout(() => { fr.srcdoc = doc; }, 30); };
    U.$('#iBig').onclick = () => {
      const m = U.modal({ title: s.title || '互動內容', body: '<iframe class="lp-iframe big" sandbox="allow-scripts"></iframe>' });
      m.el.classList.add('wide'); m.body.querySelector('iframe').srcdoc = doc;
    };
  }

  /* ---------- 複習（間隔重複） ---------- */
  /* 範圍：科目 → path 各層 → 單元 → 課；cfg.rv = { s 科目, r 範圍（g:科目␁層…／p:單元 id）, l 課 id, mode due|all, n 張數 } */
  const RSEP = '\u0001';
  const relPath = p => { const pth = pathOf(p), nm = C.SUBJECTS[p.subject] ? C.SUBJECTS[p.subject].name : ''; return pth[0] === nm || pth[0] === p.subject ? pth.slice(1) : pth; };
  function reviewHome() {
    const body = U.$('#learnBody');
    const cf = D.cfg.rv = Object.assign({ s: 'all', r: '', l: '', mode: 'due', n: 20 }, D.cfg.rv || {});
    const now = Date.now();
    const all = Object.keys(D.rev).filter(id => ITEMS[id] && PK[ITEMS[id].p]);
    const isDue = id => D.rev[id].due <= now;
    const totalDue = all.filter(isDue).length;
    const subs = [...new Set(all.map(id => PK[ITEMS[id].p].subject))].filter(s => C.SUBJECTS[s]);
    if (cf.s !== 'all' && !subs.includes(cf.s)) Object.assign(cf, { s: 'all', r: '', l: '' });
    const inS = cf.s === 'all' ? all : all.filter(id => PK[ITEMS[id].p].subject === cf.s);
    const inR = (id, r) => {
      if (!r) return true;
      const p = PK[ITEMS[id].p];
      if (r.startsWith('p:')) return p.id === r.slice(2);
      const [s, ...g] = r.slice(2).split(RSEP), rp = relPath(p);
      return p.subject === s && g.every((x, i) => rp[i] === x);
    };
    // 範圍選單：依單元原本順序列出 path 各層與單元（只列有複習卡的）
    const ropts = [];
    if (cf.s !== 'all') {
      const seen = new Set(), has = new Set(inS.map(id => ITEMS[id].p));
      packs.forEach(p => {
        if (p.subject !== cf.s || !has.has(p.id)) return;
        const rp = relPath(p);
        rp.forEach((name, k) => { const v = 'g:' + [cf.s, ...rp.slice(0, k + 1)].join(RSEP); if (!seen.has(v)) { seen.add(v); ropts.push({ v, label: name, d: k, g: 1 }); } });
        ropts.push({ v: 'p:' + p.id, label: p.title, d: rp.length });
      });
    }
    if (cf.r && !ropts.some(o => o.v === cf.r)) Object.assign(cf, { r: '', l: '' });
    const inRange = inS.filter(id => inR(id, cf.r));
    const lpack = cf.r.startsWith('p:') ? PK[cf.r.slice(2)] : null;
    const lopts = lpack ? lpack.lessons.filter(l => inRange.some(id => ITEMS[id].l === l.id)) : [];
    if (cf.l && !lopts.some(l => l.id === cf.l)) cf.l = '';
    const scope = cf.l ? inRange.filter(id => ITEMS[id].l === cf.l) : inRange;
    const sDue = scope.filter(isDue);
    const pool = cf.mode === 'due' ? sDue : U.shuffle(sDue).concat(U.shuffle(scope.filter(id => !isDue(id))).sort((a, b) => D.rev[a].box - D.rev[b].box));
    const take = cf.n ? Math.min(cf.n, pool.length) : pool.length;
    const cnt = ids => `到期 ${ids.filter(isDue).length}／共 ${ids.length}`;
    const boxes = BOX_DAYS.slice(1).map((d, i) => scope.filter(id => D.rev[id].box === i + 1).length);
    const soon = scope.filter(id => D.rev[id].due > now && D.rev[id].due < now + DAY).length;
    const narrowed = cf.s !== 'all' || cf.r || cf.l;
    body.innerHTML = `<div class="row"><div><h3 style="margin:0">今天要複習 <span class="gold-t">${totalDue}</span> 張${narrowed ? `<span class="dim small-t">（此範圍到期 ${sDue.length} 張）</span>` : ''}</h3>
        <div class="dim small-t">答錯的檢核題會立刻進來；完成一課後，記憶卡隔天開始出現。答對就升一盒、間隔拉長，答錯回第 1 盒。</div></div>
        <span class="grow"></span><button class="px-btn gold big" id="rvGo" ${take ? '' : 'disabled'}>開始複習${take ? `（${take} 張）` : ''} ▶</button></div>
      <div class="rv-scope mt">
        <div class="row">${[['all', '全部科目']].concat(subs.map(x => [x, C.SUBJECTS[x].name])).map(([v, l]) => `<span class="chip ${cf.s === v ? 'on' : ''}" data-rvs="${v}">${l}</span>`).join('')}</div>
        <div class="row mt">
          <label class="small-t">範圍 <select class="px-in" id="rvR" ${cf.s === 'all' ? 'disabled' : ''}><option value="">${cf.s === 'all' ? '先選科目再縮小範圍' : `整個科目（${cnt(inS)}）`}</option>${ropts.map(o => `<option value="${U.esc(o.v)}" ${cf.r === o.v ? 'selected' : ''}>${'　'.repeat(o.d)}${o.g ? '📁 ' : '📘 '}${U.esc(o.label)}（${cnt(inS.filter(id => inR(id, o.v)))}）</option>`).join('')}</select></label>
          ${lopts.length ? `<label class="small-t">課 <select class="px-in" id="rvL"><option value="">整個單元（${cnt(inRange)}）</option>${lopts.map(l => `<option value="${U.esc(l.id)}" ${cf.l === l.id ? 'selected' : ''}>${U.esc(l.title)}（${cnt(inRange.filter(id => ITEMS[id].l === l.id))}）</option>`).join('')}</select></label>` : ''}
        </div>
        <div class="row mt"><span class="small-t">卡片</span>${[['due', '只複習到期的'], ['all', '全部（提前複習）']].map(([v, l]) => `<span class="chip ${cf.mode === v ? 'on' : ''}" data-rvm="${v}">${l}</span>`).join('')}
          <span class="small-t" style="margin-left:12px">一次</span>${[10, 20, 50, 0].map(v => `<span class="chip ${cf.n === v ? 'on' : ''}" data-rvn="${v}">${v || '不限'}</span>`).join('')}</div>
        ${cf.mode === 'all' ? '<div class="dim small-t">提前複習：到期的先出；還沒到期的卡答對不會升盒（不打亂排程），答錯照樣回第 1 盒。</div>' : ''}
      </div>
      <div class="rv-boxes mt">${boxes.map((n, i) => `<div class="rv-box"><b>${n}</b><small>第 ${i + 1} 盒<br>${BOX_DAYS[i + 1]} 天後</small></div>`).join('')}</div>
      <p class="dim small-t">${narrowed ? '此範圍' : '全部'}共 ${scope.length} 張・24 小時內還會到期 ${soon} 張・累計複習 ${D.stat.reviews} 次</p>`;
    const re = () => { save(); reviewHome(); };
    U.$$('[data-rvs]', body).forEach(c => c.onclick = () => { SFX.play('click'); Object.assign(cf, { s: c.dataset.rvs, r: '', l: '' }); re(); });
    U.$$('[data-rvm]', body).forEach(c => c.onclick = () => { SFX.play('click'); cf.mode = c.dataset.rvm; re(); });
    U.$$('[data-rvn]', body).forEach(c => c.onclick = () => { SFX.play('click'); cf.n = +c.dataset.rvn; re(); });
    U.$('#rvR').onchange = e => { cf.r = e.target.value; cf.l = ''; re(); };
    const ls = U.$('#rvL'); if (ls) ls.onchange = e => { cf.l = e.target.value; re(); };
    U.$('#rvGo').onclick = () => reviewRun(U.shuffle(pool.slice(0, take)));
  }
  function reviewRun(ids) {
    cleanup();
    let i = 0, right = 0;
    scr().innerHTML = `<div class="panel learn lp">
      <div class="row lp-head"><button class="px-btn small" id="lpExit">✕ 結束</button><div class="grow lp-title"><b>複習</b></div><span class="lp-cnt" id="lpCnt"></span></div>
      <div class="bar" style="height:10px"><i id="rvBar" style="width:0;background:var(--green)"></i></div>
      <div class="lp-body" id="lpBody"></div>
      <div class="lp-foot">${petBox()}<span class="grow"></span><button class="px-btn gold big" id="lpNext" disabled>下一張 ▶</button></div></div>`;
    const next = U.$('#lpNext');
    U.$('#lpExit').onclick = () => { cleanup(); save(); tab = 'review'; screen(); };
    keyH = e => {
      if (document.querySelector('.modal-bg') || !document.body.contains(next)) return;
      const body = U.$('#lpBody');
      if (body && body._key && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && body._key(e)) { e.preventDefault(); return; }
      if ((e.key === 'Enter' || e.key === ' ') && !next.disabled && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); next.click(); }
    };
    document.addEventListener('keydown', keyH);
    say('來複習吧！記得的就升級～');
    function show() {
      if (i >= ids.length) return done();
      const id = ids[i], it = ITEMS[id], p = PK[it.p], l = p.lessons.find(x => x.id === it.l);
      U.$('#lpCnt').textContent = `${i + 1} / ${ids.length}`;
      U.$('#rvBar').style.width = U.pct(i, ids.length) + '%';
      const body = U.$('#lpBody'); body._key = null;
      next.disabled = true;
      const from = `<div class="dim small-t">${C.SUBJECTS[p.subject].name}・${U.esc(p.title)}・${U.esc(l ? l.title : '')}　<span class="tag">第 ${D.rev[id].box} 盒</span></div>`;
      const early = D.rev[id].due > Date.now(); // 提前複習：答對不升盒，答錯照樣回第 1 盒
      const after = ok => { if (early && ok) D.rev[id].n++; else gradeRev(id, ok); D.stat.reviews++; if (ok) right++; save(); next.disabled = false; next.focus(); };
      next.onclick = () => { SFX.play('click'); i++; show(); };
      if (it.k === 'flash') {
        body.className = 'lp-body t-card';
        body.innerHTML = from + `<div class="flash big mt" id="fc"><div class="f-front">${inl(it.c.front)}</div><div class="f-back">${inl(it.c.back)}</div></div>
          <div class="row mt" style="justify-content:center" id="fcRow"><button class="px-btn blue" id="fcFlip">翻面 ⏎</button></div>`;
        const fc = U.$('#fc'), row = U.$('#fcRow');
        const flip = () => {
          fc.classList.add('flip'); SFX.play('click');
          row.innerHTML = '<button class="px-btn red" id="fcNo">✘ 忘了（1）</button><button class="px-btn green" id="fcYes">✔ 記得（2）</button>';
          const fin = ok => { row.innerHTML = `<span class="${ok ? 'green-t' : 'red-t'}">${ok ? (early ? '記得！（提前複習，排程不變）' : '升一盒！') : '回到第 1 盒，明天再見。'}</span>`; SFX.play(ok ? 'correct' : 'wrong'); after(ok); body._key = null; };
          U.$('#fcYes').onclick = () => fin(true); U.$('#fcNo').onclick = () => fin(false);
          body._key = e => { if (e.key === '1') { fin(false); return true; } if (e.key === '2') { fin(true); return true; } return false; };
        };
        U.$('#fcFlip').onclick = flip; fc.onclick = () => { if (!fc.classList.contains('flip')) flip(); };
        body._key = e => { if (e.key === 'Enter' || e.key === ' ') { flip(); return true; } return false; };
      } else {
        body.className = 'lp-body t-check';
        body.innerHTML = from + '<div class="lc mt"></div>';
        const box = body.querySelector('.lc');
        renderCheck(box, it.c, { onDone: firstOk => after(firstOk) });
        body._key = e => box._key ? box._key(e) : false;
      }
    }
    function done() {
      cleanup();
      const g = Math.floor(right / 5);
      if (g) Store.addGems(g);
      SFX.play('win');
      scr().innerHTML = `<div class="panel learn center"><h2>複習完成！</h2><p>記得 <b class="green-t">${right}</b> / ${ids.length} 張${g ? `・獲得 <b class="purple-t">${g}</b> 魂晶` : ''}</p>
        <div class="row mt" style="justify-content:center"><button class="px-btn gold" id="rvBack">回學習模式</button></div></div>`;
      U.$('#rvBack').onclick = () => { tab = 'review'; screen(); };
    }
    show();
  }

  /* ---------- 知識筆記：讀過的概念卡 ---------- */
  function notes() {
    const body = U.$('#learnBody');
    const blocks = [];
    packs.forEach(p => p.lessons.forEach(l => {
      const st = D.les[lkey(p, l)] || {};
      const reach = st.done ? l.steps.length : (st.i || 0);
      const cards = l.steps.filter((s, i) => i < reach && (s.type === 'card' || s.type === 'recap' || s.type === 'diagram'));
      if (cards.length) blocks.push({ p, l, cards });
    }));
    if (!blocks.length) { body.innerHTML = '<p class="dim">上過的概念卡和重點整理會收在這裡，隨時可以回來翻。先去上一課吧！</p>'; return; }
    body.innerHTML = blocks.map(({ p, l, cards }) => `<details class="lnote"><summary><span class="tag" style="border-color:${C.SUBJECTS[p.subject].color}">${C.SUBJECTS[p.subject].name}</span> ${U.esc(p.title)}・<b>${U.esc(l.title)}</b> <span class="dim small-t">（${cards.length}）</span></summary>
      ${cards.map(s => s.type === 'card' ? `<div class="lnote-card"><h4>📘 ${U.esc(s.title)}</h4>${imgsHTML(s.img, s.img_source || s.source)}${md(s.body)}${(s.keys || []).length ? `<div class="lp-keys"><ul>${s.keys.map(k => `<li>${inl(k)}</li>`).join('')}</ul></div>` : ''}</div>`
        : s.type === 'diagram' ? `<div class="lnote-card"><h4>🔍 ${U.esc(s.title || '圖解')}</h4><div class="dg-wrap small"><img src="${U.esc(U.img(s.img))}" alt="">${s.points.map((pt, i) => { const o = ((D.pins || {})[`${p.id}/${l.id}/${l.steps.indexOf(s)}`] || {})[i] || [pt.x, pt.y]; return o[0] == null ? '' : `<span class="dg-pin" style="left:${o[0]}%;top:${o[1]}%">${i + 1}</span>`; }).join('')}</div><ol class="small-t">${s.points.map(pt => `<li><b>${U.esc(pt.name)}</b>${pt.desc ? '：' + inl(pt.desc) : ''}</li>`).join('')}</ol></div>`
        : `<div class="lnote-card"><h4>⭐ 本課重點</h4><ol>${s.points.map(x => `<li>${inl(x)}</li>`).join('')}</ol></div>`).join('')}</details>`).join('');
  }

  /* ---------- 學習節奏說明 ---------- */
  function guide() {
    U.$('#learnBody').innerHTML = `<h3>每一課都是同一個節奏</h3>
      <div class="lguide">${[['intro', '先知道這課要學什麼、為什麼要學。'], ['card', '一次只學一個觀念，重點幫你框好。'], ['check', '學完馬上練 1～2 題。答錯先給提示，再錯就揭曉並收進複習。'],
        ['example', '一題範例拆成幾步，一次看一步，先自己想再看下一步。'], ['practice', '題庫裡的題目（會記錄到作答統計與錯題本）＋自編練習題。'], ['recap', '整理重點和記憶卡，之後由「複習」定期提醒。'],
        ['diagram', '（需要時）看圖認構造：點標記看說明，再做「點出○○在哪」的辨識測驗。'], ['interactive', '（需要時）互動模擬或動畫：拉滑桿、按按鈕，親手看到原理。']]
        .map(([t, d], i) => `<div class="lg-row"><i class="lg-ic t-${t}">${STEP[t].ic}</i><div><b>${STEP[t].name}</b>${t === 'card' ? '<span class="tag">重複 2～4 次</span>' : t === 'check' ? '<span class="tag">緊跟在每張概念卡後</span>' : ''}<br><span class="dim small-t">${d}</span></div></div>${i === 0 ? '' : ''}`).join('')}</div>
      <div class="lpips big mt">${['intro', 'card', 'check', 'card', 'check', 'check', 'card', 'check', 'example', 'practice', 'recap'].map(t => `<i class="t-${t}"></i>`).join('')}</div>
      <p class="dim small-t">▲ 一課的樣子：導入 → (概念 → 檢核) × N → 範例 → 實戰 → 回顧。每課約 10～20 分鐘，中途離開會自動存進度。</p>
      <h3 class="mt">⚔ 學習戰鬥</h3><p class="small-t">每一段（概念卡＋它後面的檢核題）會出現怪物。<b>答對</b>就用職業招式攻擊；<b>第一次就答對</b>會累積連擊，連擊越高傷害越高、越容易暴擊，每 4 連擊夥伴會追擊、每 5 連擊 +⚡。<b>讀概念卡、玩互動內容</b>也會累積 ⚡，集滿 3 點就能按「⚡ 必殺技」放職業大招。怪物可能有特性：<b>蓄力</b>（答錯受 2 點傷害、答對可破防）、<b>硬殼</b>（暴擊或必殺技才打得碎）、<b>寶藏怪</b>（幾題後逃走，快打倒牠）。打得快會有增援，整段零失誤會掉寶箱。整課最後有<b>課末魔王</b>（半血後暴怒），課末依正確率、連擊與是否倒下給 S／A／B／C 評等。倒下也沒關係，夥伴會扶你起來，學習進度不受影響。不想戰鬥可以按右上角切換成「🕊 平靜模式」。</p>
      <h3 class="mt">星星怎麼算？</h3><p class="small-t">看「第一次就答對」的比例：90% 以上 ★★★、70% 以上 ★★、其他 ★。第一次完成一課給魂晶，之後拿到更高星數會補差額。</p>`;
  }

  function tileDesc() {
    if (!packs.length) return '尚無單元：先建立學習資料';
    const due = dueList().length, done = Object.values(D.les).filter(x => x.done).length;
    return `${packs.length} 個單元・已完成 ${done} 課${due ? `・🔁 待複習 ${due}` : ''}`;
  }
  function exportData() { return D; }
  /* 彈珠學習（Peglin）回流：檢核錯題進複習盒；整課完成時比照學習模式記完成、星等與獎勵 */
  function applyPeglin(ev) {
    if (ev.type === 'check') {
      if (!ITEMS[ev.id]) return false;
      D.stat.checks++; if (ev.first) D.stat.right++;
      if (!ev.ok) addRev(ev.id, true);
      save(); return true;
    }
    const p = PK[ev.pack], l = p && p.lessons.find(x => x.id === ev.lesson);
    if (!l) return false;
    const st = D.les[lkey(p, l)] || (D.les[lkey(p, l)] = { i: 0, done: 0, best: 0 });
    const acc = ev.n ? ev.ok / ev.n : 1, star = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1, first = !st.done;
    const gain = first ? 3 + star * 2 : (star > (st.best || 0) ? (star - (st.best || 0)) * 2 : 0);
    st.done = (st.done || 0) + 1; st.best = Math.max(st.best || 0, star); st.last = Date.now(); st.run = null; st.i = 0;
    D.stat.lessons++; D.last = { p: p.id, l: l.id };
    l.steps.forEach(s => { if (s.type === 'card' && s.flash) addRev(s.flash.id); if (s.type === 'recap') (s.flash || []).forEach(f => addRev(f.id)); });
    save();
    if (gain) Store.addGems(gain);
    Store.addAccXp(first ? 25 : 8);
    return true;
  }

  return { reindex, screen, tileDesc, exportData, applyPeglin, leave: cleanup, renderCheck, sameAns, get packs() { return packs; } };
})();
