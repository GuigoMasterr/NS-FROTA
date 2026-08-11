// js/supabase.js
class SupabaseMock {
  constructor() { this._tabela = ''; this._filtros = []; }
  from(t) { this._tabela = t; this._filtros = []; return this; }
  select() { return this._resposta(); }
  eq(c, v) { this._filtros.push({c, v}); return this; }
  order() { return this; }
  single() { return this._resposta(true); }
  upsert() { return this._resposta(); }
  delete() { return this._resposta(); }
  _resposta(unico = false) {
    return Promise.resolve({ data: unico ? null : [], error: { message: 'Modo local' } });
  }
}
export const supabase = new SupabaseMock();
export default supabase;