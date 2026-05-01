(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(message, tone = "") {
    const el = $("login-status") || $("portal-status");
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
    if (tone) el.dataset.tone = tone;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[char]);
  }

  async function initLogin() {
    const form = $("customer-login-form");
    const setupButton = $("setup-button");
    if (!form) return;
    if (!window.isSupabaseConfigured?.()) {
      setStatus("会員機能の設定が未完了です。", "error");
      return;
    }
    async function submit(mode) {
      const data = new FormData(form);
      const email = data.get("email");
      const password = data.get("password");
      if (!email || !password) {
        setStatus("メールアドレスとパスワードを入力してください。", "error");
        return;
      }
      setStatus("確認しています。");
      try {
        if (mode === "setup") {
          await window.FragrancePublicData?.signUpCustomer?.(email, password);
          setStatus("会員ページを準備しました。", "success");
        } else {
          await window.FragrancePublicData?.signInCustomer?.(email, password);
        }
        window.location.href = "index.html";
      } catch (error) {
        setStatus(error?.message || "ログインできませんでした。", "error");
      }
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submit("login");
    });
    setupButton?.addEventListener("click", () => submit("setup"));
  }

  function renderRecordList(mount, rows, emptyText, type) {
    if (!mount) return;
    if (!rows?.length) {
      mount.innerHTML = `<p class="admin-empty">${escapeHtml(emptyText)}</p>`;
      return;
    }
    mount.innerHTML = rows.map((row) => `
      <article class="portal-card">
        <strong>${escapeHtml(row.product_name || row.reservation_code || row.slot_label || "-")}</strong>
        <p class="admin-note">${escapeHtml(row.created_at || row.slot_label || row.status || "")}</p>
        ${type === "product" ? `<a class="btn secondary" href="../customer/reservation.html">再予約へ</a>` : ""}
      </article>
    `).join("");
  }

  async function initPortal() {
    const status = $("portal-status");
    if (!window.isSupabaseConfigured?.()) {
      if (status) {
        status.hidden = false;
        status.textContent = "会員機能の設定が未完了です。";
        status.dataset.tone = "error";
      }
      return;
    }
    try {
      const data = await window.FragrancePublicData?.loadCustomerPortalData?.();
      const customer = data?.customer;
      if (!customer) {
        if (status) {
          status.hidden = false;
          status.textContent = "会員ログインが必要です。";
        }
        const loginLink = $("login-link");
        if (loginLink) loginLink.hidden = false;
        return;
      }
      if ($("member-name")) $("member-name").textContent = customer.display_name || "-";
      if ($("member-name-inline")) $("member-name-inline").textContent = customer.display_name || "会員";
      if ($("member-email")) $("member-email").textContent = customer.email || "-";
      if ($("member-code")) $("member-code").textContent = customer.customer_code || "-";
      renderRecordList($("product-list"), data.products || [], "制作履歴はまだありません。", "product");
      renderRecordList($("reservation-list"), data.reservations || [], "予約履歴はまだありません。", "reservation");
      if (status) status.hidden = true;
    } catch (error) {
      if (status) {
        status.hidden = false;
        status.textContent = error?.message || "会員情報を取得できませんでした。";
        status.dataset.tone = "error";
      }
    }
    $("logout-button")?.addEventListener("click", () => window.FragrancePublicData?.signOutCustomer?.());
  }

  function init() {
    const page = document.body?.dataset.page;
    if (page === "customer-login") initLogin();
    if (page === "customer-portal") initPortal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
