// ============================================================
// SISTEMA DE GESTÃO DE FROTAS - VERSÃO 3.0 COMPLETA
// ============================================================

// ---------- 1. FUNÇÕES UTILITÁRIAS ----------
function quandoDOMPronto(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else setTimeout(fn, 0);
}
function gerarId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }
function formatarData(d) { return new Date(d).toLocaleDateString('pt-BR'); }
function formatarDataHora(d) { return new Date(d).toLocaleString('pt-BR'); }
function formatarMoeda(v) { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function mostrarToast(mensagem, tipo = 'sucesso') {
    try {
        const toast = document.createElement('div');
        const cores = {
            sucesso: 'linear-gradient(90deg,#10b981,#059669)',
            erro: 'linear-gradient(90deg,#ef4444,#dc2626)',
            aviso: 'linear-gradient(90deg,#f59e0b,#d97706)',
            info: 'linear-gradient(90deg,#3b82f6,#2563eb)'
        };
        toast.style.cssText = cores[tipo] + ';color:white;padding:0.875rem 1.5rem;border-radius:0.5rem;position:fixed;top:1.5rem;right:1.5rem;z-index:99999;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.25);animation:toastEntrar 0.3s ease;max-width:320px;';
        toast.textContent = mensagem;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
    } catch(e) { console.log('Toast:', mensagem); }
}

// Adicionar animação do toast
(function() {
    try {
        const s = document.createElement('style');
        s.textContent = '@keyframes toastEntrar{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}} .btn-fechar{font-size:1.5rem !important;cursor:pointer;padding:0.25rem 0.75rem !important;line-height:1;border:none;background:none;color:#64748b;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center;}';
        document.head.appendChild(s);
    } catch(e) {}
})();

function registrarLog(acao, detalhes) {
    if (!BD) BD = inicializarBD();
    if (!BD.log) BD.log = [];
    BD.log.unshift({
        id: gerarId(), dataHora: new Date().toISOString(),
        usuario: window.usuarioAtual?.usuario || 'sistema',
        perfil: window.usuarioAtual?.perfil || 'sistema',
        acao, detalhes
    });
    salvarDados();
}

// ---------- 2. BANCO DE DADOS ----------
const CONFIG_PADRAO = {
    categoriasVeiculos: [
        { id: 'caminhao-munck', nome: 'Caminhão Munck', precisaCintas: true },
        { id: 'caminhao', nome: 'Caminhão', precisaCintas: false },
        { id: 'guindaste', nome: 'Guindaste', precisaCintas: true },
        { id: 'pa-carregadeira', nome: 'Pá Carregadeira', precisaCintas: false },
        { id: 'caminhao-betoneira', nome: 'Caminhão Betoneira', precisaCintas: false },
        { id: 'carro', nome: 'Carro', precisaCintas: false },
        { id: 'van', nome: 'Van', precisaCintas: false, precisaFotosBancos: true },
        { id: 'onibus', nome: 'Ônibus', precisaCintas: false },
        { id: 'carreta', nome: 'Carreta', precisaCintas: true }
    ],
    requisitosCintas: { cintas2m: 2, cintas3m: 2, cintas4m: 2, cintas6m: 2, cintasCatraca: 4, catracas: 4 },
    statusVeiculos: { disponivel: 'Disponível', alocado: 'Alocado', manutencao: 'Manutenção', inativo: 'Inativo' },
    tiposGasto: [
        { id: 'combustivel', nome: 'Combustível' },
        { id: 'manutencao', nome: 'Manutenção' },
        { id: 'pneus', nome: 'Pneus' },
        { id: 'pedagio', nome: 'Pedágio' },
        { id: 'seguro', nome: 'Seguro' },
        { id: 'outro', nome: 'Outro' }
    ],
    perfis: {
        admin: { nome: 'Administrador', nivel: 4 },
        supervisor: { nome: 'Supervisor', nivel: 3 },
        operacional: { nome: 'Operacional', nivel: 2 },
        visitante: { nome: 'Visitante', nivel: 1 }
    }
};

function inicializarBD() {
    try {
        const salvo = localStorage.getItem('bd_frotas_v3');
        if (salvo) {
            const bd = JSON.parse(salvo);
            if (!bd.config) bd.config = CONFIG_PADRAO;
            if (!bd.usuarios || bd.usuarios.length === 0) bd.usuarios = [{ id: gerarId(), nome: 'Administrador', usuario: 'admin', senha: 'admin123', perfil: 'admin', ativo: true }];
            if (!bd.locais) bd.locais = [{ id: 'patio-metalica', nome: 'Pátio Metálica' }, { id: 'patio-usina', nome: 'Pátio Usina' }, { id: 'obra', nome: 'Obra' }];
            if (!bd.postos) bd.postos = [{ id: gerarId(), nome: 'Posto Guara' }, { id: gerarId(), nome: 'Posto Shell - Centro' }, { id: gerarId(), nome: 'Posto Ipiranga - Rodovia' }];
            if (!bd.veiculos) bd.veiculos = [];
            if (!bd.checklists) bd.checklists = [];
            if (!bd.manutencoes) bd.manutencoes = [];
            if (!bd.gastos) bd.gastos = [];
            if (!bd.chamados) bd.chamados = [];
            if (!bd.alocacoes) bd.alocacoes = [];
            if (!bd.alertas) bd.alertas = [];
            if (!bd.log) bd.log = [];
            return bd;
        }
    } catch(e) { console.error(e); }
    return {
        config: CONFIG_PADRAO,
        usuarios: [{ id: gerarId(), nome: 'Administrador', usuario: 'admin', senha: 'admin123', perfil: 'admin', ativo: true }],
        locais: [{ id: 'patio-metalica', nome: 'Pátio Metálica' }, { id: 'patio-usina', nome: 'Pátio Usina' }, { id: 'obra', nome: 'Obra' }],
        postos: [{ id: gerarId(), nome: 'Posto Guara' }, { id: gerarId(), nome: 'Posto Shell - Centro' }, { id: gerarId(), nome: 'Posto Ipiranga - Rodovia' }],
        veiculos: [], checklists: [], manutencoes: [], gastos: [], chamados: [], alocacoes: [], alertas: [], log: []
    };
}

let BD = inicializarBD(); window.BD = BD;
function salvarDados() { localStorage.setItem('bd_frotas_v3', JSON.stringify(BD)); }

// ---------- 3. AUTENTICAÇÃO E PERMISSÕES ----------
window.usuarioAtual = null;

function temPermissao(p) {
    if (!window.usuarioAtual) return false;
    const n = { visitante: 1, operacional: 2, supervisor: 3, admin: 4 };
    return n[window.usuarioAtual.perfil] >= n[p];
}
function ehAdmin() { return temPermissao('admin'); }
function ehSupervisor() { return temPermissao('supervisor'); }
function ehOperacional() { return window.usuarioAtual?.perfil === 'operacional'; }
function ehVisitante() { return window.usuarioAtual?.perfil === 'visitante'; }
function ehProprioRegistro(r) { return r && window.usuarioAtual && (r.usuarioId === window.usuarioAtual.id); }

function aplicarPermissoesVisuais() {
    const body = document.body;
    body.classList.remove('usuario-admin', 'usuario-supervisor', 'usuario-motorista', 'usuario-visitante');
    if (!window.usuarioAtual) return;
    const p = window.usuarioAtual.perfil;
    if (p === 'admin') body.classList.add('usuario-admin');
    else if (p === 'supervisor') body.classList.add('usuario-supervisor');
    else if (p === 'operacional') body.classList.add('usuario-motorista');
    else if (p === 'visitante') body.classList.add('usuario-visitante');
    
    document.querySelectorAll('.sidebar-link').forEach(link => {
        const pg = link.dataset.pagina;
        if (!pg) return;
        let mostrar = true;
        if (['locais', 'usuarios', 'configuracoes', 'log'].includes(pg) && !ehAdmin()) mostrar = false;
        if (['manutencao', 'alocacoes'].includes(pg) && !ehSupervisor() && !ehAdmin()) mostrar = false;
        link.style.display = mostrar ? '' : 'none';
    });
}

function entrarNoSistema() {
    const u = document.getElementById('loginUsuario').value.trim();
    const s = document.getElementById('loginSenha').value;
    const err = document.getElementById('erroLogin');
    const user = BD.usuarios.find(x => x.usuario === u && x.senha === s && x.ativo);
    if (!user) { err.textContent = '❌ Usuário ou senha inválidos!'; err.style.display = 'block'; return; }
    window.usuarioAtual = { id: user.id, nome: user.nome, usuario: user.usuario, perfil: user.perfil };
    localStorage.setItem('sessaoUsuario', JSON.stringify(window.usuarioAtual));
    registrarLog('login', `Usuário ${user.usuario} entrou`);
    err.style.display = 'none';
    mostrarSistema();
}

function sairDoSistema() {
    if (window.usuarioAtual) registrarLog('logout', `Usuário ${window.usuarioAtual.usuario} saiu`);
    window.usuarioAtual = null;
    localStorage.removeItem('sessaoUsuario');
    mostrarLogin();
}

function verificarSessao() {
    const s = localStorage.getItem('sessaoUsuario');
    if (s) { try { window.usuarioAtual = JSON.parse(s); mostrarSistema(); } catch(e) { localStorage.removeItem('sessaoUsuario'); mostrarLogin(); } }
    else mostrarLogin();
}

function mostrarLogin() {
    document.getElementById('telaLogin').style.display = 'flex';
    document.getElementById('sistemaPrincipal').classList.add('hidden');
}

function mostrarSistema() {
    document.getElementById('telaLogin').style.display = 'none';
    document.getElementById('sistemaPrincipal').classList.remove('hidden');
    const el = document.getElementById('infoUsuario');
    if (el && window.usuarioAtual) {
        const pn = { admin: 'Administrador', supervisor: 'Supervisor', operacional: 'Operacional', visitante: 'Visitante' };
        el.textContent = `${window.usuarioAtual.nome} (${pn[window.usuarioAtual.perfil]})`;
    }
    aplicarPermissoesVisuais();
    carregarDadosIniciais();
}

// ---------- 4. NAVEGAÇÃO ----------
let paginaAtual = 'dashboard';

function navegarPara(pagina) {
    if (['locais', 'usuarios', 'configuracoes', 'log'].includes(pagina) && !ehAdmin()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    if (['manutencao', 'alocacoes'].includes(pagina) && !ehSupervisor() && !ehAdmin()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    paginaAtual = pagina;
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.toggle('ativo', l.dataset.pagina === pagina));
    document.querySelectorAll('.pagina').forEach(p => p.classList.remove('ativa'));
    const pg = document.getElementById(`pag-${pagina}`);
    if (pg) pg.classList.add('ativa');
    carregarDadosPagina(pagina);
}

function carregarDadosPagina(p) {
    switch(p) {
        case 'dashboard': atualizarDashboard(); break;
        case 'veiculos': carregarTabelaVeiculos(); break;
        case 'checklist': carregarTabelaChecklist(); verificarAlertasCintas(); break;
        case 'manutencao': carregarTabelaManutencao(); break;
        case 'gastos': carregarTabelaGastos(); break;
        case 'chamados': carregarTabelaChamados(); break;
        case 'alocacoes': carregarTabelaAlocacoes(); break;
        case 'locais': carregarTabelaLocais(); break;
        case 'usuarios': carregarTabelaUsuarios(); break;
        case 'configuracoes': carregarTelaConfiguracoes(); break;
        case 'log': carregarLog(); break;
    }
}

function popularFiltrosEstaticos() {
    try {
        // Filtro de categorias em Veículos
        const sc = document.getElementById('filtroVeiculoCategoria');
        if (sc && sc.options.length <= 1 && BD.config?.categoriasVeiculos) {
            BD.config.categoriasVeiculos.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id; opt.textContent = c.nome;
                sc.appendChild(opt);
            });
        }
    } catch(e) { console.error('Erro ao popular filtros:', e); }
}

