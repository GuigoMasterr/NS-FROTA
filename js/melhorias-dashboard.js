/* ============================================================
   MELHORIAS DASHBOARD - Sistema de Gestão de Frotas
   Integra gráficos ECharts com dados reais do sistema
   ============================================================ */

// Variáveis globais dos gráficos
let chartCategoria, chartGastos, chartStatus;

// Inicializa o dashboard aprimorado
function inicializarDashboardAprimorado() {
    // Atualiza data atual
    atualizarDataDashboard();
    
    // Inicializa gráficos
    inicializarChartCategoria();
    inicializarChartGastos();
    inicializarChartStatus();
    
    // Carrega dados reais
    carregarDadosDashboardAprimorado();
    
    // Redimensiona gráficos ao mudar tamanho da janela
    window.addEventListener('resize', function() {
        if (chartCategoria) chartCategoria.resize();
        if (chartGastos) chartGastos.resize();
        if (chartStatus) chartStatus.resize();
    });
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
    // Tenta buscar dados do sistema existente (localStorage ou variáveis globais)
    const veiculos = buscarDados('veiculos') || [];
    const gastos = buscarDados('gastos') || [];
    const chamados = buscarDados('chamados') || [];
    const checklists = buscarDados('checklists') || [];
    const manutencoes = buscarDados('manutencoes') || [];
    
    // Se não houver dados reais, usa dados de demonstração
    const temDadosReais = veiculos.length > 0;
    
    if (temDadosReais) {
        atualizarStatsComDadosReais(veiculos, gastos, chamados);
        atualizarGraficosComDadosReais(veiculos, gastos);
        atualizarChecklist(checklists);
        atualizarAlertas(veiculos, manutencoes);
        atualizarAtividadesRecentes(veiculos, gastos, chamados, checklists, manutencoes);
    } else {
        // Dados de demonstração
        carregarDadosDemonstracao();
    }
}

