/* ============================================================
   MELHORIAS DASHBOARD - Sistema de Gestão de Frotas
   Integra gráficos ECharts com dados reais do sistema
   ============================================================ */

// Variáveis globais dos gráficos
let chartCategoria, chartGastos, chartStatus;
let dashboardDebug = true; // Ativa logs no console para debug

// Inicializa o dashboard aprimorado
function inicializarDashboardAprimorado() {
    if (dashboardDebug) console.log('🚀 [DASHBOARD] Inicializando...');
    
    // Atualiza data atual
    atualizarDataDashboard();
    
    // Inicializa gráficos
    inicializarChartCategoria();
    inicializarChartGastos();
    inicializarChartStatus();
    
    // Carrega dados reais (NÃO usa mais dados de demonstração por padrão)
    carregarDadosDashboardAprimorado();
    
    // Redimensiona gráficos ao mudar tamanho da janela
    window.addEventListener('resize', function() {
        if (chartCategoria) chartCategoria.resize();
        if (chartGastos) chartGastos.resize();
        if (chartStatus) chartStatus.resize();
    });
    
    if (dashboardDebug) console.log('✅ [DASHBOARD] Inicialização concluída!');
}

// Atualiza a data no cabeçalho
function atualizarDataDashboard() {
    const el = document.getElementById('dataAtualDashboard');
    if (!el) return;
    const hoje = new Date();
    const opcoes = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    el.textContent = hoje.toLocaleDateString('pt-BR', opcoes);
}

// ============================================================
// GRÁFICO 1: Distribuição por Categoria (Rosca)
// ============================================================
function inicializarChartCategoria() {
    const el = document.getElementById('chartCategoria');
    if (!el || typeof echarts === 'undefined') return;
    
    chartCategoria = echarts.init(el);
    
    const opcoes = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            bottom: 0,
            textStyle: { color: '#64748b', fontSize: 11 },
            itemWidth: 10,
            itemHeight: 10
        },
        series: [{
            type: 'pie',
            radius: ['45%', '72%'],
            center: ['50%', '42%'],
            avoidLabelOverlap: true,
            itemStyle: {
                borderRadius: 6,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: { show: false },
            emphasis: {
                label: { show: true, fontSize: 13, fontWeight: 600 }
            },
            labelLine: { show: false },
            data: []
        }]
    };
    
    chartCategoria.setOption(opcoes);
}

// ============================================================
// GRÁFICO 2: Evolução de Gastos (Barras Empilhadas)
// ============================================================
function inicializarChartGastos() {
    const el = document.getElementById('chartGastos');
    if (!el || typeof echarts === 'undefined') return;
    
    chartGastos = echarts.init(el);
    
    const opcoes = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: function(params) {
                let total = 0;
                let html = params[0].axisLabel + '<br/>';
                params.forEach(p => {
                    html += '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + p.color + ';margin-right:6px;"></span>' + p.seriesName + ': <b>R$ ' + p.value.toLocaleString('pt-BR') + '</b><br/>';
                    total += p.value;
                });
                return html + '<b>Total: R$ ' + total.toLocaleString('pt-BR') + '</b>';
            }
        },
        legend: { show: false },
        grid: { left: '3%', right: '3%', bottom: '3%', top: '8%', containLabel: true },
        xAxis: {
            type: 'category',
            data: [],
            axisLabel: { color: '#64748b', fontSize: 11 },
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#e2e8f0' } }
        },
        yAxis: {
            type: 'value',
            axisLabel: { 
                color: '#64748b', 
                fontSize: 11,
                formatter: function(v) { return 'R$ ' + (v/1000) + 'k'; }
            },
            splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        series: [
            {
                name: 'Combustível',
                type: 'bar',
                stack: 'total',
                data: [],
                itemStyle: { color: '#4f46e5' },
                barWidth: 28
            },
            {
                name: 'Manutenção',
                type: 'bar',
                stack: 'total',
                data: [],
                itemStyle: { color: '#06b6d4' },
                barWidth: 28
            },
            {
                name: 'Outros',
                type: 'bar',
                stack: 'total',
                data: [],
                itemStyle: { borderRadius: [6, 6, 0, 0], color: '#f59e0b' },
                barWidth: 28
            }
        ]
    };
    
    chartGastos.setOption(opcoes);
}