function carregarDadosIniciais() {
    popularFiltrosEstaticos();
    atualizarListaVeiculosNosFiltros();
    atualizarListaUsuariosNosFiltros();
    carregarDadosPagina(paginaAtual);
}

function atualizarListaVeiculosNosFiltros() {
    popularFiltrosEstaticos();
    const vs = BD.veiculos || [];
    ['filtroChecklistVeiculo', 'filtroManutencaoVeiculo', 'filtroGastosVeiculo', 'filtroChamadosVeiculo', 'filtroAlocacoesVeiculo'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const atual = sel.value;
        sel.innerHTML = '<option value="todos">Todos os Veículos</option>';
        vs.forEach(v => { sel.innerHTML += `<option value="${v.placa}">${v.placa} - ${v.modelo}</option>`; });
        if (vs.some(v => v.placa === atual)) sel.value = atual;
    });
}

function atualizarListaUsuariosNosFiltros() {
    const sel = document.getElementById('filtroLogUsuario');
    if (!sel) return;
    const atual = sel.value;
    sel.innerHTML = '<option value="todos">Todos os Usuários</option>';
    (BD.usuarios || []).forEach(u => { sel.innerHTML += `<option value="${u.usuario}">${u.nome}</option>`; });
}

// ---------- 5. DASHBOARD ----------
function atualizarDashboard() {
    const vs = BD.veiculos || [];
    document.getElementById('stat-total').textContent = vs.length;
    document.getElementById('stat-operacao').textContent = vs.filter(v => v.status === 'disponivel' || v.status === 'alocado').length;
    document.getElementById('stat-manutencao').textContent = vs.filter(v => v.status === 'manutencao').length;
    document.getElementById('stat-chamados').textContent = (BD.chamados || []).filter(c => c.status === 'aberto').length;
    
    const rel = document.getElementById('lista-veiculos-recentes');
    if (vs.length === 0) rel.innerHTML = '<span style="color:#94a3b8;">Nenhum veículo cadastrado.</span>';
    else rel.innerHTML = vs.slice(-5).reverse().map(v => `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid #f1f5f9;"><div><div style="font-weight:600;">${v.placa}</div><div style="font-size:0.8125rem;color:#64748b;">${v.modelo}</div></div><span class="badge ${v.status==='disponivel'?'badge-success':v.status==='manutencao'?'badge-warning':'badge-info'}">${BD.config.statusVeiculos[v.status]||v.status}</span></div>`).join('');
    
    const ch = BD.chamados || [];
    const chel = document.getElementById('lista-chamados-recentes');
    if (ch.length === 0) chel.innerHTML = '<span style="color:#94a3b8;">Nenhum chamado.</span>';
    else chel.innerHTML = ch.slice(-5).reverse().map(c => `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid #f1f5f9;"><div><div style="font-weight:600;">${c.titulo}</div><div style="font-size:0.8125rem;color:#64748b;">${c.veiculo} - ${formatarData(c.data)}</div></div><span class="badge ${c.status==='aberto'?'badge-danger':c.status==='andamento'?'badge-warning':'badge-success'}">${c.status}</span></div>`).join('');
    
    renderizarAlertasDashboard();
}

function renderizarAlertasDashboard() {
    const area = document.getElementById('areaAlertas');
    if (!area) return;
    const ativos = (BD.alertas || []).filter(a => !a.resolvido);
    if (ativos.length === 0) { area.innerHTML = ''; return; }
    area.innerHTML = `<div class="alerta-destaque"><div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;"><span style="font-size:1.5rem;">⚠️</span><div><strong style="color:#991b1b;">ATENÇÃO: ${ativos.length} alerta(s) pendente(s)!</strong><div style="font-size:0.875rem;color:#7f1d1d;">Verifique a área de Check-list</div></div></div>${ativos.slice(0,3).map(a=>`<div style="background:white;padding:0.75rem;border-radius:0.375rem;margin-bottom:0.5rem;font-size:0.875rem;"><strong>🚛 ${a.veiculo}</strong> - ${a.motivo}<button class="btn btn-warning" style="padding:0.25rem 0.5rem;font-size:0.75rem;margin-left:0.5rem;" onclick="navegarPara('checklist')">Ver</button></div>`).join('')}</div>`;
}

