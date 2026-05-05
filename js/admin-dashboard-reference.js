(function () {
  const artboard = document.getElementById("admin-dashboard-artboard");

  function fitDashboardArtboard() {
    if (!artboard) return;
    const scale = Math.min(window.innerWidth / 1920, 1);
    const roundedScale = Math.max(0.32, Math.min(1, scale));
    document.documentElement.style.setProperty("--dashboard-artboard-scale", String(roundedScale));
    document.documentElement.style.setProperty("--dashboard-artboard-inverse-scale", String(1 / roundedScale));
    document.documentElement.style.setProperty("--dashboard-modal-width", `${window.innerWidth / roundedScale}px`);
    document.documentElement.style.setProperty("--dashboard-modal-height", `${window.innerHeight / roundedScale}px`);
    document.body.style.minHeight = `${Math.max(window.innerHeight, Math.ceil(artboard.scrollHeight * roundedScale))}px`;
  }

  fitDashboardArtboard();
  window.addEventListener("resize", fitDashboardArtboard);
  if (window.ResizeObserver) {
    new ResizeObserver(fitDashboardArtboard).observe(artboard);
  }

  const modal = document.getElementById("admin-qr-modal");
  const trigger = document.getElementById("admin-qr-notification-trigger");
  if (!modal || !trigger) return;

  function setOpen(isOpen) {
    modal.hidden = !isOpen;
    document.body.classList.toggle("admin-qr-modal-open", isOpen);
    if (isOpen) {
      const closeButton = modal.querySelector("[data-admin-qr-modal-close]");
      closeButton?.focus?.();
    }
  }

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    setOpen(true);
  });

  modal.querySelectorAll("[data-admin-qr-modal-close]").forEach((button) => {
    button.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) setOpen(false);
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get("modal") === "qr" || window.location.hash === "#qr-modal") {
    setOpen(true);
  }
}());
