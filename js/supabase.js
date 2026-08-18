// ============================================================
// 🔄 WRAPPER DE SINCRONIZAÇÃO SUPABASE
// ✅ NÃO redefine window.BD (preserva dados carregados)
// ✅ Baixa dados do Supabase e atualiza o BD existente
// ============================================================

// Garante que BD existe, mas NÃO sobrescreve se já existir
if (!window.BD) {
    window.BD = {
        veiculos: [],
        gastos: [],
        manutencoes: [],
        usuarios: [],
        chamados: [],
        alocacoes: [],
        despesasViagem: [],
        checklist: [],
        configuracoes: {}
    };
}

function salvarDadosSupabase() {
    if (typeof salvarDados === 'function') {
        salvarDados();
    } else {
        localStorage.setItem('bd_frotas', JSON.stringify(window.BD));
    }
}

async function baixarTodosDadosDoSupabase() {
    if (!window.supabaseReal || typeof window.supabaseReal.from !== 'function') {
        console.log('ℹ️ Supabase não conectado, mantendo dados locais');
        return;
    }
    
    try {
        console.log('🔄 Baixando dados do Supabase...');
        
        const { data, error } = await window.supabaseReal.from('veiculos').select('*');
        if (error) throw error;
        
        console.log(`✅ ${data.length} veículos baixados do Supabase`);
        
        // Atualiza o BD existente (NÃO substitui tudo)
        if (data && data.length > 0) {
            window.BD.veiculos = data.map(v => ({
                id: v.id,
                placa: (v.placa || 'SEM PLACA').toUpperCase().trim(),
                categoria: v.categoria || '',
                marca: v.marca || '',
                modelo: v.modelo || '',
                ano: v.ano || '',
                km_atual: v.km_atual || 0,
                horimetro_atual: v.horimetro_atual || 0,
                obra_atual: v.obra_atual || v.obra || '',
                responsavel: v.responsavel || '',
                status: (v.status || 'disponivel').trim(),
                data_cadastro: v.data_cadastro || v.created_at || ''
            }));
            
            salvarDadosSupabase();
            dispararAtualizacaoTela();
        }
        
    } catch (e) {
        console.error('❌ Erro na sincronização Supabase:', e.message);
    }
}

function dispararAtualizacaoTela() {
    console.log('🔔 Dados prontos! Atualizando tela...');
    
    let tentativas = 0;
    const esperar = setInterval(() => {
        tentativas++;
        
        if (typeof atualizarDashboardCompleto === 'function') {
            console.log('📈 Atualizando DASHBOARD com', window.BD.veiculos.length, 'veículos');
            atualizarDashboardCompleto();
        }
        
        if (typeof carregarTabelaVeiculos === 'function') {
            carregarTabelaVeiculos();
        }
        
        if (tentativas > 20) {
            clearInterval(esperar);
            console.log('✅ Atualizações concluídas!');
        }
    }, 150);
}

// Tenta sincronizar após o sistema estar carregado
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.supabaseReal && typeof window.supabaseReal.from === 'function') {
            baixarTodosDadosDoSupabase();
        }
    }, 1000);
});

console.log('✅ js/supabase.js carregado');
