/* ============================================================
   MELHORIAS DASHBOARD v3.1 - Gestão de Frotas
   Todos os aprimoramentos: filtros, tema, auto-refresh,
   novos gráficos, alertas, tela cheia, exportar PDF
   ============================================================ */

let chartCategoria, chartGastos, chartStatus, chartTopVeiculos, chartGastosCategoria;
let autoRefreshInterval = null;
let dashboardDebug = true;

function inicializarDashboardAprimorado() {
    if (dashboardDebug) console.log('🚀 [DASHBOARD] Inicializando v3.1...');
    
    atualizarDataDashboard();
    inicializarChartCategoria();
    inicializarChartGastos();
    inicializarChartStatus();
    inicializarChartTopVeiculos();
    inicializarChartGastosCategoria();
    carregarDadosDashboardAprimorado();
    vincularControlesDashboard();
    inicializarTema();
    inicializarAutoRefresh();
    
    window.addEventListener('resize', function() {
        [chartCategoria, chartGastos, chartStatus, chartTopVeiculos, chartGastosCategoria].forEach(c => { if (c) c.resize(); });
    });
    
    setTimeout(verificarAlertasManutencao, 1500);
    
    if (dashboardDebug) console.log('✅ [DASHBOARD] Inicialização concluída!');
}

function atualizarDataDashboard() {
    const el = document.getElementById('dataAtualDashboard');
    if (!el) return;
    const hoje = new Date();
    el.textContent = hoje.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ========== GRÁFICO 1: CATEGORIA ==========
function inicializarChartCategoria() {
    const el = document.getElementById('chartCategoria');
    if (!el || typeof echarts === 'undefined') return;
    chartCategoria = echarts.init(el);
    chartCategoria.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
        series: [{
            type: 'pie', radius: ['45%', '72%'], center: ['50%', '42%'],
            itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 13, fontWeight: 600 } },
            data: []
        }]
    });
}

// ========== GRÁFICO 2: GASTOS ==========
function inicializarChartGastos() {
    const el = document.getElementById('chartGastos');
    if (!el || typeof echarts === 'undefined') return;
    chartGastos = echarts.init(el);
    chartGastos.setOption({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis', axisPointer: { type: 'shadow' },
            formatter: function(params) {
                let total = 0, html = params[0].axisLabel + '<br/>';
                params.forEach(p => {
                    html += '<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:' + p.color + '"></span> ' + p.seriesName + ': <b>R$ ' + p.value.toLocaleString('pt-BR') + '</b><br/>';
                    total += p.value;
                });
                return html + '<b>Total: R$ ' + total.toLocaleString('pt-BR') + '</b>';
            }
        },
        legend: { show: false },
        grid: { left: '3%', right: '3%', bottom: '3%', top: '8%', containLabel: true },
        xAxis: { type: 'category', data: [], axisLabel: { color: '#64748b', fontSize: 11 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
        yAxis: { type: 'value', axisLabel: { color: '#64748b', fontSize: 11, formatter: v => 'R$ ' + (v/1000) + 'k' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
        series: [
            { name: 'Combustível', type: 'bar', stack: 'total', data: [], itemStyle: { color: '#4f46e5' }, barWidth: 28 },
            { name: 'Manutenção', type: 'bar', stack: 'total', data: [], itemStyle: { color: '#06b6d4' }, barWidth: 28 },
            { name: 'Outros', type: 'bar', stack: 'total', data: [], itemStyle: { borderRadius: [6, 6, 0, 0], color: '#f59e0b' }, barWidth: 28 }
        ]
    });
}

// ========== GRÁFICO 3: STATUS ==========
function inicializarChartStatus() {
    const el = document.getElementById('chartStatus');
    if (!el || typeof echarts === 'undefined') return;
    chartStatus = echarts.init(el);
    chartStatus.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '12%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: { type: 'value', axisLabel: { color: '#64748b', fontSize: 11 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
        yAxis: { type: 'category', data: ['Inativos', 'Manutenção', 'Operação'], axisLabel: { color: '#1e293b', fontSize: 12, fontWeight: 500 }, axisLine: { show: false } },
        series: [{
            type: 'bar', barWidth: 22,
            label: { show: true, position: 'right', color: '#1e293b', fontWeight: 600, formatter: '{c} un.' },
            data: [
                { value: 0, itemStyle: { color: '#dc2626', borderRadius: [0, 6, 6, 0] } },
                { value: 0, itemStyle: { color: '#f59e0b', borderRadius: [0, 6, 6, 0] } },
                { value: 0, itemStyle: { color: '#22c55e', borderRadius: [0, 6, 6, 0] } }
            ]
        }]
    });
}

// ========== GRÁFICO 4: TOP 5 VEÍCULOS ==========
function inicializarChartTopVeiculos() {
    const el = document.getElementById('chartTopVeiculos');
    if (!el || typeof echarts === 'undefined') return;
    chartTopVeiculos = echarts.init(el);
    chartTopVeiculos.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => p[0].name + '<br/><b>R$ ' + p[0].value.toLocaleString('pt-BR') + '</b>' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'value', axisLabel: { color: '#64748b', fontSize: 11, formatter: v => 'R$ ' + (v/1000) + 'k' } },
        yAxis: { type: 'category', data: [], axisLabel: { color: '#1e293b', fontSize: 11 } },
        series: [{
            type: 'bar', barWidth: 18,
            itemStyle: { borderRadius: [0, 4, 4, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#4f46e5' }, { offset: 1, color: '#8b5cf6' }
            ])},
            data: []
        }]
    });
}

