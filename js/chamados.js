// ==================================================
// 🚨 CHAMADOS - VERSÃO ROBUSTA
// ==================================================
function _getBD() { return window.getBD ? window.getBD() : (window.BD || {}); }
function _fm() { window.fecharModal && window.fecharModal(); }
function _garantirModais() { if (!document.getElementById('modais')) { const c=document.createElement('div'); c.id='modais'; document.body.appendChild(c); } }

window.abrirModalChamado = function(chamado = null) {
  try {
    const BD = _getBD();
    _garantirModais();
    const ehEdicao = !!chamado;
    const veiculos = BD.veiculos || [];
    const opcoesVeiculos = veiculos.map(v => `<option value="${v.id}" ${String(chamado?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay aberto';
    modal.onclick = (e) => { if (e.target === modal) _fm(); };
    modal.innerHTML = `
      <div class="modal-container" style="max-width:550px;">
        <div class="modal-cabecalho">
          <h3 class="modal-titulo">📢 ${ehEdicao ? '✏️ Editar' : '➕ Registrar'} Chamado</h3>
          <button type="button" class="modal-fechar" onclick="_fm()">&times;</button>
        </div>
        <div class="modal-corpo">
          <form id="formChamado">
            <div class="form-grid">
              <div class="form-grupo"><label>Veículo *</label><select id="chVeiculo" required><option value="">Selecione</option>${opcoesVeiculos}</select></div>
              <div class="form-grupo"><label>Tipo *</label><select id="chTipo" required>
                <option value="Problema Mecânico" ${chamado?.tipo==='Problema Mecânico'?'selected':''}>🔧 Problema Mecânico</option>
                <option value="Sinistro" ${chamado?.tipo==='Sinistro'?'selected':''}>💥 Sinistro</option>
                <option value="Elétrico" ${chamado?.tipo==='Elétrico'?'selected':''}>⚡ Elétrico</option>
                <option value="Outro" ${chamado?.tipo==='Outro'?'selected':''}>📋 Outro</option>
              </select></div>
              <div class="form-grupo"><label>Obra/Local *</label><input type="text" id="chObra" required value="${chamado?.obra||''}"></div>
              <div class="form-grupo"><label>KM *</label><input type="number" id="chKm" required value="${chamado?.km||''}" min="0"></div>
              <div class="form-grupo" style="grid-column:1/-1;"><label>Descrição *</label><textarea id="chDescricao" rows="3" required>${chamado?.descricao||''}</textarea></div>
              <div class="form-grupo"><label>Status</label><select id="chStatus">
                <option value="Aberto" ${chamado?.status==='Aberto'?'selected':''}>🔴 Aberto</option>
                <option value="Em Andamento" ${chamado?.status==='Em Andamento'?'selected':''}>🟡 Em Andamento</option>
                <option value="Resolvido" ${chamado?.status==='Resolvido'?'selected':''}>🟢 Resolvido</option>
              </select></div>
            </div>
          </form>
        </div>
        <div class="modal-rodape">
          <button type="button" class="btn btn-secundario" onclick="_fm()">Cancelar</button>
          <button type="button" class="btn btn-perigo" id="btnSalvarChamado">${ehEdicao?'💾 Salvar':'➕ Registrar'}</button>
        </div>
      </div>`;
    document.getElementById('modais').appendChild(modal);
    
    document.getElementById('btnSalvarChamado').addEventListener('click', async () => {
      try {
        const veicId = parseInt(document.getElementById('chVeiculo').value);
        const tipo = document.getElementById('chTipo').value;
        const obra = document.getElementById('chObra').value.trim();
        const km = parseFloat(document.getElementById('chKm').value);
        const descricao = document.getElementById('chDescricao').value.trim();
        const status = document.getElementById('chStatus').value;
        
        if (!veicId || !tipo || !obra || !descricao) { alert('❌ Preencha todos os campos!'); return; }
        if (isNaN(km) || km < 0) { alert('❌ KM inválido!'); return; }
        
        const dados = { veiculoId: veicId, tipo, obra, km, descricao, status, responsavel: chamado?.responsavel || window.usuarioAtual?.nome || 'Administrador', data: chamado?.data || new Date().toISOString() };
        if (ehEdicao) dados.id = chamado.id;
        
        const r = await window.salvarChamado(dados);
        if (r) { alert('✅ Chamado salvo!'); _fm(); window.carregarTabelaChamados && window.carregarTabelaChamados(); window.atualizarDashboardCompleto && window.atualizarDashboardCompleto(); }
        else alert('❌ Erro!');
      } catch (e) { alert('❌ Erro: ' + e.message); }
    });
  } catch (e) { alert('❌ Erro: ' + e.message); }
};

window.excluirChamado = async function(id) {
  try { if (!confirm('⚠️ Excluir este chamado?')) return; await window.excluirChamadoBD(id); alert('✅ Excluído!'); window.carregarTabelaChamados && window.carregarTabelaChamados(); window.atualizarDashboardCompleto && window.atualizarDashboardCompleto(); }
  catch (e) { alert('❌ Erro: ' + e.message); }
};

window.alterarStatusChamado = async function(id, novoStatus) {
  try {
    const BD = _getBD();
    const c = (BD.chamados || []).find(x => String(x.id) === String(id));
    if (c) { c.status = novoStatus; await window.salvarChamado(c); window.carregarTabelaChamados && window.carregarTabelaChamados(); window.atualizarDashboardCompleto && window.atualizarDashboardCompleto(); }
  } catch (e) { console.error(e); }
};

window.carregarTabelaChamados = async function() {
  try {
    const BD = _getBD();
    const corpo = document.getElementById('tabelaChamados');
    if (!corpo) return;
    const lista = [...(BD.chamados || [])].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    if (!lista.length) { corpo.innerHTML = `<tr><td colspan="8" class="estado-vazio"><div class="estado-vazio-icone">📢</div><div class="estado-vazio-texto">Nenhum chamado registrado</div></td></tr>`; return; }
    
    const sl = { 'Aberto': '<span class="badge badge-danger">🔴 Aberto</span>', 'Em Andamento': '<span class="badge badge-warning">🟡 Em Andamento</span>', 'Resolvido': '<span class="badge badge-success">🟢 Resolvido</span>' };
    
    corpo.innerHTML = lista.map(c => {
      const v = (BD.veiculos || []).find(x => String(x.id) === String(c.veiculoId));
      const dt = c.data ? new Date(c.data).toLocaleDateString('pt-BR') : '—';
      const seguro = JSON.stringify(c).replace(/"/g, '&quot;');
      return `<tr>
        <td>${dt}</td><td class="font-mono font-semibold">${v?.placa || '—'}</td><td>${c.tipo || '—'}</td><td>${c.obra || '—'}</td>
        <td>${c.km ? Number(c.km).toLocaleString('pt-BR') : '—'} km</td>
        <td>${sl[c.status] || c.status}</td><td>${c.responsavel || '—'}</td>
        <td><div style="display:flex;gap:0.25rem;flex-wrap:wrap;">
          ${c.status !== 'Resolvido' ? `<button class="btn btn-sm" style="background:#d1fae5;color:#065f46;" onclick="window.alterarStatusChamado('${c.id}','Resolvido')"><i class="fa-solid fa-check"></i></button>` : ''}
          <button class="btn btn-sm" style="background:#fef3c7;color:#92400e;" onclick='window.abrirModalChamado(${seguro})'><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-sm" style="background:#fee2e2;color:#991b1b;" onclick="window.excluirChamado('${c.id}')"><i class="fa-solid fa-trash"></i></button>
        </div></td></tr>`;
    }).join('');
  } catch (e) { console.error(e); }
};

console.log('✅ chamados.js carregado');
