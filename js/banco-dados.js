import { supabase } from './supabase.js'

// ========== LOCAIS (Origem/Destino) ==========
export async function obterLocais() {
  const { data, error } = await supabase
    .from('locais')
    .select('*')
    .order('nome')
  if (error) { console.error('Erro locais:', error); return [] }
  return data
}

export async function salvarLocal(local) {
  const { data, error } = await supabase
    .from('locais')
    .upsert([local], { onConflict: 'nome' })
    .select()
  if (error) { console.error('Erro salvar local:', error); return null }
  return data?.[0]
}

// ========== VEÍCULOS ==========
export async function obterVeiculos() {
  const { data, error } = await supabase
    .from('veiculos')
    .select('*')
    .order('placa')
  if (error) { console.error('Erro veículos:', error); return [] }
  return data
}

export async function salvarVeiculo(veiculo) {
  const { data, error } = await supabase
    .from('veiculos')
    .upsert([veiculo], { onConflict: 'placa' })
    .select()
  if (error) { console.error('Erro salvar veículo:', error); return null }
  return data?.[0]
}

export async function obterVeiculoPorPlaca(placa) {
  const { data, error } = await supabase
    .from('veiculos')
    .select('id, placa, km_inicial, responsavel, status')
    .eq('placa', placa)
    .single()
  if (error) return null
  return data
}

// ========== ALOCAÇÕES ==========
export async function obterAlocacoes(filtro = 'todos') {
  let query = supabase
    .from('alocacoes')
    .select(`
      *,
      veiculo:veiculo_id(placa, modelo, marca)
    `)

  if (filtro === 'ativos') {
    query = query.is('data_entrada', null)
  }

  const { data, error } = await query.order('data_saida', { ascending: false })
  if (error) { console.error('Erro alocações:', error); return [] }
  return data
}

export async function salvarAlocacaoSupabase(alocacao) {
  const { data, error } = await supabase
    .from('alocacoes')
    .upsert([alocacao])
    .select()
  if (error) { console.error('Erro salvar alocação:', error); return null }
  return data?.[0]
}

export async function encerrarAlocacao(id, dados) {
  const { error } = await supabase
    .from('alocacoes')
    .update(dados)
    .eq('id', id)
  return !error
}