// ---------- 6. CRUD VEÍCULOS ----------
function abrirModalVeiculo(v = null) {
    if (!ehAdmin()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    const ed = !!v;
    const cats = BD.config.categoriasVeiculos.map(c => `<option value="${c.id}" ${v?.categoria===c.id?'selected':''}>${c.nome}</option>`).join('');
    const sts = Object.entries(BD.config.statusVeiculos).map(([val,nome])=>`<option value="${val}" ${v?.status===val?'selected':''}>${nome}</option>`).join('');
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    m.innerHTML = `<div class="modal-corpo"><div class="modal-cabecalho"><h3 style="margin:0;">${ed?'✏️ Editar':'➕ Cadastrar'} Veículo</h3><button class="btn-fechar" onclick="fecharModal()" title="Fechar">×</button></div><div class="modal-conteudo"><form id="formVeiculo">
        <div class="linha-form"><label>Placa *</label><input type="text" id="vPlaca" style="text-transform:uppercase;" required value="${v?.placa||''}" ${ed?'readonly':''} placeholder="ABC1D23"></div>
        <div class="linha-form"><label>Ano</label><input type="number" id="vAno" value="${v?.ano||''}" min="1990" max="2030"></div>
        <div class="linha-form"><label>Categoria *</label><select id="vCategoria" required><option value="">Selecione</option>${cats}</select></div>
        <div class="linha-form"><label>Marca / Modelo *</label><input type="text" id="vModelo" required value="${v?.modelo||''}"></div>
        <div class="linha-form"><label>Km Atual *</label><input type="number" id="vKm" required value="${v?.km_atual||0}" min="0"></div>
        <div class="linha-form"><label>Status</label><select id="vStatus">${sts}</select></div>
        <div class="linha-form"><label>Obra / Local *</label><input type="text" id="vObra" required value="${v?.obra_atual||''}"></div>
        <div class="linha-form"><label>Responsável</label><input type="text" id="vResponsavel" value="${v?.responsavel||''}"></div>
        <div class="botoes-form"><button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button><button type="submit" class="btn btn-primary">${ed?'💾 Salvar':'➕ Cadastrar'}</button></div>
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
        const resp = document.getElementById('vResponsavel').value.trim() || null;
        
        // Validação flexível: aceita ABC1D23 (Mercosul), ABC1234 (antigo), com ou sem hífen
        const placaLimpa = placa.replace(/[^A-Z0-9]/g, '');
        if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placaLimpa) && !/^[A-Z]{3}[0-9]{4}$/.test(placaLimpa)) {
            mostrarToast('Placa inválida! Use: ABC1D23 ou ABC1234', 'erro');
            return;
        }
        if (!categoria || !modelo || !obra) { mostrarToast('Preencha todos os campos obrigatórios!', 'aviso'); return; }
        
        const dados = { placa, categoria, modelo, marca: modelo.split(' ')[0], ano, km_atual: km, km_inicial: ed ? (v?.km_inicial||km) : km, status, obra_atual: obra, responsavel: resp };
        
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
}

function excluirVeiculo(id) {
    if (!ehAdmin()) return;
    if (!confirm('⚠️ Excluir este veículo?')) return;
    const v = BD.veiculos.find(x => x.placa===id || String(x.id)===String(id));
    BD.veiculos = BD.veiculos.filter(x => x.placa!==id && String(x.id)!==String(id));
    salvarDados();
    if (v) registrarLog('exclusao', `Excluiu veículo ${v.placa}`);
    mostrarToast('Registro excluído!', 'sucesso'); carregarTabelaVeiculos(); atualizarDashboard(); atualizarListaVeiculosNosFiltros();
}

function carregarTabelaVeiculos() {
    const corpo = document.getElementById('tabelaVeiculos');
    if (!corpo) return;
    let vs = BD.veiculos || [];
    const fc = document.getElementById('filtroVeiculoCategoria')?.value || 'todas';
    const fs = document.getElementById('filtroVeiculoStatus')?.value || 'todos';
    if (fc !== 'todas') vs = vs.filter(v => v.categoria === fc);
    if (fs !== 'todos') vs = vs.filter(v => v.status === fs);
    
    const sc = document.getElementById('filtroVeiculoCategoria');
    if (sc && sc.options.length <= 1) BD.config.categoriasVeiculos.forEach(c => sc.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
    
    if (vs.length === 0) { corpo.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhum veículo</td></tr>'; return; }
    
    const sm = { disponivel:'<span class="badge badge-success">✅ Disponível</span>', alocado:'<span class="badge badge-info">📍 Alocado</span>', manutencao:'<span class="badge badge-warning">🔧 Manutenção</span>', inativo:'<span class="badge badge-danger">⛔ Inativo</span>' };
    
    corpo.innerHTML = vs.map(v => {
        const cn = BD.config.categoriasVeiculos.find(c=>c.id===v.categoria)?.nome || v.categoria;
        const seg = JSON.stringify(v).replace(/"/g,'&quot;');
        return `<tr><td style="font-family:monospace;font-weight:600;">${v.placa}</td><td>${cn}</td><td>${v.modelo}</td><td>${Number(v.km_atual||0).toLocaleString('pt-BR')} km</td><td>${v.obra_atual||'—'}</td><td>${sm[v.status]||v.status}</td><td class="admin-only"><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='abrirModalVeiculo(${seg})'>✏️</button><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirVeiculo('${v.placa}')">🗑️</button></td></tr>`;
    }).join('');
}

// ---------- 7. CRUD USUÁRIOS ----------
function abrirModalUsuario(u = null) {
    if (!ehAdmin()) return;
    const ed = !!u;
    const perfis = Object.entries(BD.config.perfis).map(([id,p])=>`<option value="${id}" ${u?.perfil===id?'selected':''}>${p.nome}</option>`).join('');
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    m.innerHTML = `<div class="modal-corpo"><div class="modal-cabecalho"><h3 style="margin:0;">${ed?'✏️ Editar':'➕ Novo'} Usuário</h3><button class="btn-fechar" onclick="fecharModal()" title="Fechar">×</button></div><div class="modal-conteudo"><form id="formUsuario">
        <div class="linha-form"><label>Nome Completo *</label><input type="text" id="uNome" required value="${u?.nome||''}"></div>
        <div class="linha-form"><label>Usuário (Login) *</label><input type="text" id="uUsuario" required value="${u?.usuario||''}" ${ed?'readonly':''}></div>
        <div class="linha-form"><label>Senha *</label><input type="password" id="uSenha" required value="${u?.senha||''}"></div>
        <div class="linha-form"><label>Perfil *</label><select id="uPerfil" required>${perfis}</select></div>
        <div class="botoes-form"><button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button><button type="submit" class="btn btn-primary">${ed?'💾 Salvar':'➕ Criar'}</button></div>
    </form></div></div>`;
    document.getElementById('modais').appendChild(m);
    
    document.getElementById('formUsuario').addEventListener('submit', e => {
        e.preventDefault();
        const nome = document.getElementById('uNome').value.trim();
        const login = document.getElementById('uUsuario').value.trim();
        const senha = document.getElementById('uSenha').value;
        const perfil = document.getElementById('uPerfil').value;
        if (!nome||!login||!senha) { alert('❌ Preencha todos!'); return; }
        
        if (ed) {
            const i = BD.usuarios.findIndex(x=>String(x.id)===String(u.id));
            if (i!==-1) BD.usuarios[i] = { ...BD.usuarios[i], nome, senha, perfil };
            registrarLog('edicao', `Editou usuário ${login}`);
        } else {
            if (BD.usuarios.some(x=>x.usuario===login)) { mostrarToast('Usuário já existe!', 'erro'); return; }
            BD.usuarios.push({ id: gerarId(), nome, usuario: login, senha, perfil, ativo: true });
            registrarLog('criacao', `Criou usuário ${login} (${perfil})`);
        }
        salvarDados(); mostrarToast('Usuário salvo com sucesso!', 'sucesso'); fecharModal();
        carregarTabelaUsuarios(); atualizarListaUsuariosNosFiltros();
    });
}

function toggleStatusUsuario(id) {
    if (!ehAdmin()) return;
    const u = BD.usuarios.find(x=>String(x.id)===String(id));
    if (u) { u.ativo = !u.ativo; salvarDados(); registrarLog('edicao', `${u.ativo?'Ativou':'Desativou'} ${u.usuario}`); carregarTabelaUsuarios(); atualizarListaUsuariosNosFiltros(); }
}

function excluirUsuario(id) {
    if (!ehAdmin()) return;
    const u = BD.usuarios.find(x=>String(x.id)===String(id));
    if (u?.perfil==='admin' && BD.usuarios.filter(x=>x.perfil==='admin').length<=1) { mostrarToast('Não pode excluir o último admin!', 'erro'); return; }
    if (!confirm('⚠️ Excluir este usuário?')) return;
    BD.usuarios = BD.usuarios.filter(x=>String(x.id)!==String(id));
    salvarDados(); if (u) registrarLog('exclusao', `Excluiu ${u.usuario}`);
    mostrarToast('Registro excluído!', 'sucesso'); carregarTabelaUsuarios(); atualizarListaUsuariosNosFiltros();
}

