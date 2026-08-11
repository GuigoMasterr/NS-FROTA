// js/supabase.js
// Cliente Supabase MOCK — permite o sistema funcionar offline com localStorage
// Substitua pelas credenciais reais quando tiver um projeto Supabase configurado

class SupabaseMock {
  constructor() {
    this._tabela = '';
    this._filtros = [];
    this._ordenacao = null;
  }

  from(tabela) {
    this._tabela = tabela;
    this._filtros = [];
    this._ordenacao = null;
    return this;
  }

  select(campos = '*') {
    return this._criarResposta();
  }

  eq(campo, valor) {
    this._filtros.push({ campo, valor });
    return this;
  }

  order(campo) {
    this._ordenacao = campo;
    return this;
  }

  single() {
    return this._criarResposta(true);
  }

  upsert(dados, opcoes = {}) {
    return this._criarResposta();
  }

  delete() {
    return this._criarResposta();
  }

  _criarResposta(unico = false) {
    // Sempre retorna erro para forçar o uso do fallback local (localStorage)
    return Promise.resolve({
      data: unico ? null : [],
      error: { message: 'Supabase não configurado — usando dados locais' }
    });
  }
}

export const supabase = new SupabaseMock();
export default supabase;