// ============================================================
// GRÁFICO 3: Status da Frota (Barras Horizontais)
// ============================================================
function inicializarChartStatus() {
    const el = document.getElementById('chartStatus');
    if (!el || typeof echarts === 'undefined') return;
    
    chartStatus = echarts.init(el);
    
    const opcoes = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        grid: { left: '3%', right: '12%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: {
            type: 'value',
            axisLabel: { color: '#64748b', fontSize: 11 },
            splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        yAxis: {
            type: 'category',
            data: ['Inativos', 'Manutenção', 'Operação'],
            axisLabel: { color: '#1e293b', fontSize: 12, fontWeight: 500 },
            axisTick: { show: false },
            axisLine: { show: false }
        },
        series: [{
            type: 'bar',
            data: [
                { value: 0, itemStyle: { color: '#dc2626', borderRadius: [0, 6, 6, 0] } },
                { value: 0, itemStyle: { color: '#f59e0b', borderRadius: [0, 6, 6, 0] } },
                { value: 0, itemStyle: { color: '#22c55e', borderRadius: [0, 6, 6, 0] } }
            ],
            barWidth: 22,
            label: {
                show: true,
                position: 'right',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 12,
                formatter: '{c} un.'
            }
        }]
    };
    
    chartStatus.setOption(opcoes);
}

// ============================================================
// CARREGAR DADOS REAIS DO SISTEMA
// ============================================================
function carregarDadosDashboardAprimorado() {
    if (dashboardDebug) console.log('📊 [DASHBOARD] Carregando dados reais do sistema...');
    
    // Tenta buscar dados do sistema existente
    const veiculos = buscarDados('veiculos') || buscarDados('veiculo') || [];
    const gastos = buscarDados('gastos') || buscarDados('gasto') || buscarDados('despesas') || [];
    const chamados = buscarDados('chamados') || buscarDados('chamado') || [];
    const checklists = buscarDados('checklists') || buscarDados('checklist') || buscarDados('inspecoes') || [];
    const manutencoes = buscarDados('manutencoes') || buscarDados('manutencao') || buscarDados('servicos') || [];
    
    if (dashboardDebug) {
        console.log('📋 [DASHBOARD] Resumo dos dados encontrados:');
        console.log(`   🚛 Veículos: ${veiculos.length}`);
        console.log(`   💰 Gastos: ${gastos.length}`);
        console.log(`   🔔 Chamados: ${chamados.length}`);
        console.log(`   ✅ Check-lists: ${checklists.length}`);
        console.log(`   🔧 Manutenções: ${manutencoes.length}`);
    }
    
    // SEMPRE usa dados reais - NÃO cai mais em dados de demonstração
    if (veiculos.length === 0 && gastos.length === 0 && chamados.length === 0) {
        if (dashboardDebug) {
            console.warn('⚠️ [DASHBOARD] Nenhum dado real encontrado!');
            console.log('💡 [DASHBOARD] Dicas para fazer os dados aparecerem:');
            console.log('   1. Verifique se seus dados estão salvos no localStorage');
            console.log('   2. Ou se existem variáveis globais como: window.listaVeiculos, window.dadosVeiculos, etc.');
            console.log('   3. Abra o Console (F12) e digite: window para ver todas as variáveis disponíveis');
        }
        // Mostra mensagem no dashboard
        mostrarMensagemSemDados();
        return;
    }
    
    // Atualiza tudo com dados reais
    atualizarStatsComDadosReais(veiculos, gastos, chamados);
    atualizarGraficosComDadosReais(veiculos, gastos);
    atualizarChecklist(checklists);
    atualizarAlertas(veiculos, manutencoes);
    atualizarAtividadesRecentes(veiculos, gastos, chamados, checklists, manutencoes);
    
    if (dashboardDebug) console.log('🎉 [DASHBOARD] Dados reais carregados e exibidos com sucesso!');
}

