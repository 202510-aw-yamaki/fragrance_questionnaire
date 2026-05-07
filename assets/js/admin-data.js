(function () {
  function getClient() {
    return window.getSupabaseClient?.();
  }

  async function listRows(table, options = {}) {
    const client = getClient();
    if (!client) return [];
    let query = client.from(table).select(options.select || "*");
    (options.filters || []).forEach((filter) => {
      query = query[filter.operator](filter.column, filter.value);
    });
    (options.orders || []).forEach((order) => {
      query = query.order(order.column, { ascending: order.ascending !== false });
    });
    if (options.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function upsertRow(table, payload, conflictColumn) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured.");
    const query = client.from(table).upsert(payload, conflictColumn ? { onConflict: conflictColumn } : undefined).select();
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function insertRow(table, payload) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured.");
    const { data, error } = await client.from(table).insert(payload).select();
    if (error) throw error;
    return data || [];
  }

  async function updateRow(table, id, payload) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured.");
    const { data, error } = await client.from(table).update(payload).eq("id", id).select();
    if (error) throw error;
    return data || [];
  }

  async function updateRows(table, payload, filters = []) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured.");
    let query = client.from(table).update(payload);
    filters.forEach((filter) => {
      query = query[filter.operator](filter.column, filter.value);
    });
    const { data, error } = await query.select();
    if (error) throw error;
    return data || [];
  }

  async function deleteRow(table, id) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured.");
    const { error } = await client.from(table).delete().eq("id", id);
    if (error) throw error;
    return true;
  }

  async function callRpc(functionName, params = {}) {
    const client = getClient();
    if (!client) throw new Error("Supabase is not configured.");
    const { data, error } = await client.rpc(functionName, params);
    if (error) throw error;
    return data;
  }

  window.AdminData = {
    listRows,
    upsertRow,
    insertRow,
    updateRow,
    updateRows,
    deleteRow,
    callRpc
  };
})();
