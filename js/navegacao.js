if (!window.__navegacaoInicializada) {
  window.__navegacaoInicializada = true;

  function mostrarPagina(pagina) {
  const paginas = document.querySelectorAll('.pagina');
  const alvo = document.getElementById('pagina-' + pagina);

  paginas.forEach(secao => {
    secao.classList.remove('ativa');
  });

  if (!alvo) {
    console.warn('Página não encontrada:', pagina);
    return;
  }

  alvo.classList.add('ativa');

  document.querySelectorAll('.sidebar-link').forEach(botao => botao.classList.remove('ativo'));
  const botaoAtivo = document.querySelector('.sidebar-link[data-pagina="' + pagina + '"]');
  if (botaoAtivo) botaoAtivo.classList.add('ativo');

  if (pagina === 'veiculos' && typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
  if (pagina === 'checklist' && typeof carregarTabelaChecklist === 'function') {
    if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    carregarTabelaChecklist();
  }
  if (pagina === 'manutencao' && typeof carregarTabelaManutencao === 'function') {
    if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    carregarTabelaManutencao();
  }
  if (pagina === 'gastos' && typeof carregarTabelaGastos === 'function') {
    if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    carregarTabelaGastos();
  }
  if (pagina === 'chamados' && typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
  if (pagina === 'alocacoes') {
    if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    if (typeof carregarTabelaAlocacoes === 'function') carregarTabelaAlocacoes();
  }
  if (pagina === 'dashboard' && typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
  if (pagina === 'usuarios' && typeof carregarTabelaUsuarios === 'function') carregarTabelaUsuarios();
  if (pagina === 'despesas-viagem' && typeof carregarListaDespesas === 'function') carregarListaDespesas();
  }

  window.mostrarPagina = mostrarPagina;

  document.addEventListener('click', e => {
    const link = e.target.closest('.sidebar-link');
    if (link && link.dataset.pagina) {
      e.preventDefault();
      mostrarPagina(link.dataset.pagina);
    }
  });


// ==================================================
// ✅ CORREÇÃO: Inicialização imediata
// ==================================================
function inicializarNavegacao() {
  if (document.getElementById('sistemaPrincipal')) {
    mostrarPagina('dashboard');
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', inicializarNavegacao);
} else if (document.body) {
  inicializarNavegacao();
} else {
  setTimeout(inicializarNavegacao, 50);
}
}
