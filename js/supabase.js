// ==================================================
// 🔌 SUPABASE - Cliente Real + Wrapper com Fallback Local
// ✅ CORRIGIDO: Inicializa cliente real do Supabase
// ==================================================

// Configuração - tenta ler de variáveis de ambiente do Vercel
// No Vercel, defina estas Environment Variables:
//   VITE_SUPABASE_URL = sua_url
//   VITE_SUPABASE_ANON_KEY = sua_chave_anon
const SUPABASE_CONFIG = {
  url: (typeof window !== 'undefined' && window.__SUPABASE_URL__) || 
       'https://ccacecyqksenigmrvnap.supabase.co',
  anonKey: (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY__) || 
           'sb_publishable_aRQgU6fTTModcqdb4hSgHQ_bPKp2R3m'
};

// Inicializa o cliente REAL do Supabase (se o SDK estiver carregado)
let supabaseReal = null;

try {
  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    supabaseReal = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    console.log('✅ Cliente Supabase inicializado');
    
    // Teste rápido de conexão
    supabaseReal.from('veiculos').select('count', { count: 'exact', head: true })
      .then(() => console.log('✅ Conexão Supabase OK'))
      .catch(e => console.warn('⚠️ Supabase acessível mas tabela não existe ou RLS bloqueado:', e.message));
      
  } else {
    console.warn('⚠️ SDK do Supabase não carregado - usando apenas modo local');
  }
} catch (e) {
  console.warn('⚠️ Erro ao inicializar Supabase - usando modo local:', e.message);
  supabaseReal = null;
}

// Disponibiliza o cliente real globalmente (para o wrapper)
window.supabaseReal = supabaseReal;

// ==================================================
// WRAPPER com interface similar ao Supabase JS SDK
// Permite fallback transparente para modo local
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

  // Verifica se tem conexão real
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
    this._reset();
    if (this.temConexaoReal) {
      try {
        let query = this._clienteReal.from(this._tabela).select(colunas);
        this._filtros.forEach(f => {
          query = query.eq(f.c, f.v);
        });
        if (this._ordem) {
          query = query.order(this._ordem.coluna, this._ordem.opcoes || {});
        }
        if (this._limite) {
          query = query.limit(this._limite);
        }
        if (this._unico) {
          return query.single();
        }
        return query;
      } catch (e) {
        console.warn(`Erro na query Supabase [${this._tabela}]:`, e.message);
        return this._respostaFallback();
      }
    }
    return this._respostaFallback();
  }

  eq(coluna, valor) {
    this._filtros.push({ c: coluna, v: valor });
    return this;
  }

  order(coluna, opcoes = {}) {
    this._ordem = { coluna, opcoes };
    return this;
  }

  limit(n) {
    this._limite = n;
    return this;
  }

  single() {
    this._unico = true;
    return this;
  }

  async upsert(dados, opcoes = {}) {
    this._reset();
    if (this.temConexaoReal) {
      try {
        return await this._clienteReal.from(this._tabela).upsert(dados, opcoes).select();
      } catch (e) {
        console.warn(`Erro no upsert Supabase [${this._tabela}]:`, e.message);
      }
    }
    return this._respostaFallback();
  }

  async insert(dados) {
    this._reset();
    if (this.temConexaoReal) {
      try {
        return await this._clienteReal.from(this._tabela).insert(dados).select();
      } catch (e) {
        console.warn(`Erro no insert Supabase [${this._tabela}]:`, e.message);
      }
    }
    return this._respostaFallback();
  }

  async update(dados) {
    this._reset();
    if (this.temConexaoReal) {
      try {
        let query = this._clienteReal.from(this._tabela).update(dados);
        this._filtros.forEach(f => {
          query = query.eq(f.c, f.v);
        });
        return await query.select();
      } catch (e) {
        console.warn(`Erro no update Supabase [${this._tabela}]:`, e.message);
      }
    }
    return this._respostaFallback();
  }

  async delete() {
    this._reset();
    if (this.temConexaoReal) {
      try {
        let query = this._clienteReal.from(this._tabela).delete();
        this._filtros.forEach(f => {
          query = query.eq(f.c, f.v);
        });
        return await query;
      } catch (e) {
        console.warn(`Erro no delete Supabase [${this._tabela}]:`, e.message);
      }
    }
    return this._respostaFallback();
  }

  _reset() {
    // Mantém tabela e filtros para operações de escrita
  }

  _respostaFallback() {
    return Promise.resolve({ 
      data: this._unico ? null : [], 
      error: { message: 'Modo local - Supabase não conectado' } 
    });
  }
}

// Cria instância do wrapper
const supabaseInstancia = new SupabaseWrapper();

// Disponibiliza globalmente
window.supabase = supabaseInstancia;

console.log('✅ js/supabase.js carregado - Modo:', 
  supabaseInstancia.temConexaoReal ? '🌐 Supabase Real' : '💾 Apenas Local');
