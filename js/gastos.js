// ==================================================
// 💰 CONTROLE DE GASTOS - VERSÃO ROBUSTA
// ==================================================

function _getBD() { return window.getBD ? window.getBD() : (window.BD || {}); }
function _garantirModais() {
  if (!document.getElementById('modais')) {
    const c = document.createElement('div'); c.id = 'modais'; document.body.appendChild(c);
  }
}
function _fm() { window.fecharModal && window.fecharModal(); }
function _formatarMoeda(v) {
  if (window.Utils && window.Utils.formatarMoeda) return window.Utils.formatarMoeda(v);
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

window.abrirModalGasto = function(gasto = null) {
  try {
    const BD = _getBD();
    _garantirModais();
    const ehEdicao = !!gasto;
    const veiculos = BD.veiculos || [];
    const obras = BD.obras || BD.locais?.map(l => l.nome) || [];
    
    const opcoesVeiculos = veiculos.map(v => 
      `<option value="${v.id}" ${String(gasto?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`
    ).join('');
    const opcoesObras = obras.map(o => `<option value="${o}" ${gasto?.obra === o ? 'selected' : ''}>${o}</option>`).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay aberto';
    modal.onclick = (e) => { if (e.target === modal) _fm(); };
    
    modal.innerHTML = `
      <div class="modal-container" style="max-width: 550px;">
        <div class="modal-cabecalho">
          <h3 class="modal-titulo">💰 ${ehEdicao ? '✏️ Editar' : '➕ Lançar'} Gasto</h3>
          <button type="button" class="modal-fechar" onclick="_fm()">&times;</button>
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
                <input type="number" step="0.01" id="gValor" required value="${gasto?.valor || ''}" min="0.01">
              </div>
              <div class="form-grupo">
                <label>Veículo <span class="obrigatorio">*</span></label>
                <select id="gVeiculo" required><option value="">Selecione</option>${opcoesVeiculos}</select>
              </div>
              <div class="form-grupo">
                <label>Obra / Local <span class="obrigatorio">*</span></label>
                <select id="gObra" required><option value="">Selecione</option>${opcoesObras}</select>
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
                <input type="text" id="gObs" value="${gasto?.observacao || ''}">
              </div>
            </div>
          </form>
        </div>
        <div class="modal-rodape">
          <button type="button" class="btn btn-secundario" onclick="_fm()">Cancelar</button>
          <button type="button" class="btn btn-sucesso" id="btnSalvarGasto">💾 Salvar Gasto</button>
        </div>
      </div>
    `;
    document.getElementById('modais').appendChild(modal);
    
    document.getElementById('btnSalvarGasto').addEventListener('click', async () => {
      try {
        const data = document.getElementById('gData').value;
        const veiculoId = parseInt(document.getElementById('gVeiculo').value);
        const obra = document.getElementById('gObra').value;
        const tipo = document.getElementById('gTipo').value;
        const valor = parseFloat(document.getElementById('gValor').value);
        const observacao = document.getElementById('gObs').value.trim();
        
        if (!data || !veiculoId || !obra || !tipo) { alert('❌ Preencha todos os campos!'); return; }
        if (!valor || valor <= 0) { alert('❌ Valor inválido!'); return; }
        
        const dados = { data, veiculoId, obra, tipo, valor, observacao, lancadoPor: window.usuarioAtual?.nome || 'Sistema' };
        if (ehEdicao) dados.id = gasto.id;
        
        const r = await window.salvarGasto(dados);
        if (r) {
          alert('✅ Gasto salvo!');
          _fm();
          window.carregarTabelaGastos && window.carregarTabelaGastos();
          window.atualizarDashboardCompleto && window.atualizarDashboardCompleto();
        } else alert('❌ Erro ao salvar!');
      } catch (e) { console.error(e); alert('❌ Erro: ' + e.message); }
    });
  } catch (e) { console.error(e); alert('❌ Erro: ' + e.message); }
};

window.excluirGasto = async function(id) {
  try {
    if (!confirm('⚠️ Excluir este lançamento?')) return;
    await window.excluirGastoBD(id);
    alert('✅ Gasto excluído!');
    window.carregarTabelaGastos && window.carregarTabelaGastos();
    window.atualizarDashboardCompleto && window.atualizarDashboardCompleto();
  } catch (e) { alert('❌ Erro: ' + e.message); }
};

window.carregarTabelaGastos = async function(filtroPlaca = 'todos') {
  try {
    const BD = _getBD();
    const corpo = document.getElementById('tabelaGastos');
    if (!corpo) return;
    
    let dados = BD.gastos || [];
    if (filtroPlaca !== 'todos') {
      dados = dados.filter(g => {
        const v = (BD.veiculos || []).find(x => String(x.id) === String(g.veiculoId));
        return v?.placa === filtroPlaca;
      });
    }
    dados = [...dados].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    if (!dados.length) {
      corpo.innerHTML = `<tr><td colspan="7" class="estado-vazio"><div class="estado-vazio-icone">💰</div><div class="estado-vazio-texto">Nenhum registro de gasto</div></td></tr>`;
      return;
    }
    
    const tipoIcone = { 'Combustível': '⛽', 'Manutenção': '🔧', 'Pneus': '🚛', 'Pedágio': '🛣️', 'Seguro': '🛡️', 'IPVA': '📄', 'Licenciamento': '📋', 'Multa': '⚠️', 'Outro': '📋' };
    
    corpo.innerHTML = dados.slice(0, 100).map(g => {
      const v = (BD.veiculos || []).find(x => String(x.id) === String(g.veiculoId));
      const seguro = JSON.stringify(g).replace(/"/g, '&quot;');
      return `<tr>
        <td>${g.data ? new Date(g.data).toLocaleDateString('pt-BR') : '—'}</td>
        <td class="font-mono font-semibold">${v?.placa || '—'}</td>
        <td>${tipoIcone[g.tipo] || '📋'} ${g.tipo || '—'}</td>
        <td>${g.obra || '—'}</td>
        <td><strong>${_formatarMoeda(g.valor)}</strong></td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g.observacao || '—'}</td>
        <td>
          <button class="btn btn-sm" style="background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='window.abrirModalGasto(${seguro})'><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-sm" style="background:#fee2e2;color:#991b1b;" onclick="window.excluirGasto('${g.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('');
  } catch (e) { console.error(e); }
};

console.log('✅ gastos.js carregado');
