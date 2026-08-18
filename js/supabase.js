// ==========================================
// 🔄 SINCRONIZAÇÃO — SUPABASE PRIORITÁRIO
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

// Salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('NS_FROTA_DADOS', JSON.stringify(window.BD));
}

// ==========================================
// 📥 BAIXAR DO SUPABASE — PRIMEIRO, ANTES DE TUDO
// ==========================================
async function baixarTodosDadosDoSupabase() {
    if (!window.supabaseReal) {
        console.warn('⚠️ Supabase não conectado');
        return false;
    }

    try {
        console.log('🔄 BAIXANDO veículos do Supabase...');

        const { data, error } = await window.supabaseReal
            .from('veiculos')
            .select('*');

        if (error) throw error;

        console.log(`✅ ${data.length} VEÍCULOS BAIXADOS DO SUPABASE`);

        // ✅ FORMATAR E COLOCAR NO BD (sobrescreve qualquer dado antigo)
        window.BD.veiculos = data.map(v => ({
            id: v.id,
            placa: (v.placa || 'SEM PLACA').toUpperCase().trim(),
            categoria: v.categoria || '',
            marca: v.marca || '',
            modelo: v.modelo || '',
            ano: v.ano || '',
            km_atual: v.km_atual || 0,
            obra_atual: '',
            responsavel: '',
            status: (v.status || 'Disponível').trim(),
            data_cadastro: v.data_cadastro || v.created_at || ''
        }));

        // Salvar dados NOVOS no localStorage
        salvarDados();
        console.log('✅ BD ATUALIZADO —', BD.veiculos.length, 'veículos prontos');

        // ✅ AGORA SIM — atualizar TABELA e DASHBOARD
        dispararAtualizacaoTela();
        return true;

    } catch (e) {
        console.error('❌ Erro ao baixar:', e);
        return false;
    }
}

// ==========================================
// 🎯 DISPARAR ATUALIZAÇÃO DA TELA
// ==========================================
function dispararAtualizacaoTela() {
    let tentativas = 0;
    const esperar = setInterval(() => {
        tentativas++;

        // 1. Atualizar Tabela de Veículos
        if (typeof carregarTabelaVeiculos === 'function') {
            console.log('📊 Atualizando TABELA de veículos...');
            carregarTabelaVeiculos();
        }

        // 2. Atualizar Dashboard
        if (typeof atualizarDashboardCompleto === 'function') {
            console.log('📈 Atualizando DASHBOARD...');
            atualizarDashboardCompleto();
        }

        // Parar após 3 segundos
        if (tentativas > 30) {
            clearInterval(esperar);
            console.log('✅ Atualização concluída!');
        }
    }, 100);
}

// ==========================================
// 🚀 INICIAR — SUPABASE PRIMEIRO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SISTEMA INICIADO');

    // ❌ NÃO carregar dados antigos do localStorage — usar SOMENTE do Supabase

    // ✅ BAIXAR DO SUPABASE PRIMEIRO
    setTimeout(() => {
        if (window.supabaseReal) {
            baixarTodosDadosDoSupabase();
        } else {
            setTimeout(() => {
                if (window.supabaseReal) baixarTodosDadosDoSupabase();
            }, 1000);
        }
    }, 300);
});