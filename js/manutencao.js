// ==================================================
// 🔧 CONTROLE DE MANUTENÇÃO — Preventiva e Corretiva
// ==================================================

// ✅ Abre janela de cadastro ou edição
function abrirModalManutencao(tipo, manutencao = null) {
  const ehEdicao = !!manutencao;
  const tipoManutencao = tipo || manutencao?.tipo || 'preventiva';
  const ehPreventiva = tipoManutencao === 'preventiva';
  const veiculos = BD.veiculos || [];
  
  const opcoesVeiculos = veiculos.map(v => 
    `<option value="${v.id}" ${String(manutencao?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`
  ).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">${ehEdicao ? '✏️ Editar' : '➕ Cadastrar'} ${ehPreventiva ? '🔧 Preventiva' : '🛠️ Corretiva'}</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <form id="formManutencao">
          <div class="form-grid">
            <div class="form-grupo">
              <label>Veículo <span class="obrigatorio">*</span></label>
              <select id="mVeiculo" required>
                <option value="">Selecione o veículo</option>
                ${opcoesVeiculos}
              </select>
            </div>
            <div class="form-grupo">
              <label>Serviço / Descrição <span class="obrigatorio">*</span></label>
              <input type="text" id="mServico" placeholder="Ex: Troca de óleo, Freios..." required value="${manutencao?.servico || ''}">
            </div>
            <div class="form-grupo">
              <label>Data Prevista <span class="obrigatorio">*</span></label>
              <input type="date" id="mData" required value="${manutencao?.dataPrevista || new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-grupo">
              <label>Km Previsto <span class="obrigatorio">*</span></label>
              <input type="number" id="mKm" required value="${manutencao?.kmPrevisto || ''}" min="0">
            </div>
            ${ehPreventiva ? `
            <div class="form-grupo">
              <label>Repetir a cada (km)</label>
              <input type="number" id="mIntervaloKm" value="${manutencao?.intervaloKm || ''}" min="0" placeholder="Ex: 10000">
            </div>
            <div class="form-grupo">
              <label>Repetir a cada (dias)</label>
              <input type="number" id="mIntervaloDias" value="${manutencao?.intervaloDias || ''}" min="0" placeholder="Ex: 180">
            </div>
            ` : ''}
            <div class="form-grupo">
              <label>Custo (R$)</label>
              <input type="number" step="0.01" id="mCusto" placeholder="0,00" value="${manutencao?.custo || ''}" min="0">
            </div>
            <div class="form-grupo">
              <label>Status</label>
              <select id="mStatus">
                <option value="Pendente" ${manutencao?.status === 'Pendente' ? 'selected' : ''}>⏳ Pendente</option>
                <option value="Em Andamento" ${manutencao?.status === 'Em Andamento' ? 'selected' : ''}>🔧 Em Andamento</option>
                <option value="Concluída" ${manutencao?.status === 'Concluída' ? 'selected' : ''}>✅ Concluída</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="button" class="btn btn-primario" id="btnSalvarManutencao">${ehEdicao ? '💾 Salvar' : '➕ Cadastrar'}</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
  
  document.getElementById('btnSalvarManutencao').addEventListener('click', async () => {
    const veiculoId = parseInt(document.getElementById('mVeiculo').value);
    const servico = document.getElementById('mServico').value.trim();
    const dataPrevista = document.getElementById('mData').value;
    const kmPrevisto = parseFloat(document.getElementById('mKm').value);
    const custo = parseFloat(document.getElementById('mCusto').value) || 0;
    const status = document.getElementById('mStatus').value;
    
    if (!veiculoId || !servico || !dataPrevista || !kmPrevisto) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    
    if (kmPrevisto < 0) {
      alert('❌ Quilometragem inválida!');
      return;
    }
    
    const dados = {
      veiculoId,
      tipo: tipoManutencao,
      servico,
      dataPrevista,
      kmPrevisto,
      custo,
      status
    };
    
    if (ehPreventiva) {
      const intervaloKm = document.getElementById('mIntervaloKm')?.value;
      const intervaloDias = document.getElementById('mIntervaloDias')?.value;
      dados.intervaloKm = intervaloKm ? parseFloat(intervaloKm) : null;
      dados.intervaloDias = intervaloDias ? parseFloat(intervaloDias) : null;
    }
    
    if (ehEdicao) {
      dados.id = manutencao.id;
    } else {
      dados.criadoPor = window.usuarioAtual?.nome || 'Sistema';
    }
    
    const resultado = await salvarManutencao(dados);
    if (resultado) {
      alert('✅ Manutenção salva com sucesso!');
      fecharModal();
      carregarTabelaManutencao();
      if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
      else if (typeof atualizarDashboard === 'function') atualizarDashboard();
    } else {
      alert('❌ Erro ao salvar manutenção!');
    }
  });
}

