// ============================================================
// 🔐 AUTENTICAÇÃO - VERSÃO ROBUSTA
// ✅ Garante que BD existe ANTES de qualquer operação
// ✅ Atualiza dashboard imediatamente após login
// ============================================================

window.USUARIOS_PADRAO = [
    { usuario: 'admin', senha: 'admin123', nome: 'Administrador', perfil: 'admin' },
    { usuario: 'operador', senha: '1234', nome: 'Operador', perfil: 'operacional' }
];

async function verificarSessao() {
    try {
        // 🔥 GARANTE QUE O BD EXISTE
        if (!window.BD || !window.BD.veiculos) {
            console.log('💾 [Auth] BD não encontrado, inicializando...');
            if (typeof inicializarBD === 'function') {
                inicializarBD();
            }
        }
        
        const sessao = localStorage.getItem('sessaoUsuario');
        if (sessao) {
            window.usuarioAtual = JSON.parse(sessao);
            console.log('✅ Sessão restaurada:', window.usuarioAtual.nome);
            mostrarSistema();
        } else {
            console.log('ℹ️ Nenhuma sessão ativa');
            mostrarLogin();
        }
    } catch (e) {
        console.error('❌ Erro verificarSessao:', e);
        localStorage.removeItem('sessaoUsuario');
        mostrarLogin();
    }
}

function mostrarLogin() {
    const telaLogin = document.getElementById('telaLogin');
    const telaSistema = document.getElementById('sistemaPrincipal');
    if (telaLogin) { telaLogin.style.display = 'flex'; telaLogin.classList.remove('hidden'); }
    if (telaSistema) { telaSistema.style.display = 'none'; telaSistema.classList.add('hidden'); }
}

async function mostrarSistema() {
    const telaLogin = document.getElementById('telaLogin');
    const telaSistema = document.getElementById('sistemaPrincipal');
    
    if (telaLogin) { telaLogin.style.display = 'none'; telaLogin.classList.add('hidden'); }
    if (telaSistema) { telaSistema.style.display = ''; telaSistema.classList.remove('hidden'); }
    
    sincronizarUsuarioNaTela();
    
    // 🔥 GARANTE QUE O BD EXISTE
    if (!window.BD && typeof inicializarBD === 'function') {
        inicializarBD();
    }
    
    console.log('📊 Estado do BD antes da sincronização:', {
        veiculos: window.BD?.veiculos?.length || 0,
        gastos: window.BD?.gastos?.length || 0
    });
    
    // Sincroniza (Supabase ou local)
    try {
        if (typeof sincronizarBD === 'function') {
            await sincronizarBD();
        } else {
            console.warn('⚠️ sincronizarBD não existe, inicializando páginas diretamente');
            inicializarPaginas();
        }
    } catch (e) {
        console.warn('⚠️ Erro sincronização, inicializando diretamente:', e.message);
        inicializarPaginas();
    }
    
    console.log('🏠 Sistema exibido!');
}

function inicializarPaginas() {
    try {
        console.log('📊 Inicializando páginas. BD.veiculos =', window.BD?.veiculos?.length || 0);
        
        // DASHBOARD PRIMEIRO!
        if (typeof atualizarDashboardCompleto === 'function') {
            atualizarDashboardCompleto();
            console.log('✅ Dashboard atualizado!');
        } else {
            console.error('❌ atualizarDashboardCompleto NÃO EXISTE!');
        }
        
        // Listas e tabelas
        if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
        if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
        if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao('todos');
        if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos('todos');
        if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
        if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
        if (typeof carregarTabelaAlocacoes === 'function') carregarTabelaAlocacoes();
        if (typeof carregarTabelaUsuarios === 'function') carregarTabelaUsuarios();
        
    } catch (e) {
        console.error('❌ Erro inicializarPaginas:', e);
    }
}

