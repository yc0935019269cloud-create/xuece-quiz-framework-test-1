/* 頂部「多功能」按鈕：把雲端同步、計算機、計算紙、音樂／音量收進同一個選單，點了才展開。
 * 原本的按鈕（#cloudMini、#calcMini、#padMini、#btnSound）原封不動搬進選單，所以各模組更新按鈕狀態的程式照常運作。
 * 載入順序：cloud.js、pad.js 之後（等它們的按鈕建好再收進來）。 */
(() => {
  const ITEMS = [
    ['cloudMini', '雲端同步／登入'],
    ['calcMini', '科學計算機'],
    ['padMini', '計算紙'],
    ['btnSound', '音樂與音量']
  ];
  let btn, menu;
  const PANELS = { calcMini: 'calcPanel', padMini: 'padPanel', btnSound: 'volPop' };
  /* 把浮動視窗放在 ☰ 正下方、右緣對齊按鈕（超出畫面就往內收）；使用者拖曳過的視窗保持原位 */
  function anchor(el) {
    if (!el || !btn) return;
    if (el.dataset.anchor && el.style.left && el.style.left !== el.dataset.anchor) return;
    const r = btn.getBoundingClientRect(), w = el.offsetWidth;
    const left = Math.round(Math.max(8, Math.min(r.right - w, innerWidth - w - 8)));
    el.style.left = left + 'px'; el.style.right = 'auto'; el.style.top = Math.round(r.bottom + 6) + 'px';
    el.dataset.anchor = el.style.left;
  }
  function close() { if (menu) menu.hidden = true; if (btn) btn.classList.remove('on'); }
  function toggle() {
    const show = menu.hidden;
    menu.hidden = !show; btn.classList.toggle('on', show);
    if (show) anchor(menu);
    if (show) setTimeout(() => document.addEventListener('pointerdown', function out(e) {
      if (!menu.contains(e.target) && e.target !== btn) close();
      if (menu.hidden || !menu.contains(e.target)) document.removeEventListener('pointerdown', out);
    }), 0);
  }
  function mount() {
    const res = document.getElementById('topRes'); if (!res || document.getElementById('toolBtn')) return;
    // 計算紙按鈕
    if (!document.getElementById('padMini')) {
      const p = document.createElement('button'); p.className = 'px-btn small'; p.id = 'padMini'; p.textContent = '📝'; p.title = '計算紙';
      p.onclick = () => PAD.toggle(); res.appendChild(p);
    }
    btn = U.h('<button class="px-btn small" id="toolBtn" aria-label="多功能">☰</button>');
    menu = U.h('<div id="toolMenu" class="panel" hidden></div>');
    ITEMS.forEach(([id, label]) => {
      const b = document.getElementById(id); if (!b) return;
      const row = U.h(`<div class="tm-row"><span class="tm-label">${label}</span></div>`);
      row.insertBefore(b, row.firstChild);
      row.addEventListener('click', e => {
        if (e.target !== b) b.click();
        if (id !== 'btnSound') close(); else menu.hidden = true;   // 音量面板自己會開，選單收起
        const pn = document.getElementById(PANELS[id]);
        if (pn && !pn.hidden && innerWidth > 640) anchor(pn);   // 手機版維持原本的全寬排版
      });
      menu.appendChild(row);
    });
    const pomo = document.getElementById('pomoMini');
    res.insertBefore(btn, pomo ? pomo.nextSibling : res.querySelector('.res'));
    document.body.appendChild(menu);
    btn.onclick = toggle;
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) close(); });
    addEventListener('resize', () => { if (!menu.hidden) anchor(menu); });
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 0));
})();
