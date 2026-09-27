/* 成就與隱藏要素的紀錄（存在 xd_profile.ach） */
const Ach = (() => {
  const P = () => Store.profile;
  function has(id) { return !!(P().ach && P().ach[id]); }
  function unlock(id) {
    const p = P(); p.ach = p.ach || {};
    if (p.ach[id]) return false;
    const a = C.ACH.find(x => x.id === id); if (!a) return false;
    p.ach[id] = Date.now(); p.gems += a.gem; p.stats.gemsEarned += a.gem;
    Store.saveProfile();
    setTimeout(() => { SFX.play('win'); U.toast(`🏅 ${a.hidden ? '隱藏' : ''}成就解鎖「${a.name}」！魂晶 +${a.gem}`); }, 400);
    return true;
  }
  /* 依累計數據檢查（在營地、結算時呼叫） */
  function check() {
    const p = P(), st = p.stats, A = p.abyss, camp = p.camp || {};
    const fish = camp.fish || {};
    const best = Object.values(A.best || {});
    const conds = {
      first_win: st.wins >= 1,
      abyss_clear: A.clears >= 1,
      diff3: best.some(v => v >= 3),
      diff6: best.some(v => v >= 6),
      kill100: st.kills >= 100, kill500: st.kills >= 500,
      ans300: st.answered >= 300, ans1000: st.answered >= 1000,
      boss10: (A.bossKills || 0) + (st.bosses || 0) >= 10,
      streak7: (p.streak && p.streak.n) >= 7,
      wrong30: Object.values(Store.wrong).filter(w => w.done).length >= 30,
      bestiary: C.MONSTERS.filter(m => !m.secret && p.bestiary[m.id]).length >= 40,
      petlv10: Object.values(p.pets).some(x => x.lv >= 10),
      fisher: Object.values(fish).reduce((a, b) => a + b, 0) >= 10,
      fishall: CampFun.FISH.every(f => fish[f.id]),
      flower: (camp.bloom || 0) >= 1,
      bugs: (camp.bugs || 0) >= 30,
      goldslime: !!p.bestiary.goldslime
    };
    Object.entries(conds).forEach(([k, v]) => { if (v) unlock(k); });
  }
  return { has, unlock, check };
})();
