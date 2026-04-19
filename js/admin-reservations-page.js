(function () {
  const rowsEl = document.getElementById("reservation-rows");
  const emptyEl = document.getElementById("reservation-empty");
  const detailSummaryEl = document.getElementById("reservation-detail-summary");
  const detailMetaEl = document.getElementById("reservation-detail-meta");
  const detailLinkEl = document.getElementById("reservation-detail-link");
  const filterForm = document.getElementById("filter-form");

  if (!rowsEl || !filterForm || !detailMetaEl) return;

  let reservations = [];
  let slotMap = new Map();

  function getRole() {
    return window.AdminAuth.readRoleFromLocation() || window.AdminAuth.readStoredRole() || "manager";
  }

  function formatDateTime(row) {
    const slot = slotMap.get(row.slot_id);
    if (!slot) return row.slot_label || "-";
    return `${slot.slot_date || ""} ${String(slot.slot_time || "").slice(0, 5)} ${slot.slot_label || ""}`.trim();
  }

  function matchesKeyword(row, keyword) {
    if (!keyword) return true;
    const text = [row.visit_type, row.summary_headline, row.summary_body, row.staff_memo, row.slot_label]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes(keyword.toLowerCase());
  }

  function renderDetail(row) {
    if (!row) {
      detailSummaryEl.textContent = "一覧から詳細を開くとここに予約概要を表示します。";
      detailMetaEl.innerHTML = "";
      detailLinkEl.href = window.AdminAuth.appendRoleToHref("admin-workspace.html", getRole());
      return;
    }

    detailSummaryEl.textContent = row.summary_body || "予約情報の概要は未登録です。";
    detailMetaEl.innerHTML = `
      <div class="admin-meta-row"><span>来店日時</span><strong>${formatDateTime(row)}</strong></div>
      <div class="admin-meta-row"><span>来店目的</span><strong>${row.visit_type || "-"}</strong></div>
      <div class="admin-meta-row"><span>人数</span><strong>${row.guest_count || "-"}</strong></div>
      <div class="admin-meta-row"><span>傾向</span><strong>${row.summary_headline || "-"}</strong></div>
      <div class="admin-meta-row"><span>status</span><strong>${row.status || "-"}</strong></div>
      <div class="admin-meta-row"><span>メモ</span><strong>${row.staff_memo || "-"}</strong></div>
    `;
    detailLinkEl.href = window.AdminAuth.appendRoleToHref(`admin-workspace.html?reservation=${encodeURIComponent(row.id)}`, getRole());
  }

  function getFilteredRows() {
    const dateValue = document.getElementById("filter-date").value;
    const statusValue = document.getElementById("filter-status").value;
    const keywordValue = document.getElementById("filter-keyword").value.trim();

    return reservations.filter((row) => {
      const slot = slotMap.get(row.slot_id);
      const slotDate = slot?.slot_date || "";
      if (dateValue && slotDate !== dateValue) return false;
      if (statusValue && row.status !== statusValue) return false;
      return matchesKeyword(row, keywordValue);
    });
  }

  async function renderRows() {
    const filtered = getFilteredRows();
    rowsEl.innerHTML = "";
    emptyEl.hidden = filtered.length > 0;

    filtered.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDateTime(row)}</td>
        <td>${row.visit_type || ""}</td>
        <td>${row.guest_count || ""}</td>
        <td>${row.summary_headline || ""}</td>
        <td>${String(row.created_at || "").slice(0, 16).replace("T", " ")}</td>
        <td>
          <select data-status-id="${row.id}">
            <option value="confirmed"${row.status === "confirmed" ? " selected" : ""}>confirmed</option>
            <option value="canceled"${row.status === "canceled" ? " selected" : ""}>canceled</option>
            <option value="completed"${row.status === "completed" ? " selected" : ""}>completed</option>
          </select>
        </td>
        <td><button class="admin-btn secondary" data-detail-id="${row.id}" type="button">詳細を開く</button></td>
      `;
      rowsEl.appendChild(tr);
    });

    rowsEl.querySelectorAll("[data-status-id]").forEach((select) => {
      select.addEventListener("change", async () => {
        await window.AdminData.updateRow("reservations", select.dataset.statusId, {
          status: select.value,
          updated_at: new Date().toISOString()
        }).catch(console.error);
      });
    });
    rowsEl.querySelectorAll("[data-detail-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = reservations.find((row) => row.id === button.dataset.detailId) || null;
        renderDetail(target);
      });
    });

    const params = new URLSearchParams(window.location.search);
    const reservationId = params.get("reservation");
    if (reservationId) {
      renderDetail(reservations.find((row) => row.id === reservationId) || null);
    } else if (!detailMetaEl.children.length && filtered.length) {
      renderDetail(filtered[0]);
    }
  }

  async function loadBaseData() {
    const [reservationRows, slotRows] = await Promise.all([
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }], select: "*" }).catch(() => []),
      window.AdminData.listRows("reservation_slots", {
        orders: [{ column: "slot_date", ascending: true }, { column: "slot_time", ascending: true }]
      }).catch(() => [])
    ]);
    reservations = reservationRows || [];
    slotMap = new Map((slotRows || []).map((row) => [row.id, row]));
  }

  filterForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await renderRows();
  });

  async function bootstrap() {
    const role = getRole();
    window.AdminAuth.renderAdminHeader("reservations", { role });
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole(role);
    await loadBaseData();
    renderDetail(null);
    await renderRows();
  }

  bootstrap();
})();
