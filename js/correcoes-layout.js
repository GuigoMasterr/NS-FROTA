/* ============================================================
   CORREÇÕES DE LAYOUT - JavaScript
   Funções para menu mobile, overlay e ajustes de layout
   ============================================================ */

// Função para alternar a sidebar no modo mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('aberto');
        overlay.classList.toggle('visivel');
    } else if (sidebar) {
        sidebar.classList.toggle('aberto');
    }
}

// Fechar sidebar ao clicar no overlay
function fecharSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar) sidebar.classList.remove('aberto');
    if (overlay) overlay.classList.remove('visivel');
}

// Inicializar eventos após o carregamento
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar evento de clique no overlay para fechar o menu
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.addEventListener('click', fecharSidebar);
    }
    
    // Adicionar evento no botão mobile se existir
    const btnMobile = document.getElementById('btnMobileMenu');
    if (btnMobile) {
        btnMobile.addEventListener('click', function(e) {
            e.preventDefault();
            toggleSidebar();
        });
    }
    
    // Fechar sidebar ao clicar em um link do menu (mobile)
    const linksSidebar = document.querySelectorAll('.sidebar-link');
    linksSidebar.forEach(function(link) {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                fecharSidebar();
            }
        });
    });
    
    // Ajustar layout ao redimensionar a janela
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            fecharSidebar();
        }
    });
    
    // Ajustar altura dos gráficos do dashboard
    ajustarGraficos();
});

// Função para ajustar gráficos quando a página for exibida
function ajustarGraficos() {
    // Verificar se ECharts está disponível
    if (typeof echarts !== 'undefined') {
        setTimeout(function() {
            // Redimensionar todos os gráficos
            const instances = echarts.getInstanceByDom;
            if (instances) {
                document.querySelectorAll('[_echarts_instance_]').forEach(function(dom) {
                    const chart = echarts.getInstanceByDom(dom);
                    if (chart) {
                        chart.resize();
                    }
                });
            }
        }, 100);
    }
}

// Garantir que a função toggleSidebar esteja disponível globalmente
window.toggleSidebar = toggleSidebar;
window.fecharSidebar = fecharSidebar;
