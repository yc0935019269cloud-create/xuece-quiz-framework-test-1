/* 音訊：背景音樂（CC0，鋼琴/木吉他/豎琴，見 assets/music/CREDITS.txt）＋ 8-bit 音效（WebAudio 即時合成）＋ 音量設定 */
const VOL = (() => {
  const def = { master: 0.8, music: 0.5, sfx: 0.6, muted: false, amb: 0.7, amb_rain: 0, amb_waves: 0, amb_stream: 0, amb_fire: 0 };
  let v = def;
  try { v = Object.assign({}, def, JSON.parse(localStorage.getItem(SKEY('audio')) || '{}')); } catch (e) {}
  try { if (localStorage.getItem(SKEY('sound')) === '0') v.muted = true; } catch (e) {}
  const subs = [];
  return {
    get: k => v[k],
    set(k, val) { v[k] = val; try { localStorage.setItem(SKEY('audio'), JSON.stringify(v)); } catch (e) {} subs.forEach(f => f()); },
    music: () => v.muted ? 0 : v.master * v.music,
    sfx: () => v.muted ? 0 : v.master * v.sfx,
    on: f => subs.push(f)
  };
})();

/* 戰鬥震動：不同招式不同強度。
 * Android（Chrome 等）用 navigator.vibrate，時間長短＝強弱；iPhone／iPad 的 Safari 不支援 vibrate，
 * 改用 iOS 18 起的「開關型核取方塊」觸覺回饋：每一段震動是一下輕觸，強的招式用連續多下表現（iOS 無法調強弱）。
 * 開關記在 localStorage 'haptic'（預設開，不進存檔）；在音量面板切換。 */
