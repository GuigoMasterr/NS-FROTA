// ==================================================
// 🔄 SINCRONIZAÇÃO COM SUPABASE - VERSÃO CORRIGIDA
// ==================================================

async function sincronizarBD() {
    try {
        console.log('🔄 Iniciando sincronização...');
        
        const supabaseDB = window.supabase;
        
        // Se não tem conexão real, apenas carrega dados locais
        if (!supabaseDB || !supabaseDB.temConexaoReal) {
            console.log('ℹ️ Modo local - carregando dados do localStorage');
            await carregarDadosLocais();
            
            // Se não tem dados locais, carrega dados de demonstração
            if (typeof BD !== 'undefined' && (!BD.veiculos || BD.veiculos.length === 0)) {
                if (typeof carregarDadosDemonstracao === 'function') {
                    carregarDadosDemonstracao();
                }
            }
            
            window.BD = BD;
            atualizarListasDependentes();
            return;
        }
        
        console.log('🌐 Sincronizando com Supabase...');
        
        // Lista de tabelas para sincronizar
        const tabelas = ['veiculos', 'usuarios', 'manutencoes', 'gastos', 'chamados', 'checklists', 'alocacoes', 'locais'];
        
        for (const tabela of tabelas) {
            try {
                const { data, error } = await supabaseDB.from(tabela).select('*');
                if (!error && data && BD[tabela] !== undefined) {
                    BD[tabela] = data;
                    console.log(`✅ ${tabela}: ${data.length} registro(s)`);
                }
            } catch (e) {
                console.warn(`⚠️ Erro ao sincronizar ${tabela}:`, e.message);
            }
        }
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        atualizarListasDependentes();
        
        console.log('✅ Sincronização concluída!');
        
    } catch (e) {
        console.error('❌ Erro na sincronização:', e);
        // Fallback para dados locais
        try {
            await carregarDadosLocais();
        } catch (err) {
            console.error('❌ Erro ao carregar dados locais:', err);
        }
    }
}

async function sincronizarManualmente() {
    try {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Sincronizando...', 'info');
        } else {
            alert('🔄 Sincronizando...');
        }
        
        await sincronizarBD();
        
        // Atualiza a página atual
        if (typeof window.paginaAtual !== 'undefined' && typeof carregarDadosPagina === 'function') {
            carregarDadosPagina(window.paginaAtual);
        } else if (typeof atualizarDashboardCompleto === 'function') {
            atualizarDashboardCompleto();
        }
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Sincronização concluída!', 'sucesso');
        } else {
            alert('✅ Sincronização concluída!');
        }
        
        fecharModal();
        
    } catch (e) {
        console.error('❌ Erro na sincronização manual:', e);
        if (typeof mostrarToast === 'function') {
            mostrarToast('Erro ao sincronizar', 'erro');
        }
    }
}

function atualizarListasDependentes() {
    try {
        if (typeof atualizarListaVeiculosNosFiltros === 'function') {
            atualizarListaVeiculosNosFiltros();
        }
        if (typeof atualizarListaUsuariosNosFiltros === 'function') {
            atualizarListaUsuariosNosFiltros();
        }
    } catch (e) {
        console.error('❌ Erro ao atualizar listas:', e);
    }
}

// Expõe funções
window.sincronizarBD = sincronizarBD;
window.sincronizarManualmente = sincronizarManualmente;
window.atualizarListasDependentes = atualizarListasDependentes;

console.log('✅ js/sync.js inicializado');