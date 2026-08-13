// ==================================================
// 🚨 CHAMADOS E OCORRÊNCIAS
// ==================================================

// ✅ Abre janela de cadastro ou edição
function abrirModalChamado(chamado = null) {
  const ehEdicao = !!chamado;
  const veiculos = BD.veiculos || [];
  
  const opcoesVeiculos = veiculos.map(v => 
    `<option value="${v.id}" ${String(chamado?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`
  ).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 550px;">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">📢 ${ehEdicao ? '✏️ Editar' : '➕ Registrar'} Chamado</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <form id="formChamado">
          <div class="form-grid">
            <div class="form-grupo">
              <label>Veículo <span class="obrigatorio">*</span></label>
              <select id="chVeiculo" required>
                <option value="">Selecione o veículo</option>
                ${opcoesVeiculos}
              </select>
            </div>
            <div class="form-grupo">
              <label>Tipo de Ocorrência <span class="obrigatorio">*</span></label>
              <select id="chTipo" required>
                <option value="Problema Mecânico" ${chamado?.tipo === 'Problema Mecânico' ? 'selected' : ''}>🔧 Problema Mecânico</option>
                <option value="Sinistro" ${chamado?.tipo === 'Sinistro' ? 'selected' : ''}>💥 Sinistro / Acidente</option>
                <option value="Elétrico" ${chamado?.tipo === 'Elétrico' ? 'selected' : ''}>⚡ Problema Elétrico</option>
                <option value="Outro" ${chamado?.tipo === 'Outro' ? 'selected' : ''}>📋 Outro</option>
              </select>
            </div>
            <div class="form-grupo">
              <label>Obra / Local <span class="obrigatorio">*</span></label>
              <input type="text" id="chObra" required value="${chamado?.obra || ''}" placeholder="Nome da obra ou local">
            </div>
            <div class="form-grupo">
              <label>Quilometragem <span class="obrigatorio">*</span></label>
              <input type="number" id="chKm" required value="${chamado?.km || ''}" min="0">
            </div>
            <div class="form-grupo" style="grid-column: 1 / -1;">
              <label>Descrição <span class="obrigatorio">*</span></label>
              <textarea id="chDescricao" rows="3" required placeholder="Descreva detalhadamente o que ocorreu...">${chamado?.descricao || ''}</textarea>
            </div>
            <div class="form-grupo">
              <label>Status</label>
              <select id="chStatus">
                <option value="Aberto" ${chamado?.status === 'Aberto' ? 'selected' : ''}>🔴 Aberto</option>
                <option value="Em Andamento" ${chamado?.status === 'Em Andamento' ? 'selected' : ''}>🟡 Em Andamento</option>
                <option value="Resolvido" ${chamado?.status === 'Resolvido' ? 'selected' : ''}>🟢 Resolvido</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="button" class="btn btn-perigo" id="btnSalvarChamado">${ehEdicao ? '💾 Salvar' : '➕ Registrar'}</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
  
  document.getElementById('btnSalvarChamado').addEventListener('click', async () => {
    const veicId = parseInt(document.getElementById('chVeiculo').value);
    const tipo = document.getElementById('chTipo').value;
    const obra = document.getElementById('chObra').value.trim();
    const km = parseFloat(document.getElementById('chKm').value);
    const descricao = document.getElementById('chDescricao').value.trim();
    const status = document.getElementById('chStatus').value;
    
    if (!veicId || !tipo || !obra || !descricao) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    
    if (isNaN(km) || km < 0) {
      alert('❌ Quilometragem inválida!');
      return;
    }
    
    const dados = {
      veiculoId: veicId,
      tipo,
      obra,
      km,
      descricao,
      status,
      responsavel: chamado?.responsavel || window.usuarioAtual?.nome || 'Administrador',
      data: chamado?.data || new Date().toISOString()
    };
    
    if (ehEdicao) {
      dados.id = chamado.id;
    }
    
    const resultado = await salvarChamado(dados);
    if (resultado) {
      alert('✅ Chamado salvo com sucesso!');
      fecharModal();
      carregarTabelaChamados();
      if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
      else if (typeof atualizarDashboard === 'function') atualizarDashboard();
    } else {
      alert('❌ Erro ao salvar chamado!');
    }
  });
}

// ✅ Excluir chamado
async function excluirChamado(id) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este chamado permanentemente?')) return;
  
  await excluirChamadoBD(id);
  
  alert('✅ Chamado excluído!');
  carregarTabelaChamados();
  if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
  else if (typeof atualizarDashboard === 'function') atualizarDashboard();
}

// ✅ Alterar status rapidamente
async function alterarStatusChamado(id, novoStatus) {
  const chamado = (BD.chamados || []).find(c => String(c.id) === String(id));
  if (chamado) {
    chamado.status = novoStatus;
    await salvarChamado(chamado);
    carregarTabelaChamados();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

// ✅ Carregar tabela de chamados
async function carregarTabelaChamados() {
  const corpo = document.getElementById('tabelaChamados');
  if (!corpo) return;
  
  const lista = BD.chamados || [];
  
  // Ordena por data (mais recente primeiro)
  const ordenados = [...lista].sort((a, b) => new Date(b.data) - new Date(a.data));
  
  if (!ordenados.length) {
    corpo.innerHTML = `<tr><td colspan="8" class="estado-vazio">
      <div class="estado-vazio-icone">📢</div>
      <div class="estado-vazio-texto">Nenhum chamado registrado</div>
    </td></tr>`;
    return;
  }
  
  corpo.innerHTML = ordenados.map(c => {
    const v = (BD.veiculos || []).find(x => String(x.id) === String(c.veiculoId));
    const dt = c.data ? new Date(c.data).toLocaleDateString('pt-BR') : '—';
    
    const statusLabel = {
      'Aberto': '<span class="badge badge-danger">🔴 Aberto</span>',
      'Em Andamento': '<span class="badge badge-warning">🟡 Em Andamento</span>',
      'Resolvido': '<span class="badge badge-success">🟢 Resolvido</span>'
    }[c.status] || `<span class="badge badge-secondary">${c.status}</span>`;
    
    const seguro = JSON.stringify(c).replace(/"/g, '&quot;');
    
    return `<tr class="hover:bg-slate-50">
      <td>${dt}</td>
      <td class="font-mono font-semibold">${v?.placa || '—'}</td>
      <td>${c.tipo || '—'}</td>
      <td>${c.obra || '—'}</td>
      <td>${c.km ? Number(c.km).toLocaleString('pt-BR') : '—'} km</td>
      <td>${statusLabel}</td>
      <td>${c.responsavel || '—'}</td>
      <td>
        <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
          ${c.status !== 'Resolvido' ? `
            <button class="btn btn-sm" style="background:#d1fae5; color:#065f46;" onclick="alterarStatusChamado('${c.id}', 'Resolvido')" title="Marcar como resolvido">
              <i class="fa-solid fa-check"></i>
            </button>
          ` : ''}
          <button class="btn btn-sm" style="background:#fef3c7; color:#92400e;" onclick='abrirModalChamado(${seguro})'>
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-sm" style="background:#fee2e2; color:#991b1b;" onclick="excluirChamado('${c.id}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ==================================================
// ✅ DISPONIBILIZA GLOBALMENTE
// ==================================================
window.abrirModalChamado = abrirModalChamado;
window.excluirChamado = excluirChamado;
window.alterarStatusChamado = alterarStatusChamado;
window.carregarTabelaChamados = carregarTabelaChamados;