/* 題目呈現與作答（戰鬥、題庫練習、錯題重刷共用） */
const QV = (() => {
  const TYPE_NAME = { single: '單選', multi: '多選', fill: '填答', open: '非選' };
  function labelOf(q, i) { return q.labels === 'num' ? String(i + 1) : String.fromCharCode(65 + i); }
  function keyToIdx(q, ch) { return q.labels === 'num' ? Number(ch) - 1 : ch.charCodeAt(0) - 65; }

  const typeName = q => q.tf ? '是非' : q.type === 'fill' && q.accept ? '填答' : TYPE_NAME[q.type];
  const subjColor = ex => (C.SUBJECTS[ex.subj] || {}).color || '#888';
  const exLabel = ex => (ex.year && !String(ex.name).includes(String(ex.year)) ? ex.year + ' ' : '') + ex.name;
  /* 題目圖片：支援導入的圖片與編號標記（marks：[{x,y,label}]，x/y 為百分比） */
  function imgHTML(src, marks) {
    const im = `<img class="qimg" src="${U.esc(U.img(src))}" loading="lazy">`;
    if (!marks || !marks.length) return im;
    return `<div class="markwrap">${im}${marks.map((m, i) => `<i class="qmark" style="left:${m.x}%;top:${m.y}%">${U.esc(m.label || i + 1)}</i>`).join('')}</div>`;
  }
  function metaHTML(q) {
    const ex = Store.EX[q.exam];
    const st = Store.status(q.id);
    const stTag = st === 'new' ? '' : st === 'right' ? '<span class="tag ok">答對過</span>' : '<span class="tag ng">上次答錯</span>';
    return `<div class="qmeta"><span class="tag" style="border-color:${subjColor(ex)}">${U.esc(exLabel(ex))}</span>
      <span class="tag">第 ${U.esc(q.n)} 題</span><span class="tag ${q.type}">${typeName(q)}</span>
      ${stTag}</div>`;
  }

  function bodyHTML(q) {
    let html = '<div class="qbox">';
    if (q.group && window.QB.groups[q.group]) {
      const g = window.QB.groups[q.group];
      html += `<details class="passage" open><summary>${U.esc(g.title || '題組')}（第 ${g.range[0]}–${g.range[1]} 題）— 點此收合/展開</summary><div class="pbody">${g.text ? `<div class="qtext">${U.md(g.text)}</div>` : ''}${g.imgs.map(s => imgHTML(s, g.marks)).join('')}</div></details>`;
    }
    if (q.stem) html += `<div class="qtext">${U.md(q.stem)}</div>`;
    if (q.imgs.length) html += q.imgs.map((s, i) => imgHTML(s, i === 0 ? q.marks : null)).join('');
    if (!q.stem && !q.imgs.length) html += `<div class="qprompt">請依上方題組內容，作答<b>第 ${q.n} 題</b>${q.opts > 5 ? `（選項 A–${String.fromCharCode(64 + q.opts)}）` : ''}</div>`;
    html += '</div>';
    return html;
  }

  function explainHTML(q) {
    const ex = Store.EX[q.exam];
    return `<div class="explain">
      <div class="row"><b class="gold-t">正確答案：${U.esc(q.ans)}</b>${q.tag ? `<span class="tag">考點：${U.esc(q.tag)}</span>` : ''}<span class="grow"></span>
      ${ex.pdf ? `<a class="px-btn small" href="${encodeURI(ex.pdf)}" target="_blank">開啟原始資料</a>` : ''}</div>
      ${q.ex ? U.md(q.ex) : '<p class="dim">此題暫無詳解。</p>'}
      ${ex.source ? `<p class="dim small-t">來源：${U.esc(ex.source)}</p>` : ''}${window.QB.meta && QB.meta.disclaimer ? `<p class="dim small-t">※ ${U.esc(QB.meta.disclaimer)}</p>` : ''}</div>`;
  }

  /*
   * render(container, q, opts)
   * opts: { onAnswer(res), elim: [idx...], mode, nextLabel, onNext, extraButtons }
   * res : { ok, partial, picked, self }
   */
  function render(container, q, opts = {}) {
    container.innerHTML = metaHTML(q) + bodyHTML(q) + `<div class="answers"></div><div class="result-box"></div>`;
    const ans = container.querySelector('.answers');
    const resBox = container.querySelector('.result-box');
    let picked = new Set(), locked = false;
    const elim = new Set(opts.elim || []);

    function finish(res) {
      if (locked) return; locked = true;
      document.removeEventListener('keydown', onKey);
      if (q.type === 'single' || q.type === 'multi') {
        U.$$('.opt', ans).forEach(b => {
          const L = b.dataset.l;
          if (q.key.includes(L)) b.classList.add('correct');
          else if (picked.has(L)) b.classList.add('wrong');
          b.disabled = true;
        });
        U.$$('.confirm', ans).forEach(b => b.remove());
      }
      const verdict = res.timeout ? `<div class="verdict red-t">⌛ 時間到！</div>` : res.ok ? `<div class="verdict green-t">✔ 答對了！</div>` : res.partial ? `<div class="verdict gold-t">△ 部分正確</div>` : `<div class="verdict red-t">✘ 答錯了</div>`;
      resBox.innerHTML = verdict;
      const exWrap = U.h('<div></div>');
      const showEx = Store.settings.autoExplain || !res.ok;
      if (showEx) exWrap.innerHTML = explainHTML(q);
      const row = U.h('<div class="row mt" style="justify-content:center"></div>');
      if (!showEx) {
        const b = U.h('<button class="px-btn">查看詳解</button>');
        b.onclick = () => { exWrap.innerHTML = explainHTML(q); b.remove(); };
        row.appendChild(b);
      }
      if (opts.onNext) {
        const nb = U.h(`<button class="px-btn gold big next-btn">${opts.nextLabel || '繼續 ▶'}</button>`);
        nb.onclick = () => { document.removeEventListener('keydown', nextKey); opts.onNext(res); };
        row.appendChild(nb);
        setTimeout(() => document.addEventListener('keydown', nextKey), 250);
      }
      resBox.appendChild(row);
      resBox.appendChild(exWrap);
      opts.onAnswer && opts.onAnswer(res);
    }
    function nextKey(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        const nb = container.querySelector('.next-btn');
        if (nb && document.body.contains(nb) && !document.querySelector('.modal-bg')) { e.preventDefault(); nb.click(); }
      }
    }

    function grade() {
      const p = [...picked].sort().join('');
      if (p === q.key) return { ok: true, picked: p };
      const noWrong = [...picked].every(x => q.key.includes(x));
      return { ok: false, partial: q.type === 'multi' && picked.size > 0 && noWrong, picked: p };
    }

    if (q.type === 'single' || q.type === 'multi') {
      for (let i = 0; i < q.opts; i++) {
        const L = labelOf(q, i);
        const txt = q.choices ? (q.tf ? U.esc(q.choices[i]) : `<b>${L}</b><span>${U.md(q.choices[i]).replace(/^<div class="md"><p>([\s\S]*)<\/p><\/div>$/, '$1')}</span>`) : (q.labels === 'num' ? `(${L})` : L);
        const b = U.h(`<button class="px-btn opt ${q.choices ? 'txt' : ''} ${q.tf ? 'tf' : ''} ${elim.has(i) ? 'elim' : ''}" data-l="${L}">${txt}</button>`);
        b.onclick = () => {
          if (locked) return;
          SFX.play('click');
          if (q.type === 'single' && !Store.settings.confirmSingle) { picked = new Set([L]); finish(grade()); return; }
          if (q.type === 'single') { picked = new Set([L]); U.$$('.opt', ans).forEach(x => x.classList.toggle('picked', x.dataset.l === L)); }
          else { picked.has(L) ? picked.delete(L) : picked.add(L); b.classList.toggle('picked'); }
        };
        ans.appendChild(b);
      }
      if (q.type === 'multi' || Store.settings.confirmSingle) {
        const cb = U.h(`<button class="px-btn gold confirm">確認作答 ⏎</button>`);
        cb.onclick = () => { if (!picked.size) { U.toast('請先選擇選項'); return; } finish(grade()); };
        ans.appendChild(U.h('<div style="flex-basis:100%;height:0"></div>'));
        ans.appendChild(cb);
      }
      if (q.type === 'multi') ans.insertAdjacentHTML('afterbegin', '<div class="dim small-t" style="flex-basis:100%;text-align:center">多選題：可選多個，選好後按「確認作答」</div>');
      if (q.choices && !q.tf) ans.classList.add('txt');
    } else if (q.type === 'fill' && q.accept) {
      /* 有標準答案的填答題：自動批改 */
      const wrap = U.h(`<div class="col" style="width:100%;align-items:center"><div class="row" style="justify-content:center">
        <input class="px-in fill-in" style="width:min(320px,100%);font-size:18px" placeholder="輸入答案後按 Enter" autocomplete="off"><button class="px-btn gold">送出 ⏎</button></div></div>`);
      const inp = wrap.querySelector('input'), sb = wrap.querySelector('button');
      const send = () => {
        if (locked) return;
        const v = inp.value.trim(); if (!v) { U.toast('請先輸入答案'); return; }
        const ok = q.accept.some(a => U.sameAns(v, a));
        inp.disabled = true; sb.disabled = true;
        finishFill(ok, v);
      };
      sb.onclick = send;
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); send(); } };
      ans.appendChild(wrap);
      setTimeout(() => inp.focus(), 60);
    } else {
      const wrap = U.h(`<div class="col" style="width:100%;align-items:center">
        <div class="dim small-t">${q.type === 'fill' ? '填答題：先在紙上或下方寫出答案，再揭曉自評。' : '非選擇題：先寫下作答要點，再對照詳解自評。'}</div>
        <input class="px-in" style="width:min(420px,100%)" placeholder="（選填）在此寫下你的答案">
        <button class="px-btn gold">揭曉答案</button></div>`);
      const reveal = wrap.querySelector('button');
      reveal.onclick = () => {
        const mine = wrap.querySelector('input').value.trim();
        wrap.innerHTML = `<div class="explain" style="width:100%"><b class="gold-t">參考答案：${U.esc(q.ans)}</b>${mine ? `<br>你的答案：${U.esc(mine)}` : ''}${U.md(q.ex)}</div>
          <div class="row mt"><button class="px-btn green big">我答對了</button><button class="px-btn red big">我答錯了</button></div>`;
        const [yes, no] = wrap.querySelectorAll('.row button');
        const done = ok => { wrap.querySelector('.row').remove(); locked = false; picked = new Set(); finishSelf(ok); };
        yes.onclick = () => done(true); no.onclick = () => done(false);
      };
      ans.appendChild(wrap);
    }
    function finishFill(ok, mine) {
      locked = true;
      document.removeEventListener('keydown', onKey);
      resBox.innerHTML = (ok ? `<div class="verdict green-t">✔ 答對了！</div>` : `<div class="verdict red-t">✘ 答錯了</div><div class="center">你的答案：${U.esc(mine)}</div>`);
      const exWrap = U.h('<div></div>');
      if (Store.settings.autoExplain || !ok) exWrap.innerHTML = explainHTML(q);
      const row = U.h('<div class="row mt" style="justify-content:center"></div>');
      if (!exWrap.innerHTML) { const b = U.h('<button class="px-btn">查看詳解</button>'); b.onclick = () => { exWrap.innerHTML = explainHTML(q); b.remove(); }; row.appendChild(b); }
      if (opts.onNext) {
        const nb = U.h(`<button class="px-btn gold big next-btn">${opts.nextLabel || '繼續 ▶'}</button>`);
        nb.onclick = () => { document.removeEventListener('keydown', nextKey); opts.onNext({ ok }); };
        row.appendChild(nb);
        setTimeout(() => document.addEventListener('keydown', nextKey), 250);
      }
      resBox.appendChild(row); resBox.appendChild(exWrap);
      opts.onAnswer && opts.onAnswer({ ok, picked: mine });
    }
    function finishSelf(ok) {
      locked = true;
      document.removeEventListener('keydown', onKey);
      resBox.innerHTML = ok ? `<div class="verdict green-t">✔ 自評答對</div>` : `<div class="verdict red-t">✘ 自評答錯</div>`;
      const row = U.h('<div class="row mt" style="justify-content:center"></div>');
      if (opts.onNext) {
        const nb = U.h(`<button class="px-btn gold big next-btn">${opts.nextLabel || '繼續 ▶'}</button>`);
        nb.onclick = () => { document.removeEventListener('keydown', nextKey); opts.onNext({ ok, self: true }); };
        row.appendChild(nb);
        setTimeout(() => document.addEventListener('keydown', nextKey), 250);
      }
      resBox.appendChild(row);
      opts.onAnswer && opts.onAnswer({ ok, self: true });
    }

    function onKey(e) {
      if (locked || document.querySelector('.modal-bg')) return;
      if (e.target.tagName === 'INPUT') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (q.type === 'single' || q.type === 'multi') {
        let idx = -1;
        if (/^[1-9]$/.test(k)) idx = q.labels === 'num' ? Number(k) - 1 : Number(k) - 1;
        else if (/^[A-J]$/.test(k) && q.labels === 'alpha') idx = k.charCodeAt(0) - 65;
        if (idx >= 0 && idx < q.opts) { const b = ans.querySelectorAll('.opt')[idx]; if (b && !b.classList.contains('elim')) b.click(); }
        if (e.key === 'Enter') { const cb = ans.querySelector('.confirm'); if (cb) { e.preventDefault(); cb.click(); } }
      }
    }
    document.addEventListener('keydown', onKey);

    return {
      eliminate(n) {
        if (locked || !(q.type === 'single' || q.type === 'multi')) return 0;
        const cands = [];
        U.$$('.opt', ans).forEach((b, i) => { if (!q.key.includes(b.dataset.l) && !b.classList.contains('elim')) cands.push(b); });
        const kill = U.pickN(cands, n);
        kill.forEach(b => { b.classList.add('elim'); picked.delete(b.dataset.l); b.classList.remove('picked'); });
        return kill.length;
      },
      canEliminate() { return !locked && (q.type === 'single' || q.type === 'multi') && U.$$('.opt:not(.elim)', ans).some(b => !q.key.includes(b.dataset.l)); },
      timeout() { if (locked || !(q.type === 'single' || q.type === 'multi')) return; picked = new Set(); finish({ ok: false, picked: '', timeout: true }); },
      get locked() { return locked; },
      destroy() { document.removeEventListener('keydown', onKey); document.removeEventListener('keydown', nextKey); }
    };
  }

  /* 題庫/錯題：單題練習視窗 */
  function practiceModal(q, onDone) {
    const m = U.modal({ title: '題目練習', body: '<div class="qwrap"></div>', onClose: () => { ctl.destroy(); onDone && onDone(); } });
    const wrap = m.body.querySelector('.qwrap');
    const head = U.h(`<div class="row mb"><button class="px-btn small">只看詳解</button></div>`);
    wrap.before(head);
    head.firstElementChild.onclick = () => { head.firstElementChild.remove(); wrap.insertAdjacentHTML('beforeend', explainHTML(q)); };
    const ctl = render(wrap, q, {
      mode: 'practice',
      onAnswer: res => { Store.record(q.id, res.ok); head.remove(); SFX.play(res.ok ? 'correct' : 'wrong'); },
      nextLabel: '關閉', onNext: () => m.close()
    });
    return m;
  }

  return { render, practiceModal, explainHTML, TYPE_NAME, typeName, exLabel, labelOf };
})();
