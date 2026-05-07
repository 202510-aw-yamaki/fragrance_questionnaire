const ROOT_URL = "https://csqlbewwrucwezkgpinh.supabase.co";
const PUBLIC_ANON_KEY = "sb_publishable_-8P54qFZNzeo-kIbppuNDg_p6nQkDIV";
const STAFF_DOMAIN = "staff.portal.fragrance.local";
const MANAGER_DOMAIN = "manager.portal.fragrance.local";

const credentialEnv = {
  staff: {
    identifiers: ["FRAGRANCE_STAFF_EMAIL", "FRAGRANCE_STAFF_ID"],
    password: "FRAGRANCE_STAFF_PASSWORD"
  },
  manager: {
    identifiers: ["FRAGRANCE_MANAGER_EMAIL", "FRAGRANCE_MANAGER_ID"],
    password: "FRAGRANCE_MANAGER_PASSWORD"
  }
};

function createRunId() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");
  return `CODX_QR_TEST_${stamp}`;
}

function portalEmail(identifier, role) {
  const raw = String(identifier || "").trim();
  if (!raw) return "";
  if (raw.includes("@")) return raw;
  return `${raw.toLowerCase()}@${role === "staff" ? STAFF_DOMAIN : MANAGER_DOMAIN}`;
}

function readFirstEnv(names) {
  return names.map((name) => process.env[name]).find(Boolean) || "";
}

