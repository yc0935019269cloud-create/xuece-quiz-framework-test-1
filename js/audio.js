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

const SFX = (() => {
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
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
    hit: () => { noise(.12, .12); tone(220, .12, 'square', .06, -120); },
    crit: () => { noise(.18, .16); tone(880, .1, 'square', .07); tone(1320, .15, 'square', .06, 0, .08); },
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
  function play(name) { try { lib[name] && lib[name](); } catch (e) {} }
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
  return { play, chime, CHIMES, toggle, get on() { return !VOL.get('muted'); } };
})();

/* 音量混音：iOS Safari 的 audio.volume 是唯讀（永遠 1），滑桿除了 0 以外都一樣大聲。
 * 偵測到不能調音量時，把 <audio> 接到 Web Audio 的 GainNode，用 gain 控制音量。
 * 只在 http(s) 啟用：file:// 下 createMediaElementSource 會被當成跨來源而變成無聲；能調 volume 的裝置完全不走這裡。 */
const VOL_OK = (() => { try { const p = new Audio(); p.volume = 0.5; return Math.abs(p.volume - 0.5) < 0.01; } catch (e) { return false; } })();
// 新版 iOS 可能會「回報」設定的 volume 卻不套用，所以只靠讀回值判斷不可靠 → 另外直接認 iPhone／iPad（含偽裝成 Mac 的 iPadOS）
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const MIX = (() => {
  const http = /^https?:$/.test(location.protocol);
  const need = (IS_IOS || !VOL_OK) && http;
  let ctx = null;
  const gains = new Map();
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }
  /* 必須在使用者點擊（解鎖）之後呼叫，AudioContext 才會是 running */
  function attach(el) {
    if (!need || gains.has(el)) return;
    const c = ac(); if (!c) return;
    try { const s = c.createMediaElementSource(el), g = c.createGain(); g.gain.value = 0; s.connect(g); g.connect(c.destination); gains.set(el, g); } catch (e) {}
  }
  function setVol(el, v) { const g = gains.get(el); if (g) g.gain.value = v; else el.volume = v; }
  const ok = el => gains.has(el) || (VOL_OK && !IS_IOS);   // 這個元素的音量能不能真的被控制
  // iOS 只在 touchend／click 這類手勢裡允許啟動 AudioContext；被來電、切 App 中斷後也要重新 resume
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, () => { if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); }, true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state !== 'running') ctx.resume().catch(() => {}); });
  function info() {
    if (need) return gains.size ? `Web Audio 音量控制（${ctx ? ctx.state : '—'}）` : 'Web Audio 音量控制（點一下畫面後啟用）';
    if (IS_IOS || !VOL_OK) return http ? '無法調整音量' : '無法調整音量（用檔案開啟；請改用網址開啟）';
    return '瀏覽器原生音量';
  }
  return { need, attach, setVol, ok, info };
})();

