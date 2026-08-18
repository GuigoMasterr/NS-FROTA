// ==========================================
// 🔄 SINCRONIZAÇÃO — ESPERA DADOS PRIMEIRO
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
// 📥 BAIXAR DO SUPABASE
// ==========================================
async function baixarTodosDadosDoSupabase() {
    if (!window.supabaseReal) return;

    try {
        console.log('🔄 Baixando veículos...');
        const { data, error } = await window.supabaseReal.from('veiculos').select('*');
        if (error) throw error;

        console.log(`✅ ${data.length} veículos baixados`);

        // Formatar dados
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

        salvarDados();
        console.log('✅ BD atualizado!');

        // ✅ SÓ AGORA — chamar exibição APÓS dados prontos
        setTimeout(atualizarTela, 300);

    } catch (e) {
        console.error('❌ Erro:', e);
    }
}

// ==========================================
// 🎯 EXIBIR TABELA E DASHBOARD
// ==========================================
function atualizarTela() {
    console.log('📊 Atualizando TABELA...');
    if (typeof carregarTabelaVeiculos === 'function') {
        carregarTabelaVeiculos();
    } else {
        desenharTabelaManual();
    }

    console.log('📈 Atualizando DASHBOARD...');
    if (typeof atualizarDashboardCompleto === 'function') {
        atualizarDashboardCompleto();
    }
}

// ==========================================
// 🎯 DESENHAR TABELA MANUALMENTE
// ==========================================
function desenharTabelaManual() {
    const tabela = document.querySelector('#tabelaVeiculos tbody') || document.querySelector('table tbody');
    if (!tabela) return;

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
            <td><span style="padding:2px 8px; border-radius:999px; background:#dcfce7; color:#166534; font-size:13px;">${v.status}</span></td>
            <td>
                <button style="padding:4px 8px; margin:0 2px; background:#3b82f6; color:white; border:none; border-radius:4px;">Editar</button>
                <button style="padding:4px 8px; margin:0 2px; background:#f59e0b; color:white; border:none; border-radius:4px;">Histórico</button>
                <button style="padding:4px 8px; margin:0 2px; background:#ef4444; color:white; border:none; border-radius:4px;">Excluir</button>
            </td>
        `;
        tabela.appendChild(linha);
    });

    console.log(`✅ Tabela exibida: ${BD.veiculos.length} veículos`);
}

// ==========================================
// 🚀 INICIAR
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
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