// Mostra mensagem amigável quando não há dados reais
function mostrarMensagemSemDados() {
    // Zera os stats
    definirTexto('stat-total', '0');
    definirTexto('stat-operacao', '0');
    definirTexto('stat-operacao-percent', '0% da frota');
    definirTexto('stat-manutencao', '0');
    definirTexto('stat-chamados', '0');
    definirTexto('stat-gastos', 'R$ 0');
    definirTexto('stat-gastos-tendencia', '—');
    definirTexto('stat-km', '0');
    definirTexto('stat-custo-km', 'Custo/km: R$ 0,00');
    
    // Atualiza gráficos vazios
    if (chartCategoria) {
        chartCategoria.setOption({ series: [{ data: [{ name: 'Sem dados', value: 1, itemStyle: { color: '#cbd5e1' } }] }] });
    }
    if (chartGastos) {
        chartGastos.setOption({
            xAxis: { data: ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'] },
            series: [
                { data: [0, 0, 0, 0, 0, 0] },
                { data: [0, 0, 0, 0, 0, 0] },
                { data: [0, 0, 0, 0, 0, 0] }
            ]
        });
    }
    if (chartStatus) {
        chartStatus.setOption({
            xAxis: { max: 1 },
            series: [{
                data: [
                    { value: 0, itemStyle: { color: '#dc2626', borderRadius: [0, 6, 6, 0] } },
                    { value: 0, itemStyle: { color: '#f59e0b', borderRadius: [0, 6, 6, 0] } },
                    { value: 0, itemStyle: { color: '#22c55e', borderRadius: [0, 6, 6, 0] } }
                ]
            }]
        });
    }
    
    // Checklist
    const ring = document.getElementById('checklistProgressRing');
    if (ring) ring.style.strokeDashoffset = 377;
    definirTexto('checklistPercent', '0%');
    definirTexto('checklistContagem', '0/0');
    
    const containerCheck = document.getElementById('checklistDetalhes');
    if (containerCheck) {
        containerCheck.innerHTML = `
            <div class="mini-stat"><span class="label">Concluídos</span><span class="valor">0</span></div>
            <div class="mini-stat"><span class="label">Pendentes</span><span class="valor">0</span></div>
            <div class="mini-stat"><span class="label">Com pendências</span><span class="valor">0</span></div>
        `;
    }
    
    // Alertas
    definirTexto('alertaContagem', '0');
    const containerAlertas = document.getElementById('listaAlertasDashboard');
    if (containerAlertas) {
        containerAlertas.innerHTML = '<p style="color:#94a3b8; font-size:0.875rem; text-align:center; padding:1rem 0;">Nenhum alerta no momento.</p>';
    }
    
    // Atividades
    const tbody = document.getElementById('tabelaAtividadesRecentes');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">Nenhuma atividade registrada. Cadastre veículos, gastos ou faça check-lists para ver os dados aqui.</td></tr>';
    }
}

