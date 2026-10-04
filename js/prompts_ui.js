/* 📋 AI 提示詞：列出 docs/prompts/*.md（由 tools/build.py 打包成 data/prompts.js）。
 * 每一段提示詞可以勾選，按「複製已勾選」會合成一份（含執行說明與共用設定欄）一次貼給 AI；也有現成組合。 */
const PROMPTS_UI = (() => {
  const list = () => (window.PROMPTS && window.PROMPTS.files) || [];
  /* 現成組合：[檔名開頭, 區塊標題開頭] */
  const PRESETS = [
    { name: '新單元全套', desc: '課程 → 題目 → 嚴謹連結 → 覆蓋審計', picks: [['01_', '1-B'], ['02_', '2-A'], ['02_', '2-C'], ['07_', '7-C'], ['07_', '7-E']] },
    { name: '課程＋題目', desc: '先做課程，再依課程出題', picks: [['01_', '1-B'], ['02_', '2-A'], ['02_', '2-C']] },
    { name: '審查現有內容', desc: '品質審查 → 覆蓋審計（教材有沒有追上題目的深度）', picks: [['07_', '7-A'], ['07_', '7-E']] },
    { name: '題庫轉檔＋補詳解', desc: '考卷轉題庫 → 補詳解', picks: [['04_', '4-A'], ['03_', '3-A']] }
  ];
  /* 有些段落只是「補充規則」，要搭配另一段才完整：複製時自動一起帶上 */
  const DEPS = [{ file: '02_', label: '2-C', needs: ['02_', '2-A'] }];
  const MODES = {
    step: '逐段確認：每完成一段就先停下來，列出該段的產出與【需要確認】事項，等我回覆「繼續」再做下一段。',
    all: '一次做完：依序把全部段落完成，最後再統一列出所有【需要確認】事項。'
  };
  let sel = new Set(), mode = 'step', shared = true;
  try { const o = JSON.parse(localStorage.getItem(SKEY('prsel')) || 'null'); if (o) { sel = new Set(o.sel || []); mode = o.mode || 'step'; shared = o.shared !== false; } } catch (e) {}
  const save = () => { try { localStorage.setItem(SKEY('prsel'), JSON.stringify({ sel: [...sel], mode, shared })); } catch (e) {} };

  async function copy(text, btn) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(ta); ta.select(); try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove();
    }
    if (ok) { SFX.play('coin'); U.toast(`已複製（${text.length.toLocaleString()} 字），貼到 AI 對話框即可`); if (btn) { const t = btn.textContent; btn.textContent = '✔ 已複製'; setTimeout(() => { btn.textContent = t; }, 1500); } }
    else U.toast('瀏覽器不允許自動複製，請在預覽框裡按 Ctrl+A、Ctrl+C', 4000);
    return ok;
  }
  function preview(title, text) {
    const m = U.modal({ title, body: `<textarea class="px-in pr-pre" readonly></textarea>`, buttons: [{ label: '📋 複製', cls: 'gold', close: false, onClick: () => copy(text) }, { label: '關閉' }] });
    m.el.classList.add('wide'); const ta = m.body.querySelector('textarea'); ta.value = text;
  }

  /* 已勾選的區塊（依檔案編號、區塊順序排列，所以 01 一定在 02 前面） */
  function chosen() {
    const files = list(), out = [], want = new Set(sel), auto = new Set();
    files.forEach((f, fi) => f.blocks.forEach((b, bi) => {
      if (!sel.has(fi + ':' + bi)) return;
      DEPS.filter(d => f.file.startsWith(d.file) && b.label.startsWith(d.label)).forEach(d => {
        const nf = files.findIndex(x => x.file.startsWith(d.needs[0])), nb = nf < 0 ? -1 : files[nf].blocks.findIndex(x => x.label.startsWith(d.needs[1]));
        if (nb >= 0 && !want.has(nf + ':' + nb)) { want.add(nf + ':' + nb); auto.add(nf + ':' + nb); }
      });
    }));
    files.forEach((f, fi) => f.blocks.forEach((b, bi) => { if (want.has(fi + ':' + bi)) out.push({ f, b, fi, bi, auto: auto.has(fi + ':' + bi) }); }));
    return out;
  }
  /* 合成一份提示詞 */
  function combine() {
    const items = chosen(), n = items.length;
    const num = f => (f.file.match(/^(\d+)/) || [])[1] || '';
    const needsAlign = items.some(x => /^0[127]_/.test(x.f.file));
    const head = [
      `我會一次給你 ${n} 段提示詞，請這樣處理：`,
      '1. 先把全部讀完，再依編號順序逐段執行；每一段自己的規則、輸出格式、自我檢查都要遵守。',
      '2. 各段結尾如果有【我的設定】，欄位重複時一律以最後面的【共用設定】為準；沒填的欄位依素材自行判斷，並在【需要確認】說明你的假設。',
      '3. 後面的段落需要前面段落的產出時（例如先做課程、再依課程出題），直接使用你前面產出的內容，不用我再貼一次。',
      '4. 執行方式：' + MODES[mode]
    ];
    if (needsAlign) head.push('5. 全程原則：題目要保持深度、不要為了遷就教材而出簡單題；教材要補到足以解出最難的題（含解法示範）。題目用到的符號、公式、名詞都要在課程裡教過；題庫 tags 與課程用詞一致；單元宣告 banks、每課宣告 teaches。');
    const parts = [head.join('\n')];
    items.forEach((x, i) => {
      parts.push(`═══════════ 第 ${i + 1} 段／共 ${n} 段　${num(x.f) ? num(x.f) + '｜' : ''}${x.f.title.replace(/^\d+\s*/, '')}　${x.b.label} ═══════════\n\n${x.b.text}`);
    });
    if (shared) parts.push('═══════════ 共用設定（請在這裡填寫，適用於以上所有段落）═══════════\n學習者：\n科目與 id：\n素材／檔案說明：\n單元 id 與題本 id（單元 banks）：\n分類階層 path：\n特別要求：');
    return parts.join('\n\n');
  }

  function screen() {
    const files = list();
    const total = () => chosen().reduce((a, x) => a + x.b.text.length, 0);
    U.$('#screen').innerHTML = `<div class="panel prompts">
      <h2>📋 AI 提示詞</h2>
      <p>到 ChatGPT／Claude／Gemini 等 AI 開<b>新對話</b>，<b>先上傳素材</b>（PDF、圖片、講義、題目檔），再貼上提示詞，並填寫【我的設定】。
      <b>可以勾選好幾段，一次複製</b>（畫面下方的「複製已勾選」）。
      AI 的回覆可以<b>整段存成 .md 檔</b>（或下載它給的 zip／JSON），和圖片放在同一個資料夾，再到 <button class="px-btn small" id="prImp">📥 導入素材</button> 選那個資料夾。</p>
      <div class="pr-flow small-t">
        <span>① 素材是講義／課本 → <b>01</b> 做學習課程、<b>02</b> 出題</span>
        <span>② 已有題目 → <b>04</b> 轉格式（沒詳解再用 <b>03</b>）</span>
        <span>③ 解剖圖、需要標記的圖 → <b>05</b>；需要動畫模擬 → <b>06</b></span>
        <span>④ 導入後有問題 → <b>07</b> 審查與修正；<b>07-C／07-E</b> 讓教材追上題目的深度</span>
      </div>
      <div class="pr-presets"><b class="small-t">現成組合：</b>${PRESETS.map((p, i) => `<button class="px-btn small" data-preset="${i}" title="${U.esc(p.desc)}">${U.esc(p.name)}</button>`).join('')}</div>
      ${files.length ? files.map((f, fi) => `<div class="pr-file">
        <div class="row"><h3 style="margin:0">${U.esc(f.title)}</h3><span class="grow"></span>
          ${f.blocks.length > 1 ? `<button class="px-btn small" data-filesel="${fi}">全選此檔</button>` : ''}
          <button class="px-btn small" data-view="${fi}">👁 看整份</button><button class="px-btn small blue" data-all="${fi}">複製整份 md</button></div>
        ${f.intro ? `<div class="dim small-t pr-intro">${U.md(f.intro)}</div>` : ''}
        ${f.blocks.map((b, bi) => `<div class="pr-block"><label class="pr-pick grow"><input type="checkbox" data-sel="${fi}:${bi}" ${sel.has(fi + ':' + bi) ? 'checked' : ''}><span><b>${U.esc(b.label)}</b><div class="dim small-t">${b.text.length.toLocaleString()} 字${b.note ? '・' + U.esc(b.note) : ''}</div></span></label>
          <button class="px-btn small" data-pv="${fi}:${bi}">預覽</button><button class="px-btn" data-cp="${fi}:${bi}">📋 複製這段</button></div>`).join('')}
      </div>`).join('') : '<p class="red-t">找不到提示詞資料（data/prompts.js）。請在框架資料夾執行 python tools/build.py。</p>'}
      <div class="pr-bar" id="prBar"></div>
    </div>`;
    const get = v => { const [a, b] = v.split(':').map(Number); return files[a].blocks[b]; };
    const bar = () => {
      const items = chosen(), n = items.length, nAuto = items.filter(x => x.auto).length;
      U.$('#prBar').innerHTML = sel.size ? `<div class="row pr-bar-row">
          <span><b class="gold-t">已勾選 ${sel.size} 段</b>${nAuto ? `（另自動帶上 ${nAuto} 段：${U.esc(items.filter(x => x.auto).map(x => x.b.label.split(' ')[0]).join('、'))}，因為 2-C 要搭配 2-A）` : ''}・${total().toLocaleString()} 字</span>
          <span class="pr-opts small-t">
            <label><input type="radio" name="prmode" value="step" ${mode === 'step' ? 'checked' : ''}> 逐段確認</label>
            <label><input type="radio" name="prmode" value="all" ${mode === 'all' ? 'checked' : ''}> 一次做完</label>
            <label><input type="checkbox" id="prShared" ${shared ? 'checked' : ''}> 附共用設定欄</label></span>
          <span class="grow"></span>
          <button class="px-btn small" id="prClear">清除</button><button class="px-btn small" id="prPv">👁 預覽合併內容</button><button class="px-btn gold big" id="prCopy">📋 複製已勾選（${n} 段）</button></div>`
        : `<div class="small-t dim center">勾選上面每段提示詞前面的方框（或點「現成組合」），就能一次複製多段。</div>`;
      U.$$('input[name=prmode]', U.$('#prBar')).forEach(r => r.onchange = () => { mode = r.value; save(); });
      const sh = U.$('#prShared'); if (sh) sh.onchange = () => { shared = sh.checked; save(); };
      const cl = U.$('#prClear'); if (cl) cl.onclick = () => { sel.clear(); save(); screen(); };
      const pv = U.$('#prPv'); if (pv) pv.onclick = () => preview(`合併提示詞（${n} 段）`, combine());
      const cp = U.$('#prCopy'); if (cp) cp.onclick = () => copy(combine(), cp);
    };
    U.$$('[data-sel]').forEach(c => c.onchange = () => { c.checked ? sel.add(c.dataset.sel) : sel.delete(c.dataset.sel); save(); bar(); });
    U.$$('[data-filesel]').forEach(b => b.onclick = () => { const fi = +b.dataset.filesel; files[fi].blocks.forEach((_, bi) => sel.add(fi + ':' + bi)); save(); screen(); });
    U.$$('[data-preset]').forEach(b => b.onclick = () => {
      const p = PRESETS[+b.dataset.preset]; sel.clear(); let miss = 0;
      p.picks.forEach(([pre, lab]) => { const fi = files.findIndex(f => f.file.startsWith(pre)); const bi = fi < 0 ? -1 : files[fi].blocks.findIndex(x => x.label.startsWith(lab)); if (bi < 0) miss++; else sel.add(fi + ':' + bi); });
      save(); screen(); if (miss) U.toast('有些提示詞找不到（資料版本較舊），請重新執行 python tools/build.py');
      else U.toast(`已勾選「${p.name}」：${p.desc}`);
    });
    U.$$('[data-cp]').forEach(b => b.onclick = () => copy(get(b.dataset.cp).text, b));
    U.$$('[data-pv]').forEach(b => b.onclick = () => { const x = get(b.dataset.pv); preview(x.label, x.text); });
    U.$$('[data-all]').forEach(b => b.onclick = () => copy(files[+b.dataset.all].md, b));
    U.$$('[data-view]').forEach(b => b.onclick = () => { const f = files[+b.dataset.view]; preview(f.title, f.md); });
    U.$('#prImp').onclick = () => App.go('import');
    bar();
  }
  return { screen, copy, combine };
})();
