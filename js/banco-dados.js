import { supabase } from './supabase.js'

// ==================================================
// 🔧 FUNÇÕES AUXILIARES
// ==================================================
function tratarErro(acao, erro) {
  if (erro) console.error(`❌ Erro ${acao}:`, erro)
  return erro ? null : true
}

// ==================================================
// 📍 LOCAIS
// ==================================================
export async function obterLocais() {
  const { data, error } = await supabase.from('locais').select('*').order('nome')
  tratarErro('carregar locais', error)
  return data || []
}

export async function salvarLocal(local) {
  const { data, error } = await supabase.from('locais').upsert([local], { onConflict: 'nome' }).select()
  tratarErro('salvar local', error)
  return data?.[0]
}

// ==================================================
// 👤 USUÁRIOS
// ==================================================
export async function obterUsuarios() {
  const { data, error } = await supabase.from('usuarios').select('*').order('nome')
  tratarErro('carregar usuários', error)
  return data || []
}

export async function autenticarUsuario(usuario, senha) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario)
    .eq('senha', senha)
    .eq('ativo', true)
    .single()
  if (error) return null
  return data
}

export async function salvarUsuario(dados) {
  const { data, error } = await supabase.from('usuarios').upsert([dados], { onConflict: 'usuario' }).select()
  tratarErro('salvar usuário', error)
  return data?.[0]
}

// ==================================================
// 🚗 VEÍCULOS
// ==================================================
export async function obterVeiculos() {
  const { data, error } = await supabase.from('veiculos').select('*').order('placa')
  tratarErro('carregar veículos', error)
  return data || []
}

export async function obterVeiculoPorId(id) {
  const { data, error } = await supabase.from('veiculos').select('*').eq('id', id).single()
  return error ? null : data
}

export async function obterVeiculoPorPlaca(placa) {
  const { data, error } = await supabase.from('veiculos').select('*').eq('placa', placa).single()
  return error ? null : data
}

export async function salvarVeiculo(dados) {
  const { data, error } = await supabase.from('veiculos').upsert([dados], { onConflict: 'placa' }).select()
  tratarErro('salvar veículo', error)
  return data?.[0]
}

// ==================================================
// 📋 ALOCAÇÕES
// ==================================================
export async function obterAlocacoes(filtro = 'todos') {
  let query = supabase.from('alocacoes').select(`
    *,
    veiculo:veiculo_id(placa, modelo, marca)
  `).order('data_saida', { ascending: false })

  if (filtro === 'ativas') query = query.eq('status', 'ativa')

  const { data, error } = await query
  tratarErro('carregar alocações', error)
  return data || []
}

export async function salvarAlocacao(dados) {
  const { data, error } = await supabase.from('alocacoes').insert([dados]).select()
  tratarErro('salvar alocação', error)
  return data?.[0]
}

export async function encerrarAlocacao(id, dados) {
  const { error } = await supabase.from('alocacoes').update(dados).eq('id', id)
  return !error
}

// ==================================================
// ✅ CHECK-LIST
// ==================================================
export async function salvarChecklist(dados) {
  const { data, error } = await supabase.from('checklists').insert([dados]).select()
  tratarErro('salvar check-list', error)
  return data?.[0]
}

export async function obterChecklists(veiculoId = null) {
  let query = supabase.from('checklists').select(`
    *,
    veiculo:veiculo_id(placa, modelo)
  `).order('data_hora', { ascending: false })

  if (veiculoId) query = query.eq('veiculo_id', veiculoId)

  const { data, error } = await query
  tratarErro('carregar check-list', error)
  return data || []
}

// ==================================================
// 📞 CHAMADOS
// ==================================================
export async function abrirChamado(dados) {
  const { data, error } = await supabase.from('chamados').insert([dados]).select()
  tratarErro('abrir chamado', error)
  return data?.[0]
}

export async function obterChamados(filtro = 'todos') {
  let query = supabase.from('chamados').select(`
    *,
    veiculo:veiculo_id(placa, modelo)
  `).order('data_abertura', { ascending: false })

  if (filtro === 'abertos') query = query.eq('status', 'aberto')
  if (filtro === 'meus') { /* filtrar por motorista logado */ }

  const { data, error } = await query
  tratarErro('carregar chamados', error)
  return data || []
}

export async function atualizarStatusChamado(id, status, observacao = null) {
  const dados = { status }
  if (status === 'em_andamento') dados.data_atendimento = new Date()
  if (status === 'resolvido' || status === 'fechado') {
    dados.data_fechamento = new Date()
    if (observacao) dados.solucao = observacao
  }

  const { error } = await supabase.from('chamados').update(dados).eq('id', id)
  return !error
}

// ==================================================
// 💰 GASTOS
// ==================================================
export async function obterGastos(veiculoId = null) {
  let query = supabase.from('gastos').select(`
    *,
    veiculo:veiculo_id(placa, modelo)
  `).order('data', { ascending: false })

  if (veiculoId) query = query.eq('veiculo_id', veiculoId)

  const { data, error } = await query
  tratarErro('carregar gastos', error)
  return data || []
}

export async function salvarGasto(dados) {
  const { data, error } = await supabase.from('gastos').insert([dados]).select()
  tratarErro('salvar gasto', error)
  return data?.[0]
}

// ==================================================
// 🔧 MANUTENÇÃO
// ==================================================
export async function obterManutencoes(veiculoId = null) {
  let query = supabase.from('manutencoes').select(`
    *,
    veiculo:veiculo_id(placa, modelo)
  `).order('data_solicitacao', { ascending: false })

  if (veiculoId) query = query.eq('veiculo_id', veiculoId)

  const { data, error } = await query
  tratarErro('carregar manutenções', error)
  return data || []
}

export async function salvarManutencao(dados) {
  const { data, error } = await supabase.from('manutencoes').insert([dados]).select()
  tratarErro('salvar manutenção', error)
  return data?.[0]
}

export async function atualizarStatusManutencao(id, status, dados = {}) {
  const { error } = await supabase.from('manutencoes').update({ status, ...dados }).eq('id', id)
  return !error
}