/* 名詞字源小視窗：學習頁面（課程、知識筆記）上出現字典裡的解剖名詞（中文或英文）時，自動變成可點的字；
 * 點了在旁邊跳出小視窗顯示拆字、意思、相關構造，點別處／Esc／捲動就關掉。
 * 字典：data/learn.js 的 window.LEARN.glossary（原始檔 content/glossary/*.json）。 */
const GLOSS = (() => {
  const SCOPE = '.lp-body, .lnote-card, .lnotes';
  const SKIP = 'button, a, input, textarea, select, code, pre, .gl, .gl-pop, .dg-pin, .dg-list, .lc-opt, .lc-key, .lp-src, script, style, svg';
  let byKey = null, re = null, pop = null, curEl = null;

  function index() {
    if (byKey) return !!re;
    byKey = new Map();
    const entries = (window.LEARN && window.LEARN.glossary) || [];
    const keys = [];
    for (const e of entries) for (const m of e.match) {
      const k = m.toLowerCase();
      if (!byKey.has(k)) { byKey.set(k, e); keys.push(m); }
    }
    if (!keys.length) return false;
    keys.sort((a, b) => b.length - a.length);
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 英文要整個字相符（optic nerve 不會吃到 optic nerves 以外的字中字）；中文直接比對
    const pat = keys.map(k => /[A-Za-z0-9]$/.test(k) ? (/^[A-Za-z0-9]/.test(k) ? '(?<![A-Za-z0-9])' : '') + esc(k) + '(?![A-Za-z0-9])' : esc(k)).join('|');
    re = new RegExp(pat, 'gi');
    return true;
  }

  function wrapText(node) {
    const t = node.nodeValue;
    if (!t || t.trim().length < 2) return;
    re.lastIndex = 0;
    let m, last = 0, frag = null;
    while ((m = re.exec(t))) {
      const e = byKey.get(m[0].toLowerCase());
      if (!e) continue;
      frag = frag || document.createDocumentFragment();
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      const s = document.createElement('span');
      s.className = 'gl'; s.dataset.g = e.id; s.tabIndex = 0; s.setAttribute('role', 'button');
      s.textContent = m[0];
      frag.appendChild(s);
      last = m.index + m[0].length;
    }
    if (!frag) return;
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  function scan(root) {
    if (!root || !index()) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.parentElement && !n.parentElement.closest(SKIP) && n.parentElement.closest(SCOPE)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach(wrapText);
  }

  const find = id => ((window.LEARN && window.LEARN.glossary) || []).find(e => e.id === id);
  const esc = s => U.esc(String(s || ''));

  function close() { if (pop) { pop.remove(); pop = null; } if (curEl) { curEl.classList.remove('on'); curEl = null; } }

  // 念英文：依序試 ① 專案內預先下載的發音檔 assets/tts/<slug>.mp3（tools/tts/gen.py 產生，離線也能播）
  // ② Google 翻譯語音 ③ 有道 → 都失敗才用瀏覽器內建 speechSynthesis。
  // 用 <audio> 播放：走媒體音量，iPhone 靜音開關不影響（speechSynthesis 在 iOS 會被靜音開關消音）。
  // 全程重用同一個 <audio>：iOS 只要第一次在點擊中播放過，之後換 src 也能播。
  // 念的時候背景音樂暫時調小聲（BGM.duck 用計數器，連點不會提早恢復）。
  const hasTTS = 'speechSynthesis' in window;
  let player = null, voice = null, seq = 0;
  const pickVoice = () => {
    if (!hasTTS) return;
    const vs = speechSynthesis.getVoices().filter(v => /^en(-|_|$)/i.test(v.lang));
    voice = vs.find(v => /en[-_]US/i.test(v.lang) && v.localService) || vs.find(v => /en[-_]US/i.test(v.lang)) || vs[0] || null;
  };
  if (hasTTS) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) {} }
  // slug 規則要和 tools/tts/gen.py 一致
  const ttsSlug = t => t.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const SOURCES = [
    t => 'assets/tts/' + ttsSlug(t) + '.mp3',
    t => 'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=en-US&q=' + encodeURIComponent(t.slice(0, 180)),
    t => 'https://dict.youdao.com/dictvoice?type=2&audio=' + encodeURIComponent(t.slice(0, 180))
  ];
  // 其他語言（opt.lang，例如 'ko'）：assets/tts/<lang>/<每個字的 Unicode 十六進位，用 - 連接>.mp3（tools/tts/gen_lang.py）→ Google 翻譯語音
  const hexSlug = t => [...t.trim()].map(c => c.codePointAt(0).toString(16)).join('-').slice(0, 120);
  const sourcesFor = lang => [
    t => `assets/tts/${lang}/${hexSlug(t)}.mp3`,
    t => `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=${lang}&q=` + encodeURIComponent(t.slice(0, 180))
  ];
  function speak(text, opt) {
    const lang = opt && opt.lang && !/^en\b/i.test(opt.lang) ? String(opt.lang).replace(/[^a-zA-Z-]/g, '') : '';
    const SRC = lang ? sourcesFor(lang) : SOURCES;
    text = String(text || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const id = ++seq, live = () => id === seq; // 被下一次播放打斷的舊請求不再改播備援
    let released = false;
    if (typeof BGM !== 'undefined') BGM.duck(true);
    const release = () => { if (released) return; released = true; if (typeof BGM !== 'undefined') BGM.duck(false); };
    setTimeout(release, 8000); // 保險：萬一事件沒觸發，音樂不會一直被卡住
    if (hasTTS && (speechSynthesis.speaking || speechSynthesis.pending)) { try { speechSynthesis.cancel(); } catch (e) {} }
    const viaTTS = () => {
      if (!hasTTS || !live()) return release();
      try {
        if (speechSynthesis.paused) speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang || 'en-US'; if (voice && !lang) u.voice = voice; u.rate = 0.9;
        u.onend = release; u.onerror = release;
        speechSynthesis.speak(u);
      } catch (e) { release(); }
    };
    if (!player) { try { player = new Audio(); player.preload = 'auto'; } catch (e) { player = null; } }
    if (!player) return viaTTS();
    const a = player;
    try { a.pause(); } catch (e) {}
    const tryAt = k => {
      if (!live()) return;
      if (k >= SRC.length) return viaTTS();
      let over = false;
      const next = () => { if (over || !live()) return; over = true; tryAt(k + 1); };
      a.onended = () => { if (!live()) return; over = true; release(); };
      a.onerror = next;
      a.src = SRC[k](text);
      try {
        const p = a.play();
        if (p && p.catch) p.catch(err => { if (err && err.name === 'AbortError') return; next(); });
      } catch (e) { next(); }
    };
    tryAt(0);
  }

  function open(el) {
    const e = find(el.dataset.g);
    if (!e) return;
    if (curEl === el) { close(); return; }
    close();
    curEl = el; el.classList.add('on');
    pop = document.createElement('div');
    pop.className = 'gl-pop'; pop.setAttribute('role', 'dialog');
    pop.innerHTML = `<div class="gl-h"><b>${esc(e.zh)}</b>${typeof LEARN_UI !== 'undefined' ? LEARN_UI.glossStar(e, el) : ''}<span class="gl-en">${esc(e.en)}</span>` +
      (true ? `<button type="button" class="gl-play" data-text="${esc(e.en)}" aria-label="播放發音" title="播放發音">🔊</button>` : '') +
      `</div>` +
      (e.parts.length ? `<div class="gl-parts">${e.parts.map(([a, b]) => `<div class="gl-part"><span class="gl-w">${esc(a)}</span><span>${esc(b)}</span></div>`).join('')}</div>` : '') +
      (e.note ? `<div class="gl-note">${esc(e.note)}</div>` : '') +
      (e.rel ? `<div class="gl-rel">🔗 ${esc(e.rel)}</div>` : '');
    document.body.appendChild(pop);
    openedAt = Date.now();
    place();
  }

  function place() {
    if (!pop || !curEl) return;
    const r = curEl.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, gap = 8;
    const w = Math.min(340, vw - 16);
    pop.style.width = w + 'px';
    let left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), vw - w - 8);
    const h = pop.offsetHeight;
    let top = r.bottom + gap;
    if (top + h > vh - 8 && r.top - gap - h > 8) top = r.top - gap - h;   // 下面放不下就放上面
    top = Math.max(8, Math.min(top, vh - h - 8));
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  }

  // 點名詞開、點別處關；鍵盤 Enter／空白鍵也能開
  document.addEventListener('click', ev => {
    const play = ev.target.closest && ev.target.closest('.gl-play');
    if (play) { ev.preventDefault(); ev.stopPropagation(); speak(play.dataset.text); return; }
    const el = ev.target.closest && ev.target.closest('.gl');
    if (el) { ev.preventDefault(); ev.stopPropagation(); open(el); return; }
    if (pop && !pop.contains(ev.target)) close();
  }, true);
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && pop) { close(); ev.stopPropagation(); return; }
    const el = document.activeElement;
    if ((ev.key === 'Enter' || ev.key === ' ') && el && el.classList && el.classList.contains('gl')) { ev.preventDefault(); ev.stopPropagation(); open(el); }
  }, true);
  let openedAt = 0;
  addEventListener('scroll', ev => { if (!pop || Date.now() - openedAt < 400) return; if (ev.target && ev.target.nodeType === 1 && pop.contains(ev.target)) return; close(); }, true);
  addEventListener('resize', close);

  // 學習畫面內容改變時自動掃描（換頁、展開範例、作答後顯示解說、知識筆記展開都會觸發）
  let pending = new Set(), raf = 0;
  const mo = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type !== 'childList') continue;
      const t = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      if (!t || (pop && pop.contains(t))) continue;
      if (t === document.body && ![...m.addedNodes].some(n => n.nodeType === 1 && n !== pop && (n.matches(SCOPE) || n.querySelector(SCOPE)))) continue;
      const host = t.closest(SCOPE) || (t.querySelector && t.querySelector(SCOPE) && t);
      if (host) pending.add(host);
    }
    if (pending.size && !raf) raf = requestAnimationFrame(() => {
      raf = 0;
      const list = [...pending]; pending = new Set();
      mo.disconnect();
      list.forEach(h => { if (h.matches && h.matches(SCOPE)) scan(h); else h.querySelectorAll(SCOPE).forEach(scan); });
      mo.observe(document.body, { childList: true, subtree: true });
    });
  });
  const start = () => mo.observe(document.body, { childList: true, subtree: true });
  if (document.body) start(); else addEventListener('DOMContentLoaded', start);

  return { scan, close, open, speak };
})();
