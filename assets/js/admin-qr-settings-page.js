(function () {
  const QR_PRODUCT_SETTING_KEY = "qr_product_public_settings";
  const DEFAULT_PRODUCT_TAGS = [
    "フローラル",
    "フレッシュ",
    "ウッディ",
    "スパイシー",
    "スウィート",
    "シトラス",
    "ハーバル",
    "パウダリー",
    "ムスク",
    "グリーン",
    "ティー",
    "アンバー"
  ];
  const DEFAULT_SETTINGS = {
    price_10ml: 1000,
    price_30ml: 2860,
    max_volume_ml: 100,
    shop_phone: "03-1234-5678",
    business_hours: "11:00〜19:00",
    availability_due_business_days: 3,
    available_reminder_after_days: 3,
    available_expires_after_days: 7,
    unavailable_reinvite_window_days: 14,
    inactive_access_window_days: 7,
    inactive_access_threshold: 10,
    show_overdue_admin_notification: true,
    show_qr_notification_badge: true,
    product_tags: DEFAULT_PRODUCT_TAGS
  };

  const formEl = document.getElementById("qr-product-settings-form");
  if (!formEl) return;

  const fields = {
    price10ml: document.getElementById("qr-price-10ml"),
    price30ml: document.getElementById("qr-price-30ml"),
    maxVolumeMl: document.getElementById("qr-max-volume-ml"),
    shopPhone: document.getElementById("qr-shop-phone"),
    businessHours: document.getElementById("qr-business-hours"),
    productTags: document.getElementById("qr-product-tags"),
    availabilityDueBusinessDays: document.getElementById("qr-availability-due-business-days"),
    availableReminderAfterDays: document.getElementById("qr-available-reminder-after-days"),
    availableExpiresAfterDays: document.getElementById("qr-available-expires-after-days"),
    unavailableReinviteWindowDays: document.getElementById("qr-unavailable-reinvite-window-days"),
    inactiveAccessWindowDays: document.getElementById("qr-inactive-access-window-days"),
    inactiveAccessThreshold: document.getElementById("qr-inactive-access-threshold"),
    showOverdueAdminNotification: document.getElementById("qr-show-overdue-admin-notification"),
    showQrNotificationBadge: document.getElementById("qr-show-notification-badge")
  };
  const noteEl = document.getElementById("qr-settings-note");
  const previewPrice10mlEl = document.getElementById("qr-preview-price-10ml");
  const previewPrice30mlEl = document.getElementById("qr-preview-price-30ml");
  const previewMaxVolumeEl = document.getElementById("qr-preview-max-volume");
  let settingRow = null;

  function toNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeProductTags(value) {
    const source = Array.isArray(value)
      ? value
      : String(value || "").split(/[\n,]/);
    const seen = new Set();
    const tags = source
      .map((tag) => String(tag || "").trim())
      .filter(Boolean)
      .filter((tag) => {
        const key = tag.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 24);
    return tags.length ? tags : DEFAULT_PRODUCT_TAGS;
  }

  function normalizeSettings(value) {
    const source = value && typeof value === "object" ? value : {};
    return {
      price_10ml: toNumber(source.price_10ml ?? source.price10ml, DEFAULT_SETTINGS.price_10ml),
      price_30ml: toNumber(source.price_30ml ?? source.price30ml, DEFAULT_SETTINGS.price_30ml),
      max_volume_ml: toNumber(source.max_volume_ml ?? source.maxVolumeMl, DEFAULT_SETTINGS.max_volume_ml),
      shop_phone: String(source.shop_phone ?? source.shopPhone ?? DEFAULT_SETTINGS.shop_phone),
      business_hours: String(source.business_hours ?? source.businessHours ?? DEFAULT_SETTINGS.business_hours),
      availability_due_business_days: toNumber(source.availability_due_business_days, DEFAULT_SETTINGS.availability_due_business_days),
      available_reminder_after_days: toNumber(source.available_reminder_after_days, DEFAULT_SETTINGS.available_reminder_after_days),
      available_expires_after_days: toNumber(source.available_expires_after_days, DEFAULT_SETTINGS.available_expires_after_days),
      unavailable_reinvite_window_days: toNumber(source.unavailable_reinvite_window_days, DEFAULT_SETTINGS.unavailable_reinvite_window_days),
      inactive_access_window_days: toNumber(source.inactive_access_window_days, DEFAULT_SETTINGS.inactive_access_window_days),
      inactive_access_threshold: toNumber(source.inactive_access_threshold, DEFAULT_SETTINGS.inactive_access_threshold),
      show_overdue_admin_notification: source.show_overdue_admin_notification !== false,
      show_qr_notification_badge: source.show_qr_notification_badge !== false,
      product_tags: normalizeProductTags(source.product_tags ?? source.productTags)
    };
  }

  function formatYen(value) {
    return `${new Intl.NumberFormat("ja-JP").format(Number(value || 0))}円`;
  }

  function setNote(message, isError = false) {
    if (!noteEl) return;
    noteEl.textContent = message || "";
    noteEl.className = isError ? "admin-error" : "admin-note";
  }

  function setSelectValue(select, value) {
    if (!select) return;
    const normalized = String(value);
    if (![...select.options].some((option) => option.value === normalized)) {
      select.add(new Option(`${normalized}日`, normalized));
    }
    select.value = normalized;
  }

  function fillForm(settings) {
    if (fields.price10ml) fields.price10ml.value = String(settings.price_10ml);
    if (fields.price30ml) fields.price30ml.value = String(settings.price_30ml);
    if (fields.maxVolumeMl) fields.maxVolumeMl.value = String(settings.max_volume_ml);
    if (fields.shopPhone) fields.shopPhone.value = settings.shop_phone;
    if (fields.businessHours) fields.businessHours.value = settings.business_hours;
    if (fields.productTags) fields.productTags.value = settings.product_tags.join("\n");
    setSelectValue(fields.availabilityDueBusinessDays, settings.availability_due_business_days);
    setSelectValue(fields.availableReminderAfterDays, settings.available_reminder_after_days);
    setSelectValue(fields.availableExpiresAfterDays, settings.available_expires_after_days);
    setSelectValue(fields.unavailableReinviteWindowDays, settings.unavailable_reinvite_window_days);
    if (fields.inactiveAccessWindowDays) fields.inactiveAccessWindowDays.value = String(settings.inactive_access_window_days);
    if (fields.inactiveAccessThreshold) fields.inactiveAccessThreshold.value = String(settings.inactive_access_threshold);
    if (fields.showOverdueAdminNotification) fields.showOverdueAdminNotification.checked = Boolean(settings.show_overdue_admin_notification);
    if (fields.showQrNotificationBadge) fields.showQrNotificationBadge.checked = Boolean(settings.show_qr_notification_badge);
    renderPreview();
  }

  function readForm() {
    return normalizeSettings({
      price_10ml: fields.price10ml?.value,
      price_30ml: fields.price30ml?.value,
      max_volume_ml: fields.maxVolumeMl?.value,
      shop_phone: fields.shopPhone?.value,
      business_hours: fields.businessHours?.value,
      availability_due_business_days: fields.availabilityDueBusinessDays?.value,
      available_reminder_after_days: fields.availableReminderAfterDays?.value,
      available_expires_after_days: fields.availableExpiresAfterDays?.value,
      unavailable_reinvite_window_days: fields.unavailableReinviteWindowDays?.value,
      inactive_access_window_days: fields.inactiveAccessWindowDays?.value,
      inactive_access_threshold: fields.inactiveAccessThreshold?.value,
      show_overdue_admin_notification: fields.showOverdueAdminNotification?.checked,
      show_qr_notification_badge: fields.showQrNotificationBadge?.checked,
      product_tags: fields.productTags?.value
    });
  }

  function renderPreview() {
    const settings = readForm();
    if (previewPrice10mlEl) previewPrice10mlEl.textContent = formatYen(settings.price_10ml);
    if (previewPrice30mlEl) previewPrice30mlEl.textContent = formatYen(settings.price_30ml);
    if (previewMaxVolumeEl) previewMaxVolumeEl.textContent = String(settings.max_volume_ml);
  }

  async function loadSettings() {
    const rows = await window.AdminData.listRows("admin_settings", {
      filters: [{ operator: "eq", column: "setting_key", value: QR_PRODUCT_SETTING_KEY }],
      orders: [{ column: "updated_at", ascending: false }],
      limit: 1
    }).catch(() => []);
    settingRow = rows[0] || null;
    fillForm(normalizeSettings(settingRow?.setting_value));
  }

  async function saveSettings(settings) {
    const payload = {
      setting_key: QR_PRODUCT_SETTING_KEY,
      setting_value: settings,
      is_public: true,
      updated_at: new Date().toISOString()
    };
    const rows = settingRow?.id
      ? await window.AdminData.updateRow("admin_settings", settingRow.id, payload)
      : await window.AdminData.insertRow("admin_settings", payload);
    if (!rows[0]) throw new Error("QR公開設定を保存できませんでした。");
    settingRow = rows[0];
  }

  Object.values(fields).forEach((element) => {
    element?.addEventListener("input", renderPreview);
    element?.addEventListener("change", renderPreview);
  });

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    const settings = readForm();
    if (settings.price_10ml < 0 || settings.price_30ml < 0 || settings.max_volume_ml <= 0) {
      setNote("価格と最大容量を確認してください。", true);
      return;
    }
    try {
      await saveSettings(settings);
      fillForm(settings);
      setNote("QR公開設定を保存しました。", false);
    } catch (error) {
      setNote(error?.message || "QR公開設定の保存に失敗しました。", true);
    }
  });

  async function bootstrap() {
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole("manager");
    window.AdminAuth.renderAdminHeader("qr-settings", {
      role: "manager",
      session
    });
    await loadSettings();
  }

  bootstrap();
})();
