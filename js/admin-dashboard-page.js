(function () {
  const STAFF_SETTING_KEY = "staff_directory";
  const SHIFT_SETTING_KEY = "staff_shift_overrides";
  const kpiReservationsEl = document.getElementById("kpi-reservations");
  const kpiReservationsWeekEl = document.getElementById("kpi-reservations-week");
  const kpiSlotsEl = document.getElementById("kpi-slots");
  const kpiScoringEl = document.getElementById("kpi-scoring");
  const kpiMaterialsEl = document.getElementById("kpi-materials");
  const kpiUnconfirmedReservationsEl = document.getElementById("kpi-unconfirmed-reservations");
  const kpiQrRequestsEl = document.getElementById("kpi-qr-requests");
  const kpiOverdueRequestsEl = document.getElementById("kpi-overdue-requests");
  const kpiShippingPendingEl = document.getElementById("kpi-shipping-pending");
  const todayShiftsEl = document.getElementById("manager-today-shifts");
  const nextWeekSummaryEl = document.getElementById("manager-next-week-summary");
  const coverageEl = document.getElementById("manager-slot-coverage");
  const scoringWeightSummaryEl = document.getElementById("manager-scoring-weight-summary");
  const scoringSummaryEl = document.getElementById("manager-scoring-summary");
  const materialLinksEl = document.getElementById("manager-material-links");
  const qrRequestCountEl = document.getElementById("manager-qr-request-count");
  const qrRequestPanelCountEl = document.getElementById("manager-qr-request-panel-count");
  const qrRequestListEl = document.getElementById("manager-qr-request-list");
  const statusBlockHeadings = document.querySelectorAll(".admin-dashboard-status-block h3");
  const todayShiftHeadingEl = statusBlockHeadings[0] || null;
  const slotSummaryHeadingEl = statusBlockHeadings[1] || null;
  const previsitProposalHeadingEl = statusBlockHeadings[2] || null;
  const qrModalTabsEl = document.querySelector(".admin-qr-modal-tabs");
  const qrModalListEl = document.querySelector(".admin-qr-modal-list");
  const qrModalSummaryEl = document.querySelector(".admin-qr-modal-side dl");
  const qrModalNoteEl = document.querySelector(".admin-qr-modal-side p");
  const footerLastLoginEl = document.getElementById("admin-footer-last-login");
  const footerLoginUserEl = document.getElementById("admin-footer-login-user");
  const qrModalState = {
    activeKey: "overdue",
    categories: null
  };
  const QR_MODAL_CATEGORIES = [
    { key: "overdue", label: "未対応/期限超過", badge: "要対応", tone: "is-danger" },
    { key: "inactive", label: "無効QRアクセス", badge: "アクセス増加", tone: "is-warning" },
    { key: "reminder", label: "再案内候補", badge: "再案内", tone: "is-warning" },
    { key: "shipping", label: "発送準備中", badge: "発送準備中", tone: "is-success" }
  ];
  const QR_REQUEST_STATUS_LABELS = {
    requested: "未対応",
    available_email_sent: "作成可能メール送信済み",
    reminder_email_sent: "再案内メール送信済み",
    expired: "期限切れ",
    unavailable: "作成不可",
    shipping_pending: "発送準備中",
    shipped: "発送完了",
    auto_unavailable_overdue: "期限超過自動不可"
  };

  function createLocalDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, amount) {
    const next = createLocalDate(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function formatDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function formatDateLabel(date) {
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getMonth() + 1}/${date.getDate()}（${weekdays[date.getDay()]}）`;
  }

  const LABELS = {
    attending: "\u51fa\u52e4",
    dayOff: "\u4f11\u65e5",
    staffPrefix: "\u30b9\u30bf\u30c3\u30d5",
    uncategorized: "\u672a\u8a2d\u5b9a",
    commonQuestions: "\u5171\u901a\u8cea\u554f\uff081\uff5e5\uff09",
    branchQuestions: "\u5206\u5c90\u8cea\u554f\uff086\uff5e7\uff09",
    finalQuestion: "\u6700\u7d42\u8cea\u554f",
    finishCorrection: "\u4ed5\u4e0a\u3052\u88dc\u6b63",
    todayStaff: "\u672c\u65e5\u306e\u30b9\u30bf\u30c3\u30d5",
    slotStatus: "\u4e88\u7d04\u67a0\u72b6\u6cc1",
    total: "\u5168\u4f53",
    slotUnit: "\u67a0",
    reserved: "\u4e88\u7d04\u6e08\u307f",
    peopleUnit: "\u540d",
    noSlots: "\u4e88\u7d04\u67a0\u306f\u3042\u308a\u307e\u305b\u3093"
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function readSettingValue(settingsRows, key) {
    const row = (settingsRows || []).find((entry) => entry.setting_key === key);
    const value = row?.setting_value;
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  function parsePayload(row) {
    const payload = row?.payload || {};
    if (typeof payload !== "string") return payload;
    try {
      return JSON.parse(payload);
    } catch (error) {
      return {};
    }
  }

  function parseJsonValue(value, fallbackValue) {
    if (typeof value !== "string") return value ?? fallbackValue;
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallbackValue;
    }
  }

  function formatDueDate(value) {
    if (!value) return "期限未設定";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "期限未設定";
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function formatAdminDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}） ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function resolveAdminLoginName(session, staffProfile) {
    const metadata = session?.user?.user_metadata || {};
    const candidates = [
      staffProfile?.display_name,
      staffProfile?.staff_name,
      metadata.staff_name,
      metadata.display_name,
      metadata.full_name,
      metadata.name
    ];
    const resolved = candidates.find((value) => String(value || "").trim());
    if (resolved) return String(resolved).trim();
    const email = session?.user?.email || "";
    return email.includes("@") ? email.split("@")[0] : "取得できません";
  }

  function renderAdminFooter(session, staffProfile = null) {
    if (footerLastLoginEl) {
      const lastLoginLabel = formatAdminDateTime(session?.user?.last_sign_in_at);
      footerLastLoginEl.textContent = lastLoginLabel
        ? `最終ログイン：${lastLoginLabel}`
        : "最終ログイン：取得できません";
    }
    if (footerLoginUserEl) {
      const email = String(session?.user?.email || "").trim();
      const loginName = resolveAdminLoginName(session, staffProfile);
      footerLoginUserEl.textContent = email
        ? `ログインユーザー：${loginName}（${email}）`
        : `ログインユーザー：${loginName}`;
    }
  }

  function normalizeName(value) {
    return String(value || "").trim();
  }

  function normalizeStaff(row, index = 0) {
    const staffName = normalizeName(row.staffName || row.staff_name || row.name) || `${LABELS.staffPrefix}${index + 1}`;
    return {
      id: normalizeName(row.id || row.staffId || row.staff_id || staffName || index),
      staffName,
      weeklyPattern: row.weeklyPattern || row.weekly_pattern || {}
    };
  }

  function normalizeShiftOverride(row) {
    return {
      staffId: normalizeName(row.staffId || row.staff_id),
      date: normalizeName(row.date),
      isWorking: row.isWorking !== false && row.is_working !== false
    };
  }

  function getDashboardStaffRows(slots, settingsRows) {
    const storedStaff = readSettingValue(settingsRows, STAFF_SETTING_KEY);
    if (Array.isArray(storedStaff) && storedStaff.length) {
      return storedStaff.map(normalizeStaff);
    }
    const derivedNames = Array.from(new Set(
      slots.map((row) => normalizeName(row.instructor_name)).filter(Boolean)
    ));
    return derivedNames.map((staffName, index) => normalizeStaff({ staffName }, index));
  }

  function getShiftOverrides(settingsRows) {
    const storedOverrides = readSettingValue(settingsRows, SHIFT_SETTING_KEY);
    return Array.isArray(storedOverrides) ? storedOverrides.map(normalizeShiftOverride) : [];
  }

  function isStaffWorkingOnDate(staff, dateKey, shiftOverrides) {
    const override = shiftOverrides.find((row) => row.staffId === staff.id && row.date === dateKey);
    if (override) return override.isWorking;
    const date = new Date(`${dateKey}T00:00:00`);
    const pattern = staff.weeklyPattern?.[String(date.getDay())] || {};
    return pattern.isWorking !== false && pattern.is_working !== false;
  }

  function getSlotsForStaff(slots, staffName, startDateKey, endDateKey = startDateKey) {
    const normalizedStaffName = normalizeName(staffName);
    return slots.filter((row) => (
      row.is_active !== false &&
      row.slot_date >= startDateKey &&
      row.slot_date <= endDateKey &&
      normalizeName(row.instructor_name) === normalizedStaffName
    ));
  }

  function createReservationCountMap(reservations) {
    return reservations.reduce((acc, row) => {
      if (!row.slot_id) return acc;
      acc.set(row.slot_id, (acc.get(row.slot_id) || 0) + 1);
      return acc;
    }, new Map());
  }

  function countReservationsForSlots(slots, reservationMap) {
    return slots.reduce((total, slot) => total + (reservationMap.get(slot.id) || 0), 0);
  }

  function getSlotCapacity(slot) {
    const capacity = Number(slot?.capacity);
    return Number.isFinite(capacity) && capacity > 0 ? capacity : 1;
  }

  function getUsagePercent(reservedCount, totalCapacity) {
    return totalCapacity ? Math.round((reservedCount / totalCapacity) * 100) : 0;
  }

  function formatSlotUsage(totalCapacity, reservedCount) {
    const percent = getUsagePercent(reservedCount, totalCapacity);
    return `${LABELS.total}${totalCapacity}${LABELS.slotUnit}\u4e2d${reservedCount}${LABELS.slotUnit}${LABELS.reserved}\uff08${percent}%\uff09`;
  }

  function hasPrevisitRecipeItems(workshop) {
    const items = parseJsonValue(workshop?.previsit_recipe_items, []);
    return Array.isArray(items) && items.some((item) => Number(item?.amount || 0) > 0);
  }

  function isActiveReservationForPreparation(row) {
    const status = String(row?.status || "confirmed").toLowerCase();
    return !["canceled", "cancelled", "completed"].includes(status);
  }

  function setStatusHeading(element, title, meta) {
    if (!element) return;
    element.innerHTML = `<span>${escapeHtml(title)}</span>${meta ? `<strong>${escapeHtml(meta)}</strong>` : ""}`;
  }

  function formatSlotRange(slot) {
    const label = String(slot?.slot_label || "");
    const rangeMatch = label.match(/\d{1,2}:\d{2}\s*[-\u2013\u2014~\uff5e]\s*\d{1,2}:\d{2}/);
    if (rangeMatch) return rangeMatch[0].replace(/\s+/g, "");
    return String(slot?.slot_time || "").slice(0, 5) || label || LABELS.uncategorized;
  }

  function getSlotTone(reservedCount, totalCapacity) {
    if (totalCapacity && reservedCount >= totalCapacity) return "is-full";
    if (totalCapacity && getUsagePercent(reservedCount, totalCapacity) >= 70) return "is-warn";
    return "";
  }

  function buildSlotStatusCards(slotRows, reservationMap) {
    const groups = slotRows.reduce((acc, slot) => {
      const label = formatSlotRange(slot);
      const bucket = acc.get(label) || { label, sortKey: String(slot.slot_time || label), capacity: 0, reserved: 0 };
      bucket.capacity += getSlotCapacity(slot);
      bucket.reserved += reservationMap.get(slot.id) || 0;
      acc.set(label, bucket);
      return acc;
    }, new Map());
    const items = Array.from(groups.values()).sort((left, right) => left.sortKey.localeCompare(right.sortKey));
    if (!items.length) return `<p class="admin-empty">${LABELS.noSlots}</p>`;
    return items.map((bucket) => {
      const tone = getSlotTone(bucket.reserved, bucket.capacity);
      return `
        <article class="admin-dashboard-slot-card ${tone}">
          <span>${escapeHtml(bucket.label)}</span>
          <strong>${escapeHtml(`${bucket.reserved}/${bucket.capacity}${LABELS.slotUnit}`)}</strong>
        </article>
      `;
    }).join("");
  }

  function renderTodayShifts(slots, reservations, staffRows = [], shiftOverrides = []) {
    const todayKey = formatDateKey(new Date());
    const todaySlots = slots.filter((row) => row.slot_date === todayKey && row.is_active !== false);
    const reservationMap = createReservationCountMap(reservations);
    if (staffRows.length) {
      const staffStates = staffRows.map((staff) => {
        const staffSlots = getSlotsForStaff(slots, staff.staffName, todayKey);
        const isWorking = isStaffWorkingOnDate(staff, todayKey, shiftOverrides);
        return {
          staffName: staff.staffName,
          isWorking,
          reservationCount: isWorking ? countReservationsForSlots(staffSlots, reservationMap) : "/"
        };
      });
      const workingCount = staffStates.filter((staff) => staff.isWorking).length;
      setStatusHeading(todayShiftHeadingEl, LABELS.todayStaff, `${LABELS.attending} ${workingCount}${LABELS.peopleUnit}`);
      const workingStaff = staffStates.filter((staff) => staff.isWorking);
      todayShiftsEl.innerHTML = workingStaff.length ? workingStaff.map((staff) => `
        <article class="admin-dashboard-staff-card">
          <span>${escapeHtml(staff.staffName)}</span>
        </article>
      `).join("") : `<p class="admin-empty">本日の出勤スタッフはありません。</p>`;
      return;
    }
    const groups = todaySlots.reduce((acc, slot) => {
      const staffName = slot.instructor_name || "未設定";
      const bucket = acc.get(staffName) || { staffName, slots: 0, reservations: 0 };
      bucket.slots += 1;
      bucket.reservations += reservationMap.get(slot.id) || 0;
      acc.set(staffName, bucket);
      return acc;
    }, new Map());

    if (!groups.size) {
      setStatusHeading(todayShiftHeadingEl, LABELS.todayStaff, `${LABELS.attending} 0${LABELS.peopleUnit}`);
      todayShiftsEl.innerHTML = `<p class="admin-empty">本日の予約枠はありません。</p>`;
      return;
    }

    setStatusHeading(todayShiftHeadingEl, LABELS.todayStaff, `${LABELS.attending} ${groups.size}${LABELS.peopleUnit}`);
    todayShiftsEl.innerHTML = Array.from(groups.values()).map((group) => `
      <article class="admin-dashboard-staff-card">
        <span>${escapeHtml(group.staffName)}</span>
      </article>
    `).join("");
  }

  function groupByStaff(slots) {
    return slots.reduce((acc, slot) => {
      const key = slot.instructor_name || "未設定";
      const bucket = acc.get(key) || [];
      bucket.push(slot);
      acc.set(key, bucket);
      return acc;
    }, new Map());
  }

  function renderPrevisitProposalChecks(slots, reservations, workshopRows = []) {
    const today = formatDateKey(new Date());
    const slotMap = new Map(slots.map((row) => [row.id, row]));
    const workshopMap = new Map((workshopRows || []).filter((row) => row.reservation_id).map((row) => [row.reservation_id, row]));
    const targetReservations = reservations.filter((row) => {
      const slot = slotMap.get(row.slot_id);
      return slot?.slot_date >= today && isActiveReservationForPreparation(row);
    });
    const pendingReservations = targetReservations.filter((row) => !hasPrevisitRecipeItems(workshopMap.get(row.id)));
    const completedCount = targetReservations.length - pendingReservations.length;
    setStatusHeading(previsitProposalHeadingEl, "来店前提案配合確認", `未完了 ${pendingReservations.length}件`);
    if (!coverageEl) return;
    if (!targetReservations.length) {
      coverageEl.innerHTML = `<p class="admin-empty">確認対象の予約はありません。</p>`;
      return;
    }
    coverageEl.innerHTML = `
      <article class="admin-dashboard-previsit-card ${pendingReservations.length ? "is-warn" : "is-ready"}">
        <span>未完了</span>
        <strong>${pendingReservations.length}件</strong>
        <small>確認済み ${completedCount}件 / 対象 ${targetReservations.length}件</small>
      </article>
    `;
  }

  function renderNextWeekSummary(slots, reservations, staffRows = []) {
    if (!nextWeekSummaryEl) return;
    const today = formatDateKey(new Date());
    const weekLimit = formatDateKey(addDays(createLocalDate(new Date()), 6));
    const grouped = groupByStaff(slots.filter((row) => row.is_active !== false && row.slot_date >= today && row.slot_date <= weekLimit));
    const reservationMap = createReservationCountMap(reservations);
    if (staffRows.length) {
      nextWeekSummaryEl.innerHTML = staffRows.map((staff) => {
        const staffSlots = getSlotsForStaff(slots, staff.staffName, today, weekLimit);
        const reservationCount = countReservationsForSlots(staffSlots, reservationMap);
        return `
          <article class="portal-dashboard-row portal-dashboard-row--summary">
            <span>${escapeHtml(staff.staffName)}</span>
            <strong>${reservationCount}/${staffSlots.length}</strong>
          </article>
        `;
      }).join("");
      return;
    }

    if (!grouped.size) {
      nextWeekSummaryEl.innerHTML = `<p class="admin-empty">翌週分のデータはありません。</p>`;
      return;
    }

    nextWeekSummaryEl.innerHTML = Array.from(grouped.entries()).map(([staffName, staffSlots]) => {
      const reservationCount = countReservationsForSlots(staffSlots, reservationMap);
      return `
        <article class="portal-dashboard-row portal-dashboard-row--summary">
          <span>${escapeHtml(staffName)}</span>
          <strong>${reservationCount}/${staffSlots.length}</strong>
        </article>
      `;
    }).join("");
  }

  function renderSlotSummary(slots, reservations) {
    if (!nextWeekSummaryEl) return;
    const today = formatDateKey(new Date());
    const weekLimit = formatDateKey(addDays(createLocalDate(new Date()), 6));
    const slotRows = slots.filter((row) => row.is_active !== false && row.slot_date >= today && row.slot_date <= weekLimit);
    const reservationMap = createReservationCountMap(reservations);
    const totalCapacity = slotRows.reduce((total, slot) => total + getSlotCapacity(slot), 0);
    const reservedCount = countReservationsForSlots(slotRows, reservationMap);
    const usageText = formatSlotUsage(totalCapacity, reservedCount);
    setStatusHeading(slotSummaryHeadingEl, LABELS.slotStatus, usageText);
    nextWeekSummaryEl.innerHTML = `
      ${buildSlotStatusCards(slotRows, reservationMap)}
    `;
  }

  function renderScoringSummary(scoringRow) {
    const config = window.FragranceMasterData.getCompatibleScoringConfig(scoringRow?.config_json || null);
    const questionWeights = config.questionWeights || {};
    const branchTemplates = Object.entries(config.branchTemplates || {}).slice(0, 3);
    if (scoringWeightSummaryEl) {
      scoringWeightSummaryEl.innerHTML = `
        <article class="portal-dashboard-row portal-dashboard-row--weight">
          <span>${LABELS.commonQuestions}</span><strong>${questionWeights.step1 ?? "-"}</strong>
        </article>
        <article class="portal-dashboard-row portal-dashboard-row--weight">
          <span>${LABELS.branchQuestions}</span><strong>${questionWeights.step2 ?? "-"}</strong>
        </article>
        <article class="portal-dashboard-row portal-dashboard-row--weight">
          <span>${LABELS.finalQuestion}</span><strong>${questionWeights.finish ?? "-"}</strong>
        </article>
        <article class="portal-dashboard-row portal-dashboard-row--weight">
          <span>${LABELS.finishCorrection}</span><strong>${config.finishBlendRatio ?? "-"}</strong>
        </article>
      `;
    }
    scoringSummaryEl.innerHTML = `
      ${branchTemplates.map(([key, axes]) => `
        <article class="portal-dashboard-branch-card">
          <h3>${escapeHtml(key)}</h3>
          <div class="portal-dashboard-branch-grid">
            <div>${Object.entries(axes || {}).map(([axis]) => `<span>${escapeHtml(axis)}</span>`).join("")}</div>
            <div>${Object.entries(axes || {}).map(([, value]) => `<strong>${escapeHtml(value)}</strong>`).join("")}</div>
          </div>
        </article>
      `).join("")}
    `;
  }

  function renderMaterialLinks(materials) {
    const activeMaterials = materials.filter((row) => row.is_active !== false);
    materialLinksEl.innerHTML = activeMaterials.length
      ? activeMaterials.map((row) => {
          const code = String(row.material_code || "");
          return `
            <a class="admin-mini-card" href="${window.AdminAuth.appendRoleToHref(`admin-materials.html?focus=${encodeURIComponent(code)}`, "manager")}">
              <h3>${escapeHtml(row.material_name || code || "-")}</h3>
              <p class="admin-note">${escapeHtml(row.category || LABELS.uncategorized)} / ${escapeHtml(code)}</p>
            </a>
          `;
        }).join("")
      : `<p class="admin-empty">表示できる原料がありません。</p>`;
  }

  function isUnconfirmedReservation(row) {
    return ["pending", "unconfirmed", "requested"].includes(String(row.status || "").toLowerCase());
  }

  function isOpenQrRequest(row) {
    return ["requested", "available_email_sent", "reminder_email_sent"].includes(String(row.status || ""));
  }

  function isOverdueQrRequest(row, now = new Date()) {
    if (row.status === "auto_unavailable_overdue") return true;
    if (row.status !== "requested" || !row.availability_due_at) return false;
    const dueAt = new Date(row.availability_due_at);
    return Number.isFinite(dueAt.getTime()) && dueAt < now;
  }

  function formatQrRequestStatus(status) {
    return QR_REQUEST_STATUS_LABELS[status] || status || "未設定";
  }

  function formatQrQuantity(row, payload = {}) {
    const quantity10ml = Number(row.quantity_10ml ?? payload.quantity_10ml ?? 0);
    const quantity30ml = Number(row.quantity_30ml ?? payload.quantity_30ml ?? 0);
    const parts = [];
    if (quantity10ml > 0) parts.push(`10ml × ${quantity10ml}`);
    if (quantity30ml > 0) parts.push(`30ml × ${quantity30ml}`);
    if (parts.length) return parts.join(" / ");
    const totalVolume = row.total_volume_ml ?? payload.total_volume_ml;
    return totalVolume ? `${totalVolume}ml` : "容量未設定";
  }

  function createEmptyQrModalCategories() {
    return QR_MODAL_CATEGORIES.reduce((acc, meta) => {
      acc[meta.key] = { ...meta, items: [], seenKeys: new Set() };
      return acc;
    }, {});
  }

  function addQrModalItem(categories, categoryKey, item) {
    const category = categories[categoryKey] || categories.overdue;
    const itemKey = item.key || `${category.key}:${item.title}:${item.lines.join("|")}`;
    if (category.seenKeys.has(itemKey)) return;
    category.seenKeys.add(itemKey);
    category.items.push({
      ...item,
      badge: item.badge || category.badge,
      tone: item.tone || category.tone
    });
  }

  function createQrRequestModalItem(row, categoryKey, options = {}) {
    const title = options.title || row.product_name || row.request_code || "QR依頼";
    const lines = [
      `状態：${formatQrRequestStatus(row.status)}`,
      `依頼内容：${formatQrQuantity(row)}`,
      row.requester_email ? `依頼者：${row.requester_email}` : "",
      row.availability_due_at ? `可否判断期限：${formatDueDate(row.availability_due_at)}` : "",
      row.expires_at ? `依頼期限：${formatDueDate(row.expires_at)}` : "",
      row.created_at ? `受付：${formatDueDate(row.created_at)}` : ""
    ].filter(Boolean);
    return {
      key: `${categoryKey}:request:${row.id || title}`,
      title,
      badge: options.badge,
      tone: options.tone,
      lines
    };
  }

  function createQrNotificationModalItem(row, categoryKey, options = {}) {
    const payload = parsePayload(row);
    const title = options.title || payload.product_name || payload.request_code || payload.qr_code || "QR通知";
    const lines = [
      options.status ? `状態：${options.status}` : "",
      payload.request_code ? `依頼番号：${payload.request_code}` : "",
      payload.total_volume_ml || payload.quantity_10ml || payload.quantity_30ml ? `依頼内容：${formatQrQuantity({}, payload)}` : "",
      payload.recent_access_count ? `直近アクセス：${payload.recent_access_count}件` : "",
      payload.window_days ? `集計期間：${payload.window_days}日` : "",
      payload.availability_due_at ? `可否判断期限：${formatDueDate(payload.availability_due_at)}` : "",
      row.created_at ? `通知：${formatDueDate(row.created_at)}` : ""
    ].filter(Boolean);
    return {
      key: `${categoryKey}:notification:${row.id || title}`,
      title,
      badge: options.badge,
      tone: options.tone,
      lines
    };
  }

  function createQrEmailModalItem(row, categoryKey, options = {}) {
    const payload = parsePayload(row);
    const title = payload.product_name || payload.request_code || row.template_key || "メール通知";
    const lines = [
      `状態：${row.status || "queued"}`,
      row.template_key ? `テンプレート：${row.template_key}` : "",
      row.recipient_email ? `送信先：${row.recipient_email}` : "",
      payload.request_code ? `依頼番号：${payload.request_code}` : "",
      payload.expires_at ? `依頼期限：${formatDueDate(payload.expires_at)}` : "",
      row.created_at ? `作成：${formatDueDate(row.created_at)}` : ""
    ].filter(Boolean);
    return {
      key: `${categoryKey}:email:${row.id || title}`,
      title,
      badge: options.badge || "メール送信待ち",
      tone: options.tone,
      lines
    };
  }

  function buildQrModalCategories(rows = [], emailRows = [], requestRows = []) {
    const categories = createEmptyQrModalCategories();
    const requestById = new Map((requestRows || []).filter((row) => row.id).map((row) => [row.id, row]));
    const openNotifications = (rows || []).filter((row) => row.status === "open");

    openNotifications.forEach((row) => {
      const request = requestById.get(row.related_id);
      if (row.event_type === "qr_inactive_access_spike") {
        addQrModalItem(categories, "inactive", createQrNotificationModalItem(row, "inactive", {
          badge: "アクセス増加",
          status: "無効化済みQRへのアクセス増加"
        }));
        return;
      }
      if (row.event_type === "qr_request_overdue") {
        addQrModalItem(categories, "overdue", request
          ? createQrRequestModalItem(request, "overdue", { badge: "期限超過" })
          : createQrNotificationModalItem(row, "overdue", { badge: "期限超過", status: "期限超過" }));
        return;
      }
      if (row.event_type === "qr_product_requested") {
        addQrModalItem(categories, "overdue", request
          ? createQrRequestModalItem(request, "overdue", { badge: isOverdueQrRequest(request) ? "期限超過" : "未対応" })
          : createQrNotificationModalItem(row, "overdue", { badge: "未対応", status: "未対応QR依頼" }));
      }
    });

    (requestRows || []).forEach((row) => {
      if (isOverdueQrRequest(row)) {
        addQrModalItem(categories, "overdue", createQrRequestModalItem(row, "overdue", { badge: "期限超過" }));
      }
      if (["available_email_sent", "reminder_email_sent"].includes(row.status)) {
        addQrModalItem(categories, "reminder", createQrRequestModalItem(row, "reminder", { badge: "再案内候補" }));
      }
      if (row.status === "shipping_pending") {
        addQrModalItem(categories, "shipping", createQrRequestModalItem(row, "shipping", { badge: "発送準備中" }));
      }
    });

    (emailRows || []).filter((row) => row.status === "queued").forEach((row) => {
      const eventKey = String(row.event_type || row.template_key || "");
      if (eventKey.includes("reminder")) {
        addQrModalItem(categories, "reminder", createQrEmailModalItem(row, "reminder"));
      } else if (eventKey.includes("overdue") || eventKey.includes("unavailable")) {
        addQrModalItem(categories, "overdue", createQrEmailModalItem(row, "overdue"));
      }
    });

    return categories;
  }

  function getQrModalTotalCount(categories) {
    return QR_MODAL_CATEGORIES.reduce((sum, meta) => sum + (categories[meta.key]?.items.length || 0), 0);
  }

  function getQrModalPanelItems(categories) {
    return QR_MODAL_CATEGORIES.flatMap((meta) => (
      (categories[meta.key]?.items || []).map((item) => ({ ...item, categoryLabel: meta.label }))
    ));
  }

  function renderQrModalItem(item) {
    return `
      <article class="admin-qr-modal-item ${escapeHtml(item.tone || "")}">
        <span class="modal-icon" aria-hidden="true"></span>
        <div>
          <h3>${escapeHtml(item.title)} <em>${escapeHtml(item.badge || "要対応")}</em></h3>
          ${item.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        </div>
        <a href="${window.AdminAuth.appendRoleToHref("admin-qr-requests.html", "manager")}" aria-label="詳細へ">›</a>
      </article>
    `;
  }

  function renderQrModal(categories) {
    if (!qrModalTabsEl || !qrModalListEl || !qrModalSummaryEl) return;
    qrModalState.categories = categories;
    const activeExists = QR_MODAL_CATEGORIES.some((meta) => meta.key === qrModalState.activeKey);
    const firstWithItems = QR_MODAL_CATEGORIES.find((meta) => categories[meta.key]?.items.length)?.key || "overdue";
    if (!activeExists || (!categories[qrModalState.activeKey]?.items.length && firstWithItems !== qrModalState.activeKey)) {
      qrModalState.activeKey = firstWithItems;
    }
    qrModalTabsEl.innerHTML = QR_MODAL_CATEGORIES.map((meta) => {
      const count = categories[meta.key]?.items.length || 0;
      const isActive = meta.key === qrModalState.activeKey;
      return `<button class="${isActive ? "is-active" : ""}" type="button" data-admin-qr-modal-category="${meta.key}" aria-selected="${isActive ? "true" : "false"}">${escapeHtml(meta.label)} <strong>${count}</strong></button>`;
    }).join("");
    const activeCategory = categories[qrModalState.activeKey] || categories.overdue;
    qrModalListEl.innerHTML = activeCategory.items.length
      ? activeCategory.items.map(renderQrModalItem).join("")
      : `<p class="admin-empty">${escapeHtml(activeCategory.label)}はありません。</p>`;
    qrModalSummaryEl.innerHTML = QR_MODAL_CATEGORIES.map((meta) => {
      const count = categories[meta.key]?.items.length || 0;
      return `<div><dt>${escapeHtml(meta.label)}</dt><dd>${count}件</dd></div>`;
    }).join("");
    if (qrModalNoteEl) {
      qrModalNoteEl.textContent = "通知はこの画面では完了扱いにしません。対応・詳細確認はQR依頼一覧で行います。";
    }
  }

  function renderQrNotifications(rows, emailRows = [], requestRows = []) {
    if (!qrRequestCountEl || !qrRequestListEl) return;
    const modalCategories = buildQrModalCategories(rows, emailRows, requestRows);
    renderQrModal(modalCategories);
    const totalCount = getQrModalTotalCount(modalCategories);
    const panelItems = getQrModalPanelItems(modalCategories);
    qrRequestCountEl.textContent = String(totalCount);
    if (qrRequestPanelCountEl) qrRequestPanelCountEl.textContent = String(totalCount);
    if (!panelItems.length) {
      qrRequestListEl.innerHTML = `<p class="admin-empty">未対応のQR依頼はありません。</p>`;
      return;
    }
    const visibleItems = panelItems.slice(0, 6).map((item) => `
        <article class="portal-dashboard-row portal-dashboard-row--summary">
          <span>${escapeHtml(item.title)}</span>
          <span>${escapeHtml(item.categoryLabel)}</span>
          <strong>${escapeHtml(item.badge || "要対応")}</strong>
        </article>
      `);
    qrRequestListEl.innerHTML = visibleItems.join("")
      + `<a class="admin-btn" href="${window.AdminAuth.appendRoleToHref("admin-qr-requests.html", "manager")}">QR依頼一覧</a>`;
  }

  if (qrModalTabsEl) {
    qrModalTabsEl.addEventListener("click", (event) => {
      const button = event.target.closest("[data-admin-qr-modal-category]");
      if (!button || !qrModalState.categories) return;
      qrModalState.activeKey = button.dataset.adminQrModalCategory || "overdue";
      renderQrModal(qrModalState.categories);
    });
  }

  async function bootstrap() {
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole("manager");
    window.AdminAuth.renderAdminHeader("dashboard", {
      role: "manager",
      session,
      links: [
        { href: "admin-qr-requests.html", label: "QR依頼一覧", key: "qr-requests" },
        { href: "admin-settings.html", label: "スタッフ登録/管理", key: "settings" },
        { href: "admin-scoring.html", label: "配点ロジック", key: "scoring" },
        { href: "admin-materials.html", label: "原料ポイント", key: "materials" }
      ]
    });
    const staffProfile = window.AdminAuth.getStaffProfile
      ? await window.AdminAuth.getStaffProfile(session).catch(() => null)
      : null;
    renderAdminFooter(session, staffProfile);

    const [reservations, slots, scoringRows, materials, settingsRows, qrNotificationRows, emailEventRows, qrRequestRows, workshopRows] = await Promise.all([
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }] }).catch(() => []),
      window.AdminData.listRows("reservation_slots", { filters: [{ operator: "in", column: "status", value: ["open", "recommended", "closed"] }] }).catch(() => []),
      window.AdminData.listRows("scoring_configs", { filters: [{ operator: "eq", column: "is_active", value: true }], limit: 1 }).catch(() => []),
      window.AdminData.listRows("material_points").catch(() => []),
      window.AdminData.listRows("admin_settings", { filters: [{ operator: "in", column: "setting_key", value: [STAFF_SETTING_KEY, SHIFT_SETTING_KEY] }] }).catch(() => []),
      window.AdminData.listRows("notification_events", {
        filters: [
          { operator: "in", column: "event_type", value: ["qr_product_requested", "qr_inactive_access_spike", "qr_request_overdue"] },
          { operator: "eq", column: "status", value: "open" }
        ],
        orders: [{ column: "created_at", ascending: false }],
        limit: 30
      }).catch(() => []),
      window.AdminData.listRows("email_events", {
        filters: [
          { operator: "eq", column: "status", value: "queued" }
        ],
        orders: [{ column: "created_at", ascending: false }],
        limit: 30
      }).catch(() => []),
      window.AdminData.listRows("qr_product_requests", {
        orders: [{ column: "created_at", ascending: false }],
        select: "id, request_code, status, requester_email, quantity_10ml, quantity_30ml, total_volume_ml, availability_due_at, available_email_sent_at, reminder_email_sent_at, expires_at, created_at, updated_at"
      }).catch(() => []),
      window.AdminData.listRows("workshop_sessions", {
        select: "id, reservation_id, previsit_recipe_items, previsit_recipe_axes, status, updated_at"
      }).catch(() => [])
    ]);

    const staffRows = getDashboardStaffRows(slots, settingsRows);
    const shiftOverrides = getShiftOverrides(settingsRows);
    const todayKey = formatDateKey(new Date());
    const slotMap = new Map(slots.map((row) => [row.id, row]));
    const todayReservations = reservations.filter((row) => slotMap.get(row.slot_id)?.slot_date === todayKey);
    kpiReservationsEl.textContent = String(todayReservations.length);
    if (kpiUnconfirmedReservationsEl) {
      kpiUnconfirmedReservationsEl.textContent = String(reservations.filter(isUnconfirmedReservation).length);
    }
    if (kpiQrRequestsEl) {
      kpiQrRequestsEl.textContent = String(qrRequestRows.filter(isOpenQrRequest).length);
    }
    if (kpiOverdueRequestsEl) {
      kpiOverdueRequestsEl.textContent = String(qrRequestRows.filter((row) => isOverdueQrRequest(row)).length);
    }
    if (kpiShippingPendingEl) {
      kpiShippingPendingEl.textContent = String(qrRequestRows.filter((row) => row.status === "shipping_pending").length);
    }
    if (kpiReservationsWeekEl) {
      const today = todayKey;
      const weekLimit = formatDateKey(addDays(createLocalDate(new Date()), 6));
      const weeklyReservations = reservations.filter((row) => {
        const dateKey = slotMap.get(row.slot_id)?.slot_date || "";
        return dateKey >= today && dateKey <= weekLimit;
      });
      const weeklySlots = slots.filter((row) => row.is_active !== false && row.slot_date >= today && row.slot_date <= weekLimit);
      kpiReservationsWeekEl.textContent = String(weeklyReservations.length);
      if (kpiSlotsEl) kpiSlotsEl.textContent = String(weeklySlots.length);
    }
    if (kpiScoringEl) kpiScoringEl.textContent = scoringRows[0]?.version ?? "-";
    if (kpiMaterialsEl) kpiMaterialsEl.textContent = String(materials.length);

    renderTodayShifts(slots, reservations, staffRows, shiftOverrides);
    renderSlotSummary(slots, reservations);
    renderPrevisitProposalChecks(slots, reservations, workshopRows);
    renderScoringSummary(scoringRows[0] || null);
    renderMaterialLinks(materials);
    renderQrNotifications(qrNotificationRows, emailEventRows, qrRequestRows);
  }

  bootstrap();
})();
