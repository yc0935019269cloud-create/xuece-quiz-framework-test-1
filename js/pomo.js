/* 番茄鐘＋專注花園
 * - 計時用「結束時間戳」存在 localStorage（xd_pomo），換畫面、重新整理、關掉再開都不會跑掉；頂部列有迷你計時器。
 * - 每完成一次專注，就在「專注花園」種下一株程式生成的像素植物：專注越久長得越大（小草→小花→花叢→樹→巨木），
 *   顏色隨機、6% 機率是「閃耀」版本；每 10 株組成一塊花圃，花圃主題輪替、無限延伸。不給魂晶。
 * - 植物圖由 PlantArt 用種子即時畫出（24×32 像素，自動描邊），只存種子與品種，不存圖片。 */
const PlantArt = (() => {
  const W = 24, H = 32;
  const OUT = '#4a3040', GOLD = '#c99a2e';
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k))); return '#' + [n >> 16, n >> 8 & 255, n & 255].map(f).map(x => x.toString(16).padStart(2, '0')).join(''); };
  const G = '#5fb84f', GD = '#3f8f3b', GL = '#8fe07a', BR = '#8a5a34', BRD = '#6b4424';

  function canvasOps(g, r) {
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 1 && x < W - 1 && y >= 1 && y < H) g[y][x] = c; };
    return {
      set, r,
      rect: (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); },
      disc: (cx, cy, rad, c) => { for (let y = -rad - 1; y <= rad + 1; y++) for (let x = -rad - 1; x <= rad + 1; x++) if (x * x + y * y <= rad * rad + rad * 0.6) set(cx + x, cy + y, c); },
      ell: (cx, cy, rx, ry, c) => { for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx + 0.5) + (y * y) / (ry * ry + 0.5) <= 1) set(cx + x, cy + y, c); },
      stem: (x, y0, y1, c = G) => { for (let y = y1; y <= y0; y++) set(x, y, c); },
      dots: (cx, cy, rad, n, c) => { for (let i = 0; i < n; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * rad; set(cx + Math.cos(a) * d, cy + Math.sin(a) * d, c); } }
    };
  }
  const leaf = (o, x, y, dir) => { o.set(x, y, G); o.set(x + dir, y - 1, G); o.set(x + dir * 2, y - 1, GL); };
  /* 品種：tier 0 小花（<25 分）、1 花叢（25–44）、2 小樹（45–74）、3 巨木（75+）；-1 小草（<10 分） */
  const SPECIES = [
    { id: 'grass', name: '小草芽', tier: -1, pal: [['嫩綠', '#8fe07a'], ['翠綠', '#5fb84f'], ['秋黃', '#d8c060']],
      draw: (o, P) => { [9, 11, 12, 14, 16].forEach((x, i) => { const h = 3 + Math.floor(o.r() * 4); o.stem(x, 31, 31 - h, i % 2 ? P : shade(P, 0.8)); }); } },
    { id: 'daisy', name: '雛菊', tier: 0, pal: [['純白', '#ffffff'], ['粉紅', '#ffb3cf'], ['淡紫', '#d6b8ff'], ['天藍', '#bfe4ff']],
      draw: (o, P) => { o.stem(12, 31, 19); leaf(o, 11, 27, -1); leaf(o, 13, 24, 1); o.disc(12, 16, 3, P); o.set(12, 13, shade(P, 0.9)); o.disc(12, 16, 1, '#ffd84a'); o.set(13, 15, '#fff3a0'); } },
    { id: 'tulip', name: '鬱金香', tier: 0, pal: [['赤紅', '#ff6b6b'], ['粉紅', '#ff9fbf'], ['鵝黃', '#ffd84a'], ['紫羅蘭', '#b98bff'], ['雪白', '#f4f4f8']],
      draw: (o, P) => { o.stem(12, 31, 19); for (let i = 0; i < 5; i++) { o.set(10 - (i > 2 ? 1 : 0), 30 - i, GD); o.set(14 + (i > 2 ? 1 : 0), 29 - i, G); } o.rect(10, 14, 5, 5, P); o.rect(13, 14, 2, 5, shade(P, 0.82)); [10, 12, 14].forEach(x => o.set(x, 13, P)); o.set(11, 15, shade(P, 1.2)); } },
    { id: 'clover', name: '幸運草', tier: 0, pal: [['青綠', '#6fd06a'], ['深綠', '#3f9f4b'], ['黃綠', '#b4e87a']],
      draw: (o, P) => { o.stem(12, 31, 23, GD); o.stem(10, 31, 27, GD); o.disc(10, 23, 2, P); o.disc(14, 23, 2, P); o.disc(12, 20, 2, P); if (o.r() < 0.3) o.disc(12, 25, 2, shade(P, 0.85)); o.disc(9, 26, 1, shade(P, 0.9)); o.set(12, 22, '#ffffff'); } },
    { id: 'mushroom', name: '小蘑菇', tier: 0, pal: [['紅點', '#ff6b6b'], ['栗子', '#c98b5a'], ['藍莓', '#7cc4ff'], ['葡萄', '#b98bff']],
      draw: (o, P) => { o.rect(10, 25, 5, 7, '#fff2d8'); o.rect(13, 25, 2, 7, '#f0dcbc'); for (let y = 0; y <= 4; y++) for (let x = -6; x <= 6; x++) if (x * x / 36 + y * y / 16 <= 1) o.set(12 + x, 24 - y, y === 0 ? shade(P, 0.8) : P); o.set(10, 21, '#fff'); o.set(14, 22, '#fff'); o.set(12, 20, '#fff'); if (o.r() < 0.5) { o.rect(16, 28, 3, 4, '#fff2d8'); o.ell(17, 27, 3, 1, P); } } },
    { id: 'cactus', name: '仙人掌', tier: 0, pal: [['粉花', '#ff9fbf'], ['黃花', '#ffd84a'], ['紅花', '#ff6b6b']],
      draw: (o, P) => { o.rect(10, 17, 5, 15, G); o.rect(13, 17, 2, 15, GD); o.rect(7, 23, 3, 2, G); o.rect(7, 20, 2, 3, G); o.rect(15, 21, 3, 2, G); o.rect(16, 18, 2, 3, GD); for (let y = 19; y < 31; y += 3) o.set(11, y, GL); o.disc(12, 16, 1, P); o.set(12, 16, '#fff3a0'); } },
    { id: 'sunflower', name: '向日葵', tier: 1, pal: [['金黃', '#ffd84a'], ['橘紅', '#ff9a3d'], ['酒紅', '#d8604a']],
      draw: (o, P) => { o.stem(12, 31, 12); o.stem(13, 31, 14, GD); o.ell(9, 22, 2, 1, G); o.ell(16, 19, 2, 1, G); o.disc(12, 9, 5, P); o.disc(12, 9, 5, P); o.dots(12, 9, 5, 6, shade(P, 0.85)); o.disc(12, 9, 2, '#6b4424'); o.set(11, 8, '#8a5a34'); } },
    { id: 'rosebush', name: '玫瑰叢', tier: 1, pal: [['赤紅', '#e8483f'], ['粉紅', '#ff8fb1'], ['白', '#fff4f6'], ['珊瑚', '#ff9a7a'], ['黃', '#ffd84a']],
      draw: (o, P) => { o.ell(12, 25, 8, 6, GD); o.ell(12, 24, 7, 5, G); o.dots(12, 24, 6, 8, GL); for (let i = 0; i < 6; i++) { const x = 6 + Math.floor(o.r() * 13), y = 20 + Math.floor(o.r() * 8); o.disc(x, y, 1, P); o.set(x, y, shade(P, 0.75)); } } },
    { id: 'lavender', name: '薰衣草', tier: 1, pal: [['紫', '#9a78e0'], ['淡紫', '#c9b0ff'], ['粉', '#ffb3cf'], ['白', '#f4f0ff']],
      draw: (o, P) => { [7, 9, 12, 15, 17].forEach(x => { const top = 12 + Math.floor(o.r() * 7); o.stem(x, 31, top + 4, GD); for (let y = top; y < top + 6; y++) o.set(x + (y % 2 ? 1 : 0) * (x > 12 ? -1 : 1) * 0, y, y % 2 ? P : shade(P, 0.8)); o.set(x - 1, top + 2, P); o.set(x + 1, top + 4, shade(P, 0.85)); }); } },
    { id: 'hydrangea', name: '繡球花', tier: 1, pal: [['天藍', '#8fbfff'], ['粉紅', '#ffaccb'], ['紫', '#b89cf0'], ['雪白', '#f4f6ff']],
      draw: (o, P) => { o.ell(12, 27, 8, 4, GD); o.ell(12, 26, 7, 3, G); [[8, 21], [16, 21], [12, 17]].forEach(([x, y]) => { o.disc(x, y, 3, P); o.dots(x, y, 3, 5, shade(P, 1.15)); o.dots(x, y, 3, 3, shade(P, 0.85)); }); } },
    { id: 'bamboo', name: '竹子', tier: 1, pal: [['翠竹', '#6fbf5a'], ['金竹', '#e0c050'], ['墨竹', '#4f8a5a']],
      draw: (o, P) => { [[8, 10], [12, 5], [16, 13]].forEach(([x, top]) => { o.rect(x, top, 2, 32 - top, P); o.rect(x + 1, top, 1, 32 - top, shade(P, 0.8)); for (let y = top + 4; y < 31; y += 5) { o.set(x, y, shade(P, 0.65)); o.set(x + 1, y, shade(P, 0.65)); } o.set(x - 1, top + 2, GL); o.set(x - 2, top + 1, GL); o.set(x + 2, top + 7, G); o.set(x + 3, top + 6, G); }); } },
    { id: 'pine', name: '松樹', tier: 2, pal: [['深綠', '#3f8f4b'], ['藍綠', '#3f8f86'], ['雪松', '#4f9a5a']],
      draw: (o, P, sk) => { o.rect(11, 26, 3, 6, BR); o.set(13, 27, BRD); [[24, 9], [19, 7], [14, 5], [9, 3]].forEach(([y, w]) => { for (let j = 0; j < 6; j++) { const ww = Math.round(w * (j + 1) / 6); for (let i = -ww; i <= ww; i++) o.set(12 + i, y - 5 + j, i > ww / 2 ? shade(P, 0.8) : P); } }); o.set(12, 3, sk === 2 ? '#ffffff' : '#ffd84a'); if (sk === 2) { [[9, 14], [15, 19], [8, 24], [16, 13], [12, 9]].forEach(([x, y]) => o.set(x, y, '#ffffff')); } } },
    { id: 'cherry', name: '櫻花樹', tier: 2, pal: [['粉櫻', '#ffb3cf'], ['白櫻', '#fff0f5'], ['緋櫻', '#ff7fa8']],
      draw: (o, P) => { o.rect(11, 20, 3, 12, BR); o.set(13, 22, BRD); o.set(10, 21, BR); o.set(9, 20, BR); o.set(14, 20, BR); o.set(15, 19, BR); [[8, 15, 5], [16, 15, 5], [12, 11, 5]].forEach(([x, y, r]) => o.disc(x, y, r, P)); o.dots(12, 14, 8, 10, shade(P, 1.12)); o.dots(12, 15, 8, 8, shade(P, 0.85)); [[5, 25], [19, 27], [7, 29]].forEach(([x, y]) => o.set(x, y, P)); } },
    { id: 'maple', name: '楓樹', tier: 2, pal: [['楓紅', '#e8583f'], ['橘黃', '#ff9a3d'], ['金黃', '#ffc83a']],
      draw: (o, P) => { o.rect(11, 20, 3, 12, BR); o.set(13, 23, BRD); [[8, 15, 5], [16, 15, 5], [12, 10, 5], [12, 16, 4]].forEach(([x, y, r]) => o.disc(x, y, r, P)); o.dots(12, 13, 8, 10, shade(P, 1.15)); o.dots(12, 14, 8, 10, shade(P, 0.8)); o.set(18, 28, P); o.set(6, 30, shade(P, 0.9)); } },
    { id: 'fruit', name: '果樹', tier: 2, pal: [['柚子', '#ffd23a'], ['蘋果', '#e8483f'], ['橘子', '#ff9a3d'], ['水蜜桃', '#ffb09a']],
      draw: (o, P) => { o.rect(11, 20, 3, 12, BR); o.set(13, 24, BRD); [[8, 15, 5], [16, 15, 5], [12, 10, 5]].forEach(([x, y, r]) => o.disc(x, y, r, G)); o.dots(12, 13, 8, 9, GL); o.dots(12, 14, 8, 9, GD); for (let i = 0; i < 6; i++) { const x = 6 + Math.floor(o.r() * 13), y = 9 + Math.floor(o.r() * 11); o.set(x, y, P); o.set(x + 1, y, P); o.set(x, y + 1, shade(P, 0.8)); o.set(x + 1, y + 1, shade(P, 0.8)); } } },
    { id: 'sakura', name: '千年櫻', tier: 3, pal: [['粉櫻', '#ffb3cf'], ['夜櫻', '#d9a8ff'], ['白櫻', '#fff4f8']],
      draw: (o, P) => { o.rect(10, 18, 4, 14, BR); o.rect(13, 18, 1, 14, BRD); o.rect(8, 17, 2, 2, BR); o.rect(14, 16, 2, 2, BR); [[6, 13, 6], [18, 13, 6], [12, 8, 6], [12, 14, 5]].forEach(([x, y, r]) => o.disc(x, y, r, P)); o.dots(12, 11, 10, 18, shade(P, 1.12)); o.dots(12, 12, 10, 14, shade(P, 0.84)); for (let i = 0; i < 7; i++) o.set(2 + Math.floor(o.r() * 20), 21 + Math.floor(o.r() * 10), P); } },
    { id: 'rainbow', name: '彩虹樹', tier: 3, pal: [['彩虹', '#ff6b6b'], ['粉彩', '#ffb3cf']],
      draw: (o, P, sk) => { o.rect(10, 20, 4, 12, BR); o.set(13, 22, BRD); const bands = sk === 1 ? ['#ffc2d6', '#ffe0b8', '#fff6b0', '#d0f4c0', '#c8e6ff', '#e0d0ff'] : ['#ff6b6b', '#ff9a3d', '#ffd84a', '#62d66e', '#4fa8ff', '#b98bff']; for (let y = 3; y <= 21; y++) for (let x = 2; x <= 21; x++) { const dx = x - 12, dy = y - 12; if (dx * dx + dy * dy * 1.3 <= 100) o.set(x, y, bands[Math.min(5, Math.floor((y - 3) / 3.2))]); } o.dots(12, 12, 8, 10, '#ffffff'); } },
    { id: 'crystal', name: '水晶樹', tier: 3, pal: [['冰晶', '#a8f0ff'], ['粉晶', '#ffc2e6'], ['紫晶', '#c9a8ff']],
      draw: (o, P) => { o.rect(11, 22, 3, 10, '#9aa3b5'); o.set(13, 24, '#5d6577'); const cr = (cx, cy, h, w) => { for (let j = 0; j < h; j++) { const ww = Math.round(w * (1 - Math.abs(j - h / 2) / (h / 2))); for (let i = -ww; i <= ww; i++) o.set(cx + i, cy - j, i < 0 ? shade(P, 1.12) : i > 0 ? shade(P, 0.82) : P); } }; cr(12, 22, 18, 4); cr(7, 23, 12, 3); cr(17, 23, 12, 3); cr(4, 27, 7, 2); cr(20, 27, 7, 2); o.set(12, 8, '#ffffff'); o.set(7, 15, '#ffffff'); } },
    { id: 'starlight', name: '星光樹', tier: 3, pal: [['星夜', '#3a4a8a'], ['極光', '#2f6a78'], ['紫夜', '#5a3a8a']],
      draw: (o, P) => { o.rect(11, 20, 3, 12, '#5a4a6a'); [[7, 14, 6], [17, 14, 6], [12, 8, 6], [12, 15, 5]].forEach(([x, y, r]) => o.disc(x, y, r, P)); o.dots(12, 12, 9, 12, shade(P, 1.3)); for (let i = 0; i < 9; i++) { const x = 4 + Math.floor(o.r() * 16), y = 4 + Math.floor(o.r() * 15); o.set(x, y, '#fff3a0'); } o.set(12, 2, '#ffd84a'); o.set(11, 3, '#ffd84a'); o.set(13, 3, '#ffd84a'); o.set(12, 3, '#fff'); o.set(12, 4, '#ffd84a'); } }
  ];
  const TIER_NAME = { '-1': '小草', 0: '小花', 1: '花叢', 2: '小樹', 3: '巨木' };
  const TIER_MIN = { '-1': 0, 0: 10, 1: 25, 2: 45, 3: 75 };
  const tierOf = min => min >= 75 ? 3 : min >= 45 ? 2 : min >= 25 ? 1 : min >= 10 ? 0 : -1;
  function sp(id) { return SPECIES.find(s => s.id === id) || SPECIES[0]; }

  const cache = {};
  function url(pl) {
    const key = [pl.sp, pl.c, pl.seed, pl.shiny ? 1 : 0].join('|');
    if (cache[key]) return cache[key];
    const S = sp(pl.sp), P = S.pal[pl.c % S.pal.length][1];
    const g = Array.from({ length: H }, () => Array(W).fill(null));
    const o = canvasOps(g, rng(pl.seed));
    S.draw(o, P, pl.c);
    // 自動描邊
    const out = g.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!g[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy] && g[y + dy][x + dx])) out[y][x] = pl.shiny ? GOLD : OUT;
    if (pl.shiny) { const r2 = rng(pl.seed + 7); for (let i = 0; i < 8; i++) { const x = 1 + Math.floor(r2() * (W - 2)), y = 1 + Math.floor(r2() * (H - 6)); if (!out[y][x]) out[y][x] = '#fff3a0'; } }
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const cx = c.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (out[y][x]) { cx.fillStyle = out[y][x]; cx.fillRect(x, y, 1, 1); }
    return (cache[key] = c.toDataURL());
  }
  function name(pl) { const S = sp(pl.sp); return (pl.shiny ? '✨閃耀的' : '') + S.pal[pl.c % S.pal.length][0] + S.name; }
  function html(pl, w = 48, cls = '') { return `<img class="px plant ${cls}" src="${url(pl)}" style="width:${w}px;height:${Math.round(w * H / W)}px" alt="">`; }
  /* 依專注分鐘數長出一株新植物 */
  function grow(min) {
    const t = tierOf(min);
    const list = SPECIES.filter(s => s.tier === t);
    const S = list[Math.floor(Math.random() * list.length)];
    return { sp: S.id, c: Math.floor(Math.random() * S.pal.length), seed: Math.floor(Math.random() * 1e9), shiny: Math.random() < 0.06 };
  }
  return { SPECIES, TIER_NAME, TIER_MIN, tierOf, sp, url, name, html, grow, W, H };
})();

