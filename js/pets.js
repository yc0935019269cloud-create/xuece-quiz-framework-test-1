/* 寵物像素圖產生器：用圓形/多邊形拼出圓滾滾的身體，自動加柔和描邊與陰影。
 * 每隻寵物有自己的臉（眼睛/嘴巴/腮紅樣式），支援表情（眨眼、開心、眨一隻眼、驚訝、打瞌睡）、
 * 動作姿勢（揮手）、換色造型、配件與整套服裝；畫面上的寵物會每隔一段時間做隨機小動作。 */
const PetArt = (() => {
  const W = 30, H = 30, OX = 1, OY = 3;
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (c, k = 0.13) => toHex(hex(c).map(v => v * (1 - k)));
  const BASE = { eye: '#3b2c2c', blush: '#ffb0bf', line: '#8a6f63', nose: '#3b2c2c', pink: '#ff9fb5', white: '#ffffff', gold: '#ffd84a', red: '#ff7b7b', mouth: '#3b2c2c', teeth: '#ffffff' };

  /* ---------- 臉部零件 ---------- */
  function eyePx(type, cx, ey, side) {
    const L = side === 'L';
    const a = L ? cx - 1 : cx, b = L ? cx : cx + 1; // 兩格寬的眼睛欄位
    switch (type) {
      case 'round': return { eye: [[a, ey], [b, ey], [a, ey + 1], [b, ey + 1]], white: [[a, ey]] };
      case 'shiny': return { eye: [[a, ey - 1], [b, ey - 1], [a, ey], [b, ey], [a, ey + 1], [b, ey + 1]], white: [[a, ey - 1]] };
      case 'lash': return { eye: [[cx, ey], [cx, ey + 1], L ? [cx - 1, ey - 1] : [cx + 1, ey - 1]] };
      case 'sly': return { eye: [[a, ey], [b, ey], [a, ey + 1], [b, ey + 1], L ? [a - 1, ey - 1] : [b + 1, ey - 1]], white: [[a, ey]] };
      case 'happy': return { eye: [[cx - 1, ey + 1], [cx, ey], [cx + 1, ey + 1]] };
      case 'line': return { eye: [[cx - 1, ey + 1], [cx, ey + 1], [cx + 1, ey + 1]] };
      case 'o': return { eye: [[cx, ey - 1], [cx, ey], [cx, ey + 1]] };
      default: return { eye: [[cx, ey], [cx, ey + 1]] }; // dot
    }
  }
  function mouthPx(type, my) {
    switch (type) {
      case 'cat': return { mouth: [[11, my], [12, my + 1], [13, my], [14, my], [15, my + 1], [16, my]] };
      case 'open': return { mouth: [[12, my], [13, my], [14, my], [15, my], [12, my + 1], [15, my + 1], [13, my + 2], [14, my + 2]], pink: [[13, my + 1], [14, my + 1]] };
      case 'teeth': return { mouth: [[12, my], [15, my], [13, my], [14, my]], teeth: [[13, my + 1], [14, my + 1]], line: [[12, my + 1], [15, my + 1]] };
      case 'fang': return { mouth: [[12, my], [15, my], [13, my + 1], [14, my + 1]], teeth: [[15, my + 1]] };
      case 'smirk': return { mouth: [[12, my + 1], [13, my + 1], [14, my + 1], [15, my]] };
      case 'beak': return { beak: [[13, my], [14, my], [13, my + 1], [14, my + 1]] };
      case 'o': return { mouth: [[13, my], [14, my], [12, my + 1], [15, my + 1], [13, my + 2], [14, my + 2]] };
      case 'tongue': return { mouth: [[12, my], [15, my], [13, my + 1], [14, my + 1]], pink: [[13, my + 2], [14, my + 2]] };
      case 'none': return {};
      case 'tiny': return { mouth: [[13, my + 1], [14, my + 1]] };
      case 'sleep': return { mouth: [[13, my + 1]] };
      default: return { mouth: [[12, my], [15, my], [13, my + 1], [14, my + 1]] }; // smile
    }
  }
  function blushPx(type, my, lx, rx) {
    if (type === 'none') return [];
    if (type === 'big') return [[lx - 2, my - 1], [lx - 1, my - 1], [lx - 2, my], [lx - 1, my], [rx + 1, my - 1], [rx + 2, my - 1], [rx + 1, my], [rx + 2, my]];
    if (type === 'lines') return [[lx - 3, my], [lx - 2, my - 1], [lx - 1, my], [lx, my - 1], [rx, my - 1], [rx + 1, my], [rx + 2, my - 1], [rx + 3, my]];
    return [[lx - 2, my], [lx - 1, my], [rx + 1, my], [rx + 2, my]]; // oval
  }
  const EXPR = {
    neutral: {}, blink: { eyes: 'line' }, happy: { eyes: 'happy', mouth: 'open' }, wink: { eyeL: 'happy' },
    surprise: { eyes: 'o', mouth: 'o' }, sleep: { eyes: 'line', mouth: 'sleep' }
  };
  function buildFace(F, expr) {
    const x = EXPR[expr] || {};
    const ey = F.ey ?? 11, my = F.my ?? 14, lx = F.lx ?? 10, rx = F.rx ?? 17;
    let mouth = x.mouth || F.mouth || 'smile';
    if (F.mouth === 'beak') mouth = 'beak';
    if (F.mouth === 'none') mouth = 'none';
    if (expr === 'happy' && F.happyMouth) mouth = F.happyMouth;
    const eL = eyePx(x.eyeL || x.eyes || F.eyes, lx, ey, 'L'), eR = eyePx(x.eyes || F.eyes, rx, ey, 'R');
    const m = mouthPx(mouth, my);
    const out = [
      { px: blushPx(F.blush || 'oval', my, lx, rx), c: 'blush' },
      { px: eL.eye.concat(eR.eye), c: 'eye' }, { px: (eL.white || []).concat(eR.white || []), c: 'white' }
    ];
    if (F.nose) out.push({ px: F.nose === 'big' ? [[13, my - 1], [14, my - 1], [13, my - 2], [14, my - 2]] : [[13, my - 1], [14, my - 1]], c: F.nose === 'pink' ? 'pink' : 'nose' });
    Object.entries(m).forEach(([c, px]) => out.push({ px, c }));
    return out;
  }

  const HEAD = { e: [13.5, 11.5, 8.6, 7.2], c: 'body', shade: 1 };
  const BODY = { e: [13.5, 20.5, 6.8, 5.4], c: 'body', shade: 1, squash: 1 };
  const FEET = [{ e: [10.2, 25.4, 2.3, 1.4], c: 'body', ground: 1 }, { e: [16.8, 25.4, 2.3, 1.4], c: 'body', ground: 1 }];
  const ARM_UP = [{ e: [21.4, 15.2, 1.8, 2.8], c: 'body', ring: 1 }];
  const ARM_UP2 = [{ e: [22.2, 14.2, 1.8, 2.6], c: 'body', ring: 1 }];

  const DEFS = {
    cat: {
      pal: { body: '#ffd9a8', belly: '#fff6ea', accent: '#f2a764', inner: '#ffb3c1', line: '#9a6a52' },
      back: [{ e: [21.8, 20.5, 1.5, 3.4], c: 'body', ground: 1 }, { e: [22.6, 17, 1.5, 1.6], c: 'accent', ground: 1 }],
      shapes: [
        { p: [[5, 10], [6.5, 1.5], [12.5, 5.5]], c: 'body' }, { p: [[22, 10], [20.5, 1.5], [14.5, 5.5]], c: 'body' },
        { p: [[6.6, 7.5], [7.2, 3.6], [10.4, 6]], c: 'inner' }, { p: [[20.4, 7.5], [19.8, 3.6], [16.6, 6]], c: 'inner' },
        BODY, ...FEET, HEAD,
        { e: [13.5, 21.5, 3.8, 3.4], c: 'belly' },
        { px: [[13, 5], [14, 5], [13, 6], [14, 6], [11, 5], [16, 5]], c: 'accent' }],
      face: { eyes: 'round', mouth: 'none', blush: 'oval', nose: 'pink' }
    },
    dog: {
      pal: { body: '#fff7ee', ear: '#d9a070', accent: '#ff7b7b', line: '#8f6f5c' },
      back: [{ e: [21.3, 19, 1.3, 2.4], c: 'ear', ground: 1 }],
      shapes: [BODY, ...FEET, HEAD,
        { e: [5.6, 11.8, 2.5, 4.6], c: 'ear', ring: 1 }, { e: [21.4, 11.8, 2.5, 4.6], c: 'ear', ring: 1 },
        { e: [17.4, 11.8, 2.5, 2.2], c: 'ear', clip: 1 },
        { e: [13.5, 18.3, 5.2, 1.0], c: 'accent' }, { px: [[13, 19], [14, 19]], c: 'gold' }],
      face: { eyes: 'dot', mouth: 'none', blush: 'big', nose: 'big', my: 15 }
    },
    rat: {
      pal: { body: '#fbfbff', hood: '#cfd1dc', ear: '#e7e7f0', inner: '#ffb3c6', seed: '#e8c46a', line: '#7d6f7e' },
      back: [{ px: [[20, 24], [21, 24], [22, 23], [23, 22], [24, 21], [24, 20], [25, 19]], c: 'inner', ground: 1 }],
      shapes: [
        { e: [6.2, 5.5, 4, 4], c: 'ear', ring: 1 }, { e: [20.8, 5.5, 4, 4], c: 'ear', ring: 1 },
        { e: [6.2, 5.5, 2.4, 2.4], c: 'inner' }, { e: [20.8, 5.5, 2.4, 2.4], c: 'inner' },
        BODY, ...FEET, HEAD,
        { e: [13.5, 8.6, 9, 4.6], c: 'hood', clip: 1 },
        { e: [13.5, 20.6, 1.8, 2.2], c: 'seed' }, { px: [[13, 19], [13, 20], [13, 21]], c: 'line' }],
      face: { eyes: 'shiny', mouth: 'none', blush: 'oval', nose: 'pink', ey: 12, my: 15 }
    },
    slime: {
      pal: { body: '#9fd4ff', line: '#5a7fa8' }, accDy: 4, frontDy: 3, armC: 'body',
      shapes: [{ e: [13.5, 18.8, 10.5, 7.4], c: 'body', shade: 1, squash: 1 }, { e: [13.5, 12, 5.4, 5], c: 'body', shade: 1 }, { e: [13.5, 8.2, 2.4, 3], c: 'body' },
        { px: [[9, 13], [9, 14], [10, 12]], c: 'white' }],
      face: { eyes: 'dot', mouth: 'smile', blush: 'lines', ey: 17, my: 20 }
    },
    luckycat: {
      pal: { body: '#fffdf8', accent: '#f2a764', inner: '#ffb3c1', line: '#8f7a70' },
      back: [{ e: [21.8, 21, 1.5, 3], c: 'body', ground: 1 }],
      shapes: [
        { p: [[5, 10], [6.5, 1.5], [12.5, 5.5]], c: 'accent' }, { p: [[22, 10], [20.5, 1.5], [14.5, 5.5]], c: 'body' },
        { p: [[20.4, 7.5], [19.8, 3.6], [16.6, 6]], c: 'inner' },
        BODY, ...FEET, HEAD,
        { e: [8.5, 7.5, 3, 2.5], c: 'accent', clip: 1 },
        { e: [13.5, 18.3, 5.2, 1.0], c: 'red' }, { px: [[13, 19], [14, 19], [13, 20], [14, 20]], c: 'gold' },
        { e: [22.2, 15.5, 2.2, 2.8], c: 'body', ring: 1 }, { px: [[22, 14], [22, 15]], c: 'inner' }],
      face: { eyes: 'happy', mouth: 'cat', blush: 'big', nose: 'pink' }
    },
    dragon: {
      pal: { body: '#a8e59a', belly: '#fff3c4', wing: '#7cc26a', horn: '#ffd84a', line: '#5f8a55' },
      back: [{ p: [[8, 19], [1.5, 13], [3, 22]], c: 'wing' }, { p: [[19, 19], [25.5, 13], [24, 22]], c: 'wing' },
        { e: [21.8, 23, 3, 1.4], c: 'body', ground: 1 }, { p: [[24, 21], [26.5, 22.5], [24.5, 24]], c: 'horn', ground: 1 }],
      shapes: [
        { p: [[9, 6], [8, 1.5], [11.5, 4.6]], c: 'horn' }, { p: [[18, 6], [19, 1.5], [15.5, 4.6]], c: 'horn' },
        BODY, ...FEET, HEAD,
        { e: [13.5, 21.5, 3.8, 3.4], c: 'belly' }, { px: [[11, 20], [12, 20], [15, 20], [16, 20], [11, 22], [16, 22]], c: 'body' }],
      face: { eyes: 'round', mouth: 'fang', blush: 'oval', happyMouth: 'open' }
    },
    owl: {
      pal: { body: '#d2a47a', face: '#fff4e4', wing: '#b0845c', belly: '#f0dcc2', beak: '#ffc84a', line: '#7a5a42' }, accDy: 1, armC: 'wing',
      shapes: [
        { p: [[5.5, 8], [5, 1.5], [10, 5]], c: 'body' }, { p: [[21.5, 8], [22, 1.5], [17, 5]], c: 'body' },
        { e: [13.5, 15.5, 9.4, 10.2], c: 'body', shade: 1, squash: 1 },
        { e: [5.3, 17, 2.2, 5], c: 'wing', clip: 1 }, { e: [21.7, 17, 2.2, 5], c: 'wing', clip: 1 },
        { e: [13.5, 20.5, 5, 4.4], c: 'belly' },
        { px: [[11, 19], [13, 20], [15, 19], [12, 22], [14, 22], [16, 21]], c: 'wing' },
        { e: [10, 11.5, 3.2, 3.2], c: 'face' }, { e: [17, 11.5, 3.2, 3.2], c: 'face' },
        { e: [10.2, 25.4, 1.6, 1], c: 'beak', ground: 1 }, { e: [16.8, 25.4, 1.6, 1], c: 'beak', ground: 1 }],
      face: { eyes: 'round', mouth: 'beak', blush: 'oval', my: 14, lx: 10, rx: 17 }
    },
    fairy: {
      pal: { body: '#ffe0ea', wing: '#d6f3ff', petal: '#ffb3cf', leaf: '#8fd88a', line: '#a07a8a' },
      back: [{ e: [4.8, 15, 3.6, 5], c: 'wing' }, { e: [22.2, 15, 3.6, 5], c: 'wing' }, { e: [5.5, 22, 2.4, 3], c: 'wing' }, { e: [21.5, 22, 2.4, 3], c: 'wing' }],
      shapes: [BODY, ...FEET, HEAD,
        { e: [11, 3.8, 2.2, 1.7], c: 'petal' }, { e: [16, 3.8, 2.2, 1.7], c: 'petal' }, { e: [13.5, 2.6, 1.8, 2], c: 'petal' },
        { px: [[13, 4], [14, 4]], c: 'gold' }, { e: [13.5, 21.4, 3.6, 3.2], c: 'petal' }],
      face: { eyes: 'lash', mouth: 'tiny', blush: 'big' }
    },
    fox: {
      pal: { body: '#ffb070', belly: '#fff6ea', tip: '#5a4040', line: '#9a5a3a' },
      back: [{ e: [22, 18.5, 3.6, 6], c: 'body', ground: 1 }, { e: [22.8, 13.8, 2.4, 2.2], c: 'belly', ground: 1 }],
      shapes: [
        { p: [[5, 10], [5.5, 0.8], [12, 5.5]], c: 'body' }, { p: [[22, 10], [21.5, 0.8], [15, 5.5]], c: 'body' },
        { p: [[5.4, 3.8], [5.6, 1], [7.4, 2.6]], c: 'tip' }, { p: [[21.6, 3.8], [21.4, 1], [19.6, 2.6]], c: 'tip' },
        BODY, ...FEET, HEAD,
        { e: [9.5, 15, 4.4, 3], c: 'belly', clip: 1 }, { e: [17.5, 15, 4.4, 3], c: 'belly', clip: 1 },
        { e: [13.5, 21.5, 3.6, 3.2], c: 'belly' },
        { e: [10.2, 25.6, 2.1, 1.1], c: 'tip', ground: 1 }, { e: [16.8, 25.6, 2.1, 1.1], c: 'tip', ground: 1 }],
      face: { eyes: 'sly', mouth: 'smirk', blush: 'lines', nose: 'dark', happyMouth: 'cat' }
    },
    /* ---- 營地用 Q 版勇者（與寵物同像素密度），依職業不同 ---- */
    hero_knight: {
      pal: { skin: '#ffe2cc', metal: '#d3dae4', blue: '#5f8fe0', plume: '#ff7b7b', boot: '#6b5a52', gold: '#ffd84a', blade: '#eef3f8', line: '#6f6a78' },
      shapes: [
        { e: [13.5, 20.5, 6.8, 5.4], c: 'metal', shade: 1, squash: 1 },
        { e: [13.5, 21, 3.4, 4.6], c: 'blue', clip: 1 },
        { e: [10.2, 25.4, 2.3, 1.4], c: 'boot', ground: 1 }, { e: [16.8, 25.4, 2.3, 1.4], c: 'boot', ground: 1 },
        { e: [13.5, 11.5, 8.6, 7.2], c: 'skin', shade: 1 },
        { e: [13.5, 8.6, 9.2, 6.6], c: 'metal', clipTop: 9.6, shade: 1 },
        { e: [5.6, 12.5, 1.6, 3.2], c: 'metal', clip: 1 }, { e: [21.4, 12.5, 1.6, 3.2], c: 'metal', clip: 1 },
        { e: [13.5, 0.8, 1.6, 2.4], c: 'plume' }, { px: [[13, 4], [14, 4]], c: 'blue' }],
      front: [{ e: [5.2, 20.5, 3.2, 3.8], c: 'blue', ring: 1 }, { px: [[4, 19], [4, 20], [4, 21], [3, 20], [5, 20]], c: 'gold' },
        { p: [[20.8, 21], [22.2, 22.4], [27.2, 12.6], [26.2, 11.6]], c: 'blade' }, { p: [[19.4, 20.4], [23.2, 24.2], [24, 23.4], [20.2, 19.6]], c: 'gold' }],
      face: { eyes: 'dot', mouth: 'none', blush: 'oval', ey: 12, my: 15 }
    },
    hero_mage: {
      pal: { skin: '#ffe2cc', hair: '#8a5a3c', robe: '#8a6ad8', trim: '#ffd84a', hat: '#7a58c8', boot: '#5a4a6a', wood: '#a8784a', orb: '#9ff0ff', line: '#6a5a7a' },
      back: [{ e: [6, 13.5, 2.4, 4.4], c: 'hair' }, { e: [21, 13.5, 2.4, 4.4], c: 'hair' }],
      shapes: [
        { e: [13.5, 20.8, 7.2, 5.4], c: 'robe', shade: 1, squash: 1 }, { px: [[13, 16], [13, 17], [13, 18], [13, 19], [13, 20], [13, 21], [13, 22], [13, 23], [13, 24], [13, 25]], c: 'trim' },
        { e: [10.2, 25.6, 2.2, 1.2], c: 'boot', ground: 1 }, { e: [16.8, 25.6, 2.2, 1.2], c: 'boot', ground: 1 },
        { e: [13.5, 11.8, 8.2, 7], c: 'skin', shade: 1 },
        { e: [13.5, 7.8, 8.4, 2.6], c: 'hair', clip: 1 },
        { e: [13.5, 5.4, 10, 1.7], c: 'hat' }, { p: [[8, 5.4], [19, 5.4], [18.5, -1.5], [22.5, 0], [16.5, -3.2]], c: 'hat' }, { e: [13.5, 4.6, 5.6, 0.7], c: 'trim' }],
      front: [{ p: [[22, 9], [23.2, 9], [23.2, 27], [22, 27]], c: 'wood' }, { e: [22.6, 7.4, 2.4, 2.4], c: 'orb' }, { px: [[22, 6]], c: 'white' }],
      face: { eyes: 'lash', mouth: 'none', blush: 'oval', ey: 12, my: 15 }
    },
    hero_ranger: {
      pal: { skin: '#ffe2cc', hair: '#9a6a3a', hood: '#6fb45f', tunic: '#5fa050', belt: '#8a5a34', boot: '#6b4a34', wood: '#b0783c', str: '#f4f0e0', line: '#4f6a45' },
      shapes: [
        { e: [13.5, 20.6, 6.8, 5.4], c: 'tunic', shade: 1, squash: 1 }, { e: [13.5, 21.2, 6.8, 0.9], c: 'belt', clip: 1 },
        { e: [10.2, 25.4, 2.3, 1.4], c: 'boot', ground: 1 }, { e: [16.8, 25.4, 2.3, 1.4], c: 'boot', ground: 1 },
        { e: [13.5, 10.8, 9.8, 8.4], c: 'hood', shade: 1 }, { p: [[13.5, 0], [16.5, 3.5], [10.5, 3.5]], c: 'hood' },
        { e: [13.5, 12.6, 6.6, 5.4], c: 'skin', shade: 1 },
        { e: [13.5, 8.4, 6.8, 2.2], c: 'hair', clip: 1 }],
      front: [{ px: [[22, 10], [23, 11], [24, 13], [24, 14], [24, 15], [24, 16], [24, 17], [24, 18], [23, 20], [22, 21]], c: 'wood' }, { px: [[22, 11], [22, 12], [22, 13], [22, 14], [22, 15], [22, 16], [22, 17], [22, 18], [22, 19], [22, 20]], c: 'str' }],
      noFrontLine: 0,
      face: { eyes: 'dot', mouth: 'none', blush: 'oval', ey: 13, my: 15 }
    },
    hero_cleric: {
      pal: { skin: '#ffe2cc', hair: '#ffd98a', veil: '#fbfbff', gold: '#ffd84a', robe: '#fbfbff', boot: '#c9b89a', staff: '#e8c050', line: '#8a7f8a' },
      shapes: [
        { e: [13.5, 20.8, 7.2, 5.4], c: 'robe', shade: 1, squash: 1 }, { px: [[13, 18], [14, 18], [13, 19], [14, 19], [12, 19], [15, 19], [13, 20], [14, 20], [13, 21], [14, 21]], c: 'gold' },
        { e: [10.2, 25.6, 2.2, 1.2], c: 'boot', ground: 1 }, { e: [16.8, 25.6, 2.2, 1.2], c: 'boot', ground: 1 },
        { e: [13.5, 11, 9.8, 8.4], c: 'veil', shade: 1 }, { e: [13.5, 4, 8, 1], c: 'gold', clip: 1 },
        { e: [13.5, 12.6, 6.6, 5.4], c: 'skin', shade: 1 },
        { e: [13.5, 8.4, 6.8, 2.4], c: 'hair', clip: 1 }],
      front: [{ p: [[22, 10], [23.2, 10], [23.2, 27], [22, 27]], c: 'staff' }, { e: [22.6, 7.6, 2.8, 2.8], c: 'gold' }, { e: [22.6, 7.6, 1.2, 1.2], c: 'white' }],
      face: { eyes: 'lash', mouth: 'none', blush: 'big', ey: 13, my: 15 }
    },
    hero_berserker: {
      pal: { skin: '#ffe2cc', hair: '#ff8a4a', fur: '#b08a6a', helm: '#c9cfd9', horn: '#fff3dc', boot: '#6b4a34', wood: '#9a6a3a', blade: '#e6ecf3', line: '#7a5a4a' },
      shapes: [
        { e: [13.5, 20.6, 7, 5.4], c: 'skin', shade: 1, squash: 1 }, { e: [13.5, 17.4, 7.6, 2.4], c: 'fur', clip: 1 }, { e: [13.5, 23.6, 7, 2.4], c: 'fur', clip: 1 },
        { e: [10.2, 25.4, 2.3, 1.4], c: 'boot', ground: 1 }, { e: [16.8, 25.4, 2.3, 1.4], c: 'boot', ground: 1 },
        { p: [[6, 9], [3.5, 1.5], [9.5, 6]], c: 'horn' }, { p: [[21, 9], [23.5, 1.5], [17.5, 6]], c: 'horn' },
        { e: [13.5, 11.8, 8.4, 7.2], c: 'skin', shade: 1 },
        { p: [[5.5, 10], [7, 5], [9, 7.5], [11, 3.5], [13.5, 6], [16, 3.5], [18, 7.5], [20, 5], [21.5, 10], [13.5, 8]], c: 'hair' },
        { e: [13.5, 7.4, 8.6, 2], c: 'helm', clip: 1 }],
      front: [{ p: [[21.6, 12], [22.8, 12], [22.8, 27], [21.6, 27]], c: 'wood' }, { e: [24.2, 13.6, 3.2, 3.6], c: 'blade', clipLeft: 22.8 }, { e: [20.4, 13.6, 3.2, 3.6], c: 'blade', clipRight: 21.6 }],
      face: { eyes: 'dot', mouth: 'none', blush: 'oval', ey: 12, my: 15 }
    },
    campfire: {
      pal: { log: '#a8703f', stone: '#b9bcc6', f1: '#ffb347', f2: '#ffe066', f3: '#ff7a3a', line: '#5a4640' },
      shapes: [
        { e: [7, 24.5, 2.4, 1.8], c: 'stone', ground: 1, shade: 1 }, { e: [20, 24.5, 2.4, 1.8], c: 'stone', ground: 1, shade: 1 }, { e: [13.5, 25.8, 2.6, 1.6], c: 'stone', ground: 1, shade: 1 },
        { p: [[6, 21], [8, 19.5], [21, 25], [19, 26.5]], c: 'log', ground: 1 }, { p: [[21, 21], [19, 19.5], [6, 25], [8, 26.5]], c: 'log', ground: 1 },
        { e: [13.5, 16.5, 5.2, 6.4], c: 'f3' }, { e: [13.5, 17.6, 3.6, 4.6], c: 'f1' }, { e: [13.5, 19, 2, 2.8], c: 'f2' },
        { p: [[10, 14], [11.5, 7], [13, 13]], c: 'f3' }, { p: [[14.5, 12], [16, 5], [17.5, 13]], c: 'f3' }],
      face: {}, noFace: 1
    }
  };

  /* ---------- 配件與服裝：hat/head 戴頭上，back 在身後（披風），front 在身前（手持物） ---------- */
  const CAPE = c => ({ p: [[7.5, 15.5], [19.5, 15.5], [25, 27.5], [2, 27.5]], c });
  const ACC = {
    bow: { pal: { a: '#ff8fb1' }, head: [{ p: [[16.5, 1.5], [16.5, 6], [19.8, 3.8]], c: 'a' }, { p: [[23, 1.5], [23, 6], [19.8, 3.8]], c: 'a' }, { e: [19.8, 3.8, 1.2, 1.2], c: 'a' }] },
    crown: { pal: { a: '#ffd84a', g: '#ff7b9b' }, head: [{ p: [[8.5, 5.8], [18.5, 5.8], [18.5, 0.5], [16.2, 3], [13.5, 0], [10.8, 3], [8.5, 0.5]], c: 'a' }, { px: [[13, 3], [14, 3]], c: 'g' }] },
    straw: { pal: { a: '#f2d58a', b: '#e06a6a' }, head: [{ e: [13.5, 4.8, 9.6, 1.7], c: 'a' }, { e: [13.5, 2.8, 5.2, 2.8], c: 'a' }, { e: [13.5, 4, 5.2, 0.8], c: 'b' }] },
    wizard: { pal: { a: '#9a78e0', b: '#ffd84a' }, head: [{ e: [13.5, 5, 8.6, 1.4], c: 'a' }, { p: [[8.5, 5], [18.5, 5], [16, -2.5]], c: 'a' }, { px: [[13, 2], [14, 3]], c: 'b' }] },
    party: { pal: { a: '#7cc4ff', b: '#ff9fbf', c: '#ffd84a' }, head: [{ p: [[9.5, 5.5], [17.5, 5.5], [13.5, -2]], c: 'a' }, { px: [[12, 3], [13, 3], [14, 1], [12, 5], [15, 4], [16, 5]], c: 'b' }, { e: [13.5, -1.5, 1.4, 1.4], c: 'c' }] },
    halo: { pal: { a: '#ffe066' }, noLine: 1, head: [{ e: [13.5, 0.6, 5.6, 1.6], c: 'a' }, { e: [13.5, 0.6, 3.8, 0.6], c: null }] },
    flower: { pal: { a: '#ffb3cf', b: '#ffd84a' }, head: [{ e: [6, 4.5, 1.5, 1.5], c: 'a' }, { e: [8.6, 4.5, 1.5, 1.5], c: 'a' }, { e: [7.3, 3.2, 1.5, 1.5], c: 'a' }, { e: [7.3, 5.8, 1.5, 1.5], c: 'a' }, { px: [[7, 4], [7, 5]], c: 'b' }] },
    scarf: { pal: { a: '#ff7b7b' }, front: [{ e: [13.5, 18.4, 6.8, 1.6], c: 'a' }, { e: [17.8, 21, 1.5, 2.6], c: 'a' }] },
    // ---- 整套服裝 ----
    set_wizard: {
      pal: { a: '#8f6ad8', b: '#ffd84a', cape: '#7a58c8', v: '#9ff0ff', k: '#b08a5a' },
      back: [CAPE('cape'), { px: [[3, 26], [4, 26], [23, 26], [24, 26]], c: 'b' }],
      head: [{ e: [13.5, 5.2, 9.2, 1.5], c: 'a' }, { p: [[8.5, 5.2], [18.5, 5.2], [19, -1], [22.5, 1], [17, -3]], c: 'a' }, { e: [13.5, 4.4, 5, 0.7], c: 'b' }, { px: [[21, 0]], c: 'b' }],
      front: [{ e: [22.6, 19.5, 2.6, 2.6], c: 'v' }, { p: [[21.6, 15], [23.6, 15], [23.4, 17.4], [21.8, 17.4]], c: 'v' }, { px: [[22, 14], [23, 14]], c: 'k' }, { px: [[21, 19], [22, 18]], c: 'white' }]
    },
    set_knight: {
      pal: { a: '#c9d1dc', b: '#5fa8ff', cape: '#e8585a', s: '#e8eef5', h: '#c9a24a' },
      back: [CAPE('cape')],
      head: [{ e: [13.5, 6, 8.2, 4.6], c: 'a', clipTop: 7.5 }, { p: [[12.5, 1.2], [14.5, 1.2], [13.5, -1.2]], c: 'b' }, { px: [[13, 3], [14, 3]], c: 'b' }],
      front: [{ p: [[20.6, 20.8], [22, 22.2], [27.4, 12.2], [26.4, 11.2]], c: 's' }, { p: [[19.2, 20], [23.4, 24.2], [24.2, 23.4], [20, 19.2]], c: 'h' }, { e: [20.2, 22.6, 1, 1], c: 'h' }]
    },
    set_fisher: {
      pal: { a: '#f2d58a', b: '#e06a6a', r: '#b07a4a', f: '#8fd3ff' },
      head: [{ e: [13.5, 4.8, 9.6, 1.7], c: 'a' }, { e: [13.5, 2.8, 5.2, 2.8], c: 'a' }, { e: [13.5, 4, 5.2, 0.8], c: 'b' }],
      front: [{ px: [[20, 22], [21, 21], [22, 20], [23, 18], [24, 16], [25, 14], [26, 12], [27, 10], [28, 8]], c: 'r' }, { px: [[28, 9], [28, 10], [28, 11], [28, 12], [28, 13]], c: 'white' }, { e: [28, 15.4, 1.3, 1.6], c: 'f' }],
      noFrontLine: 1
    },
    set_scholar: {
      pal: { a: '#3f3a4a', b: '#ffd84a', book: '#6a9cf0', pg: '#ffffff' },
      head: [{ p: [[6.5, 3.5], [13.5, 0.5], [20.5, 3.5], [13.5, 6.5]], c: 'a' }, { e: [13.5, 5.5, 4.6, 1.4], c: 'a' }, { px: [[13, 3], [19, 4], [19, 5], [19, 6], [19, 7]], c: 'b' }],
      front: [{ p: [[9.5, 18], [17.5, 18], [17.5, 23.5], [9.5, 23.5]], c: 'book' }, { p: [[10.5, 18.8], [16.5, 18.8], [16.5, 19.8], [10.5, 19.8]], c: 'pg' }, { px: [[13, 18], [13, 19], [13, 20], [13, 21], [13, 22], [13, 23]], c: 'line' }]
    },
    set_princess: {
      pal: { a: '#ffd84a', g: '#7cc4ff', cape: '#ff9fbf', w: '#ffe066', st: '#fff3a0' },
      back: [CAPE('cape'), { px: [[5, 24], [9, 26], [18, 26], [22, 24]], c: 'white' }],
      head: [{ p: [[10, 5], [17, 5], [17, 2.8], [15.5, 4], [13.5, 1.8], [11.5, 4], [10, 2.8]], c: 'a' }, { px: [[13, 3], [14, 3]], c: 'g' }],
      front: [{ px: [[20, 22], [21, 21], [22, 20], [23, 19], [24, 18]], c: 'w' }, { p: [[25, 14], [26, 16.2], [28.3, 16.4], [26.5, 17.8], [27.2, 20], [25, 18.7], [22.8, 20], [23.5, 17.8], [21.7, 16.4], [24, 16.2]], c: 'st' }]
    },
    set_chef: {
      pal: { a: '#ffffff', ap: '#fffaf2', r: '#ff7b7b' },
      head: [{ e: [13.5, 5, 6.4, 1.8], c: 'a' }, { e: [10.5, 1.6, 3, 2.8], c: 'a' }, { e: [16.5, 1.6, 3, 2.8], c: 'a' }, { e: [13.5, 0.4, 3, 2.6], c: 'a' }],
      front: [{ e: [13.5, 21.6, 4.8, 4], c: 'ap' }, { e: [13.5, 18.4, 5.4, 0.8], c: 'r' }, { px: [[13, 21], [14, 21]], c: 'r' }]
    }
  };

  function raster(shapes, pal, frame, grid, owner, dyExtra = 0) {
    shapes.forEach((sh, si) => {
      const dy = (frame && !sh.ground ? 1 : 0) + dyExtra;
      const color = sh.c === null ? null : (pal[sh.c] || BASE[sh.c] || sh.c);
      const tag = sh.ring ? 'r' + si + Math.random() : null;
      const paint = (x, y, c) => {
        x = Math.round(x); y = Math.round(y);
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        if (sh.clip && !grid[y][x]) return;
        grid[y][x] = c; owner[y][x] = tag || (sh.clip ? owner[y][x] : 'b');
      };
      if (sh.px) { sh.px.forEach(([x, y]) => paint(x + OX, y + OY + dy, color)); return; }
      if (sh.e) {
        let [cx, cy, rx, ry] = sh.e;
        if (frame && sh.squash) { cy += 0.4; ry -= 0.4; rx += 0.3; }
        cx += OX; cy += OY + dy;
        for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
          if (sh.clipTop !== undefined && y > sh.clipTop + OY + dy) continue;
          if (sh.clipLeft !== undefined && x < sh.clipLeft + OX) continue;
          if (sh.clipRight !== undefined && x > sh.clipRight + OX) continue;
          const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
          if (u * u + v * v <= 1) {
            let c = color;
            if (c && sh.shade && (v > 0.5 || u > 0.72)) c = shade(c);
            paint(x, y, c);
          }
        }
        return;
      }
      if (sh.p) {
        const pts = sh.p.map(([x, y]) => [x + OX, y + OY + dy]);
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) {
          const px = x + 0.5, py = y + 0.5; let inside = false;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const [xi, yi] = pts[i], [xj, yj] = pts[j];
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) inside = !inside;
          }
          if (inside) paint(x, y, color);
        }
      }
    });
  }
  function outline(grid, owner, lineC) {
    const out = grid.map(r => r.slice());
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!grid[y][x]) {
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => (grid[y + b] || [])[x + a])) out[y][x] = lineC;
      } else if (owner[y][x] && owner[y][x][0] === 'r') {
        const me = owner[y][x];
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const o = (owner[y + b] || [])[x + a]; return o && o !== me; })) out[y][x] = lineC;
      }
    }
    return out;
  }
  const mk = () => Array.from({ length: H }, () => Array(W).fill(null));
  function layer(shapes, pal, frame, dy, line) {
    let g = mk(), o = mk();
    raster(shapes, pal, frame, g, o, dy);
    if (line) g = outline(g, o, line);
    return g;
  }
  const over = (grid, top) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (top[y][x]) grid[y][x] = top[y][x]; };

  const cache = {};
  function url(id, skin, acc, frame = 0, expr = 'neutral', pose = '') {
    const key = [id, JSON.stringify(skin || {}), acc || '', frame, expr, pose].join('|');
    if (cache[key]) return cache[key];
    const D = DEFS[id] || DEFS.slime, A = acc && ACC[acc];
    const pal = Object.assign({}, BASE, D.pal, skin || {});
    const ap = A ? Object.assign({}, pal, A.pal) : pal;
    let grid = mk(), owner = mk();
    const arm = pose === 'wave' ? ARM_UP : pose === 'wave2' ? ARM_UP2 : [];
    const armS = arm.map(s => Object.assign({}, s, { c: D.armC || 'body' }));
    if (A && A.back) raster(A.back.map(s => Object.assign({}, s, { c: s.c })), ap, frame, grid, owner);
    raster((D.back || []).concat(D.shapes, armS), pal, frame, grid, owner);
    grid = outline(grid, owner, pal.line);
    if (!D.noFace) raster(buildFace(D.face || {}, expr), pal, frame, grid, owner);
    if (D.front) over(grid, layer(D.front, pal, frame, 0, pal.line));
    if (A && A.front) over(grid, layer(A.front, ap, frame, D.frontDy || 0, A.noFrontLine ? null : pal.line));
    if (A && A.head) over(grid, layer(A.head, ap, frame, D.accDy || 0, A.noLine ? null : pal.line));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x]) { g.fillStyle = grid[y][x]; g.fillRect(x, y, 1, 1); }
    return (cache[key] = c.toDataURL());
  }

  /* ---------- 在畫面上呈現＋隨機小動作 ---------- */
  const reg = [], regIdx = {};
  function html(id, size = 48, cls = '', style = '', skin = null, acc = null, opts = {}) {
    const key = id + '|' + JSON.stringify(skin || {}) + '|' + (acc || '');
    if (regIdx[key] === undefined) { regIdx[key] = reg.length; reg.push([id, skin, acc]); }
    return `<span class="sp pet-sp ${cls}" style="width:${size}px;height:${size}px;${style}" data-panim="${regIdx[key]}" ${opts.still ? 'data-still="1"' : ''}><img class="px" src="${url(id, skin, acc, 0)}" alt=""></span>`;
  }
  const ACTIONS = [
    { n: 'hop', expr: 'happy', cls: 'pa-hop', fx: '♪', dur: 900 },
    { n: 'wave', expr: 'happy', pose: 'wave', dur: 1700, fx: '✦' },
    { n: 'spin', expr: 'wink', cls: 'pa-spin', dur: 800 },
    { n: 'look', expr: 'neutral', cls: 'pa-look', dur: 1800 },
    { n: 'wiggle', expr: 'happy', cls: 'pa-wiggle', dur: 1200, fx: '♪' },
    { n: 'doze', expr: 'sleep', dur: 2600, fx: 'z' },
    { n: 'surprise', expr: 'surprise', cls: 'pa-jump', dur: 900, fx: '!' },
    { n: 'love', expr: 'happy', dur: 1500, fx: '♥' },
    { n: 'wink', expr: 'wink', dur: 1000, fx: '✦' }
  ];
  function emit(el, ch) {
    const i = document.createElement('i');
    i.className = 'pa-fx'; i.textContent = ch;
    i.style.left = (40 + Math.random() * 30) + '%';
    el.appendChild(i); setTimeout(() => i.remove(), 1300);
  }
  /* 讓外部（例如點擊寵物）觸發指定動作 */
  function act(el, name) {
    if (!el) return;
    const sp = el.matches && el.matches('[data-panim]') ? el : el.querySelector('[data-panim]');
    if (!sp) return;
    const a = ACTIONS.find(x => x.n === name) || ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    start(sp, a, Date.now());
  }
  function start(sp, a, now) {
    const st = sp._st || (sp._st = {});
    if (st.act && st.act.cls) sp.classList.remove(st.act.cls);
    st.act = a; st.until = now + a.dur;
    if (a.cls) { sp.classList.remove(a.cls); void sp.offsetWidth; sp.classList.add(a.cls); }
    if (a.fx) { emit(sp, a.fx); if (a.dur > 1200) setTimeout(() => sp.isConnected && emit(sp, a.fx), 600); }
    st.next = st.until + 4000 + Math.random() * 6000;
  }
  setInterval(() => {
    const now = Date.now();
    document.querySelectorAll('[data-panim]').forEach(sp => {
      if (!sp.offsetParent) return;
      const r = reg[+sp.dataset.panim], img = sp.firstElementChild; if (!r || !img) return;
      const st = sp._st || (sp._st = { next: now + 1500 + Math.random() * 5000, blink: now + 1500 + Math.random() * 3000 });
      if (st.act && now > st.until) { if (st.act.cls) sp.classList.remove(st.act.cls); st.act = null; }
      if (!st.act && !sp.dataset.still && now > st.next) start(sp, ACTIONS[Math.floor(Math.random() * ACTIONS.length)], now);
      let expr = 'neutral', pose = '';
      if (st.act) { expr = st.act.expr; if (st.act.pose) pose = (Math.floor(now / 260) % 2) ? 'wave' : 'wave2'; }
      else if (now > st.blink) { if (now > st.blink + 170) st.blink = now + 2200 + Math.random() * 3500; else expr = 'blink'; }
      if (sp.dataset.expr) expr = sp.dataset.expr;
      const frame = Math.floor(now / 520) % 2;
      const k = frame + expr + pose;
      if (sp._k !== k) { sp._k = k; img.src = url(r[0], r[1], r[2], frame, expr, pose); }
    });
  }, 90);
  return { html, url, act, DEFS, ACC, ACTIONS };
})();
SP.pet = PetArt.html;
