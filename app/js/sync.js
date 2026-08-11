// ==================================================
// SINCRONIZAÇÃO LOCAL COM BACKEND
// ==================================================
const Sincronizacao = {
  endpoint: localStorage.getItem('gf_sync_url') || 'http://localhost:3000/api',
  dispositivoId: localStorage.getItem('gf_device_id') || (() => {
    const id = (typeof Utils !== 'undefined' && Utils.gerarId) ? Utils.gerarId() : Date.now().toString(36);
    localStorage.setItem('gf_device_id', id);
    return id;
  })(),

  async sincronizarRegistro(collection, registro) {
    try {
      await fetch(`${this.endpoint}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.dispositivoId,
          collection,
          registros: [registro]
        })
      });
    } catch (erro) {
      console.warn('Falha ao sincronizar registro:', erro);
    }
  },

  async puxarBase() {
    try {
      const resposta = await fetch(`${this.endpoint}/sync/bundle?deviceId=${encodeURIComponent(this.dispositivoId)}`);
      if (!resposta.ok) return;
      const dadosServidor = await resposta.json();

      ['checklists', 'chamados'].forEach(lista => {
        if (!Array.isArray(dadosServidor[lista])) return;
        const existentes = new Set((BD[lista] || []).map(item => String(item.id)));
        dadosServidor[lista].forEach(item => {
          if (!existentes.has(String(item.id))) {
            BD[lista].push(item);
          }
        });
      });

      if (typeof salvarDados === 'function') salvarDados();
      if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
      if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
      if (typeof carregarMeusRegistros === 'function') carregarMeusRegistros();
    } catch (erro) {
      console.warn('Falha ao buscar dados do servidor:', erro);
    }
  },

  iniciar() {
    const executar = () => this.puxarBase();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', executar, { once: true });
    } else {
      executar();
    }
  }
};

Sincronizacao.iniciar();