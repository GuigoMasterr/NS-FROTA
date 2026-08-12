// ============================================================
// MELHORIAS IMPLEMENTADAS - ÁREA DE VEÍCULOS
// ============================================================
// 1. Remoção do campo "Responsável" do cadastro de veículos
// 2. Controle de acesso de motoristas a veículos específicos
// 3. Área de configuração para vincular motoristas ↔ veículos
// 4. Sub-área de documentos e pendências dos veículos
// 5. Visualizador seguro de documentos (sem download/print)
// ============================================================

// ---------- INICIALIZAÇÃO DAS NOVAS ESTRUTURAS ----------
(function() {
    if (!BD.acessosVeiculos) BD.acessosVeiculos = {};
    if (!BD.documentosVeiculos) BD.documentosVeiculos = {};
    salvarDados();
})();

// ---------- FUNÇÕES DE CONTROLE DE ACESSO ----------
function temAcessoVeiculo(placa) {
    if (!window.usuarioAtual) return false;
    // Admin e Supervisor veem todos os veículos
    if (ehAdmin() || ehSupervisor()) return true;
    // Para motoristas (perfil operacional), verificar vínculo
    const userId = window.usuarioAtual.id;
    const acessos = BD.acessosVeiculos[userId] || [];
    return acessos.includes(placa);
}

function getVeiculosPermitidos() {
    if (!window.usuarioAtual) return [];
    const todos = BD.veiculos || [];
    if (ehAdmin() || ehSupervisor()) return todos;
    const userId = window.usuarioAtual.id;
    const acessos = BD.acessosVeiculos[userId] || [];
    return todos.filter(v => acessos.includes(v.placa));
}

// ---------- 1. REMOÇÃO DO CAMPO "RESPONSÁVEL" ----------
// Sobrescreve a função abrirModalVeiculo original
const _abrirModalVeiculoOriginal = abrirModalVeiculo;
abrirModalVeiculo = function(v = null) {
    if (!ehAdmin()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    const ed = !!v;
    const cats = BD.config.categoriasVeiculos.map(c => `<option value="${c.id}" ${v?.categoria===c.id?'selected':''}>${c.nome}</option>`).join('');
    const sts = Object.entries(BD.config.statusVeiculos).map(([val,nome])=>`<option value="${val}" ${v?.status===val?'selected':''}>${nome}</option>`).join('');
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    m.innerHTML = `<div class="modal-corpo"><div class="modal-cabecalho"><h3 style="margin:0;">${ed?'<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Editar':'<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Cadastrar'} Veículo</h3><button class="btn-fechar" onclick="fecharModal()" title="Fechar">×</button></div><div class="modal-conteudo"><form id="formVeiculo">
        <div class="linha-form"><label>Placa *</label><input type="text" id="vPlaca" style="text-transform:uppercase;" required value="${v?.placa||''}" ${ed?'readonly':''} placeholder="ABC1D23"></div>
        <div class="linha-form"><label>Ano</label><input type="number" id="vAno" value="${v?.ano||''}" min="1990" max="2030"></div>
        <div class="linha-form"><label>Categoria *</label><select id="vCategoria" required><option value="">Selecione</option>${cats}</select></div>
        <div class="linha-form"><label>Marca / Modelo *</label><input type="text" id="vModelo" required value="${v?.modelo||''}"></div>
        <div class="linha-form"><label>Km Atual *</label><input type="number" id="vKm" required value="${v?.km_atual||0}" min="0"></div>
        <div class="linha-form"><label>Status</label><select id="vStatus">${sts}</select></div>
        <div class="linha-form"><label>Obra / Local *</label><input type="text" id="vObra" required value="${v?.obra_atual||''}"></div>
        <div class="botoes-form"><button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button><button type="submit" class="btn btn-primary">${ed?'💾 Salvar':'<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Cadastrar'}</button></div>
    </form></div></div>`;
    document.getElementById('modais').appendChild(m);
    
    document.getElementById('formVeiculo').addEventListener('submit', e => {
        e.preventDefault();
        const placa = document.getElementById('vPlaca').value.toUpperCase().trim();
        const categoria = document.getElementById('vCategoria').value;
        const modelo = document.getElementById('vModelo').value.trim();
        const ano = document.getElementById('vAno').value || null;
        const km = parseInt(document.getElementById('vKm').value) || 0;
        const status = document.getElementById('vStatus').value;
        const obra = document.getElementById('vObra').value.trim();
        
        const placaLimpa = placa.replace(/[^A-Z0-9]/g, '');
        if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placaLimpa) && !/^[A-Z]{3}[0-9]{4}$/.test(placaLimpa)) {
            mostrarToast('Placa inválida! Use: ABC1D23 ou ABC1234', 'erro');
            return;
        }
        if (!categoria || !modelo || !obra) { mostrarToast('Preencha todos os campos obrigatórios!', 'aviso'); return; }
        
        const dados = { placa, categoria, modelo, marca: modelo.split(' ')[0], ano, km_atual: km, km_inicial: ed ? (v?.km_inicial||km) : km, status, obra_atual: obra };
        
        if (ed) {
            const i = BD.veiculos.findIndex(x => String(x.id)===String(v.id));
            if (i!==-1) BD.veiculos[i] = { ...BD.veiculos[i], ...dados };
            registrarLog('edicao', `Editou veículo ${placa}`);
        } else {
            if (BD.veiculos.some(x => x.placa === placa)) { mostrarToast('Já existe veículo com esta placa!', 'erro'); return; }
            dados.id = gerarId(); BD.veiculos.push(dados);
            registrarLog('criacao', `Cadastrou veículo ${placa}`);
        }
        salvarDados(); mostrarToast('Veículo salvo com sucesso!', 'sucesso'); fecharModal();
        carregarTabelaVeiculos(); atualizarDashboard(); atualizarListaVeiculosNosFiltros();
    });
};

