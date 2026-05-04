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

  function formatDueDate(value) {
    if (!value) return "期限未設定";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "期限未設定";
    return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
          <strong>${getUsagePercent(bucket.reserved, bucket.capacity)}%</strong>
          <small>${escapeHtml(`${bucket.reserved}${LABELS.slotUnit}${LABELS.reserved} / ${bucket.capacity}${LABELS.slotUnit}`)}</small>
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
      todayShiftsEl.innerHTML = staffStates.map((staff) => `
        <article class="admin-dashboard-staff-card ${staff.isWorking ? "" : "is-off"}">
          <span>${escapeHtml(staff.staffName)}</span>
          <span>${staff.isWorking ? LABELS.attending : LABELS.dayOff}</span>
          <strong>${escapeHtml(staff.reservationCount)}</strong>
        </article>
      `).join("");
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
        <span>${LABELS.attending}</span>
        <strong>${group.reservations}</strong>
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

  function renderCoverage(slots, staffRows = []) {
    const today = formatDateKey(new Date());
    const twoWeekLimit = formatDateKey(addDays(createLocalDate(new Date()), 13));
    if (staffRows.length) {
      coverageEl.innerHTML = staffRows.map((staff) => {
        const staffSlots = getSlotsForStaff(slots, staff.staffName, today, twoWeekLimit);
        return `
          <article class="portal-dashboard-row portal-dashboard-row--coverage">
            <span>${escapeHtml(staff.staffName)}</span>
            <strong class="${staffSlots.length ? "portal-ok-text" : "portal-ng-text"}">${staffSlots.length ? "OK" : "NG"}</strong>
          </article>
        `;
      }).join("");
      return;
    }
    const grouped = groupByStaff(slots.filter((row) => row.is_active !== false && row.slot_date >= today && row.slot_date <= twoWeekLimit));

    if (!grouped.size) {
      coverageEl.innerHTML = `<p class="admin-empty">確認できる予約枠はありません。</p>`;
      return;
    }

    coverageEl.innerHTML = Array.from(grouped.entries()).map(([staffName, staffSlots]) => `
      <article class="portal-dashboard-row portal-dashboard-row--coverage">
        <span>${escapeHtml(staffName)}</span>
        <strong class="${staffSlots.length ? "portal-ok-text" : "portal-ng-text"}">${staffSlots.length ? "OK" : "NG"}</strong>
      </article>
    `).join("");
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
    setStatusHeading(slotSummaryHeadingEl, LABELS.slotStatus, "");
    nextWeekSummaryEl.innerHTML = `
      <article class="admin-dashboard-slot-total">
        <span>${escapeHtml(usageText)}</span>
        <strong>${getUsagePercent(reservedCount, totalCapacity)}%</strong>
      </article>
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

  function renderQrNotifications(rows, emailRows = [], requestRows = []) {
    if (!qrRequestCountEl || !qrRequestListEl) return;
    const openRows = (rows || []).filter((row) => row.status === "open");
    const queuedEmailRows = (emailRows || []).filter((row) => row.status === "queued");
    const overdueRows = (requestRows || []).filter((row) => isOverdueQrRequest(row));
    const shippingRows = (requestRows || []).filter((row) => row.status === "shipping_pending");
    const totalCount = openRows.length + queuedEmailRows.length + overdueRows.length + shippingRows.length;
    qrRequestCountEl.textContent = String(totalCount);
    if (qrRequestPanelCountEl) qrRequestPanelCountEl.textContent = String(totalCount);
    if (!openRows.length && !queuedEmailRows.length && !overdueRows.length && !shippingRows.length) {
      qrRequestListEl.innerHTML = `<p class="admin-empty">未対応のQR依頼はありません。</p>`;
      return;
    }
    const overdueItems = overdueRows.slice(0, 3).map((row) => `
      <article class="portal-dashboard-row portal-dashboard-row--summary">
        <span>${escapeHtml(row.request_code || "QR依頼")}</span>
        <span>期限超過</span>
        <strong>${escapeHtml(formatDueDate(row.availability_due_at))}</strong>
      </article>
    `);
    const shippingItems = shippingRows.slice(0, 3).map((row) => `
      <article class="portal-dashboard-row portal-dashboard-row--summary">
        <span>${escapeHtml(row.request_code || "QR依頼")}</span>
        <span>発送準備中</span>
        <strong>${escapeHtml(formatDueDate(row.updated_at))}</strong>
      </article>
    `);
    const requestItems = openRows.slice(0, 5).map((row) => {
      const payload = parsePayload(row);
      const productName = payload.product_name || "QR商品";
      const totalVolume = payload.total_volume_ml ? `${payload.total_volume_ml}ml` : "容量未設定";
      return `
        <article class="portal-dashboard-row portal-dashboard-row--summary">
          <span>${escapeHtml(productName)}</span>
          <span>${escapeHtml(totalVolume)}</span>
          <strong>${escapeHtml(formatDueDate(payload.availability_due_at))}</strong>
        </article>
      `;
    });
    const emailItems = queuedEmailRows.slice(0, 5).map((row) => {
      const payload = parsePayload(row);
      const productName = payload.product_name || "QR商品";
      return `
        <article class="portal-dashboard-row portal-dashboard-row--summary">
          <span>${escapeHtml(productName)}</span>
          <span>${escapeHtml(row.template_key || "email")}</span>
          <strong>${escapeHtml(row.status || "queued")}</strong>
        </article>
      `;
    });
    qrRequestListEl.innerHTML = overdueItems.concat(shippingItems, requestItems, emailItems).join("")
      + `<a class="admin-btn" href="${window.AdminAuth.appendRoleToHref("admin-qr-requests.html", "manager")}">QR依頼一覧</a>`;
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

    const [reservations, slots, scoringRows, materials, settingsRows, qrNotificationRows, emailEventRows, qrRequestRows] = await Promise.all([
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }] }).catch(() => []),
      window.AdminData.listRows("reservation_slots", { filters: [{ operator: "in", column: "status", value: ["open", "recommended", "closed"] }] }).catch(() => []),
      window.AdminData.listRows("scoring_configs", { filters: [{ operator: "eq", column: "is_active", value: true }], limit: 1 }).catch(() => []),
      window.AdminData.listRows("material_points").catch(() => []),
      window.AdminData.listRows("admin_settings", { filters: [{ operator: "in", column: "setting_key", value: [STAFF_SETTING_KEY, SHIFT_SETTING_KEY] }] }).catch(() => []),
      window.AdminData.listRows("notification_events", {
        filters: [
          { operator: "eq", column: "event_type", value: "qr_product_requested" },
          { operator: "eq", column: "status", value: "open" }
        ],
        orders: [{ column: "created_at", ascending: false }],
        limit: 5
      }).catch(() => []),
      window.AdminData.listRows("email_events", {
        filters: [
          { operator: "eq", column: "status", value: "queued" }
        ],
        orders: [{ column: "created_at", ascending: false }],
        limit: 5
      }).catch(() => []),
      window.AdminData.listRows("qr_product_requests", {
        orders: [{ column: "created_at", ascending: false }],
        select: "id, request_code, status, availability_due_at, updated_at"
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
    renderCoverage(slots, staffRows);
    renderScoringSummary(scoringRows[0] || null);
    renderMaterialLinks(materials);
    renderQrNotifications(qrNotificationRows, emailEventRows, qrRequestRows);
  }

  bootstrap();
})();