// ========== GRÁFICO 5: GASTOS POR CATEGORIA ==========
function inicializarChartGastosCategoria() {
    const el = document.getElementById('chartGastosCategoria');
    if (!el || typeof echarts === 'undefined') return;
    chartGastosCategoria = echarts.init(el);
    chartGastosCategoria.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}: R$ {c} ({d}%)' },
        legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { color: '#64748b', fontSize: 11 } },
        series: [{
            type: 'pie', radius: ['35%', '65%'], center: ['35%', '50%'],
            itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            data: []
        }]
    });
}

// ========== CARREGAR DADOS ==========
function carregarDadosDashboardAprimorado() {
    const veiculos = buscarDados('veiculos') || buscarDados('veiculo') || [];
    const gastos = buscarDados('gastos') || buscarDados('gasto') || buscarDados('despesas') || [];
    const chamados = buscarDados('chamados') || buscarDados('chamado') || [];
    const checklists = buscarDados('checklists') || buscarDados('checklist') || [];
    const manutencoes = buscarDados('manutencoes') || buscarDados('manutencao') || [];
    
    if (veiculos.length === 0 && gastos.length === 0 && chamados.length === 0) {
        mostrarMensagemSemDados();
        return;
    }
    
    atualizarStatsComDadosReais(veiculos, gastos, chamados);
    atualizarGraficosComDadosReais(veiculos, gastos);
    atualizarChecklist(checklists);
    atualizarAlertas(veiculos, manutencoes);
    atualizarAtividadesRecentes(veiculos, gastos, chamados, checklists, manutencoes);
}

