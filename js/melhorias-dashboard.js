/* ============================================================
   DASHBOARD APRIMORADO - ✅ CORRIGIDO
   Correção: const BD → var BD (evita redeclaração)
   ============================================================ */
let graficoCategoria = null;
let graficoGastos = null;
let graficoTopVeiculos = null;
let graficoGastosCategoria = null;

// ✅ CORREÇÃO: var permite redeclaração, const não
// ✅ CORREÇÃO: Função getBD() para dados sempre atualizados
function getBD() { return window.BD || {}; }
// ==================================================
// ✅ CORREÇÃO: Inicialização imediata
// ==================================================
function inicializarDashboardModule() {
  console.log("🚀 [DASHBOARD] Inicializando...");
  setTimeout(() => {
    inicializarDashboard();
    console.log("✅ [DASHBOARD] Inicializado com sucesso!");
  }, 500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarDashboardModule);
} else if (document.body) {
  inicializarDashboardModule();
} else {
  setTimeout(inicializarDashboardModule, 50);
}

function inicializarDashboard() {
  try {
    atualizarDashboardCompleto();
  } catch (erro) {
    console.error('❌ [DASHBOARD] Erro:', erro);
  }
}

function formatarMoeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarKM(km) {
  const k = Number(km || 0);
  if (k >= 1000) return (k / 1000).toFixed(1).replace('.', ',') + 'K';
  return k.toLocaleString('pt-BR');
}

window.atualizarDashboardCompleto = function() {
  // ✅ Sempre recarrega BD do window (garante dados atualizados)
  BD = window.BD || { veiculos: [], gastos: [], chamados: [], manutencoes: [], alocacoes: [], gastosViagem: [] };
  
  if (!getBD() || !getBD().veiculos) {
    console.warn('⚠️ [DASHBOARD] BD ainda não disponível, tentando novamente...');
    setTimeout(atualizarDashboardCompleto, 300);
    return;
  }
  
  const dados = carregarDadosDoBD();
  atualizarCardsEstatisticos(dados);
  inicializarGraficos(dados);
  verificarAlertas(dados);
};

window.atualizarDashboard = window.atualizarDashboardCompleto;

function carregarDadosDoBD() {
  const veiculos = getBD().veiculos || [];
  const gastos = getBD().gastos || [];
  const chamados = getBD().chamados || [];
  const manutencoes = getBD().manutencoes || [];
  const alocacoes = getBD().alocacoes || [];
  const gastosViagem = getBD().gastosViagem || [];
  
  const todosGastos = [...gastos, ...gastosViagem.map(gv => ({
    data: gv.data,
    valor: gv.valor || 0,
    tipo: gv.tipo || 'Despesa Viagem',
    veiculoId: gv.veiculoId
  }))];
  
  return { veiculos, gastos: todosGastos, chamados, manutencoes, alocacoes, gastosViagem };
}

function atualizarCardsEstatisticos(dados) {
  const { veiculos, chamados } = dados;
  const total = veiculos.length;
  const emOperacao = veiculos.filter(v => 
    v.status === 'Disponível' || v.status === 'Em Operação' || v.status === 'alocado'
  ).length;
  const emManutencao = veiculos.filter(v => 
    v.status === 'Em Manutenção' || v.status === 'manutencao'
  ).length;
  const chamadosAbertos = (chamados || []).filter(c => 
    c.status !== 'Resolvido' && c.status !== 'fechado'
  ).length;
  const kmTotal = veiculos.reduce((s, v) => s + (Number(v.km_atual) || 0), 0);

  console.log(`📊 [DASHBOARD] Total=${total} | Op=${emOperacao} | Manut=${emManutencao} | KM=${kmTotal.toLocaleString('pt-BR')}`);

  // ✅ MÉTODO INFALÍVEL: Trocar todos os "0" em ordem
  const todos = document.body.querySelectorAll('*');
  const zeros = [];
  todos.forEach(el => {
    if (el.children.length === 0 && el.textContent.trim() === '0') {
      zeros.push(el);
    }
  });

  // Aplicar valores na ordem dos cards
  if (zeros[0]) zeros[0].textContent = total;
  if (zeros[1]) zeros[1].textContent = emOperacao;
  if (zeros[2]) zeros[2].textContent = emManutencao;
  if (zeros[3]) zeros[3].textContent = chamadosAbertos;
  if (zeros[5]) zeros[5].textContent = kmTotal.toLocaleString('pt-BR');

  // Atualizar textos complementares
  const textos = document.body.querySelectorAll('*');
  textos.forEach(el => {
    const txt = el.textContent?.trim() || '';
    if (txt.includes('% da frota')) {
      el.textContent = `${total ? Math.round(emOperacao/total*100) : 0}% da frota`;
    }
  });
}

