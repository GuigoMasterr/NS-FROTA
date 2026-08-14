// ==================================================
// ✅ CHECK-LIST + 🚛 ALOCAÇÕES + 👤 USUÁRIOS
// VERSÃO ROBUSTA - Tudo em um arquivo para simplicidade
// ==================================================
function _getBD() { return window.getBD ? window.getBD() : (window.BD || {}); }
function _fm() { window.fecharModal && window.fecharModal(); }
function _garantirModais() { if (!document.getElementById('modais')) { const c=document.createElement('div'); c.id='modais'; document.body.appendChild(c); } }

const ITENS_CHECKLIST = [
  { id: 'pneus', label: '🚛 Pneus e Calibragem' },
  { id: 'freios', label: '🛑 Freios' },
  { id: 'oleo', label: '🛢️ Nível de Óleo' },
  { id: 'agua', label: '💧 Nível de Água' },
  { id: 'bateria', label: '🔋 Bateria' },
  { id: 'lampadas', label: '💡 Luzes' },
  { id: 'setas', label: '↪️ Setas' },
  { id: 'limpadores', label: '🌧️ Limpadores' },
  { id: 'retrovisores', label: '🪞 Retrovisores' },
  { id: 'cintos', label: '🦺 Cintos' },
  { id: 'extintor', label: '🧯 Extintor' },
  { id: 'triangulo', label: '⚠️ Triângulo' },
  { id: 'macaco', label: '🔧 Macaco' },
  { id: 'documentos', label: '📄 Documentação' },
  { id: 'limpeza', label: '🧹 Limpeza' }
];
window.ITENS_CHECKLIST = ITENS_CHECKLIST;

