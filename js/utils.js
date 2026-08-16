// ==================================================
// 🛠️ FUNÇÕES UTILITÁRIAS - VERSÃO CORRIGIDA
// ✅ Inclui funções essenciais que estavam faltando
// ==================================================

const Utils = {
  formatarMoeda(valor) {
    try {
      const n = Number(valor);
      if (isNaN(n) || n < 0) return "R$ 0,00";
      return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } catch (e) {
      return "R$ 0,00";
    }
  },
  
  formatarData(data) {
    try {
      const d = data ? new Date(data) : new Date();
      if (isNaN(d.getTime())) return "--/--/----";
      return d.toLocaleDateString('pt-BR');
    } catch (e) {
      return "--/--/----";
    }
  },
  
  formatarDataHora(data) {
    try {
      const d = data ? new Date(data) : new Date();
      if (isNaN(d.getTime())) return "--/--/---- --:--";
      return d.toLocaleString('pt-BR');
    } catch (e) {
      return "--/--/---- --:--";
    }
  },
  
  gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  getDataHoraAtual() { 
    return new Date().toLocaleString('pt-BR'); 
  },
  
  diasEntre(d1, d2) {
    try {
      const a = new Date(d1), b = new Date(d2);
      if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
      return Math.ceil(Math.abs(b - a) / 86400000);
    } catch (e) {
      return 0;
    }
  },
  
  limparTexto(t) { 
    return !t ? "" : t.toString().trim().replace(/\s+/g, " "); 
  },
  
  extrairNumeros(t) { 
    return !t ? "" : t.toString().replace(/[^0-9]/g, ""); 
  },
  
  padronizarPlaca(p) { 
    return !p ? "" : p.toString().toUpperCase().replace(/[^A-Z0-9]/g, ""); 
  },
  
  // ✅ NOVO: Limita texto a um número máximo de caracteres
  limitarTexto(texto, max = 50) {
    if (!texto) return '';
    return texto.length > max ? texto.substring(0, max) + '...' : texto;
  }
};

window.Utils = Utils;

// ==================================================
// 🔐 FUNÇÕES DE PERMISSÃO (estavam faltando!)
// ==================================================

function ehAdmin() {
  try {
    return window.usuarioAtual && window.usuarioAtual.perfil === 'admin';
  } catch (e) {
    console.error('❌ Erro em ehAdmin:', e);
    return false;
  }
}
window.ehAdmin = ehAdmin;

function temPerfil(perfis = []) {
  try {
    if (!window.usuarioAtual) return false;
    return perfis.includes(window.usuarioAtual.perfil);
  } catch (e) {
    return false;
  }
}
window.temPerfil = temPerfil;

// ==================================================
// 🔔 SISTEMA DE NOTIFICAÇÕES TOAST (estava faltando!)
// ==================================================

function mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
  try {
    // Cria container se não existir
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    
    const cores = {
      sucesso: { bg: '#10b981', icon: '✓' },
      erro: { bg: '#dc2626', icon: '✕' },
      aviso: { bg: '#f59e0b', icon: '⚠' },
      info: { bg: '#3b82f6', icon: 'ℹ' }
    };
    
    const estilo = cores[tipo] || cores.info;
    
    toast.style.cssText = `
      background: ${estilo.bg};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 250px;
      max-width: 350px;
      animation: slideIn 0.3s ease;
      pointer-events: auto;
    `;
    
    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${estilo.icon}</span>
      <span style="flex: 1;">${mensagem}</span>
    `;
    
    container.appendChild(toast);
    
    // Adiciona animação CSS se não existir
    if (!document.getElementById('toast-animation')) {
      const style = document.createElement('style');
      style.id = 'toast-animation';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Remove após duração
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duracao);
    
  } catch (e) {
    console.error('❌ Erro ao mostrar toast:', e);
    // Fallback para alert
    alert(mensagem);
  }
}
window.mostrarToast = mostrarToast;

// ==================================================
// 🚛 ATUALIZAR LISTA DE VEÍCULOS NOS FILTROS (estava faltando!)
// ==================================================

function atualizarListaVeiculosNosFiltros() {
  try {
    console.log('🔄 Atualizando listas de veículos nos filtros...');
    
    if (typeof BD === 'undefined' || !BD.veiculos) {
      console.warn('⚠️ BD.veiculos não disponível');
      return;
    }
    
    const veiculos = BD.veiculos;
    
    // Lista de IDs dos selects que precisam ser atualizados
    const selectsIds = [
      'filtroVeiculoManutencao',
      'filtroGastosVeiculo',
      'filtroChecklistVeiculo',
      'filtroVeiculoChamado',
      'filtroVeiculoAlocacao',
      'mVeiculo',           // Modal manutenção
      'gVeiculo',           // Modal gastos
      'cVeiculo',           // Modal chamados
      'clVeiculo',          // Modal checklist
      'alVeiculo',          // Modal alocação
      'dvVeiculo'           // Modal despesas viagem
    ];
    
    selectsIds.forEach(id => {
      const select = document.getElementById(id);
      if (!select) return;
      
      // Guarda o valor selecionado atual
      const valorAtual = select.value;
      
      // Mantém a primeira opção (placeholder)
      const primeiraOpcao = select.options[0];
      const placeholder = primeiraOpcao 
        ? `<option value="${primeiraOpcao.value}">${primeiraOpcao.textContent}</option>`
        : '<option value="">Selecione...</option>';
      
      // Preenche com veículos
      select.innerHTML = placeholder + veiculos.map(v => 
        `<option value="${v.id}">${v.placa} - ${v.modelo || ''} (${v.status || 'disponivel'})</option>`
      ).join('');
      
      // Restaura o valor selecionado se ainda existir
      if (valorAtual && select.querySelector(`option[value="${valorAtual}"]`)) {
        select.value = valorAtual;
      }
    });
    
    console.log(`✅ Listas de veículos atualizadas em ${selectsIds.filter(id => document.getElementById(id)).length} campos`);
    
  } catch (e) {
    console.error('❌ Erro ao atualizar listas de veículos:', e);
  }
}
window.atualizarListaVeiculosNosFiltros = atualizarListaVeiculosNosFiltros;

// ==================================================
// 📊 ATUALIZAR DASHBOARD COMPLETO (estava faltando!)
// ==================================================

function atualizarDashboardCompleto() {
  try {
    console.log('📊 Atualizando dashboard...');
    
    if (typeof BD === 'undefined') {
      console.warn('⚠️ BD não disponível');
      return;
    }
    
    // Estatísticas básicas
    const totalVeiculos = BD.veiculos ? BD.veiculos.length : 0;
    const emOperacao = BD.veiculos ? BD.veiculos.filter(v => v.status === 'disponivel' || v.status === 'alocado').length : 0;
    const emManutencao = BD.veiculos ? BD.veiculos.filter(v => v.status === 'manutencao').length : 0;
    const chamadosAbertos = BD.chamados ? BD.chamados.filter(c => c.status === 'Aberto' || c.status === 'Em Andamento').length : 0;
    
    // Gastos do mês atual
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const gastosMes = BD.gastos ? BD.gastos.filter(g => {
      const data = new Date(g.data);
      return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    }).reduce((sum, g) => sum + Number(g.valor || 0), 0) : 0;
    
    // KM total rodado
    const kmTotal = BD.veiculos ? BD.veiculos.reduce((sum, v) => sum + Number(v.km_atual || 0), 0) : 0;
    
    // Atualiza cards
    const cardTotal = document.getElementById('cardTotalVeiculos');
    if (cardTotal) cardTotal.textContent = totalVeiculos;
    
    const cardOperacao = document.getElementById('cardEmOperacao');
    if (cardOperacao) cardOperacao.textContent = emOperacao;
    
    const cardOperacaoPct = document.getElementById('cardEmOperacaoPct');
    if (cardOperacaoPct && totalVeiculos > 0) {
      cardOperacaoPct.textContent = Math.round((emOperacao / totalVeiculos) * 100) + '%';
    }
    
    const cardManutencao = document.getElementById('cardEmManutencao');
    if (cardManutencao) cardManutencao.textContent = emManutencao;
    
    const cardChamados = document.getElementById('cardChamados');
    if (cardChamados) cardChamados.textContent = chamadosAbertos;
    
    const cardGastosMes = document.getElementById('cardGastosMes');
    if (cardGastosMes) cardGastosMes.textContent = Utils.formatarMoeda(gastosMes);
    
    const cardKmRodados = document.getElementById('cardKmRodados');
    if (cardKmRodados) cardKmRodados.textContent = kmTotal.toLocaleString('pt-BR');
    
    // Também chama a função antiga se existir (compatibilidade)
    if (typeof atualizarDashboard === 'function' && atualizarDashboard !== atualizarDashboardCompleto) {
      try { atualizarDashboard(); } catch(e) {}
    }
    
    console.log('✅ Dashboard atualizado!');
    
  } catch (e) {
    console.error('❌ Erro ao atualizar dashboard:', e);
  }
}
window.atualizarDashboardCompleto = atualizarDashboardCompleto;

// ==================================================
// ❌ FECHAR MODAL GLOBAL (garantir que está disponível)
// ==================================================

if (typeof window.fecharModal !== 'function') {
  function fecharModal(modalId) {
    try {
      if (modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
          modal.remove();
          return;
        }
      }
      // Se não encontrou por ID, fecha o primeiro modal aberto
      const modais = document.querySelectorAll('.modal-overlay.aberto');
      modais.forEach(m => m.remove());
      
      // Também tenta qualquer modal-overlay
      if (modais.length === 0) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
      }
    } catch (e) {
      console.error('❌ Erro ao fechar modal:', e);
    }
  }
  window.fecharModal = fecharModal;
}

console.log('✅ js/utils.js carregado - Todas as funções essenciais disponíveis');