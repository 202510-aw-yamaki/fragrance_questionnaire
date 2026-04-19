(function () {
  const STAFF_SETTING_KEY = "staff_directory";
  const SHIFT_SETTING_KEY = "staff_shift_overrides";
  const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
  const todayLabelEl = document.getElementById("settings-today-label");
  const todayStaffEl = document.getElementById("settings-today-staff");
  const controlNoteEl = document.getElementById("settings-control-note");
  const chipGridEl = document.getElementById("settings-staff-chip-grid");
  const manageSelectEl = document.getElementById("staff-manage-select");
  const calendarRangeEl = document.getElementById("settings-calendar-range");
  const calendarHeadEl = document.getElementById("settings-calendar-head");
  const calendarBodyEl = document.getElementById("settings-calendar-body");
  const staffModalEl = document.getElementById("staff-modal");
  const shiftModalEl = document.getElementById("shift-modal");
  const staffForm = document.getElementById("staff-form");
  const shiftForm = document.getElementById("shift-form");
  const weeklyPatternEl = document.getElementById("staff-weekly-pattern");
  const shiftRowsEl = document.getElementById("shift-rows");
  const shiftExtendEl = document.getElementById("shift-extend-weeks");
  const state = {
    settingRowMap: new Map(),
    staffDirectory: [],
    shiftOverrides: [],
    slots: [],
    reservations: [],
    weekOffset: 0,
    selectedStaffId: ""
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
    return {
      id: String(row.id || "").trim() || createStaffId(row.staffCode || row.staff_code || name || index),
      staffCode: String(row.staffCode || row.staff_code || "").trim() || `staff-${index + 1}`,
      staffName: name,
      role: row.role === "manager" ? "manager" : "staff",
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
      email: staff.email,
      phone: staff.phone,
      color: staff.color,
      defaultStart: staff.defaultStart,
      defaultEnd: staff.defaultEnd,
      weeklyPattern: staff.weeklyPattern
    };
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

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getReservationCountBySlotIds(slotIds) {
    const slotIdSet = new Set(slotIds);
    return state.reservations.filter((row) => slotIdSet.has(row.slot_id)).length;
  }

  function getStaffSlotsByDate(staffName, dateKey) {
    return state.slots.filter((row) => row.is_active !== false && row.slot_date === dateKey && normalizeName(row.instructor_name) === normalizeName(staffName));
  }

  function getShiftForDate(staff, dateKey) {
    const override = state.shiftOverrides.find((row) => row.staffId === staff.id && row.date === dateKey);
    if (override) return override;
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

  function setControlNote(message, isError) {
    controlNoteEl.textContent = message;
    controlNoteEl.className = isError ? "admin-error" : "admin-note";
  }

  function openModal(modalEl) {
    if (modalEl) modalEl.hidden = false;
  }

  function closeModal(modalEl) {
    if (modalEl) modalEl.hidden = true;
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
    return state.staffDirectory.find((row) => row.id === state.selectedStaffId) || state.staffDirectory[0] || null;
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

  function openShiftModal(staff) {
    if (!staff) {
      setControlNote("先にスタッフを登録してください。", true);
      return;
    }
    document.getElementById("shift-modal-title").textContent = `個別出勤モーダル / ${staff.staffName}`;
    document.getElementById("shift-staff-id").value = staff.id;
    shiftExtendEl.checked = false;
    renderShiftRows(staff.id);
    openModal(shiftModalEl);
  }

  function renderManageSelect() {
    const options = state.staffDirectory.map((staff) => {
      const selected = staff.id === state.selectedStaffId ? "selected" : "";
      return `<option value="${staff.id}" ${selected}>${staff.staffName} / ${staff.staffCode}</option>`;
    }).join("");
    manageSelectEl.innerHTML = state.staffDirectory.length
      ? `<option value="">登録済みスタッフを選択</option>${options}`
      : `<option value="">スタッフ未登録</option>`;
  }

  function renderStaffChips() {
    chipGridEl.innerHTML = state.staffDirectory.length
      ? state.staffDirectory.map((staff) => `<button class="admin-chip" type="button" data-staff-chip="${staff.id}">${staff.staffName}</button>`).join("")
      : `<span class="admin-chip">スタッフ未登録</span>`;
    chipGridEl.querySelectorAll("[data-staff-chip]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = state.staffDirectory.find((row) => row.id === button.dataset.staffChip);
        if (target) {
          state.selectedStaffId = target.id;
          renderManageSelect();
          openStaffModal(target);
        }
      });
    });
  }

  function renderTodayStaff() {
    const today = createLocalDate(new Date());
    const dateKey = formatDateKey(today);
    todayLabelEl.textContent = formatMonthDay(today);
    const scheduled = state.staffDirectory.filter((staff) => getShiftForDate(staff, dateKey).isWorking);
    if (!scheduled.length) {
      todayStaffEl.innerHTML = `<p class="admin-empty">本日の出勤者は登録されていません。</p>`;
      return;
    }
    todayStaffEl.innerHTML = scheduled.map((staff) => {
      const shift = getShiftForDate(staff, dateKey);
      const slotRows = getStaffSlotsByDate(staff.staffName, dateKey);
      const reservationCount = getReservationCountBySlotIds(slotRows.map((row) => row.id));
      return `
        <article class="admin-item-card portal-staff-card" style="border-color:${staff.color}33;">
          <div class="admin-item-head">
            <div>
              <p class="admin-item-code">${staff.staffCode}</p>
              <h3>${staff.staffName}</h3>
            </div>
            <span class="admin-status-pill is-active">${shift.startTime} - ${shift.endTime}</span>
          </div>
          <div class="portal-inline-stat-row">
            <span>権限</span>
            <strong>${staff.role}</strong>
          </div>
          <div class="portal-inline-stat-row">
            <span>予約枠</span>
            <strong>${slotRows.length}</strong>
          </div>
          <div class="portal-inline-stat-row">
            <span>予約件数</span>
            <strong>${reservationCount}</strong>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderCalendar() {
    const weekDates = getWeekDates(7);
    calendarRangeEl.textContent = `${formatWeekLabel(weekDates[0])} の出勤表`;
    calendarHeadEl.innerHTML = `
      <tr>
        <th>スタッフ</th>
        ${weekDates.map((date) => `<th>${formatMonthDay(date)}<small>${WEEKDAY_LABELS[date.getDay()]}</small></th>`).join("")}
      </tr>
    `;
    if (!state.staffDirectory.length) {
      calendarBodyEl.innerHTML = `<tr><td colspan="8" class="portal-calendar-empty">スタッフを登録するとカレンダーが表示されます。</td></tr>`;
      return;
    }
    calendarBodyEl.innerHTML = state.staffDirectory.map((staff) => {
      return `
        <tr>
          <th>
            <div class="portal-calendar-staff">
              <strong>${staff.staffName}</strong>
              <small>${staff.staffCode}</small>
            </div>
          </th>
          ${weekDates.map((date) => {
            const dateKey = formatDateKey(date);
            const shift = getShiftForDate(staff, dateKey);
            const slotRows = getStaffSlotsByDate(staff.staffName, dateKey);
            const reservationCount = getReservationCountBySlotIds(slotRows.map((row) => row.id));
            return `
              <td class="${shift.isWorking ? "is-working" : "is-off"}">
                <div class="portal-calendar-cell">
                  <strong>${shift.isWorking ? `${shift.startTime} - ${shift.endTime}` : "休み"}</strong>
                  <small>${reservationCount} / ${slotRows.length}</small>
                </div>
              </td>
            `;
          }).join("")}
        </tr>
      `;
    }).join("");
  }

  function renderShiftRows(staffId) {
    const staff = state.staffDirectory.find((row) => row.id === staffId);
    if (!staff) {
      shiftRowsEl.innerHTML = `<p class="admin-empty">スタッフが見つかりません。</p>`;
      return;
    }
    const dates = getWeekDates(shiftExtendEl.checked ? 14 : 7);
    shiftRowsEl.innerHTML = dates.map((date) => {
      const dateKey = formatDateKey(date);
      const shift = getShiftForDate(staff, dateKey);
      return `
        <article class="portal-shift-row">
          <div class="portal-shift-date">
            <strong>${formatMonthDay(date)}</strong>
            <small>${WEEKDAY_LABELS[date.getDay()]}</small>
          </div>
          <label class="portal-inline-checkbox">
            <input type="checkbox" data-shift-working="${dateKey}" ${shift.isWorking ? "checked" : ""}>
            <span>出勤</span>
          </label>
          <input type="time" data-shift-start="${dateKey}" value="${shift.startTime}">
          <input type="time" data-shift-end="${dateKey}" value="${shift.endTime}">
        </article>
      `;
    }).join("");
  }

  function renderPage() {
    renderManageSelect();
    renderStaffChips();
    renderTodayStaff();
    renderCalendar();
  }

  async function saveSetting(key, value) {
    const payload = {
      setting_key: key,
      setting_value: value,
      updated_at: new Date().toISOString()
    };
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
    renderPage();
  }

  staffForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const defaultStart = normalizeTime(document.getElementById("staff-default-start").value, "10:00");
    const defaultEnd = normalizeTime(document.getElementById("staff-default-end").value, "18:00");
    const weeklyPattern = Array.from({ length: 7 }, (_, dayIndex) => {
      return [
        String(dayIndex),
        {
          isWorking: weeklyPatternEl.querySelector(`[data-weekday-working="${dayIndex}"]`)?.checked === true,
          startTime: normalizeTime(weeklyPatternEl.querySelector(`[data-weekday-start="${dayIndex}"]`)?.value, defaultStart),
          endTime: normalizeTime(weeklyPatternEl.querySelector(`[data-weekday-end="${dayIndex}"]`)?.value, defaultEnd)
        }
      ];
    }).reduce((acc, [day, value]) => {
      acc[day] = value;
      return acc;
    }, {});
    const payload = normalizeStaff({
      id: document.getElementById("staff-id").value || undefined,
      staffCode: document.getElementById("staff-code").value.trim(),
      staffName: document.getElementById("staff-name").value.trim(),
      role: document.getElementById("staff-role").value,
      email: document.getElementById("staff-email").value.trim(),
      phone: document.getElementById("staff-phone").value.trim(),
      color: document.getElementById("staff-color").value,
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
    closeModal(staffModalEl);
    setControlNote(`${payload.staffName} を保存しました。`, false);
    renderPage();
  });

  shiftForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const staffId = document.getElementById("shift-staff-id").value;
    const targetDates = Array.from(shiftRowsEl.querySelectorAll("[data-shift-working]")).map((input) => input.dataset.shiftWorking);
    state.shiftOverrides = state.shiftOverrides.filter((row) => !(row.staffId === staffId && targetDates.includes(row.date)));
    targetDates.forEach((dateKey) => {
      state.shiftOverrides.push(stripOverrideForSave({
        staffId,
        date: dateKey,
        isWorking: shiftRowsEl.querySelector(`[data-shift-working="${dateKey}"]`)?.checked === true,
        startTime: normalizeTime(shiftRowsEl.querySelector(`[data-shift-start="${dateKey}"]`)?.value, "10:00"),
        endTime: normalizeTime(shiftRowsEl.querySelector(`[data-shift-end="${dateKey}"]`)?.value, "18:00")
      }));
    });
    await saveSetting(SHIFT_SETTING_KEY, state.shiftOverrides.map(stripOverrideForSave));
    closeModal(shiftModalEl);
    const staff = state.staffDirectory.find((row) => row.id === staffId);
    setControlNote(`${staff?.staffName || "スタッフ"} の個別出勤を保存しました。`, false);
    renderPage();
  });

  document.getElementById("staff-create-button").addEventListener("click", () => {
    openStaffModal(null);
  });

  document.getElementById("staff-shift-button").addEventListener("click", () => {
    openShiftModal(getSelectedStaff());
  });

  manageSelectEl.addEventListener("change", () => {
    state.selectedStaffId = manageSelectEl.value;
    if (!state.selectedStaffId) {
      renderManageSelect();
      return;
    }
    const target = getSelectedStaff();
    renderManageSelect();
    if (target) openStaffModal(target);
  });

  shiftExtendEl.addEventListener("change", () => {
    renderShiftRows(document.getElementById("shift-staff-id").value);
  });

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

  async function bootstrap() {
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole("manager");
    window.AdminAuth.renderAdminHeader("settings", {
      role: "manager",
      session,
      links: [
        { href: "admin-settings.html", label: "スタッフ登録/管理", key: "settings" },
        { href: "admin-scoring.html", label: "配点ロジック", key: "scoring" },
        { href: "admin-materials.html", label: "原料ポイント", key: "materials" }
      ]
    });
    await loadData();
  }

  bootstrap();
})();
