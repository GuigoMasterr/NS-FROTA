// ============================================================
// 🔄 sync.js - Sistema de Sincronização Supabase ↔ localStorage
// ============================================================
// Funcionalidades:
// ✅ Buscar dados do Supabase
// ✅ Enviar dados para o Supabase
// ✅ Backup automático no localStorage
// ✅ Modo offline (usa dados locais se Supabase cair)
// ✅ Fila de pendentes para sincronizar depois
// ============================================================

import { supabase, CONFIG } from './supabase.js'

const TABELAS = CONFIG.TABELAS

// Armazena os dados na memória para acesso rápido
window.dadosSistema = window.dadosSistema || {}

// ============================================================
// 📥 FUNÇÃO PRINCIPAL: Buscar todos os dados do Supabase
// ============================================================
export async function buscarDadosSupabase() {
  console.log("\n🔄 [sync.js] Buscando dados do Supabase...")
  
  const todosDados = {}
  let teveErro = false

  for (const tabela of TABELAS) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error

      todosDados[tabela] = data || []
      console.log(`✅ ${tabela}: ${data.length} registros baixados`)

      // 💾 Faz backup automático no localStorage
      salvarBackupLocal(tabela, data)

    } catch (erro) {
      teveErro = true
      console.error(`❌ Erro ao buscar ${tabela}:`, erro.message)
      
      // 🚨 Se falhar, usa os dados do backup local
      const dadosLocais = carregarBackupLocal(tabela)
      todosDados[tabela] = dadosLocais
      
      if (dadosLocais.length > 0) {
        console.log(`⚠️ Usando backup local para ${tabela}: ${dadosLocais.length} registros`)
      } else {
        console.log(`ℹ️ Sem dados locais para ${tabela}`)
      }
    }
  }

  // Atualiza a memória global
  window.dadosSistema = todosDados
  
  // Dispara evento para o Dashboard atualizar
  document.dispatchEvent(new CustomEvent('dadosCarregados', { 
    detail: todosDados 
  }))

  console.log("\n📊 [sync.js] Resumo dos dados:", resumoDados(todosDados))
  
  return { 
    sucesso: !teveErro, 
    dados: todosDados,
    usandoBackup: teveErro
  }
}

// ============================================================
// 📤 FUNÇÃO: Inserir ou Atualizar dados no Supabase
// ============================================================
export async function salvarNoSupabase(tabela, dados) {
  console.log(`📤 [sync.js] Salvando em ${tabela}:`, dados)

  try {
    let resultado
    
    if (dados.id && dados.id !== null) {
      // 🔄 Atualiza registro existente
      const { data, error } = await supabase
        .from(tabela)
        .update(dados)
        .eq('id', dados.id)
        .select()
      
      if (error) throw error
      resultado = data[0]
      console.log(`✅ ${tabela} #${dados.id} atualizado no Supabase`)
    } else {
      // ➕ Insere novo registro
      const { data, error } = await supabase
        .from(tabela)
        .insert([dados])
        .select()
      
      if (error) throw error
      resultado = data[0]
      console.log(`✅ ${tabela} inserido no Supabase, ID: ${resultado?.id}`)
    }

    // 💾 Atualiza o backup local
    await atualizarBackupLocal(tabela)
    
    // 🔄 Atualiza os dados na memória
    await buscarDadosSupabase()
    
    return { sucesso: true, dados: resultado }

  } catch (erro) {
    console.error(`❌ Erro ao salvar em ${tabela}:`, erro.message)
    
    // 🚨 Salva na fila de pendentes para sincronizar depois
    adicionarPendente(tabela, dados)
    
    return { 
      sucesso: false, 
      erro: erro.message,
      salvoLocalmente: true
    }
  }
}

// ============================================================
// 🗑️ FUNÇÃO: Excluir registro do Supabase
// ============================================================
export async function excluirDoSupabase(tabela, id) {
  console.log(`🗑️ [sync.js] Excluindo ${tabela} #${id}`)

  try {
    const { error } = await supabase
      .from(tabela)
      .delete()
      .eq('id', id)

    if (error) throw error
    
    console.log(`✅ ${tabela} #${id} excluído do Supabase`)
    
    // 💾 Atualiza backup local
    await atualizarBackupLocal(tabela)
    
    // 🔄 Atualiza dados na memória
    await buscarDadosSupabase()
    
    return { sucesso: true }
  } catch (erro) {
    console.error(`❌ Erro ao excluir:`, erro.message)
    return { sucesso: false, erro: erro.message }
  }
}

