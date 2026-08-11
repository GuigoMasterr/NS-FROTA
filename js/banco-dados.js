import { supabase } from './supabase.js'

// ==================================================
// 💾 BANCO DE DADOS LOCAL
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

export function salvarDados() {
    try {
        localStorage.setItem('bd_frotas', JSON.stringify(BD));
    } catch (e) {
        console.warn('Não foi possível salvar dados locais:', e);
    }
}

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
        console.log('✅ BD sincronizado');
    } catch (erro) {
        console.warn('⚠️ Usando dados locais:', erro);
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
    .from('usuarios').select('*').eq('usuario', usuario).eq('senha', senha).eq('ativo', true).single()
  if (!error && data) return data;
  const { LOGIN } = await import('./config.js').catch(() => ({ LOGIN: null }));
  if (LOGIN) {
    if (usuario === LOGIN.ADMIN.usuario && senha === LOGIN.ADMIN.senha) return LOGIN.ADMIN;
    if (usuario === LOGIN.MOTORISTA.usuario && senha === LOGIN.MOTORISTA.senha) return LOGIN.MOTORISTA;
  }
  return null;
}

// ==================================================
// 🚗 VEÍCULOS
// ==================================================
export async function obterVeiculos() {
  const { data, error } = await supabase.from('veiculos').select('*').order('placa')
  tratarErro('carregar veículos', error)
  return data || BD.veiculos
}

export async function obterVeiculoPorPlaca(placa) {
  const { data, error } = await supabase.from('veiculos').select('*').eq('placa', placa).single()
  return error ? BD.veiculos.find(v => v.placa === placa) || null : data
}

export async function salvarVeiculo(dados) {
  const { data, error } = await supabase.from('veiculos').upsert([dados], { onConflict: 'placa' }).select()
  tratarErro('salvar veículo', error)
  if (data?.[0]) return data[0];
  const idx = BD.veiculos.findIndex(v => v.placa === dados.placa);
  if (idx >= 0) BD.veiculos[idx] = dados;
  else BD.veiculos.push(dados);
  salvarDados();
  return dados;
}

// ==================================================
// ✅ CHECK-LIST / OUTRAS FUNÇÕES
// ==================================================
export async function obterChecklists() { return [] }
export async function salvarChecklist(dados) { BD.checklists.push(dados); salvarDados(); return dados; }
export async function obterAlocacoes() { return BD.alocacoes }
export async function salvarAlocacao(dados) { BD.alocacoes.push(dados); salvarDados(); return dados; }
export async function obterGastos() { return BD.gastos }
export async function salvarGasto(dados) { BD.gastos.push(dados); salvarDados(); return dados; }
export async function obterManutencoes() { return BD.manutencoes }
export async function salvarManutencao(dados) { BD.manutencoes.push(dados); salvarDados(); return dados; }
export async function obterChamados() { return BD.chamados }
export async function abrirChamado(dados) { BD.chamados.push(dados); salvarDados(); return dados; }

// ==================================================
// ✅ DISPONIBILIZA GLOBALMENTE + EXPORTA (SÓ 1 VEZ!)
// ==================================================
window.BD = BD;
window.salvarDados = salvarDados;
window.sincronizarBD = sincronizarBD;

export { BD, salvarDados, sincronizarBD };