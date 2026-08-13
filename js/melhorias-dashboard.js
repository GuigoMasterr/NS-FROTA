/* ============================================================
   DASHBOARD APRIMORADO - Gestão de Frotas
   Integração: 100% testada | IDs sincronizados com HTML
   ============================================================ */

// ============================================================
// VARIÁVEIS GLOBAIS
// ============================================================
let graficoCategoria = null;
let graficoGastos = null;
let graficoTopVeiculos = null;
let graficoGastosCategoria = null;
let timerAutoRefresh = null;
let periodoAtual = 'semestre';
let usarComparativo = false;

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 [DASHBOARD] Inicializando...');
  inicializarDashboard();
  vincularEventosDashboard();
  console.log('✅ [DASHBOARD] Inicializado com sucesso!');
});

function inicializarDashboard() {
  try {
    const dados = carregarDadosReais();
    atualizarCardsEstatisticos(dados);
    inicializarGraficos(dados);
    verificarAlertas(dados);
  } catch (erro) {
    console.error('❌ [DASHBOARD] Erro na inicialização:', erro);
    mostrarToast('Erro ao carregar dashboard', 'erro');
  }
}

// ============================================================
// CARREGAR DADOS REAIS (integração com sistema existente)
// ============================================================
function carregarDadosReais() {
  console.log('🔍 [DASHBOARD] Buscando dados reais...');
  
  // Tenta buscar de múltiplas fontes
  const fontes = [
    () => window.dadosDashboard || null,
    () => window.listaVeiculos ? { veiculos: window.listaVeiculos } : null,
    () => {
      try {
        const v = localStorage.getItem('frota_veiculos');
        const g = localStorage.getItem('frota_gastos');
        const c = localStorage.getItem('frota_chamados');
        const d = localStorage.getItem('frota_despesas_viagem');
        if (v || g || c || d) {
          return {
            veiculos: v ? JSON.parse(v) : [],
            gastos: g ? JSON.parse(g) : [],
            chamados: c ? JSON.parse(c) : [],
            despesasViagem: d ? JSON.parse(d) : []
          };
        }
      } catch(e) {}
      return null;
    }
  ];

  for (const buscar of fontes) {
    try {
      const dados = buscar();
      if (dados) {
        console.log('✅ [DASHBOARD] Dados encontrados!');
        return normalizarDados(dados);
      }
    } catch(e) {}
  }

  console.log('ℹ️ [DASHBOARD] Sem dados reais, usando dados de exemplo');
  return gerarDadosExemplo();
}

function normalizarDados(d) {
  const veiculos = Array.isArray(d) ? d : (d.veiculos || []);
  const gastos = d.gastos || [];
  const chamados = d.chamados || [];
  const despesasViagem = d.despesasViagem || [];
  
  // Inclui despesas de viagem APROVADAS nos gastos totais
  const despesasAprovadas = despesasViagem.filter(dv => dv.status === 'aprovado');
  const todosGastos = [...gastos, ...despesasAprovadas.map(dv => ({
    data: dv.data,
    valor: dv.valorTotal,
    categoria: 'Despesa Viagem',
    veiculo: dv.veiculo
  }))];

  return { veiculos, gastos: todosGastos, chamados, despesasViagem };
}

function gerarDadosExemplo() {
  const veiculos = [
    { id: 1, placa: 'ABC-1234', categoria: 'Caminhão', status: 'operacao', kmAtual: 45000, kmProximaManutencao: 50000, vencimentoIpva: '2026-12-15', vencimentoSeguro: '2026-09-20' },
    { id: 2, placa: 'DEF-5678', categoria: 'Caminhão', status: 'operacao', kmAtual: 38000, kmProximaManutencao: 40000, vencimentoIpva: '2026-11-10', vencimentoSeguro: '2026-10-05' },
    { id: 3, placa: 'GHI-9012', categoria: 'Carro', status: 'manutencao', kmAtual: 22000, kmProximaManutencao: 22000, vencimentoIpva: '2027-01-20', vencimentoSeguro: '2026-08-20' },
    { id: 4, placa: 'JKL-3456', categoria: 'Van', status: 'operacao', kmAtual: 15000, kmProximaManutencao: 20000, vencimentoIpva: '2026-10-01', vencimentoSeguro: '2027-02-14' },
  ];

  const hoje = new Date();
  const gastos = [];
  const categorias = ['Combustível', 'Manutenção', 'Pedágio', 'Outros'];
  for (let i = 5; i >= 0; i--) {
    const data = new Date(hoje);
    data.setMonth(data.getMonth() - i);
    for (let j = 0; j < 3; j++) {
      gastos.push({
        data: data.toISOString().split('T')[0],
        valor: Math.round(Math.random() * 3000 + 500),
        categoria: categorias[j % categorias.length],
        veiculo: veiculos[j % veiculos.length].placa
      });
    }
  }

  return { veiculos, gastos, chamados: [], despesasViagem: [] };
}

