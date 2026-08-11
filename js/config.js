// ==================================================
// CONFIGURAÇÕES DO SISTEMA DE GESTÃO DE FROTAS
// ==================================================
const CONFIG = {
  // Dados gerais
  NOME_SISTEMA: "Gestão de Frotas",
  VERSAO_SISTEMA: "2.1",
  
  getDataAtual: () => new Date().toLocaleDateString('pt-BR'),

  // Chaves que serão usadas no LocalStorage (SEM ACENTO!)
  CHAVES: {
    USUARIOS: "gf_usuarios",
    VEICULOS: "gf_veiculos",
    MANUTENCAO: "gf_manutencao",
    GASTOS: "gf_gastos",
    CHECKLIST: "gf_checklist",
    CHAMADOS: "gf_chamados",
    ALOCACOES: "gf_alocacoes",
    SESSAO: "gf_sessao"
  },

  // Padrões de formatação
  PADROES: {
    MOEDA: "BRL",
    IDIOMA: "pt-BR",
    FORMATO_DATA: "dd/mm/aaaa",
    SEPARADOR_DATA: "/"
  },

  // Status padrão do sistema
  STATUS: {
    VEICULO: {
      ATIVO: "Em Operação",
      MANUTENCAO: "Em Manutenção",
      INATIVO: "Inativo"
    },
    MANUTENCAO: {
      ABERTA: "Aberta",
      ANDAMENTO: "Em Andamento",
      CONCLUIDA: "Concluída"
    },
    TIPO_MANUTENCAO: {
      PREVENTIVA: "Preventiva",
      CORRETIVA: "Corretiva",
      REVISAO: "Revisão"
    },
    CHAMADO: {
      ABERTO: "Aberto",
      RESOLVIDO: "Resolvido"
    },
    CHECKLIST: {
      APROVADO: "Aprovado",
      PENDENTE: "Pendente",
      CONFORME: "Conforme",
      NAO_CONFORME: "Não Conforme"
    },
    GASTO: {
      ABASTECIMENTO: "Abastecimento",
      PECAS: "Peças",
      SERVICO: "Serviço",
      OUTROS: "Outros"
    }
  }
};