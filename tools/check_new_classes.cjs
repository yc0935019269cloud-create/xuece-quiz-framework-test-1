/* Deterministic mechanics QA. Uses VM fixtures only; never touches browser storage. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const report = { checks: [], storage: 'VM fixtures; no browser or user storage accessed' };
function check(name, fn) { fn(); report.checks.push(name); }
const ctx = vm.createContext({ window: {}, Math: Object.create(Math), console,
  U: { rnd: a => a, pick: a => a[0], pickN: (a,n) => a.slice(0,n), chance: () => false },
  Store: { profile: { classes: {}, pets: {}, bestiary: {}, activePet: null, relicsUnlocked: [] }, upg: () => 0,
    record() {}, saveRun() {}, petXp() { return 0; }, saveProfile() {} } });
ctx.Math.random = () => 0.5;
vm.runInContext(fs.readFileSync(path.join(root, 'js/content.js'), 'utf8') + '\nglobalThis.C = C;', ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/run.js'), 'utf8') + '\nglobalThis.Run = Run;', ctx);
const { C, Run } = ctx;
function run(id, lv = 1) {
  const r = Run.create({ cls: id }, Array(300).fill('fixture'));
  r.p.lv = lv; r.p.xp = 0;
  r.s.mon = { hp: 100000, maxHp: 100000, atk: 10, traits: [], mechs: [] };
  r.s.phase = 'battle'; r.s.floor = 1;
  return r;
}
const question = { id: 'fixture', type: 'single' };
const answer = (r, ok = true) => r.resolve(question, { ok });
const hit = ev => ev.find(x => x.t === 'hit').dmg;
check('8 classes, 40 distinct skills, 3 free default actor tiles', () => {
  assert.equal(C.CLASSES.length, 8); assert.equal(new Set(C.ALL_SKILLS.map(k => k.id)).size, 40);
  for (const id of ['assassin', 'monk', 'bard']) assert.equal(C.cls(id).tile, `ha:px_${id}_m1`);
});
check('Assassin opening bonus triggers only against full-health enemy', () => {
  const full = run('assassin'), hurt = run('assassin'); hurt.s.mon.hp--;
  assert.equal(hit(answer(full)), 15); assert.equal(hit(answer(hurt)), 11);
});
check('Assassin level 10 hunter guarantees low-health critical', () => {
  const r = run('assassin', 10); r.s.mon.hp = 20000;
  assert.equal(answer(r).find(e => e.t === 'hit').crit, true);
});
check('Assassin base dodge works at 5% boundary', () => {
  const r = run('assassin'); ctx.Math.random = () => 0.01;
  const hp = r.p.hp; assert.ok(answer(r, false).some(e => e.t === 'dodge')); assert.equal(r.p.hp, hp);
  ctx.Math.random = () => 0.5;
});
check('Monk shields at 3/6 combo and resets cadence on wrong answer', () => {
  const r = run('monk'); answer(r); answer(r); assert.equal(r.s.shield, 0);
  answer(r); assert.equal(r.s.shield, 4);
  answer(r); answer(r); answer(r); assert.equal(r.s.shield, 8);
  answer(r, false); assert.equal(r.s.combo, 0); answer(r); answer(r); assert.equal(r.s.shield, 0);
  answer(r); assert.equal(r.s.shield, 4);
});
check('Monk focus skill, cap and larger skill shields are preserved', () => {
  const r = run('monk', 10); r.s.combo = 2; answer(r); assert.equal(r.s.shield, 7);
  r.s.shield = 13; r.s.combo = 5; answer(r); assert.equal(r.s.shield, 14);
  r.s.shield = 30; r.s.combo = 8; answer(r); assert.equal(r.s.shield, 30);
});
check('Monk accelerated combo crossing a threshold triggers one shield', () => {
  const r = run('monk'); r.s.relics = ['sliderule']; r.s.combo = 1;
  r.resolve({ ...question, type: 'fill' }, { ok: true });
  assert.equal(r.s.combo, 3); assert.equal(r.s.shield, 4);
});
check('Bard fourth correct has damage/heal, failures do not reset song', () => {
  const r = run('bard'); r.p.hp = 20;
  answer(r); answer(r); answer(r, false); answer(r); r.s.combo = 0;
  const hp = r.p.hp; const ev = answer(r);
  assert.equal(hit(ev), 12); assert.equal(r.p.hp, hp + 4); assert.ok(ev.some(e => e.name === '和弦'));
});
check('Bard level 10 encore heals 7, capped by maximum health', () => {
  const r = run('bard', 10); r.p.hp = 20; r.s.bf.okN = 3;
  answer(r); assert.equal(r.p.hp, 27);
  r.p.hp = r.p.maxHp - 1; r.s.bf.okN = 7; answer(r); assert.equal(r.p.hp, r.p.maxHp);
});
check('New class passives survive JSON save/reload', () => {
  for (const id of ['assassin', 'monk', 'bard']) {
    const r = run(id); answer(r); answer(r);
    const reloaded = new Run(JSON.parse(JSON.stringify(r.s))); answer(reloaded);
    assert.ok(Number.isFinite(reloaded.p.hp)); assert.ok(Number.isFinite(reloaded.s.shield));
    assert.equal(reloaded.s.combo, 3);
    if (id === 'monk') assert.equal(reloaded.s.shield, 4);
  }
});
check('New active skills gate levels and cooldowns, alter intended state', () => {
  for (const id of ['assassin', 'monk', 'bard']) {
    for (const k of C.cls(id).skills.filter(k => k.cd)) {
      const r = run(id); assert.equal(r.useSkill(k.id), false); r.p.lv = 10; r.p.hp = 10;
      assert.equal(r.useSkill(k.id), true); assert.equal(r.s.cd[k.id], k.cd); assert.equal(r.useSkill(k.id), false);
      const bf = r.s.bf;
      if (k.kind === 'double') assert.equal(bf.double, true);
      if (k.kind === 'smite') assert.equal(bf.smite, k.val);
      if (k.kind === 'leech') { assert.equal(bf.leech, k.val); assert.equal(bf.smite, k.mult); }
      if (k.kind === 'dodge') assert.equal(bf.dodgeNext, true);
      if (k.kind === 'heal') assert.ok(r.p.hp > 10);
      if (k.kind === 'shield') assert.equal(r.s.shield, Math.round(r.p.maxHp * k.val));
      if (k.kind === 'rage') assert.equal(bf.rage, k.val);
      if (k.kind === 'freeze') assert.equal(bf.freeze, true);
      answer(r); assert.equal(r.s.cd[k.id], k.cd - 1);
    }
  }
});
check('Double strike, leech, dodge, shield, freeze resolve actual answers', () => {
  const a = run('assassin', 10); a.useSkill('a_cross'); assert.ok(answer(a).some(e => e.t === 'extra'));
  a.p.hp = 10; a.useSkill('a_siphon'); answer(a); assert.ok(a.p.hp > 10);
  a.useSkill('a_vanish'); const hp = a.p.hp; answer(a, false); assert.equal(a.p.hp, hp);
  const m = run('monk', 10); m.useSkill('o_guard'); const mhp = m.p.hp; answer(m, false); assert.equal(m.p.hp, mhp);
  const b = run('bard', 10); b.useSkill('d_lullaby'); const bhp = b.p.hp; answer(b, false); assert.equal(b.p.hp, bhp);
});
check('Legacy knight damage/reduction and ranger/cleric passives unchanged', () => {
  const k = run('knight'); assert.equal(hit(answer(k)), 10); const hp = k.p.hp; answer(k, false); assert.equal(k.p.hp, hp - 7);
  assert.equal(run('ranger').p.comboCap, 8);
  const c = run('cleric'); c.p.hp = 20; answer(c); assert.equal(c.p.hp, 22);
  const old = new Run(JSON.parse(JSON.stringify(k.s))); answer(old); assert.ok(Number.isFinite(old.p.hp));
});

// Evaluate the actual learning combat closures with minimal UI stubs; no copied formulas.
const source = fs.readFileSync(path.join(root, 'js/learn.js'), 'utf8');
function closure(name, next) { return source.slice(source.indexOf(`    function ${name}(`), source.indexOf(`    function ${next}(`)); }
function learn(id) {
  const l = vm.createContext({ clsId: id, Math: Object.create(Math), B: { hp: 3, max: 5, combo: 0, maxCombo: 0, shield: 0, en: 3, ults: 0, falls: 0 },
    m: { hp: 1000, max: 1000, charged: false, shell: false }, BON: () => true,
    U: { $: () => null, pct: () => 0 }, save() {}, hud() {}, anim() {}, banner() {}, say() {}, drawMon() {},
    setTimeout: () => 0, HAPTIC: { buzz() {} }, FX: { impact() {}, attack: () => new Promise(() => {}), monStrike: () => new Promise(() => {}), critical: () => new Promise(() => {}) },
    SFX: { combo() {}, play() {} }, lb: { classList: { add() {}, remove() {} } }, enrage: () => false });
  l.Math.random = () => 0.5;
  const ultDefinition = source.slice(source.indexOf('    const ULT = {'), source.indexOf('    const classBattleHint = {'));
  vm.runInContext('function monAt(){return m;}\n' + ultDefinition + closure('onRightHit', 'onWrongHit') + closure('onWrongHit', 'ult') + closure('ult', 'enrage'), l);
  return l;
}
check('Learning assassin opening/crit bonus and dodge preserves stored shield', () => {
  const l = learn('assassin'); l.onRightHit(true); assert.equal(l.m.hp, 986);
  const d = learn('assassin'); d.B.shield = 1; d.Math.random = () => 0.01; d.onWrongHit();
  assert.equal(d.B.hp, 3); assert.equal(d.B.shield, 1);
});
check('Learning monk cadence grants one block; charged attacks are blocked', () => {
  const l = learn('monk'); l.onRightHit(true); l.onRightHit(true); l.onRightHit(true); assert.equal(l.B.shield, 1);
  l.m.charged = true; l.onWrongHit(); assert.equal(l.B.hp, 3); assert.equal(l.B.shield, 0);
});
check('Learning bard song heals on fourth first-try correct only', () => {
  const l = learn('bard'); l.onRightHit(true); l.onRightHit(false); assert.equal(l.m.songN, 1);
  l.onRightHit(true); l.onRightHit(true); l.onRightHit(true); assert.equal(l.B.hp, 4); assert.equal(l.m.songN, 4);
});
check('All 3 learning ultimates apply differentiated damage and recovery', () => {
  const a = learn('assassin'); a.B.combo = 3; a.ult(); assert.equal(a.m.hp, 950); assert.equal(a.B.en, 0);
  const m = learn('monk'); m.ult(); assert.equal(m.m.hp, 968); assert.equal(m.B.hp, 4); assert.equal(m.B.shield, 1);
  const b = learn('bard'); b.ult(); assert.equal(b.m.hp, 968); assert.equal(b.B.hp, 4); assert.equal(b.B.en, 1);
});
check('Learning ultimates break shell/charge and cannot cast without energy', () => {
  const l = learn('bard'); l.m.shell = true; l.m.charged = true; l.ult();
  assert.equal(l.m.shell, false); assert.equal(l.m.charged, false); const hp = l.m.hp; l.ult(); assert.equal(l.m.hp, hp);
});
const fxContext = vm.createContext({ window: {}, Math: Object.create(Math) }); fxContext.Math.random = () => 0.5;
vm.runInContext(fs.readFileSync(path.join(root, 'js/fx.js'), 'utf8') + '\nglobalThis.FX = FX;', fxContext);
check('Each new class has four unique animations; shuffle bag covers all four', () => {
  for (const id of ['assassin', 'monk', 'bard']) {
    assert.equal(Object.keys(fxContext.FX.ATTACKS[id]).length, 4);
    assert.equal(new Set(Array.from({ length: 4 }, () => fxContext.FX.pickAttack(id))).size, 4);
  }
});
report.passed = report.checks.length;
const out = path.join(root, 'docs/hero-art/new-class-mechanics-qa.json');
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: report.passed, report: path.relative(root, out) }));
