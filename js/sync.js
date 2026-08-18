// ============================================================
// 🔄 SINCRONIZAÇÃO COM SUPABASE - CORRIGIDA E UNIFICADA
// ✅ Funciona com Supabase OU modo local
// ✅ Usa window.BD consistente
// ============================================================

async function sincronizarBD() {
    try {
        console.log('🔄 Iniciando sincronização...');
        
        // Garante que o BD existe
        if (!window.BD) {
            if (typeof inicializarBD === 'function') {
                inicializarBD();
            } else {
                window.BD = { veiculos: [], gastos: [], manutencoes: [], chamados: [], usuarios: [], alocacoes: [], checklists: [] };
            }
        }
        
        const supabaseDB = window.supabaseReal || window.supabase;
        
        // Se não tem conexão real com Supabase, usa apenas dados locais
        if (!supabaseDB || !supabaseDB.temConexaoReal || typeof supabaseDB.from !== 'function') {
            console.log('ℹ️ Modo local - carregando/validando dados locais');
            
            if (typeof carregarDadosLocais === 'function') {
                await carregarDadosLocais();
            }
            
            // Se não tem veículos, carrega dados de demonstração
            if (!window.BD.veiculos || window.BD.veiculos.length === 0) {
                console.log('ℹ️ Sem dados locais, carregando demonstração...');
                if (typeof carregarDadosDemonstracao === 'function') {
                    carregarDadosDemonstracao();
                }
            }
            
            atualizarListasDependentes();
            return;
        }
        
        console.log('🌐 Sincronizando com Supabase...');
        
        // Lista de tabelas para sincronizar
        const mapeamentoTabelas = [
            { local: 'veiculos', nuvem: 'veiculos' },
            { local: 'usuarios', nuvem: 'usuarios' },
            { local: 'manutencoes', nuvem: 'manutencoes' },
            { local: 'gastos', nuvem: 'gastos' },
            { local: 'chamados', nuvem: 'chamados' },
            { local: 'checklists', nuvem: 'checklists' },
            { local: 'alocacoes', nuvem: 'alocacoes' },
            { local: 'locais', nuvem: 'locais' }
        ];
        
        for (const tabela of mapeamentoTabelas) {
            try {
                const { data, error } = await supabaseDB.from(tabela.nuvem).select('*');
                if (!error && data && window.BD[tabela.local] !== undefined) {
                    window.BD[tabela.local] = data;
                    console.log(`✅ ${tabela.nuvem}: ${data.length} registro(s)`);
                }
            } catch (e) {
                console.warn(`⚠️ Erro ao sincronizar ${tabela.nuvem}:`, e.message);
            }
        }
        
        // Salva os dados carregados no localStorage como backup
        if (typeof salvarDados === 'function') salvarDados();
        
        atualizarListasDependentes();
        console.log('✅ Sincronização concluída!');
        
    } catch (e) {
        console.error('❌ Erro na sincronização:', e);
        // Fallback para dados locais
        try {
            if (typeof carregarDadosLocais === 'function') {
                await carregarDadosLocais();
            }
        } catch (err) {
            console.error('❌ Erro ao carregar dados locais:', err);
        }
    }
}

async function sincronizarManualmente() {
    try {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Sincronizando...', 'info');
        }
        
        await sincronizarBD();
        
        // Atualiza dashboard
        if (typeof atualizarDashboardCompleto === 'function') {
            atualizarDashboardCompleto();
        }
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Sincronização concluída!', 'sucesso');
        }
        
        if (typeof fecharModal === 'function') fecharModal();
        
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
        console.error('❌ Erro ao atualizar listas dependentes:', e);
    }
}

// Expõe funções globalmente
window.sincronizarBD = sincronizarBD;
window.sincronizarManualmente = sincronizarManualmente;
window.atualizarListasDependentes = atualizarListasDependentes;

console.log('✅ js/sync.js carregado');
