(function () {
  const HOURS = Array.from({ length: 10 }, (_, index) => 9 + index);
  const timelineEl = document.getElementById("staff-day-timeline");
  const eventsEl = document.getElementById("staff-day-events");
  const dateLabelEl = document.getElementById("staff-day-current-label");
  const pageHeadingEl = document.getElementById("staff-dashboard-heading");
  const staffEyebrowEl = document.getElementById("staff-dashboard-eyebrow");
  const noteEl = document.getElementById("staff-dashboard-note");
  const prevButton = document.getElementById("staff-day-prev");
  const nextButton = document.getElementById("staff-day-next");
  const kpiTodayEl = document.getElementById("staff-kpi-today");
  const kpiWeekEl = document.getElementById("staff-kpi-week");
  const unconfirmedCountEl = document.getElementById("staff-unconfirmed-count");
  const shippingPendingCountEl = document.getElementById("staff-shipping-pending-count");
  const missingPrimaryEl = document.getElementById("staff-missing-primary");
  const missingSecondaryEl = document.getElementById("staff-missing-secondary");
  const missingNoteEl = document.getElementById("staff-missing-note");
  const qrRequestCountEl = document.getElementById("staff-qr-request-count");
  const qrRequestListEl = document.getElementById("staff-qr-request-list");
  const notificationCountEl = document.getElementById("staff-notification-count");
  const slotAlertEl = document.getElementById("staff-slot-alert");
  const nextActionEl = document.getElementById("staff-next-action");
  const nextActionTimeEl = document.getElementById("staff-next-action-time");
  const nextActionNameEl = document.getElementById("staff-next-action-name");
  const nextActionFragranceEl = document.getElementById("staff-next-action-fragrance");
  const nextActionLinkEl = document.getElementById("staff-next-action-link");

  if (!timelineEl || !eventsEl || !dateLabelEl) return;

  let session = null;
  let selectedDate = new Date();
  let reservations = [];
  let slots = [];
  let qrNotifications = [];
  let qrRequests = [];
  let openQrCount = 0;

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

  function formatDateLabel(date, options = {}) {
    const { padMonthDay = false } = options;
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const month = padMonthDay
      ? String(date.getMonth() + 1).padStart(2, "0")
      : String(date.getMonth() + 1);
    const day = padMonthDay
      ? String(date.getDate()).padStart(2, "0")
      : String(date.getDate());
    return `${month}/${day}（${weekdays[date.getDay()]}）`;
  }

  function renderPageHeading() {
    if (!pageHeadingEl) return;
    pageHeadingEl.textContent = "本日のワークショップ";
    if (staffEyebrowEl) {
      staffEyebrowEl.textContent = `Staff Dashboard / 担当スタッフ: ${readAssignedStaffName()}`;
    }
    if (noteEl) {
      noteEl.textContent = "本日の予約状況と通知を確認できます。";
    }
  }

  function parseMinutes(timeText) {
    const [hours, minutes] = String(timeText || "00:00").split(":").map((value) => Number(value || 0));
    return (hours * 60) + minutes;
  }

  function formatTimeRange(startMinutes, endMinutes) {
    const toLabel = (value) => {
      const hours = String(Math.floor(value / 60)).padStart(2, "0");
      const minutes = String(value % 60).padStart(2, "0");
      return `${hours}:${minutes}`;
    };
    return `${toLabel(startMinutes)}-${toLabel(endMinutes)}`;
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
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

  function formatCustomerLabel(value, fallback = "お客様") {
    const name = String(value || fallback).trim();
    return name.endsWith("様") ? name : `${name}様`;
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

  function formatTimeOnly(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function updateNotificationCount() {
    if (!notificationCountEl) return;
    notificationCountEl.textContent = String(openQrCount);
  }

  function readAssignedStaffName() {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("staff");
    if (override) return override.trim();
    return window.AdminAuth.getStaffDisplayName(session);
  }

  function getAssignedSlots() {
    const staffName = readAssignedStaffName();
    const instructorSlots = slots.filter((row) => String(row.instructor_name || "").trim());
    if (!instructorSlots.length) {
      noteEl.textContent = "予約枠に担当者名が未設定のため、全枠を表示しています。";
      return slots;
    }

    const matched = slots.filter((row) => normalizeName(row.instructor_name) === normalizeName(staffName));
    if (!matched.length) {
      noteEl.textContent = "現在の予約枠に一致する担当者名がないため、割当済みデータは 0 件です。";
      return [];
    }

    noteEl.textContent = "本日の予約状況と通知を確認できます。";
    return matched;
  }

  function getAssignedReservations() {
    const assignedSlotIds = new Set(getAssignedSlots().map((row) => row.id));
    return reservations.filter((row) => assignedSlotIds.has(row.slot_id));
  }

  function getDayEvents(dateKey) {
    const reservationMap = new Map(getAssignedReservations().map((row) => [row.slot_id, row]));
    return getAssignedSlots()
      .filter((slot) => slot.slot_date === dateKey)
      .sort((left, right) => parseMinutes(left.slot_time) - parseMinutes(right.slot_time))
      .map((slot) => {
        const reservation = reservationMap.get(slot.id) || null;
        const startMinutes = parseMinutes(slot.slot_time);
        const endMinutes = startMinutes + 60;
        const status = reservation?.status || slot.status || "open";
        let color = "warning";
        if (status === "completed") color = "success";
        else if (status === "confirmed" || status === "recommended") color = "primary";
        else if (status === "canceled" || status === "closed") color = "danger";
        const customerName = reservation ? formatCustomerLabel(reservation.customer_name) : "予約枠未予約";
        const fragranceLabel = reservation?.summary_headline || (reservation ? "香り傾向未設定" : "予約受付可能");
        const memoLabel = reservation
          ? (reservation.staff_memo ? "事前メモあり" : "事前メモなし")
          : "空き枠";
        return {
          slot,
          reservation,
          color,
          startMinutes,
          endMinutes,
          timeRange: formatTimeRange(startMinutes, endMinutes),
          title: customerName,
          customerName,
          fragranceLabel,
          memoLabel,
          location: slot.slot_label || "接客枠",
          attendees: reservation?.guest_count || "空き"
        };
      });
  }

  function createAvatarGroup(attendees) {
    const count = Math.max(1, Math.min(4, Number(String(attendees).match(/\d+/)?.[0] || 1)));
    return `<div class="day-avatar-group">${Array.from({ length: count }, (_, index) => `<span class="day-avatar">G${index + 1}</span>`).join("")}</div>`;
  }

  function buildEventMarkup(event, options = {}) {
    const actionHref = event.reservation
      ? window.AdminAuth.appendRoleToHref(`staff-customer-detail.html?reservation=${encodeURIComponent(event.reservation.id)}`, "staff")
      : window.AdminAuth.appendRoleToHref("staff-slots.html", "staff");
    const actionLabel = event.reservation ? "詳細を開く" : "予約枠を開く";
    return `
      <article class="day-event ${event.color}">
        <div class="day-event-time"><span>&#128337;</span><strong>${event.timeRange.split("-")[0]}</strong></div>
        <h3 class="day-event-title"><span>&#128100;</span><strong>${escapeHtml(event.customerName)}</strong></h3>
        <div class="day-event-location"><span>&#10048;</span><span>香り傾向：${escapeHtml(event.fragranceLabel)}</span></div>
        <div class="day-event-attendees">
          <span>&#128462;</span>
          <span>${escapeHtml(event.memoLabel)}</span>
        </div>
        ${options.includeAction ? `<div class="admin-actions"><a class="admin-btn secondary" href="${actionHref}">${actionLabel}</a></div>` : ""}
      </article>
    `;
  }

  function renderNextAction(events) {
    if (!nextActionEl) return;
    const now = new Date();
    const selectedKey = formatDateKey(selectedDate);
    const todayKey = formatDateKey(now);
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();
    const candidates = events
      .filter((event) => event.reservation)
      .filter((event) => selectedKey !== todayKey || event.startMinutes >= currentMinutes);
    const nextEvent = candidates[0] || events.find((event) => event.reservation);
    if (!nextEvent) {
      nextActionEl.hidden = true;
      return;
    }
    nextActionEl.hidden = false;
    if (nextActionTimeEl) nextActionTimeEl.textContent = nextEvent.timeRange.split("-")[0];
    if (nextActionNameEl) nextActionNameEl.textContent = nextEvent.customerName;
    if (nextActionFragranceEl) nextActionFragranceEl.textContent = nextEvent.fragranceLabel;
    if (nextActionLinkEl) {
      nextActionLinkEl.href = window.AdminAuth.appendRoleToHref(
        `staff-customer-detail.html?reservation=${encodeURIComponent(nextEvent.reservation.id)}`,
        "staff"
      );
    }
  }

  function renderTimeline() {
    const dateKey = formatDateKey(selectedDate);
    const events = getDayEvents(dateKey);
    dateLabelEl.textContent = `${formatDateLabel(selectedDate)} の予定`;
    timelineEl.innerHTML = HOURS.map((hour) => {
      const hourStart = hour * 60;
      const matching = events.filter((event) => event.startMinutes >= hourStart && event.startMinutes < hourStart + 60);
      const eventMarkup = matching.map((event) => buildEventMarkup(event)).join("");
      return `
        <div class="day-hour">
          <div class="day-hour-label">${String(hour).padStart(2, "0")}:00</div>
          <div class="day-hour-content">
            ${eventMarkup}
          </div>
        </div>
      `;
    }).join("");

    if (!events.length) {
      eventsEl.innerHTML = `<p class="admin-empty">この日の予約枠または予約はありません。</p>`;
      renderNextAction([]);
      return;
    }
    eventsEl.innerHTML = events.map((event) => buildEventMarkup(event, { includeAction: true })).join("");
    renderNextAction(events);
  }

  function renderMissingDates() {
    const activeSlots = getAssignedSlots().filter((slot) => slot.is_active !== false);
    const today = createLocalDate(new Date());
    const workingWeekdays = new Set(
      activeSlots.map((slot) => {
        const slotDate = new Date(`${slot.slot_date}T00:00:00`);
        return Number.isNaN(slotDate.getTime()) ? null : slotDate.getDay();
      }).filter((value) => value !== null)
    );
    if (!workingWeekdays.size) {
      [1, 2, 3, 4, 5].forEach((value) => workingWeekdays.add(value));
    }
    const missingDates = Array.from({ length: 14 }, (_, index) => {
      const date = addDays(today, index);
      const dateKey = formatDateKey(date);
      if (!workingWeekdays.has(date.getDay())) return null;
      const slotCount = activeSlots.filter((slot) => slot.slot_date === dateKey).length;
      return slotCount ? null : formatDateLabel(date, { padMonthDay: true });
    }).filter(Boolean);

    if (!missingPrimaryEl || !missingSecondaryEl) return;
    missingPrimaryEl.hidden = false;
    missingPrimaryEl.textContent = String(missingDates.length);

    if (!missingDates.length) {
      if (slotAlertEl) slotAlertEl.hidden = true;
      missingSecondaryEl.innerHTML = "";
      if (missingNoteEl) {
        missingNoteEl.hidden = true;
        missingNoteEl.textContent = "";
      }
      return;
    }

    if (slotAlertEl) slotAlertEl.hidden = false;
    const displayDates = missingDates.length >= 4
      ? missingDates.slice(0, 3).concat("要確認")
      : missingDates;
    missingSecondaryEl.innerHTML = displayDates.map((label) => `<span class="admin-chip">${label}</span>`).join("");
    if (missingNoteEl) {
      missingNoteEl.hidden = false;
      missingNoteEl.textContent = "向こう2週間のうち、担当日の予約枠が未作成の日があります。公開予約に出す前に枠を作成してください。";
    }
  }

  function renderKpis() {
    const activeReservations = getAssignedReservations().filter((row) => row.status !== "canceled");
    const activeSlots = getAssignedSlots().filter((slot) => slot.is_active !== false);
    const todayKey = formatDateKey(new Date());

    const reservationSlotMap = new Map(activeSlots.map((slot) => [slot.id, slot]));
    const todayReservations = activeReservations.filter((row) => reservationSlotMap.get(row.slot_id)?.slot_date === todayKey);
    const unconfirmedReservations = todayReservations.filter((row) => row.status === "confirmed" || row.status === "requested" || !row.status);
    const todaySlots = activeSlots.filter((slot) => slot.slot_date === todayKey);
    const shippingPendingRows = qrRequests.filter((row) => row.status === "shipping_pending");

    kpiTodayEl.textContent = String(todayReservations.length);
    if (unconfirmedCountEl) unconfirmedCountEl.textContent = String(unconfirmedReservations.length);
    kpiWeekEl.textContent = `${todayReservations.length}/${todaySlots.length}`;
    if (shippingPendingCountEl) shippingPendingCountEl.textContent = String(shippingPendingRows.length);
  }

  function renderQrNotifications() {
    if (!qrRequestCountEl || !qrRequestListEl) return;
    const openRows = qrNotifications.filter((row) => row.status === "open");
    openQrCount = openRows.length;
    updateNotificationCount();
    qrRequestCountEl.textContent = String(openRows.length);
    if (!openRows.length) {
      qrRequestListEl.innerHTML = `<p class="admin-empty">未対応の通知はありません。</p>`;
      return;
    }
    qrRequestListEl.innerHTML = openRows.slice(0, 3).map((row) => {
      const payload = parsePayload(row);
      const productName = payload.product_name || "QR商品";
      const totalVolume = payload.total_volume_ml ? `${payload.total_volume_ml}ml` : "容量未設定";
      return `
        <article class="staff-notification-row">
          <span class="staff-notification-dot" aria-hidden="true"></span>
          <div>
            <strong>QR作成依頼が入りました</strong>
            <small>${escapeHtml(productName)} / ${escapeHtml(totalVolume)} / ${escapeHtml(formatDueDate(payload.availability_due_at))}</small>
          </div>
          <time>${escapeHtml(formatTimeOnly(row.created_at))}</time>
          <a href="${window.AdminAuth.appendRoleToHref("staff-qr-requests.html", "staff")}" aria-label="QR依頼一覧へ">›</a>
        </article>
      `;
    }).join("") + `<a class="staff-notification-more" href="${window.AdminAuth.appendRoleToHref("staff-qr-requests.html", "staff")}">すべての通知を見る <span>›</span></a>`;
  }

  async function loadBaseData() {
    const [reservationRows, slotRows, notificationRows, requestRows] = await Promise.all([
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }] }).catch(() => []),
      window.AdminData.listRows("reservation_slots", {
        orders: [{ column: "slot_date", ascending: true }, { column: "slot_time", ascending: true }]
      }).catch(() => []),
      window.AdminData.listRows("notification_events", {
        filters: [
          { operator: "eq", column: "event_type", value: "qr_product_requested" },
          { operator: "eq", column: "status", value: "open" }
        ],
        orders: [{ column: "created_at", ascending: false }],
        limit: 5
      }).catch(() => []),
      window.AdminData.listRows("qr_product_requests", {
        filters: [{ operator: "eq", column: "status", value: "shipping_pending" }],
        orders: [{ column: "created_at", ascending: false }],
        select: "id, status, fragrance_product_id, created_at"
      }).catch(() => [])
    ]);
    reservations = reservationRows || [];
    slots = slotRows || [];
    qrNotifications = notificationRows || [];
    qrRequests = requestRows || [];
  }

  prevButton.addEventListener("click", () => {
    selectedDate = addDays(selectedDate, -1);
    renderTimeline();
  });

  nextButton.addEventListener("click", () => {
    selectedDate = addDays(selectedDate, 1);
    renderTimeline();
  });

  async function bootstrap() {
    session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole("staff");
    window.AdminAuth.renderAdminHeader("staff-dashboard", {
      role: "staff",
      session,
      brandText: "Staff Dashboard",
      roleLabel: "",
      links: [
        { href: "staff-reservations.html", label: "予約一覧", key: "reservations" },
        { href: "staff-slots.html", label: "予約枠", key: "slots" }
      ]
    });
    await loadBaseData();
    renderPageHeading();
    renderKpis();
    renderQrNotifications();
    renderTimeline();
    renderMissingDates();
  }

  bootstrap();
})();
