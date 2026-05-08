(function () {
  const STAFF_SETTING_KEY = "staff_directory";
  const SHIFT_SETTING_KEY = "staff_shift_overrides";
  const QR_PRODUCT_SETTING_KEY = "qr_product_public_settings";
  const STORE_PUBLIC_INFO_KEY = "store_public_info";
  const AUTH_USER_FUNCTION = "admin-upsert-portal-auth-user";
  const LEGACY_STORE_LP_URL_SAMPLE = "https://fragrance-atelier.jp";
  const QR_DEFAULT_SETTINGS = {
    price_10ml: 1000,
    price_30ml: 2860,
    max_volume_ml: 100,
    shop_phone: "03-1234-5678",
    business_hours: "11:00〜19:00"
  };
  const DEFAULT_PRODUCT_TAGS = [
    "フローラル",
    "フレッシュ",
    "ウッディ",
    "スパイシー",
    "スウィート",
    "シトラス",
    "ハーバル",
    "パウダリー",
    "ムスク",
    "グリーン",
    "ティー",
    "アンバー"
  ];
  const STORE_DEFAULT_INFO = {
    store_name: "Fragrance Atelier",
    store_phone: "03-1234-5678",
    open_time: "10:00",
    close_time: "19:00",
    closed_days: "毎週水曜日",
    lp_url: ""
  };
  const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
  const storeInfoFormEl = document.getElementById("store-public-info-form");
  const storeNameEl = document.getElementById("store-name");
  const storePhoneEl = document.getElementById("store-phone");
  const storeOpenTimeEl = document.getElementById("store-open-time");
  const storeCloseTimeEl = document.getElementById("store-close-time");
  const storeClosedDaysEl = document.getElementById("store-closed-days");
  const storeLpUrlEl = document.getElementById("store-lp-url");
  const storeInfoNoteEl = document.getElementById("store-public-info-note");
  const settingsSaveButtonEl = document.getElementById("settings-save-button");
  const todayLabelEl = document.getElementById("settings-today-label");
  const todayStaffEl = document.getElementById("settings-today-staff");
  const controlNoteEl = document.getElementById("settings-control-note");
  const staffTableBodyEl = document.getElementById("settings-staff-table-body");
  const staffTableNoteEl = document.getElementById("settings-staff-table-note");
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
  const qrProductTagsEl = document.getElementById("qr-product-tags");
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
        <form class="admin-form portal-settings-modal-form" id="staff-form" novalidate>
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
                  <option value="staff">スタッフ</option>
                  <option value="manager">管理者</option>
                </select>
              </label>
              <label class="portal-settings-field">
                <span>スタッフID</span>
                <input id="staff-code" type="text" required autocomplete="username" placeholder="staff_a">
              </label>
              <label class="portal-settings-field portal-settings-password-field">
                <span>Authパスワード</span>
                <span class="portal-settings-password-wrap">
                  <input id="staff-password" type="password" minlength="6" autocomplete="new-password" placeholder="保存時にSupabase Authへ設定">
                  <button class="admin-btn secondary portal-settings-visibility-toggle" type="button" data-toggle-password="staff-password">表示</button>
                </span>
              </label>
              <label class="portal-settings-field" data-manager-auth-row hidden>
                <span>管理者ID</span>
                <input id="manager-code" type="text" autocomplete="username" placeholder="staff_a">
              </label>
              <label class="portal-settings-field portal-settings-password-field" data-manager-auth-row hidden>
                <span>管理者Authパス</span>
                <span class="portal-settings-password-wrap">
                  <input id="manager-password" type="password" minlength="6" autocomplete="new-password" placeholder="保存時にSupabase Authへ設定">
                  <button class="admin-btn secondary portal-settings-visibility-toggle" type="button" data-toggle-password="manager-password">表示</button>
                </span>
              </label>
            </div>
          </section>

          <section class="admin-panel admin-panel-soft portal-settings-modal-card portal-settings-duty-card">
            <div class="portal-settings-shift-staff-banner" id="staff-duty-name-display" hidden></div>
            <div class="portal-settings-duty-head">
              <div>
                <h3 id="staff-duty-title">勤務設定</h3>
                <p class="admin-note">曜日別の通常勤務を基準に、急な出勤・休みだけ日別で調整します。</p>
              </div>
              <div class="portal-settings-duty-summary" id="staff-duty-base-summary"></div>
            </div>
            <div class="portal-settings-duty-tabs" id="staff-duty-tabs" hidden>
              <button class="portal-settings-duty-tab is-active" type="button" data-duty-tab="basic" aria-selected="true">週の通常勤務</button>
              <button class="portal-settings-duty-tab" type="button" data-duty-tab="individual" aria-selected="false">週の個別調整</button>
            </div>
            <div class="portal-settings-duty-table portal-settings-duty-pane" data-duty-pane="basic">
              <p class="portal-settings-duty-helper">ここで設定した曜日と時間が、このスタッフの通常の出勤日時になります。</p>
              <div class="portal-settings-duty-head-row portal-settings-duty-head-row--week" aria-hidden="true">
                <span>曜日</span>
                <span>出勤</span>
                <span>退勤</span>
                <span>休み</span>
              </div>
              <div class="portal-week-pattern portal-settings-duty-body" id="staff-weekly-pattern"></div>
            </div>
            <div class="portal-settings-duty-table portal-settings-duty-pane" data-duty-pane="individual" hidden>
              <div class="portal-settings-week-toolbar">
                <button class="admin-btn secondary" type="button" data-duty-week-prev>前週</button>
                <strong id="staff-duty-week-label"></strong>
                <button class="admin-btn secondary" type="button" data-duty-week-next>翌週</button>
              </div>
              <p class="portal-settings-duty-helper">通常勤務と違う日だけ保存されます。急な出勤、短縮勤務、休みを週単位で調整できます。</p>
              <div class="portal-settings-duty-head-row portal-settings-duty-head-row--date" aria-hidden="true">
                <span>日付</span>
                <span>出勤</span>
                <span>退勤</span>
                <span>休み</span>
                <span>状態</span>
                <span></span>
              </div>
              <div class="portal-settings-date-pattern" id="staff-date-pattern"></div>
            </div>
          </section>

          <p class="portal-settings-modal-note admin-note" id="staff-modal-note" hidden></p>
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
  const staffDutyTitleEl = document.getElementById("staff-duty-title");
  const staffModalNoteEl = document.getElementById("staff-modal-note");
  const staffShiftButtonEl = document.getElementById("staff-shift-button");
  const staffManageLabelEl = manageSelectEl?.closest(".portal-settings-select")?.querySelector("span") || null;
  const shiftManageLabelEl = shiftManageSelectEl?.closest(".portal-settings-select")?.querySelector("span") || null;
  const weeklyPatternEl = document.getElementById("staff-weekly-pattern");
  const datePatternEl = document.getElementById("staff-date-pattern");
  const dutyTabsEl = document.getElementById("staff-duty-tabs");
  const dutyTabButtons = Array.from(staffModalEl?.querySelectorAll("[data-duty-tab]") || []);
  const dutyPaneEls = Array.from(staffModalEl?.querySelectorAll("[data-duty-pane]") || []);
  const dutyBaseSummaryEl = document.getElementById("staff-duty-base-summary");
  const dutyWeekLabelEl = document.getElementById("staff-duty-week-label");
  const dutyWeekPrevButtonEl = staffModalEl?.querySelector("[data-duty-week-prev]") || null;
  const dutyWeekNextButtonEl = staffModalEl?.querySelector("[data-duty-week-next]") || null;
  const state = {
    settingRowMap: new Map(),
    staffDirectory: [],
    staffProfileIds: new Set(),
    shiftOverrides: [],
    slots: [],
    reservations: [],
    weekOffset: 0,
    selectedStaffId: "",
    staffModalMode: "create",
    staffDutyTab: "basic",
    staffDutyWeekOffset: 0,
    staffDateOverridesDirty: false,
    storeDirty: false,
    staffModalDirty: false
  };

  if (staffManageLabelEl) staffManageLabelEl.textContent = "スタッフ登録編集";
  if (shiftManageLabelEl) shiftManageLabelEl.textContent = "スタッフ出勤管理";
  if (staffShiftButtonEl) staffShiftButtonEl.textContent = "スタッフ出勤管理";

  function hasUnsavedChanges() {
    return state.storeDirty || state.staffModalDirty;
  }

  function confirmDiscardUnsavedChanges() {
    if (!hasUnsavedChanges()) return true;
    return window.confirm("保存されていない変更があります。このページを離れますか？");
  }

  function confirmDiscardStaffModalChanges() {
    if (!state.staffModalDirty) return true;
    return window.confirm("保存されていないスタッフ設定があります。閉じますか？");
  }

  function closeStaffModalWithGuard() {
    if (!confirmDiscardStaffModalChanges()) return;
    state.staffModalDirty = false;
    closeModal(staffModalEl);
  }

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

  function formatDutyWeekLabel(startDate) {
    const endDate = addDays(startDate, 6);
    const startLabel = `${startDate.getMonth() + 1}月${startDate.getDate()}日`;
    const endLabel = startDate.getMonth() === endDate.getMonth()
      ? `${endDate.getDate()}日`
      : `${endDate.getMonth() + 1}月${endDate.getDate()}日`;
    return `${startLabel}〜${endLabel}`;
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

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function getRoleLabel(role) {
    return role === "manager" ? "管理者" : "スタッフ";
  }

  function normalizeStaffProfile(row, index = 0) {
    const role = row.role === "manager" || row.role === "admin" ? "manager" : "staff";
    const loginId = normalizeLoginId(row.login_id || row.staff_code || row.staffCode || `staff-${index + 1}`);
    const staffName = String(row.staff_name || row.display_name || row.name || "").trim() || `スタッフ${index + 1}`;
    return {
      id: String(row.id || "").trim(),
      staffCode: loginId,
      staffName,
      role,
      managerCode: role === "manager" ? loginId : "",
      email: String(row.email || "").trim(),
      isActive: row.is_active !== false
    };
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
    const role = row.role === "manager" || row.role === "admin" ? "manager" : "staff";
    const staffCode = normalizeLoginId(row.staffCode || row.staff_code || `staff-${index + 1}`);
    return {
      id: String(row.id || "").trim() || createStaffId(staffCode || name || index),
      staffCode,
      staffName: name,
      role,
      isActive: row.isActive !== false && row.is_active !== false,
      isTemporary: row.isTemporary === true || row.is_temporary === true,
      todayShiftLabel: String(row.todayShiftLabel || row.today_shift_label || "").trim(),
      staffPassword: "",
      managerCode: normalizeLoginId(row.managerCode || row.manager_code || (role === "manager" ? staffCode : "")),
      managerPassword: "",
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
      managerCode: staff.managerCode,
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

  function getCurrentWeekStartDate() {
    const today = createLocalDate(new Date());
    const day = today.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return addDays(today, mondayOffset);
  }

  function getDutyWeekStart() {
    return addDays(getCurrentWeekStartDate(), state.staffDutyWeekOffset * 7);
  }

  function getDutyWeekDates() {
    const start = getDutyWeekStart();
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
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
      const suffix = staff.isTemporary ? " / 仮データ" : ` / ${getRoleLabel(staff.role)}`;
      return `<option value="${escapeHtml(staff.id)}">${escapeHtml(staff.staffName)}${escapeHtml(suffix)}</option>`;
    }).join("");
    return `<option value="">${escapeHtml(placeholderText)}</option>${options}`;
  }

  function getReservationCountBySlotIds(slotIds) {
    const slotIdSet = new Set(slotIds);
    return state.reservations.filter((row) => slotIdSet.has(row.slot_id)).length;
  }

  function getStaffSlotsByDate(staffName, dateKey) {
    return state.slots.filter((row) => row.is_active !== false && row.slot_date === dateKey && normalizeName(row.instructor_name) === normalizeName(staffName));
  }

  function setStaffModalNote(message, isError) {
    if (!staffModalNoteEl) return;
    const text = String(message || "").trim();
    staffModalNoteEl.hidden = !text;
    staffModalNoteEl.textContent = text;
    staffModalNoteEl.className = `portal-settings-modal-note ${isError ? "admin-error" : "admin-note"}`;
  }

  function setStaffTableNote(message, isError = false) {
    if (!staffTableNoteEl) return;
    staffTableNoteEl.textContent = message;
    staffTableNoteEl.className = isError ? "admin-error" : "admin-note";
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
    const isModalOpen = staffModalEl && staffModalEl.hidden === false;
    if (isModalOpen) setStaffModalNote(message, isError);
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
    managerPasswordEl.required = false;
    managerCodeEl.disabled = !isManager;
    managerPasswordEl.disabled = !isManager;
    if (isManager) {
      if (!managerCodeEl.value.trim()) managerCodeEl.value = staffCodeEl.value.trim();
      if (!managerPasswordEl.value.trim()) managerPasswordEl.value = "";
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

  function readDateRowValue(row, staff) {
    const dateKey = row.dataset.dateRow;
    const base = getBaseShiftForDate(staff, dateKey);
    return {
      staffId: staff.id,
      date: dateKey,
      isWorking: row.querySelector(`[data-date-off="${dateKey}"]`)?.checked !== true,
      startTime: normalizeTime(row.querySelector(`[data-date-start="${dateKey}"]`)?.value, base.startTime),
      endTime: normalizeTime(row.querySelector(`[data-date-end="${dateKey}"]`)?.value, base.endTime)
    };
  }

  function refreshDateRowOverrideState(row, staff) {
    if (!row || !staff?.id) return;
    const dateKey = row.dataset.dateRow;
    const base = getBaseShiftForDate(staff, dateKey);
    const value = readDateRowValue(row, staff);
    const isModified = !isSameShiftAsBase(value, base);
    row.classList.toggle("is-modified", isModified);
    const badge = row.querySelector("[data-date-state]");
    if (badge) {
      badge.textContent = isModified ? "変更" : "通常";
      badge.classList.toggle("is-modified", isModified);
    }
    const resetButton = row.querySelector("[data-date-reset]");
    if (resetButton) resetButton.disabled = !isModified;
  }

  function syncDatePatternState(staff = buildDutyStaffFromModal()) {
    if (!datePatternEl) return;
    datePatternEl.querySelectorAll("[data-date-row]").forEach((row) => {
      const isOff = row.querySelector("[data-date-off]")?.checked === true;
      row.classList.toggle("is-off", isOff);
      row.querySelectorAll('input[type="time"]').forEach((input) => {
        input.disabled = isOff;
      });
      refreshDateRowOverrideState(row, staff);
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

  function buildAllWorkingWeeklyPattern(defaultStart, defaultEnd) {
    return Array.from({ length: 7 }, (_, day) => [
      String(day),
      {
        isWorking: true,
        startTime: defaultStart,
        endTime: defaultEnd
      }
    ]).reduce((acc, [day, value]) => {
      acc[day] = value;
      return acc;
    }, {});
  }

  function updateDutyBaseSummary(staff) {
    if (!dutyBaseSummaryEl || !staff?.weeklyPattern) return;
    const workingLabels = WEEKDAY_LABELS.filter((_, dayIndex) => staff.weeklyPattern[String(dayIndex)]?.isWorking !== false);
    const dayText = workingLabels.length ? workingLabels.join("・") : "出勤なし";
    dutyBaseSummaryEl.innerHTML = `
      <span>通常勤務</span>
      <strong>${escapeHtml(dayText)}</strong>
    `;
  }

  function buildDutyStaffFromModal() {
    const { defaultStart, defaultEnd } = deriveDefaultTimesFromModal();
    return normalizeStaff({
      id: staffIdEl.value || state.selectedStaffId,
      staffCode: staffCodeEl.value,
      staffName: staffNameEl.value,
      role: staffRoleEl.value,
      managerCode: managerCodeEl.value,
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
    const weekStart = getDutyWeekStart();
    const dates = getDutyWeekDates();
    if (dutyWeekLabelEl) dutyWeekLabelEl.textContent = formatDutyWeekLabel(weekStart);
    if (dutyWeekPrevButtonEl) dutyWeekPrevButtonEl.disabled = state.staffDutyWeekOffset <= 0;
    datePatternEl.innerHTML = dates.map((date) => {
      const dateKey = formatDateKey(date);
      const shift = getShiftForDate(staff, dateKey);
      const base = getBaseShiftForDate(staff, dateKey);
      const isModified = !isSameShiftAsBase(shift, base);
      return `
        <article class="portal-settings-duty-row portal-settings-date-duty-row ${shift.isWorking === false ? "is-off" : ""} ${isModified ? "is-modified" : ""}" data-date-row="${dateKey}">
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
            <span>休み</span>
          </label>
          <span class="portal-settings-duty-badge ${isModified ? "is-modified" : ""}" data-date-state>${isModified ? "変更" : "通常"}</span>
          <button class="admin-btn secondary portal-settings-duty-reset" type="button" data-date-reset="${dateKey}" ${isModified ? "" : "disabled"}>戻す</button>
        </article>
      `;
    }).join("");
    syncDatePatternState(staff);
    state.staffDateOverridesDirty = false;
  }

  function readDateOverridesFromModal(staff) {
    if (!datePatternEl || !staff?.id) return [];
    return Array.from(datePatternEl.querySelectorAll("[data-date-row]")).map((row) => {
      const base = getBaseShiftForDate(staff, row.dataset.dateRow);
      const value = readDateRowValue(row, staff);
      return isSameShiftAsBase(value, base) ? null : stripOverrideForSave(value);
    }).filter(Boolean);
  }

  function mergeVisibleDateOverridesIntoDraft(staff) {
    if (!datePatternEl || !staff?.id || !state.staffDateOverridesDirty) return;
    const visibleDateKeys = new Set(
      Array.from(datePatternEl.querySelectorAll("[data-date-row]")).map((row) => row.dataset.dateRow)
    );
    state.shiftOverrides = state.shiftOverrides
      .filter((row) => row.staffId !== staff.id || !visibleDateKeys.has(row.date))
      .concat(readDateOverridesFromModal(staff));
    state.staffDateOverridesDirty = false;
  }

  function resetDateOverrideRow(dateKey) {
    if (!datePatternEl || !dateKey) return;
    const row = datePatternEl.querySelector(`[data-date-row="${dateKey}"]`);
    if (!row) return;
    const staff = buildDutyStaffFromModal();
    const base = getBaseShiftForDate(staff, dateKey);
    const startInput = row.querySelector(`[data-date-start="${dateKey}"]`);
    const endInput = row.querySelector(`[data-date-end="${dateKey}"]`);
    const offInput = row.querySelector(`[data-date-off="${dateKey}"]`);
    if (startInput) startInput.value = base.startTime;
    if (endInput) endInput.value = base.endTime;
    if (offInput) offInput.checked = base.isWorking === false;
    state.staffDateOverridesDirty = true;
    syncDatePatternState(staff);
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
    if (state.staffDutyTab === "individual" && tab !== "individual" && state.staffDateOverridesDirty) {
      mergeVisibleDateOverridesIntoDraft(buildDutyStaffFromModal());
    }
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

  function setDutyWeekOffset(offset) {
    if (state.staffDutyTab === "individual") {
      mergeVisibleDateOverridesIntoDraft(buildDutyStaffFromModal());
    }
    state.staffDutyWeekOffset = Math.max(0, offset);
    if (state.staffDutyTab === "individual") {
      renderStaffDateOverrides(buildDutyStaffFromModal());
    }
  }

  function setStaffModalMode(mode, staff, isTemporary = false) {
    state.staffModalMode = mode;
    if (staffModalEl) staffModalEl.dataset.mode = mode;
    if (staffCredentialCardEl) staffCredentialCardEl.hidden = mode === "duty";
    if (staffDutyCardEl) staffDutyCardEl.hidden = mode === "edit";
    if (staffDutyNameEl) {
      staffDutyNameEl.hidden = true;
      staffDutyNameEl.textContent = "";
    }
    if (staffDutyTitleEl) {
      const staffName = String(staff?.staffName || "").trim();
      staffDutyTitleEl.textContent = mode === "duty" && staffName ? `${staffName}さんの勤務設定` : "勤務設定";
    }
    if (dutyTabsEl) dutyTabsEl.hidden = mode !== "duty";
    state.staffDutyWeekOffset = 0;
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
            <span>休み</span>
          </label>
        </article>
      `;
    }).join("");
    syncWeeklyPatternState();
    updateDutyBaseSummary(staff);
  }

  function launchStaffModal(staff, mode = "") {
    const isTemporary = staff?.isTemporary === true;
    const modalMode = mode || (staff && !isTemporary ? "edit" : "create");
    const temporaryTimes = extractShiftTimes(staff?.todayShiftLabel, "10:00", "18:00");
    const storeTimes = getStoreBusinessTimes();
    const target = isTemporary
      ? normalizeStaff({
        staffName: staff?.staffName || "",
        role: "staff",
        defaultStart: temporaryTimes.startTime,
        defaultEnd: temporaryTimes.endTime,
        weeklyPattern: buildDefaultWeeklyPattern(temporaryTimes.startTime, temporaryTimes.endTime)
      })
      : (staff ? normalizeStaff(staff) : normalizeStaff({
        defaultStart: storeTimes.startTime,
        defaultEnd: storeTimes.endTime,
        weeklyPattern: buildAllWorkingWeeklyPattern(storeTimes.startTime, storeTimes.endTime)
      }));
    staffModalTitleEl.textContent = modalMode === "duty"
      ? "スタッフ出勤管理"
      : (modalMode === "edit" ? "スタッフ編集" : "スタッフ新規登録");
    staffIdEl.value = isTemporary ? "" : (staff?.id || "");
    staffCodeEl.value = isTemporary ? "" : (staff?.staffCode || "");
    staffNameEl.value = target.staffName || "";
    staffRoleEl.value = target.role || "staff";
    staffPasswordEl.value = "";
    managerCodeEl.value = isTemporary ? "" : (staff?.managerCode || "");
    managerPasswordEl.value = "";
    staffEmailEl.value = isTemporary ? "" : (staff?.email || "");
    staffPhoneEl.value = isTemporary ? "" : (staff?.phone || "");
    staffColorEl.value = target.color || "#c78862";
    staffDefaultStartEl.value = target.defaultStart || "10:00";
    staffDefaultEndEl.value = target.defaultEnd || "18:00";
    renderStaffWeeklyPattern(target);
    setStaffModalMode(modalMode, target, isTemporary);
    state.staffModalDirty = false;
    setStaffModalNote("", false);
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

  function renderStaffTable() {
    if (!staffTableBodyEl) return;
    const rows = state.staffDirectory.filter((staff) => staff.isActive !== false && !staff.isTemporary);
    if (!rows.length) {
      staffTableBodyEl.innerHTML = `<tr><td colspan="3">登録済みスタッフはありません。</td></tr>`;
      setStaffTableNote("登録済みスタッフを表示します。");
      return;
    }
    staffTableBodyEl.innerHTML = rows.map((staff) => {
      return `
        <tr>
          <td>${escapeHtml(staff.staffName)}</td>
          <td>${escapeHtml(getRoleLabel(staff.role))}</td>
          <td>
            <div class="admin-reference-staff-actions">
              <button class="admin-btn secondary" type="button" data-staff-edit="${escapeHtml(staff.id)}">編集</button>
              <button class="admin-btn secondary" type="button" data-staff-duty="${escapeHtml(staff.id)}">勤務</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
    setStaffTableNote(`全${rows.length}件を表示中`);
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
    renderStaffTable();
    renderTodayStaff();
    renderCalendar();
  }

  async function saveStaffProfile(staff, existingId = "") {
    const loginId = normalizeLoginId(staff.role === "manager" ? (staff.managerCode || staff.staffCode) : staff.staffCode);
    const payload = {
      login_id: loginId || null,
      staff_name: staff.staffName,
      display_name: staff.staffName,
      role: staff.role === "manager" ? "manager" : "staff",
      email: staff.email || null,
      is_active: staff.isActive !== false,
      updated_at: new Date().toISOString()
    };
    if (existingId && state.staffProfileIds.has(existingId)) {
      const rows = await window.AdminData.updateRow("staff_profiles", existingId, payload);
      if (!rows[0]) throw new Error("スタッフプロフィールを更新できませんでした。");
      return normalizeStaffProfile(rows[0]);
    }
    const rows = await window.AdminData.insertRow("staff_profiles", payload);
    if (!rows[0]) throw new Error("スタッフプロフィールを登録できませんでした。");
    return normalizeStaffProfile(rows[0]);
  }

  function validateAuthPassword(password, label) {
    if (!password) return "";
    return password.length >= 6 ? "" : `${label}は6文字以上で入力してください。`;
  }

  async function savePortalAuthUserPassword({ profileId, loginId, loginPortal, portalRole, password, displayName, linkProfile }) {
    if (!password) return null;
    const client = window.getSupabaseClient?.();
    if (!client?.functions?.invoke) {
      throw new Error("Supabase Edge Function を呼び出せません。");
    }
    const { data, error } = await client.functions.invoke(AUTH_USER_FUNCTION, {
      body: {
        profileId,
        loginId,
        loginPortal,
        portalRole,
        password,
        displayName,
        linkProfile: Boolean(linkProfile)
      }
    });
    if (error) throw error;
    return data || null;
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
      const rows = await window.AdminData.updateRow("admin_settings", existing.id, payload);
      if (rows[0]) state.settingRowMap.set(key, rows[0]);
      if (!rows[0]) throw new Error("管理者設定を保存できませんでした。");
      return;
    }
    const rows = await window.AdminData.insertRow("admin_settings", payload);
    if (rows[0]) state.settingRowMap.set(key, rows[0]);
    if (!rows[0]) throw new Error("管理者設定を保存できませんでした。");
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
      business_hours: String(source.business_hours ?? source.businessHours ?? QR_DEFAULT_SETTINGS.business_hours),
      product_tags: normalizeProductTags(source.product_tags ?? source.productTags)
    };
  }

  function normalizeStoreInfo(value) {
    const source = value && typeof value === "object" ? value : {};
    const lpUrl = String(source.lp_url ?? source.lpUrl ?? STORE_DEFAULT_INFO.lp_url);
    return {
      store_name: String(source.store_name ?? source.storeName ?? STORE_DEFAULT_INFO.store_name),
      store_phone: String(source.store_phone ?? source.storePhone ?? STORE_DEFAULT_INFO.store_phone),
      open_time: String(source.open_time ?? source.openTime ?? STORE_DEFAULT_INFO.open_time),
      close_time: String(source.close_time ?? source.closeTime ?? STORE_DEFAULT_INFO.close_time),
      closed_days: String(source.closed_days ?? source.closedDays ?? STORE_DEFAULT_INFO.closed_days),
      lp_url: lpUrl === LEGACY_STORE_LP_URL_SAMPLE ? "" : lpUrl
    };
  }

  function getStoreBusinessTimes() {
    const info = normalizeStoreInfo(readSettingValue(STORE_PUBLIC_INFO_KEY));
    return {
      startTime: normalizeTime(info.open_time, STORE_DEFAULT_INFO.open_time),
      endTime: normalizeTime(info.close_time, STORE_DEFAULT_INFO.close_time)
    };
  }

  function normalizeProductTags(value) {
    const source = Array.isArray(value)
      ? value
      : String(value ?? "").split(/[\n,、]/);
    const seen = new Set();
    return source
      .map((tag) => String(tag || "").trim())
      .filter(Boolean)
      .filter((tag) => {
        const key = tag.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 24);
  }

  function setQrSettingsNote(message, isError = false) {
    if (!qrSettingsNoteEl) return;
    qrSettingsNoteEl.textContent = message;
    qrSettingsNoteEl.className = isError ? "admin-error" : "admin-note";
  }

  function setStoreInfoNote(message, isError = false) {
    if (!storeInfoNoteEl) return;
    storeInfoNoteEl.textContent = message;
    storeInfoNoteEl.className = isError ? "admin-error" : "admin-note";
  }

  function fillStoreInfoForm() {
    if (!storeInfoFormEl) return;
    const info = normalizeStoreInfo(readSettingValue(STORE_PUBLIC_INFO_KEY));
    if (storeNameEl) storeNameEl.value = info.store_name;
    if (storePhoneEl) storePhoneEl.value = info.store_phone;
    if (storeOpenTimeEl) storeOpenTimeEl.value = info.open_time;
    if (storeCloseTimeEl) storeCloseTimeEl.value = info.close_time;
    if (storeClosedDaysEl) storeClosedDaysEl.value = info.closed_days;
    if (storeLpUrlEl) storeLpUrlEl.value = info.lp_url;
  }

  function readStoreInfoForm() {
    return normalizeStoreInfo({
      store_name: storeNameEl?.value,
      store_phone: storePhoneEl?.value,
      open_time: storeOpenTimeEl?.value,
      close_time: storeCloseTimeEl?.value,
      closed_days: storeClosedDaysEl?.value,
      lp_url: storeLpUrlEl?.value
    });
  }

  function fillQrSettingsForm() {
    if (!qrSettingsFormEl) return;
    const settings = normalizeQrSettings(readSettingValue(QR_PRODUCT_SETTING_KEY));
    if (qrPrice10mlEl) qrPrice10mlEl.value = String(settings.price_10ml);
    if (qrPrice30mlEl) qrPrice30mlEl.value = String(settings.price_30ml);
    if (qrMaxVolumeEl) qrMaxVolumeEl.value = String(settings.max_volume_ml);
    if (qrShopPhoneEl) qrShopPhoneEl.value = settings.shop_phone;
    if (qrBusinessHoursEl) qrBusinessHoursEl.value = settings.business_hours;
    if (qrProductTagsEl) {
      const tags = settings.product_tags.length ? settings.product_tags : DEFAULT_PRODUCT_TAGS;
      qrProductTagsEl.value = tags.join("\n");
    }
  }

  function readQrSettingsForm() {
    return normalizeQrSettings({
      price_10ml: qrPrice10mlEl?.value,
      price_30ml: qrPrice30mlEl?.value,
      max_volume_ml: qrMaxVolumeEl?.value,
      shop_phone: qrShopPhoneEl?.value,
      business_hours: qrBusinessHoursEl?.value,
      product_tags: qrProductTagsEl?.value
    });
  }

  function buildStaffDirectoryFromProfiles(profileRows, storedStaff) {
    const storedById = new Map(storedStaff.map((staff) => [staff.id, staff]));
    const storedByCode = new Map(storedStaff.map((staff) => [staff.staffCode, staff]));
    return profileRows
      .map(normalizeStaffProfile)
      .filter((profile) => profile.id && profile.isActive !== false)
      .map((profile, index) => {
        const stored = storedById.get(profile.id) || storedByCode.get(profile.staffCode) || {};
        return normalizeStaff({
          ...stored,
          id: profile.id,
          staffCode: profile.staffCode,
          staffName: profile.staffName,
          role: profile.role,
          managerCode: profile.role === "manager" ? (stored.managerCode || profile.managerCode || profile.staffCode) : "",
          email: profile.email || stored.email,
          isActive: profile.isActive
        }, index);
      });
  }

  async function loadData() {
    const [settingsRows, slots, reservations, staffProfiles] = await Promise.all([
      window.AdminData.listRows("admin_settings", { orders: [{ column: "updated_at", ascending: false }] }).catch(() => []),
      window.AdminData.listRows("reservation_slots", { orders: [{ column: "slot_date", ascending: true }, { column: "slot_time", ascending: true }] }).catch(() => []),
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }] }).catch(() => []),
      window.AdminData.listRows("staff_profiles", {
        select: "id, login_id, email, staff_name, display_name, role, is_active, created_at, updated_at",
        orders: [{ column: "role", ascending: true }, { column: "staff_name", ascending: true }]
      }).catch((error) => {
        console.error("Failed to load staff profiles.", error);
        return [];
      })
    ]);
    state.settingRowMap = new Map((settingsRows || []).map((row) => [row.setting_key, row]));
    state.slots = slots || [];
    state.reservations = reservations || [];
    const storedStaff = Array.isArray(readSettingValue(STAFF_SETTING_KEY)) ? readSettingValue(STAFF_SETTING_KEY) : [];
    const storedOverrides = Array.isArray(readSettingValue(SHIFT_SETTING_KEY)) ? readSettingValue(SHIFT_SETTING_KEY) : [];
    const normalizedStoredStaff = storedStaff.map(normalizeStaff);
    state.staffDirectory = buildStaffDirectoryFromProfiles(staffProfiles || [], normalizedStoredStaff);
    state.staffProfileIds = new Set(state.staffDirectory.map((staff) => staff.id));
    if (!state.staffDirectory.length) {
      state.staffDirectory = normalizedStoredStaff;
    }
    if (!state.staffDirectory.length) {
      const derivedNames = Array.from(new Set(state.slots.map((row) => String(row.instructor_name || "").trim()).filter(Boolean)));
      state.staffDirectory = derivedNames.map((name, index) => normalizeStaff({ staffCode: `slot-${index + 1}`, staffName: name }, index));
      if (state.staffDirectory.length) {
        setControlNote("予約枠の担当名から仮スタッフ一覧を生成しています。保存すると管理データとして固定されます。", false);
      } else {
        setControlNote("スタッフを新規登録すると、この画面とカレンダーへ反映されます。", false);
      }
    } else if ((staffProfiles || []).length) {
      setControlNote("staff_profiles から登録済みスタッフを読み込みました。", false);
    } else {
      setControlNote("登録済みスタッフを読み込みました。", false);
    }
    state.shiftOverrides = storedOverrides.map(normalizeOverride);
    if (!state.selectedStaffId && state.staffDirectory[0]) {
      state.selectedStaffId = state.staffDirectory[0].id;
    }
    renderPage();
    fillStoreInfoForm();
    fillQrSettingsForm();
  }

  staffForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStaffModalNote("保存しています。", false);
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
        mergeVisibleDateOverridesIntoDraft(payload);
      }
      try {
        await saveSetting(STAFF_SETTING_KEY, state.staffDirectory.map(stripStaffForSave));
        await saveSetting(SHIFT_SETTING_KEY, state.shiftOverrides.map(stripOverrideForSave));
        closeModal(staffModalEl);
        state.staffModalDirty = false;
        renderPage();
        setStaffTableNote(`${payload.staffName} の勤務設定を保存しました。`);
      } catch (error) {
        setControlNote(error?.message || "勤務設定の保存に失敗しました。", true);
      }
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
    if (role === "manager" && !isValidLoginId(managerCode)) {
      setControlNote("管理者IDは半角英数字 / . / _ / - のみで入力してください。", true);
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
    const staffAuthPassword = staffPasswordEl.value.trim();
    const managerAuthPassword = role === "manager" ? managerPasswordEl.value.trim() : "";
    const staffPasswordError = validateAuthPassword(staffAuthPassword, "Authパスワード");
    if (staffPasswordError) {
      setControlNote(staffPasswordError, true);
      return;
    }
    const managerPasswordError = validateAuthPassword(managerAuthPassword, "管理者Authパス");
    if (managerPasswordError) {
      setControlNote(managerPasswordError, true);
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
      managerCode: role === "manager" ? managerCode : "",
      email: staffEmailEl.value.trim(),
      phone: staffPhoneEl.value.trim(),
      color: staffColorEl.value,
      defaultStart,
      defaultEnd,
      weeklyPattern
    });
    try {
      const savedProfile = await saveStaffProfile(payload, editingId);
      const finalPayload = normalizeStaff({
        ...payload,
        id: savedProfile.id,
        staffName: savedProfile.staffName,
        role: savedProfile.role,
        managerCode: savedProfile.role === "manager" ? (payload.managerCode || savedProfile.staffCode) : "",
        email: savedProfile.email || payload.email,
        isActive: savedProfile.isActive
      });
      state.staffProfileIds.add(finalPayload.id);
      const index = state.staffDirectory.findIndex((row) => row.id === finalPayload.id || row.id === editingId);
      if (index >= 0) {
        state.staffDirectory[index] = finalPayload;
      } else {
        state.staffDirectory.push(finalPayload);
      }
      state.selectedStaffId = finalPayload.id;
      const authUpdates = [];
      if (staffAuthPassword) {
        authUpdates.push(savePortalAuthUserPassword({
          profileId: finalPayload.id,
          loginId: finalPayload.staffCode,
          loginPortal: "staff",
          portalRole: finalPayload.role,
          password: staffAuthPassword,
          displayName: finalPayload.staffName,
          linkProfile: finalPayload.role !== "manager" || !managerAuthPassword
        }));
      }
      if (finalPayload.role === "manager" && managerAuthPassword) {
        authUpdates.push(savePortalAuthUserPassword({
          profileId: finalPayload.id,
          loginId: finalPayload.managerCode || finalPayload.staffCode,
          loginPortal: "manager",
          portalRole: "manager",
          password: managerAuthPassword,
          displayName: finalPayload.staffName,
          linkProfile: true
        }));
      }
      await saveSetting(STAFF_SETTING_KEY, state.staffDirectory.map(stripStaffForSave));
      state.staffModalDirty = false;
      let authError = null;
      if (authUpdates.length) {
        try {
          await Promise.all(authUpdates);
        } catch (error) {
          authError = error;
        }
      }
      renderPage();
      if (authError) {
        const message = authError?.message || "Authパスワードの反映に失敗しました。";
        state.staffModalDirty = true;
        setStaffTableNote(`${finalPayload.staffName} の基本情報は保存しました。Authパスワードは未反映です。`, true);
        setStaffModalNote(`${finalPayload.staffName} の基本情報は保存しました。Authパスワードの反映に失敗しました: ${message}`, true);
        return;
      }
      staffPasswordEl.value = "";
      managerPasswordEl.value = "";
      setStaffModalNote("", false);
      closeModal(staffModalEl);
      setStaffTableNote(`${finalPayload.staffName} を保存しました。${authUpdates.length ? "Authパスワードも反映しました。" : "Authパスワードは変更していません。"}`);
    } catch (error) {
      setControlNote(error?.message || "スタッフ設定の保存に失敗しました。", true);
    }
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

  weeklyPatternEl.addEventListener("change", (event) => {
    if (event.target instanceof HTMLInputElement) {
      syncWeeklyPatternState();
      const staff = buildDutyStaffFromModal();
      updateDutyBaseSummary(staff);
      if (state.staffDutyTab === "individual" && !state.staffDateOverridesDirty) {
        renderStaffDateOverrides(staff);
      }
    }
  });

  weeklyPatternEl.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement) {
      const staff = buildDutyStaffFromModal();
      updateDutyBaseSummary(staff);
      if (state.staffDutyTab === "individual" && !state.staffDateOverridesDirty) {
        renderStaffDateOverrides(staff);
      }
    }
  });

  dutyTabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setDutyTab(button.dataset.dutyTab);
    });
  });

  dutyWeekPrevButtonEl?.addEventListener("click", () => {
    setDutyWeekOffset(state.staffDutyWeekOffset - 1);
  });

  dutyWeekNextButtonEl?.addEventListener("click", () => {
    setDutyWeekOffset(state.staffDutyWeekOffset + 1);
  });

  if (datePatternEl) {
    datePatternEl.addEventListener("click", (event) => {
      const resetButton = event.target instanceof Element ? event.target.closest("[data-date-reset]") : null;
      if (!resetButton) return;
      resetDateOverrideRow(resetButton.dataset.dateReset);
    });

    datePatternEl.addEventListener("change", (event) => {
      if (event.target instanceof HTMLInputElement) {
        state.staffDateOverridesDirty = true;
        syncDatePatternState(buildDutyStaffFromModal());
      }
    });
    datePatternEl.addEventListener("input", (event) => {
      if (event.target instanceof HTMLInputElement) {
        state.staffDateOverridesDirty = true;
        syncDatePatternState(buildDutyStaffFromModal());
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
      const shouldDeactivateProfile = state.staffProfileIds.has(staffId);
      state.staffDirectory = state.staffDirectory.filter((row) => row.id !== staffId);
      state.shiftOverrides = state.shiftOverrides.filter((row) => row.staffId !== staffId);
      state.staffProfileIds.delete(staffId);
      if (state.selectedStaffId === staffId) {
        state.selectedStaffId = state.staffDirectory[0]?.id || "";
      }
      try {
        if (shouldDeactivateProfile) {
          await window.AdminData.updateRow("staff_profiles", staffId, {
            is_active: false,
            updated_at: new Date().toISOString()
          });
        }
        await saveSetting(STAFF_SETTING_KEY, state.staffDirectory.map(stripStaffForSave));
        await saveSetting(SHIFT_SETTING_KEY, state.shiftOverrides.map(stripOverrideForSave));
        closeModal(staffModalEl);
        state.staffModalDirty = false;
        renderPage();
        setStaffTableNote(`${target.staffName} を削除しました。`);
      } catch (error) {
        setControlNote(error?.message || "スタッフ削除の保存に失敗しました。", true);
      }
    });
  }

  document.getElementById("staff-create-button").addEventListener("click", () => {
    launchStaffModal(null);
  });

  staffTableBodyEl?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const dutyButton = event.target.closest("[data-staff-duty]");
    if (dutyButton instanceof HTMLElement) {
      const target = getStoredStaffById(dutyButton.dataset.staffDuty);
      if (target) openStaffDutyModal(target);
      return;
    }
    const editButton = event.target.closest("[data-staff-edit]");
    if (!(editButton instanceof HTMLElement)) return;
    const target = getStoredStaffById(editButton.dataset.staffEdit);
    if (target) launchStaffModal(target);
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
      const targetModal = document.getElementById(button.dataset.modalClose);
      if (targetModal === staffModalEl) {
        closeStaffModalWithGuard();
        return;
      }
      closeModal(targetModal);
    });
  });

  async function saveStorePublicInfo() {
    const info = readStoreInfoForm();
    if (!info.store_name || !info.store_phone) {
      setStoreInfoNote("店舗名と電話番号を確認してください。", true);
      return;
    }
    try {
      await saveSetting(STORE_PUBLIC_INFO_KEY, {
        ...info,
        shop_phone: info.store_phone,
        business_hours: `${info.open_time}〜${info.close_time}`
      }, { isPublic: true });
      fillStoreInfoForm();
      state.storeDirty = false;
      setStoreInfoNote("店舗情報を保存しました。", false);
    } catch (error) {
      setStoreInfoNote(error?.message || "店舗情報の保存に失敗しました。", true);
    }
  }

  storeInfoFormEl?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveStorePublicInfo();
  });

  settingsSaveButtonEl?.addEventListener("click", async () => {
    await saveStorePublicInfo();
  });

  storeInfoFormEl?.addEventListener("input", () => {
    state.storeDirty = true;
  });

  storeInfoFormEl?.addEventListener("change", () => {
    state.storeDirty = true;
  });

  staffForm?.addEventListener("input", () => {
    state.staffModalDirty = true;
  });

  staffForm?.addEventListener("change", () => {
    state.staffModalDirty = true;
  });

  window.addEventListener("beforeunload", (event) => {
    if (!hasUnsavedChanges()) return;
    event.preventDefault();
    event.returnValue = "";
  });

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const leaveTarget = target.closest("a[href], .admin-logout");
    if (!leaveTarget || !hasUnsavedChanges()) return;
    if (confirmDiscardUnsavedChanges()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

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
    try {
      await saveSetting(QR_PRODUCT_SETTING_KEY, settings, { isPublic: true });
      fillQrSettingsForm();
      setQrSettingsNote("QR公開設定を保存しました。", false);
    } catch (error) {
      setQrSettingsNote(error?.message || "QR公開設定の保存に失敗しました。", true);
    }
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
        { href: "admin-qr-requests.html", label: "QR依頼一覧", key: "qr-requests" },
        { href: "admin-scoring.html", label: "配点ロジック", key: "scoring" },
        { href: "admin-materials.html", label: "原料ポイント", key: "materials" }
      ]
    });
    await loadData();
  }

  bootstrap();
})();
