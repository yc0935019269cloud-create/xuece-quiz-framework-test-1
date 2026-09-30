(function () {
  const data = window.OPTICS_CONTENT;
  const progressKey = "basic-optics-progress-v1";

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(progressKey)) || {};
    } catch (error) {
      return {};
    }
  }

  function writeProgress(progress) {
    localStorage.setItem(progressKey, JSON.stringify(progress));
    renderProgressBadges();
  }

  function chapterPath(chapter) {
    return `chapters/${chapter.number}.html`;
  }

  function currentPathPrefix() {
    return location.pathname.includes("/chapters/") ? "../" : "";
  }

  function navHref(path) {
    return currentPathPrefix() + path;
  }

  function renderShell() {
    const sidebar = document.querySelector("[data-sidebar]");
    if (!sidebar) return;

    sidebar.innerHTML = `
      <div class="brand">
        <div class="brand-kicker">Basic Optics</div>
        <h1 class="brand-title">基礎光學<br/>互動學習</h1>
      </div>
      <div class="nav-group">
        <div class="nav-label">Course</div>
        <a class="nav-link" href="${navHref("index.html")}" data-nav="home">學習儀表板</a>
        <a class="nav-link" href="${navHref("search.html")}" data-nav="search">全站搜尋</a>
        <a class="nav-link" href="${navHref("practice.html")}" data-nav="practice">題庫練習</a>
        <a class="nav-link" href="${navHref("exam.html")}" data-nav="exam">考前模式</a>
      </div>
      <div class="nav-group">
        <div class="nav-label">Chapters</div>
        ${data.chapters.map((chapter) => `
          <a class="nav-link" href="${navHref(chapterPath(chapter))}" data-chapter-link="${chapter.id}">
            <span>${chapter.number}. ${chapter.title}</span>
            <span class="progress-dot" data-progress-dot="${chapter.id}"></span>
          </a>
        `).join("")}
      </div>
    `;

    const nav = document.body.dataset.nav;
    if (nav) {
      const active = sidebar.querySelector(`[data-nav="${nav}"]`);
      if (active) active.classList.add("active");
    }

    const chapterId = document.body.dataset.chapter;
    if (chapterId) {
      const active = sidebar.querySelector(`[data-chapter-link="${chapterId}"]`);
      if (active) active.classList.add("active");
    }
  }

  function renderProgressBadges() {
    const progress = readProgress();
    document.querySelectorAll("[data-progress-dot]").forEach((dot) => {
      dot.classList.toggle("done", progress[dot.dataset.progressDot]?.complete === true);
    });
  }

  function chapterProgress(chapter) {
    const progress = readProgress();
    const entry = progress[chapter.id] || {};
    if (entry.complete) return 100;
    const total = Math.max(1, chapter.sections.length);
    const done = new Set(entry.sections || []);
    return Math.round((done.size / total) * 100);
  }

  function renderDashboard() {
    const root = document.querySelector("[data-dashboard]");
    if (!root) return;

    const progress = readProgress();
    const completeCount = data.chapters.filter((chapter) => progress[chapter.id]?.complete).length;
    const nextChapter = data.chapters.find((chapter) => chapterProgress(chapter) < 100) || data.chapters[0];
    const totalSections = data.chapters.reduce((sum, chapter) => sum + chapter.sections.length, 0);
    const doneSections = data.chapters.reduce((sum, chapter) => {
      const entry = progress[chapter.id] || {};
      if (entry.complete) return sum + chapter.sections.length;
      return sum + new Set(entry.sections || []).size;
    }, 0);
    const totalProgress = Math.round((doneSections / Math.max(1, totalSections)) * 100);
    root.innerHTML = `
      <section class="hero">
        <div class="brand-kicker">Interactive Course</div>
        <h1>${data.course.title}</h1>
        <p>${data.course.subtitle}</p>
        <div class="toolbar">
          <a class="btn" href="${chapterPath(nextChapter)}">${totalProgress ? "繼續學習" : "開始第一章"}</a>
          <a class="btn secondary" href="search.html">搜尋概念與公式</a>
          <a class="btn gold" href="practice.html">進入題庫</a>
        </div>
      </section>

      <section class="grid three">
        <div class="card pad">
          <div class="chapter-number">Progress</div>
          <h2 class="panel-title">${completeCount} / ${data.chapters.length}</h2>
          <p class="muted">已完成章節。進度存在此瀏覽器，不需要登入。</p>
          <div class="meter"><span style="--value:${totalProgress}%"></span></div>
          <p class="muted">總小節進度 ${totalProgress}%</p>
        </div>
        <div class="card pad">
          <div class="chapter-number">Mode</div>
          <h2 class="panel-title">輕鬆學習</h2>
          <p class="muted">白話導入、正式定義、公式拆解、互動實驗室。</p>
        </div>
        <div class="card pad">
          <div class="chapter-number">Source</div>
          <h2 class="panel-title">PDF + Markdown</h2>
          <p class="muted">內容以章節完整性整合，保留原始資料入口。</p>
        </div>
      </section>

      <section style="margin-top:24px">
        <h2 class="panel-title">建議學習路線</h2>
        <p class="muted">章節不鎖定，可以自由跳轉；建議照 PDF 順序建立基礎。</p>
        <div class="grid two">
          ${data.chapters.map((chapter) => `
            <article class="card chapter-card ${chapterProgress(chapter) === 100 ? "complete" : ""}">
              <div class="chapter-number">Chapter ${chapter.number} · ${chapter.level}</div>
              <h2>${chapter.title}</h2>
              <p class="muted">${chapter.tagline}</p>
              <div class="meter" aria-label="progress"><span style="--value:${chapterProgress(chapter)}%"></span></div>
              <div class="toolbar">
                <a class="btn secondary" href="${chapterPath(chapter)}">進入章節</a>
              </div>
            </article>
          `).join("")}
        </div>
      </section>

      <section style="margin-top:24px" class="grid two">
        <article class="card pad">
          <div class="chapter-number">Formula Deck</div>
          <h2 class="panel-title">公式速查</h2>
          <p class="muted">整理目前網站所有重要公式，考前可以直接從這裡複習。</p>
          <a class="btn secondary" href="exam.html#formulas">查看公式卡</a>
        </article>
        <article class="card pad">
          <div class="chapter-number">Next</div>
          <h2 class="panel-title">${nextChapter.number}. ${nextChapter.title}</h2>
          <p class="muted">${nextChapter.tagline}</p>
          <a class="btn" href="${chapterPath(nextChapter)}">前往下一步</a>
        </article>
      </section>
    `;
  }

  function renderChapter() {
    const chapterId = document.body.dataset.chapter;
    const root = document.querySelector("[data-chapter-root]");
    if (!chapterId || !root) return;

    const chapter = data.chapters.find((item) => item.id === chapterId);
    if (!chapter) return;

    root.innerHTML = `
      <section class="hero">
        <div class="brand-kicker">Chapter ${chapter.number} · ${chapter.level}</div>
        <h1>${chapter.title}</h1>
        <p>${chapter.tagline}</p>
        <div class="toolbar">
          <button class="btn" data-complete-chapter="${chapter.id}">標記本章完成</button>
          <a class="btn secondary" href="../practice.html">題庫練習</a>
          <a class="btn secondary" href="../search.html">搜尋</a>
        </div>
      </section>

      <section class="card pad">
        <h2 class="panel-title">本章學習地圖</h2>
        <p class="muted">先建立直覺，再看正式定義和公式。每個小節可單獨標記已讀。</p>
        <div class="grid two">
          ${chapter.sections.map((section) => `
            <div class="card pad section-check">
              <span>${section.title}</span>
              <button class="btn secondary" data-complete-section="${chapter.id}:${section.id}" type="button">標記已讀</button>
            </div>
          `).join("")}
        </div>
      </section>

      ${chapter.sections.map((section) => renderSection(section)).join("")}

      ${chapter.quiz?.length ? renderQuiz(chapter) : renderSkeletonNotice(chapter)}

      <details>
        <summary>原始資料</summary>
        <div class="source-links">
          <a class="btn secondary" href="${currentPathPrefix() + chapter.pdf}" target="_blank" rel="noreferrer">開啟 PDF</a>
          ${chapter.md ? `<a class="btn secondary" href="${currentPathPrefix() + chapter.md}" target="_blank" rel="noreferrer">開啟 Markdown</a>` : ""}
        </div>
      </details>
    `;

    bindProgressButtons();
    bindQuiz();
    renderInteractions(root);
    typesetMath();
  }

  const SECTION_TYPE_META = {
    concept: { label: "觀念" },
    formula: { label: "公式" },
    application: { label: "應用" },
    review: { label: "複習" },
    workflow: { label: "解題流程" },
  };

  function renderSection(section) {
    const formulaDetail = section.formula ? findFormulaDetail(section) : null;
    const type = section.type || "concept";
    const typeLabel = (SECTION_TYPE_META[type] || SECTION_TYPE_META.concept).label;
    return `
      <article class="card section-card" id="${section.id}" data-type="${type}">
        <div class="section-head">
          <span class="type-badge">${typeLabel}</span>
          <h2>${section.title}</h2>
        </div>
        <p class="lead">${section.summary}</p>
        ${section.keyPoints?.length ? `
          <div class="key-block">
            <div class="key-block-title">重點整理</div>
            <ul class="key-list">
              ${section.keyPoints.map((point) => `<li>${point}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
        ${section.formula ? `<div class="formula">${section.formula}</div>` : ""}
        ${formulaDetail ? renderFormulaDetail(formulaDetail) : ""}
        ${section.teacher ? `<div class="teacher-note"><strong>陪讀提醒：</strong>${section.teacher}</div>` : ""}
        ${section.interaction ? `<div class="lab" data-interaction="${section.interaction}"></div>` : ""}
      </article>
    `;
  }

  function findFormulaDetail(section) {
    const bySection = {
      "equivalent-power": "等效屈光力",
      "vertex-power": "後頂點屈光力",
      "principal-planes": "主平面位置",
      "lens-effectivity": "透鏡等效性",
      "mirror-power": "面鏡屈光力",
      "mirror-imaging": "面鏡像聚散度",
      "reflectance-ar": "反射率",
      "spherical-aberration": "形狀因子",
      "oblique-astigmatism": "鏡框彎弧誘發屈光力",
      "chromatic-aberration": "阿貝數",
      "core-formula-chain": "等效屈光力",
    };
    const name = bySection[section.id];
    return data.formulas.find((formula) => formula.name === name) || null;
  }

  function renderFormulaDetail(formula) {
    const symbols = formula.symbols?.length
      ? `
        <div class="fd-symbols">
          <span class="fd-label">代號</span>
          <div class="symbol-list">
            ${formula.symbols.map((item) => `
              <div class="symbol-row">
                <span class="symbol-key">${item.symbol}</span>
                <span>${item.meaning}${item.unit ? `（${item.unit}）` : ""}</span>
              </div>
            `).join("")}
          </div>
        </div>
      `
      : "";
    const analogy = formula.analogy
      ? `<div class="fd-item fd-analogy"><span class="fd-label">生活化理解</span><p>${formula.analogy}</p></div>`
      : "";

    return `
      <div class="formula-detail">
        <div class="fd-head">公式拆解</div>
        ${symbols}
        <div class="fd-grid">
          <div class="fd-item fd-use"><span class="fd-label">怎麼用</span><p>${formula.use}</p></div>
          <div class="fd-item fd-why"><span class="fd-label">為什麼合理</span><p>${formula.intuition}</p></div>
          ${analogy}
          <div class="fd-item fd-pitfall"><span class="fd-label">小心錯誤</span><p>${formula.pitfalls}</p></div>
        </div>
      </div>
    `;
  }

  function renderSkeletonNotice(chapter) {
    return `
      <section class="card pad">
        <h2 class="panel-title">第一版狀態</h2>
        <p class="muted">${chapter.title} 目前先建立章節骨架、學習地圖與原始資料入口。下一版會依照第一章規格補上完整講解、互動實驗室與章末測驗。</p>
      </section>
    `;
  }

  function renderQuiz(chapter) {
    return `
      <section class="card pad">
        <h2 class="panel-title">章末小測驗</h2>
        <p class="muted">答完會直接顯示詳解，目標是確認觀念，不是增加壓力。</p>
        <div class="grid">
          ${chapter.quiz.map((item, index) => `
            <div class="quiz-item" data-quiz="${item.id}" data-answer="${item.answer}">
              <h3>${index + 1}. ${item.question}</h3>
              ${item.choices.map((choice, choiceIndex) => `
                <button class="btn choice" data-choice="${choiceIndex}" type="button">${choice}</button>
              `).join("")}
              <div class="answer">${item.explain}</div>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function bindProgressButtons() {
    document.querySelectorAll("[data-complete-chapter]").forEach((button) => {
      button.addEventListener("click", () => {
        const progress = readProgress();
        const chapterId = button.dataset.completeChapter;
        progress[chapterId] = { ...(progress[chapterId] || {}), complete: true };
        writeProgress(progress);
        button.textContent = "已完成";
      });
    });

    document.querySelectorAll("[data-complete-section]").forEach((button) => {
      button.addEventListener("click", () => {
        const [chapterId, sectionId] = button.dataset.completeSection.split(":");
        const progress = readProgress();
        const entry = progress[chapterId] || {};
        const sections = new Set(entry.sections || []);
        sections.add(sectionId);
        progress[chapterId] = { ...entry, sections: Array.from(sections) };
        writeProgress(progress);
        button.textContent = "已讀";
      });
    });
  }

  function bindQuiz() {
    document.querySelectorAll("[data-quiz]").forEach((item) => {
      item.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => {
          const answer = Number(item.dataset.answer);
          const choice = Number(button.dataset.choice);
          item.querySelectorAll("[data-choice]").forEach((choiceButton) => {
            const value = Number(choiceButton.dataset.choice);
            choiceButton.classList.toggle("correct", value === answer);
            choiceButton.classList.toggle("wrong", value === choice && value !== answer);
          });
          item.querySelector(".answer").classList.add("show");
        });
      });
    });
  }

  function renderInteractions(root) {
    root.querySelectorAll("[data-interaction]").forEach((node) => {
      const type = node.dataset.interaction;
      if (type === "thickLens") renderThickLens(node);
      if (type === "cardinalPoints") renderCardinalPoints(node);
      if (type === "eyeModel") renderEyeModel(node);
      if (type === "vertexDistance") renderVertexDistance(node);
      if (type === "mirror") renderMirror(node);
      if (type === "reflectance") renderReflectance(node);
      if (type === "shapeFactor") renderShapeFactor(node);
      if (type === "tilt") renderTilt(node);
      if (type === "distortion") renderDistortion(node);
      if (type === "chromatic") renderChromatic(node);
    });
  }

  function renderSpectrum(node) {
    node.innerHTML = `
      <h3>可見光滑桿</h3>
      <div class="lab-controls">
        <label>波長 nm <input type="range" min="380" max="700" value="550" data-spectrum-range /></label>
        <div class="card pad"><strong data-spectrum-name>綠光</strong><br/><span class="muted" data-spectrum-info></span></div>
      </div>
      <div class="spectrum-track"><span class="spectrum-marker" data-spectrum-marker></span></div>
    `;
    const range = node.querySelector("[data-spectrum-range]");
    const marker = node.querySelector("[data-spectrum-marker]");
    const name = node.querySelector("[data-spectrum-name]");
    const info = node.querySelector("[data-spectrum-info]");
    const update = () => {
      const nm = Number(range.value);
      const ratio = (nm - 380) / 320;
      marker.style.left = `${ratio * 100}%`;
      const colorName = nm < 450 ? "紫光" : nm < 495 ? "藍光" : nm < 570 ? "綠光" : nm < 590 ? "黃光" : nm < 620 ? "橙光" : "紅光";
      const frequency = 299792458 / (nm * 1e-9) / 1e12;
      name.textContent = `${colorName} · ${nm} nm`;
      info.textContent = `頻率約 ${frequency.toFixed(0)} THz。波長越短，頻率越高。`;
    };
    range.addEventListener("input", update);
    update();
  }

  function renderWavefront(node) {
    node.innerHTML = `
      <h3>波前與光線</h3>
      <p class="muted">拖曳光源，觀察「波前是同一時間抵達的位置」，而光線永遠垂直波前前進。</p>
      <div class="lab-controls">
        <label>光束顯示
          <select data-wave-mode>
            <option value="diverging">發散光束</option>
            <option value="parallel">平行光束</option>
            <option value="converging">會聚光束</option>
          </select>
        </label>
        <div class="card pad"><strong data-wave-caption></strong><br/><span class="muted">圓弧/直線是波前，箭頭是光線。</span></div>
      </div>
      <canvas width="860" height="360" data-wavefront-canvas></canvas>
    `;
    const canvas = node.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const mode = node.querySelector("[data-wave-mode]");
    const caption = node.querySelector("[data-wave-caption]");
    let source = { x: 190, y: 180 };
    let dragging = false;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPaperGrid(ctx, canvas);
      const selected = mode.value;
      if (selected === "parallel") drawParallelWavefront(ctx, canvas);
      if (selected === "converging") drawConvergingWavefront(ctx, canvas);
      if (selected === "diverging") drawDivergingWavefront(ctx, canvas, source);
      drawLegend(ctx, 24, 28, [
        ["#b8860b", "波前"],
        ["#2c5f8a", "光線方向"],
        ["#c0392b", selected === "converging" ? "焦點" : "光源/參考點"],
      ]);
      caption.textContent = selected === "parallel"
        ? "平行光束：波前接近平面，光線彼此平行。"
        : selected === "converging"
          ? "會聚光束：光線往焦點靠攏，波前曲率方向相反。"
          : "發散光束：光線從光源向外散開，波前是一圈圈圓弧。";
    };

    canvas.addEventListener("pointerdown", (event) => {
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!dragging) return;
      const rect = canvas.getBoundingClientRect();
      source = {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height),
      };
      draw();
    });
    canvas.addEventListener("pointerup", () => {
      dragging = false;
    });
    mode.addEventListener("change", draw);
    draw();
  }

  function drawPaperGrid(ctx, canvas) {
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(200,191,170,.35)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function drawDivergingWavefront(ctx, canvas, source) {
    ctx.strokeStyle = "#b8860b";
    ctx.lineWidth = 2;
    for (let r = 42; r < 360; r += 46) {
      ctx.beginPath();
      ctx.arc(source.x, source.y, r, -0.85, 0.85);
      ctx.stroke();
    }
    for (let angle = -0.65; angle <= 0.65; angle += 0.22) {
      drawArrowLine(ctx, source.x, source.y, source.x + Math.cos(angle) * 610, source.y + Math.sin(angle) * 610, "#2c5f8a", 2);
    }
    drawPoint(ctx, source.x, source.y, "#c0392b", "點光源");
  }

  function drawParallelWavefront(ctx, canvas) {
    ctx.strokeStyle = "#b8860b";
    ctx.lineWidth = 2;
    for (let x = 160; x < canvas.width - 80; x += 76) {
      ctx.beginPath();
      ctx.moveTo(x, 70);
      ctx.lineTo(x, canvas.height - 54);
      ctx.stroke();
    }
    for (let y = 86; y <= canvas.height - 70; y += 42) {
      drawArrowLine(ctx, 90, y, canvas.width - 80, y, "#2c5f8a", 2);
    }
    drawPoint(ctx, 86, canvas.height / 2, "#c0392b", "遠方光源");
  }

  function drawConvergingWavefront(ctx, canvas) {
    const focus = { x: canvas.width - 155, y: canvas.height / 2 };
    ctx.strokeStyle = "#b8860b";
    ctx.lineWidth = 2;
    for (let r = 42; r < 330; r += 46) {
      ctx.beginPath();
      ctx.arc(focus.x, focus.y, r, Math.PI - 0.85, Math.PI + 0.85);
      ctx.stroke();
    }
    for (let y = 78; y <= canvas.height - 64; y += 42) {
      drawArrowLine(ctx, 95, y, focus.x, focus.y, "#2c5f8a", 2);
    }
    drawPoint(ctx, focus.x, focus.y, "#c0392b", "焦點");
  }

  function renderVergence(node) {
    node.innerHTML = `
      <h3>聚散度計算器</h3>
      <div class="lab-controls">
        <label>距離 m <input type="range" min="0.1" max="3" step="0.05" value="0.5" data-v-distance /></label>
        <label>光束類型
          <select data-v-type>
            <option value="-1">發散光束</option>
            <option value="1">會聚光束</option>
          </select>
        </label>
      </div>
      <div class="formula" data-v-result></div>
    `;
    const distance = node.querySelector("[data-v-distance]");
    const type = node.querySelector("[data-v-type]");
    const result = node.querySelector("[data-v-result]");
    const update = () => {
      const d = Number(distance.value);
      const sign = Number(type.value);
      const value = sign / d;
      result.textContent = `距離 ${d.toFixed(2)} m → 聚散度 ${value.toFixed(2)} D`;
    };
    distance.addEventListener("input", update);
    type.addEventListener("change", update);
    update();
  }

  function renderSnell(node) {
    node.innerHTML = `
      <h3>司乃耳定律實驗室</h3>
      <div class="lab-controls">
        <label>第一介質 n1 <input type="number" min="1" max="2.5" step="0.001" value="1.000" data-n1 /></label>
        <label>第二介質 n2 <input type="number" min="1" max="2.5" step="0.001" value="1.498" data-n2 /></label>
        <label>入射角 θ1 <input type="range" min="0" max="80" value="20" data-theta /></label>
        <div class="card pad"><strong data-snell-result></strong><br/><span class="muted" data-snell-note></span></div>
      </div>
      <canvas width="760" height="320" data-snell-canvas></canvas>
    `;
    const n1 = node.querySelector("[data-n1]");
    const n2 = node.querySelector("[data-n2]");
    const theta = node.querySelector("[data-theta]");
    const result = node.querySelector("[data-snell-result]");
    const note = node.querySelector("[data-snell-note]");
    const canvas = node.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const update = () => {
      const a = Number(n1.value);
      const b = Number(n2.value);
      const t1 = Number(theta.value);
      const sin2 = (a / b) * Math.sin((t1 * Math.PI) / 180);
      const tir = Math.abs(sin2) > 1;
      const t2 = tir ? null : Math.asin(sin2) * 180 / Math.PI;
      result.textContent = tir ? `θ1=${t1}°，發生全反射` : `θ1=${t1}° → θ2≈${t2.toFixed(2)}°`;
      note.textContent = b > a ? "進入較高折射率介質：偏向法線。" : b < a ? "進入較低折射率介質：遠離法線，角度太大可能全反射。" : "折射率相同：方向不改變。";
      drawSnell(ctx, canvas, t1, t2, tir);
    };
    [n1, n2, theta].forEach((input) => input.addEventListener("input", update));
    update();
  }

  function drawSnell(ctx, canvas, theta1, theta2, tir) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, canvas.width, cy);
    ctx.fillStyle = "#e8f0f2";
    ctx.fillRect(0, cy, canvas.width, cy);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(canvas.width, cy);
    ctx.stroke();
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(cx, 24);
    ctx.lineTo(cx, canvas.height - 24);
    ctx.stroke();
    ctx.setLineDash([]);

    const rad1 = (theta1 * Math.PI) / 180;
    ctx.strokeStyle = "#2c5f8a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - Math.sin(rad1) * 190, cy - Math.cos(rad1) * 190);
    ctx.lineTo(cx, cy);
    ctx.stroke();

    ctx.strokeStyle = tir ? "#c0392b" : "#1a6645";
    ctx.beginPath();
    if (tir) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.sin(rad1) * 190, cy - Math.cos(rad1) * 190);
    } else {
      const rad2 = (theta2 * Math.PI) / 180;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.sin(rad2) * 190, cy + Math.cos(rad2) * 190);
    }
    ctx.stroke();
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "16px serif";
    ctx.fillText("介面", 24, cy - 12);
    ctx.fillText("虛線 = 法線", cx + 12, 42);
  }

  function renderSpherical(node) {
    node.innerHTML = `
      <h3>球面模型拖曳圖</h3>
      <p class="muted">調整曲率半徑，觀察球面、曲率中心與法線方向。通過曲率中心的光線不偏折。</p>
      <div class="lab-controls">
        <label>曲率半徑 r cm <input type="range" min="8" max="40" value="22" data-radius /></label>
        <div class="card pad"><strong data-spherical-result></strong><br/><span class="muted">半徑越小，球面越彎。</span></div>
      </div>
      <canvas width="760" height="300" data-spherical-canvas></canvas>
    `;
    const radius = node.querySelector("[data-radius]");
    const result = node.querySelector("[data-spherical-result]");
    const canvas = node.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const draw = () => {
      const rCm = Number(radius.value);
      const r = rCm * 7;
      const cx = 380 + r;
      const cy = 150;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fffdf7";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#c8bfaa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI * 0.72, Math.PI * 1.28);
      ctx.stroke();
      ctx.strokeStyle = "#2c5f8a";
      ctx.beginPath();
      ctx.moveTo(70, cy - 70);
      ctx.lineTo(380, cy);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.fillStyle = "#c0392b";
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1a2e";
      ctx.font = "16px serif";
      ctx.fillText("A 表面頂點", 390, cy - 12);
      ctx.fillText("C 曲率中心", cx + 10, cy - 10);
      ctx.fillText("藍線通過 C，因此在球面處沿法線入射", 24, 32);
      result.textContent = `目前 r = ${rCm} cm`;
    };
    radius.addEventListener("input", draw);
    draw();
  }

  function renderSurfacePower(node) {
    node.innerHTML = `
      <h3>球面屈光力計算器</h3>
      <div class="lab-controls">
        <label>第一介質 n <input type="number" min="1" max="2" step="0.001" value="1.000" data-sp-n /></label>
        <label>第二介質 n' <input type="number" min="1" max="2.5" step="0.001" value="1.500" data-sp-np /></label>
        <label>曲率半徑 r m <input type="number" min="-1" max="1" step="0.01" value="0.10" data-sp-r /></label>
        <div class="formula" data-sp-result></div>
      </div>
    `;
    const n = node.querySelector("[data-sp-n]");
    const np = node.querySelector("[data-sp-np]");
    const r = node.querySelector("[data-sp-r]");
    const result = node.querySelector("[data-sp-result]");
    const update = () => {
      const radius = Number(r.value);
      if (!radius) {
        result.textContent = "r 不能為 0";
        return;
      }
      const power = (Number(np.value) - Number(n.value)) / radius;
      result.textContent = `F = (n' - n) / r = ${power.toFixed(2)} D`;
    };
    [n, np, r].forEach((input) => input.addEventListener("input", update));
    update();
  }

  function renderLfl(node) {
    node.innerHTML = `
      <h3>L + F = L' 追蹤器</h3>
      <div class="lab-controls">
        <label>入射聚散度 L <input type="range" min="-20" max="20" step="0.25" value="-5" data-lfl-l /></label>
        <label>屈光力 F <input type="range" min="-20" max="20" step="0.25" value="10" data-lfl-f /></label>
      </div>
      <div class="formula" data-lfl-result></div>
      <div class="step-grid" data-lfl-steps></div>
      <canvas width="860" height="340" data-lfl-canvas></canvas>
    `;
    const l = node.querySelector("[data-lfl-l]");
    const f = node.querySelector("[data-lfl-f]");
    const result = node.querySelector("[data-lfl-result]");
    const steps = node.querySelector("[data-lfl-steps]");
    const canvas = node.querySelector("[data-lfl-canvas]");
    const ctx = canvas.getContext("2d");
    const update = () => {
      const L = Number(l.value);
      const F = Number(f.value);
      const Lp = L + F;
      const state = Lp > 0 ? "會聚，偏向實像" : Lp < 0 ? "發散，偏向虛像" : "平行光";
      result.textContent = `L' = ${L.toFixed(2)} + ${F.toFixed(2)} = ${Lp.toFixed(2)} D（${state}）`;
      steps.innerHTML = `
        <div class="step-card"><strong>1. 入射狀態 L</strong><span>${L.toFixed(2)} D：${L < 0 ? "光束目前是發散" : L > 0 ? "光束目前是會聚" : "光束目前平行"}</span></div>
        <div class="step-card"><strong>2. 表面能力 F</strong><span>${F.toFixed(2)} D：${F < 0 ? "讓光更發散" : F > 0 ? "讓光更會聚" : "不改變聚散"}</span></div>
        <div class="step-card"><strong>3. 出射狀態 L'</strong><span>${Lp.toFixed(2)} D：${state}</span></div>
      `;
      drawLflBeam(ctx, canvas, L, F, Lp);
    };
    [l, f].forEach((input) => input.addEventListener("input", update));
    update();
  }

  function drawLflBeam(ctx, canvas, L, F, Lp) {
    const axis = canvas.height / 2;
    const surfaceX = canvas.width / 2;
    drawPaperGrid(ctx, canvas);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, axis);
    ctx.lineTo(canvas.width - 28, axis);
    ctx.stroke();

    ctx.strokeStyle = F >= 0 ? "#2c5f8a" : "#c0392b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(surfaceX, 58);
    ctx.lineTo(surfaceX, canvas.height - 58);
    ctx.stroke();
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "16px serif";
    ctx.fillText(`F = ${F.toFixed(2)} D`, surfaceX - 40, 42);

    const leftFocus = focusFromVergence(L, surfaceX, -1);
    const rightFocus = focusFromVergence(Lp, surfaceX, 1);
    const inputYs = [axis - 86, axis - 44, axis, axis + 44, axis + 86];
    const surfaceYs = inputYs.map((y) => axis + (y - axis) * 0.52);

    inputYs.forEach((y, index) => {
      const sy = surfaceYs[index];
      const start = pointOnIncomingRay(L, leftFocus, surfaceX, sy, y);
      drawArrowLine(ctx, start.x, start.y, surfaceX, sy, "#7a7060", 2);
      const end = pointOnOutgoingRay(Lp, rightFocus, surfaceX, sy, canvas.width - 72);
      drawArrowLine(ctx, surfaceX, sy, end.x, end.y, "#2c5f8a", 2);
    });

    if (L < 0) drawPoint(ctx, leftFocus.x, leftFocus.y, "#b8860b", "入射虛物點");
    if (L > 0) drawPoint(ctx, leftFocus.x, leftFocus.y, "#1a6645", "入射會聚點");
    if (Lp > 0) drawPoint(ctx, rightFocus.x, rightFocus.y, "#c0392b", "實像焦點");
    if (Lp < 0) {
      drawPoint(ctx, rightFocus.x, rightFocus.y, "#b8860b", "虛像點");
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "#b8860b";
      surfaceYs.forEach((sy) => {
        ctx.beginPath();
        ctx.moveTo(surfaceX, sy);
        ctx.lineTo(rightFocus.x, rightFocus.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    drawLegend(ctx, 24, 28, [
      ["#7a7060", "入射光束 L"],
      ["#2c5f8a", "出射光束 L'"],
      [F >= 0 ? "#2c5f8a" : "#c0392b", "光學表面/透鏡 F"],
    ]);
  }

  function focusFromVergence(value, surfaceX, direction) {
    if (Math.abs(value) < 0.01) return { x: direction > 0 ? 5000 : -5000, y: 170 };
    const distancePx = Math.min(320, Math.max(54, Math.abs(100 / value) * 3.6));
    const side = value > 0 ? direction : -direction;
    return { x: surfaceX + side * distancePx, y: 170 };
  }

  function pointOnIncomingRay(L, focus, surfaceX, sy, fallbackY) {
    if (Math.abs(L) < 0.01) return { x: 62, y: sy };
    const x = 62;
    const t = (x - focus.x) / (surfaceX - focus.x);
    return { x, y: focus.y + (sy - focus.y) * t || fallbackY };
  }

  function pointOnOutgoingRay(Lp, focus, surfaceX, sy, endX) {
    if (Math.abs(Lp) < 0.01) return { x: endX, y: sy };
    const t = (endX - surfaceX) / (focus.x - surfaceX);
    if (Lp > 0 && focus.x > surfaceX) return { x: focus.x, y: focus.y };
    return { x: endX, y: sy + (focus.y - sy) * t };
  }

  function renderThinLens(node) {
    node.innerHTML = `
      <h3>薄透鏡成像實驗室</h3>
      <div class="lab-controls">
        <label>透鏡屈光力 F(D) <input type="range" min="-12" max="12" step="0.25" value="8" data-tl-f /></label>
        <label>物距 cm <input type="range" min="5" max="120" step="1" value="30" data-tl-distance /></label>
        <div class="card pad"><strong data-tl-result></strong><br/><span class="muted" data-tl-note></span></div>
      </div>
      <div class="step-grid" data-tl-steps></div>
      <canvas width="760" height="320" data-tl-canvas></canvas>
    `;
    const fInput = node.querySelector("[data-tl-f]");
    const dInput = node.querySelector("[data-tl-distance]");
    const result = node.querySelector("[data-tl-result]");
    const note = node.querySelector("[data-tl-note]");
    const steps = node.querySelector("[data-tl-steps]");
    const canvas = node.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const update = () => {
      const F = Number(fInput.value);
      const objectCm = Number(dInput.value);
      const L = -100 / objectCm;
      const Lp = L + F;
      const imageCm = Lp === 0 ? Infinity : 100 / Lp;
      const real = imageCm > 0;
      result.textContent = `L=${L.toFixed(2)}D，L'=${Lp.toFixed(2)}D，像距 ${Number.isFinite(imageCm) ? imageCm.toFixed(1) + " cm" : "無限遠"}`;
      const magnification = Number.isFinite(imageCm) ? imageCm / -objectCm : Infinity;
      note.textContent = real ? "像在透鏡對側，倒立實像。" : "像在物體同側，正立虛像。";
      steps.innerHTML = `
        <div class="step-card"><strong>1. 物距換 L</strong><span>物距 ${objectCm.toFixed(0)} cm = ${(objectCm / 100).toFixed(2)} m，所以 L = -1/${(objectCm / 100).toFixed(2)} = ${L.toFixed(2)} D</span></div>
        <div class="step-card"><strong>2. 加上透鏡 F</strong><span>L' = ${L.toFixed(2)} + ${F.toFixed(2)} = ${Lp.toFixed(2)} D</span></div>
        <div class="step-card"><strong>3. 換回像距</strong><span>${Number.isFinite(imageCm) ? `l' = 1/${Lp.toFixed(2)} = ${(imageCm / 100).toFixed(2)} m` : "L'=0，像在無限遠"}</span></div>
        <div class="step-card"><strong>4. 像的性質</strong><span>${real ? "實像、倒立" : "虛像、正立"}；放大率約 ${Number.isFinite(magnification) ? magnification.toFixed(2) : "無限大"}</span></div>
      `;
      drawThinLens(ctx, canvas, F, objectCm, imageCm);
    };
    [fInput, dInput].forEach((input) => input.addEventListener("input", update));
    update();
  }

  function drawThinLens(ctx, canvas, power, objectCm, imageCm) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const axis = canvas.height / 2;
    const scale = 3;
    const focalCm = power === 0 ? Infinity : 100 / Math.abs(power);
    const focalPx = Number.isFinite(focalCm) ? Math.min(260, focalCm * scale) : 260;
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, axis);
    ctx.lineTo(canvas.width - 24, axis);
    ctx.stroke();
    ctx.strokeStyle = power >= 0 ? "#2c5f8a" : "#c0392b";
    ctx.beginPath();
    ctx.moveTo(cx, 42);
    ctx.lineTo(cx, canvas.height - 42);
    ctx.stroke();

    ctx.fillStyle = "#756d62";
    ctx.font = "14px serif";
    if (Number.isFinite(focalCm)) {
      ctx.beginPath();
      ctx.arc(cx - focalPx, axis, 4, 0, Math.PI * 2);
      ctx.arc(cx + focalPx, axis, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText("F", cx - focalPx - 5, axis + 22);
      ctx.fillText("F'", cx + focalPx - 6, axis + 22);
    }

    const objX = Math.max(60, cx - objectCm * scale);
    const rawImgX = Number.isFinite(imageCm) ? cx + imageCm * scale : canvas.width - 40;
    const imgX = Math.max(45, Math.min(canvas.width - 45, rawImgX));
    const objTop = axis - 70;
    const imgTop = imageCm > 0 ? axis + 55 : axis - 55;
    drawArrow(ctx, objX, axis, objX, axis - 70, "#1a6645");
    if (Number.isFinite(imageCm)) {
      drawArrow(ctx, imgX, axis, imgX, imgTop, imageCm > 0 ? "#c0392b" : "#b8860b");
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#2c5f8a";
    ctx.beginPath();
    ctx.moveTo(objX, objTop);
    ctx.lineTo(cx, objTop);
    if (imageCm > 0 && Number.isFinite(imageCm)) {
      ctx.lineTo(imgX, imgTop);
    } else {
      ctx.lineTo(cx + focalPx, axis);
      ctx.stroke();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "#b8860b";
      ctx.beginPath();
      ctx.moveTo(cx, objTop);
      ctx.lineTo(imgX, imgTop);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.stroke();

    ctx.strokeStyle = "#1a6645";
    ctx.beginPath();
    ctx.moveTo(objX, objTop);
    ctx.lineTo(cx, axis);
    if (Number.isFinite(imageCm)) ctx.lineTo(imgX, imgTop);
    ctx.stroke();

    ctx.fillStyle = "#1a1a2e";
    ctx.font = "16px serif";
    ctx.fillText("物", objX - 8, axis + 22);
    if (Number.isFinite(imageCm)) ctx.fillText(imageCm > 0 ? "實像" : "虛像", imgX - 14, axis + 24);
    ctx.fillText("透鏡", cx + 8, 58);
    ctx.fillText("圖為教學示意，計算值以文字為準", 24, 30);
  }

  function drawArrow(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const dir = y2 < y1 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8, y2 - dir * 14);
    ctx.lineTo(x2 + 8, y2 - dir * 14);
    ctx.closePath();
    ctx.fill();
  }

  function drawArrowLine(ctx, x1, y1, x2, y2, color, width = 2) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const size = 9;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(angle - 0.45) * size, y2 - Math.sin(angle - 0.45) * size);
    ctx.lineTo(x2 - Math.cos(angle + 0.45) * size, y2 - Math.sin(angle + 0.45) * size);
    ctx.closePath();
    ctx.fill();
  }

  function drawPoint(ctx, x, y, color, label) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "15px serif";
    ctx.fillText(label, x + 12, y - 10);
  }

  function drawLegend(ctx, x, y, items) {
    ctx.save();
    ctx.fillStyle = "rgba(255,253,247,.9)";
    ctx.strokeStyle = "#c8bfaa";
    ctx.lineWidth = 1;
    const width = 250;
    const height = 28 + items.length * 24;
    ctx.fillRect(x - 10, y - 18, width, height);
    ctx.strokeRect(x - 10, y - 18, width, height);
    ctx.font = "14px serif";
    items.forEach((item, index) => {
      const yy = y + index * 24;
      ctx.strokeStyle = item[0];
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + 24, yy);
      ctx.stroke();
      ctx.fillStyle = "#1a1a2e";
      ctx.fillText(item[1], x + 34, yy + 5);
    });
    ctx.restore();
  }

  function renderMultiSurface(node) {
    node.innerHTML = `
      <h3>多屈光面視覺化實驗室</h3>
      <p class="muted">用「第一面成像 → 間距傳遞 → 第二面成像」理解多屈光面系統。這是教學模型，先練流程與正負判讀。</p>
      <div class="lab-controls">
        <label>物距到第 1 面 cm <input type="range" min="8" max="120" step="1" value="40" data-ms-object /></label>
        <label>第 1 面屈光力 F1(D) <input type="range" min="-15" max="20" step="0.25" value="8" data-ms-f1 /></label>
        <label>兩面間距 cm <input type="range" min="2" max="40" step="1" value="10" data-ms-gap /></label>
        <label>第 2 面屈光力 F2(D) <input type="range" min="-15" max="20" step="0.25" value="4" data-ms-f2 /></label>
        <div class="card pad"><strong data-ms-result></strong><br/><span class="muted" data-ms-note></span></div>
      </div>
      <div class="multi-stage" data-ms-stages></div>
      <canvas width="840" height="340" data-ms-canvas></canvas>
    `;
    const object = node.querySelector("[data-ms-object]");
    const f1 = node.querySelector("[data-ms-f1]");
    const gap = node.querySelector("[data-ms-gap]");
    const f2 = node.querySelector("[data-ms-f2]");
    const result = node.querySelector("[data-ms-result]");
    const note = node.querySelector("[data-ms-note]");
    const stages = node.querySelector("[data-ms-stages]");
    const canvas = node.querySelector("[data-ms-canvas]");
    const ctx = canvas.getContext("2d");
    const update = () => {
      const objectCm = Number(object.value);
      const gapCm = Number(gap.value);
      const F1 = Number(f1.value);
      const F2 = Number(f2.value);
      const L0 = -100 / objectCm;
      const L1p = L0 + F1;
      const image1CmFromSurface1 = L1p === 0 ? Infinity : 100 / L1p;
      const object2Cm = Number.isFinite(image1CmFromSurface1) ? image1CmFromSurface1 - gapCm : Infinity;
      const L2 = Number.isFinite(object2Cm) ? -100 / object2Cm : 0;
      const L2p = L2 + F2;
      const finalImageCmFromSurface2 = L2p === 0 ? Infinity : 100 / L2p;
      const finalState = finalImageCmFromSurface2 > 0 ? "最後形成第二面右側實像" : finalImageCmFromSurface2 < 0 ? "最後形成第二面左側虛像" : "最後像在無限遠";

      result.textContent = `${finalState}`;
      note.textContent = `L0=${L0.toFixed(2)}D，L1'=${L1p.toFixed(2)}D，L2=${Number.isFinite(L2) ? L2.toFixed(2) : "0.00"}D，L2'=${L2p.toFixed(2)}D`;
      stages.innerHTML = `
        <div class="step-card"><strong>1. 第 1 面入射</strong><span>物距 ${objectCm.toFixed(0)} cm → L0 = -100/${objectCm.toFixed(0)} = ${L0.toFixed(2)} D</span></div>
        <div class="step-card"><strong>2. 第 1 面出射</strong><span>L1' = ${L0.toFixed(2)} + ${F1.toFixed(2)} = ${L1p.toFixed(2)} D；中間像距 ${formatCm(image1CmFromSurface1)}</span></div>
        <div class="step-card"><strong>3. 傳遞到第 2 面</strong><span>中間像相對第 2 面位置 = ${formatCm(object2Cm)}，所以 L2 = ${Number.isFinite(L2) ? L2.toFixed(2) : "0.00"} D</span></div>
        <div class="step-card"><strong>4. 第 2 面出射</strong><span>L2' = ${Number.isFinite(L2) ? L2.toFixed(2) : "0.00"} + ${F2.toFixed(2)} = ${L2p.toFixed(2)} D；最後像距 ${formatCm(finalImageCmFromSurface2)}</span></div>
      `;
      drawMultiSurface(ctx, canvas, { objectCm, gapCm, F1, F2, image1CmFromSurface1, object2Cm, finalImageCmFromSurface2 });
    };
    [object, f1, gap, f2].forEach((input) => input.addEventListener("input", update));
    update();
  }

  function formatCm(value) {
    if (!Number.isFinite(value)) return "無限遠";
    return `${value.toFixed(1)} cm`;
  }

  function drawMultiSurface(ctx, canvas, state) {
    const axis = canvas.height / 2;
    const s1 = 310;
    const gapPx = Math.max(80, Math.min(230, state.gapCm * 6));
    const s2 = s1 + gapPx;
    const scale = 4;
    const objectX = Math.max(40, s1 - state.objectCm * scale);
    const image1X = Number.isFinite(state.image1CmFromSurface1)
      ? Math.max(30, Math.min(canvas.width - 30, s1 + state.image1CmFromSurface1 * scale))
      : canvas.width - 40;
    const finalX = Number.isFinite(state.finalImageCmFromSurface2)
      ? Math.max(30, Math.min(canvas.width - 30, s2 + state.finalImageCmFromSurface2 * scale))
      : canvas.width - 40;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(24, axis);
    ctx.lineTo(canvas.width - 24, axis);
    ctx.stroke();

    drawSurface(ctx, s1, axis, state.F1, "S1");
    drawSurface(ctx, s2, axis, state.F2, "S2");
    drawArrow(ctx, objectX, axis, objectX, axis - 70, "#1a6645");
    drawArrow(ctx, image1X, axis, image1X, state.image1CmFromSurface1 > 0 ? axis + 48 : axis - 48, "#b8860b");
    drawArrow(ctx, finalX, axis, finalX, state.finalImageCmFromSurface2 > 0 ? axis + 64 : axis - 64, "#c0392b");

    ctx.strokeStyle = "#2c5f8a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(objectX, axis - 70);
    ctx.lineTo(s1, axis - 42);
    ctx.lineTo(image1X, state.image1CmFromSurface1 > 0 ? axis + 48 : axis - 48);
    ctx.stroke();

    ctx.strokeStyle = "#7a7060";
    ctx.beginPath();
    ctx.moveTo(image1X, state.image1CmFromSurface1 > 0 ? axis + 48 : axis - 48);
    ctx.lineTo(s2, axis - 24);
    ctx.lineTo(finalX, state.finalImageCmFromSurface2 > 0 ? axis + 64 : axis - 64);
    ctx.stroke();

    if (state.image1CmFromSurface1 < 0 || state.finalImageCmFromSurface2 < 0) {
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = "#b8860b";
      ctx.beginPath();
      if (state.image1CmFromSurface1 < 0) {
        ctx.moveTo(s1, axis - 42);
        ctx.lineTo(image1X, axis - 48);
      }
      if (state.finalImageCmFromSurface2 < 0) {
        ctx.moveTo(s2, axis - 24);
        ctx.lineTo(finalX, axis - 64);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = "#1a1a2e";
    ctx.font = "16px serif";
    ctx.fillText("物", objectX - 8, axis + 22);
    ctx.fillText("中間像", image1X - 22, axis + 76);
    ctx.fillText("最後像", finalX - 22, axis + 92);
    ctx.fillText("教學示意：數值以步驟卡為準，虛像用反向延長線理解", 24, 30);
  }

  function drawSurface(ctx, x, axis, power, label) {
    ctx.strokeStyle = power >= 0 ? "#2c5f8a" : "#c0392b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, axis - 108);
    ctx.quadraticCurveTo(x + (power >= 0 ? 20 : -20), axis, x, axis + 108);
    ctx.stroke();
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "15px serif";
    ctx.fillText(`${label} ${power >= 0 ? "+" : ""}${power.toFixed(2)}D`, x - 36, axis - 124);
  }

  function renderPracticeDiagram(diagram) {
    if (!diagram) return "";

    const axis = `<line x1="24" y1="120" x2="396" y2="120" class="diagram-axis" />`;
    const rays = diagram.mode === "diverging" || diagram.mode === "negative" || diagram.mode === "magnifier"
      ? `
        <line x1="122" y1="92" x2="224" y2="70" class="diagram-ray" />
        <line x1="122" y1="148" x2="224" y2="170" class="diagram-ray" />
        <line x1="224" y1="70" x2="318" y2="44" class="diagram-ray ghost" />
        <line x1="224" y1="170" x2="318" y2="196" class="diagram-ray ghost" />
      `
      : `
        <line x1="92" y1="92" x2="220" y2="116" class="diagram-ray" />
        <line x1="92" y1="148" x2="220" y2="124" class="diagram-ray" />
        <line x1="220" y1="116" x2="336" y2="150" class="diagram-ray" />
        <line x1="220" y1="124" x2="336" y2="90" class="diagram-ray" />
      `;

    const diagrams = {
      depth: `
        <svg viewBox="0 0 520 260" role="img" aria-label="水中硬幣視深示意圖">
          <rect x="28" y="78" width="364" height="126" rx="8" class="diagram-water" />
          <line x1="28" y1="78" x2="392" y2="78" class="diagram-surface" />
          <circle cx="210" cy="176" r="12" class="diagram-object" />
          <circle cx="210" cy="136" r="9" class="diagram-image" />
          <line x1="236" y1="78" x2="236" y2="176" class="diagram-measure" />
          <line x1="184" y1="78" x2="184" y2="136" class="diagram-measure ghost" />
          <text x="402" y="126" class="diagram-text">真實深度</text>
          <text x="402" y="144" class="diagram-text">${diagram.object}</text>
          <text x="112" y="120" class="diagram-text">視深 ${diagram.image}</text>
          <text x="42" y="64" class="diagram-text">${diagram.label}</text>
        </svg>
      `,
      tir: `
        <svg viewBox="0 0 520 250" role="img" aria-label="全反射臨界角示意圖">
          <rect x="32" y="118" width="356" height="76" rx="8" class="diagram-glass" />
          <line x1="32" y1="118" x2="388" y2="118" class="diagram-surface" />
          <line x1="210" y1="48" x2="210" y2="194" class="diagram-focus" />
          <line x1="118" y1="190" x2="210" y2="118" class="diagram-ray" />
          <line x1="210" y1="118" x2="348" y2="118" class="diagram-ray ghost" />
          <path d="M210 118 A54 54 0 0 0 176 160" class="diagram-measure" />
          <text x="226" y="78" class="diagram-text">折射角 90°</text>
          <text x="44" y="214" class="diagram-text">${diagram.n1}</text>
          <text x="404" y="104" class="diagram-text">${diagram.n2}</text>
          <text x="126" y="160" class="diagram-text">θc=${diagram.angle}</text>
        </svg>
      `,
      surface: `
        <svg viewBox="0 0 520 260" role="img" aria-label="球面折射成像示意圖">
          ${axis}
          <path d="M220 34 C250 78 250 162 220 206" class="diagram-lens" />
          <line x1="92" y1="74" x2="92" y2="166" class="diagram-object-line" />
          <polygon points="92,60 82,82 102,82" class="diagram-object" />
          ${rays}
          <line x1="${diagram.mode === "diverging" ? 136 : 336}" y1="${diagram.mode === "diverging" ? 96 : 86}" x2="${diagram.mode === "diverging" ? 136 : 336}" y2="${diagram.mode === "diverging" ? 144 : 154}" class="diagram-image-line" />
          <text x="54" y="218" class="diagram-text">物距 ${diagram.object}</text>
          <text x="238" y="46" class="diagram-text">${diagram.power}</text>
          <text x="${diagram.mode === "diverging" ? 54 : 334}" y="218" class="diagram-text">像距 ${diagram.image}</text>
        </svg>
      `,
      newton: `
        <svg viewBox="0 0 420 240" role="img" aria-label="牛頓關係式示意圖">
          ${axis}
          <line x1="210" y1="48" x2="210" y2="192" class="diagram-lens" />
          <line x1="150" y1="88" x2="150" y2="152" class="diagram-focus" />
          <line x1="270" y1="88" x2="270" y2="152" class="diagram-focus" />
          <line x1="102" y1="70" x2="102" y2="170" class="diagram-object-line" />
          <line x1="342" y1="58" x2="342" y2="182" class="diagram-image-line" />
          <path d="M102 202 H150" class="diagram-measure" />
          <path d="M270 202 H342" class="diagram-measure" />
          <text x="118" y="218" class="diagram-text">x=${diagram.x}</text>
          <text x="288" y="218" class="diagram-text">x'=${diagram.xp}</text>
          <text x="184" y="42" class="diagram-text">f=${diagram.f}</text>
        </svg>
      `,
      lens: `
        <svg viewBox="0 0 520 260" role="img" aria-label="薄透鏡成像示意圖">
          ${axis}
          <path d="M210 42 C235 82 235 158 210 198 C185 158 185 82 210 42" class="diagram-lens" />
          <line x1="102" y1="76" x2="102" y2="164" class="diagram-object-line" />
          <polygon points="102,60 90,84 114,84" class="diagram-object" />
          ${rays}
          <line x1="${diagram.mode === "real" ? 334 : 132}" y1="${diagram.mode === "real" ? 76 : 86}" x2="${diagram.mode === "real" ? 334 : 132}" y2="${diagram.mode === "real" ? 164 : 154}" class="diagram-image-line" />
          <text x="54" y="218" class="diagram-text">物距 ${diagram.object}</text>
          <text x="178" y="36" class="diagram-text">${diagram.power}</text>
          <text x="${diagram.mode === "real" ? 334 : 54}" y="218" class="diagram-text">像距 ${diagram.image}</text>
        </svg>
      `,
      thick: `
        <svg viewBox="0 0 560 280" role="img" aria-label="厚透鏡追蹤示意圖">
          ${axis}
          <rect x="184" y="54" width="52" height="132" class="diagram-glass" />
          <path d="M184 48 C214 82 214 158 184 192" class="diagram-lens" />
          <path d="M236 48 C206 82 206 158 236 192" class="diagram-lens" />
          <line x1="72" y1="78" x2="72" y2="162" class="diagram-object-line" />
          <line x1="304" y1="90" x2="304" y2="150" class="diagram-image-line ghost" />
          <line x1="276" y1="98" x2="276" y2="142" class="diagram-image-line" />
          <path d="M184 210 H236" class="diagram-measure" />
          <text x="176" y="232" class="diagram-text">厚度 ${diagram.thickness}</text>
          <text x="332" y="54" class="diagram-text">中間像 ${diagram.firstImage}</text>
          <text x="332" y="76" class="diagram-text">到後表面 ${diagram.transfer}</text>
          <text x="332" y="198" class="diagram-text">最後像 ${diagram.final}</text>
        </svg>
      `,
      twoLens: `
        <svg viewBox="0 0 560 280" role="img" aria-label="兩片薄透鏡追蹤示意圖">
          ${axis}
          <path d="M164 48 C146 88 146 152 164 192 C182 152 182 88 164 48" class="diagram-lens" />
          <path d="M256 46 C278 86 278 154 256 194 C234 154 234 86 256 46" class="diagram-lens" />
          <line x1="74" y1="78" x2="74" y2="162" class="diagram-object-line" />
          <line x1="112" y1="92" x2="112" y2="148" class="diagram-image-line ghost" />
          <line x1="216" y1="96" x2="216" y2="144" class="diagram-image-line" />
          <path d="M164 210 H256" class="diagram-measure" />
          <text x="178" y="232" class="diagram-text">間距 ${diagram.gap}</text>
          <text x="132" y="38" class="diagram-text">${diagram.first}</text>
          <text x="232" y="38" class="diagram-text">${diagram.second}</text>
          <text x="34" y="212" class="diagram-text">中間像 ${diagram.intermediate}</text>
          <text x="332" y="212" class="diagram-text">最後像</text>
          <text x="332" y="232" class="diagram-text">${diagram.final}</text>
        </svg>
      `,
      thickLens: `
        <svg viewBox="0 0 420 240" role="img" aria-label="厚透鏡等效透鏡示意圖">
          ${axis}
          <rect x="192" y="72" width="36" height="96" class="diagram-glass" />
          <path d="M192 70 C214 105 214 135 192 170" class="diagram-lens" />
          <path d="M228 70 C206 105 206 135 228 170" class="diagram-lens" />
          <line x1="200" y1="54" x2="200" y2="186" class="diagram-surface" />
          <line x1="220" y1="54" x2="220" y2="186" class="diagram-surface" />
          <text x="192" y="48" class="diagram-text">H</text>
          <text x="214" y="48" class="diagram-text">H'</text>
          <text x="70" y="112" class="diagram-text">F</text>
          <text x="338" y="112" class="diagram-text">F'</text>
          <text x="30" y="214" class="diagram-text">A₁H ${diagram.a1h || ""}</text>
          <text x="300" y="214" class="diagram-text">A₂H' ${diagram.a2h || ""}</text>
          <text x="176" y="214" class="diagram-text">${diagram.power || ""}</text>
        </svg>
      `,
      eye: `
        <svg viewBox="0 0 420 230" role="img" aria-label="簡化眼成像示意圖">
          <line x1="24" y1="115" x2="396" y2="115" class="diagram-axis" />
          <path d="M120 45 Q150 115 120 185" class="diagram-lens" />
          <path d="M${diagram.mode === "myope" ? 300 : diagram.mode === "hyperope" ? 360 : 330} 55 Q${diagram.mode === "myope" ? 326 : diagram.mode === "hyperope" ? 386 : 356} 115 ${diagram.mode === "myope" ? 300 : diagram.mode === "hyperope" ? 360 : 330} 175" class="diagram-retina" />
          <line x1="40" y1="90" x2="120" y2="90" class="diagram-ray" />
          <line x1="40" y1="140" x2="120" y2="140" class="diagram-ray" />
          <line x1="120" y1="90" x2="330" y2="115" class="diagram-ray" />
          <line x1="120" y1="140" x2="330" y2="115" class="diagram-ray" />
          <circle cx="330" cy="115" r="5" class="diagram-image" />
          <text x="150" y="38" class="diagram-text">${diagram.result || ""}</text>
          <text x="44" y="212" class="diagram-text">眼軸 ${diagram.axial || ""}</text>
          ${diagram.fp ? `<text x="240" y="204" class="diagram-text">遠點 ${diagram.fp}</text>` : ""}
        </svg>
      `,
      mirror: `
        <svg viewBox="0 0 420 240" role="img" aria-label="面鏡成像示意圖">
          ${axis}
          <path d="${diagram.mode === "convex" ? "M320 50 Q295 120 320 190" : "M320 50 Q345 120 320 190"}" class="diagram-mirror" />
          <line x1="110" y1="60" x2="110" y2="120" class="diagram-object-line" />
          <polygon points="110,52 101,72 119,72" class="diagram-object" />
          <line x1="${diagram.mode === "convex" ? 250 : 195}" y1="80" x2="${diagram.mode === "convex" ? 250 : 195}" y2="120" class="diagram-image-line" />
          <text x="60" y="214" class="diagram-text">物 ${diagram.object || ""}</text>
          <text x="240" y="214" class="diagram-text">像 ${diagram.image || ""}</text>
          <text x="296" y="44" class="diagram-text">${diagram.power || ""}</text>
        </svg>
      `,
      distortion: `
        <svg viewBox="0 0 320 240" role="img" aria-label="畸變示意圖">
          ${diagram.mode === "barrel"
            ? `<path d="M70 70 Q160 50 250 70 Q270 120 250 170 Q160 190 70 170 Q50 120 70 70 Z" class="diagram-distortion" />`
            : `<path d="M70 70 Q160 90 250 70 Q230 120 250 170 Q160 150 70 170 Q90 120 70 70 Z" class="diagram-distortion" />`}
          <text x="96" y="222" class="diagram-text">${diagram.result || ""}</text>
        </svg>
      `,
    };

    return `
      <div class="practice-diagram">
        <div class="diagram-head">
          <span class="diagram-badge">示意圖</span>
          ${diagram.result ? `<span>${diagram.result}</span>` : ""}
        </div>
        ${diagrams[diagram.kind] || ""}
      </div>
    `;
  }

  function renderPractice() {
    const root = document.querySelector("[data-practice]");
    if (!root) return;
    root.innerHTML = `
      <section class="hero">
        <div class="brand-kicker">Practice Bank</div>
        <h1>題庫練習</h1>
        <p>第一版先放第一章代表題；後續會依章節補完整題庫與錯題整理。</p>
      </section>
      <section class="card pad">
        <label>依章節篩選
          <select data-practice-filter>
            <option value="all">全部章節</option>
            ${data.chapters.map((chapter) => `<option value="${chapter.id}">${chapter.number}. ${chapter.title}</option>`).join("")}
          </select>
        </label>
      </section>
      <div class="grid" data-practice-list>
        ${data.practice.map((item) => `
          <article class="quiz-item" data-practice-item="${item.chapterId}">
            <div class="chapter-number">${item.chapterId} · ${item.type}</div>
            <h3>${item.question}</h3>
            <button class="btn secondary" data-show-answer type="button">顯示詳解</button>
            <div class="answer">
              ${renderPracticeDiagram(item.diagram)}
              <div>${item.answer}</div>
            </div>
          </article>
        `).join("")}
      </div>
    `;
    root.querySelectorAll("[data-show-answer]").forEach((button) => {
      button.addEventListener("click", () => button.nextElementSibling.classList.toggle("show"));
    });
    const filter = root.querySelector("[data-practice-filter]");
    filter.addEventListener("change", () => {
      root.querySelectorAll("[data-practice-item]").forEach((item) => {
        item.style.display = filter.value === "all" || item.dataset.practiceItem === filter.value ? "" : "none";
      });
    });
    typesetMath();
  }

  function renderSearch() {
    const root = document.querySelector("[data-search]");
    if (!root) return;
    const documents = [];
    data.chapters.forEach((chapter) => {
      documents.push({ title: chapter.title, text: chapter.tagline, href: chapterPath(chapter), label: `Chapter ${chapter.number}` });
      chapter.sections.forEach((section) => {
        documents.push({
          title: section.title,
          text: [section.summary, section.formula, section.teacher, ...(section.keyPoints || [])].join(" "),
          href: `${chapterPath(chapter)}#${section.id}`,
          label: chapter.title,
        });
      });
    });
    data.practice.forEach((item) => documents.push({ title: item.question, text: item.answer, href: "practice.html", label: "題庫" }));
    data.formulas.forEach((item) => {
      const symbols = item.symbols?.map((symbol) => `${symbol.symbol}: ${symbol.meaning} ${symbol.unit || ""}`).join(" ") || "";
      documents.push({
        title: item.name,
        text: `${item.latex} ${item.note} ${symbols} ${item.use} ${item.intuition} ${item.analogy || ""} ${item.pitfalls}`,
        href: "exam.html#formulas",
        label: "公式速查",
      });
    });

    root.innerHTML = `
      <section class="hero">
        <div class="brand-kicker">Search</div>
        <h1>全站搜尋</h1>
        <p>搜尋概念、公式、題目與章節內容。</p>
      </section>
      <div class="search-box">
        <input data-search-input placeholder="輸入：司乃耳、聚散度、折射率、全反射..." autofocus />
      </div>
      <div data-search-results></div>
    `;
    const input = root.querySelector("[data-search-input]");
    const results = root.querySelector("[data-search-results]");
    const update = () => {
      const query = input.value.trim().toLowerCase();
      const matched = query ? documents.filter((doc) => `${doc.title} ${doc.text}`.toLowerCase().includes(query)).slice(0, 30) : documents.slice(0, 10);
      results.innerHTML = matched.map((doc) => `
        <a class="result" href="${doc.href}">
          <div class="chapter-number">${doc.label}</div>
          <strong>${doc.title}</strong>
          <p class="muted">${doc.text.slice(0, 130)}...</p>
        </a>
      `).join("");
    };
    input.addEventListener("input", update);
    update();
  }

  function renderExam() {
    const root = document.querySelector("[data-exam]");
    if (!root) return;
    root.innerHTML = `
      <section class="hero">
        <div class="brand-kicker">Exam Mode</div>
        <h1>考前模式</h1>
        <p>先用公式速查、考前提醒卡與代表題，快速把五章主線串起來。</p>
      </section>
      <section class="grid two">
        <div class="card pad">
          <h2 class="panel-title">考前流程</h2>
          <ol class="key-list">
            <li>先看公式速查，確認每條公式用途。</li>
            <li>用考前提醒卡抓常見錯誤。</li>
            <li>進題庫頁依章節練代表題。</li>
            <li>回章節頁補不熟的小節。</li>
          </ol>
          <a class="btn" href="practice.html">開始題庫練習</a>
        </div>
        <div class="card pad">
          <h2 class="panel-title">高頻提醒</h2>
          ${data.examCards.map((card) => `
            <div class="teacher-note">
              <strong>${card.title}</strong><br/>${card.body}
            </div>
          `).join("")}
        </div>
      </section>
      <section class="card pad" id="formulas" style="margin-top:24px">
        <div class="chapter-number">Formula Deck</div>
        <h2 class="panel-title">公式速查</h2>
        <p class="muted">點章節頁可回到詳細講解；這裡先建立考前快速記憶。</p>
        <div class="grid two">
          ${data.formulas.map((formula) => {
            const chapter = data.chapters.find((item) => item.id === formula.chapterId);
            return `
              <article class="card pad">
                <div class="chapter-number">${chapter?.number || ""}. ${chapter?.title || formula.chapterId}</div>
                <h3>${formula.name}</h3>
                <div class="formula">${formula.latex}</div>
                <p class="muted">${formula.note}</p>
                ${renderFormulaDetail(formula)}
              </article>
            `;
          }).join("")}
        </div>
      </section>
      ${renderFormulaCalculator()}
    `;
    bindFormulaCalculator(root);
    typesetMath();
  }

  function renderFormulaCalculator() {
    return `
      <section class="card pad" id="calculator" style="margin-top:24px">
        <div class="chapter-number">Calculator</div>
        <h2 class="panel-title">考前公式計算器</h2>
        <p class="muted">輸入題目給的數值，先確認單位，再看結果與代入步驟。角度以度為單位，距離以公尺為單位。</p>
        <div class="calculator-grid">
          <div class="calc-panel">
            <label>計算類型
              <select data-calc-type>
                <option value="thickLensPower">厚透鏡 Fe / Fv / Fn</option>
                <option value="vertexDistance">頂點距離（框架→隱形眼鏡）</option>
                <option value="mirror">面鏡成像</option>
                <option value="chromatic">色像差（阿貝數）</option>
              </select>
            </label>
            <div class="calc-inputs" data-calc-inputs></div>
          </div>
          <div class="calc-output">
            <div class="chapter-number">Result</div>
            <div class="formula" data-calc-result></div>
            <div class="calc-steps" data-calc-steps></div>
          </div>
        </div>
      </section>
    `;
  }

  const calculatorConfigs = {
    thickLensPower: {
      fields: [
        { id: "F1", label: "前表面 F1 (D)", type: "number", value: 5.23, step: 0.25 },
        { id: "F2", label: "後表面 F2 (D)", type: "number", value: 10.46, step: 0.25 },
        { id: "t", label: "厚度 t (mm)", type: "number", value: 20, step: 0.5 },
        { id: "n", label: "折射率 n", type: "number", value: 1.523, step: 0.001 },
      ],
      compute(values) {
        const tn = (values.t / 1000) / (values.n || 1.5);
        const Fe = values.F1 + values.F2 - tn * values.F1 * values.F2;
        const Fv = values.F1 / (1 - tn * values.F1) + values.F2;
        const Fn = values.F2 / (1 - tn * values.F2) + values.F1;
        return {
          result: `Fe = ${formatNumber(Fe)} D`,
          steps: [
            `等效屈光力 Fe = F1 + F2 − (t/n)F1F2 = ${formatNumber(Fe)} D`,
            `後頂點 Fv = ${formatNumber(Fv)} D（焦度計 / 處方度數）`,
            `前頂點 Fn = ${formatNumber(Fn)} D（測試鏡片中和法）`,
          ],
        };
      },
    },
    vertexDistance: {
      fields: [
        { id: "Fspec", label: "框架鏡屈光力 (D)", type: "number", value: -9.0, step: 0.25 },
        { id: "d", label: "頂點距離 d (mm)", type: "number", value: 15, step: 0.5 },
      ],
      compute(values) {
        if (!values.Fspec) return { result: "請輸入非零度數", steps: [] };
        const fSpec = 1 / values.Fspec;
        const fCL = fSpec - values.d / 1000;
        const Fcl = 1 / fCL;
        return {
          result: `F(CL) = ${formatNumber(Fcl)} D`,
          steps: [
            `框架焦距 f = 1/${formatNumber(values.Fspec)} = ${formatNumber(fSpec * 100)} cm`,
            `平移頂點距離 f(CL) = ${formatNumber(fSpec * 100)} − ${formatNumber(values.d / 10)} = ${formatNumber(fCL * 100)} cm`,
            values.Fspec < 0 ? "近視：隱形眼鏡比框架沒那麼負。" : "遠視：隱形眼鏡比框架更正。",
          ],
        };
      },
    },
    mirror: {
      fields: [
        { id: "F", label: "面鏡屈光力 F (D，凹+ 凸−)", type: "number", value: 6, step: 0.25 },
        { id: "l", label: "物距 l (m，物在前方取負)", type: "number", value: -0.8, step: 0.01 },
      ],
      compute(values) {
        if (!values.l) return { result: "物距不可為 0", steps: [] };
        const L = 1 / values.l;
        const Lp = L + values.F;
        const lp = Lp === 0 ? Infinity : -1 / Lp;
        const real = lp < 0;
        return {
          result: Number.isFinite(lp) ? `l' = ${formatNumber(lp)} m` : "像在無限遠",
          steps: [
            `L = 1/l = ${formatNumber(L)} D；L' = L + F = ${formatNumber(Lp)} D`,
            `面鏡反向：l' = −1/L' = ${Number.isFinite(lp) ? formatNumber(lp) + " m" : "∞"}`,
            real ? "l'<0：鏡前實像（與物同側）。" : "l'>0：鏡後虛像。",
          ],
        };
      },
    },
    chromatic: {
      fields: [
        { id: "Fd", label: "標稱屈光力 Fd (D)", type: "number", value: 5, step: 0.25 },
        { id: "v", label: "阿貝數 v", type: "number", value: 36, step: 1 },
      ],
      compute(values) {
        const ca = values.Fd / (values.v || 1);
        return {
          result: `縱向色像差 ≈ ${formatNumber(ca)} D`,
          steps: [
            `縱向 CA = Fd / v = ${formatNumber(values.Fd)} / ${formatNumber(values.v)} = ${formatNumber(ca)} D`,
            values.v < 35 ? "低阿貝數（如聚碳酸酯）色像差大。" : "高阿貝數材料色像差小。",
          ],
        };
      },
    },
    vergence: {
      fields: [
        { id: "n", label: "介質折射率 n", type: "number", value: 1, step: 0.001 },
        { id: "l", label: "距離 l (m)", type: "number", value: -0.5, step: 0.01 },
      ],
      compute(values) {
        const result = values.n / values.l;
        return {
          result: `L = ${formatNumber(result)} D`,
          steps: [
            `代入 L = n / l = ${formatNumber(values.n)} / ${formatNumber(values.l)}`,
            result < 0 ? "負值表示發散光，常見於實物在入射側。" : "正值表示會聚光，常見於虛物或已會聚的光束。",
          ],
        };
      },
    },
    snell: {
      fields: [
        { id: "n1", label: "第一介質 n1", type: "number", value: 1, step: 0.001 },
        { id: "n2", label: "第二介質 n2", type: "number", value: 1.5, step: 0.001 },
        { id: "theta1", label: "入射角 theta1 (度)", type: "number", value: 30, step: 0.1 },
      ],
      compute(values) {
        const ratio = (values.n1 * Math.sin(toRad(values.theta1))) / values.n2;
        if (Math.abs(ratio) > 1) {
          return {
            result: "發生全反射",
            steps: [
              `sin(theta2) = n1 sin(theta1) / n2 = ${formatNumber(ratio)}`,
              "因為絕對值大於 1，沒有實數折射角，表示光線全反射。",
            ],
          };
        }
        const theta2 = toDeg(Math.asin(ratio));
        return {
          result: `theta2 = ${formatNumber(theta2)}°`,
          steps: [
            `sin(theta2) = ${formatNumber(values.n1)} sin(${formatNumber(values.theta1)}°) / ${formatNumber(values.n2)}`,
            values.n2 > values.n1 ? "進入較高折射率介質，折射線偏向法線。" : "進入較低折射率介質，折射線遠離法線。",
          ],
        };
      },
    },
    critical: {
      fields: [
        { id: "n1", label: "高折射率介質 n1", type: "number", value: 1.5, step: 0.001 },
        { id: "n2", label: "低折射率介質 n2", type: "number", value: 1, step: 0.001 },
      ],
      compute(values) {
        if (values.n1 <= values.n2) {
          return {
            result: "不會形成臨界角",
            steps: ["全反射必須由高折射率介質進入低折射率介質，也就是 n1 > n2。"],
          };
        }
        const theta = toDeg(Math.asin(values.n2 / values.n1));
        return {
          result: `theta_c = ${formatNumber(theta)}°`,
          steps: [
            `theta_c = sin^-1(n2 / n1) = sin^-1(${formatNumber(values.n2)} / ${formatNumber(values.n1)})`,
            `入射角大於 ${formatNumber(theta)}° 時，才會發生全反射。`,
          ],
        };
      },
    },
    surface: {
      fields: [
        { id: "n", label: "入射側折射率 n", type: "number", value: 1, step: 0.001 },
        { id: "np", label: "出射側折射率 n'", type: "number", value: 1.523, step: 0.001 },
        { id: "r", label: "曲率半徑 r (m)", type: "number", value: 0.05, step: 0.001 },
      ],
      compute(values) {
        const result = (values.np - values.n) / values.r;
        return {
          result: `F = ${formatNumber(result)} D`,
          steps: [
            `F = (n' - n) / r = (${formatNumber(values.np)} - ${formatNumber(values.n)}) / ${formatNumber(values.r)}`,
            result > 0 ? "正屈光力表示此面使光束更會聚。" : "負屈光力表示此面使光束更發散。",
          ],
        };
      },
    },
    lens: {
      fields: [
        { id: "f", label: "薄透鏡屈光力 F (D)", type: "number", value: 10, step: 0.25 },
        { id: "l", label: "入射聚散度 L (D)", type: "number", value: -5, step: 0.25 },
      ],
      compute(values) {
        const lp = values.l + values.f;
        const imageDistance = lp === 0 ? Infinity : 1 / lp;
        return {
          result: `L' = ${formatNumber(lp)} D`,
          steps: [
            `L' = L + F = ${formatNumber(values.l)} + ${formatNumber(values.f)}`,
            Number.isFinite(imageDistance)
              ? `像距約 ${formatNumber(imageDistance)} m；正值表示出射側實像，負值表示入射側虛像。`
              : "L' = 0，出射光為平行光，像在無限遠。",
          ],
        };
      },
    },
  };

  function bindFormulaCalculator(root) {
    const typeSelect = root.querySelector("[data-calc-type]");
    const inputsRoot = root.querySelector("[data-calc-inputs]");
    const resultRoot = root.querySelector("[data-calc-result]");
    const stepsRoot = root.querySelector("[data-calc-steps]");
    if (!typeSelect || !inputsRoot || !resultRoot || !stepsRoot) return;

    const update = () => {
      const config = calculatorConfigs[typeSelect.value];
      const values = {};
      config.fields.forEach((field) => {
        const input = inputsRoot.querySelector(`[data-calc-field="${field.id}"]`);
        values[field.id] = Number(input?.value || 0);
      });
      const output = config.compute(values);
      resultRoot.textContent = output.result;
      stepsRoot.innerHTML = output.steps.map((step) => `<div class="step-card">${step}</div>`).join("");
    };

    const renderInputs = () => {
      const config = calculatorConfigs[typeSelect.value];
      inputsRoot.innerHTML = config.fields.map((field) => `
        <label>${field.label}
          <input data-calc-field="${field.id}" type="${field.type}" value="${field.value}" step="${field.step}" />
        </label>
      `).join("");
      inputsRoot.querySelectorAll("[data-calc-field]").forEach((input) => input.addEventListener("input", update));
      update();
    };

    typeSelect.addEventListener("change", renderInputs);
    renderInputs();
  }

  function toRad(degrees) {
    return degrees * Math.PI / 180;
  }

  function toDeg(radians) {
    return radians * 180 / Math.PI;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "∞";
    const rounded = Math.round(value * 1000) / 1000;
    return String(Object.is(rounded, -0) ? 0 : rounded);
  }

  function typesetMath() {
    if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise();
  }

  function initAiAssistant() {
    if (document.querySelector("[data-ai-assistant]")) return;
    const history = [];
    const widget = document.createElement("aside");
    widget.className = "ai-assistant";
    widget.dataset.aiAssistant = "true";
    widget.innerHTML = `
      <button class="ai-fab" type="button" data-ai-toggle>AI 小助手</button>
      <section class="ai-panel" data-ai-panel hidden>
        <header>
          <div>
            <strong>基礎光學 AI 小助手</strong>
            <p>根據本網站教材回答</p>
          </div>
          <button type="button" data-ai-close aria-label="close">×</button>
        </header>
        <div class="ai-messages" data-ai-messages>
          <div class="ai-message assistant">你可以問我：聚散度怎麼算？司乃耳定律為什麼角度要從法線量？薄透鏡焦距怎麼換屈光力？</div>
        </div>
        <form data-ai-form>
          <textarea data-ai-input rows="3" placeholder="輸入你的問題..."></textarea>
          <button class="btn" type="submit">送出</button>
        </form>
      </section>
    `;
    document.body.appendChild(widget);

    const panel = widget.querySelector("[data-ai-panel]");
    const messages = widget.querySelector("[data-ai-messages]");
    const input = widget.querySelector("[data-ai-input]");
    const form = widget.querySelector("[data-ai-form]");

    widget.querySelector("[data-ai-toggle]").addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) input.focus();
    });
    widget.querySelector("[data-ai-close]").addEventListener("click", () => {
      panel.hidden = true;
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const question = input.value.trim();
      if (!question) return;
      input.value = "";
      appendAiMessage(messages, "user", question);
      const loading = appendAiMessage(messages, "assistant", "正在查教材並思考...");

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, history }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const detail = payload.error || `伺服器回應 ${response.status}`;
          throw new Error(`AI 小助手暫時無法回答：${detail}`);
        }
        loading.innerHTML = formatAiAnswer(payload.answer, payload.sources, payload);
        history.push({ role: "user", content: question });
        history.push({ role: "assistant", content: payload.answer });
        if (history.length > 12) history.splice(0, history.length - 12);
        typesetMath();
      } catch (error) {
        loading.textContent = error.message || "AI 小助手暫時無法回答：請確認本機 npm start 是否還在執行。";
      }
      messages.scrollTop = messages.scrollHeight;
    });
  }

  function appendAiMessage(root, role, text) {
    const message = document.createElement("div");
    message.className = `ai-message ${role}`;
    message.textContent = text;
    root.appendChild(message);
    root.scrollTop = root.scrollHeight;
    return message;
  }

  function formatAiAnswer(answer, sources, meta = {}) {
    const paragraphs = paragraphizeAiText(cleanAiText(answer));
    const safe = `<div class="ai-answer">${paragraphs.map(renderAiParagraph).join("")}</div>`;
    const modelHtml = meta.provider
      ? `<div class="ai-model">Model: ${escapeHtml(meta.provider)} · ${escapeHtml(meta.model || "")}</div>`
      : "";
    const sourceHtml = sources?.length
      ? `<div class="ai-sources"><strong>教材來源</strong>${sources.map((source) => `<span>${escapeHtml(source.source)}｜${escapeHtml(source.title)}</span>`).join("")}</div>`
      : "";
    return `${safe}${modelHtml}${sourceHtml}`;
  }

  function renderAiParagraph(paragraph) {
    const match = paragraph.match(/^(重點|說明|步驟|小心|公式|例子)：\s*(.+)$/);
    if (!match) return `<p>${escapeHtml(paragraph).replace(/\n/g, "<br/>")}</p>`;

    const type = match[1];
    const body = match[2];
    const tone = {
      重點: "key",
      說明: "note",
      步驟: "step",
      小心: "warn",
      公式: "formula",
      例子: "example",
    }[type] || "note";

    return `
      <p class="ai-paragraph ${tone}">
        <span class="ai-tag">${escapeHtml(type)}</span>
        <span>${escapeHtml(body).replace(/\n/g, "<br/>")}</span>
      </p>
    `;
  }

  function paragraphizeAiText(text) {
    const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
    if (!normalized) return [""];

    return normalized
      .split(/\n{2,}/)
      .flatMap((block) => splitAiBlock(block.trim()))
      .filter(Boolean);
  }

  function splitAiBlock(block) {
    if (!block) return [];
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length > 1) return lines.flatMap((line) => splitLongAiLine(line));
    return splitLongAiLine(block);
  }

  function splitLongAiLine(line) {
    const sentences = line
      .replace(/([。！？；;!?])\s*/g, "$1\n")
      .split("\n")
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    if (sentences.length <= 1) return [line];
    return sentences;
  }

  function cleanAiText(text) {
    return String(text || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line
        .replace(/^\s{0,3}#{1,6}\s*/g, "")
        .replace(/^\s*[-*]\s+/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*\n]+)\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trimEnd())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ===== 期末互動實驗室 =====

  function clampX(canvas, x) {
    return Math.max(30, Math.min(canvas.width - 30, x));
  }

  function renderThickLens(node) {
    node.innerHTML = `
      <h3>厚透鏡 Fe / Fv / Fn 計算器</h3>
      <p class="muted">輸入前後表面屈光力、厚度與折射率，計算等效屈光力、前後頂點屈光力與主平面位置。</p>
      <div class="lab-controls">
        <label>前表面 F₁ (D) <input type="number" step="0.25" value="5.23" data-tl-f1 /></label>
        <label>後表面 F₂ (D) <input type="number" step="0.25" value="10.46" data-tl-f2 /></label>
        <label>厚度 t (mm) <input type="range" min="1" max="30" step="0.5" value="20" data-tl-t /></label>
        <label>折射率 n <input type="number" step="0.001" value="1.523" data-tl-n /></label>
      </div>
      <div class="formula" data-tl-result></div>
      <div class="step-grid" data-tl-steps></div>
      <canvas width="820" height="280" data-tl-canvas></canvas>
    `;
    const f1 = node.querySelector("[data-tl-f1]");
    const f2 = node.querySelector("[data-tl-f2]");
    const tEl = node.querySelector("[data-tl-t]");
    const nEl = node.querySelector("[data-tl-n]");
    const result = node.querySelector("[data-tl-result]");
    const steps = node.querySelector("[data-tl-steps]");
    const canvas = node.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const update = () => {
      const F1 = Number(f1.value), F2 = Number(f2.value);
      const t = Number(tEl.value) / 1000, n = Number(nEl.value) || 1.5;
      const tn = t / n;
      const Fe = F1 + F2 - tn * F1 * F2;
      const Fv = F1 / (1 - tn * F1) + F2;
      const Fn = F2 / (1 - tn * F2) + F1;
      const a1h = Fe ? (tn * F2) / Fe * 100 : 0;
      const a2h = Fe ? (-tn * F1) / Fe * 100 : 0;
      const fe = Fe ? 1 / Fe * 100 : Infinity;
      result.textContent = `Fe = ${Fe.toFixed(2)} D ｜ Fv = ${Fv.toFixed(2)} D ｜ Fn = ${Fn.toFixed(2)} D`;
      steps.innerHTML = `
        <div class="step-card"><strong>等效屈光力 Fe</strong><span>${F1.toFixed(2)} + ${F2.toFixed(2)} − (t/n)F₁F₂ = ${Fe.toFixed(2)} D</span></div>
        <div class="step-card"><strong>後頂點 Fv</strong><span>${Fv.toFixed(2)} D（焦度計 / 處方度數）</span></div>
        <div class="step-card"><strong>前頂點 Fn</strong><span>${Fn.toFixed(2)} D（測試鏡片中和法）</span></div>
        <div class="step-card"><strong>主平面 / 等效焦距</strong><span>A₁H=${a1h.toFixed(2)}cm，A₂H'=${a2h.toFixed(2)}cm，fe'=${Number.isFinite(fe) ? fe.toFixed(2) + "cm" : "∞"}</span></div>
      `;
      drawThickLens(ctx, canvas, { F1, F2, Fe, a1h, a2h });
    };
    [f1, f2, tEl, nEl].forEach((el) => el.addEventListener("input", update));
    update();
  }

  function drawThickLens(ctx, canvas, s) {
    drawPaperGrid(ctx, canvas);
    const axis = canvas.height / 2;
    const cx = canvas.width / 2;
    ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(24, axis); ctx.lineTo(canvas.width - 24, axis); ctx.stroke();
    ctx.fillStyle = "rgba(44,95,138,.10)";
    ctx.strokeStyle = "#2c5f8a"; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 34, axis - 86);
    ctx.quadraticCurveTo(cx - 4, axis, cx - 34, axis + 86);
    ctx.lineTo(cx + 34, axis + 86);
    ctx.quadraticCurveTo(cx + 4, axis, cx + 34, axis - 86);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    const scale = 6;
    const hx = clampX(canvas, cx - 34 + s.a1h * scale);
    const hpx = clampX(canvas, cx + 34 + s.a2h * scale);
    ctx.strokeStyle = "#b8860b"; ctx.lineWidth = 2;
    [["H", hx], ["H'", hpx]].forEach(([label, x]) => {
      ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(x, axis - 102); ctx.lineTo(x, axis + 102); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#1a1a2e"; ctx.font = "16px serif";
      ctx.fillText(label, x - 6, axis - 110);
    });
    if (s.Fe) {
      const fe = 1 / s.Fe * 100 * scale;
      drawPoint(ctx, clampX(canvas, hpx + fe), axis, "#c0392b", "F'");
      drawPoint(ctx, clampX(canvas, hx - fe), axis, "#1a6645", "F");
    }
    ctx.fillStyle = "#1a1a2e"; ctx.font = "15px serif";
    ctx.fillText(`F₁=${s.F1.toFixed(2)}D`, cx - 88, axis - 92);
    ctx.fillText(`F₂=${s.F2.toFixed(2)}D`, cx + 44, axis - 92);
    ctx.fillText("教學示意：數值以上方文字為準", 24, 22);
  }

  function renderCardinalPoints(node) {
    node.innerHTML = `
      <h3>六大基點與節點光線</h3>
      <p class="muted">拖曳角度，觀察「朝第一節點 N 射入的光線，會以相同角度從第二節點 N′ 射出」。</p>
      <div class="lab-controls">
        <label>入射角度 (°) <input type="range" min="-18" max="18" value="10" data-cp-angle /></label>
        <div class="card pad"><strong data-cp-info></strong><br/><span class="muted">F/F′ 決定聚焦位置、H/H′ 量物像距、N/N′ 維持角度。</span></div>
      </div>
      <canvas width="820" height="280" data-cp-canvas></canvas>
    `;
    const angle = node.querySelector("[data-cp-angle]");
    const info = node.querySelector("[data-cp-info]");
    const canvas = node.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const draw = () => {
      const deg = Number(angle.value);
      const m = Math.tan(deg * Math.PI / 180);
      info.textContent = `入射角 ${deg}° → 出射角 ${deg}°（通過節點角度不變）`;
      drawPaperGrid(ctx, canvas);
      const axis = canvas.height / 2;
      const cx = canvas.width / 2;
      ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(24, axis); ctx.lineTo(canvas.width - 24, axis); ctx.stroke();
      ctx.fillStyle = "rgba(44,95,138,.10)"; ctx.strokeStyle = "#2c5f8a"; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 22, axis - 80); ctx.quadraticCurveTo(cx, axis, cx - 22, axis + 80);
      ctx.lineTo(cx + 22, axis + 80); ctx.quadraticCurveTo(cx, axis, cx + 22, axis - 80);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      const pts = [["F", cx - 230, "#1a6645"], ["H", cx - 26, "#b8860b"], ["N", cx - 9, "#7a3fa0"], ["N'", cx + 9, "#7a3fa0"], ["H'", cx + 26, "#b8860b"], ["F'", cx + 230, "#c0392b"]];
      pts.forEach(([l, x, c]) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, axis, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#1a1a2e"; ctx.font = "14px serif"; ctx.fillText(l, x - 6, axis + 24);
      });
      const nIn = cx - 9, nOut = cx + 9;
      const sx = 70, ex = canvas.width - 70;
      drawArrowLine(ctx, sx, axis + m * (sx - nIn), nIn, axis, "#7a3fa0", 3);
      drawArrowLine(ctx, nOut, axis, ex, axis + m * (ex - nOut), "#7a3fa0", 3);
    };
    angle.addEventListener("input", draw);
    draw();
  }

  function renderEyeModel(node) {
    node.innerHTML = `
      <h3>簡化眼：眼軸與屈光不正</h3>
      <p class="muted">屈光力固定 +60.00D、n′=1.333。拖動眼軸長，看平行光聚焦點落在視網膜前 / 上 / 後。</p>
      <div class="lab-controls">
        <label>眼軸長度 (mm) <input type="range" min="19.5" max="25.5" step="0.01" value="23.22" data-eye-axial /></label>
        <div class="card pad"><strong data-eye-state></strong><br/><span class="muted" data-eye-detail></span></div>
      </div>
      <canvas width="760" height="280" data-eye-canvas></canvas>
    `;
    const axialEl = node.querySelector("[data-eye-axial]");
    const stateEl = node.querySelector("[data-eye-state]");
    const detailEl = node.querySelector("[data-eye-detail]");
    const canvas = node.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const F = 60, np = 1.333;
    const update = () => {
      const axial = Number(axialEl.value);
      const L = np / (axial / 1000) - F;
      const fp = L ? 1 / L * 100 : Infinity;
      let state, cls;
      if (Math.abs(L) < 0.06) { state = "正視 (emmetrope)"; cls = "像剛好落在視網膜上"; }
      else if (L < 0) { state = `近視 ${Math.abs(L).toFixed(2)} D`; cls = `遠點在角膜前方 ${Math.abs(fp).toFixed(1)} cm，需負鏡矯正`; }
      else { state = `遠視 ${L.toFixed(2)} D`; cls = `遠點在角膜後方 ${Math.abs(fp).toFixed(1)} cm（虛），需正鏡矯正`; }
      stateEl.textContent = state;
      detailEl.textContent = `${cls}（聚焦點固定在角膜後 22.22mm，視網膜在 ${axial.toFixed(2)}mm）`;
      drawEye(ctx, canvas, axial);
    };
    axialEl.addEventListener("input", update);
    update();
  }

  function drawEye(ctx, canvas, axial) {
    drawPaperGrid(ctx, canvas);
    const axis = canvas.height / 2;
    const x0 = 110, scale = 13;
    const focusX = x0 + 22.22 * scale;
    const retinaX = x0 + axial * scale;
    ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(24, axis); ctx.lineTo(canvas.width - 24, axis); ctx.stroke();
    ctx.strokeStyle = "#2c5f8a"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x0, axis - 70); ctx.quadraticCurveTo(x0 - 34, axis, x0, axis + 70); ctx.stroke();
    ctx.strokeStyle = "#1a6645"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(retinaX - 16, axis - 78); ctx.quadraticCurveTo(retinaX + 30, axis, retinaX - 16, axis + 78); ctx.stroke();
    ctx.fillStyle = "#1a6645"; ctx.font = "14px serif"; ctx.fillText("視網膜", retinaX - 18, axis + 96);
    [-40, 40].forEach((dy) => {
      drawArrowLine(ctx, 30, axis + dy, x0, axis + dy, "#7a7060", 2);
      ctx.strokeStyle = "#2c5f8a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, axis + dy); ctx.lineTo(focusX, axis); ctx.stroke();
    });
    drawPoint(ctx, focusX, axis, "#c0392b", "聚焦點 22.22mm");
    if (Math.abs(retinaX - focusX) > 4) {
      ctx.strokeStyle = "rgba(192,57,43,.6)"; ctx.setLineDash([4, 4]);
      const blur = Math.min(34, Math.abs(retinaX - focusX) * 0.5);
      ctx.beginPath(); ctx.moveTo(retinaX, axis - blur); ctx.lineTo(retinaX, axis + blur); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = "#1a1a2e"; ctx.font = "14px serif"; ctx.fillText("平行光（無限遠）", 26, axis - 56);
  }

  function renderVertexDistance(node) {
    node.innerHTML = `
      <h3>頂點距離換算：框架鏡 → 隱形眼鏡</h3>
      <p class="muted">遠點位置固定；鏡片移近角膜只改變它到遠點的焦距。先換焦距、加減頂點距離，再換回度數。</p>
      <div class="lab-controls">
        <label>框架鏡屈光力 (D) <input type="number" step="0.25" value="-9.00" data-vd-f /></label>
        <label>頂點距離 d (mm) <input type="range" min="8" max="18" step="0.5" value="15" data-vd-d /></label>
      </div>
      <div class="formula" data-vd-result></div>
      <div class="step-grid" data-vd-steps></div>
    `;
    const fEl = node.querySelector("[data-vd-f]");
    const dEl = node.querySelector("[data-vd-d]");
    const result = node.querySelector("[data-vd-result]");
    const steps = node.querySelector("[data-vd-steps]");
    const update = () => {
      const Fs = Number(fEl.value);
      const d = Number(dEl.value) / 1000;
      if (!Fs) { result.textContent = "請輸入非零度數"; steps.innerHTML = ""; return; }
      const fSpec = 1 / Fs;
      const fCL = fSpec - d;
      const Fcl = 1 / fCL;
      result.textContent = `隱形眼鏡屈光力 ≈ ${Fcl.toFixed(2)} D`;
      const dir = Fs < 0 ? "近視：CL 比框架沒那麼負" : "遠視：CL 比框架更正";
      steps.innerHTML = `
        <div class="step-card"><strong>1. 框架鏡焦距</strong><span>f = 1/${Fs.toFixed(2)} = ${(fSpec * 100).toFixed(2)} cm（到遠點）</span></div>
        <div class="step-card"><strong>2. 平移頂點距離</strong><span>f(CL) = ${(fSpec * 100).toFixed(2)} − ${(d * 100).toFixed(2)} = ${(fCL * 100).toFixed(2)} cm</span></div>
        <div class="step-card"><strong>3. 換回度數</strong><span>F(CL) = 1/${fCL.toFixed(4)} = ${Fcl.toFixed(2)} D</span></div>
        <div class="step-card"><strong>方向檢查</strong><span>${dir}</span></div>
      `;
    };
    [fEl, dEl].forEach((el) => el.addEventListener("input", update));
    update();
  }

  function renderMirror(node) {
    node.innerHTML = `
      <h3>面鏡成像實驗室</h3>
      <p class="muted">凹面正、凸面負、平面 0。注意反射後光反向：L′=L+F，再以 l′=−1/L′ 換回像距。</p>
      <div class="lab-controls">
        <label>面鏡類型
          <select data-mr-type>
            <option value="concave">凹面鏡（會聚）</option>
            <option value="convex">凸面鏡（發散）</option>
            <option value="plane">平面鏡</option>
          </select>
        </label>
        <label>焦距大小 |f′| (cm) <input type="range" min="8" max="60" step="1" value="17" data-mr-f /></label>
        <label>物距 (cm) <input type="range" min="5" max="120" step="1" value="80" data-mr-o /></label>
        <div class="card pad"><strong data-mr-result></strong><br/><span class="muted" data-mr-note></span></div>
      </div>
      <canvas width="820" height="300" data-mr-canvas></canvas>
    `;
    const typeEl = node.querySelector("[data-mr-type]");
    const fEl = node.querySelector("[data-mr-f]");
    const oEl = node.querySelector("[data-mr-o]");
    const result = node.querySelector("[data-mr-result]");
    const note = node.querySelector("[data-mr-note]");
    const canvas = node.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const update = () => {
      const type = typeEl.value;
      const fMag = Number(fEl.value);
      const objCm = Number(oEl.value);
      let F;
      if (type === "plane") F = 0;
      else if (type === "concave") F = 100 / fMag;
      else F = -100 / fMag;
      const L = -100 / objCm;
      const Lp = L + F;
      const imgCm = Lp === 0 ? Infinity : -100 / Lp;
      const real = imgCm < 0;
      const m = Lp === 0 ? Infinity : L / Lp;
      result.textContent = `F=${F.toFixed(2)}D，L'=${Lp.toFixed(2)}D，像距 ${Number.isFinite(imgCm) ? Math.abs(imgCm).toFixed(1) + " cm" : "∞"}`;
      note.textContent = `${real ? "鏡前實像" : "鏡後虛像"}、${m < 0 ? "倒立" : "正立"}、放大率 ${Number.isFinite(m) ? m.toFixed(2) : "∞"}`;
      drawMirrorLab(ctx, canvas, { type, objCm, imgCm, F });
    };
    [typeEl, fEl, oEl].forEach((el) => el.addEventListener("input", update));
    update();
  }

  function drawMirrorLab(ctx, canvas, s) {
    drawPaperGrid(ctx, canvas);
    const axis = canvas.height / 2;
    const mx = canvas.width - 150;
    const scale = 2.6;
    ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(24, axis); ctx.lineTo(canvas.width - 24, axis); ctx.stroke();
    ctx.strokeStyle = "#2c5f8a"; ctx.lineWidth = 4;
    ctx.beginPath();
    if (s.type === "plane") { ctx.moveTo(mx, axis - 110); ctx.lineTo(mx, axis + 110); }
    else if (s.type === "concave") { ctx.moveTo(mx + 24, axis - 110); ctx.quadraticCurveTo(mx - 26, axis, mx + 24, axis + 110); }
    else { ctx.moveTo(mx - 24, axis - 110); ctx.quadraticCurveTo(mx + 26, axis, mx - 24, axis + 110); }
    ctx.stroke();
    const objX = clampX(canvas, mx - s.objCm * scale);
    drawArrow(ctx, objX, axis, objX, axis - 60, "#1a6645");
    ctx.fillStyle = "#1a1a2e"; ctx.font = "15px serif"; ctx.fillText("物", objX - 8, axis + 20);
    if (Number.isFinite(s.imgCm)) {
      const imgX = clampX(canvas, mx + s.imgCm * scale);
      drawArrow(ctx, imgX, axis, imgX, axis - 48, s.imgCm < 0 ? "#c0392b" : "#b8860b");
      ctx.fillStyle = "#1a1a2e"; ctx.fillText(s.imgCm < 0 ? "實像" : "虛像", imgX - 14, axis + 20);
    }
    if (s.F) {
      const fx = s.type === "concave" ? clampX(canvas, mx - (100 / s.F) * scale) : clampX(canvas, mx + (100 / s.F) * scale);
      drawPoint(ctx, fx, axis, "#7a3fa0", "F'");
    }
    ctx.fillStyle = "#1a1a2e"; ctx.font = "14px serif"; ctx.fillText("教學示意：數值以文字為準（面鏡像距已反向）", 24, 22);
  }

  function renderReflectance(node) {
    node.innerHTML = `
      <h3>反射率與抗反射膜</h3>
      <p class="muted">垂直入射時 R=((n′−n)/(n′+n))²；最佳抗反射膜 nc=√nL。</p>
      <div class="lab-controls">
        <label>鏡片折射率 nL <input type="range" min="1.4" max="1.9" step="0.001" value="1.586" data-rf-n /></label>
        <div class="card pad"><strong data-rf-result></strong><br/><span class="muted" data-rf-note></span></div>
      </div>
      <div class="formula" data-rf-bar></div>
    `;
    const nEl = node.querySelector("[data-rf-n]");
    const result = node.querySelector("[data-rf-result]");
    const note = node.querySelector("[data-rf-note]");
    const bar = node.querySelector("[data-rf-bar]");
    const update = () => {
      const n = Number(nEl.value);
      const R = Math.pow((n - 1) / (n + 1), 2) * 100;
      const coat = Math.sqrt(n);
      result.textContent = `nL=${n.toFixed(3)} → 單面反射率 R ≈ ${R.toFixed(2)}%`;
      note.textContent = `最佳抗反射膜折射率 nc = √${n.toFixed(3)} ≈ ${coat.toFixed(3)}，厚度為 ¼波長奇數倍。`;
      bar.textContent = `R = ((${n.toFixed(3)} − 1) / (${n.toFixed(3)} + 1))² = ${R.toFixed(2)}%`;
    };
    nEl.addEventListener("input", update);
    update();
  }

  function renderShapeFactor(node) {
    node.innerHTML = `
      <h3>形狀因子與球面像差</h3>
      <p class="muted">σ=(r₂+r₁)/(r₂−r₁)。同樣屈光力，接近凸平（前表面隆凸）的形狀使縱向球差最小。</p>
      <div class="lab-controls">
        <label>前表面 r₁ (cm) <input type="number" step="0.5" value="10" data-sf-r1 /></label>
        <label>後表面 r₂ (cm) <input type="number" step="0.5" value="-40" data-sf-r2 /></label>
        <div class="card pad"><strong data-sf-result></strong><br/><span class="muted" data-sf-note></span></div>
      </div>
    `;
    const r1El = node.querySelector("[data-sf-r1]");
    const r2El = node.querySelector("[data-sf-r2]");
    const result = node.querySelector("[data-sf-result]");
    const note = node.querySelector("[data-sf-note]");
    const update = () => {
      const r1 = Number(r1El.value), r2 = Number(r2El.value);
      if (r2 - r1 === 0) { result.textContent = "r₂ 不能等於 r₁"; note.textContent = ""; return; }
      const sigma = (r2 + r1) / (r2 - r1);
      result.textContent = `形狀因子 σ = (${r2}+${r1})/(${r2}−${r1}) = ${sigma.toFixed(2)}`;
      const shape = Math.abs(sigma) < 0.3 ? "接近對稱雙凸" : sigma > 0 ? "前表面較凸（偏凸平）" : "後表面較凸";
      note.textContent = `${shape}。σ≈+1（凸平、前表面隆凸）時縱向球差最小；眼鏡邊緣光多被虹膜擋住，影響較小。`;
    };
    [r1El, r2El].forEach((el) => el.addEventListener("input", update));
    update();
  }

  function renderTilt(node) {
    node.innerHTML = `
      <h3>鏡片傾斜誘發屈光力</h3>
      <p class="muted">傾斜使球面項略增並誘發柱面：F@=F(1+sin²θ/2n)、柱面=F·tan²θ。彎弧軸 090、前傾軸 180。</p>
      <div class="lab-controls">
        <label>球面屈光力 F (D) <input type="number" step="0.25" value="-6.00" data-ti-f /></label>
        <label>傾斜角 θ (°) <input type="range" min="0" max="30" step="1" value="20" data-ti-t /></label>
        <label>折射率 n <input type="number" step="0.001" value="1.586" data-ti-n /></label>
        <label>傾斜方式
          <select data-ti-mode>
            <option value="face">鏡框彎弧（軸 090）</option>
            <option value="panto">前傾角（軸 180）</option>
          </select>
        </label>
      </div>
      <div class="formula" data-ti-result></div>
      <div class="step-grid" data-ti-steps></div>
    `;
    const fEl = node.querySelector("[data-ti-f]");
    const tEl = node.querySelector("[data-ti-t]");
    const nEl = node.querySelector("[data-ti-n]");
    const modeEl = node.querySelector("[data-ti-mode]");
    const result = node.querySelector("[data-ti-result]");
    const steps = node.querySelector("[data-ti-steps]");
    const update = () => {
      const F = Number(fEl.value), theta = Number(tEl.value) * Math.PI / 180, n = Number(nEl.value) || 1.5;
      const sphere = F * (1 + Math.pow(Math.sin(theta), 2) / (2 * n));
      const cyl = F * Math.pow(Math.tan(theta), 2);
      const axis = modeEl.value === "face" ? "090" : "180";
      result.textContent = `等效屈光力 ≈ ${sphere.toFixed(2)} ${cyl >= 0 ? "+" : "−"}${Math.abs(cyl).toFixed(2)} × ${axis}`;
      steps.innerHTML = `
        <div class="step-card"><strong>球面項</strong><span>F(1+sin²θ/2n) = ${sphere.toFixed(2)} D</span></div>
        <div class="step-card"><strong>誘發柱面</strong><span>F·tan²θ = ${cyl.toFixed(2)} D，軸 ${axis}</span></div>
        <div class="step-card"><strong>觀念</strong><span>${F < 0 ? "前傾增加負透鏡負度數，近視欠矯者常壓低眼鏡看遠" : "傾斜亦改變正鏡度數，需製鏡補償"}</span></div>
      `;
    };
    [fEl, tEl, nEl, modeEl].forEach((el) => el.addEventListener("input", update));
    update();
  }

  function renderDistortion(node) {
    node.innerHTML = `
      <h3>畸變：桶形 vs 枕形</h3>
      <p class="muted">負透鏡周邊縮小 → 桶形畸變；正透鏡周邊放大 → 枕形畸變。</p>
      <div class="lab-controls">
        <label>透鏡類型
          <select data-ds-type>
            <option value="minus">負透鏡（桶形 barrel）</option>
            <option value="plus">正透鏡（枕形 pincushion）</option>
          </select>
        </label>
        <div class="card pad"><strong data-ds-info></strong></div>
      </div>
      <canvas width="420" height="300" data-ds-canvas></canvas>
    `;
    const typeEl = node.querySelector("[data-ds-type]");
    const info = node.querySelector("[data-ds-info]");
    const canvas = node.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const draw = () => {
      const minus = typeEl.value === "minus";
      info.textContent = minus ? "負透鏡：周邊縮小率較大，方格被擠成桶形。" : "正透鏡：周邊放大率較大，方格被撐成枕形。";
      ctx.fillStyle = "#fffdf7"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      const n = 6, span = 110;
      ctx.strokeStyle = "#2c5f8a"; ctx.lineWidth = 2;
      const warp = (x, y) => {
        const dx = (x - cx) / span, dy = (y - cy) / span;
        const r2 = dx * dx + dy * dy;
        const k = minus ? -0.16 : 0.16;
        const f = 1 + k * r2;
        return [cx + (x - cx) * f, cy + (y - cy) * f];
      };
      for (let i = 0; i <= n; i++) {
        const t = -span + (2 * span) * i / n;
        ctx.beginPath();
        for (let j = 0; j <= n * 4; j++) {
          const u = -span + (2 * span) * j / (n * 4);
          const [px, py] = warp(cx + u, cy + t);
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.beginPath();
        for (let j = 0; j <= n * 4; j++) {
          const u = -span + (2 * span) * j / (n * 4);
          const [px, py] = warp(cx + t, cy + u);
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    };
    typeEl.addEventListener("change", draw);
    draw();
  }

  function renderChromatic(node) {
    node.innerHTML = `
      <h3>色像差與阿貝數計算器</h3>
      <p class="muted">縱向色像差 = Fd / v；阿貝數 v 越大，色像差越小。</p>
      <div class="lab-controls">
        <label>標稱屈光力 Fd (D) <input type="number" step="0.25" value="5.00" data-cr-f /></label>
        <label>阿貝數 v <input type="range" min="20" max="60" step="1" value="36" data-cr-v /></label>
        <div class="card pad"><strong data-cr-result></strong><br/><span class="muted" data-cr-note></span></div>
      </div>
    `;
    const fEl = node.querySelector("[data-cr-f]");
    const vEl = node.querySelector("[data-cr-v]");
    const result = node.querySelector("[data-cr-result]");
    const note = node.querySelector("[data-cr-note]");
    const update = () => {
      const Fd = Number(fEl.value), v = Number(vEl.value) || 1;
      const ca = Fd / v;
      result.textContent = `縱向色像差 ≈ ${ca.toFixed(3)} D（v=${v}）`;
      note.textContent = v < 35 ? "低阿貝數（如聚碳酸酯）色像差大，高度數時邊緣彩邊明顯。" : "高阿貝數材料色像差小，影像較乾淨。";
    };
    [fEl, vEl].forEach((el) => el.addEventListener("input", update));
    update();
  }

  renderShell();
  renderProgressBadges();
  renderDashboard();
  renderChapter();
  renderPractice();
  renderSearch();
  renderExam();
  initAiAssistant();
})();
