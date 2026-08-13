/* ============================================================
   DASHBOARD APRIMORADO - Gestão de Frotas
   Integração: 100% compatível com o novo sistema
   ============================================================ */

// ============================================================
// VARIÁVEIS GLOBAIS
// ============================================================
let graficoCategoria = null;
let graficoGastos = null;
let graficoTopVeiculos = null;
let graficoGastosCategoria = null;

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 [DASHBOARD] Inicializando...');
  // Aguarda o BD ser carregado pelo auth.js
  setTimeout(() => {
    inicializarDashboard();
    console.log('✅ [DASHBOARD] Inicializado com sucesso!');
  }, 500);
});

function inicializarDashboard() {
  try {
    atualizarDashboardCompleto();
  } catch (erro) {
    console.error('❌ [DASHBOARD] Erro na inicialização:', erro);
  }
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================
function formatarMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarKM(km) {
  const k = Number(km || 0);
  if (k >= 1000) return (k / 1000).toFixed(1).replace('.', ',') + 'K';
  return k.toLocaleString('pt-BR');
}

// ============================================================
// ATUALIZAR DASHBOARD COMPLETO (chamado globalmente)
// ============================================================
window.atualizarDashboardCompleto = function() {
  if (!window.BD) {
    console.warn('⚠️ [DASHBOARD] BD ainda não disponível, tentando novamente...');
    setTimeout(atualizarDashboardCompleto, 300);
    return;
  }
  
  const dados = carregarDadosDoBD();
  atualizarCardsEstatisticos(dados);
  inicializarGraficos(dados);
  verificarAlertas(dados);
};

// Alias para compatibilidade
window.atualizarDashboard = window.atualizarDashboardCompleto;

// ============================================================
// CARREGAR DADOS DO BD GLOBAL
// ============================================================
function carregarDadosDoBD() {
  const veiculos = BD.veiculos || [];
  const gastos = BD.gastos || [];
  const chamados = BD.chamados || [];
  const manutencoes = BD.manutencoes || [];
  const alocacoes = BD.alocacoes || [];
  const despesasViagem = BD.despesasViagem || [];
  
  // Inclui despesas de viagem APROVADAS nos gastos totais
  const despesasAprovadas = despesasViagem.filter(dv => dv.status === 'aprovado');
  const todosGastos = [...gastos, ...despesasAprovadas.map(dv => ({
    data: dv.data,
    valor: dv.total || dv.valorTotal || 0,
    tipo: 'Despesa Viagem',
    veiculoId: dv.veiculoId,
    veiculo: dv.veiculo
  }))];
  
  return { veiculos, gastos: todosGastos, chamados, manutencoes, alocacoes, despesasViagem };
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
  
  // Em operação = disponivel OU alocado
  const emOperacao = veiculos.filter(v => v.status === 'disponivel' || v.status === 'alocado').length;
  const emManutencao = veiculos.filter(v => v.status === 'manutencao').length;
  
  // Chamados abertos = status não é Resolvido
  const chamadosAbertos = Array.isArray(chamados) 
    ? chamados.filter(c => c.status !== 'Resolvido' && c.status !== 'fechado').length 
    : 0;
  
  // Gastos do mês atual
  const gastosMes = gastos.filter(g => {
    const d = new Date(g.data + 'T00:00:00');
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }).reduce((s, g) => s + (Number(g.valor) || 0), 0);
  
  // KM total rodado = soma de km_atual de todos os veículos
  const kmTotal = veiculos.reduce((s, v) => s + (Number(v.km_atual) || 0), 0);
  
  // Atualiza cada card
  atualizarCard('cardTotalVeiculos', total, 'cadastrados');
  atualizarCard('cardEmOperacao', emOperacao, `${total ? Math.round(emOperacao/total*100) : 0}% da frota`);
  atualizarCard('cardEmManutencao', emManutencao, 'precisam de atenção');
  atualizarCard('cardChamados', chamadosAbertos, 'pendentes');
  atualizarCard('cardGastosMes', formatarMoeda(gastosMes), 'gastos este mês');
  atualizarCard('cardKmRodados', formatarKM(kmTotal), 'Total rodado');
  
  // Atualiza também o elemento de porcentagem separado
  const elPct = document.getElementById('cardEmOperacaoPct');
  if (elPct) elPct.textContent = `${total ? Math.round(emOperacao/total*100) : 0}% da frota`;
}

function atualizarCard(id, valor, detalhe = '') {
  const el = document.getElementById(id);
  if (!el) return;
  
  const valorEl = el.querySelector('.stat-valor');
  const detalheEl = el.querySelector('.stat-detalhe');
  
  if (valorEl) valorEl.textContent = valor;
  if (detalheEl && detalhe) detalheEl.textContent = detalhe;
}

// ============================================================
// GRÁFICOS (ECharts)
// ============================================================
function inicializarGraficos(dados) {
  if (typeof echarts === 'undefined') {
    console.warn('⚠️ [DASHBOARD] ECharts não carregado');
    return;
  }
  
  // Limpa gráficos anteriores
  [graficoCategoria, graficoGastos, graficoTopVeiculos, graficoGastosCategoria]
    .forEach(g => g && g.dispose());
  
  criarGraficoCategoria(dados);
  criarGraficoGastos(dados);
  criarGraficoTopVeiculos(dados);
  criarGraficoGastosCategoria(dados);
  
  // Responsividade
  window.addEventListener('resize', () => {
    [graficoCategoria, graficoGastos, graficoTopVeiculos, graficoGastosCategoria]
      .forEach(g => g && g.resize());
  });
}

function criarGraficoCategoria(dados) {
  const el = document.getElementById('chartCategoria');
  if (!el) return;
  
  const contagem = {};
  const catNomes = {
    caminhao: 'Caminhão', utilitario: 'Utilitário', carro: 'Carro',
    moto: 'Moto', maquina: 'Máquina', van: 'Van', onibus: 'Ônibus', outro: 'Outro'
  };
  
  dados.veiculos.forEach(v => {
    const cat = catNomes[v.categoria] || v.categoria || 'Outro';
    contagem[cat] = (contagem[cat] || 0) + 1;
  });
  
  graficoCategoria = echarts.init(el);
  graficoCategoria.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#475569' } },
    series: [{
      type: 'doughnut',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}' },
      data: Object.entries(contagem).map(([nome, valor]) => ({ name: nome, value: valor })),
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
  
  const categoriasGrafico = ['Combustível', 'Manutenção', 'Outros', 'Despesa Viagem'];
  const series = categoriasGrafico.map(cat => ({
    name: cat,
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: meses.map(m => {
      return dados.gastos
        .filter(g => {
          const d = new Date(g.data + 'T00:00:00');
          const tipoGasto = g.tipo || g.categoria || '';
          return d.getMonth() === m.mes.getMonth() && 
                 d.getFullYear() === m.mes.getFullYear() &&
                 (cat === 'Outros' 
                   ? !categoriasGrafico.includes(tipoGasto) 
                   : tipoGasto === cat);
        })
        .reduce((s, g) => s + (Number(g.valor) || 0), 0);
    })
  }));
  
  graficoGastos = echarts.init(el);
  graficoGastos.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { top: 0, textStyle: { color: '#475569' } },
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
    // Busca placa pelo veiculoId ou usa o campo veiculo
    let placa = g.veiculo;
    if (!placa && g.veiculoId) {
      const v = (BD.veiculos || []).find(x => String(x.id) === String(g.veiculoId));
      placa = v?.placa || 'Sem ID';
    }
    if (!placa) placa = 'Sem identificação';
    
    porVeiculo[placa] = (porVeiculo[placa] || 0) + (Number(g.valor) || 0);
  });
  
  const top5 = Object.entries(porVeiculo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  graficoTopVeiculos = echarts.init(el);
  graficoTopVeiculos.setOption({
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' }, 
      formatter: p => `${p[0].name}<br/>R$ ${Number(p[0].value).toLocaleString('pt-BR')}` 
    },
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
    const c = g.tipo || g.categoria || 'Outros';
    porCat[c] = (porCat[c] || 0) + (Number(g.valor) || 0);
  });
  
  graficoGastosCategoria = echarts.init(el);
  graficoGastosCategoria.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: R$ {c}' },
    legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#475569' } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      itemStyle: { borderRadius: 6 },
      label: { show: false },
      data: Object.entries(porCat).map(([n, v]) => ({ name: n, value: v })),
      color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
    }]
  });
}

