(function () {
  const kpiReservationsEl = document.getElementById("kpi-reservations");
  const kpiSlotsEl = document.getElementById("kpi-slots");
  const kpiScoringEl = document.getElementById("kpi-scoring");
  const kpiMaterialsEl = document.getElementById("kpi-materials");
  const todayShiftsEl = document.getElementById("manager-today-shifts");
  const coverageEl = document.getElementById("manager-slot-coverage");
  const scoringSummaryEl = document.getElementById("manager-scoring-summary");
  const materialLinksEl = document.getElementById("manager-material-links");

  function createLocalDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, amount) {
    const next = createLocalDate(date);
    next.setDate(next.getDate() + amount);
    return next;
  }

  function formatDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function formatDateLabel(date) {
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${date.getMonth() + 1}/${date.getDate()}（${weekdays[date.getDay()]}）`;
  }

  function renderTodayShifts(slots, reservations) {
    const todayKey = formatDateKey(new Date());
    const todaySlots = slots.filter((row) => row.slot_date === todayKey && row.is_active !== false);
    const reservationMap = new Map(reservations.map((row) => [row.slot_id, row]));
    const groups = todaySlots.reduce((acc, slot) => {
      const staffName = slot.instructor_name || "未設定";
      const bucket = acc.get(staffName) || { staffName, slots: 0, reservations: 0 };
      bucket.slots += 1;
      if (reservationMap.get(slot.id)) bucket.reservations += 1;
      acc.set(staffName, bucket);
      return acc;
    }, new Map());

    if (!groups.size) {
      todayShiftsEl.innerHTML = `<p class="admin-empty">本日の予約枠はありません。</p>`;
      return;
    }

    todayShiftsEl.innerHTML = Array.from(groups.values()).map((group) => `
      <article class="admin-item-card">
        <div class="admin-item-head">
          <div>
            <p class="admin-item-code">today</p>
            <h3>${group.staffName}</h3>
          </div>
          <span class="admin-status-pill is-active">出勤中</span>
        </div>
        <div class="admin-meta-row"><span>予約枠</span><strong>${group.slots}</strong></div>
        <div class="admin-meta-row"><span>予約件数</span><strong>${group.reservations}</strong></div>
      </article>
    `).join("");
  }

  function renderCoverage(slots) {
    const today = createLocalDate(new Date());
    coverageEl.innerHTML = Array.from({ length: 14 }, (_, index) => {
      const date = addDays(today, index);
      const dateKey = formatDateKey(date);
      const count = slots.filter((row) => row.slot_date === dateKey && row.is_active !== false).length;
      return `
        <article class="admin-date-status ${count ? "is-ready" : "is-missing"}">
          <strong>${formatDateLabel(date)}</strong>
          <span>${count ? "OK" : "NG"}</span>
          <small>予約枠 ${count}</small>
        </article>
      `;
    }).join("");
  }

  function renderScoringSummary(scoringRow) {
    const config = window.FragranceMasterData.getCompatibleScoringConfig(scoringRow?.config_json || null);
    const questionWeights = config.questionWeights || {};
    const branchTemplates = Object.entries(config.branchTemplates || {}).slice(0, 3);
    scoringSummaryEl.innerHTML = `
      <div class="admin-meta-row"><span>active version</span><strong>${scoringRow?.version ?? "-"}</strong></div>
      <div class="admin-meta-row"><span>logic source</span><strong>${config.logicSource || "-"}</strong></div>
      <div class="admin-meta-row"><span>step1 / step2 / finish</span><strong>${questionWeights.step1 ?? "-"} / ${questionWeights.step2 ?? "-"} / ${questionWeights.finish ?? "-"}</strong></div>
      ${branchTemplates.map(([key, axes]) => `
        <article class="admin-editor-card">
          <h3>${key}</h3>
          <div class="admin-chip-grid">
            ${Object.entries(axes || {}).map(([axis, value]) => `<span class="admin-chip">${axis}: ${value}</span>`).join("")}
          </div>
        </article>
      `).join("")}
    `;
  }

  function renderMaterialLinks(materials) {
    const activeMaterials = materials.filter((row) => row.is_active !== false).slice(0, 8);
    materialLinksEl.innerHTML = activeMaterials.length
      ? activeMaterials.map((row) => `
          <a class="admin-mini-card" href="${window.AdminAuth.appendRoleToHref(`admin-materials.html?focus=${encodeURIComponent(row.material_code)}`, "manager")}">
            <h3>${row.material_name}</h3>
            <p class="admin-note">${row.category || "未設定"} / ${row.material_code}</p>
          </a>
        `).join("")
      : `<p class="admin-empty">表示できる原料がありません。</p>`;
  }

  async function bootstrap() {
    window.AdminAuth.renderAdminHeader("dashboard", { role: "manager" });
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole("manager");

    const [reservations, slots, scoringRows, materials] = await Promise.all([
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }] }).catch(() => []),
      window.AdminData.listRows("reservation_slots", { filters: [{ operator: "in", column: "status", value: ["open", "recommended", "closed"] }] }).catch(() => []),
      window.AdminData.listRows("scoring_configs", { filters: [{ operator: "eq", column: "is_active", value: true }], limit: 1 }).catch(() => []),
      window.AdminData.listRows("material_points").catch(() => [])
    ]);

    kpiReservationsEl.textContent = String(reservations.length);
    kpiSlotsEl.textContent = String(slots.filter((row) => row.is_active !== false).length);
    kpiScoringEl.textContent = scoringRows[0]?.version ?? "-";
    kpiMaterialsEl.textContent = String(materials.length);

    renderTodayShifts(slots, reservations);
    renderCoverage(slots);
    renderScoringSummary(scoringRows[0] || null);
    renderMaterialLinks(materials);
  }

  bootstrap();
})();
