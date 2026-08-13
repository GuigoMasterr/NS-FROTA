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

// ✅ Garante que CONFIG existe
window.CONFIG = window.CONFIG || {
  STATUS_VEICULOS: { ATIVO: 'Em Operação', MANUTENCAO: 'Em Manutenção', INATIVO: 'Inativo' },
  CATEGORIAS_VEICULOS: ['Caminhão', 'Carro Passeio', 'Utilitário', 'Máquina', 'Van', 'Ônibus', 'Moto', 'Outro'],
  STATUS_CHECKLIST: { APROVADO: 'Aprovado', PENDENTE: 'Pendente', REPROVADO: 'Reprovado' },
  TIPO_MANUTENCAO: { PREVENTIVA: 'Preventiva', CORRETIVA: 'Corretiva', REVISAO: 'Revisão' },
  STATUS_MANUTENCAO: { ABERTA: 'Aberta', ANDAMENTO: 'Em Andamento', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada' },
  TIPO_GASTOS: ['Abastecimento', 'Peças', 'Serviço', 'IPVA', 'Seguro', 'Licenciamento', 'Multa', 'Outros']
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

// ✅ Funções genéricas de registro
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

// ✅ Atualiza origens/destinos/obras a partir dos locais
window.atualizarListasDependentes = function() {
  if (BD.locais && BD.locais.length) {
    const nomes = BD.locais.map(l => l.nome);
    BD.origens = nomes;
    BD.destinos = nomes;
    BD.obras = nomes;
  }
};

// ✅ Dashboard
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

// ============================================================
// ✅ FUNÇÕES DE VEÍCULOS - GARANTIDAS GLOBALMENTE
// ============================================================

window.abrirModalVeiculo = window.abrirModalVeiculo || function(veiculo = null) {
  const ehEdicao = !!veiculo;

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  modal.innerHTML = `
    <div class="modal-corpo">
      <div class="modal-cabecalho">
        <h3 style="margin:0; font-size:1.125rem; font-weight:600;">${ehEdicao ? '✏️ Editar' : '➕ Cadastrar'} Veículo</h3>
        <button type="button" class="btn-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-conteudo">
        <form id="formVeiculo">
          <div class="linha-form">
            <label>Placa *</label>
            <input type="text" id="vPlaca" style="text-transform:uppercase;" required value="${veiculo?.placa || ''}" ${ehEdicao ? 'readonly' : ''}>
          </div>
          <div class="linha-form">
            <label>Ano</label>
            <input type="number" id="vAno" value="${veiculo?.ano || ''}">
          </div>
          <div class="linha-form">
            <label>Categoria *</label>
            <select id="vCategoria" required>
              <option value="">Selecione</option>
              <option value="caminhao" ${veiculo?.categoria === 'caminhao' ? 'selected' : ''}>🚛 Caminhão</option>
              <option value="utilitario" ${veiculo?.categoria === 'utilitario' ? 'selected' : ''}>🚐 Utilitário</option>
              <option value="carro" ${veiculo?.categoria === 'carro' ? 'selected' : ''}>🚗 Carro</option>
              <option value="moto" ${veiculo?.categoria === 'moto' ? 'selected' : ''}>🏍️ Moto</option>
              <option value="maquina" ${veiculo?.categoria === 'maquina' ? 'selected' : ''}>🚜 Máquina</option>
              <option value="outro" ${veiculo?.categoria === 'outro' ? 'selected' : ''}>❔ Outro</option>
            </select>
          </div>
          <div class="linha-form">
            <label>Marca / Modelo *</label>
            <input type="text" id="vModelo" required value="${veiculo?.modelo || ''}">
          </div>
          <div class="linha-form">
            <label>Km Atual *</label>
            <input type="number" id="vKm" required value="${veiculo?.km_atual || 0}">
          </div>
          <div class="linha-form">
            <label>Status</label>
            <select id="vStatus">
              <option value="disponivel" ${veiculo?.status === 'disponivel' ? 'selected' : ''}>✅ Disponível</option>
              <option value="alocado" ${veiculo?.status === 'alocado' ? 'selected' : ''}>🚛 Alocado</option>
              <option value="manutencao" ${veiculo?.status === 'manutencao' ? 'selected' : ''}>🔧 Manutenção</option>
              <option value="inativo" ${veiculo?.status === 'inativo' ? 'selected' : ''}>⛔ Inativo</option>
            </select>
          </div>
          <div class="linha-form">
            <label>Obra / Local *</label>
            <input type="text" id="vObra" required value="${veiculo?.obra_atual || ''}" placeholder="Nome da obra ou local">
          </div>
          <div class="linha-form">
            <label>Responsável</label>
            <input type="text" id="vResponsavel" value="${veiculo?.responsavel || ''}" placeholder="Nome do motorista responsável">
          </div>
          <div class="botoes-form">
            <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="fecharModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${ehEdicao ? '💾 Salvar' : '➕ Cadastrar Veículo'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('modais').appendChild(modal);

  document.getElementById('formVeiculo').addEventListener('submit', async e => {
    e.preventDefault();

    const placa = document.getElementById('vPlaca').value.toUpperCase().trim();
    const categoria = document.getElementById('vCategoria').value;
    const modelo = document.getElementById('vModelo').value.trim();
    const ano = document.getElementById('vAno').value || null;
    const kmAtual = parseInt(document.getElementById('vKm').value) || 0;
    const status = document.getElementById('vStatus').value;
    const obraAtual = document.getElementById('vObra').value.trim();
    const responsavel = document.getElementById('vResponsavel').value.trim() || null;

    if (!/^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/.test(placa.replace('-', '')) && !/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(placa)) {
      alert('❌ Placa inválida! Use o formato AAA-1234 ou AAA1A23');
      return;
    }
    if (!categoria || !modelo || !obraAtual) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (kmAtual < 0) {
      alert('❌ Quilometragem deve ser um número positivo!');
      return;
    }

    const dados = { 
      placa, categoria, modelo, marca: modelo.split(' ')[0], ano, 
      km_atual: kmAtual, km_inicial: ehEdicao ? (veiculo?.km_inicial || kmAtual) : kmAtual,
      status, obra_atual: obraAtual, responsavel
    };

    if (ehEdicao) {
      dados.id = veiculo.id;
      const idx = BD.veiculos.findIndex(v => String(v.id) === String(veiculo.id));
      if (idx !== -1) BD.veiculos[idx] = { ...BD.veiculos[idx], ...dados };
    } else {
      const existe = BD.veiculos.find(v => v.placa === placa);
      if (existe) {
        alert('❌ Já existe um veículo cadastrado com esta placa!');
        return;
      }
      dados.id = window.Utils?.gerarId?.() || Date.now();
      BD.veiculos.push(dados);
    }

    if (typeof salvarDados === 'function') salvarDados();

    alert('✅ Veículo salvo com sucesso!');
    fecharModal();
    if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
    if (typeof atualizarDashboard === 'function') atualizarDashboard();
    if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
  });
};

window.carregarTabelaVeiculos = window.carregarTabelaVeiculos || async function() {
  const corpo = document.getElementById('tabelaVeiculos');
  if (!corpo) return;

  const veiculos = BD.veiculos || [];

  if (!veiculos.length) {
    corpo.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:2rem;">Nenhum veículo cadastrado</td></tr>';
    return;
  }

  const statusMap = {
    disponivel: '<span class="badge badge-success">✅ Disponível</span>',
    alocado: '<span class="badge" style="background:#dbeafe; color:#1e40af;">🚛 Alocado</span>',
    manutencao: '<span class="badge badge-warning">🔧 Manutenção</span>',
    inativo: '<span class="badge badge-danger">⛔ Inativo</span>'
  };

  const catIcone = {
    caminhao: '🚛', utilitario: '🚐', carro: '🚗', moto: '🏍️', maquina: '🚜', outro: '❔'
  };

  corpo.innerHTML = veiculos.map(v => {
    const seguro = JSON.stringify(v).replace(/"/g, '&quot;');
    return `<tr>
      <td class="font-mono">${v.placa}</td>
      <td>${catIcone[v.categoria] || '❔'} ${v.categoria || '-'}</td>
      <td>${v.modelo}</td>
      <td>${Number(v.km_atual || 0).toLocaleString('pt-BR')} km</td>
      <td>${v.obra_atual || '—'}</td>
      <td>${statusMap[v.status] || v.status}</td>
      <td class="admin-only">
        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#fef3c7; color:#92400e; margin-right:0.25rem;" onclick='abrirModalVeiculo(${seguro})'>✏️</button>
        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#fee2e2; color:#991b1b;" onclick="excluirVeiculo('${v.placa || v.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
};

window.excluirVeiculo = window.excluirVeiculo || async function(identificador) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este veículo?')) return;
  
  BD.veiculos = BD.veiculos.filter(v => v.placa !== identificador && String(v.id) !== String(identificador));
  if (typeof salvarDados === 'function') salvarDados();
  
  alert('✅ Veículo excluído!');
  if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
  if (typeof atualizarDashboard === 'function') atualizarDashboard();
  if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
};

// ✅ Inicializa listas
atualizarListasDependentes();

console.log('✅ Correções aplicadas com sucesso!');
