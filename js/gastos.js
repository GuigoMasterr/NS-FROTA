// ==================================================
// 💰 CONTROLE DE GASTOS E DESPESAS
// ==================================================

// ✅ Abre janela de cadastro ou edição
const BD = window.BD;
function abrirModalGasto(gasto = null) {
  const ehEdicao = !!gasto;
  const veiculos = BD.veiculos || [];
  const obras = BD.obras || BD.locais?.map(l => l.nome) || [];
  
  const opcoesVeiculos = veiculos.map(v => 
    `<option value="${v.id}" ${String(gasto?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`
  ).join('');
  
  const opcoesObras = obras.map(o => 
    `<option value="${o}" ${gasto?.obra === o ? 'selected' : ''}>${o}</option>`
  ).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 550px;">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">💰 ${ehEdicao ? '✏️ Editar' : '➕ Lançar'} Gasto</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <form id="formGasto">
          <div class="form-grid">
            <div class="form-grupo">
              <label>Data <span class="obrigatorio">*</span></label>
              <input type="date" id="gData" required value="${gasto?.data || new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-grupo">
              <label>Valor (R$) <span class="obrigatorio">*</span></label>
              <input type="number" step="0.01" id="gValor" required value="${gasto?.valor || ''}" min="0.01" placeholder="0,00">
            </div>
            <div class="form-grupo">
              <label>Veículo <span class="obrigatorio">*</span></label>
              <select id="gVeiculo" required>
                <option value="">Selecione o veículo</option>
                ${opcoesVeiculos}
              </select>
            </div>
            <div class="form-grupo">
              <label>Obra / Local <span class="obrigatorio">*</span></label>
              <select id="gObra" required>
                <option value="">Selecione</option>
                ${opcoesObras}
              </select>
            </div>
            <div class="form-grupo" style="grid-column: 1 / -1;">
              <label>Tipo de Gasto <span class="obrigatorio">*</span></label>
              <select id="gTipo" required>
                <option value="Combustível" ${gasto?.tipo === 'Combustível' ? 'selected' : ''}>⛽ Combustível</option>
                <option value="Manutenção" ${gasto?.tipo === 'Manutenção' ? 'selected' : ''}>🔧 Manutenção</option>
                <option value="Pneus" ${gasto?.tipo === 'Pneus' ? 'selected' : ''}>🚛 Pneus</option>
                <option value="Pedágio" ${gasto?.tipo === 'Pedágio' ? 'selected' : ''}>🛣️ Pedágio</option>
                <option value="Seguro" ${gasto?.tipo === 'Seguro' ? 'selected' : ''}>🛡️ Seguro</option>
                <option value="IPVA" ${gasto?.tipo === 'IPVA' ? 'selected' : ''}>📄 IPVA</option>
                <option value="Licenciamento" ${gasto?.tipo === 'Licenciamento' ? 'selected' : ''}>📋 Licenciamento</option>
                <option value="Multa" ${gasto?.tipo === 'Multa' ? 'selected' : ''}>⚠️ Multa</option>
                <option value="Outro" ${gasto?.tipo === 'Outro' ? 'selected' : ''}>📋 Outro</option>
              </select>
            </div>
            <div class="form-grupo" style="grid-column: 1 / -1;">
              <label>Observação</label>
              <input type="text" id="gObs" placeholder="Detalhes adicionais..." value="${gasto?.observacao || ''}">
            </div>
          </div>
        </form>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="button" class="btn btn-sucesso" id="btnSalvarGasto">💾 Salvar Gasto</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
  
  document.getElementById('btnSalvarGasto').addEventListener('click', async () => {
    const data = document.getElementById('gData').value;
    const veiculoId = parseInt(document.getElementById('gVeiculo').value);
    const obra = document.getElementById('gObra').value;
    const tipo = document.getElementById('gTipo').value;
    const valor = parseFloat(document.getElementById('gValor').value);
    const observacao = document.getElementById('gObs').value.trim();
    
    if (!data || !veiculoId || !obra || !tipo) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    
    if (!valor || valor <= 0) {
      alert('❌ O valor deve ser maior que zero!');
      return;
    }
    
    const dados = {
      data,
      veiculoId,
      obra,
      tipo,
      valor,
      observacao,
      lancadoPor: window.usuarioAtual?.nome || 'Sistema'
    };
    
    if (ehEdicao) {
      dados.id = gasto.id;
    }
    
    const resultado = await salvarGasto(dados);
    if (resultado) {
      alert('✅ Gasto salvo com sucesso!');
      fecharModal();
      carregarTabelaGastos();
      if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
      else if (typeof atualizarDashboard === 'function') atualizarDashboard();
    } else {
      alert('❌ Erro ao salvar gasto!');
    }
  });
}

// ✅ Exclui gasto
async function excluirGasto(id) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este lançamento?')) return;
  
  await excluirGastoBD(id);
  
  alert('✅ Gasto excluído!');
  carregarTabelaGastos();
  if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
  else if (typeof atualizarDashboard === 'function') atualizarDashboard();
}

// ✅ Carrega e exibe tabela com filtro por veículo
async function carregarTabelaGastos(filtroPlaca = 'todos') {
  const corpo = document.getElementById('tabelaGastos');
  if (!corpo) return;
  
  let dados = BD.gastos || [];
  
  // Filtro por veículo
  if (filtroPlaca !== 'todos') {
    dados = dados.filter(g => {
      const veiculo = (BD.veiculos || []).find(v => String(v.id) === String(g.veiculoId));
      return veiculo?.placa === filtroPlaca;
    });
  }
  
  // Ordena por data (mais recente primeiro)
  dados = [...dados].sort((a, b) => new Date(b.data) - new Date(a.data));
  
  if (!dados.length) {
    corpo.innerHTML = `<tr><td colspan="7" class="estado-vazio">
      <div class="estado-vazio-icone">💰</div>
      <div class="estado-vazio-texto">${filtroPlaca === 'todos' ? 'Nenhum registro de gasto' : 'Nenhum registro para este veículo'}</div>
    </td></tr>`;
    return;
  }
  
  const tipoIcone = {
    'Combustível': '⛽', 'Manutenção': '🔧', 'Pneus': '🚛', 'Pedágio': '🛣️',
    'Seguro': '🛡️', 'IPVA': '📄', 'Licenciamento': '📋', 'Multa': '⚠️', 'Outro': '📋'
  };
  
  corpo.innerHTML = dados.slice(0, 100).map(g => {
    const veic = (BD.veiculos || []).find(v => String(v.id) === String(g.veiculoId));
    const seguro = JSON.stringify(g).replace(/"/g, '&quot;');
    
    return `<tr>
      <td>${g.data ? new Date(g.data).toLocaleDateString('pt-BR') : '—'}</td>
      <td class="font-mono font-semibold">${veic?.placa || '—'}</td>
      <td>${tipoIcone[g.tipo] || '📋'} ${g.tipo || '—'}</td>
      <td>${g.obra || '—'}</td>
      <td><strong>${Utils.formatarMoeda(g.valor)}</strong></td>
      <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${g.observacao || '—'}</td>
      <td>
        <button class="btn btn-sm" style="background:#fef3c7; color:#92400e; margin-right:0.25rem;" onclick='abrirModalGasto(${seguro})'>
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm" style="background:#fee2e2; color:#991b1b;" onclick="excluirGasto('${g.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

// ==================================================
// ✅ DISPONIBILIZA GLOBALMENTE
// ==================================================
window.abrirModalGasto = abrirModalGasto;
window.excluirGasto = excluirGasto;
window.carregarTabelaGastos = carregarTabelaGastos;