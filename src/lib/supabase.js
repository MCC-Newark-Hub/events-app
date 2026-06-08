const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const sb = {
  from: (table) => ({
    _table: table,
    _filters: [],
    _order: null,
    _limit: null,
    select(cols = "*") { this._cols = cols; return this; },
    eq(col, val) { this._filters.push({ type: "eq", col, val }); return this; },
    neq(col, val) { this._filters.push({ type: "neq", col, val }); return this; },
    order(col, opts = {}) { this._order = { col, ...opts }; return this; },
    limit(n) { this._limit = n; return this; },
    _buildUrl() {
      let url = SUPABASE_URL + "/rest/v1/" + this._table + "?select=" + (this._cols || "*");
      this._filters.forEach(f => {
        if (f.type === "eq")  url += "&" + f.col + "=eq."  + encodeURIComponent(f.val);
        if (f.type === "neq") url += "&" + f.col + "=neq." + encodeURIComponent(f.val);
      });
      if (this._order) url += "&order=" + this._order.col + (this._order.ascending === false ? ".desc" : ".asc");
      if (this._limit) url += "&limit=" + this._limit;
      return url;
    },
    async then(resolve, reject) {
      try {
        const r = await fetch(this._buildUrl(), {
          headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" }
        });
        const data = await r.json();
        if (data.code) resolve({ data: null, error: data });
        else resolve({ data, error: null });
      } catch (e) { reject(e); }
    },
    async insert(rows) {
      const body = Array.isArray(rows) ? rows : [rows];
      const r = await fetch(SUPABASE_URL + "/rest/v1/" + this._table, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=representation" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      if (data.code) return { data: null, error: data };
      return { data: Array.isArray(data) ? data[0] : data, error: null };
    },
    async update(upd) {
      let url = SUPABASE_URL + "/rest/v1/" + this._table + "?";
      this._filters.forEach((f, i) => {
        if (i > 0) url += "&";
        if (f.type === "eq") url += f.col + "=eq." + encodeURIComponent(f.val);
      });
      const r = await fetch(url, {
        method: "PATCH",
        headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=representation" },
        body: JSON.stringify(upd)
      });
      const data = await r.json();
      if (data.code) return { data: null, error: data };
      return { data, error: null };
    },
    async delete() {
      let url = SUPABASE_URL + "/rest/v1/" + this._table + "?";
      this._filters.forEach((f, i) => {
        if (i > 0) url += "&";
        if (f.type === "eq") url += f.col + "=eq." + encodeURIComponent(f.val);
      });
      const r = await fetch(url, {
        method: "DELETE",
        headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" }
      });
      return { error: r.ok ? null : { message: "Delete failed" } };
    },
    async upsert(rows) {
      const body = Array.isArray(rows) ? rows : [rows];
      const r = await fetch(SUPABASE_URL + "/rest/v1/" + this._table, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json", "Prefer": "return=representation,resolution=merge-duplicates" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      if (data.code) return { data: null, error: data };
      return { data, error: null };
    }
  })
};