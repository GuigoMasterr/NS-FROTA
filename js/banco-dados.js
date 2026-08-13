// ==================================================
// 💾 BANCO DE DADOS - Supabase + Local Storage
// ==================================================

// Usa o supabase global (injetado no HTML ou definido em supabase.js)
const supabaseDB = window.supabase || null;

// Estrutura do banco de dados local
let BD = {
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
    usuarios: [],
    despesasViagem: [],
    origens: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
    destinos: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
    obras: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra']
};

// Dados de demonstração
const DADOS_DEMONSTRACAO = {
    veiculos: [
        { id: 1, placa: 'ABC-1234', categoria: 'caminhao', modelo: 'Volvo FH 540', marca: 'Volvo', ano: 2022, km_atual: 85000, km_inicial: 10000, status: 'disponivel', obra_atual: 'Pátio Metálica', responsavel: 'João Silva', data_cadastro: '2024-01-15', proxima_revisao_km: 100000, seguro_vencimento: '2026-08-20' },
        { id: 2, placa: 'DEF-5678', categoria: 'utilitario', modelo: 'Ford Ranger', marca: 'Ford', ano: 2023, km_atual: 42000, km_inicial: 5000, status: 'disponivel', obra_atual: 'Obra', responsavel: 'Pedro Santos', data_cadastro: '2024-03-20', proxima_revisao_km: 50000, seguro_vencimento: '2026-12-15' },
        { id: 3, placa: 'GHI-9012', categoria: 'carro', modelo: 'Toyota Hilux', marca: 'Toyota', ano: 2021, km_atual: 122000, km_inicial: 100000, status: 'manutencao', obra_atual: 'Pátio Usina Conc.', responsavel: 'Maria Oliveira', data_cadastro: '2023-06-10', proxima_revisao_km: 100000, seguro_vencimento: '2026-08-20' },
        { id: 4, placa: 'JKL-3456', categoria: 'maquina', modelo: 'Escavadeira CAT 320', marca: 'CAT', ano: 2020, km_atual: 8500, km_inicial: 1000, status: 'alocado', obra_atual: 'Obra', responsavel: 'Carlos Lima', data_cadastro: '2023-02-28', proxima_revisao_km: 10000, seguro_vencimento: '2027-03-10' }
    ],
    gastos: [
        { id: 1, data: '2026-03-15', veiculoId: 1, tipo: 'Combustível', obra: 'Pátio Metálica', valor: 2800.00, observacao: 'Abastecimento diesel', lancadoPor: 'Administrador' },
        { id: 2, data: '2026-03-22', veiculoId: 2, tipo: 'Manutenção', obra: 'Obra', valor: 1200.00, observacao: 'Troca de óleo e filtros', lancadoPor: 'Administrador' },
        { id: 3, data: '2026-04-10', veiculoId: 1, tipo: 'Combustível', obra: 'Pátio Metálica', valor: 3100.00, observacao: 'Abastecimento diesel', lancadoPor: 'Administrador' },
        { id: 4, data: '2026-04-18', veiculoId: 3, tipo: 'Pedágio', obra: 'Obra', valor: 350.00, observacao: 'Viagem para obra', lancadoPor: 'Administrador' },
        { id: 5, data: '2026-05-05', veiculoId: 1, tipo: 'Combustível', obra: 'Pátio Metálica', valor: 2950.00, observacao: 'Abastecimento', lancadoPor: 'Administrador' },
        { id: 6, data: '2026-05-20', veiculoId: 4, tipo: 'Manutenção', obra: 'Obra', valor: 4500.00, observacao: 'Revisão hidráulica', lancadoPor: 'Administrador' },
        { id: 7, data: '2026-06-08', veiculoId: 2, tipo: 'Combustível', obra: 'Pátio Usina Conc.', valor: 1800.00, observacao: 'Abastecimento', lancadoPor: 'Administrador' },
        { id: 8, data: '2026-06-25', veiculoId: 1, tipo: 'Seguro', obra: 'Pátio Metálica', valor: 8500.00, observacao: 'Seguro anual', lancadoPor: 'Administrador' },
        { id: 9, data: '2026-07-12', veiculoId: 3, tipo: 'Combustível', obra: 'Obra', valor: 2200.00, observacao: 'Abastecimento', lancadoPor: 'Administrador' },
        { id: 10, data: '2026-07-28', veiculoId: 2, tipo: 'Pneus', obra: 'Pátio Usina Conc.', valor: 3200.00, observacao: 'Jogo de pneus novo', lancadoPor: 'Administrador' },
        { id: 11, data: '2026-08-05', veiculoId: 1, tipo: 'Combustível', obra: 'Pátio Metálica', valor: 3050.00, observacao: 'Abastecimento', lancadoPor: 'Administrador' },
        { id: 12, data: '2026-08-10', veiculoId: 4, tipo: 'Combustível', obra: 'Obra', valor: 1634.00, observacao: 'Diesel', lancadoPor: 'Administrador' }
    ],
    manutencoes: [
        { id: 1, veiculoId: 3, tipo: 'corretiva', servico: 'Troca de pastilhas de freio', dataPrevista: '2026-08-01', kmPrevisto: 120000, custo: 1800.00, status: 'Concluída', criadoPor: 'Administrador' },
        { id: 2, veiculoId: 1, tipo: 'preventiva', servico: 'Revisão geral', dataPrevista: '2026-09-15', kmPrevisto: 100000, intervaloKm: 20000, intervaloDias: 180, custo: 3500.00, status: 'Pendente', criadoPor: 'Administrador' }
    ],
    chamados: [
        { id: 1, veiculoId: 3, tipo: 'Problema Mecânico', obra: 'Pátio Usina Conc.', km: 122000, descricao: 'Ruído estranho no freio dianteiro', status: 'Em Andamento', responsavel: 'Maria Oliveira', data: '2026-08-10T10:30:00' }
    ],
    usuarios: [
        { id: 1, nome: 'Administrador', usuario: 'admin', senha: 'admin123', perfil: 'admin', ativo: true },
        { id: 2, nome: 'Operador', usuario: 'operador', senha: '1234', perfil: 'operador', ativo: true },
        { id: 3, nome: 'João Silva', usuario: 'joao', senha: '123456', perfil: 'operacional', ativo: true },
        { id: 4, nome: 'Maria Oliveira', usuario: 'maria', senha: '123456', perfil: 'operacional', ativo: true }
    ]
};

