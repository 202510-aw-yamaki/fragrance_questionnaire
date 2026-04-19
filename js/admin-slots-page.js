(function () {
  const rowsEl = document.getElementById("slot-rows");
  const form = document.getElementById("slot-form");
  const resetButton = document.getElementById("slot-reset");
  const previewLabelEl = document.getElementById("slot-preview-label");
  const previewDateEl = document.getElementById("slot-preview-date");
  const previewTimeEl = document.getElementById("slot-preview-time");
  const previewStaffEl = document.getElementById("slot-preview-staff");
  const previewStatusEl = document.getElementById("slot-preview-status");
  const UI = {
    active: "\u516c\u958b\u4e2d",
    hidden: "\u975e\u8868\u793a",
    edit: "\u7de8\u96c6",
    hide: "\u975e\u8868\u793a"
  };

  if (!rowsEl || !form || !resetButton) return;

  function resetForm() {
    form.reset();
    document.getElementById("slot-id").value = "";
    document.getElementById("slot-capacity").value = "1";
    document.getElementById("slot-sort").value = "0";
    document.getElementById("slot-active").checked = true;
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
    document.getElementById("slot-sort").value = row.sort_order || 0;
    document.getElementById("slot-active").checked = row.is_active !== false;
    renderPreview();
  }

  function renderPreview() {
    if (!previewLabelEl) return;
    const dateValue = document.getElementById("slot-date").value || "-";
    const timeValue = document.getElementById("slot-time").value || "-";
    const labelValue = document.getElementById("slot-label").value.trim() || "未入力";
    const staffValue = document.getElementById("slot-instructor").value.trim() || "未設定";
    const statusValue = document.getElementById("slot-status").value || "-";

    previewLabelEl.textContent = labelValue;
    previewDateEl.textContent = dateValue;
    previewTimeEl.textContent = timeValue;
    previewStaffEl.textContent = staffValue;
    previewStatusEl.textContent = statusValue;
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

  async function renderRows() {
    const rows = await getAllSlots();
    rowsEl.innerHTML = "";
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.slot_date || ""}</td>
        <td>${String(row.slot_time || "").slice(0, 5)}</td>
        <td>${row.slot_label || ""}</td>
        <td>${row.instructor_name || ""}</td>
        <td>${row.status || ""}</td>
        <td>${row.capacity || ""}</td>
        <td>${row.is_active ? UI.active : UI.hidden}</td>
        <td>
          <button class="admin-btn secondary" data-edit-id="${row.id}" type="button">${UI.edit}</button>
          <button class="admin-btn secondary" data-hide-id="${row.id}" type="button">${UI.hide}</button>
        </td>
      `;
      rowsEl.appendChild(tr);
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
    const payload = {
      slot_code: document.getElementById("slot-code").value.trim(),
      slot_date: document.getElementById("slot-date").value,
      slot_time: document.getElementById("slot-time").value,
      slot_label: document.getElementById("slot-label").value.trim(),
      instructor_name: document.getElementById("slot-instructor").value.trim() || null,
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

  ["slot-code", "slot-date", "slot-time", "slot-label", "slot-instructor", "slot-status", "slot-capacity"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderPreview);
    document.getElementById(id)?.addEventListener("change", renderPreview);
  });

  async function bootstrap() {
    const role = window.AdminAuth.readRoleFromLocation() || window.AdminAuth.readStoredRole() || "manager";
    window.AdminAuth.renderAdminHeader("slots", { role });
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole(role);
    renderPreview();
    resetForm();
    await renderRows();
  }

  bootstrap();
})();
