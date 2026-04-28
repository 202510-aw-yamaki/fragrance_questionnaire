(function () {
  function getPortalRootPrefix() {
    const path = String(window.location.pathname || "").replace(/\\/g, "/");
    return /\/(?:customer|staff|admin)\//.test(path) ? "../" : "";
  }

  const ROOT_PREFIX = getPortalRootPrefix();
  const LOGIN_PAGE = `${ROOT_PREFIX}admin-login.html`;
  const ROLE_STORAGE_KEY = "fragrancePortalRole";
  const LOGIN_INDEX_STORAGE_KEY = "fragrancePortalLoginIndex";
  const AUTH_DOMAIN_BY_ROLE = {
    staff: "staff.portal.fragrance.local",
    manager: "manager.portal.fragrance.local"
  };
  const HOME_BY_ROLE = {
    staff: `${ROOT_PREFIX}staff/staff-dashboard.html`,
    manager: `${ROOT_PREFIX}admin/admin-dashboard.html`
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
    const client = window.getSupabaseClient?.();
    const session = await getSession();
    if (!session) {
      window.location.replace(LOGIN_PAGE);
      return null;
    }
    const requiredRole = getRequiredRoleFromPath();
    const actualRole = getSessionPortalRole(session);
    if (requiredRole && !isRoleAllowedForPortal(actualRole, requiredRole)) {
      await client?.auth.signOut();
      window.localStorage.removeItem(ROLE_STORAGE_KEY);
      window.location.replace(LOGIN_PAGE);
      return null;
    }
    return session;
  }

  function normalizePortalLoginId(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizePortalRole(value) {
    const role = String(value || "").trim().toLowerCase();
    if (role === "admin" || role === "manager") return "manager";
    if (role === "staff") return "staff";
    if (role === "customer" || role === "member") return "customer";
    return null;
  }

  function getSessionPortalRole(session) {
    const appRole = normalizePortalRole(session?.user?.app_metadata?.portal_role || session?.user?.app_metadata?.role);
    if (appRole) return appRole;
    return normalizePortalRole(session?.user?.user_metadata?.portal_role || session?.user?.user_metadata?.role);
  }

  function isRoleAllowedForPortal(actualRole, requestedRole) {
    const actual = normalizePortalRole(actualRole);
    const requested = normalizePortalRole(requestedRole);
    if (!requested) return true;
    if (!actual) return false;
    return actual === requested;
  }

  function getRequiredRoleFromPath() {
    const path = String(window.location.pathname || "").replace(/\\/g, "/");
    if (/\/admin\//.test(path)) return "manager";
    if (/\/staff\//.test(path)) return "staff";
    return null;
  }

  function readPortalLoginIndex() {
    try {
      const raw = window.localStorage.getItem(LOGIN_INDEX_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function hasPortalLoginId(identifier, role) {
    const raw = String(identifier || "").trim();
    if (!raw || raw.includes("@")) return true;
    const registry = readPortalLoginIndex();
    const pool = registry?.[role === "staff" ? "staff" : "manager"];
    if (!Array.isArray(pool) || !pool.length) return true;
    return pool.includes(normalizePortalLoginId(raw));
  }

  function buildPortalAuthEmail(identifier, role) {
    const raw = String(identifier || "").trim();
    if (!raw) return "";
    if (raw.includes("@")) return raw;
    const loginId = normalizePortalLoginId(raw);
    const domain = AUTH_DOMAIN_BY_ROLE[role === "staff" ? "staff" : "manager"];
    return loginId ? `${loginId}@${domain}` : "";
  }

  async function signInAdmin(identifier, password, role = "manager") {
    const client = window.getSupabaseClient?.();
    if (!client) throw new Error("Supabase is not configured.");
    if (!hasPortalLoginId(identifier, role)) {
      throw new Error(role === "staff" ? "登録済みのスタッフIDを入力してください。" : "登録済みの管理者IDを入力してください。");
    }
    const email = buildPortalAuthEmail(identifier, role);
    if (!email) throw new Error("ログインIDを入力してください。");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const actualRole = getSessionPortalRole(data?.session);
    if (!isRoleAllowedForPortal(actualRole, role)) {
      await client.auth.signOut();
      throw new Error("選択したポータルに許可されたアカウントではありません。Supabase Auth の role 設定を確認してください。");
    }
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
    const sessionRole = getSessionPortalRole(session);
    if (sessionRole === "staff" || sessionRole === "manager") return sessionRole;
    if (preferredRole === "staff" || preferredRole === "manager") return preferredRole;
    const locationRole = readRoleFromLocation();
    if (locationRole) return locationRole;
    return readStoredRole() || "manager";
  }

  function appendRoleToHref(href, role) {
    const url = new URL(href, window.location.href);
    if (role === "staff" || role === "manager") {
      url.searchParams.set("role", role);
    }
    return url.toString();
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

  async function getStaffProfile(session = null) {
    const client = window.getSupabaseClient?.();
    const userId = session?.user?.id;
    if (!client || !userId) return null;
    const { data, error } = await client
      .from("staff_profiles")
      .select("id, staff_name, display_name, role, is_active")
      .eq("auth_user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) {
      console.error("Failed to load staff profile.", error);
      return null;
    }
    return data || null;
  }

  function getHeaderLinks(role) {
    if (role === "staff") {
      return [
        ["staff-dashboard.html", "\u4e88\u5b9a\u78ba\u8a8d", "staff-dashboard"],
        ["staff-slots.html", "\u4e88\u7d04\u67a0\u4f5c\u6210", "slots"],
        ["staff-reservations.html", "\u4e88\u7d04\u60c5\u5831\u4e00\u89a7", "reservations"]
      ];
    }

    return [
      ["admin-dashboard.html", "Dashboard", "dashboard"],
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
    const optionLinks = normalizeHeaderLinks(options.links);
    const links = (role === "staff"
      ? getHeaderLinks(role).map(([href, label, key]) => ({ href, label, key }))
      : (optionLinks || getHeaderLinks(role).map(([href, label, key]) => ({ href, label, key }))))
      .filter(({ key }) => role !== "staff" || key !== activePage);
    const brandHref = appendRoleToHref(role === "staff" ? HOME_BY_ROLE.staff : HOME_BY_ROLE.manager, role);
    const brandName = options.brandText || (role === "staff"
      ? `Fragrance STAFF_${getStaffDisplayName(session)}`
      : `Fragrance STAFF_${getStaffDisplayName(session)}`);
    const roleLabel = options.roleLabel || (role === "staff" ? "\u30b9\u30bf\u30c3\u30d5\u5c02\u7528" : "\u7ba1\u7406\u8005");
    const navId = "admin-nav-menu";
    const showMenuToggle = role === "staff" && links.length > 0;
    mount.innerHTML = `
      <div class="admin-header-inner site-container ${role === "staff" ? "admin-header-inner--staff" : "admin-header-inner--manager"}">
        <a class="admin-brand" href="${brandHref}">
          <span>${brandName}</span>
          <small class="admin-brand-meta">${roleLabel}</small>
        </a>
        <div class="admin-header-actions ${role === "staff" ? "admin-header-actions--staff" : ""}">
          ${showMenuToggle ? `
            <button
              class="admin-menu-toggle"
              id="admin-menu-toggle"
              type="button"
              aria-expanded="false"
              aria-controls="${navId}"
              aria-label="\u30e1\u30cb\u30e5\u30fc\u3092\u958b\u304f"
            >
              <span></span><span></span><span></span>
            </button>
          ` : ""}
          <nav class="admin-nav ${role === "staff" ? "admin-nav--staff" : ""}" id="${navId}" aria-label="\u7ba1\u7406\u30e1\u30cb\u30e5\u30fc">
            ${links.map(({ href, label, key }) => `<a class="${activePage === key ? "active" : ""}" href="${appendRoleToHref(href, role)}">${label}</a>`).join("")}
          </nav>
          <button class="admin-logout ${role === "staff" ? "admin-logout--staff" : ""}" id="admin-logout-btn" type="button">\u30ed\u30b0\u30a2\u30a6\u30c8</button>
        </div>
      </div>
    `;
    const logoutButton = document.getElementById("admin-logout-btn");
    if (logoutButton) logoutButton.addEventListener("click", signOutAdmin);
    const menuToggle = document.getElementById("admin-menu-toggle");
    const navMenu = document.getElementById(navId);
    if (menuToggle && navMenu) {
      const closeMenu = () => {
        navMenu.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      };
      menuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        const nextState = !navMenu.classList.contains("is-open");
        navMenu.classList.toggle("is-open", nextState);
        menuToggle.setAttribute("aria-expanded", nextState ? "true" : "false");
      });
      document.addEventListener("click", (event) => {
        if (!(event.target instanceof Node)) return;
        if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
          closeMenu();
        }
      });
      navMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
      });
    }
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
    normalizePortalLoginId,
    normalizePortalRole,
    getSessionPortalRole,
    readPortalLoginIndex,
    buildPortalAuthEmail,
    readStoredRole,
    persistPortalRole,
    readRoleFromLocation,
    resolvePortalRole,
    getStaffDisplayName,
    getStaffProfile,
    appendRoleToHref,
    getHomePathByRole,
    redirectToRoleHome,
    renderAdminHeader
  };
})();
