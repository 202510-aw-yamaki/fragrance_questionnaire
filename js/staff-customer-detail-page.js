(function () {
  const AXIS_ORDER = ["floral", "fresh", "woody", "spicy", "sweet"];
  const AXIS_LABELS = {
    floral: "フローラル",
    fresh: "フレッシュ",
    woody: "ウッディ",
    spicy: "スパイシー",
    sweet: "スウィート"
  };
  const BRANCH_LABELS = {
    floral: "フローラル",
    fresh: "フレッシュ",
    woody: "ウッディ"
  };
  const SESSION_STATUS_LABELS = {
    draft: "下書き",
    ready: "接客準備",
    completed: "接客完了"
  };
  const QUESTIONNAIRE_FLOW_LABELS = {
    linked: "アンケート回答済み",
    answered_unsaved: "回答済み / 結果保存失敗",
    skipped: "アンケート未回答",
    linked_missing: "結果データ取得不可",
    unknown: "アンケート結果なし"
  };
  const headerEl = document.getElementById("staff-detail-header");
  const profileEl = document.getElementById("customer-profile");
  const questionSummaryEl = document.getElementById("question-summary");
  const questionAnswerGridEl = document.getElementById("question-answer-grid");
  const axisCompareEl = document.getElementById("axis-compare");
  const recommendedMaterialsEl = document.getElementById("recommended-materials");
  const formEl = document.getElementById("staff-detail-form");
  const finalSectionEl = document.getElementById("final-section");
  const recordIdEl = document.getElementById("session-record-id");
  const submitModeEl = document.getElementById("submit-mode");
  const sessionStatusEl = document.getElementById("session-status");
  const preparationNoteEl = document.getElementById("preparation-note");
  const staffSummaryEl = document.getElementById("staff-summary");
  const hearingNoteEl = document.getElementById("hearing-note");
  const recipeListEl = document.getElementById("recipe-list");
  const addRecipeRowEl = document.getElementById("add-recipe-row");
  const normalizeRecipeEl = document.getElementById("normalize-recipe");
  const axisTotalEl = document.getElementById("axis-total");
  const finalAxisPreviewEl = document.getElementById("final-axis-preview");
  const customerFeedbackEl = document.getElementById("customer-feedback");
  const saveStatusEl = document.getElementById("save-status");
  const qrPreviewEl = document.getElementById("qr-preview");
  const saveDraftEl = document.getElementById("save-draft");
  const saveCompleteEl = document.getElementById("save-complete");
  const generateQrEl = document.getElementById("generate-qr");
  const customerModalEl = document.getElementById("customer-modal");
  const customerFormEl = document.getElementById("customer-form");
  const customerEditOpenEl = document.getElementById("customer-edit-open");
  const customerNameEl = document.getElementById("customer-name");
  const customerEmailEl = document.getElementById("customer-email");
  const customerPhoneEl = document.getElementById("customer-phone");
  const customerConsentEl = document.getElementById("customer-consent");

  let session = null;
  let reservation = null;
  let slot = null;
  let questionnaire = null;
  let workshop = null;
  let materialRows = [];
  let materialDataReady = false;
  let customerDraft = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDisplayValue(value, fallback = "未入力") {
    const text = String(value ?? "").trim();
    return text || fallback;
  }

  function setStatus(message, kind = "note") {
    if (!saveStatusEl) return;
    saveStatusEl.textContent = message;
    saveStatusEl.className = kind === "error" ? "admin-error" : "admin-note";
  }

  function getReservationId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("reservation") || params.get("id") || "";
  }

  function getDraftKey() {
    return reservation?.id ? `fragranceCustomerDraft:${reservation.id}` : "";
  }

  function getFeedbackKey() {
    return reservation?.id ? `fragranceCustomerFeedback:${reservation.id}` : "";
  }

  function getHearingMemoKey() {
    return reservation?.id ? `fragranceHearingMemo:${reservation.id}` : "";
  }

  function readCustomerDraft() {
    try {
      const key = getDraftKey();
      if (!key) return null;
      const stored = window.sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  function persistCustomerDraft(payload) {
    const key = getDraftKey();
    if (key) {
      window.sessionStorage.setItem(key, JSON.stringify(payload));
    }
  }

  function getBackHref() {
    return { href: "staff-reservations.html?role=staff", useHistory: false };
  }

  function renderHeader() {
    if (!headerEl) return;
    const back = getBackHref();
    const staffName = window.AdminAuth?.getStaffDisplayName
      ? window.AdminAuth.getStaffDisplayName(session)
      : "staff";
    headerEl.innerHTML = `
      <div class="staff-detail-header-inner staff-detail-header-inner-simple">
        <a class="staff-detail-brand" href="staff-dashboard.html?role=staff">Fragrance STAFF_${escapeHtml(staffName)}</a>
        <div class="staff-detail-header-actions">
          <a class="staff-detail-nav-link" id="staff-detail-back" href="${escapeHtml(back.href)}">戻る</a>
          <button class="staff-detail-logout" id="staff-detail-logout" type="button">ログアウト</button>
        </div>
      </div>
    `;
    document.getElementById("staff-detail-logout")?.addEventListener("click", window.AdminAuth.signOutAdmin);
  }

  function normalizeAxes(axes) {
    if (window.FragranceMasterData?.normalizeAxes) {
      return window.FragranceMasterData.normalizeAxes(axes || {});
    }
    return AXIS_ORDER.reduce((acc, axis) => {
      acc[axis] = Number(axes?.[axis] || 0);
      return acc;
    }, {});
  }

  function hasAxisValue(axes) {
    return AXIS_ORDER.some((axis) => Number(axes?.[axis] || 0) > 0);
  }

  function getSlotLabel() {
    if (!slot) return reservation?.slot_label || "-";
    return `${slot.slot_date || ""} ${String(slot.slot_time || "").slice(0, 5)}`.trim();
  }

  function formatVisitType(value) {
    const text = String(value ?? "").trim();
    if (!text) return "-";
    const lower = text.toLowerCase();
    if (text.includes("ギフト") || lower.includes("gift")) return "ギフト";
    if (text.includes("再") || lower.includes("return") || lower.includes("repeat")) return "再来店";
    if (text.includes("初") || text.includes("ワークショップ") || lower.includes("first")) return "初回";
    return text;
  }

  function getCurrentFinalAxes() {
    return AXIS_ORDER.reduce((acc, axis) => {
      acc[axis] = Number(document.getElementById(`axis-${axis}`)?.value || 0);
      return acc;
    }, {});
  }

  function setFinalAxisInputs(axes) {
    const normalized = normalizeAxes(axes);
    AXIS_ORDER.forEach((axis) => {
      const input = document.getElementById(`axis-${axis}`);
      if (input) input.value = String(Number(normalized[axis] || 0));
    });
  }

  function getRadarPoint(cx, cy, radius, index, total, scale = 1) {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI / total);
    return {
      x: cx + Math.cos(angle) * radius * scale,
      y: cy + Math.sin(angle) * radius * scale
    };
  }

  function createRadarGraph(axes, variant) {
    const normalized = normalizeAxes(axes);
    const cx = 130;
    const cy = 130;
    const radius = 84;
    const pointText = AXIS_ORDER.map((axis, index) => {
      const value = Math.max(0, Math.min(100, Number(normalized[axis] || 0))) / 100;
      const point = getRadarPoint(cx, cy, radius, index, AXIS_ORDER.length, value);
      return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    }).join(" ");
    return `
      <div class="staff-radar-wrap">
        <svg class="staff-radar-graph" viewBox="0 0 260 260" role="img" aria-label="5軸グラフ">
          ${[0.25, 0.5, 0.75, 1].map((scale) => {
            const points = AXIS_ORDER.map((axis, index) => {
              const point = getRadarPoint(cx, cy, radius, index, AXIS_ORDER.length, scale);
              return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
            }).join(" ");
            return `<polygon class="staff-radar-grid" points="${points}"></polygon>`;
          }).join("")}
          ${AXIS_ORDER.map((axis, index) => {
            const end = getRadarPoint(cx, cy, radius, index, AXIS_ORDER.length, 1);
            const label = getRadarPoint(cx, cy, radius, index, AXIS_ORDER.length, 1.32);
            return `
              <line class="staff-radar-axis" x1="${cx}" y1="${cy}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}"></line>
              <text class="staff-radar-label" x="${label.x.toFixed(1)}" y="${label.y.toFixed(1)}">${escapeHtml(AXIS_LABELS[axis])}</text>
            `;
          }).join("")}
          <polygon class="staff-radar-shape staff-radar-shape-${variant}" points="${pointText}"></polygon>
        </svg>
      </div>
    `;
  }

  function createAxisStatGrid(axes) {
    const normalized = normalizeAxes(axes);
    return `
      <div class="staff-axis-stat-grid">
        ${AXIS_ORDER.map((axis) => `
          <div class="staff-axis-stat">
            <span>${AXIS_LABELS[axis]}</span>
            <strong>${Number(normalized[axis] || 0)}</strong>
          </div>
        `).join("")}
      </div>
    `;
  }

  function updateAxisTotal() {
    const axes = getCurrentFinalAxes();
    const total = AXIS_ORDER.reduce((sum, axis) => sum + Number(axes[axis] || 0), 0);
    if (axisTotalEl) {
      axisTotalEl.textContent = `合計 ${total}`;
    }
    if (finalAxisPreviewEl) {
      finalAxisPreviewEl.innerHTML = createRadarGraph(axes, "final");
    }
    renderAxisCompare();
  }

  function renderCustomerProfile() {
    if (!profileEl) return;
    customerDraft = readCustomerDraft();
    const name = customerDraft?.name || reservation?.customer_name || "未入力";
    const email = customerDraft?.email || "未入力";
    const phone = customerDraft?.phone || "任意";
    const consent = customerDraft?.consent ? "同意済み" : "未取得";
    profileEl.innerHTML = `
      <div class="staff-profile-card">
        <div class="staff-profile-top staff-profile-top-compact">
          <div class="staff-profile-name-block">
            <span class="staff-profile-label">お客様名:</span>
            <h3 class="staff-profile-name">${escapeHtml(name)}</h3>
          </div>
          <div class="staff-profile-chip-row">
            <span class="staff-profile-chip">個人情報同意: <strong>${escapeHtml(consent)}</strong></span>
            <span class="staff-profile-chip">メール: <strong>${escapeHtml(email)}</strong></span>
            <span class="staff-profile-chip">電話: <strong>${escapeHtml(phone)}</strong></span>
            <span class="staff-profile-chip">予約枠: <strong>${escapeHtml(getSlotLabel())}</strong></span>
            <span class="staff-profile-chip">来店目的: <strong>${escapeHtml(formatVisitType(reservation?.visit_type))}</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  function formatAnswerValue(value) {
    if (Array.isArray(value)) return value.filter(Boolean).join(" / ") || "-";
    if (value && typeof value === "object") return Object.values(value).filter(Boolean).join(" / ") || "-";
    return formatDisplayValue(value, "-");
  }

  function getAnswerItems() {
    if (!questionnaire) return [];
    const step1 = questionnaire.step1_answer_keys_json || questionnaire.step1_answers_json || {};
    const step2 = questionnaire.step2_answer_keys_json || questionnaire.step2_answers_json || {};
    const common = ["Q1", "Q2", "Q3", "Q4", "Q5"].map((id) => ({
      stage: "共通",
      id,
      value: formatAnswerValue(step1[id])
    }));
    const branch = ["Q6", "Q7"].map((id) => ({
      stage: "分岐",
      id,
      value: formatAnswerValue(step2[id])
    }));
    const finish = [{
      stage: "最終",
      id: "Q8",
      value: formatAnswerValue(step2.Q8 || questionnaire.selected_finish)
    }];
    return common.concat(branch, finish);
  }

  function getQuestionnaireMissingState() {
    if (reservation?.questionnaire_result_id) {
      return {
        status: "linked_missing",
        message: "アンケート結果IDはありますが、結果データを取得できません。通信状態またはDB上の結果データを確認してください。"
      };
    }
    if (reservation?.questionnaire_flow_status === "answered_unsaved") {
      return {
        status: "answered_unsaved",
        message: "アンケート回答済みですが、結果データ保存に失敗した状態で予約されています。"
      };
    }
    if (reservation?.questionnaire_flow_status === "skipped") {
      return {
        status: "skipped",
        message: "アンケート未回答で予約されています。"
      };
    }
    return {
      status: "unknown",
      message: "アンケート結果は予約に紐づいていません。"
    };
  }

  function renderQuestionnaire() {
    if (!questionSummaryEl || !questionAnswerGridEl) return;
    if (!questionnaire) {
      const missingState = getQuestionnaireMissingState();
      const syncError = reservation?.questionnaire_sync_error
        ? `<span class="staff-question-missing-error">保存状態: ${escapeHtml(reservation.questionnaire_sync_error)}</span>`
        : "";
      questionSummaryEl.innerHTML = `
        <div class="staff-question-missing">
          <strong>${escapeHtml(QUESTIONNAIRE_FLOW_LABELS[missingState.status] || QUESTIONNAIRE_FLOW_LABELS.unknown)}</strong>
          <p>${escapeHtml(missingState.message)}</p>
          ${syncError}
        </div>
      `;
      questionAnswerGridEl.innerHTML = "";
      return;
    }
    questionSummaryEl.innerHTML = `
      <div class="staff-question-strip">
        <span class="staff-question-pill">分岐 <strong>${escapeHtml(BRANCH_LABELS[questionnaire.branch_key] || questionnaire.branch_key || "-")}</strong></span>
        <span class="staff-question-pill">仕上げ <strong>${escapeHtml(formatDisplayValue(questionnaire.selected_finish, "-"))}</strong></span>
        <span class="staff-question-pill">サマリー <strong>${escapeHtml(formatDisplayValue(questionnaire.summary_headline, "-"))}</strong></span>
      </div>
    `;
    questionAnswerGridEl.innerHTML = getAnswerItems().map((item) => `
      <article class="staff-answer-card">
        <span class="staff-answer-stage">${escapeHtml(item.stage)}</span>
        <span class="staff-answer-question">${escapeHtml(item.id)}:</span>
        <span class="staff-answer-value">${escapeHtml(item.value)}</span>
      </article>
    `).join("");
  }

  function renderAxisCompare() {
    if (!axisCompareEl) return;
    const questionnaireAxes = questionnaire?.final_axes || {};
    const reservationAxes = reservation?.axes || {};
    axisCompareEl.innerHTML = `
      <div class="staff-axis-compare-grid">
        <article class="staff-axis-card">
          <h3>アンケート時点の5軸</h3>
          ${createRadarGraph(questionnaireAxes, "survey")}
          ${createAxisStatGrid(questionnaireAxes)}
        </article>
        <article class="staff-axis-card">
          <h3>予約完了時の5軸</h3>
          ${createRadarGraph(reservationAxes, "reservation")}
          ${createAxisStatGrid(reservationAxes)}
        </article>
      </div>
    `;
  }

  function renderRecommendedMaterials() {
    if (!recommendedMaterialsEl) return;
    const rankMaterials = window.FragranceMasterData?.rankMaterials;
    if (!rankMaterials) {
      recommendedMaterialsEl.innerHTML = `<p class="admin-empty">原料候補を計算できません。</p>`;
      return;
    }
    const sampleRows = [
      { material_name: "サンプル原料 A", ratio: "--" },
      { material_name: "サンプル原料 B", ratio: "--" },
      { material_name: "サンプル原料 C", ratio: "--" }
    ];
    const buildGroup = (title, note, axes) => {
      const incomplete = !materialDataReady || !hasAxisValue(axes);
      if (incomplete) {
        return {
          title,
          note: `${note} / データ未整備（今後の課題）`,
          rows: sampleRows,
          incomplete: true
        };
      }
      const rankedRows = rankMaterials(axes, materialRows, 3);
      if (!rankedRows.length) {
        return {
          title,
          note: `${note} / データ未整備（今後の課題）`,
          rows: sampleRows,
          incomplete: true
        };
      }
      const scoreTotal = rankedRows.reduce((sum, row) => sum + Math.max(1, Number(row.score || 0)), 0);
      let remainder = 100;
      const rows = rankedRows.map((row, index) => {
        const ratio = index === rankedRows.length - 1
          ? remainder
          : Math.round((Math.max(1, Number(row.score || 0)) / scoreTotal) * 100);
        remainder -= ratio;
        return { material_name: row.material_name, ratio };
      });
      return { title, note, rows, incomplete: false };
    };
    const groups = [
      buildGroup("アンケート基準原料割当", "回答時点の方向性の原料と配合割合", questionnaire?.final_axes || {}),
      buildGroup("予約時基準原料割当", "予約完了時点の方向性の原料と配合割合", reservation?.axes || {})
    ];
    recommendedMaterialsEl.innerHTML = `
      <div class="staff-material-grid">
        ${groups.map((group) => `
          <section class="staff-material-group${group.incomplete ? " is-incomplete" : ""}">
            <div class="staff-material-group-head">
              <h3>${escapeHtml(group.title)}</h3>
              <p class="admin-note">${escapeHtml(group.note)}</p>
            </div>
            <div class="staff-material-table">
              <div class="staff-material-row staff-material-head-row">
                <span class="staff-material-name">原料名</span>
                <strong class="staff-material-ratio">割合</strong>
              </div>
              ${group.rows.map((row) => `
                <article class="staff-material-row">
                  <span class="staff-material-name">${escapeHtml(row.material_name)}</span>
                  <strong class="staff-material-ratio">${escapeHtml(row.ratio)}${group.incomplete ? "" : "%"}</strong>
                </article>
              `).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    `;
  }

  function getMaterialOptions(selectedCode) {
    return [`<option value="">選択してください</option>`]
      .concat(materialRows.map((row) => {
        const selected = row.material_code === selectedCode ? " selected" : "";
        return `<option value="${escapeHtml(row.material_code)}"${selected}>${escapeHtml(row.material_name)}</option>`;
      }))
      .join("");
  }

  function createRecipeRow(item = {}) {
    if (!recipeListEl) return;
    const row = document.createElement("div");
    row.className = "staff-recipe-row";
    row.innerHTML = `
      <input data-recipe-field="role" type="hidden" value="${escapeHtml(item.role || "ingredient")}">
      <input data-recipe-field="lot" type="hidden" value="${escapeHtml(item.lot || "")}">
      <input data-recipe-field="note" type="hidden" value="${escapeHtml(item.note || "")}">
      <label class="staff-recipe-material-field">
        <span class="staff-recipe-field-label">原料</span>
        <select data-recipe-field="material_code">${getMaterialOptions(item.material_code || "")}</select>
      </label>
      <label class="staff-recipe-amount-field">割合
        <span class="staff-amount-control">
          <input data-recipe-field="amount" type="number" min="0" step="1" value="${Math.round(Number(item.amount || 0))}">
          <span class="staff-amount-unit">%</span>
          <span class="staff-amount-step-group">
            <button class="staff-amount-step" type="button" data-adjust-amount="-1" aria-label="割合を減らす">◀</button>
            <button class="staff-amount-step" type="button" data-adjust-amount="1" aria-label="割合を増やす">▶</button>
          </span>
        </span>
      </label>
      <button class="admin-btn secondary" type="button" data-remove-recipe>削除</button>
    `;
    row.querySelector("[data-remove-recipe]")?.addEventListener("click", () => {
      row.remove();
      refreshFinalAxesFromRecipe();
    });
    row.querySelector('[data-recipe-field="material_code"]')?.addEventListener("change", refreshFinalAxesFromRecipe);
    row.querySelector('[data-recipe-field="amount"]')?.addEventListener("input", refreshFinalAxesFromRecipe);
    row.querySelectorAll("[data-adjust-amount]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = row.querySelector('[data-recipe-field="amount"]');
        const nextValue = Math.max(0, Number(input?.value || 0) + Number(button.dataset.adjustAmount || 0));
        if (input) input.value = String(nextValue);
        refreshFinalAxesFromRecipe();
      });
    });
    recipeListEl.appendChild(row);
  }

  function renderRecipeRows(items) {
    if (!recipeListEl) return;
    recipeListEl.innerHTML = "";
    (Array.isArray(items) ? items : []).forEach((item) => createRecipeRow(item));
    while (recipeListEl.children.length < 3) {
      createRecipeRow({ role: "ingredient" });
    }
  }

  function collectRecipeItems() {
    if (!recipeListEl) return [];
    return Array.from(recipeListEl.children)
      .map((row) => {
        const materialCode = row.querySelector('[data-recipe-field="material_code"]')?.value || "";
        const material = materialRows.find((entry) => entry.material_code === materialCode);
        return {
          role: row.querySelector('[data-recipe-field="role"]')?.value || "ingredient",
          material_code: materialCode || null,
          material_name: material?.material_name || null,
          amount: Number(row.querySelector('[data-recipe-field="amount"]')?.value || 0),
          lot: row.querySelector('[data-recipe-field="lot"]')?.value || null,
          note: row.querySelector('[data-recipe-field="note"]')?.value || null
        };
      })
      .filter((item) => item.material_code);
  }

  function calculateRecipeDerivedAxes() {
    const items = collectRecipeItems();
    const totalAmount = items.reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0)), 0);
    if (!items.length || !totalAmount) return null;
    const axes = AXIS_ORDER.reduce((acc, axis) => {
      acc[axis] = 0;
      return acc;
    }, {});
    items.forEach((item) => {
      const material = materialRows.find((entry) => entry.material_code === item.material_code);
      if (!material) return;
      const ratio = Math.max(0, Number(item.amount || 0)) / totalAmount;
      AXIS_ORDER.forEach((axis) => {
        axes[axis] += Number(material.point_axes?.[axis] || 0) * ratio;
      });
    });
    return AXIS_ORDER.reduce((acc, axis) => {
      acc[axis] = Math.round(axes[axis]);
      return acc;
    }, {});
  }

  function refreshFinalAxesFromRecipe() {
    const derived = calculateRecipeDerivedAxes();
    if (derived) {
      setFinalAxisInputs(derived);
    }
    updateAxisTotal();
  }

  function normalizeRecipeAmounts() {
    const amountInputs = Array.from(recipeListEl?.querySelectorAll('[data-recipe-field="amount"]') || []);
    if (!amountInputs.length) return;
    const values = amountInputs.map((input) => Math.max(0, Number(input.value || 0)));
    const total = values.reduce((sum, value) => sum + value, 0);
    if (!total) return;
    let remainder = 100;
    amountInputs.forEach((input, index) => {
      const nextValue = index === amountInputs.length - 1
        ? remainder
        : Math.round((values[index] / total) * 100);
      remainder -= nextValue;
      input.value = String(Math.max(0, nextValue));
    });
    refreshFinalAxesFromRecipe();
  }

  function fillForm() {
    const baseAxes = workshop?.final_axes || reservation?.axes || questionnaire?.adjusted_axes || questionnaire?.final_axes || {};
    recordIdEl.value = workshop?.id || "";
    sessionStatusEl.value = workshop?.status || "draft";
    preparationNoteEl.value = workshop?.preparation_note || reservation?.staff_memo || "";
    staffSummaryEl.value = workshop?.staff_summary || "";
    customerFeedbackEl.value = getFeedbackKey() ? window.sessionStorage.getItem(getFeedbackKey()) || "" : "";
    if (hearingNoteEl) {
      hearingNoteEl.value = getHearingMemoKey() ? window.sessionStorage.getItem(getHearingMemoKey()) || "" : "";
    }
    setFinalAxisInputs(baseAxes);
    renderRecipeRows(workshop?.recipe_items || []);
    updateAxisTotal();
  }

  function createStableHash(source) {
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function buildRecipeSignature(items) {
    return (items || [])
      .filter((item) => item.material_code)
      .map((item) => `${item.material_code}:${Number(item.amount || 0)}`)
      .sort()
      .join("|");
  }

  function buildProductSnapshot() {
    const axes = normalizeAxes(getCurrentFinalAxes());
    const recipeItems = collectRecipeItems();
    const recipeSignature = buildRecipeSignature(recipeItems);
    const axisSignature = AXIS_ORDER.map((axis) => `${axis}:${Number(axes[axis] || 0)}`).join("|");
    const productId = `prd-${createStableHash(`${axisSignature}|${recipeSignature || "recipe:none"}`)}`;
    const target = new URL("product-reservation.html", window.location.href);
    target.searchParams.set("product_id", productId);
    AXIS_ORDER.forEach((axis) => {
      target.searchParams.set(axis, String(Number(axes[axis] || 0)));
    });
    return {
      productId,
      url: target.toString(),
      isReady: hasAxisValue(axes) && recipeItems.length > 0
    };
  }

  function renderQr(force = false) {
    if (!qrPreviewEl) return;
    const snapshot = buildProductSnapshot();
    if (!force) {
      qrPreviewEl.innerHTML = snapshot.isReady
        ? `<div>QR表示できます<br><span class="admin-note">商品ID: ${escapeHtml(snapshot.productId)}</span></div>`
        : `<div>QRコードがここに表示されます。<br><span class="admin-note">原料配合を1行以上入力してください。</span></div>`;
      return;
    }
    if (!snapshot.isReady) {
      qrPreviewEl.innerHTML = `<div>QRを生成できません。<br><span class="admin-note">最終5軸と原料配合を確認してください。</span></div>`;
      return;
    }
    if (!window.QRCode) {
      qrPreviewEl.textContent = "QRライブラリを読み込めなかったため表示できません。";
      return;
    }
    qrPreviewEl.innerHTML = "";
    new window.QRCode(qrPreviewEl, {
      text: snapshot.url,
      width: 220,
      height: 220,
      colorDark: "#3d2f24",
      colorLight: "#fffdf9",
      correctLevel: window.QRCode.CorrectLevel.M
    });
  }

  async function saveWorkshop() {
    if (!reservation) return;
    const payload = {
      reservation_id: reservation.id,
      questionnaire_result_id: reservation.questionnaire_result_id || null,
      preparation_note: preparationNoteEl.value.trim() || null,
      staff_summary: staffSummaryEl.value.trim() || null,
      pre_visit_axes: normalizeAxes(questionnaire?.final_axes || reservation.axes || {}),
      reservation_axes: normalizeAxes(reservation.axes || {}),
      final_axes: normalizeAxes(getCurrentFinalAxes()),
      recipe_items: collectRecipeItems(),
      status: submitModeEl.value === "complete" ? "completed" : (sessionStatusEl.value || "draft"),
      updated_at: new Date().toISOString()
    };
    const recordId = recordIdEl.value;
    try {
      const saved = recordId
        ? await window.AdminData.updateRow("workshop_sessions", recordId, payload)
        : await window.AdminData.insertRow("workshop_sessions", payload);
      await window.AdminData.updateRow("reservations", reservation.id, {
        staff_memo: payload.preparation_note,
        status: submitModeEl.value === "complete" ? "completed" : reservation.status,
        updated_at: new Date().toISOString()
      });
      recordIdEl.value = saved?.[0]?.id || recordId || "";
      if (getFeedbackKey()) {
        window.sessionStorage.setItem(getFeedbackKey(), customerFeedbackEl.value.trim());
      }
      if (hearingNoteEl && getHearingMemoKey()) {
        window.sessionStorage.setItem(getHearingMemoKey(), hearingNoteEl.value.trim());
      }
      reservation.staff_memo = payload.preparation_note;
      if (submitModeEl.value === "complete") reservation.status = "completed";
      workshop = { ...(workshop || {}), ...payload, id: recordIdEl.value };
      renderCustomerProfile();
      renderQr(false);
      setStatus(submitModeEl.value === "complete" ? "接客完了として保存しました。" : "途中保存しました。");
    } catch (error) {
      setStatus(error?.message || "保存に失敗しました。", "error");
    }
  }

  async function loadDetailData() {
    const reservationId = getReservationId();
    if (!reservationId) {
      setStatus("対象の予約が指定されていません。", "error");
      profileEl.innerHTML = `<p class="admin-empty">対象の予約が指定されていません。</p>`;
      return false;
    }
    const reservationRows = await window.AdminData.listRows("reservations", {
      filters: [{ operator: "eq", column: "id", value: reservationId }],
      limit: 1
    }).catch(() => []);
    reservation = reservationRows[0] || null;
    if (!reservation) {
      setStatus("該当する予約情報を読み込めませんでした。", "error");
      profileEl.innerHTML = `<p class="admin-empty">該当する予約情報を読み込めませんでした。</p>`;
      return false;
    }

    const [slotRows, questionnaireRows, workshopRows, materialPointRows] = await Promise.all([
      reservation.slot_id
        ? window.AdminData.listRows("reservation_slots", {
            filters: [{ operator: "eq", column: "id", value: reservation.slot_id }],
            limit: 1
          }).catch(() => [])
        : Promise.resolve([]),
      reservation.questionnaire_result_id
        ? window.AdminData.listRows("questionnaire_results", {
            filters: [{ operator: "eq", column: "id", value: reservation.questionnaire_result_id }],
            limit: 1
          }).catch(() => [])
        : Promise.resolve([]),
      window.AdminData.listRows("workshop_sessions", {
        filters: [{ operator: "eq", column: "reservation_id", value: reservation.id }],
        limit: 1
      }).catch(() => []),
      window.AdminData.listRows("material_points", {
        filters: [{ operator: "eq", column: "is_active", value: true }],
        orders: [{ column: "sort_order", ascending: true }]
      }).catch(() => [])
    ]);

    slot = slotRows[0] || null;
    questionnaire = questionnaireRows[0] || null;
    workshop = workshopRows[0] || null;
    const defaults = window.FragranceMasterData?.createMaterialTemplates?.() || [];
    materialDataReady = materialPointRows.length > 0;
    materialRows = (materialPointRows.length ? materialPointRows : defaults)
      .map((row) => window.FragranceMasterData?.normalizeMaterialRow
        ? window.FragranceMasterData.normalizeMaterialRow(row)
        : row);
    return true;
  }

  function bindEvents() {
    customerEditOpenEl?.addEventListener("click", () => {
      customerDraft = readCustomerDraft() || {};
      customerNameEl.value = customerDraft.name || reservation?.customer_name || "";
      customerEmailEl.value = customerDraft.email || "";
      customerPhoneEl.value = customerDraft.phone || "";
      customerConsentEl.checked = Boolean(customerDraft.consent);
      customerModalEl.hidden = false;
    });

    document.querySelectorAll("[data-customer-close]").forEach((button) => {
      button.addEventListener("click", () => {
        customerModalEl.hidden = true;
      });
    });

    customerFormEl?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!customerConsentEl.checked) {
        setStatus("個人情報の同意チェックがないため保存できません。", "error");
        return;
      }
      customerDraft = {
        name: customerNameEl.value.trim(),
        email: customerEmailEl.value.trim(),
        phone: customerPhoneEl.value.trim(),
        consent: customerConsentEl.checked
      };
      persistCustomerDraft(customerDraft);
      customerModalEl.hidden = true;
      renderCustomerProfile();
      setStatus("お客様情報をこの端末の下書きとして保存しました。");
    });

    addRecipeRowEl?.addEventListener("click", () => createRecipeRow({ role: "ingredient" }));
    normalizeRecipeEl?.addEventListener("click", normalizeRecipeAmounts);
    AXIS_ORDER.forEach((axis) => {
      document.getElementById(`axis-${axis}`)?.addEventListener("input", updateAxisTotal);
    });
    saveDraftEl?.addEventListener("click", () => {
      submitModeEl.value = "draft";
    });
    saveCompleteEl?.addEventListener("click", () => {
      submitModeEl.value = "complete";
    });
    formEl?.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveWorkshop();
    });
    generateQrEl?.addEventListener("click", () => renderQr(true));
  }

  async function bootstrap() {
    session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole("staff");
    renderHeader();
    bindEvents();
    setStatus("読み込み中です。");
    const loaded = await loadDetailData();
    if (!loaded) return;
    renderCustomerProfile();
    renderQuestionnaire();
    fillForm();
    renderAxisCompare();
    renderRecommendedMaterials();
    renderQr(false);
    formEl.hidden = false;
    if (finalSectionEl) finalSectionEl.hidden = false;
  }

  bootstrap();
})();
