// ============================================================
// 💾 BANCO DE DADOS LOCAL - VERSÃO ROBUSTA
// ✅ Chave única: 'bd_frotas'
// ✅ SEMPRE carrega dados de demonstração se localStorage estiver vazio
// ✅ Dados de demonstração usam datas ATUAIS (para aparecer no mês corrente)
// ============================================================

const BD_CHAVE_LOCALSTORAGE = 'bd_frotas';

function inicializarBD() {
    console.log('💾 [BD] Inicializando banco de dados...');
    
    // Flag global: se true, NÃO cria dados de demonstração
    // O sync.js vai setar isso quando for buscar do Supabase
    if (window._NAO_CRIAR_DEMONSTRACAO) {
        console.log('ℹ️ [BD] Modo sincronização ativo - aguardando dados do Supabase...');
        window.BD = completarEstruturaBD({});
        return window.BD;
    }
    
    try {
        // Tenta carregar dados salvos
        const dadosSalvos = localStorage.getItem(BD_CHAVE_LOCALSTORAGE);
        
        if (dadosSalvos) {
            try {
                const bdParseado = JSON.parse(dadosSalvos);
                window.BD = completarEstruturaBD(bdParseado);
                
                // Se não tem veículos, recarrega demonstração
                if (!window.BD.veiculos || window.BD.veiculos.length === 0) {
                    console.log('ℹ️ [BD] LocalStorage vazio, carregando demonstração...');
                    window.BD = criarDadosDemonstracao();
                    salvarDados();
                } else {
                    console.log(`✅ [BD] Carregado do localStorage: ${window.BD.veiculos.length} veículos, ${window.BD.gastos.length} gastos`);
                }
                
                return window.BD;
                
            } catch (e) {
                console.error('❌ [BD] localStorage corrompido, recriando:', e.message);
            }
        }
    } catch (e) {
        console.error('❌ [BD] Erro ao acessar localStorage:', e);
    }
    
    // Se chegou aqui, cria dados de demonstração
    console.log('ℹ️ [BD] Criando dados de demonstração...');
    window.BD = criarDadosDemonstracao();
    salvarDados();
    console.log(`✅ [BD] Demonstração criada: ${window.BD.veiculos.length} veículos`);
    
    return window.BD;
}

