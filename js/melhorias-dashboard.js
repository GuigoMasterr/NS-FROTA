// =====================================================
// DASHBOARD APRIMORADO - v3.2
// =====================================================

let graficoCategoria = null;
let graficoGastos = null;
let graficoTopVeiculos = null;
let graficoCategorias = null;
let timerAutoRefresh = null;

// =====================================================
// INICIALIZACAO
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 [DASHBOARD] Inicializando v3.2...');
    inicializarControles();
    carregarDadosERenderizar();
    verificarAlertas();
    console.log('✅ [DASHBOARD] Inicializado com sucesso!');
});

window.atualizarDashboard = function() {
    console.log('🔄 [DASHBOARD] Atualização manual solicitada');
    carregarDadosERenderizar();
    verificarAlertas();
};

window.alterarTipoGrafico = function(tipo) {
    if (!graficoGastos) return;
    try {
        graficoGastos.setOption({
            series: graficoGastos.getOption().series.map(s => ({
                ...s,
                type: tipo,
                smooth: tipo === 'line',
                areaStyle: tipo === 'line' ? { opacity: 0.2 } : null
            }))
        });
        console.log(`📊 [DASHBOARD] Tipo alterado para: ${tipo}`);
    } catch(e) { console.warn('Erro ao alterar tipo:', e); }
};

// =====================================================
// CONTROLES
// =====================================================
function inicializarControles() {
    // Filtro periodo
    const selPeriodo = document.getElementById('filtroPeriodoDashboard');
    if (selPeriodo) {
        selPeriodo.addEventListener('change', (e) => {
            const datas = document.getElementById('datasPersonalizadasDash');
            if (datas) datas.style.display = e.target.value === 'personalizado' ? 'flex' : 'none';
            carregarDadosERenderizar();
        });
    }

    // Datas personalizadas
    ['dataInicioDash', 'dataFimDash'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', carregarDadosERenderizar);
    });

    // Tipo grafico
    const selTipo = document.getElementById('tipoGrafico');
    if (selTipo) {
        selTipo.addEventListener('change', (e) => window.alterarTipoGrafico(e.target.value));
    }

    // Botoes
    const btnAtualizar = document.getElementById('btnAtualizarDash');
    if (btnAtualizar) btnAtualizar.addEventListener('click', window.atualizarDashboard);

    const btnTelaCheia = document.getElementById('btnTelaCheiaDash');
    if (btnTelaCheia) btnTelaCheia.addEventListener('click', () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
    });

    const btnPDF = document.getElementById('btnExportarPDF');
    if (btnPDF) btnPDF.addEventListener('click', () => {
        alert('📄 Para exportar em PDF:\n\n1. Pressione CTRL+P (ou Cmd+P no Mac)\n2. Em "Destino", selecione "Salvar como PDF"\n3. Clique em "Salvar"');
        setTimeout(() => window.print(), 300);
    });

    const btnTema = document.getElementById('btnAlternarTema');
    if (btnTema) btnTema.addEventListener('click', alternarTema);

    // Comparativo
    const chkComp = document.getElementById('chkComparativo');
    if (chkComp) chkComp.addEventListener('change', carregarDadosERenderizar);

    // Auto refresh
    const selAuto = document.getElementById('autoRefresh');
    if (selAuto) {
        const salvo = localStorage.getItem('dash_autorefresh');
        if (salvo) selAuto.value = salvo;
        configurarAutoRefresh(parseInt(selAuto.value) || 0);
        selAuto.addEventListener('change', (e) => {
            localStorage.setItem('dash_autorefresh', e.target.value);
            configurarAutoRefresh(parseInt(e.target.value) || 0);
        });
    }

    // Aplicar tema salvo
    const temaSalvo = localStorage.getItem('dash_tema');
    if (temaSalvo === 'escuro') document.body.classList.add('dark-mode');
}

function alternarTema() {
    const escuro = document.body.classList.toggle('dark-mode');
    localStorage.setItem('dash_tema', escuro ? 'escuro' : 'claro');
}

function configurarAutoRefresh(minutos) {
    if (timerAutoRefresh) clearInterval(timerAutoRefresh);
    timerAutoRefresh = null;
    if (minutos > 0) {
        timerAutoRefresh = setInterval(() => {
            console.log(`⏱️ [DASHBOARD] Auto-refresh (${minutos}min)`);
            window.atualizarDashboard();
        }, minutos * 60 * 1000);
    }
}

// =====================================================
// DADOS
// =====================================================
function carregarDadosERenderizar() {
    const dados = buscarDadosReais();
    atualizarCards(dados);
    renderizarGraficos(dados);
}

function buscarDadosReais() {
    const agora = new Date();
    let veiculos = [];
    let gastos = [];
    let chamados = [];
    let manutencoes = [];

    // Tenta varias chaves do localStorage
    const tentativas = [
        { tipo: 'veiculos', chaves: ['frota_veiculos','veiculos','listaVeiculos','dados_veiculos','cadastro_veiculos'] },
        { tipo: 'gastos', chaves: ['frota_gastos','gastos','listaGastos','despesas'] },
        { tipo: 'chamados', chaves: ['frota_chamados','chamados','listaChamados'] },
        { tipo: 'manutencoes', chaves: ['frota_manutencoes','manutencoes','listaManutencoes'] }
    ];

    tentativas.forEach(t => {
        for (const chave of t.chaves) {
            try {
                const raw = localStorage.getItem(chave);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        if (t.tipo === 'veiculos') veiculos = parsed;
                        if (t.tipo === 'gastos') gastos = parsed;
                        if (t.tipo === 'chamados') chamados = parsed;
                        if (t.tipo === 'manutencoes') manutencoes = parsed;
                        break;
                    }
                }
            } catch(e) {}
        }
    });

    // Tenta variaveis globais
    if (veiculos.length === 0) {
        ['listaVeiculos','dadosVeiculos','veiculos','window.dados?.veiculos'].forEach(n => {
            try {
                const v = eval(`typeof ${n} !== 'undefined' ? ${n} : null`);
                if (Array.isArray(v) && v.length) { veiculos = v; return; }
            } catch(e) {}
        });
    }

    console.log(`📊 [DASHBOARD] Dados: ${veiculos.length} veiculos, ${gastos.length} gastos, ${chamados.length} chamados`);
    return { veiculos, gastos, chamados, manutencoes, agora };
}

// =====================================================
// CARDS
// =====================================================
function atualizarCards(dados) {
    const { veiculos, gastos, chamados } = dados;
    const total = veiculos.length || 0;

    // Total veiculos
    atualizarCard('totalVeiculos', total, 'cadastrados');

    // Em operacao (veiculos com status ativo/operacao)
    let emOperacao = 0;
    let emManutencao = 0;
    veiculos.forEach(v => {
        const s = String(v.status || v.situacao || '').toLowerCase();
        if (['ativo','operacao','em operação','em operacao','disponivel','disponível'].includes(s)) emOperacao++;
        if (['manutencao','manutenção','em manutencao','em manutenção','oficina'].includes(s)) emManutencao++;
    });
    if (total > 0 && emOperacao === 0 && emManutencao === 0) emOperacao = total;
    const percOp = total > 0 ? Math.round((emOperacao / total) * 100) : 0;
    atualizarCard('emOperacao', emOperacao, `${percOp}% da frota`);
    atualizarCard('emManutencao', emManutencao, emManutencao > 0 ? 'precisam de atenção' : 'tudo ok');

    // Chamados abertos
    let abertos = 0;
    chamados.forEach(c => {
        const s = String(c.status || '').toLowerCase();
        if (['aberto','pendente','aberta','em andamento'].includes(s)) abertos++;
    });
    if (chamados.length === 0) abertos = 0;
    atualizarCard('chamadosAbertos', abertos, abertos > 0 ? 'pendentes' : 'sem pendências');

    // Gastos do mes
    const mesAtual = dados.agora.getMonth();
    const anoAtual = dados.agora.getFullYear();
    let gastosMes = 0;
    gastos.forEach(g => {
        try {
            const d = new Date(g.data || g.dataGasto || g.data_vencimento || g.createdAt);
            if (d.getMonth() === mesAtual && d.getFullYear() === anoAtual) {
                gastosMes += parseFloat(g.valor || g.total || g.amount || 0);
            }
        } catch(e) {}
    });

    // Inclui despesas de viagem aprovadas
    try {
        const dv = JSON.parse(localStorage.getItem('frota_despesas_viagem') || '[]');
        dv.forEach(d => {
            if (d.status === 'aprovado') {
                const dt = new Date(d.data);
                if (dt.getMonth() === mesAtual && dt.getFullYear() === anoAtual) {
                    gastosMes += parseFloat(d.valorTotal || 0);
                }
            }
        });
    } catch(e) {}

    // Comparativo mes anterior
    const mesAnt = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoAnt = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    let gastosAnt = 0;
    gastos.forEach(g => {
        try {
            const d = new Date(g.data || g.dataGasto || g.createdAt);
            if (d.getMonth() === mesAnt && d.getFullYear() === anoAnt) {
                gastosAnt += parseFloat(g.valor || g.total || 0);
            }
        } catch(e) {}
    });

    let variacao = '';
    if (gastosAnt > 0) {
        const pct = ((gastosMes - gastosAnt) / gastosAnt * 100);
        const sinal = pct > 0 ? '▲' : pct < 0 ? '▼' : '→';
        const cor = pct > 0 ? 'var(--erro)' : pct < 0 ? 'var(--sucesso)' : 'var(--texto-secundario)';
        variacao = `<span style="color:${cor};font-weight:600;">${sinal} ${Math.abs(pct).toFixed(1)}% vs mês ant.</span>`;
    }

    const elGastos = document.getElementById('gastosMes');
    if (elGastos) {
        elGastos.innerHTML = `R$ ${gastosMes.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}${variacao ? '<br>'+variacao : ''}`;
    }

    // KM rodados
    let kmTotal = 0;
    veiculos.forEach(v => {
        kmTotal += parseFloat(v.kmAtual || v.km || v.quilometragem || 0);
    });
    const kmFormatado = kmTotal >= 1000 ? (kmTotal/1000).toFixed(1)+'K' : kmTotal.toFixed(0);
    const custoKm = kmTotal > 0 ? (gastosMes / kmTotal).toFixed(2) : '0.00';
    atualizarCard('kmRodados', kmFormatado, `Custo/km: R$ ${custoKm}`);
}

function atualizarCard(id, valor, subtitulo) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor;
    const sub = el.parentElement?.querySelector('.stat-sub, small, p:last-child');
    if (sub && subtitulo) sub.textContent = subtitulo;
}

// =====================================================
// GRAFICOS
// =====================================================
function renderizarGraficos(dados) {
    if (typeof echarts === 'undefined') {
        console.warn('⚠️ ECharts nao carregado');
        return;
    }

    const periodo = getPeriodoFiltro();
    const { veiculos, gastos } = dados;

    // Grafico 1: Categoria veiculos
    const el1 = document.getElementById('chart-categoria');
    if (el1) {
        if (graficoCategoria) graficoCategoria.dispose();
        graficoCategoria = echarts.init(el1);
        const categorias = {};
        veiculos.forEach(v => {
            const cat = v.categoria || v.tipo || v.classe || 'Outros';
            categorias[cat] = (categorias[cat] || 0) + 1;
        });
        const data = Object.keys(categorias).length > 0
            ? Object.entries(categorias).map(([name, value]) => ({ name, value }))
            : [{ name: 'Sem dados', value: 1 }];

        graficoCategoria.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
            legend: { bottom: 0, textStyle: { color: getComputedStyle(document.body).getPropertyValue('--texto-secundario').trim() || '#64748b' } },
            series: [{
                type: 'doughnut', radius: ['45%','70%'], center: ['50%','45%'],
                avoidLabelOverlap: true,
                itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
                label: { show: true, formatter: '{b}\n{c}' },
                data,
                color: ['#4f46e5','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899']
            }]
        });
    }

    // Grafico 2: Evolucao gastos 6 meses
    const el2 = document.getElementById('chart-gastos');
    if (el2) {
        if (graficoGastos) graficoGastos.dispose();
        graficoGastos = echarts.init(el2);

        const meses = [];
        const combustivel = [];
        const manutencaoArr = [];
        const outrosArr = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth(), a = d.getFullYear();
            meses.push(d.toLocaleString('pt-BR',{month:'short'}).toUpperCase());
            let c = 0, man = 0, out = 0;
            gastos.forEach(g => {
                try {
                    const gd = new Date(g.data || g.dataGasto || g.createdAt);
                    if (gd.getMonth() === m && gd.getFullYear() === a) {
                        const v = parseFloat(g.valor || g.total || 0);
                        const t = String(g.categoria || g.tipo || g.grupo || 'outros').toLowerCase();
                        if (t.includes('combust') || t.includes('gasolina') || t.includes('diesel')) c += v;
                        else if (t.includes('manut') || t.includes('oficina') || t.includes('peca') || t.includes('peça')) man += v;
                        else out += v;
                    }
                } catch(e) {}
            });
            // Adiciona despesas de viagem
            try {
                const dv = JSON.parse(localStorage.getItem('frota_despesas_viagem') || '[]');
                dv.forEach(desp => {
                    if (desp.status === 'aprovado') {
                        const dd = new Date(desp.data);
                        if (dd.getMonth() === m && dd.getFullYear() === a) {
                            (desp.itens || []).forEach(it => {
                                const vv = parseFloat(it.valor || 0);
                                const tt = String(it.tipo || '').toLowerCase();
                                if (tt === 'combustivel') c += vv;
                                else if (tt === 'manutencao') man += vv;
                                else out += vv;
                            });
                        }
                    }
                });
            } catch(e) {}
            combustivel.push(+c.toFixed(2));
            manutencaoArr.push(+man.toFixed(2));
            outrosArr.push(+out.toFixed(2));
        }

        const usarComparativo = document.getElementById('chkComparativo')?.checked;
        const series = [
            { name: 'Combustível', type: 'bar', stack: 'total', data: combustivel, itemStyle: { color: '#3b82f6', borderRadius: [0,0,0,0] } },
            { name: 'Manutenção', type: 'bar', stack: 'total', data: manutencaoArr, itemStyle: { color: '#f59e0b' } },
            { name: 'Outros', type: 'bar', stack: 'total', data: outrosArr, itemStyle: { color: '#10b981', borderRadius: [4,4,0,0] } }
        ];

        graficoGastos.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { top: 0, textStyle: { color: getComputedStyle(document.body).getPropertyValue('--texto-secundario').trim() || '#64748b' } },
            grid: { left: '3%', right: '4%', bottom: '3%', top: '18%', containLabel: true },
            xAxis: { type: 'category', data: meses, axisLabel: { color: '#94a3b8' } },
            yAxis: { type: 'value', axisLabel: { color: '#94a3b8', formatter: 'R$ {value}' }, splitLine: { lineStyle: { color: '#e2e8f0' } } },
            series
        });
    }

    // Grafico 3: Top 5 veiculos
    const el3 = document.getElementById('chart-top-veiculos');
    if (el3) {
        if (graficoTopVeiculos) graficoTopVeiculos.dispose();
        graficoTopVeiculos = echarts.init(el3);
        const gastosPorV = {};
        gastos.forEach(g => {
            const p = g.veiculo || g.placa || g.veiculoId || 'Indefinido';
            gastosPorV[p] = (gastosPorV[p] || 0) + parseFloat(g.valor || 0);
        });
        const top5 = Object.entries(gastosPorV)
            .sort((a,b) => b[1]-a[1])
            .slice(0,5);
        const temDados = top5.length > 0;

        graficoTopVeiculos.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}<br/>R$ ${p[0].value.toLocaleString('pt-BR',{minimumFractionDigits:2})}` },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', axisLabel: { color: '#94a3b8' } },
            yAxis: { type: 'category', data: temDados ? top5.map(t => t[0]) : ['Sem dados'], axisLabel: { color: '#94a3b8' } },
            series: [{
                type: 'bar',
                data: temDados ? top5.map(t => +t[1].toFixed(2)) : [0],
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#4f46e5'},{offset:1,color:'#8b5cf6'}]),
                    borderRadius: [0,4,4,0]
                },
                barWidth: '55%'
            }]
        });
    }

    // Grafico 4: Gastos por categoria
    const el4 = document.getElementById('chart-categorias-gastos');
    if (el4) {
        if (graficoCategorias) graficoCategorias.dispose();
        graficoCategorias = echarts.init(el4);
        const cats = {};
        gastos.forEach(g => {
            const c = g.categoria || g.tipo || 'Outros';
            cats[c] = (cats[c] || 0) + parseFloat(g.valor || 0);
        });
        const data = Object.keys(cats).length > 0
            ? Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([n,v])=>({name:n,value:+v.toFixed(2)}))
            : [{name:'Sem dados',value:1}];

        graficoCategorias.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: R$ {c} ({d}%)' },
            legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#94a3b8' } },
            series: [{
                type: 'pie', radius: ['40%','65%'], center: ['35%','50%'],
                itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
                data,
                color: ['#4f46e5','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6']
            }]
        });
    }

    // Resize
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 120);
}

window.addEventListener('resize', () => {
    [graficoCategoria, graficoGastos, graficoTopVeiculos, graficoCategorias].forEach(g => g?.resize());
});

function getPeriodoFiltro() {
    const sel = document.getElementById('filtroPeriodoDashboard');
    return sel?.value || 'semestre';
}

// =====================================================
// ALERTAS
// =====================================================
function verificarAlertas() {
    const { veiculos } = buscarDadosReais();
    const alertas = [];
    const hoje = new Date();

    veiculos.forEach(v => {
        const placa = v.placa || v.id || 'Veículo';

        // KM manutencao
        try {
            const kmAtual = parseFloat(v.kmAtual || v.km || 0);
            const kmUlt = parseFloat(v.kmUltimaManutencao || v.ultimaManutencaoKm || 0);
            const kmProx = parseFloat(v.kmProximaManutencao || (kmUlt + 10000));
            if (kmAtual > 0 && kmProx > 0) {
                const faltam = kmProx - kmAtual;
                if (faltam <= 0) alertas.push(`🔴 ${placa}: Manutenção VENCIDA! Rodou ${kmAtual.toLocaleString('pt-BR')}km`);
                else if (faltam < 500) alertas.push(`🟡 ${placa}: Manutenção em ${faltam.toFixed(0)}km`);
            }
        } catch(e) {}

        // Documentos
        ['vencimentoIpva','ipvaVencimento','vencimentoSeguro','seguroVencimento','vencimentoLicenciamento'].forEach(campo => {
            if (v[campo]) {
                try {
                    const d = new Date(v[campo]);
                    if (!isNaN(d.getTime())) {
                        const dias = Math.ceil((d - hoje) / 86400000);
                        const nome = campo.toLowerCase().includes('ipva') ? 'IPVA' : campo.toLowerCase().includes('seguro') ? 'Seguro' : 'Licenciamento';
                        if (dias <= 0) alertas.push(`🔴 ${placa}: ${nome} VENCIDO!`);
                        else if (dias <= 20) alertas.push(`🟠 ${placa}: ${nome} vence em ${dias} dias`);
                    }
                } catch(e) {}
            }
        });
    });

    const container = document.getElementById('painelAlertas');
    if (!container) return;
    if (alertas.length === 0) {
        container.innerHTML = `<div style="padding:20px;text-align:center;color:var(--sucesso);font-weight:600;">✅ Nenhum alerta no momento</div>`;
    } else {
        container.innerHTML = `<h4 style="margin:0 0 10px;font-size:14px;color:var(--erro);">🚨 ${alertas.length} alerta(s)</h4>` +
            alertas.map(a => `<div class="alerta-card">${a}</div>`).join('');
    }
}

// =====================================================
// DEBUG
// =====================================================
window.dashboardDebug = function() {
    console.group('🔍 DASHBOARD DEBUG');
    console.log('LocalStorage keys:', Object.keys(localStorage));
    const d = buscarDadosReais();
    console.log('Dados carregados:', d);
    console.groupEnd();
    return d;
};