// ==================================================
// 💾 FUNÇÕES DE PERSISTÊNCIA LOCAL
// ==================================================
function salvarDados() {
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
            return true;
        }
    } catch (e) {
        console.warn('Erro ao carregar dados locais:', e);
    }
    return false;
}

function carregarDadosDemonstracao() {
    BD.veiculos = [...DADOS_DEMONSTRACAO.veiculos];
    BD.gastos = [...DADOS_DEMONSTRACAO.gastos];
    BD.manutencoes = [...DADOS_DEMONSTRACAO.manutencoes];
    BD.chamados = [...DADOS_DEMONSTRACAO.chamados];
    BD.usuarios = [...DADOS_DEMONSTRACAO.usuarios];
    salvarDados();
    console.log('✅ Dados de demonstração carregados');
}

// ==================================================
// 🔄 SINCRONIZAÇÃO COM SUPABASE
// ==================================================
async function sincronizarBD() {
    try {
        if (!supabaseDB || !supabaseDB.temConexaoReal) {
            console.log('ℹ️ Supabase não conectado, usando dados locais');
            const temDadosLocais = await carregarDadosLocais();
            if (!temDadosLocais) {
                carregarDadosDemonstracao();
            }
            return;
        }

        // Tenta buscar do Supabase
        const resultados = await Promise.allSettled([
            obterLocais(),
            obterVeiculos(),
            obterChecklists(),
            obterManutencoes(),
            obterGastos(),
            obterChamados(),
            obterAlocacoes(),
            obterUsuarios()
        ]);

        const [locais, veiculos, checklists, manutencoes, gastos, chamados, alocacoes, usuarios] = resultados.map(r => r.status === 'fulfilled' ? r.value : []);

        if (locais && locais.length > 0) BD.locais = locais;
        if (veiculos && veiculos.length > 0) BD.veiculos = veiculos;
        if (checklists) BD.checklists = checklists;
        if (manutencoes) BD.manutencoes = manutencoes;
        if (gastos) BD.gastos = gastos;
        if (chamados) BD.chamados = chamados;
        if (alocacoes) BD.alocacoes = alocacoes;
        if (usuarios && usuarios.length > 0) BD.usuarios = usuarios;

        // Se o Supabase estiver vazio, carrega dados de demo
        if (BD.veiculos.length === 0) {
            carregarDadosDemonstracao();
        } else {
            salvarDados();
        }
        
        console.log('✅ BD sincronizado');
    } catch (erro) {
        console.warn('⚠️ Usando dados locais:', erro);
        const temDadosLocais = await carregarDadosLocais();
        if (!temDadosLocais) {
            carregarDadosDemonstracao();
        }
    }
}

