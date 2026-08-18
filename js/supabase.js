// ==========================================
// 🔄 SINCRONIZAÇÃO COMPLETA — Dashboard + Tabela
// ==========================================

window.BD = window.BD || {
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

        // ✅ COLOCAR DADOS NO BD QUE O SISTEMA USA
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

        // Salvar no localStorage
        salvarDados();
        console.log('✅ BD atualizado com', BD.veiculos.length, 'veículos');

        // ✅ ATUALIZAR TABELA DE VEÍCULOS
        await atualizarTabelaVeiculos();

        // ✅ ATUALIZAR DASHBOARD
        await atualizarDashboard();

    } catch (e) {
        console.error('❌ Erro na sincronização:', e);
    }
}

// ==========================================
// 📊 ATUALIZAR TABELA DE VEÍCULOS
// ==========================================
async function atualizarTabelaVeiculos() {
    // Esperar a função do sistema estar pronta
    let tentativas = 0;
    const esperar = setInterval(() => {
        tentativas++;
        if (typeof carregarTabelaVeiculos === 'function') {
            clearInterval(esperar);
            console.log('📊 Chamando carregarTabelaVeiculos()...');
            carregarTabelaVeiculos();
        } else if (tentativas > 30) {
            clearInterval(esperar);
            console.log('⚠️ Função não encontrada — desenhando tabela manualmente');
            desenharTabelaManual();
        }
    }, 100);
}

// ==========================================
// 🎯 DESENHAR TABELA MANUALMENTE
// ==========================================
function desenharTabelaManual() {
    const tabela = document.querySelector('#tabelaVeiculos tbody') ||
                   document.querySelector('table tbody');
    
    if (!tabela) {
        console.warn('⚠️ Tabela não encontrada');
        return;
    }

    tabela.innerHTML = '';

    BD.veiculos.forEach(v => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${v.placa}</td>
            <td>${v.categoria}</td>
            <td>${v.marca || ''}</td>
            <td>${v.modelo || ''}</td>
            <td>${v.ano || ''}</td>
            <td>${v.km_atual}</td>
            <td>—</td>
            <td>—</td>
            <td><span class="tag-status ${v.status === 'Disponível' ? 'disponivel' : 'em-uso'}">${v.status}</span></td>
            <td class="acoes">
                <button class="btn-editar" data-id="${v.id}">Editar</button>
                <button class="btn-historico" data-id="${v.id}">Histórico</button>
                <button class="btn-excluir" data-id="${v.id}">Excluir</button>
                <button class="btn-documentos" data-id="${v.id}">📄 Doc</button>
            </td>
        `;
        tabela.appendChild(linha);
    });

    console.log('✅ Tabela desenhada com', BD.veiculos.length, 'veículos');
}

// ==========================================
// 📈 ATUALIZAR DASHBOARD
// ==========================================
async function atualizarDashboard() {
    // Esperar a função do sistema
    let tentativas = 0;
    const esperar = setInterval(() => {
        tentativas++;
        if (typeof atualizarDashboardCompleto === 'function') {
            clearInterval(esperar);
            console.log('📈 Chamando atualizarDashboardCompleto()...');
            atualizarDashboardCompleto();
        } else if (tentativas > 30) {
            clearInterval(esperar);
            console.log('⚠️ Função do Dashboard não encontrada — atualizando manualmente');
            atualizarDashboardManual();
        }
    }, 100);
}

// ==========================================
// 🎯 ATUALIZAR DASHBOARD MANUALMENTE
// ==========================================
function atualizarDashboardManual() {
    const total = BD.veiculos.length;
    const emOperacao = BD.veiculos.filter(v => v.status === 'Em Operação').length;
    const emManutencao = BD.veiculos.filter(v => v.status === 'Em Manutenção').length;

    const cards = document.querySelectorAll('.card-valor');
    if (cards[0]) cards[0].textContent = total;
    if (cards[1]) cards[1].textContent = emOperacao;
    if (cards[2]) cards[2].textContent = emManutencao;

    console.log(`✅ Dashboard: Total=${total} | Em Operação=${emOperacao} | Manutenção=${emManutencao}`);
}

// ==========================================
// 🚀 INICIAR AUTOMATICAMENTE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema iniciado');
    carregarDadosLocais();

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