function buscarDados(tabela) {
    try {
        const chaves = ['frota_' + tabela, tabela, 'dados_' + tabela, 'lista_' + tabela];
        for (const chave of chaves) {
            const dados = localStorage.getItem(chave);
            if (dados) {
                const parsed = JSON.parse(dados);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        }
        const cap = tabela.charAt(0).toUpperCase() + tabela.slice(1);
        const nomes = ['lista' + cap, 'dados' + cap, tabela, tabela + 'Lista'];
        for (const nome of nomes) {
            if (window[nome] && Array.isArray(window[nome]) && window[nome].length > 0) return window[nome];
        }
        return [];
    } catch (e) { return []; }
}

function definirTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

// ========== ATUALIZAR STATS ==========
function atualizarStatsComDadosReais(veiculos, gastos, chamados) {
    const total = veiculos.length;
    const operacao = veiculos.filter(v => v.status === 'disponivel' || v.status === 'alocado').length;
    const manutencao = veiculos.filter(v => v.status === 'manutencao').length;
    const chamadosAbertos = chamados.filter(c => c.status === 'aberto' || c.status === 'andamento').length;
    
    const hoje = new Date();
    const gastosMes = gastos.filter(g => {
        const d = new Date(g.data || g.data_criacao || Date.now());
        return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
    });
    const totalGastos = gastosMes.reduce((s, g) => s + (parseFloat(g.valor) || 0), 0);
    
    const mesAnt = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
    const anoAnt = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
    const gastosAnt = gastos.filter(g => {
        const d = new Date(g.data || g.data_criacao || Date.now());
        return d.getMonth() === mesAnt && d.getFullYear() === anoAnt;
    }).reduce((s, g) => s + (parseFloat(g.valor) || 0), 0);
    
    let tendencia = '—';
    if (gastosAnt > 0) {
        const varp = ((totalGastos - gastosAnt) / gastosAnt * 100).toFixed(1);
        tendencia = varp > 0 ? '▲ ' + Math.abs(varp) + '%' : varp < 0 ? '▼ ' + Math.abs(varp) + '%' : '→ Estável';
    }
    
    const kmTotal = veiculos.reduce((s, v) => s + (parseFloat(v.km_atual || v.kmAtual || v.quilometragem) || 0), 0);
    const custoKm = totalGastos > 0 && kmTotal > 0 ? (totalGastos / kmTotal) : 0;
    
    definirTexto('stat-total', total);
    definirTexto('stat-operacao', operacao);
    definirTexto('stat-operacao-percent', (total > 0 ? Math.round((operacao / total) * 100) : 0) + '% da frota');
    definirTexto('stat-manutencao', manutencao);
    definirTexto('stat-chamados', chamadosAbertos);
    definirTexto('stat-gastos', 'R$ ' + totalGastos.toLocaleString('pt-BR', { maximumFractionDigits: 0 }));
    definirTexto('stat-gastos-tendencia', tendencia);
    definirTexto('stat-km', kmTotal.toLocaleString('pt-BR'));
    definirTexto('stat-custo-km', 'Custo/km: R$ ' + custoKm.toFixed(2));
}

// ========== ATUALIZAR GRÁFICOS ==========
function atualizarGraficosComDadosReais(veiculos, gastos) {
    // Categoria
    const contCat = {};
    veiculos.forEach(v => { const cat = v.categoria || 'Outros'; contCat[cat] = (contCat[cat] || 0) + 1; });
    const cores = ['#4f46e5', '#06b6d4', '#f59e0b', '#22c55e', '#dc2626', '#8b5cf6', '#ec4899'];
    const dadosCat = Object.entries(contCat).map(([n, v], i) => ({ name: n, value: v, itemStyle: { color: cores[i % cores.length] } }));
    if (chartCategoria && dadosCat.length > 0) chartCategoria.setOption({ series: [{ data: dadosCat }] });
    
    // Gastos últimos 6 meses
    const meses = [], dadosComb = [], dadosManut = [], dadosOut = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        meses.push(d.toLocaleDateString('pt-BR', { month: 'short' }).charAt(0).toUpperCase() + d.toLocaleDateString('pt-BR', { month: 'short' }).slice(1));
        const gm = gastos.filter(g => {
            const gd = new Date(g.data || g.data_criacao || Date.now());
            return gd.getMonth() === d.getMonth() && gd.getFullYear() === d.getFullYear();
        });
        dadosComb.push(gm.filter(g => (g.tipo || '').toLowerCase() === 'combustivel').reduce((s, g) => s + (parseFloat(g.valor) || 0), 0));
        dadosManut.push(gm.filter(g => (g.tipo || '').toLowerCase() === 'manutencao').reduce((s, g) => s + (parseFloat(g.valor) || 0), 0));
        dadosOut.push(gm.filter(g => !['combustivel', 'manutencao'].includes((g.tipo || '').toLowerCase())).reduce((s, g) => s + (parseFloat(g.valor) || 0), 0));
    }
    if (chartGastos) chartGastos.setOption({ xAxis: { data: meses }, series: [{ data: dadosComb }, { data: dadosManut }, { data: dadosOut }] });
    
    // Status
    const total = veiculos.length;
    const op = veiculos.filter(v => v.status === 'disponivel' || v.status === 'alocado').length;
    const man = veiculos.filter(v => v.status === 'manutencao').length;
    const inat = veiculos.filter(v => v.status === 'inativo').length;
    if (chartStatus) chartStatus.setOption({
        xAxis: { max: Math.max(total, 1) },
        series: [{ data: [
            { value: inat, itemStyle: { color: '#dc2626', borderRadius: [0, 6, 6, 0] } },
            { value: man, itemStyle: { color: '#f59e0b', borderRadius: [0, 6, 6, 0] } },
            { value: op, itemStyle: { color: '#22c55e', borderRadius: [0, 6, 6, 0] } }
        ]}]
    });
    
    // Top 5 Veículos
    const gastosPorVeiculo = {};
    gastos.forEach(g => {
        const placa = g.veiculo || g.placa || 'Sem placa';
        gastosPorVeiculo[placa] = (gastosPorVeiculo[placa] || 0) + (parseFloat(g.valor) || 0);
    });
    const top5 = Object.entries(gastosPorVeiculo).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (chartTopVeiculos && top5.length > 0) {
        chartTopVeiculos.setOption({
            yAxis: { data: top5.map(t => t[0]).reverse() },
            series: [{ data: top5.map(t => t[1]).reverse() }]
        });
    }
    
    // Gastos por Categoria
    const gastosPorTipo = {};
    gastos.forEach(g => {
        const tipo = g.tipo || 'Outros';
        gastosPorTipo[tipo] = (gastosPorTipo[tipo] || 0) + (parseFloat(g.valor) || 0);
    });
    const coresTipo = { combustivel: '#4f46e5', manutencao: '#06b6d4', pneus: '#f59e0b', pedagio: '#22c55e', seguro: '#8b5cf6', outro: '#94a3b8' };
    const dadosTipo = Object.entries(gastosPorTipo).map(([n, v]) => ({
        name: n.charAt(0).toUpperCase() + n.slice(1),
        value: v,
        itemStyle: { color: coresTipo[n.toLowerCase()] || '#94a3b8' }
    }));
    if (chartGastosCategoria && dadosTipo.length > 0) {
        chartGastosCategoria.setOption({ series: [{ data: dadosTipo }] });
    }
}