const POMO = (() => {
  const KEY = SKEY('pomo');
  const DEF_SET = {
    focus: 25, short: 5, long: 15, every: 4, goal: 8,
    autoBreak: true, autoFocus: false, autoAfterLong: false, strict: false,
    cycleMode: 'standard', rounds: 4, seq: [], seqRepeat: 1,
    chime: 'musicbox', chimeVol: 0.7, chimeTimes: 2, breakChime: 'bell', countdown: true,
    title: true, notify: false, focusAmb: -1, focusMusic: 'keep',
    tags: ['國文', '英文', '數學', '社會', '自然', '其他'], presets: []
  };
  const PRESETS = [
    { name: '經典 25/5', focus: 25, short: 5, long: 15, every: 4 },
    { name: '短衝刺 15/3', focus: 15, short: 3, long: 10, every: 4 },
    { name: '深度 50/10', focus: 50, short: 10, long: 30, every: 3 },
    { name: '心流 90/20', focus: 90, short: 20, long: 30, every: 2 }
  ];
  const THEMES = [
    { name: '晨光草原', sky: '#bfe8ff', g1: '#7fd06a', g2: '#5fb84f' },
    { name: '湖畔', sky: '#a8d8ff', g1: '#6fc07a', g2: '#4fa8d8' },
    { name: '花田', sky: '#ffe6f0', g1: '#9adf7a', g2: '#ffb3cf' },
    { name: '竹林小徑', sky: '#dff5d8', g1: '#5fa85a', g2: '#c9a878' },
    { name: '沙丘綠洲', sky: '#ffe8c0', g1: '#e8c888', g2: '#d8b070' },
    { name: '雪原', sky: '#e8f0ff', g1: '#f4f7ff', g2: '#c8d6ea' },
    { name: '雲上花園', sky: '#fff6fb', g1: '#ffffff', g2: '#e0e8ff' },
    { name: '夜之庭', sky: '#2a2050', g1: '#2f5a4a', g2: '#1f3a2f' }
  ];
  const ROMAN = ['', '', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];
  const PER_PLOT = 10;

  let D = load();
  function load() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    d.set = Object.assign({}, DEF_SET, d.set || {});
    d.st = d.st || { phase: 'idle', n: 0 };
    if (d.st.phase === 'ready' && !d.st.cyc) d.st.phase = 'idle'; // 舊版的「休息？」狀態
    if (!Array.isArray(d.set.seq) || !d.set.seq.length) d.set.seq = [{ t: 'focus', m: 50 }, { t: 'short', m: 10 }, { t: 'focus', m: 50 }, { t: 'long', m: 30 }];
    d.garden = d.garden || []; d.log = d.log || [];
    return d;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  const S = () => D.set, ST = () => D.st;
  const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const today = () => dayKey(Date.now());
  const todayLog = () => D.log.filter(l => dayKey(l.t) === today());
  const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(ss).padStart(2, '0'); };
  const PH = { idle: '準備開始', focus: '專注中', short: '短休息', long: '長休息', ready: '下一段' };
  const TN = { focus: '專注', short: '短休息', long: '長休息' }, TI = { focus: '🍅', short: '☕', long: '🛋' };

  /* ---------- 循環：一個循環＝一串「專注／短休息／長休息」段落 ----------
   * 標準：每輪「專注＋休息」，每 every 輪長休息；rounds＝總輪數（0＝無限，最後一輪後長休息並結束）
   * 自訂：依 seq 的順序，重複 seqRepeat 次（0＝無限） */
  function lapList() {
    const s = S();
    if (s.cycleMode === 'custom' && s.seq.length) return s.seq.map(x => ({ t: x.t, m: x.m }));
    const r = s.rounds > 0 ? s.rounds : s.every, out = [];
    for (let k = 1; k <= r; k++) {
      out.push({ t: 'focus', m: s.focus });
      const long = k % s.every === 0 || (s.rounds > 0 && k === r);
      out.push(long ? { t: 'long', m: s.long } : { t: 'short', m: s.short });
    }
    return out;
  }
  const lapCount = () => { const s = S(); return s.cycleMode === 'custom' && s.seq.length ? (s.seqRepeat || 0) : (s.rounds > 0 ? 1 : 0); };
  function stepAt(i) { const c = ST().cyc; if (!c || !c.list.length) return null; if (c.laps && i >= c.list.length * c.laps) return null; return c.list[i % c.list.length]; }
  function cycleInfo() {
    const c = ST().cyc; if (!c) return null;
    const focusTotal = c.laps ? c.list.filter(x => x.t === 'focus').length * c.laps : 0;
    return { c, focusTotal, lap: Math.floor(c.i / c.list.length) + 1, pos: c.i % c.list.length };
  }
  function planText() {
    const L = lapList(), n = lapCount(), f = L.filter(x => x.t === 'focus');
    const mins = L.reduce((a, x) => a + x.m, 0);
    return n ? `共 ${f.length * n} 輪專注・約 ${fmtMin(mins * n)}` : `無限循環（每圈 ${f.length} 輪專注、${fmtMin(mins)}）`;
  }
  const fmtMin = m => m >= 60 ? `${Math.floor(m / 60)} 小時${m % 60 ? ` ${m % 60} 分` : ''}` : `${m} 分鐘`;
  function left() { const st = ST(); if (st.phase === 'idle' || st.phase === 'ready') return 0; return st.paused ? st.pausedLeft : st.endAt - Date.now(); }
  function total() { return (ST().plan || 1) * 60000; }
  function streak() {
    const days = new Set(D.log.map(l => dayKey(l.t))); let n = 0; const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ---------- 計時控制 ---------- */
  function start(phase, min) {
    const st = ST(), s = S();
    min = min || (phase === 'focus' ? s.focus : phase === 'short' ? s.short : s.long);
    Object.assign(st, { phase, plan: min, endAt: Date.now() + min * 60000, paused: false, pausedLeft: 0, startAt: Date.now() });
    if (phase === 'focus') focusEnv(true);
    save(); SFX.play('click'); tick(true);
  }
  function pause() { const st = ST(); if (st.paused || !st.endAt) return; st.paused = true; st.pausedLeft = st.endAt - Date.now(); save(); tick(true); }
  function resume() { const st = ST(); if (!st.paused) return; st.paused = false; st.endAt = Date.now() + st.pausedLeft; save(); tick(true); }
  /* 放棄這輪專注：不長植物，停在「下一段」可以重來這一輪或跳過 */
  function abandon() {
    const st = ST(); const was = st.phase;
    if (was === 'focus') focusEnv(false);
    if (st.cyc && was === 'focus') { Object.assign(st, { phase: 'ready', paused: false, endAt: 0, nextStep: stepAt(st.cyc.i), next: 'focus' }); save(); return tick(true); }
    Object.assign(st, { phase: 'idle', paused: false, endAt: 0 }); save(); tick(true);
  }
  function startCycle() {
    const st = ST();
    st.cyc = { i: 0, list: lapList(), laps: lapCount(), focusDone: 0, t0: Date.now() };
    runStep(0);
  }
  function runStep(i) {
    const st = ST(), step = stepAt(i);
    if (!step) return finishCycle();
    st.cyc.i = i; st.nextStep = null;
    start(step.t, step.m);
  }
  /* 一段結束（或被跳過）後：依設定自動開始下一段，或停在「下一段」等使用者按開始 */
  function advance(from) {
    const st = ST(), s = S();
    if (!st.cyc) { Object.assign(st, { phase: 'idle', paused: false, endAt: 0 }); save(); return tick(true); }
    const i = st.cyc.i + 1, next = stepAt(i);
    if (!next) return finishCycle();
    const auto = next.t === 'focus' ? (from === 'long' ? s.autoAfterLong : s.autoFocus) : s.autoBreak;
    if (auto) return runStep(i);
    st.cyc.i = i;
    Object.assign(st, { phase: 'ready', paused: false, endAt: 0, nextStep: next, next: next.t });
    save(); tick(true);
  }
  function finishCycle() {
    const st = ST(), c = st.cyc;
    const done = c ? c.focusDone : 0;
    Object.assign(st, { phase: 'idle', paused: false, endAt: 0, cyc: null, nextStep: null });
    save();
    SFX.chime(S().breakChime, S().chimeVol, 2);
    notify('🎉 循環完成', `完成 ${done} 輪專注，辛苦了！`);
    U.toast(`🎉 循環完成！這次專注了 ${done} 輪`, 4000);
    tick(true);
  }
  function endCycle() { const st = ST(); if (st.phase === 'focus') focusEnv(false); Object.assign(st, { phase: 'idle', paused: false, endAt: 0, cyc: null, nextStep: null }); save(); tick(true); }
  /* 跳過目前這段（專注被跳過不會長植物） */
  function skipStep() {
    const st = ST(), was = st.phase === 'ready' ? (st.nextStep || {}).t : st.phase;
    if (st.phase === 'focus') focusEnv(false);
    if (!st.cyc) { Object.assign(st, { phase: 'idle', paused: false, endAt: 0 }); save(); return tick(true); }
    advance(was);
  }
  /* 專注時的白噪音與音樂 */
  function focusEnv(on) {
    const s = S(), st = ST();
    if (on) {
      if (s.focusAmb >= 0 && AMB.PRESETS[s.focusAmb]) { st.prevAmb = Object.fromEntries(Object.keys(AMB.TYPES).map(k => [k, VOL.get('amb_' + k) || 0])); AMB.applyPreset(s.focusAmb); }
      if (s.focusMusic === 'mute') BGM.hold(true); else if (s.focusMusic !== 'keep') BGM.override(s.focusMusic);
    } else {
      if (st.prevAmb) { Object.entries(st.prevAmb).forEach(([k, v]) => VOL.set('amb_' + k, v)); st.prevAmb = null; }
      BGM.hold(false); BGM.override(null);
    }
    App.refreshTop && App.refreshTop();
  }
  function complete() {
    const st = ST(), s = S(), phase = st.phase;
    if (phase === 'focus') {
      focusEnv(false);
      const min = st.plan;
      const pl = PlantArt.grow(min);
      pl.id = (D.garden.length ? D.garden[D.garden.length - 1].id : 0) + 1;
      pl.t = Date.now(); pl.min = min; pl.tag = st.tag || ''; pl.note = st.note || '';
      const seenBefore = D.garden.some(g => g.sp === pl.sp && g.c === pl.c);
      const newSpecies = !D.garden.some(g => g.sp === pl.sp);
      D.garden.push(pl);
      D.log.push({ t: pl.t, min, tag: pl.tag, note: pl.note, plant: pl.id });
      st.n = (st.n || 0) + 1;
      if (!st.cyc) st.cyc = { i: 0, list: [{ t: 'focus', m: min }], laps: 1, focusDone: 0, t0: Date.now() };
      st.cyc.focusDone++;
      const nx = stepAt(st.cyc.i + 1), isLong = !!nx && nx.t === 'long';
      SFX.chime(s.chime, s.chimeVol, s.chimeTimes);
      notify('🍅 專注完成！', `花園裡長出了「${PlantArt.name(pl)}」`);
      const last = !nx;
      advance('focus');
      ceremony(pl, { newSpecies, newColor: !seenBefore, isLong, last });
    } else {
      SFX.chime(s.breakChime, s.chimeVol, 1);
      const nx = st.cyc && stepAt(st.cyc.i + 1);
      notify(phase === 'long' ? '🛋 長休息結束' : '☕ 休息結束', nx ? `下一段：${TN[nx.t]} ${nx.m} 分鐘` : '這個循環完成了！');
      if (nx) U.toast(`${phase === 'long' ? '長休息' : '休息'}結束！下一段：${TI[nx.t]} ${TN[nx.t]} ${nx.m} 分鐘`);
      advance(phase);
    }
    tick(true);
  }
  function notify(title, body) {
    if (!S().notify || !('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
    try { new Notification(title, { body }); } catch (e) {}
  }

  /* ---------- 每 250ms 更新：頂部迷你計時器、分頁標題、番茄鐘畫面 ---------- */
  const baseTitle = document.title;
  let lastSec = -1;
  function tick(force) {
    const st = ST();
    if ((st.phase === 'focus' || st.phase === 'short' || st.phase === 'long') && !st.paused && st.endAt && Date.now() >= st.endAt) return complete();
    const l = left(), sec = Math.ceil(l / 1000);
    if (!force && sec === lastSec) return;
    lastSec = sec;
    const running = st.phase === 'focus' || st.phase === 'short' || st.phase === 'long';
    if (running && !st.paused && S().countdown && st.phase === 'focus' && sec <= 5 && sec > 0) SFX.play('tick');
    const mini = document.getElementById('pomoMini');
    if (mini) {
      mini.classList.toggle('on', running);
      mini.classList.toggle('brk', st.phase === 'short' || st.phase === 'long');
      mini.classList.toggle('ps', !!st.paused);
      mini.innerHTML = running ? `${TI[st.phase]} ${fmt(l)}${st.paused ? ' ⏸' : ''}` : st.phase === 'ready' ? `⏭ ${TI[(st.nextStep || {}).t] || ''}` : '🍅';
    }
    document.title = S().title && running ? `${st.phase === 'focus' ? '🍅' : '☕'} ${fmt(l)}${st.paused ? '（暫停）' : ''} — ${baseTitle}` : baseTitle;
    const big = document.getElementById('pomoBig');
    if (big) {
      big.textContent = fmt(running ? l : (st.phase === 'ready' ? (st.nextStep || { m: S().focus }).m : (lapList()[0] || { m: S().focus }).m) * 60000);
      const ring = document.getElementById('pomoRing');
      if (ring) ring.style.setProperty('--p', running ? (1 - l / total()) * 100 : 0);
      if (force) renderTimer();
    }
  }
  setInterval(() => tick(false), 250);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(true); });

  /* ---------- 完成儀式：種子落下 → 發芽 → 長大，閃光與提示音 ---------- */
  function ceremony(pl, info) {
    const P = Store.profile, pet = P.activePet;
    const tn = todayLog().length, goal = S().goal;
    const plot = Math.floor((D.garden.length - 1) / PER_PLOT), inPlot = (D.garden.length - 1) % PER_PLOT + 1;
    const th = THEMES[plot % THEMES.length];
    const tier = PlantArt.sp(pl.sp).tier;
    const conf = Array.from({ length: 22 }, (_, i) => `<i style="left:${Math.random() * 100}%;animation-delay:${1.6 + Math.random() * 0.6}s;background:${['#ffd84a', '#ff9fbf', '#8fe07a', '#8fd3ff', '#c9a8ff'][i % 5]}"></i>`).join('');
    const m = U.modal({
      title: '🍅 專注完成！', narrow: true, body: `
      <div class="grow-stage" style="--sky:${th.sky};--g1:${th.g1};--g2:${th.g2}">
        <div class="confetti">${conf}</div>
        <div class="seed"></div>
        <div class="sprout">${PlantArt.html({ sp: 'grass', c: 0, seed: 3 }, 30)}</div>
        <div class="grown ${pl.shiny ? 'shiny' : ''}">${PlantArt.html(pl, tier >= 2 ? 120 : 96)}</div>
        ${pet ? `<div class="grow-pet">${Store.petHTML(pet, 58)}</div>` : ''}
      </div>
      <div class="center grow-info">
        <div class="small-t dim">專注 ${pl.min} 分鐘${pl.tag ? `・${U.esc(pl.tag)}` : ''} → ${PlantArt.TIER_NAME[tier]}</div>
        <div class="grow-name ${pl.shiny ? 'gold-t' : ''}">${PlantArt.name(pl)}</div>
        <div>${info.newSpecies ? '<span class="tag ok">🌱 新品種！</span>' : info.newColor ? '<span class="tag ok">🎨 新顏色！</span>' : ''}${pl.shiny ? '<span class="tag ng">✨ 閃耀（6%）</span>' : ''}</div>
        ${info.last ? '<p class="gold-t">🎉 這個循環全部完成了！</p>' : ''}
        <p class="small-t">今天第 <b class="gold-t">${tn}</b> 顆番茄${tn >= goal ? '（今日目標達成！🎉）' : `（目標 ${goal}）`}・連續 ${streak()} 天<br>
        花圃「${plotName(plot)}」${inPlot}/${PER_PLOT}${inPlot === PER_PLOT ? '　🎉 花圃種滿了！下一株會開闢新花圃' : ''}・花園共 ${D.garden.length} 株</p>
        ${pet ? `<p class="small-t pink-t">${U.esc(Store.petName(pet))}：${U.pick(['好厲害！我們的花園又變漂亮了～', '辛苦了！休息一下吧♪', '哇，這株好可愛！', '專心的你最帥氣了！', '下一株會長出什麼呢？'])}</p>` : ''}
      </div>`,
      buttons: [{ label: '看看花園', onClick: () => App.go('pomo', 'garden') }, { label: ST().phase === 'short' || ST().phase === 'long' ? '好，去休息 ☕' : info.last ? '好 🎉' : '好', cls: 'gold' }]
    });
    if (pet) setTimeout(() => { const el = m.el.querySelector('.grow-pet [data-panim]'); if (el) PetArt.act(el, 'love'); }, 2000);
    setTimeout(() => SFX.play('level'), 1700);
    if (tn === goal) setTimeout(() => SFX.play('win'), 2600);
  }

  /* ---------- 番茄鐘畫面 ---------- */
  let tab = 'timer';
  function screen(t) {
    if (t) tab = t;
    const scr = U.$('#screen');
    scr.innerHTML = `<div class="panel pomo">
      <div class="row tabs">${[['timer', '🍅 計時'], ['garden', '🌷 專注花園'], ['dex', '📖 植物圖鑑'], ['stats', '📊 統計'], ['set', '⚙ 設定']].map(([k, l]) => `<button class="px-btn small ${tab === k ? 'sel' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <div id="pomoBody" class="mt"></div></div>`;
    U.$$('[data-tab]', scr).forEach(b => b.onclick = () => { SFX.play('click'); screen(b.dataset.tab); });
    ({ timer: renderTimer, garden: renderGarden, dex: renderDex, stats: renderStats, set: renderSet })[tab]();
  }
  function renderTimer() {
    const body = U.$('#pomoBody'); if (!body || tab !== 'timer') return;
    const st = ST(), s = S(), P = Store.profile;
    const running = st.phase === 'focus' || st.phase === 'short' || st.phase === 'long';
    const tn = todayLog().length;
    const ci = cycleInfo();
    const strip = (list, cur, doneUpto) => `<div class="pomo-strip">${list.map((x, k) => `<span class="ps-${x.t} ${k < doneUpto ? 'done' : ''} ${k === cur ? 'cur' : ''}" title="${TN[x.t]} ${x.m} 分">${TI[x.t]}<b>${x.m}</b></span>`).join('')}</div>`;
    const planL = lapList();
    const cyclePanel = ci ? `<div class="pomo-cyc"><div class="row"><b>🔁 循環中</b><span class="grow"></span><span class="small-t">專注 ${ci.c.focusDone}${ci.focusTotal ? ' / ' + ci.focusTotal : ''} 輪${ci.c.laps !== 1 ? `・第 ${ci.lap}${ci.c.laps ? '/' + ci.c.laps : ''} 圈` : ''}</span></div>
        ${ci.c.list.length <= 24 ? strip(ci.c.list, ci.pos, ci.pos) : ''}</div>` : '';
    const dots = ci ? ci.c.list.filter(x => x.t === 'focus').map((x, k) => `<i class="${k < ci.c.list.slice(0, ci.pos).filter(y => y.t === 'focus').length ? 'on' : ''}"></i>`).join('') : planL.filter(x => x.t === 'focus').slice(0, 12).map(() => '<i></i>').join('');
    const recent = D.garden.slice(-6);
    const expr = st.phase === 'focus' ? (st.paused ? 'surprise' : 'neutral') : running ? 'happy' : 'neutral';
    body.innerHTML = `<div class="pomo-main">
      <div class="pomo-left">
        <div class="pomo-ring ph-${st.phase} ${st.paused ? 'paused' : ''}" id="pomoRing"><div class="pomo-in">
          <div class="pomo-ph">${PH[st.phase]}${st.paused ? '（暫停中）' : ''}</div>
          <div class="pomo-big" id="pomoBig"></div>
          <div class="pomo-dots" title="這個循環的專注輪數">${dots}</div></div></div>
        ${P.activePet ? `<div class="pomo-pet ${st.phase === 'focus' && !st.paused ? 'focus' : ''}">${Store.petHTML(P.activePet, 64)}</div>` : ''}
      </div>
      <div class="pomo-right">
        <div class="small-t">今天 <b class="gold-t">🍅 ${tn}</b> / ${s.goal}・專注 ${todayLog().reduce((a, l) => a + l.min, 0)} 分鐘・連續 ${streak()} 天</div>
        <div class="bar mt" style="height:12px"><i style="width:${Math.min(100, tn / s.goal * 100)}%;background:#ff6b6b"></i></div>
        ${cyclePanel}
        ${st.phase === 'idle' ? `
          <div class="mt"><b class="small-t">這一輪要讀什麼？</b><div class="row wrap mt">${s.tags.map(t => `<button class="px-btn small ${st.tag === t ? 'sel' : ''}" data-tag="${U.esc(t)}">${U.esc(t)}</button>`).join('')}</div>
          <input class="px-in mt" id="pnote" maxlength="40" placeholder="備註（例如：英文閱讀 111 年）" value="${U.esc(st.note || '')}" style="width:100%"></div>
          <div class="pomo-cyc mt"><div class="row"><b>🔁 循環設定</b><span class="grow"></span>
              <button class="px-btn small ${s.cycleMode !== 'custom' ? 'sel' : ''}" data-mode="standard">標準</button><button class="px-btn small ${s.cycleMode === 'custom' ? 'sel' : ''}" data-mode="custom">自訂順序</button></div>
            ${s.cycleMode === 'custom' ? `<div class="small-t mt">依「⚙ 設定」裡排好的順序進行，重複 ${s.seqRepeat ? s.seqRepeat + ' 次' : '無限次'}。</div>`
              : `<div class="row wrap mt">${PRESETS.concat(s.presets).map((p, i) => `<button class="px-btn small ${s.focus === p.focus && s.short === p.short && s.long === p.long && s.every === p.every ? 'sel' : ''}" data-pre="${i}">${U.esc(p.name)}</button>`).join('')}</div>
                <div class="row mt pomo-adj"><span>專注</span><button class="px-btn small" data-adj="-5">−5</button><b>${s.focus} 分</b><button class="px-btn small" data-adj="5">＋5</button>
                  <span class="small-t dim">→ 長出「${PlantArt.TIER_NAME[PlantArt.tierOf(s.focus)]}」</span></div>
                <div class="row mt"><span class="small-t">輪數</span>${[1, 2, 4, 6, 8, 0].map(n => `<button class="px-btn small ${s.rounds === n ? 'sel' : ''}" data-rounds="${n}">${n || '∞'}</button>`).join('')}</div>`}
            ${planL.length <= 24 ? strip(planL, -1, 0) : ''}
            <div class="small-t dim">${planText()}・${[s.autoBreak ? '自動休息' : '休息前等我按', s.autoFocus ? '短休息後自動繼續' : '短休息後等我按', s.autoAfterLong ? '長休息後自動繼續' : '長休息後等我按'].join('・')}（到「⚙ 設定」調整）</div></div>
          <button class="px-btn gold big mt" id="pgo" style="width:100%">🔁 開始循環：${TI[(planL[0] || {}).t || 'focus']} ${(planL[0] || { m: s.focus }).m} 分鐘</button>`
        : st.phase === 'ready' ? `<p class="mt">下一段：<b class="gold-t">${TI[st.nextStep.t]} ${TN[st.nextStep.t]} ${st.nextStep.m} 分鐘</b></p>
          <div class="row"><button class="px-btn gold big" id="pnext">▶ 開始${TN[st.nextStep.t]}</button><button class="px-btn big" id="pskip">跳過這段</button><button class="px-btn small red" id="pend">結束循環</button></div>`
        : `<p class="mt small-t">${st.phase === 'focus' ? `正在專注${st.tag ? `：<b>${U.esc(st.tag)}</b>` : ''}${st.note ? `・${U.esc(st.note)}` : ''}。完成後會長出一株${PlantArt.TIER_NAME[PlantArt.tierOf(st.plan)]}。` : st.phase === 'long' ? '長休息！起來走走、看看遠方、喝杯水吧～' : '好好休息，喝口水、動一動吧！'}</p>
          <div class="row">${st.phase === 'focus' && s.strict ? '' : st.paused ? '<button class="px-btn gold big" id="pres">▶ 繼續</button>' : '<button class="px-btn big" id="ppause">⏸ 暫停</button>'}
          ${st.phase === 'focus' ? '<button class="px-btn red big" id="pquit">放棄這輪</button>' : '<button class="px-btn big" id="pskip">跳過休息</button>'}<button class="px-btn small red" id="pend">結束循環</button></div>
          ${st.phase === 'focus' && s.strict ? '<p class="small-t dim">嚴格模式：專注中不能暫停。</p>' : ''}`}
        <h3 class="mt" style="font-size:16px">最近長出的植物</h3>
        <div class="pomo-recent">${recent.length ? recent.map(pl => `<div class="pr-item" title="${PlantArt.name(pl)}">${PlantArt.html(pl, 40)}</div>`).join('') : '<span class="small-t dim">完成第一次專注，花園就會長出第一株植物。</span>'}</div>
      </div></div>`;
    tick(false); lastSec = -1; tick(false);
    const bind = (id, f) => { const e = U.$('#' + id, body); if (e) e.onclick = f; };
    U.$$('[data-tag]', body).forEach(b => b.onclick = () => { st.tag = st.tag === b.dataset.tag ? '' : b.dataset.tag; save(); renderTimer(); });
    const note = U.$('#pnote', body); if (note) note.oninput = () => { st.note = note.value; save(); };
    U.$$('[data-pre]', body).forEach(b => b.onclick = () => { const p = PRESETS.concat(s.presets)[+b.dataset.pre]; Object.assign(s, { focus: p.focus, short: p.short, long: p.long, every: p.every }, p.rounds !== undefined ? { rounds: p.rounds } : {}); save(); SFX.play('click'); renderTimer(); });
    U.$$('[data-mode]', body).forEach(b => b.onclick = () => { s.cycleMode = b.dataset.mode; save(); SFX.play('click'); renderTimer(); });
    U.$$('[data-rounds]', body).forEach(b => b.onclick = () => { s.rounds = +b.dataset.rounds; save(); SFX.play('click'); renderTimer(); });
    U.$$('[data-adj]', body).forEach(b => b.onclick = () => { s.focus = Math.max(1, Math.min(180, s.focus + +b.dataset.adj)); save(); renderTimer(); });
    bind('pgo', () => startCycle());
    bind('pnext', () => runStep(st.cyc.i));
    bind('pskip', () => skipStep());
    bind('pend', async () => { if (st.phase !== 'focus' || await U.confirm('結束循環？', '正在進行的這輪專注不會長出植物。')) endCycle(); });
    bind('ppause', () => pause());
    bind('pres', () => resume());
    bind('pquit', async () => { if (await U.confirm('放棄這輪專注？', '放棄的話這一輪不會長出植物喔。')) abandon(); });
  }

  function plotName(i) { const th = THEMES[i % THEMES.length], r = Math.floor(i / THEMES.length) + 1; return th.name + (r > 1 ? (ROMAN[r] || ' ' + r) : ''); }
  function renderGarden() {
    const body = U.$('#pomoBody');
    const G = D.garden, plots = Math.max(1, Math.ceil(G.length / PER_PLOT));
    const shiny = G.filter(g => g.shiny).length;
    const combos = PlantArt.SPECIES.reduce((a, s) => a + s.pal.length, 0);
    const found = new Set(G.map(g => g.sp + ':' + g.c)).size;
    const lv = Math.floor(Math.sqrt(G.length));
    let html = `<div class="row wrap"><span class="tag">🌷 共 ${G.length} 株</span><span class="tag">🏡 花圃 ${plots} 塊</span><span class="tag">📖 圖鑑 ${found}/${combos}</span><span class="tag">✨ 閃耀 ${shiny}</span><span class="tag ok">花園 Lv.${lv}</span></div>
      <p class="small-t dim">每完成一次專注就會長出一株植物；每 ${PER_PLOT} 株組成一塊花圃，主題會一直輪替下去，花園可以無限擴大。點植物可以看它是哪一天、讀什麼長出來的。</p>`;
    for (let i = plots - 1; i >= 0; i--) {
      const th = THEMES[i % THEMES.length], items = G.slice(i * PER_PLOT, i * PER_PLOT + PER_PLOT);
      html += `<div class="plot" style="--sky:${th.sky};--g1:${th.g1};--g2:${th.g2}"><div class="plot-name">${plotName(i)}　${items.length}/${PER_PLOT}</div>
        <div class="plot-row">${items.map(pl => `<div class="pl ${pl.shiny ? 'shiny' : ''}" data-pl="${pl.id}">${PlantArt.html(pl, PlantArt.sp(pl.sp).tier >= 2 ? 60 : 48)}</div>`).join('')}
        ${Array.from({ length: PER_PLOT - items.length }, () => '<div class="pl empty"><i></i></div>').join('')}</div></div>`;
    }
    body.innerHTML = html;
    U.$$('[data-pl]', body).forEach(el => el.onclick = () => {
      const pl = G.find(g => g.id === +el.dataset.pl); if (!pl) return;
      SFX.play('pet');
      U.modal({ title: PlantArt.name(pl), narrow: true, body: `<div class="center">${PlantArt.html(pl, 120)}</div>
        <p class="center small-t">第 ${pl.id} 株・${new Date(pl.t).toLocaleString()}<br>專注 ${pl.min} 分鐘${pl.tag ? `・${U.esc(pl.tag)}` : ''}${pl.note ? `<br>「${U.esc(pl.note)}」` : ''}</p>`, buttons: [{ label: '好', cls: 'gold' }] });
    });
  }
  function renderDex() {
    const body = U.$('#pomoBody'), G = D.garden;
    const tiers = [-1, 0, 1, 2, 3];
    body.innerHTML = `<p class="small-t dim">專注越久，會長出越大的植物：10 分鐘以下長小草、10 分以上小花、25 分以上花叢、45 分以上小樹、75 分以上巨木。每種植物有好幾種顏色，還有 6% 機率長成閃耀版本。</p>
      ${tiers.map(t => `<h3 class="mt" style="font-size:16px">${PlantArt.TIER_NAME[t]}（${t < 0 ? '10 分鐘以下' : PlantArt.TIER_MIN[t] + ' 分鐘以上'}）</h3>
      <div class="grid g3">${PlantArt.SPECIES.filter(s => s.tier === t).map(s => `<div class="panel dark"><b>${G.some(g => g.sp === s.id) ? s.name : '？？？'}</b>
        <div class="row wrap">${s.pal.map((p, ci) => { const got = G.filter(g => g.sp === s.id && g.c === ci); const sh = got.some(g => g.shiny); const demo = { sp: s.id, c: ci, seed: 11 + ci, shiny: sh }; return `<div class="dex-cell" title="${got.length ? p[0] + s.name + `（${got.length} 株）` : '尚未長出'}">${PlantArt.html(demo, 36, got.length ? '' : 'unseen')}${got.length ? `<small>${got.length}</small>` : ''}</div>`; }).join('')}</div></div>`).join('')}</div>`).join('')}`;
  }
  function renderStats() {
    const body = U.$('#pomoBody'), L = D.log;
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const k = dayKey(d); return { k, label: `${d.getMonth() + 1}/${d.getDate()}`, min: L.filter(l => dayKey(l.t) === k).reduce((a, l) => a + l.min, 0) }; });
    const mx = Math.max(30, ...days.map(d => d.min));
    const byTag = {}; L.forEach(l => { const k = l.tag || '未分類'; byTag[k] = (byTag[k] || 0) + l.min; });
    const totalMin = L.reduce((a, l) => a + l.min, 0);
    body.innerHTML = `<div class="grid g3">
        <div class="panel dark center"><div class="dim small-t">今天</div><b style="font-size:22px">${todayLog().reduce((a, l) => a + l.min, 0)} 分</b><div class="small-t">🍅 ${todayLog().length} 顆</div></div>
        <div class="panel dark center"><div class="dim small-t">累計</div><b style="font-size:22px">${Math.floor(totalMin / 60)} 小時 ${totalMin % 60} 分</b><div class="small-t">🍅 ${L.length} 顆</div></div>
        <div class="panel dark center"><div class="dim small-t">連續專注</div><b style="font-size:22px">${streak()} 天</b><div class="small-t">每天至少 1 顆番茄</div></div></div>
      <h3 class="mt" style="font-size:16px">最近 7 天（分鐘）</h3>
      <div class="pomo-bars">${days.map(d => `<div><i style="height:${d.min / mx * 100}%"></i><b>${d.min || ''}</b><small>${d.label}</small></div>`).join('')}</div>
      <h3 class="mt" style="font-size:16px">各科目累計</h3>
      ${Object.entries(byTag).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="stat-line"><span>${U.esc(k)}</span><b>${Math.floor(v / 60)} 小時 ${v % 60} 分</b></div>`).join('') || '<p class="small-t dim">還沒有紀錄。</p>'}
      <h3 class="mt" style="font-size:16px">最近紀錄</h3>
      ${L.slice(-15).reverse().map(l => { const pl = D.garden.find(g => g.id === l.plant); return `<div class="stat-line"><span>${new Date(l.t).toLocaleString()}・${l.min} 分${l.tag ? '・' + U.esc(l.tag) : ''}${l.note ? '・' + U.esc(l.note) : ''}</span><b>${pl ? PlantArt.name(pl) : ''}</b></div>`; }).join('')}`;
  }
  function renderSet() {
    const body = U.$('#pomoBody'), s = S();
    const num = (k, label, min, max, unit = '分鐘') => `<label class="volrow"><span>${label}</span><input type="range" min="${min}" max="${max}" step="1" data-num="${k}" value="${s[k]}"><b data-unit="${unit}">${(k === 'rounds' || k === 'seqRepeat') && !s[k] ? '無限' : s[k] + ' ' + unit}</b></label>`;
    const chk = (k, label) => `<label class="row"><input type="checkbox" data-chk="${k}" ${s[k] ? 'checked' : ''}> ${label}</label>`;
    const chimeOpts = sel => Object.entries(SFX.CHIMES).map(([k, c]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${c.name}</option>`).join('');
    body.innerHTML = `
      <h3 style="font-size:16px">時間</h3>
      ${num('focus', '專注長度', 1, 180)}${num('short', '短休息', 1, 60)}${num('long', '長休息', 1, 90)}${num('every', '幾次專注後長休息', 2, 8, '次')}${num('goal', '每日目標', 1, 20, '顆')}
      <div class="row wrap mt"><input class="px-in" id="pname" placeholder="自訂組合名稱" maxlength="10" style="width:160px"><button class="px-btn small" id="psave">把目前時間存成自訂組合</button>
        ${s.presets.map((p, i) => `<span class="tag">${U.esc(p.name)} <a href="#" data-delpre="${i}">✕</a></span>`).join('')}</div>
      <h3 class="mt" style="font-size:16px">🔁 循環</h3>
      <div class="row"><label class="row"><input type="radio" name="cmode" value="standard" ${s.cycleMode !== 'custom' ? 'checked' : ''}> 標準（每輪：專注＋休息，每幾輪長休息）</label>
        <label class="row"><input type="radio" name="cmode" value="custom" ${s.cycleMode === 'custom' ? 'checked' : ''}> 自訂順序</label></div>
      ${s.cycleMode === 'custom' ? `<div class="pomo-seq mt">${s.seq.map((x, i) => `<div class="row seq-row"><span class="seq-n">${i + 1}</span>
          <select class="px-in" data-seqt="${i}">${Object.keys(TN).map(t => `<option value="${t}" ${x.t === t ? 'selected' : ''}>${TI[t]} ${TN[t]}</option>`).join('')}</select>
          <input class="px-in" type="number" min="1" max="180" data-seqm="${i}" value="${x.m}" style="width:70px"> 分鐘
          <button class="px-btn small" data-sequp="${i}" ${i ? '' : 'disabled'}>↑</button><button class="px-btn small" data-seqdn="${i}" ${i < s.seq.length - 1 ? '' : 'disabled'}>↓</button><button class="px-btn small red" data-seqdel="${i}" ${s.seq.length > 1 ? '' : 'disabled'}>✕</button></div>`).join('')}
        <div class="row mt"><button class="px-btn small" data-seqadd="focus">＋ 🍅 專注</button><button class="px-btn small" data-seqadd="short">＋ ☕ 短休息</button><button class="px-btn small" data-seqadd="long">＋ 🛋 長休息</button>
          <button class="px-btn small" id="seqStd">用目前的標準設定產生</button></div>
        <label class="volrow mt"><span>整串重複</span><input type="range" min="0" max="10" step="1" data-num="seqRepeat" value="${s.seqRepeat}"><b data-unit="次">${s.seqRepeat ? s.seqRepeat + ' 次' : '無限'}</b></label>
        <p class="small-t dim">重複設成 0 ＝ 無限循環，直到你按「結束循環」。</p></div>`
      : `${num('rounds', '一個循環幾輪專注（0＝無限）', 0, 12, '輪')}<p class="small-t dim">設定有限輪數時，最後一輪之後一定是長休息，長休息結束就完成這個循環。</p>`}
      <p class="small-t gold-t" id="cplan">${planText()}</p>
      <h3 class="mt" style="font-size:16px">自動繼續</h3>
      ${chk('autoBreak', '專注結束後，自動開始休息')}${chk('autoFocus', '短休息結束後，自動開始下一輪專注')}${chk('autoAfterLong', '長休息結束後，自動開始下一輪專注')}
      <p class="small-t dim">沒有勾選的地方會停下來，顯示「下一段」讓你按開始、跳過或結束循環。</p>
      ${chk('strict', '嚴格模式：專注中不能暫停')}
      <h3 class="mt" style="font-size:16px">提示音</h3>
      <div class="music-grid"><label>專注結束</label><select class="px-in" data-sel="chime">${chimeOpts(s.chime)}</select><button class="px-btn small" data-try="chime">▶</button>
        <label>休息結束</label><select class="px-in" data-sel="breakChime">${chimeOpts(s.breakChime)}</select><button class="px-btn small" data-try="breakChime">▶</button></div>
      <label class="volrow mt"><span>提示音音量</span><input type="range" min="0" max="100" data-vol value="${Math.round(s.chimeVol * 100)}"><b>${Math.round(s.chimeVol * 100)}</b></label>
      ${num('chimeTimes', '專注結束響幾次', 1, 3, '次')}
      ${chk('countdown', '最後 5 秒倒數滴答聲')}
      <h3 class="mt" style="font-size:16px">專注時的環境</h3>
      <div class="music-grid"><label>白噪音</label><select class="px-in" data-sel="focusAmb"><option value="-1">不變（維持目前設定）</option>${AMB.PRESETS.map((p, i) => `<option value="${i}" ${s.focusAmb === i ? 'selected' : ''}>${p.name}</option>`).join('')}</select><span></span>
        <label>背景音樂</label><select class="px-in" data-sel="focusMusic"><option value="keep" ${s.focusMusic === 'keep' ? 'selected' : ''}>不變（照音樂設定）</option><option value="mute" ${s.focusMusic === 'mute' ? 'selected' : ''}>專注時靜音</option>${Object.entries(BGM.TRACKS).map(([k, t]) => `<option value="${k}" ${s.focusMusic === k ? 'selected' : ''}>${BGM.KIND[t.kind]}｜${t.name}</option>`).join('')}</select><span></span></div>
      <p class="small-t dim">專注結束後，白噪音與音樂會自動恢復原本的設定。</p>
      <h3 class="mt" style="font-size:16px">其他</h3>
      ${chk('title', '在瀏覽器分頁標題顯示倒數')}${chk('notify', '切到別的視窗時，用系統通知提醒我')}
      <h3 class="mt" style="font-size:16px">科目標籤</h3>
      <div class="row wrap">${s.tags.map((t, i) => `<span class="tag">${U.esc(t)} <a href="#" data-deltag="${i}">✕</a></span>`).join('')}<input class="px-in" id="ntag" maxlength="8" placeholder="新增標籤" style="width:120px"><button class="px-btn small" id="addtag">新增</button></div>
      <div class="row mt"><button class="px-btn small red" id="preset">恢復預設設定</button></div>`;
    const re = () => { save(); renderSet(); };
    const plan = () => { const e = U.$('#cplan', body); if (e) e.textContent = planText(); };
    U.$$('[data-num]', body).forEach(r => { r.oninput = () => { s[r.dataset.num] = +r.value; const u = r.nextElementSibling.dataset.unit; r.nextElementSibling.textContent = (r.dataset.num === 'rounds' && !+r.value) ? '無限' : (r.dataset.num === 'seqRepeat' && !+r.value) ? '無限' : r.value + ' ' + u; save(); plan(); }; });
    U.$$('input[name=cmode]', body).forEach(r => r.onchange = () => { s.cycleMode = r.value; re(); });
    U.$$('[data-seqt]', body).forEach(x => x.onchange = () => { s.seq[+x.dataset.seqt].t = x.value; save(); plan(); });
    U.$$('[data-seqm]', body).forEach(x => x.onchange = () => { s.seq[+x.dataset.seqm].m = U.clamp(Math.round(+x.value) || 1, 1, 180); x.value = s.seq[+x.dataset.seqm].m; save(); plan(); });
    U.$$('[data-sequp]', body).forEach(b => b.onclick = () => { const i = +b.dataset.sequp; [s.seq[i - 1], s.seq[i]] = [s.seq[i], s.seq[i - 1]]; re(); });
    U.$$('[data-seqdn]', body).forEach(b => b.onclick = () => { const i = +b.dataset.seqdn; [s.seq[i + 1], s.seq[i]] = [s.seq[i], s.seq[i + 1]]; re(); });
    U.$$('[data-seqdel]', body).forEach(b => b.onclick = () => { s.seq.splice(+b.dataset.seqdel, 1); re(); });
    U.$$('[data-seqadd]', body).forEach(b => b.onclick = () => { const t = b.dataset.seqadd; s.seq.push({ t, m: t === 'focus' ? s.focus : t === 'short' ? s.short : s.long }); re(); });
    const ss = U.$('#seqStd', body); if (ss) ss.onclick = () => { const m = s.cycleMode; s.cycleMode = 'standard'; s.seq = lapList(); s.cycleMode = m; re(); };
    U.$$('[data-chk]', body).forEach(c => c.onchange = () => {
      s[c.dataset.chk] = c.checked; save();
      if (c.dataset.chk === 'notify' && c.checked && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    });
    U.$$('[data-sel]', body).forEach(sel => sel.onchange = () => { const k = sel.dataset.sel; s[k] = k === 'focusAmb' ? +sel.value : sel.value; save(); if (k === 'chime' || k === 'breakChime') SFX.chime(sel.value, s.chimeVol, 1); });
    U.$$('[data-try]', body).forEach(b => b.onclick = () => SFX.chime(s[b.dataset.try], s.chimeVol, 1));
    const v = U.$('[data-vol]', body); v.oninput = () => { s.chimeVol = v.value / 100; v.nextElementSibling.textContent = v.value; save(); }; v.onchange = () => SFX.chime(s.chime, s.chimeVol, 1);
    U.$('#psave', body).onclick = () => { const n = (U.$('#pname', body).value || '').trim() || `自訂 ${s.focus}/${s.short}`; s.presets.push({ name: n, focus: s.focus, short: s.short, long: s.long, every: s.every, rounds: s.rounds }); U.toast(`已儲存「${n}」`); re(); };
    U.$$('[data-delpre]', body).forEach(a => a.onclick = e => { e.preventDefault(); s.presets.splice(+a.dataset.delpre, 1); re(); });
    U.$$('[data-deltag]', body).forEach(a => a.onclick = e => { e.preventDefault(); s.tags.splice(+a.dataset.deltag, 1); re(); });
    U.$('#addtag', body).onclick = () => { const t = (U.$('#ntag', body).value || '').trim(); if (t && !s.tags.includes(t)) { s.tags.push(t); re(); } };
    U.$('#preset', body).onclick = async () => { if (await U.confirm('恢復預設設定？', '時間、提示音與流程設定會恢復預設（花園與紀錄不受影響）。')) { D.set = Object.assign({}, DEF_SET, { presets: s.presets, tags: s.tags }); re(); } };
  }

  /* 頂部迷你計時器 */
  function mountMini() {
    const res = document.getElementById('topRes'); if (!res || document.getElementById('pomoMini')) return;
    const b = document.createElement('button');
    b.className = 'px-btn small'; b.id = 'pomoMini'; b.title = '番茄鐘';
    b.onclick = () => App.go('pomo', 'timer');
    res.insertBefore(b, res.firstChild);
  }
  mountMini();
  // 頁面載入時若專注已在離開期間結束，補發完成（等其他模組都載入後）
  setTimeout(() => tick(true), 800);

  return { screen, start, startCycle, skipStep, endCycle, pause, resume, abandon, get data() { return D; }, exportData: () => D, importData: d => { if (d) { D = d; save(); D = load(); } }, THEMES };
})();