function completarEstruturaBD(bd) {
    if (!bd) bd = {};
    return {
        locais: bd.locais || [
            { id: 'patio-metalica', nome: 'Pátio Metálica' },
            { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' },
            { id: 'obra', nome: 'Obra' }
        ],
        veiculos: bd.veiculos || [],
        checklists: bd.checklists || [],
        manutencoes: bd.manutencoes || [],
        gastos: bd.gastos || [],
        chamados: bd.chamados || [],
        alocacoes: bd.alocacoes || [],
        usuarios: bd.usuarios || [
            { nome: 'Administrador', usuario: 'admin', senha: 'admin123', perfil: 'admin', ativo: true },
            { nome: 'Operador', usuario: 'operador', senha: '1234', perfil: 'operacional', ativo: true }
        ],
        despesasViagem: bd.despesasViagem || [],
        adiantamentos: bd.adiantamentos || [],
        gastosViagem: bd.gastosViagem || [],
        historicoCondutores: bd.historicoCondutores || [],
        solicitacoesTransferencia: bd.solicitacoesTransferencia || [],
        origens: bd.origens || ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
        destinos: bd.destinos || ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
        obras: bd.obras || ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
        config: bd.config || {},
        log: bd.log || []
    };
}

function criarDadosDemonstracao() {
    // Usa o mês e ano ATUAIS para os gastos aparecerem no dashboard
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dataAtual = `${ano}-${mes}`;
    
    return {
        locais: [
            { id: 'patio-metalica', nome: 'Pátio Metálica' },
            { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' },
            { id: 'obra', nome: 'Obra' }
        ],
        veiculos: [
            { id: 1, placa: 'ABC1234', categoria: 'Caminhão', marca: 'Volvo', modelo: 'FH 540', ano: 2022, km_atual: 85000, obra_atual: 'Pátio Metálica', status: 'disponivel', responsavel: 'João Silva', data_cadastro: '2024-01-15' },
            { id: 2, placa: 'DEF5678', categoria: 'Carro Passeio', marca: 'Ford', modelo: 'Ranger', ano: 2023, km_atual: 32000, obra_atual: 'Obra', status: 'disponivel', responsavel: 'Maria Santos', data_cadastro: '2024-02-20' },
            { id: 3, placa: 'GHI9012', categoria: 'Utilitário', marca: 'Toyota', modelo: 'Hilux', ano: 2021, km_atual: 120000, obra_atual: 'Pátio Usina Conc.', status: 'manutencao', responsavel: 'Pedro Costa', data_cadastro: '2023-06-10' },
            { id: 4, placa: 'JKL3456', categoria: 'Máquina', marca: 'Caterpillar', modelo: 'Escavadeira 320', ano: 2020, km_atual: 5400, obra_atual: 'Obra', status: 'alocado', responsavel: 'Carlos Lima', data_cadastro: '2023-03-05' }
        ],
        checklists: [],
        manutencoes: [
            { id: 1, veiculoId: 3, tipo: 'corretiva', descricao: 'Troca de pastilhas de freio dianteiras', data: `${dataAtual}-10`, valor: 850, status: 'Concluída' },
            { id: 2, veiculoId: 1, tipo: 'preventiva', descricao: 'Revisão completa - troca de óleo e filtros', data: `${dataAtual}-15`, valor: 1200, status: 'Pendente', proximaRevisaoKm: 90000 }
        ],
        gastos: [
            { id: 1, veiculoId: 1, tipo: 'Combustível', data: `${dataAtual}-12`, valor: 1800, obra: 'Pátio Metálica' },
            { id: 2, veiculoId: 2, tipo: 'Combustível', data: `${dataAtual}-13`, valor: 450, obra: 'Obra' },
            { id: 3, veiculoId: 3, tipo: 'Manutenção', data: `${dataAtual}-10`, valor: 850, obra: 'Pátio Usina Conc.' },
            { id: 4, veiculoId: 1, tipo: 'Peças', data: `${dataAtual}-05`, valor: 1200, obra: 'Pátio Metálica' },
            { id: 5, veiculoId: 4, tipo: 'Combustível', data: `${dataAtual}-14`, valor: 3200, obra: 'Obra' },
            { id: 6, veiculoId: 2, tipo: 'Seguro', data: `${dataAtual}-01`, valor: 4500, obra: '' },
            { id: 7, veiculoId: 1, tipo: 'IPVA', data: `${ano}-01-10`, valor: 2800, obra: '' },
            { id: 8, veiculoId: 3, tipo: 'Pneus', data: `${ano}-06-15`, valor: 3500, obra: 'Pátio Usina Conc.' },
            { id: 9, veiculoId: 1, tipo: 'Pedágio', data: `${dataAtual}-11`, valor: 180, obra: '' },
            { id: 10, veiculoId: 2, tipo: 'Multas', data: `${ano}-07-20`, valor: 350, obra: '' },
            { id: 11, veiculoId: 4, tipo: 'Serviços', data: `${dataAtual}-01`, valor: 2500, obra: 'Obra' },
            { id: 12, veiculoId: 1, tipo: 'Outros', data: `${dataAtual}-08`, valor: 250, obra: '' }
        ],
        chamados: [
            { id: 1, veiculoId: 3, titulo: 'Ruído estranho no freio dianteiro', descricao: 'Motorista relata barulho metálico ao frear', prioridade: 'Alta', status: 'Em Andamento', data: `${dataAtual}-14`, relator: 'João Silva' }
        ],
        alocacoes: [
            { id: 1, veiculoId: 4, motorista: 'Carlos Lima', origem: 'Pátio Metálica', destino: 'Obra', dataSaida: `${dataAtual}-10`, kmSaida: 5200, status: 'Ativa', criadoPor: 'Administrador' }
        ],
        usuarios: [
            { nome: 'Administrador', usuario: 'admin', senha: 'admin123', perfil: 'admin', ativo: true },
            { nome: 'Operador', usuario: 'operador', senha: '1234', perfil: 'operacional', ativo: true },
            { nome: 'João Silva', usuario: 'joao', senha: '1234', perfil: 'motorista', ativo: true },
            { nome: 'Maria Santos', usuario: 'maria', senha: '1234', perfil: 'motorista', ativo: true }
        ],
        despesasViagem: [],
        adiantamentos: [],
        gastosViagem: [],
        historicoCondutores: [],
        solicitacoesTransferencia: [],
        origens: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
        destinos: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
        obras: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
        config: {},
        log: []
    };
}

function salvarDados() {
    try {
        if (!window.BD) {
            console.warn('⚠️ [BD] window.BD não existe, criando novo...');
            inicializarBD();
            return;
        }
        localStorage.setItem(BD_CHAVE_LOCALSTORAGE, JSON.stringify(window.BD));
        
        // 🔄 Sincroniza com o Supabase em segundo plano
        // Só envia se NÃO acabamos de receber dados do Supabase
        if (typeof sincronizarLocalParaSupabase === 'function' && typeof supabasePronto === 'function') {
            if (supabasePronto()) {
                // Usa setTimeout para não travar a interface
                setTimeout(() => {
                    // Verifica flag de proteção contra loops
                    if (window._ultimaSincronizacaoSupabase && 
                        Date.now() - window._ultimaSincronizacaoSupabase < 2000) {
                        console.log('ℹ️ [BD] Dados recentes do Supabase - pulando envio');
                        return;
                    }
                    sincronizarLocalParaSupabase().catch(err => {
                        console.warn('⚠️ [BD] Erro ao sincronizar com Supabase:', err);
                    });
                }, 100);
            }
        }
    } catch (e) {
        console.error('❌ [BD] Erro ao salvar:', e);
    }
}

function carregarDadosLocais() {
    return new Promise((resolve) => {
        inicializarBD();
        resolve(window.BD);
    });
}

function carregarDadosDemonstracao() {
    console.log('🔄 [BD] Recarregando dados de demonstração...');
    window.BD = criarDadosDemonstracao();
    salvarDados();
    console.log('✅ [BD] Demonstração recarregada!');
    return window.BD;
}

// Expõe globalmente
window.BD_CHAVE_LOCALSTORAGE = BD_CHAVE_LOCALSTORAGE;
window.inicializarBD = inicializarBD;
window.salvarDados = salvarDados;
window.carregarDadosLocais = carregarDadosLocais;
window.carregarDadosDemonstracao = carregarDadosDemonstracao;

// 🔥 INICIALIZA IMEDIATAMENTE (garante que window.BD exista)
inicializarBD();

console.log('✅ js/banco-dados.js carregado - BD inicializado');
