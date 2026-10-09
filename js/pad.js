/* 計算紙：浮動視窗，可手寫（滑鼠／手指／觸控筆，觸控筆有壓力感應）、打字（文字工具點一下就輸入）、橡皮擦、復原、清空。
 * - 筆跡存成向量（不是圖片），視窗縮放後重畫不失真；內容存在 localStorage SKEY('pad')（不進存檔、不同步）。
 * - 防手掌誤觸：用過觸控筆之後，手指只能捲動不能畫（可在工具列切換）。
 * - 視窗內的按鍵不會觸發作答快捷鍵；Esc 關閉。 */
const PAD = (() => {
  const KEY = SKEY('pad');
  const COLORS = ['#1b1424', '#d23c3c', '#2f6fd0', '#2f8f3b'];
  const SIZES = [2, 4, 8];
  let D = load();
  let panel, cv, ctx, txtIn, tool = 'pen', color = COLORS[0], size = 1, drawing = null, penSeen = false, saveT = 0;
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
  function strokePath(g, it) {
    const P = it.pts; if (!P.length) return;
    g.globalCompositeOperation = it.t === 'erase' ? 'destination-out' : 'source-over';
    g.strokeStyle = it.c || '#000'; g.fillStyle = it.c || '#000'; g.lineCap = g.lineJoin = 'round';
    if (P.length === 1) { g.beginPath(); g.arc(P[0][0], P[0][1], wOf(it, P[0]) / 2, 0, Math.PI * 2); g.fill(); return; }
    for (let i = 1; i < P.length; i++) {        // 每段依壓力決定粗細，中點二次曲線讓線條平滑
      const a = P[i - 1], b = P[i], m0 = i > 1 ? mid(P[i - 2], a) : a, m1 = mid(a, b);
      g.lineWidth = wOf(it, b); g.beginPath(); g.moveTo(m0[0], m0[1]); g.quadraticCurveTo(a[0], a[1], m1[0], m1[1]); g.stroke();
    }
    const L = P[P.length - 1], M = mid(P[P.length - 2], L);
    g.beginPath(); g.moveTo(M[0], M[1]); g.lineTo(L[0], L[1]); g.stroke();
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
    if (drawing) strokePath(ctx, drawing);
  }

  /* ---------- 輸入 ---------- */
  function pos(e) { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * 10) / 10, Math.round((e.clientY - r.top) * 10) / 10, e.pointerType === 'pen' ? Math.round((e.pressure || 0.5) * 100) / 100 : 0.5]; }
  function onDown(e) {
    if (e.pointerType === 'pen') penSeen = true;
    if (e.pointerType === 'touch' && penSeen && D.palm) return;     // 防手掌：用過觸控筆後，手指不畫
    if (e.button > 0) return;
    e.preventDefault();
    if (tool === 'text') return placeText(e);
    commitText();
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    drawing = { t: tool === 'erase' ? 'erase' : 'pen', c: color, w: SIZES[size], pen: e.pointerType === 'pen', pts: [pos(e)], id: e.pointerId };
    redraw();
  }
  function onMove(e) {
    if (!drawing || e.pointerId !== drawing.id) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    (evs.length ? evs : [e]).forEach(ev => { const p = pos(ev), L = drawing.pts[drawing.pts.length - 1]; if (Math.hypot(p[0] - L[0], p[1] - L[1]) >= 1) drawing.pts.push(p); });
    redraw();
  }
  function onUp(e) {
    if (!drawing || e.pointerId !== drawing.id) return;
    delete drawing.id; D.items.push(drawing); drawing = null; save(); redraw();
  }
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
      <i class="pad-grip" title="拖曳調整大小"></i>
    </div>`);
    document.body.appendChild(panel);
    cv = U.$('canvas', panel); ctx = cv.getContext('2d'); txtIn = U.$('.pad-txt', panel);
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
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
    // 拖曳標題列移動、右下角調整大小
    drag(U.$('.pad-head', panel), (r, dx, dy, ev) => { panel.style.left = U.clamp(ev.clientX - dx, 0, innerWidth - r.width) + 'px'; panel.style.top = U.clamp(ev.clientY - dy, 0, innerHeight - 40) + 'px'; panel.style.right = 'auto'; });
    drag(U.$('.pad-grip', panel), (r, dx, dy, ev) => { panel.style.width = U.clamp(ev.clientX - r.left + (r.width - dx), 260, innerWidth - r.left - 4) + 'px'; panel.style.height = U.clamp(ev.clientY - r.top + (r.height - dy), 240, innerHeight - r.top - 4) + 'px'; redraw(); });
    new ResizeObserver(() => redraw()).observe(U.$('.pad-paper', panel));
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