const HAPTIC = (() => {
  const K = 'haptic';
  let on = true; try { on = localStorage.getItem(K) !== '0'; } catch (e) {}
  let busyUntil = 0, busyWeight = 0;
  const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function tick() {
    try {
      const l = document.createElement('label'); l.ariaHidden = 'true'; l.style.display = 'none';
      const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', '');
      l.appendChild(i); document.head.appendChild(l); l.click(); l.remove();
    } catch (e) {}
  }
  // pattern：[震, 停, 震, 停…]（毫秒）；強度＝震動長度
  function buzz(pattern) {
    if (!on) return;
    const p = [].concat(pattern);
    // 較強的震動還沒播完時，較弱的不要蓋掉它（例如作答當下的暴擊震動，不被稍後動畫裡的普通命中打斷）
    const now = Date.now(), weight = p.reduce((a, ms, k) => a + (k % 2 ? 0 : ms), 0);
    if (now < busyUntil && weight < busyWeight) return;
    busyUntil = now + p.reduce((a, b) => a + b, 0); busyWeight = weight;
    if (canVibrate) { try { navigator.vibrate(p); } catch (e) {} return; }
    if (!iOS) return;
    let t = 0;
    p.forEach((ms, k) => {
      if (k % 2 === 0) { const n = ms >= 60 ? 3 : ms >= 35 ? 2 : 1; for (let j = 0; j < n; j++) setTimeout(tick, t + j * 45); }
      t += ms + (k % 2 === 0 && ms >= 35 ? 45 : 0);
    });
  }
  /* iOS 26 之後網頁用程式切換開關不會震，只有「手指真的撥到開關」才會震。
   * 所以在 iPhone／iPad 上，把透明的原生開關疊在作答按鈕上：點答案＝撥到開關＝系統震一下（強弱無法控制）。
   * 開關在按鈕裡面，click 會冒泡到按鈕，原本的作答程式照常執行。 */
  // 所有按鈕（含計算機、計算紙、選單）都有觸覺回饋
  const TAP_SEL = 'button';
  function arm(b) {
    if (b.querySelector(':scope > .hap-sw')) return;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';   // 開關要蓋在按鈕上；原本就是 absolute／fixed 的按鈕不動
    const i = document.createElement('input'); i.type = 'checkbox'; i.setAttribute('switch', ''); i.className = 'hap-sw'; i.tabIndex = -1; i.setAttribute('aria-hidden', 'true');
    b.appendChild(i);
  }
  function armTap(root) {
    if (!iOS || !root || root.nodeType !== 1) return;
    if (root.matches(TAP_SEL)) arm(root);
    root.querySelectorAll(TAP_SEL).forEach(arm);
  }
  /* 手機：手指按在按鈕上開始滑動時，當成「捲動」而不是「點按鈕」。
   * ① 任何裝置：手指移動超過 10px 的這一次觸控，放開後的 click 一律擋掉（不會誤點進去）。
   * ② iOS：按鈕上疊了原生開關（.hap-sw），從開關上開始滑時 Safari 可能不捲動頁面；
   *    偵測到頁面沒有自己捲動時，由程式跟著手指捲動最近的可捲動區塊，放開後帶一點慣性。 */
  const scrollerOf = el => {
    for (let n = el && el.parentElement; n && n !== document.body; n = n.parentElement) {
      const oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) return n;
    }
    return document.scrollingElement || document.documentElement;
  };
  let drag = null, eatClickUntil = 0, glide = 0;
  document.addEventListener('touchstart', e => {
    cancelAnimationFrame(glide); eatClickUntil = 0;   // 新的觸控開始：上一次滑動沒有產生 click，就不要擋到這一次
    if (e.touches.length !== 1) { drag = null; return; }
    const tc = e.touches[0], sw = e.target.classList && e.target.classList.contains('hap-sw');
    drag = { x: tc.clientX, y: tc.clientY, ly: tc.clientY, lt: e.timeStamp, v: 0, moved: false, sw, sc: sw ? scrollerOf(e.target) : null, top: null, native: false };
  }, { capture: true, passive: true });
  document.addEventListener('touchmove', e => {
    if (!drag || e.touches.length !== 1) return;
    const tc = e.touches[0];
    if (!drag.moved && Math.hypot(tc.clientX - drag.x, tc.clientY - drag.y) > 10) drag.moved = true;
    if (drag.moved && drag.sw && !drag.native) {
      const sc = drag.sc;
      if (drag.top === null) drag.top = sc.scrollTop;   // 第一步先觀察：瀏覽器有沒有自己捲
      else if (Math.abs(sc.scrollTop - drag.top) > 1) drag.native = true;   // 瀏覽器自己在捲，就不插手
      else {
        const dy = drag.ly - tc.clientY, dt = Math.max(1, e.timeStamp - drag.lt);
        sc.scrollTop += dy; drag.top = sc.scrollTop;
        drag.v = 0.8 * (dy / dt) + 0.2 * drag.v;
      }
    }
    drag.ly = tc.clientY; drag.lt = e.timeStamp;
  }, { capture: true, passive: true });
  const endDrag = () => {
    if (!drag) return;
    if (drag.moved) {
      eatClickUntil = performance.now() + 400;
      if (drag.sw && !drag.native && Math.abs(drag.v) > 0.05) {
        const sc = drag.sc; let v = drag.v * 16, last = performance.now();
        const step = now => { const dt = Math.min(48, now - last) / 16; last = now; sc.scrollTop += v * dt; v *= Math.pow(0.95, dt); if (Math.abs(v) > 0.3) glide = requestAnimationFrame(step); };
        glide = requestAnimationFrame(step);
      }
    }
    drag = null;
  };
  document.addEventListener('touchend', endDrag, { capture: true, passive: true });
  document.addEventListener('touchcancel', endDrag, { capture: true, passive: true });
  window.addEventListener('click', e => {
    if (performance.now() < eatClickUntil) { eatClickUntil = 0; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
  }, true);
  if (iOS) {
    const start = () => {
      document.documentElement.classList.toggle('hap-off', !on);
      armTap(document.body);
      new MutationObserver(ms => ms.forEach(m => {
        m.addedNodes.forEach(armTap);
        // 按鈕文字被 textContent／innerHTML 換掉時開關也會被清掉，補回去
        const t = m.target.nodeType === 1 && m.target.closest(TAP_SEL); if (t) arm(t);
      })).observe(document.body, { childList: true, subtree: true });
      // 點完把焦點從開關移走，鍵盤快捷鍵（作答、Enter 繼續）才不會以為焦點在輸入框
      document.addEventListener('click', e => { if (e.target.classList && e.target.classList.contains('hap-sw')) setTimeout(() => e.target.blur(), 0); }, true);
    };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  } else if (canVibrate) {
    // Android：按任何按鈕都輕震一下（戰鬥裡較強的震動會優先，不會被這一下蓋掉）
    document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('button'); if (b && !b.disabled) buzz(8); });
  }
  // 依音效決定震動（只有戰鬥相關的音效）
  const BY_SFX = {
    hit: 18, fire: 28, thump: 25, boom: [60, 30, 120], oof: [50, 30, 30], crit: [45, 35, 70], hurt: [70, 40, 35], kill: [25, 40, 90],
    boss: [90, 60, 140], skill: [15, 30, 15, 30, 40], heal: [8, 60, 8]
  };
  const sfx = name => { if (BY_SFX[name] != null) buzz(BY_SFX[name]); };
  return {
    buzz, sfx, supported: canVibrate || iOS,
    // iOS 版本（Safari 與 iPhone 上的 Chrome 都是 WebKit）；18 以前沒有觸覺回饋
    iosVer: (() => { const m = navigator.userAgent.match(/OS (\d+)_\d+(?:_\d+)? like Mac/); return iOS ? (m ? +m[1] : 0) : null; })(),
    test() { const was = on; on = true; busyUntil = 0; buzz([60, 80, 60, 80, 120]); on = was; },
    get on() { return on; }, set(v) { on = !!v; try { localStorage.setItem(K, on ? '1' : '0'); } catch (e) {} document.documentElement.classList.toggle('hap-off', !on); if (on) buzz(30); }
  };
})();

const VOL_OK = (() => { try { const p = new Audio(); p.volume = 0.5; return Math.abs(p.volume - 0.5) < 0.01; } catch (e) { return false; } })();
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* 同一個輸出裝置／AudioContext：不要讓 iPad 在媒體混音與音效之間重新啟動不同引擎。
 * 使用裝置的預設 sampleRate，不硬指定 44.1/48 kHz，也不靠改播放速度補償音調。 */