// ==================================================
// 🔧 FUNÇÕES AUXILIARES
// ==================================================
function tratarErro(acao, erro) {
    if (erro && erro.message !== 'Modo local - Supabase não conectado') {
        console.error(`❌ Erro ${acao}:`, erro);
    }
    return erro ? null : true;
}

function atualizarListasDependentes() {
    if (BD.locais && BD.locais.length) {
        const nomes = BD.locais.map(l => l.nome);
        BD.origens = nomes;
        BD.destinos = nomes;
        BD.obras = nomes;
    }
}

// ==================================================
// 📍 LOCAIS
// ==================================================
async function obterLocais() {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('locais').select('*').order('nome');
            if (!error && data && data.length > 0) return data;
        } catch (e) { /* fallback local */ }
    }
    return BD.locais;
}

async function salvarLocal(local) {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('locais').upsert([local], { onConflict: 'nome' }).select();
            if (!error && data?.[0]) return data[0];
        } catch (e) { /* fallback local */ }
    }
    const idx = BD.locais.findIndex(l => l.id === local.id);
    if (idx >= 0) BD.locais[idx] = local;
    else BD.locais.push(local);
    atualizarListasDependentes();
    salvarDados();
    return local;
}

// ==================================================
// 👤 USUÁRIOS
// ==================================================
async function obterUsuarios() {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('usuarios').select('*').order('nome');
            if (!error && data && data.length > 0) return data;
        } catch (e) { /* fallback local */ }
    }
    return BD.usuarios;
}

async function autenticarUsuario(usuario, senha) {
    // Primeiro tenta Supabase
    if (supabaseDB && supabaseDB.temConexaoReal) {
        try {
            const { data, error } = await supabaseDB
                .from('usuarios').select('*').eq('usuario', usuario).eq('senha', senha).eq('ativo', true).single();
            if (!error && data) return data;
        } catch (e) { /* continua para fallback */ }
    }
    
    // Fallback: usuários locais
    const usuarioLocal = BD.usuarios.find(u => u.usuario === usuario && u.senha === senha && u.ativo !== false);
    if (usuarioLocal) return usuarioLocal;
    
    // Fallback: credenciais padrão do config
    const CONFIG = window.CONFIG;
    if (CONFIG && CONFIG.LOGIN) {
        if (usuario === CONFIG.LOGIN.ADMIN.usuario && senha === CONFIG.LOGIN.ADMIN.senha) return CONFIG.LOGIN.ADMIN;
        if (usuario === CONFIG.LOGIN.MOTORISTA.usuario && senha === CONFIG.LOGIN.MOTORISTA.senha) return CONFIG.LOGIN.MOTORISTA;
    }
    
    return null;
}

async function salvarUsuario(dados) {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('usuarios').upsert([dados]).select();
            if (!error && data?.[0]) return data[0];
        } catch (e) { /* fallback local */ }
    }
    if (dados.id) {
        const idx = BD.usuarios.findIndex(u => String(u.id) === String(dados.id));
        if (idx >= 0) BD.usuarios[idx] = dados;
        else BD.usuarios.push(dados);
    } else {
        dados.id = BD.usuarios.length + 1;
        BD.usuarios.push(dados);
    }
    salvarDados();
    return dados;
}

async function excluirUsuario(id) {
    if (supabaseDB) {
        try {
            await supabaseDB.from('usuarios').delete().eq('id', id);
        } catch (e) { /* fallback local */ }
    }
    BD.usuarios = BD.usuarios.filter(u => String(u.id) !== String(id));
    salvarDados();
}

// ==================================================
// 🚗 VEÍCULOS
// ==================================================
async function obterVeiculos() {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('veiculos').select('*').order('placa');
            if (!error && data) return data;
        } catch (e) { /* fallback local */ }
    }
    return BD.veiculos;
}

async function obterVeiculoPorPlaca(placa) {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('veiculos').select('*').eq('placa', placa).single();
            if (!error && data) return data;
        } catch (e) { /* fallback local */ }
    }
    return BD.veiculos.find(v => v.placa === placa) || null;
}

async function salvarVeiculo(dados) {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('veiculos').upsert([dados], { onConflict: 'placa' }).select();
            if (!error && data?.[0]) return data[0];
        } catch (e) { /* fallback local */ }
    }
    if (dados.id) {
        const idx = BD.veiculos.findIndex(v => String(v.id) === String(dados.id));
        if (idx >= 0) BD.veiculos[idx] = dados;
        else BD.veiculos.push(dados);
    } else {
        dados.id = BD.veiculos.length > 0 ? Math.max(...BD.veiculos.map(v => v.id || 0)) + 1 : 1;
        BD.veiculos.push(dados);
    }
    salvarDados();
    return dados;
}