async function entrarNoSistema() {
    try {
        const userInput = document.getElementById('loginUsuario');
        const passInput = document.getElementById('loginSenha');
        const erroEl = document.getElementById('erroLogin');
        
        const user = userInput ? userInput.value.trim() : '';
        const pass = passInput ? passInput.value : '';
        
        if (erroEl) { erroEl.style.display = 'none'; erroEl.textContent = ''; }
        
        if (!user || !pass) {
            const msg = '⚠️ Preencha usuário e senha!';
            if (erroEl) { erroEl.style.display = 'block'; erroEl.textContent = msg; }
            return;
        }
        
        // Garante que BD existe
        if (!window.BD && typeof inicializarBD === 'function') inicializarBD();
        
        let encontrado = null;
        
        if (window.BD?.usuarios) {
            encontrado = window.BD.usuarios.find(u => 
                u.usuario === user && u.senha === pass && u.ativo !== false
            );
        }
        
        if (!encontrado) {
            encontrado = window.USUARIOS_PADRAO.find(u => u.usuario === user && u.senha === pass);
        }
        
        if (!encontrado) {
            const msg = '❌ Usuário ou senha incorretos.';
            if (erroEl) { erroEl.style.display = 'block'; erroEl.textContent = msg; }
            return;
        }
        
        console.log('✅ Login:', encontrado.nome);
        
        window.usuarioAtual = {
            nome: encontrado.nome,
            usuario: encontrado.usuario,
            perfil: encontrado.perfil || 'operacional'
        };
        
        localStorage.setItem('sessaoUsuario', JSON.stringify(window.usuarioAtual));
        
        if (typeof mostrarToast === 'function') {
            mostrarToast(`Bem-vindo, ${encontrado.nome}!`, 'sucesso');
        }
        
        mostrarSistema();
        
    } catch (e) {
        console.error('❌ ERRO login:', e);
        alert('❌ Erro interno. Tente novamente.');
    }
}

function sairDoSistema() {
    localStorage.removeItem('sessaoUsuario');
    window.usuarioAtual = null;
    if (typeof mostrarToast === 'function') mostrarToast('Sessão encerrada', 'info');
    mostrarLogin();
}

function sincronizarUsuarioNaTela() {
    try {
        if (!window.usuarioAtual) return;
        
        const elNome = document.getElementById('nomeUsuario');
        if (elNome) elNome.textContent = window.usuarioAtual.nome;
        
        const elPerfil = document.getElementById('perfilUsuario');
        if (elPerfil) {
            const perfis = { 'admin': 'Administrador', 'operador': 'Operacional', 'operacional': 'Operacional', 'motorista': 'Motorista' };
            elPerfil.textContent = perfis[window.usuarioAtual.perfil] || window.usuarioAtual.perfil;
        }
        
        const elAvatar = document.getElementById('userAvatar');
        if (elAvatar) elAvatar.textContent = window.usuarioAtual.nome.charAt(0).toUpperCase();
        
        const elData = document.getElementById('topbarData');
        if (elData) {
            elData.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        }
    } catch (e) {
        console.error('❌ Erro sincronizarUsuarioNaTela:', e);
    }
}

function inicializarAuth() {
    console.log('⚙️ Inicializando autenticação...');
    
    const form = document.getElementById('formLogin');
    const btnSair = document.getElementById('btnSair');
    const btnSairSidebar = document.getElementById('btnSairSidebar');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            entrarNoSistema();
        });
        form.__authInicializado = true;
    }
    
    if (btnSair) btnSair.addEventListener('click', sairDoSistema);
    if (btnSairSidebar) btnSairSidebar.addEventListener('click', sairDoSistema);
    
    verificarSessao();
    console.log('✅ Autenticação inicializada!');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAuth);
} else {
    inicializarAuth();
}

setTimeout(() => {
    const form = document.getElementById('formLogin');
    if (form && !form.__authInicializado) inicializarAuth();
}, 1000);

console.log('✅ js/auth.js carregado');
