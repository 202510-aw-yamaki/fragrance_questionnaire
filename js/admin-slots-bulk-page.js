(function () {
  const form = document.getElementById("slot-bulk-form");
  const statusEl = document.getElementById("slot-bulk-status-note");

  if (!form || !statusEl) return;

  function setStatus(message, kind = "note") {
    statusEl.textContent = message;
    statusEl.className = kind === "error" ? "admin-error" : kind === "success" ? "admin-note admin-note-success" : "admin-note";
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

  function buildPayloads() {
    const startDate = document.getElementById("slot-bulk-start-date").value;
    const endDate = document.getElementById("slot-bulk-end-date").value;
    const startTime = document.getElementById("slot-bulk-start-time").value;
    const endTime = document.getElementById("slot-bulk-end-time").value;
    const interval = Number(document.getElementById("slot-bulk-interval").value || 0);
    const capacity = Number(document.getElementById("slot-bulk-capacity").value || 1);
    const instructor = document.getElementById("slot-bulk-instructor").value.trim() || null;
    const status = document.getElementById("slot-bulk-status").value;
    const label = document.getElementById("slot-bulk-label").value.trim();
    const prefix = document.getElementById("slot-bulk-prefix").value.trim() || "SHIFT";
    const sortStart = Number(document.getElementById("slot-bulk-sort-start").value || 0);
    const weekdays = getSelectedWeekdays();

    if (!startDate || !endDate || !startTime || !endTime || !label) {
      throw new Error("\u958b\u59cb\u65e5\u30fb\u7d42\u4e86\u65e5\u30fb\u958b\u59cb\u6642\u523b\u30fb\u7d42\u4e86\u6642\u523b\u30fb\u30b7\u30d5\u30c8\u540d\u306f\u5fc5\u9808\u3067\u3059\u3002");
    }
    if (!weekdays.length) {
      throw new Error("\u4f5c\u6210\u66dc\u65e5\u30921\u3064\u4ee5\u4e0a\u9078\u629e\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
    }
    if (interval < 15) {
      throw new Error("\u67a0\u9593\u9694\u306f15\u5206\u4ee5\u4e0a\u3067\u6307\u5b9a\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
    }

    const startMinutes = parseMinutes(startTime);
    const endMinutes = parseMinutes(endTime);
    if (endMinutes <= startMinutes) {
      throw new Error("\u7d42\u4e86\u6642\u523b\u306f\u958b\u59cb\u6642\u523b\u3088\u308a\u5f8c\u306b\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
    }

    const payloads = [];
    let sortOrder = sortStart;
    const cursor = new Date(`${startDate}T00:00:00`);
    const lastDate = new Date(`${endDate}T00:00:00`);
    const timestamp = new Date().toISOString();

    while (cursor <= lastDate) {
      if (weekdays.includes(cursor.getDay())) {
        const dateKey = formatDateKey(cursor);
        for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
          const timeKey = formatLabelTime(minutes);
          payloads.push({
            slot_code: `${prefix}-${dateKey.replace(/-/g, "")}-${timeKey.replace(":", "")}`,
            slot_date: dateKey,
            slot_time: formatTime(minutes),
            slot_label: `${label} ${timeKey}`,
            instructor_name: instructor,
            status,
            capacity,
            sort_order: sortOrder,
            is_active: true,
            updated_at: timestamp
          });
          sortOrder += 1;
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (!payloads.length) {
      throw new Error("\u6761\u4ef6\u306b\u5408\u3046\u4e88\u7d04\u67a0\u304c\u751f\u6210\u3055\u308c\u307e\u305b\u3093\u3067\u3057\u305f\u3002\u65e5\u4ed8\u7bc4\u56f2\u3068\u66dc\u65e5\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002");
    }

    return payloads;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payloads = buildPayloads();
      await window.AdminData.upsertRow("reservation_slots", payloads, "slot_code");
      setStatus(`${payloads.length}\u4ef6\u306e\u4e88\u7d04\u67a0\u3092\u4f5c\u6210 / \u66f4\u65b0\u3057\u307e\u3057\u305f\u3002\u30da\u30fc\u30b8\u3092\u518d\u8aad\u307f\u8fbc\u307f\u3057\u307e\u3059\u3002`, "success");
      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      setStatus(error?.message || "\u4e88\u7d04\u67a0\u306e\u4e00\u62ec\u4f5c\u6210\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002", "error");
    }
  });
})();