async function excluirVeiculoBD(id) {
    if (supabaseDB) {
        try {
            await supabaseDB.from('veiculos').delete().eq('id', id);
        } catch (e) { /* fallback local */ }
    }
    BD.veiculos = BD.veiculos.filter(v => String(v.id) !== String(id) && String(v.placa) !== String(id));
    salvarDados();
}

// ==================================================
// ✅ CHECK-LIST
// ==================================================
async function obterChecklists() {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('checklists').select('*').order('data', { ascending: false });
            if (!error && data) return data;
        } catch (e) { /* fallback local */ }
    }
    return BD.checklists;
}

async function salvarChecklist(dados) {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('checklists').insert([dados]).select();
            if (!error && data?.[0]) return data[0];
        } catch (e) { /* fallback local */ }
    }
    if (!dados.id) dados.id = (BD.checklists.length > 0 ? Math.max(...BD.checklists.map(c => c.id || 0)) + 1 : 1);
    BD.checklists.push(dados);
    salvarDados();
    return dados;
}

// ==================================================
// 🔧 MANUTENÇÃO
// ==================================================
async function obterManutencoes() {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('manutencoes').select('*').order('dataPrevista', { ascending: false });
            if (!error && data) return data;
        } catch (e) { /* fallback local */ }
    }
    return BD.manutencoes;
}

async function salvarManutencao(dados) {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('manutencoes').upsert([dados]).select();
            if (!error && data?.[0]) return data[0];
        } catch (e) { /* fallback local */ }
    }
    if (dados.id) {
        const idx = BD.manutencoes.findIndex(m => String(m.id) === String(dados.id));
        if (idx >= 0) BD.manutencoes[idx] = dados;
        else BD.manutencoes.push(dados);
    } else {
        dados.id = BD.manutencoes.length > 0 ? Math.max(...BD.manutencoes.map(m => m.id || 0)) + 1 : 1;
        BD.manutencoes.push(dados);
    }
    salvarDados();
    return dados;
}

async function excluirManutencaoBD(id) {
    if (supabaseDB) {
        try {
            await supabaseDB.from('manutencoes').delete().eq('id', id);
        } catch (e) { /* fallback local */ }
    }
    BD.manutencoes = BD.manutencoes.filter(m => String(m.id) !== String(id));
    salvarDados();
}

// ==================================================
// 💰 GASTOS
// ==================================================
async function obterGastos() {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('gastos').select('*').order('data', { ascending: false });
            if (!error && data) return data;
        } catch (e) { /* fallback local */ }
    }
    return BD.gastos;
}

async function salvarGasto(dados) {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('gastos').upsert([dados]).select();
            if (!error && data?.[0]) return data[0];
        } catch (e) { /* fallback local */ }
    }
    if (dados.id) {
        const idx = BD.gastos.findIndex(g => String(g.id) === String(dados.id));
        if (idx >= 0) BD.gastos[idx] = dados;
        else BD.gastos.push(dados);
    } else {
        dados.id = BD.gastos.length > 0 ? Math.max(...BD.gastos.map(g => g.id || 0)) + 1 : 1;
        BD.gastos.push(dados);
    }
    salvarDados();
    return dados;
}

async function excluirGastoBD(id) {
    if (supabaseDB) {
        try {
            await supabaseDB.from('gastos').delete().eq('id', id);
        } catch (e) { /* fallback local */ }
    }
    BD.gastos = BD.gastos.filter(g => String(g.id) !== String(id));
    salvarDados();
}

// ==================================================
// 🚨 CHAMADOS
// ==================================================
async function obterChamados() {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('chamados').select('*').order('data', { ascending: false });
            if (!error && data) return data;
        } catch (e) { /* fallback local */ }
    }
    return BD.chamados;
}

async function abrirChamado(dados) {
    return salvarChamado(dados);
}

async function salvarChamado(dados) {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('chamados').upsert([dados]).select();
            if (!error && data?.[0]) return data[0];
        } catch (e) { /* fallback local */ }
    }
    if (dados.id) {
        const idx = BD.chamados.findIndex(c => String(c.id) === String(dados.id));
        if (idx >= 0) BD.chamados[idx] = dados;
        else BD.chamados.push(dados);
    } else {
        dados.id = BD.chamados.length > 0 ? Math.max(...BD.chamados.map(c => c.id || 0)) + 1 : 1;
        BD.chamados.push(dados);
    }
    salvarDados();
    return dados;
}