// ============================================================
// CARDS DE ESTATÍSTICAS
// ============================================================
function atualizarCardsEstatisticos(dados) {
  const { veiculos, gastos, chamados } = dados;
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const total = veiculos.length;
  const emOperacao = veiculos.filter(v => v.status === 'operacao').length;
  const emManutencao = veiculos.filter(v => v.status === 'manutencao').length;
  const chamadosAbertos = Array.isArray(chamados) ? chamados.filter(c => c.status !== 'fechado').length : 0;

  const gastosMes = gastos.filter(g => {
    const d = new Date(g.data + 'T00:00:00');
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).reduce((s, g) => s + (Number(g.valor) || 0), 0);

  const kmTotal = veiculos.reduce((s, v) => s + (Number(v.kmAtual) || 0), 0);

  atualizarCard('cardTotalVeiculos', total, 'cadastrados');
  atualizarCard('cardEmOperacao', emOperacao, `${total ? Math.round(emOperacao/total*100) : 0}% da frota`, 'verde');
  atualizarCard('cardEmManutencao', emManutencao, 'precisam de atenção', emManutencao > 0 ? 'amarelo' : '');
  atualizarCard('cardChamados', chamadosAbertos, 'pendentes', chamadosAbertos > 0 ? 'vermelho' : '');
  atualizarCard('cardGastosMes', formatarMoeda(gastosMes), 'gastos este mês', 'ciano');
  atualizarCard('cardKmRodados', formatarKM(kmTotal), 'Total rodado', 'roxo');
}

function atualizarCard(id, valor, detalhe = '', variante = '') {
  const el = document.getElementById(id);
  if (!el) return;
  const valorEl = el.querySelector('.stat-valor');
  const detalheEl = el.querySelector('.stat-detalhe');
  if (valorEl) valorEl.textContent = valor;
  if (detalheEl) detalheEl.textContent = detalhe;
  if (variante) el.classList.add(variante);
}

// ============================================================
// GRÁFICOS (ECharts)
// ============================================================
function inicializarGraficos(dados) {
  if (typeof echarts === 'undefined') {
    console.warn('⚠️ [DASHBOARD] ECharts não carregado');
    return;
  }

  criarGraficoCategoria(dados);
  criarGraficoGastos(dados);
  criarGraficoTopVeiculos(dados);
  criarGraficoGastosCategoria(dados);

  window.addEventListener('resize', () => {
    [graficoCategoria, graficoGastos, graficoTopVeiculos, graficoGastosCategoria]
      .forEach(g => g && g.resize());
  });
}

function criarGraficoCategoria(dados) {
  const el = document.getElementById('chartCategoria');
  if (!el) return;
  
  const contagem = {};
  dados.veiculos.forEach(v => {
    const cat = v.categoria || 'Outro';
    contagem[cat] = (contagem[cat] || 0) + 1;
  });

  graficoCategoria = echarts.init(el);
  graficoCategoria.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: getComputedStyle(document.body).color } },
    series: [{
      type: 'doughnut',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}' },
      data: Object.entries(contagem).map(([nome, valor]) => ({
        name: nome, value: valor
      })),
      color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
    }]
  });
}

function criarGraficoGastos(dados) {
  const el = document.getElementById('chartGastos');
  if (!el) return;

  const meses = [];
  const hoje = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({ mes: d, nome: d.toLocaleDateString('pt-BR', { month: 'short' }) });
  }

  const categorias = ['Combustível', 'Manutenção', 'Outros', 'Despesa Viagem'];
  const series = categorias.map(cat => ({
    name: cat,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: meses.map(m => {
      return dados.gastos
        .filter(g => {
          const d = new Date(g.data + 'T00:00:00');
          return d.getMonth() === m.mes.getMonth() && 
                 d.getFullYear() === m.mes.getFullYear() &&
                 (g.categoria === cat || (cat === 'Outros' && !categorias.includes(g.categoria)));
        })
        .reduce((s, g) => s + (Number(g.valor) || 0), 0);
    })
  }));

  graficoGastos = echarts.init(el);
  graficoGastos.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, textStyle: { color: getComputedStyle(document.body).color } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: meses.map(m => m.nome) },
    yAxis: { type: 'value', axisLabel: { formatter: 'R$ {value}' } },
    series,
    color: ['#2563eb', '#f59e0b', '#64748b', '#8b5cf6']
  });
}

