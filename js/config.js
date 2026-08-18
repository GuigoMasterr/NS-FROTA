// ==========================================
// ARQUIVO DE CONFIGURAÇÃO DO SISTEMA
// ==========================================

const CONFIG = {
    // Status de Veículos
    STATUS_VEICULOS: {
        ATIVO: 'Em Operação',
        MANUTENCAO: 'Em Manutenção',
        INATIVO: 'Inativo'
    },

    // Categorias de Veículos
    CATEGORIAS_VEICULOS: [
        'Caminhão',
        'Carro Passeio',
        'Utilitário',
        'Máquina',
        'Van',
        'Ônibus',
        'Moto',
        'Outro'
    ],

    // Status de Check-list
    STATUS_CHECKLIST: {
        APROVADO: 'Aprovado',
        PENDENTE: 'Pendente',
        REPROVADO: 'Reprovado'
    },

    // Tipos de Manutenção
    TIPO_MANUTENCAO: {
        PREVENTIVA: 'Preventiva',
        CORRETIVA: 'Corretiva',
        REVISAO: 'Revisão'
    },

    // Status de Manutenção
    STATUS_MANUTENCAO: {
        ABERTA: 'Aberta',
        ANDAMENTO: 'Em Andamento',
        CONCLUIDA: 'Concluída',
        CANCELADA: 'Cancelada'
    },

    // Tipos de Gastos
    TIPO_GASTOS: [
        'Abastecimento',
        'Peças',
        'Serviço',
        'IPVA',
        'Seguro',
        'Licenciamento',
        'Multa',
        'Outros'
    ],

    // Tabelas do Supabase para sincronização
    TABELAS: [
        'locais',
        'usuarios',
        'veiculos',
        'checklists',
        'manutencoes',
        'gastos',
        'chamados',
        'alocacoes',
        'adiantamentos',
        'gastosViagem',
        'documentosVeiculos'
    ],
    // Perfis de Usuário
    PERFIS: {
        ADMIN: 'admin',
        MOTORISTA: 'motorista'
    },

    // Credenciais padrão
    LOGIN: {
        ADMIN: { usuario: 'admin', senha: 'admin123', nome: 'Administrador', perfil: 'admin' },
        MOTORISTA: { usuario: 'motorista', senha: 'motorista123', nome: 'Motorista', perfil: 'motorista' }
    }
};

// ✅ Disponibiliza globalmente para o HTML
window.CONFIG = CONFIG;
window.CATEGORIAS_VEICULOS = CONFIG.CATEGORIAS_VEICULOS;
window.STATUS_VEICULOS = CONFIG.STATUS_VEICULOS;
window.STATUS_CHECKLIST = CONFIG.STATUS_CHECKLIST;
window.TIPO_MANUTENCAO = CONFIG.TIPO_MANUTENCAO;
window.STATUS_MANUTENCAO = CONFIG.STATUS_MANUTENCAO;
window.TIPO_GASTOS = CONFIG.TIPO_GASTOS;

// export default CONFIG;  // Removido: causa erro de sintaxe em script normal