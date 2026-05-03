(function () {
  const DEFAULT_INTERVAL = "120";
  const DEFAULT_CAPACITY = "6";
  const rowsEl = document.getElementById("slot-rows");
  const form = document.getElementById("slot-form");
  const resetButton = document.getElementById("slot-reset");
  const previewDateEl = document.getElementById("slot-preview-date");
  const previewTimeEl = document.getElementById("slot-preview-time");
  const previewIntervalEl = document.getElementById("slot-preview-interval");
  const previewCapacityEl = document.getElementById("slot-preview-capacity");
  const previewFocusButton = document.getElementById("slot-preview-focus");
  const deleteButton = document.getElementById("slot-delete");
  const weekDaysEl = document.getElementById("slot-week-days");
  const weekRangeEl = document.getElementById("slot-week-range");
  const weekPrevButton = document.getElementById("slot-week-prev");
  const weekNextButton = document.getElementById("slot-week-next");
  const staffNameEl = document.getElementById("staff-slots-staff-name");

  if (!rowsEl || !form || !resetButton) return;

  let reservations = [];
  let selectedSlotId = "";
  let selectedDateKey = formatDateKey(new Date());
  let calendarStartDate = getWeekStart(parseDateKey(selectedDateKey));

  function formatMonthDay(value) {
    if (!value) return "-";
    return value.replace(/-/g, "/");
  }

  function parseDateKey(value) {
    const fallback = new Date();
    const source = /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
      ? new Date(`${value}T00:00:00`)
      : fallback;
    if (Number.isNaN(source.getTime())) return fallback;
    source.setHours(0, 0, 0, 0);
    return source;
  }

  function formatDateKey(date) {
    const source = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(source.getTime())) return "";
    return [
      source.getFullYear(),
      String(source.getMonth() + 1).padStart(2, "0"),
      String(source.getDate()).padStart(2, "0")
    ].join("-");
  }

  function addDays(date, count) {
    const next = new Date(date);
    next.setDate(next.getDate() + count);
    return next;
  }

  function getWeekStart(date) {
    const source = parseDateKey(formatDateKey(date));
    const day = source.getDay();
    return addDays(source, day === 0 ? -6 : 1 - day);
  }

  function formatShortMonthDay(value) {
    const [, month, day] = String(value || "").split("-");
    if (!month || !day) return "-";
    return `${Number(month)}/${Number(day)}`;
  }

  function formatWeekday(date) {
    return new Intl.DateTimeFormat("ja-JP", { weekday: "short" }).format(date);
  }

  function getSelectedRole() {
    return "staff";
  }

  function getDefaultInstructorName() {
    return getSelectedRole() === "staff"
      ? (window.AdminAuth.getStaffDisplayName(window.__adminSession || null) || "")
      : "";
  }

  function syncDefaultInstructors() {
    const defaultInstructorName = getDefaultInstructorName();
    const slotInstructorEl = document.getElementById("slot-instructor");
    const bulkInstructorEl = document.getElementById("slot-bulk-instructor");
    if (slotInstructorEl && !slotInstructorEl.value) {
      slotInstructorEl.value = defaultInstructorName;
    }
    if (bulkInstructorEl && !bulkInstructorEl.value) {
      bulkInstructorEl.value = defaultInstructorName;
    }
  }

  function renderStaffNameLabel() {
    if (!staffNameEl) return;
    const staffName = getDefaultInstructorName();
    staffNameEl.textContent = staffName ? `/ ${staffName}` : "";
    staffNameEl.hidden = !staffName;
  }

  function clearSelectedSlot() {
    selectedSlotId = "";
    document.getElementById("slot-id").value = "";
    document.getElementById("slot-code").value = "";
    document.getElementById("slot-label").value = "";
    setDeleteButtonState();
  }

  function syncSelectedDateToForm({ clearSlot = false } = {}) {
    const dateInput = document.getElementById("slot-date");
    if (dateInput && selectedDateKey) {
      dateInput.value = selectedDateKey;
    }
    if (clearSlot) clearSelectedSlot();
    renderPreview();
  }

  function selectCalendarDate(dateKey, { clearSlot = true } = {}) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey || ""))) return;
    selectedDateKey = dateKey;
    calendarStartDate = getWeekStart(parseDateKey(selectedDateKey));
    syncSelectedDateToForm({ clearSlot });
    renderRows();
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function parseMinutes(timeText) {
    const [hours, minutes] = String(timeText || "00:00").split(":").map((value) => Number(value || 0));
    return (hours * 60) + minutes;
  }

  function formatTimeLabel(totalMinutes) {
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const minutes = String(totalMinutes % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function formatTimeRangeLabel(startMinutes, endMinutes) {
    return `${formatTimeLabel(startMinutes)}～${formatTimeLabel(endMinutes)}`;
  }

  function createSlotDateTime(row) {
    if (!row?.slot_date || !row?.slot_time) return null;
    const dateTime = new Date(`${row.slot_date}T${String(row.slot_time).slice(0, 8)}`);
    return Number.isNaN(dateTime.getTime()) ? null : dateTime;
  }

  function compareByNearestUpcoming(left, right) {
    const now = new Date();
    const leftDate = createSlotDateTime(left);
    const rightDate = createSlotDateTime(right);
    if (!leftDate || !rightDate) return 0;
    const leftFuture = leftDate.getTime() >= now.getTime();
    const rightFuture = rightDate.getTime() >= now.getTime();
    if (leftFuture && rightFuture) return leftDate - rightDate;
    if (leftFuture !== rightFuture) return leftFuture ? -1 : 1;
    return rightDate - leftDate;
  }

  function getSlotWindow(row, fallbackInterval = DEFAULT_INTERVAL) {
    const startText = String(row.slot_time || "").slice(0, 5);
    const startMinutes = parseMinutes(startText);
    const rangeMatch = String(row.slot_label || "").match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    const endMinutes = rangeMatch
      ? parseMinutes(rangeMatch[2])
      : startMinutes + Number(fallbackInterval || DEFAULT_INTERVAL);
    return { startMinutes, endMinutes };
  }

  function isOverlapping(startA, endA, startB, endB) {
    return startA < endB && startB < endA;
  }

  function isSameInstructor(rowInstructor, targetInstructor) {
    const normalizedTarget = normalizeName(targetInstructor);
    if (!normalizedTarget) return true;
    return normalizeName(rowInstructor) === normalizedTarget;
  }

  function buildConflictMessage(dateValue, existingWindow, targetWindow) {
    return `${formatMonthDay(dateValue)}　${formatTimeRangeLabel(existingWindow.startMinutes, existingWindow.endMinutes)} の時間帯に登録があるため、${formatMonthDay(dateValue)}　${formatTimeRangeLabel(targetWindow.startMinutes, targetWindow.endMinutes)} は時間帯が重複します。`;
  }

  function getSlotRowsByRole(rows) {
    const activeRows = rows.filter((row) => row.is_active !== false);
    if (getSelectedRole() !== "staff") return activeRows;
    const staffName = getDefaultInstructorName();
    if (!staffName) return activeRows;
    const rowsWithInstructor = activeRows.filter((row) => String(row.instructor_name || "").trim());
    if (!rowsWithInstructor.length) return activeRows;
    return activeRows.filter((row) => normalizeName(row.instructor_name) === normalizeName(staffName));
  }

  function getStatusLabel(status) {
    if (status === "recommended") return "おすすめ表示";
    if (status === "closed") return "非公開";
    return "公開中";
  }

  function buildSlotCode(dateValue, timeValue) {
    const safeDate = String(dateValue || "").replaceAll("-", "");
    const safeTime = String(timeValue || "").replaceAll(":", "");
    const isValidDate = /^\d{8}$/.test(safeDate);
    const isValidTime = /^\d{4}$/.test(safeTime);
    return isValidDate && isValidTime ? `SLOT-${safeDate}-${safeTime}` : "";
  }

  function buildSlotLabel(timeValue, intervalValue) {
    if (!/^\d{2}:\d{2}$/.test(String(timeValue || ""))) return "未入力";
    const interval = Number(intervalValue || 60);
    const [hours, minutes] = String(timeValue || "00:00").split(":").map((value) => Number(value || 0));
    const totalMinutes = (hours * 60) + minutes + interval;
    const endHours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const endMinutes = String(totalMinutes % 60).padStart(2, "0");
    return timeValue ? `${timeValue}-${endHours}:${endMinutes}` : "未入力";
  }

  function setDeleteButtonState() {
    if (!deleteButton) return;
    deleteButton.disabled = !document.getElementById("slot-id").value;
  }

  function resetForm() {
    form.reset();
    selectedSlotId = "";
    document.getElementById("slot-id").value = "";
    document.getElementById("slot-capacity").value = DEFAULT_CAPACITY;
    document.getElementById("slot-interval").value = DEFAULT_INTERVAL;
    document.getElementById("slot-status").value = "open";
    document.getElementById("slot-sort").value = "0";
    document.getElementById("slot-active").checked = true;
    document.getElementById("slot-instructor").value = getDefaultInstructorName();
    document.getElementById("slot-date").value = selectedDateKey;
    renderPreview();
    setDeleteButtonState();
  }

  function fillForm(row) {
    selectedSlotId = row.id || "";
    if (row.slot_date) {
      selectedDateKey = row.slot_date;
      calendarStartDate = getWeekStart(parseDateKey(selectedDateKey));
    }
    document.getElementById("slot-id").value = row.id || "";
    document.getElementById("slot-code").value = row.slot_code || "";
    document.getElementById("slot-date").value = row.slot_date || "";
    document.getElementById("slot-time").value = String(row.slot_time || "").slice(0, 5);
    document.getElementById("slot-label").value = row.slot_label || "";
    document.getElementById("slot-instructor").value = row.instructor_name || "";
    document.getElementById("slot-status").value = row.status || "open";
    document.getElementById("slot-capacity").value = row.capacity || DEFAULT_CAPACITY;
    document.getElementById("slot-interval").value = DEFAULT_INTERVAL;
    document.getElementById("slot-sort").value = row.sort_order || 0;
    document.getElementById("slot-active").checked = row.is_active !== false;
    renderPreview();
    setDeleteButtonState();
  }

  function renderPreview() {
    const dateValue = document.getElementById("slot-date").value || "-";
    const timeValue = document.getElementById("slot-time").value || "-";
    const intervalValue = document.getElementById("slot-interval").value || DEFAULT_INTERVAL;
    const capacityValue = document.getElementById("slot-capacity").value || DEFAULT_CAPACITY;
    const labelValue = buildSlotLabel(timeValue, intervalValue);

    document.getElementById("slot-code").value = buildSlotCode(dateValue, timeValue);
    document.getElementById("slot-label").value = labelValue;
    previewDateEl.textContent = formatMonthDay(dateValue);
    previewTimeEl.textContent = timeValue;
    if (previewIntervalEl) previewIntervalEl.textContent = `${intervalValue}分`;
    if (previewCapacityEl) previewCapacityEl.textContent = `${capacityValue}名`;
  }

  async function getAllSlots() {
    return window.AdminData.listRows("reservation_slots", {
      orders: [
        { column: "slot_date", ascending: false },
        { column: "slot_time", ascending: false },
        { column: "sort_order", ascending: false }
      ]
    }).catch(() => []);
  }

  async function getAllReservations() {
    return window.AdminData.listRows("reservations").catch(() => []);
  }

  function renderWeekCalendar(rows) {
    if (!weekDaysEl || !weekRangeEl) return;
    const slotCountByDate = rows.reduce((acc, row) => {
      acc.set(row.slot_date, (acc.get(row.slot_date) || 0) + 1);
      return acc;
    }, new Map());
    const weekEndDate = addDays(calendarStartDate, 6);
    weekRangeEl.textContent = `${formatShortMonthDay(formatDateKey(calendarStartDate))} - ${formatShortMonthDay(formatDateKey(weekEndDate))}`;
    weekDaysEl.innerHTML = "";

    Array.from({ length: 7 }, (_, index) => addDays(calendarStartDate, index)).forEach((date) => {
      const dateKey = formatDateKey(date);
      const slotCount = slotCountByDate.get(dateKey) || 0;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `staff-week-day${dateKey === selectedDateKey ? " is-selected" : ""}${slotCount ? " has-slots" : ""}`;
      button.setAttribute("aria-pressed", dateKey === selectedDateKey ? "true" : "false");
      button.innerHTML = `
        <span class="staff-week-day-name">${formatWeekday(date)}</span>
        <strong>${formatShortMonthDay(dateKey)}</strong>
        <small>${slotCount}件</small>
      `;
      button.addEventListener("click", () => selectCalendarDate(dateKey));
      weekDaysEl.appendChild(button);
    });
  }

  async function renderRows() {
    const rows = getSlotRowsByRole(await getAllSlots()).sort(compareByNearestUpcoming);
    renderWeekCalendar(rows);
    const reservationCounts = reservations.reduce((acc, row) => {
      acc.set(row.slot_id, (acc.get(row.slot_id) || 0) + 1);
      return acc;
    }, new Map());
    const selectedRows = rows
      .filter((row) => row.slot_date === selectedDateKey)
      .sort((left, right) => String(left.slot_time || "").localeCompare(String(right.slot_time || "")));
    rowsEl.innerHTML = "";

    if (!selectedRows.length) {
      rowsEl.innerHTML = `<p class="admin-empty">表示できる予約枠はありません。</p>`;
      return;
    }

    selectedRows.forEach((row) => {
      const article = document.createElement("article");
      article.className = `portal-list-row portal-slot-row${selectedSlotId === row.id ? " is-selected" : ""}`;
      article.tabIndex = 0;
      article.setAttribute("role", "button");
      article.innerHTML = `
        <span>${formatShortMonthDay(row.slot_date || "")}</span>
        <span>${String(row.slot_time || "").slice(0, 5)}</span>
        <span>${row.capacity || 1}名</span>
        <span>${reservationCounts.get(row.id) || 0}組</span>
      `;
      const selectRow = () => {
        fillForm(row);
        renderRows();
      };
      article.addEventListener("click", selectRow);
      article.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectRow();
        }
      });
      rowsEl.appendChild(article);
    });
  }

  async function findSlotConflict({ dateValue, timeValue, intervalValue, instructorValue, excludeId = "" }) {
    const rows = await getAllSlots();
    const targetStart = parseMinutes(timeValue);
    const targetEnd = targetStart + Number(intervalValue || DEFAULT_INTERVAL);
    return rows.find((row) => {
      if (row.is_active === false) return false;
      if (excludeId && row.id === excludeId) return false;
      if (row.slot_date !== dateValue) return false;
      if (!isSameInstructor(row.instructor_name, instructorValue)) return false;
      const existingWindow = getSlotWindow(row);
      return isOverlapping(targetStart, targetEnd, existingWindow.startMinutes, existingWindow.endMinutes);
    }) || null;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const dateValue = document.getElementById("slot-date").value;
    const timeValue = document.getElementById("slot-time").value;
    const intervalValue = document.getElementById("slot-interval").value || DEFAULT_INTERVAL;
    const instructorValue = document.getElementById("slot-instructor").value.trim() || getDefaultInstructorName() || null;
    const id = document.getElementById("slot-id").value;
    const conflict = await findSlotConflict({
      dateValue,
      timeValue,
      intervalValue,
      instructorValue,
      excludeId: id
    });
    if (conflict) {
      const targetStart = parseMinutes(timeValue);
      const targetEnd = targetStart + Number(intervalValue || DEFAULT_INTERVAL);
      const existingWindow = getSlotWindow(conflict);
      window.alert(buildConflictMessage(
        dateValue,
        existingWindow,
        { startMinutes: targetStart, endMinutes: targetEnd }
      ));
      return;
    }
    const payload = {
      slot_code: buildSlotCode(dateValue, timeValue),
      slot_date: dateValue,
      slot_time: timeValue,
      slot_label: buildSlotLabel(timeValue, intervalValue),
      instructor_name: instructorValue,
      status: document.getElementById("slot-status").value,
      capacity: Number(document.getElementById("slot-capacity").value || DEFAULT_CAPACITY),
      sort_order: Number(document.getElementById("slot-sort").value || 0),
      is_active: document.getElementById("slot-active").checked,
      updated_at: new Date().toISOString()
    };
    if (window.__staffProfile?.id) {
      payload.staff_profile_id = window.__staffProfile.id;
    }
    if (id) {
      await window.AdminData.updateRow("reservation_slots", id, payload).catch(console.error);
    } else {
      await window.AdminData.insertRow("reservation_slots", payload).catch(console.error);
    }
    resetForm();
    await renderRows();
  });

  resetButton.addEventListener("click", resetForm);

  if (weekPrevButton) {
    weekPrevButton.addEventListener("click", () => {
      calendarStartDate = addDays(calendarStartDate, -7);
      selectedDateKey = formatDateKey(calendarStartDate);
      syncSelectedDateToForm({ clearSlot: true });
      renderRows();
    });
  }

  if (weekNextButton) {
    weekNextButton.addEventListener("click", () => {
      calendarStartDate = addDays(calendarStartDate, 7);
      selectedDateKey = formatDateKey(calendarStartDate);
      syncSelectedDateToForm({ clearSlot: true });
      renderRows();
    });
  }

  ["slot-date", "slot-time", "slot-interval", "slot-instructor", "slot-status", "slot-capacity"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderPreview);
    document.getElementById(id)?.addEventListener("change", renderPreview);
  });

  document.getElementById("slot-date")?.addEventListener("change", (event) => {
    const nextDate = event.target.value;
    if (!nextDate) return;
    selectedDateKey = nextDate;
    calendarStartDate = getWeekStart(parseDateKey(nextDate));
    renderRows();
  });

  if (previewFocusButton) {
    previewFocusButton.addEventListener("click", () => {
      document.getElementById("slot-date").focus();
    });
  }

  if (deleteButton) {
    deleteButton.addEventListener("click", async () => {
      const id = document.getElementById("slot-id").value;
      if (!id) return;
      const dateValue = document.getElementById("slot-date").value;
      const timeValue = document.getElementById("slot-time").value;
      const confirmed = window.confirm(
        `${formatMonthDay(dateValue)}の${String(timeValue || "").replace(":", "/")}の枠を削除しますか？この操作は取り消せません。`
      );
      if (!confirmed) return;
      await window.AdminData.deleteRow("reservation_slots", id).catch(console.error);
      resetForm();
      await renderRows();
    });
  }

  async function bootstrap() {
    const role = "staff";
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.__adminSession = session;
    window.__staffProfile = await window.AdminAuth.getStaffProfile?.(session);
    window.AdminAuth.persistPortalRole(role);
    syncDefaultInstructors();
    renderStaffNameLabel();
    window.AdminAuth.renderAdminHeader("staff-slots", {
      role,
      session,
      brandText: "Staff Slots",
      roleLabel: "",
      links: [
        { href: "staff-dashboard.html", label: "ダッシュボード", key: "staff-dashboard" },
        { href: "staff-reservations.html", label: "予約一覧", key: "reservations" }
      ]
    });
    reservations = await getAllReservations();
    renderPreview();
    resetForm();
    await renderRows();
  }

  bootstrap();
})();