// ✅ Exclui manutenção
async function excluirManutencao(id) {
  if (!confirm('⚠️ Tem certeza que deseja excluir esta manutenção?')) return;
  
  await excluirManutencaoBD(id);
  
  alert('✅ Manutenção excluída!');
  carregarTabelaManutencao();
  if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
  else if (typeof atualizarDashboard === 'function') atualizarDashboard();
}

// ✅ Carrega e exibe tabela com filtro por veículo
async function carregarTabelaManutencao(filtroPlaca = 'todos') {
  const corpo = document.getElementById('tabelaManutencao');
  if (!corpo) return;
  
  let dados = BD.manutencoes || [];
  
  // Filtro por veículo
  if (filtroPlaca !== 'todos') {
    dados = dados.filter(m => {
      const veiculo = (BD.veiculos || []).find(v => String(v.id) === String(m.veiculoId));
      return veiculo?.placa === filtroPlaca;
    });
  }
  
  // Ordena por data (mais recente primeiro)
  dados = [...dados].sort((a, b) => new Date(b.dataPrevista) - new Date(a.dataPrevista));
  
  if (!dados.length) {
    corpo.innerHTML = `<tr><td colspan="8" class="estado-vazio">
      <div class="estado-vazio-icone">🔧</div>
      <div class="estado-vazio-texto">${filtroPlaca === 'todos' ? 'Nenhuma manutenção registrada' : 'Nenhum registro para este veículo'}</div>
    </td></tr>`;
    return;
  }
  
  corpo.innerHTML = dados.map(m => {
    const veic = (BD.veiculos || []).find(v => String(v.id) === String(m.veiculoId));
    const statusClasse = m.status === 'Concluída' ? 'badge-success' :
                          m.status === 'Em Andamento' ? 'badge-warning' : 'badge-secondary';
    
    const seguro = JSON.stringify(m).replace(/"/g, '&quot;');
    
    return `<tr>
      <td>${m.dataPrevista ? new Date(m.dataPrevista).toLocaleDateString('pt-BR') : '—'}</td>
      <td class="font-mono font-semibold">${veic?.placa || '—'}</td>
      <td>${m.tipo === 'preventiva' ? '<span class="badge badge-info">🔧 Preventiva</span>' : '<span class="badge badge-danger">🛠️ Corretiva</span>'}</td>
      <td>${m.servico || '—'}</td>
      <td>${m.kmPrevisto ? Number(m.kmPrevisto).toLocaleString('pt-BR') : '—'} km</td>
      <td>${m.custo ? Utils.formatarMoeda(m.custo) : '—'}</td>
      <td><span class="badge ${statusClasse}">${m.status || 'Pendente'}</span></td>
      <td>
        <button class="btn btn-sm" style="background:#fef3c7; color:#92400e; margin-right:0.25rem;" onclick='abrirModalManutencao("${m.tipo}", ${seguro})'>
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm" style="background:#fee2e2; color:#991b1b;" onclick="excluirManutencao('${m.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

// ==================================================
// ✅ DISPONIBILIZA GLOBALMENTE
// ==================================================
window.abrirModalManutencao = abrirModalManutencao;
window.excluirManutencao = excluirManutencao;
window.carregarTabelaManutencao = carregarTabelaManutencao;