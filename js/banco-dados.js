import { supabase } from './supabase.js'

// ==================================================
// 💾 BANCO DE DADOS LOCAL (fallback quando offline)
// ==================================================
export let BD = {
    locais: [
        { id: 'patio-metalica', nome: 'Pátio Metálica' },
        { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' },
        { id: 'obra', nome: 'Obra' }
    ],
    veiculos: [],
    checklists: [],
    manutencoes: [],
    gastos: [],
    chamados: [],
    alocacoes: [],
    usuarios: []
};

// Salva dados no localStorage
export function salvarDados() {
    try {
        localStorage.setItem('bd_frotas', JSON.stringify(BD));
    } catch (e) {
        console.warn('Não foi possível salvar dados locais:', e);
    }
}

// Carrega dados do localStorage
async function carregarDadosLocais() {
    try {
        const salvos = localStorage.getItem('bd_frotas');
        if (salvos) {
            const parseados = JSON.parse(salvos);
            BD = { ...BD, ...parseados };
        }
    } catch (e) {
        console.warn('Erro ao carregar dados locais:', e);
    }
}

// Sincroniza com Supabase
export async function sincronizarBD() {
    try {
        const [locais, veiculos, checklists, manutencoes, gastos, chamados, alocacoes] = await Promise.all([
            obterLocais().catch(() => []),
            obterVeiculos().catch(() => []),
            obterChecklists().catch(() => []),
            obterManutencoes().catch(() => []),
            obterGastos().catch(() => []),
            obterChamados().catch(() => []),
            obterAlocacoes().catch(() => [])
        ]);

        BD.locais = locais.length > 0 ? locais : BD.locais;
        BD.veiculos = veiculos;
        BD.checklists = checklists;
        BD.manutencoes = manutencoes;
        BD.gastos = gastos;
        BD.chamados = chamados;
        BD.alocacoes = alocacoes;

        salvarDados();
        console.log('✅ BD sincronizado com Supabase');
    } catch (erro) {
        console.warn('⚠️ Usando dados locais (offline):', erro);
        await carregarDadosLocais();
    }
}

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
  return data || BD.locais
}

export async function salvarLocal(local) {
  const { data, error } = await supabase.from('locais').upsert([local], { onConflict: 'nome' }).select()
  tratarErro('salvar local', error)
  if (data?.[0]) return data[0];
  // Fallback local
  const idx = BD.locais.findIndex(l => l.id === local.id);
  if (idx >= 0) BD.locais[idx] = local;
  else BD.locais.push(local);
  salvarDados();
  return local;
}

// ==================================================
// 👤 USUÁRIOS
// ==================================================
export async function obterUsuarios() {
  const { data, error } = await supabase.from('usuarios').select('*').order('nome')
  tratarErro('carregar usuários', error)
  return data || BD.usuarios
}

export async function autenticarUsuario(usuario, senha) {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario)
    .eq('senha', senha)
    .eq('ativo', true)
    .single()
  if (!error && data) return data;
  // Fallback credenciais padrão
  const { LOGIN } = await import('./config.js').catch(() => ({ LOGIN: null }));
  if (LOGIN) {
    if (usuario === LOGIN.ADMIN.usuario && senha === LOGIN.ADMIN.senha) return LOGIN.ADMIN;
    if (usuario === LOGIN.MOTORISTA.usuario && senha === LOGIN.MOTORISTA.senha) return LOGIN.MOTORISTA;
  }
  return null;
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
  return data || BD.veiculos
}

export async function obterVeiculoPorId(id) {
  const { data, error } = await supabase.from('veiculos').select('*').eq('id', id).single()
  return error ? BD.veiculos.find(v => v.id === id) || null : data
}

export async function obterVeiculoPorPlaca(placa) {
  const { data, error } = await supabase.from('veiculos').select('*').eq('placa', placa).single()
  return error ? BD.veiculos.find(v => v.placa === placa) || null : data
}

export async function salvarVeiculo(dados) {
  const { data, error } = await supabase.from('veiculos').upsert([dados], { onConflict: 'placa' }).select()
  tratarErro('salvar veículo', error)
  if (data?.[0]) return data[0];
  // Fallback local
  const idx = BD.veiculos.findIndex(v => v.placa === dados.placa);
  if (idx >= 0) BD.veiculos[idx] = dados;
  else BD.veiculos.push(dados);
  salvarDados();
  return dados;
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
  return data || BD.alocacoes
}