/* 背景音樂：兩個 <audio> 交叉淡入淡出，第一次點擊畫面後才開始播放（瀏覽器自動播放限制）
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

  const a = [new Audio(), new Audio()];
  a.forEach(x => { x.loop = true; x.preload = 'auto'; x.volume = 0; x.addEventListener('ended', () => { if (x === a[cur]) onEnded(); }); });
  // iOS 不能讀回 volume 判斷淡出完成（否則舊曲永遠不會暫停），所以另外記錄「邏輯音量」lv，
  // 實際音量交給 MIX.setVol（iOS 走 GainNode）。完全無法控制音量時，切歌／靜音改成直接暫停。
  const lv = [0, 0];
  let cur = 0, curName = null, unlocked = false, fadeT = null, curScene = 'hub', shufPick = {}, listIdx = 0, preview = false;
  let held = false, ovr = null; // held：番茄鐘專注時暫停音樂；ovr：番茄鐘專注時指定的曲目
  function target() { return held ? 0 : VOL.music(); }
  function fade() {
    clearInterval(fadeT);
    if (!MIX.ok(a[cur])) {
      // 無法調音量：不做淡入淡出，非目前曲目與音量為 0 時直接暫停
      const t = target();
      a.forEach((x, i) => {
        lv[i] = i === cur ? t : 0;
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
    if (id === curName) { a[cur].loop = loop; if (unlocked && target() > 0 && a[cur].paused) a[cur].play().catch(() => {}); return; }
    curName = id;
    cur = 1 - cur;
    const x = a[cur];
    x.loop = loop; x.src = TRACKS[id].src; x.currentTime = 0; MIX.setVol(x, 0); lv[cur] = 0;
    if (unlocked && target() > 0) x.play().catch(() => {});
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
  function onEnded() { if (cfg().mode === 'list' && !preview) next(1); else { a[cur].currentTime = 0; a[cur].play().catch(() => {}); } }
  function listen(id) { preview = true; set(id, true); }
  const subs = [];
  function notify() { document.querySelectorAll('[data-track]').forEach(e => { e.textContent = curName ? TRACKS[curName].name : '—'; }); subs.forEach(f => f()); }
  function unlock() {
    if (unlocked) return; unlocked = true;
    a.forEach(MIX.attach);
    if (curName && target() > 0) a[cur].play().catch(() => {});
    fade();
  }
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, { once: false, capture: true }));
  VOL.on(() => {
    if (target() > 0 && unlocked && a[cur].paused && curName) a[cur].play().catch(() => {});
    fade();
  });
  return {
    hold(on) { held = !!on; if (!held && unlocked && curName && a[cur].paused) a[cur].play().catch(() => {}); fade(); },
    override(id) { ovr = id && TRACKS[id] ? id : null; apply(true); },
    play, next, listen, cfg, setCfg, apply, TRACKS, SCENES, KIND, DEF, onChange: f => subs.push(f),
    get track() { return curName ? TRACKS[curName].name : '—'; }, get current() { return curName; }, get scene() { return curScene; }
  };
})();

/* 白噪音：雨聲／海浪／水流／柴火，可同時混合，各自調音量；兩個 <audio> 交疊淡入淡出做無縫循環 */
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
  let unlocked = false;
  const vol = k => VOL.get('muted') ? 0 : VOL.get('master') * VOL.get('amb') * (VOL.get('amb_' + k) || 0);
  function ensure(k) {
    if (P[k]) return P[k];
    const o = { a: [new Audio(TYPES[k].src), new Audio(TYPES[k].src)], cur: 0, fading: false };
    o.a.forEach((x, i) => {
      x.preload = 'auto'; x.volume = 0; MIX.attach(x); MIX.setVol(x, 0);   // ensure 只在解鎖後呼叫
      x.addEventListener('timeupdate', () => {
        if (i !== o.cur || o.fading || !x.duration) return;
        if (x.duration - x.currentTime < 2.5) crossfade(k);
      });
      x.addEventListener('ended', () => { if (i === o.cur && vol(k) > 0) { x.currentTime = 0; x.play().catch(() => {}); } });
    });
    return (P[k] = o);
  }
  function crossfade(k) {
    const o = P[k]; o.fading = true;
    const from = o.a[o.cur], to = o.a[1 - o.cur];
    to.currentTime = 0; MIX.setVol(to, 0); to.play().catch(() => {});
    o.cur = 1 - o.cur;
    const t0 = Date.now();
    const iv = setInterval(() => {
      const r = Math.min(1, (Date.now() - t0) / 2400), v = vol(k);
      MIX.setVol(to, Math.min(1, v * r)); MIX.setVol(from, Math.min(1, v * (1 - r)));
      if (r >= 1) { clearInterval(iv); from.pause(); o.fading = false; }
    }, 60);
  }
  function refresh() {
    Object.keys(TYPES).forEach(k => {
      const v = vol(k);
      if (v > 0) {
        if (!unlocked) return;
        const o = ensure(k), x = o.a[o.cur];
        if (!o.fading) MIX.setVol(x, Math.min(1, v));
        if (x.paused) x.play().catch(() => {});
      } else if (P[k]) P[k].a.forEach(x => x.pause());
    });
  }
  function unlock() { if (!unlocked) { unlocked = true; refresh(); } }
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, unlock, true));
  VOL.on(refresh);
  function applyPreset(i) { const pr = PRESETS[i]; Object.keys(TYPES).forEach(k => VOL.set('amb_' + k, pr.v[k] || 0)); }
  function active() { return Object.keys(TYPES).filter(k => (VOL.get('amb_' + k) || 0) > 0); }
  function status() { return Object.fromEntries(Object.entries(P).map(([k, o]) => [k, { playing: !o.a[o.cur].paused, t: +o.a[o.cur].currentTime.toFixed(1), vol: +o.a[o.cur].volume.toFixed(2) }])); }
  function _seek(k, t) { if (P[k]) P[k].a[P[k].cur].currentTime = t; }
  return { TYPES, PRESETS, refresh, applyPreset, active, status, _seek };
})();
