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
    // Tenta buscar dados do sistema existente (Supabase ou localStorage)
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

// Função auxiliar para buscar dados (compatível com localStorage e Supabase)
function buscarDados(tabela) {
    try {
        // Tenta localStorage primeiro
        const dados = localStorage.getItem('frota_' + tabela);
        if (dados) return JSON.parse(dados);
        
        // Tenta variáveis globais do app.js
        if (window['dados' + tabela.charAt(0).toUpperCase() + tabela.slice(1)]) {
            return window['dados' + tabela.charAt(0).toUpperCase() + tabela.slice(1)];
        }
        
        return [];
    } catch (e) {
        return [];
    }
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
        const data = new Date(g.data);
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
    });
    const totalGastos = gastosMes.reduce((soma, g) => soma + (parseFloat(g.valor) || 0), 0);
    
    // KM total
    const kmTotal = veiculos.reduce((soma, v) => soma + (parseFloat(v.km_atual) || 0), 0);
    const custoKm = totalGastos > 0 && kmTotal > 0 ? (totalGastos / kmTotal) : 0;
    
    // Atualiza elementos
    definirTexto('stat-total', total);
    definirTexto('stat-operacao', operacao);
    definirTexto('stat-manutencao', manutencao);
    definirTexto('stat-chamados', chamadosAbertos);
    definirTexto('stat-gastos', 'R$ ' + totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }));
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
            const d = new Date(g.data);
            return d.getMonth() === mes && d.getFullYear() === ano;
        });
        
        dadosCombustivel.push(gastosMes.filter(g => g.tipo === 'combustivel').reduce((s, g) => s + (parseFloat(g.valor) || 0), 0));
        dadosManutencao.push(gastosMes.filter(g => g.tipo === 'manutencao').reduce((s, g) => s + (parseFloat(g.valor) || 0), 0));
        dadosOutros.push(gastosMes.filter(g => g.tipo !== 'combustivel' && g.tipo !== 'manutencao').reduce((s, g) => s + (parseFloat(g.valor) || 0), 0));
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
    const checklistsHoje = checklists.filter(c => c.data === hoje);
    
    const concluidos = checklistsHoje.filter(c => c.status === 'concluido').length;
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
        const comPendencias = checklistsHoje.filter(c => c.status === 'pendencia').length;
        
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
            titulo: `${v.placa} — Em manutenção`,
            detalhe: `${v.categoria || ''} ${v.modelo || ''}`
        });
    });
    
    // Manutenções preventivas próximas (baseado em KM)
    veiculos.forEach(v => {
        const km = parseFloat(v.km_atual) || 0;
        if (km > 0 && km % 10000 > 9500) {
            alertas.push({
                tipo: 'info',
                titulo: `${v.placa} — Revisão próxima`,
                detalhe: `KM atual: ${km.toLocaleString('pt-BR')}`
            });
        }
    });
    
    // Chamados abertos críticos
    const chamados = buscarDados('chamados') || [];
    chamados.filter(c => c.status === 'aberto').forEach(c => {
        alertas.push({
            tipo: 'critico',
            titulo: `${c.veiculo || 'Veículo'} — ${c.titulo || 'Chamado aberto'}`,
            detalhe: c.descricao || 'Sem descrição'
        });
    });
    
    // Limita a 5 alertas
    const alertasExibidos = alertas.slice(0, 5);
    
    // Atualiza contador
    const contador = document.getElementById('alertaContagem');
    if (contador) contador.textContent = alertas.length;
    
    // Atualiza lista
    const lista = document.getElementById('listaAlertasDashboard');
    if (lista) {
        if (alertasExibidos.length === 0) {
            lista.innerHTML = '<p style="color:#94a3b8; font-size:0.875rem; text-align:center; padding:1rem 0;">Nenhum alerta no momento.</p>';
        } else {
            lista.innerHTML = alertasExibidos.map(a => `
                <div class="alerta-item ${a.tipo}">
                    <div class="titulo">${a.titulo}</div>
                    <div class="detalhe">${a.detalhe}</div>
                </div>
            `).join('');
        }
    }
}

