(function () {
  const errorEl = document.getElementById("login-error");
  const configErrorEl = document.getElementById("config-error");
  const loginForms = Array.from(document.querySelectorAll("[data-login-role]"));
  const loginTabs = Array.from(document.querySelectorAll("[data-login-tab]"));
  const loginPanels = Array.from(document.querySelectorAll("[role='tabpanel'][id$='login-panel']"));

  function setError(message) {
    if (!errorEl) return;
    errorEl.hidden = !message;
    errorEl.textContent = message || "";
  }

  function switchRole(role) {
    loginTabs.forEach((tab) => {
      const active = tab.dataset.loginTab === role;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    loginPanels.forEach((panel) => {
      panel.hidden = !panel.id.startsWith(role);
    });
  }

  if (!window.AdminAuth?.isConfigured?.()) {
    if (configErrorEl) configErrorEl.hidden = false;
  }

  loginTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchRole(tab.dataset.loginTab));
  });

  loginForms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setError("");
      const role = form.dataset.loginRole || "manager";
      const identifier = form.querySelector('[data-login-field="identifier"]')?.value || "";
      const password = form.querySelector('[data-login-field="password"]')?.value || "";
      try {
        await window.AdminAuth.signInAdmin(identifier, password, role);
        window.AdminAuth.redirectToRoleHome(role);
      } catch (error) {
        setError(error?.message || "ログインできませんでした。");
      }
    });
  });

  switchRole("staff");
})();
