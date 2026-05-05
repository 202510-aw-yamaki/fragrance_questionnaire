import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUTH_DOMAIN_BY_PORTAL = {
  staff: "staff.portal.fragrance.local",
  manager: "manager.portal.fragrance.local"
} as const;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function normalizeLoginId(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizeRole(value: unknown) {
  const role = String(value || "").trim().toLowerCase();
  if (role === "admin" || role === "manager") return "manager";
  if (role === "staff") return "staff";
  return "";
}

function buildPortalAuthEmail(loginId: string, loginPortal: string) {
  if (loginId.includes("@")) return loginId;
  const domain = AUTH_DOMAIN_BY_PORTAL[loginPortal === "staff" ? "staff" : "manager"];
  return loginId ? `${loginId}@${domain}` : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Function environment is not configured." }, 500);
  }

  const authorization = req.headers.get("Authorization") || "";
  const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) {
    return jsonResponse({ error: "Authorization header is required." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: requesterData, error: requesterError } = await adminClient.auth.getUser(accessToken);
  if (requesterError || !requesterData?.user) {
    return jsonResponse({ error: "Invalid requester session." }, 401);
  }
  const requesterRole = normalizeRole(
    requesterData.user.app_metadata?.portal_role || requesterData.user.app_metadata?.role
  );
  if (requesterRole !== "manager") {
    return jsonResponse({ error: "Manager role is required." }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const profileId = String(body.profileId || "").trim();
  const loginId = normalizeLoginId(body.loginId);
  const loginPortal = body.loginPortal === "staff" ? "staff" : "manager";
  const portalRole = normalizeRole(body.portalRole);
  const password = String(body.password || "");
  const displayName = String(body.displayName || "").trim();
  const linkProfile = body.linkProfile === true;
  const email = buildPortalAuthEmail(loginId, loginPortal);

  if (!profileId || !loginId || !email || !portalRole || password.length < 6) {
    return jsonResponse({ error: "Invalid portal auth payload." }, 400);
  }

  const authPayload = {
    email,
    password,
    email_confirm: true,
    app_metadata: {
      portal_role: portalRole,
      role: portalRole
    },
    user_metadata: {
      staff_name: displayName,
      display_name: displayName,
      login_id: loginId,
      login_portal: loginPortal
    }
  };

  const { data: listedUsers, error: listError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });
  if (listError) {
    return jsonResponse({ error: listError.message }, 500);
  }
  const existingUser = listedUsers.users.find((user) => user.email?.toLowerCase() === email);
  const authResult = existingUser
    ? await adminClient.auth.admin.updateUserById(existingUser.id, authPayload)
    : await adminClient.auth.admin.createUser(authPayload);

  if (authResult.error || !authResult.data?.user) {
    return jsonResponse({ error: authResult.error?.message || "Failed to save auth user." }, 500);
  }

  if (linkProfile) {
    const { error: profileError } = await adminClient
      .from("staff_profiles")
      .update({
        auth_user_id: authResult.data.user.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", profileId);
    if (profileError) {
      return jsonResponse({ error: profileError.message }, 500);
    }
  }

  return jsonResponse({
    authUserId: authResult.data.user.id,
    email,
    loginPortal,
    portalRole,
    linkedProfile: linkProfile
  });
});
