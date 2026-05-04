(function () {
  const rowsEl = document.getElementById("qr-request-rows");
  const emptyEl = document.getElementById("qr-request-empty");
  const filterForm = document.getElementById("qr-request-filter-form");
  const statusFilterEl = document.getElementById("qr-request-status-filter");
  const keywordFilterEl = document.getElementById("qr-request-keyword-filter");
  const countEl = document.getElementById("qr-request-count");

  if (!rowsEl || !filterForm) return;

  let requests = [];
  let productMap = new Map();
  let qrCodeMap = new Map();
  let staffMap = new Map();
  let emailEventMap = new Map();

  function getRole() {
    return window.location.pathname.includes("/staff/") ? "staff" : "manager";
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

  function maskEmail(value) {
    const email = String(value || "").trim();
    const [name, domain] = email.split("@");
    if (!name || !domain) return "-";
    const head = name.slice(0, 2);
    return `${head}${name.length > 2 ? "***" : "*"}@${domain}`;
  }

  function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return [
      `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`,
      `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    ].join(" ");
  }

  function formatStatus(value) {
    const labels = {
      requested: "依頼受付",
      available_email_sent: "作成可能メール済み",
      reminder_email_sent: "再案内済み",
      expired: "期限切れ",
      unavailable: "作成不可",
      shipping_pending: "発送準備中",
      shipped: "発送完了",
      auto_unavailable_overdue: "期限超過不可"
    };
    return labels[value] || value || "-";
  }

  function formatQuantity(row) {
    return [
      row.quantity_10ml ? `10ml x ${row.quantity_10ml}` : "",
      row.quantity_30ml ? `30ml x ${row.quantity_30ml}` : ""
    ].filter(Boolean).join(" / ") || "-";
  }

  function getProduct(row) {
    return productMap.get(row.fragrance_product_id) || {};
  }

  function getQrCode(row) {
    return qrCodeMap.get(row.product_qr_code_id) || {};
  }

  function getStaff(row) {
    const product = getProduct(row);
    return staffMap.get(product.created_by_staff_id) || {};
  }

  function getEmailEvents(row) {
    return emailEventMap.get(row.id) || [];
  }

  function getActionButtons(row) {
    const actions = [];
    if (row.status === "requested") {
      actions.push(["available", "作成可能"]);
      actions.push(["unavailable", "作成不可"]);
    }
    if (row.status === "shipping_pending") {
      actions.push(["shipped", "発送完了"]);
    }
    return actions.map(([action, label]) => (
      `<button class="admin-btn secondary qr-request-action" type="button" data-request-action="${action}" data-request-id="${escapeHtml(row.id)}">${escapeHtml(label)}</button>`
    )).join("");
  }

  function matchesKeyword(row, keyword) {
    if (!keyword) return true;
    const product = getProduct(row);
    const staff = getStaff(row);
    const qrCode = getQrCode(row);
    const text = [
      row.request_code,
      row.status,
      product.product_name,
      staff.display_name,
      staff.staff_name,
      qrCode.public_token,
      qrCode.qr_code
    ].filter(Boolean).join(" ").toLowerCase();
    return text.includes(keyword.toLowerCase());
  }

  function getFilteredRequests() {
    const statusValue = statusFilterEl?.value || "";
    const keywordValue = keywordFilterEl?.value.trim() || "";
    return requests.filter((row) => {
      if (statusValue && row.status !== statusValue) return false;
      return matchesKeyword(row, keywordValue);
    });
  }

  function renderRows() {
    const filtered = getFilteredRequests();
    rowsEl.innerHTML = "";
    if (countEl) countEl.textContent = String(filtered.length);
    if (emptyEl) emptyEl.hidden = filtered.length > 0;

    filtered.forEach((row) => {
      const product = getProduct(row);
      const staff = getStaff(row);
      const qrCode = getQrCode(row);
      const emailEvents = getEmailEvents(row);
      const emailStatus = emailEvents.length
        ? emailEvents.map((event) => `${event.template_key || "email"}:${event.status || "-"}`).join(" / ")
        : "-";
      const article = document.createElement("article");
      article.className = "portal-list-row qr-request-row";
      article.innerHTML = `
        <span class="qr-request-cell" data-label="受付">${escapeHtml(formatDateTime(row.created_at))}</span>
        <span class="qr-request-cell" data-label="依頼番号">${escapeHtml(row.request_code || "-")}</span>
        <span class="qr-request-cell" data-label="商品">${escapeHtml(product.product_name || "-")}</span>
        <span class="qr-request-cell" data-label="数量">${escapeHtml(formatQuantity(row))}</span>
        <span class="qr-request-cell" data-label="依頼者">${escapeHtml(maskEmail(row.requester_email))}</span>
        <span class="qr-request-cell" data-label="担当">${escapeHtml(staff.display_name || staff.staff_name || "-")}</span>
        <span class="qr-request-cell" data-label="状態"><strong>${escapeHtml(formatStatus(row.status))}</strong></span>
        <span class="qr-request-cell" data-label="期限">${escapeHtml(formatDateTime(row.availability_due_at))}</span>
        <span class="qr-request-cell" data-label="メール">${escapeHtml(emailStatus)}</span>
        <span class="qr-request-cell" data-label="QRアクセス">${escapeHtml(String(qrCode.access_count ?? "-"))}</span>
        <span class="qr-request-cell qr-request-actions" data-label="操作">${getActionButtons(row) || "-"}</span>
      `;
      rowsEl.appendChild(article);
    });
  }

  async function runRequestAction(action, requestId) {
    const rpcMap = {
      available: "mark_qr_request_available",
      unavailable: "mark_qr_request_unavailable",
      shipped: "mark_qr_request_shipped"
    };
    const functionName = rpcMap[action];
    if (!functionName || !requestId) return;
    const params = action === "unavailable"
      ? { p_request_id: requestId, p_reason: null }
      : { p_request_id: requestId };
    await window.AdminData.callRpc(functionName, params);
    await loadRequests();
    renderRows();
  }

  async function loadRelatedRows() {
    const productIds = [...new Set(requests.map((row) => row.fragrance_product_id).filter(Boolean))];
    const qrCodeIds = [...new Set(requests.map((row) => row.product_qr_code_id).filter(Boolean))];
    const requestIds = [...new Set(requests.map((row) => row.id).filter(Boolean))];

    const [products, qrCodes, emailEvents] = await Promise.all([
      productIds.length
        ? window.AdminData.listRows("fragrance_products", {
            filters: [{ operator: "in", column: "id", value: productIds }],
            select: "id, product_name, created_by_staff_id, status"
          }).catch(() => [])
        : Promise.resolve([]),
      qrCodeIds.length
        ? window.AdminData.listRows("product_qr_codes", {
            filters: [{ operator: "in", column: "id", value: qrCodeIds }],
            select: "id, qr_code, public_token, status, access_count, last_accessed_at"
          }).catch(() => [])
        : Promise.resolve([]),
      requestIds.length
        ? window.AdminData.listRows("email_events", {
            filters: [
              { operator: "eq", column: "related_table", value: "qr_product_requests" },
              { operator: "in", column: "related_id", value: requestIds }
            ],
            orders: [{ column: "created_at", ascending: false }],
            select: "id, related_id, template_key, status, send_after, sent_at, failed_at"
          }).catch(() => [])
        : Promise.resolve([])
    ]);

    productMap = new Map((products || []).map((row) => [row.id, row]));
    qrCodeMap = new Map((qrCodes || []).map((row) => [row.id, row]));
    emailEventMap = (emailEvents || []).reduce((map, row) => {
      const list = map.get(row.related_id) || [];
      list.push(row);
      map.set(row.related_id, list);
      return map;
    }, new Map());

    const staffIds = [...new Set((products || []).map((row) => row.created_by_staff_id).filter(Boolean))];
    const staffRows = staffIds.length
      ? await window.AdminData.listRows("staff_profiles", {
          filters: [{ operator: "in", column: "id", value: staffIds }],
          select: "id, staff_name, display_name"
        }).catch(() => [])
      : [];
    staffMap = new Map((staffRows || []).map((row) => [row.id, row]));
  }

  async function loadRequests() {
    requests = await window.AdminData.listRows("qr_product_requests", {
      orders: [{ column: "created_at", ascending: false }],
      select: "id, request_code, product_qr_code_id, fragrance_product_id, requester_email, quantity_10ml, quantity_30ml, total_volume_ml, status, availability_due_at, created_at, updated_at"
    }).catch(() => []);
    await loadRelatedRows();
  }

  filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    renderRows();
  });

  [statusFilterEl, keywordFilterEl].filter(Boolean).forEach((element) => {
    element.addEventListener("input", renderRows);
    element.addEventListener("change", renderRows);
  });

  rowsEl.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-request-action]");
    if (!button) return;
    button.disabled = true;
    try {
      await runRequestAction(button.dataset.requestAction, button.dataset.requestId);
    } catch (error) {
      button.disabled = false;
      console.error("Failed to update QR request status.", error);
      window.alert(error?.message || "QR依頼の状態更新に失敗しました。");
    }
  });

  async function bootstrap() {
    const role = getRole();
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole(role);
    window.AdminAuth.renderAdminHeader("qr-requests", {
      role,
      session
    });
    await loadRequests();
    renderRows();
  }

  bootstrap();
})();
