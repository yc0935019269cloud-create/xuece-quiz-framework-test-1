/* 進入點與畫面切換 */
const App = (() => {
  const TITLES = { hub: APP_TITLE, map: '冒險地圖', free: '自由遠征', abyss: '深淵遠征', classes: '職業殿堂', bank: '題庫', wrong: '錯題本', pets: '寵物小屋', upg: '永久強化', relics: '遺物圖鑑', bestiary: '怪物圖鑑', ach: '成就與收藏', pomo: '番茄鐘', learn: '學習模式', import: '導入素材', prompts: 'AI 提示詞', char: '統計', settings: '設定與存檔', run: '遠征中' };
  const MUSIC = { hub: 'title', run: null };
  function refreshTop() {
    U.$('#resGem').textContent = Store.profile.gems;
    U.$('#resLv').textContent = Store.profile.accLv;
    U.$('#btnSound').textContent = VOL.get('muted') ? '🔇' : (AMB.active().length ? '♪' + AMB.active().map(k => AMB.TYPES[k].icon).join('') : '♪');
  }
  function go(name, arg) {
    RunUI.stopTimer && RunUI.stopTimer();
    window.LEARN_UI && LEARN_UI.leave();
    U.$('#modalRoot').innerHTML = '';
    closeVol();
    U.$('#topTitle').textContent = TITLES[name] || APP_TITLE;
    window.scrollTo(0, 0);
    refreshTop();
    if (name !== 'run') BGM.play(MUSIC[name] || 'select');
    switch (name) {
      case 'run': return RunUI.start(arg);
      case 'map': return Screens.map();
      case 'free': return Screens.free();
      case 'abyss': return Screens.abyss();
      case 'classes': return Screens.classes();
      case 'bank': return Screens.bank(arg);
      case 'wrong': return Screens.wrongbook();
      case 'pets': return Screens.pets();
      case 'upg': return Screens.upg();
      case 'relics': return Screens.relics();
      case 'bestiary': return Screens.bestiary();
      case 'ach': return Screens.ach();
      case 'pomo': return POMO.screen(arg);
      case 'learn': return LEARN_UI.screen(arg);
      case 'import': return IMP.screen();
      case 'prompts': return PROMPTS_UI.screen();
      case 'char': return Screens.char();
      case 'settings': return Screens.settings();
      default: return Screens.hub();
    }
  }
  /* 頂部音量彈窗 */
  function closeVol() { const v = U.$('#volPop'); if (v) v.remove(); }
  function toggleVol() {
    if (U.$('#volPop')) return closeVol();
    const pop = U.h('<div id="volPop" class="panel"><h3>音量</h3></div>');
    pop.appendChild(Screens.volumeControls());
    document.body.appendChild(pop);
    setTimeout(() => document.addEventListener('pointerdown', function out(e) {
      if (!pop.contains(e.target) && e.target.id !== 'btnSound') { closeVol(); document.removeEventListener('pointerdown', out); }
      else if (!document.body.contains(pop)) document.removeEventListener('pointerdown', out);
    }), 0);
  }
  async function init() {
    try { await IMP.load(); } catch (e) { console.warn('導入素材載入失敗', e); }
    if (!window.QB.questions.length && !(window.LEARN.packs || []).length) U.toast('題庫還是空的：按營地的「📥 導入素材」，或把檔案放進 content/ 再執行 python tools/build.py', 7000);
    Store.onTop(refreshTop);
    U.$('#btnHome').onclick = () => { if (window.CUR) window.CUR.save(); window.CUR = null; go('hub'); };
    U.$('#btnSound').onclick = toggleVol;
    U.$('#btnSound').title = '音量設定';
    document.title = APP_TITLE;
    go('hub');
  }
  document.addEventListener('DOMContentLoaded', init);
  return { go, refreshTop };
})();
