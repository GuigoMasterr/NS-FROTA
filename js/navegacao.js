// ==================================================
// 🧭 NAVEGAÇÃO DO SISTEMA - VERSÃO CORRIGIDA
// ==================================================
if (!window.__navegacaoInicializada) {
    window.__navegacaoInicializada = true;

    function mostrarPagina(pagina) {
        try {
            console.log('🧭 Navegando para:', pagina);
            
            const paginas = document.querySelectorAll('.pagina');
            const alvo = document.getElementById('pagina-' + pagina);
            
            paginas.forEach(secao => {
                secao.classList.remove('ativa');
            });
            
            if (!alvo) {
                console.warn('⚠️ Página não encontrada:', pagina);
                return;
            }
            
            alvo.classList.add('ativa');
            
            // Atualiza links do sidebar
            document.querySelectorAll('.sidebar-link').forEach(botao => botao.classList.remove('ativo'));
            const botaoAtivo = document.querySelector('.sidebar-link[data-pagina="' + pagina + '"]');
            if (botaoAtivo) botaoAtivo.classList.add('ativo');
            
            // Carrega dados específicos da página
            if (pagina === 'veiculos' && typeof carregarTabelaVeiculos === 'function') {
                carregarTabelaVeiculos();
            }
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
            if (pagina === 'chamados' && typeof carregarTabelaChamados === 'function') {
                carregarTabelaChamados();
            }
            if (pagina === 'alocacoes') {
                if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
                if (typeof carregarTabelaAlocacoes === 'function') carregarTabelaAlocacoes();
            }
            if (pagina === 'dashboard' && typeof atualizarDashboardCompleto === 'function') {
                atualizarDashboardCompleto();
            } else if (pagina === 'dashboard' && typeof atualizarDashboard === 'function') {
                atualizarDashboard();
            }
            if (pagina === 'usuarios' && typeof carregarTabelaUsuarios === 'function') {
                carregarTabelaUsuarios();
            }
            if (pagina === 'despesas-viagem' && typeof carregarListaDespesas === 'function') {
                carregarListaDespesas();
            }
            if (pagina === 'configuracoes' && typeof atualizarPaginaConfiguracoes === 'function') {
                atualizarPaginaConfiguracoes();
            }
            
            window.paginaAtual = pagina;
            console.log('✅ Página carregada:', pagina);
            
        } catch (e) {
            console.error('❌ Erro ao navegar para', pagina, ':', e);
        }
    }
    window.mostrarPagina = mostrarPagina;

    // Listener global para links do sidebar
    document.addEventListener('click', function(e) {
        try {
            const link = e.target.closest('.sidebar-link');
            if (link && link.dataset.pagina) {
                e.preventDefault();
                mostrarPagina(link.dataset.pagina);
            }
        } catch (err) {
            console.error('❌ Erro no listener de navegação:', err);
        }
    });

    // ==================================================
    // ✅ INICIALIZAÇÃO
    // ==================================================
    function inicializarNavegacao() {
        try {
            console.log('⚙️ Inicializando navegação...');
            
            if (document.getElementById('sistemaPrincipal')) {
                mostrarPagina('dashboard');
            }
            
            console.log('✅ Navegação inicializada');
        } catch (e) {
            console.error('❌ Erro ao inicializar navegação:', e);
        }
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', inicializarNavegacao);
    } else if (document.body) {
        inicializarNavegacao();
    } else {
        setTimeout(inicializarNavegacao, 50);
    }
    
    // Fallback
    setTimeout(function() {
        if (!window.paginaAtual && document.getElementById('sistemaPrincipal')) {
            console.warn('⚠️ Fallback de inicialização da navegação');
            inicializarNavegacao();
        }
    }, 3000);
}
