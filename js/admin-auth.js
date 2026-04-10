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
      ["admin-reservations.html", "予約情報", "reservations"],
      ["admin-slots.html", "予約枠", "slots"],
      ["admin-scoring.html", "配点ロジック", "scoring"],
      ["admin-materials.html", "原料ポイント", "materials"],
      ["admin-settings.html", "その他設定", "settings"]
    ];
    mount.innerHTML = `
      <div class="admin-header-inner site-container">
        <a class="admin-brand" href="admin-dashboard.html">Fragrance Admin</a>
        <nav class="admin-nav" aria-label="管理メニュー">
          ${links.map(([href, label, key]) => `<a class="${activePage === key ? "active" : ""}" href="${href}">${label}</a>`).join("")}
        </nav>
        <button class="admin-logout" id="admin-logout-btn" type="button">ログアウト</button>
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