function carregarTabelaUsuarios() {
    const corpo = document.getElementById('tabelaUsuarios');
    if (!corpo) return;
    const us = BD.usuarios || [];
    if (us.length === 0) { corpo.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhum usuário</td></tr>'; return; }
    
    corpo.innerHTML = us.map(u => {
        const pn = BD.config.perfis[u.perfil]?.nome || u.perfil;
        const pb = u.perfil==='admin'?'badge-danger':u.perfil==='supervisor'?'badge-warning':u.perfil==='operacional'?'badge-info':'badge-success';
        const seg = JSON.stringify(u).replace(/"/g,'&quot;');
        return `<tr><td style="font-weight:600;">${u.nome}</td><td style="font-family:monospace;">${u.usuario}</td><td><span class="badge ${pb}">${pn}</span></td><td>${u.ativo?'<span class="badge badge-success">✅ Ativo</span>':'<span class="badge badge-danger">⛔ Inativo</span>'}</td><td><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='abrirModalUsuario(${seg})'>✏️</button><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#dbeafe;color:#1e40af;margin-right:0.25rem;" onclick="toggleStatusUsuario('${u.id}')">${u.ativo?'⏸️':'▶️'}</button><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirUsuario('${u.id}')">🗑️</button></td></tr>`;
    }).join('');
}

// ---------- 8. LOCAIS ----------
function abrirModalLocal(l = null) {
    if (!ehAdmin()) return;
    const ed = !!l;
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    m.innerHTML = `<div class="modal-corpo"><div class="modal-cabecalho"><h3 style="margin:0;">${ed?'✏️ Editar':'➕ Novo'} Local</h3><button class="btn-fechar" onclick="fecharModal()" title="Fechar">×</button></div><div class="modal-conteudo"><form id="formLocal">
        <div class="linha-form"><label>Nome *</label><input type="text" id="nomeLocal" required value="${l?.nome||''}"></div>
        <div class="botoes-form"><button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button><button type="submit" class="btn btn-primary">${ed?'💾 Salvar':'➕ Cadastrar'}</button></div>
    </form></div></div>`;
    document.getElementById('modais').appendChild(m);
    
    document.getElementById('formLocal').addEventListener('submit', e => {
        e.preventDefault();
        const nome = document.getElementById('nomeLocal').value.trim();
        if (!nome) return;
        if (ed) {
            const i = BD.locais.findIndex(x=>String(x.id)===String(l.id));
            if (i!==-1) BD.locais[i].nome = nome;
            registrarLog('edicao', `Editou local: ${nome}`);
        } else {
            if (BD.locais.some(x=>x.nome.toLowerCase()===nome.toLowerCase())) { mostrarToast('Já existe este registro!', 'erro'); return; }
            BD.locais.push({ id: gerarId(), nome });
            registrarLog('criacao', `Cadastrou local: ${nome}`);
        }
        salvarDados(); mostrarToast('Local salvo com sucesso!', 'sucesso'); fecharModal(); carregarTabelaLocais();
    });
}

function excluirLocal(id) {
    if (!ehAdmin()) return;
    if (!confirm('⚠️ Excluir?')) return;
    BD.locais = BD.locais.filter(l=>String(l.id)!==String(id));
    salvarDados(); registrarLog('exclusao', 'Excluiu local'); carregarTabelaLocais();
}

function carregarTabelaLocais() {
    const corpo = document.getElementById('tabelaLocais');
    if (!corpo) return;
    const ls = BD.locais || [];
    if (ls.length === 0) { corpo.innerHTML = '<tr><td colspan="2" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhum local</td></tr>'; return; }
    corpo.innerHTML = ls.map(l => {
        const seg = JSON.stringify(l).replace(/"/g,'&quot;');
        return `<tr><td style="font-weight:500;">🏗️ ${l.nome}</td><td class="admin-only"><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='abrirModalLocal(${seg})'>✏️</button><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirLocal('${l.id}')">🗑️</button></td></tr>`;
    }).join('');
}

// ---------- 9. FECHAR MODAL ----------
function fecharModal() {
    try {
        const m = document.getElementById('modais');
        if (m) {
            while (m.firstChild) m.removeChild(m.firstChild);
        }
        document.activeElement?.blur?.();
    } catch(e) { console.error('Erro ao fechar modal:', e); }
}

// ---------- 10. CHECK-LIST ----------
function abrirModalChecklist() {
    if (ehVisitante()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    const vs = BD.veiculos || [];
    if (vs.length === 0) { alert('❌ Cadastre um veículo primeiro!'); navegarPara('veiculos'); return; }
    
    const ops = vs.map(v => `<option value="${v.placa}" data-categoria="${v.categoria}">${v.placa} - ${v.modelo}</option>`).join('');
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    m.innerHTML = `<div class="modal-corpo largo"><div class="modal-cabecalho"><h3 style="margin:0;">📋 Novo Check-list</h3><button class="btn-fechar" onclick="fecharModal()" title="Fechar">×</button></div><div class="modal-conteudo"><form id="formChecklist">
        <div class="linha-form"><label>Veículo *</label><select id="clVeiculo" required onchange="atualizarFormChecklistPorCategoria()"><option value="">Selecione</option>${ops}</select></div>
        <div id="clCamposDinamicos"></div>
        <div class="botoes-form"><button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button><button type="submit" class="btn btn-primary">💾 Salvar</button></div>
    </form></div></div>`;
    document.getElementById('modais').appendChild(m);
    
    document.getElementById('formChecklist').addEventListener('submit', e => { e.preventDefault(); salvarChecklist(); });
}

function atualizarFormChecklistPorCategoria() {
    const sel = document.getElementById('clVeiculo');
    const cat = sel.options[sel.selectedIndex]?.dataset.categoria;
    const cont = document.getElementById('clCamposDinamicos');
    if (!cat || !cont) return;
    
    const cc = BD.config.categoriasVeiculos.find(c=>c.id===cat);
    const pc = cc?.precisaCintas;
    const pfb = cc?.precisaFotosBancos;
    const req = BD.config.requisitosCintas;
    
    let h = '';
    h += `<div class="section-title">🔍 Itens de Inspeção</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div><label>Óleo</label><select id="clOleo"><option value="ok">✅ OK</option><option value="baixo">⚠️ Baixo</option><option value="critico">❌ Crítico</option></select></div>
            <div><label>Água</label><select id="clAgua"><option value="ok">✅ OK</option><option value="baixo">⚠️ Baixo</option><option value="critico">❌ Crítico</option></select></div>
            <div><label>Pneus</label><select id="clPneus"><option value="ok">✅ OK</option><option value="calibrar">⚠️ Calibrar</option><option value="trocar">❌ Trocar</option></select></div>
            <div><label>Freios</label><select id="clFreios"><option value="ok">✅ OK</option><option value="verificar">⚠️ Verificar</option><option value="critico">❌ Crítico</option></select></div>
            <div><label>Luzes</label><select id="clLuzes"><option value="ok">✅ OK</option><option value="queimada">⚠️ Queimada</option></select></div>
            <div><label>Higiene</label><select id="clHigiene"><option value="ok">✅ Limpo</option><option value="sujo">⚠️ Sujo</option></select></div>
        </div>
        <div class="linha-form" style="margin-top:1rem;"><label>Observações Gerais</label><textarea id="clObservacoes" rows="2"></textarea></div>`;
    
    if (pc) {
        h += `<div class="section-title">🔗 Verificação de Cintas</div>
            <div style="background:#fefce8;padding:1rem;border-radius:0.5rem;border:1px solid #fde68a;margin-bottom:1rem;">
                <p style="color:#92400e;font-size:0.875rem;margin:0 0 1rem;"><strong>⚠️ Mínimo:</strong> ${req.cintas2m}x 2m | ${req.cintas3m}x 3m | ${req.cintas4m}x 4m | ${req.cintas6m}x 6m | ${req.cintasCatraca}x Catraca | ${req.catracas}x Catracas</p>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;">
                    <div><label>Cintas 2m</label><input type="number" id="clCintas2m" min="0" value="${req.cintas2m}"></div>
                    <div><label>Cintas 3m</label><input type="number" id="clCintas3m" min="0" value="${req.cintas3m}"></div>
                    <div><label>Cintas 4m</label><input type="number" id="clCintas4m" min="0" value="${req.cintas4m}"></div>
                    <div><label>Cintas 6m</label><input type="number" id="clCintas6m" min="0" value="${req.cintas6m}"></div>
                    <div><label>Cintas Catraca</label><input type="number" id="clCintasCatraca" min="0" value="${req.cintasCatraca}"></div>
                    <div><label>Catracas</label><input type="number" id="clCatracas" min="0" value="${req.catracas}"></div>
                </div>
            </div>`;
    }
    
    h += `<div class="section-title">📸 Registro Fotográfico</div>
        <p style="color:#64748b;font-size:0.875rem;margin-bottom:1rem;">Clique para capturar foto no momento.</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">
            <div><label style="font-size:0.8125rem;">Painel (km) *</label><div class="foto-container" onclick="capturarFoto('fotoPainel')" id="box-fotoPainel"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Clique para foto</div></div><input type="hidden" id="fotoPainel"><input type="text" id="obsPainel" placeholder="Observação..." style="margin-top:0.5rem;font-size:0.8125rem;"></div>
            <div><label style="font-size:0.8125rem;">Frente *</label><div class="foto-container" onclick="capturarFoto('fotoFrente')" id="box-fotoFrente"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Clique para foto</div></div><input type="hidden" id="fotoFrente"><input type="text" id="obsFrente" placeholder="Observação..." style="margin-top:0.5rem;font-size:0.8125rem;"></div>
            <div><label style="font-size:0.8125rem;">Traseira *</label><div class="foto-container" onclick="capturarFoto('fotoTraseira')" id="box-fotoTraseira"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Clique para foto</div></div><input type="hidden" id="fotoTraseira"><input type="text" id="obsTraseira" placeholder="Observação..." style="margin-top:0.5rem;font-size:0.8125rem;"></div>
        </div>`;
    
    if (pc) {
        h += `<div style="margin-top:1rem;"><label style="font-size:0.8125rem;">Caixa de Cintas *</label><div class="foto-container" onclick="capturarFoto('fotoCintas')" id="box-fotoCintas" style="max-width:33%;"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Foto da caixa</div></div><input type="hidden" id="fotoCintas"><input type="text" id="obsCintas" placeholder="Observação..." style="margin-top:0.5rem;font-size:0.8125rem;max-width:33%;"></div>`;
    }
    
    if (pfb) {
        h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">
            <div><label style="font-size:0.8125rem;">Banco Esq. *</label><div class="foto-container" onclick="capturarFoto('fotoBanco1')" id="box-fotoBanco1"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Clique</div></div><input type="hidden" id="fotoBanco1"></div>
            <div><label style="font-size:0.8125rem;">Banco Dir. *</label><div class="foto-container" onclick="capturarFoto('fotoBanco2')" id="box-fotoBanco2"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Clique</div></div><input type="hidden" id="fotoBanco2"></div>
        </div><div class="linha-form" style="margin-top:0.75rem;"><label>Observação dos Bancos</label><textarea id="obsBancos" rows="2"></textarea></div>`;
    }
    
    h += `<div class="section-title">📍 Localização</div>
        <div id="clLocalizacao" style="background:#f0fdf4;padding:1rem;border-radius:0.5rem;border:1px solid #bbf7d0;"><div style="display:flex;align-items:center;gap:0.5rem;color:#166534;"><span>🔄</span><span>Obtendo localização...</span></div></div>
        <input type="hidden" id="clLatitude"><input type="hidden" id="clLongitude">`;
    
    cont.innerHTML = h;
    obterLocalizacao();
}

function capturarFoto(campo) {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment';
    inp.onchange = e => {
        const arq = e.target.files[0]; if (!arq) return;
        const r = new FileReader();
        r.onload = ev => {
            const b64 = ev.target.result;
            document.getElementById(campo).value = b64;
            const box = document.getElementById('box-' + campo);
            if (box) { box.innerHTML = `<img src="${b64}" class="foto-preview">`; box.style.padding = '0.25rem'; }
        };
        r.readAsDataURL(arq);
    };
    inp.click();
}

function obterLocalizacao() {
    if (!navigator.geolocation) {
        const el = document.getElementById('clLocalizacao');
        if (el) el.innerHTML = '<div style="color:#991b1b;">❌ Geolocalização não suportada</div>';
        return;
    }
    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat = pos.coords.latitude, lng = pos.coords.longitude;
            document.getElementById('clLatitude').value = lat;
            document.getElementById('clLongitude').value = lng;
            const el = document.getElementById('clLocalizacao');
            if (el) el.innerHTML = `<div style="display:flex;align-items:center;gap:0.5rem;color:#166534;"><span>📍</span><span>Localização: <strong>${lat.toFixed(6)}, ${lng.toFixed(6)}</strong></span><a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" style="margin-left:1rem;color:#2563eb;text-decoration:underline;">Ver Maps →</a></div>`;
        },
        () => { const el = document.getElementById('clLocalizacao'); if (el) el.innerHTML = '<div style="color:#92400e;">⚠️ Localização não autorizada</div>'; },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function salvarChecklist() {
    const veiculo = document.getElementById('clVeiculo').value;
    if (!veiculo) { mostrarToast('Selecione um veículo!', 'aviso'); return; }
    
    const sel = document.getElementById('clVeiculo');
    const cat = sel.options[sel.selectedIndex]?.dataset.categoria;
    const cc = BD.config.categoriasVeiculos.find(c=>c.id===cat);
    
    const fotos = {};
    const obsFotos = {};
    ['fotoPainel','fotoFrente','fotoTraseira'].forEach(c => { const el = document.getElementById(c); if (el?.value) fotos[c] = el.value; });
    ['Painel','Frente','Traseira','Cintas','Bancos'].forEach(c => { const el = document.getElementById('obs'+c); if (el?.value) obsFotos[c.toLowerCase()] = el.value; });
    
    if (cc?.precisaCintas) { const fc = document.getElementById('fotoCintas'); if (fc?.value) fotos['fotoCintas'] = fc.value; }
    if (cc?.precisaFotosBancos) { ['fotoBanco1','fotoBanco2'].forEach(c => { const el = document.getElementById(c); if (el?.value) fotos[c] = el.value; }); }
    
    const dados = {
        id: gerarId(), veiculo, categoria: cat,
        data: new Date().toISOString(),
        usuarioId: window.usuarioAtual?.id, usuarioNome: window.usuarioAtual?.nome,
        itens: {
            oleo: document.getElementById('clOleo')?.value,
            agua: document.getElementById('clAgua')?.value,
            pneus: document.getElementById('clPneus')?.value,
            freios: document.getElementById('clFreios')?.value,
            luzes: document.getElementById('clLuzes')?.value,
            higiene: document.getElementById('clHigiene')?.value
        },
        observacoes: document.getElementById('clObservacoes')?.value || '',
        fotos, observacoesFotos: obsFotos,
        latitude: document.getElementById('clLatitude')?.value || null,
        longitude: document.getElementById('clLongitude')?.value || null,
        status: 'concluido'
    };
    
    if (cc?.precisaCintas) {
        const cintas = {
            cintas2m: parseInt(document.getElementById('clCintas2m')?.value)||0,
            cintas3m: parseInt(document.getElementById('clCintas3m')?.value)||0,
            cintas4m: parseInt(document.getElementById('clCintas4m')?.value)||0,
            cintas6m: parseInt(document.getElementById('clCintas6m')?.value)||0,
            cintasCatraca: parseInt(document.getElementById('clCintasCatraca')?.value)||0,
            catracas: parseInt(document.getElementById('clCatracas')?.value)||0
        };
        dados.cintas = cintas;
        const req = BD.config.requisitosCintas;
        const faltando = [];
        Object.entries(req).forEach(([it, min]) => { if ((cintas[it]||0) < min) faltando.push(`${it}: ${cintas[it]||0}/${min}`); });
        if (faltando.length > 0) {
            dados.alertaGerado = true;
            BD.alertas.push({ id: gerarId(), veiculo, data: new Date().toISOString(), motivo: `Cintas em falta: ${faltando.join(', ')}`, detalhes: faltando, resolvido: false, resolvidoPor: null, resolvidoEm: null, observacaoGestor: null });
        }
    }
    
    BD.checklists.push(dados);
    salvarDados();
    registrarLog('criacao', `Check-list: ${veiculo}`);
    
    if (dados.alertaGerado) alert('⚠️ Salvo! ATENÇÃO: Alerta de cintas gerado.');
    else mostrarToast('Check-list salvo com sucesso!', 'sucesso');
    
    fecharModal(); carregarTabelaChecklist(); atualizarDashboard();
}

function verificarAlertasCintas() {
    const cont = document.getElementById('alertasCintas');
    if (!cont) return;
    const ativos = (BD.alertas||[]).filter(a=>!a.resolvido);
    if (ativos.length === 0) { cont.innerHTML = ''; return; }
    cont.innerHTML = `<div class="alerta-destaque"><h4 style="margin:0 0 1rem;color:#991b1b;">⚠️ ALERTAS PENDENTES (${ativos.length})</h4>${ativos.map(a=>`<div style="background:white;padding:1rem;border-radius:0.5rem;margin-bottom:0.75rem;"><div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1rem;"><div><strong>🚛 ${a.veiculo}</strong><br><strong>📅 ${formatarData(a.data)}</strong><br><strong>⚠️ ${a.motivo}</strong></div><div><button class="btn btn-warning" onclick="resolverAlerta('${a.id}')">✓ Confirmar</button></div></div></div>`).join('')}</div>`;
}

function resolverAlerta(id) {
    if (!ehSupervisor() && !ehAdmin()) { alert('❌ Apenas gestores!'); return; }
    const obs = prompt('📝 Observações sobre a verificação:');
    if (obs === null) return;
    if (!obs.trim()) { mostrarToast('Preencha a observação!', 'aviso'); return; }
    const a = BD.alertas.find(x=>x.id===id);
    if (a) { a.resolvido = true; a.resolvidoPor = window.usuarioAtual?.nome; a.resolvidoEm = new Date().toISOString(); a.observacaoGestor = obs; salvarDados(); registrarLog('edicao', `Resolveu alerta ${a.veiculo}`); mostrarToast('Alerta resolvido e registrado!', 'sucesso'); verificarAlertasCintas(); atualizarDashboard(); }
}

function excluirChecklist(id) {
    const c = BD.checklists.find(x=>x.id===id);
    if (!ehSupervisor() && !ehAdmin() && !ehProprioRegistro(c)) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    if (!confirm('⚠️ Excluir?')) return;
    BD.checklists = BD.checklists.filter(x=>x.id!==id);
    salvarDados(); registrarLog('exclusao', 'Excluiu check-list'); carregarTabelaChecklist();
}

function carregarTabelaChecklist() {
    const corpo = document.getElementById('tabelaChecklist');
    if (!corpo) return;
    let cs = BD.checklists || [];
    if (ehOperacional() && !ehSupervisor() && !ehAdmin()) cs = cs.filter(c=>c.usuarioId===window.usuarioAtual?.id);
    
    const fv = document.getElementById('filtroChecklistVeiculo')?.value || 'todos';
    const di = document.getElementById('filtroChecklistDataIni')?.value;
    const df = document.getElementById('filtroChecklistDataFim')?.value;
    if (fv !== 'todos') cs = cs.filter(c=>c.veiculo===fv);
    if (di) cs = cs.filter(c=>new Date(c.data)>=new Date(di));
    if (df) { const f = new Date(df); f.setHours(23,59,59); cs = cs.filter(c=>new Date(c.data)<=f); }
    
    if (cs.length === 0) { corpo.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhum check-list</td></tr>'; return; }
    
    corpo.innerHTML = cs.slice().reverse().map(c => {
        const loc = c.latitude ? `<a href="https://www.google.com/maps?q=${c.latitude},${c.longitude}" target="_blank" style="color:#2563eb;">📍 Ver</a>` : '—';
        const ab = c.alertaGerado ? '<span class="badge badge-danger" style="margin-left:0.5rem;">⚠️ Alerta</span>' : '';
        const pode = ehAdmin()||ehSupervisor()||ehProprioRegistro(c);
        return `<tr><td>${formatarDataHora(c.data)}</td><td style="font-weight:600;">${c.veiculo}</td><td>${c.usuarioNome||'—'}</td><td><span class="badge badge-success">✅ Concluído</span>${ab}</td><td>${loc}</td><td>${pode?`<button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirChecklist('${c.id}')">🗑️</button>`:''}</td></tr>`;
    }).join('');
}

// ---------- 11. MANUTENÇÃO ----------
function abrirModalManutencao(m = null) {
    if (!ehSupervisor() && !ehAdmin()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    const ed = !!m;
    const vs = BD.veiculos || [];
    if (vs.length === 0) { alert('❌ Cadastre veículo!'); return; }
    const ops = vs.map(v=>`<option value="${v.placa}" ${m?.veiculo===v.placa?'selected':''}>${v.placa} - ${v.modelo}</option>`).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-fundo';
    modal.onclick = e => { if(e.target===modal) fecharModal(); };
    modal.innerHTML = `<div class="modal-corpo"><div class="modal-cabecalho"><h3 style="margin:0;">🔧 ${ed?'Editar':'Nova'} Manutenção</h3><button class="btn-fechar" onclick="fecharModal()" title="Fechar">×</button></div><div class="modal-conteudo"><form id="formManutencao">
        <div class="linha-form"><label>Veículo *</label><select id="mVeiculo" required>${ops}</select></div>
        <div class="linha-form"><label>Tipo *</label><select id="mTipo" required><option value="preventiva" ${m?.tipo==='preventiva'?'selected':''}>Preventiva</option><option value="corretiva" ${m?.tipo==='corretiva'?'selected':''}>Corretiva</option><option value="pneus" ${m?.tipo==='pneus'?'selected':''}>Pneus</option><option value="outro" ${m?.tipo==='outro'?'selected':''}>Outro</option></select></div>
        <div class="linha-form"><label>Descrição *</label><textarea id="mDescricao" rows="3" required>${m?.descricao||''}</textarea></div>
        <div class="linha-form"><label>Data Prevista</label><input type="date" id="mDataPrevista" value="${m?.dataPrevista||''}"></div>
        <div class="linha-form"><label>Status</label><select id="mStatus"><option value="aberta" ${m?.status==='aberta'?'selected':''}>Aberta</option><option value="andamento" ${m?.status==='andamento'?'selected':''}>Em Andamento</option><option value="concluida" ${m?.status==='concluida'?'selected':''}>Concluída</option></select></div>
        <div class="botoes-form"><button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button><button type="submit" class="btn btn-primary">💾 Salvar</button></div>
    </form></div></div>`;
    document.getElementById('modais').appendChild(modal);
    
    document.getElementById('formManutencao').addEventListener('submit', e => {
        e.preventDefault();
        const d = { veiculo: document.getElementById('mVeiculo').value, tipo: document.getElementById('mTipo').value, descricao: document.getElementById('mDescricao').value.trim(), dataPrevista: document.getElementById('mDataPrevista').value, status: document.getElementById('mStatus').value, usuarioId: window.usuarioAtual?.id, usuarioNome: window.usuarioAtual?.nome };
        if (ed) { const i = BD.manutencoes.findIndex(x=>String(x.id)===String(m.id)); if(i!==-1) BD.manutencoes[i] = { ...BD.manutencoes[i], ...d }; registrarLog('edicao', `Editou manutenção ${d.veiculo}`); }
        else { d.id = gerarId(); d.data = new Date().toISOString(); BD.manutencoes.push(d); registrarLog('criacao', `Manutenção: ${d.veiculo}`); }
        salvarDados(); alert('✅ Salvo!'); fecharModal(); carregarTabelaManutencao(); atualizarDashboard();
    });
}

function excluirManutencao(id) {
    if (!ehSupervisor() && !ehAdmin()) return;
    if (!confirm('⚠️ Excluir?')) return;
    BD.manutencoes = BD.manutencoes.filter(x=>x.id!==id);
    salvarDados(); registrarLog('exclusao', 'Excluiu manutenção'); carregarTabelaManutencao(); atualizarDashboard();
}

function carregarTabelaManutencao() {
    const corpo = document.getElementById('tabelaManutencao');
    if (!corpo) return;
    let ms = BD.manutencoes || [];
    const fv = document.getElementById('filtroManutencaoVeiculo')?.value || 'todos';
    const fs = document.getElementById('filtroManutencaoStatus')?.value || 'todos';
    if (fv !== 'todos') ms = ms.filter(x=>x.veiculo===fv);
    if (fs !== 'todos') ms = ms.filter(x=>x.status===fs);
    
    if (ms.length === 0) { corpo.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhuma manutenção</td></tr>'; return; }
    
    const sm = { aberta:'<span class="badge badge-danger">🔴 Aberta</span>', andamento:'<span class="badge badge-warning">🟡 Andamento</span>', concluida:'<span class="badge badge-success">🟢 Concluída</span>' };
    const tm = { preventiva:'Preventiva', corretiva:'Corretiva', pneus:'Pneus', outro:'Outro' };
    
    corpo.innerHTML = ms.slice().reverse().map(m => {
        const seg = JSON.stringify(m).replace(/"/g,'&quot;');
        return `<tr><td>${formatarData(m.data)}</td><td style="font-weight:600;">${m.veiculo}</td><td>${tm[m.tipo]||m.tipo}</td><td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.descricao}</td><td>${sm[m.status]||m.status}</td><td class="supervisor-only"><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='abrirModalManutencao(${seg})'>✏️</button><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirManutencao('${m.id}')">🗑️</button></td></tr>`;
    }).join('');
}

// ---------- 12. GASTOS ----------
function abrirModalGasto(g = null) {
    if (ehVisitante()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    const ed = !!g;
    const vs = BD.veiculos || [];
    const ps = BD.postos || [];
    if (vs.length === 0) { alert('❌ Cadastre veículo!'); return; }
    
    const apComb = ehOperacional() && !ehSupervisor() && !ehAdmin();
    const opsV = vs.map(v=>`<option value="${v.placa}" ${g?.veiculo===v.placa?'selected':''}>${v.placa} - ${v.modelo}</option>`).join('');
    const opsT = BD.config.tiposGasto.filter(t=>!apComb||t.id==='combustivel').map(t=>`<option value="${t.id}" ${g?.tipo===t.id?'selected':''}>${t.nome}</option>`).join('');
    const opsP = ps.map(p=>`<option value="${p.nome}" ${g?.posto===p.nome?'selected':''}>${p.nome}</option>`).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-fundo';
    modal.onclick = e => { if(e.target===modal) fecharModal(); };
    modal.innerHTML = `<div class="modal-corpo"><div class="modal-cabecalho"><h3 style="margin:0;">💳 ${ed?'Editar':'Novo'} Gasto</h3><button class="btn-fechar" onclick="fecharModal()" title="Fechar">×</button></div><div class="modal-conteudo">
        ${apComb?'<div style="background:#fef3c7;padding:0.75rem;border-radius:0.5rem;margin-bottom:1rem;font-size:0.875rem;color:#92400e;">ℹ️ Você só pode lançar combustível.</div>':''}
        <form id="formGasto">
        <div class="linha-form"><label>Veículo *</label><select id="gVeiculo" required>${opsV}</select></div>
        <div class="linha-form"><label>Tipo *</label><select id="gTipo" required onchange="toggleCampoPosto()">${opsT}</select></div>
        <div class="linha-form" id="campoPosto" style="display:none;"><label>Posto *</label><select id="gPosto"><option value="">Selecione</option>${opsP}</select></div>
        <div class="linha-form"><label>Descrição</label><input type="text" id="gDescricao" value="${g?.descricao||''}"></div>
        <div class="linha-form"><label>Valor (R$) *</label><input type="number" id="gValor" step="0.01" min="0" required value="${g?.valor||''}"></div>
        <div class="linha-form"><label>Data *</label><input type="date" id="gData" required value="${g?.data?.split('T')[0]||new Date().toISOString().split('T')[0]}"></div>
        <div class="botoes-form"><button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button><button type="submit" class="btn btn-primary">💾 Salvar</button></div>
    </form></div></div>`;
    document.getElementById('modais').appendChild(modal);
    toggleCampoPosto();
    
    document.getElementById('formGasto').addEventListener('submit', e => {
        e.preventDefault();
        const tipo = document.getElementById('gTipo').value;
        const d = { veiculo: document.getElementById('gVeiculo').value, tipo, posto: tipo==='combustivel'?document.getElementById('gPosto').value:null, descricao: document.getElementById('gDescricao').value.trim(), valor: parseFloat(document.getElementById('gValor').value)||0, data: new Date(document.getElementById('gData').value).toISOString(), usuarioId: window.usuarioAtual?.id, usuarioNome: window.usuarioAtual?.nome };
        if (tipo==='combustivel' && !d.posto) { alert('❌ Selecione o posto!'); return; }
        if (ed) { const i = BD.gastos.findIndex(x=>String(x.id)===String(g.id)); if(i!==-1) BD.gastos[i] = { ...BD.gastos[i], ...d }; registrarLog('edicao', `Editou gasto ${d.veiculo}`); }
        else { d.id = gerarId(); BD.gastos.push(d); registrarLog('criacao', `Gasto ${tipo}: ${d.veiculo} R$${d.valor}`); }
        salvarDados(); alert('✅ Salvo!'); fecharModal(); carregarTabelaGastos();
    });
}

function toggleCampoPosto() {
    const t = document.getElementById('gTipo')?.value;
    const c = document.getElementById('campoPosto');
    if (c) c.style.display = t==='combustivel' ? 'block' : 'none';
}

function excluirGasto(id) {
    if (!ehSupervisor() && !ehAdmin()) return;
    if (!confirm('⚠️ Excluir?')) return;
    BD.gastos = BD.gastos.filter(x=>x.id!==id);
    salvarDados(); registrarLog('exclusao', 'Excluiu gasto'); carregarTabelaGastos();
}

function carregarTabelaGastos() {
    const corpo = document.getElementById('tabelaGastos');
    if (!corpo) return;
    let gs = BD.gastos || [];
    const fv = document.getElementById('filtroGastosVeiculo')?.value || 'todos';
    const ft = document.getElementById('filtroGastosTipo')?.value || 'todos';
    if (fv !== 'todos') gs = gs.filter(x=>x.veiculo===fv);
    if (ft !== 'todos') gs = gs.filter(x=>x.tipo===ft);
    
    if (gs.length === 0) { corpo.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhum gasto</td></tr>'; return; }
    
    const tm = Object.fromEntries(BD.config.tiposGasto.map(t=>[t.id,t.nome]));
    corpo.innerHTML = gs.slice().reverse().map(g => {
        const seg = JSON.stringify(g).replace(/"/g,'&quot;');
        return `<tr><td>${formatarData(g.data)}</td><td style="font-weight:600;">${g.veiculo}</td><td>${tm[g.tipo]||g.tipo}${g.posto?`<br><small style="color:#64748b;">⛽ ${g.posto}</small>`:''}</td><td>${g.descricao||'—'}</td><td style="font-weight:600;color:#166534;">${formatarMoeda(g.valor)}</td><td class="supervisor-only"><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='abrirModalGasto(${seg})'>✏️</button><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirGasto('${g.id}')">🗑️</button></td></tr>`;
    }).join('');
}

// ---------- 13. CHAMADOS ----------
function abrirModalChamado(c = null) {
    if (ehVisitante()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    const ed = !!c;
    const vs = BD.veiculos || [];
    if (vs.length === 0) { alert('❌ Cadastre veículo!'); return; }
    const ops = vs.map(v=>`<option value="${v.placa}" ${c?.veiculo===v.placa?'selected':''}>${v.placa} - ${v.modelo}</option>`).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-fundo';
    modal.onclick = e => { if(e.target===modal) fecharModal(); };
    modal.innerHTML = `<div class="modal-corpo"><div class="modal-cabecalho"><h3 style="margin:0;">🔔 ${ed?'Editar':'Abrir'} Chamado</h3><button class="btn-fechar" onclick="fecharModal()" title="Fechar">×</button></div><div class="modal-conteudo"><form id="formChamado">
        <div class="linha-form"><label>Veículo *</label><select id="chVeiculo" required>${ops}</select></div>
        <div class="linha-form"><label>Título *</label><input type="text" id="chTitulo" required value="${c?.titulo||''}"></div>
        <div class="linha-form"><label>Descrição *</label><textarea id="chDescricao" rows="3" required>${c?.descricao||''}</textarea></div>
        <div class="linha-form"><label>Foto (opcional)</label><div class="foto-container" onclick="capturarFotoChamado()" id="box-chFoto" style="max-width:200px;"><div style="font-size:1.5rem;">📷</div><div style="font-size:0.75rem;color:#64748b;">Anexar foto</div></div><input type="hidden" id="chFoto"></div>
        <div class="linha-form"><label>Status</label><select id="chStatus"><option value="aberto" ${c?.status==='aberto'?'selected':''}>Aberto</option><option value="andamento" ${c?.status==='andamento'?'selected':''}>Em Andamento</option><option value="resolvido" ${c?.status==='resolvido'?'selected':''}>Resolvido</option></select></div>
        <div class="botoes-form"><button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button><button type="submit" class="btn btn-primary">💾 Salvar</button></div>
    </form></div></div>`;
    document.getElementById('modais').appendChild(modal);
    if (c?.foto) { const box = document.getElementById('box-chFoto'); if(box){box.innerHTML=`<img src="${c.foto}" class="foto-preview">`;box.style.padding='0.25rem';} document.getElementById('chFoto').value = c.foto; }
    
    document.getElementById('formChamado').addEventListener('submit', e => {
        e.preventDefault();
        const d = { veiculo: document.getElementById('chVeiculo').value, titulo: document.getElementById('chTitulo').value.trim(), descricao: document.getElementById('chDescricao').value.trim(), foto: document.getElementById('chFoto').value||null, status: document.getElementById('chStatus').value, usuarioId: window.usuarioAtual?.id, usuarioNome: window.usuarioAtual?.nome };
        if (ed) { const i = BD.chamados.findIndex(x=>String(x.id)===String(c.id)); if(i!==-1) BD.chamados[i] = { ...BD.chamados[i], ...d }; registrarLog('edicao', `Editou chamado ${d.veiculo}`); }
        else { d.id = gerarId(); d.data = new Date().toISOString(); BD.chamados.push(d); registrarLog('criacao', `Chamado: ${d.veiculo} - ${d.titulo}`); }
        salvarDados(); alert('✅ Salvo!'); fecharModal(); carregarTabelaChamados(); atualizarDashboard();
    });
}

function capturarFotoChamado() { capturarFoto('chFoto'); }

function excluirChamado(id) {
    const c = BD.chamados.find(x=>x.id===id);
    if (!ehSupervisor() && !ehAdmin() && !ehProprioRegistro(c)) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    if (!confirm('⚠️ Excluir?')) return;
    BD.chamados = BD.chamados.filter(x=>x.id!==id);
    salvarDados(); registrarLog('exclusao', 'Excluiu chamado'); carregarTabelaChamados(); atualizarDashboard();
}

function carregarTabelaChamados() {
    const corpo = document.getElementById('tabelaChamados');
    if (!corpo) return;
    let cs = BD.chamados || [];
    if (ehOperacional() && !ehSupervisor() && !ehAdmin()) cs = cs.filter(c=>c.usuarioId===window.usuarioAtual?.id);
    
    const fv = document.getElementById('filtroChamadosVeiculo')?.value || 'todos';
    const fs = document.getElementById('filtroChamadosStatus')?.value || 'todos';
    if (fv !== 'todos') cs = cs.filter(x=>x.veiculo===fv);
    if (fs !== 'todos') cs = cs.filter(x=>x.status===fs);
    
    if (cs.length === 0) { corpo.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhum chamado</td></tr>'; return; }
    
    const sm = { aberto:'<span class="badge badge-danger">🔴 Aberto</span>', andamento:'<span class="badge badge-warning">🟡 Andamento</span>', resolvido:'<span class="badge badge-success">🟢 Resolvido</span>' };
    
    corpo.innerHTML = cs.slice().reverse().map(c => {
        const seg = JSON.stringify(c).replace(/"/g,'&quot;');
        const pode = ehAdmin()||ehSupervisor()||ehProprioRegistro(c);
        const tf = c.foto ? ' 📷' : '';
        return `<tr><td>${formatarData(c.data)}</td><td style="font-weight:600;">${c.veiculo}</td><td>${c.titulo}${tf}</td><td>${sm[c.status]||c.status}</td><td>${pode?`<button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='abrirModalChamado(${seg})'>✏️</button><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirChamado('${c.id}')">🗑️</button>`:''}</td></tr>`;
    }).join('');
}

// ---------- 14. ALOCAÇÕES ----------
function abrirModalAlocacao(a = null) {
    if (!ehSupervisor() && !ehAdmin()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    const ed = !!a;
    const vs = BD.veiculos || [];
    const ls = BD.locais || [];
    if (vs.length === 0) { alert('❌ Cadastre veículo!'); return; }
    
    const opsV = vs.map(v=>`<option value="${v.placa}" ${a?.veiculo===v.placa?'selected':''}>${v.placa} - ${v.modelo}</option>`).join('');
    const opsL = ls.map(l=>`<option value="${l.nome}">${l.nome}</option>`).join('');
    
    const modal = document.createElement('div');
    modal.className = 'modal-fundo';
    modal.onclick = e => { if(e.target===modal) fecharModal(); };
    modal.innerHTML = `<div class="modal-corpo"><div class="modal-cabecalho"><h3 style="margin:0;">📍 ${ed?'Editar':'Nova'} Alocação</h3><button class="btn-fechar" onclick="fecharModal()" title="Fechar">×</button></div><div class="modal-conteudo"><form id="formAlocacao">
        <div class="linha-form"><label>Veículo *</label><select id="aVeiculo" required>${opsV}</select></div>
        <div class="linha-form"><label>Origem *</label><select id="aOrigem" required>${opsL}</select></div>
        <div class="linha-form"><label>Destino *</label><select id="aDestino" required>${opsL}</select></div>
        <div class="linha-form"><label>Data Início *</label><input type="date" id="aDataInicio" required value="${a?.dataInicio?.split('T')[0]||new Date().toISOString().split('T')[0]}"></div>
        <div class="linha-form"><label>Data Fim</label><input type="date" id="aDataFim" value="${a?.dataFim?.split('T')[0]||''}"></div>
        <div class="botoes-form"><button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button><button type="submit" class="btn btn-primary">💾 Salvar</button></div>
    </form></div></div>`;
    document.getElementById('modais').appendChild(modal);
    
    document.getElementById('formAlocacao').addEventListener('submit', e => {
        e.preventDefault();
        const d = { veiculo: document.getElementById('aVeiculo').value, origem: document.getElementById('aOrigem').value, destino: document.getElementById('aDestino').value, dataInicio: new Date(document.getElementById('aDataInicio').value).toISOString(), dataFim: document.getElementById('aDataFim').value?new Date(document.getElementById('aDataFim').value).toISOString():null, usuarioId: window.usuarioAtual?.id, usuarioNome: window.usuarioAtual?.nome };
        if (ed) { const i = BD.alocacoes.findIndex(x=>String(x.id)===String(a.id)); if(i!==-1) BD.alocacoes[i] = { ...BD.alocacoes[i], ...d }; registrarLog('edicao', `Editou alocação ${d.veiculo}`); }
        else { d.id = gerarId(); BD.alocacoes.push(d); registrarLog('criacao', `Alocação: ${d.veiculo} ${d.origem}→${d.destino}`); }
        salvarDados(); alert('✅ Salvo!'); fecharModal(); carregarTabelaAlocacoes();
    });
}

function excluirAlocacao(id) {
    if (!ehSupervisor() && !ehAdmin()) return;
    if (!confirm('⚠️ Excluir?')) return;
    BD.alocacoes = BD.alocacoes.filter(x=>x.id!==id);
    salvarDados(); registrarLog('exclusao', 'Excluiu alocação'); carregarTabelaAlocacoes();
}

function carregarTabelaAlocacoes() {
    const corpo = document.getElementById('tabelaAlocacoes');
    if (!corpo) return;
    let as = BD.alocacoes || [];
    const fv = document.getElementById('filtroAlocacoesVeiculo')?.value || 'todos';
    if (fv !== 'todos') as = as.filter(x=>x.veiculo===fv);
    
    if (as.length === 0) { corpo.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhuma alocação</td></tr>'; return; }
    
    corpo.innerHTML = as.slice().reverse().map(a => {
        const seg = JSON.stringify(a).replace(/"/g,'&quot;');
        return `<tr><td style="font-weight:600;">${a.veiculo}</td><td>📍 ${a.origem}</td><td>➡️ ${a.destino}</td><td>${formatarData(a.dataInicio)}</td><td>${a.dataFim?formatarData(a.dataFim):'—'}</td><td class="supervisor-only"><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fef3c7;color:#92400e;margin-right:0.25rem;" onclick='abrirModalAlocacao(${seg})'>✏️</button><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirAlocacao('${a.id}')">🗑️</button></td></tr>`;
    }).join('');
}

// ---------- 15. CONFIGURAÇÕES ----------
function carregarTelaConfiguracoes() {
    const lp = document.getElementById('listaPostos');
    if (lp) {
        const ps = BD.postos || [];
        lp.innerHTML = ps.length === 0 ? '<p style="color:#94a3b8;">Nenhum posto.</p>' : ps.map(p=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem;background:#f8fafc;border-radius:0.5rem;margin-bottom:0.5rem;"><span style="font-weight:500;">⛽ ${p.nome}</span><button class="btn" style="padding:0.25rem 0.5rem;font-size:0.75rem;background:#fee2e2;color:#991b1b;" onclick="excluirPosto('${p.id}')">🗑️</button></div>`).join('');
    }
    
    const lc = document.getElementById('listaCategoriasConfig');
    if (lc) lc.innerHTML = BD.config.categoriasVeiculos.map(c=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem;background:#f8fafc;border-radius:0.5rem;margin-bottom:0.5rem;"><div><span style="font-weight:600;">🚛 ${c.nome}</span>${c.precisaCintas?'<span class="badge badge-warning" style="margin-left:0.5rem;">🔗 Cintas</span>':''}${c.precisaFotosBancos?'<span class="badge badge-info" style="margin-left:0.5rem;">🪑 Bancos</span>':''}</div></div>`).join('');
    
    const cc = document.getElementById('configCintas');
    if (cc) {
        const r = BD.config.requisitosCintas;
        const n = { cintas2m:'Cintas 2m', cintas3m:'Cintas 3m', cintas4m:'Cintas 4m', cintas6m:'Cintas 6m', cintasCatraca:'Cintas Catraca', catracas:'Catracas' };
        cc.innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">${Object.entries(n).map(([k,v])=>`<div class="linha-form" style="margin:0;"><label>${v}</label><input type="number" min="0" value="${r[k]}" onchange="atualizarRequisitoCinta('${k}',this.value)"></div>`).join('')}</div>`;
    }
}

function adicionarPosto() {
    const inp = document.getElementById('novoPosto');
    const n = inp?.value.trim();
    if (!n) { alert('❌ Digite o nome!'); return; }
    if (BD.postos.some(p=>p.nome.toLowerCase()===n.toLowerCase())) { mostrarToast('Já existe este registro!', 'erro'); return; }
    BD.postos.push({ id: gerarId(), nome: n });
    salvarDados(); registrarLog('criacao', `Posto: ${n}`);
    inp.value = ''; carregarTelaConfiguracoes(); mostrarToast('Posto adicionado!', 'sucesso');
}

function excluirPosto(id) {
    if (!confirm('⚠️ Excluir posto?')) return;
    BD.postos = BD.postos.filter(p=>p.id!==id);
    salvarDados(); registrarLog('exclusao', 'Excluiu posto'); carregarTelaConfiguracoes();
}

function atualizarRequisitoCinta(chave, valor) {
    BD.config.requisitosCintas[chave] = parseInt(valor) || 0;
    salvarDados();
}

// ---------- 16. LOG ----------
function carregarLog() {
    const corpo = document.getElementById('tabelaLog');
    if (!corpo) return;
    let logs = BD.log || [];
    const fu = document.getElementById('filtroLogUsuario')?.value || 'todos';
    const fa = document.getElementById('filtroLogAcao')?.value || 'todas';
    if (fu !== 'todos') logs = logs.filter(l=>l.usuario===fu);
    if (fa !== 'todas') logs = logs.filter(l=>l.acao===fa);
    
    if (logs.length === 0) { corpo.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#94a3b8;padding:2rem;">Nenhuma ação</td></tr>'; return; }
    
    const am = { login:'<span class="badge badge-success">🔑 Login</span>', logout:'<span class="badge badge-info">🚪 Logout</span>', criacao:'<span class="badge badge-info">➕ Criação</span>', edicao:'<span class="badge badge-warning">✏️ Edição</span>', exclusao:'<span class="badge badge-danger">🗑️ Exclusão</span>' };
    
    corpo.innerHTML = logs.slice(0, 200).map(l=>`<tr><td style="white-space:nowrap;">${formatarDataHora(l.dataHora)}</td><td style="font-weight:600;">${l.usuario} <small style="color:#64748b;">(${l.perfil})</small></td><td>${am[l.acao]||l.acao}</td><td style="max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${l.detalhes}</td></tr>`).join('');
}

function limparLog() {
    if (!ehAdmin()) return;
    if (!confirm('⚠️ Limpar TODO o log?')) return;
    BD.log = []; salvarDados();
    registrarLog('exclusao', 'Limpou log');
    carregarLog(); mostrarToast('Log limpo!', 'sucesso');
}

// ---------- 17. INICIALIZAÇÃO ----------
quandoDOMPronto(function() {
    const fl = document.getElementById('formLogin');
    if (fl) fl.addEventListener('submit', e => { e.preventDefault(); entrarNoSistema(); });
    verificarSessao();
    console.log('✅ Sistema Gestão de Frotas v3.0 carregado!');
});
