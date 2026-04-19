(function () {
  const AXIS_ORDER = window.FragranceMasterData.AXIS_ORDER;
  const AXIS_LABELS = window.FragranceMasterData.AXIS_LABELS;
  const rowsEl = document.getElementById("material-rows");
  const form = document.getElementById("material-form");
  const searchInput = document.getElementById("material-search");
  const categoryFilter = document.getElementById("material-filter");
  const templateSelect = document.getElementById("material-template-select");
  const summaryCount = document.getElementById("material-count");
  const formTotal = document.getElementById("material-total");
  const seedStatus = document.getElementById("material-seed-status");
  const totalKpi = document.getElementById("materials-kpi-total");
  const activeKpi = document.getElementById("materials-kpi-active");
  const templateKpi = document.getElementById("materials-kpi-template");
  const seedButton = document.getElementById("material-seed-btn");
  const resetButton = document.getElementById("material-reset");
  const applyTemplateButton = document.getElementById("material-template-apply");
  let cachedRows = [];

  function getTemplates() {
    return window.FragranceMasterData.createMaterialTemplates();
  }

  function getAxesInput() {
    return AXIS_ORDER.reduce((acc, axis) => {
      acc[axis] = Number(document.getElementById(`axis-${axis}`).value || 0);
      return acc;
    }, {});
  }

  function getAxesTotal(axes) {
    return AXIS_ORDER.reduce((sum, axis) => sum + Number(axes?.[axis] || 0), 0);
  }

  function renderFormTotal() {
    const total = getAxesTotal(getAxesInput());
    formTotal.textContent = `現在の合計: ${total}`;
    formTotal.className = total === 100 ? "admin-note admin-note-success" : "admin-note admin-note-warning";
  }

  function fillForm(row, options = {}) {
    document.getElementById("material-id").value = options.asNew ? "" : row.id || "";
    document.getElementById("material-code").value = row.material_code || "";
    document.getElementById("material-name").value = row.material_name || "";
    document.getElementById("material-category").value = row.category || "";
    AXIS_ORDER.forEach((axis) => {
      document.getElementById(`axis-${axis}`).value = row.point_axes?.[axis] ?? 0;
    });
    document.getElementById("material-sort").value = row.sort_order ?? 0;
    document.getElementById("material-note").value = row.note || "";
    document.getElementById("material-active").checked = row.is_active !== false;
    renderFormTotal();
  }

  function resetForm() {
    form.reset();
    document.getElementById("material-id").value = "";
    document.getElementById("material-active").checked = true;
    AXIS_ORDER.forEach((axis) => {
      document.getElementById(`axis-${axis}`).value = "0";
    });
    document.getElementById("material-sort").value = "0";
    templateSelect.value = "";
    renderFormTotal();
  }

  async function getAllMaterials() {
    const rows = await window.AdminData.listRows("material_points", {
      orders: [
        { column: "sort_order", ascending: true },
        { column: "material_code", ascending: true }
      ]
    }).catch(() => []);
    cachedRows = rows || [];
    return cachedRows;
  }

  function renderKpis(rows) {
    totalKpi.textContent = String(rows.length);
    activeKpi.textContent = String(rows.filter((row) => row.is_active !== false).length);
    templateKpi.textContent = String(getTemplates().length);
  }

  function createAxisBadges(axes) {
    return AXIS_ORDER.map((axis) => {
      return `<span class="admin-axis-badge"><small>${AXIS_LABELS[axis]}</small><strong>${Number(axes?.[axis] || 0)}</strong></span>`;
    }).join("");
  }

  function getFilteredRows() {
    const keyword = (searchInput.value || "").trim().toLowerCase();
    const category = categoryFilter.value || "";
    return cachedRows.filter((row) => {
      const matchesKeyword = !keyword || [row.material_code, row.material_name, row.category, row.note]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesCategory = !category || (row.category || "") === category;
      return matchesKeyword && matchesCategory;
    });
  }

  function renderRows() {
    const rows = getFilteredRows();
    renderKpis(cachedRows);
    summaryCount.textContent = `${rows.length}件を表示中`;
    rowsEl.innerHTML = "";
    if (!rows.length) {
      rowsEl.innerHTML = `<p class="admin-empty">条件に合う素材がありません。</p>`;
      return;
    }
    rows.forEach((row) => {
      const article = document.createElement("article");
      article.className = "admin-item-card";
      article.dataset.materialCode = row.material_code || "";
      article.innerHTML = `
        <div class="admin-item-head">
          <div>
            <p class="admin-item-code">${row.material_code || ""}</p>
            <h3>${row.material_name || "名称未設定"}</h3>
          </div>
          <span class="admin-status-pill ${row.is_active !== false ? "is-active" : "is-paused"}">${row.is_active !== false ? "公開中" : "停止中"}</span>
        </div>
        <div class="admin-meta-row">
          <span>分類</span>
          <strong>${row.category || "未設定"}</strong>
        </div>
        <div class="admin-axis-badge-row">${createAxisBadges(row.point_axes)}</div>
        <p class="admin-note">${row.note || "メモ未設定"}</p>
        <div class="admin-actions">
          <button class="admin-btn secondary" data-edit-id="${row.id}" type="button">編集する</button>
        </div>
      `;
      rowsEl.appendChild(article);
    });
    rowsEl.querySelectorAll("[data-edit-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = cachedRows.find((row) => row.id === button.dataset.editId);
        if (target) fillForm(target);
      });
    });

    const focusCode = new URLSearchParams(window.location.search).get("focus");
    if (focusCode) {
      const targetCard = rowsEl.querySelector(`[data-material-code="${focusCode}"]`);
      if (targetCard) {
        targetCard.classList.add("is-focused");
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function renderTemplateOptions() {
    const templates = getTemplates();
    templateSelect.innerHTML = `<option value="">選択してください</option>${templates.map((row) => {
      return `<option value="${row.material_code}">${row.material_name} / ${row.category}</option>`;
    }).join("")}`;
  }

  async function seedTemplates() {
    const payload = getTemplates().map((row) => ({
      ...row,
      updated_at: new Date().toISOString()
    }));
    await window.AdminData.upsertRow("material_points", payload, "material_code").catch(console.error);
    seedStatus.textContent = `${payload.length}件の初期テンプレートを反映しました。`;
    await getAllMaterials();
    renderRows();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      material_code: document.getElementById("material-code").value.trim(),
      material_name: document.getElementById("material-name").value.trim(),
      category: document.getElementById("material-category").value.trim() || null,
      point_axes: getAxesInput(),
      note: document.getElementById("material-note").value.trim() || null,
      is_active: document.getElementById("material-active").checked,
      sort_order: Number(document.getElementById("material-sort").value || 0),
      updated_at: new Date().toISOString()
    };
    const id = document.getElementById("material-id").value;
    if (id) {
      await window.AdminData.updateRow("material_points", id, payload).catch(console.error);
    } else {
      await window.AdminData.insertRow("material_points", payload).catch(console.error);
    }
    seedStatus.textContent = "保存しました。";
    resetForm();
    await getAllMaterials();
    renderRows();
  });

  resetButton.addEventListener("click", resetForm);
  seedButton.addEventListener("click", seedTemplates);
  applyTemplateButton.addEventListener("click", () => {
    const selectedCode = templateSelect.value;
    const target = getTemplates().find((row) => row.material_code === selectedCode);
    if (target) fillForm(target, { asNew: true });
  });
  searchInput.addEventListener("input", renderRows);
  categoryFilter.addEventListener("change", renderRows);
  AXIS_ORDER.forEach((axis) => {
    document.getElementById(`axis-${axis}`).addEventListener("input", renderFormTotal);
  });

  async function bootstrap() {
    const role = window.AdminAuth.readRoleFromLocation() || window.AdminAuth.readStoredRole() || "manager";
    window.AdminAuth.renderAdminHeader("materials", { role });
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole(role);
    const focusCode = new URLSearchParams(window.location.search).get("focus");
    if (focusCode) searchInput.value = focusCode;
    renderTemplateOptions();
    resetForm();
    await getAllMaterials();
    renderRows();
  }

  bootstrap();
})();
