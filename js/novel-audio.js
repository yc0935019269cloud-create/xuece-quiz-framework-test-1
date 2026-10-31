/* 連載小說朗讀：學習模式裡 style 為 "novel" 的單元，每一頁上方有朗讀列。
 * 音檔由 tools/novel_tts.py 事先錄好（js/novel-audio-data.js）；沒有音檔的頁面不顯示朗讀列。
 * 「自動翻頁」開著時，念完一頁會自己按「繼續」，一章念完接下一章，可以一路聽下去。
 * 設定（速度、自動翻頁）存 localStorage novelAudio，不進存檔。 */
const NOVEL_AUDIO_UI = (() => {
  const audio = new Audio();
  audio.preload = 'auto';
  let key = null, want = false, timer = null, waitNext = false;   // want：使用者要聽（換頁後繼續念）
  const cfg = (() => { try { return Object.assign({ rate: 1, auto: true }, JSON.parse(localStorage.getItem('novelAudio') || '{}')); } catch (_) { return { rate: 1, auto: true }; } })();
  const saveCfg = () => { try { localStorage.setItem('novelAudio', JSON.stringify(cfg)); } catch (_) {} };
  const data = () => window.NOVEL_AUDIO || {};
  const fmt = s => { s = Math.max(0, Math.round(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  function bar() { return document.getElementById('nvAudio'); }
  function paint() {
    const b = bar(); if (!b) return;
    const playing = !audio.paused && !audio.ended;
    b.querySelector('[data-nv="play"]').textContent = playing ? '⏸ 暫停' : (audio.currentTime > 0.5 && !audio.ended ? '▶ 繼續聽' : '🔊 朗讀本頁');
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
    want = true; audio.playbackRate = cfg.rate;
    const p = audio.play(); if (p && p.catch) p.catch(() => { want = false; paint(); });
    if ('mediaSession' in navigator) {
      const t = document.querySelector('.lp-title');
      try { navigator.mediaSession.metadata = new MediaMetadata({ title: t ? t.querySelector('b')?.textContent || '' : '', artist: t ? t.querySelector('small')?.textContent || '' : '' }); } catch (_) {}
    }
  }
  function stop() { want = false; audio.pause(); paint(); }

  function mount() {
    const lp = document.querySelector('.lp[data-style="novel"]'), body = document.getElementById('lpBody');
    const pg = typeof LEARN_UI !== 'undefined' && LEARN_UI.curPage ? LEARN_UI.curPage() : null;
    if (!lp || !body || !pg) { if (!waitNext) { want = false; audio.pause(); } return; }
    const k = `${pg.p}/${pg.l}/${pg.i}`;
    const has = load(k);
    if (!has) return;
    if (!bar()) {
      const b = document.createElement('div');
      b.className = 'nv-audio'; b.id = 'nvAudio';
      b.innerHTML = `<button class="px-btn small gold" data-nv="play"></button>
        <span class="nv-prog" title="點一下跳到這個位置"><i></i></span><span class="nv-time small-t"></span>
        <select class="nv-rate" title="朗讀速度">${[0.8, 1, 1.2, 1.4, 1.6, 2].map(r => `<option value="${r}"${r === cfg.rate ? ' selected' : ''}>${r}×</option>`).join('')}</select>
        <label class="nv-auto small-t" title="念完一頁自動翻到下一頁，一章念完接下一章"><input type="checkbox"${cfg.auto ? ' checked' : ''}> 自動翻頁</label>`;
      body.prepend(b);
      b.querySelector('[data-nv="play"]').onclick = () => (audio.paused ? play() : stop());
      b.querySelector('.nv-prog').onclick = e => { const r = e.currentTarget.getBoundingClientRect(), d = audio.duration || 0; if (d) { audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * d; paint(); } };
      b.querySelector('.nv-rate').onchange = e => { cfg.rate = +e.target.value; audio.playbackRate = cfg.rate; saveCfg(); };
      b.querySelector('.nv-auto input').onchange = e => { cfg.auto = e.target.checked; saveCfg(); };
    }
    paint();
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
    if (!want || !cfg.auto) { want = false; paint(); return; }
    nextPage();
  });
  ['play', 'pause', 'timeupdate', 'loadedmetadata'].forEach(ev => audio.addEventListener(ev, paint));
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => stop());
      navigator.mediaSession.setActionHandler('nexttrack', () => { want = true; nextPage(); });
    } catch (_) {}
  }
  // 換頁、開課、離開時 learn.js 都會發 learnpage；頁面內容畫好後再掛朗讀列
  document.addEventListener('learnpage', () => requestAnimationFrame(mount));
  return { get playing() { return !audio.paused; }, get key() { return key; }, audio, stop };
})();
