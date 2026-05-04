(function () {
  function getConfig() {
    return window.SUPABASE_CONFIG || {};
  }

  function isSupabaseConfigured() {
    const config = getConfig();
    return Boolean(
      config.url &&
      config.anonKey &&
      !config.url.includes("your-project-ref") &&
      !config.anonKey.includes("YOUR_SUPABASE_ANON_KEY")
    );
  }

  function getSupabaseClient() {
    if (!isSupabaseConfigured()) return null;
    if (window.supabaseClient) return window.supabaseClient;
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
    const config = getConfig();
    window.supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return window.supabaseClient;
  }

  function getSupabaseGuestClient() {
    if (!isSupabaseConfigured()) return null;
    if (window.supabaseGuestClient) return window.supabaseGuestClient;
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
    const config = getConfig();
    window.supabaseGuestClient = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: "fragrance-guest-reservation-auth"
      }
    });
    return window.supabaseGuestClient;
  }

  window.getSupabaseClient = getSupabaseClient;
  window.getSupabaseGuestClient = getSupabaseGuestClient;
  window.isSupabaseConfigured = isSupabaseConfigured;
})();
