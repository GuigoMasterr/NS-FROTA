// ==================================================
// 🔧 CONTROLE DE MANUTENÇÃO
// ✅ VERSÃO ROBUSTA
// ==================================================

function getBD() {
  if (!window.BD) window.BD = { veiculos: [], manutencoes: [] };
  return window.BD;
}

function garantirModais() {
  if (!document.getElementById('modais')) {
    const c = document.createElement('div');
    c.id = 'modais';
    document.body.appendChild(c);
  }
}

window.abrirModalManutencao = function(tipo, manutencao = null) {
  try {
    const BD = getBD();
    garantirModais();
    
    const ehEdicao = !!manutencao;
    const tipoManutencao = tipo || manutencao?.tipo || 'preventiva';
    const ehPreventiva = tipoManutencao === 'preventiva';
    const veiculos = BD.veiculos || [];
    
    const opcoesVeiculos = veiculos.map(v => 
      `<option value="${v.id}" ${String(manutencao?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`
    ).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay aberto';
    modal.onclick = (e) => { if (e.target === modal) window.fecharModal && window.fecharModal(); };
    
    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-cabecalho">
          <h3 class="modal-titulo">${ehEdicao ? '✏️ Editar' : '➕ Cadastrar'} ${ehPreventiva ? '🔧 Preventiva' : '🛠️ Corretiva'}</h3>
          <button type="button" class="modal-fechar" onclick="window.fecharModal && window.fecharModal()">&times;</button>
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
                <input type="text" id="mServico" placeholder="Ex: Troca de óleo" required value="${manutencao?.servico || ''}">
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
                <input type="number" id="mIntervaloKm" value="${manutencao?.intervaloKm || ''}" min="0">
              </div>
              <div class="form-grupo">
                <label>Repetir a cada (dias)</label>
                <input type="number" id="mIntervaloDias" value="${manutencao?.intervaloDias || ''}" min="0">
              </div>
              ` : ''}
              <div class="form-grupo">
                <label>Custo (R$)</label>
                <input type="number" step="0.01" id="mCusto" value="${manutencao?.custo || ''}" min="0">
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
          <button type="button" class="btn btn-secundario" onclick="window.fecharModal && window.fecharModal()">Cancelar</button>
          <button type="button" class="btn btn-primario" id="btnSalvarManutencao">${ehEdicao ? '💾 Salvar' : '➕ Cadastrar'}</button>
        </div>
      </div>
    `;
    
    document.getElementById('modais').appendChild(modal);
    
    document.getElementById('btnSalvarManutencao').addEventListener('click', async () => {
      try {
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
        
        const dados = { veiculoId, tipo: tipoManutencao, servico, dataPrevista, kmPrevisto, custo, status };
        
        if (ehPreventiva) {
          dados.intervaloKm = document.getElementById('mIntervaloKm')?.value ? parseFloat(document.getElementById('mIntervaloKm').value) : null;
          dados.intervaloDias = document.getElementById('mIntervaloDias')?.value ? parseFloat(document.getElementById('mIntervaloDias').value) : null;
        }
        
        if (ehEdicao) dados.id = manutencao.id;
        else dados.criadoPor = window.usuarioAtual?.nome || 'Sistema';
        
        const resultado = await window.salvarManutencao(dados);
        if (resultado) {
          alert('✅ Manutenção salva!');
          window.fecharModal && window.fecharModal();
          window.carregarTabelaManutencao && window.carregarTabelaManutencao();
          window.atualizarDashboardCompleto && window.atualizarDashboardCompleto();
        } else {
          alert('❌ Erro ao salvar!');
        }
      } catch (e) {
        console.error(e);
        alert('❌ Erro: ' + e.message);
      }
    });
  } catch (e) {
    console.error('Erro abrir modal manutencao:', e);
    alert('❌ Erro: ' + e.message);
  }
};

window.excluirManutencao = async function(id) {
  try {
    if (!confirm('⚠️ Excluir esta manutenção?')) return;
    await window.excluirManutencaoBD(id);
    alert('✅ Manutenção excluída!');
    window.carregarTabelaManutencao && window.carregarTabelaManutencao();
    window.atualizarDashboardCompleto && window.atualizarDashboardCompleto();
  } catch (e) {
    alert('❌ Erro: ' + e.message);
  }
};

window.carregarTabelaManutencao = async function(filtroPlaca = 'todos') {
  try {
    const BD = getBD();
    const corpo = document.getElementById('tabelaManutencao');
    if (!corpo) return;
    
    let dados = BD.manutencoes || [];
    if (filtroPlaca !== 'todos') {
      dados = dados.filter(m => {
        const v = (BD.veiculos || []).find(x => String(x.id) === String(m.veiculoId));
        return v?.placa === filtroPlaca;
      });
    }
    
    dados = [...dados].sort((a, b) => new Date(b.dataPrevista) - new Date(a.dataPrevista));
    
    if (!dados.length) {
      corpo.innerHTML = `<tr><td colspan="8" class="estado-vazio"><div class="estado-vazio-icone">🔧</div><div class="estado-vazio-texto">Nenhuma manutenção registrada</div></td></tr>`;
      return;
    }
    
    corpo.innerHTML = dados.map(m => {
      const v = (BD.veiculos || []).find(x => String(x.id) === String(m.veiculoId));
      const sc = m.status === 'Concluída' ? 'badge-success' : m.status === 'Em Andamento' ? 'badge-warning' : 'badge-secondary';
      const seguro = JSON.stringify(m).replace(/"/g, '&quot;');
      return `<tr>
        <td>${m.dataPrevista ? new Date(m.dataPrevista).toLocaleDateString('pt-BR') : '—'}</td>
        <td class="font-mono font-semibold">${v?.placa || '—'}</td>
        <td>${m.tipo === 'preventiva' ? '<span class="badge badge-info">🔧 Preventiva</span>' : '<span class="badge badge-danger">🛠️ Corretiva</span>'}</td>
        <td>${m.servico || '—'}</td>
        <td>${m.kmPrevisto ? Number(m.kmPrevisto).toLocaleString('pt-BR') : '—'} km</td>
        <td>${m.custo ? window.Utils?.formatarMoeda(m.custo) || ('R$ ' + Number(m.custo).toFixed(2)) : '—'}</td>
        <td><span class="badge ${sc}">${m.status || 'Pendente'}</span></td>
        <td>
          <button class="btn btn-sm" style="background:#fef3c7; color:#92400e; margin-right:0.25rem;" onclick='window.abrirModalManutencao("${m.tipo}", ${seguro})'><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-sm" style="background:#fee2e2; color:#991b1b;" onclick="window.excluirManutencao('${m.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    console.error('Erro carregar tabela manutencao:', e);
  }
};

console.log('✅ manutencao.js carregado');
