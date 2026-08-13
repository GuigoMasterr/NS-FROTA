// js/supabase.js
// Integração real com Supabase + fallback para modo local

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
        console.warn('Erro na query Supabase, usando fallback:', e);
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
    if (this.temConexaoReal) {
      try {
        return await this._clienteReal.from(this._tabela).upsert(dados, opcoes).select();
      } catch (e) {
        console.warn('Erro no upsert Supabase:', e);
      }
    }
    return this._respostaFallback();
  }

  async insert(dados) {
    if (this.temConexaoReal) {
      try {
        return await this._clienteReal.from(this._tabela).insert(dados).select();
      } catch (e) {
        console.warn('Erro no insert Supabase:', e);
      }
    }
    return this._respostaFallback();
  }

  async update(dados) {
    if (this.temConexaoReal) {
      try {
        let query = this._clienteReal.from(this._tabela).update(dados);
        this._filtros.forEach(f => {
          query = query.eq(f.c, f.v);
        });
        return await query.select();
      } catch (e) {
        console.warn('Erro no update Supabase:', e);
      }
    }
    return this._respostaFallback();
  }

  async delete() {
    if (this.temConexaoReal) {
      try {
        let query = this._clienteReal.from(this._tabela).delete();
        this._filtros.forEach(f => {
          query = query.eq(f.c, f.v);
        });
        return await query;
      } catch (e) {
        console.warn('Erro no delete Supabase:', e);
      }
    }
    return this._respostaFallback();
  }

  _respostaFallback() {
    return Promise.resolve({ 
      data: this._unico ? null : [], 
      error: { message: 'Modo local - Supabase não conectado' } 
    });
  }
}

// Cria instância
const supabaseInstancia = new SupabaseWrapper();

// Disponibiliza globalmente (para scripts carregados normalmente)
window.supabase = supabaseInstancia;

// Exporta como módulo (para arquivos que usam import)
// export const supabase = supabaseInstancia;  // Removido para compatibilidade
// export default supabaseInstancia;  // Removido para compatibilidade