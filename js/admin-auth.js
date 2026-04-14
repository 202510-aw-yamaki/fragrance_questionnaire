(function () {
  const LOGIN_PAGE = "admin-login.html";

  function isConfigured() {
    return Boolean(window.isSupabaseConfigured?.() && window.getSupabaseClient?.());
  }

  async function getSession() {
    const client = window.getSupabaseClient?.();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data?.session || null;
  }

  async function requireAdminSession() {
    if (!isConfigured()) return null;
    const session = await getSession();
    if (!session) {
      window.location.replace(LOGIN_PAGE);
      return null;
    }
    return session;
  }

  async function signInAdmin(email, password) {
    const client = window.getSupabaseClient?.();
    if (!client) throw new Error("Supabase is not configured.");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOutAdmin() {
    const client = window.getSupabaseClient?.();
    if (!client) return;
    await client.auth.signOut();
    window.location.replace(LOGIN_PAGE);
  }

  function renderAdminHeader(activePage) {
    const mount = document.getElementById("admin-header");
    if (!mount) return;
    const links = [
      ["admin-dashboard.html", "Dashboard", "dashboard"],
      ["admin-workspace.html", "\u63a5\u5ba2\u5c0e\u7dda", "workspace"],
      ["admin-reservations.html", "\u4e88\u7d04\u60c5\u5831", "reservations"],
      ["admin-slots.html", "\u4e88\u7d04\u67a0", "slots"],
      ["admin-scoring.html", "\u914d\u70b9\u30ed\u30b8\u30c3\u30af", "scoring"],
      ["admin-materials.html", "\u539f\u6599\u30dd\u30a4\u30f3\u30c8", "materials"],
      ["admin-settings.html", "\u305d\u306e\u4ed6\u8a2d\u5b9a", "settings"]
    ];
    mount.innerHTML = `
      <div class="admin-header-inner site-container">
        <a class="admin-brand" href="admin-dashboard.html">Fragrance Admin</a>
        <nav class="admin-nav" aria-label="\u7ba1\u7406\u30e1\u30cb\u30e5\u30fc">
          ${links.map(([href, label, key]) => `<a class="${activePage === key ? "active" : ""}" href="${href}">${label}</a>`).join("")}
        </nav>
        <button class="admin-logout" id="admin-logout-btn" type="button">\u30ed\u30b0\u30a2\u30a6\u30c8</button>
      </div>
    `;
    const logoutButton = document.getElementById("admin-logout-btn");
    if (logoutButton) logoutButton.addEventListener("click", signOutAdmin);
  }

  window.AdminAuth = {
    isConfigured,
    getSession,
    requireAdminSession,
    signInAdmin,
    signOutAdmin,
    renderAdminHeader
  };
})();