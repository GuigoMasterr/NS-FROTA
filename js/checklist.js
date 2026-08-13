// ==================================================
// ✅ CHECK-LIST DE VEÍCULOS — Inspeção Diária
// ==================================================

// Itens padrão do check-list
const BD = window.BD;
const ITENS_CHECKLIST = [
  { id: 'pneus', label: '🚛 Pneus e Calibragem' },
  { id: 'freios', label: '🛑 Freios' },
  { id: 'oleo', label: '🛢️ Nível de Óleo do Motor' },
  { id: 'agua', label: '💧 Nível de Água' },
  { id: 'bateria', label: '🔋 Bateria' },
  { id: 'lampadas', label: '💡 Luzes e Lâmpadas' },
  { id: 'setas', label: '↪️ Setas e Pisca-alerta' },
  { id: 'limpadores', label: '🌧️ Limpadores de Para-brisa' },
  { id: 'retrovisores', label: '🪞 Retrovisores' },
  { id: 'cintos', label: '🦺 Cintos de Segurança' },
  { id: 'extintor', label: '🧯 Extintor de Incêndio' },
  { id: 'triangulo', label: '⚠️ Triângulo de Sinalização' },
  { id: 'macaco', label: '🔧 Macaco e Chave de Roda' },
  { id: 'documentos', label: '📄 Documentação do Veículo' },
  { id: 'limpeza', label: '🧹 Limpeza Interna e Externa' }
];

