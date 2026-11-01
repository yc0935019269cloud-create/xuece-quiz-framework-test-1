const PICFIND = (() => {
  const norm = s => String(s || '').toLowerCase().replace(/\s+/g, '');
  const names = t => [t.zh, t.en, ...(t.match || []), ...(t.aliases || [])].filter(x => typeof x === 'string' && x.trim());
  function findTerms(text) {
    const input = String(text || '').toLowerCase();
    const hits = [];
    for (const e of (window.LEARN?.glossary || [])) {
      let best = null;
      for (const n of names(e)) {
        const needle = n.toLowerCase(), pos = input.indexOf(needle);
        if (pos < 0 || (/^[a-z0-9]/i.test(needle) && pos && /[a-z0-9]/i.test(input[pos - 1])) || (/[a-z0-9]$/i.test(needle) && /[a-z0-9]/i.test(input[pos + needle.length] || ''))) continue;
        if (!best || needle.length > best.length) best = { pos, length: needle.length };
      }
      if (best) hits.push({ e, ...best });
    }
    hits.sort((a, b) => b.length - a.length || a.pos - b.pos);
    const chosen = [];
    for (const h of hits) if (!chosen.some(x => h.pos < x.pos + x.length && x.pos < h.pos + h.length)) chosen.push(h);
    return chosen.sort((a, b) => a.pos - b.pos).map(x => x.e);
  }
  function siteImages(term) {
    const keys = new Set(names(term).map(norm)), result = [], seen = new Set();
    const matches = (...values) => values.some(v => typeof v === 'string' && keys.has(norm(v)));
    const add = (img, x, y, title, source) => {
      if (!img || x == null || y == null || !Number.isFinite(+x) || !Number.isFinite(+y) || +x < 0 || +x > 100 || +y < 0 || +y > 100) return;
      const k = `${img}|${+x}|${+y}`; if (seen.has(k)) return; seen.add(k);
      result.push({ img, x: +x, y: +y, title, source });
    };
    for (const p of (typeof LEARN_UI === 'undefined' ? [] : LEARN_UI.packs)) for (const l of (p.lessons || [])) for (const s of (l.steps || [])) {
      const title = [p.title || p.name, l.title || l.name].filter(Boolean).join(' / ');
      if (s.type === 'diagram') for (const pt of (s.points || [])) {
        const combined = String(pt.name || '').match(/^\s*([\u3400-\u9fff]+)\s+(.+?)\s*$/);
        if (matches(pt.name, pt.zh, pt.en, ...(combined ? [combined[1], combined[2]] : []))) add(s.img, pt.x, pt.y, title, s.source);
      }
      if (s.type === 'termlist') for (const g of (s.groups || [])) for (const item of (g.items || [])) if (matches(item.zh, item.en, item.name)) for (const v of (item.views || [])) add(v.img, v.x, v.y, title, v.from || v.source);
    }
    return result.slice(0, 12);
  }
  function safeURL(url) { try { const u = new URL(url); return u.protocol === 'https:' ? u.href : ''; } catch (_) { return ''; } }
  function strip(html) { const d = new DOMParser().parseFromString(String(html || ''), 'text/html'); return (d.body.textContent || '').trim(); }
  function open(term) {
    term = term || {}; const body = document.createElement('div'); body.className = 'picfind';
    const heading = document.createElement('h3'); heading.textContent = '網站裡的圖'; body.appendChild(heading);
    const images = siteImages(term), grid = document.createElement('div'); grid.className = 'picfind-grid'; body.appendChild(grid);
    for (const item of images) {
      const fig = document.createElement('figure'), wrap = document.createElement('div'); wrap.className = 'dg-wrap';
      const img = document.createElement('img'); img.className = 'lp-img'; img.src = U.img(item.img); img.alt = '點圖放大';
      const pin = document.createElement('span'); pin.className = 'dg-pin term-pin'; pin.style.left = item.x + '%'; pin.style.top = item.y + '%'; pin.setAttribute('aria-label', '位置'); wrap.append(img, pin);
      const caption = document.createElement('figcaption'); caption.textContent = item.title + (item.source ? '｜圖片來源：' + item.source : ''); fig.append(wrap, caption); grid.appendChild(fig);
    }
    if (!images.length) { const p = document.createElement('p'); p.textContent = '網站裡還沒有這個構造的圖'; grid.appendChild(p); }
    const h = document.createElement('h3'); h.textContent = '維基共享資源'; body.appendChild(h);
    const button = document.createElement('button'); button.className = 'px-btn small'; button.textContent = '🔎 到維基共享資源找圖'; body.appendChild(button);
    const note = document.createElement('p'); note.className = 'dim small-t'; note.textContent = '網路圖片僅供參考，可能是示意圖'; body.appendChild(note);
    const results = document.createElement('div'); results.className = 'picfind-grid picfind-results'; body.appendChild(results);
    let seq = 0;
    async function search() {
      const n = ++seq, query = (term.en || term.zh || '').trim(); results.textContent = '搜尋中…'; button.disabled = true;
      try {
        const get = async q => {
          const params = new URLSearchParams({ action:'query', format:'json', origin:'*', generator:'search', gsrnamespace:'6', gsrlimit:'12', gsrsearch:q, prop:'imageinfo', iiprop:'url|mime|extmetadata', iiurlwidth:'360' });
          const r = await fetch('https://commons.wikimedia.org/w/api.php?' + params); if (!r.ok) throw Error('network');
          const j = await r.json(); if (j.error) throw Error('api');
          return Object.values(j.query?.pages || {}).filter(p => ['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(p.imageinfo?.[0]?.mime) && safeURL(p.imageinfo?.[0]?.thumburl) && safeURL(p.imageinfo?.[0]?.url));
        };
        let pages = await get(query + ' filetype:bitmap'); if (pages.length < 4) { const extra = await get(query + ' anatomy filetype:bitmap'); const ids = new Set(pages.map(p => p.title)); pages.push(...extra.filter(p => !ids.has(p.title))); }
        if (n !== seq || !body.isConnected) return; results.replaceChildren();
        for (const p of pages.slice(0, 12)) {
          const info = p.imageinfo[0], fig = document.createElement('figure'), im = document.createElement('img'); im.className = 'lp-img'; im.src = safeURL(info.thumburl); im.alt = p.title || ''; im.dataset.zoomSrc = safeURL(info.url);
          const caption = document.createElement('figcaption'), meta = info.extmetadata || {}; caption.textContent = [strip(meta.LicenseShortName?.value) || '授權未標示', strip(meta.Artist?.value) || '作者未標示'].join('｜');
          const link = document.createElement('a'); const filePage = safeURL(info.descriptionurl) || 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(p.title.replace(/ /g, '_')); link.href = filePage; link.target = '_blank'; link.rel = 'noopener'; link.textContent = '出處'; caption.append(' ', link); fig.append(im, caption); results.appendChild(fig);
        }
        if (!pages.length) results.textContent = '沒有找到圖片。';
      } catch (_) { if (n === seq && body.isConnected) results.textContent = '連不到維基共享資源（需要網路）'; }
      finally { if (n === seq) button.disabled = false; }
    }
    button.onclick = search;
    const dlg = U.modal({ title: '🖼 看圖：' + U.esc(term.zh || term.en || ''), body, contained: true, onClose: () => { document.removeEventListener('keydown', key, true); seq++; } });
    dlg.el.parentElement.style.zIndex = '9100';
    const key = ev => { if (ev.key === 'Escape' && !document.querySelector('.img-zoom')) { ev.preventDefault(); ev.stopImmediatePropagation(); dlg.close(); } };
    document.addEventListener('keydown', key, true);
    if (!images.length) search();
    return dlg;
  }
  function choose(answer, question) {
    let found = findTerms(answer); if (!found.length) found = findTerms(question);
    if (found.length === 1) return open(found[0]);
    const body = document.createElement('div'); body.className = 'picfind-choice';
    if (found.length) found.forEach(t => { const b = document.createElement('button'); b.className = 'px-btn small'; b.textContent = [t.zh, t.en].filter(Boolean).join(' / '); b.onclick = () => { dlg.close(); open(t); }; body.appendChild(b); });
    else { const label = document.createElement('label'); label.textContent = '輸入中文或英文名稱'; const input = document.createElement('input'); input.className = 'px-in'; label.appendChild(input); const b = document.createElement('button'); b.className = 'px-btn small'; b.textContent = '找圖'; b.onclick = () => { const text = input.value.trim(); if (!text) return; dlg.close(); open({ zh: text, en: text }); }; body.append(label, b); }
    const dlg = U.modal({ title:'選擇要看的構造', body, contained:true, onClose: () => document.removeEventListener('keydown', key, true) }); dlg.el.parentElement.style.zIndex = '9100';
    const key = e => { if (e.key === 'Escape') { e.stopImmediatePropagation(); dlg.close(); } }; document.addEventListener('keydown', key, true);
  }
  return { open, choose, findTerms, siteImages };
})();
