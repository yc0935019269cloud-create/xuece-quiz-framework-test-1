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
  function close() { if (menu) menu.hidden = true; if (btn) btn.classList.remove('on'); }
  function toggle() {
    const show = menu.hidden;
    menu.hidden = !show; btn.classList.toggle('on', show);
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
    btn = U.h('<button class="px-btn small" id="toolBtn" title="多功能：雲端同步、計算機、計算紙、音樂">☰</button>');
    menu = U.h('<div id="toolMenu" class="panel" hidden></div>');
    ITEMS.forEach(([id, label]) => {
      const b = document.getElementById(id); if (!b) return;
      const row = U.h(`<div class="tm-row"><span class="tm-label">${label}</span></div>`);
      row.insertBefore(b, row.firstChild);
      row.addEventListener('click', e => {
        if (e.target !== b) b.click();
        if (id !== 'btnSound') close(); else menu.hidden = true;   // 音量面板自己會開，選單收起
      });
      menu.appendChild(row);
    });
    const pomo = document.getElementById('pomoMini');
    res.insertBefore(btn, pomo ? pomo.nextSibling : res.querySelector('.res'));
    document.body.appendChild(menu);
    btn.onclick = toggle;
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) close(); });
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(mount, 0));
})();
