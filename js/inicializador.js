// ==================================================
// ⚡ INICIALIZADOR DO SISTEMA - CARREGAR ANTES DE TUDO!
// Este arquivo resolve TODOS os problemas de inicialização
// ==================================================
// Coloque este script PRIMEIRO na ordem de carregamento:
// <script src="js/inicializador.js"></script>
// <script src="js/config.js"></script>
// ... etc
// ==================================================

console.log('⚡ [Inicializador] Iniciando...');

// ==================================================
// 1. Garante que window.BD existe
// ==================================================
if (!window.BD) {
  window.BD = {
    locais: [
      { id: 'patio-metalica', nome: 'Pátio Metálica' },
      { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' },
      { id: 'obra', nome: 'Obra' }
    ],
    veiculos: [],
    checklists: [],
    manutencoes: [],
    gastos: [],
    chamados: [],
    alocacoes: [],
    usuarios: [],
    despesasViagem: [],
    adiantamentos: [],
    gastosViagem: [],
    origens: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
    destinos: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
    obras: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra']
  };
  console.log('⚡ [Inicializador] window.BD criado');
}

// ==================================================
// 2. Garante que o container #modais existe
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('modais')) {
    const container = document.createElement('div');
    container.id = 'modais';
    document.body.appendChild(container);
    console.log('⚡ [Inicializador] Container #modais criado');
  }
});

// ==================================================
// 3. Define fecharModal GLOBALMENTE e IMEDIATAMENTE
// ==================================================
window.fecharModal = function() {
  try {
    const container = document.getElementById('modais');
    if (container) container.innerHTML = '';
    
    const modalDespesa = document.getElementById('modalDespesa');
    if (modalDespesa) modalDespesa.classList.remove('ativo', 'aberto');
    
    const modalComprovantes = document.getElementById('modalComprovantes');
    if (modalComprovantes) modalComprovantes.classList.remove('ativo', 'aberto');
  } catch (e) {
    console.warn('fecharModal erro:', e.message);
  }
};
console.log('⚡ [Inicializador] window.fecharModal definido');

// ==================================================
// 4. Função mostrarToast global
// ==================================================
window.mostrarToast = function(mensagem, tipo = 'sucesso') {
  try {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `<i class="fa-solid ${
      tipo === 'sucesso' ? 'fa-check-circle' :
      tipo === 'erro' ? 'fa-times-circle' :
      tipo === 'aviso' ? 'fa-exclamation-triangle' : 'fa-info-circle'
    }" style="margin-right: 0.5rem;"></i>${mensagem}`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  } catch (e) {
    console.log('Toast:', mensagem);
  }
};

// ==================================================
// 5. Sobrescreve alert para usar toast (se possível)
// ==================================================
const _alertOriginal = window.alert;
window.alert = function(msg) {
  try {
    if (typeof msg === 'string') {
      if (msg.includes('❌') || msg.includes('Erro') || msg.includes('erro')) {
        window.mostrarToast(msg.replace(/[❌]/g, '').trim(), 'erro');
      } else if (msg.includes('⚠️')) {
        window.mostrarToast(msg.replace(/[⚠️]/g, '').trim(), 'aviso');
      } else if (msg.includes('✅')) {
        window.mostrarToast(msg.replace(/[✅]/g, '').trim(), 'sucesso');
      } else {
        window.mostrarToast(msg, 'info');
      }
    } else {
      _alertOriginal(msg);
    }
  } catch (e) {
    _alertOriginal(msg);
  }
};

// ==================================================
// 6. Função auxiliar getBD segura
// ==================================================
window.getBD = function() {
  if (!window.BD) {
    window.BD = { veiculos: [], gastos: [], manutencoes: [], chamados: [], checklists: [], alocacoes: [], usuarios: [], locais: [] };
  }
  return window.BD;
};

// ==================================================
// 7. Captura erros globais para debug
// ==================================================
window.addEventListener('error', function(e) {
  console.error('❌ ERRO GLOBAL:', e.message, 'em', e.filename, 'linha', e.lineno);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('❌ PROMESSA NÃO TRATADA:', e.reason);
});

console.log('✅ [Inicializador] Sistema pronto para receber módulos!');