// ---------- 2. FILTRAGEM DE VEÍCULOS POR ACESSO ----------
// Sobrescreve carregarTabelaVeiculos para respeitar o controle de acesso
const _carregarTabelaVeiculosOriginal = carregarTabelaVeiculos;
carregarTabelaVeiculos = function() {
    const corpo = document.getElementById('tabelaVeiculos');
    if (!corpo) return;
    let vs = getVeiculosPermitidos();
    const fc = document.getElementById('filtroVeiculoCategoria')?.value || 'todas';
    const fs = document.getElementById('filtroVeiculoStatus')?.value || 'todos';
    if (fc !== 'todas') vs = vs.filter(v => v.categoria === fc);
    if (fs !== 'todos') vs = vs.filter(v => v.status === fs);
    
    const sc = document.getElementById('filtroVeiculoCategoria');
    if (sc && sc.options.length <= 1) BD.config.categoriasVeiculos.forEach(c => sc.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
    
    if (vs.length === 0) { corpo.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhum veículo encontrado</td></tr>'; return; }
    
    const sm = { disponivel:'<span class="badge badge-success"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg> Disponível</span>', alocado:'<span class="badge badge-info"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Alocado</span>', manutencao:'<span class="badge badge-warning"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.121 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Manutenção</span>', inativo:'<span class="badge badge-danger">⛔ Inativo</span>' };
    
    corpo.innerHTML = vs.map(v => {
        const cn = BD.config.categoriasVeiculos.find(c=>c.id===v.categoria)?.nome || v.categoria;
        const seg = JSON.stringify(v).replace(/"/g,'&quot;');
        const docs = BD.documentosVeiculos[v.placa] || [];
        const pendentes = docs.filter(d => d.status === 'pendente').length;
        const alertaDocs = pendentes > 0 ? `<span class="badge badge-danger" style="margin-left:0.25rem;" title="${pendentes} pendência(s) documental(is)">${pendentes}</span>` : '';
        
        return `<tr>
            <td style="font-family:monospace;font-weight:600;">${v.placa}${alertaDocs}</td>
            <td>${cn}</td>
            <td>${v.modelo}</td>
            <td>${Number(v.km_atual||0).toLocaleString('pt-BR')} km</td>
            <td>${v.obra_atual||'—'}</td>
            <td>${sm[v.status]||v.status}</td>
            <td style="white-space:nowrap;">
                <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#dbeafe;color:#1e40af;margin-right:0.25rem;" onclick="abrirModalDocumentosVeiculo('${v.placa}')" title="Documentos e Pendências">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    ${docs.length > 0 ? `<span style="background:#1e40af;color:white;border-radius:9999px;padding:0 0.35rem;font-size:0.65rem;margin-left:0.2rem;">${docs.length}</span>` : ''}
                </button>
                ${ehAdmin() ? `
                <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='abrirModalVeiculo(${seg})'>
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirVeiculo('${v.placa}')">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
                ` : ''}
            </td>
        </tr>`;
    }).join('');
};

// ---------- ATUALIZAR FILTROS DE VEÍCULOS PARA RESPEITAR ACESSO ----------
const _atualizarListaVeiculosNosFiltrosOriginal = atualizarListaVeiculosNosFiltros;
atualizarListaVeiculosNosFiltros = function() {
    popularFiltrosEstaticos();
    const vs = getVeiculosPermitidos();
    ['filtroChecklistVeiculo', 'filtroManutencaoVeiculo', 'filtroGastosVeiculo', 'filtroChamadosVeiculo', 'filtroAlocacoesVeiculo'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const atual = sel.value;
        sel.innerHTML = '<option value="todos">Todos os Veículos</option>';
        vs.forEach(v => { sel.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.modelo}</option>`; });
        if (vs.some(v => v.placa === atual)) sel.value = atual;
    });
};

// ---------- 3. ÁREA DE GERENCIAMENTO DE ACESSOS ----------
// Sobrescreve carregarTabelaUsuarios para adicionar botão de acessos
const _carregarTabelaUsuariosOriginal = carregarTabelaUsuarios;
carregarTabelaUsuarios = function() {
    const corpo = document.getElementById('tabelaUsuarios');
    if (!corpo) return;
    const us = BD.usuarios || [];
    if (us.length === 0) { corpo.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhum usuário</td></tr>'; return; }
    
    corpo.innerHTML = us.map(u => {
        const pn = BD.config.perfis[u.perfil]?.nome || u.perfil;
        const pb = u.perfil==='admin'?'badge-danger':u.perfil==='supervisor'?'badge-warning':u.perfil==='operacional'?'badge-info':'badge-success';
        const seg = JSON.stringify(u).replace(/"/g,'&quot;');
        const qtdAcessos = u.perfil === 'operacional' ? (BD.acessosVeiculos[u.id] || []).length : '—';
        const podeGerenciarAcessos = u.perfil === 'operacional';
        
        return `<tr>
            <td style="font-weight:600;">${u.nome}</td>
            <td style="font-family:monospace;">${u.usuario}</td>
            <td><span class="badge ${pb}">${pn}</span></td>
            <td>${u.ativo?'<span class="badge badge-success"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg> Ativo</span>':'<span class="badge badge-danger">⛔ Inativo</span>'}</td>
            <td style="white-space:nowrap;">
                ${podeGerenciarAcessos ? `
                <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#dbeafe;color:#1e40af;margin-right:0.25rem;" onclick="abrirModalAcessosVeiculos('${u.id}')" title="Gerenciar Acessos aos Veículos">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    ${qtdAcessos > 0 ? `<span style="background:#1e40af;color:white;border-radius:9999px;padding:0 0.35rem;font-size:0.65rem;">${qtdAcessos}</span>` : ''}
                </button>
                ` : ''}
                <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='abrirModalUsuario(${seg})'>
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#dbeafe;color:#1e40af;margin-right:0.25rem;" onclick="toggleStatusUsuario('${u.id}')">
                    ${u.ativo?'<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>':'<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polygon points="5 3 19 12 5 21 5 3"/></svg>'}
                </button>
                <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirUsuario('${u.id}')">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </td>
        </tr>`;
    }).join('');
};

// Modal para gerenciar acessos de um motorista
function abrirModalAcessosVeiculos(usuarioId) {
    if (!ehAdmin()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    
    const usuario = BD.usuarios.find(u => String(u.id) === String(usuarioId));
    if (!usuario) return;
    
    const veiculos = BD.veiculos || [];
    const acessosAtuais = BD.acessosVeiculos[usuarioId] || [];
    
    if (veiculos.length === 0) {
        mostrarToast('Cadastre veículos primeiro para poder vincular!', 'aviso');
        return;
    }
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.id = 'modal-acessos';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    
    const listaVeiculos = veiculos.map(v => {
        const marcado = acessosAtuais.includes(v.placa) ? 'checked' : '';
        const cn = BD.config.categoriasVeiculos.find(c=>c.id===v.categoria)?.nome || v.categoria;
        return `<label style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border:1px solid #e2e8f0;border-radius:0.5rem;margin-bottom:0.5rem;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='#eef2ff'" onmouseout="this.style.background='white'">
            <input type="checkbox" class="chk-acesso" value="${v.placa}" ${marcado} style="width:auto;min-width:20px;height:20px;cursor:pointer;">
            <div style="flex:1;">
                <div style="font-weight:600;font-family:monospace;">${v.placa}</div>
                <div style="font-size:0.8125rem;color:#64748b;">${v.modelo} • ${cn}</div>
            </div>
            <span class="badge ${v.status==='disponivel'?'badge-success':v.status==='manutencao'?'badge-warning':'badge-info'}">${BD.config.statusVeiculos[v.status]||v.status}</span>
        </label>`;
    }).join('');
    
    m.innerHTML = `<div class="modal-corpo" style="max-width:560px;">
        <div class="modal-cabecalho">
            <h3 style="margin:0;">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Acessos aos Veículos
            </h3>
            <button class="btn-fechar" onclick="fecharModal()">×</button>
        </div>
        <div class="modal-conteudo">
            <div style="background:#eef2ff;padding:1rem;border-radius:0.5rem;margin-bottom:1rem;">
                <div style="font-weight:600;color:#4338ca;">${usuario.nome}</div>
                <div style="font-size:0.8125rem;color:#6366f1;">Usuário: ${usuario.usuario} • Perfil: ${BD.config.perfis[usuario.perfil]?.nome}</div>
            </div>
            <p style="color:#64748b;font-size:0.875rem;margin-bottom:1rem;">Marque os veículos que este motorista poderá visualizar e operar no sistema:</p>
            
            <div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
                <button class="btn btn-secondary" style="font-size:0.75rem;padding:0.375rem 0.75rem;" onclick="marcarTodosAcessos(true)">Marcar Todos</button>
                <button class="btn btn-secondary" style="font-size:0.75rem;padding:0.375rem 0.75rem;" onclick="marcarTodosAcessos(false)">Desmarcar Todos</button>
            </div>
            
            <div id="lista-acessos" style="max-height:400px;overflow-y:auto;">
                ${listaVeiculos}
            </div>
            
            <div class="botoes-form" style="margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                <button type="button" class="btn btn-primary" onclick="salvarAcessosVeiculos('${usuarioId}')">
                    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>
                    Salvar Acessos
                </button>
            </div>
        </div>
    </div>`;
    
    document.getElementById('modais').appendChild(m);
}

function marcarTodosAcessos(marcar) {
    document.querySelectorAll('.chk-acesso').forEach(cb => cb.checked = marcar);
}

function salvarAcessosVeiculos(usuarioId) {
    const selecionados = Array.from(document.querySelectorAll('.chk-acesso:checked')).map(cb => cb.value);
    BD.acessosVeiculos[usuarioId] = selecionados;
    salvarDados();
    
    const usuario = BD.usuarios.find(u => String(u.id) === String(usuarioId));
    registrarLog('edicao', `Atualizou acessos de veículos para ${usuario?.usuario}: ${selecionados.length} veículo(s)`);
    
    mostrarToast(`Acessos salvos! ${selecionados.length} veículo(s) vinculado(s)`, 'sucesso');
    fecharModal();
    carregarTabelaUsuarios();
}

// ---------- 4. DOCUMENTOS E PENDÊNCIAS DOS VEÍCULOS ----------
const TIPOS_DOCUMENTO = [
    { id: 'licenciamento', nome: 'Licenciamento', cor: '#4f46e5' },
    { id: 'ipva', nome: 'IPVA', cor: '#059669' },
    { id: 'multa', nome: 'Multa', cor: '#dc2626' },
    { id: 'seguro', nome: 'Seguro', cor: '#d97706' },
    { id: 'crlv', nome: 'CRLV', cor: '#0891b2' },
    { id: 'inspecao', nome: 'Inspeção Veicular', cor: '#7c3aed' },
    { id: 'outro', nome: 'Outro Documento', cor: '#64748b' }
];

function abrirModalDocumentosVeiculo(placa) {
    if (!temAcessoVeiculo(placa)) {
        mostrarToast('Você não tem acesso a este veículo!', 'erro');
        return;
    }
    
    const veiculo = BD.veiculos.find(v => v.placa === placa);
    if (!veiculo) return;
    
    if (!BD.documentosVeiculos[placa]) BD.documentosVeiculos[placa] = [];
    
    const docs = BD.documentosVeiculos[placa];
    const cn = BD.config.categoriasVeiculos.find(c=>c.id===veiculo.categoria)?.nome || veiculo.categoria;
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.id = 'modal-docs';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    
    let listaDocsHtml = '';
    if (docs.length === 0) {
        listaDocsHtml = '<div style="text-align:center;padding:2rem;color:#94a3b8;">Nenhum documento registrado para este veículo.</div>';
    } else {
        listaDocsHtml = docs.map(d => {
            const tipo = TIPOS_DOCUMENTO.find(t => t.id === d.tipo) || TIPOS_DOCUMENTO[TIPOS_DOCUMENTO.length-1];
            const statusBadge = d.status === 'pendente' 
                ? '<span class="badge badge-danger">Pendente</span>'
                : d.status === 'vencido'
                ? '<span class="badge badge-warning">Vencido</span>'
                : '<span class="badge badge-success">Regular</span>';
            
            const vencimento = d.dataVencimento ? `<div style="font-size:0.75rem;color:#64748b;margin-top:0.25rem;">Vencimento: ${formatarData(d.dataVencimento)}</div>` : '';
            const valor = d.valor ? `<div style="font-size:0.75rem;color:#dc2626;font-weight:600;margin-top:0.25rem;">Valor: ${formatarMoeda(d.valor)}</div>` : '';
            const temArquivo = d.arquivo ? true : false;
            
            return `<div style="border:1px solid #e2e8f0;border-radius:0.75rem;padding:1rem;margin-bottom:0.75rem;border-left:4px solid ${tipo.cor};">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;">
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">
                            <strong style="color:${tipo.cor};">${tipo.nome}</strong>
                            ${statusBadge}
                            ${temArquivo ? '<span class="badge badge-info">Anexado</span>' : ''}
                        </div>
                        <div style="font-size:0.875rem;color:#334155;">${d.descricao || 'Sem descrição'}</div>
                        ${vencimento}
                        ${valor}
                        <div style="font-size:0.7rem;color:#94a3b8;margin-top:0.25rem;">Registrado em: ${formatarDataHora(d.dataRegistro)}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:0.25rem;">
                        ${temArquivo ? `<button class="btn" style="padding:0.25rem 0.5rem;font-size:0.7rem;background:#dbeafe;color:#1e40af;" onclick="visualizarDocumentoSeguro('${placa}', '${d.id}')" title="Visualizar Documento">
                            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Ver
                        </button>` : ''}
                        ${ehAdmin() ? `
                        <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.7rem;background:#fef3c7;color:#92400e;" onclick="editarDocumentoVeiculo('${placa}', '${d.id}')" title="Editar">
                            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button class="btn" style="padding:0.25rem 0.5rem;font-size:0.7rem;background:#fee2e2;color:#991b1b;" onclick="excluirDocumentoVeiculo('${placa}', '${d.id}')" title="Excluir">
                            <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');
    }
    
    m.innerHTML = `<div class="modal-corpo" style="max-width:720px;">
        <div class="modal-cabecalho">
            <h3 style="margin:0;">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Documentos e Pendências
            </h3>
            <button class="btn-fechar" onclick="fecharModal()">×</button>
        </div>
        <div class="modal-conteudo">
            <div style="background:#f8fafc;padding:1rem;border-radius:0.5rem;margin-bottom:1rem;border:1px solid #e2e8f0;">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                    <div>
                        <div style="font-weight:700;font-family:monospace;font-size:1.1rem;">${veiculo.placa}</div>
                        <div style="font-size:0.8125rem;color:#64748b;">${veiculo.modelo} • ${cn}</div>
                    </div>
                    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                        <span class="badge badge-info">Total: ${docs.length}</span>
                        <span class="badge badge-danger">Pendentes: ${docs.filter(d=>d.status==='pendente').length}</span>
                        <span class="badge badge-warning">Vencidos: ${docs.filter(d=>d.status==='vencido').length}</span>
                    </div>
                </div>
            </div>
            
            ${ehAdmin() ? `
            <button class="btn btn-primary" style="margin-bottom:1rem;" onclick="abrirFormDocumento('${placa}')">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Novo Documento / Pendência
            </button>
            ` : ''}
            
            <div id="lista-documentos">
                ${listaDocsHtml}
            </div>
            
            <div class="botoes-form" style="margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="fecharModal()">Fechar</button>
            </div>
        </div>
    </div>`;
    
    document.getElementById('modais').appendChild(m);
}

function abrirFormDocumento(placa, docId = null) {
    const editar = !!docId;
    let doc = null;
    if (editar) {
        doc = BD.documentosVeiculos[placa]?.find(d => d.id === docId);
        if (!doc) return;
    }
    
    const tiposOptions = TIPOS_DOCUMENTO.map(t => 
        `<option value="${t.id}" ${doc?.tipo===t.id?'selected':''}>${t.nome}</option>`
    ).join('');
    
    const statusOptions = [
        { val: 'regular', nome: 'Regular' },
        { val: 'pendente', nome: 'Pendente' },
        { val: 'vencido', nome: 'Vencido' }
    ].map(s => `<option value="${s.val}" ${doc?.status===s.val?'selected':''}>${s.nome}</option>`).join('');
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.id = 'modal-form-doc';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    
    m.innerHTML = `<div class="modal-corpo" style="max-width:520px;">
        <div class="modal-cabecalho">
            <h3 style="margin:0;">${editar?'Editar':'Novo'} Documento</h3>
            <button class="btn-fechar" onclick="fecharModal()">×</button>
        </div>
        <div class="modal-conteudo">
            <form id="formDocumento">
                <div class="linha-form">
                    <label>Tipo de Documento *</label>
                    <select id="docTipo" required>${tiposOptions}</select>
                </div>
                <div class="linha-form">
                    <label>Descrição / Detalhes</label>
                    <textarea id="docDescricao" rows="2" placeholder="Ex: IPVA 2026, Multa de velocidade...">${doc?.descricao||''}</textarea>
                </div>
                <div class="linha-form">
                    <label>Status</label>
                    <select id="docStatus">${statusOptions}</select>
                </div>
                <div class="linha-form">
                    <label>Data de Vencimento</label>
                    <input type="date" id="docVencimento" value="${doc?.dataVencimento||''}">
                </div>
                <div class="linha-form">
                    <label>Valor (R$)</label>
                    <input type="number" id="docValor" step="0.01" min="0" value="${doc?.valor||''}" placeholder="0,00">
                </div>
                <div class="linha-form">
                    <label>Anexar Arquivo (PDF, Imagem)</label>
                    <div class="foto-container" id="docArquivoBox" onclick="document.getElementById('docArquivo').click()">
                        <div id="docArquivoPreview">
                            ${doc?.arquivo ? 
                                `<div style="color:#1e40af;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Arquivo anexado - clique para substituir</div>` :
                                `<div><div style="font-size:2rem;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div><div style="font-size:0.8125rem;color:#64748b;">Clique para selecionar arquivo</div><div style="font-size:0.7rem;color:#94a3b8;margin-top:0.25rem;">PDF, JPG, PNG - Visualização segura (sem download)</div></div>`
                            }
                        </div>
                    </div>
                    <input type="file" id="docArquivo" style="display:none;" accept=".pdf,.jpg,.jpeg,.png" onchange="processarArquivoDoc(event)">
                    <input type="hidden" id="docArquivoB64" value="${doc?.arquivo||''}">
                    <input type="hidden" id="docArquivoNome" value="${doc?.nomeArquivo||''}">
                    <input type="hidden" id="docArquivoTipo" value="${doc?.tipoArquivo||''}">
                </div>
                <div class="botoes-form">
                    <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>
                        ${editar?'Salvar Alterações':'Cadastrar'}
                    </button>
                </div>
            </form>
        </div>
    </div>`;
    
    document.getElementById('modais').appendChild(m);
    
    document.getElementById('formDocumento').addEventListener('submit', e => {
        e.preventDefault();
        salvarDocumento(placa, docId);
    });
}

function processarArquivoDoc(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;
    
    if (arquivo.size > 5 * 1024 * 1024) {
        mostrarToast('Arquivo muito grande! Máximo 5MB', 'erro');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = e => {
        document.getElementById('docArquivoB64').value = e.target.result;
        document.getElementById('docArquivoNome').value = arquivo.name;
        document.getElementById('docArquivoTipo').value = arquivo.type;
        document.getElementById('docArquivoPreview').innerHTML = 
            `<div style="color:#1e40af;font-weight:600;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> ${arquivo.name} - clique para substituir</div>`;
        mostrarToast('Arquivo carregado!', 'sucesso');
    };
    reader.readAsDataURL(arquivo);
}

function salvarDocumento(placa, docId) {
    const tipo = document.getElementById('docTipo').value;
    const descricao = document.getElementById('docDescricao').value.trim();
    const status = document.getElementById('docStatus').value;
    const dataVencimento = document.getElementById('docVencimento').value || null;
    const valor = document.getElementById('docValor').value || null;
    const arquivo = document.getElementById('docArquivoB64').value || null;
    const nomeArquivo = document.getElementById('docArquivoNome').value || null;
    const tipoArquivo = document.getElementById('docArquivoTipo').value || null;
    
    if (!BD.documentosVeiculos[placa]) BD.documentosVeiculos[placa] = [];
    
    const dados = {
        tipo, descricao, status, dataVencimento,
        valor: valor ? parseFloat(valor) : null,
        arquivo, nomeArquivo, tipoArquivo
    };
    
    if (docId) {
        const i = BD.documentosVeiculos[placa].findIndex(d => d.id === docId);
        if (i !== -1) {
            BD.documentosVeiculos[placa][i] = { 
                ...BD.documentosVeiculos[placa][i], 
                ...dados,
                dataAtualizacao: new Date().toISOString()
            };
            registrarLog('edicao', `Editou documento ${tipo} do veículo ${placa}`);
        }
    } else {
        dados.id = gerarId();
        dados.dataRegistro = new Date().toISOString();
        BD.documentosVeiculos[placa].push(dados);
        registrarLog('criacao', `Cadastrou documento ${tipo} no veículo ${placa}`);
    }
    
    salvarDados();
    mostrarToast('Documento salvo com sucesso!', 'sucesso');
    fecharModal();
    abrirModalDocumentosVeiculo(placa);
    carregarTabelaVeiculos();
}

function editarDocumentoVeiculo(placa, docId) {
    abrirFormDocumento(placa, docId);
}

function excluirDocumentoVeiculo(placa, docId) {
    mostrarConfirmacao('Tem certeza que deseja excluir este documento?', function() {
        if (BD.documentosVeiculos[placa]) {
            BD.documentosVeiculos[placa] = BD.documentosVeiculos[placa].filter(d => d.id !== docId);
            salvarDados();
            registrarLog('exclusao', `Excluiu documento do veículo ${placa}`);
            mostrarToast('Documento excluído!', 'sucesso');
            abrirModalDocumentosVeiculo(placa);
            carregarTabelaVeiculos();
        }
    });
}

// ---------- 5. VISUALIZADOR SEGURO DE DOCUMENTOS ----------
function visualizarDocumentoSeguro(placa, docId) {
    if (!temAcessoVeiculo(placa)) {
        mostrarToast('Você não tem acesso a este veículo!', 'erro');
        return;
    }
    
    const doc = BD.documentosVeiculos[placa]?.find(d => d.id === docId);
    if (!doc || !doc.arquivo) {
        mostrarToast('Documento não encontrado ou sem arquivo anexado!', 'erro');
        return;
    }
    
    const tipo = TIPOS_DOCUMENTO.find(t => t.id === doc.tipo) || TIPOS_DOCUMENTO[TIPOS_DOCUMENTO.length-1];
    const usuarioNome = window.usuarioAtual?.nome || 'Usuário';
    const dataAcesso = new Date().toLocaleString('pt-BR');
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.id = 'modal-doc-seguro';
    m.style.zIndex = '99999';
    
    // Verificar se é PDF ou imagem
    const ehPDF = doc.tipoArquivo === 'application/pdf' || doc.nomeArquivo?.toLowerCase().endsWith('.pdf');
    
    let conteudoVisualizacao = '';
    if (ehPDF) {
        conteudoVisualizacao = `<iframe id="docViewer" src="${doc.arquivo}#toolbar=0&navpanes=0&scrollbar=1" style="width:100%;height:100%;border:none;" sandbox="allow-same-origin"></iframe>`;
    } else {
        conteudoVisualizacao = `<img id="docViewer" src="${doc.arquivo}" style="max-width:100%;max-height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none;pointer-events:none;" draggable="false">`;
    }
    
    m.innerHTML = `<div class="modal-corpo" id="docSeguroCorpo" style="max-width:95vw;width:900px;max-height:95vh;height:85vh;display:flex;flex-direction:column;position:relative;overflow:hidden;">
        <div class="modal-cabecalho" style="flex-shrink:0;position:relative;z-index:10;background:white;">
            <h3 style="margin:0;">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Visualização Segura - ${tipo.nome}
            </h3>
            <button class="btn-fechar" onclick="fecharDocumentoSeguro()" style="position:relative;z-index:20;">×</button>
        </div>
        <div style="padding:0.5rem 1.5rem;background:#fef2f2;border-bottom:1px solid #fecaca;flex-shrink:0;position:relative;z-index:10;">
            <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.8125rem;color:#991b1b;font-weight:600;flex-wrap:wrap;">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Visualização protegida - Download e captura de tela são proibidos
                <span style="margin-left:auto;font-weight:500;">Acessado por: ${usuarioNome} • ${dataAcesso}</span>
            </div>
        </div>
        <div id="docSeguroArea" style="flex:1;overflow:auto;position:relative;background:#f1f5f9;display:flex;align-items:center;justify-content:center;padding:1rem;">
            ${conteudoVisualizacao}
            <!-- Marca d'água -->
            <div style="position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;overflow:hidden;z-index:5;">
                <div style="transform:rotate(-30deg);font-size:1.5rem;color:rgba(100,116,139,0.15);font-weight:700;white-space:nowrap;user-select:none;letter-spacing:0.2em;text-transform:uppercase;">
                    ${usuarioNome} • ${dataAcesso} • CONFIDENCIAL • NS FROTA
                </div>
            </div>
            <div style="position:absolute;top:1rem;left:1rem;right:1rem;bottom:1rem;pointer-events:none;display:grid;grid-template-columns:repeat(3,1fr);gap:2rem;opacity:0.08;z-index:6;">
                ${Array(9).fill(`<div style="font-size:0.8rem;color:#64748b;font-weight:600;text-align:center;user-select:none;">CONFIDENCIAL<br>${usuarioNome}<br>${dataAcesso}</div>`).join('')}
            </div>
        </div>
        <div style="padding:0.75rem 1.5rem;background:#f8fafc;border-top:1px solid #e2e8f0;flex-shrink:0;position:relative;z-index:10;">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8125rem;color:#64748b;flex-wrap:wrap;gap:0.5rem;">
                <div><strong>Veículo:</strong> ${placa} • <strong>Documento:</strong> ${doc.nomeArquivo || tipo.nome}</div>
                <button class="btn btn-secondary" onclick="fecharDocumentoSeguro()">Fechar Visualização</button>
            </div>
        </div>
    </div>`;
    
    document.body.appendChild(m);
    
    // Aplicar proteções
    ativarProtecoesDocumento();
    
    registrarLog('visualizacao', `Visualizou documento ${tipo.nome} do veículo ${placa} (modo seguro)`);
}

function ativarProtecoesDocumento() {
    const modal = document.getElementById('modal-doc-seguro');
    if (!modal) return;
    
    // Proteger contra botão direito
    modal.oncontextmenu = e => {
        e.preventDefault();
        e.stopPropagation();
        mostrarToast('Botão direito desativado para proteção do documento', 'aviso');
        return false;
    };
    
    // Proteger contra atalhos de teclado
    const keyHandler = e => {
        const modalAtivo = document.getElementById('modal-doc-seguro');
        if (!modalAtivo) {
            document.removeEventListener('keydown', keyHandler);
            return;
        }
        
        // Ctrl+S (salvar)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            e.stopPropagation();
            mostrarToast('Download/Salvar proibido!', 'erro');
            return false;
        }
        // Ctrl+P (imprimir)
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            e.stopPropagation();
            mostrarToast('Impressão proibida!', 'erro');
            return false;
        }
        // Ctrl+U (ver código fonte)
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        // F12 (DevTools)
        if (e.key === 'F12') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        // Ctrl+Shift+I
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        // PrintScreen
        if (e.key === 'PrintScreen' || e.key === 'PrtScr' || e.keyCode === 44) {
            e.preventDefault();
            mostrarToast('Captura de tela detectada e bloqueada!', 'erro');
            return false;
        }
        // Ctrl+C (copiar)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            e.preventDefault();
            mostrarToast('Cópia proibida!', 'aviso');
            return false;
        }
    };
    
    document.addEventListener('keydown', keyHandler, true);
    
    // Detectar perda de foco (possível PrintScreen em alguns SO)
    const blurHandler = () => {
        const modalAtivo = document.getElementById('modal-doc-seguro');
        if (modalAtivo) {
            const viewer = document.getElementById('docViewer');
            if (viewer) {
                viewer.style.filter = 'blur(20px)';
                setTimeout(() => { 
                    if (document.getElementById('modal-doc-seguro') && document.hasFocus()) {
                        viewer.style.filter = '';
                    }
                }, 500);
            }
        }
    };
    
    const focusHandler = () => {
        const viewer = document.getElementById('docViewer');
        if (viewer && document.getElementById('modal-doc-seguro')) {
            viewer.style.filter = '';
        }
    };
    
    window.addEventListener('blur', blurHandler);
    window.addEventListener('focus', focusHandler);
    
    // Armazenar handlers para limpeza posterior
    modal._handlers = { keyHandler, blurHandler, focusHandler };
    
    // Desativar seleção de texto
    const area = document.getElementById('docSeguroArea');
    if (area) {
        area.style.userSelect = 'none';
        area.style.webkitUserSelect = 'none';
        area.style.MozUserSelect = 'none';
    }
    
    // Desativar arrastar imagens
    modal.addEventListener('dragstart', e => {
        e.preventDefault();
        return false;
    });
}

function fecharDocumentoSeguro() {
    const modal = document.getElementById('modal-doc-seguro');
    if (modal) {
        // Remover handlers globais
        if (modal._handlers) {
            document.removeEventListener('keydown', modal._handlers.keyHandler, true);
            window.removeEventListener('blur', modal._handlers.blurHandler);
            window.removeEventListener('focus', modal._handlers.focusHandler);
        }
        modal.remove();
    }
}

// ---------- ADICIONAR ALERTAS DE DOCUMENTOS NO DASHBOARD ----------
const _atualizarDashboardOriginal = atualizarDashboard;
atualizarDashboard = function() {
    _atualizarDashboardOriginal();
    
    // Adicionar alerta de documentos pendentes/vencidos
    const todosDocs = Object.entries(BD.documentosVeiculos || {});
    let totalPendentes = 0;
    let totalVencidos = 0;
    let docsCriticos = [];
    
    todosDocs.forEach(([placa, docs]) => {
        docs.forEach(d => {
            if (d.status === 'pendente') {
                totalPendentes++;
                docsCriticos.push({ placa, ...d });
            }
            if (d.status === 'vencido') {
                totalVencidos++;
                docsCriticos.push({ placa, ...d });
            }
        });
    });
    
    if (totalPendentes > 0 || totalVencidos > 0) {
        const area = document.getElementById('areaAlertas');
        if (area) {
            const alertasHtml = `<div class="alerta-destaque" style="margin-top:1rem;background:linear-gradient(90deg,#fef2f2,#fee2e2);">
                <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
                    <span style="font-size:1.5rem;"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
                    <div>
                        <strong style="color:#991b1b;">ATENÇÃO: ${totalPendentes + totalVencidos} pendência(s) documental(is)!</strong>
                        <div style="font-size:0.875rem;color:#7f1d1d;">${totalPendentes} pendente(s) • ${totalVencidos} vencido(s)</div>
                    </div>
                </div>
                ${docsCriticos.slice(0,3).map(d=>{
                    const tipo = TIPOS_DOCUMENTO.find(t=>t.id===d.tipo)?.nome || d.tipo;
                    return `<div style="background:white;padding:0.75rem;border-radius:0.375rem;margin-bottom:0.5rem;font-size:0.875rem;">
                        <strong style="font-family:monospace;">${d.placa}</strong> - ${tipo}: ${d.descricao || 'Documento'} 
                        <span class="badge ${d.status==='vencido'?'badge-warning':'badge-danger'}" style="margin-left:0.5rem;">${d.status==='vencido'?'Vencido':'Pendente'}</span>
                    </div>`;
                }).join('')}
            </div>`;
            area.innerHTML += alertasHtml;
        }
    }
};

// ---------- MENSAGEM DE SUCESSO ----------
console.log('%c✅ Melhorias da Área de Veículos carregadas com sucesso!', 'color:green;font-weight:bold;font-size:14px;');
console.log('Funcionalidades implementadas:');
console.log('  1. Campo "Responsável" removido do cadastro');
console.log('  2. Controle de acesso motorista ↔ veículos');
console.log('  3. Botão "Gerenciar Acessos" na lista de usuários');
console.log('  4. Sub-área de Documentos e Pendências');
console.log('  5. Visualizador seguro (sem download/print)');