// ========== CHECKLIST ==========
function atualizarChecklist(checklists) {
    const hoje = new Date().toISOString().split('T')[0];
    const clHoje = checklists.filter(c => {
        const d = new Date(c.data || c.data_criacao || Date.now());
        return d.toISOString().split('T')[0] === hoje;
    });
    const concluidos = clHoje.filter(c => (c.status || '').toLowerCase().startsWith('conclu')).length;
    const total = clHoje.length;
    const percent = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    
    const ring = document.getElementById('checklistProgressRing');
    if (ring) {
        ring.style.transition = 'stroke-dashoffset 1s ease';
        ring.style.strokeDashoffset = 377 - (percent / 100) * 377;
    }
    definirTexto('checklistPercent', percent + '%');
    definirTexto('checklistContagem', concluidos + '/' + total);
    
    const cont = document.getElementById('checklistDetalhes');
    if (cont) {
        const pend = total - concluidos;
        const comPend = clHoje.filter(c => (c.status || '').toLowerCase().includes('pendencia') || (c.status || '').toLowerCase() === 'pendente').length;
        cont.innerHTML = `
            <div class="mini-stat"><span class="label"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;margin-right:6px;"></span>Concluídos</span><span class="valor">${concluidos}</span></div>
            <div class="mini-stat"><span class="label"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;margin-right:6px;"></span>Pendentes</span><span class="valor">${pend}</span></div>
            <div class="mini-stat"><span class="label"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#dc2626;margin-right:6px;"></span>Com pendências</span><span class="valor">${comPend}</span></div>
        `;
    }
}

// ========== ALERTAS ==========
function atualizarAlertas(veiculos, manutencoes) {
    const alertas = [];
    veiculos.filter(v => v.status === 'manutencao').forEach(v => {
        alertas.push({ tipo: 'atencao', titulo: `${v.placa || 'Veículo'} — Em manutenção`, detalhe: `${v.categoria || ''} ${v.modelo || ''}` });
    });
    manutencoes.filter(m => ['aberta', 'andamento', 'pendente'].includes((m.status || '').toLowerCase())).slice(0, 3).forEach(m => {
        alertas.push({ tipo: 'critico', titulo: `${m.veiculo || m.placa || 'Veículo'} — ${m.tipo || 'Manutenção'}`, detalhe: m.descricao || 'Pendente' });
    });
    
    definirTexto('alertaContagem', alertas.length);
    const cont = document.getElementById('listaAlertasDashboard');
    if (!cont) return;
    if (alertas.length === 0) {
        cont.innerHTML = '<p style="color:#94a3b8; font-size:0.875rem; text-align:center; padding:1rem 0;">Nenhum alerta.</p>';
        return;
    }
    cont.innerHTML = alertas.slice(0, 5).map(a => `
        <div class="alerta-item ${a.tipo}"><div class="titulo">${a.titulo}</div><div class="detalhe">${a.detalhe}</div></div>
    `).join('');
}

