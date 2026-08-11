if (typeof window.usuarioAtual === 'undefined') window.usuarioAtual = null;
var usuarioAtual = window.usuarioAtual;
window.USUARIOS = window.USUARIOS || [
  { usuario: 'admin', senha: 'admin123', nome: 'Administrador', perfil: 'admin' },
  { usuario: 'operador', senha: '1234', nome: 'Operador', perfil: 'operador' }
];

function verificarSessao() {
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

  if (typeof carregarDados === 'function') carregarDados();
  if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
  if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
  if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao();
  if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos();
  if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
  if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
  else if (typeof atualizarDashboard === 'function') atualizarDashboard();
}

function entrarNoSistema() {
  const user = (document.getElementById('loginUsuario')?.value || document.getElementById('campoUsuario')?.value || '').trim();
  const pass = document.getElementById('loginSenha')?.value || document.getElementById('campoSenha')?.value || '';
  const erroEl = document.getElementById('erroLogin');

  if (erroEl) { erroEl.style.display = 'none'; erroEl.textContent = ''; }

  if (!user || !pass) {
    if (erroEl) { erroEl.style.display = 'block'; erroEl.textContent = '⚠️ Preencha usuário e senha!'; }
    else alert('⚠️ Preencha usuário e senha!');
    return;
  }

  console.log('Tentativa de login:', user, pass);
  const encontrado = window.USUARIOS.find(u => u.usuario === user && u.senha === pass);

  if (!encontrado) {
    const msg = `❌ Usuário ou senha incorretos (usuario='${user}').`;
    if (erroEl) { erroEl.style.display = 'block'; erroEl.textContent = msg; }
    else alert(msg);
    return;
  }

  window.usuarioAtual = { nome: encontrado.nome, usuario: encontrado.usuario, perfil: encontrado.perfil };
  usuarioAtual = window.usuarioAtual;
  localStorage.setItem('sessaoUsuario', JSON.stringify(window.usuarioAtual));
  mostrarSistema();
}

function sairDoSistema() {
  localStorage.removeItem('sessaoUsuario');
  usuarioAtual = null;
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
  const elInfo = document.getElementById('infoUsuario');
  if (elInfo && window.usuarioAtual) elInfo.textContent = window.usuarioAtual.nome;
}

document.addEventListener('DOMContentLoaded', verificarSessao);

// Conecta o formulário de login do `index.html` ao fluxo de autenticação
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