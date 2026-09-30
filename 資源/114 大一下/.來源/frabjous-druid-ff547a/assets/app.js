(function () {
  const data = window.OPTOMETRY_CONTENT;
  const progressKey = "optometry-final-review-progress-v1";

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
        <div class="brand-kicker">Optometry Final</div>
        <h1 class="brand-title">視光學<br/>互動總複習</h1>
      </div>
      <nav class="nav-group" aria-label="Course">
        <div class="nav-label">Course</div>
        <a class="nav-link" href="./index.html" data-nav="home">
          <span>總複習入口</span>
          <span class="progress-dot"></span>
        </a>
      </nav>
      <nav class="nav-group" aria-label="Units">
        <div class="nav-label">Units</div>
        ${data.units.map((unit) => unit.status === "active" ? `
          <a class="nav-link" href="./${escapeHtml(unit.file)}" data-unit-link="${escapeHtml(unit.id)}">
            <span><b>${escapeHtml(unit.code)}</b> ${escapeHtml(unit.shortTitle)}</span>
            <span class="progress-dot" data-progress-dot="${escapeHtml(unit.id)}"></span>
          </a>
        ` : `
          <span class="nav-link locked">
            <span><b>${escapeHtml(unit.code)}</b> ${escapeHtml(unit.shortTitle)}</span>
            <span class="chip">soon</span>
          </span>
        `).join("")}
      </nav>
      <div class="sidebar-note">
        <b>最省力讀法</b>
        <span>先讀白話核心，再看圖；接著照編號理解完整機轉，最後只背考點與短記法。</span>
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
    const units = activeUnits();
    const pointCount = units.reduce((sum, unit) => sum + unit.sections.reduce((s, section) => s + section.points.length, 0), 0);
    const quizCount = units.reduce((sum, unit) => sum + unit.quiz.length, 0);
    const complete = units.filter((unit) => unitProgress(unit) === 100).length;
    const next = units.find((unit) => unitProgress(unit) < 100) || units[0];
    root.innerHTML = `
      <section class="hero">
        <div class="brand-kicker">Interactive Review Entrance</div>
        <h1>${renderInlineTerms(data.course.title)}</h1>
        <p>${renderInlineTerms(data.course.subtitle)}</p>
        <div class="toolbar">
          <a class="btn" href="./${escapeHtml(next.file)}">${unitProgress(next) ? "繼續複習" : "開始第一個單元"}</a>
          <button class="btn secondary" type="button" data-random-quiz>隨機考一題</button>
        </div>
      </section>
      <section class="stat-grid">
        <div class="stat"><span class="unit-code">Active Units</span><strong>${units.length} / ${data.units.length}</strong><span class="muted">目前有資料的單元</span></div>
        <div class="stat"><span class="unit-code">Knowledge</span><strong>${pointCount}</strong><span class="muted">每個知識點附練習題</span></div>
        <div class="stat"><span class="unit-code">Review Quiz</span><strong>${quizCount}</strong><span class="muted">章節總複習題</span></div>
        <div class="stat"><span class="unit-code">Completed</span><strong>${complete}</strong><span class="muted">完成單元</span></div>
      </section>
      <section class="unit-grid">
        ${data.units.map((unit) => renderUnitCard(unit)).join("")}
      </section>
      <section class="card note-card">
        <div class="unit-code">How To Study</div>
        <h2>不要一次吞完整章</h2>
        <p>每章都已排成連續三步。一次只讀一個知識點：先能用白話說明，再用圖確認，最後才做題。完整細節都保留，但不需要第一眼全部背起來。</p>
      </section>
    `;
    root.querySelector("[data-random-quiz]")?.addEventListener("click", showRandomQuiz);
  }

  function renderUnitCard(unit) {
    const locked = unit.status !== "active";
    return `
      <article class="unit-card ${locked ? "locked" : ""}">
        <div class="unit-code">${escapeHtml(unit.code)} / ${locked ? "Soon" : `${unitProgress(unit)}%`}</div>
        <h2>${renderInlineTerms(unit.title)}</h2>
        <p>${renderInlineTerms(unit.summary)}</p>
        ${locked ? `<span class="btn ghost disabled">尚無資料</span>` : `<a class="btn" href="./${escapeHtml(unit.file)}">進入單元</a>`}
      </article>
    `;
  }

  function renderUnitPage() {
    const root = document.querySelector("[data-unit-root]");
    if (!root) return;
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
      <nav class="section-jump" aria-label="章節快速跳轉">
        ${unit.sections.map((section, i) => `<a href="#${escapeHtml(section.id)}">${String(i + 1).padStart(2, "0")} ${renderInlineTerms(section.title)}</a>`).join("")}
      </nav>
      ${unit.sections.map((section, sectionIndex) => renderSection(unit, section, sectionIndex)).join("")}
      ${renderUnitLab(unit)}
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
        <div class="unit-code">先看全局</div>
        <h2>這個單元只走 ${unit.roadmap.length} 步</h2>
        <p>先知道整條路，再進去讀細節。每一步都會接到下一步，不用一次把全部背起來。</p>
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
          <div class="unit-code">讀完再練</div>
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
          <div class="unit-code">讀完再練</div>
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
          <div class="unit-code">讀完再練</div>
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
          <div class="unit-code">讀完再練</div>
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
          <div class="unit-code">第 ${sectionIndex + 1} 章 / 共 ${unit.sections.length} 章</div>
          <h2>${renderInlineTerms(section.title)}</h2>
          <p>${renderInlineTerms(section.summary)}</p>
          ${renderStudyPath(section)}
        </div>
        <div class="point-list">
          ${section.points.map((point, pointIndex) => renderPoint(unit, sectionIndex, point, pointIndex, section.points.length)).join("")}
        </div>
      </article>
    `;
  }

  function renderStudyPath(section) {
    if (!section.studyPath?.length) return "";
    return `
      <div class="study-path" aria-label="本節讀法">
        <b>這一章照這個順序讀</b>
        <ol>
          ${section.studyPath.map((step) => `<li>${renderInlineTerms(step)}</li>`).join("")}
        </ol>
      </div>
    `;
  }

  function renderPoint(unit, sectionIndex, point, pointIndex, pointCount) {
    const key = `${unit.id}:s${sectionIndex}:p${pointIndex}`;
    return `
      <section class="point-card">
        <header class="point-head">
          <span class="point-step">這章第 ${pointIndex + 1} 步 / 共 ${pointCount} 步</span>
          <h3>${renderInlineTerms(point.title)}</h3>
        </header>
        ${renderSimpleSummary(point)}
        <div class="visual-reading-block">
          <div class="reading-label"><span>先看圖</span><small>把剛剛那句話變成眼前的樣子</small></div>
          ${renderVisualPlaceholder(point, key)}
        </div>
        ${renderPointDetail(point)}
        ${point.formula ? `<div class="formula"><b>算題時只用這個</b><span>${renderInlineTerms(point.formula)}</span></div>` : ""}
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
        <b>先只懂這句</b>
        <span>${renderInlineTerms(note.simple)}</span>
      </aside>
    `;
  }

  function renderPointDetail(point) {
    if (!point.text) return "";
    const steps = splitTeachingSentences(point.text);
    return `
      <div class="detail-block">
        <div class="reading-label"><span>一步一步想</span><small>這裡保留完整機轉，但拆開慢慢讀</small></div>
        <ol class="logic-step-list">
          ${steps.map((step) => `<li>${renderInlineTerms(step)}</li>`).join("")}
        </ol>
      </div>
    `;
  }

  function splitTeachingSentences(value) {
    const sentences = String(value || "")
      .split(/(?<=[。！？])/u)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    return sentences.length ? sentences : [String(value || "")];
  }

  function renderExamFocus(point) {
    const items = point.examFocus?.length ? point.examFocus : point.bullets;
    if (!items?.length) return "";
    return `
      <div class="exam-focus">
        <div class="reading-label"><span>考試只抓這些</span><small>看到題目時，先用這幾條判斷</small></div>
        <ul class="exam-points">${items.map((item) => `<li>${renderInlineTerms(item)}</li>`).join("")}</ul>
      </div>
    `;
  }

  function renderMemoryNote(point) {
    const note = conceptNoteFor(point);
    return `
      <aside class="memory-box">
        <b>一秒記住</b>
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
    ["PL", "平光", "Plano，表示 0.00D 或無球面度數。"],
    ["power wheel", "度數轉輪", "焦度計上轉動度數的轉輪，用來把 movable target 移到清楚位置讀出度數。"],
    ["focal length", "焦距", "鏡片或鏡組把平行光聚焦的距離；焦距越短代表屈光力越強。"],
    ["bifocal", "雙光鏡片", "上方遠用、下方近用、中間有明顯分界線的多焦鏡片。"],
    ["trifocal", "三光鏡片", "含遠、中、近三區、區段之間有分界線的多焦鏡片。"],
    ["binocular vision", "雙眼視覺", "兩眼影像在大腦融合成單一立體影像的能力；稜鏡常用來處理其問題。"],
    ["prism thinning", "稜鏡削薄", "在漸進多焦鏡上磨入稜鏡，讓鏡片上下厚度較均勻、整體變薄的工藝。"],
    ["prism effect", "稜鏡效應", "視線沒有通過鏡片光心時產生的影像偏移，等於透過一個稜鏡在看。"],
    ["retinoscope", "檢影鏡", "客觀驗光用的手持儀器，投出線狀光帶並觀察眼底反射判斷度數。"],
    ["sleeve up", "套筒上位", "檢影鏡套筒往上，光束較收斂，接近凹面鏡效應。"],
    ["sleeve down", "套筒下位", "檢影鏡套筒往下，光束較發散，呈平面鏡效應。"],
    ["sleeve", "套筒", "檢影鏡上可上下移動的套筒，改變出射光是發散還是收斂。"],
    ["mires clear and regular", "角膜反射像清楚且規則", "keratometer 紀錄用語，可縮寫成 MCR，代表 mire 影像清楚、規則，K 值較可信。"],
    ["distorted", "扭曲 / 變形", "mire 反射影像不規則或扭曲，提示淚膜或角膜表面有問題。"],
    ["blink", "眨眼", "眨眼會重新鋪平淚膜；眨眼後 mire 很快扭曲常提示淚膜不穩定。"],
    ["regular astigmatism", "規則散光", "兩條主經線互相垂直（相差 90 度）的散光，可用一般球柱鏡矯正。"],
    ["near synkinesis", "近反射聯動", "看近時調節、集合、縮瞳一起出現的連動反應，也就是 near triad。"],
    ["tonic slow response", "強直性緩慢反應", "瞳孔對近物的收縮與回放都異常緩慢，是 Adie 瞳孔的特徵。"],
    ["postganglionic fibers", "節後纖維", "神經節之後的神經纖維；Adie 瞳孔常與副交感節後纖維受損有關。"],
    ["postganglionic", "節後神經元", "交感或副交感路徑上、位於神經節之後的神經元。"],
    ["preganglionic", "節前神經元", "位於神經節之前的神經元，是 Horner 定位的第二階。"],
    ["false enophthalmos", "假性眼球內陷", "Horner 因眼瞼下垂、瞼裂變窄而看似眼球內陷，其實眼球並未後退。"],
    ["inferior steepening", "下方變陡", "角膜地形圖下方局部變陡，是圓錐角膜常見的早期型態。"],
    ["carotid", "頸動脈", "交感第三階纖維沿頸動脈叢上行進入眼眶。"],
    ["CL correction", "隱形眼鏡矯正", "用隱形眼鏡矯正屈光；估角膜散光時不需 1.25 修正因子。"],
    ["A total", "總散光", "Javal's rule 估出的眼鏡平面總散光。"],
    ["A corneal", "角膜散光", "由 K 值差求得的角膜散光量。"],
    ["A internal", "眼內散光", "角膜以外（主要來自晶狀體）造成的殘餘散光，常約 -0.50 x090。"],
    ["central", "中樞段", "Horner 三階定位中最上游的中樞神經元（下視丘到脊髓）。"],
    ["result", "檢查結果", "檢影掃出的初步度數，扣掉 working lens 之後才是處方。"],
    ["Keplerian", "克卜勒式望遠鏡", "Keplerian telescope 的簡稱，兩片凸透鏡、影像倒立。"],
    ["Galilean", "伽利略式望遠鏡", "Galilean telescope 的簡稱，凸物鏡加凹目鏡、影像正立。"],
    ["Prentice prism", "普倫提斯誘發稜鏡", "鏡片去中心後依 Prentice's rule 產生的稜鏡。"],
    ["Prentice", "普倫提斯", "Prentice's rule（P = dF）的簡稱。"],
    ["fitting cross", "配適十字", "漸進多焦鏡上用來對準瞳孔的定位十字標記。"],
    ["retinal reflex", "眼底反射光", "檢影時從視網膜反射出、用來判斷順動逆動的光。"],
    ["reflex", "反射光", "檢影時在瞳孔內看到的反射光。"],
    ["plane mirror", "平面鏡", "檢影鏡套筒下位時的等效光學狀態，出射光較發散。"],
    ["concave mirror", "凹面鏡", "檢影鏡套筒上位時的等效光學狀態，出射光較收斂。"],
    ["swinging flashlight", "交替照光", "左右眼快速交替照光，用來找 RAPD。"],
    ["subjective refinement", "主觀微調", "客觀驗光之後，再依病人清晰度反應微調度數。"],
    ["subjective", "主觀驗光", "依病人的清晰度回饋微調處方。"],
    ["recheck", "複查", "雙眼各自驗完後，回到第一眼再確認一次。"],
    ["light-near association", "光近聯合", "近反應大於對光反應的描述，與 light-near dissociation 同一脈絡。"],
    ["Marcus Gunn", "Marcus Gunn 瞳孔", "RAPD 的別名，患眼傳入光訊號相對不足。"],
    ["keratometer index", "角膜曲率儀折射率", "keratometer 換算 K 值用的等效折射率，常取 1.3375。"],
    ["corneal mire doubling", "角膜 mire 複像", "錯誤選項用語；複像對齊其實是 keratometer 的稜鏡 doubling。"],
    ["doubling", "複像", "keratometer 用稜鏡把 mire 影像分裂成兩個以利對齊。"],
    ["mires", "角膜反射像", "keratometer 觀察的角膜前表面反射標記（mire 的複數）。"],
    ["vertical meridian", "垂直子午線", "角膜上下方向的子午線。"],
    ["horizontal meridian", "水平子午線", "角膜左右方向的子午線。"],
    ["meridian", "子午線", "角膜或鏡片上的一條方向線。"],
    ["myopia/hyperopia", "近視 / 遠視", "球面屈光不正的兩個方向。"],
    ["myopia", "近視", "平行光聚焦在視網膜前方。"],
    ["hyperopia", "遠視", "平行光聚焦在視網膜後方。"],
    ["hyperopic", "遠視性", "偏遠視方向；檢影常先找最遠視的主經線。"],
    ["corneal topography", "角膜地形圖", "以熱圖呈現整片角膜表面形狀的檢查。"],
    ["corneal", "角膜", "與角膜有關的；角膜是眼球最前面的透明屈光介面。"],
    ["cornea", "角膜", "眼球最前面的透明屈光介面。"],
    ["refraction", "屈光 / 驗光", "光線在介面的偏折，或驗配度數的過程。"],
    ["radius", "曲率半徑", "角膜或鏡片表面的彎曲半徑，越小越陡。"],
    ["residual", "殘餘", "扣掉角膜散光後，主要由晶狀體造成的殘餘散光。"],
    ["irregularity", "不規則", "角膜表面或反射影像不規則。"],
    ["injury", "外傷", "角膜外傷後，topographer 可追蹤形態復原。"],
    ["image", "影像", "由角膜或鏡片成的像。"],
    ["images", "影像", "多個成像，例如 keratometer 的多個 mire 影像。"],
    ["focus", "對焦", "把影像調到清楚的動作。"],
    ["align", "對齊", "把 mire 或主經線對準的動作。"],
    ["motion", "移動方向", "檢影反射相對光帶的移動方向（順動 / 逆動）。"],
    ["pupil", "瞳孔", "虹膜中央的孔，控制進入眼睛的光量。"],
    ["near", "近距離", "看近的距離或近反應相關情境。"]
  ];


  function renderInlineTerms(value) {
    const text = String(value ?? "");
    const terms = inlineTermEntries();
    let html = "";
    let index = 0;
    while (index < text.length) {
      const match = terms.find((term) => termMatchesAt(text, index, term));
      if (match) {
        const label = text.slice(index, index + match.en.length);
        html += renderInlineTerm(match, label, isCodeTerm(match.en));
        index += match.en.length;
      } else {
        const fallback = unknownEnglishAt(text, index);
        if (fallback) {
          // 只有「看起來像代號/符號」的未知英文才包成可點的英文藍字；
          // 其餘散落的英文字（記憶口訣、選項裡的零碎英文）直接以純文字呈現，不再變成藍字雜訊。
          if (isCodeTerm(fallback)) {
            html += renderInlineTerm(fallbackTermInfo(fallback), fallback, true);
          } else {
            html += escapeHtml(fallback);
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

  function renderInlineTerm(term, label, isCode) {
    // 縮寫代號（OD、RAPD、WTR、PD、BI/BO、CN III、K…）維持顯示英文代號，點開看中文意思。
    // 一般術語則把藍色字改成中文，點開才顯示英文原文，閱讀時直接讀中文。
    const display = isCode ? label : (term.zh || label);
    const cardLines = isCode
      ? `<strong>${escapeHtml(term.en)}</strong><span>${escapeHtml(term.zh)}</span><em>${escapeHtml(term.note)}</em>`
      : `<strong>${escapeHtml(term.en)}</strong><em>${escapeHtml(term.note)}</em>`;
    return `
      <span class="inline-term-wrap ${isCode ? "is-code" : "is-term"}">
        <span class="inline-term" role="button" tabindex="0" data-inline-term aria-expanded="false">${escapeHtml(display)}</span>
        <span class="inline-term-card" hidden>
          ${cardLines}
        </span>
      </span>
    `;
  }

  // 判斷一個英文條目是不是「縮寫代號」：全大寫字母/羅馬數字/斜線組合、單一符號、或單位縮寫。
  // 這些維持英文顯示；其餘有完整中文翻譯的術語則改成中文藍字、點開看英文。
  function isCodeTerm(en) {
    const s = String(en).trim();
    if (!s) return false;
    if (/^[A-Z0-9][A-Z0-9 /().+'’\-]*$/.test(s)) return true;          // RAPD、DBOC、WTR/ATR、BI/BO/BU/BD、CN III、OD/OS、PL…
    if (s.length === 1 && /^[A-Za-zΔ]$/.test(s)) return true;          // 單一符號：d、r、x、m、n、K、F…
    if (s.length === 2 && /^[A-Za-z]+$/.test(s) && /[A-Z]/.test(s)) return true; // 含大寫的雙字代號：Rx、dF…（排除 at、of 等英文字）
    return ["cm", "mm", "ne", "ax"].includes(s.toLowerCase());          // 單位/小寫縮寫
  }

  function inlineTermEntries() {
    const merged = [...(data.terms || []), ...extraInlineTerms];
    const seen = new Set();
    return merged
      .map(([en, zh, note]) => ({ en: String(en), lower: String(en).toLowerCase(), zh: String(zh), note: String(note) }))
      .filter((term) => term.en.trim().length > 1)
      .filter((term) => {
        if (seen.has(term.lower)) return false;
        seen.add(term.lower);
        return true;
      })
      .sort((a, b) => b.en.length - a.en.length);
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
      s: ["球面 S", "sphere 的縮寫，代表球面度數。"],
      c: ["柱鏡 C", "cylinder 的縮寫，代表散光柱鏡度數。"],
      add: ["近用加入度", "addition 的縮寫，表示近用區額外加入的正度數。"],
      ax: ["軸度", "axis 的縮寫，代表散光方向。"],
      h: ["水平", "horizontal 的縮寫，用於水平稜鏡或方向。"],
      v: ["垂直", "vertical 的縮寫，用於垂直稜鏡或方向。"],
      ne: ["正腎上腺素", "norepinephrine 的縮寫，和交感散瞳路徑有關。"]
    };
    if (fallbackMap[lower]) {
      return { en: clean, lower, zh: fallbackMap[lower][0], note: fallbackMap[lower][1] };
    }
    return {
      en: clean,
      lower,
      zh: "英文原文標籤",
      note: "這是教材文字中的英文標記；用來保留原始考點或儀器標籤，讀到時先對照所在句子的生理或視光學用途。"
    };
  }

  function termMatchesAt(text, index, term) {
    if (text.slice(index, index + term.en.length).toLowerCase() !== term.lower) return false;
    const before = text[index - 1] || "";
    const after = text[index + term.en.length] || "";
    return isTermBoundary(before) && isTermBoundary(after);
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
      <figure class="visual-placeholder" data-visual-id="${escapeHtml(safeId)}" data-visual-title="${escapeHtml(point.title)}">
        <div class="placeholder-stage" aria-hidden="true">
          <span>VISUAL / ANIMATION PLACEHOLDER</span>
        </div>
        <figcaption>
          <b>圖像提示</b>
          <small>Visual ID: ${escapeHtml(safeId)}</small>
          <span>${escapeHtml(point.visualPlan || "此處保留給圖像與動畫。")}</span>
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
          <span>最後練一題</span>
          <small>先用自己的話說一次，再點開作答</small>
        </summary>
        ${drillHtml}
      </details>
    `;
  }

  function renderUnitQuiz(unit) {
    return `
      <section class="card quiz-card">
        <div class="unit-code">總複習</div>
          <h2>${renderInlineTerms(unit.shortTitle)} 總複習</h2>
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
        if (!button.closest("[data-case]")) event.stopPropagation();
        toggleInlineTerm(button);
      });
      button.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!button.closest("[data-case]")) event.stopPropagation();
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
          <input type="search" placeholder="輸入英文，例如 RAPD / mire" data-query>
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