// Função auxiliar para buscar dados (compatível com localStorage e variáveis globais)
function buscarDados(tabela) {
    try {
        // Tenta localStorage primeiro
        const dados = localStorage.getItem('frota_' + tabela);
        if (dados) return JSON.parse(dados);
        
        // Tenta variáveis globais do app.js (várias convenções de nome)
        const nomesVariaveis = [
            'lista' + tabela.charAt(0).toUpperCase() + tabela.slice(1),
            'dados' + tabela.charAt(0).toUpperCase() + tabela.slice(1),
            tabela,
            tabela + 'Lista'
        ];
        
        for (const nome of nomesVariaveis) {
            if (window[nome] && Array.isArray(window[nome])) {
                return window[nome];
            }
        }
        
        return [];
    } catch (e) {
        console.warn('Erro ao buscar dados de', tabela, ':', e);
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
// DADOS DE DEMONSTRAÇÃO (quando não há dados reais)
// ============================================================
function carregarDadosDemonstracao() {
    console.log('📊 Carregando dados de demonstração do dashboard...');
    
    // Stats de demonstração
    definirTexto('stat-total', 18);
    definirTexto('stat-operacao', 14);
    definirTexto('stat-operacao-percent', '78% da frota');
    definirTexto('stat-manutencao', 2);
    definirTexto('stat-chamados', 3);
    definirTexto('stat-gastos', 'R$ 45.300');
    definirTexto('stat-gastos-tendencia', '▼ 8,2% vs mês anterior');
    definirTexto('stat-km', '128.400');
    definirTexto('stat-custo-km', 'Custo/km: R$ 0,35');
    
    // Gráfico Categoria
    if (chartCategoria) {
        chartCategoria.setOption({
            series: [{
                data: [
                    { name: 'Caminhão', value: 6, itemStyle: { color: '#4f46e5' } },
                    { name: 'Van', value: 4, itemStyle: { color: '#06b6d4' } },
                    { name: 'Pá Carregadeira', value: 3, itemStyle: { color: '#f59e0b' } },
                    { name: 'Guindaste', value: 2, itemStyle: { color: '#22c55e' } },
                    { name: 'Carro', value: 3, itemStyle: { color: '#8b5cf6' } }
                ]
            }]
        });
    }
    
    // Gráfico Gastos
    if (chartGastos) {
        chartGastos.setOption({
            xAxis: { data: ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'] },
            series: [
                { data: [28000, 32000, 29500, 31000, 27500, 25000] },
                { data: [8500, 7200, 9800, 6500, 11200, 12800] },
                { data: [3200, 4100, 2800, 5200, 3900, 4500] }
            ]
        });
    }
    
    // Gráfico Status
    if (chartStatus) {
        chartStatus.setOption({
            xAxis: { max: 18 },
            series: [{
                data: [
                    { value: 2, itemStyle: { color: '#dc2626', borderRadius: [0, 6, 6, 0] } },
                    { value: 2, itemStyle: { color: '#f59e0b', borderRadius: [0, 6, 6, 0] } },
                    { value: 14, itemStyle: { color: '#22c55e', borderRadius: [0, 6, 6, 0] } }
                ]
            }]
        });
    }
    
    // Checklist de demonstração
    const ring = document.getElementById('checklistProgressRing');
    if (ring) {
        const percent = 67;
        const circunferencia = 377;
        const offset = circunferencia - (percent / 100) * circunferencia;
        ring.style.transition = 'stroke-dashoffset 1s ease';
        ring.style.strokeDashoffset = offset;
    }
    definirTexto('checklistPercent', '67%');
    definirTexto('checklistContagem', '12/18');
    
    const containerCheck = document.getElementById('checklistDetalhes');
    if (containerCheck) {
        containerCheck.innerHTML = `
            <div class="mini-stat">
                <span class="label"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:6px;"></span>Concluídos</span>
                <span class="valor">12</span>
            </div>
            <div class="mini-stat">
                <span class="label"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-right:6px;"></span>Pendentes</span>
                <span class="valor">6</span>
            </div>
            <div class="mini-stat">
                <span class="label"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#dc2626;margin-right:6px;"></span>Com pendências</span>
                <span class="valor">1</span>
            </div>
        `;
    }
    
    // Alertas de demonstração
    definirTexto('alertaContagem', 4);
    const containerAlertas = document.getElementById('listaAlertasDashboard');
    if (containerAlertas) {
        containerAlertas.innerHTML = `
            <div class="alerta-item critico">
                <div class="titulo">ABC-1234 — Pneus em estado crítico</div>
                <div class="detalhe">Caminhão · Sul da obra</div>
            </div>
            <div class="alerta-item atencao">
                <div class="titulo">DEF-5678 — Troca de óleo próxima</div>
                <div class="detalhe">Pá Carregadeira · Restam 180 km</div>
            </div>
            <div class="alerta-item atencao">
                <div class="titulo">GHI-9012 — Licenciamento vencendo</div>
                <div class="detalhe">Guindaste · Vence em 15 dias</div>
            </div>
            <div class="alerta-item info">
                <div class="titulo">Check-list pendente — 3 veículos</div>
                <div class="detalhe">Inspeção matutina não realizada</div>
            </div>
        `;
    }
    
    // Atividades recentes de demonstração
    const tbody = document.getElementById('tabelaAtividadesRecentes');
    if (tbody) {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        
        const formatar = (d, h, m) => {
            const data = new Date(d);
            data.setHours(h, m, 0, 0);
            return data;
        };
        
        tbody.innerHTML = `
            <tr>
                <td style="white-space:nowrap;">Hoje · 08:42</td>
                <td><strong>ABC-1234 · Caminhão</strong></td>
                <td>Check-list</td>
                <td>Inspeção matutina concluída</td>
                <td>João Silva</td>
                <td><span class="badge badge-success">OK</span></td>
            </tr>
            <tr>
                <td style="white-space:nowrap;">Hoje · 08:15</td>
                <td><strong>DEF-5678 · Pá Carregadeira</strong></td>
                <td>Alocação</td>
                <td>Pátio Usina → Obra Principal</td>
                <td>Carlos Mendes</td>
                <td><span class="badge badge-info">Em andamento</span></td>
            </tr>
            <tr>
                <td style="white-space:nowrap;">Hoje · 07:58</td>
                <td><strong>GHI-9012 · Guindaste</strong></td>
                <td>Manutenção</td>
                <td>Solicitação de revisão preventiva</td>
                <td>Márcio Lima</td>
                <td><span class="badge badge-warning">Aguardando</span></td>
            </tr>
            <tr>
                <td style="white-space:nowrap;">Ontem · 17:30</td>
                <td><strong>JKL-3456 · Caminhão Munck</strong></td>
                <td>Chamado</td>
                <td>Falha no sistema hidráulico</td>
                <td>Roberto Alves</td>
                <td><span class="badge badge-danger">Urgente</span></td>
            </tr>
            <tr>
                <td style="white-space:nowrap;">Ontem · 15:20</td>
                <td><strong>MNO-7890 · Van</strong></td>
                <td>Gasto</td>
                <td>Abastecimento — R$ 680,00</td>
                <td>Fernanda Costa</td>
                <td><span class="badge badge-success">Registrado</span></td>
            </tr>
        `;
    }
}

// ============================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Aguarda um pouco para garantir que ECharts e outros scripts carregaram
    setTimeout(function() {
        if (typeof echarts === 'undefined') {
            console.warn('⚠️ ECharts não carregado. Verifique se o script está importado no <head>.');
            return;
        }
        inicializarDashboardAprimorado();
        console.log('✅ Dashboard aprimorado inicializado com sucesso!');
    }, 200);
});

// Também expõe a função globalmente para ser chamada manualmente se necessário
window.inicializarDashboardAprimorado = inicializarDashboardAprimorado;
window.atualizarDashboard = carregarDadosDashboardAprimorado;