// ========== ATIVIDADES RECENTES ==========
function atualizarAtividadesRecentes(veiculos, gastos, chamados, checklists, manutencoes) {
    const atvs = [];
    checklists.slice(-5).forEach(c => atvs.push({
        data: c.data || c.data_criacao || Date.now(), veiculo: c.veiculo || c.placa || '—',
        tipo: 'Check-list', descricao: 'Inspeção ' + (c.status || ''), usuario: c.usuario || c.motorista || 'Sistema',
        status: (c.status || '').toLowerCase().startsWith('conclu') ? 'OK' : 'Pendente'
    }));
    gastos.slice(-5).forEach(g => atvs.push({
        data: g.data || g.data_criacao || Date.now(), veiculo: g.veiculo || g.placa || '—',
        tipo: 'Gasto', descricao: `${g.tipo || 'Despesa'} — R$ ${parseFloat(g.valor || 0).toLocaleString('pt-BR')}`,
        usuario: g.usuario || 'Sistema', status: 'Registrado'
    }));
    chamados.slice(-5).forEach(c => atvs.push({
        data: c.data || c.data_criacao || Date.now(), veiculo: c.veiculo || c.placa || '—',
        tipo: 'Chamado', descricao: c.titulo || c.descricao || 'Ocorrência',
        usuario: c.usuario || c.requerente || 'Sistema', status: c.status || 'Aberto'
    }));
    
    atvs.sort((a, b) => new Date(b.data) - new Date(a.data));
    const tbody = document.getElementById('tabelaAtividadesRecentes');
    if (!tbody) return;
    if (atvs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#94a3b8; padding:2rem;">Nenhuma atividade.</td></tr>';
        return;
    }
    tbody.innerHTML = atvs.slice(0, 8).map(a => {
        const d = new Date(a.data);
        const ds = d.toLocaleDateString('pt-BR') + ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const bc = a.status === 'OK' || a.status === 'Registrado' ? 'badge-success' :
                     a.status === 'Pendente' || a.status === 'Aberto' ? 'badge-warning' : 'badge-info';
        return `<tr><td style="white-space:nowrap;">${ds}</td><td><strong>${a.veiculo}</strong></td><td>${a.tipo}</td><td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.descricao}</td><td>${a.usuario}</td><td><span class="badge ${bc}">${a.status}</span></td></tr>`;
    }).join('');
}

