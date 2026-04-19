(function () {
  const LOGIN_PAGE = "admin-login.html";
  const ROLE_STORAGE_KEY = "fragrancePortalRole";
  const HOME_BY_ROLE = {
    staff: "staff-dashboard.html",
    manager: "admin-dashboard.html"
  };

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
    window.localStorage.removeItem(ROLE_STORAGE_KEY);
    window.location.replace(LOGIN_PAGE);
  }

  function readStoredRole() {
    const value = window.localStorage.getItem(ROLE_STORAGE_KEY);
    return value === "staff" || value === "manager" ? value : null;
  }

  function persistPortalRole(role) {
    if (role === "staff" || role === "manager") {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    }
  }

  function readRoleFromLocation() {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role");
    return role === "staff" || role === "manager" ? role : null;
  }

  function resolvePortalRole(session, preferredRole) {
    if (preferredRole === "staff" || preferredRole === "manager") return preferredRole;
    const locationRole = readRoleFromLocation();
    if (locationRole) return locationRole;
    const appRole = session?.user?.app_metadata?.portal_role || session?.user?.app_metadata?.role;
    if (appRole === "staff" || appRole === "manager") return appRole;
    const userRole = session?.user?.user_metadata?.portal_role || session?.user?.user_metadata?.role;
    if (userRole === "staff" || userRole === "manager") return userRole;
    return readStoredRole() || "manager";
  }

  function appendRoleToHref(href, role) {
    const url = new URL(href, window.location.href);
    if (role === "staff" || role === "manager") {
      url.searchParams.set("role", role);
    }
    return `${url.pathname.split("/").pop()}${url.search}${url.hash}`;
  }

  function getStaffDisplayName(session) {
    const metadata = session?.user?.user_metadata || {};
    const candidates = [
      metadata.staff_name,
      metadata.display_name,
      metadata.full_name,
      metadata.name
    ];
    const resolved = candidates.find((value) => String(value || "").trim());
    if (resolved) return String(resolved).trim();
    const email = session?.user?.email || "";
    return email.includes("@") ? email.split("@")[0] : "staff";
  }

  function getHeaderLinks(role) {
    if (role === "staff") {
      return [
        ["staff-dashboard.html", "\u30b9\u30bf\u30c3\u30d5\u78ba\u8a8d", "staff-dashboard"],
        ["admin-slots.html", "\u4e88\u7d04\u67a0\u4f5c\u6210", "slots"],
        ["admin-reservations.html", "\u4e88\u7d04\u60c5\u5831\u4e00\u89a7", "reservations"],
        ["admin-workspace.html", "\u4e88\u7d04\u9867\u5ba2\u60c5\u5831\u8a73\u7d30", "workspace"]
      ];
    }

    return [
      ["admin-dashboard.html", "Dashboard", "dashboard"],
      ["admin-workspace.html", "\u63a5\u5ba2\u5c0e\u7dda", "workspace"],
      ["admin-reservations.html", "\u4e88\u7d04\u60c5\u5831", "reservations"],
      ["admin-slots.html", "\u4e88\u7d04\u67a0", "slots"],
      ["admin-scoring.html", "\u914d\u70b9\u30ed\u30b8\u30c3\u30af", "scoring"],
      ["admin-materials.html", "\u539f\u6599\u30dd\u30a4\u30f3\u30c8", "materials"],
      ["admin-settings.html", "\u305d\u306e\u4ed6\u8a2d\u5b9a", "settings"]
    ];
  }

  function normalizeHeaderLinks(links) {
    if (!Array.isArray(links) || !links.length) return null;
    return links.map((entry) => {
      if (Array.isArray(entry)) {
        const [href, label, key] = entry;
        return { href, label, key };
      }
      return {
        href: entry.href,
        label: entry.label,
        key: entry.key || entry.href
      };
    }).filter((entry) => entry.href && entry.label);
  }

  function renderAdminHeader(activePage, options = {}) {
    const mount = document.getElementById("admin-header");
    if (!mount) return;
    const role = options.role === "staff" || options.role === "manager" ? options.role : readRoleFromLocation() || readStoredRole() || "manager";
    const session = options.session || null;
    const links = normalizeHeaderLinks(options.links) || getHeaderLinks(role).map(([href, label, key]) => ({ href, label, key }));
    const brandHref = appendRoleToHref(role === "staff" ? HOME_BY_ROLE.staff : HOME_BY_ROLE.manager, role);
    const brandName = options.brandText || (role === "staff"
      ? `Fragrance STAFF_${getStaffDisplayName(session)}`
      : `Fragrance STAFF_${getStaffDisplayName(session)}`);
    const roleLabel = options.roleLabel || (role === "staff" ? "\u30b9\u30bf\u30c3\u30d5\u5c02\u7528" : "\u7ba1\u7406\u8005");
    mount.innerHTML = `
      <div class="admin-header-inner site-container">
        <a class="admin-brand" href="${brandHref}">
          <span>${brandName}</span>
          <small class="admin-brand-meta">${roleLabel}</small>
        </a>
        <nav class="admin-nav" aria-label="\u7ba1\u7406\u30e1\u30cb\u30e5\u30fc">
          ${links.map(({ href, label, key }) => `<a class="${activePage === key ? "active" : ""}" href="${appendRoleToHref(href, role)}">${label}</a>`).join("")}
        </nav>
        <button class="admin-logout" id="admin-logout-btn" type="button">\u30ed\u30b0\u30a2\u30a6\u30c8</button>
      </div>
    `;
    const logoutButton = document.getElementById("admin-logout-btn");
    if (logoutButton) logoutButton.addEventListener("click", signOutAdmin);
  }

  function getHomePathByRole(role) {
    return HOME_BY_ROLE[role] || HOME_BY_ROLE.manager;
  }

  function redirectToRoleHome(role) {
    const resolvedRole = role === "staff" || role === "manager" ? role : "manager";
    persistPortalRole(resolvedRole);
    window.location.replace(appendRoleToHref(getHomePathByRole(resolvedRole), resolvedRole));
  }

  window.AdminAuth = {
    isConfigured,
    getSession,
    requireAdminSession,
    signInAdmin,
    signOutAdmin,
    readStoredRole,
    persistPortalRole,
    readRoleFromLocation,
    resolvePortalRole,
    getStaffDisplayName,
    appendRoleToHref,
    getHomePathByRole,
    redirectToRoleHome,
    renderAdminHeader
  };
})();
