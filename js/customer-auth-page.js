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
    const emailInput = form?.elements?.email;
    const saveEmailCheckbox = $("save-email-checkbox");
    const passwordInput = $("customer-password-input");
    const passwordToggle = $("password-toggle-button");
    const toggle = document.querySelector(".menu-toggle");
    const menu = $("customer-login-menu");
    const savedEmailKey = "fragranceCustomerLoginEmail";
    function readSavedEmail() {
      try {
        return window.localStorage?.getItem(savedEmailKey) || "";
      } catch (_) {
        return "";
      }
    }
    function writeSavedEmail(value) {
      try {
        if (value) window.localStorage?.setItem(savedEmailKey, value);
        else window.localStorage?.removeItem(savedEmailKey);
      } catch (_) {
        // localStorage can be unavailable in strict privacy modes.
      }
    }
    const savedEmail = readSavedEmail();
    if (emailInput && saveEmailCheckbox && savedEmail) {
      emailInput.value = savedEmail;
      saveEmailCheckbox.checked = true;
    }
    saveEmailCheckbox?.addEventListener("change", () => {
      writeSavedEmail(saveEmailCheckbox.checked ? emailInput?.value?.trim() : "");
    });
    emailInput?.addEventListener("input", () => {
      if (saveEmailCheckbox?.checked) writeSavedEmail(emailInput.value.trim());
    });
    passwordToggle?.addEventListener("click", () => {
      if (!passwordInput) return;
      const willShow = passwordInput.type === "password";
      passwordInput.type = willShow ? "text" : "password";
      passwordToggle.setAttribute("aria-pressed", willShow ? "true" : "false");
      passwordToggle.setAttribute("aria-label", willShow ? "パスワードを隠す" : "パスワードを表示");
    });
    toggle?.addEventListener("click", () => {
      const isOpen = menu?.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    menu?.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");
        const target = href ? document.querySelector(href) : null;
        if (!target) return;
        event.preventDefault();
        const headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top, behavior: "smooth" });
        window.history.pushState(null, "", href);
        menu.classList.remove("is-open");
        toggle?.setAttribute("aria-expanded", "false");
      });
    });
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
      writeSavedEmail(saveEmailCheckbox?.checked ? String(email).trim() : "");
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

  function formatPortalDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10).replaceAll("-", ".");
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join(".");
  }

  function getPortalProductName(row, fallback = "香り") {
    return row?.product_name || row?.summary_headline || row?.reservation_code || fallback;
  }

  function getPortalProductDate(row) {
    return formatPortalDate(row?.visit_date || row?.slot_date || row?.reservation?.slot_date || row?.completed_at || row?.created_at || row?.updated_at || row?.slot_label || row?.reservation?.slot_label);
  }

  function getPortalStaffName(row) {
    return row?.staff_name || row?.staff_display_name || row?.created_by_staff_name || row?.instructor_name || row?.staff?.display_name || row?.staff?.staff_name || row?.staff || "-";
  }

  function getPortalProductNote(row) {
    return row?.product_note || row?.summary_body || row?.profile_label || row?.profile_key || "その日の気分に合わせて調香した香りです。";
  }

  const PORTAL_AXIS_KEYS = ["floral", "citrus", "woody", "spicy", "musk"];
  const PORTAL_AXIS_LABELS = {
    floral: "フローラル",
    citrus: "シトラス",
    woody: "ウッディ",
    spicy: "スパイシー",
    musk: "ムスク"
  };
  const PORTAL_AXIS_ALIASES = {
    floral: ["floral", "floral_score", "フローラル"],
    citrus: ["citrus", "citrus_score", "fresh", "fresh_score", "シトラス", "フレッシュ"],
    woody: ["woody", "woody_score", "ウッディ"],
    spicy: ["spicy", "spicy_score", "スパイシー"],
    musk: ["musk", "musk_score", "sweet", "sweet_score", "ムスク", "スウィート", "スイート"]
  };
  const PORTAL_AXIS_MAX_POINTS = {
    floral: [90, 14],
    citrus: [160, 63],
    woody: [134, 145],
    spicy: [46, 145],
    musk: [20, 63]
  };
  const PORTAL_AXIS_CENTER = [90, 91];

  function parsePortalAxisSource(value) {
    if (!value) return null;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (_) {
        return null;
      }
    }
    return typeof value === "object" ? value : null;
  }

  function normalizePortalAxes(source) {
    const data = parsePortalAxisSource(source);
    if (!data) return null;
    const axes = {};
    let hasValue = false;
    PORTAL_AXIS_KEYS.forEach((key) => {
      const aliases = PORTAL_AXIS_ALIASES[key];
      const foundKey = aliases.find((alias) => data[alias] !== undefined && data[alias] !== null);
      const value = foundKey ? Number(data[foundKey]) : NaN;
      if (Number.isFinite(value)) {
        axes[key] = Math.max(0, Math.min(100, value));
        hasValue = true;
      } else {
        axes[key] = 50;
      }
    });
    return hasValue ? axes : null;
  }

  function getPortalAxes(row) {
    const sources = [
      row?.final_axes,
      row?.adjusted_axes,
      row?.axes,
      row?.axis_scores,
      row?.fragrance_axes,
      row?.result_axes,
      row?.point_axes,
      row?.axes_json,
      row?.final_axes_json,
      row?.questionnaire_result?.final_axes,
      row?.questionnaire_result?.axes
    ];
    for (const source of sources) {
      const axes = normalizePortalAxes(source);
      if (axes) return axes;
    }
    return null;
  }

  function getPortalAxisPoint(axis, value) {
    const maxPoint = PORTAL_AXIS_MAX_POINTS[axis];
    const ratio = Math.max(0, Math.min(100, Number(value) || 0)) / 100;
    const x = PORTAL_AXIS_CENTER[0] + (maxPoint[0] - PORTAL_AXIS_CENTER[0]) * ratio;
    const y = PORTAL_AXIS_CENTER[1] + (maxPoint[1] - PORTAL_AXIS_CENTER[1]) * ratio;
    return [Math.round(x), Math.round(y)];
  }

  function renderPortalAxisPreview(axes) {
    const mount = $("latest-axis-preview");
    if (!mount) return;
    if (!axes) {
      mount.hidden = true;
      mount.innerHTML = "";
      return;
    }
    mount.hidden = false;
    if (!$("latest-axis-shape")) {
      mount.innerHTML = `
        <svg viewBox="0 0 180 160" role="img" aria-labelledby="axis-preview-title">
          <title id="axis-preview-title">香り5軸</title>
          <polygon class="axis-grid" points="90,14 160,63 134,145 46,145 20,63"></polygon>
          <polygon class="axis-grid axis-grid--inner" points="90,42 132,72 116,121 64,121 48,72"></polygon>
          <polygon class="axis-shape" id="latest-axis-shape"></polygon>
          <circle data-axis="floral" r="3"></circle>
          <circle data-axis="citrus" r="3"></circle>
          <circle data-axis="woody" r="3"></circle>
          <circle data-axis="spicy" r="3"></circle>
          <circle data-axis="musk" r="3"></circle>
        </svg>
      `;
    }
    const shape = $("latest-axis-shape");
    if (!shape) return;
    const points = PORTAL_AXIS_KEYS.map((key) => getPortalAxisPoint(key, axes[key]));
    shape.setAttribute("points", points.map(([x, y]) => `${x},${y}`).join(" "));
    document.querySelectorAll(".customer-axis-preview [data-axis]").forEach((circle) => {
      const axis = circle.dataset.axis;
      if (!PORTAL_AXIS_KEYS.includes(axis)) return;
      const [x, y] = getPortalAxisPoint(axis, axes[axis]);
      circle.setAttribute("cx", String(x));
      circle.setAttribute("cy", String(y));
    });
  }

  function getPortalAxisSummary(row) {
    const axes = getPortalAxes(row);
    if (!axes) return getPortalProductNote(row);
    const sorted = Object.entries(axes).sort((a, b) => b[1] - a[1]);
    const first = sorted[0];
    const second = sorted[1];
    if (!first || first[1] < 45) return "穏やかで均整の取れた香りです。";
    return `${PORTAL_AXIS_LABELS[first[0]]}を軸に、${PORTAL_AXIS_LABELS[second[0]]}がそっと重なる香りです。`;
  }

  function getPortalStatusLabel(row) {
    const status = String(row?.status || "").toLowerCase();
    if (["complete", "completed", "done", "finished"].includes(status)) return "完成";
    if (["cancelled", "canceled"].includes(status)) return "取消";
    if (["reserved", "booked"].includes(status)) return "予約";
    return row?.status || "完成";
  }

  function renderLatestProduct(row) {
    if (!$("latest-product-name")) return;
    if (!row) {
      $("latest-product-name").textContent = "未作成";
      $("latest-product-date").textContent = "-";
      $("latest-product-staff").textContent = "-";
      $("latest-product-summary").textContent = "制作履歴が入ると、香りの傾向が表示されます。";
      renderPortalAxisPreview(null);
      return;
    }
    $("latest-product-name").textContent = getPortalProductName(row, "未作成");
    $("latest-product-date").textContent = getPortalProductDate(row);
    $("latest-product-staff").textContent = getPortalStaffName(row);
    $("latest-product-summary").textContent = getPortalAxisSummary(row);
    renderPortalAxisPreview(getPortalAxes(row));
  }

  function renderRecordList(mount, rows, emptyText, type) {
    if (!mount) return;
    if (!rows?.length) {
      mount.innerHTML = `<p class="admin-empty">${escapeHtml(emptyText)}</p>`;
      return;
    }
    if (type === "product") {
      mount.innerHTML = rows.slice(0, 3).map((row) => {
        const name = getPortalProductName(row, "香り");
        return `
          <article class="customer-history-item">
            <img src="../img/costomer/瓶単体.png" alt="">
            <div>
              <h3>${escapeHtml(name)}</h3>
              <p>来店日　${escapeHtml(getPortalProductDate(row))}</p>
              <p>スタッフ　${escapeHtml(getPortalStaffName(row))}</p>
            </div>
            <span>${escapeHtml(getPortalStatusLabel(row))}</span>
            <a href="../customer/reservation.html" aria-label="${escapeHtml(name)}を予約する">›</a>
          </article>
        `;
      }).join("");
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
      if ($("member-name-inline")) $("member-name-inline").textContent = customer.display_name || "会員";
      renderLatestProduct((data.products || [])[0] || null);
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
