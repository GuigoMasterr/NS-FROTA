// ==========================================
// 🔄 SINCRONIZAÇÃO AUTOMÁTICA — VERSÃO CORRIGIDA
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
            console.log('✅ Dados locais carregados');
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
// 📥 BAIXAR DO SUPABASE E EXIBIR
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
            status: v.status || 'Disponível',
            data_cadastro: v.data_cadastro || v.created_at || ''
        }));

        salvarDados();

        // 🎯 Chamar função de exibição ou desenhar diretamente
        if (typeof carregarTabelaVeiculos === 'function') {
            carregarTabelaVeiculos();
        } else {
            desenharTabelaManualmente();
        }

    } catch (e) {
        console.error('❌ Erro na sincronização:', e);
    }
}

// ==========================================
// 🎯 DESENHAR TABELA (FUNCIONA SEM DEPENDER DE OUTROS ARQUIVOS)
// ==========================================
function desenharTabelaManualmente() {
    // Procurar a área da tabela de forma inteligente
    let corpoTabela = document.querySelector('#tabelaVeiculos tbody') ||
                       document.querySelector('table tbody') ||
                       document.querySelector('.conteudo-pagina:has(th) tbody');

    // Se não achou pelo seletor, procurar pelo texto "Carregando"
    if (!corpoTabela) {
        const todos = document.querySelectorAll('div, table');
        for (let el of todos) {
            if (el.textContent.includes('Carregando')) {
                el.innerHTML = '';
                corpoTabela = el;
                break;
            }
        }
    }

    if (!corpoTabela) {
        console.warn('⚠️ Área da tabela não encontrada');
        return;
    }

    // Limpar e desenhar
    corpoTabela.innerHTML = '';

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
            <td class="acoes">
                <button class="btn-editar" data-id="${v.id}">Editar</button>
                <button class="btn-historico" data-id="${v.id}">Histórico</button>
                <button class="btn-excluir" data-id="${v.id}">Excluir</button>
                <button class="btn-documentos" data-id="${v.id}">📄 Doc</button>
            </td>
        `;
        corpoTabela.appendChild(linha);
    });

    console.log('✅ Tabela desenhada com sucesso!');
}

// ==========================================
// 🚀 INICIAR AUTOMATICAMENTE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Sistema iniciado');
    carregarDadosLocais();

    // Aguardar conexão e baixar
    setTimeout(() => {
        if (window.supabaseReal) {
            baixarTodosDadosDoSupabase();
        } else {
            // Tentar novamente após 1 segundo
            setTimeout(() => {
                if (window.supabaseReal) baixarTodosDadosDoSupabase();
            }, 1000);
        }
    }, 500);
});