/* 科學計算機：頂部 🧮 按鈕（番茄鐘旁）開關的浮動小視窗，不擋作答，可拖曳。
 * 支援 sin／cos／tan、倒數三角函數 csc／sec／cot、反三角（2nd）、DEG／RAD、x²、xʸ、1/x、√、ln、log、n!、π、e、Ans、EXP。
 * 用自己的遞迴下降解析器計算（不用 eval）；角度模式下 90° 倍數的值是精確的（sin180°＝0、tan90° 無定義）。 */
const Calc = (() => {
  const KEY = 'calc';
  let S = { deg: true, hist: [] };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ deg: S.deg, hist: S.hist.slice(0, 20) })); } catch (e) {} };
  let ans = S.hist.length ? S.hist[0].v : 0, second = false, panel = null, inp = null, out = null, justEval = false;

  /* ---------- 計算 ---------- */
  const err = m => { throw new Error(m); };
  const snap = v => Math.abs(v) < 1e-13 ? 0 : v;
  const rad = x => S.deg ? x * Math.PI / 180 : x;
  const fromRad = x => S.deg ? x * 180 / Math.PI : x;
  // 角度模式下 90° 的倍數給精確值
  const exact = (x, f) => {
    if (S.deg && Number.isInteger(x)) { const r = ((x % 360) + 360) % 360; if (r % 90 === 0) return f === 'sin' ? [0, 1, 0, -1][r / 90] : [1, 0, -1, 0][r / 90]; }
    return snap(Math[f](rad(x)));
  };
  const nz = (v, m) => v === 0 ? err(m || '無定義（分母為 0）') : v;
  const inDom = (x, lo, hi) => (x < lo - 1e-12 || x > hi + 1e-12) ? err('超出定義域') : Math.min(hi, Math.max(lo, x));
  const FN = {
    sin: x => exact(x, 'sin'), cos: x => exact(x, 'cos'),
    tan: x => exact(x, 'sin') / nz(exact(x, 'cos')),
    csc: x => 1 / nz(exact(x, 'sin')), sec: x => 1 / nz(exact(x, 'cos')),
    cot: x => exact(x, 'cos') / nz(exact(x, 'sin')),
    asin: x => fromRad(Math.asin(inDom(x, -1, 1))), acos: x => fromRad(Math.acos(inDom(x, -1, 1))),
    atan: x => fromRad(Math.atan(x)),
    acsc: x => fromRad(Math.asin(inDom(1 / nz(x, '超出定義域'), -1, 1))),
    asec: x => fromRad(Math.acos(inDom(1 / nz(x, '超出定義域'), -1, 1))),
    acot: x => fromRad(Math.PI / 2 - Math.atan(x)),   // 值域 (0, π)
    ln: x => x <= 0 ? err('超出定義域') : Math.log(x),
    log: x => x <= 0 ? err('超出定義域') : Math.log10(x),
    sqrt: x => x < 0 ? err('超出定義域') : Math.sqrt(x),
    abs: Math.abs,
  };
  const NAMES = ['sin', 'cos', 'tan', 'csc', 'sec', 'cot', 'ln', 'log', 'sqrt', 'abs', 'Ans', 'pi', 'e'];
  const fact = n => { if (n < 0 || !Number.isInteger(n)) err('n! 只接受 0 以上的整數'); if (n > 170) err('數值太大'); let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };

  function tokenize(s) {
    s = s.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/√/g, 'sqrt');
    const t = []; let i = 0;
    while (i < s.length) {
      const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/);
      if (m) { t.push({ k: 'n', v: parseFloat(m[0]) }); i += m[0].length; continue; }
      if (/[a-zA-Z]/.test(s[i])) {
        const name = NAMES.find(n => s.startsWith(n, i)) || err('語法錯誤');
        i += name.length;
        if (FN[name]) {
          let inv = false;
          if (s.startsWith('⁻¹', i)) { inv = true; i += 2; }
          if (inv && !['sin', 'cos', 'tan', 'csc', 'sec', 'cot'].includes(name)) err('語法錯誤');
          t.push({ k: 'f', v: inv ? 'a' + name : name });
        } else t.push({ k: 'c', v: name === 'pi' ? Math.PI : name === 'e' ? Math.E : ans });
        continue;
      }
      if (s.startsWith('⁻¹', i)) { t.push({ k: 'o', v: '⁻¹' }); i += 2; continue; }
      if ('+-*/^()!%²'.includes(s[i])) { t.push({ k: 'o', v: s[i] }); i++; continue; }
      err('語法錯誤');
    }
    return t;
  }
  function evaluate(src) {
    const t = tokenize(src); let p = 0;
    const peek = () => t[p], isOp = v => t[p] && t[p].k === 'o' && t[p].v === v;
    const startsPrimary = () => t[p] && (t[p].k !== 'o' || t[p].v === '(');
    function expr() {
      let v = term();
      while (isOp('+') || isOp('-')) v = t[p++].v === '+' ? v + term() : v - term();
      return v;
    }
    function term() {
      let v = unary();
      for (;;) {
        if (isOp('*')) { p++; v *= unary(); }
        else if (isOp('/')) { p++; v /= nz(unary()); }
        else if (startsPrimary()) v *= unary();   // 隱含乘法：2π、3(4)、2sin(30)
        else return v;
      }
    }
    function unary() {
      if (isOp('-')) { p++; return -unary(); }
      if (isOp('+')) { p++; return unary(); }
      return power();
    }
    function power() {
      const b = postfix();
      if (isOp('^')) { p++; const x = unary(); const r = Math.pow(b, x); return isNaN(r) ? err('超出定義域') : r; }
      return b;
    }
    function postfix() {
      let v = primary();
      for (;;) {
        if (isOp('!')) { p++; v = fact(v); }
        else if (isOp('²')) { p++; v = v * v; }
        else if (isOp('⁻¹')) { p++; v = 1 / nz(v); }
        else if (isOp('%')) { p++; v = v / 100; }
        else return v;
      }
    }
    function primary() {
      const k = peek() || err('算式不完整');
      p++;
      if (k.k === 'n' || k.k === 'c') return k.v;
      if (k.k === 'f') {
        if (isOp('(')) { p++; const v = expr(); if (isOp(')')) p++; return FN[k.v](v); }
        return FN[k.v](postfix());
      }
      if (k.v === '(') { const v = expr(); if (isOp(')')) p++; return v; }   // 缺右括號自動補上
      err('語法錯誤');
    }
    if (!t.length) return null;
    const v = expr();
    if (p < t.length) err('語法錯誤');
    if (!isFinite(v)) err('數值太大或無定義');
    return v;
  }
  function fmt(v) {
    v = Number(v.toPrecision(12));
    if (v === 0) return '0';
    const a = Math.abs(v);
    if (a >= 1e12 || a < 1e-9) return v.toExponential(9).replace(/\.?0+e/, 'e').replace('e+', '×10^').replace('e', '×10^');
    return String(v);
  }

  /* ---------- 介面 ---------- */
  const KEYS = [
    ['2nd', 'DEG', '(', ')', 'AC'],
    ['sin', 'cos', 'tan', '1/x', '⌫'],
    ['csc', 'sec', 'cot', 'x²', 'xʸ'],
    ['ln', 'log', '√', 'π', 'e'],
    ['7', '8', '9', '÷', 'n!'],
    ['4', '5', '6', '×', 'EXP'],
    ['1', '2', '3', '−', 'Ans'],
    ['0', '.', '%', '+', '='],
  ];
  const TRIG = ['sin', 'cos', 'tan', 'csc', 'sec', 'cot'];
  const INS = { '(': '(', ')': ')', '1/x': '⁻¹', 'x²': '²', 'xʸ': '^', 'ln': 'ln(', 'log': 'log(', '√': '√(', 'π': 'π', 'e': 'e', '÷': '÷', '×': '×', '−': '−', '+': '+', 'n!': '!', 'EXP': 'E', 'Ans': 'Ans', '.': '.', '%': '%' };
  const POSTOP = ['⁻¹', '²', '^', '÷', '×', '+', '!', '%'];   // 空白時按這些，自動接在 Ans 後面

  function insert(txt) {
    if (justEval) {   // 剛按完 =：按運算子就接著 Ans 算，按數字／函數就重新開始
      inp.value = POSTOP.includes(txt) || txt === '−' ? 'Ans' : '';
      justEval = false;
    } else if (!inp.value && POSTOP.includes(txt)) inp.value = 'Ans';
    const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? inp.value.length;
    inp.value = inp.value.slice(0, a) + txt + inp.value.slice(b);
    const c = a + txt.length; inp.setSelectionRange(c, c);
    preview();
  }
  function preview() {
    out.classList.remove('err');
    try { const v = evaluate(inp.value); out.textContent = v === null ? '' : '= ' + fmt(v); }
    catch (e) { out.textContent = ''; }
  }
  function equals() {
    let src = inp.value.trim(); if (!src) return;
    try {
      const open = (src.match(/\(/g) || []).length - (src.match(/\)/g) || []).length;
      if (open > 0) { src += ')'.repeat(open); inp.value = src; }   // 自動補右括號
      const v = evaluate(src);
      if (v === null) return;
      ans = Number(v.toPrecision(15));
      S.hist.unshift({ x: src, r: fmt(v), v: ans, d: S.deg }); S.hist = S.hist.slice(0, 20); save();
      out.textContent = '= ' + fmt(v); justEval = true; renderHist();
    } catch (e) { out.textContent = e.message; out.classList.add('err'); }
  }
  function back() {
    justEval = false;
    const a = inp.selectionStart ?? inp.value.length, b = inp.selectionEnd ?? a;
    if (a !== b) inp.value = inp.value.slice(0, a) + inp.value.slice(b);
    else if (a > 0) {
      // 一次刪掉整個函數名稱（sin⁻¹( 、Ans 等）
      const head = inp.value.slice(0, a);
      const m = head.match(/(?:(?:sin|cos|tan|csc|sec|cot)(?:⁻¹)?\(|ln\(|log\(|√\(|Ans|⁻¹)$/);
      const n = m ? m[0].length : 1;
      inp.value = head.slice(0, -n) + inp.value.slice(a); inp.setSelectionRange(a - n, a - n);
      return preview();
    }
    inp.setSelectionRange(a, a); preview();
  }
  function press(k) {
    if (k === '=') return equals();
    if (k === 'AC') { inp.value = ''; justEval = false; return preview(); }
    if (k === '⌫') return back();
    if (k === '2nd') { second = !second; return relabel(); }
    if (k === 'DEG') { S.deg = !S.deg; save(); relabel(); return preview(); }
    if (TRIG.includes(k)) { insert(k + (second ? '⁻¹' : '') + '('); if (second) { second = false; relabel(); } return; }
    if (/^\d$/.test(k)) return insert(k);
    insert(INS[k]);
  }
  function relabel() {
    U.$$('[data-ck]', panel).forEach(b => {
      const k = b.dataset.ck;
      if (TRIG.includes(k)) b.innerHTML = second ? `${k}<sup>-1</sup>` : k;
      if (k === '2nd') b.classList.toggle('on', second);
      if (k === 'DEG') b.textContent = S.deg ? 'DEG' : 'RAD';
    });
  }
  function renderHist() {
    const h = U.$('.calc-hist', panel);
    h.innerHTML = S.hist.slice(0, 6).map((r, i) => `<div data-hi="${i}" title="點一下帶入結果"><span>${U.esc(r.x)}${/sin|cos|tan|csc|sec|cot/.test(r.x) ? `<i>${r.d ? 'DEG' : 'RAD'}</i>` : ''}</span><b>= ${U.esc(r.r)}</b></div>`).join('') || '<div class="dim">（尚無紀錄）</div>';
    U.$$('[data-hi]', h).forEach(d => d.onclick = () => { const r = S.hist[+d.dataset.hi].r; insert(r[0] === '-' ? `(${r})` : r); });
  }

  function build() {
    panel = U.h(`<div id="calcPanel" class="calc" tabindex="-1">
      <div class="calc-head"><span>🧮 科學計算機</span><button class="calc-x" title="關閉（Esc）">✕</button></div>
      <div class="calc-hist"></div>
      <input class="calc-in" inputmode="none" autocomplete="off" spellcheck="false" placeholder="例：sec(60)、cot⁻¹(1)">
      <div class="calc-out"></div>
      <div class="calc-keys">${KEYS.flat().map(k => `<button data-ck="${k}" class="${/^[\d.]$/.test(k) ? 'num' : k === '=' ? 'eq' : ['AC', '⌫'].includes(k) ? 'del' : ['÷', '×', '−', '+'].includes(k) ? 'op' : ''}">${k}</button>`).join('')}</div>
    </div>`);
    document.body.appendChild(panel);
    inp = U.$('.calc-in', panel); out = U.$('.calc-out', panel);
    U.$$('[data-ck]', panel).forEach(b => {
      b.onmousedown = e => e.preventDefault();   // 不搶走輸入框的游標
      b.onclick = () => { press(b.dataset.ck); if (!matchMedia('(pointer:coarse)').matches) inp.focus(); };
    });
    U.$('.calc-x', panel).onclick = toggle;
    inp.oninput = () => { justEval = false; preview(); };
    // 計算機內的按鍵不要傳到作答快捷鍵（1–4、A–D、Enter）
    panel.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); equals(); }
      else if (e.key === 'Escape') toggle();
      else if (e.key === 'Backspace' && e.target === inp) { e.preventDefault(); back(); }
      else if (e.target === inp && justEval && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); insert({ '*': '×', '/': '÷', '-': '−' }[e.key] || e.key);
      }
    });
    // 拖曳標題列移動
    const head = U.$('.calc-head', panel);
    head.onpointerdown = e => {
      if (e.target.closest('button')) return;
      const r = panel.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      head.setPointerCapture(e.pointerId);
      head.onpointermove = ev => {
        panel.style.left = U.clamp(ev.clientX - dx, 0, innerWidth - r.width) + 'px';
        panel.style.top = U.clamp(ev.clientY - dy, 0, innerHeight - 40) + 'px';
        panel.style.right = 'auto';
      };
      head.onpointerup = () => { head.onpointermove = head.onpointerup = null; };
    };
    relabel(); renderHist();
  }
  function toggle() {
    if (!panel) build();
    const show = panel.hidden || !panel.classList.contains('open');
    panel.hidden = !show; panel.classList.toggle('open', show);
    const b = document.getElementById('calcMini'); if (b) b.classList.toggle('on', show);
    if (show && !matchMedia('(pointer:coarse)').matches) inp.focus();
  }

  /* 頂部按鈕：放在番茄鐘按鈕右邊 */
  function mountMini() {
    const res = document.getElementById('topRes'); if (!res || document.getElementById('calcMini')) return;
    const b = document.createElement('button');
    b.className = 'px-btn small'; b.id = 'calcMini'; b.title = '科學計算機'; b.textContent = '🧮';
    b.onclick = toggle;
    const pomo = document.getElementById('pomoMini');
    res.insertBefore(b, pomo ? pomo.nextSibling : res.firstChild);
  }
  mountMini();

  return { toggle, evaluate: (s, deg) => { const d = S.deg; if (deg !== undefined) S.deg = deg; try { return evaluate(s); } finally { S.deg = d; } }, fmt };
})();
