// ==========================================
// 🔄 SINCRONIZAÇÃO CORRIGIDA
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

// Carregar dados locais
function carregarDadosLocais() {
    try {
        const dados = localStorage.getItem('NS_FROTA_DADOS');
        if (dados) {
            const parsed = JSON.parse(dados);
            Object.assign(window.BD, parsed);
            console.log('✅ Dados locais carregados:', BD.veiculos.length, 'veículos');
        }
    } catch (e) {
        console.warn('⚠️ Erro ao carregar dados locais:', e);
    }
}

// Salvar dados locais
function salvarDados() {
    localStorage.setItem('NS_FROTA_DADOS', JSON.stringify(window.BD));
}

// ==========================================
// 📥 BAIXAR DO SUPABASE E FORMATAR CORRETAMENTE
// ==========================================
async function baixarTodosDadosDoSupabase() {
    if (!window.supabaseReal) {
        console.warn('⚠️ Supabase não conectado');
        return false;
    }

    try {
        console.log('🔄 Baixando veículos do Supabase...');

        const { data, error } = await window.supabaseReal
            .from('veiculos')
            .select('*');

        if (error) throw error;

        console.log(`📥 ${data.length} veículos recebidos do Supabase`);
        console.log('Amostra:', data[0]);

        // ✅ Converter formato do Supabase → formato do sistema
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
            status: v.status || 'Disponível',
            data_cadastro: v.data_cadastro || v.created_at || new Date().toISOString().split('T')[0]
        }));

        // Salvar no localStorage
        salvarDados();

        // ✅ Recarregar TABELA na TELA com os dados já prontos
        if (typeof carregarTabelaVeiculos === 'function') {
            console.log('🔄 Atualizando tabela...');
            carregarTabelaVeiculos();
        } else {
            console.warn('⚠️ Função carregarTabelaVeiculos não encontrada!');
            // Recarregar página como garantia
            setTimeout(() => location.reload(), 500);
        }

        console.log('✅ Sincronização CONCLUÍDA!');
        return true;

    } catch (e) {
        console.error('❌ Erro ao baixar:', e);
        alert('Erro na sincronização: ' + e.message);
        return false;
    }
}

// ==========================================
// 🚀 INICIAR AUTOMATICAMENTE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema pronto!');
    carregarDadosLocais();

    // Baixar do Supabase após conexão estar pronta
    setTimeout(() => {
        if (window.supabaseReal) {
            baixarTodosDadosDoSupabase();
        } else {
            console.warn('⚠️ Supabase ainda não conectado');
            // Tentar novamente após 1 segundo
            setTimeout(() => {
                if (window.supabaseReal) baixarTodosDadosDoSupabase();
            }, 1000);
        }
    }, 500);
});