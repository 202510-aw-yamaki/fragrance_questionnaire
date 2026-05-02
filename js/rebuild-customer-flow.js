(function () {
  const AXES = ["floral", "fresh", "woody", "spicy", "sweet"];
  const AXIS_LABELS = {
    floral: "フローラル",
    fresh: "シトラス",
    woody: "ウッディ",
    spicy: "スパイシー",
    sweet: "スウィート"
  };
  const SCORING_CONFIG_KEY = "fragranceScoringConfig";
  const SCORE_STATE_KEY = "fragranceScoreState";
  const STEP1_ANSWERS_KEY = "fragranceStep1Answers";
  const DRAFT_KEY = "fragranceReservationDraft";
  const CONFIRMATION_KEY = "fragranceReservationConfirmation";
  const DEFAULT_AXES = { floral: 56, fresh: 58, woody: 45, spicy: 36, sweet: 52 };
  const ANSWER_ORDER = ["A", "B", "C", "D", "ALL", "NONE"];

  const STEP1_QUESTIONS = [
    {
      id: "Q1",
      title: "今日はどんな雰囲気の香りに惹かれますか？",
      caption: "直感で近いものを選んでください。",
      imageBase: "step1",
      options: [
        ["A", "華やかで明るい", "Q1-A.png"],
        ["B", "爽やかで軽やか", "Q1-B.png"],
        ["C", "深みがあり落ち着く", "Q1-C.png"],
        ["D", "やわらかく甘い", "Q1-D.png"]
      ]
    },
    {
      id: "Q2",
      title: "今の気分に近い色はどれですか？",
      caption: "香りの印象を色から探ります。",
      imageBase: "step1",
      options: [
        ["A", "透明感のある白や水色", "step1-q2-b.png"],
        ["B", "やさしいピンクやベージュ", "step1-q2-a.png"],
        ["C", "深いグリーンやブラウン", "step1-q2-c.png"],
        ["D", "あたたかい琥珀色", "step1-q2-d.png"]
      ]
    },
    {
      id: "Q3",
      title: "香りをまとう場面を選ぶなら？",
      caption: "使いたいシーンから方向性を整えます。",
      imageBase: "step1",
      options: [
        ["A", "朝の外出前", "step1-q3-a.png"],
        ["B", "人と会う日", "step1-q3-b.png"],
        ["C", "一人で落ち着きたい時間", "step1-q3-c.png"],
        ["D", "特別な夜", "step1-q3-d.png"]
      ]
    },
    {
      id: "Q4",
      title: "好きな空気感に近いものは？",
      caption: "香りの余韻の強さを見ます。",
      imageBase: "step1",
      options: [
        ["A", "澄んだ空気", "step1-q4-a.png"],
        ["B", "花のある部屋", "step1-q4-b.png"],
        ["C", "木陰の静けさ", "step1-q4-c.png"],
        ["D", "夕暮れのぬくもり", "step1-q4-d.png"]
      ]
    },
    {
      id: "Q5",
      title: "最後に残したい印象は？",
      caption: "ベースになる雰囲気を決めます。",
      imageBase: "step1",
      options: [
        ["A", "清潔感", "step1-q5-a.png"],
        ["B", "やさしさ", "step1-q5-b.png"],
        ["C", "落ち着き", "step1-q5-c.png"],
        ["D", "甘さ", "step1-q5-d.png"]
      ]
    }
  ];

  const STEP2_QUESTIONS = {
    floral: [
      ["Q6", "華やかさの出方は？", [["A", "ふわっと明るく"], ["B", "やさしく上品に"], ["C", "しっとり深く"]]],
      ["Q7", "甘さはどのくらい欲しいですか？", [["A", "少しだけ"], ["B", "自然に"], ["C", "しっかり"]]],
      ["Q8", "仕上がりの印象は？", [["A", "軽やか"], ["B", "やわらか"], ["C", "印象強め"]]]
    ],
    fresh: [
      ["Q6", "爽やかさの出方は？", [["A", "みずみずしく"], ["B", "透明感を強く"], ["C", "少しシャープに"]]],
      ["Q7", "香りの残り方は？", [["A", "すっと軽く"], ["B", "やわらかく"], ["C", "静かに長く"]]],
      ["Q8", "仕上がりの印象は？", [["A", "軽やか"], ["B", "やわらか"], ["C", "印象強め"]]]
    ],
    woody: [
      ["Q6", "深みの出方は？", [["A", "木のぬくもり"], ["B", "静かな落ち着き"], ["C", "個性のある余韻"]]],
      ["Q7", "香りの重さは？", [["A", "軽め"], ["B", "中間"], ["C", "深め"]]],
      ["Q8", "仕上がりの印象は？", [["A", "軽やか"], ["B", "やわらか"], ["C", "印象強め"]]]
    ]
  };

  function $(id) {
    return document.getElementById(id);
  }

  function clamp(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(window.sessionStorage.getItem(key) || "null") || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  }

  function getConfig() {
    const cached = readJson(SCORING_CONFIG_KEY, null);
    const master = window.FragranceMasterData;
    if (cached && master?.getCompatibleScoringConfig) return master.getCompatibleScoringConfig(cached);
    return master?.createDefaultScoringConfig?.() || {};
  }

  async function cacheActiveConfig() {
    const remote = await window.FragrancePublicData?.loadActiveScoringConfig?.();
    const master = window.FragranceMasterData;
    const config = master?.getCompatibleScoringConfig
      ? master.getCompatibleScoringConfig(remote)
      : (remote || getConfig());
    writeJson(SCORING_CONFIG_KEY, config);
    return config;
  }

  function initialAxes(config) {
    return AXES.reduce((acc, axis) => {
      acc[axis] = Number(config.initialAxisScore || 50);
      return acc;
    }, {});
  }

  function addScore(base, score, weight) {
    const next = { ...base };
    AXES.forEach((axis) => {
      next[axis] = clamp(Number(next[axis] || 0) + Number(score?.[axis] || 0) * weight);
    });
    return next;
  }

  function getBranchFromAxes(axes) {
    const candidates = ["floral", "fresh", "woody"];
    return candidates.sort((a, b) => Number(axes[b] || 0) - Number(axes[a] || 0))[0] || "floral";
  }

  function calculateStep1(config, answers) {
    let axes = initialAxes(config);
    STEP1_QUESTIONS.forEach((question) => {
      const key = answers[question.id] || "A";
      const score = config.step1ScoreMap?.[question.id]?.[key];
      axes = addScore(axes, score, Number(config.questionWeights?.step1 || 1));
    });
    return axes;
  }

  function calculateStep2(config, state, answers) {
    let axes = { ...(state.axesAfterStep1 || initialAxes(config)) };
    const branch = state.branchKey || getBranchFromAxes(axes);
    const questions = STEP2_QUESTIONS[branch] || STEP2_QUESTIONS.floral;
    questions.forEach(([id], index) => {
      const key = answers[id] || "A";
      const scoreSource = index < 2
        ? config.step2ScoreMap?.[branch]?.[id]?.[key]
        : config.q8ScoreMap?.[key];
      axes = addScore(axes, scoreSource, Number(index < 2 ? config.questionWeights?.step2 || 2 : config.questionWeights?.finish || 3));
    });
    return axes;
  }

  function renderProgress(current, total) {
    const label = $("progress-label");
    const bar = $("progress-bar");
    const index = $("question-index");
    const stepper = $("question-stepper");
    if (label) label.textContent = `${current} / ${total}`;
    if (index) index.textContent = `${current} / ${total}`;
    if (bar) bar.style.width = `${Math.round((current / total) * 100)}%`;
    if (stepper) {
      stepper.innerHTML = Array.from({ length: total }, (_, idx) => `<span class="${idx + 1 <= current ? "is-active" : ""}"></span>`).join("");
    }
  }

  function getQuestionTextOverride(config, kind, questionId, branch) {
    const root = config?.questionTextOverrides || config?.questionOverrides || {};
    if (kind === "step2") {
      return root.step2?.[branch]?.[questionId] || root.step2?.[questionId] || null;
    }
    if (kind === "q8") {
      return root.q8?.[questionId] || root.q8 || null;
    }
    return root.step1?.[questionId] || root[questionId] || null;
  }

  function mergeOptionsWithOverride(options, override) {
    const optionMap = new Map(options.map(([key, label, image]) => [key, { key, label, image }]));
    const overrideAnswers = override?.answers || {};
    Object.keys(overrideAnswers).forEach((key) => {
      if (!optionMap.has(key)) optionMap.set(key, { key, label: "", image: "" });
    });
    return Array.from(optionMap.values())
      .sort((a, b) => {
        const orderA = ANSWER_ORDER.indexOf(a.key);
        const orderB = ANSWER_ORDER.indexOf(b.key);
        return (orderA === -1 ? 99 : orderA) - (orderB === -1 ? 99 : orderB);
      })
      .map(({ key, label, image }) => [key, overrideAnswers[key] || label, image]);
  }

  function getStep1Question(question, config) {
    const override = getQuestionTextOverride(config, "step1", question.id);
    return {
      ...question,
      title: override?.title || question.title,
      caption: override?.caption || question.caption,
      options: mergeOptionsWithOverride(question.options, override)
    };
  }

  function renderMiniRadar(axes, targetId = "axis-preview") {
    const mount = $(targetId);
    if (!mount) return;
    const values = AXES.map((axis) => clamp(axes?.[axis] ?? DEFAULT_AXES[axis]));
    const points = values.map((value, index) => {
      const angle = (-90 + index * 72) * Math.PI / 180;
      const radius = 34 + value * 0.52;
      return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`;
    }).join(" ");
    mount.innerHTML = `
      <svg class="radar" viewBox="0 0 200 200" aria-label="香り5軸">
        <polygon points="100,28 168,78 142,160 58,160 32,78" fill="none" stroke="#e3c99d" />
        <polygon points="${points}" fill="rgba(220,119,119,.24)" stroke="#d77777" stroke-width="3" />
        <g class="radar-labels">
          <text x="100" y="17">${AXIS_LABELS.floral}</text>
          <text x="180" y="78">${AXIS_LABELS.fresh}</text>
          <text x="148" y="182">${AXIS_LABELS.woody}</text>
          <text x="52" y="182">${AXIS_LABELS.spicy}</text>
          <text x="20" y="78">${AXIS_LABELS.sweet}</text>
        </g>
      </svg>
      <div class="plain-list">
        ${AXES.map((axis, idx) => `<span>${AXIS_LABELS[axis]} ${values[idx]}</span>`).join("")}
      </div>
    `;
  }

  function setQuestionText(question) {
    if ($("question-title")) $("question-title").textContent = question.title;
    if ($("question-caption")) $("question-caption").textContent = question.caption || "";
    if ($("question-reflection-note")) {
      $("question-reflection-note").textContent = "香り5軸に反映されます";
    } else if ($("helper-text")) {
      $("helper-text").textContent = "選んだ内容は香り5軸に反映されます。";
    }
  }

  function imagePath(name) {
    if (/^Q\d+-[A-D]\.png$/.test(name)) return `../img/costomer/${name}`;
    return `../img/questionnaire-v11/${name}`;
  }

  async function initQuestionnaireStep1() {
    const config = await cacheActiveConfig();
    let current = 0;
    const answers = readJson(STEP1_ANSWERS_KEY, {});
    const optionList = $("option-list");
    const nextBtn = $("header-next-btn");
    const prevBtn = $("header-prev-btn");

    function render() {
      const question = getStep1Question(STEP1_QUESTIONS[current], config);
      setQuestionText(question);
      renderProgress(current + 1, STEP1_QUESTIONS.length);
      if (optionList) {
        optionList.innerHTML = question.options.map(([key, label, image]) => {
          const imageStyle = image ? ` style="--option-image: url('${imagePath(image)}');"` : "";
          return `
          <button class="option-button ${answers[question.id] === key ? "is-selected" : ""}" type="button" data-answer-key="${key}"${imageStyle}>
            ${image ? `<span class="option-art" aria-hidden="true"></span>` : ""}
            <span class="option-label">${label}</span>
            <span class="option-check" aria-hidden="true"></span>
          </button>
        `;
        }).join("");
        optionList.querySelectorAll("[data-answer-key]").forEach((button) => {
          button.addEventListener("click", () => {
            answers[question.id] = button.dataset.answerKey;
            writeJson(STEP1_ANSWERS_KEY, answers);
            render();
          });
        });
      }
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.textContent = current === STEP1_QUESTIONS.length - 1 ? "次へ" : "次へ";
      const axes = calculateStep1(config, answers);
      renderMiniRadar(axes);
    }

    prevBtn?.addEventListener("click", () => {
      current = Math.max(0, current - 1);
      render();
    });
    nextBtn?.addEventListener("click", () => {
      const question = getStep1Question(STEP1_QUESTIONS[current], config);
      if (!answers[question.id]) {
        answers[question.id] = question.options[0][0];
        writeJson(STEP1_ANSWERS_KEY, answers);
      }
      if (current < STEP1_QUESTIONS.length - 1) {
        current += 1;
        render();
        return;
      }
      const axesAfterStep1 = calculateStep1(config, answers);
      const branchKey = getBranchFromAxes(axesAfterStep1);
      writeJson(SCORE_STATE_KEY, {
        step1Answers: answers,
        step1AnswerKeys: answers,
        axesAfterStep1,
        branchKey,
        startedAt: new Date().toISOString()
      });
      window.location.href = "questionnaire_step2.html";
    });
    $("return-top-btn")?.addEventListener("click", () => { window.location.href = "../index.html"; });
    $("return-top-btn-mobile")?.addEventListener("click", () => { window.location.href = "../index.html"; });
    render();
  }

  function step2Options(branch, index) {
    const questions = STEP2_QUESTIONS[branch] || STEP2_QUESTIONS.floral;
    const [id, title, options] = questions[index];
    return { id, title, caption: "仕上がりの印象に近いものを選んでください。", options };
  }

  function step2OptionsWithOverride(branch, index, config) {
    const question = step2Options(branch, index);
    if (!question) return null;
    const override = getQuestionTextOverride(
      config,
      question.id === "Q8" ? "q8" : "step2",
      question.id,
      branch
    );
    return {
      ...question,
      title: override?.title || question.title,
      caption: question.caption,
      options: mergeOptionsWithOverride(question.options, override)
    };
  }

  async function initQuestionnaireStep2() {
    const config = await cacheActiveConfig();
    let state = readJson(SCORE_STATE_KEY, {});
    if (!state.axesAfterStep1) {
      state = { ...state, axesAfterStep1: initialAxes(config), branchKey: "floral" };
    }
    const branch = state.branchKey || "floral";
    const total = (STEP2_QUESTIONS[branch] || STEP2_QUESTIONS.floral).length;
    const answers = state.step2AnswerKeys || {};
    let current = 0;
    const optionList = $("option-list");
    const nextBtn = $("header-next-btn");
    const prevBtn = $("header-prev-btn");

    function render() {
      const question = step2OptionsWithOverride(branch, current, config);
      if (!question) return;
      setQuestionText(question);
      renderProgress(current + 1, total);
      if ($("step2-status")) $("step2-status").textContent = `現在の方向性: ${AXIS_LABELS[branch] || "フローラル"}`;
      if (optionList) {
        optionList.innerHTML = question.options.map(([key, label]) => `
          <button class="option-button ${answers[question.id] === key ? "is-selected" : ""}" type="button" data-answer-key="${key}">
            <span class="decor-icon">${key}</span>
            <span>${label}</span>
          </button>
        `).join("");
        optionList.querySelectorAll("[data-answer-key]").forEach((button) => {
          button.addEventListener("click", () => {
            answers[question.id] = button.dataset.answerKey;
            state.step2AnswerKeys = answers;
            writeJson(SCORE_STATE_KEY, state);
            render();
          });
        });
      }
      if (prevBtn) prevBtn.disabled = current === 0;
      const axes = calculateStep2(config, state, answers);
      renderMiniRadar(axes);
    }

    async function finish() {
      const finalAxes = calculateStep2(config, state, answers);
      const questionnaireResultCode = state.questionnaireResultCode || window.FragrancePublicData?.createCode?.("QR") || `QR${Date.now()}`;
      const nextState = {
        ...state,
        step2Answers: answers,
        step2AnswerKeys: answers,
        finalAxes,
        adjustedAxes: finalAxes,
        resetAxes: finalAxes,
        selectedFinish: answers.Q8 || "A",
        questionnaireResultCode,
        questionnaireCompletedAt: new Date().toISOString(),
        summaryHeadline: "あなたの香りバランス",
        summaryBody: "店頭でスタッフと調整しながら完成させます。"
      };
      writeJson(SCORE_STATE_KEY, nextState);
      const result = await window.FragrancePublicData?.createQuestionnaireResult?.(window.FragrancePublicData?.buildQuestionnaireResultPayload?.(nextState) || {
        result_code: questionnaireResultCode,
        step1_answers_json: nextState.step1Answers || {},
        step1_answer_keys_json: nextState.step1AnswerKeys || {},
        step2_answers_json: nextState.step2Answers || {},
        step2_answer_keys_json: nextState.step2AnswerKeys || {},
        branch_key: nextState.branchKey || null,
        axes_after_step1: nextState.axesAfterStep1 || null,
        axes_after_step2: nextState.axesAfterStep2 || finalAxes,
        final_axes: finalAxes,
        adjusted_axes: finalAxes,
        reset_axes: finalAxes,
        selected_finish: nextState.selectedFinish,
        summary_headline: nextState.summaryHeadline,
        summary_body: nextState.summaryBody
      });
      if (result?.id) {
        writeJson(SCORE_STATE_KEY, { ...nextState, questionnaireResultId: result.id, questionnaireResultCode: result.result_code || questionnaireResultCode });
      }
      window.location.href = "fragrance-graph.html";
    }

    prevBtn?.addEventListener("click", () => {
      current = Math.max(0, current - 1);
      render();
    });
    nextBtn?.addEventListener("click", async () => {
      const question = step2OptionsWithOverride(branch, current, config);
      if (!question) return;
      if (!answers[question.id]) answers[question.id] = question.options[0][0];
      if (current < total - 1) {
        current += 1;
        state.step2AnswerKeys = answers;
        writeJson(SCORE_STATE_KEY, state);
        render();
        return;
      }
      await finish();
    });
    $("questionnaire-sync-continue")?.addEventListener("click", () => { window.location.href = "fragrance-graph.html"; });
    $("questionnaire-sync-retry")?.addEventListener("click", finish);
    $("return-top-btn")?.addEventListener("click", () => { window.location.href = "../index.html"; });
    $("return-top-btn-mobile")?.addEventListener("click", () => { window.location.href = "../index.html"; });
    render();
  }

  function drawRadar(axes) {
    const svg = $("radar-graph");
    const shape = $("radar-shape");
    const dots = $("vertex-dots");
    const labels = $("axis-labels");
    const lines = $("axis-lines");
    const grids = $("grid-polygons");
    if (!svg || !shape) return;
    const center = 180;
    const maxRadius = 128;
    const values = AXES.map((axis) => clamp(axes?.[axis] ?? DEFAULT_AXES[axis]));
    const point = (value, index, radiusScale = 1) => {
      const angle = (-90 + index * 72) * Math.PI / 180;
      const radius = maxRadius * radiusScale * (value / 100);
      return [center + Math.cos(angle) * radius, center + Math.sin(angle) * radius];
    };
    shape.setAttribute("points", values.map((value, index) => point(value, index).join(",")).join(" "));
    if (dots) {
      dots.innerHTML = values.map((value, index) => {
        const [x, y] = point(value, index);
        return `<circle cx="${x}" cy="${y}" r="5"></circle>`;
      }).join("");
    }
    if (labels) {
      labels.innerHTML = AXES.map((axis, index) => {
        const [x, y] = point(100, index, 1.14);
        return `<text x="${x}" y="${y}">${AXIS_LABELS[axis]}</text>`;
      }).join("");
    }
    if (lines) {
      lines.innerHTML = AXES.map((_, index) => {
        const [x, y] = point(100, index, 1);
        return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}"></line>`;
      }).join("");
    }
    if (grids) {
      grids.innerHTML = [0.25, 0.5, 0.75, 1].map((scale) => {
        const pts = AXES.map((_, index) => {
          const angle = (-90 + index * 72) * Math.PI / 180;
          return `${center + Math.cos(angle) * maxRadius * scale},${center + Math.sin(angle) * maxRadius * scale}`;
        }).join(" ");
        return `<polygon points="${pts}"></polygon>`;
      }).join("");
    }
  }

  async function initGraph() {
    const state = readJson(SCORE_STATE_KEY, {});
    let axes = { ...DEFAULT_AXES, ...(state.adjustedAxes || state.finalAxes || {}) };
    const sliderList = $("slider-list");
    function renderSliders() {
      if (!sliderList) return;
      sliderList.innerHTML = AXES.map((axis) => `
        <label class="field">
          <span>${AXIS_LABELS[axis]} <output id="${axis}-value">${axes[axis]}</output></span>
          <input id="${axis}" name="${axis}" type="range" min="0" max="100" value="${axes[axis]}">
        </label>
      `).join("");
      AXES.forEach((axis) => {
        $(axis)?.addEventListener("input", (event) => {
          axes[axis] = clamp(event.target.value);
          const out = $(`${axis}-value`);
          if (out) out.textContent = axes[axis];
          drawRadar(axes);
        });
      });
    }
    function applyPreset(kind) {
      const presets = {
        A: { fresh: 70, floral: 48, woody: 38, spicy: 28, sweet: 42 },
        B: { floral: 62, sweet: 64, fresh: 48, woody: 44, spicy: 34 },
        C: { woody: 62, spicy: 58, floral: 46, fresh: 36, sweet: 50 }
      };
      axes = { ...axes, ...(presets[kind] || {}) };
      renderSliders();
      drawRadar(axes);
    }
    renderSliders();
    drawRadar(axes);
    $("reset-btn")?.addEventListener("click", () => {
      axes = { ...DEFAULT_AXES, ...(state.finalAxes || {}) };
      renderSliders();
      drawRadar(axes);
    });
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.addEventListener("click", () => applyPreset(button.dataset.preset));
    });
    $("reserve-link")?.addEventListener("click", async (event) => {
      event.preventDefault();
      const nextState = { ...readJson(SCORE_STATE_KEY, {}), adjustedAxes: axes, finalAxes: axes };
      writeJson(SCORE_STATE_KEY, nextState);
      writeJson(DRAFT_KEY, {
        axes,
        summaryHeadline: "あなたの香りバランス",
        summaryBody: "調整した内容をもとに、店頭で仕上げます。"
      });
      if (nextState.questionnaireResultId || nextState.questionnaireResultCode) {
        await window.FragrancePublicData?.updateQuestionnaireResult?.({
          id: nextState.questionnaireResultId,
          resultCode: nextState.questionnaireResultCode
        }, { adjusted_axes: axes, final_axes: axes, updated_at: new Date().toISOString() });
      }
      window.location.href = "reservation.html";
    });
  }

  async function initReservation() {
    const state = readJson(SCORE_STATE_KEY, {});
    const draft = readJson(DRAFT_KEY, {});
    const axes = { ...DEFAULT_AXES, ...(draft.axes || state.adjustedAxes || state.finalAxes || {}) };
    const slots = await window.FragrancePublicData?.fetchPublicReservationSlots?.() || [];
    const slotList = $("slot-list");
    const selectedStatus = $("selected-status");
    let selectedSlot = slots[0] || null;
    if ($("summary-headline")) $("summary-headline").textContent = draft.summaryHeadline || "香りの準備ができました";
    if ($("summary-body")) $("summary-body").textContent = draft.summaryBody || "日時を選んでワークショップを予約してください。";
    if ($("axis-list")) {
      $("axis-list").innerHTML = AXES.map((axis) => `<span class="pill">${AXIS_LABELS[axis]} ${axes[axis]}</span>`).join("");
    }
    function renderSlots() {
      if (!slotList) return;
      const source = slots.length ? slots : [
        { id: "", slot_label: "店頭確認", slot_date: "", slot_time: "", instructor_name: "", status: "open" }
      ];
      slotList.innerHTML = source.map((slot, index) => {
        const label = [slot.slot_date, String(slot.slot_time || "").slice(0, 5), slot.slot_label].filter(Boolean).join(" ");
        return `<button class="time-slot ${selectedSlot === slot || (!selectedSlot && index === 0) ? "selected" : ""}" type="button" data-slot-index="${index}">${label || "店頭で日時相談"}</button>`;
      }).join("");
      slotList.querySelectorAll("[data-slot-index]").forEach((button) => {
        button.addEventListener("click", () => {
          selectedSlot = source[Number(button.dataset.slotIndex)] || null;
          if (selectedStatus) selectedStatus.textContent = button.textContent;
          renderSlots();
        });
      });
      if (selectedStatus) selectedStatus.textContent = selectedSlot ? [selectedSlot.slot_date, String(selectedSlot.slot_time || "").slice(0, 5)].filter(Boolean).join(" ") : "店頭で日時相談";
    }
    renderSlots();
    $("slot-close")?.addEventListener("click", () => $("slot-modal")?.setAttribute("hidden", ""));
    $("confirm-btn")?.addEventListener("click", async () => {
      const synced = await window.FragrancePublicData?.syncQuestionnaireResultFromState?.(state);
      const payload = {
        questionnaire_result_id: synced?.id || state.questionnaireResultId || null,
        questionnaire_flow_status: synced?.id ? "linked" : (state.questionnaireCompletedAt ? "answered_unsaved" : "skipped"),
        questionnaire_sync_error: synced?.id ? null : (state.questionnaireCompletedAt ? "questionnaire_result_insert_failed" : null),
        slot_id: selectedSlot?.id || null,
        slot_label: selectedSlot ? [selectedSlot.slot_date, String(selectedSlot.slot_time || "").slice(0, 5)].filter(Boolean).join(" ") : "店頭で日時相談",
        visit_type: $("visit-type")?.value || "first",
        guest_count: $("guest-count")?.value || "1",
        staff_memo: $("staff-memo")?.value || "",
        summary_headline: draft.summaryHeadline || "あなたの香りバランス",
        summary_body: draft.summaryBody || "",
        profile_key: state.branchKey || null,
        axes,
        status: "confirmed"
      };
      const reservation = await window.FragrancePublicData?.createReservation?.(payload);
      if (reservation) {
        writeJson(CONFIRMATION_KEY, { ...payload, ...reservation });
        window.location.href = `reservation-complete.html?code=${encodeURIComponent(reservation.reservation_code || "")}`;
      } else if (selectedStatus) {
        selectedStatus.textContent = "予約を保存できませんでした。";
      }
    });
  }

  async function initComplete() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code") || readJson(CONFIRMATION_KEY, {}).reservation_code;
    const remote = await window.FragrancePublicData?.fetchReservationByCode?.(code);
    const data = remote || readJson(CONFIRMATION_KEY, {});
    if ($("reservation-slot")) $("reservation-slot").textContent = data.slot_label || "-";
    if ($("reservation-guests")) $("reservation-guests").textContent = data.guest_count || "-";
    if ($("reservation-visit-type")) $("reservation-visit-type").textContent = data.visit_type || "-";
    if ($("reservation-memo")) $("reservation-memo").textContent = data.staff_memo || "";
    if ($("detail-status-label")) $("detail-status-label").textContent = code ? `予約番号 ${code}` : "予約を受け付けました";
    $("detail-toggle")?.addEventListener("click", () => {
      const body = $("detail-body");
      if (!body) return;
      body.hidden = !body.hidden;
    });
    $("stay-here-btn")?.addEventListener("click", () => {
      const count = $("countdown-seconds");
      if (count) count.textContent = "停止";
    });
  }

  function initIndex() {
    const shape = $("shape");
    const dots = $("dots");
    const axisIds = ["floral", "fresh", "woody", "spicy", "sweet"];
    function update() {
      const values = axisIds.map((axis) => Number($(axis)?.value || 50));
      const points = values.map((value, index) => {
        const angle = (-90 + index * 72) * Math.PI / 180;
        const radius = 38 + value * 0.85;
        return [150 + Math.cos(angle) * radius, 150 + Math.sin(angle) * radius];
      });
      if (shape) shape.setAttribute("points", points.map((p) => p.join(",")).join(" "));
      if (dots) dots.innerHTML = points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"></circle>`).join("");
      axisIds.forEach((axis) => {
        const out = $(`${axis}-val`);
        if (out) out.textContent = $(axis)?.value || "";
      });
    }
    axisIds.forEach((axis) => $(axis)?.addEventListener("input", update));
    update();
    const toggle = document.querySelector(".menu-toggle");
    const menu = $("site-menu");
    toggle?.addEventListener("click", () => {
      const isOpen = menu?.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    menu?.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        const target = href ? document.querySelector(href) : null;
        if (!target) return;
        event.preventDefault();
        const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top, behavior: "smooth" });
        window.history.pushState(null, "", href);
        menu.classList.remove("is-open");
        toggle?.setAttribute("aria-expanded", "false");
      });
    });
  }

  function init() {
    const page = document.body?.dataset.page;
    if (page === "home") initIndex();
    if (page === "questionnaire") initQuestionnaireStep1();
    if (page === "questionnaire-step2") initQuestionnaireStep2();
    if (page === "graph") initGraph();
    if (page === "reservation") initReservation();
    if (page === "reservation-complete") initComplete();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