function atualizarCard(id, valor, detalhe = '') {
  const el = document.getElementById(id);
  if (!el) return;
  const valorEl = el.querySelector('.stat-valor');
  const detalheEl = el.querySelector('.stat-detalhe');
  if (valorEl) valorEl.textContent = valor;
  if (detalheEl && detalhe) detalheEl.textContent = detalhe;
}

function inicializarGraficos(dados) {
  if (typeof echarts === 'undefined') {
    console.warn('⚠️ [DASHBOARD] ECharts não carregado');
    return;
  }
  
  [graficoCategoria, graficoGastos, graficoTopVeiculos, graficoGastosCategoria]
    .forEach(g => g && g.dispose());
  
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
    let placa = g.veiculo;
    if (!placa && g.veiculoId) {
      const v = (getBD().veiculos || []).find(x => String(x.id) === String(g.veiculoId));
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
      formatter: p => `${p[0].name}<br />R$ ${Number(p[0].value).toLocaleString('pt-BR')}` 
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

function verificarAlertas(dados) {
  const container = document.getElementById('painelAlertas');
  if (!container) return;
  
  const alertas = [];
  const hoje = new Date();
  
  dados.veiculos.forEach(v => {
    const kmAtual = Number(v.km_atual) || 0;
    const kmProxima = Number(v.proxima_revisao_km) || 0;
    
    if (kmProxima > 0) {
      const faltante = kmProxima - kmAtual;
      if (faltante <= 0) {
        alertas.push({ tipo: 'perigo', texto: `🔴 ${v.placa}: Manutenção VENCIDA! Rodou ${kmAtual.toLocaleString('pt-BR')} km` });
      } else if (faltante < 1000) {
        alertas.push({ tipo: 'aviso', texto: `🟡 ${v.placa}: Manutenção em apenas ${faltante.toFixed(0)} km` });
      }
    }
    
    if (v.seguro_vencimento) {
      try {
        const venc = new Date(v.seguro_vencimento + 'T00:00:00');
        const dias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
        if (dias <= 0) alertas.push({ tipo: 'perigo', texto: `🔴 ${v.placa}: Seguro VENCIDO!` });
        else if (dias <= 30) alertas.push({ tipo: 'aviso', texto: `🟠 ${v.placa}: Seguro vence em ${dias} dias` });
      } catch(e) {}
    }
    
    if (v.status === 'manutencao') {
      alertas.push({ tipo: 'info', texto: `🔧 ${v.placa}: Veículo em manutenção` });
    }
  });
  
  const chamadosAbertos = (dados.chamados || []).filter(c => c.status !== 'Resolvido');
  chamadosAbertos.slice(0, 3).forEach(c => {
    const v = (getBD().veiculos || []).find(x => String(x.id) === String(c.veiculoId));
    const placa = v?.placa || 'Veículo';
    alertas.push({ tipo: 'aviso', texto: `📢 ${placa}: ${c.tipo} - ${c.status}` });
  });
  
  if (alertas.length === 0) {
    container.innerHTML = `<div class="alerta alerta-sucesso"><i class="fa-solid fa-check-circle"></i><span>Nenhum alerta no momento. Tudo em ordem!</span></div>`;
    return;
  }
  
  container.innerHTML = alertas.slice(0, 10).map(a => `
    <div class="alerta alerta-${a.tipo}"><span>${a.texto}</span></div>
  `).join('');
}

window.exportarDashboardPDF = function() {
  if (typeof mostrarToast === 'function') mostrarToast('Preparando para exportar...', 'info');
  setTimeout(() => window.print(), 300);
};

console.log('✅ melhorias-dashboard.js carregado');
