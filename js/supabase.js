// ==========================================
// 🔄 SINCRONIZAÇÃO COMPLETA — VEÍCULOS + DASHBOARD
// ==========================================

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

function salvarDados() {
    localStorage.setItem('NS_FROTA_DADOS', JSON.stringify(window.BD));
}

// ==========================================
// 📥 BAIXAR DO SUPABASE → ATUALIZAR BD → TELA
// ==========================================
async function baixarTodosDadosDoSupabase() {
    if (!window.supabaseReal) {
        console.warn('⚠️ Supabase não conectado');
        return;
    }

    try {
        console.log('🔄 Baixando veículos do Supabase...');

        const { data, error } = await window.supabaseReal
            .from('veiculos')
            .select('*');

        if (error) throw error;

        console.log(`✅ ${data.length} veículos baixados do Supabase`);

        // ✅ Formatar e carregar no BD global
        window.BD.veiculos = data.map(v => ({
            id: v.id,
            placa: (v.placa || 'SEM PLACA').toUpperCase().trim(),
            categoria: v.categoria || '',
            marca: v.marca || '',
            modelo: v.modelo || '',
            ano: v.ano || '',
            km_atual: v.km_atual || 0,
            horimetro_atual: v.horimetro_atual || 0,
            exigir_km: v.exigir_km !== false,
            exigir_horimetro: v.exigir_horimetro === true,
            obra_atual: '',
            responsavel: '',
            status: (v.status || 'Disponível').trim(),
            data_cadastro: v.data_cadastro || v.created_at || ''
        }));

        salvarDados();
        console.log('✅ BD ATUALIZADO —', BD.veiculos.length, 'veículos prontos');

        // ==========================================
        // 🎯 DISPARAR ATUALIZAÇÃO — DASHBOARD + TABELA
        // ==========================================
        dispararAtualizacaoTela();

    } catch (e) {
        console.error('❌ Erro na sincronização:', e);
    }
}

// ==========================================
// 🎯 CHAMAR DASHBOARD E TABELA APÓS DADOS PRONTOS
// ==========================================
function dispararAtualizacaoTela() {
    console.log('🔔 Dados prontos! Chamando atualizações...');

    let tentativas = 0;
    const esperar = setInterval(() => {
        tentativas++;

        // ✅ 1. Atualizar DASHBOARD assim que a função existir
        if (typeof atualizarDashboardCompleto === 'function') {
            console.log('📈 Atualizando DASHBOARD com', BD.veiculos.length, 'veículos');
            atualizarDashboardCompleto();
        }

        // ✅ 2. Atualizar TABELA de Veículos
        if (typeof carregarTabelaVeiculos === 'function') {
            console.log('📊 Atualizando TABELA de veículos');
            carregarTabelaVeiculos();
        }

        // ✅ Parar após 3 segundos
        if (tentativas > 30) {
            clearInterval(esperar);
            console.log('✅ TODAS AS ATUALIZAÇÕES CONCLUÍDAS!');
        }
    }, 100);
}

// ==========================================
// 🚀 INICIAR — SUPABASE PRIMEIRO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SISTEMA INICIADO');

    setTimeout(() => {
        if (window.supabaseReal) {
            baixarTodosDadosDoSupabase();
        } else {
            setTimeout(() => {
                if (window.supabaseReal) baixarTodosDadosDoSupabase();
            }, 1000);
        }
    }, 500);
});