// ==================================================
// 🔐 AUTENTICAÇÃO DO SISTEMA - VERSÃO CORRIGIDA 2.0
// ✅ Todos os bugs de login corrigidos
// ==================================================

// Garante que a variável global existe
if (typeof window.usuarioAtual === 'undefined') {
    window.usuarioAtual = null;
}
var usuarioAtual = window.usuarioAtual;

// Usuários padrão (fallback de emergência)
window.USUARIOS = window.USUARIOS || [
    { usuario: 'admin', senha: 'admin123', nome: 'Administrador', perfil: 'admin' },
    { usuario: 'operador', senha: '1234', nome: 'Operador', perfil: 'operador' }
];

// ==================================================
// 📋 FUNÇÕES PRINCIPAIS
// ==================================================

async function verificarSessao() {
    try {
        const sessao = localStorage.getItem('sessaoUsuario');
        if (sessao) {
            try {
                window.usuarioAtual = JSON.parse(sessao);
                usuarioAtual = window.usuarioAtual;
                console.log('✅ Sessão restaurada para:', window.usuarioAtual.nome);
                mostrarSistema();
            } catch (e) {
                console.error('❌ Sessão corrompida, fazendo logout:', e);
                localStorage.removeItem('sessaoUsuario');
                mostrarLogin();
            }
        } else {
            console.log('ℹ️ Nenhuma sessão ativa, mostrando login');
            mostrarLogin();
        }
    } catch (e) {
        console.error('❌ Erro em verificarSessao:', e);
        mostrarLogin();
    }
}

function mostrarLogin() {
    try {
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
        console.log('👀 Tela de login exibida');
    } catch (e) {
        console.error('❌ Erro em mostrarLogin:', e);
    }
}

function mostrarSistema() {
    try {
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
        
        // Carrega dados
        if (typeof sincronizarBD === 'function') {
            sincronizarBD()
                .then(() => inicializarPaginas())
                .catch(e => {
                    console.warn('⚠️ Erro ao sincronizar BD, usando dados locais:', e.message);
                    inicializarPaginas();
                });
        } else {
            inicializarPaginas();
        }
        
        console.log('🏠 Sistema principal exibido');
    } catch (e) {
        console.error('❌ Erro em mostrarSistema:', e);
    }
}

function inicializarPaginas() {
    try {
        if (typeof atualizarDashboardCompleto === 'function') {
            atualizarDashboardCompleto();
        } else if (typeof atualizarDashboard === 'function') {
            atualizarDashboard();
        }
        
        if (typeof atualizarListaVeiculosNosFiltros === 'function') {
            atualizarListaVeiculosNosFiltros();
        }
        
        if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
        if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao();
        if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos();
        if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
        if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
        if (typeof carregarTabelaAlocacoes === 'function') carregarTabelaAlocacoes();
        if (typeof carregarTabelaUsuarios === 'function') carregarTabelaUsuarios();
        if (typeof carregarListaDespesas === 'function') carregarListaDespesas();
    } catch (e) {
        console.error('❌ Erro em inicializarPaginas:', e);
    }
}

async function entrarNoSistema() {
    console.log('🔑 ====== TENTATIVA DE LOGIN ======');
    
    try {
        const userInput = document.getElementById('loginUsuario');
        const passInput = document.getElementById('loginSenha');
        const erroEl = document.getElementById('erroLogin');
        
        const user = userInput ? userInput.value.trim() : '';
        const pass = passInput ? passInput.value : '';
        
        console.log('📝 Usuário digitado:', user);
        console.log('📝 Senha digitada:', pass ? '*** (fornecida)' : 'VAZIA');
        
        // Limpa erro anterior
        if (erroEl) {
            erroEl.style.display = 'none';
            erroEl.textContent = '';
        }
        
        // Validação básica
        if (!user || !pass) {
            const msg = '⚠️ Preencha usuário e senha!';
            console.warn(msg);
            if (erroEl) {
                erroEl.style.display = 'block';
                erroEl.textContent = msg;
            } else {
                alert(msg);
            }
            return;
        }
        
        // Tenta autenticar
        let encontrado = null;
        
        if (typeof autenticarUsuario === 'function') {
            try {
                console.log('🔍 Tentando autenticarUsuario()...');
                encontrado = await autenticarUsuario(user, pass);
                console.log('📊 Resultado autenticarUsuario:', encontrado ? 'SUCESSO' : 'não encontrado');
            } catch (e) {
                console.error('❌ Erro em autenticarUsuario:', e);
            }
        } else {
            console.warn('⚠️ autenticarUsuario() não existe, tentando fallback local');
        }
        
        // Fallback 1: Banco de dados local
        if (!encontrado && typeof BD !== 'undefined' && BD.usuarios) {
            console.log('🔍 Tentando BD.usuarios...');
            encontrado = BD.usuarios.find(u => 
                u.usuario === user && u.senha === pass && u.ativo !== false
            );
        }
        
        // Fallback 2: Usuários padrão em memória
        if (!encontrado) {
            console.log('🔍 Tentando window.USUARIOS...');
            encontrado = window.USUARIOS.find(u => u.usuario === user && u.senha === pass);
        }
        
        // Fallback 3: Config padrão
        if (!encontrado && typeof CONFIG !== 'undefined' && CONFIG.LOGIN) {
            console.log('🔍 Tentando CONFIG.LOGIN...');
            if (user === CONFIG.LOGIN.ADMIN.usuario && pass === CONFIG.LOGIN.ADMIN.senha) {
                encontrado = CONFIG.LOGIN.ADMIN;
            } else if (user === CONFIG.LOGIN.MOTORISTA.usuario && pass === CONFIG.LOGIN.MOTORISTA.senha) {
                encontrado = CONFIG.LOGIN.MOTORISTA;
            }
        }
        
        if (!encontrado) {
            const msg = '❌ Usuário ou senha incorretos.';
            console.warn(msg);
            if (erroEl) {
                erroEl.style.display = 'block';
                erroEl.textContent = msg;
            } else {
                alert(msg);
            }
            return;
        }
        
        // Login bem-sucedido!
        console.log('✅ Usuário autenticado:', encontrado.nome);
        
        window.usuarioAtual = {
            nome: encontrado.nome,
            usuario: encontrado.usuario,
            perfil: encontrado.perfil || 'operador'
        };
        usuarioAtual = window.usuarioAtual;
        
        localStorage.setItem('sessaoUsuario', JSON.stringify(window.usuarioAtual));
        
        if (typeof mostrarToast === 'function') {
            mostrarToast(`Bem-vindo, ${encontrado.nome}!`, 'sucesso');
        } else {
            alert(`✅ Bem-vindo, ${encontrado.nome}!`);
        }
        
        mostrarSistema();
        
    } catch (e) {
        console.error('❌ ERRO CRÍTICO no login:', e);
        const erroEl = document.getElementById('erroLogin');
        const msg = '❌ Erro interno. Tente novamente ou recarregue a página.';
        if (erroEl) {
            erroEl.style.display = 'block';
            erroEl.textContent = msg;
        } else {
            alert(msg);
        }
    }
}

