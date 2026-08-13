// ==================================================
// 🚗 CADASTRO E GESTÃO DE VEÍCULOS
// ==================================================

// Usa variáveis globais (definidas em banco-dados.js e config.js)
const BD = window.BD;
const CONFIG = window.CONFIG;

// ✅ Abre janela de cadastro ou edição
function abrirModalVeiculo(veiculo = null) {
  const ehEdicao = !!veiculo;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">${ehEdicao ? '✏️ Editar' : '➕ Cadastrar'} Veículo</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <form id="formVeiculo">
          <div class="form-grid">
            <div class="form-grupo">
              <label>Placa <span class="obrigatorio">*</span></label>
              <input type="text" id="vPlaca" style="text-transform:uppercase;" required value="${veiculo?.placa || ''}" ${ehEdicao ? 'readonly' : ''} placeholder="ABC-1234">
            </div>
            <div class="form-grupo">
              <label>Ano</label>
              <input type="number" id="vAno" value="${veiculo?.ano || ''}" placeholder="2024">
            </div>
            <div class="form-grupo">
              <label>Categoria <span class="obrigatorio">*</span></label>
              <select id="vCategoria" required>
                <option value="">Selecione</option>
                <option value="caminhao" ${veiculo?.categoria === 'caminhao' ? 'selected' : ''}>🚛 Caminhão</option>
                <option value="utilitario" ${veiculo?.categoria === 'utilitario' ? 'selected' : ''}>🚐 Utilitário</option>
                <option value="carro" ${veiculo?.categoria === 'carro' ? 'selected' : ''}>🚗 Carro Passeio</option>
                <option value="moto" ${veiculo?.categoria === 'moto' ? 'selected' : ''}>🏍️ Moto</option>
                <option value="maquina" ${veiculo?.categoria === 'maquina' ? 'selected' : ''}>🚜 Máquina</option>
                <option value="van" ${veiculo?.categoria === 'van' ? 'selected' : ''}>🚐 Van</option>
                <option value="onibus" ${veiculo?.categoria === 'onibus' ? 'selected' : ''}>🚌 Ônibus</option>
                <option value="outro" ${veiculo?.categoria === 'outro' ? 'selected' : ''}>❔ Outro</option>
              </select>
            </div>
            <div class="form-grupo">
              <label>Marca / Modelo <span class="obrigatorio">*</span></label>
              <input type="text" id="vModelo" required value="${veiculo?.modelo || ''}" placeholder="Ex: Volvo FH">
            </div>
            <div class="form-grupo">
              <label>Km Atual <span class="obrigatorio">*</span></label>
              <input type="number" id="vKm" required value="${veiculo?.km_atual || 0}" min="0">
            </div>
            <div class="form-grupo">
              <label>Próxima Revisão (KM)</label>
              <input type="number" id="vProximaRevisao" value="${veiculo?.proxima_revisao_km || ''}" min="0">
            </div>
            <div class="form-grupo">
              <label>Vencimento Seguro</label>
              <input type="date" id="vSeguroVencimento" value="${veiculo?.seguro_vencimento || ''}">
            </div>
            <div class="form-grupo">
              <label>Status</label>
              <select id="vStatus">
                <option value="disponivel" ${veiculo?.status === 'disponivel' ? 'selected' : ''}>✅ Disponível</option>
                <option value="alocado" ${veiculo?.status === 'alocado' ? 'selected' : ''}>🚛 Alocado</option>
                <option value="manutencao" ${veiculo?.status === 'manutencao' ? 'selected' : ''}>🔧 Manutenção</option>
                <option value="inativo" ${veiculo?.status === 'inativo' ? 'selected' : ''}>⛔ Inativo</option>
              </select>
            </div>
            <div class="form-grupo">
              <label>Obra / Local <span class="obrigatorio">*</span></label>
              <input type="text" id="vObra" required value="${veiculo?.obra_atual || ''}" placeholder="Nome da obra ou local">
            </div>
            <div class="form-grupo">
              <label>Responsável</label>
              <input type="text" id="vResponsavel" value="${veiculo?.responsavel || ''}" placeholder="Nome do motorista">
            </div>
          </div>
        </form>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="button" class="btn btn-primario" id="btnSalvarVeiculo">${ehEdicao ? '💾 Salvar' : '➕ Cadastrar'}</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
  
  // Evento de salvar
  document.getElementById('btnSalvarVeiculo').addEventListener('click', async () => {
    const placa = document.getElementById('vPlaca').value.toUpperCase().trim();
    const categoria = document.getElementById('vCategoria').value;
    const modelo = document.getElementById('vModelo').value.trim();
    const ano = document.getElementById('vAno').value || null;
    const kmAtual = parseInt(document.getElementById('vKm').value) || 0;
    const proximaRevisao = document.getElementById('vProximaRevisao').value || null;
    const seguroVencimento = document.getElementById('vSeguroVencimento').value || null;
    const status = document.getElementById('vStatus').value;
    const obraAtual = document.getElementById('vObra').value.trim();
    const responsavel = document.getElementById('vResponsavel').value.trim() || null;
    
    // ✅ VALIDAÇÕES
    const placaLimpa = placa.replace(/[^A-Z0-9]/g, '');
    if (!/^[A-Z]{3}[0-9]{4}$/.test(placaLimpa) && !/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(placaLimpa)) {
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
      placa, 
      categoria, 
      modelo, 
      marca: modelo.split(' ')[0],
      ano, 
      km_atual: kmAtual,
      km_inicial: ehEdicao ? (veiculo?.km_inicial || kmAtual) : kmAtual,
      proxima_revisao_km: proximaRevisao ? parseInt(proximaRevisao) : null,
      seguro_vencimento: seguroVencimento,
      status, 
      obra_atual: obraAtual,
      responsavel,
      data_cadastro: veiculo?.data_cadastro || new Date().toISOString().split('T')[0]
    };
    
    if (ehEdicao) {
      dados.id = veiculo.id;
    } else {
      // Verifica placa duplicada
      const existe = BD.veiculos.find(v => v.placa === placa);
      if (existe) {
        alert('❌ Já existe um veículo cadastrado com esta placa!');
        return;
      }
    }
    
    const resultado = await salvarVeiculo(dados);
    if (resultado) {
      alert('✅ Veículo salvo com sucesso!');
      fecharModal();
      await carregarTabelaVeiculos();
      if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
      else if (typeof atualizarDashboard === 'function') atualizarDashboard();
      if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    } else {
      alert('❌ Erro ao salvar veículo!');
    }
  });
}

