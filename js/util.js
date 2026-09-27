/* 通用工具 */
/* 存檔鍵加上專案代號（content/project.json 的 id），不同題庫的存檔互不干擾 */
const SKEY = k => 'qg_' + ((window.QB && QB.meta && QB.meta.id) || 'default') + '_' + k;
/* 圖片路徑：導入素材的圖片存在瀏覽器，這裡換成可顯示的網址 */
const IMGMAP = {};
const APP_TITLE = (window.QB && QB.meta && QB.meta.title) || '刷題地牢';
const U = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function h(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const chance = p => Math.random() < p;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function pickN(arr, n) { return shuffle(arr).slice(0, n); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;

  /* 迷你 Markdown：標題、粗體、行內碼、表格、清單、引用、段落 */
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    return s;
  }
  function md(src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n');
    let out = '', i = 0;
    while (i < lines.length) {
      let l = lines[i];
      if (!l.trim()) { i++; continue; }
      let m;
      if ((m = l.match(/^(#{1,6})\s+(.*)$/))) { const lv = Math.min(4, m[1].length + 1); out += `<h${lv}>${inline(m[2])}</h${lv}>`; i++; continue; }
      if (/^\s*\|/.test(l)) {
        const rows = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i]); i++; }
        let t = '<table>';
        rows.forEach((r, ri) => {
          const cells = r.trim().replace(/^\||\|$/g, '').split('|');
          if (cells.every(c => /^\s*:?-+:?\s*$/.test(c))) return;
          const tag = ri === 0 ? 'th' : 'td';
          t += '<tr>' + cells.map(c => `<${tag}>${inline(c.trim())}</${tag}>`).join('') + '</tr>';
        });
        out += t + '</table>'; continue;
      }
      if (/^\s*>/.test(l)) {
        let b = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { b.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out += `<blockquote>${inline(b.join(' '))}</blockquote>`; continue;
      }
      if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
        const ordered = /^\s*\d+[.)]/.test(l);
        let items = [];
        while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*+]|\d+[.)])\s+/, '')); i++; }
        const tg = ordered ? 'ol' : 'ul';
        out += `<${tg}>` + items.map(x => `<li>${inline(x)}</li>`).join('') + `</${tg}>`; continue;
      }
      if (/^\s*```/.test(l)) {
        i++; let b = [];
        while (i < lines.length && !/^\s*```/.test(lines[i])) { b.push(lines[i]); i++; }
        i++; out += `<pre><code>${esc(b.join('\n'))}</code></pre>`; continue;
      }
      if (/^\s*(---|\*\*\*)\s*$/.test(l)) { out += '<hr class="px">'; i++; continue; }
      let p = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*\||\s*>|\s*([-*+]|\d+[.)])\s+|\s*```)/.test(lines[i])) { p.push(lines[i]); i++; }
      out += `<p>${p.map(inline).join('<br>')}</p>`;
    }
    return `<div class="md">${out}</div>`;
  }

  function toast(msg, ms) {
    const t = h(`<div class="toast">${msg}</div>`);
    $('#toastRoot').appendChild(t);
    setTimeout(() => t.remove(), ms || 2600);
  }

  /* modal({title, body(html|node), buttons:[{label, cls, onClick, close}], narrow, closable}) */
  function modal(opt) {
    const bg = h(`<div class="modal-bg"><div class="modal panel ${opt.narrow ? 'narrow' : ''}"></div></div>`);
    const box = bg.firstElementChild;
    if (opt.title) box.appendChild(h(`<h2>${opt.title}</h2>`));
    const body = document.createElement('div');
    if (typeof opt.body === 'string') body.innerHTML = opt.body; else if (opt.body) body.appendChild(opt.body);
    box.appendChild(body);
    const close = () => { bg.remove(); opt.onClose && opt.onClose(); };
    if (opt.closable !== false) {
      const x = h(`<button class="px-btn small close">✕</button>`);
      x.onclick = close; box.appendChild(x);
      bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
    }
    if (opt.buttons && opt.buttons.length) {
      const row = h(`<div class="row mt" style="justify-content:flex-end"></div>`);
      opt.buttons.forEach(b => {
        const btn = h(`<button class="px-btn ${b.cls || ''}">${b.label}</button>`);
        btn.onclick = () => { if (b.onClick) b.onClick(); if (b.close !== false) close(); };
        row.appendChild(btn);
      });
      box.appendChild(row);
    }
    $('#modalRoot').appendChild(bg);
    return { el: box, body, close };
  }
  function confirm(title, msg) {
    return new Promise(res => {
      modal({ title, body: `<p>${msg}</p>`, narrow: true, closable: false, buttons: [
        { label: '取消', onClick: () => res(false) },
        { label: '確定', cls: 'gold', onClick: () => res(true) }] });
    });
  }
  /* 填答比對：去空白、全形轉半形、大小寫不拘、上下標轉一般數字；兩邊都是數字／分數時比數值 */
  function normAns(s) {
    const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉';
    return String(s).replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).replace(/　/g, ' ')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, ch => String((SUP.indexOf(ch) + 1 || SUB.indexOf(ch) + 1) - 1))
      .replace(/\s+/g, '').replace(/[，,。．.]$/, '').toLowerCase();
  }
  function numOf(s) {
    const m = s.match(/^(-?\d+(?:\.\d+)?)(?:\/(-?\d+(?:\.\d+)?))?$/);
    if (!m) return null;
    return m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1]);
  }
  /* 中英並列答案（如「額骨 / frontal bone」）：忽略分隔符號與引號、中英順序可對調、頜／頷與腭／顎通用。
   * 只在標準答案同時含中文與英文字母時啟用，數學分數（1/2）等不受影響。 */
  const HAN = /[㐀-鿿]/, LAT = /[a-z]/i;
  const loose = s => normAns(s).replace(/[\/／,、;:()\[\]{}\-_|·・'’‘"“”`]/g, '').replace(/頷/g, '頜').replace(/顎/g, '腭');
  function sameAns(a, b) {
    const raw = String(b);
    a = normAns(a); b = normAns(b);
    if (a === b) return true;
    const x = numOf(a), y = numOf(b);
    if (x !== null && y !== null && Math.abs(x - y) < 1e-9) return true;
    if (HAN.test(raw) && LAT.test(raw)) {
      const la = loose(a);
      if (la === loose(raw)) return true;
      const parts = raw.split(/\s*[\/／]\s*/);
      if (parts.length === 2 && la === loose(parts[1]) + loose(parts[0])) return true;
    }
    return false;
  }
  const img = p => IMGMAP[p] || p;
  return { img, sameAns, $, $$, esc, h, rnd, chance, pick, shuffle, pickN, clamp, sleep, pct, md, toast, modal, confirm };
})();

