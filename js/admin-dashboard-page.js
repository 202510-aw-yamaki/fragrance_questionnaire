(function () {
  const kpiReservationsEl = document.getElementById("kpi-reservations");
  const kpiReservationsWeekEl = document.getElementById("kpi-reservations-week");
  const kpiSlotsEl = document.getElementById("kpi-slots");
  const kpiScoringEl = document.getElementById("kpi-scoring");
  const kpiMaterialsEl = document.getElementById("kpi-materials");
  const todayShiftsEl = document.getElementById("manager-today-shifts");
  const nextWeekSummaryEl = document.getElementById("manager-next-week-summary");
  const coverageEl = document.getElementById("manager-slot-coverage");
  const scoringWeightSummaryEl = document.getElementById("manager-scoring-weight-summary");
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

  function groupByStaff(slots) {
    return slots.reduce((acc, slot) => {
      const key = slot.instructor_name || "未設定";
      const bucket = acc.get(key) || [];
      bucket.push(slot);
      acc.set(key, bucket);
      return acc;
    }, new Map());
  }

  function renderCoverage(slots) {
    const today = formatDateKey(new Date());
    const twoWeekLimit = formatDateKey(addDays(createLocalDate(new Date()), 13));
    const grouped = groupByStaff(slots.filter((row) => row.is_active !== false && row.slot_date >= today && row.slot_date <= twoWeekLimit));

    if (!grouped.size) {
      coverageEl.innerHTML = `<p class="admin-empty">確認できる予約枠はありません。</p>`;
      return;
    }

    coverageEl.innerHTML = Array.from(grouped.entries()).map(([staffName, staffSlots]) => `
      <article class="admin-item-card">
        <div class="admin-meta-row"><span>${staffName}</span><strong class="${staffSlots.length ? "portal-ok-text" : "portal-ng-text"}">${staffSlots.length ? "OK" : "NG"}</strong></div>
      </article>
    `).join("");
  }

  function renderNextWeekSummary(slots, reservations) {
    if (!nextWeekSummaryEl) return;
    const today = formatDateKey(new Date());
    const weekLimit = formatDateKey(addDays(createLocalDate(new Date()), 6));
    const grouped = groupByStaff(slots.filter((row) => row.is_active !== false && row.slot_date >= today && row.slot_date <= weekLimit));
    const reservationMap = new Map(reservations.map((row) => [row.slot_id, row]));

    if (!grouped.size) {
      nextWeekSummaryEl.innerHTML = `<p class="admin-empty">翌週分のデータはありません。</p>`;
      return;
    }

    nextWeekSummaryEl.innerHTML = Array.from(grouped.entries()).map(([staffName, staffSlots]) => {
      const reservationCount = staffSlots.filter((slot) => reservationMap.has(slot.id)).length;
      return `
        <article class="admin-item-card">
          <div class="admin-meta-row"><span>${staffName}</span><strong>${reservationCount}/${staffSlots.length}</strong></div>
        </article>
      `;
    }).join("");
  }

  function renderScoringSummary(scoringRow) {
    const config = window.FragranceMasterData.getCompatibleScoringConfig(scoringRow?.config_json || null);
    const questionWeights = config.questionWeights || {};
    const branchTemplates = Object.entries(config.branchTemplates || {}).slice(0, 3);
    if (scoringWeightSummaryEl) {
      scoringWeightSummaryEl.innerHTML = `
        <article class="admin-item-card">
          <div class="admin-meta-row"><span>共通質問（1〜5）</span><strong>${questionWeights.step1 ?? "-"}</strong></div>
        </article>
        <article class="admin-item-card">
          <div class="admin-meta-row"><span>分岐質問（6〜7）</span><strong>${questionWeights.step2 ?? "-"}</strong></div>
        </article>
        <article class="admin-item-card">
          <div class="admin-meta-row"><span>最終質問（8）</span><strong>${questionWeights.finish ?? "-"}</strong></div>
        </article>
        <article class="admin-item-card">
          <div class="admin-meta-row"><span>仕上げ補正</span><strong>${config.finishBlendRatio ?? "-"}</strong></div>
        </article>
      `;
    }
    scoringSummaryEl.innerHTML = `
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
    const activeMaterials = materials.filter((row) => row.is_active !== false);
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
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole("manager");
    window.AdminAuth.renderAdminHeader("dashboard", {
      role: "manager",
      session,
      links: [
        { href: "admin-settings.html", label: "スタッフ登録/管理", key: "settings" },
        { href: "admin-scoring.html", label: "配点ロジック", key: "scoring" },
        { href: "admin-materials.html", label: "原料ポイント", key: "materials" }
      ]
    });

    const [reservations, slots, scoringRows, materials] = await Promise.all([
      window.AdminData.listRows("reservations", { orders: [{ column: "created_at", ascending: false }] }).catch(() => []),
      window.AdminData.listRows("reservation_slots", { filters: [{ operator: "in", column: "status", value: ["open", "recommended", "closed"] }] }).catch(() => []),
      window.AdminData.listRows("scoring_configs", { filters: [{ operator: "eq", column: "is_active", value: true }], limit: 1 }).catch(() => []),
      window.AdminData.listRows("material_points").catch(() => [])
    ]);

    const todayKey = formatDateKey(new Date());
    const slotMap = new Map(slots.map((row) => [row.id, row]));
    const todayReservations = reservations.filter((row) => slotMap.get(row.slot_id)?.slot_date === todayKey);
    kpiReservationsEl.textContent = String(todayReservations.length);
    if (kpiReservationsWeekEl) {
      const today = todayKey;
      const weekLimit = formatDateKey(addDays(createLocalDate(new Date()), 6));
      const weeklyReservations = reservations.filter((row) => {
        const dateKey = slotMap.get(row.slot_id)?.slot_date || "";
        return dateKey >= today && dateKey <= weekLimit;
      });
      const weeklySlots = slots.filter((row) => row.is_active !== false && row.slot_date >= today && row.slot_date <= weekLimit);
      kpiReservationsWeekEl.textContent = String(weeklyReservations.length);
      kpiSlotsEl.textContent = String(weeklySlots.length);
    }
    kpiScoringEl.textContent = scoringRows[0]?.version ?? "-";
    kpiMaterialsEl.textContent = String(materials.length);

    renderTodayShifts(slots, reservations);
    renderNextWeekSummary(slots, reservations);
    renderCoverage(slots);
    renderScoringSummary(scoringRows[0] || null);
    renderMaterialLinks(materials);
  }

  bootstrap();
})();
