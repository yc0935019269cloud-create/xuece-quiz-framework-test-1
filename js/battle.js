/* 遠征畫面：深淵地圖、戰鬥、岔路、事件、篝火、行商、寶箱、天賦/遺物、首領遺物、結算 */
const RunUI = (() => {
  let R = null;      // 目前的 Run
  let ctl = null;    // 題目控制器
  let busy = false;
  let timer = null;  // 限時作答
  const scr = () => U.$('#screen');

  function start(run) {
    R = run; window.CUR = run;
    route();
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function route() {
    stopTimer();
    if (ctl) { ctl.destroy(); ctl = null; }
    const s = R.s;
    window.scrollTo(0, 0);
    const calm = R.abyss ? 'stage2' : 'stage1';
    switch (s.phase) {
      case 'start': R.spawn(); return battle();
      case 'battle': return battle();
      case 'after': R.makeDoors(); return route();
      case 'map': BGM.play('stage2'); return mapScreen();
      case 'doors': BGM.play(calm); return doors();
      case 'choice': BGM.play(calm); return choice();
      case 'bossreward': BGM.play('ending'); return bossReward();
      case 'rift': BGM.play('boss'); return riftScreen();
      case 'event': BGM.play(calm); return eventScreen();
      case 'camp': BGM.play(calm); return camp();
      case 'shop': BGM.play(calm); return shop();
      case 'treasure': BGM.play(calm); return treasure();
      case 'dead': case 'out': case 'win': case 'retreat': return end();
      default: R.spawn(); return battle();
    }
  }
  const toNext = () => { R.s.phase = R.afterNodePhase(); R.save(); route(); };

  /* ---------------- 共用：側欄 ---------------- */
  function relicIcon(id) {
    const r = C.relic(id);
    const rar = r.boss ? '首領遺物' : ['', '普通', '稀有', '傳說'][r.rar] + '遺物';
    return `<div class="relic-ico ${r.boss ? 'boss' : ''}" data-tip-title="${r.name}" data-tip-sub="${rar}" data-tip-rar="${r.boss ? 4 : r.rar}" data-tip="${r.desc}">${SP.icon(r.icon, 28)}</div>`;
  }
  function sideHTML(inBattle) {
    const s = R.s, p = R.p;
    const items = Object.entries(s.items).map(([id, n]) => {
      const it = C.ITEMS[id];
      const usable = inBattle ? it.battle : it.map;
      return `<div class="itemslot" data-item="${id}" title="${it.desc}" style="${usable ? '' : 'opacity:.55'}">${SP.icon(it.icon, 24)}<span>${it.name}</span><span class="cnt">×${n}</span></div>`;
    }).join('') || '<div class="dim small-t">背包是空的</div>';
    const talents = Object.entries(s.talents).map(([id, n]) => `<span class="tag" title="${C.talent(id).desc}">${C.talent(id).name}${n > 1 ? '×' + n : ''}</span>`).join('');
    const pet = C.pet(s.pet); const pl = R.petLv();
    const acc = U.pct(s.stats.correct, s.stats.answered);
    const prog = R.abyss
      ? `<div class="stat-line"><span>章節</span><b>第 ${s.act} / 3 章</b></div><div class="stat-line"><span>試煉等級</span><b class="${s.diff ? 'red-t' : ''}">${C.DIFFS[s.diff].name}</b></div>`
      : `<div class="stat-line"><span>樓層</span><b>${s.floor}</b></div><div class="stat-line"><span>剩餘題數</span><b>${R.remaining} / ${s.total}</b></div>`;
    const skills = R.skills().map(k => `<span class="tag ${R.skillOK(k) ? 'ok' : ''}" title="${k.desc}">${R.skillOK(k) ? '' : '🔒'}${k.name} Lv${Math.max(1, k.lv - (p.skillBonus || 0))}</span>`).join('');
    return `
      <div class="panel"><h3>${U.esc(s.title)}</h3>
        ${prog}
        <div class="stat-line"><span>命中率</span><b>${acc}%（${s.stats.correct}/${s.stats.answered}）</b></div>
        <div class="stat-line"><span>等級</span><b>Lv.${p.lv}</b></div>
        <div class="bar xp mt" style="height:12px"><i style="width:${U.pct(p.xp, R.xpNeed())}%"></i></div>
        <div class="stat-line"><span>生命</span><b class="red-t">${p.hp} / ${p.maxHp}</b></div>
        <div class="stat-line"><span>攻擊力</span><b>${Math.round(p.atk * p.atkMul)}${s.bf && s.bf.curse ? `<span class="red-t">(-${s.bf.curse})</span>` : ''}</b></div>
        <div class="stat-line"><span>防禦力</span><b>${p.def}</b></div>
        <div class="stat-line"><span>暴擊率</span><b>${Math.round(p.crit * 100)}%</b></div>
        <div class="stat-line"><span>金幣</span><b class="gold-t">${p.gold}</b></div>
        ${p.revive ? `<div class="stat-line"><span>復活次數</span><b>${p.revive}</b></div>` : ''}
        ${pet ? `<div class="stat-line"><span>寵物</span><b>${pet.name} Lv.${pl}</b></div>` : ''}
      </div>
      <div class="panel"><h3>背包</h3>${items}</div>
      <div class="panel"><h3>遺物</h3><div class="relic-row">${s.relics.map(relicIcon).join('') || '<span class="dim small-t">尚無遺物</span>'}</div>
        ${talents ? `<h3 class="mt">天賦</h3><div>${talents}</div>` : ''}
        <h3 class="mt">${R.klass.name}技能</h3><div class="small-t dim passive-line">${R.klass.passive}<span id="cheatAns" class="cheat"></span></div><div>${skills}</div></div>
      <div class="row"><button class="px-btn small" data-act="home">回營地（自動存檔）</button><button class="px-btn small red" data-act="retreat">撤退結算</button></div>`;
  }
  function bindSide(root, inBattle) {
    U.$$('[data-item]', root).forEach(el => el.onclick = () => useItem(el.dataset.item, inBattle));
    const home = root.querySelector('[data-act=home]');
    if (home) home.onclick = () => { R.save(); stopTimer(); App.go('hub'); };
    const rt = root.querySelector('[data-act=retreat]');
    if (rt) rt.onclick = async () => {
      if (await U.confirm('撤退結算', '撤退會立即結束本次遠征，魂晶獎勵減半。確定嗎？')) { R.s.phase = 'retreat'; R.save(); route(); }
    };
  }
  function refreshSide(inBattle) {
    const side = U.$('.side'); if (!side) return;
    side.innerHTML = sideHTML(inBattle); bindSide(side, inBattle);
    updateCheat();
  }

  /* 隱藏代碼（戰鬥中）：快速連點職業被動那行 3 下，或依序打字 yuzu，
   * 就會在被動說明後面顯示小小的正確答案；再做一次即關閉。 */
  let cheat = false;
  function updateCheat() {
    const el = U.$('#cheatAns'); if (!el) return;
    const q = R && R.s.phase === 'battle' && R.s.curQ ? Store.Q[R.s.curQ] : null;
    el.textContent = cheat && q ? ` ${q.ans}` : '';
  }
  function toggleCheat() { if (!window.CUR || !U.$('#cheatAns')) return; cheat = !cheat; updateCheat(); if (cheat) Ach.unlock('cheat'); }
  let clicks = [];
  document.addEventListener('click', e => {
    if (!e.target.closest || !e.target.closest('.passive-line')) return;
    const now = Date.now();
    clicks = clicks.filter(t => now - t < 700); clicks.push(now);
    if (clicks.length >= 3) { clicks = []; toggleCheat(); }
  });
  let typed = '', typedAt = 0;
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const now = Date.now();
    if (now - typedAt > 2000) typed = '';
    typedAt = now;
    typed = (typed + e.key.toLowerCase()).slice(-4);
    if (typed === 'yuzu') { typed = ''; toggleCheat(); }
  }, true);

  function useItem(id, inBattle) {
    if (busy) return;
    const it = C.ITEMS[id];
    if (inBattle ? !it.battle : !it.map) { U.toast(inBattle ? '這個道具不能在戰鬥中使用' : '這個道具只能在戰鬥中使用'); return; }
    const s = R.s, p = R.p;
    if (id === 'potion_s' || id === 'potion_l') {
      if (p.hp >= p.maxHp) { U.toast('生命已滿'); return; }
      R.useItemRaw(id); const v = R.heal(p.maxHp * (id === 'potion_s' ? 0.3 : 0.65)); SFX.play('heal');
      if (inBattle) floatText('hero', `+${v}`, 'heal');
      U.toast(`回復 ${v} 生命`);
    } else if (id === 'elixir') {
      if (s.bf.elixir) { U.toast('力量藥劑效果已在身上'); return; }
      R.useItemRaw(id); s.bf.elixir = true; SFX.play('level'); U.toast('攻擊力提升 50%（本場戰鬥）');
    } else if (id === 'shield') {
      R.useItemRaw(id); s.shield += 20; SFX.play('heal'); U.toast('獲得 20 點護盾');
    } else if (id === 'elim') {
      if (!ctl || !ctl.canEliminate()) { U.toast('本題無法使用刪去卷軸'); return; }
      R.useItemRaw(id); ctl.eliminate(2); SFX.play('pet');
    } else if (id === 'skip') {
      if (!ctl || ctl.locked) { U.toast('作答後不能換題'); return; }
      R.useItemRaw(id); R.skipQuestion();
      if (R.remaining <= 0) { s.phase = 'out'; R.save(); return route(); }
      R.save(); U.toast('換了一題'); renderQuestion(); refreshSide(true); return;
    } else if (id === 'bomb') {
      if (!ctl || ctl.locked) { U.toast('請在作答前使用'); return; }
      R.useItemRaw(id); const d = R.hitMon(30); SFX.play('fire');
      spawnFx('fire', 'hero', 'mon'); floatText('mon', '-' + d, 'crit'); animEnt('mon', 'anim-hurt');
      if (s.mon.hp <= 0) {
        stopTimer();
        const ev = R.onKill(); R.save(); updateHud(); refreshSide(true);
        playEvents(ev).then(() => { ctl.destroy(); afterBattleButton(); });
        return;
      }
    }
    R.save(); updateHud(); refreshSide(inBattle);
  }

  /* ---------------- 深淵地圖 ---------------- */
  function mapScreen() {
    const s = R.s, m = s.map;
    const avail = new Set(R.availableNodes().map(n => n.id));
    const ROW_H = 74, H = (m.rows + 1) * ROW_H + 60;
    const X = n => n.type === 'boss' ? 50 : (n.c + 0.5) / m.cols * 100 + (n.jx || 0);
    const Y = n => n.type === 'boss' ? 64 : H - 40 - n.r * ROW_H + (n.jy || 0);
    const nodes = Object.values(m.nodes);
    let lines = '';
    nodes.forEach(n => n.next.forEach(id => {
      const t = m.nodes[id]; if (!t) return;
      const walked = n.done && t.done;
      lines += `<line x1="${X(n)}%" y1="${Y(n)}" x2="${X(t)}%" y2="${Y(t)}" class="${walked ? 'walked' : (m.cur === n.id && avail.has(t.id)) ? 'open' : ''}"/>`;
    }));
    const boss = m.nodes.boss.boss, bdef = C.BOSS_DEFS[boss.th || C.themeOf(boss.subj)][boss.idx];
    const nodeHTML = nodes.map(n => {
      const T = C.NODES[n.type];
      const cls = [n.done ? 'done' : '', avail.has(n.id) ? 'avail' : '', m.cur === n.id ? 'cur' : '', n.type === 'boss' ? 'bossnode' : ''].join(' ');
      const ic = n.type === 'boss' ? SP.tile(bdef.tile, 72, 'anim-bob', `filter:${bdef.filter};transform:scaleX(-1)`) : SP.icon(T.icon, 34, '', T.filter ? `filter:${T.filter}` : '');
      return `<div class="mnode ${cls}" data-id="${n.id}" style="left:${X(n)}%;top:${Y(n)}px" title="${T.name}">${ic}${m.cur === n.id ? `<div class="me">${SP.tile(Store.heroTile(s.cls), 30)}</div>` : ''}</div>`;
    }).join('');
    const main = frame(`<div class="panel">
      <div class="row"><h2 style="margin:0">第 ${s.act} 章・${['', '淺層迴廊', '深層書庫', '深淵王座'][s.act]}</h2><span class="grow"></span><span class="tag ${s.diff ? 'ng' : ''}">${C.DIFFS[s.diff].name}</span></div>
      <p class="dim small-t">從最下方出發，沿著路線往上選擇下一個房間。本章首領：<b class="red-t">${bdef.name}</b>（${(C.SUBJECTS[boss.subj] || {}).name || ''}）・機制：${boss.mechs.map(k => `<span class="tag ng" title="${C.MECHS[k].desc}">${C.MECHS[k].name}</span>`).join('')}</p>
      <div class="legend">${['battle', 'elite', 'event', 'camp', 'shop', 'treasure'].map(k => `<span>${SP.icon(C.NODES[k].icon, 20, '', C.NODES[k].filter ? `filter:${C.NODES[k].filter}` : '')}${C.NODES[k].name}</span>`).join('')}</div>
      <details class="small-t dim mb"><summary style="cursor:pointer">路線生成原則</summary>第 1 層必為戰鬥、第 2 層只有戰鬥或事件、正中間一層是寶箱、首領前一層是篝火；精英從第 4 層起、行商從第 3 層起；精英／行商／篝火／寶箱不會連續出現，同一岔路的選項盡量不同，也不會連續三場普通戰鬥；每章至少 1 個精英與 1 個行商。</details>
      <div class="amap" style="height:${H}px"><svg width="100%" height="${H}">${lines}</svg>${nodeHTML}</div></div>`);
    U.$$('.mnode.avail', main).forEach(el => el.onclick = () => {
      SFX.play('open');
      R.enterNode(el.dataset.id);
      route();
    });
    const cur = U.$('.mnode.avail', main) || U.$('.mnode.cur', main);
    if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
    if (s.actIntro) {
      s.actIntro = false; R.save();
      U.modal({ title: `第 ${s.act} 章`, narrow: true, body: `<p class="center">${['', '', '你走下更深的階梯，空氣中瀰漫著舊紙與墨水的氣味……', '深淵的王座就在前方。這是最後一章。'][s.act]}</p><p class="center dim">生命回復了一半的損失。</p>`, buttons: [{ label: '前進', cls: 'gold' }] });
    }
  }

  /* ---------------- 戰鬥 ---------------- */
  function battle() {
    const s = R.s, m = s.mon, P = Store.profile;
    const pet = C.pet(s.pet);
    BGM.play(m.boss ? 'boss' : m.elite ? 'level3' : (s.floor % 2 ? 'level1' : 'level2'));
    const tag = R.abyss ? `第 ${s.act} 章${m.boss ? '・首領' : m.elite ? '・精英' : ''}` : `第 ${s.floor} 層${m.boss ? '・首領' : m.elite ? '・精英' : ''}`;
    const mechs = (m.mechs || []).map(k => `<span class="tag ng" title="${C.MECHS[k].desc}">${C.MECHS[k].name}</span>`).join('')
      + (m.traits || []).map(k => `<span class="tag ${m.elite ? 'ng' : ''}" title="${C.TRAITS[k].desc}">${C.TRAITS[k].name}</span>`).join('');
    scr().innerHTML = `
      <div class="battle">
        <div class="main">
          <div class="stage-wrap" id="stageWrap">
          <div class="stage ${m.boss ? 'boss-stage' : ''} theme-${FX.themeFor(R).id}" id="stage">
            ${FX.stageBG(R)}
            <div class="floor-tag">${tag}</div>
            <div class="combo" id="combo"></div>
            <div class="hud l"><span class="name">${R.klass.name} Lv.<b id="hLv">${R.p.lv}</b></span>
              <div class="bar"><i id="hHp"></i><span id="hHpT"></span></div>
              <div class="bar shield" id="hShW" style="height:10px"><i id="hSh"></i></div><b id="hState" class="purple-t small-t"></b></div>
            <div class="hud r"><span class="name ${m.boss || m.elite ? 'red-t' : ''}" title="${U.esc(m.desc || '')}">${U.esc(m.name)}</span>
              <div class="bar"><i id="mHp"></i><span id="mHpT"></span></div>
              <div class="small-t dim"><span id="mAtk">攻擊 ${m.atk}</span> <b id="mState" class="gold-t"></b></div><div class="trait-tags">${mechs}</div></div>
            ${pet ? `<div class="ent pet" id="ePet">${Store.petHTML(s.pet, 70, 'anim-float')}</div>` : ''}
            <div class="ent hero cls-${s.cls}" id="eHero"><div class="shadow"></div><div class="hero-body anim-bob">${SP.tile(Store.heroTile(s.cls), 96)}${FX.weaponHTML(s.cls)}</div></div>
            <div class="ent mon" id="eMon"><div class="shadow"></div>${SP.icon(m.tile, m.boss ? 150 : m.elite ? 120 : 104, 'anim-bob2', `filter:${m.filter || 'none'};transform:scaleX(-1)`)}</div>
          </div>
          <div class="skillbar" id="skills"></div>
          </div>
          <div class="qpanel panel dark" id="qpanel"></div>
        </div>
        <div class="side">${sideHTML(true)}</div>
      </div>`;
    bindSide(scr(), true);
    pinStage();
    updateHud();
    renderSkills();
    renderQuestion();
    if (m.boss && !s.bf.intro) {
      s.bf.intro = true; R.save(); SFX.play('boss');
      U.modal({ title: `首領現身：${m.name}`, narrow: true, body: `<div class="center">${SP.icon(m.tile, 120, 'anim-bob', `filter:${m.filter};transform:scaleX(-1)`)}</div>
        ${m.line ? `<p class="center gold-t">「${U.esc(m.line)}」</p>` : ''}
        <p>生命 ${m.maxHp}・攻擊 ${m.atk}</p>${(m.mechs || []).map(k => `<p><span class="tag ng">${C.MECHS[k].name}</span>${C.MECHS[k].desc}</p>`).join('')}
        ${m.subj ? `<p class="dim small-t">本場題目：${C.SUBJECTS[m.subj].name}</p>` : ''}`, buttons: [{ label: '迎戰！', cls: 'red' }] });
    }
  }

  /* 題目很長往下捲時，戰鬥畫面固定在上方（捲動後自動縮小） */
  let pinHandler = null;
  function pinStage() {
    if (pinHandler) window.removeEventListener('scroll', pinHandler);
    const top = (U.$('#topbar')?.offsetHeight || 52);
    const wrap = U.$('#stageWrap'); if (!wrap) return;
    wrap.style.top = top + 'px';
    pinHandler = () => {
      const w = U.$('#stageWrap'); if (!w) { window.removeEventListener('scroll', pinHandler); return; }
      // 進入/離開縮小狀態用不同門檻，避免縮放造成的捲動位移來回觸發（抽動）
      const y = window.scrollY, on = w.classList.contains('compact');
      // 縮小時用 margin 補回少掉的高度 → 版面總高度不變，下方題目不會跳動
      if (!on && y > 220) { const h0 = w.offsetHeight; w.classList.add('compact'); w.style.marginBottom = (h0 - w.offsetHeight) + 'px'; }
      else if (on && y < 24) { w.classList.remove('compact'); w.style.marginBottom = ''; }
    };
    window.addEventListener('scroll', pinHandler, { passive: true });
    pinHandler();
  }
  function renderSkills() {
    const bar = U.$('#skills'); if (!bar) return;
    const p = R.p;
    bar.innerHTML = R.skills().map(k => {
      const un = R.skillOK(k), cd = R.s.cd[k.id] || 0, passive = !k.cd;
      return `<button class="px-btn small skill ${un ? '' : 'locked'} ${passive ? 'passive' : ''}" data-sk="${k.id}" title="${k.name}：${k.desc}${k.cd ? `（冷卻 ${k.cd} 題）` : ''}" ${!un || cd || passive ? 'disabled' : ''}>
        ${SP.icon(k.icon, 20)}<span>${un ? k.name : `Lv.${Math.max(1, k.lv - (p.skillBonus || 0))} 解鎖`}</span>${un && cd ? `<i class="cd">${cd}</i>` : ''}${un && passive ? '<i class="cd">被動</i>' : ''}</button>`;
    }).join('');
    U.$$('[data-sk]', bar).forEach(b => b.onclick = () => castSkill(b.dataset.sk));
  }
  function castSkill(id) {
    if (busy) return;
    if (!ctl || ctl.locked) { U.toast('請在作答前使用技能'); return; }
    const k = C.skill(id);
    if (k.kind === 'elim' && !ctl.canEliminate()) { U.toast(`本題無法使用${k.name}`); return; }
    if (k.kind === 'heal' && R.p.hp >= R.p.maxHp) { U.toast('生命已滿'); return; }
    if (!R.useSkill(id)) return;
    SFX.play('skill'); animEnt('hero', 'anim-cast');
    U.toast(`施放技能「${k.name}」`);
    if (k.kind === 'elim') ctl.eliminate(k.val);
    else if (k.kind === 'heal') floatText('hero', k.name, 'heal');
    else if (k.kind === 'shield') floatText('hero', '護盾 +' + Math.round(R.p.maxHp * k.val), 'miss');
    else if (k.kind === 'nuke') {
      const d = R.hitMon(Math.round(R.p.atk * R.p.atkMul * k.val)); SFX.play('fire');
      spawnFx('fire', 'hero', 'mon'); floatText('mon', `${k.name} -${d}`, 'crit'); animEnt('mon', 'anim-hurt');
      if (R.s.mon.hp <= 0) {
        stopTimer();
        const ev = R.onKill(); R.save(); updateHud(); refreshSide(true);
        playEvents(ev).then(() => { ctl.destroy(); afterBattleButton(); });
        return;
      }
    } else floatText('hero', k.name + '！', 'crit');
    updateHud(); renderSkills(); refreshSide(true);
  }

  function updateHud() {
    const s = R.s, p = R.p, m = s.mon;
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.style.width = v + '%'; };
    const txt = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    if (!m) return;
    set('hHp', U.pct(p.hp, p.maxHp)); txt('hHpT', `${p.hp}/${p.maxHp}`);
    set('mHp', U.pct(m.hp, m.maxHp)); txt('mHpT', `${m.hp}/${m.maxHp}${s.bf.bshield ? ` +盾${s.bf.bshield}` : ''}`);
    set('hSh', Math.min(100, s.shield * 3)); const sw = document.getElementById('hShW'); if (sw) sw.style.visibility = s.shield > 0 ? 'visible' : 'hidden';
    txt('hLv', p.lv);
    txt('mAtk', `攻擊 ${Math.round(R.monAtk())}`);
    txt('mState', [s.bf.charged && '⚡蓄力中！', s.bf.fuse && '💣引信點燃！', s.bf.guardUp && '🛡舉盾', s.bf.minion > 0 && `僕從×${s.bf.minion}`, s.bf.phase2 && '第二階段', m.traits && m.traits.includes('flee') && `${Math.max(0, 5 - (s.bf.turn || 0))} 題後逃走`].filter(Boolean).join(' '));
    txt('hState', [s.bf.poison && `☠中毒 ${s.bf.poison}`, s.bf.burnP && `🔥著火 ${s.bf.burnP}`, s.bf.chill && '❄凍傷', s.bf.rot && `防禦 -${s.bf.rot}`].filter(Boolean).join(' '));
    const cb = document.getElementById('combo'); if (cb) cb.textContent = s.combo >= 2 ? `${s.combo} 連擊！` : '';
  }

  function renderQuestion() {
    const s = R.s;
    stopTimer();
    const qid = R.currentQ();
    const q = Store.Q[qid];
    if (!q) { R.skipQuestion(); if (R.remaining <= 0) { s.phase = 'out'; R.save(); return route(); } return renderQuestion(); }
    const panel = U.$('#qpanel');
    if (ctl) ctl.destroy();
    busy = false;
    ctl = QV.render(panel, q, {
      mode: 'battle',
      onAnswer: res => onAnswer(q, res),
      nextLabel: '繼續 ▶',
      onNext: () => nextStep()
    });
    // 開場刪選項：貓頭鷹寵物、貓頭鷹眼鏡、無盡之書
    let el = 0;
    if (q.type === 'single' && R.has('owlglass')) el++;
    if (q.type === 'single' && R.has('tome')) el++;
    if (R.petIs('owl') && Math.random() < (15 + R.petLv() * 4) / 100) { el++; setTimeout(() => { animEnt('pet', 'anim-cast'); U.toast('咕咕幫你刪去了一個錯誤選項！'); }, 300); }
    if (el) ctl.eliminate(el);
    renderSkills();
    updateCheat();
    // 限時作答
    const lim = R.timeLimit(q);
    if (lim) {
      const tb = U.h(`<div class="timer"><i></i><span></span></div>`);
      panel.prepend(tb);
      const t0 = Date.now();
      const tick = () => {
        const left = Math.max(0, lim - (Date.now() - t0) / 1000);
        tb.firstElementChild.style.width = (left / lim * 100) + '%';
        tb.lastElementChild.textContent = `⌛ ${Math.ceil(left)} 秒`;
        tb.classList.toggle('low', left < 10);
        if (left < 5.5 && Math.ceil(left) !== tb._last) { tb._last = Math.ceil(left); SFX.play('tick'); }
        if (left <= 0) { stopTimer(); ctl && ctl.timeout(); }
      };
      tick(); timer = setInterval(tick, 250);
    }
    panel.scrollIntoView({ block: 'nearest' });
  }

  async function onAnswer(q, res) {
    stopTimer();
    busy = true;
    SFX.play(res.ok ? 'correct' : 'wrong');
    const ev = R.resolve(q, res);
    await playEvents(ev);
    updateHud(); refreshSide(true); renderSkills();
    busy = false;
    const ph = R.s.phase;
    const nb = U.$('.next-btn');
    if (nb) {
      if (ph === 'dead') nb.textContent = '倒下了…查看結算';
      else if (ph === 'win') nb.textContent = '🏆 擊敗首領！查看結算';
      else if (ph === 'bossreward') nb.textContent = '👑 擊敗首領！領取首領遺物';
      else if (ph === 'out') nb.textContent = '題目用盡，查看結算';
      else if (ph === 'after') nb.textContent = R.s.bf.fled ? '怪物逃走了……前進 ▶' : '怪物被擊敗！前進 ▶';
      else if (ph === 'rift') nb.textContent = '👑 擊敗首領！……空間好像裂開了？';
    }
  }
  function nextStep() {
    const ph = R.s.phase;
    if (ph === 'battle') { renderQuestion(); updateHud(); return; }
    route();
  }
  function afterBattleButton() {
    const panel = U.$('#qpanel');
    const ph = R.s.phase;
    panel.innerHTML = `<div class="center"><div class="verdict gold-t">怪物被擊敗！</div><button class="px-btn gold big">${ph === 'win' ? '查看結算' : '前進 ▶'}</button></div>`;
    panel.querySelector('button').onclick = () => route();
  }

  /* ---- 動畫 ---- */
  function entEl(who) { return document.getElementById(who === 'hero' ? 'eHero' : who === 'mon' ? 'eMon' : 'ePet'); }
  function animEnt(who, cls) {
    const e = entEl(who); if (!e) return;
    e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls);
    setTimeout(() => e.classList.remove(cls), 800);
  }
  function posOf(who) {
    const st = U.$('#stage'), e = entEl(who); if (!st || !e) return { x: 0, y: 0 };
    const a = st.getBoundingClientRect(), b = e.getBoundingClientRect();
    return { x: b.left - a.left + b.width / 2, y: b.top - a.top + b.height * 0.3 };
  }
  function floatText(who, text, cls = '') {
    const st = U.$('#stage'); if (!st) return;
    const p = posOf(who);
    const d = U.h(`<div class="dmg ${cls}" style="left:${p.x - 20 + U.rnd(-10, 10)}px;top:${p.y}px">${text}</div>`);
    st.appendChild(d); setTimeout(() => d.remove(), 1100);
  }
  function spawnFx(kind, from, to) {
    const st = U.$('#stage'); if (!st) return;
    const a = posOf(from), b = posOf(to);
    if (kind === 'slash') {
      const d = U.h(`<div class="fx slash" style="left:${b.x - 45}px;top:${b.y - 20}px"></div>`);
      st.appendChild(d); setTimeout(() => d.remove(), 400);
      for (let i = 0; i < 6; i++) {
        const sp = U.h(`<div class="fx spark" style="left:${b.x}px;top:${b.y + 20}px;--dx:${U.rnd(-50, 50)}px;--dy:${U.rnd(-50, 30)}px"></div>`);
        st.appendChild(sp); setTimeout(() => sp.remove(), 600);
      }
    } else if (kind === 'fire') {
      const d = U.h(`<div class="fx fire" style="left:${a.x}px;top:${a.y + 10}px;--dx:${b.x - a.x}px"></div>`);
      st.appendChild(d); setTimeout(() => d.remove(), 500);
    }
  }
  async function playEvents(ev) {
    for (const e of ev) {
      switch (e.t) {
        case 'skill': floatText('hero', e.name + '！', 'crit'); await U.sleep(150); break;
        case 'hit': {
          const move = await FX.attack(R.s.cls, e);
          animEnt('mon', 'anim-hurt');
          if (!e.partial) floatText('hero', move, 'move');
          floatText('mon', (e.crit ? '暴擊 ' : e.partial ? '擦傷 ' : '') + '-' + e.dmg + (e.blocked ? `（減免 ${e.blocked}）` : ''), e.crit ? 'crit' : '');
          updateHud(); await U.sleep(380); break;
        }
        case 'extra':
          spawnFx('slash', 'hero', 'mon'); SFX.play('crit'); floatText('mon', `${e.why} -${e.dmg}`, 'crit'); updateHud(); await U.sleep(300); break;
        case 'execute':
          SFX.play('crit'); floatText('mon', '處決！', 'crit'); updateHud(); await U.sleep(300); break;
        case 'pet':
          if (e.kind === 'bite') {
            animEnt('pet', 'anim-lunge'); SFX.play('pet'); await U.sleep(170);
            spawnFx('slash', 'pet', 'mon'); animEnt('mon', 'anim-hurt'); SFX.play('hit');
            floatText('mon', `${Store.petName('dog')}撲咬 -${e.dmg}`); updateHud(); await U.sleep(300); break;
          }
          animEnt('pet', 'anim-cast'); SFX.play('fire'); await U.sleep(200);
          spawnFx('fire', 'pet', 'mon'); await U.sleep(420); animEnt('mon', 'anim-hurt');
          floatText('mon', '🔥-' + e.dmg); updateHud(); await U.sleep(250); break;
        case 'petfind': animEnt('pet', 'anim-cast'); SFX.play('coin'); floatText('pet', `叼回 ${C.ITEMS[e.item].name}！`, 'heal'); U.toast(`${Store.petName('rat')} 叼回了「${C.ITEMS[e.item].name}」`); await U.sleep(250); break;
        case 'heal': floatText('hero', '+' + e.v, 'heal'); if (R.petIs('fairy')) animEnt('pet', 'anim-cast'); updateHud(); await U.sleep(200); break;
        case 'mheal': floatText('mon', (e.why || '再生') + ' +' + e.v, 'heal'); updateHud(); await U.sleep(250); break;
        case 'mdodge': animEnt('hero', 'anim-lunge'); await U.sleep(160); SFX.play('miss'); floatText('mon', '虛化閃避！', 'miss'); await U.sleep(300); break;
        case 'undying': SFX.play('boss'); animEnt('mon', 'anim-pop'); floatText('mon', '不死！復活', 'heal'); updateHud(); await U.sleep(400); break;
        case 'steal': SFX.play('coin'); floatText('hero', `被偷 ${e.v} 金幣`, 'miss'); await U.sleep(250); break;
        case 'status': floatText('hero', e.text, 'miss'); await U.sleep(250); break;
        case 'poison': floatText('hero', `☠ 毒 -${e.dmg}`); animEnt('hero', 'anim-hurt'); updateHud(); await U.sleep(250); break;
        case 'charging': SFX.play('skill'); floatText('mon', '⚡ 蓄力中', 'crit'); U.toast('怪物正在蓄力！下一題答錯會受到雙倍傷害'); updateHud(); await U.sleep(300); break;
        case 'chargehit': floatText('mon', '蓄力重擊！', 'crit'); await U.sleep(200); break;
        case 'curse': floatText('hero', '詛咒：攻擊 -2', 'miss'); await U.sleep(250); break;
        case 'bshield': floatText('mon', `結界 +${e.v}`, 'miss'); SFX.play('skill'); updateHud(); await U.sleep(250); break;
        case 'hurt':
          animEnt('mon', 'anim-lunge-l'); await U.sleep(160);
          animEnt('hero', 'anim-hurt'); SFX.play('hurt');
          U.$('#stage')?.classList.remove('flash-red'); void U.$('#stage')?.offsetWidth; U.$('#stage')?.classList.add('flash-red');
          floatText('hero', e.dmg ? '-' + e.dmg : '護盾吸收', e.dmg ? '' : 'miss');
          updateHud(); await U.sleep(420); break;
        case 'thorns': floatText('mon', '荊棘 -' + e.dmg); animEnt('mon', 'anim-hurt'); updateHud(); await U.sleep(250); break;
        case 'mstatus': floatText('mon', e.text, 'miss'); SFX.play('skill'); updateHud(); await U.sleep(300); break;
        case 'reflect': SFX.play('hurt'); floatText('hero', `反彈 -${e.dmg}`); animEnt('hero', 'anim-hurt'); updateHud(); await U.sleep(280); break;
        case 'thorny': floatText('hero', `尖刺 -${e.dmg}`); animEnt('hero', 'anim-hurt'); updateHud(); await U.sleep(250); break;
        case 'burn': floatText('hero', `🔥 燒傷 -${e.dmg}`); animEnt('hero', 'anim-hurt'); updateHud(); await U.sleep(250); break;
        case 'miasma': floatText('hero', `瘴氣 -${e.dmg}`); updateHud(); await U.sleep(220); break;
        case 'fuse': SFX.play('tick'); floatText('mon', '💣 引信點燃！', 'crit'); U.toast('怪物點燃了引信！下一題沒打倒牠就會自爆'); updateHud(); await U.sleep(350); break;
        case 'explode': {
          SFX.play('boss'); const st = U.$('#stage'); st?.classList.remove('flash-red'); void st?.offsetWidth; st?.classList.add('flash-red');
          entEl('mon')?.classList.add('anim-die'); animEnt('hero', 'anim-hurt'); floatText('hero', `💥 自爆 -${e.dmg}`, 'crit'); updateHud(); await U.sleep(500); break;
        }
        case 'phase2': SFX.play('boss'); animEnt('mon', 'anim-pop'); floatText('mon', `第二階段！+${e.v}`, 'crit'); U.toast('首領進入第二階段：攻擊力提升！'); updateHud(); await U.sleep(450); break;
        case 'judge': {
          SFX.play('boss'); const st = U.$('#stage'); st?.classList.remove('flash-red'); void st?.offsetWidth; st?.classList.add('flash-red');
          animEnt('hero', 'anim-hurt'); floatText('hero', e.dmg ? `⚖ 審判 -${e.dmg}` : '⚖ 審判（護盾吸收）', 'crit'); updateHud(); await U.sleep(450); break;
        }
        case 'flee': { SFX.play('miss'); const me = entEl('mon'); if (me) { me.style.transition = 'transform .6s steps(6), opacity .6s'; me.style.transform = 'translateX(160px)'; me.style.opacity = '0'; } floatText('mon', '逃走了！', 'miss'); U.toast(R.s.mon.secret ? '黃金史萊姆溜走了……下次要更快打倒牠！' : '怪物帶著寶物逃走了！'); await U.sleep(600); break; }
        case 'dodge':
          animEnt('mon', 'anim-lunge-l'); await U.sleep(160); SFX.play('miss');
          floatText('hero', R.petIs('fox') ? '阿狐閃避！' : '閃避！', 'miss'); if (R.petIs('fox')) animEnt('pet', 'anim-cast');
          await U.sleep(350); break;
        case 'block': if (e.pet) { animEnt('pet', 'anim-cast'); SFX.play('pet'); floatText('pet', '♥', 'heal'); } floatText('hero', e.why + (e.pet ? '，怪物心軟了！' : ' 抵擋！'), 'miss'); SFX.play('miss'); await U.sleep(350); break;
        case 'kill': {
          const me = entEl('mon'); me && me.classList.add('anim-die'); SFX.play('kill');
          await U.sleep(500); SFX.play('coin'); floatText('mon', `+${e.gold} 金幣`, 'crit');
          if (R.s.mon.boss) SFX.play('win');
          await U.sleep(300); break;
        }
        case 'level':
          SFX.play('level'); floatText('hero', 'LEVEL UP!', 'crit');
          U.toast(`升級！Lv.${e.lv}（生命上限 +8、攻擊 +2）`);
          if (e.skills && e.skills.length) setTimeout(() => U.toast(`✨ 解鎖新技能：${e.skills.join('、')}`, 3500), 600);
          await U.sleep(300); break;
        case 'relic': U.toast(`精英掉落遺物：${C.relic(e.id).name}`); break;
        case 'revive': SFX.play('heal'); floatText('hero', e.why + '！', 'heal'); U.toast(`${e.why}！重新站了起來`); await U.sleep(300); break;
        case 'dead': { const he = entEl('hero'); he && he.classList.add('anim-die'); SFX.play('lose'); await U.sleep(600); break; }
        case 'out': U.toast('題目已全部用完'); break;
      }
    }
  }

  /* ---------------- 非戰鬥畫面外框 ---------------- */
  function frame(inner) {
    scr().innerHTML = `<div class="battle"><div class="main">${inner}</div><div class="side">${sideHTML(false)}</div></div>`;
    bindSide(scr(), false);
    return U.$('.main', scr());
  }

  const DOOR = {
    event: { name: '神秘事件', icon: 'question', desc: '未知的遭遇，可能是機會也可能是陷阱' },
    camp: { name: '篝火', icon: 'campfire', desc: '休息回血、鍛鍊或複習錯題' },
    shop: { name: '行商', icon: 86, desc: '用金幣購買補給與戰鬥加成' },
    treasure: { name: '寶箱', icon: 89, desc: '可能藏著金幣與道具' },
    onward: { name: '繼續前進', icon: 45, desc: '不停留，拾取少量金幣' },
    elite: { name: '精英巢穴', icon: 64, desc: '下一戰遇到精英怪，擊敗必掉遺物' }
  };
  function doors() {
    const s = R.s;
    const main = frame(`<div class="panel center"><h2>岔路口</h2><p class="dim">第 ${s.floor} 層已清除。前方出現了幾條通道，選擇一條前進：</p>
      <div class="doors">${s.doors.map(d => `<div class="panel door" data-d="${d}">${SP.icon(DOOR[d].icon, 72, 'anim-bob')}<b>${DOOR[d].name}</b><div class="small-t dim">${DOOR[d].desc}</div></div>`).join('')}</div></div>`);
    U.$$('.door', main).forEach(el => el.onclick = () => {
      SFX.play('open');
      const d = el.dataset.d;
      if (d === 'event') R.startEvent();
      else if (d === 'camp') { s.phase = 'camp'; s.campDone = false; }
      else if (d === 'shop') { s.phase = 'shop'; s.shop = R.makeShop(); }
      else if (d === 'treasure') { s.phase = 'treasure'; s.treasure = null; }
      else if (d === 'elite') { s.pendingElite = true; s.phase = 'start'; }
      else { const g = R.gainGold(U.rnd(6, 12)); U.toast(`撿到 ${g} 金幣`); s.phase = 'start'; }
      R.save(); route();
    });
  }
  function nextFloorBtn(label) {
    const mimic = R.s.pendingMimic || R.s.pendingFight;
    label = label || (R.abyss && !mimic ? '回到地圖 ▶' : '前往下一層 ▶');
    const b = U.h(`<button class="px-btn gold big mt">${label}</button>`);
    b.onclick = toNext;
    return b;
  }

  function choice() {
    const s = R.s;
    const main = frame(`<div class="panel center"><h2>力量的抉擇</h2><p class="dim">深入地牢的你感受到一股力量，選擇一項強化（天賦或遺物）：</p><div class="doors" id="cc"></div></div>`);
    const cc = U.$('#cc', main);
    s.choice.forEach(c => {
      const d = c.kind === 'talent' ? C.talent(c.id) : C.relic(c.id);
      const card = U.h(`<div class="panel choice-card rar-${c.kind === 'relic' ? d.rar + 1 : 1}">
        <div class="row">${SP.icon(d.icon, 48)}<div><div class="kind">${c.kind === 'talent' ? '天賦（可疊加）' : '遺物'}</div><b>${d.name}</b></div></div>
        <p>${d.desc}</p></div>`);
      card.onclick = () => {
        SFX.play('level');
        c.kind === 'talent' ? R.addTalent(c.id) : R.addRelic(c.id);
        U.toast(`獲得${c.kind === 'talent' ? '天賦' : '遺物'}「${d.name}」`);
        s.choice = null;
        const n = s.nextChoice; s.nextChoice = 1e9; R.makeDoors(); s.nextChoice = n; R.save();
        route();
      };
      cc.appendChild(card);
    });
  }

  /* 首領遺物三選一 */
  function bossReward() {
    const s = R.s;
    if (!s.bossChoice || !s.bossChoice.length) { R.finishBossReward(); return route(); }
    const main = frame(`<div class="panel center"><h2>👑 首領的寶藏</h2><p class="dim">你擊敗了第 ${s.act} 章首領！從它守護的寶物中選擇一件強力的首領遺物：</p><div class="doors" id="bc"></div>
      <button class="px-btn small mt" id="skipb">都不要（改拿 80 金幣）</button></div>`);
    const bc = U.$('#bc', main);
    s.bossChoice.forEach(id => {
      const d = C.relic(id);
      const card = U.h(`<div class="panel choice-card rar-4"><div class="row">${SP.icon(d.icon, 52, 'anim-float')}<div><div class="kind">首領遺物</div><b>${d.name}</b></div></div><p>${d.desc}</p></div>`);
      card.onclick = () => { SFX.play('level'); R.addRelic(id); U.toast(`獲得首領遺物「${d.name}」`); done(); };
      bc.appendChild(card);
    });
    U.$('#skipb', main).onclick = () => { R.gainGold(80); done(); };
    function done() {
      const Pa = Store.profile.abyss; Pa.bossKills++; Store.saveProfile();
      R.finishBossReward(); route();
    }
  }

  function eventScreen() {
    const s = R.s; const e = C.EVENTS.find(x => x.id === s.event.id);
    const main = frame(`<div class="panel center"><h2>${e.title}</h2>${SP.icon(e.icon, 96, 'anim-float')}<p>${e.text}</p><div class="col" id="ech" style="align-items:center"></div><div id="emsg"></div></div>`);
    const box = U.$('#ech', main), msg = U.$('#emsg', main);
    if (s.event.msg) { showResult(); return; }
    e.choices.forEach(c => {
      const ok = !c.cond || c.cond(R);
      const b = U.h(`<button class="px-btn" style="min-width:260px" ${ok ? '' : 'disabled'}>${c.label}</button>`);
      b.onclick = () => { s.event.msg = c.run(R); SFX.play('open'); R.save(); showResult(); };
      box.appendChild(b);
    });
    function showResult() {
      box.innerHTML = ''; msg.innerHTML = `<p class="gold-t">${s.event.msg}</p>`;
      refreshSide(false);
      if (R.p.hp <= 0) { s.phase = 'dead'; R.save(); msg.appendChild(U.h('<button class="px-btn red big">結算</button>')).onclick = route; return; }
      if (s.pendingQuiz) { const b = U.h('<button class="px-btn gold big">接受考驗 ▶</button>'); b.onclick = () => scholarQuiz(); msg.appendChild(b); return; }
      if (s.pendingMimic) { msg.appendChild(nextFloorBtn('迎戰寶箱怪！')); return; }
      if (s.pendingFight) { msg.appendChild(nextFloorBtn('迎戰精英！')); return; }
      msg.appendChild(nextFloorBtn());
    }
  }
  /* 事件中的額外一題：學者／人面獅身／幽靈考生／時光裂縫（錯題本） */
  const QUIZ = {
    scholar: { title: '學者的考驗', ok: () => { const r = R.randomRelic(2) || R.randomRelic(); if (r) { R.addRelic(r.id); return `學者贈送遺物「${r.name}」！`; } R.gainGold(60, true); return '學者贈送 60 金幣'; }, ng: () => { R.damage(10, true); return '學者搖頭：「回去多讀書吧。」受到 10 點傷害'; } },
    sphinx: { title: '人面獅身的謎題', ok: () => { const g = R.gainGold(50, true); R.p.atk += 2; return `石像讓開了路：${g} 金幣、攻擊 +2！`; }, ng: () => { const d = Math.round(R.p.maxHp * 0.15); R.damage(d, true); return `石像的尾巴甩了過來（-${d} 生命）`; } },
    ghost: { title: '幽靈考生的難題', ok: () => { const r = R.randomRelic(2) || R.randomRelic(); R.petXp(8); if (r) { R.addRelic(r.id); return `幽靈終於解脫了，留下遺物「${r.name}」！`; } R.gainXp(60); return '幽靈含笑消散，經驗 +60。'; }, ng: () => { R.damage(8, true); return '幽靈哭得更大聲了……被陰氣侵蝕（-8 生命）'; } },
    rift: { title: '時光裂縫：重答錯題', wrong: true, ok: () => { R.gainXp(60); const v = R.heal(R.p.maxHp * 0.25); return `你改寫了過去！經驗 +60、回復 ${v} 生命。`; }, ng: () => '裂縫慢慢闔上了……這題再多看幾次詳解吧。' }
  };
  function scholarQuiz() {
    const s = R.s, Z = QUIZ[s.pendingQuiz] || QUIZ.scholar;
    const used = new Set(s.queue.concat(s.used || []));
    let pool;
    if (Z.wrong) pool = Object.keys(Store.wrong).filter(id => !Store.wrong[id].done && Store.Q[id] && ['single', 'multi'].includes(Store.Q[id].type)).map(id => Store.Q[id]);
    else pool = Store.filter({ subjects: s.cfg.subjects || [], types: ['single', 'multi'] }).filter(q => !used.has(q.id));
    if (!pool.length) pool = window.QB.questions.filter(q => q.type === 'single');
    const q = U.pick(pool);
    const main = frame(`<div class="panel dark"><h2>${Z.title}</h2><div id="sq"></div></div>`);
    ctl = QV.render(U.$('#sq', main), q, {
      onAnswer: res => {
        Store.record(q.id, res.ok); SFX.play(res.ok ? 'correct' : 'wrong');
        s.pendingQuiz = null;
        U.toast(res.ok ? Z.ok() : Z.ng());
        R.save(); refreshSide(false);
      },
      nextLabel: R.abyss ? '回到地圖 ▶' : '前往下一層 ▶', onNext: toNext
    });
  }

  /* 隱藏首領的裂縫 */
  function riftScreen() {
    const s = R.s, d = C.SECRET_BOSS;
    const acc = Math.round(s.stats.correct / Math.max(1, s.stats.answered) * 100);
    const main = frame(`<div class="panel center rift-panel"><h2>？？？</h2>
      <div class="rift-crack">${SP.icon(d.tile, 120, 'anim-float', `filter:${d.filter};transform:scaleX(-1)`)}</div>
      <p>首領倒下的瞬間，空間像紙一樣被撕開了。裂縫另一端傳來低語：</p>
      <p class="gold-t">「命中率 ${acc}%……有意思。來挑戰一道你從沒見過的題目吧。」</p>
      <p class="small-t dim">隱藏首領：生命 ${d.hp}・機制 ${d.mechs.map(k => C.MECHS[k].name).join('、')}。挑戰前回復一半損失的生命；就算倒下，前面三章的通關紀錄也會保留。</p>
      <div class="row" style="justify-content:center"><button class="px-btn red big" id="rgo">踏入裂縫</button><button class="px-btn big" id="rno">見好就收（直接通關）</button></div></div>`);
    U.$('#rgo', main).onclick = () => { SFX.play('boss'); R.startSecret(true); route(); };
    U.$('#rno', main).onclick = () => { R.startSecret(false); route(); };
  }

  function camp() {
    const s = R.s, p = R.p;
    const heal = Math.round(p.maxHp * 0.3 * (R.has('ember') ? 1.5 : 1) * (R.D(4) ? 0.5 : 1));
    const main = frame(`<div class="panel center"><h2>篝火</h2>${SP.pix('campfire', 110)}<p class="dim">溫暖的火光讓人安心。你只能選擇一件事：</p><div class="col" id="cc" style="align-items:center"></div><div id="cm"></div></div>`);
    const box = U.$('#cc', main), msg = U.$('#cm', main);
    if (s.campDone) { msg.appendChild(nextFloorBtn()); return; }
    const acts = [
      { l: `休息：回復 ${heal} 生命`, f: () => { const v = R.heal(heal); SFX.play('heal'); return `好好睡了一覺，回復 ${v} 生命。`; } },
      { l: '鍛鍊：攻擊力 +2', f: () => { p.atk += 2; SFX.play('level'); return '揮劍百次，攻擊力 +2！'; } },
      { l: '複習錯題：答對得 35 經驗與 10 生命', f: null, review: true }
    ];
    acts.forEach(a => {
      const wrongIds = Object.keys(Store.wrong).filter(id => !Store.wrong[id].done && Store.Q[id] && ['single', 'multi'].includes(Store.Q[id].type));
      if (a.review && !wrongIds.length) return;
      const b = U.h(`<button class="px-btn" style="min-width:300px">${a.l}</button>`);
      b.onclick = () => {
        if (a.review) {
          const q = Store.Q[U.pick(wrongIds)];
          const m2 = frame(`<div class="panel dark"><h2>篝火旁的複習</h2><div id="rq"></div></div>`);
          ctl = QV.render(U.$('#rq', m2), q, {
            onAnswer: res => { Store.record(q.id, res.ok); SFX.play(res.ok ? 'correct' : 'wrong'); if (res.ok) { R.gainXp(35); R.heal(10); U.toast('複習成功！+35 經驗、+10 生命'); } s.campDone = true; R.save(); refreshSide(false); },
            nextLabel: R.abyss ? '回到地圖 ▶' : '前往下一層 ▶', onNext: toNext
          });
          return;
        }
        const t = a.f(); s.campDone = true; R.save();
        box.innerHTML = ''; msg.innerHTML = `<p class="gold-t">${t}</p>`; msg.appendChild(nextFloorBtn()); refreshSide(false);
      };
      box.appendChild(b);
    });
  }

  function shop() {
    const s = R.s;
    const main = frame(`<div class="panel"><div class="row">${SP.tile(86, 80, 'anim-bob')}<div><h2>流浪行商</h2><p class="dim">「嘿嘿，冒險者，看看我的好貨！」 你的金幣：<b class="gold-t" id="sg">${R.p.gold}</b></p></div></div>
      <div class="grid g3 mt" id="sl"></div></div>`);
    const list = U.$('#sl', main);
    function draw() {
      list.innerHTML = '';
      U.$('#sg').textContent = R.p.gold;
      s.shop.forEach(it => {
        let name, desc, icon;
        if (it.kind === 'item') { const d = C.ITEMS[it.id]; name = d.name; desc = d.desc; icon = d.icon; }
        else if (it.kind === 'relic') { const d = C.relic(it.id); name = '遺物：' + d.name; desc = d.desc; icon = d.icon; }
        else if (it.id === 'maxhp') { name = '生命藥草'; desc = '最大生命 +12 並回復 12'; icon = 'heart'; }
        else { name = '磨刀石'; desc = '攻擊力 +3'; icon = 106; }
        const card = U.h(`<div class="panel ${it.sold ? 'dim' : ''}" style="padding:10px"><div class="row">${SP.icon(icon, 40)}<div class="grow"><b>${name}</b><div class="small-t dim">${desc}</div></div></div>
          <button class="px-btn gold small mt" ${it.sold || R.p.gold < it.price ? 'disabled' : ''}>${it.sold ? '已售出' : `購買 ${it.price} 金`}</button></div>`);
        card.querySelector('button').onclick = () => {
          if (R.p.gold < it.price || it.sold) return;
          R.p.gold -= it.price; SFX.play('coin');
          if (it.kind === 'item') { R.addItem(it.id); }
          else { it.sold = true; if (it.kind === 'relic') R.addRelic(it.id); else if (it.id === 'maxhp') { R.p.maxHp += 12; R.heal(12); } else R.p.atk += 3; }
          if (it.kind === 'item' && U.chance(0.35)) it.sold = true;
          R.save(); draw(); refreshSide(false);
        };
        list.appendChild(card);
      });
    }
    draw();
    main.firstElementChild.appendChild(nextFloorBtn(R.abyss ? '離開商店，回到地圖 ▶' : '離開商店，前往下一層 ▶'));
  }

  function treasure() {
    const s = R.s;
    const main = frame(`<div class="panel center"><h2>寶箱</h2><div id="tc">${SP.tile(89, 110, 'anim-bob')}</div><div id="tm"></div></div>`);
    const tm = U.$('#tm', main);
    if (s.treasure) { tm.innerHTML = `<p class="gold-t">${s.treasure}</p>`; tm.appendChild(nextFloorBtn()); return; }
    const b = U.h('<button class="px-btn gold big">打開寶箱</button>');
    b.onclick = () => {
      SFX.play('open'); SFX.play('coin');
      U.$('#tc').innerHTML = SP.tile(90, 110, 'anim-pop');
      const g = R.gainGold(U.rnd(20, 40) + (R.abyss ? s.act * 10 : 0), true);
      let msg = `獲得 ${g} 金幣`;
      if (U.chance(0.6)) { const id = U.pick(['potion_s', 'potion_s', 'elixir', 'shield', 'elim', 'bomb', 'skip', 'potion_l']); R.addItem(id); msg += `、${C.ITEMS[id].name}`; }
      if (U.chance(R.abyss ? 0.3 : 0.12)) { const r = R.randomRelic(); if (r) { R.addRelic(r.id); msg += `，以及遺物「${r.name}」！`; } }
      s.treasure = msg; R.save(); refreshSide(false);
      tm.innerHTML = `<p class="gold-t">${msg}</p>`; tm.appendChild(nextFloorBtn());
    };
    tm.appendChild(b);
  }

  /* ---------------- 結算 ---------------- */
  function end() {
    const s = R.s, st = s.stats, P = Store.profile;
    if (!s.settled && s.phase === 'dead' && s.map && s.map.cur === 'secret') { s.phase = 'win'; st.secretLost = true; st.boss = true; }
    if (!s.settled) {
      const win = s.phase === 'win', dead = s.phase === 'dead', retreat = s.phase === 'retreat';
      let gems = st.correct * 2 + st.kills * 3 + st.elites * 5 + st.floorsCleared + (win ? 25 : 0) + (s.phase === 'out' ? 8 : 0);
      if (R.abyss) gems += st.bosses * 25 + (s.act - 1) * 15 + (win ? 40 : 0) + (st.secret ? 80 : 0);
      if (R.has('soul')) gems += st.kills * 2;
      gems = Math.round(gems * (1 + 0.1 * Store.upg('gem')) * (1 + 0.15 * (s.diff || 0)) * (retreat ? 0.5 : 1));
      const accXp = st.xp + st.correct * 5;
      const acc = st.answered ? st.correct / st.answered : 0;
      let stars = 0;
      if (!dead && !retreat) stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
      P.stats.runs++; if (win) P.stats.wins++; if (dead) P.stats.deaths++;
      P.stats.bestFloor = Math.max(P.stats.bestFloor, s.floor); P.stats.kills += st.kills; P.stats.bosses += st.bosses || (win ? 1 : 0);
      P.stats.gemsEarned += gems;
      if (s.cfg.examId) {
        const sg = P.stages[s.cfg.examId] || (P.stages[s.cfg.examId] = { stars: 0, clears: 0, best: 0 });
        sg.stars = Math.max(sg.stars, stars); if (stars) sg.clears++; sg.best = Math.max(sg.best, Math.round(acc * 100));
      }
      let unlocked = null;
      if (R.abyss) {
        const A = P.abyss;
        A.runs++; A.bestAct = Math.max(A.bestAct, win ? 4 : s.act);
        if (win) {
          A.clears++;
          (s.cfg.subjects || []).forEach(sj => { A.best[sj] = Math.max(A.best[sj] ?? -1, s.diff); });
          if (s.diff >= A.maxDiff && A.maxDiff < C.DIFFS.length - 1) { A.maxDiff = s.diff + 1; unlocked = A.maxDiff; }
        }
      }
      Store.addGems(gems);
      if (R.abyss && win && acc >= 0.95 && st.answered >= 20) Ach.unlock('perfect');
      setTimeout(() => Ach.check(), 600);
      const lvUps = Store.addAccXp(accXp);
      const clsUps = Store.addClassXp(s.cls, accXp);
      s.settled = { gems, accXp, stars, lvUps, clsUps, acc: Math.round(acc * 100), unlocked };
      Store.saveRun(null);
      SFX.play(win ? 'win' : dead ? 'lose' : 'coin');
    }
    BGM.play(s.phase === 'win' ? 'ending' : 'select');
    const r = s.settled;
    const title = R.abyss
      ? { win: '🏆 深淵制霸！三章全數通關', dead: `💀 倒在第 ${s.act} 章`, retreat: '🏃 撤退歸營' }[s.phase]
      : { win: '🏆 遠征成功！', dead: '💀 勇者倒下了', out: '📜 題目用盡，平安歸來', retreat: '🏃 撤退歸營' }[s.phase];
    const wrongs = [...new Set(st.wrongIds)];
    scr().innerHTML = `<div class="panel" style="max-width:820px;margin:0 auto">
      <h2 class="center" style="font-size:28px">${title}</h2>
      <div class="center">${SP.tile(Store.heroTile(s.cls), 96, s.phase === 'dead' ? '' : 'anim-bob', s.phase === 'dead' ? 'filter:grayscale(1) brightness(.6)' : '')}</div>
      ${st.secret ? '<div class="unlock-banner">👑 擊敗隱藏首領「命題委員・幻影」！額外魂晶 +80</div>' : st.secretLost ? '<div class="unlock-banner" style="opacity:.8">裂縫中的挑戰失敗了……但三章的通關紀錄已經保留。</div>' : ''}
      ${r.unlocked != null ? `<div class="unlock-banner">🔓 解鎖新難度：${C.DIFFS[r.unlocked].name}<div class="small-t">${C.DIFFS[r.unlocked].desc}</div></div>` : ''}
      ${!R.abyss && r.stars ? `<div class="center gold-t" style="font-size:28px">${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)}</div>` : ''}
      <div class="grid g3 mt">
        <div class="panel dark"><div class="dim">作答</div><b style="font-size:22px">${st.correct} / ${st.answered}</b><div class="small-t">命中率 ${r.acc}%</div></div>
        <div class="panel dark"><div class="dim">${R.abyss ? '深淵進度' : '到達樓層'}</div><b style="font-size:22px">${R.abyss ? `第 ${s.act} 章` : s.floor}</b><div class="small-t">擊敗 ${st.kills} 隻怪物${st.bosses ? `（首領 ${st.bosses}）` : ''}</div></div>
        <div class="panel dark"><div class="dim">獲得魂晶</div><b style="font-size:22px" class="purple-t">+${r.gems}</b><div class="small-t">帳號／${C.cls(s.cls).name}經驗 +${r.accXp}${r.lvUps ? `<br>帳號升 ${r.lvUps} 級！` : ''}${r.clsUps ? `<br><b class="gold-t">${C.cls(s.cls).name}升到 Lv.${Store.profile.classes[s.cls].lv}！</b>` : ''}${s.diff ? `<br>試煉加成 +${s.diff * 15}%` : ''}</div></div>
      </div>
      ${wrongs.length ? `<h3 class="mt">本局錯題（已自動收入錯題本）</h3><div class="qlist" id="wl"></div>` : '<p class="green-t center mt">本局沒有錯題，太強了！</p>'}
      <div class="row mt" style="justify-content:center">
        <button class="px-btn gold big" id="again">${R.abyss ? '再入深淵' : '再挑戰一次'}</button>
        <button class="px-btn big" id="home">回營地</button>
      </div></div>`;
    const wl = U.$('#wl');
    if (wl) wrongs.forEach(id => wl.appendChild(Screens.qrow(Store.Q[id])));
    U.$('#home').onclick = () => { window.CUR = null; App.go('hub'); };
    U.$('#again').onclick = () => { window.CUR = null; R.abyss ? App.go('abyss') : Screens.startRun(s.cfg); };
    if (r.lvUps) U.toast(`帳號升級！目前 Lv.${Store.profile.accLv}`);
  }

  return { start, route, stopTimer };
})();
