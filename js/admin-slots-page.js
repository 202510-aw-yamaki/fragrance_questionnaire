(function () {
  const rowsEl = document.getElementById("slot-rows");
  const form = document.getElementById("slot-form");
  const resetButton = document.getElementById("slot-reset");
  const previewLabelEl = document.getElementById("slot-preview-label");
  const previewDateEl = document.getElementById("slot-preview-date");
  const previewTimeEl = document.getElementById("slot-preview-time");
  const previewIntervalEl = document.getElementById("slot-preview-interval");
  const previewCapacityEl = document.getElementById("slot-preview-capacity");
  const previewStaffEl = document.getElementById("slot-preview-staff");
  const previewStatusEl = document.getElementById("slot-preview-status");
  const previewFocusButton = document.getElementById("slot-preview-focus");
  const deleteButton = document.getElementById("slot-delete");
  const UI = {
    active: "\u516c\u958b\u4e2d",
    hidden: "\u975e\u516c\u958b",
    edit: "\u7de8\u96c6",
    hide: "\u524a\u9664"
  };

  if (!rowsEl || !form || !resetButton) return;

  let reservations = [];

  function formatMonthDay(value) {
    if (!value) return "-";
    return value.replace(/-/g, "/");
  }

  function getSelectedRole() {
    return window.AdminAuth.readRoleFromLocation() || window.AdminAuth.readStoredRole() || "manager";
  }

  function getDefaultInstructorName() {
    return getSelectedRole() === "staff"
      ? (window.AdminAuth.getStaffDisplayName(window.__adminSession || null) || "")
      : "";
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

  function resetForm() {
    form.reset();
    document.getElementById("slot-id").value = "";
    document.getElementById("slot-capacity").value = "1";
    document.getElementById("slot-interval").value = "60";
    document.getElementById("slot-status").value = "open";
    document.getElementById("slot-sort").value = "0";
    document.getElementById("slot-active").checked = true;
    if (!document.getElementById("slot-instructor").value) {
      document.getElementById("slot-instructor").value = getDefaultInstructorName();
    }
    renderPreview();
  }

  function fillForm(row) {
    document.getElementById("slot-id").value = row.id || "";
    document.getElementById("slot-code").value = row.slot_code || "";
    document.getElementById("slot-date").value = row.slot_date || "";
    document.getElementById("slot-time").value = String(row.slot_time || "").slice(0, 5);
    document.getElementById("slot-label").value = row.slot_label || "";
    document.getElementById("slot-instructor").value = row.instructor_name || "";
    document.getElementById("slot-status").value = row.status || "open";
    document.getElementById("slot-capacity").value = row.capacity || 1;
    document.getElementById("slot-interval").value = "60";
    document.getElementById("slot-sort").value = row.sort_order || 0;
    document.getElementById("slot-active").checked = row.is_active !== false;
    renderPreview();
  }

  function renderPreview() {
    if (!previewLabelEl) return;
    const dateValue = document.getElementById("slot-date").value || "-";
    const timeValue = document.getElementById("slot-time").value || "-";
    const intervalValue = document.getElementById("slot-interval").value || "60";
    const capacityValue = document.getElementById("slot-capacity").value || "1";
    const labelValue = buildSlotLabel(timeValue, intervalValue);
    const staffValue = document.getElementById("slot-instructor").value.trim() || getDefaultInstructorName() || "未設定";
    const statusValue = document.getElementById("slot-status").value || "-";

    document.getElementById("slot-code").value = buildSlotCode(dateValue, timeValue);
    document.getElementById("slot-label").value = labelValue;
    previewLabelEl.textContent = labelValue;
    previewDateEl.textContent = formatMonthDay(dateValue);
    previewTimeEl.textContent = timeValue;
    if (previewIntervalEl) previewIntervalEl.textContent = `${intervalValue}分`;
    if (previewCapacityEl) previewCapacityEl.textContent = `${capacityValue}名`;
    previewStaffEl.textContent = staffValue;
    previewStatusEl.textContent = getStatusLabel(statusValue);
  }

  async function getAllSlots() {
    return window.AdminData.listRows("reservation_slots", {
      orders: [
        { column: "slot_date", ascending: true },
        { column: "slot_time", ascending: true },
        { column: "sort_order", ascending: true }
      ]
    }).catch(() => []);
  }

  async function getAllReservations() {
    return window.AdminData.listRows("reservations").catch(() => []);
  }

  async function renderRows() {
    const rows = await getAllSlots();
    const reservationCounts = reservations.reduce((acc, row) => {
      acc.set(row.slot_id, (acc.get(row.slot_id) || 0) + 1);
      return acc;
    }, new Map());
    rowsEl.innerHTML = "";
    rows.forEach((row) => {
      const article = document.createElement("article");
      article.className = "portal-list-row portal-slot-row";
      article.innerHTML = `
        <span>${formatMonthDay(row.slot_date || "")}</span>
        <span>${String(row.slot_time || "").slice(0, 5)}</span>
        <span>${row.capacity || 1}名</span>
        <span>${reservationCounts.get(row.id) || 0}組</span>
        <span class="portal-row-actions">
          <button class="admin-btn secondary" data-edit-id="${row.id}" type="button">${UI.edit}</button>
          <button class="admin-btn secondary" data-hide-id="${row.id}" type="button">${UI.hide}</button>
        </span>
      `;
      rowsEl.appendChild(article);
    });

    rowsEl.querySelectorAll("[data-edit-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const rows = await getAllSlots();
        const target = rows.find((row) => row.id === button.dataset.editId);
        if (target) fillForm(target);
      });
    });

    rowsEl.querySelectorAll("[data-hide-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        await window.AdminData.updateRow("reservation_slots", button.dataset.hideId, {
          is_active: false,
          updated_at: new Date().toISOString()
        }).catch(console.error);
        await renderRows();
      });
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const dateValue = document.getElementById("slot-date").value;
    const timeValue = document.getElementById("slot-time").value;
    const intervalValue = document.getElementById("slot-interval").value || "60";
    const instructorValue = document.getElementById("slot-instructor").value.trim() || getDefaultInstructorName() || null;
    const payload = {
      slot_code: buildSlotCode(dateValue, timeValue),
      slot_date: dateValue,
      slot_time: timeValue,
      slot_label: buildSlotLabel(timeValue, intervalValue),
      instructor_name: instructorValue,
      status: document.getElementById("slot-status").value,
      capacity: Number(document.getElementById("slot-capacity").value || 1),
      sort_order: Number(document.getElementById("slot-sort").value || 0),
      is_active: document.getElementById("slot-active").checked,
      updated_at: new Date().toISOString()
    };
    const id = document.getElementById("slot-id").value;
    if (id) {
      await window.AdminData.updateRow("reservation_slots", id, payload).catch(console.error);
    } else {
      await window.AdminData.insertRow("reservation_slots", payload).catch(console.error);
    }
    resetForm();
    await renderRows();
  });

  resetButton.addEventListener("click", resetForm);

  ["slot-date", "slot-time", "slot-interval", "slot-instructor", "slot-status", "slot-capacity"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderPreview);
    document.getElementById(id)?.addEventListener("change", renderPreview);
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
      await window.AdminData.deleteRow("reservation_slots", id).catch(console.error);
      resetForm();
      await renderRows();
    });
  }

  async function bootstrap() {
    const role = getSelectedRole();
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.__adminSession = session;
    window.AdminAuth.persistPortalRole(role);
    window.AdminAuth.renderAdminHeader("slots", {
      role,
      session,
      links: role === "staff"
        ? [
            { href: "admin-reservations.html", label: "予約情報一覧", key: "reservations" },
            { href: "admin-slots.html", label: "予約枠作成", key: "slots" }
          ]
        : [
            { href: "admin-dashboard.html", label: "戻る", key: "dashboard" },
            { href: "admin-reservations.html", label: "予約確認", key: "reservations" }
          ]
    });
    reservations = await getAllReservations();
    renderPreview();
    resetForm();
    await renderRows();
  }

  bootstrap();
})();
