/* 計算紙：浮動視窗，可手寫（滑鼠／手指／觸控筆，觸控筆有壓力感應）、打字（文字工具點一下就輸入）、橡皮擦、復原、清空。
 * - 筆跡存成向量（不是圖片），視窗縮放後重畫不失真；內容存在 localStorage SKEY('pad')（不進存檔、不同步）。
 * - 防手掌誤觸：用過觸控筆之後，手指只能捲動不能畫（可在工具列切換）。觸控筆的橡皮擦端直接當橡皮擦。
 * - 書寫時只畫新增的線段（配合畫面更新頻率），不整張重畫；畫布用低延遲模式。整個視窗禁止選取文字，快速連寫不會反白。
 * - 視窗內的按鍵不會觸發作答快捷鍵；Esc 關閉。 */
const PAD = (() => {
  const KEY = SKEY('pad');
  const COLORS = ['#1b1424', '#d23c3c', '#2f6fd0', '#2f8f3b'];
  const SIZES = [2, 4, 8];
  let D = load();
  let panel, cv, ctx, txtIn, tool = 'pen', color = COLORS[0], size = 1, drawing = null, penSeen = false, saveT = 0, drawnTo = 0, raf = 0;
  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && Array.isArray(d.items)) return d; } catch (e) {}
    return { items: [], palm: true };
  }
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(D)); }
      catch (e) { D.items = D.items.slice(-200); try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e2) {} }
    }, 300);
  }

  /* ---------- 繪製 ---------- */
  function style(g, it) {
    g.globalCompositeOperation = it.t === 'erase' ? 'destination-out' : 'source-over';
    g.strokeStyle = it.c || '#000'; g.fillStyle = it.c || '#000'; g.lineCap = g.lineJoin = 'round';
  }
  const dot = (g, it) => { const P0 = it.pts[0]; g.beginPath(); g.arc(P0[0], P0[1], wOf(it, P0) / 2, 0, Math.PI * 2); g.fill(); };
  // 第 i 段（i ≥ 1）：依該點壓力決定粗細，用中點二次曲線讓線條平滑
  function seg(g, it, i) {
    const P = it.pts, a = P[i - 1], b = P[i], m0 = i > 1 ? mid(P[i - 2], a) : a, m1 = mid(a, b);
    g.lineWidth = wOf(it, b); g.beginPath(); g.moveTo(m0[0], m0[1]); g.quadraticCurveTo(a[0], a[1], m1[0], m1[1]); g.stroke();
  }
  function tail(g, it) {
    const P = it.pts; if (P.length < 2) return;
    const L = P[P.length - 1], M = mid(P[P.length - 2], L);
    g.lineWidth = wOf(it, L); g.beginPath(); g.moveTo(M[0], M[1]); g.lineTo(L[0], L[1]); g.stroke();
  }
  function strokePath(g, it) {
    const P = it.pts; if (!P.length) return;
    style(g, it);
    if (P.length === 1) return dot(g, it);
    for (let i = 1; i < P.length; i++) seg(g, it, i);
    tail(g, it);
  }
  /* 書寫中：只補畫還沒畫的線段（一個畫面更新畫一次） */
  function paintLive() {
    raf = 0; if (!drawing) return;
    style(ctx, drawing);
    for (let i = Math.max(1, drawnTo); i < drawing.pts.length; i++) seg(ctx, drawing, i);
    drawnTo = Math.max(drawnTo, drawing.pts.length);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const wOf = (it, p) => it.t === 'erase' ? it.w * 4 : it.w * (it.pen ? 0.35 + (p[2] ?? 0.5) * 1.3 : 1);
  function drawText(g, it) {
    g.globalCompositeOperation = 'source-over'; g.fillStyle = it.c; g.textBaseline = 'top';
    g.font = `${it.s}px "Cubic 11", "Microsoft JhengHei", sans-serif`;
    String(it.txt).split('\n').forEach((ln, i) => g.fillText(ln, it.x, it.y + i * it.s * 1.25));
  }
  function redraw() {
    if (!cv) return;
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const W = Math.max(1, Math.round(r.width * dpr)), H = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);
    D.items.forEach(it => it.t === 'text' ? drawText(ctx, it) : strokePath(ctx, it));
    if (drawing) { strokePath(ctx, drawing); drawnTo = drawing.pts.length; }
  }

  /* ---------- 輸入 ---------- */
  function pos(e) { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * 10) / 10, Math.round((e.clientY - r.top) * 10) / 10, e.pointerType === 'pen' ? Math.round((e.pressure || 0.5) * 100) / 100 : 0.5]; }
  function onDown(e) {
    if (e.pointerType === 'pen') penSeen = true;
    if (e.pointerType === 'touch' && penSeen && D.palm) return;     // 防手掌：用過觸控筆後，手指不畫
    e.preventDefault();                                             // 先擋掉預設動作（選取文字、拖曳）再判斷
    if (drawing) return;                                            // 已經在寫了（另一根手指／手掌），不理
    inking(true);
    const eraserEnd = e.pointerType === 'pen' && (e.button === 5 || (e.buttons & 32));   // 觸控筆的橡皮擦端
    if (e.button > 0 && !eraserEnd) return;
    if (tool === 'text' && !eraserEnd) return placeText(e);
    commitText();
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    drawing = { t: tool === 'erase' || eraserEnd ? 'erase' : 'pen', c: color, w: SIZES[size], pen: e.pointerType === 'pen', pts: [pos(e)], id: e.pointerId };
    style(ctx, drawing); dot(ctx, drawing); drawnTo = 1;
  }
  function onMove(e) {
    if (!drawing || e.pointerId !== drawing.id) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    (evs.length ? evs : [e]).forEach(ev => {
      const p = pos(ev), L = drawing.pts[drawing.pts.length - 1];
      if (Math.hypot(p[0] - L[0], p[1] - L[1]) < 0.8) return;
      if (drawing.pen) p[2] = Math.round((L[2] * 0.6 + p[2] * 0.4) * 100) / 100;   // 壓力平滑，粗細不會忽大忽小
      drawing.pts.push(p);
    });
    if (!raf) raf = requestAnimationFrame(paintLive);
  }
  function onUp(e) {
    if (!drawing || e.pointerId !== drawing.id) return;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    paintLive(); style(ctx, drawing); tail(ctx, drawing);
    delete drawing.id; D.items.push(drawing); drawing = null; drawnTo = 0; save();
    inking(false);
  }
  /* 寫字時整頁都不准選取：iPad 上觸控筆快速點寫會被當成雙擊／長按，去反白紙外面的按鈕文字（例如「繼續」） */
  let inkT = 0;
  const unselect = () => { const sel = getSelection && getSelection(); if (sel && sel.rangeCount && !(txtIn && txtIn.contains(sel.anchorNode))) sel.removeAllRanges(); };
  function inking(on) {
    clearTimeout(inkT);
    if (on) { document.documentElement.classList.add('pad-ink'); unselect(); }
    else { unselect(); inkT = setTimeout(() => { document.documentElement.classList.remove('pad-ink'); unselect(); }, 700); }
  }
  document.addEventListener('selectstart', e => { if (document.documentElement.classList.contains('pad-ink') && e.target !== txtIn) e.preventDefault(); }, true);
  /* 文字工具：在點的位置出現輸入框，Enter 換行、點別處或按「完成」寫上去 */
  function placeText(e) {
    commitText();
    const p = pos(e), s = [16, 20, 28][size];
    txtIn.style.left = p[0] + 'px'; txtIn.style.top = p[1] + 'px'; txtIn.style.fontSize = s + 'px'; txtIn.style.color = color;
    txtIn.value = ''; txtIn.hidden = false; txtIn.dataset.x = p[0]; txtIn.dataset.y = p[1]; txtIn.dataset.s = s;
    autosize(); txtIn.focus(); setTimeout(() => txtIn.focus(), 0);
  }
  function autosize() { txtIn.style.height = 'auto'; txtIn.style.height = txtIn.scrollHeight + 'px'; txtIn.style.width = Math.max(80, Math.min(cv.clientWidth - +txtIn.dataset.x - 4, 12 + Math.max(...txtIn.value.split('\n').map(l => l.length), 4) * +txtIn.dataset.s)) + 'px'; }
  function commitText() {
    if (!txtIn || txtIn.hidden) return;
    const v = txtIn.value.replace(/\s+$/, '');
    txtIn.hidden = true;
    if (v) { D.items.push({ t: 'text', x: +txtIn.dataset.x + 3, y: +txtIn.dataset.y + 3, s: +txtIn.dataset.s, c: txtIn.style.color || color, txt: v }); save(); redraw(); }
  }

  /* ---------- 介面 ---------- */
  function build() {
    panel = U.h(`<div id="padPanel" class="pad" tabindex="-1" hidden>
      <div class="pad-head"><span>📝 計算紙</span><button class="calc-x" title="關閉（Esc）">✕</button></div>
      <div class="pad-tools">
        <button data-tool="pen" title="筆（滑鼠、手指、觸控筆）">✏️</button><button data-tool="erase" title="橡皮擦">🧽</button><button data-tool="text" title="打字：點紙上任一處開始輸入">Aa</button>
        <span class="pad-sep"></span>${COLORS.map((c, i) => `<button data-color="${i}" class="pad-c" style="--c:${c}" title="顏色"></button>`).join('')}
        <span class="pad-sep"></span>${SIZES.map((s, i) => `<button data-size="${i}" title="粗細"><i style="width:${s + 3}px;height:${s + 3}px"></i></button>`).join('')}
        <span class="pad-sep"></span><button data-act="undo" title="復原（Ctrl+Z）">↶</button><button data-act="clear" title="清空">🗑</button>
        <button data-act="palm" class="pad-palm" title="使用觸控筆後，手指只捲動不畫線">✋</button>
      </div>
      <div class="pad-paper"><canvas></canvas><textarea class="pad-txt" hidden rows="1" spellcheck="false" placeholder="輸入文字…"></textarea></div>
      <div class="pad-foot dim small-t">手寫或選 Aa 打字・觸控筆有壓力感應</div>
    </div>`);
    document.body.appendChild(panel);
    cv = U.$('canvas', panel); ctx = cv.getContext('2d', { desynchronized: true }) || cv.getContext('2d'); txtIn = U.$('.pad-txt', panel);
    // 快速連寫時瀏覽器會當成雙擊／長按去選取文字或開選單：整個視窗都擋掉（打字框除外）
    panel.addEventListener('selectstart', e => { if (e.target !== txtIn) e.preventDefault(); });
    ['contextmenu', 'dblclick', 'dragstart'].forEach(t => cv.addEventListener(t, e => e.preventDefault()));
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
    // iOS Safari 的雙擊選字、長按放大鏡由 touch 事件觸發，pointer 的 preventDefault 擋不住；觸控筆（與沒開防手掌時的手指）在這裡擋
    cv.addEventListener('touchstart', e => { if (tool === 'text') return; if ([...e.changedTouches].some(t => t.touchType === 'stylus') || !(penSeen && D.palm)) e.preventDefault(); }, { passive: false });
    txtIn.oninput = autosize;
    txtIn.onblur = () => setTimeout(commitText, 0);
    U.$$('[data-tool]', panel).forEach(b => b.onclick = () => { commitText(); tool = b.dataset.tool; sync(); });
    U.$$('[data-color]', panel).forEach(b => b.onclick = () => { color = COLORS[+b.dataset.color]; if (tool === 'erase') tool = 'pen'; sync(); });
    U.$$('[data-size]', panel).forEach(b => b.onclick = () => { size = +b.dataset.size; sync(); });
    U.$('[data-act="undo"]', panel).onclick = undo;
    U.$('[data-act="clear"]', panel).onclick = async () => { if (!D.items.length || await U.confirm('清空計算紙', '紙上的內容都會清除，確定嗎？')) { D.items = []; save(); redraw(); } };
    U.$('[data-act="palm"]', panel).onclick = () => { D.palm = !D.palm; save(); sync(); U.toast(D.palm ? '防手掌誤觸：開（用過觸控筆後，手指不會畫線）' : '防手掌誤觸：關'); };
    U.$('.calc-x', panel).onclick = toggle;
    panel.addEventListener('keydown', e => {
      e.stopPropagation();                                 // 不要觸發作答快捷鍵
      if (e.key === 'Escape') { if (!txtIn.hidden) { txtIn.value = ''; txtIn.hidden = true; } else toggle(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.target !== txtIn) { e.preventDefault(); undo(); }
    });
    // 拖曳標題列移動；右下角把手調整大小（U.grip）
    drag(U.$('.pad-head', panel), (r, dx, dy, ev) => { panel.style.left = U.clamp(ev.clientX - dx, 0, innerWidth - r.width) + 'px'; panel.style.top = U.clamp(ev.clientY - dy, 0, innerHeight - 40) + 'px'; panel.style.right = 'auto'; });
    U.grip(panel, { key: 'pad', minW: 260, minH: 240, mobileH: true, apply: (w, h) => { panel.style.width = w + 'px'; panel.style.height = h + 'px'; }, reset: () => { panel.style.width = panel.style.height = ''; } });
    // 調整大小時不要每一格都重配畫布、重畫全部筆跡（很耗時）：先固定畫布原尺寸，放開後再重畫一次
    panel.addEventListener('winresizestart', () => { const r = cv.getBoundingClientRect(); cv.style.setProperty('--cvw', r.width + 'px'); cv.style.setProperty('--cvh', r.height + 'px'); });
    panel.addEventListener('winresizeend', () => redraw());
    new ResizeObserver(() => { if (!panel.classList.contains('win-resizing')) redraw(); }).observe(U.$('.pad-paper', panel));
    sync();
  }
  function drag(handle, fn) {
    handle.onpointerdown = e => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      const r = panel.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      handle.setPointerCapture(e.pointerId);
      handle.onpointermove = ev => fn(r, dx, dy, ev);
      handle.onpointerup = () => { handle.onpointermove = handle.onpointerup = null; };
    };
  }
  function sync() {
    U.$$('[data-tool]', panel).forEach(b => b.classList.toggle('on', b.dataset.tool === tool));
    U.$$('[data-color]', panel).forEach(b => b.classList.toggle('on', COLORS[+b.dataset.color] === color && tool !== 'erase'));
    U.$$('[data-size]', panel).forEach(b => b.classList.toggle('on', +b.dataset.size === size));
    U.$('.pad-palm', panel).classList.toggle('on', !!D.palm);
    cv.style.cursor = tool === 'text' ? 'text' : tool === 'erase' ? 'cell' : 'crosshair';
  }
  function undo() { commitText(); D.items.pop(); save(); redraw(); }
  function toggle() {
    if (!panel) build();
    const show = panel.hidden;
    if (!show) commitText();
    panel.hidden = !show;
    if (show) { redraw(); panel.focus({ preventScroll: true }); }
    const b = document.getElementById('padMini'); if (b) b.classList.toggle('on', show);
  }
  return { toggle, get open() { return !!panel && !panel.hidden; } };
})();
