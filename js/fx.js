/* 戰鬥視覺：職業武器、隨機攻擊動畫、依深度變化的戰鬥場景 */
const FX = (() => {
  /* ---------------- 武器 ---------------- */
  const WEAPONS = {
    knight: { main: 104, off: 102 },
    mage: { main: 129 },
    ranger: { main: 'bow', bow: true },
    cleric: { main: 130 },
    berserker: { main: 118, big: true }
  };
  /* hd=true：使用 Scale2x 放大後的細緻版圖（造型不變、像素點變小），營地用 */
  const hdImg = (ic, size) => `<span class="sp" style="width:${size}px;height:${size}px"><img class="px" src="${typeof ic === 'string' && ic.startsWith('sk:') ? 'assets/skins/hd/tile_' + ic.slice(3) : 'assets/kenney/hd/' + (typeof ic === 'number' ? 'tile_' + String(ic).padStart(4, '0') : ic)}.png?v=2" alt=""></span>`;
  function weaponHTML(cls, hd, k = 1) {
    const w = WEAPONS[cls] || WEAPONS.knight;
    const ic = (i, s) => hd ? hdImg(i, Math.round(s * k)) : SP.icon(i, s);
    return `${w.off ? `<div class="weapon offhand">${ic(w.off, 34)}</div>` : ''}<div class="weapon main ${w.bow ? 'bow' : ''} ${w.big ? 'big' : ''}" ${hd ? '' : 'id="eWeapon"'}>${ic(w.main, w.big ? 54 : 46)}</div>`;
  }
  function heroHD(tile, cls, size) {
    if (window.HeroAnim && HeroAnim.get(tile)) return '<div class="hero-body hd-hero animated-hero">' + HeroAnim.html(tile, size) + '</div>';
    return `<div class="hero-body anim-bob hd-hero" style="--k:${size / 96}">${hdImg(tile, size)}${weaponHTML(cls, true, size / 96)}</div>`;
  }
  function heroBattle(tile, cls, size=112) {
    if(window.HeroAnim && HeroAnim.get(tile)) return '<div class="hero-body animated-hero">'+HeroAnim.html(tile,size)+'</div>';
    return '<div class="hero-body anim-bob">'+SP.tile(tile,size)+weaponHTML(cls)+'</div>';
  }

  /* ---------------- 共用工具 ---------------- */
  const stage = () => document.getElementById('stage');
  function ent(who) { return document.getElementById(who === 'hero' ? 'eHero' : who === 'mon' ? 'eMon' : 'ePet'); }
  function pos(who) {
    const st = stage(), e = ent(who); if (!st || !e) return { x: 0, y: 0, w: 0, h: 0 };
    const a = st.getBoundingClientRect(), b = e.getBoundingClientRect();
    return { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height * 0.45, w: b.width, h: b.height, top: b.top - a.top, bottom: b.bottom - a.top };
  }
  function add(html, ms = 700) {
    const st = stage(); if (!st) return null;
    const d = U.h(html); st.appendChild(d); setTimeout(() => d.remove(), ms); return d;
  }
  function cls(el, c, ms = 700) {
    if (!el) return;
    el.classList.remove(c); void el.offsetWidth; el.classList.add(c);
    setTimeout(() => el.classList.remove(c), ms);
  }
  const hero = () => ent('hero');
  const weapon = () => document.getElementById('eWeapon');
  function shake(big) { cls(stage(), big ? 'shake-big' : 'shake', 400); }
  function flash(color = '#fff') { add(`<div class="fx flash" style="background:${color}"></div>`, 300); }
  function slash(angle = 0, color = '#fff', size = 90, dx = 0, dy = 0) {
    const m = pos('mon');
    add(`<div class="fx slash" style="left:${m.x - size / 2 + dx}px;top:${m.y - size / 2 + dy}px;width:${size}px;height:${size}px;--r:${angle}deg;border-right-color:${color}"></div>`, 400);
  }
  function vslash(color = '#fff', angle = 0) {
    const m = pos('mon');
    add(`<div class="fx vslash" style="left:${m.x - 4}px;top:${m.top - 10}px;height:${m.h + 20}px;--r:${angle}deg;background:${color};box-shadow:0 0 12px ${color}"></div>`, 350);
  }
  function burst(color = '#ffd84a', size = 90) {
    const m = pos('mon');
    add(`<div class="fx burst" style="left:${m.x - size / 2}px;top:${m.y - size / 2}px;width:${size}px;height:${size}px;border-color:${color}"></div>`, 500);
  }
  function sparks(n = 6, color = '#fff') {
    const m = pos('mon');
    for (let i = 0; i < n; i++) add(`<div class="fx spark" style="left:${m.x}px;top:${m.y}px;background:${color};--dx:${U.rnd(-60, 60)}px;--dy:${U.rnd(-60, 40)}px"></div>`, 600);
  }
  function dust() {
    const h = pos('mon');
    for (let i = 0; i < 8; i++) add(`<div class="fx dust" style="left:${h.x + U.rnd(-30, 30)}px;top:${h.bottom - 10}px;--dx:${U.rnd(-70, 70)}px;--dy:${U.rnd(-40, -10)}px"></div>`, 700);
  }
  /* 投射物：kind 決定外觀；arc=拋物線 */
  function proj(kind, ms = 380, arc = 0, from = 'hero', offY = 0) {
    const a = pos(from), b = pos('mon');
    const sx = from === 'hero' ? a.x + a.w * 0.35 : a.x, sy = a.y - 6 + offY;
    const dx = b.x - sx, dy = b.y - sy;
    const rot = Math.atan2(dy, dx) * 180 / Math.PI;
    add(`<div class="fx proj ${kind} ${arc ? 'arc' : ''}" style="left:${sx}px;top:${sy}px;--dx:${dx}px;--dy:${dy}px;--arc:${-arc}px;--rot:${rot}deg;animation-duration:${ms}ms"></div>`, ms + 60);
    return U.sleep(ms);
  }
  function bolt() {
    const m = pos('mon');
    add(`<div class="fx bolt" style="left:${m.x - 18}px;top:0;height:${m.y + 10}px"></div>`, 420);
    flash('#fff8c0');
  }
  function pillar(color = 'rgba(255,240,150,.95)') {
    const m = pos('mon');
    add(`<div class="fx pillar" style="left:${m.x - 34}px;top:0;height:${m.bottom}px;--c:${color}"></div>`, 700);
  }
  function heroMove(c, ms = 450) {
    const h = hero(), m = pos('mon'), p = pos('hero');
    if (!h) return;
    h.style.setProperty('--jx', (m.x - p.x - 70) + 'px');
    cls(h, c, ms + 50);
  }
  function wpn(c, ms = 450) { cls(weapon(), c, ms + 50); }

  /* ---------------- 各職業攻擊（多種隨機） ---------------- */
  const S = ms => U.sleep(ms);
  const ATTACKS = {
    knight: {
      '突刺斬': async () => { heroMove('atk-dash'); wpn('w-swing'); await S(170); slash(0, '#fff'); sparks(); SFX.play('hit'); },
      '十字斬': async () => { heroMove('atk-dash'); wpn('w-swing'); await S(150); slash(-30, '#cfe3ff'); await S(90); slash(60, '#cfe3ff'); sparks(8, '#cfe3ff'); SFX.play('hit'); },
      '躍擊': async () => { heroMove('atk-jump', 520); wpn('w-overhead', 520); await S(300); vslash('#ffffff'); burst('#cfe3ff'); shake(); SFX.play('crit'); },
      '三連斬': async () => { heroMove('atk-dash', 520); for (const r of [-20, 40, 100]) { wpn('w-swing', 160); await S(110); slash(r, '#fff', 80); SFX.play('hit'); } sparks(); }
    },
    mage: {
      '火球術': async () => { heroMove('atk-cast'); wpn('w-raise'); await S(140); SFX.play('fire'); await proj('fireball', 380); burst('#ff9a3d', 80); sparks(8, '#ffb02a'); },
      '落雷': async () => { heroMove('atk-cast'); wpn('w-raise'); await S(200); bolt(); shake(); SFX.play('crit'); },
      '冰晶連射': async () => { heroMove('atk-cast'); wpn('w-raise', 600); await S(100); for (const o of [-14, 0, 14]) { proj('shard', 300, 0, 'hero', o); SFX.play('click'); await S(90); } await S(220); sparks(8, '#a8f0ff'); },
      '奧術彈': async () => { heroMove('atk-cast'); wpn('w-raise'); await S(160); await proj('orb', 520, 30); burst('#b98bff', 110); SFX.play('crit'); }
    },
    ranger: {
      '疾射': async () => { heroMove('atk-recoil'); wpn('w-pull', 300); await S(150); SFX.play('miss'); await proj('arrow', 240); sparks(5); SFX.play('hit'); },
      '箭雨': async () => { heroMove('atk-recoil'); wpn('w-pull', 300); await S(120); for (let i = 0; i < 3; i++) { proj('arrow', 420, 60 + i * 15, 'hero', -4 + i * 4); await S(80); } await S(300); sparks(8); SFX.play('hit'); },
      '穿透箭': async () => { heroMove('atk-recoil'); wpn('w-pull', 420); await S(260); await proj('arrow pierce', 200); burst('#62d66e', 80); shake(); SFX.play('crit'); },
      '疾風雙射': async () => { heroMove('atk-recoil', 620); await S(120); proj('arrow', 280, 0, 'hero', -12); await S(140); await proj('arrow pierce', 240, 0, 'hero', 10); sparks(8, '#b9f3c0'); SFX.play('hit'); }
    },
    cleric: {
      '聖光柱': async () => { heroMove('atk-cast'); wpn('w-raise'); await S(180); pillar(); SFX.play('heal'); await S(220); sparks(8, '#fff2b0'); },
      '聖錘擊': async () => { heroMove('atk-dash'); wpn('w-overhead'); await S(200); burst('#ffd84a', 100); sparks(8, '#ffd84a'); SFX.play('hit'); },
      '神聖光球': async () => { heroMove('atk-cast'); wpn('w-raise'); await S(150); await proj('holy', 420, 20); burst('#fff2b0', 90); SFX.play('crit'); },
      '星環祝禱': async () => { heroMove('atk-cast', 620); await S(160); proj('holy', 320, 15, 'hero', -12); await S(160); burst('#fff2b0', 75); await S(130); burst('#ffd84a', 120); sparks(12, '#fff2b0'); SFX.play('heal'); }
    },
    berserker: {
      '猛躍重擊': async () => { heroMove('atk-jump', 560); wpn('w-overhead', 560); await S(320); vslash('#ffb0a0'); burst('#ec5454', 110); dust(); shake(true); SFX.play('crit'); },
      '旋風斬': async () => { heroMove('atk-dash', 600); wpn('w-spin', 600); for (let i = 0; i < 3; i++) { await S(110); slash(i * 120, '#ffd0c0', 100); SFX.play('hit'); } },
      '劈砍': async () => { heroMove('atk-dash'); wpn('w-overhead'); await S(200); vslash('#fff', 20); dust(); shake(); SFX.play('hit'); },
      '裂地橫掃': async () => { heroMove('atk-dash', 650); await S(180); slash(80, '#ffa58c', 120); dust(); await S(180); slash(-20, '#ffd0b5', 100); burst('#ec5454', 80); shake(true); SFX.play('hit'); }
    }
  };
  /* 播放攻擊；回傳招式名稱 */
  const attackBags = {};
  function pickAttack(clsId) {
    const names = Object.keys(ATTACKS[clsId] || ATTACKS.knight);
    let bag = attackBags[clsId];
    if (!bag || !bag.length) {
      bag = names.slice();
      for (let i=bag.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [bag[i],bag[j]]=[bag[j],bag[i]]; }
      attackBags[clsId]=bag;
    }
    return bag.pop();
  }
  async function critical(clsId) {
    const colors={knight:'#cfe3ff',mage:'#c7a5ff',ranger:'#a8f0ba',cleric:'#fff2b0',berserker:'#ff917c'};
    const color=colors[clsId]||'#ffcf4a';
    const motion=window.HeroAnim ? HeroAnim.play(hero(),'critical') : Promise.resolve();
    await S(300);
    if(clsId==='knight'){slash(-35,color,130);vslash('#fff',35);}
    else if(clsId==='mage'){bolt();burst(color,155);}
    else if(clsId==='ranger'){await proj('arrow pierce',170);slash(0,color,120);}
    else if(clsId==='cleric'){pillar('rgba(255,240,170,.9)');burst(color,150);}
    else {vslash(color,15);dust();slash(70,'#ffe2bc',150);}
    flash('rgba(255,245,215,.38)');shake(true);burst(color,140);sparks(12,color);SFX.play('crit');
    await motion;
  }
  async function attack(clsId, e) {
    const set = ATTACKS[clsId] || ATTACKS.knight;
    const names = Object.keys(set);
    const name = pickAttack(clsId);
    const motion=window.HeroAnim ? HeroAnim.play(hero(),'attack',names.indexOf(name)) : Promise.resolve();
    await Promise.all([set[name](), motion]);
    if (e && e.crit) await critical(clsId);
    return name;
  }

  /* ---------------- 戰鬥場景 ---------------- */
  const T = id => SP.TILE(id);
  const THEMES = [
    { id: 'dungeon', name: '石磚地牢', floor: 37, wall: 40, ff: 'brightness(.75)', wf: 'brightness(.9)', deco: [[29, 18], [28, 50], [29, 82]], props: [[82, 6], [74, 92]], pt: 'dust', glow: 'rgba(255,170,60,.18)' },
    { id: 'moss', name: '苔蘚洞窟', floor: 24, wall: 57, ff: 'hue-rotate(70deg) saturate(.8) brightness(.7)', wf: 'hue-rotate(80deg) saturate(.6) brightness(.7)', deco: [[20, 30], [20, 70]], props: [['mushroom', 8], ['mushroom', 88], [65, 50]], pt: 'spores', glow: 'rgba(98,214,110,.18)' },
    { id: 'library', name: '古老書庫', floor: 0, wall: 13, ff: 'brightness(.8)', wf: 'brightness(.85)', deco: [], props: [[63, 4], [75, 14], [63, 86], [75, 94], [72, 50]], pt: 'pages', glow: 'rgba(255,207,74,.2)', back: [63, 75, 63, 75, 63, 75, 63, 75] },
    { id: 'ice', name: '冰晶洞窟', floor: 36, wall: 59, ff: 'hue-rotate(170deg) saturate(1.6) brightness(1.05)', wf: 'hue-rotate(170deg) saturate(1.4) brightness(.9)', deco: [[7, 25], [7, 75]], props: [['gem', 8], ['gem', 90], ['gem', 52]], pt: 'snow', glow: 'rgba(168,240,255,.2)' },
    { id: 'lava', name: '熔岩深淵', floor: 1, wall: 40, ff: 'sepia(.5) saturate(2.2) hue-rotate(-20deg) brightness(.5)', wf: 'sepia(1) saturate(3) hue-rotate(-30deg) brightness(.6)', deco: [[19, 35], [19, 65]], props: [[74, 6], [82, 92]], pt: 'embers', glow: 'rgba(255,90,40,.28)', lava: true },
    { id: 'void', name: '虛空王座', floor: 40, wall: 58, ff: 'hue-rotate(230deg) saturate(1.3) brightness(.5)', wf: 'hue-rotate(240deg) saturate(1.5) brightness(.55)', deco: [[29, 50]], props: [[65, 6], [64, 94], [65, 20], [64, 80]], pt: 'stars', glow: 'rgba(185,139,255,.25)' }
  ];
  function themeFor(run) {
    const s = run.s;
    let i;
    if (run.abyss) {
      const r = (s.map && s.map.nodes[s.map.cur]?.r) || 0;
      i = (s.act - 1) * 2 + (r >= 4 || (s.mon && s.mon.boss) ? 1 : 0);
    } else i = Math.min(5, Math.floor((Math.max(1, s.floor) - 1) / 2));
    return THEMES[U.clamp(i, 0, THEMES.length - 1)];
  }
  function stageBG(run) {
    const th = themeFor(run);
    const wallDeco = th.deco.map(([t, x]) => `<img class="px wdeco" src="${T(t)}" style="left:calc(${x}% - 32px);filter:${th.wf}">`).join('');
    const back = (th.back || []).map((t, i) => `<img class="px wdeco" src="${T(t)}" style="left:${i * 12.5 + 1}%;top:22px;width:56px;height:56px;filter:${th.ff}">`).join('');
    const props = th.props.map(([t, x]) => `<div class="prop" style="left:calc(${x}% - 22px)">${SP.icon(t, 44)}</div>`).join('');
    let pts = '';
    for (let i = 0; i < 16; i++) pts += `<i class="pt ${th.pt}" style="left:${U.rnd(0, 100)}%;top:${U.rnd(0, 100)}%;animation-delay:-${U.rnd(0, 60) / 10}s;animation-duration:${U.rnd(40, 90) / 10}s"></i>`;
    return `<div class="bg-floor" style="background-image:url(${T(th.floor)});filter:${th.ff}"></div>
      <div class="bg-wall" style="background-image:url(${T(th.wall)});filter:${th.wf}">${wallDeco}</div>${back}
      <div class="bg-props">${props}</div>
      ${th.lava ? '<div class="bg-lava"></div>' : ''}
      <div class="bg-glow" style="background:radial-gradient(ellipse at 50% 30%, ${th.glow}, transparent 70%)"></div>
      <div class="bg-pts">${pts}</div>
      <div class="theme-name">${th.name}</div>`;
  }

  /* ---------------- 怪物攻擊演出：style 見 monsters.js（預設近身衝撞） ---------------- */
  function monProj(kind, ms = 360, arc = 0, offY = 0) {
    const a = pos('mon'), b = pos('hero');
    const dx = b.x - a.x, dy = b.y - a.y - offY, rot = Math.atan2(dy, dx) * 180 / Math.PI;
    add(`<div class="fx proj ${kind} ${arc ? 'arc' : ''}" style="left:${a.x}px;top:${a.y + offY}px;--dx:${dx}px;--dy:${dy}px;--arc:${-arc}px;--rot:${rot}deg;animation-duration:${ms}ms"></div>`, ms + 60);
    return S(ms);
  }
  async function monStrike(style) {
    const m = ent('mon'), caster = () => { cls(m, 'anim-pop', 320); return S(160); };
    switch (style) {
      case 'orb': await caster(); await monProj('orb', 340); break;
      case 'fire': await caster(); await monProj('fireball', 340, 24); break;
      case 'ink': await caster(); await monProj('ink', 380, 36); break;
      case 'frost': await caster(); await monProj('shard', 320); break;
      case 'spore': await caster(); [0, 1, 2].forEach(i => setTimeout(() => monProj('spore', 420, 18 + i * 14, i * 8 - 8), i * 70)); await S(520); break;
      case 'needle': await caster(); [0, 1, 2].forEach(i => setTimeout(() => monProj('needle', 300, 0, i * 12 - 12), i * 60)); await S(400); break;
      case 'swarm': await caster(); [0, 1, 2, 3].forEach(i => setTimeout(() => monProj('sting', 380, 10 + i * 8, i * 10 - 15), i * 60)); await S(520); break;
      case 'zap': {
        await caster(); const h = pos('hero');
        add(`<div class="fx bolt" style="left:${h.x - 18}px;top:0;height:${h.y + 10}px"></div>`, 420); flash('rgba(255,248,192,.45)'); await S(240); break;
      }
      case 'slam': {
        cls(m, 'anim-lunge-l', 400); await S(170); const h = pos('hero');
        for (let i = 0; i < 8; i++) add(`<div class="fx dust" style="left:${h.x + U.rnd(-30, 30)}px;top:${h.bottom - 10}px;--dx:${U.rnd(-70, 70)}px;--dy:${U.rnd(-40, -10)}px"></div>`, 700);
        shake(); break;
      }
      default: cls(m, 'anim-lunge-l', 400); await S(160);
    }
  }

  return { weaponHTML, heroHD, heroBattle, attack, critical, pickAttack, monStrike, stageBG, themeFor, THEMES, ATTACKS };
})();
