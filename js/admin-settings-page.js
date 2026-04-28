(function () {
  const STAFF_SETTING_KEY = "staff_directory";
  const SHIFT_SETTING_KEY = "staff_shift_overrides";
  const QR_PRODUCT_SETTING_KEY = "qr_product_public_settings";
  const QR_DEFAULT_SETTINGS = {
    price_10ml: 1000,
    price_30ml: 2860,
    max_volume_ml: 100,
    shop_phone: "03-1234-5678",
    business_hours: "11:00〜19:00"
  };
  const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
  const todayLabelEl = document.getElementById("settings-today-label");
  const todayStaffEl = document.getElementById("settings-today-staff");
  const controlNoteEl = document.getElementById("settings-control-note");
  const manageSelectEl = document.getElementById("staff-manage-select");
  const shiftManageSelectEl = document.getElementById("shift-manage-select");
  const calendarRangeEl = document.getElementById("settings-calendar-range");
  const calendarHeadEl = document.getElementById("settings-calendar-head");
  const calendarBodyEl = document.getElementById("settings-calendar-body");
  const qrSettingsFormEl = document.getElementById("qr-product-settings-form");
  const qrPrice10mlEl = document.getElementById("qr-price-10ml");
  const qrPrice30mlEl = document.getElementById("qr-price-30ml");
  const qrMaxVolumeEl = document.getElementById("qr-max-volume-ml");
  const qrShopPhoneEl = document.getElementById("qr-shop-phone");
  const qrBusinessHoursEl = document.getElementById("qr-business-hours");
  const qrSettingsNoteEl = document.getElementById("qr-settings-note");
  const TEMP_TODAY_STAFF_FIXTURES = [
    { staffName: "仮スタッフA", shiftLabel: "出勤時間 10:00 - 18:00" },
    { staffName: "仮スタッフB", shiftLabel: "出勤時間 10:00 - 18:00" },
    { staffName: "仮スタッフC", shiftLabel: "出勤時間 11:00 - 19:00" },
    { staffName: "仮スタッフD", shiftLabel: "出勤時間 10:00 - 17:00" },
    { staffName: "仮スタッフE", shiftLabel: "出勤時間 09:00 - 18:00" },
    { staffName: "仮スタッフF", shiftLabel: "出勤時間 10:00 - 16:00" }
  ];
  const staffModalEl = document.getElementById("staff-modal");
  if (staffModalEl) {
    staffModalEl.innerHTML = `
      <div class="portal-modal-backdrop" data-modal-close="staff-modal"></div>
      <div class="portal-modal-dialog portal-modal-dialog--settings">
        <form class="admin-form portal-settings-modal-form" id="staff-form">
          <input id="staff-id" type="hidden">
          <input id="staff-email" type="hidden">
          <input id="staff-phone" type="hidden">
          <input id="staff-color" type="hidden" value="#c78862">
          <input id="staff-default-start" type="hidden" value="10:00">
          <input id="staff-default-end" type="hidden" value="18:00">

          <section class="admin-panel admin-panel-soft portal-settings-modal-card portal-settings-credential-card">
            <h2 id="staff-modal-title" class="portal-settings-modal-title">スタッフ新規登録</h2>
            <div class="portal-settings-credential-grid">
              <label class="portal-settings-field">
                <span>スタッフ名</span>
                <input id="staff-name" type="text" required placeholder="例: スタッフA">
              </label>
              <label class="portal-settings-field">
                <span>スタッフ権限</span>
                <select id="staff-role">
                  <option value="staff">一般スタッフ</option>
                  <option value="manager">管理者</option>
                </select>
              </label>
              <label class="portal-settings-field">
                <span>スタッフID</span>
                <input id="staff-code" type="text" required autocomplete="username" placeholder="staff_a">
              </label>
              <label class="portal-settings-field portal-settings-password-field">
                <span>パスワード</span>
                <span class="portal-settings-password-wrap">
                  <input id="staff-password" type="password" required autocomplete="new-password" placeholder="password123">
                  <button class="admin-btn secondary portal-settings-visibility-toggle" type="button" data-toggle-password="staff-password">表示</button>
                </span>
              </label>
              <label class="portal-settings-field" data-manager-auth-row hidden>
                <span>管理者ID</span>
                <input id="manager-code" type="text" autocomplete="username" placeholder="staff_a">
              </label>
              <label class="portal-settings-field portal-settings-password-field" data-manager-auth-row hidden>
                <span>管理者パス</span>
                <span class="portal-settings-password-wrap">
                  <input id="manager-password" type="password" autocomplete="new-password" placeholder="password123">
                  <button class="admin-btn secondary portal-settings-visibility-toggle" type="button" data-toggle-password="manager-password">表示</button>
                </span>
              </label>
            </div>
          </section>

          <section class="admin-panel admin-panel-soft portal-settings-modal-card portal-settings-duty-card">
            <div class="portal-settings-shift-staff-banner" id="staff-duty-name-display" hidden></div>
            <div class="portal-settings-duty-head">
              <h3>勤務設定</h3>
              <p class="admin-note">曜日ごとの基準出勤 / 退勤 / 休み設定</p>
            </div>
            <div class="portal-settings-duty-tabs" id="staff-duty-tabs" hidden>
              <button class="portal-settings-duty-tab is-active" type="button" data-duty-tab="basic" aria-selected="true">基本設定</button>
              <button class="portal-settings-duty-tab" type="button" data-duty-tab="individual" aria-selected="false">個別設定</button>
            </div>
            <div class="portal-settings-duty-table portal-settings-duty-pane" data-duty-pane="basic">
              <div class="portal-settings-duty-head-row" aria-hidden="true">
                <span>曜日</span>
                <span>出勤</span>
                <span>退勤</span>
                <span>休み</span>
              </div>
              <div class="portal-week-pattern portal-settings-duty-body" id="staff-weekly-pattern"></div>
            </div>
            <div class="portal-settings-duty-table portal-settings-duty-pane" data-duty-pane="individual" hidden>
              <div class="portal-settings-duty-head-row" aria-hidden="true">
                <span>日付</span>
                <span>出勤</span>
                <span>退勤</span>
                <span>休み</span>
              </div>
              <div class="portal-settings-date-pattern" id="staff-date-pattern"></div>
            </div>
          </section>

          <div class="admin-actions portal-settings-modal-actions">
            <button class="admin-btn secondary portal-settings-modal-close" type="button" data-modal-close="staff-modal">閉じる</button>
            <button class="admin-btn primary" type="submit">保存</button>
            <button class="admin-btn secondary" id="staff-delete-button" type="button">削除</button>
          </div>
        </form>
      </div>
    `;
  }
  const staffForm = document.getElementById("staff-form");
  const staffIdEl = document.getElementById("staff-id");
  const staffCodeEl = document.getElementById("staff-code");
  const staffNameEl = document.getElementById("staff-name");
  const staffRoleEl = document.getElementById("staff-role");
  const staffPasswordEl = document.getElementById("staff-password");
  const managerCodeEl = document.getElementById("manager-code");
  const managerPasswordEl = document.getElementById("manager-password");
  const staffEmailEl = document.getElementById("staff-email");
  const staffPhoneEl = document.getElementById("staff-phone");
  const staffColorEl = document.getElementById("staff-color");
  const staffDefaultStartEl = document.getElementById("staff-default-start");
  const staffDefaultEndEl = document.getElementById("staff-default-end");
  const staffModalTitleEl = document.getElementById("staff-modal-title");
  const staffDeleteButtonEl = document.getElementById("staff-delete-button");
  const staffCredentialCardEl = staffModalEl?.querySelector(".portal-settings-credential-card") || null;
  const staffDutyCardEl = staffModalEl?.querySelector(".portal-settings-duty-card") || null;
  const staffDutyNameEl = document.getElementById("staff-duty-name-display");
  const staffShiftButtonEl = document.getElementById("staff-shift-button");
  const staffManageLabelEl = manageSelectEl?.closest(".portal-settings-select")?.querySelector("span") || null;
  const shiftManageLabelEl = shiftManageSelectEl?.closest(".portal-settings-select")?.querySelector("span") || null;
  const weeklyPatternEl = document.getElementById("staff-weekly-pattern");
  const datePatternEl = document.getElementById("staff-date-pattern");
  const dutyTabsEl = document.getElementById("staff-duty-tabs");
  const dutyTabButtons = Array.from(staffModalEl?.querySelectorAll("[data-duty-tab]") || []);
  const dutyPaneEls = Array.from(staffModalEl?.querySelectorAll("[data-duty-pane]") || []);
  const state = {
    settingRowMap: new Map(),
    staffDirectory: [],
    shiftOverrides: [],
    slots: [],
    reservations: [],
    weekOffset: 0,
    selectedStaffId: "",
    staffModalMode: "create",
    staffDutyTab: "basic",
    staffDateOverridesDirty: false
  };

  if (staffManageLabelEl) staffManageLabelEl.textContent = "スタッフ登録編集";
  if (shiftManageLabelEl) shiftManageLabelEl.textContent = "スタッフ出勤管理";
  if (staffShiftButtonEl) staffShiftButtonEl.textContent = "スタッフ出勤管理";

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

  function formatMonthDay(date) {
    return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatWeekLabel(startDate) {
    const endDate = addDays(startDate, 6);
    return `${formatMonthDay(startDate)} 〜 ${formatMonthDay(endDate)}`;
  }

  function normalizeTime(value, fallback) {
    const text = String(value || "").trim();
    return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
  }

  function normalizeLoginId(value, fallback = "") {
    const text = String(value || "").trim().toLowerCase();
    if (!text) return String(fallback || "").trim().toLowerCase();
    return text;
  }

  function isValidLoginId(value) {
    return /^[a-z0-9._-]+$/.test(normalizeLoginId(value));
  }

  function createStaffId(seed) {
    const text = String(seed || "").trim() || `staff-${Date.now()}`;
    return `staff-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || Date.now()}`;
  }

  function buildDefaultWeeklyPattern(defaultStart, defaultEnd) {
    return Array.from({ length: 7 }, (_, day) => {
      return [
        String(day),
        {
          isWorking: day !== 0 && day !== 6,
          startTime: defaultStart,
          endTime: defaultEnd
        }
      ];
    }).reduce((acc, [day, value]) => {
      acc[day] = value;
      return acc;
    }, {});
  }

  function normalizeWeeklyPattern(pattern, defaultStart, defaultEnd) {
    const source = pattern && typeof pattern === "object" ? pattern : {};
    const base = buildDefaultWeeklyPattern(defaultStart, defaultEnd);
    Object.keys(base).forEach((day) => {
      const row = source[day] || source[Number(day)] || {};
      const explicitWorking = typeof row.isWorking === "boolean"
        ? row.isWorking
        : (typeof row.is_working === "boolean" ? row.is_working : null);
      base[day] = {
        isWorking: explicitWorking === null ? base[day].isWorking : explicitWorking,
        startTime: normalizeTime(row.startTime || row.start_time, defaultStart),
        endTime: normalizeTime(row.endTime || row.end_time, defaultEnd)
      };
    });
    return base;
  }

  function normalizeStaff(row, index = 0) {
    const defaultStart = normalizeTime(row.defaultStart || row.default_start, "10:00");
    const defaultEnd = normalizeTime(row.defaultEnd || row.default_end, "18:00");
    const name = String(row.staffName || row.staff_name || row.material_name || row.name || "").trim() || `スタッフ${index + 1}`;
    const role = row.role === "manager" ? "manager" : "staff";
    const staffCode = normalizeLoginId(row.staffCode || row.staff_code || `staff-${index + 1}`);
    return {
      id: String(row.id || "").trim() || createStaffId(staffCode || name || index),
      staffCode,
      staffName: name,
      role,
      isTemporary: row.isTemporary === true || row.is_temporary === true,
      todayShiftLabel: String(row.todayShiftLabel || row.today_shift_label || "").trim(),
      staffPassword: String(row.staffPassword || row.staff_password || "").trim(),
      managerCode: normalizeLoginId(row.managerCode || row.manager_code || (role === "manager" ? staffCode : "")),
      managerPassword: String(row.managerPassword || row.manager_password || "").trim(),
      email: String(row.email || "").trim(),
      phone: String(row.phone || "").trim(),
      color: String(row.color || "#c78862"),
      defaultStart,
      defaultEnd,
      weeklyPattern: normalizeWeeklyPattern(row.weeklyPattern || row.weekly_pattern, defaultStart, defaultEnd)
    };
  }

  function normalizeOverride(row) {
    return {
      staffId: String(row.staffId || row.staff_id || "").trim(),
      date: String(row.date || "").trim(),
      isWorking: row.isWorking !== false && row.is_working !== false,
      startTime: normalizeTime(row.startTime || row.start_time, "10:00"),
      endTime: normalizeTime(row.endTime || row.end_time, "18:00")
    };
  }

  function stripStaffForSave(staff) {
    return {
      id: staff.id,
      staffCode: staff.staffCode,
      staffName: staff.staffName,
      role: staff.role,
      staffPassword: staff.staffPassword,
      managerCode: staff.managerCode,
      managerPassword: staff.managerPassword,
      email: staff.email,
      phone: staff.phone,
      color: staff.color,
      defaultStart: staff.defaultStart,
      defaultEnd: staff.defaultEnd,
      weeklyPattern: staff.weeklyPattern
    };
  }

  function createTemporaryStaff(index) {
    const fixture = TEMP_TODAY_STAFF_FIXTURES[index];
    if (!fixture) return null;
    const temp = normalizeStaff({
      id: `temp-staff-${index + 1}`,
      staffCode: `temp_staff_${index + 1}`,
      staffName: fixture.staffName,
      role: "staff",
      defaultStart: "10:00",
      defaultEnd: "18:00",
      isTemporary: true,
      todayShiftLabel: fixture.shiftLabel
    }, index);
    return temp;
  }

  function getDisplayStaffDirectory(limit = 6) {
    const realStaff = state.staffDirectory.slice(0, limit);
    const fillers = [];
    for (let index = realStaff.length; index < limit; index += 1) {
      const temp = createTemporaryStaff(index);
      if (temp) fillers.push(temp);
    }
    return realStaff.concat(fillers);
  }

  function getSelectableStaffDirectory(minimum = 6) {
    return getDisplayStaffDirectory(Math.max(state.staffDirectory.length, minimum));
  }

  function stripOverrideForSave(row) {
    return {
      staffId: row.staffId,
      date: row.date,
      isWorking: row.isWorking,
      startTime: row.startTime,
      endTime: row.endTime
    };
  }

  function syncLoginIndexStorage() {
    const payload = {
      staff: Array.from(new Set(
        state.staffDirectory
          .filter((row) => String(row.staffPassword || "").trim())
          .map((row) => normalizeLoginId(row.staffCode))
          .filter(Boolean)
      )),
      manager: Array.from(new Set(
        state.staffDirectory
          .filter((row) => row.role === "manager" && String(row.managerPassword || "").trim())
          .map((row) => normalizeLoginId(row.managerCode))
          .filter(Boolean)
      ))
    };
    window.localStorage.setItem("fragrancePortalLoginIndex", JSON.stringify(payload));
  }

  function getWeekStartDate() {
    const today = createLocalDate(new Date());
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return addDays(today, mondayOffset + (state.weekOffset * 7));
  }

  function getWeekDates(count) {
    const start = getWeekStartDate();
    return Array.from({ length: count }, (_, index) => addDays(start, index));
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function extractShiftTimes(label, fallbackStart = "10:00", fallbackEnd = "18:00") {
    const match = String(label || "").match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    return {
      startTime: match?.[1] || fallbackStart,
      endTime: match?.[2] || fallbackEnd
    };
  }

  function findDisplayStaffById(staffId) {
    if (!staffId) return null;
    return getDisplayStaffDirectory(Math.max(state.staffDirectory.length, 6)).find((row) => row.id === staffId) || null;
  }

  function buildStaffSelectMarkup(staffRows, placeholderText) {
    const options = staffRows.map((staff) => {
      const suffix = staff.isTemporary ? " / 仮データ" : ` / ${staff.staffCode}`;
      return `<option value="${staff.id}">${staff.staffName}${suffix}</option>`;
    }).join("");
    return `<option value="">${placeholderText}</option>${options}`;
  }

  function getReservationCountBySlotIds(slotIds) {
    const slotIdSet = new Set(slotIds);
    return state.reservations.filter((row) => slotIdSet.has(row.slot_id)).length;
  }

  function getStaffSlotsByDate(staffName, dateKey) {
    return state.slots.filter((row) => row.is_active !== false && row.slot_date === dateKey && normalizeName(row.instructor_name) === normalizeName(staffName));
  }

  function getBaseShiftForDate(staff, dateKey) {
    const date = new Date(`${dateKey}T00:00:00`);
    const pattern = staff.weeklyPattern[String(date.getDay())] || {};
    return {
      staffId: staff.id,
      date: dateKey,
      isWorking: pattern.isWorking !== false,
      startTime: normalizeTime(pattern.startTime, staff.defaultStart),
      endTime: normalizeTime(pattern.endTime, staff.defaultEnd)
    };
  }

  function getShiftForDate(staff, dateKey) {
    const override = state.shiftOverrides.find((row) => row.staffId === staff.id && row.date === dateKey);
    return override || getBaseShiftForDate(staff, dateKey);
  }

  function setControlNote(message, isError) {
    if (!controlNoteEl) return;
    controlNoteEl.hidden = !String(message || "").trim();
    controlNoteEl.textContent = message;
    controlNoteEl.className = `portal-settings-control-note ${isError ? "admin-error" : "admin-note"}`;
  }

  function openModal(modalEl) {
    if (modalEl) modalEl.hidden = false;
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.hidden = true;
  }

  function syncRoleFields() {
    if (!staffRoleEl) return;
    const isManager = staffRoleEl.value === "manager";
    document.querySelectorAll("[data-manager-auth-row]").forEach((row) => {
      row.hidden = !isManager;
      row.style.display = isManager ? "" : "none";
    });
    managerCodeEl.required = isManager;
    managerPasswordEl.required = isManager;
    managerCodeEl.disabled = !isManager;
    managerPasswordEl.disabled = !isManager;
    if (isManager) {
      if (!managerCodeEl.value.trim()) managerCodeEl.value = staffCodeEl.value.trim();
      if (!managerPasswordEl.value.trim() && staffPasswordEl.value.trim()) {
        managerPasswordEl.value = staffPasswordEl.value.trim();
      }
    }
  }

  function syncWeeklyPatternState() {
    weeklyPatternEl.querySelectorAll("[data-weekday-row]").forEach((row) => {
      const isOff = row.querySelector("[data-weekday-off]")?.checked === true;
      row.classList.toggle("is-off", isOff);
      row.querySelectorAll('input[type="time"]').forEach((input) => {
        input.disabled = isOff;
      });
    });
  }

  function syncDatePatternState() {
    if (!datePatternEl) return;
    datePatternEl.querySelectorAll("[data-date-row]").forEach((row) => {
      const isOff = row.querySelector("[data-date-off]")?.checked === true;
      row.classList.toggle("is-off", isOff);
      row.querySelectorAll('input[type="time"]').forEach((input) => {
        input.disabled = isOff;
      });
    });
  }

  function deriveDefaultTimesFromModal() {
    const firstWorkingRow = Array.from({ length: 7 }, (_, dayIndex) => {
      return {
        isWorking: weeklyPatternEl.querySelector(`[data-weekday-off="${dayIndex}"]`)?.checked !== true,
        startTime: normalizeTime(weeklyPatternEl.querySelector(`[data-weekday-start="${dayIndex}"]`)?.value, "10:00"),
        endTime: normalizeTime(weeklyPatternEl.querySelector(`[data-weekday-end="${dayIndex}"]`)?.value, "18:00")
      };
    }).find((row) => row.isWorking);
    return {
      defaultStart: firstWorkingRow?.startTime || normalizeTime(staffDefaultStartEl.value, "10:00"),
      defaultEnd: firstWorkingRow?.endTime || normalizeTime(staffDefaultEndEl.value, "18:00")
    };
  }

  function readWeeklyPatternFromModal(defaultStart, defaultEnd) {
    return Array.from({ length: 7 }, (_, dayIndex) => {
      return [
        String(dayIndex),
        {
          isWorking: weeklyPatternEl.querySelector(`[data-weekday-off="${dayIndex}"]`)?.checked !== true,
          startTime: normalizeTime(weeklyPatternEl.querySelector(`[data-weekday-start="${dayIndex}"]`)?.value, defaultStart),
          endTime: normalizeTime(weeklyPatternEl.querySelector(`[data-weekday-end="${dayIndex}"]`)?.value, defaultEnd)
        }
      ];
    }).reduce((acc, [day, value]) => {
      acc[day] = value;
      return acc;
    }, {});
  }

  function buildDutyStaffFromModal() {
    const { defaultStart, defaultEnd } = deriveDefaultTimesFromModal();
    return normalizeStaff({
      id: staffIdEl.value || state.selectedStaffId,
      staffCode: staffCodeEl.value,
      staffName: staffNameEl.value,
      role: staffRoleEl.value,
      staffPassword: staffPasswordEl.value,
      managerCode: managerCodeEl.value,
      managerPassword: managerPasswordEl.value,
      email: staffEmailEl.value,
      phone: staffPhoneEl.value,
      color: staffColorEl.value,
      defaultStart,
      defaultEnd,
      weeklyPattern: readWeeklyPatternFromModal(defaultStart, defaultEnd)
    });
  }

  function isSameShiftAsBase(shift, base) {
    return shift.isWorking === base.isWorking
      && normalizeTime(shift.startTime, base.startTime) === base.startTime
      && normalizeTime(shift.endTime, base.endTime) === base.endTime;
  }

  function renderStaffDateOverrides(staff) {
    if (!datePatternEl || !staff?.id) return;
    const dates = getWeekDates(14);
    datePatternEl.innerHTML = dates.map((date) => {
      const dateKey = formatDateKey(date);
      const shift = getShiftForDate(staff, dateKey);
      return `
        <article class="portal-settings-duty-row portal-settings-date-duty-row" data-date-row="${dateKey}">
          <strong class="portal-settings-duty-day">
            ${formatMonthDay(date)}
            <small>${WEEKDAY_LABELS[date.getDay()]}</small>
          </strong>
          <div class="portal-settings-duty-time">
            <input type="time" data-date-start="${dateKey}" value="${shift.startTime}">
          </div>
          <div class="portal-settings-duty-time">
            <input type="time" data-date-end="${dateKey}" value="${shift.endTime}">
          </div>
          <label class="portal-settings-duty-off">
            <input type="checkbox" data-date-off="${dateKey}" ${shift.isWorking === false ? "checked" : ""}>
          </label>
        </article>
      `;
    }).join("");
    syncDatePatternState();
    state.staffDateOverridesDirty = false;
  }

  function readDateOverridesFromModal(staff) {
    if (!datePatternEl || !staff?.id) return [];
    return Array.from(datePatternEl.querySelectorAll("[data-date-row]")).map((row) => {
      const dateKey = row.dataset.dateRow;
      const base = getBaseShiftForDate(staff, dateKey);
      const value = {
        staffId: staff.id,
        date: dateKey,
        isWorking: row.querySelector(`[data-date-off="${dateKey}"]`)?.checked !== true,
        startTime: normalizeTime(row.querySelector(`[data-date-start="${dateKey}"]`)?.value, base.startTime),
        endTime: normalizeTime(row.querySelector(`[data-date-end="${dateKey}"]`)?.value, base.endTime)
      };
      return isSameShiftAsBase(value, base) ? null : stripOverrideForSave(value);
    }).filter(Boolean);
  }

  function renderWeeklyPatternInputs(staff) {
    weeklyPatternEl.innerHTML = WEEKDAY_LABELS.map((label, dayIndex) => {
      const pattern = staff.weeklyPattern[String(dayIndex)] || {};
      return `
        <article class="portal-week-pattern-row">
          <strong>${label}</strong>
          <label class="portal-inline-checkbox">
            <input type="checkbox" data-weekday-working="${dayIndex}" ${pattern.isWorking !== false ? "checked" : ""}>
            <span>出勤</span>
          </label>
          <input type="time" data-weekday-start="${dayIndex}" value="${pattern.startTime || staff.defaultStart}">
          <input type="time" data-weekday-end="${dayIndex}" value="${pattern.endTime || staff.defaultEnd}">
        </article>
      `;
    }).join("");
  }

  function getSelectedStaff() {
    return findDisplayStaffById(state.selectedStaffId) || getDisplayStaffDirectory(6)[0] || null;
  }

  function getStoredStaffById(staffId) {
    return state.staffDirectory.find((row) => row.id === staffId) || null;
  }

  function setCredentialFieldsDisabled(disabled) {
    [
      staffCodeEl,
      staffNameEl,
      staffRoleEl,
      staffPasswordEl,
      managerCodeEl,
      managerPasswordEl
    ].forEach((field) => {
      if (field) field.disabled = disabled;
    });
  }

  function setDutyTab(tab) {
    const nextTab = state.staffModalMode === "duty" && tab === "individual" ? "individual" : "basic";
    state.staffDutyTab = nextTab;
    if (nextTab === "individual" && !state.staffDateOverridesDirty) {
      renderStaffDateOverrides(buildDutyStaffFromModal());
    }
    dutyTabButtons.forEach((button) => {
      const isActive = button.dataset.dutyTab === nextTab;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
    dutyPaneEls.forEach((pane) => {
      pane.hidden = pane.dataset.dutyPane !== nextTab;
    });
  }

  function setStaffModalMode(mode, staff, isTemporary = false) {
    state.staffModalMode = mode;
    if (staffModalEl) staffModalEl.dataset.mode = mode;
    if (staffCredentialCardEl) staffCredentialCardEl.hidden = mode === "duty";
    if (staffDutyCardEl) staffDutyCardEl.hidden = mode === "edit";
    if (staffDutyNameEl) {
      staffDutyNameEl.hidden = mode !== "duty";
      staffDutyNameEl.textContent = staff?.staffName || "";
    }
    if (dutyTabsEl) dutyTabsEl.hidden = mode !== "duty";
    state.staffDateOverridesDirty = false;
    if (datePatternEl && mode !== "duty") datePatternEl.innerHTML = "";
    if (mode === "duty") {
      setCredentialFieldsDisabled(true);
    } else {
      setCredentialFieldsDisabled(false);
      syncRoleFields();
    }
    setDutyTab("basic");
    if (staffDeleteButtonEl) {
      const canDelete = mode === "edit" && staff && !isTemporary;
      staffDeleteButtonEl.hidden = !canDelete;
      staffDeleteButtonEl.disabled = !canDelete;
    }
  }

  function openStaffModal(staff) {
    const target = staff ? normalizeStaff(staff) : normalizeStaff({});
    document.getElementById("staff-modal-title").textContent = staff ? "登録モーダル" : "スタッフ新規登録";
    document.getElementById("staff-id").value = staff?.id || "";
    document.getElementById("staff-code").value = staff?.staffCode || "";
    document.getElementById("staff-name").value = staff?.staffName || "";
    document.getElementById("staff-role").value = staff?.role || "staff";
    document.getElementById("staff-email").value = staff?.email || "";
    document.getElementById("staff-phone").value = staff?.phone || "";
    document.getElementById("staff-color").value = staff?.color || "#c78862";
    document.getElementById("staff-default-start").value = staff?.defaultStart || "10:00";
    document.getElementById("staff-default-end").value = staff?.defaultEnd || "18:00";
    renderWeeklyPatternInputs(target);
    openModal(staffModalEl);
  }

  function renderStaffWeeklyPattern(staff) {
    weeklyPatternEl.innerHTML = WEEKDAY_LABELS.map((label, dayIndex) => {
      const pattern = staff.weeklyPattern[String(dayIndex)] || {};
      return `
        <article class="portal-settings-duty-row ${pattern.isWorking === false ? "is-off" : ""}" data-weekday-row="${dayIndex}">
          <strong class="portal-settings-duty-day">${label}</strong>
          <div class="portal-settings-duty-time">
            <input type="time" data-weekday-start="${dayIndex}" value="${pattern.startTime || staff.defaultStart}">
          </div>
          <div class="portal-settings-duty-time">
            <input type="time" data-weekday-end="${dayIndex}" value="${pattern.endTime || staff.defaultEnd}">
          </div>
          <label class="portal-settings-duty-off">
            <input type="checkbox" data-weekday-off="${dayIndex}" ${pattern.isWorking === false ? "checked" : ""}>
          </label>
        </article>
      `;
    }).join("");
    syncWeeklyPatternState();
  }

  function launchStaffModal(staff, mode = "") {
    const isTemporary = staff?.isTemporary === true;
    const modalMode = mode || (staff && !isTemporary ? "edit" : "create");
    const temporaryTimes = extractShiftTimes(staff?.todayShiftLabel, "10:00", "18:00");
    const target = isTemporary
      ? normalizeStaff({
        staffName: staff?.staffName || "",
        role: "staff",
        defaultStart: temporaryTimes.startTime,
        defaultEnd: temporaryTimes.endTime,
        weeklyPattern: buildDefaultWeeklyPattern(temporaryTimes.startTime, temporaryTimes.endTime)
      })
      : (staff ? normalizeStaff(staff) : normalizeStaff({}));
    staffModalTitleEl.textContent = modalMode === "duty"
      ? "スタッフ出勤管理"
      : (modalMode === "edit" ? "スタッフ編集" : "スタッフ新規登録");
    staffIdEl.value = isTemporary ? "" : (staff?.id || "");
    staffCodeEl.value = isTemporary ? "" : (staff?.staffCode || "");
    staffNameEl.value = target.staffName || "";
    staffRoleEl.value = target.role || "staff";
    staffPasswordEl.value = isTemporary ? "" : (staff?.staffPassword || "");
    managerCodeEl.value = isTemporary ? "" : (staff?.managerCode || "");
    managerPasswordEl.value = isTemporary ? "" : (staff?.managerPassword || "");
    staffEmailEl.value = isTemporary ? "" : (staff?.email || "");
    staffPhoneEl.value = isTemporary ? "" : (staff?.phone || "");
    staffColorEl.value = target.color || "#c78862";
    staffDefaultStartEl.value = target.defaultStart || "10:00";
    staffDefaultEndEl.value = target.defaultEnd || "18:00";
    renderStaffWeeklyPattern(target);
    setStaffModalMode(modalMode, target, isTemporary);
    setControlNote("", false);
    openModal(staffModalEl);
  }

  function openStaffDutyModal(staff) {
    if (!staff || staff.isTemporary) {
      setControlNote("先にスタッフを登録してください。", true);
      return;
    }
    state.selectedStaffId = staff.id;
    launchStaffModal(staff, "duty");
  }

  function renderManageSelect() {
    const staffRows = state.staffDirectory;
    manageSelectEl.innerHTML = buildStaffSelectMarkup(staffRows, "スタッフ登録編集");
    manageSelectEl.value = "";
  }

  function renderShiftManageSelect() {
    if (!shiftManageSelectEl) return;
    const staffRows = state.staffDirectory;
    shiftManageSelectEl.innerHTML = buildStaffSelectMarkup(staffRows, "スタッフ出勤管理");
    shiftManageSelectEl.value = "";
  }

  function renderStaffChips() {
    return;
  }

  function renderTodayStaff() {
    const today = createLocalDate(new Date());
    const dateKey = formatDateKey(today);
    todayLabelEl.textContent = formatMonthDay(today);
    const visibleStaff = getDisplayStaffDirectory(6);
    todayStaffEl.innerHTML = Array.from({ length: 6 }, (_, index) => {
      const staff = visibleStaff[index];
      if (!staff) {
        return `<article class="admin-item-card portal-settings-staff-card" hidden aria-hidden="true"></article>`;
      }
      const shift = getShiftForDate(staff, dateKey);
      const shiftLabel = staff.isTemporary
        ? (staff.todayShiftLabel || `出勤時間 ${shift.startTime} - ${shift.endTime}`)
        : (shift.isWorking ? `出勤時間 ${shift.startTime} - ${shift.endTime}` : "休み");
      return `
        <article class="admin-item-card portal-settings-staff-card ${shift.isWorking ? "" : "is-off"} ${staff.isTemporary ? "is-temporary" : ""}">
          <h3>${staff.staffName}</h3>
          <p>${shiftLabel}</p>
        </article>
      `;
    }).join("");
  }

  function renderCalendar() {
    const weekDates = getWeekDates(7);
    const visibleStaff = getDisplayStaffDirectory(4);
    calendarRangeEl.textContent = `表示期間: ${formatWeekLabel(weekDates[0])}`;
    calendarHeadEl.innerHTML = `
      <tr>
        <th>日付</th>
        ${Array.from({ length: 4 }, (_, index) => {
          const staff = visibleStaff[index];
          if (!staff) {
            return `<th hidden aria-hidden="true"></th><th hidden aria-hidden="true"></th>`;
          }
          return `
            <th>${staff.staffName}</th>
            <th>数 / 枠</th>
          `;
        }).join("")}
      </tr>
    `;
    if (!visibleStaff.length) {
      calendarBodyEl.innerHTML = `<tr><td colspan="9" class="portal-calendar-empty">スタッフを登録するとカレンダーが表示されます。</td></tr>`;
      return;
    }
    calendarBodyEl.innerHTML = weekDates.map((date) => {
      const dateKey = formatDateKey(date);
      return `
        <tr>
          <th class="portal-settings-date-cell">
            <strong>${formatMonthDay(date)}</strong>
            <small>（${WEEKDAY_LABELS[date.getDay()]}）</small>
          </th>
          ${Array.from({ length: 4 }, (_, index) => {
            const staff = visibleStaff[index];
            if (!staff) {
              return `<td hidden aria-hidden="true"></td><td hidden aria-hidden="true"></td>`;
            }
            const shift = getShiftForDate(staff, dateKey);
            const slotRows = getStaffSlotsByDate(staff.staffName, dateKey);
            const reservationCount = getReservationCountBySlotIds(slotRows.map((row) => row.id));
            const ratioText = shift.isWorking ? `${reservationCount} / ${slotRows.length}` : "-";
            return `
              <td class="portal-settings-shift-cell ${shift.isWorking ? "is-working" : "is-off"}">
                <div class="portal-calendar-cell">
                  <strong>${shift.isWorking ? `${shift.startTime} - ${shift.endTime}` : "休み"}</strong>
                </div>
              </td>
              <td class="portal-settings-count-cell ${shift.isWorking ? "is-working" : "is-off"}">
                <span class="portal-settings-count-pill">${ratioText}</span>
              </td>
            `;
          }).join("")}
        </tr>
      `;
    }).join("");
  }

  function renderPage() {
    renderManageSelect();
    renderShiftManageSelect();
    renderStaffChips();
    renderTodayStaff();
    renderCalendar();
  }

  async function saveSetting(key, value, options = {}) {
    const payload = {
      setting_key: key,
      setting_value: value,
      updated_at: new Date().toISOString()
    };
    if (Object.prototype.hasOwnProperty.call(options, "isPublic")) {
      payload.is_public = Boolean(options.isPublic);
    }
    const existing = state.settingRowMap.get(key);
    if (existing?.id) {
      const rows = await window.AdminData.updateRow("admin_settings", existing.id, payload).catch(() => []);
      if (rows[0]) state.settingRowMap.set(key, rows[0]);
      return;
    }
    const rows = await window.AdminData.insertRow("admin_settings", payload).catch(() => []);
    if (rows[0]) state.settingRowMap.set(key, rows[0]);
  }

  function readSettingValue(key) {
    return state.settingRowMap.get(key)?.setting_value;
  }

  function normalizeQrSettings(value) {
    const source = value && typeof value === "object" ? value : {};
    return {
      price_10ml: Number(source.price_10ml ?? source.price10ml ?? QR_DEFAULT_SETTINGS.price_10ml),
      price_30ml: Number(source.price_30ml ?? source.price30ml ?? QR_DEFAULT_SETTINGS.price_30ml),
      max_volume_ml: Number(source.max_volume_ml ?? source.maxVolumeMl ?? QR_DEFAULT_SETTINGS.max_volume_ml),
      shop_phone: String(source.shop_phone ?? source.shopPhone ?? QR_DEFAULT_SETTINGS.shop_phone),
      business_hours: String(source.business_hours ?? source.businessHours ?? QR_DEFAULT_SETTINGS.business_hours)
    };
  }

  function setQrSettingsNote(message, isError = false) {
    if (!qrSettingsNoteEl) return;
    qrSettingsNoteEl.textContent = message;
    qrSettingsNoteEl.className = isError ? "admin-error" : "admin-note";
  }

  function fillQrSettingsForm() {
    if (!qrSettingsFormEl) return;
    const settings = normalizeQrSettings(readSettingValue(QR_PRODUCT_SETTING_KEY));
    if (qrPrice10mlEl) qrPrice10mlEl.value = String(settings.price_10ml);
    if (qrPrice30mlEl) qrPrice30mlEl.value = String(settings.price_30ml);
    if (qrMaxVolumeEl) qrMaxVolumeEl.value = String(settings.max_volume_ml);
    if (qrShopPhoneEl) qrShopPhoneEl.value = settings.shop_phone;
    if (qrBusinessHoursEl) qrBusinessHoursEl.value = settings.business_hours;
  }

  function readQrSettingsForm() {
    return normalizeQrSettings({
      price_10ml: qrPrice10mlEl?.value,
      price_30ml: qrPrice30mlEl?.value,
      max_volume_ml: qrMaxVolumeEl?.value,
      shop_phone: qrShopPhoneEl?.value,
      business_hours: qrBusinessHoursEl?.value
    });
  }

  async function loadData() {
    const [settingsRows, slots, reservations] = await Promise.all([
      window.AdminData.listRows("admin_settings", { orders: [{ column: "updated_at", ascending: false }] }).catch(() => []),
      window.AdminData.listRows("reservation_slots", { orders: [{ column: "slot_date", ascending: true }, { column: "slot_time", ascending: true }] }).catch(() => []),
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }] }).catch(() => [])
    ]);
    state.settingRowMap = new Map((settingsRows || []).map((row) => [row.setting_key, row]));
    state.slots = slots || [];
    state.reservations = reservations || [];
    const storedStaff = Array.isArray(readSettingValue(STAFF_SETTING_KEY)) ? readSettingValue(STAFF_SETTING_KEY) : [];
    const storedOverrides = Array.isArray(readSettingValue(SHIFT_SETTING_KEY)) ? readSettingValue(SHIFT_SETTING_KEY) : [];
    state.staffDirectory = storedStaff.map(normalizeStaff);
    if (!state.staffDirectory.length) {
      const derivedNames = Array.from(new Set(state.slots.map((row) => String(row.instructor_name || "").trim()).filter(Boolean)));
      state.staffDirectory = derivedNames.map((name, index) => normalizeStaff({ staffCode: `slot-${index + 1}`, staffName: name }, index));
      if (state.staffDirectory.length) {
        setControlNote("予約枠の担当名から仮スタッフ一覧を生成しています。保存すると管理データとして固定されます。", false);
      } else {
        setControlNote("スタッフを新規登録すると、この画面とカレンダーへ反映されます。", false);
      }
    } else {
      setControlNote("登録済みスタッフを読み込みました。", false);
    }
    state.shiftOverrides = storedOverrides.map(normalizeOverride);
    if (!state.selectedStaffId && state.staffDirectory[0]) {
      state.selectedStaffId = state.staffDirectory[0].id;
    }
    syncLoginIndexStorage();
    renderPage();
    fillQrSettingsForm();
  }

  staffForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const staffCode = normalizeLoginId(staffCodeEl.value);
    const managerCode = normalizeLoginId(managerCodeEl.value);
    const role = staffRoleEl.value;
    const modalMode = state.staffModalMode || "create";
    const editingId = staffIdEl.value || undefined;
    const existingStaff = editingId ? getStoredStaffById(editingId) : null;
    if (modalMode === "duty") {
      if (!existingStaff) {
        setControlNote("先にスタッフを登録してください。", true);
        return;
      }
      const { defaultStart, defaultEnd } = deriveDefaultTimesFromModal();
      const payload = normalizeStaff({
        ...existingStaff,
        defaultStart,
        defaultEnd,
        weeklyPattern: readWeeklyPatternFromModal(defaultStart, defaultEnd)
      });
      const index = state.staffDirectory.findIndex((row) => row.id === payload.id);
      if (index >= 0) state.staffDirectory[index] = payload;
      if (state.staffDateOverridesDirty) {
        const visibleDateKeys = new Set(
          Array.from(datePatternEl?.querySelectorAll("[data-date-row]") || []).map((row) => row.dataset.dateRow)
        );
        state.shiftOverrides = state.shiftOverrides
          .filter((row) => row.staffId !== payload.id || !visibleDateKeys.has(row.date))
          .concat(readDateOverridesFromModal(payload));
      }
      await saveSetting(STAFF_SETTING_KEY, state.staffDirectory.map(stripStaffForSave));
      await saveSetting(SHIFT_SETTING_KEY, state.shiftOverrides.map(stripOverrideForSave));
      closeModal(staffModalEl);
      setControlNote(`${payload.staffName} の勤務設定を保存しました。`, false);
      renderPage();
      return;
    }
    if (!staffNameEl.value.trim()) {
      setControlNote("スタッフ名を入力してください。", true);
      return;
    }
    if (!isValidLoginId(staffCode)) {
      setControlNote("スタッフIDは半角英数字 / . / _ / - のみで入力してください。", true);
      return;
    }
    if (!staffPasswordEl.value.trim()) {
      setControlNote("スタッフ用のパスワードを入力してください。", true);
      return;
    }
    if (role === "manager" && !isValidLoginId(managerCode)) {
      setControlNote("管理者IDは半角英数字 / . / _ / - のみで入力してください。", true);
      return;
    }
    if (role === "manager" && !managerPasswordEl.value.trim()) {
      setControlNote("管理者用のパスワードを入力してください。", true);
      return;
    }
    const hasDuplicateStaffId = state.staffDirectory.some((row) => row.id !== editingId && normalizeLoginId(row.staffCode) === staffCode);
    if (hasDuplicateStaffId) {
      setControlNote("同じスタッフIDは登録できません。", true);
      return;
    }
    const hasDuplicateManagerId = role === "manager" && state.staffDirectory.some((row) => row.id !== editingId && normalizeLoginId(row.managerCode) === managerCode);
    if (hasDuplicateManagerId) {
      setControlNote("同じ管理者IDは登録できません。", true);
      return;
    }
    const derivedTimes = modalMode === "edit" && existingStaff
      ? { defaultStart: existingStaff.defaultStart, defaultEnd: existingStaff.defaultEnd }
      : deriveDefaultTimesFromModal();
    const { defaultStart, defaultEnd } = derivedTimes;
    staffDefaultStartEl.value = defaultStart;
    staffDefaultEndEl.value = defaultEnd;
    const weeklyPattern = modalMode === "edit" && existingStaff
      ? existingStaff.weeklyPattern
      : readWeeklyPatternFromModal(defaultStart, defaultEnd);
    const payload = normalizeStaff({
      id: editingId,
      staffCode,
      staffName: staffNameEl.value.trim(),
      role,
      staffPassword: staffPasswordEl.value.trim(),
      managerCode: role === "manager" ? managerCode : "",
      managerPassword: role === "manager" ? managerPasswordEl.value.trim() : "",
      email: staffEmailEl.value.trim(),
      phone: staffPhoneEl.value.trim(),
      color: staffColorEl.value,
      defaultStart,
      defaultEnd,
      weeklyPattern
    });
    const index = state.staffDirectory.findIndex((row) => row.id === payload.id);
    if (index >= 0) {
      state.staffDirectory[index] = payload;
    } else {
      state.staffDirectory.push(payload);
    }
    state.selectedStaffId = payload.id;
    await saveSetting(STAFF_SETTING_KEY, state.staffDirectory.map(stripStaffForSave));
    syncLoginIndexStorage();
    closeModal(staffModalEl);
    setControlNote(`${payload.staffName} を保存しました。`, false);
    renderPage();
  });

  if (staffRoleEl) {
    staffRoleEl.addEventListener("change", syncRoleFields);
  }

  if (staffCodeEl) {
    staffCodeEl.addEventListener("input", () => {
      if (staffRoleEl.value === "manager" && !managerCodeEl.value.trim()) {
        managerCodeEl.value = normalizeLoginId(staffCodeEl.value);
      }
    });
  }

  if (staffPasswordEl) {
    staffPasswordEl.addEventListener("input", () => {
      if (staffRoleEl.value === "manager" && !managerPasswordEl.value.trim()) {
        managerPasswordEl.value = staffPasswordEl.value;
      }
    });
  }

  weeklyPatternEl.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement && event.target.matches("[data-weekday-off]")) {
      syncWeeklyPatternState();
    }
  });

  dutyTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setDutyTab(button.dataset.dutyTab);
    });
  });

  if (datePatternEl) {
    datePatternEl.addEventListener("change", (event) => {
      if (event.target instanceof HTMLInputElement && event.target.matches("[data-date-off]")) {
        syncDatePatternState();
      }
      if (event.target instanceof HTMLInputElement) {
        state.staffDateOverridesDirty = true;
      }
    });
    datePatternEl.addEventListener("input", (event) => {
      if (event.target instanceof HTMLInputElement) {
        state.staffDateOverridesDirty = true;
      }
    });
  }

  document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      if (!(input instanceof HTMLInputElement)) return;
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      button.textContent = isHidden ? "非表示" : "表示";
    });
  });

  if (staffDeleteButtonEl) {
    staffDeleteButtonEl.addEventListener("click", async () => {
      const staffId = staffIdEl.value;
      if (!staffId) {
        closeModal(staffModalEl);
        return;
      }
      const target = state.staffDirectory.find((row) => row.id === staffId);
      if (!target) {
        closeModal(staffModalEl);
        return;
      }
      if (!window.confirm(`${target.staffName} を削除します。よろしいですか？`)) {
        return;
      }
      state.staffDirectory = state.staffDirectory.filter((row) => row.id !== staffId);
      state.shiftOverrides = state.shiftOverrides.filter((row) => row.staffId !== staffId);
      if (state.selectedStaffId === staffId) {
        state.selectedStaffId = state.staffDirectory[0]?.id || "";
      }
      await saveSetting(STAFF_SETTING_KEY, state.staffDirectory.map(stripStaffForSave));
      await saveSetting(SHIFT_SETTING_KEY, state.shiftOverrides.map(stripOverrideForSave));
      syncLoginIndexStorage();
      closeModal(staffModalEl);
      setControlNote(`${target.staffName} を削除しました。`, false);
      renderPage();
    });
  }

  document.getElementById("staff-create-button").addEventListener("click", () => {
    launchStaffModal(null);
  });

  if (staffShiftButtonEl) {
    staffShiftButtonEl.addEventListener("click", () => {
      openStaffDutyModal(getStoredStaffById(state.selectedStaffId) || state.staffDirectory[0] || null);
    });
  }

  manageSelectEl.addEventListener("change", () => {
    state.selectedStaffId = manageSelectEl.value;
    if (!state.selectedStaffId) {
      renderManageSelect();
      return;
    }
    const target = getSelectedStaff();
    renderManageSelect();
    if (target) {
      launchStaffModal(target);
      manageSelectEl.value = "";
    }
  });

  if (shiftManageSelectEl) {
    shiftManageSelectEl.addEventListener("change", () => {
      state.selectedStaffId = shiftManageSelectEl.value;
      if (!state.selectedStaffId) {
        renderShiftManageSelect();
        return;
      }
      const target = getSelectedStaff();
      renderShiftManageSelect();
      if (target) {
        openStaffDutyModal(target);
        shiftManageSelectEl.value = "";
      }
    });
  }

  document.getElementById("settings-week-prev").addEventListener("click", () => {
    state.weekOffset -= 1;
    renderCalendar();
  });

  document.getElementById("settings-week-next").addEventListener("click", () => {
    state.weekOffset += 1;
    renderCalendar();
  });

  document.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal(document.getElementById(button.dataset.modalClose));
    });
  });

  qrSettingsFormEl?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const settings = readQrSettingsForm();
    if (
      !Number.isFinite(settings.price_10ml) ||
      !Number.isFinite(settings.price_30ml) ||
      !Number.isFinite(settings.max_volume_ml) ||
      settings.max_volume_ml <= 0
    ) {
      setQrSettingsNote("価格と最大容量を確認してください。", true);
      return;
    }
    await saveSetting(QR_PRODUCT_SETTING_KEY, settings, { isPublic: true });
    fillQrSettingsForm();
    setQrSettingsNote("QR公開設定を保存しました。", false);
  });

  async function bootstrap() {
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole("manager");
    window.AdminAuth.renderAdminHeader("settings", {
      role: "manager",
      session,
      brandText: "Fragrance STAFF_管理スタッフ名",
      links: [
        { href: "admin-scoring.html", label: "配点ロジック", key: "scoring" },
        { href: "admin-materials.html", label: "原料ポイント", key: "materials" }
      ]
    });
    await loadData();
  }

  bootstrap();
})();
