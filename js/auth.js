// ==================================================
// 🔐 AUTENTICAÇÃO DO SISTEMA
// ==================================================

if (typeof window.usuarioAtual === 'undefined') window.usuarioAtual = null;
var usuarioAtual = window.usuarioAtual;

// Usuários padrão (fallback)
window.USUARIOS = window.USUARIOS || [
  { usuario: 'admin', senha: 'admin123', nome: 'Administrador', perfil: 'admin' },
  { usuario: 'operador', senha: '1234', nome: 'Operador', perfil: 'operador' }
];

async function verificarSessao() {
  const sessao = localStorage.getItem('sessaoUsuario');
  if (sessao) {
    try {
      window.usuarioAtual = JSON.parse(sessao);
      usuarioAtual = window.usuarioAtual;
      mostrarSistema();
    } catch {
      localStorage.removeItem('sessaoUsuario');
      mostrarLogin();
    }
  } else {
    mostrarLogin();
  }
}

function mostrarLogin() {
  const telaLogin = document.getElementById('telaLogin');
  const telaSistema = document.getElementById('sistemaPrincipal');
  if (telaLogin) telaLogin.classList.remove('hidden');
  if (telaSistema) telaSistema.classList.add('hidden');
}

function mostrarSistema() {
  const telaLogin = document.getElementById('telaLogin');
  const telaSistema = document.getElementById('sistemaPrincipal');
  if (telaLogin) telaLogin.classList.add('hidden');
  if (telaSistema) telaSistema.classList.remove('hidden');
  
  sincronizarUsuarioNaTela();
  
  // Carrega dados e inicializa as páginas
  if (typeof sincronizarBD === 'function') {
    sincronizarBD().then(() => {
      inicializarPaginas();
    });
  } else {
    inicializarPaginas();
  }
}

function inicializarPaginas() {
  // Carrega dashboard
  if (typeof atualizarDashboardCompleto === 'function') {
    atualizarDashboardCompleto();
  } else if (typeof atualizarDashboard === 'function') {
    atualizarDashboard();
  }
  
  // Atualiza listas de veículos nos filtros
  if (typeof atualizarListaVeiculosNosFiltros === 'function') {
    atualizarListaVeiculosNosFiltros();
  }
  
  // Carrega tabelas
  if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
  if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao();
  if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos();
  if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
  if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
  if (typeof carregarTabelaAlocacoes === 'function') carregarTabelaAlocacoes();
  if (typeof carregarTabelaUsuarios === 'function') carregarTabelaUsuarios();
  if (typeof carregarListaDespesas === 'function') carregarListaDespesas();
}

async function entrarNoSistema() {
  const user = (document.getElementById('loginUsuario')?.value || '').trim();
  const pass = document.getElementById('loginSenha')?.value || '';
  const erroEl = document.getElementById('erroLogin');
  
  if (erroEl) { erroEl.style.display = 'none'; erroEl.textContent = ''; }
  
  if (!user || !pass) {
    if (erroEl) { erroEl.style.display = 'block'; erroEl.textContent = '⚠️ Preencha usuário e senha!'; }
    else alert('⚠️ Preencha usuário e senha!');
    return;
  }
  
  console.log('Tentativa de login:', user);
  
  // Tenta autenticar via banco de dados (Supabase ou local)
  let encontrado = null;
  if (typeof autenticarUsuario === 'function') {
    encontrado = await autenticarUsuario(user, pass);
  }
  
  // Fallback: usuários locais em memória
  if (!encontrado) {
    encontrado = window.USUARIOS.find(u => u.usuario === user && u.senha === pass);
  }
  
  if (!encontrado) {
    const msg = `❌ Usuário ou senha incorretos.`;
    if (erroEl) { erroEl.style.display = 'block'; erroEl.textContent = msg; }
    else alert(msg);
    return;
  }
  
  window.usuarioAtual = { 
    nome: encontrado.nome, 
    usuario: encontrado.usuario, 
    perfil: encontrado.perfil || 'operador' 
  };
  usuarioAtual = window.usuarioAtual;
  
  localStorage.setItem('sessaoUsuario', JSON.stringify(window.usuarioAtual));
  
  if (typeof mostrarToast === 'function') {
    mostrarToast(`Bem-vindo, ${encontrado.nome}!`, 'sucesso');
  }
  
  mostrarSistema();
}

function sairDoSistema() {
  localStorage.removeItem('sessaoUsuario');
  usuarioAtual = null;
  window.usuarioAtual = null;
  if (typeof mostrarToast === 'function') {
    mostrarToast('Sessão encerrada', 'info');
  }
  mostrarLogin();
}

function sairSistema() {
  sairDoSistema();
}

function sincronizarUsuarioNaTela() {
  const elNome = document.getElementById('nomeUsuario');
  if (elNome && window.usuarioAtual) {
    elNome.textContent = window.usuarioAtual.nome;
  }
  
  const elPerfil = document.getElementById('perfilUsuario');
  if (elPerfil && window.usuarioAtual) {
    const perfis = {
      'admin': 'Administrador',
      'operador': 'Operador',
      'operacional': 'Operacional',
      'motorista': 'Motorista'
    };
    elPerfil.textContent = perfis[window.usuarioAtual.perfil] || window.usuarioAtual.perfil;
  }
  
  const elAvatar = document.getElementById('userAvatar');
  if (elAvatar && window.usuarioAtual) {
    elAvatar.textContent = window.usuarioAtual.nome.charAt(0).toUpperCase();
  }
}

// Conecta o formulário de login
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formLogin');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      entrarNoSistema();
    });
  }
  sincronizarUsuarioNaTela();
});