// ============================================================
// 💾 FUNÇÕES: Gerenciamento do Backup Local (localStorage)
// ============================================================

function salvarBackupLocal(tabela, dados) {
  try {
    localStorage.setItem(`backup_${tabela}`, JSON.stringify(dados))
    localStorage.setItem(`backup_data_${tabela}`, new Date().toISOString())
  } catch (e) {
    console.warn(`⚠️ Não foi possível salvar backup de ${tabela}:`, e.message)
  }
}

function carregarBackupLocal(tabela) {
  try {
    const dados = localStorage.getItem(`backup_${tabela}`)
    return dados ? JSON.parse(dados) : []
  } catch {
    return []
  }
}

async function atualizarBackupLocal(tabela) {
  try {
    const { data } = await supabase.from(tabela).select('*')
    salvarBackupLocal(tabela, data || [])
  } catch (e) {
    console.warn(`⚠️ Erro ao atualizar backup de ${tabela}:`, e.message)
  }
}

export function obterDataUltimoBackup(tabela) {
  return localStorage.getItem(`backup_data_${tabela}`) || 'Nunca'
}

// ============================================================
// 📋 FUNÇÕES: Fila de Pendentes (para quando estiver offline)
// ============================================================

function adicionarPendente(tabela, dados) {
  try {
    const pendentes = JSON.parse(localStorage.getItem('pendentes') || '[]')
    pendentes.push({ 
      tabela, 
      dados, 
      dataHora: new Date().toISOString(),
      tentativas: 0
    })
    localStorage.setItem('pendentes', JSON.stringify(pendentes))
    console.log(`💾 Salvo na fila de pendentes para sincronizar depois`)
  } catch (e) {
    console.error(`❌ Não foi possível salvar pendente:`, e.message)
  }
}

export function listarPendentes() {
  return JSON.parse(localStorage.getItem('pendentes') || '[]')
}

export async function sincronizarPendentes() {
  const pendentes = listarPendentes()
  
  if (pendentes.length === 0) return { sincronizados: 0 }
  
  console.log(`\n🔄 [sync.js] Sincronizando ${pendentes.length} registros pendentes...`)
  
  let sincronizados = 0
  const restantes = []

  for (const item of pendentes) {
    const resultado = await salvarNoSupabase(item.tabela, item.dados)
    
    if (resultado.sucesso) {
      sincronizados++
    } else {
      item.tentativas = (item.tentativas || 0) + 1
      if (item.tentativas < 5) {
        restantes.push(item)
      }
    }
  }
  
  localStorage.setItem('pendentes', JSON.stringify(restantes))
  console.log(`✅ [sync.js] ${sincronizados} pendentes sincronizados!`)
  
  return { sincronizados, restantes: restantes.length }
}

// ============================================================
// 🔍 FUNÇÕES AUXILIARES
// ============================================================

function resumoDados(dados) {
  const resumo = {}
  for (const tabela of TABELAS) {
    resumo[tabela] = `${dados[tabela]?.length || 0} registros`
  }
  return resumo
}

export function obterDados(tabela) {
  return window.dadosSistema[tabela] || carregarBackupLocal(tabela)
}

// ============================================================
// 🚀 INICIALIZAÇÃO AUTOMÁTICA DO SISTEMA
// ============================================================

export async function inicializarSistema() {
  console.log("\n🚀 [sync.js] Inicializando sistema de sincronização...")
  
  // 1. Primeiro carrega os dados locais (rápido, para mostrar algo na tela)
  for (const tabela of TABELAS) {
    const dadosLocais = carregarBackupLocal(tabela)
    if (dadosLocais.length > 0) {
      window.dadosSistema[tabela] = dadosLocais
    }
  }
  
  // Dispara evento inicial com dados locais
  if (Object.keys(window.dadosSistema).length > 0) {
    document.dispatchEvent(new CustomEvent('dadosCarregados', { 
      detail: window.dadosSistema 
    }))
  }
  
  // 2. Depois busca do Supabase e atualiza tudo
  const resultado = await buscarDadosSupabase()
  
  // 3. Tenta sincronizar o que estava pendente
  await sincronizarPendentes()
  
  return resultado
}

// Inicializa automaticamente quando o script carrega
inicializarSistema().then(() => {
  console.log("\n🎉 [sync.js] Sistema de sincronização pronto!")
})

// Atualiza automaticamente a cada 30 segundos
setInterval(async () => {
  await buscarDadosSupabase()
  await sincronizarPendentes()
}, 30000) // 30.000ms = 30 segundos