// ==================== CHECK-LIST ====================
window.abrirModalChecklist = function(checklist = null) {
  try {
    const BD = _getBD();
    _garantirModais();
    const veiculos = BD.veiculos || [];
    const opcoesVeiculos = veiculos.map(v => `<option value="${v.id}" ${String(checklist?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`).join('');
    
    const itensHTML = ITENS_CHECKLIST.map(item => {
      const valor = checklist?.itens?.[item.id] || 'bom';
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid #f1f5f9;">
        <span style="font-size:0.875rem;">${item.label}</span>
        <div style="display:flex;gap:0.5rem;">
          <label style="display:flex;align-items:center;gap:0.2rem;font-size:0.8rem;cursor:pointer;"><input type="radio" name="item_${item.id}" value="bom" ${valor==='bom'?'checked':''}><span style="color:#059669;">✅ Bom</span></label>
          <label style="display:flex;align-items:center;gap:0.2rem;font-size:0.8rem;cursor:pointer;"><input type="radio" name="item_${item.id}" value="regular" ${valor==='regular'?'checked':''}><span style="color:#d97706;">⚠️ Regular</span></label>
          <label style="display:flex;align-items:center;gap:0.2rem;font-size:0.8rem;cursor:pointer;"><input type="radio" name="item_${item.id}" value="ruim" ${valor==='ruim'?'checked':''}><span style="color:#dc2626;">❌ Ruim</span></label>
        </div></div>`;
    }).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay aberto';
    modal.onclick = (e) => { if (e.target === modal) _fm(); };
    modal.innerHTML = `
      <div class="modal-container" style="max-width:750px;">
        <div class="modal-cabecalho"><h3 class="modal-titulo">📋 Novo Check-list</h3><button type="button" class="modal-fechar" onclick="_fm()">&times;</button></div>
        <div class="modal-corpo">
          <form id="formChecklist">
            <div class="form-grid" style="margin-bottom:1rem;">
              <div class="form-grupo"><label>Veículo *</label><select id="cVeiculo" required><option value="">Selecione</option>${opcoesVeiculos}</select></div>
              <div class="form-grupo"><label>Motorista *</label><input type="text" id="cMotorista" required value="${checklist?.motorista || window.usuarioAtual?.nome || ''}"></div>
              <div class="form-grupo"><label>Data *</label><input type="date" id="cData" required value="${checklist?.data?.split('T')[0] || new Date().toISOString().split('T')[0]}"></div>
              <div class="form-grupo"><label>KM *</label><input type="number" id="cKm" required value="${checklist?.km || ''}" min="0"></div>
            </div>
            <div style="font-weight:600;margin-bottom:0.5rem;">🔍 Itens de Inspeção</div>
            <div style="background:#f8fafc;border-radius:8px;padding:0.75rem 1rem;margin-bottom:1rem;">${itensHTML}</div>
            <div class="form-grupo"><label>Observações</label><textarea id="cObservacoes" rows="2">${checklist?.observacoes || ''}</textarea></div>
          </form>
        </div>
        <div class="modal-rodape">
          <button type="button" class="btn btn-secundario" onclick="_fm()">Cancelar</button>
          <button type="button" class="btn btn-primario" id="btnSalvarChecklist">💾 Salvar</button>
        </div>
      </div>`;
    document.getElementById('modais').appendChild(modal);
    
    document.getElementById('btnSalvarChecklist').addEventListener('click', async () => {
      try {
        const veiculoId = parseInt(document.getElementById('cVeiculo').value);
        const motorista = document.getElementById('cMotorista').value.trim();
        const data = document.getElementById('cData').value;
        const km = parseInt(document.getElementById('cKm').value) || 0;
        const observacoes = document.getElementById('cObservacoes').value.trim();
        
        if (!veiculoId || !motorista || !data || !km) { alert('❌ Preencha todos os campos!'); return; }
        
        const itens = {}; let temRuim = false;
        ITENS_CHECKLIST.forEach(item => {
          const sel = document.querySelector(`input[name="item_${item.id}"]:checked`);
          itens[item.id] = sel?.value || 'bom';
          if (itens[item.id] === 'ruim') temRuim = true;
        });
        
        let statusGeral = 'Aprovado';
        if (temRuim) statusGeral = 'Reprovado';
        else if (Object.values(itens).some(v => v === 'regular')) statusGeral = 'Pendente';
        
        const veiculo = veiculos.find(v => v.id === veiculoId);
        const dados = { veiculoId, placaVeiculo: veiculo?.placa || '', motorista, data: new Date(data).toISOString(), km, itens, statusGeral, observacoes, criadoPor: window.usuarioAtual?.nome || 'Sistema' };
        if (checklist?.id) dados.id = checklist.id;
        
        const r = await window.salvarChecklist(dados);
        if (r) {
          alert(statusGeral === 'Reprovado' ? '⚠️ Check-list salvo com itens reprovados!' : '✅ Check-list salvo!');
          _fm(); window.carregarTabelaChecklist && window.carregarTabelaChecklist();
          window.atualizarDashboardCompleto && window.atualizarDashboardCompleto();
        } else alert('❌ Erro!');
      } catch (e) { alert('❌ Erro: ' + e.message); }
    });
  } catch (e) { alert('❌ Erro: ' + e.message); }
};

window.carregarTabelaChecklist = async function() {
  try {
    const BD = _getBD();
    const corpo = document.getElementById('tabelaChecklist');
    if (!corpo) return;
    const lista = [...(BD.checklists || [])].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    if (!lista.length) { corpo.innerHTML = `<tr><td colspan="6" class="estado-vazio"><div class="estado-vazio-icone">📋</div><div class="estado-vazio-texto">Nenhum check-list realizado</div></td></tr>`; return; }
    
    const sm = { 'Aprovado': '<span class="badge badge-success">✅ Aprovado</span>', 'Pendente': '<span class="badge badge-warning">⚠️ Pendente</span>', 'Reprovado': '<span class="badge badge-danger">❌ Reprovado</span>' };
    
    corpo.innerHTML = lista.slice(0, 50).map(c => {
      const v = (BD.veiculos || []).find(x => String(x.id) === String(c.veiculoId));
      const seguro = JSON.stringify(c).replace(/"/g, '&quot;');
      return `<tr>
        <td>${c.data ? new Date(c.data).toLocaleDateString('pt-BR') : '—'}</td>
        <td class="font-mono font-semibold">${c.placaVeiculo || v?.placa || '—'}</td>
        <td>${c.motorista || '—'}</td>
        <td>${c.km ? Number(c.km).toLocaleString('pt-BR') : '—'} km</td>
        <td>${sm[c.statusGeral] || c.statusGeral || '<span class="badge badge-secondary">—</span>'}</td>
        <td><button class="btn btn-sm btn-secundario" onclick='window.verDetalhesChecklist(${seguro})'><i class="fa-solid fa-eye"></i> Ver</button></td>
      </tr>`;
    }).join('');
  } catch (e) { console.error(e); }
};

window.verDetalhesChecklist = function(checklist) {
  try {
    _garantirModais();
    const itensDetalhes = ITENS_CHECKLIST.map(item => {
      const valor = checklist.itens?.[item.id] || 'bom';
      const cor = valor === 'bom' ? '#059669' : valor === 'regular' ? '#d97706' : '#dc2626';
      const icone = valor === 'bom' ? '✅' : valor === 'regular' ? '⚠️' : '❌';
      return `<div style="display:flex;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid #f1f5f9;"><span>${item.label}</span><span style="color:${cor};font-weight:600;">${icone} ${valor.charAt(0).toUpperCase()+valor.slice(1)}</span></div>`;
    }).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay aberto';
    modal.onclick = (e) => { if (e.target === modal) _fm(); };
    modal.innerHTML = `
      <div class="modal-container" style="max-width:600px;">
        <div class="modal-cabecalho"><h3 class="modal-titulo">📋 Detalhes</h3><button type="button" class="modal-fechar" onclick="_fm()">&times;</button></div>
        <div class="modal-corpo">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
            <div><strong>Veículo:</strong> ${checklist.placaVeiculo || '—'}</div>
            <div><strong>Motorista:</strong> ${checklist.motorista || '—'}</div>
            <div><strong>Data:</strong> ${checklist.data ? new Date(checklist.data).toLocaleDateString('pt-BR') : '—'}</div>
            <div><strong>KM:</strong> ${checklist.km ? Number(checklist.km).toLocaleString('pt-BR') : '—'} km</div>
          </div>
          <div style="font-weight:600;margin-bottom:0.5rem;">Resultado</div>
          <div style="background:#f8fafc;border-radius:8px;padding:0.75rem 1rem;">${itensDetalhes}</div>
          ${checklist.observacoes ? `<div style="margin-top:1rem;"><strong>Observações:</strong><p style="margin-top:0.5rem;padding:0.75rem;background:#f8fafc;border-radius:8px;">${checklist.observacoes}</p></div>` : ''}
        </div>
        <div class="modal-rodape"><button type="button" class="btn btn-primario" onclick="_fm()">Fechar</button></div>
      </div>`;
    document.getElementById('modais').appendChild(modal);
  } catch (e) { console.error(e); }
};

// ==================== ALOCAÇÕES ====================
window.abrirModalAlocacao = function(alocacao = null) {
  try {
    const BD = _getBD();
    _garantirModais();
    const veiculos = BD.veiculos || [];
    const locais = BD.locais || [];
    const opcoesVeiculos = veiculos.map(v => `<option value="${v.id}" ${String(alocacao?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`).join('');
    const opcoesLocais = locais.map(l => `<option value="${l.nome}">${l.nome}</option>`).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay aberto';
    modal.onclick = (e) => { if (e.target === modal) _fm(); };
    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-cabecalho"><h3 class="modal-titulo">${alocacao?'✏️ Editar':'➕ Nova'} Alocação</h3><button type="button" class="modal-fechar" onclick="_fm()">&times;</button></div>
        <div class="modal-corpo">
          <form id="formAlocacao">
            <div class="form-grid">
              <div class="form-grupo"><label>Veículo *</label><select id="aVeiculo" required><option value="">Selecione</option>${opcoesVeiculos}</select></div>
              <div class="form-grupo"><label>Motorista *</label><input type="text" id="aMotorista" required value="${alocacao?.motorista || ''}"></div>
              <div class="form-grupo"><label>Data Saída *</label><input type="date" id="aDataSaida" required value="${alocacao?.dataSaida || new Date().toISOString().split('T')[0]}"></div>
              <div class="form-grupo"><label>KM Saída *</label><input type="number" id="aKmSaida" required value="${alocacao?.kmSaida || ''}" min="0"></div>
              <div class="form-grupo"><label>Origem *</label><select id="aOrigem" required><option value="">Selecione</option>${opcoesLocais}</select></div>
              <div class="form-grupo"><label>Destino *</label><select id="aDestino" required><option value="">Selecione</option>${opcoesLocais}</select></div>
              <div class="form-grupo"><label>Data Retorno</label><input type="date" id="aDataRetorno" value="${alocacao?.dataRetorno || ''}"></div>
              <div class="form-grupo"><label>KM Retorno</label><input type="number" id="aKmRetorno" value="${alocacao?.kmRetorno || ''}" min="0"></div>
            </div>
          </form>
        </div>
        <div class="modal-rodape">
          <button type="button" class="btn btn-secundario" onclick="_fm()">Cancelar</button>
          <button type="button" class="btn btn-primario" id="btnSalvarAlocacao">💾 Salvar</button>
        </div>
      </div>`;
    document.getElementById('modais').appendChild(modal);
    
    document.getElementById('btnSalvarAlocacao').addEventListener('click', async () => {
      try {
        const veiculoId = document.getElementById('aVeiculo').value;
        const motorista = document.getElementById('aMotorista').value.trim();
        const dataSaida = document.getElementById('aDataSaida').value;
        const kmSaida = parseInt(document.getElementById('aKmSaida').value) || 0;
        const origem = document.getElementById('aOrigem').value;
        const destino = document.getElementById('aDestino').value;
        const dataRetorno = document.getElementById('aDataRetorno').value || null;
        const kmRetorno = document.getElementById('aKmRetorno').value ? parseInt(document.getElementById('aKmRetorno').value) : null;
        
        if (!veiculoId || !motorista || !dataSaida || !origem || !destino) { alert('❌ Preencha todos os campos!'); return; }
        
        const dados = { veiculoId: parseInt(veiculoId), motorista, dataSaida, kmSaida, origem, destino, dataRetorno, kmRetorno, status: dataRetorno ? 'Concluída' : 'Em Andamento' };
        if (alocacao) dados.id = alocacao.id;
        
        const r = await window.salvarAlocacao(dados);
        if (r) { alert('✅ Alocação salva!'); _fm(); window.carregarTabelaAlocacoes && window.carregarTabelaAlocacoes(); window.atualizarDashboardCompleto && window.atualizarDashboardCompleto(); }
        else alert('❌ Erro!');
      } catch (e) { alert('❌ Erro: ' + e.message); }
    });
  } catch (e) { alert('❌ Erro: ' + e.message); }
};

window.excluirAlocacao = async function(id) {
  try { if (!confirm('⚠️ Excluir esta alocação?')) return; await window.excluirAlocacaoBD(id); alert('✅ Excluída!'); window.carregarTabelaAlocacoes && window.carregarTabelaAlocacoes(); }
  catch (e) { alert('❌ Erro: ' + e.message); }
};

window.carregarTabelaAlocacoes = async function() {
  try {
    const BD = _getBD();
    const corpo = document.getElementById('tabelaAlocacoes');
    if (!corpo) return;
    const alocacoes = BD.alocacoes || [];
    
    if (!alocacoes.length) { corpo.innerHTML = `<tr><td colspan="10" class="estado-vazio"><div class="estado-vazio-icone">🚛</div><div class="estado-vazio-texto">Nenhuma alocação registrada</div></td></tr>`; return; }
    
    corpo.innerHTML = alocacoes.map(a => {
      const v = (BD.veiculos || []).find(x => String(x.id) === String(a.veiculoId));
      const sc = a.status === 'Concluída' ? 'badge-success' : a.status === 'Em Andamento' ? 'badge-warning' : 'badge-secondary';
      const seguro = JSON.stringify(a).replace(/"/g, '&quot;');
      return `<tr>
        <td>${a.dataSaida ? new Date(a.dataSaida).toLocaleDateString('pt-BR') : '—'}</td>
        <td class="font-mono font-semibold">${v?.placa || '—'}</td><td>${a.motorista || '—'}</td>
        <td>${a.origem || '—'}</td><td>${a.destino || '—'}</td>
        <td>${a.kmSaida ? Number(a.kmSaida).toLocaleString('pt-BR') : '—'} km</td>
        <td>${a.dataRetorno ? new Date(a.dataRetorno).toLocaleDateString('pt-BR') : '—'}</td>
        <td>${a.kmRetorno ? Number(a.kmRetorno).toLocaleString('pt-BR') : '—'} km</td>
        <td><span class="badge ${sc}">${a.status || 'Pendente'}</span></td>
        <td>
          <button class="btn btn-sm" style="background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='window.abrirModalAlocacao(${seguro})'><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-sm" style="background:#fee2e2;color:#991b1b;" onclick="window.excluirAlocacao('${a.id}')"><i class="fa-solid fa-trash"></i></button>
        </td></tr>`;
    }).join('');
  } catch (e) { console.error(e); }
};

// ==================== USUÁRIOS ====================
window.abrirModalUsuario = function(usuario = null) {
  try {
    _garantirModais();
    const ehEdicao = !!usuario;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay aberto';
    modal.onclick = (e) => { if (e.target === modal) _fm(); };
    modal.innerHTML = `
      <div class="modal-container" style="max-width:500px;">
        <div class="modal-cabecalho"><h3 class="modal-titulo">${ehEdicao?'✏️ Editar':'➕ Novo'} Usuário</h3><button type="button" class="modal-fechar" onclick="_fm()">&times;</button></div>
        <div class="modal-corpo">
          <form id="formUsuario">
            <div class="form-grid">
              <div class="form-grupo"><label>Nome *</label><input type="text" id="uNome" required value="${usuario?.nome || ''}"></div>
              <div class="form-grupo"><label>Usuário *</label><input type="text" id="uUsuario" required value="${usuario?.usuario || ''}" ${ehEdicao?'readonly':''}></div>
              <div class="form-grupo"><label>Senha ${ehEdicao?'(deixe em branco para manter)':'*'}</label><input type="password" id="uSenha" ${ehEdicao?'':'required'} placeholder="Mínimo 6 caracteres"></div>
              <div class="form-grupo"><label>Perfil *</label><select id="uPerfil" required>
                <option value="admin" ${usuario?.perfil==='admin'?'selected':''}>👑 Administrador</option>
                <option value="operador" ${usuario?.perfil==='operador'?'selected':''}>⚙️ Operador</option>
                <option value="operacional" ${usuario?.perfil==='operacional'?'selected':''}>🚛 Operacional</option>
                <option value="motorista" ${usuario?.perfil==='motorista'?'selected':''}>🧑‍✈️ Motorista</option>
              </select></div>
              <div class="form-grupo"><label>Status</label><select id="uAtivo">
                <option value="true" ${usuario?.ativo !== false ? 'selected' : ''}>✅ Ativo</option>
                <option value="false" ${usuario?.ativo === false ? 'selected' : ''}>⛔ Inativo</option>
              </select></div>
            </div>
          </form>
        </div>
        <div class="modal-rodape">
          <button type="button" class="btn btn-secundario" onclick="_fm()">Cancelar</button>
          <button type="button" class="btn btn-primario" id="btnSalvarUsuario">💾 Salvar</button>
        </div>
      </div>`;
    document.getElementById('modais').appendChild(modal);
    
    document.getElementById('btnSalvarUsuario').addEventListener('click', async () => {
      try {
        const BD = _getBD();
        const nome = document.getElementById('uNome').value.trim();
        const usuarioLogin = document.getElementById('uUsuario').value.trim();
        const senha = document.getElementById('uSenha').value;
        const perfil = document.getElementById('uPerfil').value;
        const ativo = document.getElementById('uAtivo').value === 'true';
        
        if (!nome || !usuarioLogin) { alert('❌ Preencha nome e usuário!'); return; }
        if (!ehEdicao && senha.length < 6) { alert('❌ Senha deve ter pelo menos 6 caracteres!'); return; }
        if (ehEdicao && senha && senha.length < 6) { alert('❌ Senha deve ter pelo menos 6 caracteres!'); return; }
        
        if (!ehEdicao && BD.usuarios?.find(u => u.usuario === usuarioLogin)) { alert('❌ Usuário já existe!'); return; }
        
        const dados = { nome, usuario: usuarioLogin, perfil, ativo };
        if (ehEdicao) { dados.id = usuario.id; dados.senha = senha || usuario.senha; }
        else { dados.senha = senha; }
        
        const r = await window.salvarUsuario(dados);
        if (r) { alert('✅ Usuário salvo!'); _fm(); window.carregarTabelaUsuarios && window.carregarTabelaUsuarios(); }
        else alert('❌ Erro!');
      } catch (e) { alert('❌ Erro: ' + e.message); }
    });
  } catch (e) { alert('❌ Erro: ' + e.message); }
};

window.excluirUsuario = async function(id) {
  try {
    if (!confirm('⚠️ Excluir este usuário?')) return;
    const BD = _getBD();
    BD.usuarios = (BD.usuarios || []).filter(u => String(u.id) !== String(id));
    if (window.salvarDados) window.salvarDados();
    else localStorage.setItem('bd_frotas', JSON.stringify(BD));
    alert('✅ Usuário excluído!');
    window.carregarTabelaUsuarios && window.carregarTabelaUsuarios();
  } catch (e) { alert('❌ Erro: ' + e.message); }
};

window.carregarTabelaUsuarios = function() {
  try {
    const BD = _getBD();
    const corpo = document.getElementById('tabelaUsuarios');
    if (!corpo) return;
    const usuarios = BD.usuarios || [];
    
    if (!usuarios.length) { corpo.innerHTML = `<tr><td colspan="5" class="estado-vazio"><div class="estado-vazio-icone">👥</div><div class="estado-vazio-texto">Nenhum usuário cadastrado</div></td></tr>`; return; }
    
    const pm = { admin: '<span class="badge badge-danger">👑 Admin</span>', operador: '<span class="badge badge-info">⚙️ Operador</span>', operacional: '<span class="badge badge-warning">🚛 Operacional</span>', motorista: '<span class="badge badge-secondary">🧑‍✈️ Motorista</span>' };
    
    corpo.innerHTML = usuarios.map(u => {
      const seguro = JSON.stringify(u).replace(/"/g, '&quot;');
      return `<tr>
        <td><strong>${u.nome}</strong></td><td class="font-mono">${u.usuario}</td>
        <td>${pm[u.perfil] || u.perfil || '<span class="badge badge-secondary">—</span>'}</td>
        <td>${u.ativo !== false ? '<span class="badge badge-success">✅ Ativo</span>' : '<span class="badge badge-danger">⛔ Inativo</span>'}</td>
        <td>
          <button class="btn btn-sm" style="background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='window.abrirModalUsuario(${seguro})'><i class="fa-solid fa-pen"></i></button>
          ${u.usuario !== 'admin' ? `<button class="btn btn-sm" style="background:#fee2e2;color:#991b1b;" onclick="window.excluirUsuario('${u.id}')"><i class="fa-solid fa-trash"></i></button>` : ''}
        </td></tr>`;
    }).join('');
  } catch (e) { console.error(e); }
};

console.log('✅ checklist + alocacoes + usuarios carregados');