// ✅ Carrega e exibe a tabela completa
async function carregarTabelaVeiculos() {
  const corpo = document.getElementById('tabelaVeiculos');
  if (!corpo) return;
  
  const busca = (document.getElementById('buscaVeiculos')?.value || '').toLowerCase();
  const veiculos = BD.veiculos || [];
  
  // Aplica filtro de busca
  const veiculosFiltrados = busca 
    ? veiculos.filter(v => 
        v.placa?.toLowerCase().includes(busca) ||
        v.modelo?.toLowerCase().includes(busca) ||
        v.obra_atual?.toLowerCase().includes(busca) ||
        v.responsavel?.toLowerCase().includes(busca)
      )
    : veiculos;
  
  if (!veiculosFiltrados.length) {
    corpo.innerHTML = `<tr><td colspan="9" class="estado-vazio">
      <div class="estado-vazio-icone">🚛</div>
      <div class="estado-vazio-texto">${busca ? 'Nenhum veículo encontrado na busca' : 'Nenhum veículo cadastrado'}</div>
    </td></tr>`;
    return;
  }
  
  const statusMap = {
    disponivel: '<span class="badge badge-success">✅ Disponível</span>',
    alocado: '<span class="badge badge-info">🚛 Alocado</span>',
    manutencao: '<span class="badge badge-warning">🔧 Manutenção</span>',
    inativo: '<span class="badge badge-danger">⛔ Inativo</span>'
  };
  
  const catIcone = {
    caminhao: '🚛', utilitario: '🚐', carro: '🚗', moto: '🏍️', 
    maquina: '🚜', van: '🚐', onibus: '🚌', outro: '❔'
  };
  
  corpo.innerHTML = veiculosFiltrados.map(v => {
    return `<tr>
      <td class="font-mono font-semibold">${v.placa}</td>
      <td>${catIcone[v.categoria] || '❔'} ${v.categoria || '-'}</td>
      <td>${v.modelo}</td>
      <td>${v.ano || '-'}</td>
      <td>${Number(v.km_atual || 0).toLocaleString('pt-BR')} km</td>
      <td>${v.obra_atual || '—'}</td>
      <td>${v.responsavel || '—'}</td>
      <td>${statusMap[v.status] || v.status || '<span class="badge badge-secondary">—</span>'}</td>
      <td>
        <button class="btn btn-sm" style="background:#fef3c7; color:#92400e; margin-right:0.25rem;" onclick='abrirModalVeiculo(${JSON.stringify(v).replace(/"/g, '&quot;')})'>
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm" style="background:#fee2e2; color:#991b1b;" onclick="excluirVeiculo('${v.placa || v.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

// ✅ Excluir veículo
async function excluirVeiculo(identificador) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este veículo?')) return;
  
  await excluirVeiculoBD(identificador);
  
  alert('✅ Veículo excluído!');
  await carregarTabelaVeiculos();
  if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
  else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
}

// ✅ Atualiza lista de veículos nos filtros de outras páginas
function atualizarListaVeiculosNosFiltros() {
  const veiculos = BD.veiculos || [];
  const opcoes = veiculos.map(v => `<option value="${v.placa}">${v.placa} — ${v.modelo}</option>`).join('');
  
  // Filtro de manutenção
  const filtroManut = document.getElementById('filtroVeiculoManutencao');
  if (filtroManut) {
    filtroManut.innerHTML = '<option value="todos">Todos os veículos</option>' + opcoes;
  }
  
  // Filtro de gastos
  const filtroGastos = document.getElementById('filtroVeiculoGastos');
  if (filtroGastos) {
    filtroGastos.innerHTML = '<option value="todos">Todos os veículos</option>' + opcoes;
  }
}

// ==================================================
// ✅ DISPONIBILIZA TUDO GLOBALMENTE
// ==================================================
window.abrirModalVeiculo = abrirModalVeiculo;
window.carregarTabelaVeiculos = carregarTabelaVeiculos;
window.excluirVeiculo = excluirVeiculo;
window.atualizarListaVeiculosNosFiltros = atualizarListaVeiculosNosFiltros;