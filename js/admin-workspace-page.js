(function () {
  const AXIS_ORDER = window.FragranceMasterData.AXIS_ORDER;
  const AXIS_LABELS = window.FragranceMasterData.AXIS_LABELS;
  const STEP1_SCHEMA = window.FragranceMasterData.STEP1_QUESTION_SCHEMA;
  const STEP2_SCHEMA = window.FragranceMasterData.STEP2_QUESTION_SCHEMA;
  const DEFAULT_MATERIALS = window.FragranceMasterData.createMaterialTemplates();
  const UI = {
    unset: "\u672a\u8a2d\u5b9a",
    questionnaireMissing: "\u30a2\u30f3\u30b1\u30fc\u30c8\u56de\u7b54\u306f\u307e\u3060\u7d10\u3065\u3044\u3066\u3044\u307e\u305b\u3093\u3002",
    q8: "Q8 \u6700\u5f8c\u306e\u6574\u3048\u65b9",
    materialPlaceholder: "\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044",
    role: "\u7a2e\u5225",
    base: "\u57fa\u5264",
    ingredient: "\u539f\u6599",
    material: "\u7d20\u6750",
    amount: "\u91cf / \u6599",
    lot: "\u30ed\u30c3\u30c8",
    note: "\u5099\u8003",
    removeRow: "\u3053\u306e\u884c\u3092\u524a\u9664",
    noRecommended: "\u5019\u88dc\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002",
    proximity: "\u8fd1\u3055",
    category: "\u30ab\u30c6\u30b4\u30ea",
    addToRecipe: "\u30ec\u30b7\u30d4\u3078\u8ffd\u52a0",
    selectReservation: "\u5de6\u306e\u4e00\u89a7\u304b\u3089\u4e88\u7d04\u3092\u9078\u3076\u3068\u3001\u4e8b\u524d\u30a2\u30f3\u30b1\u30fc\u30c8\u3068\u30b9\u30bf\u30c3\u30d5\u5165\u529b\u6b04\u3092\u8868\u793a\u3057\u307e\u3059\u3002",
    reservationDetail: "\u4e88\u7d04\u8a73\u7d30",
    summaryFallback: "\u30a2\u30f3\u30b1\u30fc\u30c8\u6982\u8981\u3068\u4e88\u7d04\u60c5\u5831\u3092\u78ba\u8a8d\u3057\u306a\u304c\u3089\u3001\u6765\u5e97\u524d\u6e96\u5099\u3068\u63a5\u5ba2\u5f8c\u306e\u8a18\u9332\u3092\u307e\u3068\u3081\u307e\u3059\u3002",
    reservationCode: "\u4e88\u7d04\u30b3\u30fc\u30c9",
    slot: "\u4e88\u7d04\u67a0",
    staff: "\u62c5\u5f53",
    visitType: "\u6765\u5e97\u5185\u5bb9",
    guestCount: "\u4eba\u6570",
    reservationStatus: "\u4e88\u7d04\u30b9\u30c6\u30fc\u30bf\u30b9",
    axisCompare: "\u4e94\u8ef8\u306e\u6bd4\u8f03",
    reservationAxes: "\u4e88\u7d04\u5b8c\u4e86\u6642\u306e5\u8ef8",
    questionnaireAxes: "\u30a2\u30f3\u30b1\u30fc\u30c8\u56de\u7b54\u6642\u306e5\u8ef8",
    adjustedAxes: "\u63a5\u5ba2\u5f8c\u306e\u6700\u7d425\u8ef8",
    questionnaireSummary: "\u30a2\u30f3\u30b1\u30fc\u30c8\u8981\u7d04",
    branch: "\u5206\u5c90",
    finish: "\u4ed5\u4e0a\u3052",
    summary: "\u30b5\u30de\u30ea\u30fc",
    countSuffix: "\u4ef6\u3092\u8868\u793a\u4e2d",
    openReservation: "\u3053\u306e\u4e88\u7d04\u3092\u958b\u304f",
    draftSaved: "\u9014\u4e2d\u4fdd\u5b58\u3057\u307e\u3057\u305f\u3002",
    completeSaved: "\u63a5\u5ba2\u5b8c\u4e86\u3068\u3057\u3066\u4fdd\u5b58\u3057\u307e\u3057\u305f\u3002",
    saveHint: "\u4fdd\u5b58\u5185\u5bb9\u306f workshop_sessions \u3068 reservations \u306b\u53cd\u6620\u3055\u308c\u307e\u3059\u3002",
    saveError: "\u4fdd\u5b58\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002workshop_sessions \u306e\u30c6\u30fc\u30d6\u30eb\u8ffd\u52a0\u304c\u672a\u53cd\u6620\u306e\u53ef\u80fd\u6027\u304c\u3042\u308a\u307e\u3059\u3002",
    reservationFallback: "\u4e88\u7d04",
    near: "\u8fd1\u3055"
  };

  const reservationListEl = document.getElementById("workspace-reservation-list");
  const emptyEl = document.getElementById("workspace-empty");
  const reservationCountEl = document.getElementById("workspace-count");
  const detailSummaryEl = document.getElementById("workspace-detail-summary");
  const questionSummaryEl = document.getElementById("workspace-question-summary");
  const questionAnswersEl = document.getElementById("workspace-question-answers");
  const recommendedMaterialsEl = document.getElementById("workspace-recommended-materials");
  const recipeListEl = document.getElementById("workspace-recipe-list");
  const form = document.getElementById("workspace-form");
  const submitModeInput = document.getElementById("workspace-submit-mode");
  const statusEl = document.getElementById("workspace-save-status");
  const filterForm = document.getElementById("workspace-filter-form");
  const addRecipeButton = document.getElementById("workspace-add-recipe");
  const kpiUpcomingEl = document.getElementById("workspace-kpi-upcoming");
  const kpiDraftEl = document.getElementById("workspace-kpi-draft");
  const kpiCompletedEl = document.getElementById("workspace-kpi-completed");
  const axisTotalEl = document.getElementById("workspace-axis-total");
  const normalizeButton = document.getElementById("workspace-normalize-axes");
  const axisCompareEl = document.getElementById("workspace-axis-compare");
  const finalAxisPreviewEl = document.getElementById("workspace-final-axis-preview");
  const selectorCardEl = document.getElementById("workspace-selector-card");
  const customerModalEl = document.getElementById("workspace-customer-modal");
  const customerFormEl = document.getElementById("workspace-customer-form");
  const customerOpenButton = document.getElementById("workspace-customer-open");
  const customerNameEl = document.getElementById("workspace-customer-name");
  const customerEmailEl = document.getElementById("workspace-customer-email");
  const customerPhoneEl = document.getElementById("workspace-customer-phone");
  const customerConsentEl = document.getElementById("workspace-customer-consent");
  const customerFeedbackEl = document.getElementById("workspace-customer-feedback");
  const qrPreviewEl = document.getElementById("workspace-qr-preview");
  const generateQrButton = document.getElementById("workspace-generate-qr");

  let reservations = [];
  let slotMap = new Map();
  let materialRows = [];
  let selectedReservation = null;
  let selectedQuestionnaire = null;
  let selectedWorkshop = null;
  let customerDraft = null;
  let currentQrCode = null;

  function setStatus(message, kind = "note") {
    statusEl.textContent = message;
    statusEl.className = kind === "error" ? "admin-error" : kind === "success" ? "admin-note admin-note-success" : "admin-note";
  }

  function getCustomerDraftStorageKey(reservationId) {
    return `fragranceCustomerDraft:${reservationId}`;
  }

  function readCustomerDraft(reservation) {
    if (!reservation?.id) return null;
    try {
      const stored = window.sessionStorage.getItem(getCustomerDraftStorageKey(reservation.id));
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  function persistCustomerDraft(reservation, payload) {
    if (!reservation?.id) return;
    window.sessionStorage.setItem(getCustomerDraftStorageKey(reservation.id), JSON.stringify(payload));
  }

  function openCustomerModal() {
    if (!customerModalEl) return;
    customerModalEl.hidden = false;
  }

  function closeCustomerModal() {
    if (!customerModalEl) return;
    customerModalEl.hidden = true;
  }

  function fillCustomerForm(draft) {
    if (!customerFormEl) return;
    customerNameEl.value = draft?.name || "";
    customerEmailEl.value = draft?.email || "";
    customerPhoneEl.value = draft?.phone || "";
    customerConsentEl.checked = Boolean(draft?.consent);
  }

  function createAxisBars(axes, tone = "final") {
    return `
      <div class="portal-axis-bars">
        ${AXIS_ORDER.map((axis) => {
          const value = Number(axes?.[axis] || 0);
          return `
            <div class="portal-axis-bar portal-axis-bar--${tone}">
              <span>${AXIS_LABELS[axis]}</span>
              <strong>${value}</strong>
              <div class="portal-axis-track"><i style="width:${Math.max(0, Math.min(100, value))}%"></i></div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderAxisCompare(questionnaireAxes, reservationAxes, adjustedAxes) {
    if (!axisCompareEl) return;
    axisCompareEl.innerHTML = `
      <div class="portal-compare-grid">
        <article class="portal-compare-card">
          <h3>アンケート時点の5軸</h3>
          <p class="admin-note">回答内容からの初期プロフィール</p>
          ${createAxisBars(questionnaireAxes, "survey")}
        </article>
        <article class="portal-compare-card">
          <h3>予約完了時の5軸</h3>
          <p class="admin-note">予約完了時のプロフィール</p>
          ${createAxisBars(reservationAxes, "reservation")}
        </article>
        <article class="portal-compare-card portal-compare-card--full">
          <h3>最終提案の5軸</h3>
          <p class="admin-note">スタッフが調整した最終プロフィール</p>
          ${createAxisBars(adjustedAxes, "final")}
        </article>
      </div>
    `;
  }

  function updateFinalAxisPreview() {
    if (!finalAxisPreviewEl) return;
    finalAxisPreviewEl.innerHTML = createAxisBars(getCurrentFinalAxes(), "final");
  }

  function buildCustomerQrValue() {
    const reservationCode = selectedReservation?.reservation_code || "draft";
    const target = new URL("customer-top.html", window.location.href);
    target.searchParams.set("reservation", reservationCode);
    return target.toString();
  }

  function renderQrCode(force = false) {
    if (!qrPreviewEl) return;
    if (!window.QRCode) {
      qrPreviewEl.textContent = "QR ライブラリを読み込めなかったため表示できません。";
      return;
    }
    if (!force) {
      qrPreviewEl.textContent = "QR コードがここに表示されます";
      return;
    }
    if (!selectedReservation) return;
    qrPreviewEl.innerHTML = "";
    currentQrCode = new window.QRCode(qrPreviewEl, {
      text: buildCustomerQrValue(),
      width: 180,
      height: 180,
      colorDark: "#3d2f24",
      colorLight: "#fffdf9",
      correctLevel: window.QRCode.CorrectLevel.M
    });
  }

  function createAxisBadgeRow(axes) {
    return `<div class="admin-axis-badge-row">${AXIS_ORDER.map((axis) => {
      return `<span class="admin-axis-badge"><small>${AXIS_LABELS[axis]}</small><strong>${Number(axes?.[axis] || 0)}</strong></span>`;
    }).join("")}</div>`;
  }

  function normalizeAxes(axes) {
    return window.FragranceMasterData.normalizeAxes(axes);
  }

  function getSlotLabel(reservation) {
    const slot = slotMap.get(reservation?.slot_id);
    if (!slot) return reservation?.slot_label || UI.unset;
    return `${slot.slot_date || ""} ${String(slot.slot_time || "").slice(0, 5)} ${slot.slot_label || ""}`.trim();
  }

  function buildQuestionAnswerRows(questionnaire) {
    if (!questionnaire) {
      return `<article class="admin-panel admin-panel-soft"><p class="admin-empty">${UI.questionnaireMissing}</p></article>`;
    }

    const step1Answers = questionnaire.step1_answers_json || {};
    const step2Answers = questionnaire.step2_answers_json || {};
    const branchKey = questionnaire.branch_key || "floral";
    const step2Schema = STEP2_SCHEMA[branchKey] || STEP2_SCHEMA.floral;
    const blocks = [
      {
        title: "STEP1",
        items: STEP1_SCHEMA.map((schema) => ({
          label: schema.title,
          value: step1Answers[schema.id] || "-"
        }))
      },
      {
        title: "STEP2",
        items: step2Schema.map((schema) => ({
          label: schema.title,
          value: step2Answers[schema.id] || "-"
        })).concat([
          {
            label: UI.q8,
            value: step2Answers.Q8 || "-"
          }
        ])
      }
    ];

    return blocks.map((block) => {
      return `
        <article class="admin-panel admin-panel-soft">
          <h3>${block.title}</h3>
          <div class="admin-card-list">
            ${block.items.map((item) => `<div class="admin-meta-row"><span>${item.label}</span><strong>${item.value}</strong></div>`).join("")}
          </div>
        </article>
      `;
    }).join("");
  }

  function getCurrentFinalAxes() {
    return AXIS_ORDER.reduce((acc, axis) => {
      acc[axis] = Number(document.getElementById(`workspace-axis-${axis}`).value || 0);
      return acc;
    }, {});
  }

  function updateAxisTotal() {
    if (!axisTotalEl) return;
    const total = AXIS_ORDER.reduce((sum, axis) => sum + Number(document.getElementById(`workspace-axis-${axis}`).value || 0), 0);
    axisTotalEl.textContent = `\u5408\u8a08 ${total}`;
    axisTotalEl.className = total === 100 ? "admin-note admin-note-success" : "admin-note admin-note-warning";
    updateFinalAxisPreview();
  }

  function normalizeCurrentAxes() {
    const currentAxes = getCurrentFinalAxes();
    const total = AXIS_ORDER.reduce((sum, axis) => sum + Number(currentAxes[axis] || 0), 0);
    if (!total) return;

    let remainder = 100;
    const normalized = AXIS_ORDER.map((axis, index) => {
      if (index === AXIS_ORDER.length - 1) {
        return [axis, remainder];
      }
      const nextValue = Math.round((Number(currentAxes[axis] || 0) / total) * 100);
      remainder -= nextValue;
      return [axis, nextValue];
    });

    normalized.forEach(([axis, value]) => {
      document.getElementById(`workspace-axis-${axis}`).value = String(value);
    });
    updateAxisTotal();
    renderRecommendedMaterials();
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
    if (!derived) {
      updateAxisTotal();
      renderRecommendedMaterials();
      return;
    }
    AXIS_ORDER.forEach((axis) => {
      document.getElementById(`workspace-axis-${axis}`).value = String(derived[axis]);
    });
    updateAxisTotal();
    renderRecommendedMaterials();
  }

  function normalizeRecipeAmounts() {
    const amountInputs = Array.from(recipeListEl.querySelectorAll('[data-recipe-field="amount"]'));
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

  function getMaterialOptions(selectedCode) {
    return [`<option value="">${UI.materialPlaceholder}</option>`].concat(materialRows.map((row) => {
      const selected = row.material_code === selectedCode ? " selected" : "";
      return `<option value="${row.material_code}"${selected}>${row.material_name} / ${row.category || UI.unset}</option>`;
    })).join("");
  }

  function createRecipeRow(item = {}) {
    const row = document.createElement("div");
    row.className = "admin-editor-card";
    row.innerHTML = `
      <input data-recipe-field="role" type="hidden" value="${item.role || "ingredient"}">
      <input data-recipe-field="lot" type="hidden" value="${item.lot || ""}">
      <input data-recipe-field="note" type="hidden" value="${item.note || ""}">
      <div class="portal-recipe-row">
        <label>${UI.material}
          <select data-recipe-field="material_code">${getMaterialOptions(item.material_code || "")}</select>
        </label>
        <label>${UI.amount}
          <input data-recipe-field="amount" type="number" min="0" step="0.1" value="${Number(item.amount || 0)}">
        </label>
        <button class="admin-btn secondary" type="button" data-remove-recipe>${UI.removeRow}</button>
      </div>
    `;
    row.querySelector("[data-remove-recipe]").addEventListener("click", () => {
      row.remove();
      refreshFinalAxesFromRecipe();
    });
    row.querySelector('[data-recipe-field="material_code"]').addEventListener("change", refreshFinalAxesFromRecipe);
    row.querySelector('[data-recipe-field="amount"]').addEventListener("input", refreshFinalAxesFromRecipe);
    recipeListEl.appendChild(row);
  }

  function renderRecipeRows(items) {
    recipeListEl.innerHTML = "";
    (items || []).forEach((item) => createRecipeRow(item));
    if (!recipeListEl.children.length) {
      createRecipeRow({ role: "ingredient" });
    }
  }

  function collectRecipeItems() {
    return Array.from(recipeListEl.children).map((row) => {
      const materialCode = row.querySelector('[data-recipe-field="material_code"]').value;
      const material = materialRows.find((entry) => entry.material_code === materialCode);
      return {
        role: row.querySelector('[data-recipe-field="role"]').value || "ingredient",
        material_code: materialCode || null,
        material_name: material?.material_name || null,
        amount: Number(row.querySelector('[data-recipe-field="amount"]').value || 0),
        lot: row.querySelector('[data-recipe-field="lot"]').value.trim() || null,
        note: row.querySelector('[data-recipe-field="note"]').value.trim() || null
      };
    }).filter((item) => item.material_code);
  }

  function renderRecommendedMaterials() {
    const questionnaireRanked = window.FragranceMasterData.rankMaterials(selectedQuestionnaire?.final_axes || {}, materialRows, 3);
    const reservationRanked = window.FragranceMasterData.rankMaterials(selectedReservation?.axes || {}, materialRows, 3);
    const finalRanked = window.FragranceMasterData.rankMaterials(getCurrentFinalAxes(), materialRows, 3);
    if (!questionnaireRanked.length && !reservationRanked.length && !finalRanked.length) {
      recommendedMaterialsEl.innerHTML = `<p class="admin-empty">${UI.noRecommended}</p>`;
      return;
    }

    const renderGroup = (title, note, rows) => `
      <article class="admin-item-card">
        <h3>${title}</h3>
        <p class="admin-note">${note}</p>
        ${rows.length ? rows.map((row) => `
          <div class="portal-material-recommendation">
            <div class="admin-item-head">
              <div>
                <p class="admin-item-code">${row.material_code}</p>
                <h4>${row.material_name}</h4>
              </div>
              <span class="admin-status-pill is-active">${UI.near} ${row.score}</span>
            </div>
            <div class="admin-meta-row"><span>${UI.category}</span><strong>${row.category || UI.unset}</strong></div>
            ${createAxisBadgeRow(row.point_axes)}
            <div class="admin-actions">
              <button class="admin-btn secondary" type="button" data-add-material="${row.material_code}">${UI.addToRecipe}</button>
            </div>
          </div>
        `).join("") : `<p class="admin-empty">${UI.noRecommended}</p>`}
      </article>
    `;

    recommendedMaterialsEl.innerHTML = [
      renderGroup("アンケート基準原料割当", "回答時点の方向性の原料と割合", questionnaireRanked),
      renderGroup("予約時基準原料割当", "予約時点の方向性の原料と割合", reservationRanked),
      renderGroup("最終提案候補", "現在の最終5軸に近い候補", finalRanked)
    ].join("");

    recommendedMaterialsEl.querySelectorAll("[data-add-material]").forEach((button) => {
      button.addEventListener("click", () => {
        createRecipeRow({ material_code: button.dataset.addMaterial, role: "ingredient" });
      });
    });
  }

  function fillWorkshopForm(reservation, questionnaire, workshop) {
    const baseAxes = workshop?.final_axes || reservation?.axes || questionnaire?.adjusted_axes || questionnaire?.final_axes || {};
    AXIS_ORDER.forEach((axis) => {
      document.getElementById(`workspace-axis-${axis}`).value = Number(baseAxes?.[axis] || 0);
    });
    document.getElementById("workspace-record-id").value = workshop?.id || "";
    document.getElementById("workspace-preparation-note").value = workshop?.preparation_note || reservation?.staff_memo || "";
    document.getElementById("workspace-staff-summary").value = workshop?.staff_summary || "";
    document.getElementById("workspace-session-status").value = workshop?.status || "draft";
    if (customerFeedbackEl) {
      customerFeedbackEl.value = window.sessionStorage.getItem(`fragranceCustomerFeedback:${reservation?.id || ""}`) || "";
    }
    renderRecipeRows(workshop?.recipe_items || []);
    updateAxisTotal();
    renderRecommendedMaterials();
  }

  function renderDetail() {
    if (!selectedReservation) {
      detailSummaryEl.innerHTML = `<p class="admin-empty">${UI.selectReservation}</p>`;
      questionSummaryEl.innerHTML = "";
      questionAnswersEl.innerHTML = "";
      if (axisCompareEl) axisCompareEl.innerHTML = "";
      form.hidden = true;
      renderQrCode(false);
      return;
    }

    const slot = slotMap.get(selectedReservation.slot_id);
    const reservationAxes = selectedReservation.axes || {};
    const questionnaireAxes = selectedQuestionnaire?.final_axes || {};
    const adjustedAxes = selectedWorkshop?.final_axes || getCurrentFinalAxes();
    customerDraft = readCustomerDraft(selectedReservation);

    detailSummaryEl.innerHTML = `
      <div class="portal-pill-summary">
        <span class="portal-pill-field">お客様名 : <strong>${customerDraft?.name || selectedReservation.customer_name || "未入力"}</strong></span>
        <span class="portal-pill-field">個人情報同意 : <strong>${customerDraft?.consent ? "同意済み" : "未取得"}</strong></span>
        <span class="portal-pill-field">メール : <strong>${customerDraft?.email || "未入力"}</strong></span>
        <span class="portal-pill-field">電話 : <strong>${customerDraft?.phone || "任意"}</strong></span>
        <span class="portal-pill-field">予約枠 <strong>${getSlotLabel(selectedReservation)}</strong></span>
        <span class="portal-pill-field">来店目的 <strong>${selectedReservation.visit_type || "-"}</strong></span>
      </div>
      <div class="admin-card-list">
        <div class="admin-meta-row"><span>${UI.reservationCode}</span><strong>${selectedReservation.reservation_code || "-"}</strong></div>
        <div class="admin-meta-row"><span>${UI.staff}</span><strong>${slot?.instructor_name || UI.unset}</strong></div>
        <div class="admin-meta-row"><span>${UI.guestCount}</span><strong>${selectedReservation.guest_count || "-"}</strong></div>
        <div class="admin-meta-row"><span>${UI.reservationStatus}</span><strong>${selectedReservation.status || "-"}</strong></div>
      </div>
    `;

    questionSummaryEl.innerHTML = `
      <article class="admin-panel admin-panel-soft">
        <div class="admin-card-list">
          <div class="admin-meta-row"><span>${UI.branch}</span><strong>${selectedQuestionnaire?.branch_key || "-"}</strong></div>
          <div class="admin-meta-row"><span>${UI.finish}</span><strong>${selectedQuestionnaire?.selected_finish || "-"}</strong></div>
          <div class="admin-meta-row"><span>${UI.summary}</span><strong>${selectedQuestionnaire?.summary_headline || "-"}</strong></div>
        </div>
      </article>
    `;

    questionAnswersEl.innerHTML = buildQuestionAnswerRows(selectedQuestionnaire);
    renderAxisCompare(questionnaireAxes, reservationAxes, adjustedAxes);
    form.hidden = false;
    renderQrCode(false);
  }

  async function loadReservationDetail(reservationId) {
    selectedReservation = reservations.find((row) => row.id === reservationId) || null;
    if (!selectedReservation) {
      selectedQuestionnaire = null;
      selectedWorkshop = null;
      renderDetail();
      return;
    }

    const [questionnaireRows, workshopRows] = await Promise.all([
      selectedReservation.questionnaire_result_id
        ? window.AdminData.listRows("questionnaire_results", {
            filters: [{ operator: "eq", column: "id", value: selectedReservation.questionnaire_result_id }],
            limit: 1
          }).catch(() => [])
        : Promise.resolve([]),
      window.AdminData.listRows("workshop_sessions", {
        filters: [{ operator: "eq", column: "reservation_id", value: reservationId }],
        limit: 1
      }).catch(() => [])
    ]);

    selectedQuestionnaire = questionnaireRows[0] || null;
    selectedWorkshop = workshopRows[0] || null;
    fillWorkshopForm(selectedReservation, selectedQuestionnaire, selectedWorkshop);
    renderDetail();
  }

  function matchesKeyword(row, keyword) {
    if (!keyword) return true;
    const text = [row.reservation_code, row.slot_label, row.summary_headline, row.summary_body, row.staff_memo]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes(keyword.toLowerCase());
  }

  function renderReservationList() {
    const dateValue = document.getElementById("workspace-filter-date").value;
    const statusValue = document.getElementById("workspace-filter-status").value;
    const keywordValue = document.getElementById("workspace-filter-keyword").value.trim();

    const filtered = reservations.filter((row) => {
      const slot = slotMap.get(row.slot_id);
      if (dateValue && (slot?.slot_date || "") !== dateValue) return false;
      if (statusValue && row.status !== statusValue) return false;
      return matchesKeyword(row, keywordValue);
    });

    reservationCountEl.textContent = `${filtered.length}${UI.countSuffix}`;
    if (kpiUpcomingEl) kpiUpcomingEl.textContent = String(reservations.filter((row) => row.status === "confirmed").length);
    if (kpiDraftEl) kpiDraftEl.textContent = String(reservations.filter((row) => row.status !== "completed").length);
    if (kpiCompletedEl) kpiCompletedEl.textContent = String(reservations.filter((row) => row.status === "completed").length);

    reservationListEl.innerHTML = "";
    emptyEl.hidden = filtered.length > 0;

    filtered.forEach((row) => {
      const slot = slotMap.get(row.slot_id);
      const isSelected = row.id === selectedReservation?.id;
      const article = document.createElement("article");
      article.className = `admin-item-card${isSelected ? " is-selected" : ""}`;
      article.innerHTML = `
        <div class="admin-item-head">
          <div>
            <p class="admin-item-code">${row.reservation_code || ""}</p>
            <h3>${row.summary_headline || UI.reservationFallback}</h3>
          </div>
          <span class="admin-status-pill ${row.status === "completed" ? "is-active" : "is-paused"}">${row.status || "confirmed"}</span>
        </div>
        <div class="admin-meta-row"><span>${UI.slot}</span><strong>${slot?.slot_date || ""} ${String(slot?.slot_time || "").slice(0, 5)} ${row.slot_label || ""}</strong></div>
        <div class="admin-meta-row"><span>${UI.visitType}</span><strong>${row.visit_type || "-"}</strong></div>
        <div class="admin-meta-row"><span>${UI.guestCount}</span><strong>${row.guest_count || "-"}</strong></div>
        <div class="admin-actions">
          <button class="admin-btn secondary" type="button" data-open-reservation="${row.id}">${UI.openReservation}</button>
        </div>
      `;
      reservationListEl.appendChild(article);
    });

    reservationListEl.querySelectorAll("[data-open-reservation]").forEach((button) => {
      button.addEventListener("click", () => loadReservationDetail(button.dataset.openReservation));
    });
  }

  async function loadBaseData() {
    const [reservationRows, slotRows, materialPointRows] = await Promise.all([
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }] }).catch(() => []),
      window.AdminData.listRows("reservation_slots", {
        orders: [{ column: "slot_date", ascending: true }, { column: "slot_time", ascending: true }]
      }).catch(() => []),
      window.AdminData.listRows("material_points", {
        filters: [{ operator: "eq", column: "is_active", value: true }],
        orders: [{ column: "sort_order", ascending: true }]
      }).catch(() => [])
    ]);

    reservations = reservationRows || [];
    slotMap = new Map((slotRows || []).map((row) => [row.id, row]));
    materialRows = (materialPointRows && materialPointRows.length ? materialPointRows : DEFAULT_MATERIALS).map((row) => {
      return window.FragranceMasterData.normalizeMaterialRow(row);
    });
    renderReservationList();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!selectedReservation) return;

    const payload = {
      reservation_id: selectedReservation.id,
      questionnaire_result_id: selectedReservation.questionnaire_result_id || null,
      preparation_note: document.getElementById("workspace-preparation-note").value.trim() || null,
      staff_summary: document.getElementById("workspace-staff-summary").value.trim() || null,
      pre_visit_axes: normalizeAxes(selectedQuestionnaire?.final_axes || selectedReservation.axes || {}),
      reservation_axes: normalizeAxes(selectedReservation.axes || {}),
      final_axes: normalizeAxes(getCurrentFinalAxes()),
      recipe_items: collectRecipeItems(),
      status: submitModeInput.value === "complete" ? "completed" : (document.getElementById("workspace-session-status").value || "draft"),
      updated_at: new Date().toISOString()
    };

    const recordId = document.getElementById("workspace-record-id").value;

    try {
      let workshopResponse;
      if (recordId) {
        workshopResponse = await window.AdminData.updateRow("workshop_sessions", recordId, payload);
      } else {
        workshopResponse = await window.AdminData.insertRow("workshop_sessions", payload);
      }

      await window.AdminData.updateRow("reservations", selectedReservation.id, {
        staff_memo: payload.preparation_note || null,
        status: submitModeInput.value === "complete" ? "completed" : selectedReservation.status,
        updated_at: new Date().toISOString()
      });

      if (customerFeedbackEl && selectedReservation?.id) {
        window.sessionStorage.setItem(`fragranceCustomerFeedback:${selectedReservation.id}`, customerFeedbackEl.value.trim());
      }

      document.getElementById("workspace-record-id").value = workshopResponse?.[0]?.id || recordId || "";
      setStatus(submitModeInput.value === "complete" ? UI.completeSaved : UI.draftSaved, "success");
      await loadBaseData();
      await loadReservationDetail(selectedReservation.id);
    } catch (error) {
      setStatus(error?.message || UI.saveError, "error");
    }
  });

  addRecipeButton.addEventListener("click", () => {
    createRecipeRow({ role: "ingredient" });
  });

  document.getElementById("workspace-save-draft").addEventListener("click", () => {
    submitModeInput.value = "draft";
  });

  document.getElementById("workspace-save-complete").addEventListener("click", () => {
    submitModeInput.value = "complete";
  });

  AXIS_ORDER.forEach((axis) => {
    document.getElementById(`workspace-axis-${axis}`).addEventListener("input", () => {
      updateAxisTotal();
      renderRecommendedMaterials();
    });
  });

  if (normalizeButton) {
    normalizeButton.addEventListener("click", normalizeRecipeAmounts);
  }

  filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    renderReservationList();
  });

  if (customerOpenButton) {
    customerOpenButton.addEventListener("click", () => {
      fillCustomerForm(customerDraft);
      openCustomerModal();
    });
  }

  document.querySelectorAll("[data-customer-close]").forEach((button) => {
    button.addEventListener("click", closeCustomerModal);
  });

  if (customerFormEl) {
    customerFormEl.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!selectedReservation) return;
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
      persistCustomerDraft(selectedReservation, customerDraft);
      closeCustomerModal();
      renderDetail();
      renderReservationList();
      setStatus("お客様情報をブラウザ下書きとして保存しました。", "success");
    });
  }

  if (generateQrButton) {
    generateQrButton.addEventListener("click", () => {
      renderQrCode(true);
    });
  }

  async function bootstrap() {
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    const role = window.AdminAuth.resolvePortalRole(session, window.AdminAuth.readRoleFromLocation());
    window.AdminAuth.renderAdminHeader("workspace", {
      role,
      session,
      brandText: "Fragrance STAFF_お客様詳細画面",
      links: [
        { href: "admin-reservations.html", label: "戻る", key: "reservations" }
      ]
    });
    window.AdminAuth.persistPortalRole(role);
    form.hidden = true;
    setStatus(UI.saveHint);
    await loadBaseData();
    const reservationId = new URLSearchParams(window.location.search).get("reservation");
    if (selectorCardEl) selectorCardEl.hidden = Boolean(reservationId);
    if (reservationId) {
      await loadReservationDetail(reservationId);
    } else {
      renderDetail();
    }
  }

  bootstrap();
})();
