// ==================================================
// SINCRONIZAÇÃO LOCAL COM BACKEND
// ==================================================

const Sincronizacao = {
  // Detecta ambiente - só tenta sincronizar se houver URL explícita configurada
  endpoint: (() => {
    const urlConfig = localStorage.getItem('gf_sync_url');
    if (urlConfig) return urlConfig;
    // Em desenvolvimento (localhost) usa a API local
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000/api';
    }
    // Em produção, não tenta sincronizar automaticamente
    return null;
  })(),
  
  dispositivoId: localStorage.getItem('gf_device_id') || (() => {
    const id = (typeof Utils !== 'undefined' && Utils.gerarId) ? Utils.gerarId() : Date.now().toString(36);
    localStorage.setItem('gf_device_id', id);
    return id;
  })(),
  
  get estaAtivo() {
    return this.endpoint !== null;
  },
  
  async sincronizarRegistro(collection, registro) {
    if (!this.estaAtivo) return;
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
      console.warn('Falha ao sincronizar registro (modo offline):', erro.message);
    }
  },
  
  async puxarBase() {
    if (!this.estaAtivo) return;
    try {
      const resposta = await fetch(`${this.endpoint}/sync/bundle?deviceId=${encodeURIComponent(this.dispositivoId)}`);
      if (!resposta.ok) return;
      const dadosServidor = await resposta.json();
      
      ['checklists', 'chamados', 'veiculos', 'manutencoes', 'gastos'].forEach(lista => {
        if (!Array.isArray(dadosServidor[lista])) return;
        if (!BD[lista]) BD[lista] = [];
        
        const existentes = new Set(BD[lista].map(item => String(item.id)));
        dadosServidor[lista].forEach(item => {
          if (!existentes.has(String(item.id))) {
            BD[lista].push(item);
          }
        });
      });
      
      if (typeof salvarDados === 'function') salvarDados();
      if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
      if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
      if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
      if (typeof carregarMeusRegistros === 'function') carregarMeusRegistros();
      
      console.log('✅ Base sincronizada com servidor');
    } catch (erro) {
      console.warn('Falha ao buscar dados do servidor (modo offline):', erro.message);
    }
  },
  
  iniciar() {
    if (!this.estaAtivo) {
      console.log('ℹ️ Sincronização desativada - usando apenas armazenamento local');
      return;
    }
    
    const executar = () => this.puxarBase();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', executar, { once: true });
    } else {
      executar();
    }
  }
};

window.Sincronizacao = Sincronizacao;
Sincronizacao.iniciar();