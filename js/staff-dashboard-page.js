(function () {
  const HOURS = Array.from({ length: 10 }, (_, index) => 9 + index);
  const timelineEl = document.getElementById("staff-day-timeline");
  const eventsEl = document.getElementById("staff-day-events");
  const dateLabelEl = document.getElementById("staff-day-current-label");
  const pageHeadingEl = document.getElementById("staff-dashboard-heading");
  const noteEl = document.getElementById("staff-dashboard-note");
  const prevButton = document.getElementById("staff-day-prev");
  const nextButton = document.getElementById("staff-day-next");
  const kpiTodayEl = document.getElementById("staff-kpi-today");
  const kpiWeekEl = document.getElementById("staff-kpi-week");
  const missingPrimaryEl = document.getElementById("staff-missing-primary");
  const missingSecondaryEl = document.getElementById("staff-missing-secondary");
  const missingNoteEl = document.getElementById("staff-missing-note");

  if (!timelineEl || !eventsEl || !dateLabelEl) return;

  let session = null;
  let selectedDate = new Date();
  let reservations = [];
  let slots = [];

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
    const today = createLocalDate(new Date());
    pageHeadingEl.textContent = `本日【${formatDateLabel(today, { padMonthDay: true })}】の予定確認ページ`;
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
      noteEl.textContent = `担当スタッフ: ${staffName}。予約枠に担当者名が未設定のため、全枠を表示しています。`;
      return slots;
    }

    const matched = slots.filter((row) => normalizeName(row.instructor_name) === normalizeName(staffName));
    if (!matched.length) {
      noteEl.textContent = `担当スタッフ: ${staffName}。現在の予約枠に一致する担当者名がないため、割当済みデータは 0 件です。`;
      return [];
    }

    noteEl.textContent = `担当スタッフ: ${staffName}`;
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
        return {
          slot,
          reservation,
          color,
          startMinutes,
          endMinutes,
          timeRange: formatTimeRange(startMinutes, endMinutes),
          title: reservation?.summary_headline || "予約枠未予約",
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
      ? window.AdminAuth.appendRoleToHref(`admin-workspace.html?reservation=${encodeURIComponent(event.reservation.id)}`, "staff")
      : window.AdminAuth.appendRoleToHref("admin-slots.html", "staff");
    const actionLabel = event.reservation ? "詳細を開く" : "予約枠を開く";
    return `
      <article class="day-event ${event.color}">
        <div class="day-event-time"><span>&#128337;</span><strong>${event.timeRange}</strong></div>
        <h3 class="day-event-title">${event.title}</h3>
        <div class="day-event-location"><span>&#128205;</span><span>${event.location}</span></div>
        <div class="day-event-attendees">
          <span>&#128101;</span>
          <span>${event.attendees}</span>
          ${createAvatarGroup(event.attendees)}
        </div>
        ${options.includeAction ? `<div class="admin-actions"><a class="admin-btn secondary" href="${actionHref}">${actionLabel}</a></div>` : ""}
      </article>
    `;
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
      return;
    }
    eventsEl.innerHTML = events.map((event) => buildEventMarkup(event, { includeAction: true })).join("");
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
    missingPrimaryEl.hidden = true;
    if (missingNoteEl) {
      missingNoteEl.hidden = true;
      missingNoteEl.textContent = "";
    }

    if (!missingDates.length) {
      missingSecondaryEl.innerHTML = `<span class="admin-chip">向こう二週間は作成済み</span>`;
      return;
    }

    missingSecondaryEl.innerHTML = missingDates.map((label) => `<span class="admin-chip">${label}</span>`).join("");
  }

  function renderKpis() {
    const activeReservations = getAssignedReservations().filter((row) => row.status !== "canceled");
    const activeSlots = getAssignedSlots().filter((slot) => slot.is_active !== false);
    const todayKey = formatDateKey(new Date());
    const limitDate = addDays(createLocalDate(new Date()), 6);
    const limitKey = formatDateKey(limitDate);

    const reservationSlotMap = new Map(activeSlots.map((slot) => [slot.id, slot]));
    const todayReservations = activeReservations.filter((row) => reservationSlotMap.get(row.slot_id)?.slot_date === todayKey);
    const weeklyReservations = activeReservations.filter((row) => {
      const dateKey = reservationSlotMap.get(row.slot_id)?.slot_date || "";
      return dateKey >= todayKey && dateKey <= limitKey;
    });
    const weeklySlots = activeSlots.filter((slot) => slot.slot_date >= todayKey && slot.slot_date <= limitKey);

    kpiTodayEl.textContent = String(todayReservations.length);
    kpiWeekEl.textContent = `${weeklyReservations.length}/${weeklySlots.length}`;
  }

  async function loadBaseData() {
    const [reservationRows, slotRows] = await Promise.all([
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }] }).catch(() => []),
      window.AdminData.listRows("reservation_slots", {
        orders: [{ column: "slot_date", ascending: true }, { column: "slot_time", ascending: true }]
      }).catch(() => [])
    ]);
    reservations = reservationRows || [];
    slots = slotRows || [];
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
      links: [
        { href: "admin-slots.html", label: "予約枠作成", key: "slots" },
        { href: "admin-reservations.html", label: "予約情報一覧", key: "reservations" }
      ]
    });
    await loadBaseData();
    renderPageHeading();
    renderKpis();
    renderTimeline();
    renderMissingDates();
  }

  bootstrap();
})();
