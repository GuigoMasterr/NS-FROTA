// ==================================================
// 🔌 SUPABASE - Cliente Real + Wrapper com Fallback Local
// ✅ CORRIGIDO: Nome de variável alterado para evitar conflito
// ==================================================

const SUPABASE_CONFIG = {
  url: (typeof window !== 'undefined' && window.__SUPABASE_URL__) || 
       'https://ccacecyqksenigmrvnap.supabase.co',
  anonKey: (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY__) || 
           'sb_publishable_aRQgU6fTTModcqdb4hSgHQ_bPKp2R3m'
};

// Inicializa o cliente REAL (nome alterado para evitar conflito com SDK)
let _supabaseClienteReal = null;

try {
  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    _supabaseClienteReal = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Cliente Supabase inicializado');
    
    // Teste rápido
    _supabaseClienteReal.from('veiculos').select('count', { count: 'exact', head: true })
      .then(() => console.log('✅ Conexão Supabase OK'))
      .catch(e => console.warn('⚠️ Supabase: tabela não existe ou RLS bloqueado:', e.message));
      
  } else {
    console.warn('⚠️ SDK do Supabase não carregado - modo local');
  }
} catch (e) {
  console.warn('⚠️ Erro ao inicializar Supabase:', e.message);
  _supabaseClienteReal = null;
}

window.supabaseReal = _supabaseClienteReal;

// ==================================================
// WRAPPER
// ==================================================
class SupabaseWrapper {
  constructor() {
    this._tabela = '';
    this._filtros = [];
    this._ordem = null;
    this._limite = null;
    this._unico = false;
    this._clienteReal = window.supabaseReal || null;
  }

  get temConexaoReal() {
    return this._clienteReal !== null;
  }

  from(tabela) {
    this._tabela = tabela;
    this._filtros = [];
    this._ordem = null;
    this._limite = null;
    this._unico = false;
    return this;
  }

  select(colunas = '*') {
    if (this.temConexaoReal) {
      try {
        let query = this._clienteReal.from(this._tabela).select(colunas);
        this._filtros.forEach(f => { query = query.eq(f.c, f.v); });
        if (this._ordem) query = query.order(this._ordem.coluna, this._ordem.opcoes || {});
        if (this._limite) query = query.limit(this._limite);
        if (this._unico) return query.single();
        return query;
      } catch (e) {
        console.warn(`Erro query [${this._tabela}]:`, e.message);
      }
    }
    return Promise.resolve({ data: this._unico ? null : [], error: { message: 'Modo local' } });
  }

  eq(coluna, valor) { this._filtros.push({ c: coluna, v: valor }); return this; }
  order(coluna, opcoes = {}) { this._ordem = { coluna, opcoes }; return this; }
  limit(n) { this._limite = n; return this; }
  single() { this._unico = true; return this; }

  async upsert(dados, opcoes = {}) {
    if (this.temConexaoReal) {
      try { return await this._clienteReal.from(this._tabela).upsert(dados, opcoes).select(); }
      catch (e) { console.warn('Erro upsert:', e.message); }
    }
    return Promise.resolve({ data: [], error: { message: 'Modo local' } });
  }

  async insert(dados) {
    if (this.temConexaoReal) {
      try { return await this._clienteReal.from(this._tabela).insert(dados).select(); }
      catch (e) { console.warn('Erro insert:', e.message); }
    }
    return Promise.resolve({ data: [], error: { message: 'Modo local' } });
  }

  async update(dados) {
    if (this.temConexaoReal) {
      try {
        let query = this._clienteReal.from(this._tabela).update(dados);
        this._filtros.forEach(f => { query = query.eq(f.c, f.v); });
        return await query.select();
      } catch (e) { console.warn('Erro update:', e.message); }
    }
    return Promise.resolve({ data: [], error: { message: 'Modo local' } });
  }

  async delete() {
    if (this.temConexaoReal) {
      try {
        let query = this._clienteReal.from(this._tabela).delete();
        this._filtros.forEach(f => { query = query.eq(f.c, f.v); });
        return await query;
      } catch (e) { console.warn('Erro delete:', e.message); }
    }
    return Promise.resolve({ data: [], error: { message: 'Modo local' } });
  }
}

const supabaseInstancia = new SupabaseWrapper();
window.supabase = supabaseInstancia;

console.log('✅ js/supabase.js carregado - Modo:', 
  supabaseInstancia.temConexaoReal ? '🌐 Supabase Real' : '💾 Apenas Local');
