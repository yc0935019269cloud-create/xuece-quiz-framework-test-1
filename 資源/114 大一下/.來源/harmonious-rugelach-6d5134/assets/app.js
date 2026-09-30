(function () {
  const data = window.EYE_ANATOMY_CONTENT;
  const progressKey = "eye-anatomy-final-review-progress-v1";
  let inlineTermsSeen = new Set();

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(progressKey)) || {};
    } catch {
      return {};
    }
  }

  function writeProgress(progress) {
    localStorage.setItem(progressKey, JSON.stringify(progress));
    renderProgressDots();
  }

  function activeUnits() {
    return data.units.filter((unit) => unit.status === "active");
  }

  function unitById(id) {
    return data.units.find((unit) => unit.id === id);
  }

  function drillCount(unit) {
    return (unit.sections || []).reduce((sum, section) => sum + section.points.length, 0) + (unit.quiz || []).length;
  }

  function unitProgress(unit) {
    if (!unit || unit.status !== "active") return 0;
    const entry = readProgress()[unit.id] || {};
    const done = new Set(entry.drills || []);
    return Math.min(100, Math.round((done.size / Math.max(1, drillCount(unit))) * 100));
  }

  function markCorrect(unitId, key) {
    const progress = readProgress();
    const entry = progress[unitId] || {};
    const drills = new Set(entry.drills || []);
    drills.add(key);
    progress[unitId] = { ...entry, drills: Array.from(drills) };
    writeProgress(progress);
  }

  function renderShell() {
    const sidebar = document.querySelector("[data-sidebar]");
    if (!sidebar) return;
    sidebar.innerHTML = `
      <div class="brand">
        <div class="brand-kicker">眼解剖期末總複習</div>
        <h1 class="brand-title">眼解剖<br/>互動總複習</h1>
      </div>
      <nav class="nav-group" aria-label="課程">
        <div class="nav-label">課程</div>
        <a class="nav-link" href="./index.html" data-nav="home">
          <span>總複習入口</span>
          <span class="progress-dot"></span>
        </a>
      </nav>
      <nav class="nav-group" aria-label="單元">
        <div class="nav-label">單元</div>
        ${data.units.map((unit) => unit.status === "active" ? `
          <a class="nav-link" href="./${escapeHtml(unit.file)}" data-unit-link="${escapeHtml(unit.id)}">
            <span><b>${escapeHtml(unit.code)}</b> ${escapeHtml(unit.shortTitle)}</span>
            <span class="progress-dot" data-progress-dot="${escapeHtml(unit.id)}"></span>
          </a>
        ` : `
          <span class="nav-link locked">
            <span><b>${escapeHtml(unit.code)}</b> ${escapeHtml(unit.shortTitle)}</span>
            <span class="chip">待補</span>
          </span>
        `).join("")}
      </nav>
      <div class="sidebar-note">
        <b>Claude 視覺交接</b>
        <span>每個知識點都有獨立圖像編號與醫學準確性要求，請依卡片內容逐一客製。</span>
      </div>
    `;
    const page = document.body.dataset.page;
    if (page === "home") sidebar.querySelector('[data-nav="home"]')?.classList.add("active");
    const unitId = document.body.dataset.unit;
    if (unitId) sidebar.querySelector(`[data-unit-link="${unitId}"]`)?.classList.add("active");
  }

  function renderProgressDots() {
    document.querySelectorAll("[data-progress-dot]").forEach((dot) => {
      const unit = unitById(dot.dataset.progressDot);
      dot.classList.toggle("done", unitProgress(unit) === 100);
      dot.title = `${unitProgress(unit)}%`;
    });
  }

  function renderDashboard() {
    const root = document.querySelector("[data-dashboard]");
    if (!root) return;
    inlineTermsSeen = new Set();
    const units = activeUnits();
    const pointCount = units.reduce((sum, unit) => sum + unit.sections.reduce((s, section) => s + section.points.length, 0), 0);
    const quizCount = units.reduce((sum, unit) => sum + unit.quiz.length, 0);
    const complete = units.filter((unit) => unitProgress(unit) === 100).length;
    const next = units.find((unit) => unitProgress(unit) < 100) || units[0];
    root.innerHTML = `
      <section class="hero">
        <div class="brand-kicker">眼解剖互動式總複習</div>
        <h1>${renderInlineTerms(data.course.title)}</h1>
        <p>${renderInlineTerms(data.course.subtitle)}</p>
        <div class="toolbar">
          <a class="btn" href="./${escapeHtml(next.file)}">${unitProgress(next) ? "繼續複習" : "開始第一個單元"}</a>
          <button class="btn secondary" type="button" data-random-quiz>隨機考一題</button>
          <a class="btn ghost" href="./SESSION_NOTE_FOR_CLAUDE.md">Claude 視覺任務書</a>
        </div>
      </section>
      <section class="stat-grid">
        <div class="stat"><span class="unit-code">已開放單元</span><strong>${units.length} / ${data.units.length}</strong><span class="muted">目前有資料的單元</span></div>
        <div class="stat"><span class="unit-code">知識點</span><strong>${pointCount}</strong><span class="muted">每個知識點附練習題</span></div>
        <div class="stat"><span class="unit-code">總複習題</span><strong>${quizCount}</strong><span class="muted">章節總複習題</span></div>
        <div class="stat"><span class="unit-code">已完成單元</span><strong>${complete}</strong><span class="muted">完成單元</span></div>
      </section>
      <section class="unit-grid">
        ${data.units.map((unit) => renderUnitCard(unit)).join("")}
      </section>
      <section class="card note-card">
        <div class="unit-code">視覺化狀態</div>
        <h2>圖像與動畫交接狀態</h2>
        <p>文字教學、考點與練習題已建好。每個知識點都有獨立圖像編號與專屬視覺規劃，Claude Code 應依解剖位置、訊號方向與臨床意義逐一客製。</p>
      </section>
    `;
    root.querySelector("[data-random-quiz]")?.addEventListener("click", showRandomQuiz);
  }

  function renderUnitCard(unit) {
    const locked = unit.status !== "active";
    return `
      <article class="unit-card ${locked ? "locked" : ""}">
        <div class="unit-code">${escapeHtml(unit.code)} / ${locked ? "待補" : `${unitProgress(unit)}%`}</div>
        <h2>${renderInlineTerms(unit.title)}</h2>
        <p>${renderInlineTerms(unit.summary)}</p>
        ${locked ? `<span class="btn ghost disabled">尚無資料</span>` : `<a class="btn" href="./${escapeHtml(unit.file)}">進入單元</a>`}
      </article>
    `;
  }

  function renderUnitPage() {
    const root = document.querySelector("[data-unit-root]");
    if (!root) return;
    inlineTermsSeen = new Set();
    const unit = unitById(document.body.dataset.unit);
    if (!unit) {
      root.innerHTML = `<section class="hero"><h1>找不到單元</h1></section>`;
      return;
    }
    root.innerHTML = `
      <section class="hero unit-hero">
        <div class="unit-code">單元 ${escapeHtml(unit.code)}</div>
        <h1>${renderInlineTerms(unit.title)}</h1>
        <p>${renderInlineTerms(unit.summary)}</p>
        <div class="toolbar">
          <button class="btn" type="button" data-mark-unit>標記本單元已讀</button>
          <button class="btn secondary" type="button" data-reset-unit>重置本單元進度</button>
        </div>
      </section>
      ${renderUnitRoadmap(unit)}
      ${renderUnitLab(unit)}
      <nav class="section-jump" aria-label="章節快速跳轉">
        ${unit.sections.map((section, i) => `<a href="#${escapeHtml(section.id)}">${String(i + 1).padStart(2, "0")} ${renderInlineTerms(section.title)}</a>`).join("")}
      </nav>
      ${unit.sections.map((section, sectionIndex) => renderSection(unit, section, sectionIndex)).join("")}
      ${renderUnitQuiz(unit)}
      ${renderSources(unit)}
    `;
    root.querySelector("[data-mark-unit]")?.addEventListener("click", () => {
      const progress = readProgress();
      const keys = [];
      unit.sections.forEach((section, s) => section.points.forEach((_, p) => keys.push(`${unit.id}:s${s}:p${p}`)));
      unit.quiz.forEach((_, q) => keys.push(`${unit.id}:quiz:${q}`));
      progress[unit.id] = { drills: keys };
      writeProgress(progress);
      renderUnitPage();
    });
    root.querySelector("[data-reset-unit]")?.addEventListener("click", () => {
      const progress = readProgress();
      delete progress[unit.id];
      writeProgress(progress);
      renderUnitPage();
    });
    bindDrills(root, unit.id);
    bindLab(root, unit.id);
  }

  function renderUnitRoadmap(unit) {
    if (!unit.roadmap?.length) return "";
    return `
      <section class="card roadmap-card" aria-label="本單元脈絡">
        <div class="unit-code">學習脈絡</div>
        <h2>本單元脈絡</h2>
        <ol class="roadmap-list">
          ${unit.roadmap.map((item) => `<li>${renderInlineTerms(item)}</li>`).join("")}
        </ol>
      </section>
    `;
  }

  function renderUnitLab(unit) {
    if (unit.id === "pd-lensometry") {
      return `
        <section class="card lab-card" data-lab="prentice">
          <div class="unit-code">快速工具</div>
          <h2>${renderInlineTerms("Prentice's rule 練習器")}</h2>
          <div class="calc-grid">
            <label><span>${renderInlineTerms("鏡片度數 F(D)")}</span><input type="number" step="0.25" value="-4" data-f></label>
            <label><span>${renderInlineTerms("單眼去中心 d(mm)")}</span><input type="number" step="0.5" value="5" data-d></label>
            <label>鏡片類型<select data-lens><option value="minus">負鏡片</option><option value="plus">正鏡片</option></select></label>
          </div>
          <output class="mini-output" data-output></output>
        </section>
      `;
    }
    if (unit.id === "objective-refraction") {
      return `
        <section class="card lab-card" data-lab="working-distance">
          <div class="unit-code">快速工具</div>
          <h2>${renderInlineTerms("Working distance 扣除練習")}</h2>
          <div class="calc-grid">
            <label><span>${renderInlineTerms("檢影結果 sphere")}</span><input type="number" step="0.25" value="1.50" data-result></label>
            <label><span>${renderInlineTerms("working lens(D)")}</span><input type="number" step="0.25" value="1.75" data-working></label>
            <label><span><input type="checkbox" data-already> ${renderInlineTerms("題目已戴 working lens")}</span></label>
          </div>
          <output class="mini-output" data-output></output>
        </section>
      `;
    }
    if (unit.id === "keratometry") {
      return `
        <section class="card lab-card" data-lab="k-convert">
          <div class="unit-code">快速工具</div>
          <h2>${renderInlineTerms("K 值 / 曲率半徑換算")}</h2>
          <div class="calc-grid">
            <label><span>${renderInlineTerms("K value(D)")}</span><input type="number" step="0.25" value="43.25" data-k></label>
            <label><span>${renderInlineTerms("半徑 r(mm)")}</span><input type="number" step="0.01" value="7.80" data-r></label>
          </div>
          <output class="mini-output" data-output></output>
        </section>
      `;
    }
    if (unit.id === "pupil-response") {
      return `
        <section class="card lab-card" data-lab="pupil-sort">
          <div class="unit-code">快速工具</div>
          <h2>瞳孔異常速查</h2>
          <div class="phase-row">
            <button class="phase-step active" type="button" data-case="rapd">${renderInlineTerms("RAPD")}</button>
            <button class="phase-step" type="button" data-case="adie">${renderInlineTerms("Adie's")}</button>
            <button class="phase-step" type="button" data-case="horner">${renderInlineTerms("Horner")}</button>
            <button class="phase-step" type="button" data-case="argyll">${renderInlineTerms("Argyll Robertson")}</button>
          </div>
          <output class="mini-output" data-output></output>
        </section>
      `;
    }
    return "";
  }

  function renderSection(unit, section, sectionIndex) {
    return `
      <article class="card section-card" id="${escapeHtml(section.id)}">
        <div class="section-head">
          <div class="unit-code">${escapeHtml(unit.shortTitle)} / ${String(sectionIndex + 1).padStart(2, "0")}</div>
          <h2>${renderInlineTerms(section.title)}</h2>
          <p>${renderInlineTerms(section.summary)}</p>
          ${renderStudyPath(section)}
        </div>
        <div class="point-grid">
          ${section.points.map((point, pointIndex) => renderPoint(unit, sectionIndex, point, pointIndex)).join("")}
        </div>
      </article>
    `;
  }

  function renderStudyPath(section) {
    if (!section.studyPath?.length) return "";
    return `
      <div class="study-path" aria-label="本節讀法">
        <b>本節讀法</b>
        <ol>
          ${section.studyPath.map((step) => `<li>${renderInlineTerms(step)}</li>`).join("")}
        </ol>
      </div>
    `;
  }

  function renderPoint(unit, sectionIndex, point, pointIndex) {
    const key = `${unit.id}:s${sectionIndex}:p${pointIndex}`;
    return `
      <section class="point-card">
        <h3>${renderInlineTerms(point.title)}</h3>
        ${renderVisualPlaceholder(point, key)}
        ${renderSimpleSummary(point)}
        ${renderPointDetail(point)}
        ${point.formula ? `<div class="formula">${renderInlineTerms(point.formula)}</div>` : ""}
        ${renderExamFocus(point)}
        ${renderMemoryNote(point)}
        ${renderDrill(key, point.drill, { collapsed: true })}
      </section>
    `;
  }

  const fixedConceptNotes = new Map([
    ["焦度計可以測什麼", {
      simple: "焦度計就是鏡片的讀值機：它不只讀球面度數，也能找散光、軸度、光心、稜鏡與多焦近用加入度。",
      memory: "焦度計五件事：S、C、axis、OC/MRP、prism/ADD。"
    }],
    ["Keplerian telescope 造成影像反向", {
      simple: "Keplerian telescope 會形成倒立影像，所以你移動鏡片時，看到的 target 方向可能和實際移動相反。",
      memory: "K = 兩凸透鏡 = 倒像；看到反向先想到 Keplerian。"
    }],
    ["使用前一定要歸零與調 reticle", {
      simple: "歸零是在建立測量基準：先讓 reticle 清楚，再放鏡片找 target 清楚的位置。",
      memory: "先清 reticle，再清 target；基準錯，讀值全錯。"
    }],
    ["球面鏡片：兩方向同時清楚", {
      simple: "球面鏡片每個方向屈光力相同，所以焦度計 target 的長短線會一起清楚。",
      memory: "兩線同清楚 = sphere；不用急著轉 axis。"
    }],
    ["散光鏡片：先找兩主經線", {
      simple: "散光鏡片有兩個互相垂直的主方向，測量時要先對齊軸向，再分別讀兩個方向的度數。",
      memory: "散光三步：對 axis、讀兩線、相減成 cylinder。"
    }],
    ["短軸對比較正，長軸對比較負", {
      simple: "負柱鏡寫法中，比較正的讀值當 sphere，比較負的讀值和它相減得到 cylinder，axis 看長軸方向。",
      memory: "短正、長負；長軸給負柱鏡 axis。"
    }],
    ["多焦鏡片近用區要翻面測", {
      simple: "多焦近用區重視前頂點度數，所以要翻面讓前表面靠 lens stop 才能正確讀 ADD。",
      memory: "遠用像單焦，近用要翻面；PAL 記得 fitting cross。"
    }],
    ["稜鏡讓影像往 apex、物體看似往 base", {
      simple: "稜鏡讓光線折向 base，但觀察者會覺得影像往 apex 方向跑，這就是 BI/BO/BU/BD 判斷的核心。",
      memory: "光向 base，像向 apex；處方看 base direction。"
    }],
    ["MRP 不等於 OC 時會產生稜鏡效果", {
      simple: "眼睛沒有通過鏡片光心時，就等於透過一個稜鏡在看，所以 PD、DBOC、OC/MRP 必須對齊。",
      memory: "OC 是無稜鏡點，MRP 是處方稜鏡點；不重合就要算。"
    }],
    ["公式：P = d × F", {
      simple: "Prentice's rule 說明去中心越多、鏡片度數越高，誘發稜鏡越大；d 一定要用公分。",
      memory: "P = dF；mm 先除 10，每眼分開算。"
    }],
    ["水平與垂直稜鏡的加減規則", {
      simple: "兩眼稜鏡不能只看數字，要先分水平和垂直；方向關係不同，加減規則也不同。",
      memory: "水平同向加、反向減；垂直反向加、同向減。"
    }],
    ["焦度計測稜鏡：target 偏到幾圈就是幾 Δ", {
      simple: "焦度計 reticle 像稜鏡座標紙，target 偏離中心幾圈，就代表幾個 prism diopter 的偏移。",
      memory: "target 離中心幾 ring = 幾 Δ；先分 OD/OS 再判方向。"
    }],
    ["受檢者看遠，驗者不要擋住視線", {
      simple: "檢影要讓病人放鬆看遠；如果驗者擋住遠方目標，病人調節一啟動，屈光估計就偏了。",
      memory: "檢影怕 accommodation；站位先保視線。"
    }],
    ["working distance 要固定", {
      simple: "工作距離是檢影的基準平面；距離不同，最後要扣掉的 working lens 也不同。",
      memory: "50 cm 扣 2.00D，67 cm 扣 1.50D；距離先固定。"
    }],
    ["retinoscope sleeve down 是 plane mirror effect", {
      simple: "套筒位置會改變出射光型態，判讀 with/against 前要先知道目前是 plane mirror 還是 concave mirror effect。",
      memory: "先看 sleeve，再判 motion；模式錯，方向會誤解。"
    }],
    ["with motion 與 against motion", {
      simple: "with motion 是反射跟光帶同向，against motion 是反向；你用鏡片把反射推到 neutral。",
      memory: "順動加正或少負，逆動加負或少正；終點是 neutral。"
    }],
    ["bracketing：先跨過再抓回中和點", {
      simple: "bracketing 是故意從一側跨過中和點，再往回縮小範圍，避免把接近中和誤判成真正中和。",
      memory: "先跨過，再夾回；endpoint 不是最亮，是剛好 neutral。"
    }],
    ["球面中和後再處理第二主經線", {
      simple: "先把一條主經線用 sphere 中和，再轉 90 度看另一條主經線差多少，差值就是散光成分。",
      memory: "一軸先 neutral，轉 90 度找 cylinder。"
    }],
    ["phoropter 控制：sphere/cylinder/axis", {
      simple: "綜合驗光儀上 sphere 控整體焦點，cylinder 控散光量，axis 控散光方向；三者不要混在一起轉。",
      memory: "S 管整體，C 管差值，axis 管方向。"
    }],
    ["streak、反射光、phoropter axis 要平行", {
      simple: "檢影散光時，光帶、視網膜反射與 phoropter axis 必須對準同一主經線，讀值才有意義。",
      memory: "三線平行再下手：streak、reflex、axis。"
    }],
    ["負柱鏡寫法：比較正者作 sphere", {
      simple: "負柱鏡處方把比較正的主經線當 sphere，再用比較負的差值寫成負 cylinder。",
      memory: "正者當 S，差值當 C，軸看不加 C 的方向。"
    }],
    ["先看 working lens 是否已戴", {
      simple: "檢影題要先判斷 working lens 是否已經放入；已戴就不用再扣，未戴才要扣工作距離。",
      memory: "題幹先抓已戴/未戴；不要無腦扣。"
    }],
    ["光束方向不等於被測經線方向", {
      simple: "檢影光帶的方向和實際被中和的 power meridian 差 90 度，所以要把光束方向轉成正確主經線。",
      memory: "光帶方向看起來是線；真正測的是垂直那條經線。"
    }],
    ["客觀驗光結果要回頭 double check", {
      simple: "客觀驗光只是起點，雙眼各自中和後要回頭確認右眼，再接主觀驗光微調。",
      memory: "OD -> OS -> OD recheck -> subjective refinement。"
    }],
    ["角膜平均屈光力約 42-44D", {
      simple: "角膜是眼球最大屈光面，中央角膜大約提供 42-44D，所以 K 值是臨床配鏡和角膜評估重點。",
      memory: "眼總屈光約 60D，角膜約 2/3。"
    }],
    ["曲率半徑與屈光力反相關", {
      simple: "角膜半徑越小代表越彎、越陡，屈光力越高；半徑越大代表越平，屈光力越低。",
      memory: "小 r 大 D，大 r 小 D；r = 337.5 / F。"
    }],
    ["Keratometer 與 topographer 不測球面屈光度", {
      simple: "keratometer 和 topographer 主要測角膜形狀，不是直接測整眼球面屈光，所以不能把 K 值當眼鏡處方。",
      memory: "K 看 cornea，Rx 看整眼。"
    }],
    ["mire 反射與 prism doubling", {
      simple: "keratometer 看的是 mire 在角膜凸面上的反射影像，透過 doubling 對齊來換算角膜曲率。",
      memory: "mire 要清楚規則，doubling 要對齊。"
    }],
    ["K reading 記錄的是 power meridian", {
      simple: "K reading 記錄哪條子午線的角膜屈光力，不等於眼鏡負柱鏡的處方軸位。",
      memory: "K 記 power meridian；Rx axis 要再轉換。"
    }],
    ["MCR 與 distorted mires", {
      simple: "mire 清楚規則代表中央角膜表面較規則；眨眼後變形或持續扭曲，提示淚膜或角膜不規則。",
      memory: "mire 變形先想 tear film，再想 corneal irregularity。"
    }],
    ["WTR/ATR 判斷", {
      simple: "WTR/ATR 是看角膜哪個方向較陡：垂直較陡多為 WTR，水平較陡多為 ATR。",
      memory: "垂直陡 WTR，水平陡 ATR，斜陡 oblique。"
    }],
    ["角膜散光差值轉矯正柱鏡", {
      simple: "兩條 K 值相差多少，就是角膜散光量的估計；轉成負柱鏡時要注意軸位轉換。",
      memory: "steep - flat = corneal cyl；負柱鏡軸靠 flat meridian。"
    }],
    ["Javal's rule", {
      simple: "Javal's rule 用角膜散光估總散光，但要加入內部散光補償，所以只能當估算，不是最終處方。",
      memory: "Javal = 角膜散光 × 1.25，再加 residual ATR。"
    }],
    ["熱圖顏色：紅陡、藍紫平", {
      simple: "角膜地形圖用顏色快速呈現彎曲程度；紅色通常較陡，藍紫通常較平。",
      memory: "紅陡藍平；先看 pattern，再看數字。"
    }],
    ["topographer 比 keratometer 範圍更廣", {
      simple: "keratometer 主要看中央少數點，topographer 能看更大角膜範圍，因此更適合看不規則與術後形狀。",
      memory: "Keratometer 看中央，topographer 看地圖。"
    }],
    ["不規則散光與圓錐角膜", {
      simple: "不規則散光不是兩條整齊主經線能解釋；圓錐角膜會出現局部下方或偏心變陡。",
      memory: "局部紅 cone、形狀偏心，先警覺 keratoconus。"
    }],
    ["正常大小、miosis 與 mydriasis", {
      simple: "瞳孔大小是縮瞳與散瞳力量的平衡，會隨光線、距離、藥物與神經狀態改變。",
      memory: "小於約 3 mm 想 miosis，大於約 7 mm 想 mydriasis。"
    }],
    ["生理性 anisocoria", {
      simple: "生理性瞳孔不等大通常差距小、亮暗都差不多，不會伴隨明顯神經學症狀。",
      memory: "差小又穩定，多半生理；亮暗放大差距才找病灶。"
    }],
    ["near triad：調節、內聚、縮瞳", {
      simple: "看近物時，眼睛要同時增加晶狀體屈光力、兩眼內聚、瞳孔縮小，才能讓近物清楚。",
      memory: "近反應三件套：accommodation、convergence、miosis。"
    }],
    ["direct 與 consensual response", {
      simple: "光照一眼時，同眼縮瞳是 direct response，對眼同步縮瞳是 consensual response。",
      memory: "一眼受光，兩眼都縮；同眼 direct，對眼 consensual。"
    }],
    ["swinging flashlight test 與 RAPD", {
      simple: "交替照光比較兩眼傳入訊號；照到 RAPD 眼時，中樞收到的光變少，兩眼會相對放大。",
      memory: "RAPD 是 afferent defect，不是瞳孔括約肌壞掉。"
    }],
    ["light-near dissociation", {
      simple: "光近分離是光反射弱，但看近縮瞳保留，代表光反射路徑和近反應路徑受影響不同。",
      memory: "Light 差、near 好；想到 Adie、Argyll。"
    }],
    ["CN III palsy 與瞳孔/眼位", {
      simple: "第三對腦神經同時管部分眼外肌、提上瞼與副交感縮瞳，因此病變可能同時出現眼位、眼瞼、瞳孔問題。",
      memory: "CN III：眼歪、ptosis、大瞳孔要一起看。"
    }],
    ["Adie's tonic pupil", {
      simple: "Adie 常是大瞳孔、光反應差、近反應慢，且因去神經後超敏感而對稀釋 pilocarpine 特別敏感。",
      memory: "Adie = 大、慢、稀釋 pilocarpine 會縮。"
    }],
    ["Argyll Robertson pupil", {
      simple: "Argyll Robertson pupil 通常小而不規則，光反射差但近反應保留，經典上和神經梅毒相關。",
      memory: "AR pupil：accommodates but does not react。"
    }],
    ["交感路徑與三階神經元", {
      simple: "交感散瞳路徑從中樞下行到肺尖附近，再到頸上神經節，最後沿眼部神經到瞳孔擴大肌。",
      memory: "Horner 定位看三階：central、preganglionic、postganglionic。"
    }],
    ["三個 osis：ptosis、miosis、anhidrosis", {
      simple: "Horner syndrome 是交感路徑受損，所以會小瞳孔、輕微眼瞼下垂，可能合併同側無汗。",
      memory: "三個 osis：ptosis、miosis、anhidrosis。"
    }],
    ["dilation lag 與藥物鑑別", {
      simple: "Horner 患側暗處散瞳較慢，藥物測試可利用 norepinephrine 釋放或再吸收機轉幫助定位。",
      memory: "暗處看 lag；cocaine 確認，hydroxyamphetamine 幫定位。"
    }]
  ]);

  const conceptRules = [
    {
      test: /焦度計可以測什麼|度數測量的核心工具/i,
      simple: "把焦度計想成鏡片的讀值機：先讓儀器基準清楚，再讓鏡片影像清楚，清楚的位置就是鏡片度數。",
      memory: "先 reticle、後 target；單焦重後頂點，多焦近用重前頂點。"
    },
    {
      test: /reticle|movable target|歸零|校正/i,
      simple: "歸零是在確認「你的眼睛、儀器、鏡片」用同一個清楚基準，否則後面每個讀值都會一起偏掉。",
      memory: "沒有先清 reticle，就不要相信 target。"
    },
    {
      test: /sphere|球面|cylinder|axis|散光|軸/i,
      simple: "球面度數是整片鏡片一起聚散光；散光是兩個主方向聚散光不同，所以一定要同時記 cylinder 和 axis。",
      memory: "球面看全體，散光看兩軸；axis 是方向，不是度數。"
    },
    {
      test: /short axis|long axis|短軸|長軸/i,
      simple: "短軸方向屈光力較強，長軸方向屈光力較弱；焦度計看到的線條變化其實是在找兩條主經線。",
      memory: "短軸強、長軸弱；先分方向，再讀度數。"
    },
    {
      test: /multifocal|PAL|ADD|addition|多焦|近用/i,
      simple: "多焦鏡片不是只有一個度數，而是遠用到近用的度數分區或漸變，ADD 表示近用比遠用多出的正度數。",
      memory: "遠用先定位，近用看 ADD；PAL 要避開通道兩側變形區。"
    },
    {
      test: /prism|MRP|DBOC|Prentice|稜鏡|稜鏡效應/i,
      simple: "稜鏡是在改變影像位置，不是把物體真的移動；鏡片光心外的任何讀取都會產生稜鏡效應。",
      memory: "P = dF；距離越大、度數越高，稜鏡越明顯。"
    },
    {
      test: /PD|pupillary distance|OC|瞳距|光心/i,
      simple: "瞳距和光心是在對齊眼睛與鏡片的光學中心；對不準時，眼睛會被迫承受額外稜鏡。",
      memory: "眼睛看哪裡，光心就該服務哪裡。"
    },
    {
      test: /retinoscopy|working distance|working lens|檢影/i,
      simple: "檢影是用反射光判斷視網膜焦點位置；工作距離先造成一個已知偏差，最後要扣回來。",
      memory: "先中和、再扣工作距離；50 cm 扣 2.00D，67 cm 扣 1.50D。"
    },
    {
      test: /with motion|against motion|neutral|順動|逆動|中和/i,
      simple: "順動代表焦點還在檢查者後方，逆動代表焦點已經跑到檢查者前方；中和就是剛好落在工作距離平面。",
      memory: "順動加正或少負，逆動加負或少正；目標是 neutral。"
    },
    {
      test: /bracketing|套筒|sleeve|plane mirror|concave mirror/i,
      simple: "套筒改變檢影光束的發散或收斂，會改變你看到順動、逆動的判讀方式。",
      memory: "先確認 sleeve 位置，再判 with / against。"
    },
    {
      test: /phoropter|主觀驗光|objective|subjective/i,
      simple: "客觀驗光先用儀器估出起點，主觀驗光再用病人的清楚度反應把度數微調到最適合。",
      memory: "客觀給起點，主觀給終點。"
    },
    {
      test: /keratometer|K reading|mire|角膜曲率|K 值/i,
      simple: "角膜曲率計用角膜前表面的反射影像估算中央角膜彎曲程度；影像越小通常代表曲率越陡。",
      memory: "mire 看品質，K 值看彎度；先清楚規則，再相信數字。"
    },
    {
      test: /topography|heat map|keratoconus|地形圖|圓錐角膜/i,
      simple: "角膜地形圖把角膜不同位置的彎曲程度畫成顏色地圖，讓你一眼看到不規則散光或局部變陡。",
      memory: "暖色多半較陡，冷色多半較平；先看形狀，再看數值。"
    },
    {
      test: /WTR|ATR|Javal|corneal astigmatism|角膜散光/i,
      simple: "角膜散光是在比較兩條主子午線誰比較陡；順規、逆規和斜向散光是用陡軸方向來分類。",
      memory: "垂直陡多是 WTR，水平陡多是 ATR；Javal 是估內部散光的考點。"
    },
    {
      test: /pupil|anisocoria|miosis|mydriasis|瞳孔/i,
      simple: "瞳孔大小是副交感縮瞳和交感散瞳的拉扯結果；兩眼不等大時，要先判斷問題在亮處還是暗處變明顯。",
      memory: "亮處大不同查大瞳孔，暗處大不同查小瞳孔。"
    },
    {
      test: /near triad|accommodation|convergence|近反應|調節|集合/i,
      simple: "看近物時眼睛會同時做三件事：晶狀體增加調節、兩眼內聚、瞳孔縮小，讓近距離影像更清楚。",
      memory: "近反應三件套：調節、集合、縮瞳。"
    },
    {
      test: /direct response|consensual response|RAPD|swinging flashlight|afferent/i,
      simple: "直接反應看受光眼，間接反應看對側眼；RAPD 是入光訊號變弱，所以光照患眼時兩眼反而相對放大。",
      memory: "RAPD 是傳入路問題；swinging flashlight 看的是兩眼輸入差。"
    },
    {
      test: /light-near dissociation|Adie|Argyll|pilocarpine/i,
      simple: "光近分離表示光反射差、近反應相對保留；不同病因要靠反應速度、瞳孔大小和藥物敏感性分開。",
      memory: "Adie 常慢而大，Argyll 常小而不規則；稀釋 pilocarpine 可抓 Adie。"
    },
    {
      test: /Horner|ptosis|anhidrosis|dilation lag|cocaine|hydroxyamphetamine/i,
      simple: "Horner 是交感散瞳路徑受損，所以患側會小瞳孔、輕微眼瞼下垂，暗處散瞳特別慢。",
      memory: "Horner 三聯：miosis、ptosis、anhidrosis；暗處看 dilation lag。"
    },
    {
      test: /CN III|efferent|ciliary ganglion|動眼神經/i,
      simple: "輸出路問題會讓縮瞳命令到不了瞳孔括約肌，常和眼位、眼瞼或調節異常一起出現。",
      memory: "傳出路看動眼神經、睫狀神經節、括約肌三段。"
    }
  ];

  function renderSimpleSummary(point) {
    const note = conceptNoteFor(point);
    return `
      <aside class="concept-box">
        <b>一句話理解</b>
        <span>${renderInlineTerms(note.simple)}</span>
      </aside>
    `;
  }

  function renderPointDetail(point) {
    if (!point.text) return "";
    return `
      <div class="detail-block">
        <b>詳細說明</b>
        <p class="point-main">${renderInlineTerms(point.text)}</p>
      </div>
    `;
  }

  function renderExamFocus(point) {
    const items = point.examFocus?.length ? point.examFocus : point.bullets;
    if (!items?.length) return "";
    return `
      <div class="exam-focus">
        <b>考點整理</b>
        <ul class="exam-points">${items.map((item) => `<li>${renderInlineTerms(item)}</li>`).join("")}</ul>
      </div>
    `;
  }

  function renderMemoryNote(point) {
    const note = conceptNoteFor(point);
    return `
      <aside class="memory-box">
        <b>好記整理</b>
        <span>${renderInlineTerms(note.memory)}</span>
      </aside>
    `;
  }

  function conceptNoteFor(point) {
    if (point.simple || point.memory) {
      return {
        simple: point.simple || firstSentence(point.text),
        memory: point.memory || ((point.examFocus || point.bullets || []).slice(0, 3).join(" / ") || `先問自己：${point.title} 是在測什麼、數值怎麼變、錯了會造成什麼結果。`)
      };
    }
    const fixed = fixedConceptNotes.get(point.title);
    if (fixed) return fixed;
    const source = pointText(point);
    const rule = conceptRules.find((item) => item.test.test(source));
    if (rule) return rule;
    const core = firstSentence(point.text);
    const bullets = point.bullets || [];
    return {
      simple: `把這個知識點先抓成一句話：${core}`,
      memory: bullets.length ? `考前先記：${bullets.slice(0, 3).join(" / ")}。` : `先問自己：${point.title} 是在測什麼、數值怎麼變、錯了會造成什麼結果。`
    };
  }

  function renderTermNotes(point) {
    const terms = (data.terms || [])
      .map(([en, zh, note]) => ({ en: String(en), zh: String(zh), note: String(note) }))
      .sort((a, b) => b.en.length - a.en.length);
    const source = pointText(point);
    const matches = [];
    const seen = new Set();
    terms.forEach((term) => {
      const key = term.en.toLowerCase();
      if (seen.has(key) || matches.length >= 5) return;
      if (termAppears(source, term.en) || (term.zh && source.includes(term.zh))) {
        matches.push(term);
        seen.add(key);
      }
    });
    if (!matches.length) return "";
    return `
      <div class="term-note-panel" aria-label="英文術語補充">
        <b>英文術語</b>
        <div class="term-button-grid">
          ${matches.map((term) => `
            <details class="term-pop">
              <summary class="term-chip">${escapeHtml(term.en)}</summary>
              <article class="term-note">
                <strong>${escapeHtml(term.en)}</strong>
                <span>${escapeHtml(term.zh)}</span>
                <p>${escapeHtml(term.note)}</p>
              </article>
            </details>
          `).join("")}
        </div>
      </div>
    `;
  }

  const extraInlineTerms = [
    ["target", "視標 / 目標", "焦度計或檢影時被觀察、移動或對焦的目標影像。"],
    ["telescope", "望遠鏡系統", "焦度計內用來觀察 reticle 與 target 的光學系統。"],
    ["axial length", "眼軸長度", "眼球前後長度，會影響屈光狀態，但不是焦度計測鏡片的項目。"],
    ["axial power", "軸向屈光力", "沿光軸方向描述的屈光概念，和鏡片頂點度數不同。"],
    ["corneal power", "角膜屈光力", "角膜造成的屈光力，常由 K 值估算。"],
    ["power meridian", "屈光力子午線", "真正被中和或記錄屈光力的方向，常和光帶方向相差 90 度。"],
    ["endpoint", "終點 / 中和點", "檢影時反射剛好 neutral 的位置，是判讀處方前的目標。"],
    ["axis wheel", "軸度轉輪", "用來調整柱鏡軸位，讓散光主經線與視標或反射方向對齊。"],
    ["axis knob", "軸度旋鈕", "調整 axis 的控制鈕，決定散光矯正方向。"],
    ["phoropter axis", "綜合驗光儀軸位", "phoropter 上的 cylinder 軸向設定，要和被測主經線對準。"],
    ["cylinder power", "柱鏡度數", "散光兩主經線屈光力的差值，用來矯正散光量。"],
    ["cylinder magnitude", "柱鏡量", "散光大小，也就是兩主經線度數差的絕對值。"],
    ["sphere power", "球面度數", "所有方向一起加減的屈光力，用來矯正近視或遠視。"],
    ["cylinder power knob", "柱鏡度數旋鈕", "用來增加或減少 cylinder power 的控制鈕。"],
    ["retinoscope streak", "檢影光帶", "檢影鏡投出的線狀光，用來掃描瞳孔反射並判斷主經線。"],
    ["sleeve down position", "套筒下位", "retinoscope sleeve 的位置之一，會影響光束是發散或收斂。"],
    ["prism doubling", "稜鏡複像對齊", "keratometer 用稜鏡讓 mire 影像分離，再靠對齊量換算角膜曲率。"],
    ["power", "屈光力", "描述鏡片或角膜聚散光的能力，單位常用 D。"],
    ["apex", "稜鏡尖端", "稜鏡較薄的一端；影像看起來會往 apex 方向偏。"],
    ["base", "稜鏡底", "稜鏡較厚的一端；光線實際會折向 base。"],
    ["base direction", "稜鏡底向", "BI/BO/BU/BD 的方向描述，決定影像補償方向。"],
    ["prism diopter", "稜鏡度", "稜鏡量單位；1 m 處影像偏 1 cm 等於 1Δ。"],
    ["prescribed prism", "處方稜鏡", "處方要求磨入或驗證的稜鏡量與底向。"],
    ["OD/OS", "右眼 / 左眼", "OD 代表右眼，OS 代表左眼，判斷稜鏡與檢影題時要分眼。"],
    ["OD", "右眼", "oculus dexter，臨床記錄中的右眼。"],
    ["OS", "左眼", "oculus sinister，臨床記錄中的左眼。"],
    ["OU", "雙眼", "oculus uterque，代表兩眼一起。"],
    ["Rx", "處方", "眼鏡或屈光矯正的度數紀錄。"],
    ["BI", "底向內", "base in，稜鏡底朝鼻側。"],
    ["BO", "底向外", "base out，稜鏡底朝顳側。"],
    ["BU", "底向上", "base up，稜鏡底朝上。"],
    ["BD", "底向下", "base down，稜鏡底朝下。"],
    ["BI/BO/BU/BD", "稜鏡底向組合", "水平與垂直稜鏡方向的縮寫，判題時要先分 H/V 再加減。"],
    ["with/against motion", "順動 / 逆動", "檢影反射跟光帶同向是 with motion，反向是 against motion。"],
    ["with/against", "順動 / 逆動", "檢影最核心的方向判斷。"],
    ["with", "順動", "retinal reflex 和 streak 同方向移動。"],
    ["against", "逆動", "retinal reflex 和 streak 反方向移動。"],
    ["direct/consensual", "直接 / 間接光反射", "同眼縮瞳是 direct，對側眼同步縮瞳是 consensual。"],
    ["direct", "直接反應", "刺激同側眼後，同側瞳孔的反應。"],
    ["afferent defect", "傳入路缺損", "光訊號從視網膜到中樞的輸入變弱，是 RAPD 的核心。"],
    ["relative afferent pupillary defect", "相對傳入性瞳孔缺損", "RAPD 全名，表示兩眼傳入光訊號不對稱。"],
    ["afferent", "傳入路", "把光刺激從 retina / optic nerve 送入中樞的路徑。"],
    ["efferent", "傳出路", "把中樞縮瞳命令送到瞳孔括約肌的路徑。"],
    ["retina", "視網膜", "接收光刺激並啟動視覺與瞳孔反射輸入。"],
    ["optic nerve", "視神經", "CN II，負責把視網膜訊號送往中樞。"],
    ["CN II", "第二對腦神經", "視神經，是光反射的傳入路。"],
    ["CN III", "第三對腦神經", "動眼神經，包含縮瞳副交感與部分眼外肌控制。"],
    ["EW nucleus", "Edinger-Westphal 核", "副交感縮瞳路徑的中樞核團。"],
    ["pretectal area", "頂蓋前區", "光反射傳入路和雙側 EW nucleus 連接的中繼區。"],
    ["sphincter", "瞳孔括約肌", "副交感支配，收縮時造成縮瞳。"],
    ["dilator muscle", "瞳孔擴大肌", "交感支配，作用時造成散瞳。"],
    ["Muller muscle", "Muller 肌", "交感支配的上眼瞼平滑肌，Horner syndrome 會造成輕微 ptosis。"],
    ["Müller muscle", "Müller 肌", "交感支配的上眼瞼平滑肌，受損會造成輕微 ptosis。"],
    ["levator palpebrae", "提上瞼肌", "主要由 CN III 支配，麻痺會造成明顯 ptosis。"],
    ["superior cervical ganglion", "頸上神經節", "Horner 交感路徑中的重要中繼站。"],
    ["dilation lag", "散瞳延遲", "暗處患側瞳孔散大較慢，是 Horner syndrome 的重要線索。"],
    ["osis", "osis 三聯", "Horner 常考 ptosis、miosis、anhidrosis 三個字尾相同的表現。"],
    ["Horner", "Horner 症候群", "交感路徑受損造成 miosis、ptosis、可能 anhidrosis。"],
    ["Adie's", "Adie 瞳孔", "Adie's tonic pupil 的簡稱，常見大瞳孔、光反應差與近反應慢。"],
    ["Adie", "Adie 瞳孔", "常見大瞳孔、光反射差、近反應慢，對稀釋 pilocarpine 敏感。"],
    ["Prentice's", "Prentice 法則", "Prentice's rule 的簡稱，用去中心距離和度數估算誘發稜鏡。"],
    ["Javal's", "Javal 法則", "用角膜散光估算總散光的經驗法則名稱。"],
    ["Argyll Robertson", "Argyll Robertson 瞳孔", "光反射差但近反應保留，經典上和神經梅毒相關。"],
    ["Argyll", "Argyll Robertson 瞳孔簡稱", "用來指光近分離、小而不規則的經典瞳孔異常。"],
    ["topographer", "角膜地形圖儀", "量測較大範圍角膜表面，適合看不規則散光與圓錐角膜。"],
    ["mire distortion", "mire 變形", "角膜反射影像扭曲，提示淚膜或角膜表面不規則。"],
    ["mire clear and regular", "mire 清楚且規則", "表示角膜中央反射影像品質好，K 值較可信。"],
    ["tear film", "淚膜", "覆蓋角膜表面；不穩定會讓 mire 短暫扭曲。"],
    ["convex mirror", "凸面鏡", "角膜前表面像凸面鏡，會反射 mire 影像。"],
    ["flat K", "較平 K 值", "角膜較平主子午線的讀值。"],
    ["steep K", "較陡 K 值", "角膜較陡主子午線的讀值。"],
    ["WTR/ATR", "順規 / 逆規散光", "WTR 多為垂直較陡，ATR 多為水平較陡。"],
    ["WTR/ATR/oblique", "順規 / 逆規 / 斜向散光", "用陡軸方向分類角膜散光。"],
    ["oblique", "斜向", "主軸不接近水平或垂直的方向。"],
    ["cone", "圓錐 / 錐狀區", "角膜局部變陡突出，常見於 keratoconus 圖形判讀。"],
    ["irregular", "不規則", "不是整齊兩條主經線能解釋的形狀或散光。"],
    ["steeper", "較陡", "曲率半徑較小、屈光力較高。"],
    ["flatter", "較平", "曲率半徑較大、屈光力較低。"],
    ["pattern", "圖形型態", "地形圖或反射圖上的分布樣子，用來判斷病灶。"],
    ["double check", "回頭確認", "客觀驗光完成雙眼後，再回到第一眼確認結果。"],
    ["neutral density filter", "中性密度濾片", "降低光強但不改變顏色，可用於部分瞳孔/視覺檢查。"],
    ["spectacle correction", "眼鏡矯正", "以眼鏡鏡片補償屈光不正。"],
    ["CL fitting", "隱形眼鏡驗配", "依角膜曲率與處方選擇合適隱形眼鏡。"],
    ["correction factor", "修正因子", "估算公式中用來補償系統性偏差的項目。"],
    ["same direction add", "同方向相加", "水平稜鏡同方向時總效應相加。"],
    ["opposite direction add", "相反方向相加", "垂直稜鏡相反方向時總效應相加。"],
    ["H prism", "水平稜鏡", "水平方向的 base in / base out 稜鏡。"],
    ["V prism", "垂直稜鏡", "垂直方向的 base up / base down 稜鏡。"],
    ["D", "屈光度 D", "diopter，鏡片或角膜屈光力單位。"],
    ["F", "屈光力 F", "Prentice's rule 中代表鏡片度數或屈光力。"],
    ["P", "稜鏡量 P", "Prentice's rule 中代表 prism diopter。"],
    ["d", "去中心距離 d", "Prentice's rule 中光心到視線的距離，單位要用 cm。"],
    ["r", "曲率半徑 r", "角膜曲率半徑，越小代表越陡。"],
    ["K", "K 值", "角膜曲率或角膜屈光力讀值。"],
    ["cm", "公分", "Prentice's rule 中 d 要用 cm。"],
    ["mm", "毫米", "瞳距、曲率半徑與去中心距離常用單位。"],
    ["m", "公尺", "距離單位；稜鏡度定義常用 1 m 觀察距離。"],
    ["degree", "度", "角度單位；axis 常用 degree 表示。"],
    ["ring", "刻度圈", "焦度計 reticle 上用來估稜鏡量的圈。"],
    ["x", "軸位記號", "處方中 x 後面的角度代表 cylinder axis。"],
    ["PL", "平光", "Plano，表示 0.00D 或無球面度數。"]
  ];

  const eyeInlineTerms = [
    ["neurosensory retina", "神經視網膜", "真正負責接收與處理光訊號的多層神經組織。"],
    ["retinal pigment epithelium", "視網膜色素上皮", "照顧感光細胞、吸收雜散光，並形成外血－視網膜障壁。"],
    ["internal limiting membrane", "內界膜", "視網膜最靠玻璃體側的邊界。"],
    ["nerve fiber layer", "神經纖維層", "神經節細胞軸突前往視乳頭的通道。"],
    ["ganglion cell layer", "神經節細胞層", "神經節細胞本體所在的位置。"],
    ["inner plexiform layer", "內網狀層", "雙極細胞、無軸突細胞與神經節細胞的接線區。"],
    ["inner nuclear layer", "內核層", "雙極、水平、無軸突與穆勒細胞的細胞核所在層。"],
    ["outer plexiform layer", "外網狀層", "感光細胞接上雙極與水平細胞的接線區。"],
    ["outer nuclear layer", "外核層", "桿狀與錐狀細胞的細胞核所在層。"],
    ["external limiting membrane", "外界膜", "穆勒細胞與感光細胞形成的連接邊界。"],
    ["plexiform layer", "網狀層", "以突觸接線為主的視網膜層。"],
    ["nuclear layer", "核層", "以神經細胞本體與細胞核為主的視網膜層。"],
    ["RPE tight junction", "色素上皮緊密連結", "封住色素上皮細胞間隙，是外血－視網膜障壁的核心。"],
    ["adherens junction", "黏著連結", "讓相鄰細胞穩定連接的細胞連結。"],
    ["inner blood-retinal barrier", "內血－視網膜障壁", "主要由視網膜微血管內皮的緊密連結形成。"],
    ["outer blood-retinal barrier", "外血－視網膜障壁", "主要由視網膜色素上皮的緊密連結形成。"],
    ["blood-retinal barrier", "血－視網膜障壁", "限制血液成分任意進入視網膜，維持神經環境穩定。"],
    ["retinal vascular endothelium", "視網膜血管內皮", "形成內血－視網膜障壁的血管內襯細胞。"],
    ["retinal capillary", "視網膜微血管", "供應內層視網膜的細小血管。"],
    ["retinal vessels", "視網膜血管", "主要供應內層視網膜。"],
    ["retinal edema", "視網膜水腫", "液體累積在視網膜內，會破壞分層與視覺功能。"],
    ["optic nerve head", "視神經頭", "視神經離開眼球的前端區域，也就是視乳頭所在處。"],
    ["outer retina", "外層視網膜", "靠近脈絡膜與色素上皮，包含感光細胞的重要區域。"],
    ["inner retina", "內層視網膜", "靠近玻璃體，主要由中央視網膜循環供血。"],
    ["fovea centralis", "中央凹", "黃斑中心的高解析度視覺區。"],
    ["ganglion cell axons", "神經節細胞軸突", "集合後形成視神經，把視網膜訊號送往腦部。"],
    ["ganglion cell bodies", "神經節細胞本體", "神經節細胞的細胞本體，位於神經節細胞層。"],
    ["Müller cell nuclei", "穆勒細胞核", "穆勒細胞的細胞核，位於內核層。"],
    ["photoreceptor nuclei", "感光細胞核", "桿狀與錐狀細胞的細胞核，位於外核層。"],
    ["inner segments", "感光細胞內節", "感光細胞富含胞器並維持代謝的區段。"],
    ["Müller glia", "穆勒膠細胞", "跨越多層視網膜，負責支撐、代謝與離子平衡。"],
    ["Müller", "穆勒細胞", "視網膜主要膠細胞的名稱。"],
    ["neurotransmitter", "神經傳遞物", "神經細胞在突觸間傳遞訊息的化學物質。"],
    ["sclera", "鞏膜", "眼球最外層堅韌白色外殼。"],
    ["lens", "水晶體", "位於虹膜後方，負責調整聚焦。"],
    ["dark current", "暗電流", "暗處感光細胞陽離子通道開啟，讓細胞維持去極化的電流。"],
    ["cation channel", "陽離子通道", "允許鈉、鈣等正離子進入感光細胞的通道。"],
    ["channel open", "通道開啟", "暗處環鳥苷酸較高，陽離子通道維持開啟。"],
    ["channel closed", "通道關閉", "受光後環鳥苷酸下降，使陽離子通道關閉。"],
    ["depolarization", "去極化", "膜電位變得較不負；感光細胞暗處會維持此狀態。"],
    ["depolarized", "處於去極化", "細胞膜電位較不負的狀態。"],
    ["depolarize", "去極化", "使膜電位變得較不負。"],
    ["hyperpolarization", "超極化", "膜電位變得更負；感光細胞受光時會發生。"],
    ["hyperpolarized", "處於超極化", "細胞膜電位變得更負的狀態。"],
    ["hyperpolarize", "超極化", "使膜電位變得更負。"],
    ["ON bipolar", "開型雙極細胞", "受光時去極化，偏好亮刺激增加。"],
    ["OFF bipolar", "關型雙極細胞", "受光時超極化，偏好亮刺激減少。"],
    ["ON bipolar cell", "開型雙極細胞", "受光增加時去極化的雙極細胞。"],
    ["OFF bipolar cell", "關型雙極細胞", "受光減少時去極化的雙極細胞。"],
    ["bipolar/Müller cell", "雙極細胞／穆勒細胞", "兩者共同參與視網膜內層電位反應。"],
    ["bipolar/Müller activity", "雙極細胞／穆勒細胞活動", "視網膜電位圖 b 波的重要來源。"],
    ["inner retinal activity", "內層視網膜活動", "由雙極細胞、無軸突細胞與穆勒細胞等共同產生的內層反應。"],
    ["ON bipolar cell response", "開型雙極細胞反應", "開型雙極細胞對光刺激的電位反應。"],
    ["Müller cell potassium currents", "穆勒細胞鉀離子電流", "穆勒細胞調節鉀離子時對 b 波的貢獻。"],
    ["RPE apical membrane response", "色素上皮頂端膜反應", "色素上皮靠感光細胞側的慢電位反應。"],
    ["Müller cell slow component", "穆勒細胞慢成分", "穆勒細胞對較慢視網膜電位成分的貢獻。"],
    ["a、b、c wave", "a 波、b 波、c 波", "視網膜電位圖三個常考波形。"],
    ["a/b waves", "a 波／b 波", "臨床視網膜電位圖最常分析的兩個主要波形。"],
    ["ON/OFF", "開型／關型路徑", "把亮度增加與亮度減少分開編碼的兩條視網膜路徑。"],
    ["center-surround", "中心－周邊拮抗", "中心與周邊對光的反應相反，用來凸顯邊界與對比。"],
    ["lateral inhibition", "側向抑制", "鄰近訊號彼此抑制，使明暗邊界更清楚。"],
    ["rod pathway", "桿狀細胞路徑", "擅長弱光與高敏感度，但空間解析度較低。"],
    ["cone pathway", "錐狀細胞路徑", "擅長明視、色覺與高解析度。"],
    ["rod/cone", "桿狀／錐狀細胞", "兩類感光細胞的合稱。"],
    ["spatial resolution", "空間解析度", "分辨兩個靠近細節的能力。"],
    ["sensitivity", "敏感度", "偵測微弱光刺激的能力。"],
    ["acuity", "視力解析度", "看清細小細節的能力。"],
    ["cascade", "級聯反應", "一個活化步驟接著放大下一步的連鎖反應。"],
    ["full-field ERG", "全視野視網膜電位圖", "用整片視網膜對閃光的總反應評估廣泛功能。"],
    ["multifocal ERG", "多焦視網膜電位圖", "同時估計多個局部視網膜區域的反應。"],
    ["pattern ERG", "圖形視網膜電位圖", "常用來評估黃斑與神經節細胞功能。"],
    ["dark-adapted", "暗適應狀態", "先在暗處適應後測量，以桿狀細胞系統為主。"],
    ["light-adapted", "明適應狀態", "在背景亮光下測量，以錐狀細胞系統為主。"],
    ["electronegative pattern", "負電位型波形", "a 波相對保留、b 波明顯降低，提示內層視網膜傳遞異常。"],
    ["photoreceptor response", "感光細胞反應", "感光細胞受光後產生的電位變化。"],
    ["Müller activity", "穆勒細胞活動", "穆勒膠細胞對視網膜電位圖波形的貢獻。"],
    ["rod system", "桿狀細胞系統", "主導暗視的高敏感度視覺系統。"],
    ["cone system", "錐狀細胞系統", "主導明視、色覺與高解析度的視覺系統。"],
    ["flicker", "閃爍刺激", "快速重複的亮暗刺激，常用來測試錐狀細胞系統。"],
    ["retinal circulation", "視網膜循環", "主要供應內層視網膜的血流系統。"],
    ["choroidal circulation", "脈絡膜循環", "高流量血流，主要供應外層視網膜與色素上皮。"],
    ["internal carotid artery", "內頸動脈", "眼動脈的主要來源血管。"],
    ["short posterior ciliary arteries", "短後睫狀動脈", "供應脈絡膜與視神經頭的重要分支。"],
    ["long posterior ciliary arteries", "長後睫狀動脈", "向前供應虹膜與睫狀體的重要分支。"],
    ["anterior ciliary arteries", "前睫狀動脈", "由眼外肌動脈分支而來，參與前眼部供血。"],
    ["major arterial circle of iris", "虹膜動脈大環", "長後睫狀與前睫狀動脈形成的前眼部動脈環。"],
    ["iris major arterial circle", "虹膜動脈大環", "供應虹膜與睫狀體的主要動脈環。"],
    ["central retinal vein", "中央視網膜靜脈", "回收視網膜內層血液並沿視神經離開。"],
    ["ophthalmic veins", "眼靜脈", "眼眶的重要靜脈回流，與海綿竇相通。"],
    ["cavernous sinus", "海綿竇", "顱內靜脈竇，接收眼靜脈回流。"],
    ["foveal avascular zone", "中央凹無血管區", "中央凹中心沒有視網膜血管，減少光路干擾。"],
    ["FAZ", "中央凹無血管區", "中央凹中心沒有視網膜血管的區域縮寫。"],
    ["inner retinal circulation", "內層視網膜循環", "由中央視網膜動脈主導的內層供血。"],
    ["superficial and deep capillary plexuses", "淺層與深層微血管叢", "中央視網膜動脈在內層視網膜形成的兩組微血管網。"],
    ["superficial 與 deep capillary plexuses", "淺層與深層微血管叢", "中央視網膜動脈在內層視網膜形成的兩組微血管網。"],
    ["superficial與deep capillary plexuses", "淺層與深層微血管叢", "中央視網膜動脈在內層視網膜形成的兩組微血管網。"],
    ["end-arterial circulation", "終末動脈型循環", "側枝循環不足，阻塞時容易造成明顯缺血。"],
    ["lacrimal artery", "淚腺動脈", "眼動脈分支，供應淚腺與外側眼瞼。"],
    ["muscular branches", "肌支", "眼動脈供應眼外肌的分支，也可發出前睫狀動脈。"],
    ["facial artery", "顏面動脈", "外頸動脈系統分支，參與眼瞼與顏面供血。"],
    ["uveal tract", "葡萄膜", "虹膜、睫狀體與脈絡膜的合稱。"],
    ["orbit", "眼眶", "容納眼球、眼外肌、神經與血管的骨性空間。"],
    ["visual field", "視野", "眼睛固定注視時能看見的空間範圍。"],
    ["visual hemifield", "半側視野", "視野的左半或右半。"],
    ["nasal retina", "鼻側視網膜", "靠近鼻側的半邊視網膜，纖維會在視交叉交叉。"],
    ["temporal retina", "顳側視網膜", "靠近顳側的半邊視網膜，纖維不在視交叉交叉。"],
    ["nasal retinal fibers", "鼻側視網膜纖維", "在視交叉跨到對側的視網膜纖維。"],
    ["temporal retinal fibers", "顳側視網膜纖維", "在視交叉維持同側的視網膜纖維。"],
    ["optic canal", "視神經管", "視神經與眼動脈通過的骨性管道。"],
    ["superior colliculus", "上丘", "參與視覺定向與眼頭轉向反應。"],
    ["suprachiasmatic nucleus", "視交叉上核", "接收光訊號並調節晝夜節律。"],
    ["SCN", "視交叉上核", "調節晝夜節律的下視丘核團縮寫。"],
    ["pretectal area", "頂蓋前區", "瞳孔光反射傳入路徑的重要中繼區。"],
    ["primary visual cortex", "初級視覺皮質", "枕葉最先接收視放射訊號的皮質區。"],
    ["visual cortex", "視覺皮質", "負責分析視覺訊息的枕葉皮質。"],
    ["calcarine cortex", "距狀皮質", "距狀溝周圍的初級視覺皮質。"],
    ["temporal lobe", "顳葉", "梅耶氏環繞行的位置，病灶常造成對側上象限缺損。"],
    ["parietal lobe", "頂葉", "上方視放射通過的位置，病灶常造成對側下象限缺損。"],
    ["parietal route", "頂葉路徑", "通過頂葉的上方視放射路徑。"],
    ["occipital cortex", "枕葉皮質", "視覺訊號抵達並被初步分析的皮質。"],
    ["occipital pole", "枕極", "枕葉最後端，黃斑視覺在此有較大代表區。"],
    ["contralateral", "對側", "位於身體或腦部相反的一側。"],
    ["ipsilateral", "同側", "位於身體或腦部相同的一側。"],
    ["decussate", "交叉到對側", "神經纖維跨越中線到另一側。"],
    ["retinotopic organization", "視網膜拓樸排列", "視網膜相鄰位置在中樞仍維持相鄰對應。"],
    ["magnocellular", "大細胞路徑", "較擅長動態、低對比與時間變化。"],
    ["parvocellular", "小細胞路徑", "較擅長細節與紅綠色覺。"],
    ["koniocellular", "塵細胞路徑", "與部分藍黃色覺訊息相關。"],
    ["optic nerve lesion", "視神經病灶", "通常造成同側單眼視野缺損。"],
    ["optic chiasm lesion", "視交叉病灶", "中央病灶典型造成雙顳側偏盲。"],
    ["optic tract lesion", "視束病灶", "造成對側同向性視野缺損。"],
    ["occipital cortex lesion", "枕葉皮質病灶", "常造成對側同向偏盲，可能伴黃斑保留。"],
    ["contralateral homonymous defect", "對側同向性缺損", "兩眼同一側視野一起缺損。"],
    ["pupillary light reflex", "瞳孔光反射", "光刺激引發雙眼縮瞳的反射。"],
    ["circadian rhythm", "晝夜節律", "由光訊號校準的每日生理節律。"],
    ["brainstem", "腦幹", "包含多個視覺反射與眼球運動中樞。"],
    ["inferior retina", "下方視網膜", "接收上方視野，訊號常經顳葉梅耶氏環傳遞。"],
    ["left visual field", "左半視野", "經雙眼右半視網膜處理，最後送往右側視覺中樞。"],
    ["lipid layer", "脂質層", "由瞼板腺為主提供，減少淚膜蒸發。"],
    ["aqueous component", "水液成分", "由淚腺為主提供，含水分、電解質與防禦蛋白。"],
    ["aqueous layer", "水液層", "傳統三層模型中的中間水液部分。"],
    ["goblet cells", "杯狀細胞", "結膜中分泌黏蛋白的細胞。"],
    ["accessory lacrimal glands", "副淚腺", "提供基礎水液分泌的小型淚腺。"],
    ["main lacrimal gland", "主淚腺", "位於眼眶外上方，反射性分泌時特別重要。"],
    ["greater petrosal nerve", "大岩神經", "攜帶淚腺副交感節前纖維。"],
    ["pterygopalatine ganglion", "翼腭神經節", "淚腺副交感路徑的神經節。"],
    ["inferior meatus", "下鼻道", "鼻淚管最後開口的位置。"],
    ["frontal sinus", "額竇", "位於額骨內的副鼻竇，不是鼻淚管的開口位置。"],
    ["blink", "眨眼", "把淚膜重新鋪平並協助淚液排出。"],
    ["dry eye", "乾眼", "淚膜量或品質不足造成的眼表不穩定。"],
    ["epiphora", "溢淚", "淚液排出受阻或分泌過多造成眼淚外溢。"],
    ["TBUT", "淚膜破裂時間", "眨眼後到淚膜第一次破裂的時間。"],
    ["secreted mucin", "分泌型黏蛋白", "由杯狀細胞分泌，協助潤濕與捕捉碎屑。"],
    ["conjunctival goblet cells", "結膜杯狀細胞", "分泌黏蛋白以穩定眼表。"],
    ["tear breakup", "淚膜破裂", "淚膜失去連續性，造成光學品質與舒適度下降。"],
    ["drainage", "引流", "把淚液從眼表帶入鼻腔的排出流程。"],
    ["superolateral orbit", "眼眶外上方", "主淚腺所在的解剖位置。"],
    ["CN V1", "三叉神經眼支", "負責角膜感覺，也是反射性流淚的傳入路。"],
    ["lysozyme", "溶菌酶", "淚液中的抗菌蛋白。"],
    ["cornea", "角膜", "透明的眼球前表面，也是重要屈光介面。"],
    ["corneal/conjunctival sensation", "角膜／結膜感覺", "眼表感覺是反射性流淚的傳入訊號。"],
    ["ophthalmic division of trigeminal nerve", "三叉神經眼支", "負責角膜與結膜感覺的主要傳入神經。"],
    ["trigeminal ophthalmic division", "三叉神經眼支", "三叉神經第一支，負責主要眼表感覺。"],
    ["facial nerve", "顏面神經", "攜帶淚腺副交感傳出路徑的第七對腦神經。"],
    ["ocular surface epithelium", "眼表上皮", "角膜與結膜表面的上皮屏障。"],
    ["hydrophobic epithelial surface", "疏水性上皮表面", "若沒有黏蛋白協助，水液不容易均勻鋪展。"],
    ["wettable surface", "可潤濕表面", "淚液能均勻鋪展的親水性表面。"],
    ["membrane-associated mucin", "膜結合型黏蛋白", "固定在眼表上皮，形成醣萼並幫助潤濕。"],
    // ── 單元 16 中樞神經系統與視覺反射 ──
    ["CN II", "第二對腦神經", "視神經；瞳孔對光反射的傳入（二進）。"],
    ["CN III", "第三對腦神經", "動眼神經；瞳孔／近反射的傳出（三出），含動眼核與 E-W 核。"],
    ["CN V", "第五對腦神經", "三叉神經；角膜反射的傳入（五進）。"],
    ["CN VI", "第六對腦神經", "外旋神經；神經核位於橋腦。"],
    ["CN VII", "第七對腦神經", "顏面神經；角膜反射的傳出（七出），支配閉眼與反射性流淚。"],
    ["Edinger-Westphal nucleus", "E-W 核", "動眼神經的副交感副核，位中腦、緊鄰動眼核，支配瞳孔括約肌與睫狀肌。"],
    ["E-W nucleus", "E-W 核", "Edinger-Westphal nucleus；副交感、支配平滑肌。"],
    ["E-W", "E-W", "Edinger-Westphal nucleus（E-W 核）；瞳孔對光反射的副交感核。"],
    ["oculomotor nucleus", "動眼核", "支配眼外肌等骨骼肌的體運動核，位中腦。"],
    ["oculomotor nerve", "動眼神經", "第三對腦神經，支配多數眼外肌與提上瞼肌。"],
    ["trochlear nucleus", "滑車核", "第四對腦神經核，位中腦下丘層。"],
    ["abducens nucleus", "外旋核", "第六對腦神經核，位橋腦。"],
    ["ciliary ganglion", "睫狀神經節", "瞳孔／睫狀肌副交感換神經元的神經節。"],
    ["short ciliary nerves", "短睫狀神經", "由睫狀神經節發出，支配瞳孔括約肌與睫狀肌。"],
    ["sphincter pupillae", "瞳孔括約肌", "收縮使瞳孔縮小的平滑肌，受 E-W 副交感支配。"],
    ["medial rectus", "內直肌", "使眼球向內轉的眼外肌（骨骼肌），由動眼核支配。"],
    ["near reflex", "近物反射", "看近時匯聚、調節與縮瞳的三聯反射。"],
    ["accommodation reflex", "調節反射", "看近時睫狀肌收縮使水晶體變厚的反射。"],
    ["posterior commissure", "後聯合", "把前頂蓋核訊號送到兩側 E-W 核，造成雙側縮瞳。"],
    ["pretectal nucleus", "前頂蓋核", "瞳孔對光反射的中繼核，位上丘層。"],
    ["corpora quadrigemina", "四疊體", "上丘×2＋下丘×2，位於中腦。"],
    ["superior brachium", "上丘臂", "視束分支進入上丘／頂蓋前區的通路。"],
    ["inferior colliculus", "下丘", "聽覺中繼，與內側膝狀體相連。"],
    ["medial longitudinal fasciculus", "內側縱束", "連接第三、四、六對腦神經核以協調共軛眼動。"],
    ["MLF", "內側縱束", "medial longitudinal fasciculus；協調眼球共軛運動。"],
    ["corneal reflex", "角膜反射", "角膜被觸發引發眨眼，五進（CN V）七出（CN VII）。"],
    ["orbicularis oculi", "眼輪匝肌", "由第七對腦神經支配，使眼睛閉合。"],
    ["levator palpebrae", "提上瞼肌", "由第三對腦神經支配，使上眼瞼上提（睜眼）。"],
    ["nasociliary nerve", "鼻睫神經", "三叉神經眼支的分支，攜帶角膜感覺。"],
    ["vestibulo-ocular reflex", "前庭眼動反射", "刺激半規管時穩定凝視的反射，中樞在橋腦。"],
    ["caloric test", "溫熱試驗", "灌冰／溫水刺激水平半規管以測前庭眼動反射。"],
    ["semicircular canal", "半規管", "內耳偵測旋轉的構造，分前、後、外（水平）三個。"],
    ["nystagmus", "眼震", "眼球規律的快相與慢相往返運動。"],
    ["COWS", "COWS 口訣", "Cold-Opposite、Warm-Same：冰水快相對側、溫水快相同側。"],
    ["blown pupil", "放大固定瞳孔", "動眼神經副交感受損，瞳孔放大且對光不縮。"],
    ["lateral geniculate body", "外側膝狀體", "視覺意識路徑在視丘的轉接站，不參與光反射。"],
    ["LGB", "外側膝狀體", "lateral geniculate body；視覺意識中繼，不參與光反射。"],
    ["midbrain", "中腦", "腦幹最上段，瞳孔對光反射中樞，藏第三、四對腦神經核。"],
    ["pons", "橋腦", "腦幹中段，前庭眼動與角膜反射中樞，藏第六對腦神經核。"],
    ["medulla", "延腦", "腦幹最下段，呼吸與心跳中樞。"],
    // ── 單元 17 眼瞼、淚腺與結膜 ──
    ["levator palpebrae superioris muscle", "提上瞼肌", "由動眼神經（CN III）支配、隨意上提上眼瞼的主要肌肉；麻痺造成眼瞼下垂。"],
    ["levator palpebrae superioris", "提上瞼肌", "上提上眼瞼的主要隨意肌，由動眼神經支配。"],
    ["orbicularis oculi muscle", "眼輪匝肌", "由顏面神經（CN VII）支配、收縮使眼睛閉合；麻痺造成閉合不全。"],
    ["Müller's muscle", "穆勒氏肌", "即上瞼板肌，由交感神經支配、不自主微提上眼瞼；過度作用造成眼瞼攣縮。"],
    ["superior tarsal muscle", "上瞼板肌", "穆勒氏肌的正式名稱，交感神經支配的平滑肌。"],
    ["lower lid retractors", "下眼瞼縮肌", "下眼瞼相當於穆勒氏肌的構造，受交感神經支配。"],
    ["frontalis muscle", "額肌", "收縮使眉毛上抬，由顏面神經支配。"],
    ["orbital septum", "眼眶隔膜", "起自眶緣的纖維膜，是眼瞼與眼眶的界限、阻擋眶脂肪前突。"],
    ["levator aponeurosis", "提上瞼肌腱膜", "提上瞼肌往前移行成的腱膜，止於瞼板與皮膚。"],
    ["Whitnall's ligament", "Whitnall 韌帶", "提上瞼肌淺面增厚的橫行韌帶（節制韌帶），限制提肌過度上提，約在眼球赤道正上方。"],
    ["grey line", "灰線", "瞼緣中間的分隔線（Riolan 肌所在），是前板與後板的分界。"],
    ["Riolan's muscle", "Riolan 肌", "位於瞼緣灰線處的眼輪匝肌纖維。"],
    ["anterior lamella", "前板", "眼瞼前葉：皮膚、皮下組織與眼輪匝肌。"],
    ["posterior lamella", "後板", "眼瞼後葉：瞼板、瞼板腺與結膜。"],
    ["skin layer", "皮膚層", "眼瞼最外層，是全身最薄的皮膚之一。"],
    ["tarsal plate", "瞼板", "緻密結締組織形成的半月狀硬板，支撐眼瞼並含瞼板腺。"],
    ["mucocutaneous junction", "皮膚黏膜交界", "瞼緣最後緣皮膚轉為結膜的交界線。"],
    ["lash line", "睫毛線", "瞼緣睫毛排列所在的線。"],
    ["palpebral fissure", "瞼裂", "上下瞼緣之間的裂隙，正常高度約 5~10 mm。"],
    ["medial canthus", "內眥", "瞼裂鼻側連結處（大眥），含淚阜與半月皺襞。"],
    ["lateral canthus", "外眥", "瞼裂顳側連結處（小眥），正常比內眥高約 1~2 mm。"],
    ["plica semilunaris", "半月皺襞", "內眥淚阜旁的半月形結膜皺褶。"],
    ["caruncle", "淚阜", "內眥處粉紅肉樣隆起，為變性的皮膚組織。"],
    ["epicanthus", "內眥贅皮", "內眥垂直皮膚皺褶，東方人常見，是嬰幼兒假性內斜視主因。"],
    ["lagophthalmos", "兔眼", "閉眼時角膜無法完全被覆蓋的眼瞼閉合不全。"],
    ["ptosis", "眼瞼下垂", "上眼瞼下垂，常因提上瞼肌（CN III）或交感神經失能。"],
    ["palpebral conjunctiva", "瞼結膜", "覆蓋眼瞼後面、牢固黏在瞼板上不可推動的結膜。"],
    ["bulbar conjunctiva", "球結膜", "覆蓋前部鞏膜、鬆散可推動的結膜，最薄最透明。"],
    ["fornix conjunctiva", "穹窿結膜", "瞼結膜與球結膜交接的反摺囊，疏鬆多皺褶。"],
    ["conjunctival sac", "結膜囊", "三部結膜以瞼裂為開口圍成的囊狀間隙。"],
    ["limbus", "角鞏膜緣", "角膜與結膜的交界環（輪部），是結膜最薄最透明處。"],
    ["lamina propria", "固有層", "結膜上皮下方的結締組織，分腺樣層與纖維層。"],
    ["adenoid layer", "腺樣層", "固有層含淋巴球的一層（淋巴層），穹窿發育好、發炎易成濾泡。"],
    ["fibrous layer", "纖維層", "固有層由膠原與彈力纖維構成的較厚層，含血管神經。"],
    ["non-keratinizing squamous epithelium", "非角化鱗狀上皮", "結膜的上皮型態，夾雜杯狀細胞。"],
    ["mucus layer", "黏液層", "淚膜最內側、由結膜杯狀細胞分泌的黏蛋白層。"],
    ["crypts of Henle", "亨利氏隱窩", "瞼結膜的管狀黏膜皺褶，分泌黏液（非真正腺體）。"],
    ["glands of Manz", "曼氏腺", "位於輪部結膜的黏液腺。"],
    ["glands of Zeis", "蔡氏腺", "接到睫毛毛囊的皮脂腺，分泌油脂（脂質層）。"],
    ["glands of Moll", "莫氏腺", "毛囊旁的變異汗腺，開口於毛囊或蔡氏腺管。"],
    ["glands of Krause", "克勞斯腺", "位於穹窿的副淚腺，分泌水液層。"],
    ["glands of Wolfring", "沃爾夫林腺", "位於瞼板上下緣的副淚腺，分泌水液層。"],
    ["eccrine sweat glands", "外泌汗腺", "遍布全眼瞼皮膚的汗腺，不像莫氏腺只在瞼緣。"],
    ["Meibomian glands", "瞼板腺", "瞼板內直立排列的變異皮脂腺，開口瞼緣、分泌脂質層。"],
    ["lacrimal apparatus", "淚器", "淚腺（分泌）加淚管（排泄）的整套系統。"],
    ["lacrimal ducts", "淚管", "淚液排出通道的總稱，含淚點、淚小管、淚囊與鼻淚管。"],
    ["lacrimal puncta", "淚點", "上下瞼緣鼻側的淚液排出口，收集淚湖淚水。"],
    ["lacrimal canaliculi", "淚小管", "連接淚點與淚囊的小管，先垂直再轉水平。"],
    ["orbital part", "眶部", "淚腺較大的上半部（眶葉）。"],
    ["palpebral part", "瞼部", "淚腺較小的下半部（瞼葉）。"],
    ["Rosenmüller valve", "羅氏瓣膜", "淚小管與淚囊交接處的瓣膜，防止淚水逆流。"],
    ["Hasner valve", "哈氏瓣膜", "鼻淚管下端開口的黏膜瓣，嬰兒未開通造成先天性鼻淚管阻塞。"],
    ["lacus lacrimalis", "淚湖", "內眥處聚積淚水的小窪。"],
    ["secretory system", "分泌系統", "淚器負責製造與遞送淚液的部分。"],
    ["excretory system", "排泄系統", "淚器負責排出清理淚液的部分。"],
    ["lacrimal pump", "淚液幫浦", "眨眼時眼輪匝肌收縮造成淚囊擴張與淚小管收縮、產生負壓抽淚。"],
    ["tear reflex", "流淚反射", "眼表受刺激引發流淚，傳入 CN V、傳出 CN VII 副交感。"],
    ["ophthalmic nerve", "三叉神經眼支", "三叉神經第一支（V1），支配上方結膜與眼表感覺。"],
    ["maxillary nerve", "三叉神經上頜支", "三叉神經第二支（V2），支配下方結膜感覺。"],
    ["mandibular nerve", "三叉神經下頜支", "三叉神經第三支（V3），不支配結膜（常見陷阱選項）。"],
    ["frontal nerve", "額神經", "眼支的分支，再分眶上與滑車上神經。"],
    ["supraorbital nerve", "眶上神經", "額神經分支，支配上方眼瞼與結膜。"],
    ["supratrochlear nerve", "滑車上神經", "額神經分支，支配上方內側眼瞼與結膜。"],
    ["infratrochlear nerve", "滑車下神經", "鼻睫神經分支，支配內側結膜與淚阜。"],
    ["infraorbital nerve", "眶下神經", "上頜支分支，支配下方瞼結膜、下穹窿與下球結膜。"],
    ["lacrimal nerve", "淚腺神經", "眼支分支，支配外側上下結膜與淚腺區感覺。"],
    ["long ciliary nerves", "長睫狀神經", "鼻睫神經分支，支配近輪部球結膜與角膜。"],
    ["trigeminal nerve", "三叉神經", "第五對腦神經，負責眼瞼與結膜的感覺。"],
    ["abducens nerve", "外旋神經", "第六對腦神經（CN VI），支配外直肌；不支配提上瞼肌。"],
    ["external carotid artery", "外頸動脈", "經顏面動脈系統參與眼瞼外側供血。"],
    ["medial palpebral artery", "內側眼瞼動脈", "眼動脈（內頸系統）直接分支，供應眼瞼內側。"],
    ["lateral palpebral artery", "外側眼瞼動脈", "淚腺動脈分支，供應眼瞼外側。"],
    ["marginal arcade", "緣動脈弓", "近瞼緣的眼瞼動脈弓。"],
    ["peripheral arcade", "周邊動脈弓", "瞼板上緣的眼瞼動脈弓，上瞼特有。"],
    ["superior cervical ganglion", "上頸神經節", "交感神經節，發出纖維支配穆勒氏肌與眼瞼平滑肌。"],
    ["Sjögren's syndrome", "修格連氏症", "自體免疫疾病，造成次發性淚液分泌不足的乾眼。"],
    ["thyroid eye disease", "甲狀腺眼疾", "穆勒氏肌過度作用造成眼瞼上縮的疾病。"],
    ["lid retraction", "眼瞼攣縮", "上眼瞼上縮、露出過多鞏膜，常見於甲狀腺眼疾。"],
    ["tarsus", "瞼板", "眼瞼的緻密結締組織硬板（即 tarsal plate）。"]
  ];

  const fallbackTranslations = {
    a: "a 波", b: "b 波", c: "c 波", r: "活化視紫質", t: "活化轉導蛋白",
    bipolar: "雙極細胞", ganglion: "神經節細胞", lutea: "黃斑", layer: "層",
    "inner/outer": "內層／外層", bodies: "細胞本體", horizontal: "水平細胞",
    amacrine: "無軸突細胞", nuclei: "細胞核", "bipolar/horizontal": "雙極／水平細胞",
    "ganglion/amacrine": "神經節／無軸突細胞", m: "大細胞路徑", ller: "穆勒細胞",
    glia: "膠細胞", extracellular: "細胞外", potassium: "鉀離子", junction: "連結",
    endfeet: "終足", basement: "基底", membrane: "膜", inner: "內層", outer: "外層",
    segments: "節段", junctional: "連接的", choroidal: "脈絡膜的", vessels: "血管",
    barrier: "障壁", retinal: "視網膜的", vascular: "血管的", endothelial: "內皮的",
    tight: "緊密的", pericyte: "周細胞", pathway: "路徑", only: "僅",
    peripheral: "周邊", predominance: "為主", no: "無", foveal: "中央凹的",
    macular: "黃斑的", lesion: "病灶", central: "中央", scotoma: "暗點",
    swelling: "腫脹", gated: "門控的", high: "高", low: "低", input: "輸入",
    frequency: "頻率", spike: "尖峰訊號", vision: "視覺", color: "色覺",
    "s/m/l": "短／中／長波錐狀細胞", "bipolar/ganglion": "雙極／神經節細胞",
    spatial: "空間的", summation: "加總", curves: "曲線", outputs: "輸出",
    curve: "曲線", "horizontal/amacrine": "水平／無軸突細胞", "sign-inverting": "訊號反轉的",
    mglur6: "代謝型麩胺酸受體 6", ionotropic: "離子型的", receptor: "受體",
    cell: "細胞", photopigment: "感光色素", "on-center/off-surround": "中心開型／周邊關型",
    "off-center/on-surround": "中心關型／周邊開型", contrast: "對比", edge: "邊界",
    center: "中心", surround: "周邊", enhancement: "增強", "bipolar-ganglion": "雙極－神經節細胞",
    temporal: "時間的", filtering: "濾波", motion: "動態", "on-center": "中心開型",
    wave: "波", "dark/light": "暗處／光照", adaptation: "適應", channels: "通道",
    "na+": "鈉離子", "ca2+": "鈣離子", "k+": "鉀離子", release: "釋放",
    channel: "通道", chloride: "氯離子", photon: "光子", cis: "順式",
    "all-trans": "全反式", phosphodiesterase: "磷酸二酯酶", amplification: "放大",
    graded: "漸變式", pathways: "路徑", decreases: "降低", deflection: "波形偏轉",
    response: "反應", amplitude: "振幅", disease: "疾病", activity: "活動",
    currents: "電流", big: "大幅", upward: "向上", apical: "頂端側", slow: "緩慢",
    component: "成分", "a/b": "a 波／b 波", waves: "波形", extraocular: "眼外的",
    muscle: "肌肉", "full-field": "全視野", "focal/multifocal": "局部／多焦",
    function: "功能", testing: "檢查", dominant: "為主", combined: "綜合",
    responses: "反應", dysfunction: "功能異常", dystrophy: "退化性病變",
    background: "背景光", locations: "位置", "ganglion/macular": "神經節細胞／黃斑",
    mferg: "多焦視網膜電位圖", "d-wave": "d 波", internal: "內部的",
    carotid: "頸動脈", "short/long": "短／長", posterior: "後方的",
    ciliary: "睫狀的", lacrimal: "淚腺的", muscular: "肌肉的", supraorbital: "眶上",
    external: "外部的", branches: "分支", artery: "動脈", basilar: "基底動脈",
    superficial: "淺層", deep: "深層", capillary: "微血管", plexuses: "血管叢",
    "end-arterial": "終末動脈型", circulation: "循環", ocular: "眼部的",
    emergency: "急症", corneal: "角膜的", epithelium: "上皮", "iris/ciliary": "虹膜／睫狀體",
    body: "睫狀體", "zinn-haller": "津－哈勒", circle: "動脈環", short: "短",
    long: "長", "body/iris": "睫狀體／虹膜", major: "主要的", arterial: "動脈的",
    anterior: "前方的", contributions: "共同供血", superior: "上方的",
    ophthalmic: "眼部的", vein: "靜脈", "two-thirds": "內側三分之二",
    of: "的", bruch: "布魯赫膜", aqueous: "水液", humor: "房水", surface: "表面",
    endothelium: "內皮", fenestrated: "有窗孔的", nonfenestrated: "無窗孔的",
    wall: "血管壁", "membrane/rpe": "布魯赫膜／色素上皮", capsule: "包膜",
    root: "根部", iris: "虹膜", "root/ciliary": "虹膜根部／睫狀體", facial: "顏面的",
    vortex: "渦狀", arcades: "血管弓", branch: "分支", lateral: "外側",
    eyelid: "眼瞼", muscles: "肌肉", "marginal/peripheral": "邊緣／周邊",
    "artery/vein": "動脈／靜脈", occlusion: "阻塞", lamina: "篩板",
    cribrosa: "篩板", hemorrhage: "出血", venous: "靜脈的", congestion: "鬱血",
    "cherry-red": "櫻桃紅", spot: "斑點", vorticose: "渦狀", uvea: "葡萄膜",
    "superior/inferior": "上方／下方", system: "系統", pterygoid: "翼靜脈叢",
    aortic: "主動脈的", arch: "弓", portal: "門靜脈的", pulmonary: "肺部的",
    nucleus: "神經核", jugular: "頸靜脈", duct: "管道", radiation: "視放射",
    cortex: "皮質", nasal: "鼻側", "nasal/temporal": "鼻側／顳側", right: "右側",
    halves: "半側", both: "雙眼", retinae: "視網膜", field: "視野",
    image: "影像", fibers: "纖維", hemiretinal: "半側視網膜的", remain: "保持同側",
    crosses: "交叉", stays: "保持同側", left: "左側", "chiasm/tract": "視交叉／視束",
    pretectal: "頂蓋前區的", eye: "眼", monocular: "單眼的", visual: "視覺的",
    loss: "喪失", afferent: "傳入路", map: "拓樸圖", geniculate: "膝狀體",
    layers: "層", p: "小細胞路徑", "motion/temporal": "動態／時間訊息",
    "detail/color": "細節／色覺", orienting: "定向", red: "紅色", cerebellum: "小腦",
    calcarine: "距狀溝的", inferior: "下方的", division: "分支", lower: "下方",
    bank: "溝唇", fissure: "溝", quadrantanopia: "象限盲", pie: "對側上象限缺損",
    in: "在", the: "該", sky: "上方視野", meyer: "梅耶氏環", parietal: "頂葉的",
    upper: "上方", floor: "下方視野", occipital: "枕葉的", lobe: "腦葉",
    "bank/cuneus": "上唇／楔葉", "bank/lingual": "下唇／舌回", gyrus: "腦回",
    representation: "代表區", cortical: "皮質的", magnification: "放大代表",
    around: "周圍", frontal: "額葉的", pole: "極部", heteronymous: "異向性",
    homonymous: "同向性", pituitary: "腦下垂體", mass: "腫塊", crossing: "交叉的",
    bitemporal: "雙顳側", hemianopia: "偏盲", region: "區域", "post-chiasmal": "視交叉後",
    unilateral: "單側", congruous: "一致性高的", "temporal/parietal": "顳葉／頂葉",
    cerebral: "大腦的", middle: "中間的", lesions: "病灶", opacity: "混濁",
    defect: "缺損", "air-tear": "空氣－淚膜", interface: "介面", evaporative: "蒸發型",
    electrolytes: "電解質", proteins: "蛋白質", lactoferrin: "乳鐵蛋白",
    immunoglobulins: "免疫球蛋白", avascular: "無血管的", "main/accessory": "主淚腺／副淚腺",
    "aqueous-deficient": "缺水型", "membrane-associated": "膜結合型", hydrophobic: "疏水的",
    epithelial: "上皮的", wettable: "可被潤濕的", debris: "碎屑", glycocalyx: "醣萼",
    wetting: "潤濕", lipid: "脂質", glands: "腺體", "basal/reflex": "基礎性／反射性",
    secretion: "分泌", reflex: "反射", arc: "反射弧", "krause/wolfring": "克勞斯／沃爾弗林副淚腺",
    accessory: "副淚腺的", orbital: "眼眶部", palpebral: "眼瞼部", lobes: "葉",
    krause: "克勞斯副淚腺", and: "與", wolfring: "沃爾弗林副淚腺",
    conjunctival: "結膜的", "fornix/tarsal": "穹窿／瞼板區", basal: "基礎性",
    pigment: "色素", gel: "凝膠", cn: "腦神經", vii: "第七對腦神經",
    trigeminal: "三叉神經", parasympathetic: "副交感的", "corneal/conjunctival": "角膜／結膜",
    sensation: "感覺", division: "分支", nerve: "神經", efferent: "傳出路",
    greater: "大岩神經的", petrosal: "岩神經", tearing: "流淚", ii: "第二對腦神經",
    motor: "運動功能", xii: "第十二對腦神經", antimicrobial: "抗菌的", tear: "淚液",
    fluid: "液體", lipocalin: "脂質運載蛋白", secretory: "分泌型", iga: "免疫球蛋白 A",
    ph: "酸鹼值", osmolarity: "滲透壓", health: "健康狀態", composition: "組成",
    hemoglobin: "血紅素", collagen: "膠原蛋白", redistributed: "重新鋪展",
    over: "覆蓋於", "cornea/conjunctiva": "角膜／結膜", meibomian: "瞼板腺的",
    spreading: "鋪展", medial: "內側", meniscus: "淚液弧", puncta: "淚點",
    dry: "乾燥的", tension: "表面張力", breakup: "破裂", deficiency: "缺乏",
    instability: "不穩定", fluctuating: "波動的", canaliculi: "淚小管",
    "upper/lower": "上／下", common: "共同的", orbicularis: "眼輪匝肌的",
    action: "作用", pump: "幫浦", sinus: "鼻竇", vi: "第六對腦神經",
    sphenoid: "蝶竇", ear: "耳", line: "界線", s: "短波錐狀細胞",
    l: "長波錐狀細胞", "bipolar/m": "雙極／穆勒細胞", diffuse: "廣泛的",
    "foveal/macular": "中央凹／黃斑", veins: "靜脈", plexus: "血管叢",
    pupillary: "瞳孔的", conjunctiva: "結膜", meatus: "鼻道",
    // ── 單元 16 中樞神經系統與視覺反射 ──
    iii: "第三對", iv: "第四對", v: "第五對", vs: "vs", brachium: "臂",
    "edinger-westphal": "Edinger-Westphal",
    midbrain: "中腦", pons: "橋腦", medulla: "延腦", consensual: "一致性",
    commissure: "聯合", preganglionic: "節前", nerves: "神經", sphincter: "括約肌",
    pupillae: "瞳孔", pupil: "瞳孔", oculomotor: "動眼", abducens: "外旋",
    each: "每條", sends: "送出", into: "進入", direct: "直接", blown: "放大固定",
    near: "近", rectus: "直肌", accommodation: "調節", constriction: "收縮",
    miosis: "縮瞳", corpora: "四疊體", quadrigemina: "四疊體", colliculus: "丘",
    longitudinal: "縱", fasciculus: "束", nasociliary: "鼻睫", oculi: "眼",
    levator: "提肌", palpebrae: "眼瞼", caloric: "溫熱", test: "試驗",
    semicircular: "半規", canal: "管", cold: "冰", warm: "溫", opposite: "對側",
    same: "同側", "vestibulo-ocular": "前庭眼動", "corneal/blink": "角膜眨眼",
    "cold-opposite": "冰水快相對側", "warm-same": "溫水快相同側",
    // ── 單元 17 眼瞼、淚腺與結膜 ──
    mm: "毫米", v1: "V1", v2: "V2", v3: "V3", sympathetic: "交感神經",
    equator: "赤道部", eyelashes: "睫毛", eyelash: "睫毛", eyebrows: "眉毛",
    horner: "霍納氏症候群", trachoma: "砂眼", dacryocystitis: "淚囊炎",
    fornix: "穹窿", fornices: "穹窿", mucus: "黏液", whitnall: "Whitnall",
    corrugator: "皺眉肌", skin: "皮膚", arcade: "動脈弓", canthus: "眼眥",
    adenoid: "腺樣", fibrous: "纖維"
  };

  const clickableFallbackTerms = new Set([
    "glia", "endfeet", "basement", "pericyte", "scotoma", "swelling",
    "mglur6", "ionotropic", "receptor", "photopigment", "contrast",
    "chloride", "photon", "cis", "all-trans", "phosphodiesterase",
    "amplification", "amplitude", "dystrophy", "mferg", "d-wave",
    "supraorbital", "basilar", "capillary", "plexuses", "end-arterial",
    "epithelium", "endothelium", "fenestrated", "nonfenestrated",
    "lamina", "cribrosa", "hemorrhage", "congestion", "vorticose",
    "uvea", "pterygoid", "plexus", "radiation", "geniculate",
    "quadrantanopia", "heteronymous", "homonymous", "bitemporal",
    "hemianopia", "lactoferrin", "immunoglobulins", "glycocalyx",
    "lipocalin", "osmolarity", "canaliculi", "conjunctiva", "meatus"
  ]);


  function renderInlineTerms(value) {
    const text = normalizeMixedLanguageText(value);
    const terms = inlineTermEntries();
    let html = "";
    let index = 0;
    while (index < text.length) {
      let hit = null;
      for (const term of terms) {
        const match = termMatchAt(text, index, term);
        if (match) {
          hit = match;
          break;
        }
      }
      if (hit) {
        const label = hit.kind === "english"
          ? hit.term.zh
          : text.slice(index, index + hit.length);
        const termKey = String(hit.term.canonical || hit.term.en).toLowerCase();
        if (inlineTermsSeen.has(termKey)) {
          html += escapeHtml(label);
        } else {
          inlineTermsSeen.add(termKey);
          html += renderInlineTerm(hit.term, label);
        }
        index += hit.length;
      } else {
        const fallback = unknownEnglishAt(text, index);
        if (fallback) {
          const info = fallbackTermInfo(fallback);
          if (info.plain) {
            html += escapeHtml(info.zh);
            index += fallback.length;
            continue;
          }
          const termKey = String(info.en).toLowerCase();
          if (inlineTermsSeen.has(termKey)) {
            html += escapeHtml(info.zh);
          } else {
            inlineTermsSeen.add(termKey);
            html += renderInlineTerm(info, info.zh);
          }
          index += fallback.length;
          continue;
        }
        html += escapeHtml(text[index]);
        index += 1;
      }
    }
    return html;
  }

  function normalizeMixedLanguageText(value) {
    return String(value ?? "")
      .replace(/([\u3400-\u9fff])\s+(?=[A-Za-z0-9])/g, "$1")
      .replace(/([A-Za-z0-9+'’/-])\s+(?=[\u3400-\u9fff])/g, "$1");
  }

  function renderInlineTerm(term, label) {
    return `
      <span class="inline-term-wrap">
        <span class="inline-term" role="button" tabindex="0" data-inline-term${term.fallback ? ` data-inline-fallback="${escapeHtml(term.en)}"` : ""} aria-expanded="false">${escapeHtml(label)}</span>
        <span class="inline-term-card" hidden>
          <strong>${escapeHtml(term.canonical || term.en)}</strong>
          <span>${escapeHtml(term.zh)}</span>
          <em>${escapeHtml(term.note)}</em>
        </span>
      </span>
    `;
  }

  function inlineTermEntries() {
    const merged = [...(data.terms || []), ...eyeInlineTerms];
    const seen = new Set();
    return merged
      .flatMap(([en, zh, note]) => englishAliases(String(en)).map((alias, aliasIndex) => ({
        en: alias,
        lower: alias.toLowerCase(),
        canonical: String(en),
        alias: aliasIndex > 0,
        zh: String(zh),
        note: String(note)
      })))
      .filter((term) => term.en.trim().length > 1)
      .filter((term) => {
        if (seen.has(term.lower)) return false;
        seen.add(term.lower);
        return true;
      })
      .sort((a, b) => Math.max(b.en.length, b.zh.length) - Math.max(a.en.length, a.zh.length));
  }

  function englishAliases(value) {
    const aliases = new Set([value]);
    if (/y$/i.test(value)) aliases.add(value.replace(/y$/i, "ies"));
    else if (/[A-Za-z]$/.test(value) && !/s$/i.test(value)) aliases.add(`${value}s`);
    if (value === "Müller cell") aliases.add("Muller cell");
    if (value === "Meyer loop") aliases.add("Meyer's loop");
    return Array.from(aliases);
  }

  function unknownEnglishAt(text, index) {
    if (!/[A-Za-z]/.test(text[index] || "")) return null;
    const match = text.slice(index).match(/^[A-Za-z][A-Za-z0-9'’+-]*(?:\/[A-Za-z0-9'’+-]+)*/);
    return match ? match[0] : null;
  }

  function fallbackTermInfo(label) {
    const clean = String(label).replace(/[’]/g, "'").trim();
    const lower = clean.toLowerCase();
    const fallbackMap = {
      on: ["開型路徑", "受光增加時反應增強的視網膜路徑。"],
      off: ["關型路徑", "受光減少時反應增強的視網膜路徑。"],
      light: ["光刺激", "照到視網膜、啟動光轉換的刺激。"],
      dark: ["暗處", "缺乏光刺激的狀態。"],
      hz: ["赫茲", "每秒重複次數的頻率單位。"],
      axon: ["軸突", "神經元把訊號送出的長突起。"],
      axons: ["軸突", "神經元把訊號送出的長突起。"],
      tract: ["神經束", "中樞神經內成束行進的軸突。"],
      chiasm: ["交叉處", "神經纖維跨越或交換側別的位置。"]
    };
    if (fallbackMap[lower]) {
      return { en: clean, lower, zh: fallbackMap[lower][0], note: fallbackMap[lower][1] };
    }
    if (fallbackTranslations[lower]) {
      return {
        en: clean,
        lower,
        zh: fallbackTranslations[lower],
        note: `在本教材中表示「${fallbackTranslations[lower]}」；點開英文是為了方便對照原始講義。`,
        plain: !clickableFallbackTerms.has(lower)
      };
    }
    return {
      en: clean,
      lower,
      zh: "待補中文術語",
      note: "這個英文仍需補入眼解剖詞庫；目前先保留英文原名，並依所在句子理解用途。",
      fallback: true
    };
  }

  function termMatchAt(text, index, term) {
    if (text.slice(index, index + term.en.length).toLowerCase() === term.lower) {
      const before = text[index - 1] || "";
      const after = text[index + term.en.length] || "";
      if (isTermBoundary(before) && isTermBoundary(after)) {
        return { term, kind: "english", length: term.en.length };
      }
    }
    if (!term.alias && term.zh && text.slice(index, index + term.zh.length) === term.zh) {
      return { term, kind: "chinese", length: term.zh.length };
    }
    return null;
  }

  function isTermBoundary(char) {
    return !char || !/[A-Za-z0-9]/.test(char);
  }

  function pointText(point) {
    return [
      point.title,
      point.simple,
      point.text,
      point.formula,
      point.memory,
      ...(point.examFocus || []),
      ...(point.bullets || []),
      point.drill?.question,
      ...(point.drill?.choices || []),
      point.drill?.explain
    ].filter(Boolean).join(" ");
  }

  function firstSentence(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return "先抓它的用途，再看它如何影響臨床判斷";
    const match = clean.match(/^(.{1,88}?[。.!?]|.{1,88})/u);
    return (match ? match[0] : clean).replace(/[。.!?]$/, "");
  }

  function termAppears(text, term) {
    const escaped = escapeRegExp(term).replace(/\s+/g, "\\s+");
    const pattern = new RegExp(`(^|[^A-Za-z0-9])${escaped}($|[^A-Za-z0-9])`, "i");
    return pattern.test(text);
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function renderVisualPlaceholder(point, visualId) {
    const safeId = String(visualId).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
    return `
      <figure class="visual-placeholder" data-visual-id="${escapeHtml(safeId)}" data-visual-title="${escapeHtml(point.title)}" data-visual-plan="${escapeHtml(point.visualPlan || "")}">
        <div class="placeholder-stage" aria-hidden="true">
          <span>圖像／動畫製作中</span>
        </div>
        <figcaption>
          <b>視覺化製作中</b>
          <span>將依本知識點的解剖位置、方向與臨床意義客製。</span>
        </figcaption>
      </figure>
    `;
  }

  function renderDrill(key, drill, options = {}) {
    if (!drill) return "";
    const drillHtml = `
      <div class="drill" data-drill="${escapeHtml(key)}" data-answer="${drill.answer}">
        <b>練習題</b>
        <p>${renderInlineTerms(drill.question)}</p>
        <div class="choice-grid">
          ${drill.choices.map((choice, i) => `<button type="button" data-choice="${i}">${renderInlineTerms(choice)}</button>`).join("")}
        </div>
        <div class="feedback" data-feedback></div>
        <template data-explain>${escapeHtml(drill.explain)}</template>
      </div>
    `;
    if (!options.collapsed) return drillHtml;
    return `
      <details class="drill-shell">
        <summary>
          <span>練一題</span>
          <small>點開檢查這個觀念</small>
        </summary>
        ${drillHtml}
      </details>
    `;
  }

  function renderUnitQuiz(unit) {
    return `
      <section class="card quiz-card">
        <div class="unit-code">總複習</div>
        <h2>${escapeHtml(unit.shortTitle)} 總複習</h2>
        <div class="quiz-list">
          ${unit.quiz.map((item, i) => renderDrill(`${unit.id}:quiz:${i}`, item)).join("")}
        </div>
      </section>
    `;
  }

  function renderSources(unit) {
    return `
      <section class="card source-card">
        <div class="unit-code">資料來源</div>
        <h2>本頁依據資料</h2>
        <ul>${unit.sources.map((source) => `<li>${escapeHtml(source)}</li>`).join("")}</ul>
      </section>
    `;
  }

  function bindDrills(root, unitId) {
    root.querySelectorAll("[data-drill]").forEach((drill) => {
      const answer = Number(drill.dataset.answer);
      const feedback = drill.querySelector("[data-feedback]");
      drill.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => {
          const picked = Number(button.dataset.choice);
          drill.querySelectorAll("[data-choice]").forEach((btn) => btn.disabled = true);
          button.classList.add(picked === answer ? "correct" : "wrong");
          drill.querySelector(`[data-choice="${answer}"]`)?.classList.add("correct");
          feedback.innerHTML = `<strong>${picked === answer ? "答對了" : "再看一次這個觀念"}</strong><span>${renderInlineTerms(drill.querySelector("[data-explain]").textContent)}</span>`;
          bindInlineTerms(feedback);
          if (picked === answer) markCorrect(unitId, drill.dataset.drill);
        });
      });
    });
    bindInlineTerms(root);
  }

  function bindInlineTerms(root = document) {
    root.querySelectorAll("[data-inline-term]").forEach((button) => {
      if (button.dataset.bound === "true") return;
      button.dataset.bound = "true";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        if (!button.closest("[data-case], [data-choice]")) event.stopPropagation();
        toggleInlineTerm(button);
      });
      button.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!button.closest("[data-case], [data-choice]")) event.stopPropagation();
        toggleInlineTerm(button);
      });
    });
  }

  function toggleInlineTerm(button) {
        const wrap = button.closest(".inline-term-wrap");
        const card = wrap?.querySelector(".inline-term-card");
        if (!wrap || !card) return;
        const isOpen = wrap.classList.toggle("open");
        card.hidden = !isOpen;
        button.setAttribute("aria-expanded", String(isOpen));
  }

  function bindLab(root, unitId) {
    const lab = root.querySelector("[data-lab]");
    if (!lab) return;
    const output = lab.querySelector("[data-output]");
    if (lab.dataset.lab === "prentice") {
      const update = () => {
        const f = Number(lab.querySelector("[data-f]").value || 0);
        const dmm = Number(lab.querySelector("[data-d]").value || 0);
        const p = Math.abs(f) * Math.abs(dmm / 10);
        const lens = lab.querySelector("[data-lens]").value;
        output.innerHTML = `<strong>${p.toFixed(2)}Δ</strong><span>${renderInlineTerms(`d = ${(dmm / 10).toFixed(2)} cm。方向需依 OD/OS、正負鏡與去中心方向判斷；此工具先練量值。`)}</span>`;
        bindInlineTerms(output);
        output.dataset.kind = lens;
      };
      lab.querySelectorAll("input,select").forEach((input) => input.addEventListener("input", update));
      update();
    }
    if (lab.dataset.lab === "working-distance") {
      const update = () => {
        const result = Number(lab.querySelector("[data-result]").value || 0);
        const working = Number(lab.querySelector("[data-working]").value || 0);
        const already = lab.querySelector("[data-already]").checked;
        const rx = already ? result : result - working;
        output.innerHTML = `<strong>${renderInlineTerms(`Rx sphere = ${rx >= 0 ? "+" : ""}${rx.toFixed(2)}D`)}</strong><span>${renderInlineTerms(already ? "題目已戴 working lens，所以不再扣。" : "未補償 working distance，所以 result - working lens。")}</span>`;
        bindInlineTerms(output);
      };
      lab.querySelectorAll("input").forEach((input) => input.addEventListener("input", update));
      update();
    }
    if (lab.dataset.lab === "k-convert") {
      const k = lab.querySelector("[data-k]");
      const r = lab.querySelector("[data-r]");
      let active = "k";
      const update = () => {
        if (active === "k") r.value = (337.5 / Number(k.value || 1)).toFixed(2);
        if (active === "r") k.value = (337.5 / Number(r.value || 1)).toFixed(2);
        output.innerHTML = `<strong>${renderInlineTerms(`${Number(k.value).toFixed(2)}D ≈ ${Number(r.value).toFixed(2)} mm`)}</strong><span>半徑越大，角膜越平，K 值越小。</span>`;
        bindInlineTerms(output);
      };
      k.addEventListener("input", () => { active = "k"; update(); });
      r.addEventListener("input", () => { active = "r"; update(); });
      update();
    }
    if (lab.dataset.lab === "pupil-sort") {
      const cases = {
        rapd: ["RAPD", "swinging flashlight test 中，照到病眼時兩眼相對放大。重點是 afferent pathway 弱。"],
        adie: ["Adie's tonic pupil", "病眼大、光反應差、近反應慢而保留；低濃度 pilocarpine 可強烈縮瞳。"],
        horner: ["Horner syndrome", "ptosis、miosis、anhidrosis；暗室散瞳慢，有 dilation lag。"],
        argyll: ["Argyll Robertson pupil", "雙側小瞳孔，對光差但近反應保留，典型 light-near dissociation。"]
      };
      const update = (name) => {
        lab.querySelectorAll("[data-case]").forEach((btn) => btn.classList.toggle("active", btn.dataset.case === name));
        output.innerHTML = `<strong>${renderInlineTerms(cases[name][0])}</strong><span>${renderInlineTerms(cases[name][1])}</span>`;
        bindInlineTerms(output);
      };
      lab.querySelectorAll("[data-case]").forEach((button) => button.addEventListener("click", () => update(button.dataset.case)));
      update("rapd");
    }
  }

  function showRandomQuiz() {
    const pool = [];
    activeUnits().forEach((unit) => {
      unit.sections.forEach((section, s) => section.points.forEach((point, p) => pool.push({ unit, key: `${unit.id}:s${s}:p${p}`, drill: point.drill })));
      unit.quiz.forEach((drill, i) => pool.push({ unit, key: `${unit.id}:quiz:${i}`, drill }));
    });
    const item = pool[Math.floor(Math.random() * pool.length)];
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.innerHTML = `
      <div class="modal-card">
        <button class="icon-close" type="button" aria-label="關閉">×</button>
        <div class="unit-code">${escapeHtml(item.unit.shortTitle)}</div>
        ${renderDrill(item.key, item.drill)}
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector(".icon-close").addEventListener("click", () => modal.remove());
    bindDrills(modal, item.unit.id);
  }

  function setupTermAssistant() {
    const widget = document.createElement("section");
    widget.className = "term-assistant";
    widget.innerHTML = `
      <button class="assistant-toggle" type="button" data-toggle>術語助手</button>
      <div class="assistant-panel">
        <div class="assistant-head">
          <b>術語助手</b>
          <button type="button" data-close>×</button>
        </div>
        <form data-form>
          <input type="search" placeholder="輸入英文，例如 retina / LGN" data-query>
          <button type="submit">查詢</button>
        </form>
        <div class="assistant-result" data-result>輸入英文術語後，會回覆中文與用途。</div>
      </div>
    `;
    document.body.appendChild(widget);
    const toggle = widget.querySelector("[data-toggle]");
    const close = widget.querySelector("[data-close]");
    const form = widget.querySelector("[data-form]");
    const query = widget.querySelector("[data-query]");
    const result = widget.querySelector("[data-result]");
    toggle.addEventListener("click", () => widget.classList.toggle("open"));
    close.addEventListener("click", () => widget.classList.remove("open"));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const q = query.value.trim().toLowerCase();
      const matches = data.terms.filter(([en, zh]) => en.toLowerCase().includes(q) || zh.includes(query.value.trim())).slice(0, 5);
      result.innerHTML = matches.length ? matches.map(([en, zh, note]) => `
        <article><b>${escapeHtml(en)}</b><span>${escapeHtml(zh)}</span><p>${escapeHtml(note)}</p></article>
      `).join("") : "目前本機詞庫沒有直接命中。";
    });
  }

  renderShell();
  renderDashboard();
  renderUnitPage();
  renderProgressDots();
  setupTermAssistant();
})();
