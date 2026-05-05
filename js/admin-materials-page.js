(function () {
  const AXIS_ORDER = window.FragranceMasterData.AXIS_ORDER;
  const AXIS_LABELS = window.FragranceMasterData.AXIS_LABELS;
  const CATEGORY_ORDER = { Top: 0, Middle: 1, Last: 2 };
  const PAGE_SIZE = 8;
  const collator = new Intl.Collator("ja", { sensitivity: "base", numeric: true });
  const rowsEl = document.getElementById("material-rows");
  const form = document.getElementById("material-form");
  const searchInput = document.getElementById("material-search");
  const categoryFilter = document.getElementById("material-filter");
  const sortModeEl = document.getElementById("material-sort-mode");
  const summaryCount = document.getElementById("material-count");
  const formTotal = document.getElementById("material-total");
  const totalNote = document.getElementById("material-total-note");
  const seedStatus = document.getElementById("material-seed-status");
  const currentSortEl = document.getElementById("material-current-sort");
  const seedButton = document.getElementById("material-seed-btn");
  const resetButton = document.getElementById("material-reset");
  const createButton = document.getElementById("material-create-button");
  const exportButton = document.getElementById("material-export-json");
  const importTriggerButton = document.getElementById("material-import-trigger");
  const importInput = document.getElementById("material-import-file");
  const pagePrevButton = document.getElementById("material-page-prev");
  const pageNextButton = document.getElementById("material-page-next");
  const pageStatusEl = document.getElementById("material-page-status");
  const previewNameEl = document.getElementById("material-preview-name");
  const radarPolygonEl = document.getElementById("material-radar-polygon");
  const axisPreviewListEl = document.getElementById("material-axis-preview-list");
  const tagPreviewEl = document.getElementById("material-tag-preview");
  const tagInput = document.getElementById("material-tags");
  let cachedRows = [];
  let selectedCode = "";
  let currentPage = 1;
  let dataSource = "db";

  function getTemplates() {
    return window.FragranceMasterData.createMaterialTemplates();
  }

  function normalizeTags(value) {
    if (Array.isArray(value)) {
      return value.map((tag) => String(tag).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value.split(/[,\n、]/).map((tag) => tag.trim()).filter(Boolean);
    }
    return [];
  }

  function normalizeRow(row) {
    const normalized = window.FragranceMasterData.normalizeMaterialRow(row);
    return {
      id: row?.id || "",
      ...normalized,
      tags: normalizeTags(row?.tags)
    };
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (match) => {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#039;"
      }[match];
    });
  }

  function setStatus(message, type = "note") {
    seedStatus.className = type === "error" ? "admin-error" : "admin-note";
    seedStatus.textContent = message;
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
    totalNote.className = total === 100 ? "admin-note admin-note-success" : "admin-note admin-note-warning";
    AXIS_ORDER.forEach((axis) => {
      const input = document.getElementById(`axis-${axis}`);
      const output = document.getElementById(`axis-${axis}-value`);
      if (input && output) output.textContent = String(Number(input.value || 0));
    });
    return total;
  }

  function fillForm(row) {
    const normalized = normalizeRow(row);
    selectedCode = normalized.material_code || "";
    document.getElementById("material-id").value = normalized.id || "";
    document.getElementById("material-code").value = normalized.material_code;
    document.getElementById("material-name").value = normalized.material_name || "";
    document.getElementById("material-category").value = normalized.category || "Top";
    AXIS_ORDER.forEach((axis) => {
      document.getElementById(`axis-${axis}`).value = normalized.point_axes?.[axis] ?? 0;
    });
    document.getElementById("material-sort").value = normalized.sort_order ?? 0;
    document.getElementById("material-note").value = normalized.note || "";
    tagInput.value = normalized.tags.join(", ");
    document.getElementById("material-active").checked = normalized.is_active !== false;
    renderFormTotal();
    renderTagPreview(normalized.tags);
    renderPreview(normalized);
  }

  function resetForm() {
    const selected = cachedRows.find((row) => row.material_code === selectedCode) || cachedRows[0];
    if (selected) fillForm(selected);
  }

  function readFormRow() {
    return normalizeRow({
      id: document.getElementById("material-id").value,
      material_code: document.getElementById("material-code").value.trim(),
      material_name: document.getElementById("material-name").value.trim(),
      category: document.getElementById("material-category").value || "Top",
      point_axes: getAxesInput(),
      note: document.getElementById("material-note").value.trim() || null,
      tags: normalizeTags(tagInput.value),
      is_active: document.getElementById("material-active").checked,
      sort_order: Number(document.getElementById("material-sort").value || 0)
    });
  }

  function persistFormToCache() {
    if (!cachedRows.length) return;
    const nextRow = readFormRow();
    const index = cachedRows.findIndex((row) => row.material_code === selectedCode);
    if (index >= 0) {
      cachedRows[index] = nextRow;
    }
    selectedCode = nextRow.material_code;
    renderFormTotal();
    renderTagPreview(nextRow.tags);
    renderPreview(nextRow);
  }

  async function getAllMaterials() {
    let rows = [];
    let statusMessage = "";
    try {
      rows = await window.AdminData.listRows("material_points", {
        orders: [
          { column: "sort_order", ascending: true },
          { column: "material_code", ascending: true }
        ]
      });
    } catch (error) {
      statusMessage = `DB取得に失敗したためテンプレートを表示しています。${error?.message || ""}`;
      rows = [];
    }
    dataSource = rows?.length ? "db" : "template";
    const sourceRows = rows?.length ? rows : getTemplates();
    cachedRows = sourceRows.map(normalizeRow);
    selectedCode = cachedRows[0]?.material_code || "";
    currentPage = 1;
    setStatus(statusMessage || (dataSource === "template" ? "DBに原料がないためテンプレートを表示しています。" : `${cachedRows.length}件をDBから取得しました。`));
    return cachedRows;
  }

  function getSortedRows(rows) {
    const sorted = [...rows];
    const mode = sortModeEl.value;
    sorted.sort((left, right) => {
      if (mode === "name-asc") {
        return collator.compare(left.material_name, right.material_name);
      }
      if (mode === "category-asc") {
        return (CATEGORY_ORDER[left.category] ?? 99) - (CATEGORY_ORDER[right.category] ?? 99) || collator.compare(left.material_name, right.material_name);
      }
      return (left.sort_order - right.sort_order) || collator.compare(left.material_code, right.material_code);
    });
    return sorted;
  }

  function getFilteredRows() {
    const keyword = (searchInput.value || "").trim().toLowerCase();
    const category = categoryFilter.value || "";
    const filtered = cachedRows.filter((row) => {
      const matchesKeyword = !keyword || [row.material_code, row.material_name, row.category, row.note, ...(row.tags || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesCategory = !category || row.category === category;
      return matchesKeyword && matchesCategory;
    });
    return getSortedRows(filtered);
  }

  function getPagedRows(rows) {
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(1, currentPage), pageCount);
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      pageRows: rows.slice(start, start + PAGE_SIZE),
      pageCount
    };
  }

  function renderPagination(filteredRows, pageCount) {
    pageStatusEl.textContent = `${currentPage} / ${pageCount}`;
    pagePrevButton.disabled = currentPage <= 1;
    pageNextButton.disabled = currentPage >= pageCount || filteredRows.length === 0;
  }

  function ensureVisibleSelection(rows) {
    if (!rows.length) {
      selectedCode = "";
      return null;
    }
    const selected = rows.find((row) => row.material_code === selectedCode) || rows[0];
    selectedCode = selected.material_code;
    return selected;
  }

  function renderRows() {
    const rows = getFilteredRows();
    const { pageRows, pageCount } = getPagedRows(rows);
    const selected = ensureVisibleSelection(pageRows);
    const optionText = sortModeEl.options[sortModeEl.selectedIndex]?.text || "表示順";
    summaryCount.textContent = `${rows.length}件を表示中 / 全${cachedRows.length}件`;
    currentSortEl.textContent = `${dataSource === "db" ? "DB" : "テンプレート"} / ${optionText}`;
    rowsEl.innerHTML = "";
    if (!rows.length) {
      rowsEl.innerHTML = `<p class="admin-empty">条件に合う素材がありません。</p>`;
      renderPagination(rows, pageCount);
      renderPreview(null);
      return;
    }
    rowsEl.innerHTML = pageRows.map((row) => {
      const activeClass = row.material_code === selectedCode ? " is-active" : "";
      const tags = row.tags?.length ? ` / ${row.tags.join("・")}` : "";
      return `
        <button class="admin-material-list-item${activeClass}" type="button" data-material-code="${escapeHtml(row.material_code)}">
          <span>
            <strong>${escapeHtml(row.material_name || "名称未設定")}</strong>
            <span>${escapeHtml(row.material_code || "コード未設定")}${escapeHtml(tags)}</span>
          </span>
          <em>${escapeHtml(row.category || "未設定")}</em>
        </button>
      `;
    }).join("");
    renderPagination(rows, pageCount);
    rowsEl.querySelectorAll("[data-material-code]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = cachedRows.find((row) => row.material_code === button.dataset.materialCode);
        if (target) {
          selectedCode = target.material_code;
          fillForm(target);
          renderRows();
        }
      });
    });
    if (selected) fillForm(selected);
  }

  function renderTagPreview(tags) {
    const normalized = normalizeTags(tags);
    tagPreviewEl.innerHTML = normalized.length
      ? normalized.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")
      : `<span>タグ未設定</span>`;
  }

  function getRadarPoints(axes) {
    const center = { x: 120, y: 120 };
    const maxRadius = 100;
    const angles = [-90, -18, 54, 126, 198];
    return AXIS_ORDER.map((axis, index) => {
      const value = Math.max(0, Math.min(100, Number(axes?.[axis] || 0)));
      const radius = (value / 100) * maxRadius;
      const radians = (angles[index] * Math.PI) / 180;
      const x = center.x + Math.cos(radians) * radius;
      const y = center.y + Math.sin(radians) * radius;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }

  function renderPreview(row) {
    const target = row || readFormRow();
    previewNameEl.textContent = target?.material_name || "選択中の原料";
    const axes = target?.point_axes || {};
    radarPolygonEl.setAttribute("points", getRadarPoints(axes));
    axisPreviewListEl.innerHTML = AXIS_ORDER.map((axis) => {
      const value = Number(axes?.[axis] || 0);
      return `
        <span>${AXIS_LABELS[axis]}</span>
        <meter min="0" max="100" value="${value}"></meter>
        <span>${value}</span>
      `;
    }).join("");
  }

  function createNewMaterial() {
    const code = `new-material-${Date.now()}`;
    const nextSort = cachedRows.reduce((max, row) => Math.max(max, Number(row.sort_order || 0)), 0) + 10;
    const row = normalizeRow({
      material_code: code,
      material_name: "新規原料",
      category: "Top",
      point_axes: { floral: 20, fresh: 20, woody: 20, spicy: 20, sweet: 20 },
      tags: [],
      note: null,
      is_active: true,
      sort_order: nextSort
    });
    cachedRows.push(row);
    searchInput.value = "";
    categoryFilter.value = "";
    selectedCode = row.material_code;
    currentPage = Math.max(1, Math.ceil(getFilteredRows().length / PAGE_SIZE));
    fillForm(row);
    renderRows();
    setStatus("新規原料を追加しました。内容を調整してDB保存してください。");
  }
  function createMaterialPayload(row, index, savedAt) {
    const normalized = normalizeRow(row);
    const total = getAxesTotal(normalized.point_axes);
    if (!normalized.material_code || !normalized.material_name) {
      throw new Error("原料コードと原料名は必須です。");
    }
    if (total !== 100) {
      throw new Error(`${normalized.material_name} の5軸ポイント合計が100ではありません。`);
    }
    return {
      material_code: normalized.material_code,
      material_name: normalized.material_name,
      category: normalized.category || "Top",
      point_axes: normalized.point_axes,
      tags: normalized.tags,
      note: normalized.note || null,
      is_active: normalized.is_active !== false,
      sort_order: Number(normalized.sort_order || ((index + 1) * 10)),
      updated_at: savedAt
    };
  }

  async function saveMaterialsToDatabase() {
    persistFormToCache();
    const savedAt = new Date().toISOString();
    let payload = [];
    try {
      payload = (cachedRows.length ? cachedRows : getTemplates()).map((row, index) => createMaterialPayload(row, index, savedAt));
      await window.AdminData.upsertRow("material_points", payload, "material_code");
    } catch (error) {
      setStatus(error?.message || "データベース保存に失敗しました。", "error");
      return;
    }
    setStatus(`${payload.length}件をデータベースに保存しました。`);
    await getAllMaterials();
    renderRows();
  }

  function importRowsFromJson(rows) {
    cachedRows = rows.map((row, index) => {
      const normalized = normalizeRow(row);
      return {
        ...normalized,
        sort_order: Number(normalized.sort_order || ((index + 1) * 10))
      };
    });
    dataSource = "json";
    selectedCode = cachedRows[0]?.material_code || "";
    currentPage = 1;
    setStatus(`${cachedRows.length}件をJSONから読み込みました。DB保存で反映してください。`);
    renderRows();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    persistFormToCache();
    renderRows();
  });

  resetButton.addEventListener("click", () => {
    resetForm();
    renderRows();
  });
  seedButton.addEventListener("click", saveMaterialsToDatabase);
  createButton.addEventListener("click", () => {
    createNewMaterial();
  });
  exportButton.addEventListener("click", () => {
    persistFormToCache();
    const exportRows = getFilteredRows().map((row) => normalizeRow(row));
    const blob = new Blob([JSON.stringify(exportRows, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "material-points.json";
    anchor.click();
    window.URL.revokeObjectURL(url);
    setStatus("現在の表示対象をJSONファイルとして保存しました。");
  });
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
      importRowsFromJson(parsed);
    } catch (error) {
      setStatus(error.message || "Json 読込に失敗しました。", "error");
    } finally {
      importInput.value = "";
    }
  });
  searchInput.addEventListener("input", () => {
    persistFormToCache();
    currentPage = 1;
    renderRows();
  });
  categoryFilter.addEventListener("change", () => {
    persistFormToCache();
    currentPage = 1;
    renderRows();
  });
  sortModeEl.addEventListener("change", () => {
    persistFormToCache();
    currentPage = 1;
    renderRows();
  });
  pagePrevButton.addEventListener("click", () => {
    persistFormToCache();
    currentPage -= 1;
    renderRows();
  });
  pageNextButton.addEventListener("click", () => {
    persistFormToCache();
    currentPage += 1;
    renderRows();
  });
  ["material-code", "material-name", "material-category", "material-sort", "material-active", "material-note", "material-tags"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => {
      persistFormToCache();
      renderRows();
    });
  });
  AXIS_ORDER.forEach((axis) => {
    document.getElementById(`axis-${axis}`).addEventListener("input", () => {
      persistFormToCache();
      renderRows();
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
        { href: "admin-qr-requests.html", label: "QR依頼一覧", key: "qr-requests" },
        { href: "admin-settings.html", label: "スタッフ登録/管理", key: "settings" },
        { href: "admin-scoring.html", label: "配点ロジック", key: "scoring" }
      ]
    });
    const focusCode = new URLSearchParams(window.location.search).get("focus");
    if (focusCode) searchInput.value = focusCode;
    await getAllMaterials();
    if (focusCode && cachedRows.some((row) => row.material_code === focusCode)) selectedCode = focusCode;
    renderRows();
  }

  bootstrap();
})();
