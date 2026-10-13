/* 題目收藏與資料夾：遠征、練習、題庫共用。 */
const FAV_UI = (() => {
  const watchers = new Set();
  let pauseStart = null, paused = 0;
  // 用實際視窗狀態計時，切換畫面清掉 modalRoot 時也能恢復。
  function pausedTime() {
    const now = Date.now(), editing = !!document.querySelector('.fav-modal');
    if (editing && pauseStart === null) pauseStart = now;
    if (!editing && pauseStart !== null) { paused += now - pauseStart; pauseStart = null; }
    return paused + (pauseStart === null ? 0 : now - pauseStart);
  }
  function buttons(id) {
    const saved = Store.isFavorite(id), item = Store.favorites.items[id];
    const names = Store.favorites.folders.filter(f => item?.folders.includes(f.id)).map(f => f.name);
    return `<button class="px-btn small fav-toggle ${saved ? 'gold' : ''}" data-fav-toggle="${U.esc(id)}" aria-pressed="${saved}" aria-label="${saved ? '取消收藏' : '收藏此題'}">${saved ? '★ 已收藏' : '☆ 收藏'}</button>
      <button class="px-btn small" data-fav-folders="${U.esc(id)}">收藏資料夾</button>
      ${saved ? `<span class="fav-label dim small-t" title="${U.esc(names.join('、') || '未分類')}">${U.esc(names.slice(0, 2).join('、') || '未分類')}${names.length > 2 ? ` 等 ${names.length} 個資料夾` : ''}</span>` : ''}`;
  }
  function controls(q) {
    return Store.Q[q.id] ? `<span class="fav-controls" data-fav-id="${U.esc(q.id)}">${buttons(q.id)}</span>` : '';
  }
  function watch(root, fn) {
    for (const w of watchers) if (!w.root.isConnected) watchers.delete(w);
    watchers.add({ root, fn });
  }
  document.addEventListener('favoriteschange', () => {
    const active = document.activeElement?.closest('[data-fav-toggle], [data-fav-folders]');
    const action = active?.hasAttribute('data-fav-toggle') ? 'data-fav-toggle' : 'data-fav-folders', id = active?.getAttribute(action);
    document.querySelectorAll('[data-fav-id]').forEach(el => { el.innerHTML = buttons(el.dataset.favId); });
    for (const w of watchers) { if (w.root.isConnected) w.fn(); else watchers.delete(w); }
    if (id) [...document.querySelectorAll('[' + action + ']')].find(el => el.getAttribute(action) === id)?.focus({ preventScroll: true });
  });
  function modal(opt) {
    const onClose = opt.onClose;
    const dlg = U.modal(Object.assign({}, opt, { onClose() { pausedTime(); onClose?.(); } }));
    dlg.el.classList.add('fav-modal');
    dlg.el.setAttribute('role', 'dialog'); dlg.el.setAttribute('aria-modal', 'true');
    dlg.el.setAttribute('aria-label', opt.title); dlg.el.tabIndex = -1;
    dlg.el.focus({ preventScroll: true });
    pausedTime(); return dlg;
  }
  function editName(folder) {
    const input = U.h(`<input class="px-in fav-name" maxlength="50" aria-label="資料夾新名稱" value="${U.esc(folder.name)}">`);
    const save = () => {
      try { Store.renameFavoriteFolder(folder.id, input.value); dlg.close(); }
      catch (e) { U.toast(U.esc(e.message)); input.focus(); }
    };
    const dlg = modal({ title: '重新命名收藏資料夾', body: input, narrow: true, buttons: [
      { label: '取消' }, { label: '儲存', cls: 'gold', close: false, onClick: save }
    ] });
    input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); save(); } };
    input.focus(); input.select();
  }
  function open(id) {
    const q = id && Store.Q[id];
    if (id && !q) return;
    const pending = new Set(Store.favorites.items[id]?.folders || []);
    const body = U.h(`<div class="fav-editor">
      ${q ? `<p class="fav-question">第 ${U.esc(q.n)} 題 · ${U.esc(Store.EX[q.exam]?.name || '')}</p><p class="dim small-t">可勾選多個資料夾；不勾選則存到「未分類」。按「儲存收藏」完成。</p>` : '<p class="dim small-t">刪除資料夾會保留裡面的收藏題目；沒有其他分類的題目會移到「未分類」。</p>'}
      <div class="fav-create"><input class="px-in" maxlength="50" placeholder="新資料夾名稱" aria-label="新收藏資料夾名稱"><button class="px-btn small gold" data-fav-create>新增資料夾</button></div>
      <p class="fav-error red-t small-t" role="status"></p><div class="fav-folder-list"></div></div>`);
    const input = body.querySelector('input'), error = body.querySelector('.fav-error');
    const dlg = modal({ title: q ? '題目收藏資料夾' : '管理收藏資料夾', body, buttons: q ? [
      { label: '取消' }, { label: '儲存收藏', cls: 'gold', onClick() { Store.setFavoriteFolders(id, [...pending]); U.toast('已儲存收藏'); } }
    ] : [{ label: '完成', cls: 'gold' }] });
    function draw() {
      const valid = new Set(Store.favorites.folders.map(f => f.id));
      for (const fid of pending) if (!valid.has(fid)) pending.delete(fid);
      const list = body.querySelector('.fav-folder-list'); list.innerHTML = '';
      if (!Store.favorites.folders.length) list.innerHTML = '<p class="dim center">還沒有資料夾，可以在上方新增。</p>';
      Store.favorites.folders.forEach(f => {
        const row = U.h(`<div class="fav-folder-row">
          ${q ? `<label class="fav-folder-name"><input type="checkbox" data-folder="${U.esc(f.id)}" ${pending.has(f.id) ? 'checked' : ''}><span>${U.esc(f.name)}</span></label>` : `<span class="fav-folder-name">${U.esc(f.name)}</span>`}
          <span class="dim small-t">${Store.favoriteCount(f.id)} 題</span><div class="fav-folder-actions"><button class="px-btn small" data-rename>改名</button><button class="px-btn small" data-delete>刪除</button></div></div>`);
        const checkbox = row.querySelector('[data-folder]');
        if (checkbox) checkbox.onchange = () => { if (checkbox.checked) pending.add(f.id); else pending.delete(f.id); };
        row.querySelector('[data-rename]').onclick = () => editName(f);
        row.querySelector('[data-delete]').onclick = async () => {
          if (await U.confirm('刪除收藏資料夾', `刪除「${U.esc(f.name)}」？題目仍會保留在收藏中。`)) Store.deleteFavoriteFolder(f.id);
        };
        list.appendChild(row);
      });
    }
    function create() {
      try {
        const fid = Store.createFavoriteFolder(input.value);
        if (q) pending.add(fid);
        input.value = ''; error.textContent = ''; draw(); input.focus();
      } catch (e) { error.textContent = e.message; input.focus(); }
    }
    body.querySelector('[data-fav-create]').onclick = create;
    input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); create(); } };
    watch(body, draw); draw();
    return dlg;
  }
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-fav-toggle], [data-fav-folders], [data-fav-manage]');
    if (!btn) return;
    if (btn.hasAttribute('data-fav-toggle')) { const id = btn.dataset.favToggle; Store.setFavorite(id, !Store.isFavorite(id)); }
    else open(btn.dataset.favFolders);
  });
  return { controls, open, watch, pausedTime };
})();