// ============================================================
// ALTERAR TIPO DE GRÁFICO
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
// ALERTAS
// ============================================================
function verificarAlertas(dados) {
  const container = document.getElementById('painelAlertas');
  if (!container) return;
  
  const alertas = [];
  const hoje = new Date();
  
  dados.veiculos.forEach(v => {
    const kmAtual = Number(v.km_atual) || 0;
    const kmProxima = Number(v.proxima_revisao_km) || 0;
    
    // Alerta de manutenção por KM
    if (kmProxima > 0) {
      const faltante = kmProxima - kmAtual;
      if (faltante <= 0) {
        alertas.push({ tipo: 'perigo', texto: `🔴 ${v.placa}: Manutenção VENCIDA! Rodou ${kmAtual.toLocaleString('pt-BR')} km` });
      } else if (faltante < 1000) {
        alertas.push({ tipo: 'aviso', texto: `🟡 ${v.placa}: Manutenção em apenas ${faltante.toFixed(0)} km` });
      }
    }
    
    // Alerta de vencimento do seguro
    if (v.seguro_vencimento) {
      try {
        const venc = new Date(v.seguro_vencimento + 'T00:00:00');
        const dias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
        
        if (dias <= 0) {
          alertas.push({ tipo: 'perigo', texto: `🔴 ${v.placa}: Seguro VENCIDO!` });
        } else if (dias <= 30) {
          alertas.push({ tipo: 'aviso', texto: `🟠 ${v.placa}: Seguro vence em ${dias} dias` });
        }
      } catch(e) {}
    }
    
    // Alerta de veículo em manutenção
    if (v.status === 'manutencao') {
      alertas.push({ tipo: 'info', texto: `🔧 ${v.placa}: Veículo em manutenção` });
    }
  });
  
  // Alertas de chamados abertos
  const chamadosAbertos = (dados.chamados || []).filter(c => c.status !== 'Resolvido');
  chamadosAbertos.slice(0, 3).forEach(c => {
    const v = (BD.veiculos || []).find(x => String(x.id) === String(c.veiculoId));
    const placa = v?.placa || 'Veículo';
    alertas.push({ tipo: 'aviso', texto: `📢 ${placa}: ${c.tipo} - ${c.status}` });
  });
  
  if (alertas.length === 0) {
    container.innerHTML = `
      <div class="alerta alerta-sucesso">
        <i class="fa-solid fa-check-circle"></i>
        <span>Nenhum alerta no momento. Tudo em ordem!</span>
      </div>`;
    return;
  }
  
  // Mostra apenas os 10 alertas mais importantes
  container.innerHTML = alertas.slice(0, 10).map(a => `
    <div class="alerta alerta-${a.tipo}">
      <span>${a.texto}</span>
    </div>
  `).join('');
}

// ============================================================
// EXPORTAR PDF
// ============================================================
window.exportarDashboardPDF = function() {
  if (typeof mostrarToast === 'function') {
    mostrarToast('Preparando para exportar...', 'info');
  }
  setTimeout(() => window.print(), 300);
};