/* 懸停提示：有 data-tip 或 title 的元素，滑鼠移上去立即顯示像素風提示框（手機點一下顯示） */
(() => {
  let tip = null, cur = null;
  function target(el) {
    const t = el && el.closest && el.closest('[data-tip],[title]');
    if (!t) return null;
    if (t.hasAttribute('title')) { const v = t.getAttribute('title'); t.removeAttribute('title'); if (v && !t.dataset.tip) t.dataset.tip = v; }
    return t.dataset.tip ? t : null;
  }
  function show(t, x, y) {
    if (!tip) { tip = document.createElement('div'); tip.id = 'tip'; document.body.appendChild(tip); }
    cur = t;
    const d = t.dataset;
    tip.className = 'rar-' + (d.tipRar || 0);
    tip.innerHTML = (d.tipTitle ? `<b>${U.esc(d.tipTitle)}</b>` : '') + (d.tipSub ? `<i>${U.esc(d.tipSub)}</i>` : '') + `<span>${U.esc(d.tip)}</span>`;
    tip.style.display = 'block';
    move(x, y);
  }
  function move(x, y) {
    if (!tip) return;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let L = x + 14, T = y + 16;
    if (L + w > innerWidth - 8) L = Math.max(8, x - w - 10);
    if (T + h > innerHeight - 8) T = Math.max(8, y - h - 10);
    tip.style.left = L + 'px'; tip.style.top = T + 'px';
  }
  function hide() { if (tip) tip.style.display = 'none'; cur = null; }
  document.addEventListener('mouseover', e => { const t = target(e.target); if (t) { if (t !== cur) show(t, e.clientX, e.clientY); } else if (cur) hide(); });
  document.addEventListener('mousemove', e => { if (cur) { if (!document.body.contains(cur)) hide(); else move(e.clientX, e.clientY); } });
  document.addEventListener('touchstart', e => {
    const t = target(e.target);
    if (t) { const p = e.touches[0]; show(t, p.clientX, p.clientY); clearTimeout(hide._t); hide._t = setTimeout(hide, 2500); } else hide();
  }, { passive: true });
  document.addEventListener('scroll', hide, true);
})();
