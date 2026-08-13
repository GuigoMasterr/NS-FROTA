// ==================================================
// 🚛 ALOCAÇÕES DE VEÍCULOS
// ==================================================

// ✅ Abre modal de nova alocação
const BD = window.BD;
function abrirModalAlocacao(alocacao = null) {
  const ehEdicao = !!alocacao;
  const veiculos = BD.veiculos || [];
  const locais = BD.locais || [];
  
  const opcoesVeiculos = veiculos.map(v => 
    `<option value="${v.id}" ${String(alocacao?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`
  ).join('');
  
  const opcoesLocais = locais.map(l => 
    `<option value="${l.nome}">${l.nome}</option>`
  ).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">${ehEdicao ? '✏️ Editar' : '➕ Nova'} Alocação</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <form id="formAlocacao">
          <div class="form-grid">
            <div class="form-grupo">
              <label>Veículo <span class="obrigatorio">*</span></label>
              <select id="aVeiculo" required>
                <option value="">Selecione o veículo</option>
                ${opcoesVeiculos}
              </select>
            </div>
            <div class="form-grupo">
              <label>Motorista <span class="obrigatorio">*</span></label>
              <input type="text" id="aMotorista" required value="${alocacao?.motorista || ''}" placeholder="Nome do motorista">
            </div>
            <div class="form-grupo">
              <label>Data Saída <span class="obrigatorio">*</span></label>
              <input type="date" id="aDataSaida" required value="${alocacao?.dataSaida || new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-grupo">
              <label>KM Saída <span class="obrigatorio">*</span></label>
              <input type="number" id="aKmSaida" required value="${alocacao?.kmSaida || ''}" min="0">
            </div>
            <div class="form-grupo">
              <label>Origem <span class="obrigatorio">*</span></label>
              <select id="aOrigem" required>
                <option value="">Selecione</option>
                ${opcoesLocais}
              </select>
            </div>
            <div class="form-grupo">
              <label>Destino <span class="obrigatorio">*</span></label>
              <select id="aDestino" required>
                <option value="">Selecione</option>
                ${opcoesLocais}
              </select>
            </div>
            <div class="form-grupo">
              <label>Data Retorno</label>
              <input type="date" id="aDataRetorno" value="${alocacao?.dataRetorno || ''}">
            </div>
            <div class="form-grupo">
              <label>KM Retorno</label>
              <input type="number" id="aKmRetorno" value="${alocacao?.kmRetorno || ''}" min="0">
            </div>
          </div>
        </form>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="button" class="btn btn-primario" id="btnSalvarAlocacao">💾 Salvar</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
  
  document.getElementById('btnSalvarAlocacao').addEventListener('click', async () => {
    const veiculoId = document.getElementById('aVeiculo').value;
    const motorista = document.getElementById('aMotorista').value.trim();
    const dataSaida = document.getElementById('aDataSaida').value;
    const kmSaida = parseInt(document.getElementById('aKmSaida').value) || 0;
    const origem = document.getElementById('aOrigem').value;
    const destino = document.getElementById('aDestino').value;
    const dataRetorno = document.getElementById('aDataRetorno').value || null;
    const kmRetorno = document.getElementById('aKmRetorno').value ? parseInt(document.getElementById('aKmRetorno').value) : null;
    
    if (!veiculoId || !motorista || !dataSaida || !origem || !destino) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    
    const dados = {
      veiculoId: parseInt(veiculoId),
      motorista,
      dataSaida,
      kmSaida,
      origem,
      destino,
      dataRetorno,
      kmRetorno,
      status: dataRetorno ? 'Concluída' : 'Em Andamento'
    };
    
    if (ehEdicao) {
      dados.id = alocacao.id;
    }
    
    const resultado = await salvarAlocacao(dados);
    if (resultado) {
      alert('✅ Alocação salva com sucesso!');
      fecharModal();
      carregarTabelaAlocacoes();
      if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    } else {
      alert('❌ Erro ao salvar alocação!');
    }
  });
}

// ✅ Carrega tabela de alocações
async function carregarTabelaAlocacoes() {
  const corpo = document.getElementById('tabelaAlocacoes');
  if (!corpo) return;
  
  const alocacoes = BD.alocacoes || [];
  
  if (!alocacoes.length) {
    corpo.innerHTML = `<tr><td colspan="10" class="estado-vazio">
      <div class="estado-vazio-icone">🚛</div>
      <div class="estado-vazio-texto">Nenhuma alocação registrada</div>
    </td></tr>`;
    return;
  }
  
  corpo.innerHTML = alocacoes.map(a => {
    const veic = (BD.veiculos || []).find(v => String(v.id) === String(a.veiculoId));
    const statusClasse = a.status === 'Concluída' ? 'badge-success' : 
                         a.status === 'Em Andamento' ? 'badge-warning' : 'badge-secondary';
    
    return `<tr>
      <td>${a.dataSaida ? new Date(a.dataSaida).toLocaleDateString('pt-BR') : '—'}</td>
      <td class="font-mono font-semibold">${veic?.placa || '—'}</td>
      <td>${a.motorista || '—'}</td>
      <td>${a.origem || '—'}</td>
      <td>${a.destino || '—'}</td>
      <td>${a.kmSaida ? Number(a.kmSaida).toLocaleString('pt-BR') : '—'} km</td>
      <td>${a.dataRetorno ? new Date(a.dataRetorno).toLocaleDateString('pt-BR') : '—'}</td>
      <td>${a.kmRetorno ? Number(a.kmRetorno).toLocaleString('pt-BR') : '—'} km</td>
      <td><span class="badge ${statusClasse}">${a.status || 'Pendente'}</span></td>
      <td>
        <button class="btn btn-sm" style="background:#fef3c7; color:#92400e; margin-right:0.25rem;" onclick='abrirModalAlocacao(${JSON.stringify(a).replace(/"/g, '&quot;')})'>
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm" style="background:#fee2e2; color:#991b1b;" onclick="excluirAlocacao('${a.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

// ✅ Excluir alocação
async function excluirAlocacao(id) {
  if (!confirm('⚠️ Tem certeza que deseja excluir esta alocação?')) return;
  
  BD.alocacoes = (BD.alocacoes || []).filter(a => String(a.id) !== String(id));
  
  if (typeof salvarDados === 'function') salvarDados();
  else localStorage.setItem('bd_frotas', JSON.stringify(BD));
  
  alert('✅ Alocação excluída!');
  carregarTabelaAlocacoes();
  if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
}
// ==================================================
// ✅ DISPONIBILIZA GLOBALMENTE
// ==================================================
window.abrirModalAlocacao = abrirModalAlocacao;
window.carregarTabelaAlocacoes = carregarTabelaAlocacoes;
window.excluirAlocacao = excluirAlocacao;