// ============================================================
// ATUALIZAR ATIVIDADES RECENTES
// ============================================================
function atualizarAtividadesRecentes(veiculos, gastos, chamados, checklists, manutencoes) {
    const atividades = [];
    
    // Combina todas as atividades
    checklists.forEach(c => atividades.push({
        data: c.data,
        veiculo: c.veiculo || '—',
        tipo: 'Check-list',
        tipoCor: '#4f46e5',
        descricao: c.status === 'concluido' ? 'Inspeção concluída' : 'Inspeção pendente',
        usuario: c.motorista || '—',
        status: c.status === 'concluido' ? 'OK' : 'Pendente',
        statusCor: c.status === 'concluido' ? '#22c55e' : '#f59e0b'
    }));
    
    gastos.forEach(g => atividades.push({
        data: g.data,
        veiculo: g.veiculo || '—',
        tipo: 'Gasto',
        tipoCor: '#06b6d4',
        descricao: `${g.tipo || 'Outro'} — R$ ${parseFloat(g.valor || 0).toLocaleString('pt-BR')}`,
        usuario: '—',
        status: 'Registrado',
        statusCor: '#22c55e'
    }));
    
    chamados.forEach(c => atividades.push({
        data: c.data,
        veiculo: c.veiculo || '—',
        tipo: 'Chamado',
        tipoCor: '#dc2626',
        descricao: c.titulo || 'Sem título',
        usuario: '—',
        status: c.status || 'Aberto',
        statusCor: c.status === 'resolvido' ? '#22c55e' : '#dc2626'
    }));
    
    manutencoes.forEach(m => atividades.push({
        data: m.data,
        veiculo: m.veiculo || '—',
        tipo: 'Manutenção',
        tipoCor: '#f59e0b',
        descricao: m.descricao || m.tipo || 'Serviço',
        usuario: '—',
        status: m.status || 'Aberta',
        statusCor: m.status === 'concluida' ? '#22c55e' : '#f59e0b'
    }));
    
    // Ordena por data (mais recentes primeiro)
    atividades.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Pega as 5 mais recentes
    const recentes = atividades.slice(0, 5);
    
    const tbody = document.getElementById('tabelaAtividadesRecentes');
    if (tbody) {
        if (recentes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">Nenhuma atividade registrada.</td></tr>';
        } else {
            tbody.innerHTML = recentes.map(a => `
                <tr>
                    <td style="color:#64748b; font-size:0.8125rem;">${formatarData(a.data)}</td>
                    <td style="font-weight:600;">${a.veiculo}</td>
                    <td><span class="badge" style="background:${hexParaRgba(a.tipoCor, 0.1)};color:${a.tipoCor};">${a.tipo}</span></td>
                    <td style="color:#64748b;">${a.descricao}</td>
                    <td style="color:#64748b;">${a.usuario}</td>
                    <td><span class="badge" style="background:${hexParaRgba(a.statusCor, 0.1)};color:${a.statusCor};">${a.status}</span></td>
                </tr>
            `).join('');
        }
    }
}

