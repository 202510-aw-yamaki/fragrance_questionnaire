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
  let canOperateRequests = false;

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

  function formatEmailStatus(value) {
    const labels = {
      queued: "送信待ち",
      sent: "送信済み",
      failed: "送信失敗",
      canceled: "送信取消"
    };
    return labels[value] || value || "-";
  }

  function formatTemplateKey(value) {
    const labels = {
      qr_request_received_v1: "受付メール",
      qr_request_available_v1: "作成可能メール",
      qr_request_unavailable_v1: "作成不可メール",
      qr_request_reminder_v1: "再案内メール",
      qr_request_expired_v1: "期限切れメール",
      qr_request_auto_unavailable_overdue_v1: "期限超過メール"
    };
    return labels[value] || value || "メール";
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

  function getStatusTone(row) {
    const status = String(row?.status || "");
    if (["requested", "auto_unavailable_overdue"].includes(status)) return "is-danger";
    if (["available_email_sent", "reminder_email_sent", "shipping_pending"].includes(status)) return "is-warning";
    if (status === "shipped") return "is-success";
    return "";
  }

  function formatDeadline(row) {
    if (row.status === "requested" || row.status === "auto_unavailable_overdue") {
      return `可否判断期限 ${formatDateTime(row.availability_due_at)}`;
    }
    if (row.status === "available_email_sent" || row.status === "reminder_email_sent" || row.status === "expired") {
      return `依頼期限 ${formatDateTime(row.expires_at)}`;
    }
    if (row.status === "shipping_pending") {
      return `発送先受付 ${formatDateTime(row.shipping_info_submitted_at)}`;
    }
    if (row.status === "shipped") {
      return `発送完了 ${formatDateTime(row.shipped_at)}`;
    }
    return `更新 ${formatDateTime(row.updated_at)}`;
  }

  function formatNextStep(row) {
    const role = getRole();
    const status = String(row?.status || "");
    if (status === "requested") {
      return role === "staff" ? "作成可能 / 作成不可を判断してください。" : "担当スタッフの作成可否判断待ちです。";
    }
    if (status === "available_email_sent") return "作成可能メール送信済み。発送先入力待ちです。";
    if (status === "reminder_email_sent") return "再案内済み。期限まで返信待ちです。";
    if (status === "expired") return "期限切れです。再依頼や無効化の要否を確認してください。";
    if (status === "unavailable") return "作成不可として案内済みです。";
    if (status === "shipping_pending") {
      return role === "staff" ? "発送完了後に発送完了を登録してください。" : "発送完了登録待ちです。";
    }
    if (status === "shipped") return "発送完了済みです。";
    if (status === "auto_unavailable_overdue") return "3営業日超過で不可扱いです。管理者記録対象です。";
    return "状態を確認してください。";
  }

  function formatEmailSummary(events) {
    if (!events.length) return "-";
    return events.slice(0, 2).map((event) => (
      `${formatTemplateKey(event.template_key)}:${formatEmailStatus(event.status)}`
    )).join(" / ");
  }

  function getActionButtons(row) {
    if (!canOperateRequests) return "";
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
      const emailStatus = formatEmailSummary(emailEvents);
      const actions = getActionButtons(row);
      const article = document.createElement("article");
      article.className = `portal-list-row qr-request-row qr-request-card ${getStatusTone(row)}`;
      article.innerHTML = `
        <div class="qr-request-summary">
          <span>依頼概要</span>
          <strong>${escapeHtml(row.request_code || "-")}</strong>
          <small>${escapeHtml(product.product_name || "-")}</small>
        </div>
        <dl class="qr-request-meta">
          <div><dt>受付</dt><dd>${escapeHtml(formatDateTime(row.created_at))}</dd></div>
          <div><dt>数量</dt><dd>${escapeHtml(formatQuantity(row))}</dd></div>
          <div><dt>依頼者</dt><dd>${escapeHtml(maskEmail(row.requester_email))}</dd></div>
          <div><dt>担当</dt><dd>${escapeHtml(staff.display_name || staff.staff_name || "-")}</dd></div>
          <div><dt>状態</dt><dd><strong>${escapeHtml(formatStatus(row.status))}</strong></dd></div>
          <div><dt>期限</dt><dd>${escapeHtml(formatDeadline(row))}</dd></div>
          <div><dt>メール</dt><dd>${escapeHtml(emailStatus)}</dd></div>
          <div><dt>QRアクセス</dt><dd>${escapeHtml(String(qrCode.access_count ?? "-"))}</dd></div>
        </dl>
        <div class="qr-request-next">
          <span>次の対応</span>
          <strong>${escapeHtml(formatNextStep(row))}</strong>
        </div>
        <div class="qr-request-actions" data-label="操作">${actions || "<span>操作なし</span>"}</div>
      `;
      rowsEl.appendChild(article);
    });
  }

  async function runRequestAction(action, requestId) {
    if (!canOperateRequests) return;
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

  async function runDeadlineProcessing(role) {
    if (role !== "manager") return;
    try {
      await window.AdminData.callRpc("process_qr_request_deadlines", {
        p_now: new Date().toISOString()
      });
    } catch (error) {
      console.warn("Failed to process QR request deadlines.", error);
    }
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
      select: "id, request_code, product_qr_code_id, fragrance_product_id, requester_email, quantity_10ml, quantity_30ml, total_volume_ml, status, availability_due_at, available_email_sent_at, reminder_email_sent_at, expires_at, shipping_info_submitted_at, shipped_at, created_at, updated_at"
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
    canOperateRequests = role === "staff" && window.AdminAuth.getSessionPortalRole?.(session) === "staff";
    window.AdminAuth.persistPortalRole(role);
    window.AdminAuth.renderAdminHeader("qr-requests", {
      role,
      session
    });
    await runDeadlineProcessing(role);
    await loadRequests();
    renderRows();
  }

  bootstrap();
})();
