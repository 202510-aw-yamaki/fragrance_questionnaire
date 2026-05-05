(function () {
  const AXIS_ORDER = window.FragranceMasterData.AXIS_ORDER;
  const AXIS_LABELS = window.FragranceMasterData.AXIS_LABELS;
  const STEP1_SCHEMA = window.FragranceMasterData.STEP1_QUESTION_SCHEMA;
  const STEP2_SCHEMA = window.FragranceMasterData.STEP2_QUESTION_SCHEMA;
  const Q8_SCHEMA = window.FragranceMasterData.Q8_SCHEMA;
  const branchSettingsMount = document.getElementById("scoring-branch-settings");
  const step1Mount = document.getElementById("scoring-step1-section");
  const step2Mount = document.getElementById("scoring-step2-section");
  const q8Mount = document.getElementById("scoring-q8-section");
  const finishMount = document.getElementById("scoring-finish-section");
  const overviewMount = document.getElementById("scoring-sections");
  const questionListMount = document.getElementById("scoring-question-list");
  const scoringJson = document.getElementById("scoring-json");
  const scoringStatus = document.getElementById("scoring-status");
  const activeVersionEl = document.getElementById("active-version");
  const activeNoteEl = document.getElementById("active-note");
  const activeUpdatedEl = document.getElementById("active-updated");
  const exportButtons = Array.from(document.querySelectorAll("[data-scoring-export]"));
  const importTriggerButtons = Array.from(document.querySelectorAll("[data-scoring-import-trigger]"));
  const importInput = document.getElementById("scoring-import-json");
  const questionStepTabs = Array.from(document.querySelectorAll("[data-question-step-tab]"));
  const questionBranchTabsMount = document.getElementById("scoring-branch-tabs");
  const questionBranchTabs = Array.from(document.querySelectorAll("[data-question-branch-tab]"));
  let activeConfigRow = null;
  let workingConfig = window.FragranceMasterData.createDefaultScoringConfig();
  let draftHasUnsavedChanges = false;
  let questionModalSnapshot = "";
  let activeQuestionStep = "step1";
  let activeQuestionBranch = "floral";
  let activeQuestionSelection = null;
  ensureScoringModals();
  syncStaticScoringCopy();

  const BRANCH_LABELS = {
    floral: "Bloom / floral",
    fresh: "Air / fresh",
    woody: "Deep / woody"
  };

  const BRANCH_SHORT_LABELS = {
    floral: "Floral",
    fresh: "Fresh",
    woody: "Woody"
  };

  const AXIS_SHORT_LABELS = {
    floral: "Fl",
    fresh: "Fr",
    woody: "Wo",
    spicy: "Sp",
    sweet: "Sw"
  };

  function cloneConfig(config) {
    return window.FragranceMasterData.getCompatibleScoringConfig(config);
  }

  function updateStatus(message) {
    if (scoringStatus) scoringStatus.textContent = message;
  }

  function markDraftDirty() {
    draftHasUnsavedChanges = true;
  }

  function clearDraftDirty() {
    draftHasUnsavedChanges = false;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function ensureScoringModals() {
    if (!document.getElementById("scoring-question-modal")) {
      document.body.insertAdjacentHTML("beforeend", `
        <div class="portal-scoring-modal" id="scoring-question-modal" hidden>
          <div class="portal-scoring-modal-backdrop" data-scoring-question-close></div>
          <section class="admin-panel portal-scoring-modal-card portal-scoring-question-modal-card" role="dialog" aria-modal="true" aria-labelledby="scoring-question-modal-title">
            <div class="portal-scoring-modal-head">
              <div>
                <p class="portal-hero-label">QUESTION EDIT</p>
                <h2 id="scoring-question-modal-title">設問編集</h2>
              </div>
              <button class="admin-btn secondary portal-scoring-modal-close" data-scoring-question-close type="button">閉じる</button>
            </div>
            <form class="admin-form portal-scoring-question-form" id="scoring-question-form">
              <input id="scoring-question-kind" type="hidden">
              <input id="scoring-question-branch" type="hidden">
              <input id="scoring-question-id" type="hidden">
              <label class="portal-scoring-modal-field">設問文
                <input id="scoring-question-title-input" type="text">
              </label>
              <div class="portal-scoring-answer-editor" id="scoring-question-answer-editor"></div>
              <div class="admin-actions portal-scoring-modal-actions">
                <button class="admin-btn secondary" data-scoring-question-close type="button">キャンセル</button>
                <button class="admin-btn primary" type="submit">設問を保存</button>
              </div>
            </form>
          </section>
        </div>
      `);
    }

    if (!document.getElementById("scoring-save-modal")) {
      document.body.insertAdjacentHTML("beforeend", `
        <div class="portal-scoring-modal" id="scoring-save-modal" hidden>
          <div class="portal-scoring-modal-backdrop" data-scoring-save-close></div>
          <section class="admin-panel portal-scoring-modal-card portal-scoring-save-modal-card" role="dialog" aria-modal="true" aria-labelledby="scoring-save-modal-title">
            <div class="portal-scoring-modal-head">
              <div>
                <p class="portal-hero-label">VERSION MEMO</p>
                <h2 id="scoring-save-modal-title">保存メモ</h2>
              </div>
              <button class="admin-btn secondary portal-scoring-modal-close" data-scoring-save-close type="button">閉じる</button>
            </div>
            <form class="admin-form portal-scoring-save-modal-form" id="scoring-save-modal-form">
              <label class="portal-scoring-modal-field">version メモ
                <input id="scoring-note-modal" type="text" placeholder="例: spring update">
              </label>
              <div class="admin-actions portal-scoring-modal-actions">
                <button class="admin-btn secondary" data-scoring-save-close type="button">キャンセル</button>
                <button class="admin-btn primary" type="submit">新 version を保存</button>
              </div>
            </form>
          </section>
        </div>
      `);
    }

    const legacyNote = document.getElementById("scoring-note");
    if (legacyNote?.closest("label")) legacyNote.closest("label").classList.add("portal-scoring-hidden-note-field");
  }

  function syncStaticScoringCopy(explanation = document.querySelector(".portal-scoring-explanation")) {
    if (!explanation) return;
    const copyElement = explanation.querySelector(".portal-scoring-explanation-copy") || explanation.querySelector(":scope > p");
    if (!copyElement) return;
    copyElement.classList.add("portal-scoring-explanation-copy");
    copyElement.textContent = [
      "finishTemplates は、",
      "Q8 の回答ごとに用意された「仕上がりの理想プロファイル」です。",
      "A「軽やか」→ Fresh 高め / B「やわらか」→ Floral / Sweet 高め / C「印象」→ Woody / Spicy / Sweet 高めという 5軸の目標形が定義されています。",
      "最終軸 = Q8 delta反映後の値 × （1-finish値） + finishTemplate × fnish値 となります。これは「Q8で選ばれた“仕上がり印象”の目標形」を「印象付けたい方向へと補正」するための値です。"
    ].join("\n");
    explanation.querySelectorAll(":scope > h2, :scope > p:not(.portal-scoring-explanation-copy)").forEach((node) => {
      node.remove();
    });
  }

  function setModalOpen(modal, isOpen) {
    if (!modal) return;
    modal.hidden = !isOpen;
    document.body.classList.toggle("portal-scoring-modal-open", isOpen);
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

  function ensureQuestionTextOverrides() {
    if (!workingConfig.questionTextOverrides) workingConfig.questionTextOverrides = {};
    if (!workingConfig.questionTextOverrides.step1) workingConfig.questionTextOverrides.step1 = {};
    if (!workingConfig.questionTextOverrides.step2) workingConfig.questionTextOverrides.step2 = {};
    Object.keys(BRANCH_LABELS).forEach((branchKey) => {
      if (!workingConfig.questionTextOverrides.step2[branchKey]) {
        workingConfig.questionTextOverrides.step2[branchKey] = {};
      }
    });
    if (!workingConfig.questionTextOverrides.q8) workingConfig.questionTextOverrides.q8 = {};
    return workingConfig.questionTextOverrides;
  }

  function setQuestionTextOverride(kind, questionId, branch, title, answers) {
    const overrides = ensureQuestionTextOverrides();
    const payload = { title, answers };
    if (kind === "step2") {
      overrides.step2[branch][questionId] = payload;
    } else if (kind === "q8") {
      overrides.q8[questionId] = payload;
    } else {
      overrides.step1[questionId] = payload;
    }
  }

  function clearQuestionTextOverride(kind, questionId, branch) {
    const overrides = ensureQuestionTextOverrides();
    if (kind === "step2") {
      delete overrides.step2[branch][questionId];
    } else if (kind === "q8") {
      delete overrides.q8[questionId];
    } else {
      delete overrides.step1[questionId];
    }
  }

  function getEditableQuestionSchema(schema, kind, branch) {
    const override = getQuestionTextOverride(workingConfig, kind, schema.id, branch);
    return {
      ...schema,
      title: override?.title || schema.title,
      answers: {
        ...schema.answers,
        ...(override?.answers || {})
      }
    };
  }

  function getQuestionSourceSchema(kind, questionId, branch) {
    if (kind === "step2") return (STEP2_SCHEMA[branch] || []).find((schema) => schema.id === questionId) || null;
    if (kind === "q8") return Q8_SCHEMA.id === questionId ? Q8_SCHEMA : null;
    return STEP1_SCHEMA.find((schema) => schema.id === questionId) || null;
  }

  function getQuestionScoreValue(kind, questionId, answerKey, axis, branch) {
    if (kind === "step2") return workingConfig.step2ScoreMap?.[branch]?.[questionId]?.[answerKey]?.[axis];
    if (kind === "q8") return workingConfig.q8ScoreMap?.[answerKey]?.[axis];
    return workingConfig.step1ScoreMap?.[questionId]?.[answerKey]?.[axis];
  }

  function getQuestionAnchorId(kind, questionId, branch = "") {
    return `scoring-card-${kind}-${branch || "main"}-${questionId}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  function getQuestionListItems(step = activeQuestionStep) {
    if (step === "step2") {
      const schemaList = STEP2_SCHEMA[activeQuestionBranch] || [];
      const branchItems = schemaList.map((schema) => ({
        kind: "step2",
        branch: activeQuestionBranch,
        schema,
        displayText: `${schema.id} ${BRANCH_SHORT_LABELS[activeQuestionBranch] || activeQuestionBranch}`
      }));
      return branchItems.concat([{ kind: "q8", schema: Q8_SCHEMA, displayText: "Q8 共通" }]);
    }
    return STEP1_SCHEMA.map((schema) => ({ kind: "step1", schema, displayText: schema.id }));
  }

  function renderQuestionList() {
    if (!questionListMount) return;
    if (questionBranchTabsMount) questionBranchTabsMount.hidden = activeQuestionStep !== "step2";
    questionStepTabs.forEach((button) => {
      const isActive = button.dataset.questionStepTab === activeQuestionStep;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
    questionBranchTabs.forEach((button) => {
      const isActive = button.dataset.questionBranchTab === activeQuestionBranch;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
    questionListMount.innerHTML = getQuestionListItems().map((item) => {
      const anchorId = getQuestionAnchorId(item.kind, item.schema.id, item.branch);
      const isActive = activeQuestionSelection && activeQuestionSelection.anchorId === anchorId;
      return `
        <button
          class="question-link${isActive ? " is-active" : ""}"
          type="button"
          data-question-kind="${escapeHtml(item.kind)}"
          data-question-id="${escapeHtml(item.schema.id)}"
          data-question-branch="${escapeHtml(item.branch || "")}"
          data-question-target="${escapeHtml(anchorId)}"
        >
          ${escapeHtml(item.displayText || item.schema.id)}
        </button>
      `;
    }).join("");
  }

  function bindQuestionList() {
    if (!questionListMount) return;
    questionStepTabs.forEach((button) => {
      button.onclick = () => {
        activeQuestionStep = button.dataset.questionStepTab || "step1";
        activeQuestionSelection = null;
        renderSelectedQuestionArea();
        renderQuestionList();
        bindQuestionList();
      };
    });
    questionBranchTabs.forEach((button) => {
      button.onclick = () => {
        activeQuestionBranch = button.dataset.questionBranchTab || "floral";
        activeQuestionSelection = null;
        renderSelectedQuestionArea();
        renderQuestionList();
        bindQuestionList();
      };
    });
    questionListMount.querySelectorAll("[data-question-target]").forEach((button) => {
      button.addEventListener("click", () => {
        activeQuestionSelection = {
          kind: button.dataset.questionKind,
          questionId: button.dataset.questionId,
          branch: button.dataset.questionBranch || "",
          anchorId: button.dataset.questionTarget
        };
        renderSelectedQuestionArea();
        bindEditorInputs();
        renderQuestionList();
        bindQuestionList();
      });
    });
  }

  function ensureQuestionScoreTarget(kind, questionId, answerKey, branch) {
    if (kind === "step2") {
      if (!workingConfig.step2ScoreMap[branch]) workingConfig.step2ScoreMap[branch] = {};
      if (!workingConfig.step2ScoreMap[branch][questionId]) workingConfig.step2ScoreMap[branch][questionId] = {};
      if (!workingConfig.step2ScoreMap[branch][questionId][answerKey]) workingConfig.step2ScoreMap[branch][questionId][answerKey] = {};
      return workingConfig.step2ScoreMap[branch][questionId][answerKey];
    }
    if (kind === "q8") {
      if (!workingConfig.q8ScoreMap[answerKey]) workingConfig.q8ScoreMap[answerKey] = {};
      return workingConfig.q8ScoreMap[answerKey];
    }
    if (!workingConfig.step1ScoreMap[questionId]) workingConfig.step1ScoreMap[questionId] = {};
    if (!workingConfig.step1ScoreMap[questionId][answerKey]) workingConfig.step1ScoreMap[questionId][answerKey] = {};
    return workingConfig.step1ScoreMap[questionId][answerKey];
  }

  function renderQuestionScoreHeader() {
    return AXIS_ORDER.map((axis) => {
      return `<span class="portal-scoring-score-axis" title="${escapeHtml(AXIS_LABELS[axis])}">${AXIS_SHORT_LABELS[axis]}</span>`;
    }).join("");
  }

  function renderQuestionScoreCells(kind, questionId, answerKey, branch) {
    return AXIS_ORDER.map((axis) => {
      const value = Number(getQuestionScoreValue(kind, questionId, answerKey, axis, branch) || 0);
      return `<span class="portal-scoring-score-value">${value}</span>`;
    }).join("");
  }

  function renderNumberStepper(inputMarkup) {
    return `
      <div class="portal-scoring-number-stepper">
        <button type="button" data-stepper-delta="-1" aria-label="値を下げる">-</button>
        ${inputMarkup}
        <button type="button" data-stepper-delta="1" aria-label="値を上げる">+</button>
      </div>
    `;
  }

  function refreshJsonPreview() {
    scoringJson.value = JSON.stringify(workingConfig, null, 2);
  }

  function renderOverview(config) {
    if (!overviewMount) return;
    const sections = [
      ["初期値 / 重み", { initialAxisScore: config.initialAxisScore, questionWeights: config.questionWeights, finishBlendRatio: config.finishBlendRatio }],
      ["STEP1 配点", { step1PrimaryAxes: config.step1PrimaryAxes, step1ScoreMap: config.step1ScoreMap }],
      ["branchTemplates", { branchTemplates: config.branchTemplates, branchDistanceWeights: config.branchDistanceWeights }],
      ["STEP2 配点", { step2PrimaryAxes: config.step2PrimaryAxes, step2ScoreMap: config.step2ScoreMap }],
      ["Q8 / finishTemplates", { q8PrimaryAxes: config.q8PrimaryAxes, q8ScoreMap: config.q8ScoreMap, finishKeyByAnswer: config.finishKeyByAnswer, finishTemplates: config.finishTemplates }],
      ["summaryProfiles", { summaryProfiles: config.summaryProfiles }]
    ];
    overviewMount.innerHTML = "";
    sections.forEach(([title, payload]) => {
      const card = document.createElement("section");
      card.className = "admin-panel admin-panel-soft portal-config-preview-card";
      card.innerHTML = `<h3>${title}</h3><pre style="white-space:pre-wrap;margin:0;">${JSON.stringify(payload, null, 2)}</pre>`;
      overviewMount.appendChild(card);
    });
  }

  function renderSimpleFieldCard() {
    return `
      <section class="admin-editor-card portal-scoring-panel-card portal-scoring-basic-card">
        <div class="admin-card-head">
          <div>
            <h3>基本設定</h3>
            <p class="admin-note">重みとブレンド比率</p>
          </div>
        </div>
        <div class="admin-grid cols-4">
          <label class="portal-scoring-basic-field"><span class="portal-scoring-basic-label">STEP1</span>${renderNumberStepper(`<input data-config-field="questionWeights.step1" type="number" step="0.1" value="${Number(workingConfig.questionWeights?.step1 || 1)}">`)}</label>
          <label class="portal-scoring-basic-field"><span class="portal-scoring-basic-label">STEP2</span>${renderNumberStepper(`<input data-config-field="questionWeights.step2" type="number" step="0.1" value="${Number(workingConfig.questionWeights?.step2 || 2)}">`)}</label>
          <label class="portal-scoring-basic-field"><span class="portal-scoring-basic-label">STEP3</span>${renderNumberStepper(`<input data-config-field="questionWeights.finish" type="number" step="0.1" value="${Number(workingConfig.questionWeights?.finish || 3)}">`)}</label>
          <label class="portal-scoring-basic-field"><span class="portal-scoring-basic-label">finish</span>${renderNumberStepper(`<input data-config-field="finishBlendRatio" type="number" step="0.01" min="0" max="1" value="${Number(workingConfig.finishBlendRatio || 0.25)}">`)}</label>
        </div>
      </section>
    `;
  }

  function renderBranchTemplateCard() {
    return `
      <section class="admin-editor-card portal-scoring-panel-card">
        <div class="admin-card-head">
          <div>
            <h3>分岐テンプレート</h3>
            <p class="admin-note">Bloom / floral、Air / fresh、Deep / woody の基準値です。</p>
          </div>
        </div>
        <div class="portal-scoring-branch-grid">
          ${Object.entries(BRANCH_LABELS).map(([branchKey, label]) => {
            return `
              <article class="admin-panel admin-panel-soft portal-scoring-branch-card">
                <h4>${label}</h4>
                <div class="admin-axis-edit-grid">
                  ${AXIS_ORDER.map((axis) => {
                    return `<label>${AXIS_LABELS[axis]}${renderNumberStepper(`<input data-branch-template="${branchKey}" data-axis="${axis}" type="number" step="1" value="${Number(workingConfig.branchTemplates?.[branchKey]?.[axis] || 0)}">`)}</label>`;
                  }).join("")}
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderBranchWeightCard() {
    return `
      <section class="admin-editor-card portal-scoring-panel-card portal-scoring-weight-card">
        <div class="admin-card-head">
          <div>
            <h3>距離重み</h3>
            <p class="admin-note">5軸を横並びで確認する帯状レイアウト。</p>
          </div>
        </div>
        <div class="portal-scoring-weight-grid">
          ${AXIS_ORDER.map((axis) => {
            return `<label class="portal-scoring-weight-pill">${AXIS_LABELS[axis]}${renderNumberStepper(`<input data-branch-weight-axis="${axis}" type="number" step="0.1" value="${Number(workingConfig.branchDistanceWeights?.[axis] || 1)}">`)}</label>`;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderMatrixQuestionCard(schema, resolveValue, attributes, options = {}) {
    const editableSchema = getEditableQuestionSchema(schema, attributes.kind, attributes.branch);
    const branchAttribute = attributes.branch ? ` data-branch="${escapeHtml(attributes.branch)}"` : "";
    const anchorId = getQuestionAnchorId(attributes.kind, schema.id, attributes.branch);
    const answerRows = Object.entries(editableSchema.answers).map(([answerKey, answerLabel]) => {
      return `
        <div class="portal-scoring-score-row">
          <strong>${escapeHtml(answerKey)}</strong>
          <span class="portal-scoring-score-answer">${escapeHtml(answerLabel)}</span>
          ${renderQuestionScoreCells(attributes.kind, schema.id, answerKey, attributes.branch)}
        </div>
      `;
    }).join("");
    return `
      <article class="admin-editor-card portal-scoring-question-card" id="${escapeHtml(anchorId)}">
        <div class="admin-card-head portal-scoring-question-card-head">
          <div>
            <h3>${escapeHtml(editableSchema.title)}</h3>
          </div>
          <button
            class="admin-btn secondary portal-scoring-question-edit"
            type="button"
            data-question-edit
            data-question-kind="${escapeHtml(attributes.kind)}"
            data-question-id="${escapeHtml(schema.id)}"
            ${branchAttribute}
          >編集</button>
        </div>
        <div class="portal-scoring-question-summary">
          <div class="portal-scoring-score-table" aria-label="current point settings">
            <div class="portal-scoring-score-row portal-scoring-score-head">
              <span></span>
              <span></span>
              ${renderQuestionScoreHeader()}
            </div>
            ${answerRows}
          </div>
        </div>
      </article>
    `;
  }

  function renderFinishTemplateCard() {
    const finishRows = [
      { key: "A", label: "A 軽やか" },
      { key: "B", label: "B やわらか" },
      { key: "C", label: "C 印象強め" },
      { key: "ALL", label: "ALL 平均" }
    ];
    return `
      <section class="admin-editor-card portal-scoring-panel-card">
        <div class="admin-card-head">
          <div>
            <h3>finish template</h3>
            <p class="admin-note">Q8 の回答に応じて仕上がりを寄せる目標値です。</p>
          </div>
        </div>
        <article class="admin-panel admin-panel-soft portal-scoring-finish-table">
          <div class="admin-matrix">
            <div class="admin-matrix-row admin-matrix-head">
              <div>テンプレート</div>
              ${AXIS_ORDER.map((axis) => `<div>${AXIS_LABELS[axis]}</div>`).join("")}
            </div>
            ${finishRows.map((row) => {
              return `
                <div class="admin-matrix-row">
                  <div class="admin-answer-cell"><strong>${row.key}</strong><span>${row.label}</span></div>
                  ${AXIS_ORDER.map((axis) => {
                    return `
                      <div>
                        ${renderNumberStepper(`<input
                          type="number"
                          step="1"
                          value="${Number(workingConfig.finishTemplates?.[row.key]?.[axis] || 0)}"
                          data-finish-template="${row.key}"
                          data-axis="${axis}"
                        >`)}
                      </div>
                    `;
                  }).join("")}
                </div>
              `;
            }).join("")}
          </div>
        </article>
      </section>
    `;
  }

  function renderBranchSettingsArea() {
    if (!branchSettingsMount) return;
    branchSettingsMount.innerHTML = `
      <div class="admin-scoring-config-strip">
        <details>
          <summary>基本設定</summary>
          ${renderSimpleFieldCard()}
        </details>
        <details>
          <summary>分岐テンプレート</summary>
          <div class="portal-scoring-branch-layout">
            <div class="portal-scoring-branch-shell-main">${renderBranchTemplateCard()}</div>
            <div class="portal-scoring-branch-weight-wrap">${renderBranchWeightCard()}</div>
          </div>
        </details>
        <details>
          <summary>仕上げテンプレート</summary>
          ${renderFinishTemplateCard()}
        </details>
      </div>
    `;
  }

  function renderStep1Area() {
    if (!step1Mount) return;
    step1Mount.innerHTML = STEP1_SCHEMA.map((schema) => {
      return renderMatrixQuestionCard(
        schema,
        (questionId, answerKey, axis) => workingConfig.step1ScoreMap?.[questionId]?.[answerKey]?.[axis],
        { kind: "step1" },
        { textEditable: true }
      );
    }).join("");
  }

  function renderStep2Area() {
    if (!step2Mount) return;
    step2Mount.innerHTML = Object.entries(STEP2_SCHEMA).map(([branchKey, schemaList]) => {
      return `
        <section class="admin-editor-card portal-scoring-panel-card portal-scoring-step2-group">
          <div class="admin-card-head">
            <div>
              <h3>${BRANCH_LABELS[branchKey]} の STEP2 配点</h3>
            </div>
          </div>
          ${schemaList.map((schema) => {
            return renderMatrixQuestionCard(
              schema,
              (questionId, answerKey, axis, branch) => workingConfig.step2ScoreMap?.[branch]?.[questionId]?.[answerKey]?.[axis],
              { kind: "step2", branch: branchKey },
              { textEditable: true }
            );
          }).join("")}
        </section>
      `;
    }).join("");
  }

  function renderQ8Area() {
    if (!q8Mount) return;
    q8Mount.innerHTML = renderMatrixQuestionCard(
      Q8_SCHEMA,
      (questionId, answerKey, axis) => workingConfig.q8ScoreMap?.[answerKey]?.[axis],
      { kind: "q8" },
      { textEditable: true }
    );
  }

  function renderFinishArea() {
    if (!finishMount) return;
    const explanation = document.querySelector(".portal-scoring-explanation");
    syncStaticScoringCopy(explanation);
    finishMount.innerHTML = renderFinishTemplateCard();
    const finishCard = finishMount.querySelector(".portal-scoring-panel-card");
    if (finishCard && explanation) finishCard.appendChild(explanation);
  }

  function clearSelectedQuestionMounts() {
    [step1Mount, step2Mount, q8Mount, finishMount].forEach((mount) => {
      if (mount) mount.innerHTML = "";
    });
  }

  function renderSelectedQuestionArea() {
    clearSelectedQuestionMounts();
    if (!activeQuestionSelection) {
      if (step1Mount) {
        step1Mount.innerHTML = `<div class="admin-scoring-empty-state">左の質問一覧から編集する設問を選択してください。</div>`;
      }
      return;
    }
    const { kind, questionId, branch } = activeQuestionSelection;
    const schema = getQuestionSourceSchema(kind, questionId, branch);
    if (!schema) return;
    if (kind === "step2") {
      step2Mount.innerHTML = renderMatrixQuestionCard(
        schema,
        (resolvedQuestionId, answerKey, axis, resolvedBranch) => workingConfig.step2ScoreMap?.[resolvedBranch]?.[resolvedQuestionId]?.[answerKey]?.[axis],
        { kind: "step2", branch },
        { textEditable: true }
      );
      return;
    }
    if (kind === "q8") {
      q8Mount.innerHTML = renderMatrixQuestionCard(
        schema,
        (resolvedQuestionId, answerKey, axis) => workingConfig.q8ScoreMap?.[answerKey]?.[axis],
        { kind: "q8" },
        { textEditable: true }
      );
      return;
    }
    step1Mount.innerHTML = renderMatrixQuestionCard(
      schema,
      (resolvedQuestionId, answerKey, axis) => workingConfig.step1ScoreMap?.[resolvedQuestionId]?.[answerKey]?.[axis],
      { kind: "step1" },
      { textEditable: true }
    );
  }

  function renderEditor() {
    renderBranchSettingsArea();
    renderSelectedQuestionArea();
    bindEditorInputs();
    renderQuestionList();
    bindQuestionList();
  }

  function setNestedNumber(path, value) {
    const parts = path.split(".");
    let target = workingConfig;
    while (parts.length > 1) {
      const key = parts.shift();
      if (!target[key]) target[key] = {};
      target = target[key];
    }
    target[parts[0]] = Number(value);
    refreshJsonPreview();
    renderOverview(workingConfig);
    markDraftDirty();
  }

  function bindEditorInputs() {
    document.querySelectorAll("[data-config-field]").forEach((input) => {
      input.addEventListener("input", () => {
        setNestedNumber(input.dataset.configField, input.value);
      });
    });
    document.querySelectorAll("[data-branch-template]").forEach((input) => {
      input.addEventListener("input", () => {
        const branchKey = input.dataset.branchTemplate;
        const axis = input.dataset.axis;
        workingConfig.branchTemplates[branchKey][axis] = Number(input.value || 0);
        refreshJsonPreview();
        renderOverview(workingConfig);
        markDraftDirty();
      });
    });
    document.querySelectorAll("[data-branch-weight-axis]").forEach((input) => {
      input.addEventListener("input", () => {
        workingConfig.branchDistanceWeights[input.dataset.branchWeightAxis] = Number(input.value || 0);
        refreshJsonPreview();
        renderOverview(workingConfig);
        markDraftDirty();
      });
    });
    document.querySelectorAll("[data-matrix-kind]").forEach((input) => {
      input.addEventListener("input", () => {
        const kind = input.dataset.matrixKind;
        const questionId = input.dataset.question;
        const answerKey = input.dataset.answer;
        const axis = input.dataset.axis;
        const value = Number(input.value || 0);
        if (kind === "step1") {
          workingConfig.step1ScoreMap[questionId][answerKey][axis] = value;
        } else if (kind === "step2") {
          workingConfig.step2ScoreMap[input.dataset.branch][questionId][answerKey][axis] = value;
        } else if (kind === "q8") {
          workingConfig.q8ScoreMap[answerKey][axis] = value;
        }
        refreshJsonPreview();
        renderOverview(workingConfig);
        markDraftDirty();
      });
    });
    document.querySelectorAll("[data-finish-template]").forEach((input) => {
      input.addEventListener("input", () => {
        const templateKey = input.dataset.finishTemplate;
        const axis = input.dataset.axis;
        workingConfig.finishTemplates[templateKey][axis] = Number(input.value || 0);
        if (templateKey !== "ALL") {
          workingConfig.graphPresets[templateKey][axis] = Number(input.value || 0);
        }
        refreshJsonPreview();
        renderOverview(workingConfig);
        markDraftDirty();
      });
    });
    document.querySelectorAll("[data-question-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        openQuestionModal(button.dataset.questionKind, button.dataset.questionId, button.dataset.branch || "");
      });
    });
  }

  function openQuestionModal(kind, questionId, branch) {
    const schema = getQuestionSourceSchema(kind, questionId, branch);
    if (!schema) return;
    const editableSchema = getEditableQuestionSchema(schema, kind, branch);
    const modal = document.getElementById("scoring-question-modal");
    const editor = document.getElementById("scoring-question-answer-editor");
    const titleInput = document.getElementById("scoring-question-title-input");
    document.getElementById("scoring-question-kind").value = kind;
    document.getElementById("scoring-question-branch").value = branch || "";
    document.getElementById("scoring-question-id").value = questionId;
    document.getElementById("scoring-question-modal-title").textContent = `${editableSchema.id} 設問編集`;
    titleInput.value = editableSchema.title || "";
    editor.innerHTML = `
      <div class="portal-scoring-answer-row portal-scoring-answer-row-head">
        <div>回答</div>
        ${AXIS_ORDER.map((axis) => `<div>${escapeHtml(AXIS_LABELS[axis])}</div>`).join("")}
      </div>
      ${Object.entries(editableSchema.answers).map(([answerKey, answerLabel]) => {
        return `
          <div class="portal-scoring-answer-row" data-answer-row="${escapeHtml(answerKey)}">
            <label class="portal-scoring-answer-label">
              <span>${escapeHtml(answerKey)}</span>
              <input data-answer-label type="text" value="${escapeHtml(answerLabel)}">
            </label>
            ${AXIS_ORDER.map((axis) => {
              const value = Number(getQuestionScoreValue(kind, questionId, answerKey, axis, branch) || 0);
              return `
                <label class="portal-scoring-axis-field">
                  <span>${escapeHtml(AXIS_LABELS[axis])}</span>
                  ${renderNumberStepper(`<input data-answer-axis="${escapeHtml(axis)}" type="number" step="1" value="${value}" inputmode="numeric">`)}
                </label>
              `;
            }).join("")}
          </div>
        `;
      }).join("")}
    `;
    setModalOpen(modal, true);
    questionModalSnapshot = getQuestionModalSnapshot();
    window.requestAnimationFrame(() => titleInput.focus());
  }

  function getQuestionModalSnapshot() {
    const modal = document.getElementById("scoring-question-modal");
    if (!modal || modal.hidden) return "";
    const payload = {
      kind: document.getElementById("scoring-question-kind").value,
      branch: document.getElementById("scoring-question-branch").value,
      questionId: document.getElementById("scoring-question-id").value,
      title: document.getElementById("scoring-question-title-input").value,
      answers: Array.from(document.querySelectorAll("#scoring-question-answer-editor [data-answer-row]")).map((row) => {
        return {
          answerKey: row.dataset.answerRow,
          label: row.querySelector("[data-answer-label]")?.value || "",
          axes: AXIS_ORDER.map((axis) => {
            return [axis, row.querySelector(`[data-answer-axis="${axis}"]`)?.value || ""];
          })
        };
      })
    };
    return JSON.stringify(payload);
  }

  function hasUnsavedQuestionModalChanges() {
    return Boolean(questionModalSnapshot && questionModalSnapshot !== getQuestionModalSnapshot());
  }

  function closeQuestionModal(force = false) {
    if (!force && hasUnsavedQuestionModalChanges() && !window.confirm("編集中の内容が保存されていません。閉じますか？")) {
      return false;
    }
    setModalOpen(document.getElementById("scoring-question-modal"), false);
    questionModalSnapshot = "";
    return true;
  }

  function saveQuestionModal() {
    const kind = document.getElementById("scoring-question-kind").value;
    const branch = document.getElementById("scoring-question-branch").value;
    const questionId = document.getElementById("scoring-question-id").value;
    const schema = getQuestionSourceSchema(kind, questionId, branch);
    if (!schema) return;
    const title = document.getElementById("scoring-question-title-input").value.trim() || schema.title;
    const answers = {};
    let hasTextOverride = title !== schema.title;
    document.querySelectorAll("#scoring-question-answer-editor [data-answer-row]").forEach((row) => {
      const answerKey = row.dataset.answerRow;
      const originalAnswer = schema.answers?.[answerKey] || "";
      const labelInput = row.querySelector("[data-answer-label]");
      const nextAnswer = labelInput.value.trim() || originalAnswer;
      answers[answerKey] = nextAnswer;
      if (nextAnswer !== originalAnswer) hasTextOverride = true;
      const scoreTarget = ensureQuestionScoreTarget(kind, questionId, answerKey, branch);
      AXIS_ORDER.forEach((axis) => {
        const input = row.querySelector(`[data-answer-axis="${axis}"]`);
        scoreTarget[axis] = Number(input?.value || 0);
      });
    });
    if (hasTextOverride) {
      setQuestionTextOverride(kind, questionId, branch, title, answers);
    } else {
      clearQuestionTextOverride(kind, questionId, branch);
    }
    refreshJsonPreview();
    renderOverview(workingConfig);
    renderEditor();
    markDraftDirty();
    closeQuestionModal(true);
    updateStatus("設問内容を更新しました。");
  }

  function openSaveModal() {
    const legacyNote = document.getElementById("scoring-note");
    const modalNote = document.getElementById("scoring-note-modal");
    modalNote.value = legacyNote?.value || "";
    setModalOpen(document.getElementById("scoring-save-modal"), true);
    window.requestAnimationFrame(() => modalNote.focus());
  }

  function closeSaveModal() {
    setModalOpen(document.getElementById("scoring-save-modal"), false);
  }

  function getNumberPrecision(input) {
    const step = String(input.getAttribute("step") || "1");
    const decimal = step.includes(".") ? step.split(".")[1] : "";
    return decimal.length;
  }

  function stepNumberInput(button) {
    const stepper = button.closest(".portal-scoring-number-stepper");
    const input = stepper?.querySelector("input[type='number']");
    if (!input) return;
    const step = Number(input.getAttribute("step") || 1) || 1;
    const delta = Number(button.dataset.stepperDelta || 0);
    const min = input.hasAttribute("min") ? Number(input.getAttribute("min")) : Number.NEGATIVE_INFINITY;
    const max = input.hasAttribute("max") ? Number(input.getAttribute("max")) : Number.POSITIVE_INFINITY;
    const current = input.value === "" ? 0 : Number(input.value);
    const precision = getNumberPrecision(input);
    const nextValue = Math.min(max, Math.max(min, current + (step * delta)));
    input.value = precision ? nextValue.toFixed(precision) : String(Math.round(nextValue));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function hasPendingScoringEdits() {
    return draftHasUnsavedChanges || hasUnsavedQuestionModalChanges();
  }

  async function saveScoringConfig(note) {
    const latestRows = await window.AdminData.listRows("scoring_configs", {
      orders: [{ column: "version", ascending: false }],
      limit: 1
    }).catch(() => []);
    const latestVersion = Math.max(Number(latestRows[0]?.version || 0), Number(activeConfigRow?.version || 0));
    const nextVersion = latestVersion + 1;
    const savedAt = new Date().toISOString();
    let previousActiveRows = [];
    try {
      previousActiveRows = await window.AdminData.updateRows("scoring_configs", {
        is_active: false,
        updated_at: savedAt
      }, [{ operator: "eq", column: "is_active", value: true }]);
      await window.AdminData.insertRow("scoring_configs", {
        config_key: `fragrance_master_v${nextVersion}`,
        version: nextVersion,
        is_active: true,
        config_json: workingConfig,
        note: note || null,
        updated_at: savedAt
      });
    } catch (error) {
      const previousActiveId = activeConfigRow?.id || previousActiveRows[0]?.id;
      if (previousActiveId) {
        await window.AdminData.updateRow("scoring_configs", previousActiveId, {
          is_active: true,
          updated_at: new Date().toISOString()
        }).catch(console.error);
      }
      throw error;
    }
    const legacyNote = document.getElementById("scoring-note");
    if (legacyNote) legacyNote.value = "";
    document.getElementById("scoring-note-modal").value = "";
    await loadActiveConfig();
    clearDraftDirty();
    updateStatus("新しい version として保存しました。公開側はこの active 設定を読みます。");
  }

  function bindModalControls() {
    document.querySelectorAll("[data-scoring-question-close]").forEach((button) => {
      button.addEventListener("click", () => closeQuestionModal());
    });
    document.getElementById("scoring-question-form").addEventListener("submit", (event) => {
      event.preventDefault();
      saveQuestionModal();
    });
    document.querySelectorAll("[data-scoring-save-close]").forEach((button) => {
      button.addEventListener("click", closeSaveModal);
    });
    document.getElementById("scoring-save-modal-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const note = document.getElementById("scoring-note-modal").value.trim();
      try {
        closeSaveModal();
        await saveScoringConfig(note);
      } catch (error) {
        console.error(error);
        updateStatus("保存に失敗しました。");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeQuestionModal();
      closeSaveModal();
    });
    document.addEventListener("click", (event) => {
      const stepperButton = event.target.closest("[data-stepper-delta]");
      if (!stepperButton) return;
      event.preventDefault();
      stepNumberInput(stepperButton);
    });
    window.addEventListener("beforeunload", (event) => {
      if (!hasPendingScoringEdits()) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  bindModalControls();

  function applyWorkingConfig(config, message, options = {}) {
    workingConfig = cloneConfig(config);
    refreshJsonPreview();
    renderOverview(workingConfig);
    renderEditor();
    if (options.markDirty) {
      markDraftDirty();
    } else {
      clearDraftDirty();
    }
    updateStatus(message);
  }

  async function loadActiveConfig() {
    const rows = await window.AdminData.listRows("scoring_configs", {
      filters: [{ operator: "eq", column: "is_active", value: true }],
      orders: [{ column: "version", ascending: false }],
      limit: 1
    }).catch(() => []);
    activeConfigRow = rows[0] || null;
    activeVersionEl.textContent = activeConfigRow?.version ?? "-";
    activeNoteEl.textContent = activeConfigRow?.note ?? "-";
    activeUpdatedEl.textContent = activeConfigRow?.updated_at ? String(activeConfigRow.updated_at).slice(0, 16).replace("T", " ") : "-";
    applyWorkingConfig(activeConfigRow?.config_json || window.FragranceMasterData.createDefaultScoringConfig(), activeConfigRow ? "現在の active 設定をフォームへ読み込みました。" : "active 設定がないため、初期テンプレートを表示しています。");
  }

  document.getElementById("scoring-load-template").addEventListener("click", () => {
    applyWorkingConfig(window.FragranceMasterData.createDefaultScoringConfig(), "deep-research-report 基準の初期テンプレートを読み込みました。", { markDirty: true });
  });

  document.getElementById("scoring-load-active").addEventListener("click", () => {
    applyWorkingConfig(activeConfigRow?.config_json || window.FragranceMasterData.createDefaultScoringConfig(), activeConfigRow ? "active 設定をフォームへ戻しました。" : "active 設定がないため、初期テンプレートを読み込みました。");
  });

  if (exportButtons.length) {
    exportButtons.forEach((button) => button.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(workingConfig, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `scoring-config-v${activeConfigRow?.version || "draft"}.json`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      updateStatus("現在の配点ロジックを Json ファイルとして保存しました。");
    }));
  }

  if (importTriggerButtons.length && importInput) {
    importTriggerButtons.forEach((button) => button.addEventListener("click", () => {
      importInput.click();
    }));
    importInput.addEventListener("change", async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!window.FragranceMasterData.isExpectedScoringConfig(parsed)) {
          throw new Error("配点ロジック JSON の構造が想定と異なります。");
        }
        applyWorkingConfig(parsed, `${file.name} を読み込みました。`, { markDirty: true });
      } catch (error) {
        updateStatus(error.message || "Json 読込に失敗しました。");
      } finally {
        importInput.value = "";
      }
    });
  }

  document.getElementById("scoring-form").addEventListener("submit", (event) => {
    event.preventDefault();
    openSaveModal();
  });

  async function bootstrap() {
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole("manager");
    window.AdminAuth.renderAdminHeader("scoring", {
      role: "manager",
      session,
      links: [
        { href: "admin-qr-requests.html", label: "QR依頼一覧", key: "qr-requests" },
        { href: "admin-settings.html", label: "スタッフ登録/管理", key: "settings" },
        { href: "admin-materials.html", label: "原料ポイント", key: "materials" }
      ]
    });
    await loadActiveConfig();
  }

  applyWorkingConfig(workingConfig, "初期テンプレートを表示しています。");
  bootstrap();
})();
