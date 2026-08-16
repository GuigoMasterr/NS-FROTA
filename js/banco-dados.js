// ==================================================
// 💾 BANCO DE DADOS LOCAL
// ✅ Inclui historicoCondutores
// ==================================================

function inicializarBD() {
    try {
        var dadosSalvos = localStorage.getItem('bd_frotas');
        if (dadosSalvos) {
            window.BD = JSON.parse(dadosSalvos);
            console.log('BD carregado do localStorage');
            return;
        }
    } catch (e) {
        console.error('Erro ao carregar BD:', e);
    }
    
    // Dados padrao / demonstracao
    window.BD = {
        locais: [
            { id: 'patio-metalica', nome: 'Patio Metalica' },
            { id: 'patio-usina-conc', nome: 'Patio Usina Conc.' },
            { id: 'obra', nome: 'Obra' }
        ],
        veiculos: [
            { id: 1, placa: 'ABC1234', categoria: 'Caminhao', marca: 'Volvo', modelo: 'FH 540', ano: 2022, km_atual: 85000, obra_atual: 'Patio Metalica', status: 'disponivel', responsavel: 'Joao Silva', data_cadastro: '2024-01-15' },
            { id: 2, placa: 'DEF5678', categoria: 'Carro Passeio', marca: 'Ford', modelo: 'Ranger', ano: 2023, km_atual: 32000, obra_atual: 'Obra', status: 'disponivel', responsavel: 'Maria Santos', data_cadastro: '2024-02-20' },
            { id: 3, placa: 'GHI9012', categoria: 'Utilitario', marca: 'Toyota', modelo: 'Hilux', ano: 2021, km_atual: 120000, obra_atual: 'Patio Usina Conc.', status: 'manutencao', responsavel: 'Pedro Costa', data_cadastro: '2023-06-10' },
            { id: 4, placa: 'JKL3456', categoria: 'Maquina', marca: 'Caterpillar', modelo: 'Escavadeira 320', ano: 2020, km_atual: 5400, obra_atual: 'Obra', status: 'alocado', responsavel: 'Carlos Lima', data_cadastro: '2023-03-05' }
        ],
        checklists: [],
        manutencoes: [
            { id: 1, veiculoId: 3, tipo: 'corretiva', descricao: 'Troca de pastilhas de freio dianteiras', data: '2024-08-10', valor: 850, status: 'Concluida' },
            { id: 2, veiculoId: 1, tipo: 'preventiva', descricao: 'Revisao completa - troca de oleo e filtros', data: '2024-08-15', valor: 1200, status: 'Pendente', proximaRevisaoKm: 90000 }
        ],
        gastos: [
            { id: 1, veiculoId: 1, tipo: 'Combustivel', data: '2024-08-12', valor: 1800, obra: 'Patio Metalica' },
            { id: 2, veiculoId: 2, tipo: 'Combustivel', data: '2024-08-13', valor: 450, obra: 'Obra' },
            { id: 3, veiculoId: 3, tipo: 'Manutencao', data: '2024-08-10', valor: 850, obra: 'Patio Usina Conc.' },
            { id: 4, veiculoId: 1, tipo: 'Pecas', data: '2024-08-05', valor: 1200, obra: 'Patio Metalica' },
            { id: 5, veiculoId: 4, tipo: 'Combustivel', data: '2024-08-14', valor: 3200, obra: 'Obra' },
            { id: 6, veiculoId: 2, tipo: 'Seguro', data: '2024-07-01', valor: 4500, obra: '' },
            { id: 7, veiculoId: 1, tipo: 'IPVA', data: '2024-01-10', valor: 2800, obra: '' },
            { id: 8, veiculoId: 3, tipo: 'Pneus', data: '2024-06-15', valor: 3500, obra: 'Patio Usina Conc.' },
            { id: 9, veiculoId: 1, tipo: 'Pedagio', data: '2024-08-11', valor: 180, obra: '' },
            { id: 10, veiculoId: 2, tipo: 'Multas', data: '2024-07-20', valor: 350, obra: '' },
            { id: 11, veiculoId: 4, tipo: 'Servicos', data: '2024-08-01', valor: 2500, obra: 'Obra' },
            { id: 12, veiculoId: 1, tipo: 'Outros', data: '2024-08-08', valor: 250, obra: '' }
        ],
        chamados: [
            { id: 1, veiculoId: 3, titulo: 'Ruido estranho no freio dianteiro', descricao: 'Motorista relata barulho metálico ao frear', prioridade: 'Alta', status: 'Em Andamento', data: '2024-08-14', relator: 'Joao Silva' }
        ],
        adiantamentos: [],
        despesasViagem: [],
        alocacoes: [
            { id: 1, veiculoId: 4, motorista: 'Carlos Lima', origem: 'Patio Metalica', destino: 'Obra', dataSaida: '2024-08-10', kmSaida: 5200, status: 'Ativa', criadoPor: 'Administrador' }
        ],
        usuarios: [
            { nome: 'Administrador', usuario: 'admin', senha: 'admin123', perfil: 'admin', ativo: true },
            { nome: 'Operador', usuario: 'operador', senha: '1234', perfil: 'operacional', ativo: true },
            { nome: 'Joao Silva', usuario: 'joao', senha: '1234', perfil: 'motorista', ativo: true },
            { nome: 'Maria Santos', usuario: 'maria', senha: '1234', perfil: 'motorista', ativo: true }
        ],
        historicoCondutores: [],
        solicitacoesTransferencia: [],
        origens: ['Patio Metalica', 'Patio Usina Conc.', 'Obra'],
        destinos: ['Patio Metalica', 'Patio Usina Conc.', 'Obra'],
        obras: ['Patio Metalica', 'Patio Usina Conc.', 'Obra'],
        config: {},
        log: []
    };
    
    salvarDados();
    console.log('BD inicializado com dados de demonstracao');
}

function salvarDados() {
    try {
        localStorage.setItem('bd_frotas', JSON.stringify(window.BD));
    } catch (e) {
        console.error('Erro ao salvar dados:', e);
    }
}

window.inicializarBD = inicializarBD;
window.salvarDados = salvarDados;