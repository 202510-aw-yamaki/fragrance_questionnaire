(function () {
  const AXIS_ORDER = window.FragranceMasterData.AXIS_ORDER;
  const AXIS_LABELS = window.FragranceMasterData.AXIS_LABELS;
  const CATEGORY_ORDER = { Top: 0, Middle: 1, Last: 2 };
  const MATERIAL_SAVE_NOTE_KEY = "material_points_save_note";
  const collator = new Intl.Collator("ja", { sensitivity: "base", numeric: true });
  const rowsEl = document.getElementById("material-rows");
  const form = document.getElementById("material-form");
  const modalEl = document.getElementById("material-modal");
  const searchInput = document.getElementById("material-search");
  const categoryFilter = document.getElementById("material-filter");
  const sortModeEl = document.getElementById("material-sort-mode");
  const templateSelect = document.getElementById("material-template-select");
  const summaryCount = document.getElementById("material-count");
  const formTotal = document.getElementById("material-total");
  const seedStatus = document.getElementById("material-seed-status");
  const totalKpi = document.getElementById("materials-kpi-total");
  const activeKpi = document.getElementById("materials-kpi-active");
  const templateKpi = document.getElementById("materials-kpi-template");
  const currentSortEl = document.getElementById("material-current-sort");
  const saveNoteEl = document.getElementById("material-save-note");
  const chipGridEl = document.getElementById("material-chip-grid");
  const seedButton = document.getElementById("material-seed-btn");
  const saveDbButtons = Array.from(new Set([
    seedButton,
    ...document.querySelectorAll("[data-material-save-db]")
  ].filter(Boolean)));
  const resetButton = document.getElementById("material-reset");
  const applyTemplateButton = document.getElementById("material-template-apply");
  const createButton = document.getElementById("material-create-button");
  const exportButtons = Array.from(new Set([
    document.getElementById("material-export-json"),
    ...document.querySelectorAll("[data-material-export-json]")
  ].filter(Boolean)));
  const importTriggerButton = document.getElementById("material-import-trigger");
  const importInput = document.getElementById("material-import-file");
  let cachedRows = [];

  function getTemplates() {
    return window.FragranceMasterData.createMaterialTemplates();
  }

  function normalizeRow(row) {
    return window.FragranceMasterData.normalizeMaterialRow(row);
  }

  function openModal() {
    modalEl.hidden = false;
  }

  function closeModal() {
    modalEl.hidden = true;
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
    formTotal.textContent = String(total);
    formTotal.className = total === 100 ? "admin-note admin-note-success" : "admin-note admin-note-warning";
    return total;
  }

  function fillForm(row, options = {}) {
    const normalized = normalizeRow(row);
    document.getElementById("material-modal-title").textContent = "新規作成 / 編集";
    document.getElementById("material-id").value = options.asNew ? "" : row.id || "";
    document.getElementById("material-code").value = normalized.material_code || "";
    document.getElementById("material-name").value = normalized.material_name || "";
    document.getElementById("material-category").value = normalized.category || "Top";
    AXIS_ORDER.forEach((axis) => {
      document.getElementById(`axis-${axis}`).value = normalized.point_axes?.[axis] ?? 0;
    });
    document.getElementById("material-sort").value = normalized.sort_order ?? 0;
    document.getElementById("material-note").value = normalized.note || "";
    document.getElementById("material-active").checked = normalized.is_active !== false;
    renderFormTotal();
    openModal();
  }

  function resetForm() {
    form.reset();
    document.getElementById("material-modal-title").textContent = "新規作成 / 編集";
    document.getElementById("material-id").value = "";
    document.getElementById("material-category").value = "Top";
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
    const sourceRows = rows?.length ? rows : getTemplates();
    cachedRows = sourceRows.map(normalizeRow);
    return cachedRows;
  }

  function renderKpis(rows) {
    totalKpi.textContent = String(rows.length);
    activeKpi.textContent = String(rows.filter((row) => row.is_active !== false).length);
    templateKpi.textContent = String(getTemplates().length);
    currentSortEl.textContent = sortModeEl.options[sortModeEl.selectedIndex]?.text || "登録順（正）";
  }

  function createMaterialAxisCells(axes) {
    return AXIS_ORDER.map((axis) => {
      return `
        <span class="portal-material-axis-cell">
          <span>${AXIS_LABELS[axis]}</span>
          <strong>${Number(axes?.[axis] || 0)}</strong>
        </span>
      `;
    }).join("");
  }

  function getSortedRows(rows) {
    const sorted = [...rows];
    const mode = sortModeEl.value;
    sorted.sort((left, right) => {
      if (mode === "register-desc") {
        return (right.sort_order - left.sort_order) || collator.compare(right.material_code, left.material_code);
      }
      if (mode === "name-asc") {
        return collator.compare(left.material_name, right.material_name);
      }
      if (mode === "name-desc") {
        return collator.compare(right.material_name, left.material_name);
      }
      if (mode === "category-asc") {
        return (CATEGORY_ORDER[left.category] ?? 99) - (CATEGORY_ORDER[right.category] ?? 99) || collator.compare(left.material_name, right.material_name);
      }
      if (mode === "category-desc") {
        return (CATEGORY_ORDER[right.category] ?? -1) - (CATEGORY_ORDER[left.category] ?? -1) || collator.compare(right.material_name, left.material_name);
      }
      return (left.sort_order - right.sort_order) || collator.compare(left.material_code, right.material_code);
    });
    return sorted;
  }

  function getFilteredRows() {
    const keyword = (searchInput.value || "").trim().toLowerCase();
    const category = categoryFilter.value || "";
    const filtered = cachedRows.filter((row) => {
      const matchesKeyword = !keyword || [row.material_code, row.material_name, row.category, row.note]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesCategory = !category || row.category === category;
      return matchesKeyword && matchesCategory;
    });
    return getSortedRows(filtered);
  }

  function renderChipGrid(rows) {
    chipGridEl.innerHTML = rows.length
      ? rows.map((row) => `
          <button class="admin-chip portal-material-chip" type="button" data-focus-code="${row.material_code}">
            <span class="portal-material-chip-name">${row.material_name}</span>
            <span class="portal-material-chip-category">${row.category || "未設定"}</span>
          </button>
        `).join("")
      : `<span class="admin-chip">原料未登録</span>`;
    chipGridEl.querySelectorAll("[data-focus-code]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = rowsEl.querySelector(`[data-material-code="${button.dataset.focusCode}"]`);
        if (target) {
          target.classList.add("is-focused");
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          window.setTimeout(() => target.classList.remove("is-focused"), 1600);
        }
      });
    });
  }

  function renderRows() {
    const rows = getFilteredRows();
    renderKpis(cachedRows);
    renderChipGrid(rows);
    summaryCount.textContent = `${rows.length}件を表示中`;
    rowsEl.innerHTML = "";
    if (!rows.length) {
      rowsEl.innerHTML = `<p class="admin-empty">条件に合う素材がありません。</p>`;
      return;
    }
    rows.forEach((row) => {
      const article = document.createElement("article");
      article.className = "admin-item-card portal-material-card";
      article.dataset.materialCode = row.material_code || "";
      article.innerHTML = `
        <div class="portal-material-card-main">
          <h3 class="portal-material-card-name">${row.material_name || "名称未設定"}</h3>
          <div class="portal-material-axis-row">
            ${createMaterialAxisCells(row.point_axes)}
            <span class="portal-category-pill">${row.category || "未設定"}</span>
          </div>
        </div>
        <div class="portal-material-card-foot">
          <p class="admin-note">${row.note || "メモ未設定"}</p>
          <button class="admin-btn primary" data-edit-code="${row.material_code}" type="button">編集</button>
        </div>
      `;
      rowsEl.appendChild(article);
    });

    rowsEl.querySelectorAll("[data-edit-code]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = cachedRows.find((row) => row.material_code === button.dataset.editCode);
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

  async function loadMaterialSaveNote() {
    if (!saveNoteEl) return;
    const rows = await window.AdminData.listRows("admin_settings", {
      filters: [{ operator: "eq", column: "setting_key", value: MATERIAL_SAVE_NOTE_KEY }],
      limit: 1
    }).catch(() => []);
    const value = rows?.[0]?.setting_value;
    if (!value) return;
    saveNoteEl.value = typeof value === "string" ? value : (value.note || "");
  }

  async function saveMaterialSaveNote(savedAt) {
    if (!saveNoteEl) return;
    await window.AdminData.upsertRow("admin_settings", {
      setting_key: MATERIAL_SAVE_NOTE_KEY,
      setting_value: {
        note: saveNoteEl.value.trim(),
        saved_at: savedAt
      },
      updated_at: savedAt
    }, "setting_key");
  }

  async function saveMaterialsToDatabase() {
    const savedAt = new Date().toISOString();
    const payload = (cachedRows.length ? cachedRows : getTemplates()).map((row, index) => {
      const normalized = normalizeRow(row);
      return {
        ...normalized,
        sort_order: Number(normalized.sort_order || ((index + 1) * 10)),
        updated_at: savedAt
      };
    });
    try {
      await window.AdminData.upsertRow("material_points", payload, "material_code");
      await saveMaterialSaveNote(savedAt);
    } catch (error) {
      seedStatus.className = "admin-error";
      seedStatus.textContent = error?.message || "データベース保存に失敗しました。";
      return;
    }
    seedStatus.className = "admin-note";
    seedStatus.textContent = `${payload.length}件をデータベースに保存しました。`;
    await getAllMaterials();
    renderRows();
  }

  async function importRowsFromJson(rows) {
    const payload = rows.map((row, index) => {
      const normalized = normalizeRow(row);
      return {
        ...normalized,
        sort_order: Number(normalized.sort_order || ((index + 1) * 10)),
        updated_at: new Date().toISOString()
      };
    });
    await window.AdminData.upsertRow("material_points", payload, "material_code");
    seedStatus.className = "admin-note";
    seedStatus.textContent = `${payload.length}件を Json から反映しました。`;
    await getAllMaterials();
    renderRows();
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const axes = getAxesInput();
    const total = getAxesTotal(axes);
    if (total !== 100) {
      seedStatus.className = "admin-error";
      seedStatus.textContent = "5種の方向性ポイント合計が 100 のときだけ保存できます。";
      return;
    }
    const payload = {
      material_code: document.getElementById("material-code").value.trim(),
      material_name: document.getElementById("material-name").value.trim(),
      category: document.getElementById("material-category").value || "Top",
      point_axes: axes,
      note: document.getElementById("material-note").value.trim() || null,
      is_active: document.getElementById("material-active").checked,
      sort_order: Number(document.getElementById("material-sort").value || 0),
      updated_at: new Date().toISOString()
    };
    const id = document.getElementById("material-id").value;
    try {
      if (id) {
        await window.AdminData.updateRow("material_points", id, payload);
      } else {
        await window.AdminData.insertRow("material_points", payload);
      }
    } catch (error) {
      seedStatus.className = "admin-error";
      seedStatus.textContent = error?.message || "Save failed.";
      return;
    }
    seedStatus.className = "admin-note";
    seedStatus.textContent = "保存しました。";
    closeModal();
    resetForm();
    await getAllMaterials();
    renderRows();
  });

  resetButton.addEventListener("click", () => {
    resetForm();
  });
  saveDbButtons.forEach((button) => {
    button.addEventListener("click", saveMaterialsToDatabase);
  });
  createButton.addEventListener("click", () => {
    resetForm();
    openModal();
  });
  applyTemplateButton.addEventListener("click", () => {
    const selectedCode = templateSelect.value;
    const target = getTemplates().find((row) => row.material_code === selectedCode);
    if (target) fillForm(target, { asNew: true });
  });
  exportButtons.forEach((exportButton) => exportButton.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(getFilteredRows(), null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "material-points.json";
    anchor.click();
    window.URL.revokeObjectURL(url);
    seedStatus.className = "admin-note";
    seedStatus.textContent = "現在の原料一覧を Json ファイルとして保存しました。";
  }));
  importTriggerButton.addEventListener("click", () => {
    importInput.click();
  });
  importInput.addEventListener("change", async () => {
    const file = importInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error("Json 読込は配列形式の原料データに対応しています。");
      }
      await importRowsFromJson(parsed);
    } catch (error) {
      seedStatus.className = "admin-error";
      seedStatus.textContent = error.message || "Json 読込に失敗しました。";
    } finally {
      importInput.value = "";
    }
  });
  searchInput.addEventListener("input", renderRows);
  categoryFilter.addEventListener("change", renderRows);
  sortModeEl.addEventListener("change", renderRows);
  AXIS_ORDER.forEach((axis) => {
    document.getElementById(`axis-${axis}`).addEventListener("input", renderFormTotal);
  });
  document.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", () => {
      closeModal();
    });
  });

  async function bootstrap() {
    const session = await window.AdminAuth.requireAdminSession();
    if (!session) return;
    window.AdminAuth.persistPortalRole("manager");
    window.AdminAuth.renderAdminHeader("materials", {
      role: "manager",
      session,
      links: [
        { href: "admin-settings.html", label: "スタッフ登録/管理", key: "settings" },
        { href: "admin-scoring.html", label: "配点ロジック", key: "scoring" }
      ]
    });
    const focusCode = new URLSearchParams(window.location.search).get("focus");
    if (focusCode) searchInput.value = focusCode;
    renderTemplateOptions();
    resetForm();
    await loadMaterialSaveNote();
    await getAllMaterials();
    renderRows();
  }

  bootstrap();
})();
