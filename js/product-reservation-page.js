(function () {
  const DEFAULT_SETTINGS = {
    price10ml: 1000,
    price30ml: 2860,
    maxVolumeMl: 100,
    shopPhone: "03-1234-5678",
    businessHours: "11:00〜19:00"
  };

  const params = new URLSearchParams(window.location.search);
  const state = {
    qrCode: null,
    product: null,
    settings: DEFAULT_SETTINGS,
    isReady: false,
    isSubmitting: false
  };

  const productNameEl = document.getElementById("product-name");
  const price10mlEl = document.getElementById("price-10ml");
  const price30mlEl = document.getElementById("price-30ml");
  const quantity10mlEl = document.getElementById("quantity-10ml");
  const quantity30mlEl = document.getElementById("quantity-30ml");
  const formEl = document.getElementById("qr-request-form");
  const emailEl = document.getElementById("requester-email");
  const summaryEl = document.getElementById("request-summary");
  const totalEl = document.getElementById("request-total");
  const submitEl = document.getElementById("submit-request");
  const statusEl = document.getElementById("request-status");
  const shopPhoneEl = document.getElementById("shop-phone");
  const businessHoursEl = document.getElementById("business-hours");

  function formatYen(value) {
    return `${new Intl.NumberFormat("ja-JP").format(Number(value || 0))}円（税込）`;
  }

  function setStatus(message, tone = "") {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    if (tone) {
      statusEl.dataset.tone = tone;
    } else {
      statusEl.removeAttribute("data-tone");
    }
  }

  function getQrToken() {
    return params.get("token") || params.get("public_token") || params.get("qr") || params.get("qr_code") || "";
  }

  function getQuantity(input) {
    const value = Number(input?.value || 0);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.floor(value));
  }

  function setQuantity(input, value) {
    if (!input) return;
    input.value = String(Math.max(0, Math.floor(Number(value || 0))));
  }

  function getRequestTotals() {
    const quantity10ml = getQuantity(quantity10mlEl);
    const quantity30ml = getQuantity(quantity30mlEl);
    const totalVolumeMl = quantity10ml * 10 + quantity30ml * 30;
    const totalPrice = quantity10ml * state.settings.price10ml + quantity30ml * state.settings.price30ml;
    return { quantity10ml, quantity30ml, totalVolumeMl, totalPrice };
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function isQrExpired(qrCode) {
    if (!qrCode?.expires_at) return false;
    const timestamp = new Date(qrCode.expires_at).getTime();
    return Number.isFinite(timestamp) && timestamp <= Date.now();
  }

  function disableForm(message) {
    state.isReady = false;
    [quantity10mlEl, quantity30mlEl, emailEl, submitEl].forEach((element) => {
      if (element) element.disabled = true;
    });
    document.querySelectorAll("[data-quantity-target]").forEach((button) => {
      button.disabled = true;
    });
    if (message) setStatus(message, "error");
    renderSummary();
  }

  function enableForm() {
    state.isReady = true;
    [quantity10mlEl, quantity30mlEl, emailEl].forEach((element) => {
      if (element) element.disabled = false;
    });
    document.querySelectorAll("[data-quantity-target]").forEach((button) => {
      button.disabled = false;
    });
    renderSummary();
  }

  function renderSettings() {
    if (price10mlEl) price10mlEl.textContent = formatYen(state.settings.price10ml);
    if (price30mlEl) price30mlEl.textContent = formatYen(state.settings.price30ml);
    if (shopPhoneEl) shopPhoneEl.textContent = state.settings.shopPhone;
    if (businessHoursEl) businessHoursEl.textContent = state.settings.businessHours;
  }

  function renderProduct() {
    const productName = state.product?.product_name || "QR商品";
    if (productNameEl) productNameEl.textContent = productName;
    document.title = `${productName} | QR商品作成依頼`;
  }

  function renderSummary() {
    const totals = getRequestTotals();
    const maxVolume = Number(state.settings.maxVolumeMl || DEFAULT_SETTINGS.maxVolumeMl);
    const isOverLimit = totals.totalVolumeMl > maxVolume;
    const hasQuantity = totals.totalVolumeMl > 0;
    const hasEmail = isValidEmail(emailEl?.value);
    const canSubmit = state.isReady && !state.isSubmitting && hasQuantity && hasEmail && !isOverLimit;

    if (summaryEl) {
      summaryEl.innerHTML = [
        `10ml × ${totals.quantity10ml}本 = ${formatYen(totals.quantity10ml * state.settings.price10ml)}`,
        `30ml × ${totals.quantity30ml}本 = ${formatYen(totals.quantity30ml * state.settings.price30ml)}`,
        `合計容量：${totals.totalVolumeMl}ml / 最大${maxVolume}ml`
      ].join("<br>");
    }
    if (totalEl) {
      totalEl.textContent = `商品合計：${formatYen(totals.totalPrice)}`;
    }
    if (submitEl) {
      submitEl.disabled = !canSubmit;
    }
    if (!state.isReady) return;
    if (isOverLimit) {
      setStatus("最大依頼容量を超えています。数量を減らすか、店舗へご相談ください。", "error");
    } else if (!hasQuantity) {
      setStatus("10mlまたは30mlの数量を選択してください。");
    } else if (!hasEmail) {
      setStatus("受付メールをお送りするメールアドレスを入力してください。");
    } else {
      setStatus("");
    }
  }

  async function loadPageData() {
    const token = getQrToken();
    state.settings = {
      ...DEFAULT_SETTINGS,
      ...(await window.FragrancePublicData?.loadQrProductPublicSettings?.() || {})
    };
    renderSettings();

    if (!window.isSupabaseConfigured?.()) {
      renderProduct();
      disableForm("Supabase設定が未完了のため、現在このページから依頼を送信できません。");
      return;
    }

    if (!token) {
      renderProduct();
      const legacyProductId = params.get("product_id");
      disableForm(legacyProductId
        ? "このQRは旧形式です。店舗スタッフへ新しいQRの発行をご依頼ください。"
        : "QRコード情報を確認できませんでした。");
      return;
    }

    const pageData = await window.FragrancePublicData?.fetchQrProductPageData?.(token);
    state.qrCode = pageData?.qrCode || null;
    state.product = pageData?.product || null;
    renderProduct();

    if (!state.qrCode || !state.product) {
      disableForm("このQR商品ページは現在利用できません。");
      return;
    }
    if (state.qrCode.status !== "active" || isQrExpired(state.qrCode)) {
      disableForm(state.qrCode.inactive_reason || "このQR商品ページは現在受付を停止しています。");
      return;
    }
    enableForm();
  }

  async function submitRequest() {
    if (!state.isReady || state.isSubmitting) return;
    const totals = getRequestTotals();
    if (!totals.totalVolumeMl) {
      renderSummary();
      return;
    }
    if (!isValidEmail(emailEl?.value)) {
      renderSummary();
      return;
    }
    state.isSubmitting = true;
    renderSummary();
    setStatus("送信しています。");
    try {
      const saved = await window.FragrancePublicData?.createQrProductRequest?.({
        product_qr_code_id: state.qrCode.id,
        fragrance_product_id: state.product.id,
        requester_email: emailEl.value.trim(),
        quantity_10ml: totals.quantity10ml,
        quantity_30ml: totals.quantity30ml,
        status: "requested"
      });
      if (!saved) throw new Error("依頼を保存できませんでした。");
      setStatus("作成依頼を受け付けました。原材料在庫の確認後、メールでご連絡します。", "success");
      if (submitEl) submitEl.disabled = true;
      [quantity10mlEl, quantity30mlEl, emailEl].forEach((element) => {
        if (element) element.disabled = true;
      });
      document.querySelectorAll("[data-quantity-target]").forEach((button) => {
        button.disabled = true;
      });
    } catch (error) {
      state.isSubmitting = false;
      setStatus(error?.message || "送信に失敗しました。時間をおいて再度お試しください。", "error");
      renderSummary();
    }
  }

  document.querySelectorAll("[data-quantity-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.quantityTarget);
      const step = Number(button.dataset.step || 0);
      setQuantity(target, getQuantity(target) + step);
      renderSummary();
    });
  });

  [quantity10mlEl, quantity30mlEl, emailEl].forEach((element) => {
    element?.addEventListener("input", () => {
      if (element === quantity10mlEl || element === quantity30mlEl) {
        setQuantity(element, getQuantity(element));
      }
      renderSummary();
    });
  });

  formEl?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitRequest();
  });

  renderSettings();
  renderSummary();
  loadPageData();
})();
