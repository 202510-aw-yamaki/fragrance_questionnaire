(function () {
  const rowsEl = document.getElementById("reservation-rows");
  const emptyEl = document.getElementById("reservation-empty");
  const filterForm = document.getElementById("filter-form");
  const hideCompletedEl = document.getElementById("filter-hide-completed");
  const summaryTotalEl = document.getElementById("reservation-summary-total");
  const summaryOpenEl = document.getElementById("reservation-summary-open");
  const summaryMemoEl = document.getElementById("reservation-summary-memo");
  const summaryCompletedEl = document.getElementById("reservation-summary-completed");

  if (!rowsEl || !filterForm) return;

  let reservations = [];
  let slotMap = new Map();
  let questionnaireMap = new Map();
  let session = null;
  let staffProfile = null;

  const BRANCH_LABELS = {
    floral: "フローラル",
    fresh: "フレッシュ",
    woody: "ウッディ"
  };

  function getRole() {
    return "staff";
  }

  function formatShortDate(value) {
    const source = String(value || "").trim();
    const match = source.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (match) {
      const [, year, month, day] = match;
      return `${year.slice(-2)}/${month.padStart(2, "0")}/${day.padStart(2, "0")}`;
    }
    const isoDate = source.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate) {
      const [, year, month, day] = isoDate;
      return `${year.slice(-2)}/${month}/${day}`;
    }
    return source ? source.replaceAll("-", "/") : "-";
  }

  function formatDateTime(row) {
    const slot = slotMap.get(row.slot_id);
    if (!slot?.slot_date) return row.slot_label || "-";
    return [formatShortDate(slot.slot_date), String(slot.slot_time || "").slice(0, 5)]
      .filter(Boolean)
      .join(" ");
  }

  function formatSlotTime(row) {
    const slot = slotMap.get(row.slot_id);
    return String(slot?.slot_time || row.slot_label || "-").slice(0, 5);
  }

  function formatCreatedDate(value) {
    const datePart = String(value || "").slice(0, 10);
    return datePart ? formatShortDate(datePart) : "-";
  }

  function formatVisitType(value) {
    const text = String(value || "").trim();
    if (!text) return "-";
    if (text.includes("ギフト")) return "ギフト";
    if (text.includes("再来")) return "再来店";
    if (text.includes("初")) return "初来店";
    return text;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getStaffNameCandidates() {
    return new Set([
      staffProfile?.staff_name,
      staffProfile?.display_name,
      window.AdminAuth.getStaffDisplayName(session)
    ].map(normalizeName).filter(Boolean));
  }

  function isAssignedSlot(slot) {
    if (!staffProfile?.id || !slot) return false;
    if (slot.staff_profile_id === staffProfile.id) return true;
    if (slot.staff_profile_id) return false;
    const instructorName = normalizeName(slot.instructor_name);
    return instructorName ? getStaffNameCandidates().has(instructorName) : false;
  }

  function isAssignedReservation(row) {
    if (!staffProfile?.id) return false;
    if (row.staff_profile_id === staffProfile.id) return true;
    return isAssignedSlot(slotMap.get(row.slot_id));
  }

  function renderSummary(rows) {
    if (!summaryTotalEl || !summaryOpenEl || !summaryMemoEl || !summaryCompletedEl) return;
    summaryTotalEl.textContent = String(rows.length);
    summaryOpenEl.textContent = String(rows.filter((row) => row.status !== "completed" && row.status !== "canceled").length);
    summaryMemoEl.textContent = String(rows.filter((row) => !String(row.staff_memo || "").trim()).length);
    summaryCompletedEl.textContent = String(rows.filter((row) => row.status === "completed").length);
  }

  function getBranchKey(row) {
    return questionnaireMap.get(row.questionnaire_result_id)?.branch_key || "";
  }

  function formatBranchLabel(row) {
    if (!row.questionnaire_result_id) {
      if (row.questionnaire_flow_status === "answered_unsaved") return "保存失敗";
      if (row.questionnaire_flow_status === "skipped") return "未回答";
    }
    return BRANCH_LABELS[getBranchKey(row)] || "-";
  }

  function matchesKeyword(row, keyword) {
    if (!keyword) return true;
    const draftCustomer = readDraftCustomer(row);
    const text = [
      formatVisitType(row.visit_type),
      formatBranchLabel(row),
      getBranchKey(row),
      row.visit_type,
      row.summary_headline,
      row.summary_body,
      row.staff_memo,
      row.slot_label,
      draftCustomer?.name
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes(keyword.toLowerCase());
  }

  function readDraftCustomer(row) {
    try {
      const stored = window.sessionStorage.getItem(`fragranceCustomerDraft:${row.id}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  function getFilteredRows() {
    const dateValue = document.getElementById("filter-date").value;
    const statusValue = document.getElementById("filter-status").value;
    const keywordValue = document.getElementById("filter-keyword").value.trim();
    const hideCompleted = hideCompletedEl?.checked;

    return reservations.filter((row) => {
      const slot = slotMap.get(row.slot_id);
      const slotDate = slot?.slot_date || "";
      if (dateValue && slotDate !== dateValue) return false;
      if (statusValue && row.status !== statusValue) return false;
      if (hideCompleted && statusValue !== "completed" && row.status === "completed") return false;
      return matchesKeyword(row, keywordValue);
    });
  }

  async function renderRows() {
    const filtered = getFilteredRows();
    rowsEl.innerHTML = "";
    emptyEl.hidden = filtered.length > 0;
    renderSummary(filtered);

    filtered.forEach((row) => {
      const draftCustomer = readDraftCustomer(row);
      const detailHref = window.AdminAuth.appendRoleToHref(`staff-customer-detail.html?reservation=${encodeURIComponent(row.id)}`, "staff");
      const memoLabel = String(row.staff_memo || "").trim() ? "メモあり" : "未記入";
      const article = document.createElement("article");
      article.className = "portal-list-row portal-reservation-row";
      article.innerHTML = `
        <span class="portal-reservation-cell portal-reservation-cell--datetime" data-label="時間">${escapeHtml(formatSlotTime(row))}</span>
        <span class="portal-reservation-cell portal-reservation-cell--customer" data-label="お客様名">${escapeHtml(draftCustomer?.name || row.customer_name || "未入力")}</span>
        <span class="portal-reservation-cell portal-reservation-cell--summary" data-label="香り傾向">${escapeHtml(formatBranchLabel(row))}</span>
        <span class="portal-reservation-cell portal-reservation-cell--memo ${memoLabel === "未記入" ? "is-empty" : ""}" data-label="事前メモ">${memoLabel}</span>
        <span class="portal-reservation-cell portal-reservation-cell--status">
          <select class="portal-reservation-status-select" data-status-id="${row.id}">
            <option value="confirmed"${row.status === "confirmed" ? " selected" : ""}>予約受付</option>
            <option value="canceled"${row.status === "canceled" ? " selected" : ""}>キャンセル</option>
            <option value="completed"${row.status === "completed" ? " selected" : ""}>接客完了</option>
          </select>
        </span>
        <span class="portal-reservation-cell portal-reservation-cell--action"><a class="admin-btn secondary portal-row-link" href="${detailHref}">詳細を見る</a></span>
      `;
      rowsEl.appendChild(article);
    });

    rowsEl.querySelectorAll("[data-status-id]").forEach((select) => {
      select.addEventListener("change", async () => {
        const nextStatus = select.value;
        await window.AdminData.updateRow("reservations", select.dataset.statusId, {
          status: nextStatus,
          updated_at: new Date().toISOString()
        }).then(() => {
          const target = reservations.find((row) => row.id === select.dataset.statusId);
          if (target) target.status = nextStatus;
        }).catch(console.error);
        await renderRows();
      });
    });
  }

  async function loadBaseData() {
    staffProfile = await window.AdminAuth.getStaffProfile?.(session);
    if (!staffProfile?.id) {
      reservations = [];
      slotMap = new Map();
      questionnaireMap = new Map();
      if (emptyEl) emptyEl.textContent = "スタッフプロフィールが未登録です。管理者にスタッフ紐づけを依頼してください。";
      return;
    }
    const [reservationRows, slotRows] = await Promise.all([
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }], select: "*" }).catch(() => []),
      window.AdminData.listRows("reservation_slots", {
        orders: [{ column: "slot_date", ascending: true }, { column: "slot_time", ascending: true }]
      }).catch(() => [])
    ]);
    slotMap = new Map((slotRows || []).map((row) => [row.id, row]));
    reservations = (reservationRows || []).filter(isAssignedReservation);
    if (emptyEl) emptyEl.textContent = "このスタッフに紐づく予約はありません。";
    const questionnaireIds = [...new Set(reservations.map((row) => row.questionnaire_result_id).filter(Boolean))];
    const questionnaireRows = questionnaireIds.length
      ? await window.AdminData.listRows("questionnaire_results", {
          filters: [{ operator: "in", column: "id", value: questionnaireIds }],
          select: "id, branch_key"
        }).catch(() => [])
      : [];
    questionnaireMap = new Map((questionnaireRows || []).map((row) => [row.id, row]));
  }

  filterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await renderRows();
  });

  [document.getElementById("filter-date"), document.getElementById("filter-status"), hideCompletedEl]
    .filter(Boolean)
    .forEach((element) => {
      element.addEventListener("change", async () => {
        await renderRows();
      });
    });

  async function bootstrap() {
    const role = "staff";
    session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole(role);
    window.AdminAuth.renderAdminHeader("reservations", {
      role,
      session,
      brandText: "Staff Reservations",
      roleLabel: "",
      links: [
        { href: "staff-dashboard.html", label: "ダッシュボード", key: "staff-dashboard" },
        { href: "staff-slots.html", label: "予約枠作成", key: "slots" }
      ]
    });
    await loadBaseData();
    await renderRows();
  }

  bootstrap();
})();
