/* 導入素材：選資料夾 → 自動辨識題庫／學習單元／科目設定／圖片 → 預覽確認 → 存進瀏覽器（IndexedDB），不必重新建置
 * 支援：xd-bank/1、xd-learn/1、xd-bundle/1、project.json、題目陣列、CSV（中英文欄名）、Markdown 裡的 ```json／```csv 區塊
 * 導入的內容在啟動時由 IMP.load() 併入 window.QB / window.LEARN。 */
const IMP = (() => {
  const DBN = SKEY('import');
  const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;
  const RAW_EXT = /\.(pdf|docx?|pptx?|xlsx?|key|pages|numbers|odt|odp|rtf|epub|hwp)$/i;
  const THEME_OPTS = [['sci', '自然科學／醫護'], ['math', '數學'], ['calc', '計算應用'], ['lit', '語文'], ['lang', '外語'], ['hist', '人文社會'], ['mix', '綜合']];

  /* ================= IndexedDB（失敗時退回 localStorage，但不存圖片） ================= */
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('no idb'));
      const r = indexedDB.open(DBN, 1);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('items')) d.createObjectStore('items', { keyPath: 'id' }); if (!d.objectStoreNames.contains('imgs')) d.createObjectStore('imgs'); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function tx(store, mode, fn) {
    const d = await db();
    return new Promise((res, rej) => {
      const t = d.transaction(store, mode), st = t.objectStore(store);
      let out; const r = fn(st); if (r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  }
  const LSK = DBN + '_items';
  async function allItems() {
    try { return (await tx('items', 'readonly', s => s.getAll())) || []; } catch (e) { try { return JSON.parse(localStorage.getItem(LSK) || '[]'); } catch (e2) { return []; } }
  }
  async function putItems(items) {
    try { await tx('items', 'readwrite', s => { items.forEach(it => s.put(it)); }); }
    catch (e) { const cur = (await allItems()).filter(x => !items.some(y => y.id === x.id)); localStorage.setItem(LSK, JSON.stringify(cur.concat(items))); }
  }
  async function delItem(id) {
    try { await tx('items', 'readwrite', s => s.delete(id)); } catch (e) { localStorage.setItem(LSK, JSON.stringify((await allItems()).filter(x => x.id !== id))); }
    try { const keys = await tx('imgs', 'readonly', s => s.getAllKeys()); await tx('imgs', 'readwrite', s => { keys.filter(k => k.startsWith('imp/' + id.replace(/[:/]/g, '_') + '/')).forEach(k => s.delete(k)); }); } catch (e) {}
  }
  async function putImgs(map) { try { await tx('imgs', 'readwrite', s => { Object.entries(map).forEach(([k, b]) => s.put(b, k)); }); return true; } catch (e) { return false; } }
  async function allImgs() {
    try {
      const d = await db();
      return await new Promise((res, rej) => {
        const out = {}, t = d.transaction('imgs', 'readonly'), c = t.objectStore('imgs').openCursor();
        c.onsuccess = () => { const cur = c.result; if (cur) { out[cur.key] = cur.value; cur.continue(); } };
        t.oncomplete = () => res(out); t.onerror = () => rej(t.error);
      });
    } catch (e) { return {}; }
  }

  /* ================= 啟動：併入遊戲 ================= */
  let loaded = [];
  async function load() {
    const items = await allItems();
    loaded = items;
    if (!items.length) return;
    const imgs = await allImgs();
    Object.entries(imgs).forEach(([k, b]) => { try { IMGMAP[k] = URL.createObjectURL(b); } catch (e) {} });
    merge(items);
  }
  function merge(items) {
    const QB = window.QB, L = window.LEARN || (window.LEARN = { packs: [] });
    items.filter(i => i.kind === 'subjects').forEach(i => i.data.forEach(sj => { if (!C.SUBJECTS[sj.id] || sj.override) C.addSubject(sj); }));
    items.filter(i => i.kind === 'bank').forEach(i => {
      const d = i.data, sid = d.exam.id;
      if (!C.SUBJECTS[d.exam.subj]) C.addSubject({ id: d.exam.subj, name: d.exam.subj, theme: 'mix' });
      let k = QB.exams.findIndex(e => e.id === sid); if (k >= 0) QB.exams.splice(k, 1);
      for (let j = QB.questions.length - 1; j >= 0; j--) if (QB.questions[j].exam === sid) QB.questions.splice(j, 1);
      QB.exams.push(d.exam); Object.assign(QB.groups, d.groups); QB.questions.push(...d.questions);
    });
    const order = Object.keys(C.SUBJECTS);
    QB.exams.sort((a, b) => (order.indexOf(a.subj) - order.indexOf(b.subj)) || ((a.order ?? 999) - (b.order ?? 999)) || String(a.year || '').localeCompare(String(b.year || '')) || a.id.localeCompare(b.id));
    items.filter(i => i.kind === 'learn').forEach(i => {
      const p = i.data; if (!C.SUBJECTS[p.subject]) C.addSubject({ id: p.subject, name: p.subject, theme: 'mix' });
      const k = L.packs.findIndex(x => x.id === p.id); if (k >= 0) L.packs.splice(k, 1);
      L.packs.push(p);
    });
    L.packs.sort((a, b) => (order.indexOf(a.subject) - order.indexOf(b.subject)) || ((a.order ?? 999) - (b.order ?? 999)) || a.id.localeCompare(b.id));
    QB.subjects = order.map(id => C.SUBJECTS[id]);
    Store.reindex(); LEARN_UI.reindex(); Screens.syncSubjects();
  }

  /* ================= 小工具 ================= */
  const str = v => v == null ? '' : Array.isArray(v) ? v.map(x => typeof x === 'string' ? x : '').join('\n') : typeof v === 'object' ? '' : String(v);
  const pick = (o, keys) => { for (const k of keys) if (o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k]; return undefined; };
  function hash(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); }
  function slug(s, pre) {
    const a = String(s || '').normalize('NFKC').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
    return a && a.length >= Math.min(3, String(s).length) && /[a-z0-9]/.test(a) && a.length * 2 >= String(s).replace(/\s/g, '').length ? a.slice(0, 40) : (pre || 'x') + '-' + hash(String(s));
  }
  const toHalf = s => String(s).replace(/[\uff01-\uff5e]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\u3000/g, ' ');
  const CIRC = '①②③④⑤⑥⑦⑧⑨⑩';
  const baseName = p => String(p).split(/[\\/]/).pop();
  const stripExt = p => baseName(p).replace(/\.[^.]+$/, '');

  /* 寬鬆 JSON：去 BOM、註解、結尾逗號、前後雜訊；智慧引號當作一般引號 */
  function looseJSON(text) {
    let t = String(text).replace(/^\uFEFF/, '').trim();
    try { return JSON.parse(t); } catch (e) {}
    const a = t.search(/[\[{]/); if (a < 0) throw new Error('找不到 JSON');
    let out = '', inS = false, esc = false, depth = 0, started = false;
    for (let i = a; i < t.length; i++) {
      let c = t[i];
      if (inS) { out += c; if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inS = false; continue; }
      if (c === '“' || c === '”') c = '"';
      if (c === '"') { inS = true; out += c; continue; }
      if (c === '/' && t[i + 1] === '/') { while (i < t.length && t[i] !== '\n') i++; out += '\n'; continue; }
      if (c === '/' && t[i + 1] === '*') { i = t.indexOf('*/', i + 2); if (i < 0) break; i++; continue; }
      if (c === '{' || c === '[') { depth++; started = true; }
      if (c === '}' || c === ']') depth--;
      out += c;
      if (started && depth === 0) break;
    }
    out = out.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(out);
  }
  /* CSV（RFC4180），自動判斷逗號或 Tab */
  function parseCSV(text) {
    text = String(text).replace(/^\uFEFF/, '');
    const first = text.split('\n')[0];
    const sep = (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? '\t' : ',';
    const rows = []; let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; continue; }
      if (c === '"' && f === '') { q = true; continue; }
      if (c === sep) { row.push(f); f = ''; continue; }
      if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; continue; }
      f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows.filter(r => r.some(x => String(x).trim() !== ''));
  }
  const HEAD = {
    n: /^(n|no|num|number|id|題號|編號|序號)$/i, type: /^(type|題型|類型)$/i, stem: /^(stem|question|q|題目|題幹|問題|內容)$/i,
    answer: /^(answer|ans|key|correct|答案|正解|解答)$/i, accept: /^(accept|其他答案|可接受答案|同義答案)$/i,
    explain: /^(explain|explanation|solution|詳解|解析|說明|解說)$/i, tags: /^(tags?|考點|標籤|關鍵字|keywords?)$/i,
    img: /^(img|image|images|圖片|圖|figure)$/i, level: /^(level|難度|difficulty)$/i, year: /^(year|年份|年度|學年度?)$/i,
    subject: /^(subject|科目|學科)$/i, set: /^(set|題本|試卷|卷別|章節|單元)$/i, group: /^(group|題組)$/i
  };
  function csvToSets(text, hint) {
    const rows = parseCSV(text); if (rows.length < 2) return [];
    const head = rows[0].map(h => String(h).trim()), map = {};
    head.forEach((h, i) => {
      const hh = toHalf(h).replace(/\s/g, '');
      const opt = hh.match(/^(?:選項|option|choice|opt)?\s*([A-Ja-j])$/i) || hh.match(/^(?:選項|option|choice)([1-9])$/i);
      if (opt) { const L = /\d/.test(opt[1]) ? String.fromCharCode(64 + Number(opt[1])) : opt[1].toUpperCase(); map['opt' + L] = i; return; }
      for (const [k, re] of Object.entries(HEAD)) if (re.test(hh) && map[k] === undefined) { map[k] = i; return; }
    });
    const bySet = {};
    rows.slice(1).forEach(r => {
      const g = k => map[k] !== undefined ? String(r[map[k]] ?? '').trim() : '';
      const choices = 'ABCDEFGHIJ'.split('').map(L => g('opt' + L)).filter(x => x !== '');
      const q = { n: g('n') || undefined, type: g('type') || undefined, stem: g('stem').replace(/\\n/g, '\n'), answer: g('answer'), explain: g('explain').replace(/\\n/g, '\n'),
        tags: g('tags'), img: g('img') ? g('img').split('|').map(s => s.trim()).filter(Boolean) : undefined, level: g('level') || undefined };
      if (choices.length) q.choices = choices;
      if (g('accept')) q.accept = [q.answer].concat(g('accept').split('|').map(s => s.trim()).filter(Boolean));
      const key = [g('subject'), g('year'), g('set')].join('|');
      (bySet[key] = bySet[key] || { set: { subject: g('subject') || undefined, year: g('year') || undefined, name: g('set') || undefined }, questions: [] }).questions.push(q);
    });
    const multi = Object.keys(bySet).length > 1;
    return Object.values(bySet).map(s => { s.set.name = s.set.name || (multi ? [s.set.year, s.set.subject, hint].filter(Boolean).join(' ') : hint); return s; });
  }

  /* ================= 題目正規化 ================= */
  function ansIdx(ans, n, choices) {
    if (ans === undefined || ans === null || typeof ans === 'boolean') return null;
    let out;
    if (typeof ans === 'number') out = [ans];
    else if (Array.isArray(ans) && ans.every(a => typeof a === 'number')) out = ans.slice();
    else {
      let s = toHalf(Array.isArray(ans) ? ans.join('') : String(ans)).trim();
      if (choices) { const i = choices.findIndex(c => c.trim() === s); if (i >= 0 && s.length > 2) return [i]; }
      s = s.replace(/^\s*(答案?|正解|ans(wer)?)\s*[:：]?/i, '').replace(/[①-⑩]/g, c => String(CIRC.indexOf(c) + 1))
        .replace(/\b(and|or)\b|和|與|及|&/gi, '').replace(/[\s,，、;；()（）\[\]{}.。]/g, '');
      if (/^[A-Ja-j]+$/.test(s)) out = s.toUpperCase().split('').map(c => c.charCodeAt(0) - 65);
      else if (/^[1-9]+$/.test(s)) out = s.split('').map(c => Number(c) - 1);
      else return null;
    }
    out = [...new Set(out)].sort((a, b) => a - b);
    return out.length && out.every(a => a >= 0 && a < n) ? out : null;
  }
  const TYPE_SYN = [[/^(single|mc|choice|單選|選擇|單一選擇)/i, 'single'], [/^(multi|multiple|mcq-?multi|多選|複選)/i, 'multi'], [/^(tf|true|bool|判斷|是非|對錯)/i, 'tf'],
    [/^(fill|blank|short|cloze|填|簡答)/i, 'fill'], [/^(open|essay|free|申論|問答|非選|手寫|計算|寫作|作文)/i, 'open']];
  const TF_TRUE = /^(true|t|o|○|◯|⭕|對|是|正確|yes|y|✓|✔|1)$/i, TF_FALSE = /^(false|f|x|×|✕|✗|❌|錯|否|錯誤|no|n|0)$/i;
  const LABEL_RE = /^\s*[\(（]?\s*([A-Ja-j]|[1-9]|[①-⑩])\s*[\)）.．、:：]\s*/;
  function normQuestion(raw, idx, W) {
    const n0 = pick(raw, ['n', 'no', 'num', 'number', '題號', 'id']);
    const n = n0 !== undefined && /^\d+$/.test(String(n0).trim()) ? Number(n0) : (n0 !== undefined ? String(n0) : idx + 1);
    const where = `第 ${n} 題`;
    let stem = str(pick(raw, ['stem', 'question', 'q', '題幹', '題目', 'text', 'prompt']));
    let choices = pick(raw, ['choices', 'options', '選項', 'opts_text']);
    if (choices && !Array.isArray(choices) && typeof choices === 'object') choices = Object.keys(choices).sort().map(k => choices[k]);
    if (Array.isArray(choices)) choices = choices.map(c => typeof c === 'object' && c ? str(pick(c, ['text', 'content', 'label', 'value'])) : str(c));
    if (!choices) { const cs = 'ABCDEFGHIJ'.split('').map(L => raw[L] ?? raw[L.toLowerCase()]).filter(x => x != null && x !== ''); if (cs.length >= 2) choices = cs.map(str); }
    if (choices && choices.length >= 2 && choices.every(c => LABEL_RE.test(c))) choices = choices.map(c => c.replace(LABEL_RE, ''));
    let imgs = pick(raw, ['img', 'imgs', 'image', 'images', 'figure', '圖片']); imgs = imgs ? (Array.isArray(imgs) ? imgs : String(imgs).split('|')).map(s => String(s).trim()).filter(Boolean) : [];
    let ans = pick(raw, ['answer', 'ans', 'key', 'correct', '答案', '正解']);
    const explain = str(pick(raw, ['explain', 'explanation', 'solution', 'analysis', '詳解', '解析', '解說']));
    let tags = pick(raw, ['tags', 'tag', '考點', '標籤', 'keywords']); tags = !tags ? [] : Array.isArray(tags) ? tags.map(String) : String(tags).split(/[|、,，;；]/).map(s => s.trim()).filter(Boolean);
    let type = String(pick(raw, ['type', '題型']) || '').trim(); type = (TYPE_SYN.find(([re]) => re.test(type)) || [0, ''])[1];
    const nopt = choices ? choices.length : Number(pick(raw, ['opts', 'option_count'])) || 0;
    if (!type) {
      if (typeof ans === 'boolean' || (!choices && (TF_TRUE.test(String(ans).trim()) || TF_FALSE.test(String(ans).trim())) && !/^\d+$/.test(String(ans).trim()))) type = 'tf';
      else if (nopt >= 2) { const ix = ansIdx(ans, nopt, choices); type = ix && ix.length > 1 ? 'multi' : 'single'; }
      else if (ans !== undefined && String(str(ans)).length <= 30 && !String(str(ans)).includes('\n')) type = 'fill';
      else type = 'open';
    }
    if (!stem && !imgs.length) { W.push(`${where}：沒有題幹也沒有圖片，已略過`); return null; }
    const rec = { id: '', exam: '', n, type, stem, imgs, ex: explain, tag: tags.join('、'), group: null, labels: 'alpha' };
    const lv = Number(pick(raw, ['level', '難度'])); if ([1, 2, 3].includes(lv)) rec.lv = lv;
    if (raw.marks) rec.marks = raw.marks;
    if (type === 'single' || type === 'multi') {
      if (nopt < 2) { W.push(`${where}：選擇題沒有選項（也沒有 opts），改成非選題`); rec.type = 'open'; rec.ans = str(ans) || '（見詳解）'; return rec; }
      const ix = ansIdx(ans, nopt, choices);
      if (!ix) { W.push(`${where}：看不懂答案「${str(ans)}」，已略過`); return null; }
      if (type === 'single' && ix.length > 1) { rec.type = 'multi'; W.push(`${where}：單選題有多個答案，已改成多選`); }
      if (choices) rec.choices = choices;
      rec.opts = nopt; rec.key = rec.ans = ix.map(i => String.fromCharCode(65 + i)).join('');
    } else if (type === 'tf') {
      let v = typeof ans === 'boolean' ? ans : TF_TRUE.test(String(ans).trim()) ? true : TF_FALSE.test(String(ans).trim()) ? false : null;
      if (v === null && choices) { const ix = ansIdx(ans, nopt, choices); if (ix) v = ix[0] === 0; }
      if (v === null) { W.push(`${where}：是非題答案「${str(ans)}」看不懂，已略過`); return null; }
      Object.assign(rec, { type: 'single', tf: true, choices: ['⭕ 對', '❌ 錯'], opts: 2, key: v ? 'A' : 'B', ans: v ? '⭕ 對' : '❌ 錯' });
    } else if (type === 'fill') {
      const list = Array.isArray(ans) ? ans.map(String) : ans !== undefined ? [String(ans)] : [];
      if (!list.length) { W.push(`${where}：填答題沒有答案，已略過`); return null; }
      rec.ans = list[0];
      const acc = raw.accept;
      if (acc !== false) rec.accept = [...new Set(list.concat(Array.isArray(acc) ? acc.map(String) : acc ? String(acc).split('|') : []))];
    } else rec.ans = str(ans) || '（見詳解）';
    if (!explain) W.push(`${where}：沒有詳解`);
    else if (explain.includes('答案存疑')) W.push(`${where}：AI 標記「答案存疑」，請確認`);
    return rec;
  }

  /* ================= 學習單元正規化 ================= */
  const KIND_SYN = { single: 'single', multi: 'multi', tf: 'tf', fill: 'fill', order: 'order', self: 'self', 單選: 'single', 多選: 'multi', 是非: 'tf', 填答: 'fill', 填空: 'fill', 排序: 'order', 自評: 'self' };
  function normCheck(c, where, W) {
    c.q = str(c.q || c.question || c.stem); c.kind = KIND_SYN[c.kind] || KIND_SYN[c.type] || (c.items ? 'order' : c.choices ? (Array.isArray(c.answer) && c.answer.length > 1 ? 'multi' : 'single') : typeof c.answer === 'boolean' ? 'tf' : 'fill');
    ['hint', 'explain'].forEach(k => { if (c[k] !== undefined) c[k] = str(c[k]); });
    if (!c.q) { W.push(`${where}：檢核題沒有題目，已略過`); return false; }
    if (c.kind === 'single' || c.kind === 'multi') {
      if (!Array.isArray(c.choices) || c.choices.length < 2) { W.push(`${where}：選擇題缺選項，已略過`); return false; }
      c.choices = c.choices.map(str);
      let a = c.answer;
      if (typeof a === 'string' || (Array.isArray(a) && a.some(x => typeof x === 'string'))) { const ix = ansIdx(a, c.choices.length, c.choices); if (ix) a = ix; }
      if (typeof a === 'number') a = [a];
      if (!Array.isArray(a) || !a.length || !a.every(x => Number.isInteger(x) && x >= 0 && x < c.choices.length)) { W.push(`${where}：答案格式不對，已略過`); return false; }
      if (c.kind === 'single' && a.length > 1) c.kind = 'multi';
      c.answer = c.kind === 'single' ? a[0] : [...new Set(a)].sort((x, y) => x - y);
    } else if (c.kind === 'tf') {
      if (typeof c.answer !== 'boolean') { const s = String(c.answer).trim(); if (TF_TRUE.test(s)) c.answer = true; else if (TF_FALSE.test(s)) c.answer = false; else { W.push(`${where}：是非題答案看不懂，已略過`); return false; } }
    } else if (c.kind === 'fill') {
      c.answer = (Array.isArray(c.answer) ? c.answer : [c.answer]).filter(x => x != null && x !== '').map(String);
      if (!c.answer.length) { W.push(`${where}：填答題沒有答案，已略過`); return false; }
    } else if (c.kind === 'order') {
      if (!Array.isArray(c.items) || c.items.length < 3) { W.push(`${where}：排序題至少要 3 項，已略過`); return false; }
      c.items = c.items.map(str);
    } else { c.answer = str(c.answer); }
    return true;
  }
  function normPack(p, hints, W) {
    p = JSON.parse(JSON.stringify(p));
    p.title = str(p.title) || hints.name || '未命名單元';
    p.id = p.id && /^[a-z0-9][a-z0-9-]*$/.test(p.id) ? p.id : slug(p.id || p.title, 'pack');
    let path = p.path; if (typeof path === 'string') path = path.split(/\s*[\/›>｜|]\s*/).filter(Boolean);
    if (!Array.isArray(path) || !path.length) path = (hints.folders || []).slice(-3).filter(f => !/^(learn|學習|content|bank|素材|輸出|output)$/i.test(f));
    if (p.unit && (!path.length || path[path.length - 1] !== p.unit)) path = path.concat([str(p.unit)]);
    p.path = path.map(String).filter(Boolean).slice(0, 5);
    p.unit = p.unit || p.path[p.path.length - 1] || p.title;
    ['desc', 'source'].forEach(k => { if (p[k] !== undefined) p[k] = str(p[k]); });
    const lessons = Array.isArray(p.lessons) ? p.lessons : [];
    const outL = [];
    lessons.forEach((l, li) => {
      l.id = l.id && /^[a-z0-9][a-z0-9-]*$/i.test(l.id) ? String(l.id).toLowerCase() : 'l' + (li + 1);
      l.title = str(l.title) || `第 ${li + 1} 課`;
      const base = p.id + '/' + l.id, steps = [];
      (l.steps || []).forEach((s, si) => {
        const where = `「${l.title}」第 ${si + 1} 步`;
        s.type = { 導入: 'intro', 概念: 'card', 檢核: 'check', 範例: 'example', 實戰: 'practice', 回顧: 'recap', 圖解: 'diagram', 互動: 'interactive' }[s.type] || s.type;
        ['body', 'title', 'tip', 'problem', 'task', 'source'].forEach(k => { if (s[k] !== undefined) s[k] = str(s[k]); });
        if (s.type === 'intro' || s.type === 'card') { if (!s.body && !s.img) { W.push(`${where}：${s.type} 沒有內容，已略過`); return; } }
        else if (s.type === 'check') { if (!normCheck(s, where, W)) return; s.id = s.id || 'c' + hash(base + s.q); }
        else if (s.type === 'example') { s.steps = (Array.isArray(s.steps) ? s.steps : [s.steps]).map(str).filter(Boolean); s.answer = str(s.answer); if (!s.problem || !s.steps.length) { W.push(`${where}：範例缺題目或步驟，已略過`); return; } }
        else if (s.type === 'practice') { s.checks = (s.checks || []).filter((c, ci) => normCheck(c, where + `實戰第 ${ci + 1} 題`, W)); s.checks.forEach(c => { c.id = c.id || 'c' + hash(base + c.q); }); s.qids = (s.qids || []).map(String); }
        else if (s.type === 'recap') { s.points = (Array.isArray(s.points) ? s.points : [s.points]).map(str).filter(Boolean); s.flash = (s.flash || []).filter(f => f && f.front && f.back).map(f => ({ front: str(f.front), back: str(f.back), id: f.id || 'f' + hash(base + str(f.front)) })); }
        else if (s.type === 'diagram') {
          const num = v => (v === null || v === undefined || v === '' || isNaN(Number(v)) || Number(v) < 0 || Number(v) > 100) ? null : Number(v);
          s.points = (s.points || []).map(pt => ({ x: num(pt.x), y: num(pt.y), name: str(pt.name || pt.label), desc: str(pt.desc || pt.description) })).filter(pt => pt.name);
          s.points.forEach(pt => { if (pt.x == null || pt.y == null) pt.x = pt.y = null; });
          if (!s.img || !s.points.length) { W.push(`${where}：圖解缺圖片或標記點，已略過`); return; }
          const np = s.points.filter(pt => pt.x == null).length;
          if (np) W.push(`${where}：圖解有 ${np} 個標記沒有座標，第一次開啟時會請你在圖上點出位置`);
        } else if (s.type === 'interactive') { s.html = str(s.html); if (!s.html) { W.push(`${where}：互動內容沒有 html，已略過`); return; } }
        else { W.push(`${where}：未知的步驟類型「${s.type}」，已略過`); return; }
        if (s.flash && s.flash.front && s.flash.back) s.flash = { front: str(s.flash.front), back: str(s.flash.back), id: s.flash.id || 'f' + hash(base + str(s.flash.front)) }; else delete s.flash;
        steps.push(s);
      });
      if (!steps.length) { W.push(`「${l.title}」沒有可用的步驟，已略過`); return; }
      l.steps = steps; l.goals = (l.goals || []).map(str); outL.push(l);
    });
    p.lessons = outL;
    return p;
  }

  /* ================= 科目與年份判斷 ================= */
  const SUBJ_KW = [
    [/國寫|作文|寫作/, 'chiw', '國寫', 'lit'], [/國文|國綜|國語文|中文/, 'chi', '國文', 'lit'], [/英文|英語|english|eng/i, 'eng', '英文', 'lang'],
    [/日文|日語|japanese/i, 'jpn', '日文', 'lang'], [/數學\s*a|數a|math\s*a/i, 'ma', '數學A', 'math'], [/數學\s*b|數b|math\s*b/i, 'mb', '數學B', 'calc'],
    [/數學甲|數甲/, 'ma_j', '數學甲', 'math'], [/數學乙|數乙/, 'ma_y', '數學乙', 'calc'], [/數學|math/i, 'math', '數學', 'math'],
    [/生理光學|視覺光學|physiological optics/i, 'physopt', '生理光學', 'sci'], [/幾何光學|光學/i, 'optics', '光學', 'sci'],
    [/視光|驗光|optometr/i, 'optom', '視光學', 'sci'], [/眼解剖|眼科|眼球|ophthal/i, 'eye', '眼科學', 'sci'],
    [/神經解剖|neuroanat/i, 'neuroanat', '神經解剖學', 'sci'], [/解剖|anatom/i, 'anat', '解剖學', 'sci'], [/生理學|physiolog/i, 'physio', '生理學', 'sci'],
    [/組織學|histolog/i, 'histo', '組織學', 'sci'], [/藥理|pharmac/i, 'pharm', '藥理學', 'sci'], [/病理|patholog/i, 'patho', '病理學', 'sci'],
    [/生化|biochem/i, 'biochem', '生物化學', 'sci'], [/物理|physics/i, 'phy', '物理', 'sci'], [/化學|chem/i, 'chem', '化學', 'sci'],
    [/生物|biolog/i, 'bio', '生物', 'sci'], [/地科|地球科學|earth/i, 'earth', '地球科學', 'sci'], [/自然|science/i, 'sci', '自然', 'sci'],
    [/歷史|history/i, 'his', '歷史', 'hist'], [/地理|geograph/i, 'geo', '地理', 'hist'], [/公民|civic/i, 'civ', '公民', 'hist'], [/社會|social/i, 'soc', '社會', 'hist'],
    [/會計|統計|經濟|財務|accounting|statistic/i, null, null, 'calc'], [/法律|法規|管理|law/i, null, null, 'hist'], [/程式|coding|program/i, null, null, 'math']
  ];
  const IGNORE_DIR = /^(content|bank|learn|題庫|學習|學習模式|素材|output|輸出|匯入|導入|import|img|images?|圖片|data|新增資料夾|new folder|\d+)$/i;
  function guessTheme(text) { const k = SUBJ_KW.find(([re]) => re.test(text)); return k ? k[3] : 'mix'; }
  /* hints：[{v 文字, strong 是否明確指定}] → {id, name, theme, isNew} */
  function resolveSubject(hints, pending) {
    const all = Object.assign({}, C.SUBJECTS); pending.forEach(s => { all[s.id] = all[s.id] || s; });
    for (const h of hints) {
      const v = String(h.v || '').trim(); if (!v || IGNORE_DIR.test(v)) continue;
      if (all[v]) return { id: v, name: all[v].name, theme: all[v].theme, isNew: !C.SUBJECTS[v] };
      const byName = Object.values(all).find(s => s.name === v || (v.length >= 2 && (s.name.includes(v) || v.includes(s.name)) && h.strong));
      if (byName) return { id: byName.id, name: byName.name, theme: byName.theme, isNew: !C.SUBJECTS[byName.id] };
      const kw = SUBJ_KW.find(([re, id]) => id && re.test(v));
      if (kw) { const ex = Object.values(all).find(s => s.id === kw[1] || s.name === kw[2]); return ex ? { id: ex.id, name: ex.name, theme: ex.theme, isNew: !C.SUBJECTS[ex.id] } : { id: kw[1], name: kw[2], theme: kw[3], isNew: true }; }
      if (h.strong) { const id = /^[a-z0-9_]+$/.test(v) ? v : slug(v, 's').replace(/-/g, '_'); return { id, name: v, theme: guessTheme(v), isNew: !all[id] }; }
    }
    const first = Object.keys(C.SUBJECTS)[0];
    return first ? { id: first, name: C.SUBJECTS[first].name, theme: C.SUBJECTS[first].theme, isNew: false, guessed: true } : { id: 'general', name: '綜合', theme: 'mix', isNew: true, guessed: true };
  }
  function guessYear(...texts) {
    const t = texts.filter(Boolean).join(' ');
    let m = t.match(/(1[0-2]\d)\s*(學年度?|學測|指考|分科|統測|會考|年度|年)/) || t.match(/(?:^|[^\d])(1[0-2]\d)(?=[\s_\-－.]*(?:學測|國|英|數|社|自|物|化|生|地|歷|公))/);
    if (m) return Number(m[1]);
    m = t.match(/(?:^|[^\d])((?:19|20)\d{2})(?:[^\d]|$)/); if (m) return Number(m[1]);
    return null;
  }

  /* ================= 掃描 ================= */
  function readText(f) { return f.text ? f.text() : new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(f); }); }
  function mdBlocks(text) {
    const out = [], re = /```([\w-]*)[^\n]*\n([\s\S]*?)```/g; let m, last = 0;
    while ((m = re.exec(text))) {
      const before = text.slice(last, m.index), fn = (before.match(/[\w\-.\/\u4e00-\u9fff（）()]+\.(json|csv|tsv)/gi) || []).pop();
      out.push({ lang: m[1].toLowerCase(), body: m[2], name: fn ? stripExt(fn) : '' }); last = m.index + m[0].length;
    }
    return out;
  }
  async function scan(files) {
    const R = { sets: [], packs: [], subjects: [], raw: [], bad: [], images: {}, warnings: [], nfiles: files.length };
    const docs = [];
    for (const f of files) {
      const rel = (f.webkitRelativePath || f._rel || f.name).replace(/\\/g, '/');
      if (/(^|\/)\.|~\$|thumbs\.db|desktop\.ini/i.test(rel)) continue;
      if (IMG_EXT.test(rel)) { R.images[rel] = f; continue; }
      if (RAW_EXT.test(rel)) { R.raw.push(rel); continue; }
      if (/\.(zip|rar|7z)$/i.test(rel)) { R.bad.push({ rel, why: '壓縮檔請先解壓縮，再選解壓縮後的資料夾' }); continue; }
      if (/\.(html?|js|css|py|log)$/i.test(rel)) continue;
      if (!/\.(json|csv|tsv|md|markdown|txt)$/i.test(rel)) { R.bad.push({ rel, why: '不支援的檔案類型' }); continue; }
      let text; try { text = await readText(f); } catch (e) { R.bad.push({ rel, why: '讀不到檔案' }); continue; }
      const folders = rel.split('/').slice(0, -1), name = stripExt(rel);
      if (/\.(csv|tsv)$/i.test(rel)) { docs.push({ rel, folders, name, csv: text }); continue; }
      if (/\.json$/i.test(rel)) {
        try { docs.push({ rel, folders, name, obj: looseJSON(text) }); } catch (e) { R.bad.push({ rel, why: 'JSON 格式錯誤：' + e.message }); }
        continue;
      }
      const blocks = mdBlocks(text);
      let got = 0;
      blocks.forEach((b, i) => {
        const nm = b.name || (blocks.length > 1 ? `${name}-${i + 1}` : name);
        if (b.lang === 'csv' || b.lang === 'tsv') { docs.push({ rel: rel + `#${i + 1}`, folders, name: nm, csv: b.body }); got++; return; }
        if (b.lang === 'json' || /^\s*[\[{]/.test(b.body)) { try { docs.push({ rel: rel + `#${i + 1}`, folders, name: nm, obj: looseJSON(b.body) }); got++; } catch (e) { R.bad.push({ rel: rel + ` 第 ${i + 1} 個程式碼區塊`, why: 'JSON 格式錯誤：' + e.message }); } }
      });
      if (!got && /^\s*[\[{]/.test(text)) { try { docs.push({ rel, folders, name, obj: looseJSON(text) }); got++; } catch (e) {} }
      if (!got) R.raw.push(rel);
    }
    // 先處理科目設定（讓後面的判斷用得到）
    const flat = [];
    const push = (d, obj) => flat.push(Object.assign({}, d, { obj }));
    docs.forEach(d => {
      if (d.csv !== undefined) { csvToSets(d.csv, d.name).forEach(s => push(d, s)); return; }
      const o = d.obj;
      if (Array.isArray(o)) {
        if (o.length && o.every(x => x && typeof x === 'object' && (x.lessons || x.schema === 'xd-learn/1'))) o.forEach(x => push(d, x));
        else if (o.length && o.every(x => x && typeof x === 'object' && (x.questions || x.schema === 'xd-bank/1'))) o.forEach(x => push(d, x));
        else push(d, { questions: o });
        return;
      }
      if (o && (o.schema === 'xd-bundle/1' || o.sets || o.packs || o.banks)) {
        if (o.subjects) push(d, { subjects: o.subjects, _cfg: true });
        (o.sets || o.banks || []).forEach(x => push(d, x)); (o.packs || o.learn || []).forEach(x => push(d, x));
        if (o.images && typeof o.images === 'object') Object.entries(o.images).forEach(([k, v]) => { if (/^data:image\//.test(v)) R.images[k] = dataToBlob(v); });
        return;
      }
      push(d, o);
    });
    flat.filter(d => d.obj && d.obj.subjects && (d.obj._cfg || d.obj.title || d.obj.id) && !d.obj.questions && !d.obj.lessons).forEach(d => {
      d.used = true;
      d.obj.subjects.forEach(s => { if (s && (s.id || s.name)) { const id = s.id && /^[a-z0-9_]+$/.test(s.id) ? s.id : slug(s.id || s.name, 's').replace(/-/g, '_'); R.subjects.push({ id, name: s.name || s.id, theme: C.THEMES[s.theme] ? s.theme : guessTheme(s.name || ''), desc: s.desc, words: s.words, color: s.color, region: s.region, isNew: !C.SUBJECTS[id] }); } });
    });
    const imgKeys = Object.keys(R.images);
    flat.filter(d => !d.used).forEach(d => {
      const o = d.obj || {};
      if (o.lessons || o.schema === 'xd-learn/1') {
        const W = []; const p = normPack(o, { name: d.name, folders: d.folders }, W);
        const sj = resolveSubject([{ v: o.subject, strong: true }, ...d.folders.slice().reverse().map(v => ({ v })), { v: d.name }, { v: p.title }, { v: p.unit }], R.subjects);
        if (sj.isNew && !R.subjects.some(s => s.id === sj.id)) R.subjects.push({ id: sj.id, name: sj.name, theme: sj.theme, isNew: true });
        p.subject = sj.id;
        const refs = []; p.lessons.forEach(l => l.steps.forEach(s => { if (s.img) refs.push(s.img); }));
        R.packs.push({ src: d.rel, pack: p, subj: sj, warn: W, refs, missing: refs.filter(r => !findImg(r, imgKeys, d.folders) && !/^(https?:|data:)/.test(r)) });
        return;
      }
      if (o.questions || o.schema === 'xd-bank/1') {
        const W = [], st = o.set || o;
        const name = str(pick(st, ['name', 'title', '名稱'])) || d.name;
        const sj = resolveSubject([{ v: pick(st, ['subject', 'subj', '科目']), strong: true }, ...d.folders.slice().reverse().map(v => ({ v })), { v: d.name }, { v: name }], R.subjects);
        if (sj.isNew && !R.subjects.some(s => s.id === sj.id)) R.subjects.push({ id: sj.id, name: sj.name, theme: sj.theme, isNew: true });
        const year = Number(pick(st, ['year', '年份', '年度', '學年度'])) || guessYear(name, d.name, d.folders.join(' '));
        const given = pick(st, ['id', 'set_id']);
        const id = given && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(given) ? given
          : /^[\x20-\x7e]+$/.test(name) ? slug(name, 'set') : `${sj.id.replace(/_/g, '-')}${year ? '-' + year : ''}-${hash(name).slice(0, 6)}`;
        const groups = {};
        (o.groups || []).forEach(g => { if (g && g.id) groups[g.id] = { text: str(g.text), imgs: (Array.isArray(g.img) ? g.img : g.img ? [g.img] : []).map(String), title: str(g.title), marks: g.marks }; });
        const qs = [];
        (o.questions || []).forEach((raw, i) => { if (!raw || typeof raw !== 'object') return; const q = normQuestion(raw, i, W); if (q) { const g = pick(raw, ['group', 'group_id', '題組']); if (g) q._g = String(g); qs.push(q); } });
        const refs = qs.flatMap(q => q.imgs).concat(Object.values(groups).flatMap(g => g.imgs));
        R.sets.push({ src: d.rel, id, name, year, subj: sj, source: str(pick(st, ['source', '來源'])), url: pick(st, ['source_url', 'pdf', 'url']), order: Number(st.order) || undefined,
          path: Array.isArray(st.path) ? st.path : d.folders.filter(f => !IGNORE_DIR.test(f) && f !== sj.name && f !== sj.id).slice(-2), groups, qs, warn: W, refs,
          missing: refs.filter(r => !findImg(r, imgKeys, d.folders) && !/^(https?:|data:)/.test(r)) });
        return;
      }
      R.bad.push({ rel: d.rel, why: '看不出是題庫還是學習單元（缺 questions 或 lessons）' });
    });
    // 同一個 id 分批輸出 → 合併
    const mergeSets = {}; R.sets = R.sets.filter(s => { const m = mergeSets[s.id]; if (!m) { mergeSets[s.id] = s; return true; } s.qs.forEach(q => { const k = m.qs.findIndex(x => String(x.n) === String(q.n)); k >= 0 ? m.qs[k] = q : m.qs.push(q); }); Object.assign(m.groups, s.groups); m.warn.push(...s.warn); m.refs.push(...s.refs); m.missing.push(...s.missing); m.src += '＋' + s.src; return false; });
    const mergePacks = {}; R.packs = R.packs.filter(p => { const m = mergePacks[p.pack.id]; if (!m) { mergePacks[p.pack.id] = p; return true; } p.pack.lessons.forEach(l => { const k = m.pack.lessons.findIndex(x => x.id === l.id); k >= 0 ? m.pack.lessons[k] = l : m.pack.lessons.push(l); }); m.warn.push(...p.warn); m.missing.push(...p.missing); m.refs.push(...p.refs); m.src += '＋' + p.src; return false; });
    R.sets.forEach(s => { s.qs.sort((a, b) => (typeof a.n === 'number' ? a.n : 1e6) - (typeof b.n === 'number' ? b.n : 1e6)); s.dup = loaded.some(i => i.id === 'bank:' + s.id); });
    R.packs.forEach(p => { p.dup = loaded.some(i => i.id === 'learn:' + p.pack.id); });
    return R;
  }
  function dataToBlob(u) { const [h, b] = u.split(','); const mime = h.match(/data:([^;]+)/)[1]; const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime }); }
  function findImg(ref, keys, folders) {
    if (!ref) return null;
    const r = String(ref).replace(/\\/g, '/').replace(/^\.?\//, '').toLowerCase();
    let k = keys.find(x => x.toLowerCase() === r) || keys.find(x => x.toLowerCase().endsWith('/' + r));
    if (k) return k;
    const b = baseName(r), same = keys.filter(x => baseName(x).toLowerCase() === b);
    if (same.length <= 1) return same[0] || null;
    const dir = (folders || []).join('/').toLowerCase();
    return same.sort((x, y) => (y.toLowerCase().startsWith(dir) ? 1 : 0) - (x.toLowerCase().startsWith(dir) ? 1 : 0))[0];
  }

  /* ================= 寫入 ================= */
  async function commit(R, opts) {
    const imgKeys = Object.keys(R.images), items = [], imgs = {};
    const subjUse = new Set();
    const mapImg = (ref, itemId, folders) => {
      if (!ref || /^(https?:|data:)/.test(ref)) return ref;
      const k = findImg(ref, imgKeys, folders); if (!k) return ref;
      const key = `imp/${itemId.replace(/[:/]/g, '_')}/${baseName(k)}`;
      imgs[key] = R.images[k]; return key;
    };
    for (const s of R.sets) {
      if (s.skip) continue;
      const iid = 'bank:' + s.id, folders = s.src.split('/').slice(0, -1);
      const prev = opts.merge[iid] && loaded.find(i => i.id === iid);
      const groups = {};
      Object.entries(s.groups).forEach(([gid, g]) => { const ns = s.qs.filter(q => q._g === gid).map(q => q.n).filter(n => typeof n === 'number'); groups[`${s.id}:${gid}`] = { text: g.text, title: g.title, marks: g.marks, imgs: g.imgs.map(r => mapImg(r, iid, folders)), range: ns.length ? [Math.min(...ns), Math.max(...ns)] : [0, 0] }; });
      let qs = s.qs.map(q => { const r = Object.assign({}, q, { id: `${s.id}-${q.n}`, exam: s.id, imgs: q.imgs.map(x => mapImg(x, iid, folders)), group: q._g && s.groups[q._g] ? `${s.id}:${q._g}` : null }); delete r._g; return r; });
      if (prev) { const old = prev.data.questions.filter(o => !qs.some(q => q.id === o.id)); qs = old.concat(qs); Object.keys(prev.data.groups).forEach(k => { if (!groups[k]) groups[k] = prev.data.groups[k]; }); }
      const seen = new Set(); qs = qs.filter(q => !seen.has(q.id) && seen.add(q.id));
      const exam = { id: s.id, subj: s.subj.id, name: s.name, title: s.name, year: s.year || null, pdf: s.url || null, source: s.source || '', order: s.order, count: qs.length, path: s.path, imported: true };
      items.push({ id: iid, kind: 'bank', name: s.name, subj: s.subj.id, n: qs.length, ts: Date.now(), src: s.src, data: { exam, groups, questions: qs } });
      subjUse.add(s.subj.id);
    }
    for (const p of R.packs) {
      if (p.skip) continue;
      const iid = 'learn:' + p.pack.id, folders = p.src.split('/').slice(0, -1);
      const pk = p.pack; pk.subject = p.subj.id; pk.imported = true;
      pk.lessons.forEach(l => l.steps.forEach(s => { if (s.img) s.img = mapImg(s.img, iid, folders); }));
      const prev = opts.merge[iid] && loaded.find(i => i.id === iid);
      if (prev) prev.data.lessons.forEach(l => { if (!pk.lessons.some(x => x.id === l.id)) pk.lessons.push(l); });
      items.push({ id: iid, kind: 'learn', name: pk.title, subj: pk.subject, n: pk.lessons.length, ts: Date.now(), src: p.src, data: pk });
      subjUse.add(p.subj.id);
    }
    const prevSub = (loaded.find(i => i.id === 'subjects') || { data: [] }).data;
    const newSub = R.subjects.filter(s => subjUse.has(s.id) || s.keep).map(s => ({ id: s.id, name: s.name, theme: s.theme, desc: s.desc, words: s.words, color: s.color, region: s.region }));
    if (newSub.length) items.push({ id: 'subjects', kind: 'subjects', ts: Date.now(), data: prevSub.filter(x => !newSub.some(y => y.id === x.id)).concat(newSub) });
    const okImg = Object.keys(imgs).length ? await putImgs(imgs) : true;
    await putItems(items);
    return { items: items.length, imgs: Object.keys(imgs).length, okImg };
  }

  /* ================= 畫面：導入素材 ================= */
  const scr = () => U.$('#screen');
  function screen() {
    scr().innerHTML = `<div class="panel imp">
      <h2>📥 導入素材</h2>
      <p>選一個資料夾（或多個檔案），遊戲會自動辨識裡面的<b>題庫</b>、<b>學習單元</b>、<b>科目設定</b>和<b>圖片</b>，判斷科目與年份，讓你確認後直接加進遊戲——不用重新建置。</p>
      <div class="imp-drop" id="impDrop">
        <div class="row" style="justify-content:center">
          <label class="px-btn gold big">📁 選擇資料夾<input type="file" id="impDir" webkitdirectory directory multiple hidden></label>
          <label class="px-btn big">📄 選擇檔案<input type="file" id="impFiles" multiple accept=".json,.csv,.tsv,.md,.txt,.png,.jpg,.jpeg,.gif,.webp,.svg" hidden></label>
        </div>
        <p class="dim small-t center">也可以把資料夾或檔案直接拖曳到這裡</p>
      </div>
      <details class="mt"><summary>可以導入哪些東西？</summary><div class="small-t">
        <ul><li>AI 依「📋 AI 提示詞」產出的 JSON（題庫 <code>xd-bank/1</code>、學習單元 <code>xd-learn/1</code>、整包 <code>xd-bundle/1</code>）。</li>
        <li>整段 AI 回覆存成的 <code>.md</code>／<code>.txt</code>：會自動找出裡面的 <code>&#96;&#96;&#96;json</code>、<code>&#96;&#96;&#96;csv</code> 區塊。</li>
        <li>Excel 另存的 CSV（UTF-8）：欄名可用中文（題號、題型、題目、選項A～E、答案、詳解、標籤、圖片、年份、科目、題本）。</li>
        <li>題目截圖、解剖圖等圖片：和 JSON 放在同一個資料夾，檔名對得上就會自動配對。</li>
        <li>同一個題本／單元分好幾批輸出（id 相同）會自動合併。</li>
        <li>PDF、Word、PPT 這類<b>原始素材</b>不能直接導入，請先到「📋 AI 提示詞」複製提示詞，交給 AI 轉換。</li></ul></div></details>
      <div id="impBody" class="mt"></div>
    </div>`;
    const go = files => { if (files && files.length) analyze([...files]); };
    U.$('#impDir').onchange = e => go(e.target.files);
    U.$('#impFiles').onchange = e => go(e.target.files);
    const dz = U.$('#impDrop');
    dz.ondragover = e => { e.preventDefault(); dz.classList.add('over'); };
    dz.ondragleave = () => dz.classList.remove('over');
    dz.ondrop = async e => { e.preventDefault(); dz.classList.remove('over'); go(await dropFiles(e.dataTransfer)); };
    manager();
  }
  async function dropFiles(dt) {
    const out = [], entries = [...dt.items].map(i => i.webkitGetAsEntry && i.webkitGetAsEntry()).filter(Boolean);
    if (!entries.length) return [...dt.files];
    const walk = (en, path) => new Promise(res => {
      if (en.isFile) en.file(f => { f._rel = path + f.name; out.push(f); res(); }, () => res());
      else { const r = en.createReader(), all = []; const read = () => r.readEntries(async es => { if (!es.length) { for (const x of all) await walk(x, path + en.name + '/'); res(); } else { all.push(...es); read(); } }, () => res()); read(); }
    });
    for (const en of entries) await walk(en, '');
    return out;
  }
  async function manager() {
    const body = U.$('#impBody'); if (!body) return;
    const items = (await allItems()).filter(i => i.kind !== 'subjects');
    const sub = (loaded.find(i => i.id === 'subjects') || { data: [] }).data;
    body.innerHTML = `<h3>已導入的內容 <span class="dim small-t">（存在這台電腦的瀏覽器裡）</span></h3>
      ${items.length ? `<div class="imp-list">${items.sort((a, b) => b.ts - a.ts).map(i => `<div class="imp-item"><span class="tag ${i.kind === 'bank' ? 'single' : 'ok'}">${i.kind === 'bank' ? '題庫' : '學習'}</span>
        <b>${U.esc(i.name)}</b><span class="dim small-t">${U.esc((C.SUBJECTS[i.subj] || { name: i.subj }).name)}・${i.kind === 'bank' ? `${i.n} 題` : `${i.n} 課`}・${new Date(i.ts).toLocaleDateString()}</span>
        <span class="grow"></span><button class="px-btn small" data-exp="${U.esc(i.id)}">下載</button><button class="px-btn small red" data-del="${U.esc(i.id)}">刪除</button></div>`).join('')}</div>` : '<p class="dim">還沒有導入任何內容。</p>'}
      ${sub.length ? `<p class="small-t dim">導入時新增的科目：${sub.map(s => `${U.esc(s.name)}（${C.THEMES[s.theme] ? C.THEMES[s.theme].name : s.theme}）`).join('、')}</p>` : ''}
      <div class="row mt">${items.length ? '<button class="px-btn blue" id="impBak">💾 下載全部（含圖片，一個檔案）</button><button class="px-btn red small" id="impClr">清除全部導入內容</button>' : ''}</div>
      <p class="dim small-t">「下載」的檔案可以給學生或別台電腦用「導入素材」直接載入；也可以放進 <code>content/</code> 資料夾讓它變成內建內容。作答紀錄、錯題本不受刪除影響。</p>`;
    U.$$('[data-del]', body).forEach(b => b.onclick = async () => { if (!(await U.confirm('刪除導入內容', '確定要刪除這一份嗎？（可以之後再導入一次）'))) return; await delItem(b.dataset.del); U.toast('已刪除，重新載入中…'); setTimeout(() => location.reload(), 500); });
    U.$$('[data-exp]', body).forEach(b => b.onclick = () => exportBundle([b.dataset.exp]));
    const bak = U.$('#impBak'); if (bak) bak.onclick = () => exportBundle(null);
    const clr = U.$('#impClr'); if (clr) clr.onclick = async () => {
      if (!(await U.confirm('清除全部導入內容', '所有導入的題庫、學習單元、圖片與新增科目都會從這台電腦移除（作答紀錄保留）。確定嗎？'))) return;
      for (const i of await allItems()) await delItem(i.id);
      try { await tx('imgs', 'readwrite', s => s.clear()); } catch (e) {}
      U.toast('已清除，重新載入中…'); setTimeout(() => location.reload(), 500);
    };
  }
  async function exportBundle(ids) {
    const all = await allItems(), sel = ids ? all.filter(i => ids.includes(i.id)) : all;
    const imgs = await allImgs(), images = {};
    const need = new Set(); sel.forEach(i => JSON.stringify(i.data).replace(/imp\/[^"\\]+/g, m => { need.add(m); return m; }));
    for (const k of need) if (imgs[k]) images[k] = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(imgs[k]); });
    const sets = sel.filter(i => i.kind === 'bank').map(i => ({ schema: 'xd-bank/1', set: { id: i.data.exam.id, subject: i.data.exam.subj, name: i.data.exam.name, year: i.data.exam.year || undefined, source: i.data.exam.source, path: i.data.exam.path },
      groups: Object.entries(i.data.groups).map(([k, g]) => ({ id: k.split(':').pop(), title: g.title, text: g.text, img: g.imgs, marks: g.marks })),
      questions: i.data.questions.map(q => ({ n: q.n, type: q.tf ? 'tf' : q.type, stem: q.stem, choices: q.tf ? undefined : q.choices, opts: q.choices ? undefined : q.opts, answer: q.tf ? q.key === 'A' : q.key || (q.accept ? q.accept : q.ans), accept: q.type === 'fill' && !q.accept ? false : undefined, explain: q.ex, tags: q.tag ? q.tag.split('、') : [], img: q.imgs, marks: q.marks, level: q.lv, group: q.group ? q.group.split(':').pop() : undefined })) }));
    const packs = sel.filter(i => i.kind === 'learn').map(i => i.data);
    const subjects = ((all.find(i => i.id === 'subjects') || {}).data || []).filter(s => sets.some(x => x.set.subject === s.id) || packs.some(p => p.subject === s.id));
    const out = { schema: 'xd-bundle/1', title: APP_TITLE, exported: new Date().toISOString(), subjects, sets, packs, images };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' }));
    a.download = `${ids && sel.length === 1 ? sel[0].name : APP_TITLE + '_導入內容'}_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  }

  /* ---------- 分析結果與確認 ---------- */
  async function analyze(files) {
    const body = U.$('#impBody');
    body.innerHTML = `<p class="gold-t">正在分析 ${files.length} 個檔案…</p>`;
    let R;
    try { R = await scan(files); } catch (e) { console.error(e); body.innerHTML = `<p class="red-t">分析失敗：${U.esc(e.message)}</p>`; return; }
    review(R);
  }
  function subjOptions(sel, R) {
    const list = Object.values(C.SUBJECTS).map(s => [s.id, s.name]).concat(R.subjects.filter(s => !C.SUBJECTS[s.id]).map(s => [s.id, s.name + '（新）']));
    return list.map(([v, l]) => `<option value="${U.esc(v)}" ${v === sel ? 'selected' : ''}>${U.esc(l)}</option>`).join('') + '<option value="__new">＋ 新增科目…</option>';
  }
  function review(R) {
    const body = U.$('#impBody');
    const nImg = Object.keys(R.images).length;
    const typeCount = qs => { const c = {}; qs.forEach(q => { const t = q.tf ? '是非' : QV.TYPE_NAME[q.type]; c[t] = (c[t] || 0) + 1; }); return Object.entries(c).map(([k, v]) => `${k}×${v}`).join(' '); };
    const newSubs = () => R.subjects.filter(s => !C.SUBJECTS[s.id] && (R.sets.some(x => !x.skip && x.subj.id === s.id) || R.packs.some(x => !x.skip && x.subj.id === s.id)));
    const draw = () => {
      const ns = newSubs();
      body.innerHTML = `<h3>辨識結果</h3>
        <p class="small-t">共 ${R.nfiles} 個檔案：題本 <b class="gold-t">${R.sets.length}</b>、學習單元 <b class="gold-t">${R.packs.length}</b>、圖片 ${nImg} 張${R.raw.length ? `、原始素材 ${R.raw.length} 個` : ''}${R.bad.length ? `、<span class="red-t">無法辨識 ${R.bad.length} 個</span>` : ''}</p>
        ${ns.length ? `<div class="imp-sec"><h4>新科目</h4>${ns.map(s => `<div class="imp-row"><input class="px-in" data-sname="${s.id}" value="${U.esc(s.name)}" style="width:160px">
          <select class="px-in" data-stheme="${s.id}">${THEME_OPTS.map(([v, l]) => `<option value="${v}" ${s.theme === v ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="dim small-t">代號 ${U.esc(s.id)}・主題決定地區、首領與怪物</span></div>`).join('')}</div>` : ''}
        ${R.sets.length ? `<div class="imp-sec"><h4>題庫</h4>${R.sets.map((s, i) => `<div class="imp-card ${s.skip ? 'skip' : ''}">
          <div class="imp-row"><label><input type="checkbox" data-sk="s${i}" ${s.skip ? '' : 'checked'}></label>
            <input class="px-in" data-sn="${i}" value="${U.esc(s.name)}" style="flex:1;min-width:160px">
            <select class="px-in" data-ss="${i}">${subjOptions(s.subj.id, R)}</select>
            <input class="px-in" data-sy="${i}" value="${s.year || ''}" placeholder="年份" style="width:70px"></div>
          <div class="small-t">${s.qs.length} 題：${typeCount(s.qs)}${s.refs.length ? `・圖片 ${s.refs.length - s.missing.length}/${s.refs.length}` : ''}${s.subj.guessed ? '・<span class="gold-t">科目是猜的，請確認</span>' : ''}
            ${s.dup ? `・已導入過：<select class="px-in small" data-sm="${i}"><option value="merge">合併（補題、更新同題號）</option><option value="replace" ${s.mode === 'replace' ? 'selected' : ''}>整份取代</option></select>` : ''}</div>
          <div class="dim small-t">來源：${U.esc(s.src)}</div>
          ${s.missing.length ? `<div class="red-t small-t">找不到圖片：${s.missing.slice(0, 8).map(U.esc).join('、')}${s.missing.length > 8 ? ` 等 ${s.missing.length} 張` : ''}（把截圖放進同一個資料夾、檔名對上後重新導入）</div>` : ''}
          ${s.warn.length ? `<details class="small-t"><summary class="gold-t">⚠ ${s.warn.length} 則提醒</summary>${s.warn.slice(0, 60).map(w => `<div>・${U.esc(w)}</div>`).join('')}</details>` : ''}</div>`).join('')}</div>` : ''}
        ${R.packs.length ? `<div class="imp-sec"><h4>學習單元</h4>${R.packs.map((p, i) => `<div class="imp-card ${p.skip ? 'skip' : ''}">
          <div class="imp-row"><label><input type="checkbox" data-sk="p${i}" ${p.skip ? '' : 'checked'}></label>
            <b style="flex:1">${U.esc(p.pack.title)}</b><select class="px-in" data-ps="${i}">${subjOptions(p.subj.id, R)}</select></div>
          <div class="imp-row"><span class="small-t">分類：</span><input class="px-in" data-pp="${i}" value="${U.esc(p.pack.path.join(' / '))}" placeholder="例如：高一 / 上學期 / 第3章" style="flex:1"></div>
          <div class="small-t">${p.pack.lessons.length} 課、${p.pack.lessons.reduce((a, l) => a + l.steps.length, 0)} 步${p.refs.length ? `・圖片 ${p.refs.length - p.missing.length}/${p.refs.length}` : ''}${p.dup ? `・已導入過：<select class="px-in small" data-pm="${i}"><option value="merge">合併（補課、更新同一課）</option><option value="replace" ${p.mode === 'replace' ? 'selected' : ''}>整份取代</option></select>` : ''}</div>
          <div class="dim small-t">來源：${U.esc(p.src)}</div>
          ${p.missing.length ? `<div class="red-t small-t">找不到圖片：${p.missing.slice(0, 8).map(U.esc).join('、')}</div>` : ''}
          ${p.warn.length ? `<details class="small-t"><summary class="gold-t">⚠ ${p.warn.length} 則提醒</summary>${p.warn.slice(0, 60).map(w => `<div>・${U.esc(w)}</div>`).join('')}</details>` : ''}</div>`).join('')}</div>` : ''}
        ${R.raw.length ? `<div class="imp-sec"><h4>原始素材（需要先交給 AI 轉換）</h4><div class="small-t">${R.raw.slice(0, 20).map(U.esc).join('<br>')}${R.raw.length > 20 ? `<br>…等 ${R.raw.length} 個` : ''}</div>
          <p class="small-t">這些是講義、考卷等原始檔。請到 <button class="px-btn small" id="impToP">📋 AI 提示詞</button> 複製適合的提示詞，連同檔案交給 AI，再把 AI 的輸出存進資料夾導入。</p></div>` : ''}
        ${R.bad.length ? `<div class="imp-sec"><h4 class="red-t">無法辨識</h4><div class="small-t">${R.bad.slice(0, 30).map(b => `${U.esc(b.rel)}：${U.esc(b.why)}`).join('<br>')}</div>
          <p class="small-t dim">JSON 格式錯誤時，可以把錯誤訊息和檔案一起交給 AI，用提示詞「修正格式錯誤」修好。</p></div>` : ''}
        <div class="row mt"><button class="px-btn" id="impCancel">取消</button><span class="grow"></span>
          <button class="px-btn gold big" id="impOK" ${R.sets.some(s => !s.skip) || R.packs.some(p => !p.skip) ? '' : 'disabled'}>✔ 確認導入</button></div>`;
      bind();
    };
    const setSubj = (obj, v) => {
      if (v === '__new') {
        const name = (window.prompt('新科目名稱（例如：解剖學、生理光學、113學測英文）') || '').trim(); if (!name) return draw();
        const kw = SUBJ_KW.find(([re, id]) => id && re.test(name));
        let id = kw && !C.SUBJECTS[kw[1]] && !R.subjects.some(s => s.id === kw[1]) ? kw[1] : slug(name, 's').replace(/-/g, '_');
        R.subjects.push({ id, name, theme: guessTheme(name), isNew: true }); obj.subj = { id, name, isNew: true };
      } else obj.subj = { id: v, name: (C.SUBJECTS[v] || R.subjects.find(s => s.id === v) || {}).name || v };
      draw();
    };
    function bind() {
      U.$$('[data-sk]', body).forEach(c => c.onchange = () => { const k = c.dataset.sk, o = k[0] === 's' ? R.sets[+k.slice(1)] : R.packs[+k.slice(1)]; o.skip = !c.checked; draw(); });
      U.$$('[data-sn]', body).forEach(x => x.onchange = () => { R.sets[+x.dataset.sn].name = x.value.trim() || R.sets[+x.dataset.sn].name; });
      U.$$('[data-sy]', body).forEach(x => x.onchange = () => { R.sets[+x.dataset.sy].year = Number(x.value) || null; });
      U.$$('[data-ss]', body).forEach(x => x.onchange = () => setSubj(R.sets[+x.dataset.ss], x.value));
      U.$$('[data-ps]', body).forEach(x => x.onchange = () => setSubj(R.packs[+x.dataset.ps], x.value));
      U.$$('[data-pp]', body).forEach(x => x.onchange = () => { R.packs[+x.dataset.pp].pack.path = x.value.split(/\s*[\/›>｜|]\s*/).filter(Boolean); });
      U.$$('[data-sm]', body).forEach(x => x.onchange = () => { R.sets[+x.dataset.sm].mode = x.value; });
      U.$$('[data-pm]', body).forEach(x => x.onchange = () => { R.packs[+x.dataset.pm].mode = x.value; });
      U.$$('[data-sname]', body).forEach(x => x.onchange = () => { const s = R.subjects.find(y => y.id === x.dataset.sname); if (s) s.name = x.value.trim() || s.name; });
      U.$$('[data-stheme]', body).forEach(x => x.onchange = () => { const s = R.subjects.find(y => y.id === x.dataset.stheme); if (s) s.theme = x.value; });
      const tp = U.$('#impToP'); if (tp) tp.onclick = () => App.go('prompts');
      U.$('#impCancel').onclick = () => { U.$('#impBody').innerHTML = ''; manager(); };
      U.$('#impOK').onclick = async () => {
        const btn = U.$('#impOK'); btn.disabled = true; btn.textContent = '導入中…';
        const merge = {};
        R.sets.forEach(s => { merge['bank:' + s.id] = s.dup && s.mode !== 'replace'; });
        R.packs.forEach(p => { merge['learn:' + p.pack.id] = p.dup && p.mode !== 'replace'; });
        try {
          const res = await commit(R, { merge });
          SFX.play('win');
          U.toast(`導入完成：${R.sets.filter(s => !s.skip).length} 份題本、${R.packs.filter(p => !p.skip).length} 個學習單元${res.imgs ? `、${res.imgs} 張圖片` : ''}${res.okImg ? '' : '（圖片儲存失敗）'}，重新載入中…`, 3000);
          setTimeout(() => location.reload(), 1200);
        } catch (e) { console.error(e); btn.disabled = false; btn.textContent = '✔ 確認導入'; U.toast('導入失敗：' + e.message, 5000); }
      };
    }
    draw();
  }

  function tileDesc() {
    const it = loaded.filter(i => i.kind !== 'subjects');
    return it.length ? `已導入 ${it.filter(i => i.kind === 'bank').length} 份題本、${it.filter(i => i.kind === 'learn').length} 個學習單元` : '選資料夾，自動辨識題庫與學習單元';
  }
  return { load, screen, scan, tileDesc, looseJSON, parseCSV, normQuestion, resolveSubject, guessYear, get loaded() { return loaded; } };
})();
