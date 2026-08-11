// js/correcoes.js
// Este arquivo deve ser carregado DEPOIS de todos os módulos

// ✅ Garante que BD existe e tem todas as propriedades
window.BD = window.BD || {
  locais: [{ id: 'patio-metalica', nome: 'Pátio Metálica' }, { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' }, { id: 'obra', nome: 'Obra' }],
  veiculos: [], checklists: [], manutencoes: [], gastos: [], chamados: [], alocacoes: [], usuarios: [],
  origens: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
  destinos: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
  obras: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra']
};

// ✅ Função auxiliar para categorias de veículos
window.getCategoriaVeiculo = function(catId) {
  const mapa = {
    caminhao: { icone: '🚛', nome: 'Caminhão' },
    utilitario: { icone: '🚐', nome: 'Utilitário' },
    carro: { icone: '🚗', nome: 'Carro' },
    moto: { icone: '🏍️', nome: 'Moto' },
    maquina: { icone: '🚜', nome: 'Máquina' },
    outro: { icone: '❔', nome: 'Outro' }
  };
  return mapa[catId] || { icone: '🚗', nome: catId || 'Veículo' };
};

// ✅ Funções genéricas de registro (usadas em vários módulos)
window.adicionarRegistro = function(colecao, dados) {
  if (!BD[colecao]) BD[colecao] = [];
  dados.id = dados.id || (window.Utils?.gerarId?.() || Date.now());
  BD[colecao].push(dados);
  if (typeof salvarDados === 'function') salvarDados();
  return dados;
};

window.excluirRegistro = function(colecao, id) {
  if (!BD[colecao]) return;
  BD[colecao] = BD[colecao].filter(item => String(item.id) !== String(id));
  if (typeof salvarDados === 'function') salvarDados();
};

// ✅ Atualiza origens/destinos/obras a partir dos locais cadastrados
window.atualizarListasDependentes = function() {
  if (BD.locais && BD.locais.length) {
    const nomes = BD.locais.map(l => l.nome);
    BD.origens = nomes;
    BD.destinos = nomes;
    BD.obras = nomes;
  }
};

// ✅ Dashboard fallback
window.atualizarDashboard = window.atualizarDashboard || function() {
  if (!BD.veiculos) return;
  const elV = document.getElementById('dashVeiculos');
  const elA = document.getElementById('dashAtivos');
  const elM = document.getElementById('dashManutencao');
  const elC = document.getElementById('dashChamados');
  if (elV) elV.textContent = BD.veiculos.length;
  if (elA) elA.textContent = BD.veiculos.filter(v => v.status === 'disponivel' || v.status === 'alocado').length;
  if (elM) elM.textContent = BD.veiculos.filter(v => v.status === 'manutencao').length;
  if (elC) elC.textContent = (BD.chamados || []).length;
};

window.atualizarDashboardCompleto = window.atualizarDashboardCompleto || window.atualizarDashboard;

// ✅ Inicializa listas
atualizarListasDependentes();

console.log('✅ Correções aplicadas com sucesso!');