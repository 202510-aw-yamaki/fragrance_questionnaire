(function () {
  const DEFAULT_INTERVAL = 120;
  const DEFAULT_CAPACITY = 6;
  const form = document.getElementById("slot-bulk-form");
  const statusEl = document.getElementById("slot-bulk-status-note");
  const previewRangeEl = document.getElementById("slot-bulk-preview-range");
  const duplicatePreviewEl = document.getElementById("slot-bulk-duplicate-preview");
  const modal = document.getElementById("slot-bulk-modal");
  const openButton = document.getElementById("slot-bulk-open");
  const closeButton = document.getElementById("slot-bulk-close");

  if (!form || !statusEl) return;

  function getSelectedRole() {
    return window.AdminAuth.readRoleFromLocation() || window.AdminAuth.readStoredRole() || "manager";
  }

  function getDefaultInstructorName() {
    return getSelectedRole() === "staff"
      ? (window.AdminAuth.getStaffDisplayName(window.__adminSession || null) || "")
      : "";
  }

  function getResolvedInstructorName() {
    const sharedInstructor = document.getElementById("slot-instructor")?.value.trim() || "";
    const bulkInstructorEl = document.getElementById("slot-bulk-instructor");
    const bulkInstructor = bulkInstructorEl?.value.trim() || "";
    const resolved = sharedInstructor || bulkInstructor || getDefaultInstructorName() || "";
    if (bulkInstructorEl && resolved) {
      bulkInstructorEl.value = resolved;
    }
    return resolved;
  }

  function setStatus(message, kind = "note") {
    statusEl.textContent = message;
    statusEl.hidden = !message;
    statusEl.className = kind === "error" ? "admin-error" : kind === "success" ? "admin-note admin-note-success" : "admin-note";
  }

  function openBulkModal() {
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("portal-modal-open");
    openButton?.setAttribute("aria-expanded", "true");
    setStatus("");
    updatePreview();
    document.getElementById("slot-bulk-start-date")?.focus();
  }

  function closeBulkModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("portal-modal-open");
    openButton?.setAttribute("aria-expanded", "false");
    openButton?.focus();
  }

  function parseMinutes(timeText) {
    const [hours, minutes] = String(timeText || "0:0").split(":").map((value) => Number(value || 0));
    return (hours * 60) + minutes;
  }

  function formatTime(totalMinutes) {
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const minutes = String(totalMinutes % 60).padStart(2, "0");
    return `${hours}:${minutes}:00`;
  }

  function formatLabelTime(totalMinutes) {
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const minutes = String(totalMinutes % 60).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  function buildSlotRangeLabel(startMinutes, intervalMinutes) {
    const endMinutes = startMinutes + Number(intervalMinutes || DEFAULT_INTERVAL);
    return `${formatLabelTime(startMinutes)}～${formatLabelTime(endMinutes)}`;
  }

  function formatDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function getSelectedWeekdays() {
    return Array.from(document.querySelectorAll('input[name="slot-bulk-weekday"]:checked')).map((input) => Number(input.value));
  }

  function formatMonthDay(dateKey) {
    const [, month, day] = String(dateKey || "").split("-");
    return `${month}/${day}`;
  }

  function normalizeName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getSlotWindow(row, fallbackInterval = DEFAULT_INTERVAL) {
    const startMinutes = parseMinutes(String(row.slot_time || "").slice(0, 5));
    const rangeMatch = String(row.slot_label || "").match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
    const endMinutes = rangeMatch
      ? parseMinutes(rangeMatch[2])
      : startMinutes + Number(fallbackInterval || DEFAULT_INTERVAL);
    return { startMinutes, endMinutes };
  }

  function isOverlapping(startA, endA, startB, endB) {
    return startA < endB && startB < endA;
  }

  function buildConflictMessage(dateKey, existingWindow, targetWindow) {
    const existingRange = `${formatLabelTime(existingWindow.startMinutes)}～${formatLabelTime(existingWindow.endMinutes)}`;
    const targetRange = `${formatLabelTime(targetWindow.startMinutes)}～${formatLabelTime(targetWindow.endMinutes)}`;
    return `${formatMonthDay(dateKey)}　${existingRange} の時間帯に登録があるため、${formatMonthDay(dateKey)}　${targetRange} は時間帯が重複します。`;
  }

  function buildPayloads() {
    const startDate = document.getElementById("slot-bulk-start-date").value;
    const endDate = document.getElementById("slot-bulk-end-date").value;
    const startTime = document.getElementById("slot-bulk-start-time").value;
    const interval = Number(document.getElementById("slot-bulk-interval").value || DEFAULT_INTERVAL);
    const capacity = Number(document.getElementById("slot-bulk-capacity").value || DEFAULT_CAPACITY);
    const instructor = getResolvedInstructorName() || null;
    const status = document.getElementById("slot-bulk-status").value;
    const label = document.getElementById("slot-bulk-label").value.trim();
    const prefix = document.getElementById("slot-bulk-prefix").value.trim() || "SHIFT";
    const sortStart = Number(document.getElementById("slot-bulk-sort-start").value || 0);
    const weekdays = getSelectedWeekdays();

    if (!startDate || !endDate || !startTime || !label) {
      throw new Error("\u958b\u59cb\u65e5\u30fb\u7d42\u4e86\u65e5\u30fb\u958b\u59cb\u6642\u523b\u306f\u5fc5\u9808\u3067\u3059\u3002");
    }
    if (!weekdays.length) {
      throw new Error("\u4f5c\u6210\u66dc\u65e5\u30921\u3064\u4ee5\u4e0a\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
    }
    if (interval < 15) {
      throw new Error("\u67a0\u9593\u9694\u306f15\u5206\u4ee5\u4e0a\u3067\u6307\u5b9a\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
    }

    const startMinutes = parseMinutes(startTime);
    const payloads = [];
    let sortOrder = sortStart;
    const cursor = new Date(`${startDate}T00:00:00`);
    const lastDate = new Date(`${endDate}T00:00:00`);
    const timestamp = new Date().toISOString();
    const timeKey = formatLabelTime(startMinutes);
    const rangeLabel = buildSlotRangeLabel(startMinutes, interval);

    while (cursor <= lastDate) {
      if (weekdays.includes(cursor.getDay())) {
        const dateKey = formatDateKey(cursor);
        const payload = {
          slot_code: `${prefix}-${dateKey.replace(/-/g, "")}-${timeKey.replace(":", "")}`,
          slot_date: dateKey,
          slot_time: formatTime(startMinutes),
          slot_label: `${label} ${rangeLabel}`,
          instructor_name: instructor,
          status,
          capacity,
          sort_order: sortOrder,
          is_active: true,
          updated_at: timestamp
        };
        if (window.__staffProfile?.id) {
          payload.staff_profile_id = window.__staffProfile.id;
        }
        payloads.push(payload);
        sortOrder += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (!payloads.length) {
      throw new Error("\u6761\u4ef6\u306b\u5408\u3046\u4e88\u7d04\u67a0\u304c\u751f\u6210\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u65e5\u4ed8\u7bc4\u56f2\u3068\u66dc\u65e5\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
    }

    return payloads;
  }

  function updatePreview() {
    if (!previewRangeEl) return;
    try {
      const payloads = buildPayloads();
      const first = payloads[0];
      const last = payloads[payloads.length - 1];
      previewRangeEl.textContent = `${formatMonthDay(first.slot_date)} ${String(first.slot_time || "").slice(0, 5)} から ${formatMonthDay(last.slot_date)} ${String(last.slot_time || "").slice(0, 5)} までを対象にします。`;
    } catch (error) {
      previewRangeEl.textContent = error?.message || "開始日と終了日を指定すると表示されます。";
    }
  }

  function formatSelectedWeekdayLabels() {
    const labels = ["\u65e5", "\u6708", "\u706b", "\u6c34", "\u6728", "\u91d1", "\u571f"];
    return getSelectedWeekdays().map((day) => labels[day]).join("\u30fb") || "-";
  }

  function buildBulkConfirmMessage(payloads, conflictMessages) {
    const first = payloads[0];
    const last = payloads[payloads.length - 1];
    const interval = document.getElementById("slot-bulk-interval").value || DEFAULT_INTERVAL;
    const capacity = document.getElementById("slot-bulk-capacity").value || DEFAULT_CAPACITY;
    const lines = [
      "\u4ee5\u4e0b\u306e\u5185\u5bb9\u3067\u4e88\u7d04\u67a0\u3092\u307e\u3068\u3081\u3066\u4f5c\u6210\u3057\u307e\u3059\u3002",
      "",
      `\u4ef6\u6570: ${payloads.length}\u4ef6`,
      `\u671f\u9593: ${formatMonthDay(first.slot_date)} \uff5e ${formatMonthDay(last.slot_date)}`,
      `\u66dc\u65e5: ${formatSelectedWeekdayLabels()}`,
      `\u958b\u59cb\u6642\u523b: ${String(first.slot_time || "").slice(0, 5)}`,
      `\u67a0\u9593\u9694: ${interval}\u5206`,
      `\u5b9a\u54e1: ${capacity}\u540d`
    ];
    if (conflictMessages.length) {
      lines.push("", "\u91cd\u8907\u5019\u88dc\u304c\u3042\u308a\u307e\u3059\u3002", ...conflictMessages);
    }
    lines.push("", "\u5185\u5bb9\u306f\u6b63\u3057\u3044\u3067\u3059\u304b\uff1f");
    return lines.join("\n");
  }

  async function findConflictingSlots(payloads) {
    if (!payloads.length) return [];
    const first = payloads[0];
    const last = payloads[payloads.length - 1];
    const instructor = String(first.instructor_name || "").trim();
    const existing = await window.AdminData.listRows("reservation_slots", {
      filters: [
        { operator: "gte", column: "slot_date", value: first.slot_date },
        { operator: "lte", column: "slot_date", value: last.slot_date }
      ]
    }).catch(() => []);
    const conflicts = new Map();

    existing.forEach((row) => {
      if (row.is_active === false) return;
      if (instructor && normalizeName(row.instructor_name) !== normalizeName(instructor)) return;
      payloads.forEach((payload) => {
        if (payload.slot_date !== row.slot_date) return;
        const payloadWindow = getSlotWindow(payload, DEFAULT_INTERVAL);
        const existingWindow = getSlotWindow(row, DEFAULT_INTERVAL);
        if (!isOverlapping(payloadWindow.startMinutes, payloadWindow.endMinutes, existingWindow.startMinutes, existingWindow.endMinutes)) return;
        const key = `${payload.slot_date}-${payload.slot_time}`;
        if (!conflicts.has(key)) {
          conflicts.set(key, buildConflictMessage(payload.slot_date, existingWindow, payloadWindow));
        }
      });
    });

    return Array.from(conflicts.values());
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payloads = buildPayloads();
      const conflictMessages = await findConflictingSlots(payloads);
      if (duplicatePreviewEl) {
        duplicatePreviewEl.textContent = conflictMessages.length
          ? conflictMessages.join(" / ")
          : "重複枠は見つかっていません。";
      }
      if (!window.confirm(buildBulkConfirmMessage(payloads, conflictMessages))) {
        setStatus("\u307e\u3068\u3081\u3066\u4f5c\u6210\u3092\u4e2d\u6b62\u3057\u307e\u3057\u305f\u3002", "note");
        return;
      }
      await window.AdminData.upsertRow("reservation_slots", payloads, "slot_code");
      setStatus(`${payloads.length}\u4ef6\u306e\u4e88\u7d04\u67a0\u3092\u4f5c\u6210 / \u66f4\u65b0\u3057\u307e\u3057\u305f\u3002\u30da\u30fc\u30b8\u3092\u518d\u8aad\u307f\u8fbc\u307f\u3057\u307e\u3059\u3002`, "success");
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      setStatus(error?.message || "\u4e88\u7d04\u67a0\u306e\u4e00\u62ec\u4f5c\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002", "error");
    }
  });

  [
    "slot-bulk-start-date",
    "slot-bulk-end-date",
    "slot-bulk-start-time",
    "slot-bulk-interval",
    "slot-bulk-capacity",
    "slot-bulk-instructor",
    "slot-bulk-status",
    "slot-bulk-label",
    "slot-bulk-prefix",
    "slot-bulk-sort-start"
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updatePreview);
    document.getElementById(id)?.addEventListener("change", updatePreview);
  });
  document.querySelectorAll('input[name="slot-bulk-weekday"]').forEach((input) => {
    input.addEventListener("change", updatePreview);
  });

  openButton?.addEventListener("click", openBulkModal);
  closeButton?.addEventListener("click", closeBulkModal);
  modal?.querySelector("[data-close-bulk-modal]")?.addEventListener("click", closeBulkModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal && !modal.hidden) {
      closeBulkModal();
    }
  });

  const bulkInstructorEl = document.getElementById("slot-bulk-instructor");
  if (bulkInstructorEl && !bulkInstructorEl.value) {
    bulkInstructorEl.value = getResolvedInstructorName();
  }
  updatePreview();
})();
