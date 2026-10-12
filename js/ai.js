/* AI 助教：浮動聊天視窗（頂部 ☰ 選單、營地「AI 助教」、題目詳解旁的「💬 問 AI」都能開）。
 * - 問題先在本機題庫與學習教材裡找最相關的段落（中文雙字詞 BM25），連同問題送給 AI，回答附 [1][2] 出處，點了可以開題目或課程。
 * - AI 走雲端同步同一個 Supabase 專案的轉送程式（supabase/functions/ai-chat）：金鑰只在 Supabase，網頁只送登入憑證。
 *   需要登入（信箱驗證碼）；預設不限次數，管理員可以在後台對個別帳號設上限或停用。說明：docs/AI助教設定.md
 * - 在學習模式的課程裡，視窗會出現「✨ 把這頁講得更好懂」：把目前這一步（概念卡、範例、檢核題…，見 learn.js 的 pageCtx）附給 AI 重新講解。
 * - 🔎 查證：用 AI 回答最後附的關鍵字查維基百科與 PubMed（網頁直接查，不扣次數），可以再請 AI 對照（扣 1 次）。
 * - 對話只存在這次開啟的記憶體裡，不進存檔、不同步。 */
const AI = (() => {
  const MAX_CTX = 5200, PER_DOC = 700, TOP = 6, HISTORY = 6;
  const S = { msgs: [], q: null, busy: false, st: null, stErr: '' };
  let panel = null, list, inp, sendBtn, stEl, ctxEl, pageEl;

  /* ---------- 連線 ---------- */
  const cfg = () => (typeof CLOUD !== 'undefined' && CLOUD.cfg && CLOUD.cfg()) || null;
  const endpoint = c => { try { return localStorage.getItem('ai_endpoint') || c.url + '/functions/v1/ai-chat'; } catch (e) { return c.url + '/functions/v1/ai-chat'; } };
  async function refreshStatus() {
    const c = cfg();
    if (!c) { S.st = { reason: 'nocfg' }; return paintStatus(); }
    if (!CLOUD.signedIn) { S.st = { reason: 'login' }; return paintStatus(); }
    try {
      const tk = await CLOUD.token();
      const r = await fetch(c.url + '/rest/v1/rpc/ai_status', { method: 'POST', headers: { apikey: c.key, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' }, body: '{}' });
      const j = await r.json().catch(() => null);
      if (r.status === 404) S.st = { reason: 'nosetup' };
      else if (!r.ok || !j) S.st = { reason: 'err', msg: (j && j.message) || 'HTTP ' + r.status };
      else S.st = j.allowed ? j : { reason: j.reason || 'blocked', email: j.email };
    } catch (e) { S.st = { reason: 'err', msg: e.message }; }
    paintStatus();
  }
  function paintStatus() {
    if (!stEl) return;
    const st = S.st || {};
    let h;
    if (st.allowed) h = (st.limit == null ? `<span class="dim">不限次數・今天問了 ${st.used || 0} 次</span>` : `今天還可以問 <b class="gold-t">${st.remaining}</b> / ${st.limit} 次`) + `<span class="dim">・${U.esc(CLOUD.email || '')}</span>`;
    else if (st.reason === 'login') h = `登入後就能使用（和雲端同步同一個帳號）<button class="px-btn small blue" data-ai="login">登入</button>`;
    else if (st.reason === 'blocked') h = `<span class="red-t">這個帳號（${U.esc(st.email || CLOUD.email || '')}）的 AI 助教已被停用。</span>`;
    else if (st.reason === 'nocfg') h = '<span class="dim">這個網頁還沒有設定雲端專案，無法使用 AI 助教。</span>';
    else if (st.reason === 'nosetup') h = '<span class="dim">雲端專案還沒有建立 AI 助教（見 docs/AI助教設定.md）。</span>';
    else if (st.reason === 'err') h = `<span class="red-t">讀取狀態失敗：${U.esc(st.msg || '')}</span>`;
    else h = '<span class="dim">讀取中…</span>';
    stEl.innerHTML = h;
  }

  /* ---------- 本機知識檢索 ---------- */
  let KB = null;
  const decode = s => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; };   // &#039; 這類符號轉回文字
  const plain = s => String(s || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/<[^>]+>/g, '').replace(/\*\*|__|`/g, '').replace(/[ \t]+/g, ' ').trim();
  // 問句裡常見、對檢索沒幫助的雙字詞
  const STOP = new Set('什麼 為什 麼是 答案 選項 其他 哪裡 在哪 錯在 這題 這個 請問 解釋 可以 一下 下列 何者 正確 錯誤 敘述 如何 怎麼 為何 是否 還是 請你 告訴 說明 以及 因為 所以 如果 的是 是什 有什 一個 不是 沒有'.split(' '));
  const qterms = s => terms(s).filter(t => !STOP.has(t));
  function terms(s) {
    s = String(s || '').normalize('NFKC').toLowerCase();
    const out = [];
    (s.match(/[㐀-鿿]+/g) || []).forEach(run => { if (run.length === 1) out.push(run); for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2)); });
    (s.match(/[a-z0-9α-ω]{2,}/g) || []).forEach(w => out.push(w));
    return out;
  }
  function buildKB() {
    const docs = [];
    (window.QB.questions || []).forEach(q => {
      const ex = Store.EX[q.exam]; if (!ex) return;
      const ch = (q.choices || []).map((c, i) => `${QV.labelOf(q, i)}. ${plain(c)}`).join('\n');
      docs.push({ k: 'q', id: q.id, subj: ex.subj, title: `${QV.exLabel(ex).replace(/^【[^】]*】\s*/, '')}・第 ${q.n} 題`,
        text: [plain(q.stem), ch, `答案：${q.ans}`, q.ex ? '詳解：' + plain(q.ex) : '', q.tag ? '考點：' + q.tag : ''].filter(Boolean).join('\n') });
    });
    const packs = typeof LEARN_UI !== 'undefined' ? LEARN_UI.packs : [];
    packs.forEach(p => p.lessons.forEach(l => l.steps.forEach((s, si) => {
      if (s.type !== 'card' && s.type !== 'recap' && s.type !== 'diagram') return;
      const pts = (s.points || []).map(x => typeof x === 'string' ? x : `${x.name}${x.desc ? '：' + x.desc : ''}`);
      docs.push({ k: 'card', pack: p.id, sid: `${p.id}/${l.id}/${si}`, subj: p.subject, title: `${p.title}・${l.title}${s.title ? '・' + s.title : s.type === 'recap' ? '・本課重點' : ''}`,
        text: [s.title, plain(s.body), ...(s.keys || []).map(plain), ...pts.map(plain)].filter(Boolean).join('\n') });
    })));
    const post = new Map(), len = [];
    docs.forEach((d, i) => {
      const tf = new Map(); const ts = terms(d.title + '\n' + d.text);
      ts.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
      tf.forEach((n, t) => { let a = post.get(t); if (!a) post.set(t, a = []); a.push(i, n); });
      len.push(ts.length);
    });
    KB = { docs, post, len, avg: len.reduce((a, b) => a + b, 0) / Math.max(1, len.length), packN: packs.length };
  }
  function search(query, subj, skip) {
    if (!(skip instanceof Set)) skip = new Set(skip ? [skip] : []);
    // 學習單元可能稍後才載入（導入素材在 IndexedDB），數量變了就重建
    if (!KB || KB.packN !== (typeof LEARN_UI !== 'undefined' ? LEARN_UI.packs.length : 0)) buildKB();
    const qt = [...new Set(qterms(query))], N = KB.docs.length, sc = new Float64Array(N);
    qt.forEach(t => {
      const a = KB.post.get(t); if (!a) return;
      const df = a.length / 2, idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      for (let i = 0; i < a.length; i += 2) { const d = a[i], f = a[i + 1]; sc[d] += idf * f * 2.2 / (f + 1.2 * (0.25 + 0.75 * KB.len[d] / KB.avg)); }
    });
    const idx = [];
    for (let i = 0; i < N; i++) if (sc[i] > 0 && !skip.has(KB.docs[i].id) && !skip.has(KB.docs[i].sid)) idx.push(i);
    if (subj) idx.forEach(i => { if (KB.docs[i].subj === subj) sc[i] *= 1.3; });
    idx.sort((a, b) => sc[b] - sc[a]);
    // 教材卡最多 3 筆排前面（講觀念），其餘給題庫題（講考法）
    const best = idx.length ? sc[idx[0]] : 0;
    const cards = idx.filter(i => KB.docs[i].k === 'card' && sc[i] >= best * 0.4).slice(0, 3), qs = idx.filter(i => KB.docs[i].k === 'q');
    const pick = cards.concat(qs).slice(0, TOP * 2);
    const out = []; let used = 0;
    for (const i of pick) {
      const d = KB.docs[i], txt = d.text.length > PER_DOC ? d.text.slice(0, PER_DOC) + '…' : d.text;
      if (used + txt.length > MAX_CTX || out.length >= TOP) break;
      used += txt.length; out.push({ ...d, text: txt });
    }
    return out;
  }

  /* ---------- 送出 ---------- */
  const SYSTEM = () => `你是「${APP_TITLE}」裡的 AI 助教，學生多半是台灣驗光系大學生，準備期中考與驗光師國考。
規則：
1. 一律用繁體中文（台灣用語），專有名詞可以附英文。
2. 先根據使用者訊息裡的【參考資料】回答，用到哪一筆就在句尾標 [1]、[2]。參考資料是這門課的題庫與教材；彼此衝突時以老師講義與題庫詳解為準。
3. 參考資料不夠時可以用一般專業知識補充，但那一段開頭要標「（補充，非課程教材）」。不確定的事直接說不確定，不要編造數值、年份或出處。
4. 計算題寫出公式、代入過程與單位，一步一步算，注意正負號慣例。
5. 不要用 LaTeX 或 $ 符號；公式用一般文字寫，例如 P = P₁ + P₂、V = U + P、f = 1/P。
6. 要好懂：先一句話講結論，再分點說明，需要時舉生活例子；精簡，不要重抄題目。
7. 如果附了【目前的學習頁面】，那是學生在學習模式正在看的畫面，「這頁」「這題」指的就是它。請你「講得更好懂」時，不要只是換句話說：先用一句話講重點並給一個生活比喻，再拆成很小的步驟（一步只做一件事），最後點出容易搞錯的地方；名詞、數值、正負號慣例要和頁面一致。頁面上的圖片和互動動畫你看不到，需要時請學生描述。
8. 標示「學生還沒作答」的題目：除非學生明確要答案，否則只講需要的觀念和思考方向，不要說出正確答案，也不要一路排除到只剩一個選項。
9. 回答最後另起一行，照這個格式輸出查證用關鍵字（學生看不到這行）：
查證關鍵字：中文關鍵字1, 中文關鍵字2｜English keyword 1, English keyword 2`;
  const TODO = '※ 學生還沒作答這題：除非學生明確要答案，否則不要說出正確答案。';
  function qBlock(q, todo) {
    const ex = Store.EX[q.exam];
    const ch = (q.choices || []).map((c, i) => `${QV.labelOf(q, i)}. ${plain(c)}`).join('\n');
    return `【目前在看的題目】（${ex ? QV.exLabel(ex) : ''}・第 ${q.n} 題）\n${plain(q.stem)}\n${ch}\n正確答案：${q.ans}${q.ex ? '\n題庫詳解：' + plain(q.ex) : ''}${todo ? '\n' + TODO : ''}`;
  }
  /* 學習模式目前的頁面（不在課程裡就是 null） */
  const page = () => (typeof LEARN_UI !== 'undefined' && LEARN_UI.pageCtx && LEARN_UI.pageCtx()) || null;
  const EASY = '請把這一頁講得更好懂：先用一句話說重點、舉一個生活比喻，再一步一步慢慢解釋，最後提醒我容易搞錯的地方。';
  const EASY_Q = '這題我還沒作答，請把這題要用到的觀念講得更好懂，告訴我該怎麼想，但先不要告訴我答案。';
  function askPage() {
    const pg = page(); if (!pg) { U.toast('請先打開學習模式的課程'); return; }
    send(pg.todo ? EASY_Q : EASY, { page: pg, show: '✨ 把這頁講得更好懂' });
  }
  // 萬一還是寫了 LaTeX（$...$），轉成一般文字
  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const deTex = t => t.replace(/\$\$?([^$\n]{1,200}?)\$\$?/g, (m, x) => x
    .replace(/\\(?:text|mathrm|mathbf)\{([^}]*)\}/g, '$1').replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
    .replace(/\\times/g, '×').replace(/\\cdot/g, '·').replace(/\\approx/g, '≈').replace(/\\pm/g, '±').replace(/\\(?:to|rightarrow)/g, '→')
    .replace(/_\{?(\d)\}?/g, (a, d) => SUB[d]).replace(/\^\{?2\}?/g, '²').replace(/[{}\\]/g, '').trim());
  function splitKw(text) {
    text = deTex(text);
    const m = text.match(/\n?[ \t*#>]*查證關鍵字[:：]\s*([^\n]*)\s*$/);
    if (!m) return { text: text.trim(), kw: null };
    const [zh, en] = m[1].replace(/\*+/g, '').split(/[｜|]/);
    const sp = s => (s || '').split(/[,，、;；]/).map(x => x.trim()).filter(Boolean).slice(0, 4);
    return { text: text.slice(0, m.index).trim(), kw: { zh: sp(zh), en: sp(en) } };
  }
  async function send(text, opt = {}) {
    text = String(text || '').trim();
    if (!text || S.busy) return;
    const c = cfg();
    if (!c || !CLOUD.signedIn) { await refreshStatus(); U.toast('請先登入雲端帳號'); return; }
    if (S.st && S.st.reason === 'blocked') { U.toast('這個帳號的 AI 助教已被停用'); return; }
    const pg = opt.page || null;
    // 附上的題目：手動附的那題，加上學習頁面正在做的題庫題（同一題只附一次）
    const qs = opt.noCtx ? [] : [...new Set([S.q, pg && pg.qid].filter(Boolean))].map(id => Store.Q[id]).filter(Boolean);
    const q = qs[0] || null;
    // 附了題目時，以題幹與考點為主去找參考資料（問句裡的「為什麼答案是」不參與檢索）；附了學習頁面時以頁面內容為主，並略過頁面本身那張卡
    const subj = pg ? pg.subj : q && Store.EX[q.exam] && Store.EX[q.exam].subj;
    const query = [pg && pg.query, ...qs.map(x => `${plain(x.stem)}\n${x.tag || ''}\n${x.tag || ''}`), pg ? '' : text].filter(Boolean).join('\n');
    const refs = opt.noCtx ? [] : search(query, subj, new Set([...qs.map(x => x.id), ...(pg ? pg.skip : [])]));
    const ref = refs.length ? '【參考資料】\n' + refs.map((r, i) => `[${i + 1}]（${r.k === 'q' ? '題庫' : '教材'}｜${r.title}）\n${r.text}`).join('\n\n') + '\n\n' : '';
    const pgText = pg ? plain(pg.text) + (pg.todo && !pg.qid ? '\n' + TODO : '') + '\n\n' : '';
    const full = (opt.raw ? text : `${ref}${pgText}${qs.map(x => qBlock(x, pg && pg.todo && x.id === pg.qid) + '\n\n').join('')}【問題】\n${text}`);
    // 之前的對話（只帶成功的一問一答，問題不含參考資料，省字數）
    let hist = [];
    for (let i = 0; i < S.msgs.length - 1; i++) {
      const u = S.msgs[i], a = S.msgs[i + 1];
      if (u.role === 'user' && a.role === 'assistant' && !a.err && !a.pending) { hist.push({ role: 'user', content: u.plain }, { role: 'assistant', content: a.text }); i++; }
    }
    hist = hist.slice(-HISTORY);
    S.msgs.push({ role: 'user', show: opt.show || text, plain: pg ? `${pgText}【問題】\n${text}` : text, q: q && q.id, pageLabel: pg && pg.label });
    const pending = { role: 'assistant', pending: true, t0: Date.now() };
    S.msgs.push(pending); S.busy = true; draw();
    try {
      const tk = await CLOUD.token();
      const r = await fetch(endpoint(c), { method: 'POST', headers: { apikey: c.key, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: SYSTEM(), messages: [...hist, { role: 'user', content: full }] }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = { login: '登入已過期，請重新登入。', blocked: `這個帳號（${j.email || CLOUD.email || ''}）的 AI 助教已被停用。`, quota: `今天的 ${j.limit || ''} 次已經用完，明天（台灣時間 0 點）會重置。`,
          all_failed: '所有 AI 服務都暫時無法回答（可能都在忙或額度用完），這次不扣次數，請稍後再試。', bad_request: '問題或附帶內容太長，請縮短後再試。' }[j.error] || `發生錯誤（HTTP ${r.status}）。`;
        Object.assign(pending, { pending: false, err: true, text: msg, detail: j.tried });
        if (j.error === 'login' || j.error === 'blocked' || j.error === 'quota') refreshStatus();
      } else {
        const { text: body, kw } = splitKw(String(j.text || ''));
        Object.assign(pending, { pending: false, text: body, kw, refs, provider: j.provider, model: j.model, truncated: j.truncated, q: q && q.id, ask: text });
        if (S.st && S.st.allowed) { S.st.remaining = j.remaining; S.st.limit = j.limit; if (j.used != null) S.st.used = j.used; paintStatus(); }
      }
    } catch (e) {
      Object.assign(pending, { pending: false, err: true, text: '連不上 AI 服務：' + e.message });
    }
    S.busy = false; draw();
  }

  /* ---------- 查證：維基百科＋PubMed（網頁直接查，不扣次數） ---------- */
  async function verify(m) {
    const kw = m.kw || { zh: [m.ask || ''], en: [] };
    m.ver = { loading: true }; draw();
    const enQ = kw.en.slice(0, 3).join(' ');
    // 維基百科：先找標題完全相符的條目（含重新導向），找不到才用搜尋，且只留標題或摘要真的含關鍵字的結果；中文版＋英文版
    const W = 'wikipedia.org/w/api.php?action=query&format=json&origin=*';
    const item = (lang, title, snip) => ({ src: lang === 'zh' ? '維基百科' : 'Wikipedia', title, snip: decode(plain(snip || '')),
      url: lang === 'zh' ? `https://zh.wikipedia.org/zh-tw/${encodeURIComponent(title)}` : `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` });
    const wikiExact = async (lang, ts) => {
      if (!ts.length) return { hit: [], found: new Set() };
      const j = await (await fetch(`https://${lang}.${W}&redirects=1&prop=extracts&exintro=1&explaintext=1&exchars=200&titles=${encodeURIComponent(ts.join('|'))}`)).json();
      const qy = j.query || {}, found = new Set();
      [...(qy.normalized || []), ...(qy.redirects || [])].forEach(x => found.add(x.from));
      const hit = Object.values(qy.pages || {}).filter(p => p.pageid && !('missing' in p)).map(p => { found.add(p.title); return item(lang, p.title, p.extract); });
      return { hit, found };
    };
    const wikiSearch = async (lang, t) => {
      const j = await (await fetch(`https://${lang}.${W}&list=search&srlimit=3&srsearch=${encodeURIComponent(t)}`)).json();
      return ((j.query && j.query.search) || []).filter(x => (x.title + plain(x.snippet)).toLowerCase().includes(t.toLowerCase())).slice(0, 1).map(x => item(lang, x.title, x.snippet));
    };
    const wiki = async () => {
      const zh = kw.zh.slice(0, 3), en = kw.en.slice(0, 2);
      const [a, b] = await Promise.all([wikiExact('zh', zh), wikiExact('en', en)]);
      const miss = zh.filter(t => !a.found.has(t));
      const more = (await Promise.all(miss.map(t => wikiSearch('zh', t).catch(() => [])))).flat();
      const seen = new Set();
      return [...a.hit, ...more, ...b.hit].filter(x => !seen.has(x.url) && seen.add(x.url)).slice(0, 5);
    };
    const pubmed = async () => {
      if (!enQ) return [];
      const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/';
      let ids = [];
      for (const term of [enQ, kw.en.slice(0, 2).join(' '), kw.en[0]].filter(Boolean)) {
        const j = await (await fetch(`${base}esearch.fcgi?db=pubmed&retmode=json&retmax=3&sort=relevance&term=${encodeURIComponent(term)}`)).json();
        ids = (j.esearchresult && j.esearchresult.idlist) || []; if (ids.length) break;
      }
      if (!ids.length) return [];
      const s = await (await fetch(`${base}esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`)).json();
      return ids.map(id => s.result && s.result[id]).filter(Boolean).map(x => ({ src: 'PubMed', title: decode(x.title), snip: [x.fulljournalname || x.source, (x.pubdate || '').slice(0, 4)].filter(Boolean).join('・'), url: `https://pubmed.ncbi.nlm.nih.gov/${x.uid}/` }));
    };
    const [a, b] = await Promise.allSettled([wiki(), pubmed()]);
    m.ver = { items: [...(a.value || []), ...(b.value || [])], fail: [a, b].filter(x => x.status === 'rejected').length, kw };
    draw();
  }
  function compare(m) {
    const items = (m.ver && m.ver.items) || []; if (!items.length) return;
    const src = items.map((x, i) => `(${i + 1}) ${x.src}「${x.title}」${x.snip ? '：' + x.snip : ''}`).join('\n');
    send(`請對照下面查到的外部資料，檢查你上一則回答有沒有錯誤或需要補充的地方；兩邊不一致時說明可能的原因與哪個比較可信。外部資料只有標題與摘要片段，資訊不足時請直說。\n\n【外部資料】\n${src}`,
      { noCtx: true, raw: true, show: '🔎 請對照查到的外部資料，檢查上一則回答' });
  }

  /* ---------- 畫面 ---------- */
  const cite = (html, n) => html.replace(/\[(\d{1,2})\]/g, (s, k) => +k >= 1 && +k <= n ? `<a class="ai-cite" data-ref="${k}">[${k}]</a>` : s);
  function msgHTML(m, i) {
    if (m.role === 'user') return `<div class="ai-msg me"><div class="ai-bub">${U.esc(m.show)}${m.pageLabel ? `<div class="ai-pg dim">📖 ${U.esc(m.pageLabel)}</div>` : ''}</div></div>`;
    if (m.pending) return `<div class="ai-msg bot"><div class="ai-bub dim">思考中…<span class="ai-sec" data-t0="${m.t0}"></span><br><small>忙碌時會自動換下一個 AI 服務</small></div></div>`;
    if (m.err) return `<div class="ai-msg bot"><div class="ai-bub err">${U.esc(m.text)}${m.detail && m.detail.length ? `<details class="small-t"><summary>詳細</summary>${m.detail.map(U.esc).join('<br>')}</details>` : ''}</div></div>`;
    const refs = m.refs || [];
    const ver = m.ver;
    return `<div class="ai-msg bot" data-i="${i}"><div class="ai-bub">${cite(U.md(m.text), refs.length)}${m.truncated ? '<p class="dim small-t">（回答太長被截斷了，可以請它「繼續」）</p>' : ''}
      ${refs.length ? `<div class="ai-refs">${refs.map((r, k) => `<button class="ai-ref" data-ref="${k + 1}" title="${U.esc(r.title)}">[${k + 1}] ${r.k === 'q' ? '📝' : '📘'} ${U.esc(r.title)}</button>`).join('')}</div>` : ''}
      <div class="ai-foot"><span class="dim">${U.esc(m.provider || '')}${m.model ? '・' + U.esc(m.model) : ''}</span><span class="grow"></span>
        <button class="px-btn small" data-act="verify" ${ver && ver.loading ? 'disabled' : ''}>🔎 查證</button><button class="px-btn small" data-act="copy">複製</button></div>
      ${ver ? ver.loading ? '<div class="ai-ver dim small-t">查詢維基百科與 PubMed…</div>' : `<div class="ai-ver small-t">
        <div class="dim">關鍵字：${U.esc([...(ver.kw.zh || []), ...(ver.kw.en || [])].join('、') || '（無）')}</div>
        ${ver.items.length ? ver.items.map(x => `<div class="ai-vi"><b>${x.src}</b> <a href="${U.esc(x.url)}" target="_blank" rel="noopener">${U.esc(x.title)}</a>${x.snip ? `<div class="dim">${U.esc(x.snip.slice(0, 160))}</div>` : ''}</div>`).join('')
          : `<div class="dim">沒有找到相關的外部資料${ver.fail ? '（部分查詢失敗）' : ''}。</div>`}
        ${ver.items.length ? '<button class="px-btn small mt" data-act="compare">🤖 請 AI 對照這些來源（用 1 次）</button>' : ''}
        <div class="dim">外部資料可能用簡體、英文或不同教科書的用語；考試以老師講義為準。</div></div>` : ''}
    </div></div>`;
  }
  function draw() {
    if (!panel) return;
    list.innerHTML = S.msgs.length ? S.msgs.map(msgHTML).join('') : `<div class="ai-empty dim small-t">
      <p>可以問觀念、問題目為什麼選這個答案、請它出類似題或整理重點。</p>
      <p>回答會先參考這個遊戲裡的題庫與教材，並標出處 [1]；點出處可以直接打開那一題或那一課。</p>
      <p>AI 也會出錯，重要的內容請對照講義，或按 🔎 查證。</p></div>`;
    list.scrollTop = list.scrollHeight;
    sendBtn.disabled = S.busy;
    const q = S.q && Store.Q[S.q];
    ctxEl.hidden = !q;
    if (q) { const ex = Store.EX[q.exam]; ctxEl.innerHTML = `<span>📎 一起附上：${U.esc(ex ? QV.exLabel(ex).replace(/^【[^】]*】\s*/, '') : '')}・第 ${U.esc(q.n)} 題</span><button class="ai-x" data-act="unq" title="不附這題">✕</button>`; }
    drawPage();
  }
  /* 「把這頁講得更好懂」：只在學習模式的課程裡出現，換頁時跟著更新 */
  function drawPage() {
    if (!panel) return;
    const pg = page();
    pageEl.hidden = !pg;
    if (!pg) return;
    pageEl.innerHTML = `<button class="px-btn small blue" data-act="page" ${S.busy ? 'disabled' : ''}>✨ 把這頁講得更好懂</button><span class="dim" title="${U.esc(pg.label)}">📖 ${U.esc(pg.label)}</span>`;
  }
  document.addEventListener('learnpage', () => { if (panel && !panel.hidden) drawPage(); });
  setInterval(() => { if (panel && !panel.hidden) U.$$('.ai-sec', panel).forEach(e => { e.textContent = `（${Math.round((Date.now() - +e.dataset.t0) / 1000)} 秒）`; }); }, 1000);

  function openRef(m, k) {
    const r = (m.refs || [])[k - 1]; if (!r) return;
    if (r.k === 'q') { const q = Store.Q[r.id]; if (q) QV.practiceModal(q); }
    else { App.go('learn', { pack: r.pack }); }
  }
  function build() {
    panel = U.h(`<div id="aiPanel" class="aip" hidden tabindex="-1">
      <div class="aip-head"><span>💬 AI 助教</span><span class="grow"></span><button class="aip-btn" data-act="new" title="新對話">🗑</button><button class="aip-btn" data-act="close" title="關閉（Esc）">✕</button></div>
      <div class="aip-st small-t"></div>
      <div class="aip-list"></div>
      <div class="aip-ctx small-t" hidden></div>
      <div class="aip-page small-t" hidden></div>
      <div class="aip-in"><textarea rows="2" placeholder="輸入問題（Enter 送出，Shift+Enter 換行）"></textarea><button class="px-btn gold" data-act="send">送出</button></div>
    </div>`);
    document.body.appendChild(panel);
    list = U.$('.aip-list', panel); inp = U.$('textarea', panel); sendBtn = U.$('[data-act="send"]', panel); stEl = U.$('.aip-st', panel); ctxEl = U.$('.aip-ctx', panel); pageEl = U.$('.aip-page', panel);
    panel.addEventListener('click', e => {
      const a = e.target.closest('[data-act],[data-ai],[data-ref]'); if (!a) return;
      const mEl = a.closest('[data-i]'), m = mEl && S.msgs[+mEl.dataset.i];
      if (a.dataset.ref && m) return openRef(m, +a.dataset.ref);
      if (a.dataset.ai === 'login') return CLOUD.open();
      switch (a.dataset.act) {
        case 'send': return go();
        case 'page': return askPage();
        case 'close': return toggle(false);
        case 'new': S.msgs = []; S.q = null; draw(); return;
        case 'unq': S.q = null; draw(); return;
        case 'verify': return m && verify(m);
        case 'compare': return m && compare(m);
        case 'copy': if (m) navigator.clipboard && navigator.clipboard.writeText(m.text).then(() => U.toast('已複製'), () => U.toast('無法複製')); return;
      }
    });
    const go = () => { const t = inp.value; if (!t.trim() || S.busy) return; inp.value = ''; send(t); };
    // 視窗內的按鍵不要觸發作答快捷鍵
    panel.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Escape') toggle(false);
      else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.target === inp) { e.preventDefault(); go(); }
    });
    U.grip(panel, { key: 'ai', minW: 300, minH: 320, apply: (w, h) => { panel.style.width = w + 'px'; panel.style.height = h + 'px'; }, reset: () => { panel.style.width = panel.style.height = ''; } });
    const head = U.$('.aip-head', panel);
    head.onpointerdown = e => {
      if (e.target.closest('button') || matchMedia('(max-width: 640px)').matches) return;
      const r = panel.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
      head.setPointerCapture(e.pointerId);
      head.onpointermove = ev => {
        panel.style.left = U.clamp(ev.clientX - dx, 0, innerWidth - r.width) + 'px';
        panel.style.top = U.clamp(ev.clientY - dy, 0, innerHeight - 40) + 'px';
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
      };
      head.onpointerup = () => { head.onpointermove = head.onpointerup = null; };
    };
    draw();
  }
  function toggle(show) {
    if (!panel) build();
    if (show === undefined) show = panel.hidden;
    panel.hidden = !show;
    const b = document.getElementById('aiMini'); if (b) b.classList.toggle('on', show);
    if (show && S.owner !== CLOUD.email) { S.owner = CLOUD.email; S.msgs = []; }   // 換了帳號就清掉上一個人的對話
    if (show) { refreshStatus(); draw(); if (!matchMedia('(pointer:coarse)').matches) inp.focus(); }
  }
  /* 從題目詳解開啟：附上這題，並預填一個常見問法 */
  function askAbout(qid) {
    const q = Store.Q[qid]; if (!q) return toggle(true);
    toggle(true); S.q = q.id; draw();
    if (!inp.value.trim()) { inp.value = q.choices && q.choices.length ? `這題為什麼答案是 ${q.ans}？其他選項錯在哪？` : '請解釋這題的觀念與解法。'; inp.select(); }
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-askai]'); if (b) { e.preventDefault(); e.stopPropagation(); askAbout(b.dataset.askai); } });

  /* 頂部按鈕（toolmenu.js 會把它收進 ☰ 選單） */
  function mountMini() {
    const res = document.getElementById('topRes'); if (!res || document.getElementById('aiMini')) return;
    const b = document.createElement('button');
    b.className = 'px-btn small'; b.id = 'aiMini'; b.title = 'AI 助教'; b.textContent = '💬';
    b.onclick = () => toggle();
    res.appendChild(b);
  }
  mountMini();

  return { open: () => toggle(true), toggle, askAbout, askPage, search };
})();