// ========== MENSAGEM SEM DADOS ==========
function mostrarMensagemSemDados() {
    ['stat-total', 'stat-operacao', 'stat-manutencao', 'stat-chamados'].forEach(id => definirTexto(id, '0'));
    definirTexto('stat-operacao-percent', '0% da frota');
    definirTexto('stat-gastos', 'R$ 0');
    definirTexto('stat-gastos-tendencia', '—');
    definirTexto('stat-km', '0');
    definirTexto('stat-custo-km', 'Custo/km: R$ 0,00');
    
    if (chartCategoria) chartCategoria.setOption({ series: [{ data: [{ name: 'Sem dados', value: 1, itemStyle: { color: '#cbd5e1' } }] }] });
    if (chartGastos) chartGastos.setOption({ xAxis: { data: ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago'] }, series: [{ data: [0,0,0,0,0,0] }, { data: [0,0,0,0,0,0] }, { data: [0,0,0,0,0,0] }] });
    if (chartStatus) chartStatus.setOption({ xAxis: { max: 1 }, series: [{ data: [
        { value: 0, itemStyle: { color: '#dc2626' } },
        { value: 0, itemStyle: { color: '#f59e0b' } },
        { value: 0, itemStyle: { color: '#22c55e' } }
    ]}] });
    
    const ring = document.getElementById('checklistProgressRing');
    if (ring) ring.style.strokeDashoffset = 377;
    definirTexto('checklistPercent', '0%');
    definirTexto('checklistContagem', '0/0');
    definirTexto('alertaContagem', '0');
}

// ========== ALERTAS DE MANUTENÇÃO ==========
function verificarAlertasManutencao() {
    const veiculos = buscarDados('veiculos') || [];
    if (!veiculos.length) return;
    const alertas = [];
    veiculos.forEach(v => {
        const km = parseFloat(v.kmAtual || v.km_atual || v.quilometragem) || 0;
        const kmUlt = parseFloat(v.kmUltimaManutencao) || 0;
        const prox = parseFloat(v.kmProximaManutencao) || (kmUlt + 5000);
        const falt = prox - km;
        if (falt <= 0) alertas.push({ tipo: 'critico', msg: `🚨 ${v.placa || v.id}: Manutenção VENCIDA!` });
        else if (falt < 500) alertas.push({ tipo: 'atencao', msg: `⚠️ ${v.placa || v.id}: Manutenção em ${falt.toFixed(0)} km` });
        
        if (v.vencimentoIpva) {
            const dias = Math.ceil((new Date(v.vencimentoIpva) - new Date()) / 86400000);
            if (dias <= 0) alertas.push({ tipo: 'critico', msg: `🔴 ${v.placa}: IPVA VENCIDO!` });
            else if (dias <= 15) alertas.push({ tipo: 'atencao', msg: `🟠 ${v.placa}: IPVA vence em ${dias} dias` });
        }
        if (v.vencimentoSeguro) {
            const dias = Math.ceil((new Date(v.vencimentoSeguro) - new Date()) / 86400000);
            if (dias <= 0) alertas.push({ tipo: 'critico', msg: `🔴 ${v.placa}: Seguro VENCIDO!` });
            else if (dias <= 15) alertas.push({ tipo: 'atencao', msg: `🟠 ${v.placa}: Seguro vence em ${dias} dias` });
        }
    });
    
    const cont = document.getElementById('listaAlertasSistema');
    if (!cont) return;
    if (alertas.length === 0) {
        cont.innerHTML = '<p style="color:#22c55e; font-size:0.875rem; text-align:center; padding:1rem 0;">✅ Nenhum alerta crítico no momento</p>';
        return;
    }
    cont.innerHTML = alertas.map(a => `<div class="alerta-sistema ${a.tipo}">${a.msg}</div>`).join('');
}

// ========== CONTROLES DO DASHBOARD ==========
function vincularControlesDashboard() {
    document.getElementById('btnAtualizarDashboard')?.addEventListener('click', () => {
        carregarDadosDashboardAprimorado();
        verificarAlertasManutencao();
    });
    
    document.getElementById('btnTelaCheia')?.addEventListener('click', () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    });
    
    document.getElementById('btnExportarPDF')?.addEventListener('click', () => {
        alert('📄 Para exportar em PDF: use Ctrl+P → Salvar como PDF');
        window.print();
    });
    
    document.getElementById('btnAlternarTema')?.addEventListener('click', alternarTema);
    
    document.getElementById('filtroPeriodoDashboard')?.addEventListener('change', e => {
        const dp = document.getElementById('datasPersonalizadas');
        if (dp) dp.style.display = e.target.value === 'personalizado' ? 'flex' : 'none';
        carregarDadosDashboardAprimorado();
    });
    
    document.getElementById('tipoGrafico')?.addEventListener('change', e => {
        if (!chartGastos) return;
        chartGastos.setOption({
            series: chartGastos.getOption().series.map(s => ({
                type: e.target.value,
                smooth: e.target.value === 'line',
                areaStyle: e.target.value === 'line' ? { opacity: 0.2 } : null,
                stack: e.target.value === 'bar' ? 'total' : null
            }))
        });
    });
    
    document.getElementById('autoRefreshMinutos')?.addEventListener('change', e => {
        configurarAutoRefresh(parseInt(e.target.value) || 0);
    });
}

// ========== TEMA ==========
function inicializarTema() {
    if (localStorage.getItem('tema_preferido') === 'escuro') {
        document.body.classList.add('dark-mode');
        document.getElementById('btnAlternarTema').textContent = '☀️';
    }
}

function alternarTema() {
    document.body.classList.toggle('dark-mode');
    const escuro = document.body.classList.contains('dark-mode');
    localStorage.setItem('tema_preferido', escuro ? 'escuro' : 'claro');
    document.getElementById('btnAlternarTema').textContent = escuro ? '☀️' : '🌙';
}

// ========== AUTO REFRESH ==========
function inicializarAutoRefresh() {
    const salvo = localStorage.getItem('auto_refresh_minutos');
    if (salvo) {
        const sel = document.getElementById('autoRefreshMinutos');
        if (sel) sel.value = salvo;
        configurarAutoRefresh(parseInt(salvo));
    }
}

function configurarAutoRefresh(minutos) {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    if (minutos > 0) {
        autoRefreshInterval = setInterval(() => {
            carregarDadosDashboardAprimorado();
            console.log(`🔄 Dashboard atualizado (a cada ${minutos} min)`);
        }, minutos * 60 * 1000);
    }
    localStorage.setItem('auto_refresh_minutos', minutos.toString());
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof echarts === 'undefined') {
            console.error('❌ ECharts não carregado!');
            return;
        }
        inicializarDashboardAprimorado();
    }, 300);
});

window.atualizarDashboard = carregarDadosDashboardAprimorado;
window.inicializarDashboardAprimorado = inicializarDashboardAprimorado;