// ============================================================
// DADOS DE DEMONSTRAÇÃO (quando não há dados reais)
// ============================================================
function carregarDadosDemonstracao() {
    // Stats
    definirTexto('stat-total', '24');
    definirTexto('stat-operacao', '18');
    definirTexto('stat-manutencao', '4');
    definirTexto('stat-chamados', '5');
    definirTexto('stat-gastos', 'R$ 45,3K');
    definirTexto('stat-km', '128,4K');
    definirTexto('stat-custo-km', 'Custo/km: R$ 0,35');
    definirTexto('stat-operacao-percent', '75% da frota');
    definirTexto('stat-gastos-tendencia', '▼ 8,2% vs mês anterior');
    
    // Gráfico Categoria
    if (chartCategoria) {
        chartCategoria.setOption({
            series: [{
                data: [
                    { name: 'Caminhão', value: 7, itemStyle: { color: '#4f46e5' } },
                    { name: 'Caminhão Munck', value: 4, itemStyle: { color: '#06b6d4' } },
                    { name: 'Pá Carregadeira', value: 3, itemStyle: { color: '#f59e0b' } },
                    { name: 'Carro', value: 3, itemStyle: { color: '#22c55e' } },
                    { name: 'Guindaste', value: 2, itemStyle: { color: '#dc2626' } },
                    { name: 'Van', value: 2, itemStyle: { color: '#8b5cf6' } },
                    { name: 'Betoneira', value: 2, itemStyle: { color: '#ec4899' } },
                    { name: 'Carreta', value: 1, itemStyle: { color: '#14b8a6' } }
                ]
            }]
        });
    }
    
    // Gráfico Gastos
    if (chartGastos) {
        chartGastos.setOption({
            xAxis: { data: ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'] },
            series: [
                { data: [22000, 24500, 21800, 26300, 23100, 25400] },
                { data: [8500, 12200, 9800, 7400, 11500, 13200] },
                { data: [4200, 3800, 5100, 4600, 6200, 6700] }
            ]
        });
    }
    
    // Gráfico Status
    if (chartStatus) {
        chartStatus.setOption({
            xAxis: { max: 24 },
            series: [{
                data: [
                    { value: 2, itemStyle: { color: '#dc2626', borderRadius: [0, 6, 6, 0] } },
                    { value: 4, itemStyle: { color: '#f59e0b', borderRadius: [0, 6, 6, 0] } },
                    { value: 18, itemStyle: { color: '#22c55e', borderRadius: [0, 6, 6, 0] } }
                ]
            }]
        });
    }
    
    // Checklist
    const ring = document.getElementById('checklistProgressRing');
    if (ring) {
        ring.style.transition = 'stroke-dashoffset 1s ease';
        ring.style.strokeDashoffset = 377 - (67 / 100) * 377;
    }
    definirTexto('checklistPercent', '67%');
    definirTexto('checklistContagem', '12/18');
    
    const container = document.getElementById('checklistDetalhes');
    if (container) {
        container.innerHTML = `
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
    const contador = document.getElementById('alertaContagem');
    if (contador) contador.textContent = '4';
    
    const lista = document.getElementById('listaAlertasDashboard');
    if (lista) {
        lista.innerHTML = `
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
    
    // Atividades de demonstração
    const tbody = document.getElementById('tabelaAtividadesRecentes');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td style="color:#64748b; font-size:0.8125rem;">Hoje · 08:42</td>
                <td style="font-weight:600;">ABC-1234 · Caminhão</td>
                <td><span class="badge" style="background:rgba(79,70,229,0.1);color:#4f46e5;">Check-list</span></td>
                <td style="color:#64748b;">Inspeção matutina concluída</td>
                <td style="color:#64748b;">João Silva</td>
                <td><span class="badge" style="background:rgba(34,197,94,0.1);color:#22c55e;">OK</span></td>
            </tr>
            <tr>
                <td style="color:#64748b; font-size:0.8125rem;">Hoje · 08:15</td>
                <td style="font-weight:600;">DEF-5678 · Pá Carregadeira</td>
                <td><span class="badge" style="background:rgba(6,182,212,0.1);color:#06b6d4;">Alocação</span></td>
                <td style="color:#64748b;">Pátio Usina → Obra Principal</td>
                <td style="color:#64748b;">Carlos Mendes</td>
                <td><span class="badge" style="background:rgba(34,197,94,0.1);color:#22c55e;">Em andamento</span></td>
            </tr>
            <tr>
                <td style="color:#64748b; font-size:0.8125rem;">Hoje · 07:58</td>
                <td style="font-weight:600;">GHI-9012 · Guindaste</td>
                <td><span class="badge" style="background:rgba(245,158,11,0.1);color:#f59e0b;">Manutenção</span></td>
                <td style="color:#64748b;">Solicitação de revisão preventiva</td>
                <td style="color:#64748b;">Márcio Lima</td>
                <td><span class="badge" style="background:rgba(245,158,11,0.1);color:#f59e0b;">Aguardando</span></td>
            </tr>
            <tr>
                <td style="color:#64748b; font-size:0.8125rem;">Ontem · 17:30</td>
                <td style="font-weight:600;">JKL-3456 · Caminhão Munck</td>
                <td><span class="badge" style="background:rgba(220,38,38,0.1);color:#dc2626;">Chamado</span></td>
                <td style="color:#64748b;">Falha no sistema hidráulico</td>
                <td style="color:#64748b;">Roberto Alves</td>
                <td><span class="badge" style="background:rgba(220,38,38,0.1);color:#dc2626;">Urgente</span></td>
            </tr>
            <tr>
                <td style="color:#64748b; font-size:0.8125rem;">Ontem · 15:20</td>
                <td style="font-weight:600;">MNO-7890 · Van</td>
                <td><span class="badge" style="background:rgba(34,197,94,0.1);color:#22c55e;">Gasto</span></td>
                <td style="color:#64748b;">Abastecimento — R$ 680,00</td>
                <td style="color:#64748b;">Fernanda Costa</td>
                <td><span class="badge" style="background:rgba(34,197,94,0.1);color:#22c55e;">Registrado</span></td>
            </tr>
        `;
    }
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================
function definirTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

function formatarData(dataStr) {
    if (!dataStr) return '—';
    try {
        const data = new Date(dataStr);
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        
        if (data.toDateString() === hoje.toDateString()) {
            return 'Hoje';
        } else if (data.toDateString() === ontem.toDateString()) {
            return 'Ontem';
        } else {
            return data.toLocaleDateString('pt-BR');
        }
    } catch (e) {
        return dataStr;
    }
}

function hexParaRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================
// INICIALIZAÇÃO AUTOMÁTICA
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Aguarda um pouco para garantir que o app.js carregou primeiro
    setTimeout(function() {
        // Verifica se estamos na página do dashboard
        const dashboard = document.getElementById('pag-dashboard');
        if (dashboard && dashboard.classList.contains('ativa')) {
            inicializarDashboardAprimorado();
        }
    }, 100);
});

// Também inicializa quando navegar para o dashboard
const navegarParaOriginal = window.navegarPara;
if (navegarParaOriginal) {
    window.navegarPara = function(pagina) {
        navegarParaOriginal(pagina);
        if (pagina === 'dashboard') {
            setTimeout(inicializarDashboardAprimorado, 100);
        }
    };
}
