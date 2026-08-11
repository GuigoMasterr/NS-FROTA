if (!window.__navegacaoInicializada) {
  window.__navegacaoInicializada = true;

  function mostrarPagina(pagina) {
  const paginas = document.querySelectorAll('.pagina');
  const alvo = document.getElementById('pagina-' + pagina);

  paginas.forEach(secao => {
    secao.classList.remove('ativa');
    secao.style.display = 'none';
  });

  if (!alvo) {
    console.warn('Página não encontrada:', pagina);
    return;
  }

  alvo.classList.add('ativa');
  alvo.style.display = 'block';

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
  }

  window.mostrarPagina = mostrarPagina;

  document.addEventListener('click', e => {
    const link = e.target.closest('.sidebar-link');
    if (link && link.dataset.pagina) {
      e.preventDefault();
      mostrarPagina(link.dataset.pagina);
    }
  });

  window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('sistemaPrincipal')) {
      mostrarPagina('dashboard');
    }
  });
}
