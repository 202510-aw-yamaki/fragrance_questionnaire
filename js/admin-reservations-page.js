(function () {
  const rowsEl = document.getElementById("reservation-rows");
  const emptyEl = document.getElementById("reservation-empty");
  const filterForm = document.getElementById("filter-form");

  if (!rowsEl || !filterForm) return;

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
    const draftCustomer = readDraftCustomer(row);
    const text = [row.visit_type, row.summary_headline, row.summary_body, row.staff_memo, row.slot_label, draftCustomer?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return text.includes(keyword.toLowerCase());
  }

  function readDraftCustomer(row) {
    try {
      const stored = window.sessionStorage.getItem(`fragranceCustomerDraft:${row.id}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
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
      const draftCustomer = readDraftCustomer(row);
      const article = document.createElement("article");
      article.className = "portal-list-row portal-reservation-row";
      article.innerHTML = `
        <span>${formatDateTime(row)}</span>
        <span>${draftCustomer?.name || row.customer_name || "未入力"}</span>
        <span>${row.visit_type || "-"}</span>
        <span>${row.guest_count || "-"}</span>
        <span>${row.summary_headline || "-"}</span>
        <span>${String(row.created_at || "").slice(0, 10).replaceAll("-", "/") || "-"}</span>
        <span>
          <select data-status-id="${row.id}">
            <option value="confirmed"${row.status === "confirmed" ? " selected" : ""}>予約受付</option>
            <option value="canceled"${row.status === "canceled" ? " selected" : ""}>キャンセル</option>
            <option value="completed"${row.status === "completed" ? " selected" : ""}>接客完了</option>
          </select>
        </span>
        <span><a class="admin-btn primary" href="${window.AdminAuth.appendRoleToHref(`admin-workspace.html?reservation=${encodeURIComponent(row.id)}`, getRole())}">詳細</a></span>
      `;
      rowsEl.appendChild(article);
    });

    rowsEl.querySelectorAll("[data-status-id]").forEach((select) => {
      select.addEventListener("change", async () => {
        await window.AdminData.updateRow("reservations", select.dataset.statusId, {
          status: select.value,
          updated_at: new Date().toISOString()
        }).catch(console.error);
      });
    });
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
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole(role);
    window.AdminAuth.renderAdminHeader("reservations", {
      role,
      session,
      links: role === "staff"
        ? [
            { href: "admin-reservations.html", label: "予約確認", key: "reservations" },
            { href: "admin-slots.html", label: "予約枠作成", key: "slots" }
          ]
        : [
            { href: "admin-dashboard.html", label: "戻る", key: "dashboard" },
            { href: "admin-slots.html", label: "予約枠作成", key: "slots" }
          ]
    });
    await loadBaseData();
    await renderRows();
  }

  bootstrap();
})();