function assertEnv() {
  const missing = [];
  for (const [role, config] of Object.entries(credentialEnv)) {
    if (!readFirstEnv(config.identifiers)) missing.push(config.identifiers.join(" or "));
    if (!process.env[config.password]) missing.push(config.password);
  }
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

async function request(path, options = {}) {
  const token = options.token || PUBLIC_ANON_KEY;
  const response = await fetch(`${ROOT_URL}${path}`, {
    ...options,
    headers: {
      apikey: PUBLIC_ANON_KEY,
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${response.status} ${text}`);
  }
  return body;
}

async function signIn(identifier, password, role) {
  const email = portalEmail(identifier, role);
  let body;
  try {
    body = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
  } catch (error) {
    const config = credentialEnv[role];
    throw new Error(
      `${role} sign-in failed. Check ${config.identifiers.join(" or ")} and ${config.password}. ${error.message}`
    );
  }
  const actualRole = String(body?.user?.app_metadata?.portal_role || body?.user?.app_metadata?.role || "").toLowerCase();
  if (role === "staff" && actualRole !== "staff") {
    throw new Error(`Staff login did not return staff role: ${actualRole || "(none)"}`);
  }
  if (role === "manager" && !["manager", "admin"].includes(actualRole)) {
    throw new Error(`Manager login did not return manager role: ${actualRole || "(none)"}`);
  }
  return {
    token: body.access_token,
    user: body.user,
    role: actualRole
  };
}

function getCredential(role) {
  const config = credentialEnv[role];
  return {
    identifier: readFirstEnv(config.identifiers),
    password: process.env[config.password]
  };
}

function resolveRunId() {
  const runId = process.env.FRAGRANCE_TEST_RUN_ID || createRunId();
  if (!runId.startsWith("CODX_QR_TEST_")) {
    throw new Error("FRAGRANCE_TEST_RUN_ID must start with CODX_QR_TEST_ when provided.");
  }
  return runId;
}

function queryValue(value) {
  return encodeURIComponent(String(value));
}

async function insertRow(table, payload, token) {
  const rows = await request(`/rest/v1/${table}`, {
    method: "POST",
    token,
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });
  return rows?.[0] || null;
}

async function patchRows(table, filters, payload, token) {
  return request(`/rest/v1/${table}?${filters}`, {
    method: "PATCH",
    token,
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(payload)
  });
}

async function selectRows(table, query, token) {
  return request(`/rest/v1/${table}?${query}`, { token });
}

async function rpc(name, payload, token = PUBLIC_ANON_KEY) {
  return request(`/rest/v1/rpc/${name}`, {
    method: "POST",
    token,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function getStaffProfile(staff) {
  const rows = await selectRows(
    "staff_profiles",
    `select=id,staff_name,role,is_active&auth_user_id=eq.${queryValue(staff.user.id)}&limit=1`,
    staff.token
  );
  const profile = rows?.[0] || null;
  if (!profile?.id) throw new Error("Staff profile was not found for the staff auth user.");
  return profile;
}

async function createPublicQrFixture(runId, staff, staffProfile) {
  const product = await insertRow("fragrance_products", {
    product_name: `${runId} Product`,
    product_tags: ["CODX_TEST", "RPC"],
    final_axes: {},
    recipe_items: [],
    created_by_staff_id: staffProfile.id,
    personal_info_consent: true,
    third_party_order_consent: true,
    consented_at: new Date().toISOString(),
    consented_by_staff_id: staffProfile.id,
    status: "published"
  }, staff.token);
  if (!product?.id) throw new Error("Failed to create test fragrance product.");

  const safeToken = runId.toLowerCase().replaceAll("_", "-");
  const qr = await insertRow("product_qr_codes", {
    fragrance_product_id: product.id,
    qr_code: `${runId}_QR`,
    public_token: safeToken,
    status: "active",
    is_public: true,
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }, staff.token);
  if (!qr?.id) throw new Error("Failed to create test product QR.");

  return { product, qr, token: safeToken };
}

async function createPublicRequest(fixture, suffix, quantities = { quantity_10ml: 1, quantity_30ml: 0 }) {
  const email = `codx_qr_test_${Date.now()}_${suffix}@example.invalid`;
  await rpc("create_public_qr_product_request", {
    p_payload: {
      token: fixture.token,
      requester_email: email,
      quantity_10ml: quantities.quantity_10ml,
      quantity_30ml: quantities.quantity_30ml
    }
  });
  return email;
}

async function findRequestByEmail(email, staffToken) {
  const rows = await selectRows(
    "qr_product_requests",
    `select=id,request_code,status,requester_email,availability_due_at,expires_at,shipped_at&requester_email=eq.${queryValue(email)}&order=created_at.desc&limit=1`,
    staffToken
  );
  const request = rows?.[0] || null;
  if (!request?.id) throw new Error(`Could not read test request for ${email}.`);
  return request;
}

async function createStaffRequest(fixture, staffToken, suffix, status, extras = {}) {
  return insertRow("qr_product_requests", {
    product_qr_code_id: fixture.qr.id,
    fragrance_product_id: fixture.product.id,
    requester_email: `codx_qr_test_${Date.now()}_${suffix}@example.invalid`,
    quantity_10ml: 1,
    quantity_30ml: 0,
    status,
    ...extras
  }, staffToken);
}

async function assertAnonPublicRpc(fixture, staffToken) {
  const data = await rpc("fetch_qr_product_public_page", { p_token: fixture.token });
  if (data?.qrCode?.id !== fixture.qr.id) throw new Error("Public RPC did not return the expected QR code.");
  if (data?.product?.id !== fixture.product.id) throw new Error("Public RPC did not return the expected product.");
  if (!Array.isArray(data?.product?.product_tags) || !data.product.product_tags.includes("CODX_TEST")) {
    throw new Error("Public RPC did not return product tags.");
  }
  const rows = await selectRows(
    "product_qr_codes",
    `select=id,access_count,last_accessed_at&id=eq.${queryValue(fixture.qr.id)}&limit=1`,
    staffToken
  );
  const qr = rows?.[0] || null;
  if (!qr?.last_accessed_at || Number(qr.access_count || 0) < 1) {
    throw new Error("QR access was not recorded.");
  }
}

async function assertNoWideAnonTableAccess(fixture) {
  const deniedStatuses = new Set([401, 403]);
  for (const table of ["product_qr_codes", "fragrance_products"]) {
    const response = await fetch(`${ROOT_URL}/rest/v1/${table}?select=*&limit=1`, {
      headers: { apikey: PUBLIC_ANON_KEY, Authorization: `Bearer ${PUBLIC_ANON_KEY}` }
    });
    if (!deniedStatuses.has(response.status)) {
      throw new Error(`Expected anon select=* on ${table} to be denied, got ${response.status}.`);
    }
  }
  const insertResponse = await fetch(`${ROOT_URL}/rest/v1/qr_product_requests`, {
    method: "POST",
    headers: {
      apikey: PUBLIC_ANON_KEY,
      Authorization: `Bearer ${PUBLIC_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      product_qr_code_id: fixture.qr.id,
      fragrance_product_id: fixture.product.id,
      requester_email: "codx_qr_test_direct_insert@example.invalid",
      quantity_10ml: 1,
      quantity_30ml: 0,
      status: "requested"
    })
  });
  if (!deniedStatuses.has(insertResponse.status)) {
    throw new Error(`Expected anon direct insert on qr_product_requests to be denied, got ${insertResponse.status}.`);
  }
}

async function maybeVerifyManagerDeadline(runId, fixture, staffToken, managerToken) {
  const nowIso = new Date().toISOString();
  const overdueRows = await selectRows(
    "qr_product_requests",
    `select=id,request_code,requester_email,availability_due_at,status&status=eq.requested&availability_due_at=lt.${queryValue(nowIso)}&limit=1000`,
    managerToken
  );
  const nonTestOverdue = (overdueRows || []).filter((row) => !String(row.requester_email || "").startsWith("codx_qr_test_"));
  if (nonTestOverdue.length) {
    return {
      skipped: true,
      reason: `Skipped process_qr_request_deadlines because ${nonTestOverdue.length} non-test overdue requested rows exist.`
    };
  }

  const overdue = await createStaffRequest(fixture, staffToken, "deadline", "requested", {
    availability_due_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  });
  await rpc("process_qr_request_deadlines", { p_now: nowIso }, managerToken);
  const rows = await selectRows(
    "qr_product_requests",
    `select=id,status&requester_email=eq.${queryValue(overdue.requester_email)}&limit=1`,
    staffToken
  );
  const status = rows?.[0]?.status;
  if (status !== "auto_unavailable_overdue") {
    throw new Error(`Deadline RPC did not mark test overdue request. Status: ${status}`);
  }
  return { skipped: false, request_id: overdue.id };
}

async function cleanupFixture(fixture, staffToken) {
  const reason = "CODX_QR_TEST cleanup: verification finished.";
  const qrRows = await patchRows(
    "product_qr_codes",
    `id=eq.${queryValue(fixture.qr.id)}`,
    { status: "inactive", is_public: false, inactive_reason: reason },
    staffToken
  );
  const productRows = await patchRows(
    "fragrance_products",
    `id=eq.${queryValue(fixture.product.id)}`,
    { status: "archived" },
    staffToken
  );
  return {
    qr_status: qrRows?.[0]?.status || null,
    qr_is_public: qrRows?.[0]?.is_public ?? null,
    product_status: productRows?.[0]?.status || null
  };
}

async function main() {
  assertEnv();
  const runId = resolveRunId();
  const staffCredential = getCredential("staff");
  const managerCredential = getCredential("manager");
  const staff = await signIn(staffCredential.identifier, staffCredential.password, "staff");
  const manager = await signIn(managerCredential.identifier, managerCredential.password, "manager");
  const staffProfile = await getStaffProfile(staff);
  const fixture = await createPublicQrFixture(runId, staff, staffProfile);
  const report = { runId, productId: fixture.product.id, qrId: fixture.qr.id, deadline: null, cleanup: null };

  try {
    await assertNoWideAnonTableAccess(fixture);
    await assertAnonPublicRpc(fixture, staff.token);

    const availableEmail = await createPublicRequest(fixture, "available");
    const availableRequest = await findRequestByEmail(availableEmail, staff.token);
    const available = await rpc("mark_qr_request_available", { p_request_id: availableRequest.id }, staff.token);
    if (available?.status !== "available_email_sent") throw new Error("mark_qr_request_available did not update status.");

    const unavailableEmail = await createPublicRequest(fixture, "unavailable", { quantity_10ml: 0, quantity_30ml: 1 });
    const unavailableRequest = await findRequestByEmail(unavailableEmail, staff.token);
    const unavailable = await rpc("mark_qr_request_unavailable", {
      p_request_id: unavailableRequest.id,
      p_reason: "CODX_QR_TEST verification"
    }, staff.token);
    if (unavailable?.status !== "unavailable") throw new Error("mark_qr_request_unavailable did not update status.");

    const shippingPending = await createStaffRequest(fixture, staff.token, "shipped", "shipping_pending");
    const shipped = await rpc("mark_qr_request_shipped", { p_request_id: shippingPending.id }, staff.token);
    if (shipped?.status !== "shipped" || !shipped?.shipped_at) {
      throw new Error("mark_qr_request_shipped did not update status and shipped_at.");
    }

    report.deadline = await maybeVerifyManagerDeadline(runId, fixture, staff.token, manager.token);
  } finally {
    report.cleanup = await cleanupFixture(fixture, staff.token);
  }
  if (report.cleanup?.qr_status !== "inactive" || report.cleanup?.product_status !== "archived") {
    throw new Error(`Cleanup did not leave fixture inactive/archived: ${JSON.stringify(report.cleanup)}`);
  }
  console.log(JSON.stringify({ ok: true, ...report }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
