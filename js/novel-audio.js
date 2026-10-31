/* 連載小說朗讀：學習模式裡 style 為 "novel" 的單元，每一頁上方有朗讀列。
 * 音檔由 tools/novel_tts.py 事先錄好（js/novel-audio-data.js，含每句起訖秒數）；沒有音檔的頁面不顯示朗讀列。
 * 「自動翻頁」開著時，念完一頁會自己按「繼續」，一章念完接下一章，可以一路聽下去。
 * 念到的句子會亮起來（CSS Custom Highlight，不改動頁面 DOM）。只在小說裡：點一下句子＝選取（再點一下取消），
 * 選取後按播放從那句開始念，正在念時點句子直接跳過去；點底線名詞則開啟說明。
 * 設定（速度、自動翻頁）存 localStorage novelAudio，不進存檔。 */
const NOVEL_AUDIO_UI = (() => {
  const audio = new Audio();
  audio.preload = 'auto';
  let key = null, want = false, timer = null, waitNext = false;   // want：使用者要聽（換頁後繼續念）
  let ranges = [], now = -1, sel = -1, raf = 0;   // ranges[i]＝第 i 句在頁面上的 Range（對不到是 null）
  const HL = typeof Highlight !== 'undefined' && window.CSS && CSS.highlights;
  const cfg = (() => { try { return Object.assign({ rate: 1, auto: true }, JSON.parse(localStorage.getItem('novelAudio') || '{}')); } catch (_) { return { rate: 1, auto: true }; } })();
  const saveCfg = () => { try { localStorage.setItem('novelAudio', JSON.stringify(cfg)); } catch (_) {} };
  const data = () => window.NOVEL_AUDIO || {};
  const sents = () => (data()[key] || {}).s || [];
  const fmt = s => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  function bar() { return document.getElementById('nvAudio'); }
  function paint() {
    const b = bar(); if (!b) return;
    const playing = !audio.paused && !audio.ended;
    b.querySelector('[data-nv="play"]').textContent = playing ? '⏸ 暫停' : sel >= 0 ? '▶ 從選取的句子念' : (audio.currentTime > 0.5 && !audio.ended ? '▶ 繼續聽' : '🔊 朗讀本頁');
    const d = audio.duration || (data()[key] || {}).d || 0;
    b.querySelector('.nv-time').textContent = `${fmt(audio.currentTime)} / ${fmt(d)}`;
    b.querySelector('.nv-prog i').style.width = d ? `${Math.min(100, audio.currentTime / d * 100)}%` : '0';
  }
  function load(k) {
    const it = data()[k];
    if (key === k) return !!it;
    key = k;
    if (!it) { audio.pause(); audio.removeAttribute('src'); return false; }
    audio.src = it.f; audio.playbackRate = cfg.rate;
    return true;
  }
  function play() {
    if (sel >= 0 && sents()[sel]) { audio.currentTime = sents()[sel][0] + 0.01; sel = -1; }
    want = true; audio.playbackRate = cfg.rate;
    const p = audio.play(); if (p && p.catch) p.catch(() => { want = false; paint(); paintHL(); });
    if ('mediaSession' in navigator) {
      const t = document.querySelector('.lp-title');
      try { navigator.mediaSession.metadata = new MediaMetadata({ title: t ? t.querySelector('b')?.textContent || '' : '', artist: t ? t.querySelector('small')?.textContent || '' : '' }); } catch (_) {}
    }
  }
  function stop() { want = false; audio.pause(); paint(); paintHL(); }

  /* ---------- 句子：對位、亮起、點選 ---------- */
  const isWord = c => /[\p{L}\p{N}]/u.test(c);
  // 把每句（TTS 的句界）對到頁面文字：只比對文字與數字、依序往後找；對不到的句子（例如只念不顯示的章名）是 null
  let rBody = null;
  function buildRanges(body) {
    ranges = []; rBody = body;
    const list = sents(); if (!list.length) return;
    const map = []; let norm = '';
    const w = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement && n.parentElement.closest('#nvAudio, .lp-type-row, h3, button') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    while (w.nextNode()) { const n = w.currentNode, t = n.nodeValue; for (let i = 0; i < t.length; i++) if (isWord(t[i])) { norm += t[i]; map.push([n, i]); } }
    let cur = 0;
    list.forEach(([, , text]) => {
      const ns = [...String(text)].filter(isWord).join('');
      const at = ns ? norm.indexOf(ns, cur) : -1;
      if (at < 0 || at - cur > 400) { ranges.push(null); return; }
      const [sn, so] = map[at], [en, eo] = map[at + ns.length - 1];
      let end = eo + 1;
      while (end < en.nodeValue.length && /[。！？；，、…」』）”"!?.]/.test(en.nodeValue[end])) end++;   // 句尾標點一起亮
      const r = document.createRange(); r.setStart(sn, so); r.setEnd(en, end);
      ranges.push(r); cur = at + ns.length;
    });
  }
  // 名詞底線（glossary.js）會在頁面畫好後才把文字拆開包起來，舊 Range 就失效；用到時發現失效就重新對位
  function fresh() {
    if (rBody && rBody.isConnected && ranges.some(r => r && !(r.startContainer.isConnected && r.endContainer.isConnected && r.startContainer.nodeType === Node.TEXT_NODE && r.endContainer.nodeType === Node.TEXT_NODE))) buildRanges(rBody);
  }
  function paintHL() {
    if (!HL) return;
    fresh();
    const r = ranges[now], q = ranges[sel];
    if (r && want && !audio.paused) CSS.highlights.set('nv-now', new Highlight(r)); else CSS.highlights.delete('nv-now');
    if (q) CSS.highlights.set('nv-sel', new Highlight(q)); else CSS.highlights.delete('nv-sel');
  }
  function indexAt(t) { const l = sents(); let i = -1; for (let k = 0; k < l.length; k++) { if (l[k][0] <= t + 0.05) i = k; else break; } return i; }
  function tick() {
    raf = 0;
    if (audio.paused) { paintHL(); return; }
    const i = indexAt(audio.currentTime);
    if (i !== now) { now = i; paintHL(); follow(ranges[i]); }
    raf = requestAnimationFrame(tick);
  }
  // 念到的句子跑出畫面時，把它捲到畫面上方三分之一
  function follow(r) {
    fresh(); r = ranges[now];
    if (!r) return;
    const rc = r.getBoundingClientRect(); if (!rc.height) return;
    const tb = document.getElementById('topbar'), foot = document.querySelector('.lp-foot'), pin = document.getElementById('lpBattlePin');
    const top = (tb ? tb.offsetHeight : 0) + (pin && !pin.hidden ? pin.offsetHeight : 0) + 8, bottom = innerHeight - (foot ? foot.offsetHeight : 0) - 8;
    if (rc.top < top || rc.bottom > bottom) scrollBy({ top: rc.top - top - (bottom - top) / 3, behavior: 'smooth' });
  }
  function sentenceAt(x, y) {
    fresh();
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i]; if (!r) continue;
      for (const b of r.getClientRects()) if (x >= b.left - 2 && x <= b.right + 2 && y >= b.top - 2 && y <= b.bottom + 2) return i;
    }
    return -1;
  }
  const inNovel = el => el && el.closest && el.closest('.lp[data-style="novel"] #lpBody');
  // 底線名詞交給 glossary.js；其餘小說文字可點選句子
  addEventListener('click', ev => {
    if (!inNovel(ev.target) || !ranges.length) return;
    if (ev.target.closest('#nvAudio, button, a, input, select, label, .lp-type-row')) return;
    if (ev.target.closest('.gl')) return;
    const i = sentenceAt(ev.clientX, ev.clientY); if (i < 0) return;
    if (sel === i) sel = -1;
    else if (want && !audio.paused) { audio.currentTime = sents()[i][0] + 0.01; sel = -1; now = i; }
    else sel = i;
    paintHL(); paint();
  }, true);
  function mount() {
    const lp = document.querySelector('.lp[data-style="novel"]'), body = document.getElementById('lpBody');
    const pg = typeof LEARN_UI !== 'undefined' && LEARN_UI.curPage ? LEARN_UI.curPage() : null;
    if (!lp || !body || !pg) { if (!waitNext) { want = false; audio.pause(); } ranges = []; paintHL(); return; }
    const k = `${pg.p}/${pg.l}/${pg.i}`;
    const has = load(k);
    if (!has) { ranges = []; paintHL(); return; }
    if (!bar()) {
      now = -1; sel = -1; buildRanges(body);
      const b = document.createElement('div');
      b.className = 'nv-audio'; b.id = 'nvAudio';
      b.innerHTML = `<button class="px-btn small gold" data-nv="play"></button>
        <span class="nv-prog" title="點一下跳到這個位置"><i></i></span><span class="nv-time small-t"></span>
        <select class="nv-rate" title="朗讀速度">${[0.8, 1, 1.2, 1.4, 1.6, 2].map(r => `<option value="${r}"${r === cfg.rate ? ' selected' : ''}>${r}×</option>`).join('')}</select>
        <label class="nv-auto small-t" title="念完一頁自動翻到下一頁，一章念完接下一章"><input type="checkbox"${cfg.auto ? ' checked' : ''}> 自動翻頁</label>
        ${ranges.some(Boolean) ? '<span class="nv-tip small-t dim">點句子可選取、從那句開始念；點底線名詞看說明</span>' : ''}`;
      body.prepend(b);
      b.querySelector('[data-nv="play"]').onclick = () => (audio.paused ? play() : stop());
      b.querySelector('.nv-prog').onclick = e => { const r = e.currentTarget.getBoundingClientRect(), d = audio.duration || 0; if (d) { audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * d; paint(); } };
      b.querySelector('.nv-rate').onchange = e => { cfg.rate = +e.target.value; audio.playbackRate = cfg.rate; saveCfg(); };
      b.querySelector('.nv-auto input').onchange = e => { cfg.auto = e.target.checked; saveCfg(); };
    }
    paint(); paintHL();
    if (want && audio.paused) play();
  }

  function nextPage() {
    const nb = document.getElementById('lpNext');
    const last = !document.getElementById('lpBody') || (nb && /完成/.test(nb.textContent));
    if (nb && !nb.disabled) nb.click();
    if (!last) return;
    // 最後一頁按完是完成畫面，「下一章」出現後接著念（最多等 8 秒）
    clearInterval(timer); let n = 0; waitNext = true;
    timer = setInterval(() => {
      const d = document.getElementById('dNext');
      if (d) { clearInterval(timer); waitNext = false; d.click(); }
      else if (++n > 80) { clearInterval(timer); waitNext = false; want = false; }
    }, 100);
  }
  audio.addEventListener('ended', () => {
    paint();
    if (!want || !cfg.auto) { want = false; paint(); paintHL(); return; }
    nextPage();
  });
  ['play', 'pause', 'timeupdate', 'loadedmetadata'].forEach(ev => audio.addEventListener(ev, paint));
  audio.addEventListener('play', () => { if (!raf) raf = requestAnimationFrame(tick); });
  audio.addEventListener('pause', paintHL);
  audio.addEventListener('seeked', () => { now = -1; if (!raf && !audio.paused) raf = requestAnimationFrame(tick); });
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => stop());
      navigator.mediaSession.setActionHandler('nexttrack', () => { want = true; nextPage(); });
    } catch (_) {}
  }
  // 換頁、開課、離開時 learn.js 都會發 learnpage；頁面內容畫好後再掛朗讀列
  document.addEventListener('learnpage', () => requestAnimationFrame(mount));
  return { get playing() { return !audio.paused; }, get key() { return key; }, get now() { return now; }, get sel() { return sel; }, get mapped() { fresh(); return ranges.filter(Boolean).length; }, get total() { return ranges.length; }, rangeOf: i => (fresh(), ranges[i] || null), audio, stop };
})();