// Função auxiliar para buscar dados (compatível com localStorage e variáveis globais)
function buscarDados(tabela) {
    try {
        if (dashboardDebug) console.log(`🔍 [DASHBOARD] Buscando dados de: ${tabela}`);
        
        // ==========================================
        // TENTATIVA 1: localStorage (várias chaves)
        // ==========================================
        const chavesLocalStorage = [
            'frota_' + tabela,
            tabela,
            'dados_' + tabela,
            'lista_' + tabela,
            'sistema_' + tabela,
            'gestao_' + tabela
        ];
        
        for (const chave of chavesLocalStorage) {
            const dados = localStorage.getItem(chave);
            if (dados) {
                try {
                    const parsed = JSON.parse(dados);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        if (dashboardDebug) console.log(`✅ [DASHBOARD] Encontrados ${parsed.length} registros de ${tabela} no localStorage (chave: ${chave})`);
                        return parsed;
                    }
                } catch (e) {
                    if (dashboardDebug) console.warn(`⚠️ [DASHBOARD] Erro ao parsear chave ${chave}:`, e);
                }
            }
        }
        
        // ==========================================
        // TENTATIVA 2: Variáveis globais (vários nomes)
        // ==========================================
        const tabelaCapitalizada = tabela.charAt(0).toUpperCase() + tabela.slice(1);
        const nomesVariaveis = [
            'lista' + tabelaCapitalizada,
            'dados' + tabelaCapitalizada,
            tabela,
            tabela + 'Lista',
            tabela + 'Dados',
            'todos' + tabelaCapitalizada,
            'tabela' + tabelaCapitalizada,
            // Singular
            tabela.slice(0, -1),
            'lista' + tabelaCapitalizada.slice(0, -1),
            'dados' + tabelaCapitalizada.slice(0, -1)
        ];
        
        for (const nome of nomesVariaveis) {
            if (window[nome] && Array.isArray(window[nome]) && window[nome].length > 0) {
                if (dashboardDebug) console.log(`✅ [DASHBOARD] Encontrados ${window[nome].length} registros de ${tabela} na variável global: window.${nome}`);
                return window[nome];
            }
        }
        
        // ==========================================
        // TENTATIVA 3: Objeto global de dados
        // ==========================================
        const objetosGlobais = ['dados', 'sistema', 'app', 'frota', 'banco', 'store'];
        for (const obj of objetosGlobais) {
            if (window[obj]) {
                if (window[obj][tabela] && Array.isArray(window[obj][tabela]) && window[obj][tabela].length > 0) {
                    if (dashboardDebug) console.log(`✅ [DASHBOARD] Encontrados ${window[obj][tabela].length} registros em window.${obj}.${tabela}`);
                    return window[obj][tabela];
                }
                const singular = tabela.slice(0, -1);
                if (window[obj][singular] && Array.isArray(window[obj][singular]) && window[obj][singular].length > 0) {
                    if (dashboardDebug) console.log(`✅ [DASHBOARD] Encontrados ${window[obj][singular].length} registros em window.${obj}.${singular}`);
                    return window[obj][singular];
                }
            }
        }
        
        if (dashboardDebug) console.log(`ℹ️ [DASHBOARD] Nenhum dado de ${tabela} encontrado ainda.`);
        return [];
        
    } catch (e) {
        console.error(`❌ [DASHBOARD] Erro ao buscar dados de ${tabela}:`, e);
        return [];
    }
}

// Função auxiliar para definir texto em elementos
function definirTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