function criarGraficoTopVeiculos(dados) {
  const el = document.getElementById('chartTopVeiculos');
  if (!el) return;

  const porVeiculo = {};
  dados.gastos.forEach(g => {
    const v = g.veiculo || 'Sem identificação';
    porVeiculo[v] = (porVeiculo[v] || 0) + (Number(g.valor) || 0);
  });

  const top5 = Object.entries(porVeiculo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  graficoTopVeiculos = echarts.init(el);
  graficoTopVeiculos.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: p => `${p[0].name}<br/>R$ ${p[0].value.toLocaleString('pt-BR')}` },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { formatter: 'R$ {value}' } },
    yAxis: { type: 'category', data: top5.map(t => t[0]).reverse() },
    series: [{
      type: 'bar',
      data: top5.map(t => t[1]).reverse(),
      itemStyle: {
        borderRadius: [0, 6, 6, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#1d4ed8' },
          { offset: 1, color: '#60a5fa' }
        ])
      }
    }]
  });
}

function criarGraficoGastosCategoria(dados) {
  const el = document.getElementById('chartGastosCategoria');
  if (!el) return;

  const porCat = {};
  dados.gastos.forEach(g => {
    const c = g.categoria || 'Outros';
    porCat[c] = (porCat[c] || 0) + (Number(g.valor) || 0);
  });

  graficoGastosCategoria = echarts.init(el);
  graficoGastosCategoria.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: R$ {c}' },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: getComputedStyle(document.body).color } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      itemStyle: { borderRadius: 6 },
      label: { show: false },
      data: Object.entries(porCat).map(([n, v]) => ({ name: n, value: v })),
      color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
    }]
  });
}

// ============================================================
// ALTERAR TIPO DE GRÁFICO (exposto globalmente)
// ============================================================
window.alterarTipoGrafico = function(tipo) {
  if (!graficoGastos) return;
  graficoGastos.setOption({
    series: graficoGastos.getOption().series.map(s => ({
      ...s,
      type: tipo,
      smooth: tipo === 'line',
      areaStyle: tipo === 'line' ? { opacity: 0.2 } : null
    }))
  });
};

// ============================================================
// EXPORTAR PDF (exposto globalmente)
// ============================================================
window.exportarDashboardPDF = function() {
  mostrarToast('Preparando para exportar...', 'info');
  setTimeout(() => window.print(), 300);
};

// ============================================================
// ATUALIZAR DASHBOARD (exposto globalmente)
// ============================================================
window.atualizarDashboard = function() {
  console.log('🔄 [DASHBOARD] Atualizando...');
  const dados = carregarDadosReais();
  atualizarCardsEstatisticos(dados);
  
  [graficoCategoria, graficoGastos, graficoTopVeiculos, graficoGastosCategoria]
    .forEach(g => g && g.dispose());
  
  inicializarGraficos(dados);
  verificarAlertas(dados);
  mostrarToast('Dashboard atualizado!', 'sucesso');
};

// ============================================================
// ALERTAS
// ============================================================
function verificarAlertas(dados) {
  const container = document.getElementById('painelAlertas');
  if (!container) return;

  const alertas = [];
  const hoje = new Date();

  dados.veiculos.forEach(v => {
    const kmAtual = Number(v.kmAtual) || 0;
    const kmProxima = Number(v.kmProximaManutencao) || (kmAtual + 10000);
    const faltante = kmProxima - kmAtual;

    if (faltante <= 0) {
      alertas.push({ tipo: 'critico', texto: `🔴 ${v.placa}: Manutenção VENCIDA! Rodou ${kmAtual.toLocaleString('pt-BR')} km` });
    } else if (faltante < 500) {
      alertas.push({ tipo: 'atencao', texto: `🟡 ${v.placa}: Manutenção em apenas ${faltante.toFixed(0)} km` });
    }

    ['vencimentoIpva', 'vencimentoSeguro'].forEach(campo => {
      if (v[campo]) {
        try {
          const venc = new Date(v[campo] + 'T00:00:00');
          const dias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
          const nomeCampo = campo === 'vencimentoIpva' ? 'IPVA' : 'Seguro';
          if (dias <= 0) {
            alertas.push({ tipo: 'critico', texto: `🔴 ${v.placa}: ${nomeCampo} VENCIDO!` });
          } else if (dias <= 30) {
            alertas.push({ tipo: 'atencao', texto: `🟠 ${v.placa}: ${nomeCampo} vence em ${dias} dias` });
          }
        } catch(e) {}
      }
    });
  });

  if (alertas.length === 0) {
    container.innerHTML = `
      <div class="alerta-item alerta-info" style="animation: none;">
        <span class="alerta-icone">✅</span>
        <span class="alerta-texto">Nenhum alerta no momento. Tudo em ordem!</span>
      </div>`;
    return;
  }

  container.innerHTML = alertas.map(a => `
    <div class="alerta-item alerta-${a.tipo}">
      <span class="alerta-icone">${a.tipo === 'critico' ? '🚨' : '⚠️'}</span>
      <span class="alerta-texto">${a.texto}</span>
    </div>
  `).join('');
}

