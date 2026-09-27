/* 營地互動擴充：好感度、餵零食、丟球、拍照、釣魚、花盆、信箱、蝴蝶／螢火蟲、流星許願、月兔、天氣、祕密口令；
 * 以及「成就與收藏」畫面。由 Screens.hub() 在營地畫好後呼叫 CampFun.init(ctx)。
 * 紀錄存在 xd_profile.camp；每日次數存在 xd_profile.daily（每天自動重置）。 */
const CampFun = (() => {
  /* ---------- 魚類（rare：傳說魚，night：只在夜晚上鉤） ---------- */
  const FISH = [
    { id: 'crucian', name: '小鯽魚', w: 40, gem: 1, icon: 'fish', filter: 'hue-rotate(170deg) saturate(.5) brightness(1.1)', desc: '池塘裡最常見的魚。' },
    { id: 'rainbow', name: '彩虹魚', w: 18, gem: 2, icon: 'fish', filter: 'hue-rotate(250deg) saturate(2.2)', desc: '鱗片會隨光線變色。' },
    { id: 'puffer', name: '河豚', w: 13, gem: 2, icon: 'fish', filter: 'sepia(.9) saturate(2.5) brightness(1.1)', desc: '一緊張就鼓起來。' },
    { id: 'koi', name: '紅白錦鯉', w: 10, gem: 3, icon: 'fish', filter: 'hue-rotate(150deg) saturate(3)', desc: '據說能帶來好運。' },
    { id: 'crab', name: '小螃蟹', w: 8, gem: 2, icon: 'crab2', filter: '', desc: '橫著走，夾到會痛。' },
    { id: 'boot', name: '舊靴子', w: 8, gem: 0, icon: 'boot', filter: '', desc: '……是誰丟在池塘裡的？' },
    { id: 'yuzufish', name: '金柚子魚', w: 2.5, gem: 10, icon: 'fish', filter: 'sepia(1) saturate(6) brightness(1.25)', rare: true, desc: '帶著淡淡柚子香的金色魚。' },
    { id: 'koiking', name: '錦鯉王', w: 2, gem: 25, icon: 'fish', filter: 'hue-rotate(140deg) saturate(4) drop-shadow(0 0 2px #ffd84a)', rare: true, night: true, desc: '只在夜晚出沒的傳說之魚，釣到的考生必定金榜題名。' }
  ];
  const LOVE_LV = [0, 10, 30, 60, 100, 160];
  const LOVE_NAME = ['初次見面', '熟悉', '好朋友', '親密夥伴', '心意相通', '心有靈犀'];

  /* ---------- 營地小圖（12×12） ---------- */
  const potBase = ['...kNNNNk...', '..kkkkkkkk..', '..kOooooOk..', '...kOooOk...', '...kkkkkk...'];
  const E = '............';
  const POT = [
    [E, E, E, E, E, E, '.....gg.....'],
    [E, E, E, E, '......g.....', '....g.g.....', '.....gg.....'],
    [E, E, '......g.....', '....gg.g....', '.....g.gg...', '....gGg.....', '.....gG.....'],
    [E, '.....pp.....', '.....Pp.....', '....gGg.g...', '...gg.Ggg...', '.....gG.....', '.....gG.....'],
    ['....pppp....', '...ppyypp...', '...ppyypp...', '....pppp....', '..gg.G.gg...', '...gggG.g...', '.....gG.....']
  ];
  POT.forEach((top, i) => { SP.MAPS['pot' + i] = [top.concat(potBase)]; });
  SP.MAPS.bfly = [
    [E, E, '.kk......kk.', 'kppk.kk.kppk', 'kpPpkkkkpPpk', 'kppppkkppppk', '.kpppkkpppk.', '..kppkkppk..', '...kk..kk...', E, E, E],
    [E, E, E, '....k..k....', '...kpkkpk...', '...kPkkPk...', '...kpkkpk...', '....kkkk....', E, E, E, E]
  ];

  /* 池塘：程式產生的像素圖 */
  let pondCache = null;
  function pondURL() {
    if (pondCache) return pondCache;
    const W = 48, H = 14, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x + 0.5 - W / 2) / (W / 2), dy = (y + 0.5 - H / 2) / (H / 2), d = dx * dx + dy * dy;
      if (d > 1) continue;
      let col = d > 0.78 ? '#6a8f4a' : d > 0.6 ? '#3a86b8' : '#4fa8d8';
      if (d <= 0.6 && ((x + y * 3) % 17 === 0)) col = '#bfe8ff';
      if (d <= 0.6 && y < H / 2 - 2 && x > W * 0.2 && x < W * 0.4 && y === 4) col = '#8fd0f0';
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    }
    // 岸邊小草與石頭
    [[3, 5, '#5fb84f'], [4, 4, '#7fd06a'], [44, 5, '#5fb84f'], [43, 4, '#7fd06a'], [8, 11, '#c9c2b6'], [9, 11, '#b0a898'], [38, 11, '#c9c2b6']].forEach(([x, y, col]) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); });
    return (pondCache = c.toDataURL());
  }

  const P = () => Store.profile;
  function camp() {
    const p = P(); p.camp = p.camp || {};
    const c = p.camp;
    c.fish = c.fish || {}; c.love = c.love || {}; c.pot = c.pot || { st: 0, day: '', col: 0 };
    c.bugs = c.bugs || 0; c.bloom = c.bloom || 0; c.photos = c.photos || 0;
    return c;
  }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const loveLv = v => { let l = 0; LOVE_LV.forEach((t, i) => { if (v >= t) l = i; }); return l; };
  function loveOf(id) { return camp().love[id] || 0; }

  let X = null; // 目前營地的 context
  function alive() { return X && X.scene && document.body.contains(X.scene); }

  /* 好感度：key/cap 是每日上限 */
  function addLove(n, key, cap) {
    const id = X.petId; if (!id) return false;
    const D = X.D;
    if (key) { D[key] = D[key] || 0; if (D[key] >= cap) return false; D[key]++; }
    const c = camp(), before = loveLv(c.love[id] || 0);
    c.love[id] = Math.min(LOVE_LV[5], (c.love[id] || 0) + n);
    const after = loveLv(c.love[id]);
    Store.saveProfile();
    if (after > before) {
      SFX.play('level');
      U.toast(`💗 和${X.name}的好感度提升到「${LOVE_NAME[after]}」！`);
      X.hearts(X.petEl, 8);
      if (after >= 5) { C.unlockAcc('heartclip'); Ach.unlock('petlove'); }
    }
    renderBar();
    return true;
  }

  function movePet(pct, cb) {
    const el = X.petEl; if (!el) return;
    const cur = parseFloat(el.style.left) || 55;
    el.classList.remove('sleepy');
    el.classList.toggle('flip', pct < cur);
    el.style.left = pct + '%';
    const t = Math.abs(pct - cur) < 1 ? 50 : 1650;
    setTimeout(() => alive() && cb && cb(), t);
  }

  /* ---------- 互動 ---------- */
  function feed() {
    if (!X.petEl) return;
    if ((X.D.feed || 0) >= 3) { X.bubble(X.petEl, `${X.name}：肚子已經好飽了～明天再餵我吧！`); return; }
    X.D.feed = (X.D.feed || 0) + 1;
    const snack = U.pick(['🍪', '🍓', '🧀', '🍙', '🥕', '🍡', '🐟']);
    SFX.play('pet');
    X.hearts(X.petEl, 1, snack);
    PetArt.act(X.petEl, 'love');
    setTimeout(() => { if (!alive()) return; X.hearts(X.petEl, 5); X.bubble(X.petEl, U.pick([`${X.name}吃得津津有味！`, `${X.name}：好好吃～♪`, `${X.name}開心地舔舔嘴巴。`, `${X.name}還想再吃一口…`])); }, 600);
    const ups = Store.petXp(4);
    if (ups) U.toast(`${X.name} 升級了！`);
    addLove(3);
    renderBar();
  }
  function ball() {
    if (!X.petEl || X.petEl.dataset.busy) return;
    X.petEl.dataset.busy = '1';
    const target = U.rnd(42, 68);
    const heroX = 24;
    const b = U.h(`<div class="camp-ball" style="left:${heroX + 4}%"><i></i></div>`);
    X.scene.appendChild(b);
    SFX.play('click');
    X.heroEl.classList.remove('hop'); void X.heroEl.offsetWidth; X.heroEl.classList.add('hop');
    requestAnimationFrame(() => { b.style.left = target + '%'; b.classList.add('fly'); });
    PetArt.act(X.petEl, 'surprise');
    setTimeout(() => {
      if (!alive()) return;
      movePet(target - 2, () => {
        b.remove(); SFX.play('pet'); PetArt.act(X.petEl, 'hop');
        X.bubble(X.petEl, U.pick(['撿到了！', `${X.name}叼著球跑回來～`, '再丟一次！再丟一次！']));
        movePet(heroX + 11, () => { X.hearts(X.petEl, 4); delete X.petEl.dataset.busy; });
      });
    }, 900);
    addLove(2, 'ballN', 5);
  }
  function photo() {
    if (!X.petId) return;
    const p = P(), id = X.petId;
    const expr = U.pick(['happy', 'wink', 'neutral', 'surprise']);
    const pose = U.chance(0.4) ? 'wave' : '';
    const sk = p.petSkin[id] && (C.PET_SKINS[id] || []).find(x => x.id === p.petSkin[id]);
    const src = PetArt.url(id, sk ? sk.pal : null, p.petAcc[id] || null, 0, expr, pose);
    const bg = U.pick(['#ffe3ec', '#e3f4ff', '#fff4d6', '#e8ffe3', '#efe6ff']);
    const d = new Date(), date = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    SFX.play('open');
    const flash = U.h('<div class="camp-flash"></div>'); X.scene.appendChild(flash); setTimeout(() => flash.remove(), 400);
    camp().photos++; Store.saveProfile();
    addLove(1, 'photoN', 3);
    const m = U.modal({ title: '📷 拍立得', narrow: true, body: `<div class="polaroid"><div class="pol-img" style="background:${bg}"><img class="px" src="${src}" alt=""></div>
      <div class="pol-cap">${U.esc(X.name)}・${date}</div></div><p class="small-t dim center">第 ${camp().photos} 張照片</p>`,
      buttons: [{ label: '存成圖片', cls: 'gold', close: false, onClick: () => save() }, { label: '關閉' }] });
    function save() {
      const c = document.createElement('canvas'); c.width = 300; c.height = 360;
      const g = c.getContext('2d');
      g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 300, 360);
      g.fillStyle = bg; g.fillRect(20, 20, 260, 260);
      const img = new Image();
      img.onload = () => {
        g.imageSmoothingEnabled = false; g.drawImage(img, 30, 30, 240, 240);
        g.fillStyle = '#4a2f45'; g.font = '22px Cubic11, sans-serif'; g.textAlign = 'center';
        g.fillText(`${X.name}・${date}`, 150, 322);
        const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `${X.name}_${date.replace(/\//g, '-')}.png`; a.click();
      };
      img.src = src;
    }
    return m;
  }

  /* ---- 釣魚 ---- */
  let fishing = null;
  function pickFish() {
    const night = X.tod === 'night';
    const list = FISH.filter(f => !f.night || night);
    let x = Math.random() * list.reduce((a, f) => a + f.w, 0);
    for (const f of list) { if ((x -= f.w) < 0) return f; }
    return list[0];
  }
  function fish() {
    const pond = U.$('#cPond', X.scene); if (!pond) return;
    if (fishing) {
      if (fishing.state === 'bite') return catchFish();
      clearTimeout(fishing.t); fishing.bob.remove(); fishing = null;
      X.bubble(pond, '太早拉竿了，魚被嚇跑了……'); SFX.play('miss'); return;
    }
    const bob = U.h(`<i class="bobber" style="left:${U.rnd(30, 65)}%"></i>`);
    pond.appendChild(bob); SFX.play('click');
    fishing = { state: 'wait', bob };
    X.bubble(pond, U.pick(['拋竿！靜靜等待……', '（浮標在水面輕輕晃動）', '要耐心喔……']), 1500);
    fishing.t = setTimeout(() => {
      if (!alive() || !fishing) return;
      const f = pickFish();
      fishing.state = 'bite'; fishing.f = f; bob.classList.add('bite');
      SFX.play('tick'); X.bubble(pond, '❗ 上鉤了！快點池塘！', 900);
      fishing.t = setTimeout(() => {
        if (!fishing) return;
        bob.remove(); fishing = null;
        alive() && X.bubble(pond, '啊……魚跑掉了。');
      }, f.rare ? 650 : 950);
    }, U.rnd(1500, 4200));
  }
  function catchFish() {
    const { f, bob, t } = fishing; clearTimeout(t); bob.remove(); fishing = null;
    const c = camp(), first = !c.fish[f.id];
    c.fish[f.id] = (c.fish[f.id] || 0) + 1;
    const D = X.D; D.fish = (D.fish || 0) + 1;
    let gem = 0;
    if (D.fish <= 5 && f.gem) { gem = f.gem; P().gems += gem; P().stats.gemsEarned += gem; }
    Store.saveProfile(); App.refreshTop();
    SFX.play(f.rare ? 'win' : 'coin');
    const pond = U.$('#cPond', X.scene);
    const pop = U.h(`<div class="fish-pop">${SP.icon(f.icon, 40, '', f.filter ? `filter:${f.filter}` : '')}</div>`);
    pond.appendChild(pop); setTimeout(() => pop.remove(), 1500);
    X.bubble(pond, `${f.rare ? '🌟 傳說！' : ''}釣到了「${f.name}」${first ? '（新紀錄！）' : ''}${gem ? `　魂晶 +${gem}` : D.fish > 5 && f.gem ? '（今天的魂晶獎勵已領完）' : ''}`, 3000);
    if (f.rare) U.toast(`🌟 釣到了傳說中的「${f.name}」！`);
    if (X.petEl && U.chance(0.5)) { PetArt.act(X.petEl, 'surprise'); setTimeout(() => alive() && X.bubble(X.petEl, f.id === 'boot' ? `${X.name}：……靴子？` : `${X.name}盯著魚流口水……`), 1600); }
    Ach.check();
  }

  /* ---- 花盆 ---- */
  function pot() {
    const c = camp(), el = U.$('#cPot', X.scene), t = today();
    if (c.pot.st >= 4) {
      c.pot = { st: 0, day: '', col: (c.pot.col + 1) % 6 }; Store.saveProfile();
      SFX.play('coin'); X.hearts(el, 5, '✿'); X.bubble(el, '把花剪下來插在帳篷裡了。再種一顆新的種子吧！');
      drawPot(); return;
    }
    if (c.pot.day === t) { X.bubble(el, U.pick(['今天已經澆過水了，明天再來吧！', '（土壤濕濕的）', '慢慢長大中……'])); return; }
    c.pot.day = t; c.pot.st++;
    SFX.play('heal');
    const w = U.h('<div class="water-fx"><i></i><i></i><i></i></div>'); el.appendChild(w); setTimeout(() => w.remove(), 900);
    if (c.pot.st >= 4) {
      c.bloom++; P().gems += 15; P().stats.gemsEarned += 15; App.refreshTop();
      setTimeout(() => { if (!alive()) return; X.hearts(el, 8, '✿'); X.bubble(el, '🌷 開花了！好漂亮～（魂晶 +15）', 3000); }, 500);
      Ach.unlock('flower');
    } else X.bubble(el, ['', '冒出小芽了！', '長出葉子了！', '結了一個花苞！'][c.pot.st] + '（每天澆一次水）');
    Store.saveProfile();
    setTimeout(drawPot, 450);
  }
  function drawPot() {
    const el = U.$('#cPot', X.scene); if (!el) return;
    const c = camp();
    el.innerHTML = `<div class="shadow"></div>${SP.pix('pot' + c.pot.st, 48, '', c.pot.st >= 3 ? `filter:hue-rotate(${c.pot.col * 60}deg)` : '')}`;
  }

  /* ---- 信箱 ---- */
  function letters() {
    const n = X.name || '夥伴';
    return [
      `${n}：今天也要記得喝水喔！讀累了就摸摸我～`,
      `${n}：錯題本的題目連續答對兩次就會「畢業」，我們一起讓它們全部畢業吧！`,
      `${n}：昨天夢到你考上理想的學校了！我在旁邊開心地轉圈圈。`,
      '勇者公會快報：深淵中出現「黃金史萊姆」的目擊情報，牠只待 5 題就會逃走，發現請全力攻擊！',
      `${n}：數學卡住的時候先跳下一題，回頭再看常常就懂了。`,
      `${n}：英文閱讀可以先看題目再看文章，比較快找到答案喔！`,
      '一張皺皺的紙條：「深夜的深淵裡，好像有人在賣咖啡……」',
      `${n}：我在池塘看到一條金色的魚！聽說晚上還有更厲害的……`,
      `${n}：花盆要每天澆水才會長大，我會幫你盯著的！`,
      '營地管理員：夜晚的月亮很漂亮，多看幾眼說不定會有驚喜。',
      `${n}：國文文意題，先找「關鍵句」和「轉折詞」就對了！`,
      `${n}：社會科的圖表題，先看標題和單位，再看數字怎麼變化。`,
      `${n}：自然計算題記得檢查單位！我最喜歡你認真的樣子了。`,
      '來自未來的你：「謝謝現在努力的你。」',
      '神秘學者的來信：「深淵三章若能保持八成以上的命中率……裂縫就會為你打開。」',
      `${n}：貓咪們說，牠們偶爾會在深淵裡開茶會喔。`
    ];
  }
  function mail() {
    const el = U.$('#cMail', X.scene), D = X.D;
    SFX.play('open');
    if (D.mail) { X.bubble(el, '今天的信已經讀過囉，明天再來看看！'); return; }
    D.mail = 1; P().gems += 2; P().stats.gemsEarned += 2; Store.saveProfile(); App.refreshTop();
    el.classList.add('read');
    const L = letters(), idx = (new Date().getDate() + Object.keys(camp().fish).length) % L.length;
    U.modal({ title: '✉ 今天的信', narrow: true, body: `<div class="letter">${U.esc(L[idx])}</div><p class="small-t dim center">信封裡還夾著 2 顆魂晶。</p>`, buttons: [{ label: '收好', cls: 'gold' }] });
  }

  /* ---- 蝴蝶／螢火蟲 ---- */
  function spawnBug() {
    if (!alive()) return;
    const night = X.tod === 'night';
    const b = U.h(night ? `<i class="firefly" style="left:${U.rnd(5, 90)}%;top:${U.rnd(25, 70)}%;animation-duration:${U.rnd(5, 9)}s"></i>`
      : `<div class="bfly" style="top:${U.rnd(20, 55)}%;animation-duration:${U.rnd(12, 20)}s;filter:hue-rotate(${U.rnd(0, 5) * 60}deg)">${SP.pix('bfly', 22)}</div>`);
    b.onclick = e => {
      e.stopPropagation(); if (b.classList.contains('caught')) return;
      b.classList.add('caught'); SFX.play('coin');
      const c = camp(); c.bugs++; Store.saveProfile();
      X.hearts(b, 3, '✦');
      if (c.bugs % 10 === 0) U.toast(`已經抓到 ${c.bugs} 隻${night ? '螢火蟲' : '蝴蝶'}了！`);
      Ach.check();
      setTimeout(() => b.remove(), 500); setTimeout(spawnBug, U.rnd(6000, 12000));
    };
    X.scene.appendChild(b);
  }

  /* ---- 流星與月兔（夜晚） ---- */
  function shootingStar() {
    if (!alive()) return;
    if (U.chance(0.45)) {
      const s = U.h(`<i class="shoot" style="left:${U.rnd(15, 65)}%;top:${U.rnd(4, 26)}%"></i>`);
      s.onclick = e => {
        e.stopPropagation(); s.remove(); SFX.play('win');
        X.hearts(X.petEl || X.heroEl, 6, '★');
        if (!X.D.wish) { X.D.wish = 1; P().gems += 5; P().stats.gemsEarned += 5; Store.saveProfile(); App.refreshTop(); U.toast('🌠 抓住流星許了願！魂晶 +5'); }
        else U.toast('🌠 又許了一個願望！');
        X.bubble(X.petEl || X.heroEl, U.pick(['你許了什麼願望呢？', '希望考試順利！', '願望一定會實現的！']));
        Ach.unlock('wish');
      };
      X.scene.querySelector('.sky').appendChild(s); setTimeout(() => s.remove(), 1600);
    }
    X.starT = setTimeout(shootingStar, U.rnd(9000, 18000));
  }
  function moon() {
    const cel = X.scene.querySelector('.celestial'); if (!cel) return;
    const rabbitOn = () => { if (!cel.querySelector('.moon-rabbit')) cel.appendChild(U.h(`<span class="moon-rabbit">${SP.pix('rabbit', 18)}</span>`)); };
    if (Ach.has('moon')) rabbitOn();
    let n = 0;
    cel.onclick = e => {
      e.stopPropagation(); n++;
      cel.classList.remove('wob'); void cel.offsetWidth; cel.classList.add('wob');
      SFX.play('click');
      if (n === 3) X.bubble(X.heroEl, '月亮好像動了一下？');
      if (n >= 7 && !Ach.has('moon')) {
        rabbitOn(); SFX.play('win');
        X.bubble(X.heroEl, '月亮上……有一隻兔子在搗麻糬！', 3500);
        Ach.unlock('moon'); C.unlockAcc('moonears');
      } else if (n >= 7) X.bubble(X.heroEl, '月兔向你揮揮手～');
    };
  }

  /* ---- 天氣：開著雨聲白噪音時營地會下雨；早晨偶爾飄花瓣 ---- */
  function weather() {
    const act = AMB.active();
    const old = X.scene.querySelector('.weather'); if (old) old.remove();
    let cls = '';
    if (act.includes('rain')) cls = 'rain';
    else if (X.snow) cls = 'snow';
    else if (X.tod === 'morning' && U.chance(0.3)) cls = 'petal';
    if (!cls) return;
    let inner = '';
    const n = cls === 'rain' ? 40 : 18;
    for (let i = 0; i < n; i++) inner += `<i style="left:${U.rnd(0, 100)}%;animation-delay:-${U.rnd(0, 40) / 10}s;animation-duration:${cls === 'rain' ? U.rnd(5, 9) / 10 : U.rnd(40, 80) / 10}s"></i>`;
    X.scene.appendChild(U.h(`<div class="weather ${cls}">${inner}</div>`));
  }

  /* ---- 祕密口令（在營地直接打字） ---- */
  let typed = '';
  function onKey(e) {
    if (!alive()) { document.removeEventListener('keydown', onKey); return; }
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (!/^[a-z]$/i.test(e.key)) return;
    typed = (typed + e.key.toLowerCase()).slice(-8);
    const hit = w => typed.endsWith(w) && (typed = '', true);
    if (hit('meow') && X.petEl) { SFX.play('pet'); PetArt.act(X.petEl, 'spin'); X.bubble(X.petEl, U.pick(['喵？', '喵喵喵！', `${X.name}歪著頭看你。`])); }
    else if (hit('love')) { for (let i = 0; i < 3; i++) setTimeout(() => alive() && X.hearts(X.scene.querySelector('.camp-obj.camp-pet') || X.heroEl, 6), i * 300); addLove(2, 'loveCode', 1); }
    else if (hit('snow')) { X.snow = !X.snow; weather(); SFX.play('click'); }
    else if (hit('yuzu')) X.bubble(X.heroEl, '（聽說深淵的某處，長著一棵柚子樹……）', 3200);
  }

  /* ---- 操作列 ---- */
  function renderBar() {
    if (!X || !X.bar) return;
    const D = X.D, v = X.petId ? loveOf(X.petId) : 0, lv = loveLv(v);
    const next = LOVE_LV[Math.min(5, lv + 1)];
    X.bar.innerHTML = `
      ${X.petId ? `<span class="love" title="好感度 ${v}/${LOVE_LV[5]}：摸摸、餵零食、丟球、拍照都會增加">${[1, 2, 3, 4, 5].map(i => `<b class="${i <= lv ? 'on' : ''}">♥</b>`).join('')}<small>${LOVE_NAME[lv]}${lv < 5 ? `（${v}/${next}）` : ''}</small></span>` : ''}
      <button class="px-btn small" data-ca="pat">🤚 摸摸</button>
      <button class="px-btn small" data-ca="feed">🍪 餵零食 ${Math.max(0, 3 - (D.feed || 0))}/3</button>
      <button class="px-btn small" data-ca="ball">⚾ 丟球</button>
      <button class="px-btn small" data-ca="photo">📷 拍照</button>
      <button class="px-btn small" data-ca="fish">🎣 釣魚</button>
      <button class="px-btn small" data-ca="pomo">🍅 番茄鐘</button>
      <button class="px-btn small" data-ca="ach">🏅 成就與收藏</button>`;
    U.$$('[data-ca]', X.bar).forEach(b => b.onclick = () => {
      const a = b.dataset.ca;
      if (!X.petEl && ['pat', 'feed', 'ball', 'photo'].includes(a)) return;
      if (a === 'pat') X.petEl.click();
      else if (a === 'feed') feed();
      else if (a === 'ball') ball();
      else if (a === 'photo') photo();
      else if (a === 'fish') fish();
      else if (a === 'ach') App.go('ach');
      else if (a === 'pomo') App.go('pomo', 'timer');
    });
  }

  /* ---------- 初始化 ---------- */
  function init(ctx) {
    X = ctx; fishing = null; clearTimeout(X.starT);
    X.petId = Store.profile.activePet; X.name = X.petId ? Store.petName(X.petId) : '';
    const sc = X.scene;
    sc.insertAdjacentHTML('beforeend', `
      <div class="camp-obj camp-mail ${X.D.mail ? 'read' : ''}" id="cMail" title="信箱：每天一封信">${SP.pix('mailbox', 40)}<i class="flag-dot"></i></div>
      <div class="camp-obj camp-pot" id="cPot" title="花盆：每天澆一次水"></div>
      <div class="camp-obj camp-pond" id="cPond" title="池塘：點一下拋竿，上鉤時再點一下"><img class="px" src="${pondURL()}" alt=""></div>`);
    drawPot();
    U.$('#cMail', sc).onclick = e => { e.stopPropagation(); mail(); };
    U.$('#cPot', sc).onclick = e => { e.stopPropagation(); pot(); };
    U.$('#cPond', sc).onclick = e => { e.stopPropagation(); fish(); };
    // 摸摸也會增加好感
    if (X.petEl) X.petEl.addEventListener('click', () => addLove(1, 'patN', 15));
    // 點地面：夥伴跑過去
    sc.addEventListener('click', e => {
      if (!X.petEl || X.petEl.dataset.busy || e.target.closest('.camp-obj,.bfly,.firefly,.shoot,.celestial')) return;
      const r = sc.getBoundingClientRect(), pct = Math.max(36, Math.min(70, (e.clientX - r.left) / r.width * 100 - 3));
      X.petEl.dataset.busy = '1';
      movePet(pct, () => { PetArt.act(X.petEl, 'hop'); delete X.petEl.dataset.busy; });
    });
    // 篝火連點三下：烤棉花糖
    let fc = [];
    X.fireEl.addEventListener('click', () => {
      const now = Date.now(); fc = fc.filter(t => now - t < 1800); fc.push(now);
      if (fc.length >= 3) {
        fc = [];
        if (X.D.mallow) { X.bubble(X.fireEl, '今天的棉花糖已經吃完了～'); return; }
        X.D.mallow = 1; X.hearts(X.fireEl, 1, '🍡');
        X.bubble(X.fireEl, `烤了一串金黃的棉花糖${X.petEl ? `，分給${X.name}一半！` : '！'}`, 3000);
        if (X.petEl) { PetArt.act(X.petEl, 'love'); addLove(3); }
        Store.saveProfile();
      }
    });
    for (let i = 0; i < (X.tod === 'night' ? 5 : 2); i++) setTimeout(spawnBug, i * 700);
    if (X.tod === 'night') { X.starT = setTimeout(shootingStar, 4000); moon(); }
    weather();
    document.removeEventListener('keydown', onKey); document.addEventListener('keydown', onKey);
    renderBar();
    Ach.check();
  }
  /* 營地閒晃時的額外小互動（由營地計時器呼叫） */
  function tick() {
    if (!alive() || !X.petEl || X.petEl.dataset.busy) return false;
    const lv = loveLv(loveOf(X.petId));
    if (lv >= 2 && U.chance(0.12)) {
      X.petEl.dataset.busy = '1';
      movePet(36, () => { X.hearts(X.petEl, 3); X.bubble(X.petEl, U.pick([`${X.name}跑來蹭蹭勇者～`, `${X.name}和勇者擊掌！`, `${X.name}靠在勇者腳邊打盹。`])); PetArt.act(X.petEl, 'love'); delete X.petEl.dataset.busy; });
      return true;
    }
    if (U.chance(0.08)) { X.petEl.dataset.busy = '1'; movePet(66, () => { X.bubble(X.petEl, `${X.name}盯著池塘裡的魚看……`); PetArt.act(X.petEl, 'look'); delete X.petEl.dataset.busy; }); return true; }
    return false;
  }

  /* ---------- 成就與收藏畫面 ---------- */
  function achScreen() {
    const p = P(), c = camp(), A = p.ach || {};
    const got = C.ACH.filter(a => A[a.id]).length;
    const fishGot = FISH.filter(f => c.fish[f.id]).length;
    const hiddenAcc = C.PET_ACCS.filter(a => a.hidden);
    const petsLove = Object.keys(p.pets).map(id => ({ id, v: c.love[id] || 0 }));
    U.$('#screen').innerHTML = `<div class="panel"><h2>成就與收藏</h2>
      <p class="dim small-t">解鎖成就會獲得魂晶。帶「？？？」的是<b class="gold-t">隱藏成就</b>，條件是秘密——多探索深淵和營地吧！（${got}/${C.ACH.length}）</p>
      <div class="grid g2">${C.ACH.map(a => {
        const on = A[a.id], hid = a.hidden && !on;
        return `<div class="panel dark ach ${on ? 'on' : ''}"><div class="row">${SP.icon(hid ? 'question' : a.icon, 40, '', on ? '' : 'filter:grayscale(1) opacity(.55)')}
          <div class="grow"><b class="${on ? 'gold-t' : ''}">${hid ? '？？？' : a.name}</b> ${a.hidden ? '<span class="tag">隱藏</span>' : ''}<div class="small-t">${hid ? '隱藏成就：達成條件是個秘密' : a.desc}</div>
          <div class="small-t ${on ? 'green-t' : 'purple-t'}">${on ? `✔ ${new Date(on).toLocaleDateString()} 達成` : `魂晶 +${a.gem}`}</div></div></div></div>`;
      }).join('')}</div>
      <h3 class="mt">🎣 魚類圖鑑（${fishGot}/${FISH.length}）</h3>
      <p class="dim small-t">在營地的池塘釣魚：點池塘拋竿，浮標出現「❗」時再點一下。每天前 5 條魚有魂晶獎勵。</p>
      <div class="grid g3">${FISH.map(f => { const n = c.fish[f.id]; return `<div class="panel dark"><div class="row">${SP.icon(f.icon, 40, '', n ? (f.filter ? `filter:${f.filter}` : '') : 'filter:brightness(0) opacity(.45)')}
        <div class="grow"><b>${n ? f.name : '？？？'}</b>${f.rare ? ' <span class="tag ng">傳說</span>' : ''}<div class="small-t">${n ? `${f.desc}（釣到 ${n} 次）` : f.night ? '好像只在夜晚出現……' : '還沒釣到'}</div></div></div></div>`; }).join('')}</div>
      <h3 class="mt">🎀 隱藏配件</h3>
      <div class="grid g2">${hiddenAcc.map(a => { const own = p.ownedAcc.includes(a.id); return `<div class="panel dark"><div class="row">${p.activePet ? Store.petHTML(p.activePet, 48, '', own ? '' : 'filter:brightness(0) opacity(.4)', undefined, a.id) : ''}
        <div class="grow"><b>${own ? a.name : '？？？'}</b><div class="small-t">${own ? '已解鎖，可以在寵物小屋的衣櫃穿戴' : '提示：' + a.how}</div></div></div></div>`; }).join('')}</div>
      <h3 class="mt">🏕 營地紀錄</h3>
      <div class="stat-line"><span>釣到的魚</span><b>${Object.values(c.fish).reduce((a, b) => a + b, 0)} 條</b></div>
      <div class="stat-line"><span>抓到的蝴蝶／螢火蟲</span><b>${c.bugs} 隻</b></div>
      <div class="stat-line"><span>花盆開花</span><b>${c.bloom} 次</b></div>
      <div class="stat-line"><span>拍立得照片</span><b>${c.photos} 張</b></div>
      ${petsLove.map(x => `<div class="stat-line"><span>和${U.esc(Store.petName(x.id))}的好感度</span><b class="red-t">${'♥'.repeat(loveLv(x.v))}${'♡'.repeat(5 - loveLv(x.v))} ${LOVE_NAME[loveLv(x.v)]}</b></div>`).join('')}
      <details class="small-t dim mt"><summary style="cursor:pointer">營地小祕密（點開看提示）</summary>
        <p>・連點篝火三下會烤棉花糖。・點地面，夥伴會跑過去。・開著雨聲白噪音時，營地會下雨。・夜晚偶爾有流星劃過天空。・在營地直接用鍵盤打某些英文單字，會發生有趣的事（試試動物的叫聲？）。</p></details>
      </div>`;
  }
  return { init, tick, achScreen, FISH, LOVE_LV, loveLv, loveOf };
})();