// ============================================================
// ATUALIZAR STATS COM DADOS REAIS
// ============================================================
function atualizarStatsComDadosReais(veiculos, gastos, chamados) {
    const total = veiculos.length;
    const operacao = veiculos.filter(v => v.status === 'disponivel' || v.status === 'alocado').length;
    const manutencao = veiculos.filter(v => v.status === 'manutencao').length;
    const chamadosAbertos = chamados.filter(c => c.status === 'aberto' || c.status === 'andamento').length;
    
    // Gastos do mês atual
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    const gastosMes = gastos.filter(g => {
        const data = new Date(g.data || g.data_criacao || g.dataCriacao || Date.now());
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });
    const totalGastos = gastosMes.reduce((soma, g) => soma + (parseFloat(g.valor) || 0), 0);
    
    // Gastos do mês anterior para comparação
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    const gastosMesAnterior = gastos.filter(g => {
        const data = new Date(g.data || g.data_criacao || g.dataCriacao || Date.now());
        return data.getMonth() === mesAnterior && data.getFullYear() === anoAnterior;
    });
    const totalGastosAnterior = gastosMesAnterior.reduce((soma, g) => soma + (parseFloat(g.valor) || 0), 0);
    
    // Tendência de gastos
    let tendencia = '—';
    if (totalGastosAnterior > 0) {
        const variacao = ((totalGastos - totalGastosAnterior) / totalGastosAnterior * 100).toFixed(1);
        if (variacao > 0) {
            tendencia = '▲ ' + Math.abs(variacao) + '% vs mês anterior';
        } else if (variacao < 0) {
            tendencia = '▼ ' + Math.abs(variacao) + '% vs mês anterior';
        } else {
            tendencia = '→ Igual ao mês anterior';
        }
    }
    
    // KM total
    const kmTotal = veiculos.reduce((soma, v) => soma + (parseFloat(v.km_atual || v.kmAtual || v.quilometragem) || 0), 0);
    const custoKm = totalGastos > 0 && kmTotal > 0 ? (totalGastos / kmTotal) : 0;
    
    // Atualiza elementos
    definirTexto('stat-total', total);
    definirTexto('stat-operacao', operacao);
    definirTexto('stat-manutencao', manutencao);
    definirTexto('stat-chamados', chamadosAbertos);
    definirTexto('stat-gastos', 'R$ ' + totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
    definirTexto('stat-gastos-tendencia', tendencia);
    definirTexto('stat-km', kmTotal.toLocaleString('pt-BR'));
    definirTexto('stat-custo-km', 'Custo/km: R$ ' + custoKm.toFixed(2));
    
    const percentOperacao = total > 0 ? Math.round((operacao / total) * 100) : 0;
    definirTexto('stat-operacao-percent', percentOperacao + '% da frota');
}

// ============================================================
// ATUALIZAR GRÁFICOS COM DADOS REAIS
// ============================================================
function atualizarGraficosComDadosReais(veiculos, gastos) {
    // Gráfico por Categoria
    const contagemCategorias = {};
    veiculos.forEach(v => {
        const cat = v.categoria || 'Outros';
        contagemCategorias[cat] = (contagemCategorias[cat] || 0) + 1;
    });
    
    const cores = ['#4f46e5', '#06b6d4', '#f59e0b', '#22c55e', '#dc2626', '#8b5cf6', '#ec4899', '#14b8a6'];
    const dadosCategoria = Object.entries(contagemCategorias).map(([nome, valor], i) => ({
        name: nome,
        value: valor,
        itemStyle: { color: cores[i % cores.length] }
    }));
    
    if (chartCategoria && dadosCategoria.length > 0) {
        chartCategoria.setOption({ series: [{ data: dadosCategoria }] });
    }
    
    // Gráfico de Gastos (últimos 6 meses)
    const meses = [];
    const dadosCombustivel = [];
    const dadosManutencao = [];
    const dadosOutros = [];
    
    for (let i = 5; i >= 0; i--) {
        const data = new Date();
        data.setMonth(data.getMonth() - i);
        const mesNome = data.toLocaleDateString('pt-BR', { month: 'short' });
        meses.push(mesNome.charAt(0).toUpperCase() + mesNome.slice(1));
        
        const mes = data.getMonth();
        const ano = data.getFullYear();
        
        const gastosMes = gastos.filter(g => {
            const d = new Date(g.data || g.data_criacao || g.dataCriacao || Date.now());
            return d.getMonth() === mes && d.getFullYear() === ano;
        });
        
        dadosCombustivel.push(gastosMes.filter(g => (g.tipo || '').toLowerCase() === 'combustivel').reduce((s, g) => s + (parseFloat(g.valor) || 0), 0));
        dadosManutencao.push(gastosMes.filter(g => (g.tipo || '').toLowerCase() === 'manutencao').reduce((s, g) => s + (parseFloat(g.valor) || 0), 0));
        dadosOutros.push(gastosMes.filter(g => (g.tipo || '').toLowerCase() !== 'combustivel' && (g.tipo || '').toLowerCase() !== 'manutencao').reduce((s, g) => s + (parseFloat(g.valor) || 0), 0));
    }
    
    if (chartGastos) {
        chartGastos.setOption({
            xAxis: { data: meses },
            series: [
                { data: dadosCombustivel },
                { data: dadosManutencao },
                { data: dadosOutros }
            ]
        });
    }
    
    // Gráfico de Status
    const total = veiculos.length;
    const operacao = veiculos.filter(v => v.status === 'disponivel' || v.status === 'alocado').length;
    const manutencao = veiculos.filter(v => v.status === 'manutencao').length;
    const inativos = veiculos.filter(v => v.status === 'inativo').length;
    
    if (chartStatus) {
        chartStatus.setOption({
            xAxis: { max: Math.max(total, 1) },
            series: [{
                data: [
                    { value: inativos, itemStyle: { color: '#dc2626', borderRadius: [0, 6, 6, 0] } },
                    { value: manutencao, itemStyle: { color: '#f59e0b', borderRadius: [0, 6, 6, 0] } },
                    { value: operacao, itemStyle: { color: '#22c55e', borderRadius: [0, 6, 6, 0] } }
                ]
            }]
        });
    }
}

// ============================================================
// ATUALIZAR CHECKLIST
// ============================================================
function atualizarChecklist(checklists) {
    const hoje = new Date().toISOString().split('T')[0];
    const checklistsHoje = checklists.filter(c => {
        const data = new Date(c.data || c.data_criacao || c.dataCriacao || Date.now());
        return data.toISOString().split('T')[0] === hoje;
    });
    
    const concluidos = checklistsHoje.filter(c => (c.status || '').toLowerCase() === 'concluido' || (c.status || '').toLowerCase() === 'concluído').length;
    const total = checklistsHoje.length;
    const percent = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    
    // Anel de progresso
    const ring = document.getElementById('checklistProgressRing');
    if (ring) {
        const circunferencia = 377;
        const offset = circunferencia - (percent / 100) * circunferencia;
        ring.style.transition = 'stroke-dashoffset 1s ease';
        ring.style.strokeDashoffset = offset;
    }
    
    definirTexto('checklistPercent', percent + '%');
    definirTexto('checklistContagem', concluidos + '/' + total);
    
    // Detalhes
    const container = document.getElementById('checklistDetalhes');
    if (container) {
        const pendentes = total - concluidos;
        const comPendencias = checklistsHoje.filter(c => (c.status || '').toLowerCase() === 'pendencia' || (c.status || '').toLowerCase() === 'pendente').length;
        
        container.innerHTML = `
            <div class="mini-stat">
                <span class="label"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:6px;"></span>Concluídos</span>
                <span class="valor">${concluidos}</span>
            </div>
            <div class="mini-stat">
                <span class="label"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-right:6px;"></span>Pendentes</span>
                <span class="valor">${pendentes}</span>
            </div>
            <div class="mini-stat">
                <span class="label"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#dc2626;margin-right:6px;"></span>Com pendências</span>
                <span class="valor">${comPendencias}</span>
            </div>
        `;
    }
}

// ============================================================
// ATUALIZAR ALERTAS
// ============================================================
function atualizarAlertas(veiculos, manutencoes) {
    const alertas = [];
    
    // Veículos com status manutenção
    veiculos.filter(v => v.status === 'manutencao').forEach(v => {
        alertas.push({
            tipo: 'atencao',
            titulo: `${v.placa || 'Veículo'} — Em manutenção`,
            detalhe: `${v.categoria || 'Categoria'} · ${v.modelo || ''}`
        });
    });
    
    // Manutenções abertas/andamento
    manutencoes.filter(m => {
        const status = (m.status || '').toLowerCase();
        return status === 'aberta' || status === 'andamento' || status === 'pendente';
    }).slice(0, 3).forEach(m => {
        alertas.push({
            tipo: 'critico',
            titulo: `${m.veiculo || m.placa || 'Veículo'} — ${m.tipo || 'Manutenção'}`,
            detalhe: m.descricao || 'Serviço pendente'
        });
    });
    
    // Atualiza contagem
    definirTexto('alertaContagem', alertas.length);
    
    // Renderiza alertas
    const container = document.getElementById('listaAlertasDashboard');
    if (!container) return;
    
    if (alertas.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; font-size:0.875rem; text-align:center; padding:1rem 0;">Nenhum alerta no momento.</p>';
        return;
    }
    
    container.innerHTML = alertas.slice(0, 5).map(a => `
        <div class="alerta-item ${a.tipo}">
            <div class="titulo">${a.titulo}</div>
            <div class="detalhe">${a.detalhe}</div>
        </div>
    `).join('');
}

// ============================================================
// ATUALIZAR ATIVIDADES RECENTES
// ============================================================
function atualizarAtividadesRecentes(veiculos, gastos, chamados, checklists, manutencoes) {
    const atividades = [];
    
    // Adiciona checklists recentes
    checklists.slice(-5).forEach(c => {
        atividades.push({
            data: c.data || c.data_criacao || c.dataCriacao || Date.now(),
            veiculo: c.veiculo || c.placa || '—',
            tipo: 'Check-list',
            descricao: 'Inspeção ' + (c.status || 'realizada'),
            usuario: c.usuario || c.motorista || 'Sistema',
            status: (c.status || '').toLowerCase() === 'concluido' ? 'OK' : 'Pendente'
        });
    });
    
    // Adiciona gastos recentes
    gastos.slice(-5).forEach(g => {
        atividades.push({
            data: g.data || g.data_criacao || g.dataCriacao || Date.now(),
            veiculo: g.veiculo || g.placa || '—',
            tipo: 'Gasto',
            descricao: `${g.tipo || 'Despesa'} — R$ ${parseFloat(g.valor || 0).toLocaleString('pt-BR')}`,
            usuario: g.usuario || 'Sistema',
            status: 'Registrado'
        });
    });
    
    // Adiciona chamados recentes
    chamados.slice(-5).forEach(c => {
        atividades.push({
            data: c.data || c.data_criacao || c.dataCriacao || Date.now(),
            veiculo: c.veiculo || c.placa || '—',
            tipo: 'Chamado',
            descricao: c.titulo || c.descricao || 'Ocorrência',
            usuario: c.usuario || c.requerente || 'Sistema',
            status: c.status || 'Aberto'
        });
    });
    
    // Adiciona manutenções recentes
    manutencoes.slice(-5).forEach(m => {
        atividades.push({
            data: m.data || m.data_criacao || m.dataCriacao || Date.now(),
            veiculo: m.veiculo || m.placa || '—',
            tipo: 'Manutenção',
            descricao: m.tipo || m.descricao || 'Serviço',
            usuario: m.usuario || m.responsavel || 'Sistema',
            status: m.status || 'Solicitada'
        });
    });
    
    // Ordena por data (mais recentes primeiro)
    atividades.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Pega as 8 mais recentes
    const recentes = atividades.slice(0, 8);
    
    // Renderiza tabela
    const tbody = document.getElementById('tabelaAtividadesRecentes');
    if (!tbody) return;
    
    if (recentes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">Nenhuma atividade registrada.</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentes.map(a => {
        const data = new Date(a.data);
        const dataStr = data.toLocaleDateString('pt-BR') + ' · ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        let badgeClass = 'badge-info';
        if (a.status === 'OK' || a.status === 'Concluído' || a.status === 'Registrado') badgeClass = 'badge-success';
        else if (a.status === 'Pendente' || a.status === 'Aberto') badgeClass = 'badge-warning';
        else if (a.status === 'Urgente' || a.status === 'Crítico') badgeClass = 'badge-danger';
        
        return `
            <tr>
                <td style="white-space:nowrap;">${dataStr}</td>
                <td><strong>${a.veiculo}</strong></td>
                <td>${a.tipo}</td>
                <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${a.descricao}</td>
                <td>${a.usuario}</td>
                <td><span class="badge ${badgeClass}">${a.status}</span></td>
            </tr>
        `;
    }).join('');
}

