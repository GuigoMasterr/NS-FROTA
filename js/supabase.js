// ==========================================
// 🔄 SINCRONIZAÇÃO: BAIXA DO SUPABASE AO ABRIR
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

// Inicializar BD do localStorage primeiro
function carregarDadosLocais() {
    const dados = localStorage.getItem('NS_FROTA_DADOS');
    if (dados) {
        try {
            const parsed = JSON.parse(dados);
            Object.assign(window.BD, parsed);
            console.log('✅ Dados locais carregados');
        } catch (e) {
            console.warn('⚠️ Erro ao carregar dados locais:', e);
        }
    }
}

// Salvar dados no localStorage
function salvarDados() {
    localStorage.setItem('NS_FROTA_DADOS', JSON.stringify(window.BD));
    console.log('💾 Dados salvos localmente');
}

// ==========================================
// 📥 BAIXAR TUDO DO SUPABASE
// ==========================================
async function baixarTodosDadosDoSupabase() {
    if (!window.supabaseReal) {
        console.warn('⚠️ Supabase não conectado');
        return false;
    }

    try {
        console.log('🔄 Baixando dados do Supabase...');

        // BAIXAR VEÍCULOS
        const { data: veiculos, error: eVeiculos } = await window.supabaseReal
            .from('veiculos')
            .select('*');

        if (eVeiculos) throw eVeiculos;
        console.log(`🚛 ${veiculos.length} veículos baixados`);

        // Normalizar dados baixados
        window.BD.veiculos = veiculos.map(v => ({
            id: v.id,
            placa: v.placa || 'SEM PLACA',
            categoria: v.categoria || '',
            marca: v.marca || '',
            modelo: v.modelo || '',
            ano: v.ano || '',
            km_atual: v.km_atual || 0,
            obra_atual: v.obra_atual || '',
            responsavel: v.responsavel || '',
            status: v.status || 'Disponível',
            data_cadastro: v.data_cadastro || v.created_at || new Date().toISOString().split('T')[0]
        }));

        // Aqui você pode adicionar as outras tabelas depois...
        // window.BD.gastos = ...
        // window.BD.manutencoes = ...

        // Salvar tudo baixado no localStorage
        salvarDados();

        console.log('✅ TODOS os dados baixados e sincronizados!');
        return true;

    } catch (e) {
        console.error('❌ Erro ao baixar do Supabase:', e);
        alert('❌ Erro ao sincronizar: ' + e.message);
        return false;
    }
}

// ==========================================
// 🚀 INICIALIZAÇÃO AUTOMÁTICA
// ==========================================
async function inicializarSincronizacao() {
    console.log('🔄 Inicializando sistema...');
    
    // 1. Carregar dados locais primeiro (para aparecer rápido)
    carregarDadosLocais();

    // 2. Depois baixar do Supabase e substituir
    if (window.supabaseReal) {
        await baixarTodosDadosDoSupabase();
        
        // Recarregar a tela de veículos se estiver aberta
        if (typeof carregarTabelaVeiculos === 'function') {
            carregarTabelaVeiculos();
        }
    }
}

// Executar automaticamente quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(inicializarSincronizacao, 300); // Espera conexão carregar
});

// Disponível globalmente para botão manual
window.baixarTodosDadosDoSupabase = baixarTodosDadosDoSupabase;