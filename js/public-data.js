(function () {
  function createCode(prefix) {
    const date = new Date();
    const ymd = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("");
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}${ymd}${random}`;
  }

  const EDIT_TOKEN_STORAGE_KEY = "fragranceQuestionnaireEditTokens";

  function createEditToken() {
    const bytes = new Uint8Array(24);
    if (window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  }

  function readEditTokens() {
    try {
      const raw = window.sessionStorage.getItem(EDIT_TOKEN_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function writeEditTokens(tokens) {
    try {
      window.sessionStorage.setItem(EDIT_TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    } catch (error) {
      // sessionStorage can be unavailable in strict privacy modes.
    }
  }

  function getOrCreateEditToken(resultCode) {
    if (!resultCode) return "";
    const tokens = readEditTokens();
    if (!tokens[resultCode]) {
      tokens[resultCode] = createEditToken();
      writeEditTokens(tokens);
    }
    return tokens[resultCode];
  }

  function getEditToken(resultCode) {
    if (!resultCode) return "";
    return readEditTokens()[resultCode] || "";
  }

  function isMissingFunctionError(error) {
    const message = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
    return message.includes("pgrst202") || message.includes("could not find the function") || message.includes("function") && message.includes("not found");
  }

  function normalizeSingleRow(data) {
    if (Array.isArray(data)) return data[0] || null;
    return data || null;
  }

  async function loadActiveScoringConfig() {
    const client = window.getSupabaseClient?.();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from("scoring_configs")
        .select("config_json, version, updated_at")
        .eq("is_active", true)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.config_json || null;
    } catch (error) {
      console.error("Failed to load active scoring config.", error);
      return null;
    }
  }

  async function loadActiveMaterialPoints() {
    const client = window.getSupabaseClient?.();
    if (!client) return null;
    try {
      const { data, error } = await client
        .from("material_points")
        .select("id, material_code, material_name, category, point_axes, note, is_active, sort_order, updated_at")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("material_code", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to load active material points.", error);
      return null;
    }
  }

  async function createQuestionnaireResult(payload) {
    const client = window.getSupabaseClient?.();
    if (!client) return null;
    const resultCode = payload.result_code || createCode("QR");
    const editToken = getOrCreateEditToken(resultCode);
    const rpcPayload = { ...payload, result_code: resultCode, edit_token_hash: editToken };
    try {
      const { data, error } = await client.rpc("create_questionnaire_result", { p_payload: rpcPayload });
      if (error) throw error;
      return normalizeSingleRow(data);
    } catch (error) {
      if (!isMissingFunctionError(error)) {
        console.error("Failed to create questionnaire result via RPC.", error);
        return null;
      }
    }
    try {
      const { data, error } = await client
        .from("questionnaire_results")
        .upsert([rpcPayload], { onConflict: "result_code" })
        .select("id, result_code")
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      if (isMissingColumnError(error)) {
        try {
          const { data, error: retryError } = await client
            .from("questionnaire_results")
            .upsert([{ ...payload, result_code: resultCode }], { onConflict: "result_code" })
            .select("id, result_code")
            .single();
          if (retryError) throw retryError;
          return data;
        } catch (retryError) {
          console.error("Failed to create questionnaire result.", retryError);
          return null;
        }
      }
      console.error("Failed to create questionnaire result.", error);
      return null;
    }
  }

  async function updateQuestionnaireResult(identifier, payload) {
    const client = window.getSupabaseClient?.();
    if (!client) return null;
    const resultCode = identifier?.resultCode || "";
    const editToken = getEditToken(resultCode);
    if (resultCode && editToken) {
      try {
        const { data, error } = await client.rpc("update_questionnaire_result_by_token", {
          p_result_code: resultCode,
          p_edit_token: editToken,
          p_patch: payload
        });
        if (error) throw error;
        return normalizeSingleRow(data);
      } catch (error) {
        if (!isMissingFunctionError(error)) {
          console.error("Failed to update questionnaire result via RPC.", error);
          return null;
        }
      }
    }
    try {
      let query = client.from("questionnaire_results").update(payload).select("id, result_code").limit(1);
      if (identifier?.id) {
        query = query.eq("id", identifier.id);
      } else if (identifier?.resultCode) {
        query = query.eq("result_code", identifier.resultCode);
      } else {
        return null;
      }
      const { data, error } = await query.single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to update questionnaire result.", error);
      return null;
    }
  }

  async function fetchPublicReservationSlots() {
    const client = window.getSupabaseClient?.();
    if (!client) return null;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const { data, error } = await client
        .from("reservation_slots")
        .select("id, slot_code, slot_date, slot_time, slot_label, instructor_name, status, sort_order, is_active")
        .eq("is_active", true)
        .in("status", ["open", "recommended"])
        .gte("slot_date", today)
        .order("slot_date", { ascending: true })
        .order("slot_time", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Failed to fetch reservation slots.", error);
      return null;
    }
  }

  function isMissingColumnError(error) {
    const message = `${error?.code || ""} ${error?.message || ""}`.toLowerCase();
    return message.includes("pgrst204") || message.includes("could not find") || message.includes("column");
  }

  function omitReservationOptionalColumns(payload) {
    const { questionnaire_flow_status, questionnaire_sync_error, ...basePayload } = payload;
    return basePayload;
  }

  async function createReservation(payload) {
    const client = window.getSupabaseClient?.();
    if (!client) return null;
    const reservationCode = payload.reservation_code || createCode("FR");
    const rpcPayload = { ...payload, reservation_code: reservationCode };
    try {
      const { data, error } = await client.rpc("create_public_reservation", { p_payload: rpcPayload });
      if (error) throw error;
      return normalizeSingleRow(data);
    } catch (error) {
      if (!isMissingFunctionError(error)) {
        console.error("Failed to create reservation via RPC.", error);
        return null;
      }
    }
    const insertReservation = async (reservationPayload) => {
      const { data, error } = await client
        .from("reservations")
        .insert([{ ...reservationPayload, reservation_code: reservationCode }])
        .select("id, reservation_code")
        .single();
      if (error) throw error;
      return data;
    };
    try {
      return await insertReservation(payload);
    } catch (error) {
      if ((payload.questionnaire_flow_status || payload.questionnaire_sync_error) && isMissingColumnError(error)) {
        try {
          return await insertReservation(omitReservationOptionalColumns(payload));
        } catch (retryError) {
          console.error("Failed to create reservation.", retryError);
          return null;
        }
      }
      console.error("Failed to create reservation.", error);
      return null;
    }
  }

  async function fetchReservationByCode(reservationCode) {
    const client = window.getSupabaseClient?.();
    if (!client || !reservationCode) return null;
    try {
      const { data, error } = await client.rpc("fetch_reservation_by_code", { p_reservation_code: reservationCode });
      if (error) throw error;
      return normalizeSingleRow(data);
    } catch (error) {
      if (!isMissingFunctionError(error)) {
        console.error("Failed to fetch reservation by code via RPC.", error);
        return null;
      }
    }
    try {
      const { data, error } = await client
        .from("reservations")
        .select("*")
        .eq("reservation_code", reservationCode)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error("Failed to fetch reservation by code.", error);
      return null;
    }
  }

  window.FragrancePublicData = {
    createCode,
    loadActiveScoringConfig,
    loadActiveMaterialPoints,
    createQuestionnaireResult,
    updateQuestionnaireResult,
    fetchPublicReservationSlots,
    createReservation,
    fetchReservationByCode
  };
})();