// ============================================================
// 🔧 FERRAMENTAS DE DEBUG E CONTROLE MANUAL
// ============================================================

// Atualiza o dashboard manualmente (pode ser chamada no Console do navegador)
window.atualizarDashboard = function() {
    console.log('🔄 [DASHBOARD] Atualização manual solicitada...');
    carregarDadosDashboardAprimorado();
    return 'Dashboard atualizado!';
};

// Mostra no console todos os dados disponíveis no sistema
window.dashboardDebugDados = function() {
    console.group('🔍 [DASHBOARD] Diagnóstico Completo de Dados');
    
    console.log('\n📦 localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        try {
            const valor = JSON.parse(localStorage.getItem(chave));
            if (Array.isArray(valor)) {
                console.log(`   ${chave}: ${valor.length} itens (array)`);
            } else {
                console.log(`   ${chave}: ${typeof valor}`);
            }
        } catch {
            console.log(`   ${chave}: (não é JSON)`);
        }
    }
    
    console.log('\n🌐 Variáveis globais relacionadas:');
    const palavrasChave = ['veic', 'gast', 'cham', 'check', 'manut', 'aloca', 'local', 'usuar', 'dado', 'lista', 'sistema', 'frota', 'app'];
    const encontradas = [];
    for (const chave in window) {
        if (palavrasChave.some(p => chave.toLowerCase().includes(p))) {
            try {
                const valor = window[chave];
                if (Array.isArray(valor)) {
                    encontradas.push(`   window.${chave}: ${valor.length} itens (array)`);
                }
            } catch {}
        }
    }
    if (encontradas.length > 0) {
        encontradas.forEach(e => console.log(e));
    } else {
        console.log('   Nenhuma variável global de dados encontrada.');
    }
    
    console.groupEnd();
    return 'Diagnóstico concluído. Veja o console acima.';
};

