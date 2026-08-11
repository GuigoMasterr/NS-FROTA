import { obterLocais, obterVeiculos, obterVeiculoPorPlaca, salvarAlocacaoSupabase, obterAlocacoes } from './banco-dados.js'

// ✅ Preenche os selects de Origem e Destino com os Locais cadastrados
async function carregarSelectLocaisAlocacao() {
  const locais = await obterLocais();
  const listaNomes = locais.map(l => l.nome);

  const origemEl = document.getElementById('alocacaoOrigem');
  const destinoEl = document.getElementById('alocacaoDestino');

  if (origemEl) {
    origemEl.innerHTML = '<option value="">Selecione origem...</option>';
    listaNomes.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      origemEl.appendChild(opt);
    });
  }

  if (destinoEl) {
    destinoEl.innerHTML = '<option value="">Selecione destino...</option>';
    listaNomes.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      destinoEl.appendChild(opt);
    });
  }
}

// ✅ Abre o modal de cadastro de Alocação
async function abrirModalAlocacao() {
  const veiculos = await obterVeiculos();
  
  if (!veiculos || veiculos.length === 0) {
    alert('⚠️ Cadastre um veículo primeiro!');
    return;
  }

  const placas = veiculos.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('');

  document.getElementById('modais').innerHTML = `
    <div class="modal-fundo" onclick="if(event.target===this)fecharModal()">
      <div class="modal-corpo">
        <div class="modal-cabecalho">
          <h3 style="margin:0; font-size:1.125rem; font-weight:600;">📍 Nova Alocação</h3>
          <button type="button" class="btn-fechar" onclick="fecharModal()">&times;</button>
        </div>
        <div class="modal-conteudo">
          <form onsubmit="salvarAlocacao(event)">
            <div class="linha-form">
              <label>Veículo (Placa)</label>
              <select id="alocacaoPlaca" required>${placas}</select>
            </div>
            <div class="linha-form">
              <label>📍 Origem</label>
              <select id="alocacaoOrigem" required>
                <option value="">Carregando...</option>
              </select>
            </div>
            <div class="linha-form">
              <label>📍 Destino</label>
              <select id="alocacaoDestino" required>
                <option value="">Carregando...</option>
              </select>
            </div>
            <div class="linha-form">
              <label>Km Inicial</label>
              <input type="number" id="alocacaoKmInicial" required placeholder="0">
            </div>
            <div class="linha-form">
              <label>Responsável / Motorista</label>
              <input type="text" id="alocacaoResponsavel" required placeholder="Nome completo">
            </div>
            <div class="linha-form">
              <label>Observação (opcional)</label>
              <textarea id="alocacaoObs" rows="2" placeholder="Informações adicionais..."></textarea>
            </div>
            <div class="botoes-form">
              <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="fecharModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar Alocação</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;

  setTimeout(() => carregarSelectLocaisAlocacao(), 50);
}

// ✅ Salva a nova alocação
async function salvarAlocacao(event) {
  event.preventDefault();

  const placa = document.getElementById('alocacaoPlaca').value;
  const origem = document.getElementById('alocacaoOrigem').value.trim();
  const destino = document.getElementById('alocacaoDestino').value.trim();
  const kmInicial = parseInt(document.getElementById('alocacaoKmInicial').value);
  const responsavel = document.getElementById('alocacaoResponsavel').value.trim();
  const observacao = document.getElementById('alocacaoObs').value.trim() || '';

  if (!origem || !destino) {
    alert('⚠️ Selecione Origem e Destino!');
    return;
  }
  if (origem === destino) {
    alert('⚠️ Origem e Destino não podem ser iguais!');
    return;
  }

  // Busca o veículo pela placa para pegar o ID
  const veiculo = await obterVeiculoPorPlaca(placa);
  if (!veiculo) {
    alert('⚠️ Veículo não encontrado!');
    return;
  }

  // Monta os dados no formato do Supabase
  const dadosAlocacao = {
    veiculo_id: veiculo.id,
    motorista: responsavel,
    data_saida: new Date().toISOString().split('T')[0],
    km_saida: kmInicial,
    origem: origem,
    destino: destino,
    observacoes: observacao
  };

  // Salva no Supabase
  const resultado = await salvarAlocacaoSupabase(dadosAlocacao);
  
  if (resultado) {
    alert('✅ Alocação salva com sucesso!');
    fecharModal();
    carregarTabelaAlocacoes();
  } else {
    alert('❌ Erro ao salvar alocação! Verifique o console.');
  }
}

// ✅ Carrega a tabela
async function carregarTabelaAlocacoes(filtroVeiculo = 'todos') {
  const tbody = document.getElementById('tabelaAlocacoes');
  if (!tbody) return;

  let lista = await obterAlocacoes();
  
  if (filtroVeiculo && filtroVeiculo !== 'todos') {
    lista = lista.filter(a => a.veiculo?.placa === filtroVeiculo);
  }

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:2rem;">Sem registros de alocação</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(a => `
    <tr>
      <td><strong>${a.veiculo?.placa || a.placa || '-'}</strong></td>
      <td>📍 ${a.origem || '-'} → ${a.destino || '-'}</td>
      <td>${a.data_saida || a.created_at?.split('T')[0] || '-'}</td>
      <td>${a.km_saida || '-'}</td>
      <td>${a.motorista || '-'}</td>
    </tr>
  `).join('');
}

// ✅ Atualiza filtros ao abrir a página
document.addEventListener('DOMContentLoaded', function () {
  const originalMostrarPagina = window.mostrarPagina;
  window.mostrarPagina = async function (pagina) {
    if (originalMostrarPagina) originalMostrarPagina(pagina);
    if (pagina === 'alocacoes') {
      await carregarTabelaAlocacoes();
      if (typeof atualizarListaVeiculosNosFiltros === 'function') {
        atualizarListaVeiculosNosFiltros();
      }
    }
  };
});

// Torna funções acessíveis globalmente
window.abrirModalAlocacao = abrirModalAlocacao;
window.salvarAlocacao = salvarAlocacao;
window.carregarTabelaAlocacoes = carregarTabelaAlocacoes;