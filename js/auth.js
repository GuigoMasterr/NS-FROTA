// ============================================================
// 🔐 AUTENTICAÇÃO - CORRIGIDA
// ✅ Login funcional
// ✅ Inicialização correta do sistema após login
// ✅ Sessão persistente
// ============================================================

// Usuários padrão (fallback)
window.USUARIOS_PADRAO = [
    { usuario: 'admin', senha: 'admin123', nome: 'Administrador', perfil: 'admin' },
    { usuario: 'operador', senha: '1234', nome: 'Operador', perfil: 'operacional' }
];

async function verificarSessao() {
    try {
        const sessao = localStorage.getItem('sessaoUsuario');
        if (sessao) {
            window.usuarioAtual = JSON.parse(sessao);
            console.log('✅ Sessão restaurada para:', window.usuarioAtual.nome);
            mostrarSistema();
        } else {
            console.log('ℹ️ Nenhuma sessão ativa, mostrando login');
            mostrarLogin();
        }
    } catch (e) {
        console.error('❌ Sessão corrompida:', e);
        localStorage.removeItem('sessaoUsuario');
        mostrarLogin();
    }
}

function mostrarLogin() {
    const telaLogin = document.getElementById('telaLogin');
    const telaSistema = document.getElementById('sistemaPrincipal');
    
    if (telaLogin) {
        telaLogin.style.display = 'flex';
        telaLogin.classList.remove('hidden');
    }
    if (telaSistema) {
        telaSistema.style.display = 'none';
        telaSistema.classList.add('hidden');
    }
}

async function mostrarSistema() {
    const telaLogin = document.getElementById('telaLogin');
    const telaSistema = document.getElementById('sistemaPrincipal');
    
    if (telaLogin) {
        telaLogin.style.display = 'none';
        telaLogin.classList.add('hidden');
    }
    if (telaSistema) {
        telaSistema.style.display = '';
        telaSistema.classList.remove('hidden');
    }
    
    sincronizarUsuarioNaTela();
    
    // Sincroniza dados (Supabase ou local)
    try {
        if (typeof sincronizarBD === 'function') {
            await sincronizarBD();
        }
    } catch (e) {
        console.warn('⚠️ Erro ao sincronizar, usando dados locais:', e.message);
    }
    
    // Inicializa todas as páginas
    inicializarPaginas();
    
    console.log('🏠 Sistema principal exibido e dados carregados!');
}

function inicializarPaginas() {
    try {
        console.log('📊 Inicializando páginas...');
        
        // Atualiza o dashboard (O MAIS IMPORTANTE!)
        if (typeof atualizarDashboardCompleto === 'function') {
            atualizarDashboardCompleto();
            console.log('✅ Dashboard atualizado');
        } else if (typeof atualizarDashboard === 'function') {
            atualizarDashboard();
            console.log('✅ Dashboard atualizado (legado)');
        } else {
            console.warn('⚠️ Nenhuma função de atualizar dashboard encontrada!');
        }
        
        // Atualiza listas de filtros
        if (typeof atualizarListaVeiculosNosFiltros === 'function') {
            atualizarListaVeiculosNosFiltros();
        }
        
        // Carrega tabelas
        if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
        if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao('todos');
        if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos('todos');
        if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
        if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
        if (typeof carregarTabelaAlocacoes === 'function') carregarTabelaAlocacoes();
        if (typeof carregarTabelaUsuarios === 'function') carregarTabelaUsuarios();
        
        console.log('✅ Todas as páginas inicializadas!');
        
    } catch (e) {
        console.error('❌ Erro em inicializarPaginas:', e);
    }
}

async function entrarNoSistema() {
    console.log('🔑 Tentativa de login...');
    
    try {
        const userInput = document.getElementById('loginUsuario');
        const passInput = document.getElementById('loginSenha');
        const erroEl = document.getElementById('erroLogin');
        
        const user = userInput ? userInput.value.trim() : '';
        const pass = passInput ? passInput.value : '';
        
        if (erroEl) {
            erroEl.style.display = 'none';
            erroEl.textContent = '';
        }
        
        if (!user || !pass) {
            const msg = '⚠️ Preencha usuário e senha!';
            if (erroEl) { erroEl.style.display = 'block'; erroEl.textContent = msg; }
            else alert(msg);
            return;
        }
        
        // Busca usuário no BD local
        let encontrado = null;
        
        if (window.BD && window.BD.usuarios && Array.isArray(window.BD.usuarios)) {
            encontrado = window.BD.usuarios.find(u => 
                u.usuario === user && u.senha === pass && u.ativo !== false
            );
        }
        
        // Fallback: usuários padrão
        if (!encontrado) {
            encontrado = window.USUARIOS_PADRAO.find(u => u.usuario === user && u.senha === pass);
        }
        
        if (!encontrado) {
            const msg = '❌ Usuário ou senha incorretos.';
            if (erroEl) { erroEl.style.display = 'block'; erroEl.textContent = msg; }
            else alert(msg);
            return;
        }
        
        // Login bem-sucedido!
        console.log('✅ Usuário autenticado:', encontrado.nome);
        
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
        console.error('❌ ERRO no login:', e);
        alert('❌ Erro interno. Tente novamente.');
    }
}

function sairDoSistema() {
    localStorage.removeItem('sessaoUsuario');
    window.usuarioAtual = null;
    console.log('👋 Logout realizado');
    
    if (typeof mostrarToast === 'function') {
        mostrarToast('Sessão encerrada', 'info');
    }
    
    mostrarLogin();
}

function sincronizarUsuarioNaTela() {
    try {
        if (!window.usuarioAtual) return;
        
        const elNome = document.getElementById('nomeUsuario');
        if (elNome) elNome.textContent = window.usuarioAtual.nome;
        
        const elPerfil = document.getElementById('perfilUsuario');
        if (elPerfil) {
            const perfis = {
                'admin': 'Administrador',
                'operador': 'Operacional',
                'operacional': 'Operacional',
                'motorista': 'Motorista',
                'supervisor': 'Supervisor'
            };
            elPerfil.textContent = perfis[window.usuarioAtual.perfil] || window.usuarioAtual.perfil;
        }
        
        const elAvatar = document.getElementById('userAvatar');
        if (elAvatar) {
            elAvatar.textContent = window.usuarioAtual.nome.charAt(0).toUpperCase();
        }
        
        // Atualiza data no topbar
        const elData = document.getElementById('topbarData');
        if (elData) {
            const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            elData.textContent = new Date().toLocaleDateString('pt-BR', opcoes);
        }
        
    } catch (e) {
        console.error('❌ Erro ao sincronizar usuário na tela:', e);
    }
}

// ============================================================
// 🚀 INICIALIZAÇÃO
// ============================================================
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
    }
    
    if (btnSair) {
        btnSair.addEventListener('click', sairDoSistema);
    }
    
    if (btnSairSidebar) {
        btnSairSidebar.addEventListener('click', sairDoSistema);
    }
    
    // Verifica sessão
    verificarSessao();
    
    console.log('✅ Autenticação inicializada!');
}

// Inicia quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAuth);
} else {
    inicializarAuth();
}

// Fallback de segurança
setTimeout(() => {
    const form = document.getElementById('formLogin');
    if (form && !form.__authInicializado) {
        form.__authInicializado = true;
        inicializarAuth();
    }
}, 1000);

console.log('✅ js/auth.js carregado');
