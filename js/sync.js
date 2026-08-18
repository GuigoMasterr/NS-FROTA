// ============================================================
// 🔄 SINCRONIZAÇÃO COM SUPABASE - VERSÃO ROBUSTA
// ✅ Garante que dados LOCAIS sempre carreguem primeiro
// ✅ Se Supabase falhar → dashboard continua funcionando
// ✅ Tratamento de erros em cada etapa
// ============================================================

async function sincronizarBD() {
    try {
        console.log('🔄 Iniciando sincronização...');
        
        // ==========================================
        // PASSO 1: Garante que BD existe e tem dados
        // ==========================================
        if (!window.BD || !window.BD.veiculos) {
            console.log('💾 Carregando/Inicializando banco de dados local...');
            if (typeof inicializarBD === 'function') {
                inicializarBD();
            } else {
                window.BD = {
                    veiculos: [], gastos: [], manutencoes: [], chamados: [],
                    usuarios: [], alocacoes: [], checklists: [], locais: []
                };
            }
        }
        
        // ==========================================
        // PASSO 2: Atualiza dashboard IMEDIATAMENTE com dados locais
        // ==========================================
        console.log('📊 Atualizando dashboard com dados locais...');
        if (typeof atualizarDashboardCompleto === 'function') {
            atualizarDashboardCompleto();
        }
        
        // ==========================================
        // PASSO 3: Verifica se deve tentar Supabase
        // ==========================================
        const supabaseDB = window.supabaseReal;
        
        if (!supabaseDB || !window.supabase?.temConexaoReal || typeof supabaseDB.from !== 'function') {
            console.log('ℹ️ Modo local ativado. Dados:', {
                veiculos: window.BD.veiculos?.length || 0,
                gastos: window.BD.gastos?.length || 0
            });
            atualizarListasDependentes();
            carregarTabelasModulos();
            return;
        }
        
        // ==========================================
        // PASSO 4: Tenta sincronizar com Supabase
        // ==========================================
        console.log('🌐 Tentando sincronizar com Supabase...');
        
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
        
        let houveSucesso = false;
        
        for (const tabela of mapeamentoTabelas) {
            try {
                const { data, error } = await supabaseDB.from(tabela.nuvem).select('*');
                
                if (error) {
                    console.warn(`   ⚠️ ${tabela.nuvem}: ${error.message}`);
                    continue;
                }
                
                if (data && data.length > 0) {
                    window.BD[tabela.local] = data;
                    console.log(`   ✅ ${tabela.nuvem}: ${data.length} registros`);
                    houveSucesso = true;
                } else {
                    console.log(`   ℹ️ ${tabela.nuvem}: vazia na nuvem`);
                }
                
            } catch (e) {
                console.warn(`   ⚠️ Falha em ${tabela.nuvem}:`, e.message);
            }
        }
        
        // Salva os dados (sejam do Supabase ou locais)
        if (typeof salvarDados === 'function') salvarDados();
        
        // ==========================================
        // PASSO 5: Atualiza tela novamente
        // ==========================================
        if (houveSucesso) {
            console.log('✅ Sincronização concluída! Atualizando tela...');
            if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
        } else {
            console.log('ℹ️ Nenhum dado novo da nuvem. Mantendo dados locais.');
        }
        
        atualizarListasDependentes();
        carregarTabelasModulos();
        
    } catch (e) {
        console.error('❌ Erro na sincronização:', e);
        // GARANTIA: mesmo com erro, atualiza a tela com dados locais
        console.log('🔄 Fallback: atualizando com dados locais...');
        try {
            if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
            atualizarListasDependentes();
            carregarTabelasModulos();
        } catch (e2) {
            console.error('❌ Erro no fallback:', e2);
        }
    }
}

function carregarTabelasModulos() {
    try {
        if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
        if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao('todos');
        if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos('todos');
        if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
        if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
        if (typeof carregarTabelaAlocacoes === 'function') carregarTabelaAlocacoes();
        if (typeof carregarTabelaUsuarios === 'function') carregarTabelaUsuarios();
    } catch (e) {
        console.warn('⚠️ Algumas tabelas não puderam ser carregadas:', e.message);
    }
}

async function sincronizarManualmente() {
    try {
        if (typeof mostrarToast === 'function') mostrarToast('Sincronizando...', 'info');
        await sincronizarBD();
        if (typeof mostrarToast === 'function') mostrarToast('Sincronização concluída!', 'sucesso');
        if (typeof fecharModal === 'function') fecharModal();
    } catch (e) {
        console.error('❌ Erro na sincronização manual:', e);
        if (typeof mostrarToast === 'function') mostrarToast('Erro ao sincronizar', 'erro');
    }
}

function atualizarListasDependentes() {
    try {
        if (typeof atualizarListaVeiculosNosFiltros === 'function') {
            atualizarListaVeiculosNosFiltros();
        }
    } catch (e) {
        console.error('❌ Erro ao atualizar listas:', e);
    }
}

// Expõe funções globalmente
window.sincronizarBD = sincronizarBD;
window.sincronizarManualmente = sincronizarManualmente;
window.atualizarListasDependentes = atualizarListasDependentes;
window.carregarTabelasModulos = carregarTabelasModulos;

console.log('✅ js/sync.js carregado - versão robusta');
