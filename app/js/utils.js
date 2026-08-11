// ==================================================
// FUNÇÕES AUXILIARES / UTILITÁRIAS
// ==================================================
const Utils = {

  // ✅ Formatar valor para moeda brasileira (R$ 1.234,56)
  formatarMoeda(valor) {
    const numero = Number(valor);
    if (isNaN(numero) || numero < 0) return "R$ 0,00";
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: CONFIG.PADROES.MOEDA
    });
  },

  // ✅ Formatar data no padrão dd/mm/aaaa
  formatarData(data) {
    let dataObj;
    if (!data) {
      dataObj = new Date();
    } else {
      dataObj = new Date(data);
    }
    // ✅ Tratar datas inválidas
    if (isNaN(dataObj.getTime())) return "--/--/----";
    return dataObj.toLocaleDateString('pt-BR');
  },

  // ✅ Gerar ID único automático
  gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // ✅ Obter data e hora atual
  getDataHoraAtual() {
    return new Date().toLocaleString('pt-BR');
  },

  // ✅ Calcular diferença em dias entre duas datas
  diasEntre(dataInicial, dataFinal) {
    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);
    // ✅ Validar datas antes de calcular
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return 0;
    const diferenca = Math.abs(fim - inicio);
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  },

  // ✅ Limpar espaços e caracteres desnecessários
  limparTexto(texto) {
    if (!texto) return "";
    return texto.toString().trim().replace(/\s+/g, " ");
  },

  // 🆕 Extrair somente números de um texto
  extrairNumeros(texto) {
    if (!texto) return "";
    return texto.toString().replace(/[^0-9]/g, "");
  },

  // 🆕 Padronizar placa (maiúsculo, sem hífen)
  padronizarPlaca(placa) {
    if (!placa) return "";
    return placa.toString().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
};