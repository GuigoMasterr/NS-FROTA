// ============================================================
// 📊 dashboard.js - Atualização Automática do Painel de Controle
// ============================================================
// Lê os dados carregados pelo sync.js e atualiza os cards
// do Dashboard com os valores corretos.
// ============================================================

import { inicializarSistema, obterDados } from './sync.js'

// ============================================================
// 🎯 FUNÇÃO PRINCIPAL: Atualiza todo o Dashboard
// ============================================================
function atualizarDashboard(dados) {
  console.log("\n📊 [dashboard.js] Atualizando Painel de Controle...")
  
  if (!dados) {
    console.warn("⚠️ Nenhum dado recebido para atualizar o Dashboard")
    return
  }

  // ==============================
  // 🔢 TOTAL DE VEÍCULOS
  // ==============================
  const totalVeiculos = dados.veiculos?.length || 0
  atualizarCard('total-veiculos', totalVeiculos)
  
  // ==============================
  // 🟢 EM OPERAÇÃO
  // ==============================
  const emOperacao = contarVeiculosPorStatus(dados.veiculos, ['ativo', 'operacao', 'em operação', 'disponivel', 'disponível'])
  atualizarCard('em-operacao', emOperacao)
  
  // Porcentagem da frota em operação
  const porcentagem = totalVeiculos > 0 ? Math.round((emOperacao / totalVeiculos) * 100) : 0
  atualizarTexto('porcentagem-operacao', `${porcentagem}% da frota`)
  
  // ==============================
  // 🔧 EM MANUTENÇÃO
  // ==============================
  const emManutencao = contarVeiculosPorStatus(dados.veiculos, ['manutencao', 'manutenção', 'oficina', 'inativo', 'indisponivel', 'indisponível'])
  atualizarCard('em-manutencao', emManutencao)
  
  // ==============================
  // 📞 CHAMADOS ABERTOS
  // ==============================
  const chamadosAbertos = contarPorStatus(dados.chamados, ['aberto', 'pendente', 'em andamento', 'em análise'])
  atualizarCard('chamados-abertos', chamadosAbertos)
  
  // ==============================
  // 💰 GASTOS DO MÊS
  // ==============================
  const totalGastosMes = calcularGastosDoMes(dados.gastos)
  atualizarCard('gastos-mes', formatarMoeda(totalGastosMes))
  
  // ==============================
  // 🛣️ KM RODADOS TOTAL
  // ==============================
  const kmTotal = calcularKmTotal(dados.veiculos)
  atualizarCard('km-rodados', kmTotal.toLocaleString('pt-BR'))

  console.log("✅ [dashboard.js] Painel atualizado com sucesso!")
}

// ============================================================
// 🔍 FUNÇÕES AUXILIARES DE CÁLCULO
// ============================================================

function contarVeiculosPorStatus(veiculos, statusPermitidos) {
  if (!veiculos) return 0
  
  return veiculos.filter(v => {
    if (!v.status) return false
    const status = String(v.status).toLowerCase().trim()
    return statusPermitidos.some(s => status.includes(s.toLowerCase()))
  }).length
}

function contarPorStatus(registros, statusPermitidos) {
  if (!registros) return 0
  
  return registros.filter(r => {
    if (!r.status) return false
    const status = String(r.status).toLowerCase().trim()
    return statusPermitidos.some(s => status.includes(s.toLowerCase()))
  }).length
}

function calcularGastosDoMes(gastos) {
  if (!gastos) return 0
  
  const hoje = new Date()
  const mesAtual = hoje.getMonth()
  const anoAtual = hoje.getFullYear()
  
  return gastos.reduce((soma, gasto) => {
    if (!gasto.data || !gasto.valor) return soma
    
    try {
      const dataGasto = new Date(gasto.data)
      if (dataGasto.getMonth() === mesAtual && dataGasto.getFullYear() === anoAtual) {
        return soma + (parseFloat(gasto.valor) || 0)
      }
    } catch (e) {
      // Ignora datas inválidas
    }
    
    return soma
  }, 0)
}

function calcularKmTotal(veiculos) {
  if (!veiculos) return 0
  
  return veiculos.reduce((soma, v) => {
    return soma + (parseFloat(v.quilometragem) || parseFloat(v.km) || 0)
  }, 0)
}

// ============================================================
// 🎨 FUNÇÕES AUXILIARES DE INTERFACE
// ============================================================

function atualizarCard(idElemento, valor) {
  const elemento = document.getElementById(idElemento)
  
  if (!elemento) {
    console.warn(`⚠️ Elemento não encontrado: #${idElemento}`)
    return
  }
  
  // Atualiza o valor
  elemento.textContent = valor
  
  // Efeito visual de atualização
  elemento.style.transition = 'color 0.3s ease'
  elemento.style.color = '#10b981' // verde
  
  setTimeout(() => {
    elemento.style.color = ''
  }, 500)
}

function atualizarTexto(idElemento, texto) {
  const elemento = document.getElementById(idElemento)
  if (elemento) {
    elemento.textContent = texto
  }
}

function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor)
}

// ============================================================
// 🎬 INICIALIZAÇÃO DO DASHBOARD
// ============================================================

// Aguarda o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', async () => {
  console.log("\n🎬 [dashboard.js] DOM carregado, iniciando Dashboard...")
  
  // Inicializa o sistema de sincronização
  await inicializarSistema()
})

// Escuta o evento de dados carregados (disparado pelo sync.js)
document.addEventListener('dadosCarregados', (e) => {
  atualizarDashboard(e.detail)
})

// Também tenta atualizar imediatamente se os dados já estiverem prontos
if (window.dadosSistema && Object.keys(window.dadosSistema).length > 0) {
  atualizarDashboard(window.dadosSistema)
}

console.log("✅ [dashboard.js] Script carregado e pronto!")