// ✅ Abre modal de novo check-list
function abrirModalChecklist(checklist = null) {
  const ehEdicao = !!checklist;
  const veiculos = BD.veiculos || [];
  
  const opcoesVeiculos = veiculos.map(v => 
    `<option value="${v.id}" ${String(checklist?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`
  ).join('');
  
  const itensHTML = ITENS_CHECKLIST.map(item => {
    const valor = checklist?.itens?.[item.id] || 'bom';
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9;">
        <span style="font-size: 0.875rem;">${item.label}</span>
        <div style="display: flex; gap: 0.5rem;">
          <label style="display: flex; align-items: center; gap: 0.2rem; font-size: 0.8rem; cursor: pointer;">
            <input type="radio" name="item_${item.id}" value="bom" ${valor === 'bom' ? 'checked' : ''}>
            <span style="color: #059669;">✅ Bom</span>
          </label>
          <label style="display: flex; align-items: center; gap: 0.2rem; font-size: 0.8rem; cursor: pointer;">
            <input type="radio" name="item_${item.id}" value="regular" ${valor === 'regular' ? 'checked' : ''}>
            <span style="color: #d97706;">⚠️ Regular</span>
          </label>
          <label style="display: flex; align-items: center; gap: 0.2rem; font-size: 0.8rem; cursor: pointer;">
            <input type="radio" name="item_${item.id}" value="ruim" ${valor === 'ruim' ? 'checked' : ''}>
            <span style="color: #dc2626;">❌ Ruim</span>
          </label>
        </div>
      </div>
    `;
  }).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 750px;">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">📋 ${ehEdicao ? 'Editar' : 'Novo'} Check-list de Inspeção</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <form id="formChecklist">
          <div class="form-grid" style="margin-bottom: 1.5rem;">
            <div class="form-grupo">
              <label>Veículo <span class="obrigatorio">*</span></label>
              <select id="cVeiculo" required>
                <option value="">Selecione o veículo</option>
                ${opcoesVeiculos}
              </select>
            </div>
            <div class="form-grupo">
              <label>Motorista <span class="obrigatorio">*</span></label>
              <input type="text" id="cMotorista" required value="${checklist?.motorista || window.usuarioAtual?.nome || ''}" placeholder="Nome do motorista">
            </div>
            <div class="form-grupo">
              <label>Data <span class="obrigatorio">*</span></label>
              <input type="date" id="cData" required value="${checklist?.data?.split('T')[0] || new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-grupo">
              <label>Quilometragem <span class="obrigatorio">*</span></label>
              <input type="number" id="cKm" required value="${checklist?.km || ''}" min="0" placeholder="KM atual">
            </div>
          </div>
          
          <div style="font-weight: 600; margin-bottom: 0.75rem; color: #0f172a;">🔍 Itens de Inspeção</div>
          <div style="background: #f8fafc; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem;">
            ${itensHTML}
          </div>
          
          <div class="form-grupo">
            <label>Observações Gerais</label>
            <textarea id="cObservacoes" rows="3" placeholder="Observações adicionais, problemas encontrados...">${checklist?.observacoes || ''}</textarea>
          </div>
        </form>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="button" class="btn btn-primario" id="btnSalvarChecklist">💾 Salvar Check-list</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
  
  document.getElementById('btnSalvarChecklist').addEventListener('click', async () => {
    const veiculoId = parseInt(document.getElementById('cVeiculo').value);
    const motorista = document.getElementById('cMotorista').value.trim();
    const data = document.getElementById('cData').value;
    const km = parseInt(document.getElementById('cKm').value) || 0;
    const observacoes = document.getElementById('cObservacoes').value.trim();
    
    if (!veiculoId || !motorista || !data || !km) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    
    // Coleta os itens
    const itens = {};
    let temRuim = false;
    ITENS_CHECKLIST.forEach(item => {
      const selecionado = document.querySelector(`input[name="item_${item.id}"]:checked`);
      itens[item.id] = selecionado?.value || 'bom';
      if (itens[item.id] === 'ruim') temRuim = true;
    });
    
    // Determina status geral
    let statusGeral = 'Aprovado';
    if (temRuim) statusGeral = 'Reprovado';
    else if (Object.values(itens).some(v => v === 'regular')) statusGeral = 'Pendente';
    
    const veiculo = veiculos.find(v => v.id === veiculoId);
    
    const dados = {
      veiculoId,
      placaVeiculo: veiculo?.placa || '',
      motorista,
      data: new Date(data).toISOString(),
      km,
      itens,
      statusGeral,
      observacoes,
      criadoPor: window.usuarioAtual?.nome || 'Sistema'
    };
    
    if (ehEdicao) {
      dados.id = checklist.id;
    }
    
    const resultado = await salvarChecklist(dados);
    if (resultado) {
      const msg = statusGeral === 'Reprovado' 
        ? '⚠️ Check-list salvo com itens reprovados! Recomenda-se manutenção.'
        : '✅ Check-list salvo com sucesso!';
      alert(msg);
      fecharModal();
      carregarTabelaChecklist();
      if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    } else {
      alert('❌ Erro ao salvar check-list!');
    }
  });
}

// ✅ Carrega tabela de check-lists
async function carregarTabelaChecklist() {
  const corpo = document.getElementById('tabelaChecklist');
  if (!corpo) return;
  
  const checklists = BD.checklists || [];
  
  if (!checklists.length) {
    corpo.innerHTML = `<tr><td colspan="6" class="estado-vazio">
      <div class="estado-vazio-icone">📋</div>
      <div class="estado-vazio-texto">Nenhum check-list realizado ainda</div>
    </td></tr>`;
    return;
  }
  
  // Ordena por data (mais recente primeiro)
  const ordenados = [...checklists].sort((a, b) => new Date(b.data) - new Date(a.data));
  
  const statusMap = {
    'Aprovado': '<span class="badge badge-success">✅ Aprovado</span>',
    'Pendente': '<span class="badge badge-warning">⚠️ Pendente</span>',
    'Reprovado': '<span class="badge badge-danger">❌ Reprovado</span>'
  };
  
  corpo.innerHTML = ordenados.slice(0, 50).map(c => {
    const veic = (BD.veiculos || []).find(v => String(v.id) === String(c.veiculoId));
    const dataFormatada = c.data ? new Date(c.data).toLocaleDateString('pt-BR') : '—';
    
    return `<tr>
      <td>${dataFormatada}</td>
      <td class="font-mono font-semibold">${c.placaVeiculo || veic?.placa || '—'}</td>
      <td>${c.motorista || '—'}</td>
      <td>${c.km ? Number(c.km).toLocaleString('pt-BR') : '—'} km</td>
      <td>${statusMap[c.statusGeral] || c.statusGeral || '<span class="badge badge-secondary">—</span>'}</td>
      <td>
        <button class="btn btn-sm btn-secundario" onclick='verDetalhesChecklist(${JSON.stringify(c).replace(/"/g, '&quot;')})'>
          <i class="fa-solid fa-eye"></i> Ver
        </button>
      </td>
    </tr>`;
  }).join('');
}

// ✅ Ver detalhes do check-list
function verDetalhesChecklist(checklist) {
  const itensDetalhes = ITENS_CHECKLIST.map(item => {
    const valor = checklist.itens?.[item.id] || 'bom';
    const cor = valor === 'bom' ? '#059669' : valor === 'regular' ? '#d97706' : '#dc2626';
    const icone = valor === 'bom' ? '✅' : valor === 'regular' ? '⚠️' : '❌';
    return `<div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #f1f5f9;">
      <span>${item.label}</span>
      <span style="color: ${cor}; font-weight: 600;">${icone} ${valor.charAt(0).toUpperCase() + valor.slice(1)}</span>
    </div>`;
  }).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 600px;">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">📋 Detalhes do Check-list</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <div><strong>Veículo:</strong> ${checklist.placaVeiculo || '—'}</div>
          <div><strong>Motorista:</strong> ${checklist.motorista || '—'}</div>
          <div><strong>Data:</strong> ${checklist.data ? new Date(checklist.data).toLocaleDateString('pt-BR') : '—'}</div>
          <div><strong>KM:</strong> ${checklist.km ? Number(checklist.km).toLocaleString('pt-BR') : '—'} km</div>
        </div>
        <div style="font-weight: 600; margin-bottom: 0.75rem;">Resultado da Inspeção</div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 1rem;">
          ${itensDetalhes}
        </div>
        ${checklist.observacoes ? `<div><strong>Observações:</strong><p style="margin-top: 0.5rem; padding: 0.75rem; background: #f8fafc; border-radius: 8px;">${checklist.observacoes}</p></div>` : ''}
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-primario" onclick="fecharModal()">Fechar</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
}

// ==================================================
// ✅ DISPONIBILIZA GLOBALMENTE
// ==================================================
window.abrirModalChecklist = abrirModalChecklist;
window.carregarTabelaChecklist = carregarTabelaChecklist;
window.verDetalhesChecklist = verDetalhesChecklist;
window.ITENS_CHECKLIST = ITENS_CHECKLIST;