// Injeta dados manualmente (útil para teste)
window.dashboardInjetarDados = function(dados) {
    if (dados.veiculos) localStorage.setItem('frota_veiculos', JSON.stringify(dados.veiculos));
    if (dados.gastos) localStorage.setItem('frota_gastos', JSON.stringify(dados.gastos));
    if (dados.chamados) localStorage.setItem('frota_chamados', JSON.stringify(dados.chamados));
    if (dados.checklists) localStorage.setItem('frota_checklists', JSON.stringify(dados.checklists));
    if (dados.manutencoes) localStorage.setItem('frota_manutencoes', JSON.stringify(dados.manutencoes));
    
    console.log('✅ [DASHBOARD] Dados injetados no localStorage!');
    carregarDadosDashboardAprimorado();
    return 'Dados injetados e dashboard atualizado!';
};

// Limpa todos os dados de teste do dashboard
window.dashboardLimparDados = function() {
    localStorage.removeItem('frota_veiculos');
    localStorage.removeItem('frota_gastos');
    localStorage.removeItem('frota_chamados');
    localStorage.removeItem('frota_checklists');
    localStorage.removeItem('frota_manutencoes');
    
    console.log('🗑️ [DASHBOARD] Dados do localStorage limpos!');
    carregarDadosDashboardAprimorado();
    return 'Dados limpos!';
};

// ============================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Aguarda um pouco para garantir que ECharts e outros scripts carregaram
    setTimeout(function() {
        if (typeof echarts === 'undefined') {
            console.error('❌ [DASHBOARD] ECharts não carregado! Verifique se o script está importado no <head>:');
            console.error('   <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"></script>');
            return;
        }
        inicializarDashboardAprimorado();
        console.log('✅ [DASHBOARD] Sistema pronto!');
        console.log('💡 [DASHBOARD] Comandos úteis no Console:');
        console.log('   window.atualizarDashboard() - Atualiza os dados');
        console.log('   window.dashboardDebugDados() - Mostra diagnóstico completo');
        console.log('   window.dashboardInjetarDados({...}) - Injeta dados de teste');
        console.log('   window.dashboardLimparDados() - Limpa dados do localStorage');
    }, 300);
});

// Também expõe a função globalmente para ser chamada manualmente se necessário
window.inicializarDashboardAprimorado = inicializarDashboardAprimorado;
