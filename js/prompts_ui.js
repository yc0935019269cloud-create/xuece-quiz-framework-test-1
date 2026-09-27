/* 📋 AI 提示詞：列出 docs/prompts/*.md（由 tools/build.py 打包成 data/prompts.js），一鍵複製單段提示詞或整份 md */
const PROMPTS_UI = (() => {
  const list = () => (window.PROMPTS && window.PROMPTS.files) || [];
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
  function screen() {
    const files = list();
    U.$('#screen').innerHTML = `<div class="panel prompts">
      <h2>📋 AI 提示詞</h2>
      <p>按「複製」後，到 ChatGPT／Claude／Gemini 等 AI 開<b>新對話</b>，<b>先上傳素材</b>（PDF、圖片、講義、題目檔），再貼上提示詞，並把提示詞最後的【我的設定】改成你的情況。
      AI 的回覆可以<b>整段存成 .md 檔</b>（或下載它給的 zip／JSON），和圖片放在同一個資料夾，再到 <button class="px-btn small" id="prImp">📥 導入素材</button> 選那個資料夾。</p>
      <div class="pr-flow small-t">
        <span>① 素材是講義／課本 → <b>01</b> 做學習課程、<b>02</b> 出題</span>
        <span>② 已有題目 → <b>04</b> 轉格式（沒詳解再用 <b>03</b>）</span>
        <span>③ 解剖圖、需要標記的圖 → <b>05</b>；需要動畫模擬 → <b>06</b></span>
        <span>④ 導入後有問題 → <b>07</b> 審查與修正</span>
      </div>
      ${files.length ? files.map((f, fi) => `<div class="pr-file">
        <div class="row"><h3 style="margin:0">${U.esc(f.title)}</h3><span class="grow"></span>
          <button class="px-btn small" data-view="${fi}">👁 看整份</button><button class="px-btn small blue" data-all="${fi}">複製整份 md</button></div>
        ${f.intro ? `<div class="dim small-t pr-intro">${U.md(f.intro)}</div>` : ''}
        ${f.blocks.map((b, bi) => `<div class="pr-block"><div class="grow"><b>${U.esc(b.label)}</b><div class="dim small-t">${b.text.length.toLocaleString()} 字${b.note ? '・' + U.esc(b.note) : ''}</div></div>
          <button class="px-btn small" data-pv="${fi}:${bi}">預覽</button><button class="px-btn gold" data-cp="${fi}:${bi}">📋 複製</button></div>`).join('')}
      </div>`).join('') : '<p class="red-t">找不到提示詞資料（data/prompts.js）。請在框架資料夾執行 python tools/build.py。</p>'}
    </div>`;
    const get = v => { const [a, b] = v.split(':').map(Number); return files[a].blocks[b]; };
    U.$$('[data-cp]').forEach(b => b.onclick = () => copy(get(b.dataset.cp).text, b));
    U.$$('[data-pv]').forEach(b => b.onclick = () => { const x = get(b.dataset.pv); preview(x.label, x.text); });
    U.$$('[data-all]').forEach(b => b.onclick = () => copy(files[+b.dataset.all].md, b));
    U.$$('[data-view]').forEach(b => b.onclick = () => { const f = files[+b.dataset.view]; preview(f.title, f.md); });
    U.$('#prImp').onclick = () => App.go('import');
  }
  return { screen, copy };
})();
