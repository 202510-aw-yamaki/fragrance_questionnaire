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
    try {
      const { data, error } = await client
        .from("questionnaire_results")
        .upsert([{ ...payload, result_code: resultCode }], { onConflict: "result_code" })
        .select("id, result_code")
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to create questionnaire result.", error);
      return null;
    }
  }

  async function updateQuestionnaireResult(identifier, payload) {
    const client = window.getSupabaseClient?.();
    if (!client) return null;
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
