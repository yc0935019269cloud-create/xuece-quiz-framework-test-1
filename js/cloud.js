/* 雲端同步：信箱驗證碼登入（Supabase Auth）＋存檔同步（Supabase 資料表 saves）。
 * - 不用 SDK，直接 fetch REST API，file:// 也能用；沒有設定或沒登入時完全不影響遊戲。
 * - 同步內容＝Store.exportAll()（設定頁「匯出存檔」的同一份）；導入素材（IndexedDB）不同步。
 * - 版本控制：雲端每次寫入 rev+1，寫入時帶「我上次看到的 rev」，被別台搶先就重新比對，不會盲蓋。
 * - 衝突（兩邊都改過）：以較晚修改的為準，另一份存進本機備份（最多 3 份，可在面板還原）。
 * 設定步驟：docs/雲端同步設定.md */
const CLOUD = (() => {
  const PROJECT = (window.QB && QB.meta && QB.meta.id) || 'default';
  const MK = SKEY('cloud'), BK = SKEY('cloud-bak'), CK = 'qg_cloudcfg', DK = 'qg_cloud_device';
  const TICK = 30000;
  const rd = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  let M = rd(MK, {});                         // { sess, rev, hash, seenHash, localAt, lastActive, lastSync, apply }
  const saveM = () => wr(MK, M);
  let busy = false, err = '', panelEl = null;

  /* ---------- 設定與裝置 ---------- */
  function cfg() {
    const f = window.CLOUD_CFG || {};
    if (f.url && f.key) return { url: f.url.replace(/\/+$/, ''), key: f.key, file: true };
    const s = rd(CK, null);
    return s && s.url && s.key ? { url: s.url.replace(/\/+$/, ''), key: s.key, file: false } : null;
  }
  function device() {
    let d = rd(DK, null);
    if (!d) {
      const ua = navigator.userAgent;
      const kind = /iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : '裝置';
      d = { name: kind + '-' + Math.random().toString(36).slice(2, 6) }; wr(DK, d);
    }
    return d.name;
  }

  /* ---------- REST ---------- */
  async function api(path, opt = {}) {
    const c = cfg(); if (!c) throw new Error('尚未設定雲端專案');
    const headers = { apikey: c.key, 'Content-Type': 'application/json', Authorization: 'Bearer ' + (opt.token || c.key) };
    if (opt.prefer) headers.Prefer = opt.prefer;
    const body = opt.body === undefined ? undefined : JSON.stringify(opt.body);
    let r;
    try { r = await fetch(c.url + path, { method: opt.method || 'GET', headers, body, keepalive: !!(opt.keepalive && body && body.length < 60000) }); }
    catch (e) { throw Object.assign(new Error('連不上雲端（請確認網路）'), { net: true }); }
    const txt = await r.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
    if (!r.ok) {
      const m = (j && (j.msg || j.message || j.error_description || j.error)) || ('HTTP ' + r.status);
      throw Object.assign(new Error(m), { status: r.status, code: j && (j.code || j.error_code) });
    }
    return j;
  }
  function setSess(j) {
    M.sess = { at: j.access_token, rt: j.refresh_token, exp: j.expires_at || (Math.floor(Date.now() / 1000) + (j.expires_in || 3600)), uid: j.user.id, email: j.user.email };
    saveM();
  }
  async function token() {
    if (!M.sess) throw new Error('尚未登入');
    if (M.sess.exp - 60 > Date.now() / 1000) return M.sess.at;
    try { setSess(await api('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: M.sess.rt } })); }
    catch (e) { if (!e.net) { M.sess = null; saveM(); status(); throw new Error('登入已過期，請重新登入'); } throw e; }
    return M.sess.at;
  }
  const rowQ = () => `/rest/v1/saves?user_id=eq.${M.sess.uid}&project=eq.${encodeURIComponent(PROJECT)}`;
  async function head() { const a = await api(rowQ() + '&select=rev,device,updated_at', { token: await token() }); return a && a[0] || null; }
  async function full() { const a = await api(rowQ() + '&select=rev,device,updated_at,data', { token: await token() }); return a && a[0] || null; }

  /* ---------- 本機狀態 ---------- */
  function snap() {
    const o = JSON.parse(Store.exportAll()); delete o.at;
    const s = JSON.stringify(o);
    let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return { obj: o, hash: (h >>> 0).toString(36) + '.' + s.length };
  }
  /* 偵測本機改動時間（用來判斷衝突時誰比較新） */
  function touch(cur) {
    if (cur.hash !== M.seenHash) { M.seenHash = cur.hash; M.localAt = Date.now(); }
    M.lastActive = Date.now(); saveM();
  }
  function hasProgress() {
    let les = 0; try { les = Object.keys((LEARN_UI.exportData() || {}).les || {}).length; } catch (e) {}
    return Object.keys(Store.qs || {}).length > 0 || les > 0;
  }
  function backup(from, obj, at) {
    let list = rd(BK, []);
    list.unshift({ from, at: at || new Date().toISOString(), saved: new Date().toISOString(), data: JSON.stringify(obj) });
    list = list.slice(0, 3);
    while (list.length && !wr(BK, list)) list.pop();   // 空間不夠就丟最舊的
  }

  /* ---------- 上傳／套用 ---------- */
  async function push(cur, keepalive) {
    const tk = await token(), now = new Date().toISOString(), dev = device();
    let row;
    if (M.rev == null) {
      try { row = await api('/rest/v1/saves', { method: 'POST', token: tk, prefer: 'return=representation', body: { user_id: M.sess.uid, project: PROJECT, rev: 1, data: cur.obj, device: dev, updated_at: now }, keepalive }); }
      catch (e) { if (e.status === 409) return false; throw e; }
    } else {
      row = await api(rowQ() + '&rev=eq.' + M.rev, { method: 'PATCH', token: tk, prefer: 'return=representation', body: { rev: M.rev + 1, data: cur.obj, device: dev, updated_at: now }, keepalive });
    }
    if (!row || !row.length) return false;            // 被別台搶先寫入
    M.rev = row[0].rev; M.hash = cur.hash; M.lastSync = Date.now(); saveM();
    return true;
  }
  function apply(row) {
    Store.importAll(JSON.stringify(row.data));
    M.rev = row.rev; M.apply = { device: row.device, at: row.updated_at }; M.lastSync = Date.now(); saveM();
    location.reload();
  }
  const when = t => { const d = new Date(t); return isNaN(d) ? '—' : d.toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  function ask(title, msg, a, b) {
    return new Promise(res => U.modal({ title, body: `<p>${msg}</p>`, narrow: true, closable: false, buttons: [
      { label: a, onClick: () => res(0) }, { label: b, cls: 'gold', onClick: () => res(1) }] }));
  }

  /* 同步主流程。mode：'start'（開遊戲）、'manual'（按按鈕／剛登入）、'tick'（定時）、'resume'（切回分頁）、'hide'（離開分頁） */
  async function sync(mode = 'tick') {
    if (busy || !cfg() || !M.sess) return;
    busy = true; status();
    try {
      for (let tries = 0; tries < 3; tries++) {
        const cur = snap(); touch(cur);
        const dirty = cur.hash !== M.hash;
        const h = await head();
        if (!h) { M.rev = null; if (await push(cur, mode === 'hide')) break; continue; }
        if (M.rev == null) {                                   // 這台第一次連上已有雲端存檔的帳號
          const row = await full();
          if (!hasProgress()) return apply(row);
          const pick = await ask('雲端已有存檔', `雲端存檔最後更新：${when(row.updated_at)}（${U.esc(row.device || '其他裝置')}）。<br>這台裝置也有進度，要用哪一份？另一份會先備份在這台裝置，之後可以在「雲端同步」裡還原。`, '用這台的進度', '用雲端的存檔');
          if (pick === 1) { backup('這台裝置', cur.obj); return apply(row); }
          backup('雲端', row.data, row.updated_at); M.rev = row.rev;
          if (await push(cur)) break; continue;
        }
        if (h.rev === M.rev) { if (dirty && !(await push(cur, mode === 'hide'))) continue; break; }
        // 雲端被別台更新過
        const row = await full(); if (!row) continue;
        if (!dirty) {
          if (mode === 'start' || mode === 'manual') return apply(row);
          const pick = await ask('雲端有新進度', `${U.esc(row.device || '其他裝置')} 在 ${when(row.updated_at)} 更新了進度。要現在載入嗎？（畫面會重新整理）`, '稍後', '載入');
          if (pick === 1) return apply(row);
          break;
        }
        // 兩邊都改過：較晚修改的為準，另一份備份
        if ((M.localAt || 0) >= Date.parse(row.updated_at)) {
          backup('雲端', row.data, row.updated_at); M.rev = row.rev;
          U.toast(`雲端與這台都有改動，已保留這台較新的進度（雲端舊版已備份）`, 5000);
          if (await push(cur)) break; continue;
        }
        backup('這台裝置', cur.obj);
        U.toast('雲端與這台都有改動，正在載入雲端較新的進度（這台的進度已備份）', 5000);
        return apply(row);
      }
      err = '';
    } catch (e) { err = e.message; if (mode === 'manual') U.toast('同步失敗：' + e.message, 4000); }
    finally { busy = false; status(); }
  }

  /* ---------- 登入 ---------- */
  async function sendCode(email) { await api('/auth/v1/otp', { method: 'POST', body: { email, create_user: true } }); }
  async function verify(email, code) {
    setSess(await api('/auth/v1/verify', { method: 'POST', body: { type: 'email', email, token: code } }));
    M.rev = null; M.hash = null; saveM();
    await sync('manual');
  }
  async function logout() {
    if (busy) return;
    const c = snap();
    if (c.hash !== M.hash) await sync('manual');            // 登出前先把最後的進度送上去
    try { await api('/auth/v1/logout', { method: 'POST', token: M.sess.at }); } catch (e) {}
    M = { seenHash: M.seenHash, localAt: M.localAt }; saveM(); err = ''; status();
  }

  /* ---------- 介面 ---------- */
  function status() {
    const b = document.getElementById('cloudMini');
    if (b) {
      const st = !cfg() || !M.sess ? 'off' : busy ? 'busy' : err ? 'err' : 'ok';
      b.className = 'px-btn small cloud-' + st;
      b.textContent = st === 'busy' ? '☁…' : st === 'err' ? '☁!' : st === 'ok' ? '☁✓' : '☁';
      b.title = st === 'off' ? '雲端同步：未登入' : st === 'err' ? '雲端同步失敗：' + err : st === 'busy' ? '同步中…' : '雲端同步：' + M.sess.email + (M.lastSync ? '（' + when(M.lastSync) + ' 已同步）' : '');
    }
    if (panelEl && document.body.contains(panelEl) && !panelEl.querySelector('input:focus')) render(panelEl);
  }
  function open() {
    const m = U.modal({ title: '☁ 雲端同步', body: '<div></div>', onClose: () => { panelEl = null; } });
    panel(m.body.firstElementChild);
  }
  function panel(el) { panelEl = el; render(el); }
  function render(el) {
    const c = cfg();
    if (!c) {
      el.innerHTML = `<p class="small-t">用信箱登入後，進度會自動存到雲端，在手機、平板、其他電腦登入同一個信箱就能接著玩。</p>
        <p class="small-t dim">還沒設定雲端專案。照 <b>docs/雲端同步設定.md</b> 建好 Supabase 專案後，把 Project URL 與 anon key 貼在下面（或寫進 js/cloud-config.js，所有裝置都不用再貼）。</p>
        <input class="px-input" id="ccUrl" placeholder="https://xxxx.supabase.co" style="width:100%">
        <input class="px-input mt" id="ccKey" placeholder="anon／publishable key" style="width:100%">
        <div class="row mt"><button class="px-btn blue" id="ccSave">儲存設定</button></div>`;
      el.querySelector('#ccSave').onclick = () => {
        const url = el.querySelector('#ccUrl').value.trim(), key = el.querySelector('#ccKey').value.trim();
        if (!/^https:\/\/.+/.test(url) || key.length < 20) return U.toast('網址或金鑰格式不對');
        if (/service_role|sb_secret_/.test(key) || /"role"\s*:\s*"service_role"/.test(atobSafe(key.split('.')[1]))) return U.toast('這是 secret／service_role 金鑰，請改用 anon／publishable key');
        wr(CK, { url, key }); render(el); status();
      };
      return;
    }
    if (!M.sess) {
      el.innerHTML = `<p class="small-t">輸入信箱，我們會寄一組驗證碼給你；輸入驗證碼就登入，不需要密碼。第一次使用會自動建立帳號。</p>
        <div class="row"><input class="px-input" id="ccEmail" type="email" placeholder="you@example.com" style="flex:1;min-width:200px" value="${U.esc(rd(SKEY('cloud-email'), ''))}"><button class="px-btn blue" id="ccSend">寄驗證碼</button></div>
        <div id="ccStep2" hidden><p class="small-t mt">驗證碼已寄出，請到信箱查看（可能在垃圾郵件）。</p>
        <div class="row"><input class="px-input" id="ccCode" inputmode="numeric" autocomplete="one-time-code" placeholder="驗證碼" style="width:140px;letter-spacing:3px"><button class="px-btn gold" id="ccGo">登入</button></div></div>
        ${c.file ? '' : '<div class="row mt"><button class="px-btn small" id="ccReset">更換雲端專案設定</button></div>'}`;
      const em = el.querySelector('#ccEmail'), send = el.querySelector('#ccSend'), go = el.querySelector('#ccGo'), code = el.querySelector('#ccCode');
      send.onclick = async () => {
        const email = em.value.trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return U.toast('請輸入正確的信箱');
        send.disabled = true; send.textContent = '寄送中…';
        try { await sendCode(email); wr(SKEY('cloud-email'), email); el.querySelector('#ccStep2').hidden = false; code.focus(); U.toast('驗證碼已寄出');
          let s = 60; const t = setInterval(() => { send.textContent = `重新寄送（${--s}）`; if (s <= 0) { clearInterval(t); send.disabled = false; send.textContent = '重新寄送'; } }, 1000);
        } catch (e) { send.disabled = false; send.textContent = '寄驗證碼'; U.toast(e.status === 429 ? '寄送太頻繁，請稍等一下再試' : '寄送失敗：' + e.message, 4000); }
      };
      em.onkeydown = e => { if (e.key === 'Enter') send.click(); };
      code.onkeydown = e => { if (e.key === 'Enter') go.click(); };
      go.onclick = async () => {
        const v = code.value.replace(/\s/g, ''); if (!/^\d{6,10}$/.test(v)) return U.toast('請輸入信中的數字驗證碼');
        go.disabled = true;
        try { await verify(em.value.trim(), v); U.toast('登入成功，已開始同步'); render(el); }
        catch (e) { go.disabled = false; U.toast(/expired|invalid/i.test(e.message) ? '驗證碼錯誤或已過期' : '登入失敗：' + e.message, 4000); }
      };
      const rs = el.querySelector('#ccReset'); if (rs) rs.onclick = () => { localStorage.removeItem(CK); render(el); status(); };
      return;
    }
    const baks = rd(BK, []);
    el.innerHTML = `<p>已登入：<b>${U.esc(M.sess.email)}</b></p>
      <p class="small-t">${busy ? '同步中…' : err ? '<span style="color:#e06c5c">同步失敗：' + U.esc(err) + '</span>' : M.lastSync ? '最後同步：' + when(M.lastSync) : '尚未同步'}<br><span class="dim">這台裝置：${U.esc(device())}・作答後約 30 秒內自動上傳，開啟遊戲時自動下載最新進度。</span></p>
      <div class="row"><button class="px-btn blue" id="ccSync" ${busy ? 'disabled' : ''}>立即同步</button><button class="px-btn" id="ccOut" ${busy ? 'disabled' : ''}>登出</button></div>
      ${baks.length ? `<hr class="px"><h3>衝突備份</h3><p class="small-t dim">兩台裝置都改過時，被取代的那份會留在這裡。還原後會成為最新進度並上傳。</p>
        ${baks.map((b, i) => `<div class="row small-t">${U.esc(b.from)}・${when(b.at)}<button class="px-btn small" data-bak="${i}">還原</button></div>`).join('')}` : ''}
      <p class="small-t dim mt">導入素材（📥）與音量等本機設定不會同步。</p>`;
    el.querySelector('#ccSync').onclick = () => sync('manual');
    el.querySelector('#ccOut').onclick = async () => { if (await U.confirm('登出雲端', '登出後這台裝置的進度仍會保留，但不再自動同步。')) { await logout(); render(el); } };
    el.querySelectorAll('[data-bak]').forEach(b => b.onclick = async () => {
      const it = baks[+b.dataset.bak]; if (!it) return;
      if (!(await U.confirm('還原備份', `要把進度換成「${U.esc(it.from)}・${when(it.at)}」那份嗎？目前的進度會先備份。`))) return;
      backup('還原前的進度', snap().obj);
      Store.importAll(it.data); M.localAt = Date.now() + 1; saveM(); location.reload();
    });
  }
  function atobSafe(s) { try { return atob((s || '').replace(/-/g, '+').replace(/_/g, '/')); } catch (e) { return ''; } }

  function mountMini() {
    const res = document.getElementById('topRes'); if (!res || document.getElementById('cloudMini')) return;
    const b = document.createElement('button'); b.id = 'cloudMini'; b.onclick = open;
    const calc = document.getElementById('calcMini') || document.getElementById('pomoMini');
    res.insertBefore(b, calc ? calc.nextSibling : res.firstChild);
    status();
  }

  /* ---------- 啟動 ---------- */
  function init() {
    mountMini();
    if (M.apply) {                                           // 剛套用雲端存檔並重新整理
      const cur = snap(); M.hash = M.seenHash = cur.hash; M.localAt = Date.now();
      U.toast(`已載入雲端進度（${U.esc(M.apply.device || '其他裝置')}・${when(M.apply.at)}）`, 4000);
      delete M.apply; saveM();
    } else if (M.sess) {
      const cur = snap();                                     // 上次關掉前還沒上傳的改動：用最後活動時間當修改時間
      if (cur.hash !== M.seenHash) { M.seenHash = cur.hash; M.localAt = M.lastActive || Date.now(); saveM(); }
    }
    if (!cfg() || !M.sess) return;
    sync('start');
  }
  setInterval(() => {
    if (!M.sess || document.hidden) return;
    const cur = snap(); touch(cur);
    if (cur.hash !== M.hash) sync('tick');
  }, TICK);
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (!M.sess) return;
    if (document.hidden) { hiddenAt = Date.now(); if (snap().hash !== M.hash) sync('hide'); }
    else if (Date.now() - hiddenAt > 60000) sync('resume');
  });
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));

  return { open, panel, sync, get signedIn() { return !!M.sess; } };
})();
