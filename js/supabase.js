// ============================================================
// 🔄 WRAPPER SUPABASE - VERSÃO SIMPLIFICADA
// ✅ A sincronização principal agora é feita pelo sync.js
// ✅ Este arquivo apenas garante que o BD existe e tenta
//    um carregamento extra do Supabase em background
// ============================================================

// Garante que BD existe, mas NUNCA sobrescreve se já existir
if (!window.BD) {
    window.BD = {
        veiculos: [], gastos: [], manutencoes: [], usuarios: [],
        chamados: [], alocacoes: [], despesasViagem: [], checklist: [], configuracoes: {}
    };
}

function salvarDadosSupabase() {
    if (typeof salvarDados === 'function') {
        salvarDados();
    } else {
        try { localStorage.setItem('bd_frotas', JSON.stringify(window.BD)); } catch(e) {}
    }
}

// Tenta baixar dados do Supabase em background (não bloqueia o dashboard)
async function baixarDadosSupabaseBackground() {
    if (!window.supabaseReal || !window.supabase?.temConexaoReal) {
        return;
    }
    
    try {
        console.log('🔄 [Background] Baixando veículos do Supabase...');
        
        const { data, error } = await window.supabaseReal.from('veiculos').select('*');
        
        if (error) {
            console.log('ℹ️ [Background] Supabase retornou erro, mantendo dados locais');
            return;
        }
        
        if (data && data.length > 0) {
            console.log(`✅ [Background] ${data.length} veículos baixados`);
            window.BD.veiculos = data.map(v => ({
                id: v.id,
                placa: (v.placa || 'SEM PLACA').toUpperCase().trim(),
                categoria: v.categoria || '',
                marca: v.marca || '',
                modelo: v.modelo || '',
                ano: v.ano || '',
                km_atual: v.km_atual || 0,
                obra_atual: v.obra_atual || v.obra || '',
                responsavel: v.responsavel || '',
                status: (v.status || 'disponivel').trim(),
                data_cadastro: v.data_cadastro || v.created_at || ''
            }));
            
            salvarDadosSupabase();
            
            // Atualiza dashboard com os novos dados
            if (typeof atualizarDashboardCompleto === 'function') {
                atualizarDashboardCompleto();
            }
            if (typeof carregarTabelaVeiculos === 'function') {
                carregarTabelaVeiculos();
            }
        }
        
    } catch (e) {
        console.log('ℹ️ [Background] Não foi possível baixar do Supabase:', e.message);
        // NÃO faz nada - os dados locais continuam valendo
    }
}

// Tenta após 2 segundos (em background, sem urgência)
setTimeout(baixarDadosSupabaseBackground, 2000);

console.log('✅ js/supabase.js carregado');
