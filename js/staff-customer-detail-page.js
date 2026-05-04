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
  const headerEl = document.getElementById("admin-header");
  const summaryCardEl = document.querySelector(".staff-detail-summary-card");
  const summaryToggleEl = document.getElementById("customer-summary-toggle");
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
  const preparationNoteDisplayEl = document.getElementById("preparation-note-display");
  const staffSummaryEl = document.getElementById("staff-summary");
  const hearingNoteEl = document.getElementById("hearing-note");
  const recipeListEl = document.getElementById("recipe-list");
  const recipeSummaryListEl = document.getElementById("recipe-summary-list");
  const previsitRecipeSummaryEl = document.getElementById("previsit-recipe-summary");
  const previsitRecipeEditOpenEl = document.getElementById("previsit-recipe-edit-open");
  const copyPrevisitToFinalEl = document.getElementById("copy-previsit-to-final");
  const recipeBaseAxisPreviewEl = document.getElementById("recipe-base-axis-preview");
  const recipeDerivedAxisPreviewEl = document.getElementById("recipe-derived-axis-preview");
  const previsitRecipeBaseAxisPreviewEl = document.getElementById("previsit-recipe-base-axis-preview");
  const previsitRecipeDerivedAxisPreviewEl = document.getElementById("previsit-recipe-derived-axis-preview");
  const recipeModalEl = document.getElementById("recipe-modal");
  const previsitRecipeModalEl = document.getElementById("previsit-recipe-modal");
  const recipeEditOpenEl = document.getElementById("recipe-edit-open");
  const previsitRecipeListEl = document.getElementById("previsit-recipe-list");
  const addRecipeRowEl = document.getElementById("add-recipe-row");
  const addPrevisitRecipeRowEl = document.getElementById("add-previsit-recipe-row");
  const applyRecommendedRecipeEl = document.getElementById("apply-recommended-recipe");
  const applyPrevisitRecommendedRecipeEl = document.getElementById("apply-previsit-recommended-recipe");
  const normalizeRecipeEl = document.getElementById("normalize-recipe");
  const normalizePrevisitRecipeEl = document.getElementById("normalize-previsit-recipe");
  const axisTotalEl = document.getElementById("axis-total");
  const finalAxisPreviewEl = document.getElementById("final-axis-preview");
  const customerFeedbackEl = document.getElementById("customer-feedback");
  const saveStatusEl = document.getElementById("save-status");
  const qrPreviewEl = document.getElementById("qr-preview");
  const saveDraftEl = document.getElementById("save-draft");
  const saveDraftNoteEl = document.getElementById("save-draft-note");
  const saveCompleteEl = document.getElementById("save-complete");
  const generateQrEl = document.getElementById("generate-qr");
  const productNameEl = document.getElementById("product-name");
  const personalInfoConsentEl = document.getElementById("personal-info-consent");
  const thirdPartyOrderConsentEl = document.getElementById("third-party-order-consent");
  const customerModalEl = document.getElementById("customer-modal");
  const customerFormEl = document.getElementById("customer-form");
  const customerEditOpenEl = document.getElementById("customer-edit-open");
  const customerNameEl = document.getElementById("customer-name");
  const customerEmailEl = document.getElementById("customer-email");
  const customerPhoneEl = document.getElementById("customer-phone");
  const customerActionModalEl = document.getElementById("customer-action-modal");
  const customerActionModalTitleEl = document.getElementById("customer-action-modal-title");
  const customerActionAxisPreviewEl = document.getElementById("customer-action-axis-preview");
  const customerActionAxisControlsEl = document.getElementById("customer-action-axis-controls");
  const productNamePreviewEl = document.getElementById("product-name-preview");
  const consentStaffNameEl = document.getElementById("consent-staff-name");
  const consentCheckedAtEl = document.getElementById("consent-checked-at");
  const CUSTOMER_ACTION_TITLES = {
    fragrance: "香りのバランス調整",
    product: "香水の名前を決めましょう",
    consent: "確認事項"
  };

  let session = null;
  let staffProfile = null;
  let reservation = null;
  let slot = null;
  let questionnaire = null;
  let workshop = null;
  let fragranceProduct = null;
  let productQrCode = null;
  let materialRows = [];
  let materialDataReady = false;
  let customerDraft = null;
  let customerActionSnapshot = null;
  let recipeModalSnapshot = null;
  let previsitRecipeItems = [];
  let previsitRecipeModalSnapshot = null;

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

  function getPrevisitRecipeKey() {
    return reservation?.id ? `fragrancePrevisitRecipe:${reservation.id}` : "";
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

  function readPrevisitRecipeItems() {
    try {
      const key = getPrevisitRecipeKey();
      if (!key) return [];
      const stored = window.sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  function persistPrevisitRecipeItems() {
    const key = getPrevisitRecipeKey();
    if (key) {
      window.sessionStorage.setItem(key, JSON.stringify(previsitRecipeItems));
    }
  }

  function getBackHref() {
    return { href: window.AdminAuth.appendRoleToHref("staff-reservations.html", "staff"), useHistory: false };
  }

  function renderHeader() {
    if (!headerEl || !window.AdminAuth?.renderAdminHeader) return;
    window.AdminAuth.renderAdminHeader("staff-customer-detail", {
      role: "staff",
      session,
      brandText: "Customer Detail",
      roleLabel: "",
      links: [
        { href: "staff-dashboard.html", label: "ダッシュボード", key: "staff-dashboard" },
        { href: "staff-reservations.html", label: "予約一覧", key: "reservations" },
        { href: "staff-slots.html", label: "予約枠", key: "slots" }
      ]
    });
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

  function clampAxisValue(value) {
    return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
  }

  function normalizeRecipeAxesForDisplay(rawAxes, baseAxes) {
    if (!rawAxes || !hasAxisValue(rawAxes)) return null;
    const normalizedRaw = normalizeAxes(rawAxes);
    const normalizedBase = normalizeAxes(baseAxes || {});
    if (!hasAxisValue(normalizedBase)) {
      return AXIS_ORDER.reduce((acc, axis) => {
        acc[axis] = clampAxisValue(normalizedRaw[axis]);
        return acc;
      }, {});
    }
    const rawTotal = AXIS_ORDER.reduce((sum, axis) => sum + Number(normalizedRaw[axis] || 0), 0);
    const baseTotal = AXIS_ORDER.reduce((sum, axis) => sum + Number(normalizedBase[axis] || 0), 0);
    const scale = rawTotal > 0 && baseTotal > 0 ? baseTotal / rawTotal : 1;
    return AXIS_ORDER.reduce((acc, axis) => {
      const scaledRaw = Number(normalizedRaw[axis] || 0) * scale;
      acc[axis] = clampAxisValue((Number(normalizedBase[axis] || 0) * 0.65) + (scaledRaw * 0.35));
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

  function getBaseSurveyAxes() {
    return normalizeAxes(reservation?.axes || questionnaire?.adjusted_axes || questionnaire?.final_axes || {});
  }

  function renderCustomerActionAxisControls() {
    if (!customerActionAxisControlsEl) return;
    const axes = getCurrentFinalAxes();
    customerActionAxisControlsEl.innerHTML = AXIS_ORDER.map((axis) => `
      <label class="staff-customer-axis-control">
        <span>${escapeHtml(AXIS_LABELS[axis])}</span>
        <input type="range" min="0" max="100" step="1" value="${Number(axes[axis] || 0)}" data-customer-axis-range="${axis}">
        <strong data-customer-axis-value="${axis}">${Number(axes[axis] || 0)}</strong>
      </label>
    `).join("");
    customerActionAxisControlsEl.querySelectorAll("[data-customer-axis-range]").forEach((input) => {
      input.addEventListener("input", () => {
        const axis = input.dataset.customerAxisRange;
        const axisInput = document.getElementById(`axis-${axis}`);
        if (axisInput) axisInput.value = input.value;
        updateAxisTotal();
      });
    });
  }

  function syncCustomerActionAxisControls() {
    if (!customerActionAxisControlsEl) return;
    const axes = getCurrentFinalAxes();
    AXIS_ORDER.forEach((axis) => {
      const range = customerActionAxisControlsEl.querySelector(`[data-customer-axis-range="${axis}"]`);
      const value = customerActionAxisControlsEl.querySelector(`[data-customer-axis-value="${axis}"]`);
      const axisValue = Number(axes[axis] || 0);
      if (range && range.value !== String(axisValue)) range.value = String(axisValue);
      if (value) value.textContent = String(axisValue);
    });
  }

  function renderRecipeAxisCompare() {
    const baseAxes = getBaseSurveyAxes();
    const derivedAxes = calculateRecipeDerivedAxes();
    if (recipeBaseAxisPreviewEl) {
      recipeBaseAxisPreviewEl.innerHTML = hasAxisValue(baseAxes)
        ? `${createRadarGraph(baseAxes, "survey")}${createAxisStatGrid(baseAxes)}`
        : `<p class="admin-empty">アンケート結果がありません。</p>`;
    }
    if (recipeDerivedAxisPreviewEl) {
      recipeDerivedAxisPreviewEl.innerHTML = derivedAxes
        ? `${createRadarGraph(derivedAxes, "final")}${createAxisStatGrid(derivedAxes)}`
        : `<p class="admin-empty">配合を選択すると表示されます。</p>`;
    }
  }

  function renderPrevisitRecipeAxisCompare() {
    const baseAxes = getBaseSurveyAxes();
    const derivedAxes = calculateRecipeDerivedAxes(collectPrevisitRecipeItems(), baseAxes);
    if (previsitRecipeBaseAxisPreviewEl) {
      previsitRecipeBaseAxisPreviewEl.innerHTML = hasAxisValue(baseAxes)
        ? `${createRadarGraph(baseAxes, "survey")}${createAxisStatGrid(baseAxes)}`
        : `<p class="admin-empty">アンケート結果がありません。</p>`;
    }
    if (previsitRecipeDerivedAxisPreviewEl) {
      previsitRecipeDerivedAxisPreviewEl.innerHTML = derivedAxes
        ? `${createRadarGraph(derivedAxes, "final")}${createAxisStatGrid(derivedAxes)}`
        : `<p class="admin-empty">配合を選択すると表示されます。</p>`;
    }
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
    if (customerActionAxisPreviewEl) {
      customerActionAxisPreviewEl.innerHTML = createRadarGraph(axes, "final");
    }
    syncCustomerActionAxisControls();
    renderAxisCompare();
  }

  function getCustomerDisplayName() {
    return reservation?.customer_name || customerDraft?.name || "未入力";
  }

  function getCustomerDisplayEmail() {
    return reservation?.customer_email || customerDraft?.email || "未入力";
  }

  function setSummaryCollapsed(collapsed) {
    if (!summaryCardEl) return;
    summaryCardEl.classList.toggle("is-collapsed", collapsed);
    if (summaryToggleEl) {
      summaryToggleEl.setAttribute("aria-expanded", String(!collapsed));
      summaryToggleEl.textContent = collapsed ? "詳細を開く" : "詳細を閉じる";
    }
  }

  function renderCustomerProfile() {
    if (!profileEl) return;
    customerDraft = readCustomerDraft();
    const name = getCustomerDisplayName();
    const email = getCustomerDisplayEmail();
    const branchLabel = BRANCH_LABELS[questionnaire?.branch_key] || questionnaire?.branch_key || formatVisitType(reservation?.visit_type);
    const memberStatus = reservation?.customer_id ? "登録済み" : "未登録";
    const qrStatus = productQrCode?.is_public || productQrCode?.status === "active" ? "QR発行済み" : "未発行";
    const mailStatus = productQrCode?.is_public || productQrCode?.status === "active" ? "メール未送信" : "QR発行前";
    const workshopStatus = workshop?.status === "completed" || reservation?.status === "completed"
      ? "完了"
      : "進行中";
    profileEl.innerHTML = `
      <div class="staff-profile-card">
        <div class="staff-profile-name-line">
          <span>お客様名：</span>
          <strong>${escapeHtml(name)}</strong>
          <small>様</small>
        </div>
        <dl class="staff-profile-detail-list">
          <div><dt>予約日時</dt><dd>${escapeHtml(getSlotLabel())}</dd></div>
          <div><dt>メール</dt><dd>${escapeHtml(email)}</dd></div>
        </dl>
      </div>
    `;
    const setText = (id, value) => {
      const target = document.getElementById(id);
      if (target) target.textContent = value;
    };
    setText("staff-detail-branch", branchLabel);
    setText("staff-detail-member-status", memberStatus);
    setText("staff-detail-qr-status", qrStatus);
    setText("staff-detail-workshop-status", workshopStatus);
    setText("staff-detail-summary-qr", qrStatus);
    setText("staff-detail-mail-status", mailStatus);
    setText("staff-detail-summary-workshop", workshopStatus);
  }

  function updateCustomerActionSummary() {
    if (productNamePreviewEl) {
      productNamePreviewEl.textContent = getProductName() || "未入力";
    }
    document.querySelectorAll("[data-product-name-suggestion]").forEach((item) => {
      item.classList.toggle("is-selected", item.dataset.productNameSuggestion === getProductName());
    });
    if (consentStaffNameEl) {
      const staffName = window.AdminAuth?.getStaffDisplayName
        ? window.AdminAuth.getStaffDisplayName(session)
        : staffProfile?.staff_name || staffProfile?.name || "-";
      consentStaffNameEl.textContent = formatDisplayValue(staffName, "-");
    }
    if (consentCheckedAtEl) {
      const hasConsent = Boolean(personalInfoConsentEl?.checked || thirdPartyOrderConsentEl?.checked);
      const consentDate = fragranceProduct?.consented_at
        ? new Date(fragranceProduct.consented_at)
        : (hasConsent ? new Date() : null);
      consentCheckedAtEl.textContent = consentDate && !Number.isNaN(consentDate.getTime())
        ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeStyle: "short" }).format(consentDate)
        : "-";
    }
  }

  function getCustomerActionSnapshot() {
    return {
      axes: getCurrentFinalAxes(),
      customerFeedback: customerFeedbackEl?.value || "",
      productName: productNameEl?.value || "",
      personalInfoConsent: Boolean(personalInfoConsentEl?.checked),
      thirdPartyOrderConsent: Boolean(thirdPartyOrderConsentEl?.checked)
    };
  }

  function restoreCustomerActionSnapshot(snapshot) {
    if (!snapshot) return;
    setFinalAxisInputs(snapshot.axes || {});
    if (customerFeedbackEl) customerFeedbackEl.value = snapshot.customerFeedback || "";
    if (productNameEl) productNameEl.value = snapshot.productName || "";
    if (personalInfoConsentEl) personalInfoConsentEl.checked = Boolean(snapshot.personalInfoConsent);
    if (thirdPartyOrderConsentEl) thirdPartyOrderConsentEl.checked = Boolean(snapshot.thirdPartyOrderConsent);
    updateAxisTotal();
    updateCustomerActionSummary();
    renderQr(false);
  }

  function isCustomerActionDirty() {
    return customerActionSnapshot
      ? JSON.stringify(getCustomerActionSnapshot()) !== JSON.stringify(customerActionSnapshot)
      : false;
  }

  function openCustomerActionModal(action) {
    if (!customerActionModalEl) return;
    const activeAction = CUSTOMER_ACTION_TITLES[action] ? action : "fragrance";
    customerActionSnapshot = getCustomerActionSnapshot();
    if (customerActionModalTitleEl) {
      customerActionModalTitleEl.textContent = CUSTOMER_ACTION_TITLES[activeAction];
    }
    customerActionModalEl.querySelectorAll("[data-customer-action-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.customerActionPanel !== activeAction;
    });
    updateAxisTotal();
    renderCustomerActionAxisControls();
    updateCustomerActionSummary();
    customerActionModalEl.hidden = false;
    document.body.classList.add("portal-modal-open");
    customerActionModalEl.querySelector(".staff-customer-action-close")?.focus();
  }

  function closeCustomerActionModal(options = {}) {
    if (!customerActionModalEl) return;
    if (!options.apply && isCustomerActionDirty()) {
      const shouldDiscard = window.confirm("変更内容を反映せずに閉じますか？");
      if (!shouldDiscard) return;
      restoreCustomerActionSnapshot(customerActionSnapshot);
      setStatus("変更内容を反映せずに閉じました。");
    }
    customerActionModalEl.hidden = true;
    document.body.classList.remove("portal-modal-open");
    customerActionSnapshot = null;
    updateCustomerActionSummary();
    renderQr(false);
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
    const currentAxes = reservation?.axes || questionnaire?.adjusted_axes || questionnaire?.final_axes || {};
    axisCompareEl.innerHTML = `
      <div class="staff-survey-radar-only">
        ${createRadarGraph(currentAxes, "survey")}
      </div>
    `;
  }

  function renderRecommendedMaterials() {
    if (!recommendedMaterialsEl) return;
    {
    const rankMaterials = window.FragranceMasterData?.rankMaterials;
    const axes = reservation?.axes || questionnaire?.adjusted_axes || questionnaire?.final_axes || {};
    const rankedRows = rankMaterials && hasAxisValue(axes)
      ? rankMaterials(axes, materialRows, 3)
      : [];
    if (!rankedRows.length) {
      recommendedMaterialsEl.innerHTML = `<p class="admin-empty">算出できるアンケート結果がありません。</p>`;
      return;
    }
    const ratios = [40, 35, 25];
    recommendedMaterialsEl.innerHTML = `
      <div class="staff-recommend-blend-list">
        ${rankedRows.slice(0, 3).map((row, index) => `
          <article class="staff-recommend-blend-row">
            <span>${escapeHtml(row.material_name)}</span>
            <strong>${ratios[index] || 0}%</strong>
          </article>
        `).join("")}
      </div>
    `;
    return;
    }
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

  function clampRecipeAmount(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  function setRecipeAmountControls(row, value) {
    const nextValue = String(clampRecipeAmount(value));
    const input = row?.querySelector('[data-recipe-field="amount"]');
    const range = row?.querySelector('[data-recipe-field="amount_range"]');
    if (input) input.value = nextValue;
    if (range) range.value = nextValue;
  }

  function syncRecipeAmountRange(row) {
    const input = row?.querySelector('[data-recipe-field="amount"]');
    const range = row?.querySelector('[data-recipe-field="amount_range"]');
    if (!input || !range) return;
    range.value = String(clampRecipeAmount(input.value));
  }

  function syncAllRecipeAmountRanges(listEl) {
    Array.from(listEl?.querySelectorAll(".staff-recipe-row") || []).forEach(syncRecipeAmountRange);
  }

  function createRecipeRow(item = {}) {
    if (!recipeListEl) return;
    const originalMaterial = item.material_name
      || materialRows.find((entry) => entry.material_code === item.material_code)?.material_name
      || "";
    const initialAmount = clampRecipeAmount(item.amount || 0);
    const row = document.createElement("div");
    row.className = "staff-recipe-row";
    row.innerHTML = `
      <input data-recipe-field="role" type="hidden" value="${escapeHtml(item.role || "ingredient")}">
      <input data-recipe-field="lot" type="hidden" value="${escapeHtml(item.lot || "")}">
      <input data-recipe-field="note" type="hidden" value="${escapeHtml(item.note || "")}">
      <div class="staff-recipe-row-head">
        <span class="staff-recipe-field-label">原料</span>
        <button class="admin-btn secondary" type="button" data-remove-recipe>削除</button>
      </div>
      <label class="staff-recipe-material-field">
        <select data-recipe-field="material_code">${getMaterialOptions(item.material_code || "")}</select>
        <small class="staff-recipe-original-material">${originalMaterial ? `変更前: ${escapeHtml(originalMaterial)}` : "変更前: 未選択"}</small>
      </label>
      <label class="staff-recipe-amount-field">
        <span class="staff-recipe-field-label">割合</span>
        <span class="staff-amount-control">
          <input data-recipe-field="amount" type="number" min="0" max="100" step="1" value="${initialAmount}">
          <span class="staff-amount-unit">%</span>
        </span>
        <input class="staff-amount-range" data-recipe-field="amount_range" type="range" min="0" max="100" step="1" value="${initialAmount}">
      </label>
    `;
    const refresh = () => {
      refreshFinalAxesFromRecipe();
      renderRecipeSummary();
      renderRecipeAxisCompare();
    };
    row.querySelector("[data-remove-recipe]")?.addEventListener("click", () => {
      row.remove();
      refresh();
    });
    row.querySelector('[data-recipe-field="material_code"]')?.addEventListener("change", refresh);
    row.querySelector('[data-recipe-field="amount"]')?.addEventListener("input", () => {
      setRecipeAmountControls(row, row.querySelector('[data-recipe-field="amount"]')?.value);
      refresh();
    });
    row.querySelector('[data-recipe-field="amount_range"]')?.addEventListener("input", () => {
      setRecipeAmountControls(row, row.querySelector('[data-recipe-field="amount_range"]')?.value);
      refresh();
    });
    recipeListEl.appendChild(row);
    renderRecipeSummary();
    renderRecipeAxisCompare();
  }

  function renderRecipeRows(items) {
    if (!recipeListEl) return;
    recipeListEl.innerHTML = "";
    (Array.isArray(items) ? items : []).forEach((item) => createRecipeRow(item));
    while (recipeListEl.children.length < 3) {
      createRecipeRow({ role: "ingredient" });
    }
    renderRecipeSummary();
    renderRecipeAxisCompare();
  }

  function collectRecipeItemsFromList(listEl) {
    if (!listEl) return [];
    return Array.from(listEl.children)
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

  function collectRecipeItems() {
    return collectRecipeItemsFromList(recipeListEl);
  }

  function collectPrevisitRecipeItems() {
    return collectRecipeItemsFromList(previsitRecipeListEl);
  }

  function renderRecipeSummary() {
    if (!recipeSummaryListEl) return;
    const items = collectRecipeItems();
    if (!items.length) {
      recipeSummaryListEl.innerHTML = `<p class="admin-empty">配合は未設定です。</p>`;
      return;
    }
    recipeSummaryListEl.innerHTML = `
      <div class="staff-recipe-summary-row staff-recipe-summary-row--head">
        <span>原料</span>
        <strong>割合</strong>
      </div>
      ${items.map((item) => `
        <div class="staff-recipe-summary-row">
          <span>${escapeHtml(item.material_name || "未選択")}</span>
          <strong>${Number(item.amount || 0)}%</strong>
        </div>
      `).join("")}
    `;
  }

  function renderPrevisitRecipeSummary() {
    if (!previsitRecipeSummaryEl) return;
    const items = Array.isArray(previsitRecipeItems) ? previsitRecipeItems : [];
    if (copyPrevisitToFinalEl) copyPrevisitToFinalEl.disabled = !items.length;
    if (!items.length) {
      previsitRecipeSummaryEl.innerHTML = `<p class="admin-empty">提案配合は未設定です。</p>`;
      return;
    }
    const axes = calculateRecipeDerivedAxes(items, getBaseSurveyAxes());
    previsitRecipeSummaryEl.innerHTML = `
      <div class="staff-recipe-summary-row staff-recipe-summary-row--head">
        <span>原料</span>
        <strong>割合</strong>
      </div>
      ${items.map((item) => `
        <div class="staff-recipe-summary-row">
          <span>${escapeHtml(item.material_name || "未選択")}</span>
          <strong>${Number(item.amount || 0)}%</strong>
        </div>
      `).join("")}
      ${axes ? `<div class="staff-previsit-axis-preview">${createRadarGraph(axes, "final")}</div>` : ""}
    `;
  }

  function getRecommendedRecipeItems() {
    const rankMaterials = window.FragranceMasterData?.rankMaterials;
    const axes = reservation?.axes || questionnaire?.adjusted_axes || questionnaire?.final_axes || {};
    if (!rankMaterials || !hasAxisValue(axes)) return [];
    const ratios = [40, 35, 25];
    return rankMaterials(axes, materialRows, 3).slice(0, 3).map((row, index) => ({
      role: "ingredient",
      material_code: row.material_code,
      material_name: row.material_name,
      amount: ratios[index] || 0
    }));
  }

  function applyRecommendedRecipe() {
    const items = getRecommendedRecipeItems();
    if (!items.length) {
      setStatus("おすすめ配合を追加できるアンケート結果がありません。", "error");
      return;
    }
    renderRecipeRows(items);
    refreshFinalAxesFromRecipe();
    renderRecipeSummary();
    renderRecipeAxisCompare();
    renderQr(false);
    setStatus("おすすめ配合を最終配合に追加しました。");
  }

  function applyPrevisitRecommendedRecipe() {
    const items = getRecommendedRecipeItems();
    if (!items.length) {
      setStatus("おすすめ配合を追加できるアンケート結果がありません。", "error");
      return;
    }
    renderPrevisitRecipeRows(items);
    setStatus("おすすめ配合を事前提案に追加しました。");
  }

  function getPrevisitRecipeModalSnapshot() {
    return {
      items: collectPrevisitRecipeItems()
    };
  }

  function restorePrevisitRecipeModalSnapshot(snapshot) {
    if (!snapshot) return;
    renderPrevisitRecipeRows(snapshot.items || []);
    renderPrevisitRecipeAxisCompare();
  }

  function isPrevisitRecipeModalDirty() {
    return previsitRecipeModalSnapshot
      ? JSON.stringify(getPrevisitRecipeModalSnapshot()) !== JSON.stringify(previsitRecipeModalSnapshot)
      : false;
  }

  function openPrevisitRecipeModal() {
    if (!previsitRecipeModalEl) return;
    renderPrevisitRecipeRows(previsitRecipeItems || []);
    previsitRecipeModalSnapshot = getPrevisitRecipeModalSnapshot();
    renderPrevisitRecipeAxisCompare();
    previsitRecipeModalEl.hidden = false;
    document.body.classList.add("portal-modal-open");
    previsitRecipeModalEl.querySelector(".staff-customer-action-close")?.focus();
  }

  function closePrevisitRecipeModal(options = {}) {
    if (!previsitRecipeModalEl) return;
    if (!options.apply && isPrevisitRecipeModalDirty()) {
      const shouldDiscard = window.confirm("事前配合の変更を反映せずに閉じますか？");
      if (!shouldDiscard) return;
      restorePrevisitRecipeModalSnapshot(previsitRecipeModalSnapshot);
      setStatus("事前配合の変更を反映せずに閉じました。");
    }
    if (options.apply) {
      previsitRecipeItems = collectPrevisitRecipeItems();
      persistPrevisitRecipeItems();
      renderPrevisitRecipeSummary();
      setStatus("事前配合を反映しました。");
    }
    previsitRecipeModalEl.hidden = true;
    document.body.classList.remove("portal-modal-open");
    previsitRecipeModalSnapshot = null;
    renderPrevisitRecipeSummary();
    renderPrevisitRecipeAxisCompare();
  }

  function normalizePrevisitRecipeAmounts() {
    const amountInputs = Array.from(previsitRecipeListEl?.querySelectorAll('[data-recipe-field="amount"]') || []);
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
    syncAllRecipeAmountRanges(previsitRecipeListEl);
    renderPrevisitRecipeAxisCompare();
  }

  function copyPrevisitRecipeToFinal() {
    if (!previsitRecipeItems.length) {
      setStatus("コピーできる事前配合がありません。", "error");
      return;
    }
    renderRecipeRows(previsitRecipeItems);
    refreshFinalAxesFromRecipe();
    renderRecipeSummary();
    renderRecipeAxisCompare();
    renderQr(false);
    setStatus("事前配合を最終配合へコピーしました。");
  }

  function getRecipeModalSnapshot() {
    return {
      items: collectRecipeItems(),
      axes: getCurrentFinalAxes()
    };
  }

  function restoreRecipeModalSnapshot(snapshot) {
    if (!snapshot) return;
    renderRecipeRows(snapshot.items || []);
    setFinalAxisInputs(snapshot.axes || {});
    updateAxisTotal();
    renderRecipeSummary();
    renderRecipeAxisCompare();
    renderQr(false);
  }

  function isRecipeModalDirty() {
    return recipeModalSnapshot
      ? JSON.stringify(getRecipeModalSnapshot()) !== JSON.stringify(recipeModalSnapshot)
      : false;
  }

  function openRecipeModal() {
    if (!recipeModalEl) return;
    recipeModalSnapshot = getRecipeModalSnapshot();
    renderRecipeAxisCompare();
    recipeModalEl.hidden = false;
    document.body.classList.add("portal-modal-open");
    recipeModalEl.querySelector(".staff-customer-action-close")?.focus();
  }

  function closeRecipeModal(options = {}) {
    if (!recipeModalEl) return;
    if (!options.apply && isRecipeModalDirty()) {
      const shouldDiscard = window.confirm("配合の変更を反映せずに閉じますか？");
      if (!shouldDiscard) return;
      restoreRecipeModalSnapshot(recipeModalSnapshot);
      setStatus("配合の変更を反映せずに閉じました。");
    }
    recipeModalEl.hidden = true;
    document.body.classList.remove("portal-modal-open");
    recipeModalSnapshot = null;
    renderRecipeSummary();
    renderRecipeAxisCompare();
    renderQr(false);
  }

  function getProductName() {
    return String(productNameEl?.value || "").trim();
  }

  function getProductConsentState() {
    return {
      personalInfoConsent: Boolean(personalInfoConsentEl?.checked),
      thirdPartyOrderConsent: Boolean(thirdPartyOrderConsentEl?.checked)
    };
  }

  function getProductReadiness() {
    const productName = getProductName();
    const recipeItems = collectRecipeItems();
    const axes = normalizeAxes(getCurrentFinalAxes());
    const consents = getProductConsentState();
    return {
      productName,
      recipeItems,
      axes,
      hasFinalAxes: hasAxisValue(axes),
      hasRecipe: recipeItems.length > 0,
      hasConsents: consents.personalInfoConsent && consents.thirdPartyOrderConsent,
      ...consents
    };
  }

  function validateCompleteRegistration() {
    const readiness = getProductReadiness();
    const missing = [];
    if (!readiness.productName) missing.push("商品名");
    if (!readiness.hasRecipe) missing.push("最終原料");
    if (!readiness.hasFinalAxes) missing.push("最終5軸");
    if (!readiness.personalInfoConsent) missing.push("個人情報同意");
    if (!readiness.thirdPartyOrderConsent) missing.push("第三者作成同意");
    return {
      isReady: missing.length === 0,
      missing,
      readiness
    };
  }

  function calculateRecipeRawAxes(items = collectRecipeItems()) {
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

  function calculateRecipeDerivedAxes(items = collectRecipeItems(), baseAxes = getBaseSurveyAxes()) {
    const rawAxes = calculateRecipeRawAxes(items);
    return normalizeRecipeAxesForDisplay(rawAxes, baseAxes);
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
    syncAllRecipeAmountRanges(recipeListEl);
    refreshFinalAxesFromRecipe();
    renderRecipeSummary();
    renderRecipeAxisCompare();
  }

  function createPrevisitRecipeRow(item = {}) {
    if (!previsitRecipeListEl) return;
    const originalMaterial = item.material_name
      || materialRows.find((entry) => entry.material_code === item.material_code)?.material_name
      || "";
    const initialAmount = clampRecipeAmount(item.amount || 0);
    const row = document.createElement("div");
    row.className = "staff-recipe-row";
    row.innerHTML = `
      <input data-recipe-field="role" type="hidden" value="${escapeHtml(item.role || "ingredient")}">
      <input data-recipe-field="lot" type="hidden" value="${escapeHtml(item.lot || "")}">
      <input data-recipe-field="note" type="hidden" value="${escapeHtml(item.note || "")}">
      <div class="staff-recipe-row-head">
        <span class="staff-recipe-field-label">原料</span>
        <button class="admin-btn secondary" type="button" data-remove-recipe>削除</button>
      </div>
      <label class="staff-recipe-material-field">
        <select data-recipe-field="material_code">${getMaterialOptions(item.material_code || "")}</select>
        <small class="staff-recipe-original-material">${originalMaterial ? `変更前: ${escapeHtml(originalMaterial)}` : "変更前: 未選択"}</small>
      </label>
      <label class="staff-recipe-amount-field">
        <span class="staff-recipe-field-label">割合</span>
        <span class="staff-amount-control">
          <input data-recipe-field="amount" type="number" min="0" max="100" step="1" value="${initialAmount}">
          <span class="staff-amount-unit">%</span>
        </span>
        <input class="staff-amount-range" data-recipe-field="amount_range" type="range" min="0" max="100" step="1" value="${initialAmount}">
      </label>
    `;
    const refresh = () => renderPrevisitRecipeAxisCompare();
    row.querySelector("[data-remove-recipe]")?.addEventListener("click", () => {
      row.remove();
      refresh();
    });
    row.querySelector('[data-recipe-field="material_code"]')?.addEventListener("change", refresh);
    row.querySelector('[data-recipe-field="amount"]')?.addEventListener("input", () => {
      setRecipeAmountControls(row, row.querySelector('[data-recipe-field="amount"]')?.value);
      refresh();
    });
    row.querySelector('[data-recipe-field="amount_range"]')?.addEventListener("input", () => {
      setRecipeAmountControls(row, row.querySelector('[data-recipe-field="amount_range"]')?.value);
      refresh();
    });
    previsitRecipeListEl.appendChild(row);
    refresh();
  }

  function renderPrevisitRecipeRows(items) {
    if (!previsitRecipeListEl) return;
    previsitRecipeListEl.innerHTML = "";
    (Array.isArray(items) ? items : []).forEach((item) => createPrevisitRecipeRow(item));
    while (previsitRecipeListEl.children.length < 3) {
      createPrevisitRecipeRow({ role: "ingredient" });
    }
    renderPrevisitRecipeAxisCompare();
  }

  function getPreparationNoteText() {
    return String(workshop?.preparation_note || reservation?.staff_memo || "").trim();
  }

  function renderPreparationNote() {
    if (!preparationNoteDisplayEl) return;
    const text = getPreparationNoteText();
    preparationNoteDisplayEl.textContent = text || "未記載";
    preparationNoteDisplayEl.classList.toggle("is-empty", !text);
  }

  function fillForm() {
    const baseAxes = workshop?.final_axes || reservation?.axes || questionnaire?.adjusted_axes || questionnaire?.final_axes || {};
    recordIdEl.value = workshop?.id || "";
    sessionStatusEl.value = workshop?.status || "draft";
    renderPreparationNote();
    staffSummaryEl.value = workshop?.staff_summary || "";
    if (productNameEl) productNameEl.value = fragranceProduct?.product_name || "";
    if (personalInfoConsentEl) {
      personalInfoConsentEl.checked = Boolean(fragranceProduct?.personal_info_consent);
    }
    if (thirdPartyOrderConsentEl) {
      thirdPartyOrderConsentEl.checked = Boolean(fragranceProduct?.third_party_order_consent);
    }
    customerFeedbackEl.value = getFeedbackKey() ? window.sessionStorage.getItem(getFeedbackKey()) || "" : "";
    if (hearingNoteEl) {
      hearingNoteEl.value = getHearingMemoKey() ? window.sessionStorage.getItem(getHearingMemoKey()) || "" : "";
    }
    previsitRecipeItems = readPrevisitRecipeItems();
    renderPrevisitRecipeSummary();
    setFinalAxisInputs(baseAxes);
    renderRecipeRows(workshop?.recipe_items || []);
    updateAxisTotal();
    updateCustomerActionSummary();
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
    const readiness = getProductReadiness();
    const axes = readiness.axes;
    const recipeItems = readiness.recipeItems;
    const recipeSignature = buildRecipeSignature(recipeItems);
    const axisSignature = AXIS_ORDER.map((axis) => `${axis}:${Number(axes[axis] || 0)}`).join("|");
    const fallbackProductId = fragranceProduct?.product_code || `prd-${createStableHash(`${readiness.productName || "name:none"}|${axisSignature}|${recipeSignature || "recipe:none"}`)}`;
    const publicToken = productQrCode?.public_token || productQrCode?.qr_code || "";
    const productId = productQrCode?.qr_code || fallbackProductId;
    const target = new URL("../customer/product-reservation.html", window.location.href);
    if (publicToken) {
      target.searchParams.set("token", publicToken);
    } else {
      target.searchParams.set("product_id", productId);
      AXIS_ORDER.forEach((axis) => {
        target.searchParams.set(axis, String(Number(axes[axis] || 0)));
      });
    }
    return {
      productId,
      url: target.toString(),
      isReady: Boolean(publicToken && readiness.productName && readiness.hasFinalAxes && readiness.hasRecipe && readiness.hasConsents)
    };
  }

  function canSendQrMail() {
    const readiness = getProductReadiness();
    return Boolean(
      fragranceProduct?.id &&
      fragranceProduct.status === "published" &&
      readiness.productName &&
      readiness.hasFinalAxes &&
      readiness.hasRecipe &&
      readiness.hasConsents
    );
  }

  function renderQr(force = false) {
    if (qrPreviewEl) {
      qrPreviewEl.innerHTML = "";
      qrPreviewEl.hidden = true;
    }
    const snapshot = buildProductSnapshot();
    const readyToSend = canSendQrMail();
    if (generateQrEl) {
      generateQrEl.disabled = !readyToSend;
      generateQrEl.classList.toggle("is-disabled", !readyToSend);
    }
    if (!force || !qrPreviewEl) {
      return;
    }
    if (!snapshot.isReady) {
      setStatus("QR付きメールの送信準備がまだ完了していません。", "error");
      return;
    }
    setStatus("QR付きメールの送信確認に進みます。お客様の端末に案内メールが届いたか確認してください。");
  }

  async function saveFragranceProduct(workshopId, workshopPayload) {
    const readiness = getProductReadiness();
    if (!readiness.productName && !fragranceProduct?.id) return null;
    const isPublished = workshopPayload.status === "completed" && readiness.hasConsents && readiness.hasRecipe && readiness.hasFinalAxes;
    const consentedAt = readiness.hasConsents
      ? (fragranceProduct?.consented_at || new Date().toISOString())
      : null;
    const payload = {
      workshop_session_id: workshopId || null,
      reservation_id: reservation.id,
      questionnaire_result_id: reservation.questionnaire_result_id || null,
      customer_id: reservation.customer_id || fragranceProduct?.customer_id || null,
      product_name: readiness.productName || fragranceProduct?.product_name,
      final_axes: readiness.axes,
      recipe_items: readiness.recipeItems,
      created_by_staff_id: fragranceProduct?.created_by_staff_id || staffProfile.id,
      personal_info_consent: readiness.personalInfoConsent,
      third_party_order_consent: readiness.thirdPartyOrderConsent,
      consented_at: consentedAt,
      consented_by_staff_id: consentedAt ? (fragranceProduct?.consented_by_staff_id || staffProfile.id) : null,
      status: isPublished ? "published" : "draft",
      updated_at: new Date().toISOString()
    };
    const saved = fragranceProduct?.id
      ? await window.AdminData.updateRow("fragrance_products", fragranceProduct.id, payload)
      : await window.AdminData.insertRow("fragrance_products", payload);
    fragranceProduct = saved?.[0] || fragranceProduct;
    return fragranceProduct;
  }

  async function syncProductQrCode() {
    if (!fragranceProduct?.id) return null;
    const isPublished = fragranceProduct.status === "published";
    if (!isPublished) {
      if (productQrCode?.id) {
        const saved = await window.AdminData.updateRow("product_qr_codes", productQrCode.id, {
          status: "draft",
          is_public: false,
          updated_at: new Date().toISOString()
        });
        productQrCode = saved?.[0] || productQrCode;
      }
      return productQrCode;
    }
    const payload = {
      fragrance_product_id: fragranceProduct.id,
      status: "active",
      is_public: true,
      issued_at: productQrCode?.issued_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const saved = productQrCode?.id
      ? await window.AdminData.updateRow("product_qr_codes", productQrCode.id, payload)
      : await window.AdminData.insertRow("product_qr_codes", payload);
    productQrCode = saved?.[0] || productQrCode;
    return productQrCode;
  }

  async function saveWorkshop() {
    if (!reservation) return;
    if (!staffProfile?.id) {
      setStatus("スタッフプロフィールが未登録のため保存できません。管理者にスタッフ登録を確認してください。", "error");
      return;
    }
    if (submitModeEl.value === "complete") {
      const validation = validateCompleteRegistration();
      if (!validation.isReady) {
        setStatus(`最終登録に必要な項目が不足しています: ${validation.missing.join(" / ")}`, "error");
        return;
      }
    }
    const payload = {
      reservation_id: reservation.id,
      questionnaire_result_id: reservation.questionnaire_result_id || null,
      preparation_note: getPreparationNoteText() || null,
      staff_summary: staffSummaryEl.value.trim() || null,
      pre_visit_axes: normalizeAxes(questionnaire?.final_axes || reservation.axes || {}),
      reservation_axes: normalizeAxes(reservation.axes || {}),
      final_axes: normalizeAxes(getCurrentFinalAxes()),
      recipe_items: collectRecipeItems(),
      status: submitModeEl.value === "complete" ? "completed" : (sessionStatusEl.value || "draft"),
      updated_at: new Date().toISOString()
    };
    payload.staff_profile_id = staffProfile.id;
    const recordId = recordIdEl.value;
    try {
      const saved = recordId
        ? await window.AdminData.updateRow("workshop_sessions", recordId, payload)
        : await window.AdminData.insertRow("workshop_sessions", payload);
      await window.AdminData.updateRow("reservations", reservation.id, {
        status: submitModeEl.value === "complete" ? "completed" : reservation.status,
        updated_at: new Date().toISOString()
      });
      recordIdEl.value = saved?.[0]?.id || recordId || "";
      await saveFragranceProduct(recordIdEl.value, payload);
      await syncProductQrCode();
      if (getFeedbackKey()) {
        window.sessionStorage.setItem(getFeedbackKey(), customerFeedbackEl.value.trim());
      }
      if (hearingNoteEl && getHearingMemoKey()) {
        window.sessionStorage.setItem(getHearingMemoKey(), hearingNoteEl.value.trim());
      }
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
    const productRows = workshop?.id
      ? await window.AdminData.listRows("fragrance_products", {
          filters: [{ operator: "eq", column: "workshop_session_id", value: workshop.id }],
          limit: 1
        }).catch(() => [])
      : await window.AdminData.listRows("fragrance_products", {
          filters: [{ operator: "eq", column: "reservation_id", value: reservation.id }],
          limit: 1
        }).catch(() => []);
    fragranceProduct = productRows[0] || null;
    const productQrRows = fragranceProduct?.id
      ? await window.AdminData.listRows("product_qr_codes", {
          filters: [{ operator: "eq", column: "fragrance_product_id", value: fragranceProduct.id }],
          orders: [{ column: "created_at", ascending: false }],
          limit: 1
        }).catch(() => [])
      : [];
    productQrCode = productQrRows[0] || null;
    const defaults = window.FragranceMasterData?.createMaterialTemplates?.() || [];
    materialDataReady = materialPointRows.length > 0;
    materialRows = (materialPointRows.length ? materialPointRows : defaults)
      .map((row) => window.FragranceMasterData?.normalizeMaterialRow
        ? window.FragranceMasterData.normalizeMaterialRow(row)
        : row);
    return true;
  }

  function bindEvents() {
    summaryToggleEl?.addEventListener("click", () => {
      setSummaryCollapsed(!summaryCardEl?.classList.contains("is-collapsed"));
    });

    customerEditOpenEl?.addEventListener("click", () => {
      customerDraft = readCustomerDraft() || {};
      customerNameEl.value = reservation?.customer_name || customerDraft.name || "";
      customerEmailEl.value = reservation?.customer_email || customerDraft.email || "";
      customerPhoneEl.value = customerDraft.phone || "";
      customerModalEl.hidden = false;
      document.body.classList.add("portal-modal-open");
      customerNameEl?.focus();
    });

    document.querySelectorAll("[data-customer-close]").forEach((button) => {
      button.addEventListener("click", () => {
        customerModalEl.hidden = true;
        document.body.classList.remove("portal-modal-open");
      });
    });

    document.querySelectorAll("[data-customer-action]").forEach((button) => {
      button.addEventListener("click", () => {
        openCustomerActionModal(button.dataset.customerAction);
      });
    });

    document.querySelectorAll("[data-customer-action-cancel]").forEach((button) => {
      button.addEventListener("click", () => closeCustomerActionModal({ apply: false }));
    });
    document.querySelectorAll("[data-customer-action-apply]").forEach((button) => {
      button.addEventListener("click", () => closeCustomerActionModal({ apply: true }));
    });

    recipeEditOpenEl?.addEventListener("click", openRecipeModal);
    previsitRecipeEditOpenEl?.addEventListener("click", openPrevisitRecipeModal);
    document.querySelectorAll("[data-recipe-cancel]").forEach((button) => {
      button.addEventListener("click", () => closeRecipeModal({ apply: false }));
    });
    document.querySelectorAll("[data-recipe-apply]").forEach((button) => {
      button.addEventListener("click", () => closeRecipeModal({ apply: true }));
    });
    document.querySelectorAll("[data-previsit-recipe-cancel]").forEach((button) => {
      button.addEventListener("click", () => closePrevisitRecipeModal({ apply: false }));
    });
    document.querySelectorAll("[data-previsit-recipe-apply]").forEach((button) => {
      button.addEventListener("click", () => closePrevisitRecipeModal({ apply: true }));
    });

    document.querySelectorAll("[data-product-name-suggestion]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!productNameEl) return;
        productNameEl.value = button.dataset.productNameSuggestion || "";
        document.querySelectorAll("[data-product-name-suggestion]").forEach((item) => {
          item.classList.toggle("is-selected", item === button);
        });
        updateCustomerActionSummary();
        renderQr(false);
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && customerActionModalEl && !customerActionModalEl.hidden) {
        closeCustomerActionModal({ apply: false });
      }
      if (event.key === "Escape" && recipeModalEl && !recipeModalEl.hidden) {
        closeRecipeModal({ apply: false });
      }
      if (event.key === "Escape" && previsitRecipeModalEl && !previsitRecipeModalEl.hidden) {
        closePrevisitRecipeModal({ apply: false });
      }
      if (event.key === "Escape" && customerModalEl && !customerModalEl.hidden) {
        customerModalEl.hidden = true;
        document.body.classList.remove("portal-modal-open");
      }
    });

    customerFormEl?.addEventListener("submit", async (event) => {
      event.preventDefault();
      customerDraft = {
        name: customerNameEl.value.trim(),
        email: customerEmailEl.value.trim(),
        phone: customerPhoneEl.value.trim()
      };
      try {
        if (reservation?.id) {
          const saved = await window.AdminData.updateRow("reservations", reservation.id, {
            customer_name: customerDraft.name || null,
            customer_email: customerDraft.email || null,
            updated_at: new Date().toISOString()
          });
          reservation = { ...reservation, ...(saved?.[0] || {}), customer_name: customerDraft.name || null, customer_email: customerDraft.email || null };
        }
        persistCustomerDraft(customerDraft);
        customerModalEl.hidden = true;
        document.body.classList.remove("portal-modal-open");
        renderCustomerProfile();
        setStatus("お客様情報を保存しました。");
      } catch (error) {
        setStatus(error?.message || "お客様情報の保存に失敗しました。", "error");
      }
    });

    addRecipeRowEl?.addEventListener("click", () => createRecipeRow({ role: "ingredient" }));
    applyRecommendedRecipeEl?.addEventListener("click", applyRecommendedRecipe);
    normalizeRecipeEl?.addEventListener("click", normalizeRecipeAmounts);
    addPrevisitRecipeRowEl?.addEventListener("click", () => createPrevisitRecipeRow({ role: "ingredient" }));
    applyPrevisitRecommendedRecipeEl?.addEventListener("click", applyPrevisitRecommendedRecipe);
    normalizePrevisitRecipeEl?.addEventListener("click", normalizePrevisitRecipeAmounts);
    copyPrevisitToFinalEl?.addEventListener("click", copyPrevisitRecipeToFinal);
    AXIS_ORDER.forEach((axis) => {
      document.getElementById(`axis-${axis}`)?.addEventListener("input", updateAxisTotal);
    });
    [productNameEl, personalInfoConsentEl, thirdPartyOrderConsentEl].forEach((element) => {
      element?.addEventListener("input", () => {
        updateCustomerActionSummary();
        renderQr(false);
      });
      element?.addEventListener("change", () => {
        updateCustomerActionSummary();
        renderCustomerProfile();
        renderQr(false);
      });
    });
    saveDraftEl?.addEventListener("click", () => {
      submitModeEl.value = "draft";
    });
    saveDraftNoteEl?.addEventListener("click", () => {
      submitModeEl.value = "draft";
    });
    saveCompleteEl?.addEventListener("click", () => {
      submitModeEl.value = "complete";
    });
    formEl?.addEventListener("submit", async (event) => {
      event.preventDefault();
      await saveWorkshop();
    });
    generateQrEl?.addEventListener("click", async () => {
      if (!canSendQrMail()) {
        setStatus("QR付きメールの送信確認には接客完了登録が必要です。", "error");
        renderQr(false);
        return;
      }
      try {
        await syncProductQrCode();
        renderQr(true);
        renderCustomerProfile();
      } catch (error) {
        setStatus(error?.message || "QR付きメールの送信確認に失敗しました。", "error");
      }
    });
  }

  async function bootstrap() {
    session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    staffProfile = await window.AdminAuth.getStaffProfile?.(session);
    window.AdminAuth.persistPortalRole("staff");
    renderHeader();
    if (!staffProfile?.id) {
      setStatus("スタッフプロフィールが未登録です。管理者に Supabase Auth ユーザーと staff_profiles の紐づけを依頼してください。", "error");
      return;
    }
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