const AUDIO_ENGINE = (() => {
  let ctx = null;
  const listeners = [], pending = new WeakMap();
  let resuming = null, resumeTimer = null, lastTime = -1, stalled = 0, lastRecovery = 0, gestureNow = false;
  function session() {
    try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e) {}
  }
  function notify() { listeners.forEach(({ wake }) => wake()); }
  function resume(repair = false, gesture = false) {
    if (!ctx || ctx.state === 'closed' || (ctx.state === 'running' && !repair) || (resuming && !gesture)) return;
    const c = ctx;
    // Safari 的 interrupted 有時只呼叫 resume 不會恢復，先 suspend 再 resume。
    // 兩個呼叫都留在手勢事件內，不等 suspend 的 Promise，以免失去 iOS 的播放授權。
    let p;
    try { if (repair || c.state === 'interrupted') c.suspend().catch(() => {}); p = c.resume(); } catch (e) { return; }
    resuming = p;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { if (resuming === p) resuming = null; }, 1500);
    p.catch(() => {}).finally(() => {
      if (resuming === p) { resuming = null; clearTimeout(resumeTimer); }
    });
  }
  function ac() {
    if (!ctx) {
      session();
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC({ latencyHint: IS_IOS ? 'playback' : 'interactive' }); } catch (e) { try { ctx = new AC(); } catch (err) { return null; } }
      ctx.addEventListener('statechange', () => { if (ctx.state === 'running') { stalled = 0; notify(); } });
    }
    resume();
    return ctx;
  }
  function prepare(el) {
    el.preload = 'auto'; el.defaultPlaybackRate = 1; el.playbackRate = 1;
    el.preservesPitch = true; el.webkitPreservesPitch = true;
  }
  function play(el) {
    const prev = pending.get(el);
    if (prev && prev.src === el.src && !gestureNow) return prev.promise;
    if (el.playbackRate !== 1) el.playbackRate = 1;
    const op = { src: el.src };
    try { op.promise = Promise.resolve(el.play()).then(() => true, () => false); } catch (e) { return Promise.resolve(false); }
    pending.set(el, op);
    const timer = setTimeout(() => { if (pending.get(el) === op) pending.delete(el); }, 2000);
    op.promise.then(() => { clearTimeout(timer); if (pending.get(el) === op) pending.delete(el); });
    return op.promise;
  }
  function wake(e) {
    gestureNow = !!(e && e.isTrusted && /^(pointerdown|pointerup|touchend|click|keydown)$/.test(e.type));
    try { session(); if (ctx) resume(false, gestureNow); notify(); } finally { gestureNow = false; }
  }
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, wake, true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  window.addEventListener('pageshow', wake);
  window.addEventListener('focus', wake);
  if (IS_IOS) setInterval(() => {
    if (document.hidden || !ctx || !listeners.some(({ wanted }) => wanted())) { stalled = 0; lastTime = -1; return; }
    if (ctx.state !== 'running') wake();
    else if (ctx.currentTime === lastTime) {
      if (++stalled >= 2 && Date.now() - lastRecovery > 5000) { lastRecovery = Date.now(); stalled = 0; resume(true); }
    } else { stalled = 0; notify(); }
    lastTime = ctx.currentTime;
  }, 1000);
  return { ac, play, prepare, wake, onWake: (wake, wanted) => listeners.push({ wake, wanted }),
    status: () => ({ state: ctx ? ctx.state : 'idle', sampleRate: ctx ? ctx.sampleRate : null }) };
})();

