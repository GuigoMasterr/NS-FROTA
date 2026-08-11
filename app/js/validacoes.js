// ==================================================
// VALIDAÇÕES DO SISTEMA
// ==================================================
const Validacoes = {

  // ✅ Validar placa (padrão antigo e Mercosul)
  placaValida(placa) {
    if (!placa) return false;
    const limpa = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
    // Padrão antigo: AAA-1234 ou Mercosul: AAA1A23
    const regexAntigo = /^[A-Z]{3}[0-9]{4}$/;
    const regexMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    return regexAntigo.test(limpa) || regexMercosul.test(limpa);
  },

  // ✅ Verificar se todos campos estão preenchidos
  camposPreenchidos(campos = []) {
    return campos.every(campo => {
      if (campo === null || campo === undefined) return false;
      return campo.toString().trim() !== "";
    });
  },

  // ✅ Validar quilometragem
  kmValido(km) {
    const numero = Number(km);
    return !isNaN(numero) && numero >= 0 && Number.isInteger(numero);
  },

  // ✅ Comparar km novo não pode ser menor que o anterior
  kmSuperior(kmNova, kmAnterior) {
    const nova = Number(kmNova);
    const anterior = Number(kmAnterior);
    return !isNaN(nova) && !isNaN(anterior) && nova >= anterior;
  },

  // ✅ Validar e-mail (básico)
  emailValida(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  },

  // ✅ Validar tamanho mínimo de senha
  senhaValida(senha) {
    return typeof senha === "string" && senha.length >= 6;
  },

  // 🆕 Validar data
  dataValida(data) {
    if (!data) return false;
    const objData = new Date(data);
    return !isNaN(objData.getTime());
  },

  // 🆕 Validar valor monetário
  valorMonetarioValido(valor) {
    const numero = Number(valor);
    return !isNaN(numero) && numero >= 0;
  }
};