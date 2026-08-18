// ============================================================
// 🔧 supabase.js - Configuração do Cliente Supabase
// ============================================================
// Substitua os valores abaixo pelas suas credenciais reais
// do painel do Supabase: Configurações → API
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// 🔴 SUAS CREDENCIAIS AQUI:
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co"
const SUPABASE_ANON_KEY = "SUA-CHAVE-ANONIMA-AQUI"

// Validação básica
if (!SUPABASE_URL || SUPABASE_URL.includes("SEU-PROJETO")) {
  console.warn("⚠️ ATENÇÃO: Configure a URL do Supabase no arquivo supabase.js!")
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes("SUA-CHAVE")) {
  console.warn("⚠️ ATENÇÃO: Configure a Chave Anônima do Supabase no arquivo supabase.js!")
}

// Cria o cliente Supabase com configurações otimizadas
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Application': 'GestaoFrotas',
    },
  },
})

console.log("✅ [supabase.js] Cliente Supabase inicializado:", SUPABASE_URL)

// Exporta as credenciais para referência (não exponha a chave em produção!)
export const CONFIG = {
  URL: SUPABASE_URL,
  TABELAS: ['veiculos', 'gastos', 'manutencao', 'chamados', 'usuarios', 'alocacoes']
}
