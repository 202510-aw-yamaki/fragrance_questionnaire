(function () {
  const AXIS_ORDER = window.FragranceMasterData.AXIS_ORDER;
  const AXIS_LABELS = window.FragranceMasterData.AXIS_LABELS;
  const STEP1_SCHEMA = window.FragranceMasterData.STEP1_QUESTION_SCHEMA;
  const STEP2_SCHEMA = window.FragranceMasterData.STEP2_QUESTION_SCHEMA;
  const Q8_SCHEMA = window.FragranceMasterData.Q8_SCHEMA;
  const editorMount = document.getElementById("scoring-editor");
  const overviewMount = document.getElementById("scoring-sections");
  const scoringJson = document.getElementById("scoring-json");
  const scoringStatus = document.getElementById("scoring-status");
  const activeVersionEl = document.getElementById("active-version");
  const activeNoteEl = document.getElementById("active-note");
  const activeUpdatedEl = document.getElementById("active-updated");
  let activeConfigRow = null;
  let workingConfig = window.FragranceMasterData.createDefaultScoringConfig();

  const BRANCH_LABELS = {
    floral: "Bloom / floral",
    fresh: "Air / fresh",
    woody: "Deep / woody"
  };

  function cloneConfig(config) {
    return window.FragranceMasterData.getCompatibleScoringConfig(config);
  }

  function updateStatus(message) {
    scoringStatus.textContent = message;
  }

  function refreshJsonPreview() {
    scoringJson.value = JSON.stringify(workingConfig, null, 2);
  }

  function renderOverview(config) {
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
      card.className = "admin-panel admin-panel-soft";
      card.innerHTML = `<h3>${title}</h3><pre style="white-space:pre-wrap;margin:0;">${JSON.stringify(payload, null, 2)}</pre>`;
      overviewMount.appendChild(card);
    });
  }

  function renderSimpleFieldCard() {
    return `
      <section class="admin-editor-card">
        <div class="admin-card-head">
          <div>
            <h3>基本設定</h3>
            <p class="admin-note">重みとブレンド比率だけ先に調整できます。</p>
          </div>
        </div>
        <div class="admin-grid cols-4">
          <label>STEP1 重み<input data-config-field="questionWeights.step1" type="number" step="1" value="${Number(workingConfig.questionWeights?.step1 || 1)}"></label>
          <label>STEP2 重み<input data-config-field="questionWeights.step2" type="number" step="1" value="${Number(workingConfig.questionWeights?.step2 || 2)}"></label>
          <label>Q8 重み<input data-config-field="questionWeights.finish" type="number" step="1" value="${Number(workingConfig.questionWeights?.finish || 3)}"></label>
          <label>finish ブレンド比率<input data-config-field="finishBlendRatio" type="number" step="0.01" min="0" max="1" value="${Number(workingConfig.finishBlendRatio || 0.25)}"></label>
        </div>
      </section>
    `;
  }

  function renderBranchCard() {
    return `
      <section class="admin-editor-card">
        <div class="admin-card-head">
          <div>
            <h3>分岐テンプレート</h3>
            <p class="admin-note">STEP1 後の五軸から、どの分岐へ入るかを決める基準です。</p>
          </div>
        </div>
        <div class="admin-grid cols-3">
          ${Object.entries(BRANCH_LABELS).map(([branchKey, label]) => {
            return `
              <article class="admin-panel admin-panel-soft">
                <h4>${label}</h4>
                <div class="admin-axis-edit-grid">
                  ${AXIS_ORDER.map((axis) => {
                    return `<label>${AXIS_LABELS[axis]}<input data-branch-template="${branchKey}" data-axis="${axis}" type="number" step="1" value="${Number(workingConfig.branchTemplates?.[branchKey]?.[axis] || 0)}"></label>`;
                  }).join("")}
                </div>
              </article>
            `;
          }).join("")}
        </div>
        <div class="admin-grid cols-5">
          ${AXIS_ORDER.map((axis) => {
            return `<label>${AXIS_LABELS[axis]} の距離重み<input data-branch-weight-axis="${axis}" type="number" step="0.1" value="${Number(workingConfig.branchDistanceWeights?.[axis] || 1)}"></label>`;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderMatrixSection(title, description, schemaList, resolveValue, attributes) {
    return `
      <section class="admin-editor-card">
        <div class="admin-card-head">
          <div>
            <h3>${title}</h3>
            <p class="admin-note">${description}</p>
          </div>
        </div>
        ${schemaList.map((schema) => {
          return `
            <article class="admin-panel admin-panel-soft">
              <h4>${schema.title}</h4>
              <div class="admin-matrix">
                <div class="admin-matrix-row admin-matrix-head">
                  <div>回答</div>
                  ${AXIS_ORDER.map((axis) => `<div>${AXIS_LABELS[axis]}</div>`).join("")}
                </div>
                ${Object.entries(schema.answers).map(([answerKey, answerLabel]) => {
                  return `
                    <div class="admin-matrix-row">
                      <div class="admin-answer-cell"><strong>${answerKey}</strong><span>${answerLabel}</span></div>
                      ${AXIS_ORDER.map((axis) => {
                        return `
                          <div>
                            <input
                              type="number"
                              step="1"
                              value="${Number(resolveValue(schema.id, answerKey, axis, attributes.branch) || 0)}"
                              data-matrix-kind="${attributes.kind}"
                              data-question="${schema.id}"
                              data-answer="${answerKey}"
                              data-axis="${axis}"
                              ${attributes.branch ? `data-branch="${attributes.branch}"` : ""}
                            >
                          </div>
                        `;
                      }).join("")}
                    </div>
                  `;
                }).join("")}
              </div>
            </article>
          `;
        }).join("")}
      </section>
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
      <section class="admin-editor-card">
        <div class="admin-card-head">
          <div>
            <h3>Q8 と finishTemplates</h3>
            <p class="admin-note">Q8 の delta と、最後に軽く寄せるテンプレートです。NONE はブレンドなし固定です。</p>
          </div>
        </div>
        ${renderMatrixSection(
          "Q8 配点",
          "今日の仕上がり回答に対応する delta です。",
          [Q8_SCHEMA],
          (questionId, answerKey, axis) => workingConfig.q8ScoreMap?.[answerKey]?.[axis],
          { kind: "q8" }
        )}
        <article class="admin-panel admin-panel-soft">
          <h4>finish template</h4>
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
                        <input
                          type="number"
                          step="1"
                          value="${Number(workingConfig.finishTemplates?.[row.key]?.[axis] || 0)}"
                          data-finish-template="${row.key}"
                          data-axis="${axis}"
                        >
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

  function renderEditor() {
    editorMount.innerHTML = [
      renderSimpleFieldCard(),
      renderBranchCard(),
      renderMatrixSection(
        "STEP1 配点",
        "最初の5問で使う delta を質問ごとに調整します。",
        STEP1_SCHEMA,
        (questionId, answerKey, axis) => workingConfig.step1ScoreMap?.[questionId]?.[answerKey]?.[axis],
        { kind: "step1" }
      ),
      Object.entries(STEP2_SCHEMA).map(([branchKey, schemaList]) => {
        return renderMatrixSection(
          `${BRANCH_LABELS[branchKey]} の STEP2 配点`,
          "各分岐の Q6 / Q7 を編集します。",
          schemaList,
          (questionId, answerKey, axis, branch) => workingConfig.step2ScoreMap?.[branch]?.[questionId]?.[answerKey]?.[axis],
          { kind: "step2", branch: branchKey }
        );
      }).join(""),
      renderFinishTemplateCard()
    ].join("");
    bindEditorInputs();
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
  }

  function bindEditorInputs() {
    editorMount.querySelectorAll("[data-config-field]").forEach((input) => {
      input.addEventListener("input", () => {
        setNestedNumber(input.dataset.configField, input.value);
      });
    });
    editorMount.querySelectorAll("[data-branch-template]").forEach((input) => {
      input.addEventListener("input", () => {
        const branchKey = input.dataset.branchTemplate;
        const axis = input.dataset.axis;
        workingConfig.branchTemplates[branchKey][axis] = Number(input.value || 0);
        refreshJsonPreview();
        renderOverview(workingConfig);
      });
    });
    editorMount.querySelectorAll("[data-branch-weight-axis]").forEach((input) => {
      input.addEventListener("input", () => {
        workingConfig.branchDistanceWeights[input.dataset.branchWeightAxis] = Number(input.value || 0);
        refreshJsonPreview();
        renderOverview(workingConfig);
      });
    });
    editorMount.querySelectorAll("[data-matrix-kind]").forEach((input) => {
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
      });
    });
    editorMount.querySelectorAll("[data-finish-template]").forEach((input) => {
      input.addEventListener("input", () => {
        const templateKey = input.dataset.finishTemplate;
        const axis = input.dataset.axis;
        workingConfig.finishTemplates[templateKey][axis] = Number(input.value || 0);
        if (templateKey !== "ALL") {
          workingConfig.graphPresets[templateKey][axis] = Number(input.value || 0);
        }
        refreshJsonPreview();
        renderOverview(workingConfig);
      });
    });
  }

  function applyWorkingConfig(config, message) {
    workingConfig = cloneConfig(config);
    refreshJsonPreview();
    renderOverview(workingConfig);
    renderEditor();
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
    applyWorkingConfig(window.FragranceMasterData.createDefaultScoringConfig(), "deep-research-report 基準の初期テンプレートを読み込みました。");
  });

  document.getElementById("scoring-load-active").addEventListener("click", () => {
    applyWorkingConfig(activeConfigRow?.config_json || window.FragranceMasterData.createDefaultScoringConfig(), activeConfigRow ? "active 設定をフォームへ戻しました。" : "active 設定がないため、初期テンプレートを読み込みました。");
  });

  document.getElementById("scoring-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const note = document.getElementById("scoring-note").value.trim();
    const nextVersion = Number(activeConfigRow?.version || 0) + 1;
    if (activeConfigRow?.id) {
      await window.AdminData.updateRow("scoring_configs", activeConfigRow.id, {
        is_active: false,
        updated_at: new Date().toISOString()
      }).catch(console.error);
    }
    await window.AdminData.insertRow("scoring_configs", {
      config_key: `fragrance_master_v${nextVersion}`,
      version: nextVersion,
      is_active: true,
      config_json: workingConfig,
      note: note || null,
      updated_at: new Date().toISOString()
    }).catch(console.error);
    document.getElementById("scoring-note").value = "";
    await loadActiveConfig();
    updateStatus("新しい version として保存しました。公開側はこの active 設定を読みます。");
  });

  async function bootstrap() {
    window.AdminAuth.renderAdminHeader("scoring");
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    await loadActiveConfig();
  }

  bootstrap();
})();
