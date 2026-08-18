// ============================================================
// 💾 BANCO DE DADOS LOCAL - UNIFICADO E CORRIGIDO
// ✅ Chave única: 'bd_frotas'
// ✅ Dados de demonstração carregam se não houver dados salvos
// ✅ window.BD é criado e mantido consistentemente
// ============================================================

// Chave ÚNICA do localStorage (todos os arquivos devem usar esta!)
const BD_CHAVE_LOCALSTORAGE = 'bd_frotas';

function inicializarBD() {
    try {
        // Tenta carregar dados salvos
        const dadosSalvos = localStorage.getItem(BD_CHAVE_LOCALSTORAGE);
        if (dadosSalvos) {
            const bdParseado = JSON.parse(dadosSalvos);
            // Garante que todas as propriedades existam
            window.BD = completarEstruturaBD(bdParseado);
            console.log('💾 BD carregado do localStorage com', window.BD.veiculos.length, 'veículos');
            return window.BD;
        }
    } catch (e) {
        console.error('❌ Erro ao carregar BD do localStorage:', e);
    }
    
    // Se não há dados salvos, cria com dados de demonstração
    console.log('ℹ️ Nenhum dado salvo. Criando BD com dados de demonstração...');
    window.BD = criarDadosDemonstracao();
    salvarDados();
    return window.BD;
}

function completarEstruturaBD(bd) {
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
            { id: 1, veiculoId: 3, tipo: 'corretiva', descricao: 'Troca de pastilhas de freio dianteiras', data: '2024-08-10', valor: 850, status: 'Concluída' },
            { id: 2, veiculoId: 1, tipo: 'preventiva', descricao: 'Revisão completa - troca de óleo e filtros', data: '2024-08-15', valor: 1200, status: 'Pendente', proximaRevisaoKm: 90000 }
        ],
        gastos: [
            { id: 1, veiculoId: 1, tipo: 'Combustível', data: '2026-08-12', valor: 1800, obra: 'Pátio Metálica' },
            { id: 2, veiculoId: 2, tipo: 'Combustível', data: '2026-08-13', valor: 450, obra: 'Obra' },
            { id: 3, veiculoId: 3, tipo: 'Manutenção', data: '2026-08-10', valor: 850, obra: 'Pátio Usina Conc.' },
            { id: 4, veiculoId: 1, tipo: 'Peças', data: '2026-08-05', valor: 1200, obra: 'Pátio Metálica' },
            { id: 5, veiculoId: 4, tipo: 'Combustível', data: '2026-08-14', valor: 3200, obra: 'Obra' },
            { id: 6, veiculoId: 2, tipo: 'Seguro', data: '2026-07-01', valor: 4500, obra: '' },
            { id: 7, veiculoId: 1, tipo: 'IPVA', data: '2026-01-10', valor: 2800, obra: '' },
            { id: 8, veiculoId: 3, tipo: 'Pneus', data: '2026-06-15', valor: 3500, obra: 'Pátio Usina Conc.' },
            { id: 9, veiculoId: 1, tipo: 'Pedágio', data: '2026-08-11', valor: 180, obra: '' },
            { id: 10, veiculoId: 2, tipo: 'Multas', data: '2026-07-20', valor: 350, obra: '' },
            { id: 11, veiculoId: 4, tipo: 'Serviços', data: '2026-08-01', valor: 2500, obra: 'Obra' },
            { id: 12, veiculoId: 1, tipo: 'Outros', data: '2026-08-08', valor: 250, obra: '' }
        ],
        chamados: [
            { id: 1, veiculoId: 3, titulo: 'Ruído estranho no freio dianteiro', descricao: 'Motorista relata barulho metálico ao frear', prioridade: 'Alta', status: 'Em Andamento', data: '2026-08-14', relator: 'João Silva' }
        ],
        alocacoes: [
            { id: 1, veiculoId: 4, motorista: 'Carlos Lima', origem: 'Pátio Metálica', destino: 'Obra', dataSaida: '2026-08-10', kmSaida: 5200, status: 'Ativa', criadoPor: 'Administrador' }
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
            console.warn('⚠️ window.BD não existe, criando novo...');
            inicializarBD();
            return;
        }
        localStorage.setItem(BD_CHAVE_LOCALSTORAGE, JSON.stringify(window.BD));
    } catch (e) {
        console.error('❌ Erro ao salvar dados no localStorage:', e);
    }
}

function carregarDadosLocais() {
    return new Promise((resolve) => {
        inicializarBD();
        resolve(window.BD);
    });
}

function carregarDadosDemonstracao() {
    window.BD = criarDadosDemonstracao();
    salvarDados();
    console.log('✅ Dados de demonstração carregados!');
    return window.BD;
}

// Expõe globalmente
window.BD_CHAVE_LOCALSTORAGE = BD_CHAVE_LOCALSTORAGE;
window.inicializarBD = inicializarBD;
window.salvarDados = salvarDados;
window.carregarDadosLocais = carregarDadosLocais;
window.carregarDadosDemonstracao = carregarDadosDemonstracao;

// Inicializa imediatamente
if (!window.BD) {
    inicializarBD();
}

console.log('✅ js/banco-dados.js carregado - BD inicializado');
