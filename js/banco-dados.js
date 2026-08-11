// ==================================================
// BANCO DE DADOS — ARMAZENAMENTO LOCAL
// ==================================================

const CHAVE_BD = "gf_banco_dados";

const BD = {
  // Usuários padrão do sistema (ID em string para padronizar)
  usuarios: [
    { 
      id: "1", 
      usuario: 'admin', 
      nome: 'Administrador', 
      senha: 'admin123', 
      perfil: 'admin', 
      ativo: true 
    },
    { 
      id: "2", 
      usuario: 'motorista', 
      nome: 'Motorista', 
      senha: 'motorista123', 
      perfil: 'operacional', 
      ativo: true 
    }
  ],

  veiculos: [],
  // ✅ LOCAIS / OBRAS — unificados! Substitui obras/origens/destinos separados
  locais: [
    { id: 'patio-metalica', nome: 'Pátio Metálica' },
    { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' },
    { id: 'obra', nome: 'Obra' }
  ],
  alocacoes: [],
  manutencoes: [],
  gastos: [],
  checklists: [],
  chamados: [],
    locais: [
    { id: 'patio-metalica', nome: 'Pátio Metálica' },
    { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' },
    { id: 'obra', nome: 'Obra' }
  ],

  // ⚠️ Mantidos temporariamente para compatibilidade — serão substituídos por BD.locais
  obras: ['Base Principal'],
  origens: ['Pátio'],
  destinos: []
};

// ===== CATEGORIAS DE VEÍCULOS =====
const CATEGORIAS_VEICULOS = [
  { id: 'munck', nome: 'Caminhão Munck', icone: '🦾' },
  { id: 'caminhao', nome: 'Caminhão', icone: '🚛' },
  { id: 'carreta', nome: 'Carreta', icone: '🚛' },
  { id: 'guindaste', nome: 'Guindaste', icone: '🏗️' },
  { id: 'carro', nome: 'Carro', icone: '🚗' },
  { id: 'utilitario', nome: 'Utilitário', icone: '🚐' }
];

// Usuário logado no momento (usa o global exposto por auth.js quando disponível)
var usuarioAtual = window.usuarioAtual || null;

// ==================================================
// ✅ FUNÇÕES DE MANIPULAÇÃO DE LOCAIS / OBRAS
// ==================================================

// Retorna lista de locais (apenas nomes — para selects simples)
function getListaLocais() {
  return BD.locais.map(l => l.nome);
}

// Busca local por ID
function buscarLocalPorId(id) {
  return BD.locais.find(l => l.id === id);
}

// Busca local por nome
function buscarLocalPorNome(nome) {
  return BD.locais.find(l => l.nome === nome);
}

// Adiciona ou edita um local
function salvarLocal(local) {
  if (local.id && BD.locais.some(l => l.id === local.id)) {
    // Editar
    const indice = BD.locais.findIndex(l => l.id === local.id);
    BD.locais[indice] = local;
  } else {
    // Novo — gera ID a partir do nome
    local.id = local.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    BD.locais.push(local);
  }
  salvarDados();
}

// Exclui local por ID
function excluirLocal(id) {
  BD.locais = BD.locais.filter(l => l.id !== id);
  salvarDados();
}

// ==================================================
// FUNÇÕES DE MANIPULAÇÃO DO BANCO
// ==================================================

// Retorna dados de uma categoria
function getCategoriaVeiculo(categoriaId) {
  return CATEGORIAS_VEICULOS.find(c => c.id === categoriaId);
}

// Salva TODO o BD no LocalStorage
function salvarDados() {
  localStorage.setItem(CHAVE_BD, JSON.stringify(BD));
}

// Carrega dados salvos do LocalStorage
function carregarDados() {
  const salvo = localStorage.getItem(CHAVE_BD);
  
  if (salvo) {
    try {
      const dados = JSON.parse(salvo);
      // Mescla mantendo padrões caso falte campo novo
      Object.keys(BD).forEach(chave => {
        if (dados[chave] !== undefined) {
          BD[chave] = dados[chave];
        }
      });
      // ✅ Garante que BD.locais SEMPRE exista
      if (!BD.locais || !Array.isArray(BD.locais) || BD.locais.length === 0) {
        BD.locais = [
          { id: 'patio-metalica', nome: 'Pátio Metálica' },
          { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' },
          { id: 'obra', nome: 'Obra' }
        ];
      }
      console.log('✅ Dados carregados com sucesso!');
    } catch (erro) {
      console.warn('⚠️ Dados corrompidos, iniciando novo banco...', erro);
    }
  } else {
    console.log('ℹ️ Nenhum dado salvo, iniciando com padrões.');
  }
}

// Fecha todas as janelas modais
function fecharModal() {
  const modais = document.getElementById('modais');
  if (modais) {
    modais.innerHTML = '';
  }
}

// Atualiza os números do painel/dashboard
function atualizarDashboard() {
  const STATUS_V = CONFIG.STATUS.VEICULO;
  const STATUS_C = CONFIG.STATUS.CHAMADO;

  const totalVeiculos = BD.veiculos.length;
  const ativos = BD.veiculos.filter(v => v.status === STATUS_V.ATIVO).length;
  const emManutencao = BD.veiculos.filter(v => v.status === STATUS_V.MANUTENCAO).length;
  const chamadosAbertos = BD.chamados.filter(c => c.status === STATUS_C.ABERTO).length;

  const el = {
    total: document.getElementById('dashVeiculos'),
    ativos: document.getElementById('dashAtivos'),
    manutencao: document.getElementById('dashManutencao'),
    chamados: document.getElementById('dashChamados')
  };

  if (el.total) el.total.textContent = totalVeiculos;
  if (el.ativos) el.ativos.textContent = ativos;
  if (el.manutencao) el.manutencao.textContent = emManutencao;
  if (el.chamados) el.chamados.textContent = chamadosAbertos;
  
  return { totalVeiculos, ativos, emManutencao, chamadosAbertos };
}

// ==================================================
// FUNÇÕES GENÉRICAS REUTILIZÁVEIS
// ==================================================

// Adicionar novo registro em qualquer lista
function adicionarRegistro(lista, dados) {
  dados.id = Utils.gerarId();
  dados.dataCadastro = Utils.getDataHoraAtual();
  BD[lista].unshift(dados);
  salvarDados();
  return dados;
}

// Excluir registro por ID (com confirmação)
function excluirRegistro(lista, id, confirmar = true) {
  if (confirmar && !confirm('Tem certeza que deseja excluir? Esta operação não pode ser desfeita.')) {
    return false;
  }
  BD[lista] = BD[lista].filter(item => item.id !== id);
  salvarDados();
  return true;
}

// Buscar registro por ID
function buscarPorId(lista, id) {
  return BD[lista].find(item => item.id === id);
}

// Atualizar registro
function atualizarRegistro(lista, id, novosDados) {
  const indice = BD[lista].findIndex(item => item.id === id);
  if (indice !== -1) {
    BD[lista][indice] = { 
      ...BD[lista][indice], 
      ...novosDados, 
      dataEdicao: Utils.getDataHoraAtual() 
    };
    salvarDados();
    return BD[lista][indice];
  }
  return null;
}

// Filtrar registros por placa (compatibilidade atual)
function filtrarPorVeiculo(lista, placaVeiculo) {
  return BD[lista].filter(item => item.placa === placaVeiculo);
}

// Retorna veículos que o usuário pode acessar
function veiculosDoUsuario() {
  if (!usuarioAtual || usuarioAtual.perfil === 'admin') {
    return BD.veiculos;
  }
  const permitidos = usuarioAtual.veiculosPermitidos || [];
  return BD.veiculos.filter(v => permitidos.includes(v.id));
}

// ==================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ==================================================
carregarDados();