const SFX = (() => {
  const ac = AUDIO_ENGINE.ac;
  function tone(freq, dur, type = 'square', vol = 0.08, slide = 0, delay = 0) {
    const k = VOL.sfx(); if (!k) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol * k * 1.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.08, delay = 0) {
    const k = VOL.sfx(); if (!k) return;
    const c = ac(); if (!c) return;
    const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = buf; g.gain.value = vol * k * 1.4; s.connect(g); g.connect(c.destination);
    s.start(c.currentTime + delay);
  }
  const lib = {
    click: () => tone(660, .05, 'square', .04),
    hit: () => { noise(.12, .12); tone(220, .12, 'square', .06, -120); tone(130, .14, 'sine', .14, -80); },
    crit: () => { noise(.18, .16); tone(880, .1, 'square', .07); tone(1320, .15, 'square', .06, 0, .08); tone(110, .4, 'sine', .22, -75); },
    // 打擊重量：低頻「咚」（作答當下的衝擊）、「轟」（暴擊、必殺技、打倒）、被打的悶響
    thump: () => { tone(150, .16, 'sine', .2, -100); noise(.05, .07); },
    boom: () => { tone(120, .5, 'sine', .3, -88); tone(75, .45, 'triangle', .18, -40); noise(.3, .14); },
    oof: () => { tone(105, .22, 'sine', .22, -60); tone(70, .2, 'sawtooth', .05, -25); noise(.08, .06); },
    hurt: () => { tone(160, .25, 'sawtooth', .09, -90); noise(.1, .08); },
    miss: () => tone(300, .15, 'triangle', .06, -150),
    correct: () => { tone(660, .08, 'square', .06); tone(990, .12, 'square', .06, 0, .08); },
    wrong: () => { tone(240, .12, 'square', .06); tone(180, .2, 'square', .06, 0, .1); },
    coin: () => { tone(988, .06, 'square', .05); tone(1319, .12, 'square', .05, 0, .06); },
    heal: () => { [523, 659, 784].forEach((f, i) => tone(f, .12, 'triangle', .07, 0, i * .07)); },
    level: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'square', .06, 0, i * .09)); },
    win: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .18, 'square', .06, 0, i * .12)); },
    lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, .25, 'triangle', .08, 0, i * .2)); },
    kill: () => { noise(.3, .1); tone(400, .3, 'square', .06, -350); },
    open: () => { tone(300, .08, 'square', .05, 300); tone(700, .12, 'square', .05, 0, .08); },
    pet: () => { tone(1200, .06, 'sine', .07); tone(1600, .08, 'sine', .06, 0, .06); },
    fire: () => { noise(.25, .08); tone(500, .25, 'sawtooth', .05, -300); },
    skill: () => { [880, 1175, 1568].forEach((f, i) => tone(f, .1, 'square', .05, 0, i * .05)); noise(.15, .05, .1); },
    tick: () => tone(1500, .03, 'square', .03),
    boss: () => { tone(110, .6, 'sawtooth', .1, -40); noise(.5, .1, .1); }
  };
  function play(name) { try { lib[name] && lib[name](); } catch (e) {} HAPTIC.sfx(name); }
  /* 番茄鐘提示音：音量只受總音量與靜音影響（不受音效音量影響），可指定音量與重複次數 */
  function bell(freq, t0, dur, vol, type = 'sine') {
    const c = ac(); if (!c) return;
    const t = c.currentTime + t0;
    [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(([m, a]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq * m, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * a, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur / m);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  const CHIMES = {
    bell: { name: '清脆鈴聲', len: 1.6, f: (v, t) => { bell(1319, t, 1.4, v); bell(988, t + 0.35, 1.6, v); } },
    musicbox: { name: '音樂盒', len: 1.8, f: (v, t) => [1047, 1319, 1568, 2093, 1568, 2637].forEach((n, i) => bell(n, t + i * 0.17, 0.9, v * 0.7, 'triangle')) },
    harp: { name: '豎琴琶音', len: 1.6, f: (v, t) => [523, 659, 784, 1047, 1319, 1568, 2093].forEach((n, i) => bell(n, t + i * 0.09, 1.3, v * 0.6)) },
    bowl: { name: '頌缽', len: 3.2, f: (v, t) => { bell(262, t, 3.2, v * 1.1); bell(393, t + 0.02, 2.6, v * 0.5); } },
    birds: { name: '小鳥啾啾', len: 1.5, f: (v, t) => { const c = ac(); if (!c) return; [0, 0.18, 0.36, 0.8, 0.95].forEach(d => { const tt = c.currentTime + t + d, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(2800, tt); o.frequency.exponentialRampToValueAtTime(4200, tt + 0.08); o.frequency.exponentialRampToValueAtTime(3000, tt + 0.13); g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(v * 0.5, tt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.14); o.connect(g); g.connect(c.destination); o.start(tt); o.stop(tt + 0.16); }); } },
    fanfare: { name: '8-bit 過關', len: 1.4, f: (v, t) => [523, 659, 784, 1047, 784, 1047].forEach((n, i) => bell(n, t + i * 0.12, 0.35, v * 0.45, 'square')) }
  };
  function chime(name, vol = 0.6, times = 1) {
    if (VOL.get('muted')) return;
    const ch = CHIMES[name] || CHIMES.bell, v = Math.max(0.0001, vol * VOL.get('master') * 0.5);
    for (let i = 0; i < times; i++) ch.f(v, i * (ch.len + 0.4));
  }
  function toggle() { VOL.set('muted', !VOL.get('muted')); return !VOL.get('muted'); }
  /* 連擊音效：連擊越高音越高（半音一階，最多升一個八度） */
  function combo(n) { const f = 523 * Math.pow(2, Math.min(n - 2, 12) / 12); tone(f, .07, 'square', .05); tone(f * 1.5, .1, 'square', .045, 0, .06); }
  return { play, combo, chime, CHIMES, toggle, get on() { return !VOL.get('muted'); } };
})();

/* 音量混音：iOS Safari 的 audio.volume 是唯讀（永遠 1），滑桿除了 0 以外都一樣大聲。
 * 偵測到不能調音量時，把 <audio> 接到 Web Audio 的 GainNode，用 gain 控制音量。
 * 只在 http(s) 啟用：file:// 下 createMediaElementSource 會被當成跨來源而變成無聲；能調 volume 的裝置完全不走這裡。 */
const MIX = (() => {
  const http = /^https?:$/.test(location.protocol);
  const need = (IS_IOS || !VOL_OK) && http;
  const gains = new Map();
  /* 必須在使用者點擊（解鎖）之後呼叫，AudioContext 才會是 running */
  function attach(el) {
    if (!need || gains.has(el)) return;
    const c = AUDIO_ENGINE.ac(); if (!c) return;
    try { const s = c.createMediaElementSource(el), g = c.createGain(); g.gain.value = 0; s.connect(g); g.connect(c.destination); gains.set(el, g); } catch (e) {}
  }
  function setVol(el, v) { const g = gains.get(el); if (g) g.gain.value = v; else el.volume = v; }
  const ok = el => gains.has(el) || (VOL_OK && !IS_IOS);   // 這個元素的音量能不能真的被控制
  function info() {
    if (need) return gains.size ? `Web Audio 音量控制（${AUDIO_ENGINE.status().state}）` : 'Web Audio 音量控制（點一下畫面後啟用）';
    if (IS_IOS || !VOL_OK) return http ? '無法調整音量' : '無法調整音量（用檔案開啟；請改用網址開啟）';
    return '瀏覽器原生音量';
  }
  return { need, attach, setVol, ok, info };
})();

/* 背景音樂：桌機用兩個 <audio> 交叉淡入淡出；iOS 重用一個播放器，減少解碼器／輸出路徑切換。
 * 第一次點擊畫面後才開始播放（瀏覽器自動播放限制）。
 * 三種模式（存在 xd_audio.bgm）：
 *   scene：依場景播放（每個場景可指定一首，或「從歌單隨機」）
 *   one：  所有場景同一首，切換畫面不中斷
 *   list： 歌單依序（或隨機）循環，切換畫面不中斷
 * 所有檔案都用 tools/music_norm.py 統一到 -18 LUFS，音量一致。 */
const BGM = (() => {
  const T = (src, name, kind, mine) => ({ src: 'assets/music/' + src, name, kind, mine: !!mine });
  const TRACKS = {
    // 使用者提供（個人使用）
    u_river_piano: T('u_river_piano.mp3', 'River Flows in You — Yiruma', 'piano', 1),
    u_kanon_winston: T('u_kanon_winston.mp3', 'Variations on the Kanon — George Winston', 'piano', 1),
    u_river_guitar: T('u_river_guitar.mp3', 'River Flows in You（吉他）— Youngso Kim', 'guitar', 1),
    u_likeastar: T('u_likeastar.mp3', 'Like A Star — Youngso Kim', 'guitar', 1),
    u_littlestory: T('u_littlestory.mp3', 'A Little Story — Valentin', 'guitar', 1),
    u_felicity: T('u_felicity.mp3', 'Felicity（指彈吉他）', 'guitar', 1),
    u_canon_kindgren: T('u_canon_kindgren.mp3', 'Canon in D — Per-Olov Kindgren', 'guitar', 1),
    u_rylynn: T('u_rylynn.mp3', 'Rylynn — Andy McKee', 'guitar', 1),
    u_pooh: T('u_pooh.mp3', '百畝森林的午後（古典音樂歌單・65 分鐘）', 'mixed', 1),
    // CC0（OpenGameArt）
    c_etirwer: T('c_etirwer.mp3', 'Etirwer（尼龍吉他）', 'guitar'),
    c_balance: T('c_balance.mp3', 'Balance（木吉他）', 'guitar'),
    c_autumn: T('c_autumn.mp3', 'Aimless Autumn（古典吉他）', 'guitar'),
    title: T('title.mp3', 'Apple Cider（木吉他）', 'guitar'),
    stage2: T('stage2.mp3', 'Sunset Plains（吉他）', 'guitar'),
    c_snowfall: T('c_snowfall.mp3', 'Snowfall（鋼琴圓舞曲）', 'piano'),
    c_jrpg1: T('c_jrpg1.mp3', 'JRPG Piano', 'piano'),
    level2: T('level2.mp3', 'JRPG2 Piano', 'piano'),
    select: T('select.mp3', 'Calm Piano 1', 'piano'),
    level3: T('level3.mp3', 'Yoiyami（深藍鋼琴）', 'piano'),
    boss: T('boss.mp3', 'Emotional Piano Loop', 'piano'),
    stage1: T('stage1.mp3', 'A Small Fire Will Do', 'mixed'),
    level1: T('level1.mp3', 'Happy Lullaby', 'mixed'),
    ending: T('ending.mp3', 'Meadow Thoughts（豎琴）', 'mixed')
  };
  const KIND = { guitar: '吉他', piano: '鋼琴', mixed: '其他' };
  const SCENES = [['hub', '營地'], ['menu', '選單與其他畫面'], ['map', '深淵地圖'], ['event', '事件・篝火・商店'], ['battle', '一般戰鬥'], ['elite', '精英戰'], ['boss', '首領戰'], ['win', '通關・寶藏']];
  // 程式各處呼叫 BGM.play(舊曲名) → 換算成場景
  const SCENE_OF = { title: 'hub', select: 'menu', stage1: 'event', stage2: 'map', level1: 'battle', level2: 'battle', level3: 'elite', boss: 'boss', ending: 'win' };
  const DEF = {
    mode: 'scene',
    scene: { hub: 'u_pooh', menu: 'select', map: 'c_balance', event: 'c_etirwer', battle: 'shuffle', elite: 'level3', boss: 'boss', win: 'ending' },
    one: 'u_river_piano',
    list: ['u_river_piano', 'u_littlestory', 'c_snowfall', 'u_likeastar', 'u_kanon_winston', 'c_etirwer', 'u_river_guitar', 'c_jrpg1', 'u_felicity', 'c_balance', 'u_canon_kindgren', 'c_autumn', 'u_rylynn'],
    shuffle: false
  };
  function cfg() {
    const c = VOL.get('bgm') || {};
    const out = Object.assign({}, DEF, c);
    out.scene = Object.assign({}, DEF.scene, c.scene || {});
    out.list = (out.list || []).filter(id => TRACKS[id]);
    if (!out.list.length) out.list = DEF.list.slice();
    return out;
  }
  function setCfg(patch) { VOL.set('bgm', Object.assign(cfg(), patch)); apply(true); }

  const a = IS_IOS ? [new Audio()] : [new Audio(), new Audio()];
  a.forEach(x => {
    AUDIO_ENGINE.prepare(x); x.loop = true; x.volume = 0;
    x.addEventListener('ended', () => { if (x === a[cur]) onEnded(); });
    x.addEventListener('canplay', () => { if (x === a[cur] && unlocked && target() > 0 && x.paused) AUDIO_ENGINE.play(x); });
  });
  // iOS 不能讀回 volume 判斷淡出完成（否則舊曲永遠不會暫停），所以另外記錄「邏輯音量」lv，
  // 實際音量交給 MIX.setVol（iOS 走 GainNode）。完全無法控制音量時，切歌／靜音改成直接暫停。
  const lv = [0, 0];
  let cur = 0, curName = null, unlocked = false, fadeT = null, curScene = 'hub', shufPick = {}, listIdx = 0, preview = false;
  let held = false, ovr = null; // held：番茄鐘專注時暫停音樂；ovr：番茄鐘專注時指定的曲目
  let duckN = 0; // duckN：念單詞發音時暫時調小聲（不暫停），用計數器防止連點時提早恢復
  function target() { return held ? 0 : VOL.music() * (duckN > 0 ? 0.25 : 1); }
  function fade() {
    clearInterval(fadeT);
    if (!MIX.ok(a[cur])) {
      // 無法確定音量能不能調：不做淡入淡出，但還是試著直接寫 volume——
      // 真的唯讀的裝置寫了沒作用（不影響原本行為），但如果其實可以寫、只是 GainNode 沒接成功，
      // 至少不會卡在建立 <audio> 當下設的 volume=0 永遠無聲。
      const t = target();
      a.forEach((x, i) => {
        lv[i] = i === cur ? t : 0;
        try { x.volume = lv[i]; } catch (e) {}
        if (lv[i] <= 0.001 && !x.paused) x.pause();
      });
      return;
    }
    fadeT = setInterval(() => {
      const t = target(); let done = true;
      a.forEach((x, i) => {
        const goal = i === cur ? t : 0;
        lv[i] = Math.max(0, Math.min(1, lv[i] + Math.sign(goal - lv[i]) * Math.min(0.05, Math.abs(goal - lv[i]))));
        MIX.setVol(x, lv[i]);
        if (Math.abs(lv[i] - goal) > 0.001) done = false;
        if (lv[i] <= 0.001 && !x.paused) x.pause();   // 淡出完成（含靜音、番茄鐘暫停）就真的暫停
      });
      if (done) clearInterval(fadeT);
    }, 60);
  }
  function set(id, loop) {
    if (!TRACKS[id]) return;
    if (id === curName) { a[cur].loop = loop; if (unlocked && target() > 0 && a[cur].paused) AUDIO_ENGINE.play(a[cur]); return; }
    curName = id;
    cur = a.length === 1 ? 0 : 1 - cur;
    const x = a[cur];
    if (a.length === 1) x.pause();
    x.loop = loop; x.src = TRACKS[id].src; x.currentTime = 0; MIX.setVol(x, 0); lv[cur] = 0;
    if (unlocked && target() > 0) AUDIO_ENGINE.play(x);
    fade();
    notify();
  }
  const pickRandom = (list, avoid) => { const l = list.filter(id => id !== avoid); return l.length ? l[Math.floor(Math.random() * l.length)] : list[0]; };
  /* 依目前設定決定該播哪一首 */
  function apply(force) {
    preview = false;
    if (ovr) return set(ovr, true);
    const c = cfg();
    if (c.mode === 'one') return set(c.one, true);
    if (c.mode === 'list') {
      if (curName && c.list.includes(curName) && !force) { a[cur].loop = false; return; }
      if (force && curName && c.list.includes(curName)) { listIdx = c.list.indexOf(curName); a[cur].loop = false; return; }
      listIdx = c.shuffle ? Math.floor(Math.random() * c.list.length) : 0;
      return set(c.list[listIdx], false);
    }
    let id = c.scene[curScene];
    if (id === 'shuffle') {
      if (!shufPick[curScene] || !c.list.includes(shufPick[curScene])) shufPick[curScene] = pickRandom(c.list);
      id = shufPick[curScene];
    }
    set(id, true);
  }
  function play(key) { curScene = SCENE_OF[key] || key; apply(); }
  function next(dir = 1) {
    const c = cfg(); preview = false;
    if (c.mode !== 'list') {
      // 其他模式：換成歌單裡的下一首（不改設定，下次換場景會恢復）
      const i = c.list.indexOf(curName); set(c.list[(i + dir + c.list.length) % c.list.length], true); preview = true; return;
    }
    listIdx = c.shuffle ? c.list.indexOf(pickRandom(c.list, curName)) : (c.list.indexOf(curName) + dir + c.list.length) % c.list.length;
    set(c.list[listIdx], false);
  }
  function onEnded() { if (cfg().mode === 'list' && !preview) next(1); else { a[cur].currentTime = 0; if (target() > 0) AUDIO_ENGINE.play(a[cur]); } }
  function listen(id) { preview = true; set(id, true); }
  const subs = [];
  function notify() { document.querySelectorAll('[data-track]').forEach(e => { e.textContent = curName ? TRACKS[curName].name : '—'; }); subs.forEach(f => f()); }
  function unlock() {
    if (unlocked) return; unlocked = true;
    a.forEach(MIX.attach);
    if (curName && target() > 0) AUDIO_ENGINE.play(a[cur]);
    fade();
  }
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, true));
  AUDIO_ENGINE.onWake(() => {
    if (!unlocked) return;
    a.forEach(MIX.attach);
    if (curName && target() > 0 && a[cur].paused) AUDIO_ENGINE.play(a[cur]);
    fade();
  }, () => unlocked && !!curName && target() > 0);
  VOL.on(() => {
    if (target() > 0 && unlocked && a[cur].paused && curName) AUDIO_ENGINE.play(a[cur]);
    fade();
  });
  return {
    hold(on) { held = !!on; if (!held && unlocked && curName && a[cur].paused) AUDIO_ENGINE.play(a[cur]); fade(); },
    duck(on) { duckN = Math.max(0, duckN + (on ? 1 : -1)); fade(); },
    override(id) { ovr = id && TRACKS[id] ? id : null; apply(true); },
    play, next, listen, cfg, setCfg, apply, TRACKS, SCENES, KIND, DEF, onChange: f => subs.push(f),
    get track() { return curName ? TRACKS[curName].name : '—'; }, get current() { return curName; }, get scene() { return curScene; },
    status: () => ({ playing: !!curName && !a[cur].paused, rate: a[cur].playbackRate, t: a[cur].currentTime, players: a.length })
  };
})();