export async function salvarAlocacao(dados) {
  const { data, error } = await supabase.from('alocacoes').insert([dados]).select()
  tratarErro('salvar alocação', error)
  if (data?.[0]) return data[0];
  BD.alocacoes.push(dados);
  salvarDados();
  return dados;
}

export async function encerrarAlocacao(id, dados) {
  const { error } = await supabase.from('alocacoes').update(dados).eq('id', id)
  if (!error) return true;
  // Fallback local
  const idx = BD.alocacoes.findIndex(a => a.id === id);
  if (idx >= 0) { BD.alocacoes[idx] = { ...BD.alocacoes[idx], ...dados }; salvarDados(); return true; }
  return false;
}

// ==================================================
// ✅ CHECK-LIST
// ==================================================
export async function salvarChecklist(dados) {
  const { data, error } = await supabase.from('checklists').insert([dados]).select()
  tratarErro('salvar check-list', error)
  if (data?.[0]) return data[0];
  BD.checklists.push(dados);
  salvarDados();
  return dados;
}

export async function obterChecklists(veiculoId = null) {
  let query = supabase.from('checklists').select(`
    *,
    veiculo:veiculo_id(placa, modelo)
  `).order('data_hora', { ascending: false })

  if (veiculoId) query = query.eq('veiculo_id', veiculoId)

  const { data, error } = await query
  tratarErro('carregar check-list', error)
  if (data) return data;
  return veiculoId ? BD.checklists.filter(c => c.veiculo_id === veiculoId) : BD.checklists;
}

// ==================================================
// 📞 CHAMADOS
// ==================================================
export async function abrirChamado(dados) {
  const { data, error } = await supabase.from('chamados').insert([dados]).select()
  tratarErro('abrir chamado', error)
  if (data?.[0]) return data[0];
  BD.chamados.push(dados);
  salvarDados();
  return dados;
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
  if (data) return data;
  let lista = BD.chamados;
  if (filtro === 'abertos') lista = lista.filter(c => c.status === 'aberto');
  return lista;
}

export async function atualizarStatusChamado(id, status, observacao = null) {
  const dados = { status }
  if (status === 'em_andamento') dados.data_atendimento = new Date()
  if (status === 'resolvido' || status === 'fechado') {
    dados.data_fechamento = new Date()
    if (observacao) dados.solucao = observacao
  }

  const { error } = await supabase.from('chamados').update(dados).eq('id', id)
  if (!error) return true;
  // Fallback local
  const idx = BD.chamados.findIndex(c => c.id === id);
  if (idx >= 0) { BD.chamados[idx] = { ...BD.chamados[idx], ...dados }; salvarDados(); return true; }
  return false;
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
  if (data) return data;
  return veiculoId ? BD.gastos.filter(g => g.veiculo_id === veiculoId) : BD.gastos;
}

export async function salvarGasto(dados) {
  const { data, error } = await supabase.from('gastos').insert([dados]).select()
  tratarErro('salvar gasto', error)
  if (data?.[0]) return data[0];
  BD.gastos.push(dados);
  salvarDados();
  return dados;
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
  if (data) return data;
  return veiculoId ? BD.manutencoes.filter(m => m.veiculo_id === veiculoId) : BD.manutencoes;
}

export async function salvarManutencao(dados) {
  const { data, error } = await supabase.from('manutencoes').insert([dados]).select()
  tratarErro('salvar manutenção', error)
  if (data?.[0]) return data[0];
  BD.manutencoes.push(dados);
  salvarDados();
  return dados;
}

export async function atualizarStatusManutencao(id, status, dados = {}) {
  const { error } = await supabase.from('manutencoes').update({ status, ...dados }).eq('id', id)
  if (!error) return true;
  // Fallback local
  const idx = BD.manutencoes.findIndex(m => m.id === id);
  if (idx >= 0) { BD.manutencoes[idx] = { ...BD.manutencoes[idx], status, ...dados }; salvarDados(); return true; }
  return false;
}

// ==================================================
// ✅ EXPORTAÇÕES E DISPONIBILIZAÇÃO GLOBAL
// ==================================================
window.BD = BD;
window.salvarDados = salvarDados;
window.sincronizarBD = sincronizarBD;

export { BD, salvarDados, sincronizarBD };