async function excluirChamadoBD(id) {
    if (supabaseDB) {
        try {
            await supabaseDB.from('chamados').delete().eq('id', id);
        } catch (e) { /* fallback local */ }
    }
    BD.chamados = BD.chamados.filter(c => String(c.id) !== String(id));
    salvarDados();
}

// ==================================================
// 🚛 ALOCAÇÕES
// ==================================================
async function obterAlocacoes() {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('alocacoes').select('*').order('dataSaida', { ascending: false });
            if (!error && data) return data;
        } catch (e) { /* fallback local */ }
    }
    return BD.alocacoes;
}

async function salvarAlocacao(dados) {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('alocacoes').upsert([dados]).select();
            if (!error && data?.[0]) return data[0];
        } catch (e) { /* fallback local */ }
    }
    if (dados.id) {
        const idx = BD.alocacoes.findIndex(a => String(a.id) === String(dados.id));
        if (idx >= 0) BD.alocacoes[idx] = dados;
        else BD.alocacoes.push(dados);
    } else {
        dados.id = BD.alocacoes.length > 0 ? Math.max(...BD.alocacoes.map(a => a.id || 0)) + 1 : 1;
        BD.alocacoes.push(dados);
    }
    salvarDados();
    return dados;
}

// ==================================================
// 💸 DESPESAS DE VIAGEM
// ==================================================
async function obterDespesasViagem() {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('despesas_viagem').select('*').order('data', { ascending: false });
            if (!error && data) return data;
        } catch (e) { /* fallback local */ }
    }
    return BD.despesasViagem || [];
}

async function salvarDespesaViagem(dados) {
    if (supabaseDB) {
        try {
            const { data, error } = await supabaseDB.from('despesas_viagem').upsert([dados]).select();
            if (!error && data?.[0]) return data[0];
        } catch (e) { /* fallback local */ }
    }
    if (!BD.despesasViagem) BD.despesasViagem = [];
    if (dados.id) {
        const idx = BD.despesasViagem.findIndex(d => String(d.id) === String(dados.id));
        if (idx >= 0) BD.despesasViagem[idx] = dados;
        else BD.despesasViagem.push(dados);
    } else {
        dados.id = BD.despesasViagem.length > 0 ? Math.max(...BD.despesasViagem.map(d => d.id || 0)) + 1 : 1;
        BD.despesasViagem.push(dados);
    }
    salvarDados();
    return dados;
}

// ==================================================
// ✅ DISPONIBILIZA TUDO GLOBALMENTE
// ==================================================
window.BD = BD;
window.salvarDados = salvarDados;
window.sincronizarBD = sincronizarBD;
window.carregarDadosDemonstracao = carregarDadosDemonstracao;
window.atualizarListasDependentes = atualizarListasDependentes;

// Funções de locais
window.obterLocais = obterLocais;
window.salvarLocal = salvarLocal;

// Funções de usuários
window.obterUsuarios = obterUsuarios;
window.autenticarUsuario = autenticarUsuario;
window.salvarUsuario = salvarUsuario;
window.excluirUsuario = excluirUsuario;

// Funções de veículos
window.obterVeiculos = obterVeiculos;
window.obterVeiculoPorPlaca = obterVeiculoPorPlaca;
window.salvarVeiculo = salvarVeiculo;
window.excluirVeiculoBD = excluirVeiculoBD;

// Funções de check-list
window.obterChecklists = obterChecklists;
window.salvarChecklist = salvarChecklist;

// Funções de manutenção
window.obterManutencoes = obterManutencoes;
window.salvarManutencao = salvarManutencao;
window.excluirManutencaoBD = excluirManutencaoBD;

// Funções de gastos
window.obterGastos = obterGastos;
window.salvarGasto = salvarGasto;
window.excluirGastoBD = excluirGastoBD;

// Funções de chamados
window.obterChamados = obterChamados;
window.abrirChamado = abrirChamado;
window.salvarChamado = salvarChamado;
window.excluirChamadoBD = excluirChamadoBD;

// Funções de alocações
window.obterAlocacoes = obterAlocacoes;
window.salvarAlocacao = salvarAlocacao;

// Funções de despesas de viagem
window.obterDespesasViagem = obterDespesasViagem;
window.salvarDespesaViagem = salvarDespesaViagem;

// Inicialização
atualizarListasDependentes();

// Carrega dados ao iniciar
(async () => {
    await sincronizarBD();
    atualizarListasDependentes();
})();