function sairDoSistema() {
    try {
        localStorage.removeItem('sessaoUsuario');
        usuarioAtual = null;
        window.usuarioAtual = null;
        console.log('👋 Logout realizado');
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Sessão encerrada', 'info');
        }
        
        mostrarLogin();
    } catch (e) {
        console.error('❌ Erro em sairDoSistema:', e);
    }
}

function sairSistema() {
    sairDoSistema();
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
                'supervisor': 'Supervisor',
                'visitante': 'Visitante'
            };
            elPerfil.textContent = perfis[window.usuarioAtual.perfil] || window.usuarioAtual.perfil;
        }
        
        const elAvatar = document.getElementById('userAvatar');
        if (elAvatar) {
            elAvatar.textContent = window.usuarioAtual.nome.charAt(0).toUpperCase();
        }
    } catch (e) {
        console.error('❌ Erro em sincronizarUsuarioNaTela:', e);
    }
}

// ==================================================
// ⚙️ INICIALIZAÇÃO ROBUSTA (o coração da correção)
// ==================================================

function inicializarAuth() {
    console.log('⚙️ ====== INICIALIZANDO AUTH ======');
    
    try {
        const form = document.getElementById('formLogin');
        const btnLogin = document.querySelector('#formLogin button[type="submit"]');
        
        console.log('📋 Formulário #formLogin:', form ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO');
        console.log('🔘 Botão submit:', btnLogin ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO');
        
        if (!form || !btnLogin) {
            console.warn('⚠️ Elementos não encontrados, tentando novamente em 300ms...');
            setTimeout(inicializarAuth, 300);
            return;
        }
        
        // ✅ CORREÇÃO: Usa addEventListener (NÃO .onsubmit/.onclick)
        // Isso impede que outros códigos sobrescrevam os handlers
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log('📨 Evento SUBMIT do formulário disparado!');
            entrarNoSistema();
            return false;
        });
        
        btnLogin.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log('🖱️ Evento CLICK do botão disparado!');
            entrarNoSistema();
            return false;
        });
        
        // Também suporta Enter diretamente nos campos
        const campos = document.querySelectorAll('#loginUsuario, #loginSenha');
        campos.forEach(campo => {
            campo.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log('⌨️ Enter pressionado no campo!');
                    entrarNoSistema();
                }
            });
        });
        
        console.log('✅ Todos os event listeners adicionados com sucesso!');
        
        // Marca como inicializado para evitar duplicação
        form.__authInicializado = true;
        
        // Sincroniza e verifica sessão
        sincronizarUsuarioNaTela();
        verificarSessao();
        
        console.log('⚙️ ====== AUTH INICIALIZADO COM SUCESSO ======');
        
    } catch (e) {
        console.error('❌ ERRO na inicialização do auth:', e);
        console.log('🔄 Tentando novamente em 1 segundo...');
        setTimeout(inicializarAuth, 1000);
    }
}

// ==================================================
// 🚀 PONTO DE ENTRADA - Múltiplas garantias
// ==================================================

function tentarIniciar() {
    // Verifica se já inicializou
    const form = document.getElementById('formLogin');
    if (form && form.__authInicializado) {
        console.log('ℹ️ Auth já inicializado, pulando');
        return;
    }
    
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        if (document.body) {
            inicializarAuth();
        } else {
            setTimeout(tentarIniciar, 50);
        }
    }
}

// Garantia 1: DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tentarIniciar);
} else {
    tentarIniciar();
}

// Garantia 2: window load
window.addEventListener('load', function() {
    const form = document.getElementById('formLogin');
    if (!form || !form.__authInicializado) {
        console.log('🔄 Fallback window.load acionado');
        inicializarAuth();
    }
});

// Garantia 3: Tentativa forçada após 2 segundos (rede de segurança)
setTimeout(function() {
    const form = document.getElementById('formLogin');
    if (!form || !form.__authInicializado) {
        console.warn('⚠️ Fallback de segurança acionado após 2s!');
        inicializarAuth();
    }
}, 2000);

console.log('📄 js/auth.js carregado e pronto');