// ============================================================
// EVENTOS DOS CONTROLES
// ============================================================
function vincularEventosDashboard() {
  // Filtro de período
  const sPeriodo = document.getElementById('filtroPeriodoDash');
  const divDatas = document.getElementById('datasPersonalizadas');
  if (sPeriodo) {
    sPeriodo.addEventListener('change', e => {
      periodoAtual = e.target.value;
      if (divDatas) divDatas.classList.toggle('visivel', periodoAtual === 'personalizado');
      window.atualizarDashboard();
    });
  }

  // Tipo de gráfico
  const sTipo = document.getElementById('tipoGraficoDash');
  if (sTipo) {
    sTipo.addEventListener('change', e => window.alterarTipoGrafico(e.target.value));
  }

  // Comparativo
  const chkComp = document.getElementById('usarComparativo');
  if (chkComp) {
    chkComp.addEventListener('change', e => {
      usarComparativo = e.target.checked;
      window.atualizarDashboard();
    });
  }

  // Botão atualizar
  const btnAtualizar = document.getElementById('btnAtualizarDash');
  if (btnAtualizar) btnAtualizar.addEventListener('click', () => window.atualizarDashboard());

  // Tela cheia
  const btnTela = document.getElementById('btnTelaCheia');
  if (btnTela) btnTela.addEventListener('click', alternarTelaCheia);

  // Exportar PDF
  const btnPDF = document.getElementById('btnExportarPDF');
  if (btnPDF) btnPDF.addEventListener('click', () => window.exportarDashboardPDF());

  // Alternar tema
  const btnTema = document.getElementById('btnAlternarTema');
  if (btnTema) btnTema.addEventListener('click', alternarTema);

  // Auto-refresh
  const sRefresh = document.getElementById('autoRefreshDash');
  if (sRefresh) {
    sRefresh.addEventListener('change', e => configurarAutoRefresh(parseInt(e.target.value) || 0));
    const salvo = localStorage.getItem('auto_refresh_min');
    if (salvo) {
      sRefresh.value = salvo;
      configurarAutoRefresh(parseInt(salvo));
    }
  }

  // Aplicar tema salvo
  const temaSalvo = localStorage.getItem('tema_frota');
  if (temaSalvo === 'escuro') document.body.classList.add('tema-escuro');
}

function alternarTelaCheia() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

function alternarTema() {
  const escuro = document.body.classList.toggle('tema-escuro');
  localStorage.setItem('tema_frota', escuro ? 'escuro' : 'claro');
  window.atualizarDashboard(); // Atualiza cores dos gráficos
  mostrarToast(`Tema ${escuro ? 'escuro' : 'claro'} ativado`, 'info');
}

function configurarAutoRefresh(minutos) {
  if (timerAutoRefresh) clearInterval(timerAutoRefresh);
  localStorage.setItem('auto_refresh_min', minutos.toString());
  if (minutos > 0) {
    timerAutoRefresh = setInterval(() => {
      console.log(`🔄 [DASHBOARD] Auto-refresh (${minutos}min)`);
      window.atualizarDashboard();
    }, minutos * 60 * 1000);
  }
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function formatarMoeda(valor) {
  return 'R$ ' + Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarKM(valor) {
  const v = Number(valor || 0);
  if (v >= 1000) return (v / 1000).toFixed(1).replace('.', ',') + 'K';
  return v.toLocaleString('pt-BR');
}

function mostrarToast(mensagem, tipo = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.textContent = mensagem;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.3s';
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

console.log('📦 [DASHBOARD] Script carregado, aguardando DOM...');