/* 白噪音：iOS 網址播放用短音檔的 AudioBuffer 連續循環，避免每圈重新 play／seek 與 JS 計時器斷音。
 * 桌機／本機檔案保留媒體播放器，只有下一段確實播放成功才淡出上一段。 */
const AMB = (() => {
  const TYPES = {
    rain: { name: '雨聲', icon: '🌧', src: 'assets/ambient/rain.mp3' },
    waves: { name: '海浪', icon: '🌊', src: 'assets/ambient/waves.mp3' },
    stream: { name: '水流', icon: '💧', src: 'assets/ambient/stream.mp3' },
    fire: { name: '柴火', icon: '🔥', src: 'assets/ambient/fire.mp3' }
  };
  const PRESETS = [
    { name: '全部關閉', v: {} },
    { name: '雨夜讀書', v: { rain: 0.6, fire: 0.35 } },
    { name: '海邊', v: { waves: 0.7 } },
    { name: '溪邊營火', v: { stream: 0.5, fire: 0.5 } },
    { name: '森林小溪', v: { stream: 0.7 } },
    { name: '暴風雨', v: { rain: 0.9, waves: 0.4 } }
  ];
  const P = {};
  const useBuffer = IS_IOS && /^https?:$/.test(location.protocol), failed = new Set();
  let unlocked = false;
  const vol = k => VOL.get('muted') ? 0 : VOL.get('master') * VOL.get('amb') * (VOL.get('amb_' + k) || 0);
  // 把尾端與開頭的 2.4 秒預先交疊；迴圈由音訊執行緒處理，主執行緒卡住也不會漏播下一圈。
  function seamless(c, b) {
    const n = Math.min(Math.round(b.sampleRate * 2.4), Math.floor(b.length / 4));
    if (!n) return b;
    const out = c.createBuffer(b.numberOfChannels, b.length - n, b.sampleRate);
    for (let ch = 0; ch < b.numberOfChannels; ch++) {
      const src = b.getChannelData(ch), dst = out.getChannelData(ch), tail = b.length - 2 * n;
      dst.set(src.subarray(n, b.length - n));
      for (let i = 0; i < n; i++) { const r = i / (n - 1 || 1); dst[tail + i] = src[b.length - n + i] * (1 - r) + src[i] * r; }
    }
    return out;
  }
  const position = o => o.buffer ? (o.offset + (o.source ? o.ctx.currentTime - o.startedAt : 0)) % o.buffer.duration : 0;
  function stopBuffer(o) {
    if (!o.source) return;
    o.offset = position(o);
    const s = o.source; o.source = null;
    try { s.stop(); } catch (e) {} s.disconnect();
  }
  function refreshBuffer(k, o, v) {
    if (!v) { stopBuffer(o); o.gain.gain.value = 0; return; }
    if (!o.buffer) return;
    if (o.level !== v) {
      o.gain.gain.cancelScheduledValues(o.ctx.currentTime);
      o.gain.gain.setTargetAtTime(Math.min(1, v), o.ctx.currentTime, 0.03); o.level = v;
    }
    if (o.source) return;
    const s = o.ctx.createBufferSource();
    s.buffer = o.buffer; s.loop = true; s.playbackRate.value = 1;
    s.connect(o.gain); o.source = s; o.startedAt = o.ctx.currentTime;
    s.addEventListener('ended', () => { if (o.source === s) o.source = null; s.disconnect(); });
    s.start(0, o.offset);
  }
  function ensure(k) {
    if (P[k]) return P[k];
    if (useBuffer && !failed.has(k)) {
      const c = AUDIO_ENGINE.ac();
      if (c) {
        const o = { ctx: c, buffer: null, source: null, gain: c.createGain(), level: 0, offset: 0, startedAt: 0 };
        P[k] = o; o.gain.gain.value = 0; o.gain.connect(c.destination);
        o.loading = fetch(TYPES[k].src).then(r => { if (!r.ok) throw new Error('Ambient HTTP ' + r.status); return r.arrayBuffer(); })
          .then(data => c.decodeAudioData(data)).then(b => { o.buffer = seamless(c, b); refresh(); })
          .catch(() => { o.gain.disconnect(); failed.add(k); if (P[k] === o) { delete P[k]; refresh(); } });
        return o;
      }
      failed.add(k);
    }
    const o = { a: IS_IOS ? [new Audio(TYPES[k].src)] : [new Audio(TYPES[k].src), new Audio(TYPES[k].src)], cur: 0, fading: false, timer: null, seq: 0, retryAfter: 0 };
    o.a.forEach((x, i) => {
      AUDIO_ENGINE.prepare(x); x.loop = true; x.volume = 0; MIX.attach(x); MIX.setVol(x, 0);
      x.addEventListener('timeupdate', () => {
        if (o.a.length < 2 || i !== o.cur || o.fading || !Number.isFinite(x.duration) || Date.now() < o.retryAfter || vol(k) <= 0) return;
        if (x.duration - x.currentTime < 2.5) crossfade(k);
      });
      x.addEventListener('canplay', () => { if (i === o.cur && !o.fading && unlocked && vol(k) > 0 && x.paused) AUDIO_ENGINE.play(x); });
      x.addEventListener('ended', () => { if (i === o.cur && vol(k) > 0) { x.currentTime = 0; AUDIO_ENGINE.play(x); } });
    });
    return (P[k] = o);
  }
  function cancelFade(o) { o.seq++; clearInterval(o.timer); o.timer = null; o.fading = false; }
  function crossfade(k) {
    const o = P[k]; if (!o || o.fading || vol(k) <= 0) return;
    o.fading = true;
    const seq = ++o.seq;
    const from = o.a[o.cur], to = o.a[1 - o.cur];
    to.currentTime = 0; MIX.setVol(to, 0);
    AUDIO_ENGINE.play(to).then(ok => {
      if (seq !== o.seq || vol(k) <= 0) { if (vol(k) <= 0 || (!o.fading && to !== o.a[o.cur])) to.pause(); return; }
      if (!ok) { o.fading = false; o.retryAfter = Date.now() + 2000; MIX.setVol(from, Math.min(1, vol(k))); return; }
      o.cur = 1 - o.cur;
      const t0 = Date.now();
      o.timer = setInterval(() => {
        if (seq !== o.seq) return;
        const r = Math.min(1, (Date.now() - t0) / 2400), v = vol(k);
        MIX.setVol(to, Math.min(1, v * r)); MIX.setVol(from, Math.min(1, v * (1 - r)));
        if (r >= 1) { clearInterval(o.timer); o.timer = null; from.pause(); o.fading = false; }
      }, 60);
    });
  }
  function refresh() {
    Object.keys(TYPES).forEach(k => {
      const v = vol(k);
      if (v > 0) {
        if (!unlocked) return;
        const o = ensure(k);
        if (!o.a) { refreshBuffer(k, o, v); return; }
        const x = o.a[o.cur];
        if (!o.fading) MIX.setVol(x, Math.min(1, v));
        if (x.paused) AUDIO_ENGINE.play(x);
      } else if (P[k]) {
        const o = P[k];
        if (!o.a) { refreshBuffer(k, o, 0); o.level = 0; }
        else { cancelFade(o); o.a.forEach(x => { x.pause(); MIX.setVol(x, 0); }); }
      }
    });
  }
  function unlock() { if (!unlocked) { unlocked = true; refresh(); } }
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, true));
  AUDIO_ENGINE.onWake(() => { if (unlocked) refresh(); }, () => unlocked && Object.keys(TYPES).some(k => vol(k) > 0));
  VOL.on(refresh);
  function applyPreset(i) { const pr = PRESETS[i]; Object.keys(TYPES).forEach(k => VOL.set('amb_' + k, pr.v[k] || 0)); }
  function active() { return Object.keys(TYPES).filter(k => (VOL.get('amb_' + k) || 0) > 0); }
  function status() { return Object.fromEntries(Object.entries(P).map(([k, o]) => [k, o.a ? { backend: 'media', playing: !o.a[o.cur].paused, t: +o.a[o.cur].currentTime.toFixed(1), vol: vol(k) } :
    { backend: 'buffer', playing: !!o.source && o.ctx.state === 'running', loading: !o.buffer, t: +position(o).toFixed(1), duration: o.buffer ? o.buffer.duration : 0, vol: vol(k) }])); }
  function _seek(k, t) {
    const o = P[k]; if (!o) return;
    if (o.a) o.a[o.cur].currentTime = t;
    else if (o.buffer) { stopBuffer(o); o.offset = Math.max(0, t) % o.buffer.duration; refresh(); }
  }
  return { TYPES, PRESETS, refresh, applyPreset